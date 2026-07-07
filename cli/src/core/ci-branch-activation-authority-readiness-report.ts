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

const REPORT_ROLE = 'devview-ci-branch-activation-authority-readiness-report'
const REPORTED_STATUS = 'devview-ci-branch-activation-authority-readiness-reported'
const BLOCKED_STATUS = 'devview-ci-branch-activation-authority-readiness-blocked'
const READINESS_SCOPE = 'ci-branch-activation-authority-readiness-report-only'
const CI_BRANCH_ACTIVATION_PLAN_ROLE = 'devview-ci-branch-activation-plan-report'
const CI_BRANCH_ACTIVATION_PLAN_STATUS = 'devview-ci-branch-activation-plan-recorded'
const CI_BRANCH_POLICY_VALIDATION_ROLE = 'devview-ci-branch-policy-validation-report'
const CI_BRANCH_POLICY_VALIDATION_STATUS = 'devview-ci-branch-policy-validation-passed'
const CI_BRANCH_GOVERNANCE_READINESS_ROLE = 'devview-ci-branch-governance-readiness-report'
const CI_BRANCH_GOVERNANCE_READINESS_STATUS = 'devview-ci-branch-governance-readiness-reported'
const PROVIDER_NETWORK_ROLE = 'devview-provider-network-default-deny-policy-report'
const PROVIDER_NETWORK_STATUS = 'devview-provider-network-default-deny-policy-recorded'
const RBAC_POLICY_VALIDATION_ROLE = 'devview-rbac-policy-validation-report'
const RBAC_POLICY_VALIDATION_STATUS = 'devview-rbac-policy-validation-passed'
const SIGNING_READINESS_ROLE = 'devview-signing-readiness-report'
const SIGNING_READINESS_STATUS = 'devview-signing-readiness-reported'
const RECORD_ENVELOPE_VERIFICATION_ROLE = 'devview-record-envelope-verification-report'
const RECORD_ENVELOPE_VERIFICATION_STATUS = 'devview-record-envelope-verified'
const PROVENANCE_VERIFICATION_READINESS_ROLE = 'devview-provenance-verification-readiness-report'
const PROVENANCE_VERIFICATION_READINESS_STATUS = 'devview-provenance-verification-readiness-reported'

const unsafeAuthorityFields = [
  'githubMutated',
  'githubWorkflowMutated',
  'workflowExecuted',
  'workflowsExecuted',
  'branchProtectionChanged',
  'branchProtectionMutated',
  'requiredChecksConfigured',
  'requiredChecksMutated',
  'externalCiMutated',
  'hooksActivated',
  'ciProviderCalled',
  'providerInvoked',
  'networkCallMade',
  'apiCallMade',
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
  'diffRejectionEnabled',
  'diffRejectionActivated',
  'approvalAutomationEnabled',
  'userAcceptanceAutomated',
  'enterpriseGateActivated',
  'cryptographicSignaturePresent',
  'cryptographicSignatureVerified',
  'cryptographicSigningImplemented',
  'signedPolicyPresent',
  'signedPolicyVerified',
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
  'packagePublished',
  'packageGeneratedByDevView',
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

export interface CiBranchActivationAuthorityReadinessOptions {
  ciBranchActivationPlan?: string
  ciBranchPolicyValidation?: string
  ciBranchGovernanceReadiness?: string
  providerNetworkPolicyReport?: string
  rbacPolicyValidation?: string
  signingReadiness?: string
  recordEnvelopeVerification?: string
  provenanceVerificationReadiness?: string
  output?: string
  markdown?: string
}

export interface CiBranchActivationAuthorityReadinessFinding {
  severity: 'blocker' | 'gap' | 'advisory' | 'satisfied'
  code: string
  message: string
  path?: string
  field?: string
}

type SourceKind =
  | 'ci-branch-activation-plan'
  | 'ci-branch-policy-validation'
  | 'ci-branch-governance-readiness'
  | 'provider-network-policy-report'
  | 'rbac-policy-validation'
  | 'signing-readiness'
  | 'record-envelope-verification'
  | 'provenance-verification-readiness'

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

export interface CiBranchActivationAuthorityReadinessReport extends JsonRecord {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof REPORTED_STATUS | typeof BLOCKED_STATUS
  readinessScope: typeof READINESS_SCOPE
  sourceFactsOnly: true
  reportOnly: true
  authorityReadinessStatus:
    | 'not-ready-signed-policy-rbac-provider-grant-missing'
    | 'ready-for-future-authorization-review-only-not-activation'
    | 'blocked-unsafe-source-fact'
  sourceCiBranchActivationPlan: SourceSummary & {
    activationPlanStatus: string | null
    futureOnlyStepCount: number
    executedStepCount: number
    declaredRequiredCheckCount: number | null
    matchedWorkflowCandidateCheckCount: number | null
    unmappedDeclaredCheckCount: number | null
    targetBranchCount: number | null
    desiredFutureRuleCount: number | null
    prerequisiteGateSummary: JsonRecord
  }
  sourceCiBranchPolicyValidation: SourceSummary & {
    ciBranchPolicyValidationStatus: string | null
    declaredRequiredCheckCount: number | null
    matchedWorkflowCandidateCheckCount: number | null
  }
  sourceCiBranchGovernanceReadiness: SourceSummary & {
    ciBranchGovernanceReadinessStatus: string | null
    workflowInventoryFileCount: number | null
    candidateRequiredCheckCount: number | null
  }
  sourceProviderNetworkPolicy: SourceSummary & {
    defaultProviderPolicy: string | null
    defaultNetworkPolicy: string | null
    providerAllowlistCount: number | null
    networkAllowlistCount: number | null
    explicitAllowSupported: boolean | null
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
  authorityPrerequisiteSummary: JsonRecord
  signedPolicyBoundary: JsonRecord
  actorAuthorizationBoundary: JsonRecord
  providerAuthorizationBoundary: JsonRecord
  activationBoundary: JsonRecord
  sourceArtifactDigests: Array<{
    path: string
    sourceKind: SourceKind
    artifactRole: string | null
    status: string | null
    sha256: string | null
    byteLength: number | null
  }>
  authorityFindings: CiBranchActivationAuthorityReadinessFinding[]
  downstreamActionPlan: string[]
}

export class CiBranchActivationAuthorityReadinessReportValidationError extends Error {
  constructor(public readonly report: CiBranchActivationAuthorityReadinessReport) {
    super('CI/branch activation authority readiness reporting is blocked.')
  }
}

export async function reportCiBranchActivationAuthorityReadiness(
  root: string,
  options: CiBranchActivationAuthorityReadinessOptions,
): Promise<CiBranchActivationAuthorityReadinessReport> {
  validateRequiredOptions(options)
  const normalizedOptions = normalizeSourceOptions(options)
  const sourcePaths = [
    normalizedOptions.ciBranchActivationPlan,
    normalizedOptions.ciBranchPolicyValidation,
    normalizedOptions.ciBranchGovernanceReadiness,
    normalizedOptions.providerNetworkPolicyReport,
    normalizedOptions.rbacPolicyValidation,
    normalizedOptions.signingReadiness,
    normalizedOptions.recordEnvelopeVerification,
    normalizedOptions.provenanceVerificationReadiness,
  ]
    .filter((entry): entry is string => Boolean(entry))
    .map((entry) => resolveRepoPath(root, entry))

  await assertOutputAuthority(root, sourcePaths, options)

  const ciBranchActivationPlan = await loadSource(
    root,
    normalizedOptions.ciBranchActivationPlan,
    'ci-branch-activation-plan',
  )
  const ciBranchPolicyValidation = normalizedOptions.ciBranchPolicyValidation
    ? await loadSource(root, normalizedOptions.ciBranchPolicyValidation, 'ci-branch-policy-validation')
    : null
  const ciBranchGovernanceReadiness = normalizedOptions.ciBranchGovernanceReadiness
    ? await loadSource(root, normalizedOptions.ciBranchGovernanceReadiness, 'ci-branch-governance-readiness')
    : null
  const providerNetworkPolicy = normalizedOptions.providerNetworkPolicyReport
    ? await loadSource(root, normalizedOptions.providerNetworkPolicyReport, 'provider-network-policy-report')
    : null
  const rbacPolicyValidation = normalizedOptions.rbacPolicyValidation
    ? await loadSource(root, normalizedOptions.rbacPolicyValidation, 'rbac-policy-validation')
    : null
  const signingReadiness = normalizedOptions.signingReadiness
    ? await loadSource(root, normalizedOptions.signingReadiness, 'signing-readiness')
    : null
  const recordEnvelopeVerification = normalizedOptions.recordEnvelopeVerification
    ? await loadSource(root, normalizedOptions.recordEnvelopeVerification, 'record-envelope-verification')
    : null
  const provenanceVerificationReadiness = normalizedOptions.provenanceVerificationReadiness
    ? await loadSource(root, normalizedOptions.provenanceVerificationReadiness, 'provenance-verification-readiness')
    : null

  const validationFindings = validateSources(
    ciBranchActivationPlan,
    ciBranchPolicyValidation,
    ciBranchGovernanceReadiness,
    providerNetworkPolicy,
    rbacPolicyValidation,
    signingReadiness,
    recordEnvelopeVerification,
    provenanceVerificationReadiness,
  )
  const blocked = validationFindings.some((finding) => finding.severity === 'blocker')
  const report = buildReport(
    ciBranchActivationPlan,
    ciBranchPolicyValidation,
    ciBranchGovernanceReadiness,
    providerNetworkPolicy,
    rbacPolicyValidation,
    signingReadiness,
    recordEnvelopeVerification,
    provenanceVerificationReadiness,
    validationFindings,
    blocked,
  )

  if (blocked) {
    throw new CiBranchActivationAuthorityReadinessReportValidationError(report)
  }

  if (!options.output)
    throw new Error('security report-ci-branch-activation-authority-readiness requires --output <json>.')
  await writeJsonAtomic(resolveRepoPath(root, options.output), report)
  if (options.markdown) {
    await writeTextAtomic(resolveRepoPath(root, options.markdown), renderMarkdown(report))
  }
  return {
    ...report,
    writtenOutputPath: relativePath(root, resolveRepoPath(root, options.output)),
    ...(options.markdown ? { writtenMarkdownPath: relativePath(root, resolveRepoPath(root, options.markdown)) } : {}),
  }
}

function buildReport(
  ciBranchActivationPlan: LoadedSource,
  ciBranchPolicyValidation: LoadedSource | null,
  ciBranchGovernanceReadiness: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  rbacPolicyValidation: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  recordEnvelopeVerification: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
  validationFindings: CiBranchActivationAuthorityReadinessFinding[],
  blocked: boolean,
): CiBranchActivationAuthorityReadinessReport {
  const authorityPrerequisites = authorityPrerequisiteSummary(
    ciBranchActivationPlan,
    ciBranchPolicyValidation,
    ciBranchGovernanceReadiness,
    providerNetworkPolicy,
    rbacPolicyValidation,
    signingReadiness,
    recordEnvelopeVerification,
    provenanceVerificationReadiness,
  )
  const findings = [
    ...validationFindings,
    ...buildFindings(
      ciBranchActivationPlan,
      ciBranchPolicyValidation,
      ciBranchGovernanceReadiness,
      providerNetworkPolicy,
      rbacPolicyValidation,
      signingReadiness,
      recordEnvelopeVerification,
      provenanceVerificationReadiness,
      authorityPrerequisites,
    ),
  ]
  const readyForReview =
    !blocked &&
    authorityPrerequisites.activationPlanFutureOnly === true &&
    authorityPrerequisites.ciBranchPolicyValidated === true &&
    authorityPrerequisites.workflowInventoryLinked === true &&
    authorityPrerequisites.providerDefaultDenyRecorded === true &&
    authorityPrerequisites.rbacPolicyValidated === true &&
    authorityPrerequisites.signingReadinessRecorded === true &&
    authorityPrerequisites.recordEnvelopeDigestVerified === true &&
    authorityPrerequisites.provenanceVerificationReadinessRecorded === true

  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : REPORTED_STATUS,
    readinessScope: READINESS_SCOPE,
    sourceFactsOnly: true,
    reportOnly: true,
    authorityReadinessStatus: blocked
      ? 'blocked-unsafe-source-fact'
      : readyForReview
        ? 'ready-for-future-authorization-review-only-not-activation'
        : 'not-ready-signed-policy-rbac-provider-grant-missing',
    sourceCiBranchActivationPlan: ciBranchActivationPlanSummary(ciBranchActivationPlan),
    sourceCiBranchPolicyValidation: ciBranchPolicyValidationSummary(ciBranchPolicyValidation),
    sourceCiBranchGovernanceReadiness: ciBranchGovernanceReadinessSummary(ciBranchGovernanceReadiness),
    sourceProviderNetworkPolicy: providerNetworkPolicySummary(providerNetworkPolicy),
    sourceRbacPolicyValidation: rbacPolicyValidationSummary(rbacPolicyValidation),
    sourceSigningReadiness: signingReadinessSummary(signingReadiness),
    sourceRecordEnvelopeVerification: recordEnvelopeVerificationSummary(recordEnvelopeVerification),
    sourceProvenanceVerificationReadiness: provenanceVerificationReadinessSummary(provenanceVerificationReadiness),
    authorityPrerequisiteSummary: authorityPrerequisites,
    signedPolicyBoundary: signedPolicyBoundary(signingReadiness),
    actorAuthorizationBoundary: actorAuthorizationBoundary(rbacPolicyValidation),
    providerAuthorizationBoundary: providerAuthorizationBoundary(providerNetworkPolicy),
    activationBoundary: activationBoundary(ciBranchActivationPlan),
    sourceArtifactDigests: sourceArtifactDigests([
      ciBranchActivationPlan,
      ciBranchPolicyValidation,
      ciBranchGovernanceReadiness,
      providerNetworkPolicy,
      rbacPolicyValidation,
      signingReadiness,
      recordEnvelopeVerification,
      provenanceVerificationReadiness,
    ]),
    authorityFindings: findings,
    downstreamActionPlan: downstreamActionPlan(findings),
    githubMutated: false,
    githubWorkflowMutated: false,
    workflowExecuted: false,
    workflowsExecuted: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    hooksActivated: false,
    ciProviderCalled: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    cryptographicSignatureVerified: false,
    cryptographicSigningImplemented: false,
    keyGenerated: false,
    privateKeyStored: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
    signedPolicyPresent: false,
    signedPolicyVerified: false,
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
    providerGrantPresent: false,
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
    enterpriseGateActivated: false,
  }
}

function validateSources(
  ciBranchActivationPlan: LoadedSource,
  ciBranchPolicyValidation: LoadedSource | null,
  ciBranchGovernanceReadiness: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  rbacPolicyValidation: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  recordEnvelopeVerification: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
): CiBranchActivationAuthorityReadinessFinding[] {
  const findings: CiBranchActivationAuthorityReadinessFinding[] = []
  for (const source of [
    ciBranchActivationPlan,
    ciBranchPolicyValidation,
    ciBranchGovernanceReadiness,
    providerNetworkPolicy,
    rbacPolicyValidation,
    signingReadiness,
    recordEnvelopeVerification,
    provenanceVerificationReadiness,
  ].filter((entry): entry is LoadedSource => Boolean(entry))) {
    if (source.readError) {
      findings.push(blockingFinding('CI_BRANCH_AUTHORITY_SOURCE_READ_FAILED', source.readError, source.relativePath))
      continue
    }
    if (!source.record) {
      findings.push(
        blockingFinding(
          'CI_BRANCH_AUTHORITY_SOURCE_NOT_JSON_OBJECT',
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
  findings: CiBranchActivationAuthorityReadinessFinding[],
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
  findings: CiBranchActivationAuthorityReadinessFinding[],
): void {
  if (source.sourceKind === 'ci-branch-activation-plan') {
    for (const [index, step] of recordArray(record.activationSequenceProposal).entries()) {
      if (stringValue(step.executionMode) !== 'future-only-not-executed') {
        findings.push(
          blockingFinding(
            'CI_BRANCH_AUTHORITY_ACTIVATION_STEP_EXECUTED_UNSUPPORTED',
            `${source.relativePath} activation step ${index} must remain future-only-not-executed.`,
            source.relativePath,
            `activationSequenceProposal.${index}.executionMode`,
          ),
        )
      }
    }
  }
  if (source.sourceKind === 'provider-network-policy-report') {
    if (record.defaultProviderPolicy !== 'deny' || record.defaultNetworkPolicy !== 'deny') {
      findings.push(
        blockingFinding(
          'CI_BRANCH_AUTHORITY_PROVIDER_NETWORK_SOURCE_NOT_DENY',
          `${source.relativePath} must keep provider and network defaults deny.`,
          source.relativePath,
        ),
      )
    }
    if ((arrayLength(record.providerAllowlist) ?? 0) > 0 || (arrayLength(record.networkAllowlist) ?? 0) > 0) {
      findings.push(
        blockingFinding(
          'CI_BRANCH_AUTHORITY_PROVIDER_NETWORK_ALLOWLIST_UNSUPPORTED',
          `${source.relativePath} must keep provider/network allowlists empty.`,
          source.relativePath,
          'providerAllowlist',
        ),
      )
    }
  }
}

function validateUnsafeSourceFlags(
  source: LoadedSource,
  record: JsonRecord,
  findings: CiBranchActivationAuthorityReadinessFinding[],
): void {
  for (const hit of collectTrueFieldHits(record, unsafeAuthorityFields)) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_AUTHORITY_UNSAFE_SOURCE_AUTHORITY_FLAG',
        `${source.relativePath} claims ${hit.path}: true; authority readiness is report-only.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
  for (const hit of collectNonEmptyFieldHits(record, allowlistFields)) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_AUTHORITY_ALLOWLIST_UNSUPPORTED',
        `${source.relativePath} has non-empty ${hit.path}; provider/network/API grants are future-only.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
  for (const hit of collectDefaultAllowPolicyHits(record)) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_AUTHORITY_DEFAULT_ALLOW_UNSUPPORTED',
        `${source.relativePath} sets ${hit.path} to allow; authority readiness accepts default-deny source facts only.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
}

function buildFindings(
  ciBranchActivationPlan: LoadedSource,
  ciBranchPolicyValidation: LoadedSource | null,
  ciBranchGovernanceReadiness: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  rbacPolicyValidation: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  recordEnvelopeVerification: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
  prerequisites: JsonRecord,
): CiBranchActivationAuthorityReadinessFinding[] {
  const findings: CiBranchActivationAuthorityReadinessFinding[] = [
    satisfiedFinding(
      'CI_BRANCH_AUTHORITY_ACTIVATION_PLAN_LINKED',
      'CI/branch activation plan is linked as a non-authoritative source fact.',
      ciBranchActivationPlan.relativePath,
    ),
    satisfiedFinding(
      'CI_BRANCH_AUTHORITY_NO_ACTIVATION_BOUNDARY_RECORDED',
      'Authority readiness does not configure checks, mutate branch protection, call providers, activate hooks, or enable enterprise gates.',
    ),
    gapFinding(
      'CI_BRANCH_AUTHORITY_SIGNED_POLICY_NOT_PRESENT',
      'Signed CI/branch activation policy is not present; this report cannot authorize activation.',
      undefined,
      'signedPolicyBoundary.signedPolicyArtifactPresent',
    ),
    gapFinding(
      'CI_BRANCH_AUTHORITY_PROVIDER_GRANT_NOT_PRESENT',
      'Provider activation grant is not present and explicit provider/network allow remains unsupported.',
      undefined,
      'providerAuthorizationBoundary.providerGrantPresent',
    ),
    gapFinding(
      'CI_BRANCH_AUTHORITY_RBAC_NOT_ENFORCED',
      'RBAC permission verification is not enforced for CI/branch activation authority.',
      undefined,
      'actorAuthorizationBoundary.rbacEnforced',
    ),
  ]
  addSourceFinding(
    findings,
    ciBranchPolicyValidation,
    'CI_BRANCH_AUTHORITY_POLICY_VALIDATION',
    'CI/branch policy validation source is linked.',
    'CI/branch policy validation source was not supplied.',
  )
  addSourceFinding(
    findings,
    ciBranchGovernanceReadiness,
    'CI_BRANCH_AUTHORITY_GOVERNANCE_READINESS',
    'CI/branch governance readiness source is linked.',
    'CI/branch governance readiness source was not supplied.',
  )
  addSourceFinding(
    findings,
    providerNetworkPolicy,
    'CI_BRANCH_AUTHORITY_PROVIDER_NETWORK_POLICY',
    'Provider/network default-deny policy source is linked.',
    'Provider/network default-deny source was not supplied.',
  )
  addSourceFinding(
    findings,
    rbacPolicyValidation,
    'CI_BRANCH_AUTHORITY_RBAC_POLICY_VALIDATION',
    'RBAC policy validation source is linked.',
    'RBAC policy validation source was not supplied.',
  )
  addSourceFinding(
    findings,
    signingReadiness,
    'CI_BRANCH_AUTHORITY_SIGNING_READINESS',
    'Signing/key readiness source is linked.',
    'Signing/key readiness source was not supplied.',
  )
  addSourceFinding(
    findings,
    recordEnvelopeVerification,
    'CI_BRANCH_AUTHORITY_RECORD_ENVELOPE_VERIFICATION',
    'Record envelope verification source is linked.',
    'Record envelope verification source was not supplied.',
  )
  addSourceFinding(
    findings,
    provenanceVerificationReadiness,
    'CI_BRANCH_AUTHORITY_PROVENANCE_VERIFICATION_READINESS',
    'Provenance verification readiness source is linked.',
    'Provenance verification readiness source was not supplied.',
  )
  if (prerequisites.activationPlanFutureOnly !== true) {
    findings.push(
      gapFinding(
        'CI_BRANCH_AUTHORITY_ACTIVATION_PLAN_NOT_FUTURE_ONLY',
        'Activation plan must contain only future-only-not-executed steps.',
        ciBranchActivationPlan.relativePath,
        'activationSequenceProposal',
      ),
    )
  }
  return findings
}

function authorityPrerequisiteSummary(
  ciBranchActivationPlan: LoadedSource,
  ciBranchPolicyValidation: LoadedSource | null,
  ciBranchGovernanceReadiness: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  rbacPolicyValidation: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  recordEnvelopeVerification: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
): JsonRecord {
  const activationRecord = ciBranchActivationPlan.record ?? {}
  const planPrereqs = asRecord(activationRecord.prerequisiteGateSummary)
  const envelopeRecord = recordEnvelopeVerification?.record ?? null
  const payloadVerification = asRecord(envelopeRecord?.payloadVerification)
  const sourceVerification = asRecord(envelopeRecord?.sourceArtifactVerification)
  return {
    activationPlanRecorded: ciBranchActivationPlan.record?.status === CI_BRANCH_ACTIVATION_PLAN_STATUS,
    activationPlanFutureOnly: futureOnlyStepCount(activationRecord) > 0 && executedStepCount(activationRecord) === 0,
    ciBranchPolicyValidated: Boolean(ciBranchPolicyValidation),
    workflowInventoryLinked:
      Boolean(ciBranchGovernanceReadiness) || booleanValue(planPrereqs?.workflowInventoryLinked) === true,
    providerDefaultDenyRecorded:
      providerDefaultDenyRecorded(providerNetworkPolicy?.record) ||
      booleanValue(planPrereqs?.providerDefaultDenyRecorded) === true,
    rbacPolicyValidated: Boolean(rbacPolicyValidation) || booleanValue(planPrereqs?.rbacPolicyValidated) === true,
    signingReadinessRecorded: Boolean(signingReadiness) || booleanValue(planPrereqs?.signingReadinessRecorded) === true,
    recordEnvelopeDigestVerified:
      (Boolean(recordEnvelopeVerification) &&
        booleanValue(payloadVerification?.digestMatches) === true &&
        (booleanValue(sourceVerification?.allSourceDigestsMatch) ?? true)) ||
      booleanValue(planPrereqs?.envelopeDigestVerified) === true,
    provenanceVerificationReadinessRecorded:
      Boolean(provenanceVerificationReadiness) ||
      booleanValue(planPrereqs?.provenanceVerificationReadinessRecorded) === true,
    signedPolicyPresent: false,
    signedPolicyVerified: false,
    providerGrantPresent: false,
    rbacEnforced: false,
    permissionVerified: false,
  }
}

function signedPolicyBoundary(signingReadiness: LoadedSource | null): JsonRecord {
  const signingRecord = signingReadiness?.record ?? null
  const signaturePolicy = asRecord(signingRecord?.signaturePolicyReadiness)
  const keyGovernance = asRecord(signingRecord?.keyGovernanceReadiness)
  return {
    signedPolicyArtifactPresent: false,
    requiredFuturePolicyRole: 'devview-ci-branch-activation-signed-policy',
    requiredFutureSignedEnvelopeRole: 'devview-signed-record-envelope',
    signingReadinessLinked: Boolean(signingReadiness),
    signingReadinessStatus: stringValue(signingRecord?.signingReadinessStatus),
    detachedSignaturePolicyPresent: booleanOrNull(signaturePolicy?.detachedSignaturePolicyPresent),
    keyRegistryPresent: false,
    trustRootPresent: booleanOrNull(keyGovernance?.trustRootPresent) ?? false,
    cryptographicSignatureVerified: false,
    signedPolicyVerified: false,
    gaps: [
      'Signed CI/branch activation policy artifact is not implemented.',
      'Cryptographic signature verification is not performed.',
      'Key registry/trust root policy remains future work.',
    ],
  }
}

function actorAuthorizationBoundary(rbacPolicyValidation: LoadedSource | null): JsonRecord {
  const record = rbacPolicyValidation?.record ?? null
  const actorSummary = asRecord(record?.actorSummary)
  const roleAssignmentSummary = asRecord(record?.roleAssignmentSummary)
  const permissionGrantSummary = asRecord(record?.permissionGrantSummary)
  return {
    requiredRoles: ['maintainer', 'security-admin', 'auditor'],
    automationRoleBoundary: 'automation-limited-to-reporting-no-activation-authority',
    futurePermissions: ['ci-branch.activation.authorize', 'provider-network.grant.review', 'audit.verify'],
    rbacPolicyValidationLinked: Boolean(rbacPolicyValidation),
    actorCount: numberValue(actorSummary?.actorCount),
    roleAssignmentCount: numberValue(roleAssignmentSummary?.assignmentCount),
    permissionGrantCount: numberValue(permissionGrantSummary?.grantCount),
    rbacEnforced: false,
    permissionVerified: false,
    gaps: [
      'Actor identity assurance is not enforced.',
      'RBAC permission verification is not enforced.',
      'Security-admin authorization remains a future signed-policy requirement.',
    ],
  }
}

function providerAuthorizationBoundary(providerNetworkPolicy: LoadedSource | null): JsonRecord {
  const record = providerNetworkPolicy?.record ?? null
  return {
    providerNetworkPolicyLinked: Boolean(providerNetworkPolicy),
    defaultProviderPolicy: stringValue(record?.defaultProviderPolicy),
    defaultNetworkPolicy: stringValue(record?.defaultNetworkPolicy),
    providerAllowlistEmpty: record ? arrayLength(record.providerAllowlist) === 0 : null,
    networkAllowlistEmpty: record ? arrayLength(record.networkAllowlist) === 0 : null,
    explicitAllowSupported: false,
    providerGrantPresent: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    gaps: [
      'Provider grant policy is not implemented.',
      'Provider/network default deny remains in force.',
      'No provider/API call or network allowlist is authorized by this report.',
    ],
  }
}

function activationBoundary(ciBranchActivationPlan: LoadedSource): JsonRecord {
  const record = ciBranchActivationPlan.record ?? {}
  const requiredChecks = asRecord(record.policyDerivedRequiredChecksPlan)
  const branchProtection = asRecord(record.policyDerivedBranchProtectionPlan)
  return {
    activationPlanStatus: stringValue(record.activationPlanStatus),
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    externalCiMutated: false,
    hooksActivated: false,
    enterpriseGateActivated: false,
    declaredRequiredCheckCount: numberValue(requiredChecks?.declaredCheckCount),
    matchedWorkflowCandidateCheckCount: numberValue(requiredChecks?.matchedWorkflowCandidateCheckCount),
    targetBranchCount: numberValue(branchProtection?.targetBranchCount),
    desiredFutureRuleCount: numberValue(branchProtection?.desiredFutureRuleCount),
  }
}

function ciBranchActivationPlanSummary(
  source: LoadedSource,
): CiBranchActivationAuthorityReadinessReport['sourceCiBranchActivationPlan'] {
  const record = source.record ?? {}
  const requiredChecks = asRecord(record.policyDerivedRequiredChecksPlan)
  const branchProtection = asRecord(record.policyDerivedBranchProtectionPlan)
  return {
    ...emptySourceSummary(source),
    activationPlanStatus: stringValue(record.activationPlanStatus),
    futureOnlyStepCount: futureOnlyStepCount(record),
    executedStepCount: executedStepCount(record),
    declaredRequiredCheckCount: numberValue(requiredChecks?.declaredCheckCount),
    matchedWorkflowCandidateCheckCount: numberValue(requiredChecks?.matchedWorkflowCandidateCheckCount),
    unmappedDeclaredCheckCount: numberValue(requiredChecks?.unmappedDeclaredCheckCount),
    targetBranchCount: numberValue(branchProtection?.targetBranchCount),
    desiredFutureRuleCount: numberValue(branchProtection?.desiredFutureRuleCount),
    prerequisiteGateSummary: asRecord(record.prerequisiteGateSummary) ?? {},
  }
}

function ciBranchPolicyValidationSummary(
  source: LoadedSource | null,
): CiBranchActivationAuthorityReadinessReport['sourceCiBranchPolicyValidation'] {
  const base = emptySourceSummary(source)
  const record = source?.record ?? null
  const requiredChecks = asRecord(record?.requiredChecksPolicyValidation)
  return {
    ...base,
    ciBranchPolicyValidationStatus: stringValue(record?.ciBranchPolicyValidationStatus),
    declaredRequiredCheckCount: numberValue(requiredChecks?.declaredCheckCount),
    matchedWorkflowCandidateCheckCount: numberValue(requiredChecks?.workflowCandidateMatchCount),
  }
}

function ciBranchGovernanceReadinessSummary(
  source: LoadedSource | null,
): CiBranchActivationAuthorityReadinessReport['sourceCiBranchGovernanceReadiness'] {
  const base = emptySourceSummary(source)
  const record = source?.record ?? null
  const workflowInventory = asRecord(record?.workflowInventory)
  return {
    ...base,
    ciBranchGovernanceReadinessStatus: stringValue(record?.ciBranchGovernanceReadinessStatus),
    workflowInventoryFileCount: numberValue(workflowInventory?.sourceCount),
    candidateRequiredCheckCount: arrayLength(workflowInventory?.candidateRequiredChecks),
  }
}

function providerNetworkPolicySummary(
  source: LoadedSource | null,
): CiBranchActivationAuthorityReadinessReport['sourceProviderNetworkPolicy'] {
  const base = emptySourceSummary(source)
  const record = source?.record ?? null
  return {
    ...base,
    defaultProviderPolicy: stringValue(record?.defaultProviderPolicy),
    defaultNetworkPolicy: stringValue(record?.defaultNetworkPolicy),
    providerAllowlistCount: arrayLength(record?.providerAllowlist),
    networkAllowlistCount: arrayLength(record?.networkAllowlist),
    explicitAllowSupported: booleanOrNull(record?.explicitAllowSupported),
  }
}

function rbacPolicyValidationSummary(
  source: LoadedSource | null,
): CiBranchActivationAuthorityReadinessReport['sourceRbacPolicyValidation'] {
  const base = emptySourceSummary(source)
  const record = source?.record ?? null
  const actorSummary = asRecord(record?.actorSummary)
  const roleSummary = asRecord(record?.roleAssignmentSummary)
  const permissionSummary = asRecord(record?.permissionGrantSummary)
  return {
    ...base,
    rbacPolicyValidationStatus: stringValue(record?.rbacPolicyValidationStatus),
    actorCount: numberValue(actorSummary?.actorCount),
    roleAssignmentCount: numberValue(roleSummary?.assignmentCount),
    permissionGrantCount: numberValue(permissionSummary?.grantCount),
  }
}

function signingReadinessSummary(
  source: LoadedSource | null,
): CiBranchActivationAuthorityReadinessReport['sourceSigningReadiness'] {
  const base = emptySourceSummary(source)
  const record = source?.record ?? null
  const keyGovernance = asRecord(record?.keyGovernanceReadiness)
  return {
    ...base,
    signingReadinessStatus: stringValue(record?.signingReadinessStatus),
    keyRegistryPresent: booleanOrNull(keyGovernance?.keyRegistryPresent),
    trustRootPresent: booleanOrNull(keyGovernance?.trustRootPresent),
    privateKeyStoragePresent: booleanOrNull(keyGovernance?.privateKeyStoragePresent),
  }
}

function recordEnvelopeVerificationSummary(
  source: LoadedSource | null,
): CiBranchActivationAuthorityReadinessReport['sourceRecordEnvelopeVerification'] {
  const base = emptySourceSummary(source)
  const record = source?.record ?? null
  const payload = asRecord(record?.payloadVerification)
  const sourceVerification = asRecord(record?.sourceArtifactVerification)
  const previous = asRecord(record?.previousEnvelopeVerification)
  return {
    ...base,
    payloadDigestMatches: booleanOrNull(payload?.digestMatches),
    allSourceDigestsMatch: booleanOrNull(sourceVerification?.allSourceDigestsMatch),
    previousEnvelopeChainLinkVerified: booleanOrNull(previous?.chainLinkVerified),
    signatureVerificationMode: stringValue(record?.signatureVerificationMode),
  }
}

function provenanceVerificationReadinessSummary(
  source: LoadedSource | null,
): CiBranchActivationAuthorityReadinessReport['sourceProvenanceVerificationReadiness'] {
  const base = emptySourceSummary(source)
  const record = source?.record ?? null
  const boundary = asRecord(record?.verificationBoundary)
  return {
    ...base,
    provenanceVerificationReadinessStatus: stringValue(record?.provenanceVerificationReadinessStatus),
    realSlsaVerificationPerformed: booleanOrNull(boundary?.realSlsaVerificationPerformed),
    realInTotoVerificationPerformed: booleanOrNull(boundary?.realInTotoVerificationPerformed),
    cryptographicSignatureVerified: booleanOrNull(boundary?.cryptographicSignatureVerified),
  }
}

function emptySourceSummary(source: LoadedSource | null): SourceSummary {
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
): CiBranchActivationAuthorityReadinessReport['sourceArtifactDigests'] {
  return sources
    .filter((source): source is LoadedSource => Boolean(source))
    .map((source) => ({
      path: source.relativePath,
      sourceKind: source.sourceKind,
      artifactRole: stringValue(source.record?.artifactRole),
      status: stringValue(source.record?.status),
      sha256: source.sha256,
      byteLength: source.byteLength,
    }))
}

function futureOnlyStepCount(record: JsonRecord): number {
  return recordArray(record.activationSequenceProposal).filter(
    (entry) => stringValue(entry.executionMode) === 'future-only-not-executed',
  ).length
}

function executedStepCount(record: JsonRecord): number {
  return recordArray(record.activationSequenceProposal).filter(
    (entry) => stringValue(entry.executionMode) !== 'future-only-not-executed',
  ).length
}

function providerDefaultDenyRecorded(record: JsonRecord | null | undefined): boolean {
  return Boolean(
    record &&
      record.defaultProviderPolicy === 'deny' &&
      record.defaultNetworkPolicy === 'deny' &&
      (arrayLength(record.providerAllowlist) ?? 0) === 0 &&
      (arrayLength(record.networkAllowlist) ?? 0) === 0,
  )
}

function expectedRoleStatus(sourceKind: SourceKind): { role: string; status: string } {
  switch (sourceKind) {
    case 'ci-branch-activation-plan':
      return { role: CI_BRANCH_ACTIVATION_PLAN_ROLE, status: CI_BRANCH_ACTIVATION_PLAN_STATUS }
    case 'ci-branch-policy-validation':
      return { role: CI_BRANCH_POLICY_VALIDATION_ROLE, status: CI_BRANCH_POLICY_VALIDATION_STATUS }
    case 'ci-branch-governance-readiness':
      return { role: CI_BRANCH_GOVERNANCE_READINESS_ROLE, status: CI_BRANCH_GOVERNANCE_READINESS_STATUS }
    case 'provider-network-policy-report':
      return { role: PROVIDER_NETWORK_ROLE, status: PROVIDER_NETWORK_STATUS }
    case 'rbac-policy-validation':
      return { role: RBAC_POLICY_VALIDATION_ROLE, status: RBAC_POLICY_VALIDATION_STATUS }
    case 'signing-readiness':
      return { role: SIGNING_READINESS_ROLE, status: SIGNING_READINESS_STATUS }
    case 'record-envelope-verification':
      return { role: RECORD_ENVELOPE_VERIFICATION_ROLE, status: RECORD_ENVELOPE_VERIFICATION_STATUS }
    case 'provenance-verification-readiness':
      return { role: PROVENANCE_VERIFICATION_READINESS_ROLE, status: PROVENANCE_VERIFICATION_READINESS_STATUS }
  }
}

function findingPrefix(sourceKind: SourceKind): string {
  return `CI_BRANCH_AUTHORITY_${sourceKind.replace(/-/g, '_').toUpperCase()}`
}

async function loadSource(root: string, requestedPath: string, sourceKind: SourceKind): Promise<LoadedSource> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  const relative = relativePath(root, resolvedPath)
  try {
    const bytes = await readFile(resolvedPath)
    const text = bytes.toString('utf8')
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

function validateRequiredOptions(options: CiBranchActivationAuthorityReadinessOptions): void {
  if (!options.ciBranchActivationPlan) {
    throw new Error(
      'security report-ci-branch-activation-authority-readiness requires --ci-branch-activation-plan <json>.',
    )
  }
  if (!options.output) {
    throw new Error('security report-ci-branch-activation-authority-readiness requires --output <json>.')
  }
}

function normalizeSourceOptions(
  options: CiBranchActivationAuthorityReadinessOptions,
): Required<Pick<CiBranchActivationAuthorityReadinessOptions, 'ciBranchActivationPlan'>> &
  Omit<CiBranchActivationAuthorityReadinessOptions, 'ciBranchActivationPlan' | 'output' | 'markdown'> {
  return {
    ciBranchActivationPlan: singlePath(options.ciBranchActivationPlan, '--ci-branch-activation-plan'),
    ciBranchPolicyValidation: singleOptionalPath(options.ciBranchPolicyValidation, '--ci-branch-policy-validation'),
    ciBranchGovernanceReadiness: singleOptionalPath(
      options.ciBranchGovernanceReadiness,
      '--ci-branch-governance-readiness',
    ),
    providerNetworkPolicyReport: singleOptionalPath(
      options.providerNetworkPolicyReport,
      '--provider-network-policy-report',
    ),
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
  }
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: Pick<CiBranchActivationAuthorityReadinessOptions, 'output' | 'markdown'>,
): Promise<void> {
  if (!options.output) {
    throw new Error('security report-ci-branch-activation-authority-readiness requires --output <json>.')
  }
  const outputPath = resolveRepoPath(root, options.output)
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  const sourceSet = new Set(sourcePaths.map((entry) => path.resolve(entry)))
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('CI/branch activation authority readiness JSON output and Markdown output must be different paths.')
  }
  for (const target of [outputPath, markdownPath].filter((entry): entry is string => Boolean(entry))) {
    const relativeTarget = relativePath(root, target)
    if (sourceSet.has(path.resolve(target))) {
      throw new Error(
        `CI/branch activation authority readiness output would overwrite a source input: ${relativeTarget}.`,
      )
    }
    if (
      hasDevViewControlDirectory(target) ||
      hasCodexControlDirectory(target) ||
      hasHiddenControlDirectorySegment(target)
    ) {
      throw new Error(
        `CI/branch activation authority readiness output is inside a protected control path: ${relativeTarget}.`,
      )
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(
        `CI/branch activation authority readiness output would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
  }
}

function renderMarkdown(report: CiBranchActivationAuthorityReadinessReport): string {
  return [
    '# DevView CI / Branch Activation Authority Readiness',
    '',
    `- status: ${report.status}`,
    `- authorityReadinessStatus: ${report.authorityReadinessStatus}`,
    `- activationPlan: ${report.sourceCiBranchActivationPlan.path ?? 'not-supplied'}`,
    `- activationPlanFutureOnly: ${report.authorityPrerequisiteSummary.activationPlanFutureOnly}`,
    `- ciBranchPolicyValidated: ${report.authorityPrerequisiteSummary.ciBranchPolicyValidated}`,
    `- providerDefaultDenyRecorded: ${report.authorityPrerequisiteSummary.providerDefaultDenyRecorded}`,
    `- rbacPolicyValidated: ${report.authorityPrerequisiteSummary.rbacPolicyValidated}`,
    `- signingReadinessRecorded: ${report.authorityPrerequisiteSummary.signingReadinessRecorded}`,
    `- recordEnvelopeDigestVerified: ${report.authorityPrerequisiteSummary.recordEnvelopeDigestVerified}`,
    `- signedPolicyPresent: false`,
    `- providerGrantPresent: false`,
    `- rbacEnforced: false`,
    '',
    '## Findings',
    ...report.authorityFindings.map((entry) => `- [${entry.severity}] ${entry.code}: ${entry.message}`),
    '',
    '## Downstream Actions',
    ...report.downstreamActionPlan.map((entry) => `- ${entry}`),
    '',
    '## Report-Only Safety',
    '- branchProtectionMutated: false',
    '- requiredChecksMutated: false',
    '- providerInvoked: false',
    '- networkCallMade: false',
    '- apiCallMade: false',
    '- hooksActivated: false',
    '- cryptographicSignatureVerified: false',
    '- rbacEnforced: false',
    '- enterpriseGateActivated: false',
    '',
  ].join('\n')
}

function downstreamActionPlan(findings: CiBranchActivationAuthorityReadinessFinding[]): string[] {
  const actions = new Set<string>()
  if (findings.some((finding) => finding.severity === 'blocker')) {
    actions.add('Fix source role/status, future-only step, default-deny, allowlist, or unsafe authority blockers.')
  }
  actions.add('Define signed CI/branch activation policy and signed envelope semantics before any authority claim.')
  actions.add('Define provider activation authorization readiness before any provider/API activation request.')
  actions.add(
    'Keep required checks, branch protection, hooks, provider/API calls, RBAC enforcement, and enterprise gates disabled.',
  )
  actions.add('Integrate this report into enterprise readiness as a later visibility-only source fact.')
  return [...actions]
}

function addSourceFinding(
  findings: CiBranchActivationAuthorityReadinessFinding[],
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
): CiBranchActivationAuthorityReadinessFinding {
  return { severity: 'blocker', code, message, path: pathValue, field }
}

function gapFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): CiBranchActivationAuthorityReadinessFinding {
  return { severity: 'gap', code, message, path: pathValue, field }
}

function satisfiedFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): CiBranchActivationAuthorityReadinessFinding {
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
      [
        'defaultProviderPolicy',
        'defaultNetworkPolicy',
        'defaultExternalCiPolicy',
        'defaultBranchMutationPolicy',
      ].includes(key) &&
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
    normalized.endsWith('ci-branch-activation-plan.json') ||
    normalized.endsWith('ci-branch-policy-validation.json') ||
    normalized.endsWith('ci-branch-governance-readiness.json') ||
    normalized.endsWith('provider-network-policy-report.json') ||
    normalized.endsWith('rbac-policy-validation.json') ||
    normalized.endsWith('signing-readiness.json') ||
    normalized.endsWith('record-envelope-verification.json') ||
    normalized.endsWith('provenance-verification-readiness.json')
  )
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function asRecord(value: unknown): JsonRecord | null {
  return isJsonRecord(value) ? value : null
}

function recordArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isJsonRecord) : []
}

function arrayLength(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function booleanValue(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function booleanOrNull(value: unknown): boolean | null {
  return booleanValue(value)
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}
