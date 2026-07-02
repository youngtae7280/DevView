import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import { relativePath, writeJsonAtomic } from './fs.js'

const execFileAsync = promisify(execFile)

export const defaultGitDerivedChangedFileCollectionPath =
  'examples/valid/todo-app-pbe-run/generated/git-derived-changed-file-collection.runtime-evidence-only.preview.json'

export interface GitDerivedCollectionOptions {
  baseRef: string
  headRef: string
  output?: string
}

export interface ParsedNameStatusEntry {
  status: string
  statusCode: string
  path?: string
  oldPath?: string
  newPath?: string
}

export interface NormalizedChangedFileEntry {
  status: string
  statusCode: string
  changeType: string
  path?: string
  oldPath?: string
  newPath?: string
  generatedPath: boolean
}

export interface GitDerivedChangedFileCollectionArtifact {
  schemaVersion: 1
  artifactRole: 'git-derived-changed-file-collection-preview'
  status: 'git-derived-changed-files-collected'
  fixtureId: 'calibration-fixture-todo-app-runtime-evidence-only'
  fixtureShape: 'test-only-behavior-proof'
  checkerAxis: 'scope-compliance-preview'
  collectionStatus: 'git-derived-changed-files-collected'
  authorityClass: 'git-derived-changed-files'
  collectionMode: 'explicit-base-head'
  baseRef: string
  headRef: string
  resolvedBaseRef?: string
  resolvedHeadRef?: string
  changedFilesCollected: true
  checkerRun: false
  scopeComplianceEvaluationStatus: 'not-evaluated'
  evaluatedViolations: []
  actualDiffInspected: false
  patchContentsInspected: false
  gitNameStatusCollected: true
  scopeEnforced: false
  diffRejected: false
  cleanClaimed: false
  actualViolationClaimed: false
  changedFiles: ParsedNameStatusEntry[]
  normalizedChangedFiles: NormalizedChangedFileEntry[]
  pathNormalization: {
    policy: 'repository-root-relative-posix-paths'
    windowsBackslashNormalization: 'replace-backslash-with-forward-slash'
    absoluteLocalPathsAllowed: false
    emittedAbsoluteLocalPaths: false
    repositoryRootRelative: true
    caseSensitivity: 'repository-policy-unresolved'
  }
  renameDeleteHandling: {
    commandMode: 'name-status-with-renames'
    renameStatusPreserved: boolean
    deletedStatusPreserved: boolean
    copiedStatusPreserved: boolean
  }
  generatedFileHandling: {
    policy: 'report-generated-files-honestly'
    generatedFilesExcluded: false
    generatedFilesPresent: boolean
    generatedFiles: string[]
    suppressionPolicy: 'not-applied-separate-policy-required'
  }
  collectionWarnings: string[]
  allowedUse: string[]
  forbiddenUse: string[]
  nonEvaluationBoundary: string
}

export interface GitDerivedChangedFileCollectionResult {
  artifact: GitDerivedChangedFileCollectionArtifact
  outputPath: string
}

export function validateExplicitGitRef(label: 'base' | 'head', value: string | undefined): string[] {
  const problems: string[] = []
  if (!value || value.trim().length === 0) {
    return [`${label} ref is required.`]
  }
  if (value !== value.trim()) {
    problems.push(`${label} ref must not include leading or trailing whitespace.`)
  }
  if (value.startsWith('-')) {
    problems.push(`${label} ref must not start with "-".`)
  }
  if (/\s/.test(value)) {
    problems.push(`${label} ref must not include whitespace.`)
  }
  if (value.includes('\0')) {
    problems.push(`${label} ref must not include NUL bytes.`)
  }
  if (value.length > 256) {
    problems.push(`${label} ref is unexpectedly long.`)
  }
  return problems
}

export function parseNameStatusZ(output: string): ParsedNameStatusEntry[] {
  const tokens = output.split('\0').filter((entry) => entry.length > 0)
  const entries: ParsedNameStatusEntry[] = []
  for (let index = 0; index < tokens.length; index += 1) {
    const status = tokens[index]
    const statusCode = status.slice(0, 1)
    if (statusCode === 'R' || statusCode === 'C') {
      const oldPath = tokens[index + 1]
      const newPath = tokens[index + 2]
      if (oldPath && newPath) {
        entries.push({ status, statusCode, oldPath, newPath })
      }
      index += 2
    } else {
      const filePath = tokens[index + 1]
      if (filePath) {
        entries.push({ status, statusCode, path: filePath })
      }
      index += 1
    }
  }
  return entries
}

export function normalizeRepositoryRelativePath(filePath: string): { path: string; warnings: string[] } {
  const warnings: string[] = []
  let normalized = filePath.replaceAll('\\', '/').replace(/^\.\/+/, '')
  const windowsAbsolute = /^[A-Za-z]:\//.test(normalized)
  const posixAbsolute = normalized.startsWith('/')
  if (windowsAbsolute || posixAbsolute) {
    warnings.push(`Changed-file path was absolute and was stripped to avoid local path authority: ${filePath}`)
    normalized = normalized.replace(/^[A-Za-z]:\//, '').replace(/^\/+/, '')
  }
  while (normalized.includes('//')) {
    normalized = normalized.replaceAll('//', '/')
  }
  if (normalized === '..' || normalized.startsWith('../')) {
    warnings.push(`Changed-file path escapes the repository root and cannot be authoritative: ${filePath}`)
    normalized = normalized.replace(/^(\.\.\/)+/, '')
  }
  return { path: normalized, warnings }
}

export function buildGitDerivedChangedFileCollectionArtifact(input: {
  baseRef: string
  headRef: string
  resolvedBaseRef?: string
  resolvedHeadRef?: string
  nameStatusOutput: string
}): GitDerivedChangedFileCollectionArtifact {
  const parsed = parseNameStatusZ(input.nameStatusOutput)
  const collectionWarnings: string[] = []
  const normalizedChangedFiles = parsed.map((entry): NormalizedChangedFileEntry => {
    const normalizedPath = entry.path ? normalizeRepositoryRelativePath(entry.path) : undefined
    const normalizedOldPath = entry.oldPath ? normalizeRepositoryRelativePath(entry.oldPath) : undefined
    const normalizedNewPath = entry.newPath ? normalizeRepositoryRelativePath(entry.newPath) : undefined
    for (const normalization of [normalizedPath, normalizedOldPath, normalizedNewPath]) {
      if (normalization) {
        collectionWarnings.push(...normalization.warnings)
      }
    }
    const pathForGeneratedCheck = normalizedPath?.path || normalizedNewPath?.path || normalizedOldPath?.path || ''
    return {
      status: entry.status,
      statusCode: entry.statusCode,
      changeType: changeTypeForStatus(entry.statusCode),
      ...(normalizedPath ? { path: normalizedPath.path } : {}),
      ...(normalizedOldPath ? { oldPath: normalizedOldPath.path } : {}),
      ...(normalizedNewPath ? { newPath: normalizedNewPath.path } : {}),
      generatedPath: isGeneratedPath(pathForGeneratedCheck),
    }
  })
  const generatedFiles = normalizedChangedFiles
    .flatMap((entry) => [entry.path, entry.oldPath, entry.newPath].filter((value): value is string => Boolean(value)))
    .filter(isGeneratedPath)

  return {
    schemaVersion: 1,
    artifactRole: 'git-derived-changed-file-collection-preview',
    status: 'git-derived-changed-files-collected',
    fixtureId: 'calibration-fixture-todo-app-runtime-evidence-only',
    fixtureShape: 'test-only-behavior-proof',
    checkerAxis: 'scope-compliance-preview',
    collectionStatus: 'git-derived-changed-files-collected',
    authorityClass: 'git-derived-changed-files',
    collectionMode: 'explicit-base-head',
    baseRef: input.baseRef,
    headRef: input.headRef,
    ...(input.resolvedBaseRef ? { resolvedBaseRef: input.resolvedBaseRef } : {}),
    ...(input.resolvedHeadRef ? { resolvedHeadRef: input.resolvedHeadRef } : {}),
    changedFilesCollected: true,
    checkerRun: false,
    scopeComplianceEvaluationStatus: 'not-evaluated',
    evaluatedViolations: [],
    actualDiffInspected: false,
    patchContentsInspected: false,
    gitNameStatusCollected: true,
    scopeEnforced: false,
    diffRejected: false,
    cleanClaimed: false,
    actualViolationClaimed: false,
    changedFiles: parsed,
    normalizedChangedFiles,
    pathNormalization: {
      policy: 'repository-root-relative-posix-paths',
      windowsBackslashNormalization: 'replace-backslash-with-forward-slash',
      absoluteLocalPathsAllowed: false,
      emittedAbsoluteLocalPaths: false,
      repositoryRootRelative: true,
      caseSensitivity: 'repository-policy-unresolved',
    },
    renameDeleteHandling: {
      commandMode: 'name-status-with-renames',
      renameStatusPreserved: parsed.some((entry) => entry.statusCode === 'R'),
      deletedStatusPreserved: parsed.some((entry) => entry.statusCode === 'D'),
      copiedStatusPreserved: parsed.some((entry) => entry.statusCode === 'C'),
    },
    generatedFileHandling: {
      policy: 'report-generated-files-honestly',
      generatedFilesExcluded: false,
      generatedFilesPresent: generatedFiles.length > 0,
      generatedFiles: [...new Set(generatedFiles)],
      suppressionPolicy: 'not-applied-separate-policy-required',
    },
    collectionWarnings: [...new Set(collectionWarnings)],
    allowedUse: [
      'collect git-derived changed-file names and status for a later scope compliance input',
      'review normalized repository-root-relative paths',
      'confirm that collection-only output keeps checkerRun false',
      'prepare a later non-enforcing scope evaluation slice',
    ],
    forbiddenUse: [
      'scope compliance evaluation',
      'allowedScope comparison',
      'forbiddenScope comparison',
      'no-violation claim',
      'actual violation claim',
      'diff rejection',
      'scope enforcement',
      'CI enforcement',
      'required check configuration',
      'fixture approval',
      'runtime Evidence satisfaction',
      'equivalence proof',
      'user acceptance',
    ],
    nonEvaluationBoundary:
      'This artifact is collection-only. It records git-derived changed-file names/status between explicit refs, but it does not inspect patch contents, evaluate allowedScope or forbiddenScope, run the compliance checker, report clean or violation results, reject diffs, enforce scope, approve fixtures, satisfy runtime Evidence, or prove equivalence.',
  }
}

export async function collectGitDerivedChangedFiles(
  root: string,
  options: GitDerivedCollectionOptions,
): Promise<GitDerivedChangedFileCollectionResult> {
  const validationProblems = [
    ...validateExplicitGitRef('base', options.baseRef),
    ...validateExplicitGitRef('head', options.headRef),
  ]
  if (validationProblems.length > 0) {
    throw new Error(validationProblems.join(' '))
  }

  const [resolvedBaseRef, resolvedHeadRef, nameStatusOutput] = await Promise.all([
    resolveCommitRef(root, options.baseRef),
    resolveCommitRef(root, options.headRef),
    readGitNameStatus(root, options.baseRef, options.headRef),
  ])
  const artifact = buildGitDerivedChangedFileCollectionArtifact({
    baseRef: options.baseRef,
    headRef: options.headRef,
    resolvedBaseRef,
    resolvedHeadRef,
    nameStatusOutput,
  })
  const outputPath = path.resolve(root, options.output || defaultGitDerivedChangedFileCollectionPath)
  await writeJsonAtomic(outputPath, artifact)
  return {
    artifact,
    outputPath: relativePath(root, outputPath),
  }
}

async function resolveCommitRef(root: string, ref: string): Promise<string> {
  const { stdout } = await execFileAsync('git', ['-C', root, 'rev-parse', '--verify', `${ref}^{commit}`], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  return stdout.trim()
}

async function readGitNameStatus(root: string, baseRef: string, headRef: string): Promise<string> {
  const { stdout } = await execFileAsync(
    'git',
    ['-C', root, 'diff', '--name-status', '--find-renames', '-z', baseRef, headRef, '--'],
    {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10,
    },
  )
  return stdout
}

function changeTypeForStatus(statusCode: string): string {
  const map: Record<string, string> = {
    A: 'added',
    C: 'copied',
    D: 'deleted',
    M: 'modified',
    R: 'renamed',
    T: 'type-changed',
    U: 'unmerged',
    X: 'unknown',
  }
  return map[statusCode] || 'other'
}

function isGeneratedPath(filePath: string): boolean {
  return filePath.split('/').includes('generated')
}
