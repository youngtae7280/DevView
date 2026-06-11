import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import Ajv2020 from 'ajv/dist/2020.js'

const root = process.cwd()
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
    const absolutePath = path.join(root, target.target)
    if (!existsSync(absolutePath)) {
      data[key] = null
      continue
    }
    const value = readJson(target.target, target.target)
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
  const productMap = collectNodeMap(data.product)
  const workMap = collectNodeMap(data.work)
  const testMap = collectNodeMap(data.test)
  const evidenceMap = collectEvidenceMap(data.evidence)
  const impactsByAffected = collectImpactsByAffected(data.impact)
  const knownNodeIds = new Set([
    ...productIds,
    ...projectIds,
    ...workIds,
    ...testIds,
    ...cycleIds,
    ...changeIds,
    ...evidenceIds,
  ])

  validateTreeShape(data.product, 'product')
  validateTreeShape(data.project, 'project')
  validateTreeShape(data.work, 'work')
  validateTreeShape(data.test, 'test')
  validateCycleTree(data.cycle, { productIds, projectIds, workIds, testIds })
  validateDecisionQueue(data.decision, knownNodeIds)
  validateChangeTree(data.change, knownNodeIds)
  validateImpactTree(data.impact, { knownNodeIds, changeIds })
  validateEvidenceTree(data.evidence, knownNodeIds)
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
    validateKnownIds(node.derivedFromProductNodeIds, productIds, `work ${node.id}`, 'product source')
    validateKnownIds(node.derivedFromProjectNodeIds, projectIds, `work ${node.id}`, 'project source')
    validateKnownIds(node.dependencies, workIds, `work ${node.id}`, 'work dependency')
  }

  for (const node of data.test?.nodes || []) {
    const isRoot = node.id === data.test.rootNodeId
    if (!isRoot && !hasAny(node.verifiesProductNodeIds) && !hasAny(node.verifiesWorkNodeIds)) {
      errors.push(`test ${node.id} must verify Product or Work nodes`)
    }
    if (!isRoot && !hasAny(node.evidenceRequired)) {
      errors.push(`test ${node.id} must require evidence`)
    }
    validateKnownIds(node.verifiesProductNodeIds, productIds, `test ${node.id}`, 'product verification target')
    validateKnownIds(node.verifiesProjectNodeIds, projectIds, `test ${node.id}`, 'project verification target')
    validateKnownIds(node.verifiesWorkNodeIds, workIds, `test ${node.id}`, 'work verification target')
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
  const knownCycleScope = new Set([
    ...refs.productIds,
    ...refs.projectIds,
    ...refs.workIds,
    ...refs.testIds,
  ])
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
      const attachedEvidence = evidenceForNode(refs.evidenceMap, testId)
        .filter((evidence) => ['attached', 'replaced'].includes(evidence.status))
      if (attachedEvidence.length === 0) {
        errors.push(`cycle ${cycle.id} is ${cycle.status} but included test ${testId} lacks attached Evidence Tree evidence`)
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

function validateChangeTree(changeTree, knownNodeIds) {
  if (!changeTree) {
    return
  }
  for (const change of changeTree.changes || []) {
    validateKnownIds(change.affectedNodeIds, knownNodeIds, `change ${change.id}`, 'affected node')
  }
}

function validateImpactTree(impactTree, refs) {
  if (!impactTree) {
    return
  }
  for (const impact of impactTree.impacts || []) {
    validateKnownIds([impact.changeId], refs.changeIds, `impact ${impact.id}`, 'change')
    validateKnownIds([impact.affectedNodeId], refs.knownNodeIds, `impact ${impact.id}`, 'affected node')
  }
}

function validateEvidenceTree(evidenceTree, knownNodeIds) {
  if (!evidenceTree) {
    return
  }
  for (const evidence of evidenceTree.evidence || []) {
    validateKnownIds(evidence.provesNodeIds, knownNodeIds, `evidence ${evidence.id}`, 'proved node')
  }
}

function validateAcceptanceTree(acceptanceTree, refs) {
  if (!acceptanceTree) {
    return
  }
  for (const branch of acceptanceTree.branches || []) {
    validateKnownIds([branch.productNodeId], refs.productIds, `acceptance branch ${branch.productNodeId}`, 'product node')
    validateKnownIds(branch.evidenceNodeIds, refs.evidenceIds, `acceptance branch ${branch.productNodeId}`, 'evidence node')
    if (branch.status === 'accepted_done') {
      if (!branch.userAcceptedAt) {
        errors.push(`acceptance branch ${branch.productNodeId} is accepted_done but lacks userAcceptedAt`)
      }
      if (!hasAny(branch.evidenceNodeIds)) {
        errors.push(`acceptance branch ${branch.productNodeId} is accepted_done but lacks evidenceNodeIds`)
      }
      const product = refs.productMap.get(branch.productNodeId)
      if (product?.status === 'reopened') {
        errors.push(`acceptance branch ${branch.productNodeId} is accepted_done but product node is reopened`)
      }
      const blockingImpacts = (refs.impactsByAffected.get(branch.productNodeId) || [])
        .filter((impact) => impact.impactType !== 'none')
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
          errors.push(`acceptance branch ${branch.productNodeId} uses non-current evidence ${evidenceId} with status ${evidence.status}`)
        }
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
      const blockingImpacts = (refs.impactsByAffected.get(node.id) || [])
        .filter((impact) => impact.impactType !== 'none')
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

function readJson(relativePath, label) {
  const absolutePath = path.join(root, relativePath)
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

function collectEvidenceMap(evidenceTree) {
  return new Map((evidenceTree?.evidence || []).filter((evidence) => evidence.id).map((evidence) => [evidence.id, evidence]))
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

function evidenceForNode(evidenceMap, nodeId) {
  return [...evidenceMap.values()].filter((evidence) => evidence.provesNodeIds?.includes(nodeId))
}

function hasAny(value) {
  return Array.isArray(value) && value.length > 0
}
