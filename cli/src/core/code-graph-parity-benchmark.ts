import { createHash } from 'node:crypto'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'
import {
  CodeSubgraphValidationError,
  type CodeSubgraphValidationReport,
  validateCodeSubgraphRecord,
} from './code-subgraph-validation.js'

type JsonRecord = Record<string, unknown>
type CodeGraphParityMode = 'graphify-import' | 'native'

const REPORT_ROLE = 'devview-code-graph-parity-benchmark-report'
const PASSED_STATUS = 'devview-code-graph-parity-benchmark-passed'
const BLOCKED_STATUS = 'devview-code-graph-parity-benchmark-blocked'
const REPORT_SCOPE = 'code-graph-parity-static-report-only'

const graphifyRelationToDevviewEdgeKind: Record<string, string> = {
  contains: 'contains',
  imports: 'imports',
  imports_from: 'imports_from',
  re_exports: 're_exports',
  calls: 'calls',
  indirect_call: 'calls',
  indirect_calls: 'calls',
  references: 'references',
  inherits: 'inherits',
  implements: 'implements',
  method: 'method',
}

const unsafeAuthorityFields = [
  'providerInvoked',
  'networkCallMade',
  'apiCallMade',
  'shellCommandExecuted',
  'shellCommandsExecuted',
  'extensionExecutionAllowed',
  'extensionsExecuted',
  'extensionCodeExecuted',
  'graphifyExecuted',
  'graphifyLiveRun',
  'astExtractorExecuted',
  'nativeBenchmarkExecuted',
  'benchmarkExecuted',
  'candidateExecuted',
  'filesMutated',
  'graphSourceMutated',
  'graphDeltaApplied',
  'runtimeEvidenceSatisfied',
  'evidenceAccepted',
  'equivalenceProven',
  'scopeEnforced',
  'ciEnforcementEnabled',
  'hooksActivated',
  'enterpriseGateActivated',
]

const executableInstructionFields = [
  'command',
  'commands',
  'script',
  'scripts',
  'entrypoint',
  'executablePath',
  'execution',
  'providerEndpoint',
  'networkEndpoint',
  'networkUrl',
  'apiEndpoint',
  'url',
  'installCommand',
  'shellCommand',
  'shellCommands',
]

export interface CodeGraphParityBenchmarkOptions {
  codeSubgraph?: string
  graphifyExport?: string
  output?: string
  markdown?: string
}

export interface CodeGraphParityBenchmarkFinding {
  severity: 'blocker' | 'warning' | 'satisfied'
  code: string
  message: string
  field?: string
  path?: string
}

interface LoadedSource {
  requestedPath: string
  resolvedPath: string
  relativePath: string
  record: JsonRecord | null
  sha256: string | null
  byteLength: number | null
  readError: string | null
}

export interface CodeGraphParityBenchmarkReport extends JsonRecord {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof PASSED_STATUS | typeof BLOCKED_STATUS
  benchmarkScope: typeof REPORT_SCOPE
  sourceFactsOnly: true
  reportOnly: true
  inputs: {
    devviewCodeSubgraph: {
      path: string
      artifactRole: string | null
      status: string | null
      sha256: string | null
      byteLength: number | null
      validationStatus: string | null
    }
    graphifyExport: {
      path: string
      exportId: string | null
      sha256: string | null
      byteLength: number | null
    }
  }
  rawGraphifySummary: {
    nodeCount: number
    edgeCount: number
    edgeRelationCounts: Record<string, number>
    missingEndpointEdgeCount: number
    missingEndpointNodeCount: number
    callRelationCount: number
    callLikeRelationCount: number
  }
  devviewSummary: {
    nodeCount: number
    edgeCount: number
    codeNodeKindCounts: Record<string, number>
    codeEdgeTypeCounts: Record<string, number>
    sourceGraphifyNodeBackedCount: number
    syntheticGraphifyNodeCount: number
    sourceGraphifyEdgeBackedCount: number
    sourceGraphifyEdgeKindCounts: Record<string, number>
    callsEdgeCount: number
  }
  parity: {
    mode: CodeGraphParityMode
    achieved: boolean
    nodeRatio: number | null
    graphifyBackedNodeRatio: number | null
    edgeRatio: number | null
    graphifyBackedEdgeRatio: number | null
    callLikeRatio: number | null
    nodeGap: number
    graphifyBackedNodeGap: number
    edgeGap: number
    graphifyBackedEdgeGap: number
    callLikeGap: number
    relationParity: Array<{
      relation: string
      graphifyCount: number
      mappedDevviewEdgeKind: string | null
      devviewSourceGraphifyEdgeKindCount: number
      mappedDevviewEdgeKindCount: number
      ratio: number | null
      gap: number
    }>
    unsupportedGraphifyRelations: string[]
  }
  findings: CodeGraphParityBenchmarkFinding[]
  downstreamActionPlan: string[]
  benchmarkExecuted: false
  graphifyExecuted: false
  astExtractorExecuted: false
  providerInvoked: false
  networkCallMade: false
  apiCallMade: false
  shellCommandsExecuted: false
  graphSourceMutated: false
  graphDeltaApplied: false
  writtenOutputPath?: string
  writtenMarkdownPath?: string
}

export class CodeGraphParityBenchmarkError extends Error {
  readonly report: CodeGraphParityBenchmarkReport

  constructor(report: CodeGraphParityBenchmarkReport) {
    super('Code graph parity benchmark report is blocked.')
    this.report = report
  }
}

export async function compareCodeGraphParityFile(
  root: string,
  options: CodeGraphParityBenchmarkOptions,
): Promise<CodeGraphParityBenchmarkReport> {
  validateRequiredOptions(options)
  const codeSubgraphPath = resolveRepoPath(root, options.codeSubgraph ?? '')
  const graphifyPath = resolveRepoPath(root, options.graphifyExport ?? '')
  await assertOutputAuthority(root, [codeSubgraphPath, graphifyPath], options)

  const codeSubgraph = await loadSource(root, options.codeSubgraph ?? '')
  const graphify = await loadSource(root, options.graphifyExport ?? '')
  const report = buildReport(root, codeSubgraph, graphify, options)

  if (report.status === BLOCKED_STATUS) {
    throw new CodeGraphParityBenchmarkError(report)
  }

  const outputPath = resolveRepoPath(root, options.output ?? '')
  await writeJsonAtomic(outputPath, report)
  report.writtenOutputPath = relativePath(root, outputPath)
  if (options.markdown) {
    const markdownPath = resolveRepoPath(root, options.markdown)
    await writeTextAtomic(markdownPath, renderMarkdown(report))
    report.writtenMarkdownPath = relativePath(root, markdownPath)
    await writeJsonAtomic(outputPath, report)
  }
  return report
}

function buildReport(
  root: string,
  codeSubgraph: LoadedSource,
  graphify: LoadedSource,
  options: CodeGraphParityBenchmarkOptions,
): CodeGraphParityBenchmarkReport {
  const findings: CodeGraphParityBenchmarkFinding[] = []
  let codeValidation: CodeSubgraphValidationReport | null = null

  if (!codeSubgraph.record) {
    findings.push(
      blocker(
        'CODE_GRAPH_PARITY_CODE_SUBGRAPH_READ_FAILED',
        `Could not read DevView code subgraph: ${codeSubgraph.readError}`,
        undefined,
        codeSubgraph.relativePath,
      ),
    )
  }
  if (!graphify.record) {
    findings.push(
      blocker(
        'CODE_GRAPH_PARITY_GRAPHIFY_READ_FAILED',
        `Could not read Graphify export: ${graphify.readError}`,
        undefined,
        graphify.relativePath,
      ),
    )
  }

  for (const source of [codeSubgraph, graphify]) {
    if (!source.record) continue
    for (const hit of collectUnsafeAuthorityHits(source.record)) {
      findings.push(
        blocker(
          'CODE_GRAPH_PARITY_UNSAFE_AUTHORITY_FLAG',
          `${source.relativePath} contains unsafe report-only flag ${hit.field}: true.`,
          hit.field,
          source.relativePath,
        ),
      )
    }
    for (const hit of collectExecutableInstructionHits(source.record)) {
      findings.push(
        blocker(
          'CODE_GRAPH_PARITY_EXECUTABLE_INSTRUCTION_DECLARED',
          `${source.relativePath} contains executable/provider/network instruction field ${hit.field}.`,
          hit.field,
          source.relativePath,
        ),
      )
    }
  }

  if (codeSubgraph.record) {
    try {
      codeValidation = validateCodeSubgraphRecord(root, options.codeSubgraph ?? '', codeSubgraph.record)
    } catch (error) {
      if (error instanceof CodeSubgraphValidationError) {
        codeValidation = error.report
        findings.push(
          ...error.report.validationFindings.map((finding) =>
            blocker(
              `CODE_GRAPH_PARITY_${finding.code}`,
              `DevView code subgraph failed validation: ${finding.message}`,
              finding.field,
              finding.path,
            ),
          ),
        )
      } else {
        findings.push(
          blocker(
            'CODE_GRAPH_PARITY_CODE_SUBGRAPH_VALIDATION_FAILED',
            error instanceof Error ? error.message : String(error),
            undefined,
            codeSubgraph.relativePath,
          ),
        )
      }
    }
  }

  if (graphify.record) {
    validateGraphifyShape(graphify.record, graphify.relativePath, findings)
  }

  const graphifyNodes = recordsFromCollection(graphify.record?.nodes ?? graphify.record?.graphNodes)
  const graphifyEdges = recordsFromCollection(graphify.record?.edges ?? graphify.record?.graphEdges)
  const codeNodes = arrayRecords(codeSubgraph.record?.nodes)
  const codeEdges = arrayRecords(codeSubgraph.record?.edges)
  const edgeRelationCounts = countBy(
    graphifyEdges,
    (entry) => stringValue(entry.relation) ?? stringValue(entry.kind) ?? 'missing',
  )
  const codeEdgeTypeCounts = countBy(
    codeEdges,
    (entry) => stringValue(entry.kind ?? entry.edgeType ?? entry.relation) ?? 'missing',
  )
  const sourceGraphifyEdgeKindCounts = countBy(
    codeEdges,
    (entry) => stringValue(entry.sourceGraphifyEdgeKind) ?? 'missing',
  )
  const missingEndpoint = missingEndpointSummary(graphifyNodes, graphifyEdges)
  const graphifyCallLikeCount = (edgeRelationCounts.calls ?? 0) + (edgeRelationCounts.indirect_call ?? 0)
  const relationParity = Object.entries(edgeRelationCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([relation, graphifyCount]) => {
      const mappedKind = graphifyRelationToDevviewEdgeKind[relation] ?? null
      const exactDevviewCount = sourceGraphifyEdgeKindCounts[relation] ?? 0
      const mappedKindCount = mappedKind ? (codeEdgeTypeCounts[mappedKind] ?? 0) : 0
      return {
        relation,
        graphifyCount,
        mappedDevviewEdgeKind: mappedKind,
        devviewSourceGraphifyEdgeKindCount: exactDevviewCount,
        mappedDevviewEdgeKindCount: mappedKindCount,
        ratio: ratio(exactDevviewCount, graphifyCount),
        gap: exactDevviewCount - graphifyCount,
      }
    })
  const unsupportedGraphifyRelations = relationParity
    .filter((entry) => !entry.mappedDevviewEdgeKind)
    .map((entry) => entry.relation)
  const devviewSummary = {
    nodeCount: codeNodes.length,
    edgeCount: codeEdges.length,
    codeNodeKindCounts: countBy(codeNodes, (entry) => stringValue(entry.kind ?? entry.nodeKind) ?? 'missing'),
    codeEdgeTypeCounts,
    sourceGraphifyNodeBackedCount: codeNodes.filter(
      (entry) => Boolean(stringValue(entry.sourceGraphifyNodeId)) && entry.sourceGraphifyNodeSynthetic !== true,
    ).length,
    syntheticGraphifyNodeCount: codeNodes.filter((entry) => entry.sourceGraphifyNodeSynthetic === true).length,
    sourceGraphifyEdgeBackedCount: codeEdges.filter((entry) => Boolean(stringValue(entry.sourceGraphifyEdgeId))).length,
    sourceGraphifyEdgeKindCounts,
    callsEdgeCount: codeEdgeTypeCounts.calls ?? 0,
  }
  const parityMode: CodeGraphParityMode =
    devviewSummary.sourceGraphifyNodeBackedCount > 0 || devviewSummary.sourceGraphifyEdgeBackedCount > 0
      ? 'graphify-import'
      : 'native'
  const graphifyImportParityAchieved =
    unsupportedGraphifyRelations.length === 0 &&
    thresholdMet(devviewSummary.sourceGraphifyNodeBackedCount, graphifyNodes.length) &&
    thresholdMet(devviewSummary.sourceGraphifyEdgeBackedCount, graphifyEdges.length) &&
    thresholdMet(devviewSummary.callsEdgeCount, graphifyCallLikeCount)
  const nativeParityAchieved =
    unsupportedGraphifyRelations.length === 0 &&
    thresholdMet(devviewSummary.nodeCount, graphifyNodes.length) &&
    thresholdMet(devviewSummary.edgeCount, graphifyEdges.length) &&
    thresholdMet(devviewSummary.callsEdgeCount, graphifyCallLikeCount)
  const parity = {
    mode: parityMode,
    achieved: parityMode === 'graphify-import' ? graphifyImportParityAchieved : nativeParityAchieved,
    nodeRatio: ratio(devviewSummary.nodeCount, graphifyNodes.length),
    graphifyBackedNodeRatio: ratio(devviewSummary.sourceGraphifyNodeBackedCount, graphifyNodes.length),
    edgeRatio: ratio(devviewSummary.edgeCount, graphifyEdges.length),
    graphifyBackedEdgeRatio: ratio(devviewSummary.sourceGraphifyEdgeBackedCount, graphifyEdges.length),
    callLikeRatio: ratio(devviewSummary.callsEdgeCount, graphifyCallLikeCount),
    nodeGap: devviewSummary.nodeCount - graphifyNodes.length,
    graphifyBackedNodeGap: devviewSummary.sourceGraphifyNodeBackedCount - graphifyNodes.length,
    edgeGap: devviewSummary.edgeCount - graphifyEdges.length,
    graphifyBackedEdgeGap: devviewSummary.sourceGraphifyEdgeBackedCount - graphifyEdges.length,
    callLikeGap: devviewSummary.callsEdgeCount - graphifyCallLikeCount,
    relationParity,
    unsupportedGraphifyRelations,
  }

  const blocked = findings.some((finding) => finding.severity === 'blocker')
  if (!blocked) {
    const achievedMessage =
      parity.mode === 'graphify-import'
        ? 'DevView code subgraph Graphify-backed preservation is achieved for nodes, edges, and call-like relations at parity thresholds.'
        : 'Native DevView code subgraph reaches Graphify aggregate parity thresholds for nodes, edges, and call-like relations.'
    const gapMessage =
      parity.mode === 'graphify-import'
        ? 'DevView code subgraph remains below Graphify-backed preservation thresholds or has unsupported Graphify relations.'
        : 'Native DevView code subgraph remains below Graphify aggregate parity thresholds or has unsupported Graphify relations.'
    findings.push({
      severity: parity.achieved ? 'satisfied' : 'warning',
      code: parity.achieved ? 'CODE_GRAPH_PARITY_ACHIEVED' : 'CODE_GRAPH_PARITY_GAPS_REMAIN',
      message: parity.achieved ? achievedMessage : gapMessage,
    })
  }

  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : PASSED_STATUS,
    benchmarkScope: REPORT_SCOPE,
    sourceFactsOnly: true,
    reportOnly: true,
    inputs: {
      devviewCodeSubgraph: {
        path: codeSubgraph.relativePath,
        artifactRole: stringValue(codeSubgraph.record?.artifactRole),
        status: stringValue(codeSubgraph.record?.status),
        sha256: codeSubgraph.sha256,
        byteLength: codeSubgraph.byteLength,
        validationStatus: codeValidation?.codeSubgraphValidationStatus ?? null,
      },
      graphifyExport: {
        path: graphify.relativePath,
        exportId: stringValue(graphify.record?.exportId) ?? stringValue(graphify.record?.id),
        sha256: graphify.sha256,
        byteLength: graphify.byteLength,
      },
    },
    rawGraphifySummary: {
      nodeCount: graphifyNodes.length,
      edgeCount: graphifyEdges.length,
      edgeRelationCounts,
      missingEndpointEdgeCount: missingEndpoint.edgeCount,
      missingEndpointNodeCount: missingEndpoint.nodeCount,
      callRelationCount: edgeRelationCounts.calls ?? 0,
      callLikeRelationCount: graphifyCallLikeCount,
    },
    devviewSummary,
    parity,
    findings,
    downstreamActionPlan: blocked
      ? [
          'Fix unreadable inputs, unsafe authority flags, invalid code subgraph validation, or invalid Graphify graph shape, then rerun parity comparison.',
        ]
      : parity.achieved && parity.mode === 'graphify-import'
        ? [
            'Use this report as evidence that the Graphify static import adapter preserves raw Graphify code graph structure inside a DevView code subgraph source fact.',
          ]
        : parity.achieved
          ? [
              'Use this report as evidence that the native DevView code subgraph reaches Graphify aggregate node, edge, and call-like parity thresholds without Graphify-backed source facts.',
            ]
          : [
              parity.mode === 'graphify-import'
                ? 'Inspect Graphify-backed ratios, relationParity, and count gaps before claiming Graphify-backed import preservation.'
                : 'Inspect aggregate node, edge, call-like ratios, unsupported relations, and relationParity detail before claiming native Graphify aggregate parity.',
            ],
    benchmarkExecuted: false,
    graphifyExecuted: false,
    astExtractorExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
  }
}

function validateGraphifyShape(
  record: JsonRecord,
  sourcePath: string,
  findings: CodeGraphParityBenchmarkFinding[],
): void {
  if (
    !Array.isArray(record.nodes) &&
    !asRecord(record.nodes) &&
    !Array.isArray(record.graphNodes) &&
    !asRecord(record.graphNodes)
  ) {
    findings.push(
      blocker(
        'CODE_GRAPH_PARITY_GRAPHIFY_NODES_INVALID',
        `${sourcePath} must include Graphify nodes or graphNodes as an array or object collection.`,
        'nodes',
        sourcePath,
      ),
    )
  }
  if (
    !Array.isArray(record.edges) &&
    !asRecord(record.edges) &&
    !Array.isArray(record.graphEdges) &&
    !asRecord(record.graphEdges)
  ) {
    findings.push(
      blocker(
        'CODE_GRAPH_PARITY_GRAPHIFY_EDGES_INVALID',
        `${sourcePath} must include Graphify edges or graphEdges as an array or object collection.`,
        'edges',
        sourcePath,
      ),
    )
  }
}

function missingEndpointSummary(nodes: JsonRecord[], edges: JsonRecord[]): { edgeCount: number; nodeCount: number } {
  const nodeIds = new Set(
    nodes
      .map((entry) => stringValue(entry.id) ?? stringValue(entry.nodeId) ?? stringValue(entry.key))
      .filter((entry): entry is string => Boolean(entry))
      .map(normalize),
  )
  const missingIds = new Set<string>()
  let edgeCount = 0
  for (const edge of edges) {
    const source = endpointValue(edge, ['from', 'source', 'sourceId', 'sourceNodeId', 'sourceNode'])
    const target = endpointValue(edge, ['to', 'target', 'targetId', 'targetNodeId', 'targetNode'])
    const missingSource = source && !nodeIds.has(normalize(source))
    const missingTarget = target && !nodeIds.has(normalize(target))
    if (missingSource || missingTarget) edgeCount += 1
    if (missingSource) missingIds.add(normalize(source))
    if (missingTarget) missingIds.add(normalize(target))
  }
  return { edgeCount, nodeCount: missingIds.size }
}

async function loadSource(root: string, requestedPath: string): Promise<LoadedSource> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  try {
    const bytes = await readFile(resolvedPath)
    return {
      requestedPath,
      resolvedPath,
      relativePath: relativePath(root, resolvedPath),
      record: JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) as JsonRecord,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      byteLength: bytes.byteLength,
      readError: null,
    }
  } catch (error) {
    return {
      requestedPath,
      resolvedPath,
      relativePath: relativePath(root, resolvedPath),
      record: null,
      sha256: null,
      byteLength: null,
      readError: error instanceof Error ? error.message : String(error),
    }
  }
}

function renderMarkdown(report: CodeGraphParityBenchmarkReport): string {
  return [
    '# Code Graph Parity Benchmark',
    '',
    `Status: ${report.status}`,
    `Parity mode: ${report.parity.mode}`,
    `Parity achieved: ${report.parity.achieved}`,
    `DevView code subgraph: \`${report.inputs.devviewCodeSubgraph.path}\``,
    `Graphify export: \`${report.inputs.graphifyExport.path}\``,
    '',
    '## Counts',
    '',
    `- Graphify nodes: ${report.rawGraphifySummary.nodeCount}`,
    `- DevView nodes: ${report.devviewSummary.nodeCount}`,
    `- DevView Graphify-backed nodes: ${report.devviewSummary.sourceGraphifyNodeBackedCount}`,
    `- Graphify edges: ${report.rawGraphifySummary.edgeCount}`,
    `- DevView edges: ${report.devviewSummary.edgeCount}`,
    `- DevView Graphify-backed edges: ${report.devviewSummary.sourceGraphifyEdgeBackedCount}`,
    `- Graphify call-like edges: ${report.rawGraphifySummary.callLikeRelationCount}`,
    `- DevView calls edges: ${report.devviewSummary.callsEdgeCount}`,
    '',
    '## Ratios',
    '',
    `- Node ratio: ${formatRatio(report.parity.nodeRatio)}`,
    `- Graphify-backed node ratio: ${formatRatio(report.parity.graphifyBackedNodeRatio)}`,
    `- Edge ratio: ${formatRatio(report.parity.edgeRatio)}`,
    `- Graphify-backed edge ratio: ${formatRatio(report.parity.graphifyBackedEdgeRatio)}`,
    `- Call-like ratio: ${formatRatio(report.parity.callLikeRatio)}`,
    '',
    '## Relation Parity',
    '',
    ...report.parity.relationParity.map(
      (entry) =>
        `- ${entry.relation}: ${entry.devviewSourceGraphifyEdgeKindCount}/${entry.graphifyCount} (${formatRatio(
          entry.ratio,
        )})`,
    ),
    '',
    '## Boundary',
    '',
    '- benchmarkExecuted: false',
    '- graphifyExecuted: false',
    '- astExtractorExecuted: false',
    '- provider/network/API called: false',
    '- graphSourceMutated: false',
  ].join('\n')
}

function validateRequiredOptions(options: CodeGraphParityBenchmarkOptions): void {
  if (!options.codeSubgraph) {
    throw new Error('benchmark compare-code-graph-parity requires --code-subgraph <devview-code-subgraph.json>.')
  }
  if (!options.graphifyExport) {
    throw new Error('benchmark compare-code-graph-parity requires --graphify <graphify graph.json>.')
  }
  if (!options.output) {
    throw new Error('benchmark compare-code-graph-parity requires --output <json>.')
  }
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: CodeGraphParityBenchmarkOptions,
): Promise<void> {
  const outputPath = resolveRepoPath(root, options.output ?? '')
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  const outputs = [
    { kind: 'parity output', path: outputPath },
    ...(markdownPath ? [{ kind: 'markdown output', path: markdownPath }] : []),
  ]
  const seenOutputs = new Set<string>()
  for (const output of outputs) {
    const key = pathKey(output.path)
    if (seenOutputs.has(key)) {
      throw new Error('Code graph parity benchmark outputs must be different paths.')
    }
    seenOutputs.add(key)
  }

  const sourceSet = new Set(sourcePaths.map(pathKey))
  for (const output of outputs) {
    const relativeTarget = relativePath(root, output.path)
    if (sourceSet.has(pathKey(output.path))) {
      throw new Error(`Code graph parity benchmark ${output.kind} would overwrite a source input: ${relativeTarget}.`)
    }
    if (isProtectedControlPath(root, output.path)) {
      throw new Error(
        `Code graph parity benchmark ${output.kind} is inside a protected control path: ${relativeTarget}.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(output.path)
    if (existingAuthority) {
      throw new Error(
        `Code graph parity benchmark ${output.kind} would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
  }
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  try {
    const bytes = await readFile(filePath)
    const parsed = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) as JsonRecord
    const role = stringValue(parsed.artifactRole)
    if (role?.includes('graph-source') || role === 'devview-code-subgraph' || role === REPORT_ROLE) {
      return `artifactRole ${role}`
    }
    if (asRecord(parsed.sourceRecords)) return 'source-authority-shaped sourceRecords'
    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) return 'node-edge graph-shaped artifact'
  } catch {
    return null
  }
  return null
}

function collectUnsafeAuthorityHits(
  value: unknown,
  pathParts: string[] = [],
  seen = new Set<unknown>(),
): Array<{ field: string }> {
  if (!value || typeof value !== 'object') return []
  if (seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectUnsafeAuthorityHits(entry, [...pathParts, String(index)], seen))
  }
  const record = value as JsonRecord
  const hits: Array<{ field: string }> = []
  for (const [key, entry] of Object.entries(record)) {
    const nextPath = [...pathParts, key]
    if (unsafeAuthorityFields.includes(key) && entry === true) {
      hits.push({ field: nextPath.join('.') })
    }
    hits.push(...collectUnsafeAuthorityHits(entry, nextPath, seen))
  }
  return hits
}

function collectExecutableInstructionHits(
  value: unknown,
  pathParts: string[] = [],
  seen = new Set<unknown>(),
): Array<{ field: string }> {
  if (!value || typeof value !== 'object') return []
  if (seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectExecutableInstructionHits(entry, [...pathParts, String(index)], seen))
  }
  const record = value as JsonRecord
  const hits: Array<{ field: string }> = []
  for (const [key, entry] of Object.entries(record)) {
    const nextPath = [...pathParts, key]
    if (executableInstructionFields.includes(key) && isExecutableInstructionValue(entry)) {
      hits.push({ field: nextPath.join('.') })
    }
    hits.push(...collectExecutableInstructionHits(entry, nextPath, seen))
  }
  return hits
}

function isExecutableInstructionValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  const record = asRecord(value)
  if (record) return Object.keys(record).length > 0
  return value === true
}

function recordsFromCollection(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.filter((entry): entry is JsonRecord => asRecord(entry) !== null)
  const record = asRecord(value)
  if (record) return Object.values(record).filter((entry): entry is JsonRecord => asRecord(entry) !== null)
  return []
}

function arrayRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is JsonRecord => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry))
    : []
}

function endpointValue(record: JsonRecord, fields: string[]): string | null {
  for (const field of fields) {
    const direct = stringValue(record[field])
    if (direct) return direct
    const nested = asRecord(record[field])
    const nestedId = stringValue(nested?.id) ?? stringValue(nested?.nodeId)
    if (nestedId) return nestedId
  }
  return null
}

function blocker(code: string, message: string, field?: string, pathValue?: string): CodeGraphParityBenchmarkFinding {
  return { severity: 'blocker', code, message, field, path: pathValue }
}

function countBy(values: JsonRecord[], key: (value: JsonRecord) => string): Record<string, number> {
  const result: Record<string, number> = {}
  for (const value of values) {
    const name = key(value)
    result[name] = (result[name] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)))
}

function thresholdMet(numerator: number, denominator: number): boolean {
  const value = ratio(numerator, denominator)
  return value === null ? false : value >= 0.99
}

function ratio(numerator: number, denominator: number): number | null {
  if (denominator === 0) return numerator === 0 ? 1 : null
  return Number((numerator / denominator).toFixed(6))
}

function formatRatio(value: number | null): string {
  return value === null ? 'n/a' : `${(value * 100).toFixed(2)}%`
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function normalize(value: string): string {
  return value.replace(/\\/g, '/').toLowerCase()
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(root, filePath)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}

function isProtectedControlPath(root: string, filePath: string): boolean {
  const relative = relativePath(root, filePath)
  return (
    hasDevViewControlDirectory(relative) ||
    hasCodexControlDirectory(relative) ||
    hasHiddenControlDirectorySegment(relative)
  )
}
