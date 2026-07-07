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

describe('security report-provider-activation-authorization-readiness CLI', () => {
  it('reports minimal provider activation authorization readiness from default-deny source', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())

    const result = await runProviderActivationReadiness(
      workspace,
      ['--provider-network-policy-report', '.tmp/provider-network-policy-report.json'],
      '.tmp/provider-activation-authorization-readiness.json',
      ['--markdown', '.tmp/provider-activation-authorization-readiness.md'],
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-provider-activation-authorization-readiness-report')
    expect(payload.status).toBe('devview-provider-activation-authorization-readiness-reported')
    expect(payload.readinessScope).toBe('provider-activation-authorization-readiness-report-only')
    expect(payload.authorizationReadinessStatus).toBe('not-ready-provider-grant-signed-policy-rbac-missing')
    expect(payload.sourceProviderNetworkPolicy.defaultProviderPolicy).toBe('deny')
    expect(payload.sourceProviderNetworkPolicy.defaultNetworkPolicy).toBe('deny')
    expect(payload.sourceProviderNetworkPolicy.providerAllowlistCount).toBe(0)
    expect(payload.sourceProviderNetworkPolicy.networkAllowlistCount).toBe(0)
    expect(payload.providerAuthorizationBoundary.providerGrantPresent).toBe(false)
    expect(payload.providerAuthorizationBoundary.providerGrantVerified).toBe(false)
    expect(payload.providerAuthorizationBoundary.providerAllowlistActive).toBe(false)
    expect(payload.providerAuthorizationBoundary.networkAllowlistActive).toBe(false)
    expect(payload.providerAuthorizationBoundary.providerInvoked).toBe(false)
    expect(payload.providerIsolationReadiness.noNetworkDefaultRecorded).toBe(true)
    expect(payload.providerIsolationReadiness.providerCredentialsRead).toBe(false)
    expect(payload.futureProviderGrantRequirements).toHaveLength(8)
    expect(payload.sourceArtifactDigests).toHaveLength(1)
    expect(payload.sourceArtifactDigests[0].sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(existsSync(join(workspace, '.tmp/provider-activation-authorization-readiness.md'))).toBe(true)
    expectSafetyFalse(payload)
  })

  it('summarizes the full report-only prerequisite source chain without authority claims', async () => {
    const workspace = createWorkspace()
    writeAllSafeSources(workspace)

    const result = await runProviderActivationReadiness(
      workspace,
      [
        '--provider-network-policy-report',
        '.tmp/provider-network-policy-report.json',
        '--ci-branch-activation-authority-readiness',
        '.tmp/ci-branch-activation-authority-readiness.json',
        '--ci-branch-activation-plan',
        '.tmp/ci-branch-activation-plan.json',
        '--rbac-policy-validation',
        '.tmp/rbac-policy-validation.json',
        '--signing-readiness',
        '.tmp/signing-readiness.json',
        '--record-envelope-verification',
        '.tmp/record-envelope-verification.json',
        '--provenance-verification-readiness',
        '.tmp/provenance-verification-readiness.json',
        '--enterprise-readiness',
        '.tmp/enterprise-readiness.json',
      ],
      '.tmp/full-provider-activation-authorization-readiness.json',
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.authorizationReadinessStatus).toBe(
      'ready-for-future-provider-grant-policy-review-only-not-activation',
    )
    expect(payload.sourceArtifactDigests).toHaveLength(8)
    expect(payload.sourceCiBranchActivationAuthorityReadiness.authorityReadinessStatus).toBe(
      'ready-for-future-authorization-review-only-not-activation',
    )
    expect(payload.sourceCiBranchActivationPlan.futureOnlyStepCount).toBe(2)
    expect(payload.sourceCiBranchActivationPlan.executedStepCount).toBe(0)
    expect(payload.sourceRbacPolicyValidation.actorCount).toBe(2)
    expect(payload.sourceRbacPolicyValidation.providerNetworkPermissionCount).toBe(0)
    expect(payload.sourceSigningReadiness.keyRegistryPresent).toBe(false)
    expect(payload.sourceRecordEnvelopeVerification.payloadDigestMatches).toBe(true)
    expect(payload.sourceProvenanceVerificationReadiness.realSlsaVerificationPerformed).toBe(false)
    expect(payload.sourceEnterpriseReadiness.readinessLevel).toBe('not-ready')
    expect(payload.providerAuthorizationBoundary.providerGrantPresent).toBe(false)
    expect(payload.actorAuthorizationPrerequisites.rbacEnforced).toBe(false)
    expect(payload.signedPolicyPrerequisites.signedPolicyPresent).toBe(false)
    expectSafetyFalse(payload)
  })

  it('blocks provider default allow, allowlists, and grant claims with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/default-allow-provider.json'), {
      ...providerNetworkPolicyReport(),
      defaultProviderPolicy: 'allow',
    })
    writeJson(join(workspace, '.tmp/allowlist-provider.json'), {
      ...providerNetworkPolicyReport(),
      providerAllowlist: ['github'],
    })
    writeJson(join(workspace, '.tmp/provider-grant.json'), {
      ...providerNetworkPolicyReport(),
      providerGrants: [{ provider: 'github' }],
    })

    const defaultAllow = await runProviderActivationReadiness(
      workspace,
      ['--provider-network-policy-report', '.tmp/default-allow-provider.json'],
      '.tmp/default-allow-output.json',
    )
    const allowlist = await runProviderActivationReadiness(
      workspace,
      ['--provider-network-policy-report', '.tmp/allowlist-provider.json'],
      '.tmp/allowlist-output.json',
    )
    const grant = await runProviderActivationReadiness(
      workspace,
      ['--provider-network-policy-report', '.tmp/provider-grant.json'],
      '.tmp/grant-output.json',
    )

    expect(defaultAllow.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(defaultAllow.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PROVIDER_ACTIVATION_AUTHORIZATION_PROVIDER_NETWORK_SOURCE_NOT_DENY',
    )
    expect(existsSync(join(workspace, '.tmp/default-allow-output.json'))).toBe(false)

    for (const [result, output] of [
      [allowlist, '.tmp/allowlist-output.json'],
      [grant, '.tmp/grant-output.json'],
    ] as const) {
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
        'PROVIDER_ACTIVATION_AUTHORIZATION_ALLOWLIST_UNSUPPORTED',
      )
      expect(existsSync(join(workspace, output))).toBe(false)
    }
  })

  it('blocks optional sources that claim provider, signing, RBAC, CI, graph, or enterprise authority', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())
    writeJson(join(workspace, '.tmp/ci-authority-provider-grant.json'), {
      ...ciBranchActivationAuthorityReadinessReport(),
      providerAuthorizationBoundary: {
        providerGrantPresent: true,
      },
    })
    writeJson(join(workspace, '.tmp/signing-crypto.json'), {
      ...signingReadinessReport(),
      cryptographicSignatureVerified: true,
    })
    writeJson(join(workspace, '.tmp/provider-call.json'), {
      ...enterpriseReadinessReport(),
      providerInvoked: true,
    })
    writeJson(join(workspace, '.tmp/branch-mutation.json'), {
      ...ciBranchActivationPlanReport(),
      branchProtectionMutated: true,
    })

    const ciAuthority = await runProviderActivationReadiness(
      workspace,
      [
        '--provider-network-policy-report',
        '.tmp/provider-network-policy-report.json',
        '--ci-branch-activation-authority-readiness',
        '.tmp/ci-authority-provider-grant.json',
      ],
      '.tmp/ci-authority-output.json',
    )
    const signing = await runProviderActivationReadiness(
      workspace,
      [
        '--provider-network-policy-report',
        '.tmp/provider-network-policy-report.json',
        '--signing-readiness',
        '.tmp/signing-crypto.json',
      ],
      '.tmp/signing-output.json',
    )
    const providerCall = await runProviderActivationReadiness(
      workspace,
      [
        '--provider-network-policy-report',
        '.tmp/provider-network-policy-report.json',
        '--enterprise-readiness',
        '.tmp/provider-call.json',
      ],
      '.tmp/provider-call-output.json',
    )
    const branchMutation = await runProviderActivationReadiness(
      workspace,
      [
        '--provider-network-policy-report',
        '.tmp/provider-network-policy-report.json',
        '--ci-branch-activation-plan',
        '.tmp/branch-mutation.json',
      ],
      '.tmp/branch-mutation-output.json',
    )

    for (const [result, output] of [
      [ciAuthority, '.tmp/ci-authority-output.json'],
      [signing, '.tmp/signing-output.json'],
      [providerCall, '.tmp/provider-call-output.json'],
      [branchMutation, '.tmp/branch-mutation-output.json'],
    ] as const) {
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
        'PROVIDER_ACTIVATION_AUTHORIZATION_UNSAFE_SOURCE_AUTHORITY_FLAG',
      )
      expect(existsSync(join(workspace, output))).toBe(false)
    }
  })

  it('blocks wrong source roles or statuses with zero writes for every source kind', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())
    const cases: Array<[string, string, Record<string, unknown>, string, string]> = [
      [
        'provider',
        '--provider-network-policy-report',
        { ...providerNetworkPolicyReport(), status: 'wrong' },
        'PROVIDER_ACTIVATION_AUTHORIZATION_PROVIDER_NETWORK_POLICY_REPORT_ROLE_STATUS_INVALID',
        '.tmp/wrong-provider.json',
      ],
      [
        'ci-authority',
        '--ci-branch-activation-authority-readiness',
        { ...ciBranchActivationAuthorityReadinessReport(), status: 'wrong' },
        'PROVIDER_ACTIVATION_AUTHORIZATION_CI_BRANCH_ACTIVATION_AUTHORITY_READINESS_ROLE_STATUS_INVALID',
        '.tmp/wrong-ci-authority.json',
      ],
      [
        'ci-plan',
        '--ci-branch-activation-plan',
        { ...ciBranchActivationPlanReport(), status: 'wrong' },
        'PROVIDER_ACTIVATION_AUTHORIZATION_CI_BRANCH_ACTIVATION_PLAN_ROLE_STATUS_INVALID',
        '.tmp/wrong-ci-plan.json',
      ],
      [
        'rbac',
        '--rbac-policy-validation',
        { ...rbacPolicyValidationReport(), status: 'wrong' },
        'PROVIDER_ACTIVATION_AUTHORIZATION_RBAC_POLICY_VALIDATION_ROLE_STATUS_INVALID',
        '.tmp/wrong-rbac.json',
      ],
      [
        'signing',
        '--signing-readiness',
        { ...signingReadinessReport(), status: 'wrong' },
        'PROVIDER_ACTIVATION_AUTHORIZATION_SIGNING_READINESS_ROLE_STATUS_INVALID',
        '.tmp/wrong-signing.json',
      ],
      [
        'envelope',
        '--record-envelope-verification',
        { ...recordEnvelopeVerificationReport(), status: 'wrong' },
        'PROVIDER_ACTIVATION_AUTHORIZATION_RECORD_ENVELOPE_VERIFICATION_ROLE_STATUS_INVALID',
        '.tmp/wrong-envelope.json',
      ],
      [
        'provenance',
        '--provenance-verification-readiness',
        { ...provenanceVerificationReadinessReport(), status: 'wrong' },
        'PROVIDER_ACTIVATION_AUTHORIZATION_PROVENANCE_VERIFICATION_READINESS_ROLE_STATUS_INVALID',
        '.tmp/wrong-provenance.json',
      ],
      [
        'enterprise',
        '--enterprise-readiness',
        { ...enterpriseReadinessReport(), status: 'wrong' },
        'PROVIDER_ACTIVATION_AUTHORIZATION_ENTERPRISE_READINESS_ROLE_STATUS_INVALID',
        '.tmp/wrong-enterprise.json',
      ],
    ]

    for (const [label, flag, record, expectedCode, sourcePath] of cases) {
      writeJson(join(workspace, sourcePath), record)
      const args =
        flag === '--provider-network-policy-report'
          ? [flag, sourcePath]
          : ['--provider-network-policy-report', '.tmp/provider-network-policy-report.json', flag, sourcePath]
      const output = `.tmp/${label}-output.json`
      const result = await runProviderActivationReadiness(workspace, args, output)

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(expectedCode)
      expect(existsSync(join(workspace, output))).toBe(false)
    }
  })

  it('blocks output collisions, source overwrite, and protected output paths', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())
    const cases = [
      {
        output: '.tmp/provider-network-policy-report.json',
        expected: 'would overwrite a source input',
      },
      {
        output: '.tmp/provider-activation.json',
        markdown: '.tmp/provider-activation.json',
        expected: 'must be different',
      },
      {
        output: join('.devview', 'generated', 'provider-activation.json'),
        expected: 'inside a protected control path',
      },
      {
        output: join('.tmp', 'source-authority', 'provider-activation.json'),
        expected: 'source-authority-shaped path',
      },
    ]

    for (const entry of cases) {
      const args = ['--provider-network-policy-report', '.tmp/provider-network-policy-report.json']
      const result = await runProviderActivationReadiness(
        workspace,
        args,
        entry.output,
        entry.markdown ? ['--markdown', entry.markdown] : [],
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues[0].message).toContain(entry.expected)
      if (entry.output === '.tmp/provider-network-policy-report.json') {
        expect(JSON.parse(readFileSync(join(workspace, entry.output), 'utf8')).artifactRole).toBe(
          'devview-provider-network-default-deny-policy-report',
        )
      } else {
        expect(existsSync(join(workspace, entry.output))).toBe(false)
      }
    }
  })
})

function runProviderActivationReadiness(workspace: string, args: string[], output: string, extraArgs: string[] = []) {
  return runDevViewCli(
    [
      'security',
      'report-provider-activation-authorization-readiness',
      ...args,
      '--output',
      output,
      ...extraArgs,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function writeAllSafeSources(workspace: string): void {
  writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())
  writeJson(
    join(workspace, '.tmp/ci-branch-activation-authority-readiness.json'),
    ciBranchActivationAuthorityReadinessReport(),
  )
  writeJson(join(workspace, '.tmp/ci-branch-activation-plan.json'), ciBranchActivationPlanReport())
  writeJson(join(workspace, '.tmp/rbac-policy-validation.json'), rbacPolicyValidationReport())
  writeJson(join(workspace, '.tmp/signing-readiness.json'), signingReadinessReport())
  writeJson(join(workspace, '.tmp/record-envelope-verification.json'), recordEnvelopeVerificationReport())
  writeJson(join(workspace, '.tmp/provenance-verification-readiness.json'), provenanceVerificationReadinessReport())
  writeJson(join(workspace, '.tmp/enterprise-readiness.json'), enterpriseReadinessReport())
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
    futureAllowPolicyRequirements: ['signed policy', 'actor identity/RBAC'],
    blockedCapabilities: ['provider execution', 'network access'],
    providerNetworkReadiness: {
      status: 'default-deny-recorded',
      allowRequestsSupported: false,
      policyInputMode: 'canonical-default',
      enterpriseReadinessLinked: false,
    },
    ...safetyFlags(),
    ...overrides,
  }
}

function ciBranchActivationAuthorityReadinessReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-ci-branch-activation-authority-readiness-report',
    status: 'devview-ci-branch-activation-authority-readiness-reported',
    readinessScope: 'ci-branch-activation-authority-readiness-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    authorityReadinessStatus: 'ready-for-future-authorization-review-only-not-activation',
    authorityPrerequisiteSummary: {
      activationPlanRecorded: true,
      activationPlanFutureOnly: true,
      ciBranchPolicyValidated: true,
      workflowInventoryLinked: true,
      providerDefaultDenyRecorded: true,
      rbacPolicyValidated: true,
      signingReadinessRecorded: true,
      recordEnvelopeDigestVerified: true,
      provenanceVerificationReadinessRecorded: true,
      signedPolicyPresent: false,
      signedPolicyVerified: false,
      providerGrantPresent: false,
      rbacEnforced: false,
      permissionVerified: false,
    },
    providerAuthorizationBoundary: {
      providerGrantPresent: false,
      providerInvoked: false,
      networkCallMade: false,
      apiCallMade: false,
    },
    actorAuthorizationBoundary: {
      rbacEnforced: false,
      permissionVerified: false,
    },
    signedPolicyBoundary: {
      signedPolicyArtifactPresent: false,
      signedPolicyVerified: false,
      cryptographicSignatureVerified: false,
    },
    activationBoundary: {
      requiredChecksConfigured: false,
      requiredChecksMutated: false,
      branchProtectionChanged: false,
      branchProtectionMutated: false,
      externalCiMutated: false,
      hooksActivated: false,
      enterpriseGateActivated: false,
    },
    ...safetyFlags(),
    signedPolicyPresent: false,
    signedPolicyVerified: false,
    providerGrantPresent: false,
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
    activationSequenceProposal: [
      { stepId: 'revalidate-source-digests', executionMode: 'future-only-not-executed' },
      { stepId: 'prepare-provider-request', executionMode: 'future-only-not-executed' },
    ],
    prerequisiteGateSummary: {
      providerDefaultDenyRecorded: true,
      signedPolicyPresent: false,
      rbacEnforced: false,
      providerGrantPresent: false,
    },
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
    rbacPolicyValidationStatus: 'passed-report-only-policy-not-enforced',
    actorSummary: { actorCount: 2 },
    roleAssignmentSummary: { assignmentCount: 2 },
    permissionGrantSummary: { grantCount: 2, providerNetworkPermissionCount: 0 },
    ...safetyFlags(),
    rbacEnforced: false,
    permissionVerified: false,
    ...overrides,
  }
}

function signingReadinessReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-signing-readiness-report',
    status: 'devview-signing-readiness-reported',
    readinessScope: 'signing-key-governance-readiness-report-only',
    signingReadinessStatus: 'not-ready-policy-and-key-governance-missing',
    keyGovernanceReadiness: {
      keyRegistryPresent: false,
      trustRootPresent: false,
      privateKeyStoragePresent: false,
    },
    signaturePolicyReadiness: {
      detachedSignaturePolicyPresent: false,
    },
    ...safetyFlags(),
    cryptographicSignaturePresent: false,
    cryptographicSignatureVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
    rbacEnforced: false,
    permissionVerified: false,
    ...overrides,
  }
}

function recordEnvelopeVerificationReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-record-envelope-verification-report',
    status: 'devview-record-envelope-verified',
    verificationScope: 'record-envelope-verification-report-only',
    signatureVerificationMode: 'not-performed-unsigned-preview-only',
    payloadVerification: { digestMatches: true },
    sourceArtifactVerification: { allSourceDigestsMatch: true },
    previousEnvelopeVerification: { chainLinkVerified: false },
    ...safetyFlags(),
    cryptographicSignatureVerified: false,
    rbacEnforced: false,
    permissionVerified: false,
    ...overrides,
  }
}

function provenanceVerificationReadinessReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-provenance-verification-readiness-report',
    status: 'devview-provenance-verification-readiness-reported',
    readinessScope: 'provenance-verification-readiness-report-only',
    provenanceVerificationReadinessStatus: 'not-ready-key-trust-and-signature-policy-missing',
    verificationBoundary: {
      realSlsaVerificationPerformed: false,
      realInTotoVerificationPerformed: false,
      cryptographicSignatureVerified: false,
    },
    ...safetyFlags(),
    realSlsaVerificationPerformed: false,
    realInTotoVerificationPerformed: false,
    cryptographicSignatureVerified: false,
    ...overrides,
  }
}

function enterpriseReadinessReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-enterprise-readiness-report',
    status: 'devview-enterprise-readiness-report-generated',
    readinessScope: 'enterprise-hardening-readiness-report-only',
    readinessLevel: 'not-ready',
    providerNetworkPolicyReadiness: { status: 'default-deny-recorded' },
    scopeCiGovernanceReadiness: { status: 'readiness-recorded' },
    ...safetyFlags(),
    enterpriseGateActivated: false,
    ...overrides,
  }
}

function safetyFlags(): Record<string, unknown> {
  return {
    sourceFactsOnly: true,
    reportOnly: true,
    enterpriseGateActivated: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    providerAllowlistActive: false,
    networkAllowlistActive: false,
    providerGrantPresent: false,
    providerGrantVerified: false,
    providerCredentialsRead: false,
    providerCredentialsStored: false,
    githubMutated: false,
    githubWorkflowMutated: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    hooksActivated: false,
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
    cryptographicSignaturePresent: false,
    cryptographicSignatureVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    packagePublished: false,
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
  }
}

function expectSafetyFalse(payload: Record<string, unknown>): void {
  expect(payload.enterpriseGateActivated).toBe(false)
  expect(payload.providerInvoked).toBe(false)
  expect(payload.networkCallMade).toBe(false)
  expect(payload.apiCallMade).toBe(false)
  expect(payload.providerAllowlistActive).toBe(false)
  expect(payload.networkAllowlistActive).toBe(false)
  expect(payload.providerGrantPresent).toBe(false)
  expect(payload.providerGrantVerified).toBe(false)
  expect(payload.providerCredentialsRead).toBe(false)
  expect(payload.providerCredentialsStored).toBe(false)
  expect(payload.githubMutated).toBe(false)
  expect(payload.githubWorkflowMutated).toBe(false)
  expect(payload.branchProtectionChanged).toBe(false)
  expect(payload.branchProtectionMutated).toBe(false)
  expect(payload.requiredChecksConfigured).toBe(false)
  expect(payload.requiredChecksMutated).toBe(false)
  expect(payload.externalCiMutated).toBe(false)
  expect(payload.hooksActivated).toBe(false)
  expect(payload.rbacEnforced).toBe(false)
  expect(payload.permissionVerified).toBe(false)
  expect(payload.rbacPermissionVerified).toBe(false)
  expect(payload.cryptographicSignaturePresent).toBe(false)
  expect(payload.cryptographicSignatureVerified).toBe(false)
  expect(payload.keyGenerated).toBe(false)
  expect(payload.privateKeyStored).toBe(false)
  expect(payload.keyRegistryCreated).toBe(false)
  expect(payload.trustRootCreated).toBe(false)
  expect(payload.packagePublished).toBe(false)
  expect(payload.packageArtifactGeneratedByDevView).toBe(false)
  expect(payload.packageArtifactGenerated).toBe(false)
  expect(payload.packageTarballGenerated).toBe(false)
  expect(payload.packageSigned).toBe(false)
  expect(payload.sbomGeneratedByDevView).toBe(false)
  expect(payload.sbomGenerated).toBe(false)
  expect(payload.sbomAttested).toBe(false)
  expect(payload.provenanceAttestationGenerated).toBe(false)
  expect(payload.provenanceAttestationVerified).toBe(false)
  expect(payload.provenanceAttested).toBe(false)
  expect(payload.graphSourceMutated).toBe(false)
  expect(payload.graphDeltaApplied).toBe(false)
  expect(payload.runtimeEvidenceSatisfied).toBe(false)
  expect(payload.evidenceAccepted).toBe(false)
  expect(payload.equivalenceProven).toBe(false)
  expect(payload.scopeEnforced).toBe(false)
  expect(payload.ciEnforcementEnabled).toBe(false)
  expect(payload.approvalAutomationEnabled).toBe(false)
  expect(payload.userAcceptanceAutomated).toBe(false)
}
