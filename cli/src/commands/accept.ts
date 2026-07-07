import { defaultArtifacts } from '../core/project.js'
import { normalizePbeState, PBE_STATE } from '../core/state-machine.js'
import { transitionPbeState } from '../core/state-transition.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { hasErrors, issue } from '../core/types.js'
import {
  validateAcceptedActors,
  validateEvidence,
  validateFileChanges,
  validateTraceability,
  validateVisualDesign,
} from '../validators/pbe-validators.js'
import { type CommandContext, hasUserAcceptedBranch, loadState, transitionBlocked, transitionFailed } from './shared.js'

export async function acceptCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const state = await loadState(context.options.root)
  const currentState =
    typeof state?.autoflow === 'object' && state.autoflow !== null
      ? normalizePbeState((state.autoflow as Record<string, unknown>).state)
      : null
  if (state && currentState !== PBE_STATE.WAITING_REVIEW_RESULT) {
    return transitionBlocked('accept', 'Accept blocked. State was not changed.', [
      issue({
        validator: 'StateTransition',
        code: 'ACCEPT_STATE_BLOCKED',
        severity: 'error',
        file: defaultArtifacts.pbeState,
        message: `devview accept can run only from WAITING_REVIEW_RESULT. Current state is ${String(currentState || 'unknown')}.`,
        suggestedFix:
          'Submit verified work with `devview review submit`, then record user approval and rerun `devview accept`.',
      }),
    ])
  }
  issues.push(...(await validateAcceptedActors(context.options.root)))
  issues.push(...(await validateTraceability(context.options.root, { stage: 'accept' })))
  issues.push(
    ...(await validateEvidence(context.options.root, {
      stage: 'accept',
    })),
  )
  issues.push(...(await validateVisualDesign(context.options.root, { requireEvidence: true })))
  issues.push(...(await validateFileChanges(context.options.root, { enforceReviewGuard: true })))
  const userAccepted = await hasUserAcceptedBranch(context.options.root)
  if (!userAccepted) {
    issues.push(
      issue({
        validator: 'Acceptance',
        code: 'USER_APPROVAL_REQUIRED',
        severity: 'error',
        file: defaultArtifacts.acceptanceTree,
        message: 'DevView cannot move to ACCEPTED or DONE until Acceptance Tree records decisionSource.actor = "user".',
        suggestedFix: 'Record the explicit user approval in acceptance-tree.json, then rerun `devview accept`.',
      }),
    )
  }
  if (hasErrors(issues)) {
    return transitionFailed('accept', 'Accept failed. State was not changed.', issues)
  }
  return transitionPbeState(context.options.root, 'accept', [PBE_STATE.ACCEPTED, PBE_STATE.DONE], {
    completedSteps: ['complete'],
    stage: 'complete',
    deliveryStatus: 'accepted',
    currentGate: null,
    nextStep: null,
    lastUserAction: 'approve',
    actor: 'user',
    acceptance: {
      setBy: 'user',
      acceptedAt: new Date().toISOString(),
      acceptanceSource: 'explicit_user_reply',
      reviewGateId: 'review_result',
    },
    data: {
      next: 'DevView branch/slice is DONE. Start a new slice only through scope selection.',
    },
  })
}
