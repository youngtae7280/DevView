import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'

type JsonRecord = Record<string, unknown>

const READINESS_ROLE = 'devview-scope-ci-enforcement-readiness-preview'
const READINESS_STATUS = 'devview-scope-ci-enforcement-readiness-ready'
const PROOF_ROLE = 'devview-equivalence-proof-record'
const PROOF_STATUS = 'devview-equivalence-proof-recorded'
const RECORD_ROLE = 'devview-scope-ci-enforcement-record'

const unsafeAuthorityFields = [
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
  'equivalenceProven',
  'runtimeEvidenceSatisfied',
  'evidenceAccepted',
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

export interface ScopeCiEnforcementRecordOptions {
  scopeCiEnforcementReadiness: string
  equivalenceProofRecord: string
  output?: string
  markdown?: string
}

export interface ScopeCiEnforcementRecordFileResult {
  record: ScopeCiEnforcementRecord
  outputPath?: string
  markdownReport?: string
}

export interface ScopeCiEnforcementRecordFinding {
  code: string
  severity: 'info' | 'warning' | 'error'
  message: string
  field?: string
  expected?: unknown
  actual?: unknown
}

export interface ScopeCiEnforcementRecord {
  schemaVersion: 1
  artifactRole: typeof RECORD_ROLE
  status: 'devview-scope-ci-enforcement-recorded'
  scopeCiEnforcementState: 'scope-ci-enforcement-recorded-no-external-ci-mutation'
  enforcementKind: 'deterministic-scope-ci-record-v1'
  enforcementActivationScope: 'devview-record-only-no-external-ci-mutation'
  sourceScopeCiEnforcementReadiness: string
  sourceEquivalenceProofRecord: string
  sourceEquivalenceProofReadiness: string | null
  sourceRuntimeEvidenceSatisfactionRecord: string
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
  acceptedEvidenceClaim: string
  acceptedEvidenceKind: string
  sourceEvidenceHash: string
  sourceEvidenceHashAlgorithm: 'sha256'
  scopeCiEnforcementReadinessStatus: string
  proofProvenanceStatus: string
  chainComparisonStatus: 'matched-known-provenance-fields' | 'limited-no-comparable-provenance-fields'
  chainComparisonLimitations: string[]
  scopeEnforced: true
  ciEnforcementEnabled: true
  requiredChecksConfigured: false
  branchProtectionChanged: false
  branchProtectionMutated: false
  requiredChecksMutated: false
  externalCiMutated: false
  diffRejectionEnabled: false
  diffRejectionActivated: false
  strictModeEnabled: false
  guidedEnforcementEnabled: false
  hooksActivated: false
  equivalenceProven: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  graphSourceMutated: false
  graphDeltaApplied: false
  approvalAutomationEnabled: false
  userAcceptanceAutomated: false
  providerInvoked: false
  networkCallMade: false
  extensionExecutionAllowed: false
  extensionsExecuted: false
  shellCommandsExecuted: false
  filesMutated: false
  filesMutatedOutsideExplicitOutputs: false
  nonEnforcing: false
  externalSystemsMutated: false
  recordOnlyExternalMutationBoundary: true
  enforcementChecks: ScopeCiEnforcementRecordFinding[]
  allowedUse: string[]
  forbiddenUse: string[]
  limitations: string[]
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  writtenOutputPathAuthorityStatus:
    | 'not-written-stdout-only'
    | 'explicit-scope-ci-enforcement-record-output-not-source-authority'
  markdownReportPath: string | null
  nonExecutionBoundary: string
}

interface ChainComparison {
  status: ScopeCiEnforcementRecord['chainComparisonStatus']
  limitations: string[]
  checks: ScopeCiEnforcementRecordFinding[]
}

export async function recordScopeCiEnforcementFile(
  root: string,
  options: ScopeCiEnforcementRecordOptions,
): Promise<ScopeCiEnforcementRecordFileResult> {
  validateRequiredInputs(options)

  const resolvedReadinessPath = resolveRepoPath(root, options.scopeCiEnforcementReadiness)
  const readiness = await readRequiredJson(resolvedReadinessPath, 'Scope/CI Enforcement readiness')
  validateScopeCiReadiness(readiness)

  const resolvedProofPath = resolveRepoPath(root, options.equivalenceProofRecord)
  const proof = await readRequiredJson(resolvedProofPath, 'Equivalence Proof record')
  validateEquivalenceProofRecord(proof)

  const chainComparison = compareReadinessAndProof(readiness, proof)

  await assertScopeCiEnforcementRecordOutputAuthority(root, {
    readiness,
    resolvedReadinessPath,
    proof,
    resolvedProofPath,
    output: options.output,
    markdown: options.markdown,
  })

  const record = buildScopeCiEnforcementRecord(root, {
    readiness,
    resolvedReadinessPath,
    proof,
    resolvedProofPath,
    chainComparison,
  })

  let outputPath: string | undefined
  let markdownReport: string | undefined
  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    record.writtenOutputPath = outputPath
    record.writtenOutputPathAuthorityStatus = 'explicit-scope-ci-enforcement-record-output-not-source-authority'
    await writeJsonAtomic(resolvedOutputPath, record)
  }
  if (options.markdown) {
    const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
    markdownReport = relativePath(root, resolvedMarkdownPath)
    record.markdownReportPath = markdownReport
    await writeTextAtomic(resolvedMarkdownPath, renderScopeCiEnforcementRecordMarkdown(record))
    if (options.output) {
      await writeJsonAtomic(resolveRepoPath(root, options.output), record)
    }
  }

  return { record, ...(outputPath ? { outputPath } : {}), ...(markdownReport ? { markdownReport } : {}) }
}

function buildScopeCiEnforcementRecord(
  root: string,
  input: {
    readiness: JsonRecord
    resolvedReadinessPath: string
    proof: JsonRecord
    resolvedProofPath: string
    chainComparison: ChainComparison
  },
): ScopeCiEnforcementRecord {
  return {
    schemaVersion: 1,
    artifactRole: RECORD_ROLE,
    status: 'devview-scope-ci-enforcement-recorded',
    scopeCiEnforcementState: 'scope-ci-enforcement-recorded-no-external-ci-mutation',
    enforcementKind: 'deterministic-scope-ci-record-v1',
    enforcementActivationScope: 'devview-record-only-no-external-ci-mutation',
    sourceScopeCiEnforcementReadiness: relativePath(root, input.resolvedReadinessPath),
    sourceEquivalenceProofRecord: relativePath(root, input.resolvedProofPath),
    sourceEquivalenceProofReadiness: nullableString(input.readiness.sourceEquivalenceProofReadiness),
    sourceRuntimeEvidenceSatisfactionRecord: stringValue(input.proof.sourceRuntimeEvidenceSatisfactionRecord),
    sourceRuntimeEvidenceSatisfactionReadiness: stringValue(input.proof.sourceRuntimeEvidenceSatisfactionReadiness),
    sourceAcceptedEvidenceRecord: stringValue(input.proof.sourceAcceptedEvidenceRecord),
    sourceInstructionPack: stringValue(input.proof.sourceInstructionPack),
    sourceContractInput: nullableString(input.proof.sourceContractInput),
    sourceEvidenceArtifact: stringValue(input.proof.sourceEvidenceArtifact),
    sourceRuntimeEvidenceAuthority: nullableString(input.proof.sourceRuntimeEvidenceAuthority),
    sourceEvidenceCheckBinding: nullableString(input.proof.sourceEvidenceCheckBinding),
    sourceOutputRequirement: nullableString(input.proof.sourceOutputRequirement),
    sourceRuntimeReport: nullableString(input.proof.sourceRuntimeReport),
    sourceScopeReport: nullableString(input.proof.sourceScopeReport),
    sourceGraphDeltaApplyReport: nullableString(input.proof.sourceGraphDeltaApplyReport),
    sourceCheckReport: nullableString(input.proof.sourceCheckReport),
    requiredEvidenceId: stringValue(input.proof.requiredEvidenceId),
    matchedRequiredEvidence: asRecord(input.proof.matchedRequiredEvidence) ?? {},
    acceptedEvidenceClaim: stringValue(input.proof.acceptedEvidenceClaim),
    acceptedEvidenceKind: stringValue(input.proof.acceptedEvidenceKind),
    sourceEvidenceHash: stringValue(input.proof.sourceEvidenceHash),
    sourceEvidenceHashAlgorithm: 'sha256',
    scopeCiEnforcementReadinessStatus: stringValue(input.readiness.scopeCiEnforcementReadinessStatus),
    proofProvenanceStatus: stringValue(input.proof.proofProvenanceStatus),
    chainComparisonStatus: input.chainComparison.status,
    chainComparisonLimitations: input.chainComparison.limitations,
    scopeEnforced: true,
    ciEnforcementEnabled: true,
    requiredChecksConfigured: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    hooksActivated: false,
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    providerInvoked: false,
    networkCallMade: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    shellCommandsExecuted: false,
    filesMutated: false,
    filesMutatedOutsideExplicitOutputs: false,
    nonEnforcing: false,
    externalSystemsMutated: false,
    recordOnlyExternalMutationBoundary: true,
    enforcementChecks: [
      {
        code: 'SCOPE_CI_READY_SOURCE_REVALIDATED',
        severity: 'info',
        field: 'scopeCiEnforcementReadiness',
        message:
          'Scope/CI readiness role, status, ready lifecycle state, and non-mutating preview boundary were revalidated before recording DevView enforcement.',
      },
      {
        code: 'SCOPE_CI_EQUIVALENCE_PROOF_RECORD_REVALIDATED',
        severity: 'info',
        field: 'equivalenceProofRecord',
        message:
          'Actual Equivalence Proof record role, status, proof state, source hash, and non-enforcement boundary were revalidated.',
      },
      ...input.chainComparison.checks,
    ],
    allowedUse: [
      'record that DevView Scope/CI enforcement lifecycle has been activated for the validated source chain',
      'serve as source input for future external CI or branch-protection configuration proposal commands',
      'preserve proof, runtime Evidence, accepted Evidence, instruction pack, and source Evidence provenance for audit',
    ],
    forbiddenUse: [
      'direct branch protection mutation',
      'direct CI provider mutation',
      'required check configuration',
      'hook installation or activation',
      'global diff rejection',
      'strict or guided blocking activation outside this record',
      'graph-source mutation',
      'graph delta apply',
      'runtime Evidence satisfaction creation',
      'Equivalence Proof creation',
      'Evidence acceptance creation',
      'extension execution',
      'provider or network invocation',
      'approval automation',
      'user acceptance automation',
    ],
    limitations: [
      'This record activates DevView Scope/CI enforcement lifecycle state only.',
      'This record does not mutate external CI systems, branch protection, repository hooks, or working tree files outside explicit outputs.',
      'Future slices must separately generate and validate external CI or branch-protection configuration proposals before any external mutation.',
    ],
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportPath: null,
    nonExecutionBoundary:
      'This Scope/CI Enforcement record is deterministic and record-only. It records DevView scope/CI enforcement lifecycle authority for a revalidated ready readiness source and actual Equivalence Proof record. It does not mutate .github, configure branch protection, configure required checks, reject diffs globally, activate hooks, apply graph deltas, mutate graph-source, execute extensions or shell commands, call providers or networks, automate approval, or replace user acceptance.',
  }
}

function validateRequiredInputs(options: ScopeCiEnforcementRecordOptions): void {
  if (!options.scopeCiEnforcementReadiness) {
    throw new Error('record-scope-ci-enforcement requires --scope-ci-enforcement-readiness <readinessJson>.')
  }
  if (!options.equivalenceProofRecord) {
    throw new Error('record-scope-ci-enforcement requires --equivalence-proof-record <proofRecordJson>.')
  }
  if (!options.output) {
    throw new Error('record-scope-ci-enforcement requires --output <scopeCiEnforcementRecordJson>.')
  }
}

function validateScopeCiReadiness(readiness: JsonRecord): void {
  if (readiness.artifactRole !== READINESS_ROLE || readiness.status !== READINESS_STATUS) {
    throw new Error(`Unsafe Scope/CI readiness: expected ${READINESS_ROLE}/${READINESS_STATUS}.`)
  }
  if (readiness.scopeCiEnforcementReadinessStatus !== 'ready-for-future-scope-ci-enforcement-command') {
    throw new Error('Unsafe Scope/CI readiness: readiness status is not ready for the enforcement record command.')
  }
  if (readiness.readinessScope !== 'scope-ci-enforcement-readiness-preview-disabled-no-enforcement') {
    throw new Error('Unsafe Scope/CI readiness: unsupported readinessScope.')
  }
  for (const field of [
    'scopeEnforced',
    'ciEnforcementEnabled',
    'requiredChecksConfigured',
    'branchProtectionChanged',
    'diffRejectionEnabled',
    'strictModeEnabled',
    'guidedEnforcementEnabled',
    'equivalenceProven',
    'runtimeEvidenceSatisfied',
    'evidenceAccepted',
    'graphDeltaApplied',
    'graphSourceMutated',
    'approvalAutomationEnabled',
    'userAcceptanceAutomated',
  ]) {
    if (readiness[field] !== false) {
      throw new Error(`Unsafe Scope/CI readiness: ${field} must be false.`)
    }
  }
  for (const field of [
    'scopeEnforcementAllowed',
    'ciEnforcementAllowed',
    'scopeEnforcementCommandImplemented',
    'ciEnforcementCommandImplemented',
  ]) {
    if (readiness[field] !== false) {
      throw new Error(`Unsafe Scope/CI readiness: ${field} must be false before record creation.`)
    }
  }
  if (readiness.nonEnforcing !== true) {
    throw new Error('Unsafe Scope/CI readiness: nonEnforcing must be true.')
  }
  validateNoUnsafeAuthority(readiness, 'Scope/CI readiness')
  if (!stringValue(readiness.sourceRuntimeEvidenceSatisfactionReadiness)) {
    throw new Error('Unsafe Scope/CI readiness: missing sourceRuntimeEvidenceSatisfactionReadiness.')
  }
  if (!stringValue(readiness.requiredEvidenceId)) {
    throw new Error('Unsafe Scope/CI readiness: missing requiredEvidenceId.')
  }
}

function validateEquivalenceProofRecord(proof: JsonRecord): void {
  if (proof.artifactRole !== PROOF_ROLE || proof.status !== PROOF_STATUS) {
    throw new Error(`Unsafe Equivalence Proof record: expected ${PROOF_ROLE}/${PROOF_STATUS}.`)
  }
  if (proof.equivalenceProofState !== 'equivalence-proven-for-explicit-runtime-evidence-obligation') {
    throw new Error('Unsafe Equivalence Proof record: unsupported equivalenceProofState.')
  }
  if (proof.proofProvenanceStatus !== 'runtime-satisfaction-record-and-policy-revalidated') {
    throw new Error('Unsafe Equivalence Proof record: proof provenance is not revalidated.')
  }
  if (proof.equivalenceProven !== true) {
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
    if (proof[field] !== false) {
      throw new Error(`Unsafe Equivalence Proof record: ${field} must be false.`)
    }
  }
  if (proof.nonEnforcing !== true) {
    throw new Error('Unsafe Equivalence Proof record: nonEnforcing must be true.')
  }
  validateNoUnsafeAuthority(proof, 'Equivalence Proof record', new Set(['equivalenceProven']))
  for (const requiredField of [
    'sourceRuntimeEvidenceSatisfactionRecord',
    'sourceRuntimeEvidenceSatisfactionReadiness',
    'sourceAcceptedEvidenceRecord',
    'sourceInstructionPack',
    'sourceEvidenceArtifact',
    'requiredEvidenceId',
    'acceptedEvidenceClaim',
    'acceptedEvidenceKind',
    'sourceEvidenceHash',
  ]) {
    if (!stringValue(proof[requiredField])) {
      throw new Error(`Unsafe Equivalence Proof record: missing ${requiredField}.`)
    }
  }
  if (proof.sourceEvidenceHashAlgorithm !== 'sha256' || !/^[a-f0-9]{64}$/.test(stringValue(proof.sourceEvidenceHash))) {
    throw new Error('Unsafe Equivalence Proof record: sourceEvidenceHash must be sha256.')
  }
  if (!asRecord(proof.matchedRequiredEvidence)) {
    throw new Error('Unsafe Equivalence Proof record: matchedRequiredEvidence is required.')
  }
}

function compareReadinessAndProof(readiness: JsonRecord, proof: JsonRecord): ChainComparison {
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
  const checks: ScopeCiEnforcementRecordFinding[] = []
  for (const field of comparableFields) {
    const readinessValue = nullableString(readiness[field])
    const proofValue = nullableString(proof[field])
    if (!readinessValue || !proofValue) continue
    if (readinessValue !== proofValue) {
      throw new Error(
        `Scope/CI enforcement chain mismatch: ${field} differs between readiness and Equivalence Proof record.`,
      )
    }
    checks.push({
      code: 'SCOPE_CI_CHAIN_FIELD_MATCHED',
      severity: 'info',
      field,
      message: `${field} matches between Scope/CI readiness and Equivalence Proof record.`,
    })
  }
  const readinessRequirement = asRecord(readiness.matchedRequiredEvidence)
  const proofRequirement = asRecord(proof.matchedRequiredEvidence)
  if (readinessRequirement && proofRequirement) {
    if (JSON.stringify(readinessRequirement) !== JSON.stringify(proofRequirement)) {
      throw new Error('Scope/CI enforcement chain mismatch: matchedRequiredEvidence differs.')
    }
    checks.push({
      code: 'SCOPE_CI_MATCHED_REQUIRED_EVIDENCE_MATCHED',
      severity: 'info',
      field: 'matchedRequiredEvidence',
      message: 'matchedRequiredEvidence matches between Scope/CI readiness and Equivalence Proof record.',
    })
  }
  if (checks.length === 0) {
    return {
      status: 'limited-no-comparable-provenance-fields',
      limitations: [
        'No comparable provenance fields were present on both Scope/CI readiness and Equivalence Proof record.',
      ],
      checks: [
        {
          code: 'SCOPE_CI_CHAIN_COMPARISON_LIMITED',
          severity: 'warning',
          message:
            'Scope/CI enforcement record was created with limited chain comparison because no comparable provenance fields were present on both inputs.',
        },
      ],
    }
  }
  return {
    status: 'matched-known-provenance-fields',
    limitations: [],
    checks,
  }
}

async function assertScopeCiEnforcementRecordOutputAuthority(
  root: string,
  input: {
    readiness: JsonRecord
    resolvedReadinessPath: string
    proof: JsonRecord
    resolvedProofPath: string
    output?: string
    markdown?: string
  },
): Promise<void> {
  const resolvedOutputPath = input.output ? resolveRepoPath(root, input.output) : undefined
  const resolvedMarkdownPath = input.markdown ? resolveRepoPath(root, input.markdown) : undefined
  if (resolvedOutputPath && resolvedMarkdownPath && pathKey(resolvedOutputPath) === pathKey(resolvedMarkdownPath)) {
    throw new Error('Scope/CI Enforcement record output is unsafe: --output and --markdown must differ.')
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
        `Scope/CI Enforcement record ${label} path is unsafe: ${requested} would overwrite ${protectedReason}.`,
      )
    }
    if (isProtectedControlPath(root, resolved)) {
      throw new Error(
        `Scope/CI Enforcement record ${label} path is unsafe: ${requested} is inside a protected source/control path.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(resolved)
    if (existingAuthority) {
      throw new Error(
        `Scope/CI Enforcement record ${label} path is unsafe: ${requested} already contains ${existingAuthority}.`,
      )
    }
  }
}

function buildProtectedPathMap(
  root: string,
  input: {
    readiness: JsonRecord
    resolvedReadinessPath: string
    proof: JsonRecord
    resolvedProofPath: string
  },
): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const addResolved = (candidatePath: string | undefined | null, reason: string): void => {
    if (candidatePath && !protectedPaths.has(pathKey(candidatePath))) {
      protectedPaths.set(pathKey(candidatePath), reason)
    }
  }

  addResolved(input.resolvedReadinessPath, 'the source Scope/CI Enforcement readiness')
  addResolved(input.resolvedProofPath, 'the source Equivalence Proof record')
  for (const source of [input.readiness, input.proof]) {
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

export function renderScopeCiEnforcementRecordMarkdown(record: ScopeCiEnforcementRecord): string {
  return `# DevView Scope/CI Enforcement Record

Status: \`${record.status}\`

| Field | Value |
| --- | --- |
| Enforcement kind | \`${record.enforcementKind}\` |
| Scope enforced | \`${record.scopeEnforced}\` |
| CI enforcement enabled | \`${record.ciEnforcementEnabled}\` |
| Required checks configured | \`${record.requiredChecksConfigured}\` |
| Branch protection mutated | \`${record.branchProtectionMutated}\` |
| External CI mutated | \`${record.externalCiMutated}\` |
| Diff rejection activated | \`${record.diffRejectionActivated}\` |
| Required Evidence ID | \`${record.requiredEvidenceId}\` |
| Chain comparison | \`${record.chainComparisonStatus}\` |

## Boundary

${record.nonExecutionBoundary}
`
}

function validateNoUnsafeAuthority(record: JsonRecord, label: string, allowedTrueFields = new Set<string>()): void {
  const hits = collectUnsafeAuthorityHits(record, [], new Set(), allowedTrueFields)
  if (hits.length > 0) {
    throw new Error(`Unsafe ${label}: ${hits[0].field} must not be true for Scope/CI enforcement record input.`)
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
    /\.codex\/hooks/i.test(relative) ||
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
