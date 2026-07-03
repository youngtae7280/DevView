import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runPbeCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Graph Delta Apply readiness CLI', () => {
  it('writes blocked readiness for a blocked approved state without apply or mutation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validBoundary())
    writeJson(join(workspace, 'proposal.json'), validProposal())
    writeJson(join(workspace, 'approved-state.json'), validApprovedState({ created: false }))

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'check-graph-delta-apply',
        '--boundary',
        'boundary.json',
        '--approved-state',
        'approved-state.json',
        '--proposal',
        'proposal.json',
        '--output',
        '.tmp/apply-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/apply-readiness.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-graph-delta-apply-readiness-blocked')
    expect(payload.applyReadinessStatus).toBe('blocked-approved-state-not-created')
    expect(payload.approvedProposalStateCreated).toBe(false)
    expect(payload.graphDeltaApplyEnabled).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.graphSourceMutationAllowed).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(written.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'GRAPH_DELTA_APPLY_APPROVED_STATE_NOT_CREATED',
    )
  })

  it('reports dry-run readiness for a created approved state without applying or mutating', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validBoundary())
    writeJson(join(workspace, 'proposal.json'), validProposal())
    writeJson(join(workspace, 'approved-state.json'), validApprovedState({ created: true }))

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'check-graph-delta-apply',
        '--boundary',
        'boundary.json',
        '--approved-state',
        'approved-state.json',
        '--proposal',
        'proposal.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-graph-delta-apply-readiness-ready')
    expect(payload.applyReadinessStatus).toBe('dry-run-ready-approved-state-present')
    expect(payload.approvedProposalStateCreated).toBe(true)
    expect(payload.graphDeltaApplyEnabled).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
  })

  it('blocks readiness when proposal provenance mismatches', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validBoundary())
    writeJson(join(workspace, 'proposal.json'), { ...validProposal(), proposalId: 'GDP-OTHER' })
    writeJson(join(workspace, 'approved-state.json'), validApprovedState({ created: true }))

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'check-graph-delta-apply',
        '--boundary',
        'boundary.json',
        '--approved-state',
        'approved-state.json',
        '--proposal',
        'proposal.json',
        '--output',
        '.tmp/apply-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-graph-delta-apply-readiness-blocked')
    expect(payload.applyReadinessStatus).toBe('blocked-proposal-or-approved-state-precondition-failed')
    expect(payload.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'GRAPH_DELTA_APPLY_PROPOSAL_ID_MISMATCH',
    )
  })

  it('fails unsafe proposal boundaries before writing output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validBoundary())
    writeJson(join(workspace, 'proposal.json'), { ...validProposal(), graphSourceMutated: true })
    writeJson(join(workspace, 'approved-state.json'), validApprovedState({ created: true }))

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'check-graph-delta-apply',
        '--boundary',
        'boundary.json',
        '--approved-state',
        'approved-state.json',
        '--proposal',
        'proposal.json',
        '--output',
        '.tmp/apply-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('graphSourceMutated')
    expect(existsSync(join(workspace, '.tmp/apply-readiness.json'))).toBe(false)
  })

  it('blocks unsafe markdown before JSON output is written', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validBoundary())
    writeJson(join(workspace, 'proposal.json'), validProposal())
    writeJson(join(workspace, 'approved-state.json'), validApprovedState({ created: true }))
    const proposalBefore = readFileSync(join(workspace, 'proposal.json'), 'utf8')

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'check-graph-delta-apply',
        '--boundary',
        'boundary.json',
        '--approved-state',
        'approved-state.json',
        '--proposal',
        'proposal.json',
        '--output',
        '.tmp/apply-readiness.json',
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
    expect(existsSync(join(workspace, '.tmp/apply-readiness.json'))).toBe(false)
  })
})

function validBoundary(): Record<string, unknown> {
  return {
    artifactRole: 'devview-graph-delta-apply-boundary-preview',
    status: 'devview-graph-delta-apply-boundary-previewed',
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
    schemaId: 'pbe-graph-update-proposal-v0',
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

function validApprovedState(input: { created: boolean }): Record<string, unknown> {
  return {
    artifactRole: 'devview-approved-proposal-state-preview',
    status: input.created ? 'devview-approved-proposal-state-created' : 'devview-approved-proposal-state-blocked',
    sourceHumanDecisionRecord: 'decision.json',
    sourceHumanReviewPacket: 'review.json',
    sourceGraphDeltaProposal: 'proposal.json',
    proposalId: 'GDP-TEST',
    approvalStatus: input.created ? 'approved-by-human-decision-record' : 'not-approved',
    approvedProposalStateCreated: input.created,
    humanDecisionRecorded: true,
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
