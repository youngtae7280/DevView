import { createHash } from 'node:crypto'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'
import { CodeSubgraphValidationError, validateCodeSubgraphRecord } from './code-subgraph-validation.js'

type JsonRecord = Record<string, unknown>

const REPORT_ROLE = 'devview-code-subgraph-refresh-plan-report'
const PASSED_STATUS = 'devview-code-subgraph-refresh-plan-recorded'
const BLOCKED_STATUS = 'devview-code-subgraph-refresh-plan-blocked'
const REPORT_SCOPE = 'code-subgraph-refresh-plan-report-only'
const REFRESH_PLAN_STATUS = 'planned-not-applied'
const CODE_SUBGRAPH_ROLE = 'devview-code-subgraph'
const CODE_SUBGRAPH_STATUS = 'devview-code-subgraph-supplied'
const CODE_SUBGRAPH_SCOPE = 'code-subgraph-source-fact-only'

const dependentEdgeTypes = ['imports', 'imports_from', 'calls', 'references', 'depends_on'] as const
const refreshActionTypes = [
  'reextract-file',
  'revalidate-code-subgraph',
  'recompute-impact',
  'rebuild-view-tree-symbol-context',
  'regenerate-context-pack-symbol-context',
  'review-symbol-links',
] as const

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
  'extractorExecuted',
  'nativeExtractorExecuted',
  'nativeBenchmarkExecuted',
  'benchmarkExecuted',
  'candidateExecuted',
  'filesMutated',
  'graphSourceMutated',
  'maintainabilityGraphMutationPlanned',
  'mutationApplied',
  'graphDeltaApplied',
  'viewTreeGenerated',
  'contextPackGenerated',
  'watchActivated',
  'hookInstalled',
  'hooksActivated',
  'runtimeEvidenceSatisfied',
  'evidenceAccepted',
  'equivalenceProven',
  'scopeEnforced',
  'ciEnforcementEnabled',
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
  'watchCommand',
  'hookCommand',
]

export interface CodeSubgraphRefreshPlanOptions {
  codeSubgraph?: string
  changedFiles?: string[]
  output?: string
  markdown?: string
}

export interface CodeSubgraphRefreshPlanFinding {
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
  sourceKind: 'code-subgraph'
  record: JsonRecord | null
  sha256: string | null
  byteLength: number | null
  readError: string | null
}

interface CodeNode {
  id: string
  kind: string
  label: string | null
  sourceFile: string | null
  normalizedSourceFile: string | null
  sourceLocation: unknown
  sourceLocationStatus: string | null
  confidence: string | null
}

interface CodeEdge {
  id: string
  from: string
  to: string
  edgeType: string
  sourceFile: string | null
  normalizedSourceFile: string | null
  sourceLocationStatus: string | null
  confidence: string | null
}

interface CodeGraphIndex {
  nodes: CodeNode[]
  edges: CodeEdge[]
  nodesById: Map<string, CodeNode>
  incomingByNode: Map<string, CodeEdge[]>
  outgoingByNode: Map<string, CodeEdge[]>
}

interface NormalizedChangedFile {
  input: string
  normalizedPath: string
  relativePath: string
}

interface CodeNodeSummary {
  nodeId: string
  nodeKind: string
  label: string | null
  sourceFile: string | null
  sourceLocation: unknown
  sourceLocationStatus: string | null
  confidence: string | null
  matchedChangedFiles: string[]
}

interface CodeEdgeSummary {
  edgeId: string
  edgeType: string
  from: string
  to: string
  sourceFile: string | null
  sourceLocationStatus: string | null
  confidence: string | null
  matchedChangedFiles: string[]
  affectedByNodeEndpoint: boolean
}

interface DependentCodeNodeSummary extends CodeNodeSummary {
  dependencyReasons: Array<{
    edgeId: string
    edgeType: string
    affectedNodeId: string
    direction: 'incoming'
  }>
}

interface ContainmentContextSummary extends CodeNodeSummary {
  containmentReasons: Array<{
    edgeId: string
    childNodeId: string
  }>
}

interface RefreshAction {
  actionType: (typeof refreshActionTypes)[number]
  target: string
  reason: string
  executionMode: 'future-only-not-executed'
  executed: false
}

interface RefreshAnalysis {
  changedFiles: NormalizedChangedFile[]
  unmatchedChangedFiles: string[]
  affectedCodeNodes: CodeNodeSummary[]
  affectedCodeEdges: CodeEdgeSummary[]
  dependentCodeNodes: DependentCodeNodeSummary[]
  containmentContextNodes: ContainmentContextSummary[]
  refreshActionPlan: RefreshAction[]
}

export interface CodeSubgraphRefreshPlanReport extends JsonRecord {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof PASSED_STATUS | typeof BLOCKED_STATUS
  scope: typeof REPORT_SCOPE
  reportOnly: true
  sourceFactsOnly: true
  refreshPlanStatus: typeof REFRESH_PLAN_STATUS | 'blocked'
  sourceCodeSubgraph: {
    path: string | null
    artifactRole: string | null
    status: string | null
    scope: string | null
    sha256: string | null
    byteLength: number | null
    nodeCount: number
    edgeCount: number
    nodeKinds: Record<string, number>
    edgeTypes: Record<string, number>
  }
  changedFiles: {
    total: number
    normalized: NormalizedChangedFile[]
    unmatched: string[]
  }
  affectedCodeNodes: CodeNodeSummary[]
  affectedCodeEdges: CodeEdgeSummary[]
  dependentCodeNodes: DependentCodeNodeSummary[]
  containmentContextNodes: ContainmentContextSummary[]
  staleCandidateSummary: {
    affectedNodeCount: number
    affectedEdgeCount: number
    dependentNodeCount: number
    containmentContextNodeCount: number
    unmatchedChangedFileCount: number
    nodeKinds: Record<string, number>
    edgeTypes: Record<string, number>
  }
  refreshActionPlan: RefreshAction[]
  unifiedGraphRefreshBoundary: {
    separateCodeGraphCreated: false
    watchActivated: false
    hookInstalled: false
    extractorExecuted: false
    nativeExtractorExecuted: false
    graphSourceMutated: false
    graphDeltaApplied: false
    viewTreeGenerated: false
    contextPackGenerated: false
  }
  downstreamActionPlan: string[]
  validationFindings: CodeSubgraphRefreshPlanFinding[]
  sourceArtifactDigests: Array<{
    sourceKind: LoadedArtifact['sourceKind']
    sourcePath: string
    sha256: string | null
    byteLength: number | null
  }>
  graphifyExecuted: false
  astExtractorExecuted: false
  extractorExecuted: false
  nativeExtractorExecuted: false
  providerInvoked: false
  networkCallMade: false
  apiCallMade: false
  shellCommandsExecuted: false
  extensionExecutionAllowed: false
  watchActivated: false
  hookInstalled: false
  graphSourceMutated: false
  graphDeltaApplied: false
  viewTreeGenerated: false
  contextPackGenerated: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  rbacEnforced: false
  permissionVerified: false
  cryptographicSignatureVerified: false
  enterpriseGateActivated: false
  writtenOutputPath?: string
  writtenMarkdownPath?: string
}

export class CodeSubgraphRefreshPlanError extends Error {
  readonly report: CodeSubgraphRefreshPlanReport

  constructor(report: CodeSubgraphRefreshPlanReport) {
    super('Code subgraph refresh plan is blocked.')
    this.report = report
  }
}

export async function planCodeSubgraphRefreshFile(
  root: string,
  options: CodeSubgraphRefreshPlanOptions,
): Promise<CodeSubgraphRefreshPlanReport> {
  validateRequiredOptions(options)
  const sourcePaths = sourceInputPaths(root, options)
  await assertOutputAuthority(root, sourcePaths, options)

  const codeSubgraph = await loadArtifact(root, options.codeSubgraph ?? '', 'code-subgraph')
  const findings: CodeSubgraphRefreshPlanFinding[] = []
  validateLoadedArtifact(codeSubgraph, findings)
  if (codeSubgraph.record) {
    validateCodeSubgraphSource(root, codeSubgraph, findings)
  }

  const changedFiles = normalizeChangedFiles(root, options.changedFiles ?? [], findings)
  const index = buildCodeGraphIndex(codeSubgraph.record)
  const analysis =
    findings.some((finding) => finding.severity === 'blocker') || !codeSubgraph.record
      ? emptyAnalysis(changedFiles)
      : analyzeRefresh(changedFiles, index, findings)

  if (findings.every((finding) => finding.severity !== 'blocker')) {
    findings.push({
      severity: 'satisfied',
      code: 'CODE_SUBGRAPH_REFRESH_PLAN_RECORDED',
      message:
        'Code subgraph refresh was planned from explicit changed files without extraction, watch activation, hooks, or graph mutation.',
      path: options.output ? relativePath(root, resolveRepoPath(root, options.output)) : undefined,
    })
  }

  const blocked = findings.some((finding) => finding.severity === 'blocker')
  const report = buildReport(codeSubgraph, analysis, findings, blocked)
  if (blocked) {
    throw new CodeSubgraphRefreshPlanError(report)
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

function validateRequiredOptions(options: CodeSubgraphRefreshPlanOptions): void {
  if (!options.codeSubgraph) {
    throw new Error('graph plan-code-subgraph-refresh requires --code-subgraph <devview-code-subgraph.json>.')
  }
  if (!options.changedFiles || normalizeChangedFileInputs(options.changedFiles).length === 0) {
    throw new Error('graph plan-code-subgraph-refresh requires at least one --changed-file <path>.')
  }
  if (!options.output) {
    throw new Error('graph plan-code-subgraph-refresh requires --output <code-subgraph-refresh-plan.json>.')
  }
}

async function loadArtifact(
  root: string,
  requestedPath: string,
  sourceKind: LoadedArtifact['sourceKind'],
): Promise<LoadedArtifact> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  try {
    const bytes = await readFile(resolvedPath)
    return {
      requestedPath,
      resolvedPath,
      relativePath: relativePath(root, resolvedPath),
      sourceKind,
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
      sourceKind,
      record: null,
      sha256: null,
      byteLength: null,
      readError: error instanceof Error ? error.message : String(error),
    }
  }
}

function validateLoadedArtifact(artifact: LoadedArtifact, findings: CodeSubgraphRefreshPlanFinding[]): void {
  if (!artifact.record) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_REFRESH_SOURCE_READ_FAILED',
        `Could not read ${artifact.sourceKind}: ${artifact.readError}`,
        artifact.sourceKind,
        artifact.relativePath,
      ),
    )
    return
  }
  for (const hit of collectUnsafeAuthorityHits(artifact.record)) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_REFRESH_UNSAFE_AUTHORITY_FLAG',
        `${artifact.relativePath} contains unsafe report-only flag ${hit.field}: true.`,
        hit.field,
        artifact.relativePath,
      ),
    )
  }
  for (const hit of collectExecutableInstructionHits(artifact.record)) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_REFRESH_EXECUTABLE_INSTRUCTION_DECLARED',
        `${artifact.relativePath} contains executable/provider/network/watch/hook instruction field ${hit.field}.`,
        hit.field,
        artifact.relativePath,
      ),
    )
  }
}

function validateCodeSubgraphSource(
  root: string,
  source: LoadedArtifact,
  findings: CodeSubgraphRefreshPlanFinding[],
): void {
  const record = source.record
  if (!record) return
  if (record.artifactRole !== CODE_SUBGRAPH_ROLE) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_REFRESH_CODE_SUBGRAPH_ROLE_INVALID',
        `Code subgraph artifactRole must be ${CODE_SUBGRAPH_ROLE}.`,
        'artifactRole',
        source.relativePath,
      ),
    )
  }
  if (record.status !== CODE_SUBGRAPH_STATUS) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_REFRESH_CODE_SUBGRAPH_STATUS_INVALID',
        `Code subgraph status must be ${CODE_SUBGRAPH_STATUS}.`,
        'status',
        source.relativePath,
      ),
    )
  }
  if ((record.scope ?? record.codeSubgraphScope) !== CODE_SUBGRAPH_SCOPE) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_REFRESH_CODE_SUBGRAPH_SCOPE_INVALID',
        `Code subgraph scope must be ${CODE_SUBGRAPH_SCOPE}.`,
        'scope',
        source.relativePath,
      ),
    )
  }
  try {
    validateCodeSubgraphRecord(root, source.requestedPath, record)
  } catch (error) {
    if (error instanceof CodeSubgraphValidationError) {
      for (const finding of error.report.validationFindings.filter((entry) => entry.severity === 'blocker')) {
        findings.push(
          blocker(
            'CODE_SUBGRAPH_REFRESH_CODE_SUBGRAPH_VALIDATION_FAILED',
            finding.message,
            finding.field,
            finding.path ?? source.relativePath,
          ),
        )
      }
    } else {
      findings.push(
        blocker(
          'CODE_SUBGRAPH_REFRESH_CODE_SUBGRAPH_VALIDATION_FAILED',
          error instanceof Error ? error.message : String(error),
          'codeSubgraph',
          source.relativePath,
        ),
      )
    }
  }
}

function normalizeChangedFiles(
  root: string,
  values: string[],
  findings: CodeSubgraphRefreshPlanFinding[],
): NormalizedChangedFile[] {
  const normalized = new Map<string, NormalizedChangedFile>()
  for (const input of normalizeChangedFileInputs(values)) {
    const resolved = resolveRepoPath(root, input)
    const relative = relativePath(root, resolved)
    if (path.isAbsolute(input) && isOutsideRoot(relative)) {
      findings.push(
        blocker(
          'CODE_SUBGRAPH_REFRESH_CHANGED_FILE_OUTSIDE_ROOT',
          `Changed file ${input} resolves outside the repository root.`,
          'changedFile',
        ),
      )
      continue
    }
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      findings.push(
        blocker(
          'CODE_SUBGRAPH_REFRESH_CHANGED_FILE_OUTSIDE_ROOT',
          `Changed file ${input} resolves outside the repository root.`,
          'changedFile',
        ),
      )
      continue
    }
    const normalizedPath = normalizeSourceFile(relative)
    normalized.set(normalizedPath, {
      input,
      normalizedPath,
      relativePath: normalizeDisplayPath(relative),
    })
  }
  return [...normalized.values()].sort((left, right) => left.normalizedPath.localeCompare(right.normalizedPath))
}

function buildCodeGraphIndex(record: JsonRecord | null): CodeGraphIndex {
  const nodes = arrayRecords(record?.nodes)
    .map(toCodeNode)
    .filter((node): node is CodeNode => Boolean(node))
  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges = arrayRecords(record?.edges)
    .map(toCodeEdge)
    .filter((edge): edge is CodeEdge => edge !== null && nodeIds.has(edge.from) && nodeIds.has(edge.to))
  const nodesById = new Map(nodes.map((node) => [node.id, node] as const))
  const incomingByNode = new Map<string, CodeEdge[]>()
  const outgoingByNode = new Map<string, CodeEdge[]>()
  for (const edge of edges) {
    const incoming = incomingByNode.get(edge.to) ?? []
    incoming.push(edge)
    incomingByNode.set(edge.to, incoming)
    const outgoing = outgoingByNode.get(edge.from) ?? []
    outgoing.push(edge)
    outgoingByNode.set(edge.from, outgoing)
  }
  for (const list of [...incomingByNode.values(), ...outgoingByNode.values()]) {
    list.sort(compareEdges)
  }
  return { nodes, edges, nodesById, incomingByNode, outgoingByNode }
}

function toCodeNode(node: JsonRecord): CodeNode | null {
  const id = stringValue(node.id ?? node.nodeId)
  const kind = stringValue(node.kind ?? node.nodeKind)
  if (!id || !kind) return null
  const sourceFile = stringValue(node.sourceFile ?? node.source_file)
  return {
    id,
    kind,
    label: stringValue(node.label ?? node.name),
    sourceFile,
    normalizedSourceFile: sourceFile ? normalizeSourceFile(sourceFile) : null,
    sourceLocation: node.sourceLocation ?? node.source_location ?? null,
    sourceLocationStatus: stringValue(node.sourceLocationStatus),
    confidence: stringValue(node.confidence),
  }
}

function toCodeEdge(edge: JsonRecord): CodeEdge | null {
  const id = stringValue(edge.id ?? edge.edgeId) ?? stableEdgeId(edge)
  const from = stringValue(edge.from ?? edge.source ?? edge.sourceNodeId)
  const to = stringValue(edge.to ?? edge.target ?? edge.targetNodeId)
  const edgeType = stringValue(edge.kind ?? edge.edgeType ?? edge.relation ?? edge.type)
  if (!id || !from || !to || !edgeType) return null
  const sourceFile = stringValue(edge.sourceFile ?? edge.source_file)
  return {
    id,
    from,
    to,
    edgeType,
    sourceFile,
    normalizedSourceFile: sourceFile ? normalizeSourceFile(sourceFile) : null,
    sourceLocationStatus: stringValue(edge.sourceLocationStatus),
    confidence: stringValue(edge.confidence),
  }
}

function analyzeRefresh(
  changedFiles: NormalizedChangedFile[],
  index: CodeGraphIndex,
  findings: CodeSubgraphRefreshPlanFinding[],
): RefreshAnalysis {
  const changedFileSet = new Set(changedFiles.map((entry) => entry.normalizedPath))
  const affectedNodes = index.nodes.filter(
    (node) => node.normalizedSourceFile !== null && changedFileSet.has(node.normalizedSourceFile),
  )
  const affectedNodeIds = new Set(affectedNodes.map((node) => node.id))
  const matchedChangedFiles = new Set(affectedNodes.flatMap((node) => node.normalizedSourceFile ?? []))
  const unmatchedChangedFiles = changedFiles
    .filter((entry) => !matchedChangedFiles.has(entry.normalizedPath))
    .map((entry) => entry.relativePath)
    .sort((left, right) => left.localeCompare(right))

  for (const file of unmatchedChangedFiles) {
    findings.push(
      warning(
        'CODE_SUBGRAPH_REFRESH_CHANGED_FILE_UNMATCHED',
        `Changed file ${file} did not match any code subgraph node sourceFile.`,
        'changedFile',
      ),
    )
  }
  if (affectedNodes.length === 0) {
    findings.push(
      warning(
        'CODE_SUBGRAPH_REFRESH_NO_AFFECTED_NODES',
        'No code subgraph nodes matched the supplied changed files; refresh plan records no stale code nodes.',
        'changedFile',
      ),
    )
  }

  const affectedEdges = index.edges.filter(
    (edge) =>
      (edge.normalizedSourceFile !== null && changedFileSet.has(edge.normalizedSourceFile)) ||
      affectedNodeIds.has(edge.from) ||
      affectedNodeIds.has(edge.to),
  )
  const dependentNodes = dependentCodeNodes(affectedNodeIds, index)
  const containmentContext = containmentContextNodes(
    new Set([...affectedNodeIds, ...dependentNodes.map((node) => node.id)]),
    index,
  )

  return {
    changedFiles,
    unmatchedChangedFiles,
    affectedCodeNodes: affectedNodes.map((node) => summarizeNode(node, changedFilesForNode(node, changedFiles))),
    affectedCodeEdges: affectedEdges.map((edge) =>
      summarizeEdge(edge, changedFilesForEdge(edge, changedFiles), affectedNodeIds),
    ),
    dependentCodeNodes: dependentNodes.map((node) => summarizeDependentNode(node, index, affectedNodeIds)),
    containmentContextNodes: containmentContext.map((node) => summarizeContainmentNode(node, index, affectedNodeIds)),
    refreshActionPlan: buildRefreshActions(changedFiles, affectedNodes, affectedEdges, dependentNodes),
  }
}

function dependentCodeNodes(affectedNodeIds: Set<string>, index: CodeGraphIndex): CodeNode[] {
  const dependentIds = new Set<string>()
  for (const affectedNodeId of affectedNodeIds) {
    for (const edge of index.incomingByNode.get(affectedNodeId) ?? []) {
      if (includesString(dependentEdgeTypes, edge.edgeType) && !affectedNodeIds.has(edge.from)) {
        dependentIds.add(edge.from)
      }
    }
  }
  return [...dependentIds]
    .map((id) => index.nodesById.get(id))
    .filter((node): node is CodeNode => Boolean(node))
    .sort(compareNodes)
}

function containmentContextNodes(targetNodeIds: Set<string>, index: CodeGraphIndex): CodeNode[] {
  const contextIds = new Set<string>()
  for (const targetNodeId of targetNodeIds) {
    for (const edge of index.incomingByNode.get(targetNodeId) ?? []) {
      if (edge.edgeType === 'contains') {
        contextIds.add(edge.from)
      }
    }
  }
  return [...contextIds]
    .map((id) => index.nodesById.get(id))
    .filter((node): node is CodeNode => Boolean(node))
    .sort(compareNodes)
}

function summarizeNode(node: CodeNode, matchedChangedFiles: string[]): CodeNodeSummary {
  return {
    nodeId: node.id,
    nodeKind: node.kind,
    label: node.label,
    sourceFile: node.sourceFile,
    sourceLocation: node.sourceLocation,
    sourceLocationStatus: node.sourceLocationStatus,
    confidence: node.confidence,
    matchedChangedFiles,
  }
}

function summarizeEdge(edge: CodeEdge, matchedChangedFiles: string[], affectedNodeIds: Set<string>): CodeEdgeSummary {
  return {
    edgeId: edge.id,
    edgeType: edge.edgeType,
    from: edge.from,
    to: edge.to,
    sourceFile: edge.sourceFile,
    sourceLocationStatus: edge.sourceLocationStatus,
    confidence: edge.confidence,
    matchedChangedFiles,
    affectedByNodeEndpoint: affectedNodeIds.has(edge.from) || affectedNodeIds.has(edge.to),
  }
}

function summarizeDependentNode(
  node: CodeNode,
  index: CodeGraphIndex,
  affectedNodeIds: Set<string>,
): DependentCodeNodeSummary {
  const dependencyReasons = (index.outgoingByNode.get(node.id) ?? [])
    .filter((edge) => affectedNodeIds.has(edge.to) && includesString(dependentEdgeTypes, edge.edgeType))
    .map((edge) => ({
      edgeId: edge.id,
      edgeType: edge.edgeType,
      affectedNodeId: edge.to,
      direction: 'incoming' as const,
    }))
    .sort((left, right) => left.edgeId.localeCompare(right.edgeId))
  return { ...summarizeNode(node, []), dependencyReasons }
}

function summarizeContainmentNode(
  node: CodeNode,
  index: CodeGraphIndex,
  targetNodeIds: Set<string>,
): ContainmentContextSummary {
  const containmentReasons = (index.outgoingByNode.get(node.id) ?? [])
    .filter((edge) => edge.edgeType === 'contains' && targetNodeIds.has(edge.to))
    .map((edge) => ({ edgeId: edge.id, childNodeId: edge.to }))
    .sort((left, right) => left.edgeId.localeCompare(right.edgeId))
  return { ...summarizeNode(node, []), containmentReasons }
}

function changedFilesForNode(node: CodeNode, changedFiles: NormalizedChangedFile[]): string[] {
  return changedFiles
    .filter((file) => node.normalizedSourceFile === file.normalizedPath)
    .map((file) => file.relativePath)
    .sort((left, right) => left.localeCompare(right))
}

function changedFilesForEdge(edge: CodeEdge, changedFiles: NormalizedChangedFile[]): string[] {
  return changedFiles
    .filter((file) => edge.normalizedSourceFile === file.normalizedPath)
    .map((file) => file.relativePath)
    .sort((left, right) => left.localeCompare(right))
}

function buildRefreshActions(
  changedFiles: NormalizedChangedFile[],
  affectedNodes: CodeNode[],
  affectedEdges: CodeEdge[],
  dependentNodes: CodeNode[],
): RefreshAction[] {
  const actions: RefreshAction[] = []
  for (const file of changedFiles) {
    actions.push(action('reextract-file', file.relativePath, 'Refresh code facts for this explicitly changed file.'))
  }
  actions.push(
    action(
      'revalidate-code-subgraph',
      'devview-code-subgraph',
      `Revalidate after future extraction updates ${affectedNodes.length} affected node candidate(s) and ${affectedEdges.length} edge candidate(s).`,
    ),
    action(
      'recompute-impact',
      'code-impact',
      `Recompute impact for ${affectedNodes.length} affected node candidate(s) and ${dependentNodes.length} dependent node candidate(s).`,
    ),
    action(
      'rebuild-view-tree-symbol-context',
      'view-tree-symbol-context',
      'Refresh symbol-aware View Tree selections after code subgraph refresh is validated.',
    ),
    action(
      'regenerate-context-pack-symbol-context',
      'context-pack-symbol-context',
      'Refresh bounded code symbol context after View Tree symbol context is rebuilt.',
    ),
    action(
      'review-symbol-links',
      'devview-code-symbol-links',
      'Review maintenance-to-code symbol links for changed or stale code symbols.',
    ),
  )
  return actions
}

function action(actionType: RefreshAction['actionType'], target: string, reason: string): RefreshAction {
  return {
    actionType,
    target,
    reason,
    executionMode: 'future-only-not-executed',
    executed: false,
  }
}

function emptyAnalysis(changedFiles: NormalizedChangedFile[]): RefreshAnalysis {
  return {
    changedFiles,
    unmatchedChangedFiles: [],
    affectedCodeNodes: [],
    affectedCodeEdges: [],
    dependentCodeNodes: [],
    containmentContextNodes: [],
    refreshActionPlan: [],
  }
}

function buildReport(
  codeSubgraph: LoadedArtifact,
  analysis: RefreshAnalysis,
  findings: CodeSubgraphRefreshPlanFinding[],
  blocked: boolean,
): CodeSubgraphRefreshPlanReport {
  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : PASSED_STATUS,
    scope: REPORT_SCOPE,
    reportOnly: true,
    sourceFactsOnly: true,
    refreshPlanStatus: blocked ? 'blocked' : REFRESH_PLAN_STATUS,
    sourceCodeSubgraph: summarizeCodeSubgraph(codeSubgraph),
    changedFiles: {
      total: analysis.changedFiles.length,
      normalized: analysis.changedFiles,
      unmatched: analysis.unmatchedChangedFiles,
    },
    affectedCodeNodes: analysis.affectedCodeNodes,
    affectedCodeEdges: analysis.affectedCodeEdges,
    dependentCodeNodes: analysis.dependentCodeNodes,
    containmentContextNodes: analysis.containmentContextNodes,
    staleCandidateSummary: {
      affectedNodeCount: analysis.affectedCodeNodes.length,
      affectedEdgeCount: analysis.affectedCodeEdges.length,
      dependentNodeCount: analysis.dependentCodeNodes.length,
      containmentContextNodeCount: analysis.containmentContextNodes.length,
      unmatchedChangedFileCount: analysis.unmatchedChangedFiles.length,
      nodeKinds: countBy(analysis.affectedCodeNodes, (node) => node.nodeKind),
      edgeTypes: countBy(analysis.affectedCodeEdges, (edge) => edge.edgeType),
    },
    refreshActionPlan: analysis.refreshActionPlan,
    unifiedGraphRefreshBoundary: {
      separateCodeGraphCreated: false,
      watchActivated: false,
      hookInstalled: false,
      extractorExecuted: false,
      nativeExtractorExecuted: false,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      viewTreeGenerated: false,
      contextPackGenerated: false,
    },
    downstreamActionPlan: [
      'Run an explicit future native extraction or import step for changed files, then validate the refreshed code subgraph.',
      'Use a future guarded merge plan before any unified Maintainability Graph mutation is considered.',
      'Recompute code impact and rebuild symbol-aware View Tree/Context Pack artifacts only after refreshed source facts pass validation.',
    ],
    validationFindings: findings,
    sourceArtifactDigests: [digestEntry(codeSubgraph)],
    graphifyExecuted: false,
    astExtractorExecuted: false,
    extractorExecuted: false,
    nativeExtractorExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    watchActivated: false,
    hookInstalled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    viewTreeGenerated: false,
    contextPackGenerated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    rbacEnforced: false,
    permissionVerified: false,
    cryptographicSignatureVerified: false,
    enterpriseGateActivated: false,
  }
}

function summarizeCodeSubgraph(source: LoadedArtifact): CodeSubgraphRefreshPlanReport['sourceCodeSubgraph'] {
  const nodes = arrayRecords(source.record?.nodes)
  const edges = arrayRecords(source.record?.edges)
  return {
    path: source.record ? source.relativePath : null,
    artifactRole: stringValue(source.record?.artifactRole),
    status: stringValue(source.record?.status),
    scope: stringValue(source.record?.scope ?? source.record?.codeSubgraphScope),
    sha256: source.sha256,
    byteLength: source.byteLength,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodeKinds: countBy(nodes, (node) => stringValue(node.kind ?? node.nodeKind) ?? 'unknown'),
    edgeTypes: countBy(
      edges,
      (edge) => stringValue(edge.kind ?? edge.edgeType ?? edge.relation ?? edge.type) ?? 'unknown',
    ),
  }
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: CodeSubgraphRefreshPlanOptions,
): Promise<void> {
  const outputPath = resolveRepoPath(root, options.output ?? '')
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  const outputs = [
    { kind: 'refresh plan output', path: outputPath },
    ...(markdownPath ? [{ kind: 'markdown output', path: markdownPath }] : []),
  ]
  const seenOutputs = new Set<string>()
  for (const output of outputs) {
    const key = pathKey(output.path)
    if (seenOutputs.has(key)) {
      throw new Error('Code subgraph refresh output and markdown paths must be different.')
    }
    seenOutputs.add(key)
  }

  const sourceSet = new Set(sourcePaths.map(pathKey))
  for (const output of outputs) {
    const relativeTarget = relativePath(root, output.path)
    if (sourceSet.has(pathKey(output.path))) {
      throw new Error(`Code subgraph refresh ${output.kind} would overwrite a source input: ${relativeTarget}.`)
    }
    if (isProtectedControlPath(root, output.path)) {
      throw new Error(`Code subgraph refresh ${output.kind} is inside a protected control path: ${relativeTarget}.`)
    }
    const existingAuthority = await classifyExistingSourceAuthority(output.path)
    if (existingAuthority) {
      throw new Error(
        `Code subgraph refresh ${output.kind} would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(
        `Code subgraph refresh ${output.kind} would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
  }
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  try {
    const bytes = await readFile(filePath)
    const parsed = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) as JsonRecord
    const role = stringValue(parsed.artifactRole)
    if (role?.includes('graph-source') || role === REPORT_ROLE || role === CODE_SUBGRAPH_ROLE) {
      return `artifactRole ${role}`
    }
    if (asRecord(parsed.sourceRecords)) return 'source-authority-shaped sourceRecords'
    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) return 'node-edge graph-shaped artifact'
  } catch {
    return null
  }
  return null
}

function sourceInputPaths(root: string, options: CodeSubgraphRefreshPlanOptions): string[] {
  return [options.codeSubgraph]
    .filter((entry): entry is string => Boolean(entry))
    .map((entry) => resolveRepoPath(root, entry))
}

function renderMarkdown(report: CodeSubgraphRefreshPlanReport): string {
  return [
    '# Code Subgraph Refresh Plan',
    '',
    `Status: ${report.status}`,
    `Refresh plan status: ${report.refreshPlanStatus}`,
    `Code subgraph: \`${report.sourceCodeSubgraph.path}\``,
    '',
    '## Changed Files',
    '',
    ...report.changedFiles.normalized.map((file) => `- ${file.relativePath}`),
    '',
    '## Stale Candidates',
    '',
    `- Affected nodes: ${report.staleCandidateSummary.affectedNodeCount}`,
    `- Affected edges: ${report.staleCandidateSummary.affectedEdgeCount}`,
    `- Dependent nodes: ${report.staleCandidateSummary.dependentNodeCount}`,
    `- Containment context nodes: ${report.staleCandidateSummary.containmentContextNodeCount}`,
    `- Unmatched changed files: ${report.staleCandidateSummary.unmatchedChangedFileCount}`,
    '',
    '## Refresh Actions',
    '',
    ...report.refreshActionPlan.map((entry) => `- ${entry.actionType} -> ${entry.target} (${entry.executionMode})`),
    '',
    '## Boundary',
    '',
    '- Watch activated: false',
    '- Hook installed: false',
    '- Extractor executed: false',
    '- Graph source mutated: false',
    '- Graph delta applied: false',
    '- View Tree generated: false',
    '- Context Pack generated: false',
  ].join('\n')
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

function blocker(code: string, message: string, field?: string, pathValue?: string): CodeSubgraphRefreshPlanFinding {
  return { severity: 'blocker', code, message, field, path: pathValue }
}

function warning(code: string, message: string, field?: string, pathValue?: string): CodeSubgraphRefreshPlanFinding {
  return { severity: 'warning', code, message, field, path: pathValue }
}

function arrayRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is JsonRecord => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry))
    : []
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function countBy<T>(values: T[], key: (value: T) => string): Record<string, number> {
  const result: Record<string, number> = {}
  for (const value of values) {
    const name = key(value)
    result[name] = (result[name] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)))
}

function digestEntry(source: LoadedArtifact): CodeSubgraphRefreshPlanReport['sourceArtifactDigests'][number] {
  return {
    sourceKind: source.sourceKind,
    sourcePath: source.relativePath,
    sha256: source.sha256,
    byteLength: source.byteLength,
  }
}

function normalizeChangedFileInputs(values: string[]): string[] {
  return [...new Set(values.flatMap((value) => value.split(',').map((entry) => entry.trim())).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right),
  )
}

function normalizeSourceFile(value: string): string {
  return normalizeDisplayPath(value).replace(/^\.\//, '').toLowerCase()
}

function normalizeDisplayPath(value: string): string {
  return value.replace(/\\/g, '/')
}

function isOutsideRoot(relative: string): boolean {
  return relative === '..' || relative.startsWith(`..${path.sep}`) || relative.startsWith('../')
}

function stableEdgeId(edge: JsonRecord): string {
  const from = stringValue(edge.from ?? edge.source ?? edge.sourceNodeId) ?? 'unknown-source'
  const to = stringValue(edge.to ?? edge.target ?? edge.targetNodeId) ?? 'unknown-target'
  const kind = stringValue(edge.kind ?? edge.edgeType ?? edge.relation ?? edge.type) ?? 'unknown-edge'
  return `edge:${kind}:${from}->${to}`
}

function includesString(values: readonly string[], value: string): boolean {
  return values.includes(value)
}

function compareNodes(left: CodeNode, right: CodeNode): number {
  return left.id.localeCompare(right.id)
}

function compareEdges(left: CodeEdge, right: CodeEdge): number {
  return (
    left.edgeType.localeCompare(right.edgeType) ||
    left.from.localeCompare(right.from) ||
    left.to.localeCompare(right.to) ||
    left.id.localeCompare(right.id)
  )
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(root, filePath)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').toLowerCase()
}

function isSourceAuthorityShapedPath(filePath: string): boolean {
  const normalized = normalizePath(filePath)
  return (
    normalized.includes('/graph-source') ||
    normalized.includes('/source-authority') ||
    normalized.includes('/read-model') ||
    normalized.endsWith('maintainability-graph.json')
  )
}

function isProtectedControlPath(root: string, filePath: string): boolean {
  const relative = relativePath(root, filePath)
  return (
    hasDevViewControlDirectory(relative) ||
    hasCodexControlDirectory(relative) ||
    hasHiddenControlDirectorySegment(relative)
  )
}
