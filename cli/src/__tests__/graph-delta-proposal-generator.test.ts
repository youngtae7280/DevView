import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import {
  buildProposalOnlyGraphDeltaPreview,
  validateGraphDeltaCompatibleSource,
} from '../core/graph-delta-proposal-generator'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('proposal-only Graph Delta generator core', () => {
  it('generates a proposal-shaped preview from a valid source without promoting candidate identity', () => {
    const proposal = buildProposalOnlyGraphDeltaPreview(validSourceArtifact(), 'source.json')

    expect(proposal.schemaId).toBe('devview-graph-update-proposal-v0')
    expect(proposal.artifactRole).toBe('graph-delta-proposal-only-preview')
    expect(proposal.proposalGenerationStatus).toBe('generated-proposal-only-preview')
    expect(proposal.proposalOnly).toBe(true)
    expect(proposal.proposalGenerated).toBe(true)
    expect(proposal.boundaries.graphSourceMutated).toBe(false)
    expect(proposal.boundaries.graphDeltaApplied).toBe(false)
    expect(proposal.boundaries.approvalStatus).toBe('not-approved')
    expect(proposal.boundaries.nonEnforcing).toBe(true)
    expect(proposal.boundaries.enforcementStatus).toBe('not-enforced')
    expect(proposal.sourceRecordIdCandidate).toBe('CH-001')
    expect(proposal.sourceRecordIdAuthorityStatus).toBe('structure-only-review-candidate')
    expect(proposal.candidateEvidenceLinks).toEqual([
      expect.objectContaining({
        candidateType: 'evidence-link-candidate',
        acceptedEvidence: false,
        requiresHumanReview: true,
      }),
      expect.objectContaining({
        candidateType: 'changed-file-observation-candidate',
        acceptedEvidence: false,
        requiresHumanReview: true,
      }),
      expect.objectContaining({
        candidateType: 'scope-finding-review-note-candidate',
        acceptedEvidence: false,
        requiresHumanReview: true,
      }),
    ])
    expect(proposal.candidateRuntimeReportLinks).toEqual([
      expect.objectContaining({
        candidateType: 'runtime-report-link-candidate',
        acceptedEvidence: false,
        requiresHumanReview: true,
      }),
    ])
    expect(proposal.humanReviewQuestions[0]).toContain('candidate-only')
  })

  it('rejects unsafe boundary fields before generation', () => {
    expect(() => validateGraphDeltaCompatibleSource({ ...validSourceArtifact(), graphSourceMutated: true })).toThrow(
      'graphSourceMutated must be false',
    )
    expect(() => validateGraphDeltaCompatibleSource({ ...validSourceArtifact(), graphDeltaApplied: true })).toThrow(
      'graphDeltaApplied must be false',
    )
    expect(() => validateGraphDeltaCompatibleSource({ ...validSourceArtifact(), approvalStatus: 'approved' })).toThrow(
      'approvalStatus must be "not-approved"',
    )
  })
})

describe('proposal-only Graph Delta generator CLI', () => {
  it('prints JSON without writing files by default', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'source.json'), validSourceArtifact())
    const outputPath = join(workspace, 'proposal.preview.json')

    const result = await runDevViewCli(
      ['graph', 'read-model', 'propose-graph-delta', '--source', 'source.json', '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('graph read-model propose-graph-delta')
    expect(payload.proposalOnly).toBe(true)
    expect(payload.proposalGenerated).toBe(true)
    expect(payload.graphDeltaPathStatus).toBe('unresolved-default-output-path-policy')
    expect(payload.writtenOutputPath).toBe(null)
    expect(payload.writtenOutputPathAuthorityStatus).toBe('not-written-stdout-only')
    expect(payload.enforcementStatus).toBe('not-enforced')
    expect(existsSync(outputPath)).toBe(false)
  })

  it('writes only the explicit output path when requested', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'source.json'), validSourceArtifact())
    const outputPath = join('.tmp', 'graph-delta-proposal.preview.json')

    const result = await runDevViewCli(
      ['graph', 'read-model', 'propose-graph-delta', '--source', 'source.json', '--output', outputPath, '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.outputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(payload.writtenOutputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(payload.writtenOutputPathAuthorityStatus).toBe('explicit-preview-output-not-graph-source')
    expect(written.artifactRole).toBe('graph-delta-proposal-only-preview')
    expect(written.boundaries.graphSourceMutated).toBe(false)
    expect(written.boundaries.graphDeltaApplied).toBe(false)
    expect(written.boundaries.approvalStatus).toBe('not-approved')
  })

  it('does not fail because advisory findings are referenced as candidate context', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'source.json'), {
      ...validSourceArtifact(),
      evidenceAndReportLinkCandidates: {
        ...validSourceArtifact().evidenceAndReportLinkCandidates,
        scopeFindingReviewNoteCandidate: {
          candidateType: 'scope-finding-review-note-candidate',
          advisoryFindingCount: 3,
          acceptedEvidence: false,
          requiresHumanReview: true,
        },
      },
    })

    const result = await runDevViewCli(
      ['graph', 'read-model', 'propose-graph-delta', '--source', 'source.json', '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.candidateEvidenceLinks).toContainEqual(
      expect.objectContaining({
        candidateType: 'scope-finding-review-note-candidate',
        advisoryFindingCount: 3,
      }),
    )
    expect(payload.boundaries.diffRejected).toBe(false)
    expect(payload.boundaries.scopeEnforced).toBe(false)
  })

  it('fails malformed or unsafe source artifacts', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'source.json'), { ...validSourceArtifact(), proposalOnly: false })

    const result = await runDevViewCli(
      ['graph', 'read-model', 'propose-graph-delta', '--source', 'source.json', '--json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.command).toBe('graph read-model propose-graph-delta')
    expect(payload.issues[0]).toEqual(
      expect.objectContaining({
        code: 'GRAPH_DELTA_PROPOSAL_ONLY_GENERATION_BLOCKED',
        severity: 'error',
      }),
    )
  })
})

function validSourceArtifact(): Record<string, unknown> {
  return {
    compatibleProposalSchema: 'devview-graph-update-proposal-v0',
    proposalOnly: true,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    requiresHumanReview: true,
    approvalStatus: 'not-approved',
    sourceRecordIdentity: {
      sourceRecordIdCandidate: 'CH-001',
      sourceRecordIdAuthorityStatus: 'structure-only-review-candidate',
      sourceRecordIdResolutionStatus: 'human-review-required',
    },
    evidenceAndReportLinkCandidates: {
      advisoryEvaluationJsonLinkCandidate: {
        candidateType: 'evidence-link-candidate',
        acceptedEvidence: false,
        requiresHumanReview: true,
      },
      compactRuntimeReportLinkCandidate: {
        candidateType: 'runtime-report-link-candidate',
        acceptedEvidence: false,
        requiresHumanReview: true,
      },
      changedFileCollectionLinkCandidate: {
        candidateType: 'changed-file-observation-candidate',
        acceptedEvidence: false,
        requiresHumanReview: true,
      },
      scopeFindingReviewNoteCandidate: {
        candidateType: 'scope-finding-review-note-candidate',
        acceptedEvidence: false,
        requiresHumanReview: true,
      },
    },
  }
}
