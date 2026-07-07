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

describe('security validate-rbac-policy CLI', () => {
  it('validates a minimal default-deny RBAC policy without enforcing RBAC', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/rbac-policy.json'), rbacPolicy())

    const result = await runRbacPolicyValidation(
      workspace,
      ['--policy', '.tmp/rbac-policy.json'],
      '.tmp/rbac-policy-validation.json',
      ['--markdown', '.tmp/rbac-policy-validation.md'],
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/rbac-policy-validation.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-rbac-policy-validation-report')
    expect(payload.status).toBe('devview-rbac-policy-validation-passed')
    expect(payload.validationScope).toBe('rbac-policy-validation-report-only')
    expect(payload.rbacPolicyValidationStatus).toBe('partial-readiness')
    expect(payload.sourcePolicy).toEqual(
      expect.objectContaining({
        supplied: true,
        path: '.tmp/rbac-policy.json',
        artifactRole: 'devview-rbac-policy',
        status: 'devview-rbac-policy-configured',
        defaultAuthorityPolicy: 'deny',
      }),
    )
    expect(payload.actorSummary.actorCount).toBe(2)
    expect(payload.actorSummary.actorCountByType).toEqual({ human: 1, automation: 1 })
    expect(payload.roleAssignmentSummary.assignmentCount).toBe(2)
    expect(payload.permissionGrantSummary.grantCount).toBe(2)
    expect(payload.defaultDenyStatus.defaultDenyConfigured).toBe(true)
    expect(payload.automationRestrictionStatus.automationRestrictionDeclared).toBe(true)
    expect(payload.automationRestrictionStatus.automationOvergrantCount).toBe(0)
    expect(payload.noEnforcementPerformed).toBe(true)
    expect(written.writtenOutputPath).toBe('.tmp/rbac-policy-validation.json')
    expect(written.writtenMarkdownPath).toBe('.tmp/rbac-policy-validation.md')
    expect(existsSync(join(workspace, '.tmp/rbac-policy-validation.md'))).toBe(true)
    expectSafetyFalse(payload)
  })

  it('summarizes RBAC readiness and signing readiness sources', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/rbac-policy.json'), rbacPolicy())
    writeJson(join(workspace, '.tmp/rbac-readiness.json'), rbacReadinessReport())
    writeJson(join(workspace, '.tmp/signing-readiness.json'), signingReadinessReport())

    const result = await runRbacPolicyValidation(
      workspace,
      [
        '--policy',
        '.tmp/rbac-policy.json',
        '--rbac-readiness',
        '.tmp/rbac-readiness.json',
        '--signing-readiness',
        '.tmp/signing-readiness.json',
      ],
      '.tmp/rbac-policy-validation.json',
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.rbacPolicyValidationStatus).toBe('passed')
    expect(payload.sourceRbacReadiness).toEqual(
      expect.objectContaining({
        supplied: true,
        artifactRole: 'devview-rbac-readiness-report',
        status: 'devview-rbac-readiness-reported',
        actorModelPresent: true,
        rolePermissionMatrixPresent: true,
        artifactPermissionMappingPresent: true,
      }),
    )
    expect(payload.sourceSigningReadiness).toEqual(
      expect.objectContaining({
        supplied: true,
        artifactRole: 'devview-signing-readiness-report',
        status: 'devview-signing-readiness-reported',
        signingReadinessStatus: 'not-ready-policy-and-key-governance-missing',
        keyGovernanceStatus: 'not-ready',
        signaturePolicyStatus: 'not-ready',
        rbacPrerequisiteActorModelPresent: true,
        rbacPrerequisitePermissionMatrixPresent: true,
      }),
    )
    expect(payload.policyFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'RBAC_POLICY_VALIDATION_RBAC_READINESS_LINKED',
        'RBAC_POLICY_VALIDATION_SIGNING_READINESS_LINKED',
      ]),
    )
    expectSafetyFalse(payload)
  })

  it('reports unknown actors, roles, and benign permissions as partial readiness findings', async () => {
    const workspace = createWorkspace()
    writeJson(
      join(workspace, '.tmp/rbac-policy.json'),
      rbacPolicy({
        actors: [{ actorId: 'operator.local', actorType: 'human', identityProvider: 'explicit-cli-input' }],
        roleAssignments: [{ actorId: 'missing.local', role: 'custom-role' }],
        permissionGrants: [
          { role: 'custom-role', permission: 'custom.report.view' },
          { role: 'reporter', permission: 'custom.read' },
        ],
      }),
    )

    const result = await runRbacPolicyValidation(
      workspace,
      ['--policy', '.tmp/rbac-policy.json'],
      '.tmp/rbac-policy-validation.json',
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.rbacPolicyValidationStatus).toBe('partial-readiness')
    expect(payload.roleAssignmentSummary.unknownActorReferences).toEqual(['missing.local'])
    expect(payload.roleAssignmentSummary.unknownRoles).toEqual(['custom-role'])
    expect(payload.permissionGrantSummary.unknownPermissions).toEqual(['custom.report.view', 'custom.read'])
    expect(payload.policyFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'RBAC_POLICY_VALIDATION_UNKNOWN_ACTOR_REFERENCE',
        'RBAC_POLICY_VALIDATION_UNKNOWN_ROLE',
        'RBAC_POLICY_VALIDATION_UNKNOWN_PERMISSION',
      ]),
    )
    expectSafetyFalse(payload)
  })

  it('blocks wrong policy role/status and default allow policy with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/wrong-policy.json'), { ...rbacPolicy(), status: 'wrong' })
    writeJson(join(workspace, '.tmp/default-allow-policy.json'), {
      ...rbacPolicy(),
      defaultAuthorityPolicy: 'allow',
    })

    const wrong = await runRbacPolicyValidation(
      workspace,
      ['--policy', '.tmp/wrong-policy.json'],
      '.tmp/wrong-policy-validation.json',
    )
    const allow = await runRbacPolicyValidation(
      workspace,
      ['--policy', '.tmp/default-allow-policy.json'],
      '.tmp/default-allow-validation.json',
    )

    expect(wrong.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(wrong.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RBAC_POLICY_VALIDATION_POLICY_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/wrong-policy-validation.json'))).toBe(false)

    expect(allow.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(allow.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RBAC_POLICY_VALIDATION_DEFAULT_AUTHORITY_NOT_DENY',
    )
    expect(existsSync(join(workspace, '.tmp/default-allow-validation.json'))).toBe(false)
  })

  it('blocks unsafe unknown permissions, automation overgrant, and extension-author overgrant with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/unsafe-permission-policy.json'), {
      ...rbacPolicy(),
      permissionGrants: [{ role: 'reporter', permission: 'network.access.allow' }],
    })
    writeJson(join(workspace, '.tmp/automation-overgrant-policy.json'), {
      ...rbacPolicy(),
      actors: [{ actorId: 'ci.local', actorType: 'automation', identityProvider: 'ci-identity' }],
      roleAssignments: [{ actorId: 'ci.local', role: 'graph-update-operator' }],
    })
    writeJson(join(workspace, '.tmp/extension-overgrant-policy.json'), {
      ...rbacPolicy(),
      actors: [{ actorId: 'ext.local', actorType: 'extension-author', identityProvider: 'explicit-cli-input' }],
      roleAssignments: [{ actorId: 'ext.local', role: 'extension-author' }],
      permissionGrants: [{ role: 'extension-author', permission: 'extension.execution.approve' }],
    })

    const unsafePermission = await runRbacPolicyValidation(
      workspace,
      ['--policy', '.tmp/unsafe-permission-policy.json'],
      '.tmp/unsafe-permission-validation.json',
    )
    const automation = await runRbacPolicyValidation(
      workspace,
      ['--policy', '.tmp/automation-overgrant-policy.json'],
      '.tmp/automation-overgrant-validation.json',
    )
    const extension = await runRbacPolicyValidation(
      workspace,
      ['--policy', '.tmp/extension-overgrant-policy.json'],
      '.tmp/extension-overgrant-validation.json',
    )

    expect(unsafePermission.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafePermission.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RBAC_POLICY_VALIDATION_UNSAFE_UNKNOWN_PERMISSION',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe-permission-validation.json'))).toBe(false)

    expect(automation.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(automation.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RBAC_POLICY_VALIDATION_AUTOMATION_OVERGRANT',
    )
    expect(existsSync(join(workspace, '.tmp/automation-overgrant-validation.json'))).toBe(false)

    expect(extension.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(extension.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RBAC_POLICY_VALIDATION_EXTENSION_AUTHOR_OVERGRANT',
    )
    expect(existsSync(join(workspace, '.tmp/extension-overgrant-validation.json'))).toBe(false)
  })

  it('blocks key material and unsafe source authority claims with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/key-policy.json'), { ...rbacPolicy(), privateKey: 'not-a-real-key' })
    writeJson(join(workspace, '.tmp/rbac-policy.json'), rbacPolicy())
    writeJson(join(workspace, '.tmp/unsafe-rbac-readiness.json'), {
      ...rbacReadinessReport(),
      networkCallMade: true,
    })
    writeJson(join(workspace, '.tmp/unsafe-signing-readiness.json'), {
      ...signingReadinessReport(),
      rbacEnforced: true,
    })

    const key = await runRbacPolicyValidation(
      workspace,
      ['--policy', '.tmp/key-policy.json'],
      '.tmp/key-validation.json',
    )
    const unsafeRbac = await runRbacPolicyValidation(
      workspace,
      ['--policy', '.tmp/rbac-policy.json', '--rbac-readiness', '.tmp/unsafe-rbac-readiness.json'],
      '.tmp/unsafe-rbac-validation.json',
    )
    const unsafeSigning = await runRbacPolicyValidation(
      workspace,
      ['--policy', '.tmp/rbac-policy.json', '--signing-readiness', '.tmp/unsafe-signing-readiness.json'],
      '.tmp/unsafe-signing-validation.json',
    )

    expect(key.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(key.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RBAC_POLICY_VALIDATION_KEY_MATERIAL_UNSUPPORTED',
    )
    expect(existsSync(join(workspace, '.tmp/key-validation.json'))).toBe(false)

    expect(unsafeRbac.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafeRbac.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RBAC_POLICY_VALIDATION_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe-rbac-validation.json'))).toBe(false)

    expect(unsafeSigning.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafeSigning.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'RBAC_POLICY_VALIDATION_SIGNING_OR_RBAC_CLAIM_UNSUPPORTED',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe-signing-validation.json'))).toBe(false)
  })

  it('blocks output collisions, source overwrite, and protected output paths', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/rbac-policy.json'), rbacPolicy())
    const cases = [
      { output: '.tmp/rbac-policy.json', expected: 'would overwrite a source input' },
      {
        output: '.tmp/rbac-policy-validation.json',
        markdown: '.tmp/rbac-policy-validation.json',
        expected: 'must be different',
      },
      {
        output: join('.devview', 'generated', 'rbac-policy-validation.json'),
        expected: 'inside a protected control path',
      },
    ]

    for (const entry of cases) {
      const result = await runRbacPolicyValidation(
        workspace,
        ['--policy', '.tmp/rbac-policy.json'],
        entry.output,
        entry.markdown ? ['--markdown', entry.markdown] : [],
      )
      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(result.stderr).toContain(entry.expected)
    }
  })
})

function runRbacPolicyValidation(workspace: string, args: string[], output: string, extraArgs: string[] = []) {
  return runDevViewCli(['security', 'validate-rbac-policy', ...args, '--output', output, ...extraArgs, '--json'], {
    cwd: workspace,
    pluginRoot,
  })
}

function rbacPolicy(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-rbac-policy',
    status: 'devview-rbac-policy-configured',
    policyScope: 'rbac-role-assignment-policy-report-only',
    defaultAuthorityPolicy: 'deny',
    actors: [
      {
        actorId: 'operator.local',
        actorType: 'human',
        displayName: 'Local Operator',
        identityProvider: 'explicit-cli-input',
        authorityScope: ['local-reporting'],
      },
      {
        actorId: 'ci.local',
        actorType: 'automation',
        displayName: 'Local CI',
        identityProvider: 'ci-identity',
        authorityScope: ['report-only'],
      },
    ],
    roleAssignments: [
      { actorId: 'operator.local', role: 'reporter', scope: ['enterprise-readiness'] },
      { actorId: 'ci.local', role: 'reporter', scope: ['report-only'] },
    ],
    permissionGrants: [
      { role: 'reporter', permission: 'report.create', artifactRoles: ['devview-enterprise-readiness-report'] },
      { role: 'reporter', permission: 'enterprise.readiness.report' },
    ],
    automationRestrictions: {
      forbiddenPermissions: ['graph.apply.execute', 'benchmark.golden.review', 'user.acceptance.automate'],
    },
    forbiddenAutomationPermissions: ['graph.apply.execute', 'benchmark.golden.review', 'user.acceptance.automate'],
    extensionAuthorRestrictions: {
      forbiddenPermissions: ['extension.execution.approve', 'provider-network.policy.allow'],
    },
    ...safetyFlags(),
    ...overrides,
  }
}

function rbacReadinessReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-rbac-readiness-report',
    status: 'devview-rbac-readiness-reported',
    readinessScope: 'rbac-actor-identity-readiness-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    actorModelSummary: [{ actorType: 'operator' }, { actorType: 'auditor' }],
    rolePermissionMatrix: [{ role: 'auditor', permissions: ['audit.verify'] }],
    artifactPermissionMapping: [
      {
        artifactRole: 'devview-record-envelope-preview',
        requiredPermission: 'audit.verify',
        signatureRequiredBeforeEnterpriseReady: true,
      },
    ],
    rbacEnforced: false,
    signedRecordEnvelopePresent: false,
    cryptographicSigningImplemented: false,
    keyManagementImplemented: false,
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
    envelopePrerequisiteSummary: {
      previewCount: 0,
      verificationCount: 0,
      payloadDigestVerifiedCount: 0,
      sourceDigestVerifiedCount: 0,
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
      gaps: [],
    },
    signaturePolicyReadiness: {
      status: 'not-ready',
      detachedSignaturePolicyRequired: true,
      detachedSignaturePolicyPresent: false,
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
    futureSignedEnvelopeRequirements: ['detached signature fields'],
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

function expectSafetyFalse(payload: Record<string, unknown>): void {
  expect(payload.sourceFactsOnly).toBe(true)
  expect(payload.reportOnly).toBe(true)
  expect(payload.noEnforcementPerformed).toBe(true)
  expect(payload.rbacEnforced).toBe(false)
  expect(payload.permissionVerified).toBe(false)
  expect(payload.rbacPermissionVerified).toBe(false)
  expect(payload.cryptographicSignaturePresent).toBe(false)
  expect(payload.cryptographicSignatureVerified).toBe(false)
  expect(payload.cryptographicSigningImplemented).toBe(false)
  expect(payload.keyGenerated).toBe(false)
  expect(payload.privateKeyStored).toBe(false)
  expect(payload.keyManagementImplemented).toBe(false)
  expect(payload.keyRegistryCreated).toBe(false)
  expect(payload.trustRootCreated).toBe(false)
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
}
