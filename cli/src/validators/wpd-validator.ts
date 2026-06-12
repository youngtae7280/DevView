import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts } from '../core/project.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import { validateTraceability } from './traceability-validator.js'
import {
  arrayStrings,
  missingIssue,
  missingLinkIssue,
  nodesOf,
  readJsonIfExists,
  stringValue,
  validateWorkDependencyGraph,
} from './shared.js'

export async function validateWpd(root: string): Promise<ValidationIssue[]> {
  const workPath = artifactPath(root, 'workTree')
  if (!existsSync(workPath)) {
    return [missingIssue('WPD', 'WORK_TREE_MISSING', defaultArtifacts.workTree, 'Work Tree is missing.')]
  }
  const work = await readJsonIfExists(root, 'workTree')
  const issues: ValidationIssue[] = []
  const workIds = new Set(
    nodesOf(work)
      .map((node) => stringValue(node.id))
      .filter(Boolean),
  )
  for (const node of nodesOf(work).filter((entry) => stringValue(entry.id) !== stringValue(work?.rootNodeId))) {
    const workId = stringValue(node.id)
    if (
      ['selected', 'foundation'].includes(stringValue(node.scopeClass)) &&
      arrayStrings(node.expectedFiles).length === 0 &&
      !node.unknownFileTouchRisk
    ) {
      issues.push(
        issue({
          validator: 'WPD',
          code: 'EXPECTED_FILES_MISSING',
          severity: 'error',
          file: defaultArtifacts.workTree,
          nodeId: workId,
          message: `Work node ${String(node.id)} has no expectedFiles and is not marked unknownFileTouchRisk.`,
          suggestedFix: 'Declare expectedFiles or mark unknownFileTouchRisk before planning parallel execution.',
        }),
      )
    }
    for (const dependencyId of arrayStrings(node.dependencies)) {
      if (!workIds.has(dependencyId)) {
        issues.push(
          missingLinkIssue(
            'WPD',
            'WORK_PRODUCT_LINK_MISSING',
            defaultArtifacts.workTree,
            workId,
            'Work dependency',
            dependencyId,
          ),
        )
      }
    }
  }
  issues.push(...validateWorkDependencyGraph(work))
  issues.push(...(await validateTraceability(root)))
  return issues
}
