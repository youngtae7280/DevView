import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runPbeCli } from '../app'
import { reviseRequestIrCandidateFromClarificationAnswers } from '../core/request-ir-candidate-reviser'
import { validateRequestIrCandidateSchemaOnly } from '../core/request-ir-candidate-validator'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Request IR Candidate clarification revision core', () => {
  it('generates a no-op revised candidate for a no-question calibration pack', () => {
    const result = reviseRequestIrCandidateFromClarificationAnswers(
      validNoQuestionPack(),
      validNoQuestionAnswers(),
      validRequestIrCandidate(),
      {
        packPath: 'pack.json',
        answersPath: 'answers.json',
        originalCandidatePath: 'candidate.json',
        outputPath: 'revised-candidate.json',
      },
    )

    expect(result.status).toBe('request-ir-candidate-revision-generated')
    expect(result.revisionStatus).toBe('no-op-revision-generated')
    expect(result.revisedCandidateGenerated).toBe(true)
    expect(result.revisedCandidate?.artifactRole).toBe('request-ir-candidate')
    expect(result.revisedCandidate?.revisionAuthorityStatus).toBe('clarification-derived-candidate-not-validated')
    expect(result.revisedCandidate?.authorityStatus).toBe('not-authoritative-until-validated')
    expect(result.revisedCandidate?.graphTraversalAllowed).toBe(false)
    expect(result.revisedCandidate?.contractGenerationAllowed).toBe(false)
    expect(result.revisedCandidate?.instructionPackGenerationAllowed).toBe(false)
    expect(result.revisedCandidate?.validationRequiredAgain).toBe(true)
    expect(result.revisedCandidate?.requestIrValidationStatus).toBe('not-validated-after-clarification-revision')
    expect(
      (result.revisedCandidate?.futureValidatorExpectations as Record<string, unknown>).schemaOnlyValidationResult,
    ).toBe(null)
    expect(
      (result.revisedCandidate?.futureValidatorExpectations as Record<string, unknown>).graphAwareValidationResult,
    ).toBe(null)

    const validation = validateRequestIrCandidateSchemaOnly(result.revisedCandidate)
    expect(validation.requestIrValidationStatus).toBe('schema-valid-graph-validation-not-run')
    expect(validation.graphTraversalAllowed).toBe(false)
  })

  it('applies ambiguous answers only to allowed candidate fields', () => {
    const result = reviseRequestIrCandidateFromClarificationAnswers(
      ambiguousPack(),
      {
        ...validAnswersBase(),
        answerSetStatus: 'answers-provided-candidate-only',
        answersRequired: true,
        answers: [
          {
            answerId: 'answer-target-component',
            questionId: 'clarify-target-component',
            mapsToRequestIrField: 'targetComponentCandidate',
            candidateValue: 'Todo App',
            answerAuthorityStatus: 'clarification-answer-not-approval',
          },
          {
            answerId: 'answer-risk',
            questionId: 'clarify-risk',
            mapsToRequestIrField: 'riskIntentCandidate',
            candidateValue: ['production source must remain untouched'],
            answerAuthorityStatus: 'clarification-answer-not-approval',
          },
        ],
      },
      {
        ...validRequestIrCandidate(),
        requiresClarification: true,
        targetComponentCandidate: '',
        riskIntentCandidate: ['unknown risk'],
      },
    )

    expect(result.status).toBe('request-ir-candidate-revision-generated')
    expect(result.revisionStatus).toBe('answers-applied-candidate-only')
    expect(result.appliedAnswerCount).toBe(2)
    expect(result.revisedCandidate?.targetComponentCandidate).toBe('Todo App')
    expect(result.revisedCandidate?.riskIntentCandidate).toEqual(['production source must remain untouched'])
    expect(result.revisedCandidate?.requiresClarification).toBe(false)
    expect(result.revisedCandidate?.graphTraversalAllowed).toBe(false)
    expect(result.revisedCandidate?.approvalStatus).toBe('not-approved')
  })

  it('blocks answers that reference unknown question ids', () => {
    const result = reviseRequestIrCandidateFromClarificationAnswers(
      ambiguousPack(),
      {
        ...validAnswersBase(),
        answerSetStatus: 'answers-provided-candidate-only',
        answersRequired: true,
        answers: [
          {
            answerId: 'unknown',
            questionId: 'not-in-pack',
            mapsToRequestIrField: 'targetComponentCandidate',
            candidateValue: 'Todo App',
            answerAuthorityStatus: 'clarification-answer-not-approval',
          },
        ],
      },
      validRequestIrCandidate(),
    )

    expect(result.status).toBe('request-ir-candidate-revision-blocked')
    expect(result.revisedCandidateGenerated).toBe(false)
    expect(result.validationFindings.map((finding) => finding.code)).toContain('CLARIFICATION_ANSWER_UNKNOWN_QUESTION')
  })

  it('blocks answers that try to set unsafe authority fields', () => {
    const result = reviseRequestIrCandidateFromClarificationAnswers(
      ambiguousPack(),
      {
        ...validAnswersBase(),
        answerSetStatus: 'answers-provided-candidate-only',
        answersRequired: true,
        answers: [
          {
            answerId: 'unsafe',
            questionId: 'clarify-target-component',
            mapsToRequestIrField: 'targetComponentCandidate',
            candidateValue: 'Todo App',
            answerAuthorityStatus: 'clarification-answer-not-approval',
            graphTraversalAllowed: true,
          },
        ],
      },
      validRequestIrCandidate(),
    )

    expect(result.status).toBe('request-ir-candidate-revision-blocked')
    expect(result.revisedCandidateGenerated).toBe(false)
    expect(result.validationFindings.map((finding) => finding.code)).toContain(
      'CLARIFICATION_ANSWER_AUTHORITY_FIELD_UNSAFE',
    )
  })
})

describe('Request IR Candidate clarification revision CLI', () => {
  it('writes a revised candidate to an explicit output without mutating inputs', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validNoQuestionPack())
    writeJson(join(workspace, 'answers.json'), validNoQuestionAnswers())
    writeJson(join(workspace, 'candidate.json'), validRequestIrCandidate())
    const packBefore = readFileSync(join(workspace, 'pack.json'), 'utf8')
    const answersBefore = readFileSync(join(workspace, 'answers.json'), 'utf8')
    const candidateBefore = readFileSync(join(workspace, 'candidate.json'), 'utf8')
    const outputPath = join('.tmp', 'revised-candidate.json')

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'revise-request-ir-candidate',
        '--clarification-pack',
        'pack.json',
        '--answers',
        'answers.json',
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
    expect(payload.command).toBe('graph read-model revise-request-ir-candidate')
    expect(payload.outputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(written.artifactRole).toBe('request-ir-candidate')
    expect(written.revisionAuthorityStatus).toBe('clarification-derived-candidate-not-validated')
    expect(written.graphTraversalAllowed).toBe(false)
    expect(readFileSync(join(workspace, 'pack.json'), 'utf8')).toBe(packBefore)
    expect(readFileSync(join(workspace, 'answers.json'), 'utf8')).toBe(answersBefore)
    expect(readFileSync(join(workspace, 'candidate.json'), 'utf8')).toBe(candidateBefore)
  })

  it('blocks output that would overwrite the clarification pack and leaves it unchanged', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validNoQuestionPack())
    writeJson(join(workspace, 'answers.json'), validNoQuestionAnswers())
    writeJson(join(workspace, 'candidate.json'), validRequestIrCandidate())
    const packBefore = readFileSync(join(workspace, 'pack.json'), 'utf8')

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'revise-request-ir-candidate',
        '--clarification-pack',
        'pack.json',
        '--answers',
        'answers.json',
        '--output',
        'pack.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source Clarification Interview Pack')
    expect(readFileSync(join(workspace, 'pack.json'), 'utf8')).toBe(packBefore)
  })

  it('blocks unsafe answers without writing partial output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), ambiguousPack())
    writeJson(join(workspace, 'answers.json'), {
      ...validAnswersBase(),
      answerSetStatus: 'answers-provided-candidate-only',
      answersRequired: true,
      answers: [
        {
          answerId: 'unsafe',
          questionId: 'clarify-target-component',
          mapsToRequestIrField: 'targetComponentCandidate',
          candidateValue: 'Todo App',
          answerAuthorityStatus: 'clarification-answer-not-approval',
          approvalStatus: 'approved',
        },
      ],
    })
    writeJson(join(workspace, 'candidate.json'), validRequestIrCandidate())
    const outputPath = join('.tmp', 'revised-candidate.json')

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'revise-request-ir-candidate',
        '--clarification-pack',
        'pack.json',
        '--answers',
        'answers.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('unsafe authority field')
    expect(existsSync(join(workspace, outputPath))).toBe(false)
  })
})

function validNoQuestionPack(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'clarification-interview-pack',
    status: 'clarification-interview-pack-generated',
    sourceClarificationBoundary: 'boundary.json',
    sourceRequestIrCandidate: 'candidate.json',
    clarificationInterviewPackGenerated: true,
    questionPlanStatus: 'no-questions-required-for-current-calibration-candidate',
    questionCount: 0,
    plannedQuestions: [],
    requestIrCandidateRevised: false,
    graphTraversalAllowed: false,
    contractInputGenerated: false,
    instructionPackGenerated: false,
    codexExecutionTriggered: false,
    validationChainRequiredAgain: [
      {
        step: 'schema-only-request-ir-validation',
        command: 'graph read-model validate-request-ir --candidate <revisedCandidatePath> --json',
      },
    ],
  }
}

function ambiguousPack(): Record<string, unknown> {
  return {
    ...validNoQuestionPack(),
    questionPlanStatus: 'questions-planned-for-ambiguous-candidate',
    questionCount: 2,
    plannedQuestions: [
      {
        questionId: 'clarify-target-component',
        mapsToRequestIrField: 'targetComponentCandidate',
        prompt: 'Which component should this request target?',
        choices: [],
        freeformAllowed: true,
        answerAuthorityStatus: 'clarification-answer-not-approval',
      },
      {
        questionId: 'clarify-risk',
        mapsToRequestIrField: 'riskIntentCandidate',
        prompt: 'What risk should DevView account for?',
        choices: [],
        freeformAllowed: true,
        answerAuthorityStatus: 'clarification-answer-not-approval',
      },
    ],
  }
}

function validNoQuestionAnswers(): Record<string, unknown> {
  return {
    ...validAnswersBase(),
    answerSetStatus: 'no-answers-required-for-current-calibration-candidate',
    answersRequired: false,
    answers: [],
  }
}

function validAnswersBase(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'clarification-answers-preview',
    status: 'clarification-answers-previewed',
    sourceClarificationInterviewPack: 'pack.json',
    answerAuthorityStatus: 'clarification-answer-not-approval',
    candidateOnly: true,
    requestIrCandidateRevised: false,
    graphTraversalAllowed: false,
    contractGenerationAllowed: false,
    instructionPackGenerationAllowed: false,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function validRequestIrCandidate(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'request-ir-candidate-calibration-fixture-preview',
    status: 'request-ir-candidate-calibration-fixture-previewed',
    schemaId: 'devview-request-ir-candidate-v0-preview',
    requestIrCandidateStatus: 'candidate-only',
    sourceNaturalLanguageRequest: {
      sourceKind: 'human-natural-language-request',
      language: 'en',
      text: 'Add Todo App runtime evidence without touching production source.',
    },
    requestText: 'Add Todo App runtime evidence without touching production source.',
    requestLanguage: 'en',
    requestTypeCandidate: 'runtime-evidence-only',
    changeTypeCandidate: 'test-only-behavior-proof',
    targetRecordIdCandidate: 'CH-001',
    targetComponentCandidate: 'Todo App',
    intentSummaryCandidate: 'Add runtime evidence for add button behavior without production source changes.',
    allowedScopeIntentCandidate: ['runtime behavior evidence'],
    forbiddenScopeIntentCandidate: ['production source changes'],
    requiredEvidenceIntentCandidate: ['add-todo behavior proof'],
    riskIntentCandidate: ['production source must remain untouched'],
    confidence: { score: 0.74, band: 'medium' },
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
