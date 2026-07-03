import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runPbeCli } from '../app'
import { validateRequestIrGraphAware } from '../core/request-ir-graph-aware-validator'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Request IR graph-aware validator core', () => {
  it('permits future traversal for a graph-resolved candidate without running traversal', () => {
    const result = validateRequestIrGraphAware(validCandidate(), validSchemaValidation(), validAuthority(), {
      candidatePath: 'candidate.json',
      schemaValidationPath: 'schema-validation.json',
    })

    expect(result.schemaValidationPrerequisiteStatus).toBe('passed')
    expect(result.graphValidationStatus).toBe('graph-aware-valid')
    expect(result.targetRecordValidationStatus).toBe('resolved')
    expect(result.targetComponentValidationStatus).toBe('resolved')
    expect(result.changeTypeCompatibilityStatus).toBe('compatible')
    expect(result.graphTraversalAllowed).toBe(true)
    expect(result.graphTraversalPermissionMeaning).toBe('future-pass-permission-only')
    expect(result.graphTraversalExecuted).toBe(false)
    expect(result.selectedGraphSliceGenerated).toBe(false)
    expect(result.contractGenerationAllowed).toBe(false)
    expect(result.contractInputGenerated).toBe(false)
    expect(result.instructionPackGenerationAllowed).toBe(false)
    expect(result.instructionPackGenerated).toBe(false)
    expect(result.graphSourceMutated).toBe(false)
    expect(result.approvalStatus).toBe('not-approved')
    expect(result.runtimeEvidenceSatisfied).toBe(false)
  })

  it('blocks graph-aware validation when schema-only validation is unsafe', () => {
    const result = validateRequestIrGraphAware(
      validCandidate(),
      {
        ...validSchemaValidation(),
        graphTraversalAllowed: true,
      },
      validAuthority(),
    )

    expect(result.schemaValidationPrerequisiteStatus).toBe('blocked')
    expect(result.graphValidationStatus).toBe('validation-blocked')
    expect(result.graphTraversalAllowed).toBe(false)
    expect(result.validationFindings).toContainEqual(
      expect.objectContaining({
        code: 'REQUEST_IR_GRAPH_SCHEMA_VALIDATION_PREREQUISITE_UNSAFE',
        severity: 'error',
        field: 'graphTraversalAllowed',
      }),
    )
  })

  it('requires target record resolution before traversal permission', () => {
    const result = validateRequestIrGraphAware(
      {
        ...validCandidate(),
        targetRecordIdCandidate: 'CH-MISSING',
      },
      validSchemaValidation(),
      validAuthority(),
    )

    expect(result.targetRecordValidationStatus).toBe('unresolved')
    expect(result.graphValidationStatus).toBe('validation-blocked')
    expect(result.graphTraversalAllowed).toBe(false)
    expect(result.validationFindings).toContainEqual(
      expect.objectContaining({
        code: 'REQUEST_IR_GRAPH_TARGET_RECORD_UNRESOLVED',
        severity: 'error',
      }),
    )
  })

  it('blocks incompatible change type without generating traversal or contract output', () => {
    const result = validateRequestIrGraphAware(
      {
        ...validCandidate(),
        changeTypeCandidate: 'production-source-change',
      },
      validSchemaValidation(),
      validAuthority(),
    )

    expect(result.changeTypeCompatibilityStatus).toBe('incompatible')
    expect(result.graphTraversalAllowed).toBe(false)
    expect(result.graphTraversalExecuted).toBe(false)
    expect(result.selectedGraphSliceGenerated).toBe(false)
    expect(result.contractGenerationAllowed).toBe(false)
    expect(result.instructionPackGenerationAllowed).toBe(false)
  })
})

describe('Request IR graph-aware validator CLI', () => {
  it('prints JSON without writing files by default', async () => {
    const workspace = createWorkspace()
    writeFixtureFiles(workspace)
    const outputPath = join(workspace, 'request-ir-graph-validation.json')

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'validate-request-ir-graph',
        '--candidate',
        'candidate.json',
        '--schema-validation',
        'schema-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('graph read-model validate-request-ir-graph')
    expect(payload.graphValidationStatus).toBe('graph-aware-valid')
    expect(payload.graphTraversalAllowed).toBe(true)
    expect(payload.graphTraversalExecuted).toBe(false)
    expect(payload.selectedGraphSliceGenerated).toBe(false)
    expect(payload.contractGenerationAllowed).toBe(false)
    expect(payload.writtenOutputPath).toBe(null)
    expect(existsSync(outputPath)).toBe(false)
  })

  it('writes only the explicit output path when requested', async () => {
    const workspace = createWorkspace()
    writeFixtureFiles(workspace)
    const outputPath = join('.tmp', 'request-ir-graph-validation.json')

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'validate-request-ir-graph',
        '--candidate',
        'candidate.json',
        '--schema-validation',
        'schema-validation.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.outputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(payload.writtenOutputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(payload.writtenOutputPathAuthorityStatus).toBe('explicit-preview-output-not-graph-source')
    expect(written.artifactRole).toBe('request-ir-graph-aware-validation')
    expect(written.graphTraversalAllowed).toBe(true)
    expect(written.graphTraversalExecuted).toBe(false)
    expect(written.contractGenerationAllowed).toBe(false)
  })

  it('fails malformed schema validation clearly', async () => {
    const workspace = createWorkspace()
    writeFixtureFiles(workspace)
    writeJson(join(workspace, 'schema-validation.json'), {
      ...validSchemaValidation(),
      requestIrValidationStatus: 'validation-blocked',
    })

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'validate-request-ir-graph',
        '--candidate',
        'candidate.json',
        '--schema-validation',
        'schema-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.command).toBe('graph read-model validate-request-ir-graph')
    expect(payload.graphValidationStatus).toBe('validation-blocked')
    expect(payload.issues[0]).toEqual(
      expect.objectContaining({
        code: 'REQUEST_IR_GRAPH_SCHEMA_VALIDATION_PREREQUISITE_UNSAFE',
        severity: 'error',
      }),
    )
  })
})

function writeFixtureFiles(workspace: string): void {
  writeJson(join(workspace, 'candidate.json'), validCandidate())
  writeJson(join(workspace, 'schema-validation.json'), validSchemaValidation())
  writeJson(join(workspace, 'graph-source.json'), validAuthority().graphSource)
  writeJson(join(workspace, 'generated-read-model.json'), validAuthority().generatedReadModel)
  writeJson(join(workspace, 'compiler-input-draft.json'), validAuthority().compilerInputCalibrationDraft)
}

function validCandidate(): Record<string, unknown> {
  return {
    schemaId: 'devview-request-ir-candidate-v0-preview',
    requestIrCandidateStatus: 'candidate-only',
    sourceNaturalLanguageRequest: {
      sourceKind: 'human-natural-language-request',
      language: 'ko',
      text: 'Todo App add button evidence only; do not touch production source.',
      authorityStatus: 'raw-request-text-not-compiler-authority',
    },
    requestText: 'Todo App add button evidence only; do not touch production source.',
    requestLanguage: 'ko',
    requestTypeCandidate: 'runtime-evidence-only',
    changeTypeCandidate: 'test-only-behavior-proof',
    targetRecordIdCandidate: 'CH-001',
    targetComponentCandidate: 'Todo App',
    intentSummaryCandidate:
      'Add or strengthen evidence for the Todo App add button behavior without touching production source.',
    allowedScopeIntentCandidate: ['runtime behavior evidence', 'test output or evidence artifact updates'],
    forbiddenScopeIntentCandidate: ['production source changes', 'graph-source mutation'],
    requiredEvidenceIntentCandidate: ['add-todo behavior proof', 'runtime or test evidence link candidate'],
    riskIntentCandidate: [
      'attached evidence may not satisfy runtime Evidence policy',
      'production source must remain untouched',
    ],
    confidence: {
      score: 0.74,
      band: 'medium',
    },
    ambiguities: [
      {
        ambiguityId: 'target-record-authority',
        status: 'requires-deterministic-validation',
      },
    ],
    requiresClarification: false,
    humanReviewRequired: true,
    candidateOnly: true,
    authorityStatus: 'not-authoritative-until-validated',
    validatedRequestIr: false,
    graphTraversalAllowed: false,
    contractGenerationAllowed: false,
    instructionPackGenerationAllowed: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    futureValidatorExpectations: {
      graphSourceMetadata: 'graph-source.json',
      generatedReadModel: 'generated-read-model.json',
      compilerInputCalibrationDraft: 'compiler-input-draft.json',
    },
  }
}

function validSchemaValidation(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'request-ir-candidate-schema-only-validation',
    status: 'request-ir-candidate-schema-only-validation-complete',
    validatorName: 'RequestIrCandidateSchemaOnlyValidator',
    validationScope: 'schema-and-boundary-only',
    schemaValidationStatus: 'schema-valid',
    requestIrValidationStatus: 'schema-valid-graph-validation-not-run',
    graphTraversalAllowed: false,
    contractGenerationAllowed: false,
    instructionPackGenerationAllowed: false,
    validationFindings: [
      {
        code: 'REQUEST_IR_CANDIDATE_UNRESOLVED_AMBIGUITY',
        severity: 'warning',
      },
    ],
  }
}

function validAuthority(): Record<string, unknown> {
  return {
    graphSource: {
      status: 'confirmed-graph-source-backed',
      graphSourceScope: 'todo-app-pbe-run-structure-only',
      sourceProfile: 'todo-app-pbe-run-structure-only',
      policyLevel: 'structure-only',
      sourceSlice: 'examples/valid/todo-app-pbe-run',
      sourceAuthorityBoundary:
        'This Todo App PBE Run graph source is confirmed for structure-only graph-source-backed generation.',
      sourceRecords: {
        nodes: [
          {
            id: 'CH-001',
            nodeKind: 'change',
            sourceArtifact: 'examples/valid/todo-app-pbe-run/.pbe/control/change-tree.json',
            title: 'Preserve completed add-todo behavior while future revisions are assessed.',
            status: 'impact_analyzed',
          },
        ],
        edges: [],
      },
    },
    generatedReadModel: {
      metadata: {
        sliceProfileDisplayName: 'Todo App PBE Golden Run',
      },
      nodes: [
        {
          id: 'CH-001',
          nodeKind: 'change',
        },
      ],
    },
    compilerInputCalibrationDraft: {
      calibrationFixture: {
        projectName: 'Todo App PBE Run',
      },
      policySnapshot: {
        policies: [
          {
            id: 'test-only-behavior-proof-boundary',
          },
        ],
        forbiddenScopeRules: [
          {
            id: 'scope-no-todo-app-production-source-edit',
          },
        ],
        evidenceCheckMappings: [
          {
            evidenceType: 'runtime_command_output',
            requiredCheckId: 'check-todo-app-runtime-add-todo',
          },
        ],
      },
      targetScopeCandidates: [
        {
          id: 'scope-todo-app-test-tree',
        },
      ],
      riskSources: [
        {
          derivedRiskId: 'risk-runtime-evidence-not-acceptance',
        },
      ],
    },
  }
}
