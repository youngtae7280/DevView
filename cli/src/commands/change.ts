import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts } from '../core/project.js'
import { readJsonSafe, writeJsonAtomic } from '../core/fs.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { ExitCode, hasErrors, issue } from '../core/types.js'
import { validateChangeTree } from '../validators/pbe-validators.js'
import { arrayObjects, stringValue, type JsonObject } from '../validators/shared.js'
import { type CommandContext, transitionFailed } from './shared.js'

export async function changeCreateCommand(context: CommandContext): Promise<CommandResult> {
  const root = context.options.root
  const summary = context.options.summary?.trim()
  const issues: ValidationIssue[] = []
  if (!summary) {
    issues.push(
      issue({
        validator: 'Change',
        code: 'CHANGE_SUMMARY_MISSING',
        severity: 'error',
        message: 'pbe change create requires --summary.',
        suggestedFix: 'Run `pbe change create --summary "Describe the user feedback"`.',
      }),
    )
  }
  issues.push(...(await validateChangeTree(root, { requireExists: true })))
  if (hasErrors(issues)) {
    return transitionFailed('change create', 'Change creation failed. Change Tree was not changed.', issues)
  }

  const changeTreePath = artifactPath(root, 'changeTree')
  const parsed = await readJsonSafe<JsonObject>(changeTreePath)
  if (!parsed.ok) {
    return invalidJsonResult('change create', defaultArtifacts.changeTree, parsed.error)
  }

  const changes = arrayObjects(parsed.value.changes)
  const id = nextNodeId(changes, 'CH')
  const now = new Date().toISOString()
  const change = {
    id,
    type: 'feedback',
    source: context.options.source || 'user_feedback',
    summary,
    status: 'proposed',
    createdAt: now,
    affectedProductNodeIds: [],
    affectedWorkNodeIds: [],
    affectedTestNodeIds: [],
    affectedEvidenceNodeIds: [],
    affectedAcceptanceNodeIds: [],
  }
  parsed.value.changes = [...changes, change]
  parsed.value.generatedAt = now
  await writeJsonAtomic(changeTreePath, parsed.value)

  return {
    ok: true,
    command: 'change create',
    exitCode: ExitCode.Success,
    message: `Created Change node ${id}.`,
    issues: [],
    data: {
      changeId: id,
      change,
      next: `Run pbe impact analyze --change ${id} with affected node ids before starting revision.`,
    },
  }
}

export function nextNodeId(nodes: JsonObject[], prefix: string): string {
  const max = nodes
    .map((entry) => stringValue(entry.id))
    .map((id) => {
      const match = new RegExp(`^${prefix}[-_](\\d+)$`, 'i').exec(id)
      return match ? Number.parseInt(match[1], 10) : 0
    })
    .reduce((highest, value) => Math.max(highest, value), 0)
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}

export async function readRequiredJsonArtifact(
  command: string,
  root: string,
  key: 'changeTree' | 'impactTree',
): Promise<{ ok: true; path: string; value: JsonObject } | { ok: false; result: CommandResult }> {
  const filePath = artifactPath(root, key)
  if (!existsSync(filePath)) {
    return {
      ok: false,
      result: {
        ok: false,
        command,
        exitCode: ExitCode.ValidationFailed,
        message: `${command} failed. ${defaultArtifacts[key]} is missing.`,
        issues: [
          issue({
            validator: command,
            code: `${String(key)
              .replace(/[A-Z]/g, (match) => `_${match}`)
              .toUpperCase()}_MISSING`,
            severity: 'error',
            file: defaultArtifacts[key],
            message: `${defaultArtifacts[key]} is missing.`,
            suggestedFix: 'Run `pbe init` or restore the missing control artifact.',
          }),
        ],
      },
    }
  }
  const parsed = await readJsonSafe<JsonObject>(filePath)
  if (!parsed.ok) {
    return {
      ok: false,
      result: invalidJsonResult(command, defaultArtifacts[key], parsed.error),
    }
  }
  return { ok: true, path: filePath, value: parsed.value }
}

function invalidJsonResult(command: string, file: string, error: string): CommandResult {
  return {
    ok: false,
    command,
    exitCode: ExitCode.SchemaError,
    message: `${command} failed. ${file} was not changed.`,
    issues: [
      issue({
        validator: command,
        code: 'CONTROL_ARTIFACT_INVALID_JSON',
        severity: 'error',
        file,
        message: error,
        suggestedFix: 'Fix JSON syntax before rerunning the command.',
      }),
    ],
  }
}
