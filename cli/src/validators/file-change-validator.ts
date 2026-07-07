import { readGitChangedFiles, normalizeGitPath, type GitChangedFile } from '../core/git-diff.js'
import { normalizePbeState, PBE_STATE } from '../core/state-machine.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import { arrayStrings, nodesOf, readJsonIfExists, stringValue, type JsonObject } from './shared.js'

export interface FileChangeValidationOptions {
  enforceReviewGuard?: boolean
}

export async function validateFileChanges(
  root: string,
  options: FileChangeValidationOptions = {},
): Promise<ValidationIssue[]> {
  const diff = await readGitChangedFiles(root)
  if (!diff.ok) {
    return [
      issue({
        validator: 'FileChangeGuard',
        code: 'GIT_DIFF_UNAVAILABLE',
        severity: 'warning',
        message: `Could not read git changed files: ${diff.error}`,
        suggestedFix: 'Run this command inside a git repository, or verify file changes manually before review/accept.',
      }),
    ]
  }

  const changedFiles = diff.files.filter((file) => !isIgnoredPath(file.path))
  const sourceFiles = changedFiles.filter((file) => !isPbeArtifact(file.path))
  if (sourceFiles.length === 0) {
    return []
  }

  const workTree = await readJsonIfExists(root, 'workTree')
  const pbeState = await readJsonIfExists(root, 'pbeState')
  const context = buildFileGuardContext(workTree, pbeState)
  const issues: ValidationIssue[] = []

  for (const file of sourceFiles) {
    const forbiddenMatch = findMatchingWorkFile(context.allActiveWorkNodes, file.path, 'forbiddenFiles')
    if (forbiddenMatch) {
      issues.push(
        issue({
          validator: 'FileChangeGuard',
          code: 'FILE_CHANGE_FORBIDDEN',
          severity: 'error',
          file: file.path,
          nodeId: forbiddenMatch.workId,
          stage: 'file_change_guard',
          message: `Changed file ${file.path} matches forbiddenFiles for Work node ${forbiddenMatch.workId}.`,
          suggestedFix: 'Remove the forbidden file change or update Work scope through WPD before continuing.',
          nextCommand: 'devview wpd close',
        }),
      )
      continue
    }

    if (requiresRevisionContext(context, options) && !context.activeRevision) {
      issues.push(
        issue({
          validator: 'FileChangeGuard',
          code: 'FILE_CHANGE_REQUIRES_REVISION',
          severity: 'error',
          file: file.path,
          stage: 'file_change_guard',
          message: `Protected ${context.currentState || 'review'} state has source file changes without active Revision context: ${file.path}.`,
          suggestedFix:
            'Create a Change node, run impact analysis, then start a revision before modifying accepted or review scope.',
          nextCommand: 'devview change create',
        }),
      )
      continue
    }

    const expectedMatch = findMatchingWorkFile(context.allowedWorkNodes, file.path, 'expected')
    if (expectedMatch) {
      continue
    }

    if (context.activeRevision) {
      issues.push(
        issue({
          validator: 'FileChangeGuard',
          code: 'FILE_CHANGE_OUTSIDE_WORK_SCOPE',
          severity: 'error',
          file: file.path,
          stage: 'file_change_guard',
          message: `Changed file ${file.path} is outside the active Revision affected Work expectedFiles/expectedSharedFiles.`,
          suggestedFix: 'Add the affected Work node through Impact analysis or revert the out-of-scope file change.',
          nextCommand: 'devview impact analyze',
        }),
      )
      continue
    }

    if (context.hasUnknownFileTouchRisk) {
      issues.push(
        issue({
          validator: 'FileChangeGuard',
          code: 'FILE_CHANGE_UNKNOWN_RISK',
          severity: 'warning',
          file: file.path,
          stage: 'file_change_guard',
          message: `Changed file ${file.path} is not declared in expectedFiles, but a Work node is marked unknownFileTouchRisk.`,
          suggestedFix: 'Narrow the WorkGraph expectedFiles/expectedSharedFiles before review when possible.',
          nextCommand: 'devview wpd close',
        }),
      )
      continue
    }

    issues.push(
      issue({
        validator: 'FileChangeGuard',
        code: 'FILE_CHANGE_OUTSIDE_WORK_SCOPE',
        severity: 'error',
        file: file.path,
        stage: 'file_change_guard',
        message: `Changed file ${file.path} is outside selected/foundation Work expectedFiles/expectedSharedFiles.`,
        suggestedFix: 'Declare the file in Work Tree scope, create a Change/Impact/Revision path, or revert it.',
        nextCommand: 'devview wpd close',
      }),
    )
  }

  return issues
}

interface FileGuardContext {
  currentState: string | null
  activeRevision: JsonObject | null
  allActiveWorkNodes: JsonObject[]
  allowedWorkNodes: JsonObject[]
  hasUnknownFileTouchRisk: boolean
}

type WorkFileField = 'expected' | 'forbiddenFiles'

function buildFileGuardContext(workTree: JsonObject | null, pbeState: JsonObject | null): FileGuardContext {
  const currentState = normalizePbeState(getAutoflowState(pbeState))
  const activeRevision = objectOrNull(pbeState?.activeRevision)
  const allActiveWorkNodes = nodesOf(workTree).filter((node) => {
    const id = stringValue(node.id)
    return (
      id !== stringValue(workTree?.rootNodeId) &&
      ['selected', 'foundation'].includes(stringValue(node.scopeClass)) &&
      !['deferred', 'blocked', 'out_of_scope'].includes(stringValue(node.status))
    )
  })
  const affectedWorkIds = new Set([
    ...arrayStrings(activeRevision?.affectedWorkNodeIds),
    ...arrayStrings(activeRevision?.affectedNodeIds).filter((id) => id.toUpperCase().startsWith('WT-')),
  ])
  const allowedWorkNodes =
    activeRevision && affectedWorkIds.size > 0
      ? allActiveWorkNodes.filter((node) => affectedWorkIds.has(stringValue(node.id)))
      : allActiveWorkNodes

  return {
    currentState,
    activeRevision,
    allActiveWorkNodes,
    allowedWorkNodes,
    hasUnknownFileTouchRisk: allowedWorkNodes.some((node) => node.unknownFileTouchRisk === true),
  }
}

function requiresRevisionContext(context: FileGuardContext, options: FileChangeValidationOptions): boolean {
  return (
    options.enforceReviewGuard === true ||
    context.currentState === PBE_STATE.ACCEPTED ||
    context.currentState === PBE_STATE.DONE ||
    context.currentState === PBE_STATE.WAITING_REVIEW_RESULT
  )
}

function findMatchingWorkFile(
  workNodes: JsonObject[],
  filePath: string,
  field: WorkFileField,
): { workId: string; pattern: string } | null {
  for (const workNode of workNodes) {
    const patterns =
      field === 'expected'
        ? [...arrayStrings(workNode.expectedFiles), ...arrayStrings(workNode.expectedSharedFiles)]
        : arrayStrings(workNode.forbiddenFiles)
    const pattern = patterns.find((entry) => pathMatches(filePath, entry))
    if (pattern) {
      return {
        workId: stringValue(workNode.id),
        pattern,
      }
    }
  }
  return null
}

function pathMatches(filePath: string, pattern: string): boolean {
  const normalizedFile = normalizeForMatch(filePath)
  const normalizedPattern = normalizeForMatch(pattern)
  if (!normalizedPattern) {
    return false
  }
  if (normalizedFile === normalizedPattern) {
    return true
  }
  if (normalizedPattern.endsWith('/')) {
    return normalizedFile.startsWith(normalizedPattern)
  }
  if (normalizedPattern.endsWith('/**')) {
    return normalizedFile.startsWith(normalizedPattern.slice(0, -2))
  }
  if (normalizedPattern.includes('*')) {
    const escaped = normalizedPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*')
    return new RegExp(`^${escaped}$`).test(normalizedFile)
  }
  return false
}

function isIgnoredPath(filePath: string): boolean {
  const normalized = normalizeForMatch(filePath)
  return (
    normalized.startsWith('.git/') ||
    normalized.startsWith('node_modules/') ||
    normalized.startsWith('dist/') ||
    normalized.startsWith('coverage/') ||
    normalized.startsWith('.cache/') ||
    normalized.startsWith('tmp/') ||
    normalized.startsWith('temp/') ||
    normalized.endsWith('.tmp')
  )
}

function isPbeArtifact(filePath: string): boolean {
  const normalized = normalizeForMatch(filePath)
  return normalized.startsWith('.pbe/') || normalized.startsWith('.devview/')
}

function normalizeForMatch(filePath: string): string {
  return normalizeGitPath(filePath).toLowerCase()
}

function getAutoflowState(pbeState: JsonObject | null): string {
  const autoflow = objectOrNull(pbeState?.autoflow)
  return stringValue(autoflow?.state)
}

function objectOrNull(value: unknown): JsonObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonObject) : null
}

export function classifyChangedFiles(files: GitChangedFile[]): { pbeArtifacts: string[]; sourceFiles: string[] } {
  const visibleFiles = files.map((file) => file.path).filter((file) => !isIgnoredPath(file))
  return {
    pbeArtifacts: visibleFiles.filter(isPbeArtifact),
    sourceFiles: visibleFiles.filter((file) => !isPbeArtifact(file)),
  }
}
