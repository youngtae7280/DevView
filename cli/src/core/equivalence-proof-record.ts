import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'

type JsonRecord = Record<string, unknown>

const POLICY_ROLE = 'devview-equivalence-proof-policy-boundary-preview'
const POLICY_STATUS = 'devview-equivalence-proof-policy-boundary-previewed'
const SATISFACTION_ROLE = 'devview-runtime-evidence-satisfaction-record'
const SATISFACTION_STATUS = 'devview-runtime-evidence-satisfaction-recorded'
const RECORD_ROLE = 'devview-equivalence-proof-record'

const unsafeAuthorityFields = [
  'equivalenceProven',
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
  'filesMutated',
  'requiredChecksConfigured',
  'branchProtectionChanged',
  'diffRejectionEnabled',
]

export interface EquivalenceProofRecordOptions {
  policy: string
  runtimeEvidenceSatisfactionRecord: string
  output?: string
  markdown?: string
}

export interface EquivalenceProofRecordFileResult {
  record: EquivalenceProofRecord
  outputPath?: string
  markdownReport?: string
}

export interface EquivalenceProofRecordFinding {
  code: string
  severity: 'info' | 'warning' | 'error'
  message: string
  field?: string
  expected?: unknown
  actual?: unknown
}

export interface EquivalenceProofRecord {
  schemaVersion: 1
  artifactRole: typeof RECORD_ROLE
  status: 'devview-equivalence-proof-recorded'
  equivalenceProofKind: 'runtime-evidence-obligation-equivalence-v1'
  equivalenceProofState: 'equivalence-proven-for-explicit-runtime-evidence-obligation'
  sourceEquivalenceProofPolicy: string
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
  sourceAcceptedEvidenceAccepted: true
  sourceRuntimeEvidenceSatisfied: true
  sourceEvidenceHash: string
  sourceEvidenceHashAlgorithm: 'sha256'
  proofProvenanceStatus: 'runtime-satisfaction-record-and-policy-revalidated'
  equivalenceProven: true
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  graphSourceMutated: false
  graphDeltaApplied: false
  approvalAutomationEnabled: false
  userAcceptanceAutomated: false
  providerInvoked: false
  networkCallMade: false
  extensionExecutionAllowed: false
  extensionsExecuted: false
  shellCommandsExecuted: false
  nonEnforcing: true
  proofChecks: EquivalenceProofRecordFinding[]
  allowedUse: string[]
  forbiddenUse: string[]
  limitations: string[]
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  writtenOutputPathAuthorityStatus:
    | 'not-written-stdout-only'
    | 'explicit-equivalence-proof-record-output-not-source-authority'
  markdownReportPath: string | null
  nonExecutionBoundary: string
}

export async function recordEquivalenceProofFile(
  root: string,
  options: EquivalenceProofRecordOptions,
): Promise<EquivalenceProofRecordFileResult> {
  validateRequiredInputs(options)

  const resolvedPolicyPath = resolveRepoPath(root, options.policy)
  const policy = await readRequiredJson(resolvedPolicyPath, 'Equivalence Proof Policy boundary')
  validatePolicy(policy)

  const resolvedSatisfactionPath = resolveRepoPath(root, options.runtimeEvidenceSatisfactionRecord)
  const satisfaction = await readRequiredJson(resolvedSatisfactionPath, 'Runtime Evidence satisfaction record')
  validateRuntimeEvidenceSatisfactionRecord(satisfaction)

  await assertEquivalenceProofRecordOutputAuthority(root, {
    policy,
    resolvedPolicyPath,
    satisfaction,
    resolvedSatisfactionPath,
    output: options.output,
    markdown: options.markdown,
  })

  const record = buildEquivalenceProofRecord(root, {
    resolvedPolicyPath,
    satisfaction,
    resolvedSatisfactionPath,
  })

  let outputPath: string | undefined
  let markdownReport: string | undefined
  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    record.writtenOutputPath = outputPath
    record.writtenOutputPathAuthorityStatus = 'explicit-equivalence-proof-record-output-not-source-authority'
    await writeJsonAtomic(resolvedOutputPath, record)
  }
  if (options.markdown) {
    const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
    markdownReport = relativePath(root, resolvedMarkdownPath)
    record.markdownReportPath = markdownReport
    await writeTextAtomic(resolvedMarkdownPath, renderEquivalenceProofRecordMarkdown(record))
    if (options.output) {
      await writeJsonAtomic(resolveRepoPath(root, options.output), record)
    }
  }

  return { record, ...(outputPath ? { outputPath } : {}), ...(markdownReport ? { markdownReport } : {}) }
}

function buildEquivalenceProofRecord(
  root: string,
  input: {
    resolvedPolicyPath: string
    satisfaction: JsonRecord
    resolvedSatisfactionPath: string
  },
): EquivalenceProofRecord {
  return {
    schemaVersion: 1,
    artifactRole: RECORD_ROLE,
    status: 'devview-equivalence-proof-recorded',
    equivalenceProofKind: 'runtime-evidence-obligation-equivalence-v1',
    equivalenceProofState: 'equivalence-proven-for-explicit-runtime-evidence-obligation',
    sourceEquivalenceProofPolicy: relativePath(root, input.resolvedPolicyPath),
    sourceRuntimeEvidenceSatisfactionRecord: relativePath(root, input.resolvedSatisfactionPath),
    sourceRuntimeEvidenceSatisfactionReadiness: stringValue(
      input.satisfaction.sourceRuntimeEvidenceSatisfactionReadiness,
    ),
    sourceAcceptedEvidenceRecord: stringValue(input.satisfaction.sourceAcceptedEvidenceRecord),
    sourceInstructionPack: stringValue(input.satisfaction.sourceInstructionPack),
    sourceContractInput: nullableString(input.satisfaction.sourceContractInput),
    sourceEvidenceArtifact: stringValue(input.satisfaction.sourceEvidenceArtifact),
    sourceRuntimeEvidenceAuthority: nullableString(input.satisfaction.sourceRuntimeEvidenceAuthority),
    sourceEvidenceCheckBinding: nullableString(input.satisfaction.sourceEvidenceCheckBinding),
    sourceOutputRequirement: nullableString(input.satisfaction.sourceOutputRequirement),
    sourceRuntimeReport: nullableString(input.satisfaction.sourceRuntimeReport),
    sourceScopeReport: nullableString(input.satisfaction.sourceScopeReport),
    sourceGraphDeltaApplyReport: nullableString(input.satisfaction.sourceGraphDeltaApplyReport),
    sourceCheckReport: nullableString(input.satisfaction.sourceCheckReport),
    requiredEvidenceId: stringValue(input.satisfaction.requiredEvidenceId),
    matchedRequiredEvidence: asRecord(input.satisfaction.matchedRequiredEvidence) ?? {},
    acceptedEvidenceClaim: stringValue(input.satisfaction.acceptedEvidenceClaim),
    acceptedEvidenceKind: stringValue(input.satisfaction.acceptedEvidenceKind),
    sourceAcceptedEvidenceAccepted: true,
    sourceRuntimeEvidenceSatisfied: true,
    sourceEvidenceHash: stringValue(input.satisfaction.sourceEvidenceHash),
    sourceEvidenceHashAlgorithm: 'sha256',
    proofProvenanceStatus: 'runtime-satisfaction-record-and-policy-revalidated',
    equivalenceProven: true,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    providerInvoked: false,
    networkCallMade: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    shellCommandsExecuted: false,
    nonEnforcing: true,
    proofChecks: [
      {
        code: 'EQUIVALENCE_PROOF_RUNTIME_SATISFACTION_RECORD_REVALIDATED',
        severity: 'info',
        field: 'runtimeEvidenceSatisfactionRecord',
        message:
          'Runtime Evidence satisfaction record role, status, provenance, source Evidence hash, and non-enforcement boundary were revalidated before recording equivalence proof.',
      },
      {
        code: 'EQUIVALENCE_PROOF_POLICY_BOUNDARY_REVALIDATED',
        severity: 'info',
        field: 'policy',
        message:
          'Equivalence Proof policy boundary was revalidated and did not already assert proof or downstream authority.',
      },
    ],
    allowedUse: [
      'serve as deterministic input to future Scope/CI enforcement readiness or activation commands',
      'document that one runtime Evidence satisfaction record proves equivalence for one explicit obligation',
      'preserve runtime satisfaction, accepted Evidence, source Evidence, and instruction pack provenance for audit',
    ],
    forbiddenUse: [
      'runtime Evidence satisfaction creation',
      'accepted Evidence creation',
      'scope enforcement',
      'CI required check',
      'branch protection mutation',
      'diff rejection',
      'graph-source mutation',
      'graph delta apply',
      'approval automation',
      'user acceptance automation',
      'extension execution',
      'provider or network invocation',
    ],
    limitations: [
      'This proof is scoped to one explicit runtime Evidence obligation.',
      'This proof is not a whole-program semantic equivalence proof.',
      'This proof does not imply Graph Delta apply success.',
      'This proof does not enable Scope/CI enforcement by itself.',
    ],
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportPath: null,
    nonExecutionBoundary:
      'This Equivalence Proof record proves equivalence only for one explicit runtime Evidence obligation already satisfied by a Runtime Evidence satisfaction record. It does not create runtime satisfaction, accept Evidence, enforce scope, configure CI or required checks, change branch protection, reject diffs, apply graph deltas, mutate graph-source, execute extensions, call providers or networks, automate approval, or replace user acceptance.',
  }
}

function validateRequiredInputs(options: EquivalenceProofRecordOptions): void {
  if (!options.policy) {
    throw new Error('record-equivalence-proof requires --policy <policyBoundaryPath>.')
  }
  if (!options.runtimeEvidenceSatisfactionRecord) {
    throw new Error(
      'record-equivalence-proof requires --runtime-evidence-satisfaction-record <satisfactionRecordJson>.',
    )
  }
  if (!options.output) {
    throw new Error('record-equivalence-proof requires --output <equivalenceProofRecordJson>.')
  }
}

function validatePolicy(policy: JsonRecord): void {
  if (policy.artifactRole !== POLICY_ROLE || policy.status !== POLICY_STATUS) {
    throw new Error(`Unsafe Equivalence Proof Policy boundary: expected ${POLICY_ROLE}/${POLICY_STATUS}.`)
  }
  for (const field of [
    'equivalenceProven',
    'evidenceAccepted',
    'runtimeEvidenceSatisfied',
    'graphDeltaApplied',
    'graphSourceMutated',
    'scopeEnforced',
    'ciEnforcementEnabled',
  ]) {
    if (policy[field] !== false) {
      throw new Error(`Unsafe Equivalence Proof Policy boundary: ${field} must be false.`)
    }
  }
}

function validateRuntimeEvidenceSatisfactionRecord(record: JsonRecord): void {
  if (record.artifactRole !== SATISFACTION_ROLE || record.status !== SATISFACTION_STATUS) {
    throw new Error(
      `Unsafe Runtime Evidence satisfaction record: expected ${SATISFACTION_ROLE}/${SATISFACTION_STATUS}.`,
    )
  }
  if (record.runtimeEvidenceSatisfactionState !== 'runtime-evidence-satisfied-for-explicit-obligation') {
    throw new Error('Unsafe Runtime Evidence satisfaction record: unsupported runtimeEvidenceSatisfactionState.')
  }
  if (record.satisfactionProvenanceStatus !== 'ready-binding-and-source-evidence-revalidated') {
    throw new Error('Unsafe Runtime Evidence satisfaction record: satisfaction provenance is not revalidated.')
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
  if (record.nonEnforcing !== true) {
    throw new Error('Unsafe Runtime Evidence satisfaction record: nonEnforcing must be true.')
  }
  validateNoUnsafeAuthority(record, 'Runtime Evidence satisfaction record', new Set(['runtimeEvidenceSatisfied']))
  for (const requiredField of [
    'sourceRuntimeEvidenceSatisfactionReadiness',
    'sourceAcceptedEvidenceRecord',
    'sourceInstructionPack',
    'sourceEvidenceArtifact',
    'requiredEvidenceId',
    'acceptedEvidenceClaim',
    'acceptedEvidenceKind',
    'sourceEvidenceHash',
  ]) {
    if (!stringValue(record[requiredField])) {
      throw new Error(`Unsafe Runtime Evidence satisfaction record: missing ${requiredField}.`)
    }
  }
  if (
    record.sourceEvidenceHashAlgorithm !== 'sha256' ||
    !/^[a-f0-9]{64}$/.test(stringValue(record.sourceEvidenceHash))
  ) {
    throw new Error('Unsafe Runtime Evidence satisfaction record: sourceEvidenceHash must be sha256.')
  }
  if (!asRecord(record.matchedRequiredEvidence)) {
    throw new Error('Unsafe Runtime Evidence satisfaction record: matchedRequiredEvidence is required.')
  }
}

async function assertEquivalenceProofRecordOutputAuthority(
  root: string,
  input: {
    policy: JsonRecord
    resolvedPolicyPath: string
    satisfaction: JsonRecord
    resolvedSatisfactionPath: string
    output?: string
    markdown?: string
  },
): Promise<void> {
  const resolvedOutputPath = input.output ? resolveRepoPath(root, input.output) : undefined
  const resolvedMarkdownPath = input.markdown ? resolveRepoPath(root, input.markdown) : undefined
  if (resolvedOutputPath && resolvedMarkdownPath && pathKey(resolvedOutputPath) === pathKey(resolvedMarkdownPath)) {
    throw new Error('Equivalence Proof record output is unsafe: --output and --markdown must differ.')
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
        `Equivalence Proof record ${label} path is unsafe: ${requested} would overwrite ${protectedReason}.`,
      )
    }
    if (isProtectedControlPath(root, resolved)) {
      throw new Error(
        `Equivalence Proof record ${label} path is unsafe: ${requested} is inside a protected source/control path.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(resolved)
    if (existingAuthority) {
      throw new Error(
        `Equivalence Proof record ${label} path is unsafe: ${requested} already contains ${existingAuthority}.`,
      )
    }
  }
}

function buildProtectedPathMap(
  root: string,
  input: {
    policy: JsonRecord
    resolvedPolicyPath: string
    satisfaction: JsonRecord
    resolvedSatisfactionPath: string
  },
): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const addResolved = (candidatePath: string | undefined | null, reason: string): void => {
    if (candidatePath && !protectedPaths.has(pathKey(candidatePath))) {
      protectedPaths.set(pathKey(candidatePath), reason)
    }
  }

  addResolved(input.resolvedPolicyPath, 'the source Equivalence Proof Policy boundary')
  addResolved(input.resolvedSatisfactionPath, 'the source Runtime Evidence satisfaction record')
  for (const source of [input.policy, input.satisfaction]) {
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

export function renderEquivalenceProofRecordMarkdown(record: EquivalenceProofRecord): string {
  return `# DevView Equivalence Proof Record

Status: \`${record.status}\`

| Field | Value |
| --- | --- |
| Proof kind | \`${record.equivalenceProofKind}\` |
| Required Evidence ID | \`${record.requiredEvidenceId}\` |
| Source runtime Evidence satisfied | \`${record.sourceRuntimeEvidenceSatisfied}\` |
| Equivalence proven | \`${record.equivalenceProven}\` |
| Runtime Evidence satisfied by this record | \`${record.runtimeEvidenceSatisfied}\` |
| Scope enforced | \`${record.scopeEnforced}\` |
| CI enforcement enabled | \`${record.ciEnforcementEnabled}\` |

## Boundary

${record.nonExecutionBoundary}
`
}

function validateNoUnsafeAuthority(record: JsonRecord, label: string, allowedTrueFields = new Set<string>()): void {
  const hits = collectUnsafeAuthorityHits(record, [], new Set(), allowedTrueFields)
  if (hits.length > 0) {
    throw new Error(`Unsafe ${label}: ${hits[0].field} must not be true for equivalence proof.`)
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
