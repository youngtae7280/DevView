import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic } from './fs.js'
import { validateRequestIrCandidateSchemaOnly } from './request-ir-candidate-validator.js'
import type { IssueSeverity } from './types.js'

const REVISER_NAME = 'RequestIrCandidateClarificationReviser'
const EXPECTED_PACK_ROLE = 'clarification-interview-pack'
const EXPECTED_PACK_STATUS = 'clarification-interview-pack-generated'
const EXPECTED_ANSWERS_ROLE = 'clarification-answers-preview'
const EXPECTED_ANSWERS_STATUS = 'clarification-answers-previewed'
const ALLOWED_REVISION_FIELDS = new Set([
  'requestTypeCandidate',
  'targetRecordIdCandidate',
  'targetComponentCandidate',
  'allowedScopeIntentCandidate',
  'forbiddenScopeIntentCandidate',
  'requiredEvidenceIntentCandidate',
  'riskIntentCandidate',
])
const UNSAFE_ANSWER_FIELDS = new Set([
  'artifactRole',
  'status',
  'schemaId',
  'requestIrCandidateStatus',
  'candidateOnly',
  'authorityStatus',
  'revisionAuthorityStatus',
  'validatedRequestIr',
  'graphTraversalAllowed',
  'contractGenerationAllowed',
  'instructionPackGenerationAllowed',
  'graphSourceMutated',
  'graphDeltaApplied',
  'approvalStatus',
  'humanDecisionRecorded',
  'equivalenceProven',
  'runtimeEvidenceSatisfied',
  'scopeEnforced',
  'ciEnforcementEnabled',
  'selectedGraphSliceGenerated',
  'contractInputGenerated',
  'contractCompilerInputGenerated',
  'instructionPackGenerated',
  'codexExecutionTriggered',
])

type JsonRecord = Record<string, unknown>

export interface RequestIrCandidateRevisionFinding {
  code: string
  severity: IssueSeverity
  field?: string
  message: string
  expected?: unknown
  actual?: unknown
  suggestedFix?: string
}

export interface RequestIrCandidateRevisionResult {
  schemaVersion: 1
  artifactRole: 'request-ir-candidate-revision-result'
  status: 'request-ir-candidate-revision-generated' | 'request-ir-candidate-revision-blocked'
  reviserName: typeof REVISER_NAME
  revisionScope: 'clarification-answers-to-request-ir-candidate-preview-no-validation'
  sourceClarificationInterviewPack: string
  sourceClarificationAnswers: string
  sourceOriginalRequestIrCandidate: string
  revisedCandidateGenerated: boolean
  revisedCandidatePath: string | null
  revisionStatus: 'no-op-revision-generated' | 'answers-applied-candidate-only' | 'revision-blocked'
  appliedAnswerCount: number
  validationRequiredAgain: true
  graphTraversalAllowed: false
  graphTraversalExecuted: false
  selectedGraphSliceGenerated: false
  contractInputGenerated: false
  instructionPackGenerated: false
  codexExecutionTriggered: false
  graphSourceMutated: false
  graphDeltaApplied: false
  approvalStatus: 'not-approved'
  humanDecisionRecorded: false
  runtimeEvidenceSatisfied: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  validationFindings: RequestIrCandidateRevisionFinding[]
  revisedCandidate?: JsonRecord
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-preview-output-not-source-authority'
  nonExecutionBoundary: string
}

export interface RequestIrCandidateRevisionFileResult {
  result: RequestIrCandidateRevisionResult
  outputPath?: string
}

interface RevisionPathContext {
  root?: string
  packPath?: string
  answersPath?: string
  originalCandidatePath?: string
  outputPath?: string
}

export function reviseRequestIrCandidateFromClarificationAnswers(
  packArtifact: unknown,
  answersArtifact: unknown,
  originalCandidateArtifact: unknown,
  paths: RevisionPathContext = {},
): RequestIrCandidateRevisionResult {
  const pack = asRecord(packArtifact)
  const answers = asRecord(answersArtifact)
  const originalCandidate = asRecord(originalCandidateArtifact)
  const findings: RequestIrCandidateRevisionFinding[] = []

  validateClarificationPack(pack, findings)
  validateClarificationAnswers(answers, pack, findings, paths)
  validateOriginalCandidate(originalCandidate, findings)

  const blockedBeforeApply = findings.some((finding) => finding.severity === 'error')
  const appliedAnswers = blockedBeforeApply ? [] : buildAppliedAnswers(pack, answers, findings)
  const blocked = findings.some((finding) => finding.severity === 'error')
  const revisedCandidate = blocked
    ? undefined
    : buildRevisedCandidate(originalCandidate as JsonRecord, pack, appliedAnswers, paths)

  return {
    schemaVersion: 1,
    artifactRole: 'request-ir-candidate-revision-result',
    status: blocked ? 'request-ir-candidate-revision-blocked' : 'request-ir-candidate-revision-generated',
    reviserName: REVISER_NAME,
    revisionScope: 'clarification-answers-to-request-ir-candidate-preview-no-validation',
    sourceClarificationInterviewPack: paths.packPath ?? '<in-memory>',
    sourceClarificationAnswers: paths.answersPath ?? '<in-memory>',
    sourceOriginalRequestIrCandidate: paths.originalCandidatePath ?? '<in-memory>',
    revisedCandidateGenerated: !blocked,
    revisedCandidatePath: blocked ? null : (paths.outputPath ?? null),
    revisionStatus: blocked
      ? 'revision-blocked'
      : appliedAnswers.length === 0
        ? 'no-op-revision-generated'
        : 'answers-applied-candidate-only',
    appliedAnswerCount: blocked ? 0 : appliedAnswers.length,
    validationRequiredAgain: true,
    graphTraversalAllowed: false,
    graphTraversalExecuted: false,
    selectedGraphSliceGenerated: false,
    contractInputGenerated: false,
    instructionPackGenerated: false,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    validationFindings: findings,
    ...(revisedCandidate ? { revisedCandidate } : {}),
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: blocked ? null : (paths.outputPath ?? null),
    writtenOutputPathAuthorityStatus: blocked
      ? 'not-written-stdout-only'
      : paths.outputPath
        ? 'explicit-preview-output-not-source-authority'
        : 'not-written-stdout-only',
    nonExecutionBoundary:
      'This clarification revision pass generates only a revised Request IR Candidate preview. It does not call an LLM, implement an interview UI, run Request IR validation, run graph traversal, generate selected graph slices, generate Contract Compiler Input, generate Instruction Packs, trigger Codex execution, mutate graph-source, apply graph deltas, approve work, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
  }
}

export async function reviseRequestIrCandidateFile(
  root: string,
  clarificationPackPath: string,
  answersPath: string,
  options: { output?: string } = {},
): Promise<RequestIrCandidateRevisionFileResult> {
  const resolvedPackPath = resolveRepoPath(root, clarificationPackPath)
  const resolvedAnswersPath = resolveRepoPath(root, answersPath)
  const pack = await readJsonSafe<JsonRecord>(resolvedPackPath)
  if (!pack.ok) {
    throw new Error(`Unable to read Clarification Interview Pack from ${clarificationPackPath}: ${pack.error}`)
  }
  const answers = await readJsonSafe<JsonRecord>(resolvedAnswersPath)
  if (!answers.ok) {
    throw new Error(`Unable to read clarification answers from ${answersPath}: ${answers.error}`)
  }

  const originalCandidatePath = stringValue(pack.value.sourceRequestIrCandidate)
  if (!originalCandidatePath) {
    throw new Error('Clarification Interview Pack does not include sourceRequestIrCandidate.')
  }
  const resolvedOriginalCandidatePath = resolveRepoPath(root, originalCandidatePath)
  const originalCandidate = await readJsonSafe<JsonRecord>(resolvedOriginalCandidatePath)
  if (!originalCandidate.ok) {
    throw new Error(
      `Unable to read original Request IR Candidate from ${originalCandidatePath}: ${originalCandidate.error}`,
    )
  }

  if (options.output) {
    await assertRevisionOutputAuthority(
      root,
      resolvedPackPath,
      resolvedAnswersPath,
      resolvedOriginalCandidatePath,
      pack.value,
      answers.value,
      originalCandidate.value,
      options.output,
    )
  }

  const outputPath = options.output ? relativePath(root, resolveRepoPath(root, options.output)) : undefined
  const result = reviseRequestIrCandidateFromClarificationAnswers(pack.value, answers.value, originalCandidate.value, {
    root,
    packPath: relativePath(root, resolvedPackPath),
    answersPath: relativePath(root, resolvedAnswersPath),
    originalCandidatePath: relativePath(root, resolvedOriginalCandidatePath),
    outputPath,
  })

  if (result.revisedCandidateGenerated && result.revisedCandidate && options.output) {
    await writeJsonAtomic(resolveRepoPath(root, options.output), result.revisedCandidate)
  }

  return { result, ...(outputPath && result.revisedCandidateGenerated ? { outputPath } : {}) }
}

async function assertRevisionOutputAuthority(
  root: string,
  resolvedPackPath: string,
  resolvedAnswersPath: string,
  resolvedOriginalCandidatePath: string,
  pack: JsonRecord,
  answers: JsonRecord,
  originalCandidate: JsonRecord,
  outputPath: string,
): Promise<void> {
  const resolvedOutputPath = resolveRepoPath(root, outputPath)
  const protectedPaths = buildProtectedOutputPathMap(
    root,
    resolvedPackPath,
    resolvedAnswersPath,
    resolvedOriginalCandidatePath,
    pack,
    answers,
    originalCandidate,
  )
  const protectedReason = protectedPaths.get(pathKey(resolvedOutputPath))
  if (protectedReason) {
    throw new Error(
      `Request IR Candidate revision output path is unsafe: ${outputPath} would overwrite ${protectedReason}.`,
    )
  }
  const sourcePathReason = classifyReservedSourcePath(resolvedOutputPath)
  if (sourcePathReason) {
    throw new Error(
      `Request IR Candidate revision output path is unsafe: ${outputPath} targets ${sourcePathReason}. Choose a dedicated revised candidate preview path.`,
    )
  }
  const existingAuthority = await classifyExistingSourceAuthority(resolvedOutputPath)
  if (existingAuthority) {
    throw new Error(
      `Request IR Candidate revision output path is unsafe: ${outputPath} already contains ${existingAuthority}. Choose a dedicated revised candidate preview output path.`,
    )
  }
}

function buildProtectedOutputPathMap(
  root: string,
  resolvedPackPath: string,
  resolvedAnswersPath: string,
  resolvedOriginalCandidatePath: string,
  pack: JsonRecord,
  answers: JsonRecord,
  originalCandidate: JsonRecord,
): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const add = (candidatePath: unknown, reason: string): void => {
    const value = stringValue(candidatePath)
    if (!isConcreteOutputProtectedPath(value)) {
      return
    }
    const key = pathKey(resolveRepoPath(root, value))
    if (!protectedPaths.has(key)) {
      protectedPaths.set(key, reason)
    }
  }

  protectedPaths.set(pathKey(resolvedPackPath), 'the source Clarification Interview Pack')
  protectedPaths.set(pathKey(resolvedAnswersPath), 'the source clarification answers artifact')
  protectedPaths.set(pathKey(resolvedOriginalCandidatePath), 'the source original Request IR Candidate')
  for (const linkedPath of collectConcretePathStrings(pack)) {
    add(linkedPath, `linked Clarification Interview Pack artifact ${linkedPath}`)
  }
  for (const linkedPath of collectConcretePathStrings(answers)) {
    add(linkedPath, `linked clarification answers artifact ${linkedPath}`)
  }
  for (const linkedPath of collectConcretePathStrings(originalCandidate)) {
    add(linkedPath, `linked original Request IR Candidate artifact ${linkedPath}`)
  }

  return protectedPaths
}

function validateClarificationPack(pack: JsonRecord | null, findings: RequestIrCandidateRevisionFinding[]): void {
  if (!pack) {
    findings.push({
      code: 'CLARIFICATION_PACK_NOT_OBJECT',
      severity: 'error',
      field: 'clarificationPack',
      message: 'Request IR Candidate revision requires a Clarification Interview Pack JSON object.',
    })
    return
  }
  const expectedFields: Array<[string, unknown]> = [
    ['artifactRole', EXPECTED_PACK_ROLE],
    ['status', EXPECTED_PACK_STATUS],
    ['clarificationInterviewPackGenerated', true],
    ['requestIrCandidateRevised', false],
    ['graphTraversalAllowed', false],
    ['contractInputGenerated', false],
    ['instructionPackGenerated', false],
    ['codexExecutionTriggered', false],
  ]
  for (const [field, expected] of expectedFields) {
    if (pack[field] !== expected) {
      findings.push({
        code: 'CLARIFICATION_PACK_UNSAFE_OR_MISMATCHED',
        severity: 'error',
        field,
        message: `Clarification Interview Pack field "${field}" is not safe for Request IR Candidate revision.`,
        expected,
        actual: pack[field],
      })
    }
  }
}

function validateClarificationAnswers(
  answers: JsonRecord | null,
  pack: JsonRecord | null,
  findings: RequestIrCandidateRevisionFinding[],
  paths: RevisionPathContext = {},
): void {
  if (!answers) {
    findings.push({
      code: 'CLARIFICATION_ANSWERS_NOT_OBJECT',
      severity: 'error',
      field: 'answers',
      message: 'Request IR Candidate revision requires a clarification answers JSON object.',
    })
    return
  }
  const expectedFields: Array<[string, unknown]> = [
    ['artifactRole', EXPECTED_ANSWERS_ROLE],
    ['status', EXPECTED_ANSWERS_STATUS],
    ['answerAuthorityStatus', 'clarification-answer-not-approval'],
    ['candidateOnly', true],
    ['requestIrCandidateRevised', false],
    ['graphTraversalAllowed', false],
    ['contractGenerationAllowed', false],
    ['instructionPackGenerationAllowed', false],
    ['codexExecutionTriggered', false],
    ['graphSourceMutated', false],
    ['graphDeltaApplied', false],
    ['approvalStatus', 'not-approved'],
    ['humanDecisionRecorded', false],
    ['runtimeEvidenceSatisfied', false],
    ['equivalenceProven', false],
    ['scopeEnforced', false],
    ['ciEnforcementEnabled', false],
  ]
  for (const [field, expected] of expectedFields) {
    if (answers[field] !== expected) {
      findings.push({
        code: 'CLARIFICATION_ANSWERS_UNSAFE_OR_MISMATCHED',
        severity: 'error',
        field,
        message: `Clarification answers field "${field}" is not safe for Request IR Candidate revision.`,
        expected,
        actual: answers[field],
      })
    }
  }
  validateClarificationAnswerProvenance(answers, pack, findings, paths)
  if (!Array.isArray(answers.answers)) {
    findings.push({
      code: 'CLARIFICATION_ANSWERS_ARRAY_MISSING',
      severity: 'error',
      field: 'answers',
      message: 'clarification answers artifact must contain an answers array.',
      actual: answers.answers,
    })
  }
  const questionCount = numberValue(pack?.questionCount)
  const answerRecords = arrayRecords(answers.answers)
  if (questionCount === 0 && answerRecords.length > 0) {
    findings.push({
      code: 'CLARIFICATION_ANSWERS_UNEXPECTED_FOR_NO_QUESTION_PACK',
      severity: 'error',
      field: 'answers',
      message: 'Clarification answers must be empty when the pack has questionCount: 0.',
      expected: [],
      actual: answers.answers,
    })
  }
  if (questionCount > 0 && answerRecords.length === 0) {
    findings.push({
      code: 'CLARIFICATION_ANSWERS_REQUIRED',
      severity: 'error',
      field: 'answers',
      message: 'Clarification answers are required because the pack planned one or more questions.',
    })
  }
  for (const answer of answerRecords) {
    const unsafeField = findUnsafeAnswerField(answer)
    if (unsafeField) {
      findings.push({
        code: 'CLARIFICATION_ANSWER_AUTHORITY_FIELD_UNSAFE',
        severity: 'error',
        field: unsafeField,
        message: `Clarification answer attempts to set unsafe authority field "${unsafeField}".`,
        suggestedFix: 'Answers may revise only allowed Request IR candidate fields from the planned question.',
      })
    }
  }
}

function validateClarificationAnswerProvenance(
  answers: JsonRecord,
  pack: JsonRecord | null,
  findings: RequestIrCandidateRevisionFinding[],
  paths: RevisionPathContext,
): void {
  const answerPackPath = stringValue(answers.sourceClarificationInterviewPack)
  if (paths.packPath) {
    if (!answerPackPath) {
      findings.push({
        code: 'CLARIFICATION_ANSWERS_PACK_PROVENANCE_MISSING',
        severity: 'error',
        field: 'sourceClarificationInterviewPack',
        message: 'Clarification answers must identify the source Clarification Interview Pack used by the command.',
        expected: paths.packPath,
        actual: answers.sourceClarificationInterviewPack,
      })
    } else if (!sameRepoPath(paths.root, answerPackPath, paths.packPath)) {
      findings.push({
        code: 'CLARIFICATION_ANSWERS_PACK_PROVENANCE_MISMATCH',
        severity: 'error',
        field: 'sourceClarificationInterviewPack',
        message: 'Clarification answers point to a different Clarification Interview Pack than the command input.',
        expected: normalizeRepoComparablePath(paths.root, paths.packPath),
        actual: normalizeRepoComparablePath(paths.root, answerPackPath),
        suggestedFix:
          'Regenerate clarification answers for the exact Clarification Interview Pack passed to this command.',
      })
    }
  }

  const answerCandidatePath = stringValue(answers.sourceRequestIrCandidate)
  if (!answerCandidatePath) {
    return
  }

  const packCandidatePath = stringValue(pack?.sourceRequestIrCandidate)
  if (packCandidatePath && !sameRepoPath(paths.root, answerCandidatePath, packCandidatePath)) {
    findings.push({
      code: 'CLARIFICATION_ANSWERS_CANDIDATE_PROVENANCE_MISMATCH',
      severity: 'error',
      field: 'sourceRequestIrCandidate',
      message: 'Clarification answers point to a different Request IR Candidate than the source pack.',
      expected: normalizeRepoComparablePath(paths.root, packCandidatePath),
      actual: normalizeRepoComparablePath(paths.root, answerCandidatePath),
      suggestedFix: 'Regenerate clarification answers for the Request IR Candidate referenced by the pack.',
    })
  }
  if (paths.originalCandidatePath && !sameRepoPath(paths.root, answerCandidatePath, paths.originalCandidatePath)) {
    findings.push({
      code: 'CLARIFICATION_ANSWERS_CANDIDATE_PROVENANCE_MISMATCH',
      severity: 'error',
      field: 'sourceRequestIrCandidate',
      message: 'Clarification answers do not match the original Request IR Candidate loaded for revision.',
      expected: normalizeRepoComparablePath(paths.root, paths.originalCandidatePath),
      actual: normalizeRepoComparablePath(paths.root, answerCandidatePath),
      suggestedFix: 'Use clarification answers generated from the same original Request IR Candidate.',
    })
  }
}

function validateOriginalCandidate(
  originalCandidate: JsonRecord | null,
  findings: RequestIrCandidateRevisionFinding[],
): void {
  if (!originalCandidate) {
    findings.push({
      code: 'ORIGINAL_REQUEST_IR_CANDIDATE_NOT_OBJECT',
      severity: 'error',
      field: 'originalCandidate',
      message: 'Request IR Candidate revision requires the original Request IR Candidate JSON object.',
    })
    return
  }
  const validation = validateRequestIrCandidateSchemaOnly(originalCandidate)
  for (const finding of validation.validationFindings.filter((entry) => entry.severity === 'error')) {
    findings.push({
      code: `ORIGINAL_${finding.code}`,
      severity: 'error',
      field: finding.field,
      message: `Original Request IR Candidate is not safe for clarification revision: ${finding.message}`,
      expected: finding.expected,
      actual: finding.actual,
      suggestedFix: finding.suggestedFix,
    })
  }
}

function buildAppliedAnswers(
  pack: JsonRecord | null,
  answers: JsonRecord | null,
  findings: RequestIrCandidateRevisionFinding[],
): JsonRecord[] {
  const plannedQuestions = arrayRecords(pack?.plannedQuestions)
  const questionMap = new Map(plannedQuestions.map((question) => [stringValue(question.questionId), question]))
  const applied: JsonRecord[] = []

  for (const answer of arrayRecords(answers?.answers)) {
    const questionId = stringValue(answer.questionId)
    const plannedQuestion = questionMap.get(questionId)
    if (!plannedQuestion) {
      findings.push({
        code: 'CLARIFICATION_ANSWER_UNKNOWN_QUESTION',
        severity: 'error',
        field: 'answers[].questionId',
        message: `Clarification answer references unknown questionId "${questionId}".`,
        expected: [...questionMap.keys()],
        actual: questionId,
      })
      continue
    }
    const plannedField = stringValue(plannedQuestion.mapsToRequestIrField)
    const answerField = stringValue(answer.mapsToRequestIrField)
    if (!ALLOWED_REVISION_FIELDS.has(plannedField)) {
      findings.push({
        code: 'CLARIFICATION_PACK_QUESTION_FIELD_UNSUPPORTED',
        severity: 'error',
        field: 'plannedQuestions[].mapsToRequestIrField',
        message: 'Clarification pack planned a question outside the allowed Request IR revision vocabulary.',
        expected: [...ALLOWED_REVISION_FIELDS],
        actual: plannedField,
      })
      continue
    }
    if (answerField && answerField !== plannedField) {
      findings.push({
        code: 'CLARIFICATION_ANSWER_FIELD_MISMATCH',
        severity: 'error',
        field: 'answers[].mapsToRequestIrField',
        message: 'Clarification answer maps to a different Request IR field than the planned question.',
        expected: plannedField,
        actual: answerField,
      })
      continue
    }
    if (answer.answerAuthorityStatus !== 'clarification-answer-not-approval') {
      findings.push({
        code: 'CLARIFICATION_ANSWER_AUTHORITY_STATUS_UNSAFE',
        severity: 'error',
        field: 'answers[].answerAuthorityStatus',
        message: 'Clarification answer must not claim approval or source authority.',
        expected: 'clarification-answer-not-approval',
        actual: answer.answerAuthorityStatus,
      })
      continue
    }
    const value = answer.candidateValue ?? answer.answerValue ?? answer.freeformAnswer
    if (value === undefined) {
      findings.push({
        code: 'CLARIFICATION_ANSWER_VALUE_MISSING',
        severity: 'error',
        field: 'answers[].candidateValue',
        message: 'Clarification answer must provide candidateValue, answerValue, or freeformAnswer.',
      })
      continue
    }
    applied.push({
      questionId,
      mapsToRequestIrField: plannedField,
      candidateValue: value,
      answerAuthorityStatus: 'clarification-answer-not-approval',
    })
  }

  return applied
}

function buildRevisedCandidate(
  originalCandidate: JsonRecord,
  pack: JsonRecord | null,
  appliedAnswers: JsonRecord[],
  paths: {
    packPath?: string
    answersPath?: string
    originalCandidatePath?: string
    outputPath?: string
  },
): JsonRecord {
  const revised: JsonRecord = {
    ...structuredClone(originalCandidate),
    artifactRole: 'request-ir-candidate',
    status: 'request-ir-candidate-revised-previewed',
    requestIrCandidateStatus: 'candidate-only',
    candidateOnly: true,
    authorityStatus: 'not-authoritative-until-validated',
    revisionAuthorityStatus: 'clarification-derived-candidate-not-validated',
    sourceClarificationInterviewPack: paths.packPath ?? '<in-memory>',
    sourceClarificationAnswers: paths.answersPath ?? '<in-memory>',
    sourceOriginalRequestIrCandidate: paths.originalCandidatePath ?? '<in-memory>',
    clarificationRevisionStatus:
      appliedAnswers.length === 0 ? 'no-op-revision-generated' : 'answers-applied-candidate-only',
    clarificationAnswersApplied: appliedAnswers,
    clarificationAnswersAppliedCount: appliedAnswers.length,
    clarificationAnswersAuthorityStatus: 'clarification-answer-not-approval',
    validationRequiredAgain: true,
    validationChainRequiredAgain: arrayRecords(pack?.validationChainRequiredAgain),
    nextValidationCommands: [
      {
        step: 'schema-only-request-ir-validation',
        command: `graph read-model validate-request-ir --candidate ${paths.outputPath ?? '<revisedCandidatePath>'} --json`,
      },
      {
        step: 'graph-aware-request-ir-validation',
        command:
          'graph read-model validate-request-ir-graph --candidate <revisedCandidatePath> --schema-validation <schemaValidationPath> --json',
      },
    ],
    validatedRequestIr: false,
    requestIrValidationStatus: 'not-validated-after-clarification-revision',
    schemaOnlyValidationResult: null,
    graphAwareValidationResultStatus: 'not-run-after-clarification-revision',
    graphAwareValidationResultArtifact: null,
    futureValidatorExpectations: {
      ...(asRecord(originalCandidate.futureValidatorExpectations) ?? {}),
      schemaOnlyValidationResult: null,
      graphAwareValidationResult: null,
      revisedCandidateValidationRequiredAgain: true,
    },
    graphTraversalAllowed: false,
    contractGenerationAllowed: false,
    instructionPackGenerationAllowed: false,
    graphTraversalAllowedFromUnvalidatedAiOutput: false,
    contractGenerationAllowedFromUnvalidatedAiOutput: false,
    instructionPackGenerationAllowedFromUnvalidatedAiOutput: false,
    selectedGraphSliceGenerated: false,
    contractCompilerInputGenerated: false,
    contractInputGenerated: false,
    instructionPackGenerated: false,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: paths.outputPath ?? null,
    writtenOutputPathAuthorityStatus: paths.outputPath
      ? 'explicit-preview-output-not-source-authority'
      : 'not-written-stdout-only',
    nonExecutionBoundary:
      'This revised Request IR Candidate is clarification-derived and candidate-only. It has not run schema-only validation, graph-aware validation, graph traversal, selected slice generation, Contract Compiler Input generation, Instruction Pack generation, Codex execution, graph-source mutation, graph delta apply, approval, runtime Evidence satisfaction, equivalence proof, scope enforcement, or CI enforcement.',
  }

  for (const answer of appliedAnswers) {
    revised[stringValue(answer.mapsToRequestIrField)] = answer.candidateValue
  }
  revised.requiresClarification = appliedAnswers.length > 0 ? false : Boolean(originalCandidate.requiresClarification)
  revised.humanReviewRequired = true
  return revised
}

function findUnsafeAnswerField(value: unknown): string | null {
  const visit = (entry: unknown): string | null => {
    if (Array.isArray(entry)) {
      for (const item of entry) {
        const found = visit(item)
        if (found) {
          return found
        }
      }
      return null
    }
    const record = asRecord(entry)
    if (!record) {
      return null
    }
    for (const [key, nested] of Object.entries(record)) {
      if (UNSAFE_ANSWER_FIELDS.has(key)) {
        return key
      }
      const found = visit(nested)
      if (found) {
        return found
      }
    }
    return null
  }
  return visit(value)
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) {
    return null
  }
  const record = asRecord(parsed.value)
  if (!record) {
    return null
  }
  const artifactRole = stringValue(record.artifactRole)
  if (artifactRole.includes('graph-source')) {
    return `graph-source artifactRole "${artifactRole}"`
  }
  if (
    artifactRole === 'clarification-interview-pack' ||
    artifactRole === 'clarification-answers-preview' ||
    artifactRole === 'selected-graph-slice' ||
    artifactRole === 'graph-traversal-plan' ||
    artifactRole === 'contract-compiler-input' ||
    artifactRole === 'instruction-pack'
  ) {
    return `selected frontend/source artifactRole "${artifactRole}"`
  }
  if (asRecord(record.sourceRecords)) {
    return 'graph-source-shaped sourceRecords'
  }
  if (asRecord(record.taxonomy) && (Array.isArray(record.nodes) || Array.isArray(record.edges))) {
    return 'generated read-model source-authority projection'
  }
  return null
}

function classifyReservedSourcePath(filePath: string): string | null {
  const normalized = path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
  if (normalized.endsWith('/graph-source.json')) {
    return 'graph-source path'
  }
  if (normalized.includes('/.pbe/evidence/')) {
    return 'evidence authority path'
  }
  if (normalized.includes('/.pbe/control/') || normalized.includes('/.pbe/tree/')) {
    return 'PBE source/control path'
  }
  if (
    normalized.endsWith('/generated/generated-read-model.json') ||
    normalized.endsWith('/generated/graph-source-read-model-projection.json')
  ) {
    return 'generated read-model source authority path'
  }
  return null
}

function collectConcretePathStrings(value: unknown): string[] {
  const paths: string[] = []
  const visit = (entry: unknown): void => {
    if (typeof entry === 'string') {
      if (isConcreteOutputProtectedPath(entry)) {
        paths.push(entry)
      }
      return
    }
    if (Array.isArray(entry)) {
      for (const item of entry) {
        visit(item)
      }
      return
    }
    const record = asRecord(entry)
    if (!record) {
      return
    }
    for (const item of Object.values(record)) {
      visit(item)
    }
  }
  visit(value)
  return uniqueStrings(paths)
}

function isConcreteOutputProtectedPath(candidatePath: string): boolean {
  const normalized = candidatePath.replaceAll('\\', '/')
  return (
    Boolean(normalized) &&
    !normalized.startsWith('unresolved:') &&
    normalized !== '<in-memory>' &&
    !normalized.includes('<') &&
    !normalized.includes('\n') &&
    (normalized.includes('/') || normalized.startsWith('.')) &&
    /\.(json|md|txt)$/i.test(normalized)
  )
}

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as JsonRecord
}

function arrayRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.flatMap((entry) => (asRecord(entry) ? [entry as JsonRecord] : [])) : []
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function numberValue(value: unknown): number {
  return typeof value === 'number' ? value : 0
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((entry) => entry.length > 0))]
}

function resolveRepoPath(root: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(root, inputPath)
}

function sameRepoPath(root: string | undefined, left: string, right: string): boolean {
  return normalizeRepoComparablePath(root, left) === normalizeRepoComparablePath(root, right)
}

function normalizeRepoComparablePath(root: string | undefined, inputPath: string): string {
  const base = root ?? process.cwd()
  return resolveRepoPath(base, inputPath).replaceAll('\\', '/').toLowerCase()
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}
