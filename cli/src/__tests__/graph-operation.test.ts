import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runPbeCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('graph operation CLI', () => {
  it('previews a committed graph update proposal without mutating graph-source', async () => {
    const graphSourcePath = join(pluginRoot, 'examples/retrofit/open-source/escape-html/graph-source.json')
    const before = readFileSync(graphSourcePath, 'utf8')

    const result = await runPbeCli(
      [
        'graph',
        'operation',
        'apply-proposal',
        '--proposal',
        'outputs/retrofit/open-source/escape-html/graph-update-proposals/symbol-stringification.graph-update-proposal.json',
        '--json',
      ],
      { cwd: pluginRoot, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.status).toBe('graph-update-proposal-preview-pass')
    expect(payload.applied).toBe(false)
    expect(payload.boundaries.graphSourceWritten).toBe(false)
    expect(payload.changedFiles.map((entry: { path: string }) => entry.path)).toEqual(['index.js', 'test/index.js'])
    expect(readFileSync(graphSourcePath, 'utf8')).toBe(before)
  })

  it('applies a proposal to graph-source only when --apply is present', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'graph-source.json'), {
      schemaVersion: 1,
      artifactRole: 'retrofit-graph-source-v0',
      status: 'active-retrofit-graph-source',
      records: [
        {
          id: 'change.demo',
          path: 'records/change.demo.json',
          expectedStatus: 'planned-not-implemented',
          expectedActiveCodeState: 'not-applied',
        },
      ],
      nodes: [
        {
          id: 'change.demo',
          kind: 'retrofit-change-record',
          state: 'planned-not-implemented',
          intentClaim: 'Demo proposal node.',
        },
      ],
      edges: [],
    })
    writeJson(join(workspace, 'delta.json'), {
      schemaVersion: 1,
      artifactRole: 'retrofit-graph-delta-v0',
      status: 'generated-from-target-diff',
      graphSourcePath: 'graph-source.json',
      sourceRecordId: 'change.demo',
    })
    writeJson(join(workspace, 'proposal.json'), {
      schemaVersion: 1,
      artifactRole: 'pbe-graph-update-proposal-v0',
      status: 'generated-from-graph-delta',
      graphDeltaPath: 'delta.json',
      sourceRecordId: 'change.demo',
      proposedRecordState: {
        status: 'implemented-build-pass-runtime-pass',
        activeCodeState: 'active-local-behavior-change',
      },
      proposedNodeUpdates: [
        {
          id: 'change.demo',
          currentState: 'planned-not-implemented',
          proposedState: 'implemented-build-pass-runtime-pass',
          intentClaim: 'Demo proposal node.',
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

    const preview = await runPbeCli(['graph', 'operation', 'apply-proposal', '--proposal', 'proposal.json', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    expect(preview.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).nodes[0].state).toBe(
      'planned-not-implemented',
    )

    const applied = await runPbeCli(
      ['graph', 'operation', 'apply-proposal', '--proposal', 'proposal.json', '--apply', '--json'],
      {
        cwd: workspace,
        pluginRoot,
      },
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
    writeJson(join(workspace, 'graph-source.json'), {
      records: [{ id: 'change.demo', path: 'records/change.demo.json' }],
      nodes: [{ id: 'change.demo', state: 'already-changed' }],
    })
    writeJson(join(workspace, 'delta.json'), {
      artifactRole: 'retrofit-graph-delta-v0',
      status: 'generated-from-target-diff',
      graphSourcePath: 'graph-source.json',
      sourceRecordId: 'change.demo',
    })
    writeJson(join(workspace, 'proposal.json'), {
      artifactRole: 'pbe-graph-update-proposal-v0',
      status: 'generated-from-graph-delta',
      graphDeltaPath: 'delta.json',
      sourceRecordId: 'change.demo',
      proposedNodeUpdates: [
        {
          id: 'change.demo',
          currentState: 'planned-not-implemented',
          proposedState: 'implemented-build-pass-runtime-pass',
        },
      ],
      boundaries: {
        mutatesGraphSource: false,
        appliesPatch: false,
        requiresReviewBeforeApply: true,
        maintainerIntentClaimed: false,
      },
    })

    const result = await runPbeCli(
      ['graph', 'operation', 'apply-proposal', '--proposal', 'proposal.json', '--apply', '--json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('Stale proposal')
  })
})
