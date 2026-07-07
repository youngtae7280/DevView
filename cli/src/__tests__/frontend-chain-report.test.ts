import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson, writeText } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('DevView frontend chain report CLI', () => {
  it('writes explicit JSON and Markdown reports for a complete frontend chain', async () => {
    const workspace = createWorkspace()
    writeFixtureChain(workspace)
    const outputPath = join('.tmp', 'frontend-chain.json')
    const markdownPath = join('.tmp', 'frontend-chain.md')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-frontend-chain',
        '--intake',
        'generated/intake.json',
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
    expect(payload.command).toBe('graph read-model report-frontend-chain')
    expect(payload.terminalStage).toBe('instruction-pack-preview-generated-no-codex-execution')
    expect(payload.codexExecutionTriggered).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.approvalStatus).toBe('not-approved')
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(written.artifactRole).toBe('devview-frontend-chain-report')
    expect(written.artifactChain.map((stage: { stage: string }) => stage.stage)).toContain('instruction-pack')
    expect(markdown).toContain('| Stage')
    expect(markdown).toContain('| Artifact')
    expect(markdown).toContain('No hook session runtime or Codex execution is triggered.')
  })

  it('blocks when a required linked artifact is missing', async () => {
    const workspace = createWorkspace()
    writeFixtureChain(workspace, { omitInstructionPack: true })

    const result = await runDevViewCli(
      ['graph', 'read-model', 'report-frontend-chain', '--intake', 'generated/intake.json', '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].code).toBe('FRONTEND_CHAIN_ARTIFACT_UNREADABLE')
    expect(payload.issues[0].message).toContain('instruction-pack')
  })

  it('blocks when a linked artifact role or status is wrong', async () => {
    const workspace = createWorkspace()
    writeFixtureChain(workspace, {
      overrides: {
        'generated/contract-input.json': {
          artifactRole: 'wrong-role',
          status: 'wrong-status',
        },
      },
    })

    const result = await runDevViewCli(
      ['graph', 'read-model', 'report-frontend-chain', '--intake', 'generated/intake.json', '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining(['FRONTEND_CHAIN_ARTIFACT_ROLE_MISMATCH', 'FRONTEND_CHAIN_ARTIFACT_STATUS_MISMATCH']),
    )
  })

  it('blocks output that would overwrite the intake boundary before writing', async () => {
    const workspace = createWorkspace()
    writeFixtureChain(workspace)
    const intakeBefore = readFileSync(join(workspace, 'generated/intake.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-frontend-chain',
        '--intake',
        'generated/intake.json',
        '--output',
        'generated/intake.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source natural-language intake boundary')
    expect(readFileSync(join(workspace, 'generated/intake.json'), 'utf8')).toBe(intakeBefore)
  })

  it('blocks unsafe Markdown output before writing safe JSON output', async () => {
    const workspace = createWorkspace()
    writeFixtureChain(workspace)
    const schemaBefore = readFileSync(join(workspace, 'generated/schema.json'), 'utf8')
    const outputPath = join('.tmp', 'frontend-chain.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-frontend-chain',
        '--intake',
        'generated/intake.json',
        '--output',
        outputPath,
        '--markdown',
        'generated/schema.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite')
    expect(payload.issues[0].message).toContain('generated/schema.json')
    expect(existsSync(join(workspace, outputPath))).toBe(false)
    expect(readFileSync(join(workspace, 'generated/schema.json'), 'utf8')).toBe(schemaBefore)
  })
})

function writeFixtureChain(
  workspace: string,
  options: {
    omitInstructionPack?: boolean
    overrides?: Record<string, Record<string, unknown>>
  } = {},
): void {
  const paths = {
    intake: 'generated/intake.json',
    analyzerBoundary: 'generated/ai-boundary.json',
    analyzerPack: 'generated/ai-pack.json',
    schema: 'generated/schema.json',
    candidate: 'generated/candidate.json',
    schemaValidation: 'generated/schema-validation.json',
    graphValidation: 'generated/graph-validation.json',
    traversalPlan: 'generated/traversal-plan.json',
    selectedSlice: 'generated/selected-slice.json',
    contractInput: 'generated/contract-input.json',
    instructionPack: 'generated/instruction-pack.json',
    instructionPackMarkdown: 'generated/instruction-pack.md',
  }
  writeJson(join(workspace, paths.intake), {
    artifactRole: 'natural-language-request-intake-boundary-preview',
    status: 'natural-language-request-intake-boundary-previewed',
    aiRequestAnalyzerBoundaryArtifact: paths.analyzerBoundary,
    aiRequestAnalyzerPackArtifact: paths.analyzerPack,
    requestIrCandidateSchemaArtifact: paths.schema,
    firstCalibrationRequestIrCandidateArtifact: paths.candidate,
    requestIrSchemaOnlyValidationResultArtifact: paths.schemaValidation,
    requestIrGraphAwareValidationResultArtifact: paths.graphValidation,
    firstCalibrationGraphTraversalPlanArtifact: paths.traversalPlan,
    firstCalibrationSelectedGraphSliceArtifact: paths.selectedSlice,
    firstCalibrationContractCompilerInputArtifact: paths.contractInput,
    firstCalibrationInstructionPackArtifact: paths.instructionPack,
    firstCalibrationInstructionPackMarkdownArtifact: paths.instructionPackMarkdown,
  })

  const artifacts: Record<string, Record<string, unknown>> = {
    [paths.analyzerBoundary]: {
      artifactRole: 'ai-request-analyzer-boundary',
      status: 'ai-request-analyzer-boundary-previewed',
      analyzerImplemented: false,
    },
    [paths.analyzerPack]: {
      artifactRole: 'ai-request-analyzer-pack',
      status: 'ai-request-analyzer-pack-generated',
      analyzerPackGenerated: true,
      llmInvoked: false,
    },
    [paths.schema]: {
      artifactRole: 'request-ir-candidate-schema-preview',
      status: 'request-ir-candidate-schema-previewed',
    },
    [paths.candidate]: {
      artifactRole: 'request-ir-candidate-calibration-fixture-preview',
      status: 'request-ir-candidate-calibration-fixture-previewed',
    },
    [paths.schemaValidation]: {
      artifactRole: 'request-ir-candidate-schema-only-validation',
      status: 'request-ir-candidate-schema-only-validation-complete',
    },
    [paths.graphValidation]: {
      artifactRole: 'request-ir-graph-aware-validation',
      status: 'request-ir-graph-aware-validation-complete',
      graphTraversalAllowed: true,
    },
    [paths.traversalPlan]: {
      artifactRole: 'graph-traversal-plan',
      status: 'graph-traversal-plan-generated',
      graphTraversalPlanGenerated: true,
    },
    [paths.selectedSlice]: {
      artifactRole: 'selected-graph-slice',
      status: 'selected-graph-slice-generated',
      selectedGraphSliceGenerated: true,
    },
    [paths.contractInput]: {
      artifactRole: 'contract-compiler-input',
      status: 'contract-compiler-input-generated',
      contractInputGenerated: true,
      instructionPackGenerated: false,
    },
    [paths.instructionPack]: {
      artifactRole: 'instruction-pack',
      status: 'instruction-pack-generated',
      instructionPackGenerated: true,
      codexExecutionTriggered: false,
    },
  }

  for (const [artifactPath, artifact] of Object.entries(artifacts)) {
    if (options.omitInstructionPack && artifactPath === paths.instructionPack) {
      continue
    }
    writeJson(join(workspace, artifactPath), {
      ...artifact,
      ...(options.overrides?.[artifactPath] ?? {}),
    })
  }
  writeText(join(workspace, paths.instructionPackMarkdown), '# Instruction Pack\n')
}
