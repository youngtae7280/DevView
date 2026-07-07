import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())
const projectMemoryPath = 'fixtures/project-memory/devview-project-memory.preview.json'
const graphSourcePath = 'fixtures/project-memory/graph-source.json'

afterEach(() => {
  cleanupWorkspaces()
})

describe('Project Memory extension gap report CLI', () => {
  it('reports synthetic Project Memory taxonomy gaps without applying extensions', async () => {
    const workspace = createWorkspace()
    writeSyntheticProjectMemoryFixture(workspace)
    const output = join('.tmp', 'synthetic-extension-gaps.json')
    const markdown = join('.tmp', 'synthetic-extension-gaps.md')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-project-memory-extension-gaps',
        '--project-memory',
        projectMemoryPath,
        '--graph-source',
        graphSourcePath,
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
    expect(report.projectMemorySummary.taxonomyProfileId).toBe('synthetic-taxonomy-v0')
    expect(report.observedVocabulary.combinedNodeKinds).toEqual(expect.arrayContaining(['synthetic-adapter']))
    expect(report.observedVocabulary.combinedEdgeKinds).toEqual(expect.arrayContaining(['synthetic-flow']))
    expect(report.missingKinds.map((entry: { kind: string }) => entry.kind)).toEqual(
      expect.arrayContaining(['synthetic-boundary']),
    )
    expect(report.extraObservedKinds.map((entry: { kind: string }) => entry.kind)).toContain('synthetic-adapter')
    expect(report.unapprovedExtensionKinds.length).toBeGreaterThan(0)
    expect(report.viewTreeCoverageGaps).toEqual([])
    expect(report.graphSourceMutated).toBe(false)
    expect(report.graphDeltaApplied).toBe(false)
    expect(report.runtimeEvidenceSatisfied).toBe(false)
    expect(report.equivalenceProven).toBe(false)
    expect(report.scopeEnforced).toBe(false)
    expect(report.ciEnforcementEnabled).toBe(false)
    expect(markdownText).toContain('DevView Project Memory Extension Gap Report')
    expect(markdownText).toContain('synthetic-taxonomy-v0')
  })

  it('blocks report output that would overwrite source authority artifacts', async () => {
    const workspace = createWorkspace()
    writeSyntheticProjectMemoryFixture(workspace)
    const before = readFileSync(join(workspace, projectMemoryPath), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-project-memory-extension-gaps',
        '--project-memory',
        projectMemoryPath,
        '--graph-source',
        graphSourcePath,
        '--output',
        projectMemoryPath,
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
    expect(readFileSync(join(workspace, projectMemoryPath), 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/should-not-exist.md'))).toBe(false)
  })
})

function writeSyntheticProjectMemoryFixture(workspace: string): void {
  writeJson(join(workspace, projectMemoryPath), {
    artifactRole: 'devview-project-memory-preview',
    status: 'devview-project-memory-preview-generated',
    projectMemoryId: 'synthetic-project-memory',
    projectIdentity: {
      projectId: 'synthetic-project',
      projectName: 'Synthetic Project',
    },
    devviewMode: 'retrofit',
    projectDirection: {
      current: 'synthetic-retrofit',
    },
    taxonomyProfileRef: {
      taxonomyProfileId: 'synthetic-taxonomy-v0',
      authorityStatus: 'preview-only',
      coreNodeKinds: ['product-intent', 'change'],
      coreEdgeKinds: ['depends-on'],
      extensionNodeKinds: ['synthetic-boundary'],
      extensionEdgeKinds: ['synthetic-approved-flow'],
    },
    viewTreeProfileRef: {
      viewTreeProfileId: 'synthetic-view-tree-v0',
      authorityStatus: 'preview-only',
      requiredExtensionNodeKinds: ['synthetic-boundary'],
    },
  })
  writeJson(join(workspace, graphSourcePath), {
    artifactRole: 'retrofit-graph-source-v0',
    status: 'active-retrofit-graph-source',
    nodes: [
      { id: 'product.synthetic', kind: 'product-intent' },
      { id: 'module.synthetic', kind: 'synthetic-adapter' },
    ],
    edges: [{ id: 'edge.synthetic', from: 'product.synthetic', to: 'module.synthetic', kind: 'synthetic-flow' }],
  })
}
