import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import { validateProposalOnlyGraphDeltaPreview } from './graph-delta-human-review-packet.js'

type JsonRecord = Record<string, unknown>

const BOUNDARY_ROLE = 'devview-graph-delta-apply-boundary-preview'
const BOUNDARY_STATUS = 'devview-graph-delta-apply-boundary-previewed'
const APPROVED_STATE_ROLE = 'devview-approved-proposal-state-preview'
const PROPOSAL_ROLE = 'graph-delta-proposal-only-preview'
const READINESS_ROLE = 'devview-graph-delta-apply-readiness-preview'

export interface GraphDeltaApplyReadinessOptions {
  boundary?: string
  approvedState: string
  proposal: string
  output?: string
  markdown?: string
}

export interface GraphDeltaApplyReadinessFileResult {
  readiness: GraphDeltaApplyReadinessPreview
  outputPath?: string
  markdownReport?: string
}

export interface GraphDeltaApplyReadinessPreview {
  schemaVersion: 1
  artifactRole: typeof READINESS_ROLE
  status: 'devview-graph-delta-apply-readiness-ready' | 'devview-graph-delta-apply-readiness-blocked'
  readinessScope: 'graph-delta-apply-readiness-preview-no-apply'
  sourceBoundary: string | null
  sourceBoundaryArtifactRole: string | null
  sourceBoundaryStatus: string | null
  sourceApprovedProposalState: string
  sourceGraphDeltaProposal: string
  proposalId: string
  applyReadinessStatus:
    | 'dry-run-ready-approved-state-present'
    | 'blocked-approved-state-not-created'
    | 'blocked-proposal-or-approved-state-precondition-failed'
  approvedProposalStateCreated: boolean
  approvalStatus: string
  humanDecisionRecorded: boolean
  humanReviewRequired: true
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
  validationFindings: GraphDeltaApplyReadinessFinding[]
  allowedUse: string[]
  forbiddenUse: string[]
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-apply-readiness-output-not-source-authority'
  markdownReportPath: string | null
  nonExecutionBoundary: string
}

export interface GraphDeltaApplyReadinessFinding {
  code: string
  severity: 'info' | 'warning' | 'error'
  message: string
  field?: string
  expected?: unknown
  actual?: unknown
}

export async function checkGraphDeltaApplyReadinessFile(
  root: string,
  options: GraphDeltaApplyReadinessOptions,
): Promise<GraphDeltaApplyReadinessFileResult> {
  validateRequiredInputs(options)

  const resolvedBoundaryPath = options.boundary ? resolveRepoPath(root, options.boundary) : undefined
  const boundary = resolvedBoundaryPath
    ? await readRequiredJson(resolvedBoundaryPath, 'Graph Delta Apply boundary')
    : null
  validateBoundary(boundary)

  const resolvedApprovedStatePath = resolveRepoPath(root, options.approvedState)
  const approvedState = await readRequiredJson(resolvedApprovedStatePath, 'Approved Proposal State preview')
  validateApprovedState(approvedState)

  const resolvedProposalPath = resolveRepoPath(root, options.proposal)
  const proposal = await readRequiredJson(resolvedProposalPath, 'proposal-only Graph Delta preview')
  validateProposalOnlyGraphDeltaPreview(proposal)

  const findings = validateApprovedStateProposalConsistency(root, approvedState, proposal, resolvedProposalPath)

  await assertApplyReadinessOutputAuthority(root, {
    boundary,
    resolvedBoundaryPath,
    approvedState,
    resolvedApprovedStatePath,
    proposal,
    resolvedProposalPath,
    output: options.output,
    markdown: options.markdown,
  })

  const readiness = buildApplyReadiness(root, {
    boundary,
    resolvedBoundaryPath,
    approvedState,
    resolvedApprovedStatePath,
    proposal,
    resolvedProposalPath,
    findings,
  })

  let outputPath: string | undefined
  let markdownReport: string | undefined
  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    readiness.writtenOutputPath = outputPath
    readiness.writtenOutputPathAuthorityStatus = 'explicit-apply-readiness-output-not-source-authority'
    await writeJsonAtomic(resolvedOutputPath, readiness)
  }
  if (options.markdown) {
    const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
    markdownReport = relativePath(root, resolvedMarkdownPath)
    readiness.markdownReportPath = markdownReport
    await writeTextAtomic(resolvedMarkdownPath, renderGraphDeltaApplyReadinessMarkdown(readiness))
  }

  return { readiness, ...(outputPath ? { outputPath } : {}), ...(markdownReport ? { markdownReport } : {}) }
}

function buildApplyReadiness(
  root: string,
  input: {
    boundary: JsonRecord | null
    resolvedBoundaryPath?: string
    approvedState: JsonRecord
    resolvedApprovedStatePath: string
    proposal: JsonRecord
    resolvedProposalPath: string
    findings: GraphDeltaApplyReadinessFinding[]
  },
): GraphDeltaApplyReadinessPreview {
  const approvedCreated = input.approvedState.approvedProposalStateCreated === true
  const hasErrors = input.findings.some((finding) => finding.severity === 'error')
  const ready = approvedCreated && !hasErrors
  const applyReadinessStatus = ready
    ? 'dry-run-ready-approved-state-present'
    : !approvedCreated
      ? 'blocked-approved-state-not-created'
      : 'blocked-proposal-or-approved-state-precondition-failed'

  return {
    schemaVersion: 1,
    artifactRole: READINESS_ROLE,
    status: ready ? 'devview-graph-delta-apply-readiness-ready' : 'devview-graph-delta-apply-readiness-blocked',
    readinessScope: 'graph-delta-apply-readiness-preview-no-apply',
    sourceBoundary: input.resolvedBoundaryPath ? relativePath(root, input.resolvedBoundaryPath) : null,
    sourceBoundaryArtifactRole: input.boundary ? stringValue(input.boundary.artifactRole) : null,
    sourceBoundaryStatus: input.boundary ? stringValue(input.boundary.status) : null,
    sourceApprovedProposalState: relativePath(root, input.resolvedApprovedStatePath),
    sourceGraphDeltaProposal: relativePath(root, input.resolvedProposalPath),
    proposalId:
      stringValue(input.proposal.proposalId) || stringValue(input.approvedState.proposalId) || 'unknown-proposal',
    applyReadinessStatus,
    approvedProposalStateCreated: approvedCreated,
    approvalStatus: stringValue(input.approvedState.approvalStatus),
    humanDecisionRecorded: input.approvedState.humanDecisionRecorded === true,
    humanReviewRequired: true,
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
    validationFindings: input.findings,
    allowedUse: ready
      ? [
          'review graph delta apply readiness before a separate future apply command',
          'confirm approved-state and proposal provenance without mutating graph-source',
          'serve as dry-run readiness context only',
        ]
      : [
          'document why graph delta apply readiness is blocked',
          'preserve approved-state and proposal provenance for human review',
          'keep blocked or mismatched inputs out of apply-ready state',
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
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportPath: null,
    nonExecutionBoundary:
      'This Graph Delta Apply readiness command checks apply preconditions only. It does not apply graph deltas, mutate graph-source, satisfy runtime Evidence, prove equivalence, enforce scope, configure CI or required checks, change branch protection, or replace user acceptance.',
  }
}

export function renderGraphDeltaApplyReadinessMarkdown(readiness: GraphDeltaApplyReadinessPreview): string {
  return `# DevView Graph Delta Apply Readiness

Status: \`${readiness.status}\`

| Field | Value |
| --- | --- |
| Apply readiness | \`${readiness.applyReadinessStatus}\` |
| Approved state created | \`${readiness.approvedProposalStateCreated}\` |
| Approval status | \`${readiness.approvalStatus}\` |
| Proposal | \`${readiness.sourceGraphDeltaProposal}\` |
| Proposal ID | \`${readiness.proposalId}\` |
| Approved state | \`${readiness.sourceApprovedProposalState}\` |

## Non-Execution Boundary

- Graph delta apply enabled: \`${readiness.graphDeltaApplyEnabled}\`
- Graph delta applied: \`${readiness.graphDeltaApplied}\`
- Graph-source mutation allowed: \`${readiness.graphSourceMutationAllowed}\`
- Graph-source mutated: \`${readiness.graphSourceMutated}\`
- Runtime Evidence satisfied: \`${readiness.runtimeEvidenceSatisfied}\`
- Equivalence proven: \`${readiness.equivalenceProven}\`
- Scope enforced: \`${readiness.scopeEnforced}\`
- CI enforcement enabled: \`${readiness.ciEnforcementEnabled}\`
`
}

function validateRequiredInputs(options: GraphDeltaApplyReadinessOptions): void {
  if (!options.approvedState) {
    throw new Error('check-graph-delta-apply requires --approved-state <approvedStatePath>.')
  }
  if (!options.proposal) {
    throw new Error('check-graph-delta-apply requires --proposal <proposalPath>.')
  }
}

function validateBoundary(boundary: JsonRecord | null): void {
  if (!boundary) {
    return
  }
  if (boundary.artifactRole !== BOUNDARY_ROLE || boundary.status !== BOUNDARY_STATUS) {
    throw new Error(`Unsafe Graph Delta Apply boundary: expected ${BOUNDARY_ROLE}/${BOUNDARY_STATUS}.`)
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
      throw new Error(`Unsafe Graph Delta Apply boundary: ${field} must be false.`)
    }
  }
}

function validateApprovedState(approvedState: JsonRecord): void {
  if (approvedState.artifactRole !== APPROVED_STATE_ROLE) {
    throw new Error(
      `Unsafe Approved Proposal State input: artifactRole must be ${JSON.stringify(APPROVED_STATE_ROLE)}.`,
    )
  }
  if (
    approvedState.status !== 'devview-approved-proposal-state-created' &&
    approvedState.status !== 'devview-approved-proposal-state-blocked'
  ) {
    throw new Error('Unsafe Approved Proposal State input: status must be created or blocked preview.')
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
    if (approvedState[field] !== false) {
      throw new Error(`Unsafe Approved Proposal State boundary: ${field} must be false.`)
    }
  }
}

function validateApprovedStateProposalConsistency(
  root: string,
  approvedState: JsonRecord,
  proposal: JsonRecord,
  resolvedProposalPath: string,
): GraphDeltaApplyReadinessFinding[] {
  const findings: GraphDeltaApplyReadinessFinding[] = []
  const approvedProposalId = stringValue(approvedState.proposalId)
  const proposalId = stringValue(proposal.proposalId)
  if (approvedProposalId !== proposalId) {
    findings.push({
      code: 'GRAPH_DELTA_APPLY_PROPOSAL_ID_MISMATCH',
      severity: 'error',
      field: 'proposalId',
      expected: approvedProposalId,
      actual: proposalId,
      message: 'Approved Proposal State proposalId does not match the proposal under apply-readiness review.',
    })
  }

  const sourceProposal = stringValue(approvedState.sourceGraphDeltaProposal)
  const actualProposalPath = relativePath(root, resolvedProposalPath)
  if (sourceProposal !== actualProposalPath) {
    findings.push({
      code: 'GRAPH_DELTA_APPLY_PROPOSAL_PATH_MISMATCH',
      severity: 'error',
      field: 'sourceGraphDeltaProposal',
      expected: sourceProposal,
      actual: actualProposalPath,
      message: 'Approved Proposal State sourceGraphDeltaProposal does not match the proposal input path.',
    })
  }

  if (approvedState.approvedProposalStateCreated !== true) {
    findings.push({
      code: 'GRAPH_DELTA_APPLY_APPROVED_STATE_NOT_CREATED',
      severity: 'warning',
      field: 'approvedProposalStateCreated',
      expected: true,
      actual: approvedState.approvedProposalStateCreated,
      message: 'Approved Proposal State was not created, so graph delta apply readiness is blocked.',
    })
  }

  return findings
}

async function assertApplyReadinessOutputAuthority(
  root: string,
  input: {
    boundary: JsonRecord | null
    resolvedBoundaryPath?: string
    approvedState: JsonRecord
    resolvedApprovedStatePath: string
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
    throw new Error('Graph Delta Apply readiness output is unsafe: --output and --markdown must be different paths.')
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
        `Graph Delta Apply readiness ${label} path is unsafe: ${requested} would overwrite ${protectedReason}.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(resolved)
    if (existingAuthority) {
      throw new Error(
        `Graph Delta Apply readiness ${label} path is unsafe: ${requested} already contains ${existingAuthority}. Choose a dedicated apply-readiness output path.`,
      )
    }
  }
}

function buildProtectedPathMap(
  root: string,
  input: {
    boundary: JsonRecord | null
    resolvedBoundaryPath?: string
    approvedState: JsonRecord
    resolvedApprovedStatePath: string
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

  addResolved(input.resolvedBoundaryPath, 'the source Graph Delta Apply boundary')
  addResolved(input.resolvedApprovedStatePath, 'the source Approved Proposal State')
  addResolved(input.resolvedProposalPath, 'the source Graph Delta proposal')
  addConcrete(input.approvedState.sourceHumanDecisionRecord, 'the source Human Decision Record')
  addConcrete(input.approvedState.sourceHumanReviewPacket, 'the source Human Review Packet')

  for (const source of [input.boundary, input.approvedState, input.proposal]) {
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
  if (!artifactRole || artifactRole === READINESS_ROLE) {
    return null
  }
  if (
    artifactRole === BOUNDARY_ROLE ||
    artifactRole === APPROVED_STATE_ROLE ||
    artifactRole === PROPOSAL_ROLE ||
    artifactRole.includes('graph-source') ||
    artifactRole.includes('evidence') ||
    artifactRole.includes('read-model') ||
    [
      'devview-human-decision-record',
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
