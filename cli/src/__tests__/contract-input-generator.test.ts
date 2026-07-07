import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { generateContractCompilerInput } from '../core/contract-input-generator'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Contract compiler input generator core', () => {
  it('maps a generated selected graph slice into contract compiler input without instruction pack output', () => {
    const result = generateContractCompilerInput(validSelectedSlice(), {
      graphAwareValidation: validGraphAwareValidation(),
      requestIrCandidate: validRequestIrCandidate(),
      selectedSlicePath: 'selected-graph-slice.json',
    })

    expect(result.status).toBe('contract-compiler-input-generated')
    expect(result.contractInputGenerated).toBe(true)
    expect(result.instructionPackGenerated).toBe(false)
    expect(result.graphSourceMutated).toBe(false)
    expect(result.graphDeltaApplied).toBe(false)
    expect(result.approvalStatus).toBe('not-approved')
    expect(result.equivalenceProven).toBe(false)
    expect(result.runtimeEvidenceSatisfied).toBe(false)
    expect(result.scopeEnforced).toBe(false)
    expect(result.targetScopeCandidates.map((entry) => entry.id)).toEqual([
      'scope-ch-001',
      'scope-wt-1',
      'scope-tt-1',
      'scope-ev-1',
    ])
    expect(result.allowedScope.map((entry) => entry.id)).toEqual(['allowed-scope-tt-1', 'allowed-scope-ev-1'])
    const allowedScopePaths = result.allowedScope.flatMap((entry) => entry.paths as string[])
    expect(allowedScopePaths).not.toContain('examples/valid/todo-app-devview-run/.devview/control/change-tree.json')
    expect(allowedScopePaths).not.toContain('examples/valid/todo-app-devview-run/.devview/tree/work-tree.json')
    expect(result.requiredEvidence.map((entry) => entry.sourceEvidenceId).sort()).toEqual([
      'evidence-ev-1',
      'evidence-tt-1',
    ])
    expect(result.requiredEvidence.map((entry) => entry.artifact)).toContain(
      'examples/valid/todo-app-devview-run/.devview/evidence/test-results/todo-add.txt',
    )
    for (const artifact of result.requiredEvidence.map((entry) => String(entry.artifact))) {
      expect(artifact.startsWith('.devview/')).toBe(false)
      expect(artifact.startsWith('unresolved:') || existsSync(join(pluginRoot, artifact))).toBe(true)
    }
    expect(result.knownRisks).toEqual([
      expect.objectContaining({
        sourceId: 'risk-im-001',
        riskType: 'scope-drift',
      }),
    ])
    expect(result.forbiddenScope.map((entry) => entry.id).sort()).toEqual([
      'forbidden-approval-or-acceptance-changes',
      'forbidden-graph-source-mutation',
      'forbidden-production-source-changes',
    ])
    expect(result.forbiddenScope).toContainEqual(
      expect.objectContaining({
        id: 'forbidden-production-source-changes',
        paths: ['unresolved:production-source-changes'],
        sourceStatus: 'unresolved-from-request-intent-not-derived-from-selected-slice',
      }),
    )
    expect(result.validationFindings).toContainEqual(
      expect.objectContaining({
        code: 'CONTRACT_INPUT_FORBIDDEN_SCOPE_PATH_UNRESOLVED',
        severity: 'warning',
      }),
    )
    expect(result.outputRequirements.length).toBeGreaterThanOrEqual(3)
    expect(result.mappingTrace.length).toBeGreaterThan(0)
  })

  it('blocks when the selected slice is not generated or evidence nodes are missing', () => {
    const slice = {
      ...validSelectedSlice(),
      selectedGraphSliceGenerated: false,
      selectedGraphSliceStatus: 'blocked',
      includedEvidenceNodes: [],
    }
    const result = generateContractCompilerInput(slice, {
      graphAwareValidation: validGraphAwareValidation(),
      requestIrCandidate: validRequestIrCandidate(),
    })

    expect(result.status).toBe('contract-compiler-input-blocked')
    expect(result.contractInputGenerated).toBe(false)
    expect(result.instructionPackGenerated).toBe(false)
    expect(result.contractCompilerReadinessStatus).toBe('blocked')
    expect(result.humanReviewRequired).toBe(true)
    expect(result.validationFindings).toContainEqual(
      expect.objectContaining({
        code: 'CONTRACT_INPUT_SELECTED_SLICE_PREREQUISITE_UNSAFE',
        field: 'selectedGraphSliceGenerated',
        severity: 'error',
      }),
    )
    expect(result.validationFindings).toContainEqual(
      expect.objectContaining({
        code: 'CONTRACT_INPUT_EVIDENCE_NODES_MISSING',
        severity: 'error',
      }),
    )
  })

  it('keeps the existing compiler input model groups present without invoking the backend dry run', () => {
    const result = generateContractCompilerInput(validSelectedSlice(), {
      graphAwareValidation: validGraphAwareValidation(),
      requestIrCandidate: validRequestIrCandidate(),
    })

    expect(result.compilerInputModelCompatibility.compatibilityStatus).toBe(
      'frontend-field-compatible-with-compiler-input-model-groups',
    )
    expect(result.compilerInputModelCompatibility.backendDryRunValidationStatus).toBe('not-run-not-same-artifact-role')
    expect(result.compilerInputModelCompatibility.missingRequiredInputGroups).toEqual([])
    expect(result.compilerInputModelCompatibility.requiredInputGroupsPresent.sort()).toEqual(
      [...result.compilerInputModelCompatibility.requiredInputGroups].sort(),
    )
    expect(result.compilerInputModelCompatibility.backendDryRunInvoked).toBe(false)
    expect(result.compilerInputModelCompatibility.backendInstructionPackGenerated).toBe(false)
    expect(result.humanRequest).toBeTruthy()
    expect(result.graphSnapshot).toBeTruthy()
    expect(result.packSchema).toBeTruthy()
    expect(result.policySnapshot).toBeTruthy()
    expect(result.evidenceIndex).toBeTruthy()
  })
})

describe('Contract compiler input CLI', () => {
  it('writes only the explicit output path and does not mutate selected slice or graph source', async () => {
    const workspace = createWorkspace()
    writeFixtureFiles(workspace)
    const outputPath = join('.tmp', 'contract-compiler-input.json')
    const selectedSliceBefore = readFileSync(join(workspace, 'selected-graph-slice.json'), 'utf8')
    const graphSourceBefore = readFileSync(join(workspace, 'graph-source.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'generate-contract-input',
        '--selected-slice',
        'selected-graph-slice.json',
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
    expect(payload.command).toBe('graph read-model generate-contract-input')
    expect(payload.outputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(payload.contractInputGenerated).toBe(true)
    expect(payload.instructionPackGenerated).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(written.artifactRole).toBe('contract-compiler-input')
    expect(written.writtenOutputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(existsSync(join(workspace, 'selected-graph-slice.json'))).toBe(true)
    expect(readFileSync(join(workspace, 'selected-graph-slice.json'), 'utf8')).toBe(selectedSliceBefore)
    expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(graphSourceBefore)
  })
})

function writeFixtureFiles(workspace: string): void {
  writeJson(join(workspace, 'selected-graph-slice.json'), validSelectedSlice())
  writeJson(join(workspace, 'request-ir-graph-validation.json'), validGraphAwareValidation())
  writeJson(join(workspace, 'request-ir-candidate.json'), validRequestIrCandidate())
  writeJson(join(workspace, 'graph-source.json'), { sourceRecords: { nodes: [], edges: [] } })
  writeJson(join(workspace, 'generated-read-model.json'), { nodes: [], edges: [] })
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
    sourceTraversalPlan: 'graph-traversal-plan.json',
    sourceGraphAwareValidation: 'request-ir-graph-validation.json',
    graphSourcePath: 'examples/valid/todo-app-devview-run/graph-source.json',
    generatedReadModelPath: 'generated-read-model.json',
    selectedGraphSliceStatus: 'generated',
    graphTraversalExecuted: true,
    selectedGraphSliceGenerated: true,
    contractInputGenerated: false,
    instructionPackGenerated: false,
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
    requestText: 'Todo App?êÏÑú add Î≤ÑÌäº ?ôÏûë Ï¶ùÍ±∞Îß?Ï∂îÍ??¥Ï§ò. production source??Í±¥ÎìúÎ¶¨Ï? Îß?',
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
