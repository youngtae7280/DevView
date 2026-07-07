import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import {
  generateClarificationInterviewPack,
  renderClarificationInterviewPackMarkdown,
} from '../core/clarification-interview-pack'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())
const allowedQuestionFields = new Set([
  'requestTypeCandidate',
  'targetRecordIdCandidate',
  'targetComponentCandidate',
  'allowedScopeIntentCandidate',
  'forbiddenScopeIntentCandidate',
  'requiredEvidenceIntentCandidate',
  'riskIntentCandidate',
])

afterEach(() => {
  cleanupWorkspaces()
})

describe('Clarification Interview pack core', () => {
  it('generates no questions for the current clear calibration candidate', () => {
    const pack = generateClarificationInterviewPack(validClarificationBoundary(), validRequestIrCandidate(), {
      boundaryPath: 'boundary.json',
      candidatePath: 'candidate.json',
    })

    expect(pack.status).toBe('clarification-interview-pack-generated')
    expect(pack.clarificationInterviewPackGenerated).toBe(true)
    expect(pack.questionPlanStatus).toBe('no-questions-required-for-current-calibration-candidate')
    expect(pack.questionCount).toBe(0)
    expect(pack.plannedQuestions).toEqual([])
    expect(pack.interviewImplemented).toBe(false)
    expect(pack.interactiveInterviewImplemented).toBe(false)
    expect(pack.llmInvoked).toBe(false)
    expect(pack.networkCallsAllowed).toBe(false)
    expect(pack.requestIrCandidateRevised).toBe(false)
    expect(pack.graphTraversalAllowed).toBe(false)
    expect(pack.graphTraversalExecuted).toBe(false)
    expect(pack.selectedGraphSliceGenerated).toBe(false)
    expect(pack.contractInputGenerated).toBe(false)
    expect(pack.instructionPackGenerated).toBe(false)
    expect(pack.codexExecutionTriggered).toBe(false)
    expect(pack.graphSourceMutated).toBe(false)
    expect(pack.graphDeltaApplied).toBe(false)
    expect(pack.approvalStatus).toBe('not-approved')
    expect(pack.runtimeEvidenceSatisfied).toBe(false)
    expect(pack.equivalenceProven).toBe(false)
    expect(pack.scopeEnforced).toBe(false)
    expect(pack.ciEnforcementEnabled).toBe(false)
  })

  it('plans bounded questions for an ambiguous candidate', () => {
    const pack = generateClarificationInterviewPack(validClarificationBoundary(), {
      ...validRequestIrCandidate(),
      requiresClarification: true,
      requestTypeCandidate: 'unknown',
      targetComponentCandidate: '',
      requiredEvidenceIntentCandidate: '',
      confidence: { score: 0.31, band: 'low' },
    })

    expect(pack.status).toBe('clarification-interview-pack-generated')
    expect(pack.questionPlanStatus).toBe('questions-planned-for-ambiguous-candidate')
    expect(pack.questionCount).toBeGreaterThan(0)
    expect(pack.questionCount).toBeLessThanOrEqual(3)
    expect(pack.plannedQuestions[0].answerAuthorityStatus).toBe('clarification-answer-not-approval')
    expect(pack.plannedQuestions.every((question) => question.freeformAllowed)).toBe(true)
    expect(pack.plannedQuestions.every((question) => allowedQuestionFields.has(question.mapsToRequestIrField))).toBe(
      true,
    )
    expect(pack.plannedQuestions.map((question) => question.mapsToRequestIrField)).not.toContain(
      'intentSummaryCandidate',
    )
    expect(pack.graphTraversalAllowed).toBe(false)
  })

  it('keeps low-confidence fallback questions inside the boundary field vocabulary', () => {
    const pack = generateClarificationInterviewPack(validClarificationBoundary(), {
      ...validRequestIrCandidate(),
      requiresClarification: false,
      confidence: { score: 0.2, band: 'low' },
    })

    expect(pack.status).toBe('clarification-interview-pack-generated')
    expect(pack.questionPlanStatus).toBe('questions-planned-for-ambiguous-candidate')
    expect(pack.questionCount).toBe(1)
    expect(pack.plannedQuestions[0].mapsToRequestIrField).toBe('requestTypeCandidate')
    expect(pack.plannedQuestions.every((question) => allowedQuestionFields.has(question.mapsToRequestIrField))).toBe(
      true,
    )
    expect(pack.graphTraversalAllowed).toBe(false)
  })

  it('blocks candidate authority escalation instead of trusting it', () => {
    const pack = generateClarificationInterviewPack(validClarificationBoundary(), {
      ...validRequestIrCandidate(),
      graphTraversalAllowed: true,
    })

    expect(pack.status).toBe('clarification-interview-pack-blocked')
    expect(pack.clarificationInterviewPackGenerated).toBe(false)
    expect(pack.questionPlanStatus).toBe('blocked')
    expect(pack.validationFindings.map((finding) => finding.field)).toContain('graphTraversalAllowed')
    expect(pack.graphTraversalAllowed).toBe(false)
    expect(pack.contractInputGenerated).toBe(false)
  })

  it('renders concise Markdown without approval or execution claims', () => {
    const pack = generateClarificationInterviewPack(validClarificationBoundary(), validRequestIrCandidate())
    const markdown = renderClarificationInterviewPackMarkdown(pack)

    expect(markdown).toContain('# Clarification Interview Pack')
    expect(markdown).toContain('No clarification questions are required')
    expect(markdown).toContain('This pack does not call an LLM or API.')
    expect(markdown).not.toContain('runtime Evidence satisfaction has been met')
    expect(markdown).not.toContain('Codex execution has been triggered')
  })
})

describe('Clarification Interview pack CLI', () => {
  it('writes explicit JSON and Markdown outputs without mutating inputs', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validClarificationBoundary())
    writeJson(join(workspace, 'candidate.json'), validRequestIrCandidate())
    writeJson(join(workspace, 'schema.json'), { artifactRole: 'request-ir-candidate-schema-preview' })
    const boundaryBefore = readFileSync(join(workspace, 'boundary.json'), 'utf8')
    const candidateBefore = readFileSync(join(workspace, 'candidate.json'), 'utf8')
    const outputPath = join('.tmp', 'clarification-interview-pack.json')
    const markdownPath = join('.tmp', 'clarification-interview-pack.md')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'generate-clarification-interview-pack',
        '--boundary',
        'boundary.json',
        '--candidate',
        'candidate.json',
        '--output',
        outputPath,
        '--markdown',
        markdownPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))
    const markdown = readFileSync(join(workspace, markdownPath), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('graph read-model generate-clarification-interview-pack')
    expect(payload.questionPlanStatus).toBe('no-questions-required-for-current-calibration-candidate')
    expect(payload.outputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(payload.markdownReport).toBe(markdownPath.replaceAll('\\', '/'))
    expect(written.artifactRole).toBe('clarification-interview-pack')
    expect(written.llmInvoked).toBe(false)
    expect(written.requestIrCandidateRevised).toBe(false)
    expect(markdown).toContain('## Question Plan')
    expect(readFileSync(join(workspace, 'boundary.json'), 'utf8')).toBe(boundaryBefore)
    expect(readFileSync(join(workspace, 'candidate.json'), 'utf8')).toBe(candidateBefore)
  })

  it('blocks wrong boundary role without generating a trusted question plan', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), { ...validClarificationBoundary(), artifactRole: 'wrong-role' })
    writeJson(join(workspace, 'candidate.json'), validRequestIrCandidate())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'generate-clarification-interview-pack',
        '--boundary',
        'boundary.json',
        '--candidate',
        'candidate.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('artifactRole')
  })

  it('blocks unreadable candidate path clearly', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validClarificationBoundary())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'generate-clarification-interview-pack',
        '--boundary',
        'boundary.json',
        '--candidate',
        'missing-candidate.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('Unable to read Request IR Candidate')
  })

  it('blocks JSON output that would overwrite the clarification boundary', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validClarificationBoundary())
    writeJson(join(workspace, 'candidate.json'), validRequestIrCandidate())
    const boundaryBefore = readFileSync(join(workspace, 'boundary.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'generate-clarification-interview-pack',
        '--boundary',
        'boundary.json',
        '--candidate',
        'candidate.json',
        '--output',
        'boundary.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source Clarification Interview boundary')
    expect(readFileSync(join(workspace, 'boundary.json'), 'utf8')).toBe(boundaryBefore)
  })

  it('blocks unsafe Markdown path before writing safe JSON output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validClarificationBoundary())
    writeJson(join(workspace, 'candidate.json'), validRequestIrCandidate())
    writeJson(join(workspace, 'schema.json'), { artifactRole: 'request-ir-candidate-schema-preview' })
    const schemaBefore = readFileSync(join(workspace, 'schema.json'), 'utf8')
    const outputPath = join('.tmp', 'clarification-interview-pack.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'generate-clarification-interview-pack',
        '--boundary',
        'boundary.json',
        '--candidate',
        'candidate.json',
        '--output',
        outputPath,
        '--markdown',
        'schema.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('Clarification Interview Pack preview markdown path is unsafe')
    expect(existsSync(join(workspace, outputPath))).toBe(false)
    expect(readFileSync(join(workspace, 'schema.json'), 'utf8')).toBe(schemaBefore)
  })
})

function validClarificationBoundary(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'clarification-interview-boundary-preview',
    status: 'clarification-interview-boundary-previewed',
    naturalLanguageRequestIntakeBoundaryArtifact: 'intake.json',
    aiRequestAnalyzerBoundaryArtifact: 'analyzer-boundary.json',
    requestIrCandidateSchemaArtifact: 'schema.json',
    interviewImplemented: false,
    interactiveUiImplemented: false,
    llmInvoked: false,
    networkCallsAllowed: false,
    requestIrCandidateRevised: false,
    clarificationQuestionsGenerated: false,
    candidateOnly: true,
    graphTraversalAllowed: false,
    graphTraversalExecuted: false,
    selectedGraphSliceGenerated: false,
    contractInputGenerated: false,
    instructionPackGenerated: false,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    clarificationTriggerPolicy: {
      triggers: [
        {
          triggerId: 'unknown-request-type',
          sourceFields: ['requestTypeCandidate'],
          result: 'clarification-required',
        },
      ],
    },
    interviewQuestionModel: {
      questionCountPerTurn: { minimum: 1, maximum: 3 },
      exampleQuestions: [
        {
          questionId: 'clarify-target-component',
          mapsToRequestIrField: 'targetComponentCandidate',
          prompt: 'Which component should this request target?',
          choices: [
            {
              label: 'Todo App',
              candidateValue: 'Todo App',
              authorityStatus: 'answer-candidate-not-validated',
            },
          ],
          freeformAllowed: true,
          answerAuthorityStatus: 'clarification-answer-not-approval',
        },
      ],
    },
    revisedRequestIrCandidateBoundary: {
      revisionAuthorityStatus: 'clarification-derived-candidate-not-validated',
      requestIrCandidateRevised: false,
      candidateOnly: true,
      graphTraversalAllowed: false,
      contractGenerationAllowed: false,
      instructionPackGenerationAllowed: false,
      validationChainRequiredAgain: [
        {
          step: 'schema-only-request-ir-validation',
          command: 'graph read-model validate-request-ir --candidate <revisedCandidatePath> --json',
        },
      ],
    },
  }
}

function validRequestIrCandidate(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'request-ir-candidate-calibration-fixture-preview',
    status: 'request-ir-candidate-calibration-fixture-previewed',
    requestIrCandidateStatus: 'candidate-only',
    sourceNaturalLanguageRequest: 'Add Todo App runtime evidence without touching production source.',
    requestText: 'Add Todo App runtime evidence without touching production source.',
    requestLanguage: 'en',
    requestTypeCandidate: 'runtime-evidence-only',
    changeTypeCandidate: 'test-only-behavior-proof',
    targetRecordIdCandidate: 'CH-001',
    targetComponentCandidate: 'Todo App',
    intentSummaryCandidate: 'Add runtime evidence for add button behavior without production source changes.',
    allowedScopeIntentCandidate: 'evidence and test report artifacts only',
    forbiddenScopeIntentCandidate: 'production source changes forbidden',
    requiredEvidenceIntentCandidate: 'runtime evidence for add button behavior',
    riskIntentCandidate: 'avoid production source changes',
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
    graphTraversalAllowed: false,
    contractGenerationAllowed: false,
    instructionPackGenerationAllowed: false,
  }
}
