import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('benchmark evaluate-result CLI', () => {
  it('scores a valid native DevView candidate against a golden answer without execution authority', async () => {
    const workspace = createWorkspace()
    writeBenchmarkSources(workspace)

    const result = await runDevViewCli([...evaluationArgs(), '--markdown', '.tmp/evaluation.md', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/evaluation.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-benchmark-evaluation-report')
    expect(payload.status).toBe('devview-benchmark-evaluation-scored')
    expect(payload.overallScore).toBe(100)
    expect(payload.maxScore).toBe(100)
    expect(payload.passed).toBe(true)
    expect(payload.comparisonArm).toBe('codex-devview')
    expect(payload.dimensionScores.map((entry: { dimensionId: string }) => entry.dimensionId)).toEqual([
      'taskSuccess',
      'scopeAccuracy',
      'contextPrecision',
      'contextRecall',
      'regressionRisk',
      'evidenceQuality',
      'graphUpdateQuality',
      'timeCostIterations',
      'userInterpretability',
    ])
    expectSafetyFalse(payload)
    expect(written.writtenMarkdownPath).toBe('.tmp/evaluation.md')
    expect(existsSync(join(workspace, '.tmp/evaluation.md'))).toBe(true)
  })

  it('scores a valid retrofit candidate result', async () => {
    const workspace = createWorkspace()
    writeBenchmarkSources(workspace, {
      suite: benchmarkSuite({ taskIds: ['retrofit-fix'] }),
      task: benchmarkTask({ taskId: 'retrofit-fix', projectMode: 'retrofit' }),
      golden: goldenAnswer({ taskId: 'retrofit-fix', projectMode: 'retrofit', comparisonArm: 'codex-devview' }),
      candidate: candidateResult({ taskId: 'retrofit-fix', projectMode: 'retrofit', comparisonArm: 'codex-devview' }),
    })

    const result = await runDevViewCli([...evaluationArgs(), '--json'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.projectMode).toBe('retrofit')
    expect(payload.passed).toBe(true)
    expectSafetyFalse(payload)
  })

  it('accepts all benchmark comparison arms as stored source facts', async () => {
    const arms = ['codex-only', 'codex-graphify', 'codex-devview', 'codex-graphify-devview'] as const
    for (const arm of arms) {
      const workspace = createWorkspace()
      writeBenchmarkSources(workspace, {
        suite: benchmarkSuite({ comparisonArms: arms }),
        task: benchmarkTask({ comparisonArms: arms }),
        golden: goldenAnswer({ expectedComparisonArms: arms, comparisonArm: undefined }),
        candidate: candidateResult({ comparisonArm: arm }),
      })

      const result = await runDevViewCli([...evaluationArgs(), '--json'], { cwd: workspace, pluginRoot })
      const payload = JSON.parse(result.stdout)

      expect(result.exitCode).toBe(ExitCode.Success)
      expect(payload.comparisonArm).toBe(arm)
      expect(payload.sourceIdentityComparison.comparisonArmStatus).toBe('matched')
      expect(payload.graphifyExecuted).toBe(false)
      expect(payload.nativeBenchmarkExecuted).toBe(false)
    }
  })

  it('scores stored native benchmark fixture skeletons without executing benchmark arms', async () => {
    const workspace = createWorkspace()

    const devviewResult = await runDevViewCli(
      [
        ...fixtureEvaluationArgs('native-minimal', 'candidate.codex-devview.json', '.tmp/native-devview.json'),
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const devviewPayload = JSON.parse(devviewResult.stdout)

    const codexOnlyResult = await runDevViewCli(
      [
        ...fixtureEvaluationArgs('native-minimal', 'candidate.codex-only.json', '.tmp/native-codex-only.json'),
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const codexOnlyPayload = JSON.parse(codexOnlyResult.stdout)

    const graphifyDevviewResult = await runDevViewCli(
      [
        ...fixtureEvaluationArgs(
          'native-minimal',
          'candidate.codex-graphify-devview.json',
          '.tmp/native-graphify-devview.json',
        ),
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const graphifyDevviewPayload = JSON.parse(graphifyDevviewResult.stdout)

    expect(devviewResult.exitCode).toBe(ExitCode.Success)
    expect(devviewPayload.projectMode).toBe('native')
    expect(devviewPayload.comparisonArm).toBe('codex-devview')
    expect(devviewPayload.passed).toBe(true)
    expect(devviewPayload.overallScore).toBeGreaterThanOrEqual(70)
    expect(devviewPayload.overallScore).toBeLessThan(100)
    expect(devviewPayload.findings.map((entry: { code: string }) => entry.code)).toContain(
      'BENCHMARK_CONTEXT_PRECISION_PARTIAL',
    )
    expectSafetyFalse(devviewPayload)

    expect(codexOnlyResult.exitCode).toBe(ExitCode.Success)
    expect(codexOnlyPayload.comparisonArm).toBe('codex-only')
    expect(codexOnlyPayload.overallScore).toBeLessThan(devviewPayload.overallScore)
    expect(codexOnlyPayload.findings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'BENCHMARK_REQUIRED_EVIDENCE_MISSING',
        'BENCHMARK_GRAPH_DELTA_MISMATCH',
        'BENCHMARK_CONTEXT_RECALL_PARTIAL',
      ]),
    )
    expectSafetyFalse(codexOnlyPayload)

    expect(graphifyDevviewResult.exitCode).toBe(ExitCode.Success)
    expect(graphifyDevviewPayload.comparisonArm).toBe('codex-graphify-devview')
    expect(graphifyDevviewPayload.overallScore).toBeGreaterThanOrEqual(devviewPayload.overallScore)
    expect(graphifyDevviewPayload.graphifyExecuted).toBe(false)
    expect(graphifyDevviewPayload.sourceCandidateFacts.graphifyImportValidationReportPresent).toBe(true)
    expect(graphifyDevviewPayload.sourceCandidateFacts.artifactRoles).toContain(
      'devview-graphify-import-validation-report',
    )
    expectSafetyFalse(graphifyDevviewPayload)
  })

  it('scores stored retrofit benchmark fixture skeletons and preserves Graphify comparison arm labels', async () => {
    const workspace = createWorkspace()

    const devviewResult = await runDevViewCli(
      [
        ...fixtureEvaluationArgs('retrofit-minimal', 'candidate.codex-devview.json', '.tmp/retrofit-devview.json'),
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const devviewPayload = JSON.parse(devviewResult.stdout)

    const graphifyResult = await runDevViewCli(
      [
        ...fixtureEvaluationArgs('retrofit-minimal', 'candidate.codex-graphify.json', '.tmp/retrofit-graphify.json'),
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const graphifyPayload = JSON.parse(graphifyResult.stdout)

    expect(devviewResult.exitCode).toBe(ExitCode.Success)
    expect(devviewPayload.projectMode).toBe('retrofit')
    expect(devviewPayload.comparisonArm).toBe('codex-devview')
    expect(devviewPayload.passed).toBe(true)
    expectSafetyFalse(devviewPayload)

    expect(graphifyResult.exitCode).toBe(ExitCode.Success)
    expect(graphifyPayload.projectMode).toBe('retrofit')
    expect(graphifyPayload.comparisonArm).toBe('codex-graphify')
    expect(graphifyPayload.graphifyExecuted).toBe(false)
    expect(graphifyPayload.overallScore).toBeLessThan(devviewPayload.overallScore)
    expect(graphifyPayload.findings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'BENCHMARK_CONTEXT_PRECISION_PARTIAL',
        'BENCHMARK_REQUIRED_EVIDENCE_MISSING',
        'BENCHMARK_GRAPH_DELTA_MISMATCH',
      ]),
    )
    expectSafetyFalse(graphifyPayload)
  })

  it('records forbidden file mutation as a scored hard failure without executing benchmarks', async () => {
    const workspace = createWorkspace()
    writeBenchmarkSources(workspace, {
      candidate: candidateResult({ changedFiles: ['src/todo.ts', 'src/unrelated-config.ts'] }),
    })

    const result = await runDevViewCli([...evaluationArgs(), '--json'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-benchmark-evaluation-scored')
    expect(payload.passed).toBe(false)
    expect(payload.hardFailures.map((entry: { code: string }) => entry.code)).toContain(
      'BENCHMARK_FORBIDDEN_FILE_MUTATION',
    )
    expect(dimensionScore(payload, 'scopeAccuracy')).toBe(0)
    expectSafetyFalse(payload)
  })

  it('lowers evidence, context, and graph/update scores when candidate facts are incomplete', async () => {
    const workspace = createWorkspace()
    writeBenchmarkSources(workspace, {
      candidate: candidateResult({
        selectedContext: {
          files: ['src/unrelated.ts'],
          nodeIds: [],
          edgeIds: [],
          evidenceIds: [],
        },
        providedEvidence: [],
        graphDeltaSummary: { operations: [{ operationId: 'wrong-op' }] },
      }),
    })

    const result = await runDevViewCli([...evaluationArgs(), '--json'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(dimensionScore(payload, 'contextPrecision')).toBeLessThan(10)
    expect(dimensionScore(payload, 'contextRecall')).toBeLessThan(10)
    expect(dimensionScore(payload, 'evidenceQuality')).toBeLessThan(10)
    expect(dimensionScore(payload, 'graphUpdateQuality')).toBeLessThan(8)
    expect(payload.findings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'BENCHMARK_CONTEXT_PRECISION_PARTIAL',
        'BENCHMARK_CONTEXT_RECALL_PARTIAL',
        'BENCHMARK_REQUIRED_EVIDENCE_MISSING',
        'BENCHMARK_GRAPH_DELTA_MISMATCH',
      ]),
    )
  })

  it('blocks wrong source role/status and task id mismatch with zero-write behavior', async () => {
    const cases = [
      {
        overrides: { suite: { ...benchmarkSuite(), artifactRole: 'devview-benchmark-task-spec' } },
        expectedCode: 'BENCHMARK_SUITE_ROLE_STATUS_INVALID',
      },
      {
        overrides: { candidate: candidateResult({ taskId: 'other-task' }) },
        expectedCode: 'BENCHMARK_TASK_CANDIDATE_MISMATCH',
      },
    ]

    for (const entry of cases) {
      const workspace = createWorkspace()
      writeBenchmarkSources(workspace, entry.overrides)

      const result = await runDevViewCli([...evaluationArgs(), '--json'], { cwd: workspace, pluginRoot })
      const payload = JSON.parse(result.stderr)

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(payload.findings.map((finding: { code: string }) => finding.code)).toContain(entry.expectedCode)
      expect(existsSync(join(workspace, '.tmp/evaluation.json'))).toBe(false)
    }
  })

  it('blocks unsafe provider/network/shell/Graphify/native benchmark flags before writing outputs', async () => {
    const workspace = createWorkspace()
    writeBenchmarkSources(workspace, {
      candidate: candidateResult({
        providerInvoked: true,
        networkCallMade: true,
        shellCommandsExecuted: true,
        extensionExecutionAllowed: true,
        graphifyExecuted: true,
        nativeBenchmarkExecuted: true,
      }),
    })

    const result = await runDevViewCli([...evaluationArgs(), '--json'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.findings.map((finding: { code: string }) => finding.code)).toContain(
      'BENCHMARK_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/evaluation.json'))).toBe(false)
  })

  it('blocks output collisions, source overwrite, and protected paths with zero writes', async () => {
    const cases = [
      {
        output: 'suite.json',
        expected: 'would overwrite a source input',
      },
      {
        output: join('.tmp', 'evaluation.json'),
        markdown: join('.tmp', 'evaluation.json'),
        expected: 'must be different',
      },
      {
        output: join('.devview', 'generated', 'evaluation.json'),
        expected: 'inside a protected control path',
      },
    ]

    for (const entry of cases) {
      const workspace = createWorkspace()
      writeBenchmarkSources(workspace)
      const result = await runDevViewCli(
        [...evaluationArgs(entry.output), ...(entry.markdown ? ['--markdown', entry.markdown] : []), '--json'],
        { cwd: workspace, pluginRoot },
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(result.stderr).toContain(entry.expected)
    }
  })
})

function evaluationArgs(output = join('.tmp', 'evaluation.json')): string[] {
  return [
    'benchmark',
    'evaluate-result',
    '--benchmark-suite',
    'suite.json',
    '--task',
    'task.json',
    '--golden-answer',
    'golden.json',
    '--candidate-result',
    'candidate.json',
    '--output',
    output,
  ]
}

function fixtureEvaluationArgs(fixtureName: string, candidateFile: string, output: string): string[] {
  const fixtureRoot = join(pluginRoot, 'cli/src/__tests__/fixtures/benchmarks', fixtureName)
  return [
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
  ]
}

function writeBenchmarkSources(
  workspace: string,
  overrides: {
    suite?: Record<string, unknown>
    task?: Record<string, unknown>
    golden?: Record<string, unknown>
    candidate?: Record<string, unknown>
  } = {},
): void {
  writeJson(join(workspace, 'suite.json'), overrides.suite ?? benchmarkSuite())
  writeJson(join(workspace, 'task.json'), overrides.task ?? benchmarkTask())
  writeJson(join(workspace, 'golden.json'), overrides.golden ?? goldenAnswer())
  writeJson(join(workspace, 'candidate.json'), overrides.candidate ?? candidateResult())
}

function benchmarkSuite(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-benchmark-suite-spec',
    status: 'devview-benchmark-suite-configured',
    suiteId: 'native-retrofit-foundation',
    taskIds: ['native-add-filter'],
    comparisonArms: ['codex-only', 'codex-graphify', 'codex-devview', 'codex-graphify-devview'],
    passThreshold: 70,
    ...overrides,
  }
}

function benchmarkTask(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-benchmark-task-spec',
    status: 'devview-benchmark-task-configured',
    taskId: 'native-add-filter',
    taskKind: 'feature-addition',
    projectMode: 'native',
    comparisonArms: ['codex-devview'],
    armComparisonGroupId: 'add-filter-comparison',
    ...overrides,
  }
}

function goldenAnswer(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-benchmark-golden-answer',
    status: 'devview-benchmark-golden-answer-ready',
    taskId: 'native-add-filter',
    projectMode: 'native',
    comparisonArm: 'codex-devview',
    expectedOutcome: 'implemented',
    allowedFiles: ['src/todo.ts', 'src/todo.test.ts'],
    forbiddenFiles: ['src/unrelated-config.ts'],
    requiredTouchedFiles: ['src/todo.ts'],
    optionalTouchedFiles: ['src/todo.test.ts'],
    expectedContext: {
      files: ['src/todo.ts'],
      nodeIds: ['node.todo-list'],
      edgeIds: ['edge.todo-filter'],
      evidenceIds: ['evidence.todo-filter-test'],
    },
    forbiddenContext: {
      files: ['src/unrelated.ts'],
      nodeIds: ['node.unrelated'],
    },
    requiredEvidence: [{ evidenceId: 'evidence.todo-filter-test' }],
    expectedGraphDelta: {
      operations: [{ operationId: 'op-update-todo-filter', action: 'replace-field', targetId: 'node.todo-list' }],
    },
    regressionExpectations: { parityPreserved: true },
    executionBudgets: { maxIterations: 4 },
    ...overrides,
  }
}

function candidateResult(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-benchmark-candidate-result',
    status: 'devview-benchmark-candidate-result-submitted',
    taskId: 'native-add-filter',
    projectMode: 'native',
    comparisonArm: 'codex-devview',
    reportedOutcome: 'implemented',
    changedFiles: [{ path: 'src/todo.ts', status: 'modified' }],
    selectedContext: {
      files: ['src/todo.ts'],
      nodeIds: ['node.todo-list'],
      edgeIds: ['edge.todo-filter'],
      evidenceIds: ['evidence.todo-filter-test'],
    },
    providedEvidence: [{ evidenceId: 'evidence.todo-filter-test', status: 'present' }],
    graphDeltaSummary: {
      operations: [{ operationId: 'op-update-todo-filter', action: 'replace-field', targetId: 'node.todo-list' }],
    },
    regressionSignals: { parityPreserved: true },
    executionMetrics: { iterationCount: 2, elapsedMs: 1200, costProxy: 1 },
    workJournalSummary: {
      status: 'ready',
      nextAction: 'review scored benchmark output',
      authoritySummaryVisible: true,
      sourceFactSummaryVisible: true,
    },
    providerInvoked: false,
    networkCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    graphifyExecuted: false,
    nativeBenchmarkExecuted: false,
    benchmarkExecuted: false,
    candidateExecuted: false,
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
    ...overrides,
  }
}

function dimensionScore(payload: Record<string, unknown>, dimensionId: string): number {
  const dimension = (payload.dimensionScores as Array<{ dimensionId: string; score: number }>).find(
    (entry) => entry.dimensionId === dimensionId,
  )
  return dimension?.score ?? Number.NaN
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
