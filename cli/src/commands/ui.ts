import { defaultArtifacts } from '../core/project.js'
import { DEVVIEW_STATE } from '../core/state-machine.js'
import { transitionDevViewState } from '../core/state-transition.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { hasErrors, issue } from '../core/types.js'
import { validateProductIntake } from '../validators/devview-validators.js'
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
        suggestedFix:
          'Continue to Work Planning and use `devview work-planning close` after Work Planning artifacts are ready.',
      }),
    )
  }
  issues.push(...(await validateProductIntake(context.options.root, { completionMode: true })))
  issues.push(...uiUxConfirmationArtifactIssues(context.options.root))
  if (hasErrors(issues)) {
    return transitionFailed('ui approve', 'UI/UX approval failed. State was not changed.', issues)
  }
  const visualWork = hasVisualWork(context.options.root)
  return transitionDevViewState(
    context.options.root,
    'ui approve',
    [DEVVIEW_STATE.WAITING_UI_UX_CONFIRM, DEVVIEW_STATE.UI_UX_APPROVED],
    {
      completedSteps: ['ui_ux_confirm'],
      stage: 'ui_ux_confirm',
      mode: 'ui_ux_confirmation',
      currentGate: null,
      nextStep: visualWork ? 'visual_reference_intake' : 'work_planning',
      lastUserAction: 'approve',
      actor: 'user',
      data: {
        next: visualWork
          ? 'Create Visual Design Contract, then run `devview work-planning close`.'
          : 'Derive Work Planning artifacts, then run `devview work-planning close`.',
      },
    },
  )
}
