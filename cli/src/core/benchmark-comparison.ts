import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'

type JsonRecord = Record<string, unknown>

const EVALUATION_ROLE = 'devview-benchmark-evaluation-report'
const EVALUATION_STATUS = 'devview-benchmark-evaluation-scored'
const REPORT_ROLE = 'devview-benchmark-comparison-summary-report'
const SUMMARIZED_STATUS = 'devview-benchmark-comparison-summarized'
const BLOCKED_STATUS = 'devview-benchmark-comparison-blocked'

const comparisonArms = ['codex-only', 'codex-graphify', 'codex-devview', 'codex-graphify-devview'] as const
const unsafeAuthorityFields = [
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

type ComparisonArm = (typeof comparisonArms)[number]

export interface BenchmarkComparisonOptions {
  evaluations?: string
  output?: string
  markdown?: string
}

export interface BenchmarkComparisonFinding {
  severity: 'info' | 'warning' | 'error'
  findingLevel: 'blocking' | 'summary' | 'info'
  code: string
  message: string
  path?: string
  field?: string
}

export interface BenchmarkDimensionSummary {
  dimensionId: string
  score: number
  maxScore: number
  ratio: number
}

export interface BenchmarkArmSummary {
  comparisonArm: ComparisonArm
  sourceEvaluationReport: string
  overallScore: number
  maxScore: number
  passThreshold: number
  passed: boolean
  hardFailureCount: number
  findingCount: number
  dimensionScores: BenchmarkDimensionSummary[]
  sourceCandidateFacts: JsonRecord | null
}

export interface BenchmarkComparisonDelta {
  groupId: string
  label: string
  baselineArm: ComparisonArm
  comparisonArm: ComparisonArm
  overallScoreDelta: number
  passedDelta: 'improved' | 'regressed' | 'unchanged'
  dimensionScoreDeltas: Array<{
    dimensionId: string
    scoreDelta: number
    ratioDelta: number
  }>
}

export interface BenchmarkComparisonGroup {
  groupId: string
  suiteId: string | null
  taskId: string | null
  projectMode: string | null
  armComparisonGroupId: string | null
  armColumns: Record<ComparisonArm, BenchmarkArmSummary | null>
  missingArms: ComparisonArm[]
  hardFailureCount: number
  bestArmByOverallScore: ComparisonArm | null
}

export interface BenchmarkComparisonSummaryReport {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof SUMMARIZED_STATUS | typeof BLOCKED_STATUS
  comparisonScope: 'benchmark-aggregate-comparison-report-only'
  sourceEvaluationReports: string[]
  sourceEvaluationCount: number
  groupCount: number
  taskRows: BenchmarkComparisonGroup[]
  aggregateDeltas: BenchmarkComparisonDelta[]
  interpretabilitySummary: {
    workJournalUsefulnessAverage: number | null
    evidenceQualityAverage: number | null
    scopeAccuracyAverage: number | null
  }
  findings: BenchmarkComparisonFinding[]
  benchmarkExecuted: false
  candidateExecuted: false
  graphifyExecuted: false
  nativeBenchmarkExecuted: false
  sourceFactsOnly: true
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

interface LoadedEvaluation {
  requestedPath: string
  resolvedPath: string
  relativePath: string
  record: JsonRecord | null
  readError: string | null
}

export class BenchmarkComparisonValidationError extends Error {
  readonly report: BenchmarkComparisonSummaryReport

  constructor(report: BenchmarkComparisonSummaryReport) {
    super('Benchmark comparison summary is blocked.')
    this.report = report
  }
}

export async function summarizeBenchmarkComparison(
  root: string,
  options: BenchmarkComparisonOptions,
): Promise<BenchmarkComparisonSummaryReport> {
  validateRequiredOptions(options)
  const evaluationInputs = parseEvaluationInputs(options.evaluations ?? '')
  const sourcePaths = evaluationInputs.map((entry) => resolveRepoPath(root, entry))
  await assertOutputAuthority(root, sourcePaths, options)

  const evaluations = await Promise.all(evaluationInputs.map((entry) => loadEvaluation(root, entry)))
  const blockingFindings = validateEvaluationSources(evaluations)
  if (blockingFindings.length > 0) {
    throw new BenchmarkComparisonValidationError(buildReport(evaluations, blockingFindings, true))
  }

  const report = buildReport(evaluations, [], false)
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
  evaluations: LoadedEvaluation[],
  blockingFindings: BenchmarkComparisonFinding[],
  blocked: boolean,
): BenchmarkComparisonSummaryReport {
  const validEvaluations = blocked ? [] : evaluations.filter((entry) => entry.record)
  const groups = blocked ? [] : buildGroups(validEvaluations)
  const aggregateDeltas = blocked ? [] : groups.flatMap((group) => deltasForGroup(group))
  const allArms = groups.flatMap((group) =>
    comparisonArms.map((arm) => group.armColumns[arm]).filter((entry): entry is BenchmarkArmSummary => Boolean(entry)),
  )

  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : SUMMARIZED_STATUS,
    comparisonScope: 'benchmark-aggregate-comparison-report-only',
    sourceEvaluationReports: evaluations.map((entry) => entry.relativePath),
    sourceEvaluationCount: evaluations.length,
    groupCount: groups.length,
    taskRows: groups,
    aggregateDeltas,
    interpretabilitySummary: {
      workJournalUsefulnessAverage: averageDimension(allArms, 'userInterpretability'),
      evidenceQualityAverage: averageDimension(allArms, 'evidenceQuality'),
      scopeAccuracyAverage: averageDimension(allArms, 'scopeAccuracy'),
    },
    findings: blockingFindings,
    benchmarkExecuted: false,
    candidateExecuted: false,
    graphifyExecuted: false,
    nativeBenchmarkExecuted: false,
    sourceFactsOnly: true,
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

function buildGroups(evaluations: LoadedEvaluation[]): BenchmarkComparisonGroup[] {
  const grouped = new Map<string, LoadedEvaluation[]>()
  for (const evaluation of evaluations) {
    const record = evaluation.record ?? {}
    const key = [
      stringValue(record.benchmarkSuiteId) ?? 'unknown-suite',
      stringValue(record.taskId) ?? 'unknown-task',
      stringValue(record.projectMode) ?? 'unknown-mode',
      stringValue(record.armComparisonGroupId) ?? 'no-arm-group',
    ].join('::')
    grouped.set(key, [...(grouped.get(key) ?? []), evaluation])
  }

  return [...grouped.entries()].map(([groupId, entries]) => {
    const first = entries[0]?.record ?? {}
    const armColumns = emptyArmColumns()
    for (const entry of entries) {
      const record = entry.record ?? {}
      const arm = normalizeComparisonArm(stringValue(record.comparisonArm))
      if (!arm || armColumns[arm]) continue
      armColumns[arm] = summarizeArm(entry)
    }
    const presentArms = comparisonArms.filter((arm) => Boolean(armColumns[arm]))
    const hardFailureCount = presentArms.reduce((sum, arm) => sum + (armColumns[arm]?.hardFailureCount ?? 0), 0)
    const bestArm = presentArms
      .map((arm) => armColumns[arm])
      .filter((entry): entry is BenchmarkArmSummary => Boolean(entry))
      .sort((left, right) => right.overallScore - left.overallScore)[0]

    return {
      groupId,
      suiteId: stringValue(first.benchmarkSuiteId) ?? null,
      taskId: stringValue(first.taskId) ?? null,
      projectMode: stringValue(first.projectMode) ?? null,
      armComparisonGroupId: stringValue(first.armComparisonGroupId) ?? null,
      armColumns,
      missingArms: comparisonArms.filter((arm) => !armColumns[arm]),
      hardFailureCount,
      bestArmByOverallScore: bestArm?.comparisonArm ?? null,
    }
  })
}

function summarizeArm(evaluation: LoadedEvaluation): BenchmarkArmSummary {
  const record = evaluation.record ?? {}
  return {
    comparisonArm: normalizeComparisonArm(stringValue(record.comparisonArm)) ?? 'codex-only',
    sourceEvaluationReport: evaluation.relativePath,
    overallScore: numberValue(record.overallScore) ?? 0,
    maxScore: numberValue(record.maxScore) ?? 0,
    passThreshold: numberValue(record.passThreshold) ?? 70,
    passed: record.passed === true,
    hardFailureCount: arrayRecords(record.hardFailures).length,
    findingCount: arrayRecords(record.findings).length,
    dimensionScores: arrayRecords(record.dimensionScores).map((entry) => ({
      dimensionId: stringValue(entry.dimensionId) ?? 'unknown',
      score: numberValue(entry.score) ?? 0,
      maxScore: numberValue(entry.maxScore) ?? 0,
      ratio: numberValue(entry.ratio) ?? 0,
    })),
    sourceCandidateFacts: asRecord(record.sourceCandidateFacts),
  }
}

function deltasForGroup(group: BenchmarkComparisonGroup): BenchmarkComparisonDelta[] {
  const pairs: Array<[string, ComparisonArm, ComparisonArm]> = [
    ['DevView vs Codex-only', 'codex-only', 'codex-devview'],
    ['Graphify vs Codex-only', 'codex-only', 'codex-graphify'],
    ['DevView+Graphify vs DevView', 'codex-devview', 'codex-graphify-devview'],
    ['DevView+Graphify vs Graphify', 'codex-graphify', 'codex-graphify-devview'],
  ]
  return pairs
    .map(([label, baselineArm, comparisonArm]) =>
      buildDelta(group.groupId, label, group.armColumns[baselineArm], group.armColumns[comparisonArm]),
    )
    .filter((entry): entry is BenchmarkComparisonDelta => Boolean(entry))
}

function buildDelta(
  groupId: string,
  label: string,
  baseline: BenchmarkArmSummary | null,
  comparison: BenchmarkArmSummary | null,
): BenchmarkComparisonDelta | null {
  if (!baseline || !comparison) return null
  const baselineDimensions = new Map(baseline.dimensionScores.map((entry) => [entry.dimensionId, entry]))
  return {
    groupId,
    label,
    baselineArm: baseline.comparisonArm,
    comparisonArm: comparison.comparisonArm,
    overallScoreDelta: roundScore(comparison.overallScore - baseline.overallScore),
    passedDelta:
      baseline.passed === comparison.passed
        ? 'unchanged'
        : comparison.passed && !baseline.passed
          ? 'improved'
          : 'regressed',
    dimensionScoreDeltas: comparison.dimensionScores.map((entry) => {
      const baselineEntry = baselineDimensions.get(entry.dimensionId)
      return {
        dimensionId: entry.dimensionId,
        scoreDelta: roundScore(entry.score - (baselineEntry?.score ?? 0)),
        ratioDelta: roundScore(entry.ratio - (baselineEntry?.ratio ?? 0)),
      }
    }),
  }
}

function validateEvaluationSources(evaluations: LoadedEvaluation[]): BenchmarkComparisonFinding[] {
  const findings: BenchmarkComparisonFinding[] = []
  for (const evaluation of evaluations) {
    if (evaluation.readError) {
      findings.push({
        severity: 'error',
        findingLevel: 'blocking',
        code: 'BENCHMARK_COMPARISON_EVALUATION_READ_FAILED',
        message: evaluation.readError,
        path: evaluation.relativePath,
      })
      continue
    }
    const record = evaluation.record ?? {}
    if (record.artifactRole !== EVALUATION_ROLE || record.status !== EVALUATION_STATUS) {
      findings.push({
        severity: 'error',
        findingLevel: 'blocking',
        code: 'BENCHMARK_COMPARISON_EVALUATION_ROLE_STATUS_INVALID',
        message: `${evaluation.relativePath} must be ${EVALUATION_ROLE} with status ${EVALUATION_STATUS}.`,
        path: evaluation.relativePath,
      })
    }
    if (!normalizeComparisonArm(stringValue(record.comparisonArm))) {
      findings.push({
        severity: 'error',
        findingLevel: 'blocking',
        code: 'BENCHMARK_COMPARISON_EVALUATION_ARM_INVALID',
        message: `${evaluation.relativePath} must declare a supported comparisonArm.`,
        path: evaluation.relativePath,
        field: 'comparisonArm',
      })
    }
    for (const hit of collectUnsafeAuthorityHits(record)) {
      findings.push({
        severity: 'error',
        findingLevel: 'blocking',
        code: 'BENCHMARK_COMPARISON_UNSAFE_SOURCE_AUTHORITY_FLAG',
        message: `${evaluation.relativePath} contains unsafe report-only benchmark flag ${hit.field}: true.`,
        path: evaluation.relativePath,
        field: hit.field,
      })
    }
  }
  return findings
}

function renderMarkdown(report: BenchmarkComparisonSummaryReport): string {
  return [
    '# DevView Benchmark Comparison Summary',
    '',
    `- status: ${report.status}`,
    `- sourceEvaluationCount: ${report.sourceEvaluationCount}`,
    `- groupCount: ${report.groupCount}`,
    `- workJournalUsefulnessAverage: ${report.interpretabilitySummary.workJournalUsefulnessAverage ?? 'n/a'}`,
    `- evidenceQualityAverage: ${report.interpretabilitySummary.evidenceQualityAverage ?? 'n/a'}`,
    `- scopeAccuracyAverage: ${report.interpretabilitySummary.scopeAccuracyAverage ?? 'n/a'}`,
    '',
    '## Task Matrix',
    ...report.taskRows.flatMap((group) => [
      `- ${group.taskId ?? 'unknown'} (${group.projectMode ?? 'unknown'})`,
      `  - present: ${comparisonArms.filter((arm) => group.armColumns[arm]).join(', ') || 'none'}`,
      `  - missing: ${group.missingArms.join(', ') || 'none'}`,
      `  - bestArmByOverallScore: ${group.bestArmByOverallScore ?? 'none'}`,
    ]),
    '',
    '## Deltas',
    ...(report.aggregateDeltas.length === 0
      ? ['- none']
      : report.aggregateDeltas.map(
          (entry) => `- ${entry.label}: ${entry.comparisonArm} - ${entry.baselineArm} = ${entry.overallScoreDelta}`,
        )),
    '',
    '## Safety',
    '- benchmarkExecuted: false',
    '- candidateExecuted: false',
    '- graphifyExecuted: false',
    '- nativeBenchmarkExecuted: false',
    '- providerInvoked: false',
    '- networkCallMade: false',
    '- shellCommandsExecuted: false',
    '- graphSourceMutated: false',
    '- graphDeltaApplied: false',
  ].join('\n')
}

async function loadEvaluation(root: string, requestedPath: string): Promise<LoadedEvaluation> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  const relative = relativePath(root, resolvedPath)
  const result = await readJsonSafe<JsonRecord>(resolvedPath)
  if (!result.ok) {
    return { requestedPath, resolvedPath, relativePath: relative, record: null, readError: result.error }
  }
  return { requestedPath, resolvedPath, relativePath: relative, record: result.value, readError: null }
}

function validateRequiredOptions(options: BenchmarkComparisonOptions): void {
  if (!options.evaluations) throw new Error('benchmark summarize-comparison requires --evaluations <files>.')
  if (parseEvaluationInputs(options.evaluations).length === 0) {
    throw new Error('benchmark summarize-comparison requires at least one evaluation report.')
  }
  if (!options.output) throw new Error('benchmark summarize-comparison requires --output <json>.')
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: BenchmarkComparisonOptions,
): Promise<void> {
  const outputPath = options.output ? resolveRepoPath(root, options.output) : null
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  if (!outputPath) throw new Error('benchmark summarize-comparison requires --output <json>.')
  const sourceSet = new Set(sourcePaths.map((entry) => path.resolve(entry)))
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('Benchmark comparison JSON output and Markdown output must be different paths.')
  }
  for (const target of [outputPath, ...(markdownPath ? [markdownPath] : [])]) {
    const relativeTarget = relativePath(root, target)
    if (sourceSet.has(path.resolve(target))) {
      throw new Error(`Benchmark comparison output would overwrite a source input: ${relativeTarget}.`)
    }
    if (
      hasDevViewControlDirectory(target) ||
      hasCodexControlDirectory(target) ||
      hasHiddenControlDirectorySegment(target)
    ) {
      throw new Error(`Benchmark comparison output is inside a protected control path: ${relativeTarget}.`)
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(`Benchmark comparison output would overwrite a source-authority-shaped path: ${relativeTarget}.`)
    }
  }
}

function parseEvaluationInputs(value: string): string[] {
  return uniqueStrings(
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  )
}

function emptyArmColumns(): Record<ComparisonArm, BenchmarkArmSummary | null> {
  return {
    'codex-only': null,
    'codex-graphify': null,
    'codex-devview': null,
    'codex-graphify-devview': null,
  }
}

function averageDimension(arms: BenchmarkArmSummary[], dimensionId: string): number | null {
  const values = arms
    .map((arm) => arm.dimensionScores.find((entry) => entry.dimensionId === dimensionId)?.score)
    .filter((entry): entry is number => typeof entry === 'number')
  if (values.length === 0) return null
  return roundScore(values.reduce((sum, entry) => sum + entry, 0) / values.length)
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

function normalizeComparisonArm(value: string | null | undefined): ComparisonArm | null {
  return comparisonArms.includes(value as ComparisonArm) ? (value as ComparisonArm) : null
}

function arrayRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter((entry): entry is JsonRecord => isRecord(entry)) : []
}

function asRecord(value: unknown): JsonRecord | null {
  return isRecord(value) ? value : null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.resolve(root, filePath)
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
