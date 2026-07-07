import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { validateRequestIrCandidateSchemaOnly } from '../core/request-ir-candidate-validator'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Request IR Candidate schema-only validator core', () => {
  it('accepts a structurally valid candidate without allowing traversal or contract generation', () => {
    const result = validateRequestIrCandidateSchemaOnly(validCandidate(), 'candidate.json')

    expect(result.schemaValidationStatus).toBe('schema-valid')
    expect(result.requestIrValidationStatus).toBe('schema-valid-graph-validation-not-run')
    expect(result.validationScope).toBe('schema-and-boundary-only')
    expect(result.graphAuthorityValidationStatus).toBe('not-run')
    expect(result.graphTraversalAllowed).toBe(false)
    expect(result.contractGenerationAllowed).toBe(false)
    expect(result.instructionPackGenerationAllowed).toBe(false)
    expect(result.humanReviewRequired).toBe(true)
    expect(result.graphValidationRequired).toBe(true)
    expect(result.validationFindings).toContainEqual(
      expect.objectContaining({
        code: 'REQUEST_IR_CANDIDATE_UNRESOLVED_AMBIGUITY',
        severity: 'warning',
      }),
    )
  })

  it('treats unknown request type as clarification-required without failing schema validation', () => {
    const result = validateRequestIrCandidateSchemaOnly({
      ...validCandidate(),
      requestTypeCandidate: 'unknown',
      confidence: { score: 0.92, band: 'high' },
      ambiguities: [],
      requiresClarification: false,
      humanReviewRequired: false,
    })

    expect(result.schemaValidationStatus).toBe('schema-valid')
    expect(result.requestIrValidationStatus).toBe('schema-valid-graph-validation-not-run')
    expect(result.allowedEnumValidationStatus).toBe('unknown-request-type-clarification-required')
    expect(result.requiresClarification).toBe(true)
    expect(result.humanReviewRequired).toBe(true)
    expect(result.graphTraversalAllowed).toBe(false)
  })

  it('blocks unsafe candidate-only boundary fields', () => {
    const result = validateRequestIrCandidateSchemaOnly({
      ...validCandidate(),
      graphTraversalAllowed: true,
    })

    expect(result.schemaValidationStatus).toBe('schema-invalid')
    expect(result.requestIrValidationStatus).toBe('validation-blocked')
    expect(result.candidateBoundaryValidationStatus).toBe('invalid')
    expect(result.validationFindings).toContainEqual(
      expect.objectContaining({
        code: 'REQUEST_IR_CANDIDATE_BOUNDARY_UNSAFE',
        severity: 'error',
        field: 'graphTraversalAllowed',
      }),
    )
  })

  it('keeps low confidence clarification-required and still disallows traversal', () => {
    const result = validateRequestIrCandidateSchemaOnly({
      ...validCandidate(),
      confidence: { score: 0.24, band: 'low' },
    })

    expect(result.schemaValidationStatus).toBe('schema-valid')
    expect(result.confidenceValidationStatus).toBe('clarification-required')
    expect(result.requiresClarification).toBe(true)
    expect(result.graphTraversalAllowed).toBe(false)
  })
})

describe('Request IR Candidate schema-only validator CLI', () => {
  it('prints JSON without writing files by default', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'candidate.json'), validCandidate())
    const outputPath = join(workspace, 'request-ir-validation.json')

    const result = await runDevViewCli(
      ['graph', 'read-model', 'validate-request-ir', '--candidate', 'candidate.json', '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('graph read-model validate-request-ir')
    expect(payload.requestIrValidationStatus).toBe('schema-valid-graph-validation-not-run')
    expect(payload.graphTraversalAllowed).toBe(false)
    expect(payload.contractGenerationAllowed).toBe(false)
    expect(payload.instructionPackGenerationAllowed).toBe(false)
    expect(payload.writtenOutputPath).toBe(null)
    expect(existsSync(outputPath)).toBe(false)
  })

  it('writes only the explicit output path when requested', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'candidate.json'), validCandidate())
    const outputPath = join('.tmp', 'request-ir-validation.json')

    const result = await runDevViewCli(
      ['graph', 'read-model', 'validate-request-ir', '--candidate', 'candidate.json', '--output', outputPath, '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.outputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(payload.writtenOutputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(payload.writtenOutputPathAuthorityStatus).toBe('explicit-preview-output-not-graph-source')
    expect(written.artifactRole).toBe('request-ir-candidate-schema-only-validation')
    expect(written.graphTraversalAllowed).toBe(false)
    expect(written.contractGenerationAllowed).toBe(false)
  })

  it('fails malformed or unsafe candidates clearly', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'candidate.json'), {
      ...validCandidate(),
      candidateOnly: false,
    })

    const result = await runDevViewCli(
      ['graph', 'read-model', 'validate-request-ir', '--candidate', 'candidate.json', '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.command).toBe('graph read-model validate-request-ir')
    expect(payload.requestIrValidationStatus).toBe('validation-blocked')
    expect(payload.issues[0]).toEqual(
      expect.objectContaining({
        code: 'REQUEST_IR_CANDIDATE_BOUNDARY_UNSAFE',
        severity: 'error',
      }),
    )
  })
})

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
      'target record CH-001 remains structure-only until validation confirms authority',
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
  }
}
