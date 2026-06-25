import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { compareReadModelEvidence, generateReadModelEvidence } from '../core/read-model-evidence'

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
  afterEach(async () => {
    await Promise.all(workspaces.splice(0).map((workspace) => rm(workspace, { recursive: true, force: true })))
  })

  it('generates bounded read-model Evidence with source authority boundaries', async () => {
    const workspace = await createExampleWorkspace()

    const result = await generateReadModelEvidence(workspace, 'examples/adoption/todo-search-slice')
    const generated = JSON.parse(await readFile(result.generatedJsonPath, 'utf8')) as {
      nodes: Array<{ viewScopedTags?: string[]; includedInViewIds?: string[] }>
      coreViewCoverage: Array<{ name: string; viewScopedTags?: string[] }>
      sourceAuthorityBoundary: string
      nonPromotionStatement: string
    }

    expect(generated.sourceAuthorityBoundary).toContain('Tree-native selected-slice artifacts')
    expect(generated.nonPromotionStatement).toContain('cannot change source authority')
    expect(generated.coreViewCoverage.map((entry) => entry.name)).toEqual(coreViews)
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
})

async function createExampleWorkspace(): Promise<string> {
  const workspace = await mkdtemp(join(tmpdir(), 'pbe-read-model-'))
  workspaces.push(workspace)
  await cp(resolve('examples'), join(workspace, 'examples'), { recursive: true })
  return workspace
}
