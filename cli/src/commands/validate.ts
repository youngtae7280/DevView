import { existsSync } from 'node:fs'
import path from 'node:path'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { ExitCode, hasErrors, issue } from '../core/types.js'
import {
  validateAcceptedActors,
  validateChangeTree,
  validateImpactTree,
  validateProductPatchTree,
  validateState,
  validateVisualDesign,
} from '../validators/devview-validators.js'
import { type CommandContext, runNodeScript } from './shared.js'

export async function validateCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const validators = [
    {
      name: 'DevView repository validator',
      code: 'DEVVIEW_REPOSITORY_VALIDATOR_FAILED',
      script: path.join(context.env.pluginRoot, 'scripts', 'validate-devview-files.js'),
    },
    {
      name: 'DevView legacy tree system',
      code: 'DEVVIEW_LEGACY_TREE_VALIDATOR_FAILED',
      script: path.join(context.env.pluginRoot, 'scripts', 'validate-devview-legacy-tree-system.js'),
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
          suggestedFix: 'Fix the validator output before advancing DevView gates.',
        }),
      )
    }
  }

  if (existsSync(path.join(context.options.root, '.devview'))) {
    issues.push(...(await validateState(context.options.root)))
    issues.push(...(await validateAcceptedActors(context.options.root)))
    issues.push(...(await validateChangeTree(context.options.root)))
    issues.push(...(await validateImpactTree(context.options.root)))
    issues.push(...(await validateProductPatchTree(context.options.root)))
    issues.push(...(await validateVisualDesign(context.options.root)))
  }

  return {
    ok: !hasErrors(issues),
    command: 'validate',
    exitCode: hasErrors(issues) ? ExitCode.ValidationFailed : ExitCode.Success,
    message: hasErrors(issues) ? 'DevView validation failed.' : 'DevView validation passed.',
    issues,
    data: {
      validators: reports,
    },
  }
}
