import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runPbeCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('graph retrofit CLI', () => {
  it('summarizes a retrofit graph-source without touching the target project', async () => {
    const result = await runPbeCli(
      [
        'graph',
        'retrofit',
        'plan',
        '--graph-source',
        'examples/retrofit/cardprinterconfig/graph-source.json',
        '--json',
      ],
      { cwd: pluginRoot, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.status).toBe('retrofit-plan-pass')
    expect(payload.target.projectName).toBe('CardPrinterConfig')
    expect(payload.counts.records).toBe(2)
    expect(payload.counts.forbiddenBoundaries).toBe(2)
    expect(payload.edgeIntentSummary.missingClaimCount).toBe(0)
    expect(payload.implementationReadyRecords.map((entry: { id: string }) => entry.id)).toEqual([
      'change.laminator-tag-layout',
    ])
    expect(payload.retainedReferenceRecords.map((entry: { id: string }) => entry.id)).toEqual([
      'change.smart51-test-setting',
    ])
    expect(payload.boundaries.mutatesTargetRepo).toBe(false)
    expect(payload.boundaries.appliesPatch).toBe(false)
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

    const result = await runPbeCli(['graph', 'retrofit', 'plan', '--graph-source', 'graph-source.json', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('retrofit-graph-source-v0')
  })
})
