import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Clarification runtime chain CLI', () => {
  it('writes no-question revised candidate, schema validation, JSON report, and Markdown', async () => {
    const workspace = createWorkspace()
    writeClarificationInputs(workspace)

    const result = await runDevViewCli([...baseArgs(), '--markdown', '.tmp/chain.md'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)
    const revised = JSON.parse(readFileSync(join(workspace, '.tmp/revised-candidate.json'), 'utf8'))
    const validation = JSON.parse(readFileSync(join(workspace, '.tmp/revised-validation.json'), 'utf8'))
    const report = JSON.parse(readFileSync(join(workspace, '.tmp/chain.json'), 'utf8'))
    const markdown = readFileSync(join(workspace, '.tmp/chain.md'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-clarification-runtime-chain-report')
    expect(payload.revisionMode).toBe('no-op-revision')
    expect(payload.requestIrValidationStatus).toBe('schema-valid-graph-validation-not-run')
    expect(revised.artifactRole).toBe('request-ir-candidate')
    expect(revised.revisionAuthorityStatus).toBe('clarification-derived-candidate-not-validated')
    expect(revised.graphTraversalAllowed).toBe(false)
    expect(validation.artifactRole).toBe('request-ir-candidate-schema-only-validation')
    expect(validation.graphTraversalAllowed).toBe(false)
    expect(validation.contractGenerationAllowed).toBe(false)
    expect(validation.instructionPackGenerationAllowed).toBe(false)
    expect(report.graphAwareValidationExecuted).toBe(false)
    expect(report.graphTraversalExecuted).toBe(false)
    expect(report.contractInputGenerated).toBe(false)
    expect(report.instructionPackGenerated).toBe(false)
    expect(report.runtimeEvidenceSatisfied).toBe(false)
    expect(report.evidenceAccepted).toBe(false)
    expect(report.equivalenceProven).toBe(false)
    expect(report.scopeEnforced).toBe(false)
    expect(report.ciEnforcementEnabled).toBe(false)
    expect(markdown).toContain('Clarification Runtime Chain')
    expect(markdown).toContain('Graph-aware validation was not run')
  })

  it('applies ambiguous answers before schema-only validation without granting downstream authority', async () => {
    const workspace = createWorkspace()
    writeClarificationInputs(workspace, {
      pack: ambiguousPack(),
      answers: {
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
        ],
      },
      candidate: {
        ...validRequestIrCandidate(),
        requiresClarification: true,
        targetComponentCandidate: '',
      },
    })

    const result = await runDevViewCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)
    const revised = JSON.parse(readFileSync(join(workspace, '.tmp/revised-candidate.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.revisionMode).toBe('answer-applied-revision')
    expect(payload.schemaValidationExecuted).toBe(true)
    expect(revised.targetComponentCandidate).toBe('Todo App')
    expect(revised.requiresClarification).toBe(false)
    expect(revised.graphTraversalAllowed).toBe(false)
    expect(revised.contractGenerationAllowed).toBe(false)
    expect(revised.instructionPackGenerationAllowed).toBe(false)
  })

  it('blocks pack provenance mismatch without partial writes', async () => {
    const workspace = createWorkspace()
    writeClarificationInputs(workspace, {
      answers: {
        ...validNoQuestionAnswers(),
        sourceClarificationInterviewPack: 'other-pack.json',
      },
    })

    const result = await runDevViewCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'CLARIFICATION_ANSWERS_PACK_PROVENANCE_MISMATCH',
    )
    expectChainOutputsAbsent(workspace)
  })

  it('blocks candidate provenance mismatch without partial writes', async () => {
    const workspace = createWorkspace()
    writeClarificationInputs(workspace, {
      answers: {
        ...validNoQuestionAnswers(),
        sourceRequestIrCandidate: 'other-candidate.json',
      },
    })

    const result = await runDevViewCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'CLARIFICATION_ANSWERS_CANDIDATE_PROVENANCE_MISMATCH',
    )
    expectChainOutputsAbsent(workspace)
  })

  it('blocks unsafe authority answers without partial writes', async () => {
    const workspace = createWorkspace()
    writeClarificationInputs(workspace, {
      pack: ambiguousPack(),
      answers: {
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
    })

    const result = await runDevViewCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'CLARIFICATION_ANSWER_AUTHORITY_FIELD_UNSAFE',
    )
    expectChainOutputsAbsent(workspace)
  })

  it('blocks unsafe Markdown path before JSON, revised candidate, or validation writes', async () => {
    const workspace = createWorkspace()
    writeClarificationInputs(workspace)
    const packBefore = readFileSync(join(workspace, 'pack.json'), 'utf8')

    const result = await runDevViewCli([...baseArgs(), '--markdown', 'pack.json'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('would overwrite the source Clarification Interview Pack')
    expect(readFileSync(join(workspace, 'pack.json'), 'utf8')).toBe(packBefore)
    expectChainOutputsAbsent(workspace)
  })

  it('blocks linked schema output overwrite before partial writes', async () => {
    const workspace = createWorkspace()
    writeClarificationInputs(workspace, {
      candidate: {
        ...validRequestIrCandidate(),
        requestIrCandidateSchema: 'schema.json',
      },
    })
    writeJson(join(workspace, 'schema.json'), {
      artifactRole: 'request-ir-candidate-schema-preview',
      status: 'schema-previewed',
    })

    const result = await runDevViewCli([...baseArgsWithValidationOutput('schema.json')], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('request-ir-candidate-schema-preview')
    expect(existsSync(join(workspace, '.tmp/revised-candidate.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/chain.json'))).toBe(false)
  })
})

function baseArgs(): string[] {
  return baseArgsWithValidationOutput('.tmp/revised-validation.json')
}

function baseArgsWithValidationOutput(validationOutput: string): string[] {
  return [
    'graph',
    'read-model',
    'run-clarification-chain',
    '--clarification-pack',
    'pack.json',
    '--answers',
    'answers.json',
    '--revised-candidate-output',
    '.tmp/revised-candidate.json',
    '--validation-output',
    validationOutput,
    '--output',
    '.tmp/chain.json',
    '--json',
  ]
}

function expectChainOutputsAbsent(workspace: string): void {
  expect(existsSync(join(workspace, '.tmp/revised-candidate.json'))).toBe(false)
  expect(existsSync(join(workspace, '.tmp/revised-validation.json'))).toBe(false)
  expect(existsSync(join(workspace, '.tmp/chain.json'))).toBe(false)
  expect(existsSync(join(workspace, '.tmp/chain.md'))).toBe(false)
}

function writeClarificationInputs(
  workspace: string,
  overrides: {
    pack?: Record<string, unknown>
    answers?: Record<string, unknown>
    candidate?: Record<string, unknown>
  } = {},
): void {
  writeJson(join(workspace, 'pack.json'), overrides.pack ?? validNoQuestionPack())
  writeJson(join(workspace, 'answers.json'), overrides.answers ?? validNoQuestionAnswers())
  writeJson(join(workspace, 'candidate.json'), overrides.candidate ?? validRequestIrCandidate())
}

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
    questionCount: 1,
    plannedQuestions: [
      {
        questionId: 'clarify-target-component',
        mapsToRequestIrField: 'targetComponentCandidate',
        prompt: 'Which component should this request target?',
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
    sourceRequestIrCandidate: 'candidate.json',
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
