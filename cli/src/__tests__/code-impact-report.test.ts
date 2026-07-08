import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

const fileId = 'code.file.src.app.ts'
const classId = 'code.class.src.app.ts.Service'
const callerId = 'code.function.src.app.ts.caller'
const calleeId = 'code.function.src.app.ts.callee'
const referrerId = 'code.function.src.app.ts.referrer'
const testId = 'code.function.test.app.test.ts.calleeTest'
const externalDependencyId = 'code.external_dependency.npm.left-pad'

afterEach(() => {
  cleanupWorkspaces()
})

describe('graph report-code-impact CLI', () => {
  it('reports callers and callees from calls edges', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())

    const incoming = await runReport(workspace, ['--changed-symbol', calleeId], '.tmp/impact-callee.json')
    const incomingPayload = JSON.parse(incoming.stdout)
    const outgoing = await runReport(workspace, ['--changed-symbol', callerId], '.tmp/impact-caller.json')
    const outgoingPayload = JSON.parse(outgoing.stdout)

    expect(incoming.exitCode).toBe(ExitCode.Success)
    expect(incomingPayload.artifactRole).toBe('devview-code-impact-report')
    expect(incomingPayload.status).toBe('devview-code-impact-reported')
    expect(incomingPayload.scope).toBe('code-impact-analysis-report-only')
    expect(incomingPayload.seedSymbols.map((node: { nodeId: string }) => node.nodeId)).toEqual([calleeId])
    expect(incomingPayload.callerCalleeSummary.callers).toEqual([callerId])
    expect(incomingPayload.impactedCodeNodes).toContainEqual(
      expect.objectContaining({
        nodeId: callerId,
        impactReasons: expect.arrayContaining([expect.objectContaining({ relationship: 'caller' })]),
      }),
    )
    expect(incomingPayload.unifiedGraphBoundary.graphSourceMutated).toBe(false)
    expect(incomingPayload.unifiedGraphBoundary.graphDeltaApplied).toBe(false)
    expectSafetyFalse(incomingPayload)

    expect(outgoing.exitCode).toBe(ExitCode.Success)
    expect(outgoingPayload.callerCalleeSummary.callees).toEqual([calleeId])
    expect(outgoingPayload.impactedCodeNodes).toContainEqual(
      expect.objectContaining({
        nodeId: calleeId,
        impactReasons: expect.arrayContaining([expect.objectContaining({ relationship: 'callee' })]),
      }),
    )
  })

  it('summarizes imports and reverse import dependents', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())

    const dependencySeed = await runReport(
      workspace,
      ['--changed-symbol', externalDependencyId],
      '.tmp/impact-dependency.json',
    )
    const dependencyPayload = JSON.parse(dependencySeed.stdout)
    const fileSeed = await runReport(workspace, ['--changed-symbol', fileId], '.tmp/impact-file.json')
    const filePayload = JSON.parse(fileSeed.stdout)

    expect(dependencySeed.exitCode).toBe(ExitCode.Success)
    expect(dependencyPayload.importDependencySummary.importDependents).toEqual([fileId])
    expect(dependencyPayload.impactedCodeNodes).toContainEqual(
      expect.objectContaining({
        nodeId: fileId,
        impactReasons: expect.arrayContaining([expect.objectContaining({ relationship: 'import_dependent' })]),
      }),
    )

    expect(fileSeed.exitCode).toBe(ExitCode.Success)
    expect(filePayload.importDependencySummary.importedDependencies).toEqual([externalDependencyId])
  })

  it('includes bounded parent container context for impacted symbols', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())

    const result = await runReport(workspace, ['--changed-symbol', calleeId], '.tmp/impact-container.json')
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.impactedCodeNodes).toContainEqual(
      expect.objectContaining({
        nodeId: fileId,
        impactReasons: expect.arrayContaining([expect.objectContaining({ relationship: 'container_context' })]),
      }),
    )
    expect(payload.impactedCodeNodes).toContainEqual(
      expect.objectContaining({
        nodeId: classId,
        impactReasons: expect.arrayContaining([expect.objectContaining({ relationship: 'container_context' })]),
      }),
    )
  })

  it('reports test coverage and maintenance impacts from optional symbol link validation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())
    writeJson(join(workspace, 'code-symbol-links-validation.json'), codeSymbolLinksValidation())

    const result = await runReport(
      workspace,
      [
        '--changed-symbol',
        calleeId,
        '--code-symbol-links-validation',
        'code-symbol-links-validation.json',
        '--markdown',
        '.tmp/impact.md',
      ],
      '.tmp/impact-with-links.json',
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/impact-with-links.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.sourceCodeSymbolLinksValidation.status).toBe('devview-code-symbol-link-validation-passed')
    expect(payload.testCoverageImpactSummary.impactedTestNodes).toEqual(
      expect.arrayContaining(['CHECK-1', 'EVIDENCE-1', testId]),
    )
    expect(payload.testCoverageImpactSummary.maintenanceTestImpactCount).toBe(2)
    expect(payload.maintenanceImpactSummary.affectedMaintenanceNodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceNodeId: 'CHECK-1', linkType: 'covers', targetCodeNodeId: calleeId }),
        expect.objectContaining({ sourceNodeId: 'EVIDENCE-1', linkType: 'verifies', targetCodeNodeId: calleeId }),
        expect.objectContaining({
          sourceNodeId: 'REQ-1',
          linkType: 'implements_requirement',
          targetCodeNodeId: calleeId,
        }),
      ]),
    )
    expect(written.writtenMarkdownPath).toBe('.tmp/impact.md')
    expect(existsSync(join(workspace, '.tmp/impact.md'))).toBe(true)
  })

  it('blocks unknown seed symbols with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph())

    const result = await runReport(workspace, ['--changed-symbol', 'code.function.missing'], '.tmp/missing-impact.json')
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((issue: { code: string }) => issue.code)).toContain('CODE_IMPACT_SEED_SYMBOL_MISSING')
    expect(existsSync(join(workspace, '.tmp/missing-impact.json'))).toBe(false)
  })

  it('blocks wrong source roles or statuses with zero writes', async () => {
    const cases = [
      {
        codeSubgraphOverride: { artifactRole: 'not-code-subgraph' },
        expected: 'CODE_IMPACT_CODE_SUBGRAPH_ROLE_INVALID',
      },
      {
        codeSubgraphOverride: { status: 'not-supplied' },
        expected: 'CODE_IMPACT_CODE_SUBGRAPH_STATUS_INVALID',
      },
      {
        linksValidationOverride: { status: 'devview-code-symbol-link-validation-blocked' },
        expected: 'CODE_IMPACT_LINK_VALIDATION_STATUS_INVALID',
      },
    ]

    for (const entry of cases) {
      const workspace = createWorkspace()
      writeJson(join(workspace, 'code-subgraph.json'), codeSubgraph(entry.codeSubgraphOverride))
      writeJson(
        join(workspace, 'code-symbol-links-validation.json'),
        codeSymbolLinksValidation(entry.linksValidationOverride),
      )

      const result = await runReport(
        workspace,
        ['--changed-symbol', calleeId, '--code-symbol-links-validation', 'code-symbol-links-validation.json'],
        '.tmp/wrong-source-impact.json',
      )
      const payload = JSON.parse(result.stderr)

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(payload.issues.map((issue: { code: string }) => issue.code)).toContain(entry.expected)
      expect(existsSync(join(workspace, '.tmp/wrong-source-impact.json'))).toBe(false)
    }
  })

  it('blocks unsafe authority flags before writing outputs', async () => {
    const workspace = createWorkspace()
    writeJson(
      join(workspace, 'code-subgraph.json'),
      codeSubgraph({
        graphSourceMutated: true,
        providerInvoked: true,
      }),
    )

    const result = await runReport(workspace, ['--changed-symbol', calleeId], '.tmp/unsafe-impact.json')
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((issue: { code: string }) => issue.code)).toContain('CODE_IMPACT_UNSAFE_AUTHORITY_FLAG')
    expect(existsSync(join(workspace, '.tmp/unsafe-impact.json'))).toBe(false)
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
        output: join('.devview', 'generated', 'impact.json'),
        expected: 'inside a protected control path',
      },
      {
        output: '.tmp/graph-source-impact.json',
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

      const result = await runReport(
        workspace,
        ['--changed-symbol', calleeId, ...(entry.markdown ? ['--markdown', entry.markdown] : [])],
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

async function runReport(workspace: string, extraArgs: string[], output: string) {
  return await runDevViewCli(
    [
      'graph',
      'report-code-impact',
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
      codeNode(fileId, 'file', 'src/app.ts', 'file-node'),
      codeNode(classId, 'class', 'src/app.ts', undefined, {
        startLine: 1,
        startColumn: 1,
        endLine: 5,
        endColumn: 2,
      }),
      codeNode(callerId, 'function', 'src/app.ts', undefined, {
        startLine: 2,
        startColumn: 3,
        endLine: 3,
        endColumn: 4,
      }),
      codeNode(calleeId, 'function', 'src/app.ts', undefined, {
        startLine: 8,
        startColumn: 1,
        endLine: 10,
        endColumn: 2,
      }),
      codeNode(referrerId, 'function', 'src/app.ts', undefined, {
        startLine: 12,
        startColumn: 1,
        endLine: 14,
        endColumn: 2,
      }),
      codeNode(testId, 'function', 'test/app.test.ts', undefined, {
        startLine: 1,
        startColumn: 1,
        endLine: 4,
        endColumn: 2,
      }),
      codeNode(externalDependencyId, 'external_dependency', 'package.json', 'external-package'),
    ],
    edges: [
      codeEdge('edge.file-class', fileId, classId, 'contains'),
      codeEdge('edge.class-caller', classId, callerId, 'contains'),
      codeEdge('edge.file-callee', fileId, calleeId, 'contains'),
      codeEdge('edge.caller-callee', callerId, calleeId, 'calls'),
      codeEdge('edge.referrer-callee', referrerId, calleeId, 'references'),
      codeEdge('edge.file-external', fileId, externalDependencyId, 'imports'),
      codeEdge('edge.test-covers-callee', testId, calleeId, 'covers'),
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
    sourceFile: 'src/app.ts',
    sourceLocationStatus: 'fixture-edge',
    sourceDigest: 'sha256:fixture',
    confidence: 'extracted',
  }
}

function codeSymbolLinksValidation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-code-symbol-link-validation-report',
    status: 'devview-code-symbol-link-validation-passed',
    scope: 'code-symbol-link-validation-report-only',
    validatedLinks: [
      validatedLink('link-check-callee', 'CHECK-1', 'check', calleeId, 'function', 'covers'),
      validatedLink('link-evidence-callee', 'EVIDENCE-1', 'evidence', calleeId, 'function', 'verifies'),
      validatedLink('link-requirement-callee', 'REQ-1', 'requirement', calleeId, 'function', 'implements_requirement'),
      validatedLink('link-change-caller', 'CHANGE-1', 'change', callerId, 'function', 'modifies'),
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

function validatedLink(
  id: string,
  sourceNodeId: string,
  sourceNodeKind: string,
  targetCodeNodeId: string,
  targetCodeNodeKind: string,
  linkType: string,
): Record<string, unknown> {
  return {
    id,
    sourceNodeId,
    sourceNodeKind,
    targetCodeNodeId,
    targetCodeNodeKind,
    linkType,
    sourceLocationStatus: 'fixture-link',
    confidence: 'inferred',
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
