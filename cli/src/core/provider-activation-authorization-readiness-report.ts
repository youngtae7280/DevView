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

const REPORT_ROLE = 'devview-provider-activation-authorization-readiness-report'
const REPORTED_STATUS = 'devview-provider-activation-authorization-readiness-reported'
const BLOCKED_STATUS = 'devview-provider-activation-authorization-readiness-blocked'
const READINESS_SCOPE = 'provider-activation-authorization-readiness-report-only'
const PROVIDER_NETWORK_ROLE = 'devview-provider-network-default-deny-policy-report'
const PROVIDER_NETWORK_STATUS = 'devview-provider-network-default-deny-policy-recorded'
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
  'keyRegistryCreated',
  'trustRootCreated',
  'signaturePolicyEnforced',
  'rbacEnforced',
  'permissionVerified',
  'rbacPermissionVerified',
  'providerGrantPresent',
  'providerGrantVerified',
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
]

export interface ProviderActivationAuthorizationReadinessOptions {
  providerNetworkPolicyReport?: string
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

export interface ProviderActivationAuthorizationReadinessFinding {
  severity: 'blocker' | 'gap' | 'advisory' | 'satisfied'
  code: string
  message: string
  path?: string
  field?: string
}

type SourceKind =
  | 'provider-network-policy-report'
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

export interface ProviderActivationAuthorizationReadinessReport extends JsonRecord {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof REPORTED_STATUS | typeof BLOCKED_STATUS
  readinessScope: typeof READINESS_SCOPE
  sourceFactsOnly: true
  reportOnly: true
  authorizationReadinessStatus:
    | 'not-ready-provider-grant-signed-policy-rbac-missing'
    | 'ready-for-future-provider-grant-policy-review-only-not-activation'
    | 'blocked-unsafe-source-fact'
  sourceProviderNetworkPolicy: SourceSummary & {
    defaultProviderPolicy: string | null
    defaultNetworkPolicy: string | null
    providerAllowlistCount: number | null
    networkAllowlistCount: number | null
    explicitAllowSupported: boolean | null
  }
  sourceCiBranchActivationAuthorityReadiness: SourceSummary & {
    authorityReadinessStatus: string | null
    signedPolicyPresent: boolean | null
    signedPolicyVerified: boolean | null
    providerGrantPresent: boolean | null
    rbacEnforced: boolean | null
    permissionVerified: boolean | null
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
    providerNetworkPermissionCount: number | null
  }
  sourceSigningReadiness: SourceSummary & {
    signingReadinessStatus: string | null
    keyRegistryPresent: boolean | null
    trustRootPresent: boolean | null
    privateKeyStoragePresent: boolean | null
  }
  sourceRecordEnvelopeVerification: SourceSummary & {
    payloadDigestMatches: boolean | null
    allSourceDigestsMatch: boolean | null
    previousEnvelopeChainLinkVerified: boolean | null
    signatureVerificationMode: string | null
  }
  sourceProvenanceVerificationReadiness: SourceSummary & {
    provenanceVerificationReadinessStatus: string | null
    realSlsaVerificationPerformed: boolean | null
    realInTotoVerificationPerformed: boolean | null
    cryptographicSignatureVerified: boolean | null
  }
  sourceEnterpriseReadiness: SourceSummary & {
    readinessLevel: string | null
    providerNetworkPolicyStatus: string | null
    scopeCiGovernanceStatus: string | null
  }
  providerAuthorizationBoundary: JsonRecord
  futureProviderGrantRequirements: string[]
  actorAuthorizationPrerequisites: JsonRecord
  signedPolicyPrerequisites: JsonRecord
  providerIsolationReadiness: JsonRecord
  sourceArtifactDigests: Array<{
    path: string
    sourceKind: SourceKind
    artifactRole: string | null
    status: string | null
    sha256: string | null
    byteLength: number | null
  }>
  authorizationFindings: ProviderActivationAuthorizationReadinessFinding[]
  downstreamActionPlan: string[]
  enterpriseGateActivated: false
  providerInvoked: false
  networkCallMade: false
  apiCallMade: false
  providerAllowlistActive: false
  networkAllowlistActive: false
  providerGrantPresent: false
  providerGrantVerified: false
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
  keyGenerated: false
  privateKeyStored: false
  keyRegistryCreated: false
  trustRootCreated: false
  shellCommandsExecuted: false
  extensionExecutionAllowed: false
  extensionsExecuted: false
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

export class ProviderActivationAuthorizationReadinessReportValidationError extends Error {
  constructor(public readonly report: ProviderActivationAuthorizationReadinessReport) {
    super('Provider activation authorization readiness reporting is blocked.')
  }
}

export async function reportProviderActivationAuthorizationReadiness(
  root: string,
  options: ProviderActivationAuthorizationReadinessOptions,
): Promise<ProviderActivationAuthorizationReadinessReport> {
  validateRequiredOptions(options)
  const normalized = normalizeSourceOptions(options)
  const sourcePaths = [
    normalized.providerNetworkPolicyReport,
    normalized.ciBranchActivationAuthorityReadiness,
    normalized.ciBranchActivationPlan,
    normalized.rbacPolicyValidation,
    normalized.signingReadiness,
    normalized.recordEnvelopeVerification,
    normalized.provenanceVerificationReadiness,
    normalized.enterpriseReadiness,
  ]
    .filter((entry): entry is string => Boolean(entry))
    .map((entry) => resolveRepoPath(root, entry))

  await assertOutputAuthority(root, sourcePaths, options)

  const providerNetworkPolicy = await loadSource(
    root,
    normalized.providerNetworkPolicyReport,
    'provider-network-policy-report',
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

  const validationFindings = validateSources(
    providerNetworkPolicy,
    ciBranchActivationAuthorityReadiness,
    ciBranchActivationPlan,
    rbacPolicyValidation,
    signingReadiness,
    recordEnvelopeVerification,
    provenanceVerificationReadiness,
    enterpriseReadiness,
  )
  if (validationFindings.length > 0) {
    throw new ProviderActivationAuthorizationReadinessReportValidationError(
      buildReport(
        providerNetworkPolicy,
        ciBranchActivationAuthorityReadiness,
        ciBranchActivationPlan,
        rbacPolicyValidation,
        signingReadiness,
        recordEnvelopeVerification,
        provenanceVerificationReadiness,
        enterpriseReadiness,
        validationFindings,
        true,
      ),
    )
  }

  const report = buildReport(
    providerNetworkPolicy,
    ciBranchActivationAuthorityReadiness,
    ciBranchActivationPlan,
    rbacPolicyValidation,
    signingReadiness,
    recordEnvelopeVerification,
    provenanceVerificationReadiness,
    enterpriseReadiness,
    buildFindings(
      providerNetworkPolicy,
      ciBranchActivationAuthorityReadiness,
      ciBranchActivationPlan,
      rbacPolicyValidation,
      signingReadiness,
      recordEnvelopeVerification,
      provenanceVerificationReadiness,
      enterpriseReadiness,
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
  providerNetworkPolicy: LoadedSource,
  ciBranchActivationAuthorityReadiness: LoadedSource | null,
  ciBranchActivationPlan: LoadedSource | null,
  rbacPolicyValidation: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  recordEnvelopeVerification: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
  enterpriseReadiness: LoadedSource | null,
  findings: ProviderActivationAuthorizationReadinessFinding[],
  blocked = false,
): ProviderActivationAuthorizationReadinessReport {
  const readyForReview =
    !blocked &&
    providerDefaultDenyRecorded(providerNetworkPolicy.record) &&
    Boolean(ciBranchActivationAuthorityReadiness) &&
    Boolean(rbacPolicyValidation) &&
    Boolean(signingReadiness) &&
    Boolean(recordEnvelopeVerification) &&
    Boolean(provenanceVerificationReadiness)

  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : REPORTED_STATUS,
    readinessScope: READINESS_SCOPE,
    sourceFactsOnly: true,
    reportOnly: true,
    authorizationReadinessStatus: blocked
      ? 'blocked-unsafe-source-fact'
      : readyForReview
        ? 'ready-for-future-provider-grant-policy-review-only-not-activation'
        : 'not-ready-provider-grant-signed-policy-rbac-missing',
    sourceProviderNetworkPolicy: providerNetworkPolicySummary(providerNetworkPolicy),
    sourceCiBranchActivationAuthorityReadiness: ciBranchActivationAuthoritySummary(
      ciBranchActivationAuthorityReadiness,
    ),
    sourceCiBranchActivationPlan: ciBranchActivationPlanSummary(ciBranchActivationPlan),
    sourceRbacPolicyValidation: rbacPolicyValidationSummary(rbacPolicyValidation),
    sourceSigningReadiness: signingReadinessSummary(signingReadiness),
    sourceRecordEnvelopeVerification: recordEnvelopeVerificationSummary(recordEnvelopeVerification),
    sourceProvenanceVerificationReadiness: provenanceVerificationReadinessSummary(provenanceVerificationReadiness),
    sourceEnterpriseReadiness: enterpriseReadinessSummary(enterpriseReadiness),
    providerAuthorizationBoundary: providerAuthorizationBoundary(providerNetworkPolicy),
    futureProviderGrantRequirements: futureProviderGrantRequirements(),
    actorAuthorizationPrerequisites: actorAuthorizationPrerequisites(rbacPolicyValidation),
    signedPolicyPrerequisites: signedPolicyPrerequisites(signingReadiness),
    providerIsolationReadiness: providerIsolationReadiness(providerNetworkPolicy),
    sourceArtifactDigests: sourceArtifactDigests([
      providerNetworkPolicy,
      ciBranchActivationAuthorityReadiness,
      ciBranchActivationPlan,
      rbacPolicyValidation,
      signingReadiness,
      recordEnvelopeVerification,
      provenanceVerificationReadiness,
      enterpriseReadiness,
    ]),
    authorizationFindings: findings,
    downstreamActionPlan: downstreamActionPlan(findings),
    enterpriseGateActivated: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    providerAllowlistActive: false,
    networkAllowlistActive: false,
    providerGrantPresent: false,
    providerGrantVerified: false,
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
    keyGenerated: false,
    privateKeyStored: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
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

function validateSources(
  providerNetworkPolicy: LoadedSource,
  ciBranchActivationAuthorityReadiness: LoadedSource | null,
  ciBranchActivationPlan: LoadedSource | null,
  rbacPolicyValidation: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  recordEnvelopeVerification: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
  enterpriseReadiness: LoadedSource | null,
): ProviderActivationAuthorizationReadinessFinding[] {
  const findings: ProviderActivationAuthorizationReadinessFinding[] = []
  for (const source of [
    providerNetworkPolicy,
    ciBranchActivationAuthorityReadiness,
    ciBranchActivationPlan,
    rbacPolicyValidation,
    signingReadiness,
    recordEnvelopeVerification,
    provenanceVerificationReadiness,
    enterpriseReadiness,
  ].filter((entry): entry is LoadedSource => Boolean(entry))) {
    if (source.readError) {
      findings.push(
        blockingFinding('PROVIDER_ACTIVATION_AUTHORIZATION_SOURCE_READ_FAILED', source.readError, source.relativePath),
      )
      continue
    }
    if (!source.record) {
      findings.push(
        blockingFinding(
          'PROVIDER_ACTIVATION_AUTHORIZATION_SOURCE_NOT_JSON_OBJECT',
          `${source.relativePath} must be a JSON object.`,
          source.relativePath,
        ),
      )
      continue
    }
    validateRoleStatus(source, source.record, findings)
    validateSourceSpecificClaims(source, source.record, findings)
    validateUnsafeSourceFlags(source, source.record, findings)
  }
  return findings
}

function validateRoleStatus(
  source: LoadedSource,
  record: JsonRecord,
  findings: ProviderActivationAuthorizationReadinessFinding[],
): void {
  const expected = expectedRoleStatus(source.sourceKind)
  if (record.artifactRole !== expected.role || record.status !== expected.status) {
    findings.push(
      blockingFinding(
        `${findingPrefix(source.sourceKind)}_ROLE_STATUS_INVALID`,
        `${source.relativePath} must be ${expected.role} with ${expected.status} status.`,
        source.relativePath,
      ),
    )
  }
}

function validateSourceSpecificClaims(
  source: LoadedSource,
  record: JsonRecord,
  findings: ProviderActivationAuthorizationReadinessFinding[],
): void {
  if (source.sourceKind === 'provider-network-policy-report') {
    if (record.defaultProviderPolicy !== 'deny' || record.defaultNetworkPolicy !== 'deny') {
      findings.push(
        blockingFinding(
          'PROVIDER_ACTIVATION_AUTHORIZATION_PROVIDER_NETWORK_SOURCE_NOT_DENY',
          `${source.relativePath} must keep provider and network defaults deny.`,
          source.relativePath,
        ),
      )
    }
    if (record.explicitAllowSupported !== false) {
      findings.push(
        blockingFinding(
          'PROVIDER_ACTIVATION_AUTHORIZATION_PROVIDER_NETWORK_EXPLICIT_ALLOW_UNSUPPORTED',
          `${source.relativePath} must keep explicitAllowSupported false.`,
          source.relativePath,
          'explicitAllowSupported',
        ),
      )
    }
  }
  if (source.sourceKind === 'ci-branch-activation-plan') {
    for (const [index, step] of recordArray(record.activationSequenceProposal).entries()) {
      if (stringValue(step.executionMode) !== 'future-only-not-executed') {
        findings.push(
          blockingFinding(
            'PROVIDER_ACTIVATION_AUTHORIZATION_ACTIVATION_STEP_EXECED_UNSUPPORTED',
            `${source.relativePath} activation step ${index} must remain future-only-not-executed.`,
            source.relativePath,
            `activationSequenceProposal.${index}.executionMode`,
          ),
        )
      }
    }
  }
}

function validateUnsafeSourceFlags(
  source: LoadedSource,
  record: JsonRecord,
  findings: ProviderActivationAuthorizationReadinessFinding[],
): void {
  for (const hit of collectTrueFieldHits(record, unsafeAuthorityFields)) {
    findings.push(
      blockingFinding(
        'PROVIDER_ACTIVATION_AUTHORIZATION_UNSAFE_SOURCE_AUTHORITY_FLAG',
        `${source.relativePath} claims ${hit.path}: true; provider activation authorization readiness is report-only.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
  for (const hit of collectNonEmptyFieldHits(record, allowlistFields)) {
    findings.push(
      blockingFinding(
        'PROVIDER_ACTIVATION_AUTHORIZATION_ALLOWLIST_UNSUPPORTED',
        `${source.relativePath} has non-empty ${hit.path}; provider/network/API grants are future-only.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
  for (const hit of collectDefaultAllowPolicyHits(record)) {
    findings.push(
      blockingFinding(
        'PROVIDER_ACTIVATION_AUTHORIZATION_DEFAULT_ALLOW_UNSUPPORTED',
        `${source.relativePath} sets ${hit.path} to allow; provider activation authorization accepts default-deny source facts only.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
}

function buildFindings(
  providerNetworkPolicy: LoadedSource,
  ciBranchActivationAuthorityReadiness: LoadedSource | null,
  ciBranchActivationPlan: LoadedSource | null,
  rbacPolicyValidation: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  recordEnvelopeVerification: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
  enterpriseReadiness: LoadedSource | null,
): ProviderActivationAuthorizationReadinessFinding[] {
  const findings: ProviderActivationAuthorizationReadinessFinding[] = []
  if (providerDefaultDenyRecorded(providerNetworkPolicy.record)) {
    findings.push(
      satisfiedFinding(
        'PROVIDER_ACTIVATION_AUTHORIZATION_DEFAULT_DENY_RECORDED',
        'Provider/network default-deny source is linked with empty allowlists.',
        providerNetworkPolicy.relativePath,
      ),
    )
  }
  addSourceFinding(
    findings,
    ciBranchActivationAuthorityReadiness,
    'PROVIDER_ACTIVATION_AUTHORIZATION_CI_BRANCH_AUTHORITY_READINESS',
    'CI/branch activation authority readiness is linked as a provider grant prerequisite source.',
    'CI/branch activation authority readiness source was not supplied.',
  )
  addSourceFinding(
    findings,
    ciBranchActivationPlan,
    'PROVIDER_ACTIVATION_AUTHORIZATION_CI_BRANCH_ACTIVATION_PLAN',
    'CI/branch activation plan is linked as a future-only source fact.',
    'CI/branch activation plan source was not supplied.',
  )
  addSourceFinding(
    findings,
    rbacPolicyValidation,
    'PROVIDER_ACTIVATION_AUTHORIZATION_RBAC_POLICY_VALIDATION',
    'RBAC policy validation is linked as a future provider grant prerequisite.',
    'RBAC policy validation source was not supplied.',
  )
  addSourceFinding(
    findings,
    signingReadiness,
    'PROVIDER_ACTIVATION_AUTHORIZATION_SIGNING_READINESS',
    'Signing readiness is linked as a future signed policy prerequisite.',
    'Signing readiness source was not supplied.',
  )
  addSourceFinding(
    findings,
    recordEnvelopeVerification,
    'PROVIDER_ACTIVATION_AUTHORIZATION_RECORD_ENVELOPE_VERIFICATION',
    'Record envelope verification is linked as unsigned digest verification only.',
    'Record envelope verification source was not supplied.',
  )
  addSourceFinding(
    findings,
    provenanceVerificationReadiness,
    'PROVIDER_ACTIVATION_AUTHORIZATION_PROVENANCE_VERIFICATION_READINESS',
    'Provenance verification readiness is linked as a future signed provenance prerequisite.',
    'Provenance verification readiness source was not supplied.',
  )
  addSourceFinding(
    findings,
    enterpriseReadiness,
    'PROVIDER_ACTIVATION_AUTHORIZATION_ENTERPRISE_READINESS',
    'Enterprise readiness is linked as a source fact.',
    'Enterprise readiness source was not supplied.',
  )
  findings.push(
    gapFinding(
      'PROVIDER_ACTIVATION_AUTHORIZATION_PROVIDER_GRANT_NOT_PRESENT',
      'Provider activation grant policy is not present; this report cannot authorize provider/API calls.',
      undefined,
      'providerAuthorizationBoundary.providerGrantPresent',
    ),
    gapFinding(
      'PROVIDER_ACTIVATION_AUTHORIZATION_SIGNED_POLICY_NOT_PRESENT',
      'Signed provider activation policy is not present.',
      undefined,
      'signedPolicyPrerequisites.signedPolicyPresent',
    ),
    gapFinding(
      'PROVIDER_ACTIVATION_AUTHORIZATION_RBAC_NOT_ENFORCED',
      'RBAC permission verification is not enforced for provider activation authorization.',
      undefined,
      'actorAuthorizationPrerequisites.rbacEnforced',
    ),
    satisfiedFinding(
      'PROVIDER_ACTIVATION_AUTHORIZATION_NO_PROVIDER_CALL_BOUNDARY_RECORDED',
      'Provider activation authorization readiness does not invoke providers, make network/API calls, activate allowlists, or read credentials.',
    ),
  )
  return findings
}

function providerAuthorizationBoundary(providerNetworkPolicy: LoadedSource): JsonRecord {
  const record = providerNetworkPolicy.record ?? {}
  return {
    defaultProviderPolicy: stringValue(record.defaultProviderPolicy) ?? 'deny',
    defaultNetworkPolicy: stringValue(record.defaultNetworkPolicy) ?? 'deny',
    providerGrantPresent: false,
    providerGrantVerified: false,
    providerAllowlistActive: false,
    networkAllowlistActive: false,
    explicitAllowSupported: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    providerCredentialsRead: false,
    providerCredentialsStored: false,
    gaps: [
      'Provider activation grant policy is not implemented.',
      'Provider/network allowlists remain inactive.',
      'Provider/API calls require future signed policy, RBAC verification, audit review, and provider isolation.',
    ],
  }
}

function futureProviderGrantRequirements(): string[] {
  return [
    'future grant artifact role devview-provider-activation-grant-policy',
    'signed policy and signed record envelope',
    'actor identity with RBAC role verification',
    'explicit provider/project/repository/branch/check scope',
    'explicit API operation allow scope',
    'TTL, expiry, and revocation metadata',
    'audit review record',
    'provider sandbox/isolation and no-network default',
  ]
}

function actorAuthorizationPrerequisites(rbacPolicyValidation: LoadedSource | null): JsonRecord {
  const record = rbacPolicyValidation?.record ?? null
  const actorSummary = asRecord(record?.actorSummary)
  const roleAssignmentSummary = asRecord(record?.roleAssignmentSummary)
  const permissionGrantSummary = asRecord(record?.permissionGrantSummary)
  return {
    requiredRoles: ['security-admin', 'maintainer', 'auditor', 'provider-network-policy-maintainer'],
    futurePermissions: [
      'provider-network.policy.allow',
      'provider-network.grant.review',
      'ci-branch.activation.authorize',
      'audit.verify',
    ],
    rbacPolicyValidationLinked: Boolean(rbacPolicyValidation),
    actorCount: numberValue(actorSummary?.actorCount),
    roleAssignmentCount: numberValue(roleAssignmentSummary?.assignmentCount),
    permissionGrantCount: numberValue(permissionGrantSummary?.grantCount),
    providerNetworkPermissionCount: numberValue(permissionGrantSummary?.providerNetworkPermissionCount),
    rbacEnforced: false,
    permissionVerified: false,
    gaps: [
      'Provider activation actor identity is not enforced.',
      'Provider-network allow permission remains future-only.',
      'Security-admin and provider-network grant review are not verified by this report.',
    ],
  }
}

function signedPolicyPrerequisites(signingReadiness: LoadedSource | null): JsonRecord {
  const record = signingReadiness?.record ?? null
  const signaturePolicy = asRecord(record?.signaturePolicyReadiness)
  return {
    signingReadinessLinked: Boolean(signingReadiness),
    signingReadinessStatus: stringValue(record?.signingReadinessStatus),
    detachedSignaturePolicyPresent: booleanOrNull(signaturePolicy?.detachedSignaturePolicyPresent),
    signedPolicyPresent: false,
    cryptographicSignatureVerified: false,
    keyRegistryPresent: false,
    trustRootPresent: false,
    gaps: [
      'Signed provider activation policy is not implemented.',
      'Cryptographic signature verification is not performed.',
      'Key registry and trust root remain future work.',
    ],
  }
}

function providerIsolationReadiness(providerNetworkPolicy: LoadedSource): JsonRecord {
  return {
    providerNetworkPolicyLinked: providerDefaultDenyRecorded(providerNetworkPolicy.record),
    noNetworkDefaultRecorded: providerDefaultDenyRecorded(providerNetworkPolicy.record),
    providerIsolationPolicyPresent: false,
    providerSandboxPolicyPresent: false,
    providerCredentialsRead: false,
    providerCredentialsStored: false,
    gaps: [
      'Provider sandbox/isolation policy is not implemented.',
      'Provider credentials must remain unread and unstored by report-only commands.',
      'No-network default remains recorded but not enforced as a runtime provider sandbox.',
    ],
  }
}

function providerNetworkPolicySummary(
  source: LoadedSource,
): ProviderActivationAuthorizationReadinessReport['sourceProviderNetworkPolicy'] {
  const record = source.record ?? {}
  return {
    ...baseSummary(source),
    defaultProviderPolicy: stringValue(record.defaultProviderPolicy),
    defaultNetworkPolicy: stringValue(record.defaultNetworkPolicy),
    providerAllowlistCount: arrayLength(record.providerAllowlist),
    networkAllowlistCount: arrayLength(record.networkAllowlist),
    explicitAllowSupported: booleanOrNull(record.explicitAllowSupported),
  }
}

function ciBranchActivationAuthoritySummary(
  source: LoadedSource | null,
): ProviderActivationAuthorizationReadinessReport['sourceCiBranchActivationAuthorityReadiness'] {
  const record = source?.record ?? null
  const prerequisites = asRecord(record?.authorityPrerequisiteSummary)
  return {
    ...baseSummary(source),
    authorityReadinessStatus: stringValue(record?.authorityReadinessStatus),
    signedPolicyPresent: booleanOrNull(prerequisites?.signedPolicyPresent),
    signedPolicyVerified: booleanOrNull(prerequisites?.signedPolicyVerified),
    providerGrantPresent: booleanOrNull(prerequisites?.providerGrantPresent),
    rbacEnforced: booleanOrNull(prerequisites?.rbacEnforced),
    permissionVerified: booleanOrNull(prerequisites?.permissionVerified),
  }
}

function ciBranchActivationPlanSummary(
  source: LoadedSource | null,
): ProviderActivationAuthorizationReadinessReport['sourceCiBranchActivationPlan'] {
  const record = source?.record ?? {}
  return {
    ...baseSummary(source),
    activationPlanStatus: stringValue(record.activationPlanStatus),
    futureOnlyStepCount: futureOnlyStepCount(record),
    executedStepCount: executedStepCount(record),
  }
}

function rbacPolicyValidationSummary(
  source: LoadedSource | null,
): ProviderActivationAuthorizationReadinessReport['sourceRbacPolicyValidation'] {
  const record = source?.record ?? null
  const actorSummary = asRecord(record?.actorSummary)
  const roleAssignmentSummary = asRecord(record?.roleAssignmentSummary)
  const permissionGrantSummary = asRecord(record?.permissionGrantSummary)
  return {
    ...baseSummary(source),
    rbacPolicyValidationStatus: stringValue(record?.rbacPolicyValidationStatus),
    actorCount: numberValue(actorSummary?.actorCount),
    roleAssignmentCount: numberValue(roleAssignmentSummary?.assignmentCount),
    permissionGrantCount: numberValue(permissionGrantSummary?.grantCount),
    providerNetworkPermissionCount: numberValue(permissionGrantSummary?.providerNetworkPermissionCount),
  }
}

function signingReadinessSummary(
  source: LoadedSource | null,
): ProviderActivationAuthorizationReadinessReport['sourceSigningReadiness'] {
  const record = source?.record ?? null
  const keyGovernance = asRecord(record?.keyGovernanceReadiness)
  return {
    ...baseSummary(source),
    signingReadinessStatus: stringValue(record?.signingReadinessStatus),
    keyRegistryPresent: booleanOrNull(keyGovernance?.keyRegistryPresent),
    trustRootPresent: booleanOrNull(keyGovernance?.trustRootPresent),
    privateKeyStoragePresent: booleanOrNull(keyGovernance?.privateKeyStoragePresent),
  }
}

function recordEnvelopeVerificationSummary(
  source: LoadedSource | null,
): ProviderActivationAuthorizationReadinessReport['sourceRecordEnvelopeVerification'] {
  const record = source?.record ?? null
  const payload = asRecord(record?.payloadVerification)
  const sources = asRecord(record?.sourceArtifactVerification)
  const previous = asRecord(record?.previousEnvelopeVerification)
  return {
    ...baseSummary(source),
    payloadDigestMatches: booleanOrNull(payload?.digestMatches),
    allSourceDigestsMatch: booleanOrNull(sources?.allSourceDigestsMatch),
    previousEnvelopeChainLinkVerified: booleanOrNull(previous?.chainLinkVerified),
    signatureVerificationMode: stringValue(record?.signatureVerificationMode),
  }
}

function provenanceVerificationReadinessSummary(
  source: LoadedSource | null,
): ProviderActivationAuthorizationReadinessReport['sourceProvenanceVerificationReadiness'] {
  const record = source?.record ?? null
  const boundary = asRecord(record?.verificationBoundary)
  return {
    ...baseSummary(source),
    provenanceVerificationReadinessStatus: stringValue(record?.provenanceVerificationReadinessStatus),
    realSlsaVerificationPerformed: booleanOrNull(boundary?.realSlsaVerificationPerformed),
    realInTotoVerificationPerformed: booleanOrNull(boundary?.realInTotoVerificationPerformed),
    cryptographicSignatureVerified: booleanOrNull(boundary?.cryptographicSignatureVerified),
  }
}

function enterpriseReadinessSummary(
  source: LoadedSource | null,
): ProviderActivationAuthorizationReadinessReport['sourceEnterpriseReadiness'] {
  const record = source?.record ?? null
  const provider = asRecord(record?.providerNetworkPolicyReadiness)
  const scopeCi = asRecord(record?.scopeCiGovernanceReadiness)
  return {
    ...baseSummary(source),
    readinessLevel: stringValue(record?.readinessLevel),
    providerNetworkPolicyStatus: stringValue(provider?.status),
    scopeCiGovernanceStatus: stringValue(scopeCi?.status),
  }
}

function baseSummary(source: LoadedSource | null): SourceSummary {
  return {
    supplied: Boolean(source),
    path: source?.relativePath ?? null,
    artifactRole: stringValue(source?.record?.artifactRole),
    status: stringValue(source?.record?.status),
    sha256: source?.sha256 ?? null,
    byteLength: source?.byteLength ?? null,
  }
}

function sourceArtifactDigests(
  sources: Array<LoadedSource | null>,
): ProviderActivationAuthorizationReadinessReport['sourceArtifactDigests'] {
  return sources
    .filter((entry): entry is LoadedSource => Boolean(entry))
    .map((source) => ({
      path: source.relativePath,
      sourceKind: source.sourceKind,
      artifactRole: stringValue(source.record?.artifactRole),
      status: stringValue(source.record?.status),
      sha256: source.sha256,
      byteLength: source.byteLength,
    }))
}

function providerDefaultDenyRecorded(record: JsonRecord | null | undefined): boolean {
  return Boolean(
    record &&
      record.defaultProviderPolicy === 'deny' &&
      record.defaultNetworkPolicy === 'deny' &&
      (arrayLength(record.providerAllowlist) ?? 0) === 0 &&
      (arrayLength(record.networkAllowlist) ?? 0) === 0 &&
      record.explicitAllowSupported === false,
  )
}

function expectedRoleStatus(sourceKind: SourceKind): { role: string; status: string } {
  switch (sourceKind) {
    case 'provider-network-policy-report':
      return { role: PROVIDER_NETWORK_ROLE, status: PROVIDER_NETWORK_STATUS }
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

function findingPrefix(sourceKind: SourceKind): string {
  return `PROVIDER_ACTIVATION_AUTHORIZATION_${sourceKind.replace(/-/g, '_').toUpperCase()}`
}

async function loadSource(root: string, requestedPath: string, sourceKind: SourceKind): Promise<LoadedSource> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  const relative = relativePath(root, resolvedPath)
  try {
    const bytes = await readFile(resolvedPath)
    const text = bytes.toString('utf8').replace(/^\uFEFF/, '')
    const parsed = JSON.parse(text) as unknown
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

function validateRequiredOptions(options: ProviderActivationAuthorizationReadinessOptions): void {
  if (!options.providerNetworkPolicyReport) {
    throw new Error(
      'security report-provider-activation-authorization-readiness requires --provider-network-policy-report <json>.',
    )
  }
  if (!options.output) {
    throw new Error('security report-provider-activation-authorization-readiness requires --output <json>.')
  }
}

function normalizeSourceOptions(
  options: ProviderActivationAuthorizationReadinessOptions,
): Required<Pick<ProviderActivationAuthorizationReadinessOptions, 'providerNetworkPolicyReport'>> &
  Omit<ProviderActivationAuthorizationReadinessOptions, 'providerNetworkPolicyReport' | 'output' | 'markdown'> {
  return {
    providerNetworkPolicyReport: singlePath(options.providerNetworkPolicyReport, '--provider-network-policy-report'),
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
  options: Pick<ProviderActivationAuthorizationReadinessOptions, 'output' | 'markdown'>,
): Promise<void> {
  if (!options.output) {
    throw new Error('security report-provider-activation-authorization-readiness requires --output <json>.')
  }
  const outputPath = resolveRepoPath(root, options.output)
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  const sourceSet = new Set(sourcePaths.map((entry) => path.resolve(entry)))
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error(
      'Provider activation authorization readiness JSON output and Markdown output must be different paths.',
    )
  }
  for (const target of [outputPath, markdownPath].filter((entry): entry is string => Boolean(entry))) {
    const relativeTarget = relativePath(root, target)
    if (sourceSet.has(path.resolve(target))) {
      throw new Error(
        `Provider activation authorization readiness output would overwrite a source input: ${relativeTarget}.`,
      )
    }
    if (
      hasDevViewControlDirectory(target) ||
      hasCodexControlDirectory(target) ||
      hasHiddenControlDirectorySegment(target)
    ) {
      throw new Error(
        `Provider activation authorization readiness output is inside a protected control path: ${relativeTarget}.`,
      )
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(
        `Provider activation authorization readiness output would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
  }
}

function renderMarkdown(report: ProviderActivationAuthorizationReadinessReport): string {
  return [
    '# DevView Provider Activation Authorization Readiness',
    '',
    `- status: ${report.status}`,
    `- authorizationReadinessStatus: ${report.authorizationReadinessStatus}`,
    `- providerNetworkPolicy: ${report.sourceProviderNetworkPolicy.path ?? 'not-supplied'}`,
    `- defaultProviderPolicy: ${report.providerAuthorizationBoundary.defaultProviderPolicy}`,
    `- defaultNetworkPolicy: ${report.providerAuthorizationBoundary.defaultNetworkPolicy}`,
    `- providerGrantPresent: false`,
    `- providerGrantVerified: false`,
    `- providerAllowlistActive: false`,
    `- networkAllowlistActive: false`,
    `- rbacEnforced: false`,
    `- cryptographicSignatureVerified: false`,
    '',
    '## Future Provider Grant Requirements',
    ...report.futureProviderGrantRequirements.map((entry) => `- ${entry}`),
    '',
    '## Findings',
    ...report.authorizationFindings.map((entry) => `- [${entry.severity}] ${entry.code}: ${entry.message}`),
    '',
    '## Downstream Actions',
    ...report.downstreamActionPlan.map((entry) => `- ${entry}`),
    '',
    '## Report-Only Safety',
    '- providerInvoked: false',
    '- networkCallMade: false',
    '- apiCallMade: false',
    '- providerAllowlistActive: false',
    '- providerGrantPresent: false',
    '- rbacEnforced: false',
    '- cryptographicSignatureVerified: false',
    '- enterpriseGateActivated: false',
    '',
  ].join('\n')
}

function downstreamActionPlan(findings: ProviderActivationAuthorizationReadinessFinding[]): string[] {
  const actions = new Set<string>()
  if (findings.some((finding) => finding.severity === 'blocker')) {
    actions.add('Fix source role/status, default-deny, allowlist, or unsafe authority blockers.')
  }
  actions.add('Integrate provider activation authorization readiness into enterprise readiness as a source fact.')
  actions.add('Define provider grant policy validation before any provider/API activation request artifact.')
  actions.add(
    'Keep provider/network/API calls, allowlist activation, RBAC enforcement, signing, and enterprise gates disabled.',
  )
  return [...actions]
}

function addSourceFinding(
  findings: ProviderActivationAuthorizationReadinessFinding[],
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

function blockingFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): ProviderActivationAuthorizationReadinessFinding {
  return { severity: 'blocker', code, message, path: pathValue, field }
}

function gapFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): ProviderActivationAuthorizationReadinessFinding {
  return { severity: 'gap', code, message, path: pathValue, field }
}

function satisfiedFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): ProviderActivationAuthorizationReadinessFinding {
  return { severity: 'satisfied', code, message, path: pathValue, field }
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
    if (
      ['defaultProviderPolicy', 'defaultNetworkPolicy', 'defaultExternalCiPolicy'].includes(key) &&
      entry === 'allow'
    ) {
      hits.push({ path: nextPath.join('.') })
    }
    hits.push(...collectDefaultAllowPolicyHits(entry, nextPath))
  }
  return hits
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'object' && value !== null) return Object.keys(value as JsonRecord).length > 0
  return value !== null && value !== undefined && value !== false
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
    normalized.includes('/source-authority') ||
    normalized.endsWith('provider-network-policy-report.json') ||
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
