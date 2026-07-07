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

describe('security record-package-provenance-inputs CLI', () => {
  it('records default package metadata and package.json digest without creating package artifacts', async () => {
    const workspace = createWorkspace()

    const result = await runPackageProvenanceInputs(workspace, [], '.tmp/package-provenance-inputs.json', [
      '--markdown',
      '.tmp/package-provenance-inputs.md',
    ])
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/package-provenance-inputs.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-package-provenance-inputs-record')
    expect(payload.status).toBe('devview-package-provenance-inputs-recorded')
    expect(payload.provenanceInputsScope).toBe('package-provenance-inputs-report-only')
    expect(payload.packageProvenanceInputsStatus).toBe('recorded-source-inputs-only')
    expect(payload.packageMetadataSummary.packageName).toBe('devview')
    expect(payload.packageMetadataSummary.packageVersion).toBe('0.2.0-alpha')
    expect(payload.packageMetadataSummary.packageFilesAllowlistPresent).toBe(true)
    expect(payload.packageMetadataSummary.packageFilesAllowlistCount).toBeGreaterThan(0)
    expect(payload.packageMetadataSummary.packageJsonSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(payload.packageMetadataSummary.packageJsonByteLength).toBeGreaterThan(0)
    expect(payload.sourceRefSummary.sourceRefStatus).toBe('not-supplied')
    expect(payload.sourceRefSummary.sourceRefVerified).toBe(false)
    expect(payload.buildInputSummary.buildCommandLabelStatus).toBe('not-supplied')
    expect(payload.buildInputSummary.buildCommandExecuted).toBe(false)
    expect(payload.sourceArtifactDigests.map((entry: { sourceKind: string }) => entry.sourceKind)).toEqual([
      'package-json',
    ])
    expect(payload.packageDigestStatus).toBe('not-computed-no-package-artifact-supplied')
    expect(payload.provenanceAttestationStatus).toBe('not-generated')
    expect(written.writtenMarkdownPath).toBe('.tmp/package-provenance-inputs.md')
    expect(existsSync(join(workspace, '.tmp/package-provenance-inputs.md'))).toBe(true)
    expectSafetyFalse(payload)
  })

  it('summarizes release surface, release provenance readiness, SBOM validation, source ref, and build labels', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/release-surface.json'), releaseSurfaceValidationReport())
    writeJson(join(workspace, '.tmp/release-provenance-readiness.json'), releaseProvenanceReadinessReport())
    writeJson(join(workspace, '.tmp/sbom-validation.json'), sbomValidationReport())

    const result = await runPackageProvenanceInputs(
      workspace,
      [
        '--release-surface-validation',
        '.tmp/release-surface.json',
        '--release-provenance-readiness',
        '.tmp/release-provenance-readiness.json',
        '--sbom-validation',
        '.tmp/sbom-validation.json',
        '--source-ref',
        'dd3a36e42a26efa247284c5b3b198d5fdf0bbb3e',
        '--build-command',
        'npm run build:cli',
      ],
      '.tmp/package-provenance-inputs.json',
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.sourceRefSummary).toEqual(
      expect.objectContaining({
        sourceRefStatus: 'supplied-explicit-cli-input',
        value: 'dd3a36e42a26efa247284c5b3b198d5fdf0bbb3e',
        sourceRefVerified: false,
        verificationMode: 'explicit-input-not-verified',
      }),
    )
    expect(payload.buildInputSummary).toEqual(
      expect.objectContaining({
        buildCommandLabelStatus: 'supplied-metadata-only',
        buildCommandLabel: 'npm run build:cli',
        buildCommandExecuted: false,
      }),
    )
    expect(payload.releaseSurfaceSourceSummary).toEqual(
      expect.objectContaining({
        supplied: true,
        artifactRole: 'devview-release-surface-validation-report',
        status: 'devview-release-surface-validation-passed',
        packageName: 'devview',
        packageVersion: '0.2.0-alpha',
        packageFileCount: 14,
        forbiddenFindingCount: 0,
      }),
    )
    expect(payload.releaseProvenanceReadinessSummary).toEqual(
      expect.objectContaining({
        supplied: true,
        artifactRole: 'devview-release-provenance-readiness-report',
        status: 'devview-release-provenance-readiness-reported',
        releaseProvenanceReadinessStatus: 'not-ready-sbom-and-signing-missing',
        sbomGenerated: false,
        packageSigningPresent: false,
        provenanceAttested: false,
      }),
    )
    expect(payload.sbomValidationSummary).toEqual(
      expect.objectContaining({
        supplied: true,
        artifactRole: 'devview-sbom-validation-report',
        status: 'devview-sbom-validation-passed',
        sbomValidationStatus: 'validated-structural-source-fact-only',
        sbomFormat: 'devview-minimal-sbom-v1',
        sbomSha256: '0'.repeat(64),
        packageIdentityAlignmentStatus: 'matched',
        componentCount: 2,
      }),
    )
    expect(payload.sourceArtifactDigests.map((entry: { sourceKind: string }) => entry.sourceKind)).toEqual([
      'package-json',
      'release-surface-validation',
      'release-provenance-readiness',
      'sbom-validation',
    ])
    expect(payload.packageProvenanceFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'PACKAGE_PROVENANCE_RELEASE_SURFACE_SOURCE_LINKED',
        'PACKAGE_PROVENANCE_RELEASE_PROVENANCE_READINESS_LINKED',
        'PACKAGE_PROVENANCE_SBOM_VALIDATION_LINKED',
        'PACKAGE_PROVENANCE_BUILD_COMMAND_LABEL_RECORDED',
        'PACKAGE_PROVENANCE_SOURCE_REF_RECORDED',
      ]),
    )
    expectSafetyFalse(payload)
  })

  it('blocks wrong source role/status and package identity mismatches with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-release-surface.json'), {
      ...releaseSurfaceValidationReport(),
      status: 'devview-release-surface-validation-failed',
    })
    writeJson(join(workspace, '.tmp/wrong-release-provenance.json'), {
      ...releaseProvenanceReadinessReport(),
      status: 'wrong',
    })
    writeJson(join(workspace, '.tmp/wrong-sbom-validation.json'), {
      ...sbomValidationReport(),
      status: 'devview-sbom-validation-blocked',
    })
    writeJson(join(workspace, '.tmp/mismatch-sbom-validation.json'), {
      ...sbomValidationReport(),
      sourceSbomArtifact: {
        ...(sbomValidationReport().sourceSbomArtifact as Record<string, unknown>),
        packageName: 'other',
      },
    })

    const cases = [
      {
        args: ['--release-surface-validation', '.tmp/wrong-release-surface.json'],
        output: '.tmp/wrong-release-surface-output.json',
        code: 'PACKAGE_PROVENANCE_RELEASE_SURFACE_SOURCE_ROLE_STATUS_INVALID',
      },
      {
        args: ['--release-provenance-readiness', '.tmp/wrong-release-provenance.json'],
        output: '.tmp/wrong-release-provenance-output.json',
        code: 'PACKAGE_PROVENANCE_RELEASE_PROVENANCE_SOURCE_ROLE_STATUS_INVALID',
      },
      {
        args: ['--sbom-validation', '.tmp/wrong-sbom-validation.json'],
        output: '.tmp/wrong-sbom-validation-output.json',
        code: 'PACKAGE_PROVENANCE_SBOM_VALIDATION_SOURCE_ROLE_STATUS_INVALID',
      },
      {
        args: ['--sbom-validation', '.tmp/mismatch-sbom-validation.json'],
        output: '.tmp/mismatch-sbom-validation-output.json',
        code: 'PACKAGE_PROVENANCE_PACKAGE_NAME_MISMATCH',
      },
    ]

    for (const entry of cases) {
      const result = await runPackageProvenanceInputs(workspace, entry.args, entry.output)
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((issue: { code: string }) => issue.code)).toContain(entry.code)
      expect(existsSync(join(workspace, entry.output))).toBe(false)
    }
  })

  it('blocks authority claims and unsafe metadata labels with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/signed-sbom-validation.json'), { ...sbomValidationReport(), packageSigned: true })
    writeJson(join(workspace, '.tmp/provenance-release.json'), {
      ...releaseProvenanceReadinessReport(),
      provenanceAttestationReadiness: {
        provenanceAttested: true,
      },
    })
    writeJson(join(workspace, '.tmp/network-release-surface.json'), {
      ...releaseSurfaceValidationReport(),
      networkCallMade: true,
    })

    const cases = [
      {
        args: ['--sbom-validation', '.tmp/signed-sbom-validation.json'],
        output: '.tmp/signed-sbom-validation-output.json',
        code: 'PACKAGE_PROVENANCE_AUTHORITY_CLAIM_UNSUPPORTED',
      },
      {
        args: ['--release-provenance-readiness', '.tmp/provenance-release.json'],
        output: '.tmp/provenance-release-output.json',
        code: 'PACKAGE_PROVENANCE_AUTHORITY_CLAIM_UNSUPPORTED',
      },
      {
        args: ['--release-surface-validation', '.tmp/network-release-surface.json'],
        output: '.tmp/network-release-surface-output.json',
        code: 'PACKAGE_PROVENANCE_UNSAFE_SOURCE_AUTHORITY_FLAG',
      },
      {
        args: ['--build-command', 'npm run build:cli && npm test'],
        output: '.tmp/build-label-output.json',
        code: 'PACKAGE_PROVENANCE_METADATA_LABEL_UNSAFE',
      },
    ]

    for (const entry of cases) {
      const result = await runPackageProvenanceInputs(workspace, entry.args, entry.output)
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((issue: { code: string }) => issue.code)).toContain(entry.code)
      expect(existsSync(join(workspace, entry.output))).toBe(false)
    }
  })

  it('blocks output collisions, source overwrites, package.json overwrite, and protected paths', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/package.json'), { name: 'devview', version: '0.2.0-alpha', files: ['skills/**'] })
    writeJson(join(workspace, '.tmp/sbom-validation.json'), sbomValidationReport())

    const cases = [
      {
        args: ['--sbom-validation', '.tmp/sbom-validation.json'],
        output: '.tmp/sbom-validation.json',
        expected: 'would overwrite a source input',
      },
      {
        args: ['--package-json', '.tmp/package.json'],
        output: '.tmp/package.json',
        expected: 'would overwrite a source input',
      },
      {
        args: [],
        output: '.tmp/package-provenance-inputs.json',
        markdown: '.tmp/package-provenance-inputs.json',
        expected: 'must be different',
      },
      {
        args: [],
        output: join('.devview', 'generated', 'package-provenance-inputs.json'),
        expected: 'inside a protected control path',
      },
    ]

    for (const entry of cases) {
      const result = await runPackageProvenanceInputs(
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

    const first = await runPackageProvenanceInputs(workspace, [], '.tmp/package-provenance-inputs.json')
    const firstContent = readFileSync(join(workspace, '.tmp/package-provenance-inputs.json'), 'utf8')
    const second = await runPackageProvenanceInputs(workspace, [], '.tmp/package-provenance-inputs.json')
    const secondContent = readFileSync(join(workspace, '.tmp/package-provenance-inputs.json'), 'utf8')

    expect(first.exitCode).toBe(ExitCode.Success)
    expect(second.exitCode).toBe(ExitCode.Success)
    expect(secondContent).toBe(firstContent)
  })
})

function runPackageProvenanceInputs(workspace: string, args: string[], output: string, extraArgs: string[] = []) {
  return runDevViewCli(
    ['security', 'record-package-provenance-inputs', ...args, '--output', output, ...extraArgs, '--json'],
    {
      cwd: workspace,
      pluginRoot,
    },
  )
}

function releaseSurfaceValidationReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    artifactRole: 'devview-release-surface-validation-report',
    status: 'devview-release-surface-validation-passed',
    packageName: 'devview',
    packageVersion: '0.2.0-alpha',
    dryRun: true,
    packageFileCount: 14,
    packageFiles: ['package.json', 'skills/devview-start/SKILL.md'],
    forbiddenFindingCount: 0,
    forbiddenFindings: [],
    filesMutated: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    providerInvoked: false,
    networkCallMade: false,
    ...overrides,
  }
}

function releaseProvenanceReadinessReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-release-provenance-readiness-report',
    status: 'devview-release-provenance-readiness-reported',
    readinessScope: 'release-provenance-sbom-readiness-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    releaseProvenanceReadinessStatus: 'not-ready-sbom-and-signing-missing',
    packageMetadataSummary: {
      packageName: 'devview',
      packageVersion: '0.2.0-alpha',
      packagePrivate: true,
      packageJsonPath: 'package.json',
      packageFilesAllowlistPresent: true,
      packageFilesAllowlistCount: 14,
    },
    sbomReadiness: {
      sbomPresent: false,
      sbomGenerated: false,
      sbomAttested: false,
    },
    packageSigningReadiness: {
      packageSigningPresent: false,
      packageSignatureVerified: false,
    },
    provenanceAttestationReadiness: {
      provenanceAttestationPresent: false,
      provenanceAttested: false,
    },
    releaseProvenanceFindings: [{ severity: 'blocker', code: 'RELEASE_PROVENANCE_ATTESTATION_MISSING' }],
    downstreamActionPlan: ['Record package provenance inputs.'],
    sbomGenerated: false,
    packageSigned: false,
    provenanceAttested: false,
    cryptographicSignatureVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
    rbacEnforced: false,
    permissionVerified: false,
    ...safetyFlags(),
    ...overrides,
  }
}

function sbomValidationReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-sbom-validation-report',
    status: 'devview-sbom-validation-passed',
    validationScope: 'sbom-artifact-validation-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    sbomValidationStatus: 'validated-structural-source-fact-only',
    sourceSbomArtifact: {
      path: '.tmp/sbom-artifact.json',
      artifactRole: 'devview-sbom-artifact',
      status: 'devview-sbom-artifact-supplied',
      sbomScope: 'package-sbom-source-fact-only',
      sbomFormat: 'devview-minimal-sbom-v1',
      packageName: 'devview',
      packageVersion: '0.2.0-alpha',
      componentCount: 2,
    },
    packageIdentityAlignment: {
      alignmentStatus: 'matched',
    },
    componentCoverageSummary: {
      componentCount: 2,
      packageRootComponentPresent: true,
      dependencyComponentCount: 1,
    },
    digestSummary: {
      sbomSha256: '0'.repeat(64),
      sbomByteLength: 1024,
      sourceArtifactDigests: [{ sourceKind: 'sbom', path: '.tmp/sbom-artifact.json', sha256: '0'.repeat(64) }],
    },
    validationFindings: [{ severity: 'gap', code: 'SBOM_VALIDATION_NOT_ATTESTED' }],
    downstreamActionPlan: ['Record package provenance inputs.'],
    sbomGeneratedByDevView: false,
    sbomGenerated: false,
    sbomAttested: false,
    packageSigned: false,
    packageSigningPresent: false,
    provenanceAttested: false,
    cryptographicSignatureVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
    rbacEnforced: false,
    permissionVerified: false,
    ...safetyFlags(),
    ...overrides,
  }
}

function safetyFlags(): Record<string, unknown> {
  return {
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
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
    benchmarkExecuted: false,
    candidateExecuted: false,
    graphifyExecuted: false,
    nativeBenchmarkExecuted: false,
  }
}

function expectSafetyFalse(payload: Record<string, unknown>): void {
  expect(payload.packagePublished).toBe(false)
  expect(payload.publishingPerformed).toBe(false)
  expect(payload.packageArtifactGeneratedByDevView).toBe(false)
  expect(payload.packageArtifactGenerated).toBe(false)
  expect(payload.packageTarballGenerated).toBe(false)
  expect(payload.packageSigningPresent).toBe(false)
  expect(payload.packageSigned).toBe(false)
  expect(payload.packageSignaturePresent).toBe(false)
  expect(payload.packageSignatureVerified).toBe(false)
  expect(payload.sbomGeneratedByDevView).toBe(false)
  expect(payload.sbomGenerated).toBe(false)
  expect(payload.sbomAttested).toBe(false)
  expect(payload.provenanceAttestationPresent).toBe(false)
  expect(payload.provenanceAttested).toBe(false)
  expect(payload.releaseProvenanceAttested).toBe(false)
  expect(payload.npmProvenanceEnabled).toBe(false)
  expect(payload.slsaProvenanceGenerated).toBe(false)
  expect(payload.cryptographicSigningImplemented).toBe(false)
  expect(payload.cryptographicSignaturePresent).toBe(false)
  expect(payload.cryptographicSignatureVerified).toBe(false)
  expect(payload.keyGenerated).toBe(false)
  expect(payload.privateKeyStored).toBe(false)
  expect(payload.keyManagementImplemented).toBe(false)
  expect(payload.keyRegistryCreated).toBe(false)
  expect(payload.trustRootCreated).toBe(false)
  expect(payload.rbacEnforced).toBe(false)
  expect(payload.permissionVerified).toBe(false)
  expect(payload.rbacPermissionVerified).toBe(false)
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
