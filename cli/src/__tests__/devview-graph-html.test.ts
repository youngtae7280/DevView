import { cpSync, existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('DevViewGraph HTML inspector CLI', () => {
  it('renders CardPrinterConfig retrofit graph data and static HTML inspector', async () => {
    const workspace = createWorkspace()
    writeCardPrinterConfigFixture(workspace)
    const htmlOutput = join('.tmp', 'cardprinterconfig.devviewgraph.html')
    const dataOutput = join('.tmp', 'cardprinterconfig.devviewgraph.data.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'render-devview-graph',
        '--graph-source',
        'examples/internal-legacy/retrofit/cardprinterconfig/graph-source.json',
        '--record',
        'change.laminator-tag-layout',
        '--instruction-pack',
        'outputs/retrofit/instruction-packs/laminator-tag-layout.instruction-pack.json',
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
    expect(data.requestSummary.sourceRecordId).toBe('change.laminator-tag-layout')
    expect(data.requestSummary.selectedTreeIds).toEqual(
      expect.arrayContaining(['tree.domain-source', 'tree.selected-pack-context']),
    )
    expect(data.workHistory.map((entry: { recordId: string }) => entry.recordId)).toEqual([
      'change.smart51-test-setting',
      'change.laminator-tag-layout',
    ])
    expect(data.workHistory[1].isCurrentRequest).toBe(true)
    expect(data.graph.layoutMode).toBe('deterministic-network-orbit')
    expect(data.graph.nodes.length).toBeGreaterThan(0)
    expect(data.graph.edges.length).toBeGreaterThan(0)
    expect(new Set(data.graph.nodes.map((node: { x: number }) => node.x)).size).toBeGreaterThan(6)
    expect(data.trees.map((tree: { id: string }) => tree.id)).toEqual(
      expect.arrayContaining([
        'tree.domain-source',
        'tree.retrofit-change',
        'tree.risk-boundary',
        'tree.selected-pack-context',
      ]),
    )
    expect(data.packMapping.length).toBeGreaterThan(0)
    expect(data.compilationTrace.length).toBeGreaterThan(0)
    expect(data.workflowSteps.map((step: { id: string }) => step.id)).toEqual([
      'workflow.request-ir',
      'workflow.domain-tree',
      'workflow.change-tree',
      'workflow.risk-tree',
      'workflow.selected-subgraph',
      'workflow.instruction-pack',
    ])
    expect(data.workflowSteps[0].nodeIds).toContain('change.laminator-tag-layout')
    expect(data.workflowSteps[4].nodeIds).toEqual(
      expect.arrayContaining([
        'change.laminator-tag-layout',
        'ui.laminator-tag-param-columns',
        'boundary.laminator-layout-only',
      ]),
    )
    expect(data.workflowSteps[5].packMappingIds.length).toBeGreaterThan(0)
    expect(selected.nodeIds).toEqual(
      expect.arrayContaining([
        'change.laminator-tag-layout',
        'ui.laminator-tag-param-columns',
        'boundary.laminator-layout-only',
      ]),
    )
    expect(data.graph.nodes.map((node: { id: string }) => node.id)).toContain('change.smart51-test-setting')
    expect(selected.nodeIds).not.toContain('change.smart51-test-setting')
    expect(html).toContain('DevViewGraph')
    expect(html).toContain('function selectNode')
    expect(html).toContain('function selectEdge')
    expect(html).toContain('function selectTree')
    expect(html).toContain('function selectSubgraph')
    expect(html).toContain('function selectWorkflowStep')
    expect(html).toContain('function selectProjectMemory')
    expect(html).toContain('function selectInstructionSources')
    expect(html).toContain('function zoomGraph')
    expect(html).toContain('function beginPan')
    expect(html).toContain('function edgePath')
    expect(html).toContain('function projectNode')
    expect(html).toContain('function selectHistoryEntry')
    expect(html).toContain('id="history-prev"')
    expect(html).toContain('id="history-index"')
    expect(html).toContain('id="history-next"')
    expect(html).toContain('id="workflow-step-list"')
    expect(html).toContain('edge-hit')
    expect(html).toContain('Current Work Flow')
    expect(html).toContain('workflow-step')
    expect(html).toContain('Current Request')
    expect(html).toContain('Needed Viewpoints')
    expect(html).toContain('Inspect')
    expect(html).toContain('Selected Node')
    expect(html).toContain('Selected Edge')
    expect(html).toContain('deterministic-network-orbit')
    expect(html).toContain('Instruction Sources')
    expect(html).not.toContain('<h2>All Trees</h2>')
    expect(html).not.toContain('<h2>SubGraphs</h2>')
    expect(html).not.toContain('Pack Mapping')
    expect(html).toContain('SMART-51')
    expect(html).toContain('laminator-tag-layout')
    expect(data.graph.viewport.width).toBeGreaterThanOrEqual(920)
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
    writeCardPrinterConfigFixture(workspace)
    const graphSourcePath = join(workspace, 'examples/internal-legacy/retrofit/cardprinterconfig/graph-source.json')
    const before = readFileSync(graphSourcePath, 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'render-devview-graph',
        '--graph-source',
        'examples/internal-legacy/retrofit/cardprinterconfig/graph-source.json',
        '--record',
        'change.laminator-tag-layout',
        '--instruction-pack',
        'outputs/retrofit/instruction-packs/laminator-tag-layout.instruction-pack.json',
        '--output',
        'examples/internal-legacy/retrofit/cardprinterconfig/graph-source.json',
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
    expect(readFileSync(graphSourcePath, 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/should-not-exist.json'))).toBe(false)
  })

  it('blocks data output that would overwrite the instruction pack before writing HTML output', async () => {
    const workspace = createWorkspace()
    writeCardPrinterConfigFixture(workspace)
    const instructionPackPath = join(
      workspace,
      'outputs/retrofit/instruction-packs/laminator-tag-layout.instruction-pack.json',
    )
    const before = readFileSync(instructionPackPath, 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'render-devview-graph',
        '--graph-source',
        'examples/internal-legacy/retrofit/cardprinterconfig/graph-source.json',
        '--record',
        'change.laminator-tag-layout',
        '--instruction-pack',
        'outputs/retrofit/instruction-packs/laminator-tag-layout.instruction-pack.json',
        '--output',
        '.tmp/should-not-exist.html',
        '--data-output',
        'outputs/retrofit/instruction-packs/laminator-tag-layout.instruction-pack.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source retrofit instruction pack')
    expect(readFileSync(instructionPackPath, 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/should-not-exist.html'))).toBe(false)
  })

  it('blocks identical HTML and data output paths', async () => {
    const workspace = createWorkspace()
    writeCardPrinterConfigFixture(workspace)

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'render-devview-graph',
        '--graph-source',
        'examples/internal-legacy/retrofit/cardprinterconfig/graph-source.json',
        '--record',
        'change.laminator-tag-layout',
        '--instruction-pack',
        'outputs/retrofit/instruction-packs/laminator-tag-layout.instruction-pack.json',
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

  it('renders WindowsUtility Project Memory as read-only inspector context', async () => {
    const workspace = createWorkspace()
    copyWindowsUtilityDemoFixture(workspace)
    const htmlOutput = join('.tmp', 'windowsutility.devviewgraph.html')
    const dataOutput = join('.tmp', 'windowsutility.devviewgraph.data.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'render-devview-graph',
        '--graph-source',
        'examples/internal-legacy/retrofit/windowsutility/graph-source.json',
        '--record',
        'change.laminator-tag-layout',
        '--instruction-pack',
        'outputs/retrofit/instruction-packs/windowsutility-laminator-tag-layout.instruction-pack.json',
        '--project-memory',
        'examples/internal-legacy/retrofit/windowsutility/devview-project-memory.preview.json',
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

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(data.sourceProjectMemory).toBe(
      'examples/internal-legacy/retrofit/windowsutility/devview-project-memory.preview.json',
    )
    expect(data.projectMemorySummary.devviewMode).toBe('retrofit')
    expect(data.projectMemorySummary.currentDirection).toBe('legacy-preserving-retrofit')
    expect(data.projectMemorySummary.taxonomyProfileId).toBe('legacy-retrofit-windowsutility-v0')
    expect(data.projectMemorySummary.taxonomyAuthorityStatus).toBe('preview-only-not-approved')
    expect(data.workflowSteps.length).toBe(6)
    expect(data.workflowSteps[1].treeIds).toContain('tree.domain-source')
    expect(data.workflowSteps[3].treeIds).toContain('tree.risk-boundary')
    expect(data.workflowSteps[5].output).toContain('instruction source entries')
    expect(html).toContain('Project Memory')
    expect(html).toContain('Current Work Flow')
    expect(html).toContain('1 Request')
    expect(html).toContain('6 Pack')
    expect(html).toContain('legacy-preserving-retrofit')
    expect(html).toContain('data-kind="project-memory"')
    expect(html).toContain('data-kind="instruction-sources"')
    expect(html).toContain('Needed Viewpoints')
    expect(html).toContain('Inspect')
    expect(html).toContain('CardPrinterConfig')
    expect(html).toContain('legacy-retrofit-windowsutility-v0')
    expect(html).toContain('preview-only-not-approved')
    expect(data.safetyFlags.graphSourceMutated).toBe(false)
    expect(data.safetyFlags.graphDeltaApplied).toBe(false)
    expect(data.safetyFlags.runtimeEvidenceSatisfied).toBe(false)
    expect(data.safetyFlags.scopeEnforced).toBe(false)
    expect(data.safetyFlags.ciEnforcementEnabled).toBe(false)
  })

  it('blocks DevViewGraph output that would overwrite Project Memory before writing partial HTML', async () => {
    const workspace = createWorkspace()
    copyWindowsUtilityDemoFixture(workspace)
    const projectMemoryPath = join(
      workspace,
      'examples/internal-legacy/retrofit/windowsutility/devview-project-memory.preview.json',
    )
    const before = readFileSync(projectMemoryPath, 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'render-devview-graph',
        '--graph-source',
        'examples/internal-legacy/retrofit/windowsutility/graph-source.json',
        '--record',
        'change.laminator-tag-layout',
        '--instruction-pack',
        'outputs/retrofit/instruction-packs/windowsutility-laminator-tag-layout.instruction-pack.json',
        '--project-memory',
        'examples/internal-legacy/retrofit/windowsutility/devview-project-memory.preview.json',
        '--output',
        '.tmp/should-not-exist.html',
        '--data-output',
        'examples/internal-legacy/retrofit/windowsutility/devview-project-memory.preview.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source DevView Project Memory preview')
    expect(readFileSync(projectMemoryPath, 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/should-not-exist.html'))).toBe(false)
  })
})

function writeCardPrinterConfigFixture(workspace: string): void {
  writeJson(join(workspace, 'examples/internal-legacy/retrofit/cardprinterconfig/graph-source.json'), {
    schemaVersion: 1,
    artifactRole: 'retrofit-graph-source-v0',
    status: 'active-retrofit-graph-source',
    target: {
      projectName: 'CardPrinterConfig',
      repoPath: 'Utility_Windows',
      sourcePath: 'src/CardPrinterConfig',
    },
    records: [
      {
        id: 'change.smart51-test-setting',
        path: 'examples/internal-legacy/retrofit/cardprinterconfig/records/smart51-test-setting.validated-then-reverted.json',
        expectedStatus: 'validated-then-reverted',
        expectedActiveCodeState: 'reverted',
      },
      {
        id: 'change.laminator-tag-layout',
        path: 'examples/internal-legacy/retrofit/cardprinterconfig/records/laminator-tag-layout.active.json',
        expectedStatus: 'implemented-build-pass-ui-review-pass',
        expectedActiveCodeState: 'active',
      },
    ],
    nodes: [
      {
        id: 'product.cardprinterconfig',
        kind: 'product-intent',
        state: 'inferred-from-code',
        intentClaim: 'CardPrinterConfig configures SMART printer devices.',
      },
      {
        id: 'module.smart51-printer',
        kind: 'module',
        state: 'observed',
        intentClaim: 'SMART-51 printer-body configuration owns the GetConfig test display path.',
      },
      {
        id: 'module.smart51-laminator',
        kind: 'module',
        state: 'observed',
        intentClaim: 'SMART-51 Laminator owns one Tag tab layout.',
      },
      {
        id: 'module.smart52-laminator',
        kind: 'module',
        state: 'observed-from-record',
        intentClaim: 'SMART-52 Laminator owns the matching Tag tab layout.',
      },
      {
        id: 'flow.smart51-getconfig-index-000',
        kind: 'execution-flow',
        state: 'user-confirmed-and-hardware-validated',
        intentClaim: 'Read SMART-51 Factory index 000 during real GetConfig.',
      },
      {
        id: 'ui.laminator-tag-param-columns',
        kind: 'ui-layout-surface',
        state: 'user-confirmed-ui-pass',
        intentClaim:
          'Tag Param and Active Param edit controls align their left edges in SMART-51/52 Laminator Tag tabs.',
      },
      {
        id: 'boundary.smart51-test-read-only',
        kind: 'forbidden-flow-boundary',
        state: 'user-confirmed',
        intentClaim: 'The SMART-51 test display must not participate in Set, save/load, report, or export behavior.',
      },
      {
        id: 'boundary.laminator-layout-only',
        kind: 'forbidden-flow-boundary',
        state: 'user-confirmed',
        intentClaim: 'The Laminator Tag tab change is layout-only and must not modify logic or device I/O.',
      },
      {
        id: 'change.smart51-test-setting',
        kind: 'retrofit-change-record',
        state: 'validated-then-reverted',
        recordPath:
          'examples/internal-legacy/retrofit/cardprinterconfig/records/smart51-test-setting.validated-then-reverted.json',
        intentClaim: 'A hardware-validated SMART-51 test display was implemented, confirmed, then reverted.',
      },
      {
        id: 'change.laminator-tag-layout',
        kind: 'retrofit-change-record',
        state: 'implemented-build-pass-ui-review-pass',
        recordPath: 'examples/internal-legacy/retrofit/cardprinterconfig/records/laminator-tag-layout.active.json',
        intentClaim: 'A resource-only Laminator Tag tab alignment fix remains active.',
      },
    ],
    edges: [
      {
        id: 'edge.product-scopes-smart51-printer',
        from: 'product.cardprinterconfig',
        to: 'module.smart51-printer',
        kind: 'domain-scope',
        edgeIntent: { classifications: ['domain-scope'], claim: 'SMART-51 is in scope.', confidence: 'observed-high' },
      },
      {
        id: 'edge.smart51-printer-owns-getconfig-index-000',
        from: 'module.smart51-printer',
        to: 'flow.smart51-getconfig-index-000',
        kind: 'execution-ownership',
        edgeIntent: { classifications: ['execution-flow'], claim: 'GetConfig owns the read.', confidence: 'high' },
      },
      {
        id: 'edge.getconfig-drives-smart51-test-record',
        from: 'flow.smart51-getconfig-index-000',
        to: 'change.smart51-test-setting',
        kind: 'change-driver',
        edgeIntent: {
          classifications: ['change-driver'],
          claim: 'The test display was driven by GetConfig.',
          confidence: 'user-confirmed',
        },
      },
      {
        id: 'edge.smart51-test-guards-forbidden-flows',
        from: 'change.smart51-test-setting',
        to: 'boundary.smart51-test-read-only',
        kind: 'forbidden-flow-guard',
        edgeIntent: {
          classifications: ['non-goal'],
          claim: 'Do not resurrect reverted test flows.',
          confidence: 'user-confirmed',
        },
      },
      {
        id: 'edge.product-scopes-smart51-laminator',
        from: 'product.cardprinterconfig',
        to: 'module.smart51-laminator',
        kind: 'domain-scope',
        edgeIntent: {
          classifications: ['domain-scope'],
          claim: 'SMART-51 Laminator is in scope.',
          confidence: 'observed-high',
        },
      },
      {
        id: 'edge.product-scopes-smart52-laminator',
        from: 'product.cardprinterconfig',
        to: 'module.smart52-laminator',
        kind: 'domain-scope',
        edgeIntent: {
          classifications: ['domain-scope'],
          claim: 'SMART-52 Laminator is in scope.',
          confidence: 'observed-high',
        },
      },
      {
        id: 'edge.smart51-laminator-uses-tag-layout',
        from: 'module.smart51-laminator',
        to: 'ui.laminator-tag-param-columns',
        kind: 'ui-surface-ownership',
        edgeIntent: {
          classifications: ['ui-layout'],
          claim: 'SMART-51 uses the Tag Param columns.',
          confidence: 'observed-high',
        },
      },
      {
        id: 'edge.smart52-laminator-uses-tag-layout',
        from: 'module.smart52-laminator',
        to: 'ui.laminator-tag-param-columns',
        kind: 'ui-surface-ownership',
        edgeIntent: {
          classifications: ['ui-layout'],
          claim: 'SMART-52 uses the Tag Param columns.',
          confidence: 'observed-high',
        },
      },
      {
        id: 'edge.tag-layout-drives-laminator-record',
        from: 'ui.laminator-tag-param-columns',
        to: 'change.laminator-tag-layout',
        kind: 'change-driver',
        edgeIntent: {
          classifications: ['change-driver', 'layout-only'],
          claim: 'The change is driven by visual alignment.',
          confidence: 'user-confirmed-ui-pass',
        },
      },
      {
        id: 'edge.laminator-record-guards-logic',
        from: 'change.laminator-tag-layout',
        to: 'boundary.laminator-layout-only',
        kind: 'forbidden-flow-guard',
        edgeIntent: {
          classifications: ['non-goal', 'safety-boundary'],
          claim: 'Keep the slice resource-layout-only.',
          confidence: 'user-confirmed-ui-pass',
        },
      },
    ],
  })

  writeJson(join(workspace, 'outputs/retrofit/instruction-packs/laminator-tag-layout.instruction-pack.json'), {
    schemaVersion: 1,
    artifactRole: 'retrofit-instruction-pack-v0',
    status: 'generated-from-graph-source',
    graphSourcePath: 'examples/internal-legacy/retrofit/cardprinterconfig/graph-source.json',
    sourceRecordId: 'change.laminator-tag-layout',
    sourceRecordPath: 'examples/internal-legacy/retrofit/cardprinterconfig/records/laminator-tag-layout.active.json',
    target: {
      projectName: 'CardPrinterConfig',
      repoPath: 'Utility_Windows',
      slice: 'SMART-51 and SMART-52 Laminator Tag tab layout',
      writeBoundary: 'layout-only resource coordinate change; logic changes forbidden',
    },
    allowedScope: {
      files: ['src/CardPrinterConfig/CardPrinterConfig.rc'],
    },
    forbiddenScope: {
      flows: [
        { flow: 'SubDlg51LAMINATOR.cpp / SubDlg52LAMINATOR.cpp logic', reason: 'Logic changes are forbidden.' },
        { flow: 'GetConfig / SetConfig / SaveConfig / LoadConfig', reason: 'The request is visual alignment only.' },
      ],
      nonGoals: ['No C++ logic changes.', 'No hardware communication changes.'],
    },
    graphContext: {
      nodes: [
        { id: 'ui.laminator-tag-param-columns', kind: 'ui-layout-surface' },
        { id: 'boundary.laminator-layout-only', kind: 'forbidden-flow-boundary' },
        { id: 'change.laminator-tag-layout', kind: 'retrofit-change-record' },
      ],
      edgeIntents: [
        {
          id: 'edge.tag-layout-drives-laminator-record',
          from: 'ui.laminator-tag-param-columns',
          to: 'change.laminator-tag-layout',
        },
        {
          id: 'edge.laminator-record-guards-logic',
          from: 'change.laminator-tag-layout',
          to: 'boundary.laminator-layout-only',
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
}

function copyWindowsUtilityDemoFixture(workspace: string): void {
  cpSync(
    join(pluginRoot, 'examples/internal-legacy/retrofit/windowsutility'),
    join(workspace, 'examples/internal-legacy/retrofit/windowsutility'),
    {
      recursive: true,
    },
  )
  cpSync(
    join(pluginRoot, 'outputs/retrofit/instruction-packs'),
    join(workspace, 'outputs/retrofit/instruction-packs'),
    { recursive: true },
  )
}
