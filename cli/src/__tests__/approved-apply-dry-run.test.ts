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

describe('Approved Apply Dry Run CLI', () => {
  it('writes a ready report for a hardened human approval without apply or mutation', async () => {
    const workspace = workspaceWithReadyInputs()

    const result = await runDryRun(workspace)
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/dry-run.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-approved-apply-dry-run-report')
    expect(payload.status).toBe('devview-approved-apply-dry-run-ready')
    expect(payload.dryRunReadinessStatus).toBe('dry-run-ready-for-future-apply-command')
    expect(payload.approvedProposalStateCreatedPreview).toBe(true)
    expect(payload.graphDeltaApplyEnabled).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.graphSourceMutationAllowed).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.mutationAllowed).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(payload.approvalAutomationEnabled).toBe(false)
    expect(payload.codexSelfApprovalAllowed).toBe(false)
    expect(written.markdownReportPath).toBe('.tmp/dry-run.md')
  })

  it('blocks defer, reject, and request-changes decisions before ready status', async () => {
    for (const [decisionValue, decisionKind] of [
      ['defer-decision', 'defer'],
      ['reject-proposal', 'reject'],
      ['request-changes', 'request-changes'],
    ]) {
      const workspace = workspaceWithReadyInputs({
        decision: validDecisionRecord({ decisionValue, decisionKind }),
      })

      const result = await runDryRun(workspace)
      const payload = JSON.parse(result.stderr)
      const written = JSON.parse(readFileSync(join(workspace, '.tmp/dry-run.json'), 'utf8'))

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(payload.dryRunReadinessStatus).toBe('blocked-decision-not-approve')
      expect(written.status).toBe('devview-approved-apply-dry-run-blocked')
      expect(written.approvedProposalStateCreatedPreview).toBe(false)
      expect(written.graphDeltaApplied).toBe(false)
      expect(written.graphSourceMutated).toBe(false)
    }
  })

  it('blocks legacy approval-looking decisions as unhardened', async () => {
    const workspace = workspaceWithReadyInputs({ decision: legacyApprovalLookingDecisionRecord() })

    const result = await runDryRun(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.dryRunReadinessStatus).toBe('blocked-unhardened-decision')
    expect(payload.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'APPROVED_APPLY_DECISION_NOT_HARDENED',
    )
  })

  it('blocks proposal provenance mismatch', async () => {
    const workspace = workspaceWithReadyInputs({ proposal: { ...validProposal(), proposalId: 'GDP-OTHER' } })

    const result = await runDryRun(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.dryRunReadinessStatus).toBe('blocked-proposal-mismatch')
    expect(payload.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'APPROVED_APPLY_PROPOSAL_ID_MISMATCH',
    )
  })

  it('writes a blocked report when mutation policy is missing', async () => {
    const workspace = workspaceWithReadyInputs()

    const result = await runDryRun(workspace, { includeMutationPolicy: false })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.dryRunReadinessStatus).toBe('blocked-mutation-policy-missing')
    expect(payload.mutationPolicyStatus).toBe('mutation-policy-missing')
    expect(existsSync(join(workspace, '.tmp/dry-run.json'))).toBe(true)
  })

  it('blocks invalid or unsafe mutation policy flags without creating ready status', async () => {
    const workspace = workspaceWithReadyInputs({
      mutationPolicy: { ...validMutationPolicy(), graphSourceMutated: true },
    })

    const result = await runDryRun(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.dryRunReadinessStatus).toBe('blocked-mutation-policy-invalid')
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.mutationAllowed).toBe(false)
  })

  it('blocks proposals that are already applied or mutated', async () => {
    const workspace = workspaceWithReadyInputs({
      proposal: {
        ...validProposal(),
        boundaries: {
          ...validProposal().boundaries,
          graphDeltaApplied: true,
        },
      },
    })

    const result = await runDryRun(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.dryRunReadinessStatus).toBe('blocked-already-applied-or-mutated')
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
  })

  it('blocks evidence/equivalence/scope/CI authority flags in inputs', async () => {
    const workspace = workspaceWithReadyInputs({
      decision: { ...validDecisionRecord(), evidenceAccepted: true },
    })

    const result = await runDryRun(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.dryRunReadinessStatus).toBe('blocked-unsafe-authority-flag')
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
  })

  it('rejects unsafe markdown paths before JSON output is written', async () => {
    const workspace = workspaceWithReadyInputs()
    const proposalBefore = readFileSync(join(workspace, 'proposal.json'), 'utf8')

    const result = await runDryRun(workspace, { markdown: 'proposal.json' })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('would overwrite the source Graph Delta proposal')
    expect(readFileSync(join(workspace, 'proposal.json'), 'utf8')).toBe(proposalBefore)
    expect(existsSync(join(workspace, '.tmp/dry-run.json'))).toBe(false)
  })
})

function workspaceWithReadyInputs(
  input: {
    decision?: Record<string, unknown>
    proposal?: Record<string, unknown>
    approvedBoundary?: Record<string, unknown>
    applyBoundary?: Record<string, unknown>
    mutationPolicy?: Record<string, unknown>
  } = {},
): string {
  const workspace = createWorkspace()
  writeJson(join(workspace, 'decision.json'), input.decision ?? validDecisionRecord())
  writeJson(join(workspace, 'proposal.json'), input.proposal ?? validProposal())
  writeJson(join(workspace, 'approved-boundary.json'), input.approvedBoundary ?? validApprovedStateBoundary())
  writeJson(join(workspace, 'apply-boundary.json'), input.applyBoundary ?? validApplyBoundary())
  writeJson(join(workspace, 'mutation-policy.json'), input.mutationPolicy ?? validMutationPolicy())
  return workspace
}

async function runDryRun(
  workspace: string,
  options: { includeMutationPolicy?: boolean; markdown?: string } = {},
): Promise<Awaited<ReturnType<typeof runDevViewCli>>> {
  const args = [
    'graph',
    'read-model',
    'report-approved-apply-dry-run',
    '--decision-record',
    'decision.json',
    '--proposal',
    'proposal.json',
    '--approved-state-boundary',
    'approved-boundary.json',
    '--apply-boundary',
    'apply-boundary.json',
  ]
  if (options.includeMutationPolicy !== false) {
    args.push('--mutation-policy', 'mutation-policy.json')
  }
  args.push('--output', '.tmp/dry-run.json', '--markdown', options.markdown ?? '.tmp/dry-run.md', '--json')
  return runDevViewCli(args, { cwd: workspace, pluginRoot })
}

function validDecisionRecord(input: { decisionValue?: string; decisionKind?: string } = {}): Record<string, unknown> {
  const decisionValue = input.decisionValue ?? 'approve-proposal'
  const decisionKind =
    input.decisionKind ??
    (decisionValue === 'approve-proposal'
      ? 'approve'
      : decisionValue === 'reject-proposal'
        ? 'reject'
        : decisionValue === 'defer-decision'
          ? 'defer'
          : 'request-changes')
  return {
    artifactRole: 'devview-human-decision-record',
    status: 'devview-human-decision-record-created',
    decisionLifecycleHardeningStatus: 'hardened-human-decision-record-v1',
    sourceReviewPacket: 'review.json',
    sourceProposal: 'proposal.json',
    sourceGraphDeltaProposal: 'proposal.json',
    proposalId: 'GDP-TEST',
    decisionValue,
    decisionKind,
    decisionProvenance: 'human-authored-explicit-decision',
    decisionActorType: 'human',
    decisionActorLabel: 'human-reviewer',
    decisionSource: 'explicit-cli-input',
    decisionTimestamp: '2026-07-06T00:00:00.000Z',
    decisionTimestampAuthorityStatus: 'cli-provided',
    reviewPacketCompletenessStatus: 'complete',
    reviewPacketQuestionCount: 0,
    reviewRequiredItemCount: 0,
    blockingReviewItemCount: 0,
    selfApprovalCheckStatus: 'passed-human-actor',
    selfApprovalRejected: false,
    reviewerIdentity: 'human-reviewer',
    humanDecisionRecorded: true,
    approvalStatus: decisionValue === 'approve-proposal' ? 'human-approved-no-approved-state-created' : 'not-approved',
    approvedProposalStateCreated: false,
    graphDeltaApplyEnabled: false,
    graphDeltaApplied: false,
    graphSourceMutationAllowed: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    approvalAutomationEnabled: false,
    graphDeltaApplyTriggered: false,
    aiGeneratedDecisionAllowed: false,
    codexSelfApprovalAllowed: false,
    approvalAutomationAllowed: false,
    userAcceptanceAutomated: false,
  }
}

function legacyApprovalLookingDecisionRecord(): Record<string, unknown> {
  const record = validDecisionRecord()
  delete record.decisionLifecycleHardeningStatus
  delete record.decisionKind
  return record
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
    changedFiles: [],
    proposedNodeUpdates: [],
    candidateEvidenceLinks: [],
    candidateRuntimeReportLinks: [],
    humanReviewQuestions: [],
    boundaries: {
      proposalOnly: true,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      runtimeEvidenceSatisfied: false,
      equivalenceProven: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
      acceptedEvidence: false,
    },
  }
}

function validApprovedStateBoundary(): Record<string, unknown> {
  return {
    artifactRole: 'devview-approved-proposal-state-boundary-preview',
    status: 'devview-approved-proposal-state-boundary-previewed',
    approvedProposalStateCreated: false,
    graphDeltaApplyEnabled: false,
    graphDeltaApplied: false,
    graphSourceMutationAllowed: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function validApplyBoundary(): Record<string, unknown> {
  return {
    artifactRole: 'devview-graph-delta-apply-boundary-preview',
    status: 'devview-graph-delta-apply-boundary-previewed',
    applyCommandImplemented: false,
    graphDeltaApplyEnabled: false,
    graphDeltaApplied: false,
    graphSourceMutationAllowed: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function validMutationPolicy(): Record<string, unknown> {
  return {
    artifactRole: 'devview-graph-source-mutation-policy-boundary-preview',
    status: 'devview-graph-source-mutation-policy-boundary-previewed',
    mutationCommandImplemented: false,
    graphSourceMutationAllowed: false,
    graphSourceMutated: false,
    graphDeltaApplyEnabled: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    futureMutationTargetPolicy: {
      mutationAllowedNow: false,
      futureAllowedTarget: 'explicit-current-graph-source-only',
      requiresResolvedAbsolutePathCheck: true,
      requiresRepoRootContainmentCheck: true,
      requiresCurrentGraphSourceIdentityCheck: true,
      requiresApprovedProposalState: true,
      requiresDryRunReview: true,
      requiresRollbackFallbackPlan: true,
      requiresPostMutationValidationPlan: true,
    },
    futurePreMutationRequirements: [
      { requirementId: 'backup-or-reversible-patch' },
      { requirementId: 'fallback-plan' },
    ],
    futurePostMutationRequirements: [
      { requirementId: 'regenerate-read-model' },
      { requirementId: 'consistency-check' },
    ],
  }
}
