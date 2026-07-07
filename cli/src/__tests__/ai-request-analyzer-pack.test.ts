import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { generateAiRequestAnalyzerPack, renderAiRequestAnalyzerPackMarkdown } from '../core/ai-request-analyzer-pack'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('AI Request Analyzer pack core', () => {
  it('generates a prompt/input contract pack without LLM or candidate generation', () => {
    const result = generateAiRequestAnalyzerPack(validAnalyzerBoundary(), validRequestIrSchema(), {
      analyzerBoundaryPath: 'boundary.json',
      schemaPath: 'schema.json',
    })

    expect(result.status).toBe('ai-request-analyzer-pack-generated')
    expect(result.analyzerPackGenerated).toBe(true)
    expect(result.llmInvoked).toBe(false)
    expect(result.networkCallsAllowed).toBe(false)
    expect(result.requestIrCandidateGenerated).toBe(false)
    expect(result.candidateOnly).toBe(true)
    expect(result.candidateAuthorityStatus).toBe('ai-generated-candidate-not-validated')
    expect(result.expectedOutputArtifactRole).toBe('request-ir-candidate')
    expect(result.requiredOutputFields).toContain('requestText')
    expect(result.requestTypeTaxonomy.allowedValues as string[]).toContain('runtime-evidence-only')
    expect(result.graphTraversalExecuted).toBe(false)
    expect(result.selectedGraphSliceGenerated).toBe(false)
    expect(result.contractInputGenerated).toBe(false)
    expect(result.instructionPackGenerated).toBe(false)
    expect(result.codexExecutionTriggered).toBe(false)
    expect(result.graphSourceMutated).toBe(false)
    expect(result.graphDeltaApplied).toBe(false)
    expect(result.approvalStatus).toBe('not-approved')
    expect(result.runtimeEvidenceSatisfied).toBe(false)
    expect(result.equivalenceProven).toBe(false)
    expect(result.scopeEnforced).toBe(false)
    expect(result.ciEnforcementEnabled).toBe(false)
  })

  it('blocks wrong boundary role or status', () => {
    const result = generateAiRequestAnalyzerPack(
      { ...validAnalyzerBoundary(), artifactRole: 'wrong-role', status: 'wrong-status' },
      validRequestIrSchema(),
    )

    expect(result.status).toBe('ai-request-analyzer-pack-blocked')
    expect(result.analyzerPackGenerated).toBe(false)
    expect(result.validationFindings.map((finding) => finding.field)).toEqual(
      expect.arrayContaining(['artifactRole', 'status']),
    )
    expect(result.llmInvoked).toBe(false)
  })

  it('blocks wrong schema role or status', () => {
    const result = generateAiRequestAnalyzerPack(validAnalyzerBoundary(), {
      ...validRequestIrSchema(),
      artifactRole: 'wrong-role',
      status: 'wrong-status',
    })

    expect(result.status).toBe('ai-request-analyzer-pack-blocked')
    expect(result.analyzerPackGenerated).toBe(false)
    expect(result.validationFindings.map((finding) => finding.field)).toEqual(
      expect.arrayContaining(['artifactRole', 'status']),
    )
    expect(result.requestIrCandidateGenerated).toBe(false)
  })

  it('renders concise Markdown guidance', () => {
    const pack = generateAiRequestAnalyzerPack(validAnalyzerBoundary(), validRequestIrSchema())
    const markdown = renderAiRequestAnalyzerPackMarkdown(pack)

    expect(markdown).toContain('# AI Request Analyzer Prompt Pack')
    expect(markdown).toContain('Produce Request IR Candidate JSON only')
    expect(markdown).toContain('graphTraversalAllowed')
    expect(markdown).toContain('This pack does not call an LLM or API.')
    expect(markdown).not.toContain('runtime Evidence satisfaction has been met')
  })
})

describe('AI Request Analyzer pack CLI', () => {
  it('writes explicit JSON and Markdown outputs without mutating inputs', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validAnalyzerBoundary())
    writeJson(join(workspace, 'schema.json'), validRequestIrSchema())
    const boundaryBefore = readFileSync(join(workspace, 'boundary.json'), 'utf8')
    const schemaBefore = readFileSync(join(workspace, 'schema.json'), 'utf8')
    const outputPath = join('.tmp', 'ai-request-analyzer-pack.json')
    const markdownPath = join('.tmp', 'ai-request-analyzer-pack.md')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'generate-ai-request-analyzer-pack',
        '--boundary',
        'boundary.json',
        '--schema',
        'schema.json',
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
    expect(payload.command).toBe('graph read-model generate-ai-request-analyzer-pack')
    expect(payload.outputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(payload.markdownReport).toBe(markdownPath.replaceAll('\\', '/'))
    expect(payload.llmInvoked).toBe(false)
    expect(payload.requestIrCandidateGenerated).toBe(false)
    expect(written.artifactRole).toBe('ai-request-analyzer-pack')
    expect(markdown).toContain('## Required Output Fields')
    expect(readFileSync(join(workspace, 'boundary.json'), 'utf8')).toBe(boundaryBefore)
    expect(readFileSync(join(workspace, 'schema.json'), 'utf8')).toBe(schemaBefore)
  })

  it('blocks JSON output that would overwrite the analyzer boundary', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validAnalyzerBoundary())
    writeJson(join(workspace, 'schema.json'), validRequestIrSchema())
    const boundaryBefore = readFileSync(join(workspace, 'boundary.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'generate-ai-request-analyzer-pack',
        '--boundary',
        'boundary.json',
        '--schema',
        'schema.json',
        '--output',
        'boundary.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source AI Request Analyzer boundary')
    expect(readFileSync(join(workspace, 'boundary.json'), 'utf8')).toBe(boundaryBefore)
  })

  it('blocks unsafe Markdown path before writing safe JSON output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validAnalyzerBoundary())
    writeJson(join(workspace, 'schema.json'), validRequestIrSchema())
    const schemaBefore = readFileSync(join(workspace, 'schema.json'), 'utf8')
    const outputPath = join('.tmp', 'ai-request-analyzer-pack.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'generate-ai-request-analyzer-pack',
        '--boundary',
        'boundary.json',
        '--schema',
        'schema.json',
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
    expect(payload.issues[0].message).toContain('would overwrite the source Request IR Candidate schema')
    expect(existsSync(join(workspace, outputPath))).toBe(false)
    expect(readFileSync(join(workspace, 'schema.json'), 'utf8')).toBe(schemaBefore)
  })
})

function validAnalyzerBoundary(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'ai-request-analyzer-boundary',
    status: 'ai-request-analyzer-boundary-previewed',
    analyzerImplemented: false,
    llmInvoked: false,
    networkCallsAllowed: false,
    runtimeAiCallsAllowed: false,
    requestIrCandidateGenerated: false,
    candidateOnly: true,
    candidateAuthorityStatus: 'ai-generated-candidate-not-validated',
    requestIrAuthorityStatus: 'not-authoritative-until-validated',
    expectedOutputArtifactRole: 'request-ir-candidate',
    expectedOutputSchemaId: 'devview-request-ir-candidate-v0-preview',
    expectedOutputSchemaArtifact: 'schema.json',
    calibrationCandidateFixtureArtifact: 'candidate.json',
    inputContract: {
      rawNaturalLanguageRequest: {
        required: true,
        example: 'Add Todo App runtime evidence without touching production source.',
      },
    },
    outputContract: {
      requiredBoundaryFields: {
        requestIrCandidateStatus: 'candidate-only',
        candidateOnly: true,
        authorityStatus: 'not-authoritative-until-validated',
        graphTraversalAllowed: false,
        contractGenerationAllowed: false,
        instructionPackGenerationAllowed: false,
      },
      allowedRequestTypes: ['runtime-evidence-only', 'unknown'],
    },
    validationChainRequiredBeforeTraversal: [
      {
        step: 'schema-only-request-ir-validation',
        command: 'graph read-model validate-request-ir --candidate <candidatePath> --json',
      },
    ],
    forbiddenUse: ['trigger Codex execution', 'mutate graph-source'],
  }
}

function validRequestIrSchema(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'request-ir-candidate-schema-preview',
    status: 'request-ir-candidate-schema-previewed',
    schemaId: 'devview-request-ir-candidate-v0-preview',
    requestIrCandidateStatus: 'candidate-only',
    candidateOnly: true,
    authorityStatus: 'not-authoritative-until-validated',
    validatedRequestIr: false,
    graphTraversalAllowed: false,
    contractGenerationAllowed: false,
    instructionPackGenerationAllowed: false,
    aiClassifierImplemented: false,
    llmCallsIntroduced: false,
    requiredFields: [
      'schemaId',
      'requestIrCandidateStatus',
      'sourceNaturalLanguageRequest',
      'requestText',
      'requestLanguage',
      'requestTypeCandidate',
      'changeTypeCandidate',
      'targetRecordIdCandidate',
      'targetComponentCandidate',
      'intentSummaryCandidate',
      'allowedScopeIntentCandidate',
      'forbiddenScopeIntentCandidate',
      'requiredEvidenceIntentCandidate',
      'riskIntentCandidate',
      'confidence',
      'ambiguities',
      'requiresClarification',
      'humanReviewRequired',
      'candidateOnly',
      'authorityStatus',
      'graphTraversalAllowed',
      'contractGenerationAllowed',
      'instructionPackGenerationAllowed',
    ],
    fieldDefinitions: {
      requestText: { type: 'string', required: true, authorityStatus: 'raw-request-text-not-compiler-authority' },
    },
    requestTypeTaxonomy: {
      taxonomyStatus: 'narrow-initial-enum-previewed',
      allowedValues: ['runtime-evidence-only', 'behavior-change', 'unknown'],
      arbitraryRequestTypesAllowed: false,
      unknownHandling: 'clarification-required',
    },
    confidenceAndAmbiguityPolicy: {
      lowConfidenceHandling: 'requires clarification or human review',
    },
  }
}
