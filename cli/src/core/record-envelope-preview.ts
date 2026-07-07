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

const REPORT_ROLE = 'devview-record-envelope-preview'
const PREVIEWED_STATUS = 'devview-record-envelope-previewed'
const BLOCKED_STATUS = 'devview-record-envelope-blocked'
const SIGNATURE_MODE = 'unsigned-deterministic-preview'
const PAYLOAD_CANONICALIZATION = 'raw-json-bytes-sha256'

const knownPermissions = [
  'report.create',
  'evidence.decision.record',
  'evidence.accept.record',
  'runtime.satisfaction.record',
  'equivalence.proof.record',
  'scope-ci.enforcement.record',
  'graph.boundary.record',
  'graph.apply-plan.record',
  'graph.apply.authorize',
  'graph.apply.execute',
  'benchmark.golden.review',
  'benchmark.suite.lock',
  'benchmark.governance.verify',
  'provider-network.policy.record',
  'extension.manifest.publish',
  'extension.execution.approve',
  'enterprise.readiness.report',
  'audit.verify',
] as const

const knownActorTypes = ['human', 'automation', 'service', 'extension-author'] as const

const knownActorRoles = [
  'reporter',
  'evidence-reviewer',
  'runtime-authority-recorder',
  'scope-ci-recorder',
  'graph-update-operator',
  'benchmark-governor',
  'provider-network-policy-maintainer',
  'extension-author',
  'auditor',
  'security-admin',
] as const

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

export interface RecordEnvelopePreviewOptions {
  payload?: string
  sourceArtifacts?: string
  previousEnvelope?: string
  requiredPermission?: string
  actorId?: string
  actorType?: string
  actorRole?: string
  authorizationRationale?: string
  output?: string
  markdown?: string
}

export interface RecordEnvelopePreviewFinding {
  severity: 'blocker' | 'gap' | 'advisory' | 'satisfied'
  code: string
  message: string
  path?: string
  field?: string
}

export interface ArtifactDigest {
  path: string | null
  artifactRole: string | null
  status: string | null
  sha256: string | null
  byteLength: number | null
}

export interface RecordEnvelopePreview {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof PREVIEWED_STATUS | typeof BLOCKED_STATUS
  envelopeScope: 'signed-record-envelope-preview-report-only'
  recordEnvelopeVersion: 1
  sourceFactsOnly: true
  reportOnly: true
  payloadSummary: ArtifactDigest & {
    payloadCanonicalization: typeof PAYLOAD_CANONICALIZATION
    allowedTrueSourceFacts: string[]
  }
  sourceArtifactDigests: ArtifactDigest[]
  actorIdentity: {
    actorId: string | null
    actorType: string | null
    roleClaims: string[]
    identityProvider: 'explicit-cli-input'
    identityAssurance: 'explicit-cli-input-not-verified'
  }
  authorizationClaim: {
    requiredPermission: string | null
    authorizationSource: 'explicit-cli-input'
    authorizationRationale: string | null
    rbacEnforced: false
    permissionVerified: false
  }
  signatureMode: typeof SIGNATURE_MODE
  cryptographicSignaturePresent: false
  keyId: null
  signatureAlgorithm: null
  previousEnvelope: ArtifactDigest & {
    supplied: boolean
  }
  previousEnvelopeSha256: string | null
  envelopePayloadDigest: string | null
  envelopeSha256: string | null
  verificationSummary: {
    payloadHashRecorded: boolean
    sourceDigestsRecorded: boolean
    actorIdentityRecorded: boolean
    rbacPermissionVerified: false
    cryptographicSignatureVerified: false
    previousEnvelopeLinked: boolean
  }
  envelopeFindings: RecordEnvelopePreviewFinding[]
  downstreamActionPlan: string[]
  rbacEnforced: false
  permissionVerified: false
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
  enterpriseGateActivated: false
  writtenOutputPath?: string
  writtenMarkdownPath?: string
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

export class RecordEnvelopePreviewValidationError extends Error {
  readonly report: RecordEnvelopePreview

  constructor(report: RecordEnvelopePreview) {
    super('Record envelope preview is blocked.')
    this.report = report
  }
}

export async function previewRecordEnvelope(
  root: string,
  options: RecordEnvelopePreviewOptions,
): Promise<RecordEnvelopePreview> {
  validateRequiredOptions(options)
  const sourceArtifactPaths = parseList(options.sourceArtifacts)
  const actorRoles = parseList(options.actorRole)
  const sourcePaths = [options.payload, ...sourceArtifactPaths, options.previousEnvelope].filter(
    (entry): entry is string => Boolean(entry),
  )
  await assertOutputAuthority(
    root,
    sourcePaths.map((entry) => resolveRepoPath(root, entry)),
    options,
  )

  const payload = await loadArtifact(root, options.payload ?? '')
  const sourceArtifacts = await Promise.all(sourceArtifactPaths.map((entry) => loadArtifact(root, entry)))
  const previousEnvelope = options.previousEnvelope ? await loadArtifact(root, options.previousEnvelope) : null
  const findings = [
    ...validateOptionClaims(options, actorRoles),
    ...validateLoadedArtifacts(payload, sourceArtifacts, previousEnvelope),
  ]
  if (findings.some((entry) => entry.severity === 'blocker')) {
    throw new RecordEnvelopePreviewValidationError(
      buildReport(options, actorRoles, payload, sourceArtifacts, previousEnvelope, findings, true),
    )
  }

  const report = buildReport(
    options,
    actorRoles,
    payload,
    sourceArtifacts,
    previousEnvelope,
    buildFindings(sourceArtifacts, previousEnvelope),
  )
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

function buildReport(
  options: RecordEnvelopePreviewOptions,
  actorRoles: string[],
  payload: LoadedArtifact | null,
  sourceArtifacts: LoadedArtifact[],
  previousEnvelope: LoadedArtifact | null,
  findings: RecordEnvelopePreviewFinding[],
  blocked = false,
): RecordEnvelopePreview {
  const sourceArtifactDigests = sourceArtifacts.map((entry) => digestForArtifact(entry))
  const payloadSummary: RecordEnvelopePreview['payloadSummary'] = {
    ...digestForArtifact(payload),
    payloadCanonicalization: PAYLOAD_CANONICALIZATION,
    allowedTrueSourceFacts: [...allowedTrueFieldsForRecord(payload?.record)].sort(),
  }
  const actorIdentity = {
    actorId: stringValue(options.actorId),
    actorType: stringValue(options.actorType),
    roleClaims: actorRoles,
    identityProvider: 'explicit-cli-input' as const,
    identityAssurance: 'explicit-cli-input-not-verified' as const,
  }
  const authorizationClaim = {
    requiredPermission: stringValue(options.requiredPermission),
    authorizationSource: 'explicit-cli-input' as const,
    authorizationRationale: trimmedOrNull(options.authorizationRationale),
    rbacEnforced: false as const,
    permissionVerified: false as const,
  }
  const previous = {
    supplied: Boolean(previousEnvelope),
    ...digestForArtifact(previousEnvelope),
  }
  const envelopePayloadDigest =
    payload?.sha256 && !blocked
      ? sha256(
          stableStringify({
            payload: payloadSummary,
            sourceArtifactDigests,
            actorIdentity,
            authorizationClaim,
            previousEnvelopeSha256: previousEnvelope?.sha256 ?? null,
            signatureMode: SIGNATURE_MODE,
          }),
        )
      : null
  const envelopeSha256 = envelopePayloadDigest
    ? sha256(
        stableStringify({
          artifactRole: REPORT_ROLE,
          status: blocked ? BLOCKED_STATUS : PREVIEWED_STATUS,
          recordEnvelopeVersion: 1,
          envelopePayloadDigest,
          signatureMode: SIGNATURE_MODE,
          envelopeScope: 'signed-record-envelope-preview-report-only',
        }),
      )
    : null

  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : PREVIEWED_STATUS,
    envelopeScope: 'signed-record-envelope-preview-report-only',
    recordEnvelopeVersion: 1,
    sourceFactsOnly: true,
    reportOnly: true,
    payloadSummary,
    sourceArtifactDigests,
    actorIdentity,
    authorizationClaim,
    signatureMode: SIGNATURE_MODE,
    cryptographicSignaturePresent: false,
    keyId: null,
    signatureAlgorithm: null,
    previousEnvelope: previous,
    previousEnvelopeSha256: previousEnvelope?.sha256 ?? null,
    envelopePayloadDigest,
    envelopeSha256,
    verificationSummary: {
      payloadHashRecorded: Boolean(payload?.sha256),
      sourceDigestsRecorded: sourceArtifactDigests.length > 0,
      actorIdentityRecorded: Boolean(
        actorIdentity.actorId && actorIdentity.actorType && actorIdentity.roleClaims.length,
      ),
      rbacPermissionVerified: false,
      cryptographicSignatureVerified: false,
      previousEnvelopeLinked: Boolean(previousEnvelope),
    },
    envelopeFindings: findings,
    downstreamActionPlan: downstreamActionPlan(findings),
    rbacEnforced: false,
    permissionVerified: false,
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
    enterpriseGateActivated: false,
  }
}

function validateLoadedArtifacts(
  payload: LoadedArtifact,
  sourceArtifacts: LoadedArtifact[],
  previousEnvelope: LoadedArtifact | null,
): RecordEnvelopePreviewFinding[] {
  const findings: RecordEnvelopePreviewFinding[] = []
  validateArtifact(payload, 'payload', findings)
  for (const source of sourceArtifacts) {
    validateArtifact(source, 'source artifact', findings)
  }
  if (previousEnvelope) {
    validateArtifact(previousEnvelope, 'previous envelope', findings)
    if (previousEnvelope.record?.artifactRole !== REPORT_ROLE || previousEnvelope.record?.status !== PREVIEWED_STATUS) {
      findings.push(
        blockingFinding(
          'RECORD_ENVELOPE_PREVIOUS_ROLE_STATUS_INVALID',
          `${previousEnvelope.relativePath} must be ${REPORT_ROLE} with status ${PREVIEWED_STATUS}.`,
          previousEnvelope.relativePath,
        ),
      )
    }
  }
  return findings
}

function validateArtifact(
  artifact: LoadedArtifact,
  label: 'payload' | 'source artifact' | 'previous envelope',
  findings: RecordEnvelopePreviewFinding[],
): void {
  if (artifact.readError) {
    findings.push(blockingFinding('RECORD_ENVELOPE_SOURCE_READ_FAILED', artifact.readError, artifact.relativePath))
    return
  }
  if (!artifact.record) {
    findings.push(
      blockingFinding(
        'RECORD_ENVELOPE_SOURCE_NOT_JSON_OBJECT',
        `${artifact.relativePath} must be a JSON object with artifactRole and status.`,
        artifact.relativePath,
      ),
    )
    return
  }
  if (!stringValue(artifact.record.artifactRole) || !stringValue(artifact.record.status)) {
    findings.push(
      blockingFinding(
        'RECORD_ENVELOPE_SOURCE_ROLE_STATUS_MISSING',
        `${artifact.relativePath} must include artifactRole and status.`,
        artifact.relativePath,
      ),
    )
  }
  const allowedTrueFields = allowedTrueFieldsForRecord(artifact.record)
  for (const hit of collectUnsafeAuthorityHits(artifact.record, [], new Set(), allowedTrueFields)) {
    findings.push({
      severity: 'blocker',
      code: 'RECORD_ENVELOPE_UNSAFE_SOURCE_AUTHORITY_FLAG',
      message: `${artifact.relativePath} contains unsafe ${label} flag ${hit.field}: true.`,
      path: artifact.relativePath,
      field: hit.field,
    })
  }
}

function validateOptionClaims(
  options: RecordEnvelopePreviewOptions,
  actorRoles: string[],
): RecordEnvelopePreviewFinding[] {
  const findings: RecordEnvelopePreviewFinding[] = []
  if (!knownPermissions.includes(options.requiredPermission as (typeof knownPermissions)[number])) {
    findings.push(
      blockingFinding(
        'RECORD_ENVELOPE_REQUIRED_PERMISSION_UNKNOWN',
        `requiredPermission must be one of: ${knownPermissions.join(', ')}.`,
        undefined,
        'requiredPermission',
      ),
    )
  }
  if (!knownActorTypes.includes(options.actorType as (typeof knownActorTypes)[number])) {
    findings.push(
      blockingFinding(
        'RECORD_ENVELOPE_ACTOR_TYPE_UNKNOWN',
        `actorType must be one of: ${knownActorTypes.join(', ')}.`,
        undefined,
        'actorType',
      ),
    )
  }
  if (!trimmedOrNull(options.actorId)) {
    findings.push(
      blockingFinding('RECORD_ENVELOPE_ACTOR_ID_MISSING', 'actorId must be a non-empty string.', undefined, 'actorId'),
    )
  }
  if (actorRoles.length === 0) {
    findings.push(
      blockingFinding(
        'RECORD_ENVELOPE_ACTOR_ROLE_MISSING',
        'At least one actor role claim is required.',
        undefined,
        'actorRole',
      ),
    )
  }
  for (const role of actorRoles) {
    if (!knownActorRoles.includes(role as (typeof knownActorRoles)[number])) {
      findings.push(
        blockingFinding(
          'RECORD_ENVELOPE_ACTOR_ROLE_UNKNOWN',
          `actorRole must be one of: ${knownActorRoles.join(', ')}.`,
          undefined,
          'actorRole',
        ),
      )
    }
  }
  return findings
}

function buildFindings(
  sourceArtifacts: LoadedArtifact[],
  previousEnvelope: LoadedArtifact | null,
): RecordEnvelopePreviewFinding[] {
  return [
    {
      severity: 'satisfied',
      code: 'RECORD_ENVELOPE_PAYLOAD_HASH_RECORDED',
      message: 'Payload raw JSON byte hash and byte length were recorded.',
    },
    {
      severity: sourceArtifacts.length > 0 ? 'satisfied' : 'advisory',
      code:
        sourceArtifacts.length > 0 ? 'RECORD_ENVELOPE_SOURCE_DIGESTS_RECORDED' : 'RECORD_ENVELOPE_NO_SOURCE_ARTIFACTS',
      message:
        sourceArtifacts.length > 0
          ? 'Optional source artifact digests were recorded.'
          : 'No optional source artifacts were supplied.',
    },
    {
      severity: previousEnvelope ? 'satisfied' : 'advisory',
      code: previousEnvelope ? 'RECORD_ENVELOPE_PREVIOUS_LINK_RECORDED' : 'RECORD_ENVELOPE_PREVIOUS_LINK_NOT_SUPPLIED',
      message: previousEnvelope
        ? 'Previous envelope hash was recorded as a preview link.'
        : 'No previous envelope was supplied.',
    },
    {
      severity: 'gap',
      code: 'RECORD_ENVELOPE_UNSIGNED_PREVIEW_ONLY',
      message: 'This envelope preview is unsigned and does not verify RBAC permission.',
    },
  ]
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

function validateRequiredOptions(options: RecordEnvelopePreviewOptions): void {
  if (!options.payload) throw new Error('security preview-record-envelope requires --payload <json>.')
  if (!options.requiredPermission) {
    throw new Error('security preview-record-envelope requires --required-permission <permission>.')
  }
  if (!options.actorId) throw new Error('security preview-record-envelope requires --actor-id <id>.')
  if (!options.actorType) throw new Error('security preview-record-envelope requires --actor-type <type>.')
  if (!options.actorRole) throw new Error('security preview-record-envelope requires --actor-role <role>.')
  if (!options.output) throw new Error('security preview-record-envelope requires --output <json>.')
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: RecordEnvelopePreviewOptions,
): Promise<void> {
  const outputPath = options.output ? resolveRepoPath(root, options.output) : null
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  if (!outputPath) throw new Error('security preview-record-envelope requires --output <json>.')
  const sourceSet = new Set(sourcePaths.map((entry) => path.resolve(entry)))
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('Record envelope preview JSON output and Markdown output must be different paths.')
  }
  for (const target of [outputPath, ...(markdownPath ? [markdownPath] : [])]) {
    const relativeTarget = relativePath(root, target)
    if (sourceSet.has(path.resolve(target))) {
      throw new Error(`Record envelope preview output would overwrite a source input: ${relativeTarget}.`)
    }
    if (
      hasDevViewControlDirectory(target) ||
      hasCodexControlDirectory(target) ||
      hasHiddenControlDirectorySegment(target)
    ) {
      throw new Error(`Record envelope preview output is inside a protected control path: ${relativeTarget}.`)
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(
        `Record envelope preview output would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
  }
}

function renderMarkdown(report: RecordEnvelopePreview): string {
  return [
    '# DevView Record Envelope Preview',
    '',
    `- status: ${report.status}`,
    `- payload: ${report.payloadSummary.path ?? 'unknown'}`,
    `- payloadSha256: ${report.payloadSummary.sha256 ?? 'unavailable'}`,
    `- requiredPermission: ${report.authorizationClaim.requiredPermission ?? 'unknown'}`,
    `- actorId: ${report.actorIdentity.actorId ?? 'unknown'}`,
    `- signatureMode: ${report.signatureMode}`,
    `- envelopeSha256: ${report.envelopeSha256 ?? 'unavailable'}`,
    '',
    '## Findings',
    ...report.envelopeFindings.map((entry) => `- [${entry.severity}] ${entry.code}: ${entry.message}`),
    '',
    '## Report-Only Safety',
    '- rbacEnforced: false',
    '- permissionVerified: false',
    '- cryptographicSignaturePresent: false',
    '- cryptographicSignatureVerified: false',
    '- providerInvoked: false',
    '- networkCallMade: false',
    '- graphSourceMutated: false',
    '- graphDeltaApplied: false',
    '- enterpriseGateActivated: false',
    '',
  ].join('\n')
}

function digestForArtifact(artifact: LoadedArtifact | null): ArtifactDigest {
  return {
    path: artifact?.relativePath ?? null,
    artifactRole: stringValue(artifact?.record?.artifactRole),
    status: stringValue(artifact?.record?.status),
    sha256: artifact?.sha256 ?? null,
    byteLength: artifact?.byteLength ?? null,
  }
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
  allowedTopLevelTrueFields = new Set<string>(),
): Array<{ field: string }> {
  if (typeof value !== 'object' || value === null || seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectUnsafeAuthorityHits(entry, [...pathParts, String(index)], seen, allowedTopLevelTrueFields),
    )
  }
  const record = value as JsonRecord
  const hits: Array<{ field: string }> = []
  for (const [key, entry] of Object.entries(record)) {
    const nextPath = [...pathParts, key]
    const allowedTopLevel = pathParts.length === 0 && allowedTopLevelTrueFields.has(key)
    if (unsafeAuthorityFields.includes(key) && entry === true && !allowedTopLevel) {
      hits.push({ field: nextPath.join('.') })
    }
    hits.push(...collectUnsafeAuthorityHits(entry, nextPath, seen, allowedTopLevelTrueFields))
  }
  return hits
}

function downstreamActionPlan(findings: RecordEnvelopePreviewFinding[]): string[] {
  const actions = new Set<string>()
  actions.add('Feed envelope previews into enterprise readiness as source facts before real signing.')
  actions.add('Implement signed record envelope verification only after key management and RBAC policy exist.')
  actions.add('Keep this envelope preview unsigned and non-authoritative.')
  if (findings.some((entry) => entry.severity === 'blocker')) {
    actions.add('Fix invalid payload/source/actor permission claims and rerun envelope preview.')
  }
  return [...actions]
}

function parseList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as JsonRecord
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function blockingFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): RecordEnvelopePreviewFinding {
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

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function trimmedOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
