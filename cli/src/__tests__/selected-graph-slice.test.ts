import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { generateSelectedGraphSlice } from '../core/selected-graph-slice'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())
const codeFileId = 'code:file:src/todo.ts'
const codeClassId = 'code:class:src/todo.ts#TodoList'
const codeMethodId = 'code:method:src/todo.ts#TodoList.add'
const codeFunctionId = 'code:function:src/todo.ts#normalizeTodo'

afterEach(() => {
  cleanupWorkspaces()
})

describe('Selected graph slice generator core', () => {
  it('selects the Todo App direct graph slice from a ready traversal plan without contract input output', () => {
    const result = generateSelectedGraphSlice(validTraversalPlan(), validAuthority(), {
      traversalPlanPath: 'graph-traversal-plan.json',
    })

    expect(result.status).toBe('selected-graph-slice-generated')
    expect(result.viewTreeArtifactRole).toBe('devview-view-tree-preview')
    expect(result.viewTreeStatus).toBe('devview-view-tree-preview-generated')
    expect(result.viewTreeKind).toBe('maintainability-graph-derived-task-view-tree')
    expect(result.viewTreeProjectionSource).toBe('maintainability-graph-derived-selected-graph-slice')
    expect(result.sourceMaintainabilityGraph).toBe('graph-source.json')
    expect(result.contextPackBoundary).toMatchObject({
      contextPackRole: 'bounded-subgraph-package-around-view-tree',
      contextPackGenerated: false,
      instructionPackGenerated: false,
      runtimeEvidenceSatisfied: false,
      equivalenceProven: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
    })
    expect(result.selectedGraphSliceStatus).toBe('generated')
    expect(result.graphTraversalExecuted).toBe(true)
    expect(result.selectedGraphSliceGenerated).toBe(true)
    expect(result.contractInputGenerated).toBe(false)
    expect(result.instructionPackGenerated).toBe(false)
    expect(result.contractInputGenerationAllowed).toBe(false)
    expect(result.selectedNodes.map((node) => node.nodeId).sort()).toEqual(['CH-001', 'EV-1', 'IM-001', 'TT-1', 'WT-1'])
    expect(result.selectedEdges.map((edge) => edge.edgeId).sort()).toEqual([
      'E-CH-001-PRESERVES-EV-1',
      'E-CH-001-PRESERVES-TT-1',
      'E-CH-001-TOUCHES-WT-1',
      'E-IM-001-REPORTS-ON-CH-001',
    ])
    expect(result.selectedCodeNodes).toBeUndefined()
    expect(result.codeSymbolContext).toBeUndefined()
    expect(result.includedEvidenceNodes.map((node) => node.nodeId).sort()).toEqual(['EV-1', 'TT-1'])
    expect(result.includedRiskNodes.map((node) => node.nodeId)).toEqual(['IM-001'])
    expect(result.selectionTrace.length).toBeGreaterThanOrEqual(9)
  })

  it('blocks when traversal planning is not ready or slice planning is not allowed', () => {
    const result = generateSelectedGraphSlice(
      {
        ...validTraversalPlan(),
        graphTraversalPlanStatus: 'blocked',
        selectedGraphSlicePlanningAllowed: false,
      },
      validAuthority(),
    )

    expect(result.status).toBe('selected-graph-slice-blocked')
    expect(result.viewTreeArtifactRole).toBe('devview-view-tree-preview')
    expect(result.viewTreeStatus).toBe('devview-view-tree-preview-blocked')
    expect(result.selectedGraphSliceStatus).toBe('blocked')
    expect(result.graphTraversalExecuted).toBe(false)
    expect(result.selectedGraphSliceGenerated).toBe(false)
    expect(result.contractInputGenerated).toBe(false)
    expect(result.instructionPackGenerated).toBe(false)
    expect(result.humanReviewRequired).toBe(true)
    expect(result.validationFindings).toContainEqual(
      expect.objectContaining({
        code: 'SELECTED_GRAPH_SLICE_PREREQUISITE_UNSAFE',
        field: 'graphTraversalPlanStatus',
        severity: 'error',
      }),
    )
  })

  it('keeps selected node and edge ids sourced from graph-source/read-model authority', () => {
    const authority = validAuthority()
    const result = generateSelectedGraphSlice(validTraversalPlan(), authority)
    const graphSource = authority.graphSource as {
      sourceRecords: { nodes: Array<{ id: string }>; edges: Array<{ id: string }> }
    }
    const readModel = authority.generatedReadModel as { nodes: Array<{ id: string }>; edges: Array<{ id: string }> }
    const sourceNodeIds = new Set([
      ...graphSource.sourceRecords.nodes.map((node) => node.id),
      ...readModel.nodes.map((node) => node.id),
    ])
    const sourceEdgeIds = new Set([
      ...graphSource.sourceRecords.edges.map((edge) => edge.id),
      ...readModel.edges.map((edge) => edge.id),
    ])
    const selectedNodeIds = new Set(result.selectedNodes.map((node) => node.nodeId))

    for (const node of result.selectedNodes) {
      expect(sourceNodeIds.has(node.nodeId)).toBe(true)
    }
    for (const edge of result.selectedEdges) {
      expect(sourceEdgeIds.has(edge.edgeId)).toBe(true)
      expect(selectedNodeIds.has(edge.from)).toBe(true)
      expect(selectedNodeIds.has(edge.to)).toBe(true)
    }
    expect(result.excludedEdges).toContainEqual(
      expect.objectContaining({
        edgeId: 'E-CH-001-APPROVES-DEC-1',
        exclusionReason: 'approval edge excluded by MVP selection policy',
      }),
    )
  })
})

describe('Selected graph slice CLI', () => {
  it('writes a canonical View Tree preview through graph read-model generate-view-tree', async () => {
    const workspace = createWorkspace()
    writeFixtureFiles(workspace)
    const outputPath = join('.tmp', 'view-tree.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'generate-view-tree',
        '--traversal-plan',
        'graph-traversal-plan.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.command).toBe('graph read-model generate-view-tree')
    expect(payload.viewTreeArtifactRole).toBe('devview-view-tree-preview')
    expect(payload.viewTreeStatus).toBe('devview-view-tree-preview-generated')
    expect(payload.contextPackBoundary.contextPackRole).toBe('bounded-subgraph-package-around-view-tree')
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(written.viewTreeArtifactRole).toBe('devview-view-tree-preview')
  })

  it('includes linked code symbol nodes in View Tree output when validated link facts are supplied', async () => {
    const workspace = createWorkspace()
    writeFixtureFiles(workspace)
    writeJson(join(workspace, 'code-subgraph.json'), validCodeSubgraph())
    writeJson(
      join(workspace, 'code-symbol-links.json'),
      codeSymbolLinksArtifact([
        codeSymbolLink('link-change-function', 'CH-001', codeFunctionId, 'touches', 'change', 'function'),
        codeSymbolLink('link-task-class', 'WT-1', codeClassId, 'touches', 'task', 'class'),
        codeSymbolLink('link-check-file', 'TT-1', codeFileId, 'covers', 'check', 'file'),
        codeSymbolLink('link-evidence-method', 'EV-1', codeMethodId, 'verifies', 'evidence', 'method'),
        codeSymbolLink('link-decision-skipped', 'DEC-1', codeFileId, 'documents', 'decision', 'file'),
      ]),
    )

    const linkValidation = await runDevViewCli(
      [
        'graph',
        'validate-code-symbol-links',
        '--links',
        'code-symbol-links.json',
        '--code-subgraph',
        'code-subgraph.json',
        '--graph-source',
        'graph-source.json',
        '--output',
        '.tmp/code-symbol-links-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    expect(linkValidation.exitCode).toBe(ExitCode.Success)

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'generate-view-tree',
        '--traversal-plan',
        'graph-traversal-plan.json',
        '--code-subgraph',
        'code-subgraph.json',
        '--code-symbol-links-validation',
        '.tmp/code-symbol-links-validation.json',
        '--output',
        '.tmp/view-tree-with-code.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/view-tree-with-code.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.viewTreeStatus).toBe('devview-view-tree-preview-generated')
    expect(payload.selectedCodeNodes.map((node: { nodeId: string }) => node.nodeId).sort()).toEqual([
      codeClassId,
      codeFileId,
      codeFunctionId,
      codeMethodId,
    ])
    expect(payload.selectedCodeNodes).not.toContainEqual(expect.objectContaining({ nodeId: 'DEC-1' }))
    expect(payload.codeSymbolContext).toMatchObject({
      artifactRole: 'devview-view-tree-code-symbol-context',
      status: 'devview-view-tree-code-symbol-context-selected',
      scope: 'unified-maintainability-graph-view-tree-code-selection',
      selectedCodeNodeCount: 4,
      linkedMaintenanceNodeCount: 4,
      selectedLinkCount: 4,
      unifiedGraphBoundary: {
        separateCodeGraphCreated: false,
        graphSourceMutated: false,
        graphDeltaApplied: false,
        contextPackGenerated: false,
        codeSubgraphGenerated: false,
      },
    })
    expect(
      payload.selectedCodeNodes.find((node: { nodeId: string }) => node.nodeId === codeFunctionId).linkedFrom,
    ).toContainEqual(
      expect.objectContaining({
        linkId: 'link-change-function',
        sourceNodeId: 'CH-001',
        sourceNodeKind: 'change',
        linkType: 'touches',
        confidence: 'inferred',
        sourceLocationStatus: 'link-fixture',
      }),
    )
    expect(payload.contextPackBoundary.contextPackGenerated).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(written.selectedCodeNodes).toEqual(payload.selectedCodeNodes)
  })

  it('blocks View Tree code symbol selection when the link validation report role is wrong', async () => {
    const workspace = createWorkspace()
    writeFixtureFiles(workspace)
    writeJson(join(workspace, 'code-subgraph.json'), validCodeSubgraph())
    writeJson(join(workspace, 'bad-code-symbol-links-validation.json'), {
      artifactRole: 'not-code-symbol-link-validation-report',
      status: 'devview-code-symbol-link-validation-passed',
      scope: 'code-symbol-link-validation-report-only',
      validatedLinks: [],
      graphSourceMutated: false,
      graphDeltaApplied: false,
      contextPackGenerated: false,
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'generate-view-tree',
        '--traversal-plan',
        'graph-traversal-plan.json',
        '--code-subgraph',
        'code-subgraph.json',
        '--code-symbol-links-validation',
        'bad-code-symbol-links-validation.json',
        '--output',
        '.tmp/blocked-view-tree.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues).toContainEqual(
      expect.objectContaining({
        code: 'SELECTED_GRAPH_SLICE_CODE_SYMBOL_LINK_VALIDATION_ROLE_INVALID',
      }),
    )
  })

  it('blocks View Tree code symbol selection when validated links reference missing code nodes', async () => {
    const workspace = createWorkspace()
    writeFixtureFiles(workspace)
    writeJson(join(workspace, 'code-subgraph.json'), validCodeSubgraph())
    writeJson(join(workspace, 'stale-code-symbol-links-validation.json'), {
      artifactRole: 'devview-code-symbol-link-validation-report',
      status: 'devview-code-symbol-link-validation-passed',
      scope: 'code-symbol-link-validation-report-only',
      validatedLinks: [
        {
          id: 'link-stale-code-node',
          sourceNodeId: 'CH-001',
          targetCodeNodeId: 'code:function:src/todo.ts#missing',
          linkType: 'touches',
          sourceNodeKind: 'change',
          targetCodeNodeKind: 'function',
          sourceLocationStatus: 'link-fixture',
          confidence: 'inferred',
        },
      ],
      graphSourceMutated: false,
      graphDeltaApplied: false,
      contextPackGenerated: false,
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'generate-view-tree',
        '--traversal-plan',
        'graph-traversal-plan.json',
        '--code-subgraph',
        'code-subgraph.json',
        '--code-symbol-links-validation',
        'stale-code-symbol-links-validation.json',
        '--output',
        '.tmp/stale-view-tree.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues).toContainEqual(
      expect.objectContaining({
        code: 'SELECTED_GRAPH_SLICE_CODE_SYMBOL_CODE_NODE_MISSING',
      }),
    )
  })

  it('blocks View Tree code symbol selection when optional code inputs claim unsafe authority', async () => {
    const workspace = createWorkspace()
    writeFixtureFiles(workspace)
    writeJson(join(workspace, 'code-subgraph.json'), validCodeSubgraph())
    writeJson(join(workspace, 'unsafe-code-symbol-links-validation.json'), {
      artifactRole: 'devview-code-symbol-link-validation-report',
      status: 'devview-code-symbol-link-validation-passed',
      scope: 'code-symbol-link-validation-report-only',
      validatedLinks: [
        {
          id: 'link-change-function',
          sourceNodeId: 'CH-001',
          targetCodeNodeId: codeFunctionId,
          linkType: 'touches',
          sourceNodeKind: 'change',
          targetCodeNodeKind: 'function',
          sourceLocationStatus: 'link-fixture',
          confidence: 'inferred',
        },
      ],
      graphSourceMutated: true,
      graphDeltaApplied: false,
      contextPackGenerated: false,
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'generate-view-tree',
        '--traversal-plan',
        'graph-traversal-plan.json',
        '--code-subgraph',
        'code-subgraph.json',
        '--code-symbol-links-validation',
        'unsafe-code-symbol-links-validation.json',
        '--output',
        '.tmp/unsafe-view-tree.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues).toContainEqual(
      expect.objectContaining({
        code: 'SELECTED_GRAPH_SLICE_CODE_SYMBOL_UNSAFE_AUTHORITY_FLAG',
      }),
    )
  })

  it('writes only the explicit output path and does not mutate graph source', async () => {
    const workspace = createWorkspace()
    writeFixtureFiles(workspace)
    const outputPath = join('.tmp', 'selected-graph-slice.json')
    const graphSourceBefore = readFileSync(join(workspace, 'graph-source.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'select-slice',
        '--traversal-plan',
        'graph-traversal-plan.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('graph read-model select-slice')
    expect(payload.outputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(payload.viewTreeArtifactRole).toBe('devview-view-tree-preview')
    expect(payload.viewTreeStatus).toBe('devview-view-tree-preview-generated')
    expect(payload.selectedGraphSliceGenerated).toBe(true)
    expect(payload.graphTraversalExecuted).toBe(true)
    expect(payload.contractInputGenerated).toBe(false)
    expect(payload.instructionPackGenerated).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(written.artifactRole).toBe('selected-graph-slice')
    expect(written.viewTreeArtifactRole).toBe('devview-view-tree-preview')
    expect(written.contextPackBoundary.runtimeEvidenceSatisfied).toBe(false)
    expect(written.writtenOutputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(existsSync(join(workspace, 'graph-source.json'))).toBe(true)
    expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(graphSourceBefore)
  })
})

function writeFixtureFiles(workspace: string): void {
  writeJson(join(workspace, 'graph-traversal-plan.json'), validTraversalPlan())
  writeJson(join(workspace, 'graph-source.json'), validAuthority().graphSource)
  writeJson(join(workspace, 'generated-read-model.json'), validAuthority().generatedReadModel)
}

function validTraversalPlan(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'graph-traversal-plan',
    status: 'graph-traversal-plan-generated',
    planningScope: 'deterministic-plan-no-selected-slice',
    sourceGraphAwareValidation: 'request-ir-graph-validation.json',
    graphSourcePath: 'graph-source.json',
    generatedReadModelPath: 'generated-read-model.json',
    traversalPlanId: 'graph-traversal-plan-add-todo-runtime-evidence-only',
    graphTraversalPlanGenerated: true,
    graphTraversalPlanStatus: 'ready',
    graphTraversalExecuted: false,
    selectedGraphSliceGenerated: false,
    contractInputGenerated: false,
    instructionPackGenerated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    startNodeResolutionStatus: 'resolved',
    startNodeCandidates: [
      {
        nodeId: 'CH-001',
        nodeKind: 'change',
        resolutionStatus: 'resolved',
        sourceAuthorityStatus: 'resolved-from-graph-aware-validation-and-graph-source',
      },
    ],
    requiredNodeTypes: ['change', 'requirement', 'code', 'task', 'check', 'evidence'],
    optionalNodeTypes: ['finding', 'decision', 'document', 'log', 'view-instance'],
    excludedNodeTypes: [],
    requiredEdgeTypes: ['targets', 'requires', 'verifies', 'evidences'],
    optionalEdgeTypes: ['touches', 'satisfies', 'preserves', 'reports-on', 'derives-view'],
    excludedEdgeTypes: ['approves'],
    selectedGraphSlicePlanningAllowed: true,
    contractInputGenerationAllowed: false,
  }
}

function validAuthority(): Record<string, unknown> {
  const nodes = [
    {
      id: 'CH-001',
      nodeKind: 'change',
      title: 'Preserve completed add-todo behavior while future revisions are assessed.',
      sourceArtifact: 'examples/valid/todo-app-devview-run/.devview/control/change-tree.json',
    },
    {
      id: 'WT-1',
      nodeKind: 'task',
      title: 'Implement add todo behavior',
      sourceArtifact: 'examples/valid/todo-app-devview-run/.devview/tree/work-tree.json',
    },
    {
      id: 'TT-1',
      nodeKind: 'check',
      title: 'Add todo acceptance check',
      sourceArtifact: 'examples/valid/todo-app-devview-run/.devview/tree/test-tree.json',
    },
    {
      id: 'EV-1',
      nodeKind: 'evidence',
      title: '.devview/evidence/test-results/todo-add.txt',
      sourceArtifact: 'examples/valid/todo-app-devview-run/.devview/evidence/evidence-tree.json',
    },
    {
      id: 'IM-001',
      nodeKind: 'finding',
      title: 'Golden run includes a non-blocking analyzed change skeleton.',
      sourceArtifact: 'examples/valid/todo-app-devview-run/.devview/control/impact-tree.json',
    },
    {
      id: 'DEC-1',
      nodeKind: 'decision',
      title: 'Approval fixture that must not be selected through approves edge.',
      sourceArtifact: 'examples/valid/todo-app-devview-run/.devview/control/decision-log.json',
    },
  ]
  const edges = [
    {
      id: 'E-CH-001-TOUCHES-WT-1',
      from: 'CH-001',
      to: 'WT-1',
      edgeType: 'touches',
    },
    {
      id: 'E-CH-001-PRESERVES-TT-1',
      from: 'CH-001',
      to: 'TT-1',
      edgeType: 'preserves',
    },
    {
      id: 'E-CH-001-PRESERVES-EV-1',
      from: 'CH-001',
      to: 'EV-1',
      edgeType: 'preserves',
    },
    {
      id: 'E-IM-001-REPORTS-ON-CH-001',
      from: 'IM-001',
      to: 'CH-001',
      edgeType: 'reports-on',
    },
    {
      id: 'E-CH-001-APPROVES-DEC-1',
      from: 'CH-001',
      to: 'DEC-1',
      edgeType: 'approves',
    },
  ]

  return {
    graphSource: {
      sourceRecords: {
        nodes,
        edges,
      },
    },
    generatedReadModel: {
      taxonomy: {
        nodeKindsUsed: [
          'requirement',
          'code',
          'task',
          'check',
          'evidence',
          'decision',
          'change',
          'finding',
          'document',
          'log',
          'view-instance',
        ],
        edgeTypesUsed: [
          'targets',
          'requires',
          'satisfies',
          'touches',
          'verifies',
          'evidences',
          'approves',
          'preserves',
          'reports-on',
          'derives-view',
        ],
      },
      nodes,
      edges,
    },
  }
}

function validCodeSubgraph(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-code-subgraph',
    status: 'devview-code-subgraph-supplied',
    scope: 'code-subgraph-source-fact-only',
    nodes: [
      codeNode(codeFileId, 'file', 'src/todo.ts', 'file-node'),
      codeNode(codeClassId, 'class', 'src/todo.ts', undefined, {
        startLine: 1,
        startColumn: 1,
        endLine: 8,
        endColumn: 2,
      }),
      codeNode(codeMethodId, 'method', 'src/todo.ts', undefined, {
        startLine: 2,
        startColumn: 3,
        endLine: 5,
        endColumn: 4,
      }),
      codeNode(codeFunctionId, 'function', 'src/todo.ts', undefined, {
        startLine: 10,
        startColumn: 1,
        endLine: 12,
        endColumn: 2,
      }),
    ],
    edges: [
      codeEdge('code-edge.file-class', codeFileId, codeClassId, 'contains'),
      codeEdge('code-edge.class-method', codeClassId, codeMethodId, 'contains'),
      codeEdge('code-edge.file-function', codeFileId, codeFunctionId, 'contains'),
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

function codeNode(
  id: string,
  kind: string,
  sourceFile: string,
  sourceLocationStatus?: string,
  sourceLocation?: Record<string, number>,
): Record<string, unknown> {
  return {
    id,
    kind,
    label: id,
    sourceFile,
    ...(sourceLocation ? { sourceLocation } : { sourceLocationStatus }),
    sourceDigest: 'sha256:fixture',
    confidence: 'extracted',
  }
}

function codeEdge(id: string, from: string, to: string, kind: string): Record<string, unknown> {
  return {
    id,
    from,
    to,
    kind,
    sourceFile: 'src/todo.ts',
    sourceLocationStatus: 'fixture-edge',
    sourceDigest: 'sha256:fixture',
    confidence: 'extracted',
  }
}

function codeSymbolLinksArtifact(links: Record<string, unknown>[]): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-code-symbol-links',
    status: 'devview-code-symbol-links-supplied',
    scope: 'code-symbol-link-source-fact-only',
    links,
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

function codeSymbolLink(
  id: string,
  sourceNodeId: string,
  targetCodeNodeId: string,
  linkType: string,
  sourceNodeKind: string,
  targetCodeNodeKind: string,
): Record<string, unknown> {
  return {
    id,
    sourceNodeId,
    targetCodeNodeId,
    linkType,
    sourceNodeKind,
    targetCodeNodeKind,
    sourceLocationStatus: 'link-fixture',
    confidence: 'inferred',
  }
}
