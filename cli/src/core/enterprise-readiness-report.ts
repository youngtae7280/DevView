import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'

type JsonRecord = Record<string, unknown>

const REPORT_ROLE = 'devview-enterprise-readiness-report'
const GENERATED_STATUS = 'devview-enterprise-readiness-report-generated'
const BLOCKED_STATUS = 'devview-enterprise-readiness-blocked'
const BENCHMARK_GOVERNANCE_ROLE = 'devview-benchmark-governance-verification-report'
const BENCHMARK_GOVERNANCE_STATUSES = [
  'devview-benchmark-governance-verified',
  'devview-benchmark-governance-partial',
] as const
const RELEASE_SURFACE_ROLE = 'devview-release-surface-validation-report'
const RELEASE_SURFACE_STATUSES = [
  'devview-release-surface-validation-passed',
  'devview-release-surface-validation-failed',
] as const
const PROVIDER_NETWORK_POLICY_ROLE = 'devview-provider-network-default-deny-policy-report'
const PROVIDER_NETWORK_POLICY_STATUS = 'devview-provider-network-default-deny-policy-recorded'
const RECORD_ENVELOPE_PREVIEW_ROLE = 'devview-record-envelope-preview'
const RECORD_ENVELOPE_PREVIEW_STATUS = 'devview-record-envelope-previewed'
const RECORD_ENVELOPE_PREVIEW_SIGNATURE_MODE = 'unsigned-deterministic-preview'
const RECORD_ENVELOPE_VERIFICATION_ROLE = 'devview-record-envelope-verification-report'
const RECORD_ENVELOPE_VERIFICATION_STATUS = 'devview-record-envelope-verified'
const RECORD_ENVELOPE_VERIFICATION_SIGNATURE_MODE = 'not-performed-unsigned-preview-only'
const SIGNING_READINESS_ROLE = 'devview-signing-readiness-report'
const SIGNING_READINESS_STATUS = 'devview-signing-readiness-reported'
const RBAC_POLICY_VALIDATION_ROLE = 'devview-rbac-policy-validation-report'
const RBAC_POLICY_VALIDATION_STATUS = 'devview-rbac-policy-validation-passed'
const RELEASE_PROVENANCE_READINESS_ROLE = 'devview-release-provenance-readiness-report'
const RELEASE_PROVENANCE_READINESS_STATUS = 'devview-release-provenance-readiness-reported'
const SBOM_VALIDATION_ROLE = 'devview-sbom-validation-report'
const SBOM_VALIDATION_STATUS = 'devview-sbom-validation-passed'
const PACKAGE_PROVENANCE_INPUTS_ROLE = 'devview-package-provenance-inputs-record'
const PACKAGE_PROVENANCE_INPUTS_STATUS = 'devview-package-provenance-inputs-recorded'
const PACKAGE_ARTIFACT_DIGEST_ROLE = 'devview-package-artifact-digest-record'
const PACKAGE_ARTIFACT_DIGEST_STATUS = 'devview-package-artifact-digest-recorded'
const PROVENANCE_ATTESTATION_VALIDATION_ROLE = 'devview-provenance-attestation-validation-report'
const PROVENANCE_ATTESTATION_VALIDATION_STATUS = 'devview-provenance-attestation-validation-passed'
const PROVENANCE_VERIFICATION_READINESS_ROLE = 'devview-provenance-verification-readiness-report'
const PROVENANCE_VERIFICATION_READINESS_STATUS = 'devview-provenance-verification-readiness-reported'

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

const signingReadinessAuthorityFields = [
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
  'signaturePolicyPresent',
  'signaturePolicyEnforced',
  'rbacEnforced',
  'permissionVerified',
  'rbacPermissionVerified',
]

const releaseProvenanceAuthorityFields = [
  'packageArtifactGeneratedByDevView',
  'packageArtifactGenerated',
  'packageArtifactSupplied',
  'packageTarballGenerated',
  'sbomGeneratedByDevView',
  'sbomGenerated',
  'sbomPresent',
  'sbomAttested',
  'sbomCreated',
  'sbomFileWritten',
  'packageSigningPresent',
  'packageSigned',
  'packageSignaturePresent',
  'packageSignatureVerified',
  'packagePublished',
  'publishingPerformed',
  'provenanceAttestationPresent',
  'provenanceAttestationGeneratedByDevView',
  'provenanceAttestationGenerated',
  'provenanceAttestationVerified',
  'provenanceAttested',
  'releaseProvenanceAttested',
  'npmProvenanceEnabled',
  'slsaProvenanceGenerated',
  'slsaProvenanceVerified',
  'realSlsaVerificationPerformed',
  'realInTotoVerificationPerformed',
  'inTotoStatementVerified',
  ...signingReadinessAuthorityFields,
]

export interface EnterpriseReadinessReportOptions {
  benchmarkGovernanceVerification?: string
  releaseSurfaceValidation?: string
  providerNetworkPolicyReport?: string
  recordEnvelopePreview?: string
  recordEnvelopeVerification?: string
  signingReadiness?: string
  rbacPolicyValidation?: string
  releaseProvenanceReadiness?: string
  sbomValidation?: string
  packageProvenanceInputs?: string
  packageArtifactDigest?: string
  provenanceAttestationValidation?: string
  provenanceVerificationReadiness?: string
  output?: string
  markdown?: string
}

export interface EnterpriseReadinessFinding {
  severity: 'blocker' | 'gap' | 'advisory' | 'satisfied'
  code: string
  message: string
  path?: string
  field?: string
}

export interface EnterpriseReadinessReport {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof GENERATED_STATUS | typeof BLOCKED_STATUS
  readinessScope: 'enterprise-hardening-readiness-report-only'
  readinessLevel: 'not-ready' | 'partial' | 'ready-for-static-benchmark-review-only'
  sourceFactsOnly: true
  reportOnly: true
  sourceBenchmarkGovernanceVerification: {
    supplied: boolean
    path: string | null
    artifactRole: string | null
    status: string | null
    enterpriseClaimReadiness: string | null
  }
  sourceReleaseSurfaceValidation: {
    supplied: boolean
    path: string | null
    artifactRole: string | null
    status: string | null
    forbiddenFindingCount: number | null
    packageFileCount: number | null
  }
  sourceProviderNetworkPolicyReport: {
    supplied: boolean
    path: string | null
    artifactRole: string | null
    status: string | null
    defaultProviderPolicy: string | null
    defaultNetworkPolicy: string | null
    explicitAllowSupported: boolean | null
    providerAllowlistCount: number | null
    networkAllowlistCount: number | null
    futureAllowRequirementCount: number | null
    blockedCapabilityCount: number | null
  }
  sourceRecordEnvelopePreviews: Array<{
    supplied: true
    path: string
    artifactRole: string | null
    status: string | null
    payloadArtifactRole: string | null
    payloadStatus: string | null
    payloadSha256Present: boolean
    envelopeSha256Present: boolean
    sourceArtifactDigestCount: number
    actorIdentityRecorded: boolean
    requiredPermission: string | null
    signatureMode: string | null
    cryptographicSignaturePresent: boolean | null
    cryptographicSignatureVerified: boolean | null
    rbacEnforced: boolean | null
    permissionVerified: boolean | null
    previousEnvelopeLinked: boolean | null
  }>
  sourceRecordEnvelopeVerifications: Array<{
    supplied: true
    path: string
    artifactRole: string | null
    status: string | null
    sourcePreviewPath: string | null
    sourcePreviewArtifactRole: string | null
    sourcePreviewStatus: string | null
    payloadPathMatches: boolean | null
    payloadDigestMatches: boolean | null
    payloadByteLengthMatches: boolean | null
    sourceArtifactExpectedCount: number | null
    sourceArtifactActualCount: number | null
    allSourceDigestsMatch: boolean | null
    previousEnvelopeRequired: boolean | null
    previousEnvelopeSupplied: boolean | null
    previousEnvelopeChainLinkVerified: boolean | null
    verificationDigestPresent: boolean
    signatureVerificationMode: string | null
    cryptographicSignatureVerified: boolean | null
    rbacPermissionVerified: boolean | null
    rbacEnforced: boolean | null
    permissionVerified: boolean | null
  }>
  sourceSigningReadinessReports: Array<{
    supplied: true
    path: string
    artifactRole: string | null
    status: string | null
    signingReadinessStatus: string | null
    envelopePreviewCount: number | null
    envelopeVerificationCount: number | null
    payloadDigestVerifiedCount: number | null
    sourceDigestVerifiedCount: number | null
    previousChainVerifiedCount: number | null
    signedEnvelopeCount: number | null
    keyGovernanceStatus: string | null
    keyRegistryPresent: boolean | null
    trustRootPresent: boolean | null
    privateKeyStoragePresent: boolean | null
    noPrivateKeyStorageInRepo: boolean | null
    signaturePolicyStatus: string | null
    detachedSignaturePolicyPresent: boolean | null
    signatureFormatPolicyPresent: boolean | null
    rbacActorModelPresent: boolean | null
    rbacPermissionMatrixPresent: boolean | null
    rbacRoleAssignmentRegistryPresent: boolean | null
    rbacEnforced: boolean | null
    permissionVerificationEnforced: boolean | null
    futureSignedEnvelopeRequirementCount: number | null
  }>
  sourceRbacPolicyValidationReports: Array<{
    supplied: true
    path: string
    artifactRole: string | null
    status: string | null
    rbacPolicyValidationStatus: string | null
    defaultDenyConfigured: boolean | null
    actorCount: number | null
    roleAssignmentCount: number | null
    permissionGrantCount: number | null
    automationRestrictionDeclared: boolean | null
    automationOvergrantCount: number | null
    extensionAuthorRestrictionDeclared: boolean | null
    extensionAuthorOvergrantCount: number | null
    policyFindingCount: number | null
    downstreamActionCount: number | null
    rbacEnforced: boolean | null
    permissionVerified: boolean | null
    cryptographicSignaturePresent: boolean | null
    cryptographicSignatureVerified: boolean | null
  }>
  sourceReleaseProvenanceReadinessReports: Array<{
    supplied: true
    path: string
    artifactRole: string | null
    status: string | null
    releaseProvenanceReadinessStatus: string | null
    packageName: string | null
    packageVersion: string | null
    packageFilesAllowlistPresent: boolean | null
    packageFilesAllowlistCount: number | null
    releaseSurfaceScriptPresent: boolean | null
    releaseSurfaceCheckerPresent: boolean | null
    sbomGenerated: boolean | null
    sbomPresent: boolean | null
    sbomAttested: boolean | null
    packageSigningPresent: boolean | null
    packageSignatureVerified: boolean | null
    provenanceAttestationPresent: boolean | null
    provenanceAttested: boolean | null
    findingCount: number | null
    downstreamActionCount: number | null
  }>
  sourceSbomValidationReports: Array<{
    supplied: true
    path: string
    artifactRole: string | null
    status: string | null
    sbomValidationStatus: string | null
    sbomFormat: string | null
    packageName: string | null
    packageVersion: string | null
    componentCount: number | null
    packageIdentityAlignmentStatus: string | null
    sbomSha256Present: boolean
    sourceArtifactDigestCount: number | null
    findingCount: number | null
    downstreamActionCount: number | null
    sbomGeneratedByDevView: boolean | null
    sbomGenerated: boolean | null
    sbomAttested: boolean | null
    packageSigned: boolean | null
    packageSigningPresent: boolean | null
    provenanceAttested: boolean | null
  }>
  sourcePackageProvenanceInputsRecords: Array<{
    supplied: true
    path: string
    artifactRole: string | null
    status: string | null
    packageProvenanceInputsStatus: string | null
    packageName: string | null
    packageVersion: string | null
    sourceArtifactDigestCount: number | null
    sourceRefStatus: string | null
    sourceRefSupplied: boolean
    buildCommandLabelStatus: string | null
    buildCommandLabelSupplied: boolean
    buildCommandExecuted: boolean | null
    packageDigestStatus: string | null
    packageArtifactSupplied: boolean | null
    packageArtifactSha256Present: boolean
    provenanceAttestationStatus: string | null
    releaseSurfaceSourceSupplied: boolean | null
    releaseProvenanceReadinessSupplied: boolean | null
    sbomValidationSupplied: boolean | null
    findingCount: number | null
    downstreamActionCount: number | null
    packageSigned: boolean | null
    packageSigningPresent: boolean | null
    sbomGenerated: boolean | null
    sbomAttested: boolean | null
    provenanceAttested: boolean | null
  }>
  sourcePackageArtifactDigestRecords: Array<{
    supplied: true
    path: string
    artifactRole: string | null
    status: string | null
    artifactDigestStatus: string | null
    packageArtifactPath: string | null
    fileName: string | null
    byteLength: number | null
    sha256Present: boolean
    expectedSha256Supplied: boolean | null
    expectedSha256Match: boolean | null
    packageName: string | null
    packageVersion: string | null
    packageIdentitySource: string | null
    sourceArtifactDigestCount: number | null
    packageProvenanceInputsLinked: boolean | null
    releaseSurfaceValidationLinked: boolean | null
    findingCount: number | null
    downstreamActionCount: number | null
    packageArtifactGeneratedByDevView: boolean | null
    packageArtifactGenerated: boolean | null
    packageTarballGenerated: boolean | null
    packagePublished: boolean | null
    packageSigned: boolean | null
    packageSigningPresent: boolean | null
    sbomGenerated: boolean | null
    sbomAttested: boolean | null
    provenanceAttested: boolean | null
  }>
  sourceProvenanceAttestationValidationReports: Array<{
    supplied: true
    path: string
    artifactRole: string | null
    status: string | null
    attestationValidationStatus: string | null
    signatureValidationStatus: string | null
    attestationFormat: string | null
    packageName: string | null
    packageVersion: string | null
    attestationSha256Present: boolean
    packageDigestAlignmentStatus: string | null
    packageDigestMatches: boolean | null
    provenanceInputAlignmentStatus: string | null
    provenanceInputMatches: boolean | null
    findingCount: number | null
    downstreamActionCount: number | null
    provenanceAttestationGeneratedByDevView: boolean | null
    provenanceAttestationGenerated: boolean | null
    provenanceAttestationVerified: boolean | null
    provenanceAttested: boolean | null
    packageSigned: boolean | null
    packageSigningPresent: boolean | null
    sbomAttested: boolean | null
    cryptographicSignatureVerified: boolean | null
  }>
  sourceProvenanceVerificationReadinessReports: Array<{
    supplied: true
    path: string
    artifactRole: string | null
    status: string | null
    provenanceVerificationReadinessStatus: string | null
    attestationValidationLinked: boolean | null
    signingReadinessLinked: boolean | null
    rbacPolicyValidationLinked: boolean | null
    recordEnvelopeVerificationLinked: boolean | null
    providerNetworkDefaultDenyLinked: boolean | null
    realSlsaVerificationPerformed: boolean | null
    realInTotoVerificationPerformed: boolean | null
    cryptographicSignatureVerified: boolean | null
    signatureVerificationStatus: string | null
    provenanceAttestationGenerated: boolean | null
    provenanceAttestationVerified: boolean | null
    keyRegistryPresent: boolean | null
    trustRootPresent: boolean | null
    findingCount: number | null
    downstreamActionCount: number | null
  }>
  releaseSurfaceReadiness: {
    status: 'satisfied' | 'failed' | 'not-supplied'
    packageAllowlistPresent: boolean
    releaseSurfaceCheckerAvailable: true
    forbiddenFindingCount: number | null
    gaps: string[]
  }
  releaseProvenanceReadiness: {
    status: 'gap' | 'readiness-recorded'
    sourceCount: number
    sourceStatuses: string[]
    packageName: string | null
    packageVersion: string | null
    packageFilesAllowlistPresentCount: number
    packageFilesAllowlistCount: number
    releaseSurfaceScriptPresentCount: number
    releaseSurfaceCheckerPresentCount: number
    sbomGeneratedCount: number
    sbomPresentCount: number
    sbomAttestedCount: number
    packageSigningPresentCount: number
    packageSignatureVerifiedCount: number
    provenanceAttestationPresentCount: number
    provenanceAttestedCount: number
    findingCount: number
    downstreamActionCount: number
    gaps: string[]
  }
  sbomValidationReadiness: {
    status: 'gap' | 'structural-validation-recorded'
    sourceCount: number
    sourceStatuses: string[]
    sbomValidationStatuses: string[]
    sbomFormats: string[]
    packageIdentityMatchedCount: number
    componentCount: number
    sbomByteDigestPresentCount: number
    sourceArtifactDigestCount: number
    findingCount: number
    downstreamActionCount: number
    sbomGeneratedByDevViewCount: number
    sbomGeneratedCount: number
    sbomAttestedCount: number
    packageSignedCount: number
    packageSigningPresentCount: number
    provenanceAttestedCount: number
    gaps: string[]
  }
  packageProvenanceInputsReadiness: {
    status: 'gap' | 'inputs-recorded'
    sourceCount: number
    sourceStatuses: string[]
    packageProvenanceInputsStatuses: string[]
    packageNames: string[]
    packageVersions: string[]
    sourceArtifactDigestCount: number
    sourceRefSuppliedCount: number
    sourceRefStatuses: string[]
    buildCommandLabelSuppliedCount: number
    buildCommandLabelStatuses: string[]
    packageDigestComputedCount: number
    packageDigestStatuses: string[]
    provenanceAttestationGeneratedCount: number
    provenanceAttestationStatuses: string[]
    releaseSurfaceSourceLinkedCount: number
    sbomValidationLinkedCount: number
    findingCount: number
    downstreamActionCount: number
    gaps: string[]
  }
  packageArtifactDigestReadiness: {
    status: 'gap' | 'artifact-digest-recorded'
    sourceCount: number
    sourceStatuses: string[]
    artifactDigestStatuses: string[]
    artifactDigestComputedCount: number
    expectedDigestMatchedCount: number
    packageArtifactGeneratedByDevViewCount: number
    packageArtifactGeneratedCount: number
    packageSignedCount: number
    provenanceAttestedCount: number
    packageNames: string[]
    packageVersions: string[]
    sourceArtifactDigestCount: number
    packageProvenanceInputsLinkedCount: number
    releaseSurfaceValidationLinkedCount: number
    findingCount: number
    downstreamActionCount: number
    gaps: string[]
  }
  provenanceAttestationValidationReadiness: {
    status: 'gap' | 'structural-validation-recorded'
    sourceCount: number
    sourceStatuses: string[]
    attestationValidationStatuses: string[]
    attestationFormats: string[]
    attestationDigestPresentCount: number
    packageDigestMatchedCount: number
    provenanceInputMatchedCount: number
    signatureValidationStatuses: string[]
    provenanceAttestationGeneratedByDevViewCount: number
    provenanceAttestationGeneratedCount: number
    provenanceAttestationVerifiedCount: number
    provenanceAttestedCount: number
    packageSignedCount: number
    packageSigningPresentCount: number
    sbomAttestedCount: number
    cryptographicSignatureVerifiedCount: number
    findingCount: number
    downstreamActionCount: number
    gaps: string[]
  }
  provenanceVerificationReadiness: {
    status: 'gap' | 'verification-readiness-recorded'
    sourceCount: number
    sourceStatuses: string[]
    readinessStatuses: string[]
    staticAttestationValidationLinkedCount: number
    signingReadinessLinkedCount: number
    rbacPolicyValidationLinkedCount: number
    recordEnvelopeVerificationLinkedCount: number
    providerNetworkDefaultDenyLinkedCount: number
    realSlsaVerificationPerformedCount: number
    realInTotoVerificationPerformedCount: number
    cryptographicSignatureVerifiedCount: number
    keyRegistryPresentCount: number
    trustRootPresentCount: number
    findingCount: number
    downstreamActionCount: number
    gaps: string[]
  }
  extensionExecutionReadiness: {
    status: 'partial'
    declarativeReportOnlyChainPresent: true
    extensionExecutionDisabled: true
    gaps: string[]
  }
  guardedGraphUpdateReadiness: {
    status: 'partial'
    actualApplyCommandPresent: true
    explicitOperatorAuthorizationRequired: true
    backupHashCheckRollbackPresent: true
    gaps: string[]
  }
  benchmarkGovernanceReadiness: {
    status: 'not-supplied' | 'partial' | 'verified-for-static-benchmark-only' | 'not-ready'
    sourceStatus: string | null
    evaluatorVersionStatus: string | null
    scoringRubricVersionStatus: string | null
    sourceDigestCount: number | null
    combinedDigestMatches: boolean | null
    goldenReviewStatus: string | null
    heldOutPolicyStatus: string | null
    graphifyImportStatus: string | null
    gaps: string[]
  }
  providerNetworkPolicyReadiness: {
    status: 'gap' | 'default-deny-recorded'
    currentReportsProviderNetworkFalse: true
    sourceStatus: string | null
    defaultProviderPolicy: string | null
    defaultNetworkPolicy: string | null
    explicitAllowSupported: boolean | null
    providerAllowlistEmpty: boolean | null
    networkAllowlistEmpty: boolean | null
    futureAllowRequirementCount: number | null
    blockedCapabilityCount: number | null
    gaps: string[]
  }
  scopeCiGovernanceReadiness: {
    status: 'gap'
    scopeCiRecordLifecyclePresent: true
    externalCiMutationDisabled: true
    gaps: string[]
  }
  rbacAndSigningReadiness: {
    status: 'gap'
    actorIdentityModelPresent: false
    signedRecordEnvelopePresent: false
    unsignedRecordEnvelopePreviewPresent: boolean
    unsignedRecordEnvelopePreviewCount: number
    unsignedRecordEnvelopeVerificationPresent: boolean
    recordEnvelopeVerificationCount: number
    payloadDigestVerifiedCount: number
    sourceDigestsVerifiedCount: number
    previousEnvelopeChainLinkVerifiedCount: number
    recordedActorIdentityCount: number
    recordedPermissionClaimCount: number
    signingReadinessReportPresent: boolean
    signingReadinessReportCount: number
    signingReadinessStatus: string | null
    signingReadinessStatuses: string[]
    keyGovernanceReadinessStatus: string | null
    keyRegistryPresentCount: number
    trustRootPresentCount: number
    privateKeyStoragePresentCount: number
    noPrivateKeyStorageInRepoCount: number
    signaturePolicyReadinessStatus: string | null
    signaturePolicyPresentCount: number
    rbacPrerequisiteActorModelPresentCount: number
    rbacPrerequisitePermissionMatrixPresentCount: number
    rbacRoleAssignmentRegistryPresentCount: number
    rbacPolicyValidationReportPresent: boolean
    rbacPolicyValidationReportCount: number
    rbacPolicyValidationStatuses: string[]
    defaultDenyPolicyValidatedCount: number
    validatedRbacActorCount: number
    validatedRbacRoleAssignmentCount: number
    validatedRbacPermissionGrantCount: number
    automationRestrictionDeclaredCount: number
    extensionAuthorRestrictionDeclaredCount: number
    rbacPolicyValidationFindingCount: number
    rbacPolicyValidationDownstreamActionCount: number
    futureSignedEnvelopeRequirementCount: number
    gaps: string[]
  }
  auditAndTamperEvidenceReadiness: {
    status: 'partial'
    benchmarkLockDigestsPresent: boolean
    sourceFactSeparationPresent: true
    unsignedRecordEnvelopePreviewPresent: boolean
    unsignedRecordEnvelopeVerificationPresent: boolean
    envelopePreviewCount: number
    envelopeVerificationCount: number
    envelopePayloadHashRecordedCount: number
    envelopeSourceArtifactDigestCount: number
    previousEnvelopeLinkedCount: number
    envelopePayloadDigestVerifiedCount: number
    envelopeSourceDigestsVerifiedCount: number
    previousEnvelopeChainLinkVerifiedCount: number
    gaps: string[]
  }
  enterpriseReadinessFindings: EnterpriseReadinessFinding[]
  downstreamActionPlan: string[]
  enterpriseGateActivated: false
  benchmarkExecuted: false
  candidateExecuted: false
  graphifyExecuted: false
  nativeBenchmarkExecuted: false
  providerInvoked: false
  networkCallMade: false
  apiCallMade: false
  shellCommandsExecuted: false
  extensionExecutionAllowed: false
  extensionsExecuted: false
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

interface LoadedSource {
  requestedPath: string
  resolvedPath: string
  relativePath: string
  sourceKind:
    | 'benchmark-governance-verification'
    | 'release-surface-validation'
    | 'provider-network-policy-report'
    | 'record-envelope-preview'
    | 'record-envelope-verification'
    | 'signing-readiness-report'
    | 'rbac-policy-validation-report'
    | 'release-provenance-readiness-report'
    | 'sbom-validation-report'
    | 'package-provenance-inputs-record'
    | 'package-artifact-digest-record'
    | 'provenance-attestation-validation-report'
    | 'provenance-verification-readiness-report'
  record: JsonRecord | null
  readError: string | null
}

export class EnterpriseReadinessReportValidationError extends Error {
  readonly report: EnterpriseReadinessReport

  constructor(report: EnterpriseReadinessReport) {
    super('Enterprise readiness reporting is blocked.')
    this.report = report
  }
}

export async function reportEnterpriseReadiness(
  root: string,
  options: EnterpriseReadinessReportOptions,
): Promise<EnterpriseReadinessReport> {
  validateRequiredOptions(options)
  const recordEnvelopePreviewPaths = parseList(options.recordEnvelopePreview)
  const recordEnvelopeVerificationPaths = parseList(options.recordEnvelopeVerification)
  const signingReadinessPaths = parseList(options.signingReadiness)
  const rbacPolicyValidationPaths = parseList(options.rbacPolicyValidation)
  const releaseProvenanceReadinessPaths = parseList(options.releaseProvenanceReadiness)
  const sbomValidationPaths = parseList(options.sbomValidation)
  const packageProvenanceInputsPaths = parseList(options.packageProvenanceInputs)
  const packageArtifactDigestPaths = parseList(options.packageArtifactDigest)
  const provenanceAttestationValidationPaths = parseList(options.provenanceAttestationValidation)
  const provenanceVerificationReadinessPaths = parseList(options.provenanceVerificationReadiness)
  const sourcePaths = [
    options.benchmarkGovernanceVerification,
    options.releaseSurfaceValidation,
    options.providerNetworkPolicyReport,
    ...recordEnvelopePreviewPaths,
    ...recordEnvelopeVerificationPaths,
    ...signingReadinessPaths,
    ...rbacPolicyValidationPaths,
    ...releaseProvenanceReadinessPaths,
    ...sbomValidationPaths,
    ...packageProvenanceInputsPaths,
    ...packageArtifactDigestPaths,
    ...provenanceAttestationValidationPaths,
    ...provenanceVerificationReadinessPaths,
  ].filter((entry): entry is string => Boolean(entry))
  await assertOutputAuthority(
    root,
    sourcePaths.map((entry) => resolveRepoPath(root, entry)),
    options,
  )

  const benchmarkGovernance = options.benchmarkGovernanceVerification
    ? await loadSource(root, options.benchmarkGovernanceVerification, 'benchmark-governance-verification')
    : null
  const releaseSurface = options.releaseSurfaceValidation
    ? await loadSource(root, options.releaseSurfaceValidation, 'release-surface-validation')
    : null
  const providerNetworkPolicy = options.providerNetworkPolicyReport
    ? await loadSource(root, options.providerNetworkPolicyReport, 'provider-network-policy-report')
    : null
  const recordEnvelopePreviews = await Promise.all(
    recordEnvelopePreviewPaths.map((entry) => loadSource(root, entry, 'record-envelope-preview')),
  )
  const recordEnvelopeVerifications = await Promise.all(
    recordEnvelopeVerificationPaths.map((entry) => loadSource(root, entry, 'record-envelope-verification')),
  )
  const signingReadinessReports = await Promise.all(
    signingReadinessPaths.map((entry) => loadSource(root, entry, 'signing-readiness-report')),
  )
  const rbacPolicyValidationReports = await Promise.all(
    rbacPolicyValidationPaths.map((entry) => loadSource(root, entry, 'rbac-policy-validation-report')),
  )
  const releaseProvenanceReadinessReports = await Promise.all(
    releaseProvenanceReadinessPaths.map((entry) => loadSource(root, entry, 'release-provenance-readiness-report')),
  )
  const sbomValidationReports = await Promise.all(
    sbomValidationPaths.map((entry) => loadSource(root, entry, 'sbom-validation-report')),
  )
  const packageProvenanceInputsRecords = await Promise.all(
    packageProvenanceInputsPaths.map((entry) => loadSource(root, entry, 'package-provenance-inputs-record')),
  )
  const packageArtifactDigestRecords = await Promise.all(
    packageArtifactDigestPaths.map((entry) => loadSource(root, entry, 'package-artifact-digest-record')),
  )
  const provenanceAttestationValidationReports = await Promise.all(
    provenanceAttestationValidationPaths.map((entry) =>
      loadSource(root, entry, 'provenance-attestation-validation-report'),
    ),
  )
  const provenanceVerificationReadinessReports = await Promise.all(
    provenanceVerificationReadinessPaths.map((entry) =>
      loadSource(root, entry, 'provenance-verification-readiness-report'),
    ),
  )
  const blockingFindings = validateSources(
    benchmarkGovernance,
    releaseSurface,
    providerNetworkPolicy,
    recordEnvelopePreviews,
    recordEnvelopeVerifications,
    signingReadinessReports,
    rbacPolicyValidationReports,
    releaseProvenanceReadinessReports,
    sbomValidationReports,
    packageProvenanceInputsRecords,
    packageArtifactDigestRecords,
    provenanceAttestationValidationReports,
    provenanceVerificationReadinessReports,
  )
  if (blockingFindings.length > 0) {
    throw new EnterpriseReadinessReportValidationError(
      buildReport(
        benchmarkGovernance,
        releaseSurface,
        providerNetworkPolicy,
        recordEnvelopePreviews,
        recordEnvelopeVerifications,
        signingReadinessReports,
        rbacPolicyValidationReports,
        releaseProvenanceReadinessReports,
        sbomValidationReports,
        packageProvenanceInputsRecords,
        packageArtifactDigestRecords,
        provenanceAttestationValidationReports,
        provenanceVerificationReadinessReports,
        blockingFindings,
        true,
      ),
    )
  }

  const report = buildReport(
    benchmarkGovernance,
    releaseSurface,
    providerNetworkPolicy,
    recordEnvelopePreviews,
    recordEnvelopeVerifications,
    signingReadinessReports,
    rbacPolicyValidationReports,
    releaseProvenanceReadinessReports,
    sbomValidationReports,
    packageProvenanceInputsRecords,
    packageArtifactDigestRecords,
    provenanceAttestationValidationReports,
    provenanceVerificationReadinessReports,
    buildFindings(
      benchmarkGovernance,
      releaseSurface,
      providerNetworkPolicy,
      recordEnvelopePreviews,
      recordEnvelopeVerifications,
      signingReadinessReports,
      rbacPolicyValidationReports,
      releaseProvenanceReadinessReports,
      sbomValidationReports,
      packageProvenanceInputsRecords,
      packageArtifactDigestRecords,
      provenanceAttestationValidationReports,
      provenanceVerificationReadinessReports,
    ),
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
  benchmarkGovernance: LoadedSource | null,
  releaseSurface: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  recordEnvelopePreviews: LoadedSource[],
  recordEnvelopeVerifications: LoadedSource[],
  signingReadinessReports: LoadedSource[],
  rbacPolicyValidationReports: LoadedSource[],
  releaseProvenanceReadinessReports: LoadedSource[],
  sbomValidationReports: LoadedSource[],
  packageProvenanceInputsRecords: LoadedSource[],
  packageArtifactDigestRecords: LoadedSource[],
  provenanceAttestationValidationReports: LoadedSource[],
  provenanceVerificationReadinessReports: LoadedSource[],
  findings: EnterpriseReadinessFinding[],
  blocked = false,
): EnterpriseReadinessReport {
  const benchmarkRecord = benchmarkGovernance?.record ?? null
  const releaseRecord = releaseSurface?.record ?? null
  const providerNetworkRecord = providerNetworkPolicy?.record ?? null
  const recordEnvelopeRecords = recordEnvelopePreviews.map((entry) => entry.record).filter(isJsonRecord)
  const recordEnvelopeVerificationRecords = recordEnvelopeVerifications
    .map((entry) => entry.record)
    .filter(isJsonRecord)
  const signingReadinessRecords = signingReadinessReports.map((entry) => entry.record).filter(isJsonRecord)
  const rbacPolicyValidationRecords = rbacPolicyValidationReports.map((entry) => entry.record).filter(isJsonRecord)
  const releaseProvenanceReadinessRecords = releaseProvenanceReadinessReports
    .map((entry) => entry.record)
    .filter(isJsonRecord)
  const sbomValidationRecords = sbomValidationReports.map((entry) => entry.record).filter(isJsonRecord)
  const packageProvenanceInputsJsonRecords = packageProvenanceInputsRecords
    .map((entry) => entry.record)
    .filter(isJsonRecord)
  const packageArtifactDigestJsonRecords = packageArtifactDigestRecords
    .map((entry) => entry.record)
    .filter(isJsonRecord)
  const provenanceAttestationValidationRecords = provenanceAttestationValidationReports
    .map((entry) => entry.record)
    .filter(isJsonRecord)
  const provenanceVerificationReadinessRecords = provenanceVerificationReadinessReports
    .map((entry) => entry.record)
    .filter(isJsonRecord)
  const releaseStatus = releaseReadinessStatus(releaseRecord)
  const benchmarkStatus = benchmarkReadinessStatus(benchmarkRecord)
  const benchmarkDigestSummary = asRecord(benchmarkRecord?.sourceDigestVerificationSummary)
  const benchmarkVersion = asRecord(benchmarkRecord?.versionVerification)
  const goldenReview = asRecord(benchmarkRecord?.goldenReviewGovernanceCheck)
  const heldOut = asRecord(benchmarkRecord?.heldOutPolicyCheck)
  const graphify = asRecord(benchmarkRecord?.graphifyImportGovernanceCheck)

  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : GENERATED_STATUS,
    readinessScope: 'enterprise-hardening-readiness-report-only',
    readinessLevel: blocked ? 'not-ready' : readinessLevel(findings),
    sourceFactsOnly: true,
    reportOnly: true,
    sourceBenchmarkGovernanceVerification: {
      supplied: Boolean(benchmarkGovernance),
      path: benchmarkGovernance?.relativePath ?? null,
      artifactRole: stringValue(benchmarkRecord?.artifactRole),
      status: stringValue(benchmarkRecord?.status),
      enterpriseClaimReadiness: stringValue(benchmarkRecord?.enterpriseClaimReadiness),
    },
    sourceReleaseSurfaceValidation: {
      supplied: Boolean(releaseSurface),
      path: releaseSurface?.relativePath ?? null,
      artifactRole: stringValue(releaseRecord?.artifactRole),
      status: stringValue(releaseRecord?.status),
      forbiddenFindingCount: numberValue(releaseRecord?.forbiddenFindingCount),
      packageFileCount: numberValue(releaseRecord?.packageFileCount),
    },
    sourceProviderNetworkPolicyReport: {
      supplied: Boolean(providerNetworkPolicy),
      path: providerNetworkPolicy?.relativePath ?? null,
      artifactRole: stringValue(providerNetworkRecord?.artifactRole),
      status: stringValue(providerNetworkRecord?.status),
      defaultProviderPolicy: stringValue(providerNetworkRecord?.defaultProviderPolicy),
      defaultNetworkPolicy: stringValue(providerNetworkRecord?.defaultNetworkPolicy),
      explicitAllowSupported: booleanOrNull(providerNetworkRecord?.explicitAllowSupported),
      providerAllowlistCount: arrayLength(providerNetworkRecord?.providerAllowlist),
      networkAllowlistCount: arrayLength(providerNetworkRecord?.networkAllowlist),
      futureAllowRequirementCount: arrayLength(providerNetworkRecord?.futureAllowPolicyRequirements),
      blockedCapabilityCount: arrayLength(providerNetworkRecord?.blockedCapabilities),
    },
    sourceRecordEnvelopePreviews: recordEnvelopePreviews.map((source) => recordEnvelopeSummary(source)),
    sourceRecordEnvelopeVerifications: recordEnvelopeVerifications.map((source) =>
      recordEnvelopeVerificationSummary(source),
    ),
    sourceSigningReadinessReports: signingReadinessReports.map((source) => signingReadinessSummary(source)),
    sourceRbacPolicyValidationReports: rbacPolicyValidationReports.map((source) => rbacPolicyValidationSummary(source)),
    sourceReleaseProvenanceReadinessReports: releaseProvenanceReadinessReports.map((source) =>
      releaseProvenanceReadinessSummary(source),
    ),
    sourceSbomValidationReports: sbomValidationReports.map((source) => sbomValidationSummary(source)),
    sourcePackageProvenanceInputsRecords: packageProvenanceInputsRecords.map((source) =>
      packageProvenanceInputsSummary(source),
    ),
    sourcePackageArtifactDigestRecords: packageArtifactDigestRecords.map((source) =>
      packageArtifactDigestSummary(source),
    ),
    sourceProvenanceAttestationValidationReports: provenanceAttestationValidationReports.map((source) =>
      provenanceAttestationValidationSummary(source),
    ),
    sourceProvenanceVerificationReadinessReports: provenanceVerificationReadinessReports.map((source) =>
      provenanceVerificationReadinessSummary(source),
    ),
    releaseSurfaceReadiness: {
      status: releaseStatus,
      packageAllowlistPresent: true,
      releaseSurfaceCheckerAvailable: true,
      forbiddenFindingCount: numberValue(releaseRecord?.forbiddenFindingCount),
      gaps: ['Package signing, SBOM, and package provenance attestations are not recorded in this v1 report.'],
    },
    releaseProvenanceReadiness: {
      status: releaseProvenanceReadinessRecords.length > 0 ? 'readiness-recorded' : 'gap',
      sourceCount: releaseProvenanceReadinessRecords.length,
      sourceStatuses: uniqueStrings(
        releaseProvenanceReadinessRecords.map((record) => stringValue(record.releaseProvenanceReadinessStatus)),
      ),
      packageName: stringValue(asRecord(releaseProvenanceReadinessRecords[0]?.packageMetadataSummary)?.packageName),
      packageVersion: stringValue(
        asRecord(releaseProvenanceReadinessRecords[0]?.packageMetadataSummary)?.packageVersion,
      ),
      packageFilesAllowlistPresentCount: releaseProvenanceReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.packageMetadataSummary)?.packageFilesAllowlistPresent),
      ).length,
      packageFilesAllowlistCount: releaseProvenanceReadinessRecords.reduce(
        (total, record) =>
          total + (numberValue(asRecord(record.packageMetadataSummary)?.packageFilesAllowlistCount) ?? 0),
        0,
      ),
      releaseSurfaceScriptPresentCount: releaseProvenanceReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.packageMetadataSummary)?.releaseSurfaceScriptPresent),
      ).length,
      releaseSurfaceCheckerPresentCount: releaseProvenanceReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.packageMetadataSummary)?.releaseSurfaceCheckerPresent),
      ).length,
      sbomGeneratedCount: releaseProvenanceReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.sbomReadiness)?.sbomGenerated),
      ).length,
      sbomPresentCount: releaseProvenanceReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.sbomReadiness)?.sbomPresent),
      ).length,
      sbomAttestedCount: releaseProvenanceReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.sbomReadiness)?.sbomAttested),
      ).length,
      packageSigningPresentCount: releaseProvenanceReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.packageSigningReadiness)?.packageSigningPresent),
      ).length,
      packageSignatureVerifiedCount: releaseProvenanceReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.packageSigningReadiness)?.packageSignatureVerified),
      ).length,
      provenanceAttestationPresentCount: releaseProvenanceReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.provenanceAttestationReadiness)?.provenanceAttestationPresent),
      ).length,
      provenanceAttestedCount: releaseProvenanceReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.provenanceAttestationReadiness)?.provenanceAttested),
      ).length,
      findingCount: releaseProvenanceReadinessRecords.reduce(
        (total, record) => total + (arrayLength(record.releaseProvenanceFindings) ?? 0),
        0,
      ),
      downstreamActionCount: releaseProvenanceReadinessRecords.reduce(
        (total, record) => total + (arrayLength(record.downstreamActionPlan) ?? 0),
        0,
      ),
      gaps: releaseProvenanceReadinessGaps(releaseProvenanceReadinessRecords),
    },
    sbomValidationReadiness: {
      status: sbomValidationRecords.length > 0 ? 'structural-validation-recorded' : 'gap',
      sourceCount: sbomValidationRecords.length,
      sourceStatuses: uniqueStrings(sbomValidationRecords.map((record) => stringValue(record.status))),
      sbomValidationStatuses: uniqueStrings(
        sbomValidationRecords.map((record) => stringValue(record.sbomValidationStatus)),
      ),
      sbomFormats: uniqueStrings(
        sbomValidationRecords.map((record) => stringValue(asRecord(record.sourceSbomArtifact)?.sbomFormat)),
      ),
      packageIdentityMatchedCount: sbomValidationRecords.filter(
        (record) => stringValue(asRecord(record.packageIdentityAlignment)?.alignmentStatus) === 'matched',
      ).length,
      componentCount: sbomValidationRecords.reduce(
        (total, record) => total + (numberValue(asRecord(record.componentCoverageSummary)?.componentCount) ?? 0),
        0,
      ),
      sbomByteDigestPresentCount: sbomValidationRecords.filter((record) =>
        Boolean(stringValue(asRecord(record.digestSummary)?.sbomSha256)),
      ).length,
      sourceArtifactDigestCount: sbomValidationRecords.reduce(
        (total, record) => total + (arrayLength(asRecord(record.digestSummary)?.sourceArtifactDigests) ?? 0),
        0,
      ),
      findingCount: sbomValidationRecords.reduce(
        (total, record) => total + (arrayLength(record.validationFindings) ?? 0),
        0,
      ),
      downstreamActionCount: sbomValidationRecords.reduce(
        (total, record) => total + (arrayLength(record.downstreamActionPlan) ?? 0),
        0,
      ),
      sbomGeneratedByDevViewCount: sbomValidationRecords.filter((record) => booleanValue(record.sbomGeneratedByDevView))
        .length,
      sbomGeneratedCount: sbomValidationRecords.filter((record) => booleanValue(record.sbomGenerated)).length,
      sbomAttestedCount: sbomValidationRecords.filter((record) => booleanValue(record.sbomAttested)).length,
      packageSignedCount: sbomValidationRecords.filter((record) => booleanValue(record.packageSigned)).length,
      packageSigningPresentCount: sbomValidationRecords.filter((record) => booleanValue(record.packageSigningPresent))
        .length,
      provenanceAttestedCount: sbomValidationRecords.filter((record) => booleanValue(record.provenanceAttested)).length,
      gaps: sbomValidationGaps(sbomValidationRecords),
    },
    packageProvenanceInputsReadiness: {
      status: packageProvenanceInputsJsonRecords.length > 0 ? 'inputs-recorded' : 'gap',
      sourceCount: packageProvenanceInputsJsonRecords.length,
      sourceStatuses: uniqueStrings(packageProvenanceInputsJsonRecords.map((record) => stringValue(record.status))),
      packageProvenanceInputsStatuses: uniqueStrings(
        packageProvenanceInputsJsonRecords.map((record) => stringValue(record.packageProvenanceInputsStatus)),
      ),
      packageNames: uniqueStrings(
        packageProvenanceInputsJsonRecords.map((record) =>
          stringValue(asRecord(record.packageMetadataSummary)?.packageName),
        ),
      ),
      packageVersions: uniqueStrings(
        packageProvenanceInputsJsonRecords.map((record) =>
          stringValue(asRecord(record.packageMetadataSummary)?.packageVersion),
        ),
      ),
      sourceArtifactDigestCount: packageProvenanceInputsJsonRecords.reduce(
        (total, record) => total + (arrayLength(record.sourceArtifactDigests) ?? 0),
        0,
      ),
      sourceRefSuppliedCount: packageProvenanceInputsJsonRecords.filter(
        (record) => stringValue(asRecord(record.sourceRefSummary)?.sourceRefStatus) === 'supplied-explicit-cli-input',
      ).length,
      sourceRefStatuses: uniqueStrings(
        packageProvenanceInputsJsonRecords.map((record) =>
          stringValue(asRecord(record.sourceRefSummary)?.sourceRefStatus),
        ),
      ),
      buildCommandLabelSuppliedCount: packageProvenanceInputsJsonRecords.filter(
        (record) =>
          stringValue(asRecord(record.buildInputSummary)?.buildCommandLabelStatus) === 'supplied-metadata-only',
      ).length,
      buildCommandLabelStatuses: uniqueStrings(
        packageProvenanceInputsJsonRecords.map((record) =>
          stringValue(asRecord(record.buildInputSummary)?.buildCommandLabelStatus),
        ),
      ),
      packageDigestComputedCount: packageProvenanceInputsJsonRecords.filter((record) =>
        Boolean(stringValue(record.packageArtifactSha256)),
      ).length,
      packageDigestStatuses: uniqueStrings(
        packageProvenanceInputsJsonRecords.map((record) => stringValue(record.packageDigestStatus)),
      ),
      provenanceAttestationGeneratedCount: packageProvenanceInputsJsonRecords.filter(
        (record) => stringValue(record.provenanceAttestationStatus) !== 'not-generated',
      ).length,
      provenanceAttestationStatuses: uniqueStrings(
        packageProvenanceInputsJsonRecords.map((record) => stringValue(record.provenanceAttestationStatus)),
      ),
      releaseSurfaceSourceLinkedCount: packageProvenanceInputsJsonRecords.filter((record) =>
        booleanValue(asRecord(record.releaseSurfaceSourceSummary)?.supplied),
      ).length,
      sbomValidationLinkedCount: packageProvenanceInputsJsonRecords.filter((record) =>
        booleanValue(asRecord(record.sbomValidationSummary)?.supplied),
      ).length,
      findingCount: packageProvenanceInputsJsonRecords.reduce(
        (total, record) => total + (arrayLength(record.packageProvenanceFindings) ?? 0),
        0,
      ),
      downstreamActionCount: packageProvenanceInputsJsonRecords.reduce(
        (total, record) => total + (arrayLength(record.downstreamActionPlan) ?? 0),
        0,
      ),
      gaps: packageProvenanceInputsGaps(packageProvenanceInputsJsonRecords),
    },
    packageArtifactDigestReadiness: {
      status: packageArtifactDigestJsonRecords.length > 0 ? 'artifact-digest-recorded' : 'gap',
      sourceCount: packageArtifactDigestJsonRecords.length,
      sourceStatuses: uniqueStrings(packageArtifactDigestJsonRecords.map((record) => stringValue(record.status))),
      artifactDigestStatuses: uniqueStrings(
        packageArtifactDigestJsonRecords.map((record) => stringValue(record.artifactDigestStatus)),
      ),
      artifactDigestComputedCount: packageArtifactDigestJsonRecords.filter((record) =>
        Boolean(stringValue(asRecord(record.sourcePackageArtifact)?.sha256)),
      ).length,
      expectedDigestMatchedCount: packageArtifactDigestJsonRecords.filter((record) =>
        booleanValue(asRecord(record.sourcePackageArtifact)?.expectedSha256Match),
      ).length,
      packageArtifactGeneratedByDevViewCount: packageArtifactDigestJsonRecords.filter((record) =>
        booleanValue(record.packageArtifactGeneratedByDevView),
      ).length,
      packageArtifactGeneratedCount: packageArtifactDigestJsonRecords.filter((record) =>
        booleanValue(record.packageArtifactGenerated),
      ).length,
      packageSignedCount: packageArtifactDigestJsonRecords.filter((record) => booleanValue(record.packageSigned))
        .length,
      provenanceAttestedCount: packageArtifactDigestJsonRecords.filter((record) =>
        booleanValue(record.provenanceAttested),
      ).length,
      packageNames: uniqueStrings(
        packageArtifactDigestJsonRecords.map((record) =>
          stringValue(asRecord(record.packageIdentitySummary)?.packageName),
        ),
      ),
      packageVersions: uniqueStrings(
        packageArtifactDigestJsonRecords.map((record) =>
          stringValue(asRecord(record.packageIdentitySummary)?.packageVersion),
        ),
      ),
      sourceArtifactDigestCount: packageArtifactDigestJsonRecords.reduce(
        (total, record) => total + (arrayLength(record.sourceArtifactDigests) ?? 0),
        0,
      ),
      packageProvenanceInputsLinkedCount: packageArtifactDigestJsonRecords.filter((record) =>
        booleanValue(asRecord(record.sourcePackageProvenanceInputs)?.supplied),
      ).length,
      releaseSurfaceValidationLinkedCount: packageArtifactDigestJsonRecords.filter((record) =>
        booleanValue(asRecord(record.sourceReleaseSurfaceValidation)?.supplied),
      ).length,
      findingCount: packageArtifactDigestJsonRecords.reduce(
        (total, record) => total + (arrayLength(record.packageDigestRecordFindings) ?? 0),
        0,
      ),
      downstreamActionCount: packageArtifactDigestJsonRecords.reduce(
        (total, record) => total + (arrayLength(record.downstreamActionPlan) ?? 0),
        0,
      ),
      gaps: packageArtifactDigestGaps(packageArtifactDigestJsonRecords),
    },
    provenanceAttestationValidationReadiness: {
      status: provenanceAttestationValidationRecords.length > 0 ? 'structural-validation-recorded' : 'gap',
      sourceCount: provenanceAttestationValidationRecords.length,
      sourceStatuses: uniqueStrings(provenanceAttestationValidationRecords.map((record) => stringValue(record.status))),
      attestationValidationStatuses: uniqueStrings(
        provenanceAttestationValidationRecords.map((record) => stringValue(record.attestationValidationStatus)),
      ),
      attestationFormats: uniqueStrings(
        provenanceAttestationValidationRecords.map((record) =>
          stringValue(asRecord(record.sourceAttestationArtifact)?.attestationFormat),
        ),
      ),
      attestationDigestPresentCount: provenanceAttestationValidationRecords.filter((record) =>
        Boolean(stringValue(asRecord(record.digestSummary)?.attestationSha256)),
      ).length,
      packageDigestMatchedCount: provenanceAttestationValidationRecords.filter((record) =>
        booleanValue(asRecord(record.packageDigestAlignment)?.packageDigestMatches),
      ).length,
      provenanceInputMatchedCount: provenanceAttestationValidationRecords.filter(
        (record) => stringValue(asRecord(record.provenanceInputAlignment)?.alignmentStatus) === 'matched',
      ).length,
      signatureValidationStatuses: uniqueStrings(
        provenanceAttestationValidationRecords.map((record) => stringValue(record.signatureValidationStatus)),
      ),
      provenanceAttestationGeneratedByDevViewCount: provenanceAttestationValidationRecords.filter((record) =>
        booleanValue(record.provenanceAttestationGeneratedByDevView),
      ).length,
      provenanceAttestationGeneratedCount: provenanceAttestationValidationRecords.filter((record) =>
        booleanValue(record.provenanceAttestationGenerated),
      ).length,
      provenanceAttestationVerifiedCount: provenanceAttestationValidationRecords.filter((record) =>
        booleanValue(record.provenanceAttestationVerified),
      ).length,
      provenanceAttestedCount: provenanceAttestationValidationRecords.filter((record) =>
        booleanValue(record.provenanceAttested),
      ).length,
      packageSignedCount: provenanceAttestationValidationRecords.filter((record) => booleanValue(record.packageSigned))
        .length,
      packageSigningPresentCount: provenanceAttestationValidationRecords.filter((record) =>
        booleanValue(record.packageSigningPresent),
      ).length,
      sbomAttestedCount: provenanceAttestationValidationRecords.filter((record) => booleanValue(record.sbomAttested))
        .length,
      cryptographicSignatureVerifiedCount: provenanceAttestationValidationRecords.filter((record) =>
        booleanValue(record.cryptographicSignatureVerified),
      ).length,
      findingCount: provenanceAttestationValidationRecords.reduce(
        (total, record) => total + (arrayLength(record.validationFindings) ?? 0),
        0,
      ),
      downstreamActionCount: provenanceAttestationValidationRecords.reduce(
        (total, record) => total + (arrayLength(record.downstreamActionPlan) ?? 0),
        0,
      ),
      gaps: provenanceAttestationValidationGaps(provenanceAttestationValidationRecords),
    },
    provenanceVerificationReadiness: {
      status: provenanceVerificationReadinessRecords.length > 0 ? 'verification-readiness-recorded' : 'gap',
      sourceCount: provenanceVerificationReadinessRecords.length,
      sourceStatuses: uniqueStrings(provenanceVerificationReadinessRecords.map((record) => stringValue(record.status))),
      readinessStatuses: uniqueStrings(
        provenanceVerificationReadinessRecords.map((record) =>
          stringValue(record.provenanceVerificationReadinessStatus),
        ),
      ),
      staticAttestationValidationLinkedCount: provenanceVerificationReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.sourceProvenanceAttestationValidation)?.supplied),
      ).length,
      signingReadinessLinkedCount: provenanceVerificationReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.sourceSigningReadiness)?.supplied),
      ).length,
      rbacPolicyValidationLinkedCount: provenanceVerificationReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.sourceRbacPolicyValidation)?.supplied),
      ).length,
      recordEnvelopeVerificationLinkedCount: provenanceVerificationReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.sourceRecordEnvelopeVerification)?.supplied),
      ).length,
      providerNetworkDefaultDenyLinkedCount: provenanceVerificationReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.sourceProviderNetworkPolicy)?.supplied),
      ).length,
      realSlsaVerificationPerformedCount: provenanceVerificationReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.verificationBoundary)?.realSlsaVerificationPerformed),
      ).length,
      realInTotoVerificationPerformedCount: provenanceVerificationReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.verificationBoundary)?.realInTotoVerificationPerformed),
      ).length,
      cryptographicSignatureVerifiedCount: provenanceVerificationReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.verificationBoundary)?.cryptographicSignatureVerified),
      ).length,
      keyRegistryPresentCount: provenanceVerificationReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.keyTrustReadiness)?.keyRegistryPresent),
      ).length,
      trustRootPresentCount: provenanceVerificationReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.keyTrustReadiness)?.trustRootPresent),
      ).length,
      findingCount: provenanceVerificationReadinessRecords.reduce(
        (total, record) => total + (arrayLength(record.provenanceVerificationFindings) ?? 0),
        0,
      ),
      downstreamActionCount: provenanceVerificationReadinessRecords.reduce(
        (total, record) => total + (arrayLength(record.downstreamActionPlan) ?? 0),
        0,
      ),
      gaps: provenanceVerificationReadinessGaps(provenanceVerificationReadinessRecords),
    },
    extensionExecutionReadiness: {
      status: 'partial',
      declarativeReportOnlyChainPresent: true,
      extensionExecutionDisabled: true,
      gaps: [
        'Signed extension manifests are not implemented.',
        'Extension RBAC, sandboxing, and default-deny network execution policy are not enforced yet.',
      ],
    },
    guardedGraphUpdateReadiness: {
      status: 'partial',
      actualApplyCommandPresent: true,
      explicitOperatorAuthorizationRequired: true,
      backupHashCheckRollbackPresent: true,
      gaps: [
        'Guarded apply records are not signed.',
        'Actor identity/RBAC and rollback drill evidence are not enterprise-governed yet.',
      ],
    },
    benchmarkGovernanceReadiness: {
      status: benchmarkStatus,
      sourceStatus: stringValue(benchmarkRecord?.status),
      evaluatorVersionStatus: stringValue(benchmarkVersion?.evaluatorVersionStatus),
      scoringRubricVersionStatus: stringValue(benchmarkVersion?.scoringRubricVersionStatus),
      sourceDigestCount: numberValue(benchmarkDigestSummary?.sourceArtifactDigestCount),
      combinedDigestMatches: booleanOrNull(benchmarkDigestSummary?.combinedDigestMatches),
      goldenReviewStatus: stringValue(goldenReview?.status),
      heldOutPolicyStatus: stringValue(heldOut?.status),
      graphifyImportStatus: stringValue(graphify?.status),
      gaps: benchmarkGovernanceGaps(benchmarkRecord),
    },
    providerNetworkPolicyReadiness: {
      status: providerNetworkRecord ? 'default-deny-recorded' : 'gap',
      currentReportsProviderNetworkFalse: true,
      sourceStatus: stringValue(providerNetworkRecord?.status),
      defaultProviderPolicy: stringValue(providerNetworkRecord?.defaultProviderPolicy),
      defaultNetworkPolicy: stringValue(providerNetworkRecord?.defaultNetworkPolicy),
      explicitAllowSupported: booleanOrNull(providerNetworkRecord?.explicitAllowSupported),
      providerAllowlistEmpty: providerNetworkRecord ? arrayLength(providerNetworkRecord.providerAllowlist) === 0 : null,
      networkAllowlistEmpty: providerNetworkRecord ? arrayLength(providerNetworkRecord.networkAllowlist) === 0 : null,
      futureAllowRequirementCount: arrayLength(providerNetworkRecord?.futureAllowPolicyRequirements),
      blockedCapabilityCount: arrayLength(providerNetworkRecord?.blockedCapabilities),
      gaps: providerNetworkPolicyGaps(providerNetworkRecord),
    },
    scopeCiGovernanceReadiness: {
      status: 'gap',
      scopeCiRecordLifecyclePresent: true,
      externalCiMutationDisabled: true,
      gaps: [
        'External branch protection and required check activation remain disabled.',
        'Scope/CI activation lacks enterprise actor identity and policy-gated rollout records.',
      ],
    },
    rbacAndSigningReadiness: {
      status: 'gap',
      actorIdentityModelPresent: false,
      signedRecordEnvelopePresent: false,
      unsignedRecordEnvelopePreviewPresent: recordEnvelopeRecords.length > 0,
      unsignedRecordEnvelopePreviewCount: recordEnvelopeRecords.length,
      unsignedRecordEnvelopeVerificationPresent: recordEnvelopeVerificationRecords.length > 0,
      recordEnvelopeVerificationCount: recordEnvelopeVerificationRecords.length,
      payloadDigestVerifiedCount: payloadDigestVerifiedCount(recordEnvelopeVerificationRecords),
      sourceDigestsVerifiedCount: sourceDigestsVerifiedCount(recordEnvelopeVerificationRecords),
      previousEnvelopeChainLinkVerifiedCount: previousEnvelopeChainLinkVerifiedCount(recordEnvelopeVerificationRecords),
      recordedActorIdentityCount: recordEnvelopeRecords.filter((record) =>
        booleanValue(asRecord(record.verificationSummary)?.actorIdentityRecorded),
      ).length,
      recordedPermissionClaimCount: recordEnvelopeRecords.filter((record) =>
        Boolean(stringValue(asRecord(record.authorizationClaim)?.requiredPermission)),
      ).length,
      signingReadinessReportPresent: signingReadinessRecords.length > 0,
      signingReadinessReportCount: signingReadinessRecords.length,
      signingReadinessStatus: stringValue(signingReadinessRecords[0]?.signingReadinessStatus),
      signingReadinessStatuses: uniqueStrings(
        signingReadinessRecords.map((record) => stringValue(record.signingReadinessStatus)),
      ),
      keyGovernanceReadinessStatus: stringValue(asRecord(signingReadinessRecords[0]?.keyGovernanceReadiness)?.status),
      keyRegistryPresentCount: signingReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.keyGovernanceReadiness)?.keyRegistryPresent),
      ).length,
      trustRootPresentCount: signingReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.keyGovernanceReadiness)?.trustRootPresent),
      ).length,
      privateKeyStoragePresentCount: signingReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.keyGovernanceReadiness)?.privateKeyStoragePresent),
      ).length,
      noPrivateKeyStorageInRepoCount: signingReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.keyGovernanceReadiness)?.noPrivateKeyStorageInRepo),
      ).length,
      signaturePolicyReadinessStatus: stringValue(
        asRecord(signingReadinessRecords[0]?.signaturePolicyReadiness)?.status,
      ),
      signaturePolicyPresentCount: signingReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.signaturePolicyReadiness)?.detachedSignaturePolicyPresent),
      ).length,
      rbacPrerequisiteActorModelPresentCount: signingReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.rbacPrerequisiteSummary)?.actorModelPresent),
      ).length,
      rbacPrerequisitePermissionMatrixPresentCount: signingReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.rbacPrerequisiteSummary)?.permissionMatrixPresent),
      ).length,
      rbacRoleAssignmentRegistryPresentCount: signingReadinessRecords.filter((record) =>
        booleanValue(asRecord(record.rbacPrerequisiteSummary)?.roleAssignmentRegistryPresent),
      ).length,
      rbacPolicyValidationReportPresent: rbacPolicyValidationRecords.length > 0,
      rbacPolicyValidationReportCount: rbacPolicyValidationRecords.length,
      rbacPolicyValidationStatuses: uniqueStrings(
        rbacPolicyValidationRecords.map((record) => stringValue(record.rbacPolicyValidationStatus)),
      ),
      defaultDenyPolicyValidatedCount: rbacPolicyValidationRecords.filter((record) =>
        booleanValue(asRecord(record.defaultDenyStatus)?.defaultDenyConfigured),
      ).length,
      validatedRbacActorCount: rbacPolicyValidationRecords.reduce(
        (total, record) => total + (numberValue(asRecord(record.actorSummary)?.actorCount) ?? 0),
        0,
      ),
      validatedRbacRoleAssignmentCount: rbacPolicyValidationRecords.reduce(
        (total, record) => total + (numberValue(asRecord(record.roleAssignmentSummary)?.assignmentCount) ?? 0),
        0,
      ),
      validatedRbacPermissionGrantCount: rbacPolicyValidationRecords.reduce(
        (total, record) => total + (numberValue(asRecord(record.permissionGrantSummary)?.grantCount) ?? 0),
        0,
      ),
      automationRestrictionDeclaredCount: rbacPolicyValidationRecords.filter((record) =>
        booleanValue(asRecord(record.automationRestrictionStatus)?.automationRestrictionDeclared),
      ).length,
      extensionAuthorRestrictionDeclaredCount: rbacPolicyValidationRecords.filter((record) =>
        booleanValue(asRecord(record.extensionAuthorRestrictionStatus)?.extensionAuthorRestrictionDeclared),
      ).length,
      rbacPolicyValidationFindingCount: rbacPolicyValidationRecords.reduce(
        (total, record) => total + (arrayLength(record.policyFindings) ?? 0),
        0,
      ),
      rbacPolicyValidationDownstreamActionCount: rbacPolicyValidationRecords.reduce(
        (total, record) => total + (arrayLength(record.downstreamActionPlan) ?? 0),
        0,
      ),
      futureSignedEnvelopeRequirementCount: signingReadinessRecords.reduce(
        (total, record) => total + (arrayLength(record.futureSignedEnvelopeRequirements) ?? 0),
        0,
      ),
      gaps: rbacAndSigningGaps(
        recordEnvelopeRecords,
        recordEnvelopeVerificationRecords,
        signingReadinessRecords,
        rbacPolicyValidationRecords,
      ),
    },
    auditAndTamperEvidenceReadiness: {
      status: 'partial',
      benchmarkLockDigestsPresent: numberValue(benchmarkDigestSummary?.sourceArtifactDigestCount) !== null,
      sourceFactSeparationPresent: true,
      unsignedRecordEnvelopePreviewPresent: recordEnvelopeRecords.length > 0,
      unsignedRecordEnvelopeVerificationPresent: recordEnvelopeVerificationRecords.length > 0,
      envelopePreviewCount: recordEnvelopeRecords.length,
      envelopeVerificationCount: recordEnvelopeVerificationRecords.length,
      envelopePayloadHashRecordedCount: recordEnvelopeRecords.filter((record) =>
        Boolean(stringValue(asRecord(record.payloadSummary)?.sha256)),
      ).length,
      envelopeSourceArtifactDigestCount: recordEnvelopeRecords.reduce(
        (total, record) => total + (arrayLength(record.sourceArtifactDigests) ?? 0),
        0,
      ),
      previousEnvelopeLinkedCount: recordEnvelopeRecords.filter((record) =>
        booleanValue(asRecord(record.verificationSummary)?.previousEnvelopeLinked),
      ).length,
      envelopePayloadDigestVerifiedCount: payloadDigestVerifiedCount(recordEnvelopeVerificationRecords),
      envelopeSourceDigestsVerifiedCount: sourceDigestsVerifiedCount(recordEnvelopeVerificationRecords),
      previousEnvelopeChainLinkVerifiedCount: previousEnvelopeChainLinkVerifiedCount(recordEnvelopeVerificationRecords),
      gaps: auditAndTamperEvidenceGaps(recordEnvelopeRecords, recordEnvelopeVerificationRecords),
    },
    enterpriseReadinessFindings: findings,
    downstreamActionPlan: downstreamActionPlan(findings),
    enterpriseGateActivated: false,
    benchmarkExecuted: false,
    candidateExecuted: false,
    graphifyExecuted: false,
    nativeBenchmarkExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
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

function validateSources(
  benchmarkGovernance: LoadedSource | null,
  releaseSurface: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  recordEnvelopePreviews: LoadedSource[],
  recordEnvelopeVerifications: LoadedSource[],
  signingReadinessReports: LoadedSource[],
  rbacPolicyValidationReports: LoadedSource[],
  releaseProvenanceReadinessReports: LoadedSource[],
  sbomValidationReports: LoadedSource[],
  packageProvenanceInputsRecords: LoadedSource[],
  packageArtifactDigestRecords: LoadedSource[],
  provenanceAttestationValidationReports: LoadedSource[],
  provenanceVerificationReadinessReports: LoadedSource[],
): EnterpriseReadinessFinding[] {
  const findings: EnterpriseReadinessFinding[] = []
  for (const source of [
    benchmarkGovernance,
    releaseSurface,
    providerNetworkPolicy,
    ...recordEnvelopePreviews,
    ...recordEnvelopeVerifications,
    ...signingReadinessReports,
    ...rbacPolicyValidationReports,
    ...releaseProvenanceReadinessReports,
    ...sbomValidationReports,
    ...packageProvenanceInputsRecords,
    ...packageArtifactDigestRecords,
    ...provenanceAttestationValidationReports,
    ...provenanceVerificationReadinessReports,
  ].filter((entry): entry is LoadedSource => Boolean(entry))) {
    if (source.readError) {
      findings.push(blockingFinding('ENTERPRISE_READINESS_SOURCE_READ_FAILED', source.readError, source.relativePath))
      continue
    }
    const record = source.record ?? {}
    if (source.sourceKind === 'benchmark-governance-verification') {
      if (
        record.artifactRole !== BENCHMARK_GOVERNANCE_ROLE ||
        !BENCHMARK_GOVERNANCE_STATUSES.includes(record.status as (typeof BENCHMARK_GOVERNANCE_STATUSES)[number])
      ) {
        findings.push(
          blockingFinding(
            'ENTERPRISE_READINESS_SOURCE_ROLE_STATUS_INVALID',
            `${source.relativePath} must be ${BENCHMARK_GOVERNANCE_ROLE} with verified or partial status.`,
            source.relativePath,
          ),
        )
      }
    } else if (source.sourceKind === 'release-surface-validation') {
      if (
        record.artifactRole !== RELEASE_SURFACE_ROLE ||
        !RELEASE_SURFACE_STATUSES.includes(record.status as (typeof RELEASE_SURFACE_STATUSES)[number])
      ) {
        findings.push(
          blockingFinding(
            'ENTERPRISE_READINESS_SOURCE_ROLE_STATUS_INVALID',
            `${source.relativePath} must be ${RELEASE_SURFACE_ROLE} with passed or failed status.`,
            source.relativePath,
          ),
        )
      }
    } else if (source.sourceKind === 'provider-network-policy-report') {
      validateProviderNetworkPolicySource(source, record, findings)
    } else if (source.sourceKind === 'record-envelope-preview') {
      validateRecordEnvelopePreviewSource(source, record, findings)
    } else if (source.sourceKind === 'record-envelope-verification') {
      validateRecordEnvelopeVerificationSource(source, record, findings)
    } else if (source.sourceKind === 'signing-readiness-report') {
      validateSigningReadinessSource(source, record, findings)
    } else if (source.sourceKind === 'rbac-policy-validation-report') {
      validateRbacPolicyValidationSource(source, record, findings)
    } else if (source.sourceKind === 'release-provenance-readiness-report') {
      validateReleaseProvenanceReadinessSource(source, record, findings)
    } else if (source.sourceKind === 'sbom-validation-report') {
      validateSbomValidationSource(source, record, findings)
    } else if (source.sourceKind === 'package-provenance-inputs-record') {
      validatePackageProvenanceInputsSource(source, record, findings)
    } else if (source.sourceKind === 'package-artifact-digest-record') {
      validatePackageArtifactDigestSource(source, record, findings)
    } else if (source.sourceKind === 'provenance-attestation-validation-report') {
      validateProvenanceAttestationValidationSource(source, record, findings)
    } else {
      validateProvenanceVerificationReadinessSource(source, record, findings)
    }
    for (const hit of collectUnsafeAuthorityHits(record)) {
      findings.push({
        severity: 'blocker',
        code: 'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
        message: `${source.relativePath} contains unsafe enterprise report-only source flag ${hit.field}: true.`,
        path: source.relativePath,
        field: hit.field,
      })
    }
  }
  return findings
}

function buildFindings(
  benchmarkGovernance: LoadedSource | null,
  releaseSurface: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  recordEnvelopePreviews: LoadedSource[],
  recordEnvelopeVerifications: LoadedSource[],
  signingReadinessReports: LoadedSource[],
  rbacPolicyValidationReports: LoadedSource[],
  releaseProvenanceReadinessReports: LoadedSource[],
  sbomValidationReports: LoadedSource[],
  packageProvenanceInputsRecords: LoadedSource[],
  packageArtifactDigestRecords: LoadedSource[],
  provenanceAttestationValidationReports: LoadedSource[],
  provenanceVerificationReadinessReports: LoadedSource[],
): EnterpriseReadinessFinding[] {
  const findings: EnterpriseReadinessFinding[] = []
  const benchmarkRecord = benchmarkGovernance?.record ?? null
  const releaseRecord = releaseSurface?.record ?? null
  const providerNetworkRecord = providerNetworkPolicy?.record ?? null
  const recordEnvelopeRecords = recordEnvelopePreviews.map((entry) => entry.record).filter(isJsonRecord)
  const recordEnvelopeVerificationRecords = recordEnvelopeVerifications
    .map((entry) => entry.record)
    .filter(isJsonRecord)
  const signingReadinessRecords = signingReadinessReports.map((entry) => entry.record).filter(isJsonRecord)
  const rbacPolicyValidationRecords = rbacPolicyValidationReports.map((entry) => entry.record).filter(isJsonRecord)
  const releaseProvenanceReadinessRecords = releaseProvenanceReadinessReports
    .map((entry) => entry.record)
    .filter(isJsonRecord)
  const sbomValidationRecords = sbomValidationReports.map((entry) => entry.record).filter(isJsonRecord)
  const packageProvenanceInputsJsonRecords = packageProvenanceInputsRecords
    .map((entry) => entry.record)
    .filter(isJsonRecord)
  const packageArtifactDigestJsonRecords = packageArtifactDigestRecords
    .map((entry) => entry.record)
    .filter(isJsonRecord)
  const provenanceAttestationValidationRecords = provenanceAttestationValidationReports
    .map((entry) => entry.record)
    .filter(isJsonRecord)
  const provenanceVerificationReadinessRecords = provenanceVerificationReadinessReports
    .map((entry) => entry.record)
    .filter(isJsonRecord)

  if (!releaseSurface) {
    findings.push({
      severity: 'gap',
      code: 'ENTERPRISE_RELEASE_SURFACE_VALIDATION_NOT_SUPPLIED',
      message:
        'Release-surface validation report was not supplied; run npm run check:release-surface -- --json before release review.',
    })
  } else if (releaseRecord?.status === 'devview-release-surface-validation-passed') {
    findings.push({
      severity: 'satisfied',
      code: 'ENTERPRISE_RELEASE_SURFACE_VALIDATION_PASSED',
      message: 'Release package surface validation source reports zero forbidden findings.',
      path: releaseSurface.relativePath,
    })
  } else {
    findings.push({
      severity: 'blocker',
      code: 'ENTERPRISE_RELEASE_SURFACE_VALIDATION_FAILED',
      message: 'Release package surface validation source reports forbidden findings.',
      path: releaseSurface.relativePath,
    })
  }

  if (!benchmarkGovernance) {
    findings.push({
      severity: 'blocker',
      code: 'ENTERPRISE_BENCHMARK_GOVERNANCE_NOT_SUPPLIED',
      message:
        'Benchmark governance verification was not supplied, so product benchmark claims are not enterprise-governed.',
    })
  } else if (benchmarkRecord?.enterpriseClaimReadiness === 'verified-for-static-benchmark-only') {
    findings.push({
      severity: 'satisfied',
      code: 'ENTERPRISE_STATIC_BENCHMARK_GOVERNANCE_VERIFIED',
      message: 'Benchmark governance source is verified for static benchmark review only.',
      path: benchmarkGovernance.relativePath,
    })
  } else {
    findings.push({
      severity: 'gap',
      code: 'ENTERPRISE_BENCHMARK_GOVERNANCE_PARTIAL',
      message: 'Benchmark governance source is not verified for static benchmark review only.',
      path: benchmarkGovernance.relativePath,
    })
  }

  if (!providerNetworkPolicy) {
    findings.push({
      severity: 'blocker',
      code: 'ENTERPRISE_PROVIDER_NETWORK_POLICY_MISSING',
      message: 'Provider/network default-deny policy report was not supplied.',
    })
  } else {
    findings.push({
      severity: 'satisfied',
      code: 'ENTERPRISE_PROVIDER_NETWORK_POLICY_DEFAULT_DENY_RECORDED',
      message: 'Provider/network default-deny policy source is recorded as report-only.',
      path: providerNetworkPolicy.relativePath,
    })
    if (arrayLength(providerNetworkRecord?.futureAllowPolicyRequirements) === 0) {
      findings.push({
        severity: 'gap',
        code: 'ENTERPRISE_PROVIDER_NETWORK_FUTURE_ALLOW_REQUIREMENTS_MISSING',
        message: 'Provider/network policy source does not list future allow policy requirements.',
        path: providerNetworkPolicy.relativePath,
        field: 'futureAllowPolicyRequirements',
      })
    }
  }

  if (recordEnvelopeRecords.length === 0) {
    findings.push({
      severity: 'gap',
      code: 'ENTERPRISE_RECORD_ENVELOPE_PREVIEW_NOT_SUPPLIED',
      message:
        'Unsigned record envelope preview was not supplied; audit/tamper evidence cannot link payload hashes yet.',
    })
  } else {
    findings.push({
      severity: 'satisfied',
      code: 'ENTERPRISE_RECORD_ENVELOPE_PREVIEW_RECORDED',
      message:
        'Unsigned deterministic record envelope preview source is recorded with payload hash and actor/permission claims.',
      path: recordEnvelopePreviews[0]?.relativePath,
    })
  }

  if (recordEnvelopeVerificationRecords.length === 0) {
    findings.push({
      severity: 'gap',
      code: 'ENTERPRISE_RECORD_ENVELOPE_VERIFICATION_NOT_SUPPLIED',
      message:
        'Record envelope verification report was not supplied; envelope preview hashes have not been independently recomputed.',
    })
  } else {
    findings.push({
      severity: 'satisfied',
      code: 'ENTERPRISE_RECORD_ENVELOPE_VERIFICATION_RECORDED',
      message:
        'Unsigned deterministic record envelope verification source is recorded with independently recomputed payload/source digest facts.',
      path: recordEnvelopeVerifications[0]?.relativePath,
    })
  }

  if (signingReadinessRecords.length === 0) {
    findings.push({
      severity: 'gap',
      code: 'ENTERPRISE_SIGNING_READINESS_NOT_SUPPLIED',
      message:
        'Signing/key governance readiness report was not supplied; key registry, trust root, signature policy, and RBAC prerequisites are not summarized.',
    })
  } else {
    findings.push({
      severity: 'satisfied',
      code: 'ENTERPRISE_SIGNING_READINESS_RECORDED',
      message:
        'Signing/key governance readiness source is recorded as a report-only prerequisite summary, not as real signing.',
      path: signingReadinessReports[0]?.relativePath,
    })
  }

  if (rbacPolicyValidationRecords.length === 0) {
    findings.push({
      severity: 'gap',
      code: 'ENTERPRISE_RBAC_POLICY_VALIDATION_NOT_SUPPLIED',
      message:
        'RBAC role-assignment policy validation report was not supplied; declarative actor/role/permission policy has not been validated.',
    })
  } else {
    findings.push({
      severity: 'satisfied',
      code: 'ENTERPRISE_RBAC_POLICY_VALIDATION_RECORDED',
      message:
        'Declarative RBAC policy validation source is recorded as report-only validation, not as permission enforcement.',
      path: rbacPolicyValidationReports[0]?.relativePath,
    })
  }

  if (releaseProvenanceReadinessRecords.length === 0) {
    findings.push({
      severity: 'blocker',
      code: 'ENTERPRISE_RELEASE_PROVENANCE_READINESS_NOT_SUPPLIED',
      message:
        'Release provenance readiness report was not supplied, so SBOM/package signing/provenance readiness is not source-governed.',
    })
  } else {
    findings.push({
      severity: 'satisfied',
      code: 'ENTERPRISE_RELEASE_PROVENANCE_READINESS_RECORDED',
      message:
        'Release provenance readiness source is recorded as report-only readiness, not as SBOM, package signing, or provenance attestation.',
      path: releaseProvenanceReadinessReports[0]?.relativePath,
    })
  }

  if (sbomValidationRecords.length === 0) {
    findings.push({
      severity: 'gap',
      code: 'ENTERPRISE_SBOM_VALIDATION_NOT_SUPPLIED',
      message:
        'SBOM validation report was not supplied; static SBOM source facts have not been structurally validated.',
    })
  } else {
    findings.push({
      severity: 'satisfied',
      code: 'ENTERPRISE_SBOM_VALIDATION_RECORDED',
      message:
        'Static wrapped SBOM validation source is recorded as structural source-fact validation, not as SBOM generation or attestation.',
      path: sbomValidationReports[0]?.relativePath,
    })
  }

  if (packageProvenanceInputsJsonRecords.length === 0) {
    findings.push({
      severity: 'gap',
      code: 'ENTERPRISE_PACKAGE_PROVENANCE_INPUTS_NOT_SUPPLIED',
      message:
        'Package provenance inputs record was not supplied; package/source/build input digests are not source-governed.',
    })
  } else {
    findings.push({
      severity: 'satisfied',
      code: 'ENTERPRISE_PACKAGE_PROVENANCE_INPUTS_RECORDED',
      message:
        'Package/source/build input facts are recorded as provenance inputs only, not as package artifact digest or provenance attestation.',
      path: packageProvenanceInputsRecords[0]?.relativePath,
    })
  }

  if (packageArtifactDigestJsonRecords.length === 0) {
    findings.push({
      severity: 'gap',
      code: 'ENTERPRISE_PACKAGE_ARTIFACT_DIGEST_NOT_SUPPLIED',
      message:
        'Package artifact digest record was not supplied; package artifact digest is not source-governed for provenance planning.',
    })
  } else {
    findings.push({
      severity: 'satisfied',
      code: 'ENTERPRISE_PACKAGE_ARTIFACT_DIGEST_RECORDED',
      message:
        'Preexisting package artifact digest is recorded as a source fact only, not as package generation, signing, or provenance attestation.',
      path: packageArtifactDigestRecords[0]?.relativePath,
    })
  }

  if (provenanceAttestationValidationRecords.length === 0) {
    findings.push({
      severity: 'gap',
      code: 'ENTERPRISE_PROVENANCE_ATTESTATION_VALIDATION_NOT_SUPPLIED',
      message:
        'Provenance attestation validation report was not supplied; static attestation source facts have not been structurally validated.',
    })
  } else {
    findings.push({
      severity: 'satisfied',
      code: 'ENTERPRISE_PROVENANCE_ATTESTATION_VALIDATION_RECORDED',
      message:
        'Static wrapped provenance attestation validation source is recorded as structural source-fact validation, not as real attestation generation or cryptographic verification.',
      path: provenanceAttestationValidationReports[0]?.relativePath,
    })
  }

  if (provenanceVerificationReadinessRecords.length === 0) {
    findings.push({
      severity: 'gap',
      code: 'ENTERPRISE_PROVENANCE_VERIFICATION_READINESS_NOT_SUPPLIED',
      message:
        'Provenance verification readiness report was not supplied; signed provenance verification prerequisites are not source-governed.',
    })
  } else {
    findings.push({
      severity: 'satisfied',
      code: 'ENTERPRISE_PROVENANCE_VERIFICATION_READINESS_RECORDED',
      message:
        'Provenance verification readiness source is recorded as report-only readiness, not as real SLSA/in-toto or cryptographic verification.',
      path: provenanceVerificationReadinessReports[0]?.relativePath,
    })
  }

  findings.push(
    {
      severity: 'blocker',
      code: 'ENTERPRISE_RELEASE_PROVENANCE_ARTIFACTS_MISSING',
      message:
        'Actual SBOM generation, package signing, and provenance attestation remain missing and are not enterprise-ready.',
    },
    {
      severity: 'blocker',
      code: 'ENTERPRISE_RBAC_SIGNING_MISSING',
      message: 'Enterprise RBAC, actor identity, and signed record envelope are not implemented.',
    },
    {
      severity: 'blocker',
      code: 'ENTERPRISE_CI_ACTIVATION_GOVERNANCE_MISSING',
      message: 'External CI/branch protection activation remains disabled and lacks enterprise governance.',
    },
    {
      severity: 'gap',
      code: 'ENTERPRISE_TAMPER_EVIDENCE_INCOMPLETE',
      message:
        'Benchmark digests exist, but a signed cross-record hash chain is not implemented across DevView authority records.',
    },
  )
  return findings
}

function validateProviderNetworkPolicySource(
  source: LoadedSource,
  record: JsonRecord,
  findings: EnterpriseReadinessFinding[],
): void {
  if (record.artifactRole !== PROVIDER_NETWORK_POLICY_ROLE || record.status !== PROVIDER_NETWORK_POLICY_STATUS) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PROVIDER_NETWORK_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${PROVIDER_NETWORK_POLICY_ROLE} with recorded status.`,
        source.relativePath,
      ),
    )
  }
  if (record.defaultProviderPolicy !== 'deny') {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PROVIDER_POLICY_NOT_DENY',
        'Provider/network policy source must set defaultProviderPolicy to deny.',
        source.relativePath,
        'defaultProviderPolicy',
      ),
    )
  }
  if (record.defaultNetworkPolicy !== 'deny') {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_NETWORK_POLICY_NOT_DENY',
        'Provider/network policy source must set defaultNetworkPolicy to deny.',
        source.relativePath,
        'defaultNetworkPolicy',
      ),
    )
  }
  if (record.explicitAllowSupported !== false) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PROVIDER_ALLOW_UNSUPPORTED',
        'Provider/network policy source must keep explicitAllowSupported false in v1.',
        source.relativePath,
        'explicitAllowSupported',
      ),
    )
  }
  for (const field of ['providerAllowlist', 'networkAllowlist'] as const) {
    if (arrayLength(record[field]) !== 0) {
      findings.push(
        blockingFinding(
          'ENTERPRISE_READINESS_PROVIDER_NETWORK_ALLOWLIST_NOT_EMPTY',
          `${field} must stay empty for enterprise report v1 source consumption.`,
          source.relativePath,
          field,
        ),
      )
    }
  }
}

function validateRecordEnvelopePreviewSource(
  source: LoadedSource,
  record: JsonRecord,
  findings: EnterpriseReadinessFinding[],
): void {
  if (record.artifactRole !== RECORD_ENVELOPE_PREVIEW_ROLE || record.status !== RECORD_ENVELOPE_PREVIEW_STATUS) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_RECORD_ENVELOPE_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${RECORD_ENVELOPE_PREVIEW_ROLE} with previewed status.`,
        source.relativePath,
      ),
    )
  }
  if (record.signatureMode !== RECORD_ENVELOPE_PREVIEW_SIGNATURE_MODE) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_RECORD_ENVELOPE_SIGNATURE_MODE_INVALID',
        `${source.relativePath} must use unsigned deterministic preview signature mode.`,
        source.relativePath,
        'signatureMode',
      ),
    )
  }
  const verificationSummary = asRecord(record.verificationSummary)
  const authorizationClaim = asRecord(record.authorizationClaim)
  const forbiddenTrueFields: Array<[string, unknown]> = [
    ['cryptographicSignaturePresent', record.cryptographicSignaturePresent],
    ['verificationSummary.cryptographicSignatureVerified', verificationSummary?.cryptographicSignatureVerified],
    ['rbacEnforced', record.rbacEnforced],
    ['permissionVerified', record.permissionVerified],
    ['authorizationClaim.rbacEnforced', authorizationClaim?.rbacEnforced],
    ['authorizationClaim.permissionVerified', authorizationClaim?.permissionVerified],
    ['verificationSummary.rbacPermissionVerified', verificationSummary?.rbacPermissionVerified],
  ]
  for (const [field, value] of forbiddenTrueFields) {
    if (value === true) {
      findings.push(
        blockingFinding(
          'ENTERPRISE_READINESS_RECORD_ENVELOPE_AUTHORITY_CLAIM_UNSUPPORTED',
          `${source.relativePath} claims ${field}: true; enterprise v1 only accepts unsigned preview source facts.`,
          source.relativePath,
          field,
        ),
      )
    }
  }
}

function validateRecordEnvelopeVerificationSource(
  source: LoadedSource,
  record: JsonRecord,
  findings: EnterpriseReadinessFinding[],
): void {
  if (
    record.artifactRole !== RECORD_ENVELOPE_VERIFICATION_ROLE ||
    record.status !== RECORD_ENVELOPE_VERIFICATION_STATUS
  ) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_RECORD_ENVELOPE_VERIFICATION_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${RECORD_ENVELOPE_VERIFICATION_ROLE} with verified status.`,
        source.relativePath,
      ),
    )
  }
  if (record.signatureVerificationMode !== RECORD_ENVELOPE_VERIFICATION_SIGNATURE_MODE) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_RECORD_ENVELOPE_VERIFICATION_SIGNATURE_MODE_INVALID',
        `${source.relativePath} must use unsigned preview-only signature verification mode.`,
        source.relativePath,
        'signatureVerificationMode',
      ),
    )
  }
  const forbiddenTrueFields: Array<[string, unknown]> = [
    ['cryptographicSignatureVerified', record.cryptographicSignatureVerified],
    ['rbacPermissionVerified', record.rbacPermissionVerified],
    ['rbacEnforced', record.rbacEnforced],
    ['permissionVerified', record.permissionVerified],
  ]
  for (const [field, value] of forbiddenTrueFields) {
    if (value === true) {
      findings.push(
        blockingFinding(
          'ENTERPRISE_READINESS_RECORD_ENVELOPE_VERIFICATION_AUTHORITY_CLAIM_UNSUPPORTED',
          `${source.relativePath} claims ${field}: true; enterprise v1 only accepts unsigned digest verification source facts.`,
          source.relativePath,
          field,
        ),
      )
    }
  }
}

function validateSigningReadinessSource(
  source: LoadedSource,
  record: JsonRecord,
  findings: EnterpriseReadinessFinding[],
): void {
  if (record.artifactRole !== SIGNING_READINESS_ROLE || record.status !== SIGNING_READINESS_STATUS) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_SIGNING_READINESS_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${SIGNING_READINESS_ROLE} with reported status.`,
        source.relativePath,
      ),
    )
  }
  for (const hit of collectTrueFieldHits(record, signingReadinessAuthorityFields)) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_SIGNING_READINESS_AUTHORITY_CLAIM_UNSUPPORTED',
        `${source.relativePath} claims signing/key/RBAC field ${hit.field}: true; enterprise v1 only accepts signing readiness source facts.`,
        source.relativePath,
        hit.field,
      ),
    )
  }
}

function validateRbacPolicyValidationSource(
  source: LoadedSource,
  record: JsonRecord,
  findings: EnterpriseReadinessFinding[],
): void {
  if (record.artifactRole !== RBAC_POLICY_VALIDATION_ROLE || record.status !== RBAC_POLICY_VALIDATION_STATUS) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_RBAC_POLICY_VALIDATION_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${RBAC_POLICY_VALIDATION_ROLE} with passed status.`,
        source.relativePath,
      ),
    )
  }
  for (const hit of collectTrueFieldHits(record, signingReadinessAuthorityFields)) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_RBAC_POLICY_VALIDATION_AUTHORITY_CLAIM_UNSUPPORTED',
        `${source.relativePath} claims RBAC/signing/key field ${hit.field}: true; enterprise v1 only accepts declarative RBAC policy validation source facts.`,
        source.relativePath,
        hit.field,
      ),
    )
  }
}

function validateReleaseProvenanceReadinessSource(
  source: LoadedSource,
  record: JsonRecord,
  findings: EnterpriseReadinessFinding[],
): void {
  if (
    record.artifactRole !== RELEASE_PROVENANCE_READINESS_ROLE ||
    record.status !== RELEASE_PROVENANCE_READINESS_STATUS
  ) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_RELEASE_PROVENANCE_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${RELEASE_PROVENANCE_READINESS_ROLE} with reported status.`,
        source.relativePath,
      ),
    )
  }
  for (const hit of collectTrueFieldHits(record, releaseProvenanceAuthorityFields)) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_RELEASE_PROVENANCE_AUTHORITY_CLAIM_UNSUPPORTED',
        `${source.relativePath} claims release provenance/signing authority field ${hit.field}: true; enterprise v1 only accepts false-only readiness source facts.`,
        source.relativePath,
        hit.field,
      ),
    )
  }
}

function validateSbomValidationSource(
  source: LoadedSource,
  record: JsonRecord,
  findings: EnterpriseReadinessFinding[],
): void {
  if (record.artifactRole !== SBOM_VALIDATION_ROLE || record.status !== SBOM_VALIDATION_STATUS) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_SBOM_VALIDATION_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${SBOM_VALIDATION_ROLE} with passed status.`,
        source.relativePath,
      ),
    )
  }
  for (const hit of collectTrueFieldHits(record, releaseProvenanceAuthorityFields)) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_SBOM_VALIDATION_AUTHORITY_CLAIM_UNSUPPORTED',
        `${source.relativePath} claims SBOM/signing/provenance authority field ${hit.field}: true; enterprise v1 only accepts structural SBOM validation source facts.`,
        source.relativePath,
        hit.field,
      ),
    )
  }
}

function validatePackageProvenanceInputsSource(
  source: LoadedSource,
  record: JsonRecord,
  findings: EnterpriseReadinessFinding[],
): void {
  if (record.artifactRole !== PACKAGE_PROVENANCE_INPUTS_ROLE || record.status !== PACKAGE_PROVENANCE_INPUTS_STATUS) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PACKAGE_PROVENANCE_INPUTS_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${PACKAGE_PROVENANCE_INPUTS_ROLE} with recorded status.`,
        source.relativePath,
      ),
    )
  }
  if (record.packageDigestStatus !== 'not-computed-no-package-artifact-supplied') {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PACKAGE_PROVENANCE_PACKAGE_DIGEST_UNSUPPORTED',
        `${source.relativePath} must keep package digest status as not-computed for v1 enterprise source consumption.`,
        source.relativePath,
        'packageDigestStatus',
      ),
    )
  }
  if (stringValue(record.packageArtifactSha256)) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PACKAGE_PROVENANCE_PACKAGE_DIGEST_UNSUPPORTED',
        `${source.relativePath} must not carry a package artifact sha256 in v1 enterprise source consumption.`,
        source.relativePath,
        'packageArtifactSha256',
      ),
    )
  }
  if (record.provenanceAttestationStatus !== 'not-generated') {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PACKAGE_PROVENANCE_ATTESTATION_UNSUPPORTED',
        `${source.relativePath} must keep provenance attestation status as not-generated for v1 enterprise source consumption.`,
        source.relativePath,
        'provenanceAttestationStatus',
      ),
    )
  }
  for (const hit of collectTrueFieldHits(record, releaseProvenanceAuthorityFields)) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PACKAGE_PROVENANCE_INPUTS_AUTHORITY_CLAIM_UNSUPPORTED',
        `${source.relativePath} claims package/SBOM/signing/provenance authority field ${hit.field}: true; enterprise v1 only accepts package provenance input source facts.`,
        source.relativePath,
        hit.field,
      ),
    )
  }
}

function validatePackageArtifactDigestSource(
  source: LoadedSource,
  record: JsonRecord,
  findings: EnterpriseReadinessFinding[],
): void {
  if (record.artifactRole !== PACKAGE_ARTIFACT_DIGEST_ROLE || record.status !== PACKAGE_ARTIFACT_DIGEST_STATUS) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PACKAGE_ARTIFACT_DIGEST_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${PACKAGE_ARTIFACT_DIGEST_ROLE} with recorded status.`,
        source.relativePath,
      ),
    )
  }
  const artifact = asRecord(record.sourcePackageArtifact)
  if (!stringValue(artifact?.sha256)) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PACKAGE_ARTIFACT_DIGEST_SHA256_MISSING',
        `${source.relativePath} must record a package artifact sha256.`,
        source.relativePath,
        'sourcePackageArtifact.sha256',
      ),
    )
  }
  const digestStatus = stringValue(record.artifactDigestStatus)
  if (digestStatus !== 'computed' && digestStatus !== 'matched-expected') {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PACKAGE_ARTIFACT_DIGEST_STATUS_UNSUPPORTED',
        `${source.relativePath} must report computed or matched-expected artifact digest status.`,
        source.relativePath,
        'artifactDigestStatus',
      ),
    )
  }
  for (const hit of collectTrueFieldHits(record, releaseProvenanceAuthorityFields)) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PACKAGE_ARTIFACT_DIGEST_AUTHORITY_CLAIM_UNSUPPORTED',
        `${source.relativePath} claims package/SBOM/signing/provenance authority field ${hit.field}: true; enterprise v1 only accepts package artifact digest source facts.`,
        source.relativePath,
        hit.field,
      ),
    )
  }
}

function validateProvenanceAttestationValidationSource(
  source: LoadedSource,
  record: JsonRecord,
  findings: EnterpriseReadinessFinding[],
): void {
  if (
    record.artifactRole !== PROVENANCE_ATTESTATION_VALIDATION_ROLE ||
    record.status !== PROVENANCE_ATTESTATION_VALIDATION_STATUS
  ) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PROVENANCE_ATTESTATION_VALIDATION_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${PROVENANCE_ATTESTATION_VALIDATION_ROLE} with passed status.`,
        source.relativePath,
      ),
    )
  }
  if (record.signatureValidationStatus !== 'not-performed-source-fact-only') {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PROVENANCE_ATTESTATION_SIGNATURE_STATUS_UNSUPPORTED',
        `${source.relativePath} must keep signatureValidationStatus as not-performed-source-fact-only.`,
        source.relativePath,
        'signatureValidationStatus',
      ),
    )
  }
  if (record.attestationValidationStatus !== 'validated-structural-source-fact-only') {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PROVENANCE_ATTESTATION_VALIDATION_STATUS_UNSUPPORTED',
        `${source.relativePath} must report structural source-fact-only attestation validation status.`,
        source.relativePath,
        'attestationValidationStatus',
      ),
    )
  }
  if (!stringValue(asRecord(record.sourceAttestationArtifact)?.sha256)) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PROVENANCE_ATTESTATION_SHA256_MISSING',
        `${source.relativePath} must record an attestation artifact sha256.`,
        source.relativePath,
        'sourceAttestationArtifact.sha256',
      ),
    )
  }
  for (const hit of collectTrueFieldHits(record, releaseProvenanceAuthorityFields)) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PROVENANCE_ATTESTATION_VALIDATION_AUTHORITY_CLAIM_UNSUPPORTED',
        `${source.relativePath} claims attestation/signing/provenance authority field ${hit.field}: true; enterprise v1 only accepts structural attestation validation source facts.`,
        source.relativePath,
        hit.field,
      ),
    )
  }
}

function validateProvenanceVerificationReadinessSource(
  source: LoadedSource,
  record: JsonRecord,
  findings: EnterpriseReadinessFinding[],
): void {
  if (
    record.artifactRole !== PROVENANCE_VERIFICATION_READINESS_ROLE ||
    record.status !== PROVENANCE_VERIFICATION_READINESS_STATUS
  ) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PROVENANCE_VERIFICATION_READINESS_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${PROVENANCE_VERIFICATION_READINESS_ROLE} with reported status.`,
        source.relativePath,
      ),
    )
  }
  const boundary = asRecord(record.verificationBoundary)
  if (stringValue(boundary?.signatureVerificationStatus) !== 'not-performed-readiness-only') {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PROVENANCE_VERIFICATION_SIGNATURE_STATUS_UNSUPPORTED',
        `${source.relativePath} must keep signatureVerificationStatus as not-performed-readiness-only.`,
        source.relativePath,
        'verificationBoundary.signatureVerificationStatus',
      ),
    )
  }
  for (const hit of collectTrueFieldHits(record, releaseProvenanceAuthorityFields)) {
    findings.push(
      blockingFinding(
        'ENTERPRISE_READINESS_PROVENANCE_VERIFICATION_AUTHORITY_CLAIM_UNSUPPORTED',
        `${source.relativePath} claims provenance verification/signing authority field ${hit.field}: true; enterprise v1 only accepts readiness source facts.`,
        source.relativePath,
        hit.field,
      ),
    )
  }
}

async function loadSource(
  root: string,
  requestedPath: string,
  sourceKind: LoadedSource['sourceKind'],
): Promise<LoadedSource> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  const relative = relativePath(root, resolvedPath)
  try {
    const text = await readFile(resolvedPath, 'utf8')
    try {
      return {
        requestedPath,
        resolvedPath,
        relativePath: relative,
        sourceKind,
        record: JSON.parse(text.replace(/^\uFEFF/, '')) as JsonRecord,
        readError: null,
      }
    } catch (error) {
      return {
        requestedPath,
        resolvedPath,
        relativePath: relative,
        sourceKind,
        record: null,
        readError: error instanceof Error ? error.message : String(error),
      }
    }
  } catch (error) {
    return {
      requestedPath,
      resolvedPath,
      relativePath: relative,
      sourceKind,
      record: null,
      readError: error instanceof Error ? error.message : String(error),
    }
  }
}

function validateRequiredOptions(options: EnterpriseReadinessReportOptions): void {
  if (!options.output) throw new Error('security report-enterprise-readiness requires --output <json>.')
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: EnterpriseReadinessReportOptions,
): Promise<void> {
  const outputPath = options.output ? resolveRepoPath(root, options.output) : null
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  if (!outputPath) throw new Error('security report-enterprise-readiness requires --output <json>.')
  const sourceSet = new Set(sourcePaths.map((entry) => path.resolve(entry)))
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('Enterprise readiness JSON output and Markdown output must be different paths.')
  }
  for (const target of [outputPath, ...(markdownPath ? [markdownPath] : [])]) {
    const relativeTarget = relativePath(root, target)
    if (sourceSet.has(path.resolve(target))) {
      throw new Error(`Enterprise readiness output would overwrite a source input: ${relativeTarget}.`)
    }
    if (
      hasDevViewControlDirectory(target) ||
      hasCodexControlDirectory(target) ||
      hasHiddenControlDirectorySegment(target)
    ) {
      throw new Error(`Enterprise readiness output is inside a protected control path: ${relativeTarget}.`)
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(`Enterprise readiness output would overwrite a source-authority-shaped path: ${relativeTarget}.`)
    }
  }
}

function renderMarkdown(report: EnterpriseReadinessReport): string {
  return [
    '# DevView Enterprise Readiness',
    '',
    `- status: ${report.status}`,
    `- readinessLevel: ${report.readinessLevel}`,
    `- benchmarkGovernance: ${report.benchmarkGovernanceReadiness.status}`,
    `- releaseSurface: ${report.releaseSurfaceReadiness.status}`,
    `- providerNetworkPolicy: ${report.providerNetworkPolicyReadiness.status}`,
    `- rbacAndSigning: ${report.rbacAndSigningReadiness.status}`,
    `- recordEnvelopePreviews: ${report.auditAndTamperEvidenceReadiness.envelopePreviewCount}`,
    `- recordEnvelopeVerifications: ${report.auditAndTamperEvidenceReadiness.envelopeVerificationCount}`,
    `- signingReadinessReports: ${report.rbacAndSigningReadiness.signingReadinessReportCount}`,
    `- rbacPolicyValidationReports: ${report.rbacAndSigningReadiness.rbacPolicyValidationReportCount}`,
    `- releaseProvenanceReadinessReports: ${report.releaseProvenanceReadiness.sourceCount}`,
    `- sbomValidationReports: ${report.sbomValidationReadiness.sourceCount}`,
    `- packageProvenanceInputsRecords: ${report.packageProvenanceInputsReadiness.sourceCount}`,
    `- packageArtifactDigestRecords: ${report.packageArtifactDigestReadiness.sourceCount}`,
    `- provenanceAttestationValidationReports: ${report.provenanceAttestationValidationReadiness.sourceCount}`,
    `- provenanceVerificationReadinessReports: ${report.provenanceVerificationReadiness.sourceCount}`,
    '',
    '## Findings',
    ...report.enterpriseReadinessFindings.map((entry) => `- [${entry.severity}] ${entry.code}: ${entry.message}`),
    '',
    '## Downstream Actions',
    ...report.downstreamActionPlan.map((entry) => `- ${entry}`),
    '',
    '## Report-Only Safety',
    '- enterpriseGateActivated: false',
    '- providerInvoked: false',
    '- networkCallMade: false',
    '- extensionExecutionAllowed: false',
    '- graphSourceMutated: false',
    '- graphDeltaApplied: false',
    '- branchProtectionMutated: false',
    '- requiredChecksMutated: false',
    '- approvalAutomationEnabled: false',
    '- userAcceptanceAutomated: false',
    '',
  ].join('\n')
}

function releaseReadinessStatus(
  record: JsonRecord | null,
): EnterpriseReadinessReport['releaseSurfaceReadiness']['status'] {
  if (!record) return 'not-supplied'
  return record.status === 'devview-release-surface-validation-passed' ? 'satisfied' : 'failed'
}

function benchmarkReadinessStatus(
  record: JsonRecord | null,
): EnterpriseReadinessReport['benchmarkGovernanceReadiness']['status'] {
  if (!record) return 'not-supplied'
  if (record.enterpriseClaimReadiness === 'verified-for-static-benchmark-only') {
    return 'verified-for-static-benchmark-only'
  }
  if (record.enterpriseClaimReadiness === 'not-ready') return 'not-ready'
  return 'partial'
}

function benchmarkGovernanceGaps(record: JsonRecord | null): string[] {
  if (!record) return ['Benchmark governance verification source is not supplied.']
  const gaps = stringArray(record.downstreamActionPlan)
  if (record.enterpriseClaimReadiness !== 'verified-for-static-benchmark-only') {
    gaps.push('Benchmark governance is not verified for static benchmark review only.')
  }
  return gaps
}

function providerNetworkPolicyGaps(record: JsonRecord | null): string[] {
  if (!record) return ['Provider/network default-deny policy report is not supplied.']
  return [
    'Provider/network audit enforcement is not activated.',
    'Signed policy, RBAC, sandboxing, and provider isolation remain future requirements before any allow policy.',
  ]
}

function releaseProvenanceReadinessGaps(records: JsonRecord[]): string[] {
  if (records.length === 0) {
    return ['Release provenance readiness report is not supplied.']
  }
  const gaps = [
    'Release provenance readiness is source-fact-only and does not create package signatures, SBOMs, or attestations.',
  ]
  if (!records.some((record) => booleanValue(asRecord(record.packageMetadataSummary)?.packageFilesAllowlistPresent))) {
    gaps.push('Package files allowlist was not confirmed by release provenance readiness sources.')
  }
  if (!records.some((record) => booleanValue(asRecord(record.packageMetadataSummary)?.releaseSurfaceCheckerPresent))) {
    gaps.push('Release-surface checker presence was not confirmed by release provenance readiness sources.')
  }
  if (!records.some((record) => booleanValue(asRecord(record.sbomReadiness)?.sbomGenerated))) {
    gaps.push('Actual SBOM generation remains missing.')
  }
  if (!records.some((record) => booleanValue(asRecord(record.packageSigningReadiness)?.packageSigningPresent))) {
    gaps.push('Actual package signing remains missing.')
  }
  if (
    !records.some((record) =>
      booleanValue(asRecord(record.provenanceAttestationReadiness)?.provenanceAttestationPresent),
    )
  ) {
    gaps.push('Actual provenance attestation remains missing.')
  }
  return gaps
}

function sbomValidationGaps(records: JsonRecord[]): string[] {
  if (records.length === 0) {
    return ['SBOM validation report is not supplied.']
  }
  const gaps = [
    'SBOM validation is structural source-fact validation only and does not generate, attest, or sign an SBOM.',
  ]
  if (
    !records.some((record) => stringValue(asRecord(record.packageIdentityAlignment)?.alignmentStatus) === 'matched')
  ) {
    gaps.push('No SBOM validation source reports matched package identity.')
  }
  if (!records.some((record) => Boolean(stringValue(asRecord(record.digestSummary)?.sbomSha256)))) {
    gaps.push('No SBOM validation source records an SBOM byte digest.')
  }
  if (!records.some((record) => numberValue(asRecord(record.componentCoverageSummary)?.componentCount))) {
    gaps.push('No SBOM validation source reports component coverage.')
  }
  gaps.push('SBOM attestation, package signing, and provenance attestation remain missing.')
  return gaps
}

function packageProvenanceInputsGaps(records: JsonRecord[]): string[] {
  if (records.length === 0) {
    return ['Package provenance inputs record is not supplied.']
  }
  const gaps = [
    'Package provenance inputs are source facts only and do not create package artifacts or provenance attestations.',
  ]
  if (
    !records.some(
      (record) => stringValue(asRecord(record.sourceRefSummary)?.sourceRefStatus) === 'supplied-explicit-cli-input',
    )
  ) {
    gaps.push('No package provenance input source supplies an explicit source ref label.')
  }
  if (
    !records.some(
      (record) => stringValue(asRecord(record.buildInputSummary)?.buildCommandLabelStatus) === 'supplied-metadata-only',
    )
  ) {
    gaps.push('No package provenance input source supplies a build command label.')
  }
  if (!records.some((record) => arrayLength(record.sourceArtifactDigests))) {
    gaps.push('No package provenance input source records source artifact digests.')
  }
  gaps.push('Package artifact digest, provenance attestation, package signing, and CI governance remain missing.')
  return gaps
}

function packageArtifactDigestGaps(records: JsonRecord[]): string[] {
  if (records.length === 0) {
    return ['Package artifact digest record is not supplied.']
  }
  const gaps = [
    'Package artifact digest is a source fact only and does not create, publish, sign, or attest a package.',
  ]
  if (!records.some((record) => stringValue(record.artifactDigestStatus) === 'matched-expected')) {
    gaps.push('No package artifact digest source reports an expected sha256 match.')
  }
  if (!records.some((record) => booleanValue(asRecord(record.sourcePackageProvenanceInputs)?.supplied))) {
    gaps.push('No package artifact digest source links package provenance inputs.')
  }
  if (!records.some((record) => booleanValue(asRecord(record.sourceReleaseSurfaceValidation)?.supplied))) {
    gaps.push('No package artifact digest source links release-surface validation.')
  }
  gaps.push('Provenance attestation, package signing, SBOM attestation, and CI governance remain missing.')
  return gaps
}

function provenanceAttestationValidationGaps(records: JsonRecord[]): string[] {
  if (records.length === 0) {
    return ['Provenance attestation validation report is not supplied.']
  }
  const gaps = [
    'Provenance attestation validation is structural source-fact validation only and does not generate, sign, or verify a real attestation.',
  ]
  if (!records.some((record) => stringValue(asRecord(record.packageDigestAlignment)?.alignmentStatus) === 'matched')) {
    gaps.push('No provenance attestation validation source reports matched package artifact digest alignment.')
  }
  if (
    !records.some((record) => stringValue(asRecord(record.provenanceInputAlignment)?.alignmentStatus) === 'matched')
  ) {
    gaps.push('No provenance attestation validation source reports matched package provenance input alignment.')
  }
  if (!records.some((record) => Boolean(stringValue(asRecord(record.digestSummary)?.attestationSha256)))) {
    gaps.push('No provenance attestation validation source records an attestation byte digest.')
  }
  gaps.push('Real SLSA/in-toto verification, package signing, key/RBAC enforcement, and CI governance remain missing.')
  return gaps
}

function provenanceVerificationReadinessGaps(records: JsonRecord[]): string[] {
  if (records.length === 0) {
    return ['Provenance verification readiness report is not supplied.']
  }
  const gaps = [
    'Provenance verification readiness is source-fact-only and does not perform real SLSA/in-toto or cryptographic verification.',
  ]
  if (!records.some((record) => booleanValue(asRecord(record.sourceProvenanceAttestationValidation)?.supplied))) {
    gaps.push('No provenance verification readiness source links static provenance attestation validation.')
  }
  if (!records.some((record) => booleanValue(asRecord(record.sourceSigningReadiness)?.supplied))) {
    gaps.push('No provenance verification readiness source links signing/key governance readiness.')
  }
  if (!records.some((record) => booleanValue(asRecord(record.sourceRbacPolicyValidation)?.supplied))) {
    gaps.push('No provenance verification readiness source links RBAC policy validation.')
  }
  if (!records.some((record) => booleanValue(asRecord(record.sourceProviderNetworkPolicy)?.supplied))) {
    gaps.push('No provenance verification readiness source links provider/network default-deny policy.')
  }
  gaps.push('Key registry, trust root, RBAC enforcement, CI governance, and enterprise gate activation remain missing.')
  return gaps
}

function rbacAndSigningGaps(
  recordEnvelopeRecords: JsonRecord[],
  recordEnvelopeVerificationRecords: JsonRecord[],
  signingReadinessRecords: JsonRecord[],
  rbacPolicyValidationRecords: JsonRecord[],
): string[] {
  const gaps = [
    'Enterprise RBAC/actor identity model is not enforced.',
    'Cryptographic signing and key management are not implemented.',
  ]
  if (recordEnvelopeRecords.length === 0) {
    gaps.push('Unsigned deterministic record envelope preview source is not supplied.')
  } else {
    gaps.push('Unsigned record envelope previews are source facts only and do not verify permissions.')
  }
  if (recordEnvelopeVerificationRecords.length === 0) {
    gaps.push('Record envelope verification report is not supplied.')
  } else {
    gaps.push(
      'Record envelope verification recomputes digests only and does not verify cryptographic signatures or RBAC.',
    )
  }
  if (signingReadinessRecords.length === 0) {
    gaps.push('Signing/key governance readiness report is not supplied.')
  } else {
    gaps.push('Signing/key governance readiness is recorded, but real signing/key management/RBAC remain absent.')
  }
  if (rbacPolicyValidationRecords.length === 0) {
    gaps.push('RBAC role-assignment policy validation report is not supplied.')
  } else {
    gaps.push('RBAC policy validation is recorded, but no RBAC enforcement or permission verification is active.')
  }
  return gaps
}

function auditAndTamperEvidenceGaps(
  recordEnvelopeRecords: JsonRecord[],
  recordEnvelopeVerificationRecords: JsonRecord[],
): string[] {
  if (recordEnvelopeRecords.length === 0) {
    return [
      'Unsigned record envelope preview source is not supplied.',
      'Record envelope verification report is not supplied.',
      'Tamper-evident benchmark digests exist, but a cross-record hash chain is not implemented.',
      'Authority records are not signed across evidence/proof/scope/apply lifecycle reports.',
    ]
  }
  const gaps = [
    'Unsigned deterministic envelope previews are recorded, but cryptographic signature verification is not implemented.',
    'A cross-record hash chain is not implemented across DevView authority records.',
    'Authority records are not signed across evidence/proof/scope/apply lifecycle reports.',
  ]
  if (recordEnvelopeVerificationRecords.length === 0) {
    gaps.unshift('Record envelope verification report is not supplied.')
  } else {
    gaps.unshift('Record envelope verification is unsigned deterministic digest verification only.')
  }
  return gaps
}

function recordEnvelopeSummary(
  source: LoadedSource,
): EnterpriseReadinessReport['sourceRecordEnvelopePreviews'][number] {
  const record = source.record ?? {}
  const payloadSummary = asRecord(record.payloadSummary)
  const verificationSummary = asRecord(record.verificationSummary)
  const authorizationClaim = asRecord(record.authorizationClaim)
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    payloadArtifactRole: stringValue(payloadSummary?.artifactRole),
    payloadStatus: stringValue(payloadSummary?.status),
    payloadSha256Present: Boolean(stringValue(payloadSummary?.sha256)),
    envelopeSha256Present: Boolean(stringValue(record.envelopeSha256)),
    sourceArtifactDigestCount: arrayLength(record.sourceArtifactDigests) ?? 0,
    actorIdentityRecorded: Boolean(booleanValue(verificationSummary?.actorIdentityRecorded)),
    requiredPermission: stringValue(authorizationClaim?.requiredPermission),
    signatureMode: stringValue(record.signatureMode),
    cryptographicSignaturePresent: booleanOrNull(record.cryptographicSignaturePresent),
    cryptographicSignatureVerified: booleanOrNull(verificationSummary?.cryptographicSignatureVerified),
    rbacEnforced: booleanOrNull(record.rbacEnforced),
    permissionVerified: booleanOrNull(record.permissionVerified),
    previousEnvelopeLinked: booleanOrNull(verificationSummary?.previousEnvelopeLinked),
  }
}

function recordEnvelopeVerificationSummary(
  source: LoadedSource,
): EnterpriseReadinessReport['sourceRecordEnvelopeVerifications'][number] {
  const record = source.record ?? {}
  const sourcePreview = asRecord(record.sourceRecordEnvelopePreview)
  const payloadVerification = asRecord(record.payloadVerification)
  const sourceArtifactVerification = asRecord(record.sourceArtifactVerification)
  const previousEnvelopeVerification = asRecord(record.previousEnvelopeVerification)
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    sourcePreviewPath: stringValue(sourcePreview?.path),
    sourcePreviewArtifactRole: stringValue(sourcePreview?.artifactRole),
    sourcePreviewStatus: stringValue(sourcePreview?.status),
    payloadPathMatches: booleanOrNull(payloadVerification?.pathMatches),
    payloadDigestMatches: booleanOrNull(payloadVerification?.digestMatches),
    payloadByteLengthMatches: booleanOrNull(payloadVerification?.byteLengthMatches),
    sourceArtifactExpectedCount: numberValue(sourceArtifactVerification?.expectedCount),
    sourceArtifactActualCount: numberValue(sourceArtifactVerification?.actualCount),
    allSourceDigestsMatch: booleanOrNull(sourceArtifactVerification?.allSourceDigestsMatch),
    previousEnvelopeRequired: booleanOrNull(previousEnvelopeVerification?.required),
    previousEnvelopeSupplied: booleanOrNull(previousEnvelopeVerification?.supplied),
    previousEnvelopeChainLinkVerified: booleanOrNull(previousEnvelopeVerification?.chainLinkVerified),
    verificationDigestPresent: Boolean(stringValue(record.verificationDigest)),
    signatureVerificationMode: stringValue(record.signatureVerificationMode),
    cryptographicSignatureVerified: booleanOrNull(record.cryptographicSignatureVerified),
    rbacPermissionVerified: booleanOrNull(record.rbacPermissionVerified),
    rbacEnforced: booleanOrNull(record.rbacEnforced),
    permissionVerified: booleanOrNull(record.permissionVerified),
  }
}

function signingReadinessSummary(
  source: LoadedSource,
): EnterpriseReadinessReport['sourceSigningReadinessReports'][number] {
  const record = source.record ?? {}
  const envelopePrerequisite = asRecord(record.envelopePrerequisiteSummary)
  const keyGovernance = asRecord(record.keyGovernanceReadiness)
  const signaturePolicy = asRecord(record.signaturePolicyReadiness)
  const rbacPrerequisite = asRecord(record.rbacPrerequisiteSummary)
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    signingReadinessStatus: stringValue(record.signingReadinessStatus),
    envelopePreviewCount: numberValue(envelopePrerequisite?.previewCount),
    envelopeVerificationCount: numberValue(envelopePrerequisite?.verificationCount),
    payloadDigestVerifiedCount: numberValue(envelopePrerequisite?.payloadDigestVerifiedCount),
    sourceDigestVerifiedCount: numberValue(envelopePrerequisite?.sourceDigestVerifiedCount),
    previousChainVerifiedCount: numberValue(envelopePrerequisite?.previousChainVerifiedCount),
    signedEnvelopeCount: numberValue(envelopePrerequisite?.signedEnvelopeCount),
    keyGovernanceStatus: stringValue(keyGovernance?.status),
    keyRegistryPresent: booleanOrNull(keyGovernance?.keyRegistryPresent),
    trustRootPresent: booleanOrNull(keyGovernance?.trustRootPresent),
    privateKeyStoragePresent: booleanOrNull(keyGovernance?.privateKeyStoragePresent),
    noPrivateKeyStorageInRepo: booleanOrNull(keyGovernance?.noPrivateKeyStorageInRepo),
    signaturePolicyStatus: stringValue(signaturePolicy?.status),
    detachedSignaturePolicyPresent: booleanOrNull(signaturePolicy?.detachedSignaturePolicyPresent),
    signatureFormatPolicyPresent: booleanOrNull(signaturePolicy?.signatureFormatPolicyPresent),
    rbacActorModelPresent: booleanOrNull(rbacPrerequisite?.actorModelPresent),
    rbacPermissionMatrixPresent: booleanOrNull(rbacPrerequisite?.permissionMatrixPresent),
    rbacRoleAssignmentRegistryPresent: booleanOrNull(rbacPrerequisite?.roleAssignmentRegistryPresent),
    rbacEnforced: booleanOrNull(rbacPrerequisite?.rbacEnforced),
    permissionVerificationEnforced: booleanOrNull(rbacPrerequisite?.permissionVerificationEnforced),
    futureSignedEnvelopeRequirementCount: arrayLength(record.futureSignedEnvelopeRequirements),
  }
}

function rbacPolicyValidationSummary(
  source: LoadedSource,
): EnterpriseReadinessReport['sourceRbacPolicyValidationReports'][number] {
  const record = source.record ?? {}
  const defaultDenyStatus = asRecord(record.defaultDenyStatus)
  const actorSummary = asRecord(record.actorSummary)
  const roleAssignmentSummary = asRecord(record.roleAssignmentSummary)
  const permissionGrantSummary = asRecord(record.permissionGrantSummary)
  const automationRestrictionStatus = asRecord(record.automationRestrictionStatus)
  const extensionAuthorRestrictionStatus = asRecord(record.extensionAuthorRestrictionStatus)
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    rbacPolicyValidationStatus: stringValue(record.rbacPolicyValidationStatus),
    defaultDenyConfigured: booleanOrNull(defaultDenyStatus?.defaultDenyConfigured),
    actorCount: numberValue(actorSummary?.actorCount),
    roleAssignmentCount: numberValue(roleAssignmentSummary?.assignmentCount),
    permissionGrantCount: numberValue(permissionGrantSummary?.grantCount),
    automationRestrictionDeclared: booleanOrNull(automationRestrictionStatus?.automationRestrictionDeclared),
    automationOvergrantCount: numberValue(automationRestrictionStatus?.automationOvergrantCount),
    extensionAuthorRestrictionDeclared: booleanOrNull(
      extensionAuthorRestrictionStatus?.extensionAuthorRestrictionDeclared,
    ),
    extensionAuthorOvergrantCount: numberValue(extensionAuthorRestrictionStatus?.extensionAuthorOvergrantCount),
    policyFindingCount: arrayLength(record.policyFindings),
    downstreamActionCount: arrayLength(record.downstreamActionPlan),
    rbacEnforced: booleanOrNull(record.rbacEnforced),
    permissionVerified: booleanOrNull(record.permissionVerified),
    cryptographicSignaturePresent: booleanOrNull(record.cryptographicSignaturePresent),
    cryptographicSignatureVerified: booleanOrNull(record.cryptographicSignatureVerified),
  }
}

function releaseProvenanceReadinessSummary(
  source: LoadedSource,
): EnterpriseReadinessReport['sourceReleaseProvenanceReadinessReports'][number] {
  const record = source.record ?? {}
  const packageMetadata = asRecord(record.packageMetadataSummary)
  const sbomReadiness = asRecord(record.sbomReadiness)
  const packageSigning = asRecord(record.packageSigningReadiness)
  const provenance = asRecord(record.provenanceAttestationReadiness)
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    releaseProvenanceReadinessStatus: stringValue(record.releaseProvenanceReadinessStatus),
    packageName: stringValue(packageMetadata?.packageName),
    packageVersion: stringValue(packageMetadata?.packageVersion),
    packageFilesAllowlistPresent: booleanOrNull(packageMetadata?.packageFilesAllowlistPresent),
    packageFilesAllowlistCount: numberValue(packageMetadata?.packageFilesAllowlistCount),
    releaseSurfaceScriptPresent: booleanOrNull(packageMetadata?.releaseSurfaceScriptPresent),
    releaseSurfaceCheckerPresent: booleanOrNull(packageMetadata?.releaseSurfaceCheckerPresent),
    sbomGenerated: booleanOrNull(sbomReadiness?.sbomGenerated),
    sbomPresent: booleanOrNull(sbomReadiness?.sbomPresent),
    sbomAttested: booleanOrNull(sbomReadiness?.sbomAttested),
    packageSigningPresent: booleanOrNull(packageSigning?.packageSigningPresent),
    packageSignatureVerified: booleanOrNull(packageSigning?.packageSignatureVerified),
    provenanceAttestationPresent: booleanOrNull(provenance?.provenanceAttestationPresent),
    provenanceAttested: booleanOrNull(provenance?.provenanceAttested),
    findingCount: arrayLength(record.releaseProvenanceFindings),
    downstreamActionCount: arrayLength(record.downstreamActionPlan),
  }
}

function sbomValidationSummary(source: LoadedSource): EnterpriseReadinessReport['sourceSbomValidationReports'][number] {
  const record = source.record ?? {}
  const sourceSbom = asRecord(record.sourceSbomArtifact)
  const alignment = asRecord(record.packageIdentityAlignment)
  const coverage = asRecord(record.componentCoverageSummary)
  const digest = asRecord(record.digestSummary)
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    sbomValidationStatus: stringValue(record.sbomValidationStatus),
    sbomFormat: stringValue(sourceSbom?.sbomFormat),
    packageName: stringValue(sourceSbom?.packageName),
    packageVersion: stringValue(sourceSbom?.packageVersion),
    componentCount: numberValue(coverage?.componentCount),
    packageIdentityAlignmentStatus: stringValue(alignment?.alignmentStatus),
    sbomSha256Present: Boolean(stringValue(digest?.sbomSha256)),
    sourceArtifactDigestCount: arrayLength(digest?.sourceArtifactDigests),
    findingCount: arrayLength(record.validationFindings),
    downstreamActionCount: arrayLength(record.downstreamActionPlan),
    sbomGeneratedByDevView: booleanOrNull(record.sbomGeneratedByDevView),
    sbomGenerated: booleanOrNull(record.sbomGenerated),
    sbomAttested: booleanOrNull(record.sbomAttested),
    packageSigned: booleanOrNull(record.packageSigned),
    packageSigningPresent: booleanOrNull(record.packageSigningPresent),
    provenanceAttested: booleanOrNull(record.provenanceAttested),
  }
}

function packageProvenanceInputsSummary(
  source: LoadedSource,
): EnterpriseReadinessReport['sourcePackageProvenanceInputsRecords'][number] {
  const record = source.record ?? {}
  const packageMetadata = asRecord(record.packageMetadataSummary)
  const sourceRef = asRecord(record.sourceRefSummary)
  const buildInput = asRecord(record.buildInputSummary)
  const releaseSurface = asRecord(record.releaseSurfaceSourceSummary)
  const releaseProvenance = asRecord(record.releaseProvenanceReadinessSummary)
  const sbomValidation = asRecord(record.sbomValidationSummary)
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    packageProvenanceInputsStatus: stringValue(record.packageProvenanceInputsStatus),
    packageName: stringValue(packageMetadata?.packageName),
    packageVersion: stringValue(packageMetadata?.packageVersion),
    sourceArtifactDigestCount: arrayLength(record.sourceArtifactDigests),
    sourceRefStatus: stringValue(sourceRef?.sourceRefStatus),
    sourceRefSupplied: stringValue(sourceRef?.sourceRefStatus) === 'supplied-explicit-cli-input',
    buildCommandLabelStatus: stringValue(buildInput?.buildCommandLabelStatus),
    buildCommandLabelSupplied: stringValue(buildInput?.buildCommandLabelStatus) === 'supplied-metadata-only',
    buildCommandExecuted: booleanOrNull(buildInput?.buildCommandExecuted),
    packageDigestStatus: stringValue(record.packageDigestStatus),
    packageArtifactSupplied: booleanOrNull(record.packageArtifactSupplied),
    packageArtifactSha256Present: Boolean(stringValue(record.packageArtifactSha256)),
    provenanceAttestationStatus: stringValue(record.provenanceAttestationStatus),
    releaseSurfaceSourceSupplied: booleanOrNull(releaseSurface?.supplied),
    releaseProvenanceReadinessSupplied: booleanOrNull(releaseProvenance?.supplied),
    sbomValidationSupplied: booleanOrNull(sbomValidation?.supplied),
    findingCount: arrayLength(record.packageProvenanceFindings),
    downstreamActionCount: arrayLength(record.downstreamActionPlan),
    packageSigned: booleanOrNull(record.packageSigned),
    packageSigningPresent: booleanOrNull(record.packageSigningPresent),
    sbomGenerated: booleanOrNull(record.sbomGenerated),
    sbomAttested: booleanOrNull(record.sbomAttested),
    provenanceAttested: booleanOrNull(record.provenanceAttested),
  }
}

function packageArtifactDigestSummary(
  source: LoadedSource,
): EnterpriseReadinessReport['sourcePackageArtifactDigestRecords'][number] {
  const record = source.record ?? {}
  const artifact = asRecord(record.sourcePackageArtifact)
  const identity = asRecord(record.packageIdentitySummary)
  const provenanceInputs = asRecord(record.sourcePackageProvenanceInputs)
  const releaseSurface = asRecord(record.sourceReleaseSurfaceValidation)
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    artifactDigestStatus: stringValue(record.artifactDigestStatus),
    packageArtifactPath: stringValue(artifact?.path),
    fileName: stringValue(artifact?.fileName),
    byteLength: numberValue(artifact?.byteLength),
    sha256Present: Boolean(stringValue(artifact?.sha256)),
    expectedSha256Supplied: booleanOrNull(artifact?.expectedSha256Supplied),
    expectedSha256Match: booleanOrNull(artifact?.expectedSha256Match),
    packageName: stringValue(identity?.packageName),
    packageVersion: stringValue(identity?.packageVersion),
    packageIdentitySource: stringValue(identity?.packageIdentitySource),
    sourceArtifactDigestCount: arrayLength(record.sourceArtifactDigests),
    packageProvenanceInputsLinked: booleanOrNull(provenanceInputs?.supplied),
    releaseSurfaceValidationLinked: booleanOrNull(releaseSurface?.supplied),
    findingCount: arrayLength(record.packageDigestRecordFindings),
    downstreamActionCount: arrayLength(record.downstreamActionPlan),
    packageArtifactGeneratedByDevView: booleanOrNull(record.packageArtifactGeneratedByDevView),
    packageArtifactGenerated: booleanOrNull(record.packageArtifactGenerated),
    packageTarballGenerated: booleanOrNull(record.packageTarballGenerated),
    packagePublished: booleanOrNull(record.packagePublished),
    packageSigned: booleanOrNull(record.packageSigned),
    packageSigningPresent: booleanOrNull(record.packageSigningPresent),
    sbomGenerated: booleanOrNull(record.sbomGenerated),
    sbomAttested: booleanOrNull(record.sbomAttested),
    provenanceAttested: booleanOrNull(record.provenanceAttested),
  }
}

function provenanceAttestationValidationSummary(
  source: LoadedSource,
): EnterpriseReadinessReport['sourceProvenanceAttestationValidationReports'][number] {
  const record = source.record ?? {}
  const attestation = asRecord(record.sourceAttestationArtifact)
  const digest = asRecord(record.digestSummary)
  const packageDigestAlignment = asRecord(record.packageDigestAlignment)
  const provenanceInputAlignment = asRecord(record.provenanceInputAlignment)
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    attestationValidationStatus: stringValue(record.attestationValidationStatus),
    signatureValidationStatus: stringValue(record.signatureValidationStatus),
    attestationFormat: stringValue(attestation?.attestationFormat),
    packageName: stringValue(attestation?.packageName),
    packageVersion: stringValue(attestation?.packageVersion),
    attestationSha256Present: Boolean(stringValue(attestation?.sha256) ?? stringValue(digest?.attestationSha256)),
    packageDigestAlignmentStatus: stringValue(packageDigestAlignment?.alignmentStatus),
    packageDigestMatches: booleanOrNull(packageDigestAlignment?.packageDigestMatches),
    provenanceInputAlignmentStatus: stringValue(provenanceInputAlignment?.alignmentStatus),
    provenanceInputMatches: stringValue(provenanceInputAlignment?.alignmentStatus) === 'matched',
    findingCount: arrayLength(record.validationFindings),
    downstreamActionCount: arrayLength(record.downstreamActionPlan),
    provenanceAttestationGeneratedByDevView: booleanOrNull(record.provenanceAttestationGeneratedByDevView),
    provenanceAttestationGenerated: booleanOrNull(record.provenanceAttestationGenerated),
    provenanceAttestationVerified: booleanOrNull(record.provenanceAttestationVerified),
    provenanceAttested: booleanOrNull(record.provenanceAttested),
    packageSigned: booleanOrNull(record.packageSigned),
    packageSigningPresent: booleanOrNull(record.packageSigningPresent),
    sbomAttested: booleanOrNull(record.sbomAttested),
    cryptographicSignatureVerified: booleanOrNull(record.cryptographicSignatureVerified),
  }
}

function provenanceVerificationReadinessSummary(
  source: LoadedSource,
): EnterpriseReadinessReport['sourceProvenanceVerificationReadinessReports'][number] {
  const record = source.record ?? {}
  const boundary = asRecord(record.verificationBoundary)
  const keyTrust = asRecord(record.keyTrustReadiness)
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    provenanceVerificationReadinessStatus: stringValue(record.provenanceVerificationReadinessStatus),
    attestationValidationLinked: booleanOrNull(asRecord(record.sourceProvenanceAttestationValidation)?.supplied),
    signingReadinessLinked: booleanOrNull(asRecord(record.sourceSigningReadiness)?.supplied),
    rbacPolicyValidationLinked: booleanOrNull(asRecord(record.sourceRbacPolicyValidation)?.supplied),
    recordEnvelopeVerificationLinked: booleanOrNull(asRecord(record.sourceRecordEnvelopeVerification)?.supplied),
    providerNetworkDefaultDenyLinked: booleanOrNull(asRecord(record.sourceProviderNetworkPolicy)?.supplied),
    realSlsaVerificationPerformed: booleanOrNull(boundary?.realSlsaVerificationPerformed),
    realInTotoVerificationPerformed: booleanOrNull(boundary?.realInTotoVerificationPerformed),
    cryptographicSignatureVerified: booleanOrNull(boundary?.cryptographicSignatureVerified),
    signatureVerificationStatus: stringValue(boundary?.signatureVerificationStatus),
    provenanceAttestationGenerated: booleanOrNull(boundary?.provenanceAttestationGenerated),
    provenanceAttestationVerified: booleanOrNull(boundary?.provenanceAttestationVerified),
    keyRegistryPresent: booleanOrNull(keyTrust?.keyRegistryPresent),
    trustRootPresent: booleanOrNull(keyTrust?.trustRootPresent),
    findingCount: arrayLength(record.provenanceVerificationFindings),
    downstreamActionCount: arrayLength(record.downstreamActionPlan),
  }
}

function payloadDigestVerifiedCount(records: JsonRecord[]): number {
  return records.filter((record) => booleanValue(asRecord(record.payloadVerification)?.digestMatches)).length
}

function sourceDigestsVerifiedCount(records: JsonRecord[]): number {
  return records.filter((record) => booleanValue(asRecord(record.sourceArtifactVerification)?.allSourceDigestsMatch))
    .length
}

function previousEnvelopeChainLinkVerifiedCount(records: JsonRecord[]): number {
  return records.filter((record) => booleanValue(asRecord(record.previousEnvelopeVerification)?.chainLinkVerified))
    .length
}

function uniqueStrings(values: Array<string | null>): string[] {
  return [...new Set(values.filter((entry): entry is string => Boolean(entry)))]
}

function readinessLevel(findings: EnterpriseReadinessFinding[]): EnterpriseReadinessReport['readinessLevel'] {
  if (findings.some((entry) => entry.severity === 'blocker')) return 'not-ready'
  if (findings.some((entry) => entry.severity === 'gap')) return 'partial'
  return 'ready-for-static-benchmark-review-only'
}

function downstreamActionPlan(findings: EnterpriseReadinessFinding[]): string[] {
  const actions = new Set<string>()
  const openFindings = findings.filter((entry) => entry.severity !== 'satisfied')
  if (openFindings.some((entry) => entry.code.includes('RELEASE_SURFACE'))) {
    actions.add('Run and attach release-surface validation before any enterprise release review.')
  }
  if (openFindings.some((entry) => entry.code.includes('BENCHMARK_GOVERNANCE'))) {
    actions.add('Attach verified benchmark governance before benchmark-based product claims.')
  }
  if (openFindings.some((entry) => entry.code.includes('PROVIDER_NETWORK'))) {
    actions.add('Attach a provider/network default-deny policy report before enterprise release review.')
  }
  if (openFindings.some((entry) => entry.code.includes('RELEASE_PROVENANCE'))) {
    actions.add('Attach release provenance readiness and plan real SBOM/signing/provenance only behind governance.')
  }
  if (openFindings.some((entry) => entry.code.includes('SBOM_VALIDATION'))) {
    actions.add('Attach structural SBOM validation before release SBOM/provenance review.')
  }
  if (openFindings.some((entry) => entry.code.includes('PACKAGE_PROVENANCE_INPUTS'))) {
    actions.add('Attach package provenance inputs before package artifact digest or attestation planning.')
  }
  if (openFindings.some((entry) => entry.code.includes('PACKAGE_ARTIFACT_DIGEST'))) {
    actions.add('Attach package artifact digest records before provenance attestation planning.')
  }
  if (openFindings.some((entry) => entry.code.includes('PROVENANCE_ATTESTATION_VALIDATION'))) {
    actions.add('Attach structural provenance attestation validation before any release provenance claim.')
  }
  if (openFindings.some((entry) => entry.code.includes('PROVENANCE_VERIFICATION_READINESS'))) {
    actions.add('Attach provenance verification readiness before planning signed provenance verification.')
  }
  if (openFindings.some((entry) => entry.code.includes('RBAC_POLICY_VALIDATION'))) {
    actions.add('Attach RBAC policy validation before planning RBAC enforcement or signed policy rollout.')
  }
  if (openFindings.some((entry) => entry.code.includes('RECORD_ENVELOPE_VERIFICATION'))) {
    actions.add('Attach record envelope verification reports before planning real signed-envelope governance.')
  } else if (openFindings.some((entry) => entry.code.includes('RECORD_ENVELOPE'))) {
    actions.add('Attach unsigned record envelope previews before planning real signed-envelope governance.')
  }
  actions.add('Plan RBAC actor identity and signed record envelope before enterprise authority claims.')
  actions.add('Add rollback drill and audit-chain reporting for guarded graph update operations.')
  actions.add('Plan policy-gated external Scope/CI activation without mutating branch protection in this report.')
  return [...actions]
}

function blockingFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): EnterpriseReadinessFinding {
  return { severity: 'blocker', code, message, path: pathValue, field }
}

function collectUnsafeAuthorityHits(
  value: unknown,
  pathParts: string[] = [],
  seen = new Set<unknown>(),
): Array<{ field: string }> {
  if (typeof value !== 'object' || value === null || seen.has(value)) return []
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

function collectTrueFieldHits(
  value: unknown,
  fieldNames: string[],
  pathParts: string[] = [],
  seen = new Set<unknown>(),
): Array<{ field: string }> {
  if (typeof value !== 'object' || value === null || seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectTrueFieldHits(entry, fieldNames, [...pathParts, String(index)], seen))
  }
  const record = value as JsonRecord
  const hits: Array<{ field: string }> = []
  for (const [key, entry] of Object.entries(record)) {
    const nextPath = [...pathParts, key]
    if (fieldNames.includes(key) && entry === true) {
      hits.push({ field: nextPath.join('.') })
    }
    hits.push(...collectTrueFieldHits(entry, fieldNames, nextPath, seen))
  }
  return hits
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

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
    : []
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function booleanValue(value: unknown): boolean {
  return value === true
}

function arrayLength(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null
}

function parseList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
