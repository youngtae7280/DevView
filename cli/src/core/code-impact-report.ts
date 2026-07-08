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

const REPORT_ROLE = 'devview-code-impact-report'
const PASSED_STATUS = 'devview-code-impact-reported'
const BLOCKED_STATUS = 'devview-code-impact-blocked'
const REPORT_SCOPE = 'code-impact-analysis-report-only'
const CODE_SUBGRAPH_ROLE = 'devview-code-subgraph'
const CODE_SUBGRAPH_STATUS = 'devview-code-subgraph-supplied'
const CODE_SUBGRAPH_SCOPE = 'code-subgraph-source-fact-only'
const CODE_SYMBOL_LINK_VALIDATION_ROLE = 'devview-code-symbol-link-validation-report'
const CODE_SYMBOL_LINK_VALIDATION_STATUS = 'devview-code-symbol-link-validation-passed'
const CODE_SYMBOL_LINK_VALIDATION_SCOPE = 'code-symbol-link-validation-report-only'

const directImpactEdgeTypes = [
  'calls',
  'imports',
  'imports_from',
  'depends_on',
  'references',
  'constructs',
  'reads',
  'writes',
] as const

const testImpactEdgeTypes = ['covers', 'tested_by'] as const
const maintenanceTestKinds = ['check', 'test', 'evidence'] as const

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
  'maintainabilityGraphMutationPlanned',
  'mutationApplied',
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

export interface CodeImpactReportOptions {
  codeSubgraph?: string
  changedSymbols?: string[]
  codeSymbolLinksValidation?: string
  output?: string
  markdown?: string
}

export interface CodeImpactFinding {
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
  sourceKind: 'code-subgraph' | 'code-symbol-links-validation'
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
  sourceLocation: unknown
  sourceLocationStatus: string | null
  confidence: string | null
  record: JsonRecord
}

interface CodeEdge {
  id: string
  from: string
  to: string
  edgeType: string
  sourceFile: string | null
  sourceLocationStatus: string | null
  confidence: string | null
  record: JsonRecord
}

interface CodeGraphIndex {
  nodes: CodeNode[]
  edges: CodeEdge[]
  nodesById: Map<string, CodeNode>
  outgoingByNode: Map<string, CodeEdge[]>
  incomingByNode: Map<string, CodeEdge[]>
}

interface ImpactReason {
  seedSymbolId: string
  direction: 'outgoing' | 'incoming' | 'container'
  relationship: string
  edgeId: string
  edgeType: string
  sourceNodeId: string
  targetNodeId: string
}

interface ImpactedCodeNode {
  nodeId: string
  nodeKind: string
  label: string | null
  sourceFile: string | null
  sourceLocation: unknown
  sourceLocationStatus: string | null
  confidence: string | null
  impactReasons: ImpactReason[]
}

interface ImpactedEdge {
  edgeId: string
  edgeType: string
  from: string
  to: string
  direction: 'outgoing' | 'incoming' | 'container'
  relationship: string
  seedSymbolId: string
}

interface MaintenanceImpact {
  linkId: string
  sourceNodeId: string
  sourceNodeKind: string
  targetCodeNodeId: string
  targetCodeNodeKind: string
  linkType: string
  confidence: string | null
  impactSource: 'seed' | 'impacted-code-node'
}

interface ImpactAnalysis {
  seedSymbols: Array<{
    nodeId: string
    nodeKind: string
    label: string | null
    sourceFile: string | null
    sourceLocation: unknown
    sourceLocationStatus: string | null
    confidence: string | null
  }>
  impactedCodeNodes: ImpactedCodeNode[]
  impactedEdges: ImpactedEdge[]
  callerIds: string[]
  calleeIds: string[]
  importDependentIds: string[]
  importedDependencyIds: string[]
  edgeTestNodeIds: string[]
  maintenanceImpacts: MaintenanceImpact[]
}

export interface CodeImpactReport extends JsonRecord {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof PASSED_STATUS | typeof BLOCKED_STATUS
  scope: typeof REPORT_SCOPE
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
    nodeKinds: Record<string, number>
    edgeTypes: Record<string, number>
  }
  sourceCodeSymbolLinksValidation: {
    path: string | null
    artifactRole: string | null
    status: string | null
    scope: string | null
    sha256: string | null
    byteLength: number | null
    validatedLinkCount: number
  }
  seedSymbols: ImpactAnalysis['seedSymbols']
  impactedCodeNodes: ImpactedCodeNode[]
  impactedEdges: ImpactedEdge[]
  callerCalleeSummary: {
    callerCount: number
    calleeCount: number
    callers: string[]
    callees: string[]
  }
  importDependencySummary: {
    importDependentCount: number
    importedDependencyCount: number
    importDependents: string[]
    importedDependencies: string[]
  }
  testCoverageImpactSummary: {
    impactedTestNodeCount: number
    impactedTestNodes: string[]
    coverageEdgeCount: number
    maintenanceTestImpactCount: number
    maintenanceTestImpacts: MaintenanceImpact[]
  }
  maintenanceImpactSummary: {
    supplied: boolean
    affectedMaintenanceNodeCount: number
    affectedMaintenanceNodes: MaintenanceImpact[]
    bySourceNodeKind: Record<string, number>
    byLinkType: Record<string, number>
  }
  limitations: string[]
  downstreamActionPlan: string[]
  unifiedGraphBoundary: {
    separateCodeGraphCreated: false
    maintainabilityGraphMutationPlanned: false
    mutationApplied: false
    graphSourceMutated: false
    graphDeltaApplied: false
    viewTreeGenerated: false
    contextPackGenerated: false
  }
  validationFindings: CodeImpactFinding[]
  sourceArtifactDigests: Array<{
    sourceKind: LoadedArtifact['sourceKind']
    sourcePath: string
    sha256: string | null
    byteLength: number | null
  }>
  graphifyExecuted: false
  astExtractorExecuted: false
  providerInvoked: false
  networkCallMade: false
  apiCallMade: false
  shellCommandsExecuted: false
  extensionExecutionAllowed: false
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

export class CodeImpactReportError extends Error {
  readonly report: CodeImpactReport

  constructor(report: CodeImpactReport) {
    super('Code impact analysis report is blocked.')
    this.report = report
  }
}

export async function reportCodeImpactFile(root: string, options: CodeImpactReportOptions): Promise<CodeImpactReport> {
  validateRequiredOptions(options)
  const sourcePaths = sourceInputPaths(root, options)
  await assertOutputAuthority(root, sourcePaths, options)

  const codeSubgraph = await loadArtifact(root, options.codeSubgraph ?? '', 'code-subgraph')
  const linksValidation = options.codeSymbolLinksValidation
    ? await loadArtifact(root, options.codeSymbolLinksValidation, 'code-symbol-links-validation')
    : null
  const seedIds = normalizeSeedIds(options.changedSymbols ?? [])

  const findings: CodeImpactFinding[] = []
  for (const artifact of [codeSubgraph, linksValidation]) {
    validateLoadedArtifact(artifact, findings)
  }
  if (codeSubgraph.record) {
    validateCodeSubgraphSource(root, codeSubgraph, findings)
  }
  if (linksValidation?.record) {
    validateCodeSymbolLinksValidationReport(linksValidation, findings)
  }

  const index = buildCodeGraphIndex(codeSubgraph.record)
  for (const seedId of seedIds) {
    if (!index.nodesById.has(seedId)) {
      findings.push(
        blocker(
          'CODE_IMPACT_SEED_SYMBOL_MISSING',
          `Changed symbol ${seedId} was not found in the supplied code subgraph.`,
          'changedSymbol',
          codeSubgraph.relativePath,
        ),
      )
    }
  }
  if (seedIds.length === 0) {
    findings.push(
      blocker(
        'CODE_IMPACT_SEED_SYMBOL_REQUIRED',
        'At least one --changed-symbol id is required for code impact analysis.',
        'changedSymbol',
      ),
    )
  }

  const analysis =
    findings.some((finding) => finding.severity === 'blocker') || index.nodes.length === 0
      ? emptyAnalysis()
      : analyzeImpact(seedIds, index, linksValidation?.record ?? null)

  if (findings.every((finding) => finding.severity !== 'blocker')) {
    findings.push({
      severity: 'satisfied',
      code: 'CODE_IMPACT_REPORTED',
      message:
        'Code impact was computed from static DevView code subgraph source facts without code execution or graph-source mutation.',
      path: options.output ? relativePath(root, resolveRepoPath(root, options.output)) : undefined,
    })
  }

  const blocked = findings.some((finding) => finding.severity === 'blocker')
  const report = buildReport(codeSubgraph, linksValidation, analysis, findings, blocked)
  if (blocked) {
    throw new CodeImpactReportError(report)
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

function validateRequiredOptions(options: CodeImpactReportOptions): void {
  if (!options.codeSubgraph) {
    throw new Error('graph report-code-impact requires --code-subgraph <devview-code-subgraph.json>.')
  }
  if (!options.changedSymbols || normalizeSeedIds(options.changedSymbols).length === 0) {
    throw new Error('graph report-code-impact requires at least one --changed-symbol <code-node-id>.')
  }
  if (!options.output) {
    throw new Error('graph report-code-impact requires --output <code-impact-report.json>.')
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

function validateLoadedArtifact(artifact: LoadedArtifact | null, findings: CodeImpactFinding[]): void {
  if (!artifact) return
  if (!artifact.record) {
    findings.push(
      blocker(
        'CODE_IMPACT_SOURCE_READ_FAILED',
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
        'CODE_IMPACT_UNSAFE_AUTHORITY_FLAG',
        `${artifact.relativePath} contains unsafe report-only flag ${hit.field}: true.`,
        hit.field,
        artifact.relativePath,
      ),
    )
  }
  for (const hit of collectExecutableInstructionHits(artifact.record)) {
    findings.push(
      blocker(
        'CODE_IMPACT_EXECUTABLE_INSTRUCTION_DECLARED',
        `${artifact.relativePath} contains executable/provider/network instruction field ${hit.field}.`,
        hit.field,
        artifact.relativePath,
      ),
    )
  }
}

function validateCodeSubgraphSource(root: string, source: LoadedArtifact, findings: CodeImpactFinding[]): void {
  const record = source.record
  if (!record) return
  if (record.artifactRole !== CODE_SUBGRAPH_ROLE) {
    findings.push(
      blocker(
        'CODE_IMPACT_CODE_SUBGRAPH_ROLE_INVALID',
        `Code subgraph artifactRole must be ${CODE_SUBGRAPH_ROLE}.`,
        'artifactRole',
        source.relativePath,
      ),
    )
  }
  if (record.status !== CODE_SUBGRAPH_STATUS) {
    findings.push(
      blocker(
        'CODE_IMPACT_CODE_SUBGRAPH_STATUS_INVALID',
        `Code subgraph status must be ${CODE_SUBGRAPH_STATUS}.`,
        'status',
        source.relativePath,
      ),
    )
  }
  if ((record.scope ?? record.codeSubgraphScope) !== CODE_SUBGRAPH_SCOPE) {
    findings.push(
      blocker(
        'CODE_IMPACT_CODE_SUBGRAPH_SCOPE_INVALID',
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
            'CODE_IMPACT_CODE_SUBGRAPH_VALIDATION_FAILED',
            finding.message,
            finding.field,
            finding.path ?? source.relativePath,
          ),
        )
      }
    } else {
      findings.push(
        blocker(
          'CODE_IMPACT_CODE_SUBGRAPH_VALIDATION_FAILED',
          error instanceof Error ? error.message : String(error),
          'codeSubgraph',
          source.relativePath,
        ),
      )
    }
  }
}

function validateCodeSymbolLinksValidationReport(source: LoadedArtifact, findings: CodeImpactFinding[]): void {
  const record = source.record
  if (!record) return
  if (record.artifactRole !== CODE_SYMBOL_LINK_VALIDATION_ROLE) {
    findings.push(
      blocker(
        'CODE_IMPACT_LINK_VALIDATION_ROLE_INVALID',
        `Code symbol links validation artifactRole must be ${CODE_SYMBOL_LINK_VALIDATION_ROLE}.`,
        'artifactRole',
        source.relativePath,
      ),
    )
  }
  if (record.status !== CODE_SYMBOL_LINK_VALIDATION_STATUS) {
    findings.push(
      blocker(
        'CODE_IMPACT_LINK_VALIDATION_STATUS_INVALID',
        `Code symbol links validation status must be ${CODE_SYMBOL_LINK_VALIDATION_STATUS}.`,
        'status',
        source.relativePath,
      ),
    )
  }
  if ((record.scope ?? record.validationScope) !== CODE_SYMBOL_LINK_VALIDATION_SCOPE) {
    findings.push(
      blocker(
        'CODE_IMPACT_LINK_VALIDATION_SCOPE_INVALID',
        `Code symbol links validation scope must be ${CODE_SYMBOL_LINK_VALIDATION_SCOPE}.`,
        'scope',
        source.relativePath,
      ),
    )
  }
  if (!Array.isArray(record.validatedLinks)) {
    findings.push(
      warning(
        'CODE_IMPACT_LINK_VALIDATION_LINKS_NOT_SUMMARIZED',
        'Code symbol links validation did not expose validatedLinks; maintenance impact will be empty.',
        'validatedLinks',
        source.relativePath,
      ),
    )
  }
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
  const outgoingByNode = new Map<string, CodeEdge[]>()
  const incomingByNode = new Map<string, CodeEdge[]>()
  for (const edge of edges) {
    const outgoing = outgoingByNode.get(edge.from) ?? []
    outgoing.push(edge)
    outgoingByNode.set(edge.from, outgoing)
    const incoming = incomingByNode.get(edge.to) ?? []
    incoming.push(edge)
    incomingByNode.set(edge.to, incoming)
  }
  for (const list of [...outgoingByNode.values(), ...incomingByNode.values()]) {
    list.sort(compareEdges)
  }
  return { nodes, edges, nodesById, outgoingByNode, incomingByNode }
}

function toCodeNode(node: JsonRecord): CodeNode | null {
  const id = stringValue(node.id ?? node.nodeId)
  const kind = stringValue(node.kind ?? node.nodeKind)
  if (!id || !kind) return null
  return {
    id,
    kind,
    label: stringValue(node.label ?? node.name),
    sourceFile: stringValue(node.sourceFile ?? node.source_file),
    sourceLocation: node.sourceLocation ?? node.source_location ?? null,
    sourceLocationStatus: stringValue(node.sourceLocationStatus),
    confidence: stringValue(node.confidence),
    record: node,
  }
}

function toCodeEdge(edge: JsonRecord): CodeEdge | null {
  const id = stringValue(edge.id ?? edge.edgeId) ?? stableEdgeId(edge)
  const from = stringValue(edge.from ?? edge.source ?? edge.sourceNodeId)
  const to = stringValue(edge.to ?? edge.target ?? edge.targetNodeId)
  const edgeType = stringValue(edge.kind ?? edge.edgeType ?? edge.relation ?? edge.type)
  if (!id || !from || !to || !edgeType) return null
  return {
    id,
    from,
    to,
    edgeType,
    sourceFile: stringValue(edge.sourceFile ?? edge.source_file),
    sourceLocationStatus: stringValue(edge.sourceLocationStatus),
    confidence: stringValue(edge.confidence),
    record: edge,
  }
}

function analyzeImpact(seedIds: string[], index: CodeGraphIndex, linksValidation: JsonRecord | null): ImpactAnalysis {
  const nodeImpacts = new Map<string, ImpactedCodeNode>()
  const edgeImpacts = new Map<string, ImpactedEdge>()
  const callerIds = new Set<string>()
  const calleeIds = new Set<string>()
  const importDependentIds = new Set<string>()
  const importedDependencyIds = new Set<string>()
  const edgeTestNodeIds = new Set<string>()
  const seedSet = new Set(seedIds)

  const addImpact = (nodeId: string, reason: ImpactReason): void => {
    const node = index.nodesById.get(nodeId)
    if (!node) return
    const existing = nodeImpacts.get(nodeId) ?? {
      nodeId: node.id,
      nodeKind: node.kind,
      label: node.label,
      sourceFile: node.sourceFile,
      sourceLocation: node.sourceLocation,
      sourceLocationStatus: node.sourceLocationStatus,
      confidence: node.confidence,
      impactReasons: [],
    }
    if (!existing.impactReasons.some((entry) => reasonKey(entry) === reasonKey(reason))) {
      existing.impactReasons.push(reason)
    }
    nodeImpacts.set(nodeId, existing)
  }

  const addEdge = (
    edge: CodeEdge,
    direction: ImpactedEdge['direction'],
    relationship: string,
    seedSymbolId: string,
  ) => {
    const impacted = {
      edgeId: edge.id,
      edgeType: edge.edgeType,
      from: edge.from,
      to: edge.to,
      direction,
      relationship,
      seedSymbolId,
    }
    edgeImpacts.set(edgeImpactKey(impacted), impacted)
  }

  for (const seedId of seedIds) {
    const outgoingEdges = index.outgoingByNode.get(seedId) ?? []
    for (const edge of outgoingEdges) {
      if (includesString(directImpactEdgeTypes, edge.edgeType)) {
        const relationship = outgoingRelationship(edge.edgeType)
        addImpact(edge.to, {
          seedSymbolId: seedId,
          direction: 'outgoing',
          relationship,
          edgeId: edge.id,
          edgeType: edge.edgeType,
          sourceNodeId: edge.from,
          targetNodeId: edge.to,
        })
        addEdge(edge, 'outgoing', relationship, seedId)
        if (edge.edgeType === 'calls') calleeIds.add(edge.to)
        if (edge.edgeType === 'imports' || edge.edgeType === 'imports_from') importedDependencyIds.add(edge.to)
      }
      if (includesString(testImpactEdgeTypes, edge.edgeType)) {
        const testNodeId = edge.edgeType === 'tested_by' ? edge.to : edge.from
        edgeTestNodeIds.add(testNodeId)
        const relationship = 'test_coverage'
        const impactedNodeId = edge.edgeType === 'tested_by' ? edge.to : edge.to
        addImpact(impactedNodeId, {
          seedSymbolId: seedId,
          direction: 'outgoing',
          relationship,
          edgeId: edge.id,
          edgeType: edge.edgeType,
          sourceNodeId: edge.from,
          targetNodeId: edge.to,
        })
        addEdge(edge, 'outgoing', relationship, seedId)
      }
    }

    const incomingEdges = index.incomingByNode.get(seedId) ?? []
    for (const edge of incomingEdges) {
      if (includesString(directImpactEdgeTypes, edge.edgeType)) {
        const relationship = incomingRelationship(edge.edgeType)
        addImpact(edge.from, {
          seedSymbolId: seedId,
          direction: 'incoming',
          relationship,
          edgeId: edge.id,
          edgeType: edge.edgeType,
          sourceNodeId: edge.from,
          targetNodeId: edge.to,
        })
        addEdge(edge, 'incoming', relationship, seedId)
        if (edge.edgeType === 'calls') callerIds.add(edge.from)
        if (edge.edgeType === 'imports' || edge.edgeType === 'imports_from') importDependentIds.add(edge.from)
      }
      if (includesString(testImpactEdgeTypes, edge.edgeType)) {
        const testNodeId = edge.edgeType === 'covers' ? edge.from : edge.to
        edgeTestNodeIds.add(testNodeId)
        const relationship = 'test_coverage'
        addImpact(testNodeId, {
          seedSymbolId: seedId,
          direction: 'incoming',
          relationship,
          edgeId: edge.id,
          edgeType: edge.edgeType,
          sourceNodeId: edge.from,
          targetNodeId: edge.to,
        })
        addEdge(edge, 'incoming', relationship, seedId)
      }
    }
  }

  const contextTargets = new Set([...seedIds, ...nodeImpacts.keys()])
  for (const targetId of [...contextTargets].sort()) {
    const parentEdges = (index.incomingByNode.get(targetId) ?? []).filter((edge) => edge.edgeType === 'contains')
    for (const edge of parentEdges) {
      const seedSymbolId = seedSet.has(targetId) ? targetId : seedIds[0]
      addImpact(edge.from, {
        seedSymbolId,
        direction: 'container',
        relationship: 'container_context',
        edgeId: edge.id,
        edgeType: edge.edgeType,
        sourceNodeId: edge.from,
        targetNodeId: edge.to,
      })
      addEdge(edge, 'container', 'container_context', seedSymbolId)
    }
  }

  for (const impact of nodeImpacts.values()) {
    impact.impactReasons.sort(compareReasons)
  }

  const impactedOrSeedIds = new Set([...seedIds, ...nodeImpacts.keys()])
  const maintenanceImpacts = collectMaintenanceImpacts(linksValidation, impactedOrSeedIds, seedSet)

  return {
    seedSymbols: seedIds
      .map((seedId) => index.nodesById.get(seedId))
      .filter((node): node is CodeNode => Boolean(node))
      .map((node) => ({
        nodeId: node.id,
        nodeKind: node.kind,
        label: node.label,
        sourceFile: node.sourceFile,
        sourceLocation: node.sourceLocation,
        sourceLocationStatus: node.sourceLocationStatus,
        confidence: node.confidence,
      })),
    impactedCodeNodes: [...nodeImpacts.values()].sort(compareImpactedNodes),
    impactedEdges: [...edgeImpacts.values()].sort(compareImpactedEdges),
    callerIds: sortedStrings(callerIds),
    calleeIds: sortedStrings(calleeIds),
    importDependentIds: sortedStrings(importDependentIds),
    importedDependencyIds: sortedStrings(importedDependencyIds),
    edgeTestNodeIds: sortedStrings(edgeTestNodeIds),
    maintenanceImpacts,
  }
}

function collectMaintenanceImpacts(
  linksValidation: JsonRecord | null,
  impactedOrSeedIds: Set<string>,
  seedSet: Set<string>,
): MaintenanceImpact[] {
  if (!linksValidation) return []
  return arrayRecords(linksValidation.validatedLinks)
    .map((link): MaintenanceImpact | null => {
      const targetCodeNodeId = stringValue(link.targetCodeNodeId)
      if (!targetCodeNodeId || !impactedOrSeedIds.has(targetCodeNodeId)) return null
      const linkId = stringValue(link.id)
      const sourceNodeId = stringValue(link.sourceNodeId)
      const sourceNodeKind = stringValue(link.sourceNodeKind)
      const targetCodeNodeKind = stringValue(link.targetCodeNodeKind)
      const linkType = stringValue(link.linkType)
      if (!linkId || !sourceNodeId || !sourceNodeKind || !targetCodeNodeKind || !linkType) return null
      return {
        linkId,
        sourceNodeId,
        sourceNodeKind,
        targetCodeNodeId,
        targetCodeNodeKind,
        linkType,
        confidence: stringValue(link.confidence),
        impactSource: seedSet.has(targetCodeNodeId) ? 'seed' : 'impacted-code-node',
      }
    })
    .filter((impact): impact is MaintenanceImpact => Boolean(impact))
    .sort(compareMaintenanceImpacts)
}

function emptyAnalysis(): ImpactAnalysis {
  return {
    seedSymbols: [],
    impactedCodeNodes: [],
    impactedEdges: [],
    callerIds: [],
    calleeIds: [],
    importDependentIds: [],
    importedDependencyIds: [],
    edgeTestNodeIds: [],
    maintenanceImpacts: [],
  }
}

function buildReport(
  codeSubgraph: LoadedArtifact,
  linksValidation: LoadedArtifact | null,
  analysis: ImpactAnalysis,
  findings: CodeImpactFinding[],
  blocked: boolean,
): CodeImpactReport {
  const maintenanceTestImpacts = analysis.maintenanceImpacts.filter((impact) =>
    includesString(maintenanceTestKinds, impact.sourceNodeKind),
  )
  const impactedTestNodes = uniqueSorted([
    ...analysis.edgeTestNodeIds,
    ...maintenanceTestImpacts.map((entry) => entry.sourceNodeId),
  ])
  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : PASSED_STATUS,
    scope: REPORT_SCOPE,
    reportOnly: true,
    sourceFactsOnly: true,
    sourceCodeSubgraph: summarizeCodeSubgraph(codeSubgraph),
    sourceCodeSymbolLinksValidation: summarizeLinksValidation(linksValidation),
    seedSymbols: analysis.seedSymbols,
    impactedCodeNodes: analysis.impactedCodeNodes,
    impactedEdges: analysis.impactedEdges,
    callerCalleeSummary: {
      callerCount: analysis.callerIds.length,
      calleeCount: analysis.calleeIds.length,
      callers: analysis.callerIds,
      callees: analysis.calleeIds,
    },
    importDependencySummary: {
      importDependentCount: analysis.importDependentIds.length,
      importedDependencyCount: analysis.importedDependencyIds.length,
      importDependents: analysis.importDependentIds,
      importedDependencies: analysis.importedDependencyIds,
    },
    testCoverageImpactSummary: {
      impactedTestNodeCount: impactedTestNodes.length,
      impactedTestNodes,
      coverageEdgeCount: analysis.impactedEdges.filter((edge) => includesString(testImpactEdgeTypes, edge.edgeType))
        .length,
      maintenanceTestImpactCount: maintenanceTestImpacts.length,
      maintenanceTestImpacts,
    },
    maintenanceImpactSummary: {
      supplied: Boolean(linksValidation),
      affectedMaintenanceNodeCount: uniqueSorted(analysis.maintenanceImpacts.map((impact) => impact.sourceNodeId))
        .length,
      affectedMaintenanceNodes: analysis.maintenanceImpacts,
      bySourceNodeKind: countBy(analysis.maintenanceImpacts, (impact) => impact.sourceNodeKind),
      byLinkType: countBy(analysis.maintenanceImpacts, (impact) => impact.linkType),
    },
    limitations: [
      'Impact is computed from the supplied static code subgraph only.',
      'No source files, project code, package builds, providers, network endpoints, or APIs are executed.',
      'Dynamic dispatch, runtime reflection, generated code, and path feasibility are not proven in this report-only tranche.',
      'Containment context is bounded to one reverse contains layer.',
    ],
    downstreamActionPlan: [
      'Use impacted code node ids as candidates for View Tree and Context Pack symbol selection.',
      'Feed maintenance impacts into future unified graph query/path/explain reports.',
      'Keep graph-source mutation behind a later guarded merge/apply boundary.',
    ],
    unifiedGraphBoundary: {
      separateCodeGraphCreated: false,
      maintainabilityGraphMutationPlanned: false,
      mutationApplied: false,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      viewTreeGenerated: false,
      contextPackGenerated: false,
    },
    validationFindings: findings,
    sourceArtifactDigests: [digestEntry(codeSubgraph), ...(linksValidation ? [digestEntry(linksValidation)] : [])],
    graphifyExecuted: false,
    astExtractorExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
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

function summarizeCodeSubgraph(source: LoadedArtifact): CodeImpactReport['sourceCodeSubgraph'] {
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

function summarizeLinksValidation(source: LoadedArtifact | null): CodeImpactReport['sourceCodeSymbolLinksValidation'] {
  if (!source?.record) {
    return {
      path: null,
      artifactRole: null,
      status: null,
      scope: null,
      sha256: source?.sha256 ?? null,
      byteLength: source?.byteLength ?? null,
      validatedLinkCount: 0,
    }
  }
  return {
    path: source.relativePath,
    artifactRole: stringValue(source.record.artifactRole),
    status: stringValue(source.record.status),
    scope: stringValue(source.record.scope ?? source.record.validationScope),
    sha256: source.sha256,
    byteLength: source.byteLength,
    validatedLinkCount: arrayRecords(source.record.validatedLinks).length,
  }
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: CodeImpactReportOptions,
): Promise<void> {
  const outputPath = resolveRepoPath(root, options.output ?? '')
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  const outputs = [
    { kind: 'impact output', path: outputPath },
    ...(markdownPath ? [{ kind: 'markdown output', path: markdownPath }] : []),
  ]
  const seenOutputs = new Set<string>()
  for (const output of outputs) {
    const key = pathKey(output.path)
    if (seenOutputs.has(key)) {
      throw new Error('Code impact output and markdown paths must be different.')
    }
    seenOutputs.add(key)
  }

  const sourceSet = new Set(sourcePaths.map(pathKey))
  for (const output of outputs) {
    const relativeTarget = relativePath(root, output.path)
    if (sourceSet.has(pathKey(output.path))) {
      throw new Error(`Code impact ${output.kind} would overwrite a source input: ${relativeTarget}.`)
    }
    if (isProtectedControlPath(root, output.path)) {
      throw new Error(`Code impact ${output.kind} is inside a protected control path: ${relativeTarget}.`)
    }
    const existingAuthority = await classifyExistingSourceAuthority(output.path)
    if (existingAuthority) {
      throw new Error(`Code impact ${output.kind} would overwrite a source-authority-shaped path: ${relativeTarget}.`)
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(`Code impact ${output.kind} would overwrite a source-authority-shaped path: ${relativeTarget}.`)
    }
  }
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  try {
    const bytes = await readFile(filePath)
    const parsed = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) as JsonRecord
    const role = stringValue(parsed.artifactRole)
    if (
      role?.includes('graph-source') ||
      role === REPORT_ROLE ||
      role === CODE_SUBGRAPH_ROLE ||
      role === CODE_SYMBOL_LINK_VALIDATION_ROLE
    ) {
      return `artifactRole ${role}`
    }
    if (asRecord(parsed.sourceRecords)) return 'source-authority-shaped sourceRecords'
    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) return 'node-edge graph-shaped artifact'
  } catch {
    return null
  }
  return null
}

function sourceInputPaths(root: string, options: CodeImpactReportOptions): string[] {
  return [options.codeSubgraph, options.codeSymbolLinksValidation]
    .filter((entry): entry is string => Boolean(entry))
    .map((entry) => resolveRepoPath(root, entry))
}

function renderMarkdown(report: CodeImpactReport): string {
  return [
    '# Code Impact Analysis',
    '',
    `Status: ${report.status}`,
    `Code subgraph: \`${report.sourceCodeSubgraph.path}\``,
    `Code symbol links validation: \`${report.sourceCodeSymbolLinksValidation.path ?? 'not-supplied'}\``,
    '',
    '## Seeds',
    '',
    ...report.seedSymbols.map(
      (seed) => `- ${seed.nodeId} (${seed.nodeKind}) ${seed.sourceFile ?? 'source-file-unknown'}`,
    ),
    '',
    '## Impact Summary',
    '',
    `- Impacted code nodes: ${report.impactedCodeNodes.length}`,
    `- Impacted edges: ${report.impactedEdges.length}`,
    `- Callers: ${report.callerCalleeSummary.callerCount}`,
    `- Callees: ${report.callerCalleeSummary.calleeCount}`,
    `- Import dependents: ${report.importDependencySummary.importDependentCount}`,
    `- Imported dependencies: ${report.importDependencySummary.importedDependencyCount}`,
    `- Test/check/evidence impacts: ${report.testCoverageImpactSummary.impactedTestNodeCount}`,
    `- Maintenance impacts: ${report.maintenanceImpactSummary.affectedMaintenanceNodeCount}`,
    '',
    '## Impacted Code Nodes',
    '',
    ...(report.impactedCodeNodes.length > 0
      ? report.impactedCodeNodes.map(
          (node) =>
            `- ${node.nodeId} (${node.nodeKind}) via ${node.impactReasons
              .map((reason) => `${reason.relationship}:${reason.edgeId}`)
              .join(', ')}`,
        )
      : ['- none']),
    '',
    '## Limitations',
    '',
    ...report.limitations.map((limitation) => `- ${limitation}`),
    '',
    '## Boundary',
    '',
    '- Separate code graph created: false',
    '- Graph source mutated: false',
    '- Graph delta applied: false',
    '- View Tree generated: false',
    '- Context Pack generated: false',
    '- Provider/network/API called: false',
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

function outgoingRelationship(edgeType: string): string {
  if (edgeType === 'calls') return 'callee'
  if (edgeType === 'imports' || edgeType === 'imports_from') return 'imported_dependency'
  if (edgeType === 'depends_on') return 'dependency'
  if (edgeType === 'references') return 'referenced_symbol'
  if (edgeType === 'constructs') return 'constructed_symbol'
  if (edgeType === 'reads') return 'read_symbol'
  if (edgeType === 'writes') return 'written_symbol'
  return edgeType
}

function incomingRelationship(edgeType: string): string {
  if (edgeType === 'calls') return 'caller'
  if (edgeType === 'imports' || edgeType === 'imports_from') return 'import_dependent'
  if (edgeType === 'depends_on') return 'dependent'
  if (edgeType === 'references') return 'referencer'
  if (edgeType === 'constructs') return 'constructor'
  if (edgeType === 'reads') return 'reader'
  if (edgeType === 'writes') return 'writer'
  return edgeType
}

function blocker(code: string, message: string, field?: string, pathValue?: string): CodeImpactFinding {
  return { severity: 'blocker', code, message, field, path: pathValue }
}

function warning(code: string, message: string, field?: string, pathValue?: string): CodeImpactFinding {
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

function digestEntry(source: LoadedArtifact): CodeImpactReport['sourceArtifactDigests'][number] {
  return {
    sourceKind: source.sourceKind,
    sourcePath: source.relativePath,
    sha256: source.sha256,
    byteLength: source.byteLength,
  }
}

function normalizeSeedIds(values: string[]): string[] {
  return uniqueSorted(values.flatMap((value) => value.split(',').map((entry) => entry.trim())).filter(Boolean))
}

function stableEdgeId(edge: JsonRecord): string {
  const from = stringValue(edge.from ?? edge.source ?? edge.sourceNodeId) ?? 'unknown-source'
  const to = stringValue(edge.to ?? edge.target ?? edge.targetNodeId) ?? 'unknown-target'
  const kind = stringValue(edge.kind ?? edge.edgeType ?? edge.relation ?? edge.type) ?? 'unknown-edge'
  return `edge:${kind}:${from}->${to}`
}

function reasonKey(reason: ImpactReason): string {
  return [
    reason.seedSymbolId,
    reason.direction,
    reason.relationship,
    reason.edgeId,
    reason.edgeType,
    reason.sourceNodeId,
    reason.targetNodeId,
  ].join('\u0000')
}

function edgeImpactKey(edge: ImpactedEdge): string {
  return [edge.seedSymbolId, edge.direction, edge.relationship, edge.edgeId].join('\u0000')
}

function sortedStrings(values: Set<string>): string[] {
  return [...values].sort((left, right) => left.localeCompare(right))
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

function compareEdges(left: CodeEdge, right: CodeEdge): number {
  return (
    left.edgeType.localeCompare(right.edgeType) ||
    left.from.localeCompare(right.from) ||
    left.to.localeCompare(right.to) ||
    left.id.localeCompare(right.id)
  )
}

function compareReasons(left: ImpactReason, right: ImpactReason): number {
  return reasonKey(left).localeCompare(reasonKey(right))
}

function compareImpactedNodes(left: ImpactedCodeNode, right: ImpactedCodeNode): number {
  return left.nodeId.localeCompare(right.nodeId)
}

function compareImpactedEdges(left: ImpactedEdge, right: ImpactedEdge): number {
  return edgeImpactKey(left).localeCompare(edgeImpactKey(right))
}

function compareMaintenanceImpacts(left: MaintenanceImpact, right: MaintenanceImpact): number {
  return (
    left.sourceNodeId.localeCompare(right.sourceNodeId) ||
    left.targetCodeNodeId.localeCompare(right.targetCodeNodeId) ||
    left.linkType.localeCompare(right.linkType) ||
    left.linkId.localeCompare(right.linkId)
  )
}

function includesString(values: readonly string[], value: string): boolean {
  return values.includes(value)
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
