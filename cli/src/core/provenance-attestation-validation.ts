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

const REPORT_ROLE = 'devview-provenance-attestation-validation-report'
const PASSED_STATUS = 'devview-provenance-attestation-validation-passed'
const BLOCKED_STATUS = 'devview-provenance-attestation-validation-blocked'
const ATTESTATION_ROLE = 'devview-provenance-attestation-artifact'
const ATTESTATION_STATUS = 'devview-provenance-attestation-supplied'
const ATTESTATION_SCOPE = 'package-provenance-attestation-source-fact-only'
const PACKAGE_PROVENANCE_INPUTS_ROLE = 'devview-package-provenance-inputs-record'
const PACKAGE_PROVENANCE_INPUTS_STATUS = 'devview-package-provenance-inputs-recorded'
const PACKAGE_ARTIFACT_DIGEST_ROLE = 'devview-package-artifact-digest-record'
const PACKAGE_ARTIFACT_DIGEST_STATUS = 'devview-package-artifact-digest-recorded'
const RELEASE_PROVENANCE_READINESS_ROLE = 'devview-release-provenance-readiness-report'
const RELEASE_PROVENANCE_READINESS_STATUS = 'devview-release-provenance-readiness-reported'

const supportedAttestationFormats = [
  'devview-minimal-provenance-v1',
  'slsa-provenance-json',
  'in-toto-statement-json',
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

const unsupportedAttestationAuthorityFields = [
  'provenanceAttestationGeneratedByDevView',
  'provenanceAttestationGenerated',
  'provenanceAttestationVerified',
  'provenanceAttestationPresent',
  'provenanceAttested',
  'releaseProvenanceAttested',
  'npmProvenanceEnabled',
  'slsaProvenanceGenerated',
  'inTotoStatementVerified',
  'packagePublished',
  'publishingPerformed',
  'packageArtifactGeneratedByDevView',
  'packageArtifactGenerated',
  'packageTarballGenerated',
  'packageCreated',
  'packageFileWritten',
  'packageSigned',
  'packageSigningPresent',
  'packageSignaturePresent',
  'packageSignatureVerified',
  'sbomGeneratedByDevView',
  'sbomGenerated',
  'sbomCreated',
  'sbomFileWritten',
  'sbomAttested',
  'cryptographicSignaturePresent',
  'cryptographicSignatureVerified',
  'cryptographicSigningImplemented',
  'signedRecordEnvelopePresent',
  'keyGenerated',
  'privateKeyStored',
  'keyManagementImplemented',
  'keyRegistryPresent',
  'trustRootPresent',
  'keyRegistryCreated',
  'trustRootCreated',
  'rbacEnforced',
  'permissionVerified',
  'rbacPermissionVerified',
]

const executableInstructionFields = [
  'entrypoint',
  'entryPoint',
  'command',
  'commands',
  'script',
  'scripts',
  'module',
  'modulePath',
  'executable',
  'executablePath',
  'execution',
  'executionModel',
  'provider',
  'providerEndpoint',
  'providerUrl',
  'network',
  'networkEndpoint',
  'apiEndpoint',
  'apiCall',
  'shell',
  'shellCommand',
]

export interface ProvenanceAttestationValidationOptions {
  attestation?: string
  packageProvenanceInputs?: string
  packageArtifactDigest?: string
  releaseProvenanceReadiness?: string
  output?: string
  markdown?: string
}

export interface ProvenanceAttestationValidationFinding {
  severity: 'blocker' | 'gap' | 'advisory' | 'satisfied'
  code: string
  message: string
  path?: string
  field?: string
}

type SourceKind =
  | 'attestation'
  | 'package-provenance-inputs'
  | 'package-artifact-digest'
  | 'release-provenance-readiness'

interface LoadedArtifact {
  requestedPath: string
  resolvedPath: string
  relativePath: string
  sourceKind: SourceKind
  record: JsonRecord | null
  readError: string | null
  sha256: string | null
  byteLength: number | null
}

interface AttestationAnalysis {
  artifactRole: string | null
  status: string | null
  attestationScope: string | null
  attestationFormat: string | null
  packageName: string | null
  packageVersion: string | null
  declaredPackageSha256: string | null
  sourceRef: string | null
  buildCommandLabel: string | null
  sourceArtifactDigestCount: number | null
  requiredFieldsMissing: string[]
  unsupportedInstructionFields: Array<{ field: string; path: string }>
}

export interface ProvenanceAttestationValidationReport {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof PASSED_STATUS | typeof BLOCKED_STATUS
  validationScope: 'provenance-attestation-validation-report-only'
  sourceFactsOnly: true
  reportOnly: true
  attestationValidationStatus: 'validated-structural-source-fact-only' | 'blocked'
  signatureValidationStatus: 'not-performed-source-fact-only'
  sourceAttestationArtifact: {
    path: string
    artifactRole: string | null
    status: string | null
    attestationScope: string | null
    attestationFormat: string | null
    packageName: string | null
    packageVersion: string | null
    declaredPackageSha256: string | null
    sourceRef: string | null
    buildCommandLabel: string | null
    byteLength: number | null
    sha256: string | null
  }
  sourcePackageProvenanceInputs: {
    supplied: boolean
    path: string | null
    artifactRole: string | null
    status: string | null
    packageName: string | null
    packageVersion: string | null
    sourceRef: string | null
    buildCommandLabel: string | null
    sourceArtifactDigestCount: number | null
    provenanceAttestationStatus: string | null
  }
  sourcePackageArtifactDigest: {
    supplied: boolean
    path: string | null
    artifactRole: string | null
    status: string | null
    artifactDigestStatus: string | null
    packageName: string | null
    packageVersion: string | null
    packageSha256: string | null
    expectedSha256Match: boolean | null
  }
  sourceReleaseProvenanceReadiness: {
    supplied: boolean
    path: string | null
    artifactRole: string | null
    status: string | null
    releaseProvenanceReadinessStatus: string | null
    provenanceAttestationPresent: boolean | null
    provenanceAttested: boolean | null
  }
  attestationStructuralValidation: {
    formatRecognized: boolean
    requiredFieldsPresent: boolean
    packageDigestStatementPresent: boolean
    sourceBuildInputsPresent: boolean
    requiredFieldsMissing: string[]
    unsupportedInstructionFieldCount: number
    unsupportedInstructionFields: Array<{ field: string; path: string }>
  }
  packageDigestAlignment: {
    declaredPackageSha256: string | null
    packageArtifactDigestSha256: string | null
    packageDigestMatches: boolean | null
    alignmentStatus: 'matched' | 'mismatch' | 'not-supplied'
  }
  provenanceInputAlignment: {
    packageNameMatches: boolean | null
    packageVersionMatches: boolean | null
    sourceRefMatches: boolean | null
    buildCommandLabelMatches: boolean | null
    alignmentStatus: 'matched' | 'mismatch' | 'not-supplied'
  }
  digestSummary: {
    attestationSha256: string | null
    attestationByteLength: number | null
    sourceArtifactDigests: Array<{
      sourceKind: string
      path: string
      artifactRole: string | null
      status: string | null
      sha256: string | null
      byteLength: number | null
    }>
  }
  validationFindings: ProvenanceAttestationValidationFinding[]
  downstreamActionPlan: string[]
  provenanceAttestationGeneratedByDevView: false
  provenanceAttestationGenerated: false
  provenanceAttestationVerified: false
  provenanceAttestationPresent: false
  provenanceAttested: false
  releaseProvenanceAttested: false
  npmProvenanceEnabled: false
  slsaProvenanceGenerated: false
  inTotoStatementVerified: false
  packagePublished: false
  publishingPerformed: false
  packageArtifactGeneratedByDevView: false
  packageArtifactGenerated: false
  packageTarballGenerated: false
  packageSigned: false
  packageSigningPresent: false
  packageSignaturePresent: false
  packageSignatureVerified: false
  sbomGeneratedByDevView: false
  sbomGenerated: false
  sbomAttested: false
  cryptographicSigningImplemented: false
  cryptographicSignaturePresent: false
  cryptographicSignatureVerified: false
  keyGenerated: false
  privateKeyStored: false
  keyManagementImplemented: false
  keyRegistryCreated: false
  trustRootCreated: false
  rbacEnforced: false
  permissionVerified: false
  rbacPermissionVerified: false
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

export class ProvenanceAttestationValidationError extends Error {
  readonly report: ProvenanceAttestationValidationReport

  constructor(report: ProvenanceAttestationValidationReport) {
    super('Provenance attestation validation is blocked.')
    this.report = report
  }
}

export async function validateProvenanceAttestation(
  root: string,
  options: ProvenanceAttestationValidationOptions,
): Promise<ProvenanceAttestationValidationReport> {
  validateRequiredOptions(options)
  const sourceOptions = normalizeSourceOptions(options)
  const sourcePaths = [
    resolveRepoPath(root, options.attestation ?? ''),
    sourceOptions.packageProvenanceInputs ? resolveRepoPath(root, sourceOptions.packageProvenanceInputs) : null,
    sourceOptions.packageArtifactDigest ? resolveRepoPath(root, sourceOptions.packageArtifactDigest) : null,
    sourceOptions.releaseProvenanceReadiness ? resolveRepoPath(root, sourceOptions.releaseProvenanceReadiness) : null,
  ].filter((entry): entry is string => Boolean(entry))
  await assertOutputAuthority(root, sourcePaths, options)

  const attestation = await loadArtifact(root, options.attestation ?? '', 'attestation')
  const packageProvenanceInputs = sourceOptions.packageProvenanceInputs
    ? await loadArtifact(root, sourceOptions.packageProvenanceInputs, 'package-provenance-inputs')
    : null
  const packageArtifactDigest = sourceOptions.packageArtifactDigest
    ? await loadArtifact(root, sourceOptions.packageArtifactDigest, 'package-artifact-digest')
    : null
  const releaseProvenanceReadiness = sourceOptions.releaseProvenanceReadiness
    ? await loadArtifact(root, sourceOptions.releaseProvenanceReadiness, 'release-provenance-readiness')
    : null

  const blockingFindings = validateInputs(
    attestation,
    packageProvenanceInputs,
    packageArtifactDigest,
    releaseProvenanceReadiness,
  )
  if (blockingFindings.length > 0) {
    throw new ProvenanceAttestationValidationError(
      buildReport(
        attestation,
        packageProvenanceInputs,
        packageArtifactDigest,
        releaseProvenanceReadiness,
        blockingFindings,
        true,
      ),
    )
  }

  const report = buildReport(
    attestation,
    packageProvenanceInputs,
    packageArtifactDigest,
    releaseProvenanceReadiness,
    buildFindings(attestation, packageProvenanceInputs, packageArtifactDigest, releaseProvenanceReadiness),
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
  attestation: LoadedArtifact,
  packageProvenanceInputs: LoadedArtifact | null,
  packageArtifactDigest: LoadedArtifact | null,
  releaseProvenanceReadiness: LoadedArtifact | null,
  findings: ProvenanceAttestationValidationFinding[],
  blocked = false,
): ProvenanceAttestationValidationReport {
  const analysis = analyzeAttestation(attestation.record)
  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : PASSED_STATUS,
    validationScope: 'provenance-attestation-validation-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    attestationValidationStatus: blocked ? 'blocked' : 'validated-structural-source-fact-only',
    signatureValidationStatus: 'not-performed-source-fact-only',
    sourceAttestationArtifact: {
      path: attestation.relativePath,
      artifactRole: analysis.artifactRole,
      status: analysis.status,
      attestationScope: analysis.attestationScope,
      attestationFormat: analysis.attestationFormat,
      packageName: analysis.packageName,
      packageVersion: analysis.packageVersion,
      declaredPackageSha256: analysis.declaredPackageSha256,
      sourceRef: analysis.sourceRef,
      buildCommandLabel: analysis.buildCommandLabel,
      byteLength: attestation.byteLength,
      sha256: attestation.sha256,
    },
    sourcePackageProvenanceInputs: packageProvenanceInputsSummary(packageProvenanceInputs),
    sourcePackageArtifactDigest: packageArtifactDigestSummary(packageArtifactDigest),
    sourceReleaseProvenanceReadiness: releaseProvenanceReadinessSummary(releaseProvenanceReadiness),
    attestationStructuralValidation: {
      formatRecognized: supportedAttestationFormats.includes(
        analysis.attestationFormat as (typeof supportedAttestationFormats)[number],
      ),
      requiredFieldsPresent: analysis.requiredFieldsMissing.length === 0,
      packageDigestStatementPresent: Boolean(analysis.declaredPackageSha256),
      sourceBuildInputsPresent: Boolean(analysis.sourceRef && analysis.buildCommandLabel),
      requiredFieldsMissing: analysis.requiredFieldsMissing,
      unsupportedInstructionFieldCount: analysis.unsupportedInstructionFields.length,
      unsupportedInstructionFields: analysis.unsupportedInstructionFields,
    },
    packageDigestAlignment: packageDigestAlignment(analysis, packageArtifactDigest),
    provenanceInputAlignment: provenanceInputAlignment(analysis, packageProvenanceInputs),
    digestSummary: {
      attestationSha256: attestation.sha256,
      attestationByteLength: attestation.byteLength,
      sourceArtifactDigests: sourceArtifactDigests(
        attestation,
        packageProvenanceInputs,
        packageArtifactDigest,
        releaseProvenanceReadiness,
      ),
    },
    validationFindings: findings,
    downstreamActionPlan: downstreamActionPlan(findings),
    provenanceAttestationGeneratedByDevView: false,
    provenanceAttestationGenerated: false,
    provenanceAttestationVerified: false,
    provenanceAttestationPresent: false,
    provenanceAttested: false,
    releaseProvenanceAttested: false,
    npmProvenanceEnabled: false,
    slsaProvenanceGenerated: false,
    inTotoStatementVerified: false,
    packagePublished: false,
    publishingPerformed: false,
    packageArtifactGeneratedByDevView: false,
    packageArtifactGenerated: false,
    packageTarballGenerated: false,
    packageSigned: false,
    packageSigningPresent: false,
    packageSignaturePresent: false,
    packageSignatureVerified: false,
    sbomGeneratedByDevView: false,
    sbomGenerated: false,
    sbomAttested: false,
    cryptographicSigningImplemented: false,
    cryptographicSignaturePresent: false,
    cryptographicSignatureVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
    keyManagementImplemented: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
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
  attestation: LoadedArtifact,
  packageProvenanceInputs: LoadedArtifact | null,
  packageArtifactDigest: LoadedArtifact | null,
  releaseProvenanceReadiness: LoadedArtifact | null,
): ProvenanceAttestationValidationFinding[] {
  const findings: ProvenanceAttestationValidationFinding[] = []
  validateLoadedArtifact(attestation, findings)
  for (const source of [packageProvenanceInputs, packageArtifactDigest, releaseProvenanceReadiness].filter(
    (entry): entry is LoadedArtifact => Boolean(entry),
  )) {
    validateLoadedArtifact(source, findings)
  }
  validateAttestationArtifact(attestation, findings)
  if (packageProvenanceInputs) validatePackageProvenanceInputsSource(packageProvenanceInputs, findings)
  if (packageArtifactDigest) validatePackageArtifactDigestSource(packageArtifactDigest, findings)
  if (releaseProvenanceReadiness) validateReleaseProvenanceReadinessSource(releaseProvenanceReadiness, findings)
  for (const source of [attestation, packageProvenanceInputs, packageArtifactDigest, releaseProvenanceReadiness].filter(
    (entry): entry is LoadedArtifact => Boolean(entry),
  )) {
    validateUnsafeAuthorityFlags(source, findings)
    validateUnsupportedAuthorityClaims(source, findings)
  }
  validatePackageDigestAgreement(attestation, packageArtifactDigest, findings)
  validateProvenanceInputAgreement(attestation, packageProvenanceInputs, packageArtifactDigest, findings)
  return findings
}

function validateLoadedArtifact(artifact: LoadedArtifact, findings: ProvenanceAttestationValidationFinding[]): void {
  if (artifact.readError) {
    findings.push(
      blockingFinding('PROVENANCE_ATTESTATION_SOURCE_READ_FAILED', artifact.readError, artifact.relativePath),
    )
    return
  }
  if (!artifact.record) {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_SOURCE_NOT_JSON_OBJECT',
        `${artifact.relativePath} must be a JSON object.`,
        artifact.relativePath,
      ),
    )
  }
}

function validateAttestationArtifact(
  attestation: LoadedArtifact,
  findings: ProvenanceAttestationValidationFinding[],
): void {
  const analysis = analyzeAttestation(attestation.record)
  if (analysis.artifactRole !== ATTESTATION_ROLE || analysis.status !== ATTESTATION_STATUS) {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_ROLE_STATUS_INVALID',
        `${attestation.relativePath} must be ${ATTESTATION_ROLE} with supplied status.`,
        attestation.relativePath,
      ),
    )
  }
  if (analysis.attestationScope !== ATTESTATION_SCOPE) {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_SCOPE_INVALID',
        `${attestation.relativePath} must use attestationScope ${ATTESTATION_SCOPE}.`,
        attestation.relativePath,
        'attestationScope',
      ),
    )
  }
  if (
    !supportedAttestationFormats.includes(analysis.attestationFormat as (typeof supportedAttestationFormats)[number])
  ) {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_FORMAT_UNSUPPORTED',
        `${attestation.relativePath} has unsupported attestationFormat ${analysis.attestationFormat ?? 'missing'}.`,
        attestation.relativePath,
        'attestationFormat',
      ),
    )
  }
  for (const field of analysis.requiredFieldsMissing) {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_REQUIRED_FIELD_MISSING',
        `${attestation.relativePath} is missing required provenance field ${field}.`,
        attestation.relativePath,
        field,
      ),
    )
  }
  for (const hit of analysis.unsupportedInstructionFields) {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_EXECUTION_INSTRUCTION_UNSUPPORTED',
        `Provenance attestation wrapper contains executable/provider/network instruction field ${hit.field}.`,
        attestation.relativePath,
        hit.path,
      ),
    )
  }
}

function validatePackageProvenanceInputsSource(
  source: LoadedArtifact,
  findings: ProvenanceAttestationValidationFinding[],
): void {
  const record = source.record ?? {}
  if (record.artifactRole !== PACKAGE_PROVENANCE_INPUTS_ROLE || record.status !== PACKAGE_PROVENANCE_INPUTS_STATUS) {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_PACKAGE_INPUTS_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${PACKAGE_PROVENANCE_INPUTS_ROLE} with recorded status.`,
        source.relativePath,
      ),
    )
  }
  if (stringValue(record.provenanceAttestationStatus) !== 'not-generated') {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_PACKAGE_INPUTS_ATTESTATION_STATUS_UNSUPPORTED',
        `${source.relativePath} must keep provenanceAttestationStatus not-generated.`,
        source.relativePath,
        'provenanceAttestationStatus',
      ),
    )
  }
}

function validatePackageArtifactDigestSource(
  source: LoadedArtifact,
  findings: ProvenanceAttestationValidationFinding[],
): void {
  const record = source.record ?? {}
  if (record.artifactRole !== PACKAGE_ARTIFACT_DIGEST_ROLE || record.status !== PACKAGE_ARTIFACT_DIGEST_STATUS) {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_PACKAGE_DIGEST_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${PACKAGE_ARTIFACT_DIGEST_ROLE} with recorded status.`,
        source.relativePath,
      ),
    )
  }
  if (!stringValue(asRecord(record.sourcePackageArtifact)?.sha256)) {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_PACKAGE_DIGEST_SHA_MISSING',
        `${source.relativePath} must include sourcePackageArtifact.sha256.`,
        source.relativePath,
        'sourcePackageArtifact.sha256',
      ),
    )
  }
  if (!['computed', 'matched-expected'].includes(stringValue(record.artifactDigestStatus) ?? '')) {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_PACKAGE_DIGEST_STATUS_UNSUPPORTED',
        `${source.relativePath} must have artifactDigestStatus computed or matched-expected.`,
        source.relativePath,
        'artifactDigestStatus',
      ),
    )
  }
}

function validateReleaseProvenanceReadinessSource(
  source: LoadedArtifact,
  findings: ProvenanceAttestationValidationFinding[],
): void {
  const record = source.record ?? {}
  if (
    record.artifactRole !== RELEASE_PROVENANCE_READINESS_ROLE ||
    record.status !== RELEASE_PROVENANCE_READINESS_STATUS
  ) {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_RELEASE_READINESS_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${RELEASE_PROVENANCE_READINESS_ROLE} with reported status.`,
        source.relativePath,
      ),
    )
  }
}

function validateUnsafeAuthorityFlags(
  source: LoadedArtifact,
  findings: ProvenanceAttestationValidationFinding[],
): void {
  for (const hit of collectTrueFieldHits(source.record ?? {}, unsafeAuthorityFields)) {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_UNSAFE_SOURCE_AUTHORITY_FLAG',
        `${source.relativePath} claims unsafe authority field ${hit.field}: true.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
}

function validateUnsupportedAuthorityClaims(
  source: LoadedArtifact,
  findings: ProvenanceAttestationValidationFinding[],
): void {
  for (const hit of collectTrueFieldHits(source.record ?? {}, unsupportedAttestationAuthorityFields)) {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_AUTHORITY_CLAIM_UNSUPPORTED',
        `${source.relativePath} claims package/SBOM/signing/provenance authority field ${hit.field}: true.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
}

function validatePackageDigestAgreement(
  attestation: LoadedArtifact,
  packageArtifactDigest: LoadedArtifact | null,
  findings: ProvenanceAttestationValidationFinding[],
): void {
  if (!packageArtifactDigest?.record) return
  const declaredSha = analyzeAttestation(attestation.record).declaredPackageSha256
  const artifactSha = stringValue(asRecord(packageArtifactDigest.record.sourcePackageArtifact)?.sha256)
  if (declaredSha && artifactSha && declaredSha !== artifactSha) {
    findings.push(
      blockingFinding(
        'PROVENANCE_ATTESTATION_PACKAGE_DIGEST_MISMATCH',
        `${attestation.relativePath} declared package digest does not match ${packageArtifactDigest.relativePath}.`,
        attestation.relativePath,
        'packageDigest.sha256',
      ),
    )
  }
}

function validateProvenanceInputAgreement(
  attestation: LoadedArtifact,
  packageProvenanceInputs: LoadedArtifact | null,
  packageArtifactDigest: LoadedArtifact | null,
  findings: ProvenanceAttestationValidationFinding[],
): void {
  const analysis = analyzeAttestation(attestation.record)
  const inputRecord = packageProvenanceInputs?.record ?? null
  const digestRecord = packageArtifactDigest?.record ?? null
  const inputIdentity = inputRecord ? packageIdentityFromPackageProvenanceInputs(inputRecord) : null
  const digestIdentity = digestRecord ? packageIdentityFromPackageArtifactDigest(digestRecord) : null
  for (const identity of [inputIdentity, digestIdentity]) {
    if (!identity) continue
    if (analysis.packageName && identity.packageName && analysis.packageName !== identity.packageName) {
      findings.push(
        blockingFinding(
          'PROVENANCE_ATTESTATION_PACKAGE_NAME_MISMATCH',
          `Attestation package name ${analysis.packageName} does not match supplied source ${identity.packageName}.`,
          attestation.relativePath,
          'packageIdentity.name',
        ),
      )
    }
    if (analysis.packageVersion && identity.packageVersion && analysis.packageVersion !== identity.packageVersion) {
      findings.push(
        blockingFinding(
          'PROVENANCE_ATTESTATION_PACKAGE_VERSION_MISMATCH',
          `Attestation package version ${analysis.packageVersion} does not match supplied source ${identity.packageVersion}.`,
          attestation.relativePath,
          'packageIdentity.version',
        ),
      )
    }
  }
  if (inputRecord && analysis.sourceRef) {
    const sourceRef = stringValue(asRecord(inputRecord.sourceRefSummary)?.value)
    if (sourceRef && sourceRef !== analysis.sourceRef) {
      findings.push(
        blockingFinding(
          'PROVENANCE_ATTESTATION_SOURCE_REF_MISMATCH',
          `Attestation sourceRef ${analysis.sourceRef} does not match package provenance inputs ${sourceRef}.`,
          attestation.relativePath,
          'sourceRef',
        ),
      )
    }
  }
  if (inputRecord && analysis.buildCommandLabel) {
    const buildCommandLabel = stringValue(asRecord(inputRecord.buildInputSummary)?.buildCommandLabel)
    if (buildCommandLabel && buildCommandLabel !== analysis.buildCommandLabel) {
      findings.push(
        blockingFinding(
          'PROVENANCE_ATTESTATION_BUILD_LABEL_MISMATCH',
          `Attestation buildCommandLabel does not match package provenance inputs build label.`,
          attestation.relativePath,
          'buildCommandLabel',
        ),
      )
    }
  }
}

function buildFindings(
  attestation: LoadedArtifact,
  packageProvenanceInputs: LoadedArtifact | null,
  packageArtifactDigest: LoadedArtifact | null,
  releaseProvenanceReadiness: LoadedArtifact | null,
): ProvenanceAttestationValidationFinding[] {
  const analysis = analyzeAttestation(attestation.record)
  const findings: ProvenanceAttestationValidationFinding[] = [
    satisfiedFinding(
      'PROVENANCE_ATTESTATION_VALIDATED_SOURCE_FACT',
      'Preexisting provenance attestation wrapper was structurally validated as a source fact only.',
      attestation.relativePath,
    ),
    satisfiedFinding(
      'PROVENANCE_ATTESTATION_DIGEST_RECORDED',
      'Attestation wrapper byte digest was recorded without generating, signing, or verifying a real attestation.',
      attestation.relativePath,
    ),
    gapFinding(
      'PROVENANCE_ATTESTATION_SIGNATURE_NOT_VERIFIED',
      'Real SLSA/in-toto verification, cryptographic signature verification, package signing, and enterprise gate activation were not performed.',
    ),
  ]
  if (!analysis.sourceRef || !analysis.buildCommandLabel) {
    findings.push(
      advisoryFinding(
        'PROVENANCE_ATTESTATION_SOURCE_BUILD_INPUTS_PARTIAL',
        'Attestation wrapper does not declare both sourceRef and buildCommandLabel; future provenance validation should require explicit source/build input linkage.',
        attestation.relativePath,
      ),
    )
  }
  if (packageProvenanceInputs) {
    findings.push(
      satisfiedFinding(
        'PROVENANCE_ATTESTATION_PACKAGE_INPUTS_LINKED',
        'Package provenance inputs record is linked as a source fact.',
        packageProvenanceInputs.relativePath,
      ),
    )
  } else {
    findings.push(
      gapFinding('PROVENANCE_ATTESTATION_PACKAGE_INPUTS_NOT_SUPPLIED', 'Package provenance inputs were not supplied.'),
    )
  }
  if (packageArtifactDigest) {
    findings.push(
      satisfiedFinding(
        'PROVENANCE_ATTESTATION_PACKAGE_DIGEST_LINKED',
        'Package artifact digest record is linked and compared as a source fact.',
        packageArtifactDigest.relativePath,
      ),
    )
  } else {
    findings.push(
      gapFinding(
        'PROVENANCE_ATTESTATION_PACKAGE_DIGEST_NOT_SUPPLIED',
        'Package artifact digest record was not supplied.',
      ),
    )
  }
  if (releaseProvenanceReadiness) {
    findings.push(
      satisfiedFinding(
        'PROVENANCE_ATTESTATION_RELEASE_READINESS_LINKED',
        'Release provenance readiness report is linked as a source fact.',
        releaseProvenanceReadiness.relativePath,
      ),
    )
  } else {
    findings.push(
      gapFinding(
        'PROVENANCE_ATTESTATION_RELEASE_READINESS_NOT_SUPPLIED',
        'Release provenance readiness report was not supplied.',
      ),
    )
  }
  return findings
}

function packageProvenanceInputsSummary(
  source: LoadedArtifact | null,
): ProvenanceAttestationValidationReport['sourcePackageProvenanceInputs'] {
  const record = source?.record ?? null
  const packageSummary = asRecord(record?.packageMetadataSummary)
  const sourceRef = asRecord(record?.sourceRefSummary)
  const buildInput = asRecord(record?.buildInputSummary)
  return {
    supplied: Boolean(source),
    path: source?.relativePath ?? null,
    artifactRole: stringValue(record?.artifactRole),
    status: stringValue(record?.status),
    packageName: stringValue(packageSummary?.packageName),
    packageVersion: stringValue(packageSummary?.packageVersion),
    sourceRef: stringValue(sourceRef?.value),
    buildCommandLabel: stringValue(buildInput?.buildCommandLabel),
    sourceArtifactDigestCount: arrayLength(record?.sourceArtifactDigests),
    provenanceAttestationStatus: stringValue(record?.provenanceAttestationStatus),
  }
}

function packageArtifactDigestSummary(
  source: LoadedArtifact | null,
): ProvenanceAttestationValidationReport['sourcePackageArtifactDigest'] {
  const record = source?.record ?? null
  const packageIdentity = asRecord(record?.packageIdentitySummary)
  const packageArtifact = asRecord(record?.sourcePackageArtifact)
  return {
    supplied: Boolean(source),
    path: source?.relativePath ?? null,
    artifactRole: stringValue(record?.artifactRole),
    status: stringValue(record?.status),
    artifactDigestStatus: stringValue(record?.artifactDigestStatus),
    packageName: stringValue(packageIdentity?.packageName),
    packageVersion: stringValue(packageIdentity?.packageVersion),
    packageSha256: stringValue(packageArtifact?.sha256),
    expectedSha256Match: booleanValue(packageArtifact?.expectedSha256Match),
  }
}

function releaseProvenanceReadinessSummary(
  source: LoadedArtifact | null,
): ProvenanceAttestationValidationReport['sourceReleaseProvenanceReadiness'] {
  const record = source?.record ?? null
  return {
    supplied: Boolean(source),
    path: source?.relativePath ?? null,
    artifactRole: stringValue(record?.artifactRole),
    status: stringValue(record?.status),
    releaseProvenanceReadinessStatus: stringValue(record?.releaseProvenanceReadinessStatus),
    provenanceAttestationPresent: booleanValue(record?.provenanceAttestationPresent),
    provenanceAttested: booleanValue(record?.provenanceAttested),
  }
}

function packageDigestAlignment(
  analysis: AttestationAnalysis,
  packageArtifactDigest: LoadedArtifact | null,
): ProvenanceAttestationValidationReport['packageDigestAlignment'] {
  const artifactSha = stringValue(asRecord(packageArtifactDigest?.record?.sourcePackageArtifact)?.sha256)
  const matches = analysis.declaredPackageSha256 && artifactSha ? analysis.declaredPackageSha256 === artifactSha : null
  return {
    declaredPackageSha256: analysis.declaredPackageSha256,
    packageArtifactDigestSha256: artifactSha,
    packageDigestMatches: matches,
    alignmentStatus: matches === null ? 'not-supplied' : matches ? 'matched' : 'mismatch',
  }
}

function provenanceInputAlignment(
  analysis: AttestationAnalysis,
  packageProvenanceInputs: LoadedArtifact | null,
): ProvenanceAttestationValidationReport['provenanceInputAlignment'] {
  const record = packageProvenanceInputs?.record ?? null
  const packageIdentity = record ? packageIdentityFromPackageProvenanceInputs(record) : null
  const sourceRef = stringValue(asRecord(record?.sourceRefSummary)?.value)
  const buildCommandLabel = stringValue(asRecord(record?.buildInputSummary)?.buildCommandLabel)
  const checks = [
    analysis.packageName && packageIdentity?.packageName ? analysis.packageName === packageIdentity.packageName : null,
    analysis.packageVersion && packageIdentity?.packageVersion
      ? analysis.packageVersion === packageIdentity.packageVersion
      : null,
    analysis.sourceRef && sourceRef ? analysis.sourceRef === sourceRef : null,
    analysis.buildCommandLabel && buildCommandLabel ? analysis.buildCommandLabel === buildCommandLabel : null,
  ].filter((entry): entry is boolean => entry !== null)
  return {
    packageNameMatches:
      analysis.packageName && packageIdentity?.packageName
        ? analysis.packageName === packageIdentity.packageName
        : null,
    packageVersionMatches:
      analysis.packageVersion && packageIdentity?.packageVersion
        ? analysis.packageVersion === packageIdentity.packageVersion
        : null,
    sourceRefMatches: analysis.sourceRef && sourceRef ? analysis.sourceRef === sourceRef : null,
    buildCommandLabelMatches:
      analysis.buildCommandLabel && buildCommandLabel ? analysis.buildCommandLabel === buildCommandLabel : null,
    alignmentStatus: checks.length === 0 ? 'not-supplied' : checks.every(Boolean) ? 'matched' : 'mismatch',
  }
}

function sourceArtifactDigests(
  attestation: LoadedArtifact,
  packageProvenanceInputs: LoadedArtifact | null,
  packageArtifactDigest: LoadedArtifact | null,
  releaseProvenanceReadiness: LoadedArtifact | null,
): ProvenanceAttestationValidationReport['digestSummary']['sourceArtifactDigests'] {
  return [attestation, packageProvenanceInputs, packageArtifactDigest, releaseProvenanceReadiness]
    .filter((entry): entry is LoadedArtifact => Boolean(entry))
    .map((entry) => ({
      sourceKind: entry.sourceKind,
      path: entry.relativePath,
      artifactRole: stringValue(entry.record?.artifactRole),
      status: stringValue(entry.record?.status),
      sha256: entry.sha256,
      byteLength: entry.byteLength,
    }))
}

function analyzeAttestation(record: JsonRecord | null): AttestationAnalysis {
  const packageIdentity = asRecord(record?.packageIdentity)
  const packageDigest = asRecord(record?.packageDigest)
  const provenanceInputs = asRecord(record?.provenanceInputs)
  const source = asRecord(record?.source)
  const build = asRecord(record?.build)
  const packageName =
    stringValue(packageIdentity?.name) ?? stringValue(packageIdentity?.packageName) ?? stringValue(record?.packageName)
  const packageVersion =
    stringValue(packageIdentity?.version) ??
    stringValue(packageIdentity?.packageVersion) ??
    stringValue(record?.packageVersion)
  const declaredPackageSha256 =
    sha256FromValue(packageDigest?.sha256) ??
    sha256FromValue(packageDigest?.digest) ??
    sha256FromValue(record?.declaredPackageSha256) ??
    sha256FromValue(record?.packageSha256) ??
    sha256FromValue(packageIdentity?.packageDigest)
  const sourceRef =
    stringValue(record?.sourceRef) ?? stringValue(provenanceInputs?.sourceRef) ?? stringValue(source?.ref)
  const buildCommandLabel =
    stringValue(record?.buildCommandLabel) ??
    stringValue(provenanceInputs?.buildCommandLabel) ??
    stringValue(build?.buildCommandLabel)
  const requiredFieldsMissing: string[] = []
  if (!record?.artifactRole) requiredFieldsMissing.push('artifactRole')
  if (!record?.status) requiredFieldsMissing.push('status')
  if (!record?.attestationScope) requiredFieldsMissing.push('attestationScope')
  if (!record?.attestationFormat) requiredFieldsMissing.push('attestationFormat')
  if (!packageName) requiredFieldsMissing.push('packageIdentity.name')
  if (!packageVersion) requiredFieldsMissing.push('packageIdentity.version')
  if (!declaredPackageSha256) requiredFieldsMissing.push('packageDigest.sha256')
  return {
    artifactRole: stringValue(record?.artifactRole),
    status: stringValue(record?.status),
    attestationScope: stringValue(record?.attestationScope),
    attestationFormat: stringValue(record?.attestationFormat),
    packageName,
    packageVersion,
    declaredPackageSha256,
    sourceRef,
    buildCommandLabel,
    sourceArtifactDigestCount: arrayLength(record?.sourceArtifactDigests),
    requiredFieldsMissing,
    unsupportedInstructionFields: collectNonEmptyFieldHits(record ?? {}, executableInstructionFields),
  }
}

async function loadArtifact(root: string, requestedPath: string, sourceKind: SourceKind): Promise<LoadedArtifact> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  const base = {
    requestedPath,
    resolvedPath,
    relativePath: relativePath(root, resolvedPath),
    sourceKind,
  }
  try {
    const bytes = await readFile(resolvedPath)
    const raw = bytes.toString('utf8').replace(/^\uFEFF/, '')
    const parsed = JSON.parse(raw) as unknown
    return {
      ...base,
      record: isJsonRecord(parsed) ? parsed : null,
      readError: null,
      sha256: sha256(bytes),
      byteLength: bytes.length,
    }
  } catch (error) {
    return {
      ...base,
      record: null,
      readError: error instanceof Error ? error.message : String(error),
      sha256: null,
      byteLength: null,
    }
  }
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: Pick<ProvenanceAttestationValidationOptions, 'output' | 'markdown'>,
): Promise<void> {
  const outputPath = options.output ? resolveRepoPath(root, options.output) : null
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  if (!outputPath) throw new Error('security validate-provenance-attestation requires --output <json>.')
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('Provenance attestation validation JSON output and Markdown output must be different paths.')
  }
  const resolvedSources = sourcePaths.map((entry) => path.resolve(entry))
  for (const candidate of [outputPath, markdownPath].filter((entry): entry is string => Boolean(entry))) {
    const resolvedCandidate = path.resolve(candidate)
    if (resolvedSources.some((source) => source === resolvedCandidate)) {
      throw new Error(
        `Provenance attestation validation output ${relativePath(root, candidate)} would overwrite a source input.`,
      )
    }
    const relativeTarget = relativePath(root, candidate)
    if (
      hasDevViewControlDirectory(relativeTarget) ||
      hasCodexControlDirectory(relativeTarget) ||
      hasHiddenControlDirectorySegment(relativeTarget)
    ) {
      throw new Error(`Provenance attestation validation output ${relativeTarget} is inside a protected control path.`)
    }
    if (looksLikeSourceAuthorityPath(relativeTarget)) {
      throw new Error(
        `Provenance attestation validation output ${relativeTarget} looks like a source authority artifact.`,
      )
    }
  }
}

function validateRequiredOptions(options: ProvenanceAttestationValidationOptions): void {
  if (!options.attestation) {
    throw new Error('security validate-provenance-attestation requires --attestation <file>.')
  }
  if (!options.output) throw new Error('security validate-provenance-attestation requires --output <json>.')
}

function normalizeSourceOptions(options: ProvenanceAttestationValidationOptions): {
  packageProvenanceInputs?: string
  packageArtifactDigest?: string
  releaseProvenanceReadiness?: string
} {
  return {
    packageProvenanceInputs: singleOptionalPath(options.packageProvenanceInputs, '--package-provenance-inputs'),
    packageArtifactDigest: singleOptionalPath(options.packageArtifactDigest, '--package-artifact-digest'),
    releaseProvenanceReadiness: singleOptionalPath(
      options.releaseProvenanceReadiness,
      '--release-provenance-readiness',
    ),
  }
}

function singleOptionalPath(value: string | undefined, optionName: string): string | undefined {
  if (!value) return undefined
  const entries = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  if (entries.length > 1) {
    throw new Error(`${optionName} accepts one file for security validate-provenance-attestation in v1.`)
  }
  return entries[0]
}

function downstreamActionPlan(findings: ProvenanceAttestationValidationFinding[]): string[] {
  const actions = new Set<string>()
  if (findings.some((finding) => finding.severity === 'blocker')) {
    actions.add(
      'Fix provenance attestation wrapper role/status, digest alignment, source linkage, or unsafe authority blockers.',
    )
  }
  actions.add('Integrate this provenance attestation validation report into enterprise readiness as a source fact.')
  actions.add('Keep real SLSA/in-toto verification behind explicit signing, key, RBAC, and CI governance.')
  actions.add(
    'Validate signed attestation verification only after key registry, trust root, and actor policy are modeled.',
  )
  return [...actions]
}

function renderMarkdown(report: ProvenanceAttestationValidationReport): string {
  return [
    '# DevView Provenance Attestation Validation',
    '',
    `- status: ${report.status}`,
    `- attestation: ${report.sourceAttestationArtifact.path}`,
    `- format: ${report.sourceAttestationArtifact.attestationFormat ?? 'unknown'}`,
    `- package: ${report.sourceAttestationArtifact.packageName ?? 'unknown'}@${report.sourceAttestationArtifact.packageVersion ?? 'unknown'}`,
    `- attestation sha256: ${report.sourceAttestationArtifact.sha256 ?? 'unavailable'}`,
    `- package digest alignment: ${report.packageDigestAlignment.alignmentStatus}`,
    `- signatureValidationStatus: ${report.signatureValidationStatus}`,
    `- provenanceAttested: ${report.provenanceAttested}`,
    `- cryptographicSignatureVerified: ${report.cryptographicSignatureVerified}`,
    '',
    '## Findings',
    ...report.validationFindings.map((finding) => `- [${finding.severity}] ${finding.code}: ${finding.message}`),
    '',
  ].join('\n')
}

function packageIdentityFromPackageProvenanceInputs(record: JsonRecord): {
  packageName: string | null
  packageVersion: string | null
} {
  const summary = asRecord(record.packageMetadataSummary)
  return {
    packageName: stringValue(summary?.packageName),
    packageVersion: stringValue(summary?.packageVersion),
  }
}

function packageIdentityFromPackageArtifactDigest(record: JsonRecord): {
  packageName: string | null
  packageVersion: string | null
} {
  const summary = asRecord(record.packageIdentitySummary)
  return {
    packageName: stringValue(summary?.packageName),
    packageVersion: stringValue(summary?.packageVersion),
  }
}

function collectTrueFieldHits(
  record: unknown,
  fieldNames: string[],
  pathParts: string[] = [],
): Array<{ field: string; path: string }> {
  if (!record || typeof record !== 'object') return []
  const hits: Array<{ field: string; path: string }> = []
  for (const [key, entry] of Object.entries(record as JsonRecord)) {
    const nextPath = [...pathParts, key]
    if (fieldNames.includes(key) && entry === true) hits.push({ field: key, path: nextPath.join('.') })
    if (entry && typeof entry === 'object') hits.push(...collectTrueFieldHits(entry, fieldNames, nextPath))
  }
  return hits
}

function collectNonEmptyFieldHits(
  record: unknown,
  fieldNames: string[],
  pathParts: string[] = [],
): Array<{ field: string; path: string }> {
  if (!record || typeof record !== 'object') return []
  const hits: Array<{ field: string; path: string }> = []
  for (const [key, entry] of Object.entries(record as JsonRecord)) {
    const nextPath = [...pathParts, key]
    if (fieldNames.includes(key) && isNonEmptyInstructionValue(entry)) {
      hits.push({ field: key, path: nextPath.join('.') })
    }
    if (entry && typeof entry === 'object') hits.push(...collectNonEmptyFieldHits(entry, fieldNames, nextPath))
  }
  return hits
}

function isNonEmptyInstructionValue(value: unknown): boolean {
  if (value === null || value === undefined || value === false) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as JsonRecord).length > 0
  return true
}

function sha256FromValue(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = value.match(/[a-fA-F0-9]{64}/)
  return match ? match[0].toLowerCase() : null
}

function blockingFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): ProvenanceAttestationValidationFinding {
  return { severity: 'blocker', code, message, path: pathValue, field }
}

function gapFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): ProvenanceAttestationValidationFinding {
  return { severity: 'gap', code, message, path: pathValue, field }
}

function advisoryFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): ProvenanceAttestationValidationFinding {
  return { severity: 'advisory', code, message, path: pathValue, field }
}

function satisfiedFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): ProvenanceAttestationValidationFinding {
  return { severity: 'satisfied', code, message, path: pathValue, field }
}

function arrayLength(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null
}

function asRecord(value: unknown): JsonRecord | null {
  return isJsonRecord(value) ? value : null
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function booleanValue(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function looksLikeSourceAuthorityPath(filePath: string): boolean {
  const normalized = filePath.replaceAll('\\', '/').toLowerCase()
  return (
    normalized.includes('source-authority') ||
    normalized.includes('/source-authority') ||
    normalized.endsWith('project-profile.json') ||
    normalized.endsWith('extension-manifest.json') ||
    normalized.endsWith('package.json') ||
    normalized.endsWith('sbom-artifact.json') ||
    normalized.endsWith('provenance-attestation.json') ||
    normalized.endsWith('provenance-attestation-artifact.json')
  )
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(root, filePath)
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
