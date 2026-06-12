import { PBE_STATE } from '../core/state-machine.js'
import { transitionPbeState } from '../core/state-transition.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { hasErrors } from '../core/types.js'
import { validateRevisionReady } from '../validators/pbe-validators.js'
import { type CommandContext, transitionFailed } from './shared.js'

export async function revisionStartCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(...(await validateRevisionReady(context.options.root, context.options.change)))
  if (hasErrors(issues)) {
    return transitionFailed('revision start', 'Revision start failed. State was not changed.', issues)
  }
  return transitionPbeState(context.options.root, 'revision start', [PBE_STATE.REVISION_REQUESTED], {
    completedSteps: ['revision_start'],
    stage: 'revision',
    mode: 'revision_control',
    deliveryStatus: 'revision_requested',
    currentGate: null,
    nextStep: 'revision_complete',
    data: {
      changeId: context.options.change,
      next: 'Revise only affected nodes from Impact Tree, refresh tests/evidence, then run `pbe revision complete --change <id>`.',
    },
  })
}

export async function revisionCompleteCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(...(await validateRevisionReady(context.options.root, context.options.change)))
  if (hasErrors(issues)) {
    return transitionFailed('revision complete', 'Revision completion failed. State was not changed.', issues)
  }
  return transitionPbeState(context.options.root, 'revision complete', [PBE_STATE.WPD_IN_PROGRESS], {
    completedSteps: ['revision_complete'],
    stage: 'wpd',
    mode: 'revision_reverification',
    deliveryStatus: 'revision_in_progress',
    currentGate: null,
    nextStep: 'wpd',
    data: {
      changeId: context.options.change,
      next: 'Revision does not close as DONE. Continue through `pbe wpd close`, `pbe vd close`, ACEP execution, review, and user accept.',
    },
  })
}
