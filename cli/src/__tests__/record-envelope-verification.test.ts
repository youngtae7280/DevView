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

describe('security verify-record-envelope CLI', () => {
  it('verifies a valid preview and payload digest without signing or RBAC enforcement', async () => {
    const workspace = createWorkspace()
    const payloadPath = '.tmp/rbac-readiness.json'
    writeJson(join(workspace, payloadPath), reportOnlyArtifact())
    writeJson(join(workspace, '.tmp/rbac-readiness.envelope.json'), previewFor(workspace, payloadPath))

    const result = await runVerification(
      workspace,
      ['--record-envelope-preview', '.tmp/rbac-readiness.envelope.json', '--payload', payloadPath],
      '.tmp/rbac-readiness.envelope.verification.json',
      ['--markdown', '.tmp/rbac-readiness.envelope.verification.md'],
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/rbac-readiness.envelope.verification.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-record-envelope-verification-report')
    expect(payload.status).toBe('devview-record-envelope-verified')
    expect(payload.verificationScope).toBe('record-envelope-verification-report-only')
    expect(payload.sourceRecordEnvelopePreview).toEqual(
      expect.objectContaining({
        path: '.tmp/rbac-readiness.envelope.json',
        artifactRole: 'devview-record-envelope-preview',
        status: 'devview-record-envelope-previewed',
        signatureMode: 'unsigned-deterministic-preview',
      }),
    )
    expect(payload.payloadVerification).toEqual(
      expect.objectContaining({
        expectedPath: payloadPath,
        actualPath: payloadPath,
        pathMatches: true,
        digestMatches: true,
        byteLengthMatches: true,
        artifactRoleMatches: true,
        statusMatches: true,
      }),
    )
    expect(payload.sourceArtifactVerification.expectedCount).toBe(0)
    expect(payload.previousEnvelopeVerification.required).toBe(false)
    expect(payload.signatureVerificationMode).toBe('not-performed-unsigned-preview-only')
    expect(payload.verificationDigest).toMatch(/^[a-f0-9]{64}$/)
    expect(written.writtenMarkdownPath).toBe('.tmp/rbac-readiness.envelope.verification.md')
    expect(existsSync(join(workspace, '.tmp/rbac-readiness.envelope.verification.md'))).toBe(true)
    expectSafetyFalse(payload)
  })

  it('verifies source artifact digests from explicit source paths', async () => {
    const workspace = createWorkspace()
    const payloadPath = '.tmp/payload.json'
    const sourceAPath = '.tmp/source-a.json'
    const sourceBPath = '.tmp/source-b.json'
    writeJson(join(workspace, payloadPath), reportOnlyArtifact())
    writeJson(join(workspace, sourceAPath), reportOnlyArtifact({ artifactRole: 'devview-extension-readiness-report' }))
    writeJson(join(workspace, sourceBPath), reportOnlyArtifact({ artifactRole: 'devview-extension-context-plan' }))
    writeJson(
      join(workspace, '.tmp/payload.envelope.json'),
      previewFor(workspace, payloadPath, { sources: [sourceAPath, sourceBPath] }),
    )

    const result = await runVerification(
      workspace,
      [
        '--record-envelope-preview',
        '.tmp/payload.envelope.json',
        '--payload',
        payloadPath,
        '--source-artifacts',
        `${sourceAPath},${sourceBPath}`,
      ],
      '.tmp/payload.envelope.verification.json',
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.sourceArtifactVerification.expectedCount).toBe(2)
    expect(payload.sourceArtifactVerification.actualCount).toBe(2)
    expect(payload.sourceArtifactVerification.allSourceDigestsMatch).toBe(true)
    expect(
      payload.sourceArtifactVerification.matches.map((entry: { expectedPath: string }) => entry.expectedPath),
    ).toEqual([sourceAPath, sourceBPath])
    expect(payload.verificationFindings.map((entry: { code: string }) => entry.code)).toContain(
      'RECORD_ENVELOPE_VERIFICATION_SOURCE_DIGESTS_VERIFIED',
    )
    expectSafetyFalse(payload)
  })

  it('verifies a previous envelope link from explicit previous envelope bytes', async () => {
    const workspace = createWorkspace()
    const payloadPath = '.tmp/payload.json'
    const previousPath = '.tmp/previous.envelope.json'
    writeJson(join(workspace, payloadPath), reportOnlyArtifact())
    writeJson(join(workspace, previousPath), previewFor(workspace, payloadPath))
    writeJson(
      join(workspace, '.tmp/current.envelope.json'),
      previewFor(workspace, payloadPath, { previousEnvelope: previousPath }),
    )

    const result = await runVerification(
      workspace,
      [
        '--record-envelope-preview',
        '.tmp/current.envelope.json',
        '--payload',
        payloadPath,
        '--previous-envelope',
        previousPath,
      ],
      '.tmp/current.envelope.verification.json',
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.previousEnvelopeVerification).toEqual(
      expect.objectContaining({
        required: true,
        supplied: true,
        expectedSha256: sha256File(join(workspace, previousPath)),
        actualSha256: sha256File(join(workspace, previousPath)),
        digestMatches: true,
        chainLinkVerified: true,
        expectedPath: previousPath,
        actualPath: previousPath,
        pathMatches: true,
      }),
    )
    expect(payload.verificationFindings.map((entry: { code: string }) => entry.code)).toContain(
      'RECORD_ENVELOPE_VERIFICATION_PREVIOUS_LINK_VERIFIED',
    )
    expectSafetyFalse(payload)
  })

  it('blocks payload path and hash mismatches with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/payload.json'), reportOnlyArtifact())
    writeJson(join(workspace, '.tmp/other-payload.json'), reportOnlyArtifact())
    writeJson(
      join(workspace, '.tmp/path-mismatch.envelope.json'),
      previewFor(workspace, '.tmp/payload.json', { payloadPathOverride: '.tmp/other-payload.json' }),
    )
    writeJson(
      join(workspace, '.tmp/hash-mismatch.envelope.json'),
      previewFor(workspace, '.tmp/payload.json', { payloadSha256Override: '0'.repeat(64) }),
    )

    const pathMismatch = await runVerification(
      workspace,
      ['--record-envelope-preview', '.tmp/path-mismatch.envelope.json', '--payload', '.tmp/payload.json'],
      '.tmp/path-mismatch.verification.json',
    )
    const hashMismatch = await runVerification(
      workspace,
      ['--record-envelope-preview', '.tmp/hash-mismatch.envelope.json', '--payload', '.tmp/payload.json'],
      '.tmp/hash-mismatch.verification.json',
    )

    expect(pathMismatch.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(pathMismatch.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RECORD_ENVELOPE_VERIFICATION_PAYLOAD_PATH_MISMATCH',
    )
    expect(existsSync(join(workspace, '.tmp/path-mismatch.verification.json'))).toBe(false)
    expect(hashMismatch.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(hashMismatch.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RECORD_ENVELOPE_VERIFICATION_PAYLOAD_DIGEST_MISMATCH',
    )
    expect(existsSync(join(workspace, '.tmp/hash-mismatch.verification.json'))).toBe(false)
  })

  it('blocks missing source artifacts and previous envelope hash mismatches with zero writes', async () => {
    const workspace = createWorkspace()
    const payloadPath = '.tmp/payload.json'
    const sourcePath = '.tmp/source.json'
    const previousPath = '.tmp/previous.envelope.json'
    writeJson(join(workspace, payloadPath), reportOnlyArtifact())
    writeJson(join(workspace, sourcePath), reportOnlyArtifact({ artifactRole: 'devview-extension-readiness-report' }))
    writeJson(join(workspace, previousPath), previewFor(workspace, payloadPath))
    writeJson(
      join(workspace, '.tmp/declares-source.envelope.json'),
      previewFor(workspace, payloadPath, { sources: [sourcePath] }),
    )
    writeJson(
      join(workspace, '.tmp/bad-previous.envelope.json'),
      previewFor(workspace, payloadPath, { previousEnvelope: previousPath, previousSha256Override: '1'.repeat(64) }),
    )

    const missingSource = await runVerification(
      workspace,
      ['--record-envelope-preview', '.tmp/declares-source.envelope.json', '--payload', payloadPath],
      '.tmp/missing-source.verification.json',
    )
    const badPrevious = await runVerification(
      workspace,
      [
        '--record-envelope-preview',
        '.tmp/bad-previous.envelope.json',
        '--payload',
        payloadPath,
        '--previous-envelope',
        previousPath,
      ],
      '.tmp/bad-previous.verification.json',
    )

    expect(missingSource.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(missingSource.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RECORD_ENVELOPE_VERIFICATION_SOURCE_ARTIFACTS_REQUIRED',
    )
    expect(existsSync(join(workspace, '.tmp/missing-source.verification.json'))).toBe(false)
    expect(badPrevious.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(badPrevious.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RECORD_ENVELOPE_VERIFICATION_PREVIOUS_ENVELOPE_DIGEST_MISMATCH',
    )
    expect(existsSync(join(workspace, '.tmp/bad-previous.verification.json'))).toBe(false)
  })

  it('blocks wrong preview role, status, and signature mode with zero writes', async () => {
    const workspace = createWorkspace()
    const payloadPath = '.tmp/payload.json'
    writeJson(join(workspace, payloadPath), reportOnlyArtifact())
    writeJson(join(workspace, '.tmp/wrong-role.envelope.json'), {
      ...previewFor(workspace, payloadPath),
      artifactRole: 'wrong-role',
    })
    writeJson(join(workspace, '.tmp/wrong-status.envelope.json'), {
      ...previewFor(workspace, payloadPath),
      status: 'wrong-status',
    })
    writeJson(join(workspace, '.tmp/wrong-mode.envelope.json'), {
      ...previewFor(workspace, payloadPath),
      signatureMode: 'signed',
    })

    const wrongRole = await runVerification(
      workspace,
      ['--record-envelope-preview', '.tmp/wrong-role.envelope.json', '--payload', payloadPath],
      '.tmp/wrong-role.verification.json',
    )
    const wrongStatus = await runVerification(
      workspace,
      ['--record-envelope-preview', '.tmp/wrong-status.envelope.json', '--payload', payloadPath],
      '.tmp/wrong-status.verification.json',
    )
    const wrongMode = await runVerification(
      workspace,
      ['--record-envelope-preview', '.tmp/wrong-mode.envelope.json', '--payload', payloadPath],
      '.tmp/wrong-mode.verification.json',
    )

    expect(JSON.parse(wrongRole.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RECORD_ENVELOPE_VERIFICATION_PREVIEW_ROLE_STATUS_INVALID',
    )
    expect(JSON.parse(wrongStatus.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RECORD_ENVELOPE_VERIFICATION_PREVIEW_ROLE_STATUS_INVALID',
    )
    expect(JSON.parse(wrongMode.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RECORD_ENVELOPE_VERIFICATION_PREVIEW_SIGNATURE_MODE_INVALID',
    )
    expect(wrongRole.exitCode).toBe(ExitCode.ValidationFailed)
    expect(wrongStatus.exitCode).toBe(ExitCode.ValidationFailed)
    expect(wrongMode.exitCode).toBe(ExitCode.ValidationFailed)
    expect(existsSync(join(workspace, '.tmp/wrong-role.verification.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/wrong-status.verification.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/wrong-mode.verification.json'))).toBe(false)
  })

  it('blocks cryptographic and RBAC verification claims with zero writes', async () => {
    const workspace = createWorkspace()
    const payloadPath = '.tmp/payload.json'
    writeJson(join(workspace, payloadPath), reportOnlyArtifact())
    writeJson(join(workspace, '.tmp/crypto-claim.envelope.json'), {
      ...previewFor(workspace, payloadPath),
      cryptographicSignaturePresent: true,
    })
    writeJson(join(workspace, '.tmp/rbac-claim.envelope.json'), {
      ...previewFor(workspace, payloadPath),
      authorizationClaim: {
        requiredPermission: 'audit.verify',
        authorizationSource: 'explicit-cli-input',
        rbacEnforced: false,
        permissionVerified: true,
      },
    })

    for (const [previewPath, outputPath] of [
      ['.tmp/crypto-claim.envelope.json', '.tmp/crypto-claim.verification.json'],
      ['.tmp/rbac-claim.envelope.json', '.tmp/rbac-claim.verification.json'],
    ]) {
      const result = await runVerification(
        workspace,
        ['--record-envelope-preview', previewPath, '--payload', payloadPath],
        outputPath,
      )
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
        'RECORD_ENVELOPE_VERIFICATION_AUTHORITY_CLAIM_UNSUPPORTED',
      )
      expect(existsSync(join(workspace, outputPath))).toBe(false)
    }
  })

  it('blocks unsafe source flags while allowing exact guarded apply source facts as payload facts', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/unsafe-payload.json'), reportOnlyArtifact({ networkCallMade: true }))
    writeJson(join(workspace, '.tmp/unsafe.envelope.json'), previewFor(workspace, '.tmp/unsafe-payload.json'))
    writeJson(join(workspace, '.tmp/apply-report.json'), guardedApplyReport())
    writeJson(join(workspace, '.tmp/apply.envelope.json'), previewFor(workspace, '.tmp/apply-report.json'))

    const unsafe = await runVerification(
      workspace,
      ['--record-envelope-preview', '.tmp/unsafe.envelope.json', '--payload', '.tmp/unsafe-payload.json'],
      '.tmp/unsafe.verification.json',
    )
    const allowed = await runVerification(
      workspace,
      ['--record-envelope-preview', '.tmp/apply.envelope.json', '--payload', '.tmp/apply-report.json'],
      '.tmp/apply.verification.json',
    )
    const allowedPayload = JSON.parse(allowed.stdout)

    expect(unsafe.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafe.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RECORD_ENVELOPE_VERIFICATION_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe.verification.json'))).toBe(false)
    expect(allowed.exitCode).toBe(ExitCode.Success)
    expect(allowedPayload.payloadVerification.expectedArtifactRole).toBe('devview-guarded-graph-update-apply-report')
    expect(allowedPayload.graphDeltaApplied).toBe(false)
    expect(allowedPayload.graphSourceMutated).toBe(false)
    expect(allowedPayload.filesMutated).toBe(false)
    expectSafetyFalse(allowedPayload)
  })

  it('blocks output collisions, source overwrite, and protected output paths', async () => {
    const workspace = createWorkspace()
    const payloadPath = '.tmp/payload.json'
    const previewPath = '.tmp/payload.envelope.json'
    writeJson(join(workspace, payloadPath), reportOnlyArtifact())
    writeJson(join(workspace, previewPath), previewFor(workspace, payloadPath))

    const cases = [
      { output: previewPath, expected: 'would overwrite a source input' },
      {
        output: '.tmp/envelope-verification.json',
        markdown: '.tmp/envelope-verification.json',
        expected: 'must be different',
      },
      {
        output: join('.devview', 'generated', 'envelope-verification.json'),
        expected: 'inside a protected control path',
      },
    ]

    for (const entry of cases) {
      const result = await runVerification(
        workspace,
        ['--record-envelope-preview', previewPath, '--payload', payloadPath],
        entry.output,
        entry.markdown ? ['--markdown', entry.markdown] : [],
      )
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(result.stderr).toContain(entry.expected)
    }
  })

  it('keeps the verification digest deterministic across repeated runs', async () => {
    const workspace = createWorkspace()
    const payloadPath = '.tmp/payload.json'
    writeJson(join(workspace, payloadPath), reportOnlyArtifact())
    writeJson(join(workspace, '.tmp/payload.envelope.json'), previewFor(workspace, payloadPath))

    const first = await runVerification(
      workspace,
      ['--record-envelope-preview', '.tmp/payload.envelope.json', '--payload', payloadPath],
      '.tmp/first.verification.json',
    )
    const second = await runVerification(
      workspace,
      ['--record-envelope-preview', '.tmp/payload.envelope.json', '--payload', payloadPath],
      '.tmp/second.verification.json',
    )
    const firstPayload = JSON.parse(first.stdout)
    const secondPayload = JSON.parse(second.stdout)

    expect(first.exitCode).toBe(ExitCode.Success)
    expect(second.exitCode).toBe(ExitCode.Success)
    expect(firstPayload.verificationDigest).toBe(secondPayload.verificationDigest)
    expect(firstPayload.payloadVerification).toEqual(secondPayload.payloadVerification)
  })
})

function runVerification(workspace: string, args: string[], output: string, extraArgs: string[] = []) {
  return runDevViewCli(['security', 'verify-record-envelope', ...args, '--output', output, ...extraArgs, '--json'], {
    cwd: workspace,
    pluginRoot,
  })
}

function previewFor(
  workspace: string,
  payloadPath: string,
  options: {
    sources?: string[]
    previousEnvelope?: string
    payloadPathOverride?: string
    payloadSha256Override?: string
    previousSha256Override?: string
  } = {},
): Record<string, unknown> {
  const payload = JSON.parse(readFileSync(join(workspace, payloadPath), 'utf8')) as Record<string, unknown>
  const previousSha = options.previousEnvelope ? sha256File(join(workspace, options.previousEnvelope)) : null
  return {
    schemaVersion: 1,
    artifactRole: 'devview-record-envelope-preview',
    status: 'devview-record-envelope-previewed',
    envelopeScope: 'signed-record-envelope-preview-report-only',
    signatureMode: 'unsigned-deterministic-preview',
    payloadSummary: {
      path: options.payloadPathOverride ?? payloadPath,
      artifactRole: payload.artifactRole,
      status: payload.status,
      sha256: options.payloadSha256Override ?? sha256File(join(workspace, payloadPath)),
      byteLength: byteLength(join(workspace, payloadPath)),
      payloadCanonicalization: 'raw-json-bytes-sha256',
    },
    sourceArtifactDigests: (options.sources ?? []).map((sourcePath) => {
      const source = JSON.parse(readFileSync(join(workspace, sourcePath), 'utf8')) as Record<string, unknown>
      return {
        path: sourcePath,
        artifactRole: source.artifactRole,
        status: source.status,
        sha256: sha256File(join(workspace, sourcePath)),
        byteLength: byteLength(join(workspace, sourcePath)),
      }
    }),
    previousEnvelope: options.previousEnvelope
      ? {
          supplied: true,
          path: options.previousEnvelope,
          sha256: options.previousSha256Override ?? previousSha,
        }
      : { supplied: false },
    previousEnvelopeSha256: options.previousEnvelope ? (options.previousSha256Override ?? previousSha) : null,
    actorIdentity: {
      actorId: 'auditor.local',
      actorType: 'human',
      roleClaims: ['auditor'],
      identityProvider: 'explicit-cli-input',
      identityAssurance: 'explicit-cli-input-not-verified',
    },
    authorizationClaim: {
      requiredPermission: 'audit.verify',
      authorizationSource: 'explicit-cli-input',
      rbacEnforced: false,
      permissionVerified: false,
    },
    verificationSummary: {
      payloadHashRecorded: true,
      sourceDigestsRecorded: Boolean(options.sources?.length),
      actorIdentityRecorded: true,
      rbacPermissionVerified: false,
      cryptographicSignatureVerified: false,
      previousEnvelopeLinked: Boolean(options.previousEnvelope),
    },
    envelopePayloadDigest: 'a'.repeat(64),
    envelopeSha256: 'b'.repeat(64),
    cryptographicSignaturePresent: false,
    rbacEnforced: false,
    permissionVerified: false,
    ...safetyFalse(),
  }
}

function reportOnlyArtifact(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-rbac-readiness-report',
    status: 'devview-rbac-readiness-reported',
    sourceFactsOnly: true,
    reportOnly: true,
    ...safetyFalse(),
    ...overrides,
  }
}

function guardedApplyReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-guarded-graph-update-apply-report',
    status: 'devview-guarded-graph-update-applied',
    mutatedFilePaths: ['.tmp/graph.json'],
    ...safetyFalse(),
    graphDeltaApplied: true,
    graphSourceMutated: true,
    filesMutated: true,
    ...overrides,
  }
}

function safetyFalse(): Record<string, false> {
  return {
    enterpriseGateActivated: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandExecuted: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    extensionCodeExecuted: false,
    graphifyExecuted: false,
    graphifyLiveRun: false,
    nativeBenchmarkExecuted: false,
    benchmarkExecuted: false,
    candidateExecuted: false,
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
  }
}

function sha256File(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

function byteLength(file: string): number {
  return readFileSync(file).length
}

function expectSafetyFalse(payload: Record<string, unknown>): void {
  expect(payload.cryptographicSignatureVerified).toBe(false)
  expect(payload.rbacPermissionVerified).toBe(false)
  expect(payload.rbacEnforced).toBe(false)
  expect(payload.permissionVerified).toBe(false)
  expect(payload.enterpriseGateActivated).toBe(false)
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
