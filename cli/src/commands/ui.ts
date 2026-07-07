import { defaultArtifacts } from '../core/project.js'
import { PBE_STATE } from '../core/state-machine.js'
import { transitionPbeState } from '../core/state-transition.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { hasErrors, issue } from '../core/types.js'
import { validateRpd } from '../validators/pbe-validators.js'
import {
  type CommandContext,
  hasUiWork,
  hasVisualWork,
  transitionFailed,
  uiUxConfirmationArtifactIssues,
} from './shared.js'

export async function uiApproveCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  if (!hasUiWork(context.options.root)) {
    issues.push(
      issue({
        validator: 'Gate',
        code: 'UI_UX_NOT_REQUIRED',
        severity: 'error',
        file: defaultArtifacts.productTree,
        message: 'No UI/UX work was detected, so UI/UX approval should not create a state transition.',
        suggestedFix: 'Continue to WPD and use `devview wpd close` after WPD artifacts are ready.',
      }),
    )
  }
  issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
  issues.push(...uiUxConfirmationArtifactIssues(context.options.root))
  if (hasErrors(issues)) {
    return transitionFailed('ui approve', 'UI/UX approval failed. State was not changed.', issues)
  }
  const visualWork = hasVisualWork(context.options.root)
  return transitionPbeState(
    context.options.root,
    'ui approve',
    [PBE_STATE.WAITING_UI_UX_CONFIRM, PBE_STATE.UI_UX_APPROVED],
    {
      completedSteps: ['ui_ux_confirm'],
      stage: 'ui_ux_confirm',
      mode: 'ui_ux_confirmation',
      currentGate: null,
      nextStep: visualWork ? 'visual_reference_intake' : 'wpd',
      lastUserAction: 'approve',
      actor: 'user',
      data: {
        next: visualWork
          ? 'Create Visual Design Contract, then run `devview wpd close`.'
          : 'Derive WPD artifacts, then run `devview wpd close`.',
      },
    },
  )
}
