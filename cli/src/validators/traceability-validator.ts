import { defaultArtifacts } from '../core/project.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import {
  arrayObjects,
  arrayStrings,
  collectAcceptanceCriteriaIds,
  isExecutableProductNode,
  missingLinkIssue,
  nodesOf,
  readJsonIfExists,
  scopeLeakIssue,
  stringValue,
} from './shared.js'

export async function validateTraceability(root: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = []
  const product = await readJsonIfExists(root, 'productTree')
  const work = await readJsonIfExists(root, 'workTree')
  const test = await readJsonIfExists(root, 'testTree')
  const evidence = await readJsonIfExists(root, 'evidenceTree')
  const cycle = await readJsonIfExists(root, 'cycleTree')

  const productNodes = nodesOf(product)
  const productIds = new Set(productNodes.map((node) => stringValue(node.id)).filter(Boolean))
  const acceptanceCriteriaIds = collectAcceptanceCriteriaIds(product)
  const activeProductIds = new Set(
    productNodes
      .filter(isExecutableProductNode)
      .map((node) => stringValue(node.id))
      .filter(Boolean),
  )
  const inactiveProductIds = new Set(
    productNodes
      .filter(
        (node) =>
          ['deferred', 'out_of_scope'].includes(stringValue(node.scopeClass)) ||
          ['deferred', 'out_of_scope'].includes(stringValue(node.status)),
      )
      .map((node) => stringValue(node.id))
      .filter(Boolean),
  )

  const workNodes = nodesOf(work)
  const workIds = new Set(workNodes.map((node) => stringValue(node.id)).filter(Boolean))
  const nonRootWork = workNodes.filter((node) => stringValue(node.id) !== stringValue(work?.rootNodeId))
  for (const productId of activeProductIds) {
    const hasWork = nonRootWork.some((node) => arrayStrings(node.derivedFromProductNodeIds).includes(productId))
    if (work && !hasWork) {
      issues.push(
        issue({
          validator: 'Traceability',
          code: 'PRODUCT_NOT_DERIVED',
          severity: 'error',
          file: defaultArtifacts.workTree,
          nodeId: productId,
          message: `Selected Product node ${productId} has no Work Tree coverage.`,
          suggestedFix: 'Create Work Tree coverage or explicitly defer/out_of_scope the Product node.',
        }),
      )
    }
  }

  for (const workNode of nonRootWork) {
    const workId = stringValue(workNode.id)
    const sourceIds = arrayStrings(workNode.derivedFromProductNodeIds)
    if (['selected', 'foundation'].includes(stringValue(workNode.scopeClass)) && sourceIds.length === 0) {
      issues.push(
        issue({
          validator: 'Traceability',
          code: 'WORK_WITHOUT_PRODUCT',
          severity: 'error',
          file: defaultArtifacts.workTree,
          nodeId: workId,
          message: `Work node ${workId} has no Product Tree source.`,
          suggestedFix: 'Link Work nodes to Product nodes or record a foundation reason.',
        }),
      )
    }
    for (const productId of sourceIds) {
      if (!productIds.has(productId)) {
        issues.push(
          missingLinkIssue(
            'Traceability',
            'WORK_WITHOUT_PRODUCT',
            defaultArtifacts.workTree,
            workId,
            'Product',
            productId,
          ),
        )
      }
      if (inactiveProductIds.has(productId)) {
        issues.push(scopeLeakIssue('Traceability', 'DEFERRED_SCOPE_LEAK', defaultArtifacts.workTree, workId, productId))
      }
    }
  }

  const testNodes = nodesOf(test).filter((node) => stringValue(node.id) !== stringValue(test?.rootNodeId))
  const testIds = new Set(
    nodesOf(test)
      .map((node) => stringValue(node.id))
      .filter(Boolean),
  )
  for (const testNode of testNodes) {
    const testId = stringValue(testNode.id)
    if (
      arrayStrings(testNode.verifiesWorkNodeIds).length === 0 &&
      arrayStrings(testNode.verifiesAcceptanceCriteriaIds).length === 0 &&
      arrayStrings(testNode.verifiesProductNodeIds).length === 0
    ) {
      issues.push(
        issue({
          validator: 'Traceability',
          code: 'TEST_WITHOUT_WORK_OR_AC',
          severity: 'error',
          file: defaultArtifacts.testTree,
          nodeId: testId,
          message: `Test node ${String(testNode.id)} does not verify Product, Work, or Acceptance Criteria nodes.`,
          suggestedFix: 'Link this Test node to the Work or acceptance criteria it verifies.',
        }),
      )
    }
    for (const productId of arrayStrings(testNode.verifiesProductNodeIds)) {
      if (!productIds.has(productId)) {
        issues.push(
          missingLinkIssue(
            'Traceability',
            'TEST_WITHOUT_WORK_OR_AC',
            defaultArtifacts.testTree,
            testId,
            'Product',
            productId,
          ),
        )
      }
      if (inactiveProductIds.has(productId)) {
        issues.push(scopeLeakIssue('Traceability', 'DEFERRED_SCOPE_LEAK', defaultArtifacts.testTree, testId, productId))
      }
    }
    for (const workId of arrayStrings(testNode.verifiesWorkNodeIds)) {
      if (!workIds.has(workId)) {
        issues.push(
          missingLinkIssue(
            'Traceability',
            'TEST_WITHOUT_WORK_OR_AC',
            defaultArtifacts.testTree,
            testId,
            'Work',
            workId,
          ),
        )
      }
    }
    for (const criteriaId of arrayStrings(testNode.verifiesAcceptanceCriteriaIds)) {
      if (!acceptanceCriteriaIds.has(criteriaId)) {
        issues.push(
          missingLinkIssue(
            'Traceability',
            'TEST_WITHOUT_WORK_OR_AC',
            defaultArtifacts.testTree,
            testId,
            'Acceptance Criteria',
            criteriaId,
          ),
        )
      }
    }
  }

  for (const evidenceNode of arrayObjects(evidence?.evidence)) {
    const evidenceId = stringValue(evidenceNode.id)
    if (
      arrayStrings(evidenceNode.evidenceForTestNodeIds).length === 0 &&
      arrayStrings(evidenceNode.provesNodeIds).length === 0
    ) {
      issues.push(
        issue({
          validator: 'Traceability',
          code: 'EVIDENCE_WITHOUT_TEST',
          severity: 'error',
          file: defaultArtifacts.evidenceTree,
          nodeId: evidenceId,
          message: `Evidence node ${String(evidenceNode.id)} is not linked to Test/Product/Work nodes.`,
          suggestedFix: 'Attach evidence to the Test node, Product node, Work node, or acceptance criteria it proves.',
        }),
      )
    }
    for (const testId of arrayStrings(evidenceNode.evidenceForTestNodeIds)) {
      if (!testIds.has(testId)) {
        issues.push(
          missingLinkIssue(
            'Traceability',
            'EVIDENCE_WITHOUT_TEST',
            defaultArtifacts.evidenceTree,
            evidenceId,
            'Test',
            testId,
          ),
        )
      }
    }
    for (const criteriaId of arrayStrings(evidenceNode.evidenceForAcceptanceCriteriaIds)) {
      if (!acceptanceCriteriaIds.has(criteriaId)) {
        issues.push(
          missingLinkIssue(
            'Traceability',
            'EVIDENCE_WITHOUT_TEST',
            defaultArtifacts.evidenceTree,
            evidenceId,
            'Acceptance Criteria',
            criteriaId,
          ),
        )
      }
    }
  }

  for (const cycleEntry of arrayObjects(cycle?.cycles)) {
    for (const productId of arrayStrings(cycleEntry.includedProductNodeIds)) {
      if (inactiveProductIds.has(productId)) {
        issues.push(
          scopeLeakIssue(
            'Traceability',
            'DEFERRED_SCOPE_LEAK',
            defaultArtifacts.cycleTree,
            stringValue(cycleEntry.id),
            productId,
          ),
        )
      }
    }
  }

  return issues
}
