import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('security report-ci-branch-activation-authority-readiness CLI', () => {
  it('reports minimal activation authority readiness without authority claims', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/ci-branch-activation-plan.json'), ciBranchActivationPlanReport())

    const result = await runAuthorityReadiness(
      workspace,
      ['--ci-branch-activation-plan', '.tmp/ci-branch-activation-plan.json'],
      '.tmp/ci-branch-activation-authority-readiness.json',
      ['--markdown', '.tmp/ci-branch-activation-authority-readiness.md'],
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-ci-branch-activation-authority-readiness-report')
    expect(payload.status).toBe('devview-ci-branch-activation-authority-readiness-reported')
    expect(payload.readinessScope).toBe('ci-branch-activation-authority-readiness-report-only')
    expect(payload.authorityReadinessStatus).toBe('not-ready-signed-policy-rbac-provider-grant-missing')
    expect(payload.sourceCiBranchActivationPlan.status).toBe('devview-ci-branch-activation-plan-recorded')
    expect(payload.sourceCiBranchActivationPlan.futureOnlyStepCount).toBe(3)
    expect(payload.sourceCiBranchActivationPlan.executedStepCount).toBe(0)
    expect(payload.authorityPrerequisiteSummary).toEqual(
      expect.objectContaining({
        activationPlanRecorded: true,
        activationPlanFutureOnly: true,
        ciBranchPolicyValidated: false,
        providerDefaultDenyRecorded: false,
        signedPolicyPresent: false,
        signedPolicyVerified: false,
        providerGrantPresent: false,
        rbacEnforced: false,
        permissionVerified: false,
      }),
    )
    expect(payload.signedPolicyBoundary.signedPolicyArtifactPresent).toBe(false)
    expect(payload.actorAuthorizationBoundary.rbacEnforced).toBe(false)
    expect(payload.providerAuthorizationBoundary.providerInvoked).toBe(false)
    expect(payload.activationBoundary.requiredChecksConfigured).toBe(false)
    expect(payload.sourceArtifactDigests).toHaveLength(1)
    expect(payload.sourceArtifactDigests[0].sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(existsSync(join(workspace, '.tmp/ci-branch-activation-authority-readiness.md'))).toBe(true)
    expectSafetyFalse(payload)
  })

  it('summarizes the full report-only prerequisite source chain without becoming authoritative', async () => {
    const workspace = createWorkspace()
    writeAllSafeSources(workspace)

    const result = await runAuthorityReadiness(
      workspace,
      [
        '--ci-branch-activation-plan',
        '.tmp/ci-branch-activation-plan.json',
        '--ci-branch-policy-validation',
        '.tmp/ci-branch-policy-validation.json',
        '--ci-branch-governance-readiness',
        '.tmp/ci-branch-governance-readiness.json',
        '--provider-network-policy-report',
        '.tmp/provider-network-policy.json',
        '--rbac-policy-validation',
        '.tmp/rbac-policy-validation.json',
        '--signing-readiness',
        '.tmp/signing-readiness.json',
        '--record-envelope-verification',
        '.tmp/record-envelope-verification.json',
        '--provenance-verification-readiness',
        '.tmp/provenance-verification-readiness.json',
      ],
      '.tmp/full-authority-readiness.json',
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.authorityReadinessStatus).toBe('ready-for-future-authorization-review-only-not-activation')
    expect(payload.sourceArtifactDigests).toHaveLength(8)
    expect(payload.sourceCiBranchPolicyValidation.status).toBe('devview-ci-branch-policy-validation-passed')
    expect(payload.sourceCiBranchGovernanceReadiness.workflowInventoryFileCount).toBe(1)
    expect(payload.sourceProviderNetworkPolicy.defaultProviderPolicy).toBe('deny')
    expect(payload.sourceRbacPolicyValidation.actorCount).toBe(2)
    expect(payload.sourceSigningReadiness.keyRegistryPresent).toBe(false)
    expect(payload.sourceRecordEnvelopeVerification.payloadDigestMatches).toBe(true)
    expect(payload.sourceProvenanceVerificationReadiness.realSlsaVerificationPerformed).toBe(false)
    expect(payload.authorityPrerequisiteSummary).toEqual(
      expect.objectContaining({
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
      }),
    )
    expectSafetyFalse(payload)
  })

  it('blocks executed activation steps and authority claims with zero writes', async () => {
    const workspace = createWorkspace()
    const cases: Array<[string, Record<string, unknown>, string]> = [
      [
        'executed-step',
        {
          activationSequenceProposal: [
            { stepId: 'bad', executionMode: 'executed', requiredBeforeActualActivation: true },
          ],
        },
        'CI_BRANCH_AUTHORITY_ACTIVATION_STEP_EXECUTED_UNSUPPORTED',
      ],
      [
        'signed-policy',
        { prerequisiteGateSummary: { signedPolicyPresent: true } },
        'CI_BRANCH_AUTHORITY_UNSAFE_SOURCE_AUTHORITY_FLAG',
      ],
      [
        'provider-grant',
        { prerequisiteGateSummary: { providerGrantPresent: true } },
        'CI_BRANCH_AUTHORITY_UNSAFE_SOURCE_AUTHORITY_FLAG',
      ],
      ['rbac', { prerequisiteGateSummary: { rbacEnforced: true } }, 'CI_BRANCH_AUTHORITY_UNSAFE_SOURCE_AUTHORITY_FLAG'],
      [
        'required-checks',
        { policyDerivedRequiredChecksPlan: { requiredChecksConfigured: true } },
        'CI_BRANCH_AUTHORITY_UNSAFE_SOURCE_AUTHORITY_FLAG',
      ],
      [
        'branch',
        { policyDerivedBranchProtectionPlan: { branchProtectionMutated: true } },
        'CI_BRANCH_AUTHORITY_UNSAFE_SOURCE_AUTHORITY_FLAG',
      ],
      ['provider', { providerInvoked: true }, 'CI_BRANCH_AUTHORITY_UNSAFE_SOURCE_AUTHORITY_FLAG'],
      ['hook', { hooksActivated: true }, 'CI_BRANCH_AUTHORITY_UNSAFE_SOURCE_AUTHORITY_FLAG'],
      ['gate', { enterpriseGateActivated: true }, 'CI_BRANCH_AUTHORITY_UNSAFE_SOURCE_AUTHORITY_FLAG'],
    ]

    for (const [name, override, expectedCode] of cases) {
      writeJson(join(workspace, `.tmp/${name}-activation-plan.json`), ciBranchActivationPlanReport(override))
      const output = `.tmp/${name}-authority-readiness.json`
      const result = await runAuthorityReadiness(
        workspace,
        ['--ci-branch-activation-plan', `.tmp/${name}-activation-plan.json`],
        output,
      )
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(expectedCode)
      expect(existsSync(join(workspace, output))).toBe(false)
    }
  })

  it('blocks provider default allow, allowlists, and signing/key/RBAC true source claims with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/ci-branch-activation-plan.json'), ciBranchActivationPlanReport())
    writeJson(join(workspace, '.tmp/default-allow-provider.json'), {
      ...providerNetworkPolicyReport(),
      defaultProviderPolicy: 'allow',
    })
    writeJson(join(workspace, '.tmp/allowlist-provider.json'), {
      ...providerNetworkPolicyReport(),
      providerAllowlist: ['github'],
    })
    writeJson(join(workspace, '.tmp/signed-source.json'), {
      ...signingReadinessReport(),
      cryptographicSignatureVerified: true,
    })
    writeJson(join(workspace, '.tmp/key-source.json'), {
      ...signingReadinessReport(),
      keyGenerated: true,
    })
    writeJson(join(workspace, '.tmp/rbac-source.json'), {
      ...rbacPolicyValidationReport(),
      rbacEnforced: true,
    })

    const cases = [
      [
        ['--provider-network-policy-report', '.tmp/default-allow-provider.json'],
        '.tmp/default-allow-authority.json',
        'CI_BRANCH_AUTHORITY_PROVIDER_NETWORK_SOURCE_NOT_DENY',
      ],
      [
        ['--provider-network-policy-report', '.tmp/allowlist-provider.json'],
        '.tmp/allowlist-authority.json',
        'CI_BRANCH_AUTHORITY_PROVIDER_NETWORK_ALLOWLIST_UNSUPPORTED',
      ],
      [
        ['--signing-readiness', '.tmp/signed-source.json'],
        '.tmp/signed-source-authority.json',
        'CI_BRANCH_AUTHORITY_UNSAFE_SOURCE_AUTHORITY_FLAG',
      ],
      [
        ['--signing-readiness', '.tmp/key-source.json'],
        '.tmp/key-source-authority.json',
        'CI_BRANCH_AUTHORITY_UNSAFE_SOURCE_AUTHORITY_FLAG',
      ],
      [
        ['--rbac-policy-validation', '.tmp/rbac-source.json'],
        '.tmp/rbac-source-authority.json',
        'CI_BRANCH_AUTHORITY_UNSAFE_SOURCE_AUTHORITY_FLAG',
      ],
    ] as const

    for (const [extraArgs, output, expectedCode] of cases) {
      const result = await runAuthorityReadiness(
        workspace,
        ['--ci-branch-activation-plan', '.tmp/ci-branch-activation-plan.json', ...extraArgs],
        output,
      )
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(expectedCode)
      expect(existsSync(join(workspace, output))).toBe(false)
    }
  })

  it('blocks wrong role/status for every source kind with zero writes', async () => {
    const workspace = createWorkspace()
    writeAllSafeSources(workspace)
    const sourceCases: Array<[string, string, Record<string, unknown>, string[]]> = [
      ['activation-plan', '.tmp/wrong-activation-plan.json', ciBranchActivationPlanReport({ status: 'wrong' }), []],
      [
        'policy-validation',
        '.tmp/wrong-policy-validation.json',
        ciBranchPolicyValidationReport({ status: 'wrong' }),
        ['--ci-branch-activation-plan', '.tmp/ci-branch-activation-plan.json', '--ci-branch-policy-validation'],
      ],
      [
        'governance-readiness',
        '.tmp/wrong-governance-readiness.json',
        ciBranchGovernanceReadinessReport({ status: 'wrong' }),
        ['--ci-branch-activation-plan', '.tmp/ci-branch-activation-plan.json', '--ci-branch-governance-readiness'],
      ],
      [
        'provider-network',
        '.tmp/wrong-provider-network.json',
        providerNetworkPolicyReport({ status: 'wrong' }),
        ['--ci-branch-activation-plan', '.tmp/ci-branch-activation-plan.json', '--provider-network-policy-report'],
      ],
      [
        'rbac-policy',
        '.tmp/wrong-rbac-policy.json',
        rbacPolicyValidationReport({ status: 'wrong' }),
        ['--ci-branch-activation-plan', '.tmp/ci-branch-activation-plan.json', '--rbac-policy-validation'],
      ],
      [
        'signing',
        '.tmp/wrong-signing.json',
        signingReadinessReport({ status: 'wrong' }),
        ['--ci-branch-activation-plan', '.tmp/ci-branch-activation-plan.json', '--signing-readiness'],
      ],
      [
        'envelope',
        '.tmp/wrong-envelope.json',
        recordEnvelopeVerificationReport({ status: 'wrong' }),
        ['--ci-branch-activation-plan', '.tmp/ci-branch-activation-plan.json', '--record-envelope-verification'],
      ],
      [
        'provenance',
        '.tmp/wrong-provenance.json',
        provenanceVerificationReadinessReport({ status: 'wrong' }),
        ['--ci-branch-activation-plan', '.tmp/ci-branch-activation-plan.json', '--provenance-verification-readiness'],
      ],
    ]

    for (const [name, pathValue, record, args] of sourceCases) {
      writeJson(join(workspace, pathValue), record)
      const finalArgs = args.length > 0 ? [...args, pathValue] : ['--ci-branch-activation-plan', pathValue]
      const output = `.tmp/${name}-authority-readiness.json`
      const result = await runAuthorityReadiness(workspace, finalArgs, output)
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toEqual(
        expect.arrayContaining([expect.stringMatching(/ROLE_STATUS_INVALID/)]),
      )
      expect(existsSync(join(workspace, output))).toBe(false)
    }
  })

  it('blocks output collisions, source overwrite, protected paths, and source-authority-shaped outputs', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/ci-branch-activation-plan.json'), ciBranchActivationPlanReport())
    const cases = [
      {
        output: '.tmp/collision.json',
        extra: ['--markdown', '.tmp/collision.json'],
      },
      {
        output: '.tmp/ci-branch-activation-plan.json',
        extra: [],
      },
      {
        output: join('.devview', 'generated', 'ci-branch-activation-authority-readiness.json'),
        extra: [],
      },
      {
        output: 'ci-branch-policy-validation.json',
        extra: [],
      },
    ]

    for (const entry of cases) {
      const result = await runAuthorityReadiness(
        workspace,
        ['--ci-branch-activation-plan', '.tmp/ci-branch-activation-plan.json'],
        entry.output,
        entry.extra,
      )
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    }
  })
})

function runAuthorityReadiness(workspace: string, args: string[], output: string, extraArgs: string[] = []) {
  return runDevViewCli(
    [
      'security',
      'report-ci-branch-activation-authority-readiness',
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
  writeJson(join(workspace, '.tmp/ci-branch-activation-plan.json'), ciBranchActivationPlanReport())
  writeJson(join(workspace, '.tmp/ci-branch-policy-validation.json'), ciBranchPolicyValidationReport())
  writeJson(join(workspace, '.tmp/ci-branch-governance-readiness.json'), ciBranchGovernanceReadinessReport())
  writeJson(join(workspace, '.tmp/provider-network-policy.json'), providerNetworkPolicyReport())
  writeJson(join(workspace, '.tmp/rbac-policy-validation.json'), rbacPolicyValidationReport())
  writeJson(join(workspace, '.tmp/signing-readiness.json'), signingReadinessReport())
  writeJson(join(workspace, '.tmp/record-envelope-verification.json'), recordEnvelopeVerificationReport())
  writeJson(join(workspace, '.tmp/provenance-verification-readiness.json'), provenanceVerificationReadinessReport())
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
      { stepId: 'revalidate-source-digests', order: 1, executionMode: 'future-only-not-executed' },
      { stepId: 'verify-signed-policy-prerequisites', order: 2, executionMode: 'future-only-not-executed' },
      { stepId: 'obtain-provider-network-governance', order: 3, executionMode: 'future-only-not-executed' },
    ],
    prerequisiteGateSummary: {
      providerDefaultDenyRecorded: false,
      rbacPolicyValidated: false,
      signingReadinessRecorded: false,
      envelopeDigestVerified: false,
      provenanceVerificationReadinessRecorded: false,
      signedPolicyPresent: false,
      rbacEnforced: false,
      providerGrantPresent: false,
    },
    planFindings: [],
    downstreamActionPlan: [],
    ...safetyFlags(),
    ...overrides,
  }
}

function ciBranchPolicyValidationReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-ci-branch-policy-validation-report',
    status: 'devview-ci-branch-policy-validation-passed',
    validationScope: 'ci-branch-policy-validation-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    ciBranchPolicyValidationStatus: 'passed-report-only-policy-not-enforced',
    requiredChecksPolicyValidation: {
      declaredCheckCount: 2,
      workflowCandidateMatchCount: 2,
      unmappedDeclaredChecks: [],
      requiredChecksConfigured: false,
      requiredChecksMutated: false,
    },
    branchProtectionPolicyValidation: {
      branchProtectionPolicyPresent: true,
      targetBranchCount: 1,
      desiredFutureRuleCount: 2,
      branchProtectionChanged: false,
      branchProtectionMutated: false,
    },
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
    workflowInventory: { sourceCount: 1, candidateRequiredChecks: ['validate', 'Quality Gate'] },
    ...safetyFlags(),
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
    explicitAllowSupported: false,
    providerAllowlist: [],
    networkAllowlist: [],
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
    rbacPolicyValidationStatus: 'passed-report-only-policy-not-enforced',
    actorSummary: { actorCount: 2 },
    roleAssignmentSummary: { assignmentCount: 2 },
    permissionGrantSummary: { grantCount: 2 },
    rbacEnforced: false,
    permissionVerified: false,
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
    keyGovernanceReadiness: {
      keyRegistryPresent: false,
      trustRootPresent: false,
      privateKeyStoragePresent: false,
    },
    cryptographicSignatureVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
    rbacEnforced: false,
    permissionVerified: false,
    ...safetyFlags(),
    ...overrides,
  }
}

function recordEnvelopeVerificationReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-record-envelope-verification-report',
    status: 'devview-record-envelope-verified',
    verificationScope: 'record-envelope-verification-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    payloadVerification: { digestMatches: true },
    sourceArtifactVerification: { allSourceDigestsMatch: true },
    previousEnvelopeVerification: { chainLinkVerified: false },
    signatureVerificationMode: 'not-performed-unsigned-preview-only',
    cryptographicSignatureVerified: false,
    rbacEnforced: false,
    permissionVerified: false,
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
    verificationBoundary: {
      realSlsaVerificationPerformed: false,
      realInTotoVerificationPerformed: false,
      cryptographicSignatureVerified: false,
    },
    realSlsaVerificationPerformed: false,
    realInTotoVerificationPerformed: false,
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
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    cryptographicSignatureVerified: false,
    cryptographicSigningImplemented: false,
    keyGenerated: false,
    privateKeyStored: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
    signedPolicyPresent: false,
    signedPolicyVerified: false,
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
    providerGrantPresent: false,
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
  }
}

function expectSafetyFalse(payload: Record<string, unknown>): void {
  expect(payload.sourceFactsOnly).toBe(true)
  expect(payload.reportOnly).toBe(true)
  expect(payload.githubMutated).toBe(false)
  expect(payload.githubWorkflowMutated).toBe(false)
  expect(payload.workflowExecuted).toBe(false)
  expect(payload.workflowsExecuted).toBe(false)
  expect(payload.branchProtectionChanged).toBe(false)
  expect(payload.branchProtectionMutated).toBe(false)
  expect(payload.requiredChecksConfigured).toBe(false)
  expect(payload.requiredChecksMutated).toBe(false)
  expect(payload.externalCiMutated).toBe(false)
  expect(payload.hooksActivated).toBe(false)
  expect(payload.ciProviderCalled).toBe(false)
  expect(payload.providerInvoked).toBe(false)
  expect(payload.networkCallMade).toBe(false)
  expect(payload.apiCallMade).toBe(false)
  expect(payload.shellCommandsExecuted).toBe(false)
  expect(payload.extensionExecutionAllowed).toBe(false)
  expect(payload.extensionsExecuted).toBe(false)
  expect(payload.cryptographicSignatureVerified).toBe(false)
  expect(payload.cryptographicSigningImplemented).toBe(false)
  expect(payload.keyGenerated).toBe(false)
  expect(payload.privateKeyStored).toBe(false)
  expect(payload.keyRegistryCreated).toBe(false)
  expect(payload.trustRootCreated).toBe(false)
  expect(payload.signedPolicyPresent).toBe(false)
  expect(payload.signedPolicyVerified).toBe(false)
  expect(payload.rbacEnforced).toBe(false)
  expect(payload.permissionVerified).toBe(false)
  expect(payload.rbacPermissionVerified).toBe(false)
  expect(payload.providerGrantPresent).toBe(false)
  expect(payload.graphSourceMutated).toBe(false)
  expect(payload.graphDeltaApplied).toBe(false)
  expect(payload.runtimeEvidenceSatisfied).toBe(false)
  expect(payload.evidenceAccepted).toBe(false)
  expect(payload.equivalenceProven).toBe(false)
  expect(payload.scopeEnforced).toBe(false)
  expect(payload.ciEnforcementEnabled).toBe(false)
  expect(payload.approvalAutomationEnabled).toBe(false)
  expect(payload.userAcceptanceAutomated).toBe(false)
  expect(payload.enterpriseGateActivated).toBe(false)
}
