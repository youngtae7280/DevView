import type {
  ContractCompilerPromotionReadiness,
  ContractIdBasedDiffSummary,
  ContractSemanticDiff,
} from './contract-semantic-diff.js'

export type ContractSourceAuthorityGapPreviewStatus =
  | 'contract-source-authority-gap-preview-pass'
  | 'contract-source-authority-gap-preview-not-run'

export interface ContractSourceAuthorityGapPreviewSummary {
  status: ContractSourceAuthorityGapPreviewStatus
  remainingLossCount: number
  remainingPolicyLossCount: number
  remainingSemanticLossCount: number
  fieldsRequiringSourceAuthority: string[]
  nextRecommendedResolver: string
  promotionBlockedBy: string[]
  equivalenceBlockedBy: string[]
}

export interface ContractSourceAuthorityGapPreviewArtifact {
  schemaVersion: 1
  artifactRole: 'contract-source-authority-gap-preview'
  status: ContractSourceAuthorityGapPreviewStatus
  sourceMode: 'contract-compiler-dry-run-v0.2-gap-preview'
  changeId: string
  diffReport: string
  outputRequirementPreservationStatus: string
  fieldGaps: ContractSourceAuthorityFieldGap[]
  summary: ContractSourceAuthorityGapPreviewSummary
  nonExecutionStatement: string
}

export interface ContractSourceAuthorityFieldGap {
  field: string
  currentDiffStatus: 'field-diff-detected' | 'field-diff-none'
  semanticClassifications: string[]
  missingIdsInGenerated: string[]
  extraIdsInGenerated: string[]
  likelyMissingSourceAuthority: string
  candidateSourceAuthorityType: string
  resolverRequired: boolean
  preservationStatus:
    | 'source-authority-gap-open'
    | 'source-authority-gap-review-required'
    | 'source-authority-preserved'
}

const fieldSourceAuthority: Record<
  string,
  { candidateSourceAuthorityType: string; likelyMissingSourceAuthority: string }
> = {
  allowedScope: {
    candidateSourceAuthorityType: 'scope-source-authority',
    likelyMissingSourceAuthority:
      'Allowed execution and evidence/write-target scope source authority is not yet complete.',
  },
  forbiddenScope: {
    candidateSourceAuthorityType: 'policy-forbidden-scope-source-authority',
    likelyMissingSourceAuthority:
      'Forbidden policy scope source authority does not yet preserve all hand-written forbidden scopes.',
  },
  requiredContext: {
    candidateSourceAuthorityType: 'context-source-authority',
    likelyMissingSourceAuthority:
      'Required context source authority does not yet preserve the hand-written context set.',
  },
  requiredEvidence: {
    candidateSourceAuthorityType: 'evidence-source-authority',
    likelyMissingSourceAuthority:
      'Evidence source authority and check binding do not yet preserve the hand-written Evidence chain.',
  },
  knownRisks: {
    candidateSourceAuthorityType: 'risk-source-authority',
    likelyMissingSourceAuthority: 'Risk source authority does not yet preserve the hand-written risk set.',
  },
  stopConditions: {
    candidateSourceAuthorityType: 'stop-condition-source-authority',
    likelyMissingSourceAuthority:
      'Stop-condition policy source authority does not yet preserve the hand-written stop-condition set.',
  },
}

export function buildContractSourceAuthorityGapPreview(input: {
  changeId: string
  diffReport: string
  idBasedSummaries: ContractIdBasedDiffSummary[]
  semanticDiffs: ContractSemanticDiff[]
  compilerPromotionReadiness: ContractCompilerPromotionReadiness
  equivalenceProven: boolean
  outputRequirementPreservationStatus: string
}): ContractSourceAuthorityGapPreviewArtifact {
  const fieldGaps = Object.keys(fieldSourceAuthority).map((field) =>
    buildFieldGap(field, input.idBasedSummaries, input.semanticDiffs),
  )
  const fieldsRequiringSourceAuthority = fieldGaps.filter((gap) => gap.resolverRequired).map((gap) => gap.field)
  const remainingPolicyLossCount = input.semanticDiffs.filter((diff) => diff.classification === 'policy-loss').length
  const remainingSemanticLossCount = input.semanticDiffs.filter(
    (diff) => diff.classification === 'semantic-loss',
  ).length
  const promotionBlockedBy = Array.from(
    new Set(
      input.semanticDiffs
        .filter((diff) => diff.promotionImpact === 'blocks-promotion')
        .map((diff) => diff.classification),
    ),
  ).sort()
  const summary: ContractSourceAuthorityGapPreviewSummary = {
    status: 'contract-source-authority-gap-preview-pass',
    remainingLossCount: remainingPolicyLossCount + remainingSemanticLossCount,
    remainingPolicyLossCount,
    remainingSemanticLossCount,
    fieldsRequiringSourceAuthority,
    nextRecommendedResolver: chooseNextRecommendedResolver(fieldGaps, input.semanticDiffs),
    promotionBlockedBy,
    equivalenceBlockedBy: fieldsRequiringSourceAuthority,
  }

  return {
    schemaVersion: 1,
    artifactRole: 'contract-source-authority-gap-preview',
    status: 'contract-source-authority-gap-preview-pass',
    sourceMode: 'contract-compiler-dry-run-v0.2-gap-preview',
    changeId: input.changeId,
    diffReport: input.diffReport,
    outputRequirementPreservationStatus: input.outputRequirementPreservationStatus,
    fieldGaps,
    summary,
    nonExecutionStatement:
      'This gap preview is non-enforcing review metadata only. It does not execute AI, apply graph deltas, accept work, enable required checks, configure branch protection, retire tree-native artifacts, or promote the compiler candidate.',
  }
}

export function buildNotRunContractSourceAuthorityGapPreview(
  changeId: string,
  diffReport: string,
): ContractSourceAuthorityGapPreviewArtifact {
  return {
    schemaVersion: 1,
    artifactRole: 'contract-source-authority-gap-preview',
    status: 'contract-source-authority-gap-preview-not-run',
    sourceMode: 'contract-compiler-dry-run-v0.2-gap-preview',
    changeId,
    diffReport,
    outputRequirementPreservationStatus: 'generated-output-requirements-not-preserved',
    fieldGaps: [],
    summary: {
      status: 'contract-source-authority-gap-preview-not-run',
      remainingLossCount: 0,
      remainingPolicyLossCount: 0,
      remainingSemanticLossCount: 0,
      fieldsRequiringSourceAuthority: [],
      nextRecommendedResolver: 'none',
      promotionBlockedBy: [],
      equivalenceBlockedBy: [],
    },
    nonExecutionStatement: 'This gap preview was not run because the compiler candidate or diff was not reviewable.',
  }
}

function buildFieldGap(
  field: string,
  idBasedSummaries: ContractIdBasedDiffSummary[],
  semanticDiffs: ContractSemanticDiff[],
): ContractSourceAuthorityFieldGap {
  const summary = idBasedSummaries.find((entry) => entry.field === field)
  const fieldSemanticDiffs = semanticDiffs.filter((diff) => diff.field === field)
  const semanticClassifications = Array.from(new Set(fieldSemanticDiffs.map((diff) => diff.classification))).sort()
  const hasBlockingLoss = fieldSemanticDiffs.some(
    (diff) =>
      diff.classification === 'semantic-loss' ||
      diff.classification === 'policy-loss' ||
      diff.promotionImpact === 'blocks-promotion',
  )
  const hasReviewDiff =
    fieldSemanticDiffs.length > 0 ||
    (summary !== undefined && (summary.missingIdsInGenerated.length > 0 || summary.extraIdsInGenerated.length > 0))
  const resolverRequired = hasReviewDiff
  const preservationStatus = hasBlockingLoss
    ? 'source-authority-gap-open'
    : hasReviewDiff
      ? 'source-authority-gap-review-required'
      : 'source-authority-preserved'

  return {
    field,
    currentDiffStatus: hasReviewDiff ? 'field-diff-detected' : 'field-diff-none',
    semanticClassifications,
    missingIdsInGenerated: summary?.missingIdsInGenerated || [],
    extraIdsInGenerated: summary?.extraIdsInGenerated || [],
    likelyMissingSourceAuthority: resolverRequired
      ? fieldSourceAuthority[field].likelyMissingSourceAuthority
      : 'No source-authority gap detected for the current dry-run diff.',
    candidateSourceAuthorityType: fieldSourceAuthority[field].candidateSourceAuthorityType,
    resolverRequired,
    preservationStatus,
  }
}

function chooseNextRecommendedResolver(
  fieldGaps: ContractSourceAuthorityFieldGap[],
  semanticDiffs: ContractSemanticDiff[],
): string {
  if (hasClassification(semanticDiffs, 'forbiddenScope', 'policy-loss')) {
    return 'policy-forbidden-scope-source-authority'
  }
  if (fieldGaps.some((gap) => gap.field === 'requiredEvidence' && gap.resolverRequired)) {
    return 'evidence-source-authority'
  }
  if (fieldGaps.some((gap) => gap.field === 'requiredContext' && gap.resolverRequired)) {
    return 'context-source-authority'
  }
  return fieldGaps.find((gap) => gap.resolverRequired)?.candidateSourceAuthorityType || 'none'
}

function hasClassification(semanticDiffs: ContractSemanticDiff[], field: string, classification: string): boolean {
  return semanticDiffs.some((diff) => diff.field === field && diff.classification === classification)
}
