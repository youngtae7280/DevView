import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runPbeCli } from '../app'
import { buildGraphExecutionContractReport } from '../core/graph-execution-contract'
import {
  buildReadModelRegistryCommandPlans,
  compareReadModelEvidence,
  generateReadModelEvidence,
  getSliceReadModelProfile,
  loadGraphSourceArtifact,
  loadGraphSourceProjectionArtifact,
  loadReadModelSliceRegistry,
  loadStructureOnlyGraphSourceCandidateArtifact,
  loadStructureOnlyGraphSourceCandidateProjectionArtifact,
  normalizeReadModelSliceRegistry,
  normalizeGraphSourceArtifact,
  normalizeGraphSourceProjectionArtifact,
  normalizeStructureOnlyGraphSourceCandidateArtifact,
  normalizeStructureOnlyGraphSourceCandidateProjectionArtifact,
  projectGraphSourceReadModel,
  projectStructureOnlyGraphSourceCandidateReadModel,
  reportGraphSourceHealth,
  summarizeReadModelEvidence,
  todoAppPbeRunStructureOnlyProfile,
  todoSearchReadModelProfile,
  validateAllReadModelEvidence,
  validateReadModelEvidence,
} from '../core/read-model-evidence'
import {
  reportCompilerBoundary,
  validateContractSchema,
  validateExecutionContract,
  validateTaskRegistry,
} from '../core/compiler-boundary'
import {
  reportCompilerInputModel,
  validateCompilerInputDryRun,
  validateCompilerInputSchema,
} from '../core/compiler-input-model'
import { compileExecutionContractDryRun } from '../core/contract-compiler-dry-run'

const workspaces: string[] = []
const exampleWorkspacePaths = [
  'examples/adoption/todo-search-slice',
  'examples/adoption/compatibility-mismatch-slice',
  'examples/valid/todo-app-pbe-run',
  'examples/read-model-aggregate',
  'docs/concept',
  '.github/workflows/read-model-evidence.yml',
]
const allowedTags = new Set(['target', 'context', 'candidate', 'guard', 'required', 'stale', 'blocked', 'output'])
const coreViews = [
  'Intent View',
  'Behavior View',
  'Structure View',
  'Scope / Execution View',
  'Impact View',
  'Verification View',
  'Evidence / Acceptance View',
]

describe('read-model Evidence builder', () => {
  it('uses the Todo Search read-model profile for the bounded selected slice', () => {
    const profile = getSliceReadModelProfile('examples/adoption/todo-search-slice')

    expect(profile).toBe(todoSearchReadModelProfile)
    expect(profile.profileId).toBe('todo-search-selected-slice')
    expect(profile.expectedCounts).toEqual({ nodes: 40, edges: 59, validationChecks: 20 })
    expect(profile.artifacts.nodeExecutionContract).toBe('node-execution-contracts/wt-search-001.md')
    expect(profile.artifacts.compatibilitySlice).toBe('examples/adoption/compatibility-mismatch-slice')
  })

  it('uses the Todo App PBE run structure-only profile for the canonical fixture slice', () => {
    const profile = getSliceReadModelProfile('examples/valid/todo-app-pbe-run')

    expect(profile).toBe(todoAppPbeRunStructureOnlyProfile)
    expect(profile.profileId).toBe('todo-app-pbe-run-structure-only')
    expect(profile.policyLevel).toBe('structure-only')
    expect(profile.sourceLayout).toBe('canonical-pbe')
    expect(profile.expectedCounts).toEqual({ nodes: 22, edges: 38, validationChecks: 16 })
  })

  it('parses the limited Todo Search graph source artifact without promoting other scopes', async () => {
    const graphSource = await loadGraphSourceArtifact(resolve('.'))

    expect(graphSource.schemaVersion).toBe(1)
    expect(graphSource.artifactRole).toBe('limited-graph-source')
    expect(graphSource.status).toBe('limited-source-active')
    expect(graphSource.promotionScope).toBe('todo-search-selected-slice')
    expect(graphSource.sourceSlice).toBe(todoSearchReadModelProfile.supportedSlice)
    expect(graphSource.sourceProfile).toBe(todoSearchReadModelProfile.profileId)
    expect(graphSource.sourceAuthorityBoundary).toContain('Todo Search selected-slice')
    expect(graphSource.sourceAuthorityBoundary).toContain('repository-wide source authority remains unchanged')
    expect(graphSource.projectionBoundary).toContain('do not replace user acceptance')
    expect(graphSource.sourceRecords.nodes).toHaveLength(todoSearchReadModelProfile.expectedCounts.nodes)
    expect(graphSource.sourceRecords.edges).toHaveLength(todoSearchReadModelProfile.expectedCounts.edges)
    expect(graphSource.sourceRecords.coreViewCoverage.map((entry) => entry.name)).toEqual(coreViews)
    expect(graphSource.projectionTargets.map((entry) => entry.path)).toContain(
      'examples/adoption/todo-search-slice/generated/generated-read-model.json',
    )
  })

  it('projects graph source records to the current Todo Search read-model shape', async () => {
    const graphSource = await loadGraphSourceArtifact(resolve('.'))
    const generated = JSON.parse(
      await readFile('examples/adoption/todo-search-slice/generated/generated-read-model.json', 'utf8'),
    ) as {
      nodes: unknown[]
      edges: unknown[]
      coreViewCoverage: unknown[]
    }

    const result = projectGraphSourceReadModel(graphSource)

    expect(result.graphSourcePath).toBe('examples/adoption/todo-search-slice/graph-source.json')
    expect(result.projection.nodes).toEqual(generated.nodes)
    expect(result.projection.edges).toEqual(generated.edges)
    expect(result.projection.coreViewCoverage).toEqual(generated.coreViewCoverage)
    expect(result.projection.metadata.artifactRole).toBe('graph_source_read_model_projection')
    expect(result.projection.fallbackReferences).toContain('examples/adoption/todo-search-slice/product-tree.json')
    expect(result.projection.userAcceptanceBoundary).toContain('cannot accept product results')
    expect(result.projection.sourceAuthorityBoundary).toContain('limited source model')
    expect(result.projection.nonPromotionStatement).toContain('repo-wide promotion')
  })

  it('parses the Todo App structure-only graph source candidate without promoting it', async () => {
    const candidate = await loadStructureOnlyGraphSourceCandidateArtifact(resolve('.'))
    const generated = JSON.parse(
      await readFile('examples/valid/todo-app-pbe-run/generated/generated-read-model.json', 'utf8'),
    ) as {
      nodes: unknown[]
      edges: unknown[]
      coreViewCoverage: unknown[]
    }
    const registry = await loadReadModelSliceRegistry(resolve('.'))

    expect(candidate.schemaVersion).toBe(1)
    expect(candidate.artifactRole).toBe('structure-only-graph-source')
    expect(candidate.status).toBe('confirmed-graph-source-backed')
    expect(candidate.graphSourceScope).toBe(todoAppPbeRunStructureOnlyProfile.profileId)
    expect(candidate.sourceSlice).toBe(todoAppPbeRunStructureOnlyProfile.supportedSlice)
    expect(candidate.sourceProfile).toBe(todoAppPbeRunStructureOnlyProfile.profileId)
    expect(candidate.policyLevel).toBe('structure-only')
    expect(candidate.sourceRecords.nodes).toEqual(generated.nodes)
    expect(candidate.sourceRecords.edges).toEqual(generated.edges)
    expect(candidate.sourceRecords.coreViewCoverage).toEqual(generated.coreViewCoverage)
    expect(candidate.sourceAuthorityBoundary).toContain('structure-only')
    expect(candidate.graphSourceBoundaries.nonPromotionStatement).toContain('not promote Todo App')
    expect(candidate.graphSourceBoundaries.validateAllBoundary).toContain('positive validate-all')
    expect(candidate.graphSourceBoundaries.validateAllBoundary).toContain('structure-only')
    const registryTodoAppProfile = registry.profiles.find(
      (entry) => entry.profileId === todoAppPbeRunStructureOnlyProfile.profileId,
    )
    expect(registryTodoAppProfile?.optionalArtifacts.graphSource).toBe('graph-source.json')
  })

  it('keeps Todo App source authority beyond structure-only blocked until pilot evidence exists', async () => {
    const registry = await loadReadModelSliceRegistry(resolve('.'))
    const candidate = await loadStructureOnlyGraphSourceCandidateArtifact(resolve('.'))
    const report = JSON.parse(
      await readFile('examples/valid/todo-app-pbe-run/generated/read-model-validation-report.json', 'utf8'),
    ) as {
      metadata: {
        parityRequirement: Record<string, unknown>
        pilotMarkerRequirement: Record<string, unknown>
        runtimeFixtureRequirement: Record<string, unknown>
      }
      sourceAuthorityBoundary: string
      nonPromotionStatement: string
    }
    const transitionStatus = JSON.parse(
      await readFile('examples/read-model-aggregate/graph-source-transition-status.json', 'utf8'),
    ) as {
      configuredSlices: Array<{
        profileId: string
        sourceRole: string
        retirementReadiness?: { criteriaStatus?: Record<string, unknown> }
      }>
      retirementApprovalPackages: Array<{ scope: string; status: string }>
    }
    const registryTodoAppProfile = registry.profiles.find(
      (entry) => entry.profileId === todoAppPbeRunStructureOnlyProfile.profileId,
    )
    const transitionTodoApp = transitionStatus.configuredSlices.find(
      (entry) => entry.profileId === todoAppPbeRunStructureOnlyProfile.profileId,
    )
    const retirementTodoApp = transitionStatus.retirementApprovalPackages.find(
      (entry) => entry.scope === 'todo-app-pbe-run-structure-only',
    )

    expect(registryTodoAppProfile).toMatchObject({
      policyLevel: 'structure-only',
      requiredCommands: ['generate', 'validate'],
      parityRequirement: { required: false, expectedStatus: 'not-required' },
      pilotMarkerRequirement: { required: false, expectedStatus: 'not-required' },
    })
    expect(registryTodoAppProfile?.requiredCommands).not.toContain('compare')
    expect(registryTodoAppProfile?.requiredArtifacts).not.toHaveProperty('parityReport')
    expect(registryTodoAppProfile?.requiredArtifacts).not.toHaveProperty('scopedPilotMarker')
    expect(candidate.sourceAuthorityBoundary).toContain('structure-only')
    expect(candidate.graphSourceBoundaries.nonPromotionStatement).toContain('not promote Todo App')
    expect(report.metadata.parityRequirement).toMatchObject({ required: false, status: 'not-required' })
    expect(report.metadata.pilotMarkerRequirement).toMatchObject({ required: false, status: 'not-required' })
    expect(report.metadata.runtimeFixtureRequirement).toMatchObject({ required: false })
    expect(report.sourceAuthorityBoundary).toContain('structure-only')
    expect(report.nonPromotionStatement).toContain('does not promote')
    expect(transitionTodoApp).toMatchObject({
      sourceRole: 'confirmed-structure-only-graph-source',
      retirementReadiness: {
        criteriaStatus: {
          sourceAuthorityBeyondStructureOnly: 'not-approved',
        },
      },
    })
    expect(retirementTodoApp).toMatchObject({ status: 'not-ready-structure-only' })
  })

  it('rejects Todo App graph source candidates that claim promotion or validate-all consumption', async () => {
    const candidate = JSON.parse(await readFile('examples/valid/todo-app-pbe-run/graph-source.json', 'utf8')) as {
      status: string
      graphSourceBoundaries: {
        nonPromotionStatement: string
        validateAllBoundary: string
      }
    }
    candidate.status = 'limited-source-active'
    candidate.graphSourceBoundaries.nonPromotionStatement = 'This candidate promotes Todo App.'
    candidate.graphSourceBoundaries.validateAllBoundary = 'This candidate is source authority.'

    expect(() => normalizeStructureOnlyGraphSourceCandidateArtifact(candidate)).toThrow(
      /confirmed-graph-source-backed.*block Todo App promotion.*positive validate-all structure-only/s,
    )
  })

  it('writes a Todo App graph source candidate projection without promoting the structure-only profile', async () => {
    const workspace = await createExampleWorkspace()
    const outputPath = 'examples/valid/todo-app-pbe-run/generated/graph-source-read-model-projection.json'
    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'project',
        '--graph-source',
        'examples/valid/todo-app-pbe-run/graph-source.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot: resolve('.') },
    )

    expect(result.exitCode).toBe(0)
    const payload = JSON.parse(result.stdout) as {
      projection: string
      nodeCount: number
      edgeCount: number
      coreViewCount: number
      nonPromotionStatement: string
      userAcceptanceBoundary: string
    }
    expect(payload.projection).toBe(outputPath)
    expect(payload.nodeCount).toBe(todoAppPbeRunStructureOnlyProfile.expectedCounts.nodes)
    expect(payload.edgeCount).toBe(todoAppPbeRunStructureOnlyProfile.expectedCounts.edges)
    expect(payload.coreViewCount).toBe(coreViews.length)
    expect(payload.nonPromotionStatement).toContain('not promote Todo App')
    expect(payload.userAcceptanceBoundary).toContain('User acceptance remains user-controlled')

    const generated = JSON.parse(
      await readFile(join(workspace, 'examples/valid/todo-app-pbe-run/generated/generated-read-model.json'), 'utf8'),
    ) as { nodes: unknown[]; edges: unknown[]; coreViewCoverage: unknown[] }
    const candidate = await loadStructureOnlyGraphSourceCandidateArtifact(workspace)
    const projection = JSON.parse(await readFile(join(workspace, outputPath), 'utf8')) as {
      metadata: { artifactRole: string; policyLevel: string }
      nodes: unknown[]
      edges: unknown[]
      coreViewCoverage: unknown[]
      validateAllBoundary: string
    }
    const normalizedProjection = normalizeStructureOnlyGraphSourceCandidateProjectionArtifact(
      projection,
      candidate,
      outputPath,
    )

    expect(projection.metadata.artifactRole).toBe('structure_only_graph_source_read_model_projection')
    expect(projection.metadata.policyLevel).toBe('structure-only')
    expect(projection.nodes).toEqual(generated.nodes)
    expect(projection.edges).toEqual(generated.edges)
    expect(projection.coreViewCoverage).toEqual(generated.coreViewCoverage)
    expect(projection.validateAllBoundary).toContain('positive validate-all')
    expect(projection.validateAllBoundary).toContain('structure-only')
    expect(normalizedProjection.metadata.graphSourceScope).toBe(todoAppPbeRunStructureOnlyProfile.profileId)
  })

  it('validates the committed Todo App candidate projection contract outside validate-all semantics', async () => {
    const projection = await loadStructureOnlyGraphSourceCandidateProjectionArtifact(resolve('.'))
    const registry = await loadReadModelSliceRegistry(resolve('.'))
    const generated = JSON.parse(
      await readFile('examples/valid/todo-app-pbe-run/generated/generated-read-model.json', 'utf8'),
    ) as { nodes: unknown[]; edges: unknown[]; coreViewCoverage: unknown[] }

    expect(projection.metadata.artifactRole).toBe('structure_only_graph_source_read_model_projection')
    expect(projection.metadata.sourceArtifact).toBe('examples/valid/todo-app-pbe-run/graph-source.json')
    expect(projection.metadata.sourceSlice).toBe(todoAppPbeRunStructureOnlyProfile.supportedSlice)
    expect(projection.metadata.sourceProfile).toBe(todoAppPbeRunStructureOnlyProfile.profileId)
    expect(projection.metadata.policyLevel).toBe('structure-only')
    expect(projection.nodes).toEqual(generated.nodes)
    expect(projection.edges).toEqual(generated.edges)
    expect(projection.coreViewCoverage).toEqual(generated.coreViewCoverage)
    expect(projection.nodes).toHaveLength(todoAppPbeRunStructureOnlyProfile.expectedCounts.nodes)
    expect(projection.edges).toHaveLength(todoAppPbeRunStructureOnlyProfile.expectedCounts.edges)
    expect(projection.coreViewCoverage).toHaveLength(coreViews.length)
    expect(projection.sourceAuthorityBoundary).toContain('does not create')
    expect(projection.nonPromotionStatement).toContain('not promote Todo App')
    expect(projection.validateAllBoundary).toContain('positive validate-all')
    expect(projection.validateAllBoundary).toContain('structure-only')
    const registryTodoAppProfile = registry.profiles.find(
      (entry) => entry.profileId === todoAppPbeRunStructureOnlyProfile.profileId,
    )
    expect(registryTodoAppProfile?.optionalArtifacts.graphSourceProjection).toBe(
      'generated/graph-source-read-model-projection.json',
    )
  })

  it('rejects Todo App candidate projection artifacts with source-bearing boundary drift', async () => {
    const candidate = await loadStructureOnlyGraphSourceCandidateArtifact(resolve('.'))
    const projection = {
      ...projectStructureOnlyGraphSourceCandidateReadModel(candidate).projection,
      sourceAuthorityBoundary: 'This projection is source authority.',
      nonPromotionStatement: 'This projection promotes Todo App.',
      validateAllBoundary: 'This projection is source authority.',
    }

    expect(() => normalizeStructureOnlyGraphSourceCandidateProjectionArtifact(projection, candidate)).toThrow(
      /deny broader authority creation.*block Todo App promotion.*positive validate-all structure-only/s,
    )
  })

  it('observes Todo App candidate projection contracts outside positive validate-all semantics', async () => {
    const result = await runPbeCli(['graph', 'read-model', 'observe-candidates', '--json'], {
      cwd: resolve('.'),
      pluginRoot: resolve('.'),
    })

    expect(result.exitCode).toBe(0)
    const payload = JSON.parse(result.stdout) as {
      status: string
      observedCandidates: Array<{
        profileId: string
        status: string
        nodeCount: number
        edgeCount: number
        coreViewCount: number
        validateAllBoundary: string
      }>
      validateAllBoundary: string
    }
    expect(payload.status).toBe('candidate-observation-pass')
    expect(payload.observedCandidates).toEqual([
      expect.objectContaining({
        profileId: todoAppPbeRunStructureOnlyProfile.profileId,
        status: 'projection-contract-pass',
        nodeCount: todoAppPbeRunStructureOnlyProfile.expectedCounts.nodes,
        edgeCount: todoAppPbeRunStructureOnlyProfile.expectedCounts.edges,
        coreViewCount: coreViews.length,
        validateAllBoundary: expect.stringContaining('positive validate-all'),
      }),
    ])
    expect(payload.validateAllBoundary).toContain('separate report-only command')
    expect(payload.validateAllBoundary).toContain('positive validate-all as confirmed structure-only Evidence')
  })

  it('blocks candidate observation and positive validate-all when enrolled candidate projection drifts', async () => {
    const workspace = await createExampleWorkspace()
    const projectionPath = join(
      workspace,
      'examples/valid/todo-app-pbe-run/generated/graph-source-read-model-projection.json',
    )
    const projection = JSON.parse(await readFile(projectionPath, 'utf8')) as {
      sourceAuthorityBoundary: string
      validateAllBoundary: string
    }
    projection.sourceAuthorityBoundary = 'This projection is source authority.'
    projection.validateAllBoundary = 'This projection is source authority.'
    await writeFile(projectionPath, JSON.stringify(projection, null, 2))

    const result = await runPbeCli(['graph', 'read-model', 'observe-candidates', '--json'], {
      cwd: workspace,
      pluginRoot: resolve('.'),
    })
    const validateAllResult = await validateAllReadModelEvidence(workspace)

    expect(result.exitCode).toBe(1)
    const payload = JSON.parse(result.stderr) as {
      ok: boolean
      status: string
      observedCandidates: Array<{ status: string; error: string }>
    }
    expect(payload.ok).toBe(false)
    expect(payload.status).toBe('candidate-observation-blocked')
    expect(payload.observedCandidates[0]).toMatchObject({
      status: 'projection-contract-blocked',
      error: expect.stringContaining('deny broader authority creation'),
    })
    expect(payload.observedCandidates[0].error).toContain('positive validate-all structure-only')
    const todoApp = validateAllResult.perSliceResults.find(
      (entry) => entry.profileId === todoAppPbeRunStructureOnlyProfile.profileId,
    )
    expect(validateAllResult.status).toBe('aggregate-blocked')
    expect(validateAllResult.aggregateResult.summary.status).toBe('aggregate-pass')
    expect(todoApp?.commands.find((entry) => entry.command === 'project-contract')).toMatchObject({
      status: 'projection-contract-blocked',
      blockingCount: 1,
    })
  })

  it('writes graph source projection output through the CLI without changing default generation', async () => {
    const workspace = await createExampleWorkspace()
    const outputPath = 'examples/adoption/todo-search-slice/generated/graph-source-read-model-projection.json'
    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'project',
        '--graph-source',
        'examples/adoption/todo-search-slice/graph-source.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot: resolve('.') },
    )

    expect(result.exitCode).toBe(0)
    const payload = JSON.parse(result.stdout) as {
      projection: string
      nodeCount: number
      edgeCount: number
      coreViewCount: number
      sourceAuthorityBoundary: string
      nonPromotionStatement: string
      fallbackReferences: string[]
    }
    expect(payload.projection).toBe(outputPath)
    expect(payload.nodeCount).toBe(todoSearchReadModelProfile.expectedCounts.nodes)
    expect(payload.edgeCount).toBe(todoSearchReadModelProfile.expectedCounts.edges)
    expect(payload.coreViewCount).toBe(coreViews.length)
    expect(payload.sourceAuthorityBoundary).toContain('Todo Search selected-slice')
    expect(payload.nonPromotionStatement).toContain('repo-wide promotion')
    expect(payload.fallbackReferences).toContain('examples/adoption/todo-search-slice/product-tree.json')

    const generated = JSON.parse(
      await readFile(
        join(workspace, 'examples/adoption/todo-search-slice/generated/generated-read-model.json'),
        'utf8',
      ),
    ) as { nodes: unknown[]; edges: unknown[]; coreViewCoverage: unknown[] }
    const projection = JSON.parse(await readFile(join(workspace, outputPath), 'utf8')) as {
      metadata: { artifactRole: string }
      nodes: unknown[]
      edges: unknown[]
      coreViewCoverage: unknown[]
      fallbackReferences: string[]
      userAcceptanceBoundary: string
    }

    expect(projection.metadata.artifactRole).toBe('graph_source_read_model_projection')
    expect(projection.nodes).toEqual(generated.nodes)
    expect(projection.edges).toEqual(generated.edges)
    expect(projection.coreViewCoverage).toEqual(generated.coreViewCoverage)
    expect(projection.fallbackReferences).toContain('examples/adoption/todo-search-slice/product-tree.json')
    expect(projection.userAcceptanceBoundary).toContain('cannot accept product results')
  })

  it('validates the committed graph source projection artifact contract', async () => {
    const projection = await loadGraphSourceProjectionArtifact(resolve('.'))

    expect(projection.metadata.artifactRole).toBe('graph_source_read_model_projection')
    expect(projection.metadata.sourceArtifact).toBe('examples/adoption/todo-search-slice/graph-source.json')
    expect(projection.metadata.sourceSlice).toBe(todoSearchReadModelProfile.supportedSlice)
    expect(projection.metadata.sourceProfile).toBe(todoSearchReadModelProfile.profileId)
    expect(projection.nodes).toHaveLength(todoSearchReadModelProfile.expectedCounts.nodes)
    expect(projection.edges).toHaveLength(todoSearchReadModelProfile.expectedCounts.edges)
    expect(projection.coreViewCoverage.map((entry) => entry.name)).toEqual(coreViews)
    expect(projection.fallbackReferences).toContain('examples/adoption/todo-search-slice/acceptance-tree.json')
    expect(projection.retainedCompatibilityArtifacts).toContain(
      'examples/adoption/todo-search-slice/view-instance-manifest.json',
    )
    expect(projection.sourceAuthorityBoundary).toContain('limited source model')
    expect(projection.nonPromotionStatement).toContain('repo-wide promotion')
    expect(projection.userAcceptanceBoundary).toContain('User acceptance remains user-controlled')
  })

  it('rejects projection artifacts with missing boundaries or source drift', async () => {
    const graphSource = await loadGraphSourceArtifact(resolve('.'))
    const projectionPath = 'examples/adoption/todo-search-slice/generated/graph-source-read-model-projection.json'
    const projection = JSON.parse(await readFile(projectionPath, 'utf8')) as Record<string, unknown>

    delete projection.userAcceptanceBoundary
    expect(() => normalizeGraphSourceProjectionArtifact(projection, graphSource, projectionPath)).toThrow(
      /userAcceptanceBoundary/,
    )

    const drifted = JSON.parse(await readFile(projectionPath, 'utf8')) as {
      metadata: { sourceProfile: string }
    }
    drifted.metadata.sourceProfile = 'todo-app-pbe-run-structure-only'
    expect(() => normalizeGraphSourceProjectionArtifact(drifted, graphSource, projectionPath)).toThrow(/sourceProfile/)
  })

  it('rejects malformed graph source artifacts and does not mutate the positive artifact', async () => {
    const graphSourcePath = 'examples/adoption/todo-search-slice/graph-source.json'
    const before = await readFile(graphSourcePath, 'utf8')
    const source = JSON.parse(before) as Record<string, unknown>
    delete source.sourceAuthorityBoundary

    expect(() => normalizeGraphSourceArtifact(source, graphSourcePath)).toThrow(/sourceAuthorityBoundary/)
    expect(await readFile(graphSourcePath, 'utf8')).toBe(before)
  })

  it('parses and normalizes the candidate read-model slice registry fixture', async () => {
    const registry = await loadReadModelSliceRegistry(resolve('.'))

    expect(registry.schemaVersion).toBe(1)
    expect(registry.registryRole).toBe('read-model-slice-registry-fixture')
    expect(registry.status).toBe('active-consumed-by-validate-all')
    expect(registry.sourceAuthorityBoundary).toContain('configured read-model validation')
    expect(registry.nonPromotionStatement).toContain('not repo-wide Graph-source promotion')
    expect(registry.mutationBoundary).toContain('must not silently mutate')
    expect(registry.profiles.map((entry) => entry.profileId)).toEqual([
      todoSearchReadModelProfile.profileId,
      todoAppPbeRunStructureOnlyProfile.profileId,
    ])
    expect(registry.profiles.every((entry) => entry.includedInValidateAll)).toBe(true)
  })

  it('keeps registry entries aligned with current in-code profile expectations', async () => {
    const registry = await loadReadModelSliceRegistry(resolve('.'))
    const entries = new Map(registry.profiles.map((entry) => [entry.profileId, entry]))

    const todoSearch = entries.get(todoSearchReadModelProfile.profileId)
    const todoApp = entries.get(todoAppPbeRunStructureOnlyProfile.profileId)

    expect(todoSearch).toMatchObject({
      sourceSlice: todoSearchReadModelProfile.supportedSlice,
      sourceLayout: todoSearchReadModelProfile.sourceLayout,
      policyLevel: todoSearchReadModelProfile.policyLevel,
      expectedCounts: todoSearchReadModelProfile.expectedCounts,
      requiredCommands: ['generate', 'compare', 'validate'],
    })
    expect(todoSearch?.requiredArtifacts).toMatchObject({
      generatedReadModel: todoSearchReadModelProfile.artifacts.generatedReadModel,
      manualReadModel: todoSearchReadModelProfile.artifacts.manualReadModel,
      evidenceManifest: todoSearchReadModelProfile.artifacts.evidenceManifest,
      parityReport: todoSearchReadModelProfile.artifacts.generatedParityReport,
      validationReport: todoSearchReadModelProfile.artifacts.validationReport,
      scopedPilotMarker: todoSearchReadModelProfile.artifacts.scopedPilotMarker,
    })
    expect(todoSearch?.optionalArtifacts.graphSource).toBe(todoSearchReadModelProfile.artifacts.graphSource)
    expect(todoSearch?.optionalArtifacts.graphSourceProjection).toBe(
      'generated/graph-source-read-model-projection.json',
    )

    expect(todoApp).toMatchObject({
      sourceSlice: todoAppPbeRunStructureOnlyProfile.supportedSlice,
      sourceLayout: todoAppPbeRunStructureOnlyProfile.sourceLayout,
      policyLevel: todoAppPbeRunStructureOnlyProfile.policyLevel,
      expectedCounts: todoAppPbeRunStructureOnlyProfile.expectedCounts,
      requiredCommands: ['generate', 'validate'],
    })
    expect(todoApp?.requiredArtifacts).toMatchObject({
      generatedReadModel: todoAppPbeRunStructureOnlyProfile.artifacts.generatedReadModel,
      validationReport: todoAppPbeRunStructureOnlyProfile.artifacts.validationReport,
      evidenceManifest: todoAppPbeRunStructureOnlyProfile.artifacts.evidenceManifest,
    })
    expect(todoApp?.optionalArtifacts.graphSource).toBe('graph-source.json')
    expect(todoApp?.optionalArtifacts.graphSourceProjection).toBe('generated/graph-source-read-model-projection.json')
  })

  it('builds command plans from registry metadata without executing commands', async () => {
    const registry = await loadReadModelSliceRegistry(resolve('.'))

    const plans = buildReadModelRegistryCommandPlans(registry)

    expect(plans).toMatchObject([
      {
        profileId: todoSearchReadModelProfile.profileId,
        sourceSlice: todoSearchReadModelProfile.supportedSlice,
        policyLevel: 'pilot-marker-backed',
        commands: ['generate', 'compare', 'validate'],
        requiredArtifacts: {
          generatedReadModel: todoSearchReadModelProfile.artifacts.generatedReadModel,
          manualReadModel: todoSearchReadModelProfile.artifacts.manualReadModel,
          parityReport: todoSearchReadModelProfile.artifacts.generatedParityReport,
        },
        optionalArtifacts: {
          graphSource: todoSearchReadModelProfile.artifacts.graphSource,
          graphSourceProjection: 'generated/graph-source-read-model-projection.json',
        },
        expectedCounts: todoSearchReadModelProfile.expectedCounts,
      },
      {
        profileId: todoAppPbeRunStructureOnlyProfile.profileId,
        sourceSlice: todoAppPbeRunStructureOnlyProfile.supportedSlice,
        policyLevel: 'structure-only',
        commands: ['generate', 'validate'],
        requiredArtifacts: {
          generatedReadModel: todoAppPbeRunStructureOnlyProfile.artifacts.generatedReadModel,
          validationReport: todoAppPbeRunStructureOnlyProfile.artifacts.validationReport,
        },
        optionalArtifacts: {
          graphSource: todoAppPbeRunStructureOnlyProfile.artifacts.graphSource,
          graphSourceProjection: 'generated/graph-source-read-model-projection.json',
        },
        expectedCounts: todoAppPbeRunStructureOnlyProfile.expectedCounts,
      },
    ])
  })

  it('builds a graph-native execution contract report from the Todo Search configured slice', async () => {
    const report = await buildGraphExecutionContractReport(resolve('.'), todoSearchReadModelProfile.supportedSlice)

    expect(report.status).toBe('report-only')
    expect(report.source.profileId).toBe(todoSearchReadModelProfile.profileId)
    expect(report.source.sourceSlice).toBe(todoSearchReadModelProfile.supportedSlice)
    expect(report.source.policyLevel).toBe('pilot-marker-backed')
    expect(report.source.readModelProjection).toBe(
      'examples/adoption/todo-search-slice/generated/graph-source-read-model-projection.json',
    )
    expect(report.references.productNodeIds).toContain('PT-SEARCH-001')
    expect(report.references.workNodeIds).toContain('WT-SEARCH-001')
    expect(report.verificationRequirements.testNodeIds).toContain('TT-SEARCH-001')
    expect(report.fileChangeGuardContract.sourceFiles).toContain(
      'examples/adoption/todo-search-slice/product-tree.json',
    )
    expect(report.fileChangeGuardContract.sourceFiles).toContain(
      'examples/adoption/compatibility-mismatch-slice/compatibility-control-node.md',
    )
    expect(report.fileChangeGuardContract.sourceFiles).not.toContain(
      'examples/adoption/todo-search-slice/examples/adoption/compatibility-mismatch-slice/compatibility-control-node.md',
    )
    expect(report.verificationRequirements.requiredCommands).toContain('graph read-model compare')
    expect(report.verificationRequirements.requiredArtifacts).toHaveProperty('parityReport')
    expect(report.verificationRequirements.requiredArtifacts).toHaveProperty('scopedPilotMarker')
    expect(report.commandPlan.sequentialDefault).toBe(true)
    expect(report.compatibility.acepRemainsExecutionPackagingPath).toBe(true)
    expect(report.compatibility.note).toContain('ACEP')
    expect(report.limitations).toContain('does not mutate .pbe active state')
  })

  it('keeps the Todo App graph-native execution contract report structure-only after the pilot retry', async () => {
    const report = await buildGraphExecutionContractReport(
      resolve('.'),
      todoAppPbeRunStructureOnlyProfile.supportedSlice,
    )

    expect(report.status).toBe('report-only')
    expect(report.source.profileId).toBe(todoAppPbeRunStructureOnlyProfile.profileId)
    expect(report.source.sourceSlice).toBe(todoAppPbeRunStructureOnlyProfile.supportedSlice)
    expect(report.source.policyLevel).toBe('structure-only')
    expect(report.selectedSliceSummary).toMatchObject({
      nodeCount: 22,
      edgeCount: 38,
      coreViewCount: 7,
    })
    expect(report.references.productNodeIds).toContain('PT-1')
    expect(report.references.workNodeIds).toContain('WT-1')
    expect(report.verificationRequirements.testNodeIds).toContain('TT-1')
    expect(report.fileChangeGuardContract.sourceFiles).toContain(
      'examples/valid/todo-app-pbe-run/.pbe/tree/product-tree.json',
    )
    expect(report.verificationRequirements.requiredCommands).toEqual([
      'graph read-model generate',
      'graph read-model validate',
    ])
    expect(report.verificationRequirements.requiredArtifacts).not.toHaveProperty('parityReport')
    expect(report.verificationRequirements.requiredArtifacts).not.toHaveProperty('scopedPilotMarker')
    expect(report.sourceAuthorityBoundary).toContain('structure-only')
    expect(report.nonPromotionStatement).toContain('does not promote Todo App')
    expect(report.compatibility.acepRemainsExecutionPackagingPath).toBe(true)
    expect(report.limitations).toContain('does not expand source authority')
  })

  it('reports graph-native execution contract JSON through the CLI without mutating active state', async () => {
    const result = await runPbeCli(
      ['graph', 'execution-contract', 'report', '--slice', todoSearchReadModelProfile.supportedSlice, '--json'],
      { cwd: resolve('.'), pluginRoot: resolve('.') },
    )

    expect(result.exitCode).toBe(0)
    const payload = JSON.parse(result.stdout)
    expect(payload.command).toBe('graph execution-contract report')
    expect(payload.profileId).toBe(todoSearchReadModelProfile.profileId)
    expect(payload.contract.source.profileId).toBe(todoSearchReadModelProfile.profileId)
    expect(payload.contract.compatibility.acepRemainsExecutionPackagingPath).toBe(true)
    expect(payload.contract.userAcceptanceBoundary).toContain('acceptance')
  })

  it('fails graph-native execution contract reporting for an unknown slice', async () => {
    const result = await runPbeCli(
      ['graph', 'execution-contract', 'report', '--slice', 'examples/not-configured', '--json'],
      { cwd: resolve('.'), pluginRoot: resolve('.') },
    )

    expect(result.exitCode).toBe(1)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'GRAPH_EXECUTION_CONTRACT_REPORT_FAILED',
    )
    expect(JSON.stringify(payload)).toContain('No read-model profile is configured')
  })

  it('rejects duplicate profile IDs, missing top-level boundaries, and unknown policy levels', async () => {
    const source = await readRegistryFixtureObject()
    const duplicate = cloneJson(source)
    duplicate.profiles[1].profileId = duplicate.profiles[0].profileId
    expect(() => normalizeReadModelSliceRegistry(duplicate)).toThrow(/duplicates/)

    const missingBoundary = cloneJson(source)
    delete missingBoundary.sourceAuthorityBoundary
    expect(() => normalizeReadModelSliceRegistry(missingBoundary)).toThrow(/sourceAuthorityBoundary/)

    const unknownPolicy = cloneJson(source)
    unknownPolicy.profiles[0].policyLevel = 'repo-wide'
    expect(() => normalizeReadModelSliceRegistry(unknownPolicy)).toThrow(/policyLevel/)
  })

  it('rejects structure-only registry entries that require parity or pilot marker artifacts', async () => {
    const source = await readRegistryFixtureObject()
    const structureOnlyConflict = cloneJson(source)
    structureOnlyConflict.profiles[1].requiredCommands = ['generate', 'compare', 'validate']
    structureOnlyConflict.profiles[1].parityRequirement.required = true
    structureOnlyConflict.profiles[1].pilotMarkerRequirement.required = true
    structureOnlyConflict.profiles[1].requiredArtifacts.parityReport = 'generated/read-model-parity-report.json'
    structureOnlyConflict.profiles[1].requiredArtifacts.scopedPilotMarker =
      'generated/scoped-source-authority-pilot-marker.json'

    expect(() => normalizeReadModelSliceRegistry(structureOnlyConflict)).toThrow(
      /compare for structure-only policy.*parityRequirement\.required.*pilotMarkerRequirement\.required.*parityReport.*scopedPilotMarker/s,
    )
  })

  it('requires registry-declared compare and projection inputs instead of hidden sample defaults', async () => {
    const source = await readRegistryFixtureObject()
    const missingManual = cloneJson(source)
    delete missingManual.profiles[0].requiredArtifacts.manualReadModel
    expect(() => normalizeReadModelSliceRegistry(missingManual)).toThrow(/manualReadModel/)

    const missingGraphSource = cloneJson(source)
    delete missingGraphSource.profiles[0].optionalArtifacts.graphSource
    expect(() => normalizeReadModelSliceRegistry(missingGraphSource)).toThrow(/optionalArtifacts\.graphSource/)
  })

  it('does not mutate the registry fixture while parsing or planning', async () => {
    const workspace = await createExampleWorkspace()
    const registryPath = join(workspace, 'examples/read-model-aggregate/read-model-slices.json')
    const before = await readFile(registryPath, 'utf8')

    const registry = await loadReadModelSliceRegistry(workspace)
    buildReadModelRegistryCommandPlans(registry)
    const after = await readFile(registryPath, 'utf8')

    expect(after).toBe(before)
  })

  it('runs registry-backed validate-all for the current two profiles as aggregate-pass Evidence', async () => {
    const workspace = await createExampleWorkspace()

    const result = await validateAllReadModelEvidence(workspace)

    expect(result.includedProfiles.map((entry) => entry.profileId)).toEqual([
      todoSearchReadModelProfile.profileId,
      todoAppPbeRunStructureOnlyProfile.profileId,
    ])
    expect(result.status).toBe('aggregate-pass')
    expect(result.aggregateResult.summary.status).toBe('aggregate-pass')
    expect(result.aggregateResult.summary.summary).toMatchObject({
      sliceCount: 2,
      warningCount: 0,
      blockingCount: 0,
      decisionRequiredCount: 0,
    })
    expect(result.sourceAuthorityBoundary).toContain('does not expand source authority')
    expect(result.nonPromotionStatement).toContain('not user acceptance')
    expect(result.nonEnforcementStatement).toContain('non-enforcing')
    const todoSearch = result.perSliceResults.find((entry) => entry.profileId === todoSearchReadModelProfile.profileId)
    const todoApp = result.perSliceResults.find(
      (entry) => entry.profileId === todoAppPbeRunStructureOnlyProfile.profileId,
    )
    expect(todoSearch?.commands.find((entry) => entry.command === 'project-contract')).toMatchObject({
      status: 'projection-contract-pass',
      graphSource: 'examples/adoption/todo-search-slice/graph-source.json',
      projection: 'examples/adoption/todo-search-slice/generated/graph-source-read-model-projection.json',
      nodeCount: 40,
      edgeCount: 59,
      coreViewCount: 7,
    })
    expect(todoApp?.commands.find((entry) => entry.command === 'project-contract')).toMatchObject({
      status: 'projection-contract-pass',
      nodeCount: 22,
      edgeCount: 38,
      coreViewCount: 7,
      contractMode: 'structure-only-confirmed',
    })
  })

  it('uses registry command plans without directory discovery or policy promotion', async () => {
    const workspace = await createExampleWorkspace()
    await mkdir(join(workspace, 'examples/unregistered-slice/generated'), { recursive: true })

    const result = await validateAllReadModelEvidence(workspace)
    const todoSearch = result.perSliceResults.find((entry) => entry.profileId === todoSearchReadModelProfile.profileId)
    const todoApp = result.perSliceResults.find(
      (entry) => entry.profileId === todoAppPbeRunStructureOnlyProfile.profileId,
    )

    expect(result.includedProfiles).toHaveLength(2)
    expect(result.aggregateResult.summary.includedSlices).not.toContain('examples/unregistered-slice')
    expect(todoSearch?.commands.map((entry) => entry.command)).toEqual([
      'generate',
      'compare',
      'validate',
      'project-contract',
    ])
    expect(todoSearch?.commands.find((entry) => entry.command === 'compare')).toMatchObject({
      status: 'comparison-pass',
      parityReport: 'examples/adoption/todo-search-slice/generated/read-model-parity-report.json',
      parityReportMatchesRegistry: true,
      mismatchCount: 0,
    })
    expect(todoApp?.commands.map((entry) => entry.command)).toEqual(['generate', 'validate', 'project-contract'])
    expect(todoApp?.commands.some((entry) => entry.command === 'compare')).toBe(false)
    expect(todoApp?.policyLevel).toBe('structure-only')
  })

  it('blocks validate-all when projection contract artifacts are missing or corrupted', async () => {
    const missingProjectionWorkspace = await createExampleWorkspace()
    await rm(
      join(
        missingProjectionWorkspace,
        'examples/adoption/todo-search-slice/generated/graph-source-read-model-projection.json',
      ),
      { force: true },
    )

    const missingProjectionResult = await validateAllReadModelEvidence(missingProjectionWorkspace)
    const missingTodoSearch = missingProjectionResult.perSliceResults.find(
      (entry) => entry.profileId === todoSearchReadModelProfile.profileId,
    )
    expect(missingProjectionResult.status).toBe('aggregate-blocked')
    expect(missingProjectionResult.aggregateResult.summary.status).toBe('aggregate-pass')
    expect(missingTodoSearch?.status).toBe('blocked')
    expect(missingTodoSearch?.commands.find((entry) => entry.command === 'project-contract')).toMatchObject({
      status: 'projection-contract-blocked',
      blockingCount: 1,
    })

    const corruptProjectionWorkspace = await createExampleWorkspace()
    const projectionPath = join(
      corruptProjectionWorkspace,
      'examples/adoption/todo-search-slice/generated/graph-source-read-model-projection.json',
    )
    const projection = JSON.parse(await readFile(projectionPath, 'utf8')) as Record<string, unknown>
    delete projection.sourceAuthorityBoundary
    await writeFile(projectionPath, JSON.stringify(projection, null, 2))

    const corruptProjectionResult = await validateAllReadModelEvidence(corruptProjectionWorkspace)
    const corruptTodoSearch = corruptProjectionResult.perSliceResults.find(
      (entry) => entry.profileId === todoSearchReadModelProfile.profileId,
    )
    expect(corruptProjectionResult.status).toBe('aggregate-blocked')
    expect(corruptTodoSearch?.commands.find((entry) => entry.command === 'project-contract')).toMatchObject({
      status: 'projection-contract-blocked',
      blockingCount: 1,
    })

    const missingCandidateProjectionWorkspace = await createExampleWorkspace()
    await rm(
      join(
        missingCandidateProjectionWorkspace,
        'examples/valid/todo-app-pbe-run/generated/graph-source-read-model-projection.json',
      ),
      { force: true },
    )

    const missingCandidateResult = await validateAllReadModelEvidence(missingCandidateProjectionWorkspace)
    const missingCandidateTodoApp = missingCandidateResult.perSliceResults.find(
      (entry) => entry.profileId === todoAppPbeRunStructureOnlyProfile.profileId,
    )
    expect(missingCandidateResult.status).toBe('aggregate-blocked')
    expect(missingCandidateTodoApp?.commands.find((entry) => entry.command === 'project-contract')).toMatchObject({
      status: 'projection-contract-blocked',
      blockingCount: 1,
    })
  })

  it('blocks validate-all when registry entries are unsupported or drift from in-code profiles', async () => {
    const unknownProfileWorkspace = await createExampleWorkspace()
    await mutateRegistry(unknownProfileWorkspace, (registry) => {
      registry.profiles.push({
        ...cloneJson(registry.profiles[1]),
        profileId: 'unknown-structure-only',
        sourceSlice: 'examples/unknown-slice',
      })
    })
    await expect(validateAllReadModelEvidence(unknownProfileWorkspace)).rejects.toThrow(/No read-model profile/)

    const unsupportedCommandWorkspace = await createExampleWorkspace()
    await mutateRegistry(unsupportedCommandWorkspace, (registry) => {
      registry.profiles[0].requiredCommands = ['generate', 'lint', 'validate']
    })
    await expect(validateAllReadModelEvidence(unsupportedCommandWorkspace)).rejects.toThrow(/unsupported values: lint/)

    const profileDriftWorkspace = await createExampleWorkspace()
    await mutateRegistry(profileDriftWorkspace, (registry) => {
      registry.profiles[0].expectedCounts.nodes = 41
    })
    await expect(validateAllReadModelEvidence(profileDriftWorkspace)).rejects.toThrow(/does not match in-code profile/)
  })

  it('does not mutate the registry while running validate-all', async () => {
    const workspace = await createExampleWorkspace()
    const registryPath = join(workspace, 'examples/read-model-aggregate/read-model-slices.json')
    const before = await readFile(registryPath, 'utf8')

    await validateAllReadModelEvidence(workspace)
    const after = await readFile(registryPath, 'utf8')

    expect(after).toBe(before)
  })

  it('reports non-enforcing graph-source health across validate-all, intent, and retirement readiness', async () => {
    const workspace = await createExampleWorkspace()
    await copyWorkspacePath('examples/intent-critical', workspace)

    const report = await reportGraphSourceHealth(workspace)

    expect(report.status).toBe('graph-source-health-pass')
    expect(report.validateAll).toMatchObject({
      status: 'aggregate-pass',
      aggregateStatus: 'aggregate-pass',
      sliceCount: 2,
    })
    expect(report.e2eSmoke).toMatchObject({
      status: 'referenced-by-transition-status',
      intentReportExpected: true,
    })
    expect(report.todoSearch).toMatchObject({
      sourceMode: 'graph-source-backed',
      projectionContractStatus: 'projection-contract-pass',
      nodeCount: 40,
      edgeCount: 59,
      coreViewCount: 7,
      retirementApprovalStatus: 'retirement-candidate-not-deleted',
      retirementReadinessStatus: 'deprecated-fallback-reference-not-deleted',
    })
    expect(report.todoApp).toMatchObject({
      sourceMode: 'graph-source-backed',
      graphSourceAuthorityStatus: 'confirmed-structure-only-graph-source',
      projectionContractStatus: 'projection-contract-pass',
      nodeCount: 22,
      edgeCount: 38,
      coreViewCount: 7,
      retirementApprovalStatus: 'not-ready-structure-only',
    })
    expect(report.edgeIntent).toMatchObject({
      status: 'intent-report-pass',
      missingClassificationCount: 0,
      missingAnchorCount: 0,
    })
    expect(report.compilerBoundary).toMatchObject({
      status: 'compiler-boundary-mvp-pass',
      taskRegistryStatus: 'task-registry-pass',
      contractSchemaStatus: 'contract-schema-pass',
      contractValidatorStatus: 'contract-validator-pass',
      dryRunContractStatus: 'dry-run-contract-pass',
      dryRunChangeId: 'change-todo-search-whitespace-normalization-dogfood',
    })
    expect(report.compilerBoundary.requiredCheckCount).toBeGreaterThan(0)
    expect(report.compilerBoundary.requiredEvidenceCount).toBeGreaterThan(0)
    expect(report.edgeIntent.edgeIntentCount).toBeGreaterThan(0)
    expect(report.treeNativeRetirement).toMatchObject({
      readinessStatus: 'retirement-not-ready',
      todoSearchApprovalStatus: 'retirement-candidate-not-deleted',
      todoAppApprovalStatus: 'not-ready-structure-only',
      repoWideApprovalStatus: 'not-ready',
      explicitRetirementApproval: 'not-approved',
      retirementAction: 'todo-search-fallback-deprecated-not-deleted',
    })
    expect(report.enforcementStatus).toBe('non-enforcing')
    expect(report.blockingReasons).toEqual([])
  })

  it('reports the Compiler Boundary MVP registry, schema, and dry-run contract without enforcement', async () => {
    const workspace = await createExampleWorkspace()

    const report = await reportCompilerBoundary(workspace)

    expect(report.status).toBe('compiler-boundary-mvp-pass')
    expect(report.taskRegistryStatus).toBe('task-registry-pass')
    expect(report.contractSchemaStatus).toBe('contract-schema-pass')
    expect(report.contractValidatorStatus).toBe('contract-validator-pass')
    expect(report.dryRunContractStatus).toBe('dry-run-contract-pass')
    expect(report.validationBuckets.taskRegistry.status).toBe('task-registry-pass')
    expect(report.validationBuckets.contractSchema.status).toBe('contract-schema-pass')
    expect(report.validationBuckets.dryRunContract.status).toBe('dry-run-contract-pass')
    expect(report.taskCounts.compilerRequired).toBeGreaterThan(0)
    expect(report.taskCounts.aiAdvisory).toBeGreaterThan(0)
    expect(report.dryRunContract).toMatchObject({
      changeId: 'change-todo-search-whitespace-normalization-dogfood',
      changeType: 'bug_fix',
    })
    expect(report.dryRunContract.requiredCheckCount).toBeGreaterThan(0)
    expect(report.dryRunContract.requiredEvidenceCount).toBeGreaterThan(0)
    expect(report.nonEnforcementStatement).toContain('does not enable required checks')
    expect(report.blockingReasons).toEqual([])
  })

  it('isolates Compiler Boundary registry drift in the task registry bucket', async () => {
    const workspace = await createExampleWorkspace()
    const registryPath = join(workspace, 'examples/read-model-aggregate/compiler-boundary-task-registry.json')
    const registry = JSON.parse(await readFile(registryPath, 'utf8')) as Record<string, unknown>
    registry.status = 'drifted'
    registry.boundaryPrinciple = {
      aiOutput: 'advisory',
      compilerOutput: 'advisory',
      humanRole: 'decides',
    }
    await writeFile(registryPath, JSON.stringify(registry, null, 2))

    const report = await reportCompilerBoundary(workspace)

    expect(report.status).toBe('compiler-boundary-mvp-blocked')
    expect(report.taskRegistryStatus).toBe('task-registry-blocked')
    expect(report.contractSchemaStatus).toBe('contract-schema-pass')
    expect(report.contractValidatorStatus).toBe('contract-validator-pass')
    expect(report.validationBuckets.taskRegistry.blocking.join('\n')).toContain(
      'Task registry status must be compiler-boundary-mvp',
    )
    expect(report.validationBuckets.taskRegistry.blocking.join('\n')).toContain(
      'boundaryPrinciple.compilerOutput must be authoritative',
    )
  })

  it('isolates Compiler Boundary schema drift in the contract schema bucket', async () => {
    const workspace = await createExampleWorkspace()
    const schemaPath = join(workspace, 'examples/read-model-aggregate/execution-contract-schema.json')
    const schema = JSON.parse(await readFile(schemaPath, 'utf8')) as {
      status: string
      nonEnforcementStatement: string
      fieldDefinitions: Record<string, Record<string, unknown>>
    }
    schema.status = 'drifted'
    schema.nonEnforcementStatement = 'required checks may be enabled'
    schema.fieldDefinitions.goal.source = ''
    await writeFile(schemaPath, JSON.stringify(schema, null, 2))

    const report = await reportCompilerBoundary(workspace)

    expect(report.status).toBe('compiler-boundary-mvp-blocked')
    expect(report.taskRegistryStatus).toBe('task-registry-pass')
    expect(report.contractSchemaStatus).toBe('contract-schema-blocked')
    expect(report.contractValidatorStatus).toBe('contract-validator-pass')
    expect(report.validationBuckets.contractSchema.blocking.join('\n')).toContain(
      'Contract schema status must be compiler-boundary-mvp',
    )
    expect(report.validationBuckets.contractSchema.blocking.join('\n')).toContain(
      'fieldDefinitions.goal.source is required',
    )
  })

  it('exposes the Compiler Boundary MVP through the CLI', async () => {
    const workspace = await createExampleWorkspace()

    const result = await runPbeCli(['graph', 'read-model', 'report-compiler-boundary', '--json'], {
      cwd: workspace,
      pluginRoot: resolve('.'),
    })
    const output = JSON.parse(result.stdout) as {
      ok: boolean
      status: string
      taskRegistryStatus: string
      contractSchemaStatus: string
      contractValidatorStatus: string
      dryRunContractStatus: string
    }

    expect(result.exitCode).toBe(0)
    expect(output.ok).toBe(true)
    expect(output.status).toBe('compiler-boundary-mvp-pass')
    expect(output.taskRegistryStatus).toBe('task-registry-pass')
    expect(output.contractSchemaStatus).toBe('contract-schema-pass')
    expect(output.contractValidatorStatus).toBe('contract-validator-pass')
    expect(output.dryRunContractStatus).toBe('dry-run-contract-pass')
  })

  it('blocks Compiler Boundary MVP when advisory tasks claim execution authority', async () => {
    const registryPath = 'examples/read-model-aggregate/compiler-boundary-task-registry.json'
    const registry = JSON.parse(await readFile(registryPath, 'utf8')) as { tasks: Array<Record<string, unknown>> }
    const advisory = registry.tasks.find((task) => task.classification === 'ai-advisory')
    expect(advisory).toBeTruthy()
    advisory!.executionAuthority = true

    const validation = validateTaskRegistry(registry)

    expect(validation.blocking.join('\n')).toContain('ai-advisory task must have executionAuthority false')
  })

  it('blocks Compiler Boundary schema entries that omit source or authority', async () => {
    const schemaPath = 'examples/read-model-aggregate/execution-contract-schema.json'
    const schema = JSON.parse(await readFile(schemaPath, 'utf8')) as {
      fieldDefinitions: Record<string, Record<string, unknown>>
    }
    delete schema.fieldDefinitions.requiredChecks.authority
    schema.fieldDefinitions.goal.authority = 'llm-prose'

    const validation = validateContractSchema(schema)

    const blocking = validation.blocking.join('\n')
    expect(blocking).toContain('fieldDefinitions.requiredChecks.authority is required')
    expect(blocking).toContain('fieldDefinitions.goal.authority must be one of')
  })

  it('blocks dry-run contracts with status or sourceMode drift in the dry-run bucket', async () => {
    const workspace = await createExampleWorkspace()
    const contractPath = join(workspace, 'examples/read-model-aggregate/generated/execution-contract-dry-run.json')
    const contract = JSON.parse(await readFile(contractPath, 'utf8')) as Record<string, unknown>
    contract.status = 'drifted'
    contract.sourceMode = 'ai-authored'
    await writeFile(contractPath, JSON.stringify(contract, null, 2))

    const report = await reportCompilerBoundary(workspace)

    expect(report.status).toBe('compiler-boundary-mvp-blocked')
    expect(report.taskRegistryStatus).toBe('task-registry-pass')
    expect(report.contractSchemaStatus).toBe('contract-schema-pass')
    expect(report.contractValidatorStatus).toBe('contract-validator-blocked')
    expect(report.dryRunContractStatus).toBe('dry-run-contract-blocked')
    expect(report.validationBuckets.dryRunContract.blocking.join('\n')).toContain(
      'Execution contract status must be contract-dry-run-valid',
    )
    expect(report.validationBuckets.dryRunContract.blocking.join('\n')).toContain(
      'Execution contract sourceMode must be one of',
    )
  })

  it('blocks dry-run contracts with invalid scope, check, evidence, or stop-condition shapes', async () => {
    const contractPath = 'examples/read-model-aggregate/generated/execution-contract-dry-run.json'
    const contract = JSON.parse(await readFile(contractPath, 'utf8')) as {
      allowedScope: Array<Record<string, unknown>>
      requiredChecks: Array<Record<string, unknown>>
      requiredEvidence: Array<Record<string, unknown>>
      stopConditions: Array<Record<string, unknown>>
    }
    contract.allowedScope[0].paths = []
    contract.allowedScope[0].derivedFrom = []
    contract.requiredChecks[0].validates = []
    contract.requiredEvidence[0].fromCheck = 'check-does-not-exist'
    contract.requiredEvidence[0].freshness = 'eventually'
    delete contract.stopConditions[0].action
    contract.stopConditions[1].action = 'continue-without-evidence'

    const validation = validateExecutionContract(contract)
    const blocking = validation.blocking.join('\n')

    expect(blocking).toContain('allowedScope[0].paths must be a non-empty string array')
    expect(blocking).toContain('allowedScope[0].derivedFrom must be a non-empty string array')
    expect(blocking).toContain('requiredChecks[0].validates must be a non-empty string array')
    expect(blocking).toContain('requiredEvidence[0].fromCheck must reference an existing requiredChecks.id')
    expect(blocking).toContain('requiredEvidence[0].freshness must be one of')
    expect(blocking).toContain('stopConditions[0].action is required')
    expect(blocking).toContain('stopConditions[1].action must be one of')
  })

  it('blocks dry-run contracts with critical or blocking unknowns and unresolved high risks', async () => {
    const contractPath = 'examples/read-model-aggregate/generated/execution-contract-dry-run.json'
    const contract = JSON.parse(await readFile(contractPath, 'utf8')) as Record<string, unknown>

    const criticalUnknownContract = {
      ...contract,
      openUnknowns: [
        { id: 'unknown-printer-protocol', severity: 'critical', status: 'open', question: 'Need device?' },
      ],
    }
    expect(validateExecutionContract(criticalUnknownContract).blocking.join('\n')).toContain(
      'blocking critical unknown',
    )

    const blockingUnknownContract = {
      ...contract,
      openUnknowns: [{ id: 'unknown-safe-default', severity: 'blocking', status: 'open', question: 'Which fallback?' }],
    }
    expect(validateExecutionContract(blockingUnknownContract).blocking.join('\n')).toContain(
      'blocking critical unknown',
    )

    const highRiskContract = {
      ...contract,
      knownRisks: [{ id: 'risk-driver-protocol', severity: 'high', status: 'open' }],
      humanDecisions: [],
    }
    expect(validateExecutionContract(highRiskContract).blocking.join('\n')).toContain(
      'high risk without human decision',
    )

    const selfMitigatedHighRiskContract = {
      ...contract,
      knownRisks: [{ id: 'risk-driver-protocol', severity: 'high', status: 'mitigated' }],
      humanDecisions: [],
    }
    expect(validateExecutionContract(selfMitigatedHighRiskContract).blocking.join('\n')).toContain(
      'high risk without human decision',
    )

    const acceptedRiskContract = {
      ...contract,
      knownRisks: [{ id: 'risk-driver-protocol', severity: 'high', status: 'open' }],
      humanDecisions: [
        {
          id: 'decision-driver-protocol',
          decides: 'risk-driver-protocol',
          status: 'accepted',
          decision: 'Accept dry-run risk for validator fixture only.',
        },
      ],
    }
    expect(validateExecutionContract(acceptedRiskContract).blocking.join('\n')).not.toContain('risk-driver-protocol')
  })

  it('blocks durable invalid compiler-boundary fixture when high risk lacks linked human decision', async () => {
    const fixturePath =
      'examples/read-model-aggregate/invalid-compiler-boundary-fixtures/high-risk-mitigated-without-human-decision.json'
    const contract = JSON.parse(await readFile(fixturePath, 'utf8')) as Record<string, unknown>

    const validation = validateExecutionContract(contract)

    expect(validation.blocking.join('\n')).toContain(
      'Execution contract has high risk without human decision: risk-self-declared-mitigation',
    )
  })

  it('blocks human decisions that point at unknown contract targets', async () => {
    const contractPath = 'examples/read-model-aggregate/generated/execution-contract-dry-run.json'
    const contract = JSON.parse(await readFile(contractPath, 'utf8')) as Record<string, unknown>
    contract.humanDecisions = [
      {
        id: 'decision-unknown-target',
        decides: 'risk-does-not-exist',
        status: 'approved-by-ai',
        decision: 'Invalid target.',
      },
    ]

    const validation = validateExecutionContract(contract)

    expect(validation.blocking.join('\n')).toContain(
      'humanDecisions[0].decides must reference a known risk, unknown, scope, or change id',
    )
    expect(validation.blocking.join('\n')).toContain('humanDecisions[0].status must be one of')
  })

  it('reports the Compiler Input Model MVP without compiling contracts', async () => {
    const workspace = await createExampleWorkspace()

    const report = await reportCompilerInputModel(workspace)

    expect(report.status).toBe('compiler-input-model-pass')
    expect(report.inputSchemaStatus).toBe('compiler-input-schema-pass')
    expect(report.dryRunInputStatus).toBe('compiler-input-dry-run-pass')
    expect(report.dryRunInput).toMatchObject({
      changeId: 'change-todo-search-whitespace-normalization-dogfood',
      humanRequestId: 'request-todo-search-whitespace-normalization',
    })
    expect(report.dryRunInput.graphSnapshotArtifactCount).toBeGreaterThan(0)
    expect(report.dryRunInput.targetScopeCandidateCount).toBeGreaterThan(0)
    expect(report.nonExecutionStatement).toContain('does not compile an execution contract')
    expect(report.blockingReasons).toEqual([])
  })

  it('exposes the Compiler Input Model MVP through the CLI', async () => {
    const workspace = await createExampleWorkspace()

    const result = await runPbeCli(['graph', 'read-model', 'report-compiler-input', '--json'], {
      cwd: workspace,
      pluginRoot: resolve('.'),
    })
    const output = JSON.parse(result.stdout) as {
      ok: boolean
      status: string
      inputSchemaStatus: string
      dryRunInputStatus: string
    }

    expect(result.exitCode).toBe(0)
    expect(output.ok).toBe(true)
    expect(output.status).toBe('compiler-input-model-pass')
    expect(output.inputSchemaStatus).toBe('compiler-input-schema-pass')
    expect(output.dryRunInputStatus).toBe('compiler-input-dry-run-pass')
  })

  it('blocks Compiler Input Model schema authority drift and dry-run contract output claims', async () => {
    const schemaPath = 'examples/read-model-aggregate/compiler-input-model-schema.json'
    const inputPath = 'examples/read-model-aggregate/generated/compiler-input-model-dry-run.json'
    const schema = JSON.parse(await readFile(schemaPath, 'utf8')) as {
      inputDefinitions: Record<string, Record<string, unknown>>
    }
    const input = JSON.parse(await readFile(inputPath, 'utf8')) as Record<string, unknown>
    schema.inputDefinitions.graphSnapshot.authority = 'ai-prose'
    input.compiledExecutionContract = { id: 'not-allowed' }

    const schemaValidation = validateCompilerInputSchema(schema)
    const inputValidation = await validateCompilerInputDryRun(input)

    expect(schemaValidation.blocking.join('\n')).toContain('inputDefinitions.graphSnapshot.authority must be one of')
    expect(inputValidation.blocking.join('\n')).toContain('must not contain compiledExecutionContract')
  })

  it('blocks Compiler Input Model dry-run inputs with broken artifact and graph references', async () => {
    const inputPath = 'examples/read-model-aggregate/generated/compiler-input-model-dry-run.json'
    const input = JSON.parse(await readFile(inputPath, 'utf8')) as {
      graphSnapshot: { artifacts: Array<Record<string, unknown>> }
      evidenceIndex: { entries: Array<Record<string, unknown>> }
      targetScopeCandidates: Array<Record<string, unknown>>
      policySnapshot: {
        policies: Array<Record<string, unknown>>
        evidenceCheckMappings: Array<Record<string, unknown>>
        forbiddenScopeRules: Array<Record<string, unknown>>
      }
      packSchema: { requiredInputGroups: string[] }
    }
    input.graphSnapshot.artifacts[0].path = 'examples/missing/graph-source.json'
    input.evidenceIndex.entries[0].artifact = 'examples/missing/evidence.md'
    input.evidenceIndex.entries[0].freshness = 'stale-whenever'
    input.targetScopeCandidates[0].paths = ['examples/missing/search-filter.ts']
    input.targetScopeCandidates[0].derivedFrom = ['graph-source:node:DOES-NOT-EXIST']
    input.targetScopeCandidates[0].scopeKind = 'database'
    input.targetScopeCandidates[0].confidence = 'ai-guessed'
    input.policySnapshot.policies[0].authority = 'ai-prose'
    input.policySnapshot.policies[0].status = 'maybe'
    input.policySnapshot.evidenceCheckMappings[0].requiredCheckId = ''
    input.policySnapshot.forbiddenScopeRules[0].paths = ['examples/missing/policy-boundary.json']
    input.policySnapshot.forbiddenScopeRules[0].derivedFrom = []
    input.packSchema.requiredInputGroups = ['humanRequest', 'magicContext']

    const validation = await validateCompilerInputDryRun(input, resolve('.'))
    const blocking = validation.blocking.join('\n')

    expect(blocking).toContain('graphSnapshot.artifacts[0].path does not exist')
    expect(blocking).toContain('evidenceIndex.entries[0].artifact does not exist')
    expect(blocking).toContain('evidenceIndex.entries[0].freshness must be one of')
    expect(blocking).toContain('targetScopeCandidates[0].paths references missing file or artifact')
    expect(blocking).toContain('targetScopeCandidates[0].derivedFrom references unknown graph node')
    expect(blocking).toContain('targetScopeCandidates[0].scopeKind must be one of')
    expect(blocking).toContain('targetScopeCandidates[0].confidence must be one of')
    expect(blocking).toContain('policySnapshot.policies[0].authority must be one of')
    expect(blocking).toContain('policySnapshot.policies[0].status must be one of')
    expect(blocking).toContain('policySnapshot.evidenceCheckMappings[0].requiredCheckId is required')
    expect(blocking).toContain('policySnapshot.forbiddenScopeRules[0].paths references missing file or artifact')
    expect(blocking).toContain('policySnapshot.forbiddenScopeRules[0].derivedFrom must be a non-empty string array')
    expect(blocking).toContain('packSchema.requiredInputGroups contains unknown groups: magicContext')
  })

  it('compiles a deterministic dry-run contract candidate from the Compiler Input Model', async () => {
    const workspace = await createExampleWorkspace()

    const report = await compileExecutionContractDryRun(workspace)
    const candidatePath = join(workspace, report.paths.outputCandidate)
    const candidate = JSON.parse(await readFile(candidatePath, 'utf8')) as Record<string, unknown>
    const validation = validateExecutionContract(candidate)

    expect(report.status).toBe('contract-compiler-dry-run-pass')
    expect(report.inputModelStatus).toBe('compiler-input-model-pass')
    expect(report.candidateStatus).toBe('contract-candidate-pass')
    expect(report.candidateDiff.status).toBe('contract-diff-detected')
    expect(report.paths.diffReport).toBe('examples/read-model-aggregate/generated/execution-contract-dry-run.diff.json')
    expect(report.candidate).toMatchObject({
      changeId: 'change-todo-search-whitespace-normalization-dogfood',
      changeType: 'bug_fix',
      allowedScopeCount: 2,
      forbiddenScopeCount: 2,
    })
    expect(candidate.sourceMode).toBe('contract-compiler-dry-run-v0')
    expect(candidate.goal).toBe('Preserve Todo Search matching when a multi-word query contains repeated whitespace.')
    expect(JSON.stringify(candidate)).toContain('examples/adoption/todo-search-slice/runtime-fixture/todo-search.js')
    expect(JSON.stringify(candidate)).toContain('graph-source:node:CODE-RUNTIME-SEARCH-HELPER')
    const diffReport = JSON.parse(await readFile(join(workspace, report.paths.diffReport), 'utf8')) as {
      status: string
      differingFields: string[]
    }
    expect(diffReport.status).toBe('contract-diff-detected')
    expect(diffReport.differingFields).toContain('sourceMode')
    expect(validation.blocking).toEqual([])
    expect(report.nonExecutionStatement).toContain('does not execute AI')
  })

  it('exposes Contract Compiler Dry-Run v0.1 through the CLI', async () => {
    const workspace = await createExampleWorkspace()

    const result = await runPbeCli(['graph', 'read-model', 'compile-contract', '--dry-run', '--json'], {
      cwd: workspace,
      pluginRoot: resolve('.'),
    })
    const output = JSON.parse(result.stdout) as {
      ok: boolean
      status: string
      inputModelStatus: string
      candidateStatus: string
      paths: { outputCandidate: string; diffReport: string }
      candidate: { requiredCheckCount: number; requiredEvidenceCount: number }
      candidateDiff: { status: string; differingFieldCount: number }
    }

    expect(result.exitCode).toBe(0)
    expect(output.ok).toBe(true)
    expect(output.status).toBe('contract-compiler-dry-run-pass')
    expect(output.inputModelStatus).toBe('compiler-input-model-pass')
    expect(output.candidateStatus).toBe('contract-candidate-pass')
    expect(output.paths.outputCandidate).toBe(
      'examples/read-model-aggregate/generated/execution-contract-dry-run.generated.json',
    )
    expect(output.paths.diffReport).toBe('examples/read-model-aggregate/generated/execution-contract-dry-run.diff.json')
    expect(output.candidateDiff.status).toBe('contract-diff-detected')
    expect(output.candidateDiff.differingFieldCount).toBeGreaterThan(0)
    expect(output.candidate.requiredCheckCount).toBeGreaterThan(0)
    expect(output.candidate.requiredEvidenceCount).toBeGreaterThan(0)
  })

  it('blocks Contract Compiler Dry-Run v0.1 for unsupported compiler input change types', async () => {
    const workspace = await createExampleWorkspace()
    const inputPath = join(workspace, 'examples/read-model-aggregate/generated/compiler-input-model-dry-run.json')
    const input = JSON.parse(await readFile(inputPath, 'utf8')) as {
      packSchema: { id: string; changeType: string }
    }
    input.packSchema.id = 'pack-schema-feature'
    input.packSchema.changeType = 'feature'
    await writeFile(inputPath, JSON.stringify(input, null, 2))

    const report = await compileExecutionContractDryRun(workspace, { writeOutput: false })
    const blocking = report.blockingReasons.join('\n')

    expect(report.status).toBe('contract-compiler-dry-run-blocked')
    expect(report.candidateStatus).toBe('contract-candidate-not-run')
    expect(report.candidateDiff.status).toBe('contract-diff-not-run')
    expect(blocking).toContain('only supports pack-schema-bug-fix')
    expect(blocking).toContain('only supports bug_fix changeType')
  })

  it('exposes graph-source health through the CLI without creating enforcement', async () => {
    const workspace = await createExampleWorkspace()
    await copyWorkspacePath('examples/intent-critical', workspace)
    const markdownPath = join(workspace, 'examples/read-model-aggregate/generated/read-model-health-report-output.md')

    const result = await runPbeCli(['graph', 'read-model', 'report-health', '--json', '--markdown', markdownPath], {
      cwd: workspace,
      pluginRoot: resolve('.'),
    })
    const output = JSON.parse(result.stdout) as {
      ok: boolean
      status: string
      enforcementStatus: string
      markdownReport: string
      treeNativeRetirement: { todoSearchApprovalStatus: string; repoWideApprovalStatus: string }
      compilerBoundary: { status: string; dryRunChangeId: string }
      compilerInputModel: { status: string; dryRunChangeId: string }
      contractCompilerDryRun: {
        status: string
        dryRunChangeId: string
        candidateStatus: string
        candidateDiffStatus: string
        differingFieldCount: number
        diffReport: string
      }
    }
    const markdown = await readFile(markdownPath, 'utf8')

    expect(result.exitCode).toBe(0)
    expect(output.ok).toBe(true)
    expect(output.status).toBe('graph-source-health-pass')
    expect(output.markdownReport).toBe('examples/read-model-aggregate/generated/read-model-health-report-output.md')
    expect(output.enforcementStatus).toBe('non-enforcing')
    expect(output.compilerBoundary.status).toBe('compiler-boundary-mvp-pass')
    expect(output.compilerBoundary.dryRunChangeId).toBe('change-todo-search-whitespace-normalization-dogfood')
    expect(output.compilerInputModel.status).toBe('compiler-input-model-pass')
    expect(output.compilerInputModel.dryRunChangeId).toBe('change-todo-search-whitespace-normalization-dogfood')
    expect(output.contractCompilerDryRun.status).toBe('contract-compiler-dry-run-pass')
    expect(output.contractCompilerDryRun.candidateStatus).toBe('contract-candidate-pass')
    expect(output.contractCompilerDryRun.candidateDiffStatus).toBe('contract-diff-detected')
    expect(output.contractCompilerDryRun.differingFieldCount).toBeGreaterThan(0)
    expect(output.contractCompilerDryRun.diffReport).toBe(
      'examples/read-model-aggregate/generated/execution-contract-dry-run.diff.json',
    )
    expect(output.contractCompilerDryRun.dryRunChangeId).toBe('change-todo-search-whitespace-normalization-dogfood')
    expect(output.treeNativeRetirement.todoSearchApprovalStatus).toBe('retirement-candidate-not-deleted')
    expect(output.treeNativeRetirement.repoWideApprovalStatus).toBe('not-ready')
    expect(markdown).toContain('# Graph-Source Health Report')
    expect(markdown).toContain('Status: `graph-source-health-pass`')
    expect(markdown).toContain('Todo Search')
    expect(markdown).toContain('Todo App PBE Run')
    expect(markdown).toContain('`aggregate-pass`')
    expect(markdown).toContain('`intent-report-pass`')
    expect(markdown).toContain('`compiler-boundary-mvp-pass`')
    expect(markdown).toContain('`compiler-input-model-pass`')
    expect(markdown).toContain('`contract-compiler-dry-run-pass`')
    expect(markdown).toContain('`contract-diff-detected`')
    expect(markdown).toContain('`retirement-not-ready`')
    expect(markdown).toContain('`non-enforcing`')
    expect(markdown).toContain('node dist/cli/index.js graph read-model report-health --json --markdown')
  })

  it('blocks graph-source health when retirement approval package status drifts', async () => {
    const workspace = await createExampleWorkspace()
    await copyWorkspacePath('examples/intent-critical', workspace)
    const statusPath = join(workspace, 'examples/read-model-aggregate/graph-source-transition-status.json')
    const status = JSON.parse(await readFile(statusPath, 'utf8')) as {
      retirementApprovalPackages: Array<{ scope: string; status: string }>
    }
    status.retirementApprovalPackages.find((entry) => entry.scope === 'todo-search-selected-slice')!.status = 'approved'
    await writeFile(statusPath, JSON.stringify(status, null, 2))

    const report = await reportGraphSourceHealth(workspace)

    expect(report.status).toBe('graph-source-health-blocked')
    expect(report.blockingReasons).toContain('Todo Search retirement approval package status is approved')
  })

  afterEach(async () => {
    await Promise.all(workspaces.splice(0).map((workspace) => rm(workspace, { recursive: true, force: true })))
  })

  it('generates bounded read-model Evidence with source authority boundaries', async () => {
    const workspace = await createExampleWorkspace()

    const result = await generateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    const generated = JSON.parse(await readFile(result.generatedJsonPath, 'utf8')) as {
      nodes: Array<{ viewScopedTags?: string[]; includedInViewIds?: string[] }>
      edges: unknown[]
      coreViewCoverage: Array<{ name: string; viewScopedTags?: string[] }>
      metadata: {
        sliceProfile?: string
        readModelSourceMode?: string
        graphSourceArtifact?: string
        graphSourceProjectionRole?: string
      }
      sourceInputs: Array<{ relativePath: string }>
      sourceAuthorityBoundary: string
      nonPromotionStatement: string
    }

    expect(generated.sourceAuthorityBoundary).toContain('Tree-native selected-slice artifacts')
    expect(generated.nonPromotionStatement).toContain('cannot change source authority')
    expect(generated.coreViewCoverage.map((entry) => entry.name)).toEqual(coreViews)
    expect(generated.nodes).toHaveLength(todoSearchReadModelProfile.expectedCounts.nodes)
    expect(generated.edges).toHaveLength(todoSearchReadModelProfile.expectedCounts.edges)
    expect(generated.metadata.sliceProfile).toBe(todoSearchReadModelProfile.profileId)
    expect(generated.metadata.readModelSourceMode).toBe('graph-source-backed')
    expect(generated.metadata.graphSourceArtifact).toBe('examples/adoption/todo-search-slice/graph-source.json')
    expect(generated.metadata.graphSourceProjectionRole).toBe('graph_source_read_model_projection')
    expect(generated.sourceInputs.map((entry) => entry.relativePath)).toContain(
      'examples/adoption/todo-search-slice/graph-source.json',
    )
    expect(generated.nodes.length).toBeGreaterThan(0)
    expect(
      generated.nodes.some((entry) => Array.isArray(entry.includedInViewIds) && entry.includedInViewIds.length > 0),
    ).toBe(true)
    const tags = [
      ...generated.nodes.flatMap((entry) => entry.viewScopedTags || []),
      ...generated.coreViewCoverage.flatMap((entry) => entry.viewScopedTags || []),
    ]
    expect(tags.every((tag) => allowedTags.has(tag))).toBe(true)
    expect(tags.some((tag) => tag.endsWith('-view'))).toBe(false)
  })

  it('uses Todo Search graph source records for generated read-model output', async () => {
    const workspace = await createExampleWorkspace()
    const graphSourcePath = join(workspace, 'examples/adoption/todo-search-slice/graph-source.json')
    const graphSource = JSON.parse(await readFile(graphSourcePath, 'utf8')) as {
      sourceRecords: { nodes: Array<{ id: string; title: string }> }
    }
    const targetNode = graphSource.sourceRecords.nodes.find((entry) => entry.id === 'AC-SEARCH-001')
    expect(targetNode).toBeDefined()
    targetNode!.title = 'Graph source backed generation smoke title'
    await writeFile(graphSourcePath, JSON.stringify(graphSource, null, 2))

    const result = await generateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    const generated = JSON.parse(await readFile(result.generatedJsonPath, 'utf8')) as {
      nodes: Array<{ id: string; title: string }>
      edges: unknown[]
      coreViewCoverage: unknown[]
      metadata: { readModelSourceMode?: string }
    }

    expect(generated.metadata.readModelSourceMode).toBe('graph-source-backed')
    expect(generated.nodes.find((entry) => entry.id === 'AC-SEARCH-001')?.title).toBe(
      'Graph source backed generation smoke title',
    )
    expect(generated.nodes).toHaveLength(todoSearchReadModelProfile.expectedCounts.nodes)
    expect(generated.edges).toHaveLength(todoSearchReadModelProfile.expectedCounts.edges)
    expect(generated.coreViewCoverage).toHaveLength(coreViews.length)
  })

  it('writes a parity report without mutating manual artifacts', async () => {
    const workspace = await createExampleWorkspace()
    const manualPath = 'examples/adoption/todo-search-slice/maintainability-graph-read-model.json'
    const beforeManual = await readFile(join(workspace, manualPath), 'utf8')
    const generated = await generateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')

    const result = await compareReadModelEvidence(workspace, generated.generatedJsonPath, manualPath)
    const afterManual = await readFile(join(workspace, manualPath), 'utf8')
    const report = JSON.parse(await readFile(result.reportJsonPath, 'utf8')) as {
      summary: { status: string; blockingCount: number; decisionRequiredCount: number }
      mismatches: unknown[]
      severityLabels: string[]
      nonPromotionStatement: string
    }

    expect(afterManual).toBe(beforeManual)
    expect(report.summary.status).toBe('comparison-pass')
    expect(report.summary.blockingCount).toBe(0)
    expect(report.summary.decisionRequiredCount).toBe(0)
    expect(Array.isArray(report.mismatches)).toBe(true)
    expect(report.mismatches).toHaveLength(0)
    expect(report.severityLabels).toEqual(['info', 'warning', 'blocking', 'decision-required'])
    expect(report.nonPromotionStatement).toContain('does not promote Maintainability Graph')
  })

  it('validates Todo Search generated read-model Evidence as validator-backed Evidence', async () => {
    const workspace = await createExampleWorkspace()
    const generated = await generateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    await compareReadModelEvidence(
      workspace,
      generated.generatedJsonPath,
      'examples/adoption/todo-search-slice/maintainability-graph-read-model.json',
    )

    const result = await validateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    const report = JSON.parse(await readFile(result.reportJsonPath, 'utf8')) as {
      status: string
      evidenceLevel: string
      summary: { blockingCount: number; checkCount: number; decisionRequiredCount: number }
      metadata: {
        profileId?: string
        sourceLayout?: string
        policyLevel?: string
        expectedCounts?: Record<string, number>
        parityRequirement?: Record<string, unknown>
        pilotMarkerRequirement?: Record<string, unknown>
        runtimeFixtureRequirement?: Record<string, unknown>
      }
      sliceValidationContract?: Record<string, unknown>
      sourceAuthorityBoundary: string
      nonPromotionStatement: string
    }

    expect(report.status).toBe('validation-pass')
    expect(report.evidenceLevel).toBe('validator-backed')
    expect(report.summary.checkCount).toBe(todoSearchReadModelProfile.expectedCounts.validationChecks)
    expect(report.summary.blockingCount).toBe(0)
    expect(report.summary.decisionRequiredCount).toBe(0)
    expect(report.metadata.profileId).toBe(todoSearchReadModelProfile.profileId)
    expect(report.metadata.sourceLayout).toBe('flat-demo-support')
    expect(report.metadata.policyLevel).toBe('pilot-marker-backed')
    expect(report.metadata.expectedCounts).toEqual(todoSearchReadModelProfile.expectedCounts)
    expect(report.metadata.parityRequirement).toMatchObject({ required: true, status: 'pass' })
    expect(report.metadata.pilotMarkerRequirement).toMatchObject({ required: true, status: 'present' })
    expect(report.metadata.runtimeFixtureRequirement).toMatchObject({ required: true, status: 'present' })
    expect(report.sliceValidationContract).toMatchObject({
      reportUnit: 'per-slice-validation-report',
      sourceSlice: 'examples/adoption/todo-search-slice',
      policyLevel: 'pilot-marker-backed',
    })
    expect(report.sourceAuthorityBoundary).toContain('does not change source authority')
    expect(report.nonPromotionStatement).toContain('Validation pass is Evidence only')
  })

  it('generates and validates Todo App PBE run as structure-only without parity or pilot marker', async () => {
    const workspace = await createExampleWorkspace()

    const generated = await generateReadModelEvidence(workspace, 'examples/valid/todo-app-pbe-run')
    const generatedJson = JSON.parse(await readFile(generated.generatedJsonPath, 'utf8')) as {
      nodes: unknown[]
      edges: unknown[]
      metadata: {
        slicePolicyLevel?: string
        sliceProfile?: string
        readModelSourceMode?: string
        graphSourceArtifact?: string
        graphSourceProjectionRole?: string
        graphSourcePromotionStatus?: string
        graphSourceAuthorityStatus?: string
        graphSourcePolicyLevel?: string
      }
      coreViewCoverage: Array<{ name: string; viewScopedTags?: string[] }>
      sourceInputs: Array<{ relativePath: string }>
      sourceAuthorityBoundary: string
      nonPromotionStatement: string
    }

    expect(generatedJson.metadata.sliceProfile).toBe(todoAppPbeRunStructureOnlyProfile.profileId)
    expect(generatedJson.metadata.slicePolicyLevel).toBe('structure-only')
    expect(generatedJson.metadata.readModelSourceMode).toBe('graph-source-backed')
    expect(generatedJson.metadata.graphSourceArtifact).toBe('examples/valid/todo-app-pbe-run/graph-source.json')
    expect(generatedJson.metadata.graphSourceProjectionRole).toBe('structure_only_graph_source_read_model_projection')
    expect(generatedJson.metadata.graphSourcePromotionStatus).toBe('structure-only-confirmed')
    expect(generatedJson.metadata.graphSourceAuthorityStatus).toBe('confirmed-structure-only-graph-source')
    expect(generatedJson.metadata.graphSourcePolicyLevel).toBe('structure-only')
    expect(generatedJson.sourceInputs.map((entry) => entry.relativePath)).toContain(
      'examples/valid/todo-app-pbe-run/graph-source.json',
    )
    expect(generatedJson.nodes).toHaveLength(todoAppPbeRunStructureOnlyProfile.expectedCounts.nodes)
    expect(generatedJson.edges).toHaveLength(todoAppPbeRunStructureOnlyProfile.expectedCounts.edges)
    expect(generatedJson.coreViewCoverage.map((entry) => entry.name)).toEqual(coreViews)
    expect(generatedJson.sourceAuthorityBoundary).toContain('Canonical .pbe')
    expect(generatedJson.nonPromotionStatement).toContain('does not change source authority')
    const tags = generatedJson.coreViewCoverage.flatMap((entry) => entry.viewScopedTags || [])
    expect(tags.every((tag) => allowedTags.has(tag))).toBe(true)

    const result = await validateReadModelEvidence(workspace, 'examples/valid/todo-app-pbe-run')
    const report = JSON.parse(await readFile(result.reportJsonPath, 'utf8')) as {
      status: string
      summary: { checkCount: number; warningCount: number; blockingCount: number; decisionRequiredCount: number }
      metadata: {
        parityReport?: string
        pilotMarker?: string
        sliceProfile?: string
        profileId?: string
        sourceLayout?: string
        policyLevel?: string
        expectedCounts?: Record<string, number>
        parityRequirement?: Record<string, unknown>
        pilotMarkerRequirement?: Record<string, unknown>
        runtimeFixtureRequirement?: Record<string, unknown>
      }
      sliceValidationContract?: Record<string, unknown>
      sourceAuthorityBoundary: string
    }

    expect(report.status).toBe('validation-pass')
    expect(report.summary.checkCount).toBe(todoAppPbeRunStructureOnlyProfile.expectedCounts.validationChecks)
    expect(report.summary.warningCount).toBe(0)
    expect(report.summary.blockingCount).toBe(0)
    expect(report.summary.decisionRequiredCount).toBe(0)
    expect(report.metadata.sliceProfile).toBe(todoAppPbeRunStructureOnlyProfile.profileId)
    expect(report.metadata.profileId).toBe(todoAppPbeRunStructureOnlyProfile.profileId)
    expect(report.metadata.sourceLayout).toBe('canonical-pbe')
    expect(report.metadata.policyLevel).toBe('structure-only')
    expect(report.metadata.expectedCounts).toEqual(todoAppPbeRunStructureOnlyProfile.expectedCounts)
    expect(report.metadata.parityReport).toBe('not-required-for-structure-only')
    expect(report.metadata.pilotMarker).toBe('not-required-for-structure-only')
    expect(report.metadata.parityRequirement).toMatchObject({ required: false, status: 'not-required' })
    expect(report.metadata.pilotMarkerRequirement).toMatchObject({ required: false, status: 'not-required' })
    expect(report.metadata.runtimeFixtureRequirement).toMatchObject({
      required: false,
      status: 'attached-evidence-only',
    })
    expect(report.sliceValidationContract).toMatchObject({
      reportUnit: 'per-slice-validation-report',
      sourceSlice: 'examples/valid/todo-app-pbe-run',
      policyLevel: 'structure-only',
    })
    expect(report.sourceAuthorityBoundary).toContain('structure-only')
  })

  it('uses Todo App graph-source candidate records for structure-only generated read-model output', async () => {
    const workspace = await createExampleWorkspace()
    const graphSourcePath = join(workspace, 'examples/valid/todo-app-pbe-run/graph-source.json')
    const graphSource = JSON.parse(await readFile(graphSourcePath, 'utf8')) as {
      sourceRecords: { nodes: Array<{ id: string; title: string }> }
    }
    const targetNode = graphSource.sourceRecords.nodes.find((entry) => entry.id === 'PT-1')
    expect(targetNode).toBeDefined()
    targetNode!.title = 'Todo App candidate graph source backed smoke title'
    await writeFile(graphSourcePath, JSON.stringify(graphSource, null, 2))

    const generated = await generateReadModelEvidence(workspace, 'examples/valid/todo-app-pbe-run')
    const generatedJson = JSON.parse(await readFile(generated.generatedJsonPath, 'utf8')) as {
      nodes: Array<{ id: string; title: string }>
      edges: unknown[]
      coreViewCoverage: unknown[]
      metadata: {
        readModelSourceMode?: string
        graphSourceArtifact?: string
        graphSourceAuthorityStatus?: string
      }
      sourceAuthorityBoundary: string
      nonPromotionStatement: string
    }

    expect(generatedJson.metadata.readModelSourceMode).toBe('graph-source-backed')
    expect(generatedJson.metadata.graphSourceArtifact).toBe('examples/valid/todo-app-pbe-run/graph-source.json')
    expect(generatedJson.metadata.graphSourceAuthorityStatus).toBe('confirmed-structure-only-graph-source')
    expect(generatedJson.nodes.find((entry) => entry.id === 'PT-1')?.title).toBe(
      'Todo App candidate graph source backed smoke title',
    )
    expect(generatedJson.nodes).toHaveLength(todoAppPbeRunStructureOnlyProfile.expectedCounts.nodes)
    expect(generatedJson.edges).toHaveLength(todoAppPbeRunStructureOnlyProfile.expectedCounts.edges)
    expect(generatedJson.coreViewCoverage).toHaveLength(coreViews.length)
    expect(generatedJson.sourceAuthorityBoundary).toContain('structure-only')
    expect(generatedJson.nonPromotionStatement).toContain('does not change source authority')
  })

  it('validates the structure-only fixture without Todo Search generated, manual parity, or pilot marker artifacts', async () => {
    const workspace = await createExampleWorkspace()
    await generateReadModelEvidence(workspace, 'examples/valid/todo-app-pbe-run')
    await rm(join(workspace, 'examples/adoption/todo-search-slice'), { recursive: true, force: true })

    const result = await validateReadModelEvidence(workspace, 'examples/valid/todo-app-pbe-run')
    const report = JSON.parse(await readFile(result.reportJsonPath, 'utf8')) as {
      status: string
      summary: { checkCount: number; blockingCount: number; decisionRequiredCount: number }
      metadata: {
        policyLevel?: string
        parityRequirement?: Record<string, unknown>
        pilotMarkerRequirement?: Record<string, unknown>
      }
    }

    expect(report.status).toBe('validation-pass')
    expect(report.summary.checkCount).toBe(todoAppPbeRunStructureOnlyProfile.expectedCounts.validationChecks)
    expect(report.summary.blockingCount).toBe(0)
    expect(report.summary.decisionRequiredCount).toBe(0)
    expect(report.metadata.policyLevel).toBe('structure-only')
    expect(report.metadata.parityRequirement).toMatchObject({ required: false, status: 'not-required' })
    expect(report.metadata.pilotMarkerRequirement).toMatchObject({ required: false, status: 'not-required' })
  })

  it('validates Todo Search without depending on the Todo App generated directory', async () => {
    const workspace = await createExampleWorkspace()
    const generated = await generateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    await compareReadModelEvidence(
      workspace,
      generated.generatedJsonPath,
      'examples/adoption/todo-search-slice/maintainability-graph-read-model.json',
    )
    await rm(join(workspace, 'examples/valid/todo-app-pbe-run/generated'), { recursive: true, force: true })

    const result = await validateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    const report = JSON.parse(await readFile(result.reportJsonPath, 'utf8')) as {
      status: string
      summary: { checkCount: number; blockingCount: number; decisionRequiredCount: number }
      metadata: {
        policyLevel?: string
        parityRequirement?: Record<string, unknown>
        pilotMarkerRequirement?: Record<string, unknown>
      }
    }

    expect(report.status).toBe('validation-pass')
    expect(report.summary.checkCount).toBe(todoSearchReadModelProfile.expectedCounts.validationChecks)
    expect(report.summary.blockingCount).toBe(0)
    expect(report.summary.decisionRequiredCount).toBe(0)
    expect(report.metadata.policyLevel).toBe('pilot-marker-backed')
    expect(report.metadata.parityRequirement).toMatchObject({ required: true, status: 'pass' })
    expect(report.metadata.pilotMarkerRequirement).toMatchObject({ required: true, status: 'present' })
  })

  it('summarizes independent per-slice validation reports as aggregate-pass Evidence', async () => {
    const workspace = await createExampleWorkspace()
    await prepareTwoSliceValidationReports(workspace)

    const result = await summarizeReadModelEvidence(workspace, [
      'examples/adoption/todo-search-slice',
      'examples/valid/todo-app-pbe-run',
    ])
    const summary = JSON.parse(await readFile(result.summaryJsonPath, 'utf8')) as {
      status: string
      metadata: { sourceMode: string }
      summary: {
        sliceCount: number
        warningCount: number
        blockingCount: number
        decisionRequiredCount: number
      }
      perSliceSummaries: Array<{
        sourceSlice: string
        profileId: string
        policyLevel: string
        validationStatus: string
        checkCount: number
        parityRequirement: Record<string, unknown>
        pilotMarkerRequirement: Record<string, unknown>
        runtimeFixtureRequirement: Record<string, unknown>
      }>
      aggregateBoundary: string
      nonPromotionStatement: string
    }

    expect(summary.status).toBe('aggregate-pass')
    expect(summary.metadata.sourceMode).toBe('existing-per-slice-validation-reports-only')
    expect(summary.summary.sliceCount).toBe(2)
    expect(summary.summary.warningCount).toBe(0)
    expect(summary.summary.blockingCount).toBe(0)
    expect(summary.summary.decisionRequiredCount).toBe(0)
    expect(summary.aggregateBoundary).toContain('Evidence-only')
    expect(summary.nonPromotionStatement).toContain('not user acceptance')
    expect(summary.perSliceSummaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceSlice: 'examples/adoption/todo-search-slice',
          profileId: todoSearchReadModelProfile.profileId,
          policyLevel: 'pilot-marker-backed',
          validationStatus: 'validation-pass',
          checkCount: todoSearchReadModelProfile.expectedCounts.validationChecks,
          parityRequirement: expect.objectContaining({ required: true, status: 'pass' }),
          pilotMarkerRequirement: expect.objectContaining({ required: true, status: 'present' }),
          runtimeFixtureRequirement: expect.objectContaining({ required: true, status: 'present' }),
        }),
        expect.objectContaining({
          sourceSlice: 'examples/valid/todo-app-pbe-run',
          profileId: todoAppPbeRunStructureOnlyProfile.profileId,
          policyLevel: 'structure-only',
          validationStatus: 'validation-pass',
          checkCount: todoAppPbeRunStructureOnlyProfile.expectedCounts.validationChecks,
          parityRequirement: expect.objectContaining({ required: false, status: 'not-required' }),
          pilotMarkerRequirement: expect.objectContaining({ required: false, status: 'not-required' }),
          runtimeFixtureRequirement: expect.objectContaining({ required: false, status: 'attached-evidence-only' }),
        }),
      ]),
    )
  })

  it('calculates aggregate warning status from report summaries', async () => {
    const workspace = await createAggregateReportWorkspace()
    await mutateValidationReport(workspace, 'examples/valid/todo-app-pbe-run', 'validation-warning', 'warningCount', 1)

    const result = await summarizeReadModelEvidence(workspace, [
      'examples/adoption/todo-search-slice',
      'examples/valid/todo-app-pbe-run',
    ])

    expect(result.summary.status).toBe('aggregate-warning')
  })

  it('calculates aggregate blocked status from report summaries', async () => {
    const workspace = await createAggregateReportWorkspace()
    await mutateValidationReport(workspace, 'examples/valid/todo-app-pbe-run', 'validation-blocked', 'blockingCount', 1)

    const result = await summarizeReadModelEvidence(workspace, [
      'examples/adoption/todo-search-slice',
      'examples/valid/todo-app-pbe-run',
    ])

    expect(result.summary.status).toBe('aggregate-blocked')
  })

  it('calculates aggregate decision-required status from report summaries', async () => {
    const workspace = await createAggregateReportWorkspace()
    await mutateValidationReport(
      workspace,
      'examples/valid/todo-app-pbe-run',
      'decision-required',
      'decisionRequiredCount',
      1,
    )

    const result = await summarizeReadModelEvidence(workspace, [
      'examples/adoption/todo-search-slice',
      'examples/valid/todo-app-pbe-run',
    ])

    expect(result.summary.status).toBe('decision-required')
  })

  it('does not mutate per-slice validation reports while writing an aggregate summary', async () => {
    const workspace = await createExampleWorkspace()
    await prepareTwoSliceValidationReports(workspace)
    const reportPaths = [
      join(workspace, 'examples/adoption/todo-search-slice/generated/read-model-validation-report.json'),
      join(workspace, 'examples/valid/todo-app-pbe-run/generated/read-model-validation-report.json'),
    ]
    const before = await Promise.all(reportPaths.map((entry) => readFile(entry, 'utf8')))

    await summarizeReadModelEvidence(workspace, [
      'examples/adoption/todo-search-slice',
      'examples/valid/todo-app-pbe-run',
    ])
    const after = await Promise.all(reportPaths.map((entry) => readFile(entry, 'utf8')))

    expect(after).toEqual(before)
  })

  it('summarizes from validation reports only without reading generated read-model files', async () => {
    const workspace = await createExampleWorkspace()
    await prepareTwoSliceValidationReports(workspace)
    await rm(join(workspace, 'examples/adoption/todo-search-slice/generated/generated-read-model.json'), {
      force: true,
    })
    await rm(join(workspace, 'examples/valid/todo-app-pbe-run/generated/generated-read-model.json'), { force: true })

    const result = await summarizeReadModelEvidence(workspace, [
      'examples/adoption/todo-search-slice',
      'examples/valid/todo-app-pbe-run',
    ])

    expect(result.summary.status).toBe('aggregate-pass')
    expect(result.summary.metadata.sourceMode).toBe('existing-per-slice-validation-reports-only')
  })

  it('reports aggregate-blocked for missing or malformed per-slice validation reports', async () => {
    const missingWorkspace = await createAggregateReportWorkspace()
    await rm(join(missingWorkspace, 'examples/valid/todo-app-pbe-run/generated/read-model-validation-report.json'), {
      force: true,
    })

    const missingResult = await summarizeReadModelEvidence(missingWorkspace, [
      'examples/adoption/todo-search-slice',
      'examples/valid/todo-app-pbe-run',
    ])

    expect(missingResult.summary.status).toBe('aggregate-blocked')
    expect(
      missingResult.summary.perSliceSummaries.find((entry) => entry.sourceSlice === 'examples/valid/todo-app-pbe-run')
        ?.reportStatus,
    ).toBe('missing')

    const malformedWorkspace = await createAggregateReportWorkspace()
    await writeFile(
      join(malformedWorkspace, 'examples/valid/todo-app-pbe-run/generated/read-model-validation-report.json'),
      '{not-json',
    )

    const malformedResult = await summarizeReadModelEvidence(malformedWorkspace, [
      'examples/adoption/todo-search-slice',
      'examples/valid/todo-app-pbe-run',
    ])

    expect(malformedResult.summary.status).toBe('aggregate-blocked')
    expect(
      malformedResult.summary.perSliceSummaries.find((entry) => entry.sourceSlice === 'examples/valid/todo-app-pbe-run')
        ?.reportStatus,
    ).toBe('malformed')
  })

  it('blocks validation when viewScopedTags or Core View coverage are invalid', async () => {
    const workspace = await createExampleWorkspace()
    const generated = await generateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    await compareReadModelEvidence(
      workspace,
      generated.generatedJsonPath,
      'examples/adoption/todo-search-slice/maintainability-graph-read-model.json',
    )
    const generatedJson = JSON.parse(await readFile(generated.generatedJsonPath, 'utf8')) as {
      nodes: Array<{ viewScopedTags?: string[] }>
      coreViewCoverage: unknown[]
    }
    generatedJson.nodes[0].viewScopedTags = [...(generatedJson.nodes[0].viewScopedTags || []), 'intent-view']
    generatedJson.coreViewCoverage = generatedJson.coreViewCoverage.slice(0, -1)
    await writeFile(generated.generatedJsonPath, JSON.stringify(generatedJson, null, 2))

    const result = await validateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    const report = JSON.parse(await readFile(result.reportJsonPath, 'utf8')) as {
      status: string
      summary: { blockingCount: number }
      checks: Array<{ id: string; status: string }>
    }

    expect(report.status).toBe('validation-blocked')
    expect(report.summary.blockingCount).toBeGreaterThanOrEqual(2)
    expect(report.checks.find((entry) => entry.id === 'view-scoped-tags-allowed')?.status).toBe('blocking')
    expect(report.checks.find((entry) => entry.id === 'core-view-coverage-present')?.status).toBe('blocking')
  })

  it('blocks validation from the durable invalid viewScopedTags fixture without enrolling it in validate-all', async () => {
    const workspace = await createExampleWorkspace()
    const invalidFixturePath = resolve(
      'examples/invalid/read-model-invalid-view-scoped-tags/fixtures/invalid-generated-read-model.json',
    )
    const positiveGeneratedPath = resolve('examples/valid/todo-app-pbe-run/generated/generated-read-model.json')
    const registryPath = resolve('examples/read-model-aggregate/read-model-slices.json')
    const positiveGeneratedBefore = await readFile(positiveGeneratedPath, 'utf8')
    const registryBefore = await readFile(registryPath, 'utf8')

    const generated = await generateReadModelEvidence(workspace, 'examples/valid/todo-app-pbe-run')
    await writeFile(generated.generatedJsonPath, await readFile(invalidFixturePath, 'utf8'))

    const result = await validateReadModelEvidence(workspace, 'examples/valid/todo-app-pbe-run')
    const report = JSON.parse(await readFile(result.reportJsonPath, 'utf8')) as {
      status: string
      summary: { blockingCount: number }
      checks: Array<{ id: string; status: string; message: string }>
    }
    const workspaceRegistry = JSON.parse(
      await readFile(join(workspace, 'examples/read-model-aggregate/read-model-slices.json'), 'utf8'),
    ) as { profiles: Array<{ sourceSlice: string }> }

    expect(report.status).toBe('validation-blocked')
    expect(report.summary.blockingCount).toBeGreaterThanOrEqual(1)
    expect(report.checks.find((entry) => entry.id === 'view-scoped-tags-allowed')).toMatchObject({
      status: 'blocking',
    })
    expect(report.checks.find((entry) => entry.id === 'view-scoped-tags-allowed')?.message).toContain(
      'semantic-authority',
    )
    expect(workspaceRegistry.profiles.some((entry) => entry.sourceSlice.startsWith('examples/invalid/'))).toBe(false)
    expect(await readFile(positiveGeneratedPath, 'utf8')).toBe(positiveGeneratedBefore)
    expect(await readFile(registryPath, 'utf8')).toBe(registryBefore)
  })

  it('blocks validation from the durable missing Core View fixture without enrolling it in validate-all', async () => {
    const workspace = await createExampleWorkspace()
    const invalidFixturePath = resolve(
      'examples/invalid/read-model-core-view-missing/fixtures/invalid-generated-read-model.json',
    )
    const positiveGeneratedPath = resolve('examples/valid/todo-app-pbe-run/generated/generated-read-model.json')
    const registryPath = resolve('examples/read-model-aggregate/read-model-slices.json')
    const positiveGeneratedBefore = await readFile(positiveGeneratedPath, 'utf8')
    const registryBefore = await readFile(registryPath, 'utf8')

    const generated = await generateReadModelEvidence(workspace, 'examples/valid/todo-app-pbe-run')
    await writeFile(generated.generatedJsonPath, await readFile(invalidFixturePath, 'utf8'))

    const result = await validateReadModelEvidence(workspace, 'examples/valid/todo-app-pbe-run')
    const report = JSON.parse(await readFile(result.reportJsonPath, 'utf8')) as {
      status: string
      summary: { blockingCount: number }
      checks: Array<{ id: string; status: string; message: string }>
    }
    const workspaceRegistry = JSON.parse(
      await readFile(join(workspace, 'examples/read-model-aggregate/read-model-slices.json'), 'utf8'),
    ) as { profiles: Array<{ sourceSlice: string }> }

    expect(report.status).toBe('validation-blocked')
    expect(report.summary.blockingCount).toBeGreaterThanOrEqual(1)
    expect(report.checks.find((entry) => entry.id === 'view-scoped-tags-allowed')).toMatchObject({
      status: 'pass',
    })
    expect(report.checks.find((entry) => entry.id === 'core-view-coverage-present')).toMatchObject({
      status: 'blocking',
    })
    expect(report.checks.find((entry) => entry.id === 'core-view-coverage-present')?.message).toContain(
      'Evidence / Acceptance View',
    )
    expect(workspaceRegistry.profiles.some((entry) => entry.sourceSlice.startsWith('examples/invalid/'))).toBe(false)
    expect(await readFile(positiveGeneratedPath, 'utf8')).toBe(positiveGeneratedBefore)
    expect(await readFile(registryPath, 'utf8')).toBe(registryBefore)
  })

  it('blocks active scoped validation when parity is not comparison-pass', async () => {
    const workspace = await createExampleWorkspace()
    const generated = await generateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    const parity = await compareReadModelEvidence(
      workspace,
      generated.generatedJsonPath,
      'examples/adoption/todo-search-slice/maintainability-graph-read-model.json',
    )
    const parityJson = JSON.parse(await readFile(parity.reportJsonPath, 'utf8')) as {
      summary: { status: string; mismatchCount: number }
    }
    parityJson.summary.status = 'comparison-warning'
    parityJson.summary.mismatchCount = 1
    await writeFile(parity.reportJsonPath, JSON.stringify(parityJson, null, 2))

    const result = await validateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    const report = JSON.parse(await readFile(result.reportJsonPath, 'utf8')) as {
      status: string
      checks: Array<{ id: string; status: string }>
    }

    expect(report.status).toBe('validation-blocked')
    expect(report.checks.find((entry) => entry.id === 'parity-status-pass')?.status).toBe('blocking')
    expect(report.checks.find((entry) => entry.id === 'parity-counts-zero')?.status).toBe('blocking')
  })

  it('blocks pilot-marker-backed validation when the scoped pilot marker is missing', async () => {
    const workspace = await createExampleWorkspace()
    const registryPath = resolve('examples/read-model-aggregate/read-model-slices.json')
    const markerPath = resolve(
      'examples/adoption/todo-search-slice/generated/scoped-source-authority-pilot-marker.json',
    )
    const registryBefore = await readFile(registryPath, 'utf8')
    const markerBefore = await readFile(markerPath, 'utf8')

    const generated = await generateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    const parity = await compareReadModelEvidence(
      workspace,
      generated.generatedJsonPath,
      'examples/adoption/todo-search-slice/maintainability-graph-read-model.json',
    )
    const workspaceMarkerPath = join(
      workspace,
      'examples/adoption/todo-search-slice/generated/scoped-source-authority-pilot-marker.json',
    )
    await rm(workspaceMarkerPath)

    const result = await validateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    const report = JSON.parse(await readFile(result.reportJsonPath, 'utf8')) as {
      status: string
      summary: { blockingCount: number }
      checks: Array<{ id: string; status: string; sourceRefs: string[] }>
    }
    const parityReport = JSON.parse(await readFile(parity.reportJsonPath, 'utf8')) as {
      summary: { status: string }
    }
    const workspaceRegistry = JSON.parse(
      await readFile(join(workspace, 'examples/read-model-aggregate/read-model-slices.json'), 'utf8'),
    ) as { profiles: Array<{ sourceSlice: string }> }

    expect(parityReport.summary.status).toBe('comparison-pass')
    expect(report.status).toBe('validation-blocked')
    expect(report.summary.blockingCount).toBeGreaterThanOrEqual(1)
    expect(report.checks.find((entry) => entry.id === 'parity-status-pass')).toMatchObject({ status: 'pass' })
    expect(report.checks.find((entry) => entry.id === 'pilot-marker-exists')).toMatchObject({
      status: 'blocking',
      sourceRefs: ['examples/adoption/todo-search-slice/generated/scoped-source-authority-pilot-marker.json'],
    })
    expect(workspaceRegistry.profiles.some((entry) => entry.sourceSlice.startsWith('examples/invalid/'))).toBe(false)
    expect(await readFile(registryPath, 'utf8')).toBe(registryBefore)
    expect(await readFile(markerPath, 'utf8')).toBe(markerBefore)
  })

  it('does not mutate generated, manual, parity, manifest, or marker inputs while writing validation reports', async () => {
    const workspace = await createExampleWorkspace()
    const generated = await generateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    const parity = await compareReadModelEvidence(
      workspace,
      generated.generatedJsonPath,
      'examples/adoption/todo-search-slice/maintainability-graph-read-model.json',
    )
    const manifestPath = join(
      workspace,
      'examples/adoption/todo-search-slice/generated/read-model-evidence-manifest.json',
    )
    const markerPath = join(
      workspace,
      'examples/adoption/todo-search-slice/generated/scoped-source-authority-pilot-marker.json',
    )
    const manualPath = join(workspace, 'examples/adoption/todo-search-slice/maintainability-graph-read-model.json')
    const before = await Promise.all(
      [generated.generatedJsonPath, parity.reportJsonPath, manifestPath, markerPath, manualPath].map((entry) =>
        readFile(entry, 'utf8'),
      ),
    )

    await validateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    const after = await Promise.all(
      [generated.generatedJsonPath, parity.reportJsonPath, manifestPath, markerPath, manualPath].map((entry) =>
        readFile(entry, 'utf8'),
      ),
    )

    expect(after).toEqual(before)
  })
})

async function createExampleWorkspace(): Promise<string> {
  const workspace = await mkdtemp(join(tmpdir(), 'pbe-read-model-'))
  workspaces.push(workspace)
  await Promise.all(exampleWorkspacePaths.map((entry) => copyWorkspacePath(entry, workspace)))
  return workspace
}

async function copyWorkspacePath(relativePath: string, workspace: string): Promise<void> {
  const destination = join(workspace, relativePath)
  await mkdir(dirname(destination), { recursive: true })
  await cp(resolve(relativePath), destination, { recursive: true })
}

async function readRegistryFixtureObject(): Promise<{
  sourceAuthorityBoundary?: string
  profiles: Array<{ profileId: string; policyLevel: string }>
}> {
  return JSON.parse(await readFile(resolve('examples/read-model-aggregate/read-model-slices.json'), 'utf8')) as {
    sourceAuthorityBoundary?: string
    profiles: Array<{ profileId: string; policyLevel: string }>
  }
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

async function mutateRegistry(
  workspace: string,
  mutate: (registry: {
    profiles: Array<{
      profileId: string
      sourceSlice: string
      requiredCommands: string[]
      expectedCounts: { nodes: number; edges: number; validationChecks: number }
      [key: string]: unknown
    }>
    [key: string]: unknown
  }) => void,
): Promise<void> {
  const registryPath = join(workspace, 'examples/read-model-aggregate/read-model-slices.json')
  const registry = JSON.parse(await readFile(registryPath, 'utf8')) as {
    profiles: Array<{
      profileId: string
      sourceSlice: string
      requiredCommands: string[]
      expectedCounts: { nodes: number; edges: number; validationChecks: number }
      [key: string]: unknown
    }>
    [key: string]: unknown
  }
  mutate(registry)
  await writeFile(registryPath, JSON.stringify(registry, null, 2))
}

async function createAggregateReportWorkspace(): Promise<string> {
  const workspace = await mkdtemp(join(tmpdir(), 'pbe-read-model-aggregate-'))
  workspaces.push(workspace)
  await writeValidationReportFixture(
    workspace,
    'examples/adoption/todo-search-slice',
    todoSearchReadModelProfile.profileId,
    'pilot-marker-backed',
    'flat-demo-support',
    todoSearchReadModelProfile.expectedCounts.validationChecks,
    {
      parityRequirement: { required: true, status: 'pass' },
      pilotMarkerRequirement: { required: true, status: 'present' },
      runtimeFixtureRequirement: { required: true, status: 'present' },
      retainedWarnings: [
        {
          id: 'RW-BOUNDED-FIXTURE',
          status: 'acceptable-warning',
          summary: 'Bounded fixture Evidence is not full Todo app implementation.',
        },
      ],
    },
  )
  await writeValidationReportFixture(
    workspace,
    'examples/valid/todo-app-pbe-run',
    todoAppPbeRunStructureOnlyProfile.profileId,
    'structure-only',
    'canonical-pbe',
    todoAppPbeRunStructureOnlyProfile.expectedCounts.validationChecks,
    {
      parityRequirement: { required: false, status: 'not-required' },
      pilotMarkerRequirement: { required: false, status: 'not-required' },
      runtimeFixtureRequirement: { required: false, status: 'attached-evidence-only' },
      retainedWarnings: [
        {
          id: 'RW-STRUCTURE-ONLY',
          status: 'structure-only-limitation',
          summary: 'Structure-only validation does not require parity or pilot marker artifacts.',
        },
      ],
    },
  )
  return workspace
}

async function writeValidationReportFixture(
  workspace: string,
  slice: string,
  profileId: string,
  policyLevel: string,
  sourceLayout: string,
  checkCount: number,
  options: {
    parityRequirement: Record<string, unknown>
    pilotMarkerRequirement: Record<string, unknown>
    runtimeFixtureRequirement: Record<string, unknown>
    retainedWarnings: Array<Record<string, unknown>>
  },
): Promise<void> {
  const reportDir = join(workspace, slice, 'generated')
  await mkdir(reportDir, { recursive: true })
  const report = {
    version: '0.1.0-read-model-validation-report',
    metadata: {
      sourceSlice: slice,
      profileId,
      sliceProfile: profileId,
      sourceLayout,
      policyLevel,
      evidenceLevel: 'validator-backed',
      scopeLevel: 'scoped-slice-validation',
      parityRequirement: options.parityRequirement,
      pilotMarkerRequirement: options.pilotMarkerRequirement,
      runtimeFixtureRequirement: options.runtimeFixtureRequirement,
    },
    status: 'validation-pass',
    evidenceLevel: 'validator-backed',
    scopeLevel: 'scoped-slice-validation',
    sourceAuthorityBoundary: `Validator-backed Evidence checks ${slice} only. It does not change source authority.`,
    nonPromotionStatement: 'Validation pass is Evidence only and does not approve promotion or user acceptance.',
    summary: {
      checkCount,
      passCount: checkCount,
      warningCount: 0,
      blockingCount: 0,
      decisionRequiredCount: 0,
      status: 'validation-pass',
    },
    checks: [],
    retainedWarnings: options.retainedWarnings,
    fallbackReferenceStatus: [],
    sliceValidationContract: {
      reportUnit: 'per-slice-validation-report',
      sourceSlice: slice,
      profileId,
      sourceLayout,
      policyLevel,
      evidenceLevel: 'validator-backed',
      scopeLevel: 'scoped-slice-validation',
      parityRequirement: options.parityRequirement,
      pilotMarkerRequirement: options.pilotMarkerRequirement,
      runtimeFixtureRequirement: options.runtimeFixtureRequirement,
      retainedWarnings: options.retainedWarnings,
      sourceAuthorityBoundary: `Validator-backed Evidence checks ${slice} only. It does not change source authority.`,
      nonPromotionStatement: 'Validation pass is Evidence only and does not approve promotion or user acceptance.',
      crossSliceDependencyRule:
        'Validation uses the target slice profile, generated artifacts, and declared source inputs only.',
    },
    recommendedNextDecisionSurface: [],
  }
  await writeFile(join(reportDir, 'read-model-validation-report.json'), JSON.stringify(report, null, 2))
}

async function prepareTwoSliceValidationReports(workspace: string): Promise<void> {
  const todoSearch = await generateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
  await compareReadModelEvidence(
    workspace,
    todoSearch.generatedJsonPath,
    'examples/adoption/todo-search-slice/maintainability-graph-read-model.json',
  )
  await validateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
  await generateReadModelEvidence(workspace, 'examples/valid/todo-app-pbe-run')
  await validateReadModelEvidence(workspace, 'examples/valid/todo-app-pbe-run')
}

async function mutateValidationReport(
  workspace: string,
  slice: string,
  validationStatus: string,
  countField: string,
  count: number,
): Promise<void> {
  const reportPath = join(workspace, slice, 'generated/read-model-validation-report.json')
  const report = JSON.parse(await readFile(reportPath, 'utf8')) as {
    status: string
    summary: Record<string, unknown>
  }
  report.status = validationStatus
  report.summary.status = validationStatus
  report.summary[countField] = count
  await writeFile(reportPath, JSON.stringify(report, null, 2))
}
