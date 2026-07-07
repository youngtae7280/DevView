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

describe('security report-enterprise-readiness CLI', () => {
  it('generates a report-only enterprise readiness aggregate from benchmark governance and release surface sources', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/benchmark-governance.json'), benchmarkGovernanceReport())
    writeJson(join(workspace, '.tmp/release-surface.json'), releaseSurfaceReport())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--benchmark-governance-verification',
        '.tmp/benchmark-governance.json',
        '--release-surface-validation',
        '.tmp/release-surface.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--markdown',
        '.tmp/enterprise-readiness.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/enterprise-readiness.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-enterprise-readiness-report')
    expect(payload.status).toBe('devview-enterprise-readiness-report-generated')
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.benchmarkGovernanceReadiness.status).toBe('verified-for-static-benchmark-only')
    expect(payload.releaseSurfaceReadiness.status).toBe('satisfied')
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'ENTERPRISE_STATIC_BENCHMARK_GOVERNANCE_VERIFIED',
        'ENTERPRISE_RELEASE_SURFACE_VALIDATION_PASSED',
        'ENTERPRISE_RBAC_SIGNING_MISSING',
        'ENTERPRISE_PROVIDER_NETWORK_POLICY_MISSING',
        'ENTERPRISE_CI_ACTIVATION_GOVERNANCE_MISSING',
      ]),
    )
    expect(written.writtenMarkdownPath).toBe('.tmp/enterprise-readiness.md')
    expect(existsSync(join(workspace, '.tmp/enterprise-readiness.md'))).toBe(true)
    expectSafetyFalse(payload)
  })

  it('summarizes provider/network default-deny policy report without making enterprise-ready claims', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/benchmark-governance.json'), benchmarkGovernanceReport())
    writeJson(join(workspace, '.tmp/release-surface.json'), releaseSurfaceReport())
    writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--benchmark-governance-verification',
        '.tmp/benchmark-governance.json',
        '--release-surface-validation',
        '.tmp/release-surface.json',
        '--provider-network-policy-report',
        '.tmp/provider-network-policy-report.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.sourceProviderNetworkPolicyReport.status).toBe(
      'devview-provider-network-default-deny-policy-recorded',
    )
    expect(payload.sourceProviderNetworkPolicyReport.defaultProviderPolicy).toBe('deny')
    expect(payload.sourceProviderNetworkPolicyReport.defaultNetworkPolicy).toBe('deny')
    expect(payload.sourceProviderNetworkPolicyReport.explicitAllowSupported).toBe(false)
    expect(payload.sourceProviderNetworkPolicyReport.providerAllowlistCount).toBe(0)
    expect(payload.sourceProviderNetworkPolicyReport.networkAllowlistCount).toBe(0)
    expect(payload.sourceProviderNetworkPolicyReport.futureAllowRequirementCount).toBe(2)
    expect(payload.sourceProviderNetworkPolicyReport.blockedCapabilityCount).toBe(3)
    expect(payload.providerNetworkPolicyReadiness.status).toBe('default-deny-recorded')
    expect(payload.providerNetworkPolicyReadiness.providerAllowlistEmpty).toBe(true)
    expect(payload.providerNetworkPolicyReadiness.networkAllowlistEmpty).toBe(true)
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'ENTERPRISE_PROVIDER_NETWORK_POLICY_DEFAULT_DENY_RECORDED',
        'ENTERPRISE_RBAC_SIGNING_MISSING',
        'ENTERPRISE_CI_ACTIVATION_GOVERNANCE_MISSING',
      ]),
    )
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).not.toContain(
      'ENTERPRISE_PROVIDER_NETWORK_POLICY_MISSING',
    )
    expectSafetyFalse(payload)
  })

  it('summarizes unsigned record envelope preview as audit/tamper source fact without enterprise-ready claims', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/benchmark-governance.json'), benchmarkGovernanceReport())
    writeJson(join(workspace, '.tmp/release-surface.json'), releaseSurfaceReport())
    writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())
    writeJson(join(workspace, '.tmp/record-envelope-preview.json'), recordEnvelopePreview())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--benchmark-governance-verification',
        '.tmp/benchmark-governance.json',
        '--release-surface-validation',
        '.tmp/release-surface.json',
        '--provider-network-policy-report',
        '.tmp/provider-network-policy-report.json',
        '--record-envelope-preview',
        '.tmp/record-envelope-preview.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.sourceRecordEnvelopePreviews).toHaveLength(1)
    expect(payload.sourceRecordEnvelopePreviews[0]).toEqual(
      expect.objectContaining({
        path: '.tmp/record-envelope-preview.json',
        artifactRole: 'devview-record-envelope-preview',
        status: 'devview-record-envelope-previewed',
        payloadArtifactRole: 'devview-rbac-readiness-report',
        payloadStatus: 'devview-rbac-readiness-reported',
        payloadSha256Present: true,
        envelopeSha256Present: true,
        sourceArtifactDigestCount: 1,
        actorIdentityRecorded: true,
        requiredPermission: 'audit.verify',
        signatureMode: 'unsigned-deterministic-preview',
        cryptographicSignaturePresent: false,
        cryptographicSignatureVerified: false,
        rbacEnforced: false,
        permissionVerified: false,
        previousEnvelopeLinked: false,
      }),
    )
    expect(payload.rbacAndSigningReadiness.status).toBe('gap')
    expect(payload.rbacAndSigningReadiness.signedRecordEnvelopePresent).toBe(false)
    expect(payload.rbacAndSigningReadiness.unsignedRecordEnvelopePreviewPresent).toBe(true)
    expect(payload.rbacAndSigningReadiness.recordedActorIdentityCount).toBe(1)
    expect(payload.rbacAndSigningReadiness.recordedPermissionClaimCount).toBe(1)
    expect(payload.auditAndTamperEvidenceReadiness.unsignedRecordEnvelopePreviewPresent).toBe(true)
    expect(payload.auditAndTamperEvidenceReadiness.envelopePreviewCount).toBe(1)
    expect(payload.auditAndTamperEvidenceReadiness.envelopePayloadHashRecordedCount).toBe(1)
    expect(payload.auditAndTamperEvidenceReadiness.envelopeSourceArtifactDigestCount).toBe(1)
    expect(payload.auditAndTamperEvidenceReadiness.previousEnvelopeLinkedCount).toBe(0)
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'ENTERPRISE_RECORD_ENVELOPE_PREVIEW_RECORDED',
        'ENTERPRISE_RBAC_SIGNING_MISSING',
        'ENTERPRISE_CI_ACTIVATION_GOVERNANCE_MISSING',
      ]),
    )
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).not.toContain(
      'ENTERPRISE_RECORD_ENVELOPE_PREVIEW_NOT_SUPPLIED',
    )
    expectSafetyFalse(payload)
  })

  it('summarizes record envelope verification separately from unsigned preview facts', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/benchmark-governance.json'), benchmarkGovernanceReport())
    writeJson(join(workspace, '.tmp/release-surface.json'), releaseSurfaceReport())
    writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())
    writeJson(join(workspace, '.tmp/record-envelope-preview.json'), recordEnvelopePreview())
    writeJson(join(workspace, '.tmp/record-envelope-verification.json'), recordEnvelopeVerification())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--benchmark-governance-verification',
        '.tmp/benchmark-governance.json',
        '--release-surface-validation',
        '.tmp/release-surface.json',
        '--provider-network-policy-report',
        '.tmp/provider-network-policy-report.json',
        '--record-envelope-preview',
        '.tmp/record-envelope-preview.json',
        '--record-envelope-verification',
        '.tmp/record-envelope-verification.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.sourceRecordEnvelopeVerifications).toHaveLength(1)
    expect(payload.sourceRecordEnvelopeVerifications[0]).toEqual(
      expect.objectContaining({
        path: '.tmp/record-envelope-verification.json',
        artifactRole: 'devview-record-envelope-verification-report',
        status: 'devview-record-envelope-verified',
        sourcePreviewPath: '.tmp/record-envelope-preview.json',
        payloadDigestMatches: true,
        sourceArtifactExpectedCount: 1,
        sourceArtifactActualCount: 1,
        allSourceDigestsMatch: true,
        previousEnvelopeChainLinkVerified: false,
        signatureVerificationMode: 'not-performed-unsigned-preview-only',
        cryptographicSignatureVerified: false,
        rbacPermissionVerified: false,
        rbacEnforced: false,
        permissionVerified: false,
      }),
    )
    expect(payload.rbacAndSigningReadiness.signedRecordEnvelopePresent).toBe(false)
    expect(payload.rbacAndSigningReadiness.unsignedRecordEnvelopePreviewCount).toBe(1)
    expect(payload.rbacAndSigningReadiness.recordEnvelopeVerificationCount).toBe(1)
    expect(payload.rbacAndSigningReadiness.payloadDigestVerifiedCount).toBe(1)
    expect(payload.rbacAndSigningReadiness.sourceDigestsVerifiedCount).toBe(1)
    expect(payload.rbacAndSigningReadiness.previousEnvelopeChainLinkVerifiedCount).toBe(0)
    expect(payload.auditAndTamperEvidenceReadiness.envelopePreviewCount).toBe(1)
    expect(payload.auditAndTamperEvidenceReadiness.envelopeVerificationCount).toBe(1)
    expect(payload.auditAndTamperEvidenceReadiness.envelopePayloadDigestVerifiedCount).toBe(1)
    expect(payload.auditAndTamperEvidenceReadiness.envelopeSourceDigestsVerifiedCount).toBe(1)
    expect(payload.auditAndTamperEvidenceReadiness.previousEnvelopeChainLinkVerifiedCount).toBe(0)
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'ENTERPRISE_RECORD_ENVELOPE_PREVIEW_RECORDED',
        'ENTERPRISE_RECORD_ENVELOPE_VERIFICATION_RECORDED',
        'ENTERPRISE_RBAC_SIGNING_MISSING',
      ]),
    )
    expectSafetyFalse(payload)
  })

  it('summarizes multiple record envelope verification inputs from repeated options', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/verification-a.json'), recordEnvelopeVerification())
    writeJson(
      join(workspace, '.tmp/verification-b.json'),
      recordEnvelopeVerification({
        previousEnvelopeVerification: {
          required: true,
          supplied: true,
          expectedSha256: 'e'.repeat(64),
          actualSha256: 'e'.repeat(64),
          digestMatches: true,
          chainLinkVerified: true,
          expectedPath: '.tmp/previous.envelope.json',
          actualPath: '.tmp/previous.envelope.json',
          pathMatches: true,
        },
      }),
    )

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--record-envelope-verification',
        '.tmp/verification-a.json',
        '--record-envelope-verification',
        '.tmp/verification-b.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.sourceRecordEnvelopeVerifications).toHaveLength(2)
    expect(payload.rbacAndSigningReadiness.recordEnvelopeVerificationCount).toBe(2)
    expect(payload.rbacAndSigningReadiness.payloadDigestVerifiedCount).toBe(2)
    expect(payload.rbacAndSigningReadiness.sourceDigestsVerifiedCount).toBe(2)
    expect(payload.rbacAndSigningReadiness.previousEnvelopeChainLinkVerifiedCount).toBe(1)
    expect(payload.auditAndTamperEvidenceReadiness.envelopeVerificationCount).toBe(2)
    expect(payload.readinessLevel).toBe('not-ready')
    expectSafetyFalse(payload)
  })

  it('summarizes signing/key governance readiness as a source fact without enterprise-ready claims', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/signing-readiness.json'), signingReadinessReport())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--signing-readiness',
        '.tmp/signing-readiness.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.sourceSigningReadinessReports).toHaveLength(1)
    expect(payload.sourceSigningReadinessReports[0]).toEqual(
      expect.objectContaining({
        path: '.tmp/signing-readiness.json',
        artifactRole: 'devview-signing-readiness-report',
        status: 'devview-signing-readiness-reported',
        signingReadinessStatus: 'not-ready-policy-and-key-governance-missing',
        envelopePreviewCount: 1,
        envelopeVerificationCount: 1,
        payloadDigestVerifiedCount: 1,
        sourceDigestVerifiedCount: 1,
        signedEnvelopeCount: 0,
        keyGovernanceStatus: 'not-ready',
        keyRegistryPresent: false,
        trustRootPresent: false,
        privateKeyStoragePresent: false,
        noPrivateKeyStorageInRepo: true,
        signaturePolicyStatus: 'not-ready',
        detachedSignaturePolicyPresent: false,
        signatureFormatPolicyPresent: false,
        rbacActorModelPresent: true,
        rbacPermissionMatrixPresent: true,
        rbacRoleAssignmentRegistryPresent: false,
        rbacEnforced: false,
        permissionVerificationEnforced: false,
        futureSignedEnvelopeRequirementCount: 2,
      }),
    )
    expect(payload.rbacAndSigningReadiness.signingReadinessReportPresent).toBe(true)
    expect(payload.rbacAndSigningReadiness.signingReadinessReportCount).toBe(1)
    expect(payload.rbacAndSigningReadiness.signingReadinessStatus).toBe('not-ready-policy-and-key-governance-missing')
    expect(payload.rbacAndSigningReadiness.keyRegistryPresentCount).toBe(0)
    expect(payload.rbacAndSigningReadiness.trustRootPresentCount).toBe(0)
    expect(payload.rbacAndSigningReadiness.privateKeyStoragePresentCount).toBe(0)
    expect(payload.rbacAndSigningReadiness.noPrivateKeyStorageInRepoCount).toBe(1)
    expect(payload.rbacAndSigningReadiness.signaturePolicyPresentCount).toBe(0)
    expect(payload.rbacAndSigningReadiness.rbacPrerequisiteActorModelPresentCount).toBe(1)
    expect(payload.rbacAndSigningReadiness.rbacPrerequisitePermissionMatrixPresentCount).toBe(1)
    expect(payload.rbacAndSigningReadiness.rbacRoleAssignmentRegistryPresentCount).toBe(0)
    expect(payload.rbacAndSigningReadiness.futureSignedEnvelopeRequirementCount).toBe(2)
    expect(payload.rbacAndSigningReadiness.signedRecordEnvelopePresent).toBe(false)
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining(['ENTERPRISE_SIGNING_READINESS_RECORDED', 'ENTERPRISE_RBAC_SIGNING_MISSING']),
    )
    expectSafetyFalse(payload)
  })

  it('summarizes RBAC policy validation as declarative source fact without enforcement claims', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/rbac-policy-validation.json'), rbacPolicyValidationReport())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--rbac-policy-validation',
        '.tmp/rbac-policy-validation.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.sourceRbacPolicyValidationReports).toHaveLength(1)
    expect(payload.sourceRbacPolicyValidationReports[0]).toEqual(
      expect.objectContaining({
        path: '.tmp/rbac-policy-validation.json',
        artifactRole: 'devview-rbac-policy-validation-report',
        status: 'devview-rbac-policy-validation-passed',
        rbacPolicyValidationStatus: 'passed',
        defaultDenyConfigured: true,
        actorCount: 2,
        roleAssignmentCount: 2,
        permissionGrantCount: 2,
        automationRestrictionDeclared: true,
        automationOvergrantCount: 0,
        extensionAuthorRestrictionDeclared: true,
        extensionAuthorOvergrantCount: 0,
        policyFindingCount: 1,
        downstreamActionCount: 2,
        rbacEnforced: false,
        permissionVerified: false,
        cryptographicSignaturePresent: false,
        cryptographicSignatureVerified: false,
      }),
    )
    expect(payload.rbacAndSigningReadiness.rbacPolicyValidationReportPresent).toBe(true)
    expect(payload.rbacAndSigningReadiness.rbacPolicyValidationReportCount).toBe(1)
    expect(payload.rbacAndSigningReadiness.rbacPolicyValidationStatuses).toEqual(['passed'])
    expect(payload.rbacAndSigningReadiness.defaultDenyPolicyValidatedCount).toBe(1)
    expect(payload.rbacAndSigningReadiness.validatedRbacActorCount).toBe(2)
    expect(payload.rbacAndSigningReadiness.validatedRbacRoleAssignmentCount).toBe(2)
    expect(payload.rbacAndSigningReadiness.validatedRbacPermissionGrantCount).toBe(2)
    expect(payload.rbacAndSigningReadiness.automationRestrictionDeclaredCount).toBe(1)
    expect(payload.rbacAndSigningReadiness.extensionAuthorRestrictionDeclaredCount).toBe(1)
    expect(payload.rbacAndSigningReadiness.rbacPolicyValidationFindingCount).toBe(1)
    expect(payload.rbacAndSigningReadiness.rbacPolicyValidationDownstreamActionCount).toBe(2)
    expect(payload.rbacAndSigningReadiness.signedRecordEnvelopePresent).toBe(false)
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining(['ENTERPRISE_RBAC_POLICY_VALIDATION_RECORDED', 'ENTERPRISE_RBAC_SIGNING_MISSING']),
    )
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).not.toContain(
      'ENTERPRISE_RBAC_POLICY_VALIDATION_NOT_SUPPLIED',
    )
    expectSafetyFalse(payload)
  })

  it('blocks invalid or authority-claiming RBAC policy validation sources with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-rbac-policy-validation.json'), {
      ...rbacPolicyValidationReport(),
      status: 'devview-rbac-policy-validation-blocked',
    })
    writeJson(join(workspace, '.tmp/enforced-rbac-policy-validation.json'), {
      ...rbacPolicyValidationReport(),
      rbacEnforced: true,
    })
    writeJson(join(workspace, '.tmp/signed-rbac-policy-validation.json'), {
      ...rbacPolicyValidationReport(),
      cryptographicSignaturePresent: true,
    })
    writeJson(join(workspace, '.tmp/key-rbac-policy-validation.json'), {
      ...rbacPolicyValidationReport(),
      keyGenerated: true,
    })
    writeJson(join(workspace, '.tmp/unsafe-rbac-policy-validation.json'), {
      ...rbacPolicyValidationReport(),
      networkCallMade: true,
    })

    const wrong = await runEnterpriseWithRbacPolicyValidation(
      workspace,
      '.tmp/wrong-rbac-policy-validation.json',
      '.tmp/wrong-rbac-policy-enterprise.json',
    )
    const enforced = await runEnterpriseWithRbacPolicyValidation(
      workspace,
      '.tmp/enforced-rbac-policy-validation.json',
      '.tmp/enforced-rbac-policy-enterprise.json',
    )
    const signed = await runEnterpriseWithRbacPolicyValidation(
      workspace,
      '.tmp/signed-rbac-policy-validation.json',
      '.tmp/signed-rbac-policy-enterprise.json',
    )
    const key = await runEnterpriseWithRbacPolicyValidation(
      workspace,
      '.tmp/key-rbac-policy-validation.json',
      '.tmp/key-rbac-policy-enterprise.json',
    )
    const unsafe = await runEnterpriseWithRbacPolicyValidation(
      workspace,
      '.tmp/unsafe-rbac-policy-validation.json',
      '.tmp/unsafe-rbac-policy-enterprise.json',
    )

    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_RBAC_POLICY_VALIDATION_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-rbac-policy-enterprise.json'))).toBe(false)

    for (const [result, output] of [
      [enforced, '.tmp/enforced-rbac-policy-enterprise.json'],
      [signed, '.tmp/signed-rbac-policy-enterprise.json'],
      [key, '.tmp/key-rbac-policy-enterprise.json'],
    ] as const) {
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
        'ENTERPRISE_READINESS_RBAC_POLICY_VALIDATION_AUTHORITY_CLAIM_UNSUPPORTED',
      )
      expect(existsSync(join(workspace, output))).toBe(false)
    }

    expect(unsafe.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafe.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe-rbac-policy-enterprise.json'))).toBe(false)
  })

  it('blocks invalid or authority-claiming signing readiness sources with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-signing-readiness.json'), {
      ...signingReadinessReport(),
      status: 'wrong',
    })
    writeJson(join(workspace, '.tmp/signed-signing-readiness.json'), {
      ...signingReadinessReport(),
      cryptographicSignaturePresent: true,
    })
    writeJson(join(workspace, '.tmp/key-signing-readiness.json'), {
      ...signingReadinessReport(),
      keyGenerated: true,
    })
    writeJson(join(workspace, '.tmp/rbac-signing-readiness.json'), {
      ...signingReadinessReport(),
      rbacEnforced: true,
    })
    writeJson(join(workspace, '.tmp/unsafe-signing-readiness.json'), {
      ...signingReadinessReport(),
      networkCallMade: true,
    })

    const wrong = await runEnterpriseWithSigningReadiness(
      workspace,
      '.tmp/wrong-signing-readiness.json',
      '.tmp/wrong-signing-enterprise.json',
    )
    const signed = await runEnterpriseWithSigningReadiness(
      workspace,
      '.tmp/signed-signing-readiness.json',
      '.tmp/signed-signing-enterprise.json',
    )
    const key = await runEnterpriseWithSigningReadiness(
      workspace,
      '.tmp/key-signing-readiness.json',
      '.tmp/key-signing-enterprise.json',
    )
    const rbac = await runEnterpriseWithSigningReadiness(
      workspace,
      '.tmp/rbac-signing-readiness.json',
      '.tmp/rbac-signing-enterprise.json',
    )
    const unsafe = await runEnterpriseWithSigningReadiness(
      workspace,
      '.tmp/unsafe-signing-readiness.json',
      '.tmp/unsafe-signing-enterprise.json',
    )

    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_SIGNING_READINESS_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-signing-enterprise.json'))).toBe(false)

    for (const [result, output] of [
      [signed, '.tmp/signed-signing-enterprise.json'],
      [key, '.tmp/key-signing-enterprise.json'],
      [rbac, '.tmp/rbac-signing-enterprise.json'],
    ] as const) {
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
        'ENTERPRISE_READINESS_SIGNING_READINESS_AUTHORITY_CLAIM_UNSUPPORTED',
      )
      expect(existsSync(join(workspace, output))).toBe(false)
    }

    expect(unsafe.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafe.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe-signing-enterprise.json'))).toBe(false)
  })

  it('records not-supplied areas cleanly while keeping report-only safety flags false', async () => {
    const workspace = createWorkspace()

    const result = await runDevViewCli(
      ['security', 'report-enterprise-readiness', '--output', '.tmp/enterprise-readiness.json', '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.benchmarkGovernanceReadiness.status).toBe('not-supplied')
    expect(payload.releaseSurfaceReadiness.status).toBe('not-supplied')
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'ENTERPRISE_BENCHMARK_GOVERNANCE_NOT_SUPPLIED',
        'ENTERPRISE_RELEASE_SURFACE_VALIDATION_NOT_SUPPLIED',
      ]),
    )
    expectSafetyFalse(payload)
  })

  it('blocks wrong source role/status and unsafe source authority flags with zero writes', async () => {
    const workspace = createWorkspace()
    const unsafeFlag = 'providerInvoked'
    writeJson(join(workspace, '.tmp/wrong-governance.json'), {
      ...benchmarkGovernanceReport(),
      status: 'wrong',
    })
    writeJson(join(workspace, '.tmp/unsafe-governance.json'), {
      ...benchmarkGovernanceReport(),
      [unsafeFlag]: true,
    })

    const wrong = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--benchmark-governance-verification',
        '.tmp/wrong-governance.json',
        '--output',
        '.tmp/wrong-enterprise.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const unsafe = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--benchmark-governance-verification',
        '.tmp/unsafe-governance.json',
        '--output',
        '.tmp/unsafe-enterprise.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-enterprise.json'))).toBe(false)

    expect(unsafe.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafe.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe-enterprise.json'))).toBe(false)
  })

  it('blocks invalid provider/network policy report sources with zero writes', async () => {
    const workspace = createWorkspace()
    const unsafeFlag = 'apiCallMade'
    writeJson(join(workspace, '.tmp/bad-provider-report.json'), {
      ...providerNetworkPolicyReport(),
      status: 'wrong',
    })
    writeJson(join(workspace, '.tmp/unsafe-provider-report.json'), {
      ...providerNetworkPolicyReport(),
      [unsafeFlag]: true,
    })
    writeJson(join(workspace, '.tmp/allowlist-provider-report.json'), {
      ...providerNetworkPolicyReport(),
      providerAllowlist: ['future-provider'],
    })

    const bad = await runEnterpriseWithProvider(workspace, '.tmp/bad-provider-report.json', '.tmp/bad-enterprise.json')
    const unsafe = await runEnterpriseWithProvider(
      workspace,
      '.tmp/unsafe-provider-report.json',
      '.tmp/unsafe-enterprise.json',
    )
    const allowlist = await runEnterpriseWithProvider(
      workspace,
      '.tmp/allowlist-provider-report.json',
      '.tmp/allowlist-enterprise.json',
    )

    expect(bad.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(bad.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_PROVIDER_NETWORK_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/bad-enterprise.json'))).toBe(false)

    expect(unsafe.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafe.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe-enterprise.json'))).toBe(false)

    expect(allowlist.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(allowlist.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_PROVIDER_NETWORK_ALLOWLIST_NOT_EMPTY',
    )
    expect(existsSync(join(workspace, '.tmp/allowlist-enterprise.json'))).toBe(false)
  })

  it('blocks invalid or authority-claiming record envelope preview sources with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-envelope.json'), {
      ...recordEnvelopePreview(),
      status: 'wrong',
    })
    writeJson(join(workspace, '.tmp/signed-envelope.json'), {
      ...recordEnvelopePreview(),
      cryptographicSignaturePresent: true,
    })
    writeJson(join(workspace, '.tmp/rbac-envelope.json'), {
      ...recordEnvelopePreview(),
      authorizationClaim: {
        ...(recordEnvelopePreview().authorizationClaim as Record<string, unknown>),
        permissionVerified: true,
      },
    })
    writeJson(join(workspace, '.tmp/unsafe-envelope.json'), {
      ...recordEnvelopePreview(),
      networkCallMade: true,
    })

    const wrong = await runEnterpriseWithEnvelope(workspace, '.tmp/wrong-envelope.json', '.tmp/wrong-enterprise.json')
    const signed = await runEnterpriseWithEnvelope(
      workspace,
      '.tmp/signed-envelope.json',
      '.tmp/signed-enterprise.json',
    )
    const rbac = await runEnterpriseWithEnvelope(workspace, '.tmp/rbac-envelope.json', '.tmp/rbac-enterprise.json')
    const unsafe = await runEnterpriseWithEnvelope(
      workspace,
      '.tmp/unsafe-envelope.json',
      '.tmp/unsafe-enterprise.json',
    )

    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_RECORD_ENVELOPE_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-enterprise.json'))).toBe(false)

    expect(signed.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(signed.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_RECORD_ENVELOPE_AUTHORITY_CLAIM_UNSUPPORTED',
    )
    expect(existsSync(join(workspace, '.tmp/signed-enterprise.json'))).toBe(false)

    expect(rbac.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(rbac.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_RECORD_ENVELOPE_AUTHORITY_CLAIM_UNSUPPORTED',
    )
    expect(existsSync(join(workspace, '.tmp/rbac-enterprise.json'))).toBe(false)

    expect(unsafe.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafe.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe-enterprise.json'))).toBe(false)
  })

  it('blocks invalid or authority-claiming record envelope verification sources with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-verification.json'), {
      ...recordEnvelopeVerification(),
      status: 'devview-record-envelope-verification-blocked',
    })
    writeJson(join(workspace, '.tmp/crypto-verification.json'), {
      ...recordEnvelopeVerification(),
      cryptographicSignatureVerified: true,
    })
    writeJson(join(workspace, '.tmp/rbac-verification.json'), {
      ...recordEnvelopeVerification(),
      rbacPermissionVerified: true,
    })
    writeJson(join(workspace, '.tmp/unsafe-verification.json'), {
      ...recordEnvelopeVerification(),
      networkCallMade: true,
    })

    const wrong = await runEnterpriseWithEnvelopeVerification(
      workspace,
      '.tmp/wrong-verification.json',
      '.tmp/wrong-verification-enterprise.json',
    )
    const crypto = await runEnterpriseWithEnvelopeVerification(
      workspace,
      '.tmp/crypto-verification.json',
      '.tmp/crypto-verification-enterprise.json',
    )
    const rbac = await runEnterpriseWithEnvelopeVerification(
      workspace,
      '.tmp/rbac-verification.json',
      '.tmp/rbac-verification-enterprise.json',
    )
    const unsafe = await runEnterpriseWithEnvelopeVerification(
      workspace,
      '.tmp/unsafe-verification.json',
      '.tmp/unsafe-verification-enterprise.json',
    )

    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_RECORD_ENVELOPE_VERIFICATION_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-verification-enterprise.json'))).toBe(false)

    expect(crypto.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(crypto.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_RECORD_ENVELOPE_VERIFICATION_AUTHORITY_CLAIM_UNSUPPORTED',
    )
    expect(existsSync(join(workspace, '.tmp/crypto-verification-enterprise.json'))).toBe(false)

    expect(rbac.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(rbac.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_RECORD_ENVELOPE_VERIFICATION_AUTHORITY_CLAIM_UNSUPPORTED',
    )
    expect(existsSync(join(workspace, '.tmp/rbac-verification-enterprise.json'))).toBe(false)

    expect(unsafe.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafe.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe-verification-enterprise.json'))).toBe(false)
  })

  it('blocks release surface source failures as enterprise blockers but accepts the source shape', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/benchmark-governance.json'), benchmarkGovernanceReport())
    writeJson(join(workspace, '.tmp/release-surface-failed.json'), {
      ...releaseSurfaceReport(),
      status: 'devview-release-surface-validation-failed',
      forbiddenFindingCount: 1,
    })

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--benchmark-governance-verification',
        '.tmp/benchmark-governance.json',
        '--release-surface-validation',
        '.tmp/release-surface-failed.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.releaseSurfaceReadiness.status).toBe('failed')
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_RELEASE_SURFACE_VALIDATION_FAILED',
    )
    expectSafetyFalse(payload)
  })

  it('blocks output collisions, source overwrites, and protected output paths', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/benchmark-governance.json'), benchmarkGovernanceReport())
    writeJson(join(workspace, '.tmp/record-envelope-preview.json'), recordEnvelopePreview())
    writeJson(join(workspace, '.tmp/record-envelope-verification.json'), recordEnvelopeVerification())
    writeJson(join(workspace, '.tmp/signing-readiness.json'), signingReadinessReport())
    writeJson(join(workspace, '.tmp/rbac-policy-validation.json'), rbacPolicyValidationReport())
    const cases = [
      { output: '.tmp/benchmark-governance.json', expected: 'would overwrite a source input' },
      {
        sourceArgs: ['--record-envelope-preview', '.tmp/record-envelope-preview.json'],
        output: '.tmp/record-envelope-preview.json',
        expected: 'would overwrite a source input',
      },
      {
        sourceArgs: ['--record-envelope-verification', '.tmp/record-envelope-verification.json'],
        output: '.tmp/record-envelope-verification.json',
        expected: 'would overwrite a source input',
      },
      {
        sourceArgs: ['--signing-readiness', '.tmp/signing-readiness.json'],
        output: '.tmp/signing-readiness.json',
        expected: 'would overwrite a source input',
      },
      {
        sourceArgs: ['--rbac-policy-validation', '.tmp/rbac-policy-validation.json'],
        output: '.tmp/rbac-policy-validation.json',
        expected: 'would overwrite a source input',
      },
      { output: '.tmp/enterprise.json', markdown: '.tmp/enterprise.json', expected: 'must be different' },
      { output: join('.devview', 'generated', 'enterprise.json'), expected: 'inside a protected control path' },
    ]

    for (const entry of cases) {
      const result = await runDevViewCli(
        [
          'security',
          'report-enterprise-readiness',
          '--benchmark-governance-verification',
          '.tmp/benchmark-governance.json',
          ...(entry.sourceArgs ?? []),
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

function benchmarkGovernanceReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-benchmark-governance-verification-report',
    status: 'devview-benchmark-governance-verified',
    verificationScope: 'benchmark-governance-verification-report-only',
    enterpriseClaimReadiness: 'verified-for-static-benchmark-only',
    versionVerification: {
      evaluatorVersionStatus: 'matched',
      scoringRubricVersionStatus: 'matched',
    },
    sourceDigestVerificationSummary: {
      sourceArtifactDigestCount: 9,
      combinedDigestMatches: true,
    },
    goldenReviewGovernanceCheck: {
      status: 'present',
    },
    heldOutPolicyCheck: {
      status: 'declared',
    },
    graphifyImportGovernanceCheck: {
      status: 'present',
    },
    comparisonCoverageCheck: {
      suppliedComparisonArms: ['codex-only', 'codex-graphify', 'codex-devview', 'codex-graphify-devview'],
      suppliedProjectModes: ['native'],
    },
    governanceFindings: [],
    downstreamActionPlan: [],
    ...safetyFlags(),
    ...overrides,
  }
}

function releaseSurfaceReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-release-surface-validation-report',
    status: 'devview-release-surface-validation-passed',
    packageName: 'devview',
    packageVersion: '0.2.0-alpha',
    dryRun: true,
    packageFileCount: 10,
    packageFiles: [],
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

function providerNetworkPolicyReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-provider-network-default-deny-policy-report',
    status: 'devview-provider-network-default-deny-policy-recorded',
    policyScope: 'provider-network-default-deny-policy-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    defaultProviderPolicy: 'deny',
    defaultNetworkPolicy: 'deny',
    providerAllowlist: [],
    networkAllowlist: [],
    policyEnforcementMode: 'report-only-default-deny-recorded',
    explicitAllowSupported: false,
    futureAllowPolicyRequirements: ['signed policy artifact', 'actor identity and RBAC grant'],
    blockedCapabilities: ['provider execution', 'network access', 'external API calls'],
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
    ...overrides,
  }
}

function recordEnvelopePreview(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-record-envelope-preview',
    status: 'devview-record-envelope-previewed',
    envelopeScope: 'signed-record-envelope-preview-report-only',
    recordEnvelopeVersion: 1,
    sourceFactsOnly: true,
    reportOnly: true,
    payloadSummary: {
      path: '.tmp/rbac-readiness.json',
      artifactRole: 'devview-rbac-readiness-report',
      status: 'devview-rbac-readiness-reported',
      sha256: 'a'.repeat(64),
      byteLength: 1024,
      payloadCanonicalization: 'raw-json-bytes-sha256',
      allowedTrueSourceFacts: [],
    },
    sourceArtifactDigests: [
      {
        path: '.tmp/source.json',
        artifactRole: 'devview-provider-network-default-deny-policy-report',
        status: 'devview-provider-network-default-deny-policy-recorded',
        sha256: 'b'.repeat(64),
        byteLength: 512,
      },
    ],
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
      authorizationRationale: 'Review enterprise readiness envelope source fact.',
      rbacEnforced: false,
      permissionVerified: false,
    },
    signatureMode: 'unsigned-deterministic-preview',
    cryptographicSignaturePresent: false,
    keyId: null,
    signatureAlgorithm: null,
    previousEnvelope: {
      supplied: false,
      path: null,
      artifactRole: null,
      status: null,
      sha256: null,
      byteLength: null,
    },
    previousEnvelopeSha256: null,
    envelopePayloadDigest: 'c'.repeat(64),
    envelopeSha256: 'd'.repeat(64),
    verificationSummary: {
      payloadHashRecorded: true,
      sourceDigestsRecorded: true,
      actorIdentityRecorded: true,
      rbacPermissionVerified: false,
      cryptographicSignatureVerified: false,
      previousEnvelopeLinked: false,
    },
    rbacEnforced: false,
    permissionVerified: false,
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
    enterpriseGateActivated: false,
    ...overrides,
  }
}

function recordEnvelopeVerification(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-record-envelope-verification-report',
    status: 'devview-record-envelope-verified',
    verificationScope: 'record-envelope-verification-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    sourceRecordEnvelopePreview: {
      path: '.tmp/record-envelope-preview.json',
      artifactRole: 'devview-record-envelope-preview',
      status: 'devview-record-envelope-previewed',
      signatureMode: 'unsigned-deterministic-preview',
      envelopeSha256Present: true,
      envelopePayloadDigestPresent: true,
    },
    payloadVerification: {
      expectedPath: '.tmp/rbac-readiness.json',
      actualPath: '.tmp/rbac-readiness.json',
      pathMatches: true,
      expectedArtifactRole: 'devview-rbac-readiness-report',
      actualArtifactRole: 'devview-rbac-readiness-report',
      artifactRoleMatches: true,
      expectedStatus: 'devview-rbac-readiness-reported',
      actualStatus: 'devview-rbac-readiness-reported',
      statusMatches: true,
      expectedSha256: 'a'.repeat(64),
      actualSha256: 'a'.repeat(64),
      digestMatches: true,
      expectedByteLength: 1024,
      actualByteLength: 1024,
      byteLengthMatches: true,
    },
    sourceArtifactVerification: {
      expectedCount: 1,
      actualCount: 1,
      allSourceDigestsMatch: true,
      missingExpectedPaths: [],
      unexpectedActualPaths: [],
      matches: [
        {
          expectedPath: '.tmp/source.json',
          actualPath: '.tmp/source.json',
          pathMatches: true,
          expectedArtifactRole: 'devview-provider-network-default-deny-policy-report',
          actualArtifactRole: 'devview-provider-network-default-deny-policy-report',
          artifactRoleMatches: true,
          expectedStatus: 'devview-provider-network-default-deny-policy-recorded',
          actualStatus: 'devview-provider-network-default-deny-policy-recorded',
          statusMatches: true,
          expectedSha256: 'b'.repeat(64),
          actualSha256: 'b'.repeat(64),
          digestMatches: true,
          expectedByteLength: 512,
          actualByteLength: 512,
          byteLengthMatches: true,
        },
      ],
    },
    previousEnvelopeVerification: {
      required: false,
      supplied: false,
      expectedSha256: null,
      actualSha256: null,
      digestMatches: null,
      chainLinkVerified: false,
      expectedPath: null,
      actualPath: null,
      pathMatches: null,
    },
    envelopeStructuralChecks: {
      envelopeSha256Present: true,
      envelopePayloadDigestPresent: true,
      payloadHashRecorded: true,
      sourceDigestsRecorded: true,
      actorIdentityRecorded: true,
    },
    verificationDigest: 'e'.repeat(64),
    signatureVerificationMode: 'not-performed-unsigned-preview-only',
    cryptographicSignatureVerified: false,
    rbacPermissionVerified: false,
    rbacEnforced: false,
    permissionVerified: false,
    verificationFindings: [],
    downstreamActionPlan: [],
    ...safetyFlags(),
    ...overrides,
  }
}

function signingReadinessReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-signing-readiness-report',
    status: 'devview-signing-readiness-reported',
    readinessScope: 'signing-key-governance-readiness-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    signingReadinessStatus: 'not-ready-policy-and-key-governance-missing',
    sourceRecordEnvelopePreviews: [],
    sourceRecordEnvelopeVerifications: [],
    envelopePrerequisiteSummary: {
      previewCount: 1,
      verificationCount: 1,
      payloadDigestVerifiedCount: 1,
      sourceDigestVerifiedCount: 1,
      previousChainVerifiedCount: 0,
      signedEnvelopeCount: 0,
      cryptographicSignatureVerifiedCount: 0,
      rbacPermissionVerifiedCount: 0,
    },
    keyGovernanceReadiness: {
      status: 'not-ready',
      keyRegistryPresent: false,
      trustRootPresent: false,
      privateKeyStoragePresent: false,
      noPrivateKeyStorageInRepo: true,
      rotationMetadataPresent: false,
      revocationMetadataPresent: false,
      keyOwnerRolePolicyPresent: false,
      gaps: [],
    },
    signaturePolicyReadiness: {
      status: 'not-ready',
      detachedSignaturePolicyRequired: true,
      detachedSignaturePolicyPresent: false,
      allowedAlgorithmsFutureCandidates: ['Ed25519'],
      timestampPolicy: 'explicit-input-only-no-generated-timestamps',
      payloadDigestPolicy: 'raw-json-bytes-sha256-source-facts',
      canonicalizationPolicy: 'raw-byte-digest-now-canonical-json-policy-required-before-real-signing',
      signatureFormatPolicyPresent: false,
      gaps: [],
    },
    rbacPrerequisiteSummary: {
      actorModelPresent: true,
      permissionMatrixPresent: true,
      artifactPermissionMappingPresent: true,
      roleAssignmentRegistryPresent: false,
      rbacEnforced: false,
      permissionVerificationEnforced: false,
      gaps: [],
    },
    futureSignedEnvelopeRequirements: ['detached signature fields', 'key registry reference'],
    signingReadinessFindings: [],
    downstreamActionPlan: [],
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

function rbacPolicyValidationReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-rbac-policy-validation-report',
    status: 'devview-rbac-policy-validation-passed',
    validationScope: 'rbac-policy-validation-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    rbacPolicyValidationStatus: 'passed',
    sourcePolicy: {
      supplied: true,
      path: '.tmp/rbac-policy.json',
      artifactRole: 'devview-rbac-policy',
      status: 'devview-rbac-policy-configured',
      defaultAuthorityPolicy: 'deny',
    },
    actorSummary: {
      actorCount: 2,
      actorCountByType: { human: 1, automation: 1 },
      duplicateActorIds: [],
      unknownActorTypeCount: 0,
      unknownActorTypes: [],
    },
    roleAssignmentSummary: {
      assignmentCount: 2,
      unknownActorReferences: [],
      unknownRoles: [],
      duplicateAssignmentCount: 0,
      duplicateAssignments: [],
    },
    permissionGrantSummary: {
      grantCount: 2,
      unknownRoles: [],
      unknownPermissions: [],
      unsafeUnknownPermissions: [],
      providerNetworkPermissionCount: 0,
      approvalPermissionCount: 0,
      graphApplyPermissionCount: 0,
    },
    artifactPermissionCoverageSummary: {
      configuredArtifactRoleCount: 1,
      knownArtifactRoleCoverageCount: 1,
      unknownArtifactRoles: [],
    },
    defaultDenyStatus: {
      defaultAuthorityPolicy: 'deny',
      defaultDenyConfigured: true,
    },
    automationRestrictionStatus: {
      automationActorCount: 1,
      automationRestrictionDeclared: true,
      forbiddenAutomationPermissionCount: 2,
      automationOvergrantCount: 0,
      automationOvergrants: [],
    },
    extensionAuthorRestrictionStatus: {
      extensionAuthorActorCount: 0,
      extensionAuthorRestrictionDeclared: true,
      forbiddenExtensionAuthorPermissionCount: 2,
      extensionAuthorOvergrantCount: 0,
      extensionAuthorOvergrants: [],
    },
    noEnforcementPerformed: true,
    policyFindings: [
      {
        severity: 'satisfied',
        code: 'RBAC_POLICY_VALIDATION_DEFAULT_DENY_RECORDED',
        message: 'RBAC policy default authority is deny.',
      },
    ],
    downstreamActionPlan: ['Keep RBAC enforcement disabled.', 'Add signed policy/key registry validation later.'],
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
    cryptographicSignaturePresent: false,
    cryptographicSignatureVerified: false,
    cryptographicSigningImplemented: false,
    keyGenerated: false,
    privateKeyStored: false,
    keyManagementImplemented: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
    ...safetyFlags(),
    ...overrides,
  }
}

function safetyFlags(): Record<string, unknown> {
  return {
    benchmarkExecuted: false,
    candidateExecuted: false,
    graphifyExecuted: false,
    nativeBenchmarkExecuted: false,
    sourceFactsOnly: true,
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
  }
}

function expectSafetyFalse(payload: Record<string, unknown>): void {
  expect(payload.enterpriseGateActivated).toBe(false)
  expect(payload.benchmarkExecuted).toBe(false)
  expect(payload.candidateExecuted).toBe(false)
  expect(payload.graphifyExecuted).toBe(false)
  expect(payload.nativeBenchmarkExecuted).toBe(false)
  expect(payload.providerInvoked).toBe(false)
  expect(payload.networkCallMade).toBe(false)
  expect(payload.apiCallMade).toBe(false)
  expect(payload.shellCommandsExecuted).toBe(false)
  expect(payload.extensionExecutionAllowed).toBe(false)
  expect(payload.extensionsExecuted).toBe(false)
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
}

function runEnterpriseWithProvider(workspace: string, providerReport: string, output: string) {
  return runDevViewCli(
    [
      'security',
      'report-enterprise-readiness',
      '--provider-network-policy-report',
      providerReport,
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function runEnterpriseWithEnvelope(workspace: string, envelopePreview: string, output: string) {
  return runDevViewCli(
    [
      'security',
      'report-enterprise-readiness',
      '--record-envelope-preview',
      envelopePreview,
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function runEnterpriseWithEnvelopeVerification(workspace: string, envelopeVerification: string, output: string) {
  return runDevViewCli(
    [
      'security',
      'report-enterprise-readiness',
      '--record-envelope-verification',
      envelopeVerification,
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function runEnterpriseWithSigningReadiness(workspace: string, signingReadiness: string, output: string) {
  return runDevViewCli(
    ['security', 'report-enterprise-readiness', '--signing-readiness', signingReadiness, '--output', output, '--json'],
    { cwd: workspace, pluginRoot },
  )
}

function runEnterpriseWithRbacPolicyValidation(workspace: string, rbacPolicyValidation: string, output: string) {
  return runDevViewCli(
    [
      'security',
      'report-enterprise-readiness',
      '--rbac-policy-validation',
      rbacPolicyValidation,
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}
