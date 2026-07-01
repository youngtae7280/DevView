import path from 'node:path'
import { format } from 'prettier'
import { readJsonSafe, relativePath, writeTextAtomic } from './fs.js'
import { validateExecutionContract } from './compiler-boundary.js'
import { validateCompilerInputDryRun, validateCompilerInputSchema } from './compiler-input-model.js'
import {
  classifyContractDiffSemantics,
  deriveContractEquivalenceReadinessPolicy,
  type ContractCompilerPromotionReadiness,
  type ContractDiffStatus,
  type ContractEquivalenceReadinessPolicySummary,
  type ContractIdBasedDiffSummary,
  type ContractSemanticDiff,
  type ContractSemanticDiffRuleCoverage,
  type ContractSemanticReviewSeverity,
} from './contract-semantic-diff.js'
import {
  buildContractSourceAuthorityGapPreview,
  buildNotRunContractSourceAuthorityGapPreview,
  type ContractSourceAuthorityGapPreviewSummary,
} from './contract-source-authority-gap.js'
import { resolveAllowedScopeFromSourceAuthority } from './allowed-scope-source-authority.js'
import { resolveRequiredContextFromSourceAuthority } from './context-source-authority.js'
import { resolveRequiredEvidenceFromSourceAuthority } from './evidence-source-authority.js'
import { resolveOutputRequirementsFromSourceAuthority } from './output-requirement-source-authority.js'
import { resolveForbiddenScopeFromPolicySourceAuthority } from './policy-forbidden-scope-source-authority.js'
import { resolveKnownRisksFromSourceAuthority } from './risk-source-authority.js'
import { resolveStopConditionsFromSourceAuthority } from './stop-condition-source-authority.js'

export type ContractCompilerDryRunStatus = 'contract-compiler-dry-run-pass' | 'contract-compiler-dry-run-blocked'

export type ContractCompilerDryRunV01CloseoutStatus =
  | 'contract-compiler-dry-run-v0.1-classification-complete'
  | 'contract-compiler-dry-run-v0.1-classification-incomplete'

export type OutputRequirementSourceAuthorityPreviewStatus =
  | 'output-requirement-source-authority-preview-pass'
  | 'output-requirement-source-authority-preview-not-run'

export type ContractCompilerPromotionReviewStatus =
  | 'promotion-review-not-started'
  | 'promotion-review-required'
  | 'promotion-review-blocked'
  | 'promotion-review-ready-for-human'
  | 'promotion-review-approved'
  | 'promotion-review-rejected'

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
    outputRequirementSourceAuthorityPreview: string
    sourceAuthorityGapPreview: string
    promotionReviewPacket: string
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
    promotionReadiness: ContractCompilerPromotionReadiness
    semanticDiffRuleCoverage: ContractSemanticDiffRuleCoverage
    v01CloseoutStatus: ContractCompilerDryRunV01CloseoutStatus
    semanticDiffUnknownsStatus: 'semantic-diff-unknowns-zero' | 'semantic-diff-unknowns-present'
    semanticDiffUnknownsResolved: boolean
    semanticDiffCoverageComplete: boolean
    equivalencePolicy: ContractEquivalenceReadinessPolicySummary
    equivalenceProven: boolean
    reviewBoundary: string
  }
  outputRequirementSourceAuthorityPreview: {
    status: OutputRequirementSourceAuthorityPreviewStatus
    sourceAuthorityEntryCount: number
    derivedOutputRequirementCount: number
    mappedHandWrittenOutputRequirementCount: number
    unresolvedObligationCount: number
    generatedPreservationStatus:
      | 'generated-output-requirements-preserved'
      | 'generated-output-requirements-not-preserved'
    lossExplanation: string
  }
  sourceAuthorityGapPreview: ContractSourceAuthorityGapPreviewSummary
  promotionReview: {
    status: ContractCompilerPromotionReviewStatus
    approvalStatus: 'not-approved'
    packetPath: string
    equivalenceCandidate: boolean
    equivalenceProven: boolean
    reviewOnlyDiffCount: number
    reviewOnlyDiffClassifications: Record<string, number>
    boundaryWordingReviewRequired: boolean
    blockingSemanticLossCount: number
    unknownDiffCount: number
    checklistPassCount: number
    checklistDecisionRequiredCount: number
    checklistBlockedCount: number
    requiredHumanDecision: boolean
    nonExecutionBoundary: string
  }
  blockingReasons: string[]
  warnings: string[]
  nonExecutionStatement: string
  compilerBoundary: string
}

const inputSchemaPath = 'examples/read-model-aggregate/compiler-input-model-schema.json'
const dryRunInputPath = 'examples/read-model-aggregate/generated/compiler-input-model-dry-run.json'
const handWrittenDryRunContractPath = 'examples/read-model-aggregate/generated/execution-contract-dry-run.json'
const defaultOutputCandidatePath = 'examples/read-model-aggregate/generated/execution-contract-dry-run.generated.json'
const defaultDiffReportPath = 'examples/read-model-aggregate/generated/execution-contract-dry-run.diff.json'
const defaultOutputRequirementPreviewPath =
  'examples/read-model-aggregate/generated/output-requirement-source-authority.preview.json'
const defaultSourceAuthorityGapPreviewPath =
  'examples/read-model-aggregate/generated/contract-source-authority-gap.preview.json'
const defaultPromotionReviewPacketPath =
  'examples/read-model-aggregate/generated/contract-compiler-promotion-review.preview.json'

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
  let compilerInput: Record<string, unknown> | undefined

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
      compilerInput = input
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
  const outputRequirementPreview =
    candidate && compilerInput
      ? await buildOutputRequirementSourceAuthorityPreview(
          root,
          compilerInput,
          candidate,
          handWrittenDryRunContractPath,
        )
      : buildNotRunOutputRequirementSourceAuthorityPreview(defaultOutputRequirementPreviewPath)
  const sourceAuthorityGapPreview =
    candidateDiff.status === 'contract-diff-detected' || candidateDiff.status === 'contract-diff-none'
      ? buildContractSourceAuthorityGapPreview({
          changeId: summarizeCandidate(candidate).changeId,
          diffReport: relativePath(root, path.resolve(root, diffReportPath)),
          idBasedSummaries: candidateDiff.idBasedSummaries,
          semanticDiffs: candidateDiff.semanticDiffs,
          compilerPromotionReadiness: candidateDiff.compilerPromotionReadiness,
          equivalenceProven: candidateDiff.equivalenceProven,
          outputRequirementPreservationStatus: outputRequirementPreview.summary.generatedPreservationStatus,
        })
      : buildNotRunContractSourceAuthorityGapPreview(
          summarizeCandidate(candidate).changeId,
          relativePath(root, path.resolve(root, diffReportPath)),
        )
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
  const promotionReviewPacket = buildContractCompilerPromotionReviewPacket({
    changeId: summarizeCandidate(candidate).changeId,
    status,
    inputModelStatus,
    candidateStatus,
    outputCandidatePath: relativePath(root, path.resolve(root, outputCandidatePath)),
    handWrittenDryRunContractPath,
    diffReportPath: relativePath(root, path.resolve(root, diffReportPath)),
    outputRequirementPreviewPath: relativePath(root, path.resolve(root, defaultOutputRequirementPreviewPath)),
    sourceAuthorityGapPreviewPath: relativePath(root, path.resolve(root, defaultSourceAuthorityGapPreviewPath)),
    promotionReviewPacketPath: relativePath(root, path.resolve(root, defaultPromotionReviewPacketPath)),
    candidateDiff,
    sourceAuthorityGapPreview: sourceAuthorityGapPreview.summary,
  })

  if (status === 'contract-compiler-dry-run-pass' && candidate && options.writeOutput !== false) {
    await writeFormattedJson(path.resolve(root, outputCandidatePath), candidate)
    await writeFormattedJson(path.resolve(root, diffReportPath), stripInternalDiffFields(candidateDiff))
    await writeFormattedJson(path.resolve(root, defaultOutputRequirementPreviewPath), outputRequirementPreview.artifact)
    await writeFormattedJson(path.resolve(root, defaultSourceAuthorityGapPreviewPath), sourceAuthorityGapPreview)
    await writeFormattedJson(path.resolve(root, defaultPromotionReviewPacketPath), promotionReviewPacket.artifact)
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
      outputRequirementSourceAuthorityPreview: relativePath(
        root,
        path.resolve(root, defaultOutputRequirementPreviewPath),
      ),
      sourceAuthorityGapPreview: relativePath(root, path.resolve(root, defaultSourceAuthorityGapPreviewPath)),
      promotionReviewPacket: relativePath(root, path.resolve(root, defaultPromotionReviewPacketPath)),
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
      promotionReadiness: candidateDiff.promotionReadiness,
      semanticDiffRuleCoverage: candidateDiff.semanticDiffRuleCoverage,
      v01CloseoutStatus: candidateDiff.v01CloseoutStatus,
      semanticDiffUnknownsStatus: candidateDiff.semanticDiffUnknownsStatus,
      semanticDiffUnknownsResolved: candidateDiff.semanticDiffUnknownsResolved,
      semanticDiffCoverageComplete: candidateDiff.semanticDiffCoverageComplete,
      equivalencePolicy: candidateDiff.equivalencePolicy,
      equivalenceProven: candidateDiff.equivalenceProven,
      reviewBoundary: candidateDiff.reviewBoundary,
    },
    outputRequirementSourceAuthorityPreview: outputRequirementPreview.summary,
    sourceAuthorityGapPreview: sourceAuthorityGapPreview.summary,
    promotionReview: promotionReviewPacket.summary,
    blockingReasons,
    warnings,
    nonExecutionStatement:
      'Contract Compiler Dry-Run v0.2 output requirement mapping is local/non-enforcing Evidence only. It compiles a deterministic candidate from committed input fixtures and does not execute AI, apply graph deltas, accept work, enable required checks, or retire tree-native artifacts.',
    compilerBoundary:
      'Compiler Dry-Run v0.2 still supports only the current bug_fix compiler input fixture and must feed its candidate back through the Contract Fixture Validator.',
  }
}

function validateSupportedInput(input: Record<string, unknown>): string[] {
  const blocking: string[] = []
  const packSchema = asRecord(input.packSchema)
  if (packSchema.id !== 'pack-schema-bug-fix') {
    blocking.push(`Contract Compiler Dry-Run v0.2 only supports pack-schema-bug-fix; got ${String(packSchema.id)}.`)
  }
  if (packSchema.changeType !== 'bug_fix') {
    blocking.push(
      `Contract Compiler Dry-Run v0.2 only supports bug_fix changeType; got ${String(packSchema.changeType)}.`,
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
  const contextResolution = resolveRequiredContextFromSourceAuthority(arrayValue(graphSnapshot.artifacts))
  for (const unresolved of contextResolution.unresolvedSources) {
    blocking.push(
      `Contract Compiler Dry-Run v0.2 could not derive required context ${unresolved.id}: ${unresolved.reason}.`,
    )
  }
  if (contextResolution.requiredContext.length === 0) {
    blocking.push('Contract Compiler Dry-Run v0.2 requires source-authority-derived required context.')
  }

  const allowedScopeResolution = resolveAllowedScopeFromSourceAuthority(targetScopes)
  for (const unresolved of allowedScopeResolution.unresolvedSources) {
    blocking.push(
      `Contract Compiler Dry-Run v0.2 could not derive allowed scope ${unresolved.id}: ${unresolved.reason}.`,
    )
  }
  if (allowedScopeResolution.allowedScope.length === 0) {
    blocking.push('Contract Compiler Dry-Run v0.2 requires source-authority-derived allowed scope.')
  }

  const allowedScope = allowedScopeResolution.allowedScope
  const runtimeFixtureDir = findRuntimeFixtureDir(allowedScope)
  const runtimeValidatedPaths = allowedScope
    .filter((scope) => scope.scopeKind === 'code' || scope.scopeKind === 'test')
    .flatMap((scope) => scope.paths)
  const requiredChecks = [
    ...(runtimeFixtureDir
      ? [
          {
            id: 'check-todo-search-runtime-fixture',
            command: `npx vitest run ${runtimeFixtureDir}`,
            validates: runtimeValidatedPaths,
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
  const evidenceResolution = resolveRequiredEvidenceFromSourceAuthority({
    evidenceEntries: arrayValue(evidenceIndex.entries),
    evidenceCheckMappings: arrayValue(policySnapshot.evidenceCheckMappings),
    requiredCheckIds,
  })
  for (const unresolved of evidenceResolution.unresolvedSources) {
    blocking.push(
      `Contract Compiler Dry-Run v0.2 could not derive required evidence ${unresolved.id}: ${unresolved.reason}.`,
    )
  }
  if (evidenceResolution.requiredEvidence.length === 0) {
    blocking.push('Contract Compiler Dry-Run v0.2 requires source-authority-derived required evidence.')
  }

  const policyIds = new Set(arrayValue(policySnapshot.policies).map((policy) => stringValue(policy.id)))
  const riskResolution = resolveKnownRisksFromSourceAuthority({
    riskSources: arrayValue(input.riskSources),
    requiredContextIds: new Set(contextResolution.requiredContext.map((entry) => entry.id)),
    requiredEvidenceIds: new Set(evidenceResolution.requiredEvidence.map((entry) => entry.id)),
    policyIds,
    targetScopeCandidateIds: new Set(targetScopes.map((scope) => stringValue(scope.id))),
  })
  for (const unresolved of riskResolution.unresolvedSources) {
    blocking.push(`Contract Compiler Dry-Run v0.2 could not derive known risk ${unresolved.id}: ${unresolved.reason}.`)
  }
  if (riskResolution.knownRisks.length === 0) {
    blocking.push('Contract Compiler Dry-Run v0.2 requires source-authority-derived known risks.')
  }

  const forbiddenScopeResolution = resolveForbiddenScopeFromPolicySourceAuthority(policySnapshot)
  const forbiddenScope = forbiddenScopeResolution.forbiddenScope
  for (const unresolved of forbiddenScopeResolution.unresolvedRules) {
    blocking.push(
      `Contract Compiler Dry-Run v0.2 could not derive forbidden scope ${unresolved.id}: ${unresolved.reason}.`,
    )
  }
  if (forbiddenScope.length === 0) {
    blocking.push('Contract Compiler Dry-Run v0.2 requires policySnapshot.forbiddenScopeRules.')
  }

  const outputRequirementResolution = resolveOutputRequirementsFromSourceAuthority(
    arrayValue(input.outputRequirementSources),
  )
  for (const unresolved of outputRequirementResolution.unresolvedSources) {
    blocking.push(
      `Contract Compiler Dry-Run v0.2 could not derive output requirement ${unresolved.id}: ${unresolved.reason}.`,
    )
  }
  if (outputRequirementResolution.outputRequirements.length === 0) {
    blocking.push('Contract Compiler Dry-Run v0.2 requires source-authority-derived output requirements.')
  }

  const stopConditionResolution = resolveStopConditionsFromSourceAuthority(arrayValue(input.stopConditionSources))
  for (const unresolved of stopConditionResolution.unresolvedSources) {
    blocking.push(
      `Contract Compiler Dry-Run v0.2 could not derive stop condition ${unresolved.id}: ${unresolved.reason}.`,
    )
  }
  if (stopConditionResolution.stopConditions.length === 0) {
    blocking.push('Contract Compiler Dry-Run v0.2 requires source-authority-derived stop conditions.')
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
      requiredContext: contextResolution.requiredContext,
      requiredChecks,
      requiredEvidence: evidenceResolution.requiredEvidence,
      knownRisks: riskResolution.knownRisks,
      openUnknowns: [],
      humanDecisions: [],
      stopConditions: stopConditionResolution.stopConditions,
      outputRequirements: outputRequirementResolution.outputRequirements,
      nonExecutionStatement:
        'This compiler-produced execution contract candidate is dry-run only. It does not execute work, enable required checks, apply graph deltas, or accept the change.',
    },
    blocking: [],
  }
}

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
  promotionReadiness: ContractCompilerPromotionReadiness
  semanticDiffRuleCoverage: ContractSemanticDiffRuleCoverage
  v01CloseoutStatus: ContractCompilerDryRunV01CloseoutStatus
  semanticDiffUnknownsStatus: 'semantic-diff-unknowns-zero' | 'semantic-diff-unknowns-present'
  semanticDiffUnknownsResolved: boolean
  semanticDiffCoverageComplete: boolean
  equivalencePolicy: ContractEquivalenceReadinessPolicySummary
  equivalenceProven: boolean
  blockingReasons: string[]
  reviewBoundary: string
  nonExecutionStatement: string
}

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
      promotionReadiness: semanticSummary.compilerPromotionReadiness,
      semanticDiffRuleCoverage: semanticSummary.semanticDiffRuleCoverage,
      ...buildV01CloseoutMetadata(
        semanticSummary.semanticDiffRuleCoverage,
        semanticSummary.compilerPromotionReadiness,
        {
          equivalenceStatus: 'compiler-equivalence-blocked',
          isReviewable: false,
        },
      ),
      equivalencePolicy: deriveContractEquivalenceReadinessPolicy({
        semanticDiffs: semanticSummary.semanticDiffs,
        semanticDiffRuleCoverage: semanticSummary.semanticDiffRuleCoverage,
        compilerPromotionReadiness: semanticSummary.compilerPromotionReadiness,
        isReviewable: false,
      }),
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
  const equivalenceStatus = hasDiff ? 'compiler-equivalence-not-proven' : 'compiler-equivalence-field-match'
  const closeoutMetadata = buildV01CloseoutMetadata(
    semanticSummary.semanticDiffRuleCoverage,
    semanticSummary.compilerPromotionReadiness,
    { equivalenceStatus, isReviewable: true },
  )
  const equivalencePolicy = deriveContractEquivalenceReadinessPolicy({
    semanticDiffs: semanticSummary.semanticDiffs,
    semanticDiffRuleCoverage: semanticSummary.semanticDiffRuleCoverage,
    compilerPromotionReadiness: semanticSummary.compilerPromotionReadiness,
    isReviewable: true,
  })

  return {
    schemaVersion: 1,
    artifactRole: 'execution-contract-dry-run-diff-report',
    status: hasDiff ? 'contract-diff-detected' : 'contract-diff-none',
    reviewStatus: hasDiff ? 'non-blocking-review-diff' : 'no-review-diff',
    equivalenceStatus,
    sourceCandidate: relativePath(root, path.resolve(root, outputCandidatePath)),
    comparedWith: handWrittenPath,
    differingFields,
    comparedFields,
    idBasedSummaries,
    semanticDiffs: semanticSummary.semanticDiffs,
    semanticClassificationCounts: semanticSummary.semanticClassificationCounts,
    highestReviewSeverity: semanticSummary.highestReviewSeverity,
    compilerPromotionReadiness: semanticSummary.compilerPromotionReadiness,
    promotionReadiness: semanticSummary.compilerPromotionReadiness,
    semanticDiffRuleCoverage: semanticSummary.semanticDiffRuleCoverage,
    ...closeoutMetadata,
    equivalencePolicy,
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
    promotionReadiness: semanticSummary.compilerPromotionReadiness,
    semanticDiffRuleCoverage: semanticSummary.semanticDiffRuleCoverage,
    ...buildV01CloseoutMetadata(semanticSummary.semanticDiffRuleCoverage, semanticSummary.compilerPromotionReadiness, {
      equivalenceStatus: 'compiler-equivalence-not-run',
      isReviewable: false,
    }),
    equivalencePolicy: deriveContractEquivalenceReadinessPolicy({
      semanticDiffs: semanticSummary.semanticDiffs,
      semanticDiffRuleCoverage: semanticSummary.semanticDiffRuleCoverage,
      compilerPromotionReadiness: semanticSummary.compilerPromotionReadiness,
      isReviewable: false,
    }),
    blockingReasons: [],
    reviewBoundary:
      'No compiler candidate was produced, so equivalence with the hand-written contract was not reviewed.',
    nonExecutionStatement:
      'This diff report is review Evidence only and does not execute work, accept changes, or make the compiled candidate authoritative.',
  }
}

interface ContractCompilerPromotionReviewPacketInternal {
  artifact: {
    schemaVersion: 1
    artifactRole: 'contract-compiler-promotion-review-preview'
    status: ContractCompilerPromotionReviewStatus
    sourceMode: 'contract-compiler-dry-run-v0.2-promotion-review-preview'
    changeId: string
    approvalStatus: 'not-approved'
    reviewedArtifacts: {
      compilerCandidate: string
      handWrittenComparisonFixture: string
      semanticDiffReport: string
      outputRequirementSourceAuthorityPreview: string
      sourceAuthorityGapPreview: string
    }
    equivalencePolicyStatus: ContractEquivalenceReadinessPolicySummary
    sourceAuthorityPreservationStatus: string
    reviewOnlyDiffSummary: {
      status: string
      count: number
      differingFields: string[]
      reviewOnlyDiffs: Array<{
        field: string
        classification: string
        matchedRuleId: string
        reason: string
        requiredHumanCheck: string
        acceptanceRisk: string
      }>
    }
    blockingSemanticLossCount: number
    unknownDiffCount: number
    validationCommands: Array<{
      id: string
      command: string
      status: 'pass' | 'blocked' | 'required-before-approval'
      validates: string
    }>
    humanReviewChecklist: Array<{
      id: string
      status: 'pass' | 'blocked' | 'decision-required'
      prompt: string
      evidence: string
    }>
    explicitNonGoals: string[]
    summary: ContractCompilerDryRunReport['promotionReview']
    nonExecutionStatement: string
  }
  summary: ContractCompilerDryRunReport['promotionReview']
}

function buildContractCompilerPromotionReviewPacket(input: {
  changeId: string
  status: ContractCompilerDryRunStatus
  inputModelStatus: ContractCompilerDryRunReport['inputModelStatus']
  candidateStatus: ContractCompilerDryRunReport['candidateStatus']
  outputCandidatePath: string
  handWrittenDryRunContractPath: string
  diffReportPath: string
  outputRequirementPreviewPath: string
  sourceAuthorityGapPreviewPath: string
  promotionReviewPacketPath: string
  candidateDiff: ContractDiffReportInternal
  sourceAuthorityGapPreview: ContractSourceAuthorityGapPreviewSummary
}): ContractCompilerPromotionReviewPacketInternal {
  const equivalencePolicy = input.candidateDiff.equivalencePolicy
  const reviewOnlyDiffs = input.candidateDiff.semanticDiffs.filter(isPromotionReviewOnlyDiff).map((diff) => ({
    field: diff.field,
    classification: diff.classification,
    matchedRuleId: diff.matchedRuleId,
    reason: diff.reason,
    requiredHumanCheck: describeReviewOnlyHumanCheck(diff),
    acceptanceRisk: describeReviewOnlyAcceptanceRisk(diff),
  }))
  const reviewOnlyDiffClassifications = reviewOnlyDiffs.reduce<Record<string, number>>((counts, diff) => {
    counts[diff.classification] = (counts[diff.classification] || 0) + 1
    return counts
  }, {})
  const boundaryWordingReviewRequired = reviewOnlyDiffs.some(
    (diff) => diff.classification === 'boundary-wording-review-required',
  )
  const humanReviewChecklist = buildPromotionReviewChecklist(input)
  const checklistPassCount = humanReviewChecklist.filter((entry) => entry.status === 'pass').length
  const checklistDecisionRequiredCount = humanReviewChecklist.filter(
    (entry) => entry.status === 'decision-required',
  ).length
  const checklistBlockedCount = humanReviewChecklist.filter((entry) => entry.status === 'blocked').length
  const reviewStatus = derivePromotionReviewStatus({
    dryRunStatus: input.status,
    candidateStatus: input.candidateStatus,
    candidateDiffStatus: input.candidateDiff.status,
    equivalencePolicy,
    sourceAuthorityGapPreview: input.sourceAuthorityGapPreview,
    checklistBlockedCount,
  })
  const nonExecutionBoundary =
    'Promotion review packet is non-enforcing preview Evidence only. It collects review inputs for a human decision and does not approve equivalence, accept work, execute AI, apply graph deltas, create required checks, or retire tree-native artifacts.'
  const summary: ContractCompilerDryRunReport['promotionReview'] = {
    status: reviewStatus,
    approvalStatus: 'not-approved',
    packetPath: input.promotionReviewPacketPath,
    equivalenceCandidate: equivalencePolicy.equivalenceCandidate,
    equivalenceProven: false,
    reviewOnlyDiffCount: equivalencePolicy.reviewOnlyDiffCount,
    reviewOnlyDiffClassifications,
    boundaryWordingReviewRequired,
    blockingSemanticLossCount: equivalencePolicy.blockingSemanticLossCount,
    unknownDiffCount: equivalencePolicy.unknownDiffCount,
    checklistPassCount,
    checklistDecisionRequiredCount,
    checklistBlockedCount,
    requiredHumanDecision: true,
    nonExecutionBoundary,
  }

  return {
    artifact: {
      schemaVersion: 1,
      artifactRole: 'contract-compiler-promotion-review-preview',
      status: reviewStatus,
      sourceMode: 'contract-compiler-dry-run-v0.2-promotion-review-preview',
      changeId: input.changeId,
      approvalStatus: 'not-approved',
      reviewedArtifacts: {
        compilerCandidate: input.outputCandidatePath,
        handWrittenComparisonFixture: input.handWrittenDryRunContractPath,
        semanticDiffReport: input.diffReportPath,
        outputRequirementSourceAuthorityPreview: input.outputRequirementPreviewPath,
        sourceAuthorityGapPreview: input.sourceAuthorityGapPreviewPath,
      },
      equivalencePolicyStatus: equivalencePolicy,
      sourceAuthorityPreservationStatus: equivalencePolicy.sourceAuthorityPreservationStatus,
      reviewOnlyDiffSummary: {
        status: equivalencePolicy.reviewOnlyDiffStatus,
        count: equivalencePolicy.reviewOnlyDiffCount,
        differingFields: input.candidateDiff.differingFields,
        reviewOnlyDiffs,
      },
      blockingSemanticLossCount: equivalencePolicy.blockingSemanticLossCount,
      unknownDiffCount: equivalencePolicy.unknownDiffCount,
      validationCommands: [
        {
          id: 'compile-contract-dry-run',
          command: 'node dist/cli/index.js graph read-model compile-contract --dry-run --json',
          status: input.status === 'contract-compiler-dry-run-pass' ? 'pass' : 'blocked',
          validates: 'deterministic candidate generation, Contract Fixture Validator pass, and review packet creation',
        },
        {
          id: 'report-health',
          command:
            'node dist/cli/index.js graph read-model report-health --json --markdown examples/read-model-aggregate/generated/read-model-health-report-output.md',
          status: 'required-before-approval',
          validates: 'non-enforcing health summary includes compiler equivalence and promotion review metadata',
        },
        {
          id: 'read-model-e2e-smoke',
          command: 'npm run test:read-model:e2e',
          status: 'required-before-approval',
          validates: 'E2E smoke continues to observe the dry-run compiler without enabling enforcement',
        },
        {
          id: 'validate-all',
          command: 'node dist/cli/index.js graph read-model validate --all --json',
          status: 'required-before-approval',
          validates: 'aggregate read-model validation remains non-enforcing and green before any promotion review',
        },
      ],
      humanReviewChecklist,
      explicitNonGoals: [
        'AI executor automation is not added.',
        'Graph delta application is not automated.',
        'User acceptance is not automated.',
        'Required checks, branch protection, and CI enforcement are not enabled.',
        'Tree-native artifacts are not retired.',
        'Supported changeType values are not widened.',
        'Compiler output is not promoted to execution authority.',
        'The hand-written contract remains a comparison fixture, not a compiler source.',
        'equivalenceProven remains false until a later approved policy and human decision.',
      ],
      summary,
      nonExecutionStatement: nonExecutionBoundary,
    },
    summary,
  }
}

function isPromotionReviewOnlyDiff(diff: ContractSemanticDiff): boolean {
  return [
    'format-only',
    'metadata-only',
    'source-mode-metadata-only',
    'safe-additive',
    'validation-superset-review-only',
    'boundary-wording-review-required',
    'policy-expansion',
  ].includes(diff.classification)
}

function describeReviewOnlyHumanCheck(diff: ContractSemanticDiff): string {
  if (diff.classification === 'source-mode-metadata-only') {
    return 'Confirm compiler-produced sourceMode provenance is expected and does not make the candidate authoritative.'
  }
  if (diff.classification === 'validation-superset-review-only') {
    return 'Confirm the added health check is a non-weakening validation superset and not a new required check policy.'
  }
  if (diff.classification === 'boundary-wording-review-required') {
    return 'Confirm boundary wording preserves non-execution, non-approval, non-enforcement, no user acceptance, and no graph-delta apply meanings.'
  }
  return 'Confirm the review-only difference is acceptable before any human promotion decision.'
}

function describeReviewOnlyAcceptanceRisk(diff: ContractSemanticDiff): string {
  if (diff.classification === 'source-mode-metadata-only') {
    return 'Low: provenance can be accepted if the candidate remains review Evidence only.'
  }
  if (diff.classification === 'validation-superset-review-only') {
    return 'Low: additive validation is acceptable only if it remains non-enforcing and non-approval evidence.'
  }
  if (diff.classification === 'boundary-wording-review-required') {
    return 'Medium: weakened wording could blur execution, approval, enforcement, user acceptance, or graph-delta boundaries.'
  }
  return 'Review required: do not treat this packet as approval without a human decision record.'
}

function derivePromotionReviewStatus(input: {
  dryRunStatus: ContractCompilerDryRunStatus
  candidateStatus: ContractCompilerDryRunReport['candidateStatus']
  candidateDiffStatus: ContractDiffReportInternal['status']
  equivalencePolicy: ContractEquivalenceReadinessPolicySummary
  sourceAuthorityGapPreview: ContractSourceAuthorityGapPreviewSummary
  checklistBlockedCount: number
}): ContractCompilerPromotionReviewStatus {
  if (input.candidateDiffStatus === 'contract-diff-not-run') {
    return 'promotion-review-not-started'
  }
  if (
    input.dryRunStatus !== 'contract-compiler-dry-run-pass' ||
    input.candidateStatus !== 'contract-candidate-pass' ||
    input.candidateDiffStatus === 'contract-diff-blocked' ||
    input.checklistBlockedCount > 0 ||
    input.equivalencePolicy.blockingSemanticLossCount > 0 ||
    input.equivalencePolicy.unknownDiffCount > 0 ||
    input.equivalencePolicy.sourceAuthorityPreservationStatus !== 'source-authority-preserved' ||
    input.sourceAuthorityGapPreview.fieldsRequiringSourceAuthority.length > 0
  ) {
    return 'promotion-review-blocked'
  }
  if (input.equivalencePolicy.equivalenceCandidate && !input.equivalencePolicy.equivalenceProven) {
    return 'promotion-review-ready-for-human'
  }
  return 'promotion-review-required'
}

function buildPromotionReviewChecklist(input: {
  status: ContractCompilerDryRunStatus
  inputModelStatus: ContractCompilerDryRunReport['inputModelStatus']
  candidateStatus: ContractCompilerDryRunReport['candidateStatus']
  candidateDiff: ContractDiffReportInternal
  sourceAuthorityGapPreview: ContractSourceAuthorityGapPreviewSummary
}): ContractCompilerPromotionReviewPacketInternal['artifact']['humanReviewChecklist'] {
  const equivalencePolicy = input.candidateDiff.equivalencePolicy
  return [
    {
      id: 'major-fields-source-authority-preserved',
      status:
        equivalencePolicy.sourceAuthorityPreservationStatus === 'source-authority-preserved' &&
        input.sourceAuthorityGapPreview.fieldsRequiringSourceAuthority.length === 0
          ? 'pass'
          : 'blocked',
      prompt: 'Confirm major execution contract fields are preserved from source authority.',
      evidence: input.sourceAuthorityGapPreview.status,
    },
    {
      id: 'blocking-semantic-loss-zero',
      status: equivalencePolicy.blockingSemanticLossCount === 0 ? 'pass' : 'blocked',
      prompt: 'Confirm blocking semantic/policy/output/evidence/context/risk/scope loss is zero.',
      evidence: String(equivalencePolicy.blockingSemanticLossCount),
    },
    {
      id: 'unknown-diffs-zero',
      status: equivalencePolicy.unknownDiffCount === 0 ? 'pass' : 'blocked',
      prompt: 'Confirm semantic diff unknown count is zero.',
      evidence: String(equivalencePolicy.unknownDiffCount),
    },
    {
      id: 'review-only-diffs-acceptable',
      status: equivalencePolicy.reviewOnlyDiffCount > 0 ? 'decision-required' : 'pass',
      prompt: 'Human reviewer must decide whether remaining review-only diffs are acceptable.',
      evidence: equivalencePolicy.reviewOnlyDiffStatus,
    },
    {
      id: 'source-mode-difference-expected',
      status: input.candidateDiff.differingFields.includes('sourceMode') ? 'decision-required' : 'pass',
      prompt: 'Human reviewer must confirm the generated sourceMode difference is expected.',
      evidence: input.candidateDiff.differingFields.includes('sourceMode') ? 'sourceMode differs' : 'sourceMode same',
    },
    {
      id: 'additive-health-check-expected',
      status: input.candidateDiff.differingFields.includes('requiredChecks') ? 'decision-required' : 'pass',
      prompt: 'Human reviewer must confirm the additive health check is expected and non-weakening.',
      evidence: input.candidateDiff.differingFields.includes('requiredChecks')
        ? 'requiredChecks differs'
        : 'requiredChecks same',
    },
    {
      id: 'boundary-wording-non-weakening',
      status: input.candidateDiff.differingFields.includes('nonExecutionStatement') ? 'decision-required' : 'pass',
      prompt: 'Human reviewer must confirm boundary wording does not weaken the non-execution boundary.',
      evidence: input.candidateDiff.differingFields.includes('nonExecutionStatement')
        ? 'nonExecutionStatement differs'
        : 'nonExecutionStatement same',
    },
    {
      id: 'candidate-validator-pass',
      status:
        input.status === 'contract-compiler-dry-run-pass' &&
        input.inputModelStatus === 'compiler-input-model-pass' &&
        input.candidateStatus === 'contract-candidate-pass'
          ? 'pass'
          : 'blocked',
      prompt: 'Confirm generated candidate passed the Contract Fixture Validator.',
      evidence: `${input.inputModelStatus}; ${input.candidateStatus}`,
    },
    {
      id: 'report-health-and-e2e-reviewed',
      status: 'decision-required',
      prompt: 'Human reviewer must confirm report-health, E2E smoke, and validate-all were run before approval.',
      evidence: 'See validationCommands in this packet.',
    },
    {
      id: 'compiler-output-not-execution-source',
      status: 'pass',
      prompt: 'Confirm compiler output is not treated as execution authority.',
      evidence: 'non-execution boundary retained',
    },
    {
      id: 'no-enforcement-or-branch-protection',
      status: 'pass',
      prompt: 'Confirm no required check, CI enforcement, or branch protection was introduced.',
      evidence: 'explicit non-goal',
    },
  ]
}

interface OutputRequirementSourceAuthorityPreviewInternal {
  artifact: {
    schemaVersion: 1
    artifactRole: 'output-requirement-source-authority-preview'
    status: OutputRequirementSourceAuthorityPreviewStatus
    sourceMode: 'contract-compiler-dry-run-v0.2-preview'
    changeId: string
    sourceAuthorityEntries: Array<Record<string, unknown>>
    derivedOutputRequirementCandidates: Array<Record<string, unknown>>
    handWrittenOutputRequirementMappings: Array<Record<string, unknown>>
    generatedOutputRequirementMappings: Array<Record<string, unknown>>
    generatedReplacementObligations: Array<Record<string, unknown>>
    unresolvedObligations: Array<Record<string, unknown>>
    mappingSummary: Record<string, unknown>
    nonExecutionStatement: string
  }
  summary: ContractCompilerDryRunReport['outputRequirementSourceAuthorityPreview']
}

async function buildOutputRequirementSourceAuthorityPreview(
  root: string,
  input: Record<string, unknown>,
  candidate: Record<string, unknown>,
  handWrittenPath: string,
): Promise<OutputRequirementSourceAuthorityPreviewInternal> {
  const handWritten = await readJsonSafe<Record<string, unknown>>(path.resolve(root, handWrittenPath))
  const handWrittenOutputRequirements = handWritten.ok
    ? stringArrayValue(asRecord(handWritten.value).outputRequirements)
    : []
  const generatedOutputRequirements = stringArrayValue(candidate.outputRequirements)
  const sourceAuthorityEntries = arrayValue(input.outputRequirementSources)
  const outputRequirementResolution = resolveOutputRequirementsFromSourceAuthority(sourceAuthorityEntries)
  const derivedOutputRequirementCandidates = outputRequirementResolution.derivedOutputRequirements.map((entry) => ({
    id: entry.id,
    obligationType: entry.obligationType,
    requiredReportTarget: entry.requiredReportTarget,
    sourceId: entry.sourceId,
    requirement: entry.requirement,
    derivationStatus: entry.derivationStatus,
    derivationReason: entry.derivationReason,
  }))
  const handWrittenOutputRequirementMappings = derivedOutputRequirementCandidates.map((entry) => {
    const requirement = stringValue(entry.requirement)
    return {
      derivedOutputRequirementId: stringValue(entry.id),
      sourceId: stringValue(entry.sourceId),
      handWrittenRequirement: requirement,
      status: handWrittenOutputRequirements.includes(requirement)
        ? 'hand-written-output-requirement-mapped'
        : 'hand-written-output-requirement-unmapped',
    }
  })
  const generatedOutputRequirementMappings = derivedOutputRequirementCandidates.map((entry) => {
    const requirement = stringValue(entry.requirement)
    const status = generatedOutputRequirements.includes(requirement)
      ? 'generated-output-requirement-preserved'
      : 'generated-output-requirement-missing'
    return {
      derivedOutputRequirementId: stringValue(entry.id),
      obligationType: stringValue(entry.obligationType),
      requirement,
      status,
      reason:
        status === 'generated-output-requirement-missing'
          ? 'source-authority-present-but-compiler-output-mapping-not-applied'
          : 'source-authority-derived-output-requirement-present-in-generated-candidate',
    }
  })
  const generatedReplacementObligations = generatedOutputRequirements
    .filter((requirement) => requirement.includes('compiler') || requirement.includes('generated-versus-handwritten'))
    .map((requirement) => ({
      requirement,
      status: 'compiler-self-report-not-execution-output',
      reason:
        'Compiler self-report is useful review metadata, but it does not replace execution-result output obligations.',
    }))
  const unresolvedObligations = [
    ...outputRequirementResolution.unresolvedSources.map((entry) => ({
      derivedOutputRequirementId: entry.id,
      sourceId: entry.sourceId,
      obligationType: entry.obligationType,
      requiredReportTarget: entry.requiredReportTarget,
      status: entry.derivationStatus,
      reason: entry.reason,
    })),
    ...generatedOutputRequirementMappings.filter((entry) => entry.status === 'generated-output-requirement-missing'),
  ]
  const mappedHandWrittenOutputRequirementCount = new Set(
    handWrittenOutputRequirementMappings
      .filter((entry) => entry.status === 'hand-written-output-requirement-mapped')
      .map((entry) => String(entry.handWrittenRequirement)),
  ).size
  const generatedPreservationStatus =
    unresolvedObligations.length === 0
      ? 'generated-output-requirements-preserved'
      : 'generated-output-requirements-not-preserved'
  const lossExplanation =
    unresolvedObligations.length === 0
      ? 'Output requirement source authority now derives every generated output requirement obligation for the current dry-run fixture.'
      : 'Source authority entries exist, but the current compiler output requirement mapping does not preserve every hand-written execution-result reporting obligation.'
  return {
    artifact: {
      schemaVersion: 1,
      artifactRole: 'output-requirement-source-authority-preview',
      status: 'output-requirement-source-authority-preview-pass',
      sourceMode: 'contract-compiler-dry-run-v0.2-preview',
      changeId: stringValue(input.changeId),
      sourceAuthorityEntries,
      derivedOutputRequirementCandidates,
      handWrittenOutputRequirementMappings,
      generatedOutputRequirementMappings,
      generatedReplacementObligations,
      unresolvedObligations,
      mappingSummary: {
        sourceAuthorityEntryCount: sourceAuthorityEntries.length,
        derivedOutputRequirementCount: derivedOutputRequirementCandidates.length,
        mappedHandWrittenOutputRequirementCount,
        unresolvedObligationCount: unresolvedObligations.length,
        generatedPreservationStatus,
        lossExplanation,
      },
      nonExecutionStatement:
        'This preview explains output requirement source authority only. It does not execute work, rewrite the generated contract, prove equivalence, apply graph deltas, accept work, enable required checks, or retire tree-native artifacts.',
    },
    summary: {
      status: 'output-requirement-source-authority-preview-pass',
      sourceAuthorityEntryCount: sourceAuthorityEntries.length,
      derivedOutputRequirementCount: derivedOutputRequirementCandidates.length,
      mappedHandWrittenOutputRequirementCount,
      unresolvedObligationCount: unresolvedObligations.length,
      generatedPreservationStatus,
      lossExplanation,
    },
  }
}

function buildNotRunOutputRequirementSourceAuthorityPreview(
  previewPath: string,
): OutputRequirementSourceAuthorityPreviewInternal {
  return {
    artifact: {
      schemaVersion: 1,
      artifactRole: 'output-requirement-source-authority-preview',
      status: 'output-requirement-source-authority-preview-not-run',
      sourceMode: 'contract-compiler-dry-run-v0.2-preview',
      changeId: 'missing',
      sourceAuthorityEntries: [],
      derivedOutputRequirementCandidates: [],
      handWrittenOutputRequirementMappings: [],
      generatedOutputRequirementMappings: [],
      generatedReplacementObligations: [],
      unresolvedObligations: [],
      mappingSummary: {
        sourceAuthorityEntryCount: 0,
        derivedOutputRequirementCount: 0,
        mappedHandWrittenOutputRequirementCount: 0,
        unresolvedObligationCount: 0,
        generatedPreservationStatus: 'generated-output-requirements-not-preserved',
        lossExplanation: `Preview was not run; no artifact written to ${previewPath}.`,
      },
      nonExecutionStatement:
        'This preview explains output requirement source authority only and was not run because no compiler candidate was produced.',
    },
    summary: {
      status: 'output-requirement-source-authority-preview-not-run',
      sourceAuthorityEntryCount: 0,
      derivedOutputRequirementCount: 0,
      mappedHandWrittenOutputRequirementCount: 0,
      unresolvedObligationCount: 0,
      generatedPreservationStatus: 'generated-output-requirements-not-preserved',
      lossExplanation: `Preview was not run; no artifact written to ${previewPath}.`,
    },
  }
}

function buildV01CloseoutMetadata(
  coverage: ContractSemanticDiffRuleCoverage,
  promotionReadiness: ContractCompilerPromotionReadiness,
  options: { equivalenceStatus: ContractDiffReportInternal['equivalenceStatus']; isReviewable: boolean },
): Pick<
  ContractDiffReportInternal,
  | 'v01CloseoutStatus'
  | 'semanticDiffUnknownsStatus'
  | 'semanticDiffUnknownsResolved'
  | 'semanticDiffCoverageComplete'
  | 'equivalenceProven'
> {
  void promotionReadiness
  void options.equivalenceStatus
  const semanticDiffUnknownsResolved = coverage.unknownDiffs === 0
  const semanticDiffCoverageComplete = options.isReviewable && semanticDiffUnknownsResolved
  return {
    v01CloseoutStatus: semanticDiffCoverageComplete
      ? 'contract-compiler-dry-run-v0.1-classification-complete'
      : 'contract-compiler-dry-run-v0.1-classification-incomplete',
    semanticDiffUnknownsStatus: semanticDiffUnknownsResolved
      ? 'semantic-diff-unknowns-zero'
      : 'semantic-diff-unknowns-present',
    semanticDiffUnknownsResolved,
    semanticDiffCoverageComplete,
    equivalenceProven: false,
  }
}

function stripInternalDiffFields(
  diff: ContractDiffReportInternal,
): Omit<ContractDiffReportInternal, 'blockingReasons'> {
  const { blockingReasons: _blockingReasons, ...artifact } = diff
  return artifact
}

function buildIdBasedDiffSummaries(
  generated: Record<string, unknown>,
  handWritten: Record<string, unknown>,
): ContractIdBasedDiffSummary[] {
  return [
    'allowedScope',
    'forbiddenScope',
    'requiredContext',
    'requiredChecks',
    'requiredEvidence',
    'knownRisks',
    'stopConditions',
  ].map((field) => buildIdBasedDiffSummary(field, arrayValue(handWritten[field]), arrayValue(generated[field])))
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
