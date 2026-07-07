import { writeJsonAtomic } from '../core/fs.js'
import { defaultArtifacts } from '../core/project.js'
import type { CommandResult, ValidationIssue } from '../core/types.js'
import { ExitCode, hasErrors, issue } from '../core/types.js'
import { validateChangeTree, validateImpactTree } from '../validators/pbe-validators.js'
import { arrayObjects, arrayStrings, stringValue, type JsonObject } from '../validators/shared.js'
import { nextNodeId, readRequiredJsonArtifact } from './change.js'
import { type CommandContext, transitionFailed } from './shared.js'

export async function impactAnalyzeCommand(context: CommandContext): Promise<CommandResult> {
  const root = context.options.root
  const changeId = context.options.change
  const issues: ValidationIssue[] = []
  if (!changeId) {
    issues.push(
      issue({
        validator: 'Impact',
        code: 'IMPACT_CHANGE_REQUIRED',
        severity: 'error',
        message: 'devview impact analyze requires --change.',
        suggestedFix: 'Run `devview impact analyze --change CH-001 --product P-001`.',
      }),
    )
  }
  issues.push(...(await validateChangeTree(root, { requireExists: true })))
  issues.push(...(await validateImpactTree(root, { requireExists: true })))
  if (hasErrors(issues)) {
    return transitionFailed('impact analyze', 'Impact analysis failed. Control artifacts were not changed.', issues)
  }

  const changeTree = await readRequiredJsonArtifact('impact analyze', root, 'changeTree')
  if (!changeTree.ok) {
    return changeTree.result
  }
  const impactTree = await readRequiredJsonArtifact('impact analyze', root, 'impactTree')
  if (!impactTree.ok) {
    return impactTree.result
  }

  const changes = arrayObjects(changeTree.value.changes)
  const change = changes.find((entry) => stringValue(entry.id) === changeId)
  if (!change) {
    return transitionFailed('impact analyze', 'Impact analysis failed. Control artifacts were not changed.', [
      issue({
        validator: 'Impact',
        code: 'IMPACT_CHANGE_NOT_FOUND',
        severity: 'error',
        file: defaultArtifacts.changeTree,
        nodeId: changeId,
        message: `Change node ${String(changeId)} does not exist.`,
        suggestedFix: 'Create the Change node first or pass a valid --change id.',
      }),
    ])
  }

  const affected = affectedIdsFromOptionsOrChange(context, change)
  if (allAffectedIds(affected).length === 0) {
    return transitionFailed('impact analyze', 'Impact analysis failed. Control artifacts were not changed.', [
      issue({
        validator: 'Impact',
        code: 'IMPACT_AFFECTED_IDS_MISSING',
        severity: 'error',
        file: defaultArtifacts.impactTree,
        nodeId: changeId,
        message: `Impact analysis for ${String(changeId)} has no affected nodes.`,
        suggestedFix: 'Pass at least one --product, --work, --test, --evidence, or --acceptance id.',
      }),
    ])
  }

  const impacts = arrayObjects(impactTree.value.impacts)
  const id = nextNodeId(impacts, 'IM')
  const now = new Date().toISOString()
  const affectedNodeId = allAffectedIds(affected)[0]
  const impact = {
    id,
    changeNodeId: changeId,
    changeId,
    status: 'analyzed',
    affectedProductNodeIds: affected.product,
    affectedWorkNodeIds: affected.work,
    affectedTestNodeIds: affected.test,
    affectedEvidenceNodeIds: affected.evidence,
    affectedAcceptanceNodeIds: affected.acceptance,
    affectedNodeIds: allAffectedIds(affected),
    affectedNodeId,
    impactType: 'requires_retest',
    requiredAction: 'retest',
    createdAt: now,
  }
  impactTree.value.impacts = [...impacts, impact]
  impactTree.value.generatedAt = now
  change.status = 'impact_analyzed'
  change.impactAnalyzedAt = now
  change.affectedProductNodeIds = affected.product
  change.affectedWorkNodeIds = affected.work
  change.affectedTestNodeIds = affected.test
  change.affectedEvidenceNodeIds = affected.evidence
  change.affectedAcceptanceNodeIds = affected.acceptance
  change.affectedNodeIds = allAffectedIds(affected)
  changeTree.value.changes = changes
  changeTree.value.generatedAt = now

  await writeJsonAtomic(impactTree.path, impactTree.value)
  await writeJsonAtomic(changeTree.path, changeTree.value)

  return {
    ok: true,
    command: 'impact analyze',
    exitCode: ExitCode.Success,
    message: `Created Impact node ${id} for Change node ${String(changeId)}.`,
    issues: [],
    data: {
      changeId,
      impactId: id,
      impact,
      next: `Run devview revision start --change ${String(changeId)} before modifying affected accepted work.`,
    },
  }
}

type AffectedIds = {
  product: string[]
  work: string[]
  test: string[]
  evidence: string[]
  acceptance: string[]
}

function affectedIdsFromOptionsOrChange(context: CommandContext, change: JsonObject): AffectedIds {
  return {
    product: unique(
      context.options.product?.length ? context.options.product : arrayStrings(change.affectedProductNodeIds),
    ),
    work: unique(context.options.work?.length ? context.options.work : arrayStrings(change.affectedWorkNodeIds)),
    test: unique(context.options.test?.length ? context.options.test : arrayStrings(change.affectedTestNodeIds)),
    evidence: unique(
      context.options.evidence?.length ? context.options.evidence : arrayStrings(change.affectedEvidenceNodeIds),
    ),
    acceptance: unique(
      context.options.acceptance?.length ? context.options.acceptance : arrayStrings(change.affectedAcceptanceNodeIds),
    ),
  }
}

function allAffectedIds(affected: AffectedIds): string[] {
  return unique([...affected.product, ...affected.work, ...affected.test, ...affected.evidence, ...affected.acceptance])
}

function unique(values: string[] | undefined): string[] {
  return [...new Set((values || []).filter(Boolean))]
}
