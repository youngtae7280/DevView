import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts } from '../core/project.js'
import { readJsonSafe, writeJsonAtomic } from '../core/fs.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { ExitCode, hasErrors, issue } from '../core/types.js'
import {
  deepEqual,
  isProductPatchOperation,
  validateProductPatchTree,
  type ProductPatchOperation,
} from '../validators/product-patch-validator.js'
import { arrayObjects, isObject, nodesOf, stringValue, type JsonObject } from '../validators/shared.js'
import { nextNodeId } from './change.js'
import { type CommandContext, transitionFailed } from './shared.js'

export async function productPatchProposeCommand(context: CommandContext): Promise<CommandResult> {
  const root = context.options.root
  const changeId = context.options.change
  const productIds = context.options.product || []
  const productId = productIds[0]
  const operation = context.options.operation || ''
  const summary = context.options.summary?.trim()
  const issues: ValidationIssue[] = []

  if (!changeId) {
    issues.push(
      productPatchOptionIssue('PRODUCT_PATCH_CHANGE_REQUIRED', 'devview product patch propose requires --change.'),
    )
  }
  if (!productId) {
    issues.push(
      productPatchOptionIssue('PRODUCT_PATCH_TARGET_REQUIRED', 'devview product patch propose requires --product.'),
    )
  }
  if (!operation) {
    issues.push(
      productPatchOptionIssue(
        'PRODUCT_PATCH_OPERATION_REQUIRED',
        'devview product patch propose requires --operation.',
      ),
    )
  } else if (!isProductPatchOperation(operation)) {
    issues.push(
      productPatchOptionIssue(
        'PRODUCT_PATCH_OPERATION_INVALID',
        `Unsupported Product Patch operation: ${String(operation)}.`,
      ),
    )
  }
  if (!summary) {
    issues.push(
      productPatchOptionIssue('PRODUCT_PATCH_SUMMARY_REQUIRED', 'devview product patch propose requires --summary.'),
    )
  }
  if (hasErrors(issues)) {
    return transitionFailed(
      'product patch propose',
      'Product Patch proposal failed. No artifacts were changed.',
      issues,
    )
  }
  const requiredChangeId = changeId as string
  const requiredProductId = productId as string
  const requiredOperation = operation as ProductPatchOperation
  const requiredSummary = summary as string

  const artifacts = await readProductPatchArtifacts('product patch propose', root, { createPatchTreeIfMissing: true })
  if (!artifacts.ok) {
    return artifacts.result
  }

  const changes = arrayObjects(artifacts.changeTree.changes)
  const change = changes.find((entry) => stringValue(entry.id) === requiredChangeId)
  if (!change) {
    return transitionFailed('product patch propose', 'Product Patch proposal failed. No artifacts were changed.', [
      issue({
        validator: 'ProductPatch',
        code: 'PRODUCT_PATCH_CHANGE_MISSING',
        severity: 'error',
        file: defaultArtifacts.changeTree,
        nodeId: requiredChangeId,
        message: `Change node ${requiredChangeId} does not exist.`,
        suggestedFix: 'Create the Change node first or pass a valid --change id.',
      }),
    ])
  }

  const productNodes = nodesOf(artifacts.productTree)
  const targetNode = productNodes.find((entry) => stringValue(entry.id) === requiredProductId)
  if (!targetNode) {
    return transitionFailed('product patch propose', 'Product Patch proposal failed. No artifacts were changed.', [
      issue({
        validator: 'ProductPatch',
        code: 'PRODUCT_PATCH_TARGET_MISSING',
        severity: 'error',
        file: defaultArtifacts.productTree,
        nodeId: requiredProductId,
        message: `Product node ${requiredProductId} does not exist.`,
        suggestedFix: 'Pass a valid --product id or update Product Tree through RPD before proposing a patch.',
      }),
    ])
  }

  const patches = arrayObjects(artifacts.productPatchTree.patches)
  const id = nextNodeId(patches, 'PP')
  const now = new Date().toISOString()
  const patch = {
    id,
    changeNodeId: requiredChangeId,
    targetProductNodeId: requiredProductId,
    operation: requiredOperation,
    status: 'proposed',
    requiresUserConfirmation: true,
    userConfirmed: false,
    summary: requiredSummary,
    beforeSnapshot: structuredClone(targetNode),
    afterProposal: buildAfterProposal(requiredOperation, requiredSummary, targetNode, productNodes, requiredChangeId),
    affectedProductNodeIds: [requiredProductId],
    createdAt: now,
    appliedAt: null,
  }

  artifacts.productPatchTree.version = artifacts.productPatchTree.version || '0.2.0-tree-control'
  artifacts.productPatchTree.patches = [...patches, patch]
  artifacts.productPatchTree.generatedAt = now
  await writeJsonAtomic(artifacts.productPatchTreePath, artifacts.productPatchTree)

  return {
    ok: true,
    command: 'product patch propose',
    exitCode: ExitCode.Success,
    message: `Created Product Patch node ${id}. Product Tree was not changed.`,
    issues: [],
    data: {
      patchId: id,
      patch,
      next: `Record explicit user confirmation on ${id}, then run devview product patch apply --patch ${id}.`,
    },
  }
}

export async function productPatchApplyCommand(context: CommandContext): Promise<CommandResult> {
  const root = context.options.root
  const patchId = context.options.patch
  if (!patchId) {
    return transitionFailed('product patch apply', 'Product Patch apply failed. No artifacts were changed.', [
      productPatchOptionIssue('PRODUCT_PATCH_ID_REQUIRED', 'devview product patch apply requires --patch.'),
    ])
  }

  const artifacts = await readProductPatchArtifacts('product patch apply', root, { createPatchTreeIfMissing: false })
  if (!artifacts.ok) {
    return artifacts.result
  }

  const patchIssues = await validateProductPatchTree(root, { requireExists: true })
  if (hasErrors(patchIssues)) {
    return transitionFailed(
      'product patch apply',
      'Product Patch apply failed. No artifacts were changed.',
      patchIssues,
    )
  }

  const patches = arrayObjects(artifacts.productPatchTree.patches)
  const patch = patches.find((entry) => stringValue(entry.id) === patchId)
  if (!patch) {
    return transitionFailed('product patch apply', 'Product Patch apply failed. No artifacts were changed.', [
      issue({
        validator: 'ProductPatch',
        code: 'PRODUCT_PATCH_MISSING',
        severity: 'error',
        file: defaultArtifacts.productPatchTree,
        nodeId: patchId,
        message: `Product Patch node ${String(patchId)} does not exist.`,
        suggestedFix: 'Pass a valid --patch id or create a proposal first.',
      }),
    ])
  }

  const status = stringValue(patch.status)
  if (status === 'applied') {
    return transitionFailed('product patch apply', 'Product Patch apply failed. No artifacts were changed.', [
      issue({
        validator: 'ProductPatch',
        code: 'PRODUCT_PATCH_ALREADY_APPLIED',
        severity: 'error',
        file: defaultArtifacts.productPatchTree,
        nodeId: patchId,
        message: `Product Patch ${String(patchId)} is already applied.`,
        suggestedFix: 'Do not reapply an applied Product Patch. Create a new Change/Patch for further edits.',
      }),
    ])
  }
  if (!['proposed', 'confirmed'].includes(status)) {
    return transitionFailed('product patch apply', 'Product Patch apply failed. No artifacts were changed.', [
      issue({
        validator: 'ProductPatch',
        code: 'PRODUCT_PATCH_STATUS_INVALID',
        severity: 'error',
        file: defaultArtifacts.productPatchTree,
        nodeId: patchId,
        message: `Product Patch ${String(patchId)} has status ${status || '<missing>'}.`,
        suggestedFix: 'Only proposed or confirmed Product Patch nodes can be applied.',
      }),
    ])
  }
  if (patch.userConfirmed !== true || !isObject(patch.confirmation) || patch.confirmation.actor !== 'user') {
    return transitionFailed('product patch apply', 'Product Patch apply failed. No artifacts were changed.', [
      issue({
        validator: 'ProductPatch',
        code: 'PRODUCT_PATCH_CONFIRMATION_REQUIRED',
        severity: 'error',
        file: defaultArtifacts.productPatchTree,
        nodeId: patchId,
        message: `Product Patch ${String(patchId)} requires explicit user confirmation before apply.`,
        suggestedFix:
          'Record userConfirmed: true and confirmation.actor: "user" on the patch after explicit user confirmation.',
      }),
    ])
  }

  const targetProductNodeId = stringValue(patch.targetProductNodeId)
  const productNodes = nodesOf(artifacts.productTree)
  const targetNode = productNodes.find((entry) => stringValue(entry.id) === targetProductNodeId)
  if (!targetNode || !isObject(patch.beforeSnapshot) || !deepEqual(patch.beforeSnapshot, targetNode)) {
    return transitionFailed('product patch apply', 'Product Patch apply failed. No artifacts were changed.', [
      issue({
        validator: 'ProductPatch',
        code: 'PRODUCT_PATCH_SNAPSHOT_MISMATCH',
        severity: 'error',
        file: defaultArtifacts.productPatchTree,
        nodeId: patchId,
        message: `Product Patch ${String(patchId)} beforeSnapshot does not match Product node ${targetProductNodeId}.`,
        suggestedFix: 'Recreate the Product Patch proposal from the current Product Tree before applying.',
      }),
    ])
  }

  const operation = stringValue(patch.operation) as ProductPatchOperation
  const applied = applyProductPatchOperation(artifacts.productTree, targetNode, patch)
  if (!applied.ok) {
    return transitionFailed('product patch apply', 'Product Patch apply failed. No artifacts were changed.', [
      productPatchOptionIssue(applied.code, applied.message),
    ])
  }

  const now = new Date().toISOString()
  patch.status = 'applied'
  patch.appliedAt = now
  patch.appliedOperation = operation
  artifacts.productPatchTree.patches = patches
  artifacts.productPatchTree.generatedAt = now

  await writeJsonAtomic(artifacts.productTreePath, artifacts.productTree)
  await writeJsonAtomic(artifacts.productPatchTreePath, artifacts.productPatchTree)

  const downstreamIssue = issue({
    validator: 'ProductPatch',
    code: 'PRODUCT_PATCH_DOWNSTREAM_REVALIDATION_REQUIRED',
    severity: 'warning',
    file: defaultArtifacts.productPatchTree,
    nodeId: patchId,
    message: `Product Patch ${String(patchId)} changed Product Tree semantics; downstream closure must be rerun.`,
    suggestedFix: 'Run Impact/Revision and then WPD/VD/ACEP/Execution/Review/Accept closure as required.',
    nextCommand: 'devview impact analyze',
  })

  return {
    ok: true,
    command: 'product patch apply',
    exitCode: ExitCode.Success,
    message: `Applied Product Patch node ${String(patchId)}.`,
    issues: [downstreamIssue],
    data: {
      patchId,
      next: 'Run devview impact analyze and re-enter the required Revision closure flow.',
    },
  }
}

function buildAfterProposal(
  operation: string,
  summary: string,
  targetNode: JsonObject,
  productNodes: JsonObject[],
  changeId: string,
): JsonObject {
  if (operation === 'add_child') {
    return {
      node: {
        id: nextNodeId(productNodes, 'PT'),
        type: 'feature',
        title: summary,
        status: 'proposed',
        parent: stringValue(targetNode.id),
        children: [],
        source: { type: 'change_node', changeId },
        why: summary,
        scopeClass: stringValue(targetNode.scopeClass) || 'selected',
        acceptance: [],
        acceptanceCriteria: [],
        ambiguity: { status: 'partial', type: 'missing_completion_criteria', missing: ['completion_criteria'] },
        ambiguityResolution: { status: 'pending', resolvedTerms: [] },
        derivedTo: [],
        evidence: [],
      },
    }
  }
  if (operation === 'supersede') {
    return {
      status: 'changed',
      supersededReason: summary,
    }
  }
  if (operation === 'update_acceptance_criteria') {
    return {
      acceptance: [summary],
    }
  }
  return {
    title: summary,
  }
}

function applyProductPatchOperation(
  productTree: JsonObject,
  targetNode: JsonObject,
  patch: JsonObject,
): { ok: true } | { ok: false; code: string; message: string } {
  const operation = stringValue(patch.operation)
  const afterProposal = isObject(patch.afterProposal) ? patch.afterProposal : {}
  if (operation === 'update_acceptance_criteria') {
    if (Array.isArray(afterProposal.acceptance)) {
      targetNode.acceptance = afterProposal.acceptance
    }
    if (Array.isArray(afterProposal.acceptanceCriteria)) {
      targetNode.acceptanceCriteria = afterProposal.acceptanceCriteria
    }
    return { ok: true }
  }
  if (operation === 'supersede') {
    Object.assign(targetNode, afterProposal, {
      supersededByChangeNodeId: stringValue(patch.changeNodeId),
      supersededAt: new Date().toISOString(),
    })
    return { ok: true }
  }
  if (operation === 'add_child') {
    const child = afterProposal.node
    if (!isObject(child) || !stringValue(child.id)) {
      return {
        ok: false,
        code: 'PRODUCT_PATCH_AFTER_PROPOSAL_INVALID',
        message: 'add_child requires afterProposal.node with an id.',
      }
    }
    const nodes = nodesOf(productTree)
    if (nodes.some((entry) => stringValue(entry.id) === stringValue(child.id))) {
      return {
        ok: false,
        code: 'PRODUCT_PATCH_CHILD_DUPLICATE',
        message: `Product node ${stringValue(child.id)} already exists.`,
      }
    }
    productTree.nodes = [...nodes, child]
    targetNode.children = [...new Set([...arrayStringsFromNode(targetNode.children), stringValue(child.id)])]
    return { ok: true }
  }
  if (operation === 'update') {
    Object.assign(targetNode, afterProposal)
    return { ok: true }
  }
  return {
    ok: false,
    code: 'PRODUCT_PATCH_OPERATION_INVALID',
    message: `Unsupported Product Patch operation: ${operation || '<missing>'}.`,
  }
}

function arrayStringsFromNode(value: unknown): string[] {
  return Array.isArray(value) ? value.map(stringValue).filter(Boolean) : []
}

async function readProductPatchArtifacts(
  command: string,
  root: string,
  options: { createPatchTreeIfMissing: boolean },
): Promise<
  | {
      ok: true
      changeTree: JsonObject
      productTree: JsonObject
      productPatchTree: JsonObject
      productTreePath: string
      productPatchTreePath: string
    }
  | { ok: false; result: CommandResult }
> {
  const changeTree = await readRequiredJson(command, root, 'changeTree')
  if (!changeTree.ok) {
    return changeTree
  }
  const productTree = await readRequiredJson(command, root, 'productTree')
  if (!productTree.ok) {
    return productTree
  }
  const productPatchTreePath = artifactPath(root, 'productPatchTree')
  if (!existsSync(productPatchTreePath) && options.createPatchTreeIfMissing) {
    return {
      ok: true,
      changeTree: changeTree.value,
      productTree: productTree.value,
      productPatchTree: { version: '0.2.0-tree-control', patches: [] },
      productTreePath: productTree.path,
      productPatchTreePath,
    }
  }
  const productPatchTree = await readRequiredJson(command, root, 'productPatchTree')
  if (!productPatchTree.ok) {
    return productPatchTree
  }
  return {
    ok: true,
    changeTree: changeTree.value,
    productTree: productTree.value,
    productPatchTree: productPatchTree.value,
    productTreePath: productTree.path,
    productPatchTreePath: productPatchTree.path,
  }
}

async function readRequiredJson(
  command: string,
  root: string,
  key: 'changeTree' | 'productTree' | 'productPatchTree',
): Promise<{ ok: true; path: string; value: JsonObject } | { ok: false; result: CommandResult }> {
  const filePath = artifactPath(root, key)
  if (!existsSync(filePath)) {
    return {
      ok: false,
      result: {
        ok: false,
        command,
        exitCode: ExitCode.ValidationFailed,
        message: `${command} failed. ${defaultArtifacts[key]} is missing.`,
        issues: [
          issue({
            validator: 'ProductPatch',
            code: `${String(key)
              .replace(/[A-Z]/g, (match) => `_${match}`)
              .toUpperCase()}_MISSING`,
            severity: 'error',
            file: defaultArtifacts[key],
            message: `${defaultArtifacts[key]} is missing.`,
            suggestedFix: 'Run `devview init` or restore the missing DevView artifact.',
          }),
        ],
      },
    }
  }
  const parsed = await readJsonSafe<JsonObject>(filePath)
  if (!parsed.ok) {
    return {
      ok: false,
      result: {
        ok: false,
        command,
        exitCode: ExitCode.SchemaError,
        message: `${command} failed. ${defaultArtifacts[key]} was not changed.`,
        issues: [
          issue({
            validator: 'ProductPatch',
            code: 'PRODUCT_PATCH_ARTIFACT_INVALID_JSON',
            severity: 'error',
            file: defaultArtifacts[key],
            message: parsed.error,
            suggestedFix: 'Fix JSON syntax before rerunning the command.',
          }),
        ],
      },
    }
  }
  return { ok: true, path: filePath, value: parsed.value }
}

function productPatchOptionIssue(code: string, message: string): ValidationIssue {
  return issue({
    validator: 'ProductPatch',
    code,
    severity: 'error',
    message,
    suggestedFix:
      'Use `devview product patch propose --change CH-001 --product PT-001 --operation update_acceptance_criteria --summary "..."`.',
  })
}
