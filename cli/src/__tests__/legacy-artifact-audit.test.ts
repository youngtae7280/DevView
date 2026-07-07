import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import {
  RETIRED_PRODUCT_ACRONYM_LOWER,
  RETIRED_PRODUCT_ACRONYM_UPPER,
  RETIRED_PRODUCT_INTAKE_ACRONYM,
  RETIRED_PRODUCT_NAME,
  RETIRED_STORAGE_ROOT,
} from '../core/retired-term-patterns.js'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('DevView legacy artifact audit CLI', () => {
  it('uses DevView as the public CLI help identity', async () => {
    const workspace = createWorkspace()

    const result = await runDevViewCli(['--help'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(result.stdout).toContain('DevView CLI')
    expect(result.stdout).toContain('devview <command> [options]')
    expect(result.stdout).toContain('report-legacy-artifacts')
    expect(result.stdout).not.toMatch(retiredHelpPattern())
  })

  it('reports legacy references without mutating files', async () => {
    const workspace = createWorkspace()
    await mkdir(join(workspace, 'docs'), { recursive: true })
    await mkdir(join(workspace, 'examples/sample', RETIRED_STORAGE_ROOT, 'tree'), { recursive: true })
    await mkdir(join(workspace, 'cli/src'), { recursive: true })
    writeFileSync(
      join(workspace, 'README.md'),
      `DevView public docs should not say ${RETIRED_PRODUCT_ACRONYM_UPPER} here.\n`,
      'utf8',
    )
    writeFileSync(
      join(workspace, 'docs/old.md'),
      `${RETIRED_PRODUCT_NAME} ${RETIRED_PRODUCT_INTAKE_ACRONYM} note.\n`,
      'utf8',
    )
    writeFileSync(
      join(workspace, 'examples/sample', RETIRED_STORAGE_ROOT, 'tree/product-tree.json'),
      `{"legacy":"${RETIRED_PRODUCT_ACRONYM_LOWER}"}\n`,
      'utf8',
    )
    writeFileSync(
      join(workspace, 'cli/src/compat.ts'),
      `const command = "${RETIRED_PRODUCT_ACRONYM_LOWER} validate"\n`,
      'utf8',
    )

    const before = readFileSync(join(workspace, 'docs/old.md'), 'utf8')
    const result = await runDevViewCli(['report-legacy-artifacts', '--json'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-legacy-artifact-audit-report')
    expect(payload.status).toBe('devview-legacy-artifact-audit-reported')
    expect(payload.cleanupMode).toBe('dry-run-no-file-mutation')
    expect(payload.filesMutated).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.findingsByClassification['needs-devview-rename']).toBeGreaterThan(0)
    expect(payload.findingsByClassification['delete-candidate']).toBeGreaterThan(0)
    expect(payload.findingsByClassification['migration-fixture-only']).toBeGreaterThan(0)
    expect(payload.findingsByClassification['internal-hidden-compatibility']).toBeGreaterThan(0)
    expect(readFileSync(join(workspace, 'docs/old.md'), 'utf8')).toBe(before)
  })

  it('classifies docs internal legacy archive findings as hidden compatibility', async () => {
    const workspace = createWorkspace()
    await mkdir(join(workspace, 'docs/internal-legacy'), { recursive: true })
    writeFileSync(
      join(workspace, 'docs/internal-legacy/old.md'),
      `Historical ${RETIRED_PRODUCT_ACRONYM_UPPER} migration note.\n`,
      'utf8',
    )

    const result = await runDevViewCli(['report-legacy-artifacts', '--json'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)
    const finding = payload.findings.find(
      (entry: Record<string, unknown>) => entry.path === 'docs/internal-legacy/old.md',
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(finding.classification).toBe('internal-hidden-compatibility')
  })

  it('classifies internal legacy examples as hidden compatibility', async () => {
    const workspace = createWorkspace()
    await mkdir(join(workspace, 'examples/internal-legacy/adoption'), { recursive: true })
    writeFileSync(
      join(workspace, 'examples/internal-legacy/adoption/fixture.md'),
      `Historical ${RETIRED_PRODUCT_ACRONYM_UPPER} fixture.\n`,
      'utf8',
    )

    const result = await runDevViewCli(['report-legacy-artifacts', '--json'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)
    const byPath = new Map(payload.findings.map((entry: Record<string, unknown>) => [entry.path, entry]))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(byPath.get('examples/internal-legacy/adoption/fixture.md')).toMatchObject({
      classification: 'internal-hidden-compatibility',
    })
  })

  it('writes an optional report file only when requested', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'package.json'), { scripts: { legacy: `${RETIRED_PRODUCT_ACRONYM_LOWER} validate` } })

    const result = await runDevViewCli(
      ['graph', 'read-model', 'report-legacy-artifacts', '--output', '.tmp/audit.json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )

    const outputPath = join(workspace, '.tmp/audit.json')
    const written = JSON.parse(readFileSync(outputPath, 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(existsSync(outputPath)).toBe(true)
    expect(written.writtenOutputPath).toBe('.tmp/audit.json')
    expect(written.filesMutated).toBe(false)
  })
})

function retiredHelpPattern(): RegExp {
  return new RegExp(
    [
      RETIRED_PRODUCT_NAME,
      `\\b${RETIRED_PRODUCT_ACRONYM_UPPER}\\b`,
      `\\b${RETIRED_PRODUCT_ACRONYM_LOWER}\\b`,
      `\\${RETIRED_STORAGE_ROOT}`,
    ].join('|'),
  )
}
