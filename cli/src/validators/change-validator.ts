import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts } from '../core/project.js'
import { readJsonSafe } from '../core/fs.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import { arrayObjects, stringValue, type JsonObject } from './shared.js'

export async function validateChangeTree(
  root: string,
  options: { requireExists?: boolean } = {},
): Promise<ValidationIssue[]> {
  const filePath = artifactPath(root, 'changeTree')
  if (!existsSync(filePath)) {
    return options.requireExists
      ? [
          issue({
            validator: 'Change',
            code: 'CHANGE_TREE_MISSING',
            severity: 'error',
            file: defaultArtifacts.changeTree,
            message: 'Change Tree is missing.',
            suggestedFix: 'Run `pbe init` or restore .pbe/control/change-tree.json before creating changes.',
          }),
        ]
      : []
  }
  const parsed = await readJsonSafe<JsonObject>(filePath)
  if (!parsed.ok) {
    return [
      issue({
        validator: 'Change',
        code: 'CHANGE_TREE_INVALID_JSON',
        severity: 'error',
        file: defaultArtifacts.changeTree,
        message: `Could not parse Change Tree: ${parsed.error}`,
        suggestedFix: 'Fix change-tree.json syntax before running Change commands.',
      }),
    ]
  }
  return validateChangeTreeObject(parsed.value)
}

export function validateChangeTreeObject(changeTree: JsonObject): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seen = new Set<string>()
  for (const change of arrayObjects(changeTree.changes)) {
    const id = stringValue(change.id)
    if (!id) {
      issues.push(
        issue({
          validator: 'Change',
          code: 'CHANGE_ID_MISSING',
          severity: 'error',
          file: defaultArtifacts.changeTree,
          message: 'Change node is missing id.',
          suggestedFix: 'Assign a stable CH-* id before using the Change node.',
        }),
      )
    } else if (seen.has(id)) {
      issues.push(
        issue({
          validator: 'Change',
          code: 'CHANGE_ID_DUPLICATE',
          severity: 'error',
          file: defaultArtifacts.changeTree,
          nodeId: id,
          message: `Duplicate Change node id: ${id}.`,
          suggestedFix: 'Give each Change node a unique CH-* id.',
        }),
      )
    }
    seen.add(id)
    if (!stringValue(change.summary).trim()) {
      issues.push(
        issue({
          validator: 'Change',
          code: 'CHANGE_SUMMARY_MISSING',
          severity: 'error',
          file: defaultArtifacts.changeTree,
          nodeId: id,
          message: `Change node ${id || '<missing>'} is missing summary.`,
          suggestedFix: 'Record the user feedback or change request summary before continuing.',
        }),
      )
    }
  }
  return issues
}
