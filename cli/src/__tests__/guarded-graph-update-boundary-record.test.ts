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

describe('Guarded Graph Update Boundary Record CLI', () => {
  it('records future guarded update preconditions without applying graph deltas', async () => {
    const workspace = createWorkspace()
    writeBoundaryInputs(workspace)

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-guarded-graph-update-boundary',
        '--proposal',
        'graph-delta-proposal.json',
        '--runtime-evidence-satisfaction-record',
        'runtime-satisfaction-record.json',
        '--equivalence-proof-record',
        'equivalence-proof-record.json',
        '--scope-ci-enforcement-record',
        'scope-ci-enforcement-record.json',
        '--output',
        '.tmp/guarded-update-boundary-record.json',
        '--markdown',
        '.tmp/guarded-update-boundary-record.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/guarded-update-boundary-record.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-guarded-graph-update-boundary-record')
    expect(payload.status).toBe('devview-guarded-graph-update-boundary-ready')
    expect(payload.guardedUpdateReady).toBe(true)
    expect(payload.applyCommandEnabled).toBe(false)
    expect(payload.applyDeferred).toBe(true)
    expect(payload.operationSummary.operationCount).toBe(1)
    expect(payload.operationSummary.operationKinds).toEqual(['update-node'])
    expect(payload.chainComparisonStatus).toBe('matched-known-provenance-fields')
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(payload.providerInvoked).toBe(false)
    expect(payload.networkCallMade).toBe(false)
    expect(payload.hooksActivated).toBe(false)
    expect(payload.approvalAutomationEnabled).toBe(false)
    expect(payload.userAcceptanceAutomated).toBe(false)
    expect(payload.nonMutatingBoundary).toBe(true)
    expect(payload.sourceGraphDeltaProposal).toBe('graph-delta-proposal.json')
    expect(payload.sourceEvidenceHash).toBe(sourceHash)
    expect(written.graphDeltaApplied).toBe(false)
    expect(written.graphSourceMutated).toBe(false)
    expect(existsSync(join(workspace, '.tmp/guarded-update-boundary-record.md'))).toBe(true)
  })

  it('blocks readiness-only inputs where actual authority records are required', async () => {
    const workspace = createWorkspace()
    writeBoundaryInputs(workspace)
    writeJson(join(workspace, 'runtime-readiness.json'), {
      artifactRole: 'devview-runtime-evidence-satisfaction-readiness-preview',
      status: 'devview-runtime-evidence-satisfaction-readiness-ready',
      runtimeEvidenceSatisfied: false,
      graphSourceMutated: false,
      graphDeltaApplied: false,
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-guarded-graph-update-boundary',
        '--proposal',
        'graph-delta-proposal.json',
        '--runtime-evidence-satisfaction-record',
        'runtime-readiness.json',
        '--equivalence-proof-record',
        'equivalence-proof-record.json',
        '--scope-ci-enforcement-record',
        'scope-ci-enforcement-record.json',
        '--output',
        '.tmp/guarded-update-boundary-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain(
      'expected devview-runtime-evidence-satisfaction-record',
    )
    expect(existsSync(join(workspace, '.tmp/guarded-update-boundary-record.json'))).toBe(false)
  })

  it('blocks wrong-status actual records with zero writes', async () => {
    const workspace = createWorkspace()
    writeBoundaryInputs(workspace, {
      proof: { status: 'devview-equivalence-proof-blocked' },
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-guarded-graph-update-boundary',
        '--proposal',
        'graph-delta-proposal.json',
        '--runtime-evidence-satisfaction-record',
        'runtime-satisfaction-record.json',
        '--equivalence-proof-record',
        'equivalence-proof-record.json',
        '--scope-ci-enforcement-record',
        'scope-ci-enforcement-record.json',
        '--output',
        '.tmp/guarded-update-boundary-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('expected devview-equivalence-proof-record')
    expect(existsSync(join(workspace, '.tmp/guarded-update-boundary-record.json'))).toBe(false)
  })

  it('blocks source chain mismatches where fields are comparable', async () => {
    const workspace = createWorkspace()
    writeBoundaryInputs(workspace, {
      scope: { requiredEvidenceId: 'other-required-evidence' },
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-guarded-graph-update-boundary',
        '--proposal',
        'graph-delta-proposal.json',
        '--runtime-evidence-satisfaction-record',
        'runtime-satisfaction-record.json',
        '--equivalence-proof-record',
        'equivalence-proof-record.json',
        '--scope-ci-enforcement-record',
        'scope-ci-enforcement-record.json',
        '--output',
        '.tmp/guarded-update-boundary-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('requiredEvidenceId differs')
    expect(existsSync(join(workspace, '.tmp/guarded-update-boundary-record.json'))).toBe(false)
  })

  it('blocks unsafe true flags in the wrong source artifact role/status', async () => {
    const workspace = createWorkspace()
    writeBoundaryInputs(workspace, {
      proposal: { graphDeltaApplied: true },
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-guarded-graph-update-boundary',
        '--proposal',
        'graph-delta-proposal.json',
        '--runtime-evidence-satisfaction-record',
        'runtime-satisfaction-record.json',
        '--equivalence-proof-record',
        'equivalence-proof-record.json',
        '--scope-ci-enforcement-record',
        'scope-ci-enforcement-record.json',
        '--output',
        '.tmp/guarded-update-boundary-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('graphDeltaApplied')
    expect(existsSync(join(workspace, '.tmp/guarded-update-boundary-record.json'))).toBe(false)
  })

  it('blocks output guard violations with zero writes', async () => {
    const workspace = createWorkspace()
    writeBoundaryInputs(workspace)
    const runtimeBefore = readFileSync(join(workspace, 'runtime-satisfaction-record.json'), 'utf8')

    const sourceOverwrite = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-guarded-graph-update-boundary',
        '--proposal',
        'graph-delta-proposal.json',
        '--runtime-evidence-satisfaction-record',
        'runtime-satisfaction-record.json',
        '--equivalence-proof-record',
        'equivalence-proof-record.json',
        '--scope-ci-enforcement-record',
        'scope-ci-enforcement-record.json',
        '--output',
        '.tmp/guarded-update-boundary-record.json',
        '--markdown',
        'runtime-satisfaction-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(sourceOverwrite.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(sourceOverwrite.stderr).issues[0].message).toContain('would overwrite')
    expect(readFileSync(join(workspace, 'runtime-satisfaction-record.json'), 'utf8')).toBe(runtimeBefore)
    expect(existsSync(join(workspace, '.tmp/guarded-update-boundary-record.json'))).toBe(false)

    const markdownCollision = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-guarded-graph-update-boundary',
        '--proposal',
        'graph-delta-proposal.json',
        '--runtime-evidence-satisfaction-record',
        'runtime-satisfaction-record.json',
        '--equivalence-proof-record',
        'equivalence-proof-record.json',
        '--scope-ci-enforcement-record',
        'scope-ci-enforcement-record.json',
        '--output',
        '.tmp/guarded-update-boundary-record.json',
        '--markdown',
        '.tmp/guarded-update-boundary-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(markdownCollision.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(markdownCollision.stderr).issues[0].message).toContain('--output and --markdown must differ')
    expect(existsSync(join(workspace, '.tmp/guarded-update-boundary-record.json'))).toBe(false)
  })
})

function writeBoundaryInputs(
  workspace: string,
  overrides: {
    proposal?: Record<string, unknown>
    runtime?: Record<string, unknown>
    proof?: Record<string, unknown>
    scope?: Record<string, unknown>
  } = {},
): void {
  writeJson(join(workspace, 'graph-delta-proposal.json'), {
    ...validProposal(),
    ...overrides.proposal,
  })
  writeJson(join(workspace, 'runtime-satisfaction-record.json'), {
    ...validRuntimeSatisfactionRecord(),
    ...overrides.runtime,
  })
  writeJson(join(workspace, 'equivalence-proof-record.json'), {
    ...validEquivalenceProofRecord(),
    ...overrides.proof,
  })
  writeJson(join(workspace, 'scope-ci-enforcement-record.json'), {
    ...validScopeCiEnforcementRecord(),
    ...overrides.scope,
  })
}

function validProposal(): Record<string, unknown> {
  return {
    schemaId: 'devview-graph-update-proposal-v0',
    artifactRole: 'graph-delta-proposal-only-preview',
    status: 'generated-proposal-only-preview',
    proposalId: 'GDP-TEST',
    proposalOnly: true,
    approvalStatus: 'not-approved',
    nonEnforcing: true,
    enforcementStatus: 'not-enforced',
    requiredEvidenceId: 'required-evidence-tt-1',
    sourceEvidenceHash: sourceHash,
    sourceEvidenceArtifact: 'runtime-output.json',
    sourceInstructionPack: 'instruction-pack.json',
    sourceContractInput: 'contract-input.json',
    proposedOperations: [
      {
        operationId: 'op-1',
        operationKind: 'update-node',
        targetPath: 'nodes.todo.add.metadata',
        summary: 'Record updated DevView graph metadata for add-todo work.',
      },
    ],
    graphDeltaApplied: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    providerInvoked: false,
    networkCallMade: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
  }
}

function validRuntimeSatisfactionRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-runtime-evidence-satisfaction-record',
    status: 'devview-runtime-evidence-satisfaction-recorded',
    runtimeEvidenceSatisfactionState: 'runtime-evidence-satisfied-for-explicit-obligation',
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
    sourceAcceptedEvidenceAccepted: true,
    sourceEvidenceHash: sourceHash,
    sourceEvidenceHashAlgorithm: 'sha256',
    satisfactionProvenanceStatus: 'ready-binding-and-source-evidence-revalidated',
    runtimeEvidenceSatisfied: true,
    evidenceAccepted: false,
    equivalenceProven: false,
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

function validEquivalenceProofRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-equivalence-proof-record',
    status: 'devview-equivalence-proof-recorded',
    equivalenceProofKind: 'runtime-evidence-obligation-equivalence-v1',
    equivalenceProofState: 'equivalence-proven-for-explicit-runtime-evidence-obligation',
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
    sourceAcceptedEvidenceAccepted: true,
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

function validScopeCiEnforcementRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-scope-ci-enforcement-record',
    status: 'devview-scope-ci-enforcement-recorded',
    scopeCiEnforcementState: 'scope-ci-enforcement-recorded-no-external-ci-mutation',
    enforcementKind: 'deterministic-scope-ci-record-v1',
    enforcementActivationScope: 'devview-record-only-no-external-ci-mutation',
    sourceScopeCiEnforcementReadiness: 'scope-ci-readiness.json',
    sourceEquivalenceProofRecord: 'equivalence-proof-record.json',
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
    sourceEvidenceHash: sourceHash,
    sourceEvidenceHashAlgorithm: 'sha256',
    scopeCiEnforcementReadinessStatus: 'ready-for-future-scope-ci-enforcement-command',
    proofProvenanceStatus: 'runtime-satisfaction-record-and-policy-revalidated',
    chainComparisonStatus: 'matched-known-provenance-fields',
    chainComparisonLimitations: [],
    scopeEnforced: true,
    ciEnforcementEnabled: true,
    requiredChecksConfigured: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    hooksActivated: false,
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    providerInvoked: false,
    networkCallMade: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    shellCommandsExecuted: false,
    filesMutated: false,
    filesMutatedOutsideExplicitOutputs: false,
    nonEnforcing: false,
    externalSystemsMutated: false,
    recordOnlyExternalMutationBoundary: true,
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
