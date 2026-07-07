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
    const cases = [
      { output: '.tmp/benchmark-governance.json', expected: 'would overwrite a source input' },
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

function safetyFlags(): Record<string, unknown> {
  return {
    benchmarkExecuted: false,
    candidateExecuted: false,
    graphifyExecuted: false,
    nativeBenchmarkExecuted: false,
    sourceFactsOnly: true,
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
