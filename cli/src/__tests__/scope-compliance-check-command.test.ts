import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson, writeText } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())
const draftPath = join(
  'examples',
  'valid',
  'todo-app-devview-run',
  'generated',
  'compiler-input-model-calibration-draft.runtime-evidence-only.json',
)
const defaultEvaluationPath = join(
  'examples',
  'valid',
  'todo-app-devview-run',
  'generated',
  'scope-compliance-evaluation.runtime-evidence-only.preview.json',
)

afterEach(() => {
  cleanupWorkspaces()
})

describe('scope compliance advisory CLI', () => {
  it('prints advisory scope findings without enforcing or rejecting diffs', async () => {
    const workspace = createScopeWorkspace({
      allowedScopePatterns: ['src/**'],
      forbiddenScopePatterns: ['src/todos.ts'],
      changedPath: 'src/todos.ts',
    })

    const result = await runDevViewCli(
      ['graph', 'read-model', 'check-scope', '--base', 'HEAD~1', '--head', 'HEAD', '--json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('graph read-model check-scope')
    expect(payload.checkerRun).toBe(true)
    expect(payload.nonEnforcing).toBe(true)
    expect(payload.enforcementStatus).toBe('not-enforced')
    expect(payload.diffRejected).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.cleanClaimed).toBe(false)
    expect(payload.actualViolationClaimed).toBe(false)
    expect(payload.approvalStatus).toBe('not-approved')
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeComplianceResult).toBe('evaluated-with-blocking-violations')
    expect(payload.evaluatedViolations).toEqual([
      expect.objectContaining({
        category: 'forbidden-scope-match',
        path: 'src/todos.ts',
        pattern: 'src/todos.ts',
      }),
    ])
    expect(payload.next).toContain('Review advisory findings only')
    expect(existsSync(join(workspace, defaultEvaluationPath))).toBe(false)
  })

  it('reports command errors without converting advisory findings into enforcement', async () => {
    const workspace = createScopeWorkspace({
      allowedScopePatterns: ['src/**'],
      forbiddenScopePatterns: ['src/todos.ts'],
      changedPath: 'src/todos.ts',
    })

    const result = await runDevViewCli(
      ['graph', 'read-model', 'check-scope', '--base', 'missing-ref', '--head', 'HEAD', '--json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.command).toBe('graph read-model check-scope')
    expect(payload.issues).toEqual([
      expect.objectContaining({
        code: 'SCOPE_COMPLIANCE_ADVISORY_CHECK_BLOCKED',
        severity: 'error',
      }),
    ])
  })

  it('writes a compact advisory markdown report without enforcing findings', async () => {
    const workspace = createScopeWorkspace({
      allowedScopePatterns: ['src/**'],
      forbiddenScopePatterns: ['src/todos.ts'],
      changedPath: 'src/todos.ts',
    })
    const markdownPath = join('.tmp', 'scope-compliance-runtime-report.md')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'check-scope',
        '--base',
        'HEAD~1',
        '--head',
        'HEAD',
        '--markdown',
        markdownPath,
        '--json',
      ],
      {
        cwd: workspace,
        pluginRoot,
      },
    )
    const payload = JSON.parse(result.stdout)
    const markdown = readFileSync(join(workspace, markdownPath), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.markdownReport).toBe(markdownPath.replaceAll('\\', '/'))
    expect(payload.compactRuntimeReport).toEqual(
      expect.objectContaining({
        reportStatus: 'compact-advisory-runtime-report-ready',
        changedFileCount: 1,
        evaluatedFileCount: 1,
        nonEnforcing: true,
        enforcementStatus: 'not-enforced',
        blockingFindingCount: 1,
        runtimeBudgetStatus: 'advisory-not-enforced',
        reportIsBlocking: false,
        diffRejected: false,
        scopeEnforced: false,
        approvalStatus: 'not-approved',
        equivalenceProven: false,
        runtimeEvidenceSatisfied: false,
        graphDeltaApplied: false,
      }),
    )
    expect(markdown).toContain('# Scope Compliance Advisory Runtime Report')
    expect(markdown).toContain('| Non-enforcing | `true` |')
    expect(markdown).toContain('| Enforcement status | `not-enforced` |')
    expect(markdown).toContain('does not reject diffs')
    expect(markdown).not.toContain('equivalence proven')
    expect(markdown).not.toContain('approved')
    expect(existsSync(join(workspace, defaultEvaluationPath))).toBe(false)
  })

  it('evaluates tracked unstaged working tree changes without enforcing scope', async () => {
    const workspace = createWorkingTreeScopeWorkspace({
      allowedScopePatterns: ['src/**'],
      forbiddenScopePatterns: ['src/todos.ts'],
      changedPath: 'src/todos.ts',
      changedContents: 'export const value = "working-tree"\n',
    })

    const result = await runDevViewCli(['graph', 'read-model', 'check-scope', '--working-tree', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.sourceMode).toBe('working-tree')
    expect(payload.collectionMode).toBe('working-tree-tracked-unstaged')
    expect(payload.workingTreeMode).toBe('tracked-unstaged-only')
    expect(payload.changedFileInputArtifact).toBe('in-memory-working-tree-changed-file-collection')
    expect(payload.stagedChangesIncluded).toBe(false)
    expect(payload.untrackedFilesIncluded).toBe(false)
    expect(payload.changedFileNameStatusCollected).toBe(true)
    expect(payload.changedFileCount).toBe(1)
    expect(payload.nonEnforcing).toBe(true)
    expect(payload.enforcementStatus).toBe('not-enforced')
    expect(payload.diffRejected).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.approvalStatus).toBe('not-approved')
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeComplianceResult).toBe('evaluated-with-blocking-violations')
    expect(payload.evaluatedViolations).toEqual([
      expect.objectContaining({
        category: 'forbidden-scope-match',
        path: 'src/todos.ts',
      }),
    ])
  })

  it('evaluates staged index changes without enforcing scope', async () => {
    const workspace = createWorkingTreeScopeWorkspace({
      allowedScopePatterns: ['src/**'],
      forbiddenScopePatterns: ['src/todos.ts'],
      changedPath: 'src/todos.ts',
      changedContents: 'export const value = "staged"\n',
    })
    execFileSync('git', ['add', 'src/todos.ts'], { cwd: workspace, stdio: 'ignore' })

    const result = await runDevViewCli(['graph', 'read-model', 'check-scope', '--staged', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.sourceMode).toBe('staged-index')
    expect(payload.collectionMode).toBe('staged-index')
    expect(payload.stagedMode).toBe('staged-index-only')
    expect(payload.changedFileInputArtifact).toBe('in-memory-staged-index-changed-file-collection')
    expect(payload.stagedChangesIncluded).toBe(true)
    expect(payload.unstagedTrackedChangesIncluded).toBe(false)
    expect(payload.untrackedFilesIncluded).toBe(false)
    expect(payload.changedFileCount).toBe(1)
    expect(payload.nonEnforcing).toBe(true)
    expect(payload.enforcementStatus).toBe('not-enforced')
    expect(payload.diffRejected).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.approvalStatus).toBe('not-approved')
    expect(payload.compactRuntimeReport.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.compactRuntimeReport.graphDeltaApplied).toBe(false)
    expect(payload.evaluatedViolations).toEqual([
      expect.objectContaining({
        category: 'forbidden-scope-match',
        path: 'src/todos.ts',
      }),
    ])
  })

  it('evaluates untracked file paths without enforcing scope', async () => {
    const workspace = createWorkingTreeScopeWorkspace({
      allowedScopePatterns: ['src/**'],
      forbiddenScopePatterns: ['src/new.ts'],
      changedPath: 'src/todos.ts',
    })
    writeText(join(workspace, 'src', 'new.ts'), 'export const value = "untracked"\n')

    const result = await runDevViewCli(['graph', 'read-model', 'check-scope', '--untracked', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.sourceMode).toBe('untracked-files')
    expect(payload.collectionMode).toBe('untracked-files')
    expect(payload.untrackedMode).toBe('ls-files-others-exclude-standard')
    expect(payload.changedFileInputArtifact).toBe('in-memory-untracked-file-collection')
    expect(payload.stagedChangesIncluded).toBe(false)
    expect(payload.unstagedTrackedChangesIncluded).toBe(false)
    expect(payload.untrackedFilesIncluded).toBe(true)
    expect(payload.changedFileCount).toBe(1)
    expect(payload.nonEnforcing).toBe(true)
    expect(payload.enforcementStatus).toBe('not-enforced')
    expect(payload.diffRejected).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.approvalStatus).toBe('not-approved')
    expect(payload.compactRuntimeReport.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.compactRuntimeReport.graphDeltaApplied).toBe(false)
    expect(payload.evaluatedViolations).toEqual([
      expect.objectContaining({
        category: 'forbidden-scope-match',
        path: 'src/new.ts',
      }),
    ])
  })

  it('reports a clean working tree without approval or evidence satisfaction', async () => {
    const workspace = createWorkingTreeScopeWorkspace({
      allowedScopePatterns: ['src/**'],
      forbiddenScopePatterns: ['src/todos.ts'],
      changedPath: 'src/todos.ts',
    })

    const result = await runDevViewCli(['graph', 'read-model', 'check-scope', '--working-tree', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.sourceMode).toBe('working-tree')
    expect(payload.collectionMode).toBe('working-tree-tracked-unstaged')
    expect(payload.changedFileCount).toBe(0)
    expect(payload.scopeComplianceResult).toBe('evaluated-clean')
    expect(payload.cleanClaimed).toBe(false)
    expect(payload.approvalStatus).toBe('not-approved')
    expect(payload.compactRuntimeReport.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.compactRuntimeReport.graphDeltaApplied).toBe(false)
  })

  it('reports clean staged and untracked modes without approval or evidence satisfaction', async () => {
    const workspace = createWorkingTreeScopeWorkspace({
      allowedScopePatterns: ['src/**'],
      forbiddenScopePatterns: ['src/todos.ts'],
      changedPath: 'src/todos.ts',
    })

    const stagedResult = await runDevViewCli(['graph', 'read-model', 'check-scope', '--staged', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const untrackedResult = await runDevViewCli(['graph', 'read-model', 'check-scope', '--untracked', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const stagedPayload = JSON.parse(stagedResult.stdout)
    const untrackedPayload = JSON.parse(untrackedResult.stdout)

    expect(stagedResult.exitCode).toBe(ExitCode.Success)
    expect(stagedPayload.collectionMode).toBe('staged-index')
    expect(stagedPayload.changedFileCount).toBe(0)
    expect(stagedPayload.scopeComplianceResult).toBe('evaluated-clean')
    expect(stagedPayload.approvalStatus).toBe('not-approved')
    expect(stagedPayload.compactRuntimeReport.runtimeEvidenceSatisfied).toBe(false)
    expect(untrackedResult.exitCode).toBe(ExitCode.Success)
    expect(untrackedPayload.collectionMode).toBe('untracked-files')
    expect(untrackedPayload.changedFileCount).toBe(0)
    expect(untrackedPayload.scopeComplianceResult).toBe('evaluated-clean')
    expect(untrackedPayload.approvalStatus).toBe('not-approved')
    expect(untrackedPayload.compactRuntimeReport.runtimeEvidenceSatisfied).toBe(false)
  })

  it('rejects explicit refs with working tree scope mode', async () => {
    const workspace = createWorkingTreeScopeWorkspace({
      allowedScopePatterns: ['src/**'],
      forbiddenScopePatterns: ['src/todos.ts'],
      changedPath: 'src/todos.ts',
    })

    const result = await runDevViewCli(
      ['graph', 'read-model', 'check-scope', '--working-tree', '--base', 'HEAD~1', '--head', 'HEAD', '--json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.InvalidArguments)
    expect(payload.message).toContain('cannot combine --working-tree with --base or --head')
  })

  it('rejects mixed local scope modes before collection', async () => {
    const workspace = createWorkingTreeScopeWorkspace({
      allowedScopePatterns: ['src/**'],
      forbiddenScopePatterns: ['src/todos.ts'],
      changedPath: 'src/todos.ts',
    })

    const result = await runDevViewCli(
      ['graph', 'read-model', 'check-scope', '--working-tree', '--untracked', '--json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.InvalidArguments)
    expect(payload.message).toContain('requires exactly one changed-file source mode')
  })
})

function createScopeWorkspace(input: {
  allowedScopePatterns: string[]
  forbiddenScopePatterns: string[]
  changedPath: string
}): string {
  const workspace = createWorkspace()
  writeJson(join(workspace, draftPath), {
    targetScopeCandidates: [
      {
        id: 'scope-test-allowed',
        paths: input.allowedScopePatterns,
      },
    ],
    policySnapshot: {
      forbiddenScopeRules: [
        {
          id: 'scope-test-forbidden',
          paths: input.forbiddenScopePatterns,
        },
      ],
    },
  })
  writeText(join(workspace, input.changedPath), 'export const value = "baseline"\n')
  execFileSync('git', ['init'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'pbe@example.test'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'PBE Test'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['add', '.'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'baseline'], { cwd: workspace, stdio: 'ignore' })
  writeText(join(workspace, input.changedPath), 'export const value = "changed"\n')
  execFileSync('git', ['add', '.'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'changed'], { cwd: workspace, stdio: 'ignore' })
  return workspace
}

function createWorkingTreeScopeWorkspace(input: {
  allowedScopePatterns: string[]
  forbiddenScopePatterns: string[]
  changedPath: string
  changedContents?: string
}): string {
  const workspace = createWorkspace()
  writeJson(join(workspace, draftPath), {
    targetScopeCandidates: [
      {
        id: 'scope-test-allowed',
        paths: input.allowedScopePatterns,
      },
    ],
    policySnapshot: {
      forbiddenScopeRules: [
        {
          id: 'scope-test-forbidden',
          paths: input.forbiddenScopePatterns,
        },
      ],
    },
  })
  writeText(join(workspace, input.changedPath), 'export const value = "baseline"\n')
  execFileSync('git', ['init'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'pbe@example.test'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'PBE Test'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['add', '.'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'baseline'], { cwd: workspace, stdio: 'ignore' })
  if (input.changedContents) {
    writeText(join(workspace, input.changedPath), input.changedContents)
  }
  return workspace
}
