import path from 'node:path'
import { readJsonSafe, readTextSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'

type JsonRecord = Record<string, unknown>

const POLICY_ROLE = 'devview-evidence-acceptance-policy-boundary-preview'
const POLICY_STATUS = 'devview-evidence-acceptance-policy-boundary-previewed'
const READINESS_ROLE = 'devview-evidence-acceptance-readiness-preview'
const DECISION_RECORD_ROLE = 'devview-evidence-decision-record'
const HARDENING_STATUS = 'hardened-human-evidence-decision-record-v1'
const DEFAULT_DECISION_ACTOR_TYPE = 'human'
const DEFAULT_DECISION_SOURCE = 'explicit-cli-input'

type EvidenceDecisionKind = 'accept' | 'reject' | 'request-changes' | 'defer'
type DecisionSource = 'explicit-cli-input' | 'imported-human-review'
type DecisionTimestampAuthorityStatus = 'cli-provided' | 'runtime-generated'

const unsafeAuthorityFields = [
  'evidenceAccepted',
  'runtimeEvidenceSatisfied',
  'equivalenceProven',
  'scopeEnforced',
  'ciEnforcementEnabled',
  'graphSourceMutated',
  'graphDeltaApplied',
  'approvalAutomationEnabled',
  'acceptedEvidence',
  'candidateEvidenceAccepted',
]

export interface EvidenceDecisionRecordOptions {
  policy: string
  readiness?: string
  sourceEvidence: string
  decision: string
  reviewer: string
  rationale: string
  decisionActorType?: string
  decisionSource?: string
  decisionTimestamp?: string
  runtimeReport?: string
  scopeReport?: string
  applyReport?: string
  instructionPack?: string
  requestCandidate?: string
  proposal?: string
  output?: string
  markdown?: string
}

export interface EvidenceDecisionRecordFileResult {
  record: EvidenceDecisionRecord
  outputPath?: string
  markdownReport?: string
}

export interface EvidenceDecisionFinding {
  code: string
  severity: 'info' | 'warning' | 'error'
  message: string
  field?: string
  expected?: unknown
  actual?: unknown
}

export interface EvidenceDecisionRecord {
  schemaVersion: 1
  artifactRole: typeof DECISION_RECORD_ROLE
  status: 'devview-evidence-decision-recorded'
  recordScope: 'explicit-human-evidence-decision-record-preview-no-acceptance'
  decisionLifecycleHardeningStatus: typeof HARDENING_STATUS
  sourceEvidenceAcceptancePolicy: string
  sourceEvidenceAcceptanceReadiness: string | null
  sourceEvidenceArtifact: string
  sourceRuntimeReport: string | null
  sourceScopeReport: string | null
  sourceGraphDeltaApplyReport: string | null
  sourceInstructionPack: string | null
  sourceRequestCandidate: string | null
  sourceProposal: string | null
  evidenceKind: string
  evidenceClaim: string
  claimScope: 'candidate-evidence-review-only'
  sourceEvidenceArtifactRole: string | null
  sourceEvidenceStatus: string | null
  sourceEvidenceReadable: true
  sourceEvidenceJsonParsed: boolean
  decisionValue: string
  decisionKind: EvidenceDecisionKind
  decisionSummary: string
  decisionRationale: string
  decisionActorType: 'human'
  decisionActorLabel: string
  decisionSource: DecisionSource
  decisionTimestamp: string
  decisionTimestampAuthorityStatus: DecisionTimestampAuthorityStatus
  reviewerIdentity: string
  reviewedAt: string
  acceptedClaims: string[]
  rejectedClaims: string[]
  limitations: string[]
  selfAcceptanceCheckStatus: 'passed-human-actor'
  selfAcceptanceRejected: false
  evidenceDecisionRecorded: true
  acceptedEvidenceRecordCreated: false
  evidenceAccepted: false
  runtimeEvidenceSatisfied: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  graphSourceMutated: false
  graphDeltaApplied: false
  approvalAutomationEnabled: false
  codexSelfAcceptanceAllowed: false
  aiGeneratedAcceptanceAllowed: false
  validatorSelfAcceptanceAllowed: false
  ciSelfAcceptanceAllowed: false
  userAcceptanceAutomated: false
  allowedUse: string[]
  forbiddenUse: string[]
  validationFindings: EvidenceDecisionFinding[]
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-evidence-decision-output-not-source-authority'
  markdownReportPath: string | null
  nonExecutionBoundary: string
}

export async function recordEvidenceDecisionFile(
  root: string,
  options: EvidenceDecisionRecordOptions,
): Promise<EvidenceDecisionRecordFileResult> {
  validateRequiredInputs(options)
  validateDecisionAuthorityOptions(options)

  const resolvedPolicyPath = resolveRepoPath(root, options.policy)
  const policy = await readRequiredJson(resolvedPolicyPath, 'Evidence Acceptance Policy boundary')
  validatePolicy(policy)

  const resolvedReadinessPath = options.readiness ? resolveRepoPath(root, options.readiness) : undefined
  const readiness = resolvedReadinessPath
    ? await readRequiredJson(resolvedReadinessPath, 'Evidence Acceptance readiness')
    : null
  validateReadiness(readiness)

  const resolvedSourceEvidencePath = resolveRepoPath(root, options.sourceEvidence)
  const sourceEvidence = await readArtifactCandidate(resolvedSourceEvidencePath, 'source evidence artifact')
  validateSourceEvidence(sourceEvidence)

  const optionalSources = await readOptionalSources(root, options)

  await assertEvidenceDecisionOutputAuthority(root, {
    policy,
    resolvedPolicyPath,
    readiness,
    resolvedReadinessPath,
    sourceEvidence: sourceEvidence.record,
    resolvedSourceEvidencePath,
    optionalSources,
    output: options.output,
    markdown: options.markdown,
  })

  const record = buildEvidenceDecisionRecord(root, {
    resolvedPolicyPath,
    resolvedReadinessPath,
    resolvedSourceEvidencePath,
    sourceEvidence,
    optionalSources,
    options,
  })

  let outputPath: string | undefined
  let markdownReport: string | undefined
  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    record.writtenOutputPath = outputPath
    record.writtenOutputPathAuthorityStatus = 'explicit-evidence-decision-output-not-source-authority'
    await writeJsonAtomic(resolvedOutputPath, record)
  }
  if (options.markdown) {
    const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
    markdownReport = relativePath(root, resolvedMarkdownPath)
    record.markdownReportPath = markdownReport
    await writeTextAtomic(resolvedMarkdownPath, renderEvidenceDecisionMarkdown(record))
    if (options.output) {
      await writeJsonAtomic(resolveRepoPath(root, options.output), record)
    }
  }

  return { record, ...(outputPath ? { outputPath } : {}), ...(markdownReport ? { markdownReport } : {}) }
}

function buildEvidenceDecisionRecord(
  root: string,
  input: {
    resolvedPolicyPath: string
    resolvedReadinessPath?: string
    resolvedSourceEvidencePath: string
    sourceEvidence: ArtifactCandidate
    optionalSources: OptionalSourceSummary[]
    options: EvidenceDecisionRecordOptions
  },
): EvidenceDecisionRecord {
  const decision = normalizeDecision(input.options.decision)
  const timestamp = normalizeDecisionTimestamp(input.options.decisionTimestamp)
  const evidenceClaim = inferEvidenceClaim(input.sourceEvidence)
  const optionalPath = (kind: OptionalSourceKind): string | null =>
    input.optionalSources.find((source) => source.kind === kind)?.relativePath ?? null

  return {
    schemaVersion: 1,
    artifactRole: DECISION_RECORD_ROLE,
    status: 'devview-evidence-decision-recorded',
    recordScope: 'explicit-human-evidence-decision-record-preview-no-acceptance',
    decisionLifecycleHardeningStatus: HARDENING_STATUS,
    sourceEvidenceAcceptancePolicy: relativePath(root, input.resolvedPolicyPath),
    sourceEvidenceAcceptanceReadiness: input.resolvedReadinessPath
      ? relativePath(root, input.resolvedReadinessPath)
      : null,
    sourceEvidenceArtifact: relativePath(root, input.resolvedSourceEvidencePath),
    sourceRuntimeReport: optionalPath('runtimeReport'),
    sourceScopeReport: optionalPath('scopeReport'),
    sourceGraphDeltaApplyReport: optionalPath('applyReport'),
    sourceInstructionPack: optionalPath('instructionPack'),
    sourceRequestCandidate: optionalPath('requestCandidate'),
    sourceProposal: optionalPath('proposal'),
    evidenceKind: inferEvidenceKind(input.sourceEvidence),
    evidenceClaim,
    claimScope: 'candidate-evidence-review-only',
    sourceEvidenceArtifactRole: input.sourceEvidence.artifactRole,
    sourceEvidenceStatus: input.sourceEvidence.status,
    sourceEvidenceReadable: true,
    sourceEvidenceJsonParsed: Boolean(input.sourceEvidence.record),
    decisionValue: input.options.decision.trim(),
    decisionKind: decision.kind,
    decisionSummary: summaryForDecision(decision.kind),
    decisionRationale: input.options.rationale.trim(),
    decisionActorType: 'human',
    decisionActorLabel: input.options.reviewer.trim(),
    decisionSource: normalizeDecisionSource(input.options.decisionSource),
    decisionTimestamp: timestamp.value,
    decisionTimestampAuthorityStatus: timestamp.authority,
    reviewerIdentity: input.options.reviewer.trim(),
    reviewedAt: timestamp.value,
    acceptedClaims: [],
    rejectedClaims: decision.kind === 'reject' ? [evidenceClaim] : [],
    limitations:
      decision.kind === 'request-changes' || decision.kind === 'defer' ? [input.options.rationale.trim()] : [],
    selfAcceptanceCheckStatus: 'passed-human-actor',
    selfAcceptanceRejected: false,
    evidenceDecisionRecorded: true,
    acceptedEvidenceRecordCreated: false,
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalAutomationEnabled: false,
    codexSelfAcceptanceAllowed: false,
    aiGeneratedAcceptanceAllowed: false,
    validatorSelfAcceptanceAllowed: false,
    ciSelfAcceptanceAllowed: false,
    userAcceptanceAutomated: false,
    allowedUse: [
      'record explicit human evidence review intent',
      'preserve source evidence provenance for a future accepted-evidence record command',
      'document accept, reject, request-changes, or defer evidence decisions without accepting evidence',
    ],
    forbiddenUse: [
      'accepted Evidence record',
      'runtime Evidence satisfaction',
      'equivalence proof',
      'scope enforcement',
      'CI required check',
      'branch protection mutation',
      'graph-source mutation',
      'graph delta apply',
      'approval automation',
      'user acceptance automation',
      'inference of acceptance from runtime reports, validators, CI, smoke, scope checks, apply reports, Codex, or AI',
    ],
    validationFindings: [
      {
        code: 'EVIDENCE_DECISION_RECORD_NOT_ACCEPTED_EVIDENCE',
        severity: 'info',
        message:
          'This hardened human evidence decision record does not create accepted Evidence and does not satisfy runtime Evidence.',
      },
    ],
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportPath: null,
    nonExecutionBoundary:
      'This Evidence Decision Record command records a human evidence decision only. It does not create accepted Evidence, satisfy runtime Evidence, prove equivalence, enforce scope, configure CI or required checks, apply graph deltas, mutate graph-source, automate approval, or replace user acceptance.',
  }
}

function validateRequiredInputs(options: EvidenceDecisionRecordOptions): void {
  if (!options.policy) {
    throw new Error('record-evidence-decision requires --policy <policyBoundaryPath>.')
  }
  if (!options.sourceEvidence) {
    throw new Error('record-evidence-decision requires --source-evidence <evidenceCandidateArtifact>.')
  }
  if (!options.decision) {
    throw new Error(
      'record-evidence-decision requires --decision <accept-evidence|reject-evidence|request-changes|defer>.',
    )
  }
  normalizeDecision(options.decision)
  if (!options.reviewer || options.reviewer.trim().length === 0) {
    throw new Error('record-evidence-decision requires --reviewer <humanReviewerIdentity>.')
  }
  if (!options.rationale || options.rationale.trim().length === 0) {
    throw new Error('record-evidence-decision requires --rationale <humanAuthoredRationale>.')
  }
  if (!options.output) {
    throw new Error('record-evidence-decision requires --output <decisionRecordJson>.')
  }
  validateHumanLabel(options.reviewer, 'reviewer')
}

function validateDecisionAuthorityOptions(options: EvidenceDecisionRecordOptions): void {
  const actorType = normalizeDecisionActorType(options.decisionActorType)
  if (actorType !== DEFAULT_DECISION_ACTOR_TYPE) {
    throw new Error('Unsafe evidence decision actor type: --decision-actor-type must be "human".')
  }
  normalizeDecisionSource(options.decisionSource)
  normalizeDecisionTimestamp(options.decisionTimestamp)
}

function validateHumanLabel(value: string, label: string): void {
  const normalized = value.toLowerCase()
  for (const forbidden of ['codex', 'ai', 'assistant', 'bot', 'automation', 'tool', 'validator', 'ci', 'generated']) {
    if (normalized.includes(forbidden)) {
      throw new Error(`Unsafe ${label} identity: ${label} must be human-provided and cannot contain "${forbidden}".`)
    }
  }
}

function validatePolicy(policy: JsonRecord): void {
  if (policy.artifactRole !== POLICY_ROLE || policy.status !== POLICY_STATUS) {
    throw new Error(`Unsafe Evidence Acceptance Policy boundary: expected ${POLICY_ROLE}/${POLICY_STATUS}.`)
  }
  validateNoTopLevelUnsafeAuthority(policy, 'Evidence Acceptance Policy boundary')
}

function validateReadiness(readiness: JsonRecord | null): void {
  if (!readiness) {
    return
  }
  if (readiness.artifactRole !== READINESS_ROLE) {
    throw new Error(
      `Unsafe Evidence Acceptance readiness input: artifactRole must be ${JSON.stringify(READINESS_ROLE)}.`,
    )
  }
  if (
    readiness.status !== 'devview-evidence-acceptance-readiness-ready' &&
    readiness.status !== 'devview-evidence-acceptance-readiness-blocked'
  ) {
    throw new Error('Unsafe Evidence Acceptance readiness input: status must be ready or blocked preview.')
  }
  validateNoUnsafeAuthority(readiness, 'Evidence Acceptance readiness')
}

function validateSourceEvidence(sourceEvidence: ArtifactCandidate): void {
  if (!sourceEvidence.record) {
    return
  }
  const role = sourceEvidence.artifactRole ?? ''
  if (role.includes('source-authority') || role === 'graph-source' || role === 'devview-project-memory-preview') {
    throw new Error(`Unsafe source evidence artifactRole: ${role} cannot be accepted as evidence candidate input.`)
  }
  if (asRecord(sourceEvidence.record.sourceRecords)) {
    throw new Error('Unsafe source evidence artifact: graph-source-shaped sourceRecords cannot be evidence input.')
  }
  validateNoUnsafeAuthority(sourceEvidence.record, 'source evidence artifact')
}

function validateNoUnsafeAuthority(record: JsonRecord, label: string): void {
  const hits = collectUnsafeAuthorityHits(record)
  if (hits.length > 0) {
    const first = hits[0]
    throw new Error(`Unsafe ${label}: ${first.field} must not be true for Evidence Decision Record.`)
  }
}

function validateNoTopLevelUnsafeAuthority(record: JsonRecord, label: string): void {
  for (const field of unsafeAuthorityFields) {
    if (record[field] === true) {
      throw new Error(`Unsafe ${label}: ${field} must not be true for Evidence Decision Record.`)
    }
  }
}

function collectUnsafeAuthorityHits(
  value: unknown,
  pathParts: string[] = [],
  seen = new Set<unknown>(),
): Array<{ field: string }> {
  if (typeof value !== 'object' || value === null || seen.has(value)) {
    return []
  }
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectUnsafeAuthorityHits(entry, [...pathParts, String(index)], seen))
  }
  const record = value as JsonRecord
  const hits: Array<{ field: string }> = []
  for (const [key, entry] of Object.entries(record)) {
    const nextPath = [...pathParts, key]
    if (unsafeAuthorityFields.includes(key) && entry === true) {
      hits.push({ field: nextPath.join('.') })
    }
    hits.push(...collectUnsafeAuthorityHits(entry, nextPath, seen))
  }
  return hits
}

type OptionalSourceKind =
  | 'runtimeReport'
  | 'scopeReport'
  | 'applyReport'
  | 'instructionPack'
  | 'requestCandidate'
  | 'proposal'

interface OptionalSourceSummary {
  kind: OptionalSourceKind
  relativePath: string
  record: JsonRecord | null
}

async function readOptionalSources(
  root: string,
  options: EvidenceDecisionRecordOptions,
): Promise<OptionalSourceSummary[]> {
  const inputs: Array<[OptionalSourceKind, string | undefined]> = [
    ['runtimeReport', options.runtimeReport],
    ['scopeReport', options.scopeReport],
    ['applyReport', options.applyReport],
    ['instructionPack', options.instructionPack],
    ['requestCandidate', options.requestCandidate],
    ['proposal', options.proposal],
  ]
  const sources: OptionalSourceSummary[] = []
  for (const [kind, sourcePath] of inputs) {
    if (!sourcePath) {
      continue
    }
    const resolvedPath = resolveRepoPath(root, sourcePath)
    const candidate = await readArtifactCandidate(resolvedPath, `${kind} input`)
    if (candidate.record) {
      validateNoUnsafeAuthority(candidate.record, `${kind} input`)
    }
    sources.push({ kind, relativePath: relativePath(root, resolvedPath), record: candidate.record })
  }
  return sources
}

interface ArtifactCandidate {
  record: JsonRecord | null
  text: string
  artifactRole: string | null
  status: string | null
}

async function readArtifactCandidate(filePath: string, label: string): Promise<ArtifactCandidate> {
  const text = await readTextSafe(filePath)
  if (!text.ok) {
    throw new Error(`Unable to read ${label}: ${text.error}`)
  }
  const parsed = await readJsonSafe<unknown>(filePath)
  if (!parsed.ok) {
    return {
      record: null,
      text: text.value,
      artifactRole: null,
      status: null,
    }
  }
  const record = asRecord(parsed.value)
  if (!record) {
    return {
      record: null,
      text: text.value,
      artifactRole: null,
      status: null,
    }
  }
  return {
    record,
    text: text.value,
    artifactRole: stringValue(record.artifactRole) || null,
    status: stringValue(record.status) || stringValue(record.requestIrCandidateStatus) || null,
  }
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

async function assertEvidenceDecisionOutputAuthority(
  root: string,
  input: {
    policy: JsonRecord
    resolvedPolicyPath: string
    readiness: JsonRecord | null
    resolvedReadinessPath?: string
    sourceEvidence: JsonRecord | null
    resolvedSourceEvidencePath: string
    optionalSources: OptionalSourceSummary[]
    output?: string
    markdown?: string
  },
): Promise<void> {
  const resolvedOutputPath = input.output ? resolveRepoPath(root, input.output) : undefined
  const resolvedMarkdownPath = input.markdown ? resolveRepoPath(root, input.markdown) : undefined
  if (resolvedOutputPath && resolvedMarkdownPath && pathKey(resolvedOutputPath) === pathKey(resolvedMarkdownPath)) {
    throw new Error('Evidence Decision Record output is unsafe: --output and --markdown must be different paths.')
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
        `Evidence Decision Record ${label} path is unsafe: ${requested} would overwrite ${protectedReason}.`,
      )
    }
    if (isProtectedControlPath(root, resolved)) {
      throw new Error(
        `Evidence Decision Record ${label} path is unsafe: ${requested} is inside a protected source/control path.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(resolved)
    if (existingAuthority) {
      throw new Error(
        `Evidence Decision Record ${label} path is unsafe: ${requested} already contains ${existingAuthority}. Choose a dedicated evidence decision output path.`,
      )
    }
  }
}

function buildProtectedPathMap(
  root: string,
  input: {
    policy: JsonRecord
    resolvedPolicyPath: string
    readiness: JsonRecord | null
    resolvedReadinessPath?: string
    sourceEvidence: JsonRecord | null
    resolvedSourceEvidencePath: string
    optionalSources: OptionalSourceSummary[]
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
    if (!isConcretePath(candidatePath)) {
      return
    }
    addResolved(resolveRepoPath(root, candidatePath), reason)
  }

  addResolved(input.resolvedPolicyPath, 'the source Evidence Acceptance Policy boundary')
  addResolved(input.resolvedReadinessPath, 'the source Evidence Acceptance readiness')
  addResolved(input.resolvedSourceEvidencePath, 'the source evidence artifact')
  for (const optionalSource of input.optionalSources) {
    addResolved(resolveRepoPath(root, optionalSource.relativePath), `the source ${optionalSource.kind} artifact`)
  }
  for (const source of [
    input.policy,
    input.readiness,
    input.sourceEvidence,
    ...input.optionalSources.map((entry) => entry.record),
  ]) {
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
  if (!artifactRole || artifactRole === DECISION_RECORD_ROLE) {
    return null
  }
  if (
    artifactRole.includes('evidence') ||
    artifactRole.includes('graph-source') ||
    artifactRole.includes('read-model') ||
    artifactRole.includes('source-authority') ||
    [
      'devview-graph-delta-apply-report',
      'devview-approved-apply-dry-run-report',
      'devview-human-decision-record',
      'devview-approved-proposal-state-preview',
      'devview-graph-source-mutation-readiness-preview',
      'graph-delta-proposal-only-preview',
      'graph-delta-human-review-packet',
      'instruction-pack',
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

function normalizeDecision(value: string): { value: string; kind: EvidenceDecisionKind } {
  const trimmed = value.trim()
  if (trimmed === 'accept-evidence') {
    return { value: trimmed, kind: 'accept' }
  }
  if (trimmed === 'reject-evidence') {
    return { value: trimmed, kind: 'reject' }
  }
  if (trimmed === 'request-changes') {
    return { value: trimmed, kind: 'request-changes' }
  }
  if (trimmed === 'defer') {
    return { value: trimmed, kind: 'defer' }
  }
  throw new Error(`Unsafe evidence decision value: ${JSON.stringify(value)} is not recognized.`)
}

function normalizeDecisionActorType(value: string | undefined): string {
  return (value ?? DEFAULT_DECISION_ACTOR_TYPE).trim().toLowerCase()
}

function normalizeDecisionSource(value: string | undefined): DecisionSource {
  const source = (value ?? DEFAULT_DECISION_SOURCE).trim()
  if (source === 'explicit-cli-input' || source === 'imported-human-review') {
    return source
  }
  throw new Error(
    'Unsafe evidence decision source: --decision-source must be one of explicit-cli-input or imported-human-review.',
  )
}

function normalizeDecisionTimestamp(value: string | undefined): {
  value: string
  authority: DecisionTimestampAuthorityStatus
} {
  if (!value) {
    return { value: new Date().toISOString(), authority: 'runtime-generated' }
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Unsafe evidence decision timestamp: --decision-timestamp must be a valid ISO8601 timestamp.')
  }
  return { value: parsed.toISOString(), authority: 'cli-provided' }
}

function summaryForDecision(kind: EvidenceDecisionKind): string {
  if (kind === 'accept') {
    return 'Human evidence acceptance decision recorded; accepted Evidence record is not created in this slice.'
  }
  if (kind === 'reject') {
    return 'Human evidence rejection decision recorded without accepting Evidence.'
  }
  if (kind === 'request-changes') {
    return 'Human evidence change request recorded without accepting Evidence.'
  }
  return 'Human evidence decision deferred without accepting Evidence.'
}

function inferEvidenceKind(sourceEvidence: ArtifactCandidate): string {
  if (sourceEvidence.artifactRole) {
    return `${sourceEvidence.artifactRole}-candidate`
  }
  return sourceEvidence.record ? 'json-evidence-candidate' : 'text-evidence-candidate'
}

function inferEvidenceClaim(sourceEvidence: ArtifactCandidate): string {
  const record = sourceEvidence.record
  if (record) {
    const role = stringValue(record.artifactRole) || 'json-artifact'
    const status = stringValue(record.status) || stringValue(record.requestIrCandidateStatus) || 'status-unspecified'
    return `${role} with status ${status} is reviewed as candidate evidence only.`
  }
  const preview = sourceEvidence.text.replace(/\s+/g, ' ').trim().slice(0, 80)
  return preview ? `Text evidence candidate reviewed: ${preview}` : 'Text evidence candidate reviewed.'
}

function renderEvidenceDecisionMarkdown(record: EvidenceDecisionRecord): string {
  return `# DevView Evidence Decision Record

Status: \`${record.status}\`

- Decision: \`${record.decisionValue}\`
- Decision kind: \`${record.decisionKind}\`
- Source evidence: \`${record.sourceEvidenceArtifact}\`
- Evidence kind: \`${record.evidenceKind}\`
- Evidence accepted: \`${record.evidenceAccepted}\`
- Runtime Evidence satisfied: \`${record.runtimeEvidenceSatisfied}\`
- Accepted evidence record created: \`${record.acceptedEvidenceRecordCreated}\`
- Equivalence proven: \`${record.equivalenceProven}\`
- Scope enforced: \`${record.scopeEnforced}\`
- CI enforcement enabled: \`${record.ciEnforcementEnabled}\`

## Rationale

${record.decisionRationale}

## Safety Boundary

- This is a human evidence decision record only.
- It is not an accepted Evidence record.
- It does not satisfy runtime Evidence, prove equivalence, enforce scope, configure CI, apply graph deltas, mutate graph-source, automate approval, or replace user acceptance.
`
}

function collectConcretePathStrings(value: unknown, seen = new Set<unknown>()): string[] {
  if (typeof value === 'string') {
    return isConcretePath(value) ? [value] : []
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

function isConcretePath(value: string): boolean {
  return (
    value.includes('/') ||
    value.includes('\\') ||
    value.startsWith('.') ||
    value.endsWith('.json') ||
    value.endsWith('.md') ||
    value.endsWith('.txt')
  )
}

function isProtectedControlPath(root: string, filePath: string): boolean {
  const relative = relativePath(root, filePath)
  return (
    relative.startsWith('.pbe/') ||
    relative.startsWith('.codex/') ||
    relative.includes('/.pbe/') ||
    relative.includes('/.codex/') ||
    /\.codex\/hooks/i.test(relative) ||
    /(^|\/)(graph-source|source-authority|project-memory)(\.|-)/i.test(relative)
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
