import { PBE_STATE } from '../core/state-machine.js'
import { transitionPbeState } from '../core/state-transition.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { hasErrors } from '../core/types.js'
import { validateAcep } from '../validators/pbe-validators.js'
import {
  checkResult,
  type CommandContext,
  implementationScopeIssues,
  loadState,
  preAcepCheckpointIssues,
  transitionFailed,
} from './shared.js'

export async function acepCheckCommand(context: CommandContext): Promise<CommandResult> {
  return checkResult('acep check', await validateAcep(context.options.root))
}

export async function acepReadyCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const state = await loadState(context.options.root)
  issues.push(...implementationScopeIssues(state))
  issues.push(...preAcepCheckpointIssues(state))
  issues.push(...(await validateAcep(context.options.root)))
  if (hasErrors(issues)) {
    return transitionFailed('acep ready', 'ACEP ready failed. State was not changed.', issues)
  }
  return transitionPbeState(context.options.root, 'acep ready', [PBE_STATE.ACEP_READY], {
    completedSteps: ['generate_acep'],
    stage: 'acep_ready',
    mode: 'acep_generation',
    currentGate: null,
    nextStep: 'run_acep',
    data: {
      next: 'Start ACEP execution with `pbe execution start`, attach evidence, then run `pbe execution complete`.',
    },
  })
}
