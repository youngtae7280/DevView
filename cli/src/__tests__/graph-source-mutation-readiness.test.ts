import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Graph-source Mutation readiness CLI', () => {
  it('writes blocked mutation readiness for blocked apply readiness without mutation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'apply-readiness.json'), validApplyReadiness({ ready: false }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-graph-source-mutation-readiness',
        '--policy',
        'policy.json',
        '--apply-readiness',
        'apply-readiness.json',
        '--output',
        '.tmp/mutation-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/mutation-readiness.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-graph-source-mutation-readiness-blocked')
    expect(payload.mutationReadinessStatus).toBe('blocked-apply-readiness-not-ready')
    expect(payload.mutationAllowed).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(written.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'GRAPH_SOURCE_MUTATION_APPLY_READINESS_NOT_READY',
    )
  })

  it('reports ready mutation context for ready apply readiness without mutation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'apply-readiness.json'), validApplyReadiness({ ready: true }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-graph-source-mutation-readiness',
        '--policy',
        'policy.json',
        '--apply-readiness',
        'apply-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-graph-source-mutation-readiness-ready')
    expect(payload.mutationReadinessStatus).toBe('dry-run-ready-apply-readiness-present')
    expect(payload.mutationAllowed).toBe(false)
    expect(payload.graphSourceMutationAllowed).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
  })

  it('fails unsafe apply readiness flags before writing output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'apply-readiness.json'), {
      ...validApplyReadiness({ ready: true }),
      graphSourceMutated: true,
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-graph-source-mutation-readiness',
        '--policy',
        'policy.json',
        '--apply-readiness',
        'apply-readiness.json',
        '--output',
        '.tmp/mutation-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('graphSourceMutated')
    expect(existsSync(join(workspace, '.tmp/mutation-readiness.json'))).toBe(false)
  })

  it('fails unsafe policy boundary fields', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), { ...validPolicy(), graphDeltaApplied: true })
    writeJson(join(workspace, 'apply-readiness.json'), validApplyReadiness({ ready: true }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-graph-source-mutation-readiness',
        '--policy',
        'policy.json',
        '--apply-readiness',
        'apply-readiness.json',
        '--output',
        '.tmp/mutation-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('graphDeltaApplied')
    expect(existsSync(join(workspace, '.tmp/mutation-readiness.json'))).toBe(false)
  })

  it('blocks unsafe markdown before JSON output is written', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'apply-readiness.json'), validApplyReadiness({ ready: true }))
    const sourceBefore = readFileSync(join(workspace, 'apply-readiness.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-graph-source-mutation-readiness',
        '--policy',
        'policy.json',
        '--apply-readiness',
        'apply-readiness.json',
        '--output',
        '.tmp/mutation-readiness.json',
        '--markdown',
        'apply-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('would overwrite the source Graph Delta Apply readiness')
    expect(readFileSync(join(workspace, 'apply-readiness.json'), 'utf8')).toBe(sourceBefore)
    expect(existsSync(join(workspace, '.tmp/mutation-readiness.json'))).toBe(false)
  })
})

function validPolicy(): Record<string, unknown> {
  return {
    artifactRole: 'devview-graph-source-mutation-policy-boundary-preview',
    status: 'devview-graph-source-mutation-policy-boundary-previewed',
    graphSourceMutationAllowed: false,
    graphSourceMutated: false,
    graphDeltaApplyEnabled: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function validApplyReadiness(input: { ready: boolean }): Record<string, unknown> {
  return {
    artifactRole: 'devview-graph-delta-apply-readiness-preview',
    status: input.ready ? 'devview-graph-delta-apply-readiness-ready' : 'devview-graph-delta-apply-readiness-blocked',
    sourceApprovedProposalState: 'approved-state.json',
    sourceGraphDeltaProposal: 'proposal.json',
    proposalId: 'GDP-TEST',
    applyReadinessStatus: input.ready ? 'dry-run-ready-approved-state-present' : 'blocked-approved-state-not-created',
    approvedProposalStateCreated: input.ready,
    humanDecisionRecorded: true,
    graphDeltaApplyEnabled: false,
    graphDeltaApplied: false,
    graphSourceMutationAllowed: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}
