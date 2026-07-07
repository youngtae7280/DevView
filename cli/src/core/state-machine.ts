import type { ValidationIssue } from './types.js'
import { issue } from './types.js'

export const DEVVIEW_STATES = [
  'INIT',
  'WAITING_ROOT_CONFIRMATION',
  'PRODUCT_INTAKE_IN_PROGRESS',
  'PRODUCT_INTAKE_DONE',
  'WAITING_UI_UX_CONFIRM',
  'UI_UX_APPROVED',
  'VISUAL_CONTRACT_READY',
  'WORK_PLANNING_IN_PROGRESS',
  'WORK_PLANNING_DONE',
  'UI_SURFACE_INVENTORY_DONE',
  'VERIFICATION_DESIGN_IN_PROGRESS',
  'VERIFICATION_DESIGN_DONE',
  'WAITING_IMPLEMENTATION_SCOPE',
  'SCOPE_SELECTED',
  'EXECUTION_PACK_READY',
  'EXECUTION_IN_PROGRESS',
  'EXECUTION_PACK_RUN_DONE',
  'VISUAL_AUDIT_DONE',
  'WAITING_REVIEW_RESULT',
  'REVISION_REQUESTED',
  'ACCEPTED',
  'DONE',
  'BLOCKED',
] as const

export const devviewStates = DEVVIEW_STATES

export type DevViewState = (typeof DEVVIEW_STATES)[number]

export const DEVVIEW_STATE = Object.freeze(
  Object.fromEntries(DEVVIEW_STATES.map((state) => [state, state])) as { [State in DevViewState]: State },
)

export const DEVVIEW_TERMINAL_STATES = ['DONE'] as const satisfies readonly DevViewState[]

export const DEVVIEW_ACTOR_REQUIRED_STATES = ['ACCEPTED'] as const satisfies readonly DevViewState[]

export const DEVVIEW_STATE_TRANSITIONS: Record<DevViewState, readonly DevViewState[]> = {
  INIT: ['WAITING_ROOT_CONFIRMATION', 'PRODUCT_INTAKE_IN_PROGRESS', 'PRODUCT_INTAKE_DONE', 'BLOCKED'],
  WAITING_ROOT_CONFIRMATION: ['PRODUCT_INTAKE_IN_PROGRESS', 'PRODUCT_INTAKE_DONE', 'BLOCKED'],
  PRODUCT_INTAKE_IN_PROGRESS: ['WAITING_ROOT_CONFIRMATION', 'PRODUCT_INTAKE_DONE', 'BLOCKED'],
  PRODUCT_INTAKE_DONE: [
    'WAITING_UI_UX_CONFIRM',
    'UI_UX_APPROVED',
    'WORK_PLANNING_IN_PROGRESS',
    'WORK_PLANNING_DONE',
    'BLOCKED',
  ],
  WAITING_UI_UX_CONFIRM: ['UI_UX_APPROVED', 'BLOCKED'],
  UI_UX_APPROVED: ['VISUAL_CONTRACT_READY', 'WORK_PLANNING_IN_PROGRESS', 'WORK_PLANNING_DONE', 'BLOCKED'],
  VISUAL_CONTRACT_READY: ['WORK_PLANNING_IN_PROGRESS', 'WORK_PLANNING_DONE', 'BLOCKED'],
  WORK_PLANNING_IN_PROGRESS: ['WORK_PLANNING_DONE', 'BLOCKED'],
  WORK_PLANNING_DONE: [
    'UI_SURFACE_INVENTORY_DONE',
    'VERIFICATION_DESIGN_IN_PROGRESS',
    'VERIFICATION_DESIGN_DONE',
    'BLOCKED',
  ],
  UI_SURFACE_INVENTORY_DONE: ['VERIFICATION_DESIGN_IN_PROGRESS', 'VERIFICATION_DESIGN_DONE', 'BLOCKED'],
  VERIFICATION_DESIGN_IN_PROGRESS: ['VERIFICATION_DESIGN_DONE', 'BLOCKED'],
  VERIFICATION_DESIGN_DONE: ['WAITING_IMPLEMENTATION_SCOPE', 'SCOPE_SELECTED', 'BLOCKED'],
  WAITING_IMPLEMENTATION_SCOPE: ['SCOPE_SELECTED', 'BLOCKED'],
  SCOPE_SELECTED: ['EXECUTION_PACK_READY', 'BLOCKED'],
  EXECUTION_PACK_READY: ['EXECUTION_IN_PROGRESS', 'BLOCKED'],
  EXECUTION_IN_PROGRESS: ['EXECUTION_PACK_RUN_DONE', 'BLOCKED'],
  EXECUTION_PACK_RUN_DONE: ['VISUAL_AUDIT_DONE', 'WAITING_REVIEW_RESULT', 'BLOCKED'],
  VISUAL_AUDIT_DONE: ['WAITING_REVIEW_RESULT', 'BLOCKED'],
  WAITING_REVIEW_RESULT: ['REVISION_REQUESTED', 'ACCEPTED', 'BLOCKED'],
  REVISION_REQUESTED: [
    'PRODUCT_INTAKE_IN_PROGRESS',
    'WORK_PLANNING_IN_PROGRESS',
    'VERIFICATION_DESIGN_IN_PROGRESS',
    'EXECUTION_PACK_READY',
    'BLOCKED',
  ],
  ACCEPTED: ['DONE', 'REVISION_REQUESTED'],
  DONE: ['REVISION_REQUESTED'],
  BLOCKED: [
    'PRODUCT_INTAKE_IN_PROGRESS',
    'WORK_PLANNING_IN_PROGRESS',
    'VERIFICATION_DESIGN_IN_PROGRESS',
    'EXECUTION_PACK_READY',
  ],
}

export const transitions = DEVVIEW_STATE_TRANSITIONS

export interface StateHistoryEntry {
  from: DevViewState
  to: DevViewState
  command: string
  at: string
  actor?: string
}

export function isDevViewState(value: unknown): value is DevViewState {
  return isCanonicalDevViewState(value)
}

export function isCanonicalDevViewState(value: unknown): value is DevViewState {
  return typeof value === 'string' && (DEVVIEW_STATES as readonly string[]).includes(value)
}

export function isKnownDevViewState(value: unknown): boolean {
  return normalizeDevViewState(value) !== null
}

export function normalizeDevViewState(value: unknown): DevViewState | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }
  if (isCanonicalDevViewState(value)) {
    return value
  }
  return null
}

export function isTerminalDevViewState(value: unknown): value is (typeof DEVVIEW_TERMINAL_STATES)[number] {
  const state = normalizeDevViewState(value)
  return !!state && (DEVVIEW_TERMINAL_STATES as readonly string[]).includes(state)
}

export function stateRequiresActor(value: unknown): boolean {
  const state = normalizeDevViewState(value)
  return !!state && (DEVVIEW_ACTOR_REQUIRED_STATES as readonly string[]).includes(state)
}

export function canTransition(from: DevViewState, to: DevViewState): boolean {
  return DEVVIEW_STATE_TRANSITIONS[from].includes(to)
}

export function nextStatesFor(state: DevViewState): DevViewState[] {
  return [...DEVVIEW_STATE_TRANSITIONS[state]]
}

export function validateDevViewStateValue(value: unknown): ValidationIssue[] {
  if (normalizeDevViewState(value)) {
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

export function validateDevViewTransition(from: DevViewState, to: DevViewState): ValidationIssue[] {
  return assertTransition(from, to)
}

export function assertTransition(from: DevViewState, to: DevViewState): ValidationIssue[] {
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
  const currentState = normalizeDevViewState(rawState)

  issues.push(...validateDevViewStateValue(rawState))

  const history = Array.isArray(autoflow.stateHistory) ? autoflow.stateHistory : []
  let previousTo: DevViewState | null = null
  for (const [index, entry] of history.entries()) {
    if (!isObject(entry)) {
      issues.push(historyIssue('STATE_HISTORY_ENTRY_INVALID', index, 'State history entry must be an object.'))
      continue
    }

    const from = normalizeDevViewState(entry.from)
    const to = normalizeDevViewState(entry.to)
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
