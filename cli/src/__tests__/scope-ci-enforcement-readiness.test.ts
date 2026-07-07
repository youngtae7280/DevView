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

describe('Scope/CI Enforcement readiness CLI', () => {
  it('writes blocked disabled readiness for blocked Equivalence Proof readiness without enforcement', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'equivalence-readiness.json'), validEquivalenceReadiness({ ready: false }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-scope-ci-enforcement-readiness',
        '--policy',
        'policy.json',
        '--equivalence-proof-readiness',
        'equivalence-readiness.json',
        '--output',
        '.tmp/scope-ci-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/scope-ci-readiness.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-scope-ci-enforcement-readiness-blocked')
    expect(payload.scopeCiEnforcementReadinessStatus).toBe('blocked-equivalence-proof-readiness-not-ready')
    expect(payload.equivalenceProofReadinessStatus).toBe('blocked-runtime-evidence-satisfaction-readiness-not-ready')
    expect(payload.runtimeEvidenceSatisfactionReadinessStatus).toBe('blocked-required-obligation-mismatch')
    expect(payload.sourceRuntimeEvidenceSatisfactionReadiness).toBe('runtime-satisfaction-readiness.json')
    expect(payload.sourceAcceptedEvidenceRecord).toBe('accepted-evidence.json')
    expect(payload.sourceEvidenceArtifact).toBe('source-evidence.json')
    expect(payload.sourceInstructionPack).toBe('instruction-pack.json')
    expect(payload.requiredEvidenceId).toBe('required-evidence-test-1')
    expect(payload.sourceAcceptedEvidenceAccepted).toBe(true)
    expectDisabled(payload)
    expect(written.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'SCOPE_CI_ENFORCEMENT_EQUIVALENCE_PROOF_READINESS_NOT_READY',
    )
  })

  it('keeps future ready-shaped Equivalence input blocked because enforcement is not implemented', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'equivalence-readiness.json'), validEquivalenceReadiness({ ready: true }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-scope-ci-enforcement-readiness',
        '--policy',
        'policy.json',
        '--equivalence-proof-readiness',
        'equivalence-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-scope-ci-enforcement-readiness-blocked')
    expect(payload.scopeCiEnforcementReadinessStatus).toBe('blocked-scope-ci-enforcement-command-not-implemented')
    expect(payload.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'SCOPE_CI_ENFORCEMENT_COMMAND_NOT_IMPLEMENTED',
    )
    expectDisabled(payload)
  })

  it('does not let legacy Evidence-acceptance-based Equivalence readiness grant Scope/CI readiness', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'equivalence-readiness.json'), validEquivalenceReadiness({ ready: true, legacy: true }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-scope-ci-enforcement-readiness',
        '--policy',
        'policy.json',
        '--equivalence-proof-readiness',
        'equivalence-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-scope-ci-enforcement-readiness-blocked')
    expect(payload.scopeCiEnforcementReadinessStatus).toBe(
      'blocked-equivalence-runtime-satisfaction-provenance-missing',
    )
    expect(payload.sourceRuntimeEvidenceSatisfactionReadiness).toBeNull()
    expect(payload.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'SCOPE_CI_ENFORCEMENT_EQUIVALENCE_RUNTIME_SATISFACTION_PROVENANCE_MISSING',
    )
    expectDisabled(payload)
  })

  it('fails unsafe Equivalence Proof readiness flags before writing output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'equivalence-readiness.json'), {
      ...validEquivalenceReadiness({ ready: true }),
      ciEnforcementEnabled: true,
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-scope-ci-enforcement-readiness',
        '--policy',
        'policy.json',
        '--equivalence-proof-readiness',
        'equivalence-readiness.json',
        '--output',
        '.tmp/scope-ci-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('ciEnforcementEnabled')
    expect(existsSync(join(workspace, '.tmp/scope-ci-readiness.json'))).toBe(false)
  })

  it('blocks unsafe optional authority fields on Equivalence Proof readiness', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'equivalence-readiness.json'), {
      ...validEquivalenceReadiness({ ready: false }),
      requiredChecksConfigured: true,
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-scope-ci-enforcement-readiness',
        '--policy',
        'policy.json',
        '--equivalence-proof-readiness',
        'equivalence-readiness.json',
        '--output',
        '.tmp/scope-ci-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('requiredChecksConfigured')
    expect(existsSync(join(workspace, '.tmp/scope-ci-readiness.json'))).toBe(false)
  })

  it('fails unsafe policy boundary fields', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), { ...validPolicy(), scopeEnforced: true })
    writeJson(join(workspace, 'equivalence-readiness.json'), validEquivalenceReadiness({ ready: true }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-scope-ci-enforcement-readiness',
        '--policy',
        'policy.json',
        '--equivalence-proof-readiness',
        'equivalence-readiness.json',
        '--output',
        '.tmp/scope-ci-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('scopeEnforced')
    expect(existsSync(join(workspace, '.tmp/scope-ci-readiness.json'))).toBe(false)
  })

  it('blocks unsafe markdown before JSON output is written', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'equivalence-readiness.json'), validEquivalenceReadiness({ ready: true }))
    const sourceBefore = readFileSync(join(workspace, 'equivalence-readiness.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-scope-ci-enforcement-readiness',
        '--policy',
        'policy.json',
        '--equivalence-proof-readiness',
        'equivalence-readiness.json',
        '--output',
        '.tmp/scope-ci-readiness.json',
        '--markdown',
        'equivalence-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('would overwrite the source Equivalence Proof readiness')
    expect(readFileSync(join(workspace, 'equivalence-readiness.json'), 'utf8')).toBe(sourceBefore)
    expect(existsSync(join(workspace, '.tmp/scope-ci-readiness.json'))).toBe(false)
  })

  it('blocks linked runtime-gated source overwrite before JSON output is written', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'accepted-evidence.json'), {
      artifactRole: 'devview-accepted-evidence-record',
      status: 'devview-accepted-evidence-recorded',
    })
    writeJson(join(workspace, 'equivalence-readiness.json'), validEquivalenceReadiness({ ready: false }))
    const sourceBefore = readFileSync(join(workspace, 'accepted-evidence.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-scope-ci-enforcement-readiness',
        '--policy',
        'policy.json',
        '--equivalence-proof-readiness',
        'equivalence-readiness.json',
        '--output',
        '.tmp/scope-ci-readiness.json',
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
    expect(existsSync(join(workspace, '.tmp/scope-ci-readiness.json'))).toBe(false)
  })
})

function expectDisabled(payload: Record<string, unknown>): void {
  expect(payload.scopeEnforcementAllowed).toBe(false)
  expect(payload.ciEnforcementAllowed).toBe(false)
  expect(payload.scopeEnforcementCommandImplemented).toBe(false)
  expect(payload.ciEnforcementCommandImplemented).toBe(false)
  expect(payload.scopeEnforced).toBe(false)
  expect(payload.ciEnforcementEnabled).toBe(false)
  expect(payload.requiredChecksConfigured).toBe(false)
  expect(payload.branchProtectionChanged).toBe(false)
  expect(payload.diffRejectionEnabled).toBe(false)
  expect(payload.strictModeEnabled).toBe(false)
  expect(payload.guidedEnforcementEnabled).toBe(false)
  expect(payload.equivalenceProven).toBe(false)
  expect(payload.evidenceAccepted).toBe(false)
  expect(payload.runtimeEvidenceSatisfied).toBe(false)
  expect(payload.graphDeltaApplied).toBe(false)
  expect(payload.graphSourceMutated).toBe(false)
  expect(payload.nonEnforcing).toBe(true)
}

function validPolicy(): Record<string, unknown> {
  return {
    artifactRole: 'devview-scope-ci-enforcement-policy-boundary-preview',
    status: 'devview-scope-ci-enforcement-policy-boundary-previewed',
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
  }
}

function validEquivalenceReadiness(input: { ready: boolean; legacy?: boolean }): Record<string, unknown> {
  const runtimeGatedFields = input.legacy
    ? {}
    : {
        sourceRuntimeEvidenceSatisfactionReadiness: 'runtime-satisfaction-readiness.json',
        sourceAcceptedEvidenceRecord: 'accepted-evidence.json',
        sourceEvidenceArtifact: 'source-evidence.json',
        sourceInstructionPack: 'instruction-pack.json',
        sourceContractInput: 'contract-input.json',
        sourceRuntimeEvidenceAuthority: 'runtime-evidence-authority.json',
        sourceEvidenceCheckBinding: 'evidence-check-binding.json',
        sourceOutputRequirement: 'output-requirement.json',
        sourceRuntimeReport: 'runtime-report.json',
        sourceScopeReport: 'scope-report.json',
        sourceGraphDeltaApplyReport: 'graph-delta-apply-report.json',
        sourceCheckReport: 'check-report.json',
        requiredEvidenceId: 'required-evidence-test-1',
        matchedRequiredEvidence: {
          id: 'required-evidence-test-1',
          evidenceType: 'runtime-report',
        },
        sourceAcceptedEvidenceAccepted: true,
        runtimeEvidenceSatisfactionReadinessStatus: input.ready
          ? 'ready-accepted-evidence-linked-to-runtime-obligation'
          : 'blocked-required-obligation-mismatch',
        nonEnforcing: true,
      }
  return {
    artifactRole: 'devview-equivalence-proof-readiness-preview',
    status: input.ready ? 'devview-equivalence-proof-readiness-ready' : 'devview-equivalence-proof-readiness-blocked',
    ...runtimeGatedFields,
    sourceEvidenceAcceptanceReadiness: 'evidence-readiness.json',
    sourceGraphSourceMutationReadiness: 'mutation-readiness.json',
    sourceApplyReadiness: 'apply-readiness.json',
    sourceApprovedProposalState: 'approved-state.json',
    sourceGraphDeltaProposal: 'proposal.json',
    proposalId: 'GDP-TEST',
    equivalenceProofReadinessStatus: input.ready
      ? input.legacy
        ? 'dry-run-ready-evidence-acceptance-readiness-present'
        : 'ready-for-future-equivalence-proof-command'
      : input.legacy
        ? 'blocked-evidence-acceptance-readiness-not-ready'
        : 'blocked-runtime-evidence-satisfaction-readiness-not-ready',
    evidenceAcceptanceReadinessStatus: input.ready
      ? 'dry-run-ready-mutation-readiness-present'
      : 'blocked-mutation-readiness-not-ready',
    mutationReadinessStatus: input.ready
      ? 'dry-run-ready-apply-readiness-present'
      : 'blocked-apply-readiness-not-ready',
    applyReadinessStatus: input.ready ? 'dry-run-ready-approved-state-present' : 'blocked-approved-state-not-created',
    equivalenceAllowed: false,
    equivalenceProven: false,
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    graphDeltaApplyEnabled: false,
    graphDeltaApplied: false,
    graphSourceMutationAllowed: false,
    graphSourceMutated: false,
    mutationAllowed: false,
    acceptanceAllowed: false,
    approvedProposalStateCreated: input.ready,
    humanDecisionRecorded: true,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}
