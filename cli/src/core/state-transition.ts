import { canonicalStateArtifactRelativePath, stateArtifactPath } from './project.js'
import { readJsonSafe, writeJsonAtomic } from './fs.js'
import {
  assertTransition,
  normalizeDevViewState,
  stateMachineIssues,
  type DevViewState,
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
  activeRevision?: Record<string, unknown> | null
  revisionHistoryEntry?: Record<string, unknown>
  actor?: string
  data?: Record<string, unknown>
}

export interface PreparedDevViewStateTransition {
  statePath: string
  state: Record<string, unknown>
  result: CommandResult
}

export async function transitionDevViewState(
  root: string,
  command: string,
  targets: DevViewState[],
  update: StateTransitionUpdate,
): Promise<CommandResult> {
  const prepared = await prepareDevViewStateTransition(root, command, targets, update)
  if (!prepared.ok) {
    return prepared.result
  }

  await writeJsonAtomic(prepared.statePath, prepared.state)
  return prepared.result
}

export async function prepareDevViewStateTransition(
  root: string,
  command: string,
  targets: DevViewState[],
  update: StateTransitionUpdate,
): Promise<
  | { ok: true; statePath: string; state: Record<string, unknown>; result: CommandResult }
  | { ok: false; result: CommandResult }
> {
  const statePath = stateArtifactPath(root)
  const parsed = await readJsonSafe<Record<string, unknown>>(statePath)
  if (!parsed.ok) {
    return {
      ok: false,
      result: {
        ok: false,
        command,
        exitCode: ExitCode.SchemaError,
        message: `${command} failed. devview-state.json was not changed.`,
        issues: [
          issue({
            validator: 'StateTransition',
            code: 'DEVVIEW_STATE_INVALID_JSON',
            severity: 'error',
            file: canonicalStateArtifactRelativePath(root),
            message: parsed.error,
            suggestedFix: 'Fix devview-state.json before running state transition commands.',
          }),
        ],
      },
    }
  }

  const state = parsed.value
  const autoflow =
    typeof state.autoflow === 'object' && state.autoflow !== null ? (state.autoflow as Record<string, unknown>) : {}
  const current = normalizeDevViewState(autoflow.state)
  if (!current) {
    return {
      ok: false,
      result: {
        ok: false,
        command,
        exitCode: ExitCode.TransitionBlocked,
        message: `${command} failed. devview-state.json was not changed.`,
        issues: [
          issue({
            validator: 'StateTransition',
            code: 'UNKNOWN_STATE',
            severity: 'error',
            file: canonicalStateArtifactRelativePath(root),
            message: `Cannot transition from unknown state: ${String(autoflow.state || '<missing>')}.`,
            suggestedFix: 'Repair autoflow.state to a canonical DevView state.',
          }),
        ],
      },
    }
  }

  const existingStateIssues = stateMachineIssues(state)
  if (hasErrors(existingStateIssues)) {
    return {
      ok: false,
      result: {
        ok: false,
        command,
        exitCode: ExitCode.TransitionBlocked,
        message: `${command} failed. devview-state.json was not changed.`,
        issues: existingStateIssues,
      },
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
          file: canonicalStateArtifactRelativePath(root),
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
      result: {
        ok: false,
        command,
        exitCode: ExitCode.TransitionBlocked,
        message: `${command} failed. devview-state.json was not changed.`,
        issues: transitionIssues,
      },
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
  if (update.activeRevision !== undefined) {
    if (update.activeRevision === null) {
      delete state.activeRevision
    } else {
      state.activeRevision = update.activeRevision
    }
  }
  if (update.revisionHistoryEntry) {
    state.revisionHistory = [
      ...(Array.isArray(state.revisionHistory)
        ? state.revisionHistory.filter((entry) => typeof entry === 'object' && entry !== null)
        : []),
      update.revisionHistoryEntry,
    ]
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

  return {
    ok: true,
    statePath,
    state,
    result: {
      ok: true,
      command,
      exitCode: ExitCode.Success,
      message:
        appended.length === 0
          ? `${command} passed. State was already ${cursor}.`
          : `${command} transitioned DevView state to ${cursor}.`,
      issues: [],
      data: {
        state: cursor,
        previousState: current,
        transitionCount: appended.length,
        currentGate: autoflow.currentGate,
        nextStep: autoflow.nextStep,
        ...update.data,
      },
    },
  }
}

export async function checkpointDevViewState(
  root: string,
  command: string,
  allowedStates: DevViewState[],
  update: StateTransitionUpdate,
): Promise<CommandResult> {
  const statePath = stateArtifactPath(root)
  const parsed = await readJsonSafe<Record<string, unknown>>(statePath)
  if (!parsed.ok) {
    return {
      ok: false,
      command,
      exitCode: ExitCode.SchemaError,
      message: `${command} failed. devview-state.json was not changed.`,
      issues: [
        issue({
          validator: 'StateCheckpoint',
          code: 'DEVVIEW_STATE_INVALID_JSON',
          severity: 'error',
          file: canonicalStateArtifactRelativePath(root),
          message: parsed.error,
          suggestedFix: 'Fix devview-state.json before running checkpoint commands.',
        }),
      ],
    }
  }

  const state = parsed.value
  const autoflow =
    typeof state.autoflow === 'object' && state.autoflow !== null ? (state.autoflow as Record<string, unknown>) : {}
  const current = normalizeDevViewState(autoflow.state)
  if (!current) {
    return {
      ok: false,
      command,
      exitCode: ExitCode.TransitionBlocked,
      message: `${command} failed. devview-state.json was not changed.`,
      issues: [
        issue({
          validator: 'StateCheckpoint',
          code: 'UNKNOWN_STATE',
          severity: 'error',
          file: canonicalStateArtifactRelativePath(root),
          message: `Cannot update checkpoint from unknown state: ${String(autoflow.state || '<missing>')}.`,
          suggestedFix: 'Repair autoflow.state to a canonical DevView state.',
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
      message: `${command} failed. devview-state.json was not changed.`,
      issues: existingStateIssues,
    }
  }

  if (!allowedStates.includes(current)) {
    return {
      ok: false,
      command,
      exitCode: ExitCode.TransitionBlocked,
      message: `${command} failed. devview-state.json was not changed.`,
      issues: [
        issue({
          validator: 'StateCheckpoint',
          code: 'CHECKPOINT_STATE_BLOCKED',
          severity: 'error',
          file: canonicalStateArtifactRelativePath(root),
          message: `${command} can run only from ${allowedStates.join(', ')}. Current state is ${current}.`,
          suggestedFix: 'Complete the previous DevView state transition before updating this checkpoint.',
        }),
      ],
    }
  }

  const now = new Date().toISOString()
  if (update.stage) {
    state.stage = update.stage
  }
  if (update.mode) {
    state.mode = update.mode
  }
  if (update.deliveryStatus) {
    state.deliveryStatus = update.deliveryStatus
  }

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
    message: `${command} completed. State remains ${current}.`,
    issues: [],
    data: {
      state: current,
      transitionCount: 0,
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
