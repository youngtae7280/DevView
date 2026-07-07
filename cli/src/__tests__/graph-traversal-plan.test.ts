import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { generateGraphTraversalPlan } from '../core/graph-traversal-plan'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Graph traversal plan generator core', () => {
  it('generates a deterministic plan for the Todo App graph-aware validation fixture without selected slice output', () => {
    const result = generateGraphTraversalPlan(validGraphValidation(), validAuthority(), {
      graphValidationPath: 'request-ir-graph-validation.json',
    })

    expect(result.status).toBe('graph-traversal-plan-generated')
    expect(result.graphTraversalPlanGenerated).toBe(true)
    expect(result.graphTraversalPlanStatus).toBe('ready')
    expect(result.startNodeResolutionStatus).toBe('resolved')
    expect(result.startNodeCandidates).toEqual([
      expect.objectContaining({
        nodeId: 'CH-001',
        nodeKind: 'change',
        resolutionStatus: 'resolved',
        sourceAuthorityStatus: 'resolved-from-graph-aware-validation-and-graph-source',
      }),
    ])
    expect(result.graphTraversalExecuted).toBe(false)
    expect(result.selectedGraphSliceGenerated).toBe(false)
    expect(result.contractInputGenerated).toBe(false)
    expect(result.instructionPackGenerated).toBe(false)
    expect(result.contractInputGenerationAllowed).toBe(false)
    expect(result.selectedGraphSlicePlanningAllowed).toBe(true)
    expect('selectedNodes' in result).toBe(false)
    expect('selectedEdges' in result).toBe(false)
  })

  it('blocks when graph-aware validation does not allow traversal', () => {
    const result = generateGraphTraversalPlan(
      {
        ...validGraphValidation(),
        graphValidationStatus: 'validation-blocked',
        graphTraversalAllowed: false,
      },
      validAuthority(),
    )

    expect(result.status).toBe('graph-traversal-plan-blocked')
    expect(result.graphTraversalPlanGenerated).toBe(false)
    expect(result.graphTraversalPlanStatus).toBe('blocked')
    expect(result.selectedGraphSlicePlanningAllowed).toBe(false)
    expect(result.graphTraversalExecuted).toBe(false)
    expect(result.selectedGraphSliceGenerated).toBe(false)
    expect(result.contractInputGenerated).toBe(false)
    expect(result.instructionPackGenerated).toBe(false)
    expect(result.validationFindings).toContainEqual(
      expect.objectContaining({
        code: 'GRAPH_TRAVERSAL_PLAN_PREREQUISITE_UNSAFE',
        field: 'graphValidationStatus',
        severity: 'error',
      }),
    )
  })

  it('keeps type fields within graph taxonomy vocabulary while role fields carry planner semantics', () => {
    const result = generateGraphTraversalPlan(validGraphValidation(), validAuthority())
    const nodeVocabulary = new Set(result.nodeKindVocabulary)
    const edgeVocabulary = new Set(result.edgeTypeVocabulary)

    for (const nodeType of [...result.requiredNodeTypes, ...result.optionalNodeTypes, ...result.excludedNodeTypes]) {
      expect(nodeVocabulary.has(nodeType)).toBe(true)
    }
    for (const edgeType of [...result.requiredEdgeTypes, ...result.optionalEdgeTypes, ...result.excludedEdgeTypes]) {
      expect(edgeVocabulary.has(edgeType)).toBe(true)
    }
    expect(result.requiredNodeRoles).toContain('target component or implementation context node')
    expect(result.selectionIntents).toContain(
      'collect planner semantics in role fields instead of overloading graph vocabulary fields',
    )
  })
})

describe('Graph traversal plan CLI', () => {
  it('writes only the explicit output path and does not mutate graph source', async () => {
    const workspace = createWorkspace()
    writeFixtureFiles(workspace)
    const outputPath = join('.tmp', 'graph-traversal-plan.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'plan-traversal',
        '--graph-validation',
        'graph-validation.json',
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
    expect(payload.command).toBe('graph read-model plan-traversal')
    expect(payload.outputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(payload.graphTraversalPlanGenerated).toBe(true)
    expect(payload.graphTraversalExecuted).toBe(false)
    expect(payload.selectedGraphSliceGenerated).toBe(false)
    expect(payload.contractInputGenerated).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(written.artifactRole).toBe('graph-traversal-plan')
    expect(written.writtenOutputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(existsSync(join(workspace, 'graph-source.json'))).toBe(true)
  })
})

function writeFixtureFiles(workspace: string): void {
  writeJson(join(workspace, 'graph-validation.json'), validGraphValidation())
  writeJson(join(workspace, 'graph-source.json'), validAuthority().graphSource)
  writeJson(join(workspace, 'generated-read-model.json'), validAuthority().generatedReadModel)
}

function validGraphValidation(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'request-ir-graph-aware-validation',
    status: 'request-ir-graph-aware-validation-complete',
    graphAuthorityInputs: {
      graphSourcePath: 'graph-source.json',
      generatedReadModelPath: 'generated-read-model.json',
    },
    targetRecordValidationStatus: 'resolved',
    targetRecordResolution: {
      resolvedRecordId: 'CH-001',
    },
    targetComponentValidationStatus: 'resolved',
    changeTypeCompatibilityStatus: 'compatible',
    requiredEvidenceAvailabilityStatus: 'resolved',
    graphValidationStatus: 'graph-aware-valid',
    graphTraversalAllowed: true,
    graphTraversalExecuted: false,
    selectedGraphSliceGenerated: false,
    contractInputGenerated: false,
    instructionPackGenerated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
  }
}

function validAuthority(): Record<string, unknown> {
  return {
    graphSource: {
      sourceRecords: {
        nodes: [
          {
            id: 'CH-001',
            nodeKind: 'change',
            title: 'Preserve completed add-todo behavior while future revisions are assessed.',
          },
        ],
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
      nodes: [
        {
          id: 'CH-001',
          nodeKind: 'change',
        },
      ],
      edges: [
        {
          id: 'E-CH-001-REPORTS-LOG',
          from: 'CH-001',
          to: 'LOG-001',
          edgeType: 'reports-on',
        },
      ],
    },
  }
}
