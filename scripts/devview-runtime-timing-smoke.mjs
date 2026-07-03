import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cliPath = join(repoRoot, 'dist/cli/index.js')
const smokeArtifactPath = '.tmp/devview-runtime-timing-smoke/git-derived-changed-file-collection.json'
const smokeScopeReportPath = '.tmp/devview-runtime-timing-smoke/scope-compliance-runtime-report.md'
const smokeAiRequestAnalyzerPackPath = '.tmp/devview-runtime-timing-smoke/ai-request-analyzer-pack.json'
const smokeAiRequestAnalyzerPackMarkdownPath = '.tmp/devview-runtime-timing-smoke/ai-request-analyzer-pack.md'
const smokeGraphDeltaProposalPath = '.tmp/devview-runtime-timing-smoke/graph-delta-proposal.preview.json'
const smokeGraphDeltaReviewPacketPath = '.tmp/devview-runtime-timing-smoke/graph-delta-human-review-packet.md'
const smokeRequestIrValidationPath = '.tmp/devview-runtime-timing-smoke/request-ir-validation.json'
const smokeRequestIrGraphValidationPath = '.tmp/devview-runtime-timing-smoke/request-ir-graph-validation.json'
const smokeGraphTraversalPlanPath = '.tmp/devview-runtime-timing-smoke/graph-traversal-plan.json'
const smokeSelectedGraphSlicePath = '.tmp/devview-runtime-timing-smoke/selected-graph-slice.json'
const smokeContractCompilerInputPath = '.tmp/devview-runtime-timing-smoke/contract-compiler-input.json'
const smokeInstructionPackPath = '.tmp/devview-runtime-timing-smoke/instruction-pack.json'
const smokeInstructionPackMarkdownPath = '.tmp/devview-runtime-timing-smoke/instruction-pack.md'
const smokeHookGatewayHealthReportPath = '.tmp/devview-runtime-timing-smoke/hook-gateway-health-report.json'
const smokeUserPromptContextPath = '.tmp/devview-runtime-timing-smoke/user-prompt-context.json'
const smokeUserPromptContextMarkdownPath = '.tmp/devview-runtime-timing-smoke/user-prompt-context.md'
const smokeHookScriptScaffoldPath = '.tmp/devview-runtime-timing-smoke/hook-script-scaffold.json'
const smokeHookScriptScaffoldMarkdownPath = '.tmp/devview-runtime-timing-smoke/hook-script-scaffold.md'
const graphDeltaCompatibleSourcePath =
  'examples/valid/todo-app-pbe-run/generated/graph-delta-compatible-source.runtime-evidence-only.preview.json'
const requestIrCandidatePath =
  'examples/valid/todo-app-pbe-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json'
const aiRequestAnalyzerBoundaryPath =
  'examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-boundary.add-todo-runtime-evidence-only.preview.json'
const requestIrCandidateSchemaPath =
  'examples/valid/todo-app-pbe-run/generated/request-ir-candidate-schema.runtime-evidence-only.preview.json'
const hookGatewayHealthBoundaryPath =
  'examples/valid/todo-app-pbe-run/generated/devview-hook-gateway-health-boundary.runtime-evidence-only.preview.json'
const hookGatewayBoundaryPath =
  'examples/valid/todo-app-pbe-run/generated/devview-codex-hook-gateway-boundary.runtime-evidence-only.preview.json'
const hookInstallTrustBoundaryPath =
  'examples/valid/todo-app-pbe-run/generated/devview-hook-install-trust-boundary.runtime-evidence-only.preview.json'
const frontendChainReportPath =
  'examples/valid/todo-app-pbe-run/generated/devview-frontend-chain.add-todo-runtime-evidence-only.preview.json'
const runtimeSmokeLaneBoundaryPath =
  'examples/valid/todo-app-pbe-run/generated/devview-runtime-smoke-lane-boundary.runtime-evidence-only.preview.json'
const runtimeBudgetTargetMs = 5000
const outputArgIndex = process.argv.indexOf('--output')
const outputPath = outputArgIndex >= 0 ? process.argv[outputArgIndex + 1] : null

const runtimeLaneDefinitions = [
  {
    runtimeLane: 'analyzer-preflight-lane',
    laneRole: 'deterministic analyzer prompt/input setup',
    perRequestCriticalPath: false,
    budgetTargetMs: null,
    budgetEnforced: false,
  },
  {
    runtimeLane: 'core-critical-lane',
    laneRole: 'deterministic user request to instruction pack frontend path',
    perRequestCriticalPath: true,
    budgetTargetMs: runtimeBudgetTargetMs,
    budgetEnforced: false,
  },
  {
    runtimeLane: 'activation-readiness-lane',
    laneRole: 'report-only hook gateway readiness and advisory context preparation',
    perRequestCriticalPath: false,
    budgetTargetMs: null,
    budgetEnforced: false,
  },
  {
    runtimeLane: 'advisory-backend-lane',
    laneRole: 'advisory backend, post-check, graph delta, and review reporting',
    perRequestCriticalPath: false,
    budgetTargetMs: null,
    budgetEnforced: false,
  },
]

const measuredSteps = [
  {
    stepName: 'ai-request-analyzer-pack-generation',
    command: `node dist/cli/index.js graph read-model generate-ai-request-analyzer-pack --boundary ${aiRequestAnalyzerBoundaryPath} --schema ${requestIrCandidateSchemaPath} --output ${smokeAiRequestAnalyzerPackPath} --markdown ${smokeAiRequestAnalyzerPackMarkdownPath} --json`,
    args: [
      'graph',
      'read-model',
      'generate-ai-request-analyzer-pack',
      '--boundary',
      aiRequestAnalyzerBoundaryPath,
      '--schema',
      requestIrCandidateSchemaPath,
      '--output',
      smokeAiRequestAnalyzerPackPath,
      '--markdown',
      smokeAiRequestAnalyzerPackMarkdownPath,
      '--json',
    ],
    includedInRuntimeBudget: true,
    runtimeLane: 'analyzer-preflight-lane',
  },
  {
    stepName: 'request-ir-candidate-schema-validation',
    command: `node dist/cli/index.js graph read-model validate-request-ir --candidate ${requestIrCandidatePath} --output ${smokeRequestIrValidationPath} --json`,
    args: [
      'graph',
      'read-model',
      'validate-request-ir',
      '--candidate',
      requestIrCandidatePath,
      '--output',
      smokeRequestIrValidationPath,
      '--json',
    ],
    includedInRuntimeBudget: true,
    runtimeLane: 'core-critical-lane',
  },
  {
    stepName: 'request-ir-graph-aware-validation',
    command: `node dist/cli/index.js graph read-model validate-request-ir-graph --candidate ${requestIrCandidatePath} --schema-validation ${smokeRequestIrValidationPath} --output ${smokeRequestIrGraphValidationPath} --json`,
    args: [
      'graph',
      'read-model',
      'validate-request-ir-graph',
      '--candidate',
      requestIrCandidatePath,
      '--schema-validation',
      smokeRequestIrValidationPath,
      '--output',
      smokeRequestIrGraphValidationPath,
      '--json',
    ],
    includedInRuntimeBudget: true,
    runtimeLane: 'core-critical-lane',
  },
  {
    stepName: 'graph-traversal-plan-generation',
    command: `node dist/cli/index.js graph read-model plan-traversal --graph-validation ${smokeRequestIrGraphValidationPath} --output ${smokeGraphTraversalPlanPath} --json`,
    args: [
      'graph',
      'read-model',
      'plan-traversal',
      '--graph-validation',
      smokeRequestIrGraphValidationPath,
      '--output',
      smokeGraphTraversalPlanPath,
      '--json',
    ],
    includedInRuntimeBudget: true,
    runtimeLane: 'core-critical-lane',
  },
  {
    stepName: 'selected-graph-slice-generation',
    command: `node dist/cli/index.js graph read-model select-slice --traversal-plan ${smokeGraphTraversalPlanPath} --output ${smokeSelectedGraphSlicePath} --json`,
    args: [
      'graph',
      'read-model',
      'select-slice',
      '--traversal-plan',
      smokeGraphTraversalPlanPath,
      '--output',
      smokeSelectedGraphSlicePath,
      '--json',
    ],
    includedInRuntimeBudget: true,
    runtimeLane: 'core-critical-lane',
  },
  {
    stepName: 'contract-compiler-input-generation',
    command: `node dist/cli/index.js graph read-model generate-contract-input --selected-slice ${smokeSelectedGraphSlicePath} --output ${smokeContractCompilerInputPath} --json`,
    args: [
      'graph',
      'read-model',
      'generate-contract-input',
      '--selected-slice',
      smokeSelectedGraphSlicePath,
      '--output',
      smokeContractCompilerInputPath,
      '--json',
    ],
    includedInRuntimeBudget: true,
    runtimeLane: 'core-critical-lane',
  },
  {
    stepName: 'instruction-pack-generation',
    command: `node dist/cli/index.js graph read-model generate-instruction-pack --contract-input ${smokeContractCompilerInputPath} --output ${smokeInstructionPackPath} --markdown ${smokeInstructionPackMarkdownPath} --json`,
    args: [
      'graph',
      'read-model',
      'generate-instruction-pack',
      '--contract-input',
      smokeContractCompilerInputPath,
      '--output',
      smokeInstructionPackPath,
      '--markdown',
      smokeInstructionPackMarkdownPath,
      '--json',
    ],
    includedInRuntimeBudget: true,
    runtimeLane: 'core-critical-lane',
  },
  {
    stepName: 'hook-gateway-health-report',
    command: `node dist/cli/index.js graph read-model report-hook-gateway-health --boundary ${hookGatewayHealthBoundaryPath} --output ${smokeHookGatewayHealthReportPath} --json`,
    args: [
      'graph',
      'read-model',
      'report-hook-gateway-health',
      '--boundary',
      hookGatewayHealthBoundaryPath,
      '--output',
      smokeHookGatewayHealthReportPath,
      '--json',
    ],
    includedInRuntimeBudget: true,
    runtimeLane: 'activation-readiness-lane',
  },
  {
    stepName: 'user-prompt-submit-context-preview',
    command: `node dist/cli/index.js graph read-model prepare-user-prompt-context --frontend-chain ${frontendChainReportPath} --hook-health ${smokeHookGatewayHealthReportPath} --instruction-pack ${smokeInstructionPackPath} --instruction-markdown ${smokeInstructionPackMarkdownPath} --output ${smokeUserPromptContextPath} --markdown ${smokeUserPromptContextMarkdownPath} --json`,
    args: [
      'graph',
      'read-model',
      'prepare-user-prompt-context',
      '--frontend-chain',
      frontendChainReportPath,
      '--hook-health',
      smokeHookGatewayHealthReportPath,
      '--instruction-pack',
      smokeInstructionPackPath,
      '--instruction-markdown',
      smokeInstructionPackMarkdownPath,
      '--output',
      smokeUserPromptContextPath,
      '--markdown',
      smokeUserPromptContextMarkdownPath,
      '--json',
    ],
    includedInRuntimeBudget: true,
    runtimeLane: 'activation-readiness-lane',
  },
  {
    stepName: 'hook-script-scaffold-preview',
    command: `node dist/cli/index.js graph read-model generate-hook-script-scaffold --boundary ${hookGatewayBoundaryPath} --hook-health ${hookGatewayHealthBoundaryPath} --install-trust ${hookInstallTrustBoundaryPath} --user-prompt-context ${smokeUserPromptContextPath} --output ${smokeHookScriptScaffoldPath} --markdown ${smokeHookScriptScaffoldMarkdownPath} --json`,
    args: [
      'graph',
      'read-model',
      'generate-hook-script-scaffold',
      '--boundary',
      hookGatewayBoundaryPath,
      '--hook-health',
      hookGatewayHealthBoundaryPath,
      '--install-trust',
      hookInstallTrustBoundaryPath,
      '--user-prompt-context',
      smokeUserPromptContextPath,
      '--output',
      smokeHookScriptScaffoldPath,
      '--markdown',
      smokeHookScriptScaffoldMarkdownPath,
      '--json',
    ],
    includedInRuntimeBudget: true,
    runtimeLane: 'activation-readiness-lane',
  },
  {
    stepName: 'compiler-input-report',
    command: 'node dist/cli/index.js graph read-model report-compiler-input --json',
    args: ['graph', 'read-model', 'report-compiler-input', '--json'],
    includedInRuntimeBudget: true,
    runtimeLane: 'advisory-backend-lane',
  },
  {
    stepName: 'contract-compiler-dry-run',
    command: 'node dist/cli/index.js graph read-model compile-contract --dry-run --json',
    args: ['graph', 'read-model', 'compile-contract', '--dry-run', '--json'],
    includedInRuntimeBudget: true,
    runtimeLane: 'advisory-backend-lane',
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
    runtimeLane: 'advisory-backend-lane',
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
    runtimeLane: 'advisory-backend-lane',
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
    runtimeLane: 'advisory-backend-lane',
  },
  {
    stepName: 'graph-delta-human-review-packet',
    command: `node dist/cli/index.js graph read-model review-graph-delta --proposal ${smokeGraphDeltaProposalPath} --markdown ${smokeGraphDeltaReviewPacketPath} --json`,
    args: [
      'graph',
      'read-model',
      'review-graph-delta',
      '--proposal',
      smokeGraphDeltaProposalPath,
      '--markdown',
      smokeGraphDeltaReviewPacketPath,
      '--json',
    ],
    includedInRuntimeBudget: true,
    runtimeLane: 'advisory-backend-lane',
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
    runtimeLane: step.runtimeLane,
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
const laneTotals = buildLaneTotals(steps)

const report = {
  schemaVersion: 1,
  reportRole: 'devview-runtime-timing-smoke',
  status: allCommandsPassed ? 'devview-runtime-timing-smoke-pass' : 'devview-runtime-timing-smoke-command-failed',
  runtimeBudgetTargetMs,
  measuredTotalMs,
  targetComparison: measuredTotalMs <= runtimeBudgetTargetMs ? 'within-target' : 'over-target',
  budgetStatus: 'advisory-not-enforced',
  runtimeLanePolicyStatus: 'runtime-smoke-lanes-previewed-advisory-only',
  runtimeSmokeLaneBoundary: runtimeSmokeLaneBoundaryPath,
  advisoryOnly: true,
  runtimeBudgetEnforced: false,
  laneBudgetEnforced: false,
  timingFailureIsBlocking: false,
  excludesAiEditingTime: true,
  excludesFullValidationSuite: true,
  excludesCiRuntime: true,
  excludesHumanReviewTime: true,
  laneDefinitions: runtimeLaneDefinitions,
  laneTotals,
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

function buildLaneTotals(steps) {
  return runtimeLaneDefinitions.map((definition) => {
    const laneSteps = steps.filter((step) => step.runtimeLane === definition.runtimeLane)
    const measuredTotalMs = roundMs(laneSteps.reduce((total, step) => total + step.durationMs, 0))
    return {
      runtimeLane: definition.runtimeLane,
      laneRole: definition.laneRole,
      perRequestCriticalPath: definition.perRequestCriticalPath,
      stepCount: laneSteps.length,
      measuredTotalMs,
      budgetTargetMs: definition.budgetTargetMs,
      targetComparison:
        typeof definition.budgetTargetMs === 'number'
          ? measuredTotalMs <= definition.budgetTargetMs
            ? 'within-target'
            : 'over-target-advisory-only'
          : 'no-lane-target',
      budgetEnforced: false,
      commandFailureIsBlocking: laneSteps.some((step) => step.status === 'failed'),
      timingFailureIsBlocking: false,
    }
  })
}
