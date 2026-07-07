import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())
const sourceHash = 'b'.repeat(64)

afterEach(() => {
  cleanupWorkspaces()
})

describe('Scope/CI Enforcement Record CLI', () => {
  it('records Scope/CI enforcement lifecycle authority without external mutation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'scope-ci-readiness.json'), validReadyScopeCiReadiness())
    writeJson(join(workspace, 'equivalence-proof-record.json'), validEquivalenceProofRecord())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-scope-ci-enforcement',
        '--scope-ci-enforcement-readiness',
        'scope-ci-readiness.json',
        '--equivalence-proof-record',
        'equivalence-proof-record.json',
        '--output',
        '.tmp/scope-ci-enforcement-record.json',
        '--markdown',
        '.tmp/scope-ci-enforcement-record.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/scope-ci-enforcement-record.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-scope-ci-enforcement-record')
    expect(payload.status).toBe('devview-scope-ci-enforcement-recorded')
    expect(payload.scopeCiEnforcementState).toBe('scope-ci-enforcement-recorded-no-external-ci-mutation')
    expect(payload.scopeEnforced).toBe(true)
    expect(payload.ciEnforcementEnabled).toBe(true)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.requiredChecksConfigured).toBe(false)
    expect(payload.branchProtectionMutated).toBe(false)
    expect(payload.requiredChecksMutated).toBe(false)
    expect(payload.externalCiMutated).toBe(false)
    expect(payload.diffRejectionActivated).toBe(false)
    expect(payload.hooksActivated).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.providerInvoked).toBe(false)
    expect(payload.networkCallMade).toBe(false)
    expect(payload.extensionExecutionAllowed).toBe(false)
    expect(payload.shellCommandsExecuted).toBe(false)
    expect(payload.filesMutated).toBe(false)
    expect(payload.externalSystemsMutated).toBe(false)
    expect(payload.recordOnlyExternalMutationBoundary).toBe(true)
    expect(payload.chainComparisonStatus).toBe('matched-known-provenance-fields')
    expect(payload.sourceEquivalenceProofRecord).toBe('equivalence-proof-record.json')
    expect(payload.sourceEvidenceHash).toBe(sourceHash)
    expect(written.scopeEnforced).toBe(true)
    expect(written.ciEnforcementEnabled).toBe(true)
    expect(existsSync(join(workspace, '.tmp/scope-ci-enforcement-record.md'))).toBe(true)
  })

  it('blocks readiness-only Equivalence input because an actual proof record is required', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'scope-ci-readiness.json'), validReadyScopeCiReadiness())
    writeJson(join(workspace, 'equivalence-readiness.json'), {
      artifactRole: 'devview-equivalence-proof-readiness-preview',
      status: 'devview-equivalence-proof-readiness-ready',
      equivalenceProven: false,
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-scope-ci-enforcement',
        '--scope-ci-enforcement-readiness',
        'scope-ci-readiness.json',
        '--equivalence-proof-record',
        'equivalence-readiness.json',
        '--output',
        '.tmp/scope-ci-enforcement-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('expected devview-equivalence-proof-record')
    expect(existsSync(join(workspace, '.tmp/scope-ci-enforcement-record.json'))).toBe(false)
  })

  it('blocks blocked Scope/CI readiness with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(
      join(workspace, 'scope-ci-readiness.json'),
      validReadyScopeCiReadiness({
        status: 'devview-scope-ci-enforcement-readiness-blocked',
        scopeCiEnforcementReadinessStatus: 'blocked-equivalence-proof-readiness-not-ready',
      }),
    )
    writeJson(join(workspace, 'equivalence-proof-record.json'), validEquivalenceProofRecord())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-scope-ci-enforcement',
        '--scope-ci-enforcement-readiness',
        'scope-ci-readiness.json',
        '--equivalence-proof-record',
        'equivalence-proof-record.json',
        '--output',
        '.tmp/scope-ci-enforcement-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain(
      'expected devview-scope-ci-enforcement-readiness-preview',
    )
    expect(existsSync(join(workspace, '.tmp/scope-ci-enforcement-record.json'))).toBe(false)
  })

  it('blocks mismatched proof/source chain fields with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(
      join(workspace, 'scope-ci-readiness.json'),
      validReadyScopeCiReadiness({ requiredEvidenceId: 'other-id' }),
    )
    writeJson(join(workspace, 'equivalence-proof-record.json'), validEquivalenceProofRecord())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-scope-ci-enforcement',
        '--scope-ci-enforcement-readiness',
        'scope-ci-readiness.json',
        '--equivalence-proof-record',
        'equivalence-proof-record.json',
        '--output',
        '.tmp/scope-ci-enforcement-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('requiredEvidenceId differs')
    expect(existsSync(join(workspace, '.tmp/scope-ci-enforcement-record.json'))).toBe(false)
  })

  it('blocks unsafe authority flags on source inputs before record output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'scope-ci-readiness.json'), validReadyScopeCiReadiness())
    writeJson(join(workspace, 'equivalence-proof-record.json'), validEquivalenceProofRecord({ scopeEnforced: true }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-scope-ci-enforcement',
        '--scope-ci-enforcement-readiness',
        'scope-ci-readiness.json',
        '--equivalence-proof-record',
        'equivalence-proof-record.json',
        '--output',
        '.tmp/scope-ci-enforcement-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('scopeEnforced')
    expect(existsSync(join(workspace, '.tmp/scope-ci-enforcement-record.json'))).toBe(false)
  })

  it('blocks output guard violations with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'scope-ci-readiness.json'), validReadyScopeCiReadiness())
    writeJson(join(workspace, 'equivalence-proof-record.json'), validEquivalenceProofRecord())
    const readinessBefore = readFileSync(join(workspace, 'scope-ci-readiness.json'), 'utf8')

    const sourceOverwrite = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-scope-ci-enforcement',
        '--scope-ci-enforcement-readiness',
        'scope-ci-readiness.json',
        '--equivalence-proof-record',
        'equivalence-proof-record.json',
        '--output',
        '.tmp/scope-ci-enforcement-record.json',
        '--markdown',
        'scope-ci-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(sourceOverwrite.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(sourceOverwrite.stderr).issues[0].message).toContain('would overwrite')
    expect(readFileSync(join(workspace, 'scope-ci-readiness.json'), 'utf8')).toBe(readinessBefore)
    expect(existsSync(join(workspace, '.tmp/scope-ci-enforcement-record.json'))).toBe(false)

    const markdownCollision = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-scope-ci-enforcement',
        '--scope-ci-enforcement-readiness',
        'scope-ci-readiness.json',
        '--equivalence-proof-record',
        'equivalence-proof-record.json',
        '--output',
        '.tmp/scope-ci-enforcement-record.json',
        '--markdown',
        '.tmp/scope-ci-enforcement-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(markdownCollision.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(markdownCollision.stderr).issues[0].message).toContain('--output and --markdown must differ')
    expect(existsSync(join(workspace, '.tmp/scope-ci-enforcement-record.json'))).toBe(false)
  })
})

function validReadyScopeCiReadiness(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-scope-ci-enforcement-readiness-preview',
    status: 'devview-scope-ci-enforcement-readiness-ready',
    readinessScope: 'scope-ci-enforcement-readiness-preview-disabled-no-enforcement',
    sourcePolicyBoundary: 'scope-ci-policy.json',
    sourceEquivalenceProofReadiness: 'equivalence-readiness.json',
    sourceRuntimeEvidenceSatisfactionReadiness: 'runtime-satisfaction-readiness.json',
    sourceAcceptedEvidenceRecord: 'accepted-evidence.json',
    sourceEvidenceArtifact: 'runtime-output.json',
    sourceInstructionPack: 'instruction-pack.json',
    sourceContractInput: 'contract-input.json',
    sourceRuntimeEvidenceAuthority: 'runtime-authority.json',
    sourceEvidenceCheckBinding: 'evidence-check-binding.json',
    sourceOutputRequirement: 'output-requirement.json',
    sourceRuntimeReport: 'runtime-report.json',
    sourceScopeReport: 'scope-report.json',
    sourceGraphDeltaApplyReport: 'graph-delta-apply-report.json',
    sourceCheckReport: 'check-report.json',
    requiredEvidenceId: 'required-evidence-tt-1',
    matchedRequiredEvidence: matchedRequiredEvidence(),
    sourceEvidenceHash: sourceHash,
    sourceAcceptedEvidenceAccepted: true,
    runtimeEvidenceSatisfactionReadinessStatus: 'ready-accepted-evidence-linked-to-runtime-obligation',
    equivalenceProofReadinessStatus: 'ready-for-future-equivalence-proof-command',
    scopeCiEnforcementReadinessStatus: 'ready-for-future-scope-ci-enforcement-command',
    scopeEnforcementAllowed: false,
    ciEnforcementAllowed: false,
    scopeEnforcementCommandImplemented: false,
    ciEnforcementCommandImplemented: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    requiredChecksConfigured: false,
    branchProtectionChanged: false,
    diffRejectionEnabled: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    providerInvoked: false,
    networkCallMade: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    shellCommandsExecuted: false,
    nonEnforcing: true,
    ...overrides,
  }
}

function validEquivalenceProofRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-equivalence-proof-record',
    status: 'devview-equivalence-proof-recorded',
    equivalenceProofState: 'equivalence-proven-for-explicit-runtime-evidence-obligation',
    equivalenceProofKind: 'runtime-evidence-obligation-equivalence-v1',
    sourceRuntimeEvidenceSatisfactionRecord: 'runtime-satisfaction-record.json',
    sourceRuntimeEvidenceSatisfactionReadiness: 'runtime-satisfaction-readiness.json',
    sourceAcceptedEvidenceRecord: 'accepted-evidence.json',
    sourceInstructionPack: 'instruction-pack.json',
    sourceContractInput: 'contract-input.json',
    sourceEvidenceArtifact: 'runtime-output.json',
    sourceRuntimeEvidenceAuthority: 'runtime-authority.json',
    sourceEvidenceCheckBinding: 'evidence-check-binding.json',
    sourceOutputRequirement: 'output-requirement.json',
    sourceRuntimeReport: 'runtime-report.json',
    sourceScopeReport: 'scope-report.json',
    sourceGraphDeltaApplyReport: 'graph-delta-apply-report.json',
    sourceCheckReport: 'check-report.json',
    requiredEvidenceId: 'required-evidence-tt-1',
    matchedRequiredEvidence: matchedRequiredEvidence(),
    acceptedEvidenceClaim:
      'Accepted evidence explicitly covers required-evidence-tt-1, evidence-tt-1, and runtime-output.json.',
    acceptedEvidenceKind: 'selected_check_context-candidate',
    sourceRuntimeEvidenceSatisfied: true,
    sourceEvidenceHash: sourceHash,
    sourceEvidenceHashAlgorithm: 'sha256',
    proofProvenanceStatus: 'runtime-satisfaction-record-and-policy-revalidated',
    equivalenceProven: true,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    providerInvoked: false,
    networkCallMade: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    shellCommandsExecuted: false,
    nonEnforcing: true,
    ...overrides,
  }
}

function matchedRequiredEvidence(): Record<string, unknown> {
  return {
    id: 'required-evidence-tt-1',
    sourceEvidenceId: 'evidence-tt-1',
    evidenceType: 'selected_check_context',
    artifact: 'runtime-output.json',
    sourceStatus: 'derived-from-selected-graph-slice',
    runtimeEvidenceSatisfied: false,
    acceptedEvidence: false,
  }
}
