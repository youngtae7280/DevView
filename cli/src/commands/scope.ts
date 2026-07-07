import { defaultArtifacts, getOpenBlockingDecisions, loadProject } from '../core/project.js'
import { DEVVIEW_STATE } from '../core/state-machine.js'
import { checkpointDevViewState, transitionDevViewState } from '../core/state-transition.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { hasErrors, issue } from '../core/types.js'
import {
  validateProductIntake,
  validateTraceability,
  validateVerificationDesign,
  validateVisualDesign,
  validateWorkPlanning,
} from '../validators/devview-validators.js'
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
  issues.push(...(await validateProductIntake(context.options.root, { completionMode: true })))
  issues.push(...(await validateWorkPlanning(context.options.root)))
  issues.push(...(await validateVerificationDesign(context.options.root)))
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
  return transitionDevViewState(
    context.options.root,
    'scope select',
    [DEVVIEW_STATE.WAITING_IMPLEMENTATION_SCOPE, DEVVIEW_STATE.SCOPE_SELECTED],
    {
      completedSteps: ['implementation_scope'],
      stage: 'execution_planning',
      mode: 'execution_planning',
      currentGate: null,
      nextStep: 'generate_execution_pack',
      lastUserAction: 'select_scope',
      actor: 'user',
      data: {
        next: 'Generate Execution Pack artifacts, then run `devview execution-pack ready`.',
      },
    },
  )
}

export async function dependencyAuditCompleteCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const state = await loadState(context.options.root)
  issues.push(...implementationScopeIssues(state))
  issues.push(...(await validateProductIntake(context.options.root, { completionMode: true })))
  issues.push(...(await validateWorkPlanning(context.options.root)))
  issues.push(...(await validateVerificationDesign(context.options.root)))
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
  return checkpointDevViewState(context.options.root, 'dependency audit complete', [DEVVIEW_STATE.SCOPE_SELECTED], {
    completedSteps: ['dependency_impact_audit'],
    stage: 'execution_planning',
    mode: 'dependency_impact_audit',
    currentGate: null,
    nextStep: 'plan_execution',
    data: {
      checkpoint: 'dependency_impact_audit',
      next: 'Run Plan Execution and then `devview plan execution complete`.',
    },
  })
}

export async function planExecutionCompleteCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(...requiredCompletedStepIssues(await loadState(context.options.root), ['dependency_impact_audit']))
  issues.push(...(await validateWorkPlanning(context.options.root)))
  issues.push(...(await validateVerificationDesign(context.options.root)))
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
  return checkpointDevViewState(context.options.root, 'plan execution complete', [DEVVIEW_STATE.SCOPE_SELECTED], {
    completedSteps: ['plan_execution'],
    stage: 'execution_planning',
    mode: 'plan_execution',
    currentGate: null,
    nextStep: 'coverage_audit',
    data: {
      checkpoint: 'plan_execution',
      next: 'Run Coverage Audit and then `devview coverage audit complete`.',
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
  return checkpointDevViewState(context.options.root, 'coverage audit complete', [DEVVIEW_STATE.SCOPE_SELECTED], {
    completedSteps: ['coverage_audit'],
    stage: 'execution_planning',
    mode: 'coverage_audit',
    currentGate: null,
    nextStep: 'ux_audit',
    data: {
      checkpoint: 'coverage_audit',
      next: 'Run UX Audit and then `devview ux audit complete`.',
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
  return checkpointDevViewState(context.options.root, 'ux audit complete', [DEVVIEW_STATE.SCOPE_SELECTED], {
    completedSteps: ['ux_audit'],
    stage: 'execution_planning',
    mode: 'ux_audit',
    currentGate: null,
    nextStep: 'generate_execution_pack',
    data: {
      checkpoint: 'ux_audit',
      next: 'Generate Execution Pack artifacts and run `devview execution-pack ready`.',
    },
  })
}
