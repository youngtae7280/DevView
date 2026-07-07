import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'

type JsonRecord = Record<string, unknown>

const REPORT_ROLE = 'devview-extension-context-plan'
const REPORT_STATUS = 'devview-extension-context-plan-generated'
const BLOCKED_STATUS = 'devview-extension-context-plan-blocked'
const CATALOG_ROLE = 'devview-extension-profile-catalog'
const CATALOG_STATUS = 'devview-extension-profile-catalog-compiled'

const unsafeAuthorityFields = [
  'extensionExecutionAllowed',
  'extensionsExecuted',
  'extensionCodeExecuted',
  'executionAllowed',
  'canExecuteExtensionCode',
  'providerInvoked',
  'networkCallMade',
  'shellCommandExecuted',
  'shellCommandsExecuted',
  'filesMutated',
  'graphSourceMutated',
  'graphDeltaApplied',
  'runtimeEvidenceSatisfied',
  'evidenceAccepted',
  'canSatisfyEvidence',
  'equivalenceProven',
  'canProveEquivalence',
  'scopeEnforced',
  'ciEnforcementEnabled',
  'canEnforceScope',
  'hooksActivated',
  'branchProtectionChanged',
  'branchProtectionMutated',
  'requiredChecksConfigured',
  'requiredChecksMutated',
  'externalCiMutated',
  'diffRejectionEnabled',
  'diffRejectionActivated',
  'approvalAutomationEnabled',
  'userAcceptanceAutomated',
  'traversalAuthorityGranted',
  'contextPackMutated',
  'viewTreeMutated',
]

export interface ExtensionContextPlanOptions {
  extensionProfileCatalog?: string
  viewTree?: string
  contextPack?: string
  output?: string
  markdown?: string
}

export interface ExtensionContextPlanReport {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof REPORT_STATUS | typeof BLOCKED_STATUS
  planningScope: 'extension-context-planning-report-only'
  extensionContextPlanStatus:
    | 'generated-report-only-hints'
    | 'blocked-extension-profile-catalog-invalid'
    | 'blocked-unsafe-authority-flag'
    | 'blocked-view-tree-invalid'
    | 'blocked-context-pack-invalid'
  sourceExtensionProfileCatalog: string
  sourceViewTree: string | null
  sourceContextPack: string | null
  sourceExtensionProfileCatalogSummary: {
    catalogStatus: string | null
    catalogEntryCount: number
    capabilityGroupCounts: Record<string, number>
    downstreamCompatibility: JsonRecord
  }
  viewTreeHintPlan: {
    applicableViewTreeExtractorExtensions: string[]
    analyzerExtensions: string[]
    graphIngestionCandidates: string[]
    canInformViewTree: boolean
    sourceViewTreeStatus: string | null
    sourceViewTreeArtifactRole: string | null
    sourceViewTreeId: string | null
    selectedNodeCount: number | null
    selectedEdgeCount: number | null
    alignmentStatus:
      | 'view-tree-source-not-provided'
      | 'view-tree-extension-hints-available-for-source-view-tree'
      | 'view-tree-source-present-no-extension-hints'
    authorityStatus: 'hint-only-not-traversal-authority'
  }
  contextPackHintPlan: {
    contextPackExtensions: string[]
    analyzerExtensions: string[]
    analyzerExtensionCount: number
    contextPackExtensionCount: number
    canInformContextPack: boolean
    sourceContextPackStatus: string | null
    sourceContextPackArtifactRole: string | null
    boundedSubgraphNodeCount: number | null
    allowedContextCount: number | null
    forbiddenContextCount: number | null
    requiredEvidenceCount: number | null
    allowedContextClassHints: string[]
    forbiddenContextClassHints: string[]
    alignmentStatus:
      | 'context-pack-source-not-provided'
      | 'context-pack-extension-hints-available-for-source-context-pack'
      | 'context-pack-source-present-no-extension-hints'
    authorityStatus: 'hint-only-not-context-pack-authority'
  }
  evidencePolicyHintPlan: {
    evidenceAdapters: string[]
    policyExtensions: string[]
    canInformEvidenceAdapterValidation: boolean
    canInformPolicyValidation: boolean
    canSatisfyEvidence: false
    canProveEquivalence: false
    canEnforceScope: false
    authorityStatus: 'hint-only-not-evidence-proof-or-scope-authority'
  }
  nativeRetrofitPlanning: {
    mode: string
    hintStatus: string
    nativeSignals: string[]
    retrofitSignals: string[]
    futureFieldCandidates: string[]
    recommendations: string[]
  }
  graphIngestionPlanning: {
    candidates: Array<{
      extensionId: string
      graphProviderKind: string | null
      protocolStatus: 'protocol-only-not-executed'
      executionAllowed: false
      providerInvoked: false
      networkCallMade: false
      shellCommandsExecuted: false
    }>
    candidateCount: number
    graphifyCandidateCount: number
    providerInvoked: false
    networkCallMade: false
    shellCommandsExecuted: false
    executionAllowed: false
    authorityStatus: 'protocol-only-not-graph-ingestion-authority'
  }
  downstreamActionPlan: Array<{
    actionId: string
    recommendedAction: string
    reason: string
    authorityBoundary: string
  }>
  findings: ExtensionContextPlanFinding[]
  extensionExecutionAllowed: false
  extensionsExecuted: false
  providerInvoked: false
  networkCallMade: false
  shellCommandsExecuted: false
  filesMutated: false
  graphSourceMutated: false
  graphDeltaApplied: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  hooksActivated: false
  branchProtectionChanged: false
  branchProtectionMutated: false
  requiredChecksConfigured: false
  requiredChecksMutated: false
  externalCiMutated: false
  diffRejectionEnabled: false
  diffRejectionActivated: false
  approvalAutomationEnabled: false
  userAcceptanceAutomated: false
  traversalAuthorityGranted: false
  contextPackMutated: false
  viewTreeMutated: false
  nonEnforcing: true
  writtenOutputPath?: string
  writtenMarkdownPath?: string
}

export interface ExtensionContextPlanFinding {
  severity: 'info' | 'warning' | 'error'
  code: string
  path?: string
  field?: string
  message: string
}

export class ExtensionContextPlanValidationError extends Error {
  readonly report: ExtensionContextPlanReport

  constructor(report: ExtensionContextPlanReport) {
    super('Extension context plan is blocked.')
    this.report = report
  }
}

interface LoadedSource {
  path: string
  record: JsonRecord | null
}

export async function planExtensionContext(
  root: string,
  options: ExtensionContextPlanOptions = {},
): Promise<ExtensionContextPlanReport> {
  if (!options.extensionProfileCatalog) {
    throw new Error('extensions plan-context requires --extension-profile-catalog <file>.')
  }

  const catalogPath = resolveRepoPath(root, options.extensionProfileCatalog)
  const viewTreePath = options.viewTree ? resolveRepoPath(root, options.viewTree) : null
  const contextPackPath = options.contextPack ? resolveRepoPath(root, options.contextPack) : null
  const sourceExtensionProfileCatalog = relativePath(root, catalogPath)
  const sourceViewTree = viewTreePath ? relativePath(root, viewTreePath) : null
  const sourceContextPack = contextPackPath ? relativePath(root, contextPackPath) : null
  const findings: ExtensionContextPlanFinding[] = []

  const catalog = await loadRequiredCatalog(catalogPath, sourceExtensionProfileCatalog, findings)
  const viewTree = viewTreePath
    ? await loadOptionalSource(viewTreePath, sourceViewTree ?? '', 'View Tree', findings)
    : null
  const contextPack = contextPackPath
    ? await loadOptionalSource(contextPackPath, sourceContextPack ?? '', 'Context Pack', findings)
    : null

  validateCatalog(catalog.record, sourceExtensionProfileCatalog, findings)
  if (viewTree) validateViewTreeSource(viewTree.record, sourceViewTree ?? '', findings)
  if (contextPack) validateContextPackSource(contextPack.record, sourceContextPack ?? '', findings)

  const status = choosePlanStatus(findings)
  const report: ExtensionContextPlanReport = {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: status === 'generated-report-only-hints' ? REPORT_STATUS : BLOCKED_STATUS,
    planningScope: 'extension-context-planning-report-only',
    extensionContextPlanStatus: status,
    sourceExtensionProfileCatalog,
    sourceViewTree,
    sourceContextPack,
    sourceExtensionProfileCatalogSummary: buildCatalogSummary(catalog.record),
    viewTreeHintPlan: buildViewTreeHintPlan(catalog.record, viewTree?.record ?? null),
    contextPackHintPlan: buildContextPackHintPlan(catalog.record, contextPack?.record ?? null),
    evidencePolicyHintPlan: buildEvidencePolicyHintPlan(catalog.record),
    nativeRetrofitPlanning: buildNativeRetrofitPlanning(catalog.record),
    graphIngestionPlanning: buildGraphIngestionPlanning(catalog.record),
    downstreamActionPlan: buildDownstreamActionPlan(
      catalog.record,
      viewTree?.record ?? null,
      contextPack?.record ?? null,
    ),
    findings,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
    shellCommandsExecuted: false,
    filesMutated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    hooksActivated: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    traversalAuthorityGranted: false,
    contextPackMutated: false,
    viewTreeMutated: false,
    nonEnforcing: true,
  }

  await assertPlanOutputAuthority(root, {
    catalogPath,
    viewTreePath,
    contextPackPath,
    output: options.output,
    markdown: options.markdown,
  })

  if (report.status === BLOCKED_STATUS) {
    throw new ExtensionContextPlanValidationError(report)
  }

  if (options.output) {
    const outputPath = resolveRepoPath(root, options.output)
    report.writtenOutputPath = relativePath(root, outputPath)
    await writeJsonAtomic(outputPath, report)
  }
  if (options.markdown) {
    const markdownPath = resolveRepoPath(root, options.markdown)
    report.writtenMarkdownPath = relativePath(root, markdownPath)
    await writeTextAtomic(markdownPath, renderExtensionContextPlanMarkdown(report))
    if (options.output) {
      await writeJsonAtomic(resolveRepoPath(root, options.output), report)
    }
  }

  return report
}

async function loadRequiredCatalog(
  filePath: string,
  sourcePath: string,
  findings: ExtensionContextPlanFinding[],
): Promise<LoadedSource> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_CONTEXT_PLAN_CATALOG_UNREADABLE',
      path: sourcePath,
      message: `Unable to read Extension Profile Catalog: ${parsed.error}`,
    })
    return { path: sourcePath, record: null }
  }
  const record = asRecord(parsed.value)
  if (!record) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_CONTEXT_PLAN_CATALOG_INVALID',
      path: sourcePath,
      message: 'Extension Profile Catalog must be a JSON object.',
    })
    return { path: sourcePath, record: null }
  }
  return { path: sourcePath, record }
}

async function loadOptionalSource(
  filePath: string,
  sourcePath: string,
  label: string,
  findings: ExtensionContextPlanFinding[],
): Promise<LoadedSource> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) {
    findings.push({
      severity: 'error',
      code: `EXTENSION_CONTEXT_PLAN_${slugCode(label)}_UNREADABLE`,
      path: sourcePath,
      message: `Unable to read ${label}: ${parsed.error}`,
    })
    return { path: sourcePath, record: null }
  }
  const record = asRecord(parsed.value)
  if (!record) {
    findings.push({
      severity: 'error',
      code: `EXTENSION_CONTEXT_PLAN_${slugCode(label)}_INVALID_JSON`,
      path: sourcePath,
      message: `${label} must be a JSON object.`,
    })
    return { path: sourcePath, record: null }
  }
  return { path: sourcePath, record }
}

function validateCatalog(
  catalog: JsonRecord | null,
  sourcePath: string,
  findings: ExtensionContextPlanFinding[],
): void {
  if (!catalog) return
  if (catalog.artifactRole !== CATALOG_ROLE || catalog.status !== CATALOG_STATUS) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_CONTEXT_PLAN_CATALOG_ROLE_STATUS_INVALID',
      path: sourcePath,
      message: 'Extension context planning requires a compiled devview-extension-profile-catalog source.',
    })
  }
  for (const field of collectUnsafeAuthorityFields(catalog)) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_CONTEXT_PLAN_UNSAFE_AUTHORITY_FLAG',
      path: sourcePath,
      field,
      message: `Extension Profile Catalog must not assert authority flag ${field}.`,
    })
  }
}

function validateViewTreeSource(
  viewTree: JsonRecord | null,
  sourcePath: string,
  findings: ExtensionContextPlanFinding[],
): void {
  if (!viewTree) return
  const role = stringValue(viewTree.artifactRole)
  const status = stringValue(viewTree.status)
  const metadataRole = stringValue(viewTree.viewTreeArtifactRole)
  const metadataStatus = stringValue(viewTree.viewTreeStatus)
  const valid =
    (role === 'selected-graph-slice' &&
      ['selected-graph-slice-generated', 'selected-graph-slice-blocked'].includes(status) &&
      (!metadataRole || metadataRole === 'devview-view-tree-preview') &&
      (!metadataStatus || metadataStatus.startsWith('devview-view-tree-preview'))) ||
    (role === 'devview-view-tree-preview' && status.startsWith('devview-view-tree-preview'))
  if (!valid) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_CONTEXT_PLAN_VIEW_TREE_ROLE_STATUS_INVALID',
      path: sourcePath,
      message: 'View Tree input must be a selected-graph-slice with DevView View Tree metadata or a View Tree preview.',
    })
  }
  for (const field of collectUnsafeAuthorityFields(viewTree)) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_CONTEXT_PLAN_VIEW_TREE_UNSAFE_AUTHORITY_FLAG',
      path: sourcePath,
      field,
      message: `View Tree source must not assert authority flag ${field}.`,
    })
  }
}

function validateContextPackSource(
  contextPack: JsonRecord | null,
  sourcePath: string,
  findings: ExtensionContextPlanFinding[],
): void {
  if (!contextPack) return
  const role = stringValue(contextPack.artifactRole)
  const status = stringValue(contextPack.status)
  const valid =
    (role === 'contract-compiler-input' && status.startsWith('contract-compiler-input-')) ||
    (role === 'contract-compiler-input-preview' && status.startsWith('contract-compiler-input-')) ||
    (role === 'devview-context-pack-preview' && status.startsWith('devview-context-pack-preview'))
  if (!valid) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_CONTEXT_PLAN_CONTEXT_PACK_ROLE_STATUS_INVALID',
      path: sourcePath,
      message: 'Context Pack input must be a contract compiler input or DevView Context Pack preview.',
    })
  }
  for (const field of collectUnsafeAuthorityFields(contextPack)) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_CONTEXT_PLAN_CONTEXT_PACK_UNSAFE_AUTHORITY_FLAG',
      path: sourcePath,
      field,
      message: `Context Pack source must not assert authority flag ${field}.`,
    })
  }
}

function buildCatalogSummary(
  catalog: JsonRecord | null,
): ExtensionContextPlanReport['sourceExtensionProfileCatalogSummary'] {
  const capabilityCatalog = asRecord(catalog?.capabilityCatalog)
  return {
    catalogStatus: stringValue(catalog?.extensionCatalogStatus) || null,
    catalogEntryCount: numberValue(catalog?.catalogEntryCount) ?? arrayRecords(catalog?.extensionCatalogEntries).length,
    capabilityGroupCounts: capabilityGroupCounts(capabilityCatalog),
    downstreamCompatibility: asRecord(catalog?.downstreamCompatibility) ?? {},
  }
}

function buildViewTreeHintPlan(
  catalog: JsonRecord | null,
  viewTree: JsonRecord | null,
): ExtensionContextPlanReport['viewTreeHintPlan'] {
  const capabilityCatalog = asRecord(catalog?.capabilityCatalog)
  const viewTreeExtensions = arrayStrings(capabilityCatalog?.viewTreeExtractorExtensions)
  const analyzerExtensions = arrayStrings(capabilityCatalog?.analyzerExtensions)
  const graphIngestionCandidates = arrayStrings(capabilityCatalog?.graphIngestionCandidates)
  const downstreamCompatibility = asRecord(catalog?.downstreamCompatibility)
  const sourceStatus = viewTree ? stringValue(viewTree.status) : null
  const sourceArtifactRole = viewTree
    ? stringValue(viewTree.viewTreeArtifactRole) || stringValue(viewTree.artifactRole) || null
    : null
  return {
    applicableViewTreeExtractorExtensions: viewTreeExtensions,
    analyzerExtensions,
    graphIngestionCandidates,
    canInformViewTree: downstreamCompatibility?.canInformViewTree === true,
    sourceViewTreeStatus: sourceStatus,
    sourceViewTreeArtifactRole: sourceArtifactRole,
    sourceViewTreeId: viewTree
      ? stringValue(viewTree.viewTreeId) || stringValue(viewTree.selectedGraphSliceId) || null
      : null,
    selectedNodeCount: viewTree ? countFirstArray(viewTree, ['selectedNodes', 'includedNodeIds', 'nodes']) : null,
    selectedEdgeCount: viewTree ? countFirstArray(viewTree, ['selectedEdges', 'includedEdgeIds', 'edges']) : null,
    alignmentStatus: !viewTree
      ? 'view-tree-source-not-provided'
      : viewTreeExtensions.length > 0
        ? 'view-tree-extension-hints-available-for-source-view-tree'
        : 'view-tree-source-present-no-extension-hints',
    authorityStatus: 'hint-only-not-traversal-authority',
  }
}

function buildContextPackHintPlan(
  catalog: JsonRecord | null,
  contextPack: JsonRecord | null,
): ExtensionContextPlanReport['contextPackHintPlan'] {
  const capabilityCatalog = asRecord(catalog?.capabilityCatalog)
  const analyzerExtensions = arrayStrings(capabilityCatalog?.analyzerExtensions)
  const contextPackExtensions = arrayStrings(capabilityCatalog?.contextPackExtensions)
  const downstreamCompatibility = asRecord(catalog?.downstreamCompatibility)
  return {
    contextPackExtensions,
    analyzerExtensions,
    analyzerExtensionCount: analyzerExtensions.length,
    contextPackExtensionCount: contextPackExtensions.length,
    canInformContextPack: downstreamCompatibility?.canInformContextPack === true,
    sourceContextPackStatus: contextPack ? stringValue(contextPack.status) || null : null,
    sourceContextPackArtifactRole: contextPack ? stringValue(contextPack.artifactRole) || null : null,
    boundedSubgraphNodeCount: contextPack ? countFirstArray(contextPack, ['nodeIds', 'selectedNodeIds']) : null,
    allowedContextCount: contextPack
      ? countFirstArray(contextPack, ['allowedScope', 'allowedFiles', 'allowedPaths'])
      : null,
    forbiddenContextCount: contextPack
      ? countFirstArray(contextPack, ['forbiddenScope', 'forbiddenFiles', 'forbiddenPaths'])
      : null,
    requiredEvidenceCount: contextPack
      ? countFirstArray(contextPack, ['requiredEvidence', 'evidenceRequirements'])
      : null,
    allowedContextClassHints: [],
    forbiddenContextClassHints: [],
    alignmentStatus: !contextPack
      ? 'context-pack-source-not-provided'
      : contextPackExtensions.length > 0
        ? 'context-pack-extension-hints-available-for-source-context-pack'
        : 'context-pack-source-present-no-extension-hints',
    authorityStatus: 'hint-only-not-context-pack-authority',
  }
}

function buildEvidencePolicyHintPlan(catalog: JsonRecord | null): ExtensionContextPlanReport['evidencePolicyHintPlan'] {
  const capabilityCatalog = asRecord(catalog?.capabilityCatalog)
  const downstreamCompatibility = asRecord(catalog?.downstreamCompatibility)
  return {
    evidenceAdapters: arrayStrings(capabilityCatalog?.evidenceAdapters),
    policyExtensions: arrayStrings(capabilityCatalog?.policyExtensions),
    canInformEvidenceAdapterValidation: downstreamCompatibility?.canInformEvidenceAdapterValidation === true,
    canInformPolicyValidation: downstreamCompatibility?.canInformPolicyValidation === true,
    canSatisfyEvidence: false,
    canProveEquivalence: false,
    canEnforceScope: false,
    authorityStatus: 'hint-only-not-evidence-proof-or-scope-authority',
  }
}

function buildNativeRetrofitPlanning(catalog: JsonRecord | null): ExtensionContextPlanReport['nativeRetrofitPlanning'] {
  const hints = asRecord(catalog?.nativeRetrofitProfileHints)
  const mode = stringValue(hints?.mode) || 'unknown'
  const hintStatus = stringValue(hints?.hintStatus) || 'profile-mode-unknown'
  const recommendations =
    mode === 'unknown'
      ? ['Add project profile mode fields before Native/Retrofit-specific extractor or evidence planning.']
      : [`Use ${mode} profile hints to shape future extractor, evidence, and policy planning reports.`]
  return {
    mode,
    hintStatus,
    nativeSignals: arrayStrings(hints?.nativeSignals),
    retrofitSignals: arrayStrings(hints?.retrofitSignals),
    futureFieldCandidates: arrayStrings(hints?.futureFieldCandidates),
    recommendations,
  }
}

function buildGraphIngestionPlanning(catalog: JsonRecord | null): ExtensionContextPlanReport['graphIngestionPlanning'] {
  const candidates = arrayRecords(catalog?.graphIngestionCandidates).map((candidate) => ({
    extensionId: stringValue(candidate.extensionId),
    graphProviderKind: stringValue(candidate.graphProviderKind) || null,
    protocolStatus: 'protocol-only-not-executed' as const,
    executionAllowed: false as const,
    providerInvoked: false as const,
    networkCallMade: false as const,
    shellCommandsExecuted: false as const,
  }))
  return {
    candidates,
    candidateCount: candidates.length,
    graphifyCandidateCount: candidates.filter((candidate) => candidate.graphProviderKind === 'graphify').length,
    providerInvoked: false,
    networkCallMade: false,
    shellCommandsExecuted: false,
    executionAllowed: false,
    authorityStatus: 'protocol-only-not-graph-ingestion-authority',
  }
}

function buildDownstreamActionPlan(
  catalog: JsonRecord | null,
  viewTree: JsonRecord | null,
  contextPack: JsonRecord | null,
): ExtensionContextPlanReport['downstreamActionPlan'] {
  const capabilityCatalog = asRecord(catalog?.capabilityCatalog)
  const actions: ExtensionContextPlanReport['downstreamActionPlan'] = []
  if (arrayStrings(capabilityCatalog?.viewTreeExtractorExtensions).length > 0) {
    actions.push({
      actionId: 'connect-view-tree-hints',
      recommendedAction: 'Use View Tree extractor extension ids as non-executing hints in future View Tree planning.',
      reason: viewTree ? 'A View Tree source was supplied for alignment.' : 'No View Tree source was supplied yet.',
      authorityBoundary: 'Hints do not grant traversal authority or mutate View Tree artifacts.',
    })
  }
  if (arrayStrings(capabilityCatalog?.contextPackExtensions).length > 0) {
    actions.push({
      actionId: 'connect-context-pack-hints',
      recommendedAction: 'Use Context Pack extension ids as non-executing hints in future Context Pack planning.',
      reason: contextPack
        ? 'A Context Pack source was supplied for alignment.'
        : 'No Context Pack source was supplied yet.',
      authorityBoundary: 'Hints do not mutate Context Pack artifacts or change allowed/forbidden scope.',
    })
  }
  if (arrayRecords(catalog?.graphIngestionCandidates).length > 0) {
    actions.push({
      actionId: 'plan-graph-ingestion-protocol',
      recommendedAction: 'Validate graph-ingestion protocol compatibility before any future adapter execution design.',
      reason: 'The catalog declares protocol-only graph ingestion candidates.',
      authorityBoundary: 'No Graphify or external graph provider is installed, invoked, or contacted.',
    })
  }
  if (actions.length === 0) {
    actions.push({
      actionId: 'add-extension-capabilities',
      recommendedAction:
        'Declare View Tree, Context Pack, Evidence, policy, or graph-ingestion capabilities as needed.',
      reason: 'No downstream planning capabilities are present in the catalog.',
      authorityBoundary: 'Declaring capabilities remains report-only until a later authorized execution model exists.',
    })
  }
  return actions
}

function choosePlanStatus(
  findings: ExtensionContextPlanFinding[],
): ExtensionContextPlanReport['extensionContextPlanStatus'] {
  const errors = findings.filter((finding) => finding.severity === 'error')
  if (errors.length === 0) return 'generated-report-only-hints'
  if (errors.some((finding) => finding.code.includes('UNSAFE_AUTHORITY_FLAG'))) return 'blocked-unsafe-authority-flag'
  if (errors.some((finding) => finding.code.includes('VIEW_TREE'))) return 'blocked-view-tree-invalid'
  if (errors.some((finding) => finding.code.includes('CONTEXT_PACK'))) return 'blocked-context-pack-invalid'
  return 'blocked-extension-profile-catalog-invalid'
}

async function assertPlanOutputAuthority(
  root: string,
  input: {
    catalogPath: string
    viewTreePath: string | null
    contextPackPath: string | null
    output?: string
    markdown?: string
  },
): Promise<void> {
  const outputPath = input.output ? resolveRepoPath(root, input.output) : undefined
  const markdownPath = input.markdown ? resolveRepoPath(root, input.markdown) : undefined
  if (outputPath && markdownPath && pathKey(outputPath) === pathKey(markdownPath)) {
    throw new Error('Extension context plan output is unsafe: --output and --markdown must be different paths.')
  }
  const protectedPaths = new Map<string, string>()
  protectedPaths.set(pathKey(input.catalogPath), 'the source Extension Profile Catalog')
  if (input.viewTreePath) protectedPaths.set(pathKey(input.viewTreePath), 'the source View Tree')
  if (input.contextPackPath) protectedPaths.set(pathKey(input.contextPackPath), 'the source Context Pack')
  for (const [label, requested, resolved] of [
    ['JSON output', input.output, outputPath],
    ['Markdown output', input.markdown, markdownPath],
  ] as const) {
    if (!requested || !resolved) continue
    const protectedReason = protectedPaths.get(pathKey(resolved))
    if (protectedReason) {
      throw new Error(
        `Extension context plan ${label} path is unsafe: ${requested} would overwrite ${protectedReason}.`,
      )
    }
    if (isProtectedControlPath(root, resolved)) {
      throw new Error(
        `Extension context plan ${label} path is unsafe: ${requested} is inside a protected control path.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(resolved)
    if (existingAuthority) {
      throw new Error(
        `Extension context plan ${label} path is unsafe: ${requested} already contains ${existingAuthority}. Choose a dedicated context plan output path.`,
      )
    }
  }
}

function renderExtensionContextPlanMarkdown(report: ExtensionContextPlanReport): string {
  return [
    '# DevView Extension Context Plan',
    '',
    `- status: ${report.status}`,
    `- planStatus: ${report.extensionContextPlanStatus}`,
    `- catalog: ${report.sourceExtensionProfileCatalog}`,
    `- viewTree: ${report.sourceViewTree ?? 'not provided'}`,
    `- contextPack: ${report.sourceContextPack ?? 'not provided'}`,
    `- extensionExecutionAllowed: ${report.extensionExecutionAllowed}`,
    `- providerInvoked: ${report.providerInvoked}`,
    `- networkCallMade: ${report.networkCallMade}`,
    `- shellCommandsExecuted: ${report.shellCommandsExecuted}`,
    '',
    '## View Tree Hints',
    '',
    `- extensions: ${formatListInline(report.viewTreeHintPlan.applicableViewTreeExtractorExtensions)}`,
    `- alignmentStatus: ${report.viewTreeHintPlan.alignmentStatus}`,
    '',
    '## Context Pack Hints',
    '',
    `- extensions: ${formatListInline(report.contextPackHintPlan.contextPackExtensions)}`,
    `- alignmentStatus: ${report.contextPackHintPlan.alignmentStatus}`,
    '',
    '## Evidence And Policy Hints',
    '',
    `- evidenceAdapters: ${formatListInline(report.evidencePolicyHintPlan.evidenceAdapters)}`,
    `- policyExtensions: ${formatListInline(report.evidencePolicyHintPlan.policyExtensions)}`,
    '',
    '## Findings',
    '',
    ...(report.findings.length
      ? report.findings.map((entry) => `- [${entry.severity}] ${entry.code}: ${entry.message}`)
      : ['- none']),
  ].join('\n')
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) return null
  const record = asRecord(parsed.value)
  if (!record) return null
  const artifactRole = stringValue(record.artifactRole)
  if (!artifactRole || artifactRole === REPORT_ROLE) return null
  if (
    artifactRole.includes('graph-source') ||
    artifactRole.includes('read-model') ||
    artifactRole.includes('evidence') ||
    artifactRole.includes('policy') ||
    artifactRole.includes('proposal') ||
    artifactRole.includes('decision') ||
    artifactRole.includes('view-tree') ||
    artifactRole.includes('context-pack') ||
    artifactRole === 'selected-graph-slice' ||
    artifactRole === 'contract-compiler-input' ||
    artifactRole === CATALOG_ROLE
  ) {
    return `source artifactRole "${artifactRole}"`
  }
  if (asRecord(record.sourceRecords)) return 'graph-source-shaped sourceRecords'
  if (Array.isArray(record.nodes) || Array.isArray(record.edges)) return 'read-model-shaped nodes/edges'
  return null
}

function collectUnsafeAuthorityFields(value: unknown, pathParts: string[] = [], seen = new Set<unknown>()): string[] {
  if (typeof value !== 'object' || value === null) return []
  if (seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectUnsafeAuthorityFields(entry, [...pathParts, String(index)], seen))
  }
  const fields: string[] = []
  for (const [key, entry] of Object.entries(value as JsonRecord)) {
    const nextPath = [...pathParts, key]
    if (unsafeAuthorityFields.includes(key) && entry === true) {
      fields.push(nextPath.join('.'))
    }
    fields.push(...collectUnsafeAuthorityFields(entry, nextPath, seen))
  }
  return fields
}

function countFirstArray(record: JsonRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = findValueByKey(record, key, new Set())
    if (Array.isArray(value)) return value.length
  }
  return null
}

function findValueByKey(value: unknown, key: string, seen: Set<unknown>): unknown {
  if (typeof value !== 'object' || value === null || seen.has(value)) return undefined
  seen.add(value)
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findValueByKey(entry, key, seen)
      if (found !== undefined) return found
    }
    return undefined
  }
  const record = value as JsonRecord
  if (record[key] !== undefined) return record[key]
  for (const entry of Object.values(record)) {
    const found = findValueByKey(entry, key, seen)
    if (found !== undefined) return found
  }
  return undefined
}

function capabilityGroupCounts(capabilityCatalog: JsonRecord | null): Record<string, number> {
  return {
    analyzerExtensions: arrayStrings(capabilityCatalog?.analyzerExtensions).length,
    viewTreeExtractorExtensions: arrayStrings(capabilityCatalog?.viewTreeExtractorExtensions).length,
    contextPackExtensions: arrayStrings(capabilityCatalog?.contextPackExtensions).length,
    evidenceAdapters: arrayStrings(capabilityCatalog?.evidenceAdapters).length,
    policyExtensions: arrayStrings(capabilityCatalog?.policyExtensions).length,
    skillWorkflowExtensions: arrayStrings(capabilityCatalog?.skillWorkflowExtensions).length,
    graphIngestionCandidates: arrayStrings(capabilityCatalog?.graphIngestionCandidates).length,
  }
}

function isProtectedControlPath(root: string, resolvedPath: string): boolean {
  const relative = relativePath(root, resolvedPath)
  return (
    hasDevViewControlDirectory(relative) ||
    hasCodexControlDirectory(relative) ||
    hasHiddenControlDirectorySegment(relative)
  )
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath)
}

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : null
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function arrayRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.map((entry) => asRecord(entry)).filter((entry): entry is JsonRecord => Boolean(entry))
    : []
}

function arrayStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function slugCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function formatListInline(values: string[]): string {
  return values.length ? values.join(', ') : 'none'
}
