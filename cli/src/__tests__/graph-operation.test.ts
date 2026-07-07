import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson, writeText } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('graph operation CLI', () => {
  it('generates an instruction pack from a synthetic retrofit graph-source record', async () => {
    const workspace = createWorkspace()
    const outputPath = join(workspace, 'pack.json')
    writeSyntheticOperationFixture(workspace)

    const result = await runDevViewCli(
      [
        'graph',
        'operation',
        'generate-pack',
        '--graph-source',
        'graph-source.json',
        '--record',
        'change.synthetic',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.status).toBe('generated-from-graph-source')
    expect(payload.artifactRole).toBe('retrofit-instruction-pack-v0')
    expect(payload.sourceRecordId).toBe('change.synthetic')
    expect(payload.allowedScope.files).toEqual(['index.js'])
    expect(payload.executionBoundary.mayModifyExternalProject).toBe(false)
    expect(JSON.parse(readFileSync(outputPath, 'utf8')).sourceRecordId).toBe('change.synthetic')
  })

  it('captures a graph delta and proposes graph-source updates from an allowed target diff', async () => {
    const workspace = createWorkspace()
    const targetRepo = join(workspace, 'target')
    writeText(join(targetRepo, 'index.js'), 'module.exports = 1\n')
    execFileSync('git', ['init'], { cwd: targetRepo, stdio: 'ignore' })
    execFileSync('git', ['config', 'user.email', 'devview@example.test'], { cwd: targetRepo, stdio: 'ignore' })
    execFileSync('git', ['config', 'user.name', 'DevView Test'], { cwd: targetRepo, stdio: 'ignore' })
    execFileSync('git', ['add', '.'], { cwd: targetRepo, stdio: 'ignore' })
    execFileSync('git', ['commit', '-m', 'baseline'], { cwd: targetRepo, stdio: 'ignore' })
    writeText(join(targetRepo, 'index.js'), 'module.exports = 2\n')
    writeSyntheticOperationFixture(workspace)

    const pack = await runDevViewCli(
      [
        'graph',
        'operation',
        'generate-pack',
        '--graph-source',
        'graph-source.json',
        '--record',
        'change.synthetic',
        '--output',
        'pack.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    expect(pack.exitCode).toBe(ExitCode.Success)

    const delta = await runDevViewCli(
      [
        'graph',
        'operation',
        'capture-delta',
        '--graph-source',
        'graph-source.json',
        '--instruction-pack',
        'pack.json',
        '--target-repo',
        'target',
        '--output',
        'delta.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    expect(delta.exitCode).toBe(ExitCode.Success)
    const deltaPayload = JSON.parse(delta.stdout)
    expect(deltaPayload.status).toBe('generated-from-target-diff')
    expect(deltaPayload.changedFiles).toEqual([{ path: 'index.js', additions: '1', deletions: '1' }])
    expect(deltaPayload.boundaries.appliesPatch).toBe(false)

    const proposal = await runDevViewCli(
      ['graph', 'operation', 'propose-update', '--graph-delta', 'delta.json', '--output', 'proposal.json', '--json'],
      { cwd: workspace, pluginRoot },
    )
    expect(proposal.exitCode).toBe(ExitCode.Success)
    const proposalPayload = JSON.parse(proposal.stdout)
    expect(proposalPayload.status).toBe('generated-from-graph-delta')
    expect(proposalPayload.sourceRecordId).toBe('change.synthetic')
    expect(proposalPayload.boundaries.mutatesGraphSource).toBe(false)
    expect(JSON.parse(readFileSync(join(workspace, 'proposal.json'), 'utf8')).sourceRecordId).toBe('change.synthetic')
  })

  it('blocks graph delta capture when dirty files are outside the instruction pack', async () => {
    const workspace = createWorkspace()
    const targetRepo = join(workspace, 'target')
    writeText(join(targetRepo, 'package.json'), '{}\n')
    execFileSync('git', ['init'], { cwd: targetRepo, stdio: 'ignore' })
    execFileSync('git', ['config', 'user.email', 'devview@example.test'], { cwd: targetRepo, stdio: 'ignore' })
    execFileSync('git', ['config', 'user.name', 'DevView Test'], { cwd: targetRepo, stdio: 'ignore' })
    execFileSync('git', ['add', '.'], { cwd: targetRepo, stdio: 'ignore' })
    execFileSync('git', ['commit', '-m', 'baseline'], { cwd: targetRepo, stdio: 'ignore' })
    writeText(join(targetRepo, 'package.json'), '{"private":true}\n')

    writeJson(join(workspace, 'graph-source.json'), {
      artifactRole: 'retrofit-graph-source-v0',
      status: 'active-retrofit-graph-source',
      records: [],
      nodes: [],
      edges: [],
    })
    writeJson(join(workspace, 'pack.json'), {
      graphSourcePath: 'graph-source.json',
      sourceRecordId: 'change.synthetic',
      allowedScope: { files: ['index.js'] },
      graphContext: { edgeIntents: [] },
      verification: { finalState: {} },
    })

    const result = await runDevViewCli(
      [
        'graph',
        'operation',
        'capture-delta',
        '--graph-source',
        'graph-source.json',
        '--instruction-pack',
        'pack.json',
        '--target-repo',
        'target',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('outside instruction pack allowed files')
  })

  it('previews a committed graph update proposal without mutating graph-source', async () => {
    const workspace = createWorkspace()
    writeSyntheticProposalFixture(workspace)
    const before = readFileSync(join(workspace, 'graph-source.json'), 'utf8')

    const result = await runDevViewCli(
      ['graph', 'operation', 'apply-proposal', '--proposal', 'proposal.json', '--json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.status).toBe('graph-update-proposal-preview-pass')
    expect(payload.applied).toBe(false)
    expect(payload.boundaries.graphSourceWritten).toBe(false)
    expect(payload.changedFiles.map((entry: { path: string }) => entry.path)).toEqual(['index.js'])
    expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(before)
  })

  it('applies a proposal to graph-source only when --apply is present', async () => {
    const workspace = createWorkspace()
    writeSyntheticProposalFixture(workspace)

    const preview = await runDevViewCli(
      ['graph', 'operation', 'apply-proposal', '--proposal', 'proposal.json', '--json'],
      { cwd: workspace, pluginRoot },
    )
    expect(preview.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).nodes[0].state).toBe(
      'planned-not-implemented',
    )

    const applied = await runDevViewCli(
      ['graph', 'operation', 'apply-proposal', '--proposal', 'proposal.json', '--apply', '--json'],
      { cwd: workspace, pluginRoot },
    )

    expect(applied.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(applied.stdout)
    expect(payload.status).toBe('graph-update-proposal-apply-pass')
    expect(payload.changeCount).toBe(3)
    expect(payload.boundaries.graphSourceWritten).toBe(true)

    const graphSource = JSON.parse(readFileSync(join(workspace, 'graph-source.json'), 'utf8'))
    expect(graphSource.nodes[0].state).toBe('implemented-build-pass-runtime-pass')
    expect(graphSource.records[0].expectedStatus).toBe('implemented-build-pass-runtime-pass')
    expect(graphSource.records[0].expectedActiveCodeState).toBe('active-local-behavior-change')
  })

  it('blocks stale proposal application', async () => {
    const workspace = createWorkspace()
    writeSyntheticProposalFixture(workspace, { stale: true })

    const result = await runDevViewCli(
      ['graph', 'operation', 'apply-proposal', '--proposal', 'proposal.json', '--apply', '--json'],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('Stale proposal')
  })
})

function writeSyntheticOperationFixture(workspace: string): void {
  writeJson(join(workspace, 'records/change.synthetic.json'), {
    status: 'planned-not-implemented',
    target: { projectName: 'Synthetic Operation Fixture' },
    userConfirmedIntent: {
      summary: 'Change synthetic behavior.',
      includedBehavior: ['update index.js'],
      excludedBehavior: ['do not edit package metadata'],
    },
    implementationPlan: {
      expectedFiles: ['index.js'],
      expectedFlow: 'edit allowed file only',
      nonGoals: ['package metadata'],
    },
    forbiddenFlows: [{ flow: 'package metadata', reason: 'outside selected scope' }],
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
  writeJson(join(workspace, 'graph-source.json'), {
    artifactRole: 'retrofit-graph-source-v0',
    records: [
      {
        id: 'change.synthetic',
        path: 'records/change.synthetic.json',
        expectedStatus: 'planned-not-implemented',
        expectedActiveCodeState: 'active-local-behavior-change',
      },
    ],
    nodes: [
      { id: 'module.synthetic', kind: 'module', state: 'observed', intentClaim: 'Synthetic module.' },
      {
        id: 'boundary.synthetic',
        kind: 'forbidden-flow-boundary',
        state: 'user-confirmed',
        intentClaim: 'Do not edit package metadata.',
      },
      {
        id: 'change.synthetic',
        kind: 'retrofit-change-record',
        state: 'planned-not-implemented',
        intentClaim: 'Synthetic behavior change.',
      },
    ],
    edges: [
      {
        id: 'edge.synthetic-drives-change',
        from: 'module.synthetic',
        to: 'change.synthetic',
        kind: 'change-driver',
        edgeIntent: {
          classifications: ['behavior-change'],
          claim: 'Synthetic module drives the behavior change.',
          confidence: 'user-confirmed',
        },
      },
      {
        id: 'edge.synthetic-guards-boundary',
        from: 'change.synthetic',
        to: 'boundary.synthetic',
        kind: 'forbidden-flow-guard',
        edgeIntent: {
          classifications: ['non-goal'],
          claim: 'The change must not edit package metadata.',
          confidence: 'user-confirmed',
        },
      },
    ],
  })
}

function writeSyntheticProposalFixture(workspace: string, options: { stale?: boolean } = {}): void {
  writeJson(join(workspace, 'graph-source.json'), {
    schemaVersion: 1,
    artifactRole: 'retrofit-graph-source-v0',
    status: 'active-retrofit-graph-source',
    records: [
      {
        id: 'change.synthetic',
        path: 'records/change.synthetic.json',
        expectedStatus: 'planned-not-implemented',
        expectedActiveCodeState: 'not-applied',
      },
    ],
    nodes: [
      {
        id: 'change.synthetic',
        kind: 'retrofit-change-record',
        state: options.stale ? 'already-changed' : 'planned-not-implemented',
        intentClaim: 'Synthetic proposal node.',
      },
    ],
    edges: [],
  })
  writeJson(join(workspace, 'delta.json'), {
    schemaVersion: 1,
    artifactRole: 'retrofit-graph-delta-v0',
    status: 'generated-from-target-diff',
    graphSourcePath: 'graph-source.json',
    sourceRecordId: 'change.synthetic',
  })
  writeJson(join(workspace, 'proposal.json'), {
    schemaVersion: 1,
    artifactRole: 'devview-graph-update-proposal-v0',
    status: 'generated-from-graph-delta',
    graphDeltaPath: 'delta.json',
    sourceRecordId: 'change.synthetic',
    proposedRecordState: {
      status: 'implemented-build-pass-runtime-pass',
      activeCodeState: 'active-local-behavior-change',
    },
    proposedNodeUpdates: [
      {
        id: 'change.synthetic',
        currentState: 'planned-not-implemented',
        proposedState: 'implemented-build-pass-runtime-pass',
        intentClaim: 'Synthetic proposal node.',
      },
    ],
    changedFiles: [{ path: 'index.js', additions: '1', deletions: '0' }],
    boundaries: {
      mutatesGraphSource: false,
      appliesPatch: false,
      requiresReviewBeforeApply: true,
      maintainerIntentClaimed: false,
    },
  })
}
