import path from 'node:path'
import { format } from 'prettier'
import { readJsonSafe, relativePath, writeTextAtomic } from './fs.js'
import { validateExecutionContract } from './compiler-boundary.js'
import { validateCompilerInputDryRun, validateCompilerInputSchema } from './compiler-input-model.js'

export type ContractCompilerDryRunStatus = 'contract-compiler-dry-run-pass' | 'contract-compiler-dry-run-blocked'

export interface ContractCompilerDryRunReport {
  status: ContractCompilerDryRunStatus
  inputModelStatus: 'compiler-input-model-pass' | 'compiler-input-model-blocked'
  candidateStatus: 'contract-candidate-pass' | 'contract-candidate-blocked' | 'contract-candidate-not-run'
  paths: {
    inputSchema: string
    dryRunInput: string
    outputCandidate: string
    handWrittenDryRunContract: string
    diffReport: string
  }
  candidate: {
    changeId: string
    changeType: string
    goal: string
    allowedScopeCount: number
    forbiddenScopeCount: number
    requiredCheckCount: number
    requiredEvidenceCount: number
    stopConditionCount: number
  }
  candidateDiff: {
    status: 'contract-diff-detected' | 'contract-diff-none' | 'contract-diff-not-run' | 'contract-diff-blocked'
    reviewStatus: 'non-blocking-review-diff' | 'no-review-diff' | 'review-diff-not-run' | 'review-diff-blocked'
    equivalenceStatus:
      | 'compiler-equivalence-not-proven'
      | 'compiler-equivalence-field-match'
      | 'compiler-equivalence-not-run'
      | 'compiler-equivalence-blocked'
    differingFieldCount: number
    differingFields: string[]
    idBasedSummaries: Array<{
      field: string
      handWrittenCount: number
      generatedCount: number
      missingIdsInGenerated: string[]
      extraIdsInGenerated: string[]
    }>
    semanticDiffs: ContractSemanticDiff[]
    semanticClassificationCounts: Record<string, number>
    highestReviewSeverity: ContractSemanticReviewSeverity
    compilerPromotionReadiness: ContractCompilerPromotionReadiness
    reviewBoundary: string
  }
  blockingReasons: string[]
  warnings: string[]
  nonExecutionStatement: string
  compilerBoundary: string
}

export type ContractSemanticDiffClassification =
  | 'conservative-restriction'
  | 'policy-loss'
  | 'policy-expansion'
  | 'safe-additive'
  | 'evidence-chain-mismatch'
  | 'semantic-loss'
  | 'unknown-review-required'

export type ContractSemanticReviewSeverity = 'none' | 'low' | 'medium' | 'high'

export type ContractSemanticPromotionImpact = 'none' | 'review-required' | 'blocks-promotion'

export type ContractCompilerPromotionReadiness =
  | 'compiler-promotion-not-ready'
  | 'compiler-promotion-review-required'
  | 'compiler-promotion-equivalence-candidate'

export interface ContractIdBasedDiffSummary {
  field: string
  handWrittenCount: number
  generatedCount: number
  missingIdsInGenerated: string[]
  extraIdsInGenerated: string[]
}

export interface ContractSemanticDiff {
  field: string
  classification: ContractSemanticDiffClassification
  reviewSeverity: ContractSemanticReviewSeverity
  promotionImpact: ContractSemanticPromotionImpact
  reason: string
  missingIdsInGenerated: string[]
  extraIdsInGenerated: string[]
}

const inputSchemaPath = 'examples/read-model-aggregate/compiler-input-model-schema.json'
const dryRunInputPath = 'examples/read-model-aggregate/generated/compiler-input-model-dry-run.json'
const handWrittenDryRunContractPath = 'examples/read-model-aggregate/generated/execution-contract-dry-run.json'
const defaultOutputCandidatePath = 'examples/read-model-aggregate/generated/execution-contract-dry-run.generated.json'
const defaultDiffReportPath = 'examples/read-model-aggregate/generated/execution-contract-dry-run.diff.json'

export async function compileExecutionContractDryRun(
  root: string,
  options: { output?: string; diffOutput?: string; writeOutput?: boolean } = {},
): Promise<ContractCompilerDryRunReport> {
  const outputCandidatePath = options.output || defaultOutputCandidatePath
  const diffReportPath = options.diffOutput || defaultDiffReportPath
  const schemaResult = await readJsonSafe<unknown>(path.resolve(root, inputSchemaPath))
  const inputResult = await readJsonSafe<unknown>(path.resolve(root, dryRunInputPath))

  const inputBlocking: string[] = []
  const compilerBlocking: string[] = []
  const candidateBlocking: string[] = []
  const warnings: string[] = []
  let compilerAttempted = false

  if (!schemaResult.ok) {
    inputBlocking.push(`Unable to read compiler input schema: ${schemaResult.error}`)
  } else {
    const schemaIssues = validateCompilerInputSchema(schemaResult.value)
    inputBlocking.push(...schemaIssues.blocking.map((reason) => `compiler input schema: ${reason}`))
    warnings.push(...schemaIssues.warnings.map((reason) => `compiler input schema: ${reason}`))
  }

  let candidate: Record<string, unknown> | undefined
  if (!inputResult.ok) {
    inputBlocking.push(`Unable to read compiler input dry-run input: ${inputResult.error}`)
  } else {
    const inputIssues = await validateCompilerInputDryRun(inputResult.value, root)
    inputBlocking.push(...inputIssues.blocking.map((reason) => `compiler input dry-run: ${reason}`))
    warnings.push(...inputIssues.warnings.map((reason) => `compiler input dry-run: ${reason}`))
    if (inputIssues.blocking.length === 0) {
      const input = asRecord(inputResult.value)
      const unsupported = validateSupportedInput(input)
      compilerBlocking.push(...unsupported)
      if (unsupported.length === 0) {
        compilerAttempted = true
        const compileResult = compileBugFixContractCandidate(input)
        compilerBlocking.push(...compileResult.blocking)
        candidate = compileResult.candidate
      }
      if (candidate) {
        const candidateIssues = validateExecutionContract(candidate)
        candidateBlocking.push(...candidateIssues.blocking.map((reason) => `compiled contract candidate: ${reason}`))
        warnings.push(...candidateIssues.warnings.map((reason) => `compiled contract candidate: ${reason}`))
      }
    }
  }

  const candidateDiff = candidate
    ? await buildContractDiffReport(root, candidate, outputCandidatePath, handWrittenDryRunContractPath)
    : buildNotRunDiffReport(outputCandidatePath, handWrittenDryRunContractPath)
  if (candidateDiff.status === 'contract-diff-blocked') {
    candidateBlocking.push(...candidateDiff.blockingReasons.map((reason) => `compiled contract diff: ${reason}`))
  }

  const blockingReasons = [...inputBlocking, ...compilerBlocking, ...candidateBlocking]
  const candidateStatus =
    candidate === undefined
      ? compilerAttempted
        ? 'contract-candidate-blocked'
        : 'contract-candidate-not-run'
      : candidateBlocking.length > 0
        ? 'contract-candidate-blocked'
        : 'contract-candidate-pass'
  const inputModelStatus = inputBlocking.length > 0 ? 'compiler-input-model-blocked' : 'compiler-input-model-pass'
  const status = blockingReasons.length === 0 ? 'contract-compiler-dry-run-pass' : 'contract-compiler-dry-run-blocked'

  if (status === 'contract-compiler-dry-run-pass' && candidate && options.writeOutput !== false) {
    await writeFormattedJson(path.resolve(root, outputCandidatePath), candidate)
    await writeFormattedJson(path.resolve(root, diffReportPath), stripInternalDiffFields(candidateDiff))
  }

  return {
    status,
    inputModelStatus,
    candidateStatus,
    paths: {
      inputSchema: inputSchemaPath,
      dryRunInput: dryRunInputPath,
      outputCandidate: relativePath(root, path.resolve(root, outputCandidatePath)),
      handWrittenDryRunContract: handWrittenDryRunContractPath,
      diffReport: relativePath(root, path.resolve(root, diffReportPath)),
    },
    candidate: summarizeCandidate(candidate),
    candidateDiff: {
      status: candidateDiff.status,
      reviewStatus: candidateDiff.reviewStatus,
      equivalenceStatus: candidateDiff.equivalenceStatus,
      differingFieldCount: candidateDiff.differingFields.length,
      differingFields: candidateDiff.differingFields,
      idBasedSummaries: candidateDiff.idBasedSummaries,
      semanticDiffs: candidateDiff.semanticDiffs,
      semanticClassificationCounts: candidateDiff.semanticClassificationCounts,
      highestReviewSeverity: candidateDiff.highestReviewSeverity,
      compilerPromotionReadiness: candidateDiff.compilerPromotionReadiness,
      reviewBoundary: candidateDiff.reviewBoundary,
    },
    blockingReasons,
    warnings,
    nonExecutionStatement:
      'Contract Compiler Dry-Run v0.1 is local/non-enforcing Evidence only. It compiles a deterministic candidate from committed input fixtures and does not execute AI, apply graph deltas, accept work, enable required checks, or retire tree-native artifacts.',
    compilerBoundary:
      'Compiler Dry-Run v0.1 supports only the current bug_fix compiler input fixture and must feed its candidate back through the Contract Fixture Validator.',
  }
}

function validateSupportedInput(input: Record<string, unknown>): string[] {
  const blocking: string[] = []
  const packSchema = asRecord(input.packSchema)
  if (packSchema.id !== 'pack-schema-bug-fix') {
    blocking.push(`Contract Compiler Dry-Run v0.1 only supports pack-schema-bug-fix; got ${String(packSchema.id)}.`)
  }
  if (packSchema.changeType !== 'bug_fix') {
    blocking.push(
      `Contract Compiler Dry-Run v0.1 only supports bug_fix changeType; got ${String(packSchema.changeType)}.`,
    )
  }
  return blocking
}

function compileBugFixContractCandidate(input: Record<string, unknown>): {
  candidate: Record<string, unknown> | undefined
  blocking: string[]
} {
  const blocking: string[] = []
  const humanRequest = asRecord(input.humanRequest)
  const graphSnapshot = asRecord(input.graphSnapshot)
  const policySnapshot = asRecord(input.policySnapshot)
  const evidenceIndex = asRecord(input.evidenceIndex)
  const targetScopes = arrayValue(input.targetScopeCandidates)

  const allowedScope = targetScopes.map((scope) => ({
    id: stringValue(scope.id),
    scopeKind: stringValue(scope.scopeKind),
    paths: stringArrayValue(scope.paths),
    derivedFrom: stringArrayValue(scope.derivedFrom),
  }))
  const runtimeFixtureDir = findRuntimeFixtureDir(allowedScope)
  const requiredChecks = [
    ...(runtimeFixtureDir
      ? [
          {
            id: 'check-todo-search-runtime-fixture',
            command: `npx vitest run ${runtimeFixtureDir}`,
            validates: allowedScope.flatMap((scope) => scope.paths),
          },
        ]
      : []),
    {
      id: 'check-read-model-validate-all',
      command: 'node dist/cli/index.js graph read-model validate --all --json',
      validates: ['examples/read-model-aggregate/read-model-slices.json'],
    },
    {
      id: 'check-read-model-health-report',
      command: 'node dist/cli/index.js graph read-model report-health --json',
      validates: ['examples/read-model-aggregate/generated/read-model-health-report-output.json'],
    },
    {
      id: 'check-read-model-e2e',
      command: 'npm run test:read-model:e2e',
      validates: ['examples/read-model-aggregate/graph-source-transition-status.json'],
    },
  ]
  const requiredCheckIds = new Set(requiredChecks.map((check) => check.id))
  const evidenceMappings = buildEvidenceCheckMapping(policySnapshot)
  if (evidenceMappings.size === 0) {
    blocking.push('Contract Compiler Dry-Run v0.1 requires policySnapshot.evidenceCheckMappings.')
  }
  const requiredEvidence = arrayValue(evidenceIndex.entries)
    .map((entry) => {
      const evidenceType = stringValue(entry.evidenceType)
      const mapping = evidenceMappings.get(evidenceType)
      if (!mapping) {
        blocking.push(`Contract Compiler Dry-Run v0.1 has no evidenceCheckMapping for evidenceType: ${evidenceType}.`)
        return undefined
      }
      if (!requiredCheckIds.has(mapping.requiredCheckId)) {
        blocking.push(
          `Contract Compiler Dry-Run v0.1 policySnapshot.evidenceCheckMappings for evidenceType ${evidenceType} references unknown required check id: ${mapping.requiredCheckId}. Known check ids: ${Array.from(
            requiredCheckIds,
          ).join(', ')}.`,
        )
        return undefined
      }
      return {
        id: stringValue(entry.id),
        evidenceType: mapping.compiledEvidenceType,
        fromCheck: mapping.requiredCheckId,
        freshness: stringValue(entry.freshness),
      }
    })
    .filter((entry): entry is { id: string; evidenceType: string; fromCheck: string; freshness: string } =>
      Boolean(entry),
    )

  const forbiddenScope = arrayValue(policySnapshot.forbiddenScopeRules).map((rule) => ({
    id: stringValue(rule.id),
    scopeKind: stringValue(rule.scopeKind),
    paths: stringArrayValue(rule.paths),
    derivedFrom: stringArrayValue(rule.derivedFrom),
  }))
  if (forbiddenScope.length === 0) {
    blocking.push('Contract Compiler Dry-Run v0.1 requires policySnapshot.forbiddenScopeRules.')
  }

  if (blocking.length > 0) {
    return { candidate: undefined, blocking }
  }

  return {
    candidate: {
      schemaVersion: 1,
      artifactRole: 'execution-contract-dry-run',
      status: 'contract-dry-run-valid',
      sourceMode: 'contract-compiler-dry-run-v0',
      changeId: stringValue(input.changeId),
      changeType: 'bug_fix',
      goal: stringValue(humanRequest.text),
      allowedScope,
      forbiddenScope,
      requiredContext: arrayValue(graphSnapshot.artifacts).map((artifact) => ({
        id: `context-${stringValue(artifact.id)}`,
        artifact: stringValue(artifact.path),
        role: stringValue(artifact.role),
      })),
      requiredChecks,
      requiredEvidence,
      knownRisks: [
        {
          id: 'risk-compiler-dry-run-scope-drift',
          severity: 'warning',
          status: 'tracked',
          mitigation: 'Compiled candidate must pass Contract Fixture Validator before it can be reviewed.',
        },
      ],
      openUnknowns: [],
      humanDecisions: [],
      stopConditions: [
        {
          id: 'stop-if-input-model-drifts',
          condition: 'Compiler input model validation or graph-source cross-reference validation blocks.',
          action: 'stop-and-request-human-decision',
        },
        {
          id: 'stop-if-required-check-unavailable',
          condition: 'Required runtime, health, validate-all, or E2E checks cannot be executed.',
          action: 'stop-and-record-missing-evidence',
        },
      ],
      outputRequirements: [
        'Report compiler input status from graph read-model report-compiler-input only.',
        'Report compiled contract candidate status from Contract Fixture Validator output only.',
        'Report generated-versus-handwritten dry-run diff status before relying on the candidate.',
        'Do not treat this dry-run candidate as execution, user acceptance, required check, or branch protection.',
      ],
      nonExecutionStatement:
        'This compiler-produced execution contract candidate is dry-run only. It does not execute work, enable required checks, apply graph deltas, or accept the change.',
    },
    blocking: [],
  }
}

function buildEvidenceCheckMapping(
  policySnapshot: Record<string, unknown>,
): Map<string, { requiredCheckId: string; compiledEvidenceType: string }> {
  const mappings = new Map<string, { requiredCheckId: string; compiledEvidenceType: string }>()
  for (const mapping of arrayValue(policySnapshot.evidenceCheckMappings)) {
    const evidenceType = stringValue(mapping.evidenceType)
    if (!evidenceType) continue
    mappings.set(evidenceType, {
      requiredCheckId: stringValue(mapping.requiredCheckId),
      compiledEvidenceType: stringValue(mapping.compiledEvidenceType),
    })
  }
  return mappings
}

export type ContractDiffStatus =
  | 'contract-diff-detected'
  | 'contract-diff-none'
  | 'contract-diff-not-run'
  | 'contract-diff-blocked'

interface ContractDiffReportInternal {
  schemaVersion: 1
  artifactRole: 'execution-contract-dry-run-diff-report'
  status: ContractDiffStatus
  reviewStatus: 'non-blocking-review-diff' | 'no-review-diff' | 'review-diff-not-run' | 'review-diff-blocked'
  equivalenceStatus:
    | 'compiler-equivalence-not-proven'
    | 'compiler-equivalence-field-match'
    | 'compiler-equivalence-not-run'
    | 'compiler-equivalence-blocked'
  sourceCandidate: string
  comparedWith: string
  differingFields: string[]
  comparedFields: Array<{ field: string; status: 'same' | 'different' }>
  idBasedSummaries: ContractIdBasedDiffSummary[]
  semanticDiffs: ContractSemanticDiff[]
  semanticClassificationCounts: Record<string, number>
  highestReviewSeverity: ContractSemanticReviewSeverity
  compilerPromotionReadiness: ContractCompilerPromotionReadiness
  blockingReasons: string[]
  reviewBoundary: string
  nonExecutionStatement: string
}

const semanticDiffRules: Array<{
  field: string
  direction: 'missing' | 'extra'
  classification: ContractSemanticDiffClassification
  reviewSeverity: ContractSemanticReviewSeverity
  promotionImpact: ContractSemanticPromotionImpact
  reason: string
}> = [
  {
    field: 'allowedScope',
    direction: 'missing',
    classification: 'conservative-restriction',
    reviewSeverity: 'medium',
    promotionImpact: 'review-required',
    reason:
      'The generated candidate permits less execution scope than the hand-written contract; review before relying on the candidate.',
  },
  {
    field: 'forbiddenScope',
    direction: 'missing',
    classification: 'policy-loss',
    reviewSeverity: 'high',
    promotionImpact: 'blocks-promotion',
    reason:
      'The generated candidate is missing a forbidden policy scope from the hand-written contract, so promotion is not ready.',
  },
  {
    field: 'forbiddenScope',
    direction: 'extra',
    classification: 'policy-expansion',
    reviewSeverity: 'low',
    promotionImpact: 'review-required',
    reason:
      'The generated candidate adds a forbidden policy scope beyond the hand-written contract; review the policy expansion.',
  },
  {
    field: 'requiredChecks',
    direction: 'extra',
    classification: 'safe-additive',
    reviewSeverity: 'low',
    promotionImpact: 'review-required',
    reason:
      'The generated candidate adds a required check beyond the hand-written contract; this is additive but still review-only.',
  },
  {
    field: 'requiredChecks',
    direction: 'missing',
    classification: 'evidence-chain-mismatch',
    reviewSeverity: 'high',
    promotionImpact: 'blocks-promotion',
    reason:
      'The generated candidate is missing a required check from the hand-written contract, so its Evidence chain is incomplete.',
  },
  {
    field: 'requiredEvidence',
    direction: 'missing',
    classification: 'semantic-loss',
    reviewSeverity: 'high',
    promotionImpact: 'blocks-promotion',
    reason:
      'The generated candidate is missing required Evidence from the hand-written contract, so semantic equivalence is not ready.',
  },
  {
    field: 'requiredEvidence',
    direction: 'extra',
    classification: 'evidence-chain-mismatch',
    reviewSeverity: 'medium',
    promotionImpact: 'review-required',
    reason:
      'The generated candidate adds required Evidence beyond the hand-written contract; review the Evidence chain before promotion.',
  },
]

const comparedContractFields = [
  'sourceMode',
  'changeType',
  'goal',
  'allowedScope',
  'forbiddenScope',
  'requiredContext',
  'requiredChecks',
  'requiredEvidence',
  'knownRisks',
  'openUnknowns',
  'humanDecisions',
  'stopConditions',
  'outputRequirements',
  'nonExecutionStatement',
]

async function buildContractDiffReport(
  root: string,
  candidate: Record<string, unknown>,
  outputCandidatePath: string,
  handWrittenPath: string,
): Promise<ContractDiffReportInternal> {
  const handWritten = await readJsonSafe<Record<string, unknown>>(path.resolve(root, handWrittenPath))
  if (!handWritten.ok) {
    const semanticSummary = classifyContractDiffSemantics([], [], 'contract-diff-blocked')
    return {
      schemaVersion: 1,
      artifactRole: 'execution-contract-dry-run-diff-report',
      status: 'contract-diff-blocked',
      reviewStatus: 'review-diff-blocked',
      equivalenceStatus: 'compiler-equivalence-blocked',
      sourceCandidate: relativePath(root, path.resolve(root, outputCandidatePath)),
      comparedWith: handWrittenPath,
      differingFields: [],
      comparedFields: [],
      idBasedSummaries: [],
      semanticDiffs: semanticSummary.semanticDiffs,
      semanticClassificationCounts: semanticSummary.semanticClassificationCounts,
      highestReviewSeverity: semanticSummary.highestReviewSeverity,
      compilerPromotionReadiness: semanticSummary.compilerPromotionReadiness,
      blockingReasons: [`Unable to read hand-written dry-run contract: ${handWritten.error}`],
      reviewBoundary:
        'Diff report generation was blocked. The compiled candidate cannot be reviewed for equivalence against the hand-written dry-run contract.',
      nonExecutionStatement:
        'This diff report is review Evidence only and does not execute work, accept changes, or make the compiled candidate authoritative.',
    }
  }

  const comparedFields = comparedContractFields.map((field) => ({
    field,
    status:
      stableJsonValue(candidate[field]) === stableJsonValue(asRecord(handWritten.value)[field])
        ? ('same' as const)
        : ('different' as const),
  }))
  const differingFields = comparedFields.filter((field) => field.status === 'different').map((field) => field.field)
  const idBasedSummaries = buildIdBasedDiffSummaries(candidate, asRecord(handWritten.value))
  const hasDiff = differingFields.length > 0
  const semanticSummary = classifyContractDiffSemantics(
    idBasedSummaries,
    differingFields,
    hasDiff ? 'contract-diff-detected' : 'contract-diff-none',
  )

  return {
    schemaVersion: 1,
    artifactRole: 'execution-contract-dry-run-diff-report',
    status: hasDiff ? 'contract-diff-detected' : 'contract-diff-none',
    reviewStatus: hasDiff ? 'non-blocking-review-diff' : 'no-review-diff',
    equivalenceStatus: hasDiff ? 'compiler-equivalence-not-proven' : 'compiler-equivalence-field-match',
    sourceCandidate: relativePath(root, path.resolve(root, outputCandidatePath)),
    comparedWith: handWrittenPath,
    differingFields,
    comparedFields,
    idBasedSummaries,
    semanticDiffs: semanticSummary.semanticDiffs,
    semanticClassificationCounts: semanticSummary.semanticClassificationCounts,
    highestReviewSeverity: semanticSummary.highestReviewSeverity,
    compilerPromotionReadiness: semanticSummary.compilerPromotionReadiness,
    blockingReasons: [],
    reviewBoundary: hasDiff
      ? 'The compiler candidate is valid, but equivalence with the hand-written contract is not proven. Review the differing fields before relying on the candidate.'
      : 'No compared contract fields differ. This still remains dry-run review Evidence, not execution authority.',
    nonExecutionStatement:
      'This diff report is review Evidence only and does not execute work, accept changes, or make the compiled candidate authoritative.',
  }
}

function buildNotRunDiffReport(outputCandidatePath: string, handWrittenPath: string): ContractDiffReportInternal {
  const semanticSummary = classifyContractDiffSemantics([], [], 'contract-diff-not-run')
  return {
    schemaVersion: 1,
    artifactRole: 'execution-contract-dry-run-diff-report',
    status: 'contract-diff-not-run',
    reviewStatus: 'review-diff-not-run',
    equivalenceStatus: 'compiler-equivalence-not-run',
    sourceCandidate: outputCandidatePath,
    comparedWith: handWrittenPath,
    differingFields: [],
    comparedFields: [],
    idBasedSummaries: [],
    semanticDiffs: semanticSummary.semanticDiffs,
    semanticClassificationCounts: semanticSummary.semanticClassificationCounts,
    highestReviewSeverity: semanticSummary.highestReviewSeverity,
    compilerPromotionReadiness: semanticSummary.compilerPromotionReadiness,
    blockingReasons: [],
    reviewBoundary:
      'No compiler candidate was produced, so equivalence with the hand-written contract was not reviewed.',
    nonExecutionStatement:
      'This diff report is review Evidence only and does not execute work, accept changes, or make the compiled candidate authoritative.',
  }
}

function stripInternalDiffFields(
  diff: ContractDiffReportInternal,
): Omit<ContractDiffReportInternal, 'blockingReasons'> {
  const { blockingReasons: _blockingReasons, ...artifact } = diff
  return artifact
}

export function classifyContractDiffSemantics(
  idBasedSummaries: ContractIdBasedDiffSummary[],
  differingFields: string[],
  status: ContractDiffStatus,
): {
  semanticDiffs: ContractSemanticDiff[]
  semanticClassificationCounts: Record<string, number>
  highestReviewSeverity: ContractSemanticReviewSeverity
  compilerPromotionReadiness: ContractCompilerPromotionReadiness
} {
  if (status === 'contract-diff-blocked' || status === 'contract-diff-not-run') {
    return {
      semanticDiffs: [],
      semanticClassificationCounts: {},
      highestReviewSeverity: 'none',
      compilerPromotionReadiness: 'compiler-promotion-not-ready',
    }
  }

  if (differingFields.length === 0) {
    return {
      semanticDiffs: [],
      semanticClassificationCounts: {},
      highestReviewSeverity: 'none',
      compilerPromotionReadiness: 'compiler-promotion-equivalence-candidate',
    }
  }

  const semanticDiffs = idBasedSummaries.flatMap((summary) => classifyIdBasedDiffSummary(summary))
  const semanticClassificationCounts = semanticDiffs.reduce<Record<string, number>>((counts, diff) => {
    counts[diff.classification] = (counts[diff.classification] || 0) + 1
    return counts
  }, {})
  const highestReviewSeverity = semanticDiffs.reduce<ContractSemanticReviewSeverity>(
    (highest, diff) => higherSeverity(highest, diff.reviewSeverity),
    'none',
  )
  const blocksPromotion = semanticDiffs.some(
    (diff) =>
      diff.promotionImpact === 'blocks-promotion' ||
      diff.classification === 'semantic-loss' ||
      diff.classification === 'policy-loss',
  )

  return {
    semanticDiffs,
    semanticClassificationCounts,
    highestReviewSeverity,
    compilerPromotionReadiness: blocksPromotion ? 'compiler-promotion-not-ready' : 'compiler-promotion-review-required',
  }
}

function classifyIdBasedDiffSummary(summary: ContractIdBasedDiffSummary): ContractSemanticDiff[] {
  const diffs: ContractSemanticDiff[] = []
  if (summary.missingIdsInGenerated.length > 0) {
    diffs.push(buildSemanticDiff(summary, 'missing'))
  }
  if (summary.extraIdsInGenerated.length > 0) {
    diffs.push(buildSemanticDiff(summary, 'extra'))
  }
  return diffs
}

function buildSemanticDiff(summary: ContractIdBasedDiffSummary, direction: 'missing' | 'extra'): ContractSemanticDiff {
  const rule = semanticDiffRules.find((entry) => entry.field === summary.field && entry.direction === direction)
  const missingIdsInGenerated = direction === 'missing' ? summary.missingIdsInGenerated : []
  const extraIdsInGenerated = direction === 'extra' ? summary.extraIdsInGenerated : []
  if (!rule) {
    return {
      field: summary.field,
      classification: 'unknown-review-required',
      reviewSeverity: 'medium',
      promotionImpact: 'review-required',
      reason:
        'This id-based contract difference has no dedicated dry-run v0.1 semantic rule and requires human review.',
      missingIdsInGenerated,
      extraIdsInGenerated,
    }
  }
  return {
    field: summary.field,
    classification: rule.classification,
    reviewSeverity: rule.reviewSeverity,
    promotionImpact: rule.promotionImpact,
    reason: rule.reason,
    missingIdsInGenerated,
    extraIdsInGenerated,
  }
}

function higherSeverity(
  left: ContractSemanticReviewSeverity,
  right: ContractSemanticReviewSeverity,
): ContractSemanticReviewSeverity {
  const order: Record<ContractSemanticReviewSeverity, number> = { none: 0, low: 1, medium: 2, high: 3 }
  return order[right] > order[left] ? right : left
}

function buildIdBasedDiffSummaries(
  generated: Record<string, unknown>,
  handWritten: Record<string, unknown>,
): ContractIdBasedDiffSummary[] {
  return ['allowedScope', 'forbiddenScope', 'requiredChecks', 'requiredEvidence'].map((field) =>
    buildIdBasedDiffSummary(field, arrayValue(handWritten[field]), arrayValue(generated[field])),
  )
}

function buildIdBasedDiffSummary(
  field: string,
  handWrittenEntries: Array<Record<string, unknown>>,
  generatedEntries: Array<Record<string, unknown>>,
): ContractIdBasedDiffSummary {
  const handWrittenIds = handWrittenEntries.map((entry) => stringValue(entry.id)).filter(Boolean)
  const generatedIds = generatedEntries.map((entry) => stringValue(entry.id)).filter(Boolean)
  return {
    field,
    handWrittenCount: handWrittenIds.length,
    generatedCount: generatedIds.length,
    missingIdsInGenerated: handWrittenIds.filter((id) => !generatedIds.includes(id)),
    extraIdsInGenerated: generatedIds.filter((id) => !handWrittenIds.includes(id)),
  }
}

function summarizeCandidate(candidate: Record<string, unknown> | undefined): ContractCompilerDryRunReport['candidate'] {
  const record = candidate || {}
  return {
    changeId: stringValue(record.changeId, 'missing'),
    changeType: stringValue(record.changeType, 'missing'),
    goal: stringValue(record.goal, 'missing'),
    allowedScopeCount: arrayValue(record.allowedScope).length,
    forbiddenScopeCount: arrayValue(record.forbiddenScope).length,
    requiredCheckCount: arrayValue(record.requiredChecks).length,
    requiredEvidenceCount: arrayValue(record.requiredEvidence).length,
    stopConditionCount: arrayValue(record.stopConditions).length,
  }
}

function findRuntimeFixtureDir(scopes: Array<{ paths: string[] }>): string | undefined {
  const fixturePath = scopes.flatMap((scope) => scope.paths).find((entry) => entry.includes('/runtime-fixture/'))
  if (!fixturePath) return undefined
  return fixturePath.slice(0, fixturePath.indexOf('/runtime-fixture/') + '/runtime-fixture'.length)
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function arrayValue(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((entry) => entry && typeof entry === 'object') : []
}

function stringArrayValue(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
    : []
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function stableJsonValue(value: unknown): string {
  return JSON.stringify(sortJsonValue(value))
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue)
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, sortJsonValue(record[key])]),
    )
  }
  return value
}

async function writeFormattedJson(filePath: string, value: unknown): Promise<void> {
  const formatted = await format(JSON.stringify(value), { parser: 'json', printWidth: 120, trailingComma: 'all' })
  await writeTextAtomic(filePath, formatted)
}
