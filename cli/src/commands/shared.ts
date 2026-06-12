import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { artifactPath, defaultArtifacts, type ArtifactKey } from '../core/project.js'
import { readJsonSafe, relativePath } from '../core/fs.js'
import { normalizePbeState, PBE_STATE, pbeStates, type PbeState } from '../core/state-machine.js'
import type { CliEnvironment, CliOptions, CommandResult, ValidationIssue } from '../core/types.js'
import { ExitCode, hasErrors, issue } from '../core/types.js'

export interface CommandContext {
  options: CliOptions
  env: Required<CliEnvironment>
}

export function checkResult(command: string, issues: ValidationIssue[]): CommandResult {
  return {
    ok: !hasErrors(issues),
    command,
    exitCode: hasErrors(issues) ? ExitCode.ValidationFailed : ExitCode.Success,
    message: hasErrors(issues) ? `${command} failed.` : `${command} passed.`,
    issues,
  }
}

export function invalidCommand(message: string): CommandResult {
  return {
    ok: false,
    command: 'unknown',
    exitCode: ExitCode.InvalidArguments,
    message,
    issues: [
      issue({
        validator: 'CLI',
        code: 'INVALID_COMMAND',
        severity: 'error',
        message,
        suggestedFix: 'Run `pbe --help` to see supported commands.',
      }),
    ],
  }
}

export function transitionFailed(command: string, message: string, issues: ValidationIssue[]): CommandResult {
  return {
    ok: false,
    command,
    exitCode: ExitCode.ValidationFailed,
    message,
    issues,
  }
}

export function transitionBlocked(command: string, message: string, issues: ValidationIssue[]): CommandResult {
  return {
    ok: false,
    command,
    exitCode: ExitCode.TransitionBlocked,
    message,
    issues,
  }
}

export function runNodeScript(scriptPath: string, cwd: string): { ok: boolean; output: string } {
  try {
    const stdout = execFileSync(process.execPath, [scriptPath], {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
    })
    return { ok: true, output: stdout.trim() }
  } catch (error) {
    const maybeError = error as { stdout?: string | Buffer; stderr?: string | Buffer; message?: string }
    const output = [maybeError.stdout, maybeError.stderr]
      .filter(Boolean)
      .map((entry) => (Buffer.isBuffer(entry) ? entry.toString('utf8') : String(entry)))
      .join('\n')
      .trim()
    return { ok: false, output: output || maybeError.message || String(error) }
  }
}

export async function loadState(root: string): Promise<Record<string, unknown> | null> {
  const parsed = await readJsonSafe<Record<string, unknown>>(artifactPath(root, 'pbeState'))
  return parsed.ok ? parsed.value : null
}

export function implementationScopeIssues(state: Record<string, unknown> | null): ValidationIssue[] {
  const autoflow =
    typeof state?.autoflow === 'object' && state.autoflow !== null ? (state.autoflow as Record<string, unknown>) : {}
  const rawStateValue = String(autoflow.state || '')
  const stateValue = normalizePbeState(rawStateValue)
  if (stateValue && statesFrom(PBE_STATE.SCOPE_SELECTED).includes(stateValue)) {
    return []
  }
  return [
    issue({
      validator: 'Gate',
      code: 'IMPLEMENTATION_SCOPE_UNCONFIRMED',
      severity: 'error',
      file: defaultArtifacts.pbeState,
      message: `Implementation scope is not confirmed. Current state: ${rawStateValue || 'unknown'}.`,
      suggestedFix: 'Stop at the implementation scope gate and ask the user to select the current slice scope.',
    }),
  ]
}

export function preAcepCheckpointIssues(state: Record<string, unknown> | null): ValidationIssue[] {
  return requiredCompletedStepIssues(state, [
    'dependency_impact_audit',
    'plan_execution',
    'coverage_audit',
    'ux_audit',
  ]).map((entry) => ({
    ...entry,
    message: `ACEP cannot be marked ready before the checkpoint is complete. ${entry.message}`,
    suggestedFix:
      'Run `pbe dependency audit complete`, `pbe plan execution complete`, `pbe coverage audit complete`, and `pbe ux audit complete` in order before `pbe acep ready`.',
  }))
}

export function requiredCompletedStepIssues(
  state: Record<string, unknown> | null,
  requiredSteps: string[],
): ValidationIssue[] {
  const autoflow =
    typeof state?.autoflow === 'object' && state.autoflow !== null ? (state.autoflow as Record<string, unknown>) : {}
  const completedSteps = new Set(Array.isArray(autoflow.completedSteps) ? autoflow.completedSteps.map(String) : [])
  return requiredSteps
    .filter((step) => !completedSteps.has(step))
    .map((step) =>
      issue({
        validator: 'Checkpoint',
        code: 'CHECKPOINT_STEP_MISSING',
        severity: 'error',
        file: defaultArtifacts.pbeState,
        nodeId: step,
        message: `Required checkpoint step is missing from autoflow.completedSteps: ${step}.`,
        suggestedFix: `Run the PBE CLI checkpoint command that records ${step}.`,
      }),
    )
}

export function requiredArtifactIssues(root: string, artifacts: Array<[ArtifactKey, string]>): ValidationIssue[] {
  return artifacts
    .filter(([key]) => !existsSync(artifactPath(root, key)))
    .map(([key, label]) =>
      issue({
        validator: 'Checkpoint',
        code: 'CHECKPOINT_ARTIFACT_MISSING',
        severity: 'error',
        file: defaultArtifacts[key],
        message: `${label} is required before this checkpoint can complete.`,
        suggestedFix: `Create ${defaultArtifacts[key]} before rerunning the checkpoint command.`,
      }),
    )
}

export function uiUxApprovalIssues(root: string, state: Record<string, unknown> | null): ValidationIssue[] {
  if (!hasUiWork(root)) {
    return []
  }
  const autoflow =
    typeof state?.autoflow === 'object' && state.autoflow !== null ? (state.autoflow as Record<string, unknown>) : {}
  const rawState = String(autoflow.state || '')
  const currentState = normalizePbeState(rawState)
  const statesAfterApproval = statesFrom(PBE_STATE.UI_UX_APPROVED)
  if (currentState && statesAfterApproval.includes(currentState)) {
    return []
  }
  return [
    issue({
      validator: 'Gate',
      code: 'UI_UX_CONFIRM_REQUIRED',
      severity: 'error',
      file: defaultArtifacts.pbeState,
      message: `UI/UX work cannot enter WPD before UI_UX_APPROVED. Current state: ${rawState || 'unknown'}.`,
      suggestedFix: 'Stop at the UI/UX confirmation gate, get user approval, then continue to Visual Contract or WPD.',
    }),
  ]
}

export function uiUxConfirmationArtifactIssues(root: string): ValidationIssue[] {
  if (!hasUiWork(root)) {
    return []
  }
  const confirmationPath = artifactPath(root, 'uiUxConfirmation')
  if (!existsSync(confirmationPath)) {
    return [
      issue({
        validator: 'Gate',
        code: 'UI_UX_CONFIRMATION_MISSING',
        severity: 'error',
        file: defaultArtifacts.uiUxConfirmation,
        message: 'UI/UX approval requires a confirmation artifact before the state can advance.',
        suggestedFix:
          'Create .pbe/blueprint/ui-ux-confirmation.md from the user-approved preview, then rerun `pbe ui approve`.',
      }),
    ]
  }
  const content = readFileSync(confirmationPath, 'utf8')
  if (/\b(revision_requested|blocked|preview_needed|preview_generated)\b/i.test(content)) {
    return [
      issue({
        validator: 'Gate',
        code: 'UI_UX_CONFIRMATION_NOT_APPROVED',
        severity: 'error',
        file: defaultArtifacts.uiUxConfirmation,
        message: 'UI/UX confirmation artifact still contains a non-approved status.',
        suggestedFix:
          'Resolve UI/UX revision or blocker items and record the user-approved direction before rerunning `pbe ui approve`.',
      }),
    ]
  }
  if (/Pending user confirmation/i.test(content)) {
    return [
      issue({
        validator: 'Gate',
        code: 'UI_UX_CONFIRMATION_PENDING',
        severity: 'error',
        file: defaultArtifacts.uiUxConfirmation,
        message: 'UI/UX confirmation artifact still says user confirmation is pending.',
        suggestedFix: 'Record the explicit user approval and confirmed direction before rerunning `pbe ui approve`.',
      }),
    ]
  }
  return []
}

export async function hasUserAcceptedBranch(root: string): Promise<boolean> {
  const parsed = await readJsonSafe<Record<string, unknown>>(artifactPath(root, 'acceptanceTree'))
  if (!parsed.ok || !Array.isArray(parsed.value.branches)) {
    return false
  }
  return parsed.value.branches.some(
    (branch) =>
      typeof branch === 'object' &&
      branch !== null &&
      (branch as Record<string, unknown>).status === 'accepted_done' &&
      ((branch as Record<string, unknown>).decisionSource as Record<string, unknown> | undefined)?.actor === 'user',
  )
}

export function hasUiWork(root: string): boolean {
  const productPath = artifactPath(root, 'productTree')
  if (!existsSync(productPath)) {
    return false
  }
  try {
    const product = JSON.parse(readFileSync(productPath, 'utf8')) as Record<string, unknown>
    const nodes = Array.isArray(product.nodes) ? product.nodes : []
    return nodes.some((node) => {
      if (typeof node !== 'object' || node === null) {
        return false
      }
      const entry = node as Record<string, unknown>
      return String(entry.type || '').startsWith('ui_') || typeof entry.ux === 'object'
    })
  } catch {
    return false
  }
}

export function hasVisualWork(root: string): boolean {
  const productPath = artifactPath(root, 'productTree')
  if (existsSync(productPath)) {
    try {
      const product = JSON.parse(readFileSync(productPath, 'utf8')) as Record<string, unknown>
      const nodes = Array.isArray(product.nodes) ? product.nodes : []
      if (
        nodes.some((node) => {
          if (typeof node !== 'object' || node === null) {
            return false
          }
          const entry = node as Record<string, unknown>
          const scopeClass = String(entry.scopeClass || '')
          const ux = typeof entry.ux === 'object' && entry.ux !== null ? (entry.ux as Record<string, unknown>) : {}
          return (
            ['selected', 'foundation'].includes(scopeClass) &&
            (entry.visualImpact === true || ux.visualAffected === true || ux.visualWorkRequired === true)
          )
        })
      ) {
        return true
      }
    } catch {
      return false
    }
  }

  const visualReferencePath = artifactPath(root, 'visualReference')
  if (!existsSync(visualReferencePath)) {
    return false
  }
  try {
    const visualReference = JSON.parse(readFileSync(visualReferencePath, 'utf8')) as Record<string, unknown>
    return (
      visualReference.visualWorkRequired === true &&
      !['not_required', 'visual_quality_waived'].includes(String(visualReference.primarySource || ''))
    )
  } catch {
    return false
  }
}

export function summarizeCreated(root: string, files: string[]): string[] {
  return files.map((file) => relativePath(root, path.join(root, file)))
}

export function statesFrom(state: PbeState): PbeState[] {
  const progressStates = pbeStates.filter((candidate) => !['BLOCKED', 'REVISION_REQUESTED'].includes(candidate))
  const index = progressStates.indexOf(state)
  return index === -1 ? [] : [...progressStates.slice(index)]
}
