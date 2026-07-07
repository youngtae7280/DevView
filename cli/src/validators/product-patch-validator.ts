import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts } from '../core/project.js'
import { readJsonSafe } from '../core/fs.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import { arrayObjects, isObject, nodesOf, stringValue, type JsonObject } from './shared.js'

export const allowedProductPatchOperations = ['update', 'add_child', 'supersede', 'update_acceptance_criteria'] as const

export type ProductPatchOperation = (typeof allowedProductPatchOperations)[number]

export async function validateProductPatchTree(
  root: string,
  options: { requireExists?: boolean } = {},
): Promise<ValidationIssue[]> {
  const patchPath = artifactPath(root, 'productPatchTree')
  if (!existsSync(patchPath)) {
    return options.requireExists
      ? [
          issue({
            validator: 'ProductPatch',
            code: 'PRODUCT_PATCH_TREE_MISSING',
            severity: 'error',
            file: defaultArtifacts.productPatchTree,
            message: 'Product Patch Tree is missing.',
            suggestedFix: 'Run `devview init` or restore .pbe/control/product-patch-tree.json.',
          }),
        ]
      : []
  }

  const parsedPatch = await readJsonSafe<JsonObject>(patchPath)
  if (!parsedPatch.ok) {
    return [
      issue({
        validator: 'ProductPatch',
        code: 'PRODUCT_PATCH_TREE_INVALID_JSON',
        severity: 'error',
        file: defaultArtifacts.productPatchTree,
        message: `Could not parse Product Patch Tree: ${parsedPatch.error}`,
        suggestedFix: 'Fix product-patch-tree.json syntax before running Product Patch commands.',
      }),
    ]
  }

  const productTree = await readOptionalJson(root, 'productTree')
  const changeTree = await readOptionalJson(root, 'changeTree')
  const impactTree = await readOptionalJson(root, 'impactTree')
  return validateProductPatchTreeObject(parsedPatch.value, { productTree, changeTree, impactTree })
}

export function validateProductPatchTreeObject(
  patchTree: JsonObject,
  context: {
    productTree?: JsonObject | null
    changeTree?: JsonObject | null
    impactTree?: JsonObject | null
  } = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const patches = arrayObjects(patchTree.patches)
  const seen = new Set<string>()
  const productNodes = nodesOf(context.productTree || null)
  const productIds = new Set(productNodes.map((entry) => stringValue(entry.id)).filter(Boolean))
  const changes = arrayObjects(context.changeTree?.changes)
  const changeIds = new Set(changes.map((entry) => stringValue(entry.id)).filter(Boolean))
  const impacts = arrayObjects(context.impactTree?.impacts)

  for (const patch of patches) {
    const id = stringValue(patch.id)
    const changeNodeId = stringValue(patch.changeNodeId)
    const targetProductNodeId = stringValue(patch.targetProductNodeId)
    const operation = stringValue(patch.operation)
    const status = stringValue(patch.status)
    const targetNode = productNodes.find((entry) => stringValue(entry.id) === targetProductNodeId)

    if (!id) {
      issues.push(productPatchIssue('PRODUCT_PATCH_ID_MISSING', id, 'Product Patch node is missing id.'))
    } else if (seen.has(id)) {
      issues.push(productPatchIssue('PRODUCT_PATCH_ID_DUPLICATE', id, `Duplicate Product Patch node id: ${id}.`))
    }
    seen.add(id)

    if (!changeNodeId || !changeIds.has(changeNodeId)) {
      issues.push(
        productPatchIssue(
          'PRODUCT_PATCH_CHANGE_MISSING',
          id || changeNodeId,
          `Product Patch ${id || '<missing>'} references missing Change node ${changeNodeId || '<missing>'}.`,
        ),
      )
    }

    if (!targetProductNodeId || !productIds.has(targetProductNodeId)) {
      issues.push(
        productPatchIssue(
          'PRODUCT_PATCH_TARGET_MISSING',
          id || targetProductNodeId,
          `Product Patch ${id || '<missing>'} references missing Product node ${targetProductNodeId || '<missing>'}.`,
        ),
      )
    }

    if (!isProductPatchOperation(operation)) {
      issues.push(
        productPatchIssue(
          'PRODUCT_PATCH_OPERATION_INVALID',
          id,
          `Product Patch ${id || '<missing>'} has invalid operation ${operation || '<missing>'}.`,
        ),
      )
    }

    if (status === 'applied' && patch.userConfirmed !== true) {
      issues.push(
        productPatchIssue(
          'PRODUCT_PATCH_CONFIRMATION_REQUIRED',
          id,
          `Applied Product Patch ${id || '<missing>'} lacks user confirmation.`,
        ),
      )
    }

    if (
      status === 'applied' &&
      !impacts.some((entry) => stringValue(entry.changeNodeId || entry.changeId) === changeNodeId)
    ) {
      issues.push(
        issue({
          validator: 'ProductPatch',
          code: 'PRODUCT_PATCH_IMPACT_MISSING',
          severity: 'warning',
          file: defaultArtifacts.productPatchTree,
          nodeId: id,
          message: `Applied Product Patch ${id || '<missing>'} has no Impact node linked to ${changeNodeId}.`,
          suggestedFix: 'Run `devview impact analyze` and then re-enter the required Revision closure flow.',
          nextCommand: 'devview impact analyze',
        }),
      )
    }

    if (
      status !== 'applied' &&
      targetNode &&
      isObject(patch.beforeSnapshot) &&
      !deepEqual(patch.beforeSnapshot, targetNode)
    ) {
      issues.push(
        productPatchIssue(
          'PRODUCT_PATCH_SNAPSHOT_MISMATCH',
          id,
          `Product Patch ${id || '<missing>'} beforeSnapshot no longer matches Product node ${targetProductNodeId}.`,
        ),
      )
    }
  }

  return issues
}

export function isProductPatchOperation(value: string): value is ProductPatchOperation {
  return allowedProductPatchOperations.includes(value as ProductPatchOperation)
}

export function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right))
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue)
  }
  if (!isObject(value)) {
    return value
  }
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableValue(value[key])]),
  )
}

async function readOptionalJson(
  root: string,
  key: 'productTree' | 'changeTree' | 'impactTree',
): Promise<JsonObject | null> {
  const filePath = artifactPath(root, key)
  if (!existsSync(filePath)) {
    return null
  }
  const parsed = await readJsonSafe<JsonObject>(filePath)
  return parsed.ok ? parsed.value : null
}

function productPatchIssue(code: string, nodeId: string, message: string): ValidationIssue {
  return issue({
    validator: 'ProductPatch',
    code,
    severity: 'error',
    file: defaultArtifacts.productPatchTree,
    nodeId: nodeId || undefined,
    message,
    suggestedFix: 'Use Product Patch CLI commands and user confirmation before mutating Product Tree semantics.',
  })
}
