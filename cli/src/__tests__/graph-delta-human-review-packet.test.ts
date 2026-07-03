import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runPbeCli } from '../app'
import {
  buildGraphDeltaHumanReviewPacket,
  validateProposalOnlyGraphDeltaPreview,
} from '../core/graph-delta-human-review-packet'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Graph Delta human review packet core', () => {
  it('builds a review-required packet from a valid proposal-only preview', () => {
    const packet = buildGraphDeltaHumanReviewPacket(validProposalPreview(), 'proposal.preview.json')

    expect(packet.artifactRole).toBe('graph-delta-human-review-packet')
    expect(packet.reviewPacketStatus).toBe('review-required')
    expect(packet.sourceProposal).toBe('proposal.preview.json')
    expect(packet.proposalId).toBe('proposal-only-preview-ch-001')
    expect(packet.sourceRecordIdCandidate).toBe('CH-001')
    expect(packet.sourceRecordIdAuthorityStatus).toBe('structure-only-review-candidate')
    expect(packet.changedFileCount).toBe(1)
    expect(packet.proposedNodeUpdateCount).toBe(1)
    expect(packet.candidateEvidenceLinkCount).toBe(1)
    expect(packet.candidateRuntimeReportLinkCount).toBe(1)
    expect(packet.approvalStatus).toBe('not-approved')
    expect(packet.graphSourceMutated).toBe(false)
    expect(packet.graphDeltaApplied).toBe(false)
    expect(packet.humanDecisionRecorded).toBe(false)
    expect(packet.candidateEvidenceAccepted).toBe(false)
    expect(packet.runtimeEvidenceSatisfied).toBe(false)
    expect(packet.enforcementStatus).toBe('not-enforced')
  })

  it('rejects unsafe proposal-only preview boundaries', () => {
    expect(() =>
      validateProposalOnlyGraphDeltaPreview({
        ...validProposalPreview(),
        boundaries: { ...validProposalPreview().boundaries, graphSourceMutated: true },
      }),
    ).toThrow('graphSourceMutated must be false')
    expect(() =>
      validateProposalOnlyGraphDeltaPreview({
        ...validProposalPreview(),
        boundaries: { ...validProposalPreview().boundaries, graphDeltaApplied: true },
      }),
    ).toThrow('graphDeltaApplied must be false')
    expect(() =>
      validateProposalOnlyGraphDeltaPreview({
        ...validProposalPreview(),
        boundaries: { ...validProposalPreview().boundaries, approvalStatus: 'approved' },
      }),
    ).toThrow('approvalStatus must be "not-approved"')
  })
})

describe('Graph Delta human review packet CLI', () => {
  it('prints JSON without writing markdown by default', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'proposal.preview.json'), validProposalPreview())
    const markdownPath = join(workspace, 'review-packet.md')

    const result = await runPbeCli(
      ['graph', 'read-model', 'review-graph-delta', '--proposal', 'proposal.preview.json', '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('graph read-model review-graph-delta')
    expect(payload.reviewPacketStatus).toBe('review-required')
    expect(payload.approvalStatus).toBe('not-approved')
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.humanDecisionRecorded).toBe(false)
    expect(payload.markdownReport).toBeUndefined()
    expect(existsSync(markdownPath)).toBe(false)
  })

  it('writes markdown only to the explicit markdown path', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'proposal.preview.json'), validProposalPreview())
    const markdownPath = join('.tmp', 'review-packet.md')

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'review-graph-delta',
        '--proposal',
        'proposal.preview.json',
        '--markdown',
        markdownPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const markdown = readFileSync(join(workspace, markdownPath), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.markdownReport).toBe(markdownPath.replaceAll('\\', '/'))
    expect(markdown).toContain('# Graph Delta Human Review Packet')
    expect(markdown).toContain('This packet is not approval.')
    expect(markdown).toContain('This packet does not record a human decision.')
  })

  it('fails malformed or unsafe proposal previews clearly', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'proposal.preview.json'), {
      ...validProposalPreview(),
      boundaries: { ...validProposalPreview().boundaries, graphDeltaApplied: true },
    })

    const result = await runPbeCli(
      ['graph', 'read-model', 'review-graph-delta', '--proposal', 'proposal.preview.json', '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.command).toBe('graph read-model review-graph-delta')
    expect(payload.issues[0]).toEqual(
      expect.objectContaining({
        code: 'GRAPH_DELTA_HUMAN_REVIEW_PACKET_BLOCKED',
        severity: 'error',
      }),
    )
  })
})

function validProposalPreview(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    schemaId: 'pbe-graph-update-proposal-v0',
    artifactRole: 'graph-delta-proposal-only-preview',
    proposalId: 'proposal-only-preview-ch-001',
    sourceRecordIdCandidate: 'CH-001',
    sourceRecordIdAuthorityStatus: 'structure-only-review-candidate',
    proposalGenerationStatus: 'generated-proposal-only-preview',
    proposalOnly: true,
    changedFiles: ['examples/valid/todo-app-pbe-run/src/App.tsx'],
    proposedNodeUpdates: [{ candidateOnly: true }],
    candidateEvidenceLinks: [
      {
        candidateType: 'evidence-link-candidate',
        acceptedEvidence: false,
        requiresHumanReview: true,
      },
    ],
    candidateRuntimeReportLinks: [
      {
        candidateType: 'runtime-report-link-candidate',
        acceptedEvidence: false,
        requiresHumanReview: true,
      },
    ],
    humanReviewQuestions: ['Confirm whether CH-001 is the right source record.'],
    nonEnforcing: true,
    enforcementStatus: 'not-enforced',
    boundaries: {
      proposalOnly: true,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      requiresHumanReview: true,
      approvalStatus: 'not-approved',
      nonEnforcing: true,
      enforcementStatus: 'not-enforced',
    },
  }
}
