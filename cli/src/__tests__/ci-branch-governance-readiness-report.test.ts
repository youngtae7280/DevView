import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson, writeText } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('security report-ci-branch-governance-readiness CLI', () => {
  it('reports default no-source CI/branch governance readiness without external mutation', async () => {
    const workspace = createWorkspace()

    const result = await runCiBranchGovernanceReadiness(workspace, [], '.tmp/ci-branch-governance.json', [
      '--markdown',
      '.tmp/ci-branch-governance.md',
    ])
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/ci-branch-governance.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-ci-branch-governance-readiness-report')
    expect(payload.status).toBe('devview-ci-branch-governance-readiness-reported')
    expect(payload.readinessScope).toBe('ci-branch-governance-readiness-report-only')
    expect(payload.ciBranchGovernanceReadinessStatus).toBe('not-ready-policy-and-external-governance-missing')
    expect(payload.workflowInventory.sourceCount).toBe(0)
    expect(payload.requiredChecksGovernanceReadiness.requiredChecksConfigured).toBe(false)
    expect(payload.branchProtectionGovernanceReadiness.branchProtectionMutated).toBe(false)
    expect(payload.scopeCiLifecycleBoundary.externalCiMutation).toBe(false)
    expect(written.writtenOutputPath).toBe('.tmp/ci-branch-governance.json')
    expect(written.writtenMarkdownPath).toBe('.tmp/ci-branch-governance.md')
    expect(existsSync(join(workspace, '.tmp/ci-branch-governance.md'))).toBe(true)
    expectSafetyFalse(payload)
  })

  it('summarizes Scope/CI, provider/network, RBAC, signing, provenance, release surface, and workflow sources', async () => {
    const workspace = createWorkspace()
    writeAllSafeSources(workspace)
    writeWorkflow(workspace, '.github/workflows/ci.yml', 'DevView CI', [
      ['quality-gate', 'Quality Gate'],
      ['read-model-check', 'Read Model Check'],
    ])

    const result = await runCiBranchGovernanceReadiness(
      workspace,
      [
        '--scope-ci-enforcement-readiness',
        '.tmp/scope-ci-readiness.json',
        '--scope-ci-enforcement-record',
        '.tmp/scope-ci-record.json',
        '--provider-network-policy-report',
        '.tmp/provider-network-policy.json',
        '--rbac-policy-validation',
        '.tmp/rbac-policy-validation.json',
        '--signing-readiness',
        '.tmp/signing-readiness.json',
        '--provenance-verification-readiness',
        '.tmp/provenance-verification-readiness.json',
        '--release-surface-validation',
        '.tmp/release-surface-validation.json',
        '--workflow',
        '.github/workflows/ci.yml',
      ],
      '.tmp/ci-branch-governance.json',
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ciBranchGovernanceReadinessStatus).toBe('report-only-readiness-recorded-not-enforced')
    expect(payload.sourceScopeCiEnforcementReadiness).toEqual(
      expect.objectContaining({
        supplied: true,
        artifactRole: 'devview-scope-ci-enforcement-readiness-preview',
        status: 'devview-scope-ci-enforcement-readiness-ready',
        scopeEnforced: false,
        ciEnforcementEnabled: false,
      }),
    )
    expect(payload.sourceScopeCiEnforcementRecord).toEqual(
      expect.objectContaining({
        supplied: true,
        scopeCiEnforcementState: 'scope-ci-enforcement-recorded-no-external-ci-mutation',
        internalScopeEnforced: true,
        internalCiEnforcementEnabled: true,
        externalCiMutated: false,
        branchProtectionMutated: false,
      }),
    )
    expect(payload.sourceProviderNetworkPolicy).toEqual(
      expect.objectContaining({
        defaultProviderPolicy: 'deny',
        defaultNetworkPolicy: 'deny',
        providerAllowlistCount: 0,
        networkAllowlistCount: 0,
      }),
    )
    expect(payload.sourceRbacPolicyValidation).toEqual(
      expect.objectContaining({
        defaultDenyConfigured: true,
        actorCount: 2,
        roleAssignmentCount: 2,
        permissionGrantCount: 2,
      }),
    )
    expect(payload.sourceSigningReadiness.signingReadinessStatus).toBe('not-ready-policy-and-key-governance-missing')
    expect(payload.sourceProvenanceVerificationReadiness.provenanceVerificationReadinessStatus).toBe(
      'not-ready-key-trust-and-signature-policy-missing',
    )
    expect(payload.sourceReleaseSurfaceValidation).toEqual(
      expect.objectContaining({
        status: 'devview-release-surface-validation-passed',
        packageFileCount: 12,
        forbiddenFindingCount: 0,
      }),
    )
    expect(payload.workflowInventory).toEqual(
      expect.objectContaining({
        sourceCount: 1,
        candidateRequiredChecks: ['Quality Gate', 'Read Model Check'],
      }),
    )
    expect(payload.workflowInventory.workflows[0]).toEqual(
      expect.objectContaining({
        path: '.github/workflows/ci.yml',
        workflowName: 'DevView CI',
        jobCount: 2,
        byteLength: expect.any(Number),
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    )
    expect(payload.requiredChecksGovernanceReadiness.requiredChecksConfigured).toBe(false)
    expect(payload.ciProviderGovernanceReadiness.providerNetworkDefaultDenyLinked).toBe(true)
    expect(payload.governanceFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'CI_BRANCH_GOVERNANCE_SCOPE_CI_RECORD_LINKED',
        'CI_BRANCH_GOVERNANCE_PROVIDER_NETWORK_POLICY_LINKED',
        'CI_BRANCH_GOVERNANCE_WORKFLOW_INVENTORY_RECORDED',
      ]),
    )
    expectSafetyFalse(payload)
  })

  it('inventories repeated and comma-separated workflow inputs', async () => {
    const workspace = createWorkspace()
    writeWorkflow(workspace, '.github/workflows/ci.yml', 'DevView CI', [['quality-gate', 'Quality Gate']])
    writeWorkflow(workspace, '.github/workflows/read-model-evidence.yml', 'Evidence', [['validate', null]])

    const result = await runCiBranchGovernanceReadiness(
      workspace,
      ['--workflow', '.github/workflows/ci.yml,.github/workflows/read-model-evidence.yml'],
      '.tmp/ci-branch-governance.json',
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.workflowInventory.sourceCount).toBe(2)
    expect(payload.workflowInventory.candidateRequiredChecks).toEqual(['Quality Gate', 'validate'])
  })

  it('blocks wrong source role/status with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provider-network-policy.json'), {
      ...providerNetworkPolicyReport(),
      status: 'wrong',
    })

    const result = await runCiBranchGovernanceReadiness(
      workspace,
      ['--provider-network-policy-report', '.tmp/provider-network-policy.json'],
      '.tmp/ci-branch-governance.json',
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'CI_BRANCH_GOVERNANCE_PROVIDER_NETWORK_POLICY_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/ci-branch-governance.json'))).toBe(false)
  })

  it('blocks unsafe Scope/CI external mutation and provider/network allowlists', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/scope-ci-record-unsafe.json'), {
      ...scopeCiEnforcementRecord(),
      branchProtectionMutated: true,
    })
    writeJson(join(workspace, '.tmp/provider-network-policy-allowlist.json'), {
      ...providerNetworkPolicyReport(),
      providerAllowlist: ['github'],
    })

    const scopeResult = await runCiBranchGovernanceReadiness(
      workspace,
      ['--scope-ci-enforcement-record', '.tmp/scope-ci-record-unsafe.json'],
      '.tmp/scope-output.json',
    )
    const providerResult = await runCiBranchGovernanceReadiness(
      workspace,
      ['--provider-network-policy-report', '.tmp/provider-network-policy-allowlist.json'],
      '.tmp/provider-output.json',
    )

    expect(scopeResult.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(scopeResult.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'CI_BRANCH_GOVERNANCE_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/scope-output.json'))).toBe(false)

    expect(providerResult.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(providerResult.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'CI_BRANCH_GOVERNANCE_PROVIDER_NETWORK_ALLOWLIST_UNSUPPORTED',
    )
    expect(existsSync(join(workspace, '.tmp/provider-output.json'))).toBe(false)
  })

  it('blocks RBAC, signing, and provenance sources that claim authority', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/rbac-policy-validation.json'), {
      ...rbacPolicyValidationReport(),
      rbacEnforced: true,
    })
    writeJson(join(workspace, '.tmp/signing-readiness.json'), { ...signingReadinessReport(), keyGenerated: true })
    writeJson(join(workspace, '.tmp/provenance-verification-readiness.json'), {
      ...provenanceVerificationReadinessReport(),
      cryptographicSignatureVerified: true,
    })

    const cases = [
      {
        args: ['--rbac-policy-validation', '.tmp/rbac-policy-validation.json'],
        output: '.tmp/rbac-output.json',
      },
      {
        args: ['--signing-readiness', '.tmp/signing-readiness.json'],
        output: '.tmp/signing-output.json',
      },
      {
        args: ['--provenance-verification-readiness', '.tmp/provenance-verification-readiness.json'],
        output: '.tmp/provenance-output.json',
      },
    ]

    for (const entry of cases) {
      const result = await runCiBranchGovernanceReadiness(workspace, entry.args, entry.output)
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues.map((issue: { code: string }) => issue.code)).toContain(
        'CI_BRANCH_GOVERNANCE_UNSUPPORTED_AUTHORITY_CLAIM',
      )
      expect(existsSync(join(workspace, entry.output))).toBe(false)
    }
  })

  it('blocks output collisions, source overwrites, workflow overwrites, protected paths, and source-shaped outputs', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provider-network-policy.json'), providerNetworkPolicyReport())
    writeWorkflow(workspace, '.github/workflows/ci.yml', 'DevView CI', [['quality-gate', 'Quality Gate']])
    const cases = [
      {
        args: ['--provider-network-policy-report', '.tmp/provider-network-policy.json'],
        output: '.tmp/provider-network-policy.json',
        expected: 'would overwrite a source input',
      },
      {
        args: ['--workflow', '.github/workflows/ci.yml'],
        output: '.github/workflows/ci.yml',
        expected: 'would overwrite a source input',
      },
      {
        args: [],
        output: '.tmp/ci-branch-governance.json',
        markdown: '.tmp/ci-branch-governance.json',
        expected: 'must be different',
      },
      {
        args: [],
        output: join('.devview', 'generated', 'ci-branch-governance.json'),
        expected: 'inside a protected control path',
      },
      {
        args: [],
        output: '.tmp/branch-protection-policy.json',
        expected: 'looks like a source authority artifact',
      },
    ]

    for (const entry of cases) {
      const result = await runCiBranchGovernanceReadiness(
        workspace,
        entry.args,
        entry.output,
        entry.markdown ? ['--markdown', entry.markdown] : [],
      )
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(result.stderr).toContain(entry.expected)
    }
  })
})

function runCiBranchGovernanceReadiness(workspace: string, args: string[], output: string, extraArgs: string[] = []) {
  return runDevViewCli(
    ['security', 'report-ci-branch-governance-readiness', ...args, '--output', output, ...extraArgs, '--json'],
    {
      cwd: workspace,
      pluginRoot,
    },
  )
}

function writeAllSafeSources(workspace: string): void {
  writeJson(join(workspace, '.tmp/scope-ci-readiness.json'), scopeCiEnforcementReadiness())
  writeJson(join(workspace, '.tmp/scope-ci-record.json'), scopeCiEnforcementRecord())
  writeJson(join(workspace, '.tmp/provider-network-policy.json'), providerNetworkPolicyReport())
  writeJson(join(workspace, '.tmp/rbac-policy-validation.json'), rbacPolicyValidationReport())
  writeJson(join(workspace, '.tmp/signing-readiness.json'), signingReadinessReport())
  writeJson(join(workspace, '.tmp/provenance-verification-readiness.json'), provenanceVerificationReadinessReport())
  writeJson(join(workspace, '.tmp/release-surface-validation.json'), releaseSurfaceValidationReport())
}

function writeWorkflow(
  workspace: string,
  filePath: string,
  workflowName: string,
  jobs: Array<[string, string | null]>,
): void {
  const jobLines = jobs.flatMap(([jobId, jobName]) => [
    `  ${jobId}:`,
    ...(jobName ? [`    name: ${jobName}`] : []),
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
  ])
  writeText(join(workspace, filePath), [`name: ${workflowName}`, 'on: [push]', 'jobs:', ...jobLines, ''].join('\n'))
}

function scopeCiEnforcementReadiness(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-scope-ci-enforcement-readiness-preview',
    status: 'devview-scope-ci-enforcement-readiness-ready',
    readinessScope: 'scope-ci-enforcement-readiness-preview-disabled-no-enforcement',
    scopeCiEnforcementReadinessStatus: 'ready-for-future-scope-ci-enforcement-command',
    scopeEnforcementAllowed: false,
    ciEnforcementAllowed: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    requiredChecksConfigured: false,
    branchProtectionChanged: false,
    diffRejectionEnabled: false,
    ...safetyFlags(),
    ...overrides,
  }
}

function scopeCiEnforcementRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-scope-ci-enforcement-record',
    status: 'devview-scope-ci-enforcement-recorded',
    scopeCiEnforcementState: 'scope-ci-enforcement-recorded-no-external-ci-mutation',
    enforcementKind: 'deterministic-scope-ci-record-v1',
    enforcementActivationScope: 'devview-record-only-no-external-ci-mutation',
    scopeEnforced: true,
    ciEnforcementEnabled: true,
    requiredChecksConfigured: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    hooksActivated: false,
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    providerInvoked: false,
    networkCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
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
    explicitAllowSupported: false,
    providerAllowlist: [],
    networkAllowlist: [],
    futureAllowPolicyRequirements: ['signed policy'],
    blockedCapabilities: ['provider execution', 'network access'],
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
    defaultDenyStatus: { defaultAuthorityPolicy: 'deny', defaultDenyConfigured: true },
    actorSummary: { actorCount: 2 },
    roleAssignmentSummary: { assignmentCount: 2 },
    permissionGrantSummary: { grantCount: 2 },
    automationRestrictionStatus: { automationRestrictionDeclared: true },
    extensionAuthorRestrictionStatus: { extensionAuthorRestrictionDeclared: true },
    noEnforcementPerformed: true,
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
    cryptographicSignaturePresent: false,
    cryptographicSignatureVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
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
      status: 'not-ready',
      keyRegistryPresent: false,
      trustRootPresent: false,
      privateKeyStoragePresent: false,
    },
    signaturePolicyReadiness: { status: 'not-ready' },
    cryptographicSigningImplemented: false,
    cryptographicSignaturePresent: false,
    cryptographicSignatureVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
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
    verificationBoundary: {
      realSlsaVerificationPerformed: false,
      realInTotoVerificationPerformed: false,
      cryptographicSignatureVerified: false,
    },
    networkIsolationReadiness: { providerNetworkDefaultDenyRecorded: true },
    realSlsaVerificationPerformed: false,
    realInTotoVerificationPerformed: false,
    provenanceAttestationGenerated: false,
    provenanceAttestationVerified: false,
    packageSigned: false,
    cryptographicSignatureVerified: false,
    keyGenerated: false,
    privateKeyStored: false,
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
    ...safetyFlags(),
    ...overrides,
  }
}

function releaseSurfaceValidationReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-release-surface-validation-report',
    status: 'devview-release-surface-validation-passed',
    packageName: 'devview',
    packageVersion: '0.2.0-alpha',
    dryRun: true,
    packageFileCount: 12,
    forbiddenFindingCount: 0,
    forbiddenFindings: [],
    ...safetyFlags(),
    ...overrides,
  }
}

function safetyFlags(): Record<string, unknown> {
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
  expect(payload.rbacEnforced).toBe(false)
  expect(payload.permissionVerified).toBe(false)
  expect(payload.rbacPermissionVerified).toBe(false)
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
