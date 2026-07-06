import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import type { IssueSeverity } from './types.js'

const RENDERER_NAME = 'DevViewGraphHtmlRenderer'
const EXPECTED_GRAPH_SOURCE_ROLE = 'retrofit-graph-source-v0'
const EXPECTED_INSTRUCTION_PACK_ROLE = 'retrofit-instruction-pack-v0'

type JsonRecord = Record<string, unknown>

export interface DevViewGraphHtmlFinding {
  code: string
  severity: IssueSeverity
  field?: string
  path?: string
  message: string
  expected?: unknown
  actual?: unknown
  suggestedFix?: string
}

export interface DevViewGraphNode {
  id: string
  label: string
  kind: string
  state: string
  intentClaim: string
  recordPath: string
  codeLocations: string[]
  packRole: string
  packSections: string[]
  roles: string[]
  selected: boolean
  contextOnly: boolean
  riskBoundary: boolean
  treeIds: string[]
  subgraphIds: string[]
  x: number
  y: number
}

export interface DevViewGraphEdge {
  id: string
  from: string
  to: string
  kind: string
  classifications: string[]
  claim: string
  confidence: string
  selected: boolean
  contextOnly: boolean
  riskBoundary: boolean
  packSections: string[]
  treeIds: string[]
  subgraphIds: string[]
}

export interface DevViewGraphTree {
  id: string
  label: string
  viewpoint: string
  nodeIds: string[]
  edgeIds: string[]
  packSections: string[]
}

export interface DevViewGraphSubgraph {
  id: string
  label: string
  taskType: string
  startNodeId: string
  nodeIds: string[]
  edgeIds: string[]
  requiredTreeIds: string[]
  packPath: string
  recordPath: string
  allowedFiles: string[]
  forbiddenFlows: string[]
  verificationRequired: JsonRecord
  packMappingIds: string[]
}

export interface DevViewGraphPackMapping {
  id: string
  elementKind: 'node' | 'edge' | 'file' | 'flow' | 'verification'
  elementId: string
  packSection: string
  role: string
  reason: string
}

export interface DevViewGraphCompilationTraceEntry {
  step: string
  input: string
  output: string
  status: string
  authority: string
}

export interface DevViewGraphData {
  schemaVersion: 1
  artifactRole: 'devview-graph-html-data-preview'
  status: 'devview-graph-html-data-generated'
  rendererName: typeof RENDERER_NAME
  renderScope: 'retrofit-graph-source-to-readonly-html-inspector'
  sourceGraphSource: string
  sourceInstructionPack: string
  sourceRecordId: string
  graph: {
    nodes: DevViewGraphNode[]
    edges: DevViewGraphEdge[]
  }
  trees: DevViewGraphTree[]
  subgraphs: DevViewGraphSubgraph[]
  packMapping: DevViewGraphPackMapping[]
  compilationTrace: DevViewGraphCompilationTraceEntry[]
  safetyFlags: {
    readOnlyVisualizationOnly: true
    graphSourceMutated: false
    graphDeltaApplied: false
    codexExecutionTriggered: false
    runtimeEvidenceSatisfied: false
    scopeEnforced: false
    ciEnforcementEnabled: false
    approvalStatus: 'not-approved'
    humanDecisionRecorded: false
    equivalenceProven: false
  }
  artifacts: {
    htmlOutputPath: string
    dataOutputPath: string
    graphSourcePath: string
    instructionPackPath: string
    sourceRecordPath: string
  }
  validationFindings: DevViewGraphHtmlFinding[]
  nonExecutionBoundary: string
}

export interface DevViewGraphHtmlFileResult {
  data: DevViewGraphData
  outputPath: string
  dataOutputPath: string
}

interface GraphInput {
  graphSource: JsonRecord
  instructionPack: JsonRecord
  graphSourcePath: string
  instructionPackPath: string
  recordId: string
  outputPath: string
  dataOutputPath: string
}

interface LayoutNode extends DevViewGraphNode {
  treeIds: string[]
  subgraphIds: string[]
}

export async function renderDevViewGraphHtmlFile(
  root: string,
  options: {
    graphSource: string
    record: string
    instructionPack: string
    output: string
    dataOutput: string
  },
): Promise<DevViewGraphHtmlFileResult> {
  const graphSourcePath = resolveRepoPath(root, options.graphSource)
  const instructionPackPath = resolveRepoPath(root, options.instructionPack)
  const outputPath = resolveRepoPath(root, options.output)
  const dataOutputPath = resolveRepoPath(root, options.dataOutput)

  const graphSource = await readJsonSafe<JsonRecord>(graphSourcePath)
  if (!graphSource.ok) {
    throw new Error(`Unable to read DevViewGraph graph source from ${options.graphSource}: ${graphSource.error}`)
  }
  const instructionPack = await readJsonSafe<JsonRecord>(instructionPackPath)
  if (!instructionPack.ok) {
    throw new Error(
      `Unable to read DevViewGraph instruction pack from ${options.instructionPack}: ${instructionPack.error}`,
    )
  }

  await assertDevViewGraphOutputAuthority(root, {
    graphSource: graphSource.value,
    instructionPack: instructionPack.value,
    graphSourcePath,
    instructionPackPath,
    recordId: options.record,
    outputPath,
    dataOutputPath,
  })

  const data = buildDevViewGraphData(root, {
    graphSource: graphSource.value,
    instructionPack: instructionPack.value,
    graphSourcePath,
    instructionPackPath,
    recordId: options.record,
    outputPath,
    dataOutputPath,
  })
  const errorFindings = data.validationFindings.filter((finding) => finding.severity === 'error')
  if (errorFindings.length > 0) {
    throw new Error(`DevViewGraph HTML rendering blocked: ${errorFindings.map((finding) => finding.message).join(' ')}`)
  }

  const html = renderDevViewGraphHtml(data)
  await writeTextAtomic(outputPath, html)
  await writeJsonAtomic(dataOutputPath, data)

  return {
    data,
    outputPath: relativePath(root, outputPath),
    dataOutputPath: relativePath(root, dataOutputPath),
  }
}

function buildDevViewGraphData(root: string, input: GraphInput): DevViewGraphData {
  const findings = validateInputs(root, input)
  const selectedNodeIds = collectSelectedNodeIds(input.instructionPack, input.recordId)
  const selectedEdgeIds = collectSelectedEdgeIds(input.instructionPack)
  const allowedFiles = collectAllowedFiles(input.instructionPack)
  const forbiddenFlows = collectForbiddenFlows(input.instructionPack)
  const verificationRequired = asRecord(asRecord(input.instructionPack.verification)?.required) ?? {}
  const graphNodes = arrayRecords(input.graphSource.nodes)
  const graphEdges = arrayRecords(input.graphSource.edges)
  const recordById = new Map(arrayRecords(input.graphSource.records).map((record) => [stringValue(record.id), record]))
  const graphNodeById = new Map(graphNodes.map((node) => [stringValue(node.id), node]))
  const selectedSubgraphId = `subgraph.${input.recordId}`

  const nodes = graphNodes.map((node, index) =>
    buildNode(
      node,
      index,
      selectedNodeIds,
      selectedSubgraphId,
      allowedFiles,
      forbiddenFlows,
      input.recordId,
      recordById,
    ),
  )
  const contextOnlyNodeIds = new Set(nodes.filter((node) => node.contextOnly).map((node) => node.id))
  const edges = graphEdges.map((edge) =>
    buildEdge(edge, selectedEdgeIds, selectedSubgraphId, contextOnlyNodeIds, graphNodeById),
  )
  const trees = buildTrees(nodes, edges)
  applyTreeMembership(nodes, edges, trees)

  const subgraphs: DevViewGraphSubgraph[] = [
    {
      id: selectedSubgraphId,
      label: `Instruction Pack Context: ${input.recordId}`,
      taskType: 'retrofit-layout-only-instruction-pack-preview',
      startNodeId: input.recordId,
      nodeIds: [...selectedNodeIds].filter((id) => graphNodeById.has(id)),
      edgeIds: [...selectedEdgeIds].filter((id) => edges.some((edge) => edge.id === id)),
      requiredTreeIds: [
        'tree.domain-source',
        'tree.retrofit-change',
        'tree.risk-boundary',
        'tree.selected-pack-context',
      ],
      packPath: relativePath(root, input.instructionPackPath),
      recordPath: collectSourceRecordPath(input.instructionPack, input.graphSource, input.recordId),
      allowedFiles,
      forbiddenFlows,
      verificationRequired,
      packMappingIds: [],
    },
  ]

  const packMapping = buildPackMapping(input.instructionPack, selectedNodeIds, selectedEdgeIds)
  subgraphs[0].packMappingIds = packMapping.map((entry) => entry.id)

  return {
    schemaVersion: 1,
    artifactRole: 'devview-graph-html-data-preview',
    status: 'devview-graph-html-data-generated',
    rendererName: RENDERER_NAME,
    renderScope: 'retrofit-graph-source-to-readonly-html-inspector',
    sourceGraphSource: relativePath(root, input.graphSourcePath),
    sourceInstructionPack: relativePath(root, input.instructionPackPath),
    sourceRecordId: input.recordId,
    graph: { nodes, edges },
    trees,
    subgraphs,
    packMapping,
    compilationTrace: buildCompilationTrace(root, input),
    safetyFlags: {
      readOnlyVisualizationOnly: true,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      codexExecutionTriggered: false,
      runtimeEvidenceSatisfied: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
      approvalStatus: 'not-approved',
      humanDecisionRecorded: false,
      equivalenceProven: false,
    },
    artifacts: {
      htmlOutputPath: relativePath(root, input.outputPath),
      dataOutputPath: relativePath(root, input.dataOutputPath),
      graphSourcePath: relativePath(root, input.graphSourcePath),
      instructionPackPath: relativePath(root, input.instructionPackPath),
      sourceRecordPath: collectSourceRecordPath(input.instructionPack, input.graphSource, input.recordId),
    },
    validationFindings: findings,
    nonExecutionBoundary:
      'DevViewGraph renders a read-only HTML/data inspector from graph-source and instruction-pack artifacts. It does not trigger Codex execution, mutate graph-source, apply graph deltas, approve work, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
  }
}

function validateInputs(root: string, input: GraphInput): DevViewGraphHtmlFinding[] {
  const findings: DevViewGraphHtmlFinding[] = []
  addExpectedFinding(findings, input.graphSource.artifactRole, EXPECTED_GRAPH_SOURCE_ROLE, 'graphSource.artifactRole')
  addExpectedFinding(
    findings,
    input.instructionPack.artifactRole,
    EXPECTED_INSTRUCTION_PACK_ROLE,
    'instructionPack.artifactRole',
  )
  if (input.graphSource.status !== 'active-retrofit-graph-source') {
    findings.push({
      code: 'DEVVIEW_GRAPH_SOURCE_STATUS_UNSUPPORTED',
      severity: 'error',
      field: 'graphSource.status',
      message: 'DevViewGraph v1 requires an active retrofit graph-source.',
      expected: 'active-retrofit-graph-source',
      actual: input.graphSource.status,
    })
  }
  if (input.instructionPack.status !== 'generated-from-graph-source') {
    findings.push({
      code: 'DEVVIEW_GRAPH_INSTRUCTION_PACK_STATUS_UNSUPPORTED',
      severity: 'error',
      field: 'instructionPack.status',
      message: 'DevViewGraph v1 requires a retrofit instruction pack generated from graph-source.',
      expected: 'generated-from-graph-source',
      actual: input.instructionPack.status,
    })
  }
  if (stringValue(input.instructionPack.sourceRecordId) !== input.recordId) {
    findings.push({
      code: 'DEVVIEW_GRAPH_RECORD_MISMATCH',
      severity: 'error',
      field: 'instructionPack.sourceRecordId',
      message: 'DevViewGraph record argument must match the instruction pack sourceRecordId.',
      expected: input.recordId,
      actual: input.instructionPack.sourceRecordId,
    })
  }
  if (!arrayRecords(input.graphSource.nodes).some((node) => stringValue(node.id) === input.recordId)) {
    findings.push({
      code: 'DEVVIEW_GRAPH_RECORD_NODE_MISSING',
      severity: 'error',
      field: 'graphSource.nodes',
      message: `Graph source does not contain the requested record node ${input.recordId}.`,
    })
  }
  const graphSourceReference = stringValue(input.instructionPack.graphSourcePath)
  if (graphSourceReference && pathKey(resolveRepoPath(root, graphSourceReference)) !== pathKey(input.graphSourcePath)) {
    findings.push({
      code: 'DEVVIEW_GRAPH_PACK_GRAPH_SOURCE_PROVENANCE_MISMATCH',
      severity: 'error',
      field: 'instructionPack.graphSourcePath',
      message: 'Instruction pack graphSourcePath does not match the provided graph-source input.',
      expected: relativePath(root, input.graphSourcePath),
      actual: graphSourceReference,
    })
  }
  return findings
}

function buildNode(
  node: JsonRecord,
  index: number,
  selectedNodeIds: Set<string>,
  selectedSubgraphId: string,
  allowedFiles: string[],
  forbiddenFlows: string[],
  recordId: string,
  recordById: Map<string, JsonRecord>,
): LayoutNode {
  const id = stringValue(node.id) || `node.${index}`
  const kind = stringValue(node.kind) || 'unknown'
  const state = stringValue(node.state)
  const recordPath = stringValue(node.recordPath) || stringValue(recordById.get(id)?.path)
  const selected = selectedNodeIds.has(id)
  const riskBoundary = kind === 'forbidden-flow-boundary' || id.startsWith('boundary.')
  const contextOnly =
    state.includes('reverted') || stringValue(recordById.get(id)?.expectedActiveCodeState) === 'reverted'
  const codeLocations = selected ? [...allowedFiles] : []
  if (recordPath) {
    codeLocations.push(recordPath)
  }
  if (riskBoundary) {
    codeLocations.push(...forbiddenFlows)
  }
  const position = layoutPosition(kind, id, index)
  return {
    id,
    label: shortLabel(id),
    kind,
    state,
    intentClaim: stringValue(node.intentClaim),
    recordPath,
    codeLocations: uniqueStrings(codeLocations),
    packRole: selected
      ? id === recordId
        ? 'source-record'
        : riskBoundary
          ? 'forbidden-boundary'
          : 'selected-context'
      : '',
    packSections: inferNodePackSections(id, selected, riskBoundary, recordId),
    roles: inferNodeRoles(id, kind, selected, contextOnly, riskBoundary, recordId),
    selected,
    contextOnly,
    riskBoundary,
    treeIds: [],
    subgraphIds: selected ? [selectedSubgraphId] : [],
    x: position.x,
    y: position.y,
  }
}

function buildEdge(
  edge: JsonRecord,
  selectedEdgeIds: Set<string>,
  selectedSubgraphId: string,
  contextOnlyNodeIds: Set<string>,
  graphNodeById: Map<string, JsonRecord>,
): DevViewGraphEdge {
  const id = stringValue(edge.id)
  const from = stringValue(edge.from)
  const to = stringValue(edge.to)
  const kind = stringValue(edge.kind) || 'unknown'
  const edgeIntent = asRecord(edge.edgeIntent)
  const selected = selectedEdgeIds.has(id)
  const riskBoundary = kind === 'forbidden-flow-guard'
  const contextOnly = !selected && (contextOnlyNodeIds.has(from) || contextOnlyNodeIds.has(to))
  const fromNodeKind = stringValue(graphNodeById.get(from)?.kind)
  const toNodeKind = stringValue(graphNodeById.get(to)?.kind)
  return {
    id,
    from,
    to,
    kind,
    classifications: stringArray(edgeIntent?.classifications),
    claim: stringValue(edgeIntent?.claim),
    confidence: stringValue(edgeIntent?.confidence),
    selected,
    contextOnly,
    riskBoundary,
    packSections: selected ? ['graphContext.edgeIntents'] : riskBoundary ? ['forbiddenScope'] : [],
    treeIds: [],
    subgraphIds: selected ? [selectedSubgraphId] : [],
    ...(fromNodeKind || toNodeKind ? {} : {}),
  }
}

function buildTrees(nodes: DevViewGraphNode[], edges: DevViewGraphEdge[]): DevViewGraphTree[] {
  const nodeKind = new Map(nodes.map((node) => [node.id, node.kind]))
  const domainNodeIds = nodes
    .filter((node) => ['product-intent', 'module', 'execution-flow', 'ui-layout-surface'].includes(node.kind))
    .map((node) => node.id)
  const domainEdgeIds = edges
    .filter((edge) => ['domain-scope', 'execution-ownership', 'ui-surface-ownership'].includes(edge.kind))
    .map((edge) => edge.id)
  const changeNodeIds = nodes.filter((node) => node.kind === 'retrofit-change-record').map((node) => node.id)
  const changeEdgeIds = edges
    .filter(
      (edge) => edge.kind === 'change-driver' || changeNodeIds.includes(edge.from) || changeNodeIds.includes(edge.to),
    )
    .map((edge) => edge.id)
  const riskNodeIds = nodes.filter((node) => node.kind === 'forbidden-flow-boundary').map((node) => node.id)
  const riskEdgeIds = edges.filter((edge) => edge.kind === 'forbidden-flow-guard').map((edge) => edge.id)
  const selectedEdgeIds = edges.filter((edge) => edge.selected).map((edge) => edge.id)
  const selectedNodeIds = uniqueStrings([
    ...nodes.filter((node) => node.selected).map((node) => node.id),
    ...edges
      .filter((edge) => edge.selected)
      .flatMap((edge) => [edge.from, edge.to])
      .filter((id) => nodeKind.has(id)),
  ])

  return [
    {
      id: 'tree.domain-source',
      label: 'Domain Source Tree',
      viewpoint: 'Product, module, UI surface, and execution-flow structure that explains where the change lives.',
      nodeIds: domainNodeIds,
      edgeIds: domainEdgeIds,
      packSections: ['graphContext.nodes', 'allowedScope.files'],
    },
    {
      id: 'tree.retrofit-change',
      label: 'Retrofit Change Tree',
      viewpoint: 'Retrofit change records and the driver edges that connect observed intent to bounded work.',
      nodeIds: changeNodeIds,
      edgeIds: changeEdgeIds,
      packSections: ['sourceRecordId', 'graphContext.edgeIntents'],
    },
    {
      id: 'tree.risk-boundary',
      label: 'Risk Boundary Tree',
      viewpoint: 'Forbidden-flow boundary nodes and guard edges that explain what the instruction pack must not open.',
      nodeIds: riskNodeIds,
      edgeIds: riskEdgeIds,
      packSections: ['forbiddenScope.flows', 'forbiddenScope.nonGoals'],
    },
    {
      id: 'tree.selected-pack-context',
      label: 'Selected Pack Context Tree',
      viewpoint: 'The exact node and edge context carried into the Instruction Pack preview.',
      nodeIds: selectedNodeIds,
      edgeIds: selectedEdgeIds,
      packSections: ['graphContext.nodes', 'graphContext.edgeIntents'],
    },
  ]
}

function applyTreeMembership(nodes: DevViewGraphNode[], edges: DevViewGraphEdge[], trees: DevViewGraphTree[]): void {
  for (const tree of trees) {
    for (const node of nodes) {
      if (tree.nodeIds.includes(node.id)) {
        node.treeIds.push(tree.id)
      }
    }
    for (const edge of edges) {
      if (tree.edgeIds.includes(edge.id)) {
        edge.treeIds.push(tree.id)
      }
    }
  }
}

function buildPackMapping(
  instructionPack: JsonRecord,
  selectedNodeIds: Set<string>,
  selectedEdgeIds: Set<string>,
): DevViewGraphPackMapping[] {
  const mappings: DevViewGraphPackMapping[] = []
  const sourceRecordId = stringValue(instructionPack.sourceRecordId)
  if (sourceRecordId) {
    mappings.push({
      id: 'mapping.source-record',
      elementKind: 'node',
      elementId: sourceRecordId,
      packSection: 'sourceRecordId',
      role: 'target/current task',
      reason: 'The instruction pack sourceRecordId identifies the active retrofit task.',
    })
  }
  for (const nodeId of selectedNodeIds) {
    mappings.push({
      id: `mapping.node.${nodeId}`,
      elementKind: 'node',
      elementId: nodeId,
      packSection: 'graphContext.nodes',
      role: nodeId === sourceRecordId ? 'current task node' : 'selected graph context',
      reason: 'This node is explicitly carried in instructionPack.graphContext.nodes or sourceRecordId.',
    })
  }
  for (const edgeId of selectedEdgeIds) {
    mappings.push({
      id: `mapping.edge.${edgeId}`,
      elementKind: 'edge',
      elementId: edgeId,
      packSection: 'graphContext.edgeIntents',
      role: 'selected edge intent',
      reason: 'This edge intent is part of the selected subgraph used by the instruction pack.',
    })
  }
  for (const file of collectAllowedFiles(instructionPack)) {
    mappings.push({
      id: `mapping.file.${slug(file)}`,
      elementKind: 'file',
      elementId: file,
      packSection: 'allowedScope.files',
      role: 'code location',
      reason: 'Allowed scope restricts write consideration to this file path.',
    })
  }
  for (const flow of collectForbiddenFlows(instructionPack)) {
    mappings.push({
      id: `mapping.flow.${slug(flow)}`,
      elementKind: 'flow',
      elementId: flow,
      packSection: 'forbiddenScope.flows/nonGoals',
      role: 'forbidden panel',
      reason: 'Forbidden scope keeps this flow outside the task boundary.',
    })
  }
  const verificationRequired = asRecord(asRecord(instructionPack.verification)?.required) ?? {}
  for (const [key, value] of Object.entries(verificationRequired)) {
    mappings.push({
      id: `mapping.verification.${slug(key)}`,
      elementKind: 'verification',
      elementId: key,
      packSection: 'verification.required',
      role: 'evidence/verification panel',
      reason: `Verification requirement "${key}" is recorded as ${JSON.stringify(value)}.`,
    })
  }
  return uniqueMappings(mappings)
}

function buildCompilationTrace(root: string, input: GraphInput): DevViewGraphCompilationTraceEntry[] {
  return [
    {
      step: 'read graph-source',
      input: relativePath(root, input.graphSourcePath),
      output: 'graph.nodes / graph.edges',
      status: 'read-only',
      authority: 'retrofit-graph-source-v0 source context, not mutation authority',
    },
    {
      step: 'read instruction-pack',
      input: relativePath(root, input.instructionPackPath),
      output: 'packMapping / selected subgraph',
      status: 'read-only',
      authority: 'retrofit-instruction-pack-v0 preview, not Codex execution',
    },
    {
      step: 'derive view trees',
      input: 'graph node/edge kinds and instruction pack graphContext',
      output: 'tree.domain-source / tree.retrofit-change / tree.risk-boundary / tree.selected-pack-context',
      status: 'deterministic-preview',
      authority: 'visualization only',
    },
    {
      step: 'render static inspector',
      input: 'DevViewGraph data model',
      output: `${relativePath(root, input.outputPath)} + ${relativePath(root, input.dataOutputPath)}`,
      status: 'read-only-html-data-written',
      authority: 'report artifact only',
    },
  ]
}

function renderDevViewGraphHtml(data: DevViewGraphData): string {
  const embedded = JSON.stringify(data).replaceAll('</script', '<\\/script')
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DevViewGraph - ${escapeHtml(data.sourceRecordId)}</title>
  <style>
    :root {
      --graph-ink: #202124;
      --graph-muted: #6f747b;
      --graph-line: #d6d9de;
      --graph-paper: #f7f8fa;
      --graph-surface: #ffffff;
      --graph-selected: #1f6feb;
      --graph-risk: #b42318;
      --graph-warning: #b7791f;
      --graph-ok: #1f7a4d;
      --graph-focus: #0f172a;
      --graph-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--graph-ink);
      background: var(--graph-paper);
    }
    .shell {
      display: grid;
      grid-template-columns: 270px minmax(560px, 1fr) 350px;
      grid-template-rows: auto 1fr;
      min-height: 100vh;
    }
    header {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 18px;
      border-bottom: 1px solid var(--graph-line);
      background: var(--graph-surface);
    }
    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 650;
      letter-spacing: 0;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      color: var(--graph-muted);
      font-size: 12px;
    }
    .badge {
      border: 1px solid var(--graph-line);
      border-radius: 6px;
      padding: 4px 7px;
      background: #fbfbfc;
      white-space: nowrap;
    }
    aside, main {
      min-height: 0;
    }
    .rail {
      overflow: auto;
      border-right: 1px solid var(--graph-line);
      background: var(--graph-surface);
      padding: 14px;
    }
    .inspector {
      overflow: auto;
      border-left: 1px solid var(--graph-line);
      background: var(--graph-surface);
      padding: 14px;
    }
    .workspace {
      overflow: auto;
      padding: 16px;
    }
    .graph-frame {
      min-width: 780px;
      border: 1px solid var(--graph-line);
      border-radius: 8px;
      background: var(--graph-surface);
      box-shadow: var(--graph-shadow);
    }
    svg {
      display: block;
      width: 100%;
      height: 760px;
    }
    .section {
      margin-bottom: 18px;
    }
    .section h2 {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 700;
      color: var(--graph-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    button.item {
      width: 100%;
      min-height: 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin: 6px 0;
      padding: 8px 9px;
      color: var(--graph-ink);
      background: #fff;
      border: 1px solid var(--graph-line);
      border-radius: 6px;
      font: inherit;
      font-size: 13px;
      text-align: left;
      cursor: pointer;
    }
    button.item:hover, button.item.active {
      border-color: var(--graph-selected);
      color: var(--graph-selected);
      background: #f4f8ff;
    }
    button.item .count {
      color: var(--graph-muted);
      font-size: 11px;
    }
    .detail h2 {
      margin: 0 0 4px;
      font-size: 16px;
      letter-spacing: 0;
    }
    .detail .sub {
      color: var(--graph-muted);
      font-size: 12px;
      margin-bottom: 12px;
    }
    .kv {
      display: grid;
      grid-template-columns: 116px minmax(0, 1fr);
      gap: 8px 10px;
      font-size: 12px;
      border-top: 1px solid var(--graph-line);
      padding-top: 12px;
    }
    .kv div:nth-child(odd) {
      color: var(--graph-muted);
    }
    .list {
      margin: 0;
      padding-left: 17px;
    }
    .list li {
      margin: 3px 0;
      overflow-wrap: anywhere;
    }
    .node {
      cursor: pointer;
    }
    .node rect {
      fill: #ffffff;
      stroke: #c7cbd1;
      stroke-width: 1.2;
    }
    .node text {
      font-size: 12px;
      fill: var(--graph-ink);
      pointer-events: none;
    }
    .node.context rect {
      stroke: #d8a1a1;
      stroke-dasharray: 5 4;
      fill: #fff8f8;
    }
    .node.risk rect {
      stroke: var(--graph-risk);
      fill: #fff7f6;
    }
    .node.selected rect {
      stroke: var(--graph-selected);
      stroke-width: 2;
      fill: #f4f8ff;
    }
    .node.highlight rect {
      stroke: var(--graph-focus);
      stroke-width: 3;
    }
    .edge {
      cursor: pointer;
    }
    .edge path {
      fill: none;
      stroke: #b7bcc4;
      stroke-width: 1.6;
      marker-end: url(#arrow);
    }
    .edge.context path {
      stroke: #d28b8b;
      stroke-dasharray: 7 5;
    }
    .edge.risk path {
      stroke: var(--graph-risk);
      stroke-width: 2;
    }
    .edge.selected path {
      stroke: var(--graph-selected);
      stroke-width: 2.4;
    }
    .edge.highlight path {
      stroke: var(--graph-focus);
      stroke-width: 3.2;
    }
    .edge text {
      font-size: 11px;
      fill: var(--graph-muted);
      pointer-events: none;
    }
    .dim .node:not(.highlight):not(.selected) { opacity: 0.28; }
    .dim .edge:not(.highlight):not(.selected) { opacity: 0.18; }
    @media (max-width: 980px) {
      .shell {
        grid-template-columns: 1fr;
      }
      header, .rail, .workspace, .inspector {
        grid-column: 1;
      }
      .rail, .inspector {
        border: 0;
        border-bottom: 1px solid var(--graph-line);
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header>
      <h1>DevViewGraph - ${escapeHtml(data.sourceRecordId)}</h1>
      <div class="meta">
        <span class="badge">${escapeHtml(data.artifacts.graphSourcePath)}</span>
        <span class="badge">${escapeHtml(data.artifacts.instructionPackPath)}</span>
        <span class="badge">read-only</span>
      </div>
    </header>
    <aside class="rail">
      <div class="section">
        <h2>Trees</h2>
        <div id="tree-list"></div>
      </div>
      <div class="section">
        <h2>SubGraphs</h2>
        <div id="subgraph-list"></div>
      </div>
      <div class="section">
        <h2>Pack Mapping</h2>
        <div id="mapping-list"></div>
      </div>
    </aside>
    <main class="workspace">
      <div class="graph-frame">
        <svg id="graph-svg" viewBox="0 0 920 760" role="img" aria-label="DevViewGraph static graph inspector"></svg>
      </div>
    </main>
    <aside class="inspector">
      <div id="detail" class="detail"></div>
    </aside>
  </div>
  <script id="devview-data" type="application/json">${embedded}</script>
  <script>
    const data = JSON.parse(document.getElementById('devview-data').textContent);
    const svg = document.getElementById('graph-svg');
    const detail = document.getElementById('detail');
    const state = { selectedType: 'subgraph', selectedId: data.subgraphs[0]?.id || '' };
    const nodeById = new Map(data.graph.nodes.map((node) => [node.id, node]));
    const edgeById = new Map(data.graph.edges.map((edge) => [edge.id, edge]));

    function render() {
      renderLists();
      renderGraph();
      if (state.selectedType === 'node') selectNode(state.selectedId);
      else if (state.selectedType === 'edge') selectEdge(state.selectedId);
      else if (state.selectedType === 'tree') selectTree(state.selectedId);
      else selectSubgraph(state.selectedId || data.subgraphs[0]?.id);
    }

    function renderLists() {
      document.getElementById('tree-list').innerHTML = data.trees.map((tree) =>
        '<button class="item" data-kind="tree" data-id="' + esc(tree.id) + '"><span>' + esc(tree.label) + '</span><span class="count">' + tree.nodeIds.length + '/' + tree.edgeIds.length + '</span></button>'
      ).join('');
      document.getElementById('subgraph-list').innerHTML = data.subgraphs.map((subgraph) =>
        '<button class="item" data-kind="subgraph" data-id="' + esc(subgraph.id) + '"><span>' + esc(subgraph.label) + '</span><span class="count">' + subgraph.nodeIds.length + '/' + subgraph.edgeIds.length + '</span></button>'
      ).join('');
      document.getElementById('mapping-list').innerHTML = data.packMapping.map((mapping) =>
        '<button class="item" data-kind="mapping" data-id="' + esc(mapping.id) + '"><span>' + esc(mapping.packSection) + '</span><span class="count">' + esc(mapping.elementKind) + '</span></button>'
      ).join('');
      document.querySelectorAll('button.item').forEach((button) => {
        button.addEventListener('click', () => {
          const kind = button.getAttribute('data-kind');
          const id = button.getAttribute('data-id');
          if (kind === 'tree') selectTree(id);
          if (kind === 'subgraph') selectSubgraph(id);
          if (kind === 'mapping') selectMapping(id);
        });
      });
      updateActiveButtons();
    }

    function renderGraph() {
      svg.innerHTML = '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8b919b"></path></marker></defs>';
      const edgeLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const nodeLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      svg.appendChild(edgeLayer);
      svg.appendChild(nodeLayer);
      for (const edge of data.graph.edges) {
        const from = nodeById.get(edge.from);
        const to = nodeById.get(edge.to);
        if (!from || !to) continue;
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', edgeClass(edge));
        group.setAttribute('data-edge-id', edge.id);
        group.addEventListener('click', () => selectEdge(edge.id));
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const x1 = from.x + 68;
        const y1 = from.y + 18;
        const x2 = to.x - 8;
        const y2 = to.y + 18;
        const mid = Math.max(40, Math.abs(x2 - x1) / 2);
        path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + mid) + ' ' + y1 + ', ' + (x2 - mid) + ' ' + y2 + ', ' + x2 + ' ' + y2);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', String((x1 + x2) / 2 - 34));
        label.setAttribute('y', String((y1 + y2) / 2 - 5));
        label.textContent = edge.kind;
        group.appendChild(path);
        group.appendChild(label);
        edgeLayer.appendChild(group);
      }
      for (const node of data.graph.nodes) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', nodeClass(node));
        group.setAttribute('transform', 'translate(' + node.x + ' ' + node.y + ')');
        group.setAttribute('data-node-id', node.id);
        group.addEventListener('click', () => selectNode(node.id));
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '142');
        rect.setAttribute('height', '58');
        rect.setAttribute('rx', '6');
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', '10');
        label.setAttribute('y', '22');
        label.textContent = trimLabel(node.label, 22);
        const kind = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        kind.setAttribute('x', '10');
        kind.setAttribute('y', '42');
        kind.textContent = trimLabel(node.kind, 22);
        group.appendChild(rect);
        group.appendChild(label);
        group.appendChild(kind);
        nodeLayer.appendChild(group);
      }
      applyHighlight();
    }

    function selectNode(id) {
      state.selectedType = 'node';
      state.selectedId = id;
      const node = nodeById.get(id);
      if (!node) return;
      detail.innerHTML = '<h2>' + esc(node.id) + '</h2><div class="sub">Node</div>' + kv([
        ['kind', node.kind],
        ['state', node.state],
        ['pack role', node.packRole || 'none'],
        ['record path', node.recordPath || 'none'],
        ['code location', list(node.codeLocations)],
        ['intent claim', node.intentClaim],
        ['trees', list(node.treeIds)],
        ['subgraphs', list(node.subgraphIds)]
      ]);
      updateState();
    }

    function selectEdge(id) {
      state.selectedType = 'edge';
      state.selectedId = id;
      const edge = edgeById.get(id);
      if (!edge) return;
      detail.innerHTML = '<h2>' + esc(edge.id) + '</h2><div class="sub">Edge</div>' + kv([
        ['from', edge.from],
        ['to', edge.to],
        ['kind', edge.kind],
        ['classification', list(edge.classifications)],
        ['confidence', edge.confidence],
        ['claim', edge.claim],
        ['trees', list(edge.treeIds)],
        ['subgraphs', list(edge.subgraphIds)]
      ]);
      updateState();
    }

    function selectTree(id) {
      state.selectedType = 'tree';
      state.selectedId = id;
      const tree = data.trees.find((entry) => entry.id === id);
      if (!tree) return;
      detail.innerHTML = '<h2>' + esc(tree.label) + '</h2><div class="sub">Tree</div>' + kv([
        ['viewpoint', tree.viewpoint],
        ['nodes', list(tree.nodeIds)],
        ['edges', list(tree.edgeIds)],
        ['pack sections', list(tree.packSections)]
      ]);
      updateState();
    }

    function selectSubgraph(id) {
      state.selectedType = 'subgraph';
      state.selectedId = id;
      const subgraph = data.subgraphs.find((entry) => entry.id === id);
      if (!subgraph) return;
      detail.innerHTML = '<h2>' + esc(subgraph.label) + '</h2><div class="sub">SubGraph</div>' + kv([
        ['task type', subgraph.taskType],
        ['start node', subgraph.startNodeId],
        ['nodes', list(subgraph.nodeIds)],
        ['edges', list(subgraph.edgeIds)],
        ['required trees', list(subgraph.requiredTreeIds)],
        ['allowed files', list(subgraph.allowedFiles)],
        ['forbidden flows', list(subgraph.forbiddenFlows)],
        ['verification', JSON.stringify(subgraph.verificationRequired)]
      ]);
      updateState();
    }

    function selectMapping(id) {
      const mapping = data.packMapping.find((entry) => entry.id === id);
      if (!mapping) return;
      if (mapping.elementKind === 'node' && nodeById.has(mapping.elementId)) {
        selectNode(mapping.elementId);
      } else if (mapping.elementKind === 'edge' && edgeById.has(mapping.elementId)) {
        selectEdge(mapping.elementId);
      } else {
        state.selectedType = 'mapping';
        state.selectedId = id;
        detail.innerHTML = '<h2>' + esc(mapping.packSection) + '</h2><div class="sub">Pack Mapping</div>' + kv([
          ['element kind', mapping.elementKind],
          ['element id', mapping.elementId],
          ['role', mapping.role],
          ['reason', mapping.reason]
        ]);
        updateState();
      }
    }

    function updateState() {
      updateActiveButtons();
      applyHighlight();
    }

    function updateActiveButtons() {
      document.querySelectorAll('button.item').forEach((button) => {
        button.classList.toggle('active', button.getAttribute('data-id') === state.selectedId);
      });
    }

    function applyHighlight() {
      const highlight = getHighlight();
      svg.classList.toggle('dim', highlight.nodes.size > 0 || highlight.edges.size > 0);
      svg.querySelectorAll('[data-node-id]').forEach((nodeEl) => {
        nodeEl.classList.toggle('highlight', highlight.nodes.has(nodeEl.getAttribute('data-node-id')));
      });
      svg.querySelectorAll('[data-edge-id]').forEach((edgeEl) => {
        edgeEl.classList.toggle('highlight', highlight.edges.has(edgeEl.getAttribute('data-edge-id')));
      });
    }

    function getHighlight() {
      const nodes = new Set();
      const edges = new Set();
      if (state.selectedType === 'node') {
        nodes.add(state.selectedId);
        data.graph.edges.filter((edge) => edge.from === state.selectedId || edge.to === state.selectedId).forEach((edge) => {
          edges.add(edge.id);
          nodes.add(edge.from);
          nodes.add(edge.to);
        });
      }
      if (state.selectedType === 'edge') {
        const edge = edgeById.get(state.selectedId);
        if (edge) {
          edges.add(edge.id);
          nodes.add(edge.from);
          nodes.add(edge.to);
        }
      }
      if (state.selectedType === 'tree') {
        const tree = data.trees.find((entry) => entry.id === state.selectedId);
        if (tree) {
          tree.nodeIds.forEach((id) => nodes.add(id));
          tree.edgeIds.forEach((id) => edges.add(id));
        }
      }
      if (state.selectedType === 'subgraph') {
        const subgraph = data.subgraphs.find((entry) => entry.id === state.selectedId);
        if (subgraph) {
          subgraph.nodeIds.forEach((id) => nodes.add(id));
          subgraph.edgeIds.forEach((id) => edges.add(id));
        }
      }
      return { nodes, edges };
    }

    function nodeClass(node) {
      return ['node', node.selected ? 'selected' : '', node.contextOnly ? 'context' : '', node.riskBoundary ? 'risk' : ''].filter(Boolean).join(' ');
    }

    function edgeClass(edge) {
      return ['edge', edge.selected ? 'selected' : '', edge.contextOnly ? 'context' : '', edge.riskBoundary ? 'risk' : ''].filter(Boolean).join(' ');
    }

    function kv(rows) {
      return '<div class="kv">' + rows.map(([key, value]) => '<div>' + esc(key) + '</div><div>' + value + '</div>').join('') + '</div>';
    }

    function list(values) {
      if (!Array.isArray(values) || values.length === 0) return 'none';
      return '<ul class="list">' + values.map((value) => '<li>' + esc(String(value)) + '</li>').join('') + '</ul>';
    }

    function esc(value) {
      return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }

    function trimLabel(value, maxLength) {
      const text = String(value ?? '');
      return text.length > maxLength ? text.slice(0, maxLength - 1) + '...' : text;
    }

    render();
  </script>
</body>
</html>
`
}

async function assertDevViewGraphOutputAuthority(root: string, input: GraphInput): Promise<void> {
  if (pathKey(input.outputPath) === pathKey(input.dataOutputPath)) {
    throw new Error('DevViewGraph output is unsafe: --output and --data-output resolve to the same path.')
  }

  const protectedPaths = buildProtectedOutputPathMap(root, input)
  const requestedTargets = [
    { kind: 'html output', resolvedPath: input.outputPath },
    { kind: 'data output', resolvedPath: input.dataOutputPath },
  ]
  for (const target of requestedTargets) {
    const protectedReason = protectedPaths.get(pathKey(target.resolvedPath))
    if (protectedReason) {
      throw new Error(
        `DevViewGraph ${target.kind} path is unsafe: ${relativePath(root, target.resolvedPath)} would overwrite ${protectedReason}.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(target.resolvedPath)
    if (existingAuthority) {
      throw new Error(
        `DevViewGraph ${target.kind} path is unsafe: ${relativePath(root, target.resolvedPath)} already contains ${existingAuthority}. Choose a dedicated DevViewGraph output path.`,
      )
    }
  }
}

function buildProtectedOutputPathMap(root: string, input: GraphInput): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const addResolved = (filePath: string, reason: string): void => {
    const key = pathKey(filePath)
    if (!protectedPaths.has(key)) {
      protectedPaths.set(key, reason)
    }
  }
  const add = (candidate: unknown, reason: string): void => {
    const candidatePath = stringValue(candidate)
    if (!isConcreteOutputProtectedPath(candidatePath)) {
      return
    }
    addResolved(resolveRepoPath(root, candidatePath), reason)
  }

  addResolved(input.graphSourcePath, 'the source retrofit graph-source')
  addResolved(input.instructionPackPath, 'the source retrofit instruction pack')
  add(input.graphSource.sourceCandidate, 'the graph-source source candidate')
  add(input.instructionPack.graphSourcePath, 'instructionPack.graphSourcePath source authority')
  add(input.instructionPack.sourceRecordPath, 'instructionPack.sourceRecordPath source record')

  for (const record of arrayRecords(input.graphSource.records)) {
    add(record.path, `graph-source record ${stringValue(record.id) || stringValue(record.path)}`)
  }
  for (const candidatePath of collectConcretePathStrings(input.graphSource)) {
    add(candidatePath, `graph-source linked artifact ${candidatePath}`)
  }
  for (const candidatePath of collectConcretePathStrings(input.instructionPack)) {
    add(candidatePath, `instruction-pack linked artifact ${candidatePath}`)
  }
  return protectedPaths
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) {
    return null
  }
  const record = asRecord(parsed.value)
  if (!record) {
    return null
  }
  const artifactRole = stringValue(record.artifactRole)
  if (artifactRole === 'devview-graph-html-data-preview') {
    return null
  }
  if (artifactRole.includes('graph-source')) {
    return `graph-source artifactRole "${artifactRole}"`
  }
  if (artifactRole.includes('instruction-pack')) {
    return `instruction-pack artifactRole "${artifactRole}"`
  }
  if (artifactRole.includes('boundary') || artifactRole.includes('readiness') || artifactRole.includes('proposal')) {
    return `generated authority artifactRole "${artifactRole}"`
  }
  if (Array.isArray(record.nodes) && Array.isArray(record.edges)) {
    return 'graph-shaped source artifact'
  }
  if (Array.isArray(record.records) && Array.isArray(record.nodes) && Array.isArray(record.edges)) {
    return 'retrofit graph-source-shaped artifact'
  }
  return null
}

function collectSelectedNodeIds(instructionPack: JsonRecord, recordId: string): Set<string> {
  return new Set(
    uniqueStrings([
      recordId,
      stringValue(instructionPack.sourceRecordId),
      ...arrayRecords(asRecord(instructionPack.graphContext)?.nodes).map((node) => stringValue(node.id)),
    ]),
  )
}

function collectSelectedEdgeIds(instructionPack: JsonRecord): Set<string> {
  return new Set(
    uniqueStrings(
      arrayRecords(asRecord(instructionPack.graphContext)?.edgeIntents).map((edge) => stringValue(edge.id)),
    ),
  )
}

function collectAllowedFiles(instructionPack: JsonRecord): string[] {
  return uniqueStrings(stringArray(asRecord(instructionPack.allowedScope)?.files))
}

function collectForbiddenFlows(instructionPack: JsonRecord): string[] {
  const forbiddenScope = asRecord(instructionPack.forbiddenScope)
  return uniqueStrings([
    ...arrayRecords(forbiddenScope?.flows).map((entry) => stringValue(entry.flow)),
    ...stringArray(forbiddenScope?.nonGoals),
    ...stringArray(forbiddenScope?.excludedBehavior),
  ])
}

function collectSourceRecordPath(graphPack: JsonRecord, graphSource: JsonRecord, recordId: string): string {
  return (
    stringValue(graphPack.sourceRecordPath) ||
    stringValue(arrayRecords(graphSource.records).find((record) => stringValue(record.id) === recordId)?.path)
  )
}

function inferNodePackSections(id: string, selected: boolean, riskBoundary: boolean, recordId: string): string[] {
  const sections: string[] = []
  if (id === recordId) {
    sections.push('sourceRecordId', 'target')
  }
  if (selected) {
    sections.push('graphContext.nodes')
  }
  if (riskBoundary) {
    sections.push('forbiddenScope.flows', 'forbiddenScope.nonGoals')
  }
  return uniqueStrings(sections)
}

function inferNodeRoles(
  id: string,
  kind: string,
  selected: boolean,
  contextOnly: boolean,
  riskBoundary: boolean,
  recordId: string,
): string[] {
  const roles: string[] = [kind]
  if (id === recordId) {
    roles.push('target-record')
  }
  if (selected) {
    roles.push('selected-subgraph')
  }
  if (contextOnly) {
    roles.push('context-only-reverted')
  }
  if (riskBoundary) {
    roles.push('risk-boundary')
  }
  return uniqueStrings(roles)
}

function layoutPosition(kind: string, id: string, index: number): { x: number; y: number } {
  const columns: Record<string, number> = {
    'product-intent': 40,
    module: 200,
    'execution-flow': 360,
    'ui-layout-surface': 360,
    'retrofit-change-record': 540,
    'forbidden-flow-boundary': 720,
  }
  const column = columns[kind] ?? 360
  const rowHint = rowHintForNode(kind, id, index)
  return { x: column, y: 64 + rowHint * 112 }
}

function rowHintForNode(kind: string, id: string, index: number): number {
  if (kind === 'product-intent') {
    return 2
  }
  if (id.includes('smart51-printer') || id.includes('getconfig') || id.includes('test')) {
    return 0
  }
  if (id.includes('smart51-laminator')) {
    return 2
  }
  if (id.includes('smart52-laminator')) {
    return 4
  }
  if (id.includes('laminator')) {
    return 3
  }
  return index
}

function shortLabel(id: string): string {
  const parts = id.split('.')
  return parts.length > 1 ? parts.slice(1).join('.') : id
}

function addExpectedFinding(
  findings: DevViewGraphHtmlFinding[],
  actual: unknown,
  expected: unknown,
  field: string,
): void {
  if (actual !== expected) {
    findings.push({
      code: 'DEVVIEW_GRAPH_INPUT_ROLE_UNSUPPORTED',
      severity: 'error',
      field,
      message: `${field} is not supported by DevViewGraph v1.`,
      expected,
      actual,
    })
  }
}

function collectConcretePathStrings(value: unknown): string[] {
  const paths: string[] = []
  const visit = (entry: unknown): void => {
    if (typeof entry === 'string') {
      if (isConcreteOutputProtectedPath(entry)) {
        paths.push(entry)
      }
      return
    }
    if (Array.isArray(entry)) {
      for (const item of entry) {
        visit(item)
      }
      return
    }
    const record = asRecord(entry)
    if (!record) {
      return
    }
    for (const item of Object.values(record)) {
      visit(item)
    }
  }
  visit(value)
  return uniqueStrings(paths)
}

function isConcreteOutputProtectedPath(candidatePath: string): boolean {
  const normalized = candidatePath.replaceAll('\\', '/')
  return (
    Boolean(normalized) &&
    !normalized.startsWith('unresolved:') &&
    normalized !== '<in-memory>' &&
    !normalized.includes('<') &&
    !normalized.includes('\n') &&
    (normalized.includes('/') || normalized.startsWith('.')) &&
    /\.(json|md|txt|rc|cpp|h|hpp|cs|ts|tsx|js|jsx)$/i.test(normalized)
  )
}

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as JsonRecord
}

function arrayRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.flatMap((entry) => (asRecord(entry) ? [entry as JsonRecord] : [])) : []
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((entry) => entry.length > 0))]
}

function uniqueMappings(values: DevViewGraphPackMapping[]): DevViewGraphPackMapping[] {
  const seen = new Set<string>()
  return values.filter((entry) => {
    if (seen.has(entry.id)) {
      return false
    }
    seen.add(entry.id)
    return true
  })
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'item'
  )
}

function resolveRepoPath(root: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(root, inputPath)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const escaped: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return escaped[char] ?? char
  })
}
