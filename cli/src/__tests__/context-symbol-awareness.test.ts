import { describe, expect, it } from 'vitest'
import { generateContractCompilerInput } from '../core/contract-input-generator'
import { generateInstructionPack, renderInstructionPackMarkdown } from '../core/instruction-pack-generator'

const codeFunctionId = 'code:function:src/todo.ts#normalizeTodo'

describe('Context and instruction symbol awareness', () => {
  it('carries symbol-aware View Tree code nodes into bounded Contract Input context', () => {
    const result = generateContractCompilerInput(symbolAwareSelectedSlice(55), {
      graphAwareValidation: validGraphAwareValidation(),
      requestIrCandidate: validRequestIrCandidate(),
      selectedSlicePath: 'selected-graph-slice.json',
    })
    const repeated = generateContractCompilerInput(symbolAwareSelectedSlice(55), {
      graphAwareValidation: validGraphAwareValidation(),
      requestIrCandidate: validRequestIrCandidate(),
      selectedSlicePath: 'selected-graph-slice.json',
    })

    expect(result.status).toBe('contract-compiler-input-generated')
    expect(result.codeInspectionTargets).toHaveLength(50)
    expect(result.codeInspectionTargets).toEqual(repeated.codeInspectionTargets)
    expect(result.codeSymbolContext).toMatchObject({
      artifactRole: 'devview-contract-input-code-symbol-context',
      status: 'devview-contract-input-code-symbol-context-carried',
      selectedCodeNodeCount: 50,
      totalViewTreeSelectedCodeNodeCount: 55,
      omittedCodeNodeCount: 5,
      boundedContext: {
        maxCodeInspectionTargets: 50,
        maxLinkReasonsPerTarget: 5,
        fullSourceFilesIncluded: false,
        sourceContentDumped: false,
      },
      unifiedGraphBoundary: {
        separateCodeGraphCreated: false,
        graphSourceMutated: false,
        graphDeltaApplied: false,
        instructionPackGenerated: false,
      },
    })
    expect(result.codeInspectionTargets).toContainEqual(
      expect.objectContaining({
        nodeId: codeFunctionId,
        nodeKind: 'function',
        sourceFile: 'src/todo.ts',
        fullSourceIncluded: false,
        linkReasons: [
          expect.objectContaining({
            linkId: 'link-change-function',
            sourceNodeId: 'CH-001',
            linkType: 'touches',
            confidence: 'inferred',
          }),
        ],
      }),
    )
    expect(result.graphSnapshot.artifacts).toContainEqual(
      expect.objectContaining({
        id: 'devview-code-subgraph',
        path: 'code-subgraph.json',
      }),
    )
    expect(result.graphSnapshot.artifacts).toContainEqual(
      expect.objectContaining({
        path: 'src/todo.ts',
        role: 'selected code symbol source file reference-no-content',
      }),
    )
    expect(result.mappingTrace).toContainEqual(
      expect.objectContaining({
        targetField: 'codeInspectionTargets',
        sourceCodeNodeId: codeFunctionId,
      }),
    )
    expect(JSON.stringify(result.codeInspectionTargets)).not.toContain('function normalizeTodo')
  })

  it('carries Contract Input code symbol context into Instruction Pack and Markdown review hints', () => {
    const contractInput = generateContractCompilerInput(symbolAwareSelectedSlice(3), {
      graphAwareValidation: validGraphAwareValidation(),
      requestIrCandidate: validRequestIrCandidate(),
      selectedSlicePath: 'selected-graph-slice.json',
    })
    const pack = generateInstructionPack(contractInput, 'contract-input.json')
    const markdown = renderInstructionPackMarkdown(pack)

    expect(pack.status).toBe('instruction-pack-generated')
    expect(pack.codeInspectionTargets).toHaveLength(3)
    expect(pack.codeSymbolContext).toMatchObject({
      artifactRole: 'devview-instruction-pack-code-symbol-context',
      status: 'devview-instruction-pack-code-symbol-context-carried',
      selectedCodeNodeCount: 3,
      boundedContext: {
        maxCodeInspectionTargets: 50,
        fullSourceFilesIncluded: false,
        sourceContentDumped: false,
      },
      unifiedGraphBoundary: {
        graphSourceMutated: false,
        graphDeltaApplied: false,
        codexExecutionTriggered: false,
      },
    })
    expect(pack.graphContext.codeInspectionTargets).toEqual(pack.codeInspectionTargets)
    expect(pack.executionInstructions.join('\n')).toContain(
      'Inspect linked code symbols before broad source exploration',
    )
    expect(pack.verificationInstructions.join('\n')).toContain(`cite why code symbol ${codeFunctionId} was selected`)
    expect(markdown).toContain('## Code Symbols')
    expect(markdown).toContain(codeFunctionId)
    expect(markdown).toContain('CH-001 touches')
    expect(markdown).not.toContain('function normalizeTodo')
  })

  it('keeps missing or empty code symbol context non-blocking', () => {
    const plainContractInput = generateContractCompilerInput(validSelectedSlice(), {
      graphAwareValidation: validGraphAwareValidation(),
      requestIrCandidate: validRequestIrCandidate(),
    })
    const plainPack = generateInstructionPack(plainContractInput)
    const emptyPack = generateInstructionPack({
      ...plainContractInput,
      codeSymbolContext: {
        artifactRole: 'devview-contract-input-code-symbol-context',
        status: 'devview-contract-input-code-symbol-context-empty',
      },
      codeInspectionTargets: [],
    })

    expect(plainContractInput.codeInspectionTargets).toBeUndefined()
    expect(plainPack.status).toBe('instruction-pack-generated')
    expect(plainPack.codeSymbolContext).toBeUndefined()
    expect(emptyPack.status).toBe('instruction-pack-generated')
    expect(emptyPack.codeInspectionTargets).toEqual([])
    expect(emptyPack.codeSymbolContext).toMatchObject({
      status: 'devview-instruction-pack-code-symbol-context-empty',
      selectedCodeNodeCount: 0,
    })
  })
})

function symbolAwareSelectedSlice(codeNodeCount: number): Record<string, unknown> {
  const slice = validSelectedSlice()
  const selectedCodeNodes = Array.from({ length: codeNodeCount }, (_, index) =>
    index === 0
      ? codeNode(codeFunctionId, 'function', 'src/todo.ts', 'link-change-function')
      : generatedCodeNode(index),
  )
  return {
    ...slice,
    selectedCodeNodes,
    codeSymbolContext: {
      artifactRole: 'devview-view-tree-code-symbol-context',
      status: 'devview-view-tree-code-symbol-context-selected',
      scope: 'unified-maintainability-graph-view-tree-code-selection',
      sourceCodeSubgraph: {
        path: 'code-subgraph.json',
        artifactRole: 'devview-code-subgraph',
        status: 'devview-code-subgraph-supplied',
        scope: 'code-subgraph-source-fact-only',
        sha256: 'sha256:code-subgraph',
      },
      sourceCodeSymbolLinksValidation: {
        path: 'code-symbol-links-validation.json',
        artifactRole: 'devview-code-symbol-link-validation-report',
        status: 'devview-code-symbol-link-validation-passed',
        scope: 'code-symbol-link-validation-report-only',
        sha256: 'sha256:code-symbol-links',
      },
      selectedCodeNodeCount: codeNodeCount,
      linkedMaintenanceNodeCount: codeNodeCount,
      selectedLinkCount: codeNodeCount,
      missingCodeNodeCount: 0,
    },
  }
}

function generatedCodeNode(index: number): Record<string, unknown> {
  const padded = String(index).padStart(2, '0')
  return codeNode(
    `code:function:src/z-generated-${padded}.ts#helper${padded}`,
    'function',
    `src/z-generated-${padded}.ts`,
    `link-generated-${padded}`,
  )
}

function codeNode(id: string, nodeKind: string, sourceFile: string, linkId: string): Record<string, unknown> {
  return {
    nodeId: id,
    nodeKind,
    label: id.split('#').at(-1) ?? id,
    sourceFile,
    sourceLocation: {
      startLine: 1,
      startColumn: 1,
      endLine: 3,
      endColumn: 2,
    },
    sourceDigest: 'sha256:fixture',
    confidence: 'extracted',
    selectionReason: `linked from selected change node CH-001 through touches code-symbol link ${linkId}`,
    selectedAs: ['linked-code-scope'],
    sourceAuthorityStatus: 'selected-from-devview-code-subgraph-source-fact',
    linkedFrom: [
      {
        linkId,
        sourceNodeId: 'CH-001',
        sourceNodeKind: 'change',
        linkType: 'touches',
        confidence: 'inferred',
        sourceLocationStatus: 'link-fixture',
      },
    ],
  }
}

function validSelectedSlice(): Record<string, unknown> {
  const scopeNodes = [
    node('CH-001', 'change', 'Preserve completed add-todo behavior while future revisions are assessed.', [
      'start-node',
      'target-change',
    ]),
    node('WT-1', 'task', 'Implement add todo behavior', ['scope-source']),
  ]
  const evidenceNodes = [
    node('TT-1', 'check', 'Add todo acceptance check', ['evidence-or-check-source']),
    node('EV-1', 'evidence', '.devview/evidence/test-results/todo-add.txt', ['evidence-or-check-source']),
  ]
  const riskNodes = [
    node('IM-001', 'finding', 'Golden run includes a non-blocking analyzed change skeleton.', [
      'risk-or-impact-source',
    ]),
  ]
  return {
    schemaVersion: 1,
    artifactRole: 'selected-graph-slice',
    status: 'selected-graph-slice-generated',
    viewTreeArtifactRole: 'devview-view-tree-preview',
    viewTreeStatus: 'devview-view-tree-preview-generated',
    sourceMaintainabilityGraph: 'examples/valid/todo-app-devview-run/graph-source.json',
    sourceTraversalPlan: 'graph-traversal-plan.json',
    sourceGraphAwareValidation: 'request-ir-graph-validation.json',
    graphSourcePath: 'examples/valid/todo-app-devview-run/graph-source.json',
    generatedReadModelPath: 'generated-read-model.json',
    selectedGraphSliceStatus: 'generated',
    graphTraversalExecuted: true,
    selectedGraphSliceGenerated: true,
    contractInputGenerated: false,
    instructionPackGenerated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    selectedNodes: [...scopeNodes, ...evidenceNodes, ...riskNodes],
    selectedEdges: [
      edge('E-CH-001-TOUCHES-WT-1', 'CH-001', 'WT-1', 'touches'),
      edge('E-CH-001-PRESERVES-TT-1', 'CH-001', 'TT-1', 'preserves'),
      edge('E-CH-001-PRESERVES-EV-1', 'CH-001', 'EV-1', 'preserves'),
      edge('E-IM-001-REPORTS-ON-CH-001', 'IM-001', 'CH-001', 'reports-on'),
    ],
    includedScopeNodes: scopeNodes,
    includedEvidenceNodes: evidenceNodes,
    includedRiskNodes: riskNodes,
    validationFindings: [],
  }
}

function validGraphAwareValidation(): Record<string, unknown> {
  return {
    artifactRole: 'request-ir-graph-aware-validation',
    candidatePath: 'request-ir-candidate.json',
    scopeIntentResolution: {
      forbiddenScopeIntentCandidate: [
        'production source changes',
        'graph-source mutation',
        'approval or acceptance changes',
      ],
    },
    changeTypeCompatibility: {
      requestTypeCandidate: 'runtime-evidence-only',
      changeTypeCandidate: 'test-only-behavior-proof',
    },
  }
}

function validRequestIrCandidate(): Record<string, unknown> {
  return {
    requestText: 'Add Todo App runtime evidence only without production source edits.',
    intentSummaryCandidate: 'Add Todo App runtime evidence only without production source edits.',
    forbiddenScopeIntentCandidate: [
      'production source changes',
      'graph-source mutation',
      'approval or acceptance changes',
    ],
  }
}

function node(nodeId: string, nodeKind: string, title: string, selectedAs: string[]): Record<string, unknown> {
  return {
    nodeId,
    nodeKind,
    title,
    sourceArtifact: sourceArtifactForNode(nodeKind),
    selectionReason: 'selected by fixture',
    selectedAs,
    sourceAuthorityStatus: 'selected-from-graph-source-and-generated-read-model',
  }
}

function edge(edgeId: string, from: string, to: string, edgeType: string): Record<string, unknown> {
  return {
    edgeId,
    from,
    to,
    edgeType,
    selectionReason: 'selected by fixture',
    sourceAuthorityStatus: 'selected-from-graph-source-and-read-model-vocabulary',
  }
}

function sourceArtifactForNode(nodeKind: string): string {
  if (nodeKind === 'change') return 'examples/valid/todo-app-devview-run/.devview/control/change-tree.json'
  if (nodeKind === 'task') return 'examples/valid/todo-app-devview-run/.devview/tree/work-tree.json'
  if (nodeKind === 'check') return 'examples/valid/todo-app-devview-run/.devview/tree/test-tree.json'
  if (nodeKind === 'evidence') return 'examples/valid/todo-app-devview-run/.devview/evidence/evidence-tree.json'
  return 'examples/valid/todo-app-devview-run/.devview/control/impact-tree.json'
}
