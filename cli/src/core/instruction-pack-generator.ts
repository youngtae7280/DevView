import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import type { IssueSeverity } from './types.js'

const GENERATOR_NAME = 'InstructionPackGenerator'
const COMPATIBLE_INSTRUCTION_PACK_SCHEMA = 'schemas/devview/instruction-pack-v0.json'
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
const MAX_INSTRUCTION_CODE_SYMBOL_TARGETS = 50

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
  codeSymbolContext?: JsonRecord
  codeInspectionTargets?: JsonRecord[]
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
  const codeSymbolProjection = buildInstructionCodeSymbolProjection(input)

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
    executionInstructions: buildExecutionInstructions(
      allowedScope,
      forbiddenScope,
      requiredEvidence,
      codeSymbolProjection.codeInspectionTargets,
    ),
    nonGoals: buildNonGoals(forbiddenScope),
    verificationInstructions: buildVerificationInstructions(
      requiredEvidence,
      outputRequirements,
      codeSymbolProjection.codeInspectionTargets,
    ),
    graphContext: buildGraphContext(input, codeSymbolProjection),
    ...(codeSymbolProjection.codeSymbolContext
      ? {
          codeSymbolContext: codeSymbolProjection.codeSymbolContext,
          codeInspectionTargets: codeSymbolProjection.codeInspectionTargets,
        }
      : {}),
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
    ...(pack.codeInspectionTargets && pack.codeInspectionTargets.length > 0
      ? ['## Code Symbols', '', ...renderCodeSymbolRows(pack.codeInspectionTargets), '']
      : []),
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
  await assertPreviewOutputAuthority(root, resolvedContractInputPath, parsed.value, options)
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

async function assertPreviewOutputAuthority(
  root: string,
  resolvedContractInputPath: string,
  contractInput: JsonRecord,
  options: { output?: string; markdown?: string },
): Promise<void> {
  const requestedTargets = [
    ...(options.output
      ? [{ kind: 'output', requestedPath: options.output, resolvedPath: resolveRepoPath(root, options.output) }]
      : []),
    ...(options.markdown
      ? [{ kind: 'markdown', requestedPath: options.markdown, resolvedPath: resolveRepoPath(root, options.markdown) }]
      : []),
  ]
  if (requestedTargets.length === 0) {
    return
  }

  if (
    requestedTargets.length === 2 &&
    pathKey(requestedTargets[0].resolvedPath) === pathKey(requestedTargets[1].resolvedPath)
  ) {
    throw new Error(
      `Instruction Pack preview output is unsafe: --output and --markdown resolve to the same path (${requestedTargets[0].requestedPath}).`,
    )
  }

  const protectedPaths = buildProtectedOutputPathMap(root, resolvedContractInputPath, contractInput)
  for (const target of requestedTargets) {
    const protectedReason = protectedPaths.get(pathKey(target.resolvedPath))
    if (protectedReason) {
      throw new Error(
        `Instruction Pack preview ${target.kind} path is unsafe: ${target.requestedPath} would overwrite ${protectedReason}.`,
      )
    }

    const existingAuthority = await classifyExistingSourceAuthority(target.resolvedPath)
    if (existingAuthority) {
      throw new Error(
        `Instruction Pack preview ${target.kind} path is unsafe: ${target.requestedPath} already contains ${existingAuthority}. Choose a dedicated preview output path.`,
      )
    }
  }
}

function buildProtectedOutputPathMap(
  root: string,
  resolvedContractInputPath: string,
  contractInput: JsonRecord,
): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const add = (candidate: unknown, reason: string): void => {
    const candidatePath = stringValue(candidate)
    if (!isConcreteOutputProtectedPath(candidatePath)) {
      return
    }
    const key = pathKey(resolveRepoPath(root, candidatePath))
    if (!protectedPaths.has(key)) {
      protectedPaths.set(key, reason)
    }
  }

  protectedPaths.set(pathKey(resolvedContractInputPath), 'the source Contract Compiler Input')
  add(contractInput.graphSourcePath, 'graphSourcePath source authority')
  add(contractInput.generatedReadModelPath, 'generatedReadModelPath source authority')
  add(contractInput.sourceSelectedGraphSlice, 'sourceSelectedGraphSlice selected input')
  add(contractInput.sourceTraversalPlan, 'sourceTraversalPlan selected input')
  add(contractInput.sourceGraphAwareValidation, 'sourceGraphAwareValidation selected input')
  add(contractInput.sourceRequestIrCandidate, 'sourceRequestIrCandidate selected input')

  for (const entry of arrayRecords(contractInput.forbiddenScope)) {
    for (const scopePath of stringArray(entry.paths)) {
      add(scopePath, `forbiddenScope concrete path ${stringValue(entry.id) || scopePath}`)
    }
  }

  for (const artifact of arrayRecords(asRecord(contractInput.graphSnapshot)?.artifacts)) {
    add(artifact.path, `graphSnapshot artifact ${stringValue(artifact.id) || stringValue(artifact.path)}`)
  }

  for (const evidence of arrayRecords(contractInput.requiredEvidence)) {
    add(evidence.artifact, `requiredEvidence artifact ${stringValue(evidence.id) || stringValue(evidence.artifact)}`)
  }

  for (const evidence of arrayRecords(asRecord(contractInput.evidenceIndex)?.entries)) {
    add(evidence.artifact, `evidenceIndex artifact ${stringValue(evidence.id) || stringValue(evidence.artifact)}`)
  }

  for (const scope of arrayRecords(contractInput.allowedScope)) {
    for (const scopePath of stringArray(scope.paths)) {
      add(scopePath, `allowedScope path ${stringValue(scope.id) || scopePath}`)
    }
  }

  for (const candidate of arrayRecords(contractInput.targetScopeCandidates)) {
    for (const scopePath of stringArray(candidate.paths)) {
      add(scopePath, `targetScopeCandidate path ${stringValue(candidate.id) || scopePath}`)
    }
  }

  return protectedPaths
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
    artifactRole === 'contract-compiler-input' ||
    artifactRole === 'selected-graph-slice' ||
    artifactRole === 'graph-traversal-plan' ||
    artifactRole === 'request-ir-graph-aware-validation'
  ) {
    return `selected input artifactRole "${artifactRole}"`
  }
  if (asRecord(record.sourceRecords)) {
    return 'graph-source-shaped sourceRecords'
  }
  if (asRecord(record.taxonomy) && (Array.isArray(record.nodes) || Array.isArray(record.edges))) {
    return 'generated read-model source-authority projection'
  }
  return null
}

function isConcreteOutputProtectedPath(candidatePath: string): boolean {
  return Boolean(candidatePath) && !candidatePath.startsWith('unresolved:') && candidatePath !== '<in-memory>'
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

function buildInstructionCodeSymbolProjection(input: JsonRecord | null): {
  codeSymbolContext?: JsonRecord
  codeInspectionTargets: JsonRecord[]
} {
  const sourceContext = asRecord(input?.codeSymbolContext)
  const sourceTargets = arrayRecords(input?.codeInspectionTargets)
  if (!sourceContext && sourceTargets.length === 0) {
    return { codeInspectionTargets: [] }
  }

  const codeInspectionTargets = sourceTargets
    .slice(0, MAX_INSTRUCTION_CODE_SYMBOL_TARGETS)
    .map((target) => ({
      id: stringValue(target.id),
      nodeId: stringValue(target.nodeId),
      nodeKind: stringValue(target.nodeKind),
      label: stringValue(target.label),
      sourceFile: stringValue(target.sourceFile),
      ...(target.sourceLocation ? { sourceLocation: target.sourceLocation } : {}),
      ...(stringValue(target.sourceLocationStatus)
        ? { sourceLocationStatus: stringValue(target.sourceLocationStatus) }
        : {}),
      confidence: stringValue(target.confidence),
      inspectReason: stringValue(target.inspectReason),
      selectedAs: stringArray(target.selectedAs),
      linkReasons: arrayRecords(target.linkReasons).map((link) => ({
        linkId: stringValue(link.linkId),
        sourceNodeId: stringValue(link.sourceNodeId),
        sourceNodeKind: stringValue(link.sourceNodeKind),
        linkType: stringValue(link.linkType),
        confidence: stringValue(link.confidence),
        ...(stringValue(link.sourceFile) ? { sourceFile: stringValue(link.sourceFile) } : {}),
        ...(stringValue(link.sourceLocationStatus)
          ? { sourceLocationStatus: stringValue(link.sourceLocationStatus) }
          : {}),
      })),
      fullSourceIncluded: false,
      sourceStatus: stringValue(target.sourceStatus) || 'derived-from-contract-input-code-symbol-context',
    }))
    .sort((left, right) => left.nodeId.localeCompare(right.nodeId))

  return {
    codeInspectionTargets,
    codeSymbolContext: {
      artifactRole: 'devview-instruction-pack-code-symbol-context',
      status:
        codeInspectionTargets.length > 0
          ? 'devview-instruction-pack-code-symbol-context-carried'
          : 'devview-instruction-pack-code-symbol-context-empty',
      sourceContractInputCodeSymbolContextStatus: stringValue(sourceContext?.status),
      selectedCodeNodeCount: codeInspectionTargets.length,
      totalContractInputCodeNodeCount: sourceTargets.length,
      omittedCodeNodeCount:
        (numberValue(sourceContext?.omittedCodeNodeCount) ?? 0) +
        Math.max(0, sourceTargets.length - MAX_INSTRUCTION_CODE_SYMBOL_TARGETS),
      sourceCodeSubgraph: asRecord(sourceContext?.sourceCodeSubgraph),
      sourceCodeSymbolLinksValidation: asRecord(sourceContext?.sourceCodeSymbolLinksValidation),
      boundedContext: {
        maxCodeInspectionTargets: MAX_INSTRUCTION_CODE_SYMBOL_TARGETS,
        fullSourceFilesIncluded: false,
        sourceContentDumped: false,
      },
      unifiedGraphBoundary: {
        separateCodeGraphCreated: false,
        graphSourceMutated: false,
        graphDeltaApplied: false,
        codexExecutionTriggered: false,
        runtimeEvidenceSatisfied: false,
        equivalenceProven: false,
        scopeEnforced: false,
        ciEnforcementEnabled: false,
      },
    },
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
  codeInspectionTargets: JsonRecord[],
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
  if (codeInspectionTargets.length > 0) {
    instructions.push(
      `Inspect linked code symbols before broad source exploration: ${summarizeCodeInspectionTargets(codeInspectionTargets)}.`,
    )
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

function buildVerificationInstructions(
  requiredEvidence: JsonRecord[],
  outputRequirements: JsonRecord[],
  codeInspectionTargets: JsonRecord[],
): string[] {
  return [
    ...requiredEvidence.map((entry) => {
      const artifact = stringValue(entry.artifact) || 'unresolved evidence artifact'
      return `Review or produce candidate evidence for ${stringValue(entry.id)} at ${artifact}; keep runtimeEvidenceSatisfied=false until explicit review.`
    }),
    ...outputRequirements.map((entry) => stringValue(entry.requiredReportTarget)).filter(Boolean),
    ...codeInspectionTargets.map(
      (entry) =>
        `When explaining scope, cite why code symbol ${stringValue(entry.nodeId)} was selected: ${summarizeLinkReasons(arrayRecords(entry.linkReasons))}.`,
    ),
  ]
}

function buildGraphContext(
  input: JsonRecord | null,
  codeSymbolProjection: { codeSymbolContext?: JsonRecord; codeInspectionTargets: JsonRecord[] },
): JsonRecord {
  const graphSnapshot = asRecord(input?.graphSnapshot)
  return {
    sourceGraphSnapshot: graphSnapshot,
    targetScopeCandidates: arrayRecords(input?.targetScopeCandidates),
    ...(codeSymbolProjection.codeSymbolContext
      ? {
          codeSymbolContext: codeSymbolProjection.codeSymbolContext,
          codeInspectionTargets: codeSymbolProjection.codeInspectionTargets,
        }
      : {}),
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

function renderCodeSymbolRows(entries: JsonRecord[]): string[] {
  if (entries.length === 0) {
    return ['- none']
  }
  return entries.map((entry) => {
    const nodeId = stringValue(entry.nodeId)
    const nodeKind = stringValue(entry.nodeKind)
    const sourceFile = stringValue(entry.sourceFile)
    const linkSummary = summarizeLinkReasons(arrayRecords(entry.linkReasons))
    const source = sourceFile ? ` in \`${sourceFile}\`` : ''
    return `- ${nodeKind || 'code'} \`${nodeId || stringValue(entry.id)}\`${source}: ${linkSummary}`
  })
}

function summarizeAllowedScope(allowedScope: JsonRecord[]): string {
  const paths = allowedScope.flatMap((entry) => stringArray(entry.paths))
  return paths.length > 0 ? paths.join(', ') : 'no concrete allowed paths'
}

function summarizeCodeInspectionTargets(entries: JsonRecord[]): string {
  return entries
    .slice(0, 8)
    .map((entry) => {
      const nodeKind = stringValue(entry.nodeKind) || 'code'
      const nodeId = stringValue(entry.nodeId) || stringValue(entry.id)
      const sourceFile = stringValue(entry.sourceFile)
      return sourceFile ? `${nodeKind} ${nodeId} (${sourceFile})` : `${nodeKind} ${nodeId}`
    })
    .join('; ')
}

function summarizeLinkReasons(linkReasons: JsonRecord[]): string {
  if (linkReasons.length === 0) {
    return 'selected from View Tree code symbol context'
  }
  return linkReasons
    .slice(0, 5)
    .map((link) => {
      const sourceNodeId = stringValue(link.sourceNodeId)
      const linkType = stringValue(link.linkType)
      const confidence = stringValue(link.confidence)
      return `${sourceNodeId || 'maintenance-node'} ${linkType || 'linked'} (${confidence || 'confidence-unset'})`
    })
    .join('; ')
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

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
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

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}
