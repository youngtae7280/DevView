import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('benchmark summarize-comparison CLI', () => {
  it('aggregates native fixture reports into a four-arm comparison matrix', async () => {
    const workspace = createWorkspace()
    const devviewEvaluation = await evaluateFixture(
      workspace,
      'native-minimal',
      'candidate.codex-devview.json',
      '.tmp/native-devview-evaluation.json',
    )
    const graphifyEvaluation = await evaluateFixture(
      workspace,
      'native-minimal',
      'candidate.codex-graphify.json',
      '.tmp/native-graphify-evaluation.json',
    )
    const graphifyDevviewEvaluation = await evaluateFixture(
      workspace,
      'native-minimal',
      'candidate.codex-graphify-devview.json',
      '.tmp/native-graphify-devview-evaluation.json',
    )
    const codexOnlyEvaluation = await evaluateFixture(
      workspace,
      'native-minimal',
      'candidate.codex-only.json',
      '.tmp/native-codex-only-evaluation.json',
    )

    const result = await runDevViewCli(
      [
        ...comparisonArgs(
          [devviewEvaluation, graphifyEvaluation, graphifyDevviewEvaluation, codexOnlyEvaluation],
          '.tmp/native-comparison-summary.json',
        ),
        '--markdown',
        '.tmp/native-comparison-summary.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const taskRow = payload.taskRows[0]
    const delta = payload.aggregateDeltas.find((entry: { label: string }) => entry.label === 'DevView vs Codex-only')
    const graphifyDelta = payload.aggregateDeltas.find(
      (entry: { label: string }) => entry.label === 'Graphify vs Codex-only',
    )
    const graphifyDevviewDelta = payload.aggregateDeltas.find(
      (entry: { label: string }) => entry.label === 'DevView+Graphify vs DevView',
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-benchmark-comparison-summary-report')
    expect(payload.status).toBe('devview-benchmark-comparison-summarized')
    expect(payload.groupCount).toBe(1)
    expect(taskRow.projectMode).toBe('native')
    expect(taskRow.armColumns['codex-devview'].overallScore).toBeGreaterThan(
      taskRow.armColumns['codex-only'].overallScore,
    )
    expect(taskRow.armColumns['codex-graphify'].comparisonArm).toBe('codex-graphify')
    expect(taskRow.armColumns['codex-graphify-devview'].comparisonArm).toBe('codex-graphify-devview')
    expect(
      taskRow.armColumns['codex-graphify-devview'].sourceCandidateFacts.graphifyImportValidationReportPresent,
    ).toBe(true)
    expect(taskRow.missingArms).toEqual([])
    expect(delta.overallScoreDelta).toBeGreaterThan(0)
    expect(delta.passedDelta).toBe('improved')
    expect(graphifyDelta.overallScoreDelta).toBeGreaterThan(0)
    expect(graphifyDevviewDelta.overallScoreDelta).toBeGreaterThanOrEqual(0)
    expect(payload.interpretabilitySummary.workJournalUsefulnessAverage).toBeGreaterThan(0)
    expect(existsSync(join(workspace, '.tmp/native-comparison-summary.md'))).toBe(true)
    expectSafetyFalse(payload)
  })

  it('aggregates retrofit fixture reports and preserves Graphify comparison arm labels', async () => {
    const workspace = createWorkspace()
    const devviewEvaluation = await evaluateFixture(
      workspace,
      'retrofit-minimal',
      'candidate.codex-devview.json',
      '.tmp/retrofit-devview-evaluation.json',
    )
    const graphifyEvaluation = await evaluateFixture(
      workspace,
      'retrofit-minimal',
      'candidate.codex-graphify.json',
      '.tmp/retrofit-graphify-evaluation.json',
    )

    const result = await runDevViewCli(
      [...comparisonArgs([devviewEvaluation, graphifyEvaluation], '.tmp/retrofit-comparison-summary.json'), '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const taskRow = payload.taskRows[0]

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(taskRow.projectMode).toBe('retrofit')
    expect(taskRow.armColumns['codex-devview'].comparisonArm).toBe('codex-devview')
    expect(taskRow.armColumns['codex-graphify'].comparisonArm).toBe('codex-graphify')
    expect(taskRow.armColumns['codex-graphify'].sourceEvaluationReport).toBe('.tmp/retrofit-graphify-evaluation.json')
    expect(taskRow.missingArms).toEqual(expect.arrayContaining(['codex-only', 'codex-graphify-devview']))
    expect(payload.aggregateDeltas).toEqual([])
    expectSafetyFalse(payload)
  })

  it('blocks wrong evaluation role/status with zero-write behavior', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/bad-evaluation.json'), evaluationReport({ artifactRole: 'wrong-role' }))

    const result = await runDevViewCli(
      [...comparisonArgs(['.tmp/bad-evaluation.json'], '.tmp/blocked-summary.json'), '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'BENCHMARK_COMPARISON_EVALUATION_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/blocked-summary.json'))).toBe(false)
  })

  it('blocks unsafe execution and authority flags in evaluation sources with zero-write behavior', async () => {
    const workspace = createWorkspace()
    writeJson(
      join(workspace, '.tmp/unsafe-evaluation.json'),
      evaluationReport({ graphifyExecuted: true, nativeBenchmarkExecuted: true, providerInvoked: true }),
    )

    const result = await runDevViewCli(
      [...comparisonArgs(['.tmp/unsafe-evaluation.json'], '.tmp/unsafe-summary.json'), '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'BENCHMARK_COMPARISON_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe-summary.json'))).toBe(false)
  })

  it('blocks output collisions, source overwrite, and protected paths with zero writes', async () => {
    const cases = [
      {
        output: '.tmp/source-evaluation.json',
        expected: 'would overwrite a source input',
      },
      {
        output: '.tmp/comparison-summary.json',
        markdown: '.tmp/comparison-summary.json',
        expected: 'must be different',
      },
      {
        output: join('.devview', 'generated', 'comparison-summary.json'),
        expected: 'inside a protected control path',
      },
    ]

    for (const entry of cases) {
      const workspace = createWorkspace()
      writeJson(join(workspace, '.tmp/source-evaluation.json'), evaluationReport())

      const result = await runDevViewCli(
        [
          ...comparisonArgs(['.tmp/source-evaluation.json'], entry.output),
          ...(entry.markdown ? ['--markdown', entry.markdown] : []),
          '--json',
        ],
        { cwd: workspace, pluginRoot },
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(result.stderr).toContain(entry.expected)
    }
  })
})

async function evaluateFixture(
  workspace: string,
  fixtureName: string,
  candidateFile: string,
  output: string,
): Promise<string> {
  const fixtureRoot = join(pluginRoot, 'cli/src/__tests__/fixtures/benchmarks', fixtureName)
  const result = await runDevViewCli(
    [
      'benchmark',
      'evaluate-result',
      '--benchmark-suite',
      join(fixtureRoot, 'suite.json'),
      '--task',
      join(fixtureRoot, 'task.json'),
      '--golden-answer',
      join(fixtureRoot, 'golden-answer.json'),
      '--candidate-result',
      join(fixtureRoot, candidateFile),
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
  expect(result.exitCode).toBe(ExitCode.Success)
  return output
}

function comparisonArgs(evaluations: string[], output: string): string[] {
  return ['benchmark', 'summarize-comparison', '--evaluations', evaluations.join(','), '--output', output]
}

function evaluationReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-benchmark-evaluation-report',
    status: 'devview-benchmark-evaluation-scored',
    evaluationScope: 'benchmark-golden-answer-evaluation-report-only',
    benchmarkSuiteId: 'summary-test-suite',
    taskId: 'summary-test-task',
    projectMode: 'native',
    comparisonArm: 'codex-devview',
    armComparisonGroupId: 'summary-test-arms',
    overallScore: 80,
    maxScore: 100,
    passThreshold: 70,
    passed: true,
    dimensionScores: [
      { dimensionId: 'scopeAccuracy', score: 10, maxScore: 15, ratio: 0.67 },
      { dimensionId: 'evidenceQuality', score: 8, maxScore: 10, ratio: 0.8 },
      { dimensionId: 'userInterpretability', score: 7, maxScore: 7, ratio: 1 },
    ],
    hardFailures: [],
    findings: [],
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
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    sourceFactsOnly: true,
    ...overrides,
  }
}

function expectSafetyFalse(payload: Record<string, unknown>): void {
  expect(payload.benchmarkExecuted).toBe(false)
  expect(payload.candidateExecuted).toBe(false)
  expect(payload.graphifyExecuted).toBe(false)
  expect(payload.nativeBenchmarkExecuted).toBe(false)
  expect(payload.providerInvoked).toBe(false)
  expect(payload.networkCallMade).toBe(false)
  expect(payload.shellCommandsExecuted).toBe(false)
  expect(payload.extensionExecutionAllowed).toBe(false)
  expect(payload.extensionsExecuted).toBe(false)
  expect(payload.graphSourceMutated).toBe(false)
  expect(payload.graphDeltaApplied).toBe(false)
  expect(payload.runtimeEvidenceSatisfied).toBe(false)
  expect(payload.evidenceAccepted).toBe(false)
  expect(payload.equivalenceProven).toBe(false)
  expect(payload.scopeEnforced).toBe(false)
  expect(payload.ciEnforcementEnabled).toBe(false)
  expect(payload.hooksActivated).toBe(false)
  expect(payload.approvalAutomationEnabled).toBe(false)
  expect(payload.userAcceptanceAutomated).toBe(false)
  expect(payload.sourceFactsOnly).toBe(true)
}
