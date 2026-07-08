import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'
import { CodeSubgraphValidationError, validateCodeSubgraphRecord } from './code-subgraph-validation.js'
import type { IssueSeverity } from './types.js'

const SELECTOR_NAME = 'SelectedGraphSliceGenerator'
const VIEW_TREE_ARTIFACT_ROLE = 'devview-view-tree-preview'
const VIEW_TREE_KIND = 'maintainability-graph-derived-task-view-tree'
const CODE_SUBGRAPH_ROLE = 'devview-code-subgraph'
const CODE_SUBGRAPH_STATUS = 'devview-code-subgraph-supplied'
const CODE_SUBGRAPH_SCOPE = 'code-subgraph-source-fact-only'
const CODE_SYMBOL_LINK_VALIDATION_ROLE = 'devview-code-symbol-link-validation-report'
const CODE_SYMBOL_LINK_VALIDATION_STATUS = 'devview-code-symbol-link-validation-passed'
const CODE_SYMBOL_LINK_VALIDATION_SCOPE = 'code-symbol-link-validation-report-only'

type JsonRecord = Record<string, unknown>

interface LoadedViewTreeArtifact {
  relativePath: string
  record: JsonRecord | null
  sha256: string | null
  readError: string | null
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
]

export interface SelectedGraphSliceFinding {
  code: string
  severity: IssueSeverity
  field?: string
  message: string
  expected?: unknown
  actual?: unknown
  suggestedFix?: string
}

export interface SelectedGraphSliceAuthorityInputs {
  graphSource?: unknown
  generatedReadModel?: unknown
  graphSourcePath?: string
  generatedReadModelPath?: string
}

export interface SelectedGraphSliceNode {
  nodeId: string
  nodeKind: string
  title?: string
  sourceArtifact?: string
  selectionReason: string
  selectedAs: string[]
  sourceAuthorityStatus: string
}

export interface SelectedGraphSliceEdge {
  edgeId: string
  from: string
  to: string
  edgeType: string
  selectionReason: string
  sourceAuthorityStatus: string
}

export interface ExcludedGraphSliceNode {
  nodeId: string
  nodeKind: string
  exclusionReason: string
}

export interface ExcludedGraphSliceEdge {
  edgeId: string
  from: string
  to: string
  edgeType: string
  exclusionReason: string
}

export interface SelectedGraphSliceTraceEntry {
  action: 'selected-node' | 'selected-edge' | 'selected-code-node' | 'excluded-node' | 'excluded-edge' | 'blocked'
  nodeId?: string
  edgeId?: string
  reason: string
  source: string
}

export interface SelectedGraphSliceCodeLink {
  linkId: string
  sourceNodeId: string
  sourceNodeKind: string
  linkType: string
  confidence: string
  sourceFile?: string
  sourceLocationStatus?: string
  sourceLocation?: unknown
}

export interface SelectedGraphSliceCodeNode {
  nodeId: string
  nodeKind: string
  label?: string
  sourceFile?: string
  sourceLocationStatus?: string
  sourceLocation?: unknown
  sourceDigest?: string
  confidence?: string
  selectionReason: string
  selectedAs: string[]
  sourceAuthorityStatus: 'selected-from-devview-code-subgraph-source-fact'
  linkedFrom: SelectedGraphSliceCodeLink[]
}

export interface SelectedGraphSliceCodeSymbolContext {
  artifactRole: 'devview-view-tree-code-symbol-context'
  status:
    | 'devview-view-tree-code-symbol-context-selected'
    | 'devview-view-tree-code-symbol-context-empty'
    | 'devview-view-tree-code-symbol-context-blocked'
  scope: 'unified-maintainability-graph-view-tree-code-selection'
  reportOnly: true
  sourceCodeSubgraph: {
    path: string | null
    artifactRole: string | null
    status: string | null
    scope: string | null
    sha256: string | null
    nodeCount: number
    edgeCount: number
  }
  sourceCodeSymbolLinksValidation: {
    path: string | null
    artifactRole: string | null
    status: string | null
    scope: string | null
    sha256: string | null
    validatedLinkCount: number
  }
  selectedCodeNodeCount: number
  linkedMaintenanceNodeCount: number
  selectedLinkCount: number
  missingCodeNodeCount: number
  unifiedGraphBoundary: {
    separateCodeGraphCreated: false
    graphSourceMutated: false
    graphDeltaApplied: false
    contextPackGenerated: false
    codeSubgraphGenerated: false
  }
}

export interface SelectedGraphSliceResult {
  schemaVersion: 1
  artifactRole: 'selected-graph-slice'
  status: 'selected-graph-slice-generated' | 'selected-graph-slice-blocked' | 'selected-graph-slice-incomplete'
  viewTreeArtifactRole: typeof VIEW_TREE_ARTIFACT_ROLE
  viewTreeStatus:
    | 'devview-view-tree-preview-generated'
    | 'devview-view-tree-preview-blocked'
    | 'devview-view-tree-preview-incomplete'
  viewTreeId: string
  viewTreeKind: typeof VIEW_TREE_KIND
  viewTreeProjectionSource: 'maintainability-graph-derived-selected-graph-slice'
  sourceMaintainabilityGraph: string
  sourceMaintainabilityGraphReadModel: string
  contextPackBoundary: {
    contextPackRole: 'bounded-subgraph-package-around-view-tree'
    contextPackGenerated: false
    contextPackSource: 'view-tree-selected-nodes-and-edges'
    instructionPackGenerated: false
    runtimeEvidenceSatisfied: false
    equivalenceProven: false
    scopeEnforced: false
    ciEnforcementEnabled: false
  }
  selectorName: typeof SELECTOR_NAME
  selectionScope: 'deterministic-selected-slice-no-contract-input'
  sourceTraversalPlan: string
  sourceGraphAwareValidation: string
  graphSourcePath: string
  generatedReadModelPath: string
  selectedGraphSliceId: string
  selectedGraphSliceStatus: 'generated' | 'blocked' | 'incomplete'
  graphTraversalExecuted: boolean
  selectedGraphSliceGenerated: boolean
  contractInputGenerated: false
  instructionPackGenerated: false
  graphSourceMutated: false
  graphDeltaApplied: false
  approvalStatus: 'not-approved'
  equivalenceProven: false
  runtimeEvidenceSatisfied: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  prerequisiteStatus: 'passed' | 'blocked'
  startNodeResolutionStatus: 'resolved' | 'unresolved' | 'ambiguous' | 'blocked'
  selectedNodes: SelectedGraphSliceNode[]
  selectedEdges: SelectedGraphSliceEdge[]
  selectedCodeNodes?: SelectedGraphSliceCodeNode[]
  codeSymbolContext?: SelectedGraphSliceCodeSymbolContext
  includedPolicyNodes: SelectedGraphSliceNode[]
  includedScopeNodes: SelectedGraphSliceNode[]
  includedEvidenceNodes: SelectedGraphSliceNode[]
  includedRiskNodes: SelectedGraphSliceNode[]
  excludedNodes: ExcludedGraphSliceNode[]
  excludedEdges: ExcludedGraphSliceEdge[]
  selectionTrace: SelectedGraphSliceTraceEntry[]
  sliceCompletenessStatus: 'complete' | 'incomplete' | 'ambiguous' | 'review-required' | 'blocked'
  contractInputReadinessStatus: 'ready' | 'not-ready' | 'review-required'
  contractInputGenerationAllowed: false
  requiresClarification: boolean
  humanReviewRequired: boolean
  validationFindings: SelectedGraphSliceFinding[]
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-preview-output-not-graph-source'
  nonExecutionBoundary: string
}

export interface SelectedGraphSliceFileResult {
  result: SelectedGraphSliceResult
  outputPath?: string
}

export interface SelectedGraphSliceCodeSymbolInputs {
  codeSubgraph?: unknown
  codeSymbolLinksValidation?: unknown
  codeSubgraphPath?: string
  codeSymbolLinksValidationPath?: string
  codeSubgraphSha256?: string | null
  codeSymbolLinksValidationSha256?: string | null
  codeSubgraphReadError?: string | null
  codeSymbolLinksValidationReadError?: string | null
}

export function generateSelectedGraphSlice(
  traversalPlan: unknown,
  authorityInputs: SelectedGraphSliceAuthorityInputs,
  paths: {
    traversalPlanPath?: string
    codeSubgraphPath?: string
    codeSymbolLinksValidationPath?: string
  } = {},
  codeSymbolInputs: SelectedGraphSliceCodeSymbolInputs = {},
): SelectedGraphSliceResult {
  const findings: SelectedGraphSliceFinding[] = []
  const selectionTrace: SelectedGraphSliceTraceEntry[] = []
  const plan = asRecord(traversalPlan)
  const graphSource = asRecord(authorityInputs.graphSource)
  const readModel = asRecord(authorityInputs.generatedReadModel)

  const graphSourcePath =
    authorityInputs.graphSourcePath ||
    stringValue(plan?.graphSourcePath) ||
    'examples/valid/todo-app-devview-run/graph-source.json'
  const generatedReadModelPath =
    authorityInputs.generatedReadModelPath ||
    stringValue(plan?.generatedReadModelPath) ||
    'examples/valid/todo-app-devview-run/generated/generated-read-model.json'

  validateTraversalPlanPrerequisites(plan, findings)

  if (!graphSource) {
    findings.push({
      code: 'SELECTED_GRAPH_SLICE_GRAPH_SOURCE_MISSING',
      severity: 'error',
      field: 'graphSourcePath',
      message: `Selected graph slice generation requires a readable graph source at ${graphSourcePath}.`,
      suggestedFix: 'Regenerate or provide the graph source referenced by the traversal plan.',
    })
  }

  if (!readModel) {
    findings.push({
      code: 'SELECTED_GRAPH_SLICE_READ_MODEL_MISSING',
      severity: 'error',
      field: 'generatedReadModelPath',
      message: `Selected graph slice generation requires a readable generated read model at ${generatedReadModelPath}.`,
      suggestedFix: 'Regenerate or provide the generated read model referenced by the traversal plan.',
    })
  }

  const graphNodes = arrayRecords(asRecord(graphSource?.sourceRecords)?.nodes)
  const graphEdges = arrayRecords(asRecord(graphSource?.sourceRecords)?.edges)
  const readModelNodes = arrayRecords(readModel?.nodes)
  const readModelEdges = arrayRecords(readModel?.edges)
  const taxonomy = asRecord(readModel?.taxonomy)
  const nodeKindVocabulary = uniqueStrings(taxonomy?.nodeKindsUsed, [
    ...graphNodes.map((node) => stringValue(node.nodeKind)),
    ...readModelNodes.map((node) => stringValue(node.nodeKind)),
  ])
  const edgeTypeVocabulary = uniqueStrings(taxonomy?.edgeTypesUsed, [
    ...graphEdges.map((edge) => stringValue(edge.edgeType)),
    ...readModelEdges.map((edge) => stringValue(edge.edgeType)),
  ])

  validatePlanVocabulary(plan, nodeKindVocabulary, edgeTypeVocabulary, findings)

  const startNodeCandidates = arrayRecords(plan?.startNodeCandidates)
  const startNodeCandidate = startNodeCandidates.length === 1 ? startNodeCandidates[0] : null
  const startNodeId = stringValue(startNodeCandidate?.nodeId)
  const graphNodeById = mapById(graphNodes)
  const readModelNodeById = mapById(readModelNodes)
  const graphEdgeById = mapById(graphEdges)
  const readModelEdgeById = mapById(readModelEdges)
  const startNode = graphNodeById.get(startNodeId) ?? readModelNodeById.get(startNodeId) ?? null

  let startNodeResolutionStatus: SelectedGraphSliceResult['startNodeResolutionStatus'] = 'blocked'
  if (plan && graphSource && readModel) {
    if (startNodeCandidates.length !== 1) {
      startNodeResolutionStatus = startNodeCandidates.length === 0 ? 'unresolved' : 'ambiguous'
      findings.push({
        code: 'SELECTED_GRAPH_SLICE_START_NODE_CANDIDATE_COUNT_INVALID',
        severity: 'error',
        field: 'startNodeCandidates',
        message: 'Selected graph slice generation requires exactly one resolved start node candidate.',
        expected: 1,
        actual: startNodeCandidates.length,
      })
    } else if (!startNodeId) {
      startNodeResolutionStatus = 'unresolved'
      findings.push({
        code: 'SELECTED_GRAPH_SLICE_START_NODE_ID_MISSING',
        severity: 'error',
        field: 'startNodeCandidates[0].nodeId',
        message: 'Selected graph slice generation requires startNodeCandidates[0].nodeId.',
      })
    } else if (!startNode) {
      startNodeResolutionStatus = 'unresolved'
      findings.push({
        code: 'SELECTED_GRAPH_SLICE_START_NODE_NOT_FOUND',
        severity: 'error',
        field: 'startNodeCandidates[0].nodeId',
        message: `Start node "${startNodeId}" was not found in graph source or generated read model.`,
      })
    } else {
      startNodeResolutionStatus = 'resolved'
    }
  }

  const prerequisiteBlocked = findings.some((finding) => finding.severity === 'error')
  const selectedNodes = new Map<string, SelectedGraphSliceNode>()
  const selectedEdges = new Map<string, SelectedGraphSliceEdge>()
  const excludedNodes: ExcludedGraphSliceNode[] = []
  const excludedEdges: ExcludedGraphSliceEdge[] = []

  if (!prerequisiteBlocked && startNode) {
    const startNodeSlice = toSelectedNode(
      startNode,
      'start node selected from traversal plan startNodeCandidates[0]',
      ['start-node', 'target-change'],
      sourceAuthorityForNode(startNodeId, graphNodeById, readModelNodeById),
    )
    selectedNodes.set(startNodeSlice.nodeId, startNodeSlice)
    selectionTrace.push({
      action: 'selected-node',
      nodeId: startNodeSlice.nodeId,
      reason: startNodeSlice.selectionReason,
      source: 'traversal-plan',
    })

    const requiredEdgeTypes = stringArray(plan?.requiredEdgeTypes)
    const optionalEdgeTypes = stringArray(plan?.optionalEdgeTypes)
    const excludedEdgeTypes = new Set(stringArray(plan?.excludedEdgeTypes))
    const requiredNodeTypes = stringArray(plan?.requiredNodeTypes)
    const optionalNodeTypes = stringArray(plan?.optionalNodeTypes)
    const excludedNodeTypes = new Set(stringArray(plan?.excludedNodeTypes))
    const allowedEdgeTypes = new Set([...requiredEdgeTypes, ...optionalEdgeTypes])
    const allowedNodeTypes = new Set([...requiredNodeTypes, ...optionalNodeTypes])
    const directEdges = graphEdges.filter((edge) => edge.from === startNodeId || edge.to === startNodeId)

    for (const edge of directEdges) {
      const edgeId = stringValue(edge.id)
      const edgeType = stringValue(edge.edgeType)
      const from = stringValue(edge.from)
      const to = stringValue(edge.to)
      const neighborId = from === startNodeId ? to : from
      const neighbor = graphNodeById.get(neighborId) ?? readModelNodeById.get(neighborId)
      const neighborKind = stringValue(neighbor?.nodeKind)

      if (excludedEdgeTypes.has(edgeType) || edgeType === 'approves') {
        excludedEdges.push({
          edgeId,
          from,
          to,
          edgeType,
          exclusionReason:
            edgeType === 'approves'
              ? 'approval edge excluded by MVP selection policy'
              : 'edge type excluded by traversal plan',
        })
        selectionTrace.push({
          action: 'excluded-edge',
          edgeId,
          reason: excludedEdges[excludedEdges.length - 1]?.exclusionReason ?? 'edge excluded',
          source: 'graph-source',
        })
        continue
      }

      if (!allowedEdgeTypes.has(edgeType)) {
        excludedEdges.push({
          edgeId,
          from,
          to,
          edgeType,
          exclusionReason: 'edge type is not required or optional in traversal plan',
        })
        selectionTrace.push({
          action: 'excluded-edge',
          edgeId,
          reason: 'edge type is not required or optional in traversal plan',
          source: 'graph-source',
        })
        continue
      }

      if (!neighbor) {
        excludedEdges.push({
          edgeId,
          from,
          to,
          edgeType,
          exclusionReason: `neighbor node "${neighborId}" was not found in graph source or generated read model`,
        })
        selectionTrace.push({
          action: 'excluded-edge',
          edgeId,
          reason: `neighbor node "${neighborId}" missing`,
          source: 'graph-source',
        })
        continue
      }

      if (excludedNodeTypes.has(neighborKind) || !allowedNodeTypes.has(neighborKind)) {
        excludedNodes.push({
          nodeId: neighborId,
          nodeKind: neighborKind,
          exclusionReason: excludedNodeTypes.has(neighborKind)
            ? 'node kind excluded by traversal plan'
            : 'node kind is not required or optional in traversal plan',
        })
        excludedEdges.push({
          edgeId,
          from,
          to,
          edgeType,
          exclusionReason: `neighbor node kind "${neighborKind}" is outside selected traversal plan node kinds`,
        })
        selectionTrace.push({
          action: 'excluded-node',
          nodeId: neighborId,
          reason: excludedNodes[excludedNodes.length - 1]?.exclusionReason ?? 'node excluded',
          source: 'graph-source',
        })
        selectionTrace.push({
          action: 'excluded-edge',
          edgeId,
          reason: `neighbor node kind "${neighborKind}" not allowed`,
          source: 'graph-source',
        })
        continue
      }

      const selectedEdge = toSelectedEdge(edge, 'direct edge connected to resolved traversal start node')
      selectedEdges.set(selectedEdge.edgeId, selectedEdge)
      selectionTrace.push({
        action: 'selected-edge',
        edgeId: selectedEdge.edgeId,
        reason: selectedEdge.selectionReason,
        source: 'graph-source',
      })

      if (!selectedNodes.has(neighborId)) {
        const selectedNeighbor = toSelectedNode(
          neighbor,
          `direct neighbor selected through ${edgeType} edge ${edgeId}`,
          selectedAsForNodeKind(neighborKind),
          sourceAuthorityForNode(neighborId, graphNodeById, readModelNodeById),
        )
        selectedNodes.set(selectedNeighbor.nodeId, selectedNeighbor)
        selectionTrace.push({
          action: 'selected-node',
          nodeId: selectedNeighbor.nodeId,
          reason: selectedNeighbor.selectionReason,
          source: 'graph-source',
        })
      }

      if (!graphEdgeById.has(edgeId) && !readModelEdgeById.has(edgeId)) {
        findings.push({
          code: 'SELECTED_GRAPH_SLICE_EDGE_SOURCE_AUTHORITY_MISSING',
          severity: 'warning',
          field: 'selectedEdges',
          message: `Selected edge "${edgeId}" was not found in graph-source or generated read-model edge maps.`,
        })
      }
    }
  } else if (prerequisiteBlocked) {
    selectionTrace.push({
      action: 'blocked',
      reason: 'selected graph slice prerequisites failed',
      source: 'traversal-plan',
    })
  }

  const selectedNodeValues = [...selectedNodes.values()]
  const selectedEdgeValues = [...selectedEdges.values()]
  const includedEvidenceNodes = selectedNodeValues.filter((node) =>
    ['evidence', 'check', 'log'].includes(node.nodeKind),
  )
  const includedScopeNodes = selectedNodeValues.filter((node) =>
    ['task', 'code', 'requirement', 'change'].includes(node.nodeKind),
  )
  const includedRiskNodes = selectedNodeValues.filter((node) => node.nodeKind === 'finding')
  const includedPolicyNodes = selectedNodeValues.filter((node) => node.nodeKind === 'document')
  const codeSymbolSelection = selectCodeSymbolsForViewTree(
    codeSymbolInputs,
    selectedNodeValues,
    findings,
    selectionTrace,
  )
  const blocked = findings.some((finding) => finding.severity === 'error')
  const hasEvidenceOrCheck = includedEvidenceNodes.length > 0
  const incomplete = !blocked && !hasEvidenceOrCheck
  if (incomplete) {
    findings.push({
      code: 'SELECTED_GRAPH_SLICE_REQUIRED_EVIDENCE_OR_CHECK_MISSING',
      severity: 'warning',
      field: 'includedEvidenceNodes',
      message:
        'Selected graph slice did not include an evidence or check node, so contract input readiness remains review-required.',
    })
  }
  const status = blocked
    ? 'selected-graph-slice-blocked'
    : incomplete
      ? 'selected-graph-slice-incomplete'
      : 'selected-graph-slice-generated'
  const viewTreeStatus = blocked
    ? 'devview-view-tree-preview-blocked'
    : incomplete
      ? 'devview-view-tree-preview-incomplete'
      : 'devview-view-tree-preview-generated'
  const sliceCompletenessStatus = blocked ? 'blocked' : incomplete ? 'incomplete' : 'complete'

  return {
    schemaVersion: 1,
    artifactRole: 'selected-graph-slice',
    status,
    viewTreeArtifactRole: VIEW_TREE_ARTIFACT_ROLE,
    viewTreeStatus,
    viewTreeId: 'devview-view-tree-add-todo-runtime-evidence-only',
    viewTreeKind: VIEW_TREE_KIND,
    viewTreeProjectionSource: 'maintainability-graph-derived-selected-graph-slice',
    sourceMaintainabilityGraph: graphSourcePath,
    sourceMaintainabilityGraphReadModel: generatedReadModelPath,
    contextPackBoundary: {
      contextPackRole: 'bounded-subgraph-package-around-view-tree',
      contextPackGenerated: false,
      contextPackSource: 'view-tree-selected-nodes-and-edges',
      instructionPackGenerated: false,
      runtimeEvidenceSatisfied: false,
      equivalenceProven: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
    },
    selectorName: SELECTOR_NAME,
    selectionScope: 'deterministic-selected-slice-no-contract-input',
    sourceTraversalPlan: paths.traversalPlanPath ?? '<in-memory>',
    sourceGraphAwareValidation: stringValue(plan?.sourceGraphAwareValidation) || '<unknown>',
    graphSourcePath,
    generatedReadModelPath,
    selectedGraphSliceId: 'selected-graph-slice-add-todo-runtime-evidence-only',
    selectedGraphSliceStatus: blocked ? 'blocked' : incomplete ? 'incomplete' : 'generated',
    graphTraversalExecuted: !prerequisiteBlocked,
    selectedGraphSliceGenerated: !blocked && !incomplete,
    contractInputGenerated: false,
    instructionPackGenerated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    prerequisiteStatus: blocked ? 'blocked' : 'passed',
    startNodeResolutionStatus,
    selectedNodes: selectedNodeValues,
    selectedEdges: selectedEdgeValues,
    ...(codeSymbolSelection
      ? {
          selectedCodeNodes: codeSymbolSelection.selectedCodeNodes,
          codeSymbolContext: codeSymbolSelection.codeSymbolContext,
        }
      : {}),
    includedPolicyNodes,
    includedScopeNodes,
    includedEvidenceNodes,
    includedRiskNodes,
    excludedNodes,
    excludedEdges,
    selectionTrace,
    sliceCompletenessStatus,
    contractInputReadinessStatus: blocked || incomplete ? 'review-required' : 'not-ready',
    contractInputGenerationAllowed: false,
    requiresClarification: startNodeResolutionStatus === 'unresolved',
    humanReviewRequired: true,
    validationFindings: findings,
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    nonExecutionBoundary:
      'This selected graph slice generator executes deterministic graph slice selection only. It does not generate contract compiler input, does not generate instruction packs, does not call an LLM, does not mutate graph-source, does not apply graph deltas, does not approve work, does not record human decisions, does not satisfy runtime Evidence, does not prove equivalence, does not enforce scope, and does not configure CI required checks.',
  }
}

export async function generateSelectedGraphSliceFile(
  root: string,
  traversalPlanPath: string,
  options: { output?: string; codeSubgraph?: string; codeSymbolLinksValidation?: string } = {},
): Promise<SelectedGraphSliceFileResult> {
  const resolvedTraversalPlanPath = resolveRepoPath(root, traversalPlanPath)
  const traversalPlan = await readJsonSafe<Record<string, unknown>>(resolvedTraversalPlanPath)
  if (!traversalPlan.ok) {
    throw new Error(`Unable to read Graph Traversal Plan from ${traversalPlanPath}: ${traversalPlan.error}`)
  }

  const graphSourcePath = stringValue(traversalPlan.value.graphSourcePath)
  const generatedReadModelPath = stringValue(traversalPlan.value.generatedReadModelPath)
  const graphSource = graphSourcePath ? await readOptionalJson(resolveRepoPath(root, graphSourcePath)) : undefined
  const generatedReadModel = generatedReadModelPath
    ? await readOptionalJson(resolveRepoPath(root, generatedReadModelPath))
    : undefined
  const codeSubgraphSource = options.codeSubgraph ? await readArtifact(root, options.codeSubgraph) : null
  const codeSymbolLinksValidationSource = options.codeSymbolLinksValidation
    ? await readArtifact(root, options.codeSymbolLinksValidation)
    : null

  if (options.output) {
    await assertViewTreeOutputAuthority(
      root,
      [
        resolvedTraversalPlanPath,
        ...(graphSourcePath ? [resolveRepoPath(root, graphSourcePath)] : []),
        ...(generatedReadModelPath ? [resolveRepoPath(root, generatedReadModelPath)] : []),
        ...(options.codeSubgraph ? [resolveRepoPath(root, options.codeSubgraph)] : []),
        ...(options.codeSymbolLinksValidation ? [resolveRepoPath(root, options.codeSymbolLinksValidation)] : []),
      ],
      options.output,
    )
  }

  const result = generateSelectedGraphSlice(
    traversalPlan.value,
    {
      graphSource,
      generatedReadModel,
      graphSourcePath,
      generatedReadModelPath,
    },
    {
      traversalPlanPath: relativePath(root, resolvedTraversalPlanPath),
      codeSubgraphPath: options.codeSubgraph
        ? relativePath(root, resolveRepoPath(root, options.codeSubgraph))
        : undefined,
      codeSymbolLinksValidationPath: options.codeSymbolLinksValidation
        ? relativePath(root, resolveRepoPath(root, options.codeSymbolLinksValidation))
        : undefined,
    },
    {
      codeSubgraph: codeSubgraphSource?.record,
      codeSymbolLinksValidation: codeSymbolLinksValidationSource?.record,
      codeSubgraphPath: codeSubgraphSource?.relativePath,
      codeSymbolLinksValidationPath: codeSymbolLinksValidationSource?.relativePath,
      codeSubgraphSha256: codeSubgraphSource?.sha256,
      codeSymbolLinksValidationSha256: codeSymbolLinksValidationSource?.sha256,
      codeSubgraphReadError: codeSubgraphSource?.readError,
      codeSymbolLinksValidationReadError: codeSymbolLinksValidationSource?.readError,
    },
  )

  let outputPath: string | undefined
  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    result.writtenOutputPath = outputPath
    result.writtenOutputPathAuthorityStatus = 'explicit-preview-output-not-graph-source'
    await writeJsonAtomic(resolvedOutputPath, result)
  }

  return { result, ...(outputPath ? { outputPath } : {}) }
}

function selectCodeSymbolsForViewTree(
  inputs: SelectedGraphSliceCodeSymbolInputs,
  selectedMaintenanceNodes: SelectedGraphSliceNode[],
  findings: SelectedGraphSliceFinding[],
  selectionTrace: SelectedGraphSliceTraceEntry[],
): { selectedCodeNodes: SelectedGraphSliceCodeNode[]; codeSymbolContext: SelectedGraphSliceCodeSymbolContext } | null {
  const hasCodeSubgraphInput = Boolean(inputs.codeSubgraph || inputs.codeSubgraphPath)
  const hasLinkValidationInput = Boolean(inputs.codeSymbolLinksValidation || inputs.codeSymbolLinksValidationPath)
  if (!hasCodeSubgraphInput && !hasLinkValidationInput) {
    return null
  }

  const codeSubgraph = asRecord(inputs.codeSubgraph)
  const linkValidation = asRecord(inputs.codeSymbolLinksValidation)
  if (!codeSubgraph || !linkValidation) {
    const readError = !codeSubgraph ? inputs.codeSubgraphReadError : inputs.codeSymbolLinksValidationReadError
    findings.push({
      code: 'SELECTED_GRAPH_SLICE_CODE_SYMBOL_INPUTS_INCOMPLETE',
      severity: 'error',
      field: !codeSubgraph ? 'codeSubgraph' : 'codeSymbolLinksValidation',
      message: readError
        ? `View Tree code symbol selection could not read ${!codeSubgraph ? '--code-subgraph' : '--code-symbol-links-validation'}: ${readError}.`
        : 'View Tree code symbol selection requires both --code-subgraph and --code-symbol-links-validation source facts.',
      suggestedFix:
        'Provide a validated code symbol link report and the corresponding devview-code-subgraph source fact.',
    })
    selectionTrace.push({
      action: 'blocked',
      reason: 'code symbol inputs were incomplete',
      source: 'code-symbol-context',
    })
    return buildCodeSymbolContext(inputs, codeSubgraph, linkValidation, [], 0, 0, 0, true)
  }

  validateCodeSymbolSources(inputs, codeSubgraph, linkValidation, findings)
  const linkFacts = arrayRecords(linkValidation.validatedLinks)
  if (linkFacts.length === 0) {
    findings.push({
      code: 'SELECTED_GRAPH_SLICE_CODE_SYMBOL_LINK_FACTS_MISSING',
      severity: 'error',
      field: 'validatedLinks',
      message:
        'Code symbol link validation report must include validatedLinks so View Tree selection can preserve link metadata.',
      suggestedFix: 'Rerun graph validate-code-symbol-links with a version that records sanitized validatedLinks.',
    })
  }

  const codeNodeById = new Map<string, JsonRecord>()
  for (const node of arrayRecords(codeSubgraph.nodes)) {
    const id = stringValue(node.id)
    if (id) {
      codeNodeById.set(normalizePath(id), node)
    }
  }

  const selectedMaintenanceNodeIds = new Set(selectedMaintenanceNodes.map((node) => normalizePath(node.nodeId)))
  const selectedByCodeNodeId = new Map<string, SelectedGraphSliceCodeNode>()
  const linkedMaintenanceNodeIds = new Set<string>()
  let selectedLinkCount = 0
  let missingCodeNodeCount = 0

  for (const link of linkFacts) {
    const linkId = stringValue(link.id)
    const sourceNodeId = stringValue(link.sourceNodeId)
    const targetCodeNodeId = stringValue(link.targetCodeNodeId)
    const linkType = stringValue(link.linkType)
    const sourceNodeKind = stringValue(link.sourceNodeKind)
    const confidence = stringValue(link.confidence)
    if (!linkId || !sourceNodeId || !targetCodeNodeId || !linkType || !sourceNodeKind || !confidence) {
      findings.push({
        code: 'SELECTED_GRAPH_SLICE_CODE_SYMBOL_LINK_FACT_INVALID',
        severity: 'error',
        field: 'validatedLinks',
        message: 'Code symbol link validation report contains a validatedLinks entry missing required metadata.',
        suggestedFix: 'Regenerate code symbol link validation from a valid devview-code-symbol-links artifact.',
      })
      continue
    }
    if (!selectedMaintenanceNodeIds.has(normalizePath(sourceNodeId))) {
      continue
    }

    const codeNode = codeNodeById.get(normalizePath(targetCodeNodeId))
    if (!codeNode) {
      missingCodeNodeCount += 1
      findings.push({
        code: 'SELECTED_GRAPH_SLICE_CODE_SYMBOL_CODE_NODE_MISSING',
        severity: 'error',
        field: 'validatedLinks.targetCodeNodeId',
        message: `Validated code symbol link "${linkId}" references code node "${targetCodeNodeId}" that is not present in --code-subgraph.`,
        suggestedFix:
          'Use the code subgraph that was validated with the code symbol link report, or rerun code symbol link validation.',
      })
      continue
    }

    linkedMaintenanceNodeIds.add(sourceNodeId)
    selectedLinkCount += 1
    const key = normalizePath(targetCodeNodeId)
    const selectedLink = toSelectedCodeLink(link)
    const existing = selectedByCodeNodeId.get(key)
    if (existing) {
      existing.linkedFrom.push(selectedLink)
      existing.selectedAs = [...new Set([...existing.selectedAs, selectedAsForCodeLinkType(linkType)])].sort()
      continue
    }

    const selectedCodeNode = toSelectedCodeNode(
      codeNode,
      `linked from selected ${sourceNodeKind} node ${sourceNodeId} through ${linkType} code-symbol link ${linkId}`,
      [selectedAsForCodeLinkType(linkType)],
      [selectedLink],
    )
    selectedByCodeNodeId.set(key, selectedCodeNode)
    selectionTrace.push({
      action: 'selected-code-node',
      nodeId: selectedCodeNode.nodeId,
      reason: selectedCodeNode.selectionReason,
      source: 'code-symbol-link-validation',
    })
  }

  const selectedCodeNodes = [...selectedByCodeNodeId.values()].sort((left, right) =>
    left.nodeId.localeCompare(right.nodeId),
  )
  return buildCodeSymbolContext(
    inputs,
    codeSubgraph,
    linkValidation,
    selectedCodeNodes,
    linkedMaintenanceNodeIds.size,
    selectedLinkCount,
    missingCodeNodeCount,
    findings.some((finding) => finding.severity === 'error'),
  )
}

function validateCodeSymbolSources(
  inputs: SelectedGraphSliceCodeSymbolInputs,
  codeSubgraph: JsonRecord,
  linkValidation: JsonRecord,
  findings: SelectedGraphSliceFinding[],
): void {
  if (codeSubgraph.artifactRole !== CODE_SUBGRAPH_ROLE) {
    findings.push({
      code: 'SELECTED_GRAPH_SLICE_CODE_SUBGRAPH_ROLE_INVALID',
      severity: 'error',
      field: 'codeSubgraph.artifactRole',
      message: `Code subgraph artifactRole must be ${CODE_SUBGRAPH_ROLE}.`,
      expected: CODE_SUBGRAPH_ROLE,
      actual: codeSubgraph.artifactRole,
    })
  }
  if (codeSubgraph.status !== CODE_SUBGRAPH_STATUS) {
    findings.push({
      code: 'SELECTED_GRAPH_SLICE_CODE_SUBGRAPH_STATUS_INVALID',
      severity: 'error',
      field: 'codeSubgraph.status',
      message: `Code subgraph status must be ${CODE_SUBGRAPH_STATUS}.`,
      expected: CODE_SUBGRAPH_STATUS,
      actual: codeSubgraph.status,
    })
  }
  if ((codeSubgraph.scope ?? codeSubgraph.codeSubgraphScope) !== CODE_SUBGRAPH_SCOPE) {
    findings.push({
      code: 'SELECTED_GRAPH_SLICE_CODE_SUBGRAPH_SCOPE_INVALID',
      severity: 'error',
      field: 'codeSubgraph.scope',
      message: `Code subgraph scope must be ${CODE_SUBGRAPH_SCOPE}.`,
      expected: CODE_SUBGRAPH_SCOPE,
      actual: codeSubgraph.scope ?? codeSubgraph.codeSubgraphScope,
    })
  }
  try {
    validateCodeSubgraphRecord('.', inputs.codeSubgraphPath ?? 'code-subgraph.json', codeSubgraph)
  } catch (error) {
    if (error instanceof CodeSubgraphValidationError) {
      for (const finding of error.report.validationFindings.filter((entry) => entry.severity === 'blocker')) {
        findings.push({
          code: `SELECTED_GRAPH_SLICE_${finding.code}`,
          severity: 'error',
          field: finding.field,
          message: `Code subgraph failed validation before View Tree code symbol selection: ${finding.message}`,
          suggestedFix: 'Provide a valid devview-code-subgraph source fact.',
        })
      }
    } else {
      findings.push({
        code: 'SELECTED_GRAPH_SLICE_CODE_SUBGRAPH_VALIDATION_FAILED',
        severity: 'error',
        field: 'codeSubgraph',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (linkValidation.artifactRole !== CODE_SYMBOL_LINK_VALIDATION_ROLE) {
    findings.push({
      code: 'SELECTED_GRAPH_SLICE_CODE_SYMBOL_LINK_VALIDATION_ROLE_INVALID',
      severity: 'error',
      field: 'codeSymbolLinksValidation.artifactRole',
      message: `Code symbol link validation artifactRole must be ${CODE_SYMBOL_LINK_VALIDATION_ROLE}.`,
      expected: CODE_SYMBOL_LINK_VALIDATION_ROLE,
      actual: linkValidation.artifactRole,
    })
  }
  if (linkValidation.status !== CODE_SYMBOL_LINK_VALIDATION_STATUS) {
    findings.push({
      code: 'SELECTED_GRAPH_SLICE_CODE_SYMBOL_LINK_VALIDATION_STATUS_INVALID',
      severity: 'error',
      field: 'codeSymbolLinksValidation.status',
      message: `Code symbol link validation status must be ${CODE_SYMBOL_LINK_VALIDATION_STATUS}.`,
      expected: CODE_SYMBOL_LINK_VALIDATION_STATUS,
      actual: linkValidation.status,
    })
  }
  if ((linkValidation.scope ?? linkValidation.validationScope) !== CODE_SYMBOL_LINK_VALIDATION_SCOPE) {
    findings.push({
      code: 'SELECTED_GRAPH_SLICE_CODE_SYMBOL_LINK_VALIDATION_SCOPE_INVALID',
      severity: 'error',
      field: 'codeSymbolLinksValidation.scope',
      message: `Code symbol link validation scope must be ${CODE_SYMBOL_LINK_VALIDATION_SCOPE}.`,
      expected: CODE_SYMBOL_LINK_VALIDATION_SCOPE,
      actual: linkValidation.scope ?? linkValidation.validationScope,
    })
  }

  for (const hit of collectUnsafeAuthorityHits(codeSubgraph)) {
    findings.push({
      code: 'SELECTED_GRAPH_SLICE_CODE_SYMBOL_UNSAFE_AUTHORITY_FLAG',
      severity: 'error',
      field: `codeSubgraph.${hit.field}`,
      message: `Code subgraph contains unsafe report-only authority flag ${hit.field}: true.`,
    })
  }
  for (const hit of collectUnsafeAuthorityHits(linkValidation)) {
    findings.push({
      code: 'SELECTED_GRAPH_SLICE_CODE_SYMBOL_UNSAFE_AUTHORITY_FLAG',
      severity: 'error',
      field: `codeSymbolLinksValidation.${hit.field}`,
      message: `Code symbol link validation contains unsafe report-only authority flag ${hit.field}: true.`,
    })
  }
}

function buildCodeSymbolContext(
  inputs: SelectedGraphSliceCodeSymbolInputs,
  codeSubgraph: JsonRecord | null,
  linkValidation: JsonRecord | null,
  selectedCodeNodes: SelectedGraphSliceCodeNode[],
  linkedMaintenanceNodeCount: number,
  selectedLinkCount: number,
  missingCodeNodeCount: number,
  blocked: boolean,
): { selectedCodeNodes: SelectedGraphSliceCodeNode[]; codeSymbolContext: SelectedGraphSliceCodeSymbolContext } {
  const codeNodes = arrayRecords(codeSubgraph?.nodes)
  const codeEdges = arrayRecords(codeSubgraph?.edges)
  const linkFacts = arrayRecords(linkValidation?.validatedLinks)
  return {
    selectedCodeNodes,
    codeSymbolContext: {
      artifactRole: 'devview-view-tree-code-symbol-context',
      status: blocked
        ? 'devview-view-tree-code-symbol-context-blocked'
        : selectedCodeNodes.length > 0
          ? 'devview-view-tree-code-symbol-context-selected'
          : 'devview-view-tree-code-symbol-context-empty',
      scope: 'unified-maintainability-graph-view-tree-code-selection',
      reportOnly: true,
      sourceCodeSubgraph: {
        path: inputs.codeSubgraphPath ?? null,
        artifactRole: stringValue(codeSubgraph?.artifactRole) || null,
        status: stringValue(codeSubgraph?.status) || null,
        scope: stringValue(codeSubgraph?.scope ?? codeSubgraph?.codeSubgraphScope) || null,
        sha256: inputs.codeSubgraphSha256 ?? null,
        nodeCount: codeNodes.length,
        edgeCount: codeEdges.length,
      },
      sourceCodeSymbolLinksValidation: {
        path: inputs.codeSymbolLinksValidationPath ?? null,
        artifactRole: stringValue(linkValidation?.artifactRole) || null,
        status: stringValue(linkValidation?.status) || null,
        scope: stringValue(linkValidation?.scope ?? linkValidation?.validationScope) || null,
        sha256: inputs.codeSymbolLinksValidationSha256 ?? null,
        validatedLinkCount: linkFacts.length,
      },
      selectedCodeNodeCount: selectedCodeNodes.length,
      linkedMaintenanceNodeCount,
      selectedLinkCount,
      missingCodeNodeCount,
      unifiedGraphBoundary: {
        separateCodeGraphCreated: false,
        graphSourceMutated: false,
        graphDeltaApplied: false,
        contextPackGenerated: false,
        codeSubgraphGenerated: false,
      },
    },
  }
}

function toSelectedCodeNode(
  node: JsonRecord,
  selectionReason: string,
  selectedAs: string[],
  linkedFrom: SelectedGraphSliceCodeLink[],
): SelectedGraphSliceCodeNode {
  return {
    nodeId: stringValue(node.id),
    nodeKind: stringValue(node.kind ?? node.nodeKind),
    ...(stringValue(node.label ?? node.title) ? { label: stringValue(node.label ?? node.title) } : {}),
    ...(stringValue(node.sourceFile ?? node.source_file)
      ? { sourceFile: stringValue(node.sourceFile ?? node.source_file) }
      : {}),
    ...(stringValue(node.sourceLocationStatus) ? { sourceLocationStatus: stringValue(node.sourceLocationStatus) } : {}),
    ...((node.sourceLocation ?? node.source_location)
      ? { sourceLocation: node.sourceLocation ?? node.source_location }
      : {}),
    ...(stringValue(node.sourceDigest) ? { sourceDigest: stringValue(node.sourceDigest) } : {}),
    ...(stringValue(node.confidence) ? { confidence: stringValue(node.confidence) } : {}),
    selectionReason,
    selectedAs: [...new Set(selectedAs)].sort(),
    sourceAuthorityStatus: 'selected-from-devview-code-subgraph-source-fact',
    linkedFrom,
  }
}

function toSelectedCodeLink(link: JsonRecord): SelectedGraphSliceCodeLink {
  return {
    linkId: stringValue(link.id),
    sourceNodeId: stringValue(link.sourceNodeId),
    sourceNodeKind: stringValue(link.sourceNodeKind),
    linkType: stringValue(link.linkType),
    confidence: stringValue(link.confidence),
    ...(stringValue(link.sourceFile ?? link.source_file)
      ? { sourceFile: stringValue(link.sourceFile ?? link.source_file) }
      : {}),
    ...(stringValue(link.sourceLocationStatus) ? { sourceLocationStatus: stringValue(link.sourceLocationStatus) } : {}),
    ...((link.sourceLocation ?? link.source_location)
      ? { sourceLocation: link.sourceLocation ?? link.source_location }
      : {}),
  }
}

function selectedAsForCodeLinkType(linkType: string): string {
  if (['verifies', 'covers'].includes(linkType)) {
    return 'linked-code-evidence-or-check'
  }
  if (['satisfies', 'implements_requirement'].includes(linkType)) {
    return 'linked-code-requirement-scope'
  }
  if (['documents', 'constrains', 'reports_on'].includes(linkType)) {
    return 'linked-code-governance-or-finding'
  }
  return 'linked-code-scope'
}

function validateTraversalPlanPrerequisites(plan: JsonRecord | null, findings: SelectedGraphSliceFinding[]): void {
  if (!plan) {
    findings.push({
      code: 'SELECTED_GRAPH_SLICE_TRAVERSAL_PLAN_NOT_OBJECT',
      severity: 'error',
      field: 'traversalPlan',
      message: 'Selected graph slice generation requires a Graph Traversal Plan JSON object.',
    })
    return
  }

  const expectedFields: Array<[string, unknown]> = [
    ['artifactRole', 'graph-traversal-plan'],
    ['graphTraversalPlanStatus', 'ready'],
    ['graphTraversalPlanGenerated', true],
    ['selectedGraphSlicePlanningAllowed', true],
    ['startNodeResolutionStatus', 'resolved'],
  ]

  for (const [field, expected] of expectedFields) {
    if (plan[field] !== expected) {
      findings.push({
        code: 'SELECTED_GRAPH_SLICE_PREREQUISITE_UNSAFE',
        severity: 'error',
        field,
        message: `Selected graph slice prerequisite "${field}" is not satisfied.`,
        expected,
        actual: plan[field],
        suggestedFix: 'Regenerate a ready Graph Traversal Plan before selecting a graph slice.',
      })
    }
  }
}

function validatePlanVocabulary(
  plan: JsonRecord | null,
  nodeKindVocabulary: string[],
  edgeTypeVocabulary: string[],
  findings: SelectedGraphSliceFinding[],
): void {
  if (!plan) {
    return
  }

  const nodeVocabulary = new Set(nodeKindVocabulary)
  const edgeVocabulary = new Set(edgeTypeVocabulary)
  for (const field of ['requiredNodeTypes', 'optionalNodeTypes', 'excludedNodeTypes']) {
    for (const value of stringArray(plan[field])) {
      if (!nodeVocabulary.has(value)) {
        findings.push({
          code: 'SELECTED_GRAPH_SLICE_NODE_VOCABULARY_INVALID',
          severity: 'error',
          field,
          message: `Traversal plan field "${field}" contains node kind "${value}" outside generated read-model taxonomy.`,
          actual: value,
        })
      }
    }
  }
  for (const field of ['requiredEdgeTypes', 'optionalEdgeTypes', 'excludedEdgeTypes']) {
    for (const value of stringArray(plan[field])) {
      if (!edgeVocabulary.has(value)) {
        findings.push({
          code: 'SELECTED_GRAPH_SLICE_EDGE_VOCABULARY_INVALID',
          severity: 'error',
          field,
          message: `Traversal plan field "${field}" contains edge type "${value}" outside generated read-model taxonomy.`,
          actual: value,
        })
      }
    }
  }
}

async function readOptionalJson(filePath: string): Promise<unknown> {
  const parsed = await readJsonSafe(filePath)
  return parsed.ok ? parsed.value : undefined
}

async function readArtifact(root: string, requestedPath: string): Promise<LoadedViewTreeArtifact> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  try {
    const bytes = await readFile(resolvedPath)
    return {
      relativePath: relativePath(root, resolvedPath),
      record: JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) as JsonRecord,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      readError: null,
    }
  } catch (error) {
    return {
      relativePath: relativePath(root, resolvedPath),
      record: null,
      sha256: null,
      readError: error instanceof Error ? error.message : String(error),
    }
  }
}

async function assertViewTreeOutputAuthority(root: string, sourcePaths: string[], output: string): Promise<void> {
  const resolvedOutputPath = resolveRepoPath(root, output)
  const relativeTarget = relativePath(root, resolvedOutputPath)
  const sourceSet = new Set(sourcePaths.map(pathKey))
  if (sourceSet.has(pathKey(resolvedOutputPath))) {
    throw new Error(`View Tree output would overwrite a source input: ${relativeTarget}.`)
  }
  if (isProtectedControlPath(root, resolvedOutputPath)) {
    throw new Error(`View Tree output is inside a protected control path: ${relativeTarget}.`)
  }
  const existingAuthority = await classifyExistingSourceAuthority(resolvedOutputPath)
  if (existingAuthority || isSourceAuthorityShapedPath(relativeTarget)) {
    throw new Error(`View Tree output would overwrite a source-authority-shaped path: ${relativeTarget}.`)
  }
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

function uniqueStrings(primary: unknown, fallback: string[]): string[] {
  const values = Array.isArray(primary) ? primary : fallback
  return [...new Set(values.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0))]
}

function mapById(records: JsonRecord[]): Map<string, JsonRecord> {
  const entries: Array<[string, JsonRecord]> = []
  for (const record of records) {
    const id = stringValue(record.id)
    if (id.length > 0) {
      entries.push([id, record])
    }
  }
  return new Map(entries)
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  try {
    const bytes = await readFile(filePath)
    const parsed = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) as JsonRecord
    const role = stringValue(parsed.artifactRole)
    if (role.includes('graph-source') || role === CODE_SUBGRAPH_ROLE || role === CODE_SYMBOL_LINK_VALIDATION_ROLE) {
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

function toSelectedNode(
  node: JsonRecord,
  selectionReason: string,
  selectedAs: string[],
  sourceAuthorityStatus: string,
): SelectedGraphSliceNode {
  return {
    nodeId: stringValue(node.id),
    nodeKind: stringValue(node.nodeKind),
    ...(stringValue(node.title) ? { title: stringValue(node.title) } : {}),
    ...(stringValue(node.sourceArtifact) ? { sourceArtifact: stringValue(node.sourceArtifact) } : {}),
    selectionReason,
    selectedAs,
    sourceAuthorityStatus,
  }
}

function toSelectedEdge(edge: JsonRecord, selectionReason: string): SelectedGraphSliceEdge {
  return {
    edgeId: stringValue(edge.id),
    from: stringValue(edge.from),
    to: stringValue(edge.to),
    edgeType: stringValue(edge.edgeType),
    selectionReason,
    sourceAuthorityStatus: 'selected-from-graph-source-and-read-model-vocabulary',
  }
}

function selectedAsForNodeKind(nodeKind: string): string[] {
  if (['evidence', 'check', 'log'].includes(nodeKind)) {
    return ['evidence-or-check-source']
  }
  if (nodeKind === 'finding') {
    return ['risk-or-impact-source']
  }
  if (nodeKind === 'document') {
    return ['policy-source']
  }
  return ['scope-source']
}

function sourceAuthorityForNode(
  nodeId: string,
  graphNodeById: Map<string, JsonRecord>,
  readModelNodeById: Map<string, JsonRecord>,
): string {
  const graphSourcePresent = graphNodeById.has(nodeId)
  const readModelPresent = readModelNodeById.has(nodeId)
  if (graphSourcePresent && readModelPresent) {
    return 'selected-from-graph-source-and-generated-read-model'
  }
  if (graphSourcePresent) {
    return 'selected-from-graph-source'
  }
  if (readModelPresent) {
    return 'selected-from-generated-read-model'
  }
  return 'source-authority-missing'
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
    normalized.endsWith('maintainability-graph.json') ||
    normalized.endsWith('code-subgraph.json') ||
    normalized.endsWith('code-symbol-links-validation.json')
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

function resolveRepoPath(root: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(root, inputPath)
}
