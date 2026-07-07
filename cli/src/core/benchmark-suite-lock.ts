import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { findPluginRoot, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'

type JsonRecord = Record<string, unknown>

const SUITE_ROLE = 'devview-benchmark-suite-spec'
const SUITE_STATUS = 'devview-benchmark-suite-configured'
const TASK_ROLE = 'devview-benchmark-task-spec'
const TASK_STATUS = 'devview-benchmark-task-configured'
const GOLDEN_ROLE = 'devview-benchmark-golden-answer'
const GOLDEN_STATUS = 'devview-benchmark-golden-answer-ready'
const CANDIDATE_ROLE = 'devview-benchmark-candidate-result'
const CANDIDATE_STATUS = 'devview-benchmark-candidate-result-submitted'
const EVALUATION_ROLE = 'devview-benchmark-evaluation-report'
const EVALUATION_STATUS = 'devview-benchmark-evaluation-scored'
const COMPARISON_ROLE = 'devview-benchmark-comparison-summary-report'
const COMPARISON_STATUS = 'devview-benchmark-comparison-summarized'
const GRAPHIFY_VALIDATION_ROLE = 'devview-graphify-import-validation-report'
const GRAPHIFY_VALIDATION_STATUS = 'devview-graphify-import-validation-passed'
const REPORT_ROLE = 'devview-benchmark-suite-lock-manifest'
const LOCKED_STATUS = 'devview-benchmark-suite-locked'
const BLOCKED_STATUS = 'devview-benchmark-suite-lock-blocked'
const BENCHMARK_EVALUATOR_VERSION = 'devview-benchmark-evaluator-v1'
const SCORING_RUBRIC_VERSION = 'devview-benchmark-rubric-v1'

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
type SourceKind =
  | 'benchmark-suite'
  | 'benchmark-task'
  | 'golden-answer'
  | 'candidate-result'
  | 'evaluation-report'
  | 'comparison-summary'
  | 'graphify-import-validation'

export interface BenchmarkSuiteLockOptions {
  benchmarkSuite?: string
  tasks?: string
  goldenAnswers?: string
  candidateResults?: string
  evaluations?: string
  comparisonSummary?: string
  graphifyImportValidations?: string
  output?: string
  markdown?: string
}

export interface BenchmarkSuiteLockFinding {
  severity: 'info' | 'warning' | 'error'
  findingLevel: 'blocking' | 'governance-gap' | 'info'
  code: string
  message: string
  path?: string
  field?: string
}

export interface BenchmarkSourceDigest {
  sourceKind: SourceKind
  sourcePath: string
  sha256: string
  byteLength: number
  artifactRole: string | null
  status: string | null
  logicalIds: {
    suiteId: string | null
    taskId: string | null
    taskIds: string[]
    projectMode: string | null
    comparisonArm: string | null
    armComparisonGroupId: string | null
  }
}

export interface BenchmarkSuiteLockManifest {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof LOCKED_STATUS | typeof BLOCKED_STATUS
  lockScope: 'benchmark-governance-lock-report-only'
  suiteId: string | null
  taskIds: string[]
  projectModes: string[]
  comparisonArms: ComparisonArm[]
  devviewPackageVersion: string
  benchmarkEvaluatorVersion: typeof BENCHMARK_EVALUATOR_VERSION
  scoringRubricVersion: typeof SCORING_RUBRIC_VERSION
  sourceArtifactDigests: BenchmarkSourceDigest[]
  fixtureDigestSummary: {
    suiteCount: number
    taskCount: number
    goldenAnswerCount: number
    candidateResultCount: number
    evaluationReportCount: number
    comparisonSummaryCount: number
    graphifyImportValidationCount: number
    sourceArtifactCount: number
    combinedSha256: string
  }
  comparisonSummaryDigest: BenchmarkSourceDigest | null
  graphifyImportValidationDigests: BenchmarkSourceDigest[]
  goldenReviewGovernance: {
    status: 'present' | 'partial' | 'missing'
    reviewedGoldenAnswerCount: number
    totalGoldenAnswerCount: number
    missingReviewMetadataPaths: string[]
    approvalInvented: false
  }
  heldOutPolicyStatus: 'declared' | 'partial' | 'not-declared'
  staticVsLiveBoundary: {
    storedCandidateResultsOnly: true
    liveExecutionPresent: false
    liveGraphifyRunPresent: false
    liveNativeBenchmarkPresent: false
    sourceFactsOnly: true
  }
  tamperEvidenceStatus: 'source-digests-recorded'
  governanceCompletenessStatus: 'complete' | 'partial'
  findings: BenchmarkSuiteLockFinding[]
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

interface LoadedSource {
  requestedPath: string
  resolvedPath: string
  relativePath: string
  sourceKind: SourceKind
  record: JsonRecord | null
  digest: BenchmarkSourceDigest | null
  readError: string | null
}

export class BenchmarkSuiteLockValidationError extends Error {
  readonly manifest: BenchmarkSuiteLockManifest

  constructor(manifest: BenchmarkSuiteLockManifest) {
    super('Benchmark suite lock is blocked.')
    this.manifest = manifest
  }
}

export async function lockBenchmarkSuite(
  root: string,
  options: BenchmarkSuiteLockOptions,
): Promise<BenchmarkSuiteLockManifest> {
  validateRequiredOptions(options)
  const inputs = parseInputs(options)
  const sourcePaths = allRequestedPaths(inputs).map((entry) => resolveRepoPath(root, entry))
  await assertOutputAuthority(root, sourcePaths, options)

  const sources = await Promise.all([
    loadSource(root, inputs.benchmarkSuite, 'benchmark-suite'),
    ...inputs.tasks.map((entry) => loadSource(root, entry, 'benchmark-task')),
    ...inputs.goldenAnswers.map((entry) => loadSource(root, entry, 'golden-answer')),
    ...inputs.candidateResults.map((entry) => loadSource(root, entry, 'candidate-result')),
    ...inputs.evaluations.map((entry) => loadSource(root, entry, 'evaluation-report')),
    ...inputs.comparisonSummaries.map((entry) => loadSource(root, entry, 'comparison-summary')),
    ...inputs.graphifyImportValidations.map((entry) => loadSource(root, entry, 'graphify-import-validation')),
  ])

  const blockingFindings = validateSources(sources)
  const governanceFindings = buildGovernanceFindings(sources)
  if (blockingFindings.length > 0) {
    throw new BenchmarkSuiteLockValidationError(
      buildManifest(root, sources, [...blockingFindings, ...governanceFindings], true),
    )
  }

  const manifest = buildManifest(root, sources, governanceFindings, false)
  const outputPath = resolveRepoPath(root, options.output ?? '')
  await writeJsonAtomic(outputPath, manifest)
  manifest.writtenOutputPath = relativePath(root, outputPath)
  if (options.markdown) {
    const markdownPath = resolveRepoPath(root, options.markdown)
    await writeTextAtomic(markdownPath, renderMarkdown(manifest))
    manifest.writtenMarkdownPath = relativePath(root, markdownPath)
    await writeJsonAtomic(outputPath, manifest)
  }
  return manifest
}

function buildManifest(
  root: string,
  sources: LoadedSource[],
  findings: BenchmarkSuiteLockFinding[],
  blocked: boolean,
): BenchmarkSuiteLockManifest {
  const digests = sources.flatMap((source) => (source.digest ? [source.digest] : []))
  const suite = firstSource(sources, 'benchmark-suite')?.record ?? {}
  const taskRecords = sourcesOfKind(sources, 'benchmark-task').flatMap((source) =>
    source.record ? [source.record] : [],
  )
  const goldenRecords = sourcesOfKind(sources, 'golden-answer')
  const comparisonSummaryDigest = firstSource(sources, 'comparison-summary')?.digest ?? null
  const graphifyImportValidationDigests = sourcesOfKind(sources, 'graphify-import-validation').flatMap((source) =>
    source.digest ? [source.digest] : [],
  )
  const goldenReviewGovernance = summarizeGoldenReview(goldenRecords)
  const heldOutPolicyStatus = summarizeHeldOutPolicy(suite, taskRecords)
  const governanceCompletenessStatus =
    goldenReviewGovernance.status === 'present' && heldOutPolicyStatus === 'declared' ? 'complete' : 'partial'

  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : LOCKED_STATUS,
    lockScope: 'benchmark-governance-lock-report-only',
    suiteId: stringValue(suite.suiteId),
    taskIds: uniqueStrings([
      ...taskRecords.map((entry) => stringValue(entry.taskId)).filter((entry): entry is string => Boolean(entry)),
      ...stringArray(suite.taskIds),
    ]),
    projectModes: uniqueStrings(
      sources
        .map((source) => stringValue(source.record?.projectMode))
        .filter((entry): entry is string => Boolean(entry)),
    ),
    comparisonArms: comparisonArmList([
      ...stringArray(suite.comparisonArms),
      ...taskRecords.flatMap((entry) => stringArray(entry.comparisonArms)),
      ...sources
        .map((source) => stringValue(source.record?.comparisonArm))
        .filter((entry): entry is string => Boolean(entry)),
    ]),
    devviewPackageVersion: readPackageVersion(root),
    benchmarkEvaluatorVersion: BENCHMARK_EVALUATOR_VERSION,
    scoringRubricVersion: SCORING_RUBRIC_VERSION,
    sourceArtifactDigests: sortDigests(digests),
    fixtureDigestSummary: buildDigestSummary(digests),
    comparisonSummaryDigest,
    graphifyImportValidationDigests: sortDigests(graphifyImportValidationDigests),
    goldenReviewGovernance,
    heldOutPolicyStatus,
    staticVsLiveBoundary: {
      storedCandidateResultsOnly: true,
      liveExecutionPresent: false,
      liveGraphifyRunPresent: false,
      liveNativeBenchmarkPresent: false,
      sourceFactsOnly: true,
    },
    tamperEvidenceStatus: 'source-digests-recorded',
    governanceCompletenessStatus,
    findings,
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

function validateSources(sources: LoadedSource[]): BenchmarkSuiteLockFinding[] {
  const findings: BenchmarkSuiteLockFinding[] = []
  for (const source of sources) {
    if (source.readError) {
      findings.push(blockingFinding('BENCHMARK_SUITE_LOCK_SOURCE_READ_FAILED', source.readError, source.relativePath))
      continue
    }
    const expected = expectedRoleStatus(source.sourceKind)
    if (source.record?.artifactRole !== expected.role || source.record?.status !== expected.status) {
      findings.push(
        blockingFinding(
          'BENCHMARK_SUITE_LOCK_SOURCE_ROLE_STATUS_INVALID',
          `${source.relativePath} must be ${expected.role} with status ${expected.status}.`,
          source.relativePath,
        ),
      )
    }
    for (const hit of collectUnsafeAuthorityHits(source.record)) {
      findings.push({
        severity: 'error',
        findingLevel: 'blocking',
        code: 'BENCHMARK_SUITE_LOCK_UNSAFE_SOURCE_AUTHORITY_FLAG',
        message: `${source.relativePath} contains unsafe report-only benchmark flag ${hit.field}: true.`,
        path: source.relativePath,
        field: hit.field,
      })
    }
  }
  if (findings.length > 0) return findings
  findings.push(...validateIdentityAlignment(sources))
  return findings
}

function validateIdentityAlignment(sources: LoadedSource[]): BenchmarkSuiteLockFinding[] {
  const findings: BenchmarkSuiteLockFinding[] = []
  const suite = firstSource(sources, 'benchmark-suite')?.record ?? {}
  const tasks = sourcesOfKind(sources, 'benchmark-task')
  const goldens = sourcesOfKind(sources, 'golden-answer')
  const candidates = sourcesOfKind(sources, 'candidate-result')
  const evaluations = sourcesOfKind(sources, 'evaluation-report')
  const comparisonSummary = firstSource(sources, 'comparison-summary')
  const taskMap = new Map(
    tasks
      .map((source) => [stringValue(source.record?.taskId), source] as const)
      .filter((entry): entry is readonly [string, LoadedSource] => Boolean(entry[0])),
  )
  const suiteTaskIds = new Set(taskIdsFromSuite(suite))
  for (const task of tasks) {
    const taskId = stringValue(task.record?.taskId)
    if (taskId && suiteTaskIds.size > 0 && !suiteTaskIds.has(taskId)) {
      findings.push(
        blockingFinding(
          'BENCHMARK_SUITE_LOCK_TASK_NOT_IN_SUITE',
          `${task.relativePath} taskId ${taskId} is not declared by the benchmark suite.`,
          task.relativePath,
          'taskId',
        ),
      )
    }
  }
  for (const source of [...goldens, ...candidates, ...evaluations]) {
    const taskId = stringValue(source.record?.taskId)
    const task = taskId ? taskMap.get(taskId) : undefined
    if (!taskId || !task) {
      findings.push(
        blockingFinding(
          'BENCHMARK_SUITE_LOCK_TASK_ID_MISMATCH',
          `${source.relativePath} taskId ${taskId ?? 'missing'} does not match a supplied benchmark task.`,
          source.relativePath,
          'taskId',
        ),
      )
      continue
    }
    const sourceMode = stringValue(source.record?.projectMode)
    const taskMode = stringValue(task.record?.projectMode)
    if (sourceMode && taskMode && sourceMode !== taskMode) {
      findings.push(
        blockingFinding(
          'BENCHMARK_SUITE_LOCK_PROJECT_MODE_MISMATCH',
          `${source.relativePath} projectMode ${sourceMode} does not match task projectMode ${taskMode}.`,
          source.relativePath,
          'projectMode',
        ),
      )
    }
  }
  const candidatesByTaskArm = new Set(
    candidates
      .map((source) => identityKey(stringValue(source.record?.taskId), stringValue(source.record?.comparisonArm)))
      .filter((entry): entry is string => Boolean(entry)),
  )
  for (const evaluation of evaluations) {
    const key = identityKey(stringValue(evaluation.record?.taskId), stringValue(evaluation.record?.comparisonArm))
    if (!key || !candidatesByTaskArm.has(key)) {
      findings.push(
        blockingFinding(
          'BENCHMARK_SUITE_LOCK_EVALUATION_CANDIDATE_MISMATCH',
          `${evaluation.relativePath} does not match any supplied candidate result by taskId and comparisonArm.`,
          evaluation.relativePath,
          'comparisonArm',
        ),
      )
    }
  }
  for (const candidate of candidates) {
    const arm = normalizeComparisonArm(stringValue(candidate.record?.comparisonArm))
    const task = taskMap.get(stringValue(candidate.record?.taskId) ?? '')
    const allowed = comparisonArmList([
      ...stringArray(suite.comparisonArms),
      ...stringArray(task?.record?.comparisonArms),
    ])
    if (!arm || (allowed.length > 0 && !allowed.includes(arm))) {
      findings.push(
        blockingFinding(
          'BENCHMARK_SUITE_LOCK_COMPARISON_ARM_INVALID',
          `${candidate.relativePath} must declare a comparisonArm allowed by the suite or task.`,
          candidate.relativePath,
          'comparisonArm',
        ),
      )
    }
  }
  if (comparisonSummary?.record) {
    for (const evaluation of evaluations) {
      if (!summaryContainsEvaluation(comparisonSummary.record, evaluation.record ?? {})) {
        findings.push(
          blockingFinding(
            'BENCHMARK_SUITE_LOCK_COMPARISON_SUMMARY_MISMATCH',
            `${comparisonSummary.relativePath} does not include evaluation ${evaluation.relativePath} by taskId and comparisonArm.`,
            comparisonSummary.relativePath,
            'taskRows',
          ),
        )
      }
    }
  }
  return findings
}

function buildGovernanceFindings(sources: LoadedSource[]): BenchmarkSuiteLockFinding[] {
  const findings: BenchmarkSuiteLockFinding[] = []
  const goldens = sourcesOfKind(sources, 'golden-answer')
  const goldenReview = summarizeGoldenReview(goldens)
  if (goldenReview.status !== 'present') {
    findings.push({
      severity: 'warning',
      findingLevel: 'governance-gap',
      code: 'BENCHMARK_SUITE_LOCK_GOLDEN_REVIEW_METADATA_INCOMPLETE',
      message:
        'Golden-answer review metadata is missing or partial; the lock records source digests but does not invent approval.',
    })
  }
  const suite = firstSource(sources, 'benchmark-suite')?.record ?? {}
  const tasks = sourcesOfKind(sources, 'benchmark-task').flatMap((source) => (source.record ? [source.record] : []))
  if (summarizeHeldOutPolicy(suite, tasks) !== 'declared') {
    findings.push({
      severity: 'warning',
      findingLevel: 'governance-gap',
      code: 'BENCHMARK_SUITE_LOCK_HELD_OUT_POLICY_NOT_DECLARED',
      message: 'Held-out benchmark policy metadata is not declared; anti-overfitting governance remains partial.',
    })
  }
  return findings
}

async function loadSource(root: string, requestedPath: string, sourceKind: SourceKind): Promise<LoadedSource> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  const relative = relativePath(root, resolvedPath)
  try {
    const bytes = await readFile(resolvedPath)
    const sha = sha256(bytes)
    let record: JsonRecord
    try {
      record = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) as JsonRecord
    } catch (error) {
      return {
        requestedPath,
        resolvedPath,
        relativePath: relative,
        sourceKind,
        record: null,
        digest: {
          sourceKind,
          sourcePath: relative,
          sha256: sha,
          byteLength: bytes.byteLength,
          artifactRole: null,
          status: null,
          logicalIds: emptyLogicalIds(),
        },
        readError: error instanceof Error ? error.message : String(error),
      }
    }
    return {
      requestedPath,
      resolvedPath,
      relativePath: relative,
      sourceKind,
      record,
      digest: buildDigest(sourceKind, relative, sha, bytes.byteLength, record),
      readError: null,
    }
  } catch (error) {
    return {
      requestedPath,
      resolvedPath,
      relativePath: relative,
      sourceKind,
      record: null,
      digest: null,
      readError: error instanceof Error ? error.message : String(error),
    }
  }
}

function buildDigest(
  sourceKind: SourceKind,
  sourcePath: string,
  sha: string,
  byteLength: number,
  record: JsonRecord,
): BenchmarkSourceDigest {
  return {
    sourceKind,
    sourcePath,
    sha256: sha,
    byteLength,
    artifactRole: stringValue(record.artifactRole),
    status: stringValue(record.status),
    logicalIds: {
      suiteId: stringValue(record.suiteId) ?? stringValue(record.benchmarkSuiteId),
      taskId: stringValue(record.taskId),
      taskIds: taskIdsFromSuite(record),
      projectMode: stringValue(record.projectMode),
      comparisonArm: stringValue(record.comparisonArm),
      armComparisonGroupId: stringValue(record.armComparisonGroupId),
    },
  }
}

function buildDigestSummary(digests: BenchmarkSourceDigest[]): BenchmarkSuiteLockManifest['fixtureDigestSummary'] {
  const sorted = sortDigests(digests)
  return {
    suiteCount: countKind(sorted, 'benchmark-suite'),
    taskCount: countKind(sorted, 'benchmark-task'),
    goldenAnswerCount: countKind(sorted, 'golden-answer'),
    candidateResultCount: countKind(sorted, 'candidate-result'),
    evaluationReportCount: countKind(sorted, 'evaluation-report'),
    comparisonSummaryCount: countKind(sorted, 'comparison-summary'),
    graphifyImportValidationCount: countKind(sorted, 'graphify-import-validation'),
    sourceArtifactCount: sorted.length,
    combinedSha256: sha256(JSON.stringify(sorted)),
  }
}

function renderMarkdown(manifest: BenchmarkSuiteLockManifest): string {
  return [
    '# DevView Benchmark Suite Lock Manifest',
    '',
    `- status: ${manifest.status}`,
    `- suiteId: ${manifest.suiteId ?? 'unknown'}`,
    `- taskIds: ${manifest.taskIds.join(', ') || 'none'}`,
    `- comparisonArms: ${manifest.comparisonArms.join(', ') || 'none'}`,
    `- sourceArtifactCount: ${manifest.fixtureDigestSummary.sourceArtifactCount}`,
    `- combinedSha256: ${manifest.fixtureDigestSummary.combinedSha256}`,
    `- governanceCompletenessStatus: ${manifest.governanceCompletenessStatus}`,
    `- goldenReviewGovernance: ${manifest.goldenReviewGovernance.status}`,
    `- heldOutPolicyStatus: ${manifest.heldOutPolicyStatus}`,
    '',
    '## Source Digests',
    ...manifest.sourceArtifactDigests.map(
      (entry) => `- ${entry.sourceKind}: ${entry.sourcePath} (${entry.sha256}, ${entry.byteLength} bytes)`,
    ),
    '',
    '## Findings',
    ...(manifest.findings.length === 0
      ? ['- none']
      : manifest.findings.map((entry) => `- [${entry.severity}] ${entry.code}: ${entry.message}`)),
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

function validateRequiredOptions(options: BenchmarkSuiteLockOptions): void {
  if (!options.benchmarkSuite) throw new Error('benchmark lock-suite requires --benchmark-suite <file>.')
  if (parseInputList(options.tasks).length === 0) throw new Error('benchmark lock-suite requires --tasks <files>.')
  if (parseInputList(options.goldenAnswers).length === 0) {
    throw new Error('benchmark lock-suite requires --golden-answers <files>.')
  }
  if (parseInputList(options.candidateResults).length === 0) {
    throw new Error('benchmark lock-suite requires --candidate-results <files>.')
  }
  if (parseInputList(options.evaluations).length === 0) {
    throw new Error('benchmark lock-suite requires --evaluations <files>.')
  }
  if (!options.output) throw new Error('benchmark lock-suite requires --output <json>.')
}

function parseInputs(options: BenchmarkSuiteLockOptions): {
  benchmarkSuite: string
  tasks: string[]
  goldenAnswers: string[]
  candidateResults: string[]
  evaluations: string[]
  comparisonSummaries: string[]
  graphifyImportValidations: string[]
} {
  return {
    benchmarkSuite: options.benchmarkSuite ?? '',
    tasks: parseInputList(options.tasks),
    goldenAnswers: parseInputList(options.goldenAnswers),
    candidateResults: parseInputList(options.candidateResults),
    evaluations: parseInputList(options.evaluations),
    comparisonSummaries: parseInputList(options.comparisonSummary),
    graphifyImportValidations: parseInputList(options.graphifyImportValidations),
  }
}

function allRequestedPaths(inputs: ReturnType<typeof parseInputs>): string[] {
  return [
    inputs.benchmarkSuite,
    ...inputs.tasks,
    ...inputs.goldenAnswers,
    ...inputs.candidateResults,
    ...inputs.evaluations,
    ...inputs.comparisonSummaries,
    ...inputs.graphifyImportValidations,
  ]
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: BenchmarkSuiteLockOptions,
): Promise<void> {
  const outputPath = options.output ? resolveRepoPath(root, options.output) : null
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  if (!outputPath) throw new Error('benchmark lock-suite requires --output <json>.')
  const sourceSet = new Set(sourcePaths.map((entry) => path.resolve(entry)))
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('Benchmark suite lock JSON output and Markdown output must be different paths.')
  }
  for (const target of [outputPath, ...(markdownPath ? [markdownPath] : [])]) {
    const relativeTarget = relativePath(root, target)
    if (sourceSet.has(path.resolve(target))) {
      throw new Error(`Benchmark suite lock output would overwrite a source input: ${relativeTarget}.`)
    }
    if (
      hasDevViewControlDirectory(target) ||
      hasCodexControlDirectory(target) ||
      hasHiddenControlDirectorySegment(target)
    ) {
      throw new Error(`Benchmark suite lock output is inside a protected control path: ${relativeTarget}.`)
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(`Benchmark suite lock output would overwrite a source-authority-shaped path: ${relativeTarget}.`)
    }
  }
}

function expectedRoleStatus(sourceKind: SourceKind): { role: string; status: string } {
  switch (sourceKind) {
    case 'benchmark-suite':
      return { role: SUITE_ROLE, status: SUITE_STATUS }
    case 'benchmark-task':
      return { role: TASK_ROLE, status: TASK_STATUS }
    case 'golden-answer':
      return { role: GOLDEN_ROLE, status: GOLDEN_STATUS }
    case 'candidate-result':
      return { role: CANDIDATE_ROLE, status: CANDIDATE_STATUS }
    case 'evaluation-report':
      return { role: EVALUATION_ROLE, status: EVALUATION_STATUS }
    case 'comparison-summary':
      return { role: COMPARISON_ROLE, status: COMPARISON_STATUS }
    case 'graphify-import-validation':
      return { role: GRAPHIFY_VALIDATION_ROLE, status: GRAPHIFY_VALIDATION_STATUS }
  }
}

function summarizeGoldenReview(goldens: LoadedSource[]): BenchmarkSuiteLockManifest['goldenReviewGovernance'] {
  const reviewed = goldens.filter((source) => hasGoldenReviewMetadata(source.record ?? {}))
  return {
    status: reviewed.length === goldens.length ? 'present' : reviewed.length > 0 ? 'partial' : 'missing',
    reviewedGoldenAnswerCount: reviewed.length,
    totalGoldenAnswerCount: goldens.length,
    missingReviewMetadataPaths: goldens
      .filter((source) => !hasGoldenReviewMetadata(source.record ?? {}))
      .map((source) => source.relativePath),
    approvalInvented: false,
  }
}

function summarizeHeldOutPolicy(
  suite: JsonRecord,
  tasks: JsonRecord[],
): BenchmarkSuiteLockManifest['heldOutPolicyStatus'] {
  const records = [suite, ...tasks]
  const declaredCount = records.filter((record) =>
    ['heldOutPolicy', 'benchmarkPartition', 'antiOverfittingPolicy', 'isHeldOut', 'releaseSet'].some((key) =>
      Object.prototype.hasOwnProperty.call(record, key),
    ),
  ).length
  if (declaredCount === 0) return 'not-declared'
  return declaredCount === records.length ? 'declared' : 'partial'
}

function hasGoldenReviewMetadata(record: JsonRecord): boolean {
  return ['reviewer', 'reviewedBy', 'reviewStatus', 'approvedBy', 'goldenReview', 'approval'].some((key) =>
    Object.prototype.hasOwnProperty.call(record, key),
  )
}

function summaryContainsEvaluation(summary: JsonRecord, evaluation: JsonRecord): boolean {
  const taskId = stringValue(evaluation.taskId)
  const arm = stringValue(evaluation.comparisonArm)
  if (!taskId || !arm) return false
  return arrayRecords(summary.taskRows).some((row) => {
    if (stringValue(row.taskId) !== taskId) return false
    const armColumns = asRecord(row.armColumns)
    const armEntry = asRecord(armColumns?.[arm])
    return Boolean(armEntry && stringValue(armEntry.comparisonArm) === arm)
  })
}

function blockingFinding(code: string, message: string, pathValue?: string, field?: string): BenchmarkSuiteLockFinding {
  return { severity: 'error', findingLevel: 'blocking', code, message, path: pathValue, field }
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

function readPackageVersion(root: string): string {
  const candidates = [path.join(root, 'package.json'), path.join(findPluginRoot(import.meta.url), 'package.json')]
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(requireText(candidate)) as JsonRecord
      const version = stringValue(parsed.version)
      if (version) return version
    } catch {
      // Try the next deterministic package source.
    }
  }
  return 'unknown'
}

function requireText(filePath: string): string {
  return readFileSync(filePath, 'utf8')
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

function firstSource(sources: LoadedSource[], kind: SourceKind): LoadedSource | undefined {
  return sources.find((source) => source.sourceKind === kind)
}

function sourcesOfKind(sources: LoadedSource[], kind: SourceKind): LoadedSource[] {
  return sources.filter((source) => source.sourceKind === kind)
}

function countKind(digests: BenchmarkSourceDigest[], kind: SourceKind): number {
  return digests.filter((digest) => digest.sourceKind === kind).length
}

function sortDigests(digests: BenchmarkSourceDigest[]): BenchmarkSourceDigest[] {
  return [...digests].sort((a, b) => `${a.sourceKind}:${a.sourcePath}`.localeCompare(`${b.sourceKind}:${b.sourcePath}`))
}

function emptyLogicalIds(): BenchmarkSourceDigest['logicalIds'] {
  return {
    suiteId: null,
    taskId: null,
    taskIds: [],
    projectMode: null,
    comparisonArm: null,
    armComparisonGroupId: null,
  }
}

function taskIdsFromSuite(suite: JsonRecord): string[] {
  return uniqueStrings([
    ...stringArray(suite.taskIds),
    ...arrayRecords(suite.tasks)
      .map((entry) => stringValue(entry.taskId))
      .filter((entry): entry is string => Boolean(entry)),
  ])
}

function identityKey(taskId: string | null, arm: string | null): string | null {
  return taskId && arm ? `${taskId}:${arm}` : null
}

function parseInputList(value: string | undefined): string[] {
  if (!value) return []
  return uniqueStrings(
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  )
}

function comparisonArmList(values: string[]): ComparisonArm[] {
  return uniqueStrings(values)
    .map(normalizeComparisonArm)
    .filter((entry): entry is ComparisonArm => Boolean(entry))
}

function normalizeComparisonArm(value: string | null | undefined): ComparisonArm | null {
  return comparisonArms.includes(value as ComparisonArm) ? (value as ComparisonArm) : null
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
    : []
}

function arrayRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter((entry): entry is JsonRecord => isRecord(entry)) : []
}

function asRecord(value: unknown): JsonRecord | null {
  return isRecord(value) ? value : null
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
