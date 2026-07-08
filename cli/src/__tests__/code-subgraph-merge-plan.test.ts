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

describe('graph plan-code-subgraph-merge CLI', () => {
  it('creates a dry-run merge plan from a valid code subgraph without mutating graph-source', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())

    const result = await runDevViewCli(
      [
        'graph',
        'plan-code-subgraph-merge',
        '--code-subgraph',
        'code-subgraph.json',
        '--output',
        '.tmp/code-subgraph-merge-plan.json',
        '--markdown',
        '.tmp/code-subgraph-merge-plan.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/code-subgraph-merge-plan.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-code-subgraph-merge-plan-report')
    expect(payload.status).toBe('devview-code-subgraph-merge-plan-recorded')
    expect(payload.planStatus).toBe('dry-run-not-applied')
    expect(payload.sourceCodeSubgraph.nodeCount).toBe(3)
    expect(payload.sourceCodeSubgraph.edgeCount).toBe(2)
    expect(payload.plannedUnifiedGraphAdditions.codeNodeCount).toBe(3)
    expect(payload.plannedUnifiedGraphAdditions.codeEdgeCount).toBe(2)
    expect(payload.plannedUnifiedGraphAdditions.nodeKinds.file).toBe(1)
    expect(payload.plannedUnifiedGraphAdditions.edgeTypes.contains).toBe(1)
    expect(payload.unifiedGraphBoundary.separateCodeGraphCreated).toBe(false)
    expect(payload.unifiedGraphBoundary.maintainabilityGraphMutationPlanned).toBe(false)
    expect(payload.unifiedGraphBoundary.graphSourceMutated).toBe(false)
    expect(payload.unifiedGraphBoundary.graphDeltaApplied).toBe(false)
    expect(payload.unifiedGraphBoundary.viewTreeGenerated).toBe(false)
    expect(payload.unifiedGraphBoundary.contextPackGenerated).toBe(false)
    expectSafetyFalse(payload)
    expect(written.artifactRole).toBe(payload.artifactRole)
    expect(written.plannedUnifiedGraphAdditions).toEqual(payload.plannedUnifiedGraphAdditions)
    expect(existsSync(join(workspace, '.tmp/code-subgraph-merge-plan.md'))).toBe(true)
  })

  it('summarizes a supplied passed validation report and verifies it corresponds to the code subgraph', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())

    const validation = await runDevViewCli(
      [
        'graph',
        'validate-code-subgraph',
        '--code-subgraph',
        'code-subgraph.json',
        '--output',
        '.tmp/code-subgraph-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    expect(validation.exitCode).toBe(ExitCode.Success)

    const result = await runDevViewCli(
      [
        'graph',
        'plan-code-subgraph-merge',
        '--code-subgraph',
        'code-subgraph.json',
        '--code-subgraph-validation',
        '.tmp/code-subgraph-validation.json',
        '--output',
        '.tmp/merge-plan-with-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.sourceCodeSubgraphValidation.status).toBe('devview-code-subgraph-validation-passed')
    expect(payload.sourceCodeSubgraphValidation.codeSubgraphValidationStatus).toBe(
      'validated-code-subgraph-source-fact-only',
    )
    expect(payload.sourceArtifactDigests.map((entry: { sourceKind: string }) => entry.sourceKind)).toEqual(
      expect.arrayContaining(['code-subgraph', 'code-subgraph-validation']),
    )
    expect(payload.mergeFindings.map((entry: { code: string }) => entry.code)).not.toContain(
      'CODE_SUBGRAPH_MERGE_VALIDATION_SOURCE_DIGEST_MISMATCH',
    )
  })

  it('detects optional graph-source node collisions and duplicate edges without writing to graph-source', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())
    writeJson(join(workspace, 'graph-source.json'), {
      artifactRole: 'devview-maintainability-graph-source-fixture',
      status: 'fixture-current',
      sourceRecords: {
        nodes: [{ id: 'code.file.src.todo.ts', type: 'code:file' }],
        edges: [
          {
            id: 'existing-contains',
            from: 'code.file.src.todo.ts',
            to: 'code.function.src.todo.ts.normalizeTodo',
            kind: 'contains',
          },
        ],
      },
      graphSourceMutated: false,
      graphDeltaApplied: false,
    })

    const result = await runDevViewCli(
      [
        'graph',
        'plan-code-subgraph-merge',
        '--code-subgraph',
        'code-subgraph.json',
        '--graph-source',
        'graph-source.json',
        '--output',
        '.tmp/merge-plan-collisions.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.sourceGraph.nodeCount).toBe(1)
    expect(payload.sourceGraph.edgeCount).toBe(1)
    expect(payload.sourceGraph.idCollisionCount).toBe(1)
    expect(payload.sourceGraph.duplicateEdgeCount).toBe(1)
    expect(payload.plannedUnifiedGraphAdditions.idCollisionCount).toBe(1)
    expect(payload.plannedUnifiedGraphAdditions.duplicateEdgeCount).toBe(1)
    expect(JSON.parse(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).sourceRecords.nodes).toHaveLength(1)
  })

  it('blocks wrong code subgraph role/status and wrong validation role/status with zero writes', async () => {
    const cases = [
      {
        codeSubgraph: { ...codeSubgraph(), artifactRole: 'not-devview-code-subgraph' },
        args: ['--code-subgraph', 'bad-code-subgraph.json'],
        sourceFile: 'bad-code-subgraph.json',
        expected: 'CODE_SUBGRAPH_MERGE_CODE_SUBGRAPH_ROLE_INVALID',
      },
      {
        codeSubgraph: { ...codeSubgraph(), status: 'not-supplied' },
        args: ['--code-subgraph', 'bad-code-subgraph.json'],
        sourceFile: 'bad-code-subgraph.json',
        expected: 'CODE_SUBGRAPH_MERGE_CODE_SUBGRAPH_STATUS_INVALID',
      },
      {
        validation: {
          artifactRole: 'not-validation-report',
          status: 'devview-code-subgraph-validation-passed',
          codeSubgraphValidationStatus: 'validated-code-subgraph-source-fact-only',
        },
        args: ['--code-subgraph-validation', 'bad-validation.json'],
        sourceFile: 'bad-validation.json',
        expected: 'CODE_SUBGRAPH_MERGE_VALIDATION_ROLE_INVALID',
      },
      {
        validation: {
          artifactRole: 'devview-code-subgraph-validation-report',
          status: 'devview-code-subgraph-validation-blocked',
          codeSubgraphValidationStatus: 'blocked',
        },
        args: ['--code-subgraph-validation', 'bad-validation.json'],
        sourceFile: 'bad-validation.json',
        expected: 'CODE_SUBGRAPH_MERGE_VALIDATION_STATUS_INVALID',
      },
    ]

    for (const entry of cases) {
      const workspace = createWorkspace()
      writeJson(join(workspace, entry.sourceFile), entry.codeSubgraph ?? entry.validation)

      const result = await runDevViewCli(
        [
          'graph',
          'plan-code-subgraph-merge',
          ...entry.args,
          '--output',
          '.tmp/blocked-merge-plan.json',
          '--markdown',
          '.tmp/blocked-merge-plan.md',
          '--json',
        ],
        { cwd: workspace, pluginRoot },
      )
      const payload = JSON.parse(result.stderr)

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(payload.issues.map((issue: { code: string }) => issue.code)).toContain(entry.expected)
      expect(existsSync(join(workspace, '.tmp/blocked-merge-plan.json'))).toBe(false)
      expect(existsSync(join(workspace, '.tmp/blocked-merge-plan.md'))).toBe(false)
    }
  })

  it('blocks unsafe authority flags before writing outputs', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'unsafe-code-subgraph.json'), {
      ...codeSubgraph(),
      graphSourceMutated: true,
      providerInvoked: true,
    })

    const result = await runDevViewCli(
      [
        'graph',
        'plan-code-subgraph-merge',
        '--code-subgraph',
        'unsafe-code-subgraph.json',
        '--output',
        '.tmp/unsafe-merge-plan.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((issue: { code: string }) => issue.code)).toContain(
      'CODE_SUBGRAPH_MERGE_UNSAFE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/unsafe-merge-plan.json'))).toBe(false)
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
        output: join('.devview', 'generated', 'merge-plan.json'),
        expected: 'inside a protected control path',
      },
      {
        output: '.tmp/graph-source-merge-plan.json',
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

      const result = await runDevViewCli(
        [
          'graph',
          'plan-code-subgraph-merge',
          '--code-subgraph',
          'code-subgraph.json',
          '--output',
          entry.output,
          ...(entry.markdown ? ['--markdown', entry.markdown] : []),
          '--json',
        ],
        { cwd: workspace, pluginRoot },
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(result.stderr).toContain(entry.expected)
      expect(existsSync(join(workspace, entry.output))).toBe(
        Boolean(entry.existing || entry.output === 'code-subgraph.json'),
      )
    }
  })
})

function codeSubgraph(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-code-subgraph',
    status: 'devview-code-subgraph-supplied',
    scope: 'code-subgraph-source-fact-only',
    nodes: [
      {
        id: 'code.file.src.todo.ts',
        kind: 'file',
        label: 'src/todo.ts',
        sourceFile: 'src/todo.ts',
        sourceLocationStatus: 'file-node',
        sourceDigest: 'sha256:fixture',
        confidence: 'extracted',
      },
      {
        id: 'code.function.src.todo.ts.normalizeTodo',
        kind: 'function',
        label: 'normalizeTodo',
        sourceFile: 'src/todo.ts',
        sourceLocation: { startLine: 1, startColumn: 1, endLine: 3, endColumn: 2 },
        sourceDigest: 'sha256:fixture',
        confidence: 'extracted',
      },
      {
        id: 'code.external.fixture.store',
        kind: 'external_dependency',
        label: '@fixture/store',
        sourceFile: 'src/todo.ts',
        sourceLocationStatus: 'external-import-specifier',
        sourceDigest: 'sha256:fixture',
        confidence: 'inferred',
      },
    ],
    edges: [
      {
        id: 'code-edge.file-contains-normalize',
        from: 'code.file.src.todo.ts',
        to: 'code.function.src.todo.ts.normalizeTodo',
        kind: 'contains',
        sourceFile: 'src/todo.ts',
        sourceLocation: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 10 },
        sourceDigest: 'sha256:fixture',
        confidence: 'extracted',
      },
      {
        id: 'code-edge.file-imports-store',
        from: 'code.file.src.todo.ts',
        to: 'code.external.fixture.store',
        kind: 'imports',
        sourceFile: 'src/todo.ts',
        sourceLocationStatus: 'import-static-fixture',
        sourceDigest: 'sha256:fixture',
        confidence: 'inferred',
      },
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
    ...overrides,
  }
}

function expectSafetyFalse(payload: Record<string, unknown>): void {
  expect(payload.graphifyExecuted).toBe(false)
  expect(payload.astExtractorExecuted).toBe(false)
  expect(payload.providerInvoked).toBe(false)
  expect(payload.networkCallMade).toBe(false)
  expect(payload.apiCallMade).toBe(false)
  expect(payload.shellCommandsExecuted).toBe(false)
  expect(payload.extensionExecutionAllowed).toBe(false)
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
