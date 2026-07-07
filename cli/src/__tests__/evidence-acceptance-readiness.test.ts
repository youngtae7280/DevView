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

describe('Evidence Acceptance readiness CLI', () => {
  it('writes blocked evidence acceptance readiness for blocked mutation readiness without acceptance', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'mutation-readiness.json'), validMutationReadiness({ ready: false }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-evidence-acceptance-readiness',
        '--policy',
        'policy.json',
        '--mutation-readiness',
        'mutation-readiness.json',
        '--output',
        '.tmp/evidence-acceptance-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/evidence-acceptance-readiness.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-evidence-acceptance-readiness-blocked')
    expect(payload.evidenceAcceptanceReadinessStatus).toBe('blocked-mutation-readiness-not-ready')
    expect(payload.acceptanceAllowed).toBe(false)
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(written.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'EVIDENCE_ACCEPTANCE_MUTATION_READINESS_NOT_READY',
    )
  })

  it('reports ready acceptance context for ready mutation readiness without accepting evidence', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'mutation-readiness.json'), validMutationReadiness({ ready: true }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-evidence-acceptance-readiness',
        '--policy',
        'policy.json',
        '--mutation-readiness',
        'mutation-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-evidence-acceptance-readiness-ready')
    expect(payload.evidenceAcceptanceReadinessStatus).toBe('dry-run-ready-mutation-readiness-present')
    expect(payload.acceptanceAllowed).toBe(false)
    expect(payload.evidenceAcceptanceCommandImplemented).toBe(false)
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
  })

  it('fails unsafe mutation readiness flags before writing output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'mutation-readiness.json'), {
      ...validMutationReadiness({ ready: true }),
      evidenceAccepted: true,
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-evidence-acceptance-readiness',
        '--policy',
        'policy.json',
        '--mutation-readiness',
        'mutation-readiness.json',
        '--output',
        '.tmp/evidence-acceptance-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('evidenceAccepted')
    expect(existsSync(join(workspace, '.tmp/evidence-acceptance-readiness.json'))).toBe(false)
  })

  it('fails unsafe policy boundary fields', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), { ...validPolicy(), runtimeEvidenceSatisfied: true })
    writeJson(join(workspace, 'mutation-readiness.json'), validMutationReadiness({ ready: true }))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-evidence-acceptance-readiness',
        '--policy',
        'policy.json',
        '--mutation-readiness',
        'mutation-readiness.json',
        '--output',
        '.tmp/evidence-acceptance-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('runtimeEvidenceSatisfied')
    expect(existsSync(join(workspace, '.tmp/evidence-acceptance-readiness.json'))).toBe(false)
  })

  it('blocks unsafe markdown before JSON output is written', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'mutation-readiness.json'), validMutationReadiness({ ready: true }))
    const sourceBefore = readFileSync(join(workspace, 'mutation-readiness.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-evidence-acceptance-readiness',
        '--policy',
        'policy.json',
        '--mutation-readiness',
        'mutation-readiness.json',
        '--output',
        '.tmp/evidence-acceptance-readiness.json',
        '--markdown',
        'mutation-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('would overwrite the source Graph-source Mutation readiness')
    expect(readFileSync(join(workspace, 'mutation-readiness.json'), 'utf8')).toBe(sourceBefore)
    expect(existsSync(join(workspace, '.tmp/evidence-acceptance-readiness.json'))).toBe(false)
  })
})

function validPolicy(): Record<string, unknown> {
  return {
    artifactRole: 'devview-evidence-acceptance-policy-boundary-preview',
    status: 'devview-evidence-acceptance-policy-boundary-previewed',
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function validMutationReadiness(input: { ready: boolean }): Record<string, unknown> {
  return {
    artifactRole: 'devview-graph-source-mutation-readiness-preview',
    status: input.ready
      ? 'devview-graph-source-mutation-readiness-ready'
      : 'devview-graph-source-mutation-readiness-blocked',
    sourceApplyReadiness: 'apply-readiness.json',
    sourceApprovedProposalState: 'approved-state.json',
    sourceGraphDeltaProposal: 'proposal.json',
    proposalId: 'GDP-TEST',
    mutationReadinessStatus: input.ready
      ? 'dry-run-ready-apply-readiness-present'
      : 'blocked-apply-readiness-not-ready',
    applyReadinessStatus: input.ready ? 'dry-run-ready-approved-state-present' : 'blocked-approved-state-not-created',
    mutationAllowed: false,
    graphSourceMutationAllowed: false,
    graphSourceMutated: false,
    graphDeltaApplyEnabled: false,
    graphDeltaApplied: false,
    approvedProposalStateCreated: input.ready,
    humanDecisionRecorded: true,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}
