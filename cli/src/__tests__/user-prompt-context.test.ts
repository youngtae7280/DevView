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

describe('DevView UserPromptSubmit context preview CLI', () => {
  it('writes advisory JSON and Markdown additionalContext preview', async () => {
    const workspace = createWorkspace()
    writeContextInputs(workspace)

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'prepare-user-prompt-context',
        '--frontend-chain',
        'generated/frontend-chain.json',
        '--hook-health',
        'generated/hook-health.json',
        '--instruction-pack',
        'generated/instruction-pack.json',
        '--instruction-markdown',
        'generated/instruction-pack.md',
        '--output',
        '.tmp/user-prompt-context.json',
        '--markdown',
        '.tmp/user-prompt-context.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/user-prompt-context.json'), 'utf8'))
    const markdown = readFileSync(join(workspace, '.tmp/user-prompt-context.md'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.artifactRole).toBe('devview-user-prompt-submit-context-preview')
    expect(payload.status).toBe('user-prompt-submit-context-preview-generated')
    expect(payload.additionalContextInjectionReady).toBe(true)
    expect(payload.devviewMode).toBe('advisory')
    expect(payload.strictModeEnabled).toBe(false)
    expect(payload.guidedEnforcementEnabled).toBe(false)
    expect(payload.codexExecutionTriggered).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.approvalStatus).toBe('not-approved')
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(written.artifactRole).toBe('devview-user-prompt-submit-context-preview')
    expect(markdown).toContain('Mode: advisory preview')
    expect(markdown).toContain('Allowed Scope')
    expect(markdown).toContain('Validation Chain')
  })

  it('blocks wrong frontend chain role/status', async () => {
    const workspace = createWorkspace()
    writeContextInputs(workspace, {
      frontendChain: { artifactRole: 'wrong-role', status: 'wrong-status' },
    })

    const result = await runDevViewCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'USER_PROMPT_CONTEXT_INPUT_PREREQUISITE_MISMATCH',
    )
  })

  it('blocks blocked or wrong-role instruction pack input', async () => {
    const workspace = createWorkspace()
    writeContextInputs(workspace, {
      instructionPack: {
        artifactRole: 'instruction-pack',
        status: 'instruction-pack-blocked',
        instructionPackGenerated: false,
      },
    })

    const result = await runDevViewCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'USER_PROMPT_CONTEXT_INPUT_PREREQUISITE_MISMATCH',
    )
  })

  it('blocks unsafe authority signals in inputs', async () => {
    const workspace = createWorkspace()
    writeContextInputs(workspace, {
      hookHealth: { strictModeEnabled: true },
      instructionPack: { runtimeEvidenceSatisfied: true },
    })

    const result = await runDevViewCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'USER_PROMPT_CONTEXT_UNSAFE_AUTHORITY_SIGNAL',
    )
  })

  it('blocks source artifact overwrite and same output/markdown path', async () => {
    const workspace = createWorkspace()
    writeContextInputs(workspace)
    const before = readFileSync(join(workspace, 'generated/frontend-chain.json'), 'utf8')

    const overwrite = await runDevViewCli([...baseArgs(), '--output', 'generated/frontend-chain.json'], {
      cwd: workspace,
      pluginRoot,
    })
    const overwritePayload = JSON.parse(overwrite.stderr)
    expect(overwrite.exitCode).toBe(ExitCode.ValidationFailed)
    expect(overwritePayload.issues[0].message).toContain('would overwrite the source frontend chain report')
    expect(readFileSync(join(workspace, 'generated/frontend-chain.json'), 'utf8')).toBe(before)

    const samePath = await runDevViewCli(
      [...baseArgs(), '--output', '.tmp/context.json', '--markdown', '.tmp/context.json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )
    const samePathPayload = JSON.parse(samePath.stderr)
    expect(samePath.exitCode).toBe(ExitCode.ValidationFailed)
    expect(samePathPayload.issues[0].message).toContain('--output and --markdown resolve to the same path')
  })

  it('blocks unsafe Markdown output before writing safe JSON', async () => {
    const workspace = createWorkspace()
    writeContextInputs(workspace)
    const markdownBefore = readFileSync(join(workspace, 'generated/instruction-pack.md'), 'utf8')

    const result = await runDevViewCli(
      [...baseArgs(), '--output', '.tmp/context.json', '--markdown', 'generated/instruction-pack.md'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source Instruction Pack Markdown')
    expect(existsSync(join(workspace, '.tmp/context.json'))).toBe(false)
    expect(readFileSync(join(workspace, 'generated/instruction-pack.md'), 'utf8')).toBe(markdownBefore)
  })
})

function baseArgs(): string[] {
  return [
    'graph',
    'read-model',
    'prepare-user-prompt-context',
    '--frontend-chain',
    'generated/frontend-chain.json',
    '--hook-health',
    'generated/hook-health.json',
    '--instruction-pack',
    'generated/instruction-pack.json',
    '--instruction-markdown',
    'generated/instruction-pack.md',
    '--json',
  ]
}

function writeContextInputs(
  workspace: string,
  overrides: {
    frontendChain?: Record<string, unknown>
    hookHealth?: Record<string, unknown>
    instructionPack?: Record<string, unknown>
  } = {},
): void {
  writeJson(join(workspace, 'generated/frontend-chain.json'), {
    artifactRole: 'devview-frontend-chain-report',
    status: 'devview-frontend-chain-report-generated',
    terminalStage: 'instruction-pack-preview-generated-no-codex-execution',
    currentTerminalArtifact: 'generated/instruction-pack.json',
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    ...overrides.frontendChain,
  })
  writeJson(join(workspace, 'generated/hook-health.json'), {
    artifactRole: 'devview-hook-gateway-health-report',
    status: 'devview-hook-gateway-health-report-generated',
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    actualBlockingHookBehaviorImplemented: false,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    nonEnforcing: true,
    ...overrides.hookHealth,
  })
  writeJson(join(workspace, 'generated/instruction-pack.json'), {
    artifactRole: 'instruction-pack',
    status: 'instruction-pack-generated',
    instructionPackGenerated: true,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    taskSummary: 'Add Todo App runtime evidence without touching production source.',
    allowedScope: [{ id: 'allowed-scope-ev-1', paths: ['.devview/evidence/test-results/todo-add.txt'] }],
    forbiddenScope: [{ id: 'forbidden-production-source', paths: ['unresolved:production-source-changes'] }],
    requiredEvidence: [{ id: 'EV-1', artifact: '.devview/evidence/test-results/todo-add.txt' }],
    outputRequirements: [{ id: 'OR-1', requiredReportTarget: 'Report evidence status without satisfaction claim.' }],
    stopConditions: [{ id: 'STOP-1', condition: 'Stop if production source changes are required.' }],
    knownRisks: [{ id: 'IM-001', mitigation: 'Watch for scope drift.' }],
    ...overrides.instructionPack,
  })
  writeText(join(workspace, 'generated/instruction-pack.md'), '# Instruction Pack\n\nCompact pack.\n')
}
