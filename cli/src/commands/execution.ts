import { PBE_STATE } from '../core/state-machine.js'
import { transitionPbeState } from '../core/state-transition.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { hasErrors } from '../core/types.js'
import { validateAcep, validateEvidence, validateTraceability } from '../validators/pbe-validators.js'
import { type CommandContext, hasVisualWork, transitionFailed } from './shared.js'

export async function executionStartCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(...(await validateAcep(context.options.root)))
  if (hasErrors(issues)) {
    return transitionFailed('execution start', 'Execution start failed. State was not changed.', issues)
  }
  return transitionPbeState(context.options.root, 'execution start', [PBE_STATE.EXECUTION_IN_PROGRESS], {
    completedSteps: ['execution_start'],
    stage: 'acep_running',
    mode: 'acep_execution',
    currentGate: null,
    nextStep: 'run_acep',
    data: {
      next: 'Execute the ACEP, attach evidence, then run `devview execution complete`.',
    },
  })
}

export async function executionCompleteCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(...(await validateAcep(context.options.root)))
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
  return transitionPbeState(context.options.root, 'execution complete', [PBE_STATE.ACEP_RUN_DONE], {
    completedSteps: ['run_acep'],
    stage: 'acep_running',
    mode: 'acep_execution',
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
