import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts } from '../core/project.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import { validateVisualDesign } from './visual-validator.js'
import {
  arrayObjects,
  arrayStrings,
  type JsonObject,
  missingIssue,
  nodesOf,
  readJsonIfExists,
  resolveEvidencePath,
  stringValue,
} from './shared.js'

export const evidenceValidationStages = ['execution', 'review', 'accept'] as const
export type EvidenceValidationStage = (typeof evidenceValidationStages)[number]

type EvidenceValidationOptions = {
  requireVisualAudit?: boolean
  stage?: EvidenceValidationStage
}

const staleEvidenceStatuses = new Set(['stale', 'stale_evidence'])
const supersededEvidenceStatuses = new Set(['superseded'])
const notCurrentEvidenceStatuses = new Set(['invalidated', 'obsolete', 'rejected'])
const currentFileStatuses = new Set(['attached', 'replaced', 'current'])

export async function validateEvidence(
  root: string,
  options: EvidenceValidationOptions = {},
): Promise<ValidationIssue[]> {
  const evidencePath = artifactPath(root, 'evidenceTree')
  if (!existsSync(evidencePath)) {
    return [
      missingIssue('Evidence', 'EVIDENCE_TREE_MISSING', defaultArtifacts.evidenceTree, 'Evidence Tree is missing.'),
    ]
  }
  const product = await readJsonIfExists(root, 'productTree')
  const work = await readJsonIfExists(root, 'workTree')
  const test = await readJsonIfExists(root, 'testTree')
  const evidence = await readJsonIfExists(root, 'evidenceTree')
  const acceptance = await readJsonIfExists(root, 'acceptanceTree')
  const issues: ValidationIssue[] = []
  const evidenceNodes = arrayObjects(evidence?.evidence)
  const stage = options.stage
  const reviewClosure = stage === 'review' || stage === 'accept'
  const nodeMaps = {
    product: mapNodes(product),
    work: mapNodes(work),
    test: mapNodes(test),
  }
  for (const testNode of nodesOf(test)) {
    if (stringValue(testNode.id) === stringValue(test?.rootNodeId)) {
      continue
    }
    const required = arrayStrings(testNode.evidenceRequired)
    if (required.length === 0) {
      continue
    }
    const testId = stringValue(testNode.id)
    const linkedEvidence = evidenceNodes.filter((entry) => evidenceLinksToTest(entry, testId))
    if (linkedEvidence.length === 0) {
      issues.push(
        issue({
          validator: 'Evidence',
          code: 'REQUIRED_TEST_NO_EVIDENCE',
          severity: 'error',
          file: defaultArtifacts.evidenceTree,
          nodeId: testId,
          message: `Required Test node ${testId} has no linked evidence.`,
          suggestedFix: 'Attach test logs, screenshots, manual notes, or other required evidence before review.',
        }),
      )
      continue
    }
    if (reviewClosure) {
      const currentProofs = linkedEvidence.filter(
        (entry) => evidenceCurrentProofIssues(entry, nodeMaps, stage).length === 0,
      )
      if (currentProofs.length === 0) {
        issues.push(
          ...dedupeIssues(linkedEvidence.flatMap((entry) => evidenceCurrentProofIssues(entry, nodeMaps, stage))),
        )
        issues.push(
          issue({
            validator: 'Evidence',
            code: 'REQUIRED_TEST_NO_CURRENT_EVIDENCE',
            severity: 'error',
            file: defaultArtifacts.evidenceTree,
            nodeId: testId,
            message: `Required Test node ${testId} has linked evidence, but none is current enough for ${stage}.`,
            suggestedFix: 'Attach fresh current evidence after the latest linked Product, Work, and Test node changes.',
          }),
        )
      }
    } else if (stage === 'execution') {
      issues.push(...dedupeIssues(linkedEvidence.flatMap((entry) => evidenceTimestampIssues(entry, stage))))
    }
  }
  for (const evidenceNode of evidenceNodes) {
    const evidenceId = stringValue(evidenceNode.id)
    const evidencePath = stringValue(evidenceNode.path)
    if (
      currentFileStatuses.has(stringValue(evidenceNode.status)) &&
      evidencePath &&
      !existsSync(resolveEvidencePath(root, evidencePath))
    ) {
      issues.push(
        issue({
          validator: 'Evidence',
          code: 'EVIDENCE_FILE_MISSING',
          severity: 'error',
          file: defaultArtifacts.evidenceTree,
          nodeId: evidenceId,
          message: `Evidence node ${evidenceId} points to a missing file: ${evidencePath}.`,
          suggestedFix: 'Attach the referenced evidence file or update the evidence path.',
        }),
      )
    }
  }
  if (stage === 'accept') {
    issues.push(...validateAcceptedEvidenceFreshness(acceptance, evidenceNodes, nodeMaps, stage))
  }
  issues.push(
    ...(await validateVisualDesign(root, {
      requireEvidence: true,
      requireAudit: options.requireVisualAudit !== false,
    })),
  )
  return stage ? issues.map((entry) => ({ ...entry, stage: entry.stage || stage })) : issues
}

function validateAcceptedEvidenceFreshness(
  acceptance: JsonObject | null,
  evidenceNodes: JsonObject[],
  nodeMaps: NodeMaps,
  stage: EvidenceValidationStage,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const evidenceById = new Map<string, JsonObject>()
  for (const entry of evidenceNodes) {
    const id = stringValue(entry.id)
    if (id) {
      evidenceById.set(id, entry)
    }
  }
  for (const branch of arrayObjects(acceptance?.branches)) {
    if (stringValue(branch.status) !== 'accepted_done') {
      continue
    }
    for (const evidenceId of arrayStrings(branch.evidenceNodeIds)) {
      const evidenceNode = evidenceById.get(evidenceId)
      if (!evidenceNode) {
        continue
      }
      issues.push(...evidenceCurrentProofIssues(evidenceNode, nodeMaps, stage))
    }
  }
  return dedupeIssues(issues)
}

type NodeMaps = {
  product: Map<string, JsonObject>
  work: Map<string, JsonObject>
  test: Map<string, JsonObject>
}

function mapNodes(tree: JsonObject | null): Map<string, JsonObject> {
  const mapped = new Map<string, JsonObject>()
  for (const node of nodesOf(tree)) {
    const id = stringValue(node.id)
    if (id) {
      mapped.set(id, node)
    }
  }
  return mapped
}

function evidenceLinksToTest(evidenceNode: JsonObject, testId: string): boolean {
  return evidenceTestIds(evidenceNode).includes(testId)
}

function evidenceTestIds(evidenceNode: JsonObject): string[] {
  return uniqueStrings([
    ...arrayStrings(evidenceNode.evidenceForTestNodeIds),
    ...arrayStrings(evidenceNode.provesTestNodeIds),
    ...arrayStrings(evidenceNode.linkedTestNodeIds),
    ...arrayStrings(evidenceNode.testNodeIds),
    ...arrayStrings(evidenceNode.provesNodeIds),
  ])
}

function evidenceWorkIds(evidenceNode: JsonObject, workNodes: Map<string, JsonObject>): string[] {
  return uniqueStrings([
    ...arrayStrings(evidenceNode.provesWorkNodeIds),
    ...arrayStrings(evidenceNode.linkedWorkNodeIds),
    ...arrayStrings(evidenceNode.workNodeIds),
    ...arrayStrings(evidenceNode.provesNodeIds).filter((id) => workNodes.has(id)),
  ])
}

function evidenceProductIds(evidenceNode: JsonObject, productNodes: Map<string, JsonObject>): string[] {
  return uniqueStrings([
    ...arrayStrings(evidenceNode.provesProductNodeIds),
    ...arrayStrings(evidenceNode.linkedProductNodeIds),
    ...arrayStrings(evidenceNode.productNodeIds),
    ...arrayStrings(evidenceNode.provesNodeIds).filter((id) => productNodes.has(id)),
  ])
}

function evidenceCurrentProofIssues(
  evidenceNode: JsonObject,
  nodeMaps: NodeMaps,
  stage: EvidenceValidationStage,
): ValidationIssue[] {
  return [
    ...evidenceStatusIssues(evidenceNode),
    ...evidenceTimestampIssues(evidenceNode, stage),
    ...evidenceFreshnessIssues(evidenceNode, nodeMaps),
  ]
}

function evidenceStatusIssues(evidenceNode: JsonObject): ValidationIssue[] {
  const evidenceId = stringValue(evidenceNode.id)
  const status = stringValue(evidenceNode.status)
  if (supersededEvidenceStatuses.has(status) || stringValue(evidenceNode.supersededByEvidenceId)) {
    return [
      issue({
        validator: 'Evidence',
        code: 'EVIDENCE_SUPERSEDED',
        severity: 'error',
        file: defaultArtifacts.evidenceTree,
        nodeId: evidenceId,
        message: `Evidence node ${evidenceId} is superseded and cannot be used as current proof.`,
        suggestedFix: 'Link the newer superseding Evidence node to the Test and Acceptance closure.',
      }),
    ]
  }
  if (staleEvidenceStatuses.has(status)) {
    return [
      issue({
        validator: 'Evidence',
        code: 'EVIDENCE_STALE',
        severity: 'error',
        file: defaultArtifacts.evidenceTree,
        nodeId: evidenceId,
        message: `Evidence node ${evidenceId} is marked stale and cannot be used as current proof.`,
        suggestedFix: 'Refresh the evidence after the latest linked node changes.',
      }),
    ]
  }
  if (notCurrentEvidenceStatuses.has(status)) {
    return [
      issue({
        validator: 'Evidence',
        code: 'EVIDENCE_NOT_CURRENT',
        severity: 'error',
        file: defaultArtifacts.evidenceTree,
        nodeId: evidenceId,
        message: `Evidence node ${evidenceId} has non-current status: ${status}.`,
        suggestedFix: 'Attach fresh current evidence or remove the non-current evidence from closure links.',
      }),
    ]
  }
  return []
}

function evidenceTimestampIssues(evidenceNode: JsonObject, stage: EvidenceValidationStage): ValidationIssue[] {
  if (evidenceTimestamp(evidenceNode) !== null) {
    return []
  }
  const evidenceId = stringValue(evidenceNode.id)
  return [
    issue({
      validator: 'Evidence',
      code: 'EVIDENCE_TIMESTAMP_MISSING',
      severity: stage === 'execution' ? 'warning' : 'error',
      file: defaultArtifacts.evidenceTree,
      nodeId: evidenceId,
      message: `Evidence node ${evidenceId} is missing createdAt/updatedAt/recordedAt/timestamp/verifiedAt metadata.`,
      suggestedFix: 'Record when the evidence was created or verified so freshness can be checked.',
    }),
  ]
}

function evidenceFreshnessIssues(evidenceNode: JsonObject, nodeMaps: NodeMaps): ValidationIssue[] {
  const evidenceTime = evidenceTimestamp(evidenceNode)
  if (evidenceTime === null) {
    return []
  }
  const issues: ValidationIssue[] = []
  const linkedNodes: Array<{ kind: string; id: string; node: JsonObject }> = [
    ...evidenceProductIds(evidenceNode, nodeMaps.product).flatMap((id) =>
      nodeMaps.product.has(id) ? [{ kind: 'Product', id, node: nodeMaps.product.get(id)! }] : [],
    ),
    ...evidenceWorkIds(evidenceNode, nodeMaps.work).flatMap((id) =>
      nodeMaps.work.has(id) ? [{ kind: 'Work', id, node: nodeMaps.work.get(id)! }] : [],
    ),
    ...evidenceTestIds(evidenceNode).flatMap((id) =>
      nodeMaps.test.has(id) ? [{ kind: 'Test', id, node: nodeMaps.test.get(id)! }] : [],
    ),
  ]

  for (const linked of linkedNodes) {
    const nodeTime = nodeTimestamp(linked.node)
    if (nodeTime === null || evidenceTime >= nodeTime) {
      continue
    }
    const evidenceId = stringValue(evidenceNode.id)
    issues.push(
      issue({
        validator: 'Evidence',
        code: 'EVIDENCE_STALE',
        severity: 'error',
        file: defaultArtifacts.evidenceTree,
        nodeId: evidenceId,
        message: `Evidence node ${evidenceId} is older than linked ${linked.kind} node ${linked.id}.`,
        suggestedFix: `Refresh evidence ${evidenceId} after ${linked.kind} node ${linked.id} changed.`,
      }),
    )
  }
  return dedupeIssues(issues)
}

function evidenceTimestamp(evidenceNode: JsonObject): number | null {
  return firstValidTime(
    evidenceNode.updatedAt,
    evidenceNode.createdAt,
    evidenceNode.recordedAt,
    evidenceNode.timestamp,
    evidenceNode.verifiedAt,
  )
}

function nodeTimestamp(node: JsonObject): number | null {
  return firstValidTime(node.updatedAt, node.modifiedAt, node.lastChangedAt, node.createdAt)
}

function firstValidTime(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = Date.parse(stringValue(value))
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }
  return null
}

function dedupeIssues(issues: ValidationIssue[]): ValidationIssue[] {
  const seen = new Set<string>()
  const deduped: ValidationIssue[] = []
  for (const entry of issues) {
    const key = `${entry.code}:${entry.nodeId || ''}:${entry.message}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    deduped.push(entry)
  }
  return deduped
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}
