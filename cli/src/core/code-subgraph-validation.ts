import { createHash } from 'node:crypto'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import { hasDevViewControlDirectory, hasHiddenControlDirectorySegment } from './path-safety.js'

type JsonRecord = Record<string, unknown>

const INPUT_ROLE = 'devview-code-subgraph'
const INPUT_STATUS = 'devview-code-subgraph-supplied'
const INPUT_SCOPE = 'code-subgraph-source-fact-only'
const REPORT_ROLE = 'devview-code-subgraph-validation-report'
const PASSED_STATUS = 'devview-code-subgraph-validation-passed'
const BLOCKED_STATUS = 'devview-code-subgraph-validation-blocked'
const REPORT_SCOPE = 'code-subgraph-validation-report-only'

const nodeKinds = [
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

const edgeTypes = [
  'contains',
  'imports',
  'imports_from',
  're_exports',
  'calls',
  'references',
  'inherits',
  'implements',
  'constructs',
  'reads',
  'writes',
  'parameter_type',
  'return_type',
  'tested_by',
  'covers',
  'documents',
  'configures',
  'depends_on',
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
  'filesMutated',
  'graphSourceMutated',
  'graphDeltaApplied',
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

export interface CodeSubgraphValidationOptions {
  codeSubgraph?: string
  output?: string
  markdown?: string
}

export interface CodeSubgraphFinding {
  severity: 'blocker' | 'satisfied'
  code: string
  message: string
  field?: string
  path?: string
}

interface LoadedCodeSubgraph {
  requestedPath: string
  resolvedPath: string
  relativePath: string
  record: JsonRecord | null
  sha256: string | null
  byteLength: number | null
  readError: string | null
}

export interface CodeSubgraphValidationReport extends JsonRecord {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof PASSED_STATUS | typeof BLOCKED_STATUS
  validationScope: typeof REPORT_SCOPE
  sourceFactsOnly: true
  reportOnly: true
  sourceCodeSubgraph: {
    path: string
    artifactRole: string | null
    status: string | null
    scope: string | null
    sha256: string | null
    byteLength: number | null
  }
  codeSubgraphValidationStatus: 'validated-code-subgraph-source-fact-only' | 'blocked'
  vocabulary: {
    allowedNodeKinds: string[]
    allowedEdgeTypes: string[]
    allowedConfidenceValues: string[]
  }
  nodeSummary: {
    nodeCount: number
    codeNodeKindCounts: Record<string, number>
    nodeIds: string[]
  }
  edgeSummary: {
    edgeCount: number
    codeEdgeTypeCounts: Record<string, number>
    edgeIds: string[]
  }
  provenanceSummary: {
    nodesWithSourceFile: number
    nodesWithSourceLocation: number
    nodesWithSourceLocationStatus: number
    nodesWithSourceDigest: number
    edgesWithSourceFile: number
    edgesWithSourceLocation: number
    edgesWithSourceLocationStatus: number
    edgesWithSourceDigest: number
    confidenceCounts: Record<string, number>
  }
  validationFindings: CodeSubgraphFinding[]
  downstreamActionPlan: string[]
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

export class CodeSubgraphValidationError extends Error {
  readonly report: CodeSubgraphValidationReport

  constructor(report: CodeSubgraphValidationReport) {
    super('Code subgraph validation is blocked.')
    this.report = report
  }
}

export async function validateCodeSubgraphFile(
  root: string,
  options: CodeSubgraphValidationOptions,
): Promise<CodeSubgraphValidationReport> {
  validateRequiredOptions(options)
  const sourcePath = resolveRepoPath(root, options.codeSubgraph ?? '')
  await assertOutputAuthority(root, [sourcePath], options)
  const source = await loadCodeSubgraph(root, options.codeSubgraph ?? '')
  const findings = validateCodeSubgraph(source)
  const blocked = findings.some((finding) => finding.severity === 'blocker')
  const report = buildReport(source, findings, blocked)

  if (blocked) {
    throw new CodeSubgraphValidationError(report)
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

function validateRequiredOptions(options: CodeSubgraphValidationOptions): void {
  if (!options.codeSubgraph) {
    throw new Error('graph validate-code-subgraph requires --code-subgraph <file>.')
  }
  if (!options.output) {
    throw new Error('graph validate-code-subgraph requires --output <file>.')
  }
}

async function loadCodeSubgraph(root: string, requestedPath: string): Promise<LoadedCodeSubgraph> {
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

function validateCodeSubgraph(source: LoadedCodeSubgraph): CodeSubgraphFinding[] {
  const findings: CodeSubgraphFinding[] = []
  const record = source.record

  if (!record) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_READ_FAILED',
        `Could not read code subgraph: ${source.readError}`,
        undefined,
        source.relativePath,
      ),
    )
    return findings
  }

  validateRoleStatusScope(record, source.relativePath, findings)
  for (const hit of collectUnsafeAuthorityHits(record)) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_UNSAFE_AUTHORITY_FLAG',
        `${source.relativePath} contains unsafe report-only flag ${hit.field}: true.`,
        hit.field,
        source.relativePath,
      ),
    )
  }
  for (const hit of collectExecutableInstructionHits(record)) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_EXECUTABLE_INSTRUCTION_DECLARED',
        `${source.relativePath} contains executable/provider/network instruction field ${hit.field}.`,
        hit.field,
        source.relativePath,
      ),
    )
  }

  const nodes = arrayRecords(record.nodes)
  const edges = arrayRecords(record.edges)
  if (!Array.isArray(record.nodes)) {
    findings.push(
      blocker('CODE_SUBGRAPH_NODES_INVALID', 'Code subgraph nodes must be an array.', 'nodes', source.relativePath),
    )
  }
  if (!Array.isArray(record.edges)) {
    findings.push(
      blocker('CODE_SUBGRAPH_EDGES_INVALID', 'Code subgraph edges must be an array.', 'edges', source.relativePath),
    )
  }

  const nodeIds = new Set<string>()
  nodes.forEach((node, index) => {
    const prefix = `nodes[${index}]`
    const id = stringValue(node.id)
    const kind = stringValue(node.kind ?? node.nodeKind)
    if (!id) {
      findings.push(
        blocker(
          'CODE_SUBGRAPH_NODE_ID_MISSING',
          `Code subgraph ${prefix}.id is required.`,
          `${prefix}.id`,
          source.relativePath,
        ),
      )
    } else if (nodeIds.has(id)) {
      findings.push(
        blocker(
          'CODE_SUBGRAPH_NODE_ID_DUPLICATE',
          `Code subgraph node id is duplicated: ${id}.`,
          `${prefix}.id`,
          source.relativePath,
        ),
      )
    } else {
      nodeIds.add(id)
    }
    if (!kind || !nodeKinds.includes(kind as (typeof nodeKinds)[number])) {
      findings.push(
        blocker(
          'CODE_SUBGRAPH_NODE_KIND_UNSUPPORTED',
          `Code subgraph ${prefix}.kind must be one of the supported code node kinds.`,
          `${prefix}.kind`,
          source.relativePath,
        ),
      )
    }
    validateProvenance(node, prefix, source.relativePath, findings)
  })

  const edgeIds = new Set<string>()
  edges.forEach((edge, index) => {
    const prefix = `edges[${index}]`
    const id = stringValue(edge.id)
    const from = stringValue(edge.from ?? edge.source)
    const to = stringValue(edge.to ?? edge.target)
    const kind = stringValue(edge.kind ?? edge.edgeType ?? edge.relation)
    if (!id) {
      findings.push(
        blocker(
          'CODE_SUBGRAPH_EDGE_ID_MISSING',
          `Code subgraph ${prefix}.id is required.`,
          `${prefix}.id`,
          source.relativePath,
        ),
      )
    } else if (edgeIds.has(id)) {
      findings.push(
        blocker(
          'CODE_SUBGRAPH_EDGE_ID_DUPLICATE',
          `Code subgraph edge id is duplicated: ${id}.`,
          `${prefix}.id`,
          source.relativePath,
        ),
      )
    } else {
      edgeIds.add(id)
    }
    if (!from || !nodeIds.has(from)) {
      findings.push(
        blocker(
          'CODE_SUBGRAPH_EDGE_ENDPOINT_MISSING',
          `Code subgraph ${prefix}.from must reference an existing node id.`,
          `${prefix}.from`,
          source.relativePath,
        ),
      )
    }
    if (!to || !nodeIds.has(to)) {
      findings.push(
        blocker(
          'CODE_SUBGRAPH_EDGE_ENDPOINT_MISSING',
          `Code subgraph ${prefix}.to must reference an existing node id.`,
          `${prefix}.to`,
          source.relativePath,
        ),
      )
    }
    if (!kind || !edgeTypes.includes(kind as (typeof edgeTypes)[number])) {
      findings.push(
        blocker(
          'CODE_SUBGRAPH_EDGE_TYPE_UNSUPPORTED',
          `Code subgraph ${prefix}.kind must be one of the supported code edge types.`,
          `${prefix}.kind`,
          source.relativePath,
        ),
      )
    }
    validateProvenance(edge, prefix, source.relativePath, findings)
  })

  if (findings.length === 0) {
    findings.push({
      severity: 'satisfied',
      code: 'CODE_SUBGRAPH_VALIDATED',
      message: 'Code subgraph source fact passed report-only structural and provenance validation.',
      path: source.relativePath,
    })
  }

  return findings
}

function validateRoleStatusScope(record: JsonRecord, sourcePath: string, findings: CodeSubgraphFinding[]): void {
  if (record.artifactRole !== INPUT_ROLE) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_ROLE_INVALID',
        `Code subgraph artifactRole must be ${INPUT_ROLE}.`,
        'artifactRole',
        sourcePath,
      ),
    )
  }
  if (record.status !== INPUT_STATUS) {
    findings.push(
      blocker('CODE_SUBGRAPH_STATUS_INVALID', `Code subgraph status must be ${INPUT_STATUS}.`, 'status', sourcePath),
    )
  }
  const scope = record.scope ?? record.codeSubgraphScope
  if (scope !== INPUT_SCOPE) {
    findings.push(
      blocker('CODE_SUBGRAPH_SCOPE_INVALID', `Code subgraph scope must be ${INPUT_SCOPE}.`, 'scope', sourcePath),
    )
  }
}

function validateProvenance(
  record: JsonRecord,
  prefix: string,
  sourcePath: string,
  findings: CodeSubgraphFinding[],
): void {
  const sourceFile = stringValue(record.sourceFile ?? record.source_file)
  const sourceLocation = record.sourceLocation ?? record.source_location
  const sourceLocationStatus = stringValue(record.sourceLocationStatus)
  const confidence = stringValue(record.confidence)?.toLowerCase()

  if (!sourceFile) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_PROVENANCE_SOURCE_FILE_MISSING',
        `${prefix}.sourceFile is required.`,
        `${prefix}.sourceFile`,
        sourcePath,
      ),
    )
  }
  if (!sourceLocation && !sourceLocationStatus) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_PROVENANCE_SOURCE_LOCATION_MISSING',
        `${prefix}.sourceLocation or sourceLocationStatus is required.`,
        `${prefix}.sourceLocation`,
        sourcePath,
      ),
    )
  }
  if (!confidence || !confidenceValues.includes(confidence as (typeof confidenceValues)[number])) {
    findings.push(
      blocker(
        'CODE_SUBGRAPH_PROVENANCE_CONFIDENCE_INVALID',
        `${prefix}.confidence must be extracted, inferred, or ambiguous.`,
        `${prefix}.confidence`,
        sourcePath,
      ),
    )
  }
}

function buildReport(
  source: LoadedCodeSubgraph,
  findings: CodeSubgraphFinding[],
  blocked: boolean,
): CodeSubgraphValidationReport {
  const record = source.record ?? {}
  const nodes = blocked ? [] : arrayRecords(record.nodes)
  const edges = blocked ? [] : arrayRecords(record.edges)
  const confidenceCounts: Record<string, number> = {}
  for (const entry of [...nodes, ...edges]) {
    const confidence = stringValue(entry.confidence)?.toLowerCase() ?? 'missing'
    confidenceCounts[confidence] = (confidenceCounts[confidence] ?? 0) + 1
  }

  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : PASSED_STATUS,
    validationScope: REPORT_SCOPE,
    sourceFactsOnly: true,
    reportOnly: true,
    sourceCodeSubgraph: {
      path: source.relativePath,
      artifactRole: stringValue(record.artifactRole),
      status: stringValue(record.status),
      scope: stringValue(record.scope ?? record.codeSubgraphScope),
      sha256: source.sha256,
      byteLength: source.byteLength,
    },
    codeSubgraphValidationStatus: blocked ? 'blocked' : 'validated-code-subgraph-source-fact-only',
    vocabulary: {
      allowedNodeKinds: [...nodeKinds],
      allowedEdgeTypes: [...edgeTypes],
      allowedConfidenceValues: [...confidenceValues],
    },
    nodeSummary: {
      nodeCount: nodes.length,
      codeNodeKindCounts: countBy(nodes, (entry) => stringValue(entry.kind ?? entry.nodeKind) ?? 'missing'),
      nodeIds: nodes
        .map((entry) => stringValue(entry.id))
        .filter((entry): entry is string => Boolean(entry))
        .sort(),
    },
    edgeSummary: {
      edgeCount: edges.length,
      codeEdgeTypeCounts: countBy(
        edges,
        (entry) => stringValue(entry.kind ?? entry.edgeType ?? entry.relation) ?? 'missing',
      ),
      edgeIds: edges
        .map((entry) => stringValue(entry.id))
        .filter((entry): entry is string => Boolean(entry))
        .sort(),
    },
    provenanceSummary: {
      nodesWithSourceFile: nodes.filter((entry) => Boolean(stringValue(entry.sourceFile ?? entry.source_file))).length,
      nodesWithSourceLocation: nodes.filter((entry) => Boolean(entry.sourceLocation ?? entry.source_location)).length,
      nodesWithSourceLocationStatus: nodes.filter((entry) => Boolean(stringValue(entry.sourceLocationStatus))).length,
      nodesWithSourceDigest: nodes.filter((entry) => Boolean(stringValue(entry.sourceDigest))).length,
      edgesWithSourceFile: edges.filter((entry) => Boolean(stringValue(entry.sourceFile ?? entry.source_file))).length,
      edgesWithSourceLocation: edges.filter((entry) => Boolean(entry.sourceLocation ?? entry.source_location)).length,
      edgesWithSourceLocationStatus: edges.filter((entry) => Boolean(stringValue(entry.sourceLocationStatus))).length,
      edgesWithSourceDigest: edges.filter((entry) => Boolean(stringValue(entry.sourceDigest))).length,
      confidenceCounts,
    },
    validationFindings: findings,
    downstreamActionPlan: blocked
      ? [
          'Fix blocking code subgraph role/status/scope, vocabulary, endpoint, provenance, or report-only safety findings, then rerun validation.',
        ]
      : [
          'Use this validation report as a source fact for a future DevView graph-source code subgraph integration proposal.',
          'Do not treat this report as Graphify execution, AST extraction, graph-source mutation, View Tree generation, or evidence acceptance.',
        ],
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

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: CodeSubgraphValidationOptions,
): Promise<void> {
  const output = resolveRepoPath(root, options.output ?? '')
  const markdown = options.markdown ? resolveRepoPath(root, options.markdown) : null
  if (markdown && pathKey(output) === pathKey(markdown)) {
    throw new Error('Code subgraph validation output and markdown paths must be different.')
  }
  for (const target of [output, ...(markdown ? [markdown] : [])]) {
    const relativeTarget = relativePath(root, target)
    if (sourcePaths.some((source) => pathKey(source) === pathKey(target))) {
      throw new Error(`Code subgraph validation output would overwrite a source input: ${relativeTarget}.`)
    }
    if (isProtectedControlPath(root, target)) {
      throw new Error(`Code subgraph validation output is inside a protected control path: ${relativeTarget}.`)
    }
    const existingAuthority = await classifyExistingSourceAuthority(target)
    if (existingAuthority) {
      throw new Error(
        `Code subgraph validation output would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
  }
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  try {
    const bytes = await readFile(filePath)
    const parsed = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) as JsonRecord
    const role = stringValue(parsed.artifactRole)
    if (role?.includes('graph-source') || role === INPUT_ROLE || role === REPORT_ROLE) {
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

function renderMarkdown(report: CodeSubgraphValidationReport): string {
  return [
    '# Code Subgraph Validation',
    '',
    `Status: ${report.status}`,
    `Source: \`${report.sourceCodeSubgraph.path}\``,
    `Validation: ${report.codeSubgraphValidationStatus}`,
    '',
    '## Summary',
    '',
    `- Nodes: ${report.nodeSummary.nodeCount}`,
    `- Edges: ${report.edgeSummary.edgeCount}`,
    `- Node kinds: ${Object.entries(report.nodeSummary.codeNodeKindCounts)
      .map(([kind, count]) => `${kind}:${count}`)
      .join(', ')}`,
    `- Edge types: ${Object.entries(report.edgeSummary.codeEdgeTypeCounts)
      .map(([kind, count]) => `${kind}:${count}`)
      .join(', ')}`,
    '',
    '## Findings',
    '',
    ...report.validationFindings.map((finding) => `- ${finding.severity}: ${finding.code} - ${finding.message}`),
    '',
    '## Boundary',
    '',
    '- Graphify executed: false',
    '- AST extractor executed: false',
    '- Graph source mutated: false',
    '- View Tree generated: false',
    '- RBAC enforced: false',
    '- Cryptographic signature verified: false',
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
  const hits: Array<{ field: string }> = []
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      hits.push(...collectUnsafeAuthorityHits(entry, [...pathParts, String(index)], seen)),
    )
    return hits
  }
  const record = value as JsonRecord
  for (const [key, entry] of Object.entries(record)) {
    const field = [...pathParts, key].join('.')
    if (unsafeAuthorityFields.includes(key) && entry === true) {
      hits.push({ field })
    }
    hits.push(...collectUnsafeAuthorityHits(entry, [...pathParts, key], seen))
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
  const hits: Array<{ field: string }> = []
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      hits.push(...collectExecutableInstructionHits(entry, [...pathParts, String(index)], seen)),
    )
    return hits
  }
  const record = value as JsonRecord
  for (const [key, entry] of Object.entries(record)) {
    const field = [...pathParts, key].join('.')
    if (executableInstructionFields.includes(key) && entry !== false && entry !== null && entry !== undefined) {
      hits.push({ field })
    }
    hits.push(...collectExecutableInstructionHits(entry, [...pathParts, key], seen))
  }
  return hits
}

function blocker(code: string, message: string, field?: string, pathValue?: string): CodeSubgraphFinding {
  return { severity: 'blocker', code, message, field, path: pathValue }
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

function countBy(values: JsonRecord[], key: (value: JsonRecord) => string): Record<string, number> {
  const result: Record<string, number> = {}
  for (const value of values) {
    const name = key(value)
    result[name] = (result[name] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)))
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(root, filePath)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}

function isProtectedControlPath(root: string, filePath: string): boolean {
  const relative = relativePath(root, filePath)
  return hasDevViewControlDirectory(relative) || hasHiddenControlDirectorySegment(relative)
}
