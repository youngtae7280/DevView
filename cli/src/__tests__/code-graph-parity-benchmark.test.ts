import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('benchmark compare-code-graph-parity CLI', () => {
  it('reports DevView imported code subgraph parity against raw Graphify graph.json counts', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'graphify-out', 'graph.json'), realGraphifyExport(workspace))

    const importResult = await runDevViewCli(
      [
        'graph',
        'import-graphify-code-subgraph',
        '--graphify',
        join('graphify-out', 'graph.json'),
        '--output',
        '.tmp/code-subgraph.json',
        '--validation-output',
        '.tmp/code-subgraph-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    expect(importResult.exitCode).toBe(ExitCode.Success)

    const result = await runDevViewCli(
      [
        'benchmark',
        'compare-code-graph-parity',
        '--code-subgraph',
        '.tmp/code-subgraph.json',
        '--graphify',
        join('graphify-out', 'graph.json'),
        '--output',
        '.tmp/code-graph-parity.json',
        '--markdown',
        '.tmp/code-graph-parity.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-code-graph-parity-benchmark-report')
    expect(payload.status).toBe('devview-code-graph-parity-benchmark-passed')
    expect(payload.rawGraphifySummary.nodeCount).toBe(7)
    expect(payload.rawGraphifySummary.edgeCount).toBe(10)
    expect(payload.rawGraphifySummary.missingEndpointNodeCount).toBe(1)
    expect(payload.devviewSummary.nodeCount).toBe(8)
    expect(payload.devviewSummary.edgeCount).toBe(10)
    expect(payload.devviewSummary.sourceGraphifyNodeBackedCount).toBe(7)
    expect(payload.devviewSummary.syntheticGraphifyNodeCount).toBe(1)
    expect(payload.devviewSummary.sourceGraphifyEdgeBackedCount).toBe(10)
    expect(payload.devviewSummary.callsEdgeCount).toBe(2)
    expect(payload.parity.mode).toBe('graphify-import')
    expect(payload.parity.achieved).toBe(true)
    expect(payload.parity.graphifyBackedNodeRatio).toBe(1)
    expect(payload.parity.graphifyBackedEdgeRatio).toBe(1)
    expect(payload.parity.callLikeRatio).toBe(1)
    expect(payload.parity.nodeGap).toBe(1)
    expect(payload.parity.graphifyBackedNodeGap).toBe(0)
    expect(
      payload.parity.relationParity.find((entry: { relation: string }) => entry.relation === 'indirect_call'),
    ).toMatchObject({
      graphifyCount: 1,
      mappedDevviewEdgeKind: 'calls',
      devviewSourceGraphifyEdgeKindCount: 1,
    })
    expect(parityFinding(payload)).toMatchObject({
      severity: 'satisfied',
      message:
        'DevView code subgraph Graphify-backed preservation is achieved for nodes, edges, and call-like relations at parity thresholds.',
    })
    expect(payload.benchmarkExecuted).toBe(false)
    expect(payload.graphifyExecuted).toBe(false)
    expect(payload.astExtractorExecuted).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(existsSync(join(workspace, '.tmp/code-graph-parity.md'))).toBe(true)
  })

  it('reports native aggregate parity when the code subgraph has no Graphify-backed source facts', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'graphify-out', 'graph.json'), realGraphifyExport(workspace))
    writeJson(join(workspace, '.tmp/native-code-subgraph.json'), nativeCodeSubgraph())

    const result = await runDevViewCli(
      [
        'benchmark',
        'compare-code-graph-parity',
        '--code-subgraph',
        '.tmp/native-code-subgraph.json',
        '--graphify',
        join('graphify-out', 'graph.json'),
        '--output',
        '.tmp/native-code-graph-parity.json',
        '--markdown',
        '.tmp/native-code-graph-parity.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.parity.mode).toBe('native')
    expect(payload.devviewSummary.sourceGraphifyNodeBackedCount).toBe(0)
    expect(payload.devviewSummary.sourceGraphifyEdgeBackedCount).toBe(0)
    expect(payload.devviewSummary.nodeCount).toBe(7)
    expect(payload.devviewSummary.edgeCount).toBe(10)
    expect(payload.devviewSummary.callsEdgeCount).toBe(2)
    expect(payload.parity.achieved).toBe(true)
    expect(payload.parity.nodeRatio).toBe(1)
    expect(payload.parity.edgeRatio).toBe(1)
    expect(payload.parity.callLikeRatio).toBe(1)
    expect(payload.parity.graphifyBackedNodeRatio).toBe(0)
    expect(payload.parity.graphifyBackedEdgeRatio).toBe(0)
    expect(payload.parity.unsupportedGraphifyRelations).toEqual([])
    expect(parityFinding(payload)).toMatchObject({
      severity: 'satisfied',
      message:
        'Native DevView code subgraph reaches Graphify aggregate parity thresholds for nodes, edges, and call-like relations.',
    })
    expect(payload.downstreamActionPlan).toContain(
      'Use this report as evidence that the native DevView code subgraph reaches Graphify aggregate node, edge, and call-like parity thresholds without Graphify-backed source facts.',
    )
    expect(existsSync(join(workspace, '.tmp/native-code-graph-parity.md'))).toBe(true)
  })

  it('warns when native aggregate parity is below threshold', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'graphify-out', 'graph.json'), realGraphifyExport(workspace))
    writeJson(
      join(workspace, '.tmp/native-code-subgraph-below-threshold.json'),
      nativeCodeSubgraph({ belowThreshold: true }),
    )

    const result = await runDevViewCli(
      [
        'benchmark',
        'compare-code-graph-parity',
        '--code-subgraph',
        '.tmp/native-code-subgraph-below-threshold.json',
        '--graphify',
        join('graphify-out', 'graph.json'),
        '--output',
        '.tmp/native-code-graph-parity-below-threshold.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.parity.mode).toBe('native')
    expect(payload.parity.achieved).toBe(false)
    expect(payload.parity.nodeRatio).toBeLessThan(0.99)
    expect(payload.parity.edgeRatio).toBeLessThan(0.99)
    expect(payload.parity.callLikeRatio).toBe(1)
    expect(parityFinding(payload)).toMatchObject({
      severity: 'warning',
      code: 'CODE_GRAPH_PARITY_GAPS_REMAIN',
      message:
        'Native DevView code subgraph remains below Graphify aggregate parity thresholds or has unsupported Graphify relations.',
    })
  })
})

function parityFinding(payload: {
  findings: Array<{ code: string; severity: string; message: string }>
}): { code: string; severity: string; message: string } | undefined {
  return payload.findings.find(
    (entry) => entry.code === 'CODE_GRAPH_PARITY_ACHIEVED' || entry.code === 'CODE_GRAPH_PARITY_GAPS_REMAIN',
  )
}

function nativeCodeSubgraph(options: { belowThreshold?: boolean } = {}): Record<string, unknown> {
  const nodes = [
    nativeNode('code.file.app', 'file', 1),
    nativeNode('code.fn.main', 'function', 10),
    nativeNode('code.fn.helper', 'function', 14),
    nativeNode('code.class.service', 'class', 20),
    nativeNode('code.method.run', 'method', 22),
    nativeNode('code.interface.port', 'interface', 5),
    nativeNode('code.type.base', 'type', 3),
  ]
  const edges = [
    nativeEdge('code.edge.contains.main', 'code.file.app', 'code.fn.main', 'contains', 10),
    nativeEdge('code.edge.imports-from.helper', 'code.file.app', 'code.fn.helper', 'imports_from', 1),
    nativeEdge('code.edge.imports.helper', 'code.file.app', 'code.fn.helper', 'imports', 2),
    nativeEdge('code.edge.re-exports.helper', 'code.file.app', 'code.fn.helper', 're_exports', 3),
    nativeEdge('code.edge.calls.helper', 'code.fn.main', 'code.fn.helper', 'calls', 11),
    nativeEdge('code.edge.references.service', 'code.fn.main', 'code.class.service', 'references', 12),
    nativeEdge('code.edge.inherits.base', 'code.class.service', 'code.type.base', 'inherits', 20),
    nativeEdge('code.edge.implements.port', 'code.class.service', 'code.interface.port', 'implements', 20),
    nativeEdge('code.edge.method.run', 'code.class.service', 'code.method.run', 'method', 22),
    nativeEdge('code.edge.calls.run', 'code.fn.main', 'code.method.run', 'calls', 13),
  ]

  return {
    schemaVersion: 1,
    artifactRole: 'devview-code-subgraph',
    status: 'devview-code-subgraph-supplied',
    scope: 'code-subgraph-source-fact-only',
    nodes: options.belowThreshold ? nodes.filter((entry) => entry.id !== 'code.interface.port') : nodes,
    edges: options.belowThreshold ? edges.filter((entry) => entry.id !== 'code.edge.implements.port') : edges,
    graphifyExecuted: false,
    astExtractorExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
  }
}

function nativeNode(id: string, kind: string, line: number): Record<string, unknown> {
  return {
    id,
    kind,
    label: id.replace(/^code\./, ''),
    sourceFile: 'src/app.ts',
    sourceLocation: lineLocation(line),
    confidence: 'extracted',
    extractor: 'devview-native',
  }
}

function nativeEdge(id: string, from: string, to: string, kind: string, line: number): Record<string, unknown> {
  return {
    id,
    from,
    to,
    kind,
    sourceFile: 'src/app.ts',
    sourceLocation: lineLocation(line),
    confidence: 'extracted',
    extractor: 'devview-native',
  }
}

function lineLocation(line: number): Record<string, unknown> {
  return {
    startLine: line,
    startColumn: 1,
    endLine: line,
    endColumn: 1,
  }
}

function realGraphifyExport(workspace: string): Record<string, unknown> {
  const sourceFile = join(workspace, 'src', 'app.ts')
  return {
    nodes: [
      realGraphifyNode('g.file.app', 'app.ts', sourceFile, 'L1'),
      realGraphifyNode('g.fn.main', 'main()', sourceFile, 'L10'),
      realGraphifyNode('g.fn.helper', 'helper()', sourceFile, 'L14'),
      realGraphifyNode('g.class.service', 'Service', sourceFile, 'L20'),
      realGraphifyNode('g.method.run', '.run()', sourceFile, 'L22'),
      realGraphifyNode('g.interface.port', 'Port', sourceFile, 'L5'),
      realGraphifyNode('g.type.base', 'BaseType', sourceFile, 'L3'),
    ],
    edges: [
      realGraphifyEdge('g.file.app', 'g.fn.main', 'contains', sourceFile, 'L10'),
      realGraphifyEdge('g.file.app', 'ref_vitest', 'imports_from', sourceFile, 'L1'),
      realGraphifyEdge('g.file.app', 'g.fn.helper', 'imports', sourceFile, 'L2'),
      realGraphifyEdge('g.file.app', 'g.fn.helper', 're_exports', sourceFile, 'L3'),
      realGraphifyEdge('g.fn.main', 'g.fn.helper', 'calls', sourceFile, 'L11'),
      realGraphifyEdge('g.fn.main', 'g.class.service', 'references', sourceFile, 'L12'),
      realGraphifyEdge('g.class.service', 'g.type.base', 'inherits', sourceFile, 'L20'),
      realGraphifyEdge('g.class.service', 'g.interface.port', 'implements', sourceFile, 'L20'),
      realGraphifyEdge('g.class.service', 'g.method.run', 'method', sourceFile, 'L22'),
      realGraphifyEdge('g.fn.main', 'g.method.run', 'indirect_call', sourceFile, 'L13'),
    ],
  }
}

function realGraphifyNode(
  id: string,
  label: string,
  sourceFile: string,
  sourceLocation: string,
): Record<string, unknown> {
  return {
    id,
    label,
    file_type: 'code',
    source_file: sourceFile,
    source_location: sourceLocation,
    _origin: 'ast',
  }
}

function realGraphifyEdge(
  source: string,
  target: string,
  relation: string,
  sourceFile: string,
  sourceLocation: string,
): Record<string, unknown> {
  return {
    source,
    target,
    relation,
    context: 'fixture',
    confidence: 'EXTRACTED',
    source_file: sourceFile,
    source_location: sourceLocation,
    weight: 1,
  }
}
