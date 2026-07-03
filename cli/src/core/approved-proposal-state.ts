import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import { validateProposalOnlyGraphDeltaPreview } from './graph-delta-human-review-packet.js'

type JsonRecord = Record<string, unknown>

const BOUNDARY_ROLE = 'devview-approved-proposal-state-boundary-preview'
const BOUNDARY_STATUS = 'devview-approved-proposal-state-boundary-previewed'
const DECISION_RECORD_ROLE = 'devview-human-decision-record'
const PROPOSAL_ROLE = 'graph-delta-proposal-only-preview'
const APPROVED_STATE_ROLE = 'devview-approved-proposal-state-preview'

export interface ApprovedProposalStateOptions {
  boundary?: string
  decisionRecord: string
  proposal: string
  output?: string
  markdown?: string
}

export interface ApprovedProposalStateFileResult {
  state: ApprovedProposalStatePreview
  outputPath?: string
  markdownReport?: string
}

export interface ApprovedProposalStatePreview {
  schemaVersion: 1
  artifactRole: typeof APPROVED_STATE_ROLE
  status: 'devview-approved-proposal-state-created' | 'devview-approved-proposal-state-blocked'
  stateScope: 'approved-proposal-state-preview-no-apply'
  sourceBoundary: string | null
  sourceBoundaryArtifactRole: string | null
  sourceBoundaryStatus: string | null
  sourceHumanDecisionRecord: string
  sourceGraphDeltaProposal: string
  sourceHumanReviewPacket: string | null
  proposalId: string
  decisionValue: string
  decisionProvenance: string
  reviewerIdentity: string
  approvalStatus: 'approved-by-human-decision-record' | 'not-approved'
  approvedProposalStateCreated: boolean
  approvedStateCreationBlockedReason: string | null
  humanDecisionRecorded: boolean
  graphDeltaApplyEnabled: false
  graphDeltaApplied: false
  graphSourceMutationAllowed: false
  graphSourceMutated: false
  runtimeEvidenceSatisfied: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  strictModeEnabled: false
  guidedEnforcementEnabled: false
  userAcceptanceAutomated: false
  humanReviewRequired: true
  allowedUse: string[]
  forbiddenUse: string[]
  validationFindings: ApprovedProposalStateFinding[]
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-approved-state-output-not-source-authority'
  markdownReportPath: string | null
  nonExecutionBoundary: string
}

export interface ApprovedProposalStateFinding {
  code: string
  severity: 'info' | 'warning' | 'error'
  message: string
  field?: string
  expected?: unknown
  actual?: unknown
}

export async function createApprovedProposalStateFile(
  root: string,
  options: ApprovedProposalStateOptions,
): Promise<ApprovedProposalStateFileResult> {
  validateRequiredInputs(options)

  const resolvedBoundaryPath = options.boundary ? resolveRepoPath(root, options.boundary) : undefined
  const boundary = resolvedBoundaryPath
    ? await readRequiredJson(resolvedBoundaryPath, 'Approved Proposal State boundary')
    : null
  validateBoundary(boundary)

  const resolvedDecisionRecordPath = resolveRepoPath(root, options.decisionRecord)
  const decisionRecord = await readRequiredJson(resolvedDecisionRecordPath, 'Human Decision Record')
  validateDecisionRecord(decisionRecord)

  const resolvedProposalPath = resolveRepoPath(root, options.proposal)
  const proposal = await readRequiredJson(resolvedProposalPath, 'proposal-only Graph Delta preview')
  validateProposalOnlyGraphDeltaPreview(proposal)

  const findings = validateDecisionProposalConsistency(root, decisionRecord, proposal, resolvedProposalPath)

  await assertApprovedStateOutputAuthority(root, {
    boundary,
    resolvedBoundaryPath,
    decisionRecord,
    resolvedDecisionRecordPath,
    proposal,
    resolvedProposalPath,
    output: options.output,
    markdown: options.markdown,
  })

  const state = buildApprovedProposalState(root, {
    boundary,
    resolvedBoundaryPath,
    decisionRecord,
    resolvedDecisionRecordPath,
    proposal,
    resolvedProposalPath,
    findings,
  })

  let outputPath: string | undefined
  let markdownReport: string | undefined
  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    state.writtenOutputPath = outputPath
    state.writtenOutputPathAuthorityStatus = 'explicit-approved-state-output-not-source-authority'
    await writeJsonAtomic(resolvedOutputPath, state)
  }
  if (options.markdown) {
    const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
    markdownReport = relativePath(root, resolvedMarkdownPath)
    state.markdownReportPath = markdownReport
    await writeTextAtomic(resolvedMarkdownPath, renderApprovedProposalStateMarkdown(state))
  }

  return { state, ...(outputPath ? { outputPath } : {}), ...(markdownReport ? { markdownReport } : {}) }
}

function buildApprovedProposalState(
  root: string,
  input: {
    boundary: JsonRecord | null
    resolvedBoundaryPath?: string
    decisionRecord: JsonRecord
    resolvedDecisionRecordPath: string
    proposal: JsonRecord
    resolvedProposalPath: string
    findings: ApprovedProposalStateFinding[]
  },
): ApprovedProposalStatePreview {
  const decisionValue = stringValue(input.decisionRecord.decisionValue)
  const blockingReason =
    decisionValue === 'approve-proposal' && !input.findings.some((finding) => finding.severity === 'error')
      ? null
      : decisionValue === 'approve-proposal'
        ? 'proposal-or-decision-precondition-failed'
        : `decision-value-${decisionValue || 'missing'}-does-not-create-approved-state`
  const created = blockingReason === null
  const sourceReviewPacket = stringValue(input.decisionRecord.sourceReviewPacket) || null

  return {
    schemaVersion: 1,
    artifactRole: APPROVED_STATE_ROLE,
    status: created ? 'devview-approved-proposal-state-created' : 'devview-approved-proposal-state-blocked',
    stateScope: 'approved-proposal-state-preview-no-apply',
    sourceBoundary: input.resolvedBoundaryPath ? relativePath(root, input.resolvedBoundaryPath) : null,
    sourceBoundaryArtifactRole: input.boundary ? stringValue(input.boundary.artifactRole) : null,
    sourceBoundaryStatus: input.boundary ? stringValue(input.boundary.status) : null,
    sourceHumanDecisionRecord: relativePath(root, input.resolvedDecisionRecordPath),
    sourceGraphDeltaProposal: relativePath(root, input.resolvedProposalPath),
    sourceHumanReviewPacket: sourceReviewPacket,
    proposalId:
      stringValue(input.proposal.proposalId) || stringValue(input.decisionRecord.proposalId) || 'unknown-proposal',
    decisionValue,
    decisionProvenance: stringValue(input.decisionRecord.decisionProvenance),
    reviewerIdentity: stringValue(input.decisionRecord.reviewerIdentity),
    approvalStatus: created ? 'approved-by-human-decision-record' : 'not-approved',
    approvedProposalStateCreated: created,
    approvedStateCreationBlockedReason: blockingReason,
    humanDecisionRecorded: input.decisionRecord.humanDecisionRecorded === true,
    graphDeltaApplyEnabled: false,
    graphDeltaApplied: false,
    graphSourceMutationAllowed: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    userAcceptanceAutomated: false,
    humanReviewRequired: true,
    allowedUse: created
      ? [
          'use as approved proposal state preview input for a future separate graph delta apply command',
          'preserve explicit human decision and proposal provenance',
          'review apply preconditions without mutating graph-source',
        ]
      : [
          'document why approved proposal state was not created',
          'preserve proposal and decision provenance for human review',
          'keep non-approval decisions from entering apply-ready state',
        ],
    forbiddenUse: [
      'graph delta apply',
      'graph-source mutation',
      'runtime Evidence satisfaction',
      'equivalence proof',
      'scope enforcement',
      'CI required check',
      'branch protection mutation',
      'user acceptance automation',
      'approval inference from Codex, AI, validators, runtime smoke, CI, or review packet generation',
    ],
    validationFindings: input.findings,
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportPath: null,
    nonExecutionBoundary:
      'This Approved Proposal State command creates or blocks an approved-state preview only. It does not apply graph deltas, mutate graph-source, satisfy runtime Evidence, prove equivalence, enforce scope, configure CI or required checks, change branch protection, or replace user acceptance.',
  }
}

export function renderApprovedProposalStateMarkdown(state: ApprovedProposalStatePreview): string {
  return `# DevView Approved Proposal State Preview

Status: \`${state.status}\`

| Field | Value |
| --- | --- |
| Decision | \`${state.decisionValue}\` |
| Approval status | \`${state.approvalStatus}\` |
| Approved state created | \`${state.approvedProposalStateCreated}\` |
| Proposal | \`${state.sourceGraphDeltaProposal}\` |
| Proposal ID | \`${state.proposalId}\` |
| Decision record | \`${state.sourceHumanDecisionRecord}\` |

## Blocked Reason

${state.approvedStateCreationBlockedReason ?? 'None.'}

## Non-Execution Boundary

- Graph delta applied: \`${state.graphDeltaApplied}\`
- Graph-source mutated: \`${state.graphSourceMutated}\`
- Runtime Evidence satisfied: \`${state.runtimeEvidenceSatisfied}\`
- Equivalence proven: \`${state.equivalenceProven}\`
- Scope enforced: \`${state.scopeEnforced}\`
- CI enforcement enabled: \`${state.ciEnforcementEnabled}\`
`
}

function validateRequiredInputs(options: ApprovedProposalStateOptions): void {
  if (!options.decisionRecord) {
    throw new Error('create-approved-proposal-state requires --decision-record <decisionRecordPath>.')
  }
  if (!options.proposal) {
    throw new Error('create-approved-proposal-state requires --proposal <proposalPath>.')
  }
}

function validateBoundary(boundary: JsonRecord | null): void {
  if (!boundary) {
    return
  }
  if (boundary.artifactRole !== BOUNDARY_ROLE || boundary.status !== BOUNDARY_STATUS) {
    throw new Error(`Unsafe Approved Proposal State boundary: expected ${BOUNDARY_ROLE}/${BOUNDARY_STATUS}.`)
  }
  for (const field of [
    'graphDeltaApplyEnabled',
    'graphDeltaApplied',
    'graphSourceMutationAllowed',
    'graphSourceMutated',
    'runtimeEvidenceSatisfied',
    'equivalenceProven',
    'scopeEnforced',
    'ciEnforcementEnabled',
  ]) {
    if (boundary[field] !== false) {
      throw new Error(`Unsafe Approved Proposal State boundary: ${field} must be false.`)
    }
  }
}

function validateDecisionRecord(decisionRecord: JsonRecord): void {
  if (decisionRecord.artifactRole !== DECISION_RECORD_ROLE) {
    throw new Error(`Unsafe Human Decision Record input: artifactRole must be ${JSON.stringify(DECISION_RECORD_ROLE)}.`)
  }
  if (decisionRecord.status !== 'devview-human-decision-record-created') {
    throw new Error('Unsafe Human Decision Record input: status must be "devview-human-decision-record-created".')
  }
  if (decisionRecord.humanDecisionRecorded !== true) {
    throw new Error('Unsafe Human Decision Record input: humanDecisionRecorded must be true.')
  }
  if (decisionRecord.decisionProvenance !== 'human-authored-explicit-decision') {
    throw new Error(
      'Unsafe Human Decision Record input: decisionProvenance must be "human-authored-explicit-decision".',
    )
  }
  for (const field of [
    'approvedProposalStateCreated',
    'graphDeltaApplied',
    'graphSourceMutated',
    'runtimeEvidenceSatisfied',
    'equivalenceProven',
    'scopeEnforced',
    'ciEnforcementEnabled',
  ]) {
    if (decisionRecord[field] !== false) {
      throw new Error(`Unsafe Human Decision Record boundary: ${field} must be false.`)
    }
  }
}

function validateDecisionProposalConsistency(
  root: string,
  decisionRecord: JsonRecord,
  proposal: JsonRecord,
  resolvedProposalPath: string,
): ApprovedProposalStateFinding[] {
  const findings: ApprovedProposalStateFinding[] = []
  const decisionProposalId = stringValue(decisionRecord.proposalId)
  const proposalId = stringValue(proposal.proposalId)
  if (decisionProposalId !== proposalId) {
    findings.push({
      code: 'APPROVED_STATE_PROPOSAL_ID_MISMATCH',
      severity: 'error',
      field: 'proposalId',
      expected: decisionProposalId,
      actual: proposalId,
      message: 'Human Decision Record proposalId does not match the proposal under approval-state review.',
    })
  }

  const sourceProposal = stringValue(decisionRecord.sourceGraphDeltaProposal)
  const actualProposalPath = relativePath(root, resolvedProposalPath)
  if (sourceProposal !== actualProposalPath) {
    findings.push({
      code: 'APPROVED_STATE_PROPOSAL_PATH_MISMATCH',
      severity: 'error',
      field: 'sourceGraphDeltaProposal',
      expected: sourceProposal,
      actual: actualProposalPath,
      message: 'Human Decision Record sourceGraphDeltaProposal does not match the proposal input path.',
    })
  }

  if (decisionRecord.decisionValue !== 'approve-proposal') {
    findings.push({
      code: 'APPROVED_STATE_DECISION_NOT_APPROVED',
      severity: 'warning',
      field: 'decisionValue',
      expected: 'approve-proposal',
      actual: decisionRecord.decisionValue,
      message: 'Decision value does not create approved proposal state.',
    })
  }
  return findings
}

async function assertApprovedStateOutputAuthority(
  root: string,
  input: {
    boundary: JsonRecord | null
    resolvedBoundaryPath?: string
    decisionRecord: JsonRecord
    resolvedDecisionRecordPath: string
    proposal: JsonRecord
    resolvedProposalPath: string
    output?: string
    markdown?: string
  },
): Promise<void> {
  if (!input.output && !input.markdown) {
    return
  }
  const resolvedOutputPath = input.output ? resolveRepoPath(root, input.output) : undefined
  const resolvedMarkdownPath = input.markdown ? resolveRepoPath(root, input.markdown) : undefined
  if (resolvedOutputPath && resolvedMarkdownPath && pathKey(resolvedOutputPath) === pathKey(resolvedMarkdownPath)) {
    throw new Error('Approved Proposal State output is unsafe: --output and --markdown must be different paths.')
  }

  const protectedPaths = buildProtectedPathMap(root, input)
  for (const [label, requested, resolved] of [
    ['JSON output', input.output, resolvedOutputPath],
    ['Markdown output', input.markdown, resolvedMarkdownPath],
  ] as const) {
    if (!requested || !resolved) {
      continue
    }
    const protectedReason = protectedPaths.get(pathKey(resolved))
    if (protectedReason) {
      throw new Error(
        `Approved Proposal State ${label} path is unsafe: ${requested} would overwrite ${protectedReason}.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(resolved)
    if (existingAuthority) {
      throw new Error(
        `Approved Proposal State ${label} path is unsafe: ${requested} already contains ${existingAuthority}. Choose a dedicated approved-state output path.`,
      )
    }
  }
}

function buildProtectedPathMap(
  root: string,
  input: {
    boundary: JsonRecord | null
    resolvedBoundaryPath?: string
    decisionRecord: JsonRecord
    resolvedDecisionRecordPath: string
    proposal: JsonRecord
    resolvedProposalPath: string
  },
): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const addResolved = (candidatePath: string | undefined, reason: string): void => {
    if (candidatePath && !protectedPaths.has(pathKey(candidatePath))) {
      protectedPaths.set(pathKey(candidatePath), reason)
    }
  }
  const addConcrete = (candidate: unknown, reason: string): void => {
    const candidatePath = stringValue(candidate)
    if (!isConcreteOutputProtectedPath(candidatePath)) {
      return
    }
    addResolved(resolveRepoPath(root, candidatePath), reason)
  }

  addResolved(input.resolvedBoundaryPath, 'the source Approved Proposal State boundary')
  addResolved(input.resolvedDecisionRecordPath, 'the source Human Decision Record')
  addResolved(input.resolvedProposalPath, 'the source Graph Delta proposal')
  addConcrete(input.decisionRecord.sourceHumanReviewPacket, 'the source Human Review Packet')
  addConcrete(input.decisionRecord.sourceRuntimeReport, 'the source runtime report')

  for (const source of [input.boundary, input.decisionRecord, input.proposal]) {
    if (!source) {
      continue
    }
    for (const candidatePath of collectConcretePathStrings(source)) {
      addConcrete(candidatePath, `linked source artifact ${candidatePath}`)
    }
  }
  return protectedPaths
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) {
    return null
  }
  const record = asRecord(parsed.value)
  const artifactRole = stringValue(record?.artifactRole)
  if (!artifactRole || artifactRole === APPROVED_STATE_ROLE) {
    return null
  }
  if (
    artifactRole === BOUNDARY_ROLE ||
    artifactRole === DECISION_RECORD_ROLE ||
    artifactRole === PROPOSAL_ROLE ||
    artifactRole.includes('graph-source') ||
    artifactRole.includes('evidence') ||
    artifactRole.includes('read-model') ||
    [
      'graph-delta-human-review-packet',
      'contract-compiler-input',
      'instruction-pack',
      'selected-graph-slice',
      'graph-traversal-plan',
      'request-ir-graph-aware-validation',
      'request-ir-candidate',
    ].includes(artifactRole)
  ) {
    return `source artifactRole "${artifactRole}"`
  }
  if (asRecord(record?.sourceRecords)) {
    return 'graph-source-shaped sourceRecords'
  }
  return null
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

function collectConcretePathStrings(value: unknown, seen = new Set<unknown>()): string[] {
  if (typeof value === 'string') {
    return isConcreteOutputProtectedPath(value) ? [value] : []
  }
  if (typeof value !== 'object' || value === null || seen.has(value)) {
    return []
  }
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectConcretePathStrings(entry, seen))
  }
  return Object.values(value as JsonRecord).flatMap((entry) => collectConcretePathStrings(entry, seen))
}

function isConcreteOutputProtectedPath(value: string): boolean {
  return (
    value.includes('/') ||
    value.includes('\\') ||
    value.startsWith('.') ||
    value.endsWith('.json') ||
    value.endsWith('.md') ||
    value.endsWith('.txt')
  )
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : null
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}
