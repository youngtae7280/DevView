import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const REPORT_ROLE = 'devview-legacy-cleanup-migration-plan-report'
const REPORT_STATUS = 'devview-legacy-cleanup-migration-plan-reported'

const LEGACY_PATTERN = /PBE|Project Blueprint Engine|\bpbe\b|\.pbe/g
const TEXT_EXTENSIONS = new Set([
  '',
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsonc',
  '.md',
  '.mjs',
  '.ps1',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
])
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', '.tmp', 'coverage'])
const MAX_REFS = 25

export type LegacyCleanupScope = 'examples' | 'all'
export type LegacyCleanupOperationKind =
  | 'rename-path'
  | 'rewrite-content'
  | 'move-to-internal-legacy'
  | 'delete-candidate'
  | 'keep-internal-hidden-compatibility'
export type LegacyCleanupClassification =
  | 'canonical-devview'
  | 'needs-devview-rename'
  | 'migration-fixture-only'
  | 'delete-candidate'
  | 'internal-hidden-compatibility'
export type LegacyCleanupRiskLevel = 'low' | 'medium' | 'high'
export type CollisionStatus = 'no-collision' | 'collision-detected' | 'source-missing' | 'not-applicable'

export interface LegacyCleanupOperation {
  operationId: string
  operationKind: LegacyCleanupOperationKind
  sourcePath: string
  targetPath?: string
  recommendedAction: string
  classification: LegacyCleanupClassification
  riskLevel: LegacyCleanupRiskLevel
  dependencyRefs: string[]
  dependencyRefCount: number
  blockingRefs: string[]
  blockingRefCount: number
  collisionStatus: CollisionStatus
  rationale: string
}

export interface LegacyCleanupMigrationPlanReport {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof REPORT_STATUS
  dryRun: true
  scope: LegacyCleanupScope
  scannedRoot: string
  scannedFileCount: number
  legacyReferenceFileCount: number
  legacyReferenceCount: number
  operations: LegacyCleanupOperation[]
  operationCount: number
  operationSummaryByKind: Record<LegacyCleanupOperationKind, number>
  operationSummaryByClassification: Record<LegacyCleanupClassification, number>
  operationSummaryByRisk: Record<LegacyCleanupRiskLevel, number>
  scopeLimitations: string[]
  grepAcceptanceCriteria: string[]
  cleanupMode: 'dry-run-report-only'
  filesMutated: false
  deletionsPerformed: false
  renamesPerformed: false
  graphSourceMutated: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  providerInvoked: false
  networkCallMade: false
  next: string
  writtenOutputPath?: string
  markdownReportPath?: string
}

export interface LegacyCleanupMigrationPlanOptions {
  dryRun: boolean
  scope?: string
  output?: string
  markdown?: string
}

interface TextFile {
  absolutePath: string
  relativePath: string
  text: string
}

export function reportLegacyCleanupMigrationPlan(
  root: string,
  options: LegacyCleanupMigrationPlanOptions,
): LegacyCleanupMigrationPlanReport {
  if (!options.dryRun) {
    throw new Error('cleanup-legacy is dry-run only in this slice. Rerun with --dry-run.')
  }

  const scope = normalizeScope(options.scope)
  const absoluteRoot = resolve(root)
  assertOutputAuthority(absoluteRoot, options)

  const textFiles = listTextFiles(absoluteRoot)
  const scopeFiles = textFiles.filter((file) => isInScope(file.relativePath, scope))
  const legacyFiles = scopeFiles.filter((file) => {
    LEGACY_PATTERN.lastIndex = 0
    return LEGACY_PATTERN.test(file.text)
  })
  const legacyReferenceCount = legacyFiles.reduce((count, file) => count + countLegacyMatches(file.text), 0)
  const operations = buildOperations(absoluteRoot, textFiles)
  const report: LegacyCleanupMigrationPlanReport = {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: REPORT_STATUS,
    dryRun: true,
    scope,
    scannedRoot: absoluteRoot,
    scannedFileCount: scopeFiles.length,
    legacyReferenceFileCount: legacyFiles.length,
    legacyReferenceCount,
    operations,
    operationCount: operations.length,
    operationSummaryByKind: summarizeBy(operations, 'operationKind', emptyKindSummary()),
    operationSummaryByClassification: summarizeBy(operations, 'classification', emptyClassificationSummary()),
    operationSummaryByRisk: summarizeBy(operations, 'riskLevel', emptyRiskSummary()),
    scopeLimitations: buildScopeLimitations(scope),
    grepAcceptanceCriteria: buildGrepAcceptanceCriteria(),
    cleanupMode: 'dry-run-report-only',
    filesMutated: false,
    deletionsPerformed: false,
    renamesPerformed: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    providerInvoked: false,
    networkCallMade: false,
    next: 'Review this dry-run operation plan, resolve collisions, then run a separate reviewed implementation slice for the selected rename, move, rewrite, or deletion operations.',
  }

  const finalReport = {
    ...report,
    ...(options.output ? { writtenOutputPath: options.output } : {}),
    ...(options.markdown ? { markdownReportPath: options.markdown } : {}),
  }

  if (options.output) {
    const outputPath = resolve(absoluteRoot, options.output)
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, `${JSON.stringify(finalReport, null, 2)}\n`, 'utf8')
  }
  if (options.markdown) {
    const markdownPath = resolve(absoluteRoot, options.markdown)
    mkdirSync(dirname(markdownPath), { recursive: true })
    writeFileSync(markdownPath, renderMarkdown(finalReport), 'utf8')
  }

  return finalReport
}

function normalizeScope(scope: string | undefined): LegacyCleanupScope {
  if (!scope || scope === 'examples') return 'examples'
  if (scope === 'all') return 'all'
  throw new Error('cleanup-legacy --scope requires one of: examples, all.')
}

function isInScope(relativeFile: string, scope: LegacyCleanupScope): boolean {
  return scope === 'all' || relativeFile.startsWith('examples/')
}

function buildOperations(root: string, files: TextFile[]): LegacyCleanupOperation[] {
  const operations: Omit<LegacyCleanupOperation, 'operationId'>[] = []

  addIfRelevant(operations, buildTodoFixtureRename(root, files))
  addIfRelevant(operations, buildRewriteOperation(root, files, 'examples/README.md'))
  addIfRelevant(operations, buildRewriteOperation(root, files, 'examples/internal-legacy/read-model-aggregate'))
  addIfRelevant(operations, buildRewriteOperation(root, files, 'examples/valid/todo-app-devview-run/generated'))
  addIfRelevant(operations, buildPbeStorageCompatibilityOperation(root, files))
  addIfRelevant(operations, buildInternalLegacyBoundaryOperation(root, files))

  for (const group of ['adoption', 'dogfooding', 'native', 'retrofit', 'intent-critical']) {
    addIfRelevant(operations, buildExampleGroupOperation(root, files, `examples/${group}`))
  }

  const hiddenAliasOperations = buildHiddenAliasOperations(root, files)
  operations.push(...hiddenAliasOperations)

  return operations.map((operation, index) => ({
    operationId: `legacy-cleanup-op-${String(index + 1).padStart(3, '0')}`,
    ...operation,
  }))
}

function addIfRelevant(
  operations: Omit<LegacyCleanupOperation, 'operationId'>[],
  operation: Omit<LegacyCleanupOperation, 'operationId'> | null,
): void {
  if (operation) operations.push(operation)
}

function buildTodoFixtureRename(root: string, files: TextFile[]): Omit<LegacyCleanupOperation, 'operationId'> | null {
  const sourcePath = 'examples/valid/todo-app-pbe-run'
  if (!existsSync(join(root, sourcePath))) return null
  const targetPath = 'examples/valid/todo-app-devview-run'
  const refs = findReferences(files, sourcePath, { excludePrefix: `${sourcePath}/` })
  return {
    operationKind: 'rename-path',
    sourcePath,
    targetPath,
    recommendedAction:
      'Rename the canonical Todo App generated fixture path after updating tests, scripts, aggregate registry entries, calibration docs, and generated provenance.',
    classification: 'needs-devview-rename',
    riskLevel: 'high',
    dependencyRefs: refs.slice(0, MAX_REFS),
    dependencyRefCount: refs.length,
    blockingRefs: refs.slice(0, MAX_REFS),
    blockingRefCount: refs.length,
    collisionStatus: collisionStatus(root, sourcePath, targetPath),
    rationale:
      'This legacy Todo App fixture path should move to the canonical DevView fixture path after active references are updated.',
  }
}

function buildRewriteOperation(
  root: string,
  files: TextFile[],
  sourcePath: string,
): Omit<LegacyCleanupOperation, 'operationId'> | null {
  const absolute = join(root, sourcePath)
  if (!existsSync(absolute)) return null
  const relevantFiles = files.filter(
    (file) => file.relativePath === sourcePath || file.relativePath.startsWith(`${sourcePath}/`),
  )
  const filesWithActionableLegacy = relevantFiles.filter((file) => countActionableLegacyMatches(file, sourcePath) > 0)
  const legacyCount = filesWithActionableLegacy.reduce(
    (count, file) => count + countActionableLegacyMatches(file, sourcePath),
    0,
  )
  if (legacyCount === 0) return null
  const internalLegacy = sourcePath.startsWith('examples/internal-legacy/')
  return {
    operationKind: 'rewrite-content',
    sourcePath,
    recommendedAction: internalLegacy
      ? 'Keep this internal legacy fixture as migration material until a later reviewed archive-retirement slice rewrites or deletes it.'
      : 'Rewrite legacy command identities, product names, and path provenance to DevView terminology during the matching fixture migration slice.',
    classification: internalLegacy ? 'internal-hidden-compatibility' : 'needs-devview-rename',
    riskLevel: internalLegacy ? 'medium' : sourcePath.includes('/generated') ? 'high' : 'medium',
    dependencyRefs: filesWithActionableLegacy.map((file) => file.relativePath).slice(0, MAX_REFS),
    dependencyRefCount: filesWithActionableLegacy.length,
    blockingRefs: filesWithActionableLegacy.map((file) => file.relativePath).slice(0, MAX_REFS),
    blockingRefCount: filesWithActionableLegacy.length,
    collisionStatus: 'not-applicable',
    rationale: `Found ${legacyCount} legacy references under ${sourcePath}.`,
  }
}

function buildPbeStorageCompatibilityOperation(
  root: string,
  files: TextFile[],
): Omit<LegacyCleanupOperation, 'operationId'> | null {
  const legacyStorageDirectory = '.pbe'
  const sourcePath = ['examples', 'valid', 'todo-app-devview-run', legacyStorageDirectory].join('/')
  if (!existsSync(join(root, sourcePath))) return null
  const refs = findReferences(files, legacyStorageDirectory).filter((entry) => entry.startsWith('examples/'))
  return {
    operationKind: 'keep-internal-hidden-compatibility',
    sourcePath,
    recommendedAction:
      'Keep legacy tree-native storage as migration-test input until a separate storage resolver and dry-run migration slice exists.',
    classification: 'internal-hidden-compatibility',
    riskLevel: 'high',
    dependencyRefs: refs.slice(0, MAX_REFS),
    dependencyRefCount: refs.length,
    blockingRefs: refs.slice(0, MAX_REFS),
    blockingRefCount: refs.length,
    collisionStatus: 'not-applicable',
    rationale:
      'Storage paths are currently part of validators, sourceArtifact provenance, output guards, and migration fixtures.',
  }
}

function buildInternalLegacyBoundaryOperation(
  root: string,
  files: TextFile[],
): Omit<LegacyCleanupOperation, 'operationId'> | null {
  const sourcePath = 'examples/internal-legacy'
  if (!existsSync(join(root, sourcePath))) return null
  const internalFiles = files.filter((file) => file.relativePath.startsWith(`${sourcePath}/`))
  if (internalFiles.length === 0) return null
  const legacyCount = internalFiles.reduce((count, file) => count + countLegacyMatches(file.text), 0)
  const refs = findReferences(files, sourcePath, { excludePrefix: `${sourcePath}/` })
  return {
    operationKind: 'keep-internal-hidden-compatibility',
    sourcePath,
    recommendedAction:
      'Keep historical example groups behind the internal boundary until selected migration fixtures are renamed, rewritten, or deleted by reviewed follow-up slices.',
    classification: 'internal-hidden-compatibility',
    riskLevel: 'high',
    dependencyRefs: refs.slice(0, MAX_REFS),
    dependencyRefCount: refs.length,
    blockingRefs: refs.slice(0, MAX_REFS),
    blockingRefCount: refs.length,
    collisionStatus: 'not-applicable',
    rationale: `Internal boundary contains ${internalFiles.length} text files with ${legacyCount} remaining legacy references for migration audit coverage.`,
  }
}

function buildExampleGroupOperation(
  root: string,
  files: TextFile[],
  sourcePath: string,
): Omit<LegacyCleanupOperation, 'operationId'> | null {
  if (!existsSync(join(root, sourcePath))) return null
  const groupFiles = files.filter((file) => file.relativePath.startsWith(`${sourcePath}/`))
  const legacyCount = groupFiles.reduce((count, file) => count + countLegacyMatches(file.text), 0)
  if (legacyCount === 0) return null
  const refs = findReferences(files, sourcePath, { excludePrefix: `${sourcePath}/` })
  const operationKind: LegacyCleanupOperationKind = refs.length > 0 ? 'move-to-internal-legacy' : 'delete-candidate'
  const targetPath =
    operationKind === 'move-to-internal-legacy'
      ? sourcePath.replace('examples/', 'examples/internal-legacy/')
      : undefined
  return {
    operationKind,
    sourcePath,
    ...(targetPath ? { targetPath } : {}),
    recommendedAction:
      operationKind === 'move-to-internal-legacy'
        ? 'Move this historical example group behind an internal legacy boundary, then update or remove public references.'
        : 'Delete or archive this historical example group after confirming no active validation dependency remains.',
    classification: operationKind === 'move-to-internal-legacy' ? 'migration-fixture-only' : 'delete-candidate',
    riskLevel: refs.length > 5 ? 'high' : 'medium',
    dependencyRefs: refs.slice(0, MAX_REFS),
    dependencyRefCount: refs.length,
    blockingRefs: refs.slice(0, MAX_REFS),
    blockingRefCount: refs.length,
    collisionStatus: targetPath ? collisionStatus(root, sourcePath, targetPath) : 'not-applicable',
    rationale: `Found ${legacyCount} legacy references under ${sourcePath}.`,
  }
}

function buildHiddenAliasOperations(root: string, files: TextFile[]): Omit<LegacyCleanupOperation, 'operationId'>[] {
  const candidates = [
    'package.json#bin.pbe',
    'package.json#scripts.pbe',
    'package.json#scripts.validate:pbe',
    'scripts/validate-pbe-files.js',
    'scripts/validate-pbe-tree-system.js',
    'scripts/validators/pbe-layout.js',
    'scripts/invoke-pbe-v0.ps1',
  ]
  return candidates
    .filter((sourcePath) => hiddenAliasExists(root, sourcePath))
    .map((sourcePath) => {
      const literal = sourcePath.includes('#') ? sourcePath.split('#')[0] : sourcePath
      const refs = findReferences(files, literal)
      return {
        operationKind: 'keep-internal-hidden-compatibility',
        sourcePath,
        recommendedAction:
          'Keep as hidden transition compatibility until DevView-named script and workflow replacements are in place.',
        classification: 'internal-hidden-compatibility',
        riskLevel: 'medium',
        dependencyRefs: refs.slice(0, MAX_REFS),
        dependencyRefCount: refs.length,
        blockingRefs: refs.slice(0, MAX_REFS),
        blockingRefCount: refs.length,
        collisionStatus: 'not-applicable',
        rationale:
          'Compatibility alias is outside the examples scope but still affects future zero-legacy acceptance criteria.',
      } satisfies Omit<LegacyCleanupOperation, 'operationId'>
    })
}

function hiddenAliasExists(root: string, sourcePath: string): boolean {
  if (sourcePath.includes('#')) {
    const [file, pointer] = sourcePath.split('#')
    const absoluteFile = join(root, file)
    if (!existsSync(absoluteFile)) return false
    const text = readFileSync(absoluteFile, 'utf8')
    return text.includes(pointer.replace(/\./g, '')) || text.includes('validate:pbe') || text.includes('"pbe"')
  }
  return existsSync(join(root, sourcePath))
}

function findReferences(files: TextFile[], needle: string, options: { excludePrefix?: string } = {}): string[] {
  const normalizedNeedle = normalize(needle)
  const refs = new Set<string>()
  for (const file of files) {
    if (options.excludePrefix && file.relativePath.startsWith(options.excludePrefix)) continue
    if (file.text.includes(normalizedNeedle) || file.text.includes(normalizedNeedle.replaceAll('/', '\\'))) {
      refs.add(file.relativePath)
    }
  }
  return [...refs].sort()
}

function collisionStatus(root: string, sourcePath: string, targetPath: string): CollisionStatus {
  if (!existsSync(join(root, sourcePath))) return 'source-missing'
  return existsSync(join(root, targetPath)) ? 'collision-detected' : 'no-collision'
}

function countLegacyMatches(text: string): number {
  LEGACY_PATTERN.lastIndex = 0
  return [...text.matchAll(LEGACY_PATTERN)].length
}

function countActionableLegacyMatches(file: TextFile, sourcePath: string): number {
  if (!sourcePath.startsWith('examples/valid/todo-app-devview-run')) {
    return countLegacyMatches(file.text)
  }

  return file.text
    .split(/\r?\n/)
    .filter((line) => !line.includes('.pbe'))
    .reduce((count, line) => count + countLegacyMatches(line), 0)
}

function listTextFiles(root: string): TextFile[] {
  const files: TextFile[] = []
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue
        visit(join(dir, entry.name))
        continue
      }
      if (!entry.isFile()) continue
      const absolutePath = join(dir, entry.name)
      if (!isTextFile(absolutePath)) continue
      files.push({
        absolutePath,
        relativePath: normalize(relative(root, absolutePath)),
        text: readFileSync(absolutePath, 'utf8'),
      })
    }
  }
  visit(root)
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

function isTextFile(file: string): boolean {
  const name = file.toLowerCase()
  const dot = name.lastIndexOf('.')
  const ext = dot >= 0 ? name.slice(dot) : ''
  if (!TEXT_EXTENSIONS.has(ext)) return false
  try {
    return statSync(file).size <= 2_000_000
  } catch {
    return false
  }
}

function summarizeBy<T extends string>(
  operations: LegacyCleanupOperation[],
  key: 'operationKind' | 'classification' | 'riskLevel',
  summary: Record<T, number>,
): Record<T, number> {
  for (const operation of operations) {
    const value = operation[key] as T
    summary[value] = (summary[value] || 0) + 1
  }
  return summary
}

function emptyKindSummary(): Record<LegacyCleanupOperationKind, number> {
  return {
    'rename-path': 0,
    'rewrite-content': 0,
    'move-to-internal-legacy': 0,
    'delete-candidate': 0,
    'keep-internal-hidden-compatibility': 0,
  }
}

function emptyClassificationSummary(): Record<LegacyCleanupClassification, number> {
  return {
    'canonical-devview': 0,
    'needs-devview-rename': 0,
    'migration-fixture-only': 0,
    'delete-candidate': 0,
    'internal-hidden-compatibility': 0,
  }
}

function emptyRiskSummary(): Record<LegacyCleanupRiskLevel, number> {
  return {
    low: 0,
    medium: 0,
    high: 0,
  }
}

function buildScopeLimitations(scope: LegacyCleanupScope): string[] {
  const limitations = [
    'This command reports migration operations only; it does not rename, move, rewrite, delete, or migrate storage.',
    'Storage migration to a future canonical project-local root is out of scope for this slice.',
    'Graph-source mutation, runtime Evidence satisfaction, equivalence proof, scope/CI enforcement, provider invocation, and network calls are out of scope.',
  ]
  if (scope === 'examples') {
    limitations.push(
      'The examples scope is primary; hidden CLI/script aliases are included only as cross-scope blockers for future zero-legacy cleanup.',
    )
  }
  return limitations
}

function buildGrepAcceptanceCriteria(): string[] {
  return [
    'rg -n "PBE|Project Blueprint Engine|\\bpbe\\b|\\.pbe" README.md docs docs/index.md docs/cli-reference.md => zero public-doc matches.',
    'git grep -n "todo-app-pbe-run" -- . => zero active canonical fixture path references outside explicitly allowlisted internal migration fixtures.',
    'git grep -n "\\.pbe" -- examples ":!examples/internal-legacy/**" => zero public/canonical example storage matches after active Todo fixture storage migration.',
    'rg -n "\\bpbe\\b|PBE_|Project Blueprint Engine|validate:pbe|validate-pbe|pbe-layout|invoke-pbe" package.json package-lock.json .github cli scripts => state-machine/storage guards or explicitly reviewed internal legacy compatibility only.',
    'rg -n "\\.pbe" cli/src scripts examples docs => legacy storage guard, hidden compatibility, or internal migration fixtures only.',
  ]
}

function assertOutputAuthority(root: string, options: Pick<LegacyCleanupMigrationPlanOptions, 'output' | 'markdown'>) {
  const targets: Array<{ label: string; requestedPath: string }> = []
  if (options.output) targets.push({ label: 'JSON output', requestedPath: options.output })
  if (options.markdown) targets.push({ label: 'Markdown output', requestedPath: options.markdown })
  const resolvedTargets = targets.map(({ label, requestedPath }) => ({
    label,
    requestedPath,
    resolvedPath: resolve(root, requestedPath),
  }))

  if (resolvedTargets.length === 2 && resolvedTargets[0].resolvedPath === resolvedTargets[1].resolvedPath) {
    throw new Error('Legacy cleanup dry-run output is unsafe: --output and --markdown must be different paths.')
  }

  for (const target of resolvedTargets) {
    const reason = classifyProtectedOutputPath(root, target.resolvedPath)
    if (reason) {
      throw new Error(
        `Legacy cleanup dry-run ${target.label} path is unsafe: ${target.requestedPath} would write to ${reason}.`,
      )
    }
  }
}

function classifyProtectedOutputPath(root: string, filePath: string): string | null {
  const relativePath = normalize(relative(root, filePath))
  if (relativePath === 'README.md') return 'the public README'
  if (relativePath === 'package.json' || relativePath === 'package-lock.json') return 'package metadata'
  if (relativePath.startsWith('docs/')) return 'public or historical docs'
  if (relativePath.startsWith('examples/')) return 'example source or generated artifacts'
  if (relativePath === '.devview' || relativePath.startsWith('.devview/')) return 'future canonical storage'
  if (relativePath === '.pbe' || relativePath.startsWith('.pbe/')) return 'legacy storage'
  if (relativePath === '.codex' || relativePath.startsWith('.codex/')) return 'Codex configuration'
  if (relativePath.startsWith('.codex-plugin/')) return 'plugin configuration'
  if (relativePath.includes('/.pbe/') || relativePath.includes('/.devview/') || relativePath.includes('/.codex/')) {
    return 'protected source/control storage'
  }
  if (relativePath.includes('/generated/') || relativePath.endsWith('/generated')) return 'generated artifact area'
  if (/graph-source|read-model|source-authority|project-memory|hook|config/i.test(relativePath)) {
    return 'source authority, read-model, hook, config, or project memory artifact'
  }
  if (relativePath.startsWith('..')) return 'outside the repository root'
  return null
}

function renderMarkdown(report: LegacyCleanupMigrationPlanReport): string {
  const lines = [
    '# DevView Legacy Cleanup Migration Plan',
    '',
    `Status: ${report.status}`,
    `Scope: ${report.scope}`,
    `Dry run: ${String(report.dryRun)}`,
    `Operations: ${report.operationCount}`,
    '',
    '## Safety',
    '',
    '- filesMutated: false',
    '- deletionsPerformed: false',
    '- renamesPerformed: false',
    '- graphSourceMutated: false',
    '- runtimeEvidenceSatisfied: false',
    '- evidenceAccepted: false',
    '- equivalenceProven: false',
    '- scopeEnforced: false',
    '- ciEnforcementEnabled: false',
    '- providerInvoked: false',
    '- networkCallMade: false',
    '',
    '## Operation Summary',
    '',
    ...Object.entries(report.operationSummaryByKind).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Planned Operations',
    '',
  ]

  for (const operation of report.operations) {
    lines.push(
      `### ${operation.operationId}: ${operation.operationKind}`,
      '',
      `- sourcePath: ${operation.sourcePath}`,
      ...(operation.targetPath ? [`- targetPath: ${operation.targetPath}`] : []),
      `- classification: ${operation.classification}`,
      `- riskLevel: ${operation.riskLevel}`,
      `- collisionStatus: ${operation.collisionStatus}`,
      `- dependencyRefCount: ${operation.dependencyRefCount}`,
      `- recommendedAction: ${operation.recommendedAction}`,
      '',
    )
  }

  lines.push('## Acceptance Criteria', '')
  for (const criterion of report.grepAcceptanceCriteria) {
    lines.push(`- ${criterion}`)
  }
  lines.push('')

  return `${lines.join('\n')}\n`
}

function normalize(value: string): string {
  return value.replace(/\\/g, '/')
}
