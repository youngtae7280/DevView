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

describe('security validate-provider-activation-grant-policy CLI', () => {
  it('validates a minimal report-only provider activation grant policy with default-deny sources', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provider-activation-grant-policy.json'), providerActivationGrantPolicy())
    writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())
    writeJson(
      join(workspace, '.tmp/provider-activation-authorization-readiness.json'),
      providerActivationAuthorizationReadinessReport(),
    )

    const result = await runProviderActivationGrantPolicyValidation(
      workspace,
      [
        '--policy',
        '.tmp/provider-activation-grant-policy.json',
        '--provider-network-policy-report',
        '.tmp/provider-network-policy-report.json',
        '--provider-activation-authorization-readiness',
        '.tmp/provider-activation-authorization-readiness.json',
      ],
      '.tmp/provider-activation-grant-policy-validation.json',
      ['--markdown', '.tmp/provider-activation-grant-policy-validation.md'],
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-provider-activation-grant-policy-validation-report')
    expect(payload.status).toBe('devview-provider-activation-grant-policy-validation-passed')
    expect(payload.validationScope).toBe('provider-activation-grant-policy-validation-report-only')
    expect(payload.providerActivationGrantPolicyValidationStatus).toBe('partial-readiness-source-linkage-missing')
    expect(payload.sourcePolicy.providerId).toBe('github')
    expect(payload.sourcePolicy.operationCount).toBe(2)
    expect(payload.sourcePolicy.repositoryScopeCount).toBe(2)
    expect(payload.sourcePolicy.branchScopeCount).toBe(1)
    expect(payload.sourcePolicy.checkScopeCount).toBe(2)
    expect(payload.sourceProviderNetworkPolicy.defaultProviderPolicy).toBe('deny')
    expect(payload.sourceProviderNetworkPolicy.networkAllowlistCount).toBe(0)
    expect(payload.sourceProviderActivationAuthorizationReadiness.providerGrantPresent).toBe(false)
    expect(payload.grantPolicyValidation.operationScopeRecorded).toBe(true)
    expect(payload.providerOperationScopeValidation.operationLabelsAreMetadataOnly).toBe(true)
    expect(payload.actorAuthorizationRequirementValidation.requiredRoles).toContain('security-admin')
    expect(payload.signedPolicyRequirementValidation.signedPolicyPresent).toBe(false)
    expect(payload.activationBoundary.providerGrantActive).toBe(false)
    expect(payload.sourceArtifactDigests).toHaveLength(3)
    expect(payload.sourceArtifactDigests[0].sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(existsSync(join(workspace, '.tmp/provider-activation-grant-policy-validation.md'))).toBe(true)
    expectSafetyFalse(payload)
  })

  it('summarizes the full report-only source chain without provider authority', async () => {
    const workspace = createWorkspace()
    writeAllSafeSources(workspace)

    const result = await runProviderActivationGrantPolicyValidation(
      workspace,
      [
        '--policy',
        '.tmp/provider-activation-grant-policy.json',
        '--provider-network-policy-report',
        '.tmp/provider-network-policy-report.json',
        '--provider-activation-authorization-readiness',
        '.tmp/provider-activation-authorization-readiness.json',
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
      '.tmp/full-provider-activation-grant-policy-validation.json',
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.providerActivationGrantPolicyValidationStatus).toBe('passed-report-only-grant-policy-not-active')
    expect(payload.sourceArtifactDigests).toHaveLength(10)
    expect(payload.sourceCiBranchActivationAuthorityReadiness.authorityReadinessStatus).toBe(
      'ready-for-future-authorization-review-only-not-activation',
    )
    expect(payload.sourceCiBranchActivationPlan.futureOnlyStepCount).toBe(2)
    expect(payload.sourceCiBranchActivationPlan.executedStepCount).toBe(0)
    expect(payload.sourceRbacPolicyValidation.actorCount).toBe(2)
    expect(payload.sourceSigningReadiness.keyRegistryPresent).toBe(false)
    expect(payload.sourceRecordEnvelopeVerification.payloadDigestMatches).toBe(true)
    expect(payload.sourceProvenanceVerificationReadiness.realSlsaVerificationPerformed).toBe(false)
    expect(payload.sourceEnterpriseReadiness.readinessLevel).toBe('not-ready')
    expectSafetyFalse(payload)
  })

  it('blocks wrong policy role, status, or scope with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())
    writeJson(
      join(workspace, '.tmp/provider-activation-authorization-readiness.json'),
      providerActivationAuthorizationReadinessReport(),
    )
    const cases: Array<[string, Record<string, unknown>, string]> = [
      ['role', { artifactRole: 'wrong' }, 'PROVIDER_ACTIVATION_GRANT_POLICY_POLICY_ROLE_STATUS_INVALID'],
      ['status', { status: 'wrong' }, 'PROVIDER_ACTIVATION_GRANT_POLICY_POLICY_ROLE_STATUS_INVALID'],
      ['scope', { policyScope: 'wrong' }, 'PROVIDER_ACTIVATION_GRANT_POLICY_SCOPE_INVALID'],
    ]

    for (const [name, override, expectedCode] of cases) {
      writeJson(join(workspace, `.tmp/${name}-policy.json`), providerActivationGrantPolicy(override))
      const output = `.tmp/${name}-output.json`
      const result = await runProviderActivationGrantPolicyValidation(
        workspace,
        [
          '--policy',
          `.tmp/${name}-policy.json`,
          '--provider-network-policy-report',
          '.tmp/provider-network-policy-report.json',
          '--provider-activation-authorization-readiness',
          '.tmp/provider-activation-authorization-readiness.json',
        ],
        output,
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(expectedCode)
      expect(existsSync(join(workspace, output))).toBe(false)
    }
  })

  it('blocks default allow, active grant, allowlists, and provider/API calls with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())
    writeJson(
      join(workspace, '.tmp/provider-activation-authorization-readiness.json'),
      providerActivationAuthorizationReadinessReport(),
    )
    const cases: Array<[string, Record<string, unknown>, string]> = [
      [
        'default-allow',
        { defaultProviderPolicy: 'allow' },
        'PROVIDER_ACTIVATION_GRANT_POLICY_DEFAULT_ALLOW_UNSUPPORTED',
      ],
      [
        'grant-active',
        { activationBoundary: { providerGrantActive: true } },
        'PROVIDER_ACTIVATION_GRANT_POLICY_UNSAFE_AUTHORITY_FLAG',
      ],
      [
        'allowlist',
        { providerNetworkRequirements: { providerAllowlist: ['github'] } },
        'PROVIDER_ACTIVATION_GRANT_POLICY_ALLOWLIST_OR_GRANT_UNSUPPORTED',
      ],
      [
        'api-call',
        { activationBoundary: { providerInvoked: true, networkCallMade: true, apiCallMade: true } },
        'PROVIDER_ACTIVATION_GRANT_POLICY_UNSAFE_AUTHORITY_FLAG',
      ],
    ]

    for (const [name, override, expectedCode] of cases) {
      writeJson(join(workspace, `.tmp/${name}-policy.json`), providerActivationGrantPolicy(override))
      const output = `.tmp/${name}-output.json`
      const result = await runProviderActivationGrantPolicyValidation(
        workspace,
        [
          '--policy',
          `.tmp/${name}-policy.json`,
          '--provider-network-policy-report',
          '.tmp/provider-network-policy-report.json',
          '--provider-activation-authorization-readiness',
          '.tmp/provider-activation-authorization-readiness.json',
        ],
        output,
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(expectedCode)
      expect(existsSync(join(workspace, output))).toBe(false)
    }
  })

  it('blocks credentials, key material, and executable provider instructions in the policy', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())
    writeJson(
      join(workspace, '.tmp/provider-activation-authorization-readiness.json'),
      providerActivationAuthorizationReadinessReport(),
    )
    const cases: Array<[string, Record<string, unknown>, string]> = [
      [
        'credential',
        { providerSecrets: { token: 'not-a-real-token' } },
        'PROVIDER_ACTIVATION_GRANT_POLICY_SECRET_OR_SIGNATURE_MATERIAL_UNSUPPORTED',
      ],
      [
        'private-key',
        { signedPolicyRequirements: { privateKey: 'not-a-real-key' } },
        'PROVIDER_ACTIVATION_GRANT_POLICY_SECRET_OR_SIGNATURE_MATERIAL_UNSUPPORTED',
      ],
      [
        'script',
        { providerInstructions: { script: 'gh api repos/example/example' } },
        'PROVIDER_ACTIVATION_GRANT_POLICY_EXECUTABLE_INSTRUCTION_UNSUPPORTED',
      ],
    ]

    for (const [name, override, expectedCode] of cases) {
      writeJson(join(workspace, `.tmp/${name}-policy.json`), providerActivationGrantPolicy(override))
      const output = `.tmp/${name}-output.json`
      const result = await runProviderActivationGrantPolicyValidation(
        workspace,
        [
          '--policy',
          `.tmp/${name}-policy.json`,
          '--provider-network-policy-report',
          '.tmp/provider-network-policy-report.json',
          '--provider-activation-authorization-readiness',
          '.tmp/provider-activation-authorization-readiness.json',
        ],
        output,
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(expectedCode)
      expect(existsSync(join(workspace, output))).toBe(false)
    }
  })

  it('blocks unsafe optional source claims including executed activation steps', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provider-activation-grant-policy.json'), providerActivationGrantPolicy())
    writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())
    writeJson(
      join(workspace, '.tmp/provider-activation-authorization-readiness.json'),
      providerActivationAuthorizationReadinessReport(),
    )
    writeJson(join(workspace, '.tmp/executed-plan.json'), {
      ...ciBranchActivationPlanReport(),
      activationSequenceProposal: [{ stepId: 'bad', executionMode: 'executed' }],
    })
    writeJson(join(workspace, '.tmp/rbac-enforced.json'), { ...rbacPolicyValidationReport(), rbacEnforced: true })
    writeJson(join(workspace, '.tmp/key-created.json'), { ...signingReadinessReport(), keyRegistryCreated: true })
    writeJson(join(workspace, '.tmp/provider-called.json'), {
      ...providerActivationAuthorizationReadinessReport(),
      providerAuthorizationBoundary: { providerInvoked: true },
    })

    const cases: Array<[string, string[], string]> = [
      [
        'executed-plan',
        ['--ci-branch-activation-plan', '.tmp/executed-plan.json'],
        'PROVIDER_ACTIVATION_GRANT_POLICY_ACTIVATION_STEP_EXECUTED_UNSUPPORTED',
      ],
      [
        'rbac-enforced',
        ['--rbac-policy-validation', '.tmp/rbac-enforced.json'],
        'PROVIDER_ACTIVATION_GRANT_POLICY_UNSAFE_AUTHORITY_FLAG',
      ],
      [
        'key-created',
        ['--signing-readiness', '.tmp/key-created.json'],
        'PROVIDER_ACTIVATION_GRANT_POLICY_UNSAFE_AUTHORITY_FLAG',
      ],
      [
        'provider-called',
        ['--provider-activation-authorization-readiness', '.tmp/provider-called.json'],
        'PROVIDER_ACTIVATION_GRANT_POLICY_UNSAFE_AUTHORITY_FLAG',
      ],
    ]

    for (const [name, extraArgs, expectedCode] of cases) {
      const output = `.tmp/${name}-output.json`
      const providerAuthArgs =
        extraArgs[0] === '--provider-activation-authorization-readiness'
          ? []
          : ['--provider-activation-authorization-readiness', '.tmp/provider-activation-authorization-readiness.json']
      const result = await runProviderActivationGrantPolicyValidation(
        workspace,
        [
          '--policy',
          '.tmp/provider-activation-grant-policy.json',
          '--provider-network-policy-report',
          '.tmp/provider-network-policy-report.json',
          ...providerAuthArgs,
          ...extraArgs,
        ],
        output,
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(expectedCode)
      expect(existsSync(join(workspace, output))).toBe(false)
    }
  })

  it('blocks wrong source roles and provider default allow sources with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provider-activation-grant-policy.json'), providerActivationGrantPolicy())
    writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())
    writeJson(
      join(workspace, '.tmp/provider-activation-authorization-readiness.json'),
      providerActivationAuthorizationReadinessReport(),
    )
    const cases: Array<[string, string[], Record<string, unknown>, string]> = [
      [
        'provider-network',
        ['--provider-network-policy-report', '.tmp/wrong-provider-network.json'],
        { ...providerNetworkPolicyReport(), defaultProviderPolicy: 'allow' },
        'PROVIDER_ACTIVATION_GRANT_POLICY_DEFAULT_ALLOW_UNSUPPORTED',
      ],
      [
        'authorization-readiness',
        ['--provider-activation-authorization-readiness', '.tmp/wrong-authorization.json'],
        { ...providerActivationAuthorizationReadinessReport(), status: 'wrong' },
        'PROVIDER_ACTIVATION_GRANT_POLICY_PROVIDER_ACTIVATION_AUTHORIZATION_READINESS_ROLE_STATUS_INVALID',
      ],
      [
        'ci-authority',
        ['--ci-branch-activation-authority-readiness', '.tmp/wrong-ci-authority.json'],
        { ...ciBranchActivationAuthorityReadinessReport(), status: 'wrong' },
        'PROVIDER_ACTIVATION_GRANT_POLICY_CI_BRANCH_ACTIVATION_AUTHORITY_READINESS_ROLE_STATUS_INVALID',
      ],
    ]

    for (const [name, overrideArgs, source, expectedCode] of cases) {
      const sourcePath = overrideArgs[1]
      writeJson(join(workspace, sourcePath), source)
      const output = `.tmp/${name}-output.json`
      const providerNetworkArgs =
        overrideArgs[0] === '--provider-network-policy-report'
          ? []
          : ['--provider-network-policy-report', '.tmp/provider-network-policy-report.json']
      const providerAuthArgs =
        overrideArgs[0] === '--provider-activation-authorization-readiness'
          ? []
          : ['--provider-activation-authorization-readiness', '.tmp/provider-activation-authorization-readiness.json']
      const result = await runProviderActivationGrantPolicyValidation(
        workspace,
        [
          '--policy',
          '.tmp/provider-activation-grant-policy.json',
          ...providerNetworkArgs,
          ...providerAuthArgs,
          ...overrideArgs,
        ],
        output,
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(expectedCode)
      expect(existsSync(join(workspace, output))).toBe(false)
    }
  })

  it('blocks output collisions, source overwrites, protected paths, and source-authority-shaped outputs', async () => {
    const workspace = createWorkspace()
    writeAllSafeSources(workspace)
    const baseArgs = [
      '--policy',
      '.tmp/provider-activation-grant-policy.json',
      '--provider-network-policy-report',
      '.tmp/provider-network-policy-report.json',
      '--provider-activation-authorization-readiness',
      '.tmp/provider-activation-authorization-readiness.json',
    ]
    const cases: Array<{ output: string; markdown?: string; expected: string }> = [
      {
        output: '.tmp/same-output.json',
        markdown: '.tmp/same-output.json',
        expected: 'must differ',
      },
      {
        output: '.tmp/provider-activation-grant-policy.json',
        expected: 'overwrite a source input',
      },
      {
        output: '.devview/provider-activation-grant-policy-validation.json',
        expected: 'protected control path',
      },
      {
        output: 'source-authority/provider-activation-grant-policy-validation.json',
        expected: 'source-authority-shaped path',
      },
    ]

    for (const entry of cases) {
      const result = await runProviderActivationGrantPolicyValidation(
        workspace,
        baseArgs,
        entry.output,
        entry.markdown ? ['--markdown', entry.markdown] : [],
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues[0].message).toContain(entry.expected)
      if (entry.output === '.tmp/provider-activation-grant-policy.json') {
        expect(JSON.parse(readFileSync(join(workspace, entry.output), 'utf8')).artifactRole).toBe(
          'devview-provider-activation-grant-policy',
        )
      } else {
        expect(existsSync(join(workspace, entry.output))).toBe(false)
      }
    }
  })
})

function runProviderActivationGrantPolicyValidation(
  workspace: string,
  args: string[],
  output: string,
  extraArgs: string[] = [],
) {
  return runDevViewCli(
    ['security', 'validate-provider-activation-grant-policy', ...args, '--output', output, ...extraArgs, '--json'],
    { cwd: workspace, pluginRoot },
  )
}

function writeAllSafeSources(workspace: string): void {
  writeJson(join(workspace, '.tmp/provider-activation-grant-policy.json'), providerActivationGrantPolicy())
  writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())
  writeJson(
    join(workspace, '.tmp/provider-activation-authorization-readiness.json'),
    providerActivationAuthorizationReadinessReport(),
  )
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

function providerActivationGrantPolicy(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-provider-activation-grant-policy',
    status: 'devview-provider-activation-grant-policy-configured',
    policyScope: 'provider-activation-grant-policy-validation-report-only',
    activationMode: 'report-only-no-activation',
    defaultProviderPolicy: 'deny',
    defaultNetworkPolicy: 'deny',
    grantIntent: {
      providerId: 'github',
      providerCategory: 'ci-branch-governance',
      operations: [
        { operationId: 'github.requiredChecks.future-review', operationScope: 'future-activation-review-only' },
        { operationId: 'github.branchProtection.future-review', operationScope: 'future-activation-review-only' },
      ],
      repositoryScope: {
        owner: 'example',
        repo: 'devview',
        branches: ['main'],
        checks: ['build:cli', 'validate:devview'],
      },
    },
    providerNetworkRequirements: {
      defaultProviderPolicy: 'deny',
      defaultNetworkPolicy: 'deny',
      providerAllowlist: [],
      networkAllowlist: [],
      apiAllowlist: [],
      providerGrantActive: false,
      providerAllowlistActive: false,
      networkAllowlistActive: false,
    },
    actorAuthorizationRequirements: {
      requiredRoles: ['security-admin', 'maintainer', 'auditor', 'provider-network-policy-maintainer'],
      requiredPermissions: [
        'provider-network.grant.review',
        'provider-network.policy.allow',
        'ci-branch.activation.authorize',
        'audit.verify',
      ],
      rbacEnforced: false,
      permissionVerified: false,
    },
    signedPolicyRequirements: {
      signedPolicyRequired: true,
      signedPolicyPresent: false,
      signedPolicyVerified: false,
      recordEnvelopeRequired: true,
      cryptographicSignatureVerified: false,
      keyRegistryPresent: false,
      trustRootPresent: false,
    },
    ttlAndRevocation: {
      ttlRequired: true,
      expiresAtPolicy: 'explicit-future-policy-required',
      revocationRequired: true,
      revocationMetadataPresent: false,
    },
    auditReviewRequirements: {
      auditReviewRequired: true,
      reviewRecordPresent: false,
      sourceDigestRequired: true,
    },
    activationBoundary: {
      providerInvoked: false,
      networkCallMade: false,
      apiCallMade: false,
      providerGrantActive: false,
      providerGrantActivated: false,
      providerAllowlistActive: false,
      networkAllowlistActive: false,
      enterpriseGateActivated: false,
    },
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

function providerActivationAuthorizationReadinessReport(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-provider-activation-authorization-readiness-report',
    status: 'devview-provider-activation-authorization-readiness-reported',
    readinessScope: 'provider-activation-authorization-readiness-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    authorizationReadinessStatus: 'ready-for-future-provider-grant-policy-review-only-not-activation',
    providerAuthorizationBoundary: {
      defaultProviderPolicy: 'deny',
      defaultNetworkPolicy: 'deny',
      providerGrantPresent: false,
      providerGrantVerified: false,
      providerAllowlistActive: false,
      networkAllowlistActive: false,
      explicitAllowSupported: false,
      providerInvoked: false,
      networkCallMade: false,
      apiCallMade: false,
    },
    futureProviderGrantRequirements: ['future grant artifact', 'signed policy', 'RBAC review'],
    actorAuthorizationPrerequisites: { rbacEnforced: false, permissionVerified: false },
    signedPolicyPrerequisites: {
      signedPolicyPresent: false,
      cryptographicSignatureVerified: false,
      keyRegistryPresent: false,
      trustRootPresent: false,
    },
    ...safetyFlags(),
    providerGrantPresent: false,
    providerGrantVerified: false,
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
      signedPolicyPresent: false,
      providerGrantPresent: false,
      rbacEnforced: false,
      permissionVerified: false,
    },
    ...safetyFlags(),
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
    permissionGrantSummary: { grantCount: 2 },
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
    signingReadinessStatus: 'not-ready-policy-and-key-governance-missing',
    keyGovernanceReadiness: { keyRegistryPresent: false, trustRootPresent: false },
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
    signatureVerificationMode: 'not-performed-unsigned-preview-only',
    payloadVerification: { digestMatches: true },
    sourceArtifactVerification: { allSourceDigestsMatch: true },
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
    provenanceVerificationReadinessStatus: 'not-ready-key-trust-and-signature-policy-missing',
    verificationBoundary: { realSlsaVerificationPerformed: false, realInTotoVerificationPerformed: false },
    ...safetyFlags(),
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
    ...safetyFlags(),
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
    providerGrantActive: false,
    providerGrantActivated: false,
    providerCredentialsRead: false,
    providerCredentialsStored: false,
    explicitAllowSupported: false,
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
    signedPolicyPresent: false,
    signedPolicyVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
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
    realSlsaVerificationPerformed: false,
    realInTotoVerificationPerformed: false,
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
  expect(payload.providerGrantActive).toBe(false)
  expect(payload.providerGrantActivated).toBe(false)
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
  expect(payload.signedPolicyPresent).toBe(false)
  expect(payload.signedPolicyVerified).toBe(false)
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
