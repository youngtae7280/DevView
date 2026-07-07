import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())
const benchmarkFixtureRoot = join(pluginRoot, 'cli/src/__tests__/fixtures/benchmarks')

afterEach(() => {
  cleanupWorkspaces()
})

describe('benchmark lock-suite CLI', () => {
  it('locks the native four-arm fixture set with source digests and no execution authority', async () => {
    const workspace = createWorkspace()
    const graphifyValidation = await validateGraphifyImport(workspace)
    const evaluations = await evaluateNativeFourArmFixtures(workspace)
    const comparisonSummary = await summarizeNativeComparison(workspace, evaluations)

    const result = await runDevViewCli(
      [
        ...lockSuiteArgs({
          fixtureName: 'native-minimal',
          candidates: [
            'candidate.codex-devview.json',
            'candidate.codex-graphify.json',
            'candidate.codex-graphify-devview.json',
            'candidate.codex-only.json',
          ],
          evaluations,
          comparisonSummary,
          graphifyImportValidations: [graphifyValidation],
          output: '.tmp/native-suite-lock.json',
        }),
        '--markdown',
        '.tmp/native-suite-lock.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/native-suite-lock.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-benchmark-suite-lock-manifest')
    expect(payload.status).toBe('devview-benchmark-suite-locked')
    expect(payload.suiteId).toBe('native-minimal-static-suite')
    expect(payload.taskIds).toContain('native-filter-empty-state')
    expect(payload.comparisonArms).toEqual(['codex-only', 'codex-graphify', 'codex-devview', 'codex-graphify-devview'])
    expect(payload.fixtureDigestSummary.candidateResultCount).toBe(4)
    expect(payload.fixtureDigestSummary.evaluationReportCount).toBe(4)
    expect(payload.fixtureDigestSummary.comparisonSummaryCount).toBe(1)
    expect(payload.fixtureDigestSummary.graphifyImportValidationCount).toBe(1)
    expect(payload.comparisonSummaryDigest.sourcePath).toBe('.tmp/native-comparison-summary.json')
    expect(payload.graphifyImportValidationDigests[0].sourcePath).toBe('.tmp/graphify-import-validation.json')
    expect(payload.tamperEvidenceStatus).toBe('source-digests-recorded')
    expect(payload.governanceCompletenessStatus).toBe('partial')
    expect(payload.findings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'BENCHMARK_SUITE_LOCK_GOLDEN_REVIEW_METADATA_INCOMPLETE',
        'BENCHMARK_SUITE_LOCK_HELD_OUT_POLICY_NOT_DECLARED',
      ]),
    )
    expect(written.writtenMarkdownPath).toBe('.tmp/native-suite-lock.md')
    expect(existsSync(join(workspace, '.tmp/native-suite-lock.md'))).toBe(true)
    expectSafetyFalse(payload)
  })

  it('keeps the combined digest deterministic and records retrofit governance as partial', async () => {
    const workspace = createWorkspace()
    const evaluations = await evaluateRetrofitFixtures(workspace)
    const comparisonSummary = await summarizeRetrofitComparison(workspace, evaluations)
    const args = lockSuiteArgs({
      fixtureName: 'retrofit-minimal',
      candidates: ['candidate.codex-devview.json', 'candidate.codex-graphify.json'],
      evaluations,
      comparisonSummary,
      output: '.tmp/retrofit-suite-lock.json',
    })

    const first = await runDevViewCli([...args, '--json'], { cwd: workspace, pluginRoot })
    const second = await runDevViewCli([...args.slice(0, -1), '.tmp/retrofit-suite-lock-repeat.json', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const firstPayload = JSON.parse(first.stdout)
    const secondPayload = JSON.parse(second.stdout)

    expect(first.exitCode).toBe(ExitCode.Success)
    expect(second.exitCode).toBe(ExitCode.Success)
    expect(firstPayload.projectModes).toEqual(['retrofit'])
    expect(firstPayload.fixtureDigestSummary.candidateResultCount).toBe(2)
    expect(firstPayload.heldOutPolicyStatus).toBe('not-declared')
    expect(firstPayload.goldenReviewGovernance.status).toBe('missing')
    expect(firstPayload.governanceCompletenessStatus).toBe('partial')
    expect(firstPayload.fixtureDigestSummary.combinedSha256).toBe(secondPayload.fixtureDigestSummary.combinedSha256)
    expectSafetyFalse(firstPayload)
  })

  it('blocks comparison summary mismatch with zero-write behavior', async () => {
    const workspace = createWorkspace()
    const evaluations = await evaluateNativeFourArmFixtures(workspace)
    const incompleteComparison = await summarizeNativeComparison(workspace, [evaluations[0]])

    const result = await runDevViewCli(
      [
        ...lockSuiteArgs({
          fixtureName: 'native-minimal',
          candidates: [
            'candidate.codex-devview.json',
            'candidate.codex-graphify.json',
            'candidate.codex-graphify-devview.json',
            'candidate.codex-only.json',
          ],
          evaluations,
          comparisonSummary: incompleteComparison,
          output: '.tmp/blocked-lock.json',
        }),
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'BENCHMARK_SUITE_LOCK_COMPARISON_SUMMARY_MISMATCH',
    )
    expect(existsSync(join(workspace, '.tmp/blocked-lock.json'))).toBe(false)
  })

  it('blocks unsafe source authority flags and wrong source role/status with zero writes', async () => {
    const workspace = createWorkspace()
    const evaluations = await evaluateRetrofitFixtures(workspace)
    const unsafeEvaluation = JSON.parse(readFileSync(join(workspace, evaluations[0]), 'utf8'))
    const unsafeGraphifyFlag = 'graphifyExecuted'
    writeJson(join(workspace, '.tmp/unsafe-evaluation.json'), { ...unsafeEvaluation, [unsafeGraphifyFlag]: true })
    writeJson(join(workspace, '.tmp/bad-suite.json'), {
      ...fixtureJson('retrofit-minimal', 'suite.json'),
      status: 'wrong',
    })

    const unsafeResult = await runDevViewCli(
      [
        ...lockSuiteArgs({
          fixtureName: 'retrofit-minimal',
          benchmarkSuite: fixturePath('retrofit-minimal', 'suite.json'),
          candidates: ['candidate.codex-devview.json', 'candidate.codex-graphify.json'],
          evaluations: ['.tmp/unsafe-evaluation.json', evaluations[1]],
          output: '.tmp/unsafe-lock.json',
        }),
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const badRoleResult = await runDevViewCli(
      [
        ...lockSuiteArgs({
          fixtureName: 'retrofit-minimal',
          benchmarkSuite: '.tmp/bad-suite.json',
          candidates: ['candidate.codex-devview.json', 'candidate.codex-graphify.json'],
          evaluations,
          output: '.tmp/bad-role-lock.json',
        }),
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(unsafeResult.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafeResult.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'BENCHMARK_SUITE_LOCK_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe-lock.json'))).toBe(false)

    expect(badRoleResult.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(badRoleResult.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'BENCHMARK_SUITE_LOCK_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/bad-role-lock.json'))).toBe(false)
  })

  it('blocks output collisions, source overwrites, and protected paths before writing', async () => {
    const workspace = createWorkspace()
    const evaluations = await evaluateRetrofitFixtures(workspace)
    const cases = [
      {
        output: evaluations[0],
        expected: 'would overwrite a source input',
      },
      {
        output: '.tmp/lock.json',
        markdown: '.tmp/lock.json',
        expected: 'must be different',
      },
      {
        output: join('.devview', 'generated', 'benchmark-lock.json'),
        expected: 'inside a protected control path',
      },
    ]

    for (const entry of cases) {
      const result = await runDevViewCli(
        [
          ...lockSuiteArgs({
            fixtureName: 'retrofit-minimal',
            candidates: ['candidate.codex-devview.json', 'candidate.codex-graphify.json'],
            evaluations,
            output: entry.output,
          }),
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

async function evaluateNativeFourArmFixtures(workspace: string): Promise<string[]> {
  return Promise.all(
    [
      ['candidate.codex-devview.json', '.tmp/native-devview-evaluation.json'],
      ['candidate.codex-graphify.json', '.tmp/native-graphify-evaluation.json'],
      ['candidate.codex-graphify-devview.json', '.tmp/native-graphify-devview-evaluation.json'],
      ['candidate.codex-only.json', '.tmp/native-codex-only-evaluation.json'],
    ].map(([candidate, output]) => evaluateFixture(workspace, 'native-minimal', candidate, output)),
  )
}

async function evaluateRetrofitFixtures(workspace: string): Promise<string[]> {
  return Promise.all(
    [
      ['candidate.codex-devview.json', '.tmp/retrofit-devview-evaluation.json'],
      ['candidate.codex-graphify.json', '.tmp/retrofit-graphify-evaluation.json'],
    ].map(([candidate, output]) => evaluateFixture(workspace, 'retrofit-minimal', candidate, output)),
  )
}

async function evaluateFixture(
  workspace: string,
  fixtureName: string,
  candidateFile: string,
  output: string,
): Promise<string> {
  const result = await runDevViewCli(
    [
      'benchmark',
      'evaluate-result',
      '--benchmark-suite',
      fixturePath(fixtureName, 'suite.json'),
      '--task',
      fixturePath(fixtureName, 'task.json'),
      '--golden-answer',
      fixturePath(fixtureName, 'golden-answer.json'),
      '--candidate-result',
      fixturePath(fixtureName, candidateFile),
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
  expect(result.exitCode).toBe(ExitCode.Success)
  return output
}

async function summarizeNativeComparison(workspace: string, evaluations: string[]): Promise<string> {
  return summarizeComparison(workspace, evaluations, '.tmp/native-comparison-summary.json')
}

async function summarizeRetrofitComparison(workspace: string, evaluations: string[]): Promise<string> {
  return summarizeComparison(workspace, evaluations, '.tmp/retrofit-comparison-summary.json')
}

async function summarizeComparison(workspace: string, evaluations: string[], output: string): Promise<string> {
  const result = await runDevViewCli(
    ['benchmark', 'summarize-comparison', '--evaluations', evaluations.join(','), '--output', output, '--json'],
    { cwd: workspace, pluginRoot },
  )
  expect(result.exitCode).toBe(ExitCode.Success)
  return output
}

async function validateGraphifyImport(workspace: string): Promise<string> {
  const result = await runDevViewCli(
    [
      'benchmark',
      'validate-graphify-import',
      '--graphify-export',
      fixturePath('graphify-import-minimal', 'graphify-export.fixture.json'),
      '--mapping',
      fixturePath('graphify-import-minimal', 'graphify-to-devview-mapping.json'),
      '--benchmark-task',
      fixturePath('native-minimal', 'task.json'),
      '--golden-answer',
      fixturePath('native-minimal', 'golden-answer.json'),
      '--output',
      '.tmp/graphify-import-validation.json',
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
  expect(result.exitCode).toBe(ExitCode.Success)
  return '.tmp/graphify-import-validation.json'
}

function lockSuiteArgs(input: {
  fixtureName: 'native-minimal' | 'retrofit-minimal'
  benchmarkSuite?: string
  candidates: string[]
  evaluations: string[]
  comparisonSummary?: string
  graphifyImportValidations?: string[]
  output: string
}): string[] {
  const candidatePaths = input.candidates.map((candidate) => fixturePath(input.fixtureName, candidate))
  return [
    'benchmark',
    'lock-suite',
    '--benchmark-suite',
    input.benchmarkSuite ?? fixturePath(input.fixtureName, 'suite.json'),
    '--tasks',
    fixturePath(input.fixtureName, 'task.json'),
    '--golden-answers',
    fixturePath(input.fixtureName, 'golden-answer.json'),
    '--candidate-results',
    candidatePaths.join(','),
    '--evaluations',
    input.evaluations.join(','),
    ...(input.comparisonSummary ? ['--comparison-summary', input.comparisonSummary] : []),
    ...(input.graphifyImportValidations
      ? ['--graphify-import-validations', input.graphifyImportValidations.join(',')]
      : []),
    '--output',
    input.output,
  ]
}

function fixturePath(fixtureName: string, fileName: string): string {
  return join(benchmarkFixtureRoot, fixtureName, fileName)
}

function fixtureJson(fixtureName: string, fileName: string): Record<string, unknown> {
  return JSON.parse(readFileSync(fixturePath(fixtureName, fileName), 'utf8')) as Record<string, unknown>
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
  expect(payload.branchProtectionChanged).toBe(false)
  expect(payload.branchProtectionMutated).toBe(false)
  expect(payload.requiredChecksConfigured).toBe(false)
  expect(payload.requiredChecksMutated).toBe(false)
  expect(payload.externalCiMutated).toBe(false)
  expect(payload.diffRejectionEnabled).toBe(false)
  expect(payload.diffRejectionActivated).toBe(false)
  expect(payload.approvalAutomationEnabled).toBe(false)
  expect(payload.userAcceptanceAutomated).toBe(false)
  expect(payload.sourceFactsOnly).toBe(true)
}
