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

describe('DevView Hook script template preview CLI', () => {
  it('writes materialized hook script body previews', async () => {
    const workspace = createWorkspace()
    writeScaffold(workspace)

    const result = await runDevViewCli(
      [...baseArgs(), '--output', '.tmp/templates.json', '--markdown', '.tmp/templates.md'],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/templates.json'), 'utf8'))
    const markdown = readFileSync(join(workspace, '.tmp/templates.md'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.artifactRole).toBe('devview-hook-script-template-preview')
    expect(payload.status).toBe('devview-hook-script-template-preview-generated')
    expect(payload.hookScriptsImplemented).toBe(false)
    expect(payload.hookScriptsInstalled).toBe(false)
    expect(payload.strictModeEnabled).toBe(false)
    expect(payload.codexExecutionTriggered).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.materializedTemplates).toHaveLength(5)
    expect(payload.materializedTemplates[1].hookEvent).toBe('UserPromptSubmit')
    expect(payload.materializedTemplates[1].scriptBodyLines.join('\n')).toContain('DEVVIEW_USER_PROMPT_CONTEXT_PREVIEW')
    expect(written.artifactRole).toBe('devview-hook-script-template-preview')
    expect(markdown).toContain('```powershell')
    expect(markdown).toContain('Script bodies are review artifacts only')
  })

  it('blocks wrong scaffold role/status', async () => {
    const workspace = createWorkspace()
    writeScaffold(workspace, { artifactRole: 'wrong-role', status: 'wrong-status' })

    const result = await runDevViewCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'HOOK_SCRIPT_TEMPLATE_PREVIEW_INPUT_PREREQUISITE_MISMATCH',
    )
  })

  it('blocks unsafe authority signals', async () => {
    const workspace = createWorkspace()
    writeScaffold(workspace, { strictModeEnabled: true, runtimeEvidenceSatisfied: true })

    const result = await runDevViewCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'HOOK_SCRIPT_TEMPLATE_PREVIEW_INPUT_PREREQUISITE_MISMATCH',
    )
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'HOOK_SCRIPT_TEMPLATE_PREVIEW_UNSAFE_AUTHORITY_SIGNAL',
    )
  })

  it('blocks active hook output path and same output/markdown path', async () => {
    const workspace = createWorkspace()
    writeScaffold(workspace)

    const active = await runDevViewCli([...baseArgs(), '--output', '.codex/hooks/devview-user-prompt-submit.ps1'], {
      cwd: workspace,
      pluginRoot,
    })
    const activePayload = JSON.parse(active.stderr)
    expect(active.exitCode).toBe(ExitCode.ValidationFailed)
    expect(activePayload.issues[0].message).toContain('active hook/config location')

    const same = await runDevViewCli(
      [...baseArgs(), '--output', '.tmp/templates.json', '--markdown', '.tmp/templates.json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )
    const samePayload = JSON.parse(same.stderr)
    expect(same.exitCode).toBe(ExitCode.ValidationFailed)
    expect(samePayload.issues[0].message).toContain('--output and --markdown resolve to the same path')
  })

  it('blocks unsafe Markdown path before writing safe JSON', async () => {
    const workspace = createWorkspace()
    writeScaffold(workspace)
    const before = readFileSync(join(workspace, 'generated/scaffold.json'), 'utf8')

    const result = await runDevViewCli(
      [...baseArgs(), '--output', '.tmp/templates.json', '--markdown', 'generated/scaffold.json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source Hook script scaffold preview')
    expect(existsSync(join(workspace, '.tmp/templates.json'))).toBe(false)
    expect(readFileSync(join(workspace, 'generated/scaffold.json'), 'utf8')).toBe(before)
  })
})

function baseArgs(): string[] {
  return ['graph', 'read-model', 'generate-hook-script-templates', '--scaffold', 'generated/scaffold.json', '--json']
}

function writeScaffold(workspace: string, overrides: Record<string, unknown> = {}): void {
  writeJson(join(workspace, 'generated/scaffold.json'), {
    artifactRole: 'devview-hook-script-scaffold-preview',
    status: 'devview-hook-script-scaffold-preview-generated',
    hookScriptsImplemented: false,
    hookScriptsInstalled: false,
    hookGatewayActive: 'not-checked-preview-only',
    installTrustDecisionImplemented: false,
    actualInstallOrTrustMutationImplemented: false,
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
    scaffoldTemplates: [
      { hookEvent: 'SessionStart', scriptPathCandidate: '.codex/hooks/devview-session-start.ps1' },
      { hookEvent: 'UserPromptSubmit', scriptPathCandidate: '.codex/hooks/devview-user-prompt-submit.ps1' },
      { hookEvent: 'PreToolUse', scriptPathCandidate: '.codex/hooks/devview-pre-tool-use.ps1' },
      { hookEvent: 'PostToolUse', scriptPathCandidate: '.codex/hooks/devview-post-tool-use.ps1' },
      { hookEvent: 'Stop', scriptPathCandidate: '.codex/hooks/devview-stop.ps1' },
    ],
    ...overrides,
  })
}
