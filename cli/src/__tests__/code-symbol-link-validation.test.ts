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

describe('graph validate-code-symbol-links CLI', () => {
  it('validates a minimal task-to-function link with a verified code endpoint', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())
    writeJson(
      join(workspace, 'links.json'),
      linksArtifact([link('link-task-run', 'TASK-1', functionId, 'touches', 'task', 'function')]),
    )

    const result = await runDevViewCli(
      [
        'graph',
        'validate-code-symbol-links',
        '--links',
        'links.json',
        '--code-subgraph',
        'code-subgraph.json',
        '--output',
        '.tmp/code-symbol-links-validation.json',
        '--markdown',
        '.tmp/code-symbol-links-validation.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/code-symbol-links-validation.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-code-symbol-link-validation-report')
    expect(payload.status).toBe('devview-code-symbol-link-validation-passed')
    expect(payload.scope).toBe('code-symbol-link-validation-report-only')
    expect(payload.linkValidationSummary.total).toBe(1)
    expect(payload.linkValidationSummary.byLinkType.touches).toBe(1)
    expect(payload.linkValidationSummary.verifiedCodeEndpointCount).toBe(1)
    expect(payload.linkValidationSummary.unverifiedMaintenanceEndpointCount).toBe(1)
    expect(payload.missingEndpointSummary.missingCodeEndpointCount).toBe(0)
    expect(payload.validatedLinks).toEqual([
      expect.objectContaining({
        id: 'link-task-run',
        sourceNodeId: 'TASK-1',
        targetCodeNodeId: functionId,
        linkType: 'touches',
        sourceNodeKind: 'task',
        targetCodeNodeKind: 'function',
        sourceLocationStatus: 'link-fixture',
        confidence: 'inferred',
      }),
    ])
    expect(payload.unifiedGraphBoundary.separateCodeGraphCreated).toBe(false)
    expect(payload.unifiedGraphBoundary.graphSourceMutated).toBe(false)
    expect(payload.unifiedGraphBoundary.graphDeltaApplied).toBe(false)
    expectSafetyFalse(payload)
    expect(written.artifactRole).toBe(payload.artifactRole)
    expect(existsSync(join(workspace, '.tmp/code-symbol-links-validation.md'))).toBe(true)
  })

  it('validates richer maintenance links and summarizes validation, merge plan, and graph-source endpoints', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())
    writeJson(
      join(workspace, 'links.json'),
      linksArtifact([
        link('link-change-method', 'CHANGE-1', methodId, 'modifies', 'change', 'method'),
        link('link-check-function', 'CHECK-1', functionId, 'covers', 'check', 'function'),
        link('link-evidence-method', 'EVIDENCE-1', methodId, 'verifies', 'evidence', 'method'),
        link('link-requirement-function', 'REQ-1', functionId, 'implements_requirement', 'requirement', 'function'),
        link('link-decision-class', 'DECISION-1', classId, 'constrains', 'decision', 'class'),
      ]),
    )
    writeJson(
      join(workspace, 'graph-source.json'),
      graphSource(['CHANGE-1', 'CHECK-1', 'EVIDENCE-1', 'REQ-1', 'DECISION-1']),
    )

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

    const mergePlan = await runDevViewCli(
      [
        'graph',
        'plan-code-subgraph-merge',
        '--code-subgraph',
        'code-subgraph.json',
        '--code-subgraph-validation',
        '.tmp/code-subgraph-validation.json',
        '--output',
        '.tmp/code-subgraph-merge-plan.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    expect(mergePlan.exitCode).toBe(ExitCode.Success)

    const result = await runDevViewCli(
      [
        'graph',
        'validate-code-symbol-links',
        '--links',
        'links.json',
        '--code-subgraph',
        'code-subgraph.json',
        '--code-subgraph-validation',
        '.tmp/code-subgraph-validation.json',
        '--code-subgraph-merge-plan',
        '.tmp/code-subgraph-merge-plan.json',
        '--graph-source',
        'graph-source.json',
        '--output',
        '.tmp/richer-link-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.linkValidationSummary.total).toBe(5)
    expect(payload.linkValidationSummary.byLinkType.modifies).toBe(1)
    expect(payload.linkValidationSummary.byLinkType.covers).toBe(1)
    expect(payload.linkValidationSummary.byLinkType.verifies).toBe(1)
    expect(payload.linkValidationSummary.byLinkType.implements_requirement).toBe(1)
    expect(payload.linkValidationSummary.verifiedCodeEndpointCount).toBe(5)
    expect(payload.linkValidationSummary.verifiedMaintenanceEndpointCount).toBe(5)
    expect(payload.linkValidationSummary.unverifiedMaintenanceEndpointCount).toBe(0)
    expect(payload.sourceCodeSubgraphValidation.status).toBe('devview-code-subgraph-validation-passed')
    expect(payload.sourceCodeSubgraphMergePlan.status).toBe('devview-code-subgraph-merge-plan-recorded')
    expect(payload.sourceGraph.nodeCount).toBe(5)
  })

  it('blocks missing code endpoints with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())
    writeJson(
      join(workspace, 'links.json'),
      linksArtifact([link('link-missing-code', 'TASK-1', 'code.function.missing', 'touches', 'task', 'function')]),
    )

    const result = await runBlockedValidation(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((issue: { code: string }) => issue.code)).toContain(
      'CODE_SYMBOL_LINK_CODE_ENDPOINT_MISSING',
    )
    expect(existsSync(join(workspace, '.tmp/blocked-link-validation.json'))).toBe(false)
  })

  it('blocks wrong links artifact role, status, or scope with zero writes', async () => {
    const cases = [
      { override: { artifactRole: 'not-code-symbol-links' }, expected: 'CODE_SYMBOL_LINK_ROLE_INVALID' },
      { override: { status: 'not-supplied' }, expected: 'CODE_SYMBOL_LINK_STATUS_INVALID' },
      { override: { scope: 'not-source-fact-only' }, expected: 'CODE_SYMBOL_LINK_SCOPE_INVALID' },
    ]

    for (const entry of cases) {
      const workspace = createWorkspace()
      writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())
      writeJson(
        join(workspace, 'links.json'),
        linksArtifact([link('link-task-run', 'TASK-1', functionId, 'touches', 'task', 'function')], entry.override),
      )

      const result = await runBlockedValidation(workspace)
      const payload = JSON.parse(result.stderr)

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(payload.issues.map((issue: { code: string }) => issue.code)).toContain(entry.expected)
      expect(existsSync(join(workspace, '.tmp/blocked-link-validation.json'))).toBe(false)
    }
  })

  it('blocks unsupported link vocabulary with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())
    writeJson(
      join(workspace, 'links.json'),
      linksArtifact([
        link('link-bad-type', 'TASK-1', functionId, 'teleports', 'task', 'function'),
        link('link-bad-source-kind', 'SCREEN-1', functionId, 'touches', 'screen', 'function'),
        link('link-bad-target-kind', 'TASK-2', functionId, 'touches', 'task', 'screen'),
      ]),
    )

    const result = await runBlockedValidation(workspace)
    const payload = JSON.parse(result.stderr)
    const codes = payload.issues.map((issue: { code: string }) => issue.code)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(codes).toEqual(
      expect.arrayContaining([
        'CODE_SYMBOL_LINK_TYPE_UNSUPPORTED',
        'CODE_SYMBOL_LINK_SOURCE_KIND_UNSUPPORTED',
        'CODE_SYMBOL_LINK_TARGET_KIND_UNSUPPORTED',
      ]),
    )
    expect(existsSync(join(workspace, '.tmp/blocked-link-validation.json'))).toBe(false)
  })

  it('blocks target code kind mismatches with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())
    writeJson(
      join(workspace, 'links.json'),
      linksArtifact([link('link-kind-mismatch', 'TASK-1', functionId, 'touches', 'task', 'class')]),
    )

    const result = await runBlockedValidation(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((issue: { code: string }) => issue.code)).toContain('CODE_SYMBOL_LINK_CODE_KIND_MISMATCH')
    expect(existsSync(join(workspace, '.tmp/blocked-link-validation.json'))).toBe(false)
  })

  it('blocks missing maintenance endpoints when graph-source is supplied', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())
    writeJson(
      join(workspace, 'links.json'),
      linksArtifact([link('link-missing-source', 'TASK-MISSING', functionId, 'touches', 'task', 'function')]),
    )
    writeJson(join(workspace, 'graph-source.json'), graphSource(['TASK-1']))

    const result = await runDevViewCli(
      [
        'graph',
        'validate-code-symbol-links',
        '--links',
        'links.json',
        '--code-subgraph',
        'code-subgraph.json',
        '--graph-source',
        'graph-source.json',
        '--output',
        '.tmp/blocked-link-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((issue: { code: string }) => issue.code)).toContain(
      'CODE_SYMBOL_LINK_MAINTENANCE_ENDPOINT_MISSING',
    )
    expect(existsSync(join(workspace, '.tmp/blocked-link-validation.json'))).toBe(false)
  })

  it('blocks unsafe authority flags before writing outputs', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())
    writeJson(
      join(workspace, 'links.json'),
      linksArtifact([link('link-task-run', 'TASK-1', functionId, 'touches', 'task', 'function')], {
        graphSourceMutated: true,
        evidenceAccepted: true,
      }),
    )

    const result = await runBlockedValidation(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((issue: { code: string }) => issue.code)).toContain(
      'CODE_SYMBOL_LINK_UNSAFE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp/blocked-link-validation.json'))).toBe(false)
  })

  it('blocks output collisions, source overwrite, protected paths, and source-authority-shaped outputs', async () => {
    const cases = [
      {
        output: '.tmp/same.json',
        markdown: '.tmp/same.json',
        expected: 'must be different',
      },
      {
        output: 'links.json',
        expected: 'would overwrite a source input',
      },
      {
        output: join('.devview', 'generated', 'links-validation.json'),
        expected: 'inside a protected control path',
      },
      {
        output: '.tmp/graph-source-links-validation.json',
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
      writeJson(
        join(workspace, 'links.json'),
        linksArtifact([link('link-task-run', 'TASK-1', functionId, 'touches', 'task', 'function')]),
      )
      if (entry.existing) {
        writeJson(join(workspace, entry.output), entry.existing)
      }

      const result = await runDevViewCli(
        [
          'graph',
          'validate-code-symbol-links',
          '--links',
          'links.json',
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
      expect(existsSync(join(workspace, entry.output))).toBe(Boolean(entry.existing || entry.output === 'links.json'))
    }
  })
})

const fileId = 'code.file.src.todo.ts'
const classId = 'code.class.src.todo.ts.TodoService'
const methodId = 'code.method.src.todo.ts.TodoService.addTodo'
const functionId = 'code.function.src.todo.ts.normalizeTodo'

async function runBlockedValidation(workspace: string) {
  return await runDevViewCli(
    [
      'graph',
      'validate-code-symbol-links',
      '--links',
      'links.json',
      '--code-subgraph',
      'code-subgraph.json',
      '--output',
      '.tmp/blocked-link-validation.json',
      '--markdown',
      '.tmp/blocked-link-validation.md',
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function linksArtifact(
  links: Record<string, unknown>[],
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-code-symbol-links',
    status: 'devview-code-symbol-links-supplied',
    scope: 'code-symbol-link-source-fact-only',
    links,
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

function link(
  id: string,
  sourceNodeId: string,
  targetCodeNodeId: string,
  linkType: string,
  sourceNodeKind: string,
  targetCodeNodeKind: string,
): Record<string, unknown> {
  return {
    id,
    sourceNodeId,
    targetCodeNodeId,
    linkType,
    sourceNodeKind,
    targetCodeNodeKind,
    sourceLocationStatus: 'link-fixture',
    confidence: 'inferred',
  }
}

function graphSource(nodeIds: string[]): Record<string, unknown> {
  return {
    artifactRole: 'devview-maintainability-graph-source-fixture',
    status: 'fixture-current',
    sourceRecords: {
      nodes: nodeIds.map((id) => ({ id, kind: id.split('-')[0].toLowerCase() })),
      edges: [],
    },
    graphSourceMutated: false,
    graphDeltaApplied: false,
  }
}

function codeSubgraph(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-code-subgraph',
    status: 'devview-code-subgraph-supplied',
    scope: 'code-subgraph-source-fact-only',
    nodes: [
      codeNode(fileId, 'file', 'src/todo.ts', 'file-node'),
      codeNode(classId, 'class', 'src/todo.ts', undefined, { startLine: 1, startColumn: 1, endLine: 8, endColumn: 2 }),
      codeNode(methodId, 'method', 'src/todo.ts', undefined, {
        startLine: 2,
        startColumn: 3,
        endLine: 5,
        endColumn: 4,
      }),
      codeNode(functionId, 'function', 'src/todo.ts', undefined, {
        startLine: 10,
        startColumn: 1,
        endLine: 12,
        endColumn: 2,
      }),
    ],
    edges: [
      codeEdge('code-edge.file-class', fileId, classId, 'contains'),
      codeEdge('code-edge.class-method', classId, methodId, 'contains'),
      codeEdge('code-edge.file-function', fileId, functionId, 'contains'),
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

function codeEdge(id: string, from: string, to: string, kind: string): Record<string, unknown> {
  return {
    id,
    from,
    to,
    kind,
    sourceFile: 'src/todo.ts',
    sourceLocationStatus: 'fixture-edge',
    sourceDigest: 'sha256:fixture',
    confidence: 'extracted',
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
