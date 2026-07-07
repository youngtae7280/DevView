import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import Ajv2020 from 'ajv/dist/2020.js'

const repoRoot = path.resolve(process.env.DEVVIEW_LEGACY_REPO_ROOT || process.cwd())
const targetRoot = path.resolve(process.env.DEVVIEW_LEGACY_TARGET_ROOT || process.cwd())
const validationTargetKind = process.env.DEVVIEW_LEGACY_VALIDATION_TARGET_KIND || 'plugin-repository'
const projectValidationMode = validationTargetKind === 'initialized-project'
const root = repoRoot
const errors = []
const targetContext = {}
const schemaIdByTargetLabel = new Map([
  ['.devview/blueprint/devview-state.json', 'https://local/devview/devview-state.schema.json'],
  ['.devview/blueprint/requirement-tree.json', 'https://local/project-blueprint-engine/requirement-tree.schema.json'],
  ['.devview/blueprint/requirement-tree.json', 'https://local/project-blueprint-engine/requirement-tree.schema.json'],
  ['.devview/blueprint/ui-ux-preview.json', 'https://local/project-blueprint-engine/ui-ux-preview.schema.json'],
  ['.devview/blueprint/ui-ux-preview.json', 'https://local/project-blueprint-engine/ui-ux-preview.schema.json'],
  ['.devview/blueprint/work-design.json', 'https://local/project-blueprint-engine/work-design.schema.json'],
  ['.devview/blueprint/work-design.json', 'https://local/project-blueprint-engine/work-design.schema.json'],
  ['.devview/blueprint/work-graph.json', 'https://local/project-blueprint-engine/work-graph.schema.json'],
  ['.devview/blueprint/work-graph.json', 'https://local/project-blueprint-engine/work-graph.schema.json'],
  [
    '.devview/blueprint/verification-design.json',
    'https://local/project-blueprint-engine/verification-design.schema.json',
  ],
  [
    '.devview/blueprint/verification-design.json',
    'https://local/project-blueprint-engine/verification-design.schema.json',
  ],
  [
    '.devview/blueprint/dependency-impact-audit.json',
    'https://local/project-blueprint-engine/dependency-impact-audit.schema.json',
  ],
  [
    '.devview/blueprint/dependency-impact-audit.json',
    'https://local/project-blueprint-engine/dependency-impact-audit.schema.json',
  ],
  [
    '.devview/blueprint/execution-strategy.json',
    'https://local/project-blueprint-engine/execution-strategy.schema.json',
  ],
  [
    '.devview/blueprint/execution-strategy.json',
    'https://local/project-blueprint-engine/execution-strategy.schema.json',
  ],
  [
    '.devview/blueprint/traceability-matrix.json',
    'https://local/project-blueprint-engine/traceability-matrix.schema.json',
  ],
  [
    '.devview/blueprint/traceability-matrix.json',
    'https://local/project-blueprint-engine/traceability-matrix.schema.json',
  ],
  [
    '.devview/codex-execution-pack/execution-manifest.json',
    'https://local/project-blueprint-engine/execution-manifest.schema.json',
  ],
  [
    '.devview/codex-execution-pack/execution-manifest.json',
    'https://local/project-blueprint-engine/execution-manifest.schema.json',
  ],
  [
    '.devview/codex-execution-pack/04-traceability-matrix.json',
    'https://local/project-blueprint-engine/traceability-matrix.schema.json',
  ],
  [
    '.devview/codex-execution-pack/04-traceability-matrix.json',
    'https://local/project-blueprint-engine/traceability-matrix.schema.json',
  ],
  ['.devview/codex-execution-pack/05-ui-ux-spec.json', 'https://local/project-blueprint-engine/ui-ux-spec.schema.json'],
  ['.devview/codex-execution-pack/05-ui-ux-spec.json', 'https://local/project-blueprint-engine/ui-ux-spec.schema.json'],
  ['.devview/review/feedback-items.json', 'https://local/project-blueprint-engine/feedback-items.schema.json'],
  ['.devview/review/feedback-items.json', 'https://local/project-blueprint-engine/feedback-items.schema.json'],
  [
    '.devview/control/legacy-control-inventory.json',
    'https://local/project-blueprint-engine/legacy-control-inventory.schema.json',
  ],
  [
    '.devview/control/legacy-control-inventory.json',
    'https://local/project-blueprint-engine/legacy-control-inventory.schema.json',
  ],
  [
    '.devview/control/surface-completion-ledger.json',
    'https://local/project-blueprint-engine/surface-completion-ledger.schema.json',
  ],
  [
    '.devview/control/surface-completion-ledger.json',
    'https://local/project-blueprint-engine/surface-completion-ledger.schema.json',
  ],
  [
    '.devview/control/hardware-readiness-ledger.json',
    'https://local/project-blueprint-engine/hardware-readiness-ledger.schema.json',
  ],
  [
    '.devview/control/hardware-readiness-ledger.json',
    'https://local/project-blueprint-engine/hardware-readiness-ledger.schema.json',
  ],
  [
    '.devview/control/visual-verification-profile.json',
    'https://local/project-blueprint-engine/visual-verification-profile.schema.json',
  ],
  [
    '.devview/control/visual-verification-profile.json',
    'https://local/project-blueprint-engine/visual-verification-profile.schema.json',
  ],
  [
    '.devview/control/verification-miss-log.json',
    'https://local/project-blueprint-engine/verification-miss-log.schema.json',
  ],
  [
    '.devview/control/verification-miss-log.json',
    'https://local/project-blueprint-engine/verification-miss-log.schema.json',
  ],
])
const schemaFiles = new Map()
let ajv = null

const requiredPaths = [
  '.codex-plugin/plugin.json',
  'skills/devview-autoflow/SKILL.md',
  'skills/devview-start/SKILL.md',
  'skills/devview-product-intake/SKILL.md',
  'skills/devview-ui-ux-confirm/SKILL.md',
  'skills/devview-work-planning/SKILL.md',
  'skills/devview-verification-design/SKILL.md',
  'skills/devview-dependency-impact-audit/SKILL.md',
  'skills/devview-plan-execution/SKILL.md',
  'skills/devview-coverage-audit/SKILL.md',
  'skills/devview-ux-audit/SKILL.md',
  'skills/devview-generate-execution-pack/SKILL.md',
  'skills/devview-run-execution-pack/SKILL.md',
  'skills/devview-review-result/SKILL.md',
  'skills/devview-collect-feedback/SKILL.md',
  'skills/devview-create-revision-pack/SKILL.md',
  'skills/devview-run-revision/SKILL.md',
  'templates/devview-state.template.json',
  'templates/autoflow-state.template.json',
  'templates/devview-routing-contract-template.md',
  'templates/source-of-truth-matrix-template.md',
  'templates/devview-invariants-template.md',
  'templates/foundation-contract-template.md',
  'templates/parallel-safety-contract-template.md',
  'templates/parallel-conflict-report-template.md',
  'templates/devview-status-card-template.md',
  'templates/stage-completion-status-card-template.md',
  'templates/autoflow-status-message-template.md',
  'templates/implementation-scope-gate-message-template.md',
  'templates/architecture-runway-gate-message-template.md',
  'templates/next-slice-decision-gate-message-template.md',
  'templates/ui-ux-gate-message-template.md',
  'templates/review-result-gate-message-template.md',
  'templates/autoflow-failure-message-template.md',
  'templates/requirement-tree.template.json',
  'templates/ui-ux-preview.template.json',
  'templates/ui-ux-confirmation-template.md',
  'templates/ui-ux-confirmation-log-template.md',
  'templates/acceptance-criteria.template.md',
  'templates/ambiguity-report.template.md',
  'templates/work-design.template.json',
  'templates/work-graph.template.json',
  'templates/verification-design.template.json',
  'templates/dependency-impact-audit.template.json',
  'templates/dependency-impact-audit-template.md',
  'templates/execution-manifest.template.json',
  'templates/execution-strategy.template.json',
  'templates/execution-strategy-template.md',
  'templates/traceability-matrix.template.json',
  'templates/ui-ux-spec.template.json',
  'templates/task-card-template.md',
  'templates/integration-task-card-template.md',
  'templates/ui-ux-evidence-checklist-template.md',
  'templates/final-coverage-check-template.md',
  'templates/completion-criteria-template.md',
  'templates/final-report-template.md',
  'templates/codex-operating-loop-template.md',
  'templates/feedback-items.template.json',
  'templates/revision-manifest.template.json',
  'templates/revision-task-card-template.md',
  'templates/legacy-control-inventory.template.json',
  'templates/surface-completion-ledger.template.json',
  'templates/hardware-readiness-ledger.template.json',
  'templates/visual-verification-profile.template.json',
  'templates/verification-miss-log.template.json',
  'schemas/devview-state.schema.json',
  'schemas/autoflow-state.schema.json',
  'schemas/source-of-truth-matrix.schema.json',
  'schemas/devview-invariants.schema.json',
  'schemas/foundation-contract.schema.json',
  'schemas/parallel-safety-contract.schema.json',
  'schemas/requirement-tree.schema.json',
  'schemas/ui-ux-preview.schema.json',
  'schemas/ui-ux-confirmation.schema.json',
  'schemas/work-design.schema.json',
  'schemas/work-graph.schema.json',
  'schemas/verification-design.schema.json',
  'schemas/dependency-impact-audit.schema.json',
  'schemas/execution-manifest.schema.json',
  'schemas/execution-strategy.schema.json',
  'schemas/traceability-matrix.schema.json',
  'schemas/ui-ux-spec.schema.json',
  'schemas/final-coverage-check.schema.json',
  'schemas/feedback-items.schema.json',
  'schemas/revision-manifest.schema.json',
  'schemas/legacy-control-inventory.schema.json',
  'schemas/surface-completion-ledger.schema.json',
  'schemas/hardware-readiness-ledger.schema.json',
  'schemas/visual-verification-profile.schema.json',
  'schemas/verification-miss-log.schema.json',
  'docs/foundation-contract.md',
  'docs/parallel-safety-contract.md',
  'docs/parallel-conflict-recovery.md',
  'AGENTS.md',
]

if (!projectValidationMode) {
  for (const relativePath of requiredPaths) {
    if (!existsSync(path.join(root, relativePath))) {
      errors.push(`Missing required path: ${relativePath}`)
    }
  }
}

const repositoryJsonDirectories = projectValidationMode ? ['schemas'] : ['.codex-plugin', 'templates', 'schemas']

for (const relativePath of findJsonFiles(root, repositoryJsonDirectories)) {
  try {
    const json = JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'))
    if (relativePath.startsWith('schemas/')) {
      schemaFiles.set(relativePath, json)
    }
  } catch (error) {
    errors.push(`Invalid JSON: ${relativePath} (${error.message})`)
  }
}

validateJsonSchemas()
if (!projectValidationMode) {
  validateSkillFrontmatter()
  validateStatusCardTemplates()
}
validateOptionalDevViewTarget()
validateOptionalAcepTarget()
validateOptionalReviewTarget()
validateOptionalRevisionTargets()

if (errors.length > 0) {
  console.error('DevView validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('DevView legacy validation passed.')

function findJsonFiles(baseDir, directories) {
  const files = []
  for (const directory of directories) {
    const absoluteDirectory = path.join(baseDir, directory)
    if (!existsSync(absoluteDirectory)) {
      continue
    }
    walk(absoluteDirectory)
  }
  return files

  function walk(currentDirectory) {
    for (const entry of readdirSync(currentDirectory)) {
      const absolutePath = path.join(currentDirectory, entry)
      const relativePath = path.relative(baseDir, absolutePath).replaceAll(path.sep, '/')
      if (statSync(absolutePath).isDirectory()) {
        walk(absolutePath)
      } else if (relativePath.endsWith('.json')) {
        files.push(relativePath)
      }
    }
  }
}

function validateJsonSchemas() {
  ajv = new Ajv2020({ allErrors: true, strict: false })

  for (const [relativePath, schema] of schemaFiles) {
    try {
      ajv.addSchema(schema)
    } catch (error) {
      errors.push(`Invalid JSON schema: ${relativePath} (${error.message})`)
    }
  }

  for (const [relativePath, schema] of schemaFiles) {
    try {
      ajv.compile(schema)
    } catch (error) {
      errors.push(`Schema compile failed: ${relativePath} (${error.message})`)
    }
  }
}

function getSchemaEnum(relativePath, propertyPath) {
  let cursor = schemaFiles.get(relativePath)
  for (const segment of propertyPath) {
    cursor = cursor?.[segment]
  }
  return Array.isArray(cursor) ? cursor : []
}

function validateSkillFrontmatter() {
  const skillRoot = path.join(root, 'skills')
  if (!existsSync(skillRoot)) {
    return
  }

  for (const skillName of readdirSync(skillRoot)) {
    const skillPath = path.join(skillRoot, skillName, 'SKILL.md')
    if (!existsSync(skillPath)) {
      errors.push(`Missing SKILL.md for skill: ${skillName}`)
      continue
    }

    const contents = readFileSync(skillPath, 'utf8')
    const frontmatterMatch = contents.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
    if (!frontmatterMatch) {
      errors.push(`Skill lacks frontmatter: ${skillName}`)
      continue
    }

    const frontmatter = frontmatterMatch[1]
    if (!/^name:\s+\S+/m.test(frontmatter)) {
      errors.push(`Skill frontmatter lacks name: ${skillName}`)
    }
    if (!/^description:\s+.+/m.test(frontmatter)) {
      errors.push(`Skill frontmatter lacks description: ${skillName}`)
    }
  }
}

function validateStatusCardTemplates() {
  const statusTemplates = [
    'templates/devview-status-card-template.md',
    'templates/stage-completion-status-card-template.md',
    'templates/autoflow-status-message-template.md',
    'templates/implementation-scope-gate-message-template.md',
    'templates/architecture-runway-gate-message-template.md',
    'templates/next-slice-decision-gate-message-template.md',
    'templates/ui-ux-gate-message-template.md',
    'templates/review-result-gate-message-template.md',
    'templates/autoflow-failure-message-template.md',
  ]

  for (const relativePath of statusTemplates) {
    const absolutePath = path.join(root, relativePath)
    if (!existsSync(absolutePath)) {
      continue
    }
    const contents = readFileSync(absolutePath, 'utf8')
    if (!contents.includes('[DevView status report]')) {
      errors.push(`${relativePath} must include [DevView status report]`)
    }
    if (!contents.includes('[Codex memo]')) {
      errors.push(`${relativePath} must include [Codex memo]`)
    }
    if (!contents.includes('Recommended reply')) {
      errors.push(`${relativePath} must include Recommended reply`)
    }
  }
}

function validateOptionalDevViewTarget() {
  const storage = resolveTargetStorage()
  if (!storage) {
    return
  }

  const { root: storageRoot, prefix, canonicalStatePath } = storage
  const blueprintRoot = path.join(storageRoot, 'blueprint')
  const statePath = canonicalStatePath
  const treePath = path.join(blueprintRoot, 'requirement-tree.json')
  const previewPath = path.join(blueprintRoot, 'ui-ux-preview.json')
  const workDesignPath = path.join(blueprintRoot, 'work-design.json')
  const workGraphPath = path.join(blueprintRoot, 'work-graph.json')
  const verificationDesignPath = path.join(blueprintRoot, 'verification-design.json')
  const dependencyImpactAuditPath = path.join(blueprintRoot, 'dependency-impact-audit.json')
  const executionStrategyPath = path.join(blueprintRoot, 'execution-strategy.json')
  const blueprintTraceabilityPath = path.join(blueprintRoot, 'traceability-matrix.json')
  const feedbackPath = path.join(storageRoot, 'review', 'feedback-items.json')
  const controlRoot = path.join(storageRoot, 'control')
  const legacyInventoryPath = path.join(controlRoot, 'legacy-control-inventory.json')
  const surfaceCompletionPath = path.join(controlRoot, 'surface-completion-ledger.json')
  const hardwareReadinessPath = path.join(controlRoot, 'hardware-readiness-ledger.json')
  const visualVerificationPath = path.join(controlRoot, 'visual-verification-profile.json')
  const verificationMissPath = path.join(controlRoot, 'verification-miss-log.json')

  if (!existsSync(blueprintRoot)) {
    errors.push(`${prefix} exists but ${prefix}/blueprint is missing`)
    return
  }

  if (!existsSync(statePath)) {
    errors.push(`${prefix} exists but DevView state artifact is missing`)
  }

  if (existsSync(statePath)) {
    const stateLabel = labelForTargetPath(statePath)
    const state = parseTargetJson(statePath, stateLabel)
    if (state) {
      targetContext.state = state
      validateDevViewState(state)
    }
  }

  if (existsSync(treePath)) {
    const tree = parseTargetJson(treePath, `${prefix}/blueprint/requirement-tree.json`)
    if (tree) {
      targetContext.requirementTree = tree
      validateRequirementTree(tree)
    }
  }

  if (existsSync(previewPath)) {
    const preview = parseTargetJson(previewPath, `${prefix}/blueprint/ui-ux-preview.json`)
    if (preview) {
      targetContext.uiUxPreview = preview
      validateUiUxPreview(preview)
    }
  }

  if (existsSync(workDesignPath)) {
    const workDesign = parseTargetJson(workDesignPath, `${prefix}/blueprint/work-design.json`)
    if (workDesign) {
      targetContext.workDesign = workDesign
      validateWorkDesign(workDesign)
    }
  }

  if (existsSync(workGraphPath)) {
    const workGraph = parseTargetJson(workGraphPath, `${prefix}/blueprint/work-graph.json`)
    if (workGraph) {
      targetContext.workGraph = workGraph
      validateWorkGraph(workGraph, `${prefix}/blueprint/work-graph.json`)
    }
  }

  if (existsSync(verificationDesignPath)) {
    const verificationDesign = parseTargetJson(verificationDesignPath, `${prefix}/blueprint/verification-design.json`)
    if (verificationDesign) {
      targetContext.verificationDesign = verificationDesign
      validateVerificationDesign(verificationDesign)
    }
  }

  if (existsSync(dependencyImpactAuditPath)) {
    const dependencyImpactAudit = parseTargetJson(
      dependencyImpactAuditPath,
      `${prefix}/blueprint/dependency-impact-audit.json`,
    )
    if (dependencyImpactAudit) {
      targetContext.dependencyImpactAudit = dependencyImpactAudit
      validateDependencyImpactAudit(dependencyImpactAudit)
    }
  }

  if (existsSync(executionStrategyPath)) {
    const executionStrategy = parseTargetJson(executionStrategyPath, `${prefix}/blueprint/execution-strategy.json`)
    if (executionStrategy) {
      targetContext.executionStrategy = executionStrategy
      validateExecutionStrategy(executionStrategy, `${prefix}/blueprint/execution-strategy.json`)
    }
  }

  if (existsSync(blueprintTraceabilityPath)) {
    const traceability = parseTargetJson(blueprintTraceabilityPath, `${prefix}/blueprint/traceability-matrix.json`)
    if (traceability) {
      targetContext.blueprintTraceability = traceability
      validateTraceabilityMatrix(traceability, `${prefix}/blueprint/traceability-matrix.json`)
    }
  }

  if (existsSync(feedbackPath)) {
    const feedback = parseTargetJson(feedbackPath, `${prefix}/review/feedback-items.json`)
    if (feedback) {
      validateFeedbackItems(feedback)
    }
  }

  parseOptionalControlJson(legacyInventoryPath, `${prefix}/control/legacy-control-inventory.json`)
  parseOptionalControlJson(surfaceCompletionPath, `${prefix}/control/surface-completion-ledger.json`)
  parseOptionalControlJson(hardwareReadinessPath, `${prefix}/control/hardware-readiness-ledger.json`)
  parseOptionalControlJson(visualVerificationPath, `${prefix}/control/visual-verification-profile.json`)
  parseOptionalControlJson(verificationMissPath, `${prefix}/control/verification-miss-log.json`)

  validateDevViewRouting(targetContext)
  validateDevViewCrossArtifacts(targetContext)
}

function resolveTargetStorage() {
  const devviewRoot = path.join(targetRoot, '.devview')
  if (existsSync(devviewRoot)) {
    return {
      root: devviewRoot,
      prefix: '.devview',
      canonicalStatePath: path.join(devviewRoot, 'blueprint', 'devview-state.json'),
    }
  }
  return null
}

function labelForTargetPath(absolutePath) {
  return path.relative(targetRoot, absolutePath).replaceAll(path.sep, '/')
}

function parseOptionalControlJson(absolutePath, label) {
  if (!existsSync(absolutePath)) {
    return
  }
  parseTargetJson(absolutePath, label)
}

function validateOptionalAcepTarget() {
  const storage = resolveTargetStorage()
  if (!storage) {
    return
  }

  const acepRoot = path.join(storage.root, 'codex-execution-pack')
  if (!existsSync(acepRoot)) {
    return
  }
  const prefix = storage.prefix

  const requiredAcepFiles = [
    '00-readme.md',
    '01-autonomous-execution-policy.md',
    '02-project-blueprint.md',
    '03-requirement-tree.md',
    '04-traceability-matrix.md',
    '04-traceability-matrix.json',
    '05-ui-ux-spec.md',
    '05-ui-ux-spec.json',
    '06-ui-ux-preview.md',
    '07-ui-ux-confirmation.md',
    '08-work-roadmap.md',
    '09-verification-plan.md',
    '10-codex-operating-loop.md',
    '12-validation-commands.md',
    '13-completion-criteria.md',
    '14-failure-recovery.md',
    '15-ui-ux-evidence-checklist.md',
    '16-final-coverage-check.md',
    '17-final-report-template.md',
    '18-execution-strategy.md',
    '19-source-of-truth-matrix.md',
    '20-foundation-contract.md',
    '21-parallel-safety-contract.md',
    'execution-manifest.json',
  ]

  const requireCompleteAcepPackage = !projectValidationMode || stateRequiresAcep(targetContext.state)

  if (requireCompleteAcepPackage) {
    for (const relativePath of requiredAcepFiles) {
      if (!existsSync(path.join(acepRoot, relativePath))) {
        errors.push(`Execution pack is missing required file: ${prefix}/codex-execution-pack/${relativePath}`)
      }
    }
  }

  if (existsSync(path.join(acepRoot, 'execution-manifest.json'))) {
    const manifest = parseTargetJson(
      path.join(acepRoot, 'execution-manifest.json'),
      `${prefix}/codex-execution-pack/execution-manifest.json`,
    )
    if (manifest) {
      targetContext.executionManifest = manifest
      validateExecutionManifest(manifest, acepRoot)
    }
  }

  if (existsSync(path.join(acepRoot, '04-traceability-matrix.json'))) {
    const traceability = parseTargetJson(
      path.join(acepRoot, '04-traceability-matrix.json'),
      `${prefix}/codex-execution-pack/04-traceability-matrix.json`,
    )
    if (traceability) {
      targetContext.acepTraceability = traceability
      validateTraceabilityMatrix(traceability, `${prefix}/codex-execution-pack/04-traceability-matrix.json`)
    }
  }

  if (existsSync(path.join(acepRoot, '05-ui-ux-spec.json'))) {
    const uiUxSpec = parseTargetJson(
      path.join(acepRoot, '05-ui-ux-spec.json'),
      `${prefix}/codex-execution-pack/05-ui-ux-spec.json`,
    )
    if (uiUxSpec) {
      targetContext.uiUxSpec = uiUxSpec
      validateUiUxSpec(uiUxSpec)
    }
  }

  validateAcepCrossArtifacts(targetContext)
}

function stateRequiresAcep(state) {
  const value = state?.autoflow?.state
  return new Set([
    'EXECUTION_PACK_READY',
    'EXECUTION_IN_PROGRESS',
    'EXECUTION_PACK_RUN_DONE',
    'VISUAL_AUDIT_DONE',
    'WAITING_REVIEW_RESULT',
    'ACCEPTED',
    'DONE',
  ]).has(value)
}

function parseTargetJson(absolutePath, label) {
  try {
    const value = JSON.parse(readFileSync(absolutePath, 'utf8'))
    validateTargetAgainstSchema(value, label)
    return value
  } catch (error) {
    errors.push(`Invalid target JSON: ${label} (${error.message})`)
    return null
  }
}

function validateTargetAgainstSchema(value, label) {
  if (!ajv) {
    return
  }

  const schemaId = getSchemaIdForTargetLabel(label)
  if (!schemaId) {
    return
  }

  const validate = ajv.getSchema(schemaId)
  if (!validate) {
    errors.push(`No compiled schema found for ${label}: ${schemaId}`)
    return
  }

  if (!validate(value)) {
    for (const error of validate.errors || []) {
      const instancePath = error.instancePath || '/'
      errors.push(`${label} schema violation at ${instancePath}: ${error.message}`)
    }
  }
}

function getSchemaIdForTargetLabel(label) {
  if (label.startsWith('.devview/revisions/') && label.endsWith('/revision-manifest.json')) {
    return 'https://local/project-blueprint-engine/revision-manifest.schema.json'
  }
  return schemaIdByTargetLabel.get(label)
}

function validateRequirementTree(tree) {
  if (!tree.rootNodeId) {
    errors.push('requirement-tree.json lacks rootNodeId')
  }
  if (!Array.isArray(tree.nodes)) {
    errors.push('requirement-tree.json nodes must be an array')
    return
  }

  const allowedStatuses = new Set([
    'pending_interview',
    'interviewing',
    'ready_to_decompose',
    'ready_to_confirm',
    'decomposed',
    'confirmed',
    'deferred',
    'out_of_scope',
    'blocked',
  ])

  const ids = new Set()
  for (const node of tree.nodes) {
    if (!node.id) {
      errors.push('requirement-tree.json contains a node without id')
      continue
    }
    ids.add(node.id)
    if (!allowedStatuses.has(node.status)) {
      errors.push(`Node ${node.id} has invalid status: ${node.status}`)
    }
    if (!Array.isArray(node.children)) {
      errors.push(`Node ${node.id} children must be an array`)
    }
    validateUiImpactContract(node, `requirement-tree.json node ${node.id}`, {
      requireReference: false,
    })
  }

  if (tree.rootNodeId && !ids.has(tree.rootNodeId)) {
    errors.push(`rootNodeId does not reference an existing node: ${tree.rootNodeId}`)
  }
}

function validateUiUxPreview(preview) {
  if (!Array.isArray(preview.items)) {
    errors.push('ui-ux-preview.json items must be an array')
    return
  }
  const allowedLevels = new Set(['text_wireframe', 'markdown_mockup', 'prototype'])
  const allowedStatuses = new Set([
    'not_required',
    'preview_needed',
    'preview_generated',
    'revision_requested',
    'confirmed',
    'deferred',
    'out_of_scope',
    'blocked',
  ])
  for (const item of preview.items) {
    const id = item.id || '<missing id>'
    if (!allowedLevels.has(item.previewLevel)) {
      errors.push(`UI/UX preview ${id} has invalid previewLevel: ${item.previewLevel}`)
    }
    if (!allowedStatuses.has(item.status)) {
      errors.push(`UI/UX preview ${id} has invalid status: ${item.status}`)
    }
  }
}

function validateDevViewState(state) {
  if (state.deliveryStatus === 'accepted') {
    if (!state.acceptance) {
      errors.push('DevView state deliveryStatus accepted requires acceptance metadata')
    } else {
      if (state.acceptance.setBy !== 'user') {
        errors.push('DevView state accepted status must be setBy user')
      }
      if (state.acceptance.acceptanceSource !== 'explicit_user_reply') {
        errors.push('DevView state accepted status requires explicit_user_reply source')
      }
      if (!state.acceptance.acceptedAt) {
        errors.push('DevView state accepted status requires acceptedAt')
      }
    }
  }

  if (state.autoflow) {
    validateAutoflowState(state.autoflow, 'DevView state autoflow')
  }
}

function validateAutoflowState(autoflow, label) {
  const allowedStates = new Set(getSchemaEnum('schemas/autoflow-state.schema.json', ['properties', 'state', 'enum']))
  const allowedGates = new Set(
    getSchemaEnum('schemas/autoflow-state.schema.json', ['properties', 'currentGate', 'enum']).filter(Boolean),
  )
  const allowedProfiles = new Set(
    getSchemaEnum('schemas/autoflow-state.schema.json', ['properties', 'profile', 'enum']),
  )
  const allowedSteps = new Set([
    ...getSchemaEnum('schemas/autoflow-state.schema.json', ['properties', 'deterministicSteps', 'items', 'enum']),
    ...allowedGates,
    'start',
    'complete',
    'collect_feedback',
    'create_revision_pack',
    'run_revision',
  ])

  if (!allowedStates.has(autoflow.state)) {
    errors.push(`${label} has invalid state: ${autoflow.state}`)
  }
  if (!allowedProfiles.has(autoflow.profile)) {
    errors.push(`${label} has invalid or missing profile: ${autoflow.profile}`)
  }
  if (!Array.isArray(autoflow.completedSteps)) {
    errors.push(`${label} completedSteps must be an array`)
  } else {
    for (const step of autoflow.completedSteps) {
      if (!allowedSteps.has(step)) {
        errors.push(`${label} completedSteps contains unknown step: ${step}`)
      }
    }
  }
  if (autoflow.currentGate !== null && autoflow.currentGate !== undefined && !allowedGates.has(autoflow.currentGate)) {
    errors.push(`${label} has invalid currentGate: ${autoflow.currentGate}`)
  }
  if (autoflow.state === 'WAITING_UI_UX_CONFIRM' && autoflow.currentGate !== 'ui_ux_confirm') {
    errors.push(`${label} WAITING_UI_UX_CONFIRM must set currentGate to ui_ux_confirm`)
  }
  if (autoflow.state === 'WAITING_ROOT_CONFIRMATION' && autoflow.currentGate !== 'root_confirmation') {
    errors.push(`${label} WAITING_ROOT_CONFIRMATION must set currentGate to root_confirmation`)
  }
  if (autoflow.state === 'DRAFT_CREATED_FROM_ASSUMPTIONS' && autoflow.currentGate !== 'root_confirmation') {
    errors.push(`${label} DRAFT_CREATED_FROM_ASSUMPTIONS must set currentGate to root_confirmation`)
  }
  if (autoflow.state === 'WAITING_REVIEW_RESULT' && autoflow.currentGate !== 'review_result') {
    errors.push(`${label} WAITING_REVIEW_RESULT must set currentGate to review_result`)
  }
  if (autoflow.state === 'WAITING_IMPLEMENTATION_SCOPE' && autoflow.currentGate !== 'implementation_scope') {
    errors.push(`${label} WAITING_IMPLEMENTATION_SCOPE must set currentGate to implementation_scope`)
  }
  if (autoflow.lastFailure && typeof autoflow.lastFailure !== 'object') {
    errors.push(`${label} lastFailure must be an object when present`)
  }
  if (autoflow.nextStep !== null && autoflow.nextStep !== undefined && !allowedSteps.has(autoflow.nextStep)) {
    errors.push(`${label} nextStep is not a known DevView step or gate: ${autoflow.nextStep}`)
  }
}

function validateWorkDesign(workDesign) {
  if (!Array.isArray(workDesign.workUnits)) {
    errors.push('work-design.json workUnits must be an array')
  } else {
    for (const unit of workDesign.workUnits) {
      const unitId = unit.id || '<missing id>'
      if (!['selected', 'foundation', 'deferred', 'blocked', 'out_of_scope'].includes(unit.scopeClass)) {
        errors.push(`work-design.json work unit ${unitId} must include valid scopeClass`)
      }
      validateUiImpactContract(unit, `work-design.json work unit ${unitId}`, {
        requireReference: true,
      })
    }
  }

  if (!workDesign.moduleBoundaryCheck && !workDesign.workGraph) {
    errors.push('work-design.json should include moduleBoundaryCheck or workGraph before execution planning')
  }

  if (workDesign.moduleBoundaryCheck) {
    validateModuleBoundaryCheck(workDesign.moduleBoundaryCheck, 'work-design.json moduleBoundaryCheck')
  }

  if (workDesign.workGraph) {
    validateWorkGraph(workDesign.workGraph, 'work-design.json workGraph')
  }
}

function validateWorkGraph(workGraph, label) {
  if (!Array.isArray(workGraph.nodes)) {
    errors.push(`${label} nodes must be an array`)
    return
  }
  if (!Array.isArray(workGraph.edges)) {
    errors.push(`${label} edges must be an array`)
  }

  const nodeIds = new Set()
  for (const node of workGraph.nodes) {
    const nodeId = node.id || '<missing id>'
    if (!node.id) {
      errors.push(`${label} contains a node without id`)
      continue
    }
    nodeIds.add(node.id)
    if (!Array.isArray(node.relatedRequirementNodeIds) || node.relatedRequirementNodeIds.length === 0) {
      errors.push(`${label} node ${nodeId} must include relatedRequirementNodeIds`)
    }
    if (!['selected', 'foundation', 'deferred', 'blocked', 'out_of_scope'].includes(node.scopeClass)) {
      errors.push(`${label} node ${nodeId} must include valid scopeClass`)
    }
    if (!Array.isArray(node.expectedOutputs) || node.expectedOutputs.length === 0) {
      errors.push(`${label} node ${nodeId} must include expectedOutputs`)
    }
    if (!Array.isArray(node.expectedFiles)) {
      errors.push(`${label} node ${nodeId} must include expectedFiles`)
    }
    if (!Array.isArray(node.expectedSharedFiles)) {
      errors.push(`${label} node ${nodeId} must include expectedSharedFiles`)
    }
    if (!Array.isArray(node.forbiddenFiles)) {
      errors.push(`${label} node ${nodeId} must include forbiddenFiles`)
    }
    if (!['none', 'low', 'medium', 'high'].includes(node.unknownFileTouchRisk)) {
      errors.push(`${label} node ${nodeId} must include valid unknownFileTouchRisk`)
    }
    if (!Array.isArray(node.affectedDomains)) {
      errors.push(`${label} node ${nodeId} must include affectedDomains`)
    }
    if (typeof node.canRunInParallel !== 'boolean') {
      errors.push(`${label} node ${nodeId} must include canRunInParallel`)
    }
    if (node.canRunInParallel === false && !node.mustRunSequentiallyReason) {
      errors.push(`${label} node ${nodeId} must explain mustRunSequentiallyReason`)
    }
    if (node.canRunInParallel === true) {
      if (!Array.isArray(node.expectedFiles) || node.expectedFiles.length === 0) {
        errors.push(`${label} node ${nodeId} cannot run in parallel without expectedFiles`)
      }
      for (const file of [...(node.expectedFiles || []), ...(node.expectedSharedFiles || [])]) {
        if (isBroadOrUnknownPath(file)) {
          errors.push(`${label} node ${nodeId} cannot run in parallel with broad or unknown path: ${file}`)
        }
      }
      if (['medium', 'high'].includes(node.unknownFileTouchRisk)) {
        errors.push(
          `${label} node ${nodeId} cannot run in parallel with unknownFileTouchRisk ${node.unknownFileTouchRisk}`,
        )
      }
      if (node.type === 'foundation') {
        const docsOnly = node.affectedDomains?.every((domain) => ['documentation', 'test-fixture'].includes(domain))
        if (!docsOnly) {
          errors.push(`${label} foundation node ${nodeId} must be sequential unless documentation/test-fixture only`)
        }
      }
    }
    validateUiImpactContract(node, `${label} node ${nodeId}`, {
      requireReference: true,
    })
  }

  if (Array.isArray(workGraph.edges)) {
    for (const edge of workGraph.edges) {
      const from = edge.from || '<missing from>'
      const to = edge.to || '<missing to>'
      if (!nodeIds.has(edge.from)) {
        errors.push(`${label} edge from references missing node: ${from}`)
      }
      if (!nodeIds.has(edge.to)) {
        errors.push(`${label} edge to references missing node: ${to}`)
      }
    }
  }

  if (workGraph.moduleBoundaryCheck) {
    validateModuleBoundaryCheck(workGraph.moduleBoundaryCheck, `${label} moduleBoundaryCheck`)
  } else if (!Array.isArray(workGraph.boundaryFindings)) {
    errors.push(`${label} should include Module Boundary Check findings`)
  }
}

function validateModuleBoundaryCheck(check, label) {
  if (check.status && !['not_started', 'complete', 'blocked'].includes(check.status)) {
    errors.push(`${label} has invalid status: ${check.status}`)
  }
  if (check.status === 'not_started') {
    errors.push(`${label} must be complete or blocked before execution planning`)
  }
  if (check.status === 'blocked') {
    errors.push(`${label} has unresolved boundary blockers`)
  }
}

function validateVerificationDesign(verificationDesign) {
  if (!Array.isArray(verificationDesign.verificationItems)) {
    errors.push('verification-design.json verificationItems must be an array')
    return
  }

  for (const item of verificationDesign.verificationItems) {
    const itemId = item.id || '<missing id>'
    if (!hasAny(item.requirementIds) && !item.requirementNodeId) {
      errors.push(`verification-design.json item ${itemId} must link to a requirement`)
    }
    if (!hasAny(item.evidenceToCapture)) {
      errors.push(`verification-design.json item ${itemId} must include evidenceToCapture`)
    }
  }
}

function validateDependencyImpactAudit(audit) {
  if (audit.status === 'blocked' && !hasAny(audit.blockingIssues)) {
    errors.push('dependency-impact-audit.json blocked status requires blockingIssues')
  }

  for (const item of audit.futureItems || []) {
    const itemId = item.id || '<missing id>'
    const userDecision = [
      'approved_foundation',
      'approved_foundation_only',
      'included_in_current_slice',
      'rejected_by_user',
    ].includes(item.decision)
    if (userDecision && item.decisionBy !== 'user') {
      errors.push(`dependency-impact-audit.json item ${itemId} decision ${item.decision} must be decisionBy user`)
    }
    if (
      ['required_foundation', 'blocking_dependency', 'high_impact_future_module'].includes(item.classification) &&
      item.decision === 'deferred_with_no_current_impact'
    ) {
      errors.push(
        `dependency-impact-audit.json item ${itemId} cannot be ${item.classification} and deferred_with_no_current_impact`,
      )
    }
  }
}

function validateExecutionStrategy(strategy, label) {
  if (!strategy.executionStrategy) {
    errors.push(`${label} lacks executionStrategy`)
  }
  if (!Array.isArray(strategy.phases)) {
    errors.push(`${label} phases must be an array`)
    return
  }
  validatePhasesAndParallelGroups(strategy.phases, new Map(), label, { requireTaskDefinitions: false })
}

function validateExecutionManifest(manifest, acepRoot) {
  if (!Array.isArray(manifest.tasks)) {
    errors.push('EXECUTION_PACK_MANIFEST_FIELD_INVALID: execution-manifest.json tasks must be an array')
    return
  }

  const taskIds = new Set()
  const taskById = new Map()

  for (const task of manifest.tasks) {
    const taskId = task.id || '<missing id>'
    if (!task.id) {
      errors.push('execution-manifest.json contains a task without id')
    } else if (taskIds.has(task.id)) {
      errors.push(`execution-manifest.json contains duplicate task id: ${task.id}`)
    } else {
      taskIds.add(task.id)
      taskById.set(task.id, task)
    }
    if (!Array.isArray(task.requirementIds) || task.requirementIds.length === 0) {
      errors.push(`Task ${taskId} must include requirementIds`)
    }
    const hasVerificationIds = Array.isArray(task.verificationIds) && task.verificationIds.length > 0
    const hasVerificationExplanation =
      typeof task.verificationExplanation === 'string' && task.verificationExplanation.trim()
    if (!hasVerificationIds && !hasVerificationExplanation) {
      errors.push(`Task ${taskId} must include verificationIds or verificationExplanation`)
    }
    if (!Array.isArray(task.evidenceRequired) || task.evidenceRequired.length === 0) {
      errors.push(`Task ${taskId} must include evidenceRequired`)
    }
    if (
      task.scopeClass &&
      !['selected', 'foundation', 'deferred', 'blocked', 'out_of_scope'].includes(task.scopeClass)
    ) {
      errors.push(`Task ${taskId} has invalid scopeClass: ${task.scopeClass}`)
    }
    if (task.executionMode !== 'review_only' && !hasAny(task.workGraphNodeIds)) {
      errors.push(`Task ${taskId} must include workGraphNodeIds or be review_only`)
    }
    if (!Array.isArray(task.expectedFiles)) {
      errors.push(`Task ${taskId} must include expectedFiles`)
    }
    if (!Array.isArray(task.expectedSharedFiles)) {
      errors.push(`Task ${taskId} must include expectedSharedFiles`)
    }
    if (!Array.isArray(task.forbiddenFiles)) {
      errors.push(`Task ${taskId} must include forbiddenFiles`)
    }
    validateUiImpactContract(task, `Task ${taskId}`, {
      requireReference: task.executionMode !== 'review_only',
    })

    if (task.executionMode === 'parallel_group' && !task.parallelGroup) {
      errors.push(`Task ${taskId} is parallel_group but lacks parallelGroup`)
    }

    if (task.executionMode === 'integration' && !task.integrationTask) {
      errors.push(`Task ${taskId} is integration but lacks integrationTask`)
    }

    const taskPath = task.taskCard || task.file
    if (!taskPath) {
      errors.push(`Task ${taskId} must include taskCard or file`)
      continue
    }
    const resolvedTaskPath = resolveAcepReference(acepRoot, taskPath)
    if (!existsSync(resolvedTaskPath)) {
      errors.push(`Task ${taskId} points to a missing task card: ${taskPath}`)
    } else {
      const taskCard = readFileSync(resolvedTaskPath, 'utf8')
      if (!taskCard.includes('## Execution Strategy')) {
        errors.push(`Task ${taskId} card lacks ## Execution Strategy section`)
      }
    }
  }

  if (!Array.isArray(manifest.phases)) {
    errors.push('EXECUTION_PACK_MANIFEST_FIELD_INVALID: execution-manifest.json phases must be an array')
  } else {
    validatePhasesAndParallelGroups(manifest.phases, taskById, 'execution-manifest.json', {
      requireTaskDefinitions: true,
      parallelPolicy: manifest.parallelPolicy,
    })
  }
}

function validatePhasesAndParallelGroups(phases, taskById, label, options) {
  const taskIds = new Set(taskById.keys())

  for (const phase of phases) {
    const phaseId = phase.id || '<missing phase id>'
    if (!phase.id) {
      errors.push(`${label} contains a phase without id`)
    }
    if (!phase.mode) {
      errors.push(`${label} phase ${phaseId} lacks mode`)
    }

    if (phase.mode === 'sequential' && Array.isArray(phase.parallelGroups) && phase.parallelGroups.length > 0) {
      errors.push(`${label} sequential phase ${phaseId} must not include parallelGroups`)
    }

    if (phase.mode === 'parallel') {
      if (!Array.isArray(phase.parallelGroups) || phase.parallelGroups.length === 0) {
        errors.push(`${label} parallel phase ${phaseId} must include parallelGroups`)
        continue
      }
      validateParallelGroups(phase.parallelGroups, taskById, taskIds, label, options)
    }
  }
}

function validateParallelGroups(parallelGroups, taskById, taskIds, label, options) {
  const maxInitialGroupSize = options.parallelPolicy?.maxInitialParallelGroupSize || 2
  for (const group of parallelGroups) {
    const groupId = group.id || '<missing group id>'
    if (!group.id) {
      errors.push(`${label} contains a parallel group without id`)
    }
    if (!Array.isArray(group.tasks) || group.tasks.length === 0) {
      errors.push(`${label} parallel group ${groupId} must include tasks`)
      continue
    }

    const uniqueGroupTasks = new Set(group.tasks)
    if (uniqueGroupTasks.size !== group.tasks.length) {
      errors.push(`${label} parallel group ${groupId} contains duplicate task ids`)
    }

    if (!group.integrationTask) {
      errors.push(`${label} parallel group ${groupId} lacks integrationTask`)
    }
    if (group.integrationEvidenceRequired !== true) {
      errors.push(`${label} parallel group ${groupId} must require integration evidence`)
    }
    if (group.groupCannotCompleteWithoutIntegrationPass !== true) {
      errors.push(`${label} parallel group ${groupId} must require integration pass before completion`)
    }
    if (group.tasks.length > maxInitialGroupSize && !group.humanApprovalReference) {
      errors.push(
        `${label} parallel group ${groupId} exceeds max initial size ${maxInitialGroupSize} without human approval`,
      )
    }

    if (options.requireTaskDefinitions) {
      for (const taskId of group.tasks) {
        if (!taskIds.has(taskId)) {
          errors.push(`${label} parallel group ${groupId} references missing task: ${taskId}`)
        }
      }
      if (group.integrationTask && !taskIds.has(group.integrationTask)) {
        errors.push(
          `${label} parallel group ${groupId} integrationTask is missing from manifest tasks: ${group.integrationTask}`,
        )
      }

      const integrationTask = taskById.get(group.integrationTask)
      if (integrationTask && integrationTask.executionMode !== 'integration') {
        errors.push(
          `${label} parallel group ${groupId} integrationTask ${group.integrationTask} must use executionMode integration`,
        )
      }
    }

    const expectedFiles = new Map()
    const sharedFileOwners = new Map()
    for (const taskId of group.tasks) {
      const task = taskById.get(taskId)
      if (!task) {
        continue
      }

      if (task.executionMode && task.executionMode !== 'parallel_group') {
        errors.push(`${label} task ${taskId} is in ${groupId} but executionMode is ${task.executionMode}`)
      }
      if (task.dependencyResolved !== true) {
        errors.push(`${label} task ${taskId} cannot run in a parallel group without dependencyResolved true`)
      }
      if (task.writeSetKnown !== true) {
        errors.push(`${label} task ${taskId} cannot run in a parallel group without writeSetKnown true`)
      }
      if (!hasAny(task.expectedFiles)) {
        errors.push(`${label} task ${taskId} cannot run in a parallel group without expectedFiles`)
      }
      for (const file of [...(task.expectedFiles || []), ...(task.expectedSharedFiles || [])]) {
        if (isBroadOrUnknownPath(file)) {
          errors.push(`${label} task ${taskId} cannot run in a parallel group with broad or unknown path: ${file}`)
        }
      }
      if (!hasAny(task.workGraphNodeIds)) {
        errors.push(`${label} task ${taskId} cannot run in a parallel group without workGraphNodeIds`)
      }
      if (!['selected'].includes(task.scopeClass)) {
        errors.push(`${label} task ${taskId} must be selected scope to run in a parallel group`)
      }
      if (task.rollbackPathAvailable !== true) {
        errors.push(`${label} task ${taskId} cannot run in a parallel group without rollbackPathAvailable true`)
      }

      if (task.conflictRisk === 'high') {
        errors.push(`${label} task ${taskId} has high conflictRisk and must not be in a parallel group`)
      }

      const forbiddenChangeText = (task.forbiddenChanges || []).join(' ').toLowerCase()
      const declaresRequiredForbiddenChange =
        forbiddenChangeText.includes('requires forbidden') ||
        forbiddenChangeText.includes('must change shared') ||
        forbiddenChangeText.includes('requires shared')
      if (declaresRequiredForbiddenChange) {
        errors.push(`${label} task ${taskId} declares forbidden shared changes inside a parallel group`)
      }

      for (const file of task.expectedFiles || []) {
        const normalizedFile = normalizePathForMatch(file)
        if (expectedFiles.has(normalizedFile)) {
          errors.push(
            `${label} parallel group ${groupId} has same expectedFiles conflict: ${file} in ${expectedFiles.get(
              normalizedFile,
            )} and ${taskId}`,
          )
        } else {
          expectedFiles.set(normalizedFile, taskId)
        }
        if (sharedFileOwners.has(normalizedFile) && sharedFileOwners.get(normalizedFile) !== taskId) {
          errors.push(
            `${label} parallel group ${groupId} has expectedFiles/sharedFiles conflict: ${file} in ${taskId} and ${sharedFileOwners.get(
              normalizedFile,
            )}`,
          )
        }
      }

      for (const file of task.expectedSharedFiles || []) {
        const normalizedFile = normalizePathForMatch(file)
        if (sharedFileOwners.has(normalizedFile)) {
          errors.push(
            `${label} parallel group ${groupId} has same shared-file conflict: ${file} in ${sharedFileOwners.get(
              normalizedFile,
            )} and ${taskId}`,
          )
        } else {
          sharedFileOwners.set(normalizedFile, taskId)
        }
        if (expectedFiles.has(normalizedFile) && expectedFiles.get(normalizedFile) !== taskId) {
          errors.push(
            `${label} parallel group ${groupId} has sharedFiles/expectedFiles conflict: ${file} in ${taskId} and ${expectedFiles.get(
              normalizedFile,
            )}`,
          )
        }
      }
    }
  }
}

function validateOptionalReviewTarget() {
  const storage = resolveTargetStorage()
  if (!storage) {
    return
  }

  const reviewRoot = path.join(storage.root, 'review')
  if (!existsSync(reviewRoot)) {
    return
  }
  const feedbackPath = path.join(reviewRoot, 'feedback-items.json')
  if (existsSync(feedbackPath)) {
    const feedback = parseTargetJson(feedbackPath, `${storage.prefix}/review/feedback-items.json`)
    if (feedback) {
      validateFeedbackItems(feedback)
    }
  }
}

function validateDevViewRouting(context) {
  const autoflow = context.state?.autoflow
  if (!autoflow) {
    return
  }

  if (context.state.artifacts && !context.state.artifacts.devviewRoutingContract) {
    errors.push('DevView state artifacts must include devviewRoutingContract when routing is active')
  }

  if (autoflow.currentGate && autoflow.nextStep !== autoflow.currentGate) {
    errors.push(
      `DevView routing mismatch: currentGate ${autoflow.currentGate} must be the nextStep while waiting at a gate`,
    )
  }

  const deterministicPastDependency = [
    'plan_execution',
    'coverage_audit',
    'ux_audit',
    'generate_execution_pack',
    'run_execution_pack',
  ]
  const needsDependencyAudit =
    autoflow.completedSteps?.includes('dependency_impact_audit') ||
    deterministicPastDependency.includes(autoflow.nextStep)

  if (needsDependencyAudit && !context.dependencyImpactAudit) {
    errors.push('DevView routing requires dependency-impact-audit.json before downstream execution')
  }

  if (
    context.dependencyImpactAudit?.futureItems?.some((item) => item.decision === 'pending_user_decision') &&
    autoflow.state !== 'WAITING_IMPLEMENTATION_SCOPE' &&
    autoflow.currentGate !== 'implementation_scope' &&
    !autoflow.lastFailure
  ) {
    errors.push('DevView routing cannot continue while dependency impact decisions are pending')
  }
}

function validateDevViewCrossArtifacts(context) {
  const requirementIds = collectRequirementIds(context.requirementTree)
  const workGraphNodeIds = collectWorkGraphNodeIds(context.workGraph)
  const workUnitIds = collectWorkUnitIds(context.workDesign)
  const verificationIds = collectVerificationIds(context.verificationDesign)

  if (context.workGraph) {
    for (const node of context.workGraph.nodes || []) {
      for (const requirementId of node.relatedRequirementNodeIds || []) {
        if (requirementIds.size > 0 && !requirementIds.has(requirementId)) {
          errors.push(`work-graph.json node ${node.id} references missing requirement ${requirementId}`)
        }
      }
    }
  }

  if (context.workDesign) {
    for (const unit of context.workDesign.workUnits || []) {
      for (const requirementId of unit.requirementIds || []) {
        if (requirementIds.size > 0 && !requirementIds.has(requirementId)) {
          errors.push(`work-design.json unit ${unit.id} references missing requirement ${requirementId}`)
        }
      }
      if (unit.workGraphNodeId && workGraphNodeIds.size > 0 && !workGraphNodeIds.has(unit.workGraphNodeId)) {
        errors.push(`work-design.json unit ${unit.id} references missing WorkGraph node ${unit.workGraphNodeId}`)
      }
    }
  }

  if (context.verificationDesign) {
    for (const item of context.verificationDesign.verificationItems || []) {
      for (const requirementId of item.requirementIds || []) {
        if (requirementIds.size > 0 && !requirementIds.has(requirementId)) {
          errors.push(`verification-design.json item ${item.id} references missing requirement ${requirementId}`)
        }
      }
      if (item.workDesignId && workUnitIds.size > 0 && !workUnitIds.has(item.workDesignId)) {
        errors.push(`verification-design.json item ${item.id} references missing work unit ${item.workDesignId}`)
      }
    }
  }

  if (context.dependencyImpactAudit) {
    for (const item of context.dependencyImpactAudit.futureItems || []) {
      for (const requirementId of item.relatedRequirementIds || []) {
        if (requirementIds.size > 0 && !requirementIds.has(requirementId)) {
          errors.push(`dependency-impact-audit.json item ${item.id} references missing requirement ${requirementId}`)
        }
      }
      for (const nodeId of item.relatedWorkGraphNodeIds || []) {
        if (workGraphNodeIds.size > 0 && !workGraphNodeIds.has(nodeId)) {
          errors.push(`dependency-impact-audit.json item ${item.id} references missing WorkGraph node ${nodeId}`)
        }
      }
    }
  }

  if (context.blueprintTraceability) {
    validateTraceabilityReferences(context.blueprintTraceability, '.devview/blueprint/traceability-matrix.json', {
      requirementIds,
      verificationIds,
    })
  }
}

function validateAcepCrossArtifacts(context) {
  const manifest = context.executionManifest
  const traceability = context.acepTraceability || context.blueprintTraceability
  if (!manifest || !traceability) {
    return
  }

  const requirementIds = collectRequirementIds(context.requirementTree)
  const workGraphNodeIds = collectWorkGraphNodeIds(context.workGraph)
  const verificationIds = collectVerificationIds(context.verificationDesign)
  const taskIds = new Set((manifest.tasks || []).map((task) => task.id).filter(Boolean))
  const tracedRequirementIds = new Set((traceability.items || []).map((item) => item.requirementNodeId).filter(Boolean))

  for (const task of manifest.tasks || []) {
    for (const requirementId of task.requirementIds || []) {
      if (requirementIds.size > 0 && !requirementIds.has(requirementId)) {
        errors.push(`execution-manifest.json task ${task.id} references missing requirement ${requirementId}`)
      }
    }
    for (const verificationId of task.verificationIds || []) {
      if (verificationIds.size > 0 && !verificationIds.has(verificationId)) {
        errors.push(`execution-manifest.json task ${task.id} references missing verification ${verificationId}`)
      }
    }
    for (const nodeId of task.workGraphNodeIds || []) {
      if (workGraphNodeIds.size > 0 && !workGraphNodeIds.has(nodeId)) {
        errors.push(`execution-manifest.json task ${task.id} references missing WorkGraph node ${nodeId}`)
      }
    }
    if (['deferred', 'out_of_scope'].includes(task.scopeClass) && task.executionMode !== 'review_only') {
      errors.push(`execution-manifest.json task ${task.id} must not implement ${task.scopeClass} scope`)
    }
  }

  for (const item of traceability.items || []) {
    for (const taskId of item.linkedTaskIds || []) {
      if (!taskIds.has(taskId)) {
        errors.push(`traceability item ${item.requirementNodeId} references missing task ${taskId}`)
      }
    }
    for (const verificationId of item.linkedVerificationIds || []) {
      if (verificationIds.size > 0 && !verificationIds.has(verificationId)) {
        errors.push(`traceability item ${item.requirementNodeId} references missing verification ${verificationId}`)
      }
    }
  }

  validateTraceabilityReferences(traceability, 'traceability matrix', {
    requirementIds,
    taskIds,
    verificationIds,
  })

  for (const requirementId of collectSelectedAndFoundationRequirementIds(context.workGraph)) {
    if (!tracedRequirementIds.has(requirementId)) {
      errors.push(`selected/foundation requirement ${requirementId} is missing from traceability matrix`)
    }
  }
}

function validateOptionalRevisionTargets() {
  const revisionsRoot = path.join(targetRoot, '.devview', 'revisions')
  if (!existsSync(revisionsRoot)) {
    return
  }
  for (const entry of readdirSync(revisionsRoot)) {
    const revisionRoot = path.join(revisionsRoot, entry)
    if (!statSync(revisionRoot).isDirectory()) {
      continue
    }
    const manifestPath = path.join(revisionRoot, 'revision-manifest.json')
    if (!existsSync(manifestPath)) {
      errors.push(`Revision ${entry} is missing revision-manifest.json`)
      continue
    }
    const manifest = parseTargetJson(manifestPath, `.devview/revisions/${entry}/revision-manifest.json`)
    if (manifest) {
      validateRevisionManifest(manifest, revisionRoot, entry)
    }
  }
}

function validateFeedbackItems(feedback) {
  if (!Array.isArray(feedback.items)) {
    errors.push('feedback-items.json items must be an array')
    return
  }
  for (const item of feedback.items) {
    const id = item.id || '<missing id>'
    const hasMapping =
      hasAny(item.affectedRequirementIds) ||
      hasAny(item.affectedTaskIds) ||
      hasAny(item.affectedUiUxIds) ||
      hasAny(item.affectedVerificationIds)
    const hasExplanation = typeof item.mappingExplanation === 'string' && item.mappingExplanation.trim().length > 0
    if (!hasMapping && !hasExplanation) {
      errors.push(`Feedback item ${id} must include affected item mapping or mappingExplanation`)
    }
  }
}

function validateRevisionManifest(manifest, revisionRoot, revisionId) {
  if (!hasAny(manifest.allowedFiles)) {
    errors.push(`Revision ${revisionId} must include allowedFiles`)
  }
  if (!Array.isArray(manifest.forbiddenFiles)) {
    errors.push(`Revision ${revisionId} must include forbiddenFiles`)
  }
  if (!manifest.maxChangeIntent) {
    errors.push(`Revision ${revisionId} must include maxChangeIntent`)
  }

  if (!Array.isArray(manifest.tasks)) {
    errors.push(`Revision ${revisionId} tasks must be an array`)
    return
  }
  for (const task of manifest.tasks) {
    const taskId = task.id || '<missing id>'
    if (!hasAny(task.feedbackItemIds)) {
      errors.push(`Revision task ${taskId} must include feedbackItemIds`)
    }
    const hasAffectedScope =
      hasAny(task.affectedRequirementIds) ||
      hasAny(task.affectedTaskIds) ||
      hasAny(task.affectedUiUxIds) ||
      hasAny(task.affectedVerificationIds)
    if (!hasAffectedScope) {
      errors.push(`Revision task ${taskId} must include affected scope`)
    }
    if (!hasAny(task.evidenceRequired)) {
      errors.push(`Revision task ${taskId} must include evidenceRequired`)
    }
    if (!hasAny(task.allowedFiles)) {
      errors.push(`Revision task ${taskId} must include allowedFiles`)
    }
    if (!Array.isArray(task.forbiddenFiles)) {
      errors.push(`Revision task ${taskId} must include forbiddenFiles`)
    }
    if (task.file && !existsSync(path.join(revisionRoot, task.file))) {
      errors.push(`Revision task ${taskId} points to a missing file: ${task.file}`)
    }
  }

  validateRevisionDiffBoundary(manifest, revisionId)
}

function validateRevisionDiffBoundary(manifest, revisionId) {
  const changedFiles = getGitChangedFiles()
  if (changedFiles.length === 0 || !hasAny(manifest.allowedFiles)) {
    return
  }

  const allowedFiles = manifest.allowedFiles || []
  const forbiddenFiles = [...(manifest.forbiddenFiles || []), ...(manifest.mustNotTouch || [])]

  for (const file of changedFiles) {
    if (file.startsWith('.devview/')) {
      continue
    }
    if (matchesAnyPath(file, forbiddenFiles)) {
      errors.push(`Revision ${revisionId} changed forbidden file: ${file}`)
    }
    if (!matchesAnyPath(file, allowedFiles)) {
      errors.push(`Revision ${revisionId} changed file outside allowedFiles: ${file}`)
    }
  }
}

function getGitChangedFiles() {
  try {
    const outputs = [
      execFileSync('git', ['diff', '--name-only'], {
        cwd: targetRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
      execFileSync('git', ['diff', '--name-only', '--cached'], {
        cwd: targetRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
      execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
        cwd: targetRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    ]
    return [...new Set(outputs.flatMap((output) => output.split(/\r?\n/)))]
      .map((line) => normalizePathForMatch(line.trim()))
      .filter(Boolean)
  } catch {
    return []
  }
}

function matchesAnyPath(file, patterns) {
  return patterns.some((pattern) => pathPatternMatches(file, pattern))
}

function pathPatternMatches(file, pattern) {
  const normalizedPattern = normalizePathForMatch(pattern)
  if (!normalizedPattern) {
    return false
  }
  if (normalizedPattern.endsWith('/**')) {
    return file.startsWith(normalizedPattern.slice(0, -3))
  }
  if (normalizedPattern.endsWith('/*')) {
    const prefix = normalizedPattern.slice(0, -1)
    return file.startsWith(prefix) && !file.slice(prefix.length).includes('/')
  }
  return file === normalizedPattern
}

function normalizePathForMatch(value) {
  return String(value || '')
    .replaceAll('\\', '/')
    .replace(/^\.\//, '')
}

function isBroadOrUnknownPath(file) {
  const normalized = normalizePathForMatch(file).toLowerCase()
  return (
    !normalized ||
    normalized.includes('*') ||
    normalized.includes('...') ||
    normalized.includes('tbd') ||
    normalized.includes('unknown') ||
    normalized.includes('multiple files') ||
    normalized.endsWith('/') ||
    normalized === 'src' ||
    normalized === 'src/'
  )
}

function validateUiImpactContract(item, label, options) {
  if (!item.uiImpact) {
    return
  }
  if (!['none', 'indirect', 'direct'].includes(item.uiImpact)) {
    errors.push(`${label} has invalid uiImpact: ${item.uiImpact}`)
    return
  }
  if (item.uiImpact === 'direct' && item.uiUxConfirmationRequired !== true) {
    errors.push(`${label} has direct UI impact and must set uiUxConfirmationRequired true`)
  }
  if (item.uiUxConfirmationRequired === true && !item.uiUxReason) {
    errors.push(`${label} requires UI/UX confirmation but lacks uiUxReason`)
  }
  const hasReference = Boolean(item.uiUxConfirmationId) || hasAny(item.uiUxIds) || hasAny(item.uiUxCandidateIds)
  if (item.uiImpact === 'direct' && options.requireReference && !hasReference) {
    errors.push(`${label} has direct UI impact and must link a UI/UX confirmation item`)
  }
}

function validateTraceabilityReferences(traceability, label, references) {
  for (const item of traceability.items || []) {
    const requirementId = item.requirementNodeId || '<missing requirementNodeId>'
    if (
      item.requirementNodeId &&
      references.requirementIds?.size > 0 &&
      !references.requirementIds.has(item.requirementNodeId)
    ) {
      errors.push(`${label} item ${requirementId} references missing requirement`)
    }

    for (const taskId of item.linkedTaskIds || []) {
      if (references.taskIds?.size > 0 && !references.taskIds.has(taskId)) {
        errors.push(`${label} item ${requirementId} references missing task ${taskId}`)
      }
    }

    for (const verificationId of item.linkedVerificationIds || []) {
      if (references.verificationIds?.size > 0 && !references.verificationIds.has(verificationId)) {
        errors.push(`${label} item ${requirementId} references missing verification ${verificationId}`)
      }
    }
  }
}

function collectRequirementIds(tree) {
  return new Set((tree?.nodes || []).map((node) => node.id).filter(Boolean))
}

function collectWorkGraphNodeIds(workGraph) {
  return new Set((workGraph?.nodes || []).map((node) => node.id).filter(Boolean))
}

function collectWorkUnitIds(workDesign) {
  return new Set((workDesign?.workUnits || []).map((unit) => unit.id).filter(Boolean))
}

function collectVerificationIds(verificationDesign) {
  return new Set((verificationDesign?.verificationItems || []).map((item) => item.id).filter(Boolean))
}

function collectSelectedAndFoundationRequirementIds(workGraph) {
  const ids = new Set()
  for (const node of workGraph?.nodes || []) {
    if (!['selected', 'foundation'].includes(node.scopeClass)) {
      continue
    }
    for (const requirementId of node.relatedRequirementNodeIds || []) {
      ids.add(requirementId)
    }
  }
  return ids
}

function hasAny(value) {
  return Array.isArray(value) && value.length > 0
}

function validateTraceabilityMatrix(traceability, label = '04-traceability-matrix.json') {
  if (!Array.isArray(traceability.items)) {
    errors.push(`${label} items must be an array`)
    return
  }

  for (const item of traceability.items) {
    const requirementId = item.requirementNodeId || '<missing requirementNodeId>'
    if (!item.requirementNodeId) {
      errors.push(`${label} traceability item lacks requirementNodeId`)
    }
    if (!Array.isArray(item.linkedTaskIds) || item.linkedTaskIds.length === 0) {
      errors.push(`${label} traceability item ${requirementId} lacks linkedTaskIds`)
    }
    if (!Array.isArray(item.linkedVerificationIds) || item.linkedVerificationIds.length === 0) {
      errors.push(`${label} traceability item ${requirementId} lacks linkedVerificationIds`)
    }
    if (!Array.isArray(item.evidenceRequired) || item.evidenceRequired.length === 0) {
      errors.push(`${label} traceability item ${requirementId} lacks evidenceRequired`)
    }
    if (item.coverageStatus === 'covered' && !hasAny(item.evidenceCaptured)) {
      errors.push(`${label} traceability item ${requirementId} is covered but lacks evidenceCaptured`)
    }
  }
}

function validateUiUxSpec(uiUxSpec) {
  if (!Array.isArray(uiUxSpec.screens)) {
    errors.push('05-ui-ux-spec.json screens must be an array')
    return
  }

  for (const screen of uiUxSpec.screens) {
    const screenId = screen.id || '<missing screen id>'
    if (!screen.id) {
      errors.push('UI/UX screen lacks id')
    }
    if (!Array.isArray(screen.requiredStates) || screen.requiredStates.length === 0) {
      errors.push(`UI/UX screen ${screenId} lacks requiredStates`)
    }
    if (!Array.isArray(screen.evidenceRequired) || screen.evidenceRequired.length === 0) {
      errors.push(`UI/UX screen ${screenId} lacks evidenceRequired`)
    }
  }
}

function resolveAcepReference(acepRoot, reference) {
  if (reference.startsWith('.devview/')) {
    return path.join(targetRoot, reference)
  }
  return path.join(acepRoot, reference)
}
