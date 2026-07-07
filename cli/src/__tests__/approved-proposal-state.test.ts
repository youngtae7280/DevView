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

describe('Approved Proposal State CLI', () => {
  it('writes a blocked preview for a defer decision without apply, mutation, or enforcement', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validBoundary())
    writeJson(join(workspace, 'proposal.json'), validProposal())
    writeJson(join(workspace, 'decision.json'), validDecisionRecord({ decisionValue: 'defer-decision' }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'create-approved-proposal-state',
        '--boundary',
        'boundary.json',
        '--decision-record',
        'decision.json',
        '--proposal',
        'proposal.json',
        '--output',
        '.tmp/approved-state.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/approved-state.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-approved-proposal-state-blocked')
    expect(payload.decisionValue).toBe('defer-decision')
    expect(payload.approvedProposalStateCreated).toBe(false)
    expect(payload.approvalStatus).toBe('not-approved')
    expect(payload.graphDeltaApplyEnabled).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(written.approvedStateCreationBlockedReason).toContain('defer-decision')
  })

  it('creates an approved-state preview for an approve decision without applying or mutating', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validBoundary())
    writeJson(join(workspace, 'proposal.json'), validProposal())
    writeJson(join(workspace, 'decision.json'), validDecisionRecord({ decisionValue: 'approve-proposal' }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'create-approved-proposal-state',
        '--boundary',
        'boundary.json',
        '--decision-record',
        'decision.json',
        '--proposal',
        'proposal.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-approved-proposal-state-created')
    expect(payload.decisionKind).toBe('approve')
    expect(payload.decisionActorType).toBe('human')
    expect(payload.decisionSource).toBe('explicit-cli-input')
    expect(payload.reviewPacketCompletenessStatus).toBe('complete')
    expect(payload.approvedProposalStateCreated).toBe(true)
    expect(payload.approvalStatus).toBe('approved-by-human-decision-record')
    expect(payload.graphDeltaApplyEnabled).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.graphSourceMutationAllowed).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
  })

  it('blocks legacy approval-looking records that are not hardened', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validBoundary())
    writeJson(join(workspace, 'proposal.json'), validProposal())
    writeJson(join(workspace, 'decision.json'), legacyApprovalLookingDecisionRecord())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'create-approved-proposal-state',
        '--boundary',
        'boundary.json',
        '--decision-record',
        'decision.json',
        '--proposal',
        'proposal.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-approved-proposal-state-blocked')
    expect(payload.approvedProposalStateCreated).toBe(false)
    expect(payload.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'APPROVED_STATE_DECISION_NOT_HARDENED',
    )
  })

  it('blocks request-changes and rejects from approved-state creation', async () => {
    for (const decisionValue of ['reject-proposal', 'request-revision', 'request-changes', 'defer-decision']) {
      const workspace = createWorkspace()
      writeJson(join(workspace, 'boundary.json'), validBoundary())
      writeJson(join(workspace, 'proposal.json'), validProposal())
      writeJson(join(workspace, 'decision.json'), validDecisionRecord({ decisionValue }))

      const result = await runDevViewCli(
        [
          'graph',
          'read-model',
          'create-approved-proposal-state',
          '--boundary',
          'boundary.json',
          '--decision-record',
          'decision.json',
          '--proposal',
          'proposal.json',
          '--json',
        ],
        { cwd: workspace, pluginRoot },
      )
      const payload = JSON.parse(result.stdout)

      expect(result.exitCode).toBe(ExitCode.Success)
      expect(payload.status).toBe('devview-approved-proposal-state-blocked')
      expect(payload.approvedProposalStateCreated).toBe(false)
      expect(payload.approvalStatus).toBe('not-approved')
    }
  })

  it('blocks mismatched proposal provenance by writing a blocked preview', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validBoundary())
    writeJson(join(workspace, 'proposal.json'), { ...validProposal(), proposalId: 'GDP-OTHER' })
    writeJson(join(workspace, 'decision.json'), validDecisionRecord({ decisionValue: 'approve-proposal' }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'create-approved-proposal-state',
        '--boundary',
        'boundary.json',
        '--decision-record',
        'decision.json',
        '--proposal',
        'proposal.json',
        '--output',
        '.tmp/approved-state.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-approved-proposal-state-blocked')
    expect(payload.approvedProposalStateCreated).toBe(false)
    expect(payload.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'APPROVED_STATE_PROPOSAL_ID_MISMATCH',
    )
  })

  it('blocks mismatched sourceReviewPacket/sourceProposal provenance by writing a blocked preview', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validBoundary())
    writeJson(join(workspace, 'proposal.json'), validProposal())
    writeJson(
      join(workspace, 'decision.json'),
      validDecisionRecord({
        decisionValue: 'approve-proposal',
        sourceReviewPacket: '',
        sourceProposal: 'other-proposal.json',
      }),
    )

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'create-approved-proposal-state',
        '--boundary',
        'boundary.json',
        '--decision-record',
        'decision.json',
        '--proposal',
        'proposal.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-approved-proposal-state-blocked')
    expect(payload.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'APPROVED_STATE_SOURCE_PROPOSAL_ALIAS_MISMATCH',
    )
    expect(payload.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'APPROVED_STATE_REVIEW_PACKET_MISSING',
    )
  })

  it('fails unsafe proposal boundaries before writing output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validBoundary())
    writeJson(join(workspace, 'proposal.json'), { ...validProposal(), graphDeltaApplied: true })
    writeJson(join(workspace, 'decision.json'), validDecisionRecord({ decisionValue: 'approve-proposal' }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'create-approved-proposal-state',
        '--boundary',
        'boundary.json',
        '--decision-record',
        'decision.json',
        '--proposal',
        'proposal.json',
        '--output',
        '.tmp/approved-state.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('graphDeltaApplied')
    expect(existsSync(join(workspace, '.tmp/approved-state.json'))).toBe(false)
  })

  it('blocks unsafe markdown before JSON output is written', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validBoundary())
    writeJson(join(workspace, 'proposal.json'), validProposal())
    writeJson(join(workspace, 'decision.json'), validDecisionRecord({ decisionValue: 'approve-proposal' }))
    const proposalBefore = readFileSync(join(workspace, 'proposal.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'create-approved-proposal-state',
        '--boundary',
        'boundary.json',
        '--decision-record',
        'decision.json',
        '--proposal',
        'proposal.json',
        '--output',
        '.tmp/approved-state.json',
        '--markdown',
        'proposal.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('would overwrite the source Graph Delta proposal')
    expect(readFileSync(join(workspace, 'proposal.json'), 'utf8')).toBe(proposalBefore)
    expect(existsSync(join(workspace, '.tmp/approved-state.json'))).toBe(false)
  })
})

function validBoundary(): Record<string, unknown> {
  return {
    artifactRole: 'devview-approved-proposal-state-boundary-preview',
    status: 'devview-approved-proposal-state-boundary-previewed',
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

function validProposal(): Record<string, unknown> {
  return {
    schemaId: 'devview-graph-update-proposal-v0',
    artifactRole: 'graph-delta-proposal-only-preview',
    proposalId: 'GDP-TEST',
    proposalOnly: true,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    requiresHumanReview: true,
    approvalStatus: 'not-approved',
    nonEnforcing: true,
    enforcementStatus: 'not-enforced',
    sourceRecordIdCandidate: 'CH-001',
    sourceRecordIdAuthorityStatus: 'structure-only-review-candidate',
    proposalGenerationStatus: 'proposal-only-preview-generated',
    changedFiles: [],
    proposedNodeUpdates: [],
    candidateEvidenceLinks: [],
    candidateRuntimeReportLinks: [],
    humanReviewQuestions: [],
  }
}

function validDecisionRecord(input: {
  decisionValue: string
  sourceReviewPacket?: string
  sourceProposal?: string
}): Record<string, unknown> {
  const decisionKind =
    input.decisionValue === 'approve-proposal'
      ? 'approve'
      : input.decisionValue === 'reject-proposal'
        ? 'reject'
        : input.decisionValue === 'defer-decision'
          ? 'defer'
          : 'request-changes'
  return {
    artifactRole: 'devview-human-decision-record',
    status: 'devview-human-decision-record-created',
    decisionLifecycleHardeningStatus: 'hardened-human-decision-record-v1',
    sourceReviewPacket: input.sourceReviewPacket ?? 'review.json',
    sourceProposal: input.sourceProposal ?? 'proposal.json',
    sourceGraphDeltaProposal: 'proposal.json',
    proposalId: 'GDP-TEST',
    decisionValue: input.decisionValue,
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
    approvalStatus:
      input.decisionValue === 'approve-proposal' ? 'human-approved-no-approved-state-created' : 'not-approved',
    approvedProposalStateCreated: false,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    approvalAutomationEnabled: false,
    graphDeltaApplyTriggered: false,
  }
}

function legacyApprovalLookingDecisionRecord(): Record<string, unknown> {
  const legacy = validDecisionRecord({
    decisionValue: 'approve-proposal',
  })
  delete legacy.decisionLifecycleHardeningStatus
  delete legacy.decisionKind
  delete legacy.decisionActorType
  return legacy
}
