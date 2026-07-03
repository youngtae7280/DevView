import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runPbeCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('DevView Hook activation preview chain report CLI', () => {
  it('writes advisory activation chain report JSON and Markdown', async () => {
    const workspace = createWorkspace()
    writeActivationInputs(workspace)

    const result = await runPbeCli(
      [...baseArgs(), '--output', '.tmp/activation.json', '--markdown', '.tmp/activation.md'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )

    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/activation.json'), 'utf8'))
    const markdown = readFileSync(join(workspace, '.tmp/activation.md'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.artifactRole).toBe('devview-hook-activation-chain-report')
    expect(payload.status).toBe('devview-hook-activation-chain-report-generated')
    expect(payload.terminalActivationStage).toBe('session-manifest-preview-generated-no-hook-activation')
    expect(payload.hooksActive).toBe(false)
    expect(payload.hookScriptsInstalled).toBe(false)
    expect(payload.actualBlockingHookBehaviorImplemented).toBe(false)
    expect(payload.codexExecutionTriggered).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.chainStages).toHaveLength(5)
    expect(payload.hookEventReadiness).toHaveLength(5)
    expect(written.artifactRole).toBe('devview-hook-activation-chain-report')
    expect(markdown).toContain('Terminal stage: session-manifest-preview-generated-no-hook-activation')
  })

  it('blocks wrong input role/status', async () => {
    const workspace = createWorkspace()
    writeActivationInputs(workspace, { userPromptContext: { artifactRole: 'wrong-role', status: 'wrong-status' } })

    const result = await runPbeCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'HOOK_ACTIVATION_CHAIN_INPUT_PREREQUISITE_MISMATCH',
    )
  })

  it('blocks session manifest source mismatch', async () => {
    const workspace = createWorkspace()
    writeActivationInputs(workspace, {
      sessionManifest: { sourceHookScriptTemplatePreview: 'generated/not-the-template.json' },
    })

    const result = await runPbeCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'HOOK_ACTIVATION_CHAIN_SESSION_SOURCE_MISMATCH',
    )
  })

  it('blocks missing or active hook readiness', async () => {
    const workspace = createWorkspace()
    writeActivationInputs(workspace, {
      sessionManifest: {
        hookEventReadiness: hookEvents()
          .filter((event) => event !== 'Stop')
          .map((hookEvent) => ({
            hookEvent,
            readinessStatus: 'preview-ready-not-active',
            hookActive: hookEvent === 'PreToolUse',
            blockingEnabled: false,
          })),
      },
    })

    const result = await runPbeCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)
    const codes = payload.issues.map((entry: { code: string }) => entry.code)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(codes).toContain('HOOK_ACTIVATION_CHAIN_MISSING_HOOK_EVENT_READINESS')
    expect(codes).toContain('HOOK_ACTIVATION_CHAIN_UNSAFE_HOOK_EVENT_READINESS')
  })

  it('blocks unsafe authority signals', async () => {
    const workspace = createWorkspace()
    writeActivationInputs(workspace, {
      scriptTemplates: { hooksActive: true },
      sessionManifest: { actualBlockingHookBehaviorImplemented: true },
    })

    const result = await runPbeCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'HOOK_ACTIVATION_CHAIN_UNSAFE_AUTHORITY_SIGNAL',
    )
  })

  it('blocks active hook output path and unsafe Markdown before JSON write', async () => {
    const workspace = createWorkspace()
    writeActivationInputs(workspace)
    const before = readFileSync(join(workspace, 'generated/session.json'), 'utf8')

    const active = await runPbeCli([...baseArgs(), '--output', '.codex/hooks/activation.json'], {
      cwd: workspace,
      pluginRoot,
    })
    expect(active.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(active.stderr).issues[0].message).toContain('active hook/config location')

    const unsafeMarkdown = await runPbeCli(
      [...baseArgs(), '--output', '.tmp/activation.json', '--markdown', 'generated/session.json'],
      { cwd: workspace, pluginRoot },
    )
    expect(unsafeMarkdown.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafeMarkdown.stderr).issues[0].message).toContain(
      'would overwrite the source Hook session manifest preview',
    )
    expect(existsSync(join(workspace, '.tmp/activation.json'))).toBe(false)
    expect(readFileSync(join(workspace, 'generated/session.json'), 'utf8')).toBe(before)
  })
})

function baseArgs(): string[] {
  return [
    'graph',
    'read-model',
    'report-hook-activation-chain',
    '--hook-health',
    'generated/health.json',
    '--user-prompt-context',
    'generated/context.json',
    '--script-scaffold',
    'generated/scaffold.json',
    '--script-templates',
    'generated/templates.json',
    '--session-manifest',
    'generated/session.json',
    '--json',
  ]
}

function hookEvents(): string[] {
  return ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop']
}

function writeActivationInputs(
  workspace: string,
  overrides: {
    hookHealth?: Record<string, unknown>
    userPromptContext?: Record<string, unknown>
    scriptScaffold?: Record<string, unknown>
    scriptTemplates?: Record<string, unknown>
    sessionManifest?: Record<string, unknown>
  } = {},
): void {
  const safe = {
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
  }
  writeJson(join(workspace, 'generated/health.json'), {
    artifactRole: 'devview-hook-gateway-health-boundary-preview',
    status: 'devview-hook-gateway-health-boundary-previewed',
    ...safe,
    ...overrides.hookHealth,
  })
  writeJson(join(workspace, 'generated/context.json'), {
    artifactRole: 'devview-user-prompt-submit-context-preview',
    status: 'user-prompt-submit-context-preview-generated',
    ...safe,
    ...overrides.userPromptContext,
  })
  writeJson(join(workspace, 'generated/scaffold.json'), {
    artifactRole: 'devview-hook-script-scaffold-preview',
    status: 'devview-hook-script-scaffold-preview-generated',
    hookScriptsInstalled: false,
    scaffoldTemplates: hookEvents().map((hookEvent) => ({ hookEvent })),
    ...safe,
    ...overrides.scriptScaffold,
  })
  writeJson(join(workspace, 'generated/templates.json'), {
    artifactRole: 'devview-hook-script-template-preview',
    status: 'devview-hook-script-template-preview-generated',
    hooksActive: false,
    hookScriptsInstalled: false,
    materializedTemplates: hookEvents().map((hookEvent) => ({ hookEvent })),
    ...safe,
    ...overrides.scriptTemplates,
  })
  writeJson(join(workspace, 'generated/session.json'), {
    artifactRole: 'devview-hook-session-manifest-preview',
    status: 'devview-hook-session-manifest-preview-generated',
    sourceHookGatewayHealth: 'generated/health.json',
    sourceUserPromptSubmitContextPreview: 'generated/context.json',
    sourceHookScriptScaffold: 'generated/scaffold.json',
    sourceHookScriptTemplatePreview: 'generated/templates.json',
    hooksActive: false,
    hookScriptsInstalled: false,
    hookEventReadiness: hookEvents().map((hookEvent) => ({
      hookEvent,
      readinessStatus: 'preview-ready-not-active',
      hookActive: false,
      blockingEnabled: false,
    })),
    ...safe,
    ...overrides.sessionManifest,
  })
}
