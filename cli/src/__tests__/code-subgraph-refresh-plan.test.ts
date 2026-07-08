import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

const targetFileId = 'code.file.src.target.ts'
const targetClassId = 'code.class.src.target.ts.TargetService'
const targetMethodId = 'code.method.src.target.ts.TargetService.run'
const targetFunctionId = 'code.function.src.target.ts.helper'
const callerFunctionId = 'code.function.src.caller.ts.callTarget'
const importerFileId = 'code.file.src.importer.ts'
const referencerFunctionId = 'code.function.src.referencer.ts.refTarget'

afterEach(() => {
  cleanupWorkspaces()
})

describe('graph plan-code-subgraph-refresh CLI', () => {
  it('marks changed-file code nodes and edges as affected refresh candidates', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())

    const result = await runRefreshPlan(
      workspace,
      ['--changed-file', 'src/target.ts', '--markdown', '.tmp/refresh.md'],
      '.tmp/refresh.json',
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/refresh.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-code-subgraph-refresh-plan-report')
    expect(payload.status).toBe('devview-code-subgraph-refresh-plan-recorded')
    expect(payload.scope).toBe('code-subgraph-refresh-plan-report-only')
    expect(payload.refreshPlanStatus).toBe('planned-not-applied')
    expect(payload.changedFiles.normalized.map((file: { relativePath: string }) => file.relativePath)).toEqual([
      'src/target.ts',
    ])
    expect(payload.affectedCodeNodes.map((node: { nodeId: string }) => node.nodeId).sort()).toEqual([
      targetClassId,
      targetFileId,
      targetFunctionId,
      targetMethodId,
    ])
    expect(payload.affectedCodeEdges.map((edge: { edgeId: string }) => edge.edgeId)).toEqual(
      expect.arrayContaining(['edge.file-class', 'edge.class-method', 'edge.file-helper', 'edge.caller-method']),
    )
    expect(payload.staleCandidateSummary.affectedNodeCount).toBe(4)
    expect(payload.staleCandidateSummary.affectedEdgeCount).toBeGreaterThanOrEqual(4)
    expect(payload.unifiedGraphRefreshBoundary.extractorExecuted).toBe(false)
    expect(payload.unifiedGraphRefreshBoundary.watchActivated).toBe(false)
    expect(payload.unifiedGraphRefreshBoundary.hookInstalled).toBe(false)
    expectSafetyFalse(payload)
    expect(written.writtenMarkdownPath).toBe('.tmp/refresh.md')
    expect(existsSync(join(workspace, '.tmp/refresh.md'))).toBe(true)
  })

  it('includes calls/imports/references dependents deterministically', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())

    const result = await runRefreshPlan(workspace, ['--changed-file', 'src/target.ts'], '.tmp/dependents.json')
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.dependentCodeNodes.map((node: { nodeId: string }) => node.nodeId)).toEqual([
      importerFileId,
      callerFunctionId,
      referencerFunctionId,
    ])
    expect(payload.dependentCodeNodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nodeId: callerFunctionId,
          dependencyReasons: expect.arrayContaining([expect.objectContaining({ edgeType: 'calls' })]),
        }),
        expect.objectContaining({
          nodeId: importerFileId,
          dependencyReasons: expect.arrayContaining([expect.objectContaining({ edgeType: 'imports' })]),
        }),
        expect.objectContaining({
          nodeId: referencerFunctionId,
          dependencyReasons: expect.arrayContaining([expect.objectContaining({ edgeType: 'references' })]),
        }),
      ]),
    )
  })

  it('includes parent containment context', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())

    const result = await runRefreshPlan(workspace, ['--changed-file', 'src/target.ts'], '.tmp/containment.json')
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.containmentContextNodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nodeId: targetFileId,
          containmentReasons: expect.arrayContaining([expect.objectContaining({ childNodeId: targetClassId })]),
        }),
        expect.objectContaining({
          nodeId: targetClassId,
          containmentReasons: expect.arrayContaining([expect.objectContaining({ childNodeId: targetMethodId })]),
        }),
      ]),
    )
  })

  it('records unknown changed files as deterministic warnings without mutation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())

    const result = await runRefreshPlan(workspace, ['--changed-file', 'src/missing.ts'], '.tmp/unknown.json')
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.changedFiles.unmatched).toEqual(['src/missing.ts'])
    expect(payload.affectedCodeNodes).toEqual([])
    expect(payload.validationFindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ severity: 'warning', code: 'CODE_SUBGRAPH_REFRESH_CHANGED_FILE_UNMATCHED' }),
        expect.objectContaining({ severity: 'warning', code: 'CODE_SUBGRAPH_REFRESH_NO_AFFECTED_NODES' }),
      ]),
    )
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
  })

  it('blocks missing changed-file input with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())

    const result = await runDevViewCli(
      [
        'graph',
        'plan-code-subgraph-refresh',
        '--code-subgraph',
        'code-subgraph.json',
        '--output',
        '.tmp/missing-changed-file.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.InvalidArguments)
    expect(result.stderr).toContain('requires at least one --changed-file')
    expect(existsSync(join(workspace, '.tmp/missing-changed-file.json'))).toBe(false)
  })

  it('blocks wrong source role or status with zero writes', async () => {
    const cases = [
      {
        override: { artifactRole: 'not-code-subgraph' },
        expected: 'CODE_SUBGRAPH_REFRESH_CODE_SUBGRAPH_ROLE_INVALID',
      },
      {
        override: { status: 'not-supplied' },
        expected: 'CODE_SUBGRAPH_REFRESH_CODE_SUBGRAPH_STATUS_INVALID',
      },
    ]

    for (const entry of cases) {
      const workspace = createWorkspace()
      writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph(entry.override))

      const result = await runRefreshPlan(workspace, ['--changed-file', 'src/target.ts'], '.tmp/wrong-source.json')
      const payload = JSON.parse(result.stderr)

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(payload.issues.map((issue: { code: string }) => issue.code)).toContain(entry.expected)
      expect(existsSync(join(workspace, '.tmp/wrong-source.json'))).toBe(false)
    }
  })

  it('never emits executed refresh actions', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())

    const result = await runRefreshPlan(workspace, ['--changed-file', 'src/target.ts'], '.tmp/actions.json')
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.refreshActionPlan.length).toBeGreaterThan(1)
    expect(
      payload.refreshActionPlan.every(
        (action: { executionMode: string }) => action.executionMode === 'future-only-not-executed',
      ),
    ).toBe(true)
    expect(payload.refreshActionPlan.every((action: { executed: boolean }) => action.executed === false)).toBe(true)
  })

  it('blocks unsafe authority flags before writing outputs', async () => {
    const workspace = createWorkspace()
    writeJson(
      join(workspace, 'code-subgraph.json'),
      codeSubgraph({
        graphSourceMutated: true,
        extractorExecuted: true,
      }),
    )

    const result = await runRefreshPlan(workspace, ['--changed-file', 'src/target.ts'], '.tmp/unsafe.json')
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((issue: { code: string }) => issue.code)).toContain(
      'CODE_SUBGRAPH_REFRESH_UNSAFE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe.json'))).toBe(false)
  })

  it('blocks output collisions, source overwrite, protected paths, and source-authority-shaped outputs', async () => {
    const cases = [
      {
        output: '.tmp/same.json',
        markdown: '.tmp/same.json',
        expected: 'must be different',
      },
      {
        output: 'code-subgraph.json',
        expected: 'would overwrite a source input',
      },
      {
        output: join('.devview', 'generated', 'refresh.json'),
        expected: 'inside a protected control path',
      },
      {
        output: '.tmp/graph-source-refresh.json',
        expected: 'would overwrite a source-authority-shaped path',
      },
      {
        output: '.tmp/existing-node-edge.json',
        existing: { nodes: [], edges: [] },
        expected: 'would overwrite a source-authority-shaped path',
      },
    ]

    for (const entry of cases) {
      const workspace = createWorkspace()
      writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())
      if (entry.existing) {
        writeJson(join(workspace, entry.output), entry.existing)
      }

      const result = await runRefreshPlan(
        workspace,
        ['--changed-file', 'src/target.ts', ...(entry.markdown ? ['--markdown', entry.markdown] : [])],
        entry.output,
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(result.stderr).toContain(entry.expected)
      expect(existsSync(join(workspace, entry.output))).toBe(
        Boolean(entry.existing || entry.output === 'code-subgraph.json'),
      )
    }
  })
})

async function runRefreshPlan(workspace: string, extraArgs: string[], output: string) {
  return await runDevViewCli(
    [
      'graph',
      'plan-code-subgraph-refresh',
      '--code-subgraph',
      'code-subgraph.json',
      ...extraArgs,
      '--output',
      output,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function codeSubgraph(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-code-subgraph',
    status: 'devview-code-subgraph-supplied',
    scope: 'code-subgraph-source-fact-only',
    nodes: [
      codeNode(targetFileId, 'file', 'src/target.ts', 'file-node'),
      codeNode(targetClassId, 'class', 'src/target.ts', undefined, {
        startLine: 1,
        startColumn: 1,
        endLine: 8,
        endColumn: 2,
      }),
      codeNode(targetMethodId, 'method', 'src/target.ts', undefined, {
        startLine: 2,
        startColumn: 3,
        endLine: 5,
        endColumn: 4,
      }),
      codeNode(targetFunctionId, 'function', 'src/target.ts', undefined, {
        startLine: 10,
        startColumn: 1,
        endLine: 12,
        endColumn: 2,
      }),
      codeNode(callerFunctionId, 'function', 'src/caller.ts', undefined, {
        startLine: 1,
        startColumn: 1,
        endLine: 3,
        endColumn: 2,
      }),
      codeNode(importerFileId, 'file', 'src/importer.ts', 'file-node'),
      codeNode(referencerFunctionId, 'function', 'src/referencer.ts', undefined, {
        startLine: 1,
        startColumn: 1,
        endLine: 3,
        endColumn: 2,
      }),
    ],
    edges: [
      codeEdge('edge.file-class', targetFileId, targetClassId, 'contains', 'src/target.ts'),
      codeEdge('edge.class-method', targetClassId, targetMethodId, 'contains', 'src/target.ts'),
      codeEdge('edge.file-helper', targetFileId, targetFunctionId, 'contains', 'src/target.ts'),
      codeEdge('edge.caller-method', callerFunctionId, targetMethodId, 'calls', 'src/caller.ts'),
      codeEdge('edge.importer-target-file', importerFileId, targetFileId, 'imports', 'src/importer.ts'),
      codeEdge('edge.referencer-helper', referencerFunctionId, targetFunctionId, 'references', 'src/referencer.ts'),
    ],
    graphifyExecuted: false,
    astExtractorExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    viewTreeGenerated: false,
    contextPackGenerated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    rbacEnforced: false,
    permissionVerified: false,
    cryptographicSignatureVerified: false,
    enterpriseGateActivated: false,
    watchActivated: false,
    hookInstalled: false,
    extractorExecuted: false,
    ...overrides,
  }
}

function codeNode(
  id: string,
  kind: string,
  sourceFile: string,
  sourceLocationStatus?: string,
  sourceLocation?: Record<string, number>,
): Record<string, unknown> {
  return {
    id,
    kind,
    label: id,
    sourceFile,
    ...(sourceLocation ? { sourceLocation } : { sourceLocationStatus }),
    sourceDigest: 'sha256:fixture',
    confidence: 'extracted',
  }
}

function codeEdge(id: string, from: string, to: string, kind: string, sourceFile: string): Record<string, unknown> {
  return {
    id,
    from,
    to,
    kind,
    sourceFile,
    sourceLocationStatus: 'fixture-edge',
    sourceDigest: 'sha256:fixture',
    confidence: 'extracted',
  }
}

function expectSafetyFalse(payload: Record<string, unknown>): void {
  expect(payload.graphifyExecuted).toBe(false)
  expect(payload.astExtractorExecuted).toBe(false)
  expect(payload.extractorExecuted).toBe(false)
  expect(payload.nativeExtractorExecuted).toBe(false)
  expect(payload.providerInvoked).toBe(false)
  expect(payload.networkCallMade).toBe(false)
  expect(payload.apiCallMade).toBe(false)
  expect(payload.shellCommandsExecuted).toBe(false)
  expect(payload.extensionExecutionAllowed).toBe(false)
  expect(payload.watchActivated).toBe(false)
  expect(payload.hookInstalled).toBe(false)
  expect(payload.graphSourceMutated).toBe(false)
  expect(payload.graphDeltaApplied).toBe(false)
  expect(payload.viewTreeGenerated).toBe(false)
  expect(payload.contextPackGenerated).toBe(false)
  expect(payload.runtimeEvidenceSatisfied).toBe(false)
  expect(payload.evidenceAccepted).toBe(false)
  expect(payload.equivalenceProven).toBe(false)
  expect(payload.scopeEnforced).toBe(false)
  expect(payload.ciEnforcementEnabled).toBe(false)
  expect(payload.rbacEnforced).toBe(false)
  expect(payload.permissionVerified).toBe(false)
  expect(payload.cryptographicSignatureVerified).toBe(false)
  expect(payload.enterpriseGateActivated).toBe(false)
}
