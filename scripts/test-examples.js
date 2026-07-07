import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')
const cliPath = path.join(repoRoot, 'dist', 'cli', 'index.js')
const validExampleRoot = path.join(repoRoot, 'examples', 'valid', 'todo-app-devview-run')
const invalidExamplesRoot = path.join(repoRoot, 'examples', 'invalid')

const validExamples = [
  {
    name: 'todo-app-devview-run',
    source: validExampleRoot,
    commands: [
      ['validate', '--json'],
      ['trace', 'check', '--stage', 'wpd', '--json'],
      ['trace', 'check', '--stage', 'vd', '--json'],
      ['trace', 'check', '--stage', 'execution', '--json'],
      ['trace', 'check', '--stage', 'review', '--json'],
      ['trace', 'check', '--stage', 'accept', '--json'],
    ],
  },
]

const invalidExamples = [
  'ambiguous-acceptance',
  'missing-work-link',
  'missing-test-coverage',
  'missing-evidence',
  'stale-evidence',
  'assistant-accepted',
  'deferred-scope-leak',
  'change-without-impact',
].map((name) => readJson(path.join(invalidExamplesRoot, name, 'fixture.json')))

const failures = []

if (!existsSync(cliPath)) {
  failGlobal(`CLI build output is missing: ${path.relative(repoRoot, cliPath)}`)
} else {
  runValidExamples()
  runInvalidExamples()
}

if (failures.length > 0) {
  console.error('\nDevView example fixture test failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('\nDevView example fixture test passed.')

function runValidExamples() {
  console.log('Valid examples:')
  const tempRoots = []
  try {
    for (const example of validExamples) {
      const runtimeRoot = materializeValidFixture(example)
      tempRoots.push(runtimeRoot)
      for (const command of example.commands) {
        const result = runPbe(command, runtimeRoot)
        const commandText = `devview ${command.join(' ')}`
        if (result.status !== 0) {
          failures.push(
            `${example.name}: ${commandText} expected exit 0, got ${result.status}\n${trimOutput(result.output)}`,
          )
          console.log(`  FAIL ${example.name}: ${commandText}`)
        } else {
          console.log(`  PASS ${example.name}: ${commandText}`)
        }
      }
    }
  } finally {
    for (const tempRoot of tempRoots) {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  }
}

function runInvalidExamples() {
  console.log('\nInvalid examples:')
  const tempRoots = []
  try {
    for (const example of invalidExamples) {
      const runtimeRoot = materializeInvalidFixture(example)
      tempRoots.push(runtimeRoot)
      const result = runPbe(example.command, runtimeRoot)
      const commandText = `devview ${example.command.join(' ')}`
      if (result.status === 0) {
        failures.push(`${example.name}: ${commandText} expected non-zero exit code.`)
        console.log(`  FAIL ${example.name}: ${commandText}`)
        continue
      }
      const codes = extractIssueCodes(result.output)
      if (!codes.includes(example.expectedIssueCode)) {
        failures.push(
          `${example.name}: expected issue code ${example.expectedIssueCode}, got ${codes.join(', ') || '<none>'}\n${trimOutput(
            result.output,
          )}`,
        )
        console.log(`  FAIL ${example.name}: expected ${example.expectedIssueCode}`)
        continue
      }
      console.log(`  PASS ${example.name}: ${example.expectedIssueCode}`)
    }
  } finally {
    for (const tempRoot of tempRoots) {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  }
}

function materializeInvalidFixture(example) {
  const runtimeRoot = mkdtempSync(path.join(tmpdir(), `devview-example-${example.name}-`))
  cpSync(validExampleRoot, runtimeRoot, { recursive: true })
  applyMutation(runtimeRoot, example.mutation)
  return runtimeRoot
}

function materializeValidFixture(example) {
  const runtimeRoot = mkdtempSync(path.join(tmpdir(), `devview-example-${example.name}-`))
  cpSync(example.source, runtimeRoot, { recursive: true })
  copyPluginValidationAssets(runtimeRoot)
  return runtimeRoot
}

function copyPluginValidationAssets(targetRoot) {
  for (const directory of ['.codex-plugin', 'skills', 'templates', 'schemas', 'docs', 'examples']) {
    cpSync(path.join(repoRoot, directory), path.join(targetRoot, directory), { recursive: true })
  }
  for (const file of ['AGENTS.md']) {
    cpSync(path.join(repoRoot, file), path.join(targetRoot, file))
  }
}

function applyMutation(root, mutation) {
  switch (mutation) {
    case 'ambiguousAcceptance': {
      const product = readArtifact(root, '.devview/tree/product-tree.json')
      const node = findNode(product, 'PT-1')
      node.acceptanceCriteria[0].observableResult = 'The todo interaction feels nice to the user.'
      writeArtifact(root, '.devview/tree/product-tree.json', product)
      break
    }
    case 'missingWorkLink': {
      const work = readArtifact(root, '.devview/tree/work-tree.json')
      findNode(work, 'WT-1').derivedFromProductNodeIds = []
      writeArtifact(root, '.devview/tree/work-tree.json', work)
      break
    }
    case 'missingTestCoverage': {
      const test = readArtifact(root, '.devview/tree/test-tree.json')
      test.nodes = test.nodes.filter((node) => node.id !== 'TT-1')
      writeArtifact(root, '.devview/tree/test-tree.json', test)
      break
    }
    case 'missingEvidence': {
      const evidence = readArtifact(root, '.devview/evidence/evidence-tree.json')
      evidence.evidence = []
      writeArtifact(root, '.devview/evidence/evidence-tree.json', evidence)
      break
    }
    case 'staleEvidence': {
      const evidence = readArtifact(root, '.devview/evidence/evidence-tree.json')
      evidence.evidence[0].createdAt = '2026-06-12T08:00:00.000Z'
      evidence.evidence[0].updatedAt = '2026-06-12T08:05:00.000Z'
      writeArtifact(root, '.devview/evidence/evidence-tree.json', evidence)
      writeStateFor(root, 'ACEP_RUN_DONE', 'verified')
      break
    }
    case 'assistantAccepted': {
      const acceptance = readArtifact(root, '.devview/control/acceptance-tree.json')
      acceptance.branches[0].decisionSource.actor = 'assistant'
      delete acceptance.branches[0].userAcceptedAt
      writeArtifact(root, '.devview/control/acceptance-tree.json', acceptance)
      writeStateFor(root, 'WAITING_REVIEW_RESULT', 'submitted_for_review')
      break
    }
    case 'deferredScopeLeak': {
      const product = readArtifact(root, '.devview/tree/product-tree.json')
      const node = findNode(product, 'PT-1')
      node.status = 'deferred'
      node.scopeClass = 'deferred'
      writeArtifact(root, '.devview/tree/product-tree.json', product)
      break
    }
    case 'changeWithoutImpact': {
      const impact = readArtifact(root, '.devview/control/impact-tree.json')
      impact.impacts = []
      writeArtifact(root, '.devview/control/impact-tree.json', impact)
      break
    }
    default:
      throw new Error(`Unknown fixture mutation: ${mutation}`)
  }
}

function writeStateFor(root, targetState, deliveryStatus) {
  const state = readArtifact(root, '.devview/blueprint/devview-state.json')
  const history = state.autoflow.stateHistory
  const index = history.findIndex((entry) => entry.to === targetState)
  state.autoflow.state = targetState
  state.autoflow.stateHistory = index >= 0 ? history.slice(0, index + 1) : []
  state.autoflow.currentGate = targetState === 'WAITING_REVIEW_RESULT' ? 'review_result' : null
  state.autoflow.nextStep = targetState === 'ACEP_RUN_DONE' ? 'review_result' : null
  state.deliveryStatus = deliveryStatus
  if (deliveryStatus !== 'accepted') {
    delete state.acceptance
  }
  writeArtifact(root, '.devview/blueprint/devview-state.json', state)
}

function runPbe(args, cwd) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  })
  return {
    status: result.status ?? 1,
    output: `${result.stdout || ''}${result.stderr || ''}`,
  }
}

function extractIssueCodes(output) {
  const parsed = parseJsonOutput(output)
  if (!parsed || !Array.isArray(parsed.issues)) {
    return []
  }
  return parsed.issues.map((issue) => String(issue.code || '')).filter(Boolean)
}

function parseJsonOutput(output) {
  try {
    return JSON.parse(output)
  } catch {
    return null
  }
}

function readArtifact(root, relativePath) {
  return readJson(path.join(root, relativePath))
}

function writeArtifact(root, relativePath, value) {
  writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function findNode(tree, id) {
  const node = tree.nodes.find((candidate) => candidate.id === id)
  if (!node) {
    throw new Error(`Fixture node not found: ${id}`)
  }
  return node
}

function trimOutput(output) {
  const trimmed = output.trim()
  return trimmed.length > 1800 ? `${trimmed.slice(0, 1800)}...` : trimmed
}

function failGlobal(message) {
  failures.push(message)
}
