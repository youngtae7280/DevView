import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())
const graphSourcePath = 'fixtures/graph/graph-source.json'
const instructionPackPath = 'fixtures/graph/instruction-pack.json'
const projectMemoryPath = 'fixtures/graph/project-memory.json'

afterEach(() => {
  cleanupWorkspaces()
})

describe('DevViewGraph HTML inspector CLI', () => {
  it('renders synthetic graph data and static HTML inspector', async () => {
    const workspace = createWorkspace()
    writeSyntheticGraphFixture(workspace)
    const htmlOutput = join('.tmp', 'synthetic.devviewgraph.html')
    const dataOutput = join('.tmp', 'synthetic.devviewgraph.data.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'render-devview-graph',
        '--graph-source',
        graphSourcePath,
        '--record',
        'change.synthetic-active',
        '--instruction-pack',
        instructionPackPath,
        '--output',
        htmlOutput,
        '--data-output',
        dataOutput,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)
    const data = JSON.parse(readFileSync(join(workspace, dataOutput), 'utf8'))
    const html = readFileSync(join(workspace, htmlOutput), 'utf8')
    const selected = data.subgraphs[0]

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('graph read-model render-devview-graph')
    expect(data.artifactRole).toBe('devview-graph-html-data-preview')
    expect(data.requestSummary.sourceRecordId).toBe('change.synthetic-active')
    expect(data.requestSummary.selectedTreeIds).toEqual(
      expect.arrayContaining(['tree.domain-source', 'tree.selected-pack-context']),
    )
    expect(data.workHistory.map((entry: { recordId: string }) => entry.recordId)).toEqual([
      'change.synthetic-reference',
      'change.synthetic-active',
    ])
    expect(data.workHistory[1].isCurrentRequest).toBe(true)
    expect(data.graph.layoutMode).toBe('deterministic-network-orbit')
    expect(data.graph.nodes.length).toBeGreaterThan(0)
    expect(data.graph.edges.length).toBeGreaterThan(0)
    expect(new Set(data.graph.nodes.map((node: { x: number }) => node.x)).size).toBeGreaterThan(3)
    expect(data.trees.map((tree: { id: string }) => tree.id)).toEqual(
      expect.arrayContaining([
        'tree.domain-source',
        'tree.retrofit-change',
        'tree.risk-boundary',
        'tree.selected-pack-context',
      ]),
    )
    expect(data.workflowSteps.map((step: { id: string }) => step.id)).toEqual([
      'workflow.request-ir',
      'workflow.domain-tree',
      'workflow.change-tree',
      'workflow.risk-tree',
      'workflow.selected-subgraph',
      'workflow.instruction-pack',
    ])
    expect(selected.nodeIds).toEqual(
      expect.arrayContaining(['change.synthetic-active', 'ui.synthetic-panel', 'boundary.synthetic-config']),
    )
    expect(selected.nodeIds).not.toContain('change.synthetic-reference')
    expect(html).toContain('DevViewGraph')
    expect(html).toContain('function selectNode')
    expect(html).toContain('function selectWorkflowStep')
    expect(html).toContain('Current Work Flow')
    expect(html).toContain('Synthetic active change')
    expect(html).toContain('Instruction Sources')
    expect(data.packMapping.map((mapping: { displayLabel: string }) => mapping.displayLabel)).toEqual(
      expect.arrayContaining(['Current task', 'Forbidden scope', 'Verification']),
    )
    expect(data.safetyFlags.graphSourceMutated).toBe(false)
    expect(data.safetyFlags.graphDeltaApplied).toBe(false)
    expect(data.safetyFlags.codexExecutionTriggered).toBe(false)
    expect(data.safetyFlags.runtimeEvidenceSatisfied).toBe(false)
    expect(data.safetyFlags.scopeEnforced).toBe(false)
    expect(data.safetyFlags.ciEnforcementEnabled).toBe(false)
  })

  it('blocks HTML output that would overwrite the graph-source before writing data output', async () => {
    const workspace = createWorkspace()
    writeSyntheticGraphFixture(workspace)
    const before = readFileSync(join(workspace, graphSourcePath), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'render-devview-graph',
        '--graph-source',
        graphSourcePath,
        '--record',
        'change.synthetic-active',
        '--instruction-pack',
        instructionPackPath,
        '--output',
        graphSourcePath,
        '--data-output',
        '.tmp/should-not-exist.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source retrofit graph-source')
    expect(readFileSync(join(workspace, graphSourcePath), 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/should-not-exist.json'))).toBe(false)
  })

  it('blocks data output that would overwrite the instruction pack before writing HTML output', async () => {
    const workspace = createWorkspace()
    writeSyntheticGraphFixture(workspace)
    const before = readFileSync(join(workspace, instructionPackPath), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'render-devview-graph',
        '--graph-source',
        graphSourcePath,
        '--record',
        'change.synthetic-active',
        '--instruction-pack',
        instructionPackPath,
        '--output',
        '.tmp/should-not-exist.html',
        '--data-output',
        instructionPackPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source retrofit instruction pack')
    expect(readFileSync(join(workspace, instructionPackPath), 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/should-not-exist.html'))).toBe(false)
  })

  it('blocks identical HTML and data output paths', async () => {
    const workspace = createWorkspace()
    writeSyntheticGraphFixture(workspace)

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'render-devview-graph',
        '--graph-source',
        graphSourcePath,
        '--record',
        'change.synthetic-active',
        '--instruction-pack',
        instructionPackPath,
        '--output',
        '.tmp/same-path',
        '--data-output',
        '.tmp/same-path',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('--output and --data-output resolve to the same path')
    expect(existsSync(join(workspace, '.tmp/same-path'))).toBe(false)
  })

  it('renders Project Memory preview context without granting authority', async () => {
    const workspace = createWorkspace()
    writeSyntheticGraphFixture(workspace)
    const htmlOutput = join('.tmp', 'synthetic-memory.devviewgraph.html')
    const dataOutput = join('.tmp', 'synthetic-memory.devviewgraph.data.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'render-devview-graph',
        '--graph-source',
        graphSourcePath,
        '--record',
        'change.synthetic-active',
        '--instruction-pack',
        instructionPackPath,
        '--project-memory',
        projectMemoryPath,
        '--output',
        htmlOutput,
        '--data-output',
        dataOutput,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const data = JSON.parse(readFileSync(join(workspace, dataOutput), 'utf8'))
    const html = readFileSync(join(workspace, htmlOutput), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(data.projectMemorySummary.sourceProjectMemory).toBe(projectMemoryPath)
    expect(data.projectMemorySummary.projectName).toBe('Synthetic Project')
    expect(data.projectMemorySummary.taxonomyProfileId).toBe('synthetic-taxonomy-v0')
    expect(data.projectMemorySummary.detailedSliceLabel).toBe('Synthetic view slice')
    expect(html).toContain('Project Memory')
    expect(html).toContain('synthetic-taxonomy-v0')
    expect(data.safetyFlags.graphSourceMutated).toBe(false)
    expect(data.safetyFlags.scopeEnforced).toBe(false)
  })

  it('blocks output that would overwrite Project Memory preview with zero writes', async () => {
    const workspace = createWorkspace()
    writeSyntheticGraphFixture(workspace)
    const before = readFileSync(join(workspace, projectMemoryPath), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'render-devview-graph',
        '--graph-source',
        graphSourcePath,
        '--record',
        'change.synthetic-active',
        '--instruction-pack',
        instructionPackPath,
        '--project-memory',
        projectMemoryPath,
        '--output',
        projectMemoryPath,
        '--data-output',
        '.tmp/should-not-exist.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source DevView Project Memory preview')
    expect(readFileSync(join(workspace, projectMemoryPath), 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/should-not-exist.json'))).toBe(false)
  })
})

function writeSyntheticGraphFixture(workspace: string): void {
  writeJson(join(workspace, graphSourcePath), {
    schemaVersion: 1,
    artifactRole: 'retrofit-graph-source-v0',
    status: 'active-retrofit-graph-source',
    target: {
      projectName: 'Synthetic Project',
      repoPath: 'synthetic-repo',
      sourcePath: 'src/synthetic',
    },
    records: [
      {
        id: 'change.synthetic-reference',
        path: 'fixtures/graph/records/reference.json',
        expectedStatus: 'implemented-then-retained-reference',
        expectedActiveCodeState: 'retained-reference-only',
      },
      {
        id: 'change.synthetic-active',
        path: 'fixtures/graph/records/active.json',
        expectedStatus: 'implemented-build-pass-ui-review-pass',
        expectedActiveCodeState: 'active',
      },
    ],
    nodes: [
      {
        id: 'product.synthetic',
        kind: 'product-intent',
        state: 'observed',
        intentClaim: 'Synthetic Project demonstrates graph visualization.',
      },
      {
        id: 'module.synthetic-view',
        kind: 'module',
        state: 'observed',
        intentClaim: 'Synthetic view module owns the displayed panel.',
      },
      {
        id: 'ui.synthetic-panel',
        kind: 'ui-layout-surface',
        state: 'user-confirmed-ui-pass',
        intentClaim: 'The synthetic panel keeps fields aligned.',
      },
      {
        id: 'boundary.synthetic-config',
        kind: 'forbidden-flow-boundary',
        state: 'user-confirmed',
        intentClaim: 'Configuration rewrites are outside selected scope.',
      },
      {
        id: 'change.synthetic-reference',
        kind: 'retrofit-change-record',
        state: 'implemented-then-retained-reference',
        recordPath: 'fixtures/graph/records/reference.json',
        intentClaim: 'Synthetic retained reference change.',
      },
      {
        id: 'change.synthetic-active',
        kind: 'retrofit-change-record',
        state: 'implemented-build-pass-ui-review-pass',
        recordPath: 'fixtures/graph/records/active.json',
        intentClaim: 'Synthetic active change.',
      },
    ],
    edges: [
      {
        id: 'edge.product-scopes-module',
        from: 'product.synthetic',
        to: 'module.synthetic-view',
        kind: 'domain-scope',
        edgeIntent: {
          classifications: ['domain-scope'],
          claim: 'The product owns the synthetic view module.',
          confidence: 'observed-high',
        },
      },
      {
        id: 'edge.module-owns-panel',
        from: 'module.synthetic-view',
        to: 'ui.synthetic-panel',
        kind: 'ui-surface-ownership',
        edgeIntent: {
          classifications: ['ui-layout'],
          claim: 'The module owns the panel layout.',
          confidence: 'observed-high',
        },
      },
      {
        id: 'edge.panel-drives-active',
        from: 'ui.synthetic-panel',
        to: 'change.synthetic-active',
        kind: 'change-driver',
        edgeIntent: {
          classifications: ['change-driver', 'layout-only'],
          claim: 'The panel drives the current task.',
          confidence: 'user-confirmed-ui-pass',
        },
      },
      {
        id: 'edge.active-guards-config',
        from: 'change.synthetic-active',
        to: 'boundary.synthetic-config',
        kind: 'forbidden-flow-guard',
        edgeIntent: {
          classifications: ['non-goal', 'safety-boundary'],
          claim: 'The current task must not rewrite configuration.',
          confidence: 'user-confirmed-ui-pass',
        },
      },
    ],
  })

  writeJson(join(workspace, instructionPackPath), {
    schemaVersion: 1,
    artifactRole: 'retrofit-instruction-pack-v0',
    status: 'generated-from-graph-source',
    graphSourcePath,
    sourceRecordId: 'change.synthetic-active',
    sourceRecordPath: 'fixtures/graph/records/active.json',
    target: {
      projectName: 'Synthetic Project',
      repoPath: 'synthetic-repo',
      slice: 'Synthetic panel layout',
      writeBoundary: 'layout-only change; configuration rewrites forbidden',
    },
    allowedScope: {
      files: ['src/synthetic-view.ts'],
    },
    forbiddenScope: {
      flows: [{ flow: 'configuration rewrite', reason: 'The request is layout-only.' }],
      nonGoals: ['No configuration rewrites.'],
    },
    graphContext: {
      nodes: [
        { id: 'ui.synthetic-panel', kind: 'ui-layout-surface' },
        { id: 'boundary.synthetic-config', kind: 'forbidden-flow-boundary' },
        { id: 'change.synthetic-active', kind: 'retrofit-change-record' },
      ],
      edgeIntents: [
        {
          id: 'edge.panel-drives-active',
          from: 'ui.synthetic-panel',
          to: 'change.synthetic-active',
        },
        {
          id: 'edge.active-guards-config',
          from: 'change.synthetic-active',
          to: 'boundary.synthetic-config',
        },
      ],
    },
    verification: {
      required: {
        build: 'pass',
        runtime: 'user-confirmed-ui-pass',
        hardware: 'not-applicable',
      },
    },
  })

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
    portfolioModel: {
      wholeProject: {
        role: 'portfolio-overview',
        label: 'Synthetic portfolio',
      },
      focusedSlice: {
        role: 'detailed-slice',
        label: 'Synthetic view slice',
      },
    },
    taxonomyProfileRef: {
      taxonomyProfileId: 'synthetic-taxonomy-v0',
      authorityStatus: 'preview-only',
    },
    viewTreeProfileRef: {
      viewTreeProfileId: 'synthetic-view-tree-v0',
      authorityStatus: 'preview-only',
    },
  })
}
