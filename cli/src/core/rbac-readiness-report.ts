import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'

type JsonRecord = Record<string, unknown>

const REPORT_ROLE = 'devview-rbac-readiness-report'
const REPORTED_STATUS = 'devview-rbac-readiness-reported'
const BLOCKED_STATUS = 'devview-rbac-readiness-blocked'
const ENTERPRISE_READINESS_ROLE = 'devview-enterprise-readiness-report'
const ENTERPRISE_READINESS_STATUS = 'devview-enterprise-readiness-report-generated'
const PROVIDER_NETWORK_POLICY_ROLE = 'devview-provider-network-default-deny-policy-report'
const PROVIDER_NETWORK_POLICY_STATUS = 'devview-provider-network-default-deny-policy-recorded'
const BENCHMARK_GOVERNANCE_ROLE = 'devview-benchmark-governance-verification-report'
const BENCHMARK_GOVERNANCE_STATUSES = [
  'devview-benchmark-governance-verified',
  'devview-benchmark-governance-partial',
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

const actorModelSummary = [
  {
    actorType: 'operator',
    description: 'Explicit CLI actor for bounded local commands and future graph-source mutation authorization.',
    currentEvidence: ['guarded apply records already require --operator and --authorization-rationale'],
    defaultAuthority: 'report-only-until-permission-granted',
  },
  {
    actorType: 'reviewer',
    description: 'Human reviewer for evidence, human-decision, and future golden-answer review metadata.',
    currentEvidence: ['evidence and human decision records already require human reviewer identity'],
    defaultAuthority: 'human-decision-source-only',
  },
  {
    actorType: 'maintainer',
    description: 'Project maintainer for future policy configuration and controlled rollout records.',
    currentEvidence: [],
    defaultAuthority: 'future-signed-policy-required',
  },
  {
    actorType: 'auditor',
    description: 'Read-only verifier for benchmark governance, envelope checks, and enterprise readiness review.',
    currentEvidence: ['benchmark governance verification is report-only'],
    defaultAuthority: 'verify-only-no-mutation',
  },
  {
    actorType: 'automation',
    description: 'CI or local deterministic automation that may produce reports but cannot grant authority by itself.',
    currentEvidence: [],
    defaultAuthority: 'report-only-no-approval-authority',
  },
  {
    actorType: 'extension-author',
    description: 'Author of declarative extension manifests and future signed extension metadata.',
    currentEvidence: ['extension manifests are declarative and non-executing'],
    defaultAuthority: 'manifest-source-only-no-execution',
  },
  {
    actorType: 'security-admin',
    description: 'Future enterprise administrator for signed RBAC policy and key governance.',
    currentEvidence: [],
    defaultAuthority: 'future-only',
  },
] as const

const actorIdentityObjectProposal = {
  requiredFields: ['actorId', 'actorType', 'identityProvider', 'roleClaims', 'authorityScope', 'identityAssurance'],
  optionalFields: ['displayName', 'externalSubjectId', 'policyReference', 'verificationEvidence'],
  actorTypes: ['human', 'automation', 'service', 'extension-author'],
  identityProviders: ['explicit-cli-input', 'imported-human-review', 'ci-identity', 'enterprise-idp', 'local-policy'],
  identityAssuranceLevels: ['explicit-cli-input', 'imported-review', 'ci-identity', 'signed-policy'],
  timestampPolicy: 'explicit-input-only-no-generated-timestamps',
} as const

const rolePermissionMatrix = [
  {
    role: 'reporter',
    actorTypes: ['operator', 'automation', 'auditor'],
    permissions: ['report.create', 'enterprise.readiness.report'],
    futureOnlyPermissions: [],
  },
  {
    role: 'evidence-reviewer',
    actorTypes: ['reviewer'],
    permissions: ['evidence.decision.record', 'evidence.accept.record'],
    futureOnlyPermissions: [],
  },
  {
    role: 'runtime-authority-recorder',
    actorTypes: ['operator', 'maintainer'],
    permissions: ['runtime.satisfaction.record', 'equivalence.proof.record'],
    futureOnlyPermissions: ['signed-record-envelope-required-before-enterprise-ready'],
  },
  {
    role: 'scope-ci-recorder',
    actorTypes: ['maintainer', 'operator'],
    permissions: ['scope-ci.enforcement.record'],
    futureOnlyPermissions: ['external-ci.activation.approve'],
  },
  {
    role: 'graph-update-operator',
    actorTypes: ['operator', 'maintainer'],
    permissions: ['graph.boundary.record', 'graph.apply-plan.record', 'graph.apply.authorize', 'graph.apply.execute'],
    futureOnlyPermissions: ['signed-apply-policy-required-before-enterprise-ready'],
  },
  {
    role: 'benchmark-governor',
    actorTypes: ['reviewer', 'auditor', 'maintainer'],
    permissions: ['benchmark.golden.review', 'benchmark.suite.lock', 'benchmark.governance.verify'],
    futureOnlyPermissions: [],
  },
  {
    role: 'provider-network-policy-maintainer',
    actorTypes: ['maintainer', 'security-admin'],
    permissions: ['provider-network.policy.record'],
    futureOnlyPermissions: ['provider-network.policy.allow'],
  },
  {
    role: 'extension-author',
    actorTypes: ['extension-author', 'maintainer'],
    permissions: ['extension.manifest.publish'],
    futureOnlyPermissions: ['extension.execution.approve'],
  },
  {
    role: 'auditor',
    actorTypes: ['auditor', 'security-admin'],
    permissions: ['audit.verify'],
    futureOnlyPermissions: ['signed-record-chain.verify'],
  },
] as const

const artifactPermissionMapping = [
  ['devview-evidence-decision-record', 'evidence.decision.record', 'authority-input'],
  ['devview-accepted-evidence-record', 'evidence.accept.record', 'authority-record'],
  ['devview-runtime-evidence-satisfaction-record', 'runtime.satisfaction.record', 'authority-record'],
  ['devview-equivalence-proof-record', 'equivalence.proof.record', 'authority-record'],
  ['devview-scope-ci-enforcement-record', 'scope-ci.enforcement.record', 'authority-record'],
  ['devview-guarded-graph-update-boundary-record', 'graph.boundary.record', 'authority-boundary'],
  ['devview-guarded-graph-update-apply-plan', 'graph.apply-plan.record', 'non-mutating-plan'],
  ['devview-guarded-graph-update-apply-report', 'graph.apply.execute', 'mutating-authority-record'],
  ['devview-extension-readiness-report', 'report.create', 'report-only-source-fact'],
  ['devview-extension-profile-catalog', 'extension.manifest.publish', 'declarative-source-fact'],
  ['devview-extension-context-plan', 'report.create', 'report-only-source-fact'],
  ['devview-extension-adapter-compatibility-report', 'report.create', 'report-only-source-fact'],
  ['devview-native-retrofit-profile-validation-report', 'report.create', 'report-only-source-fact'],
  ['devview-benchmark-golden-answer', 'benchmark.golden.review', 'benchmark-source'],
  ['devview-benchmark-suite-lock-manifest', 'benchmark.suite.lock', 'governance-record'],
  ['devview-benchmark-governance-verification-report', 'benchmark.governance.verify', 'governance-report'],
  ['devview-provider-network-default-deny-policy-report', 'provider-network.policy.record', 'policy-record'],
  ['devview-enterprise-readiness-report', 'enterprise.readiness.report', 'aggregate-report'],
] as const

const missingEnforcementGaps = [
  'signed policy artifact',
  'actor identity provider',
  'role assignment registry',
  'RBAC verification',
  'signed record envelope',
  'cross-record hash chain',
  'key management',
] as const

const futureOnlyRequirements = [
  'cryptographic signing implementation',
  'key generation, storage, rotation, and revocation policy',
  'RBAC enforcement in authority-changing commands',
  'signed policy enforcement',
  'enterprise gate activation',
  'provider/network allow policy',
  'extension execution approval and sandboxing',
] as const

export interface RbacReadinessReportOptions {
  enterpriseReadiness?: string
  providerNetworkPolicyReport?: string
  benchmarkGovernanceVerification?: string
  output?: string
  markdown?: string
}

export interface RbacReadinessFinding {
  severity: 'blocker' | 'gap' | 'advisory' | 'satisfied'
  code: string
  message: string
  path?: string
  field?: string
}

export interface RbacReadinessReport {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof REPORTED_STATUS | typeof BLOCKED_STATUS
  readinessScope: 'rbac-actor-identity-readiness-report-only'
  sourceFactsOnly: true
  reportOnly: true
  rbacEnforced: false
  signedRecordEnvelopePresent: false
  cryptographicSigningImplemented: false
  keyManagementImplemented: false
  actorModelSummary: Array<(typeof actorModelSummary)[number]>
  actorIdentityObjectProposal: typeof actorIdentityObjectProposal
  rolePermissionMatrix: Array<(typeof rolePermissionMatrix)[number]>
  artifactPermissionMapping: Array<{
    artifactRole: string
    requiredPermission: string
    authorityLevel: string
    signatureRequiredBeforeEnterpriseReady: boolean
  }>
  defaultDenyAuthorityPosture: {
    status: 'default-deny-recorded-report-only'
    authorityWithoutGrant: 'blocked'
    reportOnlyArtifactsAllowedWithoutAuthority: true
    codexSelfApprovalAllowed: false
    automationAuthorityGrantAllowed: false
  }
  sourceEnterpriseReadiness: SourceSummary
  sourceProviderNetworkPolicyReport: SourceSummary & {
    defaultProviderPolicy: string | null
    defaultNetworkPolicy: string | null
    explicitAllowSupported: boolean | null
  }
  sourceBenchmarkGovernanceVerification: SourceSummary & {
    enterpriseClaimReadiness: string | null
    goldenReviewStatus: string | null
    heldOutPolicyStatus: string | null
  }
  currentSourceActorFieldsSummary: {
    enterpriseRbacStatus: string | null
    actorIdentityModelPresent: boolean | null
    signedRecordEnvelopePresent: boolean | null
    providerFutureAllowRequirementCount: number | null
    benchmarkGoldenReviewStatus: string | null
    benchmarkHeldOutPolicyStatus: string | null
    discoveredActorFieldKinds: string[]
    limitations: string[]
  }
  missingEnforcementGaps: Array<(typeof missingEnforcementGaps)[number]>
  futureOnlyRequirements: Array<(typeof futureOnlyRequirements)[number]>
  rbacReadinessFindings: RbacReadinessFinding[]
  downstreamActionPlan: string[]
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

interface SourceSummary {
  supplied: boolean
  path: string | null
  artifactRole: string | null
  status: string | null
}

interface LoadedSource {
  requestedPath: string
  resolvedPath: string
  relativePath: string
  sourceKind: 'enterprise-readiness' | 'provider-network-policy-report' | 'benchmark-governance-verification'
  record: JsonRecord | null
  readError: string | null
}

export class RbacReadinessReportValidationError extends Error {
  readonly report: RbacReadinessReport

  constructor(report: RbacReadinessReport) {
    super('RBAC readiness reporting is blocked.')
    this.report = report
  }
}

export async function reportRbacReadiness(
  root: string,
  options: RbacReadinessReportOptions,
): Promise<RbacReadinessReport> {
  validateRequiredOptions(options)
  const sourcePaths = [
    options.enterpriseReadiness,
    options.providerNetworkPolicyReport,
    options.benchmarkGovernanceVerification,
  ].filter((entry): entry is string => Boolean(entry))
  await assertOutputAuthority(
    root,
    sourcePaths.map((entry) => resolveRepoPath(root, entry)),
    options,
  )

  const enterpriseReadiness = options.enterpriseReadiness
    ? await loadSource(root, options.enterpriseReadiness, 'enterprise-readiness')
    : null
  const providerNetworkPolicy = options.providerNetworkPolicyReport
    ? await loadSource(root, options.providerNetworkPolicyReport, 'provider-network-policy-report')
    : null
  const benchmarkGovernance = options.benchmarkGovernanceVerification
    ? await loadSource(root, options.benchmarkGovernanceVerification, 'benchmark-governance-verification')
    : null

  const blockingFindings = validateSources(enterpriseReadiness, providerNetworkPolicy, benchmarkGovernance)
  if (blockingFindings.length > 0) {
    throw new RbacReadinessReportValidationError(
      buildReport(enterpriseReadiness, providerNetworkPolicy, benchmarkGovernance, blockingFindings, true),
    )
  }

  const report = buildReport(
    enterpriseReadiness,
    providerNetworkPolicy,
    benchmarkGovernance,
    buildFindings(enterpriseReadiness, providerNetworkPolicy, benchmarkGovernance),
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
  enterpriseReadiness: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  benchmarkGovernance: LoadedSource | null,
  findings: RbacReadinessFinding[],
  blocked = false,
): RbacReadinessReport {
  const enterpriseRecord = enterpriseReadiness?.record ?? null
  const providerRecord = providerNetworkPolicy?.record ?? null
  const benchmarkRecord = benchmarkGovernance?.record ?? null
  const rbacReadiness = asRecord(enterpriseRecord?.rbacAndSigningReadiness)
  const goldenReview = asRecord(benchmarkRecord?.goldenReviewGovernanceCheck)
  const heldOut = asRecord(benchmarkRecord?.heldOutPolicyCheck)

  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : REPORTED_STATUS,
    readinessScope: 'rbac-actor-identity-readiness-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    rbacEnforced: false,
    signedRecordEnvelopePresent: false,
    cryptographicSigningImplemented: false,
    keyManagementImplemented: false,
    actorModelSummary: [...actorModelSummary],
    actorIdentityObjectProposal,
    rolePermissionMatrix: [...rolePermissionMatrix],
    artifactPermissionMapping: artifactPermissionMapping.map(([artifactRole, requiredPermission, authorityLevel]) => ({
      artifactRole,
      requiredPermission,
      authorityLevel,
      signatureRequiredBeforeEnterpriseReady: authorityLevel !== 'report-only-source-fact',
    })),
    defaultDenyAuthorityPosture: {
      status: 'default-deny-recorded-report-only',
      authorityWithoutGrant: 'blocked',
      reportOnlyArtifactsAllowedWithoutAuthority: true,
      codexSelfApprovalAllowed: false,
      automationAuthorityGrantAllowed: false,
    },
    sourceEnterpriseReadiness: {
      supplied: Boolean(enterpriseReadiness),
      path: enterpriseReadiness?.relativePath ?? null,
      artifactRole: stringValue(enterpriseRecord?.artifactRole),
      status: stringValue(enterpriseRecord?.status),
    },
    sourceProviderNetworkPolicyReport: {
      supplied: Boolean(providerNetworkPolicy),
      path: providerNetworkPolicy?.relativePath ?? null,
      artifactRole: stringValue(providerRecord?.artifactRole),
      status: stringValue(providerRecord?.status),
      defaultProviderPolicy: stringValue(providerRecord?.defaultProviderPolicy),
      defaultNetworkPolicy: stringValue(providerRecord?.defaultNetworkPolicy),
      explicitAllowSupported: booleanOrNull(providerRecord?.explicitAllowSupported),
    },
    sourceBenchmarkGovernanceVerification: {
      supplied: Boolean(benchmarkGovernance),
      path: benchmarkGovernance?.relativePath ?? null,
      artifactRole: stringValue(benchmarkRecord?.artifactRole),
      status: stringValue(benchmarkRecord?.status),
      enterpriseClaimReadiness: stringValue(benchmarkRecord?.enterpriseClaimReadiness),
      goldenReviewStatus: stringValue(goldenReview?.status),
      heldOutPolicyStatus: stringValue(heldOut?.status),
    },
    currentSourceActorFieldsSummary: {
      enterpriseRbacStatus: stringValue(rbacReadiness?.status),
      actorIdentityModelPresent: booleanOrNull(rbacReadiness?.actorIdentityModelPresent),
      signedRecordEnvelopePresent: booleanOrNull(rbacReadiness?.signedRecordEnvelopePresent),
      providerFutureAllowRequirementCount: arrayLength(providerRecord?.futureAllowPolicyRequirements),
      benchmarkGoldenReviewStatus: stringValue(goldenReview?.status),
      benchmarkHeldOutPolicyStatus: stringValue(heldOut?.status),
      discoveredActorFieldKinds: discoveredActorFieldKinds(enterpriseRecord, providerRecord, benchmarkRecord),
      limitations: [
        'Optional aggregate sources summarize existing actor hints but do not prove actor identity.',
        'No source can grant RBAC authority until signed policy and envelope verification exist.',
      ],
    },
    missingEnforcementGaps: [...missingEnforcementGaps],
    futureOnlyRequirements: [...futureOnlyRequirements],
    rbacReadinessFindings: findings,
    downstreamActionPlan: downstreamActionPlan(findings),
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

function validateSources(
  enterpriseReadiness: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  benchmarkGovernance: LoadedSource | null,
): RbacReadinessFinding[] {
  const findings: RbacReadinessFinding[] = []
  for (const source of [enterpriseReadiness, providerNetworkPolicy, benchmarkGovernance].filter(
    (entry): entry is LoadedSource => Boolean(entry),
  )) {
    if (source.readError) {
      findings.push(blockingFinding('RBAC_READINESS_SOURCE_READ_FAILED', source.readError, source.relativePath))
      continue
    }
    const record = source.record ?? {}
    if (source.sourceKind === 'enterprise-readiness') {
      validateEnterpriseReadinessSource(source, record, findings)
    } else if (source.sourceKind === 'provider-network-policy-report') {
      validateProviderNetworkPolicySource(source, record, findings)
    } else {
      validateBenchmarkGovernanceSource(source, record, findings)
    }
    for (const hit of collectUnsafeAuthorityHits(record)) {
      findings.push({
        severity: 'blocker',
        code: 'RBAC_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
        message: `${source.relativePath} contains unsafe RBAC readiness source flag ${hit.field}: true.`,
        path: source.relativePath,
        field: hit.field,
      })
    }
  }
  return findings
}

function validateEnterpriseReadinessSource(
  source: LoadedSource,
  record: JsonRecord,
  findings: RbacReadinessFinding[],
): void {
  if (record.artifactRole !== ENTERPRISE_READINESS_ROLE || record.status !== ENTERPRISE_READINESS_STATUS) {
    findings.push(
      blockingFinding(
        'RBAC_READINESS_ENTERPRISE_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${ENTERPRISE_READINESS_ROLE} with generated status.`,
        source.relativePath,
      ),
    )
  }
}

function validateProviderNetworkPolicySource(
  source: LoadedSource,
  record: JsonRecord,
  findings: RbacReadinessFinding[],
): void {
  if (record.artifactRole !== PROVIDER_NETWORK_POLICY_ROLE || record.status !== PROVIDER_NETWORK_POLICY_STATUS) {
    findings.push(
      blockingFinding(
        'RBAC_READINESS_PROVIDER_NETWORK_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${PROVIDER_NETWORK_POLICY_ROLE} with recorded status.`,
        source.relativePath,
      ),
    )
  }
  if (record.defaultProviderPolicy !== 'deny') {
    findings.push(
      blockingFinding(
        'RBAC_READINESS_PROVIDER_POLICY_NOT_DENY',
        'Provider/network policy source must set defaultProviderPolicy to deny.',
        source.relativePath,
        'defaultProviderPolicy',
      ),
    )
  }
  if (record.defaultNetworkPolicy !== 'deny') {
    findings.push(
      blockingFinding(
        'RBAC_READINESS_NETWORK_POLICY_NOT_DENY',
        'Provider/network policy source must set defaultNetworkPolicy to deny.',
        source.relativePath,
        'defaultNetworkPolicy',
      ),
    )
  }
  if (record.explicitAllowSupported !== false) {
    findings.push(
      blockingFinding(
        'RBAC_READINESS_PROVIDER_ALLOW_UNSUPPORTED',
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
          'RBAC_READINESS_PROVIDER_NETWORK_ALLOWLIST_NOT_EMPTY',
          `${field} must stay empty until signed RBAC policy support exists.`,
          source.relativePath,
          field,
        ),
      )
    }
  }
}

function validateBenchmarkGovernanceSource(
  source: LoadedSource,
  record: JsonRecord,
  findings: RbacReadinessFinding[],
): void {
  if (
    record.artifactRole !== BENCHMARK_GOVERNANCE_ROLE ||
    !BENCHMARK_GOVERNANCE_STATUSES.includes(record.status as (typeof BENCHMARK_GOVERNANCE_STATUSES)[number])
  ) {
    findings.push(
      blockingFinding(
        'RBAC_READINESS_BENCHMARK_GOVERNANCE_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${BENCHMARK_GOVERNANCE_ROLE} with verified or partial status.`,
        source.relativePath,
      ),
    )
  }
}

function buildFindings(
  enterpriseReadiness: LoadedSource | null,
  providerNetworkPolicy: LoadedSource | null,
  benchmarkGovernance: LoadedSource | null,
): RbacReadinessFinding[] {
  const findings: RbacReadinessFinding[] = [
    {
      severity: 'satisfied',
      code: 'RBAC_ACTOR_MODEL_REPORTED',
      message:
        'Actor model, role-permission matrix, and artifact-permission mapping are recorded as report-only facts.',
    },
    {
      severity: 'gap',
      code: 'RBAC_ENFORCEMENT_NOT_IMPLEMENTED',
      message: 'RBAC enforcement is not implemented; this report only defines the readiness model.',
    },
    {
      severity: 'gap',
      code: 'RBAC_SIGNED_RECORD_ENVELOPE_NOT_IMPLEMENTED',
      message: 'Signed record envelope, key management, and cross-record hash chain remain future work.',
    },
  ]
  if (enterpriseReadiness) {
    findings.push({
      severity: 'satisfied',
      code: 'RBAC_ENTERPRISE_READINESS_SOURCE_LINKED',
      message: 'Enterprise readiness report is linked as a source fact.',
      path: enterpriseReadiness.relativePath,
    })
  } else {
    findings.push({
      severity: 'advisory',
      code: 'RBAC_ENTERPRISE_READINESS_SOURCE_NOT_SUPPLIED',
      message: 'Enterprise readiness source was not supplied; RBAC report uses the default gap model.',
    })
  }
  if (providerNetworkPolicy) {
    findings.push({
      severity: 'satisfied',
      code: 'RBAC_PROVIDER_NETWORK_POLICY_SOURCE_LINKED',
      message: 'Provider/network default-deny policy report is linked as a source fact.',
      path: providerNetworkPolicy.relativePath,
    })
  } else {
    findings.push({
      severity: 'advisory',
      code: 'RBAC_PROVIDER_NETWORK_POLICY_SOURCE_NOT_SUPPLIED',
      message: 'Provider/network policy source was not supplied.',
    })
  }
  if (benchmarkGovernance) {
    findings.push({
      severity: 'satisfied',
      code: 'RBAC_BENCHMARK_GOVERNANCE_SOURCE_LINKED',
      message: 'Benchmark governance verification report is linked as a source fact.',
      path: benchmarkGovernance.relativePath,
    })
  } else {
    findings.push({
      severity: 'advisory',
      code: 'RBAC_BENCHMARK_GOVERNANCE_SOURCE_NOT_SUPPLIED',
      message: 'Benchmark governance verification source was not supplied.',
    })
  }
  return findings
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

function validateRequiredOptions(options: RbacReadinessReportOptions): void {
  if (!options.output) throw new Error('security report-rbac-readiness requires --output <json>.')
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: RbacReadinessReportOptions,
): Promise<void> {
  const outputPath = options.output ? resolveRepoPath(root, options.output) : null
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  if (!outputPath) throw new Error('security report-rbac-readiness requires --output <json>.')
  const sourceSet = new Set(sourcePaths.map((entry) => path.resolve(entry)))
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('RBAC readiness JSON output and Markdown output must be different paths.')
  }
  for (const target of [outputPath, ...(markdownPath ? [markdownPath] : [])]) {
    const relativeTarget = relativePath(root, target)
    if (sourceSet.has(path.resolve(target))) {
      throw new Error(`RBAC readiness output would overwrite a source input: ${relativeTarget}.`)
    }
    if (
      hasDevViewControlDirectory(target) ||
      hasCodexControlDirectory(target) ||
      hasHiddenControlDirectorySegment(target)
    ) {
      throw new Error(`RBAC readiness output is inside a protected control path: ${relativeTarget}.`)
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(`RBAC readiness output would overwrite a source-authority-shaped path: ${relativeTarget}.`)
    }
  }
}

function renderMarkdown(report: RbacReadinessReport): string {
  return [
    '# DevView RBAC / Actor Identity Readiness',
    '',
    `- status: ${report.status}`,
    `- rbacEnforced: ${report.rbacEnforced}`,
    `- signedRecordEnvelopePresent: ${report.signedRecordEnvelopePresent}`,
    `- actorModelCount: ${report.actorModelSummary.length}`,
    `- permissionRoleCount: ${report.rolePermissionMatrix.length}`,
    `- artifactPermissionMappingCount: ${report.artifactPermissionMapping.length}`,
    '',
    '## Missing Enforcement Gaps',
    ...report.missingEnforcementGaps.map((entry) => `- ${entry}`),
    '',
    '## Future-Only Requirements',
    ...report.futureOnlyRequirements.map((entry) => `- ${entry}`),
    '',
    '## Findings',
    ...report.rbacReadinessFindings.map((entry) => `- [${entry.severity}] ${entry.code}: ${entry.message}`),
    '',
    '## Report-Only Safety',
    '- rbacEnforced: false',
    '- cryptographicSigningImplemented: false',
    '- keyManagementImplemented: false',
    '- providerInvoked: false',
    '- networkCallMade: false',
    '- extensionExecutionAllowed: false',
    '- graphSourceMutated: false',
    '- graphDeltaApplied: false',
    '- enterpriseGateActivated: false',
    '',
  ].join('\n')
}

function discoveredActorFieldKinds(...records: Array<JsonRecord | null>): string[] {
  const fields = new Set<string>()
  for (const record of records) {
    collectActorLikeFields(record, fields)
  }
  return [...fields].sort()
}

function collectActorLikeFields(value: unknown, fields: Set<string>, seen = new Set<unknown>()): void {
  if (typeof value !== 'object' || value === null || seen.has(value)) return
  seen.add(value)
  if (Array.isArray(value)) {
    for (const entry of value) collectActorLikeFields(entry, fields, seen)
    return
  }
  for (const [key, entry] of Object.entries(value as JsonRecord)) {
    const normalized = key.toLowerCase()
    if (
      normalized.includes('actor') ||
      normalized.includes('operator') ||
      normalized.includes('reviewer') ||
      normalized.includes('approval') ||
      normalized.includes('authorization')
    ) {
      fields.add(key)
    }
    collectActorLikeFields(entry, fields, seen)
  }
}

function downstreamActionPlan(findings: RbacReadinessFinding[]): string[] {
  const actions = new Set<string>()
  actions.add('Implement deterministic unsigned record envelope preview before real signing.')
  actions.add('Integrate RBAC readiness and envelope verification into enterprise readiness as source facts.')
  actions.add(
    'Keep RBAC enforcement, cryptographic signing, key management, provider/network allow, and enterprise gates disabled.',
  )
  if (findings.some((entry) => entry.severity === 'blocker')) {
    actions.add('Fix invalid RBAC readiness source artifacts and rerun this report.')
  }
  return [...actions]
}

function blockingFinding(code: string, message: string, pathValue?: string, field?: string): RbacReadinessFinding {
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

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function arrayLength(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null
}
