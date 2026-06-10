import { describe, expect, it } from 'vitest'
import {
  applyHumanAction,
  completeAutoflowStep,
  createIdleAutoflowState,
  deterministicDownstreamAfterScopeApproval,
  deterministicDownstreamAfterUiApproval,
  failAutoflowStep,
  mapNaturalLanguageToAction,
  startAutoflow,
} from './autoflow'

describe('PBE Autoflow', () => {
  it('starts in full profile by default and automatically targets RPD', () => {
    expect(createIdleAutoflowState().state).toBe('IDLE')

    const state = startAutoflow()

    expect(state.state).toBe('STARTED')
    expect(state.profile).toBe('full')
    expect(state.completedSteps).toEqual(['start'])
    expect(state.nextStep).toBe('rpd')
  })

  it('can represent bypass profile without forcing RPD', () => {
    const state = startAutoflow('bypass')

    expect(state.profile).toBe('bypass')
    expect(state.nextStep).toBeNull()
  })

  it('stops at the UI/UX confirmation gate after RPD completes', () => {
    const state = completeAutoflowStep(startAutoflow(), 'rpd')

    expect(state.state).toBe('WAITING_UI_UX_CONFIRM')
    expect(state.currentGate).toBe('ui_ux_confirm')
    expect(state.nextStep).toBe('ui_ux_confirm')
  })

  it('runs WPD and VD after UI approval, then stops at implementation scope gate', () => {
    const waiting = completeAutoflowStep(startAutoflow(), 'rpd')
    let state = applyHumanAction(
      waiting,
      mapNaturalLanguageToAction('\uc2b9\uc778\ud569\ub2c8\ub2e4'),
    )

    expect(state.state).toBe('UI_UX_APPROVED')
    expect(state.nextStep).toBe('wpd')
    expect(deterministicDownstreamAfterUiApproval).toEqual([
      'wpd',
      'vd',
      'dependency_impact_audit',
      'implementation_scope',
    ])

    state = completeAutoflowStep(state, 'wpd')
    state = completeAutoflowStep(state, 'vd')
    state = completeAutoflowStep(state, 'dependency_impact_audit')

    expect(state.state).toBe('WAITING_IMPLEMENTATION_SCOPE')
    expect(state.currentGate).toBe('implementation_scope')
  })

  it('maps partial scope and deferred/foundation natural language', () => {
    expect(
      mapNaturalLanguageToAction('select scope: implement USB status only'),
    ).toBe('select_scope')
    expect(mapNaturalLanguageToAction('defer Ethernet to a later slice')).toBe(
      'mark_deferred',
    )
    expect(
      mapNaturalLanguageToAction('create the foundation interface first'),
    ).toBe('mark_foundation')
    expect(
      mapNaturalLanguageToAction('what is the dependency impact of Ethernet?'),
    ).toBe('ask_dependency_impact')
  })

  it('opens architecture runway gate after implementation scope is selected', () => {
    let state = completeAutoflowStep(startAutoflow(), 'dependency_impact_audit')

    state = applyHumanAction(
      state,
      mapNaturalLanguageToAction('select scope: implement USB only'),
    )

    expect(state.state).toBe('SCOPE_SELECTED')
    expect(state.nextStep).toBe('architecture_runway')
    expect(deterministicDownstreamAfterScopeApproval).toContain('run_acep')

    state = completeAutoflowStep(state, 'architecture_runway')

    expect(state.state).toBe('WAITING_ARCHITECTURE_RUNWAY_CONFIRM')
    expect(state.currentGate).toBe('architecture_runway')
  })

  it('approves architecture runway and runs selected/foundation scope to review gate', () => {
    let state = completeAutoflowStep(startAutoflow(), 'dependency_impact_audit')
    state = applyHumanAction(state, 'select_scope')
    state = completeAutoflowStep(state, 'architecture_runway')
    state = applyHumanAction(
      state,
      mapNaturalLanguageToAction('foundation is ready; continue'),
    )

    expect(state.state).toBe('ARCHITECTURE_RUNWAY_APPROVED')
    expect(state.nextStep).toBe('plan_execution')

    state = completeAutoflowStep(state, 'plan_execution')
    state = completeAutoflowStep(state, 'coverage_audit')
    state = completeAutoflowStep(state, 'ux_audit')
    state = completeAutoflowStep(state, 'generate_acep')
    state = completeAutoflowStep(state, 'run_acep')

    expect(state.state).toBe('WAITING_REVIEW_RESULT')
    expect(state.currentGate).toBe('review_result')
  })

  it('does not use COMPLETED for slice review approval', () => {
    const reviewGate = completeAutoflowStep(startAutoflow(), 'run_acep')

    const approved = applyHumanAction(
      reviewGate,
      mapNaturalLanguageToAction('looks good, continue'),
    )

    expect(approved.state).toBe('WAITING_NEXT_SLICE_DECISION')
    expect(approved.currentGate).toBe('next_slice_decision')
  })

  it('can accept only the current slice or start the next slice', () => {
    const reviewApproved = applyHumanAction(
      completeAutoflowStep(startAutoflow(), 'run_acep'),
      'approve',
    )

    const sliceAccepted = applyHumanAction(
      reviewApproved,
      mapNaturalLanguageToAction('complete current slice'),
    )
    expect(sliceAccepted.state).toBe('SLICE_ACCEPTED')

    const nextSlice = applyHumanAction(
      reviewApproved,
      mapNaturalLanguageToAction('start next slice for Ethernet'),
    )
    expect(nextSlice.state).toBe('WAITING_IMPLEMENTATION_SCOPE')
    expect(nextSlice.currentGate).toBe('implementation_scope')
  })

  it('maps revision, ask, status, and stop natural language', () => {
    expect(mapNaturalLanguageToAction('fix this part')).toBe('revise')
    expect(mapNaturalLanguageToAction('review the risk')).toBe('ask')
    expect(mapNaturalLanguageToAction('current status please')).toBe('status')
    expect(mapNaturalLanguageToAction('stop')).toBe('stop')
  })

  it('routes review-gate revision into bounded revision workflow', () => {
    const reviewGate = completeAutoflowStep(startAutoflow(), 'run_acep')
    const revised = applyHumanAction(
      reviewGate,
      mapNaturalLanguageToAction('fix only the failed case and rerun'),
    )

    expect(revised.state).toBe('WAITING_REVIEW_RESULT')
    expect(revised.nextStep).toBe('collect_feedback')
    expect(revised.lastUserAction).toBe('revise')
  })

  it('stops downstream execution on selected/foundation coverage failure', () => {
    const state = failAutoflowStep(
      startAutoflow(),
      'coverage_audit',
      'Selected scope item is missing evidence.',
      ['coverage_audit', 'ux_audit', 'generate_acep', 'run_acep'],
    )

    expect(state.state).toBe('BLOCKED')
    expect(state.nextStep).toBe('coverage_audit')
    expect(state.currentGate).toBeNull()
    expect(state.lastFailure?.downstreamSteps).toContain('run_acep')
  })
})
