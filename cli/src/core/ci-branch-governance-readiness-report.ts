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

const REPORT_ROLE = 'devview-ci-branch-governance-readiness-report'
const REPORTED_STATUS = 'devview-ci-branch-governance-readiness-reported'
const BLOCKED_STATUS = 'devview-ci-branch-governance-readiness-blocked'
const SCOPE_CI_READINESS_ROLE = 'devview-scope-ci-enforcement-readiness-preview'
const SCOPE_CI_READINESS_STATUSES = [
  'devview-scope-ci-enforcement-readiness-ready',
  'devview-scope-ci-enforcement-readiness-blocked',
]
const SCOPE_CI_RECORD_ROLE = 'devview-scope-ci-enforcement-record'
const SCOPE_CI_RECORD_STATUS = 'devview-scope-ci-enforcement-recorded'
const SCOPE_CI_RECORD_SAFE_STATE = 'scope-ci-enforcement-recorded-no-external-ci-mutation'
const PROVIDER_NETWORK_POLICY_ROLE = 'devview-provider-network-default-deny-policy-report'
const PROVIDER_NETWORK_POLICY_STATUS = 'devview-provider-network-default-deny-policy-recorded'
const RBAC_POLICY_VALIDATION_ROLE = 'devview-rbac-policy-validation-report'
const RBAC_POLICY_VALIDATION_STATUS = 'devview-rbac-policy-validation-passed'
const SIGNING_READINESS_ROLE = 'devview-signing-readiness-report'
const SIGNING_READINESS_STATUS = 'devview-signing-readiness-reported'
const PROVENANCE_VERIFICATION_READINESS_ROLE = 'devview-provenance-verification-readiness-report'
const PROVENANCE_VERIFICATION_READINESS_STATUS = 'devview-provenance-verification-readiness-reported'
const RELEASE_SURFACE_ROLE = 'devview-release-surface-validation-report'
const RELEASE_SURFACE_STATUSES = [
  'devview-release-surface-validation-passed',
  'devview-release-surface-validation-failed',
]

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

const unsupportedReleaseGovernanceFields = [
  'packagePublished',
  'publishingPerformed',
  'packageArtifactGeneratedByDevView',
  'packageArtifactGenerated',
  'packageTarballGenerated',
  'packageSigned',
  'packageSigningPresent',
  'packageSignaturePresent',
  'packageSignatureVerified',
  'sbomGeneratedByDevView',
  'sbomGenerated',
  'sbomAttested',
  'provenanceAttestationGeneratedByDevView',
  'provenanceAttestationGenerated',
  'provenanceAttestationVerified',
  'provenanceAttestationPresent',
  'provenanceAttested',
  'releaseProvenanceAttested',
  'slsaProvenanceVerified',
  'realSlsaVerificationPerformed',
  'realInTotoVerificationPerformed',
  'inTotoStatementVerified',
  'cryptographicSigningImplemented',
  'cryptographicSignaturePresent',
  'cryptographicSignatureVerified',
  'keyGenerated',
  'privateKeyStored',
  'keyManagementImplemented',
  'keyRegistryCreated',
  'trustRootCreated',
  'rbacEnforced',
  'permissionVerified',
  'rbacPermissionVerified',
]

export interface CiBranchGovernanceReadinessOptions {
  scopeCiEnforcementReadiness?: string
  scopeCiEnforcementRecord?: string
  providerNetworkPolicyReport?: string
  rbacPolicyValidation?: string
  signingReadiness?: string
  provenanceVerificationReadiness?: string
  releaseSurfaceValidation?: string
  workflow?: string
  output?: string
  markdown?: string
}

export interface CiBranchGovernanceFinding {
  severity: 'blocker' | 'gap' | 'advisory' | 'satisfied'
  code: string
  message: string
  path?: string
  field?: string
}

type SourceKind =
  | 'scope-ci-enforcement-readiness'
  | 'scope-ci-enforcement-record'
  | 'provider-network-policy-report'
  | 'rbac-policy-validation'
  | 'signing-readiness'
  | 'provenance-verification-readiness'
  | 'release-surface-validation'

interface LoadedSource {
  requestedPath: string
  resolvedPath: string
  relativePath: string
  sourceKind: SourceKind
  record: JsonRecord | null
  readError: string | null
}

interface WorkflowSummary {
  requestedPath: string
  path: string
  fileName: string
  sha256: string | null
  byteLength: number | null
  workflowName: string | null
  jobCount: number
  jobs: Array<{ jobId: string; jobName: string | null; candidateRequiredCheckName: string }>
  candidateRequiredChecks: string[]
  limitations: string[]
  readError: string | null
}

interface SourceSummary {
  supplied: boolean
  path: string | null
  artifactRole: string | null
  status: string | null
}

export interface CiBranchGovernanceReadinessReport extends JsonRecord {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof REPORTED_STATUS | typeof BLOCKED_STATUS
  readinessScope: 'ci-branch-governance-readiness-report-only'
  sourceFactsOnly: true
  reportOnly: true
  ciBranchGovernanceReadinessStatus:
    | 'not-ready-policy-and-external-governance-missing'
    | 'report-only-readiness-recorded-not-enforced'
    | 'blocked'
  sourceScopeCiEnforcementReadiness: SourceSummary & {
    scopeCiEnforcementReadinessStatus: string | null
    scopeEnforcementAllowed: boolean | null
    ciEnforcementAllowed: boolean | null
    scopeEnforced: boolean | null
    ciEnforcementEnabled: boolean | null
    requiredChecksConfigured: boolean | null
    branchProtectionChanged: boolean | null
  }
  sourceScopeCiEnforcementRecord: SourceSummary & {
    scopeCiEnforcementState: string | null
    internalScopeEnforced: boolean | null
    internalCiEnforcementEnabled: boolean | null
    externalCiMutated: boolean | null
    requiredChecksConfigured: boolean | null
    branchProtectionMutated: boolean | null
    requiredChecksMutated: boolean | null
    hooksActivated: boolean | null
  }
  sourceProviderNetworkPolicy: SourceSummary & {
    defaultProviderPolicy: string | null
    defaultNetworkPolicy: string | null
    explicitAllowSupported: boolean | null
    providerAllowlistCount: number | null
    networkAllowlistCount: number | null
  }
  sourceRbacPolicyValidation: SourceSummary & {
    rbacPolicyValidationStatus: string | null
    defaultDenyConfigured: boolean | null
    actorCount: number | null
    roleAssignmentCount: number | null
    permissionGrantCount: number | null
    automationRestrictionDeclared: boolean | null
    extensionAuthorRestrictionDeclared: boolean | null
  }
  sourceSigningReadiness: SourceSummary & {
    signingReadinessStatus: string | null
    keyRegistryPresent: boolean | null
    trustRootPresent: boolean | null
    privateKeyStoragePresent: boolean | null
    signaturePolicyStatus: string | null
  }
  sourceProvenanceVerificationReadiness: SourceSummary & {
    provenanceVerificationReadinessStatus: string | null
    realSlsaVerificationPerformed: boolean | null
    realInTotoVerificationPerformed: boolean | null
    cryptographicSignatureVerified: boolean | null
    providerNetworkDefaultDenyRecorded: boolean | null
  }
  sourceReleaseSurfaceValidation: SourceSummary & {
    packageName: string | null
    packageVersion: string | null
    dryRun: boolean | null
    packageFileCount: number | null
    forbiddenFindingCount: number | null
  }
  workflowInventory: {
    sourceCount: number
    workflows: WorkflowSummary[]
    candidateRequiredChecks: string[]
    limitations: string[]
  }
  requiredChecksGovernanceReadiness: JsonRecord
  branchProtectionGovernanceReadiness: JsonRecord
  ciProviderGovernanceReadiness: JsonRecord
  scopeCiLifecycleBoundary: JsonRecord
  rbacPrerequisiteReadiness: JsonRecord
  signingAndProvenancePrerequisiteReadiness: JsonRecord
  governanceFindings: CiBranchGovernanceFinding[]
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

export class CiBranchGovernanceReadinessReportValidationError extends Error {
  readonly report: CiBranchGovernanceReadinessReport

  constructor(report: CiBranchGovernanceReadinessReport) {
    super('CI/branch governance readiness reporting is blocked.')
    this.report = report
  }
}

export async function reportCiBranchGovernanceReadiness(
  root: string,
  options: CiBranchGovernanceReadinessOptions,
): Promise<CiBranchGovernanceReadinessReport> {
  validateRequiredOptions(options)
  const normalizedOptions = normalizeSourceOptions(options)
  const sourcePaths = [
    normalizedOptions.scopeCiEnforcementReadiness
      ? resolveRepoPath(root, normalizedOptions.scopeCiEnforcementReadiness)
      : null,
    normalizedOptions.scopeCiEnforcementRecord
      ? resolveRepoPath(root, normalizedOptions.scopeCiEnforcementRecord)
      : null,
    normalizedOptions.providerNetworkPolicyReport
      ? resolveRepoPath(root, normalizedOptions.providerNetworkPolicyReport)
      : null,
    normalizedOptions.rbacPolicyValidation ? resolveRepoPath(root, normalizedOptions.rbacPolicyValidation) : null,
    normalizedOptions.signingReadiness ? resolveRepoPath(root, normalizedOptions.signingReadiness) : null,
    normalizedOptions.provenanceVerificationReadiness
      ? resolveRepoPath(root, normalizedOptions.provenanceVerificationReadiness)
      : null,
    normalizedOptions.releaseSurfaceValidation
      ? resolveRepoPath(root, normalizedOptions.releaseSurfaceValidation)
      : null,
    ...normalizedOptions.workflow.map((entry) => resolveRepoPath(root, entry)),
  ].filter((entry): entry is string => Boolean(entry))
  await assertOutputAuthority(root, sourcePaths, options)

  const scopeCiReadiness = normalizedOptions.scopeCiEnforcementReadiness
    ? await loadSource(root, normalizedOptions.scopeCiEnforcementReadiness, 'scope-ci-enforcement-readiness')
    : null
  const scopeCiRecord = normalizedOptions.scopeCiEnforcementRecord
    ? await loadSource(root, normalizedOptions.scopeCiEnforcementRecord, 'scope-ci-enforcement-record')
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
  const provenanceVerificationReadiness = normalizedOptions.provenanceVerificationReadiness
    ? await loadSource(root, normalizedOptions.provenanceVerificationReadiness, 'provenance-verification-readiness')
    : null
  const releaseSurfaceValidation = normalizedOptions.releaseSurfaceValidation
    ? await loadSource(root, normalizedOptions.releaseSurfaceValidation, 'release-surface-validation')
    : null
  const workflows = await Promise.all(normalizedOptions.workflow.map((entry) => loadWorkflow(root, entry)))

  const blockingFindings = validateInputs(
    scopeCiReadiness,
    scopeCiRecord,
    providerNetworkPolicy,
    rbacPolicyValidation,
    signingReadiness,
    provenanceVerificationReadiness,
    releaseSurfaceValidation,
    workflows,
  )
  if (blockingFindings.length > 0) {
    throw new CiBranchGovernanceReadinessReportValidationError(
      buildReport(
        scopeCiReadiness,
        scopeCiRecord,
        providerNetworkPolicy,
        rbacPolicyValidation,
        signingReadiness,
        provenanceVerificationReadiness,
        releaseSurfaceValidation,
        workflows,
        blockingFindings,
        true,
      ),
    )
  }

  const report = buildReport(
    scopeCiReadiness,
    scopeCiRecord,
    providerNetworkPolicy,
    rbacPolicyValidation,
    signingReadiness,
    provenanceVerificationReadiness,
    releaseSurfaceValidation,
    workflows,
    buildFindings(
      scopeCiReadiness,
      scopeCiRecord,
      providerNetworkPolicy,
      rbacPolicyValidation,
      signingReadiness,
      provenanceVerificationReadiness,
      releaseSurfaceValidation,
      workflows,
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
  scopeCiReadiness: LoadedSource | null,
  scopeCiRecord: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  rbacPolicyValidation: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
  releaseSurfaceValidation: LoadedSource | null,
  workflows: WorkflowSummary[],
  findings: CiBranchGovernanceFinding[],
  blocked = false,
): CiBranchGovernanceReadinessReport {
  const providerRecord = providerNetworkPolicy?.record ?? null
  const candidateRequiredChecks = uniqueStrings(workflows.flatMap((entry) => entry.candidateRequiredChecks))
  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : REPORTED_STATUS,
    readinessScope: 'ci-branch-governance-readiness-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    ciBranchGovernanceReadinessStatus: blocked
      ? 'blocked'
      : workflows.length > 0 || scopeCiReadiness || scopeCiRecord
        ? 'report-only-readiness-recorded-not-enforced'
        : 'not-ready-policy-and-external-governance-missing',
    sourceScopeCiEnforcementReadiness: scopeCiReadinessSummary(scopeCiReadiness),
    sourceScopeCiEnforcementRecord: scopeCiRecordSummary(scopeCiRecord),
    sourceProviderNetworkPolicy: providerNetworkPolicySummary(providerNetworkPolicy),
    sourceRbacPolicyValidation: rbacPolicyValidationSummary(rbacPolicyValidation),
    sourceSigningReadiness: signingReadinessSummary(signingReadiness),
    sourceProvenanceVerificationReadiness: provenanceVerificationReadinessSummary(provenanceVerificationReadiness),
    sourceReleaseSurfaceValidation: releaseSurfaceValidationSummary(releaseSurfaceValidation),
    workflowInventory: {
      sourceCount: workflows.length,
      workflows,
      candidateRequiredChecks,
      limitations: workflowInventoryLimitations(workflows),
    },
    requiredChecksGovernanceReadiness: {
      requiredChecksPolicyPresent: false,
      requiredChecksConfigured: false,
      requiredChecksMutated: false,
      candidateRequiredCheckCount: candidateRequiredChecks.length,
      candidateRequiredChecks,
      gaps: [
        'Required checks policy artifact is not configured.',
        'External required checks are not configured or mutated by DevView.',
        'Workflow inventory is only a local candidate source fact.',
      ],
    },
    branchProtectionGovernanceReadiness: {
      branchProtectionPolicyPresent: false,
      branchProtectionChanged: false,
      branchProtectionMutated: false,
      requiredActorRoles: ['maintainer', 'security-admin', 'auditor'],
      gaps: [
        'Branch protection policy artifact is not configured.',
        'No branch protection provider/API mutation is performed.',
        'Security-admin actor identity and approval policy remain future-only.',
      ],
    },
    ciProviderGovernanceReadiness: {
      providerNetworkDefaultDenyLinked: Boolean(providerNetworkPolicy),
      defaultProviderPolicy: stringValue(providerRecord?.defaultProviderPolicy),
      defaultNetworkPolicy: stringValue(providerRecord?.defaultNetworkPolicy),
      providerInvoked: false,
      networkCallMade: false,
      apiCallMade: false,
      explicitAllowSupported: false,
      gaps: ciProviderGaps(providerNetworkPolicy),
    },
    scopeCiLifecycleBoundary: {
      scopeCiReadinessSupplied: Boolean(scopeCiReadiness),
      scopeCiRecordSupplied: Boolean(scopeCiRecord),
      internalScopeLifecycleRecorded: scopeCiRecord?.record?.scopeEnforced === true,
      internalCiLifecycleRecorded: scopeCiRecord?.record?.ciEnforcementEnabled === true,
      externalCiMutation: false,
      requiredChecksConfigured: false,
      branchProtectionMutated: false,
      hooksActivated: false,
      boundary: 'internal-devview-scope-ci-lifecycle-only-no-external-ci-activation',
      gaps: scopeCiBoundaryGaps(scopeCiReadiness, scopeCiRecord),
    },
    rbacPrerequisiteReadiness: {
      policyValidationLinked: Boolean(rbacPolicyValidation),
      futureRequiredRoles: ['maintainer', 'security-admin', 'auditor', 'automation'],
      rbacEnforced: false,
      permissionVerified: false,
      gaps: rbacGaps(rbacPolicyValidation),
    },
    signingAndProvenancePrerequisiteReadiness: {
      signingReadinessLinked: Boolean(signingReadiness),
      provenanceVerificationReadinessLinked: Boolean(provenanceVerificationReadiness),
      cryptographicSignatureVerified: false,
      realSlsaVerificationPerformed: false,
      realInTotoVerificationPerformed: false,
      gaps: signingAndProvenanceGaps(signingReadiness, provenanceVerificationReadiness),
    },
    governanceFindings: findings,
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

function validateInputs(
  scopeCiReadiness: LoadedSource | null,
  scopeCiRecord: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  rbacPolicyValidation: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
  releaseSurfaceValidation: LoadedSource | null,
  workflows: WorkflowSummary[],
): CiBranchGovernanceFinding[] {
  const findings: CiBranchGovernanceFinding[] = []
  const sources = [
    scopeCiReadiness,
    scopeCiRecord,
    providerNetworkPolicy,
    rbacPolicyValidation,
    signingReadiness,
    provenanceVerificationReadiness,
    releaseSurfaceValidation,
  ].filter((entry): entry is LoadedSource => Boolean(entry))

  for (const source of sources) {
    if (source.readError) {
      findings.push(blockingFinding('CI_BRANCH_GOVERNANCE_SOURCE_READ_FAILED', source.readError, source.relativePath))
      continue
    }
    if (!source.record) {
      findings.push(
        blockingFinding(
          'CI_BRANCH_GOVERNANCE_SOURCE_NOT_JSON_OBJECT',
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

  for (const workflow of workflows) {
    if (workflow.readError) {
      findings.push(blockingFinding('CI_BRANCH_GOVERNANCE_WORKFLOW_READ_FAILED', workflow.readError, workflow.path))
    }
  }
  return findings
}

function validateRoleStatus(source: LoadedSource, record: JsonRecord, findings: CiBranchGovernanceFinding[]): void {
  if (
    source.sourceKind === 'scope-ci-enforcement-readiness' &&
    (record.artifactRole !== SCOPE_CI_READINESS_ROLE ||
      !SCOPE_CI_READINESS_STATUSES.includes(stringValue(record.status) ?? ''))
  ) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_GOVERNANCE_SCOPE_CI_READINESS_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${SCOPE_CI_READINESS_ROLE} with a known readiness status.`,
        source.relativePath,
      ),
    )
  } else if (
    source.sourceKind === 'scope-ci-enforcement-record' &&
    (record.artifactRole !== SCOPE_CI_RECORD_ROLE || record.status !== SCOPE_CI_RECORD_STATUS)
  ) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_GOVERNANCE_SCOPE_CI_RECORD_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${SCOPE_CI_RECORD_ROLE} with recorded status.`,
        source.relativePath,
      ),
    )
  } else if (
    source.sourceKind === 'provider-network-policy-report' &&
    (record.artifactRole !== PROVIDER_NETWORK_POLICY_ROLE || record.status !== PROVIDER_NETWORK_POLICY_STATUS)
  ) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_GOVERNANCE_PROVIDER_NETWORK_POLICY_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${PROVIDER_NETWORK_POLICY_ROLE} with recorded status.`,
        source.relativePath,
      ),
    )
  } else if (
    source.sourceKind === 'rbac-policy-validation' &&
    (record.artifactRole !== RBAC_POLICY_VALIDATION_ROLE || record.status !== RBAC_POLICY_VALIDATION_STATUS)
  ) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_GOVERNANCE_RBAC_POLICY_VALIDATION_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${RBAC_POLICY_VALIDATION_ROLE} with passed status.`,
        source.relativePath,
      ),
    )
  } else if (
    source.sourceKind === 'signing-readiness' &&
    (record.artifactRole !== SIGNING_READINESS_ROLE || record.status !== SIGNING_READINESS_STATUS)
  ) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_GOVERNANCE_SIGNING_READINESS_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${SIGNING_READINESS_ROLE} with reported status.`,
        source.relativePath,
      ),
    )
  } else if (
    source.sourceKind === 'provenance-verification-readiness' &&
    (record.artifactRole !== PROVENANCE_VERIFICATION_READINESS_ROLE ||
      record.status !== PROVENANCE_VERIFICATION_READINESS_STATUS)
  ) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_GOVERNANCE_PROVENANCE_VERIFICATION_READINESS_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${PROVENANCE_VERIFICATION_READINESS_ROLE} with reported status.`,
        source.relativePath,
      ),
    )
  } else if (
    source.sourceKind === 'release-surface-validation' &&
    (record.artifactRole !== RELEASE_SURFACE_ROLE ||
      !RELEASE_SURFACE_STATUSES.includes(stringValue(record.status) ?? ''))
  ) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_GOVERNANCE_RELEASE_SURFACE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${RELEASE_SURFACE_ROLE} with passed or failed status.`,
        source.relativePath,
      ),
    )
  }
}

function validateSourceSpecificClaims(
  source: LoadedSource,
  record: JsonRecord,
  findings: CiBranchGovernanceFinding[],
): void {
  if (
    source.sourceKind === 'scope-ci-enforcement-record' &&
    record.scopeCiEnforcementState !== SCOPE_CI_RECORD_SAFE_STATE
  ) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_GOVERNANCE_SCOPE_CI_RECORD_STATE_UNSUPPORTED',
        `${source.relativePath} must preserve no-external-ci-mutation state.`,
        source.relativePath,
        'scopeCiEnforcementState',
      ),
    )
  }
  if (source.sourceKind === 'provider-network-policy-report') {
    if (record.defaultProviderPolicy !== 'deny' || record.defaultNetworkPolicy !== 'deny') {
      findings.push(
        blockingFinding(
          'CI_BRANCH_GOVERNANCE_PROVIDER_NETWORK_POLICY_NOT_DENY',
          `${source.relativePath} must keep default provider and network policies as deny.`,
          source.relativePath,
          'defaultProviderPolicy',
        ),
      )
    }
    if ((arrayLength(record.providerAllowlist) ?? 0) > 0 || (arrayLength(record.networkAllowlist) ?? 0) > 0) {
      findings.push(
        blockingFinding(
          'CI_BRANCH_GOVERNANCE_PROVIDER_NETWORK_ALLOWLIST_UNSUPPORTED',
          `${source.relativePath} must keep provider/network allowlists empty for v1 CI governance readiness.`,
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
  findings: CiBranchGovernanceFinding[],
): void {
  const allowedTrueFields =
    source.sourceKind === 'scope-ci-enforcement-record' &&
    record.artifactRole === SCOPE_CI_RECORD_ROLE &&
    record.status === SCOPE_CI_RECORD_STATUS &&
    record.scopeCiEnforcementState === SCOPE_CI_RECORD_SAFE_STATE
      ? new Set(['scopeEnforced', 'ciEnforcementEnabled'])
      : new Set<string>()
  for (const hit of collectTrueFieldHits(record, unsafeAuthorityFields, [], allowedTrueFields)) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_GOVERNANCE_UNSAFE_SOURCE_AUTHORITY_FLAG',
        `${source.relativePath} claims unsafe authority field ${hit.field}: true.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
  for (const hit of collectTrueFieldHits(record, unsupportedReleaseGovernanceFields)) {
    findings.push(
      blockingFinding(
        'CI_BRANCH_GOVERNANCE_UNSUPPORTED_AUTHORITY_CLAIM',
        `${source.relativePath} claims release/signing/RBAC authority field ${hit.field}: true.`,
        source.relativePath,
        hit.path,
      ),
    )
  }
}

function buildFindings(
  scopeCiReadiness: LoadedSource | null,
  scopeCiRecord: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  rbacPolicyValidation: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
  releaseSurfaceValidation: LoadedSource | null,
  workflows: WorkflowSummary[],
): CiBranchGovernanceFinding[] {
  const findings: CiBranchGovernanceFinding[] = []
  findings.push(
    scopeCiReadiness
      ? satisfiedFinding(
          'CI_BRANCH_GOVERNANCE_SCOPE_CI_READINESS_LINKED',
          'Scope/CI enforcement readiness is linked as a source fact.',
          scopeCiReadiness.relativePath,
        )
      : gapFinding(
          'CI_BRANCH_GOVERNANCE_SCOPE_CI_READINESS_NOT_SUPPLIED',
          'Scope/CI enforcement readiness was not supplied.',
        ),
  )
  findings.push(
    scopeCiRecord
      ? satisfiedFinding(
          'CI_BRANCH_GOVERNANCE_SCOPE_CI_RECORD_LINKED',
          'Internal Scope/CI lifecycle record is linked without external CI mutation.',
          scopeCiRecord.relativePath,
        )
      : advisoryFinding(
          'CI_BRANCH_GOVERNANCE_SCOPE_CI_RECORD_NOT_SUPPLIED',
          'Scope/CI enforcement record was not supplied.',
        ),
  )
  findings.push(
    providerNetworkPolicy
      ? satisfiedFinding(
          'CI_BRANCH_GOVERNANCE_PROVIDER_NETWORK_POLICY_LINKED',
          'Provider/network default-deny policy is linked.',
          providerNetworkPolicy.relativePath,
        )
      : gapFinding(
          'CI_BRANCH_GOVERNANCE_PROVIDER_NETWORK_POLICY_NOT_SUPPLIED',
          'Provider/network default-deny policy was not supplied.',
        ),
  )
  findings.push(
    rbacPolicyValidation
      ? satisfiedFinding(
          'CI_BRANCH_GOVERNANCE_RBAC_POLICY_VALIDATION_LINKED',
          'RBAC policy validation is linked.',
          rbacPolicyValidation.relativePath,
        )
      : gapFinding(
          'CI_BRANCH_GOVERNANCE_RBAC_POLICY_VALIDATION_NOT_SUPPLIED',
          'RBAC policy validation was not supplied.',
        ),
  )
  findings.push(
    signingReadiness
      ? satisfiedFinding(
          'CI_BRANCH_GOVERNANCE_SIGNING_READINESS_LINKED',
          'Signing/key governance readiness is linked.',
          signingReadiness.relativePath,
        )
      : gapFinding('CI_BRANCH_GOVERNANCE_SIGNING_READINESS_NOT_SUPPLIED', 'Signing readiness was not supplied.'),
  )
  findings.push(
    provenanceVerificationReadiness
      ? satisfiedFinding(
          'CI_BRANCH_GOVERNANCE_PROVENANCE_VERIFICATION_READINESS_LINKED',
          'Provenance verification readiness is linked.',
          provenanceVerificationReadiness.relativePath,
        )
      : advisoryFinding(
          'CI_BRANCH_GOVERNANCE_PROVENANCE_VERIFICATION_READINESS_NOT_SUPPLIED',
          'Provenance verification readiness was not supplied.',
        ),
  )
  findings.push(
    releaseSurfaceValidation
      ? releaseSurfaceStatusFinding(releaseSurfaceValidation)
      : advisoryFinding(
          'CI_BRANCH_GOVERNANCE_RELEASE_SURFACE_VALIDATION_NOT_SUPPLIED',
          'Release surface validation was not supplied.',
        ),
  )
  findings.push(
    workflows.length > 0
      ? satisfiedFinding(
          'CI_BRANCH_GOVERNANCE_WORKFLOW_INVENTORY_RECORDED',
          `Workflow inventory recorded ${workflows.length} explicit local workflow source fact(s).`,
        )
      : advisoryFinding(
          'CI_BRANCH_GOVERNANCE_WORKFLOW_NOT_SUPPLIED',
          'No explicit workflow files were supplied for inventory.',
        ),
  )
  findings.push(
    gapFinding(
      'CI_BRANCH_GOVERNANCE_EXTERNAL_GOVERNANCE_NOT_READY',
      'Required checks policy, branch protection policy, CI provider governance, RBAC enforcement, and external activation remain absent.',
    ),
  )
  return findings
}

function releaseSurfaceStatusFinding(source: LoadedSource): CiBranchGovernanceFinding {
  if (source.record?.status === 'devview-release-surface-validation-passed') {
    return satisfiedFinding(
      'CI_BRANCH_GOVERNANCE_RELEASE_SURFACE_VALIDATION_PASSED',
      'Release surface validation passed and is linked.',
      source.relativePath,
    )
  }
  return gapFinding(
    'CI_BRANCH_GOVERNANCE_RELEASE_SURFACE_VALIDATION_FAILED',
    'Release surface validation is linked but failed; treat as a CI/release governance gap.',
    source.relativePath,
  )
}

async function loadSource(root: string, requestedPath: string, sourceKind: SourceKind): Promise<LoadedSource> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  const base = {
    requestedPath,
    resolvedPath,
    relativePath: relativePath(root, resolvedPath),
    sourceKind,
  }
  try {
    const text = await readFile(resolvedPath, 'utf8')
    try {
      const parsed = JSON.parse(text.replace(/^\uFEFF/, '')) as unknown
      return {
        ...base,
        record: isJsonRecord(parsed) ? parsed : null,
        readError: isJsonRecord(parsed) ? null : 'JSON content is not an object.',
      }
    } catch (error) {
      return {
        ...base,
        record: null,
        readError: error instanceof Error ? error.message : String(error),
      }
    }
  } catch (error) {
    return {
      ...base,
      record: null,
      readError: error instanceof Error ? error.message : String(error),
    }
  }
}

async function loadWorkflow(root: string, requestedPath: string): Promise<WorkflowSummary> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  const base = {
    requestedPath,
    path: relativePath(root, resolvedPath),
    fileName: path.basename(resolvedPath),
  }
  try {
    const buffer = await readFile(resolvedPath)
    const text = buffer.toString('utf8')
    const extracted = extractWorkflowFacts(text)
    return {
      ...base,
      sha256: createHash('sha256').update(buffer).digest('hex'),
      byteLength: buffer.byteLength,
      workflowName: extracted.workflowName,
      jobCount: extracted.jobs.length,
      jobs: extracted.jobs,
      candidateRequiredChecks: uniqueStrings(extracted.jobs.map((entry) => entry.candidateRequiredCheckName)),
      limitations: [
        'conservative-yaml-text-extraction-no-semantic-validation',
        'workflow-inventory-does-not-prove-required-checks-or-branch-protection',
      ],
      readError: null,
    }
  } catch (error) {
    return {
      ...base,
      sha256: null,
      byteLength: null,
      workflowName: null,
      jobCount: 0,
      jobs: [],
      candidateRequiredChecks: [],
      limitations: ['workflow-file-could-not-be-read'],
      readError: error instanceof Error ? error.message : String(error),
    }
  }
}

function extractWorkflowFacts(text: string): {
  workflowName: string | null
  jobs: Array<{ jobId: string; jobName: string | null; candidateRequiredCheckName: string }>
} {
  const lines = text.split(/\r?\n/)
  let workflowName: string | null = null
  let inJobs = false
  let currentJob: { jobId: string; jobName: string | null; candidateRequiredCheckName: string } | null = null
  const jobs: Array<{ jobId: string; jobName: string | null; candidateRequiredCheckName: string }> = []

  for (const line of lines) {
    if (!workflowName) {
      const workflowNameMatch = line.match(/^name:\s*(.+?)\s*$/)
      if (workflowNameMatch) workflowName = cleanYamlScalar(workflowNameMatch[1])
    }

    if (/^jobs:\s*$/.test(line)) {
      inJobs = true
      continue
    }
    if (!inJobs) continue
    if (/^\S/.test(line) && !/^jobs:\s*$/.test(line)) {
      inJobs = false
      currentJob = null
      continue
    }

    const jobMatch = line.match(/^  ([A-Za-z0-9_-]+):\s*$/)
    if (jobMatch) {
      currentJob = {
        jobId: jobMatch[1],
        jobName: null,
        candidateRequiredCheckName: jobMatch[1],
      }
      jobs.push(currentJob)
      continue
    }

    const nameMatch = line.match(/^    name:\s*(.+?)\s*$/)
    if (currentJob && nameMatch) {
      currentJob.jobName = cleanYamlScalar(nameMatch[1])
      currentJob.candidateRequiredCheckName = currentJob.jobName || currentJob.jobId
    }
  }

  return { workflowName, jobs }
}

function scopeCiReadinessSummary(
  source: LoadedSource | null,
): CiBranchGovernanceReadinessReport['sourceScopeCiEnforcementReadiness'] {
  if (!source) return emptyScopeCiReadinessSummary()
  const record = source.record ?? {}
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    scopeCiEnforcementReadinessStatus: stringValue(record.scopeCiEnforcementReadinessStatus),
    scopeEnforcementAllowed: booleanOrNull(record.scopeEnforcementAllowed),
    ciEnforcementAllowed: booleanOrNull(record.ciEnforcementAllowed),
    scopeEnforced: booleanOrNull(record.scopeEnforced),
    ciEnforcementEnabled: booleanOrNull(record.ciEnforcementEnabled),
    requiredChecksConfigured: booleanOrNull(record.requiredChecksConfigured),
    branchProtectionChanged: booleanOrNull(record.branchProtectionChanged),
  }
}

function emptyScopeCiReadinessSummary(): CiBranchGovernanceReadinessReport['sourceScopeCiEnforcementReadiness'] {
  return {
    supplied: false,
    path: null,
    artifactRole: null,
    status: null,
    scopeCiEnforcementReadinessStatus: null,
    scopeEnforcementAllowed: null,
    ciEnforcementAllowed: null,
    scopeEnforced: null,
    ciEnforcementEnabled: null,
    requiredChecksConfigured: null,
    branchProtectionChanged: null,
  }
}

function scopeCiRecordSummary(
  source: LoadedSource | null,
): CiBranchGovernanceReadinessReport['sourceScopeCiEnforcementRecord'] {
  if (!source) return emptyScopeCiRecordSummary()
  const record = source.record ?? {}
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    scopeCiEnforcementState: stringValue(record.scopeCiEnforcementState),
    internalScopeEnforced: booleanOrNull(record.scopeEnforced),
    internalCiEnforcementEnabled: booleanOrNull(record.ciEnforcementEnabled),
    externalCiMutated: booleanOrNull(record.externalCiMutated),
    requiredChecksConfigured: booleanOrNull(record.requiredChecksConfigured),
    branchProtectionMutated: booleanOrNull(record.branchProtectionMutated),
    requiredChecksMutated: booleanOrNull(record.requiredChecksMutated),
    hooksActivated: booleanOrNull(record.hooksActivated),
  }
}

function emptyScopeCiRecordSummary(): CiBranchGovernanceReadinessReport['sourceScopeCiEnforcementRecord'] {
  return {
    supplied: false,
    path: null,
    artifactRole: null,
    status: null,
    scopeCiEnforcementState: null,
    internalScopeEnforced: null,
    internalCiEnforcementEnabled: null,
    externalCiMutated: null,
    requiredChecksConfigured: null,
    branchProtectionMutated: null,
    requiredChecksMutated: null,
    hooksActivated: null,
  }
}

function providerNetworkPolicySummary(
  source: LoadedSource | null,
): CiBranchGovernanceReadinessReport['sourceProviderNetworkPolicy'] {
  if (!source) {
    return {
      supplied: false,
      path: null,
      artifactRole: null,
      status: null,
      defaultProviderPolicy: null,
      defaultNetworkPolicy: null,
      explicitAllowSupported: null,
      providerAllowlistCount: null,
      networkAllowlistCount: null,
    }
  }
  const record = source.record ?? {}
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    defaultProviderPolicy: stringValue(record.defaultProviderPolicy),
    defaultNetworkPolicy: stringValue(record.defaultNetworkPolicy),
    explicitAllowSupported: booleanOrNull(record.explicitAllowSupported),
    providerAllowlistCount: arrayLength(record.providerAllowlist),
    networkAllowlistCount: arrayLength(record.networkAllowlist),
  }
}

function rbacPolicyValidationSummary(
  source: LoadedSource | null,
): CiBranchGovernanceReadinessReport['sourceRbacPolicyValidation'] {
  if (!source) {
    return {
      supplied: false,
      path: null,
      artifactRole: null,
      status: null,
      rbacPolicyValidationStatus: null,
      defaultDenyConfigured: null,
      actorCount: null,
      roleAssignmentCount: null,
      permissionGrantCount: null,
      automationRestrictionDeclared: null,
      extensionAuthorRestrictionDeclared: null,
    }
  }
  const record = source.record ?? {}
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    rbacPolicyValidationStatus: stringValue(record.rbacPolicyValidationStatus),
    defaultDenyConfigured: booleanOrNull(asRecord(record.defaultDenyStatus)?.defaultDenyConfigured),
    actorCount: numberValue(asRecord(record.actorSummary)?.actorCount),
    roleAssignmentCount: numberValue(asRecord(record.roleAssignmentSummary)?.assignmentCount),
    permissionGrantCount: numberValue(asRecord(record.permissionGrantSummary)?.grantCount),
    automationRestrictionDeclared: booleanOrNull(
      asRecord(record.automationRestrictionStatus)?.automationRestrictionDeclared,
    ),
    extensionAuthorRestrictionDeclared: booleanOrNull(
      asRecord(record.extensionAuthorRestrictionStatus)?.extensionAuthorRestrictionDeclared,
    ),
  }
}

function signingReadinessSummary(
  source: LoadedSource | null,
): CiBranchGovernanceReadinessReport['sourceSigningReadiness'] {
  if (!source) {
    return {
      supplied: false,
      path: null,
      artifactRole: null,
      status: null,
      signingReadinessStatus: null,
      keyRegistryPresent: null,
      trustRootPresent: null,
      privateKeyStoragePresent: null,
      signaturePolicyStatus: null,
    }
  }
  const record = source.record ?? {}
  const keyGovernance = asRecord(record.keyGovernanceReadiness)
  const signaturePolicy = asRecord(record.signaturePolicyReadiness)
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    signingReadinessStatus: stringValue(record.signingReadinessStatus),
    keyRegistryPresent: booleanOrNull(keyGovernance?.keyRegistryPresent),
    trustRootPresent: booleanOrNull(keyGovernance?.trustRootPresent),
    privateKeyStoragePresent: booleanOrNull(keyGovernance?.privateKeyStoragePresent),
    signaturePolicyStatus: stringValue(signaturePolicy?.status),
  }
}

function provenanceVerificationReadinessSummary(
  source: LoadedSource | null,
): CiBranchGovernanceReadinessReport['sourceProvenanceVerificationReadiness'] {
  if (!source) {
    return {
      supplied: false,
      path: null,
      artifactRole: null,
      status: null,
      provenanceVerificationReadinessStatus: null,
      realSlsaVerificationPerformed: null,
      realInTotoVerificationPerformed: null,
      cryptographicSignatureVerified: null,
      providerNetworkDefaultDenyRecorded: null,
    }
  }
  const record = source.record ?? {}
  const networkIsolation = asRecord(record.networkIsolationReadiness)
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    provenanceVerificationReadinessStatus: stringValue(record.provenanceVerificationReadinessStatus),
    realSlsaVerificationPerformed: booleanOrNull(record.realSlsaVerificationPerformed),
    realInTotoVerificationPerformed: booleanOrNull(record.realInTotoVerificationPerformed),
    cryptographicSignatureVerified: booleanOrNull(record.cryptographicSignatureVerified),
    providerNetworkDefaultDenyRecorded: booleanOrNull(networkIsolation?.providerNetworkDefaultDenyRecorded),
  }
}

function releaseSurfaceValidationSummary(
  source: LoadedSource | null,
): CiBranchGovernanceReadinessReport['sourceReleaseSurfaceValidation'] {
  if (!source) {
    return {
      supplied: false,
      path: null,
      artifactRole: null,
      status: null,
      packageName: null,
      packageVersion: null,
      dryRun: null,
      packageFileCount: null,
      forbiddenFindingCount: null,
    }
  }
  const record = source.record ?? {}
  return {
    supplied: true,
    path: source.relativePath,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    packageName: stringValue(record.packageName),
    packageVersion: stringValue(record.packageVersion),
    dryRun: booleanOrNull(record.dryRun),
    packageFileCount: numberValue(record.packageFileCount),
    forbiddenFindingCount: numberValue(record.forbiddenFindingCount),
  }
}

function workflowInventoryLimitations(workflows: WorkflowSummary[]): string[] {
  if (workflows.length === 0) {
    return ['no-explicit-workflow-files-supplied', 'no-branch-protection-or-required-check-inference']
  }
  return [
    'explicit-local-workflow-files-only',
    'workflow-job-candidates-are-not-required-check-configuration',
    'no-ci-provider-or-branch-protection-state-was-queried',
  ]
}

function ciProviderGaps(providerNetworkPolicy: LoadedSource | null): string[] {
  if (!providerNetworkPolicy) {
    return ['Provider/network default-deny policy source was not supplied.']
  }
  return ['Provider/network default-deny is recorded, but CI provider/API access remains disabled and unsupported.']
}

function scopeCiBoundaryGaps(scopeCiReadiness: LoadedSource | null, scopeCiRecord: LoadedSource | null): string[] {
  const gaps: string[] = []
  if (!scopeCiReadiness) gaps.push('Scope/CI enforcement readiness source was not supplied.')
  if (!scopeCiRecord) gaps.push('Internal Scope/CI enforcement record was not supplied.')
  gaps.push('External required checks, branch protection, hooks, and CI providers remain unconfigured.')
  return gaps
}

function rbacGaps(rbacPolicyValidation: LoadedSource | null): string[] {
  if (!rbacPolicyValidation) return ['RBAC policy validation source was not supplied.']
  return ['RBAC policy validation is present, but RBAC enforcement and permission verification remain disabled.']
}

function signingAndProvenanceGaps(
  signingReadiness: LoadedSource | null,
  provenanceVerificationReadiness: LoadedSource | null,
): string[] {
  const gaps: string[] = []
  if (!signingReadiness) gaps.push('Signing/key governance readiness source was not supplied.')
  if (!provenanceVerificationReadiness) gaps.push('Provenance verification readiness source was not supplied.')
  gaps.push('Real signing, key trust, SLSA/in-toto verification, and CI governance enforcement remain absent.')
  return gaps
}

function downstreamActionPlan(findings: CiBranchGovernanceFinding[]): string[] {
  const actions = new Set<string>()
  if (findings.some((entry) => entry.severity === 'blocker')) {
    actions.add('Fix CI/branch governance source role/status, unsafe authority flags, or workflow read blockers.')
  }
  actions.add('Integrate this CI/branch governance readiness report into enterprise readiness as a source fact.')
  actions.add('Add declarative required-checks and branch-protection policy validation before any external mutation.')
  actions.add('Keep CI provider/API calls, .github mutation, branch protection, hooks, and enterprise gates disabled.')
  return [...actions]
}

function validateRequiredOptions(options: CiBranchGovernanceReadinessOptions): void {
  if (!options.output) {
    throw new Error('security report-ci-branch-governance-readiness requires --output <json>.')
  }
}

function normalizeSourceOptions(options: CiBranchGovernanceReadinessOptions): {
  scopeCiEnforcementReadiness?: string
  scopeCiEnforcementRecord?: string
  providerNetworkPolicyReport?: string
  rbacPolicyValidation?: string
  signingReadiness?: string
  provenanceVerificationReadiness?: string
  releaseSurfaceValidation?: string
  workflow: string[]
} {
  return {
    scopeCiEnforcementReadiness: singleOptionalPath(
      options.scopeCiEnforcementReadiness,
      '--scope-ci-enforcement-readiness',
    ),
    scopeCiEnforcementRecord: singleOptionalPath(options.scopeCiEnforcementRecord, '--scope-ci-enforcement-record'),
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
    releaseSurfaceValidation: singleOptionalPath(options.releaseSurfaceValidation, '--release-surface-validation'),
    workflow: splitPathList(options.workflow),
  }
}

function singleOptionalPath(value: string | undefined, optionName: string): string | undefined {
  const entries = splitPathList(value)
  if (entries.length > 1) {
    throw new Error(`${optionName} accepts one file for security report-ci-branch-governance-readiness v1.`)
  }
  return entries[0]
}

function splitPathList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: Pick<CiBranchGovernanceReadinessOptions, 'output' | 'markdown'>,
): Promise<void> {
  const outputPath = options.output ? resolveRepoPath(root, options.output) : null
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  if (!outputPath) throw new Error('security report-ci-branch-governance-readiness requires --output <json>.')
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('CI/branch governance readiness JSON output and Markdown output must be different paths.')
  }
  const resolvedSources = sourcePaths.map((entry) => path.resolve(entry))
  for (const target of [outputPath, markdownPath].filter((entry): entry is string => Boolean(entry))) {
    const relativeTarget = relativePath(root, target)
    if (resolvedSources.some((source) => source === path.resolve(target))) {
      throw new Error(`CI/branch governance readiness output ${relativeTarget} would overwrite a source input.`)
    }
    if (
      hasDevViewControlDirectory(relativeTarget) ||
      hasCodexControlDirectory(relativeTarget) ||
      hasHiddenControlDirectorySegment(relativeTarget)
    ) {
      throw new Error(`CI/branch governance readiness output ${relativeTarget} is inside a protected control path.`)
    }
    if (looksLikeSourceAuthorityPath(relativeTarget)) {
      throw new Error(`CI/branch governance readiness output ${relativeTarget} looks like a source authority artifact.`)
    }
  }
}

function renderMarkdown(report: CiBranchGovernanceReadinessReport): string {
  return [
    '# DevView CI / Branch Governance Readiness',
    '',
    `- status: ${report.status}`,
    `- readinessStatus: ${report.ciBranchGovernanceReadinessStatus}`,
    `- workflowCount: ${report.workflowInventory.sourceCount}`,
    `- candidateRequiredChecks: ${report.workflowInventory.candidateRequiredChecks.join(', ') || 'none'}`,
    `- scopeCiReadinessSupplied: ${report.sourceScopeCiEnforcementReadiness.supplied}`,
    `- scopeCiRecordSupplied: ${report.sourceScopeCiEnforcementRecord.supplied}`,
    `- providerNetworkDefaultDenyLinked: ${report.ciProviderGovernanceReadiness.providerNetworkDefaultDenyLinked}`,
    '',
    '## Non-Mutation Boundary',
    '- githubMutated: false',
    '- branchProtectionMutated: false',
    '- requiredChecksMutated: false',
    '- externalCiMutated: false',
    '- hooksActivated: false',
    '- providerInvoked: false',
    '- networkCallMade: false',
    '- apiCallMade: false',
    '',
    '## Findings',
    ...report.governanceFindings.map((finding) => `- [${finding.severity}] ${finding.code}: ${finding.message}`),
    '',
  ].join('\n')
}

function blockingFinding(code: string, message: string, pathValue?: string, field?: string): CiBranchGovernanceFinding {
  return { severity: 'blocker', code, message, path: pathValue, field }
}

function gapFinding(code: string, message: string, pathValue?: string, field?: string): CiBranchGovernanceFinding {
  return { severity: 'gap', code, message, path: pathValue, field }
}

function advisoryFinding(code: string, message: string, pathValue?: string, field?: string): CiBranchGovernanceFinding {
  return { severity: 'advisory', code, message, path: pathValue, field }
}

function satisfiedFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): CiBranchGovernanceFinding {
  return { severity: 'satisfied', code, message, path: pathValue, field }
}

function collectTrueFieldHits(
  value: unknown,
  fieldNames: string[],
  pathParts: string[] = [],
  allowedTrueFields = new Set<string>(),
): Array<{ field: string; path: string }> {
  if (!value || typeof value !== 'object') return []
  const hits: Array<{ field: string; path: string }> = []
  for (const [key, entry] of Object.entries(value as JsonRecord)) {
    const nextPath = [...pathParts, key]
    if (fieldNames.includes(key) && entry === true && !allowedTrueFields.has(key)) {
      hits.push({ field: key, path: nextPath.join('.') })
    }
    if (entry && typeof entry === 'object') {
      hits.push(...collectTrueFieldHits(entry, fieldNames, nextPath, allowedTrueFields))
    }
  }
  return hits
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

function arrayLength(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((entry) => entry.length > 0))]
}

function cleanYamlScalar(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '')
}

function looksLikeSourceAuthorityPath(filePath: string): boolean {
  const normalized = filePath.replaceAll('\\', '/').toLowerCase()
  return (
    normalized.includes('source-authority') ||
    normalized.endsWith('scope-ci-enforcement-readiness.json') ||
    normalized.endsWith('scope-ci-enforcement-record.json') ||
    normalized.endsWith('provider-network-policy-report.json') ||
    normalized.endsWith('rbac-policy-validation.json') ||
    normalized.endsWith('signing-readiness.json') ||
    normalized.endsWith('provenance-verification-readiness.json') ||
    normalized.endsWith('release-surface-validation.json') ||
    normalized.endsWith('branch-protection-policy.json') ||
    normalized.endsWith('required-checks-policy.json') ||
    normalized.endsWith('ci-branch-policy.json') ||
    normalized.endsWith('ci.yml') ||
    normalized.endsWith('ci.yaml')
  )
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(root, filePath)
}
