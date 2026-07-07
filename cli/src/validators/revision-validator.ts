import { existsSync } from 'node:fs'
import {
  artifactPath,
  canonicalStateArtifactRelativePath,
  defaultArtifacts,
  stateArtifactPath,
} from '../core/project.js'
import { readJsonSafe } from '../core/fs.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import { arrayObjects, arrayStrings, stringValue, type JsonObject } from './shared.js'
import { impactAffectedIds, impactChangeId } from './impact-validator.js'

export interface ActiveRevisionContext {
  changeNodeId: string
  impactNodeIds: string[]
  affectedProductNodeIds: string[]
  affectedWorkNodeIds: string[]
  affectedTestNodeIds: string[]
  affectedEvidenceNodeIds: string[]
  affectedAcceptanceNodeIds: string[]
  affectedNodeIds: string[]
  startedAt?: string
  completedAt?: string
  status: 'in_progress' | 'completed'
}

export async function validateRevisionReady(root: string, changeId: string | undefined): Promise<ValidationIssue[]> {
  return validateRevisionStart(root, changeId)
}

export async function validateRevisionStart(root: string, changeId: string | undefined): Promise<ValidationIssue[]> {
  const result = await buildRevisionContext(root, changeId)
  return result.issues
}

export async function validateRevisionComplete(root: string, changeId: string | undefined): Promise<ValidationIssue[]> {
  const contextResult = await buildRevisionContext(root, changeId)
  const issues = [...contextResult.issues]

  const statePath = stateArtifactPath(root)
  const state = await readJsonSafe<JsonObject>(statePath)
  if (!state.ok) {
    issues.push(
      issue({
        validator: 'Revision',
        code: 'PBE_STATE_INVALID_JSON',
        severity: 'error',
        file: canonicalStateArtifactRelativePath(root),
        message: `Could not parse devview-state.json: ${state.error}`,
        suggestedFix: 'Fix devview-state.json before completing revision.',
      }),
    )
    return issues
  }

  const activeRevision = activeRevisionContextOf(state.value.activeRevision)
  if (!activeRevision) {
    issues.push(
      issue({
        validator: 'Revision',
        code: 'REVISION_CONTEXT_MISSING',
        severity: 'error',
        file: canonicalStateArtifactRelativePath(root),
        nodeId: changeId,
        message: 'Revision completion requires an activeRevision context created by `devview revision start`.',
        suggestedFix: 'Run `devview revision start --change <id>` before completing revision.',
        nextCommand: changeId ? `devview revision start --change ${changeId}` : 'devview revision start',
      }),
    )
    return issues
  }

  if (changeId && activeRevision.changeNodeId !== changeId) {
    issues.push(
      issue({
        validator: 'Revision',
        code: 'REVISION_CHANGE_MISMATCH',
        severity: 'error',
        file: canonicalStateArtifactRelativePath(root),
        nodeId: changeId,
        message: `Active revision is for ${activeRevision.changeNodeId}, but command requested ${changeId}.`,
        suggestedFix: 'Complete the active revision change or restart revision with the intended Change node.',
        nextCommand: `devview revision start --change ${changeId}`,
      }),
    )
  }

  if (activeRevision.status !== 'in_progress') {
    issues.push(
      issue({
        validator: 'Revision',
        code: 'REVISION_CONTEXT_NOT_IN_PROGRESS',
        severity: 'error',
        file: canonicalStateArtifactRelativePath(root),
        nodeId: activeRevision.changeNodeId,
        message: `Active revision context is not in progress: ${activeRevision.status}.`,
        suggestedFix: 'Start a fresh revision context before completing revision work.',
        nextCommand: `devview revision start --change ${activeRevision.changeNodeId}`,
      }),
    )
  }

  if (revisionAffectedIds(activeRevision).length === 0) {
    issues.push(
      issue({
        validator: 'Revision',
        code: 'REVISION_ACTIVE_CONTEXT_EMPTY',
        severity: 'error',
        file: canonicalStateArtifactRelativePath(root),
        nodeId: activeRevision.changeNodeId,
        message: `Active revision ${activeRevision.changeNodeId} has no affected Product/Work/Test/Evidence/Acceptance ids.`,
        suggestedFix: 'Re-run Impact analysis with explicit affected ids, then restart revision.',
        nextCommand: `devview impact analyze --change ${activeRevision.changeNodeId}`,
      }),
    )
  }

  return issues
}

export async function buildRevisionContext(
  root: string,
  changeId: string | undefined,
  startedAt?: string,
): Promise<{ context: ActiveRevisionContext | null; issues: ValidationIssue[] }> {
  if (!changeId) {
    return {
      context: null,
      issues: [
        issue({
          validator: 'Revision',
          code: 'REVISION_CHANGE_REQUIRED',
          severity: 'error',
          message: 'Revision command requires --change <CH-*>.',
          suggestedFix: 'Pass the Change node id created by `devview change create`.',
        }),
      ],
    }
  }

  const changeTreePath = artifactPath(root, 'changeTree')
  const impactTreePath = artifactPath(root, 'impactTree')
  if (!existsSync(changeTreePath)) {
    return {
      context: null,
      issues: [
        issue({
          validator: 'Revision',
          code: 'CHANGE_TREE_MISSING',
          severity: 'error',
          file: defaultArtifacts.changeTree,
          message: 'Revision requires Change Tree.',
          suggestedFix: 'Run `devview init` or restore change-tree.json.',
        }),
      ],
    }
  }
  if (!existsSync(impactTreePath)) {
    return {
      context: null,
      issues: [
        issue({
          validator: 'Revision',
          code: 'IMPACT_TREE_MISSING',
          severity: 'error',
          file: defaultArtifacts.impactTree,
          message: 'Revision requires Impact Tree.',
          suggestedFix: 'Run `devview impact analyze --change <id> ...` before starting revision.',
        }),
      ],
    }
  }

  const changeTree = await readJsonSafe<JsonObject>(changeTreePath)
  if (!changeTree.ok) {
    return {
      context: null,
      issues: [
        issue({
          validator: 'Revision',
          code: 'CHANGE_TREE_INVALID_JSON',
          severity: 'error',
          file: defaultArtifacts.changeTree,
          message: `Could not parse Change Tree: ${changeTree.error}`,
          suggestedFix: 'Fix change-tree.json before starting revision.',
        }),
      ],
    }
  }
  const impactTree = await readJsonSafe<JsonObject>(impactTreePath)
  if (!impactTree.ok) {
    return {
      context: null,
      issues: [
        issue({
          validator: 'Revision',
          code: 'IMPACT_TREE_INVALID_JSON',
          severity: 'error',
          file: defaultArtifacts.impactTree,
          message: `Could not parse Impact Tree: ${impactTree.error}`,
          suggestedFix: 'Fix impact-tree.json before starting revision.',
        }),
      ],
    }
  }

  const change = arrayObjects(changeTree.value.changes).find((entry) => stringValue(entry.id) === changeId)
  if (!change) {
    return {
      context: null,
      issues: [
        issue({
          validator: 'Revision',
          code: 'REVISION_CHANGE_NOT_FOUND',
          severity: 'error',
          file: defaultArtifacts.changeTree,
          nodeId: changeId,
          message: `Cannot start revision for missing Change node ${changeId}.`,
          suggestedFix: 'Create the Change node or pass a valid --change id.',
        }),
      ],
    }
  }

  const impacts = arrayObjects(impactTree.value.impacts).filter((entry) => impactChangeId(entry) === changeId)
  if (impacts.length === 0) {
    return {
      context: null,
      issues: [
        issue({
          validator: 'Revision',
          code: 'REVISION_IMPACT_MISSING',
          severity: 'error',
          file: defaultArtifacts.impactTree,
          nodeId: changeId,
          message: `Change node ${changeId} has no Impact analysis.`,
          suggestedFix: 'Run `devview impact analyze --change <id> --product/--work/--test/--evidence ...` first.',
        }),
      ],
    }
  }

  if (impacts.every((entry) => impactAffectedIds(entry).length === 0)) {
    return {
      context: null,
      issues: [
        issue({
          validator: 'Revision',
          code: 'REVISION_IMPACT_AFFECTED_IDS_MISSING',
          severity: 'error',
          file: defaultArtifacts.impactTree,
          nodeId: changeId,
          message: `Change node ${changeId} has Impact analysis, but no affected nodes are recorded.`,
          suggestedFix: 'Record affected Product/Work/Test/Evidence/Acceptance ids before starting revision.',
        }),
      ],
    }
  }

  const context: ActiveRevisionContext = {
    changeNodeId: changeId,
    impactNodeIds: uniqueStrings(impacts.map((entry) => stringValue(entry.id))),
    affectedProductNodeIds: uniqueStrings(impacts.flatMap((entry) => arrayStrings(entry.affectedProductNodeIds))),
    affectedWorkNodeIds: uniqueStrings(impacts.flatMap((entry) => arrayStrings(entry.affectedWorkNodeIds))),
    affectedTestNodeIds: uniqueStrings(impacts.flatMap((entry) => arrayStrings(entry.affectedTestNodeIds))),
    affectedEvidenceNodeIds: uniqueStrings(impacts.flatMap((entry) => arrayStrings(entry.affectedEvidenceNodeIds))),
    affectedAcceptanceNodeIds: uniqueStrings(impacts.flatMap((entry) => arrayStrings(entry.affectedAcceptanceNodeIds))),
    affectedNodeIds: uniqueStrings([
      ...impacts.flatMap((entry) => arrayStrings(entry.affectedNodeIds)),
      ...impacts.map((entry) => stringValue(entry.affectedNodeId)),
    ]),
    startedAt,
    status: 'in_progress',
  }

  return { context, issues: [] }
}

export function revisionAffectedIds(context: ActiveRevisionContext): string[] {
  return uniqueStrings([
    ...context.affectedProductNodeIds,
    ...context.affectedWorkNodeIds,
    ...context.affectedTestNodeIds,
    ...context.affectedEvidenceNodeIds,
    ...context.affectedAcceptanceNodeIds,
    ...context.affectedNodeIds,
  ])
}

function activeRevisionContextOf(value: unknown): ActiveRevisionContext | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const entry = value as JsonObject
  const changeNodeId = stringValue(entry.changeNodeId)
  const status = stringValue(entry.status)
  if (!changeNodeId || (status !== 'in_progress' && status !== 'completed')) {
    return null
  }
  return {
    changeNodeId,
    impactNodeIds: arrayStrings(entry.impactNodeIds),
    affectedProductNodeIds: arrayStrings(entry.affectedProductNodeIds),
    affectedWorkNodeIds: arrayStrings(entry.affectedWorkNodeIds),
    affectedTestNodeIds: arrayStrings(entry.affectedTestNodeIds),
    affectedEvidenceNodeIds: arrayStrings(entry.affectedEvidenceNodeIds),
    affectedAcceptanceNodeIds: arrayStrings(entry.affectedAcceptanceNodeIds),
    affectedNodeIds: arrayStrings(entry.affectedNodeIds),
    startedAt: stringValue(entry.startedAt) || undefined,
    completedAt: stringValue(entry.completedAt) || undefined,
    status,
  }
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}
