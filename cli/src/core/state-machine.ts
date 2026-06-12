import type { ValidationIssue } from './types.js'
import { issue } from './types.js'

export const pbeStates = [
  'INIT',
  'RPD_DONE',
  'WAITING_UI_UX_CONFIRM',
  'UI_UX_APPROVED',
  'VISUAL_CONTRACT_READY',
  'WPD_DONE',
  'UI_SURFACE_INVENTORY_DONE',
  'VD_DONE',
  'WAITING_IMPLEMENTATION_SCOPE',
  'SCOPE_SELECTED',
  'ACEP_READY',
  'ACEP_RUN_DONE',
  'VISUAL_AUDIT_DONE',
  'WAITING_REVIEW_RESULT',
  'DONE',
] as const

export type PbeState = (typeof pbeStates)[number]

export const PBE_STATE: { [State in PbeState]: State } = {
  INIT: 'INIT',
  RPD_DONE: 'RPD_DONE',
  WAITING_UI_UX_CONFIRM: 'WAITING_UI_UX_CONFIRM',
  UI_UX_APPROVED: 'UI_UX_APPROVED',
  VISUAL_CONTRACT_READY: 'VISUAL_CONTRACT_READY',
  WPD_DONE: 'WPD_DONE',
  UI_SURFACE_INVENTORY_DONE: 'UI_SURFACE_INVENTORY_DONE',
  VD_DONE: 'VD_DONE',
  WAITING_IMPLEMENTATION_SCOPE: 'WAITING_IMPLEMENTATION_SCOPE',
  SCOPE_SELECTED: 'SCOPE_SELECTED',
  ACEP_READY: 'ACEP_READY',
  ACEP_RUN_DONE: 'ACEP_RUN_DONE',
  VISUAL_AUDIT_DONE: 'VISUAL_AUDIT_DONE',
  WAITING_REVIEW_RESULT: 'WAITING_REVIEW_RESULT',
  DONE: 'DONE',
} as const

export interface StateHistoryEntry {
  from: PbeState
  to: PbeState
  command: string
  at: string
  actor?: string
}

export const stateAliases: Record<string, PbeState> = {
  IDLE: 'INIT',
  STARTED: 'INIT',
  WAITING_ROOT_CONFIRMATION: 'INIT',
  DRAFT_CREATED_FROM_ASSUMPTIONS: 'INIT',
  RPD_IN_PROGRESS: 'INIT',
  WAITING_RPD_DECISION: 'INIT',
  WAITING_UI_UX_CONFIRMATION: 'WAITING_UI_UX_CONFIRM',
  UI_UX_CONFIRMED: 'UI_UX_APPROVED',
  WPD_IN_PROGRESS: 'UI_UX_APPROVED',
  VD_IN_PROGRESS: 'WPD_DONE',
  DEPENDENCY_IMPACT_AUDITED: 'VD_DONE',
  WAITING_IMPLEMENTATION_SCOPE_CONFIRMATION: 'WAITING_IMPLEMENTATION_SCOPE',
  IMPLEMENTATION_SCOPE_CONFIRMED: 'SCOPE_SELECTED',
  WAITING_ARCHITECTURE_RUNWAY_CONFIRM: 'SCOPE_SELECTED',
  ARCHITECTURE_RUNWAY_APPROVED: 'SCOPE_SELECTED',
  PLAN_EXECUTED: 'SCOPE_SELECTED',
  COVERAGE_AUDITED: 'SCOPE_SELECTED',
  UX_AUDITED: 'SCOPE_SELECTED',
  ACEP_GENERATED: 'ACEP_READY',
  ACEP_VALIDATED: 'ACEP_READY',
  EXECUTION_IN_PROGRESS: 'ACEP_READY',
  EXECUTION_DONE: 'ACEP_RUN_DONE',
  WAITING_REVIEW: 'WAITING_REVIEW_RESULT',
  REVISION_REQUESTED: 'WAITING_REVIEW_RESULT',
  WAITING_NEXT_SLICE_DECISION: 'DONE',
  SLICE_ACCEPTED: 'DONE',
  COMPLETED: 'DONE',
  ACCEPTED: 'DONE',
  CLOSED: 'DONE',
} as const

export const transitions: Record<PbeState, PbeState[]> = {
  INIT: ['RPD_DONE'],
  RPD_DONE: ['WAITING_UI_UX_CONFIRM', 'UI_UX_APPROVED', 'WPD_DONE'],
  WAITING_UI_UX_CONFIRM: ['UI_UX_APPROVED'],
  UI_UX_APPROVED: ['VISUAL_CONTRACT_READY', 'WPD_DONE'],
  VISUAL_CONTRACT_READY: ['WPD_DONE'],
  WPD_DONE: ['UI_SURFACE_INVENTORY_DONE', 'VD_DONE'],
  UI_SURFACE_INVENTORY_DONE: ['VD_DONE'],
  VD_DONE: ['WAITING_IMPLEMENTATION_SCOPE', 'SCOPE_SELECTED'],
  WAITING_IMPLEMENTATION_SCOPE: ['SCOPE_SELECTED'],
  SCOPE_SELECTED: ['ACEP_READY'],
  ACEP_READY: ['ACEP_RUN_DONE'],
  ACEP_RUN_DONE: ['VISUAL_AUDIT_DONE', 'WAITING_REVIEW_RESULT'],
  VISUAL_AUDIT_DONE: ['WAITING_REVIEW_RESULT'],
  WAITING_REVIEW_RESULT: ['DONE'],
  DONE: [],
}

export function isPbeState(value: unknown): value is PbeState {
  return typeof value === 'string' && (isCanonicalPbeState(value) || value in stateAliases)
}

export function isCanonicalPbeState(value: unknown): value is PbeState {
  return typeof value === 'string' && (pbeStates as readonly string[]).includes(value)
}

export function normalizePbeState(value: unknown): PbeState | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }
  if (isCanonicalPbeState(value)) {
    return value
  }
  return stateAliases[value] ?? null
}

export function canTransition(from: PbeState, to: PbeState): boolean {
  return transitions[from].includes(to)
}

export function nextStatesFor(state: PbeState): PbeState[] {
  return transitions[state]
}

export function assertTransition(from: PbeState, to: PbeState): ValidationIssue[] {
  if (canTransition(from, to)) {
    return []
  }
  return [
    issue({
      validator: 'StateMachine',
      code: 'INVALID_TRANSITION',
      severity: 'error',
      message: `State transition ${from} -> ${to} is not allowed.`,
      suggestedFix: 'Return to the previous required PBE gate and complete its validator before advancing.',
    }),
  ]
}

export function stateMachineIssues(state: Record<string, unknown> | null): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const autoflow = getAutoflowObject(state)
  const rawState = autoflow.state
  const currentState = normalizePbeState(rawState)

  if (!currentState) {
    issues.push(
      issue({
        validator: 'StateMachine',
        code: 'UNKNOWN_STATE',
        severity: 'error',
        file: '.pbe/blueprint/pbe-state.json',
        message: `Unknown PBE autoflow.state: ${String(rawState || '<missing>')}.`,
        suggestedFix: 'Use one of the canonical PBE states from cli/src/core/state-machine.ts.',
      }),
    )
  }

  const history = Array.isArray(autoflow.stateHistory) ? autoflow.stateHistory : []
  let previousTo: PbeState | null = null
  for (const [index, entry] of history.entries()) {
    if (!isObject(entry)) {
      issues.push(historyIssue('STATE_HISTORY_ENTRY_INVALID', index, 'State history entry must be an object.'))
      continue
    }

    const from = normalizePbeState(entry.from)
    const to = normalizePbeState(entry.to)
    if (!from || !to) {
      issues.push(
        historyIssue(
          'STATE_HISTORY_UNKNOWN_STATE',
          index,
          `State history entry has unknown from/to state: ${String(entry.from)} -> ${String(entry.to)}.`,
        ),
      )
      continue
    }

    if (!canTransition(from, to)) {
      issues.push(
        historyIssue(
          'STATE_HISTORY_INVALID_TRANSITION',
          index,
          `State history entry has invalid transition: ${from} -> ${to}.`,
        ),
      )
    }

    if (previousTo && previousTo !== from) {
      issues.push(
        historyIssue(
          'STATE_HISTORY_BROKEN_CHAIN',
          index,
          `State history is not contiguous: previous to=${previousTo}, next from=${from}.`,
        ),
      )
    }
    previousTo = to
  }

  if (previousTo && currentState && previousTo !== currentState) {
    issues.push(
      issue({
        validator: 'StateMachine',
        code: 'STATE_HISTORY_CURRENT_MISMATCH',
        severity: 'error',
        file: '.pbe/blueprint/pbe-state.json',
        message: `Last stateHistory target ${previousTo} does not match current state ${currentState}.`,
        suggestedFix: 'Use PBE CLI transition commands so stateHistory and autoflow.state stay synchronized.',
      }),
    )
  }

  return issues
}

function historyIssue(code: string, index: number, message: string): ValidationIssue {
  return issue({
    validator: 'StateMachine',
    code,
    severity: 'error',
    file: '.pbe/blueprint/pbe-state.json',
    nodeId: `stateHistory[${index}]`,
    message,
    suggestedFix: 'Repair the state history or rerun the appropriate PBE CLI transition command.',
  })
}

function getAutoflowObject(state: Record<string, unknown> | null): Record<string, unknown> {
  const autoflow = state?.autoflow
  return isObject(autoflow) ? autoflow : {}
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
