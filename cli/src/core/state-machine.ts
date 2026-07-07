import type { ValidationIssue } from './types.js'
import { issue } from './types.js'

export const PBE_STATES = [
  'INIT',
  'WAITING_ROOT_CONFIRMATION',
  'RPD_IN_PROGRESS',
  'RPD_DONE',
  'WAITING_UI_UX_CONFIRM',
  'UI_UX_APPROVED',
  'VISUAL_CONTRACT_READY',
  'WPD_IN_PROGRESS',
  'WPD_DONE',
  'UI_SURFACE_INVENTORY_DONE',
  'VD_IN_PROGRESS',
  'VD_DONE',
  'WAITING_IMPLEMENTATION_SCOPE',
  'SCOPE_SELECTED',
  'ACEP_READY',
  'EXECUTION_IN_PROGRESS',
  'ACEP_RUN_DONE',
  'VISUAL_AUDIT_DONE',
  'WAITING_REVIEW_RESULT',
  'REVISION_REQUESTED',
  'ACCEPTED',
  'DONE',
  'BLOCKED',
] as const

export const pbeStates = PBE_STATES

export type PbeState = (typeof PBE_STATES)[number]

export const PBE_STATE = Object.freeze(
  Object.fromEntries(PBE_STATES.map((state) => [state, state])) as { [State in PbeState]: State },
)

export const PBE_TERMINAL_STATES = ['DONE'] as const satisfies readonly PbeState[]

export const PBE_ACTOR_REQUIRED_STATES = ['ACCEPTED'] as const satisfies readonly PbeState[]

export const PBE_STATE_TRANSITIONS: Record<PbeState, readonly PbeState[]> = {
  INIT: ['WAITING_ROOT_CONFIRMATION', 'RPD_IN_PROGRESS', 'RPD_DONE', 'BLOCKED'],
  WAITING_ROOT_CONFIRMATION: ['RPD_IN_PROGRESS', 'RPD_DONE', 'BLOCKED'],
  RPD_IN_PROGRESS: ['WAITING_ROOT_CONFIRMATION', 'RPD_DONE', 'BLOCKED'],
  RPD_DONE: ['WAITING_UI_UX_CONFIRM', 'UI_UX_APPROVED', 'WPD_IN_PROGRESS', 'WPD_DONE', 'BLOCKED'],
  WAITING_UI_UX_CONFIRM: ['UI_UX_APPROVED', 'BLOCKED'],
  UI_UX_APPROVED: ['VISUAL_CONTRACT_READY', 'WPD_IN_PROGRESS', 'WPD_DONE', 'BLOCKED'],
  VISUAL_CONTRACT_READY: ['WPD_IN_PROGRESS', 'WPD_DONE', 'BLOCKED'],
  WPD_IN_PROGRESS: ['WPD_DONE', 'BLOCKED'],
  WPD_DONE: ['UI_SURFACE_INVENTORY_DONE', 'VD_IN_PROGRESS', 'VD_DONE', 'BLOCKED'],
  UI_SURFACE_INVENTORY_DONE: ['VD_IN_PROGRESS', 'VD_DONE', 'BLOCKED'],
  VD_IN_PROGRESS: ['VD_DONE', 'BLOCKED'],
  VD_DONE: ['WAITING_IMPLEMENTATION_SCOPE', 'SCOPE_SELECTED', 'BLOCKED'],
  WAITING_IMPLEMENTATION_SCOPE: ['SCOPE_SELECTED', 'BLOCKED'],
  SCOPE_SELECTED: ['ACEP_READY', 'BLOCKED'],
  ACEP_READY: ['EXECUTION_IN_PROGRESS', 'BLOCKED'],
  EXECUTION_IN_PROGRESS: ['ACEP_RUN_DONE', 'BLOCKED'],
  ACEP_RUN_DONE: ['VISUAL_AUDIT_DONE', 'WAITING_REVIEW_RESULT', 'BLOCKED'],
  VISUAL_AUDIT_DONE: ['WAITING_REVIEW_RESULT', 'BLOCKED'],
  WAITING_REVIEW_RESULT: ['REVISION_REQUESTED', 'ACCEPTED', 'BLOCKED'],
  REVISION_REQUESTED: ['RPD_IN_PROGRESS', 'WPD_IN_PROGRESS', 'VD_IN_PROGRESS', 'ACEP_READY', 'BLOCKED'],
  ACCEPTED: ['DONE', 'REVISION_REQUESTED'],
  DONE: ['REVISION_REQUESTED'],
  BLOCKED: ['RPD_IN_PROGRESS', 'WPD_IN_PROGRESS', 'VD_IN_PROGRESS', 'ACEP_READY'],
}

export const transitions = PBE_STATE_TRANSITIONS

export interface StateHistoryEntry {
  from: PbeState
  to: PbeState
  command: string
  at: string
  actor?: string
}

export const PBE_STATE_ALIASES: Record<string, PbeState> = {
  IDLE: 'INIT',
  STARTED: 'INIT',
  DRAFT_CREATED_FROM_ASSUMPTIONS: 'WAITING_ROOT_CONFIRMATION',
  WAITING_RPD_DECISION: 'WAITING_ROOT_CONFIRMATION',
  WAITING_UI_UX_CONFIRMATION: 'WAITING_UI_UX_CONFIRM',
  UI_UX_CONFIRMED: 'UI_UX_APPROVED',
  DEPENDENCY_IMPACT_AUDITED: 'SCOPE_SELECTED',
  IMPLEMENTATION_SCOPE_CONFIRMED: 'SCOPE_SELECTED',
  WAITING_IMPLEMENTATION_SCOPE_CONFIRMATION: 'WAITING_IMPLEMENTATION_SCOPE',
  WAITING_ARCHITECTURE_RUNWAY_CONFIRM: 'SCOPE_SELECTED',
  ARCHITECTURE_RUNWAY_APPROVED: 'SCOPE_SELECTED',
  PLAN_EXECUTED: 'SCOPE_SELECTED',
  COVERAGE_AUDITED: 'SCOPE_SELECTED',
  UX_AUDITED: 'SCOPE_SELECTED',
  ACEP_GENERATED: 'ACEP_READY',
  ACEP_VALIDATED: 'ACEP_READY',
  EXECUTION_DONE: 'ACEP_RUN_DONE',
  WAITING_REVIEW: 'WAITING_REVIEW_RESULT',
  WAITING_NEXT_SLICE_DECISION: 'DONE',
  SLICE_ACCEPTED: 'ACCEPTED',
  COMPLETED: 'DONE',
  CLOSED: 'DONE',
} as const

export const stateAliases = PBE_STATE_ALIASES

export function isPbeState(value: unknown): value is PbeState {
  return isCanonicalPbeState(value)
}

export function isCanonicalPbeState(value: unknown): value is PbeState {
  return typeof value === 'string' && (PBE_STATES as readonly string[]).includes(value)
}

export function isKnownPbeState(value: unknown): boolean {
  return normalizePbeState(value) !== null
}

export function normalizePbeState(value: unknown): PbeState | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }
  if (isCanonicalPbeState(value)) {
    return value
  }
  return PBE_STATE_ALIASES[value] ?? null
}

export function isTerminalPbeState(value: unknown): value is (typeof PBE_TERMINAL_STATES)[number] {
  const state = normalizePbeState(value)
  return !!state && (PBE_TERMINAL_STATES as readonly string[]).includes(state)
}

export function stateRequiresActor(value: unknown): boolean {
  const state = normalizePbeState(value)
  return !!state && (PBE_ACTOR_REQUIRED_STATES as readonly string[]).includes(state)
}

export function canTransition(from: PbeState, to: PbeState): boolean {
  return PBE_STATE_TRANSITIONS[from].includes(to)
}

export function nextStatesFor(state: PbeState): PbeState[] {
  return [...PBE_STATE_TRANSITIONS[state]]
}

export function validatePbeStateValue(value: unknown): ValidationIssue[] {
  if (normalizePbeState(value)) {
    return []
  }
  return [
    issue({
      validator: 'StateMachine',
      code: 'UNKNOWN_STATE',
      severity: 'error',
      file: '.devview/blueprint/devview-state.json',
      message: `Unknown DevView autoflow.state: ${String(value || '<missing>')}.`,
      suggestedFix: 'Use one of the canonical DevView states from cli/src/core/state-machine.ts.',
    }),
  ]
}

export function validatePbeTransition(from: PbeState, to: PbeState): ValidationIssue[] {
  return assertTransition(from, to)
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
      suggestedFix: 'Return to the previous required DevView gate and complete its validator before advancing.',
    }),
  ]
}

export function stateMachineIssues(state: Record<string, unknown> | null): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const autoflow = getAutoflowObject(state)
  const rawState = autoflow.state
  const currentState = normalizePbeState(rawState)

  issues.push(...validatePbeStateValue(rawState))

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
        file: '.devview/blueprint/devview-state.json',
        message: `Last stateHistory target ${previousTo} does not match current state ${currentState}.`,
        suggestedFix: 'Use DevView CLI transition commands so stateHistory and autoflow.state stay synchronized.',
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
    file: '.devview/blueprint/devview-state.json',
    nodeId: `stateHistory[${index}]`,
    message,
    suggestedFix: 'Repair the state history or rerun the appropriate DevView CLI transition command.',
  })
}

function getAutoflowObject(state: Record<string, unknown> | null): Record<string, unknown> {
  const autoflow = state?.autoflow
  return isObject(autoflow) ? autoflow : {}
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
