import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cliPath = join(repoRoot, 'dist/cli/index.js')
const smokeArtifactPath = '.tmp/devview-runtime-timing-smoke/git-derived-changed-file-collection.json'
const smokeScopeReportPath = '.tmp/devview-runtime-timing-smoke/scope-compliance-runtime-report.md'
const smokeGraphDeltaProposalPath = '.tmp/devview-runtime-timing-smoke/graph-delta-proposal.preview.json'
const graphDeltaCompatibleSourcePath =
  'examples/valid/todo-app-pbe-run/generated/graph-delta-compatible-source.runtime-evidence-only.preview.json'
const runtimeBudgetTargetMs = 5000
const outputArgIndex = process.argv.indexOf('--output')
const outputPath = outputArgIndex >= 0 ? process.argv[outputArgIndex + 1] : null

const measuredSteps = [
  {
    stepName: 'compiler-input-report',
    command: 'node dist/cli/index.js graph read-model report-compiler-input --json',
    args: ['graph', 'read-model', 'report-compiler-input', '--json'],
    includedInRuntimeBudget: true,
  },
  {
    stepName: 'contract-compiler-dry-run',
    command: 'node dist/cli/index.js graph read-model compile-contract --dry-run --json',
    args: ['graph', 'read-model', 'compile-contract', '--dry-run', '--json'],
    includedInRuntimeBudget: true,
  },
  {
    stepName: 'git-derived-changed-file-collection',
    command: `node dist/cli/index.js graph read-model collect-changed-files --base HEAD~1 --head HEAD --output ${smokeArtifactPath} --json`,
    args: [
      'graph',
      'read-model',
      'collect-changed-files',
      '--base',
      'HEAD~1',
      '--head',
      'HEAD',
      '--output',
      smokeArtifactPath,
      '--json',
    ],
    includedInRuntimeBudget: true,
  },
  {
    stepName: 'non-enforcing-scope-compliance-evaluation',
    command: `node dist/cli/index.js graph read-model check-scope --base HEAD~1 --head HEAD --markdown ${smokeScopeReportPath} --json`,
    args: [
      'graph',
      'read-model',
      'check-scope',
      '--base',
      'HEAD~1',
      '--head',
      'HEAD',
      '--markdown',
      smokeScopeReportPath,
      '--json',
    ],
    includedInRuntimeBudget: true,
  },
  {
    stepName: 'graph-delta-proposal-generation',
    command: `node dist/cli/index.js graph read-model propose-graph-delta --source ${graphDeltaCompatibleSourcePath} --output ${smokeGraphDeltaProposalPath} --json`,
    args: [
      'graph',
      'read-model',
      'propose-graph-delta',
      '--source',
      graphDeltaCompatibleSourcePath,
      '--output',
      smokeGraphDeltaProposalPath,
      '--json',
    ],
    includedInRuntimeBudget: true,
  },
]

const pendingDeterministicSteps = []

const started = performance.now()
const steps = measuredSteps.map((step) => {
  const stepStarted = performance.now()
  const result = spawnSync(process.execPath, [cliPath, ...step.args], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  })
  const durationMs = roundMs(performance.now() - stepStarted)
  return {
    stepName: step.stepName,
    command: step.command,
    durationMs,
    includedInRuntimeBudget: step.includedInRuntimeBudget,
    exitCode: result.status ?? 1,
    status: result.status === 0 ? 'pass' : 'failed',
    ...(result.status === 0 ? {} : { stdout: result.stdout.trim(), stderr: result.stderr.trim() }),
  }
})
const measuredTotalMs = roundMs(performance.now() - started)
const allCommandsPassed = steps.every((step) => step.status === 'pass')

const report = {
  schemaVersion: 1,
  reportRole: 'devview-runtime-timing-smoke',
  status: allCommandsPassed ? 'devview-runtime-timing-smoke-pass' : 'devview-runtime-timing-smoke-command-failed',
  runtimeBudgetTargetMs,
  measuredTotalMs,
  targetComparison: measuredTotalMs <= runtimeBudgetTargetMs ? 'within-target' : 'over-target',
  budgetStatus: 'advisory-not-enforced',
  advisoryOnly: true,
  runtimeBudgetEnforced: false,
  timingFailureIsBlocking: false,
  excludesAiEditingTime: true,
  excludesFullValidationSuite: true,
  excludesCiRuntime: true,
  excludesHumanReviewTime: true,
  steps,
  pendingDeterministicSteps,
  outputPath,
  nonEnforcementBoundary:
    'This timing smoke measures selected local deterministic commands only. It does not enforce the 5 second target, fail CI based on runtime, reject diffs, enforce scope, approve fixtures, prove equivalence, apply graph deltas, or replace user acceptance.',
}

if (outputPath) {
  const resolvedOutput = resolve(repoRoot, outputPath)
  mkdirSync(dirname(resolvedOutput), { recursive: true })
  writeFileSync(resolvedOutput, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

console.log(JSON.stringify(report, null, 2))
process.exit(allCommandsPassed ? 0 : 1)

function roundMs(value) {
  return Math.round(value * 100) / 100
}
