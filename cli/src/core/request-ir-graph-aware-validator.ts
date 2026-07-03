import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic } from './fs.js'
import type { IssueSeverity } from './types.js'

const VALIDATOR_NAME = 'RequestIrGraphAwareValidator'
const COMPATIBLE_CANDIDATE_SCHEMA_ID = 'devview-request-ir-candidate-v0-preview'
const COMPATIBLE_SCHEMA_VALIDATOR = 'RequestIrCandidateSchemaOnlyValidator'
const DEFAULT_GRAPH_SOURCE_PATH = 'examples/valid/todo-app-pbe-run/graph-source.json'
const DEFAULT_READ_MODEL_PATH = 'examples/valid/todo-app-pbe-run/generated/generated-read-model.json'
const DEFAULT_COMPILER_INPUT_DRAFT_PATH =
  'examples/valid/todo-app-pbe-run/generated/compiler-input-model-calibration-draft.runtime-evidence-only.json'

type JsonRecord = Record<string, unknown>

export interface RequestIrGraphAwareValidationFinding {
  code: string
  severity: IssueSeverity
  field?: string
  message: string
  expected?: unknown
  actual?: unknown
  suggestedFix?: string
}

export interface RequestIrGraphAuthorityInputs {
  graphSource?: unknown
  generatedReadModel?: unknown
  compilerInputCalibrationDraft?: unknown
  graphSourcePath?: string
  generatedReadModelPath?: string
  compilerInputCalibrationDraftPath?: string
}

export interface RequestIrGraphAwareValidationResult {
  schemaVersion: 1
  artifactRole: 'request-ir-graph-aware-validation'
  status: 'request-ir-graph-aware-validation-complete' | 'request-ir-graph-aware-validation-blocked'
  validatorName: typeof VALIDATOR_NAME
  validationScope: 'graph-aware-validation-no-traversal'
  candidatePath: string
  schemaValidationPath: string
  schemaValidationPrerequisiteStatus: 'passed' | 'blocked'
  graphAuthorityInputs: {
    graphSourcePath: string
    generatedReadModelPath: string
    compilerInputCalibrationDraftPath: string
    graphSourceStatus: string
    graphSourcePolicyLevel: string
    graphSourceScope: string
    graphSourceNodeCount: number
    graphSourceEdgeCount: number
    sourceAuthorityBoundary: string
  }
  targetRecordValidationStatus: 'resolved' | 'unresolved' | 'validation-blocked'
  targetRecordResolution: JsonRecord
  targetComponentValidationStatus: 'resolved' | 'unresolved' | 'validation-blocked'
  targetComponentResolution: JsonRecord
  requestTypeValidationStatus: 'resolved' | 'unresolved' | 'validation-blocked'
  changeTypeCompatibilityStatus: 'compatible' | 'incompatible' | 'validation-blocked'
  changeTypeCompatibility: JsonRecord
  scopeIntentValidationStatus: 'resolved' | 'unresolved' | 'validation-blocked'
  scopeIntentResolution: JsonRecord
  requiredEvidenceAvailabilityStatus: 'resolved' | 'unresolved' | 'validation-blocked'
  requiredEvidenceResolution: JsonRecord
  riskIntentValidationStatus: 'resolved' | 'unresolved' | 'validation-blocked'
  riskIntentResolution: JsonRecord
  graphValidationStatus: 'graph-aware-valid' | 'review-required' | 'validation-blocked'
  graphTraversalAllowed: boolean
  graphTraversalPermissionMeaning: 'future-pass-permission-only' | 'not-allowed'
  graphTraversalExecuted: false
  selectedGraphSliceGenerated: false
  contractGenerationAllowed: false
  contractInputGenerated: false
  instructionPackGenerationAllowed: false
  instructionPackGenerated: false
  requiresClarification: boolean
  humanReviewRequired: boolean
  aiClassifierImplemented: false
  llmCallsIntroduced: false
  graphSourceInspected: true
  graphNodeExistenceValidated: boolean
  graphEdgeExistenceValidated: false
  graphSourceMutated: false
  graphDeltaApplied: false
  approvalStatus: 'not-approved'
  equivalenceProven: false
  runtimeEvidenceSatisfied: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-preview-output-not-graph-source'
  validationFindings: RequestIrGraphAwareValidationFinding[]
  nonExecutionBoundary: string
}

export interface RequestIrGraphAwareValidationFileResult {
  result: RequestIrGraphAwareValidationResult
  outputPath?: string
}

export function validateRequestIrGraphAware(
  candidate: unknown,
  schemaValidation: unknown,
  authorityInputs: RequestIrGraphAuthorityInputs,
  paths: {
    candidatePath?: string
    schemaValidationPath?: string
  } = {},
): RequestIrGraphAwareValidationResult {
  const findings: RequestIrGraphAwareValidationFinding[] = []
  const candidateRecord = asRecord(candidate)
  const schemaRecord = asRecord(schemaValidation)
  const graphSource = asRecord(authorityInputs.graphSource)
  const readModel = asRecord(authorityInputs.generatedReadModel)
  const draft = asRecord(authorityInputs.compilerInputCalibrationDraft)

  const schemaValidationPrerequisiteStatus = validateSchemaPrerequisite(schemaRecord, findings)

  if (!candidateRecord) {
    findings.push({
      code: 'REQUEST_IR_GRAPH_VALIDATION_CANDIDATE_NOT_OBJECT',
      severity: 'error',
      message: 'Graph-aware Request IR validation requires a Request IR Candidate JSON object.',
      suggestedFix: 'Run schema-only Request IR validation on a candidate object before graph-aware validation.',
    })
  } else if (candidateRecord.schemaId !== COMPATIBLE_CANDIDATE_SCHEMA_ID) {
    findings.push({
      code: 'REQUEST_IR_GRAPH_VALIDATION_CANDIDATE_SCHEMA_UNSUPPORTED',
      severity: 'error',
      field: 'schemaId',
      message: `Request IR Candidate schemaId must be "${COMPATIBLE_CANDIDATE_SCHEMA_ID}".`,
      expected: COMPATIBLE_CANDIDATE_SCHEMA_ID,
      actual: candidateRecord.schemaId,
    })
  }

  if (!graphSource) {
    findings.push({
      code: 'REQUEST_IR_GRAPH_AUTHORITY_SOURCE_MISSING',
      severity: 'error',
      message: 'Graph-aware validation requires a readable graph-source/read-model authority object.',
      suggestedFix: 'Provide the Todo App graph-source metadata referenced by the Request IR Candidate.',
    })
  }

  const nodes = arrayRecords(asRecord(graphSource?.sourceRecords)?.nodes)
  const edges = arrayRecords(asRecord(graphSource?.sourceRecords)?.edges)
  const targetRecordId = stringValue(candidateRecord?.targetRecordIdCandidate)
  const targetComponent = stringValue(candidateRecord?.targetComponentCandidate)
  const requestType = stringValue(candidateRecord?.requestTypeCandidate)
  const changeType = stringValue(candidateRecord?.changeTypeCandidate)
  const targetRecord = nodes.find((node) => node.id === targetRecordId) || null
  const readModelRecord = arrayRecords(readModel?.nodes).find((node) => node.id === targetRecordId) || null

  const targetRecordValidationStatus =
    !candidateRecord || !graphSource ? 'validation-blocked' : targetRecord ? 'resolved' : 'unresolved'
  if (candidateRecord && graphSource && !targetRecord) {
    findings.push({
      code: 'REQUEST_IR_GRAPH_TARGET_RECORD_UNRESOLVED',
      severity: 'error',
      field: 'targetRecordIdCandidate',
      message: `targetRecordIdCandidate "${targetRecordId || '<empty>'}" was not found in graph-source records.`,
      suggestedFix: 'Choose a graph-source record id that exists before attempting graph traversal.',
    })
  }

  const componentResolved = componentMatches(targetComponent, graphSource, draft, readModel)
  const targetComponentValidationStatus =
    !candidateRecord || !graphSource ? 'validation-blocked' : componentResolved ? 'resolved' : 'unresolved'
  if (candidateRecord && graphSource && !componentResolved) {
    findings.push({
      code: 'REQUEST_IR_GRAPH_TARGET_COMPONENT_UNRESOLVED',
      severity: 'error',
      field: 'targetComponentCandidate',
      message: `targetComponentCandidate "${targetComponent || '<empty>'}" could not be resolved against Todo App graph/read-model metadata.`,
      suggestedFix: 'Use a target component visible in graph-source/read-model metadata before traversal.',
    })
  }

  const requestTypeValidationStatus = requestType === 'runtime-evidence-only' ? 'resolved' : 'unresolved'
  if (candidateRecord && requestTypeValidationStatus === 'unresolved') {
    findings.push({
      code: 'REQUEST_IR_GRAPH_REQUEST_TYPE_UNRESOLVED',
      severity: 'error',
      field: 'requestTypeCandidate',
      message: 'The first graph-aware validator slice only resolves runtime-evidence-only requests.',
      expected: 'runtime-evidence-only',
      actual: requestType,
    })
  }

  const compatibleChangeType =
    requestType === 'runtime-evidence-only' &&
    changeType === 'test-only-behavior-proof' &&
    stringValue(graphSource?.policyLevel) === 'structure-only' &&
    policyExists(draft, 'test-only-behavior-proof-boundary')
  const changeTypeCompatibilityStatus =
    !candidateRecord || !graphSource ? 'validation-blocked' : compatibleChangeType ? 'compatible' : 'incompatible'
  if (candidateRecord && graphSource && !compatibleChangeType) {
    findings.push({
      code: 'REQUEST_IR_GRAPH_CHANGE_TYPE_INCOMPATIBLE',
      severity: 'error',
      field: 'changeTypeCandidate',
      message:
        'changeTypeCandidate must be compatible with runtime-evidence-only, structure-only Todo App calibration policy before traversal.',
      expected: 'test-only-behavior-proof with test-only-behavior-proof-boundary policy',
      actual: changeType,
    })
  }

  const scopeResolved =
    stringArray(candidateRecord?.allowedScopeIntentCandidate).length > 0 &&
    stringArray(candidateRecord?.forbiddenScopeIntentCandidate).length > 0 &&
    arrayRecords(draft?.targetScopeCandidates).length > 0 &&
    arrayRecords(asRecord(draft?.policySnapshot)?.forbiddenScopeRules).length > 0
  const scopeIntentValidationStatus =
    !candidateRecord || !draft ? 'validation-blocked' : scopeResolved ? 'resolved' : 'unresolved'
  if (candidateRecord && draft && !scopeResolved) {
    findings.push({
      code: 'REQUEST_IR_GRAPH_SCOPE_INTENT_UNRESOLVED',
      severity: 'error',
      field: 'allowedScopeIntentCandidate',
      message: 'Scope intent candidates could not be resolved against calibration scope/policy metadata.',
    })
  }

  const evidenceMappings = arrayRecords(asRecord(draft?.policySnapshot)?.evidenceCheckMappings)
  const evidenceResolved =
    stringArray(candidateRecord?.requiredEvidenceIntentCandidate).length > 0 && evidenceMappings.length > 0
  const requiredEvidenceAvailabilityStatus =
    !candidateRecord || !draft ? 'validation-blocked' : evidenceResolved ? 'resolved' : 'unresolved'
  if (candidateRecord && draft && !evidenceResolved) {
    findings.push({
      code: 'REQUEST_IR_GRAPH_REQUIRED_EVIDENCE_UNRESOLVED',
      severity: 'error',
      field: 'requiredEvidenceIntentCandidate',
      message: 'Required Evidence intent candidates could not be mapped to calibration evidence policy metadata.',
    })
  }

  const riskResolved =
    stringArray(candidateRecord?.riskIntentCandidate).length > 0 && arrayRecords(draft?.riskSources).length > 0
  const riskIntentValidationStatus =
    !candidateRecord || !draft ? 'validation-blocked' : riskResolved ? 'resolved' : 'unresolved'
  if (candidateRecord && draft && !riskResolved) {
    findings.push({
      code: 'REQUEST_IR_GRAPH_RISK_INTENT_UNRESOLVED',
      severity: 'warning',
      field: 'riskIntentCandidate',
      message:
        'Risk intent candidates could not be fully mapped to calibration risk metadata; human review remains required.',
    })
  }

  const hasErrors = findings.some((finding) => finding.severity === 'error')
  const blocked = schemaValidationPrerequisiteStatus === 'blocked' || hasErrors
  const graphTraversalAllowed = !blocked
  const graphValidationStatus = blocked ? 'validation-blocked' : 'graph-aware-valid'

  return {
    schemaVersion: 1,
    artifactRole: 'request-ir-graph-aware-validation',
    status: blocked ? 'request-ir-graph-aware-validation-blocked' : 'request-ir-graph-aware-validation-complete',
    validatorName: VALIDATOR_NAME,
    validationScope: 'graph-aware-validation-no-traversal',
    candidatePath: paths.candidatePath ?? '<in-memory>',
    schemaValidationPath: paths.schemaValidationPath ?? '<in-memory>',
    schemaValidationPrerequisiteStatus,
    graphAuthorityInputs: {
      graphSourcePath: authorityInputs.graphSourcePath ?? DEFAULT_GRAPH_SOURCE_PATH,
      generatedReadModelPath: authorityInputs.generatedReadModelPath ?? DEFAULT_READ_MODEL_PATH,
      compilerInputCalibrationDraftPath:
        authorityInputs.compilerInputCalibrationDraftPath ?? DEFAULT_COMPILER_INPUT_DRAFT_PATH,
      graphSourceStatus: stringValue(graphSource?.status) || 'missing',
      graphSourcePolicyLevel: stringValue(graphSource?.policyLevel) || 'missing',
      graphSourceScope: stringValue(graphSource?.graphSourceScope) || 'missing',
      graphSourceNodeCount: nodes.length,
      graphSourceEdgeCount: edges.length,
      sourceAuthorityBoundary: stringValue(graphSource?.sourceAuthorityBoundary),
    },
    targetRecordValidationStatus,
    targetRecordResolution: targetRecord
      ? {
          candidate: targetRecordId,
          resolvedRecordId: targetRecord.id,
          nodeKind: targetRecord.nodeKind,
          sourceArtifact: targetRecord.sourceArtifact,
          status: targetRecord.status,
          graphSourceAuthorityStatus: 'resolved-from-structure-only-graph-source',
          readModelRecordPresent: Boolean(readModelRecord),
          authorityBoundary: 'record existence is resolved for future traversal permission only, not source promotion',
        }
      : {
          candidate: targetRecordId,
          graphSourceAuthorityStatus: 'unresolved',
        },
    targetComponentValidationStatus,
    targetComponentResolution: componentResolved
      ? {
          candidate: targetComponent,
          resolvedComponent: 'Todo App PBE Run',
          graphSourceScope: stringValue(graphSource?.graphSourceScope),
          sourceProfile: stringValue(graphSource?.sourceProfile),
          authorityStatus: 'resolved-from-calibration-fixture-and-graph-source-scope',
          authorityBoundary: 'component resolution permits a future traversal attempt only',
        }
      : {
          candidate: targetComponent,
          authorityStatus: 'unresolved',
        },
    requestTypeValidationStatus,
    changeTypeCompatibilityStatus,
    changeTypeCompatibility: {
      requestTypeCandidate: requestType,
      changeTypeCandidate: changeType,
      compatiblePolicy: compatibleChangeType ? 'test-only-behavior-proof-boundary' : null,
      graphSourcePolicyLevel: stringValue(graphSource?.policyLevel),
      compatibilityBoundary: 'compatibility does not generate contract input or instruction packs',
    },
    scopeIntentValidationStatus,
    scopeIntentResolution: {
      allowedScopeIntentCandidate: stringArray(candidateRecord?.allowedScopeIntentCandidate),
      forbiddenScopeIntentCandidate: stringArray(candidateRecord?.forbiddenScopeIntentCandidate),
      targetScopeCandidateCount: arrayRecords(draft?.targetScopeCandidates).length,
      forbiddenScopeRuleCount: arrayRecords(asRecord(draft?.policySnapshot)?.forbiddenScopeRules).length,
      resolutionBoundary: 'scope intent is resolved enough for future traversal permission, not enforcement',
    },
    requiredEvidenceAvailabilityStatus,
    requiredEvidenceResolution: {
      requiredEvidenceIntentCandidate: stringArray(candidateRecord?.requiredEvidenceIntentCandidate),
      evidenceCheckMappingCount: evidenceMappings.length,
      runtimeEvidenceSatisfied: false,
      acceptedEvidence: false,
      resolutionBoundary: 'evidence policy is resolvable, but Evidence is not accepted or satisfied by this validator',
    },
    riskIntentValidationStatus,
    riskIntentResolution: {
      riskIntentCandidate: stringArray(candidateRecord?.riskIntentCandidate),
      riskSourceCount: arrayRecords(draft?.riskSources).length,
      resolutionBoundary: 'risk intent informs future traversal planning only',
    },
    graphValidationStatus,
    graphTraversalAllowed,
    graphTraversalPermissionMeaning: graphTraversalAllowed ? 'future-pass-permission-only' : 'not-allowed',
    graphTraversalExecuted: false,
    selectedGraphSliceGenerated: false,
    contractGenerationAllowed: false,
    contractInputGenerated: false,
    instructionPackGenerationAllowed: false,
    instructionPackGenerated: false,
    requiresClarification: blocked,
    humanReviewRequired: true,
    aiClassifierImplemented: false,
    llmCallsIntroduced: false,
    graphSourceInspected: true,
    graphNodeExistenceValidated: targetRecordValidationStatus === 'resolved',
    graphEdgeExistenceValidated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    validationFindings: findings,
    nonExecutionBoundary:
      'This graph-aware Request IR validator resolves candidate fields against graph/read-model metadata only far enough to decide whether a later traversal pass may be attempted. It does not call an LLM, run graph traversal, create traversal plans, select nodes or edges, generate selected graph slices, generate contract compiler input, generate instruction packs, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, reject diffs, or configure required checks.',
  }
}

export async function validateRequestIrGraphAwareFile(
  root: string,
  candidatePath: string,
  schemaValidationPath: string,
  options: { output?: string } = {},
): Promise<RequestIrGraphAwareValidationFileResult> {
  const resolvedCandidatePath = resolveRepoPath(root, candidatePath)
  const candidate = await readJsonSafe<Record<string, unknown>>(resolvedCandidatePath)
  if (!candidate.ok) {
    throw new Error(`Unable to read Request IR Candidate from ${candidatePath}: ${candidate.error}`)
  }

  const resolvedSchemaValidationPath = resolveRepoPath(root, schemaValidationPath)
  const schemaValidation = await readJsonSafe<Record<string, unknown>>(resolvedSchemaValidationPath)
  if (!schemaValidation.ok) {
    throw new Error(
      `Unable to read schema-only Request IR validation from ${schemaValidationPath}: ${schemaValidation.error}`,
    )
  }

  const authorityPaths = graphAuthorityPaths(candidate.value)
  const graphSource = await readOptionalJson(resolveRepoPath(root, authorityPaths.graphSourcePath))
  const generatedReadModel = await readOptionalJson(resolveRepoPath(root, authorityPaths.generatedReadModelPath))
  const compilerInputCalibrationDraft = await readOptionalJson(
    resolveRepoPath(root, authorityPaths.compilerInputCalibrationDraftPath),
  )

  const result = validateRequestIrGraphAware(
    candidate.value,
    schemaValidation.value,
    {
      graphSource,
      generatedReadModel,
      compilerInputCalibrationDraft,
      graphSourcePath: authorityPaths.graphSourcePath,
      generatedReadModelPath: authorityPaths.generatedReadModelPath,
      compilerInputCalibrationDraftPath: authorityPaths.compilerInputCalibrationDraftPath,
    },
    {
      candidatePath: relativePath(root, resolvedCandidatePath),
      schemaValidationPath: relativePath(root, resolvedSchemaValidationPath),
    },
  )

  let outputPath: string | undefined
  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    result.writtenOutputPath = outputPath
    result.writtenOutputPathAuthorityStatus = 'explicit-preview-output-not-graph-source'
    await writeJsonAtomic(resolvedOutputPath, result)
  }

  return { result, ...(outputPath ? { outputPath } : {}) }
}

function validateSchemaPrerequisite(
  schemaRecord: JsonRecord | null,
  findings: RequestIrGraphAwareValidationFinding[],
): RequestIrGraphAwareValidationResult['schemaValidationPrerequisiteStatus'] {
  if (!schemaRecord) {
    findings.push({
      code: 'REQUEST_IR_GRAPH_SCHEMA_VALIDATION_MISSING',
      severity: 'error',
      field: 'schemaValidation',
      message: 'Graph-aware validation requires a schema-only validation result object.',
      suggestedFix: 'Run graph read-model validate-request-ir before graph-aware validation.',
    })
    return 'blocked'
  }

  const expectedFields: Array<[string, unknown]> = [
    ['artifactRole', 'request-ir-candidate-schema-only-validation'],
    ['validatorName', COMPATIBLE_SCHEMA_VALIDATOR],
    ['schemaValidationStatus', 'schema-valid'],
    ['requestIrValidationStatus', 'schema-valid-graph-validation-not-run'],
    ['graphTraversalAllowed', false],
    ['contractGenerationAllowed', false],
    ['instructionPackGenerationAllowed', false],
  ]
  for (const [field, expected] of expectedFields) {
    if (schemaRecord[field] !== expected) {
      findings.push({
        code: 'REQUEST_IR_GRAPH_SCHEMA_VALIDATION_PREREQUISITE_UNSAFE',
        severity: 'error',
        field,
        message: `Schema-only validation prerequisite field "${field}" is not safe for graph-aware validation.`,
        expected,
        actual: schemaRecord[field],
        suggestedFix: 'Regenerate schema-only validation and keep traversal/contract generation disabled.',
      })
    }
  }

  const errorFindings = arrayRecords(schemaRecord.validationFindings).filter((finding) => finding.severity === 'error')
  if (errorFindings.length > 0) {
    findings.push({
      code: 'REQUEST_IR_GRAPH_SCHEMA_VALIDATION_HAS_ERRORS',
      severity: 'error',
      field: 'validationFindings',
      message: 'Schema-only validation contains error findings; graph-aware validation must not proceed.',
      actual: errorFindings.length,
    })
  }

  return findings.some((finding) => finding.severity === 'error') ? 'blocked' : 'passed'
}

function graphAuthorityPaths(candidate: JsonRecord): {
  graphSourcePath: string
  generatedReadModelPath: string
  compilerInputCalibrationDraftPath: string
} {
  const expectations = asRecord(candidate.futureValidatorExpectations)
  return {
    graphSourcePath: stringValue(expectations?.graphSourceMetadata) || DEFAULT_GRAPH_SOURCE_PATH,
    generatedReadModelPath: stringValue(expectations?.generatedReadModel) || DEFAULT_READ_MODEL_PATH,
    compilerInputCalibrationDraftPath:
      stringValue(expectations?.compilerInputCalibrationDraft) || DEFAULT_COMPILER_INPUT_DRAFT_PATH,
  }
}

async function readOptionalJson(filePath: string): Promise<unknown> {
  const parsed = await readJsonSafe(filePath)
  return parsed.ok ? parsed.value : undefined
}

function componentMatches(
  targetComponent: string,
  graphSource: JsonRecord | null,
  draft: JsonRecord | null,
  readModel: JsonRecord | null,
): boolean {
  if (!targetComponent) {
    return false
  }
  const needle = normalizeText(targetComponent)
  const candidates = [
    graphSource?.sourceSlice,
    graphSource?.sourceProfile,
    graphSource?.graphSourceScope,
    graphSource?.sourceAuthorityBoundary,
    asRecord(draft?.calibrationFixture)?.projectName,
    asRecord(readModel?.metadata)?.sliceProfileDisplayName,
  ].map((entry) => normalizeText(stringValue(entry)))
  return candidates.some((entry) => entry.includes(needle))
}

function policyExists(draft: JsonRecord | null, policyId: string): boolean {
  const policies = arrayRecords(asRecord(draft?.policySnapshot)?.policies)
  return policies.some((policy) => policy.id === policyId)
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function resolveRepoPath(root: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(root, inputPath)
}
