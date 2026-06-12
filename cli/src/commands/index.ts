import type { CommandResult } from '../core/types.js'
import { validateEvidence, validateTraceability, validateVisualDesign } from '../validators/pbe-validators.js'
import { acceptCommand } from './accept.js'
import { acepCheckCommand, acepReadyCommand } from './acep.js'
import { changeCreateCommand } from './change.js'
import { executionCompleteCommand, executionStartCommand } from './execution.js'
import { gateCommand } from './gate.js'
import { impactAnalyzeCommand } from './impact.js'
import { initCommand } from './init.js'
import { reviewSubmitCommand } from './review.js'
import { revisionCompleteCommand, revisionStartCommand } from './revision.js'
import { rpdCheckCommand, rpdCloseCommand } from './rpd.js'
import {
  coverageAuditCompleteCommand,
  dependencyAuditCompleteCommand,
  planExecutionCompleteCommand,
  scopeSelectCommand,
  uxAuditCompleteCommand,
} from './scope.js'
import { checkResult, type CommandContext, invalidCommand } from './shared.js'
import { statusCommand } from './status.js'
import { uiApproveCommand } from './ui.js'
import { validateCommand } from './validate.js'
import { vdCheckCommand, vdCloseCommand } from './vd.js'
import { wpdCheckCommand, wpdCloseCommand } from './wpd.js'

export async function runCommand(positionals: string[], context: CommandContext): Promise<CommandResult> {
  const [command, subcommand] = positionals
  if (!command) {
    return invalidCommand('No command provided.')
  }
  if (command === 'init') {
    return initCommand(context)
  }
  if (command === 'status') {
    return statusCommand(context)
  }
  if (command === 'validate') {
    return validateCommand(context)
  }
  if (command === 'gate') {
    return gateCommand(positionals[1], context)
  }
  if (command === 'rpd' && subcommand === 'check') {
    return rpdCheckCommand(context)
  }
  if (command === 'rpd' && subcommand === 'close') {
    return rpdCloseCommand(context)
  }
  if (command === 'ui' && subcommand === 'approve') {
    return uiApproveCommand(context)
  }
  if (command === 'trace' && subcommand === 'check') {
    return checkResult(
      'trace check',
      await validateTraceability(context.options.root, { stage: context.options.stage }),
    )
  }
  if (command === 'wpd' && subcommand === 'check') {
    return wpdCheckCommand(context)
  }
  if (command === 'wpd' && subcommand === 'close') {
    return wpdCloseCommand(context)
  }
  if (command === 'vd' && subcommand === 'check') {
    return vdCheckCommand(context)
  }
  if (command === 'vd' && subcommand === 'close') {
    return vdCloseCommand(context)
  }
  if (command === 'scope' && subcommand === 'select') {
    return scopeSelectCommand(context)
  }
  if (command === 'dependency' && subcommand === 'audit' && positionals[2] === 'complete') {
    return dependencyAuditCompleteCommand(context)
  }
  if (command === 'plan' && subcommand === 'execution' && positionals[2] === 'complete') {
    return planExecutionCompleteCommand(context)
  }
  if (command === 'coverage' && subcommand === 'audit' && positionals[2] === 'complete') {
    return coverageAuditCompleteCommand(context)
  }
  if (command === 'ux' && subcommand === 'audit' && positionals[2] === 'complete') {
    return uxAuditCompleteCommand(context)
  }
  if (command === 'acep' && subcommand === 'check') {
    return acepCheckCommand(context)
  }
  if (command === 'acep' && subcommand === 'ready') {
    return acepReadyCommand(context)
  }
  if (command === 'execution' && subcommand === 'start') {
    return executionStartCommand(context)
  }
  if (command === 'execution' && subcommand === 'complete') {
    return executionCompleteCommand(context)
  }
  if (command === 'review' && subcommand === 'submit') {
    return reviewSubmitCommand(context)
  }
  if (command === 'accept') {
    return acceptCommand(context)
  }
  if (command === 'change' && subcommand === 'create') {
    return changeCreateCommand(context)
  }
  if (command === 'impact' && subcommand === 'analyze') {
    return impactAnalyzeCommand(context)
  }
  if (command === 'revision' && subcommand === 'start') {
    return revisionStartCommand(context)
  }
  if (command === 'revision' && subcommand === 'complete') {
    return revisionCompleteCommand(context)
  }
  if (command === 'evidence' && subcommand === 'check') {
    return checkResult('evidence check', await validateEvidence(context.options.root))
  }
  if (command === 'visual' && subcommand === 'check') {
    return checkResult('visual check', await validateVisualDesign(context.options.root))
  }
  return invalidCommand(`Unknown command: ${positionals.join(' ')}`)
}

export type { CommandContext }
