import { defaultArtifacts } from '../core/project.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import {
  acceptanceCriteriaOf,
  arrayObjects,
  arrayStrings,
  collectAcceptanceCriteriaIds,
  getNestedString,
  isExecutableProductNode,
  missingLinkIssue,
  nodesOf,
  readJsonIfExists,
  scopeLeakIssue,
  stringValue,
  type JsonObject,
} from './shared.js'

export const traceabilityStages = ['work-planning', 'verification-design', 'execution', 'review', 'accept'] as const
export type TraceabilityStage = (typeof traceabilityStages)[number]
export type TraceabilityStageInput = TraceabilityStage | 'wpd' | 'vd'

export interface TraceabilityOptions {
  stage?: TraceabilityStageInput
}

interface TraceabilityContext {
  product: JsonObject | null
  work: JsonObject | null
  test: JsonObject | null
  evidence: JsonObject | null
  acceptance: JsonObject | null
  cycle: JsonObject | null
  productNodes: JsonObject[]
  productIds: Set<string>
  activeProductNodes: JsonObject[]
  activeProductIds: Set<string>
  inactiveProductIds: Set<string>
  outOfScopeProductIds: Set<string>
  acceptanceCriteriaIds: Set<string>
  requiredCriteria: JsonObject[]
  workNodes: JsonObject[]
  workIds: Set<string>
  nonRootWork: JsonObject[]
  testNodes: JsonObject[]
  testIds: Set<string>
  evidenceNodes: JsonObject[]
  evidenceIds: Set<string>
  acceptanceBranches: JsonObject[]
}

export async function validateTraceability(
  root: string,
  options: TraceabilityOptions = {},
): Promise<ValidationIssue[]> {
  const context = await loadTraceabilityContext(root)
  const stage = normalizeTraceabilityStage(options.stage)
  const issues: ValidationIssue[] = []

  issues.push(...validateProductWorkClosure(context, { strict: Boolean(stage) }))

  if (!stage || stageAtLeast(stage, 'verification-design')) {
    issues.push(...validateTestReferences(context))
  }
  if (stageAtLeast(stage, 'verification-design')) {
    issues.push(...validateWorkTestClosure(context))
    issues.push(...validateAcceptanceTestClosure(context))
    issues.push(...validateTestEvidenceDeclarations(context))
  }

  if (!stage || stageAtLeast(stage, 'execution')) {
    issues.push(...validateEvidenceReferences(context))
  }
  if (stageAtLeast(stage, 'execution')) {
    issues.push(...validateTestEvidenceClosure(context))
  }

  if (stageAtLeast(stage, 'accept')) {
    issues.push(...validateAcceptanceClosure(context))
  }

  issues.push(...validateCycleScopeLeaks(context))
  return stage ? issues.map((entry) => ({ ...entry, stage })) : issues
}

async function loadTraceabilityContext(root: string): Promise<TraceabilityContext> {
  const product = await readJsonIfExists(root, 'productTree')
  const work = await readJsonIfExists(root, 'workTree')
  const test = await readJsonIfExists(root, 'testTree')
  const evidence = await readJsonIfExists(root, 'evidenceTree')
  const acceptance = await readJsonIfExists(root, 'acceptanceTree')
  const cycle = await readJsonIfExists(root, 'cycleTree')

  const productNodes = nodesOf(product)
  const activeProductNodes = productNodes.filter(isExecutableProductNode)
  const workNodes = nodesOf(work)
  const testNodes = nodesOf(test).filter((node) => stringValue(node.id) !== stringValue(test?.rootNodeId))
  const evidenceNodes = arrayObjects(evidence?.evidence)

  return {
    product,
    work,
    test,
    evidence,
    acceptance,
    cycle,
    productNodes,
    productIds: idSet(productNodes),
    activeProductNodes,
    activeProductIds: idSet(activeProductNodes),
    inactiveProductIds: idSet(
      productNodes.filter(
        (node) =>
          ['deferred', 'out_of_scope'].includes(stringValue(node.scopeClass)) ||
          ['deferred', 'out_of_scope'].includes(stringValue(node.status)),
      ),
    ),
    outOfScopeProductIds: idSet(
      productNodes.filter(
        (node) => stringValue(node.scopeClass) === 'out_of_scope' || stringValue(node.status) === 'out_of_scope',
      ),
    ),
    acceptanceCriteriaIds: collectAcceptanceCriteriaIds(product),
    requiredCriteria: activeProductNodes.flatMap((node) =>
      acceptanceCriteriaOf(node).filter((criterion) => stringValue(criterion.status) === 'confirmed'),
    ),
    workNodes,
    workIds: idSet(workNodes),
    nonRootWork: workNodes.filter((node) => stringValue(node.id) !== stringValue(work?.rootNodeId)),
    testNodes,
    testIds: idSet(nodesOf(test)),
    evidenceNodes,
    evidenceIds: idSet(evidenceNodes),
    acceptanceBranches: arrayObjects(acceptance?.branches),
  }
}

function validateProductWorkClosure(context: TraceabilityContext, options: { strict: boolean }): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const productId of context.activeProductIds) {
    const hasWork = context.nonRootWork.some((node) => arrayStrings(node.derivedFromProductNodeIds).includes(productId))
    if ((options.strict || context.work) && !hasWork) {
      issues.push(
        issue({
          validator: 'Traceability',
          code: 'PRODUCT_WORK_LINK_MISSING',
          severity: 'error',
          file: defaultArtifacts.workTree,
          nodeId: productId,
          message: `Selected/foundation Product node ${productId} has no Work Tree coverage.`,
          suggestedFix: 'Create Work Tree coverage or explicitly defer/out_of_scope the Product node.',
        }),
      )
    }
  }

  for (const workNode of context.nonRootWork) {
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
      if (!context.productIds.has(productId)) {
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
      if (context.inactiveProductIds.has(productId)) {
        issues.push(scopeLeak(context, defaultArtifacts.workTree, workId, productId))
      }
    }
  }
  return issues
}

function validateTestReferences(context: TraceabilityContext): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const testNode of context.testNodes) {
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
          message: `Test node ${testId} does not verify Product, Work, or Acceptance Criteria nodes.`,
          suggestedFix: 'Link this Test node to the Work or acceptance criteria it verifies.',
        }),
      )
    }
    for (const productId of arrayStrings(testNode.verifiesProductNodeIds)) {
      if (!context.productIds.has(productId)) {
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
      if (context.inactiveProductIds.has(productId)) {
        issues.push(scopeLeak(context, defaultArtifacts.testTree, testId, productId))
      }
    }
    for (const workId of arrayStrings(testNode.verifiesWorkNodeIds)) {
      if (!context.workIds.has(workId)) {
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
      if (!context.acceptanceCriteriaIds.has(criteriaId)) {
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
  return issues
}

function validateWorkTestClosure(context: TraceabilityContext): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const workNode of context.nonRootWork) {
    if (!['selected', 'foundation'].includes(stringValue(workNode.scopeClass))) {
      continue
    }
    const workId = stringValue(workNode.id)
    const criteriaIds = arrayStrings(workNode.satisfiesAcceptanceCriteriaIds)
    const covered = context.testNodes.some(
      (testNode) =>
        arrayStrings(testNode.verifiesWorkNodeIds).includes(workId) ||
        criteriaIds.some((criteriaId) => arrayStrings(testNode.verifiesAcceptanceCriteriaIds).includes(criteriaId)),
    )
    if (!covered) {
      issues.push(
        issue({
          validator: 'Traceability',
          code: 'WORK_TEST_LINK_MISSING',
          severity: 'error',
          file: defaultArtifacts.testTree,
          nodeId: workId,
          message: `Selected/foundation Work node ${workId} has no Test Tree coverage.`,
          suggestedFix: 'Create or link a Test Tree node that verifies this Work node or its acceptance criteria.',
        }),
      )
    }
  }
  return issues
}

function validateAcceptanceTestClosure(context: TraceabilityContext): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const verifiedCriteria = new Set(
    context.testNodes.flatMap((node) => arrayStrings(node.verifiesAcceptanceCriteriaIds)),
  )
  for (const criterion of context.requiredCriteria) {
    const criterionId = stringValue(criterion.id)
    if (criterionId && !verifiedCriteria.has(criterionId)) {
      issues.push(
        issue({
          validator: 'Traceability',
          code: 'ACCEPTANCE_NOT_COVERED',
          severity: 'error',
          file: defaultArtifacts.testTree,
          nodeId: criterionId,
          message: `Required acceptance criterion ${criterionId} has no Test Tree coverage.`,
          suggestedFix: 'Create or link a Test Tree node with verifiesAcceptanceCriteriaIds.',
        }),
      )
    }
  }
  return issues
}

function validateTestEvidenceDeclarations(context: TraceabilityContext): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const testNode of context.testNodes) {
    const testId = stringValue(testNode.id)
    if (testEvidenceDeclarations(testNode).length === 0) {
      issues.push(
        issue({
          validator: 'Traceability',
          code: 'TEST_EVIDENCE_DECLARATION_MISSING',
          severity: 'error',
          file: defaultArtifacts.testTree,
          nodeId: testId,
          message: `Test node ${testId} does not declare required evidence.`,
          suggestedFix: 'Add evidenceRequired or requiredEvidence before execution planning proceeds.',
        }),
      )
    }
  }
  return issues
}

function validateEvidenceReferences(context: TraceabilityContext): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const evidenceNode of context.evidenceNodes) {
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
          message: `Evidence node ${evidenceId} is not linked to Test/Product/Work nodes.`,
          suggestedFix: 'Attach evidence to the Test node, Product node, Work node, or acceptance criteria it proves.',
        }),
      )
    }
    for (const testId of arrayStrings(evidenceNode.evidenceForTestNodeIds)) {
      if (!context.testIds.has(testId)) {
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
      if (!context.acceptanceCriteriaIds.has(criteriaId)) {
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
  return issues
}

function validateTestEvidenceClosure(context: TraceabilityContext): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const testNode of context.testNodes) {
    if (testEvidenceDeclarations(testNode).length === 0) {
      continue
    }
    const testId = stringValue(testNode.id)
    const hasEvidence = context.evidenceNodes.some(
      (entry) =>
        arrayStrings(entry.evidenceForTestNodeIds).includes(testId) ||
        arrayStrings(entry.provesNodeIds).includes(testId),
    )
    if (!hasEvidence) {
      issues.push(
        issue({
          validator: 'Traceability',
          code: 'TEST_EVIDENCE_LINK_MISSING',
          severity: 'error',
          file: defaultArtifacts.evidenceTree,
          nodeId: testId,
          message: `Required Test node ${testId} has no linked Evidence Tree node.`,
          suggestedFix: 'Attach test logs, screenshots, manual notes, or other required evidence before review.',
        }),
      )
    }
  }
  return issues
}

function validateAcceptanceClosure(context: TraceabilityContext): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const productId of context.activeProductIds) {
    const branch = context.acceptanceBranches.find(
      (entry) =>
        stringValue(entry.productNodeId) === productId &&
        stringValue(entry.status) === 'accepted_done' &&
        getNestedString(entry, ['decisionSource', 'actor']) === 'user',
    )
    if (!branch) {
      issues.push(acceptanceClosureIssue(productId, 'No user accepted_done branch exists for this Product node.'))
      continue
    }

    const evidenceNodeIds = arrayStrings(branch.evidenceNodeIds)
    if (evidenceNodeIds.length === 0) {
      issues.push(acceptanceClosureIssue(productId, 'The accepted branch has no evidenceNodeIds.'))
      continue
    }
    for (const evidenceId of evidenceNodeIds) {
      if (!context.evidenceIds.has(evidenceId)) {
        issues.push(
          acceptanceClosureIssue(productId, `The accepted branch references missing Evidence node ${evidenceId}.`),
        )
      }
    }
  }
  return issues
}

function validateCycleScopeLeaks(context: TraceabilityContext): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const cycleEntry of arrayObjects(context.cycle?.cycles)) {
    for (const productId of arrayStrings(cycleEntry.includedProductNodeIds)) {
      if (context.inactiveProductIds.has(productId)) {
        issues.push(scopeLeak(context, defaultArtifacts.cycleTree, stringValue(cycleEntry.id), productId))
      }
    }
  }
  return issues
}

function acceptanceClosureIssue(productId: string, reason: string): ValidationIssue {
  return issue({
    validator: 'Traceability',
    code: 'ACCEPTANCE_CLOSURE_MISSING',
    severity: 'error',
    file: defaultArtifacts.acceptanceTree,
    nodeId: productId,
    message: `Product node ${productId} does not have closed user Acceptance Tree coverage. ${reason}`,
    suggestedFix:
      'Record an accepted_done Acceptance Tree branch with decisionSource.actor = "user" and linked evidenceNodeIds.',
  })
}

function scopeLeak(context: TraceabilityContext, file: string, nodeId: string, productId: string): ValidationIssue {
  return scopeLeakIssue(
    'Traceability',
    context.outOfScopeProductIds.has(productId) ? 'OUT_OF_SCOPE_LEAK' : 'DEFERRED_SCOPE_LEAK',
    file,
    nodeId,
    productId,
  )
}

function testEvidenceDeclarations(testNode: JsonObject): string[] {
  return [...arrayStrings(testNode.evidenceRequired), ...arrayStrings(testNode.requiredEvidence)]
}

function idSet(nodes: JsonObject[]): Set<string> {
  return new Set(nodes.map((node) => stringValue(node.id)).filter(Boolean))
}

function stageAtLeast(stage: TraceabilityStage | undefined, minimum: TraceabilityStage): boolean {
  if (!stage) {
    return false
  }
  return traceabilityStages.indexOf(stage) >= traceabilityStages.indexOf(minimum)
}

function normalizeTraceabilityStage(stage: TraceabilityStageInput | undefined): TraceabilityStage | undefined {
  if (stage === 'wpd') {
    return 'work-planning'
  }
  if (stage === 'vd') {
    return 'verification-design'
  }
  return stage
}
