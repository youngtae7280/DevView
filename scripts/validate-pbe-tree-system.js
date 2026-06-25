import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'
import Ajv2020 from 'ajv/dist/2020.js'

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const targetRoot = process.cwd()
const errors = []
const ajv = new Ajv2020({ allErrors: true, strict: false })

const schemaTargets = {
  product: {
    schema: 'schemas/product-tree.schema.json',
    target: '.pbe/tree/product-tree.json',
    template: 'templates/product-tree.template.json',
  },
  project: {
    schema: 'schemas/project-tree.schema.json',
    target: '.pbe/tree/project-tree.json',
    template: 'templates/project-tree.template.json',
  },
  work: {
    schema: 'schemas/work-tree.schema.json',
    target: '.pbe/tree/work-tree.json',
    template: 'templates/work-tree.template.json',
  },
  test: {
    schema: 'schemas/test-tree.schema.json',
    target: '.pbe/tree/test-tree.json',
    template: 'templates/test-tree.template.json',
  },
  cycle: {
    schema: 'schemas/cycle-tree.schema.json',
    target: '.pbe/execution/cycle-tree.json',
    template: 'templates/cycle-tree.template.json',
  },
  decision: {
    schema: 'schemas/decision-queue.schema.json',
    target: '.pbe/control/decision-queue.json',
    template: 'templates/decision-queue.template.json',
  },
  change: {
    schema: 'schemas/change-tree.schema.json',
    target: '.pbe/control/change-tree.json',
    template: 'templates/change-tree.template.json',
  },
  impact: {
    schema: 'schemas/impact-tree.schema.json',
    target: '.pbe/control/impact-tree.json',
    template: 'templates/impact-tree.template.json',
  },
  evidence: {
    schema: 'schemas/evidence-tree.schema.json',
    target: '.pbe/evidence/evidence-tree.json',
    template: 'templates/evidence-tree.template.json',
  },
  acceptance: {
    schema: 'schemas/acceptance-tree.schema.json',
    target: '.pbe/control/acceptance-tree.json',
    template: 'templates/acceptance-tree.template.json',
  },
  legacyInventory: {
    schema: 'schemas/legacy-control-inventory.schema.json',
    target: '.pbe/control/legacy-control-inventory.json',
    template: 'templates/legacy-control-inventory.template.json',
  },
  surfaceCompletion: {
    schema: 'schemas/surface-completion-ledger.schema.json',
    target: '.pbe/control/surface-completion-ledger.json',
    template: 'templates/surface-completion-ledger.template.json',
  },
  hardwareReadiness: {
    schema: 'schemas/hardware-readiness-ledger.schema.json',
    target: '.pbe/control/hardware-readiness-ledger.json',
    template: 'templates/hardware-readiness-ledger.template.json',
  },
  visualReference: {
    schema: 'schemas/visual-reference.schema.json',
    target: '.pbe/blueprint/visual-reference.json',
    template: 'templates/visual-reference.template.json',
  },
  designTokens: {
    schema: 'schemas/design-tokens.schema.json',
    target: '.pbe/blueprint/design-tokens.json',
    template: 'templates/design-tokens.template.json',
  },
  componentStyleContract: {
    schema: 'schemas/component-style-contract.schema.json',
    target: '.pbe/blueprint/component-style-contract.json',
    template: 'templates/component-style-contract.template.json',
  },
  uiSurfaceInventory: {
    schema: 'schemas/ui-surface-inventory.schema.json',
    target: '.pbe/control/ui-surface-inventory.json',
    template: 'templates/ui-surface-inventory.template.json',
  },
  componentStyleInventory: {
    schema: 'schemas/component-style-inventory.schema.json',
    target: '.pbe/control/component-style-inventory.json',
    template: 'templates/component-style-inventory.template.json',
  },
  visualVerification: {
    schema: 'schemas/visual-verification-profile.schema.json',
    target: '.pbe/control/visual-verification-profile.json',
    template: 'templates/visual-verification-profile.template.json',
  },
  verificationMiss: {
    schema: 'schemas/verification-miss-log.schema.json',
    target: '.pbe/control/verification-miss-log.json',
    template: 'templates/verification-miss-log.template.json',
  },
}

const jsonNodeTemplates = [
  {
    label: 'templates/change-node.template.json',
    schemaKey: 'change',
    schemaPointer: '#/$defs/change',
  },
]

const schemaEntries = Object.entries(schemaTargets).map(([key, target]) => {
  const schema = readJson(target.schema, `schema ${target.schema}`)
  if (schema) {
    try {
      ajv.addSchema(schema)
    } catch (error) {
      errors.push(`Invalid JSON schema ${target.schema}: ${error.message}`)
    }
  }
  return [key, { ...target, schema }]
})

for (const [, target] of schemaEntries) {
  if (!target.schema) {
    continue
  }
  try {
    ajv.compile(target.schema)
  } catch (error) {
    errors.push(`Schema compile failed for ${target.schema}: ${error.message}`)
  }
}

validateTemplates()
const targetData = validateOptionalTreeTargets()
validateTreeLinks(targetData)

if (errors.length > 0) {
  console.error('PBE v2 tree validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

const targetCount = Object.values(targetData).filter(Boolean).length
if (targetCount === 0) {
  console.log('PBE v2 tree validation passed. No .pbe tree artifacts found; templates and schemas are valid.')
} else {
  console.log(`PBE v2 tree validation passed. Validated ${targetCount} .pbe tree artifact(s).`)
}

function validateTemplates() {
  for (const [key, target] of schemaEntries) {
    const value = readJson(target.template, `template ${target.template}`)
    if (value) {
      validateWithSchema(value, key, target.template)
    }
  }

  for (const template of jsonNodeTemplates) {
    const value = readJson(template.label, `template ${template.label}`)
    if (!value) {
      continue
    }
    const schemaId = schemaEntries.find(([key]) => key === template.schemaKey)?.[1]?.schema?.$id
    if (!schemaId) {
      errors.push(`${template.label} cannot be validated because ${template.schemaKey} schema is missing $id`)
      continue
    }
    const validate = ajv.getSchema(`${schemaId}${template.schemaPointer}`)
    if (!validate) {
      errors.push(`${template.label} cannot find schema pointer ${template.schemaPointer}`)
      continue
    }
    collectSchemaErrors(validate, value, template.label)
  }
}

function validateOptionalTreeTargets() {
  const data = {}
  for (const [key, target] of schemaEntries) {
    const absolutePath = path.join(targetRoot, target.target)
    if (!existsSync(absolutePath)) {
      data[key] = null
      continue
    }
    const value = readJson(target.target, target.target, targetRoot)
    if (value) {
      validateWithSchema(value, key, target.target)
    }
    data[key] = value
  }
  return data
}

function validateTreeLinks(data) {
  const productIds = collectNodeIds(data.product)
  const projectIds = collectNodeIds(data.project)
  const workIds = collectNodeIds(data.work)
  const testIds = collectNodeIds(data.test)
  const cycleIds = collectCycleIds(data.cycle)
  const changeIds = collectChangeIds(data.change)
  const evidenceIds = collectEvidenceIds(data.evidence)
  const legacyInventoryIds = collectInventoryIds(data.legacyInventory)
  const legacyInventoryMap = collectInventoryMap(data.legacyInventory)
  const surfaceCompletionIds = collectSurfaceIds(data.surfaceCompletion)
  const hardwareReadinessIds = collectFeatureIds(data.hardwareReadiness)
  const uiSurfaceIds = collectUiSurfaceIds(data.uiSurfaceInventory)
  const componentStyleNames = collectComponentStyleNames(data.componentStyleInventory)
  const visualProfileIds = collectProfileIds(data.visualVerification)
  const verificationMissIds = collectMissIds(data.verificationMiss)
  const productMap = collectNodeMap(data.product)
  const projectMap = collectNodeMap(data.project)
  const workMap = collectNodeMap(data.work)
  const testMap = collectNodeMap(data.test)
  const evidenceMap = collectEvidenceMap(data.evidence)
  const allNodeMap = new Map([...productMap, ...projectMap, ...workMap, ...testMap, ...evidenceMap])
  const impactsByAffected = collectImpactsByAffected(data.impact)
  const impactsByChange = collectImpactsByChange(data.impact)
  const acceptanceCriteriaIds = collectAcceptanceCriteriaIds(data.product)
  const acceptanceCriteriaMap = collectAcceptanceCriteriaMap(data.product)
  const acceptanceCriteriaByProduct = collectAcceptanceCriteriaByProduct(data.product)
  const requiredAcceptanceCriteriaByProduct = collectRequiredAcceptanceCriteriaByProduct(data.product)
  const ambiguousProductIds = collectAmbiguousProductIds(data.product)
  const closureRequiresEvidence = requiresClosureEvidence(data.cycle, data.acceptance)
  const knownNodeIds = new Set([
    ...productIds,
    ...projectIds,
    ...workIds,
    ...testIds,
    ...cycleIds,
    ...changeIds,
    ...evidenceIds,
    ...legacyInventoryIds,
    ...surfaceCompletionIds,
    ...hardwareReadinessIds,
    ...uiSurfaceIds,
    ...componentStyleNames,
    ...visualProfileIds,
    ...verificationMissIds,
  ])

  validateTreeShape(data.product, 'product')
  validateTreeShape(data.project, 'project')
  validateTreeShape(data.work, 'work')
  validateTreeShape(data.test, 'test')
  validateProductReadiness(data.product)
  validateCycleTree(data.cycle, { productIds, projectIds, workIds, testIds })
  validateDecisionQueue(data.decision, knownNodeIds)
  validateChangeTree(data.change, { knownNodeIds, acceptanceCriteriaIds, impactsByChange })
  validateImpactTree(data.impact, { knownNodeIds, changeIds, acceptanceCriteriaIds, allNodeMap })
  validateEvidenceTree(data.evidence, { knownNodeIds, testIds, acceptanceCriteriaIds })
  validateLegacyControlInventory(data.legacyInventory, { productIds, projectIds, workIds, testIds, evidenceIds })
  validateSurfaceCompletionLedger(data.surfaceCompletion, {
    productIds,
    projectIds,
    workIds,
    testIds,
    evidenceIds,
    legacyInventoryIds,
    legacyInventoryMap,
    surfaceCompletionIds,
    visualProfileIds,
    hardwareReadinessIds,
  })
  validateHardwareReadinessLedger(data.hardwareReadiness, { productIds, workIds, testIds, evidenceIds })
  validateUiSurfaceInventory(data.uiSurfaceInventory, { productIds, workIds, testIds })
  validateComponentStyleInventory(data.componentStyleInventory)
  validateVisualVerificationProfile(data.visualVerification, { productIds, projectIds, workIds, testIds, evidenceIds })
  validateVisualDesignContractArtifacts(data, { productIds, workIds, testIds })
  validateVerificationMissLog(data.verificationMiss, { knownNodeIds, testIds, evidenceIds })
  validateCycleClosure(data.cycle, { workMap, testMap, evidenceMap })
  validateAcceptanceTree(data.acceptance, {
    productIds,
    productMap,
    evidenceIds,
    evidenceMap,
    impactsByAffected,
  })
  validateProductClosure(data.product, {
    acceptanceTree: data.acceptance,
    evidenceMap,
    impactsByAffected,
  })

  for (const node of data.project?.nodes || []) {
    validateKnownIds(node.derivedFromProductNodeIds, productIds, `project ${node.id}`, 'product source')
  }

  for (const node of data.work?.nodes || []) {
    const isRoot = node.id === data.work.rootNodeId
    if (!isRoot && ['selected', 'foundation'].includes(node.scopeClass) && !hasAny(node.derivedFromProductNodeIds)) {
      errors.push(`work ${node.id} must derive selected/foundation work from Product Tree nodes`)
    }
    if (
      !isRoot &&
      data.project &&
      ['selected', 'foundation'].includes(node.scopeClass) &&
      !hasAny(node.derivedFromProjectNodeIds)
    ) {
      errors.push(`work ${node.id} must derive selected/foundation work from Project Tree nodes`)
    }
    for (const productId of node.derivedFromProductNodeIds || []) {
      if (ambiguousProductIds.has(productId)) {
        errors.push(`work ${node.id} derives from ambiguous or partial Product node ${productId}`)
      }
    }
    const sourceCriteriaIds = (node.derivedFromProductNodeIds || []).flatMap(
      (productId) => acceptanceCriteriaByProduct.get(productId) || [],
    )
    if (
      !isRoot &&
      ['selected', 'foundation'].includes(node.scopeClass) &&
      hasAny(sourceCriteriaIds) &&
      !hasAny(node.satisfiesAcceptanceCriteriaIds)
    ) {
      errors.push(
        `work ${node.id} derives from Product nodes with acceptanceCriteria but lacks satisfiesAcceptanceCriteriaIds`,
      )
    }
    if (
      !isRoot &&
      ['selected', 'foundation'].includes(node.scopeClass) &&
      !hasAny(node.satisfiesAcceptanceCriteriaIds) &&
      !node.acceptanceCriteriaNotLinkedReason
    ) {
      errors.push(
        `work ${node.id} must link satisfiesAcceptanceCriteriaIds or record acceptanceCriteriaNotLinkedReason`,
      )
    }
    validateKnownIds(node.derivedFromProductNodeIds, productIds, `work ${node.id}`, 'product source')
    validateKnownIds(node.derivedFromProjectNodeIds, projectIds, `work ${node.id}`, 'project source')
    validateKnownIds(
      node.satisfiesAcceptanceCriteriaIds,
      acceptanceCriteriaIds,
      `work ${node.id}`,
      'acceptance criteria',
    )
    validateKnownIds(node.dependencies, workIds, `work ${node.id}`, 'work dependency')
  }

  for (const node of data.test?.nodes || []) {
    const isRoot = node.id === data.test.rootNodeId
    if (
      !isRoot &&
      !hasAny(node.verifiesProductNodeIds) &&
      !hasAny(node.verifiesWorkNodeIds) &&
      !hasAny(node.verifiesAcceptanceCriteriaIds)
    ) {
      errors.push(`test ${node.id} must verify Product, Work, or Acceptance Criteria nodes`)
    }
    if (!isRoot && !hasAny(node.evidenceRequired)) {
      errors.push(`test ${node.id} must require evidence`)
    }
    validateKnownIds(node.verifiesProductNodeIds, productIds, `test ${node.id}`, 'product verification target')
    validateKnownIds(node.verifiesProjectNodeIds, projectIds, `test ${node.id}`, 'project verification target')
    validateKnownIds(node.verifiesWorkNodeIds, workIds, `test ${node.id}`, 'work verification target')
    validateKnownIds(
      node.verifiesAcceptanceCriteriaIds,
      acceptanceCriteriaIds,
      `test ${node.id}`,
      'acceptance criteria',
    )
  }

  if (data.test) {
    const verifiedCriteriaIds = new Set(
      (data.test.nodes || []).flatMap((node) => node.verifiesAcceptanceCriteriaIds || []),
    )
    const testNodes = data.test.nodes || []
    for (const node of data.work?.nodes || []) {
      const isRoot = node.id === data.work.rootNodeId
      if (isRoot || !['selected', 'foundation'].includes(node.scopeClass)) {
        continue
      }
      const coveredByTest = testNodes.some(
        (test) =>
          test.verifiesWorkNodeIds?.includes(node.id) ||
          (node.satisfiesAcceptanceCriteriaIds || []).some((criteriaId) =>
            test.verifiesAcceptanceCriteriaIds?.includes(criteriaId),
          ),
      )
      if (!coveredByTest) {
        errors.push(`work ${node.id} lacks Test Tree coverage`)
      }
    }
    for (const [productId, criteriaIds] of requiredAcceptanceCriteriaByProduct) {
      for (const criteriaId of criteriaIds) {
        if (!verifiedCriteriaIds.has(criteriaId)) {
          errors.push(`product ${productId} acceptance criteria ${criteriaId} lacks Test Tree coverage`)
        }
      }
    }
  }

  if (closureRequiresEvidence) {
    validateAcceptanceCriteriaEvidenceClosure({
      acceptanceCriteriaMap,
      evidenceMap,
    })
  }
}

function validateTreeShape(tree, label) {
  if (!tree) {
    return
  }
  const ids = collectNodeIds(tree)
  if (tree.rootNodeId && !ids.has(tree.rootNodeId)) {
    errors.push(`${label} tree rootNodeId is missing from nodes: ${tree.rootNodeId}`)
  }
  const seen = new Set()
  for (const node of tree.nodes || []) {
    if (!node.id) {
      errors.push(`${label} tree contains a node without id`)
      continue
    }
    if (seen.has(node.id)) {
      errors.push(`${label} tree contains duplicate node id: ${node.id}`)
    }
    seen.add(node.id)
    validateKnownIds(node.children, ids, `${label} ${node.id}`, 'child')
    if (node.parent && !ids.has(node.parent)) {
      errors.push(`${label} ${node.id} references missing parent ${node.parent}`)
    }
  }
}

function validateCycleTree(cycleTree, refs) {
  if (!cycleTree) {
    return
  }
  const cycleIds = collectCycleIds(cycleTree)
  if (cycleTree.activeCycleId && !cycleIds.has(cycleTree.activeCycleId)) {
    errors.push(`cycle tree activeCycleId is missing from cycles: ${cycleTree.activeCycleId}`)
  }
  const knownCycleScope = new Set([...refs.productIds, ...refs.projectIds, ...refs.workIds, ...refs.testIds])
  for (const cycle of cycleTree.cycles || []) {
    validateKnownIds(cycle.includedProductNodeIds, refs.productIds, `cycle ${cycle.id}`, 'included product node')
    validateKnownIds(cycle.includedProjectNodeIds, refs.projectIds, `cycle ${cycle.id}`, 'included project node')
    validateKnownIds(cycle.includedWorkNodeIds, refs.workIds, `cycle ${cycle.id}`, 'included work node')
    validateKnownIds(cycle.includedTestNodeIds, refs.testIds, `cycle ${cycle.id}`, 'included test node')
    validateKnownIds(cycle.explicitlyExcludedNodeIds, knownCycleScope, `cycle ${cycle.id}`, 'excluded node')
  }
}

function validateCycleClosure(cycleTree, refs) {
  if (!cycleTree) {
    return
  }
  const closureStatuses = new Set(['submitted_for_review', 'accepted'])
  const executableStatuses = new Set(['selected', 'approved', 'running', 'submitted_for_review', 'accepted'])
  const incompleteTestStatuses = new Set(['planned', 'runnable', 'failed', 'blocked', 'stale', 'invalidated'])

  for (const cycle of cycleTree.cycles || []) {
    const includedWorkIds = cycle.includedWorkNodeIds || []
    const includedTestIds = cycle.includedTestNodeIds || []

    if (executableStatuses.has(cycle.status)) {
      if (!hasAny(includedWorkIds)) {
        errors.push(`cycle ${cycle.id} is ${cycle.status} but has no included Work Tree nodes`)
      }
      if (!hasAny(includedTestIds)) {
        errors.push(`cycle ${cycle.id} is ${cycle.status} but has no included Test Tree nodes`)
      }
    }

    for (const workId of includedWorkIds) {
      if (!refs.workMap.has(workId)) {
        continue
      }
      const testsForWork = includedTestIds
        .map((testId) => refs.testMap.get(testId))
        .filter((test) => test?.verifiesWorkNodeIds?.includes(workId))
      if (testsForWork.length === 0) {
        errors.push(`cycle ${cycle.id} included work ${workId} lacks included Test Tree coverage`)
      }
    }

    if (!closureStatuses.has(cycle.status)) {
      continue
    }

    for (const testId of includedTestIds) {
      const test = refs.testMap.get(testId)
      if (!test) {
        continue
      }
      if (incompleteTestStatuses.has(test.status)) {
        errors.push(`cycle ${cycle.id} is ${cycle.status} but included test ${testId} is ${test.status}`)
      }
      const attachedEvidence = evidenceForNode(refs.evidenceMap, testId).filter((evidence) =>
        ['attached', 'replaced'].includes(evidence.status),
      )
      if (attachedEvidence.length === 0) {
        errors.push(
          `cycle ${cycle.id} is ${cycle.status} but included test ${testId} lacks attached Evidence Tree evidence`,
        )
      }
    }
  }
}

function validateDecisionQueue(queue, knownNodeIds) {
  if (!queue) {
    return
  }
  for (const decision of queue.decisions || []) {
    validateKnownIds([decision.targetNodeId], knownNodeIds, `decision ${decision.id}`, 'target node')
  }
}

function validateProductReadiness(productTree) {
  if (!productTree) {
    return
  }
  const seenCriteriaIds = new Set()
  for (const node of productTree.nodes || []) {
    const isLeaf = !hasAny(node.children)
    const executableStatus = ['confirmed', 'accepted'].includes(node.status)
    const executableType = !['non_goal', 'risk', 'assumption', 'decision'].includes(node.type)
    const executableScope = !['deferred', 'blocked', 'out_of_scope'].includes(node.scopeClass)
    if (
      isLeaf &&
      executableStatus &&
      executableType &&
      executableScope &&
      !hasAny(node.acceptanceCriteria) &&
      !node.acceptanceNotRequiredReason
    ) {
      errors.push(`product ${node.id} is ${node.status} but lacks acceptanceCriteria or acceptanceNotRequiredReason`)
    }

    if (executableStatus && ['partial', 'ambiguous'].includes(node.ambiguity?.status)) {
      errors.push(`product ${node.id} is ${node.status} but ambiguity.status is ${node.ambiguity.status}`)
    }
    if (node.status === 'needs_clarification' && ['selected', 'foundation'].includes(node.scopeClass)) {
      errors.push(`product ${node.id} is needs_clarification but remains in executable scope ${node.scopeClass}`)
    }

    for (const criteria of node.acceptanceCriteria || []) {
      if (seenCriteriaIds.has(criteria.id)) {
        errors.push(`acceptance criteria ${criteria.id} is defined more than once`)
      }
      seenCriteriaIds.add(criteria.id)
      if (
        criteria.format === 'EARS' &&
        criteria.status === 'confirmed' &&
        (!criteria.condition || !criteria.systemResponse)
      ) {
        errors.push(`acceptance criteria ${criteria.id} is confirmed EARS but lacks condition or systemResponse`)
      }
    }

    const abstractTerms = collectAbstractTerms(node)
    if (
      executableStatus &&
      hasAny(abstractTerms) &&
      node.ambiguityResolution?.status !== 'resolved' &&
      !hasAny(node.acceptanceCriteria)
    ) {
      errors.push(
        `product ${node.id} contains abstract quality terms (${abstractTerms.join(', ')}) but lacks resolved ambiguityResolution or acceptanceCriteria`,
      )
    }
  }
}

function validateChangeTree(changeTree, refs) {
  if (!changeTree) {
    return
  }
  for (const change of changeTree.changes || []) {
    validateKnownIds(change.affectedNodeIds, refs.knownNodeIds, `change ${change.id}`, 'affected node')
    validateKnownIds(
      change.affectedAcceptanceCriteriaIds,
      refs.acceptanceCriteriaIds,
      `change ${change.id}`,
      'acceptance criteria',
    )
    validateKnownIds(
      change.criteriaDelta?.modified,
      refs.acceptanceCriteriaIds,
      `change ${change.id} criteriaDelta.modified`,
      'acceptance criteria',
    )
    validateKnownIds(
      change.criteriaDelta?.invalidated,
      refs.acceptanceCriteriaIds,
      `change ${change.id} criteriaDelta.invalidated`,
      'acceptance criteria',
    )

    const changesCompletionMeaning =
      [
        'missing_requirement',
        'design_correction',
        'scope_change',
        'feedback',
        'acceptance_change',
        'verification_change',
      ].includes(change.type) ||
      change.requiresRevisionRpd === true ||
      hasCriteriaDelta(change.criteriaDelta)
    if (
      ['approved', 'applied', 'resolved'].includes(change.status) &&
      changesCompletionMeaning &&
      !hasAny(refs.impactsByChange.get(change.id))
    ) {
      errors.push(
        `change ${change.id} changes product/scope/acceptance/verification meaning but lacks Impact Tree entries`,
      )
    }
    if (['approved', 'applied', 'resolved'].includes(change.status) && hasCriteriaDelta(change.criteriaDelta)) {
      const changedCriteriaIds = [
        ...(change.criteriaDelta?.modified || []),
        ...(change.criteriaDelta?.invalidated || []),
      ]
      for (const criteriaId of changedCriteriaIds) {
        const hasCriteriaImpact = (refs.impactsByChange.get(change.id) || []).some(
          (impact) =>
            impact.affectedAcceptanceCriteriaIds?.includes(criteriaId) &&
            ['reopen', 'retest', 'replace_evidence'].includes(impact.requiredAction),
        )
        if (!hasCriteriaImpact) {
          errors.push(
            `change ${change.id} changes acceptance criteria ${criteriaId} but lacks retest/reopen/replace_evidence impact`,
          )
        }
      }
    }
  }
}

function validateImpactTree(impactTree, refs) {
  if (!impactTree) {
    return
  }
  for (const impact of impactTree.impacts || []) {
    validateKnownIds([impact.changeId], refs.changeIds, `impact ${impact.id}`, 'change')
    validateKnownIds([impact.affectedNodeId], refs.knownNodeIds, `impact ${impact.id}`, 'affected node')
    validateKnownIds(
      impact.affectedAcceptanceCriteriaIds,
      refs.acceptanceCriteriaIds,
      `impact ${impact.id}`,
      'acceptance criteria',
    )
    if (impact.requiredAction === 'reopen') {
      const affected = refs.allNodeMap.get(impact.affectedNodeId)
      const reopenedStates = new Set(['reopened', 'stale', 'invalidated', 'stale_evidence'])
      if (affected && !reopenedStates.has(affected.status)) {
        errors.push(
          `impact ${impact.id} requires reopen but affected node ${impact.affectedNodeId} status is ${affected.status}`,
        )
      }
    }
  }
}

function validateEvidenceTree(evidenceTree, refs) {
  if (!evidenceTree) {
    return
  }
  for (const evidence of evidenceTree.evidence || []) {
    validateKnownIds(evidence.provesNodeIds, refs.knownNodeIds, `evidence ${evidence.id}`, 'proved node')
    validateKnownIds(evidence.evidenceForTestNodeIds, refs.testIds, `evidence ${evidence.id}`, 'test node')
    validateKnownIds(
      evidence.evidenceForAcceptanceCriteriaIds,
      refs.acceptanceCriteriaIds,
      `evidence ${evidence.id}`,
      'acceptance criteria',
    )
    if (!hasAny(evidence.provesNodeIds) && !hasAny(evidence.evidenceForTestNodeIds)) {
      errors.push(`evidence ${evidence.id} must prove at least one Product/Work/Test node or evidenceForTestNodeIds`)
    }
  }
}

function validateAcceptanceCriteriaEvidenceClosure(refs) {
  const attachedCriteriaIds = new Set()
  for (const evidence of refs.evidenceMap.values()) {
    if (!['attached', 'replaced'].includes(evidence.status)) {
      continue
    }
    for (const criteriaId of evidence.evidenceForAcceptanceCriteriaIds || []) {
      attachedCriteriaIds.add(criteriaId)
    }
  }

  for (const criteria of refs.acceptanceCriteriaMap.values()) {
    if (criteria.status !== 'confirmed' || criteria.verification?.required !== true) {
      continue
    }
    if (!attachedCriteriaIds.has(criteria.id)) {
      errors.push(`acceptance criteria ${criteria.id} lacks attached Evidence Tree evidence`)
    }
  }
}

function validateLegacyControlInventory(inventoryTree, refs) {
  if (!inventoryTree) {
    return
  }
  for (const inventory of inventoryTree.inventories || []) {
    validateKnownIds(inventory.productNodeIds, refs.productIds, `legacy inventory ${inventory.id}`, 'product node')
    validateKnownIds(inventory.projectNodeIds, refs.projectIds, `legacy inventory ${inventory.id}`, 'project node')
    validateKnownIds(inventory.workNodeIds, refs.workIds, `legacy inventory ${inventory.id}`, 'work node')
    validateKnownIds(inventory.testNodeIds, refs.testIds, `legacy inventory ${inventory.id}`, 'test node')
    validateKnownIds(inventory.evidenceNodeIds, refs.evidenceIds, `legacy inventory ${inventory.id}`, 'evidence node')

    if (inventory.claimStatus !== 'parity_claimed') {
      continue
    }
    if (!hasAny(inventory.evidenceNodeIds)) {
      errors.push(`legacy inventory ${inventory.id} claims parity but lacks evidenceNodeIds`)
    }
    for (const control of inventory.controls || []) {
      const requiredVisible = control.requiredForParity === true && control.legacyState === 'visible_enabled'
      if (requiredVisible && control.currentStatus !== 'matched') {
        errors.push(
          `legacy inventory ${inventory.id} claims parity but required control ${control.id} is ${control.currentStatus}`,
        )
      }
    }
    for (const handler of inventory.eventHandlers || []) {
      if (handler.requiredForParity === true && handler.currentStatus !== 'matched') {
        errors.push(
          `legacy inventory ${inventory.id} claims parity but required event handler ${handler.id} is ${handler.currentStatus}`,
        )
      }
      if (
        handler.currentStatus === 'matched' &&
        !hasAny(handler.evidenceNodeIds) &&
        !hasAny(inventory.evidenceNodeIds)
      ) {
        errors.push(`legacy inventory ${inventory.id} event handler ${handler.id} is matched but lacks evidenceNodeIds`)
      }
    }
  }
}

function validateSurfaceCompletionLedger(ledger, refs) {
  if (!ledger) {
    return
  }
  for (const surface of ledger.surfaces || []) {
    validateKnownIds(surface.productNodeIds, refs.productIds, `surface ${surface.id}`, 'product node')
    validateKnownIds(surface.projectNodeIds, refs.projectIds, `surface ${surface.id}`, 'project node')
    validateKnownIds(surface.workNodeIds, refs.workIds, `surface ${surface.id}`, 'work node')
    validateKnownIds(surface.testNodeIds, refs.testIds, `surface ${surface.id}`, 'test node')
    validateKnownIds(surface.evidenceNodeIds, refs.evidenceIds, `surface ${surface.id}`, 'evidence node')
    validateKnownIds(surface.legacyInventoryIds, refs.legacyInventoryIds, `surface ${surface.id}`, 'legacy inventory')
    validateKnownIds(surface.childSurfaceIds, refs.surfaceCompletionIds, `surface ${surface.id}`, 'child surface')
    validateKnownIds(
      surface.visualProfileIds,
      refs.visualProfileIds,
      `surface ${surface.id}`,
      'visual verification profile',
    )
    validateKnownIds(
      surface.hardwareReadinessIds,
      refs.hardwareReadinessIds,
      `surface ${surface.id}`,
      'hardware readiness feature',
    )
    validateKnownIds(
      surface.subdialogAudit?.childSurfaceIds,
      refs.surfaceCompletionIds,
      `surface ${surface.id} subdialog audit`,
      'child surface',
    )
    validateKnownIds(
      surface.subdialogAudit?.legacyInventoryIds,
      refs.legacyInventoryIds,
      `surface ${surface.id} subdialog audit`,
      'legacy inventory',
    )
    validateKnownIds(
      surface.subdialogAudit?.testNodeIds,
      refs.testIds,
      `surface ${surface.id} subdialog audit`,
      'test node',
    )
    validateKnownIds(
      surface.subdialogAudit?.evidenceNodeIds,
      refs.evidenceIds,
      `surface ${surface.id} subdialog audit`,
      'evidence node',
    )

    if (['selected', 'foundation'].includes(surface.scopeClass)) {
      if (!hasAny(surface.productNodeIds)) {
        errors.push(`surface ${surface.id} is ${surface.scopeClass} but lacks Product Tree links`)
      }
      if (!hasAny(surface.workNodeIds)) {
        errors.push(`surface ${surface.id} is ${surface.scopeClass} but lacks Work Tree links`)
      }
      if (!hasAny(surface.testNodeIds)) {
        errors.push(`surface ${surface.id} is ${surface.scopeClass} but lacks Test Tree links`)
      }
    }

    if (surface.parityClaim === 'parity_reviewed' && !hasAny(surface.legacyInventoryIds)) {
      errors.push(`surface ${surface.id} claims parity_reviewed but lacks legacyInventoryIds`)
    }
    if (['parity_reviewed', 'product_accepted'].includes(surface.completionLayer) && !hasAny(surface.evidenceNodeIds)) {
      errors.push(`surface ${surface.id} is ${surface.completionLayer} but lacks evidenceNodeIds`)
    }
    if (surface.completionLayer === 'product_accepted' && !hasAny(surface.acceptanceBranchIds)) {
      errors.push(`surface ${surface.id} is product_accepted but lacks acceptanceBranchIds`)
    }
    validateWorkflowParitySurface(surface, refs)
  }
}

function validateWorkflowParitySurface(surface, refs) {
  const closingLayers = new Set(['technical_stable', 'parity_reviewed', 'product_accepted'])
  if (!closingLayers.has(surface.completionLayer)) {
    return
  }

  const requiresNestedInventory =
    surface.opensDialog === true || surface.subdialogAudit?.required === true || surface.surfaceKind === 'workflow'
  if (requiresNestedInventory) {
    const childSurfaceIds = [...(surface.childSurfaceIds || []), ...(surface.subdialogAudit?.childSurfaceIds || [])]
    const inventoryIds = [...(surface.legacyInventoryIds || []), ...(surface.subdialogAudit?.legacyInventoryIds || [])]
    if (!hasAny(childSurfaceIds) && !hasAny(inventoryIds)) {
      errors.push(
        `surface ${surface.id} opens a dialog/workflow but lacks childSurfaceIds or subdialog legacyInventoryIds`,
      )
    }
    if (surface.subdialogAudit?.required === true && surface.subdialogAudit.status !== 'verified') {
      errors.push(`surface ${surface.id} subdialog audit is required but status is ${surface.subdialogAudit.status}`)
    }
  }

  for (const item of (surface.notChecked || []).filter((entry) => entry.blocksCompletion === true)) {
    errors.push(`surface ${surface.id} has not_checked item ${item.id} blocking completion`)
  }

  const commandMappedItems = (surface.items || []).filter((item) => item.status === 'command_mapped')
  const workflowEvidenceItems = (surface.items || []).filter((item) =>
    [
      'implemented',
      'dialog_surface_complete',
      'workflow_behavior_complete',
      'mock_verified',
      'hardware_user_testable',
    ].includes(item.status),
  )
  if (hasAny(commandMappedItems) && !hasAny(workflowEvidenceItems) && !hasAny(surface.evidenceNodeIds)) {
    errors.push(
      `surface ${surface.id} is ${surface.completionLayer} from command mapping only; workflow/dialog evidence is required`,
    )
  }

  if (surface.hardwareGated === true) {
    const hasSafeSubstitute = (surface.items || []).some(
      (item) =>
        ['mock_backed_ui', 'fake_read_result', 'ui_automation_hardware_disabled'].includes(
          item.substituteEvidenceType,
        ) &&
        (hasAny(item.evidenceNodeIds) || hasAny(surface.evidenceNodeIds)),
    )
    if (!hasSafeSubstitute) {
      errors.push(`surface ${surface.id} is hardware-gated but lacks mock/fake/UI-automation substitute evidence`)
    }
  }

  for (const inventoryId of surface.legacyInventoryIds || []) {
    const inventory = refs.legacyInventoryMap?.get(inventoryId)
    if (!inventory) {
      continue
    }
    for (const handler of inventory.eventHandlers || []) {
      if (handler.requiredForParity === true && handler.currentStatus !== 'matched') {
        errors.push(
          `surface ${surface.id} cannot close while legacy event handler ${handler.id} is ${handler.currentStatus}`,
        )
      }
    }
  }
}

function validateHardwareReadinessLedger(ledger, refs) {
  if (!ledger) {
    return
  }
  for (const feature of ledger.features || []) {
    validateKnownIds(feature.productNodeIds, refs.productIds, `hardware readiness ${feature.id}`, 'product node')
    validateKnownIds(feature.workNodeIds, refs.workIds, `hardware readiness ${feature.id}`, 'work node')
    validateKnownIds(feature.testNodeIds, refs.testIds, `hardware readiness ${feature.id}`, 'test node')
    validateKnownIds(feature.evidenceNodeIds, refs.evidenceIds, `hardware readiness ${feature.id}`, 'evidence node')
    validateKnownIds(
      feature.certificationEvidenceNodeIds,
      refs.evidenceIds,
      `hardware readiness ${feature.id}`,
      'certification evidence node',
    )

    if (feature.state === 'implemented_user_testable' && feature.userTestable !== true) {
      errors.push(`hardware readiness ${feature.id} is implemented_user_testable but userTestable is not true`)
    }
    if (
      feature.state === 'hardware_certified' &&
      !hasAny(feature.certificationEvidenceNodeIds) &&
      !hasAny(feature.evidenceNodeIds)
    ) {
      errors.push(`hardware readiness ${feature.id} is hardware_certified but lacks certification evidence`)
    }
  }
}

function validateUiSurfaceInventory(inventory, refs) {
  if (!inventory) {
    return
  }
  for (const surface of [...(inventory.surfaces || []), ...(inventory.childSurfaces || [])]) {
    validateKnownIds(surface.relatedProductNodes, refs.productIds, `UI surface ${surface.surfaceId}`, 'product node')
    validateKnownIds(surface.relatedWorkNodes, refs.workIds, `UI surface ${surface.surfaceId}`, 'work node')
    validateKnownIds(surface.relatedTestNodes, refs.testIds, `UI surface ${surface.surfaceId}`, 'test node')

    if (!hasAny(surface.statesRequired)) {
      errors.push(`UI surface ${surface.surfaceId} lacks statesRequired`)
    }

    for (const screenshot of surface.requiredScreenshots || []) {
      if (screenshot.required === true && !screenshot.path && !screenshot.deferredReason && !screenshot.blockedReason) {
        errors.push(
          `UI surface ${surface.surfaceId} required screenshot for state ${screenshot.state} lacks path, deferredReason, or blockedReason`,
        )
      }
    }
  }
}

function validateComponentStyleInventory(inventory) {
  if (!inventory) {
    return
  }
  for (const component of inventory.components || []) {
    if (component.visualChangeScope === 'shared' && !component.requiredContractRef && !component.exceptionReason) {
      errors.push(
        `component style ${component.componentName} is shared visual scope but lacks requiredContractRef or exceptionReason`,
      )
    }
    if (
      component.visualChangeScope === 'shared' &&
      component.usesDesignTokens === false &&
      !component.exceptionReason
    ) {
      errors.push(
        `component style ${component.componentName} is shared visual scope but is not token-backed and lacks exceptionReason`,
      )
    }
    if (hasAny(component.hardcodedStyleFindings) && !component.exceptionReason) {
      errors.push(`component style ${component.componentName} has hardcoded style findings but lacks exceptionReason`)
    }
  }
}

function validateVisualVerificationProfile(profileTree, refs) {
  if (!profileTree) {
    return
  }
  for (const profile of profileTree.profiles || []) {
    validateKnownIds(profile.productNodeIds, refs.productIds, `visual profile ${profile.id}`, 'product node')
    validateKnownIds(profile.projectNodeIds, refs.projectIds, `visual profile ${profile.id}`, 'project node')
    validateKnownIds(profile.workNodeIds, refs.workIds, `visual profile ${profile.id}`, 'work node')
    validateKnownIds(profile.testNodeIds, refs.testIds, `visual profile ${profile.id}`, 'test node')
    validateKnownIds(profile.evidenceNodeIds, refs.evidenceIds, `visual profile ${profile.id}`, 'evidence node')

    for (const check of profile.checks || []) {
      validateKnownIds(
        check.evidenceNodeIds,
        refs.evidenceIds,
        `visual profile ${profile.id} check ${check.id}`,
        'evidence node',
      )
      if (check.status === 'passed' && !hasAny(check.evidenceNodeIds) && !hasAny(profile.evidenceNodeIds)) {
        errors.push(`visual profile ${profile.id} check ${check.id} is passed but lacks evidenceNodeIds`)
      }
      if (check.status === 'not_runnable' && !check.reason && !profile.notRunnableReason) {
        errors.push(`visual profile ${profile.id} check ${check.id} is not_runnable but lacks a reason`)
      }
    }
  }

  for (const check of profileTree.contractChecks || []) {
    if (check.required === true && ['failed', 'blocked'].includes(check.status)) {
      errors.push(
        `visual contract check ${check.checkId} is ${check.status}: ${check.reason || check.description || 'no reason recorded'}`,
      )
    }
    if (check.status === 'passed' && !hasAny(check.evidenceRefs) && check.required === true) {
      errors.push(`visual contract check ${check.checkId} passed but lacks evidenceRefs`)
    }
  }
}

function validateVisualDesignContractArtifacts(data) {
  const visualReference = data.visualReference
  if (!visualReference) {
    return
  }

  const visualRequired = visualReference.visualWorkRequired === true
  const primarySource = visualReference.primarySource
  if (!visualRequired || primarySource === 'not_required') {
    return
  }

  if (primarySource === 'visual_quality_waived') {
    if (visualReference.waiver?.isWaived !== true || visualReference.waiver?.riskAcceptedByUser !== true) {
      errors.push(
        'visual-reference.json uses visual_quality_waived but lacks waiver.isWaived=true and riskAcceptedByUser=true',
      )
    }
    return
  }

  if (!data.designTokens) {
    errors.push('visual work requires .pbe/blueprint/design-tokens.json')
  }
  if (!data.componentStyleContract) {
    errors.push('visual work requires .pbe/blueprint/component-style-contract.json')
  }
  if (!data.uiSurfaceInventory) {
    errors.push('visual work requires .pbe/control/ui-surface-inventory.json')
  }
  if (!data.visualVerification) {
    errors.push('visual work requires .pbe/control/visual-verification-profile.json')
  }
  if (!existsSync(path.join(targetRoot, '.pbe/blueprint/ui-theme-spec.md'))) {
    errors.push('visual work requires .pbe/blueprint/ui-theme-spec.md')
  }

  const tokenGroups = ['colors', 'spacing', 'radius', 'typography', 'border', 'shadow', 'motion']
  for (const group of tokenGroups) {
    const values = data.designTokens?.tokens?.[group]
    if (!values || Object.keys(values).length === 0) {
      errors.push(`design-tokens.json lacks non-empty token group: ${group}`)
    }
  }

  const componentNames = new Set(
    (data.componentStyleContract?.components || []).map((component) => component.componentName),
  )
  for (const requiredComponent of ['Button', 'Panel']) {
    if (!componentNames.has(requiredComponent)) {
      errors.push(`component-style-contract.json lacks required base component contract: ${requiredComponent}`)
    }
  }
}

function validateVerificationMissLog(missLog, refs) {
  if (!missLog) {
    return
  }
  for (const miss of missLog.misses || []) {
    const promotionDecision = miss.promotionDecision || miss.promotion?.status
    const occurrenceCount = miss.occurrenceCount || 1
    const missType = miss.missType || miss.type
    validateKnownIds(miss.affectedNodeIds, refs.knownNodeIds, `verification miss ${miss.id}`, 'affected node')
    validateKnownIds(miss.promotedTestNodeIds, refs.testIds, `verification miss ${miss.id}`, 'promoted test node')
    validateKnownIds(
      miss.promotedEvidenceNodeIds,
      refs.evidenceIds,
      `verification miss ${miss.id}`,
      'promoted evidence node',
    )

    if (
      promotionDecision === 'promoted' &&
      !hasAny(miss.promotedTestNodeIds) &&
      !hasAny(miss.promotedEvidenceNodeIds) &&
      !hasAny(miss.promotedContractRefs)
    ) {
      errors.push(`verification miss ${miss.id} is promoted but lacks promoted validation references`)
    }
    if (occurrenceCount >= 2 && miss.status === 'resolved' && !['promoted', 'blocked'].includes(promotionDecision)) {
      errors.push(
        `verification miss ${miss.id} repeated ${occurrenceCount} times but was resolved without promotion or blocking`,
      )
    }
    if (
      missType === 'legacy_subdialog_control_miss' &&
      !['proposed', 'promoted', 'blocked'].includes(promotionDecision) &&
      miss.status !== 'reported_for_pbe_improvement'
    ) {
      errors.push(
        `verification miss ${miss.id} is a legacy subdialog control miss but lacks promotion or blocking decision`,
      )
    }
  }
}

function validateAcceptanceTree(acceptanceTree, refs) {
  if (!acceptanceTree) {
    return
  }
  for (const branch of acceptanceTree.branches || []) {
    validateKnownIds(
      [branch.productNodeId],
      refs.productIds,
      `acceptance branch ${branch.productNodeId}`,
      'product node',
    )
    validateKnownIds(
      branch.evidenceNodeIds,
      refs.evidenceIds,
      `acceptance branch ${branch.productNodeId}`,
      'evidence node',
    )
    if (branch.status === 'accepted_done') {
      if (!branch.userAcceptedAt) {
        errors.push(`acceptance branch ${branch.productNodeId} is accepted_done but lacks userAcceptedAt`)
      }
      if (branch.decisionSource?.actor !== 'user') {
        errors.push(`acceptance branch ${branch.productNodeId} is accepted_done but lacks user decisionSource`)
      }
      if (!hasAny(branch.evidenceNodeIds)) {
        errors.push(`acceptance branch ${branch.productNodeId} is accepted_done but lacks evidenceNodeIds`)
      }
      const product = refs.productMap.get(branch.productNodeId)
      if (product?.status === 'reopened') {
        errors.push(`acceptance branch ${branch.productNodeId} is accepted_done but product node is reopened`)
      }
      const blockingImpacts = (refs.impactsByAffected.get(branch.productNodeId) || []).filter(
        (impact) => impact.impactType !== 'none',
      )
      if (blockingImpacts.length > 0) {
        errors.push(`acceptance branch ${branch.productNodeId} is accepted_done but has unresolved impact entries`)
      }
      for (const evidenceId of branch.evidenceNodeIds || []) {
        const evidence = refs.evidenceMap.get(evidenceId)
        if (!evidence) {
          errors.push(`acceptance branch ${branch.productNodeId} references missing evidence node: ${evidenceId}`)
          continue
        }
        if (!['attached', 'replaced'].includes(evidence.status)) {
          errors.push(
            `acceptance branch ${branch.productNodeId} uses non-current evidence ${evidenceId} with status ${evidence.status}`,
          )
        }
      }
    }
    if (branch.status === 'submitted_for_review') {
      if (!hasAny(branch.evidenceNodeIds)) {
        errors.push(`acceptance branch ${branch.productNodeId} is submitted_for_review but lacks evidenceNodeIds`)
      }
      if (!branch.coverageSummary) {
        errors.push(`acceptance branch ${branch.productNodeId} is submitted_for_review but lacks coverageSummary`)
      }
    }
  }
}

function validateProductClosure(productTree, refs) {
  if (!productTree) {
    return
  }
  const acceptedBranches = new Map(
    (refs.acceptanceTree?.branches || [])
      .filter((branch) => branch.status === 'accepted_done')
      .map((branch) => [branch.productNodeId, branch]),
  )

  for (const node of productTree.nodes || []) {
    if (node.status === 'accepted_done') {
      const branch = acceptedBranches.get(node.id)
      if (!branch) {
        errors.push(`product ${node.id} is accepted_done but lacks accepted Acceptance Tree branch`)
      }
      const blockingImpacts = (refs.impactsByAffected.get(node.id) || []).filter(
        (impact) => impact.impactType !== 'none',
      )
      if (blockingImpacts.length > 0) {
        errors.push(`product ${node.id} is accepted_done but has unresolved impact entries`)
      }
    }

    if (node.status === 'reopened') {
      const branch = acceptedBranches.get(node.id)
      if (branch) {
        errors.push(`product ${node.id} is reopened but Acceptance Tree branch remains accepted_done`)
      }
    }

    for (const evidence of evidenceForNode(refs.evidenceMap, node.id)) {
      if (node.status === 'accepted_done' && !['attached', 'replaced'].includes(evidence.status)) {
        errors.push(`product ${node.id} is accepted_done but evidence ${evidence.id} is ${evidence.status}`)
      }
    }
  }
}

function validateKnownIds(ids, knownIds, label, relation) {
  if (!hasAny(ids) || knownIds.size === 0) {
    return
  }
  for (const id of ids) {
    if (id && !knownIds.has(id)) {
      errors.push(`${label} references missing ${relation}: ${id}`)
    }
  }
}

function validateWithSchema(value, key, label) {
  const schemaId = schemaEntries.find(([entryKey]) => entryKey === key)?.[1]?.schema?.$id
  if (!schemaId) {
    errors.push(`${label} cannot be validated because schema ${key} is missing $id`)
    return
  }
  const validate = ajv.getSchema(schemaId)
  if (!validate) {
    errors.push(`${label} cannot find compiled schema ${schemaId}`)
    return
  }
  collectSchemaErrors(validate, value, label)
}

function collectSchemaErrors(validate, value, label) {
  if (validate(value)) {
    return
  }
  for (const error of validate.errors || []) {
    const instancePath = error.instancePath || '/'
    errors.push(`${label} schema violation at ${instancePath}: ${error.message}`)
  }
}

function readJson(relativePath, label, baseRoot = pluginRoot) {
  const absolutePath = path.join(baseRoot, relativePath)
  if (!existsSync(absolutePath)) {
    errors.push(`Missing ${label}: ${relativePath}`)
    return null
  }
  try {
    return JSON.parse(readFileSync(absolutePath, 'utf8'))
  } catch (error) {
    errors.push(`Invalid JSON ${label}: ${error.message}`)
    return null
  }
}

function collectNodeIds(tree) {
  return new Set((tree?.nodes || []).map((node) => node.id).filter(Boolean))
}

function collectNodeMap(tree) {
  return new Map((tree?.nodes || []).filter((node) => node.id).map((node) => [node.id, node]))
}

function collectCycleIds(cycleTree) {
  return new Set((cycleTree?.cycles || []).map((cycle) => cycle.id).filter(Boolean))
}

function collectChangeIds(changeTree) {
  return new Set((changeTree?.changes || []).map((change) => change.id).filter(Boolean))
}

function collectEvidenceIds(evidenceTree) {
  return new Set((evidenceTree?.evidence || []).map((evidence) => evidence.id).filter(Boolean))
}

function collectAcceptanceCriteriaIds(productTree) {
  return new Set(
    (productTree?.nodes || [])
      .flatMap((node) => node.acceptanceCriteria || [])
      .map((criteria) => criteria.id)
      .filter(Boolean),
  )
}

function collectAcceptanceCriteriaMap(productTree) {
  return new Map(
    (productTree?.nodes || [])
      .flatMap((node) => node.acceptanceCriteria || [])
      .filter((criteria) => criteria.id)
      .map((criteria) => [criteria.id, criteria]),
  )
}

function collectAcceptanceCriteriaByProduct(productTree) {
  const criteriaByProduct = new Map()
  for (const node of productTree?.nodes || []) {
    const criteriaIds = (node.acceptanceCriteria || [])
      .filter(
        (criteria) =>
          criteria.status !== 'deferred' && criteria.status !== 'out_of_scope' && criteria.status !== 'invalidated',
      )
      .map((criteria) => criteria.id)
      .filter(Boolean)
    if (criteriaIds.length > 0) {
      criteriaByProduct.set(node.id, criteriaIds)
    }
  }
  return criteriaByProduct
}

function collectRequiredAcceptanceCriteriaByProduct(productTree) {
  const criteriaByProduct = new Map()
  for (const node of productTree?.nodes || []) {
    const criteriaIds = (node.acceptanceCriteria || [])
      .filter((criteria) => criteria.status === 'confirmed' && criteria.verification?.required === true)
      .map((criteria) => criteria.id)
      .filter(Boolean)
    if (criteriaIds.length > 0) {
      criteriaByProduct.set(node.id, criteriaIds)
    }
  }
  return criteriaByProduct
}

function collectAmbiguousProductIds(productTree) {
  const ids = new Set()
  for (const node of productTree?.nodes || []) {
    if (node.status === 'needs_clarification' || ['partial', 'ambiguous'].includes(node.ambiguity?.status)) {
      ids.add(node.id)
    }
  }
  return ids
}

function collectInventoryIds(inventoryTree) {
  return new Set((inventoryTree?.inventories || []).map((inventory) => inventory.id).filter(Boolean))
}

function collectInventoryMap(inventoryTree) {
  return new Map(
    (inventoryTree?.inventories || [])
      .filter((inventory) => inventory.id)
      .map((inventory) => [inventory.id, inventory]),
  )
}

function collectSurfaceIds(ledger) {
  return new Set((ledger?.surfaces || []).map((surface) => surface.id).filter(Boolean))
}

function collectUiSurfaceIds(inventory) {
  return new Set(
    [...(inventory?.surfaces || []), ...(inventory?.childSurfaces || [])]
      .map((surface) => surface.surfaceId)
      .filter(Boolean),
  )
}

function collectComponentStyleNames(inventory) {
  return new Set((inventory?.components || []).map((component) => component.componentName).filter(Boolean))
}

function collectFeatureIds(ledger) {
  return new Set((ledger?.features || []).map((feature) => feature.id).filter(Boolean))
}

function collectProfileIds(profileTree) {
  return new Set((profileTree?.profiles || []).map((profile) => profile.id).filter(Boolean))
}

function collectMissIds(missLog) {
  return new Set((missLog?.misses || []).map((miss) => miss.id).filter(Boolean))
}

function collectEvidenceMap(evidenceTree) {
  return new Map(
    (evidenceTree?.evidence || []).filter((evidence) => evidence.id).map((evidence) => [evidence.id, evidence]),
  )
}

function collectImpactsByAffected(impactTree) {
  const grouped = new Map()
  for (const impact of impactTree?.impacts || []) {
    if (!impact.affectedNodeId) {
      continue
    }
    if (!grouped.has(impact.affectedNodeId)) {
      grouped.set(impact.affectedNodeId, [])
    }
    grouped.get(impact.affectedNodeId).push(impact)
  }
  return grouped
}

function collectImpactsByChange(impactTree) {
  const grouped = new Map()
  for (const impact of impactTree?.impacts || []) {
    if (!impact.changeId) {
      continue
    }
    if (!grouped.has(impact.changeId)) {
      grouped.set(impact.changeId, [])
    }
    grouped.get(impact.changeId).push(impact)
  }
  return grouped
}

function requiresClosureEvidence(cycleTree, acceptanceTree) {
  const closureCycleStatuses = new Set(['submitted_for_review', 'accepted'])
  const closureBranchStatuses = new Set(['submitted_for_review', 'accepted_done'])
  return (
    (cycleTree?.cycles || []).some((cycle) => closureCycleStatuses.has(cycle.status)) ||
    (acceptanceTree?.branches || []).some((branch) => closureBranchStatuses.has(branch.status))
  )
}

function evidenceForNode(evidenceMap, nodeId) {
  return [...evidenceMap.values()].filter((evidence) => evidence.provesNodeIds?.includes(nodeId))
}

function collectAbstractTerms(node) {
  const terms = new Set([...(node.ambiguity?.terms || []), ...(node.ambiguity?.abstractTerms || [])])
  const text = `${node.title || ''} ${node.why || ''}`.toLowerCase()
  const abstractTerms = [
    'clean',
    'nice',
    'fast',
    'intuitive',
    'stable',
    'easy to use',
    'modern',
    'efficient',
    'flexible',
    'scalable',
    'problem-free',
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
  ]
  for (const term of abstractTerms) {
    if (text.includes(term.toLowerCase())) {
      terms.add(term)
    }
  }
  return [...terms]
}

function hasCriteriaDelta(criteriaDelta) {
  return hasAny(criteriaDelta?.added) || hasAny(criteriaDelta?.modified) || hasAny(criteriaDelta?.invalidated)
}

function hasAny(value) {
  return Array.isArray(value) && value.length > 0
}
