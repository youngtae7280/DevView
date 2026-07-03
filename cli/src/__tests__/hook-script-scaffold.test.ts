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

describe('DevView Hook script scaffold preview CLI', () => {
  it('writes preview-only hook scaffold JSON and Markdown', async () => {
    const workspace = createWorkspace()
    writeScaffoldInputs(workspace)

    const result = await runPbeCli(
      [...baseArgs(), '--output', '.tmp/scaffold.json', '--markdown', '.tmp/scaffold.md'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )

    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/scaffold.json'), 'utf8'))
    const markdown = readFileSync(join(workspace, '.tmp/scaffold.md'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.artifactRole).toBe('devview-hook-script-scaffold-preview')
    expect(payload.status).toBe('devview-hook-script-scaffold-preview-generated')
    expect(payload.hookScriptsImplemented).toBe(false)
    expect(payload.hookScriptsInstalled).toBe(false)
    expect(payload.actualInstallOrTrustMutationImplemented).toBe(false)
    expect(payload.strictModeEnabled).toBe(false)
    expect(payload.actualBlockingHookBehaviorImplemented).toBe(false)
    expect(payload.codexExecutionTriggered).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.approvalStatus).toBe('not-approved')
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(payload.scaffoldTemplates.map((entry: { hookEvent: string }) => entry.hookEvent)).toEqual([
      'SessionStart',
      'UserPromptSubmit',
      'PreToolUse',
      'PostToolUse',
      'Stop',
    ])
    expect(written.artifactRole).toBe('devview-hook-script-scaffold-preview')
    expect(markdown).toContain('Hook Script Scaffold Preview')
    expect(markdown).toContain('not installed')
  })

  it('blocks unsafe authority signals in inputs', async () => {
    const workspace = createWorkspace()
    writeScaffoldInputs(workspace, {
      installTrust: { actualInstallOrTrustMutationImplemented: true },
      userPromptContext: { runtimeEvidenceSatisfied: true },
    })

    const result = await runPbeCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'HOOK_SCRIPT_SCAFFOLD_UNSAFE_AUTHORITY_SIGNAL',
    )
  })

  it('blocks active hook output paths and same output/markdown path', async () => {
    const workspace = createWorkspace()
    writeScaffoldInputs(workspace)

    const activePath = await runPbeCli([...baseArgs(), '--output', '.codex/hooks/devview-user-prompt-submit.ps1'], {
      cwd: workspace,
      pluginRoot,
    })
    const activePayload = JSON.parse(activePath.stderr)
    expect(activePath.exitCode).toBe(ExitCode.ValidationFailed)
    expect(activePayload.issues[0].message).toContain('active hook/config location')

    const samePath = await runPbeCli(
      [...baseArgs(), '--output', '.tmp/scaffold.json', '--markdown', '.tmp/scaffold.json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )
    const samePathPayload = JSON.parse(samePath.stderr)
    expect(samePath.exitCode).toBe(ExitCode.ValidationFailed)
    expect(samePathPayload.issues[0].message).toContain('--output and --markdown resolve to the same path')
  })

  it('blocks unsafe Markdown path before writing safe JSON', async () => {
    const workspace = createWorkspace()
    writeScaffoldInputs(workspace)
    const before = readFileSync(join(workspace, 'generated/user-prompt-context.json'), 'utf8')

    const result = await runPbeCli(
      [...baseArgs(), '--output', '.tmp/scaffold.json', '--markdown', 'generated/user-prompt-context.json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source UserPromptSubmit context preview')
    expect(existsSync(join(workspace, '.tmp/scaffold.json'))).toBe(false)
    expect(readFileSync(join(workspace, 'generated/user-prompt-context.json'), 'utf8')).toBe(before)
  })
})

function baseArgs(): string[] {
  return [
    'graph',
    'read-model',
    'generate-hook-script-scaffold',
    '--boundary',
    'generated/hook-gateway-boundary.json',
    '--hook-health',
    'generated/hook-health-boundary.json',
    '--install-trust',
    'generated/hook-install-trust-boundary.json',
    '--user-prompt-context',
    'generated/user-prompt-context.json',
    '--json',
  ]
}

function writeScaffoldInputs(
  workspace: string,
  overrides: {
    boundary?: Record<string, unknown>
    health?: Record<string, unknown>
    installTrust?: Record<string, unknown>
    userPromptContext?: Record<string, unknown>
  } = {},
): void {
  writeJson(join(workspace, 'generated/hook-gateway-boundary.json'), {
    artifactRole: 'devview-codex-hook-gateway-boundary-preview',
    status: 'devview-codex-hook-gateway-boundary-previewed',
    hookScriptsImplemented: false,
    hookScriptsInstalled: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    actualBlockingHookBehaviorImplemented: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    ...overrides.boundary,
  })
  writeJson(join(workspace, 'generated/hook-health-boundary.json'), {
    artifactRole: 'devview-hook-gateway-health-boundary-preview',
    status: 'devview-hook-gateway-health-boundary-previewed',
    hookScriptsImplemented: false,
    hookScriptsInstalled: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    actualBlockingHookBehaviorImplemented: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    ...overrides.health,
  })
  writeJson(join(workspace, 'generated/hook-install-trust-boundary.json'), {
    artifactRole: 'devview-hook-install-trust-boundary-preview',
    status: 'devview-hook-install-trust-boundary-previewed',
    installTrustDecisionImplemented: false,
    actualInstallOrTrustMutationImplemented: false,
    hookScriptsImplemented: false,
    hookScriptsInstalled: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    actualBlockingHookBehaviorImplemented: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    installScopeCandidates: [{ candidateRole: 'repo-local-hook-script-candidate' }],
    trustPrerequisites: [{ id: 'explicit-user-decision-required' }],
    ...overrides.installTrust,
  })
  writeJson(join(workspace, 'generated/user-prompt-context.json'), {
    artifactRole: 'devview-user-prompt-submit-context-preview',
    status: 'user-prompt-submit-context-preview-generated',
    additionalContextInjectionReady: true,
    actualHookScriptsImplemented: false,
    actualBlockingHookBehaviorImplemented: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    ...overrides.userPromptContext,
  })
}
