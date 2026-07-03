import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import type { IssueSeverity } from './types.js'

const GENERATOR_NAME = 'InstructionPackGenerator'
const COMPATIBLE_INSTRUCTION_PACK_SCHEMA = 'schemas/pbe/instruction-pack-v0.json'
const REQUIRED_GROUPS = [
  'humanRequest',
  'graphSnapshot',
  'packSchema',
  'policySnapshot',
  'evidenceIndex',
  'targetScopeCandidates',
  'allowedScope',
  'forbiddenScope',
  'requiredEvidence',
  'outputRequirements',
  'stopConditions',
  'knownRisks',
]

type JsonRecord = Record<string, unknown>

export interface InstructionPackFinding {
  code: string
  severity: IssueSeverity
  field?: string
  message: string
  expected?: unknown
  actual?: unknown
  suggestedFix?: string
}

export interface InstructionPackResult {
  schemaVersion: 1
  artifactRole: 'instruction-pack'
  status: 'instruction-pack-generated' | 'instruction-pack-blocked'
  generatorName: typeof GENERATOR_NAME
  generationScope: 'contract-input-to-instruction-pack-no-execution'
  compatibleInstructionPackSchema: string
  compatibilityStatus: 'frontend-generated-preview-compatible-with-common-instruction-pack-sections' | 'blocked'
  sourceContractInput: string
  sourceSelectedGraphSlice: string
  sourceTraversalPlan: string
  sourceGraphAwareValidation: string
  graphSourcePath: string
  generatedReadModelPath: string
  instructionPackGenerated: boolean
  codexExecutionTriggered: false
  graphSourceMutated: false
  graphDeltaApplied: false
  approvalStatus: 'not-approved'
  humanDecisionRecorded: false
  equivalenceProven: false
  runtimeEvidenceSatisfied: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  sourceMode: 'frontend-contract-input-instruction-pack-preview'
  sourceRecordId: string
  sourceRecordPath: string
  target: JsonRecord
  userConfirmedIntent: JsonRecord
  taskSummary: string
  allowedScope: JsonRecord[]
  forbiddenScope: JsonRecord[]
  requiredEvidence: JsonRecord[]
  stopConditions: JsonRecord[]
  knownRisks: JsonRecord[]
  outputRequirements: JsonRecord[]
  executionInstructions: string[]
  nonGoals: string[]
  verificationInstructions: string[]
  graphContext: JsonRecord
  trace: JsonRecord[]
  validationFindings: InstructionPackFinding[]
  humanReviewRequired: boolean
  requiresClarification: boolean
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  markdownReportPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-preview-output-not-graph-source'
  markdownReportAuthorityStatus: 'not-written' | 'explicit-preview-output-not-graph-source'
  executionBoundary: JsonRecord
  nonExecutionBoundary: string
}

export interface InstructionPackFileResult {
  pack: InstructionPackResult
  outputPath?: string
  markdownReport?: string
}

export function generateInstructionPack(
  contractInput: unknown,
  sourceContractInput = '<in-memory>',
): InstructionPackResult {
  const input = asRecord(contractInput)
  const findings: InstructionPackFinding[] = []
  validateContractInputPrerequisites(input, findings)

  const inputFindings = arrayRecords(input?.validationFindings)
  for (const finding of inputFindings) {
    if (finding.severity === 'error') {
      findings.push({
        code: 'INSTRUCTION_PACK_CONTRACT_INPUT_HAS_ERROR_FINDING',
        severity: 'error',
        field: 'validationFindings',
        message: `Contract Compiler Input contains an error finding: ${stringValue(finding.code) || 'unknown'}.`,
        suggestedFix: 'Regenerate or repair Contract Compiler Input before instruction pack generation.',
      })
    }
  }

  const allowedScope = arrayRecords(input?.allowedScope)
  const forbiddenScope = arrayRecords(input?.forbiddenScope)
  const requiredEvidence = arrayRecords(input?.requiredEvidence)
  const outputRequirements = arrayRecords(input?.outputRequirements)
  const stopConditions = arrayRecords(input?.stopConditions)
  const knownRisks = arrayRecords(input?.knownRisks)

  const blocked = findings.some((finding) => finding.severity === 'error')
  const humanRequest = asRecord(input?.humanRequest)
  const taskSummary =
    stringValue(humanRequest?.text) ||
    stringValue(input?.changeId) ||
    'Follow the selected-slice Contract Compiler Input boundary.'
  const sourceSelectedGraphSlice = stringValue(input?.sourceSelectedGraphSlice)
  const sourceTraversalPlan = stringValue(input?.sourceTraversalPlan)
  const sourceGraphAwareValidation = stringValue(input?.sourceGraphAwareValidation)
  const graphSourcePath = stringValue(input?.graphSourcePath)
  const generatedReadModelPath = stringValue(input?.generatedReadModelPath)
  const sourceRecordId = stringValue(input?.changeId) || 'contract-input-instruction-pack-preview'
  const trace = buildTrace(input, sourceContractInput)

  return {
    schemaVersion: 1,
    artifactRole: 'instruction-pack',
    status: blocked ? 'instruction-pack-blocked' : 'instruction-pack-generated',
    generatorName: GENERATOR_NAME,
    generationScope: 'contract-input-to-instruction-pack-no-execution',
    compatibleInstructionPackSchema: COMPATIBLE_INSTRUCTION_PACK_SCHEMA,
    compatibilityStatus: blocked
      ? 'blocked'
      : 'frontend-generated-preview-compatible-with-common-instruction-pack-sections',
    sourceContractInput,
    sourceSelectedGraphSlice,
    sourceTraversalPlan,
    sourceGraphAwareValidation,
    graphSourcePath,
    generatedReadModelPath,
    instructionPackGenerated: !blocked,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    sourceMode: 'frontend-contract-input-instruction-pack-preview',
    sourceRecordId,
    sourceRecordPath: sourceContractInput,
    target: buildTarget(input, allowedScope),
    userConfirmedIntent: buildUserConfirmedIntent(taskSummary, forbiddenScope),
    taskSummary,
    allowedScope,
    forbiddenScope,
    requiredEvidence,
    stopConditions,
    knownRisks,
    outputRequirements,
    executionInstructions: buildExecutionInstructions(allowedScope, forbiddenScope, requiredEvidence),
    nonGoals: buildNonGoals(forbiddenScope),
    verificationInstructions: buildVerificationInstructions(requiredEvidence, outputRequirements),
    graphContext: buildGraphContext(input),
    trace,
    validationFindings: [
      ...findings,
      ...inputFindings.map(toFinding).filter((finding) => finding.severity !== 'error'),
    ],
    humanReviewRequired: true,
    requiresClarification: blocked,
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    markdownReportPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportAuthorityStatus: 'not-written',
    executionBoundary: {
      mayModifyExternalProject: false,
      codexExecutionTriggered: false,
      requiresHumanReviewBeforeExecution: true,
      sourceOfTruth: 'frontend Contract Compiler Input generated from selected graph slice',
      approvalStatus: 'not-approved',
      runtimeEvidenceSatisfied: false,
      scopeEnforced: false,
    },
    nonExecutionBoundary:
      'This frontend Instruction Pack is generated from Contract Compiler Input only. It does not trigger Codex execution, does not mutate graph-source, does not apply graph deltas, does not approve work, does not record human decisions, does not satisfy runtime Evidence, does not prove equivalence, does not enforce scope, and does not configure CI required checks.',
  }
}

export function renderInstructionPackMarkdown(pack: InstructionPackResult): string {
  return [
    '# Frontend Instruction Pack',
    '',
    `Status: ${pack.status}`,
    '',
    '## Task Summary',
    '',
    pack.taskSummary,
    '',
    '## Allowed Scope',
    '',
    ...renderScopeRows(pack.allowedScope),
    '',
    '## Forbidden Scope',
    '',
    ...renderScopeRows(pack.forbiddenScope),
    '',
    '## Required Evidence',
    '',
    ...renderEvidenceRows(pack.requiredEvidence),
    '',
    '## Stop Conditions',
    '',
    ...renderStopConditionRows(pack.stopConditions),
    '',
    '## Output Requirements',
    '',
    ...renderOutputRequirementRows(pack.outputRequirements),
    '',
    '## Known Risks',
    '',
    ...renderRiskRows(pack.knownRisks),
    '',
    '## Non-goals',
    '',
    ...pack.nonGoals.map((entry) => `- ${entry}`),
    '',
    '## Boundary',
    '',
    '- This pack is not approval.',
    '- This pack does not trigger Codex execution.',
    '- This pack does not mutate graph-source.',
    '- This pack does not apply graph deltas.',
    '- This pack does not satisfy runtime Evidence.',
    '- This pack does not enforce scope or CI.',
    `- ${pack.nonExecutionBoundary}`,
    '',
  ].join('\n')
}

export async function generateInstructionPackFile(
  root: string,
  contractInputPath: string,
  options: { output?: string; markdown?: string } = {},
): Promise<InstructionPackFileResult> {
  const resolvedContractInputPath = resolveRepoPath(root, contractInputPath)
  const parsed = await readJsonSafe<Record<string, unknown>>(resolvedContractInputPath)
  if (!parsed.ok) {
    throw new Error(`Unable to read Contract Compiler Input from ${contractInputPath}: ${parsed.error}`)
  }

  const pack = generateInstructionPack(parsed.value, relativePath(root, resolvedContractInputPath))
  let outputPath: string | undefined
  let markdownReport: string | undefined

  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    pack.writtenOutputPath = outputPath
    pack.writtenOutputPathAuthorityStatus = 'explicit-preview-output-not-graph-source'
    await writeJsonAtomic(resolvedOutputPath, pack)
  }

  if (options.markdown) {
    const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
    markdownReport = relativePath(root, resolvedMarkdownPath)
    pack.markdownReportPath = markdownReport
    pack.markdownReportAuthorityStatus = 'explicit-preview-output-not-graph-source'
    await writeTextAtomic(resolvedMarkdownPath, renderInstructionPackMarkdown(pack))
    if (options.output && outputPath) {
      const resolvedOutputPath = resolveRepoPath(root, options.output)
      await writeJsonAtomic(resolvedOutputPath, pack)
    }
  }

  return { pack, ...(outputPath ? { outputPath } : {}), ...(markdownReport ? { markdownReport } : {}) }
}

function validateContractInputPrerequisites(input: JsonRecord | null, findings: InstructionPackFinding[]): void {
  if (!input) {
    findings.push({
      code: 'INSTRUCTION_PACK_CONTRACT_INPUT_NOT_OBJECT',
      severity: 'error',
      field: 'contractInput',
      message: 'Instruction pack generation requires a Contract Compiler Input JSON object.',
    })
    return
  }

  const expectedFields: Array<[string, unknown]> = [
    ['artifactRole', 'contract-compiler-input'],
    ['contractInputGenerated', true],
    ['instructionPackGenerated', false],
    ['graphSourceMutated', false],
    ['graphDeltaApplied', false],
    ['approvalStatus', 'not-approved'],
    ['equivalenceProven', false],
    ['runtimeEvidenceSatisfied', false],
    ['scopeEnforced', false],
    ['ciEnforcementEnabled', false],
  ]

  for (const [field, expected] of expectedFields) {
    if (input[field] !== expected) {
      findings.push({
        code: 'INSTRUCTION_PACK_CONTRACT_INPUT_PREREQUISITE_UNSAFE',
        severity: 'error',
        field,
        message: `Instruction pack generation prerequisite "${field}" is not satisfied.`,
        expected,
        actual: input[field],
        suggestedFix: 'Regenerate Contract Compiler Input before generating an Instruction Pack.',
      })
    }
  }

  for (const group of REQUIRED_GROUPS) {
    if (!(group in input)) {
      findings.push({
        code: 'INSTRUCTION_PACK_CONTRACT_INPUT_GROUP_MISSING',
        severity: 'error',
        field: group,
        message: `Contract Compiler Input is missing required group "${group}".`,
      })
      continue
    }
    const value = input[group]
    if (Array.isArray(value) && value.length === 0 && group !== 'knownRisks') {
      findings.push({
        code: 'INSTRUCTION_PACK_CONTRACT_INPUT_GROUP_EMPTY',
        severity: 'error',
        field: group,
        message: `Contract Compiler Input group "${group}" must not be empty for instruction pack generation.`,
      })
    }
  }
}

function buildTarget(input: JsonRecord | null, allowedScope: JsonRecord[]): JsonRecord {
  return {
    projectName: 'Todo App',
    sourceChangeId: stringValue(input?.changeId),
    slice: stringValue(asRecord(input?.humanRequest)?.text) || 'Selected graph slice instruction pack preview',
    writeBoundary: summarizeAllowedScope(allowedScope),
  }
}

function buildUserConfirmedIntent(taskSummary: string, forbiddenScope: JsonRecord[]): JsonRecord {
  return {
    summary: taskSummary,
    includedBehavior: [
      'Use only the allowed check/evidence/report-oriented scope from the Contract Compiler Input.',
      'Report required evidence status without claiming runtime Evidence satisfaction.',
    ],
    excludedBehavior: forbiddenScope.map((entry) => `Do not touch ${stringValue(entry.id) || 'forbidden scope'}.`),
    authorityStatus: 'contract-input-derived-review-context-not-approval',
  }
}

function buildExecutionInstructions(
  allowedScope: JsonRecord[],
  forbiddenScope: JsonRecord[],
  requiredEvidence: JsonRecord[],
): string[] {
  const instructions = [
    `Stay within allowed scope only: ${summarizeAllowedScope(allowedScope)}.`,
    'Do not treat targetScopeCandidates or graph context as editable scope unless they also appear in allowedScope.',
    'Do not mutate graph-source, approval, acceptance, or production source files.',
    'If required evidence cannot be produced or linked inside allowed scope, stop and report the missing evidence.',
    'Do not claim runtime Evidence satisfaction; report evidence as candidate/review context only.',
  ]
  if (
    forbiddenScope.some((entry) => stringArray(entry.paths).some((scopePath) => scopePath.startsWith('unresolved:')))
  ) {
    instructions.push(
      'Unresolved forbidden scope markers remain forbidden; do not convert them into allowed file paths.',
    )
  }
  if (requiredEvidence.some((entry) => stringValue(entry.artifact).startsWith('unresolved:'))) {
    instructions.push('Required evidence contains unresolved artifacts; stop before inventing an evidence output path.')
  }
  return instructions
}

function buildNonGoals(forbiddenScope: JsonRecord[]): string[] {
  return uniqueStrings([
    ...forbiddenScope.map((entry) => `Do not modify ${stringValue(entry.id) || 'forbidden scope'}.`),
    'Do not trigger Codex execution from this generator.',
    'Do not mutate graph-source.',
    'Do not apply graph deltas.',
    'Do not record approval, acceptance, or a human decision.',
    'Do not claim runtime Evidence satisfaction or equivalence proof.',
    'Do not enforce scope or CI.',
  ])
}

function buildVerificationInstructions(requiredEvidence: JsonRecord[], outputRequirements: JsonRecord[]): string[] {
  return [
    ...requiredEvidence.map((entry) => {
      const artifact = stringValue(entry.artifact) || 'unresolved evidence artifact'
      return `Review or produce candidate evidence for ${stringValue(entry.id)} at ${artifact}; keep runtimeEvidenceSatisfied=false until explicit review.`
    }),
    ...outputRequirements.map((entry) => stringValue(entry.requiredReportTarget)).filter(Boolean),
  ]
}

function buildGraphContext(input: JsonRecord | null): JsonRecord {
  const graphSnapshot = asRecord(input?.graphSnapshot)
  return {
    sourceGraphSnapshot: graphSnapshot,
    targetScopeCandidates: arrayRecords(input?.targetScopeCandidates),
    mappingTraceSource: 'contract-input-mappingTrace',
    contextAuthority: 'contract-input-derived-trace-context-not-edit-approval',
  }
}

function buildTrace(input: JsonRecord | null, sourceContractInput: string): JsonRecord[] {
  return [
    {
      traceType: 'source-contract-input',
      path: sourceContractInput,
    },
    {
      traceType: 'source-selected-graph-slice',
      path: stringValue(input?.sourceSelectedGraphSlice),
    },
    {
      traceType: 'source-traversal-plan',
      path: stringValue(input?.sourceTraversalPlan),
    },
    {
      traceType: 'source-graph-aware-validation',
      path: stringValue(input?.sourceGraphAwareValidation),
    },
    ...arrayRecords(input?.mappingTrace).slice(0, 25),
  ]
}

function toFinding(record: JsonRecord): InstructionPackFinding {
  return {
    code: stringValue(record.code) || 'CONTRACT_INPUT_FINDING',
    severity: isSeverity(record.severity) ? record.severity : 'warning',
    field: stringValue(record.field) || undefined,
    message: stringValue(record.message) || 'Contract Compiler Input finding carried into Instruction Pack.',
    actual: record.actual,
    expected: record.expected,
    suggestedFix: stringValue(record.suggestedFix) || undefined,
  }
}

function renderScopeRows(entries: JsonRecord[]): string[] {
  if (entries.length === 0) {
    return ['- none']
  }
  return entries.map((entry) => {
    const paths = stringArray(entry.paths)
    const suffix = paths.length > 0 ? `: ${paths.map((scopePath) => `\`${scopePath}\``).join(', ')}` : ''
    return `- ${stringValue(entry.id) || 'scope'}${suffix}`
  })
}

function renderEvidenceRows(entries: JsonRecord[]): string[] {
  if (entries.length === 0) {
    return ['- none']
  }
  return entries.map((entry) => {
    const artifact = stringValue(entry.artifact)
    return `- ${stringValue(entry.id) || 'evidence'}: ${artifact ? `\`${artifact}\`` : 'artifact unresolved'}`
  })
}

function renderStopConditionRows(entries: JsonRecord[]): string[] {
  if (entries.length === 0) {
    return ['- none']
  }
  return entries.map((entry) => `- ${stringValue(entry.id) || 'stop'}: ${stringValue(entry.condition)}`)
}

function renderOutputRequirementRows(entries: JsonRecord[]): string[] {
  if (entries.length === 0) {
    return ['- none']
  }
  return entries.map((entry) => `- ${stringValue(entry.id) || 'output'}: ${stringValue(entry.requiredReportTarget)}`)
}

function renderRiskRows(entries: JsonRecord[]): string[] {
  if (entries.length === 0) {
    return ['- none']
  }
  return entries.map((entry) => `- ${stringValue(entry.id) || 'risk'}: ${stringValue(entry.mitigation)}`)
}

function summarizeAllowedScope(allowedScope: JsonRecord[]): string {
  const paths = allowedScope.flatMap((entry) => stringArray(entry.paths))
  return paths.length > 0 ? paths.join(', ') : 'no concrete allowed paths'
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function isSeverity(value: unknown): value is IssueSeverity {
  return value === 'info' || value === 'warning' || value === 'error'
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((entry) => entry.length > 0))]
}

function resolveRepoPath(root: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(root, inputPath)
}
