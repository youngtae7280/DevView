import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts } from '../core/project.js'
import { readJsonSafe } from '../core/fs.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import { arrayObjects, stringValue, type JsonObject } from './shared.js'
import { impactAffectedIds, impactChangeId } from './impact-validator.js'

export async function validateRevisionReady(root: string, changeId: string | undefined): Promise<ValidationIssue[]> {
  if (!changeId) {
    return [
      issue({
        validator: 'Revision',
        code: 'REVISION_CHANGE_REQUIRED',
        severity: 'error',
        message: 'Revision command requires --change <CH-*>.',
        suggestedFix: 'Pass the Change node id created by `pbe change create`.',
      }),
    ]
  }

  const changeTreePath = artifactPath(root, 'changeTree')
  const impactTreePath = artifactPath(root, 'impactTree')
  if (!existsSync(changeTreePath)) {
    return [
      issue({
        validator: 'Revision',
        code: 'CHANGE_TREE_MISSING',
        severity: 'error',
        file: defaultArtifacts.changeTree,
        message: 'Revision requires Change Tree.',
        suggestedFix: 'Run `pbe init` or restore change-tree.json.',
      }),
    ]
  }
  if (!existsSync(impactTreePath)) {
    return [
      issue({
        validator: 'Revision',
        code: 'IMPACT_TREE_MISSING',
        severity: 'error',
        file: defaultArtifacts.impactTree,
        message: 'Revision requires Impact Tree.',
        suggestedFix: 'Run `pbe impact analyze --change <id> ...` before starting revision.',
      }),
    ]
  }

  const changeTree = await readJsonSafe<JsonObject>(changeTreePath)
  if (!changeTree.ok) {
    return [
      issue({
        validator: 'Revision',
        code: 'CHANGE_TREE_INVALID_JSON',
        severity: 'error',
        file: defaultArtifacts.changeTree,
        message: `Could not parse Change Tree: ${changeTree.error}`,
        suggestedFix: 'Fix change-tree.json before starting revision.',
      }),
    ]
  }
  const impactTree = await readJsonSafe<JsonObject>(impactTreePath)
  if (!impactTree.ok) {
    return [
      issue({
        validator: 'Revision',
        code: 'IMPACT_TREE_INVALID_JSON',
        severity: 'error',
        file: defaultArtifacts.impactTree,
        message: `Could not parse Impact Tree: ${impactTree.error}`,
        suggestedFix: 'Fix impact-tree.json before starting revision.',
      }),
    ]
  }

  const change = arrayObjects(changeTree.value.changes).find((entry) => stringValue(entry.id) === changeId)
  if (!change) {
    return [
      issue({
        validator: 'Revision',
        code: 'REVISION_CHANGE_NOT_FOUND',
        severity: 'error',
        file: defaultArtifacts.changeTree,
        nodeId: changeId,
        message: `Cannot start revision for missing Change node ${changeId}.`,
        suggestedFix: 'Create the Change node or pass a valid --change id.',
      }),
    ]
  }

  const impacts = arrayObjects(impactTree.value.impacts).filter((entry) => impactChangeId(entry) === changeId)
  if (impacts.length === 0) {
    return [
      issue({
        validator: 'Revision',
        code: 'REVISION_IMPACT_MISSING',
        severity: 'error',
        file: defaultArtifacts.impactTree,
        nodeId: changeId,
        message: `Change node ${changeId} has no Impact analysis.`,
        suggestedFix: 'Run `pbe impact analyze --change <id> --product/--work/--test/--evidence ...` first.',
      }),
    ]
  }

  if (impacts.every((entry) => impactAffectedIds(entry).length === 0)) {
    return [
      issue({
        validator: 'Revision',
        code: 'REVISION_IMPACT_AFFECTED_IDS_MISSING',
        severity: 'error',
        file: defaultArtifacts.impactTree,
        nodeId: changeId,
        message: `Change node ${changeId} has Impact analysis, but no affected nodes are recorded.`,
        suggestedFix: 'Record affected Product/Work/Test/Evidence/Acceptance ids before starting revision.',
      }),
    ]
  }

  return []
}
