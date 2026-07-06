import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runPbeCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson, writeText } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())
const promptText = 'Add Todo App runtime evidence for the add button behavior without touching production source.'

afterEach(() => {
  cleanupWorkspaces()
})

describe('UserPromptSubmit advisory report CLI', () => {
  it('writes advisory JSON and Markdown context from a valid preflight session', async () => {
    const workspace = createWorkspace()
    writeAdvisoryInputs(workspace)

    const result = await runPbeCli(baseArgs(workspace), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)
    const report = JSON.parse(readFileSync(join(workspace, '.tmp/advisory.json'), 'utf8'))
    const markdown = readFileSync(join(workspace, '.tmp/advisory.md'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.artifactRole).toBe('devview-user-prompt-submit-advisory-report')
    expect(payload.status).toBe('user-prompt-submit-advisory-generated')
    expect(payload.advisoryContextStatus).toBe('ready-from-preflight')
    expect(payload.additionalContextInjectionReady).toBe(true)
    expect(report.additionalContextMarkdownPath).toBe('.tmp/advisory.md')
    expect(report.instructionPackSummary.sourceInstructionPack).toBe('generated/instruction-pack.json')
    expect(report.strictModeEnabled).toBe(false)
    expect(report.guidedEnforcementEnabled).toBe(false)
    expect(report.codexExecutionTriggered).toBe(false)
    expect(report.toolBlockingEnabled).toBe(false)
    expect(report.preToolUseBlockingEnabled).toBe(false)
    expect(report.postToolUseBlockingEnabled).toBe(false)
    expect(report.approvalStatus).toBe('not-approved')
    expect(report.runtimeEvidenceSatisfied).toBe(false)
    expect(report.evidenceAccepted).toBe(false)
    expect(report.equivalenceProven).toBe(false)
    expect(report.scopeEnforced).toBe(false)
    expect(report.ciEnforcementEnabled).toBe(false)
    expect(markdown).toContain('DevView UserPromptSubmit Advisory')
    expect(markdown).toContain('Allowed Scope')
    expect(markdown).toContain('Forbidden Scope And Non-goals')
    expect(markdown).toContain('Do not treat this advisory context as approval.')
  })

  it('reports missing preflight without running provider, validation, traversal, or blocking', async () => {
    const workspace = createWorkspace()
    writeAdvisoryInputs(workspace)

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'report-user-prompt-submit-advisory',
        '--prompt',
        promptText,
        '--hook-health',
        'generated/hook-health.json',
        '--candidate',
        'generated/candidate.json',
        '--output',
        '.tmp/missing.json',
        '--markdown',
        '.tmp/missing.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const report = JSON.parse(readFileSync(join(workspace, '.tmp/missing.json'), 'utf8'))
    const markdown = readFileSync(join(workspace, '.tmp/missing.md'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('user-prompt-submit-advisory-missing-preflight')
    expect(report.additionalContextInjectionReady).toBe(false)
    expect(report.nextRequiredCommand).toContain('run-preflight-session')
    expect(report.nextRequiredCommand).toContain('generated/candidate.json')
    expect(report.validationChain).toEqual([])
    expect(report.codexExecutionTriggered).toBe(false)
    expect(report.toolBlockingEnabled).toBe(false)
    expect(report.runtimeEvidenceSatisfied).toBe(false)
    expect(markdown).toContain('Next required command')
    expect(existsSync(join(workspace, '.tmp/devview-preflight'))).toBe(false)
  })

  it('reports blocked preflight terminal stage and keeps context injection disabled', async () => {
    const workspace = createWorkspace()
    writeAdvisoryInputs(workspace, {
      preflight: {
        status: 'devview-preflight-session-chain-report-blocked',
        terminalStage: 'schema-validation-blocked',
        stoppedBeforeStage: 'graph-aware-validation',
        instructionPackGenerated: false,
        validationFindings: [
          {
            code: 'REQUEST_IR_CANDIDATE_SCHEMA_BLOCKED',
            severity: 'error',
            stage: 'schema-validation',
            message: 'Schema validation blocked.',
          },
        ],
      },
    })

    const result = await runPbeCli(baseArgs(workspace), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)
    const report = JSON.parse(readFileSync(join(workspace, '.tmp/advisory.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('user-prompt-submit-advisory-blocked-preflight')
    expect(report.preflightTerminalStage).toBe('schema-validation-blocked')
    expect(report.preflightFindingsSummary.errors).toBe(1)
    expect(report.additionalContextInjectionReady).toBe(false)
    expect(report.nextRequiredCommand).toContain('run-preflight-session')
    expect(report.instructionPackSummary.sourceInstructionPack).toBeNull()
  })

  it('writes a no-op report when DevView is off', async () => {
    const workspace = createWorkspace()
    writeAdvisoryInputs(workspace)

    const result = await runPbeCli([...baseArgs(workspace), '--devview-mode', 'off'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('user-prompt-submit-advisory-noop-devview-off')
    expect(payload.devviewMode).toBe('off')
    expect(payload.additionalContextInjectionReady).toBe(false)
    expect(payload.codexExecutionTriggered).toBe(false)
    expect(payload.toolBlockingEnabled).toBe(false)
  })

  it('keeps guided mode report-only and non-blocking', async () => {
    const workspace = createWorkspace()
    writeAdvisoryInputs(workspace)

    const result = await runPbeCli([...baseArgs(workspace), '--devview-mode', 'guided'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.devviewMode).toBe('guided')
    expect(payload.guidedModeRequested).toBe(true)
    expect(payload.guidedEnforcementEnabled).toBe(false)
    expect(payload.toolBlockingEnabled).toBe(false)
    expect(payload.preToolUseBlockingEnabled).toBe(false)
  })

  it('keeps strict-disabled mode non-enforcing', async () => {
    const workspace = createWorkspace()
    writeAdvisoryInputs(workspace)

    const result = await runPbeCli([...baseArgs(workspace), '--devview-mode', 'strict-disabled'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.devviewMode).toBe('strict-disabled')
    expect(payload.strictModeEnabled).toBe(false)
    expect(payload.toolBlockingEnabled).toBe(false)
    expect(payload.additionalContextInjectionReady).toBe(true)
  })

  it('rejects protected output paths before writing JSON or Markdown', async () => {
    const workspace = createWorkspace()
    writeAdvisoryInputs(workspace)

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'report-user-prompt-submit-advisory',
        '--prompt',
        promptText,
        '--hook-health',
        'generated/hook-health.json',
        '--preflight-session',
        'generated/preflight.json',
        '--output',
        '.tmp/unsafe.json',
        '--markdown',
        'generated/instruction-pack.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('USER_PROMPT_SUBMIT_ADVISORY_FAILED')
    expect(existsSync(join(workspace, '.tmp/unsafe.json'))).toBe(false)
  })

  it('rejects prompt-file, preflight, hook source, and same output path overwrites', async () => {
    const workspace = createWorkspace()
    writeAdvisoryInputs(workspace)

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'report-user-prompt-submit-advisory',
        '--prompt-file',
        'generated/prompt.txt',
        '--hook-health',
        'generated/hook-health.json',
        '--preflight-session',
        'generated/preflight.json',
        '--output',
        '.tmp/same.json',
        '--markdown',
        '.tmp/same.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.message).toContain('could not run')
    expect(existsSync(join(workspace, '.tmp/same.json'))).toBe(false)
  })
})

function baseArgs(_workspace: string): string[] {
  return [
    'graph',
    'read-model',
    'report-user-prompt-submit-advisory',
    '--prompt',
    promptText,
    '--hook-health',
    'generated/hook-health.json',
    '--preflight-session',
    'generated/preflight.json',
    '--output',
    '.tmp/advisory.json',
    '--markdown',
    '.tmp/advisory.md',
    '--json',
  ]
}

function writeAdvisoryInputs(
  workspace: string,
  overrides: {
    preflight?: Record<string, unknown>
  } = {},
): void {
  writeText(join(workspace, 'generated/prompt.txt'), promptText)
  writeJson(join(workspace, 'generated/hook-health.json'), hookHealth())
  writeJson(join(workspace, 'generated/candidate.json'), {
    artifactRole: 'request-ir-candidate',
    requestIrCandidateStatus: 'candidate-only',
    graphTraversalAllowed: false,
    contractGenerationAllowed: false,
    instructionPackGenerationAllowed: false,
  })
  writeJson(join(workspace, 'generated/preflight.json'), {
    ...preflight(),
    ...(overrides.preflight ?? {}),
  })
  writeJson(join(workspace, 'generated/instruction-pack.json'), instructionPack())
  writeText(join(workspace, 'generated/instruction-pack.md'), '# Instruction Pack\n\nUse advisory context only.\n')
}

function hookHealth(): Record<string, unknown> {
  return {
    artifactRole: 'devview-hook-gateway-health-boundary-preview',
    status: 'devview-hook-gateway-health-boundary-previewed',
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    actualBlockingHookBehaviorImplemented: false,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function preflight(): Record<string, unknown> {
  return {
    artifactRole: 'devview-preflight-session-chain-report',
    status: 'devview-preflight-session-chain-report-generated',
    sourceRequestIrCandidate: 'generated/candidate.json',
    terminalStage: 'instruction-pack-preview-generated-no-codex-execution',
    stageArtifacts: {
      instructionPack: 'generated/instruction-pack.json',
      instructionMarkdown: 'generated/instruction-pack.md',
    },
    stages: [],
    validationFindings: [
      {
        code: 'PREFLIGHT_WARNING',
        severity: 'warning',
        message: 'Preview warning.',
      },
    ],
    instructionPackGenerated: true,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
  }
}

function instructionPack(): Record<string, unknown> {
  return {
    artifactRole: 'instruction-pack',
    status: 'instruction-pack-generated',
    instructionPackGenerated: true,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    taskSummary: 'Add runtime evidence for the add button behavior.',
    allowedScope: [
      {
        id: 'allowed-test',
        paths: ['examples/valid/todo-app-pbe-run/.pbe/tree/test-tree.json'],
      },
    ],
    forbiddenScope: [
      {
        id: 'forbidden-source',
        paths: ['src/todo.ts'],
      },
    ],
    requiredEvidence: [
      {
        id: 'required-evidence',
        artifact: 'examples/valid/todo-app-pbe-run/.pbe/evidence/test-results/todo-add.txt',
      },
    ],
    outputRequirements: [
      {
        id: 'output-summary',
        requiredReportTarget: 'Report evidence status.',
      },
    ],
    stopConditions: [
      {
        id: 'stop-scope',
        condition: 'Stop if scope expands.',
      },
    ],
    knownRisks: [
      {
        id: 'risk-scope',
        mitigation: 'Keep the advisory boundary visible.',
      },
    ],
  }
}
