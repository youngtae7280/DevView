import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  assessHumanGateClarity,
  humanGateTransitions,
  isHumanGateTransition,
  type HumanGateAssessment,
} from '../core/human-gate-assessment.js'
import { defaultArtifacts, loadProject } from '../core/project.js'
import { normalizePbeState, PBE_STATE, type PbeState } from '../core/state-machine.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { ExitCode, hasErrors, issue } from '../core/types.js'
import {
  validateAcceptedActors,
  validateAcep,
  validateEvidence,
  validateRpd,
  validateTraceability,
  validateVd,
  validateVisualDesign,
  validateWpd,
} from '../validators/pbe-validators.js'
import {
  type CommandContext,
  hasUserAcceptedBranch,
  implementationScopeIssues,
  invalidCommand,
  loadState,
  statesFrom,
  uiUxApprovalIssues,
} from './shared.js'

export async function gateAssessCommand(context: CommandContext): Promise<CommandResult> {
  const text = context.options.text?.trim()
  const transition = context.options.transition || 'product-to-work'
  if (!text) {
    return {
      ok: false,
      command: 'gate assess',
      exitCode: ExitCode.InvalidArguments,
      message: 'Missing required option: --text.',
      issues: [
        issue({
          validator: 'CLI',
          code: 'HUMAN_GATE_TEXT_REQUIRED',
          severity: 'error',
          message: 'Missing required option: --text.',
          suggestedFix: 'Run `pbe gate assess --text "..."` with the decision or assumption to assess.',
        }),
      ],
    }
  }
  if (!isHumanGateTransition(transition)) {
    return {
      ok: false,
      command: 'gate assess',
      exitCode: ExitCode.InvalidArguments,
      message: `Unsupported Human Gate transition: ${transition}.`,
      issues: [
        issue({
          validator: 'CLI',
          code: 'HUMAN_GATE_TRANSITION_UNSUPPORTED',
          severity: 'error',
          message: `Unsupported Human Gate transition: ${transition}.`,
          suggestedFix: `Use one of: ${humanGateTransitions.join(', ')}.`,
        }),
      ],
    }
  }

  const assessment = assessHumanGateClarity({
    text,
    transition,
    profile: context.options.profile,
  })

  return {
    ok: true,
    command: 'gate assess',
    exitCode: ExitCode.Success,
    message: formatHumanGateAssessment(assessment),
    issues: [],
    data: { ...assessment },
  }
}

export async function gateCommand(stage: string | undefined, context: CommandContext): Promise<CommandResult> {
  const canonicalStage = normalizeGateStage(stage)
  if (!canonicalStage) {
    return invalidCommand(`Unsupported gate stage: ${stage || '<missing>'}`)
  }

  const loadedProject = await loadProject(context.options.root)
  const projectIssues = loadedProject.issues
  const issues: ValidationIssue[] = [...projectIssues]
  if (!existsSync(path.join(context.options.root, '.pbe'))) {
    issues.push(
      issue({
        validator: 'Gate',
        code: 'PBE_NOT_INITIALIZED',
        severity: 'error',
        message: 'PBE project is not initialized.',
        suggestedFix: 'Run `pbe init` before entering PBE stages.',
      }),
    )
  }
  issues.push(...stageStateIssues(canonicalStage, loadedProject.project.state))

  if (canonicalStage === 'wpd') {
    issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
    issues.push(...uiUxApprovalIssues(context.options.root, loadedProject.project.state))
    issues.push(...(await validateVisualDesign(context.options.root, { requireInventory: false })))
  } else if (canonicalStage === 'vd') {
    issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
    issues.push(...(await validateWpd(context.options.root)))
    issues.push(...(await validateVisualDesign(context.options.root)))
    issues.push(...(await validateTraceability(context.options.root, { stage: 'vd' })))
  } else if (canonicalStage === 'acep') {
    issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
    issues.push(...(await validateVd(context.options.root)))
    issues.push(...(await validateVisualDesign(context.options.root)))
  } else if (canonicalStage === 'code-start') {
    issues.push(...(await validateAcep(context.options.root)))
    issues.push(...implementationScopeIssues(await loadState(context.options.root)))
  } else if (canonicalStage === 'review-result') {
    issues.push(...(await validateTraceability(context.options.root, { stage: 'review' })))
    issues.push(...(await validateEvidence(context.options.root, { stage: 'review' })))
    issues.push(...(await validateVisualDesign(context.options.root, { requireEvidence: true })))
  } else if (canonicalStage === 'accept') {
    issues.push(...(await validateAcceptedActors(context.options.root)))
    issues.push(...(await validateTraceability(context.options.root, { stage: 'accept' })))
    issues.push(...(await validateEvidence(context.options.root, { stage: 'accept' })))
    if (!(await hasUserAcceptedBranch(context.options.root))) {
      issues.push(
        issue({
          validator: 'Gate',
          code: 'USER_APPROVAL_REQUIRED',
          severity: 'error',
          file: defaultArtifacts.acceptanceTree,
          message: 'Accept gate requires explicit user approval in Acceptance Tree.',
          suggestedFix: 'Ask the user to approve the result, then record decisionSource.actor = "user".',
        }),
      )
    }
  }

  return {
    ok: !hasErrors(issues),
    command: `gate ${canonicalStage}`,
    exitCode: hasErrors(issues) ? ExitCode.TransitionBlocked : ExitCode.Success,
    message: hasErrors(issues) ? `Cannot enter ${canonicalStage}.` : `Gate ${canonicalStage} passed.`,
    issues,
  }
}

function formatHumanGateAssessment(assessment: HumanGateAssessment): string {
  const dimensions = assessment.clarity.dimensions
  const lines = [
    'Human Gate Assessment',
    '',
    `Transition: ${assessment.transition}`,
    `Profile: ${assessment.profile}`,
    `Clarity: ${assessment.clarity.score.toFixed(2)} ${assessment.clarity.level}`,
    `Requires Human Gate: ${assessment.requiresHumanGate ? 'yes' : 'no'}`,
    '',
    'Dimension scores:',
    `- intent: ${dimensions.intent}`,
    `- scope: ${dimensions.scope}`,
    `- testability: ${dimensions.testability}`,
    `- implementationSpecificity: ${dimensions.implementationSpecificity}`,
    `- evidenceFit: ${dimensions.evidenceFit}`,
    `- riskReversibility: ${dimensions.riskReversibility}`,
    '',
    'Hard triggers:',
    ...formatHumanGateList(assessment.hardTriggers),
    '',
    'Reasons:',
    ...formatHumanGateList(assessment.reasons),
  ]

  if (assessment.recommendedQuestion) {
    lines.push('', 'Recommended question:', assessment.recommendedQuestion)
  } else {
    lines.push('', 'No Human Gate required.')
  }

  return lines.join('\n')
}

function formatHumanGateList(values: string[]): string[] {
  return values.length > 0 ? values.map((value) => `- ${value}`) : ['- none']
}

function stageStateIssues(stage: string, state: Record<string, unknown> | null): ValidationIssue[] {
  if (stage === 'rpd') {
    return []
  }
  const autoflow =
    typeof state?.autoflow === 'object' && state.autoflow !== null ? (state.autoflow as Record<string, unknown>) : {}
  const rawState = String(autoflow.state || '')
  const currentState = normalizePbeState(rawState)
  const allowedByStage: Record<string, PbeState[]> = {
    wpd: [PBE_STATE.RPD_DONE, ...statesFrom(PBE_STATE.UI_UX_APPROVED)],
    vd: statesFrom(PBE_STATE.WPD_DONE),
    acep: statesFrom(PBE_STATE.VD_DONE),
    'code-start': statesFrom(PBE_STATE.SCOPE_SELECTED),
    'review-result': statesFrom(PBE_STATE.ACEP_RUN_DONE),
    accept: statesFrom(PBE_STATE.WAITING_REVIEW_RESULT),
  }
  if (currentState && allowedByStage[stage]?.includes(currentState)) {
    return []
  }
  return [
    issue({
      validator: 'Gate',
      code: 'GATE_BLOCKED',
      severity: 'error',
      file: defaultArtifacts.pbeState,
      message: `Gate ${stage} is blocked from current state ${rawState || 'unknown'}.`,
      suggestedFix: 'Run the previous required PBE close/check command instead of skipping stages.',
    }),
  ]
}

function normalizeGateStage(stage: string | undefined): string | null {
  const aliases: Record<string, string> = {
    'review-submit': 'review-result',
    review: 'review-result',
    'implementation-start': 'code-start',
    implementation: 'code-start',
  }
  if (!stage) {
    return null
  }
  const normalized = aliases[stage] || stage
  return ['rpd', 'wpd', 'vd', 'acep', 'code-start', 'review-result', 'accept'].includes(normalized) ? normalized : null
}
