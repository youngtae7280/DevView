import { existsSync } from 'node:fs'
import path from 'node:path'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { ExitCode, hasErrors, issue } from '../core/types.js'
import {
  validateAcceptedActors,
  validateChangeTree,
  validateImpactTree,
  validateState,
  validateVisualDesign,
} from '../validators/pbe-validators.js'
import { type CommandContext, runNodeScript } from './shared.js'

export async function validateCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const validators = [
    {
      name: 'legacy validate:pbe',
      code: 'LEGACY_PBE_VALIDATOR_FAILED',
      script: path.join(context.env.pluginRoot, 'scripts', 'validate-pbe-files.js'),
    },
    {
      name: 'v2 tree system',
      code: 'V2_TREE_VALIDATOR_FAILED',
      script: path.join(context.env.pluginRoot, 'scripts', 'validate-pbe-tree-system.js'),
    },
  ]

  const reports: Array<{ name: string; ok: boolean; output: string }> = []
  for (const validator of validators) {
    const result = runNodeScript(validator.script, context.options.root)
    reports.push({ name: validator.name, ok: result.ok, output: result.output })
    if (!result.ok) {
      issues.push(
        issue({
          validator: validator.name,
          code: validator.code,
          severity: 'error',
          message: result.output || `${validator.name} failed.`,
          suggestedFix: 'Fix the validator output before advancing PBE gates.',
        }),
      )
    }
  }

  if (existsSync(path.join(context.options.root, '.pbe'))) {
    issues.push(...(await validateState(context.options.root)))
    issues.push(...(await validateAcceptedActors(context.options.root)))
    issues.push(...(await validateChangeTree(context.options.root)))
    issues.push(...(await validateImpactTree(context.options.root)))
    issues.push(...(await validateVisualDesign(context.options.root)))
  }

  return {
    ok: !hasErrors(issues),
    command: 'validate',
    exitCode: hasErrors(issues) ? ExitCode.ValidationFailed : ExitCode.Success,
    message: hasErrors(issues) ? 'PBE validation failed.' : 'PBE validation passed.',
    issues,
    data: {
      validators: reports,
    },
  }
}
