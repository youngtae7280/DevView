import { createHash } from 'node:crypto'
import path from 'node:path'
import { readJsonSafe, readTextSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'

type JsonRecord = Record<string, unknown>

const PLAN_ROLE = 'devview-guarded-graph-update-apply-plan'
const BOUNDARY_ROLE = 'devview-guarded-graph-update-boundary-record'
const BOUNDARY_STATUS = 'devview-guarded-graph-update-boundary-ready'
const BOUNDARY_STATE = 'ready-for-future-guarded-graph-update-apply-command-no-mutation'

const proposalRoles = new Set([
  'graph-delta-proposal-only-preview',
  'devview-graph-delta-proposal-preview',
  'devview-graph-update-proposal-preview',
])

const unsafeAuthorityFields = [
  'guardedUpdateReady',
  'runtimeEvidenceSatisfied',
  'evidenceAccepted',
  'equivalenceProven',
  'scopeEnforced',
  'ciEnforcementEnabled',
  'requiredChecksConfigured',
  'branchProtectionChanged',
  'branchProtectionMutated',
  'requiredChecksMutated',
  'externalCiMutated',
  'diffRejectionEnabled',
  'diffRejectionActivated',
  'strictModeEnabled',
  'guidedEnforcementEnabled',
  'hooksActivated',
  'graphSourceMutated',
  'graphDeltaApplied',
  'approvalAutomationEnabled',
  'userAcceptanceAutomated',
  'providerInvoked',
  'networkCallMade',
  'extensionExecutionAllowed',
  'extensionsExecuted',
  'shellCommandsExecuted',
  'filesMutated',
]

export interface GuardedGraphUpdateApplyPlanOptions {
  graphSource: string
  proposal: string
  guardedGraphUpdateBoundaryRecord: string
  output?: string
  markdown?: string
}

export interface GuardedGraphUpdateApplyPlanFileResult {
  plan: GuardedGraphUpdateApplyPlan
  outputPath: string
  markdownReport?: string
}

export interface GuardedGraphUpdateApplyPlanFinding {
  code: string
  severity: 'info' | 'warning' | 'error'
  message: string
  field?: string
  expected?: unknown
  actual?: unknown
}

export interface GuardedGraphUpdateApplyPlanOperationPreview {
  operationId: string
  operationKind: string
  targetKind: 'record' | 'node' | 'edge'
  action: 'replace-field'
  targetId: string
  fieldPath: string[]
  beforeValue: unknown
  afterValue: unknown
  beforeSnippet: JsonRecord
  afterSnippet: JsonRecord
}

export interface GuardedGraphUpdateApplyPlan {
  schemaVersion: 1
  artifactRole: typeof PLAN_ROLE
  status: 'devview-guarded-graph-update-apply-plan-ready' | 'devview-guarded-graph-update-apply-plan-blocked'
  applyPlanStatus:
    | 'ready-deterministic-diff-preview-created'
    | 'blocked-no-concrete-operations'
    | 'blocked-unsupported-operation-shape'
  planKind: 'deterministic-guarded-graph-update-apply-plan-v1'
  sourceGraphSource: string
  sourceGraphDeltaProposal: string
  sourceGuardedGraphUpdateBoundaryRecord: string
  proposalId: string
  graphSourceOriginalHash: string
  boundaryRecordStatus: string
  boundaryGuardedUpdateReady: true
  boundaryApplyDeferred: true
  planComparisonStatus:
    | 'matched-boundary-proposal-and-current-graph-source'
    | 'matched-boundary-proposal-limited-graph-source-provenance'
  planComparisonLimitations: string[]
  operationSummary: {
    operationCount: number
    supportedOperationCount: number
    unsupportedOperationCount: number
    operationKinds: string[]
    targetKinds: string[]
    updatedNodeCount: number
    updatedEdgeCount: number
    updatedRecordCount: number
    addedNodeCount: 0
    addedEdgeCount: 0
    removedNodeCount: 0
    removedEdgeCount: 0
  }
  operationPreviews: GuardedGraphUpdateApplyPlanOperationPreview[]
  unresolvedOperations: GuardedGraphUpdateApplyPlanFinding[]
  validationFindings: GuardedGraphUpdateApplyPlanFinding[]
  guardedUpdateReady: false
  graphDeltaApplied: false
  graphSourceMutated: false
  applyPlanOnly: true
  applyCommandExecuted: false
  applyCommandEnabled: false
  applyDeferred: true
  providerInvoked: false
  networkCallMade: false
  hooksActivated: false
  branchProtectionMutated: false
  requiredChecksMutated: false
  externalCiMutated: false
  approvalAutomationEnabled: false
  userAcceptanceAutomated: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  filesMutated: false
  nonMutatingBoundary: true
  allowedUse: string[]
  forbiddenUse: string[]
  nextRequiredAction: string
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  writtenOutputPathAuthorityStatus:
    | 'not-written-stdout-only'
    | 'explicit-guarded-graph-update-apply-plan-output-not-source-authority'
  markdownReportPath: string | null
  nonExecutionBoundary: string
}

interface LoadedInputs {
  resolvedGraphSourcePath: string
  resolvedProposalPath: string
  resolvedBoundaryPath: string
  resolvedOutputPath: string
  resolvedMarkdownPath?: string
  graphSource: JsonRecord
  proposal: JsonRecord
  boundary: JsonRecord
  graphSourceText: string
  graphSourceHash: string
}

interface GraphDeltaOperation {
  operationId: string
  targetKind: 'record' | 'node' | 'edge'
  action: 'replace-field'
  targetId: string
  fieldPath: string[]
  expectedBeforeValue: unknown
  afterValue: unknown
}

export async function planGuardedGraphUpdateFile(
  root: string,
  options: GuardedGraphUpdateApplyPlanOptions,
): Promise<GuardedGraphUpdateApplyPlanFileResult> {
  validateRequiredOptions(options)
  const inputs = await loadInputs(root, options)
  validateGraphSource(inputs.graphSource)
  validateProposal(inputs.proposal)
  validateBoundaryRecord(inputs.boundary)
  compareBoundaryProposal(root, inputs)
  await validateOutputTargets(root, inputs)

  const operationResult = parseGraphDeltaOperations(inputs.proposal, inputs.graphSource)
  const plan = buildPlan(root, inputs, operationResult)
  plan.writtenOutputPath = relativePath(root, inputs.resolvedOutputPath)
  plan.writtenOutputPathAuthorityStatus = 'explicit-guarded-graph-update-apply-plan-output-not-source-authority'
  await writeJsonAtomic(inputs.resolvedOutputPath, plan)
  let markdownReport: string | undefined
  if (inputs.resolvedMarkdownPath) {
    plan.markdownReportPath = relativePath(root, inputs.resolvedMarkdownPath)
    markdownReport = plan.markdownReportPath
    await writeTextAtomic(inputs.resolvedMarkdownPath, renderGuardedGraphUpdateApplyPlanMarkdown(plan))
    await writeJsonAtomic(inputs.resolvedOutputPath, plan)
  }

  return {
    plan,
    outputPath: relativePath(root, inputs.resolvedOutputPath),
    ...(markdownReport ? { markdownReport } : {}),
  }
}

function validateRequiredOptions(options: GuardedGraphUpdateApplyPlanOptions): void {
  if (!options.graphSource) {
    throw new Error('graph read-model plan-guarded-graph-update requires --graph-source <file>.')
  }
  if (!options.proposal) {
    throw new Error('graph read-model plan-guarded-graph-update requires --proposal <file>.')
  }
  if (!options.guardedGraphUpdateBoundaryRecord) {
    throw new Error(
      'graph read-model plan-guarded-graph-update requires --guarded-graph-update-boundary-record <file>.',
    )
  }
  if (!options.output) {
    throw new Error('graph read-model plan-guarded-graph-update requires --output <file>.')
  }
}

async function loadInputs(root: string, options: GuardedGraphUpdateApplyPlanOptions): Promise<LoadedInputs> {
  const resolvedGraphSourcePath = resolveRepoPath(root, options.graphSource)
  const resolvedProposalPath = resolveRepoPath(root, options.proposal)
  const resolvedBoundaryPath = resolveRepoPath(root, options.guardedGraphUpdateBoundaryRecord)
  const resolvedOutputPath = resolveRepoPath(root, options.output || '')
  const resolvedMarkdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : undefined
  const graphSourceText = await readRequiredText(resolvedGraphSourcePath, 'graph-source')
  return {
    resolvedGraphSourcePath,
    resolvedProposalPath,
    resolvedBoundaryPath,
    resolvedOutputPath,
    ...(resolvedMarkdownPath ? { resolvedMarkdownPath } : {}),
    graphSource: parseJsonObject(graphSourceText, 'graph-source'),
    proposal: await readRequiredJson(resolvedProposalPath, 'Graph Delta proposal'),
    boundary: await readRequiredJson(resolvedBoundaryPath, 'Guarded Graph Update boundary record'),
    graphSourceText,
    graphSourceHash: sha256(graphSourceText),
  }
}

function buildPlan(
  root: string,
  inputs: LoadedInputs,
  operationResult: { operations: GraphDeltaOperation[]; findings: GuardedGraphUpdateApplyPlanFinding[] },
): GuardedGraphUpdateApplyPlan {
  const previews = operationResult.operations.map((operation) => previewOperation(inputs.graphSource, operation))
  const errorFindings = operationResult.findings.filter((entry) => entry.severity === 'error')
  const blockedStatus =
    operationResult.operations.length === 0 &&
    operationResult.findings.some((entry) => entry.code.includes('NO_CONCRETE'))
      ? 'blocked-no-concrete-operations'
      : errorFindings.length > 0
        ? 'blocked-unsupported-operation-shape'
        : null
  const status = blockedStatus
    ? 'devview-guarded-graph-update-apply-plan-blocked'
    : 'devview-guarded-graph-update-apply-plan-ready'
  const operationKinds = new Set(previews.map((entry) => entry.operationKind))
  const targetKinds = new Set(previews.map((entry) => entry.targetKind))
  const planComparisonLimitations = []
  if (!stringValue(inputs.boundary.sourceGraphSource)) {
    planComparisonLimitations.push(
      'Boundary record does not model sourceGraphSource; current graph-source identity is captured by hash only.',
    )
  }

  return {
    schemaVersion: 1,
    artifactRole: PLAN_ROLE,
    status,
    applyPlanStatus: blockedStatus ?? 'ready-deterministic-diff-preview-created',
    planKind: 'deterministic-guarded-graph-update-apply-plan-v1',
    sourceGraphSource: relativePath(root, inputs.resolvedGraphSourcePath),
    sourceGraphDeltaProposal: relativePath(root, inputs.resolvedProposalPath),
    sourceGuardedGraphUpdateBoundaryRecord: relativePath(root, inputs.resolvedBoundaryPath),
    proposalId:
      stringValue(inputs.proposal.proposalId) || stringValue(inputs.boundary.proposalId) || 'unknown-proposal',
    graphSourceOriginalHash: inputs.graphSourceHash,
    boundaryRecordStatus: stringValue(inputs.boundary.status),
    boundaryGuardedUpdateReady: true,
    boundaryApplyDeferred: true,
    planComparisonStatus: planComparisonLimitations.length
      ? 'matched-boundary-proposal-limited-graph-source-provenance'
      : 'matched-boundary-proposal-and-current-graph-source',
    planComparisonLimitations,
    operationSummary: {
      operationCount: previews.length + operationResult.findings.length,
      supportedOperationCount: previews.length,
      unsupportedOperationCount: operationResult.findings.length,
      operationKinds: Array.from(operationKinds).sort(),
      targetKinds: Array.from(targetKinds).sort(),
      updatedNodeCount: countByTargetKind(previews, 'node'),
      updatedEdgeCount: countByTargetKind(previews, 'edge'),
      updatedRecordCount: countByTargetKind(previews, 'record'),
      addedNodeCount: 0,
      addedEdgeCount: 0,
      removedNodeCount: 0,
      removedEdgeCount: 0,
    },
    operationPreviews: previews,
    unresolvedOperations: operationResult.findings,
    validationFindings: [
      finding('GUARDED_GRAPH_UPDATE_APPLY_PLAN_BOUNDARY_REVALIDATED', 'info', 'guardedGraphUpdateBoundaryRecord', {
        message: 'Guarded Graph Update boundary record was revalidated as ready, apply-deferred, and non-mutating.',
      }),
      finding('GUARDED_GRAPH_UPDATE_APPLY_PLAN_GRAPH_SOURCE_HASHED', 'info', 'graphSource', {
        message: 'Current graph-source was parsed and hashed without mutation.',
      }),
      ...operationResult.findings,
    ],
    guardedUpdateReady: false,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    applyPlanOnly: true,
    applyCommandExecuted: false,
    applyCommandEnabled: false,
    applyDeferred: true,
    providerInvoked: false,
    networkCallMade: false,
    hooksActivated: false,
    branchProtectionMutated: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    filesMutated: false,
    nonMutatingBoundary: true,
    allowedUse: [
      'preview deterministic graph-source field replacements before a future explicit guarded apply command',
      'serve as non-mutating input to a future policy-gated guarded graph update apply lifecycle',
      'show operation kinds, targets, and before/after values without writing graph-source',
    ],
    forbiddenUse: [
      'graph-source mutation',
      'Graph Delta apply',
      'external CI mutation',
      'branch protection or required checks mutation',
      'hook activation',
      'provider or network invocation',
      'approval automation',
      'user acceptance automation',
    ],
    nextRequiredAction: blockedStatus
      ? 'Repair proposal operation shape before guarded apply planning can proceed.'
      : 'Review this non-mutating apply plan, then design an explicit policy-gated guarded apply command.',
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportPath: null,
    nonExecutionBoundary:
      'This Guarded Graph Update apply plan previews deterministic graph-source changes only. It does not apply graph deltas, mutate graph-source, mutate .github, configure CI or branch protection, activate hooks, execute extensions or shell commands, call providers or networks, automate approval, or replace user acceptance.',
  }
}

function validateGraphSource(graphSource: JsonRecord): void {
  const sourceRecords = asRecord(graphSource.sourceRecords)
  const hasSourceRecords = sourceRecords && Array.isArray(sourceRecords.nodes) && Array.isArray(sourceRecords.edges)
  const hasTopLevelGraph = Array.isArray(graphSource.nodes) && Array.isArray(graphSource.edges)
  const hasRecordsGraph = Array.isArray(graphSource.records) && Array.isArray(graphSource.nodes)
  if (!hasSourceRecords && !hasTopLevelGraph && !hasRecordsGraph) {
    throw new Error('Invalid graph-source: expected sourceRecords or top-level graph arrays.')
  }
  validateTopLevelFalseFlags(graphSource, 'graph-source', new Set(['graphSourceMutated', 'graphDeltaApplied']))
}

function validateProposal(proposal: JsonRecord): void {
  const artifactRole = stringValue(proposal.artifactRole)
  const schemaId = stringValue(proposal.schemaId)
  if (!proposalRoles.has(artifactRole) && schemaId !== 'devview-graph-update-proposal-v0') {
    throw new Error('Unsafe Graph Delta proposal: unsupported artifactRole/schemaId.')
  }
  validateNoUnsafeAuthority(proposal, 'Graph Delta proposal')
}

function validateBoundaryRecord(boundary: JsonRecord): void {
  if (boundary.artifactRole !== BOUNDARY_ROLE || boundary.status !== BOUNDARY_STATUS) {
    throw new Error(`Unsafe Guarded Graph Update boundary record: expected ${BOUNDARY_ROLE}/${BOUNDARY_STATUS}.`)
  }
  if (boundary.guardedGraphUpdateBoundaryState !== BOUNDARY_STATE) {
    throw new Error('Unsafe Guarded Graph Update boundary record: unsupported boundary state.')
  }
  if (
    boundary.guardedUpdateReady !== true ||
    boundary.applyDeferred !== true ||
    boundary.applyCommandEnabled !== false
  ) {
    throw new Error(
      'Unsafe Guarded Graph Update boundary record: guardedUpdateReady/applyDeferred/applyCommandEnabled flags are invalid.',
    )
  }
  for (const field of [
    'graphDeltaApplied',
    'graphSourceMutated',
    'runtimeEvidenceSatisfied',
    'evidenceAccepted',
    'equivalenceProven',
    'scopeEnforced',
    'ciEnforcementEnabled',
    'providerInvoked',
    'networkCallMade',
    'hooksActivated',
    'approvalAutomationEnabled',
    'userAcceptanceAutomated',
    'filesMutated',
  ]) {
    if (boundary[field] !== false) {
      throw new Error(`Unsafe Guarded Graph Update boundary record: ${field} must be false.`)
    }
  }
  validateNoUnsafeAuthority(boundary, 'Guarded Graph Update boundary record', new Set(['guardedUpdateReady']))
}

function compareBoundaryProposal(root: string, inputs: LoadedInputs): void {
  const actualProposalPath = relativePath(root, inputs.resolvedProposalPath)
  const boundaryProposalPath = stringValue(inputs.boundary.sourceGraphDeltaProposal)
  if (boundaryProposalPath && boundaryProposalPath !== actualProposalPath) {
    throw new Error('Guarded Graph Update apply plan proposal mismatch: boundary sourceGraphDeltaProposal differs.')
  }
  const proposalId = stringValue(inputs.proposal.proposalId)
  if (proposalId && stringValue(inputs.boundary.proposalId) && proposalId !== stringValue(inputs.boundary.proposalId)) {
    throw new Error('Guarded Graph Update apply plan proposal mismatch: proposalId differs from boundary record.')
  }
  const boundarySourceGraph = stringValue(inputs.boundary.sourceGraphSource)
  if (boundarySourceGraph && boundarySourceGraph !== relativePath(root, inputs.resolvedGraphSourcePath)) {
    throw new Error('Guarded Graph Update apply plan graph-source mismatch: boundary sourceGraphSource differs.')
  }
}

async function validateOutputTargets(root: string, inputs: LoadedInputs): Promise<void> {
  if (
    inputs.resolvedMarkdownPath &&
    normalizeResolvedPath(inputs.resolvedOutputPath) === normalizeResolvedPath(inputs.resolvedMarkdownPath)
  ) {
    throw new Error('Guarded Graph Update apply plan output is unsafe: --output and --markdown must differ.')
  }
  const protectedPaths = collectProtectedPaths(root, inputs)
  for (const [label, target] of [
    ['JSON output', inputs.resolvedOutputPath],
    ['Markdown output', inputs.resolvedMarkdownPath],
  ] as const) {
    if (!target) continue
    const protectedReason = protectedPaths.get(normalizeResolvedPath(target))
    if (protectedReason) {
      throw new Error(
        `Guarded Graph Update apply plan ${label} path is unsafe: ${relativePath(root, target)} would overwrite ${protectedReason}.`,
      )
    }
    if (isProtectedControlPath(root, target)) {
      throw new Error(
        `Guarded Graph Update apply plan ${label} path is unsafe: ${relativePath(root, target)} is inside a protected source/control path.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(target)
    if (existingAuthority) {
      throw new Error(
        `Guarded Graph Update apply plan ${label} path is unsafe: ${relativePath(root, target)} already contains ${existingAuthority}.`,
      )
    }
  }
}

function collectProtectedPaths(root: string, inputs: LoadedInputs): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const add = (filePath: string | undefined | null, reason: string): void => {
    if (!filePath) return
    protectedPaths.set(normalizeResolvedPath(filePath), reason)
  }
  add(inputs.resolvedGraphSourcePath, 'the source graph-source')
  add(inputs.resolvedProposalPath, 'the source Graph Delta proposal')
  add(inputs.resolvedBoundaryPath, 'the source Guarded Graph Update boundary record')
  for (const source of [inputs.graphSource, inputs.proposal, inputs.boundary]) {
    for (const candidatePath of collectConcretePathStrings(source)) {
      add(resolveRepoPath(root, candidatePath), `linked source artifact ${candidatePath}`)
    }
  }
  return protectedPaths
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) return null
  const record = asRecord(parsed.value)
  const artifactRole = stringValue(record?.artifactRole)
  if (artifactRole === PLAN_ROLE) return null
  if (
    artifactRole.startsWith('devview-') ||
    artifactRole.includes('evidence') ||
    artifactRole.includes('graph-source')
  ) {
    return `source artifactRole "${artifactRole}"`
  }
  if (asRecord(record?.sourceRecords)) {
    return 'graph-source-shaped sourceRecords'
  }
  return null
}

function parseGraphDeltaOperations(
  proposal: JsonRecord,
  graphSource: JsonRecord,
): { operations: GraphDeltaOperation[]; findings: GuardedGraphUpdateApplyPlanFinding[] } {
  const rawOperations = proposal.graphDeltaOperations
  if (!Array.isArray(rawOperations) || rawOperations.length === 0) {
    return {
      operations: [],
      findings: [
        finding('GUARDED_GRAPH_UPDATE_APPLY_PLAN_NO_CONCRETE_OPERATIONS', 'error', 'graphDeltaOperations', {
          expected: 'non-empty supported graphDeltaOperations array',
          actual: Array.isArray(rawOperations) ? rawOperations.length : typeof rawOperations,
          message:
            'Proposal has no concrete deterministic graphDeltaOperations. This plan did not infer changes from broad proposal prose.',
        }),
      ],
    }
  }

  const operations: GraphDeltaOperation[] = []
  const findings: GuardedGraphUpdateApplyPlanFinding[] = []
  for (const [index, rawOperation] of rawOperations.entries()) {
    const operation = asRecord(rawOperation)
    if (!operation) {
      findings.push(unsupportedOperationFinding(index, 'operation must be an object'))
      continue
    }
    const parsed = parseOperation(index, operation, graphSource)
    if ('finding' in parsed) {
      findings.push(parsed.finding)
    } else {
      operations.push(parsed.operation)
    }
  }
  return { operations, findings }
}

function parseOperation(
  index: number,
  operation: JsonRecord,
  graphSource: JsonRecord,
): { operation: GraphDeltaOperation } | { finding: GuardedGraphUpdateApplyPlanFinding } {
  const operationId = stringValue(operation.operationId)
  const targetKind = stringValue(operation.targetKind)
  const action = stringValue(operation.action)
  const targetId = stringValue(operation.targetId)
  const fieldPath = operation.fieldPath
  if (!operationId) {
    return { finding: unsupportedOperationFinding(index, 'operationId must be a non-empty string') }
  }
  if (!['record', 'node', 'edge'].includes(targetKind)) {
    return { finding: unsupportedOperationFinding(index, 'targetKind must be record, node, or edge') }
  }
  if (action !== 'replace-field') {
    return { finding: unsupportedOperationFinding(index, 'only action replace-field is supported in v1') }
  }
  if (!targetId) {
    return { finding: unsupportedOperationFinding(index, 'targetId must be a non-empty string') }
  }
  if (!isSafeFieldPath(fieldPath)) {
    return { finding: unsupportedOperationFinding(index, 'fieldPath must be a non-empty array of safe property names') }
  }
  if (!Object.hasOwn(operation, 'expectedBeforeValue')) {
    return { finding: unsupportedOperationFinding(index, 'expectedBeforeValue is required') }
  }
  if (!Object.hasOwn(operation, 'afterValue')) {
    return { finding: unsupportedOperationFinding(index, 'afterValue is required') }
  }
  if (deepEqual(operation.expectedBeforeValue, operation.afterValue)) {
    return { finding: unsupportedOperationFinding(index, 'afterValue must differ from expectedBeforeValue') }
  }
  const target = findTarget(graphSource, targetKind as GraphDeltaOperation['targetKind'], targetId)
  if (!target) {
    return { finding: unsupportedOperationFinding(index, `target ${targetId} was not found`) }
  }
  const actualBefore = getPath(target, fieldPath)
  if (!deepEqual(actualBefore, operation.expectedBeforeValue)) {
    return {
      finding: finding(
        'GUARDED_GRAPH_UPDATE_APPLY_PLAN_EXPECTED_BEFORE_MISMATCH',
        'error',
        `graphDeltaOperations[${index}]`,
        {
          expected: operation.expectedBeforeValue,
          actual: actualBefore,
          message: `Operation ${operationId} expectedBeforeValue does not match current graph-source.`,
        },
      ),
    }
  }
  return {
    operation: {
      operationId,
      targetKind: targetKind as GraphDeltaOperation['targetKind'],
      action: 'replace-field',
      targetId,
      fieldPath,
      expectedBeforeValue: operation.expectedBeforeValue,
      afterValue: operation.afterValue,
    },
  }
}

function previewOperation(
  graphSource: JsonRecord,
  operation: GraphDeltaOperation,
): GuardedGraphUpdateApplyPlanOperationPreview {
  const target = findTarget(graphSource, operation.targetKind, operation.targetId)
  const beforeValue = target ? getPath(target, operation.fieldPath) : undefined
  return {
    operationId: operation.operationId,
    operationKind: `update-${operation.targetKind}`,
    targetKind: operation.targetKind,
    action: operation.action,
    targetId: operation.targetId,
    fieldPath: operation.fieldPath,
    beforeValue,
    afterValue: operation.afterValue,
    beforeSnippet: {
      targetId: operation.targetId,
      fieldPath: operation.fieldPath.join('.'),
      value: beforeValue,
    },
    afterSnippet: {
      targetId: operation.targetId,
      fieldPath: operation.fieldPath.join('.'),
      value: operation.afterValue,
    },
  }
}

export function renderGuardedGraphUpdateApplyPlanMarkdown(plan: GuardedGraphUpdateApplyPlan): string {
  const findings = plan.validationFindings
    .filter((entry) => entry.severity === 'error')
    .map((entry) => `- ${entry.code}: ${entry.message}`)
  const operations = plan.operationPreviews.length
    ? plan.operationPreviews
        .map(
          (entry) =>
            `- ${entry.operationId}: ${entry.action} ${entry.targetKind} ${entry.targetId} at ${entry.fieldPath.join('.')}`,
        )
        .join('\n')
    : '- None.'
  return `# DevView Guarded Graph Update Apply Plan

Status: \`${plan.status}\`

| Field | Value |
| --- | --- |
| Apply plan status | \`${plan.applyPlanStatus}\` |
| Proposal ID | \`${plan.proposalId}\` |
| Graph-source | \`${plan.sourceGraphSource}\` |
| Operation count | \`${plan.operationSummary.operationCount}\` |
| Supported operations | \`${plan.operationSummary.supportedOperationCount}\` |
| Graph delta applied | \`${plan.graphDeltaApplied}\` |
| Graph-source mutated | \`${plan.graphSourceMutated}\` |
| Apply plan only | \`${plan.applyPlanOnly}\` |

## Operation Preview

${operations}

## Blocking Findings

${findings.length ? findings.join('\n') : '- None.'}

## Boundary

${plan.nonExecutionBoundary}
`
}

function findTarget(
  graphSource: JsonRecord,
  targetKind: GraphDeltaOperation['targetKind'],
  targetId: string,
): JsonRecord | null {
  const sourceRecords = asRecord(graphSource.sourceRecords)
  const collection =
    targetKind === 'record'
      ? firstArray(graphSource.records, sourceRecords?.records)
      : targetKind === 'node'
        ? firstArray(graphSource.nodes, sourceRecords?.nodes)
        : firstArray(graphSource.edges, sourceRecords?.edges)
  const target = collection.find((entry) => asRecord(entry)?.id === targetId)
  return asRecord(target)
}

function firstArray(...values: unknown[]): unknown[] {
  return values.find((value): value is unknown[] => Array.isArray(value)) ?? []
}

function getPath(source: JsonRecord, fieldPath: string[]): unknown {
  let cursor: unknown = source
  for (const part of fieldPath) {
    const record = asRecord(cursor)
    if (!record) {
      return undefined
    }
    cursor = record[part]
  }
  return cursor
}

function isSafeFieldPath(value: unknown): value is string[] {
  const forbidden = new Set(['__proto__', 'prototype', 'constructor'])
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 4 &&
    value.every((part) => typeof part === 'string' && /^[A-Za-z0-9_-]+$/.test(part) && !forbidden.has(part))
  )
}

function unsupportedOperationFinding(index: number, message: string): GuardedGraphUpdateApplyPlanFinding {
  return finding(
    'GUARDED_GRAPH_UPDATE_APPLY_PLAN_UNSUPPORTED_OPERATION_SHAPE',
    'error',
    `graphDeltaOperations[${index}]`,
    { message },
  )
}

function countByTargetKind(
  operations: GuardedGraphUpdateApplyPlanOperationPreview[],
  targetKind: GuardedGraphUpdateApplyPlanOperationPreview['targetKind'],
): number {
  return new Set(operations.filter((entry) => entry.targetKind === targetKind).map((entry) => entry.targetId)).size
}

function validateTopLevelFalseFlags(record: JsonRecord, label: string, fields = new Set<string>()): void {
  for (const field of fields) {
    if (record[field] === true) {
      throw new Error(`Unsafe ${label}: ${field} must be false.`)
    }
  }
}

function validateNoUnsafeAuthority(record: JsonRecord, label: string, allowedTrueFields = new Set<string>()): void {
  const hits = collectUnsafeAuthorityHits(record, [], new Set(), allowedTrueFields)
  if (hits.length > 0) {
    throw new Error(`Unsafe ${label}: ${hits[0]?.field} must not be true for Guarded Graph Update apply planning.`)
  }
}

function collectUnsafeAuthorityHits(
  value: unknown,
  pathParts: string[] = [],
  seen = new Set<unknown>(),
  allowedTrueFields = new Set<string>(),
): Array<{ field: string }> {
  if (typeof value !== 'object' || value === null || seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectUnsafeAuthorityHits(entry, [...pathParts, String(index)], seen, allowedTrueFields),
    )
  }
  const record = value as JsonRecord
  const hits: Array<{ field: string }> = []
  for (const [key, entry] of Object.entries(record)) {
    const nextPath = [...pathParts, key]
    if (unsafeAuthorityFields.includes(key) && entry === true && !allowedTrueFields.has(key)) {
      hits.push({ field: nextPath.join('.') })
    }
    hits.push(...collectUnsafeAuthorityHits(entry, nextPath, seen, allowedTrueFields))
  }
  return hits
}

async function readRequiredText(filePath: string, label: string): Promise<string> {
  const parsed = await readTextSafe(filePath)
  if (!parsed.ok) {
    throw new Error(`Unable to read ${label}: ${parsed.error}`)
  }
  return parsed.value
}

async function readRequiredJson(filePath: string, label: string): Promise<JsonRecord> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) {
    throw new Error(`Unable to read ${label}: ${parsed.error}`)
  }
  const record = asRecord(parsed.value)
  if (!record) {
    throw new Error(`Unable to read ${label}: expected JSON object.`)
  }
  return record
}

function parseJsonObject(text: string, label: string): JsonRecord {
  try {
    const value = JSON.parse(text.replace(/^\uFEFF/, '')) as unknown
    const record = asRecord(value)
    if (!record) {
      throw new Error('expected JSON object')
    }
    return record
  } catch (error) {
    throw new Error(`Unable to read ${label}: ${errorMessage(error)}`)
  }
}

function isProtectedControlPath(root: string, filePath: string): boolean {
  const relative = relativePath(root, filePath)
  return (
    hasDevViewControlDirectory(relative) ||
    hasCodexControlDirectory(relative) ||
    hasHiddenControlDirectorySegment(relative) ||
    /^\.github\//i.test(relative) ||
    /(^|\/)(graph-source|source-authority|project-memory)(\.|-)/i.test(relative)
  )
}

function collectConcretePathStrings(value: unknown, seen = new Set<unknown>()): string[] {
  if (typeof value === 'string') return looksLikePath(value) ? [value] : []
  if (typeof value !== 'object' || value === null || seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) return value.flatMap((entry) => collectConcretePathStrings(entry, seen))
  return Object.values(value as JsonRecord).flatMap((entry) => collectConcretePathStrings(entry, seen))
}

function looksLikePath(value: string): boolean {
  return (
    value.includes('/') ||
    value.includes('\\') ||
    value.startsWith('.') ||
    /\.(json|md|txt|html|yml|yaml)$/i.test(value)
  )
}

function finding(
  code: string,
  severity: GuardedGraphUpdateApplyPlanFinding['severity'],
  field: string,
  input: { message: string; expected?: unknown; actual?: unknown },
): GuardedGraphUpdateApplyPlanFinding {
  return {
    code,
    severity,
    message: input.message,
    field,
    ...(input.expected !== undefined ? { expected: input.expected } : {}),
    ...(input.actual !== undefined ? { actual: input.actual } : {}),
  }
}

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : null
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function resolveRepoPath(root: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(root, inputPath)
}

function normalizeResolvedPath(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
