import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts } from '../core/project.js'
import { readJsonSafe } from '../core/fs.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import { arrayObjects, arrayStrings, stringValue, type JsonObject } from './shared.js'

export async function validateImpactTree(
  root: string,
  options: { requireExists?: boolean; changeIds?: Set<string> } = {},
): Promise<ValidationIssue[]> {
  const filePath = artifactPath(root, 'impactTree')
  if (!existsSync(filePath)) {
    return options.requireExists
      ? [
          issue({
            validator: 'Impact',
            code: 'IMPACT_TREE_MISSING',
            severity: 'error',
            file: defaultArtifacts.impactTree,
            message: 'Impact Tree is missing.',
            suggestedFix: 'Run `devview init` or restore .pbe/control/impact-tree.json before impact analysis.',
          }),
        ]
      : []
  }
  const parsed = await readJsonSafe<JsonObject>(filePath)
  if (!parsed.ok) {
    return [
      issue({
        validator: 'Impact',
        code: 'IMPACT_TREE_INVALID_JSON',
        severity: 'error',
        file: defaultArtifacts.impactTree,
        message: `Could not parse Impact Tree: ${parsed.error}`,
        suggestedFix: 'Fix impact-tree.json syntax before running Impact commands.',
      }),
    ]
  }
  return validateImpactTreeObject(parsed.value, options)
}

export function validateImpactTreeObject(
  impactTree: JsonObject,
  options: { changeIds?: Set<string> } = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seen = new Set<string>()
  for (const impact of arrayObjects(impactTree.impacts)) {
    const id = stringValue(impact.id)
    const changeId = impactChangeId(impact)
    if (!id) {
      issues.push(
        issue({
          validator: 'Impact',
          code: 'IMPACT_ID_MISSING',
          severity: 'error',
          file: defaultArtifacts.impactTree,
          message: 'Impact node is missing id.',
          suggestedFix: 'Assign a stable IM-* id before using the Impact node.',
        }),
      )
    } else if (seen.has(id)) {
      issues.push(
        issue({
          validator: 'Impact',
          code: 'IMPACT_ID_DUPLICATE',
          severity: 'error',
          file: defaultArtifacts.impactTree,
          nodeId: id,
          message: `Duplicate Impact node id: ${id}.`,
          suggestedFix: 'Give each Impact node a unique IM-* id.',
        }),
      )
    }
    seen.add(id)

    if (!changeId) {
      issues.push(
        issue({
          validator: 'Impact',
          code: 'IMPACT_CHANGE_MISSING',
          severity: 'error',
          file: defaultArtifacts.impactTree,
          nodeId: id,
          message: `Impact node ${id || '<missing>'} does not reference a Change node.`,
          suggestedFix: 'Set changeNodeId or changeId to the affected Change node id.',
        }),
      )
    } else if (options.changeIds && !options.changeIds.has(changeId)) {
      issues.push(
        issue({
          validator: 'Impact',
          code: 'IMPACT_CHANGE_NOT_FOUND',
          severity: 'error',
          file: defaultArtifacts.impactTree,
          nodeId: id,
          message: `Impact node ${id} references missing Change node ${changeId}.`,
          suggestedFix: 'Create the Change node first or correct the impact change reference.',
        }),
      )
    }

    if (impactAffectedIds(impact).length === 0) {
      issues.push(
        issue({
          validator: 'Impact',
          code: 'IMPACT_AFFECTED_IDS_MISSING',
          severity: 'error',
          file: defaultArtifacts.impactTree,
          nodeId: id,
          message: `Impact node ${id || '<missing>'} has no affected Product/Work/Test/Evidence/Acceptance ids.`,
          suggestedFix: 'Record at least one affected node id before starting revision.',
        }),
      )
    }
  }
  return issues
}

export function impactChangeId(impact: JsonObject): string {
  return stringValue(impact.changeNodeId) || stringValue(impact.changeId)
}

export function impactAffectedIds(impact: JsonObject): string[] {
  return [
    ...arrayStrings(impact.affectedProductNodeIds),
    ...arrayStrings(impact.affectedWorkNodeIds),
    ...arrayStrings(impact.affectedTestNodeIds),
    ...arrayStrings(impact.affectedEvidenceNodeIds),
    ...arrayStrings(impact.affectedAcceptanceNodeIds),
    ...arrayStrings(impact.affectedNodeIds),
    stringValue(impact.affectedNodeId),
  ].filter(Boolean)
}
