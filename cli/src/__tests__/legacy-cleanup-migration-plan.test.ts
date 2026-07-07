import { existsSync, readFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeText } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('DevView legacy cleanup migration plan CLI', () => {
  it('reports dry-run operations and keeps safety flags false', async () => {
    const workspace = createLegacyExamplesWorkspace()

    const result = await runDevViewCli(['cleanup-legacy', '--dry-run', '--scope', 'examples', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-legacy-cleanup-migration-plan-report')
    expect(payload.status).toBe('devview-legacy-cleanup-migration-plan-reported')
    expect(payload.dryRun).toBe(true)
    expect(payload.scope).toBe('examples')
    expect(payload.filesMutated).toBe(false)
    expect(payload.deletionsPerformed).toBe(false)
    expect(payload.renamesPerformed).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(payload.providerInvoked).toBe(false)
    expect(payload.networkCallMade).toBe(false)
    expect(payload.operationCount).toBeGreaterThan(0)
    expect(payload.operationSummaryByKind['keep-internal-hidden-compatibility']).toBeGreaterThan(0)
  })

  it('does not report the completed Todo fixture rename when only the DevView path exists', async () => {
    const workspace = createLegacyExamplesWorkspace()

    const result = await runDevViewCli(['cleanup-legacy', '--dry-run', '--scope', 'examples', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stdout)
    const operation = payload.operations.find(
      (entry: Record<string, unknown>) => entry.sourcePath === 'examples/valid/todo-app-pbe-run',
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(operation).toBeUndefined()
  })

  it('includes high-risk Todo fixture rename operation for old-path migration fixtures without mutating files', async () => {
    const workspace = createLegacyExamplesWorkspace({ includeOldTodoFixture: true })

    const result = await runDevViewCli(['cleanup-legacy', '--dry-run', '--scope', 'examples', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stdout)
    const operation = payload.operations.find(
      (entry: Record<string, unknown>) => entry.sourcePath === 'examples/valid/todo-app-pbe-run',
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(operation).toMatchObject({
      operationKind: 'rename-path',
      targetPath: 'examples/valid/todo-app-devview-run',
      classification: 'needs-devview-rename',
      riskLevel: 'high',
      collisionStatus: 'no-collision',
    })
    expect(existsSync(join(workspace, 'examples/valid/todo-app-pbe-run'))).toBe(true)
    expect(existsSync(join(workspace, 'examples/valid/todo-app-devview-run'))).toBe(false)
  })

  it('classifies the internal legacy examples boundary as hidden compatibility', async () => {
    const workspace = createLegacyExamplesWorkspace()
    writeText(
      join(workspace, 'examples/internal-legacy/adoption/todo-search-slice/README.md'),
      'Historical migration fixture with pbe wording.\n',
    )

    const result = await runDevViewCli(['cleanup-legacy', '--dry-run', '--scope', 'examples', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stdout)
    const operation = payload.operations.find(
      (entry: Record<string, unknown>) => entry.sourcePath === 'examples/internal-legacy',
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(operation).toMatchObject({
      operationKind: 'keep-internal-hidden-compatibility',
      classification: 'internal-hidden-compatibility',
      riskLevel: 'high',
      collisionStatus: 'not-applicable',
    })
  })

  it('marks path collisions for planned targets', async () => {
    const workspace = createLegacyExamplesWorkspace({ includeOldTodoFixture: true })
    mkdirSync(join(workspace, 'examples/valid/todo-app-devview-run'), { recursive: true })

    const result = await runDevViewCli(['cleanup-legacy', '--dry-run', '--scope', 'examples', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stdout)
    const operation = payload.operations.find(
      (entry: Record<string, unknown>) => entry.sourcePath === 'examples/valid/todo-app-pbe-run',
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(operation.collisionStatus).toBe('collision-detected')
  })

  it('requires --dry-run', async () => {
    const workspace = createLegacyExamplesWorkspace()

    const result = await runDevViewCli(['cleanup-legacy', '--scope', 'examples', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.InvalidArguments)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].code).toBe('DEVVIEW_LEGACY_CLEANUP_DRY_RUN_REQUIRED')
  })

  it('blocks unsafe output paths without writing either output', async () => {
    const workspace = createLegacyExamplesWorkspace()
    const sourcePath = join(workspace, 'examples/README.md')
    const before = readFileSync(sourcePath, 'utf8')

    const result = await runDevViewCli(
      [
        'cleanup-legacy',
        '--dry-run',
        '--scope',
        'examples',
        '--output',
        'examples/README.md',
        '--markdown',
        '.tmp/plan.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(readFileSync(sourcePath, 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/plan.md'))).toBe(false)
  })

  it('blocks output and markdown collision with zero write', async () => {
    const workspace = createLegacyExamplesWorkspace()

    const result = await runDevViewCli(
      [
        'cleanup-legacy',
        '--dry-run',
        '--scope',
        'examples',
        '--output',
        '.tmp/plan.json',
        '--markdown',
        '.tmp/plan.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(existsSync(join(workspace, '.tmp/plan.json'))).toBe(false)
  })
})

function createLegacyExamplesWorkspace(options: { includeOldTodoFixture?: boolean } = {}): string {
  const workspace = createWorkspace()
  writeText(join(workspace, 'examples/README.md'), '# Legacy Examples\n\nUse pbe wording here.\n')
  if (options.includeOldTodoFixture) {
    writeText(
      join(workspace, 'examples/valid/todo-app-pbe-run/generated/generated-read-model.json'),
      '{"commandIdentity":"devview graph read-model generate --slice examples/valid/todo-app-pbe-run"}\n',
    )
    writeText(
      join(workspace, 'examples/valid/todo-app-pbe-run/.devview/tree/product-tree.json'),
      '{"artifact":"legacy pbe tree"}\n',
    )
  } else {
    writeText(
      join(workspace, 'examples/valid/todo-app-devview-run/generated/generated-read-model.json'),
      '{"commandIdentity":"devview graph read-model generate --slice examples/valid/todo-app-devview-run"}\n',
    )
    writeText(
      join(workspace, 'examples/valid/todo-app-devview-run/.devview/tree/product-tree.json'),
      '{"artifact":"legacy pbe tree"}\n',
    )
  }
  writeText(
    join(workspace, 'examples/internal-legacy/adoption/todo-search-slice/README.md'),
    'Historical adoption example with pbe command text.\n',
  )
  writeText(join(workspace, 'docs/reference.md'), 'examples/internal-legacy/adoption/todo-search-slice\n')
  writeText(join(workspace, 'package.json'), '{"bin":{"pbe":"./dist/cli/index.js"}}\n')
  writeText(join(workspace, 'scripts/validate-devview-files.js'), 'console.log("pbe")\n')
  writeText(join(workspace, 'scripts/validators/devview-layout.js'), 'console.log("pbe layout")\n')
  return workspace
}
