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

const REPORT_ROLE = 'devview-code-subgraph-merge-plan-report'
const PASSED_STATUS = 'devview-code-subgraph-merge-plan-recorded'
const BLOCKED_STATUS = 'devview-code-subgraph-merge-plan-blocked'
const REPORT_SCOPE = 'code-subgraph-merge-plan-report-only'
const PLAN_STATUS = 'dry-run-not-applied'
const CODE_SUBGRAPH_ROLE = 'devview-code-subgraph'
const CODE_SUBGRAPH_STATUS = 'devview-code-subgraph-supplied'
const CODE_SUBGRAPH_SCOPE = 'code-subgraph-source-fact-only'
const VALIDATION_REPORT_ROLE = 'devview-code-subgraph-validation-report'
const VALIDATION_REPORT_STATUS = 'devview-code-subgraph-validation-passed'
const VALIDATION_SOURCE_FACT_STATUS = 'validated-code-subgraph-source-fact-only'

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

export interface CodeSubgraphMergePlanOptions {
  codeSubgraph?: string
  codeSubgraphValidation?: string
  graphSource?: string
  output?: string
  markdown?: string
}

export interface CodeSubgraphMergePlanFinding {
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
  sourceKind: 'code-subgraph' | 'code-subgraph-validation' | 'graph-source'
  record: JsonRecord | null
  sha256: string | null
  byteLength: number | null
  readError: string | null
}

interface GraphSourceSummary {
  path: string | null
  artifactRole: string | null
  status: string | null
  sha256: string | null
  byteLength: number | null
  nodeCount: number
  edgeCount: number
  idCollisionCount: number
  duplicateEdgeCount: number
}

interface PlannedAdditions {
  codeNodeCount: number
  codeEdgeCount: number
  nodeKinds: Record<string, number>
  edgeTypes: Record<string, number>
  idCollisionCount: number
  duplicateEdgeCount: number
}

export interface CodeSubgraphMergePlanReport extends JsonRecord {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof PASSED_STATUS | typeof BLOCKED_STATUS
  mergePlanScope: typeof REPORT_SCOPE
  sourceFactsOnly: true
  reportOnly: true
  planStatus: typeof PLAN_STATUS | 'blocked'
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
  sourceCodeSubgraphValidation: {
    path: string | null
    artifactRole: string | null
    status: string | null
    codeSubgraphValidationStatus: string | null
    sourceCodeSubgraphPath: string | null
    sourceCodeSubgraphSha256: string | null
    sourceCodeSubgraphByteLength: number | null
    nodeCount: number
    edgeCount: number
  }
  sourceGraph: GraphSourceSummary
  plannedUnifiedGraphAdditions: PlannedAdditions
  unifiedGraphBoundary: {
    separateCodeGraphCreated: false
    maintainabilityGraphMutationPlanned: false
    mutationApplied: false
    graphSourceMutated: false
    graphDeltaApplied: false
    viewTreeGenerated: false
    contextPackGenerated: false
  }
  mergeFindings: CodeSubgraphMergePlanFinding[]
  downstreamActionPlan: string[]
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

export class CodeSubgraphMergePlanError extends Error {
  readonly report: CodeSubgraphMergePlanReport

  constructor(report: CodeSubgraphMergePlanReport) {
    super('Code subgraph unified graph merge plan is blocked.')
    this.report = report
  }
}

export async function planCodeSubgraphMergeFile(
  root: string,
  options: CodeSubgraphMergePlanOptions,
): Promise<CodeSubgraphMergePlanReport> {
  validateRequiredOptions(options)
  const sourcePaths = sourceInputPaths(root, options)
  await assertOutputAuthority(root, sourcePaths, options)

  const codeSubgraph = options.codeSubgraph ? await loadArtifact(root, options.codeSubgraph, 'code-subgraph') : null
  const validation = options.codeSubgraphValidation
    ? await loadArtifact(root, options.codeSubgraphValidation, 'code-subgraph-validation')
    : null
  const graphSource = options.graphSource ? await loadArtifact(root, options.graphSource, 'graph-source') : null

  const findings: CodeSubgraphMergePlanFinding[] = []
  validateLoadedArtifact(codeSubgraph, findings)
  validateLoadedArtifact(validation, findings)
  validateLoadedArtifact(graphSource, findings)
  if (codeSubgraph?.record) {
    validateCodeSubgraphSource(root, codeSubgraph, findings)
  }
  if (validation?.record) {
    validateValidationReport(validation, findings)
  }
  compareSubgraphAndValidation(codeSubgraph, validation, findings)

  const planned = summarizePlannedAdditions(codeSubgraph?.record, validation?.record)
  const graphSummary = summarizeGraphSource(graphSource, codeSubgraph?.record)
  planned.idCollisionCount = graphSummary.idCollisionCount
  planned.duplicateEdgeCount = graphSummary.duplicateEdgeCount

  if (!codeSubgraph?.record && validation?.record) {
    findings.push(
      warning(
        'CODE_SUBGRAPH_MERGE_SOURCE_SUBGRAPH_NOT_SUPPLIED',
        'Only a validation report was supplied; node and edge ids cannot be collision-checked without the source code subgraph.',
        'codeSubgraph',
        validation.relativePath,
      ),
    )
  }
  if (graphSource?.record && !codeSubgraph?.record) {
    findings.push(
      warning(
        'CODE_SUBGRAPH_MERGE_GRAPH_SOURCE_COLLISION_CHECK_LIMITED',
        'Graph-source was supplied, but collision checks require the source code subgraph artifact.',
        'graphSource',
        graphSource.relativePath,
      ),
    )
  }
  if (findings.every((finding) => finding.severity !== 'blocker')) {
    findings.push({
      severity: 'satisfied',
      code: 'CODE_SUBGRAPH_MERGE_PLAN_RECORDED',
      message:
        'Validated code subgraph facts were planned as additions to the unified DevView Maintainability Graph without applying a graph delta.',
      path: options.output ? relativePath(root, resolveRepoPath(root, options.output)) : undefined,
    })
  }

  const blocked = findings.some((finding) => finding.severity === 'blocker')
  const report = buildReport(root, options, codeSubgraph, validation, graphSummary, planned, findings, blocked)
  if (blocked) {
    throw new CodeSubgraphMergePlanError(report)
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

function validateRequiredOptions(options: CodeSubgraphMergePlanOptions): void {
  if (!options.codeSubgraph && !options.codeSubgraphValidation) {
    throw new Error(
      'graph plan-code-subgraph-merge requires --code-subgraph <file> and/or --code-subgraph-validation <file>.',
    )
  }
  if (!options.output) {
    throw new Error('graph plan-code-subgraph-merge requires --output <merge-plan.json>.')
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

function validateLoadedArtifact(artifact: LoadedArtifact | null, findings: CodeSubgraphMergePlanFinding[]): void {
  if (!artifact) return
  if (!artifact.record) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_MERGE_SOURCE_READ_FAILED',
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
        'CODE_SUBGRAPH_MERGE_UNSAFE_AUTHORITY_FLAG',
        `${artifact.relativePath} contains unsafe report-only flag ${hit.field}: true.`,
        hit.field,
        artifact.relativePath,
      ),
    )
  }
  for (const hit of collectExecutableInstructionHits(artifact.record)) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_MERGE_EXECUTABLE_INSTRUCTION_DECLARED',
        `${artifact.relativePath} contains executable/provider/network instruction field ${hit.field}.`,
        hit.field,
        artifact.relativePath,
      ),
    )
  }
}

function validateCodeSubgraphSource(
  root: string,
  source: LoadedArtifact,
  findings: CodeSubgraphMergePlanFinding[],
): void {
  const record = source.record
  if (!record) return
  if (record.artifactRole !== CODE_SUBGRAPH_ROLE) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_MERGE_CODE_SUBGRAPH_ROLE_INVALID',
        `Code subgraph artifactRole must be ${CODE_SUBGRAPH_ROLE}.`,
        'artifactRole',
        source.relativePath,
      ),
    )
  }
  if (record.status !== CODE_SUBGRAPH_STATUS) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_MERGE_CODE_SUBGRAPH_STATUS_INVALID',
        `Code subgraph status must be ${CODE_SUBGRAPH_STATUS}.`,
        'status',
        source.relativePath,
      ),
    )
  }
  if ((record.scope ?? record.codeSubgraphScope) !== CODE_SUBGRAPH_SCOPE) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_MERGE_CODE_SUBGRAPH_SCOPE_INVALID',
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
      findings.push(
        ...error.report.validationFindings
          .filter((finding) => finding.severity === 'blocker')
          .map((finding) =>
            blocker(
              `CODE_SUBGRAPH_MERGE_${finding.code}`,
              `Supplied code subgraph failed validation before merge planning: ${finding.message}`,
              finding.field,
              finding.path,
            ),
          ),
      )
    } else {
      findings.push(
        blocker(
          'CODE_SUBGRAPH_MERGE_CODE_SUBGRAPH_VALIDATION_FAILED',
          error instanceof Error ? error.message : String(error),
          'codeSubgraph',
          source.relativePath,
        ),
      )
    }
  }
}

function validateValidationReport(source: LoadedArtifact, findings: CodeSubgraphMergePlanFinding[]): void {
  const record = source.record
  if (!record) return
  if (record.artifactRole !== VALIDATION_REPORT_ROLE) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_MERGE_VALIDATION_ROLE_INVALID',
        `Code subgraph validation artifactRole must be ${VALIDATION_REPORT_ROLE}.`,
        'artifactRole',
        source.relativePath,
      ),
    )
  }
  if (record.status !== VALIDATION_REPORT_STATUS) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_MERGE_VALIDATION_STATUS_INVALID',
        `Code subgraph validation status must be ${VALIDATION_REPORT_STATUS}.`,
        'status',
        source.relativePath,
      ),
    )
  }
  if (record.codeSubgraphValidationStatus !== VALIDATION_SOURCE_FACT_STATUS) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_MERGE_VALIDATION_SOURCE_FACT_STATUS_INVALID',
        `Code subgraph validation status must be ${VALIDATION_SOURCE_FACT_STATUS}.`,
        'codeSubgraphValidationStatus',
        source.relativePath,
      ),
    )
  }
}

function compareSubgraphAndValidation(
  codeSubgraph: LoadedArtifact | null,
  validation: LoadedArtifact | null,
  findings: CodeSubgraphMergePlanFinding[],
): void {
  if (!codeSubgraph?.record || !validation?.record) return
  const validationSource = asRecord(validation.record.sourceCodeSubgraph)
  const validationSha = stringValue(validationSource?.sha256)
  const validationPath = stringValue(validationSource?.path)
  if (validationSha && codeSubgraph.sha256 && validationSha !== codeSubgraph.sha256) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_MERGE_VALIDATION_SOURCE_DIGEST_MISMATCH',
        'Supplied validation report sha256 does not match the supplied code subgraph.',
        'sourceCodeSubgraph.sha256',
        validation.relativePath,
      ),
    )
  }
  if (!validationSha) {
    findings.push(
      warning(
        'CODE_SUBGRAPH_MERGE_VALIDATION_SOURCE_DIGEST_UNAVAILABLE',
        'Supplied validation report does not include sourceCodeSubgraph.sha256; digest correspondence could not be verified.',
        'sourceCodeSubgraph.sha256',
        validation.relativePath,
      ),
    )
  }
  if (validationPath && normalizePath(validationPath) !== normalizePath(codeSubgraph.relativePath)) {
    findings.push(
      warning(
        'CODE_SUBGRAPH_MERGE_VALIDATION_SOURCE_PATH_DIFFERS',
        `Supplied validation report references ${validationPath}, while --code-subgraph is ${codeSubgraph.relativePath}; sha256 match is treated as the stronger correspondence check.`,
        'sourceCodeSubgraph.path',
        validation.relativePath,
      ),
    )
  }
}

function summarizePlannedAdditions(
  codeSubgraphRecord: JsonRecord | null | undefined,
  validationRecord: JsonRecord | null | undefined,
): PlannedAdditions {
  if (codeSubgraphRecord) {
    const nodes = arrayRecords(codeSubgraphRecord.nodes)
    const edges = arrayRecords(codeSubgraphRecord.edges)
    return {
      codeNodeCount: nodes.length,
      codeEdgeCount: edges.length,
      nodeKinds: countBy(nodes, (entry) => stringValue(entry.kind ?? entry.nodeKind) ?? 'missing'),
      edgeTypes: countBy(edges, (entry) => stringValue(entry.kind ?? entry.edgeType ?? entry.relation) ?? 'missing'),
      idCollisionCount: 0,
      duplicateEdgeCount: 0,
    }
  }

  const nodeSummary = asRecord(validationRecord?.nodeSummary)
  const edgeSummary = asRecord(validationRecord?.edgeSummary)
  return {
    codeNodeCount: numberValue(nodeSummary?.nodeCount) ?? 0,
    codeEdgeCount: numberValue(edgeSummary?.edgeCount) ?? 0,
    nodeKinds: recordOfNumbers(nodeSummary?.codeNodeKindCounts),
    edgeTypes: recordOfNumbers(edgeSummary?.codeEdgeTypeCounts),
    idCollisionCount: 0,
    duplicateEdgeCount: 0,
  }
}

function summarizeGraphSource(
  graphSource: LoadedArtifact | null,
  codeSubgraphRecord: JsonRecord | null | undefined,
): GraphSourceSummary {
  if (!graphSource?.record) {
    return {
      path: graphSource?.relativePath ?? null,
      artifactRole: null,
      status: null,
      sha256: graphSource?.sha256 ?? null,
      byteLength: graphSource?.byteLength ?? null,
      nodeCount: 0,
      edgeCount: 0,
      idCollisionCount: 0,
      duplicateEdgeCount: 0,
    }
  }

  const graphNodes = graphNodeRecords(graphSource.record)
  const graphEdges = graphEdgeRecords(graphSource.record)
  const existingNodeIds = new Set(
    graphNodes
      .map((entry) => stringValue(entry.id ?? entry.nodeId ?? entry.key))
      .filter((entry): entry is string => Boolean(entry))
      .map(normalizePath),
  )
  const existingEdgeIds = new Set(
    graphEdges
      .map((entry) => stringValue(entry.id ?? entry.edgeId ?? entry.key))
      .filter((entry): entry is string => Boolean(entry))
      .map(normalizePath),
  )
  const existingEdgeSignatures = new Set(
    graphEdges.map(edgeSignature).filter((entry): entry is string => Boolean(entry)),
  )

  const codeNodes = arrayRecords(codeSubgraphRecord?.nodes)
  const codeEdges = arrayRecords(codeSubgraphRecord?.edges)
  const idCollisionCount = codeNodes.filter((entry) => {
    const id = stringValue(entry.id)
    return id ? existingNodeIds.has(normalizePath(id)) : false
  }).length
  const duplicateEdgeCount = codeEdges.filter((entry) => {
    const id = stringValue(entry.id)
    const signature = edgeSignature(entry)
    return Boolean(
      (id && existingEdgeIds.has(normalizePath(id))) || (signature && existingEdgeSignatures.has(signature)),
    )
  }).length

  return {
    path: graphSource.relativePath,
    artifactRole: stringValue(graphSource.record.artifactRole),
    status: stringValue(graphSource.record.status),
    sha256: graphSource.sha256,
    byteLength: graphSource.byteLength,
    nodeCount: graphNodes.length,
    edgeCount: graphEdges.length,
    idCollisionCount,
    duplicateEdgeCount,
  }
}

function buildReport(
  root: string,
  options: CodeSubgraphMergePlanOptions,
  codeSubgraph: LoadedArtifact | null,
  validation: LoadedArtifact | null,
  graphSummary: GraphSourceSummary,
  planned: PlannedAdditions,
  findings: CodeSubgraphMergePlanFinding[],
  blocked: boolean,
): CodeSubgraphMergePlanReport {
  const codeRecord = codeSubgraph?.record
  const validationRecord = validation?.record
  const codeNodes = arrayRecords(codeRecord?.nodes)
  const codeEdges = arrayRecords(codeRecord?.edges)
  const validationSource = asRecord(validationRecord?.sourceCodeSubgraph)
  const validationNodeSummary = asRecord(validationRecord?.nodeSummary)
  const validationEdgeSummary = asRecord(validationRecord?.edgeSummary)
  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : PASSED_STATUS,
    mergePlanScope: REPORT_SCOPE,
    sourceFactsOnly: true,
    reportOnly: true,
    planStatus: blocked ? 'blocked' : PLAN_STATUS,
    sourceCodeSubgraph: {
      path: codeSubgraph?.relativePath ?? stringValue(validationSource?.path),
      artifactRole:
        stringValue(codeRecord?.artifactRole) ?? stringValue(validationSource?.artifactRole) ?? CODE_SUBGRAPH_ROLE,
      status: stringValue(codeRecord?.status) ?? stringValue(validationSource?.status) ?? CODE_SUBGRAPH_STATUS,
      scope:
        stringValue(codeRecord?.scope ?? codeRecord?.codeSubgraphScope) ??
        stringValue(validationSource?.scope) ??
        CODE_SUBGRAPH_SCOPE,
      sha256: codeSubgraph?.sha256 ?? stringValue(validationSource?.sha256),
      byteLength: codeSubgraph?.byteLength ?? numberValue(validationSource?.byteLength),
      nodeCount: codeRecord ? codeNodes.length : (numberValue(validationNodeSummary?.nodeCount) ?? 0),
      edgeCount: codeRecord ? codeEdges.length : (numberValue(validationEdgeSummary?.edgeCount) ?? 0),
      nodeKinds: codeRecord
        ? countBy(codeNodes, (entry) => stringValue(entry.kind ?? entry.nodeKind) ?? 'missing')
        : recordOfNumbers(validationNodeSummary?.codeNodeKindCounts),
      edgeTypes: codeRecord
        ? countBy(codeEdges, (entry) => stringValue(entry.kind ?? entry.edgeType ?? entry.relation) ?? 'missing')
        : recordOfNumbers(validationEdgeSummary?.codeEdgeTypeCounts),
    },
    sourceCodeSubgraphValidation: {
      path: validation?.relativePath ?? null,
      artifactRole: stringValue(validationRecord?.artifactRole),
      status: stringValue(validationRecord?.status),
      codeSubgraphValidationStatus: stringValue(validationRecord?.codeSubgraphValidationStatus),
      sourceCodeSubgraphPath: stringValue(validationSource?.path),
      sourceCodeSubgraphSha256: stringValue(validationSource?.sha256),
      sourceCodeSubgraphByteLength: numberValue(validationSource?.byteLength),
      nodeCount: numberValue(validationNodeSummary?.nodeCount) ?? 0,
      edgeCount: numberValue(validationEdgeSummary?.edgeCount) ?? 0,
    },
    sourceGraph: graphSummary,
    plannedUnifiedGraphAdditions: planned,
    unifiedGraphBoundary: {
      separateCodeGraphCreated: false,
      maintainabilityGraphMutationPlanned: false,
      mutationApplied: false,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      viewTreeGenerated: false,
      contextPackGenerated: false,
    },
    mergeFindings: findings,
    downstreamActionPlan: blocked
      ? ['Fix blocking source fact, validation report, graph-source, output authority, or safety findings, then rerun.']
      : [
          'Review this dry-run merge plan as the boundary for adding code nodes and edges into the single DevView Maintainability Graph.',
          'A future guarded mutation slice may transform this plan into a graph delta; this command did not create a separate code graph or mutate graph-source.',
        ],
    sourceArtifactDigests: [
      codeSubgraph,
      validation,
      options.graphSource ? graphSummaryDigest(root, options, graphSummary) : null,
    ]
      .filter((entry): entry is LoadedArtifact | ReturnType<typeof graphSummaryDigest> => Boolean(entry))
      .map((entry) => ({
        sourceKind: entry.sourceKind,
        sourcePath: entry.relativePath,
        sha256: entry.sha256,
        byteLength: entry.byteLength,
      })),
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

function graphSummaryDigest(
  root: string,
  options: CodeSubgraphMergePlanOptions,
  graphSummary: GraphSourceSummary,
): Pick<LoadedArtifact, 'sourceKind' | 'relativePath' | 'sha256' | 'byteLength'> {
  const resolved = resolveRepoPath(root, options.graphSource ?? '')
  return {
    sourceKind: 'graph-source',
    relativePath: graphSummary.path ?? relativePath(root, resolved),
    sha256: graphSummary.sha256,
    byteLength: graphSummary.byteLength,
  }
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: CodeSubgraphMergePlanOptions,
): Promise<void> {
  const outputPath = resolveRepoPath(root, options.output ?? '')
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  const outputs = [
    { kind: 'merge plan output', path: outputPath },
    ...(markdownPath ? [{ kind: 'markdown output', path: markdownPath }] : []),
  ]
  const seenOutputs = new Set<string>()
  for (const output of outputs) {
    const key = pathKey(output.path)
    if (seenOutputs.has(key)) {
      throw new Error('Code subgraph merge plan output and markdown paths must be different.')
    }
    seenOutputs.add(key)
  }

  const sourceSet = new Set(sourcePaths.map(pathKey))
  for (const output of outputs) {
    const relativeTarget = relativePath(root, output.path)
    if (sourceSet.has(pathKey(output.path))) {
      throw new Error(`Code subgraph merge plan ${output.kind} would overwrite a source input: ${relativeTarget}.`)
    }
    if (isProtectedControlPath(root, output.path)) {
      throw new Error(`Code subgraph merge plan ${output.kind} is inside a protected control path: ${relativeTarget}.`)
    }
    const existingAuthority = await classifyExistingSourceAuthority(output.path)
    if (existingAuthority) {
      throw new Error(
        `Code subgraph merge plan ${output.kind} would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(
        `Code subgraph merge plan ${output.kind} would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
  }
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  try {
    const bytes = await readFile(filePath)
    const parsed = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) as JsonRecord
    const role = stringValue(parsed.artifactRole)
    if (role?.includes('graph-source') || role === CODE_SUBGRAPH_ROLE || role === VALIDATION_REPORT_ROLE) {
      return `artifactRole ${role}`
    }
    if (asRecord(parsed.sourceRecords)) {
      return 'source-authority-shaped sourceRecords'
    }
    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      return 'node-edge graph-shaped artifact'
    }
  } catch {
    return null
  }
  return null
}

function sourceInputPaths(root: string, options: CodeSubgraphMergePlanOptions): string[] {
  return [options.codeSubgraph, options.codeSubgraphValidation, options.graphSource]
    .filter((entry): entry is string => Boolean(entry))
    .map((entry) => resolveRepoPath(root, entry))
}

function renderMarkdown(report: CodeSubgraphMergePlanReport): string {
  return [
    '# Code Subgraph Merge Plan',
    '',
    `Status: ${report.status}`,
    `Plan status: ${report.planStatus}`,
    `Code subgraph: \`${report.sourceCodeSubgraph.path ?? 'not-supplied'}\``,
    `Validation: \`${report.sourceCodeSubgraphValidation.path ?? 'not-supplied'}\``,
    `Graph source: \`${report.sourceGraph.path ?? 'not-supplied'}\``,
    '',
    '## Planned Unified Graph Additions',
    '',
    `- Code nodes: ${report.plannedUnifiedGraphAdditions.codeNodeCount}`,
    `- Code edges: ${report.plannedUnifiedGraphAdditions.codeEdgeCount}`,
    `- Node kinds: ${formatCounts(report.plannedUnifiedGraphAdditions.nodeKinds)}`,
    `- Edge types: ${formatCounts(report.plannedUnifiedGraphAdditions.edgeTypes)}`,
    `- Node id collisions: ${report.plannedUnifiedGraphAdditions.idCollisionCount}`,
    `- Duplicate edges: ${report.plannedUnifiedGraphAdditions.duplicateEdgeCount}`,
    '',
    '## Findings',
    '',
    ...report.mergeFindings.map((finding) => `- ${finding.severity}: ${finding.code} - ${finding.message}`),
    '',
    '## Unified Graph Boundary',
    '',
    '- Separate code graph created: false',
    '- Maintainability Graph mutation planned: false',
    '- Graph source mutated: false',
    '- Graph delta applied: false',
    '- View Tree generated: false',
    '- Context Pack generated: false',
  ].join('\n')
}

function graphNodeRecords(record: JsonRecord): JsonRecord[] {
  const sourceRecords = asRecord(record.sourceRecords)
  const graph = asRecord(record.graph)
  return firstNonEmptyRecords(record.nodes, sourceRecords?.nodes, graph?.nodes, record.records)
}

function graphEdgeRecords(record: JsonRecord): JsonRecord[] {
  const sourceRecords = asRecord(record.sourceRecords)
  const graph = asRecord(record.graph)
  return firstNonEmptyRecords(record.edges, sourceRecords?.edges, graph?.edges)
}

function firstNonEmptyRecords(...values: unknown[]): JsonRecord[] {
  for (const value of values) {
    const records = arrayRecords(value)
    if (records.length > 0) return records
  }
  return []
}

function edgeSignature(edge: JsonRecord): string | null {
  const from = stringValue(edge.from ?? edge.source ?? edge.sourceId ?? edge.sourceNodeId)
  const to = stringValue(edge.to ?? edge.target ?? edge.targetId ?? edge.targetNodeId)
  const kind = stringValue(edge.kind ?? edge.edgeType ?? edge.relation ?? edge.type)
  return from && to && kind ? `${normalizePath(from)}|${normalizePath(kind)}|${normalizePath(to)}` : null
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

function blocker(code: string, message: string, field?: string, pathValue?: string): CodeSubgraphMergePlanFinding {
  return { severity: 'blocker', code, message, field, path: pathValue }
}

function warning(code: string, message: string, field?: string, pathValue?: string): CodeSubgraphMergePlanFinding {
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

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function recordOfNumbers(value: unknown): Record<string, number> {
  const record = asRecord(value)
  if (!record) return {}
  const entries = Object.entries(record).filter((entry): entry is [string, number] => typeof entry[1] === 'number')
  return Object.fromEntries(entries.sort(([left], [right]) => left.localeCompare(right)))
}

function countBy(values: JsonRecord[], key: (value: JsonRecord) => string): Record<string, number> {
  const result: Record<string, number> = {}
  for (const value of values) {
    const name = key(value)
    result[name] = (result[name] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)))
}

function formatCounts(counts: Record<string, number>): string {
  const entries = Object.entries(counts)
  return entries.length === 0 ? 'none' : entries.map(([kind, count]) => `${kind}:${count}`).join(', ')
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
