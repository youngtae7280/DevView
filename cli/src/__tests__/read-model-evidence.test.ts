import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  buildReadModelRegistryCommandPlans,
  compareReadModelEvidence,
  generateReadModelEvidence,
  getSliceReadModelProfile,
  loadReadModelSliceRegistry,
  normalizeReadModelSliceRegistry,
  summarizeReadModelEvidence,
  todoAppPbeRunStructureOnlyProfile,
  todoSearchReadModelProfile,
  validateAllReadModelEvidence,
  validateReadModelEvidence,
} from '../core/read-model-evidence'

const workspaces: string[] = []
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

  it('parses and normalizes the candidate read-model slice registry fixture', async () => {
    const registry = await loadReadModelSliceRegistry(resolve('.'))

    expect(registry.schemaVersion).toBe(1)
    expect(registry.registryRole).toBe('read-model-slice-registry-fixture')
    expect(registry.status).toBe('candidate-not-consumed-by-cli')
    expect(registry.sourceAuthorityBoundary).toContain('execution metadata')
    expect(registry.nonPromotionStatement).toContain('not Graph-source promotion')
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
      evidenceManifest: todoSearchReadModelProfile.artifacts.evidenceManifest,
      parityReport: todoSearchReadModelProfile.artifacts.generatedParityReport,
      validationReport: todoSearchReadModelProfile.artifacts.validationReport,
      scopedPilotMarker: todoSearchReadModelProfile.artifacts.scopedPilotMarker,
    })

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
  })

  it('builds command plans from registry metadata without executing commands', async () => {
    const registry = await loadReadModelSliceRegistry(resolve('.'))

    const plans = buildReadModelRegistryCommandPlans(registry)

    expect(plans).toEqual([
      {
        profileId: todoSearchReadModelProfile.profileId,
        sourceSlice: todoSearchReadModelProfile.supportedSlice,
        policyLevel: 'pilot-marker-backed',
        commands: ['generate', 'compare', 'validate'],
      },
      {
        profileId: todoAppPbeRunStructureOnlyProfile.profileId,
        sourceSlice: todoAppPbeRunStructureOnlyProfile.supportedSlice,
        policyLevel: 'structure-only',
        commands: ['generate', 'validate'],
      },
    ])
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
    expect(todoSearch?.commands.map((entry) => entry.command)).toEqual(['generate', 'compare', 'validate'])
    expect(todoSearch?.commands.find((entry) => entry.command === 'compare')).toMatchObject({
      status: 'comparison-pass',
      mismatchCount: 0,
    })
    expect(todoApp?.commands.map((entry) => entry.command)).toEqual(['generate', 'validate'])
    expect(todoApp?.commands.some((entry) => entry.command === 'compare')).toBe(false)
    expect(todoApp?.policyLevel).toBe('structure-only')
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
      metadata: { sliceProfile?: string }
      sourceAuthorityBoundary: string
      nonPromotionStatement: string
    }

    expect(generated.sourceAuthorityBoundary).toContain('Tree-native selected-slice artifacts')
    expect(generated.nonPromotionStatement).toContain('cannot change source authority')
    expect(generated.coreViewCoverage.map((entry) => entry.name)).toEqual(coreViews)
    expect(generated.nodes).toHaveLength(todoSearchReadModelProfile.expectedCounts.nodes)
    expect(generated.edges).toHaveLength(todoSearchReadModelProfile.expectedCounts.edges)
    expect(generated.metadata.sliceProfile).toBe(todoSearchReadModelProfile.profileId)
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
      metadata: { slicePolicyLevel?: string; sliceProfile?: string }
      coreViewCoverage: Array<{ name: string; viewScopedTags?: string[] }>
      sourceAuthorityBoundary: string
      nonPromotionStatement: string
    }

    expect(generatedJson.metadata.sliceProfile).toBe(todoAppPbeRunStructureOnlyProfile.profileId)
    expect(generatedJson.metadata.slicePolicyLevel).toBe('structure-only')
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
  await cp(resolve('examples'), join(workspace, 'examples'), { recursive: true })
  await cp(resolve('docs'), join(workspace, 'docs'), { recursive: true })
  return workspace
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
