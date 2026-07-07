import { cpSync, existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Project Memory impact report CLI', () => {
  it('reports direction-change impact without approving or applying a Project Memory revision', async () => {
    const workspace = createWorkspace()
    copyWindowsUtilityFixture(workspace)
    const output = join('.tmp', 'windowsutility-impact.json')
    const markdown = join('.tmp', 'windowsutility-impact.md')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-project-memory-impact',
        '--project-memory',
        'examples/internal-legacy/retrofit/windowsutility/devview-project-memory.preview.json',
        '--direction-change',
        'examples/internal-legacy/retrofit/windowsutility/project-direction-change.behavior-preserving-refactor.preview.json',
        '--output',
        output,
        '--markdown',
        markdown,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)
    const report = JSON.parse(readFileSync(join(workspace, output), 'utf8'))
    const markdownText = readFileSync(join(workspace, markdown), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(report.artifactRole).toBe('devview-project-memory-impact-report')
    expect(report.directionChange.currentDirection).toBe('legacy-preserving-retrofit')
    expect(report.directionChange.proposedDirection).toBe('behavior-preserving-refactor')
    expect(report.taxonomyExtensionDeltaProposalRequired).toBe(true)
    expect(report.viewTreeProfileDeltaProposalRequired).toBe(true)
    expect(report.humanReviewRequired).toBe(true)
    expect(report.approvedProjectMemoryRevisionImplemented).toBe(false)
    expect(report.approvedRevisionApplyImplemented).toBe(false)
    expect(report.graphSourceMutated).toBe(false)
    expect(report.graphDeltaApplied).toBe(false)
    expect(report.traversalPlannerBehaviorChanged).toBe(false)
    expect(report.contractInputGenerated).toBe(false)
    expect(report.runtimeEvidenceSatisfied).toBe(false)
    expect(report.equivalenceProven).toBe(false)
    expect(report.scopeEnforced).toBe(false)
    expect(report.ciEnforcementEnabled).toBe(false)
    expect(markdownText).toContain('DevView Project Memory Impact Report')
    expect(markdownText).toContain('behavior-preserving-refactor')
  })

  it('blocks unsafe output before writing partial reports', async () => {
    const workspace = createWorkspace()
    copyWindowsUtilityFixture(workspace)
    const projectMemoryPath = join(
      workspace,
      'examples/internal-legacy/retrofit/windowsutility/devview-project-memory.preview.json',
    )
    const before = readFileSync(projectMemoryPath, 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-project-memory-impact',
        '--project-memory',
        'examples/internal-legacy/retrofit/windowsutility/devview-project-memory.preview.json',
        '--direction-change',
        'examples/internal-legacy/retrofit/windowsutility/project-direction-change.behavior-preserving-refactor.preview.json',
        '--output',
        'examples/internal-legacy/retrofit/windowsutility/devview-project-memory.preview.json',
        '--markdown',
        '.tmp/should-not-exist.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source DevView Project Memory preview')
    expect(readFileSync(projectMemoryPath, 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/should-not-exist.md'))).toBe(false)
  })
})

function copyWindowsUtilityFixture(workspace: string): void {
  cpSync(
    join(pluginRoot, 'examples/internal-legacy/retrofit/windowsutility'),
    join(workspace, 'examples/internal-legacy/retrofit/windowsutility'),
    {
      recursive: true,
    },
  )
}
