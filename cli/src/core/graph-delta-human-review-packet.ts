import path from 'node:path'
import { readJsonSafe, relativePath, writeTextAtomic } from './fs.js'

type JsonRecord = Record<string, unknown>

export interface GraphDeltaHumanReviewPacketOptions {
  markdown?: string
}

export interface GraphDeltaHumanReviewPacketResult {
  packet: GraphDeltaHumanReviewPacket
  markdownReport?: string
}

export interface GraphDeltaHumanReviewPacket {
  schemaVersion: 1
  artifactRole: 'graph-delta-human-review-packet'
  reviewPacketStatus: 'review-required'
  sourceProposal: string
  proposalId: string
  schemaId: string
  sourceRecordIdCandidate: string
  sourceRecordIdAuthorityStatus: string
  proposalGenerationStatus: string
  changedFileCount: number
  proposedNodeUpdateCount: number
  candidateEvidenceLinkCount: number
  candidateRuntimeReportLinkCount: number
  humanReviewQuestions: string[]
  blockingReviewItems: string[]
  reviewRequiredItems: string[]
  candidateOnlyItems: string[]
  approvalStatus: 'not-approved'
  graphSourceMutated: false
  graphDeltaApplied: false
  humanDecisionRecorded: false
  candidateEvidenceAccepted: false
  runtimeEvidenceSatisfied: false
  equivalenceProven: false
  nonEnforcing: true
  enforcementStatus: 'not-enforced'
  allowedUse: string[]
  forbiddenUse: string[]
}

const proposalSchemaId = 'pbe-graph-update-proposal-v0'
const proposalArtifactRole = 'graph-delta-proposal-only-preview'

export async function generateGraphDeltaHumanReviewPacket(
  root: string,
  proposalPath: string,
  options: GraphDeltaHumanReviewPacketOptions = {},
): Promise<GraphDeltaHumanReviewPacketResult> {
  const resolvedProposalPath = resolveRepoPath(root, proposalPath)
  const proposalResult = await readJsonSafe<JsonRecord>(resolvedProposalPath)
  if (!proposalResult.ok) {
    throw new Error(`Could not read proposal-only Graph Delta preview: ${proposalResult.error}`)
  }

  const sourceProposal = relativePath(root, resolvedProposalPath)
  const packet = buildGraphDeltaHumanReviewPacket(proposalResult.value, sourceProposal)

  if (!options.markdown) {
    return { packet }
  }

  const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
  await writeTextAtomic(resolvedMarkdownPath, renderGraphDeltaHumanReviewPacketMarkdown(packet))
  return {
    packet,
    markdownReport: relativePath(root, resolvedMarkdownPath),
  }
}

export function buildGraphDeltaHumanReviewPacket(
  proposal: JsonRecord,
  sourceProposal: string,
): GraphDeltaHumanReviewPacket {
  validateProposalOnlyGraphDeltaPreview(proposal)

  const candidateEvidenceLinks = arrayValue(proposal.candidateEvidenceLinks)
  const candidateRuntimeReportLinks = arrayValue(proposal.candidateRuntimeReportLinks)
  const humanReviewQuestions = stringArray(proposal.humanReviewQuestions)
  const sourceRecordIdAuthorityStatus = stringField(
    proposal,
    'sourceRecordIdAuthorityStatus',
    'structure-only-review-candidate',
  )

  return {
    schemaVersion: 1,
    artifactRole: 'graph-delta-human-review-packet',
    reviewPacketStatus: 'review-required',
    sourceProposal,
    proposalId: stringField(proposal, 'proposalId', 'unknown-proposal'),
    schemaId: stringField(proposal, 'schemaId', proposalSchemaId),
    sourceRecordIdCandidate: stringField(proposal, 'sourceRecordIdCandidate', 'unresolved-source-record-id'),
    sourceRecordIdAuthorityStatus,
    proposalGenerationStatus: stringField(proposal, 'proposalGenerationStatus', 'unknown'),
    changedFileCount: arrayValue(proposal.changedFiles).length,
    proposedNodeUpdateCount: arrayValue(proposal.proposedNodeUpdates).length,
    candidateEvidenceLinkCount: candidateEvidenceLinks.length,
    candidateRuntimeReportLinkCount: candidateRuntimeReportLinks.length,
    humanReviewQuestions,
    blockingReviewItems: [],
    reviewRequiredItems: reviewRequiredItems(sourceRecordIdAuthorityStatus, humanReviewQuestions.length),
    candidateOnlyItems: [
      'Proposal preview is candidate-only and unapproved.',
      'Candidate Evidence links are not accepted Evidence.',
      'Candidate runtime report links are review context only.',
      'Source record identity remains review-required unless separately confirmed by graph-source authority.',
    ],
    approvalStatus: 'not-approved',
    graphSourceMutated: false,
    graphDeltaApplied: false,
    humanDecisionRecorded: false,
    candidateEvidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    nonEnforcing: true,
    enforcementStatus: 'not-enforced',
    allowedUse: [
      'review proposal-only Graph Delta preview boundaries',
      'summarize candidate-only graph updates and Evidence/report links for a human developer',
      'prepare questions for a future explicit human decision record',
    ],
    forbiddenUse: [
      'approval recording',
      'graph-source mutation',
      'graph delta apply',
      'runtime Evidence satisfaction',
      'equivalence proof',
      'scope enforcement',
      'diff rejection',
      'CI required check',
      'user acceptance automation',
    ],
  }
}

export function validateProposalOnlyGraphDeltaPreview(proposal: JsonRecord): void {
  if (proposal.schemaId !== proposalSchemaId) {
    throw new Error(`Unsafe Graph Delta review packet input: schemaId must be ${JSON.stringify(proposalSchemaId)}.`)
  }
  if (proposal.artifactRole !== proposalArtifactRole) {
    throw new Error(
      `Unsafe Graph Delta review packet input: artifactRole must be ${JSON.stringify(proposalArtifactRole)}.`,
    )
  }

  const expectedFields: Array<[string, unknown]> = [
    ['proposalOnly', true],
    ['graphSourceMutated', false],
    ['graphDeltaApplied', false],
    ['requiresHumanReview', true],
    ['approvalStatus', 'not-approved'],
    ['nonEnforcing', true],
    ['enforcementStatus', 'not-enforced'],
  ]

  for (const [field, expected] of expectedFields) {
    const value = boundaryValue(proposal, field)
    if (value !== expected) {
      throw new Error(
        `Unsafe proposal-only Graph Delta preview boundary: ${field} must be ${JSON.stringify(expected)}.`,
      )
    }
  }
}

export function renderGraphDeltaHumanReviewPacketMarkdown(packet: GraphDeltaHumanReviewPacket): string {
  return `# Graph Delta Human Review Packet

Status: \`${packet.reviewPacketStatus}\`

## Summary

| Field | Value |
| --- | --- |
| Proposal | \`${packet.sourceProposal}\` |
| Proposal ID | \`${packet.proposalId}\` |
| Schema | \`${packet.schemaId}\` |
| Source record candidate | \`${packet.sourceRecordIdCandidate}\` |
| Source record authority | \`${packet.sourceRecordIdAuthorityStatus}\` |
| Proposal generation | \`${packet.proposalGenerationStatus}\` |
| Approval | \`${packet.approvalStatus}\` |

## Proposal Boundary

| Boundary | Value |
| --- | --- |
| Graph-source mutated | \`${packet.graphSourceMutated}\` |
| Graph delta applied | \`${packet.graphDeltaApplied}\` |
| Human decision recorded | \`${packet.humanDecisionRecorded}\` |
| Candidate Evidence accepted | \`${packet.candidateEvidenceAccepted}\` |
| Runtime Evidence satisfied | \`${packet.runtimeEvidenceSatisfied}\` |
| Equivalence proven | \`${packet.equivalenceProven}\` |
| Enforcement | \`${packet.enforcementStatus}\` |

## What Changed

- Changed files referenced: ${packet.changedFileCount}
- Proposed node updates referenced: ${packet.proposedNodeUpdateCount}

## Candidate Graph Updates

- Candidate-only items: ${packet.candidateOnlyItems.length}
- Blocking review items: ${packet.blockingReviewItems.length}
- Review-required items: ${packet.reviewRequiredItems.length}

## Candidate Evidence/Report Links

- Candidate Evidence links: ${packet.candidateEvidenceLinkCount}
- Candidate runtime report links: ${packet.candidateRuntimeReportLinkCount}
- These links are review context only and are not accepted Evidence.

## Human Review Questions

${formatMarkdownList(packet.humanReviewQuestions)}

## Explicit Non-Approvals

- This packet is not approval.
- This packet is not graph-source apply.
- This packet is not runtime Evidence satisfaction.
- This packet is not scope enforcement.
- This packet does not record a human decision.
`
}

function reviewRequiredItems(sourceRecordIdAuthorityStatus: string, questionCount: number): string[] {
  const items = ['Human decision must remain separate from packet generation.']
  if (sourceRecordIdAuthorityStatus !== 'authoritative-graph-source-record') {
    items.push('Source record identity is candidate-only and requires human review.')
  }
  if (questionCount > 0) {
    items.push('Human review questions remain unanswered.')
  }
  return items
}

function boundaryValue(proposal: JsonRecord, field: string): unknown {
  if (field in proposal) {
    return proposal[field]
  }
  const boundaries = isRecord(proposal.boundaries) ? proposal.boundaries : {}
  return boundaries[field]
}

function stringField(source: JsonRecord, key: string, fallback: string): string {
  const value = source[key]
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatMarkdownList(values: string[]): string {
  return values.length === 0 ? '- None recorded.' : values.map((entry) => `- ${entry}`).join('\n')
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath)
}
