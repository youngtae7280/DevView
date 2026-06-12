import { artifactPath, defaultArtifacts } from './project.js'
import { readJsonSafe, writeJsonAtomic } from './fs.js'
import {
  assertTransition,
  normalizePbeState,
  stateMachineIssues,
  type PbeState,
  type StateHistoryEntry,
} from './state-machine.js'
import type { CommandResult, ValidationIssue } from './types.js'
import { ExitCode, hasErrors, issue } from './types.js'

export interface StateTransitionUpdate {
  completedSteps?: string[]
  stage?: string
  mode?: string
  currentGate?: string | null
  nextStep?: string | null
  deliveryStatus?: string
  lastUserAction?: unknown
  acceptance?: Record<string, unknown>
  actor?: string
  data?: Record<string, unknown>
}

export async function transitionPbeState(
  root: string,
  command: string,
  targets: PbeState[],
  update: StateTransitionUpdate,
): Promise<CommandResult> {
  const statePath = artifactPath(root, 'pbeState')
  const parsed = await readJsonSafe<Record<string, unknown>>(statePath)
  if (!parsed.ok) {
    return {
      ok: false,
      command,
      exitCode: ExitCode.SchemaError,
      message: `${command} failed. pbe-state.json was not changed.`,
      issues: [
        issue({
          validator: 'StateTransition',
          code: 'PBE_STATE_INVALID_JSON',
          severity: 'error',
          file: defaultArtifacts.pbeState,
          message: parsed.error,
          suggestedFix: 'Fix pbe-state.json before running state transition commands.',
        }),
      ],
    }
  }

  const state = parsed.value
  const autoflow =
    typeof state.autoflow === 'object' && state.autoflow !== null ? (state.autoflow as Record<string, unknown>) : {}
  const current = normalizePbeState(autoflow.state)
  if (!current) {
    return {
      ok: false,
      command,
      exitCode: ExitCode.TransitionBlocked,
      message: `${command} failed. pbe-state.json was not changed.`,
      issues: [
        issue({
          validator: 'StateTransition',
          code: 'UNKNOWN_STATE',
          severity: 'error',
          file: defaultArtifacts.pbeState,
          message: `Cannot transition from unknown state: ${String(autoflow.state || '<missing>')}.`,
          suggestedFix: 'Repair autoflow.state to a canonical state or known migration alias.',
        }),
      ],
    }
  }

  const existingStateIssues = stateMachineIssues(state)
  if (hasErrors(existingStateIssues)) {
    return {
      ok: false,
      command,
      exitCode: ExitCode.TransitionBlocked,
      message: `${command} failed. pbe-state.json was not changed.`,
      issues: existingStateIssues,
    }
  }

  const now = new Date().toISOString()
  const history = Array.isArray(autoflow.stateHistory)
    ? autoflow.stateHistory.filter((entry): entry is StateHistoryEntry => typeof entry === 'object' && entry !== null)
    : []

  let cursor = current
  const appended: StateHistoryEntry[] = []
  const transitionIssues: ValidationIssue[] = []
  const finalTarget = targets[targets.length - 1]
  const requestedTargets = finalTarget && current === finalTarget ? [finalTarget] : targets
  for (const target of requestedTargets) {
    if (cursor === target) {
      continue
    }
    const issues = assertTransition(cursor, target)
    if (hasErrors(issues)) {
      transitionIssues.push(
        ...issues.map((entry) => ({
          ...entry,
          file: defaultArtifacts.pbeState,
          message: `${entry.message} Current state is ${cursor}; ${command} requested ${target}.`,
        })),
      )
      break
    }
    const historyEntry: StateHistoryEntry = {
      from: cursor,
      to: target,
      command,
      at: now,
    }
    if (update.actor) {
      historyEntry.actor = update.actor
    }
    appended.push(historyEntry)
    cursor = target
  }

  if (hasErrors(transitionIssues)) {
    return {
      ok: false,
      command,
      exitCode: ExitCode.TransitionBlocked,
      message: `${command} failed. pbe-state.json was not changed.`,
      issues: transitionIssues,
    }
  }

  if (update.stage) {
    state.stage = update.stage
  }
  if (update.mode) {
    state.mode = update.mode
  }
  if (update.deliveryStatus) {
    state.deliveryStatus = update.deliveryStatus
  }
  if (update.acceptance) {
    state.acceptance = update.acceptance
  }

  autoflow.state = cursor
  autoflow.stateHistory = [...history, ...appended]
  autoflow.completedSteps = mergeSteps(autoflow.completedSteps, update.completedSteps || [])
  autoflow.currentGate = update.currentGate ?? null
  autoflow.nextStep = update.nextStep ?? null
  autoflow.lastFailure = null
  if (update.lastUserAction !== undefined) {
    autoflow.lastUserAction = update.lastUserAction
  }
  state.autoflow = autoflow
  state.updatedAt = now

  await writeJsonAtomic(statePath, state)

  return {
    ok: true,
    command,
    exitCode: ExitCode.Success,
    message:
      appended.length === 0
        ? `${command} passed. State was already ${cursor}.`
        : `${command} transitioned PBE state to ${cursor}.`,
    issues: [],
    data: {
      state: cursor,
      previousState: current,
      transitionCount: appended.length,
      currentGate: autoflow.currentGate,
      nextStep: autoflow.nextStep,
      ...update.data,
    },
  }
}

function mergeSteps(existing: unknown, additions: string[]): string[] {
  const steps = new Set(Array.isArray(existing) ? existing.map(String) : [])
  for (const addition of additions) {
    steps.add(addition)
  }
  return [...steps]
}
