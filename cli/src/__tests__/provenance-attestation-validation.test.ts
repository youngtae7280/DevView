import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())
const packageSha256 = 'a'.repeat(64)

afterEach(() => {
  cleanupWorkspaces()
})

describe('security validate-provenance-attestation CLI', () => {
  it('validates a minimal wrapped provenance attestation source fact without signing or verification', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provenance-attestation.json'), provenanceAttestationArtifact())

    const result = await runProvenanceAttestationValidation(
      workspace,
      ['--attestation', '.tmp/provenance-attestation.json'],
      '.tmp/provenance-attestation-validation.json',
      ['--markdown', '.tmp/provenance-attestation-validation.md'],
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/provenance-attestation-validation.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-provenance-attestation-validation-report')
    expect(payload.status).toBe('devview-provenance-attestation-validation-passed')
    expect(payload.validationScope).toBe('provenance-attestation-validation-report-only')
    expect(payload.attestationValidationStatus).toBe('validated-structural-source-fact-only')
    expect(payload.signatureValidationStatus).toBe('not-performed-source-fact-only')
    expect(payload.sourceAttestationArtifact).toEqual(
      expect.objectContaining({
        path: '.tmp/provenance-attestation.json',
        artifactRole: 'devview-provenance-attestation-artifact',
        status: 'devview-provenance-attestation-supplied',
        attestationScope: 'package-provenance-attestation-source-fact-only',
        attestationFormat: 'devview-minimal-provenance-v1',
        packageName: 'devview',
        packageVersion: '0.2.0-alpha',
        declaredPackageSha256: packageSha256,
      }),
    )
    expect(payload.attestationStructuralValidation).toEqual(
      expect.objectContaining({
        formatRecognized: true,
        requiredFieldsPresent: true,
        packageDigestStatementPresent: true,
        sourceBuildInputsPresent: true,
        unsupportedInstructionFieldCount: 0,
      }),
    )
    expect(payload.packageDigestAlignment.alignmentStatus).toBe('not-supplied')
    expect(payload.digestSummary.attestationSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(
      payload.digestSummary.sourceArtifactDigests.map((entry: { sourceKind: string }) => entry.sourceKind),
    ).toEqual(['attestation'])
    expect(written.writtenMarkdownPath).toBe('.tmp/provenance-attestation-validation.md')
    expect(existsSync(join(workspace, '.tmp/provenance-attestation-validation.md'))).toBe(true)
    expectSafetyFalse(payload)
  })

  it('aligns a valid attestation with package provenance inputs and package artifact digest sources', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provenance-attestation.json'), provenanceAttestationArtifact())
    writeJson(join(workspace, '.tmp/package-provenance-inputs.json'), packageProvenanceInputsRecord())
    writeJson(join(workspace, '.tmp/package-artifact-digest.json'), packageArtifactDigestRecord())
    writeJson(join(workspace, '.tmp/release-provenance-readiness.json'), releaseProvenanceReadinessReport())

    const result = await runProvenanceAttestationValidation(
      workspace,
      [
        '--attestation',
        '.tmp/provenance-attestation.json',
        '--package-provenance-inputs',
        '.tmp/package-provenance-inputs.json',
        '--package-artifact-digest',
        '.tmp/package-artifact-digest.json',
        '--release-provenance-readiness',
        '.tmp/release-provenance-readiness.json',
      ],
      '.tmp/provenance-attestation-validation.json',
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.packageDigestAlignment).toEqual(
      expect.objectContaining({
        declaredPackageSha256: packageSha256,
        packageArtifactDigestSha256: packageSha256,
        packageDigestMatches: true,
        alignmentStatus: 'matched',
      }),
    )
    expect(payload.provenanceInputAlignment).toEqual(
      expect.objectContaining({
        packageNameMatches: true,
        packageVersionMatches: true,
        sourceRefMatches: true,
        buildCommandLabelMatches: true,
        alignmentStatus: 'matched',
      }),
    )
    expect(payload.sourcePackageArtifactDigest).toEqual(
      expect.objectContaining({
        supplied: true,
        artifactRole: 'devview-package-artifact-digest-record',
        status: 'devview-package-artifact-digest-recorded',
        artifactDigestStatus: 'matched-expected',
        packageSha256: packageSha256,
      }),
    )
    expect(payload.validationFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'PROVENANCE_ATTESTATION_PACKAGE_INPUTS_LINKED',
        'PROVENANCE_ATTESTATION_PACKAGE_DIGEST_LINKED',
        'PROVENANCE_ATTESTATION_RELEASE_READINESS_LINKED',
      ]),
    )
    expect(
      payload.digestSummary.sourceArtifactDigests.map((entry: { sourceKind: string }) => entry.sourceKind),
    ).toEqual(['attestation', 'package-provenance-inputs', 'package-artifact-digest', 'release-provenance-readiness'])
    expectSafetyFalse(payload)
  })

  it('blocks declared package digest mismatch with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provenance-attestation.json'), provenanceAttestationArtifact())
    writeJson(
      join(workspace, '.tmp/package-artifact-digest.json'),
      packageArtifactDigestRecord({ sha256: 'b'.repeat(64) }),
    )

    const result = await runProvenanceAttestationValidation(
      workspace,
      [
        '--attestation',
        '.tmp/provenance-attestation.json',
        '--package-artifact-digest',
        '.tmp/package-artifact-digest.json',
      ],
      '.tmp/provenance-attestation-validation.json',
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((issue: { code: string }) => issue.code)).toContain(
      'PROVENANCE_ATTESTATION_PACKAGE_DIGEST_MISMATCH',
    )
    expect(existsSync(join(workspace, '.tmp/provenance-attestation-validation.json'))).toBe(false)
  })

  it('blocks wrong attestation role/status, unsupported format, and wrong source role/status', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-role.json'), { ...provenanceAttestationArtifact(), status: 'wrong' })
    writeJson(join(workspace, '.tmp/unknown-format.json'), {
      ...provenanceAttestationArtifact(),
      attestationFormat: 'unknown',
    })
    writeJson(join(workspace, '.tmp/wrong-package-inputs.json'), {
      ...packageProvenanceInputsRecord(),
      status: 'wrong',
    })

    const cases = [
      {
        args: ['--attestation', '.tmp/wrong-role.json'],
        output: '.tmp/wrong-role-output.json',
        code: 'PROVENANCE_ATTESTATION_ROLE_STATUS_INVALID',
      },
      {
        args: ['--attestation', '.tmp/unknown-format.json'],
        output: '.tmp/unknown-format-output.json',
        code: 'PROVENANCE_ATTESTATION_FORMAT_UNSUPPORTED',
      },
      {
        args: [
          '--attestation',
          '.tmp/provenance-attestation.json',
          '--package-provenance-inputs',
          '.tmp/wrong-package-inputs.json',
        ],
        setup: () => writeJson(join(workspace, '.tmp/provenance-attestation.json'), provenanceAttestationArtifact()),
        output: '.tmp/wrong-source-output.json',
        code: 'PROVENANCE_ATTESTATION_PACKAGE_INPUTS_ROLE_STATUS_INVALID',
      },
    ]

    for (const entry of cases) {
      entry.setup?.()
      const result = await runProvenanceAttestationValidation(workspace, entry.args, entry.output)
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((issue: { code: string }) => issue.code)).toContain(entry.code)
      expect(existsSync(join(workspace, entry.output))).toBe(false)
    }
  })

  it('blocks authority claims and executable/provider/network instruction fields with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/generated.json'), {
      ...provenanceAttestationArtifact(),
      provenanceAttestationGeneratedByDevView: true,
    })
    writeJson(join(workspace, '.tmp/verified.json'), {
      ...provenanceAttestationArtifact(),
      provenanceAttestationVerified: true,
    })
    writeJson(join(workspace, '.tmp/signed.json'), { ...provenanceAttestationArtifact(), packageSigned: true })
    writeJson(join(workspace, '.tmp/key.json'), { ...provenanceAttestationArtifact(), keyGenerated: true })
    writeJson(join(workspace, '.tmp/rbac.json'), { ...provenanceAttestationArtifact(), rbacEnforced: true })
    writeJson(join(workspace, '.tmp/provider.json'), { ...provenanceAttestationArtifact(), providerInvoked: true })
    writeJson(join(workspace, '.tmp/execution.json'), {
      ...provenanceAttestationArtifact(),
      metadata: { command: 'verify-attestation' },
    })

    const cases = [
      {
        attestation: '.tmp/generated.json',
        output: '.tmp/generated-output.json',
        code: 'PROVENANCE_ATTESTATION_AUTHORITY_CLAIM_UNSUPPORTED',
      },
      {
        attestation: '.tmp/verified.json',
        output: '.tmp/verified-output.json',
        code: 'PROVENANCE_ATTESTATION_AUTHORITY_CLAIM_UNSUPPORTED',
      },
      {
        attestation: '.tmp/signed.json',
        output: '.tmp/signed-output.json',
        code: 'PROVENANCE_ATTESTATION_AUTHORITY_CLAIM_UNSUPPORTED',
      },
      {
        attestation: '.tmp/key.json',
        output: '.tmp/key-output.json',
        code: 'PROVENANCE_ATTESTATION_AUTHORITY_CLAIM_UNSUPPORTED',
      },
      {
        attestation: '.tmp/rbac.json',
        output: '.tmp/rbac-output.json',
        code: 'PROVENANCE_ATTESTATION_AUTHORITY_CLAIM_UNSUPPORTED',
      },
      {
        attestation: '.tmp/provider.json',
        output: '.tmp/provider-output.json',
        code: 'PROVENANCE_ATTESTATION_UNSAFE_SOURCE_AUTHORITY_FLAG',
      },
      {
        attestation: '.tmp/execution.json',
        output: '.tmp/execution-output.json',
        code: 'PROVENANCE_ATTESTATION_EXECUTION_INSTRUCTION_UNSUPPORTED',
      },
    ]

    for (const entry of cases) {
      const result = await runProvenanceAttestationValidation(
        workspace,
        ['--attestation', entry.attestation],
        entry.output,
      )
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((issue: { code: string }) => issue.code)).toContain(entry.code)
      expect(existsSync(join(workspace, entry.output))).toBe(false)
    }
  })

  it('blocks unsafe source authority claims with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provenance-attestation.json'), provenanceAttestationArtifact())
    writeJson(join(workspace, '.tmp/signed-package-digest.json'), {
      ...packageArtifactDigestRecord(),
      packageSigned: true,
    })

    const result = await runProvenanceAttestationValidation(
      workspace,
      [
        '--attestation',
        '.tmp/provenance-attestation.json',
        '--package-artifact-digest',
        '.tmp/signed-package-digest.json',
      ],
      '.tmp/provenance-attestation-validation.json',
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((issue: { code: string }) => issue.code)).toContain(
      'PROVENANCE_ATTESTATION_AUTHORITY_CLAIM_UNSUPPORTED',
    )
    expect(existsSync(join(workspace, '.tmp/provenance-attestation-validation.json'))).toBe(false)
  })

  it('blocks output collisions, source overwrite, and protected paths', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provenance-attestation.json'), provenanceAttestationArtifact())
    writeJson(join(workspace, '.tmp/package-artifact-digest.json'), packageArtifactDigestRecord())

    const cases = [
      {
        args: ['--attestation', '.tmp/provenance-attestation.json'],
        output: '.tmp/provenance-attestation.json',
        expected: 'would overwrite a source input',
      },
      {
        args: [
          '--attestation',
          '.tmp/provenance-attestation.json',
          '--package-artifact-digest',
          '.tmp/package-artifact-digest.json',
        ],
        output: '.tmp/package-artifact-digest.json',
        expected: 'would overwrite a source input',
      },
      {
        args: ['--attestation', '.tmp/provenance-attestation.json'],
        output: '.tmp/provenance-attestation-validation.json',
        markdown: '.tmp/provenance-attestation-validation.json',
        expected: 'must be different',
      },
      {
        args: ['--attestation', '.tmp/provenance-attestation.json'],
        output: join('.devview', 'generated', 'provenance-attestation-validation.json'),
        expected: 'inside a protected control path',
      },
    ]

    for (const entry of cases) {
      const result = await runProvenanceAttestationValidation(
        workspace,
        entry.args,
        entry.output,
        entry.markdown ? ['--markdown', entry.markdown] : [],
      )
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(result.stderr).toContain(entry.expected)
    }
  })

  it('emits deterministic report content across repeated runs to the same path', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provenance-attestation.json'), provenanceAttestationArtifact())

    const first = await runProvenanceAttestationValidation(
      workspace,
      ['--attestation', '.tmp/provenance-attestation.json'],
      '.tmp/provenance-attestation-validation.json',
    )
    const firstContent = readFileSync(join(workspace, '.tmp/provenance-attestation-validation.json'), 'utf8')
    const second = await runProvenanceAttestationValidation(
      workspace,
      ['--attestation', '.tmp/provenance-attestation.json'],
      '.tmp/provenance-attestation-validation.json',
    )
    const secondContent = readFileSync(join(workspace, '.tmp/provenance-attestation-validation.json'), 'utf8')

    expect(first.exitCode).toBe(ExitCode.Success)
    expect(second.exitCode).toBe(ExitCode.Success)
    expect(secondContent).toBe(firstContent)
  })
})

function runProvenanceAttestationValidation(
  workspace: string,
  args: string[],
  output: string,
  extraArgs: string[] = [],
) {
  return runDevViewCli(
    ['security', 'validate-provenance-attestation', ...args, '--output', output, ...extraArgs, '--json'],
    {
      cwd: workspace,
      pluginRoot,
    },
  )
}

function provenanceAttestationArtifact(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-provenance-attestation-artifact',
    status: 'devview-provenance-attestation-supplied',
    attestationScope: 'package-provenance-attestation-source-fact-only',
    sourceFactsOnly: true,
    reportOnly: true,
    attestationFormat: 'devview-minimal-provenance-v1',
    packageIdentity: {
      name: 'devview',
      version: '0.2.0-alpha',
    },
    packageDigest: {
      algorithm: 'sha256',
      sha256: packageSha256,
    },
    sourceRef: 'cf9185403a128aebd9fb31c65e84fee39d39c632',
    buildCommandLabel: 'npm run build:cli',
    sourceArtifactDigests: [
      {
        sourceKind: 'package-json',
        path: 'package.json',
        sha256: '1'.repeat(64),
        byteLength: 2227,
      },
    ],
    provenanceAttestationGeneratedByDevView: false,
    provenanceAttestationGenerated: false,
    provenanceAttestationVerified: false,
    provenanceAttestationPresent: false,
    provenanceAttested: false,
    releaseProvenanceAttested: false,
    npmProvenanceEnabled: false,
    slsaProvenanceGenerated: false,
    inTotoStatementVerified: false,
    packageSigned: false,
    packageSigningPresent: false,
    packageSignaturePresent: false,
    packageSignatureVerified: false,
    sbomGeneratedByDevView: false,
    sbomGenerated: false,
    sbomAttested: false,
    cryptographicSignaturePresent: false,
    cryptographicSignatureVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
    rbacEnforced: false,
    permissionVerified: false,
    ...safetyFlags(),
    ...overrides,
  }
}

function packageProvenanceInputsRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-package-provenance-inputs-record',
    status: 'devview-package-provenance-inputs-recorded',
    provenanceInputsScope: 'package-provenance-inputs-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    packageMetadataSummary: {
      supplied: true,
      path: 'package.json',
      packageName: 'devview',
      packageVersion: '0.2.0-alpha',
      packagePrivate: true,
      packageFilesAllowlistPresent: true,
      packageFilesAllowlistCount: 14,
      packageJsonSha256: '1'.repeat(64),
      packageJsonByteLength: 2227,
    },
    sourceRefSummary: {
      sourceRefStatus: 'supplied-explicit-cli-input',
      value: 'cf9185403a128aebd9fb31c65e84fee39d39c632',
      sourceRefVerified: false,
      verificationMode: 'explicit-input-not-verified',
    },
    buildInputSummary: {
      buildCommandLabelStatus: 'supplied-metadata-only',
      buildCommandLabel: 'npm run build:cli',
      buildCommandExecuted: false,
    },
    sourceArtifactDigests: [
      {
        sourceKind: 'package-json',
        path: 'package.json',
        artifactRole: null,
        status: null,
        sha256: '1'.repeat(64),
        byteLength: 2227,
      },
    ],
    packageDigestStatus: 'not-computed-no-package-artifact-supplied',
    packageArtifactSupplied: false,
    packageArtifactSha256: null,
    provenanceAttestationStatus: 'not-generated',
    packageProvenanceFindings: [],
    downstreamActionPlan: ['Capture package artifact digest.'],
    packagePublished: false,
    publishingPerformed: false,
    packageArtifactGeneratedByDevView: false,
    packageArtifactGenerated: false,
    packageTarballGenerated: false,
    packageSigningPresent: false,
    packageSigned: false,
    packageSignaturePresent: false,
    packageSignatureVerified: false,
    sbomGeneratedByDevView: false,
    sbomGenerated: false,
    sbomAttested: false,
    provenanceAttestationPresent: false,
    provenanceAttested: false,
    releaseProvenanceAttested: false,
    npmProvenanceEnabled: false,
    slsaProvenanceGenerated: false,
    cryptographicSigningImplemented: false,
    cryptographicSignaturePresent: false,
    cryptographicSignatureVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
    keyManagementImplemented: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
    ...safetyFlags(),
    ...overrides,
  }
}

function packageArtifactDigestRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const sha256 = typeof overrides.sha256 === 'string' ? overrides.sha256 : packageSha256
  const { sha256: _unused, ...rest } = overrides
  return {
    schemaVersion: 1,
    artifactRole: 'devview-package-artifact-digest-record',
    status: 'devview-package-artifact-digest-recorded',
    digestScope: 'package-artifact-digest-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    artifactDigestStatus: 'matched-expected',
    sourcePackageArtifact: {
      path: '.tmp/devview-0.2.0-alpha.tgz',
      fileName: 'devview-0.2.0-alpha.tgz',
      byteLength: 31,
      sha256,
      extension: '.tgz',
      typeHint: 'npm-package-tarball',
      expectedSha256: sha256,
      expectedSha256Supplied: true,
      expectedSha256Match: true,
    },
    sourcePackageProvenanceInputs: {
      supplied: true,
      path: '.tmp/package-provenance-inputs.json',
      artifactRole: 'devview-package-provenance-inputs-record',
      status: 'devview-package-provenance-inputs-recorded',
      packageName: 'devview',
      packageVersion: '0.2.0-alpha',
      sourceArtifactDigestCount: 1,
      sourceRefStatus: 'supplied-explicit-cli-input',
      buildCommandLabelStatus: 'supplied-metadata-only',
      packageDigestStatus: 'not-computed-no-package-artifact-supplied',
      provenanceAttestationStatus: 'not-generated',
    },
    sourceReleaseSurfaceValidation: {
      supplied: false,
      path: null,
      artifactRole: null,
      status: null,
      packageName: null,
      packageVersion: null,
      packageFileCount: null,
      forbiddenFindingCount: null,
    },
    packageIdentitySummary: {
      packageName: 'devview',
      packageVersion: '0.2.0-alpha',
      packageIdentitySource: 'package-provenance-inputs',
      sourcesAgree: true,
    },
    sourceArtifactDigests: [
      {
        sourceKind: 'package-artifact',
        path: '.tmp/devview-0.2.0-alpha.tgz',
        artifactRole: null,
        status: null,
        sha256,
        byteLength: 31,
      },
    ],
    packageDigestRecordFindings: [],
    downstreamActionPlan: ['Validate a preexisting provenance attestation artifact.'],
    packageArtifactGeneratedByDevView: false,
    packageArtifactGenerated: false,
    packageTarballGenerated: false,
    packagePublished: false,
    publishingPerformed: false,
    packageSigningPresent: false,
    packageSigned: false,
    packageSignaturePresent: false,
    packageSignatureVerified: false,
    sbomGeneratedByDevView: false,
    sbomGenerated: false,
    sbomAttested: false,
    provenanceAttestationPresent: false,
    provenanceAttested: false,
    releaseProvenanceAttested: false,
    npmProvenanceEnabled: false,
    slsaProvenanceGenerated: false,
    cryptographicSigningImplemented: false,
    cryptographicSignaturePresent: false,
    cryptographicSignatureVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
    keyManagementImplemented: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
    ...safetyFlags(),
    ...rest,
  }
}

function releaseProvenanceReadinessReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    artifactRole: 'devview-release-provenance-readiness-report',
    status: 'devview-release-provenance-readiness-reported',
    releaseProvenanceReadinessStatus: 'not-ready-sbom-and-signing-missing',
    provenanceAttestationPresent: false,
    provenanceAttested: false,
    sbomReadiness: {
      sbomGenerated: false,
      sbomAttested: false,
    },
    packageSigningReadiness: {
      packageSigningPresent: false,
    },
    providerInvoked: false,
    networkCallMade: false,
    shellCommandsExecuted: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    cryptographicSignatureVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
    rbacEnforced: false,
    permissionVerified: false,
    ...overrides,
  }
}

function safetyFlags(): Record<string, unknown> {
  return {
    enterpriseGateActivated: false,
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
  }
}

function expectSafetyFalse(payload: Record<string, unknown>): void {
  expect(payload.provenanceAttestationGeneratedByDevView).toBe(false)
  expect(payload.provenanceAttestationGenerated).toBe(false)
  expect(payload.provenanceAttestationVerified).toBe(false)
  expect(payload.provenanceAttestationPresent).toBe(false)
  expect(payload.provenanceAttested).toBe(false)
  expect(payload.releaseProvenanceAttested).toBe(false)
  expect(payload.packagePublished).toBe(false)
  expect(payload.packageArtifactGeneratedByDevView).toBe(false)
  expect(payload.packageArtifactGenerated).toBe(false)
  expect(payload.packageTarballGenerated).toBe(false)
  expect(payload.packageSigned).toBe(false)
  expect(payload.packageSigningPresent).toBe(false)
  expect(payload.packageSignaturePresent).toBe(false)
  expect(payload.packageSignatureVerified).toBe(false)
  expect(payload.sbomGeneratedByDevView).toBe(false)
  expect(payload.sbomGenerated).toBe(false)
  expect(payload.sbomAttested).toBe(false)
  expect(payload.cryptographicSignaturePresent).toBe(false)
  expect(payload.cryptographicSignatureVerified).toBe(false)
  expect(payload.keyGenerated).toBe(false)
  expect(payload.privateKeyStored).toBe(false)
  expect(payload.rbacEnforced).toBe(false)
  expect(payload.permissionVerified).toBe(false)
  expect(payload.enterpriseGateActivated).toBe(false)
  expect(payload.providerInvoked).toBe(false)
  expect(payload.networkCallMade).toBe(false)
  expect(payload.apiCallMade).toBe(false)
  expect(payload.shellCommandsExecuted).toBe(false)
  expect(payload.extensionExecutionAllowed).toBe(false)
  expect(payload.extensionsExecuted).toBe(false)
  expect(payload.filesMutated).toBe(false)
  expect(payload.graphSourceMutated).toBe(false)
  expect(payload.graphDeltaApplied).toBe(false)
  expect(payload.runtimeEvidenceSatisfied).toBe(false)
  expect(payload.evidenceAccepted).toBe(false)
  expect(payload.equivalenceProven).toBe(false)
  expect(payload.scopeEnforced).toBe(false)
  expect(payload.ciEnforcementEnabled).toBe(false)
  expect(payload.hooksActivated).toBe(false)
  expect(payload.approvalAutomationEnabled).toBe(false)
  expect(payload.userAcceptanceAutomated).toBe(false)
}
