import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts, getOpenBlockingDecisions } from '../core/project.js'
import { readJsonSafe } from '../core/fs.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'

type JsonObject = Record<string, unknown>

const terminalRpdStatuses = new Set(['confirmed', 'deferred', 'out_of_scope'])
const executableScopes = new Set(['selected', 'foundation'])
const nonExecutableTypes = new Set(['non_goal', 'risk', 'assumption', 'decision'])
const abstractQualityTerms = [
  '깔끔하게',
  '보기 좋게',
  '빠르게',
  '안정적으로',
  '사용하기 쉽게',
  '직관적으로',
  '현대적으로',
  '효율적으로',
  '유연하게',
  '확장 가능하게',
  '문제 없게',
  '좋게',
  '더 좋게',
  '간단하게',
  '편하게',
  '부드럽게',
  'clean',
  'nice',
  'modern',
  'intuitive',
  'fast',
  'stable',
  'easy',
  'easy to use',
  'efficient',
  'flexible',
  'scalable',
  'problem-free',
  'good',
  'better',
  'simple',
  'smooth',
  'comfortable',
  'user-friendly',
]

export interface RpdCheckOptions {
  completionMode: boolean
}

export async function validateRpd(root: string, options: RpdCheckOptions): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = []
  const productPath = artifactPath(root, 'productTree')
  const requirementPath = artifactPath(root, 'requirementTree')
  const decisionQueuePath = artifactPath(root, 'decisionQueue')

  if (!existsSync(productPath)) {
    return [
      issue({
        validator: 'RPD',
        code: 'PRODUCT_TREE_MISSING',
        severity: 'error',
        file: defaultArtifacts.productTree,
        message: 'Product Tree is missing.',
        suggestedFix: 'Run `pbe init` or create .pbe/tree/product-tree.json before running RPD checks.',
      }),
    ]
  }

  const product = await readJsonSafe<JsonObject>(productPath)
  if (!product.ok) {
    return [
      issue({
        validator: 'RPD',
        code: 'JSON_INVALID',
        severity: 'error',
        file: defaultArtifacts.productTree,
        message: `Could not parse Product Tree: ${product.error}`,
        suggestedFix: 'Fix product-tree.json syntax before continuing.',
      }),
    ]
  }

  if (!existsSync(requirementPath)) {
    issues.push(issue({
      validator: 'RPD',
      code: 'COMPAT_REQUIREMENT_TREE_MISSING',
      severity: 'error',
      file: defaultArtifacts.requirementTree,
      message: 'Backward-compatible requirement-tree.json is missing.',
      suggestedFix: 'Regenerate the compatibility requirement-tree view from the Product Tree.',
    }))
  }

  const rootNode = findRootNode(product.value)
  if (!rootNode) {
    issues.push(issue({
      validator: 'RPD',
      code: 'PRODUCT_ROOT_MISSING',
      severity: 'error',
      file: defaultArtifacts.productTree,
      message: 'Product Tree rootNodeId does not resolve to a node.',
      suggestedFix: 'Set rootNodeId to an existing Product node id.',
    }))
  }

  if (options.completionMode && rootNode && !hasUserConfirmationEvidence(rootNode)) {
    issues.push(issue({
      validator: 'RPD',
      code: 'ROOT_NOT_CONFIRMED_BY_USER',
      severity: 'error',
      file: defaultArtifacts.productTree,
      nodeId: stringValue(rootNode.id),
      message: `Product root ${String(rootNode.id)} has no explicit user confirmation evidence.`,
      suggestedFix: 'Ask the user to confirm the root summary or revise it, then record user confirmation metadata on the Product root.',
    }))
  }

  for (const node of nodesOf(product.value)) {
    const nodeId = stringValue(node.id)
    const isLeaf = childrenOf(node).length === 0
    const status = stringValue(node.status)
    const executable = isExecutableProductNode(node)

    if (options.completionMode && isLeaf && !terminalRpdStatuses.has(status)) {
      issues.push(issue({
        validator: 'RPD',
        code: status === 'blocked' ? 'NODE_BLOCKED' : 'LEAF_NOT_TERMINAL',
        severity: 'error',
        file: defaultArtifacts.productTree,
        nodeId,
        message: `Product leaf ${nodeId} is ${status || 'missing status'}, not confirmed/deferred/out_of_scope.`,
        suggestedFix: 'Continue RPD for this node or explicitly mark it confirmed, deferred, or out_of_scope with user-backed rationale.',
      }))
    }

    if (executable && ['partial', 'ambiguous'].includes(getNestedString(node, ['ambiguity', 'status']))) {
      issues.push(issue({
        validator: 'RPD',
        code: 'AMBIGUITY_UNRESOLVED',
        severity: 'error',
        file: defaultArtifacts.productTree,
        nodeId,
        message: `Selected executable Product node ${nodeId} still has unresolved ambiguity.`,
        suggestedFix: 'Ask exactly one focused RPD question and resolve ambiguity into concrete acceptance criteria before WPD.',
      }))
    }

    if (executable && status === 'needs_clarification') {
      issues.push(issue({
        validator: 'RPD',
        code: 'NODE_NEEDS_CLARIFICATION',
        severity: 'error',
        file: defaultArtifacts.productTree,
        nodeId,
        message: `Selected Product node ${nodeId} still needs clarification.`,
        suggestedFix: 'Resolve the open clarification before deriving Work Tree nodes.',
      }))
    }

    if (executable && status === 'confirmed' && acceptanceCriteriaOf(node).length === 0 && !stringValue(node.acceptanceNotRequiredReason)) {
      issues.push(issue({
        validator: 'RPD',
        code: 'ACCEPTANCE_CRITERIA_MISSING',
        severity: 'error',
        file: defaultArtifacts.productTree,
        nodeId,
        message: `Confirmed executable Product node ${nodeId} lacks acceptanceCriteria or acceptanceNotRequiredReason.`,
        suggestedFix: 'Write structured EARS acceptance criteria, or record why criteria are not required for this node.',
      }))
    }

    const unresolvedTerms = collectUnresolvedAbstractTerms(node)
    if (executable && unresolvedTerms.length > 0) {
      issues.push(issue({
        validator: 'RPD',
        code: 'ABSTRACT_QUALITY_TERM',
        severity: 'error',
        file: defaultArtifacts.productTree,
        nodeId,
        message: `Product node ${nodeId} contains unresolved abstract quality term(s): ${unresolvedTerms.join(', ')}.`,
        suggestedFix: 'Resolve target, condition, expected behavior, completion criteria, exception behavior, and verification method.',
      }))
    }

    for (const criterion of acceptanceCriteriaOf(node)) {
      issues.push(...validateAcceptanceCriterion(node, criterion))
    }
  }

  if (existsSync(decisionQueuePath)) {
    const queue = await readJsonSafe<JsonObject>(decisionQueuePath)
    if (queue.ok) {
      for (const decision of getOpenBlockingDecisions(queue.value)) {
        issues.push(issue({
          validator: 'RPD',
          code: 'BLOCKING_DECISION_OPEN',
          severity: 'error',
          file: defaultArtifacts.decisionQueue,
          nodeId: stringValue(decision.targetNodeId),
          message: `Blocking decision ${String(decision.id)} is still open: ${String(decision.question || decision.reason || '')}`,
          suggestedFix: 'Ask the user to resolve this decision before closing RPD or entering downstream stages.',
        }))
      }
    }
  }

  return issues
}

export async function validateAcceptedActors(root: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = []
  const product = await readJsonIfExists(root, 'productTree')
  const acceptance = await readJsonIfExists(root, 'acceptanceTree')
  const state = await readJsonIfExists(root, 'pbeState')

  for (const node of nodesOf(product)) {
    const status = stringValue(node.status)
    if (['accepted', 'accepted_done'].includes(status) && !hasUserConfirmationEvidence(node)) {
      issues.push(issue({
        validator: 'Acceptance',
        code: 'ASSISTANT_ACCEPTED_STATUS',
        severity: 'error',
        file: defaultArtifacts.productTree,
        nodeId: stringValue(node.id),
        message: `Product node ${String(node.id)} is ${status} without explicit user approval metadata.`,
        suggestedFix: 'Codex may submit for review, but only user approval may set accepted state.',
      }))
    }
  }

  for (const branch of arrayObjects(acceptance?.branches)) {
    if (branch.status === 'accepted_done' && getNestedString(branch, ['decisionSource', 'actor']) !== 'user') {
      issues.push(issue({
        validator: 'Acceptance',
        code: 'ASSISTANT_ACCEPTED_STATUS',
        severity: 'error',
        file: defaultArtifacts.acceptanceTree,
        nodeId: stringValue(branch.productNodeId),
        message: `Acceptance branch ${String(branch.productNodeId)} is accepted_done without user decisionSource.`,
        suggestedFix: 'Record explicit user approval before marking a branch accepted.',
      }))
    }
  }

  const deliveryStatus = stringValue(state?.deliveryStatus)
  if (deliveryStatus === 'accepted' && getNestedString(state, ['autoflow', 'lastUserAction', 'actor']) !== 'user') {
    issues.push(issue({
      validator: 'Acceptance',
      code: 'ASSISTANT_ACCEPTED_STATUS',
      severity: 'error',
      file: defaultArtifacts.pbeState,
      message: 'pbe-state deliveryStatus is accepted without a user lastUserAction actor.',
      suggestedFix: 'Use submitted_for_review until the user explicitly accepts the result.',
    }))
  }

  return issues
}

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
  const activeProductIds = new Set(productNodes.filter(isExecutableProductNode).map((node) => stringValue(node.id)).filter(Boolean))
  const inactiveProductIds = new Set(productNodes
    .filter((node) => ['deferred', 'out_of_scope'].includes(stringValue(node.scopeClass)) || ['deferred', 'out_of_scope'].includes(stringValue(node.status)))
    .map((node) => stringValue(node.id))
    .filter(Boolean))

  const workNodes = nodesOf(work)
  const workIds = new Set(workNodes.map((node) => stringValue(node.id)).filter(Boolean))
  const nonRootWork = workNodes.filter((node) => stringValue(node.id) !== stringValue(work?.rootNodeId))
  for (const productId of activeProductIds) {
    const hasWork = nonRootWork.some((node) => arrayStrings(node.derivedFromProductNodeIds).includes(productId))
    if (work && !hasWork) {
      issues.push(issue({
        validator: 'Traceability',
        code: 'PRODUCT_NOT_DERIVED',
        severity: 'error',
        file: defaultArtifacts.workTree,
        nodeId: productId,
        message: `Selected Product node ${productId} has no Work Tree coverage.`,
        suggestedFix: 'Create Work Tree coverage or explicitly defer/out_of_scope the Product node.',
      }))
    }
  }

  for (const workNode of nonRootWork) {
    const workId = stringValue(workNode.id)
    const sourceIds = arrayStrings(workNode.derivedFromProductNodeIds)
    if (['selected', 'foundation'].includes(stringValue(workNode.scopeClass)) && sourceIds.length === 0) {
      issues.push(issue({
        validator: 'Traceability',
        code: 'WORK_WITHOUT_PRODUCT',
        severity: 'error',
        file: defaultArtifacts.workTree,
        nodeId: workId,
        message: `Work node ${workId} has no Product Tree source.`,
        suggestedFix: 'Link Work nodes to Product nodes or record a foundation reason.',
      }))
    }
    for (const productId of sourceIds) {
      if (!productIds.has(productId)) {
        issues.push(missingLinkIssue('Traceability', 'WORK_WITHOUT_PRODUCT', defaultArtifacts.workTree, workId, 'Product', productId))
      }
      if (inactiveProductIds.has(productId)) {
        issues.push(scopeLeakIssue('Traceability', 'DEFERRED_SCOPE_LEAK', defaultArtifacts.workTree, workId, productId))
      }
    }
  }

  const testNodes = nodesOf(test).filter((node) => stringValue(node.id) !== stringValue(test?.rootNodeId))
  const testIds = new Set(nodesOf(test).map((node) => stringValue(node.id)).filter(Boolean))
  for (const testNode of testNodes) {
    const testId = stringValue(testNode.id)
    if (arrayStrings(testNode.verifiesWorkNodeIds).length === 0 && arrayStrings(testNode.verifiesAcceptanceCriteriaIds).length === 0 && arrayStrings(testNode.verifiesProductNodeIds).length === 0) {
      issues.push(issue({
        validator: 'Traceability',
        code: 'TEST_WITHOUT_WORK_OR_AC',
        severity: 'error',
        file: defaultArtifacts.testTree,
        nodeId: testId,
        message: `Test node ${String(testNode.id)} does not verify Product, Work, or Acceptance Criteria nodes.`,
        suggestedFix: 'Link this Test node to the Work or acceptance criteria it verifies.',
      }))
    }
    for (const productId of arrayStrings(testNode.verifiesProductNodeIds)) {
      if (!productIds.has(productId)) {
        issues.push(missingLinkIssue('Traceability', 'TEST_WITHOUT_WORK_OR_AC', defaultArtifacts.testTree, testId, 'Product', productId))
      }
      if (inactiveProductIds.has(productId)) {
        issues.push(scopeLeakIssue('Traceability', 'DEFERRED_SCOPE_LEAK', defaultArtifacts.testTree, testId, productId))
      }
    }
    for (const workId of arrayStrings(testNode.verifiesWorkNodeIds)) {
      if (!workIds.has(workId)) {
        issues.push(missingLinkIssue('Traceability', 'TEST_WITHOUT_WORK_OR_AC', defaultArtifacts.testTree, testId, 'Work', workId))
      }
    }
    for (const criteriaId of arrayStrings(testNode.verifiesAcceptanceCriteriaIds)) {
      if (!acceptanceCriteriaIds.has(criteriaId)) {
        issues.push(missingLinkIssue('Traceability', 'TEST_WITHOUT_WORK_OR_AC', defaultArtifacts.testTree, testId, 'Acceptance Criteria', criteriaId))
      }
    }
  }

  for (const evidenceNode of arrayObjects(evidence?.evidence)) {
    const evidenceId = stringValue(evidenceNode.id)
    if (arrayStrings(evidenceNode.evidenceForTestNodeIds).length === 0 && arrayStrings(evidenceNode.provesNodeIds).length === 0) {
      issues.push(issue({
        validator: 'Traceability',
        code: 'EVIDENCE_WITHOUT_TEST',
        severity: 'error',
        file: defaultArtifacts.evidenceTree,
        nodeId: evidenceId,
        message: `Evidence node ${String(evidenceNode.id)} is not linked to Test/Product/Work nodes.`,
        suggestedFix: 'Attach evidence to the Test node, Product node, Work node, or acceptance criteria it proves.',
      }))
    }
    for (const testId of arrayStrings(evidenceNode.evidenceForTestNodeIds)) {
      if (!testIds.has(testId)) {
        issues.push(missingLinkIssue('Traceability', 'EVIDENCE_WITHOUT_TEST', defaultArtifacts.evidenceTree, evidenceId, 'Test', testId))
      }
    }
    for (const criteriaId of arrayStrings(evidenceNode.evidenceForAcceptanceCriteriaIds)) {
      if (!acceptanceCriteriaIds.has(criteriaId)) {
        issues.push(missingLinkIssue('Traceability', 'EVIDENCE_WITHOUT_TEST', defaultArtifacts.evidenceTree, evidenceId, 'Acceptance Criteria', criteriaId))
      }
    }
  }

  for (const cycleEntry of arrayObjects(cycle?.cycles)) {
    for (const productId of arrayStrings(cycleEntry.includedProductNodeIds)) {
      if (inactiveProductIds.has(productId)) {
        issues.push(scopeLeakIssue('Traceability', 'DEFERRED_SCOPE_LEAK', defaultArtifacts.cycleTree, stringValue(cycleEntry.id), productId))
      }
    }
  }

  return issues
}

export async function validateWpd(root: string): Promise<ValidationIssue[]> {
  const workPath = artifactPath(root, 'workTree')
  if (!existsSync(workPath)) {
    return [missingIssue('WPD', 'WORK_TREE_MISSING', defaultArtifacts.workTree, 'Work Tree is missing.')]
  }
  const work = await readJsonIfExists(root, 'workTree')
  const issues: ValidationIssue[] = []
  const workIds = new Set(nodesOf(work).map((node) => stringValue(node.id)).filter(Boolean))
  for (const node of nodesOf(work).filter((entry) => stringValue(entry.id) !== stringValue(work?.rootNodeId))) {
    const workId = stringValue(node.id)
    if (['selected', 'foundation'].includes(stringValue(node.scopeClass)) && arrayStrings(node.expectedFiles).length === 0 && !node.unknownFileTouchRisk) {
      issues.push(issue({
        validator: 'WPD',
        code: 'EXPECTED_FILES_MISSING',
        severity: 'error',
        file: defaultArtifacts.workTree,
        nodeId: workId,
        message: `Work node ${String(node.id)} has no expectedFiles and is not marked unknownFileTouchRisk.`,
        suggestedFix: 'Declare expectedFiles or mark unknownFileTouchRisk before planning parallel execution.',
      }))
    }
    for (const dependencyId of arrayStrings(node.dependencies)) {
      if (!workIds.has(dependencyId)) {
        issues.push(missingLinkIssue('WPD', 'WORK_PRODUCT_LINK_MISSING', defaultArtifacts.workTree, workId, 'Work dependency', dependencyId))
      }
    }
  }
  issues.push(...validateWorkDependencyGraph(work))
  issues.push(...await validateTraceability(root))
  return issues
}

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
    const covered = testNodes.some((testNode) =>
      arrayStrings(testNode.verifiesWorkNodeIds).includes(workId) ||
      criteriaIds.some((criteriaId) => arrayStrings(testNode.verifiesAcceptanceCriteriaIds).includes(criteriaId)),
    )
    if (!covered) {
      issues.push(issue({
        validator: 'VD',
        code: 'WORK_NOT_TESTED',
        severity: 'error',
        file: defaultArtifacts.testTree,
        nodeId: workId,
        message: `Selected/foundation Work node ${workId} has no Test Tree coverage.`,
        suggestedFix: 'Create a Test Tree node that verifies this Work node.',
      }))
    }
  }

  const verifiedCriteria = new Set(testNodes.flatMap((node) => arrayStrings(node.verifiesAcceptanceCriteriaIds)))
  for (const productNode of nodesOf(product)) {
    for (const criterion of acceptanceCriteriaOf(productNode)) {
      if (getNestedBoolean(criterion, ['verification', 'required']) === true && !verifiedCriteria.has(stringValue(criterion.id))) {
        issues.push(issue({
          validator: 'VD',
          code: 'ACCEPTANCE_NOT_COVERED',
          severity: 'error',
          file: defaultArtifacts.testTree,
          nodeId: stringValue(criterion.id),
          message: `Required acceptance criterion ${String(criterion.id)} has no Test Tree coverage.`,
          suggestedFix: 'Create or link a Test Tree node with verifiesAcceptanceCriteriaIds.',
        }))
      }
    }
  }
  for (const testNode of testNodes.filter((entry) => stringValue(entry.id) !== stringValue(test?.rootNodeId))) {
    const testId = stringValue(testNode.id)
    const requiredEvidence = arrayStrings(testNode.evidenceRequired).join(' ').toLowerCase()
    if (stringValue(testNode.type) === 'ui_state_test' && !requiredEvidence.includes('screenshot') && !requiredEvidence.includes('manual')) {
      issues.push(issue({
        validator: 'VD',
        code: 'UI_EVIDENCE_MISSING',
        severity: 'error',
        file: defaultArtifacts.testTree,
        nodeId: testId,
        message: `UI Test node ${testId} does not require screenshot or manual UI evidence.`,
        suggestedFix: 'Add screenshot, visual, or manual UI evidence requirements before implementation.',
      }))
    }
  }
  return issues
}

export async function validateVisualDesign(root: string, options: { requireEvidence?: boolean } = {}): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = []
  const product = await readJsonIfExists(root, 'productTree')
  const work = await readJsonIfExists(root, 'workTree')
  const test = await readJsonIfExists(root, 'testTree')
  const evidence = await readJsonIfExists(root, 'evidenceTree')
  const visualReference = await readJsonIfExists(root, 'visualReference')
  const designTokens = await readJsonIfExists(root, 'designTokens')
  const componentStyleContract = await readJsonIfExists(root, 'componentStyleContract')
  const uiSurfaceInventory = await readJsonIfExists(root, 'uiSurfaceInventory')
  const componentStyleInventory = await readJsonIfExists(root, 'componentStyleInventory')
  const visualVerificationProfile = await readJsonIfExists(root, 'visualVerificationProfile')

  if (!hasSelectedVisualWork(product, work, test, visualReference)) {
    return issues
  }

  if (!visualReference) {
    issues.push(missingIssue('VisualDesign', 'VISUAL_REFERENCE_MISSING', defaultArtifacts.visualReference, 'Selected visual UI work requires visual-reference.json.'))
    return issues
  }

  const primarySource = stringValue(visualReference.primarySource)
  if (primarySource === 'not_required') {
    issues.push(issue({
      validator: 'VisualDesign',
      code: 'VISUAL_SOURCE_NOT_SELECTED',
      severity: 'error',
      file: defaultArtifacts.visualReference,
      message: 'Visual work is selected, but visual-reference.json still says primarySource is not_required.',
      suggestedFix: 'Run Visual Reference Intake and choose a source, default theme, or explicit waiver.',
    }))
    return issues
  }

  if (primarySource === 'visual_quality_waived') {
    if (getNestedBoolean(visualReference, ['waiver', 'isWaived']) !== true || getNestedBoolean(visualReference, ['waiver', 'riskAcceptedByUser']) !== true) {
      issues.push(issue({
        validator: 'VisualDesign',
        code: 'VISUAL_WAIVER_NOT_USER_ACCEPTED',
        severity: 'error',
        file: defaultArtifacts.visualReference,
        message: 'Visual quality is waived, but waiver metadata does not show user-accepted risk.',
        suggestedFix: 'Record waiver.isWaived=true, waiver.riskAcceptedByUser=true, reason, and scope from the user decision.',
      }))
    }
    return issues
  }

  if (!existsSync(artifactPath(root, 'uiThemeSpec'))) {
    issues.push(missingIssue('VisualDesign', 'UI_THEME_SPEC_MISSING', defaultArtifacts.uiThemeSpec, 'Selected visual UI work requires ui-theme-spec.md.'))
  }
  if (!designTokens) {
    issues.push(missingIssue('VisualDesign', 'DESIGN_TOKENS_MISSING', defaultArtifacts.designTokens, 'Selected visual UI work requires design-tokens.json.'))
  } else {
    for (const group of ['colors', 'spacing', 'radius', 'typography', 'border', 'shadow', 'motion']) {
      if (!isObject(getNestedValue(designTokens, ['tokens', group])) || Object.keys(getNestedValue(designTokens, ['tokens', group]) as JsonObject).length === 0) {
        issues.push(issue({
          validator: 'VisualDesign',
          code: 'DESIGN_TOKEN_GROUP_MISSING',
          severity: 'error',
          file: defaultArtifacts.designTokens,
          nodeId: group,
          message: `Design token group ${group} is missing or empty.`,
          suggestedFix: 'Materialize the Visual Design Contract into concrete colors, spacing, radius, typography, border, shadow, and motion tokens.',
        }))
      }
    }
  }
  if (!componentStyleContract) {
    issues.push(missingIssue('VisualDesign', 'COMPONENT_STYLE_CONTRACT_MISSING', defaultArtifacts.componentStyleContract, 'Selected visual UI work requires component-style-contract.json.'))
  } else {
    const componentNames = new Set(arrayObjects(componentStyleContract.components).map((entry) => stringValue(entry.componentName)))
    for (const requiredComponent of ['Button', 'Panel']) {
      if (!componentNames.has(requiredComponent)) {
        issues.push(issue({
          validator: 'VisualDesign',
          code: 'BASE_COMPONENT_CONTRACT_MISSING',
          severity: 'error',
          file: defaultArtifacts.componentStyleContract,
          nodeId: requiredComponent,
          message: `Component Style Contract lacks required base component: ${requiredComponent}.`,
          suggestedFix: 'Add the base component contract or record why it is not applicable to this UI slice.',
        }))
      }
    }
  }
  if (!uiSurfaceInventory) {
    issues.push(missingIssue('VisualDesign', 'UI_SURFACE_INVENTORY_MISSING', defaultArtifacts.uiSurfaceInventory, 'Selected visual UI work requires ui-surface-inventory.json.'))
  }
  if (!visualVerificationProfile) {
    issues.push(missingIssue('VisualDesign', 'VISUAL_VERIFICATION_PROFILE_MISSING', defaultArtifacts.visualVerificationProfile, 'Selected visual UI work requires visual-verification-profile.json.'))
  }

  for (const component of arrayObjects(componentStyleInventory?.components)) {
    const componentName = stringValue(component.componentName)
    if (stringValue(component.visualChangeScope) === 'shared' && !stringValue(component.requiredContractRef) && !stringValue(component.exceptionReason)) {
      issues.push(issue({
        validator: 'VisualDesign',
        code: 'SHARED_COMPONENT_CONTRACT_MISSING',
        severity: 'error',
        file: defaultArtifacts.componentStyleInventory,
        nodeId: componentName,
        message: `Shared visual component ${componentName} lacks a Component Style Contract reference or exception.`,
        suggestedFix: 'Link requiredContractRef or record a local exception before implementation.',
      }))
    }
    if (stringValue(component.visualChangeScope) === 'shared' && component.usesDesignTokens === false && !stringValue(component.exceptionReason)) {
      issues.push(issue({
        validator: 'VisualDesign',
        code: 'SHARED_COMPONENT_NOT_TOKENIZED',
        severity: 'error',
        file: defaultArtifacts.componentStyleInventory,
        nodeId: componentName,
        message: `Shared visual component ${componentName} is not token-backed.`,
        suggestedFix: 'Use design tokens for shared component styling or record an approved exception.',
      }))
    }
  }

  if (options.requireEvidence) {
    issues.push(...validateVisualEvidence(root, uiSurfaceInventory, evidence))
  }

  return issues
}

export async function validateAcep(root: string): Promise<ValidationIssue[]> {
  const manifestPath = artifactPath(root, 'executionManifest')
  if (!existsSync(manifestPath)) {
    return [missingIssue('ACEP', 'ACEP_MANIFEST_MISSING', defaultArtifacts.executionManifest, 'ACEP execution manifest is missing.')]
  }
  const issues = await validateAcceptedActors(root)
  const manifest = await readJsonSafe<JsonObject>(manifestPath)
  if (!manifest.ok) {
    issues.push(issue({
      validator: 'ACEP',
      code: 'JSON_INVALID',
      severity: 'error',
      file: defaultArtifacts.executionManifest,
      message: `Could not parse execution manifest: ${manifest.error}`,
      suggestedFix: 'Fix execution-manifest.json before running ACEP.',
    }))
    return issues
  }
  const product = await readJsonIfExists(root, 'productTree')
  const work = await readJsonIfExists(root, 'workTree')
  const inactiveProductIds = collectInactiveProductIds(product)
  const inactiveWorkIds = collectInactiveWorkIds(work)
  for (const task of arrayObjects(manifest.value.tasks)) {
    const taskId = stringValue(task.id)
    const scopeClass = stringValue(task.scopeClass)
    if (['deferred', 'blocked', 'out_of_scope'].includes(scopeClass)) {
      issues.push(issue({
        validator: 'ACEP',
        code: 'ACEP_SCOPE_LEAK',
        severity: 'error',
        file: defaultArtifacts.executionManifest,
        nodeId: taskId,
        message: `ACEP task ${taskId} has inactive scopeClass ${scopeClass}.`,
        suggestedFix: 'Remove deferred/blocked/out_of_scope tasks from the active ACEP manifest.',
      }))
    }
    if (arrayStrings(task.requirementIds).length === 0 && arrayStrings(task.workGraphNodeIds).length === 0 && !stringValue(task.verificationExplanation)) {
      issues.push(issue({
        validator: 'ACEP',
        code: 'ACEP_TASK_WITHOUT_REQUIREMENT',
        severity: 'error',
        file: defaultArtifacts.executionManifest,
        nodeId: taskId,
        message: `ACEP task ${taskId} has no requirementIds, workGraphNodeIds, or verificationExplanation.`,
        suggestedFix: 'Link the task to Product/Work scope or record why it is foundation/support work.',
      }))
    }
    for (const productId of arrayStrings(task.requirementIds)) {
      if (inactiveProductIds.has(productId)) {
        issues.push(scopeLeakIssue('ACEP', 'ACEP_SCOPE_LEAK', defaultArtifacts.executionManifest, taskId, productId))
      }
    }
    for (const workId of arrayStrings(task.workGraphNodeIds)) {
      if (inactiveWorkIds.has(workId)) {
        issues.push(issue({
          validator: 'ACEP',
          code: 'ACEP_SCOPE_LEAK',
          severity: 'error',
          file: defaultArtifacts.executionManifest,
          nodeId: taskId,
          message: `ACEP task ${taskId} includes inactive Work node ${workId}.`,
          suggestedFix: 'Remove inactive Work nodes from active ACEP scope or reopen them through Change/Impact.',
        }))
      }
    }
  }
  for (const phase of arrayObjects(manifest.value.phases)) {
    for (const group of arrayObjects(phase.parallelGroups)) {
      if (!stringValue(group.integrationTask) || group.integrationEvidenceRequired !== true || group.groupCannotCompleteWithoutIntegrationPass !== true) {
        issues.push(issue({
          validator: 'ACEP',
          code: 'PARALLEL_GROUP_INCOMPLETE',
          severity: 'error',
          file: defaultArtifacts.executionManifest,
          nodeId: stringValue(group.id),
          message: `Parallel group ${String(group.id)} lacks required integration task/evidence/pass guard.`,
          suggestedFix: 'Add integrationTask, integrationEvidenceRequired=true, and groupCannotCompleteWithoutIntegrationPass=true.',
        }))
      }
    }
  }
  if (!existsSync(artifactPath(root, 'finalCoverageCheck'))) {
    issues.push(missingIssue('ACEP', 'FINAL_COVERAGE_MISSING', defaultArtifacts.finalCoverageCheck, 'ACEP final coverage check is missing.'))
  }
  issues.push(...await validateVisualDesign(root))
  return issues
}

export async function validateEvidence(root: string): Promise<ValidationIssue[]> {
  const evidencePath = artifactPath(root, 'evidenceTree')
  if (!existsSync(evidencePath)) {
    return [missingIssue('Evidence', 'EVIDENCE_TREE_MISSING', defaultArtifacts.evidenceTree, 'Evidence Tree is missing.')]
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
    const hasEvidence = evidenceNodes.some((entry) =>
      arrayStrings(entry.evidenceForTestNodeIds).includes(testId) ||
      arrayStrings(entry.provesNodeIds).includes(testId),
    )
    if (!hasEvidence) {
      issues.push(issue({
        validator: 'Evidence',
        code: 'REQUIRED_TEST_NO_EVIDENCE',
        severity: 'error',
        file: defaultArtifacts.evidenceTree,
        nodeId: testId,
        message: `Required Test node ${testId} has no linked evidence.`,
        suggestedFix: 'Attach test logs, screenshots, manual notes, or other required evidence before review.',
      }))
    }
  }
  for (const evidenceNode of evidenceNodes) {
    const evidenceId = stringValue(evidenceNode.id)
    const evidencePath = stringValue(evidenceNode.path)
    if (['attached', 'replaced'].includes(stringValue(evidenceNode.status)) && evidencePath && !existsSync(resolveEvidencePath(root, evidencePath))) {
      issues.push(issue({
        validator: 'Evidence',
        code: 'EVIDENCE_FILE_MISSING',
        severity: 'error',
        file: defaultArtifacts.evidenceTree,
        nodeId: evidenceId,
        message: `Evidence node ${evidenceId} points to a missing file: ${evidencePath}.`,
        suggestedFix: 'Attach the referenced evidence file or update the evidence path.',
      }))
    }
  }
  issues.push(...await validateVisualDesign(root, { requireEvidence: true }))
  return issues
}

async function readJsonIfExists(root: string, key: Parameters<typeof artifactPath>[1]): Promise<JsonObject | null> {
  const filePath = artifactPath(root, key)
  if (!existsSync(filePath)) {
    return null
  }
  const parsed = await readJsonSafe<JsonObject>(filePath)
  return parsed.ok ? parsed.value : null
}

function missingIssue(validator: string, code: string, file: string, message: string): ValidationIssue {
  return issue({
    validator,
    code,
    severity: 'error',
    file,
    message,
    suggestedFix: 'Generate or restore the missing PBE artifact before entering this stage.',
  })
}

function scopeLeakIssue(validator: string, code: string, file: string, nodeId: string, productId: string): ValidationIssue {
  return issue({
    validator,
    code,
    severity: 'error',
    file,
    nodeId,
    message: `Deferred/out_of_scope Product node ${productId} appears in active scope ${nodeId}.`,
    suggestedFix: 'Remove inactive Product scope from active Work/Test/ACEP scope or explicitly reopen it through a Change Node and human gate.',
  })
}

function missingLinkIssue(validator: string, code: string, file: string, nodeId: string, targetLabel: string, targetId: string): ValidationIssue {
  return issue({
    validator,
    code,
    severity: 'error',
    file,
    nodeId,
    message: `${nodeId} references missing ${targetLabel}: ${targetId}.`,
    suggestedFix: `Create the referenced ${targetLabel} node or remove the stale link.`,
  })
}

function validateWorkDependencyGraph(work: JsonObject | null): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const nodes = nodesOf(work)
  const entries: Array<[string, JsonObject]> = []
  for (const node of nodes) {
    const id = stringValue(node.id)
    if (id) {
      entries.push([id, node])
    }
  }
  const nodeMap = new Map<string, JsonObject>(entries)
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const pathStack: string[] = []

  function visit(id: string): void {
    if (visited.has(id) || !nodeMap.has(id)) {
      return
    }
    if (visiting.has(id)) {
      const cycleStart = pathStack.indexOf(id)
      const cycle = [...pathStack.slice(cycleStart), id].join(' -> ')
      issues.push(issue({
        validator: 'WPD',
        code: 'DEPENDENCY_CYCLE',
        severity: 'error',
        file: defaultArtifacts.workTree,
        nodeId: id,
        message: `Work dependency graph contains a cycle: ${cycle}.`,
        suggestedFix: 'Break the dependency cycle before planning or executing work.',
      }))
      return
    }
    visiting.add(id)
    pathStack.push(id)
    const node = nodeMap.get(id)
    for (const dependencyId of arrayStrings(node?.dependencies)) {
      visit(dependencyId)
    }
    pathStack.pop()
    visiting.delete(id)
    visited.add(id)
  }

  for (const id of nodeMap.keys()) {
    visit(id)
  }
  return issues
}

function hasSelectedVisualWork(
  product: JsonObject | null,
  work: JsonObject | null,
  test: JsonObject | null,
  visualReference: JsonObject | null,
): boolean {
  if (visualReference?.visualWorkRequired === true) {
    return true
  }
  const productHasVisualWork = nodesOf(product).some((node) => {
    if (!['selected', 'foundation'].includes(stringValue(node.scopeClass))) {
      return false
    }
    return stringValue(node.type) === 'ui_surface' && getNestedBoolean(node, ['ux', 'visualAffected']) === true ||
      stringValue(node.type) === 'ui_state' && getNestedBoolean(node, ['ux', 'visualAffected']) === true ||
      getNestedBoolean(node, ['ux', 'visualWorkRequired']) === true ||
      getNestedBoolean(node, ['visualImpact']) === true
  })
  const workHasVisualWork = nodesOf(work).some((node) => {
    if (!['selected', 'foundation'].includes(stringValue(node.scopeClass))) {
      return false
    }
    const impact = stringValue(node.uiImpact)
    return ['visual', 'appearance', 'direct_visual'].includes(impact) ||
      getNestedBoolean(node, ['visualImpact']) === true ||
      getNestedBoolean(node, ['ui', 'visualWorkRequired']) === true
  })
  const testHasVisualWork = nodesOf(test).some((node) => {
    if (stringValue(node.id) === stringValue(test?.rootNodeId)) {
      return false
    }
    return stringValue(node.type) === 'visual_regression_test' ||
      arrayStrings(node.evidenceRequired).some((entry) => entry.toLowerCase().includes('visual contract'))
  })
  return productHasVisualWork || workHasVisualWork || testHasVisualWork
}

function validateVisualEvidence(root: string, uiSurfaceInventory: JsonObject | null, evidence: JsonObject | null): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const evidenceNodes = arrayObjects(evidence?.evidence)
  for (const surface of [
    ...arrayObjects(uiSurfaceInventory?.surfaces),
    ...arrayObjects(uiSurfaceInventory?.childSurfaces),
  ]) {
    const surfaceId = stringValue(surface.surfaceId)
    for (const screenshot of arrayObjects(surface.requiredScreenshots)) {
      if (screenshot.required !== true || stringValue(screenshot.deferredReason) || stringValue(screenshot.blockedReason)) {
        continue
      }
      const expectedPath = normalizeEvidencePath(stringValue(screenshot.path))
      const linkedEvidence = evidenceNodes.filter((entry) => {
        const entryPath = normalizeEvidencePath(stringValue(entry.path))
        return entryPath && expectedPath && entryPath === expectedPath ||
          stringValue(entry.id) === stringValue(screenshot.evidenceNodeId)
      })
      const staleEvidence = linkedEvidence.some((entry) => stringValue(entry.status) === 'stale_evidence')
      const currentEvidence = linkedEvidence.some((entry) => ['attached', 'replaced'].includes(stringValue(entry.status)))
      if (staleEvidence) {
        issues.push(issue({
          validator: 'VisualDesign',
          code: 'STALE_VISUAL_EVIDENCE',
          severity: 'error',
          file: defaultArtifacts.evidenceTree,
          nodeId: surfaceId,
          message: `Visual evidence for surface ${surfaceId} state ${String(screenshot.state)} is stale.`,
          suggestedFix: 'Capture fresh screenshot/manual visual evidence after the latest UI change.',
        }))
      }
      if (!currentEvidence) {
        issues.push(issue({
          validator: 'VisualDesign',
          code: 'VISUAL_SCREENSHOT_EVIDENCE_MISSING',
          severity: 'error',
          file: defaultArtifacts.uiSurfaceInventory,
          nodeId: surfaceId,
          message: `Required visual evidence is missing for surface ${surfaceId} state ${String(screenshot.state)}.`,
          suggestedFix: 'Attach screenshot/manual evidence and link it in Evidence Tree, or defer/block the state explicitly.',
        }))
      } else if (expectedPath && !existsSync(resolveEvidencePath(root, expectedPath))) {
        issues.push(issue({
          validator: 'VisualDesign',
          code: 'VISUAL_SCREENSHOT_FILE_MISSING',
          severity: 'error',
          file: defaultArtifacts.evidenceTree,
          nodeId: surfaceId,
          message: `Visual evidence file is missing: ${expectedPath}.`,
          suggestedFix: 'Create the screenshot file or update the evidence path.',
        }))
      }
    }
  }
  return issues
}

function validateAcceptanceCriterion(productNode: JsonObject, criterion: JsonObject): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const criterionId = stringValue(criterion.id)
  const productId = stringValue(productNode.id)
  const hasCondition = Boolean(stringValue(criterion.condition) || stringValue(criterion.trigger))
  const hasBehavior = Boolean(stringValue(criterion.systemResponse) || stringValue(criterion.shall) || stringValue(criterion.expectedBehavior))
  const hasEvidence = arrayStrings(criterion.requiredEvidence).length > 0 ||
    arrayStrings(getNestedValue(criterion, ['verification', 'evidenceTypes'])).length > 0
  const hasVerification = Boolean(stringValue(criterion.verificationMethod) || getNestedBoolean(criterion, ['verification', 'required']) === true)

  if (!criterionId) {
    issues.push(criteriaIssue('AC_ID_MISSING', criterionId, productId, 'Acceptance criterion is missing id.', 'Assign a stable AC-* id.'))
  }
  if (stringValue(criterion.status) === 'confirmed' && !hasCondition) {
    issues.push(criteriaIssue('AC_CONDITION_MISSING', criterionId, productId, `Acceptance criterion ${criterionId} lacks condition/trigger.`, 'Add WHEN/IF/WHILE/WHERE condition or explicit trigger.'))
  }
  if (stringValue(criterion.status) === 'confirmed' && !hasBehavior) {
    issues.push(criteriaIssue('AC_BEHAVIOR_MISSING', criterionId, productId, `Acceptance criterion ${criterionId} lacks expected observable behavior.`, 'Add systemResponse, shall, or expectedBehavior.'))
  }
  if (stringValue(criterion.status) === 'confirmed' && !hasVerification) {
    issues.push(criteriaIssue('AC_VERIFICATION_METHOD_MISSING', criterionId, productId, `Acceptance criterion ${criterionId} lacks verification method.`, 'Add verificationMethod or verification.required metadata.'))
  }
  if (stringValue(criterion.status) === 'confirmed' && !hasEvidence) {
    issues.push(criteriaIssue('AC_EVIDENCE_REQUIREMENT_MISSING', criterionId, productId, `Acceptance criterion ${criterionId} lacks required evidence metadata.`, 'Add requiredEvidence or verification.evidenceTypes.'))
  }

  const abstractTerms = collectTextAbstractTerms(criterionText(criterion))
  if (abstractTerms.length > 0) {
    issues.push(criteriaIssue('AC_ABSTRACT_TERM', criterionId, productId, `Acceptance criterion ${criterionId} contains abstract term(s): ${abstractTerms.join(', ')}.`, 'Replace subjective language with observable pass/fail criteria.'))
  }

  return issues
}

function criteriaIssue(code: string, criterionId: string, productId: string, message: string, suggestedFix: string): ValidationIssue {
  return issue({
    validator: 'AcceptanceCriteria',
    code,
    severity: 'error',
    file: defaultArtifacts.productTree,
    nodeId: criterionId || productId,
    message,
    suggestedFix,
  })
}

function findRootNode(product: JsonObject): JsonObject | null {
  const rootNodeId = stringValue(product.rootNodeId)
  return nodesOf(product).find((node) => stringValue(node.id) === rootNodeId) || null
}

function collectAcceptanceCriteriaIds(product: JsonObject | null): Set<string> {
  return new Set(nodesOf(product)
    .flatMap((node) => acceptanceCriteriaOf(node))
    .map((criterion) => stringValue(criterion.id))
    .filter(Boolean))
}

function collectInactiveProductIds(product: JsonObject | null): Set<string> {
  return new Set(nodesOf(product)
    .filter((node) => ['deferred', 'out_of_scope', 'blocked'].includes(stringValue(node.scopeClass)) || ['deferred', 'out_of_scope', 'blocked'].includes(stringValue(node.status)))
    .map((node) => stringValue(node.id))
    .filter(Boolean))
}

function collectInactiveWorkIds(work: JsonObject | null): Set<string> {
  return new Set(nodesOf(work)
    .filter((node) => ['deferred', 'out_of_scope', 'blocked'].includes(stringValue(node.scopeClass)) || ['deferred', 'out_of_scope', 'blocked'].includes(stringValue(node.status)))
    .map((node) => stringValue(node.id))
    .filter(Boolean))
}

function nodesOf(tree: JsonObject | null): JsonObject[] {
  return arrayObjects(tree?.nodes)
}

function acceptanceCriteriaOf(node: JsonObject): JsonObject[] {
  return arrayObjects(node.acceptanceCriteria)
}

function childrenOf(node: JsonObject): string[] {
  return arrayStrings(node.children)
}

function isExecutableProductNode(node: JsonObject): boolean {
  const scope = stringValue(node.scopeClass)
  const type = stringValue(node.type)
  const status = stringValue(node.status)
  return executableScopes.has(scope) &&
    !nonExecutableTypes.has(type) &&
    !['deferred', 'out_of_scope', 'blocked'].includes(status)
}

function hasUserConfirmationEvidence(node: JsonObject): boolean {
  return stringValue(node.confirmedBy) === 'user' ||
    Boolean(node.userConfirmedAt) ||
    getNestedString(node, ['source', 'actor']) === 'user' ||
    getNestedString(node, ['source', 'type']) === 'user_interview' ||
    getNestedString(node, ['decisionSource', 'actor']) === 'user'
}

function collectUnresolvedAbstractTerms(node: JsonObject): string[] {
  if (getNestedString(node, ['ambiguityResolution', 'status']) === 'resolved') {
    return []
  }
  const explicitTerms = [
    ...arrayStrings(getNestedValue(node, ['ambiguity', 'terms'])),
    ...arrayStrings(getNestedValue(node, ['ambiguity', 'abstractTerms'])),
  ]
  const textTerms = collectTextAbstractTerms([
    stringValue(node.title),
    stringValue(node.why),
    ...arrayStrings(node.acceptance),
  ].join(' '))
  return [...new Set([...explicitTerms, ...textTerms])]
}

function collectTextAbstractTerms(text: string): string[] {
  const haystack = text.toLowerCase()
  return abstractQualityTerms.filter((term) => haystack.includes(term.toLowerCase()))
}

function criterionText(criterion: JsonObject): string {
  return [
    criterion.statement,
    criterion.condition,
    criterion.systemResponse,
    criterion.shall,
    criterion.expectedBehavior,
    criterion.observableResult,
  ].map(stringValue).join(' ')
}

function resolveEvidencePath(root: string, evidencePath: string): string {
  if (/^[a-zA-Z]:[\\/]/.test(evidencePath) || evidencePath.startsWith('/')) {
    return evidencePath
  }
  return `${root}/${evidencePath}`.replaceAll('\\', '/')
}

function normalizeEvidencePath(evidencePath: string): string {
  return evidencePath.replaceAll('\\', '/')
}

function getNestedString(value: unknown, keys: string[]): string {
  return stringValue(getNestedValue(value, keys))
}

function getNestedBoolean(value: unknown, keys: string[]): boolean | null {
  const nested = getNestedValue(value, keys)
  return typeof nested === 'boolean' ? nested : null
}

function getNestedValue(value: unknown, keys: string[]): unknown {
  let cursor = value
  for (const key of keys) {
    if (!isObject(cursor)) {
      return undefined
    }
    cursor = cursor[key]
  }
  return cursor
}

function arrayObjects(value: unknown): JsonObject[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter(isObject)
}

function arrayStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map(stringValue).filter(Boolean)
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
