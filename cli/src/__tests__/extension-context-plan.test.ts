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

describe('Extension context planning report', () => {
  it('connects compiled catalog hints to optional View Tree and Context Pack sources without authority', async () => {
    const workspace = createWorkspace()
    writePlanSources(workspace)

    const result = await runDevViewCli(
      [
        ...planArgs(),
        '--view-tree',
        join('generated', 'view-tree.json'),
        '--context-pack',
        join('generated', 'context-pack.json'),
        '--markdown',
        join('.tmp', 'context-plan.md'),
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp', 'context-plan.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-extension-context-plan')
    expect(payload.status).toBe('devview-extension-context-plan-generated')
    expect(payload.extensionContextPlanStatus).toBe('generated-report-only-hints')
    expect(payload.planningScope).toBe('extension-context-planning-report-only')
    expect(payload.sourceExtensionProfileCatalog).toBe('generated/extension-profile-catalog.json')
    expect(payload.sourceViewTree).toBe('generated/view-tree.json')
    expect(payload.sourceContextPack).toBe('generated/context-pack.json')
    expect(payload.viewTreeHintPlan).toEqual(
      expect.objectContaining({
        applicableViewTreeExtractorExtensions: ['fixture-view-tree-extractor'],
        analyzerExtensions: ['fixture-analyzer', 'fixture-graphify-protocol'],
        graphIngestionCandidates: ['fixture-graphify-protocol'],
        canInformViewTree: true,
        selectedNodeCount: 2,
        selectedEdgeCount: 1,
        alignmentStatus: 'view-tree-extension-hints-available-for-source-view-tree',
        authorityStatus: 'hint-only-not-traversal-authority',
      }),
    )
    expect(payload.contextPackHintPlan).toEqual(
      expect.objectContaining({
        contextPackExtensions: ['fixture-context-pack'],
        analyzerExtensionCount: 2,
        contextPackExtensionCount: 1,
        canInformContextPack: true,
        boundedSubgraphNodeCount: 2,
        allowedContextCount: 2,
        forbiddenContextCount: 1,
        requiredEvidenceCount: 1,
        alignmentStatus: 'context-pack-extension-hints-available-for-source-context-pack',
        authorityStatus: 'hint-only-not-context-pack-authority',
      }),
    )
    expect(payload.evidencePolicyHintPlan).toEqual(
      expect.objectContaining({
        evidenceAdapters: ['fixture-evidence-adapter'],
        policyExtensions: ['fixture-policy-extension'],
        canInformEvidenceAdapterValidation: true,
        canInformPolicyValidation: true,
        canSatisfyEvidence: false,
        canProveEquivalence: false,
        canEnforceScope: false,
      }),
    )
    expect(payload.nativeRetrofitPlanning).toEqual(
      expect.objectContaining({
        mode: 'hybrid',
        hintStatus: 'profile-mode-declared',
      }),
    )
    expect(payload.graphIngestionPlanning).toEqual(
      expect.objectContaining({
        candidateCount: 1,
        graphifyCandidateCount: 1,
        providerInvoked: false,
        networkCallMade: false,
        shellCommandsExecuted: false,
        executionAllowed: false,
        authorityStatus: 'protocol-only-not-graph-ingestion-authority',
      }),
    )
    expect(payload.graphIngestionPlanning.candidates[0]).toEqual(
      expect.objectContaining({
        extensionId: 'fixture-graphify-protocol',
        graphProviderKind: 'graphify',
        protocolStatus: 'protocol-only-not-executed',
        executionAllowed: false,
        providerInvoked: false,
        networkCallMade: false,
      }),
    )
    expect(payload.downstreamActionPlan.map((entry: { actionId: string }) => entry.actionId)).toEqual(
      expect.arrayContaining([
        'connect-view-tree-hints',
        'connect-context-pack-hints',
        'plan-graph-ingestion-protocol',
      ]),
    )
    expectSafetyFalse(payload)
    expect(written.writtenOutputPath).toBe('.tmp/context-plan.json')
    expect(existsSync(join(workspace, '.tmp', 'context-plan.md'))).toBe(true)
  })

  it('allows omitted View Tree and Context Pack sources while keeping hint-only planning', async () => {
    const workspace = createWorkspace()
    writePlanSources(workspace)

    const result = await runDevViewCli([...planArgs(), '--json'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.viewTreeHintPlan.alignmentStatus).toBe('view-tree-source-not-provided')
    expect(payload.contextPackHintPlan.alignmentStatus).toBe('context-pack-source-not-provided')
    expect(payload.traversalAuthorityGranted).toBe(false)
    expect(payload.viewTreeMutated).toBe(false)
    expect(payload.contextPackMutated).toBe(false)
  })

  it('blocks wrong catalog role/status before writing outputs', async () => {
    const workspace = createWorkspace()
    writePlanSources(workspace)
    writeJson(join(workspace, 'generated', 'extension-profile-catalog.json'), {
      ...extensionProfileCatalog(),
      artifactRole: 'devview-extension-readiness-report',
      status: 'devview-extension-readiness-ready',
    })

    const result = await runDevViewCli([...planArgs(), '--json'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.status).toBe('devview-extension-context-plan-blocked')
    expect(payload.extensionContextPlanStatus).toBe('blocked-extension-profile-catalog-invalid')
    expect(payload.findings.map((entry: { code: string }) => entry.code)).toContain(
      'EXTENSION_CONTEXT_PLAN_CATALOG_ROLE_STATUS_INVALID',
    )
    expect(existsSync(join(workspace, '.tmp', 'context-plan.json'))).toBe(false)
  })

  it('blocks catalog execution/provider/network/shell authority flags before writing outputs', async () => {
    const workspace = createWorkspace()
    writePlanSources(workspace)
    const unsafe = extensionProfileCatalog()
    ;(unsafe.extensionCatalogEntries as Array<Record<string, unknown>>)[0].executionAllowed = true
    unsafe.providerInvoked = true
    unsafe.networkCallMade = true
    unsafe.shellCommandsExecuted = true
    writeJson(join(workspace, 'generated', 'extension-profile-catalog.json'), unsafe)

    const result = await runDevViewCli([...planArgs(), '--json'], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.extensionContextPlanStatus).toBe('blocked-unsafe-authority-flag')
    expect(payload.findings.map((entry: { code: string }) => entry.code)).toContain(
      'EXTENSION_CONTEXT_PLAN_UNSAFE_AUTHORITY_FLAG',
    )
    expect(existsSync(join(workspace, '.tmp', 'context-plan.json'))).toBe(false)
  })

  it('blocks invalid optional View Tree and Context Pack sources before writing outputs', async () => {
    const workspace = createWorkspace()
    writePlanSources(workspace)
    writeJson(join(workspace, 'generated', 'view-tree.json'), { artifactRole: 'wrong-role', status: 'wrong-status' })
    writeJson(join(workspace, 'generated', 'context-pack.json'), { artifactRole: 'wrong-role', status: 'wrong-status' })

    const result = await runDevViewCli(
      [
        ...planArgs(),
        '--view-tree',
        join('generated', 'view-tree.json'),
        '--context-pack',
        join('generated', 'context-pack.json'),
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.extensionContextPlanStatus).toBe('blocked-view-tree-invalid')
    expect(payload.findings.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining([
        'EXTENSION_CONTEXT_PLAN_VIEW_TREE_ROLE_STATUS_INVALID',
        'EXTENSION_CONTEXT_PLAN_CONTEXT_PACK_ROLE_STATUS_INVALID',
      ]),
    )
    expect(existsSync(join(workspace, '.tmp', 'context-plan.json'))).toBe(false)
  })

  it('blocks source overwrite, protected outputs, and output collisions with zero writes', async () => {
    const cases = [
      {
        output: join('generated', 'extension-profile-catalog.json'),
        expected: 'would overwrite the source Extension Profile Catalog',
      },
      { output: join('.devview', 'generated', 'context-plan.json'), expected: 'inside a protected control path' },
      {
        output: join('.tmp', 'context-plan.json'),
        markdown: join('.tmp', 'context-plan.json'),
        expected: 'must be different',
      },
    ]

    for (const entry of cases) {
      const workspace = createWorkspace()
      writePlanSources(workspace)
      const result = await runDevViewCli(
        [...planArgs(entry.output), ...(entry.markdown ? ['--markdown', entry.markdown] : []), '--json'],
        { cwd: workspace, pluginRoot },
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(result.stderr).toContain(entry.expected)
    }
  })
})

function planArgs(output = join('.tmp', 'context-plan.json')): string[] {
  return [
    'extensions',
    'plan-context',
    '--extension-profile-catalog',
    join('generated', 'extension-profile-catalog.json'),
    '--output',
    output,
  ]
}

function writePlanSources(workspace: string): void {
  writeJson(join(workspace, 'generated', 'extension-profile-catalog.json'), extensionProfileCatalog())
  writeJson(join(workspace, 'generated', 'view-tree.json'), viewTreeSource())
  writeJson(join(workspace, 'generated', 'context-pack.json'), contextPackSource())
}

function extensionProfileCatalog(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-extension-profile-catalog',
    status: 'devview-extension-profile-catalog-compiled',
    catalogScope: 'project-specific-extension-catalog-report-only',
    extensionCatalogStatus: 'compiled-declarative-capabilities-only',
    catalogEntryCount: 6,
    extensionCatalogEntries: [
      catalogEntry('fixture-analyzer', 'analyzer', ['analyzer-extension']),
      catalogEntry('fixture-view-tree-extractor', 'view-tree-extractor', ['view-tree-extractor-extension']),
      catalogEntry('fixture-context-pack', 'context-pack', ['context-pack-extension']),
      catalogEntry('fixture-evidence-adapter', 'evidence-adapter', ['evidence-adapter']),
      catalogEntry('fixture-policy-extension', 'policy', ['policy-extension']),
      catalogEntry('fixture-graphify-protocol', 'analyzer', ['analyzer-extension', 'graphify-protocol']),
    ],
    capabilityCatalog: {
      analyzerExtensions: ['fixture-analyzer', 'fixture-graphify-protocol'],
      viewTreeExtractorExtensions: ['fixture-view-tree-extractor'],
      contextPackExtensions: ['fixture-context-pack'],
      evidenceAdapters: ['fixture-evidence-adapter'],
      policyExtensions: ['fixture-policy-extension'],
      skillWorkflowExtensions: [],
      graphIngestionCandidates: ['fixture-graphify-protocol'],
    },
    graphIngestionCandidates: [
      {
        extensionId: 'fixture-graphify-protocol',
        sourceManifest: '.devview/extensions/graphify.manifest.json',
        protocolStatus: 'protocol-only-not-executed',
        graphProviderKind: 'graphify',
        executionAllowed: false,
        providerInvoked: false,
        networkCallMade: false,
        shellCommandsExecuted: false,
      },
    ],
    nativeRetrofitProfileHints: {
      mode: 'hybrid',
      hintStatus: 'profile-mode-declared',
      nativeSignals: ['native'],
      retrofitSignals: ['retrofit'],
      sourceFields: ['devviewMode'],
      futureFieldCandidates: ['nativeBoundaries', 'retrofitBoundaries'],
    },
    downstreamCompatibility: {
      canInformViewTree: true,
      canInformContextPack: true,
      canInformEvidenceAdapterValidation: true,
      canInformPolicyValidation: true,
      canInformGraphIngestionPlanning: true,
      canExecuteExtensionCode: false,
      canSatisfyEvidence: false,
      canProveEquivalence: false,
      canEnforceScope: false,
    },
    findings: [],
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
    shellCommandsExecuted: false,
    filesMutated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    hooksActivated: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    nonEnforcing: true,
  }
}

function catalogEntry(extensionId: string, extensionKind: string, capabilities: string[]): Record<string, unknown> {
  return {
    extensionId,
    displayName: extensionId,
    extensionKind,
    capabilities,
    permissions: ['read-project-profile', 'write-report-output'],
    sourceManifest: `.devview/extensions/${extensionId}.manifest.json`,
    executionModel: 'declarative-manifest-only',
    executionAllowed: false,
    providerInvoked: false,
    networkCallMade: false,
    shellCommandsExecuted: false,
    lifecycleConnections: {
      analyzer: capabilities.includes('analyzer-extension'),
      viewTree: capabilities.includes('view-tree-extractor-extension'),
      contextPack: capabilities.includes('context-pack-extension'),
      evidence: capabilities.includes('evidence-adapter'),
      policy: capabilities.includes('policy-extension'),
      scope: capabilities.includes('policy-extension'),
      workflow: false,
      graphIngestion: capabilities.includes('graphify-protocol'),
    },
    authorityStatus: 'source-fact-only-not-traversal-authority',
  }
}

function viewTreeSource(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'selected-graph-slice',
    status: 'selected-graph-slice-generated',
    viewTreeArtifactRole: 'devview-view-tree-preview',
    viewTreeStatus: 'devview-view-tree-preview-generated',
    viewTreeId: 'fixture-view-tree',
    selectedNodes: [{ nodeId: 'N1' }, { nodeId: 'N2' }],
    selectedEdges: [{ edgeId: 'E1' }],
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function contextPackSource(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'contract-compiler-input',
    status: 'contract-compiler-input-generated',
    boundedSubgraph: { nodeIds: ['N1', 'N2'] },
    allowedFiles: ['src/todo.ts', 'test/todo.test.ts'],
    forbiddenFiles: ['src/payment.ts'],
    requiredEvidence: [{ id: 'EV1' }],
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function expectSafetyFalse(payload: Record<string, unknown>): void {
  for (const field of [
    'extensionExecutionAllowed',
    'extensionsExecuted',
    'providerInvoked',
    'networkCallMade',
    'shellCommandsExecuted',
    'filesMutated',
    'graphSourceMutated',
    'graphDeltaApplied',
    'runtimeEvidenceSatisfied',
    'evidenceAccepted',
    'equivalenceProven',
    'scopeEnforced',
    'ciEnforcementEnabled',
    'hooksActivated',
    'branchProtectionChanged',
    'branchProtectionMutated',
    'requiredChecksConfigured',
    'requiredChecksMutated',
    'externalCiMutated',
    'diffRejectionEnabled',
    'diffRejectionActivated',
    'approvalAutomationEnabled',
    'userAcceptanceAutomated',
    'traversalAuthorityGranted',
    'contextPackMutated',
    'viewTreeMutated',
  ]) {
    expect(payload[field], field).toBe(false)
  }
}
