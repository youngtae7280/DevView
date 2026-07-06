import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import type { IssueSeverity } from './types.js'

const REPORTER_NAME = 'DevViewBaselineReporter'
const REPORT_ROLE = 'devview-core-baseline-freeze-report'
const REPORT_STATUS = 'devview-core-baseline-freeze-report-generated'

type JsonRecord = Record<string, unknown>
type BaselineClassification = 'completed' | 'advisory' | 'blocked' | 'future-only'

export interface DevViewBaselineReportOptions {
  roadmapAudit: string
  finalHandoff: string
  frontendChain?: string
  hookActivationChain?: string
  applyReadiness?: string
  mutationReadiness?: string
  evidenceAcceptanceReadiness?: string
  equivalenceProofReadiness?: string
  scopeCiEnforcementReadiness?: string
  output?: string
  markdown?: string
}

export interface DevViewBaselineFinding {
  code: string
  severity: IssueSeverity
  message: string
  field?: string
  expected?: unknown
  actual?: unknown
  suggestedFix?: string
}

export interface DevViewBaselineSourceSummary {
  sourceId: string
  label: string
  path: string | null
  required: boolean
  readStatus: 'read' | 'missing-optional' | 'unreadable'
  artifactRole: string | null
  status: string | null
  classification: BaselineClassification | 'not-provided'
  authorityStatus: 'source-summary-only-no-new-authority'
}

export interface DevViewBaselineLane {
  laneId: string
  classification: BaselineClassification
  sourceStatus: string
  terminalArtifacts: string[]
  baselineMeaning: string
  authorityBoundary: string
}

export interface DevViewCoreBaselineFreezeReport {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof REPORT_STATUS | 'devview-core-baseline-freeze-report-blocked'
  reporterName: typeof REPORTER_NAME
  reportScope: 'devview-deterministic-spine-baseline-no-new-authority'
  baselineCompletenessStatus: 'complete' | 'partial-with-warnings' | 'blocked'
  sourceRoadmapCompletionAudit: string
  sourceFinalHandoff: string
  sourceFrontendChain: string | null
  sourceHookActivationChain: string | null
  sourceApplyReadiness: string | null
  sourceGraphSourceMutationReadiness: string | null
  sourceEvidenceAcceptanceReadiness: string | null
  sourceEquivalenceProofReadiness: string | null
  sourceScopeCiEnforcementReadiness: string | null
  sourceArtifacts: DevViewBaselineSourceSummary[]
  classificationTaxonomy: Array<{
    classification: BaselineClassification
    definition: string
  }>
  baselineLanes: DevViewBaselineLane[]
  futureOnlyBoundaries: string[]
  safetyInvariantSummary: {
    codexExecutionTriggered: false
    llmInvoked: false
    networkCallsAllowed: false
    automaticRequestIrGenerationEnabled: false
    hookScriptsInstalled: false
    hooksActive: false
    strictModeEnabled: false
    guidedEnforcementEnabled: false
    actualBlockingHookBehaviorImplemented: false
    graphSourceMutated: false
    graphDeltaApplied: false
    approvalAutomationEnabled: false
    projectMemoryExtensionAuthorityGranted: false
    runtimeEvidenceSatisfied: false
    evidenceAccepted: false
    equivalenceProven: false
    scopeEnforced: false
    ciEnforcementEnabled: false
    requiredChecksConfigured: false
    branchProtectionChanged: false
    diffRejectionEnabled: false
  }
  validationFindings: DevViewBaselineFinding[]
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  markdownReportPath: string | null
  writtenOutputPathAuthorityStatus: 'not-written-stdout-only' | 'explicit-baseline-output-not-source-authority'
  markdownReportAuthorityStatus: 'not-written' | 'explicit-baseline-output-not-source-authority'
  nonExecutionBoundary: string
}

export interface DevViewBaselineReportFileResult {
  report: DevViewCoreBaselineFreezeReport
  outputPath?: string
  markdownReport?: string
}

interface LoadedSource {
  sourceId: string
  label: string
  requestedPath: string | null
  resolvedPath: string | null
  required: boolean
  record: JsonRecord | null
  readError: string | null
}

const REQUIRED_SOURCES = {
  roadmapAudit: {
    role: 'devview-roadmap-completion-audit-preview',
    status: 'devview-roadmap-completion-audit-previewed',
  },
  finalHandoff: {
    role: 'devview-roadmap-final-handoff-preview',
    status: 'devview-roadmap-final-handoff-previewed',
  },
}

const OPTIONAL_SOURCE_DEFS = [
  {
    sourceId: 'frontend-chain',
    label: 'Frontend chain report',
    optionKey: 'frontendChain',
    expectedRole: 'devview-frontend-chain-report',
  },
  {
    sourceId: 'hook-activation-chain',
    label: 'Hook activation chain report',
    optionKey: 'hookActivationChain',
    expectedRole: 'devview-hook-activation-chain-report',
  },
  {
    sourceId: 'graph-delta-apply-readiness',
    label: 'Graph Delta apply readiness',
    optionKey: 'applyReadiness',
    expectedRole: 'devview-graph-delta-apply-readiness-preview',
  },
  {
    sourceId: 'graph-source-mutation-readiness',
    label: 'Graph-source mutation readiness',
    optionKey: 'mutationReadiness',
    expectedRole: 'devview-graph-source-mutation-readiness-preview',
  },
  {
    sourceId: 'evidence-acceptance-readiness',
    label: 'Evidence acceptance readiness',
    optionKey: 'evidenceAcceptanceReadiness',
    expectedRole: 'devview-evidence-acceptance-readiness-preview',
  },
  {
    sourceId: 'equivalence-proof-readiness',
    label: 'Equivalence proof readiness',
    optionKey: 'equivalenceProofReadiness',
    expectedRole: 'devview-equivalence-proof-readiness-preview',
  },
  {
    sourceId: 'scope-ci-enforcement-readiness',
    label: 'Scope/CI enforcement readiness',
    optionKey: 'scopeCiEnforcementReadiness',
    expectedRole: 'devview-scope-ci-enforcement-readiness-preview',
  },
] as const

export async function reportDevViewBaselineFile(
  root: string,
  options: DevViewBaselineReportOptions,
): Promise<DevViewBaselineReportFileResult> {
  validateRequiredOptions(options)
  const sources = await loadSources(root, options)
  const findings = validateSources(sources)
  const errors = findings.filter((finding) => finding.severity === 'error')
  if (errors.length > 0) {
    throw new Error(errors.map((finding) => `${finding.code}: ${finding.message}`).join('\n'))
  }

  await assertOutputAuthority(root, sources, options)
  const report = buildReport(root, sources, findings)

  let outputPath: string | undefined
  let markdownReport: string | undefined
  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    report.writtenOutputPath = outputPath
    report.writtenOutputPathAuthorityStatus = 'explicit-baseline-output-not-source-authority'
    await writeJsonAtomic(resolvedOutputPath, report)
  }
  if (options.markdown) {
    const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
    markdownReport = relativePath(root, resolvedMarkdownPath)
    report.markdownReportPath = markdownReport
    report.markdownReportAuthorityStatus = 'explicit-baseline-output-not-source-authority'
    await writeTextAtomic(resolvedMarkdownPath, renderDevViewBaselineMarkdown(report))
    if (options.output) {
      await writeJsonAtomic(resolveRepoPath(root, options.output), report)
    }
  }

  return { report, ...(outputPath ? { outputPath } : {}), ...(markdownReport ? { markdownReport } : {}) }
}

function validateRequiredOptions(options: DevViewBaselineReportOptions): void {
  if (!options.roadmapAudit) {
    throw new Error('report-devview-baseline requires --roadmap-audit <file>.')
  }
  if (!options.finalHandoff) {
    throw new Error('report-devview-baseline requires --final-handoff <file>.')
  }
}

async function loadSources(root: string, options: DevViewBaselineReportOptions): Promise<LoadedSource[]> {
  const requiredSources: LoadedSource[] = [
    await loadSource(root, 'roadmap-audit', 'Roadmap completion audit', options.roadmapAudit, true),
    await loadSource(root, 'final-handoff', 'Roadmap final handoff', options.finalHandoff, true),
  ]
  const optionalSources: LoadedSource[] = []
  for (const definition of OPTIONAL_SOURCE_DEFS) {
    const requested = options[definition.optionKey]
    optionalSources.push(await loadSource(root, definition.sourceId, definition.label, requested ?? null, false))
  }
  return [...requiredSources, ...optionalSources]
}

async function loadSource(
  root: string,
  sourceId: string,
  label: string,
  requestedPath: string | null,
  required: boolean,
): Promise<LoadedSource> {
  if (!requestedPath) {
    return { sourceId, label, requestedPath: null, resolvedPath: null, required, record: null, readError: null }
  }
  const resolvedPath = resolveRepoPath(root, requestedPath)
  const parsed = await readJsonSafe<JsonRecord>(resolvedPath)
  if (!parsed.ok) {
    return {
      sourceId,
      label,
      requestedPath,
      resolvedPath,
      required,
      record: null,
      readError: parsed.error,
    }
  }
  const record = asRecord(parsed.value)
  if (!record) {
    return {
      sourceId,
      label,
      requestedPath,
      resolvedPath,
      required,
      record: null,
      readError: 'expected JSON object',
    }
  }
  return { sourceId, label, requestedPath, resolvedPath, required, record, readError: null }
}

function validateSources(sources: LoadedSource[]): DevViewBaselineFinding[] {
  const findings: DevViewBaselineFinding[] = []
  for (const source of sources) {
    if (!source.requestedPath) {
      if (!source.required) {
        findings.push({
          code: 'DEVVIEW_BASELINE_OPTIONAL_INPUT_NOT_PROVIDED',
          severity: 'warning',
          field: source.sourceId,
          message: `${source.label} was not provided; baseline completeness is partial with warnings.`,
          suggestedFix: 'Pass the optional artifact path to include it in the baseline freeze report.',
        })
      }
      continue
    }
    if (!source.record) {
      findings.push({
        code: source.required
          ? 'DEVVIEW_BASELINE_REQUIRED_INPUT_UNREADABLE'
          : 'DEVVIEW_BASELINE_OPTIONAL_INPUT_UNREADABLE',
        severity: source.required ? 'error' : 'warning',
        field: source.sourceId,
        message: `${source.label} could not be read: ${source.readError ?? 'unknown read error'}.`,
        actual: source.requestedPath,
      })
      continue
    }
    validateRoleStatus(source, findings)
    validateUnsafeAuthoritySignals(source, findings)
  }
  return findings
}

function validateRoleStatus(source: LoadedSource, findings: DevViewBaselineFinding[]): void {
  const role = stringValue(source.record?.artifactRole)
  const status = stringValue(source.record?.status)
  if (source.sourceId === 'roadmap-audit') {
    expectRoleStatus(source, findings, REQUIRED_SOURCES.roadmapAudit.role, REQUIRED_SOURCES.roadmapAudit.status)
    return
  }
  if (source.sourceId === 'final-handoff') {
    expectRoleStatus(source, findings, REQUIRED_SOURCES.finalHandoff.role, REQUIRED_SOURCES.finalHandoff.status)
    return
  }
  const optionalDefinition = OPTIONAL_SOURCE_DEFS.find((definition) => definition.sourceId === source.sourceId)
  if (optionalDefinition && role !== optionalDefinition.expectedRole) {
    findings.push({
      code: 'DEVVIEW_BASELINE_OPTIONAL_ROLE_UNEXPECTED',
      severity: 'warning',
      field: `${source.sourceId}.artifactRole`,
      message: `${source.label} has an unexpected artifactRole and is summarized as advisory/partial only.`,
      expected: optionalDefinition.expectedRole,
      actual: role,
    })
  }
  if (!status) {
    findings.push({
      code: 'DEVVIEW_BASELINE_OPTIONAL_STATUS_MISSING',
      severity: 'warning',
      field: `${source.sourceId}.status`,
      message: `${source.label} has no status field and is summarized as advisory/partial only.`,
    })
  }
}

function expectRoleStatus(
  source: LoadedSource,
  findings: DevViewBaselineFinding[],
  expectedRole: string,
  expectedStatus: string,
): void {
  const role = stringValue(source.record?.artifactRole)
  const status = stringValue(source.record?.status)
  if (role !== expectedRole) {
    findings.push({
      code: 'DEVVIEW_BASELINE_REQUIRED_ROLE_MISMATCH',
      severity: 'error',
      field: `${source.sourceId}.artifactRole`,
      message: `${source.label} has the wrong artifactRole.`,
      expected: expectedRole,
      actual: role,
    })
  }
  if (status !== expectedStatus) {
    findings.push({
      code: 'DEVVIEW_BASELINE_REQUIRED_STATUS_MISMATCH',
      severity: 'error',
      field: `${source.sourceId}.status`,
      message: `${source.label} has the wrong status.`,
      expected: expectedStatus,
      actual: status,
    })
  }
}

function validateUnsafeAuthoritySignals(source: LoadedSource, findings: DevViewBaselineFinding[]): void {
  const record = source.record
  if (!record) return
  const unsafe = collectUnsafeAuthoritySignals(record)
  for (const entry of unsafe) {
    findings.push({
      code: 'DEVVIEW_BASELINE_UNSAFE_AUTHORITY_SIGNAL',
      severity: 'error',
      field: `${source.sourceId}.${entry.path}`,
      message: `${source.label} claims unsafe authority "${entry.path}".`,
      expected: false,
      actual: true,
      suggestedFix: 'Use only baseline/final handoff/readiness artifacts that preserve disabled safety flags.',
    })
  }
  for (const entry of collectApprovalStatusSignals(record)) {
    findings.push({
      code: 'DEVVIEW_BASELINE_UNSAFE_APPROVAL_SIGNAL',
      severity: 'error',
      field: `${source.sourceId}.${entry.path}`,
      message: `${source.label} claims approval status.`,
      expected: 'not-approved',
      actual: entry.value,
    })
  }
}

function buildReport(
  root: string,
  sources: LoadedSource[],
  findings: DevViewBaselineFinding[],
): DevViewCoreBaselineFreezeReport {
  const roadmapAudit = requireSource(sources, 'roadmap-audit')
  const finalHandoff = requireSource(sources, 'final-handoff')
  const warningOnly = findings.some((finding) => finding.severity === 'warning')
  const error = findings.some((finding) => finding.severity === 'error')
  const sourcePath = (sourceId: string): string | null => {
    const source = sources.find((entry) => entry.sourceId === sourceId)
    return source?.resolvedPath ? relativePath(root, source.resolvedPath) : null
  }

  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: error ? 'devview-core-baseline-freeze-report-blocked' : REPORT_STATUS,
    reporterName: REPORTER_NAME,
    reportScope: 'devview-deterministic-spine-baseline-no-new-authority',
    baselineCompletenessStatus: error ? 'blocked' : warningOnly ? 'partial-with-warnings' : 'complete',
    sourceRoadmapCompletionAudit: relativePath(root, roadmapAudit.resolvedPath ?? ''),
    sourceFinalHandoff: relativePath(root, finalHandoff.resolvedPath ?? ''),
    sourceFrontendChain: sourcePath('frontend-chain'),
    sourceHookActivationChain: sourcePath('hook-activation-chain'),
    sourceApplyReadiness: sourcePath('graph-delta-apply-readiness'),
    sourceGraphSourceMutationReadiness: sourcePath('graph-source-mutation-readiness'),
    sourceEvidenceAcceptanceReadiness: sourcePath('evidence-acceptance-readiness'),
    sourceEquivalenceProofReadiness: sourcePath('equivalence-proof-readiness'),
    sourceScopeCiEnforcementReadiness: sourcePath('scope-ci-enforcement-readiness'),
    sourceArtifacts: sources.map((source) => summarizeSource(root, source)),
    classificationTaxonomy: buildClassificationTaxonomy(),
    baselineLanes: buildBaselineLanes(finalHandoff.record ?? {}, roadmapAudit.record ?? {}),
    futureOnlyBoundaries: buildFutureOnlyBoundaries(finalHandoff.record ?? {}, roadmapAudit.record ?? {}),
    safetyInvariantSummary: {
      codexExecutionTriggered: false,
      llmInvoked: false,
      networkCallsAllowed: false,
      automaticRequestIrGenerationEnabled: false,
      hookScriptsInstalled: false,
      hooksActive: false,
      strictModeEnabled: false,
      guidedEnforcementEnabled: false,
      actualBlockingHookBehaviorImplemented: false,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      approvalAutomationEnabled: false,
      projectMemoryExtensionAuthorityGranted: false,
      runtimeEvidenceSatisfied: false,
      evidenceAccepted: false,
      equivalenceProven: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
      requiredChecksConfigured: false,
      branchProtectionChanged: false,
      diffRejectionEnabled: false,
    },
    validationFindings: findings,
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    markdownReportPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportAuthorityStatus: 'not-written',
    nonExecutionBoundary:
      'This DevView core baseline freeze report summarizes existing deterministic spine, advisory, blocked, and future-only states only. It does not execute Codex, call an LLM/API, install or run hooks, activate strict/guided blocking, grant Project Memory extension authority, mutate graph-source, apply graph deltas, automate approval or human decisions, accept Evidence, satisfy runtime Evidence, prove equivalence, enforce scope, configure CI required checks, change branch protection, reject diffs, or replace user acceptance.',
  }
}

function summarizeSource(root: string, source: LoadedSource): DevViewBaselineSourceSummary {
  if (!source.requestedPath) {
    return {
      sourceId: source.sourceId,
      label: source.label,
      path: null,
      required: source.required,
      readStatus: 'missing-optional',
      artifactRole: null,
      status: null,
      classification: 'not-provided',
      authorityStatus: 'source-summary-only-no-new-authority',
    }
  }
  if (!source.record || !source.resolvedPath) {
    return {
      sourceId: source.sourceId,
      label: source.label,
      path: source.requestedPath,
      required: source.required,
      readStatus: 'unreadable',
      artifactRole: null,
      status: null,
      classification: source.required ? 'blocked' : 'advisory',
      authorityStatus: 'source-summary-only-no-new-authority',
    }
  }
  const status = stringValue(source.record.status)
  return {
    sourceId: source.sourceId,
    label: source.label,
    path: relativePath(root, source.resolvedPath),
    required: source.required,
    readStatus: 'read',
    artifactRole: stringValue(source.record.artifactRole) || null,
    status: status || null,
    classification: classifyStatus(source.sourceId, status),
    authorityStatus: 'source-summary-only-no-new-authority',
  }
}

function classifyStatus(sourceId: string, status: string): BaselineClassification {
  const normalized = status.toLowerCase()
  if (normalized.includes('blocked')) return 'blocked'
  if (sourceId === 'roadmap-audit' || sourceId === 'final-handoff') return 'completed'
  if (sourceId.includes('readiness')) return normalized.includes('ready') ? 'advisory' : 'blocked'
  return 'advisory'
}

function buildClassificationTaxonomy(): DevViewCoreBaselineFreezeReport['classificationTaxonomy'] {
  return [
    {
      classification: 'completed',
      definition:
        'Deterministic preview/report surface and calibration artifact exist for the current safe MVP baseline.',
    },
    {
      classification: 'advisory',
      definition:
        'Preview/report-only surface exists, but it grants no execution, mutation, approval, evidence, proof, or enforcement authority.',
    },
    {
      classification: 'blocked',
      definition:
        'Readiness/report surface exists but current calibration prerequisites intentionally prevent progression.',
    },
    {
      classification: 'future-only',
      definition:
        'Intentionally unimplemented authority-changing capability that requires a separate future decision before implementation.',
    },
  ]
}

function buildBaselineLanes(finalHandoff: JsonRecord, roadmapAudit: JsonRecord): DevViewBaselineLane[] {
  const handoffLanes = arrayRecords(finalHandoff.handoffLanes)
  const lanes: DevViewBaselineLane[] = []
  const addFromHandoff = (
    laneId: string,
    classification: BaselineClassification,
    fallbackMeaning: string,
    fallbackBoundary: string,
  ): void => {
    const source = handoffLanes.find((entry) => stringValue(entry.laneId) === laneId)
    lanes.push({
      laneId,
      classification,
      sourceStatus: stringValue(source?.laneStatus) || 'not-summarized-in-final-handoff',
      terminalArtifacts: collectLaneArtifacts(source),
      baselineMeaning: fallbackMeaning,
      authorityBoundary: stringValue(source?.authorityBoundary) || fallbackBoundary,
    })
  }
  addFromHandoff(
    'compiler-frontend',
    'completed',
    'Request IR candidate validation through Instruction Pack preview is represented for the calibration.',
    'Instruction Pack preview is not Codex execution and cannot approve or mutate graph-source.',
  )
  addFromHandoff(
    'ai-analyzer-and-clarification',
    'advisory',
    'Analyzer and clarification surfaces remain candidate-only and non-authoritative until validation reruns.',
    'No LLM provider execution or automatic Request IR generation authority is granted.',
  )
  addFromHandoff(
    'activation-preview',
    'advisory',
    'Hook Gateway activation is represented by non-active previews and repo-local script bundle materialization.',
    'Repo-local advisory scripts are review artifacts only; hooks are not installed, active, trusted, or blocking.',
  )
  addFromHandoff(
    'advisory-backend-and-review',
    'advisory',
    'Proposal-only and Human Review Packet surfaces are connected without apply authority.',
    'Proposal/review packet generation does not apply graph deltas or mutate graph-source.',
  )
  addFromHandoff(
    'phase-13-controlled-apply-readiness',
    'blocked',
    'Phase 13 readiness chain is connected but current calibration is blocked by defer-decision.',
    'Approved state, graph apply, mutation, Evidence acceptance, equivalence proof, and enforcement stay blocked.',
  )

  const commandSurface = arrayStrings(roadmapAudit.implementedCommandSurface)
  if (commandSurface.some((command) => command.includes('project-memory'))) {
    lanes.push({
      laneId: 'project-memory-preview',
      classification: 'advisory',
      sourceStatus: 'preview/report-only-no-extension-authority',
      terminalArtifacts: [
        'examples/valid/todo-app-pbe-run/generated/devview-project-memory-boundary.runtime-evidence-only.preview.json',
      ],
      baselineMeaning: 'Project Memory reports may summarize gaps and impact without granting extension authority.',
      authorityBoundary:
        'Project Memory extension authority remains proposal-only/future-approved; this baseline grants no Project Memory mutation or extension authority.',
    })
  }
  return lanes
}

function collectLaneArtifacts(source: JsonRecord | undefined): string[] {
  if (!source) return []
  const artifacts: string[] = []
  if (typeof source.terminalArtifact === 'string') artifacts.push(source.terminalArtifact)
  artifacts.push(...arrayStrings(source.terminalArtifacts))
  return artifacts
}

function buildFutureOnlyBoundaries(finalHandoff: JsonRecord, roadmapAudit: JsonRecord): string[] {
  return Array.from(
    new Set([
      ...arrayStrings(finalHandoff.explicitlyStillDisabled),
      ...arrayStrings(roadmapAudit.explicitlyNotImplemented),
      'Project Memory extension authority',
    ]),
  ).sort((left, right) => left.localeCompare(right))
}

export function renderDevViewBaselineMarkdown(report: DevViewCoreBaselineFreezeReport): string {
  return [
    '# DevView Core Baseline Freeze',
    '',
    `Status: \`${report.status}\``,
    `Completeness: \`${report.baselineCompletenessStatus}\``,
    '',
    '## Sources',
    '',
    ...report.sourceArtifacts.map(
      (source) =>
        `- ${source.label}: ${source.path ? `\`${source.path}\`` : 'not provided'} (${source.classification}, ${source.readStatus})`,
    ),
    '',
    '## Baseline Lanes',
    '',
    ...report.baselineLanes.map((lane) => `- ${lane.laneId}: ${lane.classification} - ${lane.baselineMeaning}`),
    '',
    '## Future Only',
    '',
    ...report.futureOnlyBoundaries.map((boundary) => `- ${boundary}`),
    '',
    '## Safety',
    '',
    '- Codex execution, LLM/API calls, active hooks, graph apply, graph-source mutation, Evidence acceptance, equivalence proof, scope/CI enforcement, and Project Memory extension authority remain disabled.',
    '',
    '## Findings',
    '',
    ...renderFindings(report.validationFindings),
    '',
    '## Non-execution Statement',
    '',
    report.nonExecutionBoundary,
    '',
  ].join('\n')
}

async function assertOutputAuthority(
  root: string,
  sources: LoadedSource[],
  options: Pick<DevViewBaselineReportOptions, 'output' | 'markdown'>,
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
    throw new Error('DevView baseline output is unsafe: --output and --markdown resolve to the same path.')
  }
  const protectedPaths = buildProtectedPathMap(root, sources)
  for (const target of targets) {
    const relativeTarget = relativePath(root, target.resolvedPath)
    if (isActiveHookLocation(relativeTarget)) {
      throw new Error(
        `DevView baseline ${target.kind} path is unsafe: ${target.requestedPath} targets an active hook/config location.`,
      )
    }
    for (const [protectedKey, reason] of protectedPaths) {
      if (pathKey(target.resolvedPath) === protectedKey) {
        throw new Error(
          `DevView baseline ${target.kind} path is unsafe: ${target.requestedPath} would overwrite ${reason}.`,
        )
      }
    }
    const existingAuthority = await classifyExistingSourceAuthority(target.resolvedPath)
    if (existingAuthority) {
      throw new Error(
        `DevView baseline ${target.kind} path is unsafe: ${target.requestedPath} already contains ${existingAuthority}.`,
      )
    }
  }
}

function buildProtectedPathMap(root: string, sources: LoadedSource[]): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const add = (candidate: string | null, reason: string): void => {
    if (!candidate) return
    protectedPaths.set(pathKey(resolveRepoPath(root, candidate)), reason)
  }
  for (const source of sources) {
    if (source.resolvedPath) {
      protectedPaths.set(pathKey(source.resolvedPath), `the source ${source.label}`)
    }
    if (source.record) {
      for (const candidate of collectConcretePathStrings(source.record, new Set(), new Set(OWN_OUTPUT_LINK_KEYS))) {
        add(candidate, `linked source artifact ${candidate}`)
      }
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
  if (!artifactRole || artifactRole === REPORT_ROLE) return null
  if (
    artifactRole.includes('graph-source') ||
    artifactRole.includes('read-model') ||
    artifactRole.includes('evidence') ||
    artifactRole === 'request-ir-candidate' ||
    artifactRole === 'instruction-pack' ||
    artifactRole === 'contract-compiler-input' ||
    artifactRole === 'selected-graph-slice' ||
    artifactRole === 'graph-traversal-plan'
  ) {
    return `source/selected artifactRole "${artifactRole}"`
  }
  if (asRecord(record.sourceRecords)) return 'graph-source-shaped sourceRecords'
  if (asRecord(record.taxonomy) && (Array.isArray(record.nodes) || Array.isArray(record.edges))) {
    return 'generated read-model source-authority projection'
  }
  return null
}

const OWN_OUTPUT_LINK_KEYS = [
  'firstCalibrationDevViewBaselineArtifact',
  'firstCalibrationDevViewBaselineMarkdownArtifact',
]

const UNSAFE_TRUE_FIELDS = new Set([
  'codexExecutionTriggered',
  'llmInvoked',
  'networkCallsAllowed',
  'automaticRequestIrGenerationEnabled',
  'hookScriptsInstalled',
  'hooksActive',
  'strictModeEnabled',
  'guidedEnforcementEnabled',
  'actualBlockingHookBehaviorImplemented',
  'preToolUseBlockingEnabled',
  'graphSourceMutated',
  'graphDeltaApplied',
  'approvalAutomationEnabled',
  'projectMemoryExtensionAuthorityGranted',
  'runtimeEvidenceSatisfied',
  'evidenceAccepted',
  'equivalenceProven',
  'scopeEnforced',
  'ciEnforcementEnabled',
  'requiredChecksConfigured',
  'branchProtectionChanged',
  'diffRejectionEnabled',
  'graphSourceMutationAllowed',
  'graphDeltaApplyEnabled',
  'mutationAllowed',
  'acceptanceAllowed',
  'equivalenceAllowed',
  'scopeEnforcementAllowed',
  'ciEnforcementAllowed',
])

function collectUnsafeAuthoritySignals(value: unknown): Array<{ path: string }> {
  const findings: Array<{ path: string }> = []
  const visit = (entry: unknown, cursor: string, seen: Set<unknown>): void => {
    if (Array.isArray(entry)) {
      entry.forEach((item, index) => visit(item, `${cursor}[${index}]`, seen))
      return
    }
    const record = asRecord(entry)
    if (!record || seen.has(record)) return
    seen.add(record)
    for (const [key, item] of Object.entries(record)) {
      const nextPath = cursor ? `${cursor}.${key}` : key
      if (UNSAFE_TRUE_FIELDS.has(key) && item === true) findings.push({ path: nextPath })
      visit(item, nextPath, seen)
    }
  }
  visit(value, '', new Set())
  return findings
}

function collectApprovalStatusSignals(value: unknown): Array<{ path: string; value: unknown }> {
  const findings: Array<{ path: string; value: unknown }> = []
  const visit = (entry: unknown, cursor: string, seen: Set<unknown>): void => {
    if (Array.isArray(entry)) {
      entry.forEach((item, index) => visit(item, `${cursor}[${index}]`, seen))
      return
    }
    const record = asRecord(entry)
    if (!record || seen.has(record)) return
    seen.add(record)
    for (const [key, item] of Object.entries(record)) {
      const nextPath = cursor ? `${cursor}.${key}` : key
      if (key === 'approvalStatus' && item !== 'not-approved') findings.push({ path: nextPath, value: item })
      visit(item, nextPath, seen)
    }
  }
  visit(value, '', new Set())
  return findings
}

function collectConcretePathStrings(
  value: unknown,
  seen = new Set<unknown>(),
  skippedKeys = new Set<string>(),
): string[] {
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
    if (!record || seen.has(record)) return
    seen.add(record)
    for (const [key, item] of Object.entries(record)) {
      if (!skippedKeys.has(key)) visit(item)
    }
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
    /\.(json|md|txt|ps1|sh|js|ts|yaml|yml|html)$/i.test(normalized)
  )
}

function isActiveHookLocation(candidatePath: string): boolean {
  const normalized = candidatePath.replaceAll('\\', '/').toLowerCase()
  return (
    normalized === '.codex/hooks' ||
    normalized.startsWith('.codex/hooks/') ||
    normalized === '.codex/config.json' ||
    normalized.startsWith('.codex/config/')
  )
}

function renderFindings(findings: DevViewBaselineFinding[]): string[] {
  if (findings.length === 0) return ['- None.']
  return findings.map((finding) => `- ${finding.severity}: ${finding.code} - ${finding.message}`)
}

function requireSource(sources: LoadedSource[], sourceId: string): LoadedSource {
  const source = sources.find((entry) => entry.sourceId === sourceId)
  if (!source) throw new Error(`Internal error: missing loaded source ${sourceId}.`)
  return source
}

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as JsonRecord
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function arrayRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.map((entry) => asRecord(entry)).filter((entry): entry is JsonRecord => Boolean(entry))
    : []
}

function arrayStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function resolveRepoPath(root: string, candidatePath: string): string {
  return path.isAbsolute(candidatePath) ? candidatePath : path.resolve(root, candidatePath)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}
