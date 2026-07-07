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

const unsafeAuthorityFields = [
  'enterpriseGateActivated',
  'providerInvoked',
  'networkCallMade',
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

export interface EnterpriseReadinessReportOptions {
  benchmarkGovernanceVerification?: string
  releaseSurfaceValidation?: string
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
    status: 'gap'
    currentReportsProviderNetworkFalse: true
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
    gaps: string[]
  }
  auditAndTamperEvidenceReadiness: {
    status: 'partial'
    benchmarkLockDigestsPresent: boolean
    sourceFactSeparationPresent: true
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
  sourceKind: 'benchmark-governance-verification' | 'release-surface-validation'
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
  const sourcePaths = [options.benchmarkGovernanceVerification, options.releaseSurfaceValidation].filter(
    (entry): entry is string => Boolean(entry),
  )
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
  const blockingFindings = validateSources(benchmarkGovernance, releaseSurface)
  if (blockingFindings.length > 0) {
    throw new EnterpriseReadinessReportValidationError(
      buildReport(benchmarkGovernance, releaseSurface, blockingFindings, true),
    )
  }

  const report = buildReport(benchmarkGovernance, releaseSurface, buildFindings(benchmarkGovernance, releaseSurface))
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
  findings: EnterpriseReadinessFinding[],
  blocked = false,
): EnterpriseReadinessReport {
  const benchmarkRecord = benchmarkGovernance?.record ?? null
  const releaseRecord = releaseSurface?.record ?? null
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
      status: 'gap',
      currentReportsProviderNetworkFalse: true,
      gaps: [
        'Formal provider/network default-deny policy artifact is not implemented.',
        'Provider/network audit enforcement is not activated.',
      ],
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
      gaps: [
        'Enterprise RBAC/actor identity model is not implemented.',
        'Signed record envelope and key management are not implemented.',
      ],
    },
    auditAndTamperEvidenceReadiness: {
      status: 'partial',
      benchmarkLockDigestsPresent: numberValue(benchmarkDigestSummary?.sourceArtifactDigestCount) !== null,
      sourceFactSeparationPresent: true,
      gaps: [
        'Tamper-evident benchmark digests exist, but a cross-record hash chain is not implemented.',
        'Authority records are not signed across evidence/proof/scope/apply lifecycle reports.',
      ],
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
): EnterpriseReadinessFinding[] {
  const findings: EnterpriseReadinessFinding[] = []
  for (const source of [benchmarkGovernance, releaseSurface].filter((entry): entry is LoadedSource => Boolean(entry))) {
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
    } else if (
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
): EnterpriseReadinessFinding[] {
  const findings: EnterpriseReadinessFinding[] = []
  const benchmarkRecord = benchmarkGovernance?.record ?? null
  const releaseRecord = releaseSurface?.record ?? null

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

  findings.push(
    {
      severity: 'blocker',
      code: 'ENTERPRISE_RBAC_SIGNING_MISSING',
      message: 'Enterprise RBAC, actor identity, and signed record envelope are not implemented.',
    },
    {
      severity: 'blocker',
      code: 'ENTERPRISE_PROVIDER_NETWORK_POLICY_MISSING',
      message: 'Formal provider/network default-deny policy artifact and enforcement are not implemented.',
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
  actions.add('Define provider/network default-deny policy artifact and verification command.')
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
