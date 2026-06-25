import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  compareReadModelEvidence,
  generateReadModelEvidence,
  getSliceReadModelProfile,
  todoSearchReadModelProfile,
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
      sourceAuthorityBoundary: string
      nonPromotionStatement: string
    }

    expect(report.status).toBe('validation-pass')
    expect(report.evidenceLevel).toBe('validator-backed')
    expect(report.summary.checkCount).toBe(todoSearchReadModelProfile.expectedCounts.validationChecks)
    expect(report.summary.blockingCount).toBe(0)
    expect(report.summary.decisionRequiredCount).toBe(0)
    expect(report.sourceAuthorityBoundary).toContain('does not change source authority')
    expect(report.nonPromotionStatement).toContain('Validation pass is Evidence only')
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
