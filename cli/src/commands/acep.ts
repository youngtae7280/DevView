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
  return checkResult('execution-pack check', await validateAcep(context.options.root))
}

export async function acepReadyCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const state = await loadState(context.options.root)
  issues.push(...implementationScopeIssues(state))
  issues.push(...preAcepCheckpointIssues(state))
  issues.push(...(await validateAcep(context.options.root)))
  if (hasErrors(issues)) {
    return transitionFailed('execution-pack ready', 'Execution Pack ready failed. State was not changed.', issues)
  }
  return transitionPbeState(context.options.root, 'execution-pack ready', [PBE_STATE.EXECUTION_PACK_READY], {
    completedSteps: ['generate_execution_pack'],
    stage: 'execution_pack_ready',
    mode: 'execution_pack_generation',
    currentGate: null,
    nextStep: 'run_execution_pack',
    data: {
      next: 'Start Execution Pack runtime work with `devview execution start`, attach evidence, then run `devview execution complete`.',
    },
  })
}
