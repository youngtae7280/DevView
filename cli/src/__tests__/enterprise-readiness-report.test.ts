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

  it('summarizes release provenance readiness without treating it as attestation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/release-provenance-readiness.json'), releaseProvenanceReadinessReport())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--release-provenance-readiness',
        '.tmp/release-provenance-readiness.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.sourceReleaseProvenanceReadinessReports).toHaveLength(1)
    expect(payload.sourceReleaseProvenanceReadinessReports[0]).toEqual(
      expect.objectContaining({
        path: '.tmp/release-provenance-readiness.json',
        artifactRole: 'devview-release-provenance-readiness-report',
        status: 'devview-release-provenance-readiness-reported',
        releaseProvenanceReadinessStatus: 'not-ready-sbom-and-signing-missing',
        packageName: 'devview',
        packageVersion: '0.2.0-alpha',
        packageFilesAllowlistPresent: true,
        packageFilesAllowlistCount: 14,
        releaseSurfaceScriptPresent: true,
        releaseSurfaceCheckerPresent: true,
        sbomGenerated: false,
        sbomPresent: false,
        sbomAttested: false,
        packageSigningPresent: false,
        packageSignatureVerified: false,
        provenanceAttestationPresent: false,
        provenanceAttested: false,
        findingCount: 3,
        downstreamActionCount: 2,
      }),
    )
    expect(payload.releaseProvenanceReadiness.status).toBe('readiness-recorded')
    expect(payload.releaseProvenanceReadiness.sourceCount).toBe(1)
    expect(payload.releaseProvenanceReadiness.sourceStatuses).toEqual(['not-ready-sbom-and-signing-missing'])
    expect(payload.releaseProvenanceReadiness.packageName).toBe('devview')
    expect(payload.releaseProvenanceReadiness.packageVersion).toBe('0.2.0-alpha')
    expect(payload.releaseProvenanceReadiness.packageFilesAllowlistPresentCount).toBe(1)
    expect(payload.releaseProvenanceReadiness.packageFilesAllowlistCount).toBe(14)
    expect(payload.releaseProvenanceReadiness.releaseSurfaceScriptPresentCount).toBe(1)
    expect(payload.releaseProvenanceReadiness.releaseSurfaceCheckerPresentCount).toBe(1)
    expect(payload.releaseProvenanceReadiness.sbomGeneratedCount).toBe(0)
    expect(payload.releaseProvenanceReadiness.sbomPresentCount).toBe(0)
    expect(payload.releaseProvenanceReadiness.sbomAttestedCount).toBe(0)
    expect(payload.releaseProvenanceReadiness.packageSigningPresentCount).toBe(0)
    expect(payload.releaseProvenanceReadiness.packageSignatureVerifiedCount).toBe(0)
    expect(payload.releaseProvenanceReadiness.provenanceAttestationPresentCount).toBe(0)
    expect(payload.releaseProvenanceReadiness.provenanceAttestedCount).toBe(0)
    expect(payload.releaseProvenanceReadiness.findingCount).toBe(3)
    expect(payload.releaseProvenanceReadiness.downstreamActionCount).toBe(2)
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'ENTERPRISE_RELEASE_PROVENANCE_READINESS_RECORDED',
        'ENTERPRISE_RELEASE_PROVENANCE_ARTIFACTS_MISSING',
        'ENTERPRISE_RBAC_SIGNING_MISSING',
      ]),
    )
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).not.toContain(
      'ENTERPRISE_RELEASE_PROVENANCE_READINESS_NOT_SUPPLIED',
    )
    expectSafetyFalse(payload)
  })

  it('summarizes SBOM validation without treating it as generation or attestation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/sbom-validation.json'), sbomValidationReport())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--sbom-validation',
        '.tmp/sbom-validation.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.sourceSbomValidationReports).toHaveLength(1)
    expect(payload.sourceSbomValidationReports[0]).toEqual(
      expect.objectContaining({
        path: '.tmp/sbom-validation.json',
        artifactRole: 'devview-sbom-validation-report',
        status: 'devview-sbom-validation-passed',
        sbomValidationStatus: 'validated-structural-source-fact-only',
        sbomFormat: 'devview-minimal-sbom-v1',
        packageName: 'devview',
        packageVersion: '0.2.0-alpha',
        componentCount: 2,
        packageIdentityAlignmentStatus: 'matched',
        sbomSha256Present: true,
        sourceArtifactDigestCount: 3,
        findingCount: 3,
        downstreamActionCount: 2,
        sbomGeneratedByDevView: false,
        sbomGenerated: false,
        sbomAttested: false,
        packageSigned: false,
        packageSigningPresent: false,
        provenanceAttested: false,
      }),
    )
    expect(payload.sbomValidationReadiness.status).toBe('structural-validation-recorded')
    expect(payload.sbomValidationReadiness.sourceCount).toBe(1)
    expect(payload.sbomValidationReadiness.sourceStatuses).toEqual(['devview-sbom-validation-passed'])
    expect(payload.sbomValidationReadiness.sbomValidationStatuses).toEqual(['validated-structural-source-fact-only'])
    expect(payload.sbomValidationReadiness.sbomFormats).toEqual(['devview-minimal-sbom-v1'])
    expect(payload.sbomValidationReadiness.packageIdentityMatchedCount).toBe(1)
    expect(payload.sbomValidationReadiness.componentCount).toBe(2)
    expect(payload.sbomValidationReadiness.sbomByteDigestPresentCount).toBe(1)
    expect(payload.sbomValidationReadiness.sourceArtifactDigestCount).toBe(3)
    expect(payload.sbomValidationReadiness.findingCount).toBe(3)
    expect(payload.sbomValidationReadiness.downstreamActionCount).toBe(2)
    expect(payload.sbomValidationReadiness.sbomGeneratedByDevViewCount).toBe(0)
    expect(payload.sbomValidationReadiness.sbomGeneratedCount).toBe(0)
    expect(payload.sbomValidationReadiness.sbomAttestedCount).toBe(0)
    expect(payload.sbomValidationReadiness.packageSignedCount).toBe(0)
    expect(payload.sbomValidationReadiness.packageSigningPresentCount).toBe(0)
    expect(payload.sbomValidationReadiness.provenanceAttestedCount).toBe(0)
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'ENTERPRISE_SBOM_VALIDATION_RECORDED',
        'ENTERPRISE_RELEASE_PROVENANCE_ARTIFACTS_MISSING',
        'ENTERPRISE_RBAC_SIGNING_MISSING',
      ]),
    )
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).not.toContain(
      'ENTERPRISE_SBOM_VALIDATION_NOT_SUPPLIED',
    )
    expectSafetyFalse(payload)
  })

  it('summarizes package provenance inputs without treating them as package digest or attestation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/package-provenance-inputs.json'), packageProvenanceInputsRecord())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--package-provenance-inputs',
        '.tmp/package-provenance-inputs.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.sourcePackageProvenanceInputsRecords).toHaveLength(1)
    expect(payload.sourcePackageProvenanceInputsRecords[0]).toEqual(
      expect.objectContaining({
        path: '.tmp/package-provenance-inputs.json',
        artifactRole: 'devview-package-provenance-inputs-record',
        status: 'devview-package-provenance-inputs-recorded',
        packageProvenanceInputsStatus: 'recorded-source-inputs-only',
        packageName: 'devview',
        packageVersion: '0.2.0-alpha',
        sourceArtifactDigestCount: 4,
        sourceRefStatus: 'supplied-explicit-cli-input',
        sourceRefSupplied: true,
        buildCommandLabelStatus: 'supplied-metadata-only',
        buildCommandLabelSupplied: true,
        buildCommandExecuted: false,
        packageDigestStatus: 'not-computed-no-package-artifact-supplied',
        packageArtifactSupplied: false,
        packageArtifactSha256Present: false,
        provenanceAttestationStatus: 'not-generated',
        releaseSurfaceSourceSupplied: true,
        releaseProvenanceReadinessSupplied: true,
        sbomValidationSupplied: true,
        findingCount: 5,
        downstreamActionCount: 3,
        packageSigned: false,
        packageSigningPresent: false,
        sbomGenerated: false,
        sbomAttested: false,
        provenanceAttested: false,
      }),
    )
    expect(payload.packageProvenanceInputsReadiness.status).toBe('inputs-recorded')
    expect(payload.packageProvenanceInputsReadiness.sourceCount).toBe(1)
    expect(payload.packageProvenanceInputsReadiness.sourceStatuses).toEqual([
      'devview-package-provenance-inputs-recorded',
    ])
    expect(payload.packageProvenanceInputsReadiness.packageProvenanceInputsStatuses).toEqual([
      'recorded-source-inputs-only',
    ])
    expect(payload.packageProvenanceInputsReadiness.packageNames).toEqual(['devview'])
    expect(payload.packageProvenanceInputsReadiness.packageVersions).toEqual(['0.2.0-alpha'])
    expect(payload.packageProvenanceInputsReadiness.sourceArtifactDigestCount).toBe(4)
    expect(payload.packageProvenanceInputsReadiness.sourceRefSuppliedCount).toBe(1)
    expect(payload.packageProvenanceInputsReadiness.buildCommandLabelSuppliedCount).toBe(1)
    expect(payload.packageProvenanceInputsReadiness.packageDigestComputedCount).toBe(0)
    expect(payload.packageProvenanceInputsReadiness.packageDigestStatuses).toEqual([
      'not-computed-no-package-artifact-supplied',
    ])
    expect(payload.packageProvenanceInputsReadiness.provenanceAttestationGeneratedCount).toBe(0)
    expect(payload.packageProvenanceInputsReadiness.provenanceAttestationStatuses).toEqual(['not-generated'])
    expect(payload.packageProvenanceInputsReadiness.releaseSurfaceSourceLinkedCount).toBe(1)
    expect(payload.packageProvenanceInputsReadiness.sbomValidationLinkedCount).toBe(1)
    expect(payload.packageProvenanceInputsReadiness.findingCount).toBe(5)
    expect(payload.packageProvenanceInputsReadiness.downstreamActionCount).toBe(3)
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'ENTERPRISE_PACKAGE_PROVENANCE_INPUTS_RECORDED',
        'ENTERPRISE_RELEASE_PROVENANCE_ARTIFACTS_MISSING',
        'ENTERPRISE_RBAC_SIGNING_MISSING',
      ]),
    )
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).not.toContain(
      'ENTERPRISE_PACKAGE_PROVENANCE_INPUTS_NOT_SUPPLIED',
    )
    expectSafetyFalse(payload)
  })

  it('summarizes package artifact digest records without treating them as generation, signing, or attestation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/package-artifact-digest.json'), packageArtifactDigestRecord())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--package-artifact-digest',
        '.tmp/package-artifact-digest.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.sourcePackageArtifactDigestRecords).toHaveLength(1)
    expect(payload.sourcePackageArtifactDigestRecords[0]).toEqual(
      expect.objectContaining({
        path: '.tmp/package-artifact-digest.json',
        artifactRole: 'devview-package-artifact-digest-record',
        status: 'devview-package-artifact-digest-recorded',
        artifactDigestStatus: 'matched-expected',
        packageArtifactPath: '.tmp/devview-0.2.0-alpha.tgz',
        fileName: 'devview-0.2.0-alpha.tgz',
        byteLength: 31,
        sha256Present: true,
        expectedSha256Supplied: true,
        expectedSha256Match: true,
        packageName: 'devview',
        packageVersion: '0.2.0-alpha',
        packageIdentitySource: 'package-provenance-inputs',
        sourceArtifactDigestCount: 3,
        packageProvenanceInputsLinked: true,
        releaseSurfaceValidationLinked: true,
        findingCount: 4,
        downstreamActionCount: 3,
        packageArtifactGeneratedByDevView: false,
        packageArtifactGenerated: false,
        packageTarballGenerated: false,
        packagePublished: false,
        packageSigned: false,
        packageSigningPresent: false,
        sbomGenerated: false,
        sbomAttested: false,
        provenanceAttested: false,
      }),
    )
    expect(payload.packageArtifactDigestReadiness.status).toBe('artifact-digest-recorded')
    expect(payload.packageArtifactDigestReadiness.sourceCount).toBe(1)
    expect(payload.packageArtifactDigestReadiness.sourceStatuses).toEqual(['devview-package-artifact-digest-recorded'])
    expect(payload.packageArtifactDigestReadiness.artifactDigestStatuses).toEqual(['matched-expected'])
    expect(payload.packageArtifactDigestReadiness.artifactDigestComputedCount).toBe(1)
    expect(payload.packageArtifactDigestReadiness.expectedDigestMatchedCount).toBe(1)
    expect(payload.packageArtifactDigestReadiness.packageArtifactGeneratedByDevViewCount).toBe(0)
    expect(payload.packageArtifactDigestReadiness.packageArtifactGeneratedCount).toBe(0)
    expect(payload.packageArtifactDigestReadiness.packageSignedCount).toBe(0)
    expect(payload.packageArtifactDigestReadiness.provenanceAttestedCount).toBe(0)
    expect(payload.packageArtifactDigestReadiness.packageNames).toEqual(['devview'])
    expect(payload.packageArtifactDigestReadiness.packageVersions).toEqual(['0.2.0-alpha'])
    expect(payload.packageArtifactDigestReadiness.sourceArtifactDigestCount).toBe(3)
    expect(payload.packageArtifactDigestReadiness.packageProvenanceInputsLinkedCount).toBe(1)
    expect(payload.packageArtifactDigestReadiness.releaseSurfaceValidationLinkedCount).toBe(1)
    expect(payload.packageArtifactDigestReadiness.findingCount).toBe(4)
    expect(payload.packageArtifactDigestReadiness.downstreamActionCount).toBe(3)
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'ENTERPRISE_PACKAGE_ARTIFACT_DIGEST_RECORDED',
        'ENTERPRISE_RELEASE_PROVENANCE_ARTIFACTS_MISSING',
        'ENTERPRISE_RBAC_SIGNING_MISSING',
      ]),
    )
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).not.toContain(
      'ENTERPRISE_PACKAGE_ARTIFACT_DIGEST_NOT_SUPPLIED',
    )
    expectSafetyFalse(payload)
  })

  it('summarizes provenance attestation validation without treating it as generation or verification', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provenance-attestation-validation.json'), provenanceAttestationValidationReport())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--provenance-attestation-validation',
        '.tmp/provenance-attestation-validation.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.sourceProvenanceAttestationValidationReports).toHaveLength(1)
    expect(payload.sourceProvenanceAttestationValidationReports[0]).toEqual(
      expect.objectContaining({
        path: '.tmp/provenance-attestation-validation.json',
        artifactRole: 'devview-provenance-attestation-validation-report',
        status: 'devview-provenance-attestation-validation-passed',
        attestationValidationStatus: 'validated-structural-source-fact-only',
        signatureValidationStatus: 'not-performed-source-fact-only',
        attestationFormat: 'devview-minimal-provenance-v1',
        packageName: 'devview',
        packageVersion: '0.2.0-alpha',
        attestationSha256Present: true,
        packageDigestAlignmentStatus: 'matched',
        packageDigestMatches: true,
        provenanceInputAlignmentStatus: 'matched',
        provenanceInputMatches: true,
        findingCount: 6,
        downstreamActionCount: 3,
        provenanceAttestationGeneratedByDevView: false,
        provenanceAttestationGenerated: false,
        provenanceAttestationVerified: false,
        provenanceAttested: false,
        packageSigned: false,
        packageSigningPresent: false,
        sbomAttested: false,
        cryptographicSignatureVerified: false,
      }),
    )
    expect(payload.provenanceAttestationValidationReadiness.status).toBe('structural-validation-recorded')
    expect(payload.provenanceAttestationValidationReadiness.sourceCount).toBe(1)
    expect(payload.provenanceAttestationValidationReadiness.sourceStatuses).toEqual([
      'devview-provenance-attestation-validation-passed',
    ])
    expect(payload.provenanceAttestationValidationReadiness.attestationValidationStatuses).toEqual([
      'validated-structural-source-fact-only',
    ])
    expect(payload.provenanceAttestationValidationReadiness.attestationFormats).toEqual([
      'devview-minimal-provenance-v1',
    ])
    expect(payload.provenanceAttestationValidationReadiness.attestationDigestPresentCount).toBe(1)
    expect(payload.provenanceAttestationValidationReadiness.packageDigestMatchedCount).toBe(1)
    expect(payload.provenanceAttestationValidationReadiness.provenanceInputMatchedCount).toBe(1)
    expect(payload.provenanceAttestationValidationReadiness.signatureValidationStatuses).toEqual([
      'not-performed-source-fact-only',
    ])
    expect(payload.provenanceAttestationValidationReadiness.provenanceAttestationGeneratedByDevViewCount).toBe(0)
    expect(payload.provenanceAttestationValidationReadiness.provenanceAttestationGeneratedCount).toBe(0)
    expect(payload.provenanceAttestationValidationReadiness.provenanceAttestationVerifiedCount).toBe(0)
    expect(payload.provenanceAttestationValidationReadiness.provenanceAttestedCount).toBe(0)
    expect(payload.provenanceAttestationValidationReadiness.packageSignedCount).toBe(0)
    expect(payload.provenanceAttestationValidationReadiness.packageSigningPresentCount).toBe(0)
    expect(payload.provenanceAttestationValidationReadiness.sbomAttestedCount).toBe(0)
    expect(payload.provenanceAttestationValidationReadiness.cryptographicSignatureVerifiedCount).toBe(0)
    expect(payload.provenanceAttestationValidationReadiness.findingCount).toBe(6)
    expect(payload.provenanceAttestationValidationReadiness.downstreamActionCount).toBe(3)
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'ENTERPRISE_PROVENANCE_ATTESTATION_VALIDATION_RECORDED',
        'ENTERPRISE_RELEASE_PROVENANCE_ARTIFACTS_MISSING',
        'ENTERPRISE_RBAC_SIGNING_MISSING',
      ]),
    )
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).not.toContain(
      'ENTERPRISE_PROVENANCE_ATTESTATION_VALIDATION_NOT_SUPPLIED',
    )
    expectSafetyFalse(payload)
  })

  it('summarizes provenance verification readiness without treating it as real verification', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provenance-verification-readiness.json'), provenanceVerificationReadinessReport())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--provenance-verification-readiness',
        '.tmp/provenance-verification-readiness.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.sourceProvenanceVerificationReadinessReports).toHaveLength(1)
    expect(payload.sourceProvenanceVerificationReadinessReports[0]).toEqual(
      expect.objectContaining({
        path: '.tmp/provenance-verification-readiness.json',
        artifactRole: 'devview-provenance-verification-readiness-report',
        status: 'devview-provenance-verification-readiness-reported',
        provenanceVerificationReadinessStatus: 'not-ready-key-trust-and-signature-policy-missing',
        attestationValidationLinked: true,
        signingReadinessLinked: true,
        rbacPolicyValidationLinked: true,
        recordEnvelopeVerificationLinked: true,
        providerNetworkDefaultDenyLinked: true,
        realSlsaVerificationPerformed: false,
        realInTotoVerificationPerformed: false,
        cryptographicSignatureVerified: false,
        signatureVerificationStatus: 'not-performed-readiness-only',
        provenanceAttestationGenerated: false,
        provenanceAttestationVerified: false,
        keyRegistryPresent: false,
        trustRootPresent: false,
        findingCount: 7,
        downstreamActionCount: 3,
      }),
    )
    expect(payload.provenanceVerificationReadiness.status).toBe('verification-readiness-recorded')
    expect(payload.provenanceVerificationReadiness.sourceCount).toBe(1)
    expect(payload.provenanceVerificationReadiness.sourceStatuses).toEqual([
      'devview-provenance-verification-readiness-reported',
    ])
    expect(payload.provenanceVerificationReadiness.readinessStatuses).toEqual([
      'not-ready-key-trust-and-signature-policy-missing',
    ])
    expect(payload.provenanceVerificationReadiness.staticAttestationValidationLinkedCount).toBe(1)
    expect(payload.provenanceVerificationReadiness.signingReadinessLinkedCount).toBe(1)
    expect(payload.provenanceVerificationReadiness.rbacPolicyValidationLinkedCount).toBe(1)
    expect(payload.provenanceVerificationReadiness.recordEnvelopeVerificationLinkedCount).toBe(1)
    expect(payload.provenanceVerificationReadiness.providerNetworkDefaultDenyLinkedCount).toBe(1)
    expect(payload.provenanceVerificationReadiness.realSlsaVerificationPerformedCount).toBe(0)
    expect(payload.provenanceVerificationReadiness.realInTotoVerificationPerformedCount).toBe(0)
    expect(payload.provenanceVerificationReadiness.cryptographicSignatureVerifiedCount).toBe(0)
    expect(payload.provenanceVerificationReadiness.keyRegistryPresentCount).toBe(0)
    expect(payload.provenanceVerificationReadiness.trustRootPresentCount).toBe(0)
    expect(payload.provenanceVerificationReadiness.findingCount).toBe(7)
    expect(payload.provenanceVerificationReadiness.downstreamActionCount).toBe(3)
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'ENTERPRISE_PROVENANCE_VERIFICATION_READINESS_RECORDED',
        'ENTERPRISE_RELEASE_PROVENANCE_ARTIFACTS_MISSING',
        'ENTERPRISE_RBAC_SIGNING_MISSING',
      ]),
    )
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).not.toContain(
      'ENTERPRISE_PROVENANCE_VERIFICATION_READINESS_NOT_SUPPLIED',
    )
    expectSafetyFalse(payload)
  })

  it('summarizes CI/branch governance readiness without treating it as external CI activation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/ci-branch-governance-readiness.json'), ciBranchGovernanceReadinessReport())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--ci-branch-governance-readiness',
        '.tmp/ci-branch-governance-readiness.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.sourceCiBranchGovernanceReadinessReports).toHaveLength(1)
    expect(payload.sourceCiBranchGovernanceReadinessReports[0]).toEqual(
      expect.objectContaining({
        path: '.tmp/ci-branch-governance-readiness.json',
        artifactRole: 'devview-ci-branch-governance-readiness-report',
        status: 'devview-ci-branch-governance-readiness-reported',
        ciBranchGovernanceReadinessStatus: 'report-only-readiness-recorded-not-enforced',
        workflowInventoryFileCount: 2,
        candidateRequiredCheckCount: 3,
        requiredChecksPolicyPresent: false,
        requiredChecksConfigured: false,
        requiredChecksMutated: false,
        branchProtectionPolicyPresent: false,
        branchProtectionChanged: false,
        branchProtectionMutated: false,
        externalCiMutation: false,
        providerInvoked: false,
        networkCallMade: false,
        apiCallMade: false,
        hooksActivated: false,
        providerNetworkDefaultDenyLinked: true,
        rbacPolicyValidationLinked: true,
        signingReadinessLinked: true,
        provenanceVerificationReadinessLinked: true,
        findingCount: 3,
        downstreamActionCount: 2,
      }),
    )
    expect(payload.scopeCiGovernanceReadiness.status).toBe('readiness-recorded')
    expect(payload.scopeCiGovernanceReadiness.ciBranchGovernanceReadinessSourceCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.workflowInventoryFileCount).toBe(2)
    expect(payload.scopeCiGovernanceReadiness.candidateRequiredCheckCount).toBe(3)
    expect(payload.scopeCiGovernanceReadiness.requiredChecksConfiguredCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.requiredChecksMutatedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.branchProtectionChangedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.branchProtectionMutatedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.externalCiMutationCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.providerInvokedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.networkCallMadeCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.apiCallMadeCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.hooksActivatedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.providerNetworkPolicyLinkedCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.rbacPolicyValidationLinkedCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.signingReadinessLinkedCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.provenanceVerificationReadinessLinkedCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.findingCount).toBe(3)
    expect(payload.scopeCiGovernanceReadiness.downstreamActionCount).toBe(2)
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'ENTERPRISE_CI_BRANCH_GOVERNANCE_READINESS_RECORDED',
        'ENTERPRISE_CI_ACTIVATION_GOVERNANCE_MISSING',
        'ENTERPRISE_RBAC_SIGNING_MISSING',
      ]),
    )
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).not.toContain(
      'ENTERPRISE_CI_BRANCH_GOVERNANCE_READINESS_NOT_SUPPLIED',
    )
    expectSafetyFalse(payload)
  })

  it('summarizes CI/branch policy validation without treating it as external CI activation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/ci-branch-policy-validation.json'), ciBranchPolicyValidationReport())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--ci-branch-policy-validation',
        '.tmp/ci-branch-policy-validation.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.sourceCiBranchPolicyValidationReports).toHaveLength(1)
    expect(payload.sourceCiBranchPolicyValidationReports[0]).toEqual(
      expect.objectContaining({
        path: '.tmp/ci-branch-policy-validation.json',
        artifactRole: 'devview-ci-branch-policy-validation-report',
        status: 'devview-ci-branch-policy-validation-passed',
        ciBranchPolicyValidationStatus: 'passed-report-only-policy-not-enforced',
        declaredRequiredCheckCount: 2,
        matchedWorkflowCandidateCheckCount: 1,
        unmappedDeclaredCheckCount: 1,
        branchProtectionPolicyPresent: true,
        targetBranchCount: 1,
        rbacPolicyValidationLinked: true,
        providerNetworkPolicyLinked: true,
        requiredChecksConfigured: false,
        requiredChecksMutated: false,
        branchProtectionChanged: false,
        branchProtectionMutated: false,
        externalCiMutation: false,
        providerInvoked: false,
        networkCallMade: false,
        apiCallMade: false,
        hooksActivated: false,
        findingCount: 3,
        downstreamActionCount: 2,
      }),
    )
    expect(payload.scopeCiGovernanceReadiness.status).toBe('readiness-recorded')
    expect(payload.scopeCiGovernanceReadiness.ciBranchGovernanceReadinessSourceCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.ciBranchPolicyValidationSourceCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.ciBranchPolicyValidationSourceStatuses).toEqual([
      'devview-ci-branch-policy-validation-passed',
    ])
    expect(payload.scopeCiGovernanceReadiness.policyValidationStatuses).toEqual([
      'passed-report-only-policy-not-enforced',
    ])
    expect(payload.scopeCiGovernanceReadiness.declaredRequiredCheckCount).toBe(2)
    expect(payload.scopeCiGovernanceReadiness.matchedWorkflowCandidateCheckCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.unmappedDeclaredCheckCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.requiredChecksConfiguredCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.requiredChecksMutatedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.branchProtectionPolicyPresentCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.branchProtectionChangedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.branchProtectionMutatedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.policyTargetBranchCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.externalCiMutationCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.providerInvokedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.networkCallMadeCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.apiCallMadeCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.hooksActivatedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.providerNetworkPolicyLinkedCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.rbacPolicyValidationLinkedCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.policyFindingCount).toBe(3)
    expect(payload.scopeCiGovernanceReadiness.policyDownstreamActionCount).toBe(2)
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'ENTERPRISE_CI_BRANCH_POLICY_VALIDATION_RECORDED',
        'ENTERPRISE_CI_ACTIVATION_GOVERNANCE_MISSING',
        'ENTERPRISE_RBAC_SIGNING_MISSING',
      ]),
    )
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).not.toContain(
      'ENTERPRISE_CI_BRANCH_POLICY_VALIDATION_NOT_SUPPLIED',
    )
    expectSafetyFalse(payload)
  })

  it('summarizes CI/branch activation plan without treating it as external CI activation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/ci-branch-activation-plan.json'), ciBranchActivationPlanReport())

    const result = await runDevViewCli(
      [
        'security',
        'report-enterprise-readiness',
        '--ci-branch-activation-plan',
        '.tmp/ci-branch-activation-plan.json',
        '--output',
        '.tmp/enterprise-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.readinessLevel).toBe('not-ready')
    expect(payload.sourceCiBranchActivationPlanReports).toHaveLength(1)
    expect(payload.sourceCiBranchActivationPlanReports[0]).toEqual(
      expect.objectContaining({
        path: '.tmp/ci-branch-activation-plan.json',
        artifactRole: 'devview-ci-branch-activation-plan-report',
        status: 'devview-ci-branch-activation-plan-recorded',
        activationPlanStatus: 'draft-non-authoritative-prerequisites-missing',
        futureOnlyStepCount: 3,
        declaredRequiredCheckCount: 2,
        matchedWorkflowCandidateCheckCount: 1,
        unmappedDeclaredCheckCount: 1,
        extraWorkflowCandidateCheckCount: 1,
        targetBranchCount: 1,
        desiredFutureRuleCount: 2,
        providerDefaultDenyRecorded: true,
        rbacPolicyValidated: true,
        signingReadinessRecorded: true,
        envelopeDigestVerified: true,
        provenanceVerificationReadinessRecorded: true,
        releaseSurfaceValidated: true,
        signedPolicyPresent: false,
        rbacEnforced: false,
        providerGrantPresent: false,
        requiredChecksConfigured: false,
        requiredChecksMutated: false,
        branchProtectionChanged: false,
        branchProtectionMutated: false,
        providerInvoked: false,
        networkCallMade: false,
        apiCallMade: false,
        hooksActivated: false,
        findingCount: 2,
        downstreamActionCount: 2,
      }),
    )
    expect(payload.scopeCiGovernanceReadiness.status).toBe('readiness-recorded')
    expect(payload.scopeCiGovernanceReadiness.ciBranchActivationPlanSourceCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.ciBranchActivationPlanSourceStatuses).toEqual([
      'devview-ci-branch-activation-plan-recorded',
    ])
    expect(payload.scopeCiGovernanceReadiness.activationPlanStatuses).toEqual([
      'draft-non-authoritative-prerequisites-missing',
    ])
    expect(payload.scopeCiGovernanceReadiness.activationPlanFutureOnlyStepCount).toBe(3)
    expect(payload.scopeCiGovernanceReadiness.activationPlanExecutedStepCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.declaredRequiredCheckCount).toBe(2)
    expect(payload.scopeCiGovernanceReadiness.matchedWorkflowCandidateCheckCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.unmappedDeclaredCheckCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.extraWorkflowCandidateCheckCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.requiredChecksConfiguredCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.requiredChecksMutatedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.branchProtectionPolicyPresentCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.branchProtectionChangedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.branchProtectionMutatedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.policyTargetBranchCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.branchProtectionDesiredFutureRuleCount).toBe(2)
    expect(payload.scopeCiGovernanceReadiness.externalCiMutationCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.providerInvokedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.networkCallMadeCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.apiCallMadeCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.hooksActivatedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.activationPlanProviderDefaultDenyRecordedCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.activationPlanRbacPolicyValidatedCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.activationPlanSigningReadinessRecordedCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.activationPlanEnvelopeDigestVerifiedCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.activationPlanProvenanceVerificationReadinessRecordedCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.activationPlanReleaseSurfaceValidatedCount).toBe(1)
    expect(payload.scopeCiGovernanceReadiness.activationPlanSignedPolicyPresentCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.activationPlanRbacEnforcedCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.activationPlanProviderGrantPresentCount).toBe(0)
    expect(payload.scopeCiGovernanceReadiness.activationPlanFindingCount).toBe(2)
    expect(payload.scopeCiGovernanceReadiness.activationPlanDownstreamActionCount).toBe(2)
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'ENTERPRISE_CI_BRANCH_ACTIVATION_PLAN_RECORDED',
        'ENTERPRISE_CI_ACTIVATION_GOVERNANCE_MISSING',
        'ENTERPRISE_RBAC_SIGNING_MISSING',
      ]),
    )
    expect(payload.enterpriseReadinessFindings.map((entry: { code: string }) => entry.code)).not.toContain(
      'ENTERPRISE_CI_BRANCH_ACTIVATION_PLAN_NOT_SUPPLIED',
    )
    expectSafetyFalse(payload)
  })

  it('blocks invalid or authority-claiming CI/branch activation plan sources with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-ci-branch-activation-plan.json'), {
      ...ciBranchActivationPlanReport(),
      status: 'wrong',
    })
    writeJson(join(workspace, '.tmp/executed-ci-branch-activation-plan.json'), {
      ...ciBranchActivationPlanReport(),
      activationSequenceProposal: [
        {
          stepId: 'run-future-external-activation',
          executionMode: 'executed',
        },
      ],
    })
    writeJson(join(workspace, '.tmp/required-checks-ci-branch-activation-plan.json'), {
      ...ciBranchActivationPlanReport(),
      policyDerivedRequiredChecksPlan: {
        ...(ciBranchActivationPlanReport().policyDerivedRequiredChecksPlan as Record<string, unknown>),
        requiredChecksConfigured: true,
      },
    })
    writeJson(join(workspace, '.tmp/branch-ci-branch-activation-plan.json'), {
      ...ciBranchActivationPlanReport(),
      policyDerivedBranchProtectionPlan: {
        ...(ciBranchActivationPlanReport().policyDerivedBranchProtectionPlan as Record<string, unknown>),
        branchProtectionMutated: true,
      },
    })
    writeJson(join(workspace, '.tmp/provider-ci-branch-activation-plan.json'), {
      ...ciBranchActivationPlanReport(),
      providerInvoked: true,
    })
    writeJson(join(workspace, '.tmp/rbac-ci-branch-activation-plan.json'), {
      ...ciBranchActivationPlanReport(),
      prerequisiteGateSummary: {
        ...(ciBranchActivationPlanReport().prerequisiteGateSummary as Record<string, unknown>),
        rbacEnforced: true,
      },
    })

    const wrong = await runEnterpriseWithCiBranchActivationPlan(
      workspace,
      '.tmp/wrong-ci-branch-activation-plan.json',
      '.tmp/wrong-ci-branch-activation-enterprise.json',
    )
    const executed = await runEnterpriseWithCiBranchActivationPlan(
      workspace,
      '.tmp/executed-ci-branch-activation-plan.json',
      '.tmp/executed-ci-branch-activation-enterprise.json',
    )
    const requiredChecks = await runEnterpriseWithCiBranchActivationPlan(
      workspace,
      '.tmp/required-checks-ci-branch-activation-plan.json',
      '.tmp/required-checks-ci-branch-activation-enterprise.json',
    )
    const branch = await runEnterpriseWithCiBranchActivationPlan(
      workspace,
      '.tmp/branch-ci-branch-activation-plan.json',
      '.tmp/branch-ci-branch-activation-enterprise.json',
    )
    const provider = await runEnterpriseWithCiBranchActivationPlan(
      workspace,
      '.tmp/provider-ci-branch-activation-plan.json',
      '.tmp/provider-ci-branch-activation-enterprise.json',
    )
    const rbac = await runEnterpriseWithCiBranchActivationPlan(
      workspace,
      '.tmp/rbac-ci-branch-activation-plan.json',
      '.tmp/rbac-ci-branch-activation-enterprise.json',
    )

    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_CI_BRANCH_ACTIVATION_PLAN_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-ci-branch-activation-enterprise.json'))).toBe(false)

    expect(executed.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(executed.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_CI_BRANCH_ACTIVATION_PLAN_STEP_EXECUTED_UNSUPPORTED',
    )
    expect(existsSync(join(workspace, '.tmp/executed-ci-branch-activation-enterprise.json'))).toBe(false)

    for (const [result, output] of [
      [requiredChecks, '.tmp/required-checks-ci-branch-activation-enterprise.json'],
      [branch, '.tmp/branch-ci-branch-activation-enterprise.json'],
      [provider, '.tmp/provider-ci-branch-activation-enterprise.json'],
    ] as const) {
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
        'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
      )
      expect(existsSync(join(workspace, output))).toBe(false)
    }

    expect(rbac.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(rbac.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_CI_BRANCH_ACTIVATION_PLAN_AUTHORITY_CLAIM_UNSUPPORTED',
    )
    expect(existsSync(join(workspace, '.tmp/rbac-ci-branch-activation-enterprise.json'))).toBe(false)
  })

  it('blocks invalid or authority-claiming CI/branch policy validation sources with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-ci-branch-policy.json'), {
      ...ciBranchPolicyValidationReport(),
      status: 'wrong',
    })
    writeJson(join(workspace, '.tmp/required-checks-ci-branch-policy.json'), {
      ...ciBranchPolicyValidationReport(),
      requiredChecksPolicyValidation: {
        ...(ciBranchPolicyValidationReport().requiredChecksPolicyValidation as Record<string, unknown>),
        requiredChecksConfigured: true,
      },
    })
    writeJson(join(workspace, '.tmp/branch-ci-branch-policy.json'), {
      ...ciBranchPolicyValidationReport(),
      branchProtectionPolicyValidation: {
        ...(ciBranchPolicyValidationReport().branchProtectionPolicyValidation as Record<string, unknown>),
        branchProtectionMutated: true,
      },
    })
    writeJson(join(workspace, '.tmp/provider-ci-branch-policy.json'), {
      ...ciBranchPolicyValidationReport(),
      providerNetworkPrerequisiteValidation: {
        ...(ciBranchPolicyValidationReport().providerNetworkPrerequisiteValidation as Record<string, unknown>),
        providerInvoked: true,
      },
    })
    writeJson(join(workspace, '.tmp/rbac-ci-branch-policy.json'), {
      ...ciBranchPolicyValidationReport(),
      rbacEnforced: true,
    })

    const wrong = await runEnterpriseWithCiBranchPolicyValidation(
      workspace,
      '.tmp/wrong-ci-branch-policy.json',
      '.tmp/wrong-ci-branch-policy-enterprise.json',
    )
    const requiredChecks = await runEnterpriseWithCiBranchPolicyValidation(
      workspace,
      '.tmp/required-checks-ci-branch-policy.json',
      '.tmp/required-checks-ci-branch-policy-enterprise.json',
    )
    const branch = await runEnterpriseWithCiBranchPolicyValidation(
      workspace,
      '.tmp/branch-ci-branch-policy.json',
      '.tmp/branch-ci-branch-policy-enterprise.json',
    )
    const provider = await runEnterpriseWithCiBranchPolicyValidation(
      workspace,
      '.tmp/provider-ci-branch-policy.json',
      '.tmp/provider-ci-branch-policy-enterprise.json',
    )
    const rbac = await runEnterpriseWithCiBranchPolicyValidation(
      workspace,
      '.tmp/rbac-ci-branch-policy.json',
      '.tmp/rbac-ci-branch-policy-enterprise.json',
    )

    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_CI_BRANCH_POLICY_VALIDATION_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-ci-branch-policy-enterprise.json'))).toBe(false)

    for (const [result, output] of [
      [requiredChecks, '.tmp/required-checks-ci-branch-policy-enterprise.json'],
      [branch, '.tmp/branch-ci-branch-policy-enterprise.json'],
      [provider, '.tmp/provider-ci-branch-policy-enterprise.json'],
    ] as const) {
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
        'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
      )
      expect(existsSync(join(workspace, output))).toBe(false)
    }

    expect(rbac.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(rbac.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_CI_BRANCH_POLICY_VALIDATION_AUTHORITY_CLAIM_UNSUPPORTED',
    )
    expect(existsSync(join(workspace, '.tmp/rbac-ci-branch-policy-enterprise.json'))).toBe(false)
  })

  it('blocks invalid or authority-claiming CI/branch governance readiness sources with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-ci-branch.json'), {
      ...ciBranchGovernanceReadinessReport(),
      status: 'wrong',
    })
    writeJson(join(workspace, '.tmp/branch-ci-branch.json'), {
      ...ciBranchGovernanceReadinessReport(),
      branchProtectionMutated: true,
    })
    writeJson(join(workspace, '.tmp/required-checks-ci-branch.json'), {
      ...ciBranchGovernanceReadinessReport(),
      requiredChecksGovernanceReadiness: {
        ...(ciBranchGovernanceReadinessReport().requiredChecksGovernanceReadiness as Record<string, unknown>),
        requiredChecksConfigured: true,
      },
    })
    writeJson(join(workspace, '.tmp/provider-ci-branch.json'), {
      ...ciBranchGovernanceReadinessReport(),
      ciProviderGovernanceReadiness: {
        ...(ciBranchGovernanceReadinessReport().ciProviderGovernanceReadiness as Record<string, unknown>),
        providerInvoked: true,
      },
    })
    writeJson(join(workspace, '.tmp/rbac-ci-branch.json'), {
      ...ciBranchGovernanceReadinessReport(),
      rbacEnforced: true,
    })

    const wrong = await runEnterpriseWithCiBranchGovernanceReadiness(
      workspace,
      '.tmp/wrong-ci-branch.json',
      '.tmp/wrong-ci-branch-enterprise.json',
    )
    const branch = await runEnterpriseWithCiBranchGovernanceReadiness(
      workspace,
      '.tmp/branch-ci-branch.json',
      '.tmp/branch-ci-branch-enterprise.json',
    )
    const requiredChecks = await runEnterpriseWithCiBranchGovernanceReadiness(
      workspace,
      '.tmp/required-checks-ci-branch.json',
      '.tmp/required-checks-ci-branch-enterprise.json',
    )
    const provider = await runEnterpriseWithCiBranchGovernanceReadiness(
      workspace,
      '.tmp/provider-ci-branch.json',
      '.tmp/provider-ci-branch-enterprise.json',
    )
    const rbac = await runEnterpriseWithCiBranchGovernanceReadiness(
      workspace,
      '.tmp/rbac-ci-branch.json',
      '.tmp/rbac-ci-branch-enterprise.json',
    )

    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_CI_BRANCH_GOVERNANCE_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-ci-branch-enterprise.json'))).toBe(false)

    for (const [result, output] of [
      [branch, '.tmp/branch-ci-branch-enterprise.json'],
      [requiredChecks, '.tmp/required-checks-ci-branch-enterprise.json'],
      [provider, '.tmp/provider-ci-branch-enterprise.json'],
    ] as const) {
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
        'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
      )
      expect(existsSync(join(workspace, output))).toBe(false)
    }

    expect(rbac.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(rbac.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_CI_BRANCH_GOVERNANCE_AUTHORITY_CLAIM_UNSUPPORTED',
    )
    expect(existsSync(join(workspace, '.tmp/rbac-ci-branch-enterprise.json'))).toBe(false)
  })

  it('blocks invalid or authority-claiming release provenance readiness sources with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-release-provenance.json'), {
      ...releaseProvenanceReadinessReport(),
      status: 'wrong',
    })
    writeJson(join(workspace, '.tmp/sbom-release-provenance.json'), {
      ...releaseProvenanceReadinessReport(),
      sbomReadiness: {
        ...(releaseProvenanceReadinessReport().sbomReadiness as Record<string, unknown>),
        sbomGenerated: true,
      },
    })
    writeJson(join(workspace, '.tmp/signing-release-provenance.json'), {
      ...releaseProvenanceReadinessReport(),
      packageSigningReadiness: {
        ...(releaseProvenanceReadinessReport().packageSigningReadiness as Record<string, unknown>),
        packageSigningPresent: true,
      },
    })
    writeJson(join(workspace, '.tmp/attestation-release-provenance.json'), {
      ...releaseProvenanceReadinessReport(),
      provenanceAttestationReadiness: {
        ...(releaseProvenanceReadinessReport().provenanceAttestationReadiness as Record<string, unknown>),
        provenanceAttestationPresent: true,
      },
    })
    writeJson(join(workspace, '.tmp/crypto-release-provenance.json'), {
      ...releaseProvenanceReadinessReport(),
      cryptographicSignatureVerified: true,
    })
    writeJson(join(workspace, '.tmp/network-release-provenance.json'), {
      ...releaseProvenanceReadinessReport(),
      networkCallMade: true,
    })

    const wrong = await runEnterpriseWithReleaseProvenance(
      workspace,
      '.tmp/wrong-release-provenance.json',
      '.tmp/wrong-release-enterprise.json',
    )
    const sbom = await runEnterpriseWithReleaseProvenance(
      workspace,
      '.tmp/sbom-release-provenance.json',
      '.tmp/sbom-release-enterprise.json',
    )
    const signing = await runEnterpriseWithReleaseProvenance(
      workspace,
      '.tmp/signing-release-provenance.json',
      '.tmp/signing-release-enterprise.json',
    )
    const attestation = await runEnterpriseWithReleaseProvenance(
      workspace,
      '.tmp/attestation-release-provenance.json',
      '.tmp/attestation-release-enterprise.json',
    )
    const crypto = await runEnterpriseWithReleaseProvenance(
      workspace,
      '.tmp/crypto-release-provenance.json',
      '.tmp/crypto-release-enterprise.json',
    )
    const network = await runEnterpriseWithReleaseProvenance(
      workspace,
      '.tmp/network-release-provenance.json',
      '.tmp/network-release-enterprise.json',
    )

    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_RELEASE_PROVENANCE_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-release-enterprise.json'))).toBe(false)

    for (const [result, output] of [
      [sbom, '.tmp/sbom-release-enterprise.json'],
      [signing, '.tmp/signing-release-enterprise.json'],
      [attestation, '.tmp/attestation-release-enterprise.json'],
      [crypto, '.tmp/crypto-release-enterprise.json'],
    ] as const) {
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
        'ENTERPRISE_READINESS_RELEASE_PROVENANCE_AUTHORITY_CLAIM_UNSUPPORTED',
      )
      expect(existsSync(join(workspace, output))).toBe(false)
    }

    expect(network.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(network.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/network-release-enterprise.json'))).toBe(false)
  })

  it('blocks invalid or authority-claiming SBOM validation sources with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-sbom-validation.json'), {
      ...sbomValidationReport(),
      status: 'devview-sbom-validation-blocked',
    })
    writeJson(join(workspace, '.tmp/generated-sbom-validation.json'), {
      ...sbomValidationReport(),
      sbomGeneratedByDevView: true,
    })
    writeJson(join(workspace, '.tmp/attested-sbom-validation.json'), {
      ...sbomValidationReport(),
      sbomAttested: true,
    })
    writeJson(join(workspace, '.tmp/signed-sbom-validation.json'), {
      ...sbomValidationReport(),
      packageSigned: true,
    })
    writeJson(join(workspace, '.tmp/provenance-sbom-validation.json'), {
      ...sbomValidationReport(),
      provenanceAttested: true,
    })
    writeJson(join(workspace, '.tmp/crypto-sbom-validation.json'), {
      ...sbomValidationReport(),
      cryptographicSignatureVerified: true,
    })
    writeJson(join(workspace, '.tmp/key-sbom-validation.json'), {
      ...sbomValidationReport(),
      keyGenerated: true,
    })
    writeJson(join(workspace, '.tmp/rbac-sbom-validation.json'), {
      ...sbomValidationReport(),
      rbacEnforced: true,
    })
    writeJson(join(workspace, '.tmp/network-sbom-validation.json'), {
      ...sbomValidationReport(),
      networkCallMade: true,
    })

    const wrong = await runEnterpriseWithSbomValidation(
      workspace,
      '.tmp/wrong-sbom-validation.json',
      '.tmp/wrong-sbom-enterprise.json',
    )
    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_SBOM_VALIDATION_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-sbom-enterprise.json'))).toBe(false)

    for (const [source, output] of [
      ['.tmp/generated-sbom-validation.json', '.tmp/generated-sbom-enterprise.json'],
      ['.tmp/attested-sbom-validation.json', '.tmp/attested-sbom-enterprise.json'],
      ['.tmp/signed-sbom-validation.json', '.tmp/signed-sbom-enterprise.json'],
      ['.tmp/provenance-sbom-validation.json', '.tmp/provenance-sbom-enterprise.json'],
      ['.tmp/crypto-sbom-validation.json', '.tmp/crypto-sbom-enterprise.json'],
      ['.tmp/key-sbom-validation.json', '.tmp/key-sbom-enterprise.json'],
      ['.tmp/rbac-sbom-validation.json', '.tmp/rbac-sbom-enterprise.json'],
    ] as const) {
      const result = await runEnterpriseWithSbomValidation(workspace, source, output)
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
        'ENTERPRISE_READINESS_SBOM_VALIDATION_AUTHORITY_CLAIM_UNSUPPORTED',
      )
      expect(existsSync(join(workspace, output))).toBe(false)
    }

    const network = await runEnterpriseWithSbomValidation(
      workspace,
      '.tmp/network-sbom-validation.json',
      '.tmp/network-sbom-enterprise.json',
    )
    expect(network.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(network.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/network-sbom-enterprise.json'))).toBe(false)
  })

  it('blocks invalid or authority-claiming package provenance inputs sources with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-package-provenance-inputs.json'), {
      ...packageProvenanceInputsRecord(),
      status: 'devview-package-provenance-inputs-blocked',
    })
    writeJson(join(workspace, '.tmp/package-artifact-inputs.json'), {
      ...packageProvenanceInputsRecord(),
      packageArtifactGenerated: true,
    })
    writeJson(join(workspace, '.tmp/package-digest-inputs.json'), {
      ...packageProvenanceInputsRecord(),
      packageArtifactSha256: 'a'.repeat(64),
    })
    writeJson(join(workspace, '.tmp/signed-package-inputs.json'), {
      ...packageProvenanceInputsRecord(),
      packageSigned: true,
    })
    writeJson(join(workspace, '.tmp/sbom-package-inputs.json'), {
      ...packageProvenanceInputsRecord(),
      sbomGeneratedByDevView: true,
    })
    writeJson(join(workspace, '.tmp/provenance-package-inputs.json'), {
      ...packageProvenanceInputsRecord(),
      provenanceAttested: true,
    })
    writeJson(join(workspace, '.tmp/key-package-inputs.json'), {
      ...packageProvenanceInputsRecord(),
      keyGenerated: true,
    })
    writeJson(join(workspace, '.tmp/rbac-package-inputs.json'), {
      ...packageProvenanceInputsRecord(),
      rbacEnforced: true,
    })
    writeJson(join(workspace, '.tmp/network-package-inputs.json'), {
      ...packageProvenanceInputsRecord(),
      networkCallMade: true,
    })

    const wrong = await runEnterpriseWithPackageProvenanceInputs(
      workspace,
      '.tmp/wrong-package-provenance-inputs.json',
      '.tmp/wrong-package-provenance-enterprise.json',
    )
    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_PACKAGE_PROVENANCE_INPUTS_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-package-provenance-enterprise.json'))).toBe(false)

    const digest = await runEnterpriseWithPackageProvenanceInputs(
      workspace,
      '.tmp/package-digest-inputs.json',
      '.tmp/package-digest-enterprise.json',
    )
    expect(digest.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(digest.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_PACKAGE_PROVENANCE_PACKAGE_DIGEST_UNSUPPORTED',
    )
    expect(existsSync(join(workspace, '.tmp/package-digest-enterprise.json'))).toBe(false)

    for (const [source, output] of [
      ['.tmp/package-artifact-inputs.json', '.tmp/package-artifact-enterprise.json'],
      ['.tmp/signed-package-inputs.json', '.tmp/signed-package-enterprise.json'],
      ['.tmp/sbom-package-inputs.json', '.tmp/sbom-package-enterprise.json'],
      ['.tmp/provenance-package-inputs.json', '.tmp/provenance-package-enterprise.json'],
      ['.tmp/key-package-inputs.json', '.tmp/key-package-enterprise.json'],
      ['.tmp/rbac-package-inputs.json', '.tmp/rbac-package-enterprise.json'],
    ] as const) {
      const result = await runEnterpriseWithPackageProvenanceInputs(workspace, source, output)
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
        'ENTERPRISE_READINESS_PACKAGE_PROVENANCE_INPUTS_AUTHORITY_CLAIM_UNSUPPORTED',
      )
      expect(existsSync(join(workspace, output))).toBe(false)
    }

    const network = await runEnterpriseWithPackageProvenanceInputs(
      workspace,
      '.tmp/network-package-inputs.json',
      '.tmp/network-package-enterprise.json',
    )
    expect(network.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(network.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/network-package-enterprise.json'))).toBe(false)
  })

  it('blocks invalid or authority-claiming package artifact digest sources with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-package-artifact-digest.json'), {
      ...packageArtifactDigestRecord(),
      status: 'devview-package-artifact-digest-blocked',
    })
    writeJson(join(workspace, '.tmp/missing-sha-package-artifact-digest.json'), {
      ...packageArtifactDigestRecord(),
      sourcePackageArtifact: {
        ...(packageArtifactDigestRecord().sourcePackageArtifact as Record<string, unknown>),
        sha256: null,
      },
    })
    writeJson(join(workspace, '.tmp/generated-package-artifact-digest.json'), {
      ...packageArtifactDigestRecord(),
      packageArtifactGeneratedByDevView: true,
    })
    writeJson(join(workspace, '.tmp/published-package-artifact-digest.json'), {
      ...packageArtifactDigestRecord(),
      packagePublished: true,
    })
    writeJson(join(workspace, '.tmp/signed-package-artifact-digest.json'), {
      ...packageArtifactDigestRecord(),
      packageSigned: true,
    })
    writeJson(join(workspace, '.tmp/sbom-package-artifact-digest.json'), {
      ...packageArtifactDigestRecord(),
      sbomAttested: true,
    })
    writeJson(join(workspace, '.tmp/provenance-package-artifact-digest.json'), {
      ...packageArtifactDigestRecord(),
      provenanceAttested: true,
    })
    writeJson(join(workspace, '.tmp/key-package-artifact-digest.json'), {
      ...packageArtifactDigestRecord(),
      keyGenerated: true,
    })
    writeJson(join(workspace, '.tmp/rbac-package-artifact-digest.json'), {
      ...packageArtifactDigestRecord(),
      rbacEnforced: true,
    })
    writeJson(join(workspace, '.tmp/network-package-artifact-digest.json'), {
      ...packageArtifactDigestRecord(),
      networkCallMade: true,
    })

    const wrong = await runEnterpriseWithPackageArtifactDigest(
      workspace,
      '.tmp/wrong-package-artifact-digest.json',
      '.tmp/wrong-package-artifact-digest-enterprise.json',
    )
    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_PACKAGE_ARTIFACT_DIGEST_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-package-artifact-digest-enterprise.json'))).toBe(false)

    const missingSha = await runEnterpriseWithPackageArtifactDigest(
      workspace,
      '.tmp/missing-sha-package-artifact-digest.json',
      '.tmp/missing-sha-package-artifact-digest-enterprise.json',
    )
    expect(missingSha.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(missingSha.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_PACKAGE_ARTIFACT_DIGEST_SHA256_MISSING',
    )
    expect(existsSync(join(workspace, '.tmp/missing-sha-package-artifact-digest-enterprise.json'))).toBe(false)

    for (const [source, output] of [
      ['.tmp/generated-package-artifact-digest.json', '.tmp/generated-package-artifact-digest-enterprise.json'],
      ['.tmp/published-package-artifact-digest.json', '.tmp/published-package-artifact-digest-enterprise.json'],
      ['.tmp/signed-package-artifact-digest.json', '.tmp/signed-package-artifact-digest-enterprise.json'],
      ['.tmp/sbom-package-artifact-digest.json', '.tmp/sbom-package-artifact-digest-enterprise.json'],
      ['.tmp/provenance-package-artifact-digest.json', '.tmp/provenance-package-artifact-digest-enterprise.json'],
      ['.tmp/key-package-artifact-digest.json', '.tmp/key-package-artifact-digest-enterprise.json'],
      ['.tmp/rbac-package-artifact-digest.json', '.tmp/rbac-package-artifact-digest-enterprise.json'],
    ] as const) {
      const result = await runEnterpriseWithPackageArtifactDigest(workspace, source, output)
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
        'ENTERPRISE_READINESS_PACKAGE_ARTIFACT_DIGEST_AUTHORITY_CLAIM_UNSUPPORTED',
      )
      expect(existsSync(join(workspace, output))).toBe(false)
    }

    const network = await runEnterpriseWithPackageArtifactDigest(
      workspace,
      '.tmp/network-package-artifact-digest.json',
      '.tmp/network-package-artifact-digest-enterprise.json',
    )
    expect(network.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(network.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/network-package-artifact-digest-enterprise.json'))).toBe(false)
  })

  it('blocks invalid or authority-claiming provenance attestation validation sources with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-provenance-attestation-validation.json'), {
      ...provenanceAttestationValidationReport(),
      status: 'devview-provenance-attestation-validation-blocked',
    })
    writeJson(join(workspace, '.tmp/generated-provenance-attestation-validation.json'), {
      ...provenanceAttestationValidationReport(),
      provenanceAttestationGeneratedByDevView: true,
    })
    writeJson(join(workspace, '.tmp/verified-provenance-attestation-validation.json'), {
      ...provenanceAttestationValidationReport(),
      provenanceAttestationVerified: true,
    })
    writeJson(join(workspace, '.tmp/signature-provenance-attestation-validation.json'), {
      ...provenanceAttestationValidationReport(),
      cryptographicSignatureVerified: true,
    })
    writeJson(join(workspace, '.tmp/key-provenance-attestation-validation.json'), {
      ...provenanceAttestationValidationReport(),
      keyGenerated: true,
    })
    writeJson(join(workspace, '.tmp/rbac-provenance-attestation-validation.json'), {
      ...provenanceAttestationValidationReport(),
      rbacEnforced: true,
    })
    writeJson(join(workspace, '.tmp/network-provenance-attestation-validation.json'), {
      ...provenanceAttestationValidationReport(),
      networkCallMade: true,
    })

    const wrong = await runEnterpriseWithProvenanceAttestationValidation(
      workspace,
      '.tmp/wrong-provenance-attestation-validation.json',
      '.tmp/wrong-provenance-attestation-enterprise.json',
    )
    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_PROVENANCE_ATTESTATION_VALIDATION_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-provenance-attestation-enterprise.json'))).toBe(false)

    for (const [source, output] of [
      [
        '.tmp/generated-provenance-attestation-validation.json',
        '.tmp/generated-provenance-attestation-enterprise.json',
      ],
      ['.tmp/verified-provenance-attestation-validation.json', '.tmp/verified-provenance-attestation-enterprise.json'],
      [
        '.tmp/signature-provenance-attestation-validation.json',
        '.tmp/signature-provenance-attestation-enterprise.json',
      ],
      ['.tmp/key-provenance-attestation-validation.json', '.tmp/key-provenance-attestation-enterprise.json'],
      ['.tmp/rbac-provenance-attestation-validation.json', '.tmp/rbac-provenance-attestation-enterprise.json'],
    ] as const) {
      const result = await runEnterpriseWithProvenanceAttestationValidation(workspace, source, output)
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
        'ENTERPRISE_READINESS_PROVENANCE_ATTESTATION_VALIDATION_AUTHORITY_CLAIM_UNSUPPORTED',
      )
      expect(existsSync(join(workspace, output))).toBe(false)
    }

    const network = await runEnterpriseWithProvenanceAttestationValidation(
      workspace,
      '.tmp/network-provenance-attestation-validation.json',
      '.tmp/network-provenance-attestation-enterprise.json',
    )
    expect(network.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(network.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/network-provenance-attestation-enterprise.json'))).toBe(false)
  })

  it('blocks invalid or authority-claiming provenance verification readiness sources with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-provenance-verification-readiness.json'), {
      ...provenanceVerificationReadinessReport(),
      status: 'devview-provenance-verification-readiness-blocked',
    })
    writeJson(join(workspace, '.tmp/slsa-provenance-verification-readiness.json'), {
      ...provenanceVerificationReadinessReport(),
      verificationBoundary: {
        ...(provenanceVerificationReadinessReport().verificationBoundary as Record<string, unknown>),
        realSlsaVerificationPerformed: true,
      },
    })
    writeJson(join(workspace, '.tmp/crypto-provenance-verification-readiness.json'), {
      ...provenanceVerificationReadinessReport(),
      verificationBoundary: {
        ...(provenanceVerificationReadinessReport().verificationBoundary as Record<string, unknown>),
        cryptographicSignatureVerified: true,
      },
    })
    writeJson(join(workspace, '.tmp/key-provenance-verification-readiness.json'), {
      ...provenanceVerificationReadinessReport(),
      keyGenerated: true,
    })
    writeJson(join(workspace, '.tmp/rbac-provenance-verification-readiness.json'), {
      ...provenanceVerificationReadinessReport(),
      rbacEnforced: true,
    })
    writeJson(join(workspace, '.tmp/network-provenance-verification-readiness.json'), {
      ...provenanceVerificationReadinessReport(),
      networkCallMade: true,
    })

    const wrong = await runEnterpriseWithProvenanceVerificationReadiness(
      workspace,
      '.tmp/wrong-provenance-verification-readiness.json',
      '.tmp/wrong-provenance-verification-enterprise.json',
    )
    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_PROVENANCE_VERIFICATION_READINESS_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-provenance-verification-enterprise.json'))).toBe(false)

    for (const [source, output] of [
      ['.tmp/slsa-provenance-verification-readiness.json', '.tmp/slsa-provenance-verification-enterprise.json'],
      ['.tmp/crypto-provenance-verification-readiness.json', '.tmp/crypto-provenance-verification-enterprise.json'],
      ['.tmp/key-provenance-verification-readiness.json', '.tmp/key-provenance-verification-enterprise.json'],
      ['.tmp/rbac-provenance-verification-readiness.json', '.tmp/rbac-provenance-verification-enterprise.json'],
    ] as const) {
      const result = await runEnterpriseWithProvenanceVerificationReadiness(workspace, source, output)
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
        'ENTERPRISE_READINESS_PROVENANCE_VERIFICATION_AUTHORITY_CLAIM_UNSUPPORTED',
      )
      expect(existsSync(join(workspace, output))).toBe(false)
    }

    const network = await runEnterpriseWithProvenanceVerificationReadiness(
      workspace,
      '.tmp/network-provenance-verification-readiness.json',
      '.tmp/network-provenance-verification-enterprise.json',
    )
    expect(network.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(network.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ENTERPRISE_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/network-provenance-verification-enterprise.json'))).toBe(false)
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
    writeJson(join(workspace, '.tmp/release-provenance-readiness.json'), releaseProvenanceReadinessReport())
    writeJson(join(workspace, '.tmp/sbom-validation.json'), sbomValidationReport())
    writeJson(join(workspace, '.tmp/package-provenance-inputs.json'), packageProvenanceInputsRecord())
    writeJson(join(workspace, '.tmp/package-artifact-digest.json'), packageArtifactDigestRecord())
    writeJson(join(workspace, '.tmp/ci-branch-governance-readiness.json'), ciBranchGovernanceReadinessReport())
    writeJson(join(workspace, '.tmp/ci-branch-policy-validation.json'), ciBranchPolicyValidationReport())
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
      {
        sourceArgs: ['--release-provenance-readiness', '.tmp/release-provenance-readiness.json'],
        output: '.tmp/release-provenance-readiness.json',
        expected: 'would overwrite a source input',
      },
      {
        sourceArgs: ['--sbom-validation', '.tmp/sbom-validation.json'],
        output: '.tmp/sbom-validation.json',
        expected: 'would overwrite a source input',
      },
      {
        sourceArgs: ['--package-provenance-inputs', '.tmp/package-provenance-inputs.json'],
        output: '.tmp/package-provenance-inputs.json',
        expected: 'would overwrite a source input',
      },
      {
        sourceArgs: ['--package-artifact-digest', '.tmp/package-artifact-digest.json'],
        output: '.tmp/package-artifact-digest.json',
        expected: 'would overwrite a source input',
      },
      {
        sourceArgs: ['--ci-branch-governance-readiness', '.tmp/ci-branch-governance-readiness.json'],
        output: '.tmp/ci-branch-governance-readiness.json',
        expected: 'would overwrite a source input',
      },
      {
        sourceArgs: ['--ci-branch-policy-validation', '.tmp/ci-branch-policy-validation.json'],
        output: '.tmp/ci-branch-policy-validation.json',
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
      packageFilesAllowlistEntries: ['skills/**'],
      releaseSurfaceScriptPresent: true,
      releaseSurfaceScript: 'node scripts/check-devview-release-surface.js --pack-dry-run',
      releaseSurfaceCheckerPresent: true,
      releaseSurfaceCheckerPath: 'scripts/check-devview-release-surface.js',
    },
    releaseSurfaceReadiness: {
      checkerPresent: true,
      packageDryRunExecuted: false,
      packageDryRunReadiness: 'not-executed-report-only',
      packageDryRunSourceSupplied: false,
      publicIdentityScanExecuted: false,
      publicIdentityScanStatus: 'not-executed-report-only',
      limitations: [],
    },
    sbomReadiness: {
      sbomPresent: false,
      sbomGenerated: false,
      sbomAttested: false,
      supportedFormatsFutureCandidates: ['SPDX', 'CycloneDX'],
      requiredFutureFields: [],
      gaps: [],
    },
    packageSigningReadiness: {
      packageSigningPresent: false,
      packageSignatureVerified: false,
      signingReadinessSourceStatus: 'not-ready-policy-and-key-governance-missing',
      keyRegistryPresent: false,
      trustRootPresent: false,
      privateKeyStoragePresent: false,
      requiredKeyTrustPolicyGaps: [],
    },
    provenanceAttestationReadiness: {
      provenanceAttestationPresent: false,
      provenanceAttested: false,
      npmProvenanceEnabled: false,
      slsaProvenanceGenerated: false,
      requiredFutureFields: [],
      futureOnlyPolicy: 'future-only',
    },
    releaseProvenanceFindings: [
      { severity: 'blocker', code: 'RELEASE_PROVENANCE_SBOM_MISSING', message: 'No SBOM.' },
      { severity: 'blocker', code: 'RELEASE_PROVENANCE_PACKAGE_SIGNING_MISSING', message: 'No signing.' },
      { severity: 'blocker', code: 'RELEASE_PROVENANCE_ATTESTATION_MISSING', message: 'No attestation.' },
    ],
    downstreamActionPlan: ['Integrate into enterprise readiness.', 'Plan real SBOM and provenance later.'],
    sbomGenerated: false,
    sbomPresent: false,
    sbomAttested: false,
    packageSigningPresent: false,
    packageSigned: false,
    packageSignaturePresent: false,
    packageSignatureVerified: false,
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
      documentName: 'DevView minimal SBOM',
      documentVersion: '1',
      componentCount: 2,
      externalReferenceCount: 1,
    },
    sourceReleaseProvenanceReadiness: {
      supplied: true,
      path: '.tmp/release-provenance-readiness.json',
      artifactRole: 'devview-release-provenance-readiness-report',
      status: 'devview-release-provenance-readiness-reported',
      releaseProvenanceReadinessStatus: 'not-ready-sbom-and-signing-missing',
      sbomGenerated: false,
      sbomAttested: false,
    },
    sourceReleaseSurfaceValidation: {
      supplied: true,
      path: '.tmp/release-surface-validation.json',
      artifactRole: 'devview-release-surface-validation-report',
      status: 'devview-release-surface-validation-passed',
      packageName: 'devview',
      packageVersion: '0.2.0-alpha',
      packageFileCount: 14,
      forbiddenFindingCount: 0,
    },
    packageJsonSummary: {
      supplied: true,
      path: 'package.json',
      packageName: 'devview',
      packageVersion: '0.2.0-alpha',
      packagePrivate: true,
      packageFilesAllowlistPresent: true,
      packageFilesAllowlistCount: 14,
    },
    sbomStructuralValidation: {
      formatRecognized: true,
      requiredFieldsPresent: true,
      componentListPresent: true,
      duplicateComponentIds: [],
      unsupportedInstructionFieldCount: 0,
      requiredFieldsMissing: [],
    },
    packageIdentityAlignment: {
      packageJsonNameMatch: true,
      packageJsonVersionMatch: true,
      releaseSurfaceNameMatch: true,
      releaseSurfaceVersionMatch: true,
      alignmentStatus: 'matched',
    },
    componentCoverageSummary: {
      componentCount: 2,
      packageRootComponentPresent: true,
      dependencyComponentCount: 1,
      fileReferenceCount: 1,
    },
    digestSummary: {
      sbomSha256: '0'.repeat(64),
      sbomByteLength: 1024,
      declaredPackageDigest: 'sha256:package-digest-placeholder',
      sourceDigestsRecorded: true,
      sourceArtifactDigests: [
        { sourceKind: 'sbom', path: '.tmp/sbom-artifact.json', sha256: '0'.repeat(64), byteLength: 1024 },
        { sourceKind: 'package-json', path: 'package.json', sha256: '1'.repeat(64), byteLength: 2227 },
        {
          sourceKind: 'release-provenance-readiness',
          path: '.tmp/release-provenance-readiness.json',
          sha256: '2'.repeat(64),
          byteLength: 4096,
        },
      ],
    },
    validationFindings: [
      { severity: 'satisfied', code: 'SBOM_VALIDATION_ARTIFACT_ACCEPTED', message: 'Accepted.' },
      { severity: 'satisfied', code: 'SBOM_VALIDATION_DIGEST_RECORDED', message: 'Digest recorded.' },
      { severity: 'gap', code: 'SBOM_VALIDATION_NOT_ATTESTED', message: 'No attestation.' },
    ],
    downstreamActionPlan: ['Integrate into enterprise readiness.', 'Record package provenance inputs later.'],
    sbomGeneratedByDevView: false,
    sbomGenerated: false,
    sbomAttested: false,
    packageSigned: false,
    packageSigningPresent: false,
    packageSignaturePresent: false,
    packageSignatureVerified: false,
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

function packageProvenanceInputsRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-package-provenance-inputs-record',
    status: 'devview-package-provenance-inputs-recorded',
    provenanceInputsScope: 'package-provenance-inputs-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    packageProvenanceInputsStatus: 'recorded-source-inputs-only',
    packageMetadataSummary: {
      supplied: true,
      path: 'package.json',
      packageName: 'devview',
      packageVersion: '0.2.0-alpha',
      packagePrivate: true,
      packageFilesAllowlistPresent: true,
      packageFilesAllowlistCount: 14,
      packageFilesAllowlistEntries: ['skills/**'],
      packageJsonSha256: '1'.repeat(64),
      packageJsonByteLength: 2227,
    },
    sourceRefSummary: {
      sourceRefStatus: 'supplied-explicit-cli-input',
      value: 'dd3a36e42a26efa247284c5b3b198d5fdf0bbb3e',
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
      {
        sourceKind: 'release-surface-validation',
        path: '.tmp/release-surface-validation.json',
        artifactRole: 'devview-release-surface-validation-report',
        status: 'devview-release-surface-validation-passed',
        sha256: '2'.repeat(64),
        byteLength: 2048,
      },
      {
        sourceKind: 'release-provenance-readiness',
        path: '.tmp/release-provenance-readiness.json',
        artifactRole: 'devview-release-provenance-readiness-report',
        status: 'devview-release-provenance-readiness-reported',
        sha256: '3'.repeat(64),
        byteLength: 4096,
      },
      {
        sourceKind: 'sbom-validation',
        path: '.tmp/sbom-validation.json',
        artifactRole: 'devview-sbom-validation-report',
        status: 'devview-sbom-validation-passed',
        sha256: '4'.repeat(64),
        byteLength: 3072,
      },
    ],
    releaseSurfaceSourceSummary: {
      supplied: true,
      path: '.tmp/release-surface-validation.json',
      artifactRole: 'devview-release-surface-validation-report',
      status: 'devview-release-surface-validation-passed',
      packageName: 'devview',
      packageVersion: '0.2.0-alpha',
      packageFileCount: 14,
      forbiddenFindingCount: 0,
    },
    releaseProvenanceReadinessSummary: {
      supplied: true,
      path: '.tmp/release-provenance-readiness.json',
      artifactRole: 'devview-release-provenance-readiness-report',
      status: 'devview-release-provenance-readiness-reported',
      releaseProvenanceReadinessStatus: 'not-ready-sbom-and-signing-missing',
      sbomGenerated: false,
      packageSigningPresent: false,
      provenanceAttested: false,
      findingCount: 3,
      downstreamActionCount: 2,
    },
    sbomValidationSummary: {
      supplied: true,
      path: '.tmp/sbom-validation.json',
      artifactRole: 'devview-sbom-validation-report',
      status: 'devview-sbom-validation-passed',
      sbomValidationStatus: 'validated-structural-source-fact-only',
      sbomFormat: 'devview-minimal-sbom-v1',
      sbomSha256: '0'.repeat(64),
      sbomByteLength: 1024,
      packageName: 'devview',
      packageVersion: '0.2.0-alpha',
      packageIdentityAlignmentStatus: 'matched',
      componentCount: 2,
    },
    packageDigestStatus: 'not-computed-no-package-artifact-supplied',
    packageArtifactSupplied: false,
    packageArtifactSha256: null,
    provenanceAttestationStatus: 'not-generated',
    packageProvenanceFindings: [
      { severity: 'satisfied', code: 'PACKAGE_PROVENANCE_PACKAGE_JSON_DIGEST_RECORDED' },
      { severity: 'satisfied', code: 'PACKAGE_PROVENANCE_SOURCE_REF_RECORDED' },
      { severity: 'satisfied', code: 'PACKAGE_PROVENANCE_BUILD_COMMAND_LABEL_RECORDED' },
      { severity: 'gap', code: 'PACKAGE_PROVENANCE_PACKAGE_DIGEST_NOT_COMPUTED' },
      { severity: 'gap', code: 'PACKAGE_PROVENANCE_ATTESTATION_NOT_GENERATED' },
    ],
    downstreamActionPlan: [
      'Integrate this package provenance inputs record into enterprise readiness as a source fact.',
      'Capture a package artifact digest in a future report-only slice without creating package signatures.',
      'Validate provenance attestation structure before any real provenance attestation generation.',
    ],
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
      sha256: '5'.repeat(64),
      extension: '.tgz',
      typeHint: 'npm-package-tarball',
      expectedSha256: '5'.repeat(64),
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
      sourceArtifactDigestCount: 4,
      sourceRefStatus: 'supplied-explicit-cli-input',
      buildCommandLabelStatus: 'supplied-metadata-only',
      packageDigestStatus: 'not-computed-no-package-artifact-supplied',
      provenanceAttestationStatus: 'not-generated',
    },
    sourceReleaseSurfaceValidation: {
      supplied: true,
      path: '.tmp/release-surface-validation.json',
      artifactRole: 'devview-release-surface-validation-report',
      status: 'devview-release-surface-validation-passed',
      packageName: 'devview',
      packageVersion: '0.2.0-alpha',
      packageFileCount: 14,
      forbiddenFindingCount: 0,
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
        sha256: '5'.repeat(64),
        byteLength: 31,
      },
      {
        sourceKind: 'package-provenance-inputs',
        path: '.tmp/package-provenance-inputs.json',
        artifactRole: 'devview-package-provenance-inputs-record',
        status: 'devview-package-provenance-inputs-recorded',
        sha256: '6'.repeat(64),
        byteLength: 4096,
      },
      {
        sourceKind: 'release-surface-validation',
        path: '.tmp/release-surface-validation.json',
        artifactRole: 'devview-release-surface-validation-report',
        status: 'devview-release-surface-validation-passed',
        sha256: '7'.repeat(64),
        byteLength: 2048,
      },
    ],
    packageDigestRecordFindings: [
      { severity: 'satisfied', code: 'PACKAGE_ARTIFACT_DIGEST_RECORDED' },
      { severity: 'satisfied', code: 'PACKAGE_ARTIFACT_DIGEST_EXPECTED_SHA256_MATCHED' },
      { severity: 'satisfied', code: 'PACKAGE_ARTIFACT_DIGEST_PROVENANCE_INPUTS_LINKED' },
      { severity: 'gap', code: 'PACKAGE_ARTIFACT_DIGEST_NO_ATTESTATION_GENERATED' },
    ],
    downstreamActionPlan: [
      'Integrate this package artifact digest record into enterprise readiness as a source fact.',
      'Validate a preexisting provenance attestation artifact against this digest before any real attestation generation.',
      'Keep package signing, provenance attestation, and SBOM attestation behind signing/key/RBAC governance.',
    ],
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
    ...overrides,
  }
}

function provenanceAttestationValidationReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-provenance-attestation-validation-report',
    status: 'devview-provenance-attestation-validation-passed',
    validationScope: 'provenance-attestation-validation-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    attestationValidationStatus: 'validated-structural-source-fact-only',
    signatureValidationStatus: 'not-performed-source-fact-only',
    sourceAttestationArtifact: {
      path: '.tmp/provenance-attestation.json',
      artifactRole: 'devview-provenance-attestation-artifact',
      status: 'devview-provenance-attestation-supplied',
      attestationScope: 'package-provenance-attestation-source-fact-only',
      attestationFormat: 'devview-minimal-provenance-v1',
      packageName: 'devview',
      packageVersion: '0.2.0-alpha',
      declaredPackageSha256: '5'.repeat(64),
      sourceRef: 'cf9185403a128aebd9fb31c65e84fee39d39c632',
      buildCommandLabel: 'npm run build:cli',
      byteLength: 2048,
      sha256: '8'.repeat(64),
    },
    sourcePackageProvenanceInputs: {
      supplied: true,
      path: '.tmp/package-provenance-inputs.json',
      artifactRole: 'devview-package-provenance-inputs-record',
      status: 'devview-package-provenance-inputs-recorded',
      packageName: 'devview',
      packageVersion: '0.2.0-alpha',
      sourceRef: 'cf9185403a128aebd9fb31c65e84fee39d39c632',
      buildCommandLabel: 'npm run build:cli',
      sourceArtifactDigestCount: 4,
      provenanceAttestationStatus: 'not-generated',
    },
    sourcePackageArtifactDigest: {
      supplied: true,
      path: '.tmp/package-artifact-digest.json',
      artifactRole: 'devview-package-artifact-digest-record',
      status: 'devview-package-artifact-digest-recorded',
      artifactDigestStatus: 'matched-expected',
      packageName: 'devview',
      packageVersion: '0.2.0-alpha',
      packageSha256: '5'.repeat(64),
      expectedSha256Match: true,
    },
    sourceReleaseProvenanceReadiness: {
      supplied: true,
      path: '.tmp/release-provenance-readiness.json',
      artifactRole: 'devview-release-provenance-readiness-report',
      status: 'devview-release-provenance-readiness-reported',
      releaseProvenanceReadinessStatus: 'not-ready-sbom-and-signing-missing',
      provenanceAttestationPresent: false,
      provenanceAttested: false,
    },
    attestationStructuralValidation: {
      formatRecognized: true,
      requiredFieldsPresent: true,
      packageDigestStatementPresent: true,
      sourceBuildInputsPresent: true,
      requiredFieldsMissing: [],
      unsupportedInstructionFieldCount: 0,
      unsupportedInstructionFields: [],
    },
    packageDigestAlignment: {
      declaredPackageSha256: '5'.repeat(64),
      packageArtifactDigestSha256: '5'.repeat(64),
      packageDigestMatches: true,
      alignmentStatus: 'matched',
    },
    provenanceInputAlignment: {
      packageNameMatches: true,
      packageVersionMatches: true,
      sourceRefMatches: true,
      buildCommandLabelMatches: true,
      alignmentStatus: 'matched',
    },
    digestSummary: {
      attestationSha256: '8'.repeat(64),
      attestationByteLength: 2048,
      sourceArtifactDigests: [
        {
          sourceKind: 'attestation',
          path: '.tmp/provenance-attestation.json',
          artifactRole: 'devview-provenance-attestation-artifact',
          status: 'devview-provenance-attestation-supplied',
          sha256: '8'.repeat(64),
          byteLength: 2048,
        },
        {
          sourceKind: 'package-artifact-digest',
          path: '.tmp/package-artifact-digest.json',
          artifactRole: 'devview-package-artifact-digest-record',
          status: 'devview-package-artifact-digest-recorded',
          sha256: '9'.repeat(64),
          byteLength: 4096,
        },
      ],
    },
    validationFindings: [
      { severity: 'satisfied', code: 'PROVENANCE_ATTESTATION_VALIDATED_SOURCE_FACT' },
      { severity: 'satisfied', code: 'PROVENANCE_ATTESTATION_DIGEST_RECORDED' },
      { severity: 'gap', code: 'PROVENANCE_ATTESTATION_SIGNATURE_NOT_VERIFIED' },
      { severity: 'satisfied', code: 'PROVENANCE_ATTESTATION_PACKAGE_INPUTS_LINKED' },
      { severity: 'satisfied', code: 'PROVENANCE_ATTESTATION_PACKAGE_DIGEST_LINKED' },
      { severity: 'satisfied', code: 'PROVENANCE_ATTESTATION_RELEASE_READINESS_LINKED' },
    ],
    downstreamActionPlan: [
      'Integrate this provenance attestation validation report into enterprise readiness as a source fact.',
      'Keep real SLSA/in-toto verification behind explicit signing, key, RBAC, and CI governance.',
      'Validate signed attestation verification only after key registry, trust root, and actor policy are modeled.',
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
    packagePublished: false,
    publishingPerformed: false,
    packageArtifactGeneratedByDevView: false,
    packageArtifactGenerated: false,
    packageTarballGenerated: false,
    packageSigned: false,
    packageSigningPresent: false,
    packageSignaturePresent: false,
    packageSignatureVerified: false,
    sbomGeneratedByDevView: false,
    sbomGenerated: false,
    sbomAttested: false,
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

function provenanceVerificationReadinessReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-provenance-verification-readiness-report',
    status: 'devview-provenance-verification-readiness-reported',
    readinessScope: 'provenance-verification-readiness-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    provenanceVerificationReadinessStatus: 'not-ready-key-trust-and-signature-policy-missing',
    sourceProvenanceAttestationValidation: {
      supplied: true,
      path: '.tmp/provenance-attestation-validation.json',
      artifactRole: 'devview-provenance-attestation-validation-report',
      status: 'devview-provenance-attestation-validation-passed',
      attestationFormat: 'devview-minimal-provenance-v1',
      attestationDigestPresent: true,
      packageDigestAlignmentStatus: 'matched',
      provenanceInputAlignmentStatus: 'matched',
      signatureValidationStatus: 'not-performed-source-fact-only',
      provenanceAttestationGeneratedByDevView: false,
      provenanceAttestationGenerated: false,
      provenanceAttestationVerified: false,
      packageSigned: false,
    },
    sourceSigningReadiness: {
      supplied: true,
      path: '.tmp/signing-readiness.json',
      artifactRole: 'devview-signing-readiness-report',
      status: 'devview-signing-readiness-reported',
      signingReadinessStatus: 'not-ready-policy-and-key-governance-missing',
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
    },
    sourceRbacPolicyValidation: {
      supplied: true,
      path: '.tmp/rbac-policy-validation.json',
      artifactRole: 'devview-rbac-policy-validation-report',
      status: 'devview-rbac-policy-validation-passed',
      rbacPolicyValidationStatus: 'passed',
      defaultDenyConfigured: true,
      actorCount: 2,
      roleAssignmentCount: 2,
      permissionGrantCount: 2,
      automationRestrictionDeclared: true,
      extensionAuthorRestrictionDeclared: true,
      noEnforcementPerformed: true,
    },
    sourceRecordEnvelopeVerification: {
      supplied: true,
      path: '.tmp/record-envelope-verification.json',
      artifactRole: 'devview-record-envelope-verification-report',
      status: 'devview-record-envelope-verified',
      signatureVerificationMode: 'not-performed-unsigned-preview-only',
      payloadDigestMatches: true,
      allSourceDigestsMatch: true,
      previousEnvelopeChainLinkVerified: false,
      verificationDigestPresent: true,
      cryptographicSignatureVerified: false,
      rbacPermissionVerified: false,
      rbacEnforced: false,
      permissionVerified: false,
    },
    sourceProviderNetworkPolicy: {
      supplied: true,
      path: '.tmp/provider-network-policy.json',
      artifactRole: 'devview-provider-network-default-deny-policy-report',
      status: 'devview-provider-network-default-deny-policy-recorded',
      defaultProviderPolicy: 'deny',
      defaultNetworkPolicy: 'deny',
      explicitAllowSupported: false,
      providerAllowlistCount: 0,
      networkAllowlistCount: 0,
      futureAllowRequirementCount: 6,
      blockedCapabilityCount: 5,
    },
    verificationBoundary: {
      realSlsaVerificationPerformed: false,
      realInTotoVerificationPerformed: false,
      cryptographicSignatureVerified: false,
      signatureVerificationStatus: 'not-performed-readiness-only',
      provenanceAttestationGenerated: false,
      provenanceAttestationVerified: false,
      packageSigned: false,
    },
    keyTrustReadiness: {
      status: 'not-ready',
      keyRegistryPresent: false,
      trustRootPresent: false,
      keyRotationMetadataPresent: false,
      keyRevocationMetadataPresent: false,
      timestampPolicyPresent: false,
      gaps: ['Key registry is absent.', 'Trust root is absent.', 'Rotation/revocation metadata is absent.'],
    },
    signaturePolicyReadiness: {
      status: 'not-ready',
      detachedSignaturePolicyPresent: false,
      allowedAlgorithmPolicyPresent: false,
      canonicalizationPolicy: 'raw-byte-digest-boundary-recorded',
      timestampPolicy: 'explicit-input-only-required-future',
      gaps: ['Detached signature policy is absent.', 'Allowed algorithm policy is absent.'],
    },
    rbacPrerequisiteReadiness: {
      actorPolicyPresent: true,
      rbacEnforced: false,
      permissionVerified: false,
      policyValidationPresent: true,
      defaultDenyPolicyValidated: true,
      gaps: ['RBAC enforcement is absent.', 'Permission verification is absent.'],
    },
    networkIsolationReadiness: {
      providerNetworkDefaultDenyRecorded: true,
      providerInvoked: false,
      networkCallMade: false,
      apiCallMade: false,
    },
    futureVerificationRequirements: [
      'Signed provenance attestation verification policy',
      'Key registry and trust root',
      'RBAC permission verification',
      'CI governance boundary',
    ],
    provenanceVerificationFindings: [
      { severity: 'satisfied', code: 'PROVENANCE_VERIFICATION_ATTESTATION_VALIDATION_LINKED' },
      { severity: 'satisfied', code: 'PROVENANCE_VERIFICATION_SIGNING_READINESS_LINKED' },
      { severity: 'satisfied', code: 'PROVENANCE_VERIFICATION_RBAC_POLICY_VALIDATION_LINKED' },
      { severity: 'satisfied', code: 'PROVENANCE_VERIFICATION_RECORD_ENVELOPE_VERIFICATION_LINKED' },
      { severity: 'satisfied', code: 'PROVENANCE_VERIFICATION_PROVIDER_NETWORK_POLICY_LINKED' },
      { severity: 'gap', code: 'PROVENANCE_VERIFICATION_KEY_TRUST_MISSING' },
      { severity: 'gap', code: 'PROVENANCE_VERIFICATION_CRYPTO_NOT_PERFORMED' },
    ],
    downstreamActionPlan: [
      'Integrate provenance verification readiness into enterprise readiness as a source fact.',
      'Define signed provenance verification policy and key trust model before real verification.',
      'Keep real SLSA/in-toto verification behind RBAC, signing, and CI governance.',
    ],
    realSlsaVerificationPerformed: false,
    realInTotoVerificationPerformed: false,
    provenanceAttestationGeneratedByDevView: false,
    provenanceAttestationGenerated: false,
    provenanceAttestationVerified: false,
    provenanceAttestationPresent: false,
    provenanceAttested: false,
    releaseProvenanceAttested: false,
    npmProvenanceEnabled: false,
    slsaProvenanceGenerated: false,
    slsaProvenanceVerified: false,
    inTotoStatementVerified: false,
    packagePublished: false,
    publishingPerformed: false,
    packageArtifactGeneratedByDevView: false,
    packageArtifactGenerated: false,
    packageTarballGenerated: false,
    packageSigned: false,
    packageSigningPresent: false,
    packageSignaturePresent: false,
    packageSignatureVerified: false,
    sbomGeneratedByDevView: false,
    sbomGenerated: false,
    sbomAttested: false,
    cryptographicSigningImplemented: false,
    cryptographicSignaturePresent: false,
    cryptographicSignatureVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
    keyManagementImplemented: false,
    keyRegistryPresent: false,
    trustRootPresent: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
    ...safetyFlags(),
    ...overrides,
  }
}

function ciBranchGovernanceReadinessReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-ci-branch-governance-readiness-report',
    status: 'devview-ci-branch-governance-readiness-reported',
    readinessScope: 'ci-branch-governance-readiness-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    ciBranchGovernanceReadinessStatus: 'report-only-readiness-recorded-not-enforced',
    workflowInventory: {
      sourceCount: 2,
      candidateRequiredChecks: ['Quality Gate', 'Candidate B Read-Model Check', 'validate'],
      workflows: [
        { path: '.github/workflows/ci.yml', sha256: 'a'.repeat(64), byteLength: 1024 },
        { path: '.github/workflows/read-model-evidence.yml', sha256: 'b'.repeat(64), byteLength: 512 },
      ],
    },
    requiredChecksGovernanceReadiness: {
      requiredChecksPolicyPresent: false,
      requiredChecksConfigured: false,
      requiredChecksMutated: false,
    },
    branchProtectionGovernanceReadiness: {
      branchProtectionPolicyPresent: false,
      branchProtectionChanged: false,
      branchProtectionMutated: false,
    },
    ciProviderGovernanceReadiness: {
      providerNetworkDefaultDenyLinked: true,
      defaultProviderPolicy: 'deny',
      defaultNetworkPolicy: 'deny',
      providerInvoked: false,
      networkCallMade: false,
      apiCallMade: false,
    },
    scopeCiLifecycleBoundary: {
      scopeCiReadinessSupplied: true,
      scopeCiRecordSupplied: true,
      internalScopeLifecycleRecorded: true,
      internalCiLifecycleRecorded: true,
      externalCiMutation: false,
      requiredChecksConfigured: false,
      branchProtectionMutated: false,
      hooksActivated: false,
    },
    rbacPrerequisiteReadiness: {
      policyValidationLinked: true,
      rbacEnforced: false,
      permissionVerified: false,
    },
    signingAndProvenancePrerequisiteReadiness: {
      signingReadinessLinked: true,
      provenanceVerificationReadinessLinked: true,
      cryptographicSignatureVerified: false,
      realSlsaVerificationPerformed: false,
      realInTotoVerificationPerformed: false,
    },
    governanceFindings: [
      {
        severity: 'satisfied',
        code: 'CI_BRANCH_GOVERNANCE_WORKFLOW_INVENTORY_RECORDED',
        message: 'Workflow inventory recorded.',
      },
      {
        severity: 'gap',
        code: 'CI_BRANCH_GOVERNANCE_EXTERNAL_GOVERNANCE_NOT_READY',
        message: 'External governance missing.',
      },
      {
        severity: 'satisfied',
        code: 'CI_BRANCH_GOVERNANCE_PROVIDER_NETWORK_POLICY_LINKED',
        message: 'Provider policy linked.',
      },
    ],
    downstreamActionPlan: ['Integrate into enterprise readiness.', 'Add declarative CI/branch policy validation.'],
    githubMutated: false,
    githubWorkflowMutated: false,
    workflowExecuted: false,
    workflowsExecuted: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    hooksActivated: false,
    ciProviderCalled: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    cryptographicSignatureVerified: false,
    cryptographicSigningImplemented: false,
    keyGenerated: false,
    privateKeyStored: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
    packageArtifactGeneratedByDevView: false,
    packageArtifactGenerated: false,
    packageTarballGenerated: false,
    packageSigned: false,
    sbomGeneratedByDevView: false,
    sbomGenerated: false,
    sbomAttested: false,
    provenanceAttestationGenerated: false,
    provenanceAttestationVerified: false,
    provenanceAttested: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    enterpriseGateActivated: false,
    ...overrides,
  }
}

function ciBranchPolicyValidationReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-ci-branch-policy-validation-report',
    status: 'devview-ci-branch-policy-validation-passed',
    scope: 'ci-branch-policy-validation-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    ciBranchPolicyValidationStatus: 'passed-report-only-policy-not-enforced',
    sourcePolicy: {
      path: '.tmp/ci-branch-policy.json',
      artifactRole: 'devview-ci-branch-policy',
      status: 'devview-ci-branch-policy-configured',
      policyScope: 'ci-branch-policy-validation-report-only',
      sha256: 'c'.repeat(64),
      byteLength: 2048,
    },
    sourceCiBranchGovernanceReadiness: {
      supplied: true,
      path: '.tmp/ci-branch-governance-readiness.json',
      artifactRole: 'devview-ci-branch-governance-readiness-report',
      status: 'devview-ci-branch-governance-readiness-reported',
    },
    requiredChecksPolicyValidation: {
      requiredChecksPolicyPresent: true,
      requiredChecksConfigured: false,
      requiredChecksMutated: false,
      declaredCheckCount: 2,
      workflowCandidateMatchCount: 1,
      unmappedDeclaredChecks: ['release-provenance-readiness'],
      extraWorkflowCandidateChecks: ['validate'],
    },
    branchProtectionPolicyValidation: {
      branchProtectionPolicyPresent: true,
      targetBranchCount: 1,
      desiredFutureRuleCount: 3,
      branchProtectionChanged: false,
      branchProtectionMutated: false,
    },
    actorRbacPrerequisiteValidation: {
      requiredRoleCount: 2,
      requiredPermissionCount: 3,
      rbacPolicyValidationLinked: true,
      rbacEnforced: false,
      permissionVerified: false,
    },
    providerNetworkPrerequisiteValidation: {
      providerNetworkPolicyLinked: true,
      defaultProviderPolicy: 'deny',
      defaultNetworkPolicy: 'deny',
      providerAllowlistEmpty: true,
      networkAllowlistEmpty: true,
      providerInvoked: false,
      networkCallMade: false,
      apiCallMade: false,
    },
    activationBoundary: {
      activationMode: 'report-only-no-mutation',
      reportOnly: true,
      githubMutated: false,
      requiredChecksConfigured: false,
      requiredChecksMutated: false,
      branchProtectionChanged: false,
      branchProtectionMutated: false,
      externalCiMutation: false,
      hooksActivated: false,
      enterpriseGateActivated: false,
    },
    policyFindings: [
      {
        severity: 'satisfied',
        code: 'CI_BRANCH_POLICY_DEFAULT_DENY_RECORDED',
        message: 'Default deny policy recorded.',
      },
      {
        severity: 'gap',
        code: 'CI_BRANCH_POLICY_DECLARED_CHECK_UNMAPPED',
        message: 'A declared check is not mapped to a workflow candidate.',
      },
      {
        severity: 'gap',
        code: 'CI_BRANCH_POLICY_NOT_ENFORCED',
        message: 'Policy is not externally configured or enforced.',
      },
    ],
    downstreamActionPlan: [
      'Integrate CI/branch policy validation into enterprise readiness.',
      'Design a separate activation plan before configuring branch protection or required checks.',
    ],
    githubMutated: false,
    githubWorkflowMutated: false,
    workflowExecuted: false,
    workflowsExecuted: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    hooksActivated: false,
    ciProviderCalled: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    cryptographicSignatureVerified: false,
    cryptographicSigningImplemented: false,
    keyGenerated: false,
    privateKeyStored: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
    packageArtifactGeneratedByDevView: false,
    packageArtifactGenerated: false,
    packageTarballGenerated: false,
    packageSigned: false,
    sbomGeneratedByDevView: false,
    sbomGenerated: false,
    sbomAttested: false,
    provenanceAttestationGenerated: false,
    provenanceAttestationVerified: false,
    provenanceAttested: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    enterpriseGateActivated: false,
    ...overrides,
  }
}

function ciBranchActivationPlanReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-ci-branch-activation-plan-report',
    status: 'devview-ci-branch-activation-plan-recorded',
    activationPlanScope: 'ci-branch-activation-plan-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    activationPlanStatus: 'draft-non-authoritative-prerequisites-missing',
    sourceCiBranchPolicyValidation: {
      supplied: true,
      path: '.tmp/ci-branch-policy-validation.json',
      artifactRole: 'devview-ci-branch-policy-validation-report',
      status: 'devview-ci-branch-policy-validation-passed',
    },
    sourceCiBranchGovernanceReadiness: {
      supplied: true,
      path: '.tmp/ci-branch-governance-readiness.json',
      artifactRole: 'devview-ci-branch-governance-readiness-report',
      status: 'devview-ci-branch-governance-readiness-reported',
    },
    policyDerivedRequiredChecksPlan: {
      requiredChecksPolicyPresent: true,
      declaredCheckCount: 2,
      matchedWorkflowCandidateCheckCount: 1,
      unmappedDeclaredCheckCount: 1,
      extraWorkflowCandidateCheckCount: 1,
      requiredChecksConfigured: false,
      requiredChecksMutated: false,
    },
    policyDerivedBranchProtectionPlan: {
      branchProtectionPolicyPresent: true,
      targetBranchCount: 1,
      desiredFutureRuleCount: 2,
      branchProtectionChanged: false,
      branchProtectionMutated: false,
    },
    activationSequenceProposal: [
      {
        stepId: 'revalidate-source-digests',
        executionMode: 'future-only-not-executed',
      },
      {
        stepId: 'verify-signed-policy-prerequisites',
        executionMode: 'future-only-not-executed',
      },
      {
        stepId: 'run-future-external-activation',
        executionMode: 'future-only-not-executed',
      },
    ],
    prerequisiteGateSummary: {
      providerDefaultDenyRecorded: true,
      rbacPolicyValidated: true,
      signingReadinessRecorded: true,
      envelopeDigestVerified: true,
      provenanceVerificationReadinessRecorded: true,
      releaseSurfaceValidated: true,
      signedPolicyPresent: false,
      rbacEnforced: false,
      providerGrantPresent: false,
    },
    nonAuthorityBoundary: {
      githubWriteAllowed: false,
      githubMutated: false,
      ciProviderApiCallAllowed: false,
      providerInvoked: false,
      networkCallMade: false,
      apiCallMade: false,
      branchProtectionMutationAllowed: false,
      branchProtectionChanged: false,
      branchProtectionMutated: false,
      requiredChecksMutationAllowed: false,
      requiredChecksConfigured: false,
      requiredChecksMutated: false,
      hooksAllowed: false,
      hooksActivated: false,
      enterpriseGateAllowed: false,
      enterpriseGateActivated: false,
    },
    planFindings: [
      {
        severity: 'satisfied',
        code: 'CI_BRANCH_ACTIVATION_POLICY_VALIDATION_LINKED',
        message: 'Policy validation linked.',
      },
      {
        severity: 'gap',
        code: 'CI_BRANCH_ACTIVATION_SIGNED_POLICY_MISSING',
        message: 'Signed policy is missing.',
      },
    ],
    downstreamActionPlan: [
      'Keep this plan non-authoritative until signed policy and RBAC enforcement exist.',
      'Integrate activation plan into enterprise readiness as a source fact.',
    ],
    githubMutated: false,
    githubWorkflowMutated: false,
    workflowExecuted: false,
    workflowsExecuted: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    hooksActivated: false,
    ciProviderCalled: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    cryptographicSignatureVerified: false,
    cryptographicSigningImplemented: false,
    keyGenerated: false,
    privateKeyStored: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
    packageArtifactGeneratedByDevView: false,
    packageArtifactGenerated: false,
    packageTarballGenerated: false,
    packageSigned: false,
    sbomGeneratedByDevView: false,
    sbomGenerated: false,
    sbomAttested: false,
    provenanceAttestationGenerated: false,
    provenanceAttestationVerified: false,
    provenanceAttested: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    enterpriseGateActivated: false,
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

function runEnterpriseWithReleaseProvenance(workspace: string, releaseProvenanceReadiness: string, output: string) {
  return runDevViewCli(
    [
      'security',
      'report-enterprise-readiness',
      '--release-provenance-readiness',
      releaseProvenanceReadiness,
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function runEnterpriseWithSbomValidation(workspace: string, sbomValidation: string, output: string) {
  return runDevViewCli(
    ['security', 'report-enterprise-readiness', '--sbom-validation', sbomValidation, '--output', output, '--json'],
    { cwd: workspace, pluginRoot },
  )
}

function runEnterpriseWithPackageProvenanceInputs(workspace: string, packageProvenanceInputs: string, output: string) {
  return runDevViewCli(
    [
      'security',
      'report-enterprise-readiness',
      '--package-provenance-inputs',
      packageProvenanceInputs,
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function runEnterpriseWithPackageArtifactDigest(workspace: string, packageArtifactDigest: string, output: string) {
  return runDevViewCli(
    [
      'security',
      'report-enterprise-readiness',
      '--package-artifact-digest',
      packageArtifactDigest,
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function runEnterpriseWithProvenanceAttestationValidation(
  workspace: string,
  provenanceAttestationValidation: string,
  output: string,
) {
  return runDevViewCli(
    [
      'security',
      'report-enterprise-readiness',
      '--provenance-attestation-validation',
      provenanceAttestationValidation,
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function runEnterpriseWithProvenanceVerificationReadiness(
  workspace: string,
  provenanceVerificationReadiness: string,
  output: string,
) {
  return runDevViewCli(
    [
      'security',
      'report-enterprise-readiness',
      '--provenance-verification-readiness',
      provenanceVerificationReadiness,
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function runEnterpriseWithCiBranchGovernanceReadiness(
  workspace: string,
  ciBranchGovernanceReadiness: string,
  output: string,
) {
  return runDevViewCli(
    [
      'security',
      'report-enterprise-readiness',
      '--ci-branch-governance-readiness',
      ciBranchGovernanceReadiness,
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function runEnterpriseWithCiBranchPolicyValidation(
  workspace: string,
  ciBranchPolicyValidation: string,
  output: string,
) {
  return runDevViewCli(
    [
      'security',
      'report-enterprise-readiness',
      '--ci-branch-policy-validation',
      ciBranchPolicyValidation,
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function runEnterpriseWithCiBranchActivationPlan(workspace: string, ciBranchActivationPlan: string, output: string) {
  return runDevViewCli(
    [
      'security',
      'report-enterprise-readiness',
      '--ci-branch-activation-plan',
      ciBranchActivationPlan,
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}
