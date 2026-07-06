import path from 'node:path'
import { readJsonSafe, readTextSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import type { IssueSeverity } from './types.js'

const REPORTER_NAME = 'UserPromptSubmitAdvisoryReporter'
const REPORT_ROLE = 'devview-user-prompt-submit-advisory-report'

type JsonRecord = Record<string, unknown>

export type DevViewUserPromptMode = 'off' | 'advisory' | 'guided' | 'strict-disabled'
type AdvisoryContextStatus =
  | 'noop-devview-off'
  | 'ready-from-preflight'
  | 'missing-preflight'
  | 'blocked-preflight'
  | 'preflight-artifact-missing'

export interface UserPromptSubmitAdvisoryOptions {
  prompt?: string
  promptFile?: string
  hookHealth: string
  devviewMode?: string
  preflightSession?: string
  candidate?: string
  analyzerRun?: string
  analyzerPack?: string
  providerConfig?: string
  output: string
  markdown?: string
}

export interface UserPromptSubmitAdvisoryFinding {
  code: string
  severity: IssueSeverity
  field?: string
  message: string
  expected?: unknown
  actual?: unknown
  suggestedFix?: string
}

export interface UserPromptSubmitAdvisoryReport {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status:
    | 'user-prompt-submit-advisory-generated'
    | 'user-prompt-submit-advisory-noop-devview-off'
    | 'user-prompt-submit-advisory-missing-preflight'
    | 'user-prompt-submit-advisory-blocked-preflight'
    | 'user-prompt-submit-advisory-preflight-artifact-missing'
  reporterName: typeof REPORTER_NAME
  eventName: 'UserPromptSubmit'
  sourcePromptKind: 'inline-prompt' | 'prompt-file'
  sourcePromptFile: string | null
  promptPreview: string
  promptLength: number
  sourceHookGatewayHealth: string
  sourcePreflightSessionChain: string | null
  sourceRequestIrCandidate: string | null
  sourceAnalyzerRun: string | null
  sourceAnalyzerPack: string | null
  sourceProviderConfig: string | null
  devviewMode: DevViewUserPromptMode
  guidedModeRequested: boolean
  advisoryContextStatus: AdvisoryContextStatus
  additionalContextInjectionReady: boolean
  additionalContextMarkdownPath: string | null
  nextRequiredCommand: string | null
  preflightTerminalStage: string | null
  preflightFindingsSummary: {
    errors: number
    warnings: number
    infos: number
  }
  instructionPackSummary: {
    sourceInstructionPack: string | null
    sourceInstructionMarkdown: string | null
    taskSummary: string
    allowedScopeCount: number
    forbiddenScopeCount: number
    requiredEvidenceCount: number
    outputRequirementCount: number
    stopConditionCount: number
    knownRiskCount: number
  }
  validationChain: string[]
  allowedScope: JsonRecord[]
  forbiddenScope: JsonRecord[]
  requiredEvidence: JsonRecord[]
  outputRequirements: JsonRecord[]
  stopConditions: JsonRecord[]
  knownRisks: JsonRecord[]
  validationFindings: UserPromptSubmitAdvisoryFinding[]
  hookScriptsInstalled: false
  hookGatewayActive: 'not-checked-preview-only'
  codexExecutionTriggered: false
  toolBlockingEnabled: false
  preToolUseBlockingEnabled: false
  postToolUseBlockingEnabled: false
  strictModeEnabled: false
  guidedEnforcementEnabled: false
  approvalStatus: 'not-approved'
  humanDecisionRecorded: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  nonEnforcing: true
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string
  markdownReportPath: string | null
  writtenOutputPathAuthorityStatus: 'explicit-preview-output-not-source-authority'
  markdownReportAuthorityStatus: 'not-written' | 'explicit-preview-output-not-source-authority'
  nonExecutionBoundary: string
}

export interface UserPromptSubmitAdvisoryFileResult {
  report: UserPromptSubmitAdvisoryReport
  outputPath: string
  markdownReport?: string
}

interface LoadedInputs {
  prompt: string
  sourcePromptKind: 'inline-prompt' | 'prompt-file'
  sourcePromptFile: string | null
  resolvedPromptFilePath: string | null
  hookHealth: JsonRecord
  sourceHookGatewayHealth: string
  resolvedHookHealthPath: string
  devviewMode: DevViewUserPromptMode
  preflight: JsonRecord | null
  sourcePreflightSessionChain: string | null
  resolvedPreflightSessionPath: string | null
  instructionPack: JsonRecord | null
  instructionMarkdown: string | null
  sourceInstructionPack: string | null
  sourceInstructionMarkdown: string | null
  resolvedInstructionPackPath: string | null
  resolvedInstructionMarkdownPath: string | null
  optionalSources: Array<{
    label: string
    optionPath: string
    sourcePath: string
    resolvedPath: string
    artifact: JsonRecord | null
  }>
}

export async function reportUserPromptSubmitAdvisoryFile(
  root: string,
  options: UserPromptSubmitAdvisoryOptions,
): Promise<UserPromptSubmitAdvisoryFileResult> {
  validateRequiredOptions(options)
  const inputs = await loadInputs(root, options)
  await assertOutputAuthority(root, inputs, options)
  const report = buildReport(root, inputs, options)

  const resolvedOutputPath = resolveRepoPath(root, options.output)
  const outputPath = relativePath(root, resolvedOutputPath)
  report.writtenOutputPath = outputPath
  report.writtenOutputPathAuthorityStatus = 'explicit-preview-output-not-source-authority'
  await writeJsonAtomic(resolvedOutputPath, report)

  let markdownReport: string | undefined
  if (options.markdown) {
    const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
    markdownReport = relativePath(root, resolvedMarkdownPath)
    report.markdownReportPath = markdownReport
    report.additionalContextMarkdownPath = markdownReport
    report.markdownReportAuthorityStatus = 'explicit-preview-output-not-source-authority'
    await writeTextAtomic(resolvedMarkdownPath, renderUserPromptSubmitAdvisoryMarkdown(report))
    await writeJsonAtomic(resolvedOutputPath, report)
  }

  return { report, outputPath, ...(markdownReport ? { markdownReport } : {}) }
}

function validateRequiredOptions(options: UserPromptSubmitAdvisoryOptions): void {
  if ((options.prompt && options.promptFile) || (!options.prompt && !options.promptFile)) {
    throw new Error(
      'report-user-prompt-submit-advisory requires exactly one of --prompt <text> or --prompt-file <path>.',
    )
  }
  if (!options.hookHealth) {
    throw new Error('report-user-prompt-submit-advisory requires --hook-health <file>.')
  }
  if (!options.output) {
    throw new Error('report-user-prompt-submit-advisory requires --output <file>.')
  }
  parseDevViewMode(options.devviewMode)
}

async function loadInputs(root: string, options: UserPromptSubmitAdvisoryOptions): Promise<LoadedInputs> {
  let prompt = options.prompt ?? ''
  let sourcePromptKind: LoadedInputs['sourcePromptKind'] = 'inline-prompt'
  let sourcePromptFile: string | null = null
  let resolvedPromptFilePath: string | null = null
  if (options.promptFile) {
    resolvedPromptFilePath = resolveRepoPath(root, options.promptFile)
    const promptText = await readTextSafe(resolvedPromptFilePath)
    if (!promptText.ok) {
      throw new Error(`Unable to read prompt file from ${options.promptFile}: ${promptText.error}`)
    }
    prompt = promptText.value
    sourcePromptKind = 'prompt-file'
    sourcePromptFile = relativePath(root, resolvedPromptFilePath)
  }
  if (!prompt.trim()) {
    throw new Error('UserPromptSubmit prompt text must be non-empty.')
  }

  const resolvedHookHealthPath = resolveRepoPath(root, options.hookHealth)
  const hookHealth = await readJsonSafe<JsonRecord>(resolvedHookHealthPath)
  if (!hookHealth.ok) {
    throw new Error(`Unable to read Hook Gateway health artifact from ${options.hookHealth}: ${hookHealth.error}`)
  }

  let preflight: JsonRecord | null = null
  let sourcePreflightSessionChain: string | null = null
  let resolvedPreflightSessionPath: string | null = null
  let instructionPack: JsonRecord | null = null
  let instructionMarkdown: string | null = null
  let sourceInstructionPack: string | null = null
  let sourceInstructionMarkdown: string | null = null
  let resolvedInstructionPackPath: string | null = null
  let resolvedInstructionMarkdownPath: string | null = null
  if (options.preflightSession) {
    resolvedPreflightSessionPath = resolveRepoPath(root, options.preflightSession)
    const parsedPreflight = await readJsonSafe<JsonRecord>(resolvedPreflightSessionPath)
    if (!parsedPreflight.ok) {
      throw new Error(
        `Unable to read preflight session chain report from ${options.preflightSession}: ${parsedPreflight.error}`,
      )
    }
    preflight = parsedPreflight.value
    sourcePreflightSessionChain = relativePath(root, resolvedPreflightSessionPath)
    const resolvedInstruction = await readInstructionPackFromPreflight(root, preflight, resolvedPreflightSessionPath)
    instructionPack = resolvedInstruction.instructionPack
    instructionMarkdown = resolvedInstruction.instructionMarkdown
    sourceInstructionPack = resolvedInstruction.sourceInstructionPack
    sourceInstructionMarkdown = resolvedInstruction.sourceInstructionMarkdown
    resolvedInstructionPackPath = resolvedInstruction.resolvedInstructionPackPath
    resolvedInstructionMarkdownPath = resolvedInstruction.resolvedInstructionMarkdownPath
  }

  const optionalSources = await loadOptionalSources(root, [
    ['candidate', options.candidate],
    ['analyzerRun', options.analyzerRun],
    ['analyzerPack', options.analyzerPack],
    ['providerConfig', options.providerConfig],
  ])

  return {
    prompt,
    sourcePromptKind,
    sourcePromptFile,
    resolvedPromptFilePath,
    hookHealth: requireRecord(hookHealth.value, 'Hook Gateway health artifact'),
    sourceHookGatewayHealth: relativePath(root, resolvedHookHealthPath),
    resolvedHookHealthPath,
    devviewMode: parseDevViewMode(options.devviewMode),
    preflight: preflight ? requireRecord(preflight, 'preflight session chain report') : null,
    sourcePreflightSessionChain,
    resolvedPreflightSessionPath,
    instructionPack,
    instructionMarkdown,
    sourceInstructionPack,
    sourceInstructionMarkdown,
    resolvedInstructionPackPath,
    resolvedInstructionMarkdownPath,
    optionalSources,
  }
}

async function readInstructionPackFromPreflight(
  root: string,
  preflight: JsonRecord,
  resolvedPreflightSessionPath: string,
): Promise<{
  instructionPack: JsonRecord | null
  instructionMarkdown: string | null
  sourceInstructionPack: string | null
  sourceInstructionMarkdown: string | null
  resolvedInstructionPackPath: string | null
  resolvedInstructionMarkdownPath: string | null
}> {
  const stageArtifacts = asRecord(preflight.stageArtifacts)
  const candidates = [
    siblingInstructionPackCandidate(root, resolvedPreflightSessionPath),
    {
      packPath: stringValue(stageArtifacts?.instructionPack),
      markdownPath: stringValue(stageArtifacts?.instructionMarkdown),
    },
  ].filter((candidate) => candidate.packPath)

  for (const candidate of candidates) {
    const resolvedPackPath = resolveRepoPath(root, candidate.packPath)
    const pack = await readJsonSafe<JsonRecord>(resolvedPackPath)
    if (!pack.ok) {
      continue
    }
    const resolvedMarkdownPath = candidate.markdownPath ? resolveRepoPath(root, candidate.markdownPath) : null
    const markdown = resolvedMarkdownPath ? await readTextSafe(resolvedMarkdownPath) : null
    return {
      instructionPack: requireRecord(pack.value, 'Instruction Pack'),
      instructionMarkdown: markdown?.ok ? markdown.value : null,
      sourceInstructionPack: relativePath(root, resolvedPackPath),
      sourceInstructionMarkdown: resolvedMarkdownPath && markdown?.ok ? relativePath(root, resolvedMarkdownPath) : null,
      resolvedInstructionPackPath: resolvedPackPath,
      resolvedInstructionMarkdownPath: resolvedMarkdownPath && markdown?.ok ? resolvedMarkdownPath : null,
    }
  }

  return {
    instructionPack: null,
    instructionMarkdown: null,
    sourceInstructionPack: null,
    sourceInstructionMarkdown: null,
    resolvedInstructionPackPath: null,
    resolvedInstructionMarkdownPath: null,
  }
}

function siblingInstructionPackCandidate(
  root: string,
  resolvedPreflightSessionPath: string,
): { packPath: string; markdownPath: string } {
  const base = path.basename(resolvedPreflightSessionPath)
  const match = /^devview-preflight-session-chain(.+)\.json$/u.exec(base)
  if (!match) {
    return { packPath: '', markdownPath: '' }
  }
  const suffix = match[1]
  const dir = path.dirname(resolvedPreflightSessionPath)
  return {
    packPath: relativePath(root, path.join(dir, `instruction-pack${suffix}.json`)),
    markdownPath: relativePath(root, path.join(dir, `instruction-pack${suffix}.md`)),
  }
}

async function loadOptionalSources(
  root: string,
  entries: Array<[string, string | undefined]>,
): Promise<LoadedInputs['optionalSources']> {
  const loaded: LoadedInputs['optionalSources'] = []
  for (const [label, optionPath] of entries) {
    if (!optionPath) {
      continue
    }
    const resolvedPath = resolveRepoPath(root, optionPath)
    const parsed = await readJsonSafe<JsonRecord>(resolvedPath)
    if (!parsed.ok) {
      throw new Error(`Unable to read ${label} artifact from ${optionPath}: ${parsed.error}`)
    }
    loaded.push({
      label,
      optionPath,
      sourcePath: relativePath(root, resolvedPath),
      resolvedPath,
      artifact: asRecord(parsed.value),
    })
  }
  return loaded
}

function buildReport(
  root: string,
  inputs: LoadedInputs,
  options: UserPromptSubmitAdvisoryOptions,
): UserPromptSubmitAdvisoryReport {
  const findings = validateInputs(inputs)
  const contextStatus = determineContextStatus(inputs, findings)
  const status = statusForContext(inputs.devviewMode, contextStatus)
  const ready = contextStatus === 'ready-from-preflight'
  const instructionPack = ready ? inputs.instructionPack : null

  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status,
    reporterName: REPORTER_NAME,
    eventName: 'UserPromptSubmit',
    sourcePromptKind: inputs.sourcePromptKind,
    sourcePromptFile: inputs.sourcePromptFile,
    promptPreview: promptPreview(inputs.prompt),
    promptLength: inputs.prompt.length,
    sourceHookGatewayHealth: inputs.sourceHookGatewayHealth,
    sourcePreflightSessionChain: inputs.sourcePreflightSessionChain,
    sourceRequestIrCandidate: sourceForOptional(inputs, 'candidate'),
    sourceAnalyzerRun: sourceForOptional(inputs, 'analyzerRun'),
    sourceAnalyzerPack: sourceForOptional(inputs, 'analyzerPack'),
    sourceProviderConfig: sourceForOptional(inputs, 'providerConfig'),
    devviewMode: inputs.devviewMode,
    guidedModeRequested: inputs.devviewMode === 'guided',
    advisoryContextStatus: contextStatus,
    additionalContextInjectionReady: ready,
    additionalContextMarkdownPath: options.markdown
      ? relativePath(root, resolveRepoPath(root, options.markdown))
      : null,
    nextRequiredCommand: nextRequiredCommand(inputs, contextStatus),
    preflightTerminalStage: inputs.preflight ? stringValue(inputs.preflight.terminalStage) : null,
    preflightFindingsSummary: summarizePreflightFindings(inputs.preflight),
    instructionPackSummary: {
      sourceInstructionPack: ready ? inputs.sourceInstructionPack : null,
      sourceInstructionMarkdown: ready ? inputs.sourceInstructionMarkdown : null,
      taskSummary: stringValue(instructionPack?.taskSummary),
      allowedScopeCount: arrayRecords(instructionPack?.allowedScope).length,
      forbiddenScopeCount: arrayRecords(instructionPack?.forbiddenScope).length,
      requiredEvidenceCount: arrayRecords(instructionPack?.requiredEvidence).length,
      outputRequirementCount: arrayRecords(instructionPack?.outputRequirements).length,
      stopConditionCount: arrayRecords(instructionPack?.stopConditions).length,
      knownRiskCount: arrayRecords(instructionPack?.knownRisks).length,
    },
    validationChain: ready
      ? [
          'Request IR schema-only validation',
          'graph-aware Request IR validation',
          'graph traversal plan',
          'selected graph slice',
          'Contract Compiler Input',
          'Instruction Pack preview',
        ]
      : [],
    allowedScope: arrayRecords(instructionPack?.allowedScope),
    forbiddenScope: arrayRecords(instructionPack?.forbiddenScope),
    requiredEvidence: arrayRecords(instructionPack?.requiredEvidence),
    outputRequirements: arrayRecords(instructionPack?.outputRequirements),
    stopConditions: arrayRecords(instructionPack?.stopConditions),
    knownRisks: arrayRecords(instructionPack?.knownRisks),
    validationFindings: findings,
    hookScriptsInstalled: false,
    hookGatewayActive: 'not-checked-preview-only',
    codexExecutionTriggered: false,
    toolBlockingEnabled: false,
    preToolUseBlockingEnabled: false,
    postToolUseBlockingEnabled: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    nonEnforcing: true,
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: relativePath(root, resolveRepoPath(root, options.output)),
    markdownReportPath: null,
    writtenOutputPathAuthorityStatus: 'explicit-preview-output-not-source-authority',
    markdownReportAuthorityStatus: 'not-written',
    nonExecutionBoundary:
      'This UserPromptSubmit advisory report summarizes DevView preflight context only. It does not install hooks, trust repositories, start active hook sessions, block Codex execution or tools, call an LLM/API, invoke providers, run validation or traversal, mutate graph-source, apply graph deltas, automate approval or human decisions, accept or satisfy Evidence, prove equivalence, enforce scope, or configure CI.',
  }
}

function validateInputs(inputs: LoadedInputs): UserPromptSubmitAdvisoryFinding[] {
  const findings: UserPromptSubmitAdvisoryFinding[] = []
  validateHookHealth(inputs.hookHealth, findings)
  for (const [label, record] of [
    ['hookHealth', inputs.hookHealth],
    ...(inputs.preflight ? [['preflightSession', inputs.preflight] as [string, JsonRecord]] : []),
    ...(inputs.instructionPack ? [['instructionPack', inputs.instructionPack] as [string, JsonRecord]] : []),
    ...inputs.optionalSources.flatMap((source) =>
      source.artifact ? ([[source.label, source.artifact]] as Array<[string, JsonRecord]>) : [],
    ),
  ] as Array<[string, JsonRecord]>) {
    validateUnsafeSignals(label, record, findings)
  }

  if (inputs.preflight) {
    expectPreflight(inputs.preflight, findings)
    if (isPreflightGenerated(inputs.preflight) && !inputs.instructionPack) {
      findings.push({
        code: 'USER_PROMPT_SUBMIT_ADVISORY_PREFLIGHT_INSTRUCTION_PACK_MISSING',
        severity: 'warning',
        field: 'preflightSession.stageArtifacts.instructionPack',
        message: 'Preflight session is generated, but its Instruction Pack artifact could not be read.',
        suggestedFix:
          'Rerun graph read-model run-preflight-session or provide a preflight report with readable child artifacts.',
      })
    }
  }
  if (inputs.instructionPack) {
    if (
      inputs.instructionPack.artifactRole !== 'instruction-pack' ||
      inputs.instructionPack.status !== 'instruction-pack-generated'
    ) {
      findings.push({
        code: 'USER_PROMPT_SUBMIT_ADVISORY_INSTRUCTION_PACK_UNSAFE',
        severity: 'error',
        field: 'instructionPack',
        message: 'Instruction Pack summary source must be a generated Instruction Pack preview.',
        expected: { artifactRole: 'instruction-pack', status: 'instruction-pack-generated' },
        actual: { artifactRole: inputs.instructionPack.artifactRole, status: inputs.instructionPack.status },
      })
    }
  }
  return findings
}

function validateHookHealth(record: JsonRecord, findings: UserPromptSubmitAdvisoryFinding[]): void {
  const role = stringValue(record.artifactRole)
  const valid =
    (role === 'devview-hook-gateway-health-report' &&
      stringValue(record.status) === 'devview-hook-gateway-health-report-generated') ||
    (role === 'devview-hook-gateway-health-boundary-preview' &&
      stringValue(record.status) === 'devview-hook-gateway-health-boundary-previewed')
  if (!valid) {
    findings.push({
      code: 'USER_PROMPT_SUBMIT_ADVISORY_HOOK_HEALTH_MISMATCH',
      severity: 'error',
      field: 'hookHealth',
      message: 'Hook health input must be a generated health report or health boundary preview.',
      actual: { artifactRole: role, status: record.status },
    })
  }
}

function expectPreflight(record: JsonRecord, findings: UserPromptSubmitAdvisoryFinding[]): void {
  if (record.artifactRole !== 'devview-preflight-session-chain-report') {
    findings.push({
      code: 'USER_PROMPT_SUBMIT_ADVISORY_PREFLIGHT_ROLE_MISMATCH',
      severity: 'error',
      field: 'preflightSession.artifactRole',
      message: 'Preflight input must be a DevView preflight session chain report.',
      expected: 'devview-preflight-session-chain-report',
      actual: record.artifactRole,
    })
  }
  const status = stringValue(record.status)
  if (
    status !== 'devview-preflight-session-chain-report-generated' &&
    status !== 'devview-preflight-session-chain-report-blocked'
  ) {
    findings.push({
      code: 'USER_PROMPT_SUBMIT_ADVISORY_PREFLIGHT_STATUS_MISMATCH',
      severity: 'error',
      field: 'preflightSession.status',
      message: 'Preflight input must be a generated or blocked preflight session chain report.',
      actual: record.status,
    })
  }
}

function validateUnsafeSignals(label: string, record: JsonRecord, findings: UserPromptSubmitAdvisoryFinding[]): void {
  const falseFields = [
    'strictModeEnabled',
    'guidedEnforcementEnabled',
    'actualBlockingHookBehaviorImplemented',
    'codexExecutionTriggered',
    'toolBlockingEnabled',
    'preToolUseBlockingEnabled',
    'postToolUseBlockingEnabled',
    'graphSourceMutated',
    'graphDeltaApplied',
    'humanDecisionRecorded',
    'runtimeEvidenceSatisfied',
    'evidenceAccepted',
    'equivalenceProven',
    'scopeEnforced',
    'ciEnforcementEnabled',
    'graphApplyEnabled',
    'approvalAutomationEnabled',
  ]
  for (const field of falseFields) {
    if (record[field] === true) {
      findings.push({
        code: 'USER_PROMPT_SUBMIT_ADVISORY_UNSAFE_AUTHORITY_SIGNAL',
        severity: 'error',
        field: `${label}.${field}`,
        message: `UserPromptSubmit advisory input "${label}" claims unsafe authority "${field}".`,
        expected: false,
        actual: true,
      })
    }
  }
  if (record.approvalStatus && record.approvalStatus !== 'not-approved') {
    findings.push({
      code: 'USER_PROMPT_SUBMIT_ADVISORY_UNSAFE_APPROVAL_SIGNAL',
      severity: 'error',
      field: `${label}.approvalStatus`,
      message: `UserPromptSubmit advisory input "${label}" claims approval status.`,
      expected: 'not-approved',
      actual: record.approvalStatus,
    })
  }
}

function determineContextStatus(
  inputs: LoadedInputs,
  findings: UserPromptSubmitAdvisoryFinding[],
): AdvisoryContextStatus {
  if (inputs.devviewMode === 'off') {
    return 'noop-devview-off'
  }
  if (!inputs.preflight) {
    return 'missing-preflight'
  }
  if (!isPreflightGenerated(inputs.preflight)) {
    return 'blocked-preflight'
  }
  if (!inputs.instructionPack) {
    return 'preflight-artifact-missing'
  }
  if (findings.some((finding) => finding.severity === 'error')) {
    return 'blocked-preflight'
  }
  return 'ready-from-preflight'
}

function statusForContext(
  mode: DevViewUserPromptMode,
  status: AdvisoryContextStatus,
): UserPromptSubmitAdvisoryReport['status'] {
  if (mode === 'off') {
    return 'user-prompt-submit-advisory-noop-devview-off'
  }
  if (status === 'ready-from-preflight') {
    return 'user-prompt-submit-advisory-generated'
  }
  if (status === 'missing-preflight') {
    return 'user-prompt-submit-advisory-missing-preflight'
  }
  if (status === 'preflight-artifact-missing') {
    return 'user-prompt-submit-advisory-preflight-artifact-missing'
  }
  return 'user-prompt-submit-advisory-blocked-preflight'
}

function nextRequiredCommand(inputs: LoadedInputs, status: AdvisoryContextStatus): string | null {
  if (status === 'missing-preflight') {
    const candidate = sourceForOptional(inputs, 'candidate') || '<candidatePath>'
    return `graph read-model run-preflight-session --candidate ${candidate} --output-dir <preflightOutputDir> --json`
  }
  if (status === 'blocked-preflight' || status === 'preflight-artifact-missing') {
    const candidate =
      sourceForOptional(inputs, 'candidate') ||
      stringValue(inputs.preflight?.sourceRequestIrCandidate) ||
      '<candidatePath>'
    return `graph read-model run-preflight-session --candidate ${candidate} --output-dir <preflightOutputDir> --json`
  }
  return null
}

export function renderUserPromptSubmitAdvisoryMarkdown(report: UserPromptSubmitAdvisoryReport): string {
  if (report.devviewMode === 'off') {
    return [
      '# DevView UserPromptSubmit Advisory',
      '',
      'DevView mode: off.',
      'No DevView additionalContext should be injected.',
      '',
      `Prompt preview: ${report.promptPreview}`,
      '',
      'Boundary: no hook install, no Codex blocking, no provider call, no validation/traversal, no graph mutation, and no enforcement.',
      '',
    ].join('\n')
  }
  const lines = [
    '# DevView UserPromptSubmit Advisory',
    '',
    `Status: ${report.status}`,
    `Mode: ${report.devviewMode} (advisory-only, non-enforcing)`,
    `Additional context ready: ${report.additionalContextInjectionReady}`,
    '',
    '## DevView Status',
    '',
    '- Strict mode: disabled.',
    '- Guided enforcement: disabled.',
    '- Tool blocking: disabled.',
    '- Codex execution is not triggered.',
    '',
    '## Prompt',
    '',
    `- Source: ${report.sourcePromptKind}${report.sourcePromptFile ? ` (${report.sourcePromptFile})` : ''}`,
    `- Preview: ${report.promptPreview}`,
    '',
    '## Preflight',
    '',
    `- Status: ${report.advisoryContextStatus}`,
    `- Terminal stage: ${report.preflightTerminalStage ?? 'not available'}`,
  ]
  if (report.nextRequiredCommand) {
    lines.push(`- Next required command: \`${report.nextRequiredCommand}\``)
  }
  lines.push(
    '',
    '## Validation Chain',
    '',
    ...report.validationChain.map((entry) => `- ${entry}`),
    '',
    '## Instruction Pack Summary',
    '',
    `- Source: ${report.instructionPackSummary.sourceInstructionPack ?? 'not available'}`,
    `- Task: ${report.instructionPackSummary.taskSummary || 'not available'}`,
    '',
    '## Allowed Scope',
    '',
    ...renderScopeRows(report.allowedScope),
    '',
    '## Forbidden Scope And Non-goals',
    '',
    ...renderScopeRows(report.forbiddenScope),
    '- Do not treat this advisory context as approval.',
    '- Do not mutate graph-source or apply graph deltas.',
    '- Do not claim runtime Evidence satisfaction or equivalence proof.',
    '- Do not enforce scope or CI from this preview.',
    '',
    '## Required Evidence',
    '',
    ...renderEvidenceRows(report.requiredEvidence),
    '',
    '## Output Requirements',
    '',
    ...renderOutputRequirementRows(report.outputRequirements),
    '',
    '## Stop Conditions',
    '',
    ...renderStopConditionRows(report.stopConditions),
    '',
    '## Known Risks',
    '',
    ...renderRiskRows(report.knownRisks),
    '',
    '## Boundary',
    '',
    `- ${report.nonExecutionBoundary}`,
    '',
  )
  if (report.validationFindings.length > 0) {
    lines.push('## Findings', '')
    for (const finding of report.validationFindings) {
      lines.push(`- ${finding.severity}: ${finding.code} - ${finding.message}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

async function assertOutputAuthority(
  root: string,
  inputs: LoadedInputs,
  options: UserPromptSubmitAdvisoryOptions,
): Promise<void> {
  const targets = [
    { kind: 'output', requestedPath: options.output, resolvedPath: resolveRepoPath(root, options.output) },
    ...(options.markdown
      ? [{ kind: 'markdown', requestedPath: options.markdown, resolvedPath: resolveRepoPath(root, options.markdown) }]
      : []),
  ]
  if (targets.length === 2 && pathKey(targets[0].resolvedPath) === pathKey(targets[1].resolvedPath)) {
    throw new Error(
      `UserPromptSubmit advisory output is unsafe: --output and --markdown resolve to the same path (${targets[0].requestedPath}).`,
    )
  }

  const protectedPaths = buildProtectedOutputPathMap(root, inputs)
  for (const target of targets) {
    const protectedReason = protectedPaths.get(pathKey(target.resolvedPath))
    if (protectedReason) {
      throw new Error(
        `UserPromptSubmit advisory ${target.kind} path is unsafe: ${target.requestedPath} would overwrite ${protectedReason}.`,
      )
    }
    const reserved = classifyReservedSourcePath(target.resolvedPath)
    if (reserved) {
      throw new Error(
        `UserPromptSubmit advisory ${target.kind} path is unsafe: ${target.requestedPath} targets ${reserved}.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(target.resolvedPath)
    if (existingAuthority) {
      throw new Error(
        `UserPromptSubmit advisory ${target.kind} path is unsafe: ${target.requestedPath} already contains ${existingAuthority}.`,
      )
    }
  }
}

function buildProtectedOutputPathMap(root: string, inputs: LoadedInputs): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const addResolved = (candidate: string | null, reason: string): void => {
    if (candidate) {
      protectedPaths.set(pathKey(candidate), reason)
    }
  }
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

  addResolved(inputs.resolvedPromptFilePath, 'the source prompt file')
  addResolved(inputs.resolvedHookHealthPath, 'the source Hook Gateway health artifact')
  addResolved(inputs.resolvedPreflightSessionPath, 'the source preflight session chain report')
  addResolved(inputs.resolvedInstructionPackPath, 'the source Instruction Pack')
  addResolved(inputs.resolvedInstructionMarkdownPath, 'the source Instruction Pack Markdown')
  for (const source of inputs.optionalSources) {
    addResolved(source.resolvedPath, `the source ${source.label} artifact`)
  }
  for (const record of [
    inputs.hookHealth,
    ...(inputs.preflight ? [inputs.preflight] : []),
    ...(inputs.instructionPack ? [inputs.instructionPack] : []),
    ...inputs.optionalSources.flatMap((source) => (source.artifact ? [source.artifact] : [])),
  ]) {
    for (const candidatePath of collectConcretePathStrings(record)) {
      add(candidatePath, `linked source artifact ${candidatePath}`)
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
  if (artifactRole === REPORT_ROLE) {
    return null
  }
  if (artifactRole.includes('graph-source')) {
    return `graph-source artifactRole "${artifactRole}"`
  }
  const blockedRoles = new Set([
    'devview-hook-gateway-health-report',
    'devview-hook-gateway-health-boundary-preview',
    'devview-preflight-session-chain-report',
    'instruction-pack',
    'contract-compiler-input',
    'selected-graph-slice',
    'graph-traversal-plan',
    'request-ir-graph-aware-validation',
    'request-ir-candidate-schema-only-validation',
    'request-ir-candidate',
    'request-ir-candidate-calibration-fixture-preview',
    'ai-request-analyzer-run-result',
    'ai-request-analyzer-pack',
    'ai-request-analyzer-provider-config-preview',
    'devview-project-memory-preview',
  ])
  if (blockedRoles.has(artifactRole)) {
    return `source/protected artifactRole "${artifactRole}"`
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
  if (normalized.includes('/.pbe/')) {
    return 'PBE source/control/evidence path'
  }
  if (normalized.includes('/.codex/hooks/') || normalized.endsWith('/.codex/config.json')) {
    return 'active hook/config path'
  }
  if (
    normalized.endsWith('/generated/generated-read-model.json') ||
    normalized.endsWith('/generated/graph-source-read-model-projection.json')
  ) {
    return 'generated read-model source authority path'
  }
  return null
}

function summarizePreflightFindings(
  preflight: JsonRecord | null,
): UserPromptSubmitAdvisoryReport['preflightFindingsSummary'] {
  const findings = arrayRecords(preflight?.validationFindings)
  return {
    errors: findings.filter((finding) => finding.severity === 'error').length,
    warnings: findings.filter((finding) => finding.severity === 'warning').length,
    infos: findings.filter((finding) => finding.severity === 'info').length,
  }
}

function isPreflightGenerated(preflight: JsonRecord): boolean {
  return (
    preflight.status === 'devview-preflight-session-chain-report-generated' &&
    preflight.terminalStage === 'instruction-pack-preview-generated-no-codex-execution' &&
    preflight.instructionPackGenerated === true &&
    preflight.codexExecutionTriggered === false
  )
}

function sourceForOptional(inputs: LoadedInputs, label: string): string | null {
  return inputs.optionalSources.find((source) => source.label === label)?.sourcePath ?? null
}

function promptPreview(prompt: string): string {
  const compact = prompt.replace(/\s+/gu, ' ').trim()
  return compact.length > 220 ? `${compact.slice(0, 217)}...` : compact
}

function parseDevViewMode(value: string | undefined): DevViewUserPromptMode {
  if (!value) {
    return 'advisory'
  }
  if (value === 'off' || value === 'advisory' || value === 'guided' || value === 'strict-disabled') {
    return value
  }
  throw new Error('--devview-mode requires one of: off, advisory, guided, strict-disabled.')
}

function renderScopeRows(entries: JsonRecord[]): string[] {
  if (entries.length === 0) {
    return ['- none available']
  }
  return entries.map((entry) => {
    const paths = stringArray(entry.paths)
    const suffix = paths.length > 0 ? `: ${paths.map((scopePath) => `\`${scopePath}\``).join(', ')}` : ''
    return `- ${stringValue(entry.id) || 'scope'}${suffix}`
  })
}

function renderEvidenceRows(entries: JsonRecord[]): string[] {
  if (entries.length === 0) {
    return ['- none available']
  }
  return entries.map((entry) => `- ${stringValue(entry.id) || 'evidence'}: \`${stringValue(entry.artifact)}\``)
}

function renderOutputRequirementRows(entries: JsonRecord[]): string[] {
  if (entries.length === 0) {
    return ['- none available']
  }
  return entries.map((entry) => `- ${stringValue(entry.id) || 'output'}: ${stringValue(entry.requiredReportTarget)}`)
}

function renderStopConditionRows(entries: JsonRecord[]): string[] {
  if (entries.length === 0) {
    return ['- none available']
  }
  return entries.map((entry) => `- ${stringValue(entry.id) || 'stop'}: ${stringValue(entry.condition)}`)
}

function renderRiskRows(entries: JsonRecord[]): string[] {
  if (entries.length === 0) {
    return ['- none available']
  }
  return entries.map((entry) => `- ${stringValue(entry.id) || 'risk'}: ${stringValue(entry.mitigation)}`)
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
  return [...new Set(paths)]
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

function requireRecord(value: unknown, label: string): JsonRecord {
  const record = asRecord(value)
  if (!record) {
    throw new Error(`${label} must be a JSON object.`)
  }
  return record
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

function resolveRepoPath(root: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(root, inputPath)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}
