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

const LINKS_ROLE = 'devview-code-symbol-links'
const LINKS_STATUS = 'devview-code-symbol-links-supplied'
const LINKS_SCOPE = 'code-symbol-link-source-fact-only'
const REPORT_ROLE = 'devview-code-symbol-link-validation-report'
const PASSED_STATUS = 'devview-code-symbol-link-validation-passed'
const BLOCKED_STATUS = 'devview-code-symbol-link-validation-blocked'
const REPORT_SCOPE = 'code-symbol-link-validation-report-only'
const CODE_SUBGRAPH_ROLE = 'devview-code-subgraph'
const CODE_SUBGRAPH_STATUS = 'devview-code-subgraph-supplied'
const CODE_SUBGRAPH_SCOPE = 'code-subgraph-source-fact-only'
const CODE_SUBGRAPH_VALIDATION_ROLE = 'devview-code-subgraph-validation-report'
const CODE_SUBGRAPH_VALIDATION_STATUS = 'devview-code-subgraph-validation-passed'
const CODE_SUBGRAPH_VALIDATION_SOURCE_FACT_STATUS = 'validated-code-subgraph-source-fact-only'
const CODE_SUBGRAPH_MERGE_PLAN_ROLE = 'devview-code-subgraph-merge-plan-report'
const CODE_SUBGRAPH_MERGE_PLAN_STATUS = 'devview-code-subgraph-merge-plan-recorded'
const CODE_SUBGRAPH_MERGE_PLAN_SCOPE = 'code-subgraph-merge-plan-report-only'

const sourceNodeKinds = [
  'task',
  'change',
  'check',
  'evidence',
  'requirement',
  'decision',
  'finding',
  'risk',
  'test',
  'document',
  'module',
  'project',
] as const

const codeNodeKinds = [
  'file',
  'module',
  'package',
  'class',
  'interface',
  'type',
  'function',
  'method',
  'field',
  'component',
  'route',
  'test',
  'config',
  'external_dependency',
] as const

const linkTypes = [
  'touches',
  'modifies',
  'verifies',
  'covers',
  'satisfies',
  'implements_requirement',
  'documents',
  'constrains',
  'depends_on',
  'reports_on',
] as const

const confidenceValues = ['extracted', 'inferred', 'ambiguous'] as const

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

export interface CodeSymbolLinkValidationOptions {
  links?: string
  codeSubgraph?: string
  codeSubgraphValidation?: string
  codeSubgraphMergePlan?: string
  graphSource?: string
  output?: string
  markdown?: string
}

export interface CodeSymbolLinkValidationFinding {
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
  sourceKind:
    | 'code-symbol-links'
    | 'code-subgraph'
    | 'code-subgraph-validation'
    | 'code-subgraph-merge-plan'
    | 'graph-source'
  record: JsonRecord | null
  sha256: string | null
  byteLength: number | null
  readError: string | null
}

interface CodeNodeIndex {
  nodesById: Map<string, JsonRecord>
  nodes: JsonRecord[]
  edges: JsonRecord[]
}

interface GraphNodeIndex {
  nodeIds: Set<string>
  nodes: JsonRecord[]
  edges: JsonRecord[]
}

interface LinkAnalysis {
  linkCount: number
  byLinkType: Record<string, number>
  bySourceNodeKind: Record<string, number>
  byTargetCodeNodeKind: Record<string, number>
  verifiedCodeEndpointCount: number
  verifiedMaintenanceEndpointCount: number
  unverifiedMaintenanceEndpointCount: number
  missingCodeEndpointIds: string[]
  missingMaintenanceEndpointIds: string[]
  kindMismatches: Array<{
    linkId: string
    targetCodeNodeId: string
    declaredKind: string
    actualKind: string
  }>
  duplicateLinkIds: string[]
  duplicateLinkSignatures: Array<{
    signature: string
    linkIds: string[]
  }>
}

export interface ValidatedCodeSymbolLink {
  id: string
  sourceNodeId: string
  targetCodeNodeId: string
  linkType: string
  sourceNodeKind: string
  targetCodeNodeKind: string
  sourceFile?: string
  sourceLocationStatus?: string
  sourceLocation?: unknown
  confidence: string
}

export interface CodeSymbolLinkValidationReport extends JsonRecord {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof PASSED_STATUS | typeof BLOCKED_STATUS
  scope: typeof REPORT_SCOPE
  validationScope: typeof REPORT_SCOPE
  sourceFactsOnly: true
  reportOnly: true
  sourceLinks: {
    path: string
    artifactRole: string | null
    status: string | null
    scope: string | null
    sha256: string | null
    byteLength: number | null
    linkCount: number
  }
  sourceCodeSubgraph: {
    path: string
    artifactRole: string | null
    status: string | null
    scope: string | null
    sha256: string | null
    byteLength: number | null
    nodeCount: number
    edgeCount: number
    nodeKinds: Record<string, number>
  }
  sourceCodeSubgraphValidation: {
    path: string | null
    artifactRole: string | null
    status: string | null
    codeSubgraphValidationStatus: string | null
    sourceCodeSubgraphPath: string | null
    sourceCodeSubgraphSha256: string | null
  }
  sourceCodeSubgraphMergePlan: {
    path: string | null
    artifactRole: string | null
    status: string | null
    planStatus: string | null
    sourceCodeSubgraphPath: string | null
    sourceCodeSubgraphSha256: string | null
    plannedCodeNodeCount: number
    plannedCodeEdgeCount: number
  }
  sourceGraph: {
    path: string | null
    artifactRole: string | null
    status: string | null
    sha256: string | null
    byteLength: number | null
    nodeCount: number
    edgeCount: number
  }
  linkValidationSummary: {
    total: number
    byLinkType: Record<string, number>
    bySourceNodeKind: Record<string, number>
    byTargetCodeNodeKind: Record<string, number>
    verifiedCodeEndpointCount: number
    verifiedMaintenanceEndpointCount: number
    unverifiedMaintenanceEndpointCount: number
  }
  missingEndpointSummary: {
    missingCodeEndpointCount: number
    missingCodeEndpointIds: string[]
    missingMaintenanceEndpointCount: number
    missingMaintenanceEndpointIds: string[]
    codeKindMismatchCount: number
    codeKindMismatches: LinkAnalysis['kindMismatches']
  }
  duplicateSummary: {
    duplicateIdCount: number
    duplicateIds: string[]
    duplicateSignatureCount: number
    duplicateSignatures: LinkAnalysis['duplicateLinkSignatures']
  }
  validatedLinks: ValidatedCodeSymbolLink[]
  vocabulary: {
    allowedSourceNodeKinds: string[]
    allowedTargetCodeNodeKinds: string[]
    allowedLinkTypes: string[]
    allowedConfidenceValues: string[]
  }
  unifiedGraphBoundary: {
    separateCodeGraphCreated: false
    graphSourceMutated: false
    graphDeltaApplied: false
    viewTreeGenerated: false
    contextPackGenerated: false
  }
  validationFindings: CodeSymbolLinkValidationFinding[]
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

export class CodeSymbolLinkValidationError extends Error {
  readonly report: CodeSymbolLinkValidationReport

  constructor(report: CodeSymbolLinkValidationReport) {
    super('Code symbol link validation is blocked.')
    this.report = report
  }
}

export async function validateCodeSymbolLinksFile(
  root: string,
  options: CodeSymbolLinkValidationOptions,
): Promise<CodeSymbolLinkValidationReport> {
  validateRequiredOptions(options)
  const sourcePaths = sourceInputPaths(root, options)
  await assertOutputAuthority(root, sourcePaths, options)

  const links = await loadArtifact(root, options.links ?? '', 'code-symbol-links')
  const codeSubgraph = await loadArtifact(root, options.codeSubgraph ?? '', 'code-subgraph')
  const validation = options.codeSubgraphValidation
    ? await loadArtifact(root, options.codeSubgraphValidation, 'code-subgraph-validation')
    : null
  const mergePlan = options.codeSubgraphMergePlan
    ? await loadArtifact(root, options.codeSubgraphMergePlan, 'code-subgraph-merge-plan')
    : null
  const graphSource = options.graphSource ? await loadArtifact(root, options.graphSource, 'graph-source') : null

  const findings: CodeSymbolLinkValidationFinding[] = []
  for (const artifact of [links, codeSubgraph, validation, mergePlan, graphSource]) {
    validateLoadedArtifact(artifact, findings)
  }
  if (links.record) {
    validateLinksEnvelope(links, findings)
  }
  if (codeSubgraph.record) {
    validateCodeSubgraphSource(root, codeSubgraph, findings)
  }
  if (validation?.record) {
    validateCodeSubgraphValidationReport(validation, findings)
  }
  if (mergePlan?.record) {
    validateCodeSubgraphMergePlan(mergePlan, findings)
  }
  compareCodeSourceDigests(codeSubgraph, validation, mergePlan, findings)

  const codeIndex = buildCodeNodeIndex(codeSubgraph.record)
  const graphIndex = graphSource?.record ? buildGraphNodeIndex(graphSource.record) : null
  const analysis = validateLinks(links, codeIndex, graphIndex, findings)
  if (!graphIndex && analysis.linkCount > 0) {
    findings.push(
      warning(
        'CODE_SYMBOL_LINK_MAINTENANCE_ENDPOINTS_UNVERIFIED',
        'No graph-source was supplied; maintenance-side sourceNodeId endpoints were recorded as unverified.',
        'graphSource',
        links.relativePath,
      ),
    )
  }

  if (findings.every((finding) => finding.severity !== 'blocker')) {
    findings.push({
      severity: 'satisfied',
      code: 'CODE_SYMBOL_LINKS_VALIDATED',
      message:
        'Code symbol links were validated as report-only source facts for future unified Maintainability Graph integration.',
      path: options.output ? relativePath(root, resolveRepoPath(root, options.output)) : undefined,
    })
  }

  const blocked = findings.some((finding) => finding.severity === 'blocker')
  const report = buildReport(links, codeSubgraph, validation, mergePlan, graphSource, analysis, findings, blocked)
  if (blocked) {
    throw new CodeSymbolLinkValidationError(report)
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

function validateRequiredOptions(options: CodeSymbolLinkValidationOptions): void {
  if (!options.links) {
    throw new Error('graph validate-code-symbol-links requires --links <code-symbol-links.json>.')
  }
  if (!options.codeSubgraph) {
    throw new Error('graph validate-code-symbol-links requires --code-subgraph <devview-code-subgraph.json>.')
  }
  if (!options.output) {
    throw new Error('graph validate-code-symbol-links requires --output <validation.json>.')
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

function validateLoadedArtifact(artifact: LoadedArtifact | null, findings: CodeSymbolLinkValidationFinding[]): void {
  if (!artifact) return
  if (!artifact.record) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_SOURCE_READ_FAILED',
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
        'CODE_SYMBOL_LINK_UNSAFE_AUTHORITY_FLAG',
        `${artifact.relativePath} contains unsafe report-only flag ${hit.field}: true.`,
        hit.field,
        artifact.relativePath,
      ),
    )
  }
  for (const hit of collectExecutableInstructionHits(artifact.record)) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_EXECUTABLE_INSTRUCTION_DECLARED',
        `${artifact.relativePath} contains executable/provider/network instruction field ${hit.field}.`,
        hit.field,
        artifact.relativePath,
      ),
    )
  }
}

function validateLinksEnvelope(source: LoadedArtifact, findings: CodeSymbolLinkValidationFinding[]): void {
  const record = source.record
  if (!record) return
  if (record.artifactRole !== LINKS_ROLE) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_ROLE_INVALID',
        `Links artifactRole must be ${LINKS_ROLE}.`,
        'artifactRole',
        source.relativePath,
      ),
    )
  }
  if (record.status !== LINKS_STATUS) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_STATUS_INVALID',
        `Links status must be ${LINKS_STATUS}.`,
        'status',
        source.relativePath,
      ),
    )
  }
  if ((record.scope ?? record.linkScope) !== LINKS_SCOPE) {
    findings.push(
      blocker('CODE_SYMBOL_LINK_SCOPE_INVALID', `Links scope must be ${LINKS_SCOPE}.`, 'scope', source.relativePath),
    )
  }
  if (!Array.isArray(record.links)) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINKS_INVALID',
        'Code symbol links artifact must contain links array.',
        'links',
        source.relativePath,
      ),
    )
  }
}

function validateCodeSubgraphSource(
  root: string,
  source: LoadedArtifact,
  findings: CodeSymbolLinkValidationFinding[],
): void {
  const record = source.record
  if (!record) return
  if (record.artifactRole !== CODE_SUBGRAPH_ROLE) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_CODE_SUBGRAPH_ROLE_INVALID',
        `Code subgraph artifactRole must be ${CODE_SUBGRAPH_ROLE}.`,
        'artifactRole',
        source.relativePath,
      ),
    )
  }
  if (record.status !== CODE_SUBGRAPH_STATUS) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_CODE_SUBGRAPH_STATUS_INVALID',
        `Code subgraph status must be ${CODE_SUBGRAPH_STATUS}.`,
        'status',
        source.relativePath,
      ),
    )
  }
  if ((record.scope ?? record.codeSubgraphScope) !== CODE_SUBGRAPH_SCOPE) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_CODE_SUBGRAPH_SCOPE_INVALID',
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
              `CODE_SYMBOL_LINK_${finding.code}`,
              `Supplied code subgraph failed validation before link validation: ${finding.message}`,
              finding.field,
              finding.path,
            ),
          ),
      )
    } else {
      findings.push(
        blocker(
          'CODE_SYMBOL_LINK_CODE_SUBGRAPH_VALIDATION_FAILED',
          error instanceof Error ? error.message : String(error),
          'codeSubgraph',
          source.relativePath,
        ),
      )
    }
  }
}

function validateCodeSubgraphValidationReport(
  source: LoadedArtifact,
  findings: CodeSymbolLinkValidationFinding[],
): void {
  const record = source.record
  if (!record) return
  if (record.artifactRole !== CODE_SUBGRAPH_VALIDATION_ROLE) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_CODE_SUBGRAPH_VALIDATION_ROLE_INVALID',
        `Code subgraph validation artifactRole must be ${CODE_SUBGRAPH_VALIDATION_ROLE}.`,
        'artifactRole',
        source.relativePath,
      ),
    )
  }
  if (record.status !== CODE_SUBGRAPH_VALIDATION_STATUS) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_CODE_SUBGRAPH_VALIDATION_STATUS_INVALID',
        `Code subgraph validation status must be ${CODE_SUBGRAPH_VALIDATION_STATUS}.`,
        'status',
        source.relativePath,
      ),
    )
  }
  if (record.codeSubgraphValidationStatus !== CODE_SUBGRAPH_VALIDATION_SOURCE_FACT_STATUS) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_CODE_SUBGRAPH_VALIDATION_SOURCE_FACT_STATUS_INVALID',
        `Code subgraph validation status must be ${CODE_SUBGRAPH_VALIDATION_SOURCE_FACT_STATUS}.`,
        'codeSubgraphValidationStatus',
        source.relativePath,
      ),
    )
  }
}

function validateCodeSubgraphMergePlan(source: LoadedArtifact, findings: CodeSymbolLinkValidationFinding[]): void {
  const record = source.record
  if (!record) return
  if (record.artifactRole !== CODE_SUBGRAPH_MERGE_PLAN_ROLE) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_CODE_SUBGRAPH_MERGE_PLAN_ROLE_INVALID',
        `Code subgraph merge plan artifactRole must be ${CODE_SUBGRAPH_MERGE_PLAN_ROLE}.`,
        'artifactRole',
        source.relativePath,
      ),
    )
  }
  if (record.status !== CODE_SUBGRAPH_MERGE_PLAN_STATUS) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_CODE_SUBGRAPH_MERGE_PLAN_STATUS_INVALID',
        `Code subgraph merge plan status must be ${CODE_SUBGRAPH_MERGE_PLAN_STATUS}.`,
        'status',
        source.relativePath,
      ),
    )
  }
  const scope = record.scope ?? record.mergePlanScope
  if (scope !== CODE_SUBGRAPH_MERGE_PLAN_SCOPE) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_CODE_SUBGRAPH_MERGE_PLAN_SCOPE_INVALID',
        `Code subgraph merge plan scope must be ${CODE_SUBGRAPH_MERGE_PLAN_SCOPE}.`,
        'scope',
        source.relativePath,
      ),
    )
  }
}

function compareCodeSourceDigests(
  codeSubgraph: LoadedArtifact,
  validation: LoadedArtifact | null,
  mergePlan: LoadedArtifact | null,
  findings: CodeSymbolLinkValidationFinding[],
): void {
  const validationSource = asRecord(validation?.record?.sourceCodeSubgraph)
  const validationSha = stringValue(validationSource?.sha256)
  if (validation?.record && validationSha && codeSubgraph.sha256 && validationSha !== codeSubgraph.sha256) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_CODE_SUBGRAPH_VALIDATION_DIGEST_MISMATCH',
        'Supplied code subgraph validation report sha256 does not match --code-subgraph.',
        'sourceCodeSubgraph.sha256',
        validation.relativePath,
      ),
    )
  }
  if (validation?.record && !validationSha) {
    findings.push(
      warning(
        'CODE_SYMBOL_LINK_CODE_SUBGRAPH_VALIDATION_DIGEST_UNAVAILABLE',
        'Supplied code subgraph validation report does not include sourceCodeSubgraph.sha256.',
        'sourceCodeSubgraph.sha256',
        validation.relativePath,
      ),
    )
  }

  const mergeSource = asRecord(mergePlan?.record?.sourceCodeSubgraph)
  const mergeSha = stringValue(mergeSource?.sha256)
  if (mergePlan?.record && mergeSha && codeSubgraph.sha256 && mergeSha !== codeSubgraph.sha256) {
    findings.push(
      blocker(
        'CODE_SYMBOL_LINK_CODE_SUBGRAPH_MERGE_PLAN_DIGEST_MISMATCH',
        'Supplied code subgraph merge plan sha256 does not match --code-subgraph.',
        'sourceCodeSubgraph.sha256',
        mergePlan.relativePath,
      ),
    )
  }
  if (mergePlan?.record && !mergeSha) {
    findings.push(
      warning(
        'CODE_SYMBOL_LINK_CODE_SUBGRAPH_MERGE_PLAN_DIGEST_UNAVAILABLE',
        'Supplied code subgraph merge plan does not include sourceCodeSubgraph.sha256.',
        'sourceCodeSubgraph.sha256',
        mergePlan.relativePath,
      ),
    )
  }
}

function validateLinks(
  links: LoadedArtifact,
  codeIndex: CodeNodeIndex,
  graphIndex: GraphNodeIndex | null,
  findings: CodeSymbolLinkValidationFinding[],
): LinkAnalysis {
  const linkRecords = arrayRecords(links.record?.links)
  const duplicateLinkIds: string[] = []
  const duplicateLinkSignatures: LinkAnalysis['duplicateLinkSignatures'] = []
  const missingCodeEndpointIds = new Set<string>()
  const missingMaintenanceEndpointIds = new Set<string>()
  const kindMismatches: LinkAnalysis['kindMismatches'] = []
  const seenIds = new Set<string>()
  const signatures = new Map<string, string[]>()
  let verifiedCodeEndpointCount = 0
  let verifiedMaintenanceEndpointCount = 0
  let unverifiedMaintenanceEndpointCount = 0

  for (const [index, link] of linkRecords.entries()) {
    const prefix = `links[${index}]`
    const id = stringValue(link.id)
    const sourceNodeId = stringValue(link.sourceNodeId ?? link.source)
    const targetCodeNodeId = stringValue(link.targetCodeNodeId ?? link.targetCodeNode ?? link.target)
    const linkType = stringValue(link.linkType ?? link.type)?.toLowerCase()
    const sourceNodeKind = stringValue(link.sourceNodeKind ?? link.sourceKind)?.toLowerCase()
    const targetCodeNodeKind = stringValue(link.targetCodeNodeKind ?? link.targetKind)?.toLowerCase()
    const confidence = stringValue(link.confidence)?.toLowerCase()
    const sourceFile = stringValue(link.sourceFile ?? link.source_file)
    const sourceLocationStatus = stringValue(link.sourceLocationStatus)

    if (!id) {
      findings.push(
        blocker('CODE_SYMBOL_LINK_ID_MISSING', `${prefix}.id is required.`, `${prefix}.id`, links.relativePath),
      )
    } else if (seenIds.has(normalizePath(id))) {
      duplicateLinkIds.push(id)
      findings.push(
        blocker(
          'CODE_SYMBOL_LINK_ID_DUPLICATE',
          `Code symbol link id is duplicated: ${id}.`,
          `${prefix}.id`,
          links.relativePath,
        ),
      )
    } else {
      seenIds.add(normalizePath(id))
    }

    if (!sourceNodeId) {
      findings.push(
        blocker(
          'CODE_SYMBOL_LINK_SOURCE_NODE_ID_MISSING',
          `${prefix}.sourceNodeId is required.`,
          `${prefix}.sourceNodeId`,
          links.relativePath,
        ),
      )
    }
    if (!targetCodeNodeId) {
      findings.push(
        blocker(
          'CODE_SYMBOL_LINK_TARGET_CODE_NODE_ID_MISSING',
          `${prefix}.targetCodeNodeId is required.`,
          `${prefix}.targetCodeNodeId`,
          links.relativePath,
        ),
      )
    }
    if (!linkType || !includesString(linkTypes, linkType)) {
      findings.push(
        blocker(
          'CODE_SYMBOL_LINK_TYPE_UNSUPPORTED',
          `${prefix}.linkType must be one of the supported code-symbol link types.`,
          `${prefix}.linkType`,
          links.relativePath,
        ),
      )
    }
    if (!sourceNodeKind || !includesString(sourceNodeKinds, sourceNodeKind)) {
      findings.push(
        blocker(
          'CODE_SYMBOL_LINK_SOURCE_KIND_UNSUPPORTED',
          `${prefix}.sourceNodeKind must be one of the supported maintenance node kinds.`,
          `${prefix}.sourceNodeKind`,
          links.relativePath,
        ),
      )
    }
    if (!targetCodeNodeKind || !includesString(codeNodeKinds, targetCodeNodeKind)) {
      findings.push(
        blocker(
          'CODE_SYMBOL_LINK_TARGET_KIND_UNSUPPORTED',
          `${prefix}.targetCodeNodeKind must be one of the supported code node kinds.`,
          `${prefix}.targetCodeNodeKind`,
          links.relativePath,
        ),
      )
    }
    if (!sourceFile && !sourceLocationStatus) {
      findings.push(
        blocker(
          'CODE_SYMBOL_LINK_PROVENANCE_MISSING',
          `${prefix}.sourceFile or sourceLocationStatus is required.`,
          `${prefix}.sourceFile`,
          links.relativePath,
        ),
      )
    }
    if (!confidence || !includesString(confidenceValues, confidence)) {
      findings.push(
        blocker(
          'CODE_SYMBOL_LINK_CONFIDENCE_INVALID',
          `${prefix}.confidence must be extracted, inferred, or ambiguous.`,
          `${prefix}.confidence`,
          links.relativePath,
        ),
      )
    }

    if (sourceNodeId && targetCodeNodeId && linkType) {
      const signature = `${normalizePath(sourceNodeId)}|${normalizePath(linkType)}|${normalizePath(targetCodeNodeId)}`
      signatures.set(signature, [...(signatures.get(signature) ?? []), id ?? `${prefix}:missing-id`])
    }

    if (targetCodeNodeId) {
      const codeNode = codeIndex.nodesById.get(normalizePath(targetCodeNodeId))
      if (!codeNode) {
        missingCodeEndpointIds.add(targetCodeNodeId)
        findings.push(
          blocker(
            'CODE_SYMBOL_LINK_CODE_ENDPOINT_MISSING',
            `${prefix}.targetCodeNodeId does not exist in the supplied code subgraph: ${targetCodeNodeId}.`,
            `${prefix}.targetCodeNodeId`,
            links.relativePath,
          ),
        )
      } else {
        verifiedCodeEndpointCount += 1
        const actualKind = stringValue(codeNode.kind ?? codeNode.nodeKind)?.toLowerCase()
        if (targetCodeNodeKind && actualKind && targetCodeNodeKind !== actualKind) {
          kindMismatches.push({
            linkId: id ?? `${prefix}:missing-id`,
            targetCodeNodeId,
            declaredKind: targetCodeNodeKind,
            actualKind,
          })
          findings.push(
            blocker(
              'CODE_SYMBOL_LINK_CODE_KIND_MISMATCH',
              `${prefix}.targetCodeNodeKind is ${targetCodeNodeKind}, but code subgraph node kind is ${actualKind}.`,
              `${prefix}.targetCodeNodeKind`,
              links.relativePath,
            ),
          )
        }
      }
    }

    if (sourceNodeId && graphIndex) {
      if (graphIndex.nodeIds.has(normalizePath(sourceNodeId))) {
        verifiedMaintenanceEndpointCount += 1
      } else {
        missingMaintenanceEndpointIds.add(sourceNodeId)
        findings.push(
          blocker(
            'CODE_SYMBOL_LINK_MAINTENANCE_ENDPOINT_MISSING',
            `${prefix}.sourceNodeId does not exist in the supplied graph-source: ${sourceNodeId}.`,
            `${prefix}.sourceNodeId`,
            links.relativePath,
          ),
        )
      }
    } else if (sourceNodeId && !graphIndex) {
      unverifiedMaintenanceEndpointCount += 1
    }
  }

  for (const [signature, ids] of signatures.entries()) {
    if (ids.length > 1) {
      duplicateLinkSignatures.push({ signature, linkIds: ids.sort() })
      findings.push(
        warning(
          'CODE_SYMBOL_LINK_DUPLICATE_SIGNATURE',
          `Multiple links declare the same source/linkType/target tuple: ${signature}.`,
          'links',
          links.relativePath,
        ),
      )
    }
  }

  return {
    linkCount: linkRecords.length,
    byLinkType: countBy(linkRecords, (entry) => stringValue(entry.linkType ?? entry.type)?.toLowerCase() ?? 'missing'),
    bySourceNodeKind: countBy(
      linkRecords,
      (entry) => stringValue(entry.sourceNodeKind ?? entry.sourceKind)?.toLowerCase() ?? 'missing',
    ),
    byTargetCodeNodeKind: countBy(
      linkRecords,
      (entry) => stringValue(entry.targetCodeNodeKind ?? entry.targetKind)?.toLowerCase() ?? 'missing',
    ),
    verifiedCodeEndpointCount,
    verifiedMaintenanceEndpointCount,
    unverifiedMaintenanceEndpointCount,
    missingCodeEndpointIds: [...missingCodeEndpointIds].sort(),
    missingMaintenanceEndpointIds: [...missingMaintenanceEndpointIds].sort(),
    kindMismatches,
    duplicateLinkIds: [...new Set(duplicateLinkIds)].sort(),
    duplicateLinkSignatures,
  }
}

function buildCodeNodeIndex(record: JsonRecord | null): CodeNodeIndex {
  const nodes = arrayRecords(record?.nodes)
  return {
    nodes,
    edges: arrayRecords(record?.edges),
    nodesById: new Map(
      nodes
        .map((entry) => [stringValue(entry.id), entry] as const)
        .filter((entry): entry is readonly [string, JsonRecord] => Boolean(entry[0]))
        .map(([id, entry]) => [normalizePath(id), entry]),
    ),
  }
}

function buildGraphNodeIndex(record: JsonRecord): GraphNodeIndex {
  const nodes = graphNodeRecords(record)
  const edges = graphEdgeRecords(record)
  return {
    nodes,
    edges,
    nodeIds: new Set(
      nodes
        .map((entry) => stringValue(entry.id ?? entry.nodeId ?? entry.key))
        .filter((entry): entry is string => Boolean(entry))
        .map(normalizePath),
    ),
  }
}

function buildReport(
  links: LoadedArtifact,
  codeSubgraph: LoadedArtifact,
  validation: LoadedArtifact | null,
  mergePlan: LoadedArtifact | null,
  graphSource: LoadedArtifact | null,
  analysis: LinkAnalysis,
  findings: CodeSymbolLinkValidationFinding[],
  blocked: boolean,
): CodeSymbolLinkValidationReport {
  const linkRecord = links.record
  const codeRecord = codeSubgraph.record
  const codeIndex = buildCodeNodeIndex(codeRecord)
  const validationSource = asRecord(validation?.record?.sourceCodeSubgraph)
  const mergeSource = asRecord(mergePlan?.record?.sourceCodeSubgraph)
  const planned = asRecord(mergePlan?.record?.plannedUnifiedGraphAdditions)
  const graphIndex = graphSource?.record ? buildGraphNodeIndex(graphSource.record) : null
  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : PASSED_STATUS,
    scope: REPORT_SCOPE,
    validationScope: REPORT_SCOPE,
    sourceFactsOnly: true,
    reportOnly: true,
    sourceLinks: {
      path: links.relativePath,
      artifactRole: stringValue(linkRecord?.artifactRole),
      status: stringValue(linkRecord?.status),
      scope: stringValue(linkRecord?.scope ?? linkRecord?.linkScope),
      sha256: links.sha256,
      byteLength: links.byteLength,
      linkCount: arrayRecords(linkRecord?.links).length,
    },
    sourceCodeSubgraph: {
      path: codeSubgraph.relativePath,
      artifactRole: stringValue(codeRecord?.artifactRole),
      status: stringValue(codeRecord?.status),
      scope: stringValue(codeRecord?.scope ?? codeRecord?.codeSubgraphScope),
      sha256: codeSubgraph.sha256,
      byteLength: codeSubgraph.byteLength,
      nodeCount: codeIndex.nodes.length,
      edgeCount: codeIndex.edges.length,
      nodeKinds: countBy(codeIndex.nodes, (entry) => stringValue(entry.kind ?? entry.nodeKind) ?? 'missing'),
    },
    sourceCodeSubgraphValidation: {
      path: validation?.relativePath ?? null,
      artifactRole: stringValue(validation?.record?.artifactRole),
      status: stringValue(validation?.record?.status),
      codeSubgraphValidationStatus: stringValue(validation?.record?.codeSubgraphValidationStatus),
      sourceCodeSubgraphPath: stringValue(validationSource?.path),
      sourceCodeSubgraphSha256: stringValue(validationSource?.sha256),
    },
    sourceCodeSubgraphMergePlan: {
      path: mergePlan?.relativePath ?? null,
      artifactRole: stringValue(mergePlan?.record?.artifactRole),
      status: stringValue(mergePlan?.record?.status),
      planStatus: stringValue(mergePlan?.record?.planStatus),
      sourceCodeSubgraphPath: stringValue(mergeSource?.path),
      sourceCodeSubgraphSha256: stringValue(mergeSource?.sha256),
      plannedCodeNodeCount: numberValue(planned?.codeNodeCount) ?? 0,
      plannedCodeEdgeCount: numberValue(planned?.codeEdgeCount) ?? 0,
    },
    sourceGraph: {
      path: graphSource?.relativePath ?? null,
      artifactRole: stringValue(graphSource?.record?.artifactRole),
      status: stringValue(graphSource?.record?.status),
      sha256: graphSource?.sha256 ?? null,
      byteLength: graphSource?.byteLength ?? null,
      nodeCount: graphIndex?.nodes.length ?? 0,
      edgeCount: graphIndex?.edges.length ?? 0,
    },
    linkValidationSummary: {
      total: analysis.linkCount,
      byLinkType: analysis.byLinkType,
      bySourceNodeKind: analysis.bySourceNodeKind,
      byTargetCodeNodeKind: analysis.byTargetCodeNodeKind,
      verifiedCodeEndpointCount: analysis.verifiedCodeEndpointCount,
      verifiedMaintenanceEndpointCount: analysis.verifiedMaintenanceEndpointCount,
      unverifiedMaintenanceEndpointCount: analysis.unverifiedMaintenanceEndpointCount,
    },
    missingEndpointSummary: {
      missingCodeEndpointCount: analysis.missingCodeEndpointIds.length,
      missingCodeEndpointIds: analysis.missingCodeEndpointIds,
      missingMaintenanceEndpointCount: analysis.missingMaintenanceEndpointIds.length,
      missingMaintenanceEndpointIds: analysis.missingMaintenanceEndpointIds,
      codeKindMismatchCount: analysis.kindMismatches.length,
      codeKindMismatches: analysis.kindMismatches,
    },
    duplicateSummary: {
      duplicateIdCount: analysis.duplicateLinkIds.length,
      duplicateIds: analysis.duplicateLinkIds,
      duplicateSignatureCount: analysis.duplicateLinkSignatures.length,
      duplicateSignatures: analysis.duplicateLinkSignatures,
    },
    validatedLinks: extractValidatedLinks(linkRecord),
    vocabulary: {
      allowedSourceNodeKinds: [...sourceNodeKinds],
      allowedTargetCodeNodeKinds: [...codeNodeKinds],
      allowedLinkTypes: [...linkTypes],
      allowedConfidenceValues: [...confidenceValues],
    },
    unifiedGraphBoundary: {
      separateCodeGraphCreated: false,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      viewTreeGenerated: false,
      contextPackGenerated: false,
    },
    validationFindings: findings,
    downstreamActionPlan: blocked
      ? [
          'Fix blocking link artifact, code endpoint, maintenance endpoint, vocabulary, provenance, or safety findings, then rerun validation.',
        ]
      : [
          'Feed these validated code-symbol links into a future unified Maintainability Graph merge plan alongside code subgraph additions.',
          'Use link targets to inform the next View Tree / Context Pack symbol-awareness tranche without treating this report as graph-source mutation.',
        ],
    sourceArtifactDigests: [links, codeSubgraph, validation, mergePlan, graphSource]
      .filter((entry): entry is LoadedArtifact => Boolean(entry))
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

function extractValidatedLinks(record: JsonRecord | null | undefined): ValidatedCodeSymbolLink[] {
  return arrayRecords(record?.links)
    .map((link) => {
      const id = stringValue(link.id)
      const sourceNodeId = stringValue(link.sourceNodeId ?? link.source)
      const targetCodeNodeId = stringValue(link.targetCodeNodeId ?? link.targetCodeNode ?? link.target)
      const linkType = stringValue(link.linkType ?? link.type)?.toLowerCase()
      const sourceNodeKind = stringValue(link.sourceNodeKind ?? link.sourceKind)?.toLowerCase()
      const targetCodeNodeKind = stringValue(link.targetCodeNodeKind ?? link.targetKind)?.toLowerCase()
      const confidence = stringValue(link.confidence)?.toLowerCase()
      if (
        !id ||
        !sourceNodeId ||
        !targetCodeNodeId ||
        !linkType ||
        !sourceNodeKind ||
        !targetCodeNodeKind ||
        !confidence
      ) {
        return null
      }
      return {
        id,
        sourceNodeId,
        targetCodeNodeId,
        linkType,
        sourceNodeKind,
        targetCodeNodeKind,
        ...(stringValue(link.sourceFile ?? link.source_file)
          ? { sourceFile: stringValue(link.sourceFile ?? link.source_file) as string }
          : {}),
        ...(stringValue(link.sourceLocationStatus)
          ? { sourceLocationStatus: stringValue(link.sourceLocationStatus) as string }
          : {}),
        ...(link.sourceLocation || link.source_location
          ? { sourceLocation: link.sourceLocation ?? link.source_location }
          : {}),
        confidence,
      }
    })
    .filter((entry): entry is ValidatedCodeSymbolLink => Boolean(entry))
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: CodeSymbolLinkValidationOptions,
): Promise<void> {
  const outputPath = resolveRepoPath(root, options.output ?? '')
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  const outputs = [
    { kind: 'validation output', path: outputPath },
    ...(markdownPath ? [{ kind: 'markdown output', path: markdownPath }] : []),
  ]
  const seenOutputs = new Set<string>()
  for (const output of outputs) {
    const key = pathKey(output.path)
    if (seenOutputs.has(key)) {
      throw new Error('Code symbol link validation output and markdown paths must be different.')
    }
    seenOutputs.add(key)
  }

  const sourceSet = new Set(sourcePaths.map(pathKey))
  for (const output of outputs) {
    const relativeTarget = relativePath(root, output.path)
    if (sourceSet.has(pathKey(output.path))) {
      throw new Error(`Code symbol link validation ${output.kind} would overwrite a source input: ${relativeTarget}.`)
    }
    if (isProtectedControlPath(root, output.path)) {
      throw new Error(
        `Code symbol link validation ${output.kind} is inside a protected control path: ${relativeTarget}.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(output.path)
    if (existingAuthority) {
      throw new Error(
        `Code symbol link validation ${output.kind} would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(
        `Code symbol link validation ${output.kind} would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
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
      role === LINKS_ROLE ||
      role === REPORT_ROLE ||
      role === CODE_SUBGRAPH_ROLE ||
      role === CODE_SUBGRAPH_VALIDATION_ROLE ||
      role === CODE_SUBGRAPH_MERGE_PLAN_ROLE
    ) {
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

function sourceInputPaths(root: string, options: CodeSymbolLinkValidationOptions): string[] {
  return [
    options.links,
    options.codeSubgraph,
    options.codeSubgraphValidation,
    options.codeSubgraphMergePlan,
    options.graphSource,
  ]
    .filter((entry): entry is string => Boolean(entry))
    .map((entry) => resolveRepoPath(root, entry))
}

function renderMarkdown(report: CodeSymbolLinkValidationReport): string {
  return [
    '# Code Symbol Link Validation',
    '',
    `Status: ${report.status}`,
    `Links: \`${report.sourceLinks.path}\``,
    `Code subgraph: \`${report.sourceCodeSubgraph.path}\``,
    `Graph source: \`${report.sourceGraph.path ?? 'not-supplied'}\``,
    '',
    '## Summary',
    '',
    `- Links: ${report.linkValidationSummary.total}`,
    `- Link types: ${formatCounts(report.linkValidationSummary.byLinkType)}`,
    `- Source node kinds: ${formatCounts(report.linkValidationSummary.bySourceNodeKind)}`,
    `- Target code node kinds: ${formatCounts(report.linkValidationSummary.byTargetCodeNodeKind)}`,
    `- Verified code endpoints: ${report.linkValidationSummary.verifiedCodeEndpointCount}`,
    `- Verified maintenance endpoints: ${report.linkValidationSummary.verifiedMaintenanceEndpointCount}`,
    `- Unverified maintenance endpoints: ${report.linkValidationSummary.unverifiedMaintenanceEndpointCount}`,
    '',
    '## Findings',
    '',
    ...report.validationFindings.map((finding) => `- ${finding.severity}: ${finding.code} - ${finding.message}`),
    '',
    '## Boundary',
    '',
    '- Separate code graph created: false',
    '- Graph source mutated: false',
    '- Graph delta applied: false',
    '- View Tree generated: false',
    '- Context Pack generated: false',
    '- Evidence accepted: false',
    '- RBAC enforced: false',
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

function blocker(code: string, message: string, field?: string, pathValue?: string): CodeSymbolLinkValidationFinding {
  return { severity: 'blocker', code, message, field, path: pathValue }
}

function warning(code: string, message: string, field?: string, pathValue?: string): CodeSymbolLinkValidationFinding {
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
