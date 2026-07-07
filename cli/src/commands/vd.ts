import { PBE_STATE } from '../core/state-machine.js'
import { transitionPbeState } from '../core/state-transition.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { hasErrors } from '../core/types.js'
import {
  validateRpd,
  validateTraceability,
  validateVd,
  validateVisualDesign,
  validateWpd,
} from '../validators/pbe-validators.js'
import { checkResult, type CommandContext, hasVisualWork, transitionFailed } from './shared.js'

export async function vdCheckCommand(context: CommandContext): Promise<CommandResult> {
  return checkResult('verification-design check', await validateVd(context.options.root))
}

export async function vdCloseCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const visualWork = hasVisualWork(context.options.root)
  issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
  issues.push(...(await validateWpd(context.options.root)))
  issues.push(...(await validateVisualDesign(context.options.root)))
  issues.push(...(await validateVd(context.options.root)))
  issues.push(...(await validateTraceability(context.options.root, { stage: 'verification-design' })))
  if (hasErrors(issues)) {
    return transitionFailed(
      'verification-design close',
      'Verification Design close failed. State was not changed.',
      issues,
    )
  }
  return transitionPbeState(
    context.options.root,
    'verification-design close',
    visualWork
      ? [PBE_STATE.UI_SURFACE_INVENTORY_DONE, PBE_STATE.VERIFICATION_DESIGN_DONE]
      : [PBE_STATE.VERIFICATION_DESIGN_DONE],
    {
      completedSteps: visualWork ? ['ui_surface_inventory', 'verification_design'] : ['verification_design'],
      stage: 'verification_design',
      mode: 'verification_design',
      currentGate: 'implementation_scope',
      nextStep: 'implementation_scope',
      data: {
        next: 'Select implementation scope with `devview scope select` after the user approves the current slice scope.',
      },
    },
  )
}
