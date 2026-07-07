import { DEVVIEW_STATE } from '../core/state-machine.js'
import { transitionDevViewState } from '../core/state-transition.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { hasErrors } from '../core/types.js'
import { validateExecutionPack } from '../validators/devview-validators.js'
import {
  checkResult,
  type CommandContext,
  implementationScopeIssues,
  loadState,
  preAcepCheckpointIssues,
  transitionFailed,
} from './shared.js'

export async function executionPackCheckCommand(context: CommandContext): Promise<CommandResult> {
  return checkResult('execution-pack check', await validateExecutionPack(context.options.root))
}

export async function executionPackReadyCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const state = await loadState(context.options.root)
  issues.push(...implementationScopeIssues(state))
  issues.push(...preAcepCheckpointIssues(state))
  issues.push(...(await validateExecutionPack(context.options.root)))
  if (hasErrors(issues)) {
    return transitionFailed('execution-pack ready', 'Execution Pack ready failed. State was not changed.', issues)
  }
  return transitionDevViewState(context.options.root, 'execution-pack ready', [DEVVIEW_STATE.EXECUTION_PACK_READY], {
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
