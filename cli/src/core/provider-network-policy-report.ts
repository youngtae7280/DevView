import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'

type JsonRecord = Record<string, unknown>

const POLICY_ROLE = 'devview-provider-network-policy'
const POLICY_STATUS = 'devview-provider-network-policy-configured'
const ENTERPRISE_READINESS_ROLE = 'devview-enterprise-readiness-report'
const ENTERPRISE_READINESS_STATUS = 'devview-enterprise-readiness-report-generated'
const REPORT_ROLE = 'devview-provider-network-default-deny-policy-report'
const RECORDED_STATUS = 'devview-provider-network-default-deny-policy-recorded'
const BLOCKED_STATUS = 'devview-provider-network-default-deny-policy-blocked'

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

const unsupportedAllowFields = [
  'providerExecutionAllowed',
  'networkAccessAllowed',
  'externalApiAccessAllowed',
  'extensionTriggeredNetworkAllowed',
  'graphifyLiveExecutionAllowed',
  'allowProviderExecution',
  'allowNetworkAccess',
  'allowApiCalls',
]

const allowlistFields = [
  'providerAllowlist',
  'networkAllowlist',
  'allowedProviders',
  'allowedNetworkHosts',
  'allowedApiEndpoints',
]

export interface ProviderNetworkPolicyReportOptions {
  policy?: string
  enterpriseReadiness?: string
  output?: string
  markdown?: string
}

export interface ProviderNetworkPolicyFinding {
  severity: 'blocker' | 'gap' | 'advisory' | 'satisfied'
  code: string
  message: string
  path?: string
  field?: string
}

export interface ProviderNetworkPolicyReport {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof RECORDED_STATUS | typeof BLOCKED_STATUS
  policyScope: 'provider-network-default-deny-policy-report-only'
  sourceFactsOnly: true
  reportOnly: true
  sourcePolicy: {
    supplied: boolean
    path: string | null
    artifactRole: string | null
    status: string | null
  }
  sourceEnterpriseReadiness: {
    supplied: boolean
    path: string | null
    artifactRole: string | null
    status: string | null
    readinessLevel: string | null
  }
  defaultProviderPolicy: 'deny'
  defaultNetworkPolicy: 'deny'
  providerAllowlist: []
  networkAllowlist: []
  policyEnforcementMode: 'report-only-default-deny-recorded'
  explicitAllowSupported: false
  futureAllowPolicyRequirements: string[]
  blockedCapabilities: string[]
  providerNetworkReadiness: {
    status: 'default-deny-recorded' | 'blocked'
    allowRequestsSupported: false
    policyInputMode: 'canonical-default' | 'validated-policy-input' | 'blocked-policy-input'
    enterpriseReadinessLinked: boolean
  }
  policyFindings: ProviderNetworkPolicyFinding[]
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

interface LoadedSource {
  requestedPath: string
  resolvedPath: string
  relativePath: string
  sourceKind: 'policy' | 'enterprise-readiness'
  record: JsonRecord | null
  readError: string | null
}

export class ProviderNetworkPolicyReportValidationError extends Error {
  readonly report: ProviderNetworkPolicyReport

  constructor(report: ProviderNetworkPolicyReport) {
    super('Provider/network default-deny policy reporting is blocked.')
    this.report = report
  }
}

export async function reportProviderNetworkPolicy(
  root: string,
  options: ProviderNetworkPolicyReportOptions,
): Promise<ProviderNetworkPolicyReport> {
  validateRequiredOptions(options)
  const sourcePaths = [options.policy, options.enterpriseReadiness].filter((entry): entry is string => Boolean(entry))
  await assertOutputAuthority(
    root,
    sourcePaths.map((entry) => resolveRepoPath(root, entry)),
    options,
  )

  const policy = options.policy ? await loadSource(root, options.policy, 'policy') : null
  const enterpriseReadiness = options.enterpriseReadiness
    ? await loadSource(root, options.enterpriseReadiness, 'enterprise-readiness')
    : null
  const blockingFindings = validateSources(policy, enterpriseReadiness)
  if (blockingFindings.length > 0) {
    throw new ProviderNetworkPolicyReportValidationError(
      buildReport(policy, enterpriseReadiness, blockingFindings, true),
    )
  }

  const report = buildReport(policy, enterpriseReadiness, buildFindings(policy, enterpriseReadiness))
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
  policy: LoadedSource | null,
  enterpriseReadiness: LoadedSource | null,
  findings: ProviderNetworkPolicyFinding[],
  blocked = false,
): ProviderNetworkPolicyReport {
  const policyRecord = policy?.record ?? null
  const enterpriseRecord = enterpriseReadiness?.record ?? null
  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : RECORDED_STATUS,
    policyScope: 'provider-network-default-deny-policy-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    sourcePolicy: {
      supplied: Boolean(policy),
      path: policy?.relativePath ?? null,
      artifactRole: stringValue(policyRecord?.artifactRole),
      status: stringValue(policyRecord?.status),
    },
    sourceEnterpriseReadiness: {
      supplied: Boolean(enterpriseReadiness),
      path: enterpriseReadiness?.relativePath ?? null,
      artifactRole: stringValue(enterpriseRecord?.artifactRole),
      status: stringValue(enterpriseRecord?.status),
      readinessLevel: stringValue(enterpriseRecord?.readinessLevel),
    },
    defaultProviderPolicy: 'deny',
    defaultNetworkPolicy: 'deny',
    providerAllowlist: [],
    networkAllowlist: [],
    policyEnforcementMode: 'report-only-default-deny-recorded',
    explicitAllowSupported: false,
    futureAllowPolicyRequirements: [
      'signed policy artifact',
      'actor identity and RBAC grant',
      'explicit project-level provider/network grant',
      'tamper-evident audit record',
      'no-network default with scoped exception review',
      'sandbox and provider isolation design',
    ],
    blockedCapabilities: [
      'provider execution',
      'network access',
      'external API calls',
      'extension-triggered network access',
      'Graphify live execution or provider calls',
    ],
    providerNetworkReadiness: {
      status: blocked ? 'blocked' : 'default-deny-recorded',
      allowRequestsSupported: false,
      policyInputMode: blocked ? 'blocked-policy-input' : policy ? 'validated-policy-input' : 'canonical-default',
      enterpriseReadinessLinked: Boolean(enterpriseReadiness),
    },
    policyFindings: findings,
    downstreamActionPlan: downstreamActionPlan(findings, enterpriseReadiness),
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
  policy: LoadedSource | null,
  enterpriseReadiness: LoadedSource | null,
): ProviderNetworkPolicyFinding[] {
  const findings: ProviderNetworkPolicyFinding[] = []
  for (const source of [policy, enterpriseReadiness].filter((entry): entry is LoadedSource => Boolean(entry))) {
    if (source.readError) {
      findings.push(
        blockingFinding('PROVIDER_NETWORK_POLICY_SOURCE_READ_FAILED', source.readError, source.relativePath),
      )
      continue
    }
    const record = source.record ?? {}
    if (source.sourceKind === 'policy') {
      validatePolicySource(source, record, findings)
    } else {
      validateEnterpriseReadinessSource(source, record, findings)
    }
    for (const hit of collectUnsafeAuthorityHits(record)) {
      findings.push({
        severity: 'blocker',
        code: 'PROVIDER_NETWORK_POLICY_UNSAFE_SOURCE_AUTHORITY_FLAG',
        message: `${source.relativePath} contains unsafe provider/network policy source flag ${hit.field}: true.`,
        path: source.relativePath,
        field: hit.field,
      })
    }
  }
  return findings
}

function validatePolicySource(
  source: LoadedSource,
  record: JsonRecord,
  findings: ProviderNetworkPolicyFinding[],
): void {
  if (record.artifactRole !== POLICY_ROLE || record.status !== POLICY_STATUS) {
    findings.push(
      blockingFinding(
        'PROVIDER_NETWORK_POLICY_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${POLICY_ROLE} with status ${POLICY_STATUS}.`,
        source.relativePath,
      ),
    )
  }
  if (record.defaultProviderPolicy !== 'deny') {
    findings.push(
      blockingFinding(
        'PROVIDER_NETWORK_POLICY_DEFAULT_PROVIDER_NOT_DENY',
        'Provider policy input must set defaultProviderPolicy to deny.',
        source.relativePath,
        'defaultProviderPolicy',
      ),
    )
  }
  if (record.defaultNetworkPolicy !== 'deny') {
    findings.push(
      blockingFinding(
        'PROVIDER_NETWORK_POLICY_DEFAULT_NETWORK_NOT_DENY',
        'Provider policy input must set defaultNetworkPolicy to deny.',
        source.relativePath,
        'defaultNetworkPolicy',
      ),
    )
  }
  for (const field of allowlistFields) {
    const entries = arrayValues(record[field])
    if (entries.length > 0) {
      findings.push(
        blockingFinding(
          'PROVIDER_NETWORK_POLICY_ALLOWLIST_UNSUPPORTED',
          `${field} must stay empty until signed RBAC policy support exists.`,
          source.relativePath,
          field,
        ),
      )
    }
  }
  for (const field of unsupportedAllowFields) {
    if (record[field] === true) {
      findings.push(
        blockingFinding(
          'PROVIDER_NETWORK_POLICY_ALLOW_GRANT_UNSUPPORTED',
          `${field}: true is unsupported in report-only default-deny policy v1.`,
          source.relativePath,
          field,
        ),
      )
    }
  }
}

function validateEnterpriseReadinessSource(
  source: LoadedSource,
  record: JsonRecord,
  findings: ProviderNetworkPolicyFinding[],
): void {
  if (record.artifactRole !== ENTERPRISE_READINESS_ROLE || record.status !== ENTERPRISE_READINESS_STATUS) {
    findings.push(
      blockingFinding(
        'PROVIDER_NETWORK_POLICY_ENTERPRISE_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${ENTERPRISE_READINESS_ROLE} with generated status.`,
        source.relativePath,
      ),
    )
  }
}

function buildFindings(
  policy: LoadedSource | null,
  enterpriseReadiness: LoadedSource | null,
): ProviderNetworkPolicyFinding[] {
  const findings: ProviderNetworkPolicyFinding[] = [
    {
      severity: 'satisfied',
      code: 'PROVIDER_NETWORK_POLICY_DEFAULT_DENY_RECORDED',
      message: 'Provider and network defaults are recorded as deny.',
    },
    {
      severity: 'satisfied',
      code: 'PROVIDER_NETWORK_POLICY_NO_ALLOWLISTS_RECORDED',
      message: 'Provider and network allowlists are empty in this report-only policy artifact.',
    },
    {
      severity: 'gap',
      code: 'PROVIDER_NETWORK_POLICY_ALLOW_REQUIRES_FUTURE_RBAC_SIGNING',
      message: 'Explicit allow policies are future-only until signed policy, RBAC, audit, and sandboxing exist.',
    },
  ]
  if (policy) {
    findings.push({
      severity: 'satisfied',
      code: 'PROVIDER_NETWORK_POLICY_INPUT_VALIDATED',
      message: 'Provided policy input is compatible with default-deny v1.',
      path: policy.relativePath,
    })
  } else {
    findings.push({
      severity: 'advisory',
      code: 'PROVIDER_NETWORK_POLICY_CANONICAL_DEFAULT_USED',
      message: 'No policy input was supplied; emitted canonical default-deny policy report.',
    })
  }
  if (enterpriseReadiness) {
    findings.push({
      severity: 'satisfied',
      code: 'PROVIDER_NETWORK_POLICY_ENTERPRISE_SOURCE_LINKED',
      message: 'Enterprise readiness source was linked as a source fact.',
      path: enterpriseReadiness.relativePath,
    })
  } else {
    findings.push({
      severity: 'advisory',
      code: 'PROVIDER_NETWORK_POLICY_ENTERPRISE_SOURCE_NOT_SUPPLIED',
      message: 'Enterprise readiness source was not supplied; integrate this policy report in the next slice.',
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

function validateRequiredOptions(options: ProviderNetworkPolicyReportOptions): void {
  if (!options.output) throw new Error('security report-provider-network-policy requires --output <json>.')
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: ProviderNetworkPolicyReportOptions,
): Promise<void> {
  const outputPath = options.output ? resolveRepoPath(root, options.output) : null
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  if (!outputPath) throw new Error('security report-provider-network-policy requires --output <json>.')
  const sourceSet = new Set(sourcePaths.map((entry) => path.resolve(entry)))
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('Provider/network policy JSON output and Markdown output must be different paths.')
  }
  for (const target of [outputPath, ...(markdownPath ? [markdownPath] : [])]) {
    const relativeTarget = relativePath(root, target)
    if (sourceSet.has(path.resolve(target))) {
      throw new Error(`Provider/network policy output would overwrite a source input: ${relativeTarget}.`)
    }
    if (
      hasDevViewControlDirectory(target) ||
      hasCodexControlDirectory(target) ||
      hasHiddenControlDirectorySegment(target)
    ) {
      throw new Error(`Provider/network policy output is inside a protected control path: ${relativeTarget}.`)
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(
        `Provider/network policy output would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
  }
}

function renderMarkdown(report: ProviderNetworkPolicyReport): string {
  return [
    '# DevView Provider/Network Default-Deny Policy',
    '',
    `- status: ${report.status}`,
    `- defaultProviderPolicy: ${report.defaultProviderPolicy}`,
    `- defaultNetworkPolicy: ${report.defaultNetworkPolicy}`,
    `- policyEnforcementMode: ${report.policyEnforcementMode}`,
    `- explicitAllowSupported: ${report.explicitAllowSupported}`,
    `- enterpriseReadinessLinked: ${report.providerNetworkReadiness.enterpriseReadinessLinked}`,
    '',
    '## Blocked Capabilities',
    ...report.blockedCapabilities.map((entry) => `- ${entry}`),
    '',
    '## Future Allow Policy Requirements',
    ...report.futureAllowPolicyRequirements.map((entry) => `- ${entry}`),
    '',
    '## Findings',
    ...report.policyFindings.map((entry) => `- [${entry.severity}] ${entry.code}: ${entry.message}`),
    '',
    '## Report-Only Safety',
    '- providerInvoked: false',
    '- networkCallMade: false',
    '- apiCallMade: false',
    '- extensionExecutionAllowed: false',
    '- graphSourceMutated: false',
    '- graphDeltaApplied: false',
    '- enterpriseGateActivated: false',
    '',
  ].join('\n')
}

function downstreamActionPlan(
  findings: ProviderNetworkPolicyFinding[],
  enterpriseReadiness: LoadedSource | null,
): string[] {
  const actions = new Set<string>()
  if (!enterpriseReadiness) {
    actions.add('Feed this default-deny provider/network policy report into enterprise readiness reporting.')
  }
  if (findings.some((entry) => entry.severity === 'gap')) {
    actions.add('Plan RBAC, signed policy, audit, and sandbox requirements before any provider/network allow policy.')
  }
  actions.add('Keep provider/network/API integrations disabled until a signed enterprise policy is implemented.')
  return [...actions]
}

function blockingFinding(
  code: string,
  message: string,
  pathValue?: string,
  field?: string,
): ProviderNetworkPolicyFinding {
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

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function arrayValues(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}
