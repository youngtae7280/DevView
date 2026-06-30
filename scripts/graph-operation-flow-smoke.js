import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cliPath = join(repoRoot, 'dist/cli/index.js')
const tempRoot = mkdtempSync(join(tmpdir(), 'pbe-graph-operation-flow-'))
const outputArgIndex = process.argv.indexOf('--output')
const outputPath = outputArgIndex >= 0 ? process.argv[outputArgIndex + 1] : null

function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function writeText(file, value) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, value, 'utf8')
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(
      [`Command failed: ${command} ${args.join(' ')}`, result.stdout.trim(), result.stderr.trim()]
        .filter(Boolean)
        .join('\n'),
    )
  }
  return result
}

function runCli(args) {
  const result = run(process.execPath, [cliPath, ...args], tempRoot)
  try {
    return JSON.parse(result.stdout)
  } catch (error) {
    throw new Error(`Command did not return JSON: pbe ${args.join(' ')}\n${result.stdout}\n${error.message}`)
  }
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

try {
  const targetRepo = join(tempRoot, 'target')
  writeText(join(targetRepo, 'src/search.js'), 'export function matches() {\n  return false\n}\n')
  run('git', ['init'], targetRepo)
  run('git', ['config', 'user.email', 'pbe@example.test'], targetRepo)
  run('git', ['config', 'user.name', 'PBE Smoke'], targetRepo)
  run('git', ['add', '.'], targetRepo)
  run('git', ['commit', '-m', 'baseline'], targetRepo)

  writeJson(join(tempRoot, 'records/change.search-whitespace.json'), {
    status: 'planned-not-implemented',
    target: {
      projectName: 'graph-operation-smoke',
      repoPath: targetRepo,
      slice: 'search whitespace behavior',
      writeBoundary: 'single allowed source file',
    },
    userConfirmedIntent: {
      summary: 'Treat repeated whitespace as one separator in search matching.',
      includedBehavior: ['Update search matching behavior in src/search.js.'],
      excludedBehavior: ['Do not change package metadata.', 'Do not touch unrelated source files.'],
    },
    implementationPlan: {
      expectedFiles: ['src/search.js'],
      expectedFlow: 'one source file behavior update',
      nonGoals: ['package metadata', 'unrelated source files'],
    },
    forbiddenFlows: [
      {
        flow: 'package metadata',
        reason: 'The selected slice is a behavior edit in src/search.js only.',
      },
    ],
    evidence: {
      build: { status: 'not-run-in-smoke' },
      runtime: { status: 'not-run-in-smoke' },
      hardware: { status: 'not-required' },
    },
    finalState: {
      status: 'implemented-local-smoke-pass',
      activeCodeState: 'active-local-behavior-change',
    },
  })
  writeJson(join(tempRoot, 'graph-source.json'), {
    schemaVersion: 1,
    artifactRole: 'retrofit-graph-source-v0',
    status: 'active-retrofit-graph-source',
    records: [
      {
        id: 'change.search-whitespace',
        path: 'records/change.search-whitespace.json',
        expectedStatus: 'planned-not-implemented',
        expectedActiveCodeState: 'active-local-behavior-change',
      },
    ],
    nodes: [
      {
        id: 'module.search',
        kind: 'module',
        state: 'observed',
        intentClaim: 'Search matching behavior lives in the search module.',
      },
      {
        id: 'boundary.search-single-file',
        kind: 'forbidden-flow-boundary',
        state: 'user-confirmed',
        intentClaim: 'The selected change must stay inside src/search.js.',
      },
      {
        id: 'change.search-whitespace',
        kind: 'retrofit-change-record',
        state: 'planned-not-implemented',
        intentClaim: 'Whitespace normalization behavior is planned but not applied.',
      },
    ],
    edges: [
      {
        id: 'edge.search-drives-whitespace-change',
        from: 'module.search',
        to: 'change.search-whitespace',
        kind: 'change-driver',
        edgeIntent: {
          classifications: ['behavior-change', 'search-normalization'],
          claim: 'The search module owns the selected whitespace behavior change.',
          confidence: 'user-confirmed',
        },
      },
      {
        id: 'edge.whitespace-change-guards-scope',
        from: 'change.search-whitespace',
        to: 'boundary.search-single-file',
        kind: 'forbidden-flow-guard',
        edgeIntent: {
          classifications: ['non-goal', 'safety-boundary'],
          claim: 'The change must not drift into package metadata or unrelated files.',
          confidence: 'user-confirmed',
        },
      },
    ],
  })

  const pack = runCli([
    'graph',
    'operation',
    'generate-pack',
    '--graph-source',
    'graph-source.json',
    '--record',
    'change.search-whitespace',
    '--output',
    'outputs/instruction-pack.json',
    '--markdown',
    'outputs/instruction-pack.md',
    '--json',
  ])
  assertEqual(pack.status, 'generated-from-graph-source', 'instruction pack status')
  assertEqual(pack.allowedScope.files.length, 1, 'instruction pack allowed file count')
  assertIncludes(pack.allowedScope.files, 'src/search.js', 'instruction pack allowed files')

  writeText(join(targetRepo, 'src/search.js'), 'export function matches() {\n  return true\n}\n')

  const delta = runCli([
    'graph',
    'operation',
    'capture-delta',
    '--graph-source',
    'graph-source.json',
    '--instruction-pack',
    'outputs/instruction-pack.json',
    '--target-repo',
    'target',
    '--output',
    'outputs/graph-delta.json',
    '--markdown',
    'outputs/graph-delta.md',
    '--json',
  ])
  assertEqual(delta.status, 'generated-from-target-diff', 'graph delta status')
  assertEqual(delta.dirtyFileCount, 1, 'graph delta dirty file count')
  assertEqual(delta.changedFiles[0]?.path, 'src/search.js', 'graph delta changed file')

  const proposal = runCli([
    'graph',
    'operation',
    'propose-update',
    '--graph-delta',
    'outputs/graph-delta.json',
    '--output',
    'outputs/graph-update-proposal.json',
    '--markdown',
    'outputs/graph-update-proposal.md',
    '--json',
  ])
  assertEqual(proposal.status, 'generated-from-graph-delta', 'graph update proposal status')
  assertEqual(proposal.boundaries.mutatesGraphSource, false, 'proposal mutation boundary')

  const beforePreview = readFileSync(join(tempRoot, 'graph-source.json'), 'utf8')
  const preview = runCli([
    'graph',
    'operation',
    'apply-proposal',
    '--proposal',
    'outputs/graph-update-proposal.json',
    '--json',
  ])
  assertEqual(preview.status, 'graph-update-proposal-preview-pass', 'apply-proposal preview status')
  assertEqual(preview.applied, false, 'apply-proposal preview applied boundary')
  assertEqual(
    readFileSync(join(tempRoot, 'graph-source.json'), 'utf8'),
    beforePreview,
    'preview graph-source non-mutation',
  )

  const applied = runCli([
    'graph',
    'operation',
    'apply-proposal',
    '--proposal',
    'outputs/graph-update-proposal.json',
    '--apply',
    '--json',
  ])
  assertEqual(applied.status, 'graph-update-proposal-apply-pass', 'apply-proposal apply status')
  assertEqual(applied.applied, true, 'apply-proposal apply boundary')

  const graphSource = readJson(join(tempRoot, 'graph-source.json'))
  const recordRef = graphSource.records.find((entry) => entry.id === 'change.search-whitespace')
  const node = graphSource.nodes.find((entry) => entry.id === 'change.search-whitespace')
  assertEqual(recordRef.expectedStatus, 'implemented-local-smoke-pass', 'applied record expectedStatus')
  assertEqual(recordRef.expectedActiveCodeState, 'active-local-behavior-change', 'applied record activeCodeState')
  assertEqual(node.state, 'implemented-local-smoke-pass', 'applied node state')

  const summary = {
    status: 'pbe-graph-operation-flow-pass',
    tempWorkspace: outputPath ? tempRoot : 'removed-after-smoke',
    tempWorkspaceRetained: Boolean(outputPath),
    commands: [pack.command, delta.command, proposal.command, preview.command, applied.command],
    changedFiles: delta.changedFiles,
    appliedChangeCount: applied.changeCount,
    boundaries: {
      previewDidNotMutateGraphSource: true,
      applyMutatedGraphSourceOnly: applied.boundaries.graphSourceWritten === true,
      targetPatchAppliedByPbe: false,
    },
  }

  if (outputPath) {
    writeJson(resolve(outputPath), summary)
  }
  console.log(JSON.stringify(summary, null, 2))
} finally {
  if (!outputPath) {
    rmSync(tempRoot, { recursive: true, force: true })
  }
}
