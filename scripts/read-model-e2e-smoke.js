import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cliPath = join(repoRoot, 'dist/cli/index.js')
const tempRoot = mkdtempSync(join(tmpdir(), 'pbe-read-model-e2e-'))
const outputArgIndex = process.argv.indexOf('--output')
const outputPath = outputArgIndex >= 0 ? process.argv[outputArgIndex + 1] : null

function copyPath(relativePath) {
  const from = join(repoRoot, relativePath)
  const to = join(tempRoot, relativePath)
  mkdirSync(dirname(to), { recursive: true })
  cpSync(from, to, { recursive: true })
}

function runCli(args) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: tempRoot,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(
      [`Command failed: pbe ${args.join(' ')}`, result.stdout.trim(), result.stderr.trim()].filter(Boolean).join('\n'),
    )
  }
  try {
    return JSON.parse(result.stdout)
  } catch (error) {
    throw new Error(`Command did not return JSON: pbe ${args.join(' ')}\n${result.stdout}\n${error.message}`)
  }
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(tempRoot, relativePath), 'utf8'))
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`)
  }
}

function assertIncludes(values, expected, label) {
  if (!values.includes(expected)) {
    throw new Error(`${label}: expected ${expected} in ${JSON.stringify(values)}`)
  }
}

function commandResult(profile, command) {
  const result = profile?.commands?.find((entry) => entry.command === command)
  if (!result) {
    throw new Error(`Missing ${command} result for ${profile?.profileId ?? 'unknown profile'}`)
  }
  return result
}

try {
  copyPath('docs/concept')
  copyPath('examples/adoption/todo-search-slice')
  copyPath('examples/adoption/compatibility-mismatch-slice')
  copyPath('examples/valid/todo-app-pbe-run')
  copyPath('examples/read-model-aggregate')

  const todoSearchGenerate = runCli([
    'graph',
    'read-model',
    'generate',
    '--slice',
    'examples/adoption/todo-search-slice',
    '--json',
  ])
  assertEqual(todoSearchGenerate.nodeCount, 40, 'Todo Search generated node count')
  assertEqual(todoSearchGenerate.edgeCount, 59, 'Todo Search generated edge count')

  const todoSearchGenerated = readJson('examples/adoption/todo-search-slice/generated/generated-read-model.json')
  assertEqual(todoSearchGenerated.metadata.readModelSourceMode, 'graph-source-backed', 'Todo Search source mode')
  assertEqual(
    todoSearchGenerated.metadata.graphSourceArtifact,
    'examples/adoption/todo-search-slice/graph-source.json',
    'Todo Search graph source artifact',
  )
  assertEqual(todoSearchGenerated.coreViewCoverage.length, 7, 'Todo Search Core View count')

  const todoSearchCompare = runCli([
    'graph',
    'read-model',
    'compare',
    '--generated',
    'examples/adoption/todo-search-slice/generated/generated-read-model.json',
    '--manual',
    'examples/adoption/todo-search-slice/maintainability-graph-read-model.json',
    '--json',
  ])
  assertEqual(todoSearchCompare.status, 'comparison-pass', 'Todo Search parity status')
  assertEqual(todoSearchCompare.mismatchCount, 0, 'Todo Search parity mismatch count')

  const todoSearchValidate = runCli([
    'graph',
    'read-model',
    'validate',
    '--slice',
    'examples/adoption/todo-search-slice',
    '--json',
  ])
  assertEqual(todoSearchValidate.status, 'validation-pass', 'Todo Search validation status')
  assertEqual(todoSearchValidate.checkCount, 20, 'Todo Search validation check count')

  const todoAppGenerate = runCli([
    'graph',
    'read-model',
    'generate',
    '--slice',
    'examples/valid/todo-app-pbe-run',
    '--json',
  ])
  assertEqual(todoAppGenerate.nodeCount, 22, 'Todo App generated node count')
  assertEqual(todoAppGenerate.edgeCount, 38, 'Todo App generated edge count')

  const todoAppGenerated = readJson('examples/valid/todo-app-pbe-run/generated/generated-read-model.json')
  assertEqual(todoAppGenerated.coreViewCoverage.length, 7, 'Todo App Core View count')

  const todoAppValidate = runCli([
    'graph',
    'read-model',
    'validate',
    '--slice',
    'examples/valid/todo-app-pbe-run',
    '--json',
  ])
  assertEqual(todoAppValidate.status, 'validation-pass', 'Todo App validation status')
  assertEqual(todoAppValidate.checkCount, 16, 'Todo App validation check count')

  const validateAll = runCli(['graph', 'read-model', 'validate', '--all', '--json'])
  assertEqual(validateAll.status, 'aggregate-pass', 'validate-all status')
  assertEqual(validateAll.validateAllStatus, 'aggregate-pass', 'validate-all aggregate status')
  assertEqual(validateAll.aggregateStatus, 'aggregate-pass', 'aggregate summary status')
  assertEqual(validateAll.sliceCount, 2, 'validate-all slice count')

  const todoSearchProfile = validateAll.perSliceResults.find(
    (entry) => entry.profileId === 'todo-search-selected-slice',
  )
  const todoAppProfile = validateAll.perSliceResults.find(
    (entry) => entry.profileId === 'todo-app-pbe-run-structure-only',
  )
  const todoSearchProjection = commandResult(todoSearchProfile, 'project-contract')
  assertEqual(todoSearchProjection.status, 'projection-contract-pass', 'Todo Search projection contract status')
  assertEqual(todoSearchProjection.nodeCount, 40, 'Todo Search projection node count')
  assertEqual(todoSearchProjection.edgeCount, 59, 'Todo Search projection edge count')
  assertEqual(todoSearchProjection.coreViewCount, 7, 'Todo Search projection Core View count')

  const todoAppProjection = commandResult(todoAppProfile, 'project-contract')
  assertEqual(
    todoAppProjection.status,
    'candidate-projection-contract-pass',
    'Todo App candidate projection contract status',
  )
  assertEqual(todoAppProjection.contractMode, 'structure-only-candidate', 'Todo App projection contract mode')
  assertEqual(todoAppProjection.nodeCount, 22, 'Todo App projection node count')
  assertEqual(todoAppProjection.edgeCount, 38, 'Todo App projection edge count')
  assertEqual(todoAppProjection.coreViewCount, 7, 'Todo App projection Core View count')

  const projectionStatuses = validateAll.projectionContractStatus.map((entry) => entry.status)
  assertIncludes(projectionStatuses, 'projection-contract-pass', 'validate-all projection statuses')
  assertIncludes(projectionStatuses, 'candidate-projection-contract-pass', 'validate-all projection statuses')

  const candidateObservation = runCli(['graph', 'read-model', 'observe-candidates', '--json'])
  assertEqual(candidateObservation.status, 'candidate-observation-pass', 'candidate observation status')
  assertEqual(
    candidateObservation.observedCandidates[0].status,
    'candidate-projection-contract-pass',
    'candidate observation Todo App status',
  )
  if (!candidateObservation.validateAllBoundary.includes('separate report-only command')) {
    throw new Error('Candidate observation boundary must remain separate report-only command')
  }

  const payload = {
    ok: true,
    command: 'test:read-model:e2e',
    status: 'e2e-smoke-pass',
    tempWorkspaceRemovedAfterRun: true,
    todoSearch: {
      sourceMode: todoSearchGenerated.metadata.readModelSourceMode,
      nodes: todoSearchGenerate.nodeCount,
      edges: todoSearchGenerate.edgeCount,
      coreViews: todoSearchGenerated.coreViewCoverage.length,
      parity: todoSearchCompare.status,
      validation: todoSearchValidate.status,
      projection: todoSearchProjection.status,
    },
    todoApp: {
      policyLevel: 'structure-only',
      nodes: todoAppGenerate.nodeCount,
      edges: todoAppGenerate.edgeCount,
      coreViews: todoAppGenerated.coreViewCoverage.length,
      validation: todoAppValidate.status,
      projection: todoAppProjection.status,
      projectionMode: todoAppProjection.contractMode,
    },
    validateAll: {
      status: validateAll.status,
      aggregateStatus: validateAll.aggregateStatus,
      sliceCount: validateAll.sliceCount,
    },
    candidateObservation: {
      status: candidateObservation.status,
      separated: true,
    },
  }

  if (outputPath) {
    mkdirSync(dirname(resolve(outputPath)), { recursive: true })
    writeFileSync(resolve(outputPath), `${JSON.stringify(payload, null, 2)}\n`)
  }

  console.log(JSON.stringify(payload, null, 2))
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}
