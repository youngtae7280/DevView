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

export interface EnterpriseReadinessReportOptions {
  benchmarkGovernanceVerification?: string
  releaseSurfaceValidation?: string
  providerNetworkPolicyReport?: string
  recordEnvelopePreview?: string
  recordEnvelopeVerification?: string
  signingReadiness?: string
  rbacPolicyValidation?: string
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
  releaseSurfaceReadiness: {
    status: 'satisfied' | 'failed' | 'not-supplied'
    packageAllowlistPresent: boolean
    releaseSurfaceCheckerAvailable: true
    forbiddenFindingCount: number | null
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
  const sourcePaths = [
    options.benchmarkGovernanceVerification,
    options.releaseSurfaceValidation,
    options.providerNetworkPolicyReport,
    ...recordEnvelopePreviewPaths,
    ...recordEnvelopeVerificationPaths,
    ...signingReadinessPaths,
    ...rbacPolicyValidationPaths,
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
  const blockingFindings = validateSources(
    benchmarkGovernance,
    releaseSurface,
    providerNetworkPolicy,
    recordEnvelopePreviews,
    recordEnvelopeVerifications,
    signingReadinessReports,
    rbacPolicyValidationReports,
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
    buildFindings(
      benchmarkGovernance,
      releaseSurface,
      providerNetworkPolicy,
      recordEnvelopePreviews,
      recordEnvelopeVerifications,
      signingReadinessReports,
      rbacPolicyValidationReports,
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
    releaseSurfaceReadiness: {
      status: releaseStatus,
      packageAllowlistPresent: true,
      releaseSurfaceCheckerAvailable: true,
      forbiddenFindingCount: numberValue(releaseRecord?.forbiddenFindingCount),
      gaps: ['Package signing, SBOM, and package provenance attestations are not recorded in this v1 report.'],
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
    } else {
      validateRbacPolicyValidationSource(source, record, findings)
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

  findings.push(
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
