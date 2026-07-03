import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import type { IssueSeverity } from './types.js'

const REPORTER_NAME = 'HookActivationChainReporter'
const REQUIRED_HOOK_EVENTS = ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop']

type JsonRecord = Record<string, unknown>

export interface HookActivationChainFinding {
  code: string
  severity: IssueSeverity
  field?: string
  message: string
  expected?: unknown
  actual?: unknown
  suggestedFix?: string
}

export interface HookActivationChainReport {
  schemaVersion: 1
  artifactRole: 'devview-hook-activation-chain-report'
  status: 'devview-hook-activation-chain-report-generated' | 'devview-hook-activation-chain-report-blocked'
  reporterName: typeof REPORTER_NAME
  reportScope: 'hook-activation-preview-chain-report-only'
  terminalActivationStage: 'session-manifest-preview-generated-no-hook-activation'
  sourceHookGatewayHealth: string
  sourceUserPromptSubmitContextPreview: string
  sourceHookScriptScaffold: string
  sourceHookScriptTemplatePreview: string
  sourceHookSessionManifest: string
  chainStages: JsonRecord[]
  hookEventReadiness: JsonRecord[]
  hooksActive: false
  hookScriptsInstalled: false
  strictModeEnabled: false
  guidedEnforcementEnabled: false
  actualBlockingHookBehaviorImplemented: false
  codexExecutionTriggered: false
  graphSourceMutated: false
  graphDeltaApplied: false
  approvalStatus: 'not-approved'
  humanDecisionRecorded: false
  runtimeEvidenceSatisfied: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  humanReviewRequired: true
  nonEnforcing: true
  runtimeBudgetEnforced: false
  bypassDetectionStatus: 'preview-only-non-enforcing'
  validationFindings: HookActivationChainFinding[]
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  markdownReportPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-preview-output-not-source-authority'
  markdownReportAuthorityStatus: 'not-written' | 'explicit-preview-output-not-source-authority'
  nonExecutionBoundary: string
}

export interface HookActivationChainFileResult {
  report: HookActivationChainReport
  outputPath?: string
  markdownReport?: string
}

interface LoadedInputs {
  hookHealth: JsonRecord
  userPromptContext: JsonRecord
  scriptScaffold: JsonRecord
  scriptTemplates: JsonRecord
  sessionManifest: JsonRecord
  sourceHookGatewayHealth: string
  sourceUserPromptSubmitContextPreview: string
  sourceHookScriptScaffold: string
  sourceHookScriptTemplatePreview: string
  sourceHookSessionManifest: string
  resolvedHookHealthPath: string
  resolvedUserPromptContextPath: string
  resolvedScriptScaffoldPath: string
  resolvedScriptTemplatesPath: string
  resolvedSessionManifestPath: string
}

export async function reportHookActivationChainFile(
  root: string,
  options: {
    hookHealth: string
    userPromptContext: string
    scriptScaffold: string
    scriptTemplates: string
    sessionManifest: string
    output?: string
    markdown?: string
  },
): Promise<HookActivationChainFileResult> {
  const loaded = await loadInputs(root, options)
  await assertHookActivationChainOutputAuthority(root, loaded, options)
  const report = buildHookActivationChainReport(root, loaded)

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
    await writeTextAtomic(resolvedMarkdownPath, renderHookActivationChainMarkdown(report))
    if (options.output && outputPath) {
      await writeJsonAtomic(resolveRepoPath(root, options.output), report)
    }
  }

  return { report, ...(outputPath ? { outputPath } : {}), ...(markdownReport ? { markdownReport } : {}) }
}

function buildHookActivationChainReport(root: string, inputs: LoadedInputs): HookActivationChainReport {
  const findings = validateInputs(root, inputs)
  const blocked = findings.some((finding) => finding.severity === 'error')
  return {
    schemaVersion: 1,
    artifactRole: 'devview-hook-activation-chain-report',
    status: blocked ? 'devview-hook-activation-chain-report-blocked' : 'devview-hook-activation-chain-report-generated',
    reporterName: REPORTER_NAME,
    reportScope: 'hook-activation-preview-chain-report-only',
    terminalActivationStage: 'session-manifest-preview-generated-no-hook-activation',
    sourceHookGatewayHealth: inputs.sourceHookGatewayHealth,
    sourceUserPromptSubmitContextPreview: inputs.sourceUserPromptSubmitContextPreview,
    sourceHookScriptScaffold: inputs.sourceHookScriptScaffold,
    sourceHookScriptTemplatePreview: inputs.sourceHookScriptTemplatePreview,
    sourceHookSessionManifest: inputs.sourceHookSessionManifest,
    chainStages: buildChainStages(inputs),
    hookEventReadiness: buildHookEventReadiness(inputs, blocked),
    hooksActive: false,
    hookScriptsInstalled: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    actualBlockingHookBehaviorImplemented: false,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    humanReviewRequired: true,
    nonEnforcing: true,
    runtimeBudgetEnforced: false,
    bypassDetectionStatus: 'preview-only-non-enforcing',
    validationFindings: findings,
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    markdownReportPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportAuthorityStatus: 'not-written',
    nonExecutionBoundary:
      'This Hook Activation Chain report verifies preview artifact continuity only. It does not install hooks, activate hooks, trust repositories, configure Codex, block Codex execution, call an LLM, make network calls, run graph traversal, mutate graph-source, apply graph deltas, approve work, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
  }
}

export function renderHookActivationChainMarkdown(report: HookActivationChainReport): string {
  return [
    '# DevView Hook Activation Preview Chain',
    '',
    `Status: ${report.status}`,
    `Terminal stage: ${report.terminalActivationStage}`,
    '',
    '## Sources',
    '',
    `- Hook health: \`${report.sourceHookGatewayHealth}\``,
    `- UserPromptSubmit context: \`${report.sourceUserPromptSubmitContextPreview}\``,
    `- Script scaffold: \`${report.sourceHookScriptScaffold}\``,
    `- Script templates: \`${report.sourceHookScriptTemplatePreview}\``,
    `- Session manifest: \`${report.sourceHookSessionManifest}\``,
    '',
    '## Chain Stages',
    '',
    ...report.chainStages.map(
      (stage) => `- ${stringValue(stage.stage)}: ${stringValue(stage.status)} (${stringValue(stage.artifactRole)})`,
    ),
    '',
    '## Hook Event Readiness',
    '',
    ...report.hookEventReadiness.map(
      (entry) => `- ${stringValue(entry.hookEvent)}: ${stringValue(entry.readinessStatus)}`,
    ),
    '',
    '## Non-execution Statement',
    '',
    report.nonExecutionBoundary,
    '',
  ].join('\n')
}

async function loadInputs(
  root: string,
  options: {
    hookHealth: string
    userPromptContext: string
    scriptScaffold: string
    scriptTemplates: string
    sessionManifest: string
  },
): Promise<LoadedInputs> {
  const resolvedHookHealthPath = resolveRepoPath(root, options.hookHealth)
  const resolvedUserPromptContextPath = resolveRepoPath(root, options.userPromptContext)
  const resolvedScriptScaffoldPath = resolveRepoPath(root, options.scriptScaffold)
  const resolvedScriptTemplatesPath = resolveRepoPath(root, options.scriptTemplates)
  const resolvedSessionManifestPath = resolveRepoPath(root, options.sessionManifest)
  const hookHealth = await readRequiredJson(resolvedHookHealthPath, 'Hook Gateway health artifact', options.hookHealth)
  const userPromptContext = await readRequiredJson(
    resolvedUserPromptContextPath,
    'UserPromptSubmit context preview',
    options.userPromptContext,
  )
  const scriptScaffold = await readRequiredJson(
    resolvedScriptScaffoldPath,
    'Hook script scaffold preview',
    options.scriptScaffold,
  )
  const scriptTemplates = await readRequiredJson(
    resolvedScriptTemplatesPath,
    'Hook script template preview',
    options.scriptTemplates,
  )
  const sessionManifest = await readRequiredJson(
    resolvedSessionManifestPath,
    'Hook session manifest preview',
    options.sessionManifest,
  )
  return {
    hookHealth,
    userPromptContext,
    scriptScaffold,
    scriptTemplates,
    sessionManifest,
    sourceHookGatewayHealth: relativePath(root, resolvedHookHealthPath),
    sourceUserPromptSubmitContextPreview: relativePath(root, resolvedUserPromptContextPath),
    sourceHookScriptScaffold: relativePath(root, resolvedScriptScaffoldPath),
    sourceHookScriptTemplatePreview: relativePath(root, resolvedScriptTemplatesPath),
    sourceHookSessionManifest: relativePath(root, resolvedSessionManifestPath),
    resolvedHookHealthPath,
    resolvedUserPromptContextPath,
    resolvedScriptScaffoldPath,
    resolvedScriptTemplatesPath,
    resolvedSessionManifestPath,
  }
}

async function readRequiredJson(resolvedPath: string, label: string, originalPath: string): Promise<JsonRecord> {
  const parsed = await readJsonSafe<JsonRecord>(resolvedPath)
  if (!parsed.ok) throw new Error(`Unable to read ${label} from ${originalPath}: ${parsed.error}`)
  return parsed.value
}

function validateInputs(root: string, inputs: LoadedInputs): HookActivationChainFinding[] {
  const findings: HookActivationChainFinding[] = []
  validateRoleStatus('hookHealth', inputs.hookHealth, findings, [
    ['devview-hook-gateway-health-report', 'devview-hook-gateway-health-report-generated'],
    ['devview-hook-gateway-health-boundary-preview', 'devview-hook-gateway-health-boundary-previewed'],
  ])
  validateRoleStatus('userPromptContext', inputs.userPromptContext, findings, [
    ['devview-user-prompt-submit-context-preview', 'user-prompt-submit-context-preview-generated'],
  ])
  validateRoleStatus('scriptScaffold', inputs.scriptScaffold, findings, [
    ['devview-hook-script-scaffold-preview', 'devview-hook-script-scaffold-preview-generated'],
  ])
  validateRoleStatus('scriptTemplates', inputs.scriptTemplates, findings, [
    ['devview-hook-script-template-preview', 'devview-hook-script-template-preview-generated'],
  ])
  validateRoleStatus('sessionManifest', inputs.sessionManifest, findings, [
    ['devview-hook-session-manifest-preview', 'devview-hook-session-manifest-preview-generated'],
  ])

  for (const [label, record] of [
    ['hookHealth', inputs.hookHealth],
    ['userPromptContext', inputs.userPromptContext],
    ['scriptScaffold', inputs.scriptScaffold],
    ['scriptTemplates', inputs.scriptTemplates],
    ['sessionManifest', inputs.sessionManifest],
  ] as Array<[string, JsonRecord]>) {
    validateUnsafeSignals(label, record, findings)
  }

  validateSessionManifestSourceLinks(root, inputs, findings)
  validateHookEventReadiness(inputs, findings)
  return findings
}

function validateRoleStatus(
  label: string,
  record: JsonRecord,
  findings: HookActivationChainFinding[],
  allowed: Array<[string, string]>,
): void {
  const actual = { artifactRole: stringValue(record.artifactRole), status: stringValue(record.status) }
  const ok = allowed.some(([artifactRole, status]) => actual.artifactRole === artifactRole && actual.status === status)
  if (!ok) {
    findings.push({
      code: 'HOOK_ACTIVATION_CHAIN_INPUT_PREREQUISITE_MISMATCH',
      severity: 'error',
      field: label,
      message: `Hook activation chain input "${label}" has an unexpected artifact role or status.`,
      expected: allowed.map(([artifactRole, status]) => ({ artifactRole, status })),
      actual,
    })
  }
}

function validateSessionManifestSourceLinks(
  root: string,
  inputs: LoadedInputs,
  findings: HookActivationChainFinding[],
): void {
  const expectedLinks: Array<[string, string, string]> = [
    [
      'sourceUserPromptSubmitContextPreview',
      stringValue(inputs.sessionManifest.sourceUserPromptSubmitContextPreview),
      inputs.sourceUserPromptSubmitContextPreview,
    ],
    [
      'sourceHookScriptScaffold',
      stringValue(inputs.sessionManifest.sourceHookScriptScaffold),
      inputs.sourceHookScriptScaffold,
    ],
    [
      'sourceHookScriptTemplatePreview',
      stringValue(inputs.sessionManifest.sourceHookScriptTemplatePreview),
      inputs.sourceHookScriptTemplatePreview,
    ],
  ]
  const healthLink = stringValue(inputs.sessionManifest.sourceHookGatewayHealth)
  const suppliedHealthMatches = sameRepoPath(root, healthLink, inputs.sourceHookGatewayHealth)
  const suppliedHealthBoundaryMatches =
    stringValue(inputs.hookHealth.artifactRole) === 'devview-hook-gateway-health-report' &&
    sameRepoPath(root, healthLink, stringValue(inputs.hookHealth.sourceBoundary))
  if (!suppliedHealthMatches && !suppliedHealthBoundaryMatches) {
    findings.push({
      code: 'HOOK_ACTIVATION_CHAIN_SESSION_SOURCE_MISMATCH',
      severity: 'error',
      field: 'sessionManifest.sourceHookGatewayHealth',
      message: 'Hook session manifest health source does not match the supplied Hook Gateway health artifact.',
      expected: inputs.sourceHookGatewayHealth,
      actual: healthLink,
    })
  }
  for (const [field, actual, expected] of expectedLinks) {
    if (!sameRepoPath(root, actual, expected)) {
      findings.push({
        code: 'HOOK_ACTIVATION_CHAIN_SESSION_SOURCE_MISMATCH',
        severity: 'error',
        field: `sessionManifest.${field}`,
        message: `Hook session manifest source link "${field}" does not match the supplied artifact.`,
        expected,
        actual,
      })
    }
  }
}

function validateHookEventReadiness(inputs: LoadedInputs, findings: HookActivationChainFinding[]): void {
  const readiness = arrayRecords(inputs.sessionManifest.hookEventReadiness)
  for (const event of REQUIRED_HOOK_EVENTS) {
    const entry = readiness.find((candidate) => stringValue(candidate.hookEvent) === event)
    if (!entry) {
      findings.push({
        code: 'HOOK_ACTIVATION_CHAIN_MISSING_HOOK_EVENT_READINESS',
        severity: 'error',
        field: 'sessionManifest.hookEventReadiness',
        message: `Hook activation chain requires session manifest readiness for ${event}.`,
        expected: event,
        actual: readiness.map((candidate) => stringValue(candidate.hookEvent)),
      })
      continue
    }
    if (
      entry.readinessStatus !== 'preview-ready-not-active' ||
      entry.hookActive !== false ||
      entry.blockingEnabled !== false
    ) {
      findings.push({
        code: 'HOOK_ACTIVATION_CHAIN_UNSAFE_HOOK_EVENT_READINESS',
        severity: 'error',
        field: `sessionManifest.hookEventReadiness.${event}`,
        message: `Hook event ${event} is not preview-ready/non-active/non-blocking.`,
        expected: { readinessStatus: 'preview-ready-not-active', hookActive: false, blockingEnabled: false },
        actual: entry,
      })
    }
  }
}

function validateUnsafeSignals(label: string, record: JsonRecord, findings: HookActivationChainFinding[]): void {
  const unsafeFalseFields = [
    'hooksActive',
    'hookScriptsImplemented',
    'hookScriptsInstalled',
    'installTrustDecisionImplemented',
    'actualInstallOrTrustMutationImplemented',
    'strictModeEnabled',
    'guidedEnforcementEnabled',
    'actualBlockingHookBehaviorImplemented',
    'codexExecutionTriggered',
    'graphSourceMutated',
    'graphDeltaApplied',
    'humanDecisionRecorded',
    'runtimeEvidenceSatisfied',
    'equivalenceProven',
    'scopeEnforced',
    'ciEnforcementEnabled',
    'graphApplyEnabled',
    'approvalAutomationEnabled',
  ]
  for (const field of unsafeFalseFields) {
    if (record[field] === true) {
      findings.push({
        code: 'HOOK_ACTIVATION_CHAIN_UNSAFE_AUTHORITY_SIGNAL',
        severity: 'error',
        field: `${label}.${field}`,
        message: `Hook activation chain input "${label}" claims unsafe authority "${field}".`,
        expected: false,
        actual: true,
      })
    }
  }
  if (record.approvalStatus && record.approvalStatus !== 'not-approved') {
    findings.push({
      code: 'HOOK_ACTIVATION_CHAIN_UNSAFE_APPROVAL_SIGNAL',
      severity: 'error',
      field: `${label}.approvalStatus`,
      message: `Hook activation chain input "${label}" claims approval status.`,
      expected: 'not-approved',
      actual: record.approvalStatus,
    })
  }
}

function buildChainStages(inputs: LoadedInputs): JsonRecord[] {
  return [
    ['hook-gateway-health', inputs.hookHealth, inputs.sourceHookGatewayHealth],
    ['user-prompt-submit-context', inputs.userPromptContext, inputs.sourceUserPromptSubmitContextPreview],
    ['hook-script-scaffold', inputs.scriptScaffold, inputs.sourceHookScriptScaffold],
    ['hook-script-templates', inputs.scriptTemplates, inputs.sourceHookScriptTemplatePreview],
    ['hook-session-manifest', inputs.sessionManifest, inputs.sourceHookSessionManifest],
  ].map(([stage, record, sourcePath]) => ({
    stage,
    sourcePath,
    artifactRole: stringValue((record as JsonRecord).artifactRole),
    status: stringValue((record as JsonRecord).status),
    authorityStatus: 'preview-or-report-only',
  }))
}

function buildHookEventReadiness(inputs: LoadedInputs, blocked: boolean): JsonRecord[] {
  const readiness = arrayRecords(inputs.sessionManifest.hookEventReadiness)
  return REQUIRED_HOOK_EVENTS.map((event) => {
    const entry = readiness.find((candidate) => stringValue(candidate.hookEvent) === event)
    const ready =
      !blocked &&
      entry?.readinessStatus === 'preview-ready-not-active' &&
      entry.hookActive === false &&
      entry.blockingEnabled === false
    return {
      hookEvent: event,
      readinessStatus: ready ? 'preview-ready-not-active' : 'blocked-or-missing-preview',
      hookActive: false,
      blockingEnabled: false,
      sourceSessionManifestReady: ready,
    }
  })
}

async function assertHookActivationChainOutputAuthority(
  root: string,
  inputs: LoadedInputs,
  options: { output?: string; markdown?: string },
): Promise<void> {
  const targets = [
    ...(options.output
      ? [{ kind: 'output', requestedPath: options.output, resolvedPath: resolveRepoPath(root, options.output) }]
      : []),
    ...(options.markdown
      ? [{ kind: 'markdown', requestedPath: options.markdown, resolvedPath: resolveRepoPath(root, options.markdown) }]
      : []),
  ]
  if (targets.length === 0) return
  if (targets.length === 2 && pathKey(targets[0].resolvedPath) === pathKey(targets[1].resolvedPath)) {
    throw new Error(
      `Hook activation chain report output is unsafe: --output and --markdown resolve to the same path (${targets[0].requestedPath}).`,
    )
  }
  const protectedPaths = buildProtectedOutputPathMap(root, inputs)
  for (const target of targets) {
    const normalizedTarget = relativePath(root, target.resolvedPath)
    if (isActiveHookLocation(normalizedTarget)) {
      throw new Error(
        `Hook activation chain report ${target.kind} path is unsafe: ${target.requestedPath} targets an active hook/config location.`,
      )
    }
    const protectedReason = protectedPaths.get(pathKey(target.resolvedPath))
    if (protectedReason) {
      throw new Error(
        `Hook activation chain report ${target.kind} path is unsafe: ${target.requestedPath} would overwrite ${protectedReason}.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(target.resolvedPath)
    if (existingAuthority) {
      throw new Error(
        `Hook activation chain report ${target.kind} path is unsafe: ${target.requestedPath} already contains ${existingAuthority}. Choose a dedicated preview output path.`,
      )
    }
  }
}

function buildProtectedOutputPathMap(root: string, inputs: LoadedInputs): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  protectedPaths.set(pathKey(inputs.resolvedHookHealthPath), 'the source Hook Gateway health artifact')
  protectedPaths.set(pathKey(inputs.resolvedUserPromptContextPath), 'the source UserPromptSubmit context preview')
  protectedPaths.set(pathKey(inputs.resolvedScriptScaffoldPath), 'the source Hook script scaffold preview')
  protectedPaths.set(pathKey(inputs.resolvedScriptTemplatesPath), 'the source Hook script template preview')
  protectedPaths.set(pathKey(inputs.resolvedSessionManifestPath), 'the source Hook session manifest preview')
  for (const record of [
    inputs.hookHealth,
    inputs.userPromptContext,
    inputs.scriptScaffold,
    inputs.scriptTemplates,
    inputs.sessionManifest,
  ]) {
    for (const candidatePath of collectConcretePathStrings(record)) {
      const key = pathKey(resolveRepoPath(root, candidatePath))
      if (!protectedPaths.has(key)) protectedPaths.set(key, `linked source artifact ${candidatePath}`)
    }
  }
  return protectedPaths
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) return null
  const record = asRecord(parsed.value)
  if (!record) return null
  const artifactRole = stringValue(record.artifactRole)
  if (artifactRole === 'devview-hook-activation-chain-report') return null
  if (artifactRole.includes('graph-source')) return `graph-source artifactRole "${artifactRole}"`
  if (
    [
      'devview-hook-gateway-health-report',
      'devview-hook-gateway-health-boundary-preview',
      'devview-user-prompt-submit-context-preview',
      'devview-hook-script-scaffold-preview',
      'devview-hook-script-template-preview',
      'devview-hook-session-manifest-preview',
      'instruction-pack',
      'contract-compiler-input',
      'selected-graph-slice',
      'graph-traversal-plan',
    ].includes(artifactRole)
  )
    return `selected/source artifactRole "${artifactRole}"`
  if (asRecord(record.sourceRecords)) return 'graph-source-shaped sourceRecords'
  if (asRecord(record.taxonomy) && (Array.isArray(record.nodes) || Array.isArray(record.edges)))
    return 'generated read-model source-authority projection'
  return null
}

function collectConcretePathStrings(value: unknown): string[] {
  const paths: string[] = []
  const visit = (entry: unknown): void => {
    if (typeof entry === 'string') {
      if (isConcreteOutputProtectedPath(entry)) paths.push(entry)
      return
    }
    if (Array.isArray(entry)) {
      for (const item of entry) visit(item)
      return
    }
    const record = asRecord(entry)
    if (!record) return
    for (const item of Object.values(record)) visit(item)
  }
  visit(value)
  return Array.from(new Set(paths))
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
    /\.(json|md|txt|ps1|sh|js|ts|yaml|yml)$/i.test(normalized)
  )
}

function isActiveHookLocation(candidatePath: string): boolean {
  const normalized = candidatePath.replaceAll('\\', '/').toLowerCase()
  return normalized.startsWith('.codex/hooks/') || normalized === '.codex/config.json'
}

function sameRepoPath(root: string, left: string, right: string): boolean {
  if (!left || !right) return false
  return pathKey(resolveRepoPath(root, left)) === pathKey(resolveRepoPath(root, right))
}

function arrayRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.map((entry) => asRecord(entry)).filter((entry): entry is JsonRecord => Boolean(entry))
    : []
}

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as JsonRecord
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function resolveRepoPath(root: string, candidatePath: string): string {
  return path.isAbsolute(candidatePath) ? candidatePath : path.resolve(root, candidatePath)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}
