import { createHash } from 'node:crypto'
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

describe('security preview-record-envelope CLI', () => {
  it('creates an unsigned deterministic envelope preview for a report-only artifact', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/rbac-readiness.json'), reportOnlyArtifact())

    const result = await runDevViewCli(
      [
        'security',
        'preview-record-envelope',
        '--payload',
        '.tmp/rbac-readiness.json',
        '--required-permission',
        'audit.verify',
        '--actor-id',
        'reviewer.local',
        '--actor-type',
        'human',
        '--actor-role',
        'auditor',
        '--authorization-rationale',
        'Review envelope preview',
        '--output',
        '.tmp/rbac-readiness.envelope.json',
        '--markdown',
        '.tmp/rbac-readiness.envelope.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/rbac-readiness.envelope.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-record-envelope-preview')
    expect(payload.status).toBe('devview-record-envelope-previewed')
    expect(payload.envelopeScope).toBe('signed-record-envelope-preview-report-only')
    expect(payload.signatureMode).toBe('unsigned-deterministic-preview')
    expect(payload.payloadSummary.path).toBe('.tmp/rbac-readiness.json')
    expect(payload.payloadSummary.artifactRole).toBe('devview-rbac-readiness-report')
    expect(payload.payloadSummary.status).toBe('devview-rbac-readiness-reported')
    expect(payload.payloadSummary.payloadCanonicalization).toBe('raw-json-bytes-sha256')
    expect(payload.payloadSummary.sha256).toBe(sha256File(join(workspace, '.tmp/rbac-readiness.json')))
    expect(payload.actorIdentity).toEqual({
      actorId: 'reviewer.local',
      actorType: 'human',
      roleClaims: ['auditor'],
      identityProvider: 'explicit-cli-input',
      identityAssurance: 'explicit-cli-input-not-verified',
    })
    expect(payload.authorizationClaim.requiredPermission).toBe('audit.verify')
    expect(payload.authorizationClaim.authorizationSource).toBe('explicit-cli-input')
    expect(payload.authorizationClaim.authorizationRationale).toBe('Review envelope preview')
    expect(payload.authorizationClaim.rbacEnforced).toBe(false)
    expect(payload.authorizationClaim.permissionVerified).toBe(false)
    expect(payload.cryptographicSignaturePresent).toBe(false)
    expect(payload.verificationSummary.payloadHashRecorded).toBe(true)
    expect(payload.verificationSummary.sourceDigestsRecorded).toBe(false)
    expect(payload.verificationSummary.cryptographicSignatureVerified).toBe(false)
    expect(payload.verificationSummary.rbacPermissionVerified).toBe(false)
    expect(payload.envelopePayloadDigest).toMatch(/^[a-f0-9]{64}$/)
    expect(payload.envelopeSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(written.writtenMarkdownPath).toBe('.tmp/rbac-readiness.envelope.md')
    expect(existsSync(join(workspace, '.tmp/rbac-readiness.envelope.md'))).toBe(true)
    expectSafetyFalse(payload)
  })

  it('records source artifacts, links a previous envelope, and keeps the digest deterministic', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/payload.json'), reportOnlyArtifact())
    writeJson(
      join(workspace, '.tmp/source-a.json'),
      reportOnlyArtifact({ artifactRole: 'devview-extension-readiness-report' }),
    )
    writeJson(
      join(workspace, '.tmp/source-b.json'),
      reportOnlyArtifact({ artifactRole: 'devview-extension-context-plan' }),
    )

    const first = await runEnvelope(workspace, '.tmp/payload.json', '.tmp/first.envelope.json', [
      '--required-permission',
      'audit.verify',
      '--actor-id',
      'auditor.local',
      '--actor-type',
      'human',
      '--actor-role',
      'auditor',
    ])
    expect(first.exitCode).toBe(ExitCode.Success)

    const linkedArgs = [
      '--source-artifacts',
      '.tmp/source-a.json,.tmp/source-b.json',
      '--previous-envelope',
      '.tmp/first.envelope.json',
      '--required-permission',
      'report.create',
      '--actor-id',
      'automation.local',
      '--actor-type',
      'automation',
      '--actor-role',
      'reporter,auditor',
    ]
    const second = await runEnvelope(workspace, '.tmp/payload.json', '.tmp/second-a.envelope.json', linkedArgs)
    const third = await runEnvelope(workspace, '.tmp/payload.json', '.tmp/second-b.envelope.json', linkedArgs)
    const secondPayload = JSON.parse(second.stdout)
    const thirdPayload = JSON.parse(third.stdout)

    expect(second.exitCode).toBe(ExitCode.Success)
    expect(third.exitCode).toBe(ExitCode.Success)
    expect(secondPayload.sourceArtifactDigests).toHaveLength(2)
    expect(secondPayload.sourceArtifactDigests.map((entry: { path: string }) => entry.path)).toEqual([
      '.tmp/source-a.json',
      '.tmp/source-b.json',
    ])
    expect(secondPayload.previousEnvelope.supplied).toBe(true)
    expect(secondPayload.previousEnvelopeSha256).toBe(sha256File(join(workspace, '.tmp/first.envelope.json')))
    expect(secondPayload.actorIdentity.roleClaims).toEqual(['reporter', 'auditor'])
    expect(secondPayload.verificationSummary.previousEnvelopeLinked).toBe(true)
    expect(secondPayload.envelopeSha256).toBe(thirdPayload.envelopeSha256)
    expectSafetyFalse(secondPayload)
  })

  it('blocks unknown permissions, actor types, actor roles, and invalid previous envelope sources', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/payload.json'), reportOnlyArtifact())
    writeJson(join(workspace, '.tmp/wrong-previous.json'), {
      artifactRole: 'devview-record-envelope-preview',
      status: 'wrong-status',
    })

    const cases = [
      {
        args: [
          '--required-permission',
          'unknown.permission',
          '--actor-id',
          'a',
          '--actor-type',
          'human',
          '--actor-role',
          'auditor',
        ],
        output: '.tmp/unknown-permission.json',
        code: 'RECORD_ENVELOPE_REQUIRED_PERMISSION_UNKNOWN',
      },
      {
        args: [
          '--required-permission',
          'audit.verify',
          '--actor-id',
          'a',
          '--actor-type',
          'robot',
          '--actor-role',
          'auditor',
        ],
        output: '.tmp/unknown-actor-type.json',
        code: 'RECORD_ENVELOPE_ACTOR_TYPE_UNKNOWN',
      },
      {
        args: [
          '--required-permission',
          'audit.verify',
          '--actor-id',
          'a',
          '--actor-type',
          'human',
          '--actor-role',
          'superuser',
        ],
        output: '.tmp/unknown-actor-role.json',
        code: 'RECORD_ENVELOPE_ACTOR_ROLE_UNKNOWN',
      },
      {
        args: [
          '--previous-envelope',
          '.tmp/wrong-previous.json',
          '--required-permission',
          'audit.verify',
          '--actor-id',
          'a',
          '--actor-type',
          'human',
          '--actor-role',
          'auditor',
        ],
        output: '.tmp/wrong-previous-output.json',
        code: 'RECORD_ENVELOPE_PREVIOUS_ROLE_STATUS_INVALID',
      },
    ]

    for (const entry of cases) {
      const result = await runEnvelope(workspace, '.tmp/payload.json', entry.output, entry.args)
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((issue: { code: string }) => issue.code)).toContain(entry.code)
      expect(existsSync(join(workspace, entry.output))).toBe(false)
    }
  })

  it('blocks unsafe authority flags but allows exact guarded apply source facts', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/unsafe-payload.json'), reportOnlyArtifact({ providerInvoked: true }))
    writeJson(join(workspace, '.tmp/apply-report.json'), guardedApplyReport())

    const unsafe = await runEnvelope(workspace, '.tmp/unsafe-payload.json', '.tmp/unsafe.envelope.json', [
      '--required-permission',
      'audit.verify',
      '--actor-id',
      'auditor.local',
      '--actor-type',
      'human',
      '--actor-role',
      'auditor',
    ])
    expect(unsafe.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafe.stderr).issues.map((issue: { code: string }) => issue.code)).toContain(
      'RECORD_ENVELOPE_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe.envelope.json'))).toBe(false)

    const allowed = await runEnvelope(workspace, '.tmp/apply-report.json', '.tmp/apply.envelope.json', [
      '--required-permission',
      'graph.apply.execute',
      '--actor-id',
      'operator.local',
      '--actor-type',
      'human',
      '--actor-role',
      'graph-update-operator',
    ])
    const payload = JSON.parse(allowed.stdout)
    expect(allowed.exitCode).toBe(ExitCode.Success)
    expect(payload.payloadSummary.artifactRole).toBe('devview-guarded-graph-update-apply-report')
    expect(payload.payloadSummary.allowedTrueSourceFacts).toEqual(
      expect.arrayContaining(['filesMutated', 'graphDeltaApplied', 'graphSourceMutated']),
    )
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.filesMutated).toBe(false)
    expectSafetyFalse(payload)
  })

  it('blocks output collisions, source overwrite, and protected output paths', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/payload.json'), reportOnlyArtifact())
    const cases = [
      { output: '.tmp/payload.json', expected: 'would overwrite a source input' },
      { output: '.tmp/envelope.json', markdown: '.tmp/envelope.json', expected: 'must be different' },
      { output: join('.devview', 'generated', 'envelope.json'), expected: 'inside a protected control path' },
    ]

    for (const entry of cases) {
      const result = await runDevViewCli(
        [
          'security',
          'preview-record-envelope',
          '--payload',
          '.tmp/payload.json',
          '--required-permission',
          'audit.verify',
          '--actor-id',
          'auditor.local',
          '--actor-type',
          'human',
          '--actor-role',
          'auditor',
          '--output',
          entry.output,
          ...(entry.markdown ? ['--markdown', entry.markdown] : []),
          '--json',
        ],
        { cwd: workspace, pluginRoot },
      )
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(result.stderr).toContain(entry.expected)
    }
  })
})

function runEnvelope(workspace: string, payload: string, output: string, args: string[]) {
  return runDevViewCli(
    ['security', 'preview-record-envelope', '--payload', payload, ...args, '--output', output, '--json'],
    {
      cwd: workspace,
      pluginRoot,
    },
  )
}

function sha256File(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

function reportOnlyArtifact(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-rbac-readiness-report',
    status: 'devview-rbac-readiness-reported',
    sourceFactsOnly: true,
    reportOnly: true,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    benchmarkExecuted: false,
    candidateExecuted: false,
    graphifyExecuted: false,
    nativeBenchmarkExecuted: false,
    filesMutated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    hooksActivated: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    ...overrides,
  }
}

function guardedApplyReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-guarded-graph-update-apply-report',
    status: 'devview-guarded-graph-update-applied',
    graphDeltaApplied: true,
    graphSourceMutated: true,
    filesMutated: true,
    mutatedFilePaths: ['.tmp/graph.json'],
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    hooksActivated: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    ...overrides,
  }
}

function expectSafetyFalse(payload: Record<string, unknown>): void {
  expect(payload.rbacEnforced).toBe(false)
  expect(payload.permissionVerified).toBe(false)
  expect(payload.cryptographicSignaturePresent).toBe(false)
  expect((payload.verificationSummary as Record<string, unknown>).rbacPermissionVerified).toBe(false)
  expect((payload.verificationSummary as Record<string, unknown>).cryptographicSignatureVerified).toBe(false)
  expect(payload.providerInvoked).toBe(false)
  expect(payload.networkCallMade).toBe(false)
  expect(payload.apiCallMade).toBe(false)
  expect(payload.shellCommandsExecuted).toBe(false)
  expect(payload.extensionExecutionAllowed).toBe(false)
  expect(payload.extensionsExecuted).toBe(false)
  expect(payload.benchmarkExecuted).toBe(false)
  expect(payload.candidateExecuted).toBe(false)
  expect(payload.graphifyExecuted).toBe(false)
  expect(payload.nativeBenchmarkExecuted).toBe(false)
  expect(payload.filesMutated).toBe(false)
  expect(payload.graphSourceMutated).toBe(false)
  expect(payload.graphDeltaApplied).toBe(false)
  expect(payload.runtimeEvidenceSatisfied).toBe(false)
  expect(payload.evidenceAccepted).toBe(false)
  expect(payload.equivalenceProven).toBe(false)
  expect(payload.scopeEnforced).toBe(false)
  expect(payload.ciEnforcementEnabled).toBe(false)
  expect(payload.hooksActivated).toBe(false)
  expect(payload.branchProtectionChanged).toBe(false)
  expect(payload.branchProtectionMutated).toBe(false)
  expect(payload.requiredChecksConfigured).toBe(false)
  expect(payload.requiredChecksMutated).toBe(false)
  expect(payload.externalCiMutated).toBe(false)
  expect(payload.diffRejectionEnabled).toBe(false)
  expect(payload.diffRejectionActivated).toBe(false)
  expect(payload.approvalAutomationEnabled).toBe(false)
  expect(payload.userAcceptanceAutomated).toBe(false)
  expect(payload.sourceFactsOnly).toBe(true)
  expect(payload.reportOnly).toBe(true)
}
