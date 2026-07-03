import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import type { IssueSeverity } from './types.js'

const GENERATOR_NAME = 'HookScriptBundleMaterializer'
const REQUIRED_HOOK_EVENTS = ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop']
const DEFAULT_BUNDLE_DIR = '.tmp/devview-hook-script-bundle'

type JsonRecord = Record<string, unknown>

export interface HookScriptBundleFinding {
  code: string
  severity: IssueSeverity
  field?: string
  message: string
  expected?: unknown
  actual?: unknown
  suggestedFix?: string
}

export interface HookScriptBundleFileEntry {
  hookEvent: string
  fileName: string
  materializedPath: string
  sourceScriptPathCandidate: string
  scriptLanguage: 'powershell-preview'
  installStatus: 'not-installed-preview-only'
  activeStatus: 'not-active-preview-only'
  enforcementStatus: 'non-enforcing-advisory-only'
  sha256: string
  byteLength: number
}

export interface HookScriptBundlePreview {
  schemaVersion: 1
  artifactRole: 'devview-hook-script-bundle-preview'
  status: 'devview-hook-script-bundle-materialized-preview' | 'devview-hook-script-bundle-blocked'
  generatorName: typeof GENERATOR_NAME
  bundleScope: 'repo-local-advisory-script-files-no-install'
  sourceHookScriptTemplatePreview: string
  sourceHookSessionManifest: string
  bundleDir: string
  devviewMode: 'advisory'
  actualHookScriptsMaterialized: boolean
  hookScriptsImplemented: false
  hookScriptsInstalled: false
  hookGatewayConfigured: 'not-checked-preview-only'
  hookGatewayTrusted: 'not-checked-preview-only'
  hookGatewayActive: 'not-checked-preview-only'
  activeHookSessionStarted: false
  installTrustDecisionImplemented: false
  actualInstallOrTrustMutationImplemented: false
  strictModeEnabled: false
  guidedEnforcementEnabled: false
  actualBlockingHookBehaviorImplemented: false
  preToolUseBlockingEnabled: false
  codexExecutionTriggered: false
  graphSourceMutated: false
  graphDeltaApplied: false
  approvalStatus: 'not-approved'
  humanDecisionRecorded: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  requiredChecksConfigured: false
  branchProtectionChanged: false
  diffRejectionEnabled: false
  humanReviewRequired: true
  nonEnforcing: true
  runtimeBudgetEnforced: false
  materializedScripts: HookScriptBundleFileEntry[]
  validationFindings: HookScriptBundleFinding[]
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  markdownReportPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-preview-output-not-source-authority'
  markdownReportAuthorityStatus: 'not-written' | 'explicit-preview-output-not-source-authority'
  nonExecutionBoundary: string
}

export interface HookScriptBundleFileResult {
  bundle: HookScriptBundlePreview
  outputPath?: string
  markdownReport?: string
}

interface LoadedInputs {
  scriptTemplates: JsonRecord
  sessionManifest: JsonRecord
  sourceHookScriptTemplatePreview: string
  sourceHookSessionManifest: string
  resolvedScriptTemplatesPath: string
  resolvedSessionManifestPath: string
}

interface PendingScript {
  hookEvent: string
  fileName: string
  resolvedPath: string
  materializedPath: string
  sourceScriptPathCandidate: string
  text: string
}

export async function materializeHookScriptBundleFile(
  root: string,
  options: {
    scriptTemplates: string
    sessionManifest: string
    bundleDir?: string
    output?: string
    markdown?: string
  },
): Promise<HookScriptBundleFileResult> {
  const loaded = await loadInputs(root, options)
  const resolvedBundleDir = resolveRepoPath(root, options.bundleDir ?? DEFAULT_BUNDLE_DIR)
  await assertHookScriptBundleOutputAuthority(root, loaded, { ...options, resolvedBundleDir })
  const pendingScripts = buildPendingScripts(root, resolvedBundleDir, loaded.scriptTemplates)
  const bundle = buildHookScriptBundlePreview(root, loaded, resolvedBundleDir, pendingScripts)

  if (bundle.status === 'devview-hook-script-bundle-materialized-preview') {
    for (const script of pendingScripts) {
      await mkdir(path.dirname(script.resolvedPath), { recursive: true })
      await writeFile(script.resolvedPath, script.text, 'utf8')
    }
  }

  let outputPath: string | undefined
  let markdownReport: string | undefined
  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    bundle.writtenOutputPath = outputPath
    bundle.writtenOutputPathAuthorityStatus = 'explicit-preview-output-not-source-authority'
    await writeJsonAtomic(resolvedOutputPath, bundle)
  }
  if (options.markdown) {
    const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
    markdownReport = relativePath(root, resolvedMarkdownPath)
    bundle.markdownReportPath = markdownReport
    bundle.markdownReportAuthorityStatus = 'explicit-preview-output-not-source-authority'
    await writeTextAtomic(resolvedMarkdownPath, renderHookScriptBundleMarkdown(bundle))
    if (options.output && outputPath) {
      await writeJsonAtomic(resolveRepoPath(root, options.output), bundle)
    }
  }

  return { bundle, ...(outputPath ? { outputPath } : {}), ...(markdownReport ? { markdownReport } : {}) }
}

function buildHookScriptBundlePreview(
  root: string,
  input: LoadedInputs,
  resolvedBundleDir: string,
  pendingScripts: PendingScript[],
): HookScriptBundlePreview {
  const findings = validateInputs(input)
  const blocked = findings.some((finding) => finding.severity === 'error')
  return {
    schemaVersion: 1,
    artifactRole: 'devview-hook-script-bundle-preview',
    status: blocked ? 'devview-hook-script-bundle-blocked' : 'devview-hook-script-bundle-materialized-preview',
    generatorName: GENERATOR_NAME,
    bundleScope: 'repo-local-advisory-script-files-no-install',
    sourceHookScriptTemplatePreview: input.sourceHookScriptTemplatePreview,
    sourceHookSessionManifest: input.sourceHookSessionManifest,
    bundleDir: relativePath(root, resolvedBundleDir),
    devviewMode: 'advisory',
    actualHookScriptsMaterialized: !blocked,
    hookScriptsImplemented: false,
    hookScriptsInstalled: false,
    hookGatewayConfigured: 'not-checked-preview-only',
    hookGatewayTrusted: 'not-checked-preview-only',
    hookGatewayActive: 'not-checked-preview-only',
    activeHookSessionStarted: false,
    installTrustDecisionImplemented: false,
    actualInstallOrTrustMutationImplemented: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    actualBlockingHookBehaviorImplemented: false,
    preToolUseBlockingEnabled: false,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    requiredChecksConfigured: false,
    branchProtectionChanged: false,
    diffRejectionEnabled: false,
    humanReviewRequired: true,
    nonEnforcing: true,
    runtimeBudgetEnforced: false,
    materializedScripts: blocked ? [] : pendingScripts.map((script) => toScriptEntry(script)),
    validationFindings: findings,
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    markdownReportPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportAuthorityStatus: 'not-written',
    nonExecutionBoundary:
      'This Hook Gateway script bundle writes repo-local advisory preview scripts only. It does not install hooks, mutate Codex configuration, trust repositories, start a hook session, block tool use, trigger Codex execution, call an LLM, make network calls, run validation or traversal, mutate graph-source, apply graph deltas, approve work, record human decisions, accept or satisfy Evidence, prove equivalence, enforce scope, configure CI, require checks, change branch protection, or reject diffs.',
  }
}

export function renderHookScriptBundleMarkdown(bundle: HookScriptBundlePreview): string {
  return [
    '# DevView Hook Script Bundle Preview',
    '',
    `Status: ${bundle.status}`,
    '',
    '## Boundary',
    '',
    `- Bundle dir: \`${bundle.bundleDir}\``,
    '- Install status: not installed.',
    '- Active status: not active.',
    '- Strict/guided blocking: disabled.',
    '- Scope/CI enforcement: disabled.',
    '- Graph mutation/apply, approval, Evidence acceptance/satisfaction, and equivalence proof remain disabled.',
    '',
    '## Scripts',
    '',
    ...bundle.materializedScripts.map(
      (script) => `- ${script.hookEvent}: \`${script.materializedPath}\` (${script.sha256})`,
    ),
    '',
    '## Non-execution Statement',
    '',
    bundle.nonExecutionBoundary,
    '',
  ].join('\n')
}

async function loadInputs(
  root: string,
  options: { scriptTemplates: string; sessionManifest: string },
): Promise<LoadedInputs> {
  const resolvedScriptTemplatesPath = resolveRepoPath(root, options.scriptTemplates)
  const resolvedSessionManifestPath = resolveRepoPath(root, options.sessionManifest)
  const scriptTemplates = await readJsonSafe<JsonRecord>(resolvedScriptTemplatesPath)
  if (!scriptTemplates.ok) {
    throw new Error(
      `Unable to read Hook script template preview from ${options.scriptTemplates}: ${scriptTemplates.error}`,
    )
  }
  const sessionManifest = await readJsonSafe<JsonRecord>(resolvedSessionManifestPath)
  if (!sessionManifest.ok) {
    throw new Error(`Unable to read Hook session manifest from ${options.sessionManifest}: ${sessionManifest.error}`)
  }
  return {
    scriptTemplates: scriptTemplates.value,
    sessionManifest: sessionManifest.value,
    sourceHookScriptTemplatePreview: relativePath(root, resolvedScriptTemplatesPath),
    sourceHookSessionManifest: relativePath(root, resolvedSessionManifestPath),
    resolvedScriptTemplatesPath,
    resolvedSessionManifestPath,
  }
}

function validateInputs(input: LoadedInputs): HookScriptBundleFinding[] {
  const findings: HookScriptBundleFinding[] = []
  expectField(
    input.scriptTemplates,
    findings,
    'scriptTemplates.artifactRole',
    'artifactRole',
    'devview-hook-script-template-preview',
  )
  expectField(
    input.scriptTemplates,
    findings,
    'scriptTemplates.status',
    'status',
    'devview-hook-script-template-preview-generated',
  )
  expectField(
    input.sessionManifest,
    findings,
    'sessionManifest.artifactRole',
    'artifactRole',
    'devview-hook-session-manifest-preview',
  )
  expectField(
    input.sessionManifest,
    findings,
    'sessionManifest.status',
    'status',
    'devview-hook-session-manifest-preview-generated',
  )
  expectField(
    input.sessionManifest,
    findings,
    'sessionManifest.sessionStatus',
    'sessionStatus',
    'not-started-preview-only',
  )
  expectField(input.sessionManifest, findings, 'sessionManifest.hooksActive', 'hooksActive', false)

  for (const [label, record] of [
    ['scriptTemplates', input.scriptTemplates],
    ['sessionManifest', input.sessionManifest],
  ] as Array<[string, JsonRecord]>) {
    validateUnsafeSignals(label, record, findings)
  }

  const templateEvents = arrayRecords(input.scriptTemplates.materializedTemplates).map((entry) =>
    stringValue(entry.hookEvent),
  )
  const sessionEvents = arrayRecords(input.sessionManifest.hookEventReadiness).map((entry) =>
    stringValue(entry.hookEvent),
  )
  for (const event of REQUIRED_HOOK_EVENTS) {
    if (!templateEvents.includes(event)) {
      findings.push({
        code: 'HOOK_SCRIPT_BUNDLE_MISSING_TEMPLATE_EVENT',
        severity: 'error',
        field: 'scriptTemplates.materializedTemplates',
        message: `Hook script bundle requires template body for ${event}.`,
        expected: event,
        actual: templateEvents,
      })
    }
    if (!sessionEvents.includes(event)) {
      findings.push({
        code: 'HOOK_SCRIPT_BUNDLE_MISSING_SESSION_EVENT',
        severity: 'error',
        field: 'sessionManifest.hookEventReadiness',
        message: `Hook script bundle requires session readiness for ${event}.`,
        expected: event,
        actual: sessionEvents,
      })
    }
  }
  return findings
}

function buildPendingScripts(root: string, resolvedBundleDir: string, templates: JsonRecord): PendingScript[] {
  const byEvent = new Map(
    arrayRecords(templates.materializedTemplates).map((entry) => [stringValue(entry.hookEvent), entry]),
  )
  return REQUIRED_HOOK_EVENTS.map((event) => {
    const template = byEvent.get(event) ?? {}
    const fileName = safeFileName(stringValue(template.candidateFileName) || `${event}.ps1`)
    const lines = Array.isArray(template.scriptBodyLines)
      ? template.scriptBodyLines.map((line) => String(line))
      : fallbackScriptBody(event)
    const text = `${lines.join('\n')}\n`
    const resolvedPath = path.join(resolvedBundleDir, fileName)
    return {
      hookEvent: event,
      fileName,
      resolvedPath,
      materializedPath: relativePath(root, resolvedPath),
      sourceScriptPathCandidate: stringValue(template.sourceScriptPathCandidate),
      text,
    }
  })
}

function fallbackScriptBody(event: string): string[] {
  return [
    '# DevView hook bundle fallback preview only.',
    '# Not installed. Not active. Non-enforcing advisory behavior only.',
    '$ErrorActionPreference = "Stop"',
    '$strictModeEnabled = $false',
    '$guidedEnforcementEnabled = $false',
    '$blockingEnabled = $false',
    `Write-Output "DevView ${event} advisory hook preview completed without mutation or blocking."`,
    'exit 0',
  ]
}

function toScriptEntry(script: PendingScript): HookScriptBundleFileEntry {
  const bytes = Buffer.from(script.text, 'utf8')
  return {
    hookEvent: script.hookEvent,
    fileName: script.fileName,
    materializedPath: script.materializedPath,
    sourceScriptPathCandidate: script.sourceScriptPathCandidate,
    scriptLanguage: 'powershell-preview',
    installStatus: 'not-installed-preview-only',
    activeStatus: 'not-active-preview-only',
    enforcementStatus: 'non-enforcing-advisory-only',
    sha256: createHash('sha256').update(bytes).digest('hex'),
    byteLength: bytes.byteLength,
  }
}

function expectField(
  record: JsonRecord,
  findings: HookScriptBundleFinding[],
  displayField: string,
  field: string,
  expected: unknown,
): void {
  if (record[field] !== expected) {
    findings.push({
      code: 'HOOK_SCRIPT_BUNDLE_INPUT_PREREQUISITE_MISMATCH',
      severity: 'error',
      field: displayField,
      message: `Hook script bundle input field "${displayField}" has an unsafe or unexpected value.`,
      expected,
      actual: record[field],
      suggestedFix: 'Regenerate Hook script templates and Hook session manifest previews.',
    })
  }
}

function validateUnsafeSignals(label: string, record: JsonRecord, findings: HookScriptBundleFinding[]): void {
  const unsafeFalseFields = [
    'hooksActive',
    'hookScriptsImplemented',
    'hookScriptsInstalled',
    'installTrustDecisionImplemented',
    'actualInstallOrTrustMutationImplemented',
    'strictModeEnabled',
    'guidedEnforcementEnabled',
    'actualBlockingHookBehaviorImplemented',
    'preToolUseBlockingEnabled',
    'codexExecutionTriggered',
    'graphSourceMutated',
    'graphDeltaApplied',
    'humanDecisionRecorded',
    'runtimeEvidenceSatisfied',
    'evidenceAccepted',
    'equivalenceProven',
    'scopeEnforced',
    'ciEnforcementEnabled',
    'requiredChecksConfigured',
    'branchProtectionChanged',
    'diffRejectionEnabled',
    'graphApplyEnabled',
    'approvalAutomationEnabled',
  ]
  for (const field of unsafeFalseFields) {
    if (record[field] === true) {
      findings.push({
        code: 'HOOK_SCRIPT_BUNDLE_UNSAFE_AUTHORITY_SIGNAL',
        severity: 'error',
        field: `${label}.${field}`,
        message: `Hook script bundle input "${label}" claims unsafe authority "${field}".`,
        expected: false,
        actual: true,
        suggestedFix: 'Use only preview/non-enforcing hook artifacts as bundle sources.',
      })
    }
  }
  if (record.approvalStatus && record.approvalStatus !== 'not-approved') {
    findings.push({
      code: 'HOOK_SCRIPT_BUNDLE_UNSAFE_APPROVAL_SIGNAL',
      severity: 'error',
      field: `${label}.approvalStatus`,
      message: `Hook script bundle input "${label}" claims approval status.`,
      expected: 'not-approved',
      actual: record.approvalStatus,
    })
  }
}

async function assertHookScriptBundleOutputAuthority(
  root: string,
  input: LoadedInputs,
  options: { output?: string; markdown?: string; resolvedBundleDir: string },
): Promise<void> {
  const targets = [
    ...(options.output
      ? [{ kind: 'output', requestedPath: options.output, resolvedPath: resolveRepoPath(root, options.output) }]
      : []),
    ...(options.markdown
      ? [{ kind: 'markdown', requestedPath: options.markdown, resolvedPath: resolveRepoPath(root, options.markdown) }]
      : []),
  ]
  if (targets.length === 2 && pathKey(targets[0].resolvedPath) === pathKey(targets[1].resolvedPath)) {
    throw new Error(
      `Hook script bundle output is unsafe: --output and --markdown resolve to the same path (${targets[0].requestedPath}).`,
    )
  }

  const protectedPaths = buildProtectedOutputPathMap(root, input)
  for (const target of targets) {
    const normalizedTarget = relativePath(root, target.resolvedPath)
    if (isActiveHookLocation(normalizedTarget)) {
      throw new Error(
        `Hook script bundle ${target.kind} path is unsafe: ${target.requestedPath} targets an active hook/config location.`,
      )
    }
    const protectedReason = protectedPaths.get(pathKey(target.resolvedPath))
    if (protectedReason) {
      throw new Error(
        `Hook script bundle ${target.kind} path is unsafe: ${target.requestedPath} would overwrite ${protectedReason}.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(target.resolvedPath)
    if (existingAuthority) {
      throw new Error(
        `Hook script bundle ${target.kind} path is unsafe: ${target.requestedPath} already contains ${existingAuthority}. Choose a dedicated preview output path.`,
      )
    }
  }

  const bundleDirRelative = relativePath(root, options.resolvedBundleDir)
  if (isActiveHookLocation(bundleDirRelative) || isUnsafeBundleDir(bundleDirRelative)) {
    throw new Error(
      `Hook script bundle --bundle-dir is unsafe: ${bundleDirRelative} is an active, source, or managed location.`,
    )
  }
  for (const [protectedPath, reason] of protectedPaths.entries()) {
    if (isSameOrDescendant(protectedPath, pathKey(options.resolvedBundleDir))) {
      throw new Error(`Hook script bundle --bundle-dir is unsafe: it contains ${reason}.`)
    }
  }
}

function buildProtectedOutputPathMap(root: string, input: LoadedInputs): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  protectedPaths.set(pathKey(input.resolvedScriptTemplatesPath), 'the source Hook script template preview')
  protectedPaths.set(pathKey(input.resolvedSessionManifestPath), 'the source Hook session manifest preview')
  for (const record of [input.scriptTemplates, input.sessionManifest]) {
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
  if (artifactRole.includes('graph-source')) return `graph-source artifactRole "${artifactRole}"`
  if (
    [
      'devview-hook-script-template-preview',
      'devview-hook-session-manifest-preview',
      'devview-hook-activation-chain-report',
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
  if (asRecord(record.sourceRecords)) return 'graph-source-shaped sourceRecords'
  if (asRecord(record.taxonomy) && (Array.isArray(record.nodes) || Array.isArray(record.edges))) {
    return 'generated read-model source-authority projection'
  }
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

function isUnsafeBundleDir(candidatePath: string): boolean {
  const normalized = candidatePath.replaceAll('\\', '/').toLowerCase().replace(/\/+$/, '')
  return (
    normalized === '.git' ||
    normalized.startsWith('.git/') ||
    normalized === '.codex' ||
    normalized.startsWith('.codex/') ||
    normalized === 'examples/valid/todo-app-pbe-run/generated' ||
    normalized.startsWith('examples/valid/todo-app-pbe-run/generated/')
  )
}

function isSameOrDescendant(candidatePathKey: string, parentPathKey: string): boolean {
  return candidatePathKey === parentPathKey || candidatePathKey.startsWith(`${parentPathKey}/`)
}

function safeFileName(value: string): string {
  const baseName = path.basename(value).replace(/[^A-Za-z0-9._-]/g, '-')
  return baseName.endsWith('.ps1') ? baseName : `${baseName || 'devview-hook'}.ps1`
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
