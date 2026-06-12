import { defaultArtifacts, getOpenBlockingDecisions, loadProject } from '../core/project.js'
import { PBE_STATE } from '../core/state-machine.js'
import { checkpointPbeState, transitionPbeState } from '../core/state-transition.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { hasErrors, issue } from '../core/types.js'
import {
  validateRpd,
  validateTraceability,
  validateVd,
  validateVisualDesign,
  validateWpd,
} from '../validators/pbe-validators.js'
import {
  type CommandContext,
  implementationScopeIssues,
  loadState,
  requiredArtifactIssues,
  requiredCompletedStepIssues,
  transitionFailed,
} from './shared.js'

export async function scopeSelectCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const loadedProject = await loadProject(context.options.root)
  issues.push(...loadedProject.issues)
  issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
  issues.push(...(await validateWpd(context.options.root)))
  issues.push(...(await validateVd(context.options.root)))
  issues.push(...(await validateVisualDesign(context.options.root)))
  for (const decision of getOpenBlockingDecisions(loadedProject.project.decisionQueue)) {
    issues.push(
      issue({
        validator: 'Scope',
        code: 'BLOCKING_DECISION_OPEN',
        severity: 'error',
        file: defaultArtifacts.decisionQueue,
        nodeId: String(decision.id || decision.targetNodeId || ''),
        message: `Cannot select implementation scope while blocking decision is open: ${String(decision.question || decision.reason || decision.id || '')}`,
        suggestedFix: 'Resolve blocking decisions before selecting implementation scope.',
      }),
    )
  }
  if (hasErrors(issues)) {
    return transitionFailed('scope select', 'Scope selection failed. State was not changed.', issues)
  }
  return transitionPbeState(
    context.options.root,
    'scope select',
    [PBE_STATE.WAITING_IMPLEMENTATION_SCOPE, PBE_STATE.SCOPE_SELECTED],
    {
      completedSteps: ['implementation_scope'],
      stage: 'execution_planning',
      mode: 'execution_planning',
      currentGate: null,
      nextStep: 'generate_acep',
      lastUserAction: 'select_scope',
      actor: 'user',
      data: {
        next: 'Generate ACEP artifacts, then run `pbe acep ready`.',
      },
    },
  )
}

export async function dependencyAuditCompleteCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const state = await loadState(context.options.root)
  issues.push(...implementationScopeIssues(state))
  issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
  issues.push(...(await validateWpd(context.options.root)))
  issues.push(...(await validateVd(context.options.root)))
  issues.push(...(await validateVisualDesign(context.options.root)))
  issues.push(
    ...requiredArtifactIssues(context.options.root, [
      ['dependencyImpactAudit', 'Dependency Impact Audit JSON'],
      ['dependencyImpactAuditMarkdown', 'Dependency Impact Audit report'],
    ]),
  )
  if (hasErrors(issues)) {
    return transitionFailed(
      'dependency audit complete',
      'Dependency audit checkpoint failed. State was not changed.',
      issues,
    )
  }
  return checkpointPbeState(context.options.root, 'dependency audit complete', [PBE_STATE.SCOPE_SELECTED], {
    completedSteps: ['dependency_impact_audit'],
    stage: 'execution_planning',
    mode: 'dependency_impact_audit',
    currentGate: null,
    nextStep: 'plan_execution',
    data: {
      checkpoint: 'dependency_impact_audit',
      next: 'Run Plan Execution and then `pbe plan execution complete`.',
    },
  })
}

export async function planExecutionCompleteCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(...requiredCompletedStepIssues(await loadState(context.options.root), ['dependency_impact_audit']))
  issues.push(...(await validateWpd(context.options.root)))
  issues.push(...(await validateVd(context.options.root)))
  issues.push(
    ...requiredArtifactIssues(context.options.root, [
      ['dependencyImpactAudit', 'Dependency Impact Audit JSON'],
      ['cycleTree', 'Cycle Tree'],
      ['cycleContract', 'Cycle Contract'],
      ['executionStrategy', 'Execution Strategy JSON'],
      ['executionStrategyMarkdown', 'Execution Strategy report'],
    ]),
  )
  if (hasErrors(issues)) {
    return transitionFailed(
      'plan execution complete',
      'Plan execution checkpoint failed. State was not changed.',
      issues,
    )
  }
  return checkpointPbeState(context.options.root, 'plan execution complete', [PBE_STATE.SCOPE_SELECTED], {
    completedSteps: ['plan_execution'],
    stage: 'execution_planning',
    mode: 'plan_execution',
    currentGate: null,
    nextStep: 'coverage_audit',
    data: {
      checkpoint: 'plan_execution',
      next: 'Run Coverage Audit and then `pbe coverage audit complete`.',
    },
  })
}

export async function coverageAuditCompleteCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(
    ...requiredCompletedStepIssues(await loadState(context.options.root), [
      'dependency_impact_audit',
      'plan_execution',
    ]),
  )
  issues.push(...(await validateTraceability(context.options.root)))
  issues.push(...requiredArtifactIssues(context.options.root, [['coverageAudit', 'Coverage Audit report']]))
  if (hasErrors(issues)) {
    return transitionFailed(
      'coverage audit complete',
      'Coverage audit checkpoint failed. State was not changed.',
      issues,
    )
  }
  return checkpointPbeState(context.options.root, 'coverage audit complete', [PBE_STATE.SCOPE_SELECTED], {
    completedSteps: ['coverage_audit'],
    stage: 'execution_planning',
    mode: 'coverage_audit',
    currentGate: null,
    nextStep: 'ux_audit',
    data: {
      checkpoint: 'coverage_audit',
      next: 'Run UX Audit and then `pbe ux audit complete`.',
    },
  })
}

export async function uxAuditCompleteCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(
    ...requiredCompletedStepIssues(await loadState(context.options.root), [
      'dependency_impact_audit',
      'plan_execution',
      'coverage_audit',
    ]),
  )
  issues.push(...(await validateVisualDesign(context.options.root)))
  issues.push(...requiredArtifactIssues(context.options.root, [['uxAudit', 'UX Audit report']]))
  if (hasErrors(issues)) {
    return transitionFailed('ux audit complete', 'UX audit checkpoint failed. State was not changed.', issues)
  }
  return checkpointPbeState(context.options.root, 'ux audit complete', [PBE_STATE.SCOPE_SELECTED], {
    completedSteps: ['ux_audit'],
    stage: 'execution_planning',
    mode: 'ux_audit',
    currentGate: null,
    nextStep: 'generate_acep',
    data: {
      checkpoint: 'ux_audit',
      next: 'Generate ACEP artifacts and run `pbe acep ready`.',
    },
  })
}
