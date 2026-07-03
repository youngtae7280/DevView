import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import type { IssueSeverity } from './types.js'

const GENERATOR_NAME = 'HookScriptScaffoldPreviewGenerator'

type JsonRecord = Record<string, unknown>

export interface HookScriptScaffoldFinding {
  code: string
  severity: IssueSeverity
  field?: string
  message: string
  expected?: unknown
  actual?: unknown
  suggestedFix?: string
}

export interface HookScriptTemplatePreview {
  hookEvent: 'SessionStart' | 'UserPromptSubmit' | 'PreToolUse' | 'PostToolUse' | 'Stop'
  templateRole: string
  installStatus: 'not-installed-preview-only'
  activeStatus: 'not-active-preview-only'
  enforcementStatus: 'non-enforcing-advisory-only'
  scriptPathCandidate: string
  behaviorSummary: string
  forbiddenBehavior: string[]
}

export interface HookScriptScaffoldPreview {
  schemaVersion: 1
  artifactRole: 'devview-hook-script-scaffold-preview'
  status: 'devview-hook-script-scaffold-preview-generated' | 'devview-hook-script-scaffold-preview-blocked'
  generatorName: typeof GENERATOR_NAME
  scaffoldScope: 'hook-script-template-preview-no-install'
  sourceHookGatewayBoundary: string
  sourceHookGatewayHealthBoundary: string
  sourceHookInstallTrustBoundary: string
  sourceUserPromptSubmitContextPreview: string
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
  additionalContextInjectionReady: boolean
  scaffoldTemplates: HookScriptTemplatePreview[]
  installCandidates: JsonRecord[]
  trustPrerequisites: JsonRecord[]
  disallowedMutations: string[]
  validationFindings: HookScriptScaffoldFinding[]
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  markdownReportPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-preview-output-not-source-authority'
  markdownReportAuthorityStatus: 'not-written' | 'explicit-preview-output-not-source-authority'
  nonExecutionBoundary: string
}

export interface HookScriptScaffoldFileResult {
  scaffold: HookScriptScaffoldPreview
  outputPath?: string
  markdownReport?: string
}

interface LoadedInputs {
  hookGatewayBoundary: JsonRecord
  hookGatewayHealthBoundary: JsonRecord
  hookInstallTrustBoundary: JsonRecord
  userPromptContext: JsonRecord
  sourceHookGatewayBoundary: string
  sourceHookGatewayHealthBoundary: string
  sourceHookInstallTrustBoundary: string
  sourceUserPromptSubmitContextPreview: string
  resolvedHookGatewayBoundaryPath: string
  resolvedHookGatewayHealthBoundaryPath: string
  resolvedHookInstallTrustBoundaryPath: string
  resolvedUserPromptContextPath: string
}

export async function generateHookScriptScaffoldFile(
  root: string,
  options: {
    boundary: string
    hookHealth: string
    installTrust: string
    userPromptContext: string
    output?: string
    markdown?: string
  },
): Promise<HookScriptScaffoldFileResult> {
  const loaded = await loadInputs(root, options)
  await assertHookScriptScaffoldOutputAuthority(root, loaded, options)
  const scaffold = buildHookScriptScaffoldPreview(loaded)

  let outputPath: string | undefined
  let markdownReport: string | undefined
  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    scaffold.writtenOutputPath = outputPath
    scaffold.writtenOutputPathAuthorityStatus = 'explicit-preview-output-not-source-authority'
    await writeJsonAtomic(resolvedOutputPath, scaffold)
  }
  if (options.markdown) {
    const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
    markdownReport = relativePath(root, resolvedMarkdownPath)
    scaffold.markdownReportPath = markdownReport
    scaffold.markdownReportAuthorityStatus = 'explicit-preview-output-not-source-authority'
    await writeTextAtomic(resolvedMarkdownPath, renderHookScriptScaffoldMarkdown(scaffold))
    if (options.output && outputPath) {
      await writeJsonAtomic(resolveRepoPath(root, options.output), scaffold)
    }
  }
  return { scaffold, ...(outputPath ? { outputPath } : {}), ...(markdownReport ? { markdownReport } : {}) }
}

function buildHookScriptScaffoldPreview(inputs: LoadedInputs): HookScriptScaffoldPreview {
  const findings = validateInputs(inputs)
  const blocked = findings.some((finding) => finding.severity === 'error')
  return {
    schemaVersion: 1,
    artifactRole: 'devview-hook-script-scaffold-preview',
    status: blocked ? 'devview-hook-script-scaffold-preview-blocked' : 'devview-hook-script-scaffold-preview-generated',
    generatorName: GENERATOR_NAME,
    scaffoldScope: 'hook-script-template-preview-no-install',
    sourceHookGatewayBoundary: inputs.sourceHookGatewayBoundary,
    sourceHookGatewayHealthBoundary: inputs.sourceHookGatewayHealthBoundary,
    sourceHookInstallTrustBoundary: inputs.sourceHookInstallTrustBoundary,
    sourceUserPromptSubmitContextPreview: inputs.sourceUserPromptSubmitContextPreview,
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
    additionalContextInjectionReady: !blocked && inputs.userPromptContext.additionalContextInjectionReady === true,
    scaffoldTemplates: buildHookTemplates(),
    installCandidates: arrayRecords(inputs.hookInstallTrustBoundary.installScopeCandidates),
    trustPrerequisites: arrayRecords(inputs.hookInstallTrustBoundary.trustPrerequisites),
    disallowedMutations: [
      'global-codex-config-mutation',
      'hidden-hook-install',
      'automatic-trust-acceptance',
      'active-hook-config-write',
      'strict-or-guided-blocking-activation',
      'codex-execution-trigger',
      'graph-source-mutation',
      'graph-delta-apply',
      'approval-or-human-decision-automation',
      'runtime-evidence-satisfaction',
      'equivalence-proof',
      'scope-or-ci-enforcement',
    ],
    validationFindings: findings,
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    markdownReportPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportAuthorityStatus: 'not-written',
    nonExecutionBoundary:
      'This Hook Gateway script scaffold is a preview of future repo-local hook templates only. It does not write hook scripts to active locations, install hooks, trust repositories, configure Codex, block Codex execution, call an LLM, make network calls, mutate graph-source, apply graph deltas, approve work, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
  }
}

export function renderHookScriptScaffoldMarkdown(scaffold: HookScriptScaffoldPreview): string {
  return [
    '# DevView Hook Script Scaffold Preview',
    '',
    `Status: ${scaffold.status}`,
    '',
    '## Boundary',
    '',
    '- Mode: advisory preview.',
    '- Install status: not installed.',
    '- Active status: not active.',
    '- Strict and guided blocking are disabled.',
    '- This preview must not be copied into active hook locations by an automated command.',
    '',
    '## Hook Templates',
    '',
    ...scaffold.scaffoldTemplates.flatMap((template) => [
      `### ${template.hookEvent}`,
      '',
      `- Role: ${template.templateRole}`,
      `- Candidate path: \`${template.scriptPathCandidate}\``,
      `- Behavior: ${template.behaviorSummary}`,
      `- Enforcement: ${template.enforcementStatus}`,
      '',
    ]),
    '## Disallowed Mutations',
    '',
    ...scaffold.disallowedMutations.map((entry) => `- ${entry}`),
    '',
    '## Non-execution Statement',
    '',
    scaffold.nonExecutionBoundary,
    '',
  ].join('\n')
}

async function loadInputs(
  root: string,
  options: {
    boundary: string
    hookHealth: string
    installTrust: string
    userPromptContext: string
  },
): Promise<LoadedInputs> {
  const resolvedHookGatewayBoundaryPath = resolveRepoPath(root, options.boundary)
  const resolvedHookGatewayHealthBoundaryPath = resolveRepoPath(root, options.hookHealth)
  const resolvedHookInstallTrustBoundaryPath = resolveRepoPath(root, options.installTrust)
  const resolvedUserPromptContextPath = resolveRepoPath(root, options.userPromptContext)

  const hookGatewayBoundary = await readJsonSafe<JsonRecord>(resolvedHookGatewayBoundaryPath)
  if (!hookGatewayBoundary.ok) {
    throw new Error(`Unable to read Hook Gateway boundary from ${options.boundary}: ${hookGatewayBoundary.error}`)
  }
  const hookGatewayHealthBoundary = await readJsonSafe<JsonRecord>(resolvedHookGatewayHealthBoundaryPath)
  if (!hookGatewayHealthBoundary.ok) {
    throw new Error(
      `Unable to read Hook Gateway health boundary from ${options.hookHealth}: ${hookGatewayHealthBoundary.error}`,
    )
  }
  const hookInstallTrustBoundary = await readJsonSafe<JsonRecord>(resolvedHookInstallTrustBoundaryPath)
  if (!hookInstallTrustBoundary.ok) {
    throw new Error(
      `Unable to read Hook install/trust boundary from ${options.installTrust}: ${hookInstallTrustBoundary.error}`,
    )
  }
  const userPromptContext = await readJsonSafe<JsonRecord>(resolvedUserPromptContextPath)
  if (!userPromptContext.ok) {
    throw new Error(
      `Unable to read UserPromptSubmit context preview from ${options.userPromptContext}: ${userPromptContext.error}`,
    )
  }

  return {
    hookGatewayBoundary: hookGatewayBoundary.value,
    hookGatewayHealthBoundary: hookGatewayHealthBoundary.value,
    hookInstallTrustBoundary: hookInstallTrustBoundary.value,
    userPromptContext: userPromptContext.value,
    sourceHookGatewayBoundary: relativePath(root, resolvedHookGatewayBoundaryPath),
    sourceHookGatewayHealthBoundary: relativePath(root, resolvedHookGatewayHealthBoundaryPath),
    sourceHookInstallTrustBoundary: relativePath(root, resolvedHookInstallTrustBoundaryPath),
    sourceUserPromptSubmitContextPreview: relativePath(root, resolvedUserPromptContextPath),
    resolvedHookGatewayBoundaryPath,
    resolvedHookGatewayHealthBoundaryPath,
    resolvedHookInstallTrustBoundaryPath,
    resolvedUserPromptContextPath,
  }
}

function validateInputs(inputs: LoadedInputs): HookScriptScaffoldFinding[] {
  const findings: HookScriptScaffoldFinding[] = []
  expectField(
    inputs.hookGatewayBoundary,
    findings,
    'hookGatewayBoundary.artifactRole',
    'artifactRole',
    'devview-codex-hook-gateway-boundary-preview',
  )
  expectField(
    inputs.hookGatewayHealthBoundary,
    findings,
    'hookGatewayHealthBoundary.artifactRole',
    'artifactRole',
    'devview-hook-gateway-health-boundary-preview',
  )
  expectField(
    inputs.hookGatewayHealthBoundary,
    findings,
    'hookGatewayHealthBoundary.status',
    'status',
    'devview-hook-gateway-health-boundary-previewed',
  )
  expectField(
    inputs.hookInstallTrustBoundary,
    findings,
    'hookInstallTrustBoundary.artifactRole',
    'artifactRole',
    'devview-hook-install-trust-boundary-preview',
  )
  expectField(
    inputs.hookInstallTrustBoundary,
    findings,
    'hookInstallTrustBoundary.status',
    'status',
    'devview-hook-install-trust-boundary-previewed',
  )
  expectField(
    inputs.userPromptContext,
    findings,
    'userPromptContext.artifactRole',
    'artifactRole',
    'devview-user-prompt-submit-context-preview',
  )
  expectField(
    inputs.userPromptContext,
    findings,
    'userPromptContext.status',
    'status',
    'user-prompt-submit-context-preview-generated',
  )
  expectField(
    inputs.userPromptContext,
    findings,
    'userPromptContext.additionalContextInjectionReady',
    'additionalContextInjectionReady',
    true,
  )

  for (const [label, record] of [
    ['hookGatewayBoundary', inputs.hookGatewayBoundary],
    ['hookGatewayHealthBoundary', inputs.hookGatewayHealthBoundary],
    ['hookInstallTrustBoundary', inputs.hookInstallTrustBoundary],
    ['userPromptContext', inputs.userPromptContext],
  ] as Array<[string, JsonRecord]>) {
    validateUnsafeSignals(label, record, findings)
  }

  return findings
}

function expectField(
  record: JsonRecord,
  findings: HookScriptScaffoldFinding[],
  displayField: string,
  field: string,
  expected: unknown,
): void {
  if (record[field] !== expected) {
    findings.push({
      code: 'HOOK_SCRIPT_SCAFFOLD_INPUT_PREREQUISITE_MISMATCH',
      severity: 'error',
      field: displayField,
      message: `Hook script scaffold input field "${displayField}" has an unsafe or unexpected value.`,
      expected,
      actual: record[field],
      suggestedFix: 'Regenerate Hook Gateway boundary, health, install/trust, and UserPromptSubmit context previews.',
    })
  }
}

function validateUnsafeSignals(label: string, record: JsonRecord, findings: HookScriptScaffoldFinding[]): void {
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
        code: 'HOOK_SCRIPT_SCAFFOLD_UNSAFE_AUTHORITY_SIGNAL',
        severity: 'error',
        field: `${label}.${field}`,
        message: `Hook script scaffold input "${label}" claims unsafe authority "${field}".`,
        expected: false,
        actual: true,
        suggestedFix: 'Use only preview/non-enforcing artifacts as hook scaffold sources.',
      })
    }
  }
  if (record.approvalStatus && record.approvalStatus !== 'not-approved') {
    findings.push({
      code: 'HOOK_SCRIPT_SCAFFOLD_UNSAFE_APPROVAL_SIGNAL',
      severity: 'error',
      field: `${label}.approvalStatus`,
      message: `Hook script scaffold input "${label}" claims approval status.`,
      expected: 'not-approved',
      actual: record.approvalStatus,
    })
  }
}

function buildHookTemplates(): HookScriptTemplatePreview[] {
  return [
    {
      hookEvent: 'SessionStart',
      templateRole: 'read DevView mode and report advisory readiness only',
      installStatus: 'not-installed-preview-only',
      activeStatus: 'not-active-preview-only',
      enforcementStatus: 'non-enforcing-advisory-only',
      scriptPathCandidate: '.codex/hooks/devview-session-start.ps1',
      behaviorSummary: 'Would report DevView advisory readiness if explicitly installed in the future.',
      forbiddenBehavior: ['block session start', 'trust repo automatically', 'mutate config'],
    },
    {
      hookEvent: 'UserPromptSubmit',
      templateRole: 'attach generated DevView additionalContext preview',
      installStatus: 'not-installed-preview-only',
      activeStatus: 'not-active-preview-only',
      enforcementStatus: 'non-enforcing-advisory-only',
      scriptPathCandidate: '.codex/hooks/devview-user-prompt-submit.ps1',
      behaviorSummary: 'Would provide the prepared UserPromptSubmit context as advisory additionalContext.',
      forbiddenBehavior: ['execute Codex', 'generate Request IR without validation', 'claim approval'],
    },
    {
      hookEvent: 'PreToolUse',
      templateRole: 'future advisory scope reminder before tool use',
      installStatus: 'not-installed-preview-only',
      activeStatus: 'not-active-preview-only',
      enforcementStatus: 'non-enforcing-advisory-only',
      scriptPathCandidate: '.codex/hooks/devview-pre-tool-use.ps1',
      behaviorSummary: 'Would summarize allowed and forbidden scope without blocking tool use.',
      forbiddenBehavior: ['block tools', 'enforce scope', 'mutate graph-source'],
    },
    {
      hookEvent: 'PostToolUse',
      templateRole: 'future advisory changed-output observation',
      installStatus: 'not-installed-preview-only',
      activeStatus: 'not-active-preview-only',
      enforcementStatus: 'non-enforcing-advisory-only',
      scriptPathCandidate: '.codex/hooks/devview-post-tool-use.ps1',
      behaviorSummary: 'Would record advisory observations for later report-only checks.',
      forbiddenBehavior: ['apply graph deltas', 'record human decision', 'satisfy Evidence'],
    },
    {
      hookEvent: 'Stop',
      templateRole: 'future advisory post-run reminder',
      installStatus: 'not-installed-preview-only',
      activeStatus: 'not-active-preview-only',
      enforcementStatus: 'non-enforcing-advisory-only',
      scriptPathCandidate: '.codex/hooks/devview-stop.ps1',
      behaviorSummary: 'Would remind the session to run report/proposal/review packet commands.',
      forbiddenBehavior: ['approve output', 'apply graph deltas', 'enable CI enforcement'],
    },
  ]
}

async function assertHookScriptScaffoldOutputAuthority(
  root: string,
  inputs: LoadedInputs,
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
      `Hook script scaffold output is unsafe: --output and --markdown resolve to the same path (${requestedTargets[0].requestedPath}).`,
    )
  }

  const protectedPaths = buildProtectedOutputPathMap(root, inputs)
  for (const target of requestedTargets) {
    const normalizedTarget = relativePath(root, target.resolvedPath)
    if (isActiveHookLocation(normalizedTarget)) {
      throw new Error(
        `Hook script scaffold ${target.kind} path is unsafe: ${target.requestedPath} targets an active hook/config location.`,
      )
    }
    const protectedReason = protectedPaths.get(pathKey(target.resolvedPath))
    if (protectedReason) {
      throw new Error(
        `Hook script scaffold ${target.kind} path is unsafe: ${target.requestedPath} would overwrite ${protectedReason}.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(target.resolvedPath)
    if (existingAuthority) {
      throw new Error(
        `Hook script scaffold ${target.kind} path is unsafe: ${target.requestedPath} already contains ${existingAuthority}. Choose a dedicated preview output path.`,
      )
    }
  }
}

function buildProtectedOutputPathMap(root: string, inputs: LoadedInputs): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const addResolved = (candidate: string, reason: string): void => {
    protectedPaths.set(pathKey(candidate), reason)
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

  addResolved(inputs.resolvedHookGatewayBoundaryPath, 'the source Hook Gateway boundary')
  addResolved(inputs.resolvedHookGatewayHealthBoundaryPath, 'the source Hook Gateway health boundary')
  addResolved(inputs.resolvedHookInstallTrustBoundaryPath, 'the source Hook install/trust boundary')
  addResolved(inputs.resolvedUserPromptContextPath, 'the source UserPromptSubmit context preview')

  for (const record of [
    inputs.hookGatewayBoundary,
    inputs.hookGatewayHealthBoundary,
    inputs.hookInstallTrustBoundary,
    inputs.userPromptContext,
  ]) {
    for (const candidatePath of collectConcretePathStrings(record)) {
      add(candidatePath, `linked source artifact ${candidatePath}`)
    }
  }
  for (const template of buildHookTemplates()) {
    add(template.scriptPathCandidate, `active hook script candidate ${template.scriptPathCandidate}`)
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
      'devview-codex-hook-gateway-boundary-preview',
      'devview-hook-gateway-health-boundary-preview',
      'devview-hook-install-trust-boundary-preview',
      'devview-user-prompt-submit-context-preview',
      'devview-frontend-chain-report',
      'instruction-pack',
      'contract-compiler-input',
      'selected-graph-slice',
      'graph-traversal-plan',
      'request-ir-graph-aware-validation',
      'request-ir-candidate-schema-only-validation',
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
    /\.(json|md|txt|ps1|sh|js|ts|yaml|yml)$/i.test(normalized)
  )
}

function isActiveHookLocation(candidatePath: string): boolean {
  const normalized = candidatePath.replaceAll('\\', '/').toLowerCase()
  return normalized.startsWith('.codex/hooks/') || normalized === '.codex/config.json'
}

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as JsonRecord
}

function arrayRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.map((entry) => asRecord(entry)).filter((entry): entry is JsonRecord => Boolean(entry))
    : []
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values))
}

function resolveRepoPath(root: string, candidatePath: string): string {
  return path.resolve(root, candidatePath)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}
