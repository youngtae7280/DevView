import { readFileSync } from 'node:fs'
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
  it('summarizes a retrofit graph-source without touching the target project', async () => {
    const result = await runDevViewCli(
      [
        'graph',
        'retrofit',
        'plan',
        '--graph-source',
        'examples/internal-legacy/retrofit/cardprinterconfig/graph-source.json',
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

  it('summarizes a large external Kubernetes KEP retrofit graph-source without touching the target project', async () => {
    const result = await runDevViewCli(
      [
        'graph',
        'retrofit',
        'plan',
        '--graph-source',
        'examples/internal-legacy/retrofit/open-source/kubernetes-sidecar-kep/graph-source.json',
        '--json',
      ],
      { cwd: pluginRoot, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.status).toBe('retrofit-plan-pass')
    expect(payload.target.projectName).toBe('kubernetes/kubernetes KEP-753 Sidecar Containers')
    expect(payload.target.observedSourceRef).toBe('2846ba9cdbbde11f02435cfdfccf1850d99be47b')
    expect(payload.counts.records).toBe(1)
    expect(payload.counts.nodes).toBe(19)
    expect(payload.counts.edges).toBe(17)
    expect(payload.counts.forbiddenBoundaries).toBe(3)
    expect(payload.edgeIntentSummary.edgeIntentCount).toBe(17)
    expect(payload.edgeIntentSummary.missingClaimCount).toBe(0)
    expect(payload.edgeIntentSummary.missingClassificationCount).toBe(0)
    expect(payload.implementationReadyRecords.map((entry: { id: string }) => entry.id)).toEqual([
      'change.kep753.sidecar-intent-map',
    ])
    expect(payload.boundaries.mutatesTargetRepo).toBe(false)
    expect(payload.boundaries.appliesPatch).toBe(false)
    expect(payload.boundaries.claimsMaintainerIntent).toBe(false)

    const sourceMap = JSON.parse(
      readFileSync(
        resolve(
          pluginRoot,
          'examples/internal-legacy/retrofit/open-source/kubernetes-sidecar-kep/support/kep753-source-map.json',
        ),
        'utf8',
      ),
    )
    expect(sourceMap.kepSectionAnchors.map((entry: { section: string }) => entry.section)).toContain('Non-Goals')
    expect(sourceMap.symbolAnchors.map((entry: { symbol: string }) => entry.symbol)).toEqual(
      expect.arrayContaining([
        'IsRestartableInitContainer',
        'computeInitContainerActions',
        'AggregateContainerRequests',
      ]),
    )
    expect(sourceMap.testAnchors.map((entry: { symbol: string }) => entry.symbol)).toEqual(
      expect.arrayContaining(['TestIsContainerRestartable', 'TestLifeCycleHookForRestartableInitContainer']),
    )
  })

  it('generates a read-only instruction pack from the Kubernetes KEP retrofit record', async () => {
    const result = await runDevViewCli(
      [
        'graph',
        'operation',
        'generate-pack',
        '--graph-source',
        'examples/internal-legacy/retrofit/open-source/kubernetes-sidecar-kep/graph-source.json',
        '--record',
        'change.kep753.sidecar-intent-map',
        '--json',
      ],
      { cwd: pluginRoot, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.status).toBe('generated-from-graph-source')
    expect(payload.artifactRole).toBe('retrofit-instruction-pack-v0')
    expect(payload.sourceRecordId).toBe('change.kep753.sidecar-intent-map')
    expect(payload.target.projectName).toBe('kubernetes/kubernetes')
    expect(payload.allowedScope.files).toContain('keps/sig-node/753-sidecar-containers/README.md')
    expect(payload.allowedScope.files).toContain('pkg/kubelet/kuberuntime/kuberuntime_container.go')
    expect(payload.allowedScope.files).toContain('staging/src/k8s.io/component-helpers/resource/helpers.go')
    expect(payload.allowedScope.files).toContain('test/e2e_node/container_lifecycle_test.go')
    expect(payload.forbiddenScope.flows.map((entry: { flow?: string }) => entry.flow)).toContain(
      'kubernetes/kubernetes code mutation',
    )
    expect(payload.executionBoundary.mayModifyExternalProject).toBe(false)
    expect(payload.graphContext.edgeIntents.map((entry: { id: string }) => entry.id)).toContain(
      'edge.intent-map-guards-target-mutation',
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
