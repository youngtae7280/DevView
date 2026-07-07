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

const REPORT_ROLE = 'devview-ci-branch-activation-plan-report'
const RECORDED_STATUS = 'devview-ci-branch-activation-plan-recorded'
const BLOCKED_STATUS = 'devview-ci-branch-activation-plan-blocked'
const ACTIVATION_SCOPE = 'ci-branch-activation-plan-report-only'
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
const PROVENANCE_VERIFICATION_READINESS_ROLE = 'devview-provenance-verification-readiness-report'
const PROVENANCE_VERIFICATION_READINESS_STATUS = 'devview-provenance-verification-readiness-reported'
const RECORD_ENVELOPE_VERIFICATION_ROLE = 'devview-record-envelope-verification-report'
const RECORD_ENVELOPE_VERIFICATION_STATUS = 'devview-record-envelope-verified'
const RELEASE_SURFACE_ROLE = 'devview-release-surface-validation-report'
const RELEASE_SURFACE_STATUSES = [
  'devview-release-surface-validation-passed',
  'devview-release-surface-validation-failed',
]

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

export interface CiBranchActivationPlanOptions {
  ciBranchPolicyValidation?: string
  ciBranchGovernanceReadiness?: string
  providerNetworkPolicyReport?: string
  rbacPolicyValidation?: string
  signingReadiness?: string
  provenanceVerificationReadiness?: string
  recordEnvelopeVerification?: string
  releaseSurfaceValidation?: string
  output?: string
  markdown?: string
}

export interface CiBranchActivationPlanFinding {
  severity: 'blocker' | 'gap' | 'advisory' | 'satisfied'
  code: string
  message: string
  path?: string
  field?: string
}

type SourceKind =
  | 'ci-branch-policy-validation'
  | 'ci-branch-governance-readiness'
  | 'provider-network-policy-report'
  | 'rbac-policy-validation'
  | 'signing-readiness'
  | 'provenance-verification-readiness'
  | 'record-envelope-verification'
  | 'release-surface-validation'

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

interface ActivationStep {
  stepId: string
  order: number
  title: string
  executionMode: 'future-only-not-executed'
  requiredBeforeActualActivation: boolean
  sourceFactLinked: boolean
  status: 'blocked-until-prerequisite-recorded' | 'ready-for-future-review-only' | 'future-only-not-executed'
}

export interface CiBranchActivationPlanReport extends JsonRecord {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof RECORDED_STATUS | typeof BLOCKED_STATUS
  activationPlanScope: typeof ACTIVATION_SCOPE
  sourceFactsOnly: true
  reportOnly: true
  activationPlanStatus:
    | 'draft-non-authoritative-prerequisites-missing'
    | 'ready-for-future-review-only-not-activation'
    | 'blocked-unsafe-source-fact'
  sourceCiBranchPolicyValidation: SourceSummary & {
    ciBranchPolicyValidationStatus: string | null
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
  }
  sourceRbacPolicyValidation: SourceSummary & {
    rbacPolicyValidationStatus: string | null
    actorCount: number | null
    permissionGrantCount: number | null
  }
  sourceSigningReadiness: SourceSummary & {
    signingReadinessStatus: string | null
    keyRegistryPresent: boolean | null
    trustRootPresent: boolean | null
  }
  sourceProvenanceVerificationReadiness: SourceSummary & {
    provenanceVerificationReadinessStatus: string | null
    realSlsaVerificationPerformed: boolean | null
    realInTotoVerificationPerformed: boolean | null
    cryptographicSignatureVerified: boolean | null
  }
  sourceRecordEnvelopeVerification: SourceSummary & {
    payloadDigestMatches: boolean | null
    allSourceDigestsMatch: boolean | null
    previousEnvelopeChainLinkVerified: boolean | null
    signatureVerificationMode: string | null
  }
  sourceReleaseSurfaceValidation: SourceSummary & {
    packageName: string | null
    packageVersion: string | null
    forbiddenFindingCount: number | null
  }
  sourceArtifactDigests: Array<{
    path: string
    sourceKind: SourceKind
    artifactRole: string | null
    status: string | null
    sha256: string | null
    byteLength: number | null
  }>
  policyDerivedRequiredChecksPlan: JsonRecord
  policyDerivedBranchProtectionPlan: JsonRecord
  activationSequenceProposal: ActivationStep[]
  prerequisiteGateSummary: JsonRecord
  nonAuthorityBoundary: JsonRecord
  planFindings: CiBranchActivationPlanFinding[]
  downstreamActionPlan: string[]
  githubMutated: false
  githubWorkflowMutated: false
  workflowExecuted: false
  workflowsExecuted: false
  branchProtectionChanged: false
  branchProtectionMutated: false
  requiredChecksConfigured: false
  requiredChecksMutated: false
  externalCiMutated: false
  hooksActivated: false
  ciProviderCalled: false
  providerInvoked: false
  networkCallMade: false
  apiCallMade: false
  shellCommandsExecuted: false
  extensionExecutionAllowed: false
  extensionsExecuted: false
  cryptographicSignatureVerified: false
  cryptographicSigningImplemented: false
  keyGenerated: false
  privateKeyStored: false
  keyRegistryCreated: false
  trustRootCreated: false
  rbacEnforced: false
  permissionVerified: false
  rbacPermissionVerified: false
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
  enterpriseGateActivated: false
  writtenOutputPath?: string
  writtenMarkdownPath?: string
}

export class CiBranchActivationPlanValidationError extends Error {
  readonly report: CiBranchActivationPlanReport

  constructor(report: CiBranchActivationPlanReport) {
    super('CI/branch activation planning is blocked.')
    this.report = report
  }
}

export async function planCiBranchActivation(
  root: string,
  options: CiBranchActivationPlanOptions,
): Promise<CiBranchActivationPlanReport> {
  validateRequiredOptions(options)
  const normalized = normalizeSourceOptions(options)
  const sourcePaths = [
    normalized.ciBranchPolicyValidation,
    normalized.ciBranchGovernanceReadiness,
    normalized.providerNetworkPolicyReport,
    normalized.rbacPolicyValidation,
    normalized.signingReadiness,
    normalized.provenanceVerificationReadiness,
    normalized.recordEnvelopeVerification,
    normalized.releaseSurfaceValidation,
  ].filter((entry): entry is string => Boolean(entry))
  await assertOutputAuthority(
    root,
    sourcePaths.map((entry) => resolveRepoPath(root, entry)),
    options,
  )

  const ciBranchPolicyValidation = await loadSource(
    root,
    normalized.ciBranchPolicyValidation,
    'ci-branch-policy-validation',
  )
  const ciBranchGovernanceReadiness = normalized.ciBranchGovernanceReadiness
    ? await loadSource(root, normalized.ciBranchGovernanceReadiness, 'ci-branch-governance-readiness')
    : null
  const providerNetworkPolicy = normalized.providerNetworkPolicyReport
    ? await loadSource(root, normalized.providerNetworkPolicyReport, 'provider-network-policy-report')
    : null
  const rbacPolicyValidation = normalized.rbacPolicyValidation
    ? await loadSource(root, normalized.rbacPolicyValidation, 'rbac-policy-validation')
    : null
  const signingReadiness = normalized.signingReadiness
    ? await loadSource(root, normalized.signingReadiness, 'signing-readiness')
    : null
  const provenanceVerificationReadiness = normalized.provenanceVerificationReadiness
    ? await loadSource(root, normalized.provenanceVerificationReadiness, 'provenance-verification-readiness')
    : null
  const recordEnvelopeVerification = normalized.recordEnvelopeVerification
    ? await loadSource(root, normalized.recordEnvelopeVerification, 'record-envelope-verification')
    : null
  const releaseSurfaceValidation = normalized.releaseSurfaceValidation
    ? await loadSource(root, normalized.releaseSurfaceValidation, 'release-surface-validation')
    : null

  const blockingFindings = validateSources(
    ciBranchPolicyValidation,
    ciBranchGovernanceReadiness,
    providerNetworkPolicy,
    rbacPolicyValidation,
    signingReadiness,
    provenanceVerificationReadiness,
    recordEnvelopeVerification,
    releaseSurfaceValidation,
  )
  if (blockingFindings.some((finding) => finding.severity === 'blocker')) {
    throw new CiBranchActivationPlanValidationError(
      buildReport(
        ciBranchPolicyValidation,
        ciBranchGovernanceReadiness,
        providerNetworkPolicy,
        rbacPolicyValidation,
        signingReadiness,
        provenanceVerificationReadiness,
        recordEnvelopeVerification,
        releaseSurfaceValidation,
        blockingFindings,
        true,
      ),
    )
  }

  const report = buildReport(
    ciBranchPolicyValidation,
    ciBranchGovernanceReadiness,
    providerNetworkPolicy,
    rbacPolicyValidation,
    signingReadiness,
    provenanceVerificationReadiness,
    recordEnvelopeVerification,
    releaseSurfaceValidation,
    buildFindings(
      ciBranchPolicyValidation,
      ciBranchGovernanceReadiness,
      providerNetworkPolicy,
      rbacPolicyValidation,
      signingReadiness,
      provenanceVerificationReadiness,
      recordEnvelopeVerification,
      releaseSurfaceValidation,
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
  ciBranchPolicyValidation: LoadedSource,
  ciBranchGovernanceReadiness: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  rbacPolicyValidation: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
  recordEnvelopeVerification: LoadedSource | null,
  releaseSurfaceValidation: LoadedSource | null,
  findings: CiBranchActivationPlanFinding[],
  blocked = false,
): CiBranchActivationPlanReport {
  const policyRecord = ciBranchPolicyValidation.record ?? {}
  const requiredChecks = asRecord(policyRecord.requiredChecksPolicyValidation)
  const branchProtection = asRecord(policyRecord.branchProtectionPolicyValidation)
  const prerequisites = prerequisiteSummary(
    providerNetworkPolicy,
    rbacPolicyValidation,
    signingReadiness,
    provenanceVerificationReadiness,
    recordEnvelopeVerification,
    releaseSurfaceValidation,
  )
  const readyForReview = readyForFutureReviewOnly(requiredChecks, branchProtection, prerequisites, findings)

  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : RECORDED_STATUS,
    activationPlanScope: ACTIVATION_SCOPE,
    sourceFactsOnly: true,
    reportOnly: true,
    activationPlanStatus: blocked
      ? 'blocked-unsafe-source-fact'
      : readyForReview
        ? 'ready-for-future-review-only-not-activation'
        : 'draft-non-authoritative-prerequisites-missing',
    sourceCiBranchPolicyValidation: ciBranchPolicyValidationSummary(ciBranchPolicyValidation),
    sourceCiBranchGovernanceReadiness: ciBranchGovernanceReadinessSummary(ciBranchGovernanceReadiness),
    sourceProviderNetworkPolicy: providerNetworkPolicySummary(providerNetworkPolicy),
    sourceRbacPolicyValidation: rbacPolicyValidationSummary(rbacPolicyValidation),
    sourceSigningReadiness: signingReadinessSummary(signingReadiness),
    sourceProvenanceVerificationReadiness: provenanceVerificationReadinessSummary(provenanceVerificationReadiness),
    sourceRecordEnvelopeVerification: recordEnvelopeVerificationSummary(recordEnvelopeVerification),
    sourceReleaseSurfaceValidation: releaseSurfaceValidationSummary(releaseSurfaceValidation),
    sourceArtifactDigests: sourceArtifactDigests([
      ciBranchPolicyValidation,
      ciBranchGovernanceReadiness,
      providerNetworkPolicy,
      rbacPolicyValidation,
      signingReadiness,
      provenanceVerificationReadiness,
      recordEnvelopeVerification,
      releaseSurfaceValidation,
    ]),
    policyDerivedRequiredChecksPlan: {
      requiredChecksPolicyPresent: booleanValue(requiredChecks?.requiredChecksPolicyPresent) ?? false,
      declaredCheckCount:
        numberValue(requiredChecks?.declaredCheckCount) ?? arrayLength(requiredChecks?.declaredChecks) ?? 0,
      declaredChecks: recordArray(requiredChecks?.declaredChecks),
      workflowCandidateCheckCount:
        numberValue(requiredChecks?.workflowCandidateCheckCount) ??
        arrayLength(requiredChecks?.workflowCandidateChecks) ??
        0,
      workflowCandidateChecks: stringArray(requiredChecks?.workflowCandidateChecks),
      matchedWorkflowCandidateCheckCount:
        numberValue(requiredChecks?.workflowCandidateMatchCount) ?? arrayLength(requiredChecks?.matchedChecks) ?? 0,
      matchedChecks: stringArray(requiredChecks?.matchedChecks),
      unmappedDeclaredCheckCount: arrayLength(requiredChecks?.unmappedDeclaredChecks) ?? 0,
      unmappedDeclaredChecks: stringArray(requiredChecks?.unmappedDeclaredChecks),
      extraWorkflowCandidateCheckCount: arrayLength(requiredChecks?.extraWorkflowCandidateChecks) ?? 0,
      extraWorkflowCandidateChecks: stringArray(requiredChecks?.extraWorkflowCandidateChecks),
      requiredChecksConfigured: false,
      requiredChecksMutated: false,
    },
    policyDerivedBranchProtectionPlan: {
      branchProtectionPolicyPresent: booleanValue(branchProtection?.branchProtectionPolicyPresent) ?? false,
      targetBranchCount:
        numberValue(branchProtection?.targetBranchCount) ?? arrayLength(branchProtection?.targetBranches) ?? 0,
      targetBranches: stringArray(branchProtection?.targetBranches),
      desiredFutureRuleCount: numberValue(branchProtection?.desiredFutureRuleCount) ?? 0,
      desiredFutureRules: stringArray(branchProtection?.desiredFutureRules),
      branchProtectionChanged: false,
      branchProtectionMutated: false,
    },
    activationSequenceProposal: activationSequence(prerequisites),
    prerequisiteGateSummary: prerequisites,
    nonAuthorityBoundary: nonAuthorityBoundary(),
    planFindings: findings,
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
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
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
  ciBranchPolicyValidation: LoadedSource,
  ciBranchGovernanceReadiness: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  rbacPolicyValidation: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
  recordEnvelopeVerification: LoadedSource | null,
  releaseSurfaceValidation: LoadedSource | null,
): CiBranchActivationPlanFinding[] {
  const findings: CiBranchActivationPlanFinding[] = []
  for (const source of [
    ciBranchPolicyValidation,
    ciBranchGovernanceReadiness,
    providerNetworkPolicy,
    rbacPolicyValidation,
    signingReadiness,
    provenanceVerificationReadiness,
    recordEnvelopeVerification,
    releaseSurfaceValidation,
  ].filter((entry): entry is LoadedSource => Boolean(entry))) {
    if (source.readError) {
      findings.push(blockingFinding('CI_BRANCH_ACTIVATION_SOURCE_READ_FAILED', source.readError, source.relativePath))
      continue
    }
    if (!source.record) {
      findings.push(
        blockingFinding(
          'CI_BRANCH_ACTIVATION_SOURCE_NOT_JSON_OBJECT',
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

function validateRoleStatus(source: LoadedSource, record: JsonRecord, findings: CiBranchActivationPlanFinding[]): void {
  const expected = expectedRoleStatus(source.sourceKind)
  if (
    record.artifactRole !== expected.role ||
    (Array.isArray(expected.status)
      ? !expected.status.includes(stringValue(record.status) ?? '')
      : record.status !== expected.status)
  ) {
    findings.push(
      blockingFinding(
        `${findingPrefix(source.sourceKind)}_ROLE_STATUS_INVALID`,
        `${source.relativePath} must be ${expected.role} with expected status.`,
        source.relativePath,
      ),
    )
  }
}

function validateSourceSpecificClaims(
  source: LoadedSource,
  record: JsonRecord,
  findings: CiBranchActivationPlanFinding[],
): void {
  if (source.sourceKind === 'provider-network-policy-report') {
    if (record.defaultProviderPolicy !== 'deny' || record.defaultNetworkPolicy !== 'deny') {
      findings.push(
        blockingFinding(
          'CI_BRANCH_ACTIVATION_PROVIDER_NETWORK_SOURCE_NOT_DENY',
          `${source.relativePath} must keep provider and network defaults deny.`,
          source.relativePath,
        ),
      )
    }
    if ((arrayLength(record.providerAllowlist) ?? 0) > 0 || (arrayLength(record.networkAllowlist) ?? 0) > 0) {
      findings.push(
        blockingFinding(
          'CI_BRANCH_ACTIVATION_PROVIDER_NETWORK_ALLOWLIST_UNSUPPORTED',
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
  findings: CiBranchActivationPlanFinding[],
): void {
  for (const hit of collectTrueFieldHits(record, unsafeAuthorityFields)) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_ACTIVATION_UNSAFE_SOURCE_AUTHORITY_FLAG',
        `${source.relativePath} claims ${hit.path}: true; CI/branch activation planning is report-only.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
  for (const hit of collectNonEmptyFieldHits(record, allowlistFields)) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_ACTIVATION_ALLOWLIST_UNSUPPORTED',
        `${source.relativePath} has non-empty ${hit.path}; provider/network/API allowlists are future-only.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
  for (const hit of collectDefaultAllowPolicyHits(record)) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_ACTIVATION_DEFAULT_ALLOW_UNSUPPORTED',
        `${source.relativePath} sets ${hit.path} to allow; activation planning accepts default-deny source facts only.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
}

function buildFindings(
  ciBranchPolicyValidation: LoadedSource,
  ciBranchGovernanceReadiness: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  rbacPolicyValidation: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
  recordEnvelopeVerification: LoadedSource | null,
  releaseSurfaceValidation: LoadedSource | null,
): CiBranchActivationPlanFinding[] {
  const findings: CiBranchActivationPlanFinding[] = [
    satisfiedFinding(
      'CI_BRANCH_ACTIVATION_POLICY_VALIDATION_LINKED',
      'CI/branch policy validation is linked as the required source fact for future activation planning.',
      ciBranchPolicyValidation.relativePath,
    ),
    satisfiedFinding(
      'CI_BRANCH_ACTIVATION_NON_AUTHORITY_BOUNDARY_RECORDED',
      'Activation plan is non-authoritative and does not configure checks, mutate branch protection, call providers, activate hooks, or enable enterprise gates.',
    ),
  ]
  const record = ciBranchPolicyValidation.record ?? {}
  const requiredChecks = asRecord(record.requiredChecksPolicyValidation)
  const branchProtection = asRecord(record.branchProtectionPolicyValidation)
  if ((arrayLength(requiredChecks?.unmappedDeclaredChecks) ?? 0) > 0) {
    findings.push(
      gapFinding(
        'CI_BRANCH_ACTIVATION_DECLARED_CHECKS_UNMAPPED',
        'Some declared future required checks are not mapped to workflow inventory candidates.',
        ciBranchPolicyValidation.relativePath,
        'requiredChecksPolicyValidation.unmappedDeclaredChecks',
      ),
    )
  }
  if (!booleanValue(branchProtection?.branchProtectionPolicyPresent)) {
    findings.push(
      gapFinding(
        'CI_BRANCH_ACTIVATION_BRANCH_POLICY_NOT_PRESENT',
        'CI/branch policy validation does not include a branch protection policy section.',
        ciBranchPolicyValidation.relativePath,
        'branchProtectionPolicyValidation.branchProtectionPolicyPresent',
      ),
    )
  }
  addSourceFinding(
    findings,
    ciBranchGovernanceReadiness,
    'CI_BRANCH_ACTIVATION_GOVERNANCE_READINESS',
    'CI/branch governance readiness source is linked for workflow inventory and external governance gaps.',
    'CI/branch governance readiness source was not supplied; activation plan cannot confirm workflow inventory source facts.',
  )
  addSourceFinding(
    findings,
    providerNetworkPolicy,
    'CI_BRANCH_ACTIVATION_PROVIDER_NETWORK_POLICY',
    'Provider/network default-deny policy source is linked.',
    'Provider/network default-deny policy source was not supplied; future provider/API governance remains missing.',
  )
  addSourceFinding(
    findings,
    rbacPolicyValidation,
    'CI_BRANCH_ACTIVATION_RBAC_POLICY_VALIDATION',
    'RBAC policy validation source is linked.',
    'RBAC policy validation source was not supplied; future activation actor/permission governance remains missing.',
  )
  addSourceFinding(
    findings,
    signingReadiness,
    'CI_BRANCH_ACTIVATION_SIGNING_READINESS',
    'Signing/key governance readiness source is linked.',
    'Signing readiness source was not supplied; signed policy/envelope prerequisites remain missing.',
  )
  addSourceFinding(
    findings,
    provenanceVerificationReadiness,
    'CI_BRANCH_ACTIVATION_PROVENANCE_VERIFICATION_READINESS',
    'Provenance verification readiness source is linked.',
    'Provenance verification readiness source was not supplied; release/provenance prerequisites remain missing.',
  )
  addSourceFinding(
    findings,
    recordEnvelopeVerification,
    'CI_BRANCH_ACTIVATION_RECORD_ENVELOPE_VERIFICATION',
    'Record envelope verification source is linked.',
    'Record envelope verification source was not supplied; activation source digests have not been independently linked.',
  )
  if (!releaseSurfaceValidation) {
    findings.push(
      gapFinding(
        'CI_BRANCH_ACTIVATION_RELEASE_SURFACE_VALIDATION_NOT_SUPPLIED',
        'Release-surface validation source was not supplied.',
      ),
    )
  } else if (releaseSurfaceValidation.record?.status === 'devview-release-surface-validation-failed') {
    findings.push(
      gapFinding(
        'CI_BRANCH_ACTIVATION_RELEASE_SURFACE_VALIDATION_FAILED',
        'Release-surface validation source is failed; activation plan remains a draft gap.',
        releaseSurfaceValidation.relativePath,
      ),
    )
  } else {
    findings.push(
      satisfiedFinding(
        'CI_BRANCH_ACTIVATION_RELEASE_SURFACE_VALIDATION_LINKED',
        'Release-surface validation source is linked.',
        releaseSurfaceValidation.relativePath,
      ),
    )
  }
  return findings
}

function addSourceFinding(
  findings: CiBranchActivationPlanFinding[],
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

function prerequisiteSummary(
  providerNetworkPolicy: LoadedSource | null,
  rbacPolicyValidation: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
  recordEnvelopeVerification: LoadedSource | null,
  releaseSurfaceValidation: LoadedSource | null,
): JsonRecord {
  const envelopeRecord = recordEnvelopeVerification?.record ?? null
  const payloadVerification = asRecord(envelopeRecord?.payloadVerification)
  const sourceVerification = asRecord(envelopeRecord?.sourceArtifactVerification)
  return {
    providerDefaultDenyRecorded: providerDefaultDenyRecorded(providerNetworkPolicy?.record),
    rbacPolicyValidated: Boolean(rbacPolicyValidation),
    signingReadinessRecorded: Boolean(signingReadiness),
    envelopeDigestVerified:
      Boolean(recordEnvelopeVerification) &&
      booleanValue(payloadVerification?.digestMatches) === true &&
      (booleanValue(sourceVerification?.allSourceDigestsMatch) ?? true),
    provenanceVerificationReadinessRecorded: Boolean(provenanceVerificationReadiness),
    releaseSurfaceValidated: releaseSurfaceValidation?.record?.status === 'devview-release-surface-validation-passed',
    signedPolicyPresent: false,
    rbacEnforced: false,
    providerGrantPresent: false,
  }
}

function readyForFutureReviewOnly(
  requiredChecks: JsonRecord | null,
  branchProtection: JsonRecord | null,
  prerequisites: JsonRecord,
  findings: CiBranchActivationPlanFinding[],
): boolean {
  if (findings.some((finding) => finding.severity === 'blocker')) return false
  if ((arrayLength(requiredChecks?.unmappedDeclaredChecks) ?? 0) > 0) return false
  if (!booleanValue(branchProtection?.branchProtectionPolicyPresent)) return false
  return (
    prerequisites.providerDefaultDenyRecorded === true &&
    prerequisites.rbacPolicyValidated === true &&
    prerequisites.signingReadinessRecorded === true &&
    prerequisites.envelopeDigestVerified === true &&
    prerequisites.provenanceVerificationReadinessRecorded === true &&
    prerequisites.releaseSurfaceValidated === true
  )
}

function activationSequence(prerequisites: JsonRecord): ActivationStep[] {
  return [
    activationStep(
      1,
      'revalidate-source-digests',
      'Revalidate policy/readiness source digests before any future review.',
      true,
      true,
    ),
    activationStep(
      2,
      'verify-signed-policy-prerequisites',
      'Verify signed policy, key trust, and RBAC prerequisites in a future signed-policy slice.',
      true,
      false,
    ),
    activationStep(
      3,
      'obtain-provider-network-governance',
      'Record explicit provider/network governance before any provider/API call.',
      true,
      prerequisites.providerDefaultDenyRecorded === true,
    ),
    activationStep(
      4,
      'prepare-provider-specific-activation-request',
      'Prepare a future provider-specific branch protection and required-check request without executing it here.',
      true,
      false,
    ),
    activationStep(
      5,
      'run-future-external-activation',
      'Future external activation remains out of scope until all authority gates are implemented.',
      true,
      false,
    ),
    activationStep(
      6,
      'post-activation-verification',
      'Future post-activation verification must independently confirm provider state after a separately authorized run.',
      true,
      false,
    ),
  ]
}

function activationStep(
  order: number,
  stepId: string,
  title: string,
  requiredBeforeActualActivation: boolean,
  sourceFactLinked: boolean,
): ActivationStep {
  return {
    stepId,
    order,
    title,
    executionMode: 'future-only-not-executed',
    requiredBeforeActualActivation,
    sourceFactLinked,
    status: sourceFactLinked ? 'ready-for-future-review-only' : 'blocked-until-prerequisite-recorded',
  }
}

function nonAuthorityBoundary(): JsonRecord {
  return {
    githubWriteAllowed: false,
    githubMutated: false,
    ciProviderApiCallAllowed: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    branchProtectionMutationAllowed: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksMutationAllowed: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    hooksAllowed: false,
    hooksActivated: false,
    enterpriseGateAllowed: false,
    enterpriseGateActivated: false,
  }
}

function ciBranchPolicyValidationSummary(
  source: LoadedSource,
): CiBranchActivationPlanReport['sourceCiBranchPolicyValidation'] {
  const record = source.record ?? {}
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    sha256: source.sha256,
    byteLength: source.byteLength,
    ciBranchPolicyValidationStatus: stringValue(record.ciBranchPolicyValidationStatus),
  }
}

function ciBranchGovernanceReadinessSummary(
  source: LoadedSource | null,
): CiBranchActivationPlanReport['sourceCiBranchGovernanceReadiness'] {
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
): CiBranchActivationPlanReport['sourceProviderNetworkPolicy'] {
  const base = emptySourceSummary(source)
  const record = source?.record ?? null
  return {
    ...base,
    defaultProviderPolicy: stringValue(record?.defaultProviderPolicy),
    defaultNetworkPolicy: stringValue(record?.defaultNetworkPolicy),
    providerAllowlistCount: arrayLength(record?.providerAllowlist),
    networkAllowlistCount: arrayLength(record?.networkAllowlist),
  }
}

function rbacPolicyValidationSummary(
  source: LoadedSource | null,
): CiBranchActivationPlanReport['sourceRbacPolicyValidation'] {
  const base = emptySourceSummary(source)
  const record = source?.record ?? null
  const actorSummary = asRecord(record?.actorSummary)
  const permissionGrantSummary = asRecord(record?.permissionGrantSummary)
  return {
    ...base,
    rbacPolicyValidationStatus: stringValue(record?.rbacPolicyValidationStatus),
    actorCount: numberValue(actorSummary?.actorCount),
    permissionGrantCount: numberValue(permissionGrantSummary?.grantCount),
  }
}

function signingReadinessSummary(source: LoadedSource | null): CiBranchActivationPlanReport['sourceSigningReadiness'] {
  const base = emptySourceSummary(source)
  const record = source?.record ?? null
  const keyGovernance = asRecord(record?.keyGovernanceReadiness)
  return {
    ...base,
    signingReadinessStatus: stringValue(record?.signingReadinessStatus),
    keyRegistryPresent: booleanOrNull(keyGovernance?.keyRegistryPresent),
    trustRootPresent: booleanOrNull(keyGovernance?.trustRootPresent),
  }
}

function provenanceVerificationReadinessSummary(
  source: LoadedSource | null,
): CiBranchActivationPlanReport['sourceProvenanceVerificationReadiness'] {
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

function recordEnvelopeVerificationSummary(
  source: LoadedSource | null,
): CiBranchActivationPlanReport['sourceRecordEnvelopeVerification'] {
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

function releaseSurfaceValidationSummary(
  source: LoadedSource | null,
): CiBranchActivationPlanReport['sourceReleaseSurfaceValidation'] {
  const base = emptySourceSummary(source)
  const record = source?.record ?? null
  return {
    ...base,
    packageName: stringValue(record?.packageName),
    packageVersion: stringValue(record?.packageVersion),
    forbiddenFindingCount: numberValue(record?.forbiddenFindingCount),
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
): CiBranchActivationPlanReport['sourceArtifactDigests'] {
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

function providerDefaultDenyRecorded(record: JsonRecord | null | undefined): boolean {
  return Boolean(record && record.defaultProviderPolicy === 'deny' && record.defaultNetworkPolicy === 'deny')
}

function expectedRoleStatus(sourceKind: SourceKind): { role: string; status: string | string[] } {
  switch (sourceKind) {
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
    case 'provenance-verification-readiness':
      return { role: PROVENANCE_VERIFICATION_READINESS_ROLE, status: PROVENANCE_VERIFICATION_READINESS_STATUS }
    case 'record-envelope-verification':
      return { role: RECORD_ENVELOPE_VERIFICATION_ROLE, status: RECORD_ENVELOPE_VERIFICATION_STATUS }
    case 'release-surface-validation':
      return { role: RELEASE_SURFACE_ROLE, status: RELEASE_SURFACE_STATUSES }
  }
}

function findingPrefix(sourceKind: SourceKind): string {
  return `CI_BRANCH_ACTIVATION_${sourceKind.replace(/-/g, '_').toUpperCase()}`
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

function validateRequiredOptions(options: CiBranchActivationPlanOptions): void {
  if (!options.ciBranchPolicyValidation) {
    throw new Error('security plan-ci-branch-activation requires --ci-branch-policy-validation <json>.')
  }
  if (!options.output) throw new Error('security plan-ci-branch-activation requires --output <json>.')
}

function normalizeSourceOptions(
  options: CiBranchActivationPlanOptions,
): Required<Pick<CiBranchActivationPlanOptions, 'ciBranchPolicyValidation'>> &
  Omit<CiBranchActivationPlanOptions, 'ciBranchPolicyValidation' | 'output' | 'markdown'> {
  return {
    ciBranchPolicyValidation: singlePath(options.ciBranchPolicyValidation, '--ci-branch-policy-validation'),
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
    provenanceVerificationReadiness: singleOptionalPath(
      options.provenanceVerificationReadiness,
      '--provenance-verification-readiness',
    ),
    recordEnvelopeVerification: singleOptionalPath(
      options.recordEnvelopeVerification,
      '--record-envelope-verification',
    ),
    releaseSurfaceValidation: singleOptionalPath(options.releaseSurfaceValidation, '--release-surface-validation'),
  }
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: Pick<CiBranchActivationPlanOptions, 'output' | 'markdown'>,
): Promise<void> {
  if (!options.output) throw new Error('security plan-ci-branch-activation requires --output <json>.')
  const outputPath = resolveRepoPath(root, options.output)
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  const sourceSet = new Set(sourcePaths.map((entry) => path.resolve(entry)))
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('CI/branch activation plan JSON output and Markdown output must be different paths.')
  }
  for (const target of [outputPath, markdownPath].filter((entry): entry is string => Boolean(entry))) {
    const relativeTarget = relativePath(root, target)
    if (sourceSet.has(path.resolve(target))) {
      throw new Error(`CI/branch activation plan output would overwrite a source input: ${relativeTarget}.`)
    }
    if (
      hasDevViewControlDirectory(target) ||
      hasCodexControlDirectory(target) ||
      hasHiddenControlDirectorySegment(target)
    ) {
      throw new Error(`CI/branch activation plan output is inside a protected control path: ${relativeTarget}.`)
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(
        `CI/branch activation plan output would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
  }
}

function renderMarkdown(report: CiBranchActivationPlanReport): string {
  return [
    '# DevView CI / Branch Activation Plan',
    '',
    `- status: ${report.status}`,
    `- activationPlanStatus: ${report.activationPlanStatus}`,
    `- ciBranchPolicyValidation: ${report.sourceCiBranchPolicyValidation.path ?? 'not-supplied'}`,
    `- declaredRequiredChecks: ${report.policyDerivedRequiredChecksPlan.declaredCheckCount}`,
    `- matchedWorkflowCandidates: ${report.policyDerivedRequiredChecksPlan.matchedWorkflowCandidateCheckCount}`,
    `- targetBranches: ${report.policyDerivedBranchProtectionPlan.targetBranchCount}`,
    `- providerDefaultDenyRecorded: ${report.prerequisiteGateSummary.providerDefaultDenyRecorded}`,
    `- rbacPolicyValidated: ${report.prerequisiteGateSummary.rbacPolicyValidated}`,
    `- signingReadinessRecorded: ${report.prerequisiteGateSummary.signingReadinessRecorded}`,
    `- envelopeDigestVerified: ${report.prerequisiteGateSummary.envelopeDigestVerified}`,
    '',
    '## Proposed Future Sequence',
    ...report.activationSequenceProposal.map((entry) => `- ${entry.order}. ${entry.stepId}: ${entry.executionMode}`),
    '',
    '## Findings',
    ...report.planFindings.map((entry) => `- [${entry.severity}] ${entry.code}: ${entry.message}`),
    '',
    '## Downstream Actions',
    ...report.downstreamActionPlan.map((entry) => `- ${entry}`),
    '',
    '## Report-Only Safety',
    '- githubMutated: false',
    '- branchProtectionMutated: false',
    '- requiredChecksMutated: false',
    '- providerInvoked: false',
    '- networkCallMade: false',
    '- hooksActivated: false',
    '- enterpriseGateActivated: false',
    '',
  ].join('\n')
}

function downstreamActionPlan(findings: CiBranchActivationPlanFinding[]): string[] {
  const actions = new Set<string>()
  if (findings.some((finding) => finding.severity === 'blocker')) {
    actions.add(
      'Fix source role/status, default-deny, allowlist, or unsafe authority blockers before planning activation.',
    )
  }
  actions.add(
    'Treat this plan as non-authoritative until signed policy, RBAC enforcement, and provider governance exist.',
  )
  actions.add('Keep required checks, branch protection, hooks, provider/API calls, and enterprise gates disabled.')
  if (findings.some((finding) => finding.code.includes('RECORD_ENVELOPE_VERIFICATION_NOT_SUPPLIED'))) {
    actions.add('Attach record envelope verification before making this activation plan tamper-evidence ready.')
  }
  if (findings.some((finding) => finding.code.includes('PROVIDER_NETWORK_POLICY_NOT_SUPPLIED'))) {
    actions.add('Attach provider/network default-deny policy before any future provider-specific activation request.')
  }
  actions.add('Integrate this report into enterprise readiness as a later visibility-only source fact.')
  return [...actions]
}

function blockingFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): CiBranchActivationPlanFinding {
  return { severity: 'blocker', code, message, path: pathValue, field }
}

function gapFinding(code: string, message: string, pathValue?: string, field?: string): CiBranchActivationPlanFinding {
  return { severity: 'gap', code, message, path: pathValue, field }
}

function satisfiedFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): CiBranchActivationPlanFinding {
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
    if (fieldNames.includes(key) && entry === true) {
      hits.push({ path: nextPath.join('.'), field: key })
    }
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
    if (fieldNames.includes(key) && hasValue(entry)) {
      hits.push({ path: nextPath.join('.'), field: key })
    }
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
    normalized.endsWith('ci-branch-policy-validation.json') ||
    normalized.endsWith('ci-branch-governance-readiness.json') ||
    normalized.endsWith('provider-network-policy-report.json') ||
    normalized.endsWith('rbac-policy-validation.json') ||
    normalized.endsWith('signing-readiness.json') ||
    normalized.endsWith('provenance-verification-readiness.json') ||
    normalized.endsWith('record-envelope-verification.json') ||
    normalized.endsWith('release-surface-validation.json')
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function booleanValue(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function arrayLength(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}
