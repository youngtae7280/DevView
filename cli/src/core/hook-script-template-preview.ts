import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import type { IssueSeverity } from './types.js'

const GENERATOR_NAME = 'HookScriptTemplatePreviewGenerator'

type JsonRecord = Record<string, unknown>

export interface HookScriptTemplateFinding {
  code: string
  severity: IssueSeverity
  field?: string
  message: string
  expected?: unknown
  actual?: unknown
  suggestedFix?: string
}

export interface MaterializedHookScriptTemplatePreview {
  hookEvent: string
  candidateFileName: string
  sourceScriptPathCandidate: string
  installStatus: 'not-installed-preview-only'
  activeStatus: 'not-active-preview-only'
  scriptLanguage: 'powershell-preview'
  mutationPolicy: 'no-mutation-no-blocking-preview'
  scriptBodyLines: string[]
}

export interface HookScriptTemplatePreviewArtifact {
  schemaVersion: 1
  artifactRole: 'devview-hook-script-template-preview'
  status: 'devview-hook-script-template-preview-generated' | 'devview-hook-script-template-preview-blocked'
  generatorName: typeof GENERATOR_NAME
  templateScope: 'materialized-hook-script-body-preview-no-install'
  sourceHookScriptScaffold: string
  devviewMode: 'advisory'
  hookScriptsImplemented: false
  hookScriptsInstalled: false
  hookGatewayConfigured: 'not-checked-preview-only'
  hookGatewayTrusted: 'not-checked-preview-only'
  hookGatewayActive: 'not-checked-preview-only'
  installTrustDecisionImplemented: false
  actualInstallOrTrustMutationImplemented: false
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
  materializedTemplates: MaterializedHookScriptTemplatePreview[]
  validationFindings: HookScriptTemplateFinding[]
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  markdownReportPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-preview-output-not-source-authority'
  markdownReportAuthorityStatus: 'not-written' | 'explicit-preview-output-not-source-authority'
  nonExecutionBoundary: string
}

export interface HookScriptTemplatePreviewFileResult {
  preview: HookScriptTemplatePreviewArtifact
  outputPath?: string
  markdownReport?: string
}

interface LoadedScaffold {
  scaffold: JsonRecord
  sourceHookScriptScaffold: string
  resolvedScaffoldPath: string
}

export async function generateHookScriptTemplatePreviewFile(
  root: string,
  options: {
    scaffold: string
    output?: string
    markdown?: string
  },
): Promise<HookScriptTemplatePreviewFileResult> {
  const loaded = await loadScaffold(root, options.scaffold)
  await assertHookScriptTemplateOutputAuthority(root, loaded, options)
  const preview = buildHookScriptTemplatePreview(loaded)

  let outputPath: string | undefined
  let markdownReport: string | undefined
  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    preview.writtenOutputPath = outputPath
    preview.writtenOutputPathAuthorityStatus = 'explicit-preview-output-not-source-authority'
    await writeJsonAtomic(resolvedOutputPath, preview)
  }
  if (options.markdown) {
    const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
    markdownReport = relativePath(root, resolvedMarkdownPath)
    preview.markdownReportPath = markdownReport
    preview.markdownReportAuthorityStatus = 'explicit-preview-output-not-source-authority'
    await writeTextAtomic(resolvedMarkdownPath, renderHookScriptTemplatePreviewMarkdown(preview))
    if (options.output && outputPath) {
      await writeJsonAtomic(resolveRepoPath(root, options.output), preview)
    }
  }

  return { preview, ...(outputPath ? { outputPath } : {}), ...(markdownReport ? { markdownReport } : {}) }
}

function buildHookScriptTemplatePreview(input: LoadedScaffold): HookScriptTemplatePreviewArtifact {
  const findings = validateScaffold(input.scaffold)
  const blocked = findings.some((finding) => finding.severity === 'error')
  return {
    schemaVersion: 1,
    artifactRole: 'devview-hook-script-template-preview',
    status: blocked ? 'devview-hook-script-template-preview-blocked' : 'devview-hook-script-template-preview-generated',
    generatorName: GENERATOR_NAME,
    templateScope: 'materialized-hook-script-body-preview-no-install',
    sourceHookScriptScaffold: input.sourceHookScriptScaffold,
    devviewMode: 'advisory',
    hookScriptsImplemented: false,
    hookScriptsInstalled: false,
    hookGatewayConfigured: 'not-checked-preview-only',
    hookGatewayTrusted: 'not-checked-preview-only',
    hookGatewayActive: 'not-checked-preview-only',
    installTrustDecisionImplemented: false,
    actualInstallOrTrustMutationImplemented: false,
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
    materializedTemplates: blocked ? [] : buildMaterializedTemplates(input.scaffold),
    validationFindings: findings,
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    markdownReportPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportAuthorityStatus: 'not-written',
    nonExecutionBoundary:
      'This Hook Gateway script template preview materializes script bodies as review artifacts only. It does not write active hook files, install hooks, trust repositories, configure Codex, block Codex execution, call an LLM, make network calls, run validation or traversal, mutate graph-source, apply graph deltas, approve work, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
  }
}

export function renderHookScriptTemplatePreviewMarkdown(preview: HookScriptTemplatePreviewArtifact): string {
  return [
    '# DevView Hook Script Template Preview',
    '',
    `Status: ${preview.status}`,
    '',
    '## Boundary',
    '',
    '- Mode: advisory preview.',
    '- Install status: not installed.',
    '- Active status: not active.',
    '- Script bodies are review artifacts only.',
    '- Strict/guided blocking, Codex execution, approval, Evidence satisfaction, equivalence proof, scope enforcement, and CI enforcement remain disabled.',
    '',
    ...preview.materializedTemplates.flatMap((template) => [
      `## ${template.hookEvent}`,
      '',
      `Candidate file: \`${template.candidateFileName}\``,
      '',
      '```powershell',
      ...template.scriptBodyLines,
      '```',
      '',
    ]),
    '## Non-execution Statement',
    '',
    preview.nonExecutionBoundary,
    '',
  ].join('\n')
}

async function loadScaffold(root: string, scaffoldPath: string): Promise<LoadedScaffold> {
  const resolvedScaffoldPath = resolveRepoPath(root, scaffoldPath)
  const scaffold = await readJsonSafe<JsonRecord>(resolvedScaffoldPath)
  if (!scaffold.ok) {
    throw new Error(`Unable to read Hook script scaffold from ${scaffoldPath}: ${scaffold.error}`)
  }
  return {
    scaffold: scaffold.value,
    sourceHookScriptScaffold: relativePath(root, resolvedScaffoldPath),
    resolvedScaffoldPath,
  }
}

function validateScaffold(scaffold: JsonRecord): HookScriptTemplateFinding[] {
  const findings: HookScriptTemplateFinding[] = []
  expectField(scaffold, findings, 'scaffold.artifactRole', 'artifactRole', 'devview-hook-script-scaffold-preview')
  expectField(scaffold, findings, 'scaffold.status', 'status', 'devview-hook-script-scaffold-preview-generated')
  expectField(scaffold, findings, 'scaffold.hookScriptsInstalled', 'hookScriptsInstalled', false)
  expectField(scaffold, findings, 'scaffold.hookGatewayActive', 'hookGatewayActive', 'not-checked-preview-only')
  expectField(scaffold, findings, 'scaffold.strictModeEnabled', 'strictModeEnabled', false)
  expectField(scaffold, findings, 'scaffold.guidedEnforcementEnabled', 'guidedEnforcementEnabled', false)
  expectField(
    scaffold,
    findings,
    'scaffold.actualBlockingHookBehaviorImplemented',
    'actualBlockingHookBehaviorImplemented',
    false,
  )
  validateUnsafeSignals('scaffold', scaffold, findings)

  const templates = arrayRecords(scaffold.scaffoldTemplates)
  const expectedEvents = ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop']
  for (const event of expectedEvents) {
    if (!templates.some((template) => stringValue(template.hookEvent) === event)) {
      findings.push({
        code: 'HOOK_SCRIPT_TEMPLATE_PREVIEW_MISSING_SCAFFOLD_EVENT',
        severity: 'error',
        field: 'scaffold.scaffoldTemplates',
        message: `Hook script scaffold is missing ${event}.`,
        expected: event,
      })
    }
  }
  return findings
}

function expectField(
  record: JsonRecord,
  findings: HookScriptTemplateFinding[],
  displayField: string,
  field: string,
  expected: unknown,
): void {
  if (record[field] !== expected) {
    findings.push({
      code: 'HOOK_SCRIPT_TEMPLATE_PREVIEW_INPUT_PREREQUISITE_MISMATCH',
      severity: 'error',
      field: displayField,
      message: `Hook script template input field "${displayField}" has an unsafe or unexpected value.`,
      expected,
      actual: record[field],
      suggestedFix: 'Regenerate the Hook script scaffold preview before materializing template bodies.',
    })
  }
}

function validateUnsafeSignals(label: string, record: JsonRecord, findings: HookScriptTemplateFinding[]): void {
  const unsafeFalseFields = [
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
        code: 'HOOK_SCRIPT_TEMPLATE_PREVIEW_UNSAFE_AUTHORITY_SIGNAL',
        severity: 'error',
        field: `${label}.${field}`,
        message: `Hook script template input "${label}" claims unsafe authority "${field}".`,
        expected: false,
        actual: true,
        suggestedFix: 'Use only preview/non-enforcing scaffolds as template preview sources.',
      })
    }
  }
  if (record.approvalStatus && record.approvalStatus !== 'not-approved') {
    findings.push({
      code: 'HOOK_SCRIPT_TEMPLATE_PREVIEW_UNSAFE_APPROVAL_SIGNAL',
      severity: 'error',
      field: `${label}.approvalStatus`,
      message: `Hook script template input "${label}" claims approval status.`,
      expected: 'not-approved',
      actual: record.approvalStatus,
    })
  }
}

function buildMaterializedTemplates(scaffold: JsonRecord): MaterializedHookScriptTemplatePreview[] {
  return arrayRecords(scaffold.scaffoldTemplates).map((template) => {
    const event = stringValue(template.hookEvent)
    const scriptPath = stringValue(template.scriptPathCandidate)
    return {
      hookEvent: event,
      candidateFileName: path.basename(scriptPath) || `${event}.ps1`,
      sourceScriptPathCandidate: scriptPath,
      installStatus: 'not-installed-preview-only',
      activeStatus: 'not-active-preview-only',
      scriptLanguage: 'powershell-preview',
      mutationPolicy: 'no-mutation-no-blocking-preview',
      scriptBodyLines: buildScriptBody(event),
    }
  })
}

function buildScriptBody(event: string): string[] {
  const common = [
    '# DevView hook template preview only.',
    '# Not installed. Not active. Non-enforcing advisory behavior only.',
    '$ErrorActionPreference = "Stop"',
    '$devviewMode = "advisory"',
    '$strictModeEnabled = $false',
    '$guidedEnforcementEnabled = $false',
    '$blockingEnabled = $false',
    '$codexExecutionTriggered = $false',
  ]
  const endings = ['Write-Output "DevView advisory hook preview completed without mutation or blocking."', 'exit 0']
  if (event === 'UserPromptSubmit') {
    return [
      ...common,
      '$contextPreviewPath = $env:DEVVIEW_USER_PROMPT_CONTEXT_PREVIEW',
      'if ($contextPreviewPath -and (Test-Path -LiteralPath $contextPreviewPath)) {',
      '  Write-Output "DevView additionalContext preview is available for advisory use."',
      '} else {',
      '  Write-Output "DevView additionalContext preview path is not configured."',
      '}',
      '# Do not generate Request IR, run graph traversal, execute Codex, or claim approval here.',
      ...endings,
    ]
  }
  if (event === 'PreToolUse') {
    return [
      ...common,
      'Write-Output "DevView PreToolUse advisory preview: remind caller to compare tool use with allowed/forbidden scope."',
      '# Do not block tools or enforce scope in this preview.',
      ...endings,
    ]
  }
  if (event === 'PostToolUse') {
    return [
      ...common,
      'Write-Output "DevView PostToolUse advisory preview: observations may be reviewed later by report-only checks."',
      '# Do not mutate graph-source, satisfy Evidence, or record human decisions here.',
      ...endings,
    ]
  }
  if (event === 'Stop') {
    return [
      ...common,
      'Write-Output "DevView Stop advisory preview: run check/report/proposal/review commands manually if needed."',
      '# Do not approve work, apply graph deltas, or enable CI enforcement here.',
      ...endings,
    ]
  }
  return [
    ...common,
    'Write-Output "DevView SessionStart advisory preview: report readiness only."',
    '# Do not trust repositories, install hooks, or mutate configuration here.',
    ...endings,
  ]
}

async function assertHookScriptTemplateOutputAuthority(
  root: string,
  input: LoadedScaffold,
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
      `Hook script template preview output is unsafe: --output and --markdown resolve to the same path (${requestedTargets[0].requestedPath}).`,
    )
  }

  const protectedPaths = buildProtectedOutputPathMap(root, input)
  for (const target of requestedTargets) {
    const normalizedTarget = relativePath(root, target.resolvedPath)
    if (isActiveHookLocation(normalizedTarget)) {
      throw new Error(
        `Hook script template preview ${target.kind} path is unsafe: ${target.requestedPath} targets an active hook/config location.`,
      )
    }
    const protectedReason = protectedPaths.get(pathKey(target.resolvedPath))
    if (protectedReason) {
      throw new Error(
        `Hook script template preview ${target.kind} path is unsafe: ${target.requestedPath} would overwrite ${protectedReason}.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(target.resolvedPath)
    if (existingAuthority) {
      throw new Error(
        `Hook script template preview ${target.kind} path is unsafe: ${target.requestedPath} already contains ${existingAuthority}. Choose a dedicated preview output path.`,
      )
    }
  }
}

function buildProtectedOutputPathMap(root: string, input: LoadedScaffold): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  protectedPaths.set(pathKey(input.resolvedScaffoldPath), 'the source Hook script scaffold preview')
  for (const candidatePath of collectConcretePathStrings(input.scaffold)) {
    const key = pathKey(resolveRepoPath(root, candidatePath))
    if (!protectedPaths.has(key)) {
      protectedPaths.set(key, `linked source artifact ${candidatePath}`)
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
    [
      'devview-hook-script-scaffold-preview',
      'devview-codex-hook-gateway-boundary-preview',
      'devview-hook-gateway-health-boundary-preview',
      'devview-hook-install-trust-boundary-preview',
      'devview-user-prompt-submit-context-preview',
      'instruction-pack',
      'contract-compiler-input',
      'selected-graph-slice',
      'graph-traversal-plan',
      'request-ir-graph-aware-validation',
    ].includes(artifactRole)
  ) {
    return `selected/source artifactRole "${artifactRole}"`
  }
  if (asRecord(record.sourceRecords)) {
    return 'graph-source-shaped sourceRecords'
  }
  if (asRecord(record.taxonomy) && (Array.isArray(record.nodes) || Array.isArray(record.edges))) {
    return 'generated read-model source-authority projection'
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
  return path.resolve(root, candidatePath)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}
