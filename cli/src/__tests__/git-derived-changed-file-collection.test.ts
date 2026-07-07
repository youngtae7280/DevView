import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import {
  buildGitDerivedChangedFileCollectionArtifact,
  collectGitDerivedChangedFiles,
  normalizeRepositoryRelativePath,
  parseNameStatusZ,
  validateExplicitGitRef,
} from '../core/git-derived-changed-file-collection'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeText } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('git-derived changed-file collection', () => {
  it('validates explicit base/head refs before collection', () => {
    expect(validateExplicitGitRef('base', '')).toContain('base ref is required.')
    expect(validateExplicitGitRef('head', '-HEAD')).toContain('head ref must not start with "-".')
    expect(validateExplicitGitRef('base', 'feature branch')).toContain('base ref must not include whitespace.')
    expect(validateExplicitGitRef('head', 'HEAD')).toEqual([])
  })

  it('parses name-status output without patch contents', () => {
    const parsed = parseNameStatusZ(
      ['M', 'docs/readme.md', 'R100', 'src/old.ts', 'src/new.ts', 'D', 'src/old-api.ts'].join('\0'),
    )

    expect(parsed).toEqual([
      { status: 'M', statusCode: 'M', path: 'docs/readme.md' },
      { status: 'R100', statusCode: 'R', oldPath: 'src/old.ts', newPath: 'src/new.ts' },
      { status: 'D', statusCode: 'D', path: 'src/old-api.ts' },
    ])
  })

  it('normalizes paths to repository-relative POSIX style', () => {
    expect(normalizeRepositoryRelativePath('examples\\valid\\todo-app-devview-run\\generated\\result.json')).toEqual({
      path: 'examples/valid/todo-app-devview-run/generated/result.json',
      warnings: [],
    })
  })

  it('builds a collection-only result shape without scope evaluation', () => {
    const artifact = buildGitDerivedChangedFileCollectionArtifact({
      baseRef: 'base-ref',
      headRef: 'head-ref',
      resolvedBaseRef: '1111111111111111111111111111111111111111',
      resolvedHeadRef: '2222222222222222222222222222222222222222',
      nameStatusOutput: [
        'M',
        'docs\\concept\\scope-compliance-checker-implementation-readiness.md',
        'A',
        'examples/valid/todo-app-devview-run/generated/result.json',
      ].join('\0'),
    })

    expect(artifact.collectionStatus).toBe('git-derived-changed-files-collected')
    expect(artifact.scopeComplianceCollectionInputConsumptionStatus).toBe(
      'scope-compliance-collection-input-consumption-previewed',
    )
    expect(artifact.scopeComplianceScopeInputBindingStatus).toBe('scope-compliance-scope-input-binding-previewed')
    expect(artifact.scopeCompliancePathPatternPolicyStatus).toBe('scope-compliance-path-pattern-policy-previewed')
    expect(artifact.scopeCompliancePathMatchingHelperStatus).toBe('helper-implemented-not-consumed-for-evaluation')
    expect(artifact.scopeComplianceViolationCategorySchemaStatus).toBe(
      'scope-compliance-violation-category-schema-previewed',
    )
    expect(artifact.scopeComplianceEvaluationResultShapeStatus).toBe(
      'scope-compliance-evaluation-result-shape-previewed',
    )
    expect(artifact.authorityClass).toBe('git-derived-changed-files')
    expect(artifact.collectionMode).toBe('explicit-base-head')
    expect(artifact.sourceMode).toBe('explicit-base-head')
    expect(artifact.gitCommandMode).toBe('diff-name-status-explicit-base-head-with-renames')
    expect(artifact.changedFileNameStatusCollected).toBe(true)
    expect(artifact.stagedChangesIncluded).toBe(false)
    expect(artifact.unstagedTrackedChangesIncluded).toBe(false)
    expect(artifact.untrackedFilesIncluded).toBe(false)
    expect(artifact.changedFilesCollected).toBe(true)
    expect(artifact.checkerRun).toBe(false)
    expect(artifact.scopeComplianceEvaluationStatus).toBe('not-evaluated')
    expect(artifact.evaluatedViolations).toEqual([])
    expect(artifact.actualDiffInspected).toBe(false)
    expect(artifact.patchContentsInspected).toBe(false)
    expect(artifact.normalizedChangedFiles.map((entry) => entry.path)).toEqual([
      'docs/concept/scope-compliance-checker-implementation-readiness.md',
      'examples/valid/todo-app-devview-run/generated/result.json',
    ])
    expect(artifact.generatedFileHandling.generatedFilesPresent).toBe(true)
    expect(artifact.generatedFileHandling.generatedFiles).toEqual([
      'examples/valid/todo-app-devview-run/generated/result.json',
    ])
    expect(artifact.sourceArtifacts.scopeComplianceCollectionInputConsumption).toBe(
      'examples/valid/todo-app-devview-run/generated/scope-compliance-collection-input-consumption.runtime-evidence-only.preview.json',
    )
    expect(artifact.sourceArtifacts.scopeComplianceScopeInputBinding).toBe(
      'examples/valid/todo-app-devview-run/generated/scope-compliance-scope-input-binding.runtime-evidence-only.preview.json',
    )
    expect(artifact.sourceArtifacts.scopeCompliancePathPatternPolicy).toBe(
      'examples/valid/todo-app-devview-run/generated/scope-compliance-path-pattern-policy.runtime-evidence-only.preview.json',
    )
    expect(artifact.sourceArtifacts.scopeCompliancePathMatchingHelper).toBe(
      'cli/src/core/scope-compliance-path-pattern.ts',
    )
    expect(artifact.sourceArtifacts.scopeComplianceViolationCategorySchema).toBe(
      'examples/valid/todo-app-devview-run/generated/scope-compliance-violation-category-schema.runtime-evidence-only.preview.json',
    )
    expect(artifact.sourceArtifacts.scopeComplianceEvaluationResultShape).toBe(
      'examples/valid/todo-app-devview-run/generated/scope-compliance-evaluation-result-shape.runtime-evidence-only.preview.json',
    )
    expect(artifact.forbiddenUse).toContain('scope compliance evaluation')
    expect(artifact.forbiddenUse).toContain('no-violation claim')
  })

  it('collects tracked unstaged working tree changes without patch contents', async () => {
    const workspace = createCommittedWorkspace('src/todos.ts', 'export const value = "baseline"\n')
    writeText(join(workspace, 'src', 'todos.ts'), 'export const value = "changed"\n')

    const result = await collectGitDerivedChangedFiles(workspace, {
      workingTree: true,
      output: join('.tmp', 'changed-files-working-tree.json'),
    })

    expect(result.artifact.collectionMode).toBe('working-tree-tracked-unstaged')
    expect(result.artifact.sourceMode).toBe('working-tree')
    expect(result.artifact.workingTreeMode).toBe('tracked-unstaged-only')
    expect(result.artifact.gitCommandMode).toBe('diff-name-status-working-tree-with-renames')
    expect(result.artifact.stagedChangesIncluded).toBe(false)
    expect(result.artifact.unstagedTrackedChangesIncluded).toBe(true)
    expect(result.artifact.untrackedFilesIncluded).toBe(false)
    expect(result.artifact.patchContentsInspected).toBe(false)
    expect(result.artifact.changedFileNameStatusCollected).toBe(true)
    expect(result.artifact.checkerRun).toBe(false)
    expect(result.artifact.baseRef).toBeUndefined()
    expect(result.artifact.headRef).toBeUndefined()
    expect(result.artifact.normalizedChangedFiles).toEqual([
      expect.objectContaining({
        path: 'src/todos.ts',
        statusCode: 'M',
        changeType: 'modified',
      }),
    ])
  })

  it('reports zero files for a clean working tree without claiming approval', async () => {
    const workspace = createCommittedWorkspace('src/todos.ts', 'export const value = "baseline"\n')

    const result = await collectGitDerivedChangedFiles(workspace, {
      workingTree: true,
      output: join('.tmp', 'changed-files-working-tree.json'),
    })

    expect(result.artifact.collectionMode).toBe('working-tree-tracked-unstaged')
    expect(result.artifact.normalizedChangedFiles).toEqual([])
    expect(result.artifact.cleanClaimed).toBe(false)
    expect(result.artifact.scopeEnforced).toBe(false)
    expect(result.artifact.diffRejected).toBe(false)
  })

  it('excludes untracked files in working tree mode v1', async () => {
    const workspace = createCommittedWorkspace('src/todos.ts', 'export const value = "baseline"\n')
    writeText(join(workspace, 'src', 'new-file.ts'), 'export const value = "untracked"\n')

    const result = await collectGitDerivedChangedFiles(workspace, {
      workingTree: true,
      output: join('.tmp', 'changed-files-working-tree.json'),
    })

    expect(result.artifact.untrackedFilesIncluded).toBe(false)
    expect(result.artifact.normalizedChangedFiles).toEqual([])
  })

  it('collects staged index changes without unstaged or untracked files', async () => {
    const workspace = createCommittedWorkspace('src/todos.ts', 'export const value = "baseline"\n')
    writeText(join(workspace, 'src', 'todos.ts'), 'export const value = "staged"\n')
    writeText(join(workspace, 'src', 'untracked.ts'), 'export const value = "untracked"\n')
    execFileSync('git', ['add', 'src/todos.ts'], { cwd: workspace, stdio: 'ignore' })

    const result = await collectGitDerivedChangedFiles(workspace, {
      staged: true,
      output: join('.tmp', 'changed-files-staged.json'),
    })

    expect(result.artifact.collectionMode).toBe('staged-index')
    expect(result.artifact.sourceMode).toBe('staged-index')
    expect(result.artifact.stagedMode).toBe('staged-index-only')
    expect(result.artifact.gitCommandMode).toBe('diff-cached-name-status-with-renames')
    expect(result.artifact.stagedChangesIncluded).toBe(true)
    expect(result.artifact.unstagedTrackedChangesIncluded).toBe(false)
    expect(result.artifact.untrackedFilesIncluded).toBe(false)
    expect(result.artifact.patchContentsInspected).toBe(false)
    expect(result.artifact.normalizedChangedFiles).toEqual([
      expect.objectContaining({
        path: 'src/todos.ts',
        statusCode: 'M',
        changeType: 'modified',
      }),
    ])
  })

  it('collects untracked files with explicit untracked provenance', async () => {
    const workspace = createCommittedWorkspace('src/todos.ts', 'export const value = "baseline"\n')
    writeText(join(workspace, 'src', 'untracked.ts'), 'export const value = "untracked"\n')

    const result = await collectGitDerivedChangedFiles(workspace, {
      untracked: true,
      output: join('.tmp', 'changed-files-untracked.json'),
    })

    expect(result.artifact.collectionMode).toBe('untracked-files')
    expect(result.artifact.sourceMode).toBe('untracked-files')
    expect(result.artifact.untrackedMode).toBe('ls-files-others-exclude-standard')
    expect(result.artifact.gitCommandMode).toBe('ls-files-others-exclude-standard')
    expect(result.artifact.stagedChangesIncluded).toBe(false)
    expect(result.artifact.unstagedTrackedChangesIncluded).toBe(false)
    expect(result.artifact.untrackedFilesIncluded).toBe(true)
    expect(result.artifact.patchContentsInspected).toBe(false)
    expect(result.artifact.changedFiles).toEqual([
      expect.objectContaining({
        path: 'src/untracked.ts',
        status: '??',
        statusCode: '??',
      }),
    ])
    expect(result.artifact.normalizedChangedFiles).toEqual([
      expect.objectContaining({
        path: 'src/untracked.ts',
        status: '??',
        statusCode: '??',
        changeType: 'untracked',
      }),
    ])
  })

  it('reports untracked generated-looking files as warning-only churn', async () => {
    const workspace = createCommittedWorkspace('src/todos.ts', 'export const value = "baseline"\n')
    writeText(
      join(workspace, 'examples', 'valid', 'todo-app-devview-run', 'generated', 'candidate.json'),
      '{"preview":true}\n',
    )

    const result = await collectGitDerivedChangedFiles(workspace, {
      untracked: true,
      output: join('.tmp', 'changed-files-untracked.json'),
    })

    expect(result.artifact.generatedFileHandling.generatedFilesPresent).toBe(true)
    expect(result.artifact.generatedFileHandling.generatedFiles).toEqual([
      'examples/valid/todo-app-devview-run/generated/candidate.json',
    ])
    expect(result.artifact.collectionWarnings).toContain(
      'Untracked generated-looking files were collected as advisory input only; this warning does not approve, reject, enforce, or satisfy Evidence.',
    )
    expect(result.artifact.scopeEnforced).toBe(false)
    expect(result.artifact.diffRejected).toBe(false)
    expect(result.artifact.cleanClaimed).toBe(false)
  })

  it('rejects base/head refs when working tree mode is selected', async () => {
    const workspace = createCommittedWorkspace('src/todos.ts', 'export const value = "baseline"\n')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'collect-changed-files',
        '--working-tree',
        '--base',
        'HEAD~1',
        '--head',
        'HEAD',
        '--json',
      ],
      {
        cwd: workspace,
        pluginRoot,
      },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.InvalidArguments)
    expect(payload.message).toContain('cannot combine --working-tree with --base or --head')
  })

  it('rejects mixed local changed-file modes', async () => {
    const workspace = createCommittedWorkspace('src/todos.ts', 'export const value = "baseline"\n')

    const result = await runDevViewCli(
      ['graph', 'read-model', 'collect-changed-files', '--working-tree', '--staged', '--json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.InvalidArguments)
    expect(payload.message).toContain('requires exactly one changed-file source mode')
  })

  it('rejects explicit refs when staged or untracked local mode is selected', async () => {
    const workspace = createCommittedWorkspace('src/todos.ts', 'export const value = "baseline"\n')

    const stagedResult = await runDevViewCli(
      ['graph', 'read-model', 'collect-changed-files', '--staged', '--base', 'HEAD~1', '--head', 'HEAD', '--json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )
    const untrackedResult = await runDevViewCli(
      ['graph', 'read-model', 'collect-changed-files', '--untracked', '--base', 'HEAD~1', '--head', 'HEAD', '--json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )

    expect(stagedResult.exitCode).toBe(ExitCode.InvalidArguments)
    expect(JSON.parse(stagedResult.stderr).message).toContain('cannot combine --staged with --base or --head')
    expect(untrackedResult.exitCode).toBe(ExitCode.InvalidArguments)
    expect(JSON.parse(untrackedResult.stderr).message).toContain('cannot combine --untracked with --base or --head')
  })
})

function createCommittedWorkspace(filePath: string, contents: string): string {
  const workspace = createWorkspace()
  execFileSync('git', ['init'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'pbe@example.test'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'PBE Test'], { cwd: workspace, stdio: 'ignore' })
  writeText(join(workspace, filePath), contents)
  execFileSync('git', ['add', '.'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'baseline'], { cwd: workspace, stdio: 'ignore' })
  return workspace
}
