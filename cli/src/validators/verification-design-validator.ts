import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts } from '../core/project.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import {
  acceptanceCriterionEvidenceEntries,
  acceptanceCriterionVerificationMethod,
  acceptanceCriteriaOf,
  arrayStrings,
  hasScreenshotOrManualEvidence,
  isUiRelatedAcceptanceCriterion,
  missingIssue,
  nodesOf,
  readJsonIfExists,
  stringValue,
  type JsonObject,
} from './shared.js'

export async function validateVerificationDesign(root: string): Promise<ValidationIssue[]> {
  const testPath = artifactPath(root, 'testTree')
  if (!existsSync(testPath)) {
    return [missingIssue('VerificationDesign', 'TEST_TREE_MISSING', defaultArtifacts.testTree, 'Test Tree is missing.')]
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
          validator: 'VerificationDesign',
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
  const testsByCriterionId = new Map<string, JsonObject[]>()
  for (const testNode of testNodes) {
    for (const criterionId of arrayStrings(testNode.verifiesAcceptanceCriteriaIds)) {
      const entries = testsByCriterionId.get(criterionId) || []
      entries.push(testNode)
      testsByCriterionId.set(criterionId, entries)
    }
  }
  for (const productNode of nodesOf(product)) {
    for (const criterion of acceptanceCriteriaOf(productNode)) {
      const criterionId = stringValue(criterion.id)
      if (stringValue(criterion.status) !== 'confirmed') {
        continue
      }
      if (!verifiedCriteria.has(criterionId)) {
        issues.push(
          issue({
            validator: 'VerificationDesign',
            code: 'ACCEPTANCE_NOT_COVERED',
            severity: 'error',
            file: defaultArtifacts.testTree,
            nodeId: criterionId,
            message: `Required acceptance criterion ${criterionId} has no Test Tree coverage.`,
            suggestedFix: 'Create or link a Test Tree node with verifiesAcceptanceCriteriaIds.',
          }),
        )
        continue
      }

      if (isUiRelatedAcceptanceCriterion(productNode, criterion)) {
        const linkedTestEvidence = (testsByCriterionId.get(criterionId) || []).flatMap((testNode) => [
          stringValue(testNode.type),
          stringValue(testNode.verificationMethod),
          ...arrayStrings(testNode.evidenceRequired),
          ...arrayStrings(testNode.requiredEvidence),
        ])
        if (
          !hasScreenshotOrManualEvidence([
            ...linkedTestEvidence,
            ...acceptanceCriterionEvidenceEntries(criterion),
            acceptanceCriterionVerificationMethod(criterion),
          ])
        ) {
          issues.push(
            issue({
              validator: 'VerificationDesign',
              code: 'UI_ACCEPTANCE_EVIDENCE_NOT_COVERED',
              severity: 'error',
              file: defaultArtifacts.testTree,
              nodeId: criterionId,
              message: `UI acceptance criterion ${criterionId} is covered by tests, but lacks screenshot/manual evidence coverage.`,
              suggestedFix:
                'Add screenshot, manual_screenshot, manual_check, or equivalent UI evidence to the linked Test Tree node.',
            }),
          )
        }
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
          validator: 'VerificationDesign',
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
