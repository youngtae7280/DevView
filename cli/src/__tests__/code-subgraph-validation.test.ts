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

describe('graph validate-code-subgraph CLI', () => {
  it('validates a minimal report-only file/function code subgraph', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), minimalCodeSubgraph())

    const result = await runDevViewCli(
      [
        'graph',
        'validate-code-subgraph',
        '--code-subgraph',
        'code-subgraph.json',
        '--output',
        '.tmp/code-subgraph-validation.json',
        '--markdown',
        '.tmp/code-subgraph-validation.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-code-subgraph-validation-report')
    expect(payload.status).toBe('devview-code-subgraph-validation-passed')
    expect(payload.codeSubgraphValidationStatus).toBe('validated-code-subgraph-source-fact-only')
    expect(payload.nodeSummary.nodeCount).toBe(2)
    expect(payload.edgeSummary.edgeCount).toBe(1)
    expect(payload.nodeSummary.codeNodeKindCounts.file).toBe(1)
    expect(payload.nodeSummary.codeNodeKindCounts.function).toBe(1)
    expect(payload.edgeSummary.codeEdgeTypeCounts.contains).toBe(1)
    expect(payload.graphifyExecuted).toBe(false)
    expect(payload.astExtractorExecuted).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.viewTreeGenerated).toBe(false)
    expect(existsSync(join(workspace, '.tmp/code-subgraph-validation.md'))).toBe(true)
  })

  it('validates richer calls/imports/covers code facts without invoking providers or extractors', async () => {
    const workspace = createWorkspace()
    writeJson(
      join(workspace, 'rich-code-subgraph.json'),
      minimalCodeSubgraph({
        nodes: [
          codeNode('file.todo-service', 'file', 'src/todo-service.ts'),
          codeNode('module.todo-store', 'module', 'src/todo-store.ts'),
          codeNode('function.addTodo', 'function', 'src/todo-service.ts'),
          codeNode('function.saveTodo', 'function', 'src/todo-store.ts'),
          codeNode('test.addTodo', 'test', 'src/todo-service.test.ts', 'ambiguous'),
        ],
        edges: [
          codeEdge(
            'edge.file-contains-add',
            'file.todo-service',
            'function.addTodo',
            'contains',
            'src/todo-service.ts',
          ),
          codeEdge(
            'edge.file-imports-store',
            'file.todo-service',
            'module.todo-store',
            'imports',
            'src/todo-service.ts',
          ),
          codeEdge('edge.add-calls-save', 'function.addTodo', 'function.saveTodo', 'calls', 'src/todo-service.ts'),
          codeEdge('edge.test-covers-add', 'test.addTodo', 'function.addTodo', 'covers', 'src/todo-service.test.ts'),
        ],
      }),
    )

    const result = await runDevViewCli(
      [
        'graph',
        'validate-code-subgraph',
        '--code-subgraph',
        'rich-code-subgraph.json',
        '--output',
        '.tmp/rich-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.edgeSummary.codeEdgeTypeCounts.calls).toBe(1)
    expect(payload.edgeSummary.codeEdgeTypeCounts.imports).toBe(1)
    expect(payload.edgeSummary.codeEdgeTypeCounts.covers).toBe(1)
    expect(payload.provenanceSummary.confidenceCounts.extracted).toBeGreaterThan(0)
    expect(payload.provenanceSummary.confidenceCounts.ambiguous).toBeGreaterThan(0)
  })

  it('blocks wrong role/status/scope, unsupported vocabulary, missing endpoints, and missing provenance with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'bad-code-subgraph.json'), {
      artifactRole: 'wrong-role',
      status: 'wrong-status',
      scope: 'wrong-scope',
      nodes: [
        {
          id: 'node.bad',
          kind: 'screen',
          sourceFile: 'src/bad.ts',
          confidence: 'certain',
        },
      ],
      edges: [
        {
          id: 'edge.bad',
          from: 'node.bad',
          to: 'node.missing',
          kind: 'magically_related',
          sourceFile: 'src/bad.ts',
          sourceLocationStatus: 'not-modeled',
          confidence: 'extracted',
        },
      ],
    })

    const result = await runDevViewCli(
      [
        'graph',
        'validate-code-subgraph',
        '--code-subgraph',
        'bad-code-subgraph.json',
        '--output',
        '.tmp/bad-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)
    const codes = payload.issues.map((entry: { code: string }) => entry.code)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(codes).toEqual(
      expect.arrayContaining([
        'CODE_SUBGRAPH_ROLE_INVALID',
        'CODE_SUBGRAPH_STATUS_INVALID',
        'CODE_SUBGRAPH_SCOPE_INVALID',
        'CODE_SUBGRAPH_NODE_KIND_UNSUPPORTED',
        'CODE_SUBGRAPH_EDGE_ENDPOINT_MISSING',
        'CODE_SUBGRAPH_EDGE_TYPE_UNSUPPORTED',
        'CODE_SUBGRAPH_PROVENANCE_SOURCE_LOCATION_MISSING',
        'CODE_SUBGRAPH_PROVENANCE_CONFIDENCE_INVALID',
      ]),
    )
    expect(existsSync(join(workspace, '.tmp/bad-validation.json'))).toBe(false)
  })

  it('blocks unsafe authority and executable/provider fields before writing outputs', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'unsafe-code-subgraph.json'), {
      ...minimalCodeSubgraph(),
      graphifyExecuted: true,
      providerInvoked: true,
      nodes: [
        {
          ...codeNode('file.todo-service', 'file', 'src/todo-service.ts'),
          command: 'graphify .',
        },
      ],
    })

    const result = await runDevViewCli(
      [
        'graph',
        'validate-code-subgraph',
        '--code-subgraph',
        'unsafe-code-subgraph.json',
        '--output',
        '.tmp/unsafe-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining(['CODE_SUBGRAPH_UNSAFE_AUTHORITY_FLAG', 'CODE_SUBGRAPH_EXECUTABLE_INSTRUCTION_DECLARED']),
    )
    expect(existsSync(join(workspace, '.tmp/unsafe-validation.json'))).toBe(false)
  })

  it('blocks output collisions, source overwrite, protected paths, and source-authority-shaped outputs', async () => {
    const cases = [
      {
        output: 'code-subgraph.json',
        expected: 'would overwrite a source input',
      },
      {
        output: '.tmp/report.json',
        markdown: '.tmp/report.json',
        expected: 'must be different',
      },
      {
        output: join('.devview', 'generated', 'code-subgraph-validation.json'),
        expected: 'inside a protected control path',
      },
      {
        output: 'existing-graph.json',
        existing: {
          artifactRole: 'devview-code-subgraph',
          status: 'devview-code-subgraph-supplied',
          nodes: [],
          edges: [],
        },
        expected: 'would overwrite a source-authority-shaped path',
      },
    ]

    for (const entry of cases) {
      const workspace = createWorkspace()
      writeJson(join(workspace, 'code-subgraph.json'), minimalCodeSubgraph())
      if (entry.existing) {
        writeJson(join(workspace, entry.output), entry.existing)
      }

      const result = await runDevViewCli(
        [
          'graph',
          'validate-code-subgraph',
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
    }
  })

  it('produces deterministic output across repeated runs apart from written output path metadata', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), minimalCodeSubgraph())

    const first = await runDevViewCli(
      [
        'graph',
        'validate-code-subgraph',
        '--code-subgraph',
        'code-subgraph.json',
        '--output',
        '.tmp/first.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const second = await runDevViewCli(
      [
        'graph',
        'validate-code-subgraph',
        '--code-subgraph',
        'code-subgraph.json',
        '--output',
        '.tmp/second.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const firstPayload = JSON.parse(first.stdout)
    const secondPayload = JSON.parse(second.stdout)
    delete firstPayload.writtenOutputPath
    delete secondPayload.writtenOutputPath

    expect(first.exitCode).toBe(ExitCode.Success)
    expect(second.exitCode).toBe(ExitCode.Success)
    expect(secondPayload).toEqual(firstPayload)
    expect(readFileSync(join(workspace, '.tmp/first.json'), 'utf8')).toContain(
      'devview-code-subgraph-validation-report',
    )
  })
})

function minimalCodeSubgraph(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-code-subgraph',
    status: 'devview-code-subgraph-supplied',
    scope: 'code-subgraph-source-fact-only',
    nodes: [
      codeNode('file.todo-service', 'file', 'src/todo-service.ts'),
      codeNode('function.addTodo', 'function', 'src/todo-service.ts'),
    ],
    edges: [
      codeEdge('edge.file-contains-add', 'file.todo-service', 'function.addTodo', 'contains', 'src/todo-service.ts'),
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
    rbacEnforced: false,
    permissionVerified: false,
    cryptographicSignatureVerified: false,
    enterpriseGateActivated: false,
    ...overrides,
  }
}

function codeNode(id: string, kind: string, sourceFile: string, confidence = 'extracted'): Record<string, unknown> {
  return {
    id,
    kind,
    label: id,
    sourceFile,
    sourceLocation: { startLine: 1, startColumn: 1, endLine: 5, endColumn: 1 },
    sourceDigest: 'sha256:test-digest',
    confidence,
    extractor: 'static-test-fixture',
  }
}

function codeEdge(
  id: string,
  from: string,
  to: string,
  kind: string,
  sourceFile: string,
  confidence = 'extracted',
): Record<string, unknown> {
  return {
    id,
    from,
    to,
    kind,
    sourceFile,
    sourceLocation: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
    sourceDigest: 'sha256:test-digest',
    confidence,
    extractor: 'static-test-fixture',
  }
}
