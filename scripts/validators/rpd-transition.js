import { createIssue } from '../validator-utils/report-utils.js'
import { readFirstOptionalJson, readOptionalJson } from '../validator-utils/json-utils.js'

const validator = 'RPD transition guard'

const rpdIncompleteRequirementStatuses = new Set([
  'pending_interview',
  'interviewing',
  'ready_to_decompose',
  'ready_to_confirm',
  'blocked',
])

const rpdTerminalRequirementStatuses = new Set(['confirmed', 'deferred', 'out_of_scope'])

const incompleteProductStatuses = new Set([
  'draft',
  'assumed',
  'auto_derived',
  'needs_human_decision',
  'proposed',
  'blocked',
  'changed',
  'reopened',
])

const rpdCompleteProductStatuses = new Set([
  'confirmed',
  'accepted',
  'covered',
  'partial_satisfied',
  'satisfied',
  'accepted_done',
  'deferred',
  'out_of_scope',
])

const downstreamSteps = new Set([
  'wpd',
  'vd',
  'dependency_impact_audit',
  'plan_execution',
  'coverage_audit',
  'ux_audit',
  'generate_acep',
  'run_acep',
])

const downstreamStates = new Set([
  'RPD_DONE',
  'WAITING_UI_UX_CONFIRM',
  'UI_UX_APPROVED',
  'VISUAL_CONTRACT_READY',
  'WPD_DONE',
  'UI_SURFACE_INVENTORY_DONE',
  'VD_DONE',
  'WAITING_IMPLEMENTATION_SCOPE',
  'SCOPE_SELECTED',
  'ACEP_READY',
  'ACEP_RUN_DONE',
  'VISUAL_AUDIT_DONE',
  'WAITING_REVIEW_RESULT',
  'DONE',
  // Migration aliases accepted only to guard older .pbe folders.
  'DEPENDENCY_IMPACT_AUDITED',
  'WAITING_ARCHITECTURE_RUNWAY_CONFIRM',
  'ARCHITECTURE_RUNWAY_APPROVED',
  'PLAN_EXECUTED',
  'COVERAGE_AUDITED',
  'UX_AUDITED',
  'ACEP_GENERATED',
  'PARTIAL_IMPLEMENTATION_DONE',
  'WAITING_NEXT_SLICE_DECISION',
  'SLICE_ACCEPTED',
  'COMPLETED',
])

const downstreamStages = new Set(['wpd', 'vd', 'execution_planning', 'acep_ready', 'acep_running', 'complete'])

const reviewDeliveryStatuses = new Set([
  'implemented',
  'verified',
  'submitted_for_review',
  'revision_verified',
  'accepted',
])

export function runRpdTransitionValidator({ root }) {
  const issues = []
  const { data: state, issue: stateIssue } = readFirstOptionalJson(
    root,
    ['.devview/blueprint/devview-state.json', '.devview/blueprint/pbe-state.json', '.pbe/blueprint/pbe-state.json'],
    validator,
  )
  const { data: requirementTree, issue: requirementIssue } = readOptionalJson(
    root,
    '.pbe/blueprint/requirement-tree.json',
    validator,
  )
  const { data: productTree, issue: productIssue } = readOptionalJson(root, '.pbe/tree/product-tree.json', validator)
  const { data: decisionQueue, issue: decisionIssue } = readOptionalJson(
    root,
    '.pbe/control/decision-queue.json',
    validator,
  )

  for (const issue of [stateIssue, requirementIssue, productIssue, decisionIssue].filter(Boolean)) {
    issues.push(issue)
  }

  if (!state && !requirementTree && !productTree && !decisionQueue) {
    return issues
  }

  const rpdProblems = [
    ...findRequirementTreeProblems(requirementTree),
    ...findProductTreeProblems(productTree),
    ...findBlockingDecisionProblems(decisionQueue),
  ]

  if (rpdProblems.length === 0) {
    return issues
  }

  if (isDownstreamState(state)) {
    for (const problem of rpdProblems) {
      issues.push(
        createIssue({
          validator,
          file: problem.file,
          code: 'RPD_INCOMPLETE_DOWNSTREAM_BLOCKED',
          message: `${problem.message} Downstream execution/review state is not allowed until RPD is user-confirmed.`,
          suggestedFix:
            'Return to RPD, propose the requirement summary/decomposition, get explicit user confirmation, then rerun downstream stages.',
        }),
      )
    }
  }

  if (state?.deliveryStatus && reviewDeliveryStatuses.has(state.deliveryStatus)) {
    for (const problem of rpdProblems) {
      issues.push(
        createIssue({
          validator,
          file: problem.file,
          code: 'RPD_INCOMPLETE_DELIVERY_STATUS_BLOCKED',
          message: `${problem.message} deliveryStatus=${state.deliveryStatus} is not allowed while RPD is incomplete.`,
          suggestedFix:
            'Use draft_created_from_assumptions or waiting_root_confirmation until the user confirms the root/leaf requirements.',
        }),
      )
    }
  }

  return issues
}

function isDownstreamState(state) {
  if (!state) {
    return false
  }

  if (downstreamStages.has(state.stage)) {
    return true
  }

  const autoflow = state.autoflow || {}
  if (downstreamStates.has(autoflow.state)) {
    return true
  }
  if ((autoflow.completedSteps || []).some((step) => downstreamSteps.has(step))) {
    return true
  }
  if (downstreamSteps.has(autoflow.nextStep)) {
    return true
  }

  return false
}

function findRequirementTreeProblems(tree) {
  if (!tree || !Array.isArray(tree.nodes)) {
    return []
  }

  const byId = new Map(tree.nodes.map((node) => [node.id, node]))
  const problems = []

  for (const node of tree.nodes) {
    const children = Array.isArray(node.children) ? node.children : []
    const existingChildren = children.filter((childId) => byId.has(childId))
    const isLeaf = existingChildren.length === 0

    if (rpdIncompleteRequirementStatuses.has(node.status)) {
      problems.push({
        file: '.pbe/blueprint/requirement-tree.json',
        message: `Requirement node ${node.id || '<missing id>'} is ${node.status}.`,
      })
      continue
    }

    if (isLeaf && !rpdTerminalRequirementStatuses.has(node.status)) {
      problems.push({
        file: '.pbe/blueprint/requirement-tree.json',
        message: `Requirement leaf ${node.id || '<missing id>'} is ${node.status}, not terminal.`,
      })
    }
  }

  return problems
}

function findProductTreeProblems(tree) {
  if (!tree || !Array.isArray(tree.nodes)) {
    return []
  }

  const byId = new Map(tree.nodes.map((node) => [node.id, node]))
  const root = byId.get(tree.rootNodeId)
  const problems = []

  for (const node of tree.nodes) {
    if (incompleteProductStatuses.has(node.status)) {
      problems.push({
        file: '.pbe/tree/product-tree.json',
        message: `Product node ${node.id || '<missing id>'} is ${node.status}.`,
      })
    }
  }

  if (root && !rpdCompleteProductStatuses.has(root.status)) {
    problems.push({
      file: '.pbe/tree/product-tree.json',
      message: `Product root ${root.id || tree.rootNodeId} is ${root.status}, not confirmed or terminal.`,
    })
  }

  return problems
}

function findBlockingDecisionProblems(queue) {
  if (!queue || !Array.isArray(queue.decisions)) {
    return []
  }

  return queue.decisions
    .filter((decision) => {
      const open = !['answered', 'resolved', 'closed', 'cancelled', 'superseded'].includes(decision.status)
      const blocking = ['gate', 'blocking'].includes(decision.blockingLevel)
      return open && blocking
    })
    .map((decision) => ({
      file: '.pbe/control/decision-queue.json',
      message: `Decision ${decision.id || '<missing id>'} is ${decision.status} with blockingLevel=${decision.blockingLevel}.`,
    }))
}
