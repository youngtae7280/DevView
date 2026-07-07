import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())
const projectMemoryPath = 'fixtures/project-memory/devview-project-memory.preview.json'
const directionChangePath = 'fixtures/project-memory/project-direction-change.preview.json'

afterEach(() => {
  cleanupWorkspaces()
})

describe('Project Memory impact report CLI', () => {
  it('reports direction-change impact without approving or applying a Project Memory revision', async () => {
    const workspace = createWorkspace()
    writeSyntheticImpactFixture(workspace)
    const output = join('.tmp', 'synthetic-impact.json')
    const markdown = join('.tmp', 'synthetic-impact.md')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-project-memory-impact',
        '--project-memory',
        projectMemoryPath,
        '--direction-change',
        directionChangePath,
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
    expect(report.directionChange.currentDirection).toBe('synthetic-retrofit')
    expect(report.directionChange.proposedDirection).toBe('synthetic-modularization')
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
    expect(markdownText).toContain('synthetic-modularization')
  })

  it('blocks unsafe output before writing partial reports', async () => {
    const workspace = createWorkspace()
    writeSyntheticImpactFixture(workspace)
    const before = readFileSync(join(workspace, projectMemoryPath), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-project-memory-impact',
        '--project-memory',
        projectMemoryPath,
        '--direction-change',
        directionChangePath,
        '--output',
        projectMemoryPath,
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
    expect(readFileSync(join(workspace, projectMemoryPath), 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/should-not-exist.md'))).toBe(false)
  })
})

function writeSyntheticImpactFixture(workspace: string): void {
  writeJson(join(workspace, projectMemoryPath), {
    artifactRole: 'devview-project-memory-preview',
    status: 'devview-project-memory-preview-generated',
    projectMemoryId: 'synthetic-project-memory',
    projectIdentity: {
      projectId: 'synthetic-project',
      projectName: 'Synthetic Project',
    },
    devviewMode: 'retrofit',
    projectDirection: {
      current: 'synthetic-retrofit',
    },
    taxonomyProfileRef: {
      taxonomyProfileId: 'synthetic-taxonomy-v0',
    },
    viewTreeProfileRef: {
      viewTreeProfileId: 'synthetic-view-tree-v0',
    },
  })
  writeJson(join(workspace, directionChangePath), {
    artifactRole: 'devview-project-direction-change-candidate-preview',
    status: 'devview-project-direction-change-candidate-preview-generated',
    candidateId: 'synthetic-direction-change',
    currentDirection: 'synthetic-retrofit',
    proposedDirection: 'synthetic-modularization',
    reason: 'Demonstrate direction-change impact without project-specific fixtures.',
    candidateAuthorityStatus: 'preview-only',
    expectedPreservationPolicyImpact: ['preserve current behavior'],
    expectedImprovementPolicyImpact: ['separate synthetic modules'],
    expectedSourceAuthorityImpact: ['requires human review'],
    expectedTaxonomyImpact: ['new synthetic extension kinds may be needed'],
    expectedViewTreeImpact: ['new synthetic view tree profile may be needed'],
  })
}
