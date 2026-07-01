export type ContractDiffStatus =
  | 'contract-diff-detected'
  | 'contract-diff-none'
  | 'contract-diff-not-run'
  | 'contract-diff-blocked'

export type ContractSemanticDiffClassification =
  | 'format-only'
  | 'metadata-only'
  | 'source-mode-metadata-only'
  | 'conservative-restriction'
  | 'policy-loss'
  | 'policy-expansion'
  | 'safe-additive'
  | 'validation-superset-review-only'
  | 'boundary-wording-review-required'
  | 'evidence-chain-mismatch'
  | 'output-requirement-loss'
  | 'semantic-loss'
  | 'unknown-review-required'

export type ContractSemanticReviewSeverity = 'none' | 'low' | 'medium' | 'high'

export type ContractSemanticPromotionImpact = 'none' | 'review-required' | 'blocks-promotion'

export type ContractCompilerPromotionReadiness =
  | 'compiler-promotion-not-ready'
  | 'compiler-promotion-review-required'
  | 'compiler-promotion-equivalence-candidate'

export type ContractSourceAuthorityPreservationStatus =
  | 'source-authority-preserved'
  | 'source-authority-gaps-present'
  | 'source-authority-not-reviewed'

export type ContractSemanticDiffPolicyStatus =
  | 'semantic-diff-clean'
  | 'semantic-diff-blocking-loss'
  | 'semantic-diff-unknown-review-required'
  | 'semantic-diff-not-reviewed'

export type ContractReviewOnlyDiffStatus =
  | 'review-only-diff-detected'
  | 'review-only-diff-none'
  | 'review-only-diff-not-reviewed'

export interface ContractEquivalenceReadinessPolicySummary {
  sourceAuthorityPreservationStatus: ContractSourceAuthorityPreservationStatus
  semanticDiffPolicyStatus: ContractSemanticDiffPolicyStatus
  reviewOnlyDiffStatus: ContractReviewOnlyDiffStatus
  blockingSemanticLossCount: number
  reviewOnlyDiffCount: number
  unknownDiffCount: number
  equivalenceCandidate: boolean
  equivalenceProven: false
  equivalenceProofStatus: 'equivalence-proof-policy-not-approved'
  compilerPromotionReadiness: ContractCompilerPromotionReadiness
  policyBoundary: string
}

export interface ContractIdBasedDiffSummary {
  field: string
  handWrittenCount: number
  generatedCount: number
  missingIdsInGenerated: string[]
  extraIdsInGenerated: string[]
}

export interface ContractSemanticDiff {
  field: string
  targetField: string
  diffDirection: ContractSemanticDiffDirection
  matchedRuleId: string
  classification: ContractSemanticDiffClassification
  reviewSeverity: ContractSemanticReviewSeverity
  promotionImpact: ContractSemanticPromotionImpact
  reason: string
  missingIdsInGenerated: string[]
  extraIdsInGenerated: string[]
}

export interface ContractSemanticDiffRule {
  ruleId: string
  targetField: string
  condition: ContractSemanticDiffDirection
  classification: ContractSemanticDiffClassification
  reviewSeverity: ContractSemanticReviewSeverity
  promotionImpact: ContractSemanticPromotionImpact
  reason: string
}

export interface ContractSemanticDiffRuleCoverage {
  totalDiffs: number
  classifiedDiffs: number
  unknownDiffs: number
  matchedRuleIds: string[]
  unknownFields: string[]
}

export const unknownSemanticDiffRuleId = 'semantic-diff-rule-unknown'

export type ContractSemanticDiffDirection = 'missingIdsInGenerated' | 'extraIdsInGenerated' | 'fieldDifferent'

export const contractSemanticDiffRules: readonly ContractSemanticDiffRule[] = [
  {
    ruleId: 'semantic-diff-rule-source-mode-field-metadata-only',
    targetField: 'sourceMode',
    condition: 'fieldDifferent',
    classification: 'source-mode-metadata-only',
    reviewSeverity: 'low',
    promotionImpact: 'review-required',
    reason:
      'The sourceMode differs because one artifact is hand-written and the other is compiler-produced; review provenance but do not treat this as execution-scope loss.',
  },
  {
    ruleId: 'semantic-diff-rule-allowed-scope-missing-conservative-restriction',
    targetField: 'allowedScope',
    condition: 'missingIdsInGenerated',
    classification: 'conservative-restriction',
    reviewSeverity: 'medium',
    promotionImpact: 'review-required',
    reason:
      'The generated candidate permits less execution scope than the hand-written contract; review before relying on the candidate.',
  },
  {
    ruleId: 'semantic-diff-rule-forbidden-scope-missing-policy-loss',
    targetField: 'forbiddenScope',
    condition: 'missingIdsInGenerated',
    classification: 'policy-loss',
    reviewSeverity: 'high',
    promotionImpact: 'blocks-promotion',
    reason:
      'The generated candidate is missing a forbidden policy scope from the hand-written contract, so promotion is not ready.',
  },
  {
    ruleId: 'semantic-diff-rule-forbidden-scope-extra-policy-expansion',
    targetField: 'forbiddenScope',
    condition: 'extraIdsInGenerated',
    classification: 'policy-expansion',
    reviewSeverity: 'low',
    promotionImpact: 'review-required',
    reason:
      'The generated candidate adds a forbidden policy scope beyond the hand-written contract; review the policy expansion.',
  },
  {
    ruleId: 'semantic-diff-rule-required-context-missing-semantic-loss',
    targetField: 'requiredContext',
    condition: 'missingIdsInGenerated',
    classification: 'semantic-loss',
    reviewSeverity: 'high',
    promotionImpact: 'blocks-promotion',
    reason:
      'The generated candidate is missing required context from the hand-written contract, so the contract context is not equivalent.',
  },
  {
    ruleId: 'semantic-diff-rule-required-context-extra-safe-additive',
    targetField: 'requiredContext',
    condition: 'extraIdsInGenerated',
    classification: 'safe-additive',
    reviewSeverity: 'low',
    promotionImpact: 'review-required',
    reason:
      'The generated candidate adds required context beyond the hand-written contract; this is additive but still review-only.',
  },
  {
    ruleId: 'semantic-diff-rule-required-checks-extra-safe-additive',
    targetField: 'requiredChecks',
    condition: 'extraIdsInGenerated',
    classification: 'validation-superset-review-only',
    reviewSeverity: 'low',
    promotionImpact: 'review-required',
    reason:
      'The generated candidate adds the read-model health check beyond the hand-written contract; this is a validation superset for review only, not execution approval.',
  },
  {
    ruleId: 'semantic-diff-rule-required-checks-missing-evidence-chain-mismatch',
    targetField: 'requiredChecks',
    condition: 'missingIdsInGenerated',
    classification: 'evidence-chain-mismatch',
    reviewSeverity: 'high',
    promotionImpact: 'blocks-promotion',
    reason:
      'The generated candidate is missing a required check from the hand-written contract, so its Evidence chain is incomplete.',
  },
  {
    ruleId: 'semantic-diff-rule-required-evidence-missing-semantic-loss',
    targetField: 'requiredEvidence',
    condition: 'missingIdsInGenerated',
    classification: 'semantic-loss',
    reviewSeverity: 'high',
    promotionImpact: 'blocks-promotion',
    reason:
      'The generated candidate is missing required Evidence from the hand-written contract, so semantic equivalence is not ready.',
  },
  {
    ruleId: 'semantic-diff-rule-required-evidence-extra-evidence-chain-mismatch',
    targetField: 'requiredEvidence',
    condition: 'extraIdsInGenerated',
    classification: 'evidence-chain-mismatch',
    reviewSeverity: 'medium',
    promotionImpact: 'review-required',
    reason:
      'The generated candidate adds required Evidence beyond the hand-written contract; review the Evidence chain before promotion.',
  },
  {
    ruleId: 'semantic-diff-rule-known-risks-missing-semantic-loss',
    targetField: 'knownRisks',
    condition: 'missingIdsInGenerated',
    classification: 'semantic-loss',
    reviewSeverity: 'high',
    promotionImpact: 'blocks-promotion',
    reason:
      'The generated candidate is missing a known risk from the hand-written contract, so risk semantics are not preserved.',
  },
  {
    ruleId: 'semantic-diff-rule-known-risks-extra-safe-additive',
    targetField: 'knownRisks',
    condition: 'extraIdsInGenerated',
    classification: 'safe-additive',
    reviewSeverity: 'low',
    promotionImpact: 'review-required',
    reason:
      'The generated candidate adds a known risk beyond the hand-written contract; this is additive but still review-only.',
  },
  {
    ruleId: 'semantic-diff-rule-stop-conditions-missing-policy-loss',
    targetField: 'stopConditions',
    condition: 'missingIdsInGenerated',
    classification: 'policy-loss',
    reviewSeverity: 'high',
    promotionImpact: 'blocks-promotion',
    reason:
      'The generated candidate is missing a stop condition from the hand-written contract, so safety policy coverage is not equivalent.',
  },
  {
    ruleId: 'semantic-diff-rule-stop-conditions-extra-policy-expansion',
    targetField: 'stopConditions',
    condition: 'extraIdsInGenerated',
    classification: 'policy-expansion',
    reviewSeverity: 'low',
    promotionImpact: 'review-required',
    reason:
      'The generated candidate adds a stop condition beyond the hand-written contract; review the policy expansion.',
  },
  {
    ruleId: 'semantic-diff-rule-non-execution-statement-field-metadata-only',
    targetField: 'nonExecutionStatement',
    condition: 'fieldDifferent',
    classification: 'boundary-wording-review-required',
    reviewSeverity: 'medium',
    promotionImpact: 'review-required',
    reason:
      'The nonExecutionStatement wording differs between hand-written and compiler-produced artifacts; a human reviewer must confirm the wording preserves non-execution, non-approval, non-enforcement, and no graph-delta boundaries.',
  },
  {
    ruleId: 'semantic-diff-rule-output-requirements-field-output-requirement-loss',
    targetField: 'outputRequirements',
    condition: 'fieldDifferent',
    classification: 'output-requirement-loss',
    reviewSeverity: 'high',
    promotionImpact: 'blocks-promotion',
    reason:
      'The generated candidate does not preserve the hand-written output reporting obligations for changed files and command-derived Evidence status; output requirements are not equivalent.',
  },
]

export function classifyContractDiffSemantics(
  idBasedSummaries: ContractIdBasedDiffSummary[],
  differingFields: string[],
  status: ContractDiffStatus,
): {
  semanticDiffs: ContractSemanticDiff[]
  semanticClassificationCounts: Record<string, number>
  highestReviewSeverity: ContractSemanticReviewSeverity
  compilerPromotionReadiness: ContractCompilerPromotionReadiness
  semanticDiffRuleCoverage: ContractSemanticDiffRuleCoverage
} {
  if (status === 'contract-diff-blocked' || status === 'contract-diff-not-run') {
    return buildSemanticSummary([], 'compiler-promotion-not-ready')
  }

  if (differingFields.length === 0) {
    return buildSemanticSummary([], 'compiler-promotion-equivalence-candidate')
  }

  const semanticDiffs = idBasedSummaries.flatMap((summary) => classifyIdBasedDiffSummary(summary))
  const semanticallyCoveredFields = new Set(semanticDiffs.map((diff) => diff.field))
  const fieldLevelDiffs = differingFields
    .filter((field) => !semanticallyCoveredFields.has(field))
    .map((field) => buildFieldLevelSemanticDiff(field))
  const allSemanticDiffs = [...semanticDiffs, ...fieldLevelDiffs]

  return buildSemanticSummary(allSemanticDiffs, deriveCompilerPromotionReadiness(allSemanticDiffs))
}

function buildSemanticSummary(
  semanticDiffs: ContractSemanticDiff[],
  compilerPromotionReadiness: ContractCompilerPromotionReadiness,
): {
  semanticDiffs: ContractSemanticDiff[]
  semanticClassificationCounts: Record<string, number>
  highestReviewSeverity: ContractSemanticReviewSeverity
  compilerPromotionReadiness: ContractCompilerPromotionReadiness
  semanticDiffRuleCoverage: ContractSemanticDiffRuleCoverage
} {
  const semanticClassificationCounts = semanticDiffs.reduce<Record<string, number>>((counts, diff) => {
    counts[diff.classification] = (counts[diff.classification] || 0) + 1
    return counts
  }, {})
  const highestReviewSeverity = semanticDiffs.reduce<ContractSemanticReviewSeverity>(
    (highest, diff) => higherSeverity(highest, diff.reviewSeverity),
    'none',
  )
  const matchedRuleIds = Array.from(new Set(semanticDiffs.map((diff) => diff.matchedRuleId))).sort()
  const unknownDiffs = semanticDiffs.filter((diff) => diff.matchedRuleId === unknownSemanticDiffRuleId).length
  const unknownFields = Array.from(
    new Set(
      semanticDiffs.filter((diff) => diff.matchedRuleId === unknownSemanticDiffRuleId).map((diff) => diff.targetField),
    ),
  ).sort()

  return {
    semanticDiffs,
    semanticClassificationCounts,
    highestReviewSeverity,
    compilerPromotionReadiness,
    semanticDiffRuleCoverage: {
      totalDiffs: semanticDiffs.length,
      classifiedDiffs: semanticDiffs.length - unknownDiffs,
      unknownDiffs,
      matchedRuleIds,
      unknownFields,
    },
  }
}

function classifyIdBasedDiffSummary(summary: ContractIdBasedDiffSummary): ContractSemanticDiff[] {
  const diffs: ContractSemanticDiff[] = []
  if (summary.missingIdsInGenerated.length > 0) {
    diffs.push(buildSemanticDiff(summary, 'missingIdsInGenerated'))
  }
  if (summary.extraIdsInGenerated.length > 0) {
    diffs.push(buildSemanticDiff(summary, 'extraIdsInGenerated'))
  }
  return diffs
}

function buildSemanticDiff(
  summary: ContractIdBasedDiffSummary,
  condition: ContractSemanticDiffDirection,
): ContractSemanticDiff {
  const rule = contractSemanticDiffRules.find(
    (entry) => entry.targetField === summary.field && entry.condition === condition,
  )
  const missingIdsInGenerated = condition === 'missingIdsInGenerated' ? summary.missingIdsInGenerated : []
  const extraIdsInGenerated = condition === 'extraIdsInGenerated' ? summary.extraIdsInGenerated : []
  if (!rule) {
    return buildUnknownSemanticDiff(
      summary.field,
      condition,
      'no-semantic-rule-for-direction; manual-review-required',
      missingIdsInGenerated,
      extraIdsInGenerated,
    )
  }
  return {
    field: summary.field,
    targetField: summary.field,
    diffDirection: condition,
    matchedRuleId: rule.ruleId,
    classification: rule.classification,
    reviewSeverity: rule.reviewSeverity,
    promotionImpact: rule.promotionImpact,
    reason: rule.reason,
    missingIdsInGenerated,
    extraIdsInGenerated,
  }
}

function buildFieldLevelSemanticDiff(field: string): ContractSemanticDiff {
  const rule = contractSemanticDiffRules.find(
    (entry) => entry.targetField === field && entry.condition === 'fieldDifferent',
  )
  if (!rule) {
    return buildUnknownSemanticDiff(
      field,
      'fieldDifferent',
      'id-summary-not-available; no-semantic-rule-for-field; manual-review-required',
    )
  }
  return {
    field,
    targetField: field,
    diffDirection: 'fieldDifferent',
    matchedRuleId: rule.ruleId,
    classification: rule.classification,
    reviewSeverity: rule.reviewSeverity,
    promotionImpact: rule.promotionImpact,
    reason: rule.reason,
    missingIdsInGenerated: [],
    extraIdsInGenerated: [],
  }
}

function buildUnknownSemanticDiff(
  field: string,
  diffDirection: ContractSemanticDiffDirection,
  reason: string,
  missingIdsInGenerated: string[] = [],
  extraIdsInGenerated: string[] = [],
): ContractSemanticDiff {
  return {
    field,
    targetField: field,
    diffDirection,
    matchedRuleId: unknownSemanticDiffRuleId,
    classification: 'unknown-review-required',
    reviewSeverity: 'medium',
    promotionImpact: 'review-required',
    reason,
    missingIdsInGenerated,
    extraIdsInGenerated,
  }
}

export function deriveCompilerPromotionReadiness(
  semanticDiffs: ContractSemanticDiff[],
): ContractCompilerPromotionReadiness {
  if (semanticDiffs.length === 0) {
    return 'compiler-promotion-equivalence-candidate'
  }
  if (
    semanticDiffs.some(
      (diff) =>
        diff.classification === 'semantic-loss' ||
        diff.classification === 'policy-loss' ||
        diff.classification === 'output-requirement-loss' ||
        diff.classification === 'unknown-review-required' ||
        (diff.field === 'allowedScope' && diff.classification === 'conservative-restriction') ||
        diff.reviewSeverity === 'high' ||
        diff.promotionImpact === 'blocks-promotion',
    )
  ) {
    return 'compiler-promotion-not-ready'
  }
  return 'compiler-promotion-review-required'
}

export function deriveContractEquivalenceReadinessPolicy(input: {
  semanticDiffs: ContractSemanticDiff[]
  semanticDiffRuleCoverage: ContractSemanticDiffRuleCoverage
  compilerPromotionReadiness: ContractCompilerPromotionReadiness
  isReviewable: boolean
}): ContractEquivalenceReadinessPolicySummary {
  if (!input.isReviewable) {
    return {
      sourceAuthorityPreservationStatus: 'source-authority-not-reviewed',
      semanticDiffPolicyStatus: 'semantic-diff-not-reviewed',
      reviewOnlyDiffStatus: 'review-only-diff-not-reviewed',
      blockingSemanticLossCount: 0,
      reviewOnlyDiffCount: 0,
      unknownDiffCount: input.semanticDiffRuleCoverage.unknownDiffs,
      equivalenceCandidate: false,
      equivalenceProven: false,
      equivalenceProofStatus: 'equivalence-proof-policy-not-approved',
      compilerPromotionReadiness: input.compilerPromotionReadiness,
      policyBoundary: equivalencePolicyBoundary,
    }
  }

  const blockingSemanticLossCount = input.semanticDiffs.filter(isBlockingSemanticLoss).length
  const sourceAuthorityGapCount = input.semanticDiffs.filter(isSourceAuthorityGapDiff).length
  const reviewOnlyDiffCount = input.semanticDiffs.filter(isReviewOnlyDiff).length
  const unknownDiffCount = input.semanticDiffRuleCoverage.unknownDiffs
  const semanticDiffPolicyStatus =
    unknownDiffCount > 0
      ? 'semantic-diff-unknown-review-required'
      : blockingSemanticLossCount > 0
        ? 'semantic-diff-blocking-loss'
        : 'semantic-diff-clean'
  const sourceAuthorityPreservationStatus =
    sourceAuthorityGapCount === 0 ? 'source-authority-preserved' : 'source-authority-gaps-present'
  const reviewOnlyDiffStatus = reviewOnlyDiffCount > 0 ? 'review-only-diff-detected' : 'review-only-diff-none'
  const equivalenceCandidate =
    sourceAuthorityPreservationStatus === 'source-authority-preserved' &&
    semanticDiffPolicyStatus === 'semantic-diff-clean' &&
    unknownDiffCount === 0 &&
    input.compilerPromotionReadiness !== 'compiler-promotion-not-ready'

  return {
    sourceAuthorityPreservationStatus,
    semanticDiffPolicyStatus,
    reviewOnlyDiffStatus,
    blockingSemanticLossCount,
    reviewOnlyDiffCount,
    unknownDiffCount,
    equivalenceCandidate,
    equivalenceProven: false,
    equivalenceProofStatus: 'equivalence-proof-policy-not-approved',
    compilerPromotionReadiness: input.compilerPromotionReadiness,
    policyBoundary: equivalencePolicyBoundary,
  }
}

const equivalencePolicyBoundary =
  'Equivalence candidate status is review metadata only. equivalenceProven remains false until an approved equivalence policy and human review explicitly promote it.'

function isBlockingSemanticLoss(diff: ContractSemanticDiff): boolean {
  return (
    diff.classification === 'semantic-loss' ||
    diff.classification === 'policy-loss' ||
    diff.classification === 'evidence-chain-mismatch' ||
    diff.classification === 'output-requirement-loss' ||
    diff.promotionImpact === 'blocks-promotion' ||
    diff.reviewSeverity === 'high'
  )
}

function isSourceAuthorityGapDiff(diff: ContractSemanticDiff): boolean {
  return (
    isBlockingSemanticLoss(diff) ||
    diff.classification === 'unknown-review-required' ||
    (diff.field === 'allowedScope' && diff.classification === 'conservative-restriction')
  )
}

function isReviewOnlyDiff(diff: ContractSemanticDiff): boolean {
  if (isSourceAuthorityGapDiff(diff)) {
    return false
  }
  return (
    diff.classification === 'format-only' ||
    diff.classification === 'metadata-only' ||
    diff.classification === 'source-mode-metadata-only' ||
    diff.classification === 'safe-additive' ||
    diff.classification === 'validation-superset-review-only' ||
    diff.classification === 'boundary-wording-review-required' ||
    diff.classification === 'policy-expansion'
  )
}

function higherSeverity(
  left: ContractSemanticReviewSeverity,
  right: ContractSemanticReviewSeverity,
): ContractSemanticReviewSeverity {
  const order: Record<ContractSemanticReviewSeverity, number> = { none: 0, low: 1, medium: 2, high: 3 }
  return order[right] > order[left] ? right : left
}
