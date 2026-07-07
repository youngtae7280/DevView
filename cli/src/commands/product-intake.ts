import { DEVVIEW_STATE } from '../core/state-machine.js'
import { transitionDevViewState } from '../core/state-transition.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode, hasErrors } from '../core/types.js'
import { validateProductIntake } from '../validators/devview-validators.js'
import { checkResult, type CommandContext, hasUiWork } from './shared.js'

export async function productIntakeCheckCommand(context: CommandContext): Promise<CommandResult> {
  return checkResult(
    'product-intake check',
    await validateProductIntake(context.options.root, { completionMode: true }),
  )
}

export async function productIntakeCloseCommand(context: CommandContext): Promise<CommandResult> {
  const issues = await validateProductIntake(context.options.root, { completionMode: true })
  if (hasErrors(issues)) {
    return {
      ok: false,
      command: 'product-intake close',
      exitCode: ExitCode.ValidationFailed,
      message: 'Product Intake close failed. State was not changed.',
      issues,
    }
  }

  const uiWork = hasUiWork(context.options.root)
  return transitionDevViewState(
    context.options.root,
    'product-intake close',
    uiWork
      ? [DEVVIEW_STATE.PRODUCT_INTAKE_DONE, DEVVIEW_STATE.WAITING_UI_UX_CONFIRM]
      : [DEVVIEW_STATE.PRODUCT_INTAKE_DONE],
    {
      completedSteps: ['product_intake'],
      stage: 'product_intake',
      mode: 'product_intake',
      currentGate: uiWork ? 'ui_ux_confirm' : null,
      nextStep: uiWork ? 'ui_ux_confirm' : 'work_planning',
      data: {
        next: uiWork
          ? 'Confirm UI/UX with `devview ui approve` before Work Planning.'
          : 'Run `devview work-planning close` after Work Planning artifacts are ready.',
      },
    },
  )
}
