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

describe('Equivalence Proof readiness CLI', () => {
  it('writes blocked equivalence proof readiness for blocked Runtime Evidence satisfaction readiness without proof', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'runtime-readiness.json'), validRuntimeEvidenceSatisfactionReadiness({ ready: false }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-equivalence-proof-readiness',
        '--policy',
        'policy.json',
        '--runtime-evidence-satisfaction-readiness',
        'runtime-readiness.json',
        '--output',
        '.tmp/equivalence-proof-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/equivalence-proof-readiness.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-equivalence-proof-readiness-blocked')
    expect(payload.equivalenceProofReadinessStatus).toBe('blocked-runtime-evidence-satisfaction-readiness-not-ready')
    expect(payload.runtimeEvidenceSatisfactionReadinessStatus).toBe('blocked-required-obligation-mismatch')
    expect(payload.sourceRuntimeEvidenceSatisfactionReadiness).toBe('runtime-readiness.json')
    expect(payload.sourceAcceptedEvidenceRecord).toBe('accepted-evidence.json')
    expect(payload.sourceAcceptedEvidenceAccepted).toBe(true)
    expectNoAuthority(payload)
    expect(written.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'EQUIVALENCE_PROOF_RUNTIME_SATISFACTION_READINESS_NOT_READY',
    )
  })

  it('keeps equivalence blocked for ready Runtime Evidence satisfaction readiness until an actual satisfaction record exists', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'runtime-readiness.json'), validRuntimeEvidenceSatisfactionReadiness({ ready: true }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-equivalence-proof-readiness',
        '--policy',
        'policy.json',
        '--runtime-evidence-satisfaction-readiness',
        'runtime-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-equivalence-proof-readiness-blocked')
    expect(payload.equivalenceProofReadinessStatus).toBe('blocked-runtime-evidence-satisfaction-record-missing')
    expect(payload.runtimeEvidenceSatisfactionReadinessStatus).toBe(
      'ready-accepted-evidence-linked-to-runtime-obligation',
    )
    expectNoAuthority(payload)
  })

  it('does not allow legacy Evidence acceptance readiness alone to grant equivalence readiness', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'evidence-acceptance-readiness.json'), validEvidenceAcceptanceReadiness({ ready: true }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-equivalence-proof-readiness',
        '--policy',
        'policy.json',
        '--evidence-acceptance-readiness',
        'evidence-acceptance-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.InvalidArguments)
    expect(payload.issues[0].message).toContain('--runtime-evidence-satisfaction-readiness')
  })

  it('carries optional Evidence acceptance readiness as provenance only', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'runtime-readiness.json'), validRuntimeEvidenceSatisfactionReadiness({ ready: false }))
    writeJson(join(workspace, 'evidence-acceptance-readiness.json'), validEvidenceAcceptanceReadiness({ ready: true }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-equivalence-proof-readiness',
        '--policy',
        'policy.json',
        '--runtime-evidence-satisfaction-readiness',
        'runtime-readiness.json',
        '--evidence-acceptance-readiness',
        'evidence-acceptance-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-equivalence-proof-readiness-blocked')
    expect(payload.sourceEvidenceAcceptanceReadiness).toBe('evidence-acceptance-readiness.json')
    expect(payload.evidenceAcceptanceReadinessStatus).toBe('dry-run-ready-mutation-readiness-present')
    expect(payload.equivalenceProofReadinessStatus).toBe('blocked-runtime-evidence-satisfaction-readiness-not-ready')
    expectNoAuthority(payload)
  })

  it('fails wrong Runtime Evidence satisfaction readiness role before writing output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'runtime-readiness.json'), {
      ...validRuntimeEvidenceSatisfactionReadiness({ ready: false }),
      artifactRole: 'devview-accepted-evidence-record',
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-equivalence-proof-readiness',
        '--policy',
        'policy.json',
        '--runtime-evidence-satisfaction-readiness',
        'runtime-readiness.json',
        '--output',
        '.tmp/equivalence-proof-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('artifactRole')
    expect(existsSync(join(workspace, '.tmp/equivalence-proof-readiness.json'))).toBe(false)
  })

  it('fails unsafe Runtime Evidence satisfaction readiness flags before writing output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'runtime-readiness.json'), {
      ...validRuntimeEvidenceSatisfactionReadiness({ ready: true }),
      runtimeEvidenceSatisfied: unsafeTrue(),
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-equivalence-proof-readiness',
        '--policy',
        'policy.json',
        '--runtime-evidence-satisfaction-readiness',
        'runtime-readiness.json',
        '--output',
        '.tmp/equivalence-proof-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('runtimeEvidenceSatisfied')
    expect(existsSync(join(workspace, '.tmp/equivalence-proof-readiness.json'))).toBe(false)
  })

  it('fails unsafe optional Evidence acceptance readiness flags before writing output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'runtime-readiness.json'), validRuntimeEvidenceSatisfactionReadiness({ ready: false }))
    writeJson(join(workspace, 'evidence-acceptance-readiness.json'), {
      ...validEvidenceAcceptanceReadiness({ ready: true }),
      equivalenceProven: unsafeTrue(),
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-equivalence-proof-readiness',
        '--policy',
        'policy.json',
        '--runtime-evidence-satisfaction-readiness',
        'runtime-readiness.json',
        '--evidence-acceptance-readiness',
        'evidence-acceptance-readiness.json',
        '--output',
        '.tmp/equivalence-proof-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('equivalenceProven')
    expect(existsSync(join(workspace, '.tmp/equivalence-proof-readiness.json'))).toBe(false)
  })

  it('fails unsafe policy boundary fields', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), { ...validPolicy(), equivalenceProven: unsafeTrue() })
    writeJson(join(workspace, 'runtime-readiness.json'), validRuntimeEvidenceSatisfactionReadiness({ ready: true }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-equivalence-proof-readiness',
        '--policy',
        'policy.json',
        '--runtime-evidence-satisfaction-readiness',
        'runtime-readiness.json',
        '--output',
        '.tmp/equivalence-proof-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('equivalenceProven')
    expect(existsSync(join(workspace, '.tmp/equivalence-proof-readiness.json'))).toBe(false)
  })

  it('blocks unsafe linked source overwrite before JSON output is written', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'runtime-readiness.json'), validRuntimeEvidenceSatisfactionReadiness({ ready: true }))
    writeJson(join(workspace, 'accepted-evidence.json'), {
      artifactRole: 'devview-accepted-evidence-record',
      status: 'devview-accepted-evidence-recorded',
    })
    const sourceBefore = readFileSync(join(workspace, 'accepted-evidence.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-equivalence-proof-readiness',
        '--policy',
        'policy.json',
        '--runtime-evidence-satisfaction-readiness',
        'runtime-readiness.json',
        '--output',
        '.tmp/equivalence-proof-readiness.json',
        '--markdown',
        'accepted-evidence.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('would overwrite the source Accepted Evidence record')
    expect(readFileSync(join(workspace, 'accepted-evidence.json'), 'utf8')).toBe(sourceBefore)
    expect(existsSync(join(workspace, '.tmp/equivalence-proof-readiness.json'))).toBe(false)
  })
})

function expectNoAuthority(payload: Record<string, unknown>): void {
  expect(payload.equivalenceAllowed).toBe(false)
  expect(payload.equivalenceProofCommandImplemented).toBe(false)
  expect(payload.equivalenceProven).toBe(false)
  expect(payload.evidenceAccepted).toBe(false)
  expect(payload.runtimeEvidenceSatisfied).toBe(false)
  expect(payload.graphDeltaApplyEnabled).toBe(false)
  expect(payload.graphDeltaApplied).toBe(false)
  expect(payload.graphSourceMutationAllowed).toBe(false)
  expect(payload.graphSourceMutated).toBe(false)
  expect(payload.scopeEnforced).toBe(false)
  expect(payload.ciEnforcementEnabled).toBe(false)
  expect(payload.approvalAutomationEnabled).toBe(false)
  expect(payload.userAcceptanceAutomated).toBe(false)
  expect(payload.nonEnforcing).toBe(true)
}

function unsafeTrue(): boolean {
  return JSON.parse('true') as boolean
}

function validPolicy(): Record<string, unknown> {
  return {
    artifactRole: 'devview-equivalence-proof-policy-boundary-preview',
    status: 'devview-equivalence-proof-policy-boundary-previewed',
    equivalenceProven: false,
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function validRuntimeEvidenceSatisfactionReadiness(input: { ready: boolean }): Record<string, unknown> {
  return {
    artifactRole: 'devview-runtime-evidence-satisfaction-readiness-preview',
    status: input.ready
      ? 'devview-runtime-evidence-satisfaction-readiness-ready'
      : 'devview-runtime-evidence-satisfaction-readiness-blocked',
    readinessScope: 'runtime-evidence-satisfaction-binding-readiness-preview-no-satisfaction',
    sourceAcceptedEvidenceRecord: 'accepted-evidence.json',
    sourceInstructionPack: 'instruction-pack.json',
    sourceContractInput: 'contract-input.json',
    sourceEvidenceArtifact: 'source-evidence.json',
    sourceRuntimeEvidenceAuthority: 'runtime-authority.json',
    sourceEvidenceCheckBinding: 'evidence-check-binding.json',
    sourceOutputRequirement: 'output-requirement.json',
    sourceRuntimeReport: 'runtime-report.json',
    sourceScopeReport: 'scope-report.json',
    sourceGraphDeltaApplyReport: 'apply-report.json',
    sourceCheckReport: 'check-report.json',
    requiredEvidenceId: 'required-evidence-1',
    matchedRequiredEvidence: {
      id: 'required-evidence-1',
      sourceEvidenceId: 'source-evidence-1',
      evidenceType: 'runtime-report',
      artifact: 'source-evidence.json',
      runtimeEvidenceSatisfied: false,
      acceptedEvidence: false,
    },
    sourceAcceptedEvidenceAccepted: true,
    runtimeEvidenceSatisfactionReadinessStatus: input.ready
      ? 'ready-accepted-evidence-linked-to-runtime-obligation'
      : 'blocked-required-obligation-mismatch',
    runtimeEvidenceSatisfactionAllowed: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    nonEnforcing: true,
  }
}

function validEvidenceAcceptanceReadiness(input: { ready: boolean }): Record<string, unknown> {
  return {
    artifactRole: 'devview-evidence-acceptance-readiness-preview',
    status: input.ready
      ? 'devview-evidence-acceptance-readiness-ready'
      : 'devview-evidence-acceptance-readiness-blocked',
    sourceGraphSourceMutationReadiness: 'mutation-readiness.json',
    sourceApplyReadiness: 'apply-readiness.json',
    sourceApprovedProposalState: 'approved-state.json',
    sourceGraphDeltaProposal: 'proposal.json',
    proposalId: 'GDP-TEST',
    evidenceAcceptanceReadinessStatus: input.ready
      ? 'dry-run-ready-mutation-readiness-present'
      : 'blocked-mutation-readiness-not-ready',
    mutationReadinessStatus: input.ready
      ? 'dry-run-ready-apply-readiness-present'
      : 'blocked-apply-readiness-not-ready',
    applyReadinessStatus: input.ready ? 'dry-run-ready-approved-state-present' : 'blocked-approved-state-not-created',
    acceptanceAllowed: false,
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    graphDeltaApplyEnabled: false,
    graphDeltaApplied: false,
    graphSourceMutationAllowed: false,
    graphSourceMutated: false,
    mutationAllowed: false,
    approvedProposalStateCreated: input.ready,
    humanDecisionRecorded: true,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}
