import { PBE_STATE } from '../core/state-machine.js'
import { transitionPbeState } from '../core/state-transition.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { hasErrors } from '../core/types.js'
import { validateRpd, validateVisualDesign, validateWpd } from '../validators/pbe-validators.js'
import {
  checkResult,
  type CommandContext,
  hasVisualWork,
  loadState,
  transitionFailed,
  uiUxApprovalIssues,
} from './shared.js'

export async function wpdCheckCommand(context: CommandContext): Promise<CommandResult> {
  return checkResult('wpd check', await validateWpd(context.options.root))
}

export async function wpdCloseCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const visualWork = hasVisualWork(context.options.root)
  issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
  issues.push(...uiUxApprovalIssues(context.options.root, await loadState(context.options.root)))
  issues.push(...(await validateVisualDesign(context.options.root, { requireInventory: false })))
  issues.push(...(await validateWpd(context.options.root)))
  if (hasErrors(issues)) {
    return transitionFailed('wpd close', 'WPD close failed. State was not changed.', issues)
  }
  return transitionPbeState(
    context.options.root,
    'wpd close',
    visualWork ? [PBE_STATE.VISUAL_CONTRACT_READY, PBE_STATE.WPD_DONE] : [PBE_STATE.WPD_DONE],
    {
      completedSteps: visualWork ? ['visual_reference_intake', 'design_system_derive', 'wpd'] : ['wpd'],
      stage: 'wpd',
      mode: 'wpd_generation',
      currentGate: null,
      nextStep: visualWork ? 'ui_surface_inventory' : 'vd',
      data: {
        next: visualWork
          ? 'Run UI Surface Inventory, then `devview vd close`.'
          : 'Run `devview vd close` after VD artifacts are ready.',
      },
    },
  )
}
