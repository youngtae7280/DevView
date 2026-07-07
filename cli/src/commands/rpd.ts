import { PBE_STATE } from '../core/state-machine.js'
import { transitionPbeState } from '../core/state-transition.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode, hasErrors } from '../core/types.js'
import { validateRpd } from '../validators/pbe-validators.js'
import { checkResult, type CommandContext, hasUiWork } from './shared.js'

export async function rpdCheckCommand(context: CommandContext): Promise<CommandResult> {
  return checkResult('rpd check', await validateRpd(context.options.root, { completionMode: true }))
}

export async function rpdCloseCommand(context: CommandContext): Promise<CommandResult> {
  const issues = await validateRpd(context.options.root, { completionMode: true })
  if (hasErrors(issues)) {
    return {
      ok: false,
      command: 'rpd close',
      exitCode: ExitCode.ValidationFailed,
      message: 'RPD close failed. State was not changed.',
      issues,
    }
  }

  const uiWork = hasUiWork(context.options.root)
  return transitionPbeState(
    context.options.root,
    'rpd close',
    uiWork ? [PBE_STATE.RPD_DONE, PBE_STATE.WAITING_UI_UX_CONFIRM] : [PBE_STATE.RPD_DONE],
    {
      completedSteps: ['rpd'],
      stage: 'rpd',
      mode: 'rpd_tree_walk',
      currentGate: uiWork ? 'ui_ux_confirm' : null,
      nextStep: uiWork ? 'ui_ux_confirm' : 'wpd',
      data: {
        next: uiWork
          ? 'Confirm UI/UX with `devview ui approve` before WPD.'
          : 'Run `devview wpd close` after WPD artifacts are ready.',
      },
    },
  )
}
