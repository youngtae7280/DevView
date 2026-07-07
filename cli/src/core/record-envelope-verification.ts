import { createHash } from 'node:crypto'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'

type JsonRecord = Record<string, unknown>

const REPORT_ROLE = 'devview-record-envelope-verification-report'
const VERIFIED_STATUS = 'devview-record-envelope-verified'
const BLOCKED_STATUS = 'devview-record-envelope-verification-blocked'
const PREVIEW_ROLE = 'devview-record-envelope-preview'
const PREVIEW_STATUS = 'devview-record-envelope-previewed'
const PREVIEW_SIGNATURE_MODE = 'unsigned-deterministic-preview'
const SIGNATURE_VERIFICATION_MODE = 'not-performed-unsigned-preview-only'

const unsafeAuthorityFields = [
  'enterpriseGateActivated',
  'providerInvoked',
  'networkCallMade',
  'apiCallMade',
  'shellCommandExecuted',
  'shellCommandsExecuted',
  'extensionExecutionAllowed',
  'extensionsExecuted',
  'extensionCodeExecuted',
  'graphifyExecuted',
  'graphifyLiveRun',
  'nativeBenchmarkExecuted',
  'benchmarkExecuted',
  'candidateExecuted',
  'filesMutated',
  'graphSourceMutated',
  'graphDeltaApplied',
  'runtimeEvidenceSatisfied',
  'evidenceAccepted',
  'equivalenceProven',
  'scopeEnforced',
  'ciEnforcementEnabled',
  'hooksActivated',
  'branchProtectionChanged',
  'branchProtectionMutated',
  'requiredChecksConfigured',
  'requiredChecksMutated',
  'externalCiMutated',
  'diffRejectionEnabled',
  'diffRejectionActivated',
  'approvalAutomationEnabled',
  'userAcceptanceAutomated',
]

export interface RecordEnvelopeVerificationOptions {
  recordEnvelopePreview?: string
  payload?: string
  sourceArtifacts?: string
  previousEnvelope?: string
  output?: string
  markdown?: string
}

export interface RecordEnvelopeVerificationFinding {
  severity: 'blocker' | 'gap' | 'advisory' | 'satisfied'
  code: string
  message: string
  path?: string
  field?: string
}

interface LoadedArtifact {
  requestedPath: string
  resolvedPath: string
  relativePath: string
  record: JsonRecord | null
  sha256: string | null
  byteLength: number | null
  readError: string | null
}

interface DigestMatchSummary {
  expectedPath: string | null
  actualPath: string | null
  pathMatches: boolean
  expectedArtifactRole: string | null
  actualArtifactRole: string | null
  artifactRoleMatches: boolean
  expectedStatus: string | null
  actualStatus: string | null
  statusMatches: boolean
  expectedSha256: string | null
  actualSha256: string | null
  digestMatches: boolean
  expectedByteLength: number | null
  actualByteLength: number | null
  byteLengthMatches: boolean
}

export interface RecordEnvelopeVerificationReport {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof VERIFIED_STATUS | typeof BLOCKED_STATUS
  verificationScope: 'record-envelope-verification-report-only'
  sourceFactsOnly: true
  reportOnly: true
  sourceRecordEnvelopePreview: {
    path: string | null
    artifactRole: string | null
    status: string | null
    signatureMode: string | null
    envelopeSha256Present: boolean
    envelopePayloadDigestPresent: boolean
  }
  payloadVerification: DigestMatchSummary
  sourceArtifactVerification: {
    expectedCount: number
    actualCount: number
    allSourceDigestsMatch: boolean
    missingExpectedPaths: string[]
    unexpectedActualPaths: string[]
    matches: DigestMatchSummary[]
  }
  previousEnvelopeVerification: {
    required: boolean
    supplied: boolean
    expectedSha256: string | null
    actualSha256: string | null
    digestMatches: boolean | null
    chainLinkVerified: boolean
    expectedPath: string | null
    actualPath: string | null
    pathMatches: boolean | null
  }
  envelopeStructuralChecks: {
    envelopeSha256Present: boolean
    envelopePayloadDigestPresent: boolean
    payloadHashRecorded: boolean
    sourceDigestsRecorded: boolean
    actorIdentityRecorded: boolean
  }
  verificationDigest: string | null
  signatureVerificationMode: typeof SIGNATURE_VERIFICATION_MODE
  cryptographicSignatureVerified: false
  rbacPermissionVerified: false
  rbacEnforced: false
  permissionVerified: false
  verificationFindings: RecordEnvelopeVerificationFinding[]
  downstreamActionPlan: string[]
  enterpriseGateActivated: false
  providerInvoked: false
  networkCallMade: false
  apiCallMade: false
  shellCommandsExecuted: false
  extensionExecutionAllowed: false
  extensionsExecuted: false
  benchmarkExecuted: false
  candidateExecuted: false
  graphifyExecuted: false
  nativeBenchmarkExecuted: false
  filesMutated: false
  graphSourceMutated: false
  graphDeltaApplied: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  hooksActivated: false
  branchProtectionChanged: false
  branchProtectionMutated: false
  requiredChecksConfigured: false
  requiredChecksMutated: false
  externalCiMutated: false
  diffRejectionEnabled: false
  diffRejectionActivated: false
  approvalAutomationEnabled: false
  userAcceptanceAutomated: false
  writtenOutputPath?: string
  writtenMarkdownPath?: string
}

export class RecordEnvelopeVerificationValidationError extends Error {
  readonly report: RecordEnvelopeVerificationReport

  constructor(report: RecordEnvelopeVerificationReport) {
    super('Record envelope verification is blocked.')
    this.report = report
  }
}

export async function verifyRecordEnvelope(
  root: string,
  options: RecordEnvelopeVerificationOptions,
): Promise<RecordEnvelopeVerificationReport> {
  validateRequiredOptions(options)
  const sourceArtifactPaths = parseList(options.sourceArtifacts)
  const sourcePaths = [
    options.recordEnvelopePreview,
    options.payload,
    ...sourceArtifactPaths,
    options.previousEnvelope,
  ].filter((entry): entry is string => Boolean(entry))
  await assertOutputAuthority(
    root,
    sourcePaths.map((entry) => resolveRepoPath(root, entry)),
    options,
  )

  const preview = await loadArtifact(root, options.recordEnvelopePreview ?? '')
  const payload = await loadArtifact(root, options.payload ?? '')
  const sourceArtifacts = await Promise.all(sourceArtifactPaths.map((entry) => loadArtifact(root, entry)))
  const previousEnvelope = options.previousEnvelope ? await loadArtifact(root, options.previousEnvelope) : null
  const summaries = buildVerificationSummaries(preview, payload, sourceArtifacts, previousEnvelope)
  const findings = validateInputs(preview, payload, sourceArtifacts, previousEnvelope, summaries)

  if (findings.some((entry) => entry.severity === 'blocker')) {
    throw new RecordEnvelopeVerificationValidationError(buildReport(preview, summaries, findings, true))
  }

  const report = buildReport(preview, summaries, buildFindings(summaries))
  const outputPath = resolveRepoPath(root, options.output ?? '')
  await writeJsonAtomic(outputPath, report)
  report.writtenOutputPath = relativePath(root, outputPath)
  if (options.markdown) {
    const markdownPath = resolveRepoPath(root, options.markdown)
    await writeTextAtomic(markdownPath, renderMarkdown(report))
    report.writtenMarkdownPath = relativePath(root, markdownPath)
    await writeJsonAtomic(outputPath, report)
  }
  return report
}

interface VerificationSummaries {
  payload: DigestMatchSummary
  sources: RecordEnvelopeVerificationReport['sourceArtifactVerification']
  previous: RecordEnvelopeVerificationReport['previousEnvelopeVerification']
  structural: RecordEnvelopeVerificationReport['envelopeStructuralChecks']
}

function buildVerificationSummaries(
  preview: LoadedArtifact,
  payload: LoadedArtifact,
  sourceArtifacts: LoadedArtifact[],
  previousEnvelope: LoadedArtifact | null,
): VerificationSummaries {
  const previewRecord = preview.record ?? {}
  const payloadSummary = asRecord(previewRecord.payloadSummary)
  const expectedSources = expectedSourceDigests(previewRecord)
  const actualByPath = new Map(sourceArtifacts.map((entry) => [entry.relativePath, entry]))
  const expectedByPath = new Map(expectedSources.map((entry) => [stringValue(entry.path) ?? '', entry]))
  const matches = expectedSources.map((expected) => {
    const actual = actualByPath.get(stringValue(expected.path) ?? '') ?? null
    return digestMatchSummary(expected, actual)
  })
  const unexpectedActualPaths = sourceArtifacts
    .map((entry) => entry.relativePath)
    .filter((entry) => !expectedByPath.has(entry))
  const missingExpectedPaths = expectedSources
    .map((entry) => stringValue(entry.path))
    .filter((entry): entry is string => Boolean(entry))
    .filter((entry) => !actualByPath.has(entry))
  const previousExpectedSha =
    stringValue(previewRecord.previousEnvelopeSha256) ?? stringValue(asRecord(previewRecord.previousEnvelope)?.sha256)
  const previousExpectedPath = stringValue(asRecord(previewRecord.previousEnvelope)?.path)
  const previousLinked = booleanValue(asRecord(previewRecord.verificationSummary)?.previousEnvelopeLinked)
  const previousRequired = previousLinked || Boolean(previousExpectedSha)
  const previousActualSha = previousEnvelope?.sha256 ?? null
  return {
    payload: digestMatchSummary(payloadSummary, payload),
    sources: {
      expectedCount: expectedSources.length,
      actualCount: sourceArtifacts.length,
      allSourceDigestsMatch:
        expectedSources.length === sourceArtifacts.length &&
        unexpectedActualPaths.length === 0 &&
        missingExpectedPaths.length === 0 &&
        matches.every(
          (entry) =>
            entry.pathMatches &&
            entry.digestMatches &&
            entry.byteLengthMatches &&
            entry.artifactRoleMatches &&
            entry.statusMatches,
        ),
      missingExpectedPaths,
      unexpectedActualPaths,
      matches,
    },
    previous: {
      required: previousRequired,
      supplied: Boolean(previousEnvelope),
      expectedSha256: previousExpectedSha,
      actualSha256: previousActualSha,
      digestMatches: previousExpectedSha ? previousActualSha === previousExpectedSha : previousEnvelope ? false : null,
      chainLinkVerified: previousRequired && Boolean(previousExpectedSha) && previousActualSha === previousExpectedSha,
      expectedPath: previousExpectedPath,
      actualPath: previousEnvelope?.relativePath ?? null,
      pathMatches: previousExpectedPath
        ? previousEnvelope?.relativePath === previousExpectedPath
        : previousEnvelope
          ? false
          : null,
    },
    structural: {
      envelopeSha256Present: Boolean(stringValue(previewRecord.envelopeSha256)),
      envelopePayloadDigestPresent: Boolean(stringValue(previewRecord.envelopePayloadDigest)),
      payloadHashRecorded: Boolean(stringValue(payloadSummary?.sha256)),
      sourceDigestsRecorded: expectedSources.length > 0,
      actorIdentityRecorded: booleanValue(asRecord(previewRecord.verificationSummary)?.actorIdentityRecorded),
    },
  }
}

function digestMatchSummary(expected: JsonRecord | null, actual: LoadedArtifact | null): DigestMatchSummary {
  const expectedPath = stringValue(expected?.path)
  const expectedRole = stringValue(expected?.artifactRole)
  const expectedStatus = stringValue(expected?.status)
  const expectedSha = stringValue(expected?.sha256)
  const expectedLength = numberValue(expected?.byteLength)
  return {
    expectedPath,
    actualPath: actual?.relativePath ?? null,
    pathMatches: Boolean(expectedPath && actual?.relativePath === expectedPath),
    expectedArtifactRole: expectedRole,
    actualArtifactRole: stringValue(actual?.record?.artifactRole),
    artifactRoleMatches: Boolean(expectedRole && stringValue(actual?.record?.artifactRole) === expectedRole),
    expectedStatus,
    actualStatus: stringValue(actual?.record?.status),
    statusMatches: Boolean(expectedStatus && stringValue(actual?.record?.status) === expectedStatus),
    expectedSha256: expectedSha,
    actualSha256: actual?.sha256 ?? null,
    digestMatches: Boolean(expectedSha && actual?.sha256 === expectedSha),
    expectedByteLength: expectedLength,
    actualByteLength: actual?.byteLength ?? null,
    byteLengthMatches: typeof expectedLength === 'number' && actual?.byteLength === expectedLength,
  }
}

function buildReport(
  preview: LoadedArtifact,
  summaries: VerificationSummaries,
  findings: RecordEnvelopeVerificationFinding[],
  blocked = false,
): RecordEnvelopeVerificationReport {
  const previewRecord = preview.record ?? {}
  const verificationDigest =
    preview.sha256 && !blocked
      ? sha256(
          stableStringify({
            sourcePreviewSha256: preview.sha256,
            payloadVerification: summaries.payload,
            sourceArtifactVerification: summaries.sources,
            previousEnvelopeVerification: summaries.previous,
            signatureVerificationMode: SIGNATURE_VERIFICATION_MODE,
          }),
        )
      : null
  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : VERIFIED_STATUS,
    verificationScope: 'record-envelope-verification-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    sourceRecordEnvelopePreview: {
      path: preview.relativePath,
      artifactRole: stringValue(previewRecord.artifactRole),
      status: stringValue(previewRecord.status),
      signatureMode: stringValue(previewRecord.signatureMode),
      envelopeSha256Present: Boolean(stringValue(previewRecord.envelopeSha256)),
      envelopePayloadDigestPresent: Boolean(stringValue(previewRecord.envelopePayloadDigest)),
    },
    payloadVerification: summaries.payload,
    sourceArtifactVerification: summaries.sources,
    previousEnvelopeVerification: summaries.previous,
    envelopeStructuralChecks: summaries.structural,
    verificationDigest,
    signatureVerificationMode: SIGNATURE_VERIFICATION_MODE,
    cryptographicSignatureVerified: false,
    rbacPermissionVerified: false,
    rbacEnforced: false,
    permissionVerified: false,
    verificationFindings: findings,
    downstreamActionPlan: downstreamActionPlan(findings),
    enterpriseGateActivated: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    benchmarkExecuted: false,
    candidateExecuted: false,
    graphifyExecuted: false,
    nativeBenchmarkExecuted: false,
    filesMutated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    hooksActivated: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
  }
}

function validateInputs(
  preview: LoadedArtifact,
  payload: LoadedArtifact,
  sourceArtifacts: LoadedArtifact[],
  previousEnvelope: LoadedArtifact | null,
  summaries: VerificationSummaries,
): RecordEnvelopeVerificationFinding[] {
  const findings: RecordEnvelopeVerificationFinding[] = []
  for (const artifact of [preview, payload, ...sourceArtifacts, ...(previousEnvelope ? [previousEnvelope] : [])]) {
    validateLoadedArtifact(artifact, findings)
  }
  validatePreview(preview, findings)
  if (previousEnvelope) validatePreviousEnvelope(previousEnvelope, findings)
  validateUnsafeSourceFlags(payload, findings)
  validatePreviewClaims(payload, findings)
  for (const source of sourceArtifacts) validateUnsafeSourceFlags(source, findings)
  for (const source of sourceArtifacts) validatePreviewClaims(source, findings)
  if (previousEnvelope) validatePreviewClaims(previousEnvelope, findings)
  validateSummaryMatches(summaries, findings)
  return findings
}

function validateLoadedArtifact(artifact: LoadedArtifact, findings: RecordEnvelopeVerificationFinding[]): void {
  if (artifact.readError) {
    findings.push(blocker('RECORD_ENVELOPE_VERIFICATION_SOURCE_READ_FAILED', artifact.readError, artifact.relativePath))
    return
  }
  if (!artifact.record) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_SOURCE_NOT_JSON_OBJECT',
        `${artifact.relativePath} must be a JSON object with artifactRole and status.`,
        artifact.relativePath,
      ),
    )
    return
  }
  if (!stringValue(artifact.record.artifactRole) || !stringValue(artifact.record.status)) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_SOURCE_ROLE_STATUS_MISSING',
        `${artifact.relativePath} must include artifactRole and status.`,
        artifact.relativePath,
      ),
    )
  }
}

function validatePreview(preview: LoadedArtifact, findings: RecordEnvelopeVerificationFinding[]): void {
  const record = preview.record ?? {}
  if (record.artifactRole !== PREVIEW_ROLE || record.status !== PREVIEW_STATUS) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_PREVIEW_ROLE_STATUS_INVALID',
        `${preview.relativePath} must be ${PREVIEW_ROLE} with previewed status.`,
        preview.relativePath,
      ),
    )
  }
  if (record.signatureMode !== PREVIEW_SIGNATURE_MODE) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_PREVIEW_SIGNATURE_MODE_INVALID',
        `${preview.relativePath} must use unsigned deterministic preview signature mode.`,
        preview.relativePath,
        'signatureMode',
      ),
    )
  }
  validatePreviewClaims(preview, findings)
}

function validatePreviousEnvelope(
  previousEnvelope: LoadedArtifact,
  findings: RecordEnvelopeVerificationFinding[],
): void {
  const record = previousEnvelope.record ?? {}
  if (record.artifactRole !== PREVIEW_ROLE || record.status !== PREVIEW_STATUS) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_PREVIOUS_ENVELOPE_ROLE_STATUS_INVALID',
        `${previousEnvelope.relativePath} must be ${PREVIEW_ROLE} with previewed status.`,
        previousEnvelope.relativePath,
      ),
    )
  }
  if (record.signatureMode !== PREVIEW_SIGNATURE_MODE) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_PREVIOUS_ENVELOPE_SIGNATURE_MODE_INVALID',
        `${previousEnvelope.relativePath} must use unsigned deterministic preview signature mode.`,
        previousEnvelope.relativePath,
        'signatureMode',
      ),
    )
  }
}

function validatePreviewClaims(artifact: LoadedArtifact, findings: RecordEnvelopeVerificationFinding[]): void {
  const record = artifact.record ?? {}
  const verificationSummary = asRecord(record.verificationSummary)
  const authorizationClaim = asRecord(record.authorizationClaim)
  const claims: Array<[string, unknown]> = [
    ['cryptographicSignaturePresent', record.cryptographicSignaturePresent],
    ['verificationSummary.cryptographicSignatureVerified', verificationSummary?.cryptographicSignatureVerified],
    ['rbacEnforced', record.rbacEnforced],
    ['permissionVerified', record.permissionVerified],
    ['authorizationClaim.rbacEnforced', authorizationClaim?.rbacEnforced],
    ['authorizationClaim.permissionVerified', authorizationClaim?.permissionVerified],
    ['verificationSummary.rbacPermissionVerified', verificationSummary?.rbacPermissionVerified],
  ]
  for (const [field, value] of claims) {
    if (value === true) {
      findings.push(
        blocker(
          'RECORD_ENVELOPE_VERIFICATION_AUTHORITY_CLAIM_UNSUPPORTED',
          `${artifact.relativePath} claims ${field}: true; verification v1 only accepts unsigned preview source facts.`,
          artifact.relativePath,
          field,
        ),
      )
    }
  }
}

function validateUnsafeSourceFlags(artifact: LoadedArtifact, findings: RecordEnvelopeVerificationFinding[]): void {
  const allowedTrueFields = allowedTrueFieldsForRecord(artifact.record)
  for (const hit of collectUnsafeAuthorityHits(artifact.record, [], new Set(), allowedTrueFields)) {
    findings.push({
      severity: 'blocker',
      code: 'RECORD_ENVELOPE_VERIFICATION_UNSAFE_SOURCE_AUTHORITY_FLAG',
      message: `${artifact.relativePath} contains unsafe verification source flag ${hit.field}: true.`,
      path: artifact.relativePath,
      field: hit.field,
    })
  }
}

function validateSummaryMatches(summaries: VerificationSummaries, findings: RecordEnvelopeVerificationFinding[]): void {
  if (!summaries.payload.pathMatches) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_PAYLOAD_PATH_MISMATCH',
        'Payload path does not match preview metadata.',
        summaries.payload.actualPath ?? summaries.payload.expectedPath ?? undefined,
        'payloadSummary.path',
      ),
    )
  }
  if (!summaries.payload.digestMatches) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_PAYLOAD_DIGEST_MISMATCH',
        'Payload sha256 does not match preview metadata.',
        summaries.payload.actualPath ?? summaries.payload.expectedPath ?? undefined,
        'payloadSummary.sha256',
      ),
    )
  }
  if (!summaries.payload.byteLengthMatches) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_PAYLOAD_BYTE_LENGTH_MISMATCH',
        'Payload byte length does not match preview metadata.',
        summaries.payload.actualPath ?? summaries.payload.expectedPath ?? undefined,
        'payloadSummary.byteLength',
      ),
    )
  }
  if (!summaries.payload.artifactRoleMatches || !summaries.payload.statusMatches) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_PAYLOAD_ROLE_STATUS_MISMATCH',
        'Payload artifactRole/status does not match preview metadata.',
        summaries.payload.actualPath ?? summaries.payload.expectedPath ?? undefined,
      ),
    )
  }
  if (summaries.sources.expectedCount > 0 && summaries.sources.actualCount === 0) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_SOURCE_ARTIFACTS_REQUIRED',
        'Preview lists source artifact digests, so --source-artifacts must be supplied.',
        undefined,
        'sourceArtifactDigests',
      ),
    )
  }
  if (summaries.sources.expectedCount === 0 && summaries.sources.actualCount > 0) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_SOURCE_ARTIFACTS_UNEXPECTED',
        'Preview does not list source artifact digests, so --source-artifacts must be omitted.',
        undefined,
        'sourceArtifacts',
      ),
    )
  }
  for (const missingPath of summaries.sources.missingExpectedPaths) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_SOURCE_ARTIFACT_MISSING',
        `Expected source artifact ${missingPath} was not supplied.`,
        missingPath,
      ),
    )
  }
  for (const unexpectedPath of summaries.sources.unexpectedActualPaths) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_SOURCE_ARTIFACT_UNEXPECTED',
        `Unexpected source artifact ${unexpectedPath} was supplied.`,
        unexpectedPath,
      ),
    )
  }
  for (const match of summaries.sources.matches) {
    if (!match.digestMatches || !match.byteLengthMatches || !match.artifactRoleMatches || !match.statusMatches) {
      findings.push(
        blocker(
          'RECORD_ENVELOPE_VERIFICATION_SOURCE_ARTIFACT_DIGEST_MISMATCH',
          `Source artifact ${match.expectedPath ?? match.actualPath ?? 'unknown'} does not match preview digest metadata.`,
          match.actualPath ?? match.expectedPath ?? undefined,
        ),
      )
    }
  }
  if (summaries.previous.required && !summaries.previous.supplied) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_PREVIOUS_ENVELOPE_REQUIRED',
        'Preview declares a previous envelope link, so --previous-envelope must be supplied.',
      ),
    )
  }
  if (!summaries.previous.required && summaries.previous.supplied) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_PREVIOUS_ENVELOPE_UNEXPECTED',
        'Preview does not declare a previous envelope link, so --previous-envelope must be omitted.',
        summaries.previous.actualPath ?? undefined,
      ),
    )
  }
  if (summaries.previous.required && summaries.previous.supplied && !summaries.previous.digestMatches) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_PREVIOUS_ENVELOPE_DIGEST_MISMATCH',
        'Previous envelope sha256 does not match preview metadata.',
        summaries.previous.actualPath ?? summaries.previous.expectedPath ?? undefined,
      ),
    )
  }
  if (summaries.previous.required && summaries.previous.supplied && summaries.previous.pathMatches === false) {
    findings.push(
      blocker(
        'RECORD_ENVELOPE_VERIFICATION_PREVIOUS_ENVELOPE_PATH_MISMATCH',
        'Previous envelope path does not match preview metadata.',
        summaries.previous.actualPath ?? summaries.previous.expectedPath ?? undefined,
      ),
    )
  }
}

function buildFindings(summaries: VerificationSummaries): RecordEnvelopeVerificationFinding[] {
  const findings: RecordEnvelopeVerificationFinding[] = []
  findings.push({
    severity: 'satisfied',
    code: 'RECORD_ENVELOPE_VERIFICATION_PAYLOAD_DIGEST_VERIFIED',
    message: 'Payload path, sha256, byte length, artifactRole, and status match preview metadata.',
  })
  if (summaries.sources.expectedCount === 0) {
    findings.push({
      severity: 'advisory',
      code: 'RECORD_ENVELOPE_VERIFICATION_NO_SOURCE_ARTIFACTS',
      message: 'Preview does not list additional source artifact digests.',
    })
  } else {
    findings.push({
      severity: 'satisfied',
      code: 'RECORD_ENVELOPE_VERIFICATION_SOURCE_DIGESTS_VERIFIED',
      message: 'All explicit source artifact digests match preview metadata.',
    })
  }
  if (summaries.previous.required) {
    findings.push({
      severity: 'satisfied',
      code: 'RECORD_ENVELOPE_VERIFICATION_PREVIOUS_LINK_VERIFIED',
      message: 'Previous envelope sha256 link matches preview metadata.',
    })
  } else {
    findings.push({
      severity: 'advisory',
      code: 'RECORD_ENVELOPE_VERIFICATION_NO_PREVIOUS_LINK',
      message: 'Preview does not declare a previous envelope link.',
    })
  }
  findings.push({
    severity: 'gap',
    code: 'RECORD_ENVELOPE_VERIFICATION_UNSIGNED_ONLY',
    message: 'This verification recomputes raw byte digests only; cryptographic signatures and RBAC are not verified.',
  })
  return findings
}

async function loadArtifact(root: string, requestedPath: string): Promise<LoadedArtifact> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  const relative = relativePath(root, resolvedPath)
  try {
    const bytes = await readFile(resolvedPath)
    const digest = sha256(bytes)
    let record: JsonRecord | null = null
    let readError: string | null = null
    try {
      const parsed = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) as unknown
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        record = parsed as JsonRecord
      } else {
        readError = 'JSON content is not an object.'
      }
    } catch (error) {
      readError = error instanceof Error ? error.message : String(error)
    }
    return {
      requestedPath,
      resolvedPath,
      relativePath: relative,
      record,
      sha256: digest,
      byteLength: bytes.length,
      readError,
    }
  } catch (error) {
    return {
      requestedPath,
      resolvedPath,
      relativePath: relative,
      record: null,
      sha256: null,
      byteLength: null,
      readError: error instanceof Error ? error.message : String(error),
    }
  }
}

function validateRequiredOptions(options: RecordEnvelopeVerificationOptions): void {
  if (!options.recordEnvelopePreview) {
    throw new Error('security verify-record-envelope requires --record-envelope-preview <json>.')
  }
  if (!options.payload) throw new Error('security verify-record-envelope requires --payload <json>.')
  if (!options.output) throw new Error('security verify-record-envelope requires --output <json>.')
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: RecordEnvelopeVerificationOptions,
): Promise<void> {
  const outputPath = options.output ? resolveRepoPath(root, options.output) : null
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  if (!outputPath) throw new Error('security verify-record-envelope requires --output <json>.')
  const sourceSet = new Set(sourcePaths.map((entry) => path.resolve(entry)))
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('Record envelope verification JSON output and Markdown output must be different paths.')
  }
  for (const target of [outputPath, ...(markdownPath ? [markdownPath] : [])]) {
    const relativeTarget = relativePath(root, target)
    if (sourceSet.has(path.resolve(target))) {
      throw new Error(`Record envelope verification output would overwrite a source input: ${relativeTarget}.`)
    }
    if (
      hasDevViewControlDirectory(target) ||
      hasCodexControlDirectory(target) ||
      hasHiddenControlDirectorySegment(target)
    ) {
      throw new Error(`Record envelope verification output is inside a protected control path: ${relativeTarget}.`)
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(
        `Record envelope verification output would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
  }
}

function renderMarkdown(report: RecordEnvelopeVerificationReport): string {
  return [
    '# DevView Record Envelope Verification',
    '',
    `- status: ${report.status}`,
    `- sourcePreview: ${report.sourceRecordEnvelopePreview.path ?? 'unknown'}`,
    `- payloadDigestMatches: ${report.payloadVerification.digestMatches}`,
    `- sourceDigestCount: ${report.sourceArtifactVerification.expectedCount}`,
    `- previousChainLinkVerified: ${report.previousEnvelopeVerification.chainLinkVerified}`,
    `- signatureVerificationMode: ${report.signatureVerificationMode}`,
    '',
    '## Findings',
    ...report.verificationFindings.map((entry) => `- [${entry.severity}] ${entry.code}: ${entry.message}`),
    '',
    '## Report-Only Safety',
    '- cryptographicSignatureVerified: false',
    '- rbacPermissionVerified: false',
    '- rbacEnforced: false',
    '- permissionVerified: false',
    '- providerInvoked: false',
    '- networkCallMade: false',
    '- graphSourceMutated: false',
    '- graphDeltaApplied: false',
    '- enterpriseGateActivated: false',
    '',
  ].join('\n')
}

function expectedSourceDigests(previewRecord: JsonRecord): JsonRecord[] {
  return Array.isArray(previewRecord.sourceArtifactDigests)
    ? previewRecord.sourceArtifactDigests.filter(isJsonRecord)
    : []
}

function allowedTrueFieldsForRecord(record: JsonRecord | null | undefined): Set<string> {
  const role = stringValue(record?.artifactRole)
  const status = stringValue(record?.status)
  if (role === 'devview-accepted-evidence-record' && status === 'devview-accepted-evidence-recorded') {
    return new Set(['evidenceAccepted'])
  }
  if (
    role === 'devview-runtime-evidence-satisfaction-record' &&
    status === 'devview-runtime-evidence-satisfaction-recorded'
  ) {
    return new Set(['runtimeEvidenceSatisfied'])
  }
  if (role === 'devview-equivalence-proof-record' && status === 'devview-equivalence-proof-recorded') {
    return new Set(['equivalenceProven'])
  }
  if (role === 'devview-scope-ci-enforcement-record' && status === 'devview-scope-ci-enforcement-recorded') {
    return new Set(['scopeEnforced', 'ciEnforcementEnabled'])
  }
  if (role === 'devview-guarded-graph-update-apply-report' && status === 'devview-guarded-graph-update-applied') {
    return new Set(['graphDeltaApplied', 'graphSourceMutated', 'filesMutated'])
  }
  return new Set()
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

function downstreamActionPlan(findings: RecordEnvelopeVerificationFinding[]): string[] {
  const actions = new Set<string>()
  actions.add('Feed verified envelope reports into enterprise readiness before real signing.')
  actions.add('Keep this verification report unsigned and non-authoritative.')
  actions.add('Plan key trust policy and RBAC policy validation before cryptographic signing.')
  if (findings.some((entry) => entry.severity === 'blocker')) {
    actions.add('Fix digest/path/source mismatches and rerun record envelope verification.')
  }
  return [...actions]
}

function blocker(code: string, message: string, pathValue?: string, field?: string): RecordEnvelopeVerificationFinding {
  return { severity: 'blocker', code, message, path: pathValue, field }
}

function isSourceAuthorityShapedPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase()
  return (
    normalized.includes('/graph-source') ||
    normalized.includes('/source-authority') ||
    normalized.includes('/read-model') ||
    normalized.includes('/project-memory') ||
    normalized.endsWith('maintainability-graph.json')
  )
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.resolve(root, filePath)
}

function parseList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : null
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function booleanValue(value: unknown): boolean {
  return value === true
}

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === undefined) return 'null'
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`
}
