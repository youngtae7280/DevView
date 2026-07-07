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

describe('security report-rbac-readiness CLI', () => {
  it('emits a default report-only actor and permission matrix with safety flags false', async () => {
    const workspace = createWorkspace()

    const result = await runDevViewCli(
      [
        'security',
        'report-rbac-readiness',
        '--output',
        '.tmp/rbac-readiness.json',
        '--markdown',
        '.tmp/rbac-readiness.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/rbac-readiness.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-rbac-readiness-report')
    expect(payload.status).toBe('devview-rbac-readiness-reported')
    expect(payload.readinessScope).toBe('rbac-actor-identity-readiness-report-only')
    expect(payload.rbacEnforced).toBe(false)
    expect(payload.signedRecordEnvelopePresent).toBe(false)
    expect(payload.cryptographicSigningImplemented).toBe(false)
    expect(payload.keyManagementImplemented).toBe(false)
    expect(payload.actorModelSummary.map((entry: { actorType: string }) => entry.actorType)).toEqual(
      expect.arrayContaining(['operator', 'reviewer', 'maintainer', 'auditor', 'automation', 'extension-author']),
    )
    expect(payload.actorIdentityObjectProposal.requiredFields).toEqual(
      expect.arrayContaining([
        'actorId',
        'actorType',
        'identityProvider',
        'roleClaims',
        'authorityScope',
        'identityAssurance',
      ]),
    )
    expect(payload.rolePermissionMatrix.flatMap((entry: { permissions: string[] }) => entry.permissions)).toEqual(
      expect.arrayContaining(['report.create', 'graph.apply.execute', 'provider-network.policy.record']),
    )
    expect(payload.artifactPermissionMapping).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifactRole: 'devview-guarded-graph-update-apply-report',
          requiredPermission: 'graph.apply.execute',
          signatureRequiredBeforeEnterpriseReady: true,
        }),
      ]),
    )
    expect(payload.rbacReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'RBAC_ACTOR_MODEL_REPORTED',
        'RBAC_ENFORCEMENT_NOT_IMPLEMENTED',
        'RBAC_SIGNED_RECORD_ENVELOPE_NOT_IMPLEMENTED',
      ]),
    )
    expect(written.writtenMarkdownPath).toBe('.tmp/rbac-readiness.md')
    expect(existsSync(join(workspace, '.tmp/rbac-readiness.md'))).toBe(true)
    expectSafetyFalse(payload)
  })

  it('summarizes optional enterprise, provider/network, and benchmark governance source facts', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/enterprise-readiness.json'), enterpriseReadinessReport())
    writeJson(join(workspace, '.tmp/provider-network-policy-report.json'), providerNetworkPolicyReport())
    writeJson(join(workspace, '.tmp/benchmark-governance.json'), benchmarkGovernanceReport())

    const result = await runDevViewCli(
      [
        'security',
        'report-rbac-readiness',
        '--enterprise-readiness',
        '.tmp/enterprise-readiness.json',
        '--provider-network-policy-report',
        '.tmp/provider-network-policy-report.json',
        '--benchmark-governance-verification',
        '.tmp/benchmark-governance.json',
        '--output',
        '.tmp/rbac-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.sourceEnterpriseReadiness.status).toBe('devview-enterprise-readiness-report-generated')
    expect(payload.sourceProviderNetworkPolicyReport.status).toBe(
      'devview-provider-network-default-deny-policy-recorded',
    )
    expect(payload.sourceProviderNetworkPolicyReport.defaultProviderPolicy).toBe('deny')
    expect(payload.sourceProviderNetworkPolicyReport.defaultNetworkPolicy).toBe('deny')
    expect(payload.sourceProviderNetworkPolicyReport.explicitAllowSupported).toBe(false)
    expect(payload.sourceBenchmarkGovernanceVerification.status).toBe('devview-benchmark-governance-verified')
    expect(payload.sourceBenchmarkGovernanceVerification.enterpriseClaimReadiness).toBe(
      'verified-for-static-benchmark-only',
    )
    expect(payload.currentSourceActorFieldsSummary.enterpriseRbacStatus).toBe('gap')
    expect(payload.currentSourceActorFieldsSummary.actorIdentityModelPresent).toBe(false)
    expect(payload.currentSourceActorFieldsSummary.signedRecordEnvelopePresent).toBe(false)
    expect(payload.currentSourceActorFieldsSummary.providerFutureAllowRequirementCount).toBe(2)
    expect(payload.currentSourceActorFieldsSummary.benchmarkGoldenReviewStatus).toBe('present')
    expect(payload.rbacReadinessFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'RBAC_ENTERPRISE_READINESS_SOURCE_LINKED',
        'RBAC_PROVIDER_NETWORK_POLICY_SOURCE_LINKED',
        'RBAC_BENCHMARK_GOVERNANCE_SOURCE_LINKED',
      ]),
    )
    expectSafetyFalse(payload)
  })

  it('blocks wrong role/status and unsafe source flags with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-enterprise-readiness.json'), {
      ...enterpriseReadinessReport(),
      status: 'wrong',
    })
    writeJson(join(workspace, '.tmp/unsafe-provider-network-policy-report.json'), {
      ...providerNetworkPolicyReport(),
      providerInvoked: true,
    })
    writeJson(join(workspace, '.tmp/wrong-benchmark-governance.json'), {
      ...benchmarkGovernanceReport(),
      artifactRole: 'wrong',
    })

    const wrongEnterprise = await runRbacReport(
      workspace,
      ['--enterprise-readiness', '.tmp/wrong-enterprise-readiness.json'],
      '.tmp/wrong-enterprise-rbac.json',
    )
    const unsafeProvider = await runRbacReport(
      workspace,
      ['--provider-network-policy-report', '.tmp/unsafe-provider-network-policy-report.json'],
      '.tmp/unsafe-provider-rbac.json',
    )
    const wrongBenchmark = await runRbacReport(
      workspace,
      ['--benchmark-governance-verification', '.tmp/wrong-benchmark-governance.json'],
      '.tmp/wrong-benchmark-rbac.json',
    )

    expect(wrongEnterprise.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrongEnterprise.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RBAC_READINESS_ENTERPRISE_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-enterprise-rbac.json'))).toBe(false)

    expect(unsafeProvider.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafeProvider.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RBAC_READINESS_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe-provider-rbac.json'))).toBe(false)

    expect(wrongBenchmark.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrongBenchmark.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RBAC_READINESS_BENCHMARK_GOVERNANCE_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-benchmark-rbac.json'))).toBe(false)
  })

  it('blocks incompatible provider/network policy source facts with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/default-allow-provider-report.json'), {
      ...providerNetworkPolicyReport(),
      defaultProviderPolicy: 'allow',
    })
    writeJson(join(workspace, '.tmp/allowlist-provider-report.json'), {
      ...providerNetworkPolicyReport(),
      providerAllowlist: ['future-provider'],
    })

    const defaultAllow = await runRbacReport(
      workspace,
      ['--provider-network-policy-report', '.tmp/default-allow-provider-report.json'],
      '.tmp/default-allow-rbac.json',
    )
    const allowlist = await runRbacReport(
      workspace,
      ['--provider-network-policy-report', '.tmp/allowlist-provider-report.json'],
      '.tmp/allowlist-rbac.json',
    )

    expect(defaultAllow.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(defaultAllow.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RBAC_READINESS_PROVIDER_POLICY_NOT_DENY',
    )
    expect(existsSync(join(workspace, '.tmp/default-allow-rbac.json'))).toBe(false)

    expect(allowlist.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(allowlist.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RBAC_READINESS_PROVIDER_NETWORK_ALLOWLIST_NOT_EMPTY',
    )
    expect(existsSync(join(workspace, '.tmp/allowlist-rbac.json'))).toBe(false)
  })

  it('blocks output collisions, source overwrite, and protected output paths', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/enterprise-readiness.json'), enterpriseReadinessReport())
    const cases = [
      { output: '.tmp/enterprise-readiness.json', expected: 'would overwrite a source input' },
      { output: '.tmp/rbac.json', markdown: '.tmp/rbac.json', expected: 'must be different' },
      { output: join('.devview', 'generated', 'rbac-readiness.json'), expected: 'inside a protected control path' },
    ]

    for (const entry of cases) {
      const result = await runDevViewCli(
        [
          'security',
          'report-rbac-readiness',
          '--enterprise-readiness',
          '.tmp/enterprise-readiness.json',
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

function runRbacReport(workspace: string, sourceArgs: string[], output: string) {
  return runDevViewCli(['security', 'report-rbac-readiness', ...sourceArgs, '--output', output, '--json'], {
    cwd: workspace,
    pluginRoot,
  })
}

function enterpriseReadinessReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-enterprise-readiness-report',
    status: 'devview-enterprise-readiness-report-generated',
    readinessLevel: 'not-ready',
    sourceFactsOnly: true,
    reportOnly: true,
    rbacAndSigningReadiness: {
      status: 'gap',
      actorIdentityModelPresent: false,
      signedRecordEnvelopePresent: false,
    },
    enterpriseGateActivated: false,
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
    branchProtectionMutated: false,
    requiredChecksMutated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
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
    blockedCapabilities: ['provider execution', 'network access'],
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

function benchmarkGovernanceReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-benchmark-governance-verification-report',
    status: 'devview-benchmark-governance-verified',
    verificationScope: 'benchmark-governance-verification-report-only',
    enterpriseClaimReadiness: 'verified-for-static-benchmark-only',
    goldenReviewGovernanceCheck: {
      status: 'present',
    },
    heldOutPolicyCheck: {
      status: 'declared',
    },
    benchmarkExecuted: false,
    candidateExecuted: false,
    graphifyExecuted: false,
    nativeBenchmarkExecuted: false,
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
    ...overrides,
  }
}

function expectSafetyFalse(payload: Record<string, unknown>): void {
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
}
