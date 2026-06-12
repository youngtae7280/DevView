import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts } from '../core/project.js'
import { readJsonSafe } from '../core/fs.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import { validateAcceptedActors } from './acceptance-validator.js'
import { validateVisualDesign } from './visual-validator.js'
import {
  arrayObjects,
  arrayStrings,
  collectInactiveProductIds,
  collectInactiveWorkIds,
  missingIssue,
  readJsonIfExists,
  scopeLeakIssue,
  stringValue,
  type JsonObject,
} from './shared.js'

export async function validateAcep(root: string): Promise<ValidationIssue[]> {
  const manifestPath = artifactPath(root, 'executionManifest')
  if (!existsSync(manifestPath)) {
    return [
      missingIssue(
        'ACEP',
        'ACEP_MANIFEST_MISSING',
        defaultArtifacts.executionManifest,
        'ACEP execution manifest is missing.',
      ),
    ]
  }
  const issues = await validateAcceptedActors(root)
  const manifest = await readJsonSafe<JsonObject>(manifestPath)
  if (!manifest.ok) {
    issues.push(
      issue({
        validator: 'ACEP',
        code: 'JSON_INVALID',
        severity: 'error',
        file: defaultArtifacts.executionManifest,
        message: `Could not parse execution manifest: ${manifest.error}`,
        suggestedFix: 'Fix execution-manifest.json before running ACEP.',
      }),
    )
    return issues
  }
  const product = await readJsonIfExists(root, 'productTree')
  const work = await readJsonIfExists(root, 'workTree')
  const inactiveProductIds = collectInactiveProductIds(product)
  const inactiveWorkIds = collectInactiveWorkIds(work)
  for (const task of arrayObjects(manifest.value.tasks)) {
    const taskId = stringValue(task.id)
    const scopeClass = stringValue(task.scopeClass)
    if (['deferred', 'blocked', 'out_of_scope'].includes(scopeClass)) {
      issues.push(
        issue({
          validator: 'ACEP',
          code: 'ACEP_SCOPE_LEAK',
          severity: 'error',
          file: defaultArtifacts.executionManifest,
          nodeId: taskId,
          message: `ACEP task ${taskId} has inactive scopeClass ${scopeClass}.`,
          suggestedFix: 'Remove deferred/blocked/out_of_scope tasks from the active ACEP manifest.',
        }),
      )
    }
    if (
      arrayStrings(task.requirementIds).length === 0 &&
      arrayStrings(task.workGraphNodeIds).length === 0 &&
      !stringValue(task.verificationExplanation)
    ) {
      issues.push(
        issue({
          validator: 'ACEP',
          code: 'ACEP_TASK_WITHOUT_REQUIREMENT',
          severity: 'error',
          file: defaultArtifacts.executionManifest,
          nodeId: taskId,
          message: `ACEP task ${taskId} has no requirementIds, workGraphNodeIds, or verificationExplanation.`,
          suggestedFix: 'Link the task to Product/Work scope or record why it is foundation/support work.',
        }),
      )
    }
    for (const productId of arrayStrings(task.requirementIds)) {
      if (inactiveProductIds.has(productId)) {
        issues.push(scopeLeakIssue('ACEP', 'ACEP_SCOPE_LEAK', defaultArtifacts.executionManifest, taskId, productId))
      }
    }
    for (const workId of arrayStrings(task.workGraphNodeIds)) {
      if (inactiveWorkIds.has(workId)) {
        issues.push(
          issue({
            validator: 'ACEP',
            code: 'ACEP_SCOPE_LEAK',
            severity: 'error',
            file: defaultArtifacts.executionManifest,
            nodeId: taskId,
            message: `ACEP task ${taskId} includes inactive Work node ${workId}.`,
            suggestedFix: 'Remove inactive Work nodes from active ACEP scope or reopen them through Change/Impact.',
          }),
        )
      }
    }
  }
  for (const phase of arrayObjects(manifest.value.phases)) {
    for (const group of arrayObjects(phase.parallelGroups)) {
      if (
        !stringValue(group.integrationTask) ||
        group.integrationEvidenceRequired !== true ||
        group.groupCannotCompleteWithoutIntegrationPass !== true
      ) {
        issues.push(
          issue({
            validator: 'ACEP',
            code: 'PARALLEL_GROUP_INCOMPLETE',
            severity: 'error',
            file: defaultArtifacts.executionManifest,
            nodeId: stringValue(group.id),
            message: `Parallel group ${String(group.id)} lacks required integration task/evidence/pass guard.`,
            suggestedFix:
              'Add integrationTask, integrationEvidenceRequired=true, and groupCannotCompleteWithoutIntegrationPass=true.',
          }),
        )
      }
    }
  }
  if (!existsSync(artifactPath(root, 'finalCoverageCheck'))) {
    issues.push(
      missingIssue(
        'ACEP',
        'FINAL_COVERAGE_MISSING',
        defaultArtifacts.finalCoverageCheck,
        'ACEP final coverage check is missing.',
      ),
    )
  }
  issues.push(...(await validateVisualDesign(root)))
  return issues
}
