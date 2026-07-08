import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { relativePath, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'
import { CodeSubgraphValidationError, validateCodeSubgraphRecord } from './code-subgraph-validation.js'

type JsonRecord = Record<string, unknown>

const REPORT_ROLE = 'devview-code-graph-html-render-report'
const REPORT_STATUS = 'devview-code-graph-html-rendered'
const REPORT_SCOPE = 'code-subgraph-readonly-html-render-report-only'
const HTML_ROLE = 'devview-code-subgraph-html-preview'
const VALIDATION_REPORT_ROLE = 'devview-code-subgraph-validation-report'
const VALIDATION_REPORT_STATUS = 'devview-code-subgraph-validation-passed'
const DEVVIEW_GRAPH_DATA_ROLE = 'devview-graph-html-data-preview'
const DEVVIEW_GRAPH_DATA_STATUS = 'devview-graph-html-data-generated'

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
  'filesMutated',
  'graphSourceMutated',
  'graphDeltaApplied',
  'viewTreeGenerated',
  'contextPackGenerated',
  'runtimeEvidenceSatisfied',
  'evidenceAccepted',
  'equivalenceProven',
  'scopeEnforced',
  'ciEnforcementEnabled',
  'hooksActivated',
  'branchProtectionChanged',
  'branchProtectionMutated',
  'requiredChecksConfigured',
  'requiredChecksMutated',
  'externalCiMutated',
  'approvalAutomationEnabled',
  'userAcceptanceAutomated',
  'enterpriseGateActivated',
  'cryptographicSignaturePresent',
  'cryptographicSignatureVerified',
  'cryptographicSigningImplemented',
  'keyGenerated',
  'privateKeyStored',
  'keyManagementImplemented',
  'keyRegistryCreated',
  'trustRootCreated',
  'rbacEnforced',
  'permissionVerified',
  'rbacPermissionVerified',
  'providerGrantPresent',
  'providerGrantVerified',
  'providerGrantActive',
  'providerAllowlistActive',
  'networkAllowlistActive',
  'packagePublished',
  'packageArtifactGenerated',
  'packageSigned',
  'sbomGenerated',
  'sbomAttested',
  'provenanceAttested',
  'provenanceAttestationGenerated',
  'provenanceAttestationVerified',
  'realSlsaVerificationPerformed',
  'realInTotoVerificationPerformed',
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

export interface CodeGraphHtmlRenderOptions {
  codeSubgraph?: string
  codeSubgraphValidation?: string
  devviewGraphData?: string
  output?: string
  markdown?: string
}

export interface CodeGraphHtmlRenderFinding {
  severity: 'blocker' | 'warning' | 'satisfied'
  code: string
  message: string
  field?: string
  path?: string
}

interface LoadedArtifact {
  requestedPath: string
  resolvedPath: string
  relativePath: string
  sourceKind: 'code-subgraph' | 'code-subgraph-validation' | 'devview-graph-data'
  record: JsonRecord | null
  sha256: string | null
  byteLength: number | null
  readError: string | null
}

interface DevViewContextSummary {
  path: string
  sourceRecordId: string | null
  userRequest: string | null
  projectName: string | null
  targetSlice: string | null
  writeBoundary: string | null
  workHistory: JsonRecord[]
  trees: JsonRecord[]
  subgraphs: JsonRecord[]
  packMapping: JsonRecord[]
  workflowSteps: JsonRecord[]
  compilationTrace: JsonRecord[]
}

interface RenderNode {
  id: string
  label: string
  kind: string
  sourceFile: string | null
  sourceLocation: unknown
  sourceLocationStatus: string | null
  confidence: string | null
  extractor: string | null
  sourceGraphifyNodeId: string | null
  degree: number
  x: number
  y: number
}

interface RenderEdge {
  id: string
  from: string
  to: string
  kind: string
  sourceFile: string | null
  sourceLocation: unknown
  sourceLocationStatus: string | null
  confidence: string | null
  sourceGraphifyEdgeKind: string | null
}

interface RenderGraphData {
  artifactRole: typeof HTML_ROLE
  status: 'devview-code-subgraph-html-preview-rendered'
  renderScope: 'code-subgraph-readonly-html-inspector'
  sourceCodeSubgraph: {
    path: string
    sha256: string | null
    byteLength: number | null
  }
  sourceCodeSubgraphValidation: {
    path: string | null
    status: string | null
  }
  devviewContext: DevViewContextSummary | null
  summary: {
    nodeCount: number
    edgeCount: number
    nodeKindCounts: Record<string, number>
    edgeTypeCounts: Record<string, number>
    graphWidth: number
    graphHeight: number
  }
  nodes: RenderNode[]
  edges: RenderEdge[]
  safetyFlags: {
    readOnlyVisualizationOnly: true
    graphSourceMutated: false
    graphDeltaApplied: false
    viewTreeGenerated: false
    contextPackGenerated: false
    providerInvoked: false
    networkCallMade: false
    apiCallMade: false
    shellCommandsExecuted: false
    rbacEnforced: false
    permissionVerified: false
    cryptographicSignatureVerified: false
    enterpriseGateActivated: false
  }
}

export interface CodeGraphHtmlRenderReport extends JsonRecord {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof REPORT_STATUS | 'devview-code-graph-html-render-blocked'
  renderScope: typeof REPORT_SCOPE
  reportOnly: true
  sourceFactsOnly: true
  sourceCodeSubgraph: {
    path: string | null
    artifactRole: string | null
    status: string | null
    scope: string | null
    sha256: string | null
    byteLength: number | null
    nodeCount: number
    edgeCount: number
  }
  sourceCodeSubgraphValidation: {
    path: string | null
    artifactRole: string | null
    status: string | null
    sha256: string | null
    byteLength: number | null
  }
  sourceDevViewGraphData: {
    path: string | null
    artifactRole: string | null
    status: string | null
    sha256: string | null
    byteLength: number | null
    workflowStepCount: number
    treeCount: number
    subgraphCount: number
  }
  htmlSummary: {
    nodeCount: number
    edgeCount: number
    nodeKindCounts: Record<string, number>
    edgeTypeCounts: Record<string, number>
    graphWidth: number
    graphHeight: number
    hasZoomControls: boolean
    hasPanControls: boolean
    hasSelectionInspector: boolean
    nonScalingEdgeStroke: boolean
    inverseScaledNodeGlyphs: boolean
  }
  renderFindings: CodeGraphHtmlRenderFinding[]
  graphifyExecuted: false
  astExtractorExecuted: false
  providerInvoked: false
  networkCallMade: false
  apiCallMade: false
  shellCommandsExecuted: false
  graphSourceMutated: false
  graphDeltaApplied: false
  viewTreeGenerated: false
  contextPackGenerated: false
  rbacEnforced: false
  permissionVerified: false
  cryptographicSignatureVerified: false
  enterpriseGateActivated: false
  writtenHtmlOutputPath?: string
  writtenMarkdownPath?: string
}

export class CodeGraphHtmlRendererError extends Error {
  readonly report: CodeGraphHtmlRenderReport

  constructor(report: CodeGraphHtmlRenderReport) {
    super('Code graph HTML rendering is blocked.')
    this.report = report
  }
}

export async function renderCodeGraphHtmlFile(
  root: string,
  options: CodeGraphHtmlRenderOptions,
): Promise<CodeGraphHtmlRenderReport> {
  validateRequiredOptions(options)
  const codeSubgraph = await loadArtifact(root, options.codeSubgraph ?? '', 'code-subgraph')
  const codeSubgraphValidation = options.codeSubgraphValidation
    ? await loadArtifact(root, options.codeSubgraphValidation, 'code-subgraph-validation')
    : null
  const devviewGraphData = options.devviewGraphData
    ? await loadArtifact(root, options.devviewGraphData, 'devview-graph-data')
    : null
  const findings: CodeGraphHtmlRenderFinding[] = []

  validateOutputPaths(
    root,
    options,
    [codeSubgraph, codeSubgraphValidation, devviewGraphData].filter(Boolean) as LoadedArtifact[],
    findings,
  )
  if (!codeSubgraph.record) {
    findings.push(
      blocker(
        'CODE_GRAPH_HTML_CODE_SUBGRAPH_READ_FAILED',
        `Could not read --code-subgraph: ${codeSubgraph.readError}`,
        'codeSubgraph',
        codeSubgraph.relativePath,
      ),
    )
  } else {
    try {
      validateCodeSubgraphRecord(root, codeSubgraph.requestedPath, codeSubgraph.record)
    } catch (error) {
      if (error instanceof CodeSubgraphValidationError) {
        for (const finding of error.report.validationFindings) {
          if (finding.severity === 'blocker') {
            findings.push(blocker(finding.code, finding.message, finding.field, finding.path))
          }
        }
      } else {
        findings.push(
          blocker(
            'CODE_GRAPH_HTML_CODE_SUBGRAPH_INVALID',
            error instanceof Error ? error.message : String(error),
            'codeSubgraph',
            codeSubgraph.relativePath,
          ),
        )
      }
    }
  }

  if (codeSubgraphValidation) {
    validateCodeSubgraphValidation(codeSubgraphValidation, findings)
  }
  if (devviewGraphData) {
    validateDevViewGraphData(devviewGraphData, findings)
  }
  for (const source of [codeSubgraph, codeSubgraphValidation, devviewGraphData].filter(Boolean) as LoadedArtifact[]) {
    if (!source.record) continue
    for (const hit of collectUnsafeAuthorityHits(source.record)) {
      findings.push(
        blocker(
          'CODE_GRAPH_HTML_UNSAFE_SOURCE_AUTHORITY_FLAG',
          `${source.relativePath} contains unsafe report-only flag ${hit.field}: true.`,
          hit.field,
          source.relativePath,
        ),
      )
    }
    for (const hit of collectExecutableInstructionHits(source.record)) {
      findings.push(
        blocker(
          'CODE_GRAPH_HTML_EXECUTABLE_INSTRUCTION_DECLARED',
          `${source.relativePath} contains executable/provider/network instruction field ${hit.field}.`,
          hit.field,
          source.relativePath,
        ),
      )
    }
  }

  const report = buildReport(root, codeSubgraph, codeSubgraphValidation, devviewGraphData, findings, null, options)
  if (findings.some((finding) => finding.severity === 'blocker')) {
    report.status = 'devview-code-graph-html-render-blocked'
    throw new CodeGraphHtmlRendererError(report)
  }

  const renderData = buildRenderGraphData(codeSubgraph, codeSubgraphValidation, devviewGraphData)
  const outputPath = resolveRepoPath(root, options.output ?? '')
  await writeTextAtomic(outputPath, renderHtml(renderData))
  report.writtenHtmlOutputPath = relativePath(root, outputPath)
  report.htmlSummary = renderSummary(renderData)
  if (options.markdown) {
    const markdownPath = resolveRepoPath(root, options.markdown)
    await writeTextAtomic(markdownPath, renderMarkdown(report))
    report.writtenMarkdownPath = relativePath(root, markdownPath)
  }
  return report
}

function validateRequiredOptions(options: CodeGraphHtmlRenderOptions): void {
  if (!options.codeSubgraph) throw new Error('graph render-code-graph-html requires --code-subgraph <file>.')
  if (!options.output) throw new Error('graph render-code-graph-html requires --output <htmlOutputPath>.')
}

async function loadArtifact(
  root: string,
  requestedPath: string,
  sourceKind: LoadedArtifact['sourceKind'],
): Promise<LoadedArtifact> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  try {
    const bytes = await readFile(resolvedPath)
    const parsed = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) as JsonRecord
    return {
      requestedPath,
      resolvedPath,
      relativePath: relativePath(root, resolvedPath),
      sourceKind,
      record: parsed,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      byteLength: bytes.byteLength,
      readError: null,
    }
  } catch (error) {
    return {
      requestedPath,
      resolvedPath,
      relativePath: relativePath(root, resolvedPath),
      sourceKind,
      record: null,
      sha256: null,
      byteLength: null,
      readError: error instanceof Error ? error.message : String(error),
    }
  }
}

function validateOutputPaths(
  root: string,
  options: CodeGraphHtmlRenderOptions,
  sources: LoadedArtifact[],
  findings: CodeGraphHtmlRenderFinding[],
): void {
  const outputPath = resolveRepoPath(root, options.output ?? '')
  const outputRelative = relativePath(root, outputPath)
  if (!/\.html?$/i.test(outputPath)) {
    findings.push(
      blocker(
        'CODE_GRAPH_HTML_OUTPUT_EXTENSION_UNSUPPORTED',
        '--output for graph render-code-graph-html must end with .html or .htm.',
        'output',
        outputRelative,
      ),
    )
  }
  for (const source of sources) {
    if (samePath(outputPath, source.resolvedPath)) {
      findings.push(
        blocker(
          'CODE_GRAPH_HTML_OUTPUT_OVERWRITES_SOURCE',
          `--output would overwrite supplied source ${source.relativePath}.`,
          'output',
          outputRelative,
        ),
      )
    }
  }
  if (options.markdown) {
    const markdownPath = resolveRepoPath(root, options.markdown)
    if (samePath(outputPath, markdownPath)) {
      findings.push(
        blocker(
          'CODE_GRAPH_HTML_OUTPUT_MARKDOWN_COLLISION',
          '--output and --markdown must be different files.',
          'markdown',
          relativePath(root, markdownPath),
        ),
      )
    }
  }
  for (const candidate of [outputPath, options.markdown ? resolveRepoPath(root, options.markdown) : null].filter(
    Boolean,
  ) as string[]) {
    const candidateRelative = relativePath(root, candidate)
    if (
      hasDevViewControlDirectory(candidateRelative) ||
      hasCodexControlDirectory(candidateRelative) ||
      hasHiddenControlDirectorySegment(candidateRelative)
    ) {
      findings.push(
        blocker(
          'CODE_GRAPH_HTML_PROTECTED_OUTPUT_PATH',
          `Output path ${candidateRelative} is inside a protected control path.`,
          'output',
          candidateRelative,
        ),
      )
    }
    if (existsSync(candidate)) {
      const existing = readJsonSafeSync(candidate)
      const role = existing ? stringValue(existing.artifactRole) : null
      if (role && (role.includes('graph-source') || role === 'devview-code-subgraph')) {
        findings.push(
          blocker(
            'CODE_GRAPH_HTML_SOURCE_AUTHORITY_SHAPED_OUTPUT',
            `Output path ${candidateRelative} already contains source-authority-shaped JSON.`,
            'output',
            candidateRelative,
          ),
        )
      }
    }
  }
}

function validateCodeSubgraphValidation(source: LoadedArtifact, findings: CodeGraphHtmlRenderFinding[]): void {
  if (!source.record) {
    findings.push(
      blocker(
        'CODE_GRAPH_HTML_VALIDATION_REPORT_READ_FAILED',
        `Could not read --code-subgraph-validation: ${source.readError}`,
        'codeSubgraphValidation',
        source.relativePath,
      ),
    )
    return
  }
  if (stringValue(source.record.artifactRole) !== VALIDATION_REPORT_ROLE) {
    findings.push(
      blocker(
        'CODE_GRAPH_HTML_VALIDATION_REPORT_ROLE_INVALID',
        '--code-subgraph-validation must be a devview-code-subgraph-validation-report.',
        'artifactRole',
        source.relativePath,
      ),
    )
  }
  if (stringValue(source.record.status) !== VALIDATION_REPORT_STATUS) {
    findings.push(
      blocker(
        'CODE_GRAPH_HTML_VALIDATION_REPORT_STATUS_INVALID',
        '--code-subgraph-validation must have status devview-code-subgraph-validation-passed.',
        'status',
        source.relativePath,
      ),
    )
  }
}

function validateDevViewGraphData(source: LoadedArtifact, findings: CodeGraphHtmlRenderFinding[]): void {
  if (!source.record) {
    findings.push(
      blocker(
        'CODE_GRAPH_HTML_DEVVIEW_GRAPH_DATA_READ_FAILED',
        `Could not read --devview-graph-data: ${source.readError}`,
        'devviewGraphData',
        source.relativePath,
      ),
    )
    return
  }
  if (stringValue(source.record.artifactRole) !== DEVVIEW_GRAPH_DATA_ROLE) {
    findings.push(
      blocker(
        'CODE_GRAPH_HTML_DEVVIEW_GRAPH_DATA_ROLE_INVALID',
        '--devview-graph-data must be a devview-graph-html-data-preview artifact.',
        'artifactRole',
        source.relativePath,
      ),
    )
  }
  if (stringValue(source.record.status) !== DEVVIEW_GRAPH_DATA_STATUS) {
    findings.push(
      blocker(
        'CODE_GRAPH_HTML_DEVVIEW_GRAPH_DATA_STATUS_INVALID',
        '--devview-graph-data must have status devview-graph-html-data-generated.',
        'status',
        source.relativePath,
      ),
    )
  }
}

function buildRenderGraphData(
  source: LoadedArtifact,
  validation: LoadedArtifact | null,
  devviewGraphData: LoadedArtifact | null,
): RenderGraphData {
  const record = source.record ?? {}
  const rawNodes = arrayOfRecords(record.nodes)
  const rawEdges = arrayOfRecords(record.edges)
  const degreeByNode = new Map<string, number>()
  for (const node of rawNodes) {
    const id = stringValue(node.id)
    if (id) degreeByNode.set(id, 0)
  }
  for (const edge of rawEdges) {
    const from = stringValue(edge.from)
    const to = stringValue(edge.to)
    if (from) degreeByNode.set(from, (degreeByNode.get(from) ?? 0) + 1)
    if (to) degreeByNode.set(to, (degreeByNode.get(to) ?? 0) + 1)
  }

  const kindOrder = sortedUnique(rawNodes.map((node) => stringValue(node.kind) ?? 'unknown'))
  const laneByKind = new Map(kindOrder.map((kind, index) => [kind, index]))
  const indexByKind = new Map<string, number>()
  const laneWidth = 240
  const rowHeight = 52
  const margin = 90
  const nodes: RenderNode[] = rawNodes.map((node) => {
    const id = stringValue(node.id) ?? 'unknown'
    const kind = stringValue(node.kind) ?? 'unknown'
    const lane = laneByKind.get(kind) ?? 0
    const row = indexByKind.get(kind) ?? 0
    indexByKind.set(kind, row + 1)
    return {
      id,
      label: stringValue(node.label) ?? id,
      kind,
      sourceFile: stringValue(node.sourceFile),
      sourceLocation: asRecord(node.sourceLocation) ?? stringValue(node.sourceLocation),
      sourceLocationStatus: stringValue(node.sourceLocationStatus),
      confidence: stringValue(node.confidence),
      extractor: stringValue(node.extractor),
      sourceGraphifyNodeId: stringValue(node.sourceGraphifyNodeId),
      degree: degreeByNode.get(id) ?? 0,
      x: margin + lane * laneWidth,
      y: margin + row * rowHeight,
    }
  })
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const edges: RenderEdge[] = rawEdges.map((edge, index) => ({
    id: stringValue(edge.id) ?? `edge-${index + 1}`,
    from: stringValue(edge.from) ?? '',
    to: stringValue(edge.to) ?? '',
    kind: stringValue(edge.kind) ?? 'unknown',
    sourceFile: stringValue(edge.sourceFile),
    sourceLocation: asRecord(edge.sourceLocation) ?? stringValue(edge.sourceLocation),
    sourceLocationStatus: stringValue(edge.sourceLocationStatus),
    confidence: stringValue(edge.confidence),
    sourceGraphifyEdgeKind: stringValue(edge.sourceGraphifyEdgeKind),
  }))
  const maxRows = Math.max(...Array.from(indexByKind.values()), 1)
  const width = Math.max(960, margin * 2 + Math.max(kindOrder.length, 1) * laneWidth)
  const height = Math.max(640, margin * 2 + maxRows * rowHeight)
  return {
    artifactRole: HTML_ROLE,
    status: 'devview-code-subgraph-html-preview-rendered',
    renderScope: 'code-subgraph-readonly-html-inspector',
    sourceCodeSubgraph: {
      path: source.relativePath,
      sha256: source.sha256,
      byteLength: source.byteLength,
    },
    sourceCodeSubgraphValidation: {
      path: validation?.relativePath ?? null,
      status: validation?.record ? stringValue(validation.record.status) : null,
    },
    devviewContext: buildDevViewContextSummary(devviewGraphData),
    summary: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodeKindCounts: countBy(nodes, (node) => node.kind),
      edgeTypeCounts: countBy(edges, (edge) => edge.kind),
      graphWidth: width,
      graphHeight: height,
    },
    nodes,
    edges: edges.filter((edge) => nodeById.has(edge.from) && nodeById.has(edge.to)),
    safetyFlags: {
      readOnlyVisualizationOnly: true,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      viewTreeGenerated: false,
      contextPackGenerated: false,
      providerInvoked: false,
      networkCallMade: false,
      apiCallMade: false,
      shellCommandsExecuted: false,
      rbacEnforced: false,
      permissionVerified: false,
      cryptographicSignatureVerified: false,
      enterpriseGateActivated: false,
    },
  }
}

function buildDevViewContextSummary(source: LoadedArtifact | null): DevViewContextSummary | null {
  if (!source?.record) return null
  const requestSummary = asRecord(source.record.requestSummary)
  return {
    path: source.relativePath,
    sourceRecordId: stringValue(requestSummary?.sourceRecordId) ?? stringValue(source.record.sourceRecordId),
    userRequest: stringValue(requestSummary?.userRequest),
    projectName: stringValue(requestSummary?.projectName),
    targetSlice: stringValue(requestSummary?.targetSlice),
    writeBoundary: stringValue(requestSummary?.writeBoundary),
    workHistory: arrayOfRecords(source.record.workHistory),
    trees: arrayOfRecords(source.record.trees),
    subgraphs: arrayOfRecords(source.record.subgraphs),
    packMapping: arrayOfRecords(source.record.packMapping),
    workflowSteps: arrayOfRecords(source.record.workflowSteps),
    compilationTrace: arrayOfRecords(source.record.compilationTrace),
  }
}

function buildReport(
  root: string,
  codeSubgraph: LoadedArtifact,
  validation: LoadedArtifact | null,
  devviewGraphData: LoadedArtifact | null,
  findings: CodeGraphHtmlRenderFinding[],
  renderData: RenderGraphData | null,
  options: CodeGraphHtmlRenderOptions,
): CodeGraphHtmlRenderReport {
  const record = codeSubgraph.record ?? {}
  const nodes = arrayOfRecords(record.nodes)
  const edges = arrayOfRecords(record.edges)
  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: REPORT_STATUS,
    renderScope: REPORT_SCOPE,
    reportOnly: true,
    sourceFactsOnly: true,
    sourceCodeSubgraph: {
      path: codeSubgraph.record ? codeSubgraph.relativePath : null,
      artifactRole: stringValue(record.artifactRole),
      status: stringValue(record.status),
      scope: stringValue(record.scope),
      sha256: codeSubgraph.sha256,
      byteLength: codeSubgraph.byteLength,
      nodeCount: nodes.length,
      edgeCount: edges.length,
    },
    sourceCodeSubgraphValidation: {
      path: validation?.record ? validation.relativePath : null,
      artifactRole: validation?.record ? stringValue(validation.record.artifactRole) : null,
      status: validation?.record ? stringValue(validation.record.status) : null,
      sha256: validation?.sha256 ?? null,
      byteLength: validation?.byteLength ?? null,
    },
    sourceDevViewGraphData: {
      path: devviewGraphData?.record ? devviewGraphData.relativePath : null,
      artifactRole: devviewGraphData?.record ? stringValue(devviewGraphData.record.artifactRole) : null,
      status: devviewGraphData?.record ? stringValue(devviewGraphData.record.status) : null,
      sha256: devviewGraphData?.sha256 ?? null,
      byteLength: devviewGraphData?.byteLength ?? null,
      workflowStepCount: arrayOfRecords(devviewGraphData?.record?.workflowSteps).length,
      treeCount: arrayOfRecords(devviewGraphData?.record?.trees).length,
      subgraphCount: arrayOfRecords(devviewGraphData?.record?.subgraphs).length,
    },
    htmlSummary: renderData
      ? renderSummary(renderData)
      : {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          nodeKindCounts: countBy(nodes, (node) => stringValue(node.kind) ?? 'unknown'),
          edgeTypeCounts: countBy(edges, (edge) => stringValue(edge.kind) ?? 'unknown'),
          graphWidth: 0,
          graphHeight: 0,
          hasZoomControls: true,
          hasPanControls: true,
          hasSelectionInspector: true,
          nonScalingEdgeStroke: true,
          inverseScaledNodeGlyphs: true,
        },
    renderFindings:
      findings.length > 0
        ? findings
        : [satisfied('CODE_GRAPH_HTML_RENDER_READY', 'Code graph HTML render inputs are valid.')],
    graphifyExecuted: false,
    astExtractorExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    viewTreeGenerated: false,
    contextPackGenerated: false,
    rbacEnforced: false,
    permissionVerified: false,
    cryptographicSignatureVerified: false,
    enterpriseGateActivated: false,
    ...(options.output ? { writtenHtmlOutputPath: relativePath(root, resolveRepoPath(root, options.output)) } : {}),
  }
}

function renderSummary(data: RenderGraphData): CodeGraphHtmlRenderReport['htmlSummary'] {
  return {
    nodeCount: data.summary.nodeCount,
    edgeCount: data.summary.edgeCount,
    nodeKindCounts: data.summary.nodeKindCounts,
    edgeTypeCounts: data.summary.edgeTypeCounts,
    graphWidth: data.summary.graphWidth,
    graphHeight: data.summary.graphHeight,
    hasZoomControls: true,
    hasPanControls: true,
    hasSelectionInspector: true,
    nonScalingEdgeStroke: true,
    inverseScaledNodeGlyphs: true,
  }
}

function renderHtml(data: RenderGraphData): string {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  const initialScale = 0.03
  const initialCircleRadius = 7 / initialScale
  const initialLabelX = 11 / initialScale
  const initialLabelY = 4 / initialScale
  const initialLabelSize = 11 / initialScale
  const palette = [
    '#60a5fa',
    '#34d399',
    '#f59e0b',
    '#f472b6',
    '#a78bfa',
    '#2dd4bf',
    '#f87171',
    '#84cc16',
    '#38bdf8',
    '#fb7185',
    '#c084fc',
  ]
  const kindColors = new Map<string, string>()
  const colorForKind = (kind: string): string => {
    if (!kindColors.has(kind)) {
      kindColors.set(kind, palette[kindColors.size % palette.length])
    }
    return kindColors.get(kind) ?? palette[0]
  }
  const nodeById = new Map(data.nodes.map((node) => [node.id, node]))
  const staticEdges = data.edges
    .map((edge) => {
      const from = nodeById.get(edge.from)
      const to = nodeById.get(edge.to)
      if (!from || !to) return ''
      const attrs = `x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" data-id="${escapeAttribute(edge.id)}"`
      return `<line ${attrs} class="edge"></line><line ${attrs} class="edge-hit"></line>`
    })
    .join('')
  const staticNodes = data.nodes
    .map(
      (node) =>
        `<g class="node" transform="translate(${node.x} ${node.y})" data-id="${escapeAttribute(node.id)}">` +
        `<circle r="${initialCircleRadius}" fill="${escapeAttribute(colorForKind(node.kind))}"></circle>` +
        `<text x="${initialLabelX}" y="${initialLabelY}" font-size="${initialLabelSize}">${escapeText(
          shortStaticLabel(node.label),
        )}</text>` +
        `</g>`,
    )
    .join('')
  const kindPills = Object.entries(data.summary.nodeKindCounts)
    .sort()
    .map(([kind, count]) => `<span class="pill">${escapeText(kind)}: ${count}</span>`)
    .join('')
  const kindOptions = Object.entries(data.summary.nodeKindCounts)
    .sort()
    .map(([kind, count]) => `<option value="${escapeAttribute(kind)}">${escapeText(kind)} (${count})</option>`)
    .join('')
  const resultRows = data.nodes
    .slice(0, 200)
    .map(
      (node) =>
        `<button class="row" type="button" data-node-id="${escapeAttribute(node.id)}">${escapeText(
          node.label,
        )}<small>${escapeText(`${node.kind} - ${node.sourceFile || 'n/a'}`)}</small></button>`,
    )
    .join('')
  const graphWidth = Math.max(data.summary.graphWidth, 1)
  const graphHeight = Math.max(data.summary.graphHeight, 1)
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DevView Code Graph</title>
  <script src="https://unpkg.com/vis-network@9.1.6/standalone/umd/vis-network.min.js"
          integrity="sha384-Ux6phic9PEHJ38YtrijhkzyJ8yQlH8i/+buBR8s3mAZOJrP1gwyvAcIYl3GWtpX1"
          crossorigin="anonymous"></script>
  <style>
    :root { color-scheme: dark; font-family: Inter, Segoe UI, Arial, sans-serif; --graph-void:#0d1020; --graph-panel:#171b2f; --graph-panel-2:#101426; --graph-border:#2a3150; --graph-ink:#edf3ff; --graph-muted:#94a3b8; --graph-accent:#60a5fa; }
    * { box-sizing:border-box; }
    body { margin:0; height:100vh; overflow:hidden; color:var(--graph-ink); background:var(--graph-void); }
    .shell { display:grid; grid-template-columns:minmax(0,1fr) 360px; height:100vh; overflow:hidden; }
    .stage { position:relative; min-width:0; height:100vh; overflow:hidden; background:radial-gradient(circle at 35% 35%, #151b32 0, var(--graph-void) 58%); }
    .toolbar { position:absolute; top:12px; left:12px; z-index:3; display:flex; gap:6px; align-items:center; padding:6px; background:rgba(18,22,39,.9); border:1px solid var(--graph-border); border-radius:8px; backdrop-filter:blur(10px); }
    button { height:30px; min-width:32px; border:1px solid #36405f; background:#11172a; color:#dbeafe; border-radius:6px; cursor:pointer; font-weight:700; }
    button:hover { border-color:var(--graph-accent); color:#ffffff; }
    input, select { height:30px; border:1px solid #36405f; border-radius:6px; padding:0 8px; background:#0d1224; color:#e5edff; }
    #network { position:absolute; inset:0; z-index:1; width:100%; height:100%; visibility:hidden; }
    #graphSvg { width:100%; height:100%; display:block; cursor:grab; user-select:none; background:var(--graph-void); }
    body.vis-ready #graphSvg { display:none; }
    body.vis-ready #network { visibility:visible; }
    #graphSvg.dragging { cursor:grabbing; }
    .edge { stroke:#6b7893; stroke-width:1.4; vector-effect:non-scaling-stroke; opacity:.28; }
    .edge-hit { stroke:transparent; stroke-width:12; vector-effect:non-scaling-stroke; cursor:pointer; }
    .edge.selected { stroke:#f97316; stroke-width:2.4; opacity:.95; }
    .node circle { stroke:#0b1020; stroke-width:1.2; vector-effect:non-scaling-stroke; cursor:pointer; }
    .node text { fill:#dbeafe; paint-order:stroke; stroke:#0d1020; stroke-width:3px; stroke-linejoin:round; pointer-events:none; }
    .node.selected circle { stroke:#f97316; stroke-width:2.2; }
    .lane-label { fill:#94a3b8; font-weight:700; letter-spacing:0; }
    .workflow-dock { position:absolute; left:12px; right:12px; bottom:12px; z-index:3; display:flex; align-items:center; gap:8px; min-height:74px; padding:8px; overflow:auto hidden; background:rgba(18,22,39,.86); border:1px solid var(--graph-border); border-radius:8px; backdrop-filter:blur(10px); }
    .flow-step { display:grid; grid-template-columns:26px minmax(118px, 170px); align-items:center; gap:8px; height:54px; border:1px solid #303a5b; background:#10172a; color:#dbeafe; border-radius:7px; padding:6px 8px; text-align:left; flex:0 0 auto; }
    .flow-step:hover, .flow-step.active { border-color:#60a5fa; background:#18223b; }
    .flow-step-index { display:grid; place-items:center; width:24px; height:24px; border-radius:999px; background:#24314f; color:#bfdbfe; font-size:12px; }
    .flow-step-text { min-width:0; }
    .flow-step-text strong, .flow-step-text span { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .flow-step-text strong { font-size:12px; }
    .flow-step-text span { margin-top:2px; color:var(--graph-muted); font-size:11px; }
    .panel { display:flex; flex-direction:column; min-width:0; height:100vh; overflow:hidden; border-left:1px solid var(--graph-border); background:var(--graph-panel); }
    .panel header { padding:16px 16px 12px; border-bottom:1px solid var(--graph-border); }
    .panel h1 { margin:0; font-size:17px; line-height:1.25; }
    .summary { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:12px 16px; border-bottom:1px solid var(--graph-border); }
    .metric { background:var(--graph-panel-2); border:1px solid var(--graph-border); border-radius:8px; padding:10px; }
    .metric b { display:block; font-size:20px; }
    .section { flex:0 0 auto; max-height:240px; padding:14px 16px; border-bottom:1px solid var(--graph-border); overflow:auto; }
    .section.compact { max-height:220px; }
    .section h2 { margin:0 0 8px; font-size:12px; text-transform:uppercase; color:#aab6cc; letter-spacing:.05em; }
    .context-muted { color:var(--graph-muted); font-size:12px; line-height:1.35; }
    .context-title { font-size:12px; font-weight:700; line-height:1.35; }
    .context-list { display:flex; flex-direction:column; gap:4px; }
    .context-item { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:8px; width:100%; height:auto; border:0; background:transparent; color:#e5edff; border-radius:5px; padding:6px 4px; text-align:left; font-size:12px; font-weight:600; }
    .context-item:hover, .context-item.active { background:#222944; }
    .context-item small { display:block; color:var(--graph-muted); font-weight:400; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .context-count { color:#718096; font-size:11px; font-weight:600; }
    .kv { display:grid; grid-template-columns:96px minmax(0,1fr); gap:6px 10px; font-size:12px; line-height:1.35; }
    .kv .k { color:var(--graph-muted); }
    .mono { font-family:Consolas, Menlo, monospace; overflow-wrap:anywhere; }
    .list { display:flex; flex-wrap:wrap; gap:6px; }
    .pill { font-size:12px; border:1px solid var(--graph-border); background:#0f1426; color:#dbeafe; border-radius:999px; padding:4px 7px; }
    .community-list { display:flex; flex-direction:column; gap:2px; }
    .community-item { display:flex; align-items:center; gap:8px; width:100%; height:auto; border:0; background:transparent; color:#dbeafe; border-radius:5px; padding:5px 4px; text-align:left; font-size:12px; font-weight:500; }
    .community-item:hover { background:#222944; }
    .community-item.dimmed { opacity:.38; }
    .community-dot { width:11px; height:11px; border-radius:999px; flex:0 0 auto; }
    .community-name { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .community-count { color:#718096; font-size:11px; }
    .neighbor-link { display:block; border-left:3px solid #475569; border-radius:4px; margin:3px 0; padding:3px 6px; background:#11172a; color:#dbeafe; cursor:pointer; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .neighbor-link:hover { background:#222944; }
    .results { flex:1; overflow:auto; }
    .row { display:block; width:100%; text-align:left; border:0; border-bottom:1px solid var(--graph-border); border-radius:0; padding:9px 16px; height:auto; background:transparent; color:#edf3ff; font-weight:500; }
    .row:hover { background:#222944; }
    .row small { display:block; color:var(--graph-muted); font-weight:400; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  </style>
</head>
<body>
  <div class="shell" data-artifact-role="${HTML_ROLE}">
    <main class="stage">
      <div class="toolbar" aria-label="Graph controls">
        <button id="zoomOut" title="Zoom out">-</button>
        <button id="zoomIn" title="Zoom in">+</button>
        <button id="fit" title="Fit graph">Fit</button>
        <button id="reset" title="Reset zoom">1:1</button>
        <input id="search" type="search" placeholder="Search nodes">
        <select id="kindFilter" title="Node kind filter"><option value="">All kinds</option>${kindOptions}</select>
      </div>
      <div id="network" aria-label="DevView force-directed code graph"></div>
      <svg id="graphSvg" role="img" aria-label="DevView code graph" viewBox="0 0 ${graphWidth} ${graphHeight}" preserveAspectRatio="xMidYMin meet">
        <g id="graphRoot">
          <g id="edgeLayer">${staticEdges}</g>
          <g id="nodeLayer">${staticNodes}</g>
        </g>
      </svg>
      <div id="workflowDock" class="workflow-dock" aria-label="DevView work-to-subgraph flow"></div>
    </main>
    <aside class="panel">
      <header>
        <h1>DevView Code Graph</h1>
        <div class="mono" id="sourcePath">${escapeText(data.sourceCodeSubgraph.path)}</div>
      </header>
      <section class="summary">
        <div class="metric"><b id="nodeCount">${data.summary.nodeCount}</b><span>nodes</span></div>
        <div class="metric"><b id="edgeCount">${data.summary.edgeCount}</b><span>edges</span></div>
      </section>
      <section class="section">
        <h2>Selection Details</h2>
        <div id="selectionDetails" class="kv"><span class="k">Status</span><span>Click a node or edge.</span></div>
      </section>
      <section class="section compact">
        <h2>Task Explorer</h2>
        <div id="currentRequest" class="context-muted">No DevView graph data supplied.</div>
        <div id="workHistoryList" class="context-list" style="margin-top:8px"></div>
      </section>
      <section class="section compact">
        <h2>View Trees</h2>
        <div id="viewTreeList" class="context-list"></div>
      </section>
      <section class="section compact">
        <h2>SubGraphs</h2>
        <div id="subgraphList" class="context-list"></div>
      </section>
      <section class="section">
        <h2 id="listTitle">Communities</h2>
        <div id="kindList" class="list">${kindPills}</div>
      </section>
      <section class="results" id="results">${resultRows}</section>
    </aside>
  </div>
  <script id="graph-data" type="application/json">${json}</script>
  <script>
    const data = JSON.parse(document.getElementById('graph-data').textContent);
    const svg = document.getElementById('graphSvg');
    const ns = 'http://www.w3.org/2000/svg';
    const nodeById = new Map(data.nodes.map(node => [node.id, node]));
    let scale = 1;
    let tx = 0;
    let ty = 0;
    let selected = null;
    let dragging = false;
    let last = null;
    let network = null;
    let nodesDS = null;
    let edgesDS = null;
    const hiddenCommunities = new Set();
    const communityColors = ['#4E79A7','#F28E2B','#E15759','#76B7B2','#59A14F','#EDC948','#B07AA1','#FF9DA7','#9C755F','#BAB0AC','#60A5FA','#34D399','#F472B6','#A78BFA','#2DD4BF','#F87171','#84CC16','#38BDF8'];
    const viewport = { width: data.summary.graphWidth, height: data.summary.graphHeight };
    const root = document.getElementById('graphRoot');
    svg.setAttribute('viewBox', '0 0 1200 800');

    function init() {
      document.getElementById('sourcePath').textContent = data.sourceCodeSubgraph.path;
      document.getElementById('nodeCount').textContent = data.summary.nodeCount;
      document.getElementById('edgeCount').textContent = data.summary.edgeCount;
      renderFilters();
      renderResults(data.nodes.slice(0, 200));
      renderDevViewContext();
      if (!initNetwork()) {
        attachGraphInteractions();
        fitGraph();
      }
    }
    function initNetwork() {
      if (!window.vis || !window.vis.Network || !window.vis.DataSet) return false;
      const container = document.getElementById('network');
      const communities = buildCommunities();
      const colorByCommunity = new Map(communities.map((community, index) => [community.key, communityColors[index % communityColors.length]]));
      nodesDS = new vis.DataSet(data.nodes.map(node => {
        const community = communityKey(node);
        const color = colorByCommunity.get(community) || '#60A5FA';
        const size = Math.max(7, Math.min(26, 7 + Math.sqrt(Math.max(node.degree || 0, 1)) * 1.8));
        return {
          id: node.id,
          label: node.label,
          title: node.label,
          group: community,
          size,
          color: { background: color, border: color, highlight: { background: '#ffffff', border: color } },
          font: { size: 0, color: '#dbeafe' },
          _community: community,
          _communityLabel: communityLabel(node),
          _kind: node.kind,
          _sourceFile: node.sourceFile,
          _degree: node.degree,
        };
      }));
      edgesDS = new vis.DataSet(data.edges.map((edge, index) => ({
        id: edge.id || 'edge-' + index,
        from: edge.from,
        to: edge.to,
        title: edge.kind,
        label: '',
        width: edge.kind === 'calls' ? 1.5 : 0.85,
        color: { color: edgeColor(edge.kind), opacity: edge.kind === 'calls' ? 0.42 : 0.25, highlight: '#f97316' },
        smooth: { type: 'continuous', roundness: 0.2 },
        _kind: edge.kind,
      })));
      network = new vis.Network(container, { nodes: nodesDS, edges: edgesDS }, {
        autoResize: true,
        layout: {
          improvedLayout: false,
          randomSeed: 7,
        },
        physics: {
          enabled: true,
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -64,
            centralGravity: 0.006,
            springLength: 120,
            springConstant: 0.08,
            damping: 0.42,
            avoidOverlap: 0.75,
          },
          stabilization: { iterations: 220, fit: true },
        },
        interaction: {
          hover: true,
          tooltipDelay: 90,
          hideEdgesOnDrag: true,
          navigationButtons: false,
          keyboard: false,
        },
        nodes: { shape: 'dot', borderWidth: 1.4 },
        edges: { selectionWidth: 3 },
      });
      network.once('stabilizationIterationsDone', () => {
        network.setOptions({ physics: { enabled: false } });
        network.fit({ animation: false });
      });
      network.on('click', params => {
        if (params.nodes.length > 0) {
          showDetails('node', nodeById.get(params.nodes[0]));
          return;
        }
        if (params.edges.length > 0) {
          showDetails('edge', data.edges.find(edge => edge.id === params.edges[0]));
          return;
        }
        showDetails('empty', { id:'Click a node or edge.' });
      });
      network.on('hoverNode', () => { container.style.cursor = 'pointer'; });
      network.on('blurNode', () => { container.style.cursor = 'default'; });
      renderCommunityLegend(communities, colorByCommunity);
      document.body.classList.add('vis-ready');
      requestAnimationFrame(() => network.fit({ animation: false }));
      return true;
    }
    function buildCommunities() {
      const counts = new Map();
      data.nodes.forEach(node => counts.set(communityKey(node), (counts.get(communityKey(node)) || 0) + 1));
      return Array.from(counts.entries())
        .map(([key, count]) => ({ key, label: communityLabelFromKey(key), count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    }
    function renderCommunityLegend(communities, colorByCommunity) {
      document.getElementById('listTitle').textContent = 'Communities';
      const kindList = document.getElementById('kindList');
      kindList.className = 'community-list';
      kindList.innerHTML = '';
      communities.forEach(community => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'community-item';
        row.innerHTML =
          '<span class="community-dot" style="background:' + escapeHtml(colorByCommunity.get(community.key)) + '"></span>' +
          '<span class="community-name">' + escapeHtml(community.label) + '</span>' +
          '<span class="community-count">' + community.count + '</span>';
        row.addEventListener('click', () => {
          if (hiddenCommunities.has(community.key)) {
            hiddenCommunities.delete(community.key);
            row.classList.remove('dimmed');
          } else {
            hiddenCommunities.add(community.key);
            row.classList.add('dimmed');
          }
          nodesDS.update(data.nodes.filter(node => communityKey(node) === community.key).map(node => ({
            id: node.id,
            hidden: hiddenCommunities.has(community.key),
          })));
        });
        kindList.appendChild(row);
      });
    }
    function renderDevViewContext() {
      const context = data.devviewContext;
      const workflowDock = document.getElementById('workflowDock');
      const currentRequest = document.getElementById('currentRequest');
      const workHistoryList = document.getElementById('workHistoryList');
      const viewTreeList = document.getElementById('viewTreeList');
      const subgraphList = document.getElementById('subgraphList');
      if (!context) {
        const fallbackSteps = [
          { index: 1, id: 'flow.code-subgraph', label: '1 Code facts', phase: 'validated source fact', output: data.summary.nodeCount + ' nodes / ' + data.summary.edgeCount + ' edges' },
          { index: 2, id: 'flow.visualize', label: '2 Visualize', phase: 'Graphify-style force view', output: 'interactive HTML only' },
          { index: 3, id: 'flow.select-symbol', label: '3 Select', phase: 'node / edge inspection', output: 'selection details' },
          { index: 4, id: 'flow.follow-up', label: '4 DevView slice', phase: 'attach task graph data for View Tree/SubGraph flow', output: 'optional --devview-graph-data' },
        ];
        workflowDock.innerHTML = fallbackSteps.map(step => workflowStepButton(step)).join('');
        currentRequest.innerHTML = '<div class="context-title">Code graph source fact</div><div>Attach --devview-graph-data to show task selection, View Tree derivation, and bounded SubGraph extraction.</div>';
        workHistoryList.innerHTML = '';
        viewTreeList.innerHTML = '<span class="context-muted">No task View Tree context supplied.</span>';
        subgraphList.innerHTML = '<span class="context-muted">No selected SubGraph context supplied.</span>';
        bindContextButtons();
        return;
      }
      const requestParts = [
        context.userRequest ? '<div class="context-title">' + escapeHtml(context.userRequest) + '</div>' : '',
        context.targetSlice ? '<div>Target: ' + escapeHtml(context.targetSlice) + '</div>' : '',
        context.writeBoundary ? '<div>Boundary: ' + escapeHtml(context.writeBoundary) + '</div>' : '',
        context.path ? '<div class="mono">' + escapeHtml(context.path) + '</div>' : '',
      ].filter(Boolean);
      currentRequest.innerHTML = requestParts.join('') || '<span class="context-muted">DevView graph context supplied.</span>';
      workHistoryList.innerHTML = (context.workHistory || []).slice(0, 8).map(entry =>
        '<button class="context-item" data-context-kind="work" data-context-id="' + escapeHtml(entry.recordId || entry.id || entry.label || '') + '">' +
        '<span>' + escapeHtml(entry.label || entry.recordId || 'work') + '<small>' + escapeHtml(entry.status || entry.activeCodeState || 'work history') + '</small></span>' +
        '<span class="context-count">' + escapeHtml(entry.index || '') + '</span></button>'
      ).join('');
      viewTreeList.innerHTML = (context.trees || []).map(tree =>
        '<button class="context-item" data-context-kind="tree" data-context-id="' + escapeHtml(tree.id || '') + '">' +
        '<span>' + escapeHtml(tree.label || tree.id || 'tree') + '<small>' + escapeHtml(tree.viewpoint || 'viewpoint tree') + '</small></span>' +
        '<span class="context-count">' + ((tree.nodeIds || []).length || 0) + '/' + ((tree.edgeIds || []).length || 0) + '</span></button>'
      ).join('') || '<span class="context-muted">No View Trees recorded.</span>';
      subgraphList.innerHTML = (context.subgraphs || []).map(subgraph =>
        '<button class="context-item" data-context-kind="subgraph" data-context-id="' + escapeHtml(subgraph.id || '') + '">' +
        '<span>' + escapeHtml(subgraph.label || subgraph.id || 'subgraph') + '<small>' + escapeHtml(subgraph.taskType || 'bounded subgraph') + '</small></span>' +
        '<span class="context-count">' + ((subgraph.nodeIds || []).length || 0) + '/' + ((subgraph.edgeIds || []).length || 0) + '</span></button>'
      ).join('') || '<span class="context-muted">No SubGraphs recorded.</span>';
      workflowDock.innerHTML = (context.workflowSteps || []).map(step => workflowStepButton(step)).join('');
      bindContextButtons();
    }
    function workflowStepButton(step) {
      return '<button class="flow-step" data-context-kind="workflow" data-context-id="' + escapeHtml(step.id || '') + '">' +
        '<span class="flow-step-index">' + escapeHtml(step.index || '?') + '</span>' +
        '<span class="flow-step-text"><strong>' + escapeHtml(step.label || step.step || 'Flow') + '</strong><span>' + escapeHtml(step.phase || step.status || step.output || 'read-only step') + '</span></span>' +
        '</button>';
    }
    function bindContextButtons() {
      document.querySelectorAll('[data-context-kind]').forEach(button => {
        button.addEventListener('click', () => {
          document.querySelectorAll('[data-context-kind].active').forEach(entry => entry.classList.remove('active'));
          button.classList.add('active');
          showContextDetails(button.getAttribute('data-context-kind'), button.getAttribute('data-context-id'));
        });
      });
    }
    function showContextDetails(kind, id) {
      const context = data.devviewContext;
      if (!context) {
        showDetails('context', { title: 'DevView flow context', rows: [['Status', 'No --devview-graph-data source supplied.'], ['Output', 'Code graph HTML remains interactive.']] });
        return;
      }
      const collections = {
        workflow: context.workflowSteps || [],
        tree: context.trees || [],
        subgraph: context.subgraphs || [],
        work: context.workHistory || [],
      };
      const item = (collections[kind] || []).find(entry => String(entry.id || entry.recordId || entry.label || '') === String(id));
      if (!item) return;
      const rows = kind === 'workflow'
        ? [['Type', 'workflow step'], ['Label', item.label], ['Phase', item.phase], ['Summary', item.summary], ['Output', item.output], ['Nodes', (item.nodeIds || []).length], ['Edges', (item.edgeIds || []).length], ['Authority', item.authority]]
        : kind === 'tree'
          ? [['Type', 'View Tree'], ['Id', item.id], ['Label', item.label], ['Viewpoint', item.viewpoint], ['Nodes', (item.nodeIds || []).length], ['Edges', (item.edgeIds || []).length], ['Pack sections', (item.packSections || []).join(', ')]]
          : kind === 'subgraph'
            ? [['Type', 'SubGraph'], ['Id', item.id], ['Label', item.label], ['Task type', item.taskType], ['Start node', item.startNodeId], ['Nodes', (item.nodeIds || []).length], ['Edges', (item.edgeIds || []).length], ['Allowed files', (item.allowedFiles || []).join(', ')]]
            : [['Type', 'Work history'], ['Record', item.recordId], ['Label', item.label], ['Status', item.status], ['Code state', item.activeCodeState], ['Record path', item.recordPath]];
      showDetails('context', { title: item.label || item.id || id, rows });
    }
    function communityKey(node) {
      const source = node.sourceFile || '';
      const parts = source.split(/[\\\\/]/).filter(Boolean);
      const modulePart = parts.find(part => part.startsWith('WindowsUtility.'));
      if (modulePart) return modulePart;
      if (parts.length > 1) return parts.slice(0, Math.min(parts.length, 2)).join('/');
      return node.kind || 'unknown';
    }
    function communityLabel(node) { return communityLabelFromKey(communityKey(node)); }
    function communityLabelFromKey(key) {
      return String(key || 'unknown').replace(/^graphify-windowsutility-input\\//, '').replace(/^src\\//, '');
    }
    function edgeColor(kind) {
      if (kind === 'calls') return '#f97316';
      if (kind === 'imports') return '#60a5fa';
      if (kind === 'inherits' || kind === 'implements') return '#a78bfa';
      if (kind === 'contains') return '#64748b';
      if (kind === 'references') return '#94a3b8';
      return '#6b7280';
    }
    function renderFilters() {
      const kindList = document.getElementById('kindList');
      const filter = document.getElementById('kindFilter');
      kindList.innerHTML = '';
      filter.innerHTML = '<option value="">All kinds</option>';
      Object.entries(data.summary.nodeKindCounts).sort().forEach(([kind, count]) => {
        const option = document.createElement('option');
        option.value = kind;
        option.textContent = kind + ' (' + count + ')';
        filter.appendChild(option);
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = kind + ': ' + count;
        kindList.appendChild(pill);
      });
    }
    function attachGraphInteractions() {
      document.querySelectorAll('.edge-hit').forEach(hit => {
        hit.addEventListener('click', event => { event.stopPropagation(); selectEdge(hit.getAttribute('data-id')); });
      });
      document.querySelectorAll('.node').forEach(group => {
        group.addEventListener('click', event => { event.stopPropagation(); selectNode(group.getAttribute('data-id')); });
      });
    }
    function applyTransform() {
      root.setAttribute('transform', 'translate(' + tx + ' ' + ty + ') scale(' + scale + ')');
      document.querySelectorAll('.node circle').forEach(circle => circle.setAttribute('r', String(7 / scale)));
      document.querySelectorAll('.node text').forEach(label => {
        label.setAttribute('font-size', String(11 / scale));
        label.setAttribute('x', String(11 / scale));
        label.setAttribute('y', String(4 / scale));
      });
    }
    function zoomAt(factor, cx = 600, cy = 400) {
      if (network) {
        const nextScale = Math.max(0.08, Math.min(4, network.getScale() * factor));
        network.moveTo({ scale: nextScale, animation: { duration: 140, easingFunction: 'easeInOutQuad' } });
        return;
      }
      const before = screenToGraph(cx, cy);
      scale = Math.max(0.03, Math.min(8, scale * factor));
      tx = cx - before.x * scale;
      ty = cy - before.y * scale;
      applyTransform();
    }
    function screenToGraph(x, y) {
      const point = svg.createSVGPoint();
      point.x = x;
      point.y = y;
      const ctm = svg.getScreenCTM();
      const svgPoint = ctm ? point.matrixTransform(ctm.inverse()) : { x, y };
      return { x: (svgPoint.x - tx) / scale, y: (svgPoint.y - ty) / scale };
    }
    function fitGraph() {
      if (network) {
        network.fit({ animation: { duration: 180, easingFunction: 'easeInOutQuad' } });
        return;
      }
      const box = svg.getBoundingClientRect();
      const sx = box.width / Math.max(viewport.width, 1);
      const sy = box.height / Math.max(viewport.height, 1);
      scale = Math.max(0.03, Math.min(sx, sy) * 0.92);
      tx = (box.width - viewport.width * scale) / 2;
      ty = 24;
      applyTransform();
    }
    function selectNode(id) {
      if (!id) return;
      selected = { type: 'node', id };
      if (network) {
        network.focus(id, { scale: 1.45, animation: { duration: 200, easingFunction: 'easeInOutQuad' } });
        network.selectNodes([id]);
        showDetails('node', nodeById.get(id));
        return;
      }
      document.querySelectorAll('.selected').forEach(entry => entry.classList.remove('selected'));
      document.querySelector('.node[data-id="' + cssEscape(id) + '"]')?.classList.add('selected');
      showDetails('node', nodeById.get(id));
    }
    function selectEdge(id) {
      if (!id) return;
      selected = { type: 'edge', id };
      const edge = data.edges.find(entry => entry.id === id);
      if (network) {
        network.selectEdges([id]);
        showDetails('edge', edge);
        return;
      }
      document.querySelectorAll('.selected').forEach(entry => entry.classList.remove('selected'));
      document.querySelectorAll('.edge[data-id="' + cssEscape(id) + '"]').forEach(entry => entry.classList.add('selected'));
      showDetails('edge', edge);
    }
    function showDetails(type, item) {
      const details = document.getElementById('selectionDetails');
      if (!item) return;
      if (type === 'empty') {
        details.innerHTML = '<span class="k">Status</span><span>Click a node or edge.</span>';
        return;
      }
      if (type === 'context') {
        const rows = item.rows || [];
        details.innerHTML =
          '<span class="k">Context</span><span class="mono">' + escapeHtml(item.title || 'DevView context') + '</span>' +
          rows.map(([k,v]) => '<span class="k">' + escapeHtml(k) + '</span><span class="mono">' + escapeHtml(v ?? 'n/a') + '</span>').join('');
        return;
      }
      const rows = type === 'node'
        ? [
            ['Type', 'node'], ['Id', item.id], ['Label', item.label], ['Kind', item.kind], ['Degree', item.degree],
            ['Community', communityLabel(item)],
            ['Source file', item.sourceFile], ['Location', formatLocation(item.sourceLocation) || item.sourceLocationStatus],
            ['Confidence', item.confidence], ['Extractor', item.extractor], ['Graphify id', item.sourceGraphifyNodeId],
          ]
        : [
            ['Type', 'edge'], ['Id', item.id], ['Relation', item.kind], ['From', item.from], ['To', item.to],
            ['Source file', item.sourceFile], ['Location', formatLocation(item.sourceLocation) || item.sourceLocationStatus],
            ['Confidence', item.confidence], ['Graphify relation', item.sourceGraphifyEdgeKind],
          ];
      let neighborHtml = '';
      if (type === 'node' && network) {
        const neighborIds = network.getConnectedNodes(item.id).slice(0, 80);
        if (neighborIds.length) {
          neighborHtml =
            '<span class="k">Neighbors</span><span>' +
            neighborIds
              .map(id => {
                const neighbor = nodeById.get(id);
                return '<span class="neighbor-link" data-node-id="' + escapeHtml(id) + '">' + escapeHtml(neighbor ? neighbor.label : id) + '</span>';
              })
              .join('') +
            '</span>';
        }
      }
      details.innerHTML = rows.map(([k,v]) => '<span class="k">' + escapeHtml(k) + '</span><span class="mono">' + escapeHtml(v ?? 'n/a') + '</span>').join('') + neighborHtml;
      details.querySelectorAll('.neighbor-link').forEach(link => {
        link.addEventListener('click', () => selectNode(link.getAttribute('data-node-id')));
      });
    }
    function renderResults(nodes) {
      const results = document.getElementById('results');
      results.innerHTML = '';
      nodes.forEach(node => {
        const row = document.createElement('button');
        row.className = 'row';
        row.innerHTML = escapeHtml(node.label) + '<small>' + escapeHtml(node.kind + ' - ' + (node.sourceFile || 'n/a')) + '</small>';
        row.addEventListener('click', () => selectNode(node.id));
        results.appendChild(row);
      });
    }
    function applySearch() {
      const query = document.getElementById('search').value.toLowerCase();
      const kind = document.getElementById('kindFilter').value;
      const matches = data.nodes.filter(node => (!kind || node.kind === kind) && (!query || (node.label + ' ' + node.id + ' ' + (node.sourceFile || '')).toLowerCase().includes(query)));
      renderResults(matches.slice(0, 300));
    }
    function shortLabel(value) { return value.length > 34 ? value.slice(0, 31) + '...' : value; }
    function formatLocation(value) { return value && typeof value === 'object' ? JSON.stringify(value) : value; }
    function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
    function cssEscape(value) { return window.CSS && CSS.escape ? CSS.escape(value) : String(value).replace(/"/g, '\\\\"'); }
    document.getElementById('zoomIn').addEventListener('click', () => zoomAt(1.25));
    document.getElementById('zoomOut').addEventListener('click', () => zoomAt(0.8));
    document.getElementById('fit').addEventListener('click', fitGraph);
    document.getElementById('reset').addEventListener('click', () => { if (network) { fitGraph(); return; } scale = 1; tx = 0; ty = 0; applyTransform(); });
    document.getElementById('search').addEventListener('input', applySearch);
    document.getElementById('kindFilter').addEventListener('change', applySearch);
    svg.addEventListener('click', () => { selected = null; document.querySelectorAll('.selected').forEach(entry => entry.classList.remove('selected')); showDetails('empty', { id:'Click a node or edge.' }); });
    svg.addEventListener('wheel', event => { event.preventDefault(); zoomAt(event.deltaY < 0 ? 1.12 : 0.89, event.clientX, event.clientY); }, { passive:false });
    svg.addEventListener('pointerdown', event => { dragging = true; last = { x:event.clientX, y:event.clientY }; svg.classList.add('dragging'); });
    window.addEventListener('pointermove', event => { if (!dragging || !last) return; tx += event.clientX - last.x; ty += event.clientY - last.y; last = { x:event.clientX, y:event.clientY }; applyTransform(); });
    window.addEventListener('pointerup', () => { dragging = false; last = null; svg.classList.remove('dragging'); });
    window.addEventListener('resize', fitGraph);
    init();
  </script>
</body>
</html>
`
}

function shortStaticLabel(value: string): string {
  return value.length > 34 ? `${value.slice(0, 31)}...` : value
}

function escapeText(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return replacements[character] ?? character
  })
}

function escapeAttribute(value: unknown): string {
  return escapeText(value)
}

function renderMarkdown(report: CodeGraphHtmlRenderReport): string {
  return [
    '# DevView Code Graph HTML Render',
    '',
    `- status: ${report.status}`,
    `- code subgraph: ${report.sourceCodeSubgraph.path ?? 'not-read'}`,
    `- nodes: ${report.htmlSummary.nodeCount}`,
    `- edges: ${report.htmlSummary.edgeCount}`,
    `- html output: ${report.writtenHtmlOutputPath ?? 'not-written'}`,
    '',
    '## Safety',
    '',
    '- graphSourceMutated: false',
    '- graphDeltaApplied: false',
    '- viewTreeGenerated: false',
    '- providerInvoked: false',
    '- networkCallMade: false',
    '- shellCommandsExecuted: false',
  ].join('\n')
}

function collectUnsafeAuthorityHits(value: unknown, prefix = ''): Array<{ field: string }> {
  const hits: Array<{ field: string }> = []
  if (Array.isArray(value)) {
    value.forEach((entry, index) => hits.push(...collectUnsafeAuthorityHits(entry, `${prefix}[${index}]`)))
    return hits
  }
  const record = asRecord(value)
  if (!record) return hits
  for (const [key, entry] of Object.entries(record)) {
    const field = prefix ? `${prefix}.${key}` : key
    if (unsafeAuthorityFields.includes(key) && entry === true) hits.push({ field })
    hits.push(...collectUnsafeAuthorityHits(entry, field))
  }
  return hits
}

function collectExecutableInstructionHits(value: unknown, prefix = ''): Array<{ field: string }> {
  const hits: Array<{ field: string }> = []
  if (Array.isArray(value)) {
    value.forEach((entry, index) => hits.push(...collectExecutableInstructionHits(entry, `${prefix}[${index}]`)))
    return hits
  }
  const record = asRecord(value)
  if (!record) return hits
  for (const [key, entry] of Object.entries(record)) {
    const field = prefix ? `${prefix}.${key}` : key
    if (executableInstructionFields.includes(key) && typeof entry === 'string' && entry.trim().length > 0) {
      hits.push({ field })
    }
    hits.push(...collectExecutableInstructionHits(entry, field))
  }
  return hits
}

function readJsonSafeSync(filePath: string): JsonRecord | null {
  try {
    const text = readFileSync(filePath, 'utf8')
    return JSON.parse(text.replace(/^\uFEFF/, '')) as JsonRecord
  } catch {
    return null
  }
}

function blocker(code: string, message: string, field?: string, filePath?: string): CodeGraphHtmlRenderFinding {
  return { severity: 'blocker', code, message, field, path: filePath }
}

function satisfied(code: string, message: string): CodeGraphHtmlRenderFinding {
  return { severity: 'satisfied', code, message }
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(root, filePath)
}

function samePath(left: string, right: string): boolean {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase()
}

function arrayOfRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter((entry): entry is JsonRecord => Boolean(asRecord(entry))) : []
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

function countBy<T>(entries: T[], select: (entry: T) => string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const entry of entries) {
    const key = select(entry)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}
