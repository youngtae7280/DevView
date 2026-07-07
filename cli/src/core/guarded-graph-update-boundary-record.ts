import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'

type JsonRecord = Record<string, unknown>

const RECORD_ROLE = 'devview-guarded-graph-update-boundary-record'
const RUNTIME_ROLE = 'devview-runtime-evidence-satisfaction-record'
const RUNTIME_STATUS = 'devview-runtime-evidence-satisfaction-recorded'
const PROOF_ROLE = 'devview-equivalence-proof-record'
const PROOF_STATUS = 'devview-equivalence-proof-recorded'
const SCOPE_ROLE = 'devview-scope-ci-enforcement-record'
const SCOPE_STATUS = 'devview-scope-ci-enforcement-recorded'

const proposalRoles = new Set([
  'graph-delta-proposal-only-preview',
  'devview-graph-delta-proposal-preview',
  'devview-graph-update-proposal-preview',
])

const unsafeAuthorityFields = [
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

export interface GuardedGraphUpdateBoundaryRecordOptions {
  proposal: string
  runtimeEvidenceSatisfactionRecord: string
  equivalenceProofRecord: string
  scopeCiEnforcementRecord: string
  output?: string
  markdown?: string
}

export interface GuardedGraphUpdateBoundaryRecordFileResult {
  record: GuardedGraphUpdateBoundaryRecord
  outputPath?: string
  markdownReport?: string
}

export interface GuardedGraphUpdateBoundaryRecordFinding {
  code: string
  severity: 'info' | 'warning' | 'error'
  message: string
  field?: string
  expected?: unknown
  actual?: unknown
}

export interface GuardedGraphUpdateBoundaryRecord {
  schemaVersion: 1
  artifactRole: typeof RECORD_ROLE
  status: 'devview-guarded-graph-update-boundary-ready'
  guardedGraphUpdateBoundaryState: 'ready-for-future-guarded-graph-update-apply-command-no-mutation'
  boundaryKind: 'deterministic-guarded-graph-update-boundary-v1'
  sourceGraphDeltaProposal: string
  sourceRuntimeEvidenceSatisfactionRecord: string
  sourceEquivalenceProofRecord: string
  sourceScopeCiEnforcementRecord: string
  proposalId: string
  proposalArtifactRole: string
  proposalStatus: string
  operationSummary: {
    operationCount: number
    operationSourceField: string
    operationKinds: string[]
  }
  sourceRuntimeEvidenceSatisfactionReadiness: string
  sourceAcceptedEvidenceRecord: string
  sourceInstructionPack: string
  sourceContractInput: string | null
  sourceEvidenceArtifact: string
  sourceRuntimeEvidenceAuthority: string | null
  sourceEvidenceCheckBinding: string | null
  sourceOutputRequirement: string | null
  sourceRuntimeReport: string | null
  sourceScopeReport: string | null
  sourceGraphDeltaApplyReport: string | null
  sourceCheckReport: string | null
  requiredEvidenceId: string
  matchedRequiredEvidence: JsonRecord
  sourceEvidenceHash: string
  sourceEvidenceHashAlgorithm: 'sha256'
  chainComparisonStatus:
    | 'matched-known-provenance-fields'
    | 'matched-authority-record-chain-limited-proposal-provenance'
  chainComparisonLimitations: string[]
  guardedUpdateReady: true
  applyCommandEnabled: false
  applyDeferred: true
  graphDeltaApplied: false
  graphSourceMutated: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  requiredChecksConfigured: false
  branchProtectionChanged: false
  branchProtectionMutated: false
  requiredChecksMutated: false
  externalCiMutated: false
  diffRejectionEnabled: false
  diffRejectionActivated: false
  hooksActivated: false
  approvalAutomationEnabled: false
  userAcceptanceAutomated: false
  providerInvoked: false
  networkCallMade: false
  extensionExecutionAllowed: false
  extensionsExecuted: false
  shellCommandsExecuted: false
  filesMutated: false
  nonMutatingBoundary: true
  boundaryChecks: GuardedGraphUpdateBoundaryRecordFinding[]
  allowedUse: string[]
  forbiddenUse: string[]
  limitations: string[]
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  writtenOutputPathAuthorityStatus:
    | 'not-written-stdout-only'
    | 'explicit-guarded-graph-update-boundary-record-output-not-source-authority'
  markdownReportPath: string | null
  nonExecutionBoundary: string
}

interface ProposalInspection {
  proposalId: string
  artifactRole: string
  status: string
  operationCount: number
  operationSourceField: string
  operationKinds: string[]
}

interface ChainComparison {
  status: GuardedGraphUpdateBoundaryRecord['chainComparisonStatus']
  limitations: string[]
  checks: GuardedGraphUpdateBoundaryRecordFinding[]
}

export async function recordGuardedGraphUpdateBoundaryFile(
  root: string,
  options: GuardedGraphUpdateBoundaryRecordOptions,
): Promise<GuardedGraphUpdateBoundaryRecordFileResult> {
  validateRequiredInputs(options)

  const resolvedProposalPath = resolveRepoPath(root, options.proposal)
  const proposal = await readRequiredJson(resolvedProposalPath, 'Graph Delta proposal')
  const proposalInspection = validateProposal(proposal)

  const resolvedRuntimePath = resolveRepoPath(root, options.runtimeEvidenceSatisfactionRecord)
  const runtime = await readRequiredJson(resolvedRuntimePath, 'Runtime Evidence satisfaction record')
  validateRuntimeSatisfactionRecord(runtime)

  const resolvedProofPath = resolveRepoPath(root, options.equivalenceProofRecord)
  const proof = await readRequiredJson(resolvedProofPath, 'Equivalence Proof record')
  validateEquivalenceProofRecord(proof)

  const resolvedScopePath = resolveRepoPath(root, options.scopeCiEnforcementRecord)
  const scope = await readRequiredJson(resolvedScopePath, 'Scope/CI Enforcement record')
  validateScopeCiEnforcementRecord(scope)

  const chainComparison = compareSourceChain({ proposal, runtime, proof, scope })

  await assertGuardedGraphUpdateBoundaryOutputAuthority(root, {
    proposal,
    resolvedProposalPath,
    runtime,
    resolvedRuntimePath,
    proof,
    resolvedProofPath,
    scope,
    resolvedScopePath,
    output: options.output,
    markdown: options.markdown,
  })

  const record = buildGuardedGraphUpdateBoundaryRecord(root, {
    proposalInspection,
    resolvedProposalPath,
    runtime,
    resolvedRuntimePath,
    proof,
    resolvedProofPath,
    scope,
    resolvedScopePath,
    chainComparison,
  })

  let outputPath: string | undefined
  let markdownReport: string | undefined
  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    record.writtenOutputPath = outputPath
    record.writtenOutputPathAuthorityStatus =
      'explicit-guarded-graph-update-boundary-record-output-not-source-authority'
    await writeJsonAtomic(resolvedOutputPath, record)
  }
  if (options.markdown) {
    const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
    markdownReport = relativePath(root, resolvedMarkdownPath)
    record.markdownReportPath = markdownReport
    await writeTextAtomic(resolvedMarkdownPath, renderGuardedGraphUpdateBoundaryRecordMarkdown(record))
    if (options.output) {
      await writeJsonAtomic(resolveRepoPath(root, options.output), record)
    }
  }

  return { record, ...(outputPath ? { outputPath } : {}), ...(markdownReport ? { markdownReport } : {}) }
}

function buildGuardedGraphUpdateBoundaryRecord(
  root: string,
  input: {
    proposalInspection: ProposalInspection
    resolvedProposalPath: string
    runtime: JsonRecord
    resolvedRuntimePath: string
    proof: JsonRecord
    resolvedProofPath: string
    scope: JsonRecord
    resolvedScopePath: string
    chainComparison: ChainComparison
  },
): GuardedGraphUpdateBoundaryRecord {
  return {
    schemaVersion: 1,
    artifactRole: RECORD_ROLE,
    status: 'devview-guarded-graph-update-boundary-ready',
    guardedGraphUpdateBoundaryState: 'ready-for-future-guarded-graph-update-apply-command-no-mutation',
    boundaryKind: 'deterministic-guarded-graph-update-boundary-v1',
    sourceGraphDeltaProposal: relativePath(root, input.resolvedProposalPath),
    sourceRuntimeEvidenceSatisfactionRecord: relativePath(root, input.resolvedRuntimePath),
    sourceEquivalenceProofRecord: relativePath(root, input.resolvedProofPath),
    sourceScopeCiEnforcementRecord: relativePath(root, input.resolvedScopePath),
    proposalId: input.proposalInspection.proposalId,
    proposalArtifactRole: input.proposalInspection.artifactRole,
    proposalStatus: input.proposalInspection.status,
    operationSummary: {
      operationCount: input.proposalInspection.operationCount,
      operationSourceField: input.proposalInspection.operationSourceField,
      operationKinds: input.proposalInspection.operationKinds,
    },
    sourceRuntimeEvidenceSatisfactionReadiness: stringValue(input.runtime.sourceRuntimeEvidenceSatisfactionReadiness),
    sourceAcceptedEvidenceRecord: stringValue(input.runtime.sourceAcceptedEvidenceRecord),
    sourceInstructionPack: stringValue(input.runtime.sourceInstructionPack),
    sourceContractInput: nullableString(input.runtime.sourceContractInput),
    sourceEvidenceArtifact: stringValue(input.runtime.sourceEvidenceArtifact),
    sourceRuntimeEvidenceAuthority: nullableString(input.runtime.sourceRuntimeEvidenceAuthority),
    sourceEvidenceCheckBinding: nullableString(input.runtime.sourceEvidenceCheckBinding),
    sourceOutputRequirement: nullableString(input.runtime.sourceOutputRequirement),
    sourceRuntimeReport: nullableString(input.runtime.sourceRuntimeReport),
    sourceScopeReport: nullableString(input.runtime.sourceScopeReport),
    sourceGraphDeltaApplyReport: nullableString(input.runtime.sourceGraphDeltaApplyReport),
    sourceCheckReport: nullableString(input.runtime.sourceCheckReport),
    requiredEvidenceId: stringValue(input.runtime.requiredEvidenceId),
    matchedRequiredEvidence: asRecord(input.runtime.matchedRequiredEvidence) ?? {},
    sourceEvidenceHash: stringValue(input.runtime.sourceEvidenceHash),
    sourceEvidenceHashAlgorithm: 'sha256',
    chainComparisonStatus: input.chainComparison.status,
    chainComparisonLimitations: input.chainComparison.limitations,
    guardedUpdateReady: true,
    applyCommandEnabled: false,
    applyDeferred: true,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    requiredChecksConfigured: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    hooksActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    providerInvoked: false,
    networkCallMade: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    shellCommandsExecuted: false,
    filesMutated: false,
    nonMutatingBoundary: true,
    boundaryChecks: [
      {
        code: 'GUARDED_UPDATE_GRAPH_DELTA_PROPOSAL_INSPECTED',
        severity: 'info',
        field: input.proposalInspection.operationSourceField,
        message:
          'Graph Delta proposal role, status, no-mutation flags, and concrete proposed operations were revalidated before boundary recording.',
      },
      {
        code: 'GUARDED_UPDATE_RUNTIME_SATISFACTION_RECORD_REVALIDATED',
        severity: 'info',
        field: 'runtimeEvidenceSatisfactionRecord',
        message:
          'Actual Runtime Evidence Satisfaction record role, status, source hash, and no-downstream-authority boundary were revalidated.',
      },
      {
        code: 'GUARDED_UPDATE_EQUIVALENCE_PROOF_RECORD_REVALIDATED',
        severity: 'info',
        field: 'equivalenceProofRecord',
        message:
          'Actual Equivalence Proof record role, status, source hash, and no-enforcement boundary were revalidated.',
      },
      {
        code: 'GUARDED_UPDATE_SCOPE_CI_RECORD_REVALIDATED',
        severity: 'info',
        field: 'scopeCiEnforcementRecord',
        message:
          'Actual Scope/CI Enforcement record role, status, source chain, and external-mutation boundary were revalidated.',
      },
      ...input.chainComparison.checks,
    ],
    allowedUse: [
      'serve as deterministic pre-apply boundary input for a future guarded graph update apply command',
      'document that actual runtime satisfaction, equivalence proof, Scope/CI enforcement, and Graph Delta proposal inputs were revalidated together',
      'preserve source-chain comparison findings and proposal operation summary without mutating graph-source',
    ],
    forbiddenUse: [
      'graph-source mutation',
      'graph delta apply',
      'direct repository file mutation outside explicit outputs',
      'branch protection mutation',
      'required check configuration',
      'hook installation or activation',
      'global diff rejection',
      'runtime Evidence satisfaction creation',
      'Equivalence Proof creation',
      'Scope/CI Enforcement record creation',
      'Evidence acceptance creation',
      'extension execution',
      'provider or network invocation',
      'approval automation',
      'user acceptance automation',
    ],
    limitations: [
      'This record is a guarded graph update boundary only; the graph-source remains unchanged.',
      'The future apply command is explicitly deferred in this slice.',
      'Source-chain comparison is limited to provenance fields currently modeled by the input artifacts.',
    ],
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportPath: null,
    nonExecutionBoundary:
      'This Guarded Graph Update boundary record validates actual lifecycle records and a concrete Graph Delta proposal for future apply readiness. It does not apply graph deltas, mutate graph-source, mutate .github, configure branch protection or required checks, activate hooks, reject diffs globally, execute extensions or shell commands, call providers or networks, automate approval, or replace user acceptance.',
  }
}

function validateRequiredInputs(options: GuardedGraphUpdateBoundaryRecordOptions): void {
  if (!options.proposal) {
    throw new Error('record-guarded-graph-update-boundary requires --proposal <graphDeltaProposalJson>.')
  }
  if (!options.runtimeEvidenceSatisfactionRecord) {
    throw new Error(
      'record-guarded-graph-update-boundary requires --runtime-evidence-satisfaction-record <recordJson>.',
    )
  }
  if (!options.equivalenceProofRecord) {
    throw new Error('record-guarded-graph-update-boundary requires --equivalence-proof-record <recordJson>.')
  }
  if (!options.scopeCiEnforcementRecord) {
    throw new Error('record-guarded-graph-update-boundary requires --scope-ci-enforcement-record <recordJson>.')
  }
  if (!options.output) {
    throw new Error('record-guarded-graph-update-boundary requires --output <boundaryRecordJson>.')
  }
}

function validateProposal(proposal: JsonRecord): ProposalInspection {
  const artifactRole = stringValue(proposal.artifactRole)
  const schemaId = stringValue(proposal.schemaId)
  if (!proposalRoles.has(artifactRole) && schemaId !== 'devview-graph-update-proposal-v0') {
    throw new Error('Unsafe Graph Delta proposal: unsupported artifactRole/schemaId.')
  }
  for (const field of [
    'graphDeltaApplied',
    'graphSourceMutated',
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
    'hooksActivated',
    'providerInvoked',
    'networkCallMade',
    'approvalAutomationEnabled',
    'userAcceptanceAutomated',
  ]) {
    if (proposal[field] === true) {
      throw new Error(`Unsafe Graph Delta proposal: ${field} must be false.`)
    }
  }
  validateNoUnsafeAuthority(proposal, 'Graph Delta proposal')
  const operations = findProposalOperations(proposal)
  if (!operations || operations.values.length === 0) {
    throw new Error('Unsafe Graph Delta proposal: at least one concrete proposed operation is required.')
  }
  return {
    proposalId: stringValue(proposal.proposalId) || 'unknown-proposal',
    artifactRole,
    status: stringValue(proposal.status),
    operationCount: operations.values.length,
    operationSourceField: operations.field,
    operationKinds: collectOperationKinds(operations.values),
  }
}

function validateRuntimeSatisfactionRecord(record: JsonRecord): void {
  if (record.artifactRole !== RUNTIME_ROLE || record.status !== RUNTIME_STATUS) {
    throw new Error(`Unsafe Runtime Evidence satisfaction record: expected ${RUNTIME_ROLE}/${RUNTIME_STATUS}.`)
  }
  if (record.runtimeEvidenceSatisfactionState !== 'runtime-evidence-satisfied-for-explicit-obligation') {
    throw new Error('Unsafe Runtime Evidence satisfaction record: unsupported runtimeEvidenceSatisfactionState.')
  }
  if (record.satisfactionProvenanceStatus !== 'ready-binding-and-source-evidence-revalidated') {
    throw new Error('Unsafe Runtime Evidence satisfaction record: provenance is not revalidated.')
  }
  if (record.runtimeEvidenceSatisfied !== true) {
    throw new Error('Unsafe Runtime Evidence satisfaction record: runtimeEvidenceSatisfied must be true.')
  }
  for (const field of [
    'evidenceAccepted',
    'equivalenceProven',
    'scopeEnforced',
    'ciEnforcementEnabled',
    'graphSourceMutated',
    'graphDeltaApplied',
    'approvalAutomationEnabled',
    'userAcceptanceAutomated',
    'providerInvoked',
    'networkCallMade',
    'extensionExecutionAllowed',
    'extensionsExecuted',
    'shellCommandsExecuted',
  ]) {
    if (record[field] !== false) {
      throw new Error(`Unsafe Runtime Evidence satisfaction record: ${field} must be false.`)
    }
  }
  validateNoUnsafeAuthority(record, 'Runtime Evidence satisfaction record', new Set(['runtimeEvidenceSatisfied']))
  validateSharedSourceFields(record, 'Runtime Evidence satisfaction record')
}

function validateEquivalenceProofRecord(record: JsonRecord): void {
  if (record.artifactRole !== PROOF_ROLE || record.status !== PROOF_STATUS) {
    throw new Error(`Unsafe Equivalence Proof record: expected ${PROOF_ROLE}/${PROOF_STATUS}.`)
  }
  if (record.equivalenceProofState !== 'equivalence-proven-for-explicit-runtime-evidence-obligation') {
    throw new Error('Unsafe Equivalence Proof record: unsupported equivalenceProofState.')
  }
  if (record.proofProvenanceStatus !== 'runtime-satisfaction-record-and-policy-revalidated') {
    throw new Error('Unsafe Equivalence Proof record: proof provenance is not revalidated.')
  }
  if (record.equivalenceProven !== true) {
    throw new Error('Unsafe Equivalence Proof record: equivalenceProven must be true.')
  }
  for (const field of [
    'runtimeEvidenceSatisfied',
    'evidenceAccepted',
    'scopeEnforced',
    'ciEnforcementEnabled',
    'graphSourceMutated',
    'graphDeltaApplied',
    'approvalAutomationEnabled',
    'userAcceptanceAutomated',
    'providerInvoked',
    'networkCallMade',
    'extensionExecutionAllowed',
    'extensionsExecuted',
    'shellCommandsExecuted',
  ]) {
    if (record[field] !== false) {
      throw new Error(`Unsafe Equivalence Proof record: ${field} must be false.`)
    }
  }
  validateNoUnsafeAuthority(record, 'Equivalence Proof record', new Set(['equivalenceProven']))
  validateSharedSourceFields(record, 'Equivalence Proof record')
}

function validateScopeCiEnforcementRecord(record: JsonRecord): void {
  if (record.artifactRole !== SCOPE_ROLE || record.status !== SCOPE_STATUS) {
    throw new Error(`Unsafe Scope/CI Enforcement record: expected ${SCOPE_ROLE}/${SCOPE_STATUS}.`)
  }
  if (record.scopeCiEnforcementState !== 'scope-ci-enforcement-recorded-no-external-ci-mutation') {
    throw new Error('Unsafe Scope/CI Enforcement record: unsupported scopeCiEnforcementState.')
  }
  if (record.scopeEnforced !== true || record.ciEnforcementEnabled !== true) {
    throw new Error('Unsafe Scope/CI Enforcement record: scopeEnforced and ciEnforcementEnabled must be true.')
  }
  for (const field of [
    'runtimeEvidenceSatisfied',
    'evidenceAccepted',
    'equivalenceProven',
    'requiredChecksConfigured',
    'branchProtectionChanged',
    'branchProtectionMutated',
    'requiredChecksMutated',
    'externalCiMutated',
    'diffRejectionEnabled',
    'diffRejectionActivated',
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
  ]) {
    if (record[field] !== false) {
      throw new Error(`Unsafe Scope/CI Enforcement record: ${field} must be false.`)
    }
  }
  validateNoUnsafeAuthority(record, 'Scope/CI Enforcement record', new Set(['scopeEnforced', 'ciEnforcementEnabled']))
  validateSharedSourceFields(record, 'Scope/CI Enforcement record')
}

function validateSharedSourceFields(record: JsonRecord, label: string): void {
  for (const requiredField of [
    'sourceRuntimeEvidenceSatisfactionReadiness',
    'sourceAcceptedEvidenceRecord',
    'sourceInstructionPack',
    'sourceEvidenceArtifact',
    'requiredEvidenceId',
    'sourceEvidenceHash',
  ]) {
    if (!stringValue(record[requiredField])) {
      throw new Error(`Unsafe ${label}: missing ${requiredField}.`)
    }
  }
  if (
    record.sourceEvidenceHashAlgorithm !== 'sha256' ||
    !/^[a-f0-9]{64}$/.test(stringValue(record.sourceEvidenceHash))
  ) {
    throw new Error(`Unsafe ${label}: sourceEvidenceHash must be sha256.`)
  }
  if (!asRecord(record.matchedRequiredEvidence)) {
    throw new Error(`Unsafe ${label}: matchedRequiredEvidence is required.`)
  }
}

function compareSourceChain(input: {
  proposal: JsonRecord
  runtime: JsonRecord
  proof: JsonRecord
  scope: JsonRecord
}): ChainComparison {
  const checks: GuardedGraphUpdateBoundaryRecordFinding[] = []
  const limitations: string[] = []
  const records = [
    ['Runtime Evidence satisfaction record', input.runtime] as const,
    ['Equivalence Proof record', input.proof] as const,
    ['Scope/CI Enforcement record', input.scope] as const,
  ]
  const comparableFields = [
    'sourceRuntimeEvidenceSatisfactionReadiness',
    'sourceAcceptedEvidenceRecord',
    'sourceEvidenceArtifact',
    'sourceInstructionPack',
    'sourceContractInput',
    'sourceRuntimeEvidenceAuthority',
    'sourceEvidenceCheckBinding',
    'sourceOutputRequirement',
    'sourceRuntimeReport',
    'sourceScopeReport',
    'sourceGraphDeltaApplyReport',
    'sourceCheckReport',
    'requiredEvidenceId',
    'sourceEvidenceHash',
  ]

  for (const field of comparableFields) {
    const present = records
      .map(([label, record]) => ({ label, value: nullableString(record[field]) }))
      .filter((entry) => entry.value)
    if (present.length < 2) continue
    const expected = present[0]?.value
    const mismatch = present.find((entry) => entry.value !== expected)
    if (mismatch) {
      throw new Error(`Guarded Graph Update chain mismatch: ${field} differs on ${mismatch.label}.`)
    }
    checks.push({
      code: 'GUARDED_UPDATE_AUTHORITY_CHAIN_FIELD_MATCHED',
      severity: 'info',
      field,
      message: `${field} matches across actual authority records.`,
    })
  }

  const runtimeRequirement = asRecord(input.runtime.matchedRequiredEvidence)
  for (const [label, record] of records.slice(1)) {
    const requirement = asRecord(record.matchedRequiredEvidence)
    if (runtimeRequirement && requirement && JSON.stringify(runtimeRequirement) !== JSON.stringify(requirement)) {
      throw new Error(`Guarded Graph Update chain mismatch: matchedRequiredEvidence differs on ${label}.`)
    }
  }
  if (runtimeRequirement) {
    checks.push({
      code: 'GUARDED_UPDATE_MATCHED_REQUIRED_EVIDENCE_MATCHED',
      severity: 'info',
      field: 'matchedRequiredEvidence',
      message: 'matchedRequiredEvidence matches across actual authority records.',
    })
  }

  const proposalComparableFields = [
    'requiredEvidenceId',
    'sourceEvidenceHash',
    'sourceEvidenceArtifact',
    'sourceInstructionPack',
    'sourceContractInput',
    'sourceRuntimeEvidenceSatisfactionRecord',
    'sourceEquivalenceProofRecord',
    'sourceScopeCiEnforcementRecord',
  ]
  let proposalComparisons = 0
  for (const field of proposalComparableFields) {
    const proposalValue = nullableString(input.proposal[field])
    if (!proposalValue) continue
    proposalComparisons += 1
    const expected =
      field === 'sourceRuntimeEvidenceSatisfactionRecord'
        ? nullableString(input.proof.sourceRuntimeEvidenceSatisfactionRecord)
        : field === 'sourceEquivalenceProofRecord'
          ? nullableString(input.scope.sourceEquivalenceProofRecord)
          : field === 'sourceScopeCiEnforcementRecord'
            ? null
            : nullableString(input.runtime[field])
    if (expected && proposalValue !== expected) {
      throw new Error(`Guarded Graph Update proposal chain mismatch: ${field} differs from authority record chain.`)
    }
    checks.push({
      code: 'GUARDED_UPDATE_PROPOSAL_CHAIN_FIELD_MATCHED',
      severity: 'info',
      field,
      message: `${field} is comparable on the Graph Delta proposal and did not conflict with the authority chain.`,
    })
  }

  if (proposalComparisons === 0) {
    limitations.push('Graph Delta proposal did not expose comparable source-chain fields beyond concrete operations.')
  }

  return {
    status:
      proposalComparisons > 0
        ? 'matched-known-provenance-fields'
        : 'matched-authority-record-chain-limited-proposal-provenance',
    limitations,
    checks,
  }
}

async function assertGuardedGraphUpdateBoundaryOutputAuthority(
  root: string,
  input: {
    proposal: JsonRecord
    resolvedProposalPath: string
    runtime: JsonRecord
    resolvedRuntimePath: string
    proof: JsonRecord
    resolvedProofPath: string
    scope: JsonRecord
    resolvedScopePath: string
    output?: string
    markdown?: string
  },
): Promise<void> {
  const resolvedOutputPath = input.output ? resolveRepoPath(root, input.output) : undefined
  const resolvedMarkdownPath = input.markdown ? resolveRepoPath(root, input.markdown) : undefined
  if (resolvedOutputPath && resolvedMarkdownPath && pathKey(resolvedOutputPath) === pathKey(resolvedMarkdownPath)) {
    throw new Error('Guarded Graph Update boundary output is unsafe: --output and --markdown must differ.')
  }

  const protectedPaths = buildProtectedPathMap(root, input)
  for (const [label, requested, resolved] of [
    ['JSON output', input.output, resolvedOutputPath],
    ['Markdown output', input.markdown, resolvedMarkdownPath],
  ] as const) {
    if (!requested || !resolved) continue
    const protectedReason = protectedPaths.get(pathKey(resolved))
    if (protectedReason) {
      throw new Error(
        `Guarded Graph Update boundary ${label} path is unsafe: ${requested} would overwrite ${protectedReason}.`,
      )
    }
    if (isProtectedControlPath(root, resolved)) {
      throw new Error(
        `Guarded Graph Update boundary ${label} path is unsafe: ${requested} is inside a protected source/control path.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(resolved)
    if (existingAuthority) {
      throw new Error(
        `Guarded Graph Update boundary ${label} path is unsafe: ${requested} already contains ${existingAuthority}.`,
      )
    }
  }
}

function buildProtectedPathMap(
  root: string,
  input: {
    proposal: JsonRecord
    resolvedProposalPath: string
    runtime: JsonRecord
    resolvedRuntimePath: string
    proof: JsonRecord
    resolvedProofPath: string
    scope: JsonRecord
    resolvedScopePath: string
  },
): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const addResolved = (candidatePath: string | undefined | null, reason: string): void => {
    if (candidatePath && !protectedPaths.has(pathKey(candidatePath))) {
      protectedPaths.set(pathKey(candidatePath), reason)
    }
  }
  addResolved(input.resolvedProposalPath, 'the source Graph Delta proposal')
  addResolved(input.resolvedRuntimePath, 'the source Runtime Evidence satisfaction record')
  addResolved(input.resolvedProofPath, 'the source Equivalence Proof record')
  addResolved(input.resolvedScopePath, 'the source Scope/CI Enforcement record')
  for (const source of [input.proposal, input.runtime, input.proof, input.scope]) {
    for (const candidatePath of collectConcretePathStrings(source)) {
      addResolved(resolveRepoPath(root, candidatePath), `linked source artifact ${candidatePath}`)
    }
  }
  return protectedPaths
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) return null
  const record = asRecord(parsed.value)
  const artifactRole = stringValue(record?.artifactRole)
  if (!artifactRole) return null
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

export function renderGuardedGraphUpdateBoundaryRecordMarkdown(record: GuardedGraphUpdateBoundaryRecord): string {
  return `# DevView Guarded Graph Update Boundary Record

Status: \`${record.status}\`

| Field | Value |
| --- | --- |
| Boundary kind | \`${record.boundaryKind}\` |
| Guarded update ready | \`${record.guardedUpdateReady}\` |
| Apply command enabled | \`${record.applyCommandEnabled}\` |
| Apply deferred | \`${record.applyDeferred}\` |
| Proposal ID | \`${record.proposalId}\` |
| Operation count | \`${record.operationSummary.operationCount}\` |
| Chain comparison | \`${record.chainComparisonStatus}\` |
| Graph delta applied | \`${record.graphDeltaApplied}\` |
| Graph-source mutated | \`${record.graphSourceMutated}\` |

## Boundary

${record.nonExecutionBoundary}
`
}

function findProposalOperations(record: JsonRecord): { field: string; values: unknown[] } | null {
  for (const field of [
    'proposedOperations',
    'operations',
    'plannedChanges',
    'changes',
    'graphDeltaOperations',
    'proposedNodeUpdates',
  ]) {
    const candidate = record[field]
    if (Array.isArray(candidate) && candidate.length > 0) {
      return { field, values: candidate }
    }
  }
  return null
}

function collectOperationKinds(operations: unknown[]): string[] {
  const kinds = new Set<string>()
  for (const operation of operations) {
    const record = asRecord(operation)
    const kind =
      stringValue(record?.operationKind) ||
      stringValue(record?.kind) ||
      stringValue(record?.type) ||
      stringValue(record?.changeKind)
    kinds.add(kind || 'unspecified-operation')
  }
  return Array.from(kinds).sort()
}

function validateNoUnsafeAuthority(record: JsonRecord, label: string, allowedTrueFields = new Set<string>()): void {
  const hits = collectUnsafeAuthorityHits(record, [], new Set(), allowedTrueFields)
  if (hits.length > 0) {
    throw new Error(`Unsafe ${label}: ${hits[0].field} must not be true for Guarded Graph Update boundary input.`)
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

function collectConcretePathStrings(value: unknown, seen = new Set<unknown>()): string[] {
  if (typeof value === 'string') return isConcretePath(value) ? [value] : []
  if (typeof value !== 'object' || value === null || seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) return value.flatMap((entry) => collectConcretePathStrings(entry, seen))
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
    hasDevViewControlDirectory(relative) ||
    hasCodexControlDirectory(relative) ||
    hasHiddenControlDirectorySegment(relative) ||
    /^\.github\//i.test(relative) ||
    /(^|\/)(graph-source|source-authority|project-memory)(\.|-)/i.test(relative)
  )
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

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function nullableString(value: unknown): string | null {
  const text = stringValue(value)
  return text || null
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
