import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts, getOpenBlockingDecisions } from '../core/project.js'
import { readJsonSafe } from '../core/fs.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import {
  acceptanceCriteriaOf,
  childrenOf,
  collectUnresolvedAbstractTerms,
  findRootNode,
  getNestedString,
  hasUserConfirmationEvidence,
  isExecutableProductNode,
  nodesOf,
  stringValue,
  terminalProductIntakeStatuses,
  validateAcceptanceCriterion,
  type JsonObject,
} from './shared.js'

export interface ProductIntakeCheckOptions {
  completionMode: boolean
}

export async function validateProductIntake(
  root: string,
  options: ProductIntakeCheckOptions,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = []
  const productPath = artifactPath(root, 'productTree')
  const requirementPath = artifactPath(root, 'requirementTree')
  const decisionQueuePath = artifactPath(root, 'decisionQueue')

  if (!existsSync(productPath)) {
    return [
      issue({
        validator: 'ProductIntake',
        code: 'PRODUCT_TREE_MISSING',
        severity: 'error',
        file: defaultArtifacts.productTree,
        message: 'Product Tree is missing.',
        suggestedFix:
          'Run `devview init` or create .devview/tree/product-tree.json before running Product Intake checks.',
      }),
    ]
  }

  const product = await readJsonSafe<JsonObject>(productPath)
  if (!product.ok) {
    return [
      issue({
        validator: 'ProductIntake',
        code: 'JSON_INVALID',
        severity: 'error',
        file: defaultArtifacts.productTree,
        message: `Could not parse Product Tree: ${product.error}`,
        suggestedFix: 'Fix product-tree.json syntax before continuing.',
      }),
    ]
  }

  if (!existsSync(requirementPath)) {
    issues.push(
      issue({
        validator: 'ProductIntake',
        code: 'COMPAT_REQUIREMENT_TREE_MISSING',
        severity: 'error',
        file: defaultArtifacts.requirementTree,
        message: 'Backward-compatible requirement-tree.json is missing.',
        suggestedFix: 'Regenerate the compatibility requirement-tree view from the Product Tree.',
      }),
    )
  }

  const rootNode = findRootNode(product.value)
  if (!rootNode) {
    issues.push(
      issue({
        validator: 'ProductIntake',
        code: 'PRODUCT_ROOT_MISSING',
        severity: 'error',
        file: defaultArtifacts.productTree,
        message: 'Product Tree rootNodeId does not resolve to a node.',
        suggestedFix: 'Set rootNodeId to an existing Product node id.',
      }),
    )
  }

  if (options.completionMode && rootNode && !hasUserConfirmationEvidence(rootNode)) {
    issues.push(
      issue({
        validator: 'ProductIntake',
        code: 'ROOT_NOT_CONFIRMED_BY_USER',
        severity: 'error',
        file: defaultArtifacts.productTree,
        nodeId: stringValue(rootNode.id),
        message: `Product root ${String(rootNode.id)} has no explicit user confirmation evidence.`,
        suggestedFix:
          'Ask the user to confirm the root summary or revise it, then record user confirmation metadata on the Product root.',
      }),
    )
  }

  for (const node of nodesOf(product.value)) {
    const nodeId = stringValue(node.id)
    const isLeaf = childrenOf(node).length === 0
    const status = stringValue(node.status)
    const executable = isExecutableProductNode(node)

    if (options.completionMode && isLeaf && !terminalProductIntakeStatuses.has(status)) {
      issues.push(
        issue({
          validator: 'ProductIntake',
          code: status === 'blocked' ? 'NODE_BLOCKED' : 'LEAF_NOT_TERMINAL',
          severity: 'error',
          file: defaultArtifacts.productTree,
          nodeId,
          message: `Product leaf ${nodeId} is ${status || 'missing status'}, not confirmed/deferred/out_of_scope.`,
          suggestedFix:
            'Continue Product Intake for this node or explicitly mark it confirmed, deferred, or out_of_scope with user-backed rationale.',
        }),
      )
    }

    if (executable && ['partial', 'ambiguous'].includes(getNestedString(node, ['ambiguity', 'status']))) {
      issues.push(
        issue({
          validator: 'ProductIntake',
          code: 'AMBIGUITY_UNRESOLVED',
          severity: 'error',
          file: defaultArtifacts.productTree,
          nodeId,
          message: `Selected executable Product node ${nodeId} still has unresolved ambiguity.`,
          suggestedFix:
            'Ask exactly one focused Product Intake question and resolve ambiguity into concrete acceptance criteria before Work Planning.',
        }),
      )
    }

    if (executable && status === 'needs_clarification') {
      issues.push(
        issue({
          validator: 'ProductIntake',
          code: 'NODE_NEEDS_CLARIFICATION',
          severity: 'error',
          file: defaultArtifacts.productTree,
          nodeId,
          message: `Selected Product node ${nodeId} still needs clarification.`,
          suggestedFix: 'Resolve the open clarification before deriving Work Tree nodes.',
        }),
      )
    }

    if (
      executable &&
      status === 'confirmed' &&
      acceptanceCriteriaOf(node).length === 0 &&
      !stringValue(node.acceptanceNotRequiredReason)
    ) {
      issues.push(
        issue({
          validator: 'ProductIntake',
          code: 'ACCEPTANCE_CRITERIA_MISSING',
          severity: 'error',
          file: defaultArtifacts.productTree,
          nodeId,
          message: `Confirmed executable Product node ${nodeId} lacks acceptanceCriteria or acceptanceNotRequiredReason.`,
          suggestedFix:
            'Write structured EARS acceptance criteria, or record why criteria are not required for this node.',
        }),
      )
    }

    const unresolvedTerms = collectUnresolvedAbstractTerms(node)
    if (executable && unresolvedTerms.length > 0) {
      issues.push(
        issue({
          validator: 'ProductIntake',
          code: 'ABSTRACT_QUALITY_TERM',
          severity: 'error',
          file: defaultArtifacts.productTree,
          nodeId,
          message: `Product node ${nodeId} contains unresolved abstract quality term(s): ${unresolvedTerms.join(', ')}.`,
          suggestedFix:
            'Resolve target, condition, expected behavior, completion criteria, exception behavior, and verification method.',
        }),
      )
    }

    for (const criterion of acceptanceCriteriaOf(node)) {
      issues.push(...validateAcceptanceCriterion(node, criterion))
    }
  }

  if (existsSync(decisionQueuePath)) {
    const queue = await readJsonSafe<JsonObject>(decisionQueuePath)
    if (queue.ok) {
      for (const decision of getOpenBlockingDecisions(queue.value)) {
        issues.push(
          issue({
            validator: 'ProductIntake',
            code: 'BLOCKING_DECISION_OPEN',
            severity: 'error',
            file: defaultArtifacts.decisionQueue,
            nodeId: stringValue(decision.targetNodeId),
            message: `Blocking decision ${String(decision.id)} is still open: ${String(decision.question || decision.reason || '')}`,
            suggestedFix:
              'Ask the user to resolve this decision before closing Product Intake or entering downstream stages.',
          }),
        )
      }
    }
  }

  return issues
}
