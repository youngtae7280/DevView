import path from 'node:path'
import { readJsonSafe, readTextSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import type { IssueSeverity } from './types.js'

const REPORTER_NAME = 'FrontendChainReporter'
const REPORT_SCOPE = 'natural-language-intake-to-instruction-pack-chain-report-no-execution'
const EXPECTED_INTAKE_ROLE = 'natural-language-request-intake-boundary-preview'
const EXPECTED_INTAKE_STATUS = 'natural-language-request-intake-boundary-previewed'

type JsonRecord = Record<string, unknown>

interface StageDefinition {
  stage: string
  label: string
  pathFields: string[]
  fallbackFileName?: string
  artifactKind: 'json' | 'markdown'
  expectedRole?: string
  expectedStatuses?: string[]
  required: boolean
  authorityBoundary: string
}

export interface FrontendChainFinding {
  code: string
  severity: IssueSeverity
  stage?: string
  field?: string
  path?: string
  message: string
  expected?: unknown
  actual?: unknown
  suggestedFix?: string
}

export interface FrontendChainStageSummary {
  stage: string
  label: string
  path: string
  artifactKind: 'json' | 'markdown'
  artifactRole: string
  status: string
  readStatus: 'read' | 'missing' | 'malformed'
  required: boolean
  generatedOrImplementedStatus: string
  authorityBoundary: string
  validationFindings: FrontendChainFinding[]
}

export interface FrontendChainReport {
  schemaVersion: 1
  artifactRole: 'devview-frontend-chain-report'
  status: 'devview-frontend-chain-report-generated' | 'devview-frontend-chain-report-blocked'
  reporterName: typeof REPORTER_NAME
  reportScope: typeof REPORT_SCOPE
  sourceIntakeBoundary: string
  chainReportGenerated: boolean
  terminalStage: 'instruction-pack-preview-generated-no-codex-execution' | 'blocked-before-instruction-pack-preview'
  currentTerminalArtifact: string
  nextRecommendedStep: string
  artifactChainOrder: string[]
  artifactChain: FrontendChainStageSummary[]
  stageCounts: JsonRecord
  blockingFindings: FrontendChainFinding[]
  validationFindings: FrontendChainFinding[]
  llmInvoked: false
  requestIrCandidateGeneratedByReport: false
  hookSessionRuntimeImplemented: false
  codexExecutionTriggered: false
  graphSourceMutated: false
  graphDeltaApplied: false
  approvalStatus: 'not-approved'
  humanDecisionRecorded: false
  runtimeEvidenceSatisfied: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  nonEnforcing: true
  runtimeBudgetEnforced: false
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  markdownReportPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-preview-output-not-source-authority'
  markdownReportAuthorityStatus: 'not-written' | 'explicit-preview-output-not-source-authority'
  nonExecutionBoundary: string
}

export interface FrontendChainReportFileResult {
  report: FrontendChainReport
  outputPath?: string
  markdownReport?: string
}

interface LoadedStage {
  definition: StageDefinition
  resolvedPath: string
  displayPath: string
  artifactRole: string
  status: string
  readStatus: 'read' | 'missing' | 'malformed'
  record?: JsonRecord
  findings: FrontendChainFinding[]
}

const STAGE_DEFINITIONS: StageDefinition[] = [
  {
    stage: 'natural-language-intake-boundary',
    label: 'Natural Language Intake Boundary',
    pathFields: [],
    artifactKind: 'json',
    expectedRole: EXPECTED_INTAKE_ROLE,
    expectedStatuses: [EXPECTED_INTAKE_STATUS],
    required: true,
    authorityBoundary: 'Boundary preview only; natural-language intake semantics, not analyzer output authority.',
  },
  {
    stage: 'ai-request-analyzer-boundary',
    label: 'AI Request Analyzer Boundary',
    pathFields: ['aiRequestAnalyzerBoundaryArtifact'],
    fallbackFileName: 'ai-request-analyzer-boundary.add-todo-runtime-evidence-only.preview.json',
    artifactKind: 'json',
    expectedRole: 'ai-request-analyzer-boundary',
    expectedStatuses: ['ai-request-analyzer-boundary-previewed'],
    required: true,
    authorityBoundary: 'Boundary preview only; analyzer not implemented and no LLM call is made.',
  },
  {
    stage: 'ai-request-analyzer-pack',
    label: 'AI Request Analyzer Prompt Pack',
    pathFields: ['aiRequestAnalyzerPackArtifact', 'firstCalibrationAiRequestAnalyzerPackArtifact'],
    fallbackFileName: 'ai-request-analyzer-pack.add-todo-runtime-evidence-only.preview.json',
    artifactKind: 'json',
    expectedRole: 'ai-request-analyzer-pack',
    expectedStatuses: ['ai-request-analyzer-pack-generated'],
    required: true,
    authorityBoundary: 'Prompt/input contract preview only; does not generate Request IR or call an LLM.',
  },
  {
    stage: 'request-ir-candidate-schema',
    label: 'Request IR Candidate Schema',
    pathFields: ['requestIrCandidateSchemaArtifact'],
    fallbackFileName: 'request-ir-candidate-schema.runtime-evidence-only.preview.json',
    artifactKind: 'json',
    expectedRole: 'request-ir-candidate-schema-preview',
    expectedStatuses: ['request-ir-candidate-schema-previewed'],
    required: true,
    authorityBoundary: 'Schema preview only; AI-produced values remain candidate-only.',
  },
  {
    stage: 'request-ir-candidate',
    label: 'Calibration Request IR Candidate',
    pathFields: ['firstCalibrationRequestIrCandidateArtifact'],
    fallbackFileName: 'request-ir-candidate.add-todo-runtime-evidence-only.preview.json',
    artifactKind: 'json',
    expectedRole: 'request-ir-candidate-calibration-fixture-preview',
    expectedStatuses: ['request-ir-candidate-calibration-fixture-previewed'],
    required: true,
    authorityBoundary: 'Candidate fixture only; not validated Request IR and not traversal authority.',
  },
  {
    stage: 'schema-only-request-ir-validation',
    label: 'Schema-only Request IR Validation',
    pathFields: ['requestIrSchemaOnlyValidationResultArtifact', 'firstCalibrationRequestIrValidationArtifact'],
    fallbackFileName: 'request-ir-validation.add-todo-runtime-evidence-only.preview.json',
    artifactKind: 'json',
    expectedRole: 'request-ir-candidate-schema-only-validation',
    expectedStatuses: ['request-ir-candidate-schema-only-validation-complete'],
    required: true,
    authorityBoundary: 'Schema and boundary validation only; graph traversal remains disallowed by this pass alone.',
  },
  {
    stage: 'graph-aware-request-ir-validation',
    label: 'Graph-aware Request IR Validation',
    pathFields: ['requestIrGraphAwareValidationResultArtifact', 'firstCalibrationGraphAwareValidationArtifact'],
    fallbackFileName: 'request-ir-graph-validation.add-todo-runtime-evidence-only.preview.json',
    artifactKind: 'json',
    expectedRole: 'request-ir-graph-aware-validation',
    expectedStatuses: ['request-ir-graph-aware-validation-complete'],
    required: true,
    authorityBoundary: 'Graph-aware validation may permit traversal planning but does not execute traversal.',
  },
  {
    stage: 'graph-traversal-plan',
    label: 'Graph Traversal Plan',
    pathFields: ['firstCalibrationGraphTraversalPlanArtifact', 'graphTraversalPlanArtifact'],
    fallbackFileName: 'graph-traversal-plan.add-todo-runtime-evidence-only.preview.json',
    artifactKind: 'json',
    expectedRole: 'graph-traversal-plan',
    expectedStatuses: ['graph-traversal-plan-generated'],
    required: true,
    authorityBoundary: 'Deterministic plan only; no selected graph slice is generated by the plan artifact itself.',
  },
  {
    stage: 'selected-graph-slice',
    label: 'Selected Graph Slice',
    pathFields: ['firstCalibrationSelectedGraphSliceArtifact', 'selectedGraphSliceArtifact'],
    fallbackFileName: 'selected-graph-slice.add-todo-runtime-evidence-only.preview.json',
    artifactKind: 'json',
    expectedRole: 'selected-graph-slice',
    expectedStatuses: ['selected-graph-slice-generated'],
    required: true,
    authorityBoundary: 'Deterministic selected slice; not Contract Compiler Input and not an instruction pack.',
  },
  {
    stage: 'contract-compiler-input',
    label: 'Contract Compiler Input',
    pathFields: ['firstCalibrationContractCompilerInputArtifact', 'contractCompilerInputArtifact'],
    fallbackFileName: 'contract-compiler-input.add-todo-runtime-evidence-only.preview.json',
    artifactKind: 'json',
    expectedRole: 'contract-compiler-input',
    expectedStatuses: ['contract-compiler-input-generated'],
    required: true,
    authorityBoundary: 'Frontend compiler input; traceable to selected slice but not execution authority.',
  },
  {
    stage: 'instruction-pack',
    label: 'Instruction Pack JSON',
    pathFields: ['firstCalibrationInstructionPackArtifact', 'instructionPackArtifact'],
    fallbackFileName: 'instruction-pack.add-todo-runtime-evidence-only.preview.json',
    artifactKind: 'json',
    expectedRole: 'instruction-pack',
    expectedStatuses: ['instruction-pack-generated'],
    required: true,
    authorityBoundary: 'Operational preview for human/Codex review; does not trigger Codex execution or approval.',
  },
  {
    stage: 'instruction-pack-markdown',
    label: 'Instruction Pack Markdown',
    pathFields: ['firstCalibrationInstructionPackMarkdownArtifact', 'instructionPackMarkdownArtifact'],
    fallbackFileName: 'instruction-pack.add-todo-runtime-evidence-only.preview.md',
    artifactKind: 'markdown',
    required: true,
    authorityBoundary: 'Human-readable instruction pack preview; not approval, execution, or Evidence satisfaction.',
  },
]

export async function reportFrontendChainFile(
  root: string,
  intakePath: string,
  options: { output?: string; markdown?: string } = {},
): Promise<FrontendChainReportFileResult> {
  const resolvedIntakePath = resolveRepoPath(root, intakePath)
  const intake = await readJsonSafe<JsonRecord>(resolvedIntakePath)
  if (!intake.ok) {
    throw new Error(`Unable to read natural-language intake boundary from ${intakePath}: ${intake.error}`)
  }

  const stages = await loadStages(root, resolvedIntakePath, intake.value)
  await assertFrontendChainOutputAuthority(root, resolvedIntakePath, intake.value, stages, options)

  const report = buildFrontendChainReport(stages, relativePath(root, resolvedIntakePath))
  let outputPath: string | undefined
  let markdownReport: string | undefined

  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    report.writtenOutputPath = outputPath
    report.writtenOutputPathAuthorityStatus = 'explicit-preview-output-not-source-authority'
    await writeJsonAtomic(resolvedOutputPath, report)
  }

  if (options.markdown) {
    const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
    markdownReport = relativePath(root, resolvedMarkdownPath)
    report.markdownReportPath = markdownReport
    report.markdownReportAuthorityStatus = 'explicit-preview-output-not-source-authority'
    await writeTextAtomic(resolvedMarkdownPath, renderFrontendChainReportMarkdown(report))
    if (options.output && outputPath) {
      await writeJsonAtomic(resolveRepoPath(root, options.output), report)
    }
  }

  return { report, ...(outputPath ? { outputPath } : {}), ...(markdownReport ? { markdownReport } : {}) }
}

function buildFrontendChainReport(stages: LoadedStage[], sourceIntakeBoundary: string): FrontendChainReport {
  const stageSummaries = stages.map(toStageSummary)
  const findings = stageSummaries.flatMap((stage) => stage.validationFindings)
  const blockingFindings = findings.filter((finding) => finding.severity === 'error')
  const blocked = blockingFindings.length > 0
  const instructionPack = stageSummaries.find((stage) => stage.stage === 'instruction-pack')
  const terminalReady =
    !blocked && instructionPack?.readStatus === 'read' && instructionPack.status === 'instruction-pack-generated'
  const lastReadable = [...stageSummaries].reverse().find((stage) => stage.readStatus === 'read')

  return {
    schemaVersion: 1,
    artifactRole: 'devview-frontend-chain-report',
    status: blocked ? 'devview-frontend-chain-report-blocked' : 'devview-frontend-chain-report-generated',
    reporterName: REPORTER_NAME,
    reportScope: REPORT_SCOPE,
    sourceIntakeBoundary,
    chainReportGenerated: !blocked,
    terminalStage: terminalReady
      ? 'instruction-pack-preview-generated-no-codex-execution'
      : 'blocked-before-instruction-pack-preview',
    currentTerminalArtifact: terminalReady ? stringValue(instructionPack?.path) : stringValue(lastReadable?.path),
    nextRecommendedStep: terminalReady
      ? 'Review the instruction pack as preview input only. Codex execution, approval, runtime Evidence satisfaction, graph apply, and enforcement remain future explicit work.'
      : 'Repair missing or mismatched chain artifacts before treating this frontend chain as instruction-pack-ready.',
    artifactChainOrder: stageSummaries.map((stage) => stage.stage),
    artifactChain: stageSummaries,
    stageCounts: {
      total: stageSummaries.length,
      read: stageSummaries.filter((stage) => stage.readStatus === 'read').length,
      missing: stageSummaries.filter((stage) => stage.readStatus === 'missing').length,
      malformed: stageSummaries.filter((stage) => stage.readStatus === 'malformed').length,
      errors: blockingFindings.length,
      warnings: findings.filter((finding) => finding.severity === 'warning').length,
    },
    blockingFindings,
    validationFindings: findings,
    llmInvoked: false,
    requestIrCandidateGeneratedByReport: false,
    hookSessionRuntimeImplemented: false,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    nonEnforcing: true,
    runtimeBudgetEnforced: false,
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    markdownReportPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportAuthorityStatus: 'not-written',
    nonExecutionBoundary:
      'This frontend chain report reads existing calibration artifacts only. It does not call an LLM, generate Request IR Candidates, implement hook sessions, trigger Codex execution, mutate graph-source, apply graph deltas, approve work, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
  }
}

export function renderFrontendChainReportMarkdown(report: FrontendChainReport): string {
  const chainRows = report.artifactChain.map((stage) => [
    stage.label,
    stage.path,
    stage.status || stage.readStatus,
    stage.authorityBoundary,
  ])
  return [
    '# DevView Frontend Artifact Chain',
    '',
    `Status: ${report.status}`,
    `Terminal stage: ${report.terminalStage}`,
    '',
    ...renderMarkdownTable(['Stage', 'Artifact', 'Status', 'Authority'], chainRows),
    '',
    '## Blocking Findings',
    '',
    ...renderFindings(report.blockingFindings),
    '',
    '## Boundary',
    '',
    '- No LLM/API/network call is made by this report.',
    '- No Request IR Candidate is generated by this report.',
    '- No hook session runtime or Codex execution is triggered.',
    '- No graph-source mutation, graph delta apply, approval, human decision, runtime Evidence satisfaction, equivalence proof, scope enforcement, or CI enforcement is introduced.',
    `- ${report.nonExecutionBoundary}`,
    '',
  ].join('\n')
}

async function loadStages(root: string, resolvedIntakePath: string, intake: JsonRecord): Promise<LoadedStage[]> {
  const generatedDir = path.dirname(resolvedIntakePath)
  const stages: LoadedStage[] = []
  for (const definition of STAGE_DEFINITIONS) {
    const resolvedPath =
      definition.stage === 'natural-language-intake-boundary'
        ? resolvedIntakePath
        : resolveLinkedArtifactPath(root, generatedDir, intake, definition)
    stages.push(
      await loadStage(
        root,
        definition,
        resolvedPath,
        definition.stage === 'natural-language-intake-boundary' ? intake : undefined,
      ),
    )
  }
  return stages
}

async function loadStage(
  root: string,
  definition: StageDefinition,
  resolvedPath: string,
  alreadyLoaded?: JsonRecord,
): Promise<LoadedStage> {
  const findings: FrontendChainFinding[] = []
  const displayPath = relativePath(root, resolvedPath)

  if (definition.artifactKind === 'markdown') {
    const text = await readTextSafe(resolvedPath)
    if (!text.ok) {
      findings.push({
        code: 'FRONTEND_CHAIN_MARKDOWN_MISSING',
        severity: definition.required ? 'error' : 'warning',
        stage: definition.stage,
        path: displayPath,
        message: `Frontend chain artifact "${definition.stage}" could not be read: ${text.error}`,
      })
      return {
        definition,
        resolvedPath,
        displayPath,
        artifactRole: 'markdown',
        status: 'missing',
        readStatus: 'missing',
        findings,
      }
    }
    return {
      definition,
      resolvedPath,
      displayPath,
      artifactRole: 'markdown',
      status: 'markdown-present',
      readStatus: 'read',
      findings,
    }
  }

  const parsed = alreadyLoaded
    ? { ok: true as const, value: alreadyLoaded }
    : await readJsonSafe<JsonRecord>(resolvedPath)
  if (!parsed.ok) {
    findings.push({
      code: 'FRONTEND_CHAIN_ARTIFACT_UNREADABLE',
      severity: definition.required ? 'error' : 'warning',
      stage: definition.stage,
      path: displayPath,
      message: `Frontend chain artifact "${definition.stage}" could not be read or parsed: ${parsed.error}`,
    })
    return {
      definition,
      resolvedPath,
      displayPath,
      artifactRole: '',
      status: 'missing',
      readStatus: parsed.error.includes('JSON') ? 'malformed' : 'missing',
      findings,
    }
  }

  const artifactRole = stringValue(parsed.value.artifactRole)
  const status = stringValue(parsed.value.status)
  if (definition.expectedRole && artifactRole !== definition.expectedRole) {
    findings.push({
      code: 'FRONTEND_CHAIN_ARTIFACT_ROLE_MISMATCH',
      severity: 'error',
      stage: definition.stage,
      field: 'artifactRole',
      path: displayPath,
      message: `Frontend chain artifact "${definition.stage}" has an unexpected artifactRole.`,
      expected: definition.expectedRole,
      actual: artifactRole,
    })
  }
  if (
    definition.expectedStatuses &&
    definition.expectedStatuses.length > 0 &&
    !definition.expectedStatuses.includes(status)
  ) {
    findings.push({
      code: 'FRONTEND_CHAIN_ARTIFACT_STATUS_MISMATCH',
      severity: 'error',
      stage: definition.stage,
      field: 'status',
      path: displayPath,
      message: `Frontend chain artifact "${definition.stage}" has an unexpected status.`,
      expected: definition.expectedStatuses,
      actual: status,
    })
  }

  return {
    definition,
    resolvedPath,
    displayPath,
    artifactRole,
    status,
    readStatus: 'read',
    record: parsed.value,
    findings,
  }
}

function resolveLinkedArtifactPath(
  root: string,
  generatedDir: string,
  intake: JsonRecord,
  definition: StageDefinition,
): string {
  for (const field of definition.pathFields) {
    const candidate = stringValue(intake[field])
    if (candidate) {
      return resolveRepoPath(root, candidate)
    }
  }
  if (!definition.fallbackFileName) {
    return generatedDir
  }
  return path.join(generatedDir, definition.fallbackFileName)
}

function toStageSummary(stage: LoadedStage): FrontendChainStageSummary {
  return {
    stage: stage.definition.stage,
    label: stage.definition.label,
    path: stage.displayPath,
    artifactKind: stage.definition.artifactKind,
    artifactRole: stage.artifactRole,
    status: stage.status,
    readStatus: stage.readStatus,
    required: stage.definition.required,
    generatedOrImplementedStatus: summarizeGeneratedStatus(stage.record),
    authorityBoundary: stage.definition.authorityBoundary,
    validationFindings: stage.findings,
  }
}

function summarizeGeneratedStatus(record: JsonRecord | undefined): string {
  if (!record) {
    return 'not-readable'
  }
  const candidateFields = [
    'analyzerImplemented',
    'analyzerPackGenerated',
    'requestIrCandidateGenerated',
    'requestIrValidatorImplemented',
    'graphAwareRequestIrValidatorImplemented',
    'graphTraversalPlanGenerated',
    'selectedGraphSliceGenerated',
    'contractInputGenerated',
    'instructionPackGenerated',
    'codexExecutionTriggered',
  ]
  const parts = candidateFields
    .filter((field) => field in record)
    .map((field) => `${field}=${JSON.stringify(record[field])}`)
  return parts.length > 0 ? parts.join('; ') : stringValue(record.status) || 'present'
}

async function assertFrontendChainOutputAuthority(
  root: string,
  resolvedIntakePath: string,
  intake: JsonRecord,
  stages: LoadedStage[],
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
      `Frontend chain report output is unsafe: --output and --markdown resolve to the same path (${requestedTargets[0].requestedPath}).`,
    )
  }

  const protectedPaths = buildProtectedOutputPathMap(root, resolvedIntakePath, intake, stages)
  for (const target of requestedTargets) {
    const protectedReason = protectedPaths.get(pathKey(target.resolvedPath))
    if (protectedReason) {
      throw new Error(
        `Frontend chain report ${target.kind} path is unsafe: ${target.requestedPath} would overwrite ${protectedReason}.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(target.resolvedPath)
    if (existingAuthority) {
      throw new Error(
        `Frontend chain report ${target.kind} path is unsafe: ${target.requestedPath} already contains ${existingAuthority}. Choose a dedicated manifest/report output path.`,
      )
    }
  }
}

function buildProtectedOutputPathMap(
  root: string,
  resolvedIntakePath: string,
  intake: JsonRecord,
  stages: LoadedStage[],
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

  protectedPaths.set(pathKey(resolvedIntakePath), 'the source natural-language intake boundary')
  for (const stage of stages) {
    const stageKey = pathKey(stage.resolvedPath)
    if (!protectedPaths.has(stageKey)) {
      protectedPaths.set(stageKey, `frontend chain artifact ${stage.displayPath}`)
    }
    if (stage.record) {
      for (const candidatePath of collectConcretePathStrings(stage.record)) {
        add(candidatePath, `linked frontend chain artifact ${candidatePath}`)
      }
    }
  }
  for (const candidatePath of collectConcretePathStrings(intake)) {
    add(candidatePath, `linked intake boundary artifact ${candidatePath}`)
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
    [
      EXPECTED_INTAKE_ROLE,
      'ai-request-analyzer-boundary',
      'ai-request-analyzer-pack',
      'request-ir-candidate-schema-preview',
      'request-ir-candidate-calibration-fixture-preview',
      'request-ir-candidate-schema-only-validation',
      'request-ir-graph-aware-validation',
      'graph-traversal-plan',
      'selected-graph-slice',
      'contract-compiler-input',
      'instruction-pack',
    ].includes(artifactRole)
  ) {
    return `selected frontend artifactRole "${artifactRole}"`
  }
  if (asRecord(record.sourceRecords)) {
    return 'graph-source-shaped sourceRecords'
  }
  if (asRecord(record.taxonomy) && (Array.isArray(record.nodes) || Array.isArray(record.edges))) {
    return 'generated read-model source-authority projection'
  }
  return null
}

function renderFindings(findings: FrontendChainFinding[]): string[] {
  if (findings.length === 0) {
    return ['- none']
  }
  return findings.map((finding) => {
    const location = [finding.stage, finding.path].filter(Boolean).join(' ')
    return `- [${finding.severity}] ${finding.code}${location ? ` (${location})` : ''}: ${finding.message}`
  })
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

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
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

function escapeMarkdownCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ')
}

function renderMarkdownTable(headers: string[], rows: string[][]): string[] {
  const escapedRows = rows.map((row) => row.map(escapeMarkdownCell))
  const escapedHeaders = headers.map(escapeMarkdownCell)
  const widths = escapedHeaders.map((header, index) =>
    Math.max(header.length, ...escapedRows.map((row) => row[index]?.length ?? 0)),
  )
  const renderRow = (row: string[]): string => `| ${row.map((cell, index) => cell.padEnd(widths[index])).join(' | ')} |`
  const separator = `| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`
  return [renderRow(escapedHeaders), separator, ...escapedRows.map(renderRow)]
}
