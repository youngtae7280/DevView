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

describe('Extension readiness', () => {
  it('reports valid Project Profile and Extension Manifest readiness without execution', async () => {
    const workspace = createWorkspace()
    writeProjectProfile(workspace)
    writeJson(join(workspace, '.devview', 'extensions', 'view-tree.manifest.json'), validManifest())

    const result = await runDevViewCli(
      [
        'extensions',
        'report-readiness',
        '--output',
        join('.tmp', 'extension-readiness.json'),
        '--markdown',
        join('.tmp', 'extension-readiness.md'),
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp', 'extension-readiness.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-extension-readiness-report')
    expect(payload.status).toBe('devview-extension-readiness-ready')
    expect(payload.extensionReadinessStatus).toBe('ready-extension-manifests-validated')
    expect(payload.capabilities.viewTreeExtractorExtensions).toEqual(['fixture-view-tree-extractor'])
    expect(payload.requiredPermissions).toContain('read-view-tree')
    expect(payload.extensionExecutionAllowed).toBe(false)
    expect(payload.extensionsExecuted).toBe(false)
    expect(payload.providerInvoked).toBe(false)
    expect(payload.networkCallMade).toBe(false)
    expect(payload.shellCommandsExecuted).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(written.nonEnforcing).toBe(true)
    expect(existsSync(join(workspace, '.tmp', 'extension-readiness.md'))).toBe(true)
  })

  it('blocks manifests that declare execution or unsupported permissions', async () => {
    const workspace = createWorkspace()
    writeProjectProfile(workspace)
    writeJson(join(workspace, '.devview', 'extensions', 'unsafe.manifest.json'), {
      ...validManifest(),
      extensionId: 'unsafe-extension',
      requiredPermissions: ['read-view-tree', 'run-shell-command'],
      execution: {
        executionKind: 'local-command',
        command: 'node adapter.js',
      },
    })

    const result = await runDevViewCli(
      ['extensions', 'report-readiness', '--output', join('.tmp', 'extension-readiness.json'), '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp', 'extension-readiness.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.status).toBe('devview-extension-readiness-blocked')
    expect(payload.extensionReadinessStatus).toBe('blocked-invalid-extension-manifest')
    expect(payload.findings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining(['EXTENSION_PERMISSION_UNSUPPORTED', 'EXTENSION_EXECUTION_DECLARATION_UNSUPPORTED']),
    )
    expect(written.extensionsExecuted).toBe(false)
    expect(written.networkCallMade).toBe(false)
  })

  it('blocks output overwrite of Project Profile before writing anything', async () => {
    const workspace = createWorkspace()
    writeProjectProfile(workspace)
    writeJson(join(workspace, '.devview', 'extensions', 'view-tree.manifest.json'), validManifest())
    const profilePath = join(workspace, '.devview', 'project-profile.json')
    const before = readFileSync(profilePath, 'utf8')

    const result = await runDevViewCli(
      [
        'extensions',
        'report-readiness',
        '--output',
        join('.devview', 'project-profile.json'),
        '--markdown',
        join('.tmp', 'extension-readiness.md'),
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(result.stderr).toContain('would overwrite the source Project Profile')
    expect(readFileSync(profilePath, 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp', 'extension-readiness.md'))).toBe(false)
  })
})

function writeProjectProfile(workspace: string): void {
  writeJson(join(workspace, '.devview', 'project-profile.json'), {
    schemaVersion: 1,
    artifactRole: 'devview-project-profile',
    status: 'devview-project-profile-configured',
    projectProfileId: 'fixture-profile',
    projectName: 'Fixture Project',
    domain: 'fixture-domain',
    stack: ['typescript'],
    extensionManifestLocations: ['.devview/extensions'],
    extensionPolicy: {
      executionAllowed: false,
      networkAllowed: false,
      providerInvocationAllowed: false,
    },
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
  })
}

function validManifest(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-extension-manifest',
    status: 'devview-extension-manifest-declared',
    extensionId: 'fixture-view-tree-extractor',
    displayName: 'Fixture View Tree Extractor',
    extensionKind: 'view-tree-extractor',
    capabilities: ['view-tree-extractor-extension', 'context-pack-extension'],
    requiredPermissions: [
      'read-project-profile',
      'read-maintainability-graph',
      'read-view-tree',
      'write-report-output',
    ],
    execution: {
      executionKind: 'declarative-manifest-only',
      entrypoint: null,
      command: null,
      script: null,
      module: null,
    },
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
  }
}
