import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic } from './fs.js'
import type { IssueSeverity } from './types.js'

const REPORTER_NAME = 'HookGatewayHealthReporter'
const EXPECTED_BOUNDARY_ROLE = 'devview-hook-gateway-health-boundary-preview'
const EXPECTED_BOUNDARY_STATUS = 'devview-hook-gateway-health-boundary-previewed'

type JsonRecord = Record<string, unknown>

export interface HookGatewayHealthFinding {
  code: string
  severity: IssueSeverity
  field?: string
  message: string
  expected?: unknown
  actual?: unknown
  suggestedFix?: string
}

export interface HookGatewayHealthReport {
  schemaVersion: 1
  artifactRole: 'devview-hook-gateway-health-report'
  status: 'devview-hook-gateway-health-report-generated' | 'devview-hook-gateway-health-report-blocked'
  reporterName: typeof REPORTER_NAME
  reportScope: 'hook-gateway-health-boundary-report-only'
  sourceBoundary: string
  sourceBoundaryArtifactRole: string
  sourceBoundaryStatus: string
  healthCheckImplemented: true
  healthCheckCommandImplemented: true
  hookScriptsImplemented: false
  hookScriptsInstalled: false | 'not-checked-preview-only'
  hookGatewayConfigured: 'not-checked-preview-only'
  hookGatewayTrusted: 'not-checked-preview-only'
  hookGatewayActive: 'not-checked-preview-only'
  strictModeEnabled: false
  actualBlockingHookBehaviorImplemented: false
  guidedEnforcementEnabled: false
  ciEnforcementEnabled: false
  graphSourceMutated: false
  graphDeltaApplied: false
  approvalStatus: 'not-approved'
  humanDecisionRecorded: false
  equivalenceProven: false
  runtimeEvidenceSatisfied: false
  scopeEnforced: false
  graphApplyEnabled: false
  approvalAutomationEnabled: false
  nonEnforcing: true
  runtimeBudgetEnforced: false
  sourceHookGatewayBoundaryArtifact: string
  modeSummary: JsonRecord[]
  frontendArtifactAvailabilitySummary: JsonRecord
  missingOrFutureReadinessItems: JsonRecord[]
  bypassDetectionStatus: 'preview-only-non-enforcing'
  recommendedNextAction: string
  validationFindings: HookGatewayHealthFinding[]
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-preview-output-not-source-authority'
  nonExecutionBoundary: string
}

export interface HookGatewayHealthFileResult {
  report: HookGatewayHealthReport
  outputPath?: string
}

export function generateHookGatewayHealthReport(
  boundary: unknown,
  sourceBoundary = '<in-memory>',
): HookGatewayHealthReport {
  const record = asRecord(boundary)
  const findings: HookGatewayHealthFinding[] = []
  validateHealthBoundary(record, findings)

  const boundaryRole = stringValue(record?.artifactRole)
  const boundaryStatus = stringValue(record?.status)
  const blocked = findings.some((finding) => finding.severity === 'error')
  const frontendArtifacts = arrayRecords(record?.frontendArtifactAvailability)
  const readinessItems = arrayRecords(record?.futureHealthCheckReadinessItems)

  return {
    schemaVersion: 1,
    artifactRole: 'devview-hook-gateway-health-report',
    status: blocked ? 'devview-hook-gateway-health-report-blocked' : 'devview-hook-gateway-health-report-generated',
    reporterName: REPORTER_NAME,
    reportScope: 'hook-gateway-health-boundary-report-only',
    sourceBoundary,
    sourceBoundaryArtifactRole: boundaryRole,
    sourceBoundaryStatus: boundaryStatus,
    healthCheckImplemented: true,
    healthCheckCommandImplemented: true,
    hookScriptsImplemented: false,
    hookScriptsInstalled: false,
    hookGatewayConfigured: 'not-checked-preview-only',
    hookGatewayTrusted: 'not-checked-preview-only',
    hookGatewayActive: 'not-checked-preview-only',
    strictModeEnabled: false,
    actualBlockingHookBehaviorImplemented: false,
    guidedEnforcementEnabled: false,
    ciEnforcementEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    scopeEnforced: false,
    graphApplyEnabled: false,
    approvalAutomationEnabled: false,
    nonEnforcing: true,
    runtimeBudgetEnforced: false,
    sourceHookGatewayBoundaryArtifact: stringValue(record?.sourceHookGatewayBoundaryArtifact),
    modeSummary: buildModeSummary(record),
    frontendArtifactAvailabilitySummary: buildFrontendArtifactAvailabilitySummary(frontendArtifacts),
    missingOrFutureReadinessItems: buildReadinessSummary(readinessItems),
    bypassDetectionStatus: 'preview-only-non-enforcing',
    recommendedNextAction: blocked
      ? 'Repair the Hook Gateway health boundary preview before reporting activation readiness.'
      : 'Use this report as non-enforcing readiness context only. Hook scripts, install/trust mutation, guided blocking, strict mode, Codex execution blocking, graph apply, approval, runtime Evidence satisfaction, equivalence proof, scope enforcement, and CI enforcement remain unimplemented.',
    validationFindings: findings,
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    nonExecutionBoundary:
      'This Hook Gateway health report reads a boundary preview only. It does not implement hook scripts, install hooks, trust commands, block Codex execution, enable strict or guided enforcement, call an LLM, make network calls, mutate graph-source, apply graph deltas, approve work, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
  }
}

export async function reportHookGatewayHealthFile(
  root: string,
  boundaryPath: string,
  options: { output?: string } = {},
): Promise<HookGatewayHealthFileResult> {
  const resolvedBoundaryPath = resolveRepoPath(root, boundaryPath)
  const parsed = await readJsonSafe<Record<string, unknown>>(resolvedBoundaryPath)
  if (!parsed.ok) {
    throw new Error(`Unable to read Hook Gateway health boundary from ${boundaryPath}: ${parsed.error}`)
  }

  await assertHealthReportOutputAuthority(root, resolvedBoundaryPath, parsed.value, options)
  const report = generateHookGatewayHealthReport(parsed.value, relativePath(root, resolvedBoundaryPath))
  let outputPath: string | undefined

  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    report.writtenOutputPath = outputPath
    report.writtenOutputPathAuthorityStatus = 'explicit-preview-output-not-source-authority'
    await writeJsonAtomic(resolvedOutputPath, report)
  }

  return { report, ...(outputPath ? { outputPath } : {}) }
}

async function assertHealthReportOutputAuthority(
  root: string,
  resolvedBoundaryPath: string,
  boundary: JsonRecord,
  options: { output?: string },
): Promise<void> {
  if (!options.output) {
    return
  }

  const resolvedOutputPath = resolveRepoPath(root, options.output)
  const protectedPaths = buildProtectedOutputPathMap(root, resolvedBoundaryPath, boundary)
  const protectedReason = protectedPaths.get(pathKey(resolvedOutputPath))
  if (protectedReason) {
    throw new Error(
      `Hook Gateway health report output path is unsafe: ${options.output} would overwrite ${protectedReason}.`,
    )
  }

  const existingAuthority = await classifyExistingSourceAuthority(resolvedOutputPath)
  if (existingAuthority) {
    throw new Error(
      `Hook Gateway health report output path is unsafe: ${options.output} already contains ${existingAuthority}. Choose a dedicated preview/report output path.`,
    )
  }
}

function buildProtectedOutputPathMap(
  root: string,
  resolvedBoundaryPath: string,
  boundary: JsonRecord,
): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const add = (candidate: unknown, reason: string): void => {
    const candidatePath = stringValue(candidate)
    if (!isConcreteOutputProtectedPath(candidatePath)) {
      return
    }
    const key = pathKey(resolveRepoPath(root, candidatePath))
    if (!protectedPaths.has(key)) {
      protectedPaths.set(key, reason)
    }
  }

  protectedPaths.set(pathKey(resolvedBoundaryPath), 'the source Hook Gateway health boundary')
  for (const candidatePath of collectConcretePathStrings(boundary)) {
    add(candidatePath, `linked Hook Gateway health boundary artifact ${candidatePath}`)
  }
  return protectedPaths
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) {
    return null
  }
  const record = asRecord(parsed.value)
  if (!record) {
    return null
  }
  const artifactRole = stringValue(record.artifactRole)
  if (artifactRole === EXPECTED_BOUNDARY_ROLE) {
    return `source boundary artifactRole "${artifactRole}"`
  }
  if (artifactRole.includes('graph-source')) {
    return `graph-source artifactRole "${artifactRole}"`
  }
  if (
    [
      'contract-compiler-input',
      'instruction-pack',
      'selected-graph-slice',
      'graph-traversal-plan',
      'request-ir-graph-aware-validation',
      'request-ir-candidate',
    ].includes(artifactRole)
  ) {
    return `selected/source artifactRole "${artifactRole}"`
  }
  if (asRecord(record.sourceRecords)) {
    return 'graph-source-shaped sourceRecords'
  }
  return null
}

function validateHealthBoundary(boundary: JsonRecord | null, findings: HookGatewayHealthFinding[]): void {
  if (!boundary) {
    findings.push({
      code: 'HOOK_GATEWAY_HEALTH_BOUNDARY_NOT_OBJECT',
      severity: 'error',
      field: 'boundary',
      message: 'Hook Gateway health reporting requires a boundary preview JSON object.',
    })
    return
  }

  const expectedFields: Array<[string, unknown]> = [
    ['artifactRole', EXPECTED_BOUNDARY_ROLE],
    ['status', EXPECTED_BOUNDARY_STATUS],
    ['healthCheckImplemented', false],
    ['healthCheckCommandImplemented', false],
    ['hookScriptsImplemented', false],
    ['hookScriptsInstalled', false],
    ['hookGatewayConfigured', 'not-checked-preview-only'],
    ['hookGatewayTrusted', 'not-checked-preview-only'],
    ['hookGatewayActive', 'not-checked-preview-only'],
    ['strictModeEnabled', false],
    ['ciEnforcementEnabled', false],
    ['graphApplyEnabled', false],
    ['approvalAutomationEnabled', false],
    ['graphSourceMutated', false],
    ['graphDeltaApplied', false],
    ['approvalStatus', 'not-approved'],
    ['humanDecisionRecorded', false],
    ['equivalenceProven', false],
    ['runtimeEvidenceSatisfied', false],
    ['scopeEnforced', false],
    ['actualBlockingHookBehaviorImplemented', false],
    ['actualInstallOrTrustMutationImplemented', false],
  ]

  for (const [field, expected] of expectedFields) {
    if (boundary[field] !== expected) {
      findings.push({
        code: 'HOOK_GATEWAY_HEALTH_BOUNDARY_UNSAFE_OR_MISMATCHED',
        severity: 'error',
        field,
        message: `Hook Gateway health boundary field "${field}" does not match the report-only preview boundary.`,
        expected,
        actual: boundary[field],
        suggestedFix: 'Restore the Hook Gateway health boundary preview before reporting health readiness.',
      })
    }
  }
}

function buildModeSummary(boundary: JsonRecord | null): JsonRecord[] {
  return arrayRecords(boundary?.healthCheckModeMatrix).map((entry) => ({
    mode: stringValue(entry.mode),
    availability: stringValue(entry.availability),
    mayBlock: entry.mayBlock === true,
    strictMode: entry.strictMode === true,
  }))
}

function buildFrontendArtifactAvailabilitySummary(entries: JsonRecord[]): JsonRecord {
  const statuses = new Map<string, number>()
  for (const entry of entries) {
    const status = stringValue(entry.status) || 'unknown'
    statuses.set(status, (statuses.get(status) ?? 0) + 1)
  }
  return {
    status: entries.length > 0 ? 'available-from-boundary-preview' : 'not-listed',
    total: entries.length,
    implementedCount: entries.filter((entry) => stringValue(entry.status).startsWith('implemented')).length,
    boundaryPreviewCount: entries.filter((entry) => stringValue(entry.status).includes('boundary-preview')).length,
    statusCounts: Object.fromEntries(statuses),
    items: entries.map((entry) => ({
      name: stringValue(entry.name),
      status: stringValue(entry.status),
      command: stringValue(entry.command),
      path: stringValue(entry.path),
      markdownPath: stringValue(entry.markdownPath),
    })),
  }
}

function buildReadinessSummary(entries: JsonRecord[]): JsonRecord[] {
  return entries.map((entry) => ({
    item: stringValue(entry.item),
    currentStatus: stringValue(entry.currentStatus),
    futureCheck: stringValue(entry.futureCheck),
    mustNotDo: stringValue(entry.mustNotDo),
  }))
}

function collectConcretePathStrings(value: unknown): string[] {
  const paths: string[] = []
  const visit = (entry: unknown): void => {
    if (typeof entry === 'string') {
      if (isConcreteOutputProtectedPath(entry)) {
        paths.push(entry)
      }
      return
    }
    if (Array.isArray(entry)) {
      for (const item of entry) {
        visit(item)
      }
      return
    }
    const record = asRecord(entry)
    if (!record) {
      return
    }
    for (const item of Object.values(record)) {
      visit(item)
    }
  }
  visit(value)
  return uniqueStrings(paths)
}

function isConcreteOutputProtectedPath(candidatePath: string): boolean {
  const normalized = candidatePath.replaceAll('\\', '/')
  return (
    Boolean(normalized) &&
    !normalized.startsWith('unresolved:') &&
    normalized !== '<in-memory>' &&
    !normalized.includes('<') &&
    !normalized.includes('\n') &&
    (normalized.includes('/') || normalized.startsWith('.')) &&
    /\.(json|md|txt)$/i.test(normalized)
  )
}

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as JsonRecord
}

function arrayRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.flatMap((entry) => (asRecord(entry) ? [entry as JsonRecord] : [])) : []
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((entry) => entry.length > 0))]
}

function resolveRepoPath(root: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(root, inputPath)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}
