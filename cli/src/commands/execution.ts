import { DEVVIEW_STATE } from '../core/state-machine.js'
import { transitionDevViewState } from '../core/state-transition.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { hasErrors } from '../core/types.js'
import { validateExecutionPack, validateEvidence, validateTraceability } from '../validators/devview-validators.js'
import { type CommandContext, hasVisualWork, transitionFailed } from './shared.js'

export async function executionStartCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(...(await validateExecutionPack(context.options.root)))
  if (hasErrors(issues)) {
    return transitionFailed('execution start', 'Execution start failed. State was not changed.', issues)
  }
  return transitionDevViewState(context.options.root, 'execution start', [DEVVIEW_STATE.EXECUTION_IN_PROGRESS], {
    completedSteps: ['execution_start'],
    stage: 'execution_pack_running',
    mode: 'execution_pack_execution',
    currentGate: null,
    nextStep: 'run_execution_pack',
    data: {
      next: 'Execute the Execution Pack, attach evidence, then run `devview execution complete`.',
    },
  })
}

export async function executionCompleteCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(...(await validateExecutionPack(context.options.root)))
  issues.push(...(await validateTraceability(context.options.root, { stage: 'execution' })))
  issues.push(
    ...(await validateEvidence(context.options.root, {
      stage: 'execution',
      requireVisualAudit: false,
    })),
  )
  if (hasErrors(issues)) {
    return transitionFailed('execution complete', 'Execution completion failed. State was not changed.', issues)
  }
  const visualWork = hasVisualWork(context.options.root)
  return transitionDevViewState(context.options.root, 'execution complete', [DEVVIEW_STATE.EXECUTION_PACK_RUN_DONE], {
    completedSteps: ['run_execution_pack'],
    stage: 'execution_pack_running',
    mode: 'execution_pack_execution',
    deliveryStatus: 'verified',
    currentGate: null,
    nextStep: visualWork ? 'visual_implementation_audit' : 'review_result',
    data: {
      next: visualWork
        ? 'Run Visual Implementation Audit, then `devview review submit`.'
        : 'Submit for review with `devview review submit`.',
    },
  })
}
