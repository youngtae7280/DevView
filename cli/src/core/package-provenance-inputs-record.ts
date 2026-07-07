import { createHash } from 'node:crypto'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { findPluginRoot, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'

type JsonRecord = Record<string, unknown>

const REPORT_ROLE = 'devview-package-provenance-inputs-record'
const RECORDED_STATUS = 'devview-package-provenance-inputs-recorded'
const BLOCKED_STATUS = 'devview-package-provenance-inputs-blocked'
const RELEASE_SURFACE_ROLE = 'devview-release-surface-validation-report'
const RELEASE_SURFACE_STATUS = 'devview-release-surface-validation-passed'
const RELEASE_PROVENANCE_READINESS_ROLE = 'devview-release-provenance-readiness-report'
const RELEASE_PROVENANCE_READINESS_STATUS = 'devview-release-provenance-readiness-reported'
const SBOM_VALIDATION_ROLE = 'devview-sbom-validation-report'
const SBOM_VALIDATION_STATUS = 'devview-sbom-validation-passed'

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

const unsupportedProvenanceAuthorityFields = [
  'packagePublished',
  'publishingPerformed',
  'packageArtifactGeneratedByDevView',
  'packageArtifactGenerated',
  'packageTarballGenerated',
  'packageCreated',
  'packageFileWritten',
  'packageSigningPresent',
  'packageSigned',
  'packageSignaturePresent',
  'packageSignatureVerified',
  'sbomGeneratedByDevView',
  'sbomGenerated',
  'sbomCreated',
  'sbomFileWritten',
  'sbomAttested',
  'provenanceAttestationPresent',
  'provenanceAttested',
  'releaseProvenanceAttested',
  'npmProvenanceEnabled',
  'slsaProvenanceGenerated',
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

const unsafeLabelTokens = ['&&', '||', ';', '|', '`', '$(', '<', '>', '\n', '\r']

export interface PackageProvenanceInputsRecordOptions {
  packageJson?: string
  releaseSurfaceValidation?: string
  releaseProvenanceReadiness?: string
  sbomValidation?: string
  sourceRef?: string
  buildCommand?: string
  output?: string
  markdown?: string
}

export interface PackageProvenanceInputsFinding {
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
  sourceKind: 'package-json' | 'release-surface-validation' | 'release-provenance-readiness' | 'sbom-validation'
  record: JsonRecord | null
  readError: string | null
  sha256: string | null
  byteLength: number | null
}

export interface PackageProvenanceInputsRecord {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof RECORDED_STATUS | typeof BLOCKED_STATUS
  provenanceInputsScope: 'package-provenance-inputs-report-only'
  sourceFactsOnly: true
  reportOnly: true
  packageProvenanceInputsStatus: 'recorded-source-inputs-only' | 'blocked'
  packageMetadataSummary: {
    supplied: boolean
    path: string
    packageName: string | null
    packageVersion: string | null
    packagePrivate: boolean | null
    packageFilesAllowlistPresent: boolean
    packageFilesAllowlistCount: number
    packageFilesAllowlistEntries: string[]
    packageJsonSha256: string | null
    packageJsonByteLength: number | null
  }
  sourceRefSummary: {
    sourceRefStatus: 'supplied-explicit-cli-input' | 'not-supplied'
    value: string | null
    sourceRefVerified: false
    verificationMode: 'explicit-input-not-verified' | 'not-supplied'
  }
  buildInputSummary: {
    buildCommandLabelStatus: 'supplied-metadata-only' | 'not-supplied'
    buildCommandLabel: string | null
    buildCommandExecuted: false
  }
  sourceArtifactDigests: Array<{
    sourceKind: string
    path: string
    artifactRole: string | null
    status: string | null
    sha256: string | null
    byteLength: number | null
  }>
  releaseSurfaceSourceSummary: {
    supplied: boolean
    path: string | null
    artifactRole: string | null
    status: string | null
    packageName: string | null
    packageVersion: string | null
    packageFileCount: number | null
    forbiddenFindingCount: number | null
  }
  releaseProvenanceReadinessSummary: {
    supplied: boolean
    path: string | null
    artifactRole: string | null
    status: string | null
    releaseProvenanceReadinessStatus: string | null
    sbomGenerated: boolean | null
    packageSigningPresent: boolean | null
    provenanceAttested: boolean | null
    findingCount: number | null
    downstreamActionCount: number | null
  }
  sbomValidationSummary: {
    supplied: boolean
    path: string | null
    artifactRole: string | null
    status: string | null
    sbomValidationStatus: string | null
    sbomFormat: string | null
    sbomSha256: string | null
    sbomByteLength: number | null
    packageName: string | null
    packageVersion: string | null
    packageIdentityAlignmentStatus: string | null
    componentCount: number | null
  }
  packageDigestStatus: 'not-computed-no-package-artifact-supplied'
  packageArtifactSupplied: false
  packageArtifactSha256: null
  provenanceAttestationStatus: 'not-generated'
  packageProvenanceFindings: PackageProvenanceInputsFinding[]
  downstreamActionPlan: string[]
  packagePublished: false
  publishingPerformed: false
  packageArtifactGeneratedByDevView: false
  packageArtifactGenerated: false
  packageTarballGenerated: false
  packageSigningPresent: false
  packageSigned: false
  packageSignaturePresent: false
  packageSignatureVerified: false
  sbomGeneratedByDevView: false
  sbomGenerated: false
  sbomAttested: false
  provenanceAttestationPresent: false
  provenanceAttested: false
  releaseProvenanceAttested: false
  npmProvenanceEnabled: false
  slsaProvenanceGenerated: false
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

export class PackageProvenanceInputsRecordValidationError extends Error {
  readonly report: PackageProvenanceInputsRecord

  constructor(report: PackageProvenanceInputsRecord) {
    super('Package provenance inputs recording is blocked.')
    this.report = report
  }
}

export async function recordPackageProvenanceInputs(
  root: string,
  options: PackageProvenanceInputsRecordOptions,
): Promise<PackageProvenanceInputsRecord> {
  validateRequiredOptions(options)
  const packageJsonPath = options.packageJson
    ? resolveRepoPath(root, options.packageJson)
    : path.join(findPluginRoot(import.meta.url), 'package.json')
  const sourcePaths = [
    packageJsonPath,
    options.releaseSurfaceValidation ? resolveRepoPath(root, options.releaseSurfaceValidation) : null,
    options.releaseProvenanceReadiness ? resolveRepoPath(root, options.releaseProvenanceReadiness) : null,
    options.sbomValidation ? resolveRepoPath(root, options.sbomValidation) : null,
  ].filter((entry): entry is string => Boolean(entry))
  await assertOutputAuthority(root, sourcePaths, options)

  const packageJson = await loadArtifact(root, packageJsonPath, 'package-json')
  const releaseSurface = options.releaseSurfaceValidation
    ? await loadArtifact(root, options.releaseSurfaceValidation, 'release-surface-validation')
    : null
  const releaseProvenance = options.releaseProvenanceReadiness
    ? await loadArtifact(root, options.releaseProvenanceReadiness, 'release-provenance-readiness')
    : null
  const sbomValidation = options.sbomValidation
    ? await loadArtifact(root, options.sbomValidation, 'sbom-validation')
    : null

  const blockingFindings = validateInputs(packageJson, releaseSurface, releaseProvenance, sbomValidation, options)
  if (blockingFindings.length > 0) {
    throw new PackageProvenanceInputsRecordValidationError(
      buildReport(packageJson, releaseSurface, releaseProvenance, sbomValidation, options, blockingFindings, true),
    )
  }

  const report = buildReport(
    packageJson,
    releaseSurface,
    releaseProvenance,
    sbomValidation,
    options,
    buildFindings(packageJson, releaseSurface, releaseProvenance, sbomValidation, options),
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
  packageJson: LoadedArtifact,
  releaseSurface: LoadedArtifact | null,
  releaseProvenance: LoadedArtifact | null,
  sbomValidation: LoadedArtifact | null,
  options: PackageProvenanceInputsRecordOptions,
  findings: PackageProvenanceInputsFinding[],
  blocked = false,
): PackageProvenanceInputsRecord {
  const packageRecord = packageJson.record ?? {}
  const packageFiles = stringArray(packageRecord.files)
  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : RECORDED_STATUS,
    provenanceInputsScope: 'package-provenance-inputs-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    packageProvenanceInputsStatus: blocked ? 'blocked' : 'recorded-source-inputs-only',
    packageMetadataSummary: {
      supplied: Boolean(packageJson.record),
      path: packageJson.relativePath,
      packageName: stringValue(packageRecord.name),
      packageVersion: stringValue(packageRecord.version),
      packagePrivate: booleanOrNull(packageRecord.private),
      packageFilesAllowlistPresent: packageFiles.length > 0,
      packageFilesAllowlistCount: packageFiles.length,
      packageFilesAllowlistEntries: packageFiles,
      packageJsonSha256: packageJson.sha256,
      packageJsonByteLength: packageJson.byteLength,
    },
    sourceRefSummary: {
      sourceRefStatus: options.sourceRef ? 'supplied-explicit-cli-input' : 'not-supplied',
      value: options.sourceRef ?? null,
      sourceRefVerified: false,
      verificationMode: options.sourceRef ? 'explicit-input-not-verified' : 'not-supplied',
    },
    buildInputSummary: {
      buildCommandLabelStatus: options.buildCommand ? 'supplied-metadata-only' : 'not-supplied',
      buildCommandLabel: options.buildCommand ?? null,
      buildCommandExecuted: false,
    },
    sourceArtifactDigests: sourceDigestEntries(packageJson, releaseSurface, releaseProvenance, sbomValidation),
    releaseSurfaceSourceSummary: releaseSurfaceSummary(releaseSurface),
    releaseProvenanceReadinessSummary: releaseProvenanceSummary(releaseProvenance),
    sbomValidationSummary: sbomValidationSummary(sbomValidation),
    packageDigestStatus: 'not-computed-no-package-artifact-supplied',
    packageArtifactSupplied: false,
    packageArtifactSha256: null,
    provenanceAttestationStatus: 'not-generated',
    packageProvenanceFindings: findings,
    downstreamActionPlan: downstreamActionPlan(findings),
    packagePublished: false,
    publishingPerformed: false,
    packageArtifactGeneratedByDevView: false,
    packageArtifactGenerated: false,
    packageTarballGenerated: false,
    packageSigningPresent: false,
    packageSigned: false,
    packageSignaturePresent: false,
    packageSignatureVerified: false,
    sbomGeneratedByDevView: false,
    sbomGenerated: false,
    sbomAttested: false,
    provenanceAttestationPresent: false,
    provenanceAttested: false,
    releaseProvenanceAttested: false,
    npmProvenanceEnabled: false,
    slsaProvenanceGenerated: false,
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
  packageJson: LoadedArtifact,
  releaseSurface: LoadedArtifact | null,
  releaseProvenance: LoadedArtifact | null,
  sbomValidation: LoadedArtifact | null,
  options: PackageProvenanceInputsRecordOptions,
): PackageProvenanceInputsFinding[] {
  const findings: PackageProvenanceInputsFinding[] = []
  validateLoadedArtifact(packageJson, 'PACKAGE_PROVENANCE_PACKAGE_JSON_READ_FAILED', findings)
  if (releaseSurface) validateLoadedArtifact(releaseSurface, 'PACKAGE_PROVENANCE_SOURCE_READ_FAILED', findings)
  if (releaseProvenance) validateLoadedArtifact(releaseProvenance, 'PACKAGE_PROVENANCE_SOURCE_READ_FAILED', findings)
  if (sbomValidation) validateLoadedArtifact(sbomValidation, 'PACKAGE_PROVENANCE_SOURCE_READ_FAILED', findings)
  validatePackageJson(packageJson, findings)
  if (releaseSurface) validateReleaseSurfaceSource(packageJson, releaseSurface, findings)
  if (releaseProvenance) validateReleaseProvenanceSource(packageJson, releaseProvenance, findings)
  if (sbomValidation) validateSbomValidationSource(packageJson, sbomValidation, findings)
  validateExplicitLabels(options, findings)
  for (const source of [packageJson, releaseSurface, releaseProvenance, sbomValidation].filter(
    (entry): entry is LoadedArtifact => Boolean(entry),
  )) {
    validateUnsafeAuthorityFlags(source, findings)
    validateUnsupportedAuthorityClaims(source, findings)
  }
  return findings
}

function validateLoadedArtifact(
  artifact: LoadedArtifact,
  readCode: string,
  findings: PackageProvenanceInputsFinding[],
): void {
  if (artifact.readError) {
    findings.push(blockingFinding(readCode, artifact.readError, artifact.relativePath))
    return
  }
  if (!artifact.record) {
    findings.push(
      blockingFinding(
        'PACKAGE_PROVENANCE_SOURCE_NOT_JSON_OBJECT',
        `${artifact.relativePath} must be a JSON object.`,
        artifact.relativePath,
      ),
    )
  }
}

function validatePackageJson(artifact: LoadedArtifact, findings: PackageProvenanceInputsFinding[]): void {
  const record = artifact.record ?? {}
  if (!stringValue(record.name)) {
    findings.push(
      blockingFinding(
        'PACKAGE_PROVENANCE_PACKAGE_NAME_MISSING',
        `${artifact.relativePath} must include package name.`,
        artifact.relativePath,
        'name',
      ),
    )
  }
  if (!stringValue(record.version)) {
    findings.push(
      blockingFinding(
        'PACKAGE_PROVENANCE_PACKAGE_VERSION_MISSING',
        `${artifact.relativePath} must include package version.`,
        artifact.relativePath,
        'version',
      ),
    )
  }
}

function validateReleaseSurfaceSource(
  packageJson: LoadedArtifact,
  source: LoadedArtifact,
  findings: PackageProvenanceInputsFinding[],
): void {
  const record = source.record ?? {}
  if (record.artifactRole !== RELEASE_SURFACE_ROLE || record.status !== RELEASE_SURFACE_STATUS) {
    findings.push(
      blockingFinding(
        'PACKAGE_PROVENANCE_RELEASE_SURFACE_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${RELEASE_SURFACE_ROLE} with passed status.`,
        source.relativePath,
      ),
    )
  }
  if ((numberValue(record.forbiddenFindingCount) ?? 0) > 0) {
    findings.push(
      blockingFinding(
        'PACKAGE_PROVENANCE_RELEASE_SURFACE_FORBIDDEN_FINDINGS',
        `${source.relativePath} includes forbidden release-surface findings.`,
        source.relativePath,
        'forbiddenFindingCount',
      ),
    )
  }
  validatePackageIdentityMatch(
    packageJson,
    source,
    stringValue(record.packageName),
    stringValue(record.packageVersion),
    findings,
  )
}

function validateReleaseProvenanceSource(
  packageJson: LoadedArtifact,
  source: LoadedArtifact,
  findings: PackageProvenanceInputsFinding[],
): void {
  const record = source.record ?? {}
  if (
    record.artifactRole !== RELEASE_PROVENANCE_READINESS_ROLE ||
    record.status !== RELEASE_PROVENANCE_READINESS_STATUS
  ) {
    findings.push(
      blockingFinding(
        'PACKAGE_PROVENANCE_RELEASE_PROVENANCE_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${RELEASE_PROVENANCE_READINESS_ROLE} with reported status.`,
        source.relativePath,
      ),
    )
  }
  const packageSummary = asRecord(record.packageMetadataSummary)
  validatePackageIdentityMatch(
    packageJson,
    source,
    stringValue(packageSummary?.packageName),
    stringValue(packageSummary?.packageVersion),
    findings,
  )
}

function validateSbomValidationSource(
  packageJson: LoadedArtifact,
  source: LoadedArtifact,
  findings: PackageProvenanceInputsFinding[],
): void {
  const record = source.record ?? {}
  if (record.artifactRole !== SBOM_VALIDATION_ROLE || record.status !== SBOM_VALIDATION_STATUS) {
    findings.push(
      blockingFinding(
        'PACKAGE_PROVENANCE_SBOM_VALIDATION_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${SBOM_VALIDATION_ROLE} with passed status.`,
        source.relativePath,
      ),
    )
  }
  const alignment = stringValue(asRecord(record.packageIdentityAlignment)?.alignmentStatus)
  if (alignment && alignment !== 'matched') {
    findings.push(
      blockingFinding(
        'PACKAGE_PROVENANCE_SBOM_PACKAGE_IDENTITY_NOT_MATCHED',
        `${source.relativePath} must report matched package identity alignment.`,
        source.relativePath,
        'packageIdentityAlignment.alignmentStatus',
      ),
    )
  }
  const sbomSummary = asRecord(record.sourceSbomArtifact)
  validatePackageIdentityMatch(
    packageJson,
    source,
    stringValue(sbomSummary?.packageName),
    stringValue(sbomSummary?.packageVersion),
    findings,
  )
}

function validatePackageIdentityMatch(
  packageJson: LoadedArtifact,
  source: LoadedArtifact,
  sourceName: string | null,
  sourceVersion: string | null,
  findings: PackageProvenanceInputsFinding[],
): void {
  const packageRecord = packageJson.record ?? {}
  const packageName = stringValue(packageRecord.name)
  const packageVersion = stringValue(packageRecord.version)
  if (packageName && sourceName && packageName !== sourceName) {
    findings.push(
      blockingFinding(
        'PACKAGE_PROVENANCE_PACKAGE_NAME_MISMATCH',
        `${source.relativePath} package name ${sourceName} does not match package.json ${packageName}.`,
        source.relativePath,
        'packageName',
      ),
    )
  }
  if (packageVersion && sourceVersion && packageVersion !== sourceVersion) {
    findings.push(
      blockingFinding(
        'PACKAGE_PROVENANCE_PACKAGE_VERSION_MISMATCH',
        `${source.relativePath} package version ${sourceVersion} does not match package.json ${packageVersion}.`,
        source.relativePath,
        'packageVersion',
      ),
    )
  }
}

function validateExplicitLabels(
  options: PackageProvenanceInputsRecordOptions,
  findings: PackageProvenanceInputsFinding[],
): void {
  for (const [label, value] of [
    ['source-ref', options.sourceRef],
    ['build-command', options.buildCommand],
  ] as const) {
    if (!value) continue
    if (unsafeLabelTokens.some((token) => value.includes(token))) {
      findings.push(
        blockingFinding(
          'PACKAGE_PROVENANCE_METADATA_LABEL_UNSAFE',
          `--${label} is metadata only and must not include shell control syntax.`,
          undefined,
          label,
        ),
      )
    }
  }
}

function validateUnsafeAuthorityFlags(source: LoadedArtifact, findings: PackageProvenanceInputsFinding[]): void {
  for (const hit of collectTrueFieldHits(source.record ?? {}, unsafeAuthorityFields)) {
    findings.push(
      blockingFinding(
        'PACKAGE_PROVENANCE_UNSAFE_SOURCE_AUTHORITY_FLAG',
        `${source.relativePath} claims unsafe authority field ${hit.field}: true.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
}

function validateUnsupportedAuthorityClaims(source: LoadedArtifact, findings: PackageProvenanceInputsFinding[]): void {
  for (const hit of collectTrueFieldHits(source.record ?? {}, unsupportedProvenanceAuthorityFields)) {
    findings.push(
      blockingFinding(
        'PACKAGE_PROVENANCE_AUTHORITY_CLAIM_UNSUPPORTED',
        `${source.relativePath} claims package/SBOM/signing/provenance authority field ${hit.field}: true.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
}

function buildFindings(
  packageJson: LoadedArtifact,
  releaseSurface: LoadedArtifact | null,
  releaseProvenance: LoadedArtifact | null,
  sbomValidation: LoadedArtifact | null,
  options: PackageProvenanceInputsRecordOptions,
): PackageProvenanceInputsFinding[] {
  const findings: PackageProvenanceInputsFinding[] = [
    satisfiedFinding(
      'PACKAGE_PROVENANCE_PACKAGE_JSON_DIGEST_RECORDED',
      'package.json byte digest and package metadata were recorded without creating a package artifact.',
      packageJson.relativePath,
    ),
    gapFinding(
      'PACKAGE_PROVENANCE_PACKAGE_DIGEST_NOT_COMPUTED',
      'No package artifact was supplied; package artifact digest remains not computed.',
    ),
    gapFinding(
      'PACKAGE_PROVENANCE_ATTESTATION_NOT_GENERATED',
      'No package provenance attestation, package signature, or SBOM was generated.',
    ),
  ]
  if (options.sourceRef) {
    findings.push(
      satisfiedFinding(
        'PACKAGE_PROVENANCE_SOURCE_REF_RECORDED',
        'Explicit source ref label was recorded without git verification.',
      ),
    )
  } else {
    findings.push(gapFinding('PACKAGE_PROVENANCE_SOURCE_REF_NOT_SUPPLIED', 'No explicit source ref was supplied.'))
  }
  if (options.buildCommand) {
    findings.push(
      satisfiedFinding(
        'PACKAGE_PROVENANCE_BUILD_COMMAND_LABEL_RECORDED',
        'Build command label was recorded as metadata only and was not executed.',
      ),
    )
  } else {
    findings.push(gapFinding('PACKAGE_PROVENANCE_BUILD_COMMAND_NOT_SUPPLIED', 'No build command label was supplied.'))
  }
  if (releaseSurface) {
    findings.push(
      satisfiedFinding(
        'PACKAGE_PROVENANCE_RELEASE_SURFACE_SOURCE_LINKED',
        'Release surface validation report is linked as a source fact.',
        releaseSurface.relativePath,
      ),
    )
  } else {
    findings.push(
      gapFinding('PACKAGE_PROVENANCE_RELEASE_SURFACE_NOT_SUPPLIED', 'Release surface validation was not supplied.'),
    )
  }
  if (releaseProvenance) {
    findings.push(
      satisfiedFinding(
        'PACKAGE_PROVENANCE_RELEASE_PROVENANCE_READINESS_LINKED',
        'Release provenance readiness report is linked as a source fact.',
        releaseProvenance.relativePath,
      ),
    )
  } else {
    findings.push(
      gapFinding(
        'PACKAGE_PROVENANCE_RELEASE_PROVENANCE_READINESS_NOT_SUPPLIED',
        'Release provenance readiness was not supplied.',
      ),
    )
  }
  if (sbomValidation) {
    findings.push(
      satisfiedFinding(
        'PACKAGE_PROVENANCE_SBOM_VALIDATION_LINKED',
        'SBOM validation report is linked as a source fact.',
        sbomValidation.relativePath,
      ),
    )
  } else {
    findings.push(gapFinding('PACKAGE_PROVENANCE_SBOM_VALIDATION_NOT_SUPPLIED', 'SBOM validation was not supplied.'))
  }
  return findings
}

function sourceDigestEntries(
  packageJson: LoadedArtifact,
  releaseSurface: LoadedArtifact | null,
  releaseProvenance: LoadedArtifact | null,
  sbomValidation: LoadedArtifact | null,
): PackageProvenanceInputsRecord['sourceArtifactDigests'] {
  return [
    sourceDigestEntry(packageJson),
    ...(releaseSurface ? [sourceDigestEntry(releaseSurface)] : []),
    ...(releaseProvenance ? [sourceDigestEntry(releaseProvenance)] : []),
    ...(sbomValidation ? [sourceDigestEntry(sbomValidation)] : []),
  ]
}

function sourceDigestEntry(source: LoadedArtifact): PackageProvenanceInputsRecord['sourceArtifactDigests'][number] {
  return {
    sourceKind: source.sourceKind,
    path: source.relativePath,
    artifactRole: stringValue(source.record?.artifactRole),
    status: stringValue(source.record?.status),
    sha256: source.sha256,
    byteLength: source.byteLength,
  }
}

function releaseSurfaceSummary(
  source: LoadedArtifact | null,
): PackageProvenanceInputsRecord['releaseSurfaceSourceSummary'] {
  const record = source?.record ?? null
  return {
    supplied: Boolean(source),
    path: source?.relativePath ?? null,
    artifactRole: stringValue(record?.artifactRole),
    status: stringValue(record?.status),
    packageName: stringValue(record?.packageName),
    packageVersion: stringValue(record?.packageVersion),
    packageFileCount: numberValue(record?.packageFileCount),
    forbiddenFindingCount: numberValue(record?.forbiddenFindingCount),
  }
}

function releaseProvenanceSummary(
  source: LoadedArtifact | null,
): PackageProvenanceInputsRecord['releaseProvenanceReadinessSummary'] {
  const record = source?.record ?? null
  return {
    supplied: Boolean(source),
    path: source?.relativePath ?? null,
    artifactRole: stringValue(record?.artifactRole),
    status: stringValue(record?.status),
    releaseProvenanceReadinessStatus: stringValue(record?.releaseProvenanceReadinessStatus),
    sbomGenerated: booleanOrNull(asRecord(record?.sbomReadiness)?.sbomGenerated),
    packageSigningPresent: booleanOrNull(asRecord(record?.packageSigningReadiness)?.packageSigningPresent),
    provenanceAttested: booleanOrNull(asRecord(record?.provenanceAttestationReadiness)?.provenanceAttested),
    findingCount: arrayLength(record?.releaseProvenanceFindings),
    downstreamActionCount: arrayLength(record?.downstreamActionPlan),
  }
}

function sbomValidationSummary(source: LoadedArtifact | null): PackageProvenanceInputsRecord['sbomValidationSummary'] {
  const record = source?.record ?? null
  const sbom = asRecord(record?.sourceSbomArtifact)
  const digest = asRecord(record?.digestSummary)
  const alignment = asRecord(record?.packageIdentityAlignment)
  const coverage = asRecord(record?.componentCoverageSummary)
  return {
    supplied: Boolean(source),
    path: source?.relativePath ?? null,
    artifactRole: stringValue(record?.artifactRole),
    status: stringValue(record?.status),
    sbomValidationStatus: stringValue(record?.sbomValidationStatus),
    sbomFormat: stringValue(sbom?.sbomFormat),
    sbomSha256: stringValue(digest?.sbomSha256),
    sbomByteLength: numberValue(digest?.sbomByteLength),
    packageName: stringValue(sbom?.packageName),
    packageVersion: stringValue(sbom?.packageVersion),
    packageIdentityAlignmentStatus: stringValue(alignment?.alignmentStatus),
    componentCount: numberValue(coverage?.componentCount),
  }
}

async function loadArtifact(
  root: string,
  requestedPath: string,
  sourceKind: LoadedArtifact['sourceKind'],
): Promise<LoadedArtifact> {
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
      sha256: createHash('sha256').update(bytes).digest('hex'),
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
  options: Pick<PackageProvenanceInputsRecordOptions, 'output' | 'markdown'>,
): Promise<void> {
  const outputPath = options.output ? resolveRepoPath(root, options.output) : null
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  if (!outputPath) throw new Error('security record-package-provenance-inputs requires --output <json>.')
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('Package provenance inputs JSON output and Markdown output must be different paths.')
  }
  const resolvedSources = sourcePaths.map((entry) => path.resolve(entry))
  for (const candidate of [outputPath, markdownPath].filter((entry): entry is string => Boolean(entry))) {
    const resolvedCandidate = path.resolve(candidate)
    if (resolvedSources.some((source) => source === resolvedCandidate)) {
      throw new Error(
        `Package provenance inputs output ${relativePath(root, candidate)} would overwrite a source input.`,
      )
    }
    const relativeTarget = relativePath(root, candidate)
    if (
      hasDevViewControlDirectory(relativeTarget) ||
      hasCodexControlDirectory(relativeTarget) ||
      hasHiddenControlDirectorySegment(relativeTarget)
    ) {
      throw new Error(`Package provenance inputs output ${relativeTarget} is inside a protected control path.`)
    }
    if (looksLikeSourceAuthorityPath(relativeTarget)) {
      throw new Error(`Package provenance inputs output ${relativeTarget} looks like a source authority artifact.`)
    }
  }
}

function validateRequiredOptions(options: PackageProvenanceInputsRecordOptions): void {
  if (!options.output) throw new Error('security record-package-provenance-inputs requires --output <json>.')
}

function downstreamActionPlan(findings: PackageProvenanceInputsFinding[]): string[] {
  const actions = new Set<string>()
  if (findings.some((finding) => finding.severity === 'blocker')) {
    actions.add('Fix source role/status, package identity, metadata label, or unsafe authority blockers.')
  }
  actions.add('Integrate this package provenance inputs record into enterprise readiness as a source fact.')
  actions.add('Capture a package artifact digest in a future report-only slice without creating package signatures.')
  actions.add('Validate provenance attestation structure before any real provenance attestation generation.')
  actions.add('Keep package signing, SBOM generation, and provenance attestation behind signing/key/RBAC governance.')
  return [...actions]
}

function renderMarkdown(report: PackageProvenanceInputsRecord): string {
  return [
    '# DevView Package Provenance Inputs',
    '',
    `- status: ${report.status}`,
    `- package: ${report.packageMetadataSummary.packageName ?? 'unknown'}@${report.packageMetadataSummary.packageVersion ?? 'unknown'}`,
    `- sourceRefStatus: ${report.sourceRefSummary.sourceRefStatus}`,
    `- buildCommandLabelStatus: ${report.buildInputSummary.buildCommandLabelStatus}`,
    `- packageDigestStatus: ${report.packageDigestStatus}`,
    `- provenanceAttestationStatus: ${report.provenanceAttestationStatus}`,
    `- sourceArtifactDigestCount: ${report.sourceArtifactDigests.length}`,
    `- packageSigned: ${report.packageSigned}`,
    `- sbomGenerated: ${report.sbomGenerated}`,
    `- provenanceAttested: ${report.provenanceAttested}`,
    '',
    '## Findings',
    ...report.packageProvenanceFindings.map((finding) => `- [${finding.severity}] ${finding.code}: ${finding.message}`),
    '',
  ].join('\n')
}

function blockingFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): PackageProvenanceInputsFinding {
  return { severity: 'blocker', code, message, path: pathValue, field }
}

function gapFinding(code: string, message: string, pathValue?: string, field?: string): PackageProvenanceInputsFinding {
  return { severity: 'gap', code, message, path: pathValue, field }
}

function satisfiedFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): PackageProvenanceInputsFinding {
  return { severity: 'satisfied', code, message, path: pathValue, field }
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
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

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function booleanOrNull(value: unknown): boolean | null {
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
    normalized.endsWith('sbom-artifact.json')
  )
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(root, filePath)
}
