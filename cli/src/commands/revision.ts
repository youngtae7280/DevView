import { existsSync } from 'node:fs'
import { PBE_STATE } from '../core/state-machine.js'
import { transitionPbeState } from '../core/state-transition.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { hasErrors, issue } from '../core/types.js'
import { readJsonSafe, writeJsonAtomic } from '../core/fs.js'
import { artifactPath, defaultArtifacts } from '../core/project.js'
import {
  buildRevisionContext,
  revisionAffectedIds,
  validateRevisionComplete,
  type ActiveRevisionContext,
} from '../validators/pbe-validators.js'
import { arrayObjects, arrayStrings, stringValue, type JsonObject } from '../validators/shared.js'
import { type CommandContext, transitionFailed } from './shared.js'

export async function revisionStartCommand(context: CommandContext): Promise<CommandResult> {
  const startedAt = new Date().toISOString()
  const revisionContext = await buildRevisionContext(context.options.root, context.options.change, startedAt)
  if (hasErrors(revisionContext.issues) || !revisionContext.context) {
    return transitionFailed('revision start', 'Revision start failed. State was not changed.', revisionContext.issues)
  }
  const invalidation = await prepareRevisionInvalidations(context.options.root, revisionContext.context, startedAt)
  if (hasErrors(invalidation.issues)) {
    return transitionFailed('revision start', 'Revision start failed. State was not changed.', invalidation.issues)
  }
  const result = await transitionPbeState(context.options.root, 'revision start', [PBE_STATE.REVISION_REQUESTED], {
    completedSteps: ['revision_start'],
    stage: 'revision',
    mode: 'revision_control',
    deliveryStatus: 'revision_requested',
    currentGate: null,
    nextStep: 'revision_complete',
    activeRevision: { ...revisionContext.context },
    data: {
      changeId: context.options.change,
      activeRevision: { ...revisionContext.context },
      next: 'Revise only affected nodes from Impact Tree, refresh tests/evidence, then run `pbe revision complete --change <id>`.',
    },
  })
  if (!result.ok) {
    return result
  }
  await writeInvalidationArtifacts(invalidation)
  result.data = {
    ...result.data,
    invalidatedEvidenceCount: invalidation.invalidatedEvidenceCount,
    invalidatedAcceptanceCount: invalidation.invalidatedAcceptanceCount,
  }
  return result
}

export async function revisionCompleteCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(...(await validateRevisionComplete(context.options.root, context.options.change)))
  if (hasErrors(issues)) {
    return transitionFailed('revision complete', 'Revision completion failed. State was not changed.', issues)
  }
  const state = await readJsonSafe<JsonObject>(artifactPath(context.options.root, 'pbeState'))
  const activeRevision =
    state.ok && typeof state.value.activeRevision === 'object' && state.value.activeRevision !== null
      ? (state.value.activeRevision as JsonObject)
      : {}
  const completedAt = new Date().toISOString()
  const completedRevision = {
    ...activeRevision,
    status: 'completed',
    completedAt,
  }
  return transitionPbeState(context.options.root, 'revision complete', [PBE_STATE.WPD_IN_PROGRESS], {
    completedSteps: ['revision_complete'],
    stage: 'wpd',
    mode: 'revision_reverification',
    deliveryStatus: 'revision_in_progress',
    currentGate: null,
    nextStep: 'wpd',
    activeRevision: null,
    revisionHistoryEntry: completedRevision,
    data: {
      changeId: context.options.change,
      completedRevision,
      next: 'Revision does not close as DONE. Continue through `pbe wpd close`, `pbe vd close`, ACEP execution, review, and user accept.',
    },
  })
}

interface RevisionInvalidationPlan {
  issues: ValidationIssue[]
  evidencePath?: string
  evidenceTree?: JsonObject
  acceptancePath?: string
  acceptanceTree?: JsonObject
  invalidatedEvidenceCount: number
  invalidatedAcceptanceCount: number
}

async function prepareRevisionInvalidations(
  root: string,
  activeRevision: ActiveRevisionContext,
  invalidatedAt: string,
): Promise<RevisionInvalidationPlan> {
  const plan: RevisionInvalidationPlan = {
    issues: [],
    invalidatedEvidenceCount: 0,
    invalidatedAcceptanceCount: 0,
  }
  const evidencePath = artifactPath(root, 'evidenceTree')
  if (shouldInspectEvidence(activeRevision) && existsSync(evidencePath)) {
    const evidenceTree = await readJsonSafe<JsonObject>(evidencePath)
    if (!evidenceTree.ok) {
      plan.issues.push(
        issue({
          validator: 'Revision',
          code: 'EVIDENCE_TREE_INVALID_JSON',
          severity: 'error',
          file: defaultArtifacts.evidenceTree,
          message: `Could not parse Evidence Tree: ${evidenceTree.error}`,
          suggestedFix: 'Fix evidence-tree.json before starting revision.',
          nextCommand: 'pbe revision start',
        }),
      )
    } else {
      plan.evidencePath = evidencePath
      plan.evidenceTree = evidenceTree.value
      plan.invalidatedEvidenceCount = invalidateEvidenceNodes(evidenceTree.value, activeRevision, invalidatedAt)
    }
  }

  const acceptancePath = artifactPath(root, 'acceptanceTree')
  if (shouldInspectAcceptance(activeRevision) && existsSync(acceptancePath)) {
    const acceptanceTree = await readJsonSafe<JsonObject>(acceptancePath)
    if (!acceptanceTree.ok) {
      plan.issues.push(
        issue({
          validator: 'Revision',
          code: 'ACCEPTANCE_TREE_INVALID_JSON',
          severity: 'error',
          file: defaultArtifacts.acceptanceTree,
          message: `Could not parse Acceptance Tree: ${acceptanceTree.error}`,
          suggestedFix: 'Fix acceptance-tree.json before starting revision.',
          nextCommand: 'pbe revision start',
        }),
      )
    } else {
      plan.acceptancePath = acceptancePath
      plan.acceptanceTree = acceptanceTree.value
      plan.invalidatedAcceptanceCount = invalidateAcceptanceBranches(
        acceptanceTree.value,
        activeRevision,
        invalidatedAt,
      )
    }
  }

  return plan
}

async function writeInvalidationArtifacts(plan: RevisionInvalidationPlan): Promise<void> {
  if (plan.evidencePath && plan.evidenceTree && plan.invalidatedEvidenceCount > 0) {
    await writeJsonAtomic(plan.evidencePath, plan.evidenceTree)
  }
  if (plan.acceptancePath && plan.acceptanceTree && plan.invalidatedAcceptanceCount > 0) {
    await writeJsonAtomic(plan.acceptancePath, plan.acceptanceTree)
  }
}

function invalidateEvidenceNodes(
  tree: JsonObject,
  activeRevision: ActiveRevisionContext,
  invalidatedAt: string,
): number {
  let count = 0
  for (const evidenceNode of arrayObjects(tree.evidence)) {
    if (!evidenceMatchesRevision(evidenceNode, activeRevision)) {
      continue
    }
    const currentStatus = stringValue(evidenceNode.status) || 'unknown'
    if (!stringValue(evidenceNode.previousStatus)) {
      evidenceNode.previousStatus = currentStatus
    }
    evidenceNode.status = 'invalidated'
    evidenceNode.invalidatedByChangeNodeId = activeRevision.changeNodeId
    evidenceNode.invalidatedByRevisionChangeNodeId = activeRevision.changeNodeId
    evidenceNode.invalidatedAt = invalidatedAt
    count += 1
  }
  return count
}

function invalidateAcceptanceBranches(
  tree: JsonObject,
  activeRevision: ActiveRevisionContext,
  invalidatedAt: string,
): number {
  let count = 0
  for (const branch of arrayObjects(tree.branches)) {
    if (!acceptanceMatchesRevision(branch, activeRevision)) {
      continue
    }
    const currentStatus = stringValue(branch.status) || 'unknown'
    if (!stringValue(branch.previousStatus)) {
      branch.previousStatus = currentStatus
    }
    branch.status = 'invalidated'
    branch.requiresReacceptance = true
    branch.invalidatedByChangeNodeId = activeRevision.changeNodeId
    branch.invalidatedByRevisionChangeNodeId = activeRevision.changeNodeId
    branch.invalidatedAt = invalidatedAt
    count += 1
  }
  return count
}

function evidenceMatchesRevision(evidenceNode: JsonObject, activeRevision: ActiveRevisionContext): boolean {
  const evidenceId = stringValue(evidenceNode.id)
  if (idMatches(evidenceId, activeRevision.affectedEvidenceNodeIds, activeRevision.affectedNodeIds)) {
    return true
  }
  return (
    intersects(linkedProductIds(evidenceNode), activeRevision.affectedProductNodeIds, activeRevision.affectedNodeIds) ||
    intersects(linkedWorkIds(evidenceNode), activeRevision.affectedWorkNodeIds, activeRevision.affectedNodeIds) ||
    intersects(linkedTestIds(evidenceNode), activeRevision.affectedTestNodeIds, activeRevision.affectedNodeIds)
  )
}

function acceptanceMatchesRevision(branch: JsonObject, activeRevision: ActiveRevisionContext): boolean {
  const branchId = stringValue(branch.id) || stringValue(branch.acceptanceNodeId)
  if (idMatches(branchId, activeRevision.affectedAcceptanceNodeIds, activeRevision.affectedNodeIds)) {
    return true
  }
  return (
    intersects(linkedProductIds(branch), activeRevision.affectedProductNodeIds, activeRevision.affectedNodeIds) ||
    intersects(
      arrayStrings(branch.evidenceNodeIds),
      activeRevision.affectedEvidenceNodeIds,
      activeRevision.affectedNodeIds,
    )
  )
}

function shouldInspectEvidence(activeRevision: ActiveRevisionContext): boolean {
  return (
    activeRevision.affectedEvidenceNodeIds.length > 0 ||
    activeRevision.affectedProductNodeIds.length > 0 ||
    activeRevision.affectedWorkNodeIds.length > 0 ||
    activeRevision.affectedTestNodeIds.length > 0 ||
    revisionAffectedIds(activeRevision).length > 0
  )
}

function shouldInspectAcceptance(activeRevision: ActiveRevisionContext): boolean {
  return (
    activeRevision.affectedAcceptanceNodeIds.length > 0 ||
    activeRevision.affectedProductNodeIds.length > 0 ||
    activeRevision.affectedEvidenceNodeIds.length > 0 ||
    revisionAffectedIds(activeRevision).length > 0
  )
}

function linkedProductIds(node: JsonObject): string[] {
  return uniqueStrings([
    ...arrayStrings(node.productNodeIds),
    ...arrayStrings(node.linkedProductNodeIds),
    ...arrayStrings(node.provesProductNodeIds),
    stringValue(node.productNodeId),
    ...arrayStrings(node.provesNodeIds),
  ])
}

function linkedWorkIds(node: JsonObject): string[] {
  return uniqueStrings([
    ...arrayStrings(node.workNodeIds),
    ...arrayStrings(node.linkedWorkNodeIds),
    ...arrayStrings(node.provesWorkNodeIds),
    stringValue(node.workNodeId),
    ...arrayStrings(node.provesNodeIds),
  ])
}

function linkedTestIds(node: JsonObject): string[] {
  return uniqueStrings([
    ...arrayStrings(node.testNodeIds),
    ...arrayStrings(node.linkedTestNodeIds),
    ...arrayStrings(node.provesTestNodeIds),
    ...arrayStrings(node.evidenceForTestNodeIds),
    stringValue(node.testNodeId),
    ...arrayStrings(node.provesNodeIds),
  ])
}

function idMatches(id: string, primaryIds: string[], fallbackIds: string[]): boolean {
  return Boolean(id && (primaryIds.includes(id) || fallbackIds.includes(id)))
}

function intersects(values: string[], primaryIds: string[], fallbackIds: string[]): boolean {
  return values.some((value) => idMatches(value, primaryIds, fallbackIds))
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}
