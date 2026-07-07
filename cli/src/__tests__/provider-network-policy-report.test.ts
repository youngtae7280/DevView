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

describe('security report-provider-network-policy CLI', () => {
  it('emits a canonical default-deny report without policy input', async () => {
    const workspace = createWorkspace()

    const result = await runDevViewCli(
      [
        'security',
        'report-provider-network-policy',
        '--output',
        '.tmp/provider-network-policy-report.json',
        '--markdown',
        '.tmp/provider-network-policy-report.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/provider-network-policy-report.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-provider-network-default-deny-policy-report')
    expect(payload.status).toBe('devview-provider-network-default-deny-policy-recorded')
    expect(payload.defaultProviderPolicy).toBe('deny')
    expect(payload.defaultNetworkPolicy).toBe('deny')
    expect(payload.providerAllowlist).toEqual([])
    expect(payload.networkAllowlist).toEqual([])
    expect(payload.explicitAllowSupported).toBe(false)
    expect(payload.providerNetworkReadiness.policyInputMode).toBe('canonical-default')
    expect(written.writtenMarkdownPath).toBe('.tmp/provider-network-policy-report.md')
    expect(existsSync(join(workspace, '.tmp/provider-network-policy-report.md'))).toBe(true)
    expectSafetyFalse(payload)
  })

  it('accepts strict default-deny policy input and links enterprise readiness source facts', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provider-network-policy.json'), defaultDenyPolicy())
    writeJson(join(workspace, '.tmp/enterprise-readiness.json'), enterpriseReadinessReport())

    const result = await runDevViewCli(
      [
        'security',
        'report-provider-network-policy',
        '--policy',
        '.tmp/provider-network-policy.json',
        '--enterprise-readiness',
        '.tmp/enterprise-readiness.json',
        '--output',
        '.tmp/provider-network-policy-report.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.sourcePolicy.supplied).toBe(true)
    expect(payload.sourcePolicy.status).toBe('devview-provider-network-policy-configured')
    expect(payload.sourceEnterpriseReadiness.supplied).toBe(true)
    expect(payload.sourceEnterpriseReadiness.readinessLevel).toBe('not-ready')
    expect(payload.providerNetworkReadiness.policyInputMode).toBe('validated-policy-input')
    expect(payload.providerNetworkReadiness.enterpriseReadinessLinked).toBe(true)
    expect(payload.policyFindings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'PROVIDER_NETWORK_POLICY_INPUT_VALIDATED',
        'PROVIDER_NETWORK_POLICY_ENTERPRISE_SOURCE_LINKED',
      ]),
    )
    expectSafetyFalse(payload)
  })

  it('blocks default-allow policy, non-empty allowlists, and provider/network true flags with zero writes', async () => {
    const workspace = createWorkspace()
    const unsafeFlag = 'networkCallMade'
    writeJson(join(workspace, '.tmp/default-allow-policy.json'), {
      ...defaultDenyPolicy(),
      defaultProviderPolicy: 'allow',
    })
    writeJson(join(workspace, '.tmp/allowlist-policy.json'), {
      ...defaultDenyPolicy(),
      providerAllowlist: ['future-provider'],
    })
    writeJson(join(workspace, '.tmp/unsafe-policy.json'), {
      ...defaultDenyPolicy(),
      [unsafeFlag]: true,
    })

    const defaultAllow = await runPolicyReport(workspace, '.tmp/default-allow-policy.json', '.tmp/default-allow.json')
    const allowlist = await runPolicyReport(workspace, '.tmp/allowlist-policy.json', '.tmp/allowlist.json')
    const unsafe = await runPolicyReport(workspace, '.tmp/unsafe-policy.json', '.tmp/unsafe.json')

    expect(defaultAllow.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(defaultAllow.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PROVIDER_NETWORK_POLICY_DEFAULT_PROVIDER_NOT_DENY',
    )
    expect(existsSync(join(workspace, '.tmp/default-allow.json'))).toBe(false)

    expect(allowlist.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(allowlist.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PROVIDER_NETWORK_POLICY_ALLOWLIST_UNSUPPORTED',
    )
    expect(existsSync(join(workspace, '.tmp/allowlist.json'))).toBe(false)

    expect(unsafe.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unsafe.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PROVIDER_NETWORK_POLICY_UNSAFE_SOURCE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe.json'))).toBe(false)
  })

  it('blocks wrong enterprise readiness role/status with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/bad-enterprise-readiness.json'), {
      ...enterpriseReadinessReport(),
      status: 'wrong',
    })

    const result = await runDevViewCli(
      [
        'security',
        'report-provider-network-policy',
        '--enterprise-readiness',
        '.tmp/bad-enterprise-readiness.json',
        '--output',
        '.tmp/provider-network-policy-report.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PROVIDER_NETWORK_POLICY_ENTERPRISE_SOURCE_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp/provider-network-policy-report.json'))).toBe(false)
  })

  it('blocks output collisions, source overwrite, and protected output paths', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.tmp/provider-network-policy.json'), defaultDenyPolicy())
    const cases = [
      { output: '.tmp/provider-network-policy.json', expected: 'would overwrite a source input' },
      { output: '.tmp/provider-network.json', markdown: '.tmp/provider-network.json', expected: 'must be different' },
      { output: join('.devview', 'generated', 'provider-network.json'), expected: 'inside a protected control path' },
    ]

    for (const entry of cases) {
      const result = await runDevViewCli(
        [
          'security',
          'report-provider-network-policy',
          '--policy',
          '.tmp/provider-network-policy.json',
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

function runPolicyReport(workspace: string, policy: string, output: string) {
  return runDevViewCli(
    ['security', 'report-provider-network-policy', '--policy', policy, '--output', output, '--json'],
    { cwd: workspace, pluginRoot },
  )
}

function defaultDenyPolicy(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-provider-network-policy',
    status: 'devview-provider-network-policy-configured',
    defaultProviderPolicy: 'deny',
    defaultNetworkPolicy: 'deny',
    providerAllowlist: [],
    networkAllowlist: [],
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    graphifyExecuted: false,
    ...overrides,
  }
}

function enterpriseReadinessReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-enterprise-readiness-report',
    status: 'devview-enterprise-readiness-report-generated',
    readinessLevel: 'not-ready',
    sourceFactsOnly: true,
    reportOnly: true,
    enterpriseGateActivated: false,
    providerInvoked: false,
    networkCallMade: false,
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
