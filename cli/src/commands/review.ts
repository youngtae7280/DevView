import { PBE_STATE } from '../core/state-machine.js'
import { transitionPbeState } from '../core/state-transition.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { hasErrors } from '../core/types.js'
import {
  validateEvidence,
  validateFileChanges,
  validateTraceability,
  validateVisualDesign,
} from '../validators/pbe-validators.js'
import { type CommandContext, hasVisualWork, transitionFailed } from './shared.js'

export async function reviewSubmitCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(...(await validateTraceability(context.options.root, { stage: 'review' })))
  issues.push(
    ...(await validateEvidence(context.options.root, {
      stage: 'review',
    })),
  )
  issues.push(...(await validateVisualDesign(context.options.root, { requireEvidence: true })))
  issues.push(...(await validateFileChanges(context.options.root, { enforceReviewGuard: true })))
  if (hasErrors(issues)) {
    return transitionFailed('review submit', 'Review submit failed. State was not changed.', issues)
  }
  const visualWork = hasVisualWork(context.options.root)
  return transitionPbeState(
    context.options.root,
    'review submit',
    visualWork ? [PBE_STATE.VISUAL_AUDIT_DONE, PBE_STATE.WAITING_REVIEW_RESULT] : [PBE_STATE.WAITING_REVIEW_RESULT],
    {
      completedSteps: visualWork ? ['visual_implementation_audit', 'review_result'] : ['review_result'],
      stage: 'complete',
      deliveryStatus: 'submitted_for_review',
      currentGate: 'review_result',
      nextStep: 'review_result',
      data: {
        next: 'Wait for user review. Only the user can approve with accepted metadata before `pbe accept`.',
      },
    },
  )
}
