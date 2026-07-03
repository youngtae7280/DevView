import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic } from './fs.js'

type JsonRecord = Record<string, unknown>

export interface ProposalOnlyGraphDeltaGeneratorOptions {
  output?: string
}

export interface ProposalOnlyGraphDeltaGeneratorResult {
  proposal: ProposalOnlyGraphDeltaPreview
  outputPath?: string
}

export interface CandidateLink extends JsonRecord {
  candidateType?: string
  acceptedEvidence?: false
  requiresHumanReview?: true
}

export interface ProposalOnlyGraphDeltaPreview {
  schemaVersion: 1
  schemaId: 'pbe-graph-update-proposal-v0'
  artifactRole: 'graph-delta-proposal-only-preview'
  status: 'generated-proposal-only-preview'
  proposalId: string
  sourceArtifact: string
  sourceRecordIdCandidate: string
  sourceRecordIdAuthorityStatus: string
  sourceRecordIdResolutionStatus: string
  proposalGenerationStatus: 'generated-proposal-only-preview'
  proposalOnly: true
  proposalGenerated: true
  changedFiles: unknown[]
  changedFilesPopulationStatus: 'candidate-source-linked-not-populated'
  proposedRecordState: {
    candidateOnly: true
    approvalStatus: 'not-approved'
    runtimeEvidenceSatisfied: false
    reviewStatus: 'human-review-required'
    notes: string
  }
  proposedNodeUpdates: unknown[]
  edgeIntentSummary: {
    mappingStatus: 'unresolved-existing-schema-review-required'
    candidateOnly: true
  }
  boundaries: {
    proposalOnly: true
    proposalGenerated: true
    graphSourceMutated: false
    graphDeltaApplied: false
    mutatesGraphSource: false
    appliesPatch: false
    requiresHumanReview: true
    requiresReviewBeforeApply: true
    approvalStatus: 'not-approved'
    nonEnforcing: true
    enforcementStatus: 'not-enforced'
    scopeEnforced: false
    diffRejected: false
    runtimeEvidenceSatisfied: false
    equivalenceProven: false
    maintainerIntentClaimed: false
    acceptedEvidence: false
  }
  candidateEvidenceLinks: CandidateLink[]
  candidateRuntimeReportLinks: CandidateLink[]
  humanReviewQuestions: string[]
  outputWritePolicy: 'explicit-output-only'
  graphDeltaPathStatus: 'unresolved-default-output-path-policy'
  writtenOutputPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-preview-output-not-graph-source'
  nonEnforcing: true
  enforcementStatus: 'not-enforced'
  allowedUse: string[]
  forbiddenUse: string[]
}

interface GraphDeltaCompatibleSourceArtifact extends JsonRecord {
  compatibleProposalSchema?: unknown
  proposalOnly?: unknown
  graphSourceMutated?: unknown
  graphDeltaApplied?: unknown
  requiresHumanReview?: unknown
  approvalStatus?: unknown
  sourceRecordIdentity?: unknown
  evidenceAndReportLinkCandidates?: unknown
}

const compatibleProposalSchema = 'pbe-graph-update-proposal-v0'

export async function generateProposalOnlyGraphDeltaPreview(
  root: string,
  sourceArtifactPath: string,
  options: ProposalOnlyGraphDeltaGeneratorOptions = {},
): Promise<ProposalOnlyGraphDeltaGeneratorResult> {
  const resolvedSourcePath = resolveRepoPath(root, sourceArtifactPath)
  const sourceResult = await readJsonSafe<GraphDeltaCompatibleSourceArtifact>(resolvedSourcePath)
  if (!sourceResult.ok) {
    throw new Error(`Could not read graph-delta-compatible source artifact: ${sourceResult.error}`)
  }

  const sourceArtifact = relativePath(root, resolvedSourcePath)
  const proposal = buildProposalOnlyGraphDeltaPreview(sourceResult.value, sourceArtifact)

  if (!options.output) {
    return { proposal }
  }

  const resolvedOutputPath = resolveRepoPath(root, options.output)
  const outputProposal: ProposalOnlyGraphDeltaPreview = {
    ...proposal,
    writtenOutputPath: relativePath(root, resolvedOutputPath),
    writtenOutputPathAuthorityStatus: 'explicit-preview-output-not-graph-source',
  }
  await writeJsonAtomic(resolvedOutputPath, outputProposal)
  return {
    proposal: outputProposal,
    outputPath: relativePath(root, resolvedOutputPath),
  }
}

export function buildProposalOnlyGraphDeltaPreview(
  source: GraphDeltaCompatibleSourceArtifact,
  sourceArtifact: string,
): ProposalOnlyGraphDeltaPreview {
  validateGraphDeltaCompatibleSource(source)

  const sourceRecordIdentity = asRecord(source.sourceRecordIdentity)
  const sourceRecordIdCandidate =
    stringValue(sourceRecordIdentity.sourceRecordIdCandidate) || 'unresolved-source-record-id'
  const sourceRecordIdAuthorityStatus =
    stringValue(sourceRecordIdentity.sourceRecordIdAuthorityStatus) || 'structure-only-review-candidate'
  const sourceRecordIdResolutionStatus =
    stringValue(sourceRecordIdentity.sourceRecordIdResolutionStatus) || 'human-review-required'
  const evidenceAndReportLinkCandidates = asRecord(source.evidenceAndReportLinkCandidates)

  return {
    schemaVersion: 1,
    schemaId: compatibleProposalSchema,
    artifactRole: 'graph-delta-proposal-only-preview',
    status: 'generated-proposal-only-preview',
    proposalId: `proposal-only-preview-${slugify(sourceRecordIdCandidate)}`,
    sourceArtifact,
    sourceRecordIdCandidate,
    sourceRecordIdAuthorityStatus,
    sourceRecordIdResolutionStatus,
    proposalGenerationStatus: 'generated-proposal-only-preview',
    proposalOnly: true,
    proposalGenerated: true,
    changedFiles: [],
    changedFilesPopulationStatus: 'candidate-source-linked-not-populated',
    proposedRecordState: {
      candidateOnly: true,
      approvalStatus: 'not-approved',
      runtimeEvidenceSatisfied: false,
      reviewStatus: 'human-review-required',
      notes:
        'This preview preserves advisory scope results as proposal review context only. It does not approve a graph record state transition.',
    },
    proposedNodeUpdates: [],
    edgeIntentSummary: {
      mappingStatus: 'unresolved-existing-schema-review-required',
      candidateOnly: true,
    },
    boundaries: {
      proposalOnly: true,
      proposalGenerated: true,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      mutatesGraphSource: false,
      appliesPatch: false,
      requiresHumanReview: true,
      requiresReviewBeforeApply: true,
      approvalStatus: 'not-approved',
      nonEnforcing: true,
      enforcementStatus: 'not-enforced',
      scopeEnforced: false,
      diffRejected: false,
      runtimeEvidenceSatisfied: false,
      equivalenceProven: false,
      maintainerIntentClaimed: false,
      acceptedEvidence: false,
    },
    candidateEvidenceLinks: evidenceLinkCandidates(evidenceAndReportLinkCandidates),
    candidateRuntimeReportLinks: runtimeReportLinkCandidates(evidenceAndReportLinkCandidates),
    humanReviewQuestions: humanReviewQuestions(sourceRecordIdCandidate, sourceRecordIdAuthorityStatus),
    outputWritePolicy: 'explicit-output-only',
    graphDeltaPathStatus: 'unresolved-default-output-path-policy',
    writtenOutputPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    nonEnforcing: true,
    enforcementStatus: 'not-enforced',
    allowedUse: [
      'review a proposal-shaped preview generated from a graph-delta-compatible source artifact',
      'inspect candidate Evidence and runtime report links before human review',
      'write an explicit preview output only when --output is supplied',
    ],
    forbiddenUse: [
      'graph-source mutation',
      'graph delta apply',
      'approved graph update',
      'scope enforcement',
      'diff rejection',
      'CI required check',
      'runtime Evidence satisfaction',
      'equivalence proof',
      'user acceptance automation',
    ],
  }
}

export function validateGraphDeltaCompatibleSource(source: GraphDeltaCompatibleSourceArtifact): void {
  const expectedFields: Array<[keyof GraphDeltaCompatibleSourceArtifact, unknown, string]> = [
    ['compatibleProposalSchema', compatibleProposalSchema, 'compatibleProposalSchema'],
    ['proposalOnly', true, 'proposalOnly'],
    ['graphSourceMutated', false, 'graphSourceMutated'],
    ['graphDeltaApplied', false, 'graphDeltaApplied'],
    ['requiresHumanReview', true, 'requiresHumanReview'],
    ['approvalStatus', 'not-approved', 'approvalStatus'],
  ]

  for (const [field, expected, label] of expectedFields) {
    if (source[field] !== expected) {
      throw new Error(`Unsafe graph-delta-compatible source boundary: ${label} must be ${JSON.stringify(expected)}.`)
    }
  }
}

function evidenceLinkCandidates(value: JsonRecord): CandidateLink[] {
  const candidates = [
    asCandidateLink(value.advisoryEvaluationJsonLinkCandidate),
    asCandidateLink(value.changedFileCollectionLinkCandidate),
    asCandidateLink(value.scopeFindingReviewNoteCandidate),
  ].filter((entry): entry is CandidateLink => Boolean(entry))
  return candidates.map(candidateOnlyLink)
}

function runtimeReportLinkCandidates(value: JsonRecord): CandidateLink[] {
  const candidates = [asCandidateLink(value.compactRuntimeReportLinkCandidate)].filter(
    (entry): entry is CandidateLink => Boolean(entry),
  )
  return candidates.map(candidateOnlyLink)
}

function candidateOnlyLink(value: CandidateLink): CandidateLink {
  return {
    ...value,
    acceptedEvidence: false,
    requiresHumanReview: true,
  }
}

function asCandidateLink(value: unknown): CandidateLink | undefined {
  return isRecord(value) ? { ...value } : undefined
}

function humanReviewQuestions(sourceRecordIdCandidate: string, sourceRecordIdAuthorityStatus: string): string[] {
  const questions = [
    `Confirm whether sourceRecordIdCandidate ${sourceRecordIdCandidate} is the correct graph-source record before any proposal apply path is considered.`,
    'Decide whether candidate Evidence/runtime report links should be accepted as Evidence under a future explicit policy.',
    'Decide a default graphDeltaPath/output policy before any tracked proposal output convention is introduced.',
  ]
  if (sourceRecordIdAuthorityStatus !== 'authoritative-graph-source-record') {
    questions.unshift('Source record identity remains candidate-only and requires human review.')
  }
  return questions
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {}
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath)
}
