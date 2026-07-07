import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('graph retrofit CLI', () => {
  it('summarizes a synthetic retrofit graph-source without touching a target project', async () => {
    const workspace = createWorkspace()
    writeSyntheticRetrofitFixture(workspace)

    const result = await runDevViewCli(
      ['graph', 'retrofit', 'plan', '--graph-source', 'fixtures/retrofit/graph-source.json', '--json'],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.status).toBe('retrofit-plan-pass')
    expect(payload.target.projectName).toBe('Synthetic Retrofit Fixture')
    expect(payload.counts.records).toBe(2)
    expect(payload.counts.forbiddenBoundaries).toBe(1)
    expect(payload.edgeIntentSummary.missingClaimCount).toBe(0)
    expect(payload.implementationReadyRecords.map((entry: { id: string }) => entry.id)).toEqual(
      expect.arrayContaining(['change.synthetic-active']),
    )
    expect(payload.retainedReferenceRecords).toEqual([])
    expect(payload.boundaries.mutatesTargetRepo).toBe(false)
    expect(payload.boundaries.appliesPatch).toBe(false)
  })

  it('generates a read-only instruction pack from a synthetic retrofit record', async () => {
    const workspace = createWorkspace()
    writeSyntheticRetrofitFixture(workspace)

    const result = await runDevViewCli(
      [
        'graph',
        'operation',
        'generate-pack',
        '--graph-source',
        'fixtures/retrofit/graph-source.json',
        '--record',
        'change.synthetic-active',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.status).toBe('generated-from-graph-source')
    expect(payload.artifactRole).toBe('retrofit-instruction-pack-v0')
    expect(payload.sourceRecordId).toBe('change.synthetic-active')
    expect(payload.target.projectName).toBe('Synthetic Retrofit Fixture')
    expect(payload.allowedScope.files).toEqual(['src/synthetic-view.ts'])
    expect(payload.forbiddenScope.flows.map((entry: { flow?: string }) => entry.flow)).toContain(
      'unrelated configuration rewrite',
    )
    expect(payload.executionBoundary.mayModifyExternalProject).toBe(false)
    expect(payload.graphContext.edgeIntents.map((entry: { id: string }) => entry.id)).toContain(
      'edge.synthetic-active-guards-boundary',
    )
  })

  it('rejects non-retrofit graph-source artifacts', async () => {
    const workspace = createWorkspace()
    writeJson(resolve(workspace, 'graph-source.json'), {
      artifactRole: 'native-graph-source-v0',
      status: 'active-retrofit-graph-source',
      records: [],
      nodes: [],
      edges: [],
    })

    const result = await runDevViewCli(['graph', 'retrofit', 'plan', '--graph-source', 'graph-source.json', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('retrofit-graph-source-v0')
  })
})

function writeSyntheticRetrofitFixture(workspace: string): void {
  writeJson(resolve(workspace, 'fixtures/retrofit/records/active.json'), {
    status: 'planned-not-implemented',
    target: { projectName: 'Synthetic Retrofit Fixture' },
    userConfirmedIntent: {
      summary: 'Adjust the synthetic view layout.',
      includedBehavior: ['update the synthetic view only'],
      excludedBehavior: ['unrelated configuration rewrite'],
    },
    implementationPlan: {
      expectedFiles: ['src/synthetic-view.ts'],
      expectedFlow: 'layout-only change',
      nonGoals: ['configuration rewrite'],
    },
    forbiddenFlows: [{ flow: 'unrelated configuration rewrite', reason: 'outside selected scope' }],
    evidence: {
      build: { status: 'not-run' },
      runtime: { status: 'not-run' },
      hardware: { status: 'not-required' },
    },
    finalState: {
      status: 'implemented-build-pass-runtime-pass',
      activeCodeState: 'active-local-behavior-change',
    },
  })
  writeJson(resolve(workspace, 'fixtures/retrofit/records/reference.json'), {
    status: 'implemented-then-retained-reference',
    target: { projectName: 'Synthetic Retrofit Fixture' },
    userConfirmedIntent: { summary: 'Retained reference record.' },
    implementationPlan: { expectedFiles: ['src/reference.ts'] },
    evidence: { build: { status: 'pass' }, runtime: { status: 'pass' }, hardware: { status: 'not-required' } },
    finalState: {
      status: 'implemented-then-retained-reference',
      activeCodeState: 'retained-reference-only',
    },
  })
  writeJson(resolve(workspace, 'fixtures/retrofit/graph-source.json'), {
    schemaVersion: 1,
    artifactRole: 'retrofit-graph-source-v0',
    status: 'active-retrofit-graph-source',
    target: { projectName: 'Synthetic Retrofit Fixture' },
    records: [
      {
        id: 'change.synthetic-reference',
        path: 'fixtures/retrofit/records/reference.json',
        expectedStatus: 'implemented-then-retained-reference',
        expectedActiveCodeState: 'retained-reference-only',
      },
      {
        id: 'change.synthetic-active',
        path: 'fixtures/retrofit/records/active.json',
        expectedStatus: 'planned-not-implemented',
        expectedActiveCodeState: 'active-local-behavior-change',
      },
    ],
    nodes: [
      { id: 'module.synthetic-view', kind: 'module', state: 'observed', intentClaim: 'Synthetic view module.' },
      {
        id: 'boundary.synthetic-config',
        kind: 'forbidden-flow-boundary',
        state: 'user-confirmed',
        intentClaim: 'Configuration rewrites are outside selected scope.',
      },
      {
        id: 'change.synthetic-active',
        kind: 'retrofit-change-record',
        state: 'planned-not-implemented',
        intentClaim: 'Synthetic active change.',
      },
      {
        id: 'change.synthetic-reference',
        kind: 'retrofit-change-record',
        state: 'implemented-then-retained-reference',
        intentClaim: 'Synthetic reference change.',
      },
    ],
    edges: [
      {
        id: 'edge.synthetic-view-drives-active',
        from: 'module.synthetic-view',
        to: 'change.synthetic-active',
        kind: 'change-driver',
        edgeIntent: {
          classifications: ['behavior-change'],
          claim: 'The synthetic view drives the active change.',
          confidence: 'observed-high',
        },
      },
      {
        id: 'edge.synthetic-active-guards-boundary',
        from: 'change.synthetic-active',
        to: 'boundary.synthetic-config',
        kind: 'forbidden-flow-guard',
        edgeIntent: {
          classifications: ['non-goal'],
          claim: 'The active change must not rewrite configuration.',
          confidence: 'user-confirmed',
        },
      },
    ],
  })
}
