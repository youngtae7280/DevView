import { describe, expect, it } from 'vitest'
import {
  buildGitDerivedChangedFileCollectionArtifact,
  normalizeRepositoryRelativePath,
  parseNameStatusZ,
  validateExplicitGitRef,
} from '../core/git-derived-changed-file-collection'

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
    expect(normalizeRepositoryRelativePath('examples\\valid\\todo-app-pbe-run\\generated\\result.json')).toEqual({
      path: 'examples/valid/todo-app-pbe-run/generated/result.json',
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
        'examples/valid/todo-app-pbe-run/generated/result.json',
      ].join('\0'),
    })

    expect(artifact.collectionStatus).toBe('git-derived-changed-files-collected')
    expect(artifact.authorityClass).toBe('git-derived-changed-files')
    expect(artifact.collectionMode).toBe('explicit-base-head')
    expect(artifact.changedFilesCollected).toBe(true)
    expect(artifact.checkerRun).toBe(false)
    expect(artifact.scopeComplianceEvaluationStatus).toBe('not-evaluated')
    expect(artifact.evaluatedViolations).toEqual([])
    expect(artifact.actualDiffInspected).toBe(false)
    expect(artifact.patchContentsInspected).toBe(false)
    expect(artifact.normalizedChangedFiles.map((entry) => entry.path)).toEqual([
      'docs/concept/scope-compliance-checker-implementation-readiness.md',
      'examples/valid/todo-app-pbe-run/generated/result.json',
    ])
    expect(artifact.generatedFileHandling.generatedFilesPresent).toBe(true)
    expect(artifact.generatedFileHandling.generatedFiles).toEqual([
      'examples/valid/todo-app-pbe-run/generated/result.json',
    ])
    expect(artifact.forbiddenUse).toContain('scope compliance evaluation')
    expect(artifact.forbiddenUse).toContain('no-violation claim')
  })
})
