import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { runPreflightSessionChainFile, type PreflightSessionStageExecutors } from '../core/preflight-session-chain'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())
const calibrationCandidatePath =
  'examples/valid/todo-app-devview-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json'

afterEach(() => {
  cleanupWorkspaces()
})

describe('Preflight session chain CLI', () => {
  it('runs the calibration candidate through instruction pack preview without Codex execution', async () => {
    const workspace = createWorkspace()
    const outputDir = join(workspace, 'preflight')
    const markdownPath = join(workspace, 'preflight-summary.md')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'run-preflight-session',
        '--candidate',
        calibrationCandidatePath,
        '--output-dir',
        outputDir,
        '--markdown',
        markdownPath,
        '--json',
      ],
      { cwd: pluginRoot, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const report = JSON.parse(readFileSync(join(outputDir, 'preflight-session-chain.json'), 'utf8'))
    const validation = JSON.parse(readFileSync(join(outputDir, 'request-ir-validation.json'), 'utf8'))
    const graphValidation = JSON.parse(readFileSync(join(outputDir, 'request-ir-graph-validation.json'), 'utf8'))
    const instructionPack = JSON.parse(readFileSync(join(outputDir, 'instruction-pack.json'), 'utf8'))
    const markdown = readFileSync(markdownPath, 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-preflight-session-chain-report')
    expect(payload.terminalStage).toBe('instruction-pack-preview-generated-no-codex-execution')
    expect(report.instructionPackGenerated).toBe(true)
    expect(report.codexExecutionTriggered).toBe(false)
    expect(report.graphSourceMutated).toBe(false)
    expect(report.graphDeltaApplied).toBe(false)
    expect(report.approvalStatus).toBe('not-approved')
    expect(report.humanDecisionRecorded).toBe(false)
    expect(report.runtimeEvidenceSatisfied).toBe(false)
    expect(report.evidenceAccepted).toBe(false)
    expect(report.equivalenceProven).toBe(false)
    expect(report.scopeEnforced).toBe(false)
    expect(report.ciEnforcementEnabled).toBe(false)
    expect(report.strictModeEnabled).toBe(false)
    expect(report.guidedEnforcementEnabled).toBe(false)
    expect(report.humanReviewRequired).toBe(true)
    expect(validation.requestIrValidationStatus).toBe('schema-valid-graph-validation-not-run')
    expect(validation.graphTraversalAllowed).toBe(false)
    expect(validation.contractGenerationAllowed).toBe(false)
    expect(validation.instructionPackGenerationAllowed).toBe(false)
    expect(graphValidation.graphValidationStatus).toBe('graph-aware-valid')
    expect(instructionPack.instructionPackGenerated).toBe(true)
    expect(instructionPack.codexExecutionTriggered).toBe(false)
    expect(markdown).toContain('DevView Preflight Session Chain')
    expect(markdown).toContain('Codex execution was not triggered')
  })

  it('stops before graph-aware validation when schema-only validation is blocked', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'candidate.json'), {
      ...calibrationCandidate(),
      graphTraversalAllowed: true,
    })

    const result = await runDevViewCli(baseArgs('candidate.json'), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)
    const report = JSON.parse(readFileSync(join(workspace, '.tmp/preflight/preflight-session-chain.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.terminalStage).toBe('schema-validation-blocked')
    expect(report.stoppedBeforeStage).toBe('graph-aware-validation')
    expect(existsSync(join(workspace, '.tmp/preflight/request-ir-validation.json'))).toBe(true)
    expect(existsSync(join(workspace, '.tmp/preflight/request-ir-graph-validation.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/preflight/instruction-pack.json'))).toBe(false)
  })

  it('stops before traversal when graph-aware validation is blocked', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'candidate.json'), calibrationCandidate())

    const result = await runDevViewCli(baseArgs('candidate.json'), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)
    const report = JSON.parse(readFileSync(join(workspace, '.tmp/preflight/preflight-session-chain.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.terminalStage).toBe('graph-aware-validation-blocked')
    expect(report.stoppedBeforeStage).toBe('graph-traversal-plan')
    expect(existsSync(join(workspace, '.tmp/preflight/request-ir-validation.json'))).toBe(true)
    expect(existsSync(join(workspace, '.tmp/preflight/request-ir-graph-validation.json'))).toBe(true)
    expect(existsSync(join(workspace, '.tmp/preflight/graph-traversal-plan.json'))).toBe(false)
  })

  it('blocks unsafe output directory before writing any child output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'candidate.json'), calibrationCandidate())
    writeJson(join(workspace, 'schema.json'), {
      artifactRole: 'request-ir-candidate-schema-preview',
      status: 'request-ir-candidate-schema-previewed',
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'run-preflight-session',
        '--candidate',
        'candidate.json',
        '--output-dir',
        'schema.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('request-ir-candidate-schema-preview')
    expect(existsSync(join(workspace, 'schema.json', 'request-ir-validation.json'))).toBe(false)
    expect(existsSync(join(workspace, 'schema.json', 'preflight-session-chain.json'))).toBe(false)
  })

  it('blocks unsafe markdown path before writing any child output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'candidate.json'), calibrationCandidate())
    const candidateBefore = readFileSync(join(workspace, 'candidate.json'), 'utf8')

    const result = await runDevViewCli([...baseArgs('candidate.json'), '--markdown', 'candidate.json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('source Request IR Candidate')
    expect(readFileSync(join(workspace, 'candidate.json'), 'utf8')).toBe(candidateBefore)
    expect(existsSync(join(workspace, '.tmp/preflight/request-ir-validation.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/preflight/preflight-session-chain.json'))).toBe(false)
  })
})

describe('Preflight session chain stage terminal reporting', () => {
  it.each([
    ['graph-traversal-plan', 'graph-traversal-plan-blocked', 'selected-graph-slice'],
    ['selected-graph-slice', 'selected-graph-slice-blocked', 'contract-compiler-input'],
    ['contract-compiler-input', 'contract-compiler-input-blocked', 'instruction-pack'],
    ['instruction-pack', 'instruction-pack-blocked', null],
  ] as const)('reports %s as a blocked terminal stage', async (blockStage, terminalStage, stoppedBeforeStage) => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'candidate.json'), calibrationCandidate())

    const result = await runPreflightSessionChainFile(
      workspace,
      {
        candidate: 'candidate.json',
        outputDir: '.tmp/preflight',
      },
      fakeExecutors(blockStage),
    )

    expect(result.report.status).toBe('devview-preflight-session-chain-report-blocked')
    expect(result.report.terminalStage).toBe(terminalStage)
    expect(result.report.stoppedBeforeStage).toBe(stoppedBeforeStage)
    expect(result.report.codexExecutionTriggered).toBe(false)
    expect(result.report.graphSourceMutated).toBe(false)
    expect(result.report.graphDeltaApplied).toBe(false)
    expect(result.report.runtimeEvidenceSatisfied).toBe(false)
    expect(result.report.evidenceAccepted).toBe(false)
    expect(result.report.equivalenceProven).toBe(false)
    expect(result.report.scopeEnforced).toBe(false)
    expect(result.report.ciEnforcementEnabled).toBe(false)
  })
})

function baseArgs(candidate: string): string[] {
  return [
    'graph',
    'read-model',
    'run-preflight-session',
    '--candidate',
    candidate,
    '--output-dir',
    '.tmp/preflight',
    '--json',
  ]
}

function calibrationCandidate(): Record<string, unknown> {
  return JSON.parse(readFileSync(join(pluginRoot, calibrationCandidatePath), 'utf8')) as Record<string, unknown>
}

function fakeExecutors(blockStage: string): PreflightSessionStageExecutors {
  const writeResult = async <T extends Record<string, unknown>>(root: string, output: string | undefined, value: T) => {
    if (output) {
      writeJson(join(root, output), value)
    }
    return value
  }
  const finding = (stage: string) => [
    {
      code: `TEST_${stage.toUpperCase().replaceAll('-', '_')}_BLOCKED`,
      severity: 'error',
      message: `${stage} blocked for terminal-stage reporting.`,
    },
  ]
  return {
    validateRequestIrCandidateFile: async (root, _candidate, options = {}) => ({
      result: await writeResult(root, options.output, {
        artifactRole: 'request-ir-candidate-schema-only-validation',
        status: 'request-ir-candidate-schema-only-validation-complete',
        schemaValidationStatus: 'schema-valid',
        requestIrValidationStatus: 'schema-valid-graph-validation-not-run',
        graphTraversalAllowed: false,
        contractGenerationAllowed: false,
        instructionPackGenerationAllowed: false,
        validationFindings: [],
      }),
      outputPath: options.output,
    }),
    validateRequestIrGraphAwareFile: async (root, _candidate, _schemaValidation, options = {}) => ({
      result: await writeResult(root, options.output, {
        artifactRole: 'request-ir-graph-aware-validation',
        status: 'request-ir-graph-aware-validation-complete',
        graphValidationStatus: 'graph-aware-valid',
        graphTraversalAllowed: true,
        selectedGraphSliceGenerated: false,
        contractInputGenerated: false,
        instructionPackGenerated: false,
        graphSourceMutated: false,
        graphDeltaApplied: false,
        runtimeEvidenceSatisfied: false,
        evidenceAccepted: false,
        equivalenceProven: false,
        scopeEnforced: false,
        ciEnforcementEnabled: false,
        validationFindings: [],
      }),
      outputPath: options.output,
    }),
    generateGraphTraversalPlanFile: async (root, _graphValidation, options = {}) => {
      const blocked = blockStage === 'graph-traversal-plan'
      return {
        result: await writeResult(root, options.output, {
          artifactRole: 'graph-traversal-plan',
          status: blocked ? 'graph-traversal-plan-blocked' : 'graph-traversal-plan-generated',
          graphTraversalPlanGenerated: !blocked,
          graphTraversalPlanStatus: blocked ? 'blocked' : 'ready',
          selectedGraphSliceGenerated: false,
          contractInputGenerated: false,
          instructionPackGenerated: false,
          graphSourceMutated: false,
          graphDeltaApplied: false,
          runtimeEvidenceSatisfied: false,
          evidenceAccepted: false,
          equivalenceProven: false,
          scopeEnforced: false,
          ciEnforcementEnabled: false,
          validationFindings: blocked ? finding(blockStage) : [],
        }),
        outputPath: options.output,
      }
    },
    generateSelectedGraphSliceFile: async (root, _traversalPlan, options = {}) => {
      const blocked = blockStage === 'selected-graph-slice'
      return {
        result: await writeResult(root, options.output, {
          artifactRole: 'selected-graph-slice',
          status: blocked ? 'selected-graph-slice-blocked' : 'selected-graph-slice-generated',
          selectedGraphSliceGenerated: !blocked,
          selectedGraphSliceStatus: blocked ? 'blocked' : 'generated',
          contractInputGenerated: false,
          instructionPackGenerated: false,
          graphSourceMutated: false,
          graphDeltaApplied: false,
          runtimeEvidenceSatisfied: false,
          evidenceAccepted: false,
          equivalenceProven: false,
          scopeEnforced: false,
          ciEnforcementEnabled: false,
          validationFindings: blocked ? finding(blockStage) : [],
        }),
        outputPath: options.output,
      }
    },
    generateContractCompilerInputFile: async (root, _selectedSlice, options = {}) => {
      const blocked = blockStage === 'contract-compiler-input'
      return {
        result: await writeResult(root, options.output, {
          artifactRole: 'contract-compiler-input',
          status: blocked ? 'contract-compiler-input-blocked' : 'contract-compiler-input-generated',
          contractInputGenerated: !blocked,
          instructionPackGenerated: false,
          graphSourceMutated: false,
          graphDeltaApplied: false,
          runtimeEvidenceSatisfied: false,
          evidenceAccepted: false,
          equivalenceProven: false,
          scopeEnforced: false,
          ciEnforcementEnabled: false,
          validationFindings: blocked ? finding(blockStage) : [],
        }),
        outputPath: options.output,
      }
    },
    generateInstructionPackFile: async (root, _contractInput, options = {}) => {
      const blocked = blockStage === 'instruction-pack'
      return {
        pack: await writeResult(root, options.output, {
          artifactRole: 'instruction-pack',
          status: blocked ? 'instruction-pack-blocked' : 'instruction-pack-generated',
          instructionPackGenerated: !blocked,
          codexExecutionTriggered: false,
          graphSourceMutated: false,
          graphDeltaApplied: false,
          runtimeEvidenceSatisfied: false,
          evidenceAccepted: false,
          equivalenceProven: false,
          scopeEnforced: false,
          ciEnforcementEnabled: false,
          validationFindings: blocked ? finding(blockStage) : [],
        }),
        outputPath: options.output,
      }
    },
  }
}
