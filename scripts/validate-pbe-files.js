import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const errors = []

const requiredPaths = [
  '.codex-plugin/plugin.json',
  'skills/pbe-autoflow/SKILL.md',
  'skills/pbe-start/SKILL.md',
  'skills/pbe-rpd/SKILL.md',
  'skills/pbe-ui-ux-confirm/SKILL.md',
  'skills/pbe-wpd/SKILL.md',
  'skills/pbe-vd/SKILL.md',
  'skills/pbe-plan-execution/SKILL.md',
  'skills/pbe-coverage-audit/SKILL.md',
  'skills/pbe-ux-audit/SKILL.md',
  'skills/pbe-generate-acep/SKILL.md',
  'skills/pbe-run-acep/SKILL.md',
  'skills/pbe-review-result/SKILL.md',
  'skills/pbe-collect-feedback/SKILL.md',
  'skills/pbe-create-revision-pack/SKILL.md',
  'skills/pbe-run-revision/SKILL.md',
  'templates/pbe-state.template.json',
  'templates/autoflow-state.template.json',
  'templates/source-of-truth-matrix-template.md',
  'templates/pbe-invariants-template.md',
  'templates/foundation-contract-template.md',
  'templates/parallel-safety-contract-template.md',
  'templates/parallel-conflict-report-template.md',
  'templates/pbe-status-card-template.md',
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
  'templates/work-design.template.json',
  'templates/work-graph.template.json',
  'templates/verification-design.template.json',
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
  'schemas/pbe-state.schema.json',
  'schemas/autoflow-state.schema.json',
  'schemas/source-of-truth-matrix.schema.json',
  'schemas/pbe-invariants.schema.json',
  'schemas/foundation-contract.schema.json',
  'schemas/parallel-safety-contract.schema.json',
  'schemas/requirement-tree.schema.json',
  'schemas/ui-ux-preview.schema.json',
  'schemas/ui-ux-confirmation.schema.json',
  'schemas/work-design.schema.json',
  'schemas/work-graph.schema.json',
  'schemas/verification-design.schema.json',
  'schemas/execution-manifest.schema.json',
  'schemas/execution-strategy.schema.json',
  'schemas/traceability-matrix.schema.json',
  'schemas/ui-ux-spec.schema.json',
  'schemas/final-coverage-check.schema.json',
  'schemas/feedback-items.schema.json',
  'schemas/revision-manifest.schema.json',
  'docs/usage.md',
  'docs/workflow.md',
  'docs/autoflow.md',
  'docs/pbe-philosophy.md',
  'docs/execution-profiles.md',
  'docs/source-of-truth-matrix.md',
  'docs/pbe-invariants.md',
  'docs/foundation-contract.md',
  'docs/parallel-safety-contract.md',
  'docs/parallel-conflict-recovery.md',
  'docs/state-machine.md',
  'docs/golden-scenarios.md',
  'docs/traceability-rules.md',
  'docs/file-format.md',
  'docs/rpd-tree-walk.md',
  'docs/ui-ux-confirmation-gate.md',
  'docs/work-process-designer.md',
  'docs/execution-planner.md',
  'docs/parallel-execution.md',
  'docs/verification-designer.md',
  'docs/coverage-auditor.md',
  'docs/ux-auditor.md',
  'docs/acep.md',
  'docs/traceability.md',
  'docs/ui-ux-spec.md',
  'docs/evidence-and-coverage.md',
  'docs/result-review.md',
  'docs/revision-pack.md',
  'docs/user-acceptance.md',
  'docs/examples.md',
  'AGENTS.md',
]

for (const relativePath of requiredPaths) {
  if (!existsSync(path.join(root, relativePath))) {
    errors.push(`Missing required path: ${relativePath}`)
  }
}

for (const relativePath of findJsonFiles(root, ['.codex-plugin', 'templates', 'schemas'])) {
  try {
    JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'))
  } catch (error) {
    errors.push(`Invalid JSON: ${relativePath} (${error.message})`)
  }
}

validateSkillFrontmatter()
validateStatusCardTemplates()
validateOptionalPbeTarget()
validateOptionalAcepTarget()
validateOptionalReviewTarget()
validateOptionalRevisionTargets()

if (errors.length > 0) {
  console.error('PBE validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('PBE validation passed.')

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
    if (!contents.startsWith('---\n')) {
      errors.push(`Skill lacks frontmatter: ${skillName}`)
      continue
    }

    const end = contents.indexOf('\n---', 4)
    if (end === -1) {
      errors.push(`Skill frontmatter is not closed: ${skillName}`)
      continue
    }

    const frontmatter = contents.slice(4, end)
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
    'templates/pbe-status-card-template.md',
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
    if (!contents.includes('[PBE 상태 보고]')) {
      errors.push(`${relativePath} must include [PBE 상태 보고]`)
    }
    if (!contents.includes('[Codex 메모]')) {
      errors.push(`${relativePath} must include [Codex 메모]`)
    }
    if (!contents.includes('추천 답변')) {
      errors.push(`${relativePath} must include 추천 답변`)
    }
  }
}

function validateOptionalPbeTarget() {
  const pbeRoot = path.join(root, '.pbe')
  if (!existsSync(pbeRoot)) {
    return
  }

  const blueprintRoot = path.join(pbeRoot, 'blueprint')
  const statePath = path.join(blueprintRoot, 'pbe-state.json')
  const treePath = path.join(blueprintRoot, 'requirement-tree.json')
  const previewPath = path.join(blueprintRoot, 'ui-ux-preview.json')
  const workDesignPath = path.join(blueprintRoot, 'work-design.json')
  const workGraphPath = path.join(blueprintRoot, 'work-graph.json')
  const executionStrategyPath = path.join(blueprintRoot, 'execution-strategy.json')
  const feedbackPath = path.join(root, '.pbe', 'review', 'feedback-items.json')

  if (!existsSync(blueprintRoot)) {
    errors.push('.pbe exists but .pbe/blueprint is missing')
    return
  }

  if (existsSync(statePath)) {
    const state = parseTargetJson(statePath, '.pbe/blueprint/pbe-state.json')
    if (state) {
      validatePbeState(state)
    }
  }

  if (existsSync(treePath)) {
    const tree = parseTargetJson(treePath, '.pbe/blueprint/requirement-tree.json')
    if (tree) {
      validateRequirementTree(tree)
    }
  }

  if (existsSync(previewPath)) {
    const preview = parseTargetJson(previewPath, '.pbe/blueprint/ui-ux-preview.json')
    if (preview) {
      validateUiUxPreview(preview)
    }
  }

  if (existsSync(workDesignPath)) {
    const workDesign = parseTargetJson(workDesignPath, '.pbe/blueprint/work-design.json')
    if (workDesign) {
      validateWorkDesign(workDesign)
    }
  }

  if (existsSync(workGraphPath)) {
    const workGraph = parseTargetJson(workGraphPath, '.pbe/blueprint/work-graph.json')
    if (workGraph) {
      validateWorkGraph(workGraph, '.pbe/blueprint/work-graph.json')
    }
  }

  if (existsSync(executionStrategyPath)) {
    const executionStrategy = parseTargetJson(
      executionStrategyPath,
      '.pbe/blueprint/execution-strategy.json',
    )
    if (executionStrategy) {
      validateExecutionStrategy(executionStrategy, '.pbe/blueprint/execution-strategy.json')
    }
  }

  if (existsSync(feedbackPath)) {
    const feedback = parseTargetJson(feedbackPath, '.pbe/review/feedback-items.json')
    if (feedback) {
      validateFeedbackItems(feedback)
    }
  }
}

function validateOptionalAcepTarget() {
  const acepRoot = path.join(root, '.pbe', 'codex-execution-pack')
  if (!existsSync(acepRoot)) {
    return
  }

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

  for (const relativePath of requiredAcepFiles) {
    if (!existsSync(path.join(acepRoot, relativePath))) {
      errors.push(`ACEP is missing required file: .pbe/codex-execution-pack/${relativePath}`)
    }
  }

  const manifest = parseTargetJson(
    path.join(acepRoot, 'execution-manifest.json'),
    '.pbe/codex-execution-pack/execution-manifest.json',
  )
  if (manifest) {
    validateExecutionManifest(manifest, acepRoot)
  }

  const traceability = parseTargetJson(
    path.join(acepRoot, '04-traceability-matrix.json'),
    '.pbe/codex-execution-pack/04-traceability-matrix.json',
  )
  if (traceability) {
    validateTraceabilityMatrix(traceability)
  }

  const uiUxSpec = parseTargetJson(
    path.join(acepRoot, '05-ui-ux-spec.json'),
    '.pbe/codex-execution-pack/05-ui-ux-spec.json',
  )
  if (uiUxSpec) {
    validateUiUxSpec(uiUxSpec)
  }
}

function parseTargetJson(absolutePath, label) {
  try {
    return JSON.parse(readFileSync(absolutePath, 'utf8'))
  } catch (error) {
    errors.push(`Invalid target JSON: ${label} (${error.message})`)
    return null
  }
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

function validatePbeState(state) {
  if (state.autoflow) {
    validateAutoflowState(state.autoflow, '.pbe/blueprint/pbe-state.json autoflow')
  }
}

function validateAutoflowState(autoflow, label) {
  const allowedStates = new Set([
    'IDLE',
    'STARTED',
    'RPD_DONE',
    'WAITING_UI_UX_CONFIRM',
    'UI_UX_APPROVED',
    'WPD_DONE',
    'VD_DONE',
    'DEPENDENCY_IMPACT_AUDITED',
    'WAITING_IMPLEMENTATION_SCOPE',
    'SCOPE_SELECTED',
    'WAITING_ARCHITECTURE_RUNWAY_CONFIRM',
    'ARCHITECTURE_RUNWAY_APPROVED',
    'PLAN_EXECUTED',
    'COVERAGE_AUDITED',
    'UX_AUDITED',
    'ACEP_GENERATED',
    'ACEP_RUN_DONE',
    'WAITING_REVIEW_RESULT',
    'PARTIAL_IMPLEMENTATION_DONE',
    'WAITING_NEXT_SLICE_DECISION',
    'SLICE_ACCEPTED',
    'COMPLETED',
    'BLOCKED',
    'STOPPED',
  ])
  const allowedGates = new Set([
    'ui_ux_confirm',
    'implementation_scope',
    'architecture_runway',
    'review_result',
    'next_slice_decision',
  ])
  const allowedProfiles = new Set(['bypass', 'lite', 'full'])

  if (!allowedStates.has(autoflow.state)) {
    errors.push(`${label} has invalid state: ${autoflow.state}`)
  }
  if (!allowedProfiles.has(autoflow.profile)) {
    errors.push(`${label} has invalid or missing profile: ${autoflow.profile}`)
  }
  if (!Array.isArray(autoflow.completedSteps)) {
    errors.push(`${label} completedSteps must be an array`)
  }
  if (
    autoflow.currentGate !== null &&
    autoflow.currentGate !== undefined &&
    !allowedGates.has(autoflow.currentGate)
  ) {
    errors.push(`${label} has invalid currentGate: ${autoflow.currentGate}`)
  }
  if (autoflow.state === 'WAITING_UI_UX_CONFIRM' && autoflow.currentGate !== 'ui_ux_confirm') {
    errors.push(`${label} WAITING_UI_UX_CONFIRM must set currentGate to ui_ux_confirm`)
  }
  if (autoflow.state === 'WAITING_REVIEW_RESULT' && autoflow.currentGate !== 'review_result') {
    errors.push(`${label} WAITING_REVIEW_RESULT must set currentGate to review_result`)
  }
  if (
    autoflow.state === 'WAITING_IMPLEMENTATION_SCOPE' &&
    autoflow.currentGate !== 'implementation_scope'
  ) {
    errors.push(`${label} WAITING_IMPLEMENTATION_SCOPE must set currentGate to implementation_scope`)
  }
  if (
    autoflow.state === 'WAITING_ARCHITECTURE_RUNWAY_CONFIRM' &&
    autoflow.currentGate !== 'architecture_runway'
  ) {
    errors.push(
      `${label} WAITING_ARCHITECTURE_RUNWAY_CONFIRM must set currentGate to architecture_runway`,
    )
  }
  if (
    autoflow.state === 'WAITING_NEXT_SLICE_DECISION' &&
    autoflow.currentGate !== 'next_slice_decision'
  ) {
    errors.push(`${label} WAITING_NEXT_SLICE_DECISION must set currentGate to next_slice_decision`)
  }
  if (autoflow.state === 'BLOCKED' && !autoflow.lastFailure) {
    errors.push(`${label} BLOCKED state must include lastFailure`)
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
    }
  }

  if (!workDesign.moduleBoundaryCheck && !workDesign.workGraph) {
    errors.push(
      'work-design.json should include moduleBoundaryCheck or workGraph before execution planning',
    )
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
      if (['medium', 'high'].includes(node.unknownFileTouchRisk)) {
        errors.push(
          `${label} node ${nodeId} cannot run in parallel with unknownFileTouchRisk ${node.unknownFileTouchRisk}`,
        )
      }
      if (node.type === 'foundation') {
        const docsOnly = node.affectedDomains?.every((domain) =>
          ['documentation', 'test-fixture'].includes(domain),
        )
        if (!docsOnly) {
          errors.push(`${label} foundation node ${nodeId} must be sequential unless documentation/test-fixture only`)
        }
      }
    }
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
    errors.push('execution-manifest.json tasks must be an array')
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
    if (task.scopeClass && !['selected', 'foundation', 'deferred', 'blocked', 'out_of_scope'].includes(task.scopeClass)) {
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

  if (Array.isArray(manifest.phases)) {
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

      for (const file of task.expectedSharedFiles || []) {
        if (expectedFiles.has(file)) {
          errors.push(
            `${label} parallel group ${groupId} has same-file/shared-file conflict: ${file} in ${expectedFiles.get(
              file,
            )} and ${taskId}`,
          )
        } else {
          expectedFiles.set(file, taskId)
        }
      }
    }
  }
}

function validateOptionalReviewTarget() {
  const reviewRoot = path.join(root, '.pbe', 'review')
  if (!existsSync(reviewRoot)) {
    return
  }
  const feedbackPath = path.join(reviewRoot, 'feedback-items.json')
  if (existsSync(feedbackPath)) {
    const feedback = parseTargetJson(feedbackPath, '.pbe/review/feedback-items.json')
    if (feedback) {
      validateFeedbackItems(feedback)
    }
  }
}

function validateOptionalRevisionTargets() {
  const revisionsRoot = path.join(root, '.pbe', 'revisions')
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
    const manifest = parseTargetJson(manifestPath, `.pbe/revisions/${entry}/revision-manifest.json`)
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
    const hasExplanation =
      typeof item.mappingExplanation === 'string' && item.mappingExplanation.trim().length > 0
    if (!hasMapping && !hasExplanation) {
      errors.push(`Feedback item ${id} must include affected item mapping or mappingExplanation`)
    }
  }
}

function validateRevisionManifest(manifest, revisionRoot, revisionId) {
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
    if (task.file && !existsSync(path.join(revisionRoot, task.file))) {
      errors.push(`Revision task ${taskId} points to a missing file: ${task.file}`)
    }
  }
}

function hasAny(value) {
  return Array.isArray(value) && value.length > 0
}

function validateTraceabilityMatrix(traceability) {
  if (!Array.isArray(traceability.items)) {
    errors.push('04-traceability-matrix.json items must be an array')
    return
  }

  for (const item of traceability.items) {
    const requirementId = item.requirementNodeId || '<missing requirementNodeId>'
    if (!item.requirementNodeId) {
      errors.push('Traceability item lacks requirementNodeId')
    }
    if (!Array.isArray(item.linkedTaskIds) || item.linkedTaskIds.length === 0) {
      errors.push(`Traceability item ${requirementId} lacks linkedTaskIds`)
    }
    if (!Array.isArray(item.evidenceRequired) || item.evidenceRequired.length === 0) {
      errors.push(`Traceability item ${requirementId} lacks evidenceRequired`)
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
  if (reference.startsWith('.pbe/')) {
    return path.join(root, reference)
  }
  if (reference.startsWith('.pbe\\')) {
    return path.join(root, reference)
  }
  return path.join(acepRoot, reference)
}
