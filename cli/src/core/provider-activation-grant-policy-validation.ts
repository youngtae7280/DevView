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

const POLICY_ROLE = 'devview-provider-activation-grant-policy'
const POLICY_STATUS = 'devview-provider-activation-grant-policy-configured'
const POLICY_SCOPE = 'provider-activation-grant-policy-validation-report-only'
const REPORT_ROLE = 'devview-provider-activation-grant-policy-validation-report'
const PASSED_STATUS = 'devview-provider-activation-grant-policy-validation-passed'
const BLOCKED_STATUS = 'devview-provider-activation-grant-policy-validation-blocked'
const PROVIDER_NETWORK_ROLE = 'devview-provider-network-default-deny-policy-report'
const PROVIDER_NETWORK_STATUS = 'devview-provider-network-default-deny-policy-recorded'
const PROVIDER_ACTIVATION_AUTHORIZATION_ROLE = 'devview-provider-activation-authorization-readiness-report'
const PROVIDER_ACTIVATION_AUTHORIZATION_STATUS = 'devview-provider-activation-authorization-readiness-reported'
const CI_BRANCH_ACTIVATION_AUTHORITY_ROLE = 'devview-ci-branch-activation-authority-readiness-report'
const CI_BRANCH_ACTIVATION_AUTHORITY_STATUS = 'devview-ci-branch-activation-authority-readiness-reported'
const CI_BRANCH_ACTIVATION_PLAN_ROLE = 'devview-ci-branch-activation-plan-report'
const CI_BRANCH_ACTIVATION_PLAN_STATUS = 'devview-ci-branch-activation-plan-recorded'
const RBAC_POLICY_VALIDATION_ROLE = 'devview-rbac-policy-validation-report'
const RBAC_POLICY_VALIDATION_STATUS = 'devview-rbac-policy-validation-passed'
const SIGNING_READINESS_ROLE = 'devview-signing-readiness-report'
const SIGNING_READINESS_STATUS = 'devview-signing-readiness-reported'
const RECORD_ENVELOPE_VERIFICATION_ROLE = 'devview-record-envelope-verification-report'
const RECORD_ENVELOPE_VERIFICATION_STATUS = 'devview-record-envelope-verified'
const PROVENANCE_VERIFICATION_READINESS_ROLE = 'devview-provenance-verification-readiness-report'
const PROVENANCE_VERIFICATION_READINESS_STATUS = 'devview-provenance-verification-readiness-reported'
const ENTERPRISE_READINESS_ROLE = 'devview-enterprise-readiness-report'
const ENTERPRISE_READINESS_STATUS = 'devview-enterprise-readiness-report-generated'

const unsafeAuthorityFields = [
  'enterpriseGateActivated',
  'providerInvoked',
  'networkCallMade',
  'apiCallMade',
  'ciProviderCalled',
  'githubMutated',
  'githubWorkflowMutated',
  'workflowExecuted',
  'workflowsExecuted',
  'shellCommandExecuted',
  'shellCommandsExecuted',
  'extensionExecutionAllowed',
  'extensionsExecuted',
  'extensionCodeExecuted',
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
  'cryptographicSignaturePresent',
  'cryptographicSignatureVerified',
  'cryptographicSigningImplemented',
  'signedPolicyPresent',
  'signedPolicyVerified',
  'signedPolicyArtifactPresent',
  'signedRecordEnvelopePresent',
  'keyGenerated',
  'privateKeyStored',
  'keyManagementImplemented',
  'keyRegistryPresent',
  'trustRootPresent',
  'keyRegistryCreated',
  'trustRootCreated',
  'signaturePolicyEnforced',
  'rbacEnforced',
  'permissionVerified',
  'rbacPermissionVerified',
  'providerGrantPresent',
  'providerGrantVerified',
  'providerGrantActive',
  'providerGrantActivated',
  'providerAllowlistActive',
  'networkAllowlistActive',
  'explicitAllowSupported',
  'providerCredentialsRead',
  'providerCredentialsStored',
  'packagePublished',
  'packageArtifactGeneratedByDevView',
  'packageArtifactGenerated',
  'packageTarballGenerated',
  'packageSigned',
  'sbomGenerated',
  'sbomGeneratedByDevView',
  'sbomAttested',
  'provenanceAttested',
  'provenanceAttestationGenerated',
  'provenanceAttestationGeneratedByDevView',
  'provenanceAttestationVerified',
  'realSlsaVerificationPerformed',
  'realInTotoVerificationPerformed',
]

const allowlistFields = [
  'providerAllowlist',
  'networkAllowlist',
  'apiAllowlist',
  'allowedProviders',
  'allowedNetworkHosts',
  'allowedApiEndpoints',
  'providerGrants',
  'networkGrants',
  'apiGrants',
  'providerGrant',
  'providerGrantPolicy',
]

const executableInstructionFields = [
  'script',
  'scripts',
  'shellCommand',
  'shellCommands',
  'command',
  'commands',
  'providerInstruction',
  'providerInstructions',
  'networkInstruction',
  'networkInstructions',
  'apiInstruction',
  'apiInstructions',
  'execute',
  'execution',
]

const secretMaterialFields = [
  'credential',
  'credentials',
  'token',
  'tokens',
  'accessToken',
  'apiToken',
  'apiKey',
  'secret',
  'secrets',
  'privateKey',
  'privateKeyPem',
  'privateKeyMaterial',
  'keyMaterial',
  'secretKey',
  'keySecret',
  'signature',
  'signatureValue',
  'signaturePath',
]

export interface ProviderActivationGrantPolicyValidationOptions {
  policy?: string
  providerNetworkPolicyReport?: string
  providerActivationAuthorizationReadiness?: string
  ciBranchActivationAuthorityReadiness?: string
  ciBranchActivationPlan?: string
  rbacPolicyValidation?: string
  signingReadiness?: string
  recordEnvelopeVerification?: string
  provenanceVerificationReadiness?: string
  enterpriseReadiness?: string
  output?: string
  markdown?: string
}

export interface ProviderActivationGrantPolicyFinding {
  severity: 'blocker' | 'gap' | 'advisory' | 'satisfied'
  code: string
  message: string
  path?: string
  field?: string
}

type SourceKind =
  | 'policy'
  | 'provider-network-policy-report'
  | 'provider-activation-authorization-readiness'
  | 'ci-branch-activation-authority-readiness'
  | 'ci-branch-activation-plan'
  | 'rbac-policy-validation'
  | 'signing-readiness'
  | 'record-envelope-verification'
  | 'provenance-verification-readiness'
  | 'enterprise-readiness'

interface LoadedSource {
  requestedPath: string
  resolvedPath: string
  relativePath: string
  sourceKind: SourceKind
  record: JsonRecord | null
  sha256: string | null
  byteLength: number | null
  readError: string | null
}

interface SourceSummary {
  supplied: boolean
  path: string | null
  artifactRole: string | null
  status: string | null
  sha256: string | null
  byteLength: number | null
}

export interface ProviderActivationGrantPolicyValidationReport extends JsonRecord {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof PASSED_STATUS | typeof BLOCKED_STATUS
  validationScope: typeof POLICY_SCOPE
  sourceFactsOnly: true
  reportOnly: true
  providerActivationGrantPolicyValidationStatus:
    | 'passed-report-only-grant-policy-not-active'
    | 'partial-readiness-source-linkage-missing'
    | 'blocked-unsafe-authority-claim'
  sourcePolicy: SourceSummary & {
    policyScope: string | null
    activationMode: string | null
    defaultProviderPolicy: string | null
    defaultNetworkPolicy: string | null
    providerId: string | null
    operationCount: number
    repositoryScopeCount: number
    projectScopeCount: number
    branchScopeCount: number
    checkScopeCount: number
  }
  sourceProviderNetworkPolicy: SourceSummary & {
    defaultProviderPolicy: string | null
    defaultNetworkPolicy: string | null
    providerAllowlistCount: number | null
    networkAllowlistCount: number | null
    explicitAllowSupported: boolean | null
  }
  sourceProviderActivationAuthorizationReadiness: SourceSummary & {
    authorizationReadinessStatus: string | null
    providerGrantPresent: boolean | null
    providerGrantVerified: boolean | null
    providerAllowlistActive: boolean | null
    networkAllowlistActive: boolean | null
    providerInvoked: boolean | null
    networkCallMade: boolean | null
    apiCallMade: boolean | null
    futureProviderGrantRequirementCount: number | null
  }
  sourceCiBranchActivationAuthorityReadiness: SourceSummary & {
    authorityReadinessStatus: string | null
    signedPolicyPresent: boolean | null
    providerGrantPresent: boolean | null
    rbacEnforced: boolean | null
  }
  sourceCiBranchActivationPlan: SourceSummary & {
    activationPlanStatus: string | null
    futureOnlyStepCount: number
    executedStepCount: number
  }
  sourceRbacPolicyValidation: SourceSummary & {
    rbacPolicyValidationStatus: string | null
    actorCount: number | null
    roleAssignmentCount: number | null
    permissionGrantCount: number | null
  }
  sourceSigningReadiness: SourceSummary & {
    signingReadinessStatus: string | null
    keyRegistryPresent: boolean | null
    trustRootPresent: boolean | null
  }
  sourceRecordEnvelopeVerification: SourceSummary & {
    payloadDigestMatches: boolean | null
    allSourceDigestsMatch: boolean | null
    signatureVerificationMode: string | null
  }
  sourceProvenanceVerificationReadiness: SourceSummary & {
    provenanceVerificationReadinessStatus: string | null
    realSlsaVerificationPerformed: boolean | null
    realInTotoVerificationPerformed: boolean | null
  }
  sourceEnterpriseReadiness: SourceSummary & {
    readinessLevel: string | null
  }
  grantPolicyValidation: JsonRecord
  providerOperationScopeValidation: JsonRecord
  actorAuthorizationRequirementValidation: JsonRecord
  signedPolicyRequirementValidation: JsonRecord
  ttlRevocationValidation: JsonRecord
  auditReviewValidation: JsonRecord
  activationBoundary: JsonRecord
  sourceArtifactDigests: Array<{
    path: string
    sourceKind: SourceKind
    artifactRole: string | null
    status: string | null
    sha256: string | null
    byteLength: number | null
  }>
  validationFindings: ProviderActivationGrantPolicyFinding[]
  downstreamActionPlan: string[]
  enterpriseGateActivated: false
  providerInvoked: false
  networkCallMade: false
  apiCallMade: false
  providerAllowlistActive: false
  networkAllowlistActive: false
  providerGrantPresent: false
  providerGrantVerified: false
  providerGrantActive: false
  providerGrantActivated: false
  providerCredentialsRead: false
  providerCredentialsStored: false
  githubMutated: false
  githubWorkflowMutated: false
  branchProtectionChanged: false
  branchProtectionMutated: false
  requiredChecksConfigured: false
  requiredChecksMutated: false
  externalCiMutated: false
  hooksActivated: false
  rbacEnforced: false
  permissionVerified: false
  rbacPermissionVerified: false
  cryptographicSignaturePresent: false
  cryptographicSignatureVerified: false
  signedPolicyPresent: false
  signedPolicyVerified: false
  keyGenerated: false
  privateKeyStored: false
  keyRegistryCreated: false
  trustRootCreated: false
  packagePublished: false
  packageArtifactGeneratedByDevView: false
  packageArtifactGenerated: false
  packageTarballGenerated: false
  packageSigned: false
  sbomGeneratedByDevView: false
  sbomGenerated: false
  sbomAttested: false
  provenanceAttestationGenerated: false
  provenanceAttestationVerified: false
  provenanceAttested: false
  graphSourceMutated: false
  graphDeltaApplied: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  approvalAutomationEnabled: false
  userAcceptanceAutomated: false
  writtenOutputPath?: string
  writtenMarkdownPath?: string
}

export class ProviderActivationGrantPolicyValidationError extends Error {
  constructor(public readonly report: ProviderActivationGrantPolicyValidationReport) {
    super('Provider activation grant policy validation is blocked.')
  }
}

export async function validateProviderActivationGrantPolicy(
  root: string,
  options: ProviderActivationGrantPolicyValidationOptions,
): Promise<ProviderActivationGrantPolicyValidationReport> {
  validateRequiredOptions(options)
  const normalized = normalizeSourceOptions(options)
  const sourcePaths = [
    normalized.policy,
    normalized.providerNetworkPolicyReport,
    normalized.providerActivationAuthorizationReadiness,
    normalized.ciBranchActivationAuthorityReadiness,
    normalized.ciBranchActivationPlan,
    normalized.rbacPolicyValidation,
    normalized.signingReadiness,
    normalized.recordEnvelopeVerification,
    normalized.provenanceVerificationReadiness,
    normalized.enterpriseReadiness,
  ].filter((entry): entry is string => Boolean(entry))

  await assertOutputAuthority(
    root,
    sourcePaths.map((entry) => resolveRepoPath(root, entry)),
    options,
  )

  const policy = await loadSource(root, normalized.policy, 'policy')
  const providerNetworkPolicy = await loadSource(
    root,
    normalized.providerNetworkPolicyReport,
    'provider-network-policy-report',
  )
  const providerActivationAuthorizationReadiness = await loadSource(
    root,
    normalized.providerActivationAuthorizationReadiness,
    'provider-activation-authorization-readiness',
  )
  const ciBranchActivationAuthorityReadiness = normalized.ciBranchActivationAuthorityReadiness
    ? await loadSource(
        root,
        normalized.ciBranchActivationAuthorityReadiness,
        'ci-branch-activation-authority-readiness',
      )
    : null
  const ciBranchActivationPlan = normalized.ciBranchActivationPlan
    ? await loadSource(root, normalized.ciBranchActivationPlan, 'ci-branch-activation-plan')
    : null
  const rbacPolicyValidation = normalized.rbacPolicyValidation
    ? await loadSource(root, normalized.rbacPolicyValidation, 'rbac-policy-validation')
    : null
  const signingReadiness = normalized.signingReadiness
    ? await loadSource(root, normalized.signingReadiness, 'signing-readiness')
    : null
  const recordEnvelopeVerification = normalized.recordEnvelopeVerification
    ? await loadSource(root, normalized.recordEnvelopeVerification, 'record-envelope-verification')
    : null
  const provenanceVerificationReadiness = normalized.provenanceVerificationReadiness
    ? await loadSource(root, normalized.provenanceVerificationReadiness, 'provenance-verification-readiness')
    : null
  const enterpriseReadiness = normalized.enterpriseReadiness
    ? await loadSource(root, normalized.enterpriseReadiness, 'enterprise-readiness')
    : null

  const sources = {
    policy,
    providerNetworkPolicy,
    providerActivationAuthorizationReadiness,
    ciBranchActivationAuthorityReadiness,
    ciBranchActivationPlan,
    rbacPolicyValidation,
    signingReadiness,
    recordEnvelopeVerification,
    provenanceVerificationReadiness,
    enterpriseReadiness,
  }
  const blockingFindings = validateSources(sources)
  if (blockingFindings.length > 0) {
    throw new ProviderActivationGrantPolicyValidationError(buildReport(sources, blockingFindings, true))
  }

  const report = buildReport(sources, buildFindings(sources))
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

type SourceBundle = {
  policy: LoadedSource
  providerNetworkPolicy: LoadedSource
  providerActivationAuthorizationReadiness: LoadedSource
  ciBranchActivationAuthorityReadiness: LoadedSource | null
  ciBranchActivationPlan: LoadedSource | null
  rbacPolicyValidation: LoadedSource | null
  signingReadiness: LoadedSource | null
  recordEnvelopeVerification: LoadedSource | null
  provenanceVerificationReadiness: LoadedSource | null
  enterpriseReadiness: LoadedSource | null
}

function buildReport(
  sources: SourceBundle,
  findings: ProviderActivationGrantPolicyFinding[],
  blocked = false,
): ProviderActivationGrantPolicyValidationReport {
  const policyRecord = sources.policy.record
  const providerNetworkRecord = sources.providerNetworkPolicy.record
  const authRecord = sources.providerActivationAuthorizationReadiness.record
  const sourceList = Object.values(sources).filter((entry): entry is LoadedSource => Boolean(entry))
  const policySummary = summarizePolicyScope(policyRecord)
  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : PASSED_STATUS,
    validationScope: POLICY_SCOPE,
    sourceFactsOnly: true,
    reportOnly: true,
    providerActivationGrantPolicyValidationStatus: blocked
      ? 'blocked-unsafe-authority-claim'
      : allOptionalPrerequisitesSupplied(sources)
        ? 'passed-report-only-grant-policy-not-active'
        : 'partial-readiness-source-linkage-missing',
    sourcePolicy: {
      ...sourceSummary(sources.policy),
      policyScope: stringValue(policyRecord?.policyScope),
      activationMode: stringValue(policyRecord?.activationMode),
      defaultProviderPolicy: stringValue(policyRecord?.defaultProviderPolicy),
      defaultNetworkPolicy: stringValue(policyRecord?.defaultNetworkPolicy),
      providerId: policySummary.providerId,
      operationCount: policySummary.operationCount,
      repositoryScopeCount: policySummary.repositoryScopeCount,
      projectScopeCount: policySummary.projectScopeCount,
      branchScopeCount: policySummary.branchScopeCount,
      checkScopeCount: policySummary.checkScopeCount,
    },
    sourceProviderNetworkPolicy: {
      ...sourceSummary(sources.providerNetworkPolicy),
      defaultProviderPolicy: stringValue(providerNetworkRecord?.defaultProviderPolicy),
      defaultNetworkPolicy: stringValue(providerNetworkRecord?.defaultNetworkPolicy),
      providerAllowlistCount: arrayLength(providerNetworkRecord?.providerAllowlist),
      networkAllowlistCount: arrayLength(providerNetworkRecord?.networkAllowlist),
      explicitAllowSupported: booleanOrNull(providerNetworkRecord?.explicitAllowSupported),
    },
    sourceProviderActivationAuthorizationReadiness: {
      ...sourceSummary(sources.providerActivationAuthorizationReadiness),
      authorizationReadinessStatus: stringValue(authRecord?.authorizationReadinessStatus),
      providerGrantPresent: booleanOrNull(
        firstValue(authRecord, ['providerAuthorizationBoundary.providerGrantPresent', 'providerGrantPresent']),
      ),
      providerGrantVerified: booleanOrNull(
        firstValue(authRecord, ['providerAuthorizationBoundary.providerGrantVerified', 'providerGrantVerified']),
      ),
      providerAllowlistActive: booleanOrNull(
        firstValue(authRecord, ['providerAuthorizationBoundary.providerAllowlistActive', 'providerAllowlistActive']),
      ),
      networkAllowlistActive: booleanOrNull(
        firstValue(authRecord, ['providerAuthorizationBoundary.networkAllowlistActive', 'networkAllowlistActive']),
      ),
      providerInvoked: booleanOrNull(
        firstValue(authRecord, ['providerAuthorizationBoundary.providerInvoked', 'providerInvoked']),
      ),
      networkCallMade: booleanOrNull(
        firstValue(authRecord, ['providerAuthorizationBoundary.networkCallMade', 'networkCallMade']),
      ),
      apiCallMade: booleanOrNull(firstValue(authRecord, ['providerAuthorizationBoundary.apiCallMade', 'apiCallMade'])),
      futureProviderGrantRequirementCount: arrayLength(authRecord?.futureProviderGrantRequirements),
    },
    sourceCiBranchActivationAuthorityReadiness: {
      ...sourceSummary(sources.ciBranchActivationAuthorityReadiness),
      authorityReadinessStatus: stringValue(
        sources.ciBranchActivationAuthorityReadiness?.record?.authorityReadinessStatus,
      ),
      signedPolicyPresent: booleanOrNull(
        firstValue(sources.ciBranchActivationAuthorityReadiness?.record, [
          'authorityPrerequisiteSummary.signedPolicyPresent',
          'signedPolicyPresent',
        ]),
      ),
      providerGrantPresent: booleanOrNull(
        firstValue(sources.ciBranchActivationAuthorityReadiness?.record, [
          'authorityPrerequisiteSummary.providerGrantPresent',
          'providerGrantPresent',
        ]),
      ),
      rbacEnforced: booleanOrNull(
        firstValue(sources.ciBranchActivationAuthorityReadiness?.record, [
          'authorityPrerequisiteSummary.rbacEnforced',
          'rbacEnforced',
        ]),
      ),
    },
    sourceCiBranchActivationPlan: {
      ...sourceSummary(sources.ciBranchActivationPlan),
      activationPlanStatus: stringValue(sources.ciBranchActivationPlan?.record?.activationPlanStatus),
      futureOnlyStepCount: sources.ciBranchActivationPlan?.record
        ? futureOnlyStepCount(sources.ciBranchActivationPlan.record)
        : 0,
      executedStepCount: sources.ciBranchActivationPlan?.record
        ? executedStepCount(sources.ciBranchActivationPlan.record)
        : 0,
    },
    sourceRbacPolicyValidation: {
      ...sourceSummary(sources.rbacPolicyValidation),
      rbacPolicyValidationStatus: stringValue(sources.rbacPolicyValidation?.record?.rbacPolicyValidationStatus),
      actorCount: numberValue(firstValue(sources.rbacPolicyValidation?.record, ['actorSummary.actorCount'])),
      roleAssignmentCount: numberValue(
        firstValue(sources.rbacPolicyValidation?.record, ['roleAssignmentSummary.assignmentCount']),
      ),
      permissionGrantCount: numberValue(
        firstValue(sources.rbacPolicyValidation?.record, ['permissionGrantSummary.grantCount']),
      ),
    },
    sourceSigningReadiness: {
      ...sourceSummary(sources.signingReadiness),
      signingReadinessStatus: stringValue(sources.signingReadiness?.record?.signingReadinessStatus),
      keyRegistryPresent: booleanOrNull(
        firstValue(sources.signingReadiness?.record, [
          'keyGovernanceReadiness.keyRegistryPresent',
          'keyRegistryPresent',
        ]),
      ),
      trustRootPresent: booleanOrNull(
        firstValue(sources.signingReadiness?.record, ['keyGovernanceReadiness.trustRootPresent', 'trustRootPresent']),
      ),
    },
    sourceRecordEnvelopeVerification: {
      ...sourceSummary(sources.recordEnvelopeVerification),
      payloadDigestMatches: booleanOrNull(
        firstValue(sources.recordEnvelopeVerification?.record, ['payloadVerification.digestMatches']),
      ),
      allSourceDigestsMatch: booleanOrNull(
        firstValue(sources.recordEnvelopeVerification?.record, ['sourceArtifactVerification.allSourceDigestsMatch']),
      ),
      signatureVerificationMode: stringValue(sources.recordEnvelopeVerification?.record?.signatureVerificationMode),
    },
    sourceProvenanceVerificationReadiness: {
      ...sourceSummary(sources.provenanceVerificationReadiness),
      provenanceVerificationReadinessStatus: stringValue(
        sources.provenanceVerificationReadiness?.record?.provenanceVerificationReadinessStatus,
      ),
      realSlsaVerificationPerformed: booleanOrNull(
        firstValue(sources.provenanceVerificationReadiness?.record, [
          'verificationBoundary.realSlsaVerificationPerformed',
          'realSlsaVerificationPerformed',
        ]),
      ),
      realInTotoVerificationPerformed: booleanOrNull(
        firstValue(sources.provenanceVerificationReadiness?.record, [
          'verificationBoundary.realInTotoVerificationPerformed',
          'realInTotoVerificationPerformed',
        ]),
      ),
    },
    sourceEnterpriseReadiness: {
      ...sourceSummary(sources.enterpriseReadiness),
      readinessLevel: stringValue(sources.enterpriseReadiness?.record?.readinessLevel),
    },
    grantPolicyValidation: {
      policyRoleValid: !blocked,
      defaultDenyBaseline:
        policyRecord?.defaultProviderPolicy === 'deny' && policyRecord?.defaultNetworkPolicy === 'deny',
      activationMode: stringValue(policyRecord?.activationMode),
      providerGrantActive: false,
      providerAllowlistActive: false,
      networkAllowlistActive: false,
      providerInvoked: false,
      networkCallMade: false,
      apiCallMade: false,
      operationScopeRecorded: policySummary.operationCount > 0,
      repositoryScopeRecorded: policySummary.repositoryScopeCount > 0,
      branchScopeRecorded: policySummary.branchScopeCount > 0,
      checkScopeRecorded: policySummary.checkScopeCount > 0,
      validationMode: 'report-only-no-activation',
    },
    providerOperationScopeValidation: {
      providerId: policySummary.providerId,
      operationCount: policySummary.operationCount,
      operationLabelsAreMetadataOnly: true,
      providerInvoked: false,
      apiOperationAllowed: false,
    },
    actorAuthorizationRequirementValidation: {
      requiredRoles: stringArray(firstValue(policyRecord, ['actorAuthorizationRequirements.requiredRoles'])),
      requiredPermissions: stringArray(
        firstValue(policyRecord, ['actorAuthorizationRequirements.requiredPermissions']),
      ),
      rbacEnforced: false,
      permissionVerified: false,
    },
    signedPolicyRequirementValidation: {
      signedPolicyRequired: booleanOrNull(firstValue(policyRecord, ['signedPolicyRequirements.signedPolicyRequired'])),
      signedPolicyPresent: false,
      signedPolicyVerified: false,
      recordEnvelopeRequired: booleanOrNull(
        firstValue(policyRecord, ['signedPolicyRequirements.recordEnvelopeRequired']),
      ),
      cryptographicSignatureVerified: false,
      keyRegistryPresent: false,
      trustRootPresent: false,
    },
    ttlRevocationValidation: {
      ttlRequired: booleanOrNull(firstValue(policyRecord, ['ttlAndRevocation.ttlRequired'])),
      expiresAtPolicy: stringValue(firstValue(policyRecord, ['ttlAndRevocation.expiresAtPolicy'])),
      revocationRequired: booleanOrNull(firstValue(policyRecord, ['ttlAndRevocation.revocationRequired'])),
      revocationMetadataPresent: false,
    },
    auditReviewValidation: {
      auditReviewRequired: booleanOrNull(firstValue(policyRecord, ['auditReviewRequirements.auditReviewRequired'])),
      reviewRecordPresent: false,
      sourceDigestRequired: booleanOrNull(firstValue(policyRecord, ['auditReviewRequirements.sourceDigestRequired'])),
    },
    activationBoundary: {
      providerGrantActive: false,
      providerGrantActivated: false,
      providerAllowlistActive: false,
      networkAllowlistActive: false,
      providerInvoked: false,
      networkCallMade: false,
      apiCallMade: false,
      requiredChecksConfigured: false,
      requiredChecksMutated: false,
      branchProtectionChanged: false,
      branchProtectionMutated: false,
      hooksActivated: false,
      enterpriseGateActivated: false,
    },
    sourceArtifactDigests: sourceList.map((source) => ({
      path: source.relativePath,
      sourceKind: source.sourceKind,
      artifactRole: stringValue(source.record?.artifactRole),
      status: stringValue(source.record?.status),
      sha256: source.sha256,
      byteLength: source.byteLength,
    })),
    validationFindings: findings,
    downstreamActionPlan: downstreamActionPlan(findings),
    enterpriseGateActivated: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    providerAllowlistActive: false,
    networkAllowlistActive: false,
    providerGrantPresent: false,
    providerGrantVerified: false,
    providerGrantActive: false,
    providerGrantActivated: false,
    providerCredentialsRead: false,
    providerCredentialsStored: false,
    githubMutated: false,
    githubWorkflowMutated: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    hooksActivated: false,
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
    cryptographicSignaturePresent: false,
    cryptographicSignatureVerified: false,
    signedPolicyPresent: false,
    signedPolicyVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
    packagePublished: false,
    packageArtifactGeneratedByDevView: false,
    packageArtifactGenerated: false,
    packageTarballGenerated: false,
    packageSigned: false,
    sbomGeneratedByDevView: false,
    sbomGenerated: false,
    sbomAttested: false,
    provenanceAttestationGenerated: false,
    provenanceAttestationVerified: false,
    provenanceAttested: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
  }
}

function validateSources(sources: SourceBundle): ProviderActivationGrantPolicyFinding[] {
  const findings: ProviderActivationGrantPolicyFinding[] = []
  for (const source of Object.values(sources).filter((entry): entry is LoadedSource => Boolean(entry))) {
    if (source.readError) {
      findings.push(
        blockingFinding('PROVIDER_ACTIVATION_GRANT_POLICY_SOURCE_READ_FAILED', source.readError, source.relativePath),
      )
      continue
    }
    if (!source.record) {
      findings.push(
        blockingFinding(
          'PROVIDER_ACTIVATION_GRANT_POLICY_SOURCE_NOT_OBJECT',
          'Source must be a JSON object.',
          source.relativePath,
        ),
      )
      continue
    }
    validateRoleStatus(source, findings)
    validateUnsafeClaims(source, findings)
    validateSourceSpecificClaims(source, findings)
  }
  return findings
}

function validateRoleStatus(source: LoadedSource, findings: ProviderActivationGrantPolicyFinding[]): void {
  const expected = expectedRoleStatus(source.sourceKind)
  if (!expected) return
  const role = stringValue(source.record?.artifactRole)
  const status = stringValue(source.record?.status)
  if (role !== expected.role || status !== expected.status) {
    findings.push(
      blockingFinding(
        `PROVIDER_ACTIVATION_GRANT_POLICY_${source.sourceKind.toUpperCase().replace(/-/g, '_')}_ROLE_STATUS_INVALID`,
        `Expected ${expected.role} / ${expected.status}; received ${role ?? 'missing'} / ${status ?? 'missing'}.`,
        source.relativePath,
      ),
    )
  }
}

function validateUnsafeClaims(source: LoadedSource, findings: ProviderActivationGrantPolicyFinding[]): void {
  const record = source.record
  if (!record) return
  for (const hit of collectTrueFieldHits(record, unsafeAuthorityFields)) {
    findings.push(
      blockingFinding(
        'PROVIDER_ACTIVATION_GRANT_POLICY_UNSAFE_AUTHORITY_FLAG',
        `Report-only provider grant policy validation cannot consume true authority flag ${hit.path}.`,
        source.relativePath,
        hit.field,
      ),
    )
  }
  for (const hit of collectNonEmptyFieldHits(record, allowlistFields)) {
    findings.push(
      blockingFinding(
        'PROVIDER_ACTIVATION_GRANT_POLICY_ALLOWLIST_OR_GRANT_UNSUPPORTED',
        `Provider/network/API allowlists and grants must remain empty for report-only validation: ${hit.path}.`,
        source.relativePath,
        hit.field,
      ),
    )
  }
  for (const hit of collectNonEmptyFieldHits(record, executableInstructionFields)) {
    findings.push(
      blockingFinding(
        'PROVIDER_ACTIVATION_GRANT_POLICY_EXECUTABLE_INSTRUCTION_UNSUPPORTED',
        `Executable, provider, network, or API instruction fields are not allowed in report-only grant policy validation: ${hit.path}.`,
        source.relativePath,
        hit.field,
      ),
    )
  }
  for (const hit of collectNonEmptyFieldHits(record, secretMaterialFields)) {
    findings.push(
      blockingFinding(
        'PROVIDER_ACTIVATION_GRANT_POLICY_SECRET_OR_SIGNATURE_MATERIAL_UNSUPPORTED',
        `Credentials, secrets, key material, or signature material are not allowed: ${hit.path}.`,
        source.relativePath,
        hit.field,
      ),
    )
  }
  for (const hit of collectDefaultAllowPolicyHits(record)) {
    findings.push(
      blockingFinding(
        'PROVIDER_ACTIVATION_GRANT_POLICY_DEFAULT_ALLOW_UNSUPPORTED',
        `Default allow policy is not supported for report-only provider grant policy validation: ${hit.path}.`,
        source.relativePath,
        'defaultPolicy',
      ),
    )
  }
}

function validateSourceSpecificClaims(source: LoadedSource, findings: ProviderActivationGrantPolicyFinding[]): void {
  const record = source.record
  if (!record) return
  if (source.sourceKind === 'policy') {
    if (record.policyScope !== POLICY_SCOPE) {
      findings.push(
        blockingFinding(
          'PROVIDER_ACTIVATION_GRANT_POLICY_SCOPE_INVALID',
          `Policy must declare policyScope ${POLICY_SCOPE}.`,
          source.relativePath,
          'policyScope',
        ),
      )
    }
    if (record.defaultProviderPolicy !== 'deny' || record.defaultNetworkPolicy !== 'deny') {
      findings.push(
        blockingFinding(
          'PROVIDER_ACTIVATION_GRANT_POLICY_DEFAULT_DENY_REQUIRED',
          'Policy must keep defaultProviderPolicy and defaultNetworkPolicy set to deny.',
          source.relativePath,
          'defaultProviderPolicy',
        ),
      )
    }
    if (record.activationMode !== 'report-only-no-activation') {
      findings.push(
        blockingFinding(
          'PROVIDER_ACTIVATION_GRANT_POLICY_ACTIVATION_MODE_INVALID',
          'Policy activationMode must be report-only-no-activation.',
          source.relativePath,
          'activationMode',
        ),
      )
    }
    const summary = summarizePolicyScope(record)
    if (!summary.providerId) {
      findings.push(
        blockingFinding(
          'PROVIDER_ACTIVATION_GRANT_POLICY_PROVIDER_ID_REQUIRED',
          'Policy must declare a provider id as metadata.',
          source.relativePath,
          'providerId',
        ),
      )
    }
    if (summary.operationCount < 1) {
      findings.push(
        blockingFinding(
          'PROVIDER_ACTIVATION_GRANT_POLICY_OPERATION_SCOPE_REQUIRED',
          'Policy must declare at least one future-only provider operation label.',
          source.relativePath,
          'operations',
        ),
      )
    }
  }
  if (source.sourceKind === 'provider-network-policy-report') {
    if (record.defaultProviderPolicy !== 'deny' || record.defaultNetworkPolicy !== 'deny') {
      findings.push(
        blockingFinding(
          'PROVIDER_ACTIVATION_GRANT_POLICY_PROVIDER_NETWORK_SOURCE_NOT_DENY',
          'Provider/network source must remain default-deny.',
          source.relativePath,
          'defaultProviderPolicy',
        ),
      )
    }
    if (record.explicitAllowSupported !== false) {
      findings.push(
        blockingFinding(
          'PROVIDER_ACTIVATION_GRANT_POLICY_PROVIDER_NETWORK_EXPLICIT_ALLOW_UNSUPPORTED',
          'Provider/network source must keep explicitAllowSupported false.',
          source.relativePath,
          'explicitAllowSupported',
        ),
      )
    }
  }
  if (source.sourceKind === 'ci-branch-activation-plan' && executedStepCount(record) > 0) {
    findings.push(
      blockingFinding(
        'PROVIDER_ACTIVATION_GRANT_POLICY_ACTIVATION_STEP_EXECUTED_UNSUPPORTED',
        'CI/branch activation plan steps must remain future-only-not-executed.',
        source.relativePath,
        'activationSequenceProposal',
      ),
    )
  }
}

function buildFindings(sources: SourceBundle): ProviderActivationGrantPolicyFinding[] {
  const findings: ProviderActivationGrantPolicyFinding[] = []
  findings.push(
    satisfiedFinding(
      'PROVIDER_ACTIVATION_GRANT_POLICY_VALIDATED',
      'Provider activation grant policy validated as report-only source fact.',
      sources.policy.relativePath,
    ),
  )
  findings.push(
    satisfiedFinding(
      'PROVIDER_ACTIVATION_GRANT_POLICY_DEFAULT_DENY_LINKED',
      'Provider/network default-deny source is linked.',
      sources.providerNetworkPolicy.relativePath,
    ),
  )
  findings.push(
    satisfiedFinding(
      'PROVIDER_ACTIVATION_AUTHORIZATION_READINESS_LINKED',
      'Provider activation authorization readiness source is linked.',
      sources.providerActivationAuthorizationReadiness.relativePath,
    ),
  )
  addOptionalSourceFinding(
    findings,
    sources.ciBranchActivationAuthorityReadiness,
    'CI_BRANCH_ACTIVATION_AUTHORITY_READINESS',
    'CI/branch activation authority readiness linked.',
    'CI/branch activation authority readiness not supplied.',
  )
  addOptionalSourceFinding(
    findings,
    sources.ciBranchActivationPlan,
    'CI_BRANCH_ACTIVATION_PLAN',
    'CI/branch activation plan linked.',
    'CI/branch activation plan not supplied.',
  )
  addOptionalSourceFinding(
    findings,
    sources.rbacPolicyValidation,
    'RBAC_POLICY_VALIDATION',
    'RBAC policy validation linked.',
    'RBAC policy validation not supplied; enforcement remains future-only.',
  )
  addOptionalSourceFinding(
    findings,
    sources.signingReadiness,
    'SIGNING_READINESS',
    'Signing readiness linked.',
    'Signing readiness not supplied; signed policy/key trust remains a gap.',
  )
  addOptionalSourceFinding(
    findings,
    sources.recordEnvelopeVerification,
    'RECORD_ENVELOPE_VERIFICATION',
    'Record envelope verification linked.',
    'Record envelope verification not supplied.',
  )
  addOptionalSourceFinding(
    findings,
    sources.provenanceVerificationReadiness,
    'PROVENANCE_VERIFICATION_READINESS',
    'Provenance verification readiness linked.',
    'Provenance verification readiness not supplied.',
  )
  addOptionalSourceFinding(
    findings,
    sources.enterpriseReadiness,
    'ENTERPRISE_READINESS',
    'Enterprise readiness linked.',
    'Enterprise readiness not supplied.',
  )
  findings.push(
    gapFinding(
      'PROVIDER_ACTIVATION_GRANT_POLICY_NOT_ACTIVE',
      'Provider grant policy is validated only; no provider grant, allowlist, API call, or activation occurred.',
    ),
  )
  findings.push(
    gapFinding(
      'SIGNED_POLICY_RBAC_PROVIDER_GRANT_STILL_MISSING',
      'Signed policy verification, RBAC enforcement, key/trust governance, and provider grant activation remain future-only.',
    ),
  )
  return findings
}

function expectedRoleStatus(sourceKind: SourceKind): { role: string; status: string } | null {
  switch (sourceKind) {
    case 'policy':
      return { role: POLICY_ROLE, status: POLICY_STATUS }
    case 'provider-network-policy-report':
      return { role: PROVIDER_NETWORK_ROLE, status: PROVIDER_NETWORK_STATUS }
    case 'provider-activation-authorization-readiness':
      return { role: PROVIDER_ACTIVATION_AUTHORIZATION_ROLE, status: PROVIDER_ACTIVATION_AUTHORIZATION_STATUS }
    case 'ci-branch-activation-authority-readiness':
      return { role: CI_BRANCH_ACTIVATION_AUTHORITY_ROLE, status: CI_BRANCH_ACTIVATION_AUTHORITY_STATUS }
    case 'ci-branch-activation-plan':
      return { role: CI_BRANCH_ACTIVATION_PLAN_ROLE, status: CI_BRANCH_ACTIVATION_PLAN_STATUS }
    case 'rbac-policy-validation':
      return { role: RBAC_POLICY_VALIDATION_ROLE, status: RBAC_POLICY_VALIDATION_STATUS }
    case 'signing-readiness':
      return { role: SIGNING_READINESS_ROLE, status: SIGNING_READINESS_STATUS }
    case 'record-envelope-verification':
      return { role: RECORD_ENVELOPE_VERIFICATION_ROLE, status: RECORD_ENVELOPE_VERIFICATION_STATUS }
    case 'provenance-verification-readiness':
      return { role: PROVENANCE_VERIFICATION_READINESS_ROLE, status: PROVENANCE_VERIFICATION_READINESS_STATUS }
    case 'enterprise-readiness':
      return { role: ENTERPRISE_READINESS_ROLE, status: ENTERPRISE_READINESS_STATUS }
  }
}

function summarizePolicyScope(record: JsonRecord | null): {
  providerId: string | null
  operationCount: number
  repositoryScopeCount: number
  projectScopeCount: number
  branchScopeCount: number
  checkScopeCount: number
} {
  const grantIntent = asRecord(record?.grantIntent)
  const providerOperationScope = asRecord(record?.providerOperationScope)
  const repositoryScope = asRecord(record?.repositoryScope) ?? asRecord(grantIntent?.repositoryScope)
  const projectScope = asRecord(record?.projectScope) ?? asRecord(grantIntent?.projectScope)
  const operationSource = firstValue(record, [
    'operations',
    'grantIntent.operations',
    'providerOperationScope.operations',
  ])
  const providerId =
    stringValue(firstValue(record, ['providerId', 'grantIntent.providerId', 'provider.providerId'])) ??
    stringValue(providerOperationScope?.providerId)
  return {
    providerId,
    operationCount: Array.isArray(operationSource) ? operationSource.length : 0,
    repositoryScopeCount: repositoryScope
      ? countScopeItems(repositoryScope, ['owner', 'repo', 'repository', 'repositories'])
      : 0,
    projectScopeCount: projectScope
      ? countScopeItems(projectScope, ['project', 'projects', 'workspace', 'workspaces'])
      : 0,
    branchScopeCount: arrayLength(repositoryScope?.branches) ?? arrayLength(repositoryScope?.targetBranches) ?? 0,
    checkScopeCount: arrayLength(repositoryScope?.checks) ?? arrayLength(repositoryScope?.requiredChecks) ?? 0,
  }
}

function countScopeItems(record: JsonRecord, keys: string[]): number {
  let count = 0
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) count += value.length
    else if (typeof value === 'string' && value.trim().length > 0) count += 1
  }
  return count
}

function sourceSummary(source: LoadedSource | null): SourceSummary {
  return {
    supplied: Boolean(source),
    path: source?.relativePath ?? null,
    artifactRole: stringValue(source?.record?.artifactRole),
    status: stringValue(source?.record?.status),
    sha256: source?.sha256 ?? null,
    byteLength: source?.byteLength ?? null,
  }
}

async function loadSource(root: string, requestedPath: string, sourceKind: SourceKind): Promise<LoadedSource> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  const relative = relativePath(root, resolvedPath)
  try {
    const bytes = await readFile(resolvedPath)
    const parsed = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) as unknown
    return {
      requestedPath,
      resolvedPath,
      relativePath: relative,
      sourceKind,
      record: isJsonRecord(parsed) ? parsed : null,
      sha256: sha256(bytes),
      byteLength: bytes.byteLength,
      readError: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      requestedPath,
      resolvedPath,
      relativePath: relative,
      sourceKind,
      record: null,
      sha256: null,
      byteLength: null,
      readError: `${relative}: ${message}`,
    }
  }
}

function validateRequiredOptions(options: ProviderActivationGrantPolicyValidationOptions): void {
  if (!options.policy) {
    throw new Error('security validate-provider-activation-grant-policy requires --policy <json>.')
  }
  if (!options.providerNetworkPolicyReport) {
    throw new Error(
      'security validate-provider-activation-grant-policy requires --provider-network-policy-report <json>.',
    )
  }
  if (!options.providerActivationAuthorizationReadiness) {
    throw new Error(
      'security validate-provider-activation-grant-policy requires --provider-activation-authorization-readiness <json>.',
    )
  }
  if (!options.output) {
    throw new Error('security validate-provider-activation-grant-policy requires --output <json>.')
  }
}

function normalizeSourceOptions(
  options: ProviderActivationGrantPolicyValidationOptions,
): Required<
  Pick<
    ProviderActivationGrantPolicyValidationOptions,
    'policy' | 'providerNetworkPolicyReport' | 'providerActivationAuthorizationReadiness'
  >
> &
  Omit<
    ProviderActivationGrantPolicyValidationOptions,
    'policy' | 'providerNetworkPolicyReport' | 'providerActivationAuthorizationReadiness' | 'output' | 'markdown'
  > {
  return {
    policy: singlePath(options.policy, '--policy'),
    providerNetworkPolicyReport: singlePath(options.providerNetworkPolicyReport, '--provider-network-policy-report'),
    providerActivationAuthorizationReadiness: singlePath(
      options.providerActivationAuthorizationReadiness,
      '--provider-activation-authorization-readiness',
    ),
    ciBranchActivationAuthorityReadiness: singleOptionalPath(
      options.ciBranchActivationAuthorityReadiness,
      '--ci-branch-activation-authority-readiness',
    ),
    ciBranchActivationPlan: singleOptionalPath(options.ciBranchActivationPlan, '--ci-branch-activation-plan'),
    rbacPolicyValidation: singleOptionalPath(options.rbacPolicyValidation, '--rbac-policy-validation'),
    signingReadiness: singleOptionalPath(options.signingReadiness, '--signing-readiness'),
    recordEnvelopeVerification: singleOptionalPath(
      options.recordEnvelopeVerification,
      '--record-envelope-verification',
    ),
    provenanceVerificationReadiness: singleOptionalPath(
      options.provenanceVerificationReadiness,
      '--provenance-verification-readiness',
    ),
    enterpriseReadiness: singleOptionalPath(options.enterpriseReadiness, '--enterprise-readiness'),
  }
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: Pick<ProviderActivationGrantPolicyValidationOptions, 'output' | 'markdown'>,
): Promise<void> {
  if (!options.output) {
    throw new Error('security validate-provider-activation-grant-policy requires --output <json>.')
  }
  const outputPath = resolveRepoPath(root, options.output)
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  const sourceSet = new Set(sourcePaths.map((entry) => path.resolve(entry)))
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('Provider activation grant policy validation JSON output and Markdown output must differ.')
  }
  for (const target of [outputPath, markdownPath].filter((entry): entry is string => Boolean(entry))) {
    const relativeTarget = relativePath(root, target)
    if (sourceSet.has(path.resolve(target))) {
      throw new Error(
        `Provider activation grant policy validation output would overwrite a source input: ${relativeTarget}.`,
      )
    }
    if (
      hasDevViewControlDirectory(target) ||
      hasCodexControlDirectory(target) ||
      hasHiddenControlDirectorySegment(target)
    ) {
      throw new Error(
        `Provider activation grant policy validation output is inside a protected control path: ${relativeTarget}.`,
      )
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(
        `Provider activation grant policy validation output would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
  }
}

function renderMarkdown(report: ProviderActivationGrantPolicyValidationReport): string {
  return [
    '# DevView Provider Activation Grant Policy Validation',
    '',
    `- status: ${report.status}`,
    `- providerActivationGrantPolicyValidationStatus: ${report.providerActivationGrantPolicyValidationStatus}`,
    `- policy: ${report.sourcePolicy.path ?? 'not-supplied'}`,
    `- providerId: ${report.sourcePolicy.providerId ?? 'not-supplied'}`,
    `- operationCount: ${report.sourcePolicy.operationCount}`,
    `- providerNetworkPolicy: ${report.sourceProviderNetworkPolicy.path ?? 'not-supplied'}`,
    `- providerActivationAuthorizationReadiness: ${
      report.sourceProviderActivationAuthorizationReadiness.path ?? 'not-supplied'
    }`,
    `- providerGrantActive: false`,
    `- providerAllowlistActive: false`,
    `- networkAllowlistActive: false`,
    `- providerInvoked: false`,
    `- apiCallMade: false`,
    `- rbacEnforced: false`,
    `- cryptographicSignatureVerified: false`,
    '',
    '## Findings',
    ...report.validationFindings.map((entry) => `- [${entry.severity}] ${entry.code}: ${entry.message}`),
    '',
    '## Downstream Actions',
    ...report.downstreamActionPlan.map((entry) => `- ${entry}`),
    '',
    '## Report-Only Safety',
    '- providerGrantPresent: false',
    '- providerGrantVerified: false',
    '- providerGrantActive: false',
    '- providerInvoked: false',
    '- networkCallMade: false',
    '- apiCallMade: false',
    '- branchProtectionMutated: false',
    '- requiredChecksMutated: false',
    '- enterpriseGateActivated: false',
    '',
  ].join('\n')
}

function downstreamActionPlan(findings: ProviderActivationGrantPolicyFinding[]): string[] {
  const actions = new Set<string>()
  if (findings.some((finding) => finding.severity === 'blocker')) {
    actions.add('Fix provider grant policy/source role, status, default-deny, allowlist, or authority blockers.')
  }
  actions.add('Integrate provider activation grant policy validation into enterprise readiness as a source fact.')
  actions.add(
    'Define a future provider activation request artifact only after signed policy/RBAC/provider grant prerequisites.',
  )
  actions.add(
    'Keep provider/network/API calls, allowlist activation, RBAC enforcement, signing, and enterprise gates disabled.',
  )
  return [...actions]
}

function addOptionalSourceFinding(
  findings: ProviderActivationGrantPolicyFinding[],
  source: LoadedSource | null,
  codePrefix: string,
  suppliedMessage: string,
  missingMessage: string,
): void {
  if (source) {
    findings.push(satisfiedFinding(`${codePrefix}_LINKED`, suppliedMessage, source.relativePath))
  } else {
    findings.push(gapFinding(`${codePrefix}_NOT_SUPPLIED`, missingMessage))
  }
}

function allOptionalPrerequisitesSupplied(sources: SourceBundle): boolean {
  return Boolean(
    sources.ciBranchActivationAuthorityReadiness &&
      sources.ciBranchActivationPlan &&
      sources.rbacPolicyValidation &&
      sources.signingReadiness &&
      sources.recordEnvelopeVerification &&
      sources.provenanceVerificationReadiness &&
      sources.enterpriseReadiness,
  )
}

function collectTrueFieldHits(
  record: unknown,
  fieldNames: string[],
  pathParts: string[] = [],
): Array<{ path: string; field: string }> {
  if (!isJsonRecord(record)) return []
  const hits: Array<{ path: string; field: string }> = []
  for (const [key, entry] of Object.entries(record)) {
    const nextPath = [...pathParts, key]
    if (fieldNames.includes(key) && entry === true) hits.push({ path: nextPath.join('.'), field: key })
    hits.push(...collectTrueFieldHits(entry, fieldNames, nextPath))
  }
  return hits
}

function collectNonEmptyFieldHits(
  record: unknown,
  fieldNames: string[],
  pathParts: string[] = [],
): Array<{ path: string; field: string }> {
  if (!isJsonRecord(record)) return []
  const hits: Array<{ path: string; field: string }> = []
  for (const [key, entry] of Object.entries(record)) {
    const nextPath = [...pathParts, key]
    if (fieldNames.includes(key) && hasValue(entry)) hits.push({ path: nextPath.join('.'), field: key })
    hits.push(...collectNonEmptyFieldHits(entry, fieldNames, nextPath))
  }
  return hits
}

function collectDefaultAllowPolicyHits(record: unknown, pathParts: string[] = []): Array<{ path: string }> {
  if (!isJsonRecord(record)) return []
  const hits: Array<{ path: string }> = []
  for (const [key, entry] of Object.entries(record)) {
    const nextPath = [...pathParts, key]
    if (['defaultProviderPolicy', 'defaultNetworkPolicy'].includes(key) && entry === 'allow') {
      hits.push({ path: nextPath.join('.') })
    }
    hits.push(...collectDefaultAllowPolicyHits(entry, nextPath))
  }
  return hits
}

function firstValue(record: unknown, paths: string[]): unknown {
  for (const fieldPath of paths) {
    const value = valueAtPath(record, fieldPath)
    if (value !== undefined) return value
  }
  return undefined
}

function valueAtPath(record: unknown, fieldPath: string): unknown {
  let current: unknown = record
  for (const part of fieldPath.split('.')) {
    if (!isJsonRecord(current)) return undefined
    current = current[part]
  }
  return current
}

function futureOnlyStepCount(record: JsonRecord): number {
  return recordArray(record.activationSequenceProposal).filter(
    (entry) => stringValue(entry.executionMode) === 'future-only-not-executed',
  ).length
}

function executedStepCount(record: JsonRecord): number {
  return recordArray(record.activationSequenceProposal).filter(
    (entry) => stringValue(entry.executionMode) && stringValue(entry.executionMode) !== 'future-only-not-executed',
  ).length
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'object' && value !== null) return Object.keys(value as JsonRecord).length > 0
  return value !== null && value !== undefined && value !== false
}

function blockingFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): ProviderActivationGrantPolicyFinding {
  return { severity: 'blocker', code, message, path: pathValue, field }
}

function gapFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): ProviderActivationGrantPolicyFinding {
  return { severity: 'gap', code, message, path: pathValue, field }
}

function satisfiedFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): ProviderActivationGrantPolicyFinding {
  return { severity: 'satisfied', code, message, path: pathValue, field }
}

function singlePath(value: string | undefined, flagName: string): string {
  const values = parseList(value)
  if (values.length !== 1) throw new Error(`${flagName} requires exactly one file path.`)
  return values[0]
}

function singleOptionalPath(value: string | undefined, flagName: string): string | undefined {
  if (!value) return undefined
  const values = parseList(value)
  if (values.length > 1) throw new Error(`${flagName} accepts one file path for this v1 command.`)
  return values[0]
}

function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function resolveRepoPath(root: string, target: string): string {
  return path.isAbsolute(target) ? path.resolve(target) : path.resolve(root, target)
}

function isSourceAuthorityShapedPath(target: string): boolean {
  const normalized = target.replace(/\\/g, '/').toLowerCase()
  return (
    normalized.includes('/graph-source') ||
    normalized.startsWith('graph-source/') ||
    normalized.includes('/source-authority') ||
    normalized.startsWith('source-authority/') ||
    normalized.endsWith('provider-activation-grant-policy.json') ||
    normalized.endsWith('provider-network-policy-report.json') ||
    normalized.endsWith('provider-activation-authorization-readiness.json') ||
    normalized.endsWith('ci-branch-activation-authority-readiness.json') ||
    normalized.endsWith('ci-branch-activation-plan.json') ||
    normalized.endsWith('rbac-policy-validation.json') ||
    normalized.endsWith('signing-readiness.json') ||
    normalized.endsWith('record-envelope-verification.json') ||
    normalized.endsWith('provenance-verification-readiness.json') ||
    normalized.endsWith('enterprise-readiness.json')
  )
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
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

function arrayLength(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function recordArray(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.map((entry) => asRecord(entry)).filter((entry): entry is JsonRecord => Boolean(entry))
    : []
}

function asRecord(value: unknown): JsonRecord | null {
  return isJsonRecord(value) ? value : null
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
