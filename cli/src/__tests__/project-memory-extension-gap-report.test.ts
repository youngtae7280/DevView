import { cpSync, existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Project Memory extension gap report CLI', () => {
  it('reports WindowsUtility Project Memory taxonomy gaps without applying extensions', async () => {
    const workspace = createWorkspace()
    copyWindowsUtilityFixture(workspace)
    const output = join('.tmp', 'windowsutility-extension-gaps.json')
    const markdown = join('.tmp', 'windowsutility-extension-gaps.md')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-project-memory-extension-gaps',
        '--project-memory',
        'examples/internal-legacy/retrofit/windowsutility/devview-project-memory.preview.json',
        '--graph-source',
        'examples/internal-legacy/retrofit/windowsutility/graph-source.json',
        '--output',
        output,
        '--markdown',
        markdown,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)
    const report = JSON.parse(readFileSync(join(workspace, output), 'utf8'))
    const markdownText = readFileSync(join(workspace, markdown), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(report.artifactRole).toBe('devview-project-memory-extension-gap-report')
    expect(report.projectMemorySummary.devviewMode).toBe('retrofit')
    expect(report.projectMemorySummary.taxonomyProfileId).toBe('legacy-retrofit-windowsutility-v0')
    expect(report.observedVocabulary.combinedNodeKinds).toEqual(expect.arrayContaining(['legacy-utility-module']))
    expect(report.observedVocabulary.combinedEdgeKinds).toEqual(expect.arrayContaining(['legacy-module-scope']))
    expect(report.missingKinds.map((entry: { kind: string }) => entry.kind)).toEqual(
      expect.arrayContaining(['hardware-boundary', 'native-interop']),
    )
    expect(report.extraObservedKinds.map((entry: { kind: string }) => entry.kind)).toContain('product-intent')
    expect(report.unapprovedExtensionKinds.length).toBeGreaterThan(0)
    expect(report.viewTreeCoverageGaps.length).toBeGreaterThan(0)
    expect(report.graphSourceMutated).toBe(false)
    expect(report.graphDeltaApplied).toBe(false)
    expect(report.runtimeEvidenceSatisfied).toBe(false)
    expect(report.equivalenceProven).toBe(false)
    expect(report.scopeEnforced).toBe(false)
    expect(report.ciEnforcementEnabled).toBe(false)
    expect(markdownText).toContain('DevView Project Memory Extension Gap Report')
    expect(markdownText).toContain('legacy-retrofit-windowsutility-v0')
  })

  it('blocks report output that would overwrite source authority artifacts', async () => {
    const workspace = createWorkspace()
    copyWindowsUtilityFixture(workspace)
    const projectMemoryPath = join(
      workspace,
      'examples/internal-legacy/retrofit/windowsutility/devview-project-memory.preview.json',
    )
    const before = readFileSync(projectMemoryPath, 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-project-memory-extension-gaps',
        '--project-memory',
        'examples/internal-legacy/retrofit/windowsutility/devview-project-memory.preview.json',
        '--graph-source',
        'examples/internal-legacy/retrofit/windowsutility/graph-source.json',
        '--output',
        'examples/internal-legacy/retrofit/windowsutility/devview-project-memory.preview.json',
        '--markdown',
        '.tmp/should-not-exist.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source DevView Project Memory preview')
    expect(readFileSync(projectMemoryPath, 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/should-not-exist.md'))).toBe(false)
  })
})

function copyWindowsUtilityFixture(workspace: string): void {
  cpSync(
    join(pluginRoot, 'examples/internal-legacy/retrofit/windowsutility'),
    join(workspace, 'examples/internal-legacy/retrofit/windowsutility'),
    {
      recursive: true,
    },
  )
}
