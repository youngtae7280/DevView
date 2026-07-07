import { PBE_STATE } from '../core/state-machine.js'
import { transitionPbeState } from '../core/state-transition.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode, hasErrors } from '../core/types.js'
import { validateRpd } from '../validators/pbe-validators.js'
import { checkResult, type CommandContext, hasUiWork } from './shared.js'

export async function rpdCheckCommand(context: CommandContext): Promise<CommandResult> {
  return checkResult('product-intake check', await validateRpd(context.options.root, { completionMode: true }))
}

export async function rpdCloseCommand(context: CommandContext): Promise<CommandResult> {
  const issues = await validateRpd(context.options.root, { completionMode: true })
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
  return transitionPbeState(
    context.options.root,
    'product-intake close',
    uiWork ? [PBE_STATE.PRODUCT_INTAKE_DONE, PBE_STATE.WAITING_UI_UX_CONFIRM] : [PBE_STATE.PRODUCT_INTAKE_DONE],
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
