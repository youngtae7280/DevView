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

describe('DevView Hook session manifest preview CLI', () => {
  it('writes advisory session manifest JSON and Markdown', async () => {
    const workspace = createWorkspace()
    writeManifestInputs(workspace)

    const result = await runDevViewCli(
      [...baseArgs(), '--output', '.tmp/session.json', '--markdown', '.tmp/session.md'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )

    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/session.json'), 'utf8'))
    const markdown = readFileSync(join(workspace, '.tmp/session.md'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.artifactRole).toBe('devview-hook-session-manifest-preview')
    expect(payload.status).toBe('devview-hook-session-manifest-preview-generated')
    expect(payload.sessionStatus).toBe('not-started-preview-only')
    expect(payload.hooksActive).toBe(false)
    expect(payload.hookScriptsInstalled).toBe(false)
    expect(payload.strictModeEnabled).toBe(false)
    expect(payload.codexExecutionTriggered).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.bypassDetectionStatus).toBe('preview-only-non-enforcing')
    expect(payload.hookEventReadiness).toHaveLength(5)
    expect(written.artifactRole).toBe('devview-hook-session-manifest-preview')
    expect(markdown).toContain('Session status: not-started-preview-only')
  })

  it('blocks wrong input role/status', async () => {
    const workspace = createWorkspace()
    writeManifestInputs(workspace, { userPromptContext: { artifactRole: 'wrong-role', status: 'wrong-status' } })

    const result = await runDevViewCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'HOOK_SESSION_MANIFEST_INPUT_PREREQUISITE_MISMATCH',
    )
  })

  it('blocks missing hook event in template preview', async () => {
    const workspace = createWorkspace()
    writeManifestInputs(workspace, {
      scriptTemplates: {
        materializedTemplates: hookEvents()
          .filter((event) => event !== 'Stop')
          .map((hookEvent) => ({ hookEvent })),
      },
    })

    const result = await runDevViewCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'HOOK_SESSION_MANIFEST_MISSING_HOOK_EVENT',
    )
  })

  it('blocks unsafe authority signals', async () => {
    const workspace = createWorkspace()
    writeManifestInputs(workspace, {
      scriptScaffold: { strictModeEnabled: true },
      scriptTemplates: { hooksActive: true },
    })

    const result = await runDevViewCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'HOOK_SESSION_MANIFEST_UNSAFE_AUTHORITY_SIGNAL',
    )
  })

  it('blocks active hook output path and unsafe Markdown before JSON write', async () => {
    const workspace = createWorkspace()
    writeManifestInputs(workspace)
    const before = readFileSync(join(workspace, 'generated/templates.json'), 'utf8')

    const active = await runDevViewCli([...baseArgs(), '--output', '.codex/hooks/session.json'], {
      cwd: workspace,
      pluginRoot,
    })
    expect(active.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(active.stderr).issues[0].message).toContain('active hook/config location')

    const unsafeMarkdown = await runDevViewCli(
      [...baseArgs(), '--output', '.tmp/session.json', '--markdown', 'generated/templates.json'],
      { cwd: workspace, pluginRoot },
    )
    expect(unsafeMarkdown.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafeMarkdown.stderr).issues[0].message).toContain(
      'would overwrite the source Hook script template preview',
    )
    expect(existsSync(join(workspace, '.tmp/session.json'))).toBe(false)
    expect(readFileSync(join(workspace, 'generated/templates.json'), 'utf8')).toBe(before)
  })
})

function baseArgs(): string[] {
  return [
    'graph',
    'read-model',
    'generate-hook-session-manifest',
    '--hook-health',
    'generated/health.json',
    '--user-prompt-context',
    'generated/context.json',
    '--script-scaffold',
    'generated/scaffold.json',
    '--script-templates',
    'generated/templates.json',
    '--json',
  ]
}

function hookEvents(): string[] {
  return ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop']
}

function writeManifestInputs(
  workspace: string,
  overrides: {
    hookHealth?: Record<string, unknown>
    userPromptContext?: Record<string, unknown>
    scriptScaffold?: Record<string, unknown>
    scriptTemplates?: Record<string, unknown>
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
    artifactRole: 'devview-hook-gateway-health-report',
    status: 'devview-hook-gateway-health-report-generated',
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
    hookGatewayActive: 'not-checked-preview-only',
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
}
