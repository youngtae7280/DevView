import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts } from '../core/project.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import {
  acceptanceCriteriaOf,
  arrayStrings,
  getNestedBoolean,
  missingIssue,
  nodesOf,
  readJsonIfExists,
  stringValue,
} from './shared.js'

export async function validateVd(root: string): Promise<ValidationIssue[]> {
  const testPath = artifactPath(root, 'testTree')
  if (!existsSync(testPath)) {
    return [missingIssue('VD', 'TEST_TREE_MISSING', defaultArtifacts.testTree, 'Test Tree is missing.')]
  }
  const product = await readJsonIfExists(root, 'productTree')
  const work = await readJsonIfExists(root, 'workTree')
  const test = await readJsonIfExists(root, 'testTree')
  const issues: ValidationIssue[] = []
  const testNodes = nodesOf(test)
  for (const workNode of nodesOf(work).filter((entry) => stringValue(entry.id) !== stringValue(work?.rootNodeId))) {
    if (!['selected', 'foundation'].includes(stringValue(workNode.scopeClass))) {
      continue
    }
    const workId = stringValue(workNode.id)
    const criteriaIds = arrayStrings(workNode.satisfiesAcceptanceCriteriaIds)
    const covered = testNodes.some(
      (testNode) =>
        arrayStrings(testNode.verifiesWorkNodeIds).includes(workId) ||
        criteriaIds.some((criteriaId) => arrayStrings(testNode.verifiesAcceptanceCriteriaIds).includes(criteriaId)),
    )
    if (!covered) {
      issues.push(
        issue({
          validator: 'VD',
          code: 'WORK_NOT_TESTED',
          severity: 'error',
          file: defaultArtifacts.testTree,
          nodeId: workId,
          message: `Selected/foundation Work node ${workId} has no Test Tree coverage.`,
          suggestedFix: 'Create a Test Tree node that verifies this Work node.',
        }),
      )
    }
  }

  const verifiedCriteria = new Set(testNodes.flatMap((node) => arrayStrings(node.verifiesAcceptanceCriteriaIds)))
  for (const productNode of nodesOf(product)) {
    for (const criterion of acceptanceCriteriaOf(productNode)) {
      if (
        getNestedBoolean(criterion, ['verification', 'required']) === true &&
        !verifiedCriteria.has(stringValue(criterion.id))
      ) {
        issues.push(
          issue({
            validator: 'VD',
            code: 'ACCEPTANCE_NOT_COVERED',
            severity: 'error',
            file: defaultArtifacts.testTree,
            nodeId: stringValue(criterion.id),
            message: `Required acceptance criterion ${String(criterion.id)} has no Test Tree coverage.`,
            suggestedFix: 'Create or link a Test Tree node with verifiesAcceptanceCriteriaIds.',
          }),
        )
      }
    }
  }
  for (const testNode of testNodes.filter((entry) => stringValue(entry.id) !== stringValue(test?.rootNodeId))) {
    const testId = stringValue(testNode.id)
    const requiredEvidence = arrayStrings(testNode.evidenceRequired).join(' ').toLowerCase()
    if (
      stringValue(testNode.type) === 'ui_state_test' &&
      !requiredEvidence.includes('screenshot') &&
      !requiredEvidence.includes('manual')
    ) {
      issues.push(
        issue({
          validator: 'VD',
          code: 'UI_EVIDENCE_MISSING',
          severity: 'error',
          file: defaultArtifacts.testTree,
          nodeId: testId,
          message: `UI Test node ${testId} does not require screenshot or manual UI evidence.`,
          suggestedFix: 'Add screenshot, visual, or manual UI evidence requirements before implementation.',
        }),
      )
    }
  }
  return issues
}
