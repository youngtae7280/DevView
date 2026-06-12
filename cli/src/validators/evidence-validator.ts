import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts } from '../core/project.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import { validateVisualDesign } from './visual-validator.js'
import {
  arrayObjects,
  arrayStrings,
  missingIssue,
  nodesOf,
  readJsonIfExists,
  resolveEvidencePath,
  stringValue,
} from './shared.js'

export async function validateEvidence(
  root: string,
  options: { requireVisualAudit?: boolean } = {},
): Promise<ValidationIssue[]> {
  const evidencePath = artifactPath(root, 'evidenceTree')
  if (!existsSync(evidencePath)) {
    return [
      missingIssue('Evidence', 'EVIDENCE_TREE_MISSING', defaultArtifacts.evidenceTree, 'Evidence Tree is missing.'),
    ]
  }
  const test = await readJsonIfExists(root, 'testTree')
  const evidence = await readJsonIfExists(root, 'evidenceTree')
  const issues: ValidationIssue[] = []
  const evidenceNodes = arrayObjects(evidence?.evidence)
  for (const testNode of nodesOf(test)) {
    if (stringValue(testNode.id) === stringValue(test?.rootNodeId)) {
      continue
    }
    const required = arrayStrings(testNode.evidenceRequired)
    if (required.length === 0) {
      continue
    }
    const testId = stringValue(testNode.id)
    const hasEvidence = evidenceNodes.some(
      (entry) =>
        arrayStrings(entry.evidenceForTestNodeIds).includes(testId) ||
        arrayStrings(entry.provesNodeIds).includes(testId),
    )
    if (!hasEvidence) {
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
    }
  }
  for (const evidenceNode of evidenceNodes) {
    const evidenceId = stringValue(evidenceNode.id)
    const evidencePath = stringValue(evidenceNode.path)
    if (
      ['attached', 'replaced'].includes(stringValue(evidenceNode.status)) &&
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
  issues.push(
    ...(await validateVisualDesign(root, {
      requireEvidence: true,
      requireAudit: options.requireVisualAudit !== false,
    })),
  )
  return issues
}
