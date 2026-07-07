import { existsSync } from 'node:fs'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'

type JsonRecord = Record<string, unknown>

const DATA_ROLE = 'devview-work-journal-data-preview'
const HTML_ROLE = 'devview-work-journal-html-preview'

const unsafeAuthorityFields = [
  'runtimeEvidenceSatisfied',
  'evidenceAccepted',
  'equivalenceProven',
  'scopeEnforced',
  'ciEnforcementEnabled',
  'graphSourceMutated',
  'graphDeltaApplied',
  'approvalAutomationEnabled',
  'userAcceptanceAutomated',
  'providerInvoked',
  'networkCallMade',
  'extensionExecutionAllowed',
  'extensionsExecuted',
  'shellCommandsExecuted',
  'filesMutated',
]

export interface WorkJournalRenderOptions {
  runId: string
  title?: string
  baseline: string
  graphSource?: string
  viewTree?: string
  contractInput?: string
  instructionPack?: string
  extensionReadiness?: string
  runtimeEvidenceSatisfactionReadiness?: string
  runtimeEvidenceSatisfactionRecord?: string
  equivalenceProofReadiness?: string
  equivalenceProofRecord?: string
  scopeCiEnforcementReadiness?: string
  proposal?: string
  applyReport?: string
  output?: string
  dataOutput?: string
  runOutput?: string
}

export interface WorkJournalRenderFileResult {
  journal: WorkJournalDataPreview
  outputPath: string
  dataOutputPath: string
  runOutputPath: string
}

export interface WorkJournalArtifactSummary {
  sourceId: string
  label: string
  path: string | null
  artifactRole: string | null
  status: string | null
  authorityStatus: 'source-summary-only-no-new-authority'
  classification: 'completed' | 'advisory' | 'blocked' | 'not-provided'
}

export interface WorkJournalFlowStep {
  stepId: string
  label: string
  summary: string
  sourceId: string
  status: string
  authority: 'actual-record' | 'preview-only' | 'source-summary-only' | 'blocked' | 'not-provided'
}

export interface WorkJournalEvidenceSummary {
  required: number | null
  provided: number
  missing: number | null
  status: string
}

export interface WorkJournalScopeSummary {
  allowed: number | null
  forbidden: number | null
  violations: number | null
  protectedPathBlocks: number | null
  status: string
}

export interface WorkJournalAuthoritySummary {
  runtimeEvidence: {
    readinessStatus: string | null
    actualRecordStatus: string | null
    displayState: 'actual-record-satisfied' | 'preview-only-ready' | 'preview-only-blocked' | 'not-provided'
  }
  equivalenceProof: {
    readinessStatus: string | null
    actualRecordStatus: string | null
    displayState: 'actual-record-proven' | 'preview-only-ready' | 'preview-only-blocked' | 'not-provided'
  }
  scopeCi: {
    readinessStatus: string | null
    activationStatus: 'future-not-provided'
    displayState: 'preview-only-ready' | 'preview-only-blocked' | 'not-provided'
  }
  journalAuthorityFlags: {
    runtimeEvidenceSatisfied: false
    evidenceAccepted: false
    equivalenceProven: false
    scopeEnforced: false
    ciEnforcementEnabled: false
  }
}

export interface WorkJournalRunPreview {
  runId: string
  title: string
  status: 'ready-for-review' | 'blocked' | 'advisory'
  nextAction: string
  blockedReason: string | null
  decisionSummary: string
  evidenceSummary: WorkJournalEvidenceSummary
  scopeSummary: WorkJournalScopeSummary
  authoritySummary: WorkJournalAuthoritySummary
  flow: WorkJournalFlowStep[]
  artifacts: WorkJournalArtifactSummary[]
  auditProvenance: Array<{ sourceId: string; path: string; artifactRole: string | null; status: string | null }>
}

export interface WorkJournalDataPreview {
  schemaVersion: 1
  artifactRole: typeof DATA_ROLE
  htmlArtifactRole: typeof HTML_ROLE
  status: 'devview-work-journal-data-generated'
  journalScope: 'cumulative-static-work-journal-preview'
  currentRunId: string
  runs: WorkJournalRunPreview[]
  safetyFlags: {
    staticHtmlOnly: true
    providerInvoked: false
    networkCallMade: false
    extensionExecutionAllowed: false
    extensionsExecuted: false
    shellCommandsExecuted: false
    filesMutatedOutsideExplicitOutputs: false
    graphSourceMutated: false
    graphDeltaApplied: false
    runtimeEvidenceSatisfied: false
    evidenceAccepted: false
    equivalenceProven: false
    scopeEnforced: false
    ciEnforcementEnabled: false
    approvalAutomationEnabled: false
    userAcceptanceAutomated: false
    nonEnforcing: true
  }
  outputPaths: {
    htmlOutputPath: string
    dataOutputPath: string
    runOutputPath: string
  }
  nonExecutionBoundary: string
}

interface LoadedArtifact {
  sourceId: string
  label: string
  path: string | null
  resolvedPath: string | null
  record: JsonRecord | null
}

const SOURCE_DEFS = [
  { sourceId: 'baseline', label: 'DevView baseline freeze', optionKey: 'baseline' },
  { sourceId: 'maintainability-graph', label: 'Maintainability Graph', optionKey: 'graphSource' },
  { sourceId: 'view-tree', label: 'View Tree', optionKey: 'viewTree' },
  { sourceId: 'context-pack', label: 'Context Pack / Contract Input', optionKey: 'contractInput' },
  { sourceId: 'instruction-pack', label: 'Instruction Pack', optionKey: 'instructionPack' },
  { sourceId: 'extension-readiness', label: 'Extension readiness', optionKey: 'extensionReadiness' },
  {
    sourceId: 'runtime-evidence-satisfaction-readiness',
    label: 'Runtime Evidence satisfaction readiness',
    optionKey: 'runtimeEvidenceSatisfactionReadiness',
  },
  {
    sourceId: 'runtime-evidence-satisfaction-record',
    label: 'Runtime Evidence satisfaction record',
    optionKey: 'runtimeEvidenceSatisfactionRecord',
  },
  {
    sourceId: 'equivalence-proof-readiness',
    label: 'Equivalence proof readiness',
    optionKey: 'equivalenceProofReadiness',
  },
  { sourceId: 'equivalence-proof-record', label: 'Equivalence proof record', optionKey: 'equivalenceProofRecord' },
  { sourceId: 'scope-ci', label: 'Scope/CI readiness', optionKey: 'scopeCiEnforcementReadiness' },
  { sourceId: 'graph-delta', label: 'Graph Delta proposal', optionKey: 'proposal' },
  { sourceId: 'guarded-update', label: 'Guarded graph update status', optionKey: 'applyReport' },
] as const

export async function renderWorkJournalFile(
  root: string,
  options: WorkJournalRenderOptions,
): Promise<WorkJournalRenderFileResult> {
  validateOptions(options)
  const sources = await loadSources(root, options)
  validateSources(sources)

  const outputPath = resolveRepoPath(root, options.output ?? '')
  const dataOutputPath = resolveRepoPath(root, options.dataOutput ?? '')
  const runOutputPath = resolveRepoPath(root, options.runOutput ?? '')
  await assertWorkJournalOutputAuthority(root, sources, { outputPath, dataOutputPath, runOutputPath })

  const previousJournal = await loadPreviousWorkJournalData(dataOutputPath)
  const journal = buildWorkJournalData(
    root,
    options,
    sources,
    { outputPath, dataOutputPath, runOutputPath },
    previousJournal,
  )
  await mkdir(path.dirname(outputPath), { recursive: true })
  await mkdir(path.dirname(dataOutputPath), { recursive: true })
  await mkdir(path.dirname(runOutputPath), { recursive: true })
  await writeTextAtomic(outputPath, renderWorkJournalHtml(journal))
  await writeJsonAtomic(dataOutputPath, journal)
  await writeJsonAtomic(runOutputPath, journal.runs[0])

  return {
    journal,
    outputPath: relativePath(root, outputPath),
    dataOutputPath: relativePath(root, dataOutputPath),
    runOutputPath: relativePath(root, runOutputPath),
  }
}

function validateOptions(options: WorkJournalRenderOptions): void {
  if (!options.runId) throw new Error('work-journal render requires --run-id <id>.')
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(options.runId)) {
    throw new Error('work-journal render requires --run-id to be a simple stable identifier.')
  }
  if (!options.baseline) throw new Error('work-journal render requires --baseline <baselineFreezeJson>.')
  if (!options.output) throw new Error('work-journal render requires --output <indexHtml>.')
  if (!options.dataOutput) throw new Error('work-journal render requires --data-output <indexDataJson>.')
  if (!options.runOutput) throw new Error('work-journal render requires --run-output <runJson>.')
}

async function loadSources(root: string, options: WorkJournalRenderOptions): Promise<LoadedArtifact[]> {
  const loaded: LoadedArtifact[] = []
  for (const def of SOURCE_DEFS) {
    const requested = options[def.optionKey]
    if (!requested) {
      loaded.push({ sourceId: def.sourceId, label: def.label, path: null, resolvedPath: null, record: null })
      continue
    }
    const resolvedPath = resolveRepoPath(root, requested)
    const parsed = await readJsonSafe<JsonRecord>(resolvedPath)
    if (!parsed.ok) {
      throw new Error(`Unable to read ${def.label}: ${parsed.error}`)
    }
    const record = asRecord(parsed.value)
    if (!record) {
      throw new Error(`Unable to read ${def.label}: expected JSON object.`)
    }
    loaded.push({
      sourceId: def.sourceId,
      label: def.label,
      path: relativePath(root, resolvedPath),
      resolvedPath,
      record,
    })
  }
  return loaded
}

function validateSources(sources: LoadedArtifact[]): void {
  for (const source of sources) {
    if (!source.record) continue
    validateSourceRecordShape(source)
    const unsafe = collectUnsafeAuthorityHits(source.record, [], new Set(), allowedAuthorityPathsForSource(source))
    if (unsafe.length > 0) {
      throw new Error(`Work Journal source ${source.label} has unsafe true authority field ${unsafe[0].field}.`)
    }
  }
}

function validateSourceRecordShape(source: LoadedArtifact): void {
  const record = source.record
  if (!record) return
  if (source.sourceId === 'runtime-evidence-satisfaction-record') {
    if (
      record.artifactRole !== 'devview-runtime-evidence-satisfaction-record' ||
      record.status !== 'devview-runtime-evidence-satisfaction-recorded'
    ) {
      throw new Error('Work Journal Runtime Evidence satisfaction record source has an unsupported role/status.')
    }
    if (record.runtimeEvidenceSatisfied !== true) {
      throw new Error(
        'Work Journal Runtime Evidence satisfaction record source must have runtimeEvidenceSatisfied true.',
      )
    }
    requireFalseFields(source.label, record, [
      'evidenceAccepted',
      'equivalenceProven',
      'scopeEnforced',
      'ciEnforcementEnabled',
      'graphSourceMutated',
      'graphDeltaApplied',
      'approvalAutomationEnabled',
      'userAcceptanceAutomated',
      'providerInvoked',
      'networkCallMade',
      'extensionExecutionAllowed',
      'extensionsExecuted',
      'shellCommandsExecuted',
      'filesMutated',
    ])
  }
  if (source.sourceId === 'equivalence-proof-record') {
    if (
      record.artifactRole !== 'devview-equivalence-proof-record' ||
      record.status !== 'devview-equivalence-proof-recorded'
    ) {
      throw new Error('Work Journal Equivalence Proof record source has an unsupported role/status.')
    }
    if (record.equivalenceProven !== true) {
      throw new Error('Work Journal Equivalence Proof record source must have equivalenceProven true.')
    }
    requireFalseFields(source.label, record, [
      'runtimeEvidenceSatisfied',
      'evidenceAccepted',
      'scopeEnforced',
      'ciEnforcementEnabled',
      'graphSourceMutated',
      'graphDeltaApplied',
      'approvalAutomationEnabled',
      'userAcceptanceAutomated',
      'providerInvoked',
      'networkCallMade',
      'extensionExecutionAllowed',
      'extensionsExecuted',
      'shellCommandsExecuted',
      'filesMutated',
    ])
  }
}

function allowedAuthorityPathsForSource(source: LoadedArtifact): Set<string> {
  if (source.sourceId === 'runtime-evidence-satisfaction-record') return new Set(['runtimeEvidenceSatisfied'])
  if (source.sourceId === 'equivalence-proof-record') return new Set(['equivalenceProven'])
  return new Set()
}

function requireFalseFields(label: string, record: JsonRecord, fields: string[]): void {
  for (const field of fields) {
    if (field in record && record[field] !== false) {
      throw new Error(`Work Journal source ${label} must keep ${field}:false.`)
    }
  }
}

function buildWorkJournalData(
  root: string,
  options: WorkJournalRenderOptions,
  sources: LoadedArtifact[],
  outputs: { outputPath: string; dataOutputPath: string; runOutputPath: string },
  previousJournal: WorkJournalDataPreview | null,
): WorkJournalDataPreview {
  const artifacts = sources.map((source) => summarizeArtifact(source))
  const flow = buildFlow(artifacts)
  const blocked = flow.find((step) => step.authority === 'blocked')
  const blockedReason = blocked ? `${blocked.label} is ${blocked.status ?? 'blocked'}.` : null
  const run: WorkJournalRunPreview = {
    runId: options.runId,
    title: options.title || options.runId,
    status: blocked ? 'blocked' : 'ready-for-review',
    nextAction: blocked
      ? `Review blocked stage: ${blocked.label}.`
      : 'Review the work journal and decide the next human action.',
    blockedReason,
    decisionSummary: blockedReason ?? 'Ready for human review; this journal is still report-only and non-enforcing.',
    evidenceSummary: buildEvidenceSummary(sources, artifacts),
    scopeSummary: buildScopeSummary(sources, artifacts),
    authoritySummary: buildAuthoritySummary(artifacts),
    flow,
    artifacts,
    auditProvenance: artifacts
      .filter((artifact) => artifact.path)
      .map((artifact) => ({
        sourceId: artifact.sourceId,
        path: artifact.path ?? '',
        artifactRole: artifact.artifactRole,
        status: artifact.status,
      })),
  }
  const runs = mergeWorkJournalRuns(previousJournal, run)
  return {
    schemaVersion: 1,
    artifactRole: DATA_ROLE,
    htmlArtifactRole: HTML_ROLE,
    status: 'devview-work-journal-data-generated',
    journalScope: 'cumulative-static-work-journal-preview',
    currentRunId: options.runId,
    runs,
    safetyFlags: {
      staticHtmlOnly: true,
      providerInvoked: false,
      networkCallMade: false,
      extensionExecutionAllowed: false,
      extensionsExecuted: false,
      shellCommandsExecuted: false,
      filesMutatedOutsideExplicitOutputs: false,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      runtimeEvidenceSatisfied: false,
      evidenceAccepted: false,
      equivalenceProven: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
      approvalAutomationEnabled: false,
      userAcceptanceAutomated: false,
      nonEnforcing: true,
    },
    outputPaths: {
      htmlOutputPath: relativePath(root, outputs.outputPath),
      dataOutputPath: relativePath(root, outputs.dataOutputPath),
      runOutputPath: relativePath(root, outputs.runOutputPath),
    },
    nonExecutionBoundary:
      'This DevView Work Journal is a static visualization/report artifact. It does not execute extension code, call providers or networks, mutate graph-source, apply graph deltas, satisfy runtime Evidence, accept Evidence, prove equivalence, enforce scope, configure CI, activate hooks, automate approval, or replace user acceptance.',
  }
}

async function loadPreviousWorkJournalData(dataOutputPath: string): Promise<WorkJournalDataPreview | null> {
  if (!existsSync(dataOutputPath)) return null
  const parsed = await readJsonSafe<JsonRecord>(dataOutputPath)
  if (!parsed.ok) {
    throw new Error(`Existing Work Journal data output is not readable JSON: ${parsed.error}`)
  }
  const record = asRecord(parsed.value)
  if (!record || record.artifactRole !== DATA_ROLE || !Array.isArray(record.runs)) {
    throw new Error('Existing Work Journal data output must be a devview-work-journal-data-preview artifact.')
  }
  const unsafe = collectUnsafeAuthorityHits(record)
  if (unsafe.length > 0) {
    throw new Error(`Existing Work Journal data output has unsafe true authority field ${unsafe[0].field}.`)
  }
  return record as unknown as WorkJournalDataPreview
}

function mergeWorkJournalRuns(
  previousJournal: WorkJournalDataPreview | null,
  currentRun: WorkJournalRunPreview,
): WorkJournalRunPreview[] {
  const previousRuns = previousJournal?.runs ?? []
  const retainedRuns = previousRuns.filter(
    (run) => isWorkJournalRunPreview(run) && run.runId !== currentRun.runId,
  ) as WorkJournalRunPreview[]
  return [...retainedRuns, currentRun]
}

function isWorkJournalRunPreview(value: unknown): value is WorkJournalRunPreview {
  const record = asRecord(value)
  return Boolean(record && typeof record.runId === 'string' && typeof record.title === 'string')
}

function summarizeArtifact(source: LoadedArtifact): WorkJournalArtifactSummary {
  if (!source.record) {
    return {
      sourceId: source.sourceId,
      label: source.label,
      path: null,
      artifactRole: null,
      status: null,
      authorityStatus: 'source-summary-only-no-new-authority',
      classification: 'not-provided',
    }
  }
  const status = stringValue(source.record.status)
  return {
    sourceId: source.sourceId,
    label: source.label,
    path: source.path,
    artifactRole: stringValue(source.record.artifactRole) || null,
    status: status || null,
    authorityStatus: 'source-summary-only-no-new-authority',
    classification: classifyArtifact(source.sourceId, status),
  }
}

function classifyArtifact(sourceId: string, status: string): WorkJournalArtifactSummary['classification'] {
  const normalized = status.toLowerCase()
  if (normalized.includes('blocked')) return 'blocked'
  if (sourceId === 'baseline') return 'completed'
  if (sourceId === 'runtime-evidence-satisfaction-record' || sourceId === 'equivalence-proof-record')
    return normalized.includes('recorded') ? 'completed' : 'blocked'
  if (sourceId === 'runtime-evidence-satisfaction-readiness')
    return normalized.includes('ready') ? 'advisory' : 'blocked'
  if (sourceId === 'equivalence-proof-readiness' || sourceId === 'scope-ci')
    return normalized.includes('ready') ? 'advisory' : 'blocked'
  if (sourceId === 'guarded-update')
    return normalized.includes('applied') ? 'advisory' : normalized.includes('blocked') ? 'blocked' : 'advisory'
  return 'advisory'
}

function buildFlow(artifacts: WorkJournalArtifactSummary[]): WorkJournalFlowStep[] {
  const stages: Array<{
    stepId: string
    label: string
    summary: string
    sourceId: string
    actualSourceId?: string
    readinessSourceId?: string
  }> = [
    {
      stepId: 'maintainability-graph',
      label: 'Maintainability Graph',
      summary: 'Source model for project structure and change context.',
      sourceId: 'maintainability-graph',
    },
    {
      stepId: 'view-tree',
      label: 'View Tree',
      summary: 'Task-shaped projection from the Maintainability Graph.',
      sourceId: 'view-tree',
    },
    {
      stepId: 'context-pack',
      label: 'Context Pack',
      summary: 'Bounded subgraph package with scope and constraints.',
      sourceId: 'context-pack',
    },
    {
      stepId: 'instruction-pack',
      label: 'Instruction Pack',
      summary: 'AI/Codex-facing instruction artifact.',
      sourceId: 'instruction-pack',
    },
    {
      stepId: 'extension-readiness',
      label: 'Project Extensions',
      summary: 'Project profile and extension manifest readiness.',
      sourceId: 'extension-readiness',
    },
    {
      stepId: 'runtime-evidence',
      label: 'Runtime Evidence',
      summary: 'Actual satisfaction record when present; otherwise readiness-only binding state.',
      sourceId: 'runtime-evidence-satisfaction-readiness',
      actualSourceId: 'runtime-evidence-satisfaction-record',
      readinessSourceId: 'runtime-evidence-satisfaction-readiness',
    },
    {
      stepId: 'equivalence-proof',
      label: 'Equivalence Proof',
      summary: 'Actual proof record when present; otherwise readiness-only proof state.',
      sourceId: 'equivalence-proof-readiness',
      actualSourceId: 'equivalence-proof-record',
      readinessSourceId: 'equivalence-proof-readiness',
    },
    {
      stepId: 'graph-delta',
      label: 'Graph Delta',
      summary: 'Proposed Maintainability Graph update.',
      sourceId: 'graph-delta',
    },
    {
      stepId: 'guarded-update',
      label: 'Guarded Update',
      summary: 'Apply/blocked graph update status.',
      sourceId: 'guarded-update',
    },
    {
      stepId: 'scope-ci',
      label: 'Scope/CI',
      summary: 'Scope and CI enforcement readiness state; activation is future-only here.',
      sourceId: 'scope-ci',
    },
  ]
  return stages.map((stage) => {
    const actual = stage.actualSourceId
      ? artifacts.find((entry) => entry.sourceId === stage.actualSourceId && entry.classification === 'completed')
      : undefined
    const readiness = stage.readinessSourceId
      ? artifacts.find((entry) => entry.sourceId === stage.readinessSourceId)
      : undefined
    const artifact = actual ?? readiness ?? artifacts.find((entry) => entry.sourceId === stage.sourceId)
    const classification = artifact?.classification ?? 'not-provided'
    return {
      stepId: stage.stepId,
      label: stage.label,
      summary: stage.summary,
      sourceId: artifact?.sourceId ?? stage.sourceId,
      status: artifact?.status ?? classification,
      authority: actual
        ? 'actual-record'
        : classification === 'blocked'
          ? 'blocked'
          : classification === 'not-provided'
            ? 'not-provided'
            : stage.sourceId === 'baseline'
              ? 'source-summary-only'
              : 'preview-only',
    }
  })
}

function buildEvidenceSummary(
  sources: LoadedArtifact[],
  artifacts: WorkJournalArtifactSummary[],
): WorkJournalEvidenceSummary {
  const instructionPack = findSourceRecord(sources, 'instruction-pack')
  const runtimeReadiness = findSourceRecord(sources, 'runtime-evidence-satisfaction-readiness')
  const runtimeRecord = findSourceRecord(sources, 'runtime-evidence-satisfaction-record')
  const requiredFromInstructionPack = countFirstArray(instructionPack, ['requiredEvidence', 'evidenceRequirements'])
  const requiredFromRuntime = stringValue(runtimeRecord?.requiredEvidenceId || runtimeReadiness?.requiredEvidenceId)
    ? 1
    : null
  const required = requiredFromInstructionPack ?? requiredFromRuntime
  const provided = runtimeRecord?.runtimeEvidenceSatisfied === true ? 1 : 0
  const missing = required === null ? null : Math.max(required - provided, 0)
  const runtimeArtifact = artifacts.find((artifact) => artifact.sourceId === 'runtime-evidence-satisfaction-record')
  const readinessArtifact = artifacts.find(
    (artifact) => artifact.sourceId === 'runtime-evidence-satisfaction-readiness',
  )
  const status =
    runtimeArtifact?.classification === 'completed'
      ? 'actual-runtime-evidence-satisfaction-record-present'
      : (readinessArtifact?.status ?? 'runtime-evidence-readiness-not-provided')
  return { required, provided, missing, status }
}

function buildScopeSummary(
  sources: LoadedArtifact[],
  artifacts: WorkJournalArtifactSummary[],
): WorkJournalScopeSummary {
  const contextPack = findSourceRecord(sources, 'context-pack')
  const instructionPack = findSourceRecord(sources, 'instruction-pack')
  const scopeReadiness = findSourceRecord(sources, 'scope-ci')
  const allowed =
    countFirstArray(contextPack, ['allowedFiles', 'allowedPaths', 'allowedScope']) ??
    countFirstArray(instructionPack, ['allowedFiles', 'allowedPaths', 'allowedScope'])
  const forbidden =
    countFirstArray(contextPack, ['forbiddenFiles', 'forbiddenPaths', 'forbiddenScope']) ??
    countFirstArray(instructionPack, ['forbiddenFiles', 'forbiddenPaths', 'forbiddenScope'])
  const violations =
    numberValue(scopeReadiness?.scopeViolationCount) ??
    countFirstArray(scopeReadiness, ['scopeViolations', 'violations'])
  const protectedPathBlocks =
    numberValue(scopeReadiness?.protectedPathBlockCount) ??
    countFirstArray(scopeReadiness, ['protectedPathBlocks', 'protectedPathsBlocked'])
  const scopeArtifact = artifacts.find((artifact) => artifact.sourceId === 'scope-ci')
  return {
    allowed,
    forbidden,
    violations,
    protectedPathBlocks,
    status: scopeArtifact?.status ?? 'scope-ci-readiness-not-provided',
  }
}

function buildAuthoritySummary(artifacts: WorkJournalArtifactSummary[]): WorkJournalAuthoritySummary {
  const runtimeReadiness = artifacts.find((artifact) => artifact.sourceId === 'runtime-evidence-satisfaction-readiness')
  const runtimeRecord = artifacts.find((artifact) => artifact.sourceId === 'runtime-evidence-satisfaction-record')
  const equivalenceReadiness = artifacts.find((artifact) => artifact.sourceId === 'equivalence-proof-readiness')
  const equivalenceRecord = artifacts.find((artifact) => artifact.sourceId === 'equivalence-proof-record')
  const scopeCi = artifacts.find((artifact) => artifact.sourceId === 'scope-ci')
  return {
    runtimeEvidence: {
      readinessStatus: runtimeReadiness?.status ?? null,
      actualRecordStatus: runtimeRecord?.status ?? null,
      displayState:
        runtimeRecord?.classification === 'completed'
          ? 'actual-record-satisfied'
          : runtimeReadiness?.classification === 'advisory'
            ? 'preview-only-ready'
            : runtimeReadiness?.classification === 'blocked'
              ? 'preview-only-blocked'
              : 'not-provided',
    },
    equivalenceProof: {
      readinessStatus: equivalenceReadiness?.status ?? null,
      actualRecordStatus: equivalenceRecord?.status ?? null,
      displayState:
        equivalenceRecord?.classification === 'completed'
          ? 'actual-record-proven'
          : equivalenceReadiness?.classification === 'advisory'
            ? 'preview-only-ready'
            : equivalenceReadiness?.classification === 'blocked'
              ? 'preview-only-blocked'
              : 'not-provided',
    },
    scopeCi: {
      readinessStatus: scopeCi?.status ?? null,
      activationStatus: 'future-not-provided',
      displayState:
        scopeCi?.classification === 'advisory'
          ? 'preview-only-ready'
          : scopeCi?.classification === 'blocked'
            ? 'preview-only-blocked'
            : 'not-provided',
    },
    journalAuthorityFlags: {
      runtimeEvidenceSatisfied: false,
      evidenceAccepted: false,
      equivalenceProven: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
    },
  }
}

function findSourceRecord(sources: LoadedArtifact[], sourceId: string): JsonRecord | null {
  return sources.find((source) => source.sourceId === sourceId)?.record ?? null
}

function countFirstArray(record: JsonRecord | null | undefined, keys: string[]): number | null {
  if (!record) return null
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) return value.length
    const nested = findArrayByKey(value, key, new Set())
    if (nested) return nested.length
  }
  return null
}

function findArrayByKey(value: unknown, key: string, seen: Set<unknown>): unknown[] | null {
  if (typeof value !== 'object' || value === null || seen.has(value)) return null
  seen.add(value)
  if (Array.isArray(value)) {
    for (const entry of value) {
      const nested = findArrayByKey(entry, key, seen)
      if (nested) return nested
    }
    return null
  }
  const record = value as JsonRecord
  if (Array.isArray(record[key])) return record[key] as unknown[]
  for (const entry of Object.values(record)) {
    const nested = findArrayByKey(entry, key, seen)
    if (nested) return nested
  }
  return null
}

async function assertWorkJournalOutputAuthority(
  root: string,
  sources: LoadedArtifact[],
  outputs: { outputPath: string; dataOutputPath: string; runOutputPath: string },
): Promise<void> {
  const targets = [
    ['HTML output', outputs.outputPath],
    ['data output', outputs.dataOutputPath],
    ['run output', outputs.runOutputPath],
  ] as const
  const seen = new Map<string, string>()
  for (const [label, resolvedPath] of targets) {
    const key = pathKey(resolvedPath)
    const previous = seen.get(key)
    if (previous) {
      throw new Error(`Work Journal output is unsafe: ${label} collides with ${previous}.`)
    }
    seen.set(key, label)
  }

  const protectedPaths = buildProtectedPathMap(root, sources)
  for (const [label, resolvedPath] of targets) {
    const protectedReason = protectedPaths.get(pathKey(resolvedPath))
    if (protectedReason) {
      throw new Error(
        `Work Journal ${label} path is unsafe: ${relativePath(root, resolvedPath)} would overwrite ${protectedReason}.`,
      )
    }
    if (isProtectedControlPath(root, resolvedPath)) {
      throw new Error(
        `Work Journal ${label} path is unsafe: ${relativePath(root, resolvedPath)} is inside a protected source/control path.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(resolvedPath)
    if (existingAuthority) {
      throw new Error(
        `Work Journal ${label} path is unsafe: ${relativePath(root, resolvedPath)} already contains ${existingAuthority}.`,
      )
    }
  }
}

function buildProtectedPathMap(root: string, sources: LoadedArtifact[]): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const addResolved = (candidatePath: string | null, reason: string): void => {
    if (candidatePath) protectedPaths.set(pathKey(candidatePath), reason)
  }
  for (const source of sources) {
    addResolved(source.resolvedPath, `source ${source.label}`)
    if (source.record) {
      for (const candidatePath of collectConcretePathStrings(source.record)) {
        addResolved(resolveRepoPath(root, candidatePath), `linked source artifact ${candidatePath}`)
      }
    }
  }
  return protectedPaths
}

function isProtectedControlPath(root: string, filePath: string): boolean {
  const relative = relativePath(root, filePath)
  if (isAllowedWorkJournalOutput(relative)) return false
  return (
    hasDevViewControlDirectory(relative) ||
    hasCodexControlDirectory(relative) ||
    hasHiddenControlDirectorySegment(relative) ||
    isProtectedRepoSourcePath(relative)
  )
}

function isAllowedWorkJournalOutput(filePath: string): boolean {
  const normalized = filePath.replaceAll('\\', '/').toLowerCase()
  return (
    normalized.startsWith('.devview/generated/work-journal/') ||
    normalized.includes('/.devview/generated/work-journal/')
  )
}

function isProtectedRepoSourcePath(filePath: string): boolean {
  const normalized = filePath.replaceAll('\\', '/').toLowerCase()
  if (
    [
      'readme.md',
      'agents.md',
      'changelog.md',
      'release.md',
      'package.json',
      'package-lock.json',
      'tsconfig.cli.json',
    ].includes(normalized)
  ) {
    return true
  }
  return ['.github/', 'cli/src/', 'docs/', 'examples/', 'schemas/', 'scripts/', 'skills/', 'templates/'].some(
    (prefix) => normalized.startsWith(prefix),
  )
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) return null
  const record = asRecord(parsed.value)
  const artifactRole = stringValue(record?.artifactRole)
  if (!artifactRole || artifactRole === DATA_ROLE) return null
  if (
    artifactRole.includes('graph-source') ||
    artifactRole.includes('read-model') ||
    artifactRole.includes('evidence')
  ) {
    return `source artifactRole "${artifactRole}"`
  }
  if (artifactRole.startsWith('devview-')) return `generated DevView artifactRole "${artifactRole}"`
  if (asRecord(record?.sourceRecords)) return 'source-authority-shaped sourceRecords'
  return null
}

function renderWorkJournalHtml(journal: WorkJournalDataPreview): string {
  const dataJson = JSON.stringify(journal, null, 2)
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DevView Work Journal</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, Segoe UI, Arial, sans-serif;
      --journal-ink: #1f2933;
      --journal-muted: #667085;
      --journal-line: #d8dee8;
      --journal-soft-line: #edf0f4;
      --journal-surface: #ffffff;
      --journal-ground: #f5f7fa;
      --journal-accent: #2563a8;
      --journal-accent-soft: #edf5ff;
      --journal-blocked: #9b2f1f;
      --journal-blocked-soft: #fff0ed;
      --journal-ok: #1f6f4a;
      --journal-ok-soft: #eef8f2;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--journal-ground); color: var(--journal-ink); }
    .shell { min-height: 100vh; display: grid; grid-template-columns: 286px minmax(520px, 1fr) 340px; }
    .rail,
    .inspector {
      background: var(--journal-surface);
      border-color: var(--journal-line);
      min-width: 0;
    }
    .rail { border-right: 1px solid var(--journal-line); padding: 18px 14px; overflow: auto; }
    .workspace { padding: 18px; overflow: auto; min-width: 0; }
    .inspector { border-left: 1px solid var(--journal-line); padding: 18px; overflow: auto; }
    h1 { margin: 0; font-size: 20px; letter-spacing: 0; }
    h2 { margin: 0 0 8px; font-size: 12px; color: var(--journal-muted); font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    h3 { margin: 0 0 8px; font-size: 14px; letter-spacing: 0; }
    p { margin: 0; line-height: 1.45; }
    button { font: inherit; color: inherit; }
    code, pre { font-family: Consolas, ui-monospace, SFMono-Regular, monospace; font-size: 12px; }
    .subtitle { margin-top: 6px; color: var(--journal-muted); line-height: 1.45; font-size: 13px; }
    .badge-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
    .badge,
    .status {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--journal-line);
      border-radius: 999px;
      padding: 3px 7px;
      background: #fbfcfd;
      font-size: 12px;
      min-height: 22px;
    }
    .status.blocked, .authority-blocked { border-color: #f1c8bf; background: var(--journal-blocked-soft); color: var(--journal-blocked); }
    .status.ready-for-review, .status.completed, .authority-actual-record, .authority-actual-record-satisfied, .authority-actual-record-proven { border-color: #c8e6d3; background: var(--journal-ok-soft); color: var(--journal-ok); }
    .status.advisory, .authority-preview-only, .authority-preview-only-ready { border-color: #c9d9ee; background: var(--journal-accent-soft); color: var(--journal-accent); }
    .authority-preview-only-blocked { border-color: #f1c8bf; background: var(--journal-blocked-soft); color: var(--journal-blocked); }
    .status.not-provided, .authority-not-provided, .authority-source-summary-only, .authority-future-not-provided { color: var(--journal-muted); }
    .section { border-top: 1px solid var(--journal-soft-line); padding-top: 14px; margin-top: 14px; }
    .run-list { display: grid; gap: 8px; margin-top: 10px; }
    .run-item,
    .inspect-item {
      width: 100%;
      text-align: left;
      border: 1px solid var(--journal-line);
      background: #fbfcfd;
      border-radius: 6px;
      padding: 9px;
      cursor: pointer;
    }
    .run-item:hover,
    .run-item.active,
    .inspect-item:hover,
    .inspect-item.active {
      border-color: var(--journal-accent);
      background: var(--journal-accent-soft);
    }
    .run-item strong,
    .inspect-item strong {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
    }
    .run-item span,
    .inspect-item span { color: var(--journal-muted); font-size: 12px; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(130px, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    }
    .summary-cell {
      border: 1px solid var(--journal-line);
      border-radius: 6px;
      background: var(--journal-surface);
      padding: 10px;
      min-width: 0;
    }
    .summary-cell span { display: block; color: var(--journal-muted); font-size: 11px; margin-bottom: 4px; }
    .summary-cell strong { display: block; font-size: 14px; overflow-wrap: anywhere; }
    .workflow-panel {
      border: 1px solid var(--journal-line);
      border-radius: 8px;
      background: var(--journal-surface);
      overflow: hidden;
    }
    .workflow-heading {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: baseline;
      padding: 12px 14px;
      border-bottom: 1px solid var(--journal-soft-line);
    }
    .workflow-heading strong { font-size: 13px; }
    .workflow-heading span { color: var(--journal-muted); font-size: 12px; }
    .workflow-step-list {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 12px;
      min-height: 94px;
    }
    .workflow-step {
      min-width: 132px;
      max-width: 156px;
      display: grid;
      grid-template-columns: 22px 1fr;
      gap: 8px;
      align-items: start;
      border: 1px solid var(--journal-line);
      border-radius: 6px;
      background: #fbfcfd;
      padding: 9px;
      cursor: pointer;
    }
    .workflow-step:hover,
    .workflow-step.active { border-color: var(--journal-accent); background: var(--journal-accent-soft); }
    .workflow-index {
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--journal-line);
      border-radius: 50%;
      font-size: 11px;
      color: var(--journal-muted);
      background: #fff;
    }
    .workflow-text { min-width: 0; }
    .workflow-text strong,
    .workflow-text span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .workflow-text strong { font-size: 12px; }
    .workflow-text span { margin-top: 2px; color: var(--journal-muted); font-size: 11px; }
    .decision-panel {
      margin-top: 12px;
      border: 1px solid var(--journal-line);
      border-radius: 8px;
      background: var(--journal-surface);
      padding: 14px;
    }
    .decision-panel .reason { margin-top: 8px; color: var(--journal-muted); font-size: 13px; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin-top: 12px;
    }
    .metric { border: 1px solid var(--journal-soft-line); border-radius: 6px; padding: 8px; }
    .metric span { display: block; color: var(--journal-muted); font-size: 11px; }
    .metric strong { display: block; margin-top: 3px; font-size: 15px; }
    .authority-list { display: grid; gap: 7px; margin-top: 12px; }
    .authority-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
      border: 1px solid var(--journal-soft-line);
      border-radius: 6px;
      padding: 8px;
      font-size: 12px;
    }
    .detail h2 { color: var(--journal-ink); font-size: 16px; text-transform: none; letter-spacing: 0; margin-bottom: 4px; }
    .detail .sub { color: var(--journal-muted); font-size: 12px; margin-bottom: 12px; }
    .detail-row { display: grid; grid-template-columns: 120px 1fr; gap: 10px; border-top: 1px solid var(--journal-soft-line); padding: 8px 0; font-size: 12px; }
    .detail-row span:first-child { color: var(--journal-muted); }
    details { margin-top: 12px; border: 1px solid var(--journal-soft-line); border-radius: 6px; background: #fbfcfd; }
    summary { cursor: pointer; padding: 8px 10px; color: var(--journal-muted); font-size: 12px; }
    pre { margin: 0; padding: 10px; overflow: auto; max-height: 280px; border-top: 1px solid var(--journal-soft-line); white-space: pre-wrap; }
    @media (max-width: 1040px) {
      .shell { grid-template-columns: 1fr; }
      .rail, .inspector { border: 0; border-bottom: 1px solid var(--journal-line); }
      .summary-grid { grid-template-columns: repeat(2, minmax(130px, 1fr)); }
    }
    @media (max-width: 640px) {
      .summary-grid, .metrics { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="rail">
      <h1>DevView Work Journal</h1>
      <p class="subtitle">Cumulative static work history. Report-only; no execution or authority promotion.</p>
      <div class="badge-row">
        <span class="badge">Static HTML</span>
        <span class="badge">Preview shell</span>
        <span class="badge">Inspector</span>
      </div>
      <div class="section">
        <h2>Current Work</h2>
        <div id="current-summary"></div>
      </div>
      <div class="section">
        <h2>Run History</h2>
        <div id="run-list" class="run-list"></div>
      </div>
      <div class="section">
        <h2>Inspect</h2>
        <div id="inspect-actions" class="run-list"></div>
      </div>
    </aside>
    <main class="workspace">
      <div class="summary-grid" id="summary-grid"></div>
      <section class="workflow-panel" aria-label="Current Work Flow">
        <div class="workflow-heading">
          <strong>Current Work Flow</strong>
          <span>Click a step to inspect readiness or actual authority source.</span>
        </div>
        <div id="workflow-step-list" class="workflow-step-list"></div>
      </section>
      <section class="decision-panel" id="decision-panel"></section>
    </main>
    <aside class="inspector">
      <div id="detail" class="detail"></div>
    </aside>
  </div>
  <script type="application/json" id="journal-data">${escapeHtml(dataJson)}</script>
  <script>
    const data = JSON.parse(document.getElementById('journal-data').textContent);
    const state = { selectedRunId: data.currentRunId, selectedStepId: '' };
    function esc(value) {
      return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }
    function currentRun() {
      const runs = data.runs || [];
      return runs.find((entry) => entry.runId === state.selectedRunId) || runs[0] || null;
    }
    function currentStep(run) {
      if (!run) return null;
      return (run.flow || []).find((entry) => entry.stepId === state.selectedStepId) || (run.flow || [])[0] || null;
    }
    function fmt(value) {
      return value === null || value === undefined ? 'unknown' : value;
    }
    function statusClass(value) {
      const text = String(value || '').toLowerCase();
      if (text.includes('blocked')) return 'blocked';
      if (text.includes('record') || text.includes('ready') || text.includes('complete')) return 'completed';
      if (text.includes('not-provided')) return 'not-provided';
      return 'advisory';
    }
    function authorityClass(value) {
      return 'authority-' + String(value || 'not-provided').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    }
    function render() {
      const runs = data.runs || [];
      const run = currentRun();
      if (!run) return;
      if (!state.selectedStepId || !(run.flow || []).some((step) => step.stepId === state.selectedStepId)) {
        const firstBlocked = (run.flow || []).find((step) => step.authority === 'blocked');
        state.selectedStepId = (firstBlocked || (run.flow || [])[0] || {}).stepId || '';
      }
      const step = currentStep(run);
      renderRunList(runs);
      renderCurrentSummary(run);
      renderInspectActions(run);
      renderSummaryGrid(run);
      renderWorkflow(run);
      renderDecision(run);
      renderInspector(run, step);
    }
    function renderRunList(runs) {
      document.getElementById('run-list').innerHTML = runs.map((run) =>
        '<button class="run-item ' + (run.runId === state.selectedRunId ? 'active' : '') + '" data-run="' + esc(run.runId) + '">' +
        '<strong>' + esc(run.title) + '</strong><span>' + esc(run.runId) + '</span><br><span class="status ' + esc(run.status) + '">' + esc(run.status) + '</span></button>'
      ).join('');
      document.querySelectorAll('[data-run]').forEach((button) => button.addEventListener('click', () => {
        state.selectedRunId = button.getAttribute('data-run');
        state.selectedStepId = '';
        render();
      }));
    }
    function renderCurrentSummary(run) {
      document.getElementById('current-summary').innerHTML =
        '<p><strong>' + esc(run.title) + '</strong></p>' +
        '<p class="subtitle">' + esc(run.blockedReason || run.decisionSummary || 'Ready for review.') + '</p>' +
        '<div class="badge-row"><span class="status ' + esc(run.status) + '">' + esc(run.status) + '</span></div>';
    }
    function renderInspectActions(run) {
      document.getElementById('inspect-actions').innerHTML = (run.flow || []).map((step) =>
        '<button class="inspect-item ' + (step.stepId === state.selectedStepId ? 'active' : '') + '" data-step="' + esc(step.stepId) + '">' +
        '<strong>' + esc(step.label) + '</strong><span>' + esc(step.authority) + '</span></button>'
      ).join('');
      document.querySelectorAll('[data-step]').forEach((button) => button.addEventListener('click', () => {
        state.selectedStepId = button.getAttribute('data-step');
        render();
      }));
    }
    function renderSummaryGrid(run) {
      const evidence = run.evidenceSummary || {};
      const scope = run.scopeSummary || {};
      const authority = run.authoritySummary || {};
      const runtime = authority.runtimeEvidence || {};
      const equivalence = authority.equivalenceProof || {};
      document.getElementById('summary-grid').innerHTML =
        '<div class="summary-cell"><span>Status</span><strong>' + esc(run.status) + '</strong></div>' +
        '<div class="summary-cell"><span>Runtime Evidence</span><strong>' + esc(runtime.displayState || 'not-provided') + '</strong></div>' +
        '<div class="summary-cell"><span>Equivalence</span><strong>' + esc(equivalence.displayState || 'not-provided') + '</strong></div>' +
        '<div class="summary-cell"><span>Scope</span><strong>' + esc(scope.status || 'not-provided') + '</strong></div>' +
        '<div class="summary-cell"><span>Evidence required</span><strong>' + esc(fmt(evidence.required)) + '</strong></div>' +
        '<div class="summary-cell"><span>Evidence provided</span><strong>' + esc(fmt(evidence.provided)) + '</strong></div>' +
        '<div class="summary-cell"><span>Evidence missing</span><strong>' + esc(fmt(evidence.missing)) + '</strong></div>' +
        '<div class="summary-cell"><span>Authority</span><strong>journal flags false</strong></div>';
    }
    function renderWorkflow(run) {
      document.getElementById('workflow-step-list').innerHTML = (run.flow || []).map((step, index) =>
        '<button class="workflow-step ' + (step.stepId === state.selectedStepId ? 'active' : '') + '" data-step="' + esc(step.stepId) + '">' +
        '<span class="workflow-index">' + (index + 1) + '</span><span class="workflow-text"><strong>' + esc(step.label) + '</strong><span>' + esc(step.authority) + '</span></span></button>'
      ).join('');
      document.querySelectorAll('[data-step]').forEach((button) => button.addEventListener('click', () => {
        state.selectedStepId = button.getAttribute('data-step');
        render();
      }));
    }
    function renderDecision(run) {
      const evidence = run.evidenceSummary || {};
      const scope = run.scopeSummary || {};
      const authority = run.authoritySummary || {};
      const runtime = authority.runtimeEvidence || {};
      const equivalence = authority.equivalenceProof || {};
      const scopeCi = authority.scopeCi || {};
      document.getElementById('decision-panel').innerHTML =
        '<h3>Selected Run Decision</h3><p>' + esc(run.decisionSummary || run.blockedReason || 'Ready for review.') + '</p>' +
        '<p class="reason"><strong>Next action:</strong> ' + esc(run.nextAction) + '</p>' +
        '<div class="metrics">' +
        '<div class="metric"><span>Evidence</span><strong>' + esc(fmt(evidence.provided)) + ' / ' + esc(fmt(evidence.required)) + '</strong></div>' +
        '<div class="metric"><span>Scope allowed/forbidden</span><strong>' + esc(fmt(scope.allowed)) + ' / ' + esc(fmt(scope.forbidden)) + '</strong></div>' +
        '<div class="metric"><span>Blocks</span><strong>' + esc(fmt(scope.protectedPathBlocks)) + '</strong></div>' +
        '</div>' +
        '<div class="authority-list">' +
        authorityRow('Runtime Evidence', runtime.displayState, runtime.actualRecordStatus || runtime.readinessStatus) +
        authorityRow('Equivalence Proof', equivalence.displayState, equivalence.actualRecordStatus || equivalence.readinessStatus) +
        authorityRow('Scope/CI', scopeCi.displayState, scopeCi.activationStatus || scopeCi.readinessStatus) +
        '</div>';
    }
    function authorityRow(label, stateValue, status) {
      return '<div class="authority-row"><span>' + esc(label) + '</span><span class="status ' + authorityClass(stateValue) + '">' + esc(stateValue || 'not-provided') + '</span></div>' +
        '<div class="authority-row"><span>' + esc(label) + ' source</span><code>' + esc(status || 'not provided') + '</code></div>';
    }
    function renderInspector(run, step) {
      if (!step) {
        document.getElementById('detail').innerHTML = '<h2>No step selected</h2>';
        return;
      }
      const artifacts = run.artifacts || [];
      const primary = artifacts.find((artifact) => artifact.sourceId === step.sourceId);
      const related = artifacts.filter((artifact) => artifact.sourceId === step.sourceId || relatedSourceIds(step.stepId).includes(artifact.sourceId));
      document.getElementById('detail').innerHTML =
        '<h2>' + esc(step.label) + '</h2><p class="sub">' + esc(step.summary) + '</p>' +
        '<div class="detail-row"><span>Status</span><span><code>' + esc(step.status) + '</code></span></div>' +
        '<div class="detail-row"><span>Authority</span><span class="status ' + authorityClass(step.authority) + '">' + esc(step.authority) + '</span></div>' +
        '<div class="detail-row"><span>Source</span><span>' + esc(primary?.label || step.sourceId) + '</span></div>' +
        '<div class="detail-row"><span>Path</span><span><code>' + esc(primary?.path || 'not provided') + '</code></span></div>' +
        '<details><summary>Source artifacts and provenance</summary><pre>' + esc(JSON.stringify(related.length ? related : artifacts, null, 2)) + '</pre></details>' +
        '<details><summary>Run JSON</summary><pre>' + esc(JSON.stringify(run, null, 2)) + '</pre></details>' +
        '<details><summary>Journal safety boundary</summary><pre>' + esc(data.nonExecutionBoundary) + '</pre></details>';
    }
    function relatedSourceIds(stepId) {
      if (stepId === 'runtime-evidence') return ['runtime-evidence-satisfaction-readiness', 'runtime-evidence-satisfaction-record'];
      if (stepId === 'equivalence-proof') return ['equivalence-proof-readiness', 'equivalence-proof-record'];
      return [];
    }
    render();
  </script>
</body>
</html>
`
}

function collectUnsafeAuthorityHits(
  value: unknown,
  pathParts: string[] = [],
  seen = new Set<unknown>(),
  allowedAuthorityPaths = new Set<string>(),
): Array<{ field: string }> {
  if (typeof value !== 'object' || value === null || seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectUnsafeAuthorityHits(entry, [...pathParts, String(index)], seen, allowedAuthorityPaths),
    )
  }
  const record = value as JsonRecord
  const hits: Array<{ field: string }> = []
  for (const [key, entry] of Object.entries(record)) {
    const nextPath = [...pathParts, key]
    if (unsafeAuthorityFields.includes(key) && entry === true && !allowedAuthorityPaths.has(nextPath.join('.'))) {
      hits.push({ field: nextPath.join('.') })
    }
    hits.push(...collectUnsafeAuthorityHits(entry, nextPath, seen, allowedAuthorityPaths))
  }
  return hits
}

function collectConcretePathStrings(value: unknown, seen = new Set<unknown>()): string[] {
  if (typeof value === 'string') return isConcretePath(value) ? [value] : []
  if (typeof value !== 'object' || value === null || seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) return value.flatMap((entry) => collectConcretePathStrings(entry, seen))
  return Object.values(value as JsonRecord).flatMap((entry) => collectConcretePathStrings(entry, seen))
}

function isConcretePath(value: string): boolean {
  return (
    (value.includes('/') || value.includes('\\') || value.startsWith('.')) &&
    /\.(json|md|html|txt|js|ts|yaml|yml)$/i.test(value)
  )
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : null
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const escaped: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return escaped[char] ?? char
  })
}
