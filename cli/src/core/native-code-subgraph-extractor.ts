import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import * as ts from 'typescript'
import { relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'
import {
  CodeSubgraphValidationError,
  type CodeSubgraphValidationReport,
  validateCodeSubgraphRecord,
} from './code-subgraph-validation.js'
import { matchScopeCompliancePathPattern } from './scope-compliance-path-pattern.js'

type JsonRecord = Record<string, unknown>
type CodeNodeKind = 'file' | 'class' | 'interface' | 'type' | 'function' | 'method' | 'field' | 'external_dependency'
type SymbolNodeKind = Exclude<CodeNodeKind, 'file' | 'external_dependency'>
type Confidence = 'extracted' | 'inferred' | 'ambiguous'
type ImportBindingKind = 'default' | 'named' | 'namespace' | 'require'
export type NativeCodeSubgraphExtractionProfile = 'graphify-compatible' | 'rich'

const REPORT_ROLE = 'devview-native-code-subgraph-extraction-report'
const PASSED_STATUS = 'devview-native-code-subgraph-extraction-passed'
const BLOCKED_STATUS = 'devview-native-code-subgraph-extraction-blocked'
const REPORT_SCOPE = 'native-js-ts-code-subgraph-static-extraction-report-only'
const CODE_SUBGRAPH_ROLE = 'devview-code-subgraph'
const CODE_SUBGRAPH_STATUS = 'devview-code-subgraph-supplied'
const CODE_SUBGRAPH_SCOPE = 'code-subgraph-source-fact-only'
const EXTRACTOR_ID = 'native-static-js-ts-ast'
const DEFAULT_EXTRACTION_PROFILE: NativeCodeSubgraphExtractionProfile = 'graphify-compatible'

const supportedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const importLikeEdgeKinds = new Set(['imports', 'imports_from', 're_exports'])
const callLikeEdgeKinds = new Set(['calls', 'constructs', 'references'])
const skippedDirectories = new Set([
  '.git',
  '.devview',
  '.codex',
  '.tmp',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
])
const maxFileBytes = 1_000_000
const maxSupportedFiles = 1_000
const maxAmbiguousNamesInFinding = 50

export interface NativeCodeSubgraphExtractorOptions {
  targetRepo?: string
  include?: string[]
  extractionProfile?: NativeCodeSubgraphExtractionProfile
  output?: string
  validationOutput?: string
  markdown?: string
}

export interface NativeCodeSubgraphExtractionFinding {
  severity: 'blocker' | 'warning' | 'satisfied'
  code: string
  message: string
  field?: string
  path?: string
}

export interface NativeCodeSubgraphExtractionReport extends JsonRecord {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof PASSED_STATUS | typeof BLOCKED_STATUS
  extractionScope: typeof REPORT_SCOPE
  extractionProfile: NativeCodeSubgraphExtractionProfile
  sourceFactsOnly: true
  reportOnly: true
  extractionMode: typeof EXTRACTOR_ID
  targetRepo: {
    path: string
    supportedFileCount: number
    unsupportedFileCount: number
    skippedLargeFileCount: number
    scannedByteCount: number
  }
  outputCodeSubgraph: {
    path: string
    artifactRole: typeof CODE_SUBGRAPH_ROLE
    status: typeof CODE_SUBGRAPH_STATUS
    scope: typeof CODE_SUBGRAPH_SCOPE
    nodeCount: number
    edgeCount: number
  }
  validationOutput: {
    path: string
    status: string | null
    codeSubgraphValidationStatus: string | null
  }
  extractionSummary: {
    fileNodeCount: number
    classNodeCount: number
    interfaceNodeCount: number
    typeNodeCount: number
    functionNodeCount: number
    methodNodeCount: number
    fieldNodeCount: number
    externalDependencyNodeCount: number
    filesWithSymbolNodeCount: number
    importEdgeCount: number
    callEdgeCount: number
    constructEdgeCount: number
    referenceEdgeCount: number
    callLikeEdgeCount: number
    containsEdgeCount: number
    unsupportedExtensions: Record<string, number>
    includePatterns: string[]
    ambiguousCallCount: number
    ambiguousCallNames: string[]
    profileFilteredExternalCallLikeEdgeCount: number
    profileFilteredDuplicateCallLikeEdgeCount: number
  }
  extractionFindings: NativeCodeSubgraphExtractionFinding[]
  downstreamActionPlan: string[]
  graphifyExecuted: false
  astExtractorExecuted: false
  providerInvoked: false
  networkCallMade: false
  apiCallMade: false
  shellCommandsExecuted: false
  extensionExecutionAllowed: false
  graphSourceMutated: false
  graphDeltaApplied: false
  viewTreeGenerated: false
  contextPackGenerated: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  rbacEnforced: false
  permissionVerified: false
  cryptographicSignatureVerified: false
  enterpriseGateActivated: false
  writtenCodeSubgraphPath?: string
  writtenValidationOutputPath?: string
  writtenMarkdownPath?: string
}

interface SourceFileRecord {
  relativePath: string
  absolutePath: string
  content: string
  digest: string
  byteLength: number
  ast: ts.SourceFile
}

interface SymbolRecord {
  id: string
  name: string
  qualifiedName: string
  kind: SymbolNodeKind
  sourceFile: string
  declaration: ts.Node
  parentClassId?: string
}

interface ImportBinding {
  localName: string
  importedName: string
  specifier: string
  targetFile: string | null
  kind: ImportBindingKind
  typeOnly: boolean
}

interface ReExportBinding {
  exportedName: string
  importedName: string
  targetFile: string | null
}

interface FileIndex {
  sourceFile: SourceFileRecord
  fileNodeId: string
  symbols: SymbolRecord[]
  localSymbolsByName: Map<string, SymbolRecord[]>
  exportedSymbolsByName: Map<string, SymbolRecord[]>
  importedBindingsByLocalName: Map<string, ImportBinding[]>
  namespaceImportsByLocalName: Map<string, ImportBinding[]>
  reExportsByName: Map<string, ReExportBinding[]>
  starReExportTargets: string[]
  classMethodsByClassIdAndName: Map<string, SymbolRecord[]>
  classSymbolsByName: Map<string, SymbolRecord[]>
}

interface ResolvedTarget {
  id: string
  confidence: Confidence
}

interface ExtractionState {
  findings: NativeCodeSubgraphExtractionFinding[]
  nodes: JsonRecord[]
  edges: JsonRecord[]
  symbols: SymbolRecord[]
  symbolsByName: Map<string, SymbolRecord[]>
  symbolsByDeclaration: Map<ts.Node, SymbolRecord>
  fileNodesByRelativePath: Map<string, string>
  fileIndexesByRelativePath: Map<string, FileIndex>
  externalNodeIdsBySpecifier: Map<string, string>
  externalNodeIds: Set<string>
  graphifyCompatibleCallLikeEdgeKeys: Set<string>
  profileFilteredExternalCallLikeEdgeCount: number
  profileFilteredDuplicateCallLikeEdgeCount: number
  seenNodeIds: Set<string>
  seenEdgeIds: Set<string>
  unsupportedExtensions: Record<string, number>
  includePatterns: string[]
  includedSourcePaths: string[]
  supportedFileCount: number
  unsupportedFileCount: number
  skippedLargeFileCount: number
  scannedByteCount: number
  ambiguousCallNames: Set<string>
  extractionProfile: NativeCodeSubgraphExtractionProfile
}

export class NativeCodeSubgraphExtractionError extends Error {
  readonly report: NativeCodeSubgraphExtractionReport

  constructor(report: NativeCodeSubgraphExtractionReport) {
    super('Native code subgraph static extraction is blocked.')
    this.report = report
  }
}

export async function extractNativeCodeSubgraphFile(
  root: string,
  options: NativeCodeSubgraphExtractorOptions,
): Promise<NativeCodeSubgraphExtractionReport> {
  validateRequiredOptions(options)
  const targetRepoPath = resolveRepoPath(root, options.targetRepo ?? '')
  await assertOutputAuthority(root, targetRepoPath, [], options)

  const includePatterns = parseIncludePatterns(options.include)
  const extractionProfile = normalizeExtractionProfile(options.extractionProfile)
  const state = await extractCodeSubgraph(targetRepoPath, includePatterns, extractionProfile)
  let blocked = state.findings.some((finding) => finding.severity === 'blocker')
  await assertOutputAuthority(root, targetRepoPath, state.includedSourcePaths, options)
  const codeSubgraph = buildCodeSubgraph(root, targetRepoPath, state)
  let validationReport: CodeSubgraphValidationReport | null = null

  if (!blocked) {
    try {
      validationReport = validateCodeSubgraphRecord(root, options.output ?? '', codeSubgraph)
    } catch (error) {
      blocked = true
      if (error instanceof CodeSubgraphValidationError) {
        validationReport = error.report
        state.findings.push(
          ...error.report.validationFindings.map((finding) =>
            blocker(
              `NATIVE_CODE_SUBGRAPH_${finding.code}`,
              `Generated native code subgraph failed validation: ${finding.message}`,
              finding.field,
              finding.path,
            ),
          ),
        )
      } else {
        state.findings.push(
          blocker(
            'NATIVE_CODE_SUBGRAPH_VALIDATION_FAILED',
            error instanceof Error ? error.message : String(error),
            undefined,
            options.output,
          ),
        )
      }
    }
  }

  if (blocked) {
    throw new NativeCodeSubgraphExtractionError(
      buildReport(root, targetRepoPath, state, validationReport, true, options),
    )
  }

  const outputPath = resolveRepoPath(root, options.output ?? '')
  const validationOutputPath = resolveRepoPath(root, options.validationOutput ?? '')
  await writeJsonAtomic(outputPath, codeSubgraph)
  if (validationReport) {
    validationReport.writtenOutputPath = relativePath(root, validationOutputPath)
    await writeJsonAtomic(validationOutputPath, validationReport)
  }

  const report = buildReport(root, targetRepoPath, state, validationReport, false, options)
  report.writtenCodeSubgraphPath = relativePath(root, outputPath)
  report.writtenValidationOutputPath = relativePath(root, validationOutputPath)
  if (options.markdown) {
    const markdownPath = resolveRepoPath(root, options.markdown)
    await writeTextAtomic(markdownPath, renderMarkdown(report))
    report.writtenMarkdownPath = relativePath(root, markdownPath)
  }
  return report
}

function validateRequiredOptions(options: NativeCodeSubgraphExtractorOptions): void {
  if (!options.targetRepo) {
    throw new Error('graph extract-code-subgraph requires --target-repo <path>.')
  }
  if (!options.output) {
    throw new Error('graph extract-code-subgraph requires --output <devview-code-subgraph.json>.')
  }
  if (!options.validationOutput) {
    throw new Error('graph extract-code-subgraph requires --validation-output <validation.json>.')
  }
}

function parseIncludePatterns(include: string[] | undefined): string[] {
  const values = (include && include.length > 0 ? include : ['**/*'])
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean)
  return values.length > 0 ? [...new Set(values)] : ['**/*']
}

function normalizeExtractionProfile(
  profile: NativeCodeSubgraphExtractorOptions['extractionProfile'],
): NativeCodeSubgraphExtractionProfile {
  return profile ?? DEFAULT_EXTRACTION_PROFILE
}

async function extractCodeSubgraph(
  targetRepoPath: string,
  includePatterns: string[],
  extractionProfile: NativeCodeSubgraphExtractionProfile,
): Promise<ExtractionState> {
  const state: ExtractionState = {
    findings: [],
    nodes: [],
    edges: [],
    symbols: [],
    symbolsByName: new Map(),
    symbolsByDeclaration: new Map(),
    fileNodesByRelativePath: new Map(),
    fileIndexesByRelativePath: new Map(),
    externalNodeIdsBySpecifier: new Map(),
    externalNodeIds: new Set(),
    graphifyCompatibleCallLikeEdgeKeys: new Set(),
    profileFilteredExternalCallLikeEdgeCount: 0,
    profileFilteredDuplicateCallLikeEdgeCount: 0,
    seenNodeIds: new Set(),
    seenEdgeIds: new Set(),
    unsupportedExtensions: {},
    includePatterns,
    includedSourcePaths: [],
    supportedFileCount: 0,
    unsupportedFileCount: 0,
    skippedLargeFileCount: 0,
    scannedByteCount: 0,
    ambiguousCallNames: new Set(),
    extractionProfile,
  }

  const invalidInclude = includePatterns
    .map((pattern) => ({ pattern, result: matchScopeCompliancePathPattern(pattern, 'placeholder.ts') }))
    .filter((entry) => !entry.result.patternValid)
  if (invalidInclude.length > 0) {
    state.findings.push(
      ...invalidInclude.map((entry) =>
        blocker(
          'NATIVE_CODE_SUBGRAPH_INCLUDE_PATTERN_INVALID',
          `Include pattern is invalid or unsupported: ${entry.pattern} (${entry.result.reason}).`,
          'include',
          targetRepoPath,
        ),
      ),
    )
    return state
  }

  const discovered = await discoverFiles(targetRepoPath, state, includePatterns)
  const supported = discovered.filter((entry) => supportedExtensions.has(path.extname(entry).toLowerCase()))
  if (supported.length === 0) {
    state.findings.push(
      blocker(
        'NATIVE_CODE_SUBGRAPH_NO_SUPPORTED_FILES',
        'No JavaScript or TypeScript source files were found for static code subgraph extraction.',
        'targetRepo',
        targetRepoPath,
      ),
    )
    return state
  }
  if (supported.length > maxSupportedFiles) {
    state.findings.push(
      blocker(
        'NATIVE_CODE_SUBGRAPH_FILE_LIMIT_EXCEEDED',
        `Static extraction supports up to ${maxSupportedFiles} JS/TS files in one report-only run; found ${supported.length}.`,
        'targetRepo',
        targetRepoPath,
      ),
    )
    return state
  }

  const sourceFiles: SourceFileRecord[] = []
  for (const absolutePath of supported.sort()) {
    const bytes = await readFile(absolutePath)
    if (bytes.byteLength > maxFileBytes) {
      state.skippedLargeFileCount += 1
      state.findings.push(
        warning(
          'NATIVE_CODE_SUBGRAPH_LARGE_FILE_SKIPPED',
          `Skipped large JS/TS file over ${maxFileBytes} bytes: ${relativePath(targetRepoPath, absolutePath)}.`,
          undefined,
          relativePath(targetRepoPath, absolutePath),
        ),
      )
      continue
    }
    const content = bytes.toString('utf8').replace(/^\uFEFF/, '')
    const relative = relativePath(targetRepoPath, absolutePath)
    sourceFiles.push({
      relativePath: relative,
      absolutePath,
      content,
      digest: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
      byteLength: bytes.byteLength,
      ast: ts.createSourceFile(relative, content, ts.ScriptTarget.Latest, true, scriptKindForPath(relative)),
    })
    state.includedSourcePaths.push(absolutePath)
    state.scannedByteCount += bytes.byteLength
  }

  for (const sourceFile of sourceFiles) {
    addFileNode(state, sourceFile)
  }
  for (const sourceFile of sourceFiles) {
    const fileNodeId = state.fileNodesByRelativePath.get(normalizePath(sourceFile.relativePath))
    if (!fileNodeId) continue
    state.fileIndexesByRelativePath.set(normalizePath(sourceFile.relativePath), createFileIndex(sourceFile, fileNodeId))
  }
  for (const fileIndex of sortedFileIndexes(state)) {
    extractImportsAndExports(state, targetRepoPath, fileIndex)
  }
  for (const fileIndex of sortedFileIndexes(state)) {
    extractSymbols(state, fileIndex)
  }
  for (const fileIndex of sortedFileIndexes(state)) {
    addHeritageEdges(state, fileIndex)
  }
  for (const fileIndex of sortedFileIndexes(state)) {
    addCallLikeEdges(state, fileIndex)
  }

  if (Object.keys(state.unsupportedExtensions).length > 0) {
    state.findings.push(
      warning(
        'NATIVE_CODE_SUBGRAPH_UNSUPPORTED_EXTENSIONS',
        `Unsupported file extensions were observed but not parsed: ${formatCounts(state.unsupportedExtensions)}.`,
        'targetRepo',
        targetRepoPath,
      ),
    )
  }
  if (state.ambiguousCallNames.size > 0) {
    const names = [...state.ambiguousCallNames].sort()
    const displayed = names.slice(0, maxAmbiguousNamesInFinding)
    const suffix = names.length > displayed.length ? `, ... (${names.length - displayed.length} more)` : ''
    state.findings.push(
      warning(
        'NATIVE_CODE_SUBGRAPH_AMBIGUOUS_CALLS_SKIPPED',
        `Skipped exact call/reference edges for ambiguous symbol names: ${displayed.join(', ')}${suffix}.`,
        'calls',
        targetRepoPath,
      ),
    )
  }
  if (state.findings.every((finding) => finding.severity !== 'blocker')) {
    state.findings.push({
      severity: 'satisfied',
      code: 'NATIVE_CODE_SUBGRAPH_EXTRACTED',
      message: 'JavaScript/TypeScript files were statically extracted into a DevView code subgraph source fact.',
      path: targetRepoPath,
    })
  }
  return state
}

function createFileIndex(sourceFile: SourceFileRecord, fileNodeId: string): FileIndex {
  return {
    sourceFile,
    fileNodeId,
    symbols: [],
    localSymbolsByName: new Map(),
    exportedSymbolsByName: new Map(),
    importedBindingsByLocalName: new Map(),
    namespaceImportsByLocalName: new Map(),
    reExportsByName: new Map(),
    starReExportTargets: [],
    classMethodsByClassIdAndName: new Map(),
    classSymbolsByName: new Map(),
  }
}

function sortedFileIndexes(state: ExtractionState): FileIndex[] {
  return [...state.fileIndexesByRelativePath.values()].sort((left, right) =>
    left.sourceFile.relativePath.localeCompare(right.sourceFile.relativePath),
  )
}

async function discoverFiles(
  targetRepoPath: string,
  state: ExtractionState,
  includePatterns: string[],
): Promise<string[]> {
  const files: string[] = []
  async function visit(dirPath: string): Promise<void> {
    let entries
    try {
      entries = await readdir(dirPath, { withFileTypes: true })
    } catch (error) {
      state.findings.push(
        blocker(
          'NATIVE_CODE_SUBGRAPH_TARGET_READ_FAILED',
          error instanceof Error ? error.message : String(error),
          'targetRepo',
          dirPath,
        ),
      )
      return
    }
    for (const entry of entries) {
      const absolute = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        if (!skippedDirectories.has(entry.name)) {
          await visit(absolute)
        }
        continue
      }
      if (!entry.isFile()) continue
      const relative = relativePath(targetRepoPath, absolute)
      if (!matchesInclude(relative, includePatterns)) continue
      const ext = path.extname(entry.name).toLowerCase()
      if (supportedExtensions.has(ext)) {
        files.push(absolute)
        state.supportedFileCount += 1
      } else {
        state.unsupportedFileCount += 1
        const key = ext || '[no-extension]'
        state.unsupportedExtensions[key] = (state.unsupportedExtensions[key] ?? 0) + 1
      }
    }
  }
  await visit(targetRepoPath)
  return files
}

function addFileNode(state: ExtractionState, sourceFile: SourceFileRecord): void {
  const id = uniqueNodeId(state, `code.file.${sanitizeId(sourceFile.relativePath)}`)
  state.fileNodesByRelativePath.set(normalizePath(sourceFile.relativePath), id)
  state.nodes.push({
    id,
    kind: 'file',
    label: sourceFile.relativePath,
    sourceFile: sourceFile.relativePath,
    sourceLocationStatus: 'file-node',
    sourceDigest: sourceFile.digest,
    confidence: 'extracted',
    extractor: EXTRACTOR_ID,
  })
}

function extractImportsAndExports(state: ExtractionState, targetRepoPath: string, fileIndex: FileIndex): void {
  const sourceFile = fileIndex.sourceFile
  for (const statement of sourceFile.ast.statements) {
    if (ts.isImportDeclaration(statement)) {
      const specifier = moduleSpecifierText(statement.moduleSpecifier)
      if (!specifier) continue
      const targetFile = resolveLocalImport(
        targetRepoPath,
        sourceFile.relativePath,
        specifier,
        state.fileNodesByRelativePath,
      )
      addImportEdge(state, fileIndex, specifier, targetFile, 'imports', statement.moduleSpecifier)
      const clause = statement.importClause
      if (!clause) continue
      if (clause.name) {
        const binding = {
          localName: clause.name.text,
          importedName: 'default',
          specifier,
          targetFile,
          kind: 'default',
          typeOnly: clause.isTypeOnly,
        } satisfies ImportBinding
        addImportBinding(fileIndex, binding)
        addImportEdge(state, fileIndex, specifier, targetFile, 'imports_from', clause.name)
      }
      if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const element of clause.namedBindings.elements) {
          const binding = {
            localName: element.name.text,
            importedName: element.propertyName?.text ?? element.name.text,
            specifier,
            targetFile,
            kind: 'named',
            typeOnly: clause.isTypeOnly || element.isTypeOnly,
          } satisfies ImportBinding
          addImportBinding(fileIndex, binding)
          addImportEdge(state, fileIndex, specifier, targetFile, 'imports_from', element)
        }
      } else if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
        const binding = {
          localName: clause.namedBindings.name.text,
          importedName: '*',
          specifier,
          targetFile,
          kind: 'namespace',
          typeOnly: clause.isTypeOnly,
        } satisfies ImportBinding
        addNamespaceImport(fileIndex, binding)
        addImportEdge(state, fileIndex, specifier, targetFile, 'imports_from', clause.namedBindings)
      }
      continue
    }

    if (ts.isImportEqualsDeclaration(statement)) {
      const requireSpecifier = externalModuleReferenceText(statement.moduleReference)
      if (!requireSpecifier) continue
      const targetFile = resolveLocalImport(
        targetRepoPath,
        sourceFile.relativePath,
        requireSpecifier,
        state.fileNodesByRelativePath,
      )
      addImportEdge(state, fileIndex, requireSpecifier, targetFile, 'imports', statement.moduleReference)
      const binding = {
        localName: statement.name.text,
        importedName: '*',
        specifier: requireSpecifier,
        targetFile,
        kind: 'namespace',
        typeOnly: statement.isTypeOnly,
      } satisfies ImportBinding
      addNamespaceImport(fileIndex, binding)
      addImportEdge(state, fileIndex, requireSpecifier, targetFile, 'imports_from', statement.name)
      continue
    }

    if (ts.isExportDeclaration(statement)) {
      const moduleSpecifier = statement.moduleSpecifier
      const specifier = moduleSpecifierText(moduleSpecifier)
      if (specifier) {
        const targetFile = resolveLocalImport(
          targetRepoPath,
          sourceFile.relativePath,
          specifier,
          state.fileNodesByRelativePath,
        )
        if (moduleSpecifier) {
          addImportEdge(state, fileIndex, specifier, targetFile, 're_exports', moduleSpecifier)
        }
        if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
          for (const element of statement.exportClause.elements) {
            addReExport(fileIndex, {
              exportedName: element.name.text,
              importedName: element.propertyName?.text ?? element.name.text,
              targetFile,
            })
          }
        } else if (!statement.exportClause && targetFile) {
          fileIndex.starReExportTargets.push(normalizePath(targetFile))
        }
      }
      continue
    }
  }

  visitSourceFile(sourceFile.ast, (node) => {
    const requireSpecifier = requireCallSpecifier(node)
    if (requireSpecifier && ts.isCallExpression(node)) {
      const targetFile = resolveLocalImport(
        targetRepoPath,
        sourceFile.relativePath,
        requireSpecifier,
        state.fileNodesByRelativePath,
      )
      addImportEdge(state, fileIndex, requireSpecifier, targetFile, 'imports', node)
      addRequireBindings(fileIndex, node, requireSpecifier, targetFile)
      return
    }
    const dynamicImportSpecifier = dynamicImportCallSpecifier(node)
    if (dynamicImportSpecifier) {
      const targetFile = resolveLocalImport(
        targetRepoPath,
        sourceFile.relativePath,
        dynamicImportSpecifier,
        state.fileNodesByRelativePath,
      )
      addImportEdge(state, fileIndex, dynamicImportSpecifier, targetFile, 'imports', node)
    }
  })
}

function extractSymbols(state: ExtractionState, fileIndex: FileIndex): void {
  function visit(node: ts.Node, currentClass: SymbolRecord | null): void {
    if (ts.isFunctionDeclaration(node)) {
      const name = node.name?.text ?? (hasDefaultModifier(node) ? 'default' : null)
      if (name && node.body) {
        addSymbol(state, fileIndex, {
          name,
          qualifiedName: name,
          kind: 'function',
          declaration: node,
          exported: hasExportModifier(node),
          defaultExport: hasDefaultModifier(node),
        })
      }
      ts.forEachChild(node, (child) => visit(child, currentClass))
      return
    }

    if (ts.isClassDeclaration(node)) {
      const name = node.name?.text ?? (hasDefaultModifier(node) ? 'default' : null)
      const classSymbol = name
        ? addSymbol(state, fileIndex, {
            name,
            qualifiedName: name,
            kind: 'class',
            declaration: node,
            exported: hasExportModifier(node),
            defaultExport: hasDefaultModifier(node),
          })
        : null
      ts.forEachChild(node, (child) => visit(child, classSymbol))
      return
    }

    if (ts.isInterfaceDeclaration(node)) {
      addSymbol(state, fileIndex, {
        name: node.name.text,
        qualifiedName: node.name.text,
        kind: 'interface',
        declaration: node,
        exported: hasExportModifier(node),
        defaultExport: false,
      })
      ts.forEachChild(node, (child) => visit(child, currentClass))
      return
    }

    if (ts.isTypeAliasDeclaration(node)) {
      addSymbol(state, fileIndex, {
        name: node.name.text,
        qualifiedName: node.name.text,
        kind: 'type',
        declaration: node,
        exported: hasExportModifier(node),
        defaultExport: false,
      })
      ts.forEachChild(node, (child) => visit(child, currentClass))
      return
    }

    if (ts.isEnumDeclaration(node)) {
      addSymbol(state, fileIndex, {
        name: node.name.text,
        qualifiedName: node.name.text,
        kind: 'type',
        declaration: node,
        exported: hasExportModifier(node),
        defaultExport: false,
      })
      ts.forEachChild(node, (child) => visit(child, currentClass))
      return
    }

    if (ts.isVariableStatement(node)) {
      ts.forEachChild(node, (child) => visit(child, currentClass))
      return
    }

    if (ts.isVariableDeclaration(node)) {
      addVariableDeclarationSymbols(state, fileIndex, node, isExportedVariableDeclaration(node), currentClass)
      ts.forEachChild(node, (child) => visit(child, currentClass))
      return
    }

    if (currentClass && ts.isConstructorDeclaration(node) && node.body) {
      addClassMemberSymbol(state, fileIndex, node, currentClass, 'constructor')
      ts.forEachChild(node, (child) => visit(child, currentClass))
      return
    }

    if (currentClass && ts.isMethodDeclaration(node) && node.body) {
      const name = propertyNameText(node.name, fileIndex.sourceFile.ast)
      if (name) {
        addClassMemberSymbol(state, fileIndex, node, currentClass, name)
      }
      ts.forEachChild(node, (child) => visit(child, currentClass))
      return
    }

    if (currentClass && (ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) && node.body) {
      const name = propertyNameText(node.name, fileIndex.sourceFile.ast)
      if (name) {
        addClassMemberSymbol(state, fileIndex, node, currentClass, name)
      }
      ts.forEachChild(node, (child) => visit(child, currentClass))
      return
    }

    if (currentClass && ts.isPropertyDeclaration(node)) {
      const name = propertyNameText(node.name, fileIndex.sourceFile.ast)
      const initializer = skipOuterExpressions(node.initializer)
      if (name && initializer && isFunctionLikeExpression(initializer)) {
        addClassMemberSymbol(state, fileIndex, node, currentClass, name)
      }
      ts.forEachChild(node, (child) => visit(child, currentClass))
      return
    }

    ts.forEachChild(node, (child) => visit(child, currentClass))
  }

  visit(fileIndex.sourceFile.ast, null)
  applyLocalExportDeclarations(fileIndex)
}

function addVariableDeclarationSymbols(
  state: ExtractionState,
  fileIndex: FileIndex,
  declaration: ts.VariableDeclaration,
  exported: boolean,
  currentClass: SymbolRecord | null,
): void {
  if (!ts.isIdentifier(declaration.name)) return
  const name = declaration.name.text
  const initializer = skipOuterExpressions(declaration.initializer)
  if (!initializer) return
  if (isFunctionLikeExpression(initializer)) {
    addSymbol(state, fileIndex, {
      name,
      qualifiedName: name,
      kind: 'function',
      declaration,
      exported,
      defaultExport: false,
      parentClass: currentClass,
    })
    return
  }
  if (!currentClass && isTopLevelVariableDeclaration(declaration)) {
    addSymbol(state, fileIndex, {
      name,
      qualifiedName: name,
      kind: 'field',
      declaration,
      exported,
      defaultExport: false,
      parentClass: null,
    })
  }
  if (ts.isObjectLiteralExpression(initializer)) {
    addObjectLiteralFunctionSymbols(state, fileIndex, initializer, name, exported, currentClass)
  }
}

function addObjectLiteralFunctionSymbols(
  state: ExtractionState,
  fileIndex: FileIndex,
  objectLiteral: ts.ObjectLiteralExpression,
  baseName: string,
  exported: boolean,
  currentClass: SymbolRecord | null,
): void {
  for (const property of objectLiteral.properties) {
    if (ts.isMethodDeclaration(property) && property.body) {
      const name = propertyNameText(property.name, fileIndex.sourceFile.ast)
      if (!name) continue
      addSymbol(state, fileIndex, {
        name,
        qualifiedName: `${baseName}.${name}`,
        kind: 'function',
        declaration: property,
        exported,
        defaultExport: false,
        parentClass: currentClass,
      })
      continue
    }
    if (!ts.isPropertyAssignment(property)) continue
    const name = propertyNameText(property.name, fileIndex.sourceFile.ast)
    if (!name) continue
    const initializer = skipOuterExpressions(property.initializer)
    if (!initializer) continue
    if (isFunctionLikeExpression(initializer)) {
      addSymbol(state, fileIndex, {
        name,
        qualifiedName: `${baseName}.${name}`,
        kind: 'function',
        declaration: property,
        exported,
        defaultExport: false,
        parentClass: currentClass,
      })
    } else if (ts.isObjectLiteralExpression(initializer)) {
      addObjectLiteralFunctionSymbols(state, fileIndex, initializer, `${baseName}.${name}`, exported, currentClass)
    }
  }
}

function addClassMemberSymbol(
  state: ExtractionState,
  fileIndex: FileIndex,
  declaration: ts.Node,
  parentClass: SymbolRecord,
  name: string,
): SymbolRecord {
  return addSymbol(state, fileIndex, {
    name,
    qualifiedName: `${parentClass.name}.${name}`,
    kind: 'method',
    declaration,
    exported: false,
    defaultExport: false,
    parentClass,
  })
}

function addSymbol(
  state: ExtractionState,
  fileIndex: FileIndex,
  input: {
    name: string
    qualifiedName: string
    kind: SymbolNodeKind
    declaration: ts.Node
    exported: boolean
    defaultExport: boolean
    parentClass?: SymbolRecord | null
  },
): SymbolRecord {
  const sourceFile = fileIndex.sourceFile
  const startIndex = input.declaration.getStart(sourceFile.ast)
  const endIndex = input.declaration.getEnd()
  const id = uniqueNodeId(
    state,
    `code.${input.kind}.${sanitizeId(sourceFile.relativePath)}.${sanitizeId(input.qualifiedName)}.${lineColumnId(
      sourceFile,
      startIndex,
    )}`,
  )
  const record: SymbolRecord = {
    id,
    name: input.name,
    qualifiedName: input.qualifiedName,
    kind: input.kind,
    sourceFile: sourceFile.relativePath,
    declaration: input.declaration,
    ...(input.parentClass ? { parentClassId: input.parentClass.id } : {}),
  }
  state.nodes.push(symbolNode(id, input.kind, input.qualifiedName, sourceFile, startIndex, endIndex))
  state.symbols.push(record)
  state.symbolsByDeclaration.set(input.declaration, record)
  fileIndex.symbols.push(record)
  addMapEntry(fileIndex.localSymbolsByName, normalizeToken(input.name), record)
  addMapEntry(state.symbolsByName, normalizeToken(input.name), record)
  if (input.qualifiedName !== input.name) {
    addMapEntry(state.symbolsByName, normalizeToken(input.qualifiedName), record)
  }
  if (input.kind === 'class') {
    addMapEntry(fileIndex.classSymbolsByName, normalizeToken(input.name), record)
  }
  if (input.kind === 'method' && input.parentClass) {
    addMapEntry(fileIndex.classMethodsByClassIdAndName, classMethodKey(input.parentClass.id, input.name), record)
  }
  if (input.exported) {
    addMapEntry(fileIndex.exportedSymbolsByName, normalizeToken(input.name), record)
  }
  if (input.defaultExport) {
    addMapEntry(fileIndex.exportedSymbolsByName, 'default', record)
  }
  addEdge(state, {
    from: fileIndex.fileNodeId,
    to: id,
    kind: 'contains',
    sourceFile: sourceFile.relativePath,
    sourceDigest: sourceFile.digest,
    sourceLocation: locationRange(sourceFile, startIndex, startIndex),
    confidence: 'extracted',
  })
  if (input.parentClass) {
    addEdge(state, {
      from: input.parentClass.id,
      to: id,
      kind: 'contains',
      sourceFile: sourceFile.relativePath,
      sourceDigest: sourceFile.digest,
      sourceLocation: locationRange(sourceFile, startIndex, startIndex),
      confidence: 'extracted',
    })
  }
  return record
}

function applyLocalExportDeclarations(fileIndex: FileIndex): void {
  for (const statement of fileIndex.sourceFile.ast.statements) {
    if (!ts.isExportDeclaration(statement) || statement.moduleSpecifier) continue
    if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue
    for (const element of statement.exportClause.elements) {
      const localName = element.propertyName?.text ?? element.name.text
      const localSymbols = fileIndex.localSymbolsByName.get(normalizeToken(localName)) ?? []
      for (const symbol of localSymbols) {
        addMapEntry(fileIndex.exportedSymbolsByName, normalizeToken(element.name.text), symbol)
      }
    }
  }
  for (const statement of fileIndex.sourceFile.ast.statements) {
    if (!ts.isExportAssignment(statement) || statement.isExportEquals) continue
    const expression = skipOuterExpressions(statement.expression)
    if (expression && ts.isIdentifier(expression)) {
      const localSymbols = fileIndex.localSymbolsByName.get(normalizeToken(expression.text)) ?? []
      for (const symbol of localSymbols) {
        addMapEntry(fileIndex.exportedSymbolsByName, 'default', symbol)
      }
    }
  }
}

function addHeritageEdges(state: ExtractionState, fileIndex: FileIndex): void {
  for (const symbol of fileIndex.symbols) {
    if (symbol.kind !== 'class' && symbol.kind !== 'interface') continue
    const declaration = symbol.declaration
    if (!hasHeritageClauses(declaration)) continue
    for (const clause of declaration.heritageClauses ?? []) {
      const edgeKind = clause.token === ts.SyntaxKind.ImplementsKeyword ? 'implements' : 'inherits'
      for (const type of clause.types) {
        const targets = resolveExpressionTargets(state, fileIndex, type.expression, {
          kinds: ['class', 'interface', 'type'],
          currentClass: symbol.kind === 'class' ? symbol : null,
        })
        addResolvedEdges(state, symbol.id, edgeKind, type.expression, fileIndex.sourceFile, targets)
      }
    }
  }
}

function addCallLikeEdges(state: ExtractionState, fileIndex: FileIndex): void {
  const sourceFile = fileIndex.sourceFile

  function visit(node: ts.Node, currentOwner: SymbolRecord | null, currentClass: SymbolRecord | null): void {
    const symbol = state.symbolsByDeclaration.get(node)
    const nextOwner = symbol && (symbol.kind === 'function' || symbol.kind === 'method') ? symbol : currentOwner
    const nextClass = symbol?.kind === 'class' ? symbol : currentClass
    const from = nextOwner?.id ?? fileIndex.fileNodeId

    if (ts.isCallExpression(node)) {
      const targets = resolveExpressionTargets(state, fileIndex, node.expression, {
        kinds: ['function', 'method', 'class'],
        currentClass: nextClass,
      })
      addResolvedEdges(state, from, 'calls', node.expression, sourceFile, targets)
    } else if (ts.isNewExpression(node) && node.expression) {
      const targets = resolveExpressionTargets(state, fileIndex, node.expression, {
        kinds: ['class', 'function'],
        currentClass: nextClass,
      })
      addResolvedEdges(state, from, 'constructs', node.expression, sourceFile, targets)
    }

    if (state.extractionProfile === 'rich') {
      if (ts.isPropertyAccessExpression(node) && isReferencePropertyAccess(node)) {
        const targets = resolveExpressionTargets(state, fileIndex, node, {
          kinds: ['class', 'interface', 'type', 'function', 'method'],
          currentClass: nextClass,
        })
        addResolvedEdges(state, from, 'references', node, sourceFile, targets)
      } else if (ts.isIdentifier(node) && isReferenceIdentifier(node)) {
        const targets = resolveIdentifierTargets(state, fileIndex, node.text, {
          kinds: ['class', 'interface', 'type', 'function', 'method'],
          currentClass: nextClass,
        })
        addResolvedEdges(state, from, 'references', node, sourceFile, targets)
      }
    }

    ts.forEachChild(node, (child) => visit(child, nextOwner, nextClass))
  }

  visit(sourceFile.ast, null, null)
}

function resolveExpressionTargets(
  state: ExtractionState,
  fileIndex: FileIndex,
  expression: ts.Expression,
  options: { kinds: SymbolNodeKind[]; currentClass: SymbolRecord | null },
): ResolvedTarget[] | 'ambiguous' {
  const unwrapped = skipOuterExpressions(expression)
  if (!unwrapped) return []
  if (ts.isIdentifier(unwrapped)) {
    return resolveIdentifierTargets(state, fileIndex, unwrapped.text, options)
  }
  if (ts.isPropertyAccessExpression(unwrapped)) {
    return resolvePropertyAccessTargets(state, fileIndex, unwrapped, options)
  }
  if (unwrapped.kind === ts.SyntaxKind.ThisKeyword || unwrapped.kind === ts.SyntaxKind.SuperKeyword) {
    return options.currentClass ? [{ id: options.currentClass.id, confidence: 'inferred' }] : []
  }
  return []
}

function resolveIdentifierTargets(
  state: ExtractionState,
  fileIndex: FileIndex,
  name: string,
  options: { kinds: SymbolNodeKind[]; currentClass: SymbolRecord | null },
): ResolvedTarget[] | 'ambiguous' {
  const key = normalizeToken(name)
  const localTargets = filterSymbolsByKind(fileIndex.localSymbolsByName.get(key) ?? [], options.kinds)
  if (localTargets.length > 0) return resolvedFromSymbolsOrAmbiguous(state, name, localTargets, 'extracted')

  const importedTargets = resolveImportedBindings(
    state,
    fileIndex,
    fileIndex.importedBindingsByLocalName.get(key) ?? [],
  )
  if (importedTargets === 'ambiguous' || importedTargets.length > 0) return importedTargets

  const namespaceTargets = resolveImportedBindings(
    state,
    fileIndex,
    fileIndex.namespaceImportsByLocalName.get(key) ?? [],
  )
  if (namespaceTargets === 'ambiguous' || namespaceTargets.length > 0) return namespaceTargets

  const projectTargets = filterSymbolsByKind(state.symbolsByName.get(key) ?? [], options.kinds)
  if (projectTargets.length > 0) return resolvedFromSymbolsOrAmbiguous(state, name, projectTargets, 'inferred')
  return []
}

function resolvePropertyAccessTargets(
  state: ExtractionState,
  fileIndex: FileIndex,
  expression: ts.PropertyAccessExpression,
  options: { kinds: SymbolNodeKind[]; currentClass: SymbolRecord | null },
): ResolvedTarget[] | 'ambiguous' {
  const propertyName = expression.name.text
  const base = skipOuterExpressions(expression.expression)
  if (!base) return []

  if (base.kind === ts.SyntaxKind.ThisKeyword || base.kind === ts.SyntaxKind.SuperKeyword) {
    if (!options.currentClass) return []
    const methodTargets = filterSymbolsByKind(
      fileIndex.classMethodsByClassIdAndName.get(classMethodKey(options.currentClass.id, propertyName)) ?? [],
      options.kinds,
    )
    return resolvedFromSymbolsOrAmbiguous(state, propertyName, methodTargets, 'extracted')
  }

  if (!ts.isIdentifier(base)) return []
  const namespaceBindings = fileIndex.namespaceImportsByLocalName.get(normalizeToken(base.text)) ?? []
  if (namespaceBindings.length > 0) {
    return resolveNamespacePropertyTargets(state, fileIndex, namespaceBindings, propertyName, options.kinds)
  }

  const importedObjectBindings = fileIndex.importedBindingsByLocalName.get(normalizeToken(base.text)) ?? []
  if (importedObjectBindings.some((binding) => !binding.targetFile)) {
    return uniqueResolvedTargets(
      importedObjectBindings
        .filter((binding) => !binding.targetFile)
        .map((binding) => ({
          id: externalDependencyNode(state, fileIndex.sourceFile, binding.specifier),
          confidence: 'inferred',
        })),
    )
  }

  const classTargets = filterSymbolsByKind(fileIndex.classSymbolsByName.get(normalizeToken(base.text)) ?? [], ['class'])
  if (classTargets.length === 1) {
    const methodTargets = filterSymbolsByKind(
      fileIndex.classMethodsByClassIdAndName.get(classMethodKey(classTargets[0].id, propertyName)) ?? [],
      options.kinds,
    )
    return resolvedFromSymbolsOrAmbiguous(state, `${base.text}.${propertyName}`, methodTargets, 'extracted')
  }
  if (classTargets.length > 1) {
    recordAmbiguous(state, `${base.text}.${propertyName}`)
    return 'ambiguous'
  }

  return []
}

function resolveNamespacePropertyTargets(
  state: ExtractionState,
  fileIndex: FileIndex,
  bindings: ImportBinding[],
  propertyName: string,
  kinds: SymbolNodeKind[],
): ResolvedTarget[] | 'ambiguous' {
  const resolved: ResolvedTarget[] = []
  for (const binding of bindings) {
    if (!binding.targetFile) {
      resolved.push({
        id: externalDependencyNode(state, fileIndex.sourceFile, binding.specifier),
        confidence: 'inferred',
      })
      continue
    }
    const symbols = filterSymbolsByKind(resolveExportedSymbols(state, binding.targetFile, propertyName), kinds)
    const target = resolvedFromSymbolsOrAmbiguous(state, `${binding.localName}.${propertyName}`, symbols, 'extracted')
    if (target === 'ambiguous') return target
    resolved.push(...target)
  }
  return uniqueResolvedTargets(resolved)
}

function resolveImportedBindings(
  state: ExtractionState,
  fileIndex: FileIndex,
  bindings: ImportBinding[],
): ResolvedTarget[] | 'ambiguous' {
  const resolved: ResolvedTarget[] = []
  for (const binding of bindings) {
    if (!binding.targetFile) {
      resolved.push({
        id: externalDependencyNode(state, fileIndex.sourceFile, binding.specifier),
        confidence: 'inferred',
      })
      continue
    }
    const symbols = resolveExportedSymbols(state, binding.targetFile, binding.importedName)
    const target = resolvedFromSymbolsOrAmbiguous(
      state,
      `${binding.specifier}:${binding.importedName}`,
      symbols,
      'extracted',
    )
    if (target === 'ambiguous') return target
    resolved.push(...target)
  }
  return uniqueResolvedTargets(resolved)
}

function resolveExportedSymbols(
  state: ExtractionState,
  relativePathValue: string,
  exportedName: string,
  seen = new Set<string>(),
): SymbolRecord[] {
  const key = `${normalizePath(relativePathValue)}:${normalizeToken(exportedName)}`
  if (seen.has(key)) return []
  seen.add(key)
  const fileIndex = state.fileIndexesByRelativePath.get(normalizePath(relativePathValue))
  if (!fileIndex) return []
  const direct = fileIndex.exportedSymbolsByName.get(normalizeToken(exportedName)) ?? []
  if (direct.length > 0) return direct

  const reExports = fileIndex.reExportsByName.get(normalizeToken(exportedName)) ?? []
  const resolved = reExports.flatMap((entry) =>
    entry.targetFile ? resolveExportedSymbols(state, entry.targetFile, entry.importedName, seen) : [],
  )
  if (resolved.length > 0) return resolved

  const starResolved = fileIndex.starReExportTargets.flatMap((targetFile) =>
    resolveExportedSymbols(state, targetFile, exportedName, seen),
  )
  return uniqueSymbols(starResolved)
}

function addResolvedEdges(
  state: ExtractionState,
  from: string,
  kind: string,
  locationNode: ts.Node,
  sourceFile: SourceFileRecord,
  targets: ResolvedTarget[] | 'ambiguous',
): void {
  if (targets === 'ambiguous') return
  for (const target of targets) {
    if (shouldSkipResolvedEdgeForProfile(state, from, kind, target.id)) {
      continue
    }
    addEdge(state, {
      from,
      to: target.id,
      kind,
      sourceFile: sourceFile.relativePath,
      sourceDigest: sourceFile.digest,
      sourceLocation: locationRange(sourceFile, locationNode.getStart(sourceFile.ast), locationNode.getEnd()),
      confidence: target.confidence,
    })
  }
}

function shouldSkipResolvedEdgeForProfile(state: ExtractionState, from: string, kind: string, to: string): boolean {
  if (state.extractionProfile !== 'graphify-compatible') {
    return false
  }
  if (!callLikeEdgeKinds.has(kind)) {
    return false
  }
  if (kind === 'references') {
    return true
  }
  if (state.externalNodeIds.has(to)) {
    state.profileFilteredExternalCallLikeEdgeCount += 1
    return true
  }
  const edgeKey = `${from}\0${kind}\0${to}`
  if (state.graphifyCompatibleCallLikeEdgeKeys.has(edgeKey)) {
    state.profileFilteredDuplicateCallLikeEdgeCount += 1
    return true
  }
  state.graphifyCompatibleCallLikeEdgeKeys.add(edgeKey)
  return false
}

function symbolNode(
  id: string,
  kind: SymbolNodeKind,
  label: string,
  sourceFile: SourceFileRecord,
  startIndex: number,
  endIndex: number,
): JsonRecord {
  return {
    id,
    kind,
    label,
    sourceFile: sourceFile.relativePath,
    sourceLocation: locationRange(sourceFile, startIndex, endIndex > startIndex ? endIndex : startIndex),
    sourceDigest: sourceFile.digest,
    confidence: 'extracted',
    extractor: EXTRACTOR_ID,
  }
}

function addImportEdge(
  state: ExtractionState,
  fileIndex: FileIndex,
  specifier: string,
  targetFile: string | null,
  kind: 'imports' | 'imports_from' | 're_exports',
  locationNode: ts.Node,
): void {
  const targetNodeId = targetFile ? state.fileNodesByRelativePath.get(normalizePath(targetFile)) : null
  const to = targetNodeId ?? externalDependencyNode(state, fileIndex.sourceFile, specifier)
  addEdge(state, {
    from: fileIndex.fileNodeId,
    to,
    kind,
    sourceFile: fileIndex.sourceFile.relativePath,
    sourceDigest: fileIndex.sourceFile.digest,
    sourceLocation: locationRange(
      fileIndex.sourceFile,
      locationNode.getStart(fileIndex.sourceFile.ast),
      locationNode.getEnd(),
    ),
    confidence: targetNodeId ? 'extracted' : 'inferred',
  })
}

function externalDependencyNode(state: ExtractionState, sourceFile: SourceFileRecord, specifier: string): string {
  const existing = state.externalNodeIdsBySpecifier.get(specifier)
  if (existing) return existing
  const id = uniqueNodeId(state, `code.external.${sanitizeId(specifier)}`)
  state.externalNodeIdsBySpecifier.set(specifier, id)
  state.externalNodeIds.add(id)
  state.nodes.push({
    id,
    kind: 'external_dependency',
    label: specifier,
    sourceFile: sourceFile.relativePath,
    sourceLocationStatus: 'external-import-specifier',
    sourceDigest: sourceFile.digest,
    confidence: 'inferred',
    extractor: EXTRACTOR_ID,
  })
  return id
}

function addEdge(
  state: ExtractionState,
  input: {
    from: string
    to: string
    kind: string
    sourceFile: string
    sourceDigest?: string
    sourceLocation?: JsonRecord
    sourceLocationStatus?: string
    confidence: Confidence
  },
): void {
  const id = uniqueEdgeId(state, `code-edge.${sanitizeId(input.from)}.${input.kind}.${sanitizeId(input.to)}`)
  state.edges.push({
    id,
    from: input.from,
    to: input.to,
    kind: input.kind,
    sourceFile: input.sourceFile,
    ...(input.sourceLocation ? { sourceLocation: input.sourceLocation } : {}),
    ...(!input.sourceLocation ? { sourceLocationStatus: input.sourceLocationStatus ?? 'native-static-ast' } : {}),
    ...(input.sourceDigest ? { sourceDigest: input.sourceDigest } : {}),
    confidence: input.confidence,
    extractor: EXTRACTOR_ID,
  })
}

function buildCodeSubgraph(root: string, targetRepoPath: string, state: ExtractionState): JsonRecord {
  return {
    schemaVersion: 1,
    artifactRole: CODE_SUBGRAPH_ROLE,
    status: CODE_SUBGRAPH_STATUS,
    scope: CODE_SUBGRAPH_SCOPE,
    importSource: EXTRACTOR_ID,
    extractionSource: {
      targetRepoPath: relativePath(root, targetRepoPath),
      extractionProfile: state.extractionProfile,
      supportedExtensions: [...supportedExtensions].sort(),
      skippedDirectories: [...skippedDirectories].sort(),
      includePatterns: state.includePatterns,
    },
    nodes: state.nodes,
    edges: state.edges,
    graphifyExecuted: false,
    astExtractorExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    viewTreeGenerated: false,
    contextPackGenerated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    rbacEnforced: false,
    permissionVerified: false,
    cryptographicSignatureVerified: false,
    enterpriseGateActivated: false,
  }
}

function buildReport(
  root: string,
  targetRepoPath: string,
  state: ExtractionState,
  validationReport: CodeSubgraphValidationReport | null,
  blocked: boolean,
  options: NativeCodeSubgraphExtractorOptions,
): NativeCodeSubgraphExtractionReport {
  const summary = extractionSummary(state)
  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : PASSED_STATUS,
    extractionScope: REPORT_SCOPE,
    extractionProfile: state.extractionProfile,
    sourceFactsOnly: true,
    reportOnly: true,
    extractionMode: EXTRACTOR_ID,
    targetRepo: {
      path: relativePath(root, targetRepoPath),
      supportedFileCount: state.supportedFileCount,
      unsupportedFileCount: state.unsupportedFileCount,
      skippedLargeFileCount: state.skippedLargeFileCount,
      scannedByteCount: state.scannedByteCount,
    },
    outputCodeSubgraph: {
      path: options.output ? relativePath(root, resolveRepoPath(root, options.output)) : '',
      artifactRole: CODE_SUBGRAPH_ROLE,
      status: CODE_SUBGRAPH_STATUS,
      scope: CODE_SUBGRAPH_SCOPE,
      nodeCount: state.nodes.length,
      edgeCount: state.edges.length,
    },
    validationOutput: {
      path: options.validationOutput ? relativePath(root, resolveRepoPath(root, options.validationOutput)) : '',
      status: validationReport?.status ?? null,
      codeSubgraphValidationStatus: validationReport?.codeSubgraphValidationStatus ?? null,
    },
    extractionSummary: summary,
    extractionFindings: state.findings,
    downstreamActionPlan: blocked
      ? ['Fix blocking target-repo, source file limit, output authority, or generated validation findings, then rerun.']
      : [
          'Use the written devview-code-subgraph artifact and validation report as source facts for a future unified Maintainability Graph merge plan.',
          'Unsupported language extraction, semantic type-checker resolution, and watch activation remain future report-only slices.',
        ],
    graphifyExecuted: false,
    astExtractorExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    viewTreeGenerated: false,
    contextPackGenerated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    rbacEnforced: false,
    permissionVerified: false,
    cryptographicSignatureVerified: false,
    enterpriseGateActivated: false,
  }
}

function extractionSummary(state: ExtractionState): NativeCodeSubgraphExtractionReport['extractionSummary'] {
  const symbolNodeKinds = new Set(['class', 'interface', 'type', 'function', 'method', 'field'])
  const filesWithSymbols = new Set(
    state.nodes
      .filter((entry) => symbolNodeKinds.has(String(entry.kind)))
      .map((entry) => stringValue(entry.sourceFile))
      .filter((entry): entry is string => Boolean(entry)),
  )
  return {
    fileNodeCount: state.nodes.filter((entry) => entry.kind === 'file').length,
    classNodeCount: state.nodes.filter((entry) => entry.kind === 'class').length,
    interfaceNodeCount: state.nodes.filter((entry) => entry.kind === 'interface').length,
    typeNodeCount: state.nodes.filter((entry) => entry.kind === 'type').length,
    functionNodeCount: state.nodes.filter((entry) => entry.kind === 'function').length,
    methodNodeCount: state.nodes.filter((entry) => entry.kind === 'method').length,
    fieldNodeCount: state.nodes.filter((entry) => entry.kind === 'field').length,
    externalDependencyNodeCount: state.nodes.filter((entry) => entry.kind === 'external_dependency').length,
    filesWithSymbolNodeCount: filesWithSymbols.size,
    importEdgeCount: state.edges.filter((entry) => importLikeEdgeKinds.has(String(entry.kind))).length,
    callEdgeCount: state.edges.filter((entry) => entry.kind === 'calls').length,
    constructEdgeCount: state.edges.filter((entry) => entry.kind === 'constructs').length,
    referenceEdgeCount: state.edges.filter((entry) => entry.kind === 'references').length,
    callLikeEdgeCount: state.edges.filter((entry) => callLikeEdgeKinds.has(String(entry.kind))).length,
    containsEdgeCount: state.edges.filter((entry) => entry.kind === 'contains').length,
    unsupportedExtensions: state.unsupportedExtensions,
    includePatterns: state.includePatterns,
    ambiguousCallCount: state.ambiguousCallNames.size,
    ambiguousCallNames: [...state.ambiguousCallNames].sort(),
    profileFilteredExternalCallLikeEdgeCount: state.profileFilteredExternalCallLikeEdgeCount,
    profileFilteredDuplicateCallLikeEdgeCount: state.profileFilteredDuplicateCallLikeEdgeCount,
  }
}

async function assertOutputAuthority(
  root: string,
  targetRepoPath: string,
  includedSourcePaths: string[],
  options: NativeCodeSubgraphExtractorOptions,
): Promise<void> {
  const outputPath = resolveRepoPath(root, options.output ?? '')
  const validationOutputPath = resolveRepoPath(root, options.validationOutput ?? '')
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  const outputs = [
    { kind: 'code subgraph output', path: outputPath },
    { kind: 'validation output', path: validationOutputPath },
    ...(markdownPath ? [{ kind: 'markdown output', path: markdownPath }] : []),
  ]
  const seenOutputs = new Set<string>()
  for (const output of outputs) {
    const key = pathKey(output.path)
    if (seenOutputs.has(key)) {
      throw new Error('Native code subgraph extraction outputs must be different paths.')
    }
    seenOutputs.add(key)
  }

  const includedSourceSet = new Set(includedSourcePaths.map(pathKey))
  for (const output of outputs) {
    const relativeTarget = relativePath(root, output.path)
    if (pathKey(output.path) === pathKey(targetRepoPath)) {
      throw new Error(`Native code subgraph extraction ${output.kind} would overwrite the target repo path.`)
    }
    if (includedSourceSet.has(pathKey(output.path))) {
      throw new Error(`Native code subgraph extraction ${output.kind} would overwrite an included source file.`)
    }
    if (isProtectedControlPath(root, output.path)) {
      throw new Error(
        `Native code subgraph extraction ${output.kind} is inside a protected control path: ${relativeTarget}.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(output.path)
    if (existingAuthority) {
      throw new Error(
        `Native code subgraph extraction ${output.kind} would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(
        `Native code subgraph extraction ${output.kind} would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
  }
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  try {
    const bytes = await readFile(filePath)
    const parsed = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) as JsonRecord
    const role = stringValue(parsed.artifactRole)
    if (
      role?.includes('graph-source') ||
      role === CODE_SUBGRAPH_ROLE ||
      role === REPORT_ROLE ||
      role === 'devview-code-subgraph-validation-report'
    ) {
      return `artifactRole ${role}`
    }
    if (asRecord(parsed.sourceRecords)) {
      return 'source-authority-shaped sourceRecords'
    }
    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      return 'node-edge graph-shaped artifact'
    }
  } catch {
    return null
  }
  return null
}

function renderMarkdown(report: NativeCodeSubgraphExtractionReport): string {
  return [
    '# Native Code Subgraph Extraction',
    '',
    `Status: ${report.status}`,
    `Target repo: \`${report.targetRepo.path}\``,
    `Extraction profile: \`${report.extractionProfile}\``,
    `Code subgraph: \`${report.writtenCodeSubgraphPath ?? report.outputCodeSubgraph.path}\``,
    `Validation output: \`${report.writtenValidationOutputPath ?? report.validationOutput.path}\``,
    '',
    '## Summary',
    '',
    `- Supported JS/TS files: ${report.targetRepo.supportedFileCount}`,
    `- Nodes: ${report.outputCodeSubgraph.nodeCount}`,
    `- Edges: ${report.outputCodeSubgraph.edgeCount}`,
    `- Files/classes/interfaces/types/functions/methods/fields: ${report.extractionSummary.fileNodeCount}/${report.extractionSummary.classNodeCount}/${report.extractionSummary.interfaceNodeCount}/${report.extractionSummary.typeNodeCount}/${report.extractionSummary.functionNodeCount}/${report.extractionSummary.methodNodeCount}/${report.extractionSummary.fieldNodeCount}`,
    `- Files with symbols: ${report.extractionSummary.filesWithSymbolNodeCount}`,
    `- Imports/calls/constructs/references/contains: ${report.extractionSummary.importEdgeCount}/${report.extractionSummary.callEdgeCount}/${report.extractionSummary.constructEdgeCount}/${report.extractionSummary.referenceEdgeCount}/${report.extractionSummary.containsEdgeCount}`,
    `- Call-like edges: ${report.extractionSummary.callLikeEdgeCount}`,
    `- Profile-filtered external/duplicate call-like edges: ${report.extractionSummary.profileFilteredExternalCallLikeEdgeCount}/${report.extractionSummary.profileFilteredDuplicateCallLikeEdgeCount}`,
    `- Validation: ${report.validationOutput.codeSubgraphValidationStatus ?? 'not-run'}`,
    '',
    '## Findings',
    '',
    ...report.extractionFindings.map((finding) => `- ${finding.severity}: ${finding.code} - ${finding.message}`),
    '',
    '## Boundary',
    '',
    '- Graphify executed: false',
    '- AST extractor executed: false',
    '- Provider/API/network called: false',
    '- Shell/project code executed: false',
    '- Graph source mutated: false',
    '- View Tree generated: false',
    '- Evidence accepted: false',
    '- RBAC enforced: false',
  ].join('\n')
}

function resolveLocalImport(
  targetRepoPath: string,
  fromRelativePath: string,
  specifier: string,
  fileNodesByRelativePath: Map<string, string>,
): string | null {
  if (!specifier.startsWith('.')) return null
  const fromDir = path.dirname(path.join(targetRepoPath, fromRelativePath))
  const baseAbsolute = path.resolve(fromDir, specifier)
  const candidates = localImportCandidates(baseAbsolute)
  for (const candidate of candidates) {
    const relative = relativePath(targetRepoPath, candidate)
    if (fileNodesByRelativePath.has(normalizePath(relative))) {
      return relative
    }
  }
  return null
}

function localImportCandidates(baseAbsolute: string): string[] {
  const ext = path.extname(baseAbsolute).toLowerCase()
  const candidates = [baseAbsolute]
  if (ext) {
    const withoutExt = baseAbsolute.slice(0, -ext.length)
    candidates.push(
      ...['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].map((replacementExt) => `${withoutExt}${replacementExt}`),
    )
  } else {
    candidates.push(
      ...[...supportedExtensions].map((candidateExt) => `${baseAbsolute}${candidateExt}`),
      ...[...supportedExtensions].map((candidateExt) => path.join(baseAbsolute, `index${candidateExt}`)),
    )
  }
  if (ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs') {
    const withoutExt = baseAbsolute.slice(0, -ext.length)
    candidates.push(`${withoutExt}.ts`, `${withoutExt}.tsx`)
  }
  return [...new Set(candidates)]
}

function matchesInclude(relativeFilePath: string, includePatterns: string[]): boolean {
  return includePatterns.some((pattern) => matchScopeCompliancePathPattern(pattern, relativeFilePath).matched)
}

function scriptKindForPath(filePath: string): ts.ScriptKind {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.tsx') return ts.ScriptKind.TSX
  if (ext === '.jsx') return ts.ScriptKind.JSX
  if (ext === '.js' || ext === '.mjs' || ext === '.cjs') return ts.ScriptKind.JS
  return ts.ScriptKind.TS
}

function visitSourceFile(sourceFile: ts.SourceFile, visitor: (node: ts.Node) => void): void {
  function visit(node: ts.Node): void {
    visitor(node)
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
}

function moduleSpecifierText(moduleSpecifier: ts.Expression | undefined): string | null {
  return moduleSpecifier && ts.isStringLiteralLike(moduleSpecifier) ? moduleSpecifier.text : null
}

function externalModuleReferenceText(moduleReference: ts.ModuleReference): string | null {
  if (!ts.isExternalModuleReference(moduleReference)) return null
  return moduleSpecifierText(moduleReference.expression)
}

function requireCallSpecifier(node: ts.Node): string | null {
  if (!ts.isCallExpression(node)) return null
  if (!ts.isIdentifier(node.expression) || node.expression.text !== 'require') return null
  const [firstArg] = node.arguments
  return firstArg && ts.isStringLiteralLike(firstArg) ? firstArg.text : null
}

function dynamicImportCallSpecifier(node: ts.Node): string | null {
  if (!ts.isCallExpression(node)) return null
  if (node.expression.kind !== ts.SyntaxKind.ImportKeyword) return null
  const [firstArg] = node.arguments
  return firstArg && ts.isStringLiteralLike(firstArg) ? firstArg.text : null
}

function addRequireBindings(
  fileIndex: FileIndex,
  callExpression: ts.CallExpression,
  specifier: string,
  targetFile: string | null,
): void {
  const parent = callExpression.parent
  if (!parent || !ts.isVariableDeclaration(parent)) return
  if (ts.isIdentifier(parent.name)) {
    addNamespaceImport(fileIndex, {
      localName: parent.name.text,
      importedName: '*',
      specifier,
      targetFile,
      kind: 'require',
      typeOnly: false,
    })
    return
  }
  if (ts.isObjectBindingPattern(parent.name)) {
    for (const element of parent.name.elements) {
      if (!ts.isIdentifier(element.name)) continue
      const importedName = propertyNameText(element.propertyName, fileIndex.sourceFile.ast) ?? element.name.text
      addImportBinding(fileIndex, {
        localName: element.name.text,
        importedName,
        specifier,
        targetFile,
        kind: 'require',
        typeOnly: false,
      })
    }
  }
}

function addImportBinding(fileIndex: FileIndex, binding: ImportBinding): void {
  addMapEntry(fileIndex.importedBindingsByLocalName, normalizeToken(binding.localName), binding)
}

function addNamespaceImport(fileIndex: FileIndex, binding: ImportBinding): void {
  addMapEntry(fileIndex.namespaceImportsByLocalName, normalizeToken(binding.localName), binding)
}

function addReExport(fileIndex: FileIndex, binding: ReExportBinding): void {
  addMapEntry(fileIndex.reExportsByName, normalizeToken(binding.exportedName), binding)
}

function hasExportModifier(node: ts.Node): boolean {
  return Boolean(
    ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((entry) => entry.kind === ts.SyntaxKind.ExportKeyword),
  )
}

function hasDefaultModifier(node: ts.Node): boolean {
  return Boolean(
    ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((entry) => entry.kind === ts.SyntaxKind.DefaultKeyword),
  )
}

function isExportedVariableDeclaration(node: ts.VariableDeclaration): boolean {
  const declarationList = node.parent
  const statement = declarationList?.parent
  return Boolean(statement && ts.isVariableStatement(statement) && hasExportModifier(statement))
}

function isTopLevelVariableDeclaration(node: ts.VariableDeclaration): boolean {
  const declarationList = node.parent
  const statement = declarationList?.parent
  return Boolean(statement && ts.isVariableStatement(statement) && ts.isSourceFile(statement.parent))
}

function hasHeritageClauses(node: ts.Node): node is ts.ClassDeclaration | ts.InterfaceDeclaration {
  return ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)
}

function isFunctionLikeExpression(expression: ts.Expression): expression is ts.ArrowFunction | ts.FunctionExpression {
  return ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)
}

function skipOuterExpressions(expression: ts.Expression | undefined): ts.Expression | undefined {
  let current = expression
  while (
    current &&
    (ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isTypeAssertionExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isNonNullExpression(current))
  ) {
    current = current.expression
  }
  return current
}

function propertyNameText(
  name: ts.PropertyName | ts.BindingName | undefined,
  sourceFile: ts.SourceFile,
): string | null {
  if (!name) return null
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  if (ts.isPrivateIdentifier(name)) return name.text
  if (ts.isComputedPropertyName(name)) {
    const expression = skipOuterExpressions(name.expression)
    if (expression && (ts.isStringLiteral(expression) || ts.isNumericLiteral(expression))) return expression.text
  }
  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) return null
  return name.getText(sourceFile)
}

function isReferencePropertyAccess(node: ts.PropertyAccessExpression): boolean {
  return !ts.isQualifiedName(node.parent)
}

function isReferenceIdentifier(node: ts.Identifier): boolean {
  const parent = node.parent
  if (!parent) return true
  if (isDeclarationName(node, parent)) return false
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return false
  if (ts.isPropertyAssignment(parent) && parent.name === node) return false
  if (ts.isShorthandPropertyAssignment(parent) && parent.name === node) return true
  if (ts.isImportClause(parent) || ts.isImportSpecifier(parent) || ts.isNamespaceImport(parent)) return false
  if (ts.isExportSpecifier(parent)) return false
  if (ts.isLiteralTypeNode(parent)) return false
  if (ts.isPropertySignature(parent) && parent.name === node) return false
  if (ts.isMethodSignature(parent) && parent.name === node) return false
  if (ts.isTypeParameterDeclaration(parent) && parent.name === node) return false
  if (ts.isLabeledStatement(parent)) return false
  return true
}

function isDeclarationName(node: ts.Identifier, parent: ts.Node): boolean {
  return (
    (ts.isFunctionDeclaration(parent) && parent.name === node) ||
    (ts.isClassDeclaration(parent) && parent.name === node) ||
    (ts.isInterfaceDeclaration(parent) && parent.name === node) ||
    (ts.isTypeAliasDeclaration(parent) && parent.name === node) ||
    (ts.isEnumDeclaration(parent) && parent.name === node) ||
    (ts.isVariableDeclaration(parent) && parent.name === node) ||
    (ts.isParameter(parent) && parent.name === node) ||
    (ts.isBindingElement(parent) && parent.name === node) ||
    (ts.isMethodDeclaration(parent) && parent.name === node) ||
    (ts.isPropertyDeclaration(parent) && parent.name === node) ||
    (ts.isGetAccessorDeclaration(parent) && parent.name === node) ||
    (ts.isSetAccessorDeclaration(parent) && parent.name === node)
  )
}

function filterSymbolsByKind(symbols: SymbolRecord[], kinds: SymbolNodeKind[]): SymbolRecord[] {
  const kindSet = new Set(kinds)
  return symbols.filter((symbol) => kindSet.has(symbol.kind))
}

function resolvedFromSymbolsOrAmbiguous(
  state: ExtractionState,
  name: string,
  symbols: SymbolRecord[],
  confidence: Confidence,
): ResolvedTarget[] | 'ambiguous' {
  const unique = uniqueSymbols(symbols)
  if (unique.length > 1) {
    recordAmbiguous(state, name)
    return 'ambiguous'
  }
  return unique.map((symbol) => ({ id: symbol.id, confidence }))
}

function uniqueSymbols(symbols: SymbolRecord[]): SymbolRecord[] {
  const seen = new Set<string>()
  const unique: SymbolRecord[] = []
  for (const symbol of symbols) {
    if (seen.has(symbol.id)) continue
    seen.add(symbol.id)
    unique.push(symbol)
  }
  return unique
}

function uniqueResolvedTargets(targets: ResolvedTarget[]): ResolvedTarget[] {
  const seen = new Set<string>()
  const unique: ResolvedTarget[] = []
  for (const target of targets) {
    if (seen.has(target.id)) continue
    seen.add(target.id)
    unique.push(target)
  }
  return unique
}

function recordAmbiguous(state: ExtractionState, name: string): void {
  if (name.trim().length > 0) {
    state.ambiguousCallNames.add(name)
  }
}

function addMapEntry<T>(map: Map<string, T[]>, key: string, value: T): void {
  map.set(key, [...(map.get(key) ?? []), value])
}

function classMethodKey(classId: string, methodName: string): string {
  return `${classId}:${normalizeToken(methodName)}`
}

function locationRange(sourceFile: SourceFileRecord, startIndex: number, endIndex: number): JsonRecord {
  const start = sourceFile.ast.getLineAndCharacterOfPosition(clampIndex(sourceFile, startIndex))
  const end = sourceFile.ast.getLineAndCharacterOfPosition(clampIndex(sourceFile, endIndex))
  return {
    startLine: start.line + 1,
    startColumn: start.character + 1,
    endLine: end.line + 1,
    endColumn: end.character + 1,
  }
}

function clampIndex(sourceFile: SourceFileRecord, index: number): number {
  return Math.max(0, Math.min(index, sourceFile.content.length))
}

function lineColumnId(sourceFile: SourceFileRecord, index: number): string {
  const location = sourceFile.ast.getLineAndCharacterOfPosition(clampIndex(sourceFile, index))
  return `l${location.line + 1}c${location.character + 1}`
}

function blocker(
  code: string,
  message: string,
  field?: string,
  pathValue?: string,
): NativeCodeSubgraphExtractionFinding {
  return { severity: 'blocker', code, message, field, path: pathValue }
}

function warning(
  code: string,
  message: string,
  field?: string,
  pathValue?: string,
): NativeCodeSubgraphExtractionFinding {
  return { severity: 'warning', code, message, field, path: pathValue }
}

function uniqueNodeId(state: ExtractionState, base: string): string {
  return uniqueId(base, state.seenNodeIds)
}

function uniqueEdgeId(state: ExtractionState, base: string): string {
  return uniqueId(base, state.seenEdgeIds)
}

function uniqueId(base: string, seen: Set<string>): string {
  let candidate = base
  let suffix = 2
  while (seen.has(normalizeToken(candidate))) {
    candidate = `${base}.${suffix}`
    suffix += 1
  }
  seen.add(normalizeToken(candidate))
  return candidate
}

function formatCounts(counts: Record<string, number>): string {
  const entries = Object.entries(counts).sort(([left], [right]) => left.localeCompare(right))
  return entries.length === 0 ? 'none' : entries.map(([kind, count]) => `${kind}:${count}`).join(', ')
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function sanitizeId(value: string): string {
  return (
    normalizePath(value)
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '') || 'unknown'
  )
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').toLowerCase()
}

function normalizeToken(value: string): string {
  return normalizePath(value)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(root, filePath)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}

function isSourceAuthorityShapedPath(filePath: string): boolean {
  const normalized = normalizePath(filePath)
  return (
    normalized.includes('/graph-source') ||
    normalized.includes('/source-authority') ||
    normalized.includes('/read-model') ||
    normalized.endsWith('maintainability-graph.json')
  )
}

function isProtectedControlPath(root: string, filePath: string): boolean {
  const relative = relativePath(root, filePath)
  return (
    hasDevViewControlDirectory(relative) ||
    hasCodexControlDirectory(relative) ||
    hasHiddenControlDirectorySegment(relative)
  )
}
