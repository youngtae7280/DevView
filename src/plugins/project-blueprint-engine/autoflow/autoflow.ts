export type PbeExecutionProfile = 'bypass' | 'lite' | 'full'

export type AutoflowStateName =
  | 'IDLE'
  | 'STARTED'
  | 'RPD_DONE'
  | 'WAITING_UI_UX_CONFIRM'
  | 'UI_UX_APPROVED'
  | 'WPD_DONE'
  | 'VD_DONE'
  | 'DEPENDENCY_IMPACT_AUDITED'
  | 'WAITING_IMPLEMENTATION_SCOPE'
  | 'SCOPE_SELECTED'
  | 'WAITING_ARCHITECTURE_RUNWAY_CONFIRM'
  | 'ARCHITECTURE_RUNWAY_APPROVED'
  | 'PLAN_EXECUTED'
  | 'COVERAGE_AUDITED'
  | 'UX_AUDITED'
  | 'ACEP_GENERATED'
  | 'ACEP_RUN_DONE'
  | 'WAITING_REVIEW_RESULT'
  | 'PARTIAL_IMPLEMENTATION_DONE'
  | 'WAITING_NEXT_SLICE_DECISION'
  | 'SLICE_ACCEPTED'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'STOPPED'

export type AutoflowStep =
  | 'start'
  | 'rpd'
  | 'ui_ux_confirm'
  | 'wpd'
  | 'vd'
  | 'dependency_impact_audit'
  | 'implementation_scope'
  | 'architecture_runway'
  | 'plan_execution'
  | 'coverage_audit'
  | 'ux_audit'
  | 'generate_acep'
  | 'run_acep'
  | 'review_result'
  | 'next_slice_decision'
  | 'complete'
  | 'collect_feedback'
  | 'create_revision_pack'
  | 'run_revision'

export type HumanGate =
  | 'ui_ux_confirm'
  | 'implementation_scope'
  | 'architecture_runway'
  | 'review_result'
  | 'next_slice_decision'

export type HumanAction =
  | 'approve'
  | 'revise'
  | 'ask'
  | 'status'
  | 'continue'
  | 'stop'
  | 'select_scope'
  | 'select_full_scope'
  | 'mark_deferred'
  | 'mark_foundation'
  | 'ask_dependency_impact'
  | 'start_next_slice'
  | 'complete_current_slice'
  | 'complete_project'
  | 'unknown'

export type AutoflowFailure = {
  failedStep: AutoflowStep
  reason: string
  downstreamSteps: AutoflowStep[]
}

export type AutoflowState = {
  state: AutoflowStateName
  profile: PbeExecutionProfile
  completedSteps: AutoflowStep[]
  currentGate: HumanGate | null
  nextStep: AutoflowStep | null
  lastUserAction: HumanAction | null
  lastFailure: AutoflowFailure | null
}

export const deterministicDownstreamAfterUiApproval: AutoflowStep[] = [
  'wpd',
  'vd',
  'dependency_impact_audit',
  'implementation_scope',
]

export const deterministicDownstreamAfterScopeApproval: AutoflowStep[] = [
  'architecture_runway',
  'plan_execution',
  'coverage_audit',
  'ux_audit',
  'generate_acep',
  'run_acep',
  'review_result',
]

export function createIdleAutoflowState(
  profile: PbeExecutionProfile = 'full',
): AutoflowState {
  return {
    state: 'IDLE',
    profile,
    completedSteps: [],
    currentGate: null,
    nextStep: 'start',
    lastUserAction: null,
    lastFailure: null,
  }
}

export function startAutoflow(
  profile: PbeExecutionProfile = 'full',
): AutoflowState {
  return {
    state: 'STARTED',
    profile,
    completedSteps: ['start'],
    currentGate: null,
    nextStep: profile === 'bypass' ? null : 'rpd',
    lastUserAction: null,
    lastFailure: null,
  }
}

export function completeAutoflowStep(
  state: AutoflowState,
  step: AutoflowStep,
): AutoflowState {
  const completedSteps = appendUnique(state.completedSteps, step)

  switch (step) {
    case 'rpd':
      return enterGate(
        state,
        completedSteps,
        'WAITING_UI_UX_CONFIRM',
        'ui_ux_confirm',
      )
    case 'wpd':
      return nextDeterministicState(state, completedSteps, 'WPD_DONE', 'vd')
    case 'vd':
      return nextDeterministicState(
        state,
        completedSteps,
        'VD_DONE',
        'dependency_impact_audit',
      )
    case 'dependency_impact_audit':
      return enterGate(
        state,
        completedSteps,
        'WAITING_IMPLEMENTATION_SCOPE',
        'implementation_scope',
      )
    case 'architecture_runway':
      return enterGate(
        state,
        completedSteps,
        'WAITING_ARCHITECTURE_RUNWAY_CONFIRM',
        'architecture_runway',
      )
    case 'plan_execution':
      return nextDeterministicState(
        state,
        completedSteps,
        'PLAN_EXECUTED',
        'coverage_audit',
      )
    case 'coverage_audit':
      return nextDeterministicState(
        state,
        completedSteps,
        'COVERAGE_AUDITED',
        'ux_audit',
      )
    case 'ux_audit':
      return nextDeterministicState(
        state,
        completedSteps,
        'UX_AUDITED',
        'generate_acep',
      )
    case 'generate_acep':
      return nextDeterministicState(
        state,
        completedSteps,
        'ACEP_GENERATED',
        'run_acep',
      )
    case 'run_acep':
      return enterGate(
        state,
        completedSteps,
        'WAITING_REVIEW_RESULT',
        'review_result',
      )
    default:
      return { ...state, completedSteps }
  }
}

export function applyHumanAction(
  state: AutoflowState,
  action: HumanAction,
): AutoflowState {
  if (action === 'stop') {
    return {
      ...state,
      state: 'STOPPED',
      nextStep: null,
      lastUserAction: action,
    }
  }

  if (action === 'approve' || action === 'continue') {
    if (state.currentGate === 'ui_ux_confirm') {
      return approveGate(state, 'UI_UX_APPROVED', 'ui_ux_confirm', 'wpd')
    }

    if (state.currentGate === 'architecture_runway') {
      return approveGate(
        state,
        'ARCHITECTURE_RUNWAY_APPROVED',
        'architecture_runway',
        'plan_execution',
      )
    }

    if (state.currentGate === 'review_result') {
      return approveGate(
        state,
        'WAITING_NEXT_SLICE_DECISION',
        'review_result',
        'next_slice_decision',
        'next_slice_decision',
      )
    }
  }

  if (action === 'select_scope' || action === 'select_full_scope') {
    if (state.currentGate === 'implementation_scope') {
      return approveGate(
        state,
        'SCOPE_SELECTED',
        'implementation_scope',
        'architecture_runway',
      )
    }
  }

  if (action === 'mark_foundation' && state.currentGate === 'architecture_runway') {
    return approveGate(
      state,
      'ARCHITECTURE_RUNWAY_APPROVED',
      'architecture_runway',
      'plan_execution',
    )
  }

  if (action === 'complete_current_slice') {
    if (state.currentGate === 'next_slice_decision') {
      return approveGate(
        state,
        'SLICE_ACCEPTED',
        'next_slice_decision',
        null,
        null,
      )
    }
  }

  if (action === 'complete_project') {
    if (state.currentGate === 'next_slice_decision') {
      return approveGate(
        state,
        'COMPLETED',
        'next_slice_decision',
        null,
        null,
      )
    }
  }

  if (action === 'start_next_slice') {
    if (state.currentGate === 'next_slice_decision') {
      return approveGate(
        state,
        'WAITING_IMPLEMENTATION_SCOPE',
        'next_slice_decision',
        'implementation_scope',
        'implementation_scope',
      )
    }
  }

  if (action === 'mark_deferred' || action === 'mark_foundation') {
    return {
      ...state,
      nextStep: state.currentGate ?? state.nextStep,
      lastUserAction: action,
    }
  }

  if (action === 'revise') {
    const nextStep =
      state.currentGate === 'review_result'
        ? 'collect_feedback'
        : state.currentGate
    return {
      ...state,
      nextStep,
      lastUserAction: 'revise',
    }
  }

  return {
    ...state,
    lastUserAction: action,
  }
}

export function failAutoflowStep(
  state: AutoflowState,
  failedStep: AutoflowStep,
  reason: string,
  downstreamSteps: AutoflowStep[],
): AutoflowState {
  return {
    ...state,
    state: 'BLOCKED',
    nextStep: failedStep,
    currentGate: null,
    lastFailure: {
      failedStep,
      reason,
      downstreamSteps,
    },
  }
}

export function mapNaturalLanguageToAction(input: string): HumanAction {
  const normalized = input.trim().toLowerCase()

  if (!normalized) {
    return 'unknown'
  }

  if (includesAny(normalized, stopPatterns)) {
    return 'stop'
  }

  if (normalized === 'status' || includesAny(normalized, statusPatterns)) {
    return 'status'
  }

  if (includesAny(normalized, completeProjectPatterns)) {
    return 'complete_project'
  }

  if (includesAny(normalized, startNextSlicePatterns)) {
    return 'start_next_slice'
  }

  if (includesAny(normalized, completeCurrentSlicePatterns)) {
    return 'complete_current_slice'
  }

  if (includesAny(normalized, fullScopePatterns)) {
    return 'select_full_scope'
  }

  if (includesAny(normalized, selectScopePatterns)) {
    return 'select_scope'
  }

  if (includesAny(normalized, deferredPatterns)) {
    return 'mark_deferred'
  }

  if (includesAny(normalized, foundationPatterns)) {
    return 'mark_foundation'
  }

  if (includesAny(normalized, dependencyImpactPatterns)) {
    return 'ask_dependency_impact'
  }

  if (includesAny(normalized, revisePatterns)) {
    return 'revise'
  }

  if (includesAny(normalized, askPatterns)) {
    return 'ask'
  }

  if (includesAny(normalized, approvePatterns)) {
    return 'approve'
  }

  return 'unknown'
}

function nextDeterministicState(
  state: AutoflowState,
  completedSteps: AutoflowStep[],
  nextState: AutoflowStateName,
  nextStep: AutoflowStep,
): AutoflowState {
  return {
    ...state,
    state: nextState,
    completedSteps,
    currentGate: null,
    nextStep,
  }
}

function enterGate(
  state: AutoflowState,
  completedSteps: AutoflowStep[],
  nextState: AutoflowStateName,
  gate: HumanGate,
): AutoflowState {
  return {
    ...state,
    state: nextState,
    completedSteps,
    currentGate: gate,
    nextStep: gate,
  }
}

function approveGate(
  state: AutoflowState,
  nextState: AutoflowStateName,
  completedStep: AutoflowStep,
  nextStep: AutoflowStep | null,
  nextGate: HumanGate | null = null,
): AutoflowState {
  return {
    ...state,
    state: nextState,
    completedSteps: appendUnique(state.completedSteps, completedStep),
    currentGate: nextGate,
    nextStep,
    lastUserAction: 'approve',
  }
}

function appendUnique(
  steps: AutoflowStep[],
  step: AutoflowStep,
): AutoflowStep[] {
  return steps.includes(step) ? steps : [...steps, step]
}

function includesAny(input: string, patterns: string[]): boolean {
  return patterns.some((pattern) => input.includes(pattern))
}

const stopPatterns = [
  '\uc911\ub2e8',
  '\uba48\ucdb0',
  '\ucde8\uc18c',
  'stop',
  'cancel',
  'halt',
]

const statusPatterns = [
  '\ud604\uc7ac \uc0c1\ud0dc',
  '\uc0c1\ud0dc\ub97c \uc54c\ub824',
  'current status',
  'status please',
]

const completeProjectPatterns = [
  '\ud504\ub85c\uc81d\ud2b8 \uc644\ub8cc',
  '\uc804\uccb4 \uc644\ub8cc',
  'complete project',
  'whole project complete',
]

const startNextSlicePatterns = [
  '\ub2e4\uc74c slice',
  '\ub2e4\uc74c \uc2ac\ub77c\uc774\uc2a4',
  '\ub2e4\uc74c \ubc94\uc704',
  'start next slice',
  'next slice',
]

const completeCurrentSlicePatterns = [
  '\uc5ec\uae30\uae4c\uc9c0',
  '\ud604\uc7ac slice \uc644\ub8cc',
  '\ud604\uc7ac \uc2ac\ub77c\uc774\uc2a4 \uc644\ub8cc',
  '\uc624\ub298\uc740 \uc5ec\uae30\uae4c\uc9c0',
  'complete current slice',
]

const fullScopePatterns = [
  '\uc804\uccb4 \uc9c4\ud589',
  '\uc804\uccb4\ub97c \uc9c4\ud589',
  '\uc804\uccb4 \uad6c\ud604',
  'full scope',
  'all scope',
]

const selectScopePatterns = [
  '\uc774\ubc88\uc5d0\ub294',
  '\uc774\ubc88 \ubc94\uc704',
  '\uc774\ubc88 slice',
  '\uc774\ubc88 \uc2ac\ub77c\uc774\uc2a4',
  '\ub9cc \uad6c\ud604',
  '\uba3c\uc800 \ub9cc\ub4e4',
  'select scope',
]

const deferredPatterns = [
  '\ubcf4\ub958',
  '\ubbf8\ub904',
  '\ubbf8\ub8f8',
  'defer',
  'deferred',
]

const foundationPatterns = [
  '\uad6c\uc870\ub9cc',
  '\uc778\ud130\ud398\uc774\uc2a4\ub9cc',
  '\uae30\ubc18',
  'stub',
  'foundation',
]

const dependencyImpactPatterns = [
  '\ud544\uc218 \uc544\ub2cc\uac00',
  '\uc601\ud5a5',
  'dependency impact',
  'future impact',
]

const revisePatterns = [
  '\uc218\uc815',
  '\ucd94\uac00',
  '\ubc14\uafd4',
  '\ubcc0\uacbd',
  '\uace0\uccd0',
  'revise',
  'change',
  'fix',
  'add',
]

const askPatterns = [
  '\uac80\ud1a0',
  '\uc704\ud5d8\ud55c \ubd80\ubd84',
  '\uc5b4\uc0c9\ud55c \ubd80\ubd84',
  '\ube60\uc9c4',
  '\ud310\ub2e8',
  'review',
  'risk',
]

const approvePatterns = [
  '\uc2b9\uc778',
  '\uad1c\ucc2e',
  '\uc774\ub300\ub85c',
  '\ub2e4\uc74c \ub2e8\uacc4',
  '\uc9c4\ud589\ud574',
  '\uc644\ub8cc \ucc98\ub9ac',
  '\ub9c8\ubb34\ub9ac',
  'approve',
  'continue',
  'ok',
  'looks good',
]
