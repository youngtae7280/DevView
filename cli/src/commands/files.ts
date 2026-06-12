import type { CommandResult } from '../core/types.js'
import { validateFileChanges } from '../validators/pbe-validators.js'
import { checkResult, type CommandContext } from './shared.js'

export async function filesCheckCommand(context: CommandContext): Promise<CommandResult> {
  return checkResult('files check', await validateFileChanges(context.options.root))
}
