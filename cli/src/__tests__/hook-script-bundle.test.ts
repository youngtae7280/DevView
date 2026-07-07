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

describe('DevView Hook script bundle materializer CLI', () => {
  it('materializes repo-local advisory hook scripts and manifest', async () => {
    const workspace = createWorkspace()
    writeBundleInputs(workspace)

    const result = await runDevViewCli(
      [...baseArgs(), '--bundle-dir', '.tmp/bundle', '--output', '.tmp/bundle.json', '--markdown', '.tmp/bundle.md'],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/bundle.json'), 'utf8'))
    const markdown = readFileSync(join(workspace, '.tmp/bundle.md'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.artifactRole).toBe('devview-hook-script-bundle-preview')
    expect(payload.status).toBe('devview-hook-script-bundle-materialized-preview')
    expect(payload.hookScriptsImplemented).toBe(false)
    expect(payload.hookScriptsInstalled).toBe(false)
    expect(payload.activeHookSessionStarted).toBe(false)
    expect(payload.strictModeEnabled).toBe(false)
    expect(payload.preToolUseBlockingEnabled).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(payload.materializedScripts).toHaveLength(5)
    expect(written.artifactRole).toBe('devview-hook-script-bundle-preview')
    expect(markdown).toContain('not installed')

    const preToolUse = readFileSync(join(workspace, '.tmp/bundle/devview-pre-tool-use.ps1'), 'utf8')
    expect(preToolUse).toContain('Non-enforcing advisory behavior only')
    expect(preToolUse).toContain('Do not block tools or enforce scope')
  })

  it('blocks unsafe authority signals without writing scripts', async () => {
    const workspace = createWorkspace()
    writeBundleInputs(workspace, { sessionManifest: { strictModeEnabled: true } })

    const result = await runDevViewCli([...baseArgs(), '--bundle-dir', '.tmp/bundle'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'HOOK_SCRIPT_BUNDLE_UNSAFE_AUTHORITY_SIGNAL',
    )
    expect(existsSync(join(workspace, '.tmp/bundle/devview-session-start.ps1'))).toBe(false)
  })

  it('blocks unsafe output and markdown targets before partial writes', async () => {
    const workspace = createWorkspace()
    writeBundleInputs(workspace)
    const before = readFileSync(join(workspace, 'generated/session.json'), 'utf8')

    const activeOutput = await runDevViewCli([...baseArgs(), '--output', '.codex/hooks/bundle.json'], {
      cwd: workspace,
      pluginRoot,
    })
    expect(activeOutput.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(activeOutput.stderr).issues[0].message).toContain('active hook/config location')

    const unsafeMarkdown = await runDevViewCli(
      [
        ...baseArgs(),
        '--bundle-dir',
        '.tmp/bundle',
        '--output',
        '.tmp/bundle.json',
        '--markdown',
        'generated/session.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    expect(unsafeMarkdown.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafeMarkdown.stderr).issues[0].message).toContain(
      'would overwrite the source Hook session manifest preview',
    )
    expect(existsSync(join(workspace, '.tmp/bundle.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/bundle/devview-session-start.ps1'))).toBe(false)
    expect(readFileSync(join(workspace, 'generated/session.json'), 'utf8')).toBe(before)
  })

  it('blocks active hook bundle directory', async () => {
    const workspace = createWorkspace()
    writeBundleInputs(workspace)

    const result = await runDevViewCli([...baseArgs(), '--bundle-dir', '.codex/hooks'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('--bundle-dir is unsafe')
    expect(existsSync(join(workspace, '.codex/hooks/devview-session-start.ps1'))).toBe(false)
  })
})

function baseArgs(): string[] {
  return [
    'graph',
    'read-model',
    'materialize-hook-script-bundle',
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

function scriptName(event: string): string {
  return `devview-${event.replace(/[A-Z]/g, (match, index) => `${index === 0 ? '' : '-'}${match.toLowerCase()}`)}.ps1`
}

function writeBundleInputs(
  workspace: string,
  overrides: {
    scriptTemplates?: Record<string, unknown>
    sessionManifest?: Record<string, unknown>
  } = {},
): void {
  const safe = {
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    actualBlockingHookBehaviorImplemented: false,
    preToolUseBlockingEnabled: false,
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
    requiredChecksConfigured: false,
    branchProtectionChanged: false,
    diffRejectionEnabled: false,
  }
  writeJson(join(workspace, 'generated/templates.json'), {
    artifactRole: 'devview-hook-script-template-preview',
    status: 'devview-hook-script-template-preview-generated',
    hooksActive: false,
    hookScriptsImplemented: false,
    hookScriptsInstalled: false,
    materializedTemplates: hookEvents().map((hookEvent) => ({
      hookEvent,
      candidateFileName: scriptName(hookEvent),
      sourceScriptPathCandidate: `.codex/hooks/${scriptName(hookEvent)}`,
      scriptBodyLines: [
        '# DevView hook template preview only.',
        '# Not installed. Not active. Non-enforcing advisory behavior only.',
        '$strictModeEnabled = $false',
        '$guidedEnforcementEnabled = $false',
        '$blockingEnabled = $false',
        hookEvent === 'PreToolUse'
          ? '# Do not block tools or enforce scope in this preview.'
          : '# Do not install hooks or mutate graph-source in this preview.',
        'exit 0',
      ],
    })),
    ...safe,
    ...overrides.scriptTemplates,
  })
  writeJson(join(workspace, 'generated/session.json'), {
    artifactRole: 'devview-hook-session-manifest-preview',
    status: 'devview-hook-session-manifest-preview-generated',
    sessionStatus: 'not-started-preview-only',
    hooksActive: false,
    hookScriptsInstalled: false,
    hookEventReadiness: hookEvents().map((hookEvent) => ({ hookEvent, readinessStatus: 'preview-ready-not-active' })),
    ...safe,
    ...overrides.sessionManifest,
  })
}
