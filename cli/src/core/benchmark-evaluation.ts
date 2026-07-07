import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
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
const REPORT_ROLE = 'devview-benchmark-evaluation-report'
const SCORED_STATUS = 'devview-benchmark-evaluation-scored'
const BLOCKED_STATUS = 'devview-benchmark-evaluation-blocked'

const comparisonArms = ['codex-only', 'codex-graphify', 'codex-devview', 'codex-graphify-devview'] as const
const dimensionOrder = [
  'taskSuccess',
  'scopeAccuracy',
  'contextPrecision',
  'contextRecall',
  'regressionRisk',
  'evidenceQuality',
  'graphUpdateQuality',
  'timeCostIterations',
  'userInterpretability',
] as const

const defaultWeights: Record<DimensionId, number> = {
  taskSuccess: 25,
  scopeAccuracy: 15,
  contextPrecision: 10,
  contextRecall: 10,
  regressionRisk: 10,
  evidenceQuality: 10,
  graphUpdateQuality: 8,
  timeCostIterations: 5,
  userInterpretability: 7,
}

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

type DimensionId = (typeof dimensionOrder)[number]
type ComparisonArm = (typeof comparisonArms)[number]

export interface BenchmarkEvaluationOptions {
  benchmarkSuite?: string
  task?: string
  goldenAnswer?: string
  candidateResult?: string
  output?: string
  markdown?: string
}

export interface BenchmarkEvaluationFinding {
  severity: 'info' | 'warning' | 'error'
  findingLevel: 'score-impact' | 'hard-failure' | 'blocking' | 'info'
  code: string
  dimension?: DimensionId
  message: string
  path?: string
  field?: string
}

export interface BenchmarkDimensionScore {
  dimensionId: DimensionId
  label: string
  score: number
  maxScore: number
  ratio: number
  findings: string[]
}

export interface BenchmarkEvaluationReport {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof SCORED_STATUS | typeof BLOCKED_STATUS
  evaluationScope: 'benchmark-golden-answer-evaluation-report-only'
  benchmarkSuiteId: string | null
  taskId: string | null
  projectMode: string | null
  comparisonArm: ComparisonArm | null
  armComparisonGroupId: string | null
  sourceBenchmarkSuite: string
  sourceTask: string
  sourceGoldenAnswer: string
  sourceCandidateResult: string
  sourceIdentityComparison: {
    suiteTaskStatus: 'matched' | 'not-modeled' | 'mismatched'
    taskGoldenStatus: 'matched' | 'mismatched'
    taskCandidateStatus: 'matched' | 'mismatched'
    projectModeStatus: 'matched' | 'not-modeled' | 'mismatched'
    comparisonArmStatus: 'matched' | 'scored-arm-recorded' | 'mismatched'
  }
  overallScore: number
  maxScore: number
  passThreshold: number
  passed: boolean
  dimensionScores: BenchmarkDimensionScore[]
  hardFailures: BenchmarkEvaluationFinding[]
  findings: BenchmarkEvaluationFinding[]
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
  record: JsonRecord | null
  readError: string | null
}

interface LoadedInputs {
  suite: LoadedSource
  task: LoadedSource
  golden: LoadedSource
  candidate: LoadedSource
}

export class BenchmarkEvaluationValidationError extends Error {
  readonly report: BenchmarkEvaluationReport

  constructor(report: BenchmarkEvaluationReport) {
    super('Benchmark evaluation is blocked.')
    this.report = report
  }
}

export async function evaluateBenchmarkResult(
  root: string,
  options: BenchmarkEvaluationOptions,
): Promise<BenchmarkEvaluationReport> {
  validateRequiredOptions(options)
  const sourcePaths = [
    resolveRepoPath(root, options.benchmarkSuite ?? ''),
    resolveRepoPath(root, options.task ?? ''),
    resolveRepoPath(root, options.goldenAnswer ?? ''),
    resolveRepoPath(root, options.candidateResult ?? ''),
  ]
  await assertOutputAuthority(root, sourcePaths, options)

  const inputs: LoadedInputs = {
    suite: await loadSource(root, options.benchmarkSuite ?? ''),
    task: await loadSource(root, options.task ?? ''),
    golden: await loadSource(root, options.goldenAnswer ?? ''),
    candidate: await loadSource(root, options.candidateResult ?? ''),
  }

  const blockingFindings = validateSources(inputs)
  if (blockingFindings.length > 0) {
    throw new BenchmarkEvaluationValidationError(buildReport(inputs, blockingFindings, true))
  }

  const report = buildReport(inputs, [], false)
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
  inputs: LoadedInputs,
  blockingFindings: BenchmarkEvaluationFinding[],
  blocked: boolean,
): BenchmarkEvaluationReport {
  const suite = inputs.suite.record ?? {}
  const task = inputs.task.record ?? {}
  const golden = inputs.golden.record ?? {}
  const candidate = inputs.candidate.record ?? {}
  const identity = compareIdentity(suite, task, golden, candidate)
  const weights = resolveWeights(suite, task, golden)
  const scoringFindings: BenchmarkEvaluationFinding[] = []
  const hardFailures: BenchmarkEvaluationFinding[] = []
  const dimensionScores = blocked
    ? dimensionOrder.map((dimensionId) => scoreDimension(dimensionId, 0, weights[dimensionId], []))
    : scoreAllDimensions(golden, candidate, weights, scoringFindings, hardFailures)
  const overallScore = roundScore(dimensionScores.reduce((sum, entry) => sum + entry.score, 0))
  const maxScore = roundScore(dimensionScores.reduce((sum, entry) => sum + entry.maxScore, 0))
  const passThreshold =
    numberValue(golden.passThreshold) ?? numberValue(task.passThreshold) ?? numberValue(suite.passThreshold) ?? 70
  const findings = [...blockingFindings, ...scoringFindings, ...hardFailures]
  const comparisonArm = normalizeComparisonArm(
    stringValue(candidate.comparisonArm) ?? stringValue(golden.comparisonArm),
  )

  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : SCORED_STATUS,
    evaluationScope: 'benchmark-golden-answer-evaluation-report-only',
    benchmarkSuiteId: stringValue(suite.suiteId) ?? null,
    taskId: stringValue(task.taskId) ?? stringValue(golden.taskId) ?? stringValue(candidate.taskId) ?? null,
    projectMode:
      stringValue(task.projectMode) ?? stringValue(golden.projectMode) ?? stringValue(candidate.projectMode) ?? null,
    comparisonArm,
    armComparisonGroupId:
      stringValue(candidate.armComparisonGroupId) ??
      stringValue(golden.armComparisonGroupId) ??
      stringValue(task.armComparisonGroupId) ??
      stringValue(suite.armComparisonGroupId) ??
      null,
    sourceBenchmarkSuite: inputs.suite.relativePath,
    sourceTask: inputs.task.relativePath,
    sourceGoldenAnswer: inputs.golden.relativePath,
    sourceCandidateResult: inputs.candidate.relativePath,
    sourceIdentityComparison: identity,
    overallScore,
    maxScore,
    passThreshold,
    passed: !blocked && hardFailures.length === 0 && overallScore >= passThreshold,
    dimensionScores,
    hardFailures,
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

function validateSources(inputs: LoadedInputs): BenchmarkEvaluationFinding[] {
  const findings: BenchmarkEvaluationFinding[] = []
  validateRead(inputs.suite, 'BENCHMARK_SUITE_READ_FAILED', findings)
  validateRead(inputs.task, 'BENCHMARK_TASK_READ_FAILED', findings)
  validateRead(inputs.golden, 'BENCHMARK_GOLDEN_ANSWER_READ_FAILED', findings)
  validateRead(inputs.candidate, 'BENCHMARK_CANDIDATE_RESULT_READ_FAILED', findings)
  validateRoleStatus(inputs.suite, SUITE_ROLE, SUITE_STATUS, 'BENCHMARK_SUITE_ROLE_STATUS_INVALID', findings)
  validateRoleStatus(inputs.task, TASK_ROLE, TASK_STATUS, 'BENCHMARK_TASK_ROLE_STATUS_INVALID', findings)
  validateRoleStatus(inputs.golden, GOLDEN_ROLE, GOLDEN_STATUS, 'BENCHMARK_GOLDEN_ANSWER_ROLE_STATUS_INVALID', findings)
  validateRoleStatus(
    inputs.candidate,
    CANDIDATE_ROLE,
    CANDIDATE_STATUS,
    'BENCHMARK_CANDIDATE_RESULT_ROLE_STATUS_INVALID',
    findings,
  )

  for (const input of Object.values(inputs)) {
    for (const hit of collectUnsafeAuthorityHits(input.record)) {
      findings.push({
        severity: 'error',
        findingLevel: 'blocking',
        code: 'BENCHMARK_UNSAFE_SOURCE_AUTHORITY_FLAG',
        message: `${input.relativePath} contains unsafe report-only benchmark flag ${hit.field}: true.`,
        path: input.relativePath,
        field: hit.field,
      })
    }
  }

  const suite = inputs.suite.record ?? {}
  const task = inputs.task.record ?? {}
  const golden = inputs.golden.record ?? {}
  const candidate = inputs.candidate.record ?? {}
  const identity = compareIdentity(suite, task, golden, candidate)
  if (identity.suiteTaskStatus === 'mismatched') {
    findings.push(blockingIdentityFinding('BENCHMARK_SUITE_TASK_MISMATCH', 'Suite does not include the task id.'))
  }
  if (identity.taskGoldenStatus === 'mismatched') {
    findings.push(blockingIdentityFinding('BENCHMARK_TASK_GOLDEN_MISMATCH', 'Task id does not match golden answer.'))
  }
  if (identity.taskCandidateStatus === 'mismatched') {
    findings.push(
      blockingIdentityFinding('BENCHMARK_TASK_CANDIDATE_MISMATCH', 'Task id does not match candidate result.'),
    )
  }
  if (identity.projectModeStatus === 'mismatched') {
    findings.push(blockingIdentityFinding('BENCHMARK_PROJECT_MODE_MISMATCH', 'Project mode is inconsistent.'))
  }
  if (identity.comparisonArmStatus === 'mismatched') {
    findings.push(
      blockingIdentityFinding('BENCHMARK_COMPARISON_ARM_MISMATCH', 'Comparison arm is unsupported or inconsistent.'),
    )
  }
  return findings
}

function validateRead(source: LoadedSource, code: string, findings: BenchmarkEvaluationFinding[]): void {
  if (source.readError) {
    findings.push({
      severity: 'error',
      findingLevel: 'blocking',
      code,
      message: source.readError,
      path: source.relativePath,
    })
  }
}

function validateRoleStatus(
  source: LoadedSource,
  role: string,
  status: string,
  code: string,
  findings: BenchmarkEvaluationFinding[],
): void {
  if (!source.record) return
  if (source.record.artifactRole !== role || source.record.status !== status) {
    findings.push({
      severity: 'error',
      findingLevel: 'blocking',
      code,
      message: `${source.relativePath} must be ${role} with status ${status}.`,
      path: source.relativePath,
    })
  }
}

function compareIdentity(
  suite: JsonRecord,
  task: JsonRecord,
  golden: JsonRecord,
  candidate: JsonRecord,
): BenchmarkEvaluationReport['sourceIdentityComparison'] {
  const taskId = stringValue(task.taskId)
  const goldenTaskId = stringValue(golden.taskId)
  const candidateTaskId = stringValue(candidate.taskId)
  const suiteTasks = taskIdsFromSuite(suite)
  const suiteTaskStatus =
    !taskId || suiteTasks.length === 0 ? 'not-modeled' : suiteTasks.includes(taskId) ? 'matched' : 'mismatched'
  const taskGoldenStatus = taskId && goldenTaskId && taskId === goldenTaskId ? 'matched' : 'mismatched'
  const taskCandidateStatus = taskId && candidateTaskId && taskId === candidateTaskId ? 'matched' : 'mismatched'
  const modes = uniqueStrings([task.projectMode, golden.projectMode, candidate.projectMode].map(stringValue))
  const projectModeStatus = modes.length <= 1 ? (modes.length === 0 ? 'not-modeled' : 'matched') : 'mismatched'
  const candidateArm = normalizeComparisonArm(stringValue(candidate.comparisonArm))
  const goldenArm = normalizeComparisonArm(stringValue(golden.comparisonArm))
  const allowedArms = comparisonArmList(golden.expectedComparisonArms ?? task.comparisonArms ?? suite.comparisonArms)
  const comparisonArmStatus =
    !candidateArm ||
    (goldenArm && candidateArm !== goldenArm) ||
    (allowedArms.length > 0 && !allowedArms.includes(candidateArm))
      ? 'mismatched'
      : goldenArm || allowedArms.length > 0
        ? 'matched'
        : 'scored-arm-recorded'
  return { suiteTaskStatus, taskGoldenStatus, taskCandidateStatus, projectModeStatus, comparisonArmStatus }
}

function scoreAllDimensions(
  golden: JsonRecord,
  candidate: JsonRecord,
  weights: Record<DimensionId, number>,
  findings: BenchmarkEvaluationFinding[],
  hardFailures: BenchmarkEvaluationFinding[],
): BenchmarkDimensionScore[] {
  return [
    scoreTaskSuccess(golden, candidate, weights.taskSuccess, findings),
    scoreScopeAccuracy(golden, candidate, weights.scopeAccuracy, findings, hardFailures),
    scoreContextPrecision(golden, candidate, weights.contextPrecision, findings),
    scoreContextRecall(golden, candidate, weights.contextRecall, findings),
    scoreRegressionRisk(golden, candidate, weights.regressionRisk, findings),
    scoreEvidenceQuality(golden, candidate, weights.evidenceQuality, findings),
    scoreGraphUpdateQuality(golden, candidate, weights.graphUpdateQuality, findings),
    scoreTimeCostIterations(golden, candidate, weights.timeCostIterations, findings),
    scoreUserInterpretability(candidate, weights.userInterpretability, findings),
  ]
}

function scoreTaskSuccess(
  golden: JsonRecord,
  candidate: JsonRecord,
  maxScore: number,
  findings: BenchmarkEvaluationFinding[],
): BenchmarkDimensionScore {
  const expected = stringValue(golden.expectedOutcome)
  const actual = stringValue(candidate.reportedOutcome)
  const ratio = expected && actual && expected === actual ? 1 : 0
  if (ratio === 0) {
    findings.push(
      scoreFinding(
        'BENCHMARK_TASK_OUTCOME_MISMATCH',
        'taskSuccess',
        'Reported outcome does not match the golden expected outcome.',
      ),
    )
  }
  return scoreDimension('taskSuccess', ratio, maxScore, ratio === 1 ? [] : ['outcome-mismatch'])
}

function scoreScopeAccuracy(
  golden: JsonRecord,
  candidate: JsonRecord,
  maxScore: number,
  findings: BenchmarkEvaluationFinding[],
  hardFailures: BenchmarkEvaluationFinding[],
): BenchmarkDimensionScore {
  const changed = normalizedSet(pathsFromArray(candidate.changedFiles))
  const forbidden = normalizedSet(stringArray(golden.forbiddenFiles))
  const required = normalizedSet(stringArray(golden.requiredTouchedFiles))
  const allowed = normalizedSet([
    ...stringArray(golden.allowedFiles),
    ...stringArray(golden.requiredTouchedFiles),
    ...stringArray(golden.optionalTouchedFiles),
  ])
  const forbiddenTouched = [...changed].filter((entry) => forbidden.has(entry))
  if (forbiddenTouched.length > 0) {
    const finding = hardFailure(
      'BENCHMARK_FORBIDDEN_FILE_MUTATION',
      'scopeAccuracy',
      `Forbidden file mutation: ${forbiddenTouched.join(', ')}`,
    )
    hardFailures.push(finding)
    return scoreDimension('scopeAccuracy', 0, maxScore, ['forbidden-file-mutation'])
  }
  const requiredRatio = required.size === 0 ? 1 : intersectionCount(required, changed) / required.size
  const allowedRatio =
    changed.size === 0 || allowed.size === 0
      ? 1
      : [...changed].filter((entry) => allowed.has(entry)).length / changed.size
  const ratio = requiredRatio * 0.7 + allowedRatio * 0.3
  if (ratio < 1) {
    findings.push(
      scoreFinding(
        'BENCHMARK_SCOPE_ACCURACY_PARTIAL',
        'scopeAccuracy',
        'Changed files do not fully match required/allowed scope.',
      ),
    )
  }
  return scoreDimension('scopeAccuracy', ratio, maxScore, ratio === 1 ? [] : ['scope-partial'])
}

function scoreContextPrecision(
  golden: JsonRecord,
  candidate: JsonRecord,
  maxScore: number,
  findings: BenchmarkEvaluationFinding[],
): BenchmarkDimensionScore {
  const selected = selectedContextSet(candidate.selectedContext)
  const expected = selectedContextSet(golden.expectedContext)
  const forbidden = selectedContextSet(golden.forbiddenContext)
  if (selected.size === 0) {
    const ratio = expected.size === 0 ? 1 : 0
    if (ratio === 0)
      findings.push(
        scoreFinding(
          'BENCHMARK_CONTEXT_PRECISION_EMPTY',
          'contextPrecision',
          'Candidate did not declare selected context.',
        ),
      )
    return scoreDimension('contextPrecision', ratio, maxScore, ratio === 1 ? [] : ['no-selected-context'])
  }
  const relevant = [...selected].filter((entry) => expected.has(entry)).length
  const forbiddenSelected = [...selected].filter((entry) => forbidden.has(entry)).length
  const ratio = Math.max(0, (relevant - forbiddenSelected) / selected.size)
  if (ratio < 1) {
    findings.push(
      scoreFinding(
        'BENCHMARK_CONTEXT_PRECISION_PARTIAL',
        'contextPrecision',
        'Selected context includes irrelevant or forbidden entries.',
      ),
    )
  }
  return scoreDimension('contextPrecision', ratio, maxScore, ratio === 1 ? [] : ['context-precision-partial'])
}

function scoreContextRecall(
  golden: JsonRecord,
  candidate: JsonRecord,
  maxScore: number,
  findings: BenchmarkEvaluationFinding[],
): BenchmarkDimensionScore {
  const selected = selectedContextSet(candidate.selectedContext)
  const expected = selectedContextSet(golden.expectedContext)
  const ratio = expected.size === 0 ? 1 : intersectionCount(expected, selected) / expected.size
  if (ratio < 1) {
    findings.push(
      scoreFinding('BENCHMARK_CONTEXT_RECALL_PARTIAL', 'contextRecall', 'Selected context misses expected entries.'),
    )
  }
  return scoreDimension('contextRecall', ratio, maxScore, ratio === 1 ? [] : ['context-recall-partial'])
}

function scoreRegressionRisk(
  golden: JsonRecord,
  candidate: JsonRecord,
  maxScore: number,
  findings: BenchmarkEvaluationFinding[],
): BenchmarkDimensionScore {
  const expected = asRecord(golden.regressionExpectations)
  const candidateSignals = asRecord(candidate.regressionSignals)
  if (expected?.parityPreserved !== true) return scoreDimension('regressionRisk', 1, maxScore, [])
  if (candidateSignals?.parityPreserved === true) return scoreDimension('regressionRisk', 1, maxScore, [])
  if (candidateSignals?.parityPreserved === false) {
    findings.push(
      scoreFinding(
        'BENCHMARK_REGRESSION_PARITY_FAILED',
        'regressionRisk',
        'Candidate reports parity was not preserved.',
      ),
    )
    return scoreDimension('regressionRisk', 0, maxScore, ['parity-not-preserved'])
  }
  findings.push(
    scoreFinding(
      'BENCHMARK_REGRESSION_PARITY_UNKNOWN',
      'regressionRisk',
      'Candidate does not declare parity preservation.',
    ),
  )
  return scoreDimension('regressionRisk', 0.5, maxScore, ['parity-unknown'])
}

function scoreEvidenceQuality(
  golden: JsonRecord,
  candidate: JsonRecord,
  maxScore: number,
  findings: BenchmarkEvaluationFinding[],
): BenchmarkDimensionScore {
  const required = evidenceIds(golden.requiredEvidence)
  const provided = evidenceIds(candidate.providedEvidence ?? asRecord(candidate.evidenceSummary)?.providedEvidence)
  const ratio = required.size === 0 ? 1 : intersectionCount(required, provided) / required.size
  if (ratio < 1) {
    findings.push(
      scoreFinding(
        'BENCHMARK_REQUIRED_EVIDENCE_MISSING',
        'evidenceQuality',
        'Candidate evidence does not cover all required evidence ids.',
      ),
    )
  }
  return scoreDimension('evidenceQuality', ratio, maxScore, ratio === 1 ? [] : ['required-evidence-missing'])
}

function scoreGraphUpdateQuality(
  golden: JsonRecord,
  candidate: JsonRecord,
  maxScore: number,
  findings: BenchmarkEvaluationFinding[],
): BenchmarkDimensionScore {
  const expected = operationKeys(asRecord(golden.expectedGraphDelta)?.operations)
  const actual = operationKeys(
    asRecord(candidate.graphDeltaSummary)?.operations ?? asRecord(candidate.producedGraphDelta)?.operations,
  )
  const ratio = expected.size === 0 ? 1 : intersectionCount(expected, actual) / expected.size
  if (ratio < 1) {
    findings.push(
      scoreFinding(
        'BENCHMARK_GRAPH_DELTA_MISMATCH',
        'graphUpdateQuality',
        'Candidate graph delta summary does not match expected operations.',
      ),
    )
  }
  return scoreDimension('graphUpdateQuality', ratio, maxScore, ratio === 1 ? [] : ['graph-delta-mismatch'])
}

function scoreTimeCostIterations(
  golden: JsonRecord,
  candidate: JsonRecord,
  maxScore: number,
  findings: BenchmarkEvaluationFinding[],
): BenchmarkDimensionScore {
  const metrics = asRecord(candidate.executionMetrics)
  const budget = asRecord(golden.executionBudgets)
  const maxIterations = numberValue(budget?.maxIterations) ?? 5
  const iterations = numberValue(metrics?.iterationCount)
  if (iterations === null) {
    findings.push(
      scoreFinding(
        'BENCHMARK_EXECUTION_METRICS_MISSING',
        'timeCostIterations',
        'Candidate does not declare iteration metrics.',
      ),
    )
    return scoreDimension('timeCostIterations', 0.5, maxScore, ['metrics-missing'])
  }
  const ratio =
    iterations <= maxIterations ? 1 : Math.max(0, 1 - (iterations - maxIterations) / Math.max(maxIterations * 2, 1))
  if (ratio < 1) {
    findings.push(
      scoreFinding(
        'BENCHMARK_ITERATION_BUDGET_EXCEEDED',
        'timeCostIterations',
        'Candidate exceeds the iteration budget.',
      ),
    )
  }
  return scoreDimension('timeCostIterations', ratio, maxScore, ratio === 1 ? [] : ['iteration-budget-exceeded'])
}

function scoreUserInterpretability(
  candidate: JsonRecord,
  maxScore: number,
  findings: BenchmarkEvaluationFinding[],
): BenchmarkDimensionScore {
  const summary = asRecord(candidate.workJournalSummary) ?? asRecord(candidate.interpretabilitySummary)
  if (!summary) {
    findings.push(
      scoreFinding(
        'BENCHMARK_INTERPRETABILITY_MISSING',
        'userInterpretability',
        'Candidate does not include Work Journal or interpretability summary.',
      ),
    )
    return scoreDimension('userInterpretability', 0, maxScore, ['interpretability-missing'])
  }
  const checks = [
    Boolean(stringValue(summary.status) ?? stringValue(summary.runStatus)),
    Boolean(stringValue(summary.nextAction)),
    summary.authoritySummaryVisible === true || summary.authorityStateVisible === true,
    summary.sourceFactSummaryVisible === true || summary.provenanceAvailable === true,
  ]
  const ratio = checks.filter(Boolean).length / checks.length
  if (ratio < 1) {
    findings.push(
      scoreFinding(
        'BENCHMARK_INTERPRETABILITY_PARTIAL',
        'userInterpretability',
        'Work Journal interpretability summary is incomplete.',
      ),
    )
  }
  return scoreDimension('userInterpretability', ratio, maxScore, ratio === 1 ? [] : ['interpretability-partial'])
}

function scoreDimension(
  dimensionId: DimensionId,
  ratioInput: number,
  maxScore: number,
  findings: string[],
): BenchmarkDimensionScore {
  const ratio = clamp01(ratioInput)
  return {
    dimensionId,
    label: dimensionLabel(dimensionId),
    score: roundScore(maxScore * ratio),
    maxScore,
    ratio: roundScore(ratio),
    findings,
  }
}

function resolveWeights(suite: JsonRecord, task: JsonRecord, golden: JsonRecord): Record<DimensionId, number> {
  const override = asRecord(golden.rubricWeights) ?? asRecord(task.rubricWeights) ?? asRecord(suite.rubricWeights) ?? {}
  const result = { ...defaultWeights }
  for (const dimensionId of dimensionOrder) {
    const value = numberValue(override[dimensionId])
    if (value !== null && value >= 0) result[dimensionId] = value
  }
  return result
}

function renderMarkdown(report: BenchmarkEvaluationReport): string {
  return [
    '# DevView Benchmark Evaluation',
    '',
    `- status: ${report.status}`,
    `- taskId: ${report.taskId ?? 'unknown'}`,
    `- comparisonArm: ${report.comparisonArm ?? 'unknown'}`,
    `- score: ${report.overallScore}/${report.maxScore}`,
    `- passed: ${String(report.passed)}`,
    `- hardFailures: ${report.hardFailures.length}`,
    '',
    '## Dimensions',
    ...report.dimensionScores.map(
      (entry) => `- ${entry.dimensionId}: ${entry.score}/${entry.maxScore} (${entry.ratio})`,
    ),
    '',
    '## Findings',
    ...(report.findings.length === 0
      ? ['- none']
      : report.findings.map((entry) => `- ${entry.severity} ${entry.code}: ${entry.message}`)),
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

async function loadSource(root: string, requestedPath: string): Promise<LoadedSource> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  const relative = relativePath(root, resolvedPath)
  const result = await readJsonSafe<JsonRecord>(resolvedPath)
  if (!result.ok) {
    return { requestedPath, resolvedPath, relativePath: relative, record: null, readError: result.error }
  }
  return { requestedPath, resolvedPath, relativePath: relative, record: result.value, readError: null }
}

function validateRequiredOptions(options: BenchmarkEvaluationOptions): void {
  if (!options.benchmarkSuite) throw new Error('benchmark evaluate-result requires --benchmark-suite <file>.')
  if (!options.task) throw new Error('benchmark evaluate-result requires --task <file>.')
  if (!options.goldenAnswer) throw new Error('benchmark evaluate-result requires --golden-answer <file>.')
  if (!options.candidateResult) throw new Error('benchmark evaluate-result requires --candidate-result <file>.')
  if (!options.output) throw new Error('benchmark evaluate-result requires --output <json>.')
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: BenchmarkEvaluationOptions,
): Promise<void> {
  const outputPath = options.output ? resolveRepoPath(root, options.output) : null
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  if (!outputPath) throw new Error('benchmark evaluate-result requires --output <json>.')
  const sourceSet = new Set(sourcePaths.map((entry) => path.resolve(entry)))
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('Benchmark evaluation JSON output and Markdown output must be different paths.')
  }
  for (const target of [outputPath, ...(markdownPath ? [markdownPath] : [])]) {
    const relativeTarget = relativePath(root, target)
    if (sourceSet.has(path.resolve(target))) {
      throw new Error(`Benchmark evaluation output would overwrite a source input: ${relativeTarget}.`)
    }
    if (
      hasDevViewControlDirectory(target) ||
      hasCodexControlDirectory(target) ||
      hasHiddenControlDirectorySegment(target)
    ) {
      throw new Error(`Benchmark evaluation output is inside a protected control path: ${relativeTarget}.`)
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(`Benchmark evaluation output would overwrite a source-authority-shaped path: ${relativeTarget}.`)
    }
  }
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

function taskIdsFromSuite(suite: JsonRecord): string[] {
  return uniqueStrings([
    ...stringArray(suite.taskIds),
    ...arrayRecords(suite.tasks).map((entry) => stringValue(entry.taskId)),
  ])
}

function comparisonArmList(value: unknown): ComparisonArm[] {
  return stringArray(value)
    .map(normalizeComparisonArm)
    .filter((entry): entry is ComparisonArm => Boolean(entry))
}

function normalizeComparisonArm(value: string | null | undefined): ComparisonArm | null {
  return comparisonArms.includes(value as ComparisonArm) ? (value as ComparisonArm) : null
}

function pathsFromArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (typeof entry === 'string') return entry
      const record = asRecord(entry)
      return stringValue(record?.path) ?? stringValue(record?.file) ?? stringValue(record?.filePath)
    })
    .filter((entry): entry is string => Boolean(entry))
}

function selectedContextSet(value: unknown): Set<string> {
  const record = asRecord(value)
  if (!record) return new Set()
  return normalizedSet([
    ...stringArray(record.files).map((entry) => `file:${entry}`),
    ...stringArray(record.nodeIds).map((entry) => `node:${entry}`),
    ...stringArray(record.edgeIds).map((entry) => `edge:${entry}`),
    ...stringArray(record.evidenceIds).map((entry) => `evidence:${entry}`),
  ])
}

function evidenceIds(value: unknown): Set<string> {
  if (!Array.isArray(value)) return new Set()
  return normalizedSet(
    value
      .map((entry) => {
        if (typeof entry === 'string') return entry
        const record = asRecord(entry)
        return stringValue(record?.evidenceId) ?? stringValue(record?.id)
      })
      .filter((entry): entry is string => Boolean(entry)),
  )
}

function operationKeys(value: unknown): Set<string> {
  if (!Array.isArray(value)) return new Set()
  return normalizedSet(
    value
      .map((entry) => {
        const record = asRecord(entry)
        if (!record) return null
        const operationId = stringValue(record.operationId) ?? stringValue(record.id)
        if (operationId) return `id:${operationId}`
        return [
          stringValue(record.action),
          stringValue(record.targetKind),
          stringValue(record.targetId),
          stringValue(record.fieldPath),
        ]
          .filter(Boolean)
          .join('|')
      })
      .filter((entry): entry is string => Boolean(entry)),
  )
}

function normalizedSet(values: string[]): Set<string> {
  return new Set(values.map((entry) => entry.replace(/\\/g, '/').toLowerCase()))
}

function intersectionCount(left: Set<string>, right: Set<string>): number {
  return [...left].filter((entry) => right.has(entry)).length
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((entry): entry is string => Boolean(entry)))]
}

function blockingIdentityFinding(code: string, message: string): BenchmarkEvaluationFinding {
  return { severity: 'error', findingLevel: 'blocking', code, message }
}

function scoreFinding(code: string, dimension: DimensionId, message: string): BenchmarkEvaluationFinding {
  return { severity: 'warning', findingLevel: 'score-impact', code, dimension, message }
}

function hardFailure(code: string, dimension: DimensionId, message: string): BenchmarkEvaluationFinding {
  return { severity: 'error', findingLevel: 'hard-failure', code, dimension, message }
}

function dimensionLabel(dimensionId: DimensionId): string {
  const labels: Record<DimensionId, string> = {
    taskSuccess: 'Task success',
    scopeAccuracy: 'Scope accuracy',
    contextPrecision: 'Context precision',
    contextRecall: 'Context recall',
    regressionRisk: 'Regression risk',
    evidenceQuality: 'Evidence quality',
    graphUpdateQuality: 'Graph/update quality',
    timeCostIterations: 'Time/cost/iterations',
    userInterpretability: 'User interpretability / Work Journal usefulness',
  }
  return labels[dimensionId]
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : null
}

function arrayRecords(value: unknown): JsonRecord[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is JsonRecord => Boolean(asRecord(entry)))
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
