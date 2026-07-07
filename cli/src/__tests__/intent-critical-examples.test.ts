import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app.js'

interface IntentCriticalExample {
  schemaVersion: number
  artifactRole: string
  exampleKind: 'native-devview' | 'retrofit-devview'
  status: string
  sourceMode: string
  sourceSlice: string
  maintenanceScenario: string
  vibeCodingRisk: string
  intentRecords: Array<{
    id: string
    intentType: string
    statement: string
    maintenanceRiskIfMissing: string
    preservationRule: string
    nonGoal: string
    fallbackReason: string
    evidenceReason: string
    compatibilityReason: string
    edgeIntent: {
      edgeType: string
      intentKind: string
      riskKind: string
      claim: string
      confidence: string
      enforcement: string
      anchors: Array<{
        signalKind: string
        sourceRole: string
        artifact: string
      }>
    }
  }>
  readModelIntentFields: {
    required: string[]
    projectionBoundary: string
  }
  boundaries: {
    sourceAuthorityBoundary: string
    nonPromotionStatement: string
    userAcceptanceBoundary: string
  }
}

interface EdgeIntentProjection {
  schemaVersion: number
  artifactRole: string
  projectionStatus: string
  sourceArtifact: string
  sourceExampleKind: 'native-devview' | 'retrofit-devview'
  projectionBoundary: string
  edgeIntentProjections: Array<{
    sourceIntentRecordId: string
    edgeType: string
    intentKind: string
    riskKind: string
    claim: string
    confidence: string
    enforcement: string
    anchors: Array<{
      signalKind: string
      sourceRole: string
      artifact: string
    }>
    humanReadableSummary: string
  }>
  vocabularyBoundary: {
    classificationFields: string[]
    projectSpecificClaimField: string
    claimBoundary: string
  }
}

interface EdgeIntentProjectionReport {
  status: 'intent-report-pass' | 'intent-report-blocked'
  projectedFixtureCount: number
  edgeIntentCount: number
  claimCount: number
  classificationCount: number
  anchorCount: number
  missingClassificationCount: number
  missingAnchorCount: number
  fixtures: Array<{
    graphSource: string
    sourceExampleKind: 'native-devview' | 'retrofit-devview' | 'unknown'
    status: 'intent-projection-pass' | 'intent-projection-blocked'
    edgeIntentCount: number
    claimCount: number
    classificationCount: number
    anchorCount: number
    missingClassificationCount: number
    missingAnchorCount: number
    claims: string[]
    error?: string
  }>
  nonEnforcementStatement: string
  requiredCheckBoundary: string
  validateAllBoundary: string
}

async function readIntentExample(path: string): Promise<IntentCriticalExample> {
  return JSON.parse(await readFile(resolve(path), 'utf8')) as IntentCriticalExample
}

async function readProjection(path: string): Promise<EdgeIntentProjection> {
  return JSON.parse(await readFile(resolve(path), 'utf8')) as EdgeIntentProjection
}

async function runProjectIntentCli(graphSource: string, output: string): Promise<EdgeIntentProjection> {
  const result = await runDevViewCli(
    ['graph', 'read-model', 'project-intent', '--graph-source', graphSource, '--output', output, '--json'],
    { cwd: resolve('.') },
  )
  expect(result.stderr).toBe('')
  expect(result.exitCode).toBe(0)
  const payload = JSON.parse(result.stdout) as {
    projection: string
    status: string
    edgeIntentProjections: EdgeIntentProjection['edgeIntentProjections']
  }
  expect(payload.status).toBe('intent-projection-pass')
  return readProjection(payload.projection)
}

async function runIntentReportCli(extraArgs: string[] = []): Promise<EdgeIntentProjectionReport> {
  const result = await runDevViewCli(['graph', 'read-model', 'report-intent', ...extraArgs, '--json'], {
    cwd: resolve('.'),
  })
  expect(result.stderr).toBe('')
  expect(result.exitCode).toBe(0)
  return JSON.parse(result.stdout) as EdgeIntentProjectionReport
}

function expectIntentPreservationFixture(example: IntentCriticalExample): void {
  expect(example.schemaVersion).toBe(1)
  expect(example.artifactRole).toBe('intent-critical-graph-source-example')
  expect(example.status).toBe('intent-preservation-fixture')
  expect(example.maintenanceScenario).toMatch(/maintainer/i)
  expect(example.vibeCodingRisk).toMatch(/AI-assisted|vibe/i)
  expect(example.intentRecords).toHaveLength(1)

  const [intent] = example.intentRecords
  expect(intent.id).toMatch(/^INTENT-/)
  expect(intent.statement.length).toBeGreaterThan(40)
  expect(intent.maintenanceRiskIfMissing).toMatch(/may|might|risk|breaking|loss/i)
  expect(intent.preservationRule).toMatch(/Do not|must|unless/i)
  expect(intent.nonGoal).toMatch(/Do not/i)
  expect(intent.fallbackReason).toMatch(/fallback|reference/i)
  expect(intent.evidenceReason).toMatch(/Evidence|check|validation|review/i)
  expect(intent.compatibilityReason).toMatch(/compatibility|Task-card|Retrofit|legacy|audit/i)
  expect(intent.edgeIntent.edgeType).toBe('preserves-intent')
  expect(intent.edgeIntent.intentKind).toMatch(/^[a-z-]+$/)
  expect(intent.edgeIntent.riskKind).toMatch(/^[a-z-]+$/)
  expect(intent.edgeIntent.claim.length).toBeGreaterThan(20)
  expect(intent.edgeIntent.claim).not.toBe(intent.statement)
  expect(intent.edgeIntent.confidence).toMatch(/user-confirmed|history-derived/)
  expect(intent.edgeIntent.enforcement).toMatch(/validation-evidence|review-required/)
  expect(intent.edgeIntent.anchors.length).toBeGreaterThanOrEqual(2)
  for (const anchor of intent.edgeIntent.anchors) {
    expect(anchor.signalKind).toMatch(/acceptance|evidence|compatibility|fallback/)
    expect(anchor.sourceRole).toMatch(/signal/)
    expect(anchor.artifact.length).toBeGreaterThan(5)
  }

  expect(example.readModelIntentFields.required).toContain('statement')
  expect(example.readModelIntentFields.required).toContain('maintenanceRiskIfMissing')
  expect(example.readModelIntentFields.required).toContain('preservationRule')
  expect(example.readModelIntentFields.projectionBoundary).toMatch(/Read-model projections/i)

  const boundaryText = [
    example.boundaries.sourceAuthorityBoundary,
    example.boundaries.nonPromotionStatement,
    example.boundaries.userAcceptanceBoundary,
  ].join(' ')
  expect(boundaryText).toMatch(/does not|not/i)
  expect(boundaryText).toMatch(/enforcement|required-check|tree retirement|retire|source authority/i)
  expect(boundaryText).toMatch(/Only the user/i)
}

function expectProjectionPreservesEdgeIntent(
  example: IntentCriticalExample,
  projection: EdgeIntentProjection,
  sourceArtifact: string,
): void {
  const [intent] = example.intentRecords
  const [projected] = projection.edgeIntentProjections

  expect(projection.schemaVersion).toBe(1)
  expect(projection.artifactRole).toBe('edge-intent-read-model-projection')
  expect(projection.projectionStatus).toBe('intent-projection-pass')
  expect(projection.sourceArtifact).toBe(sourceArtifact)
  expect(projection.sourceExampleKind).toBe(example.exampleKind)
  expect(projection.projectionBoundary).toContain('does not')
  expect(projection.edgeIntentProjections).toHaveLength(1)

  expect(projected.sourceIntentRecordId).toBe(intent.id)
  expect(projected.edgeType).toBe(intent.edgeIntent.edgeType)
  expect(projected.intentKind).toBe(intent.edgeIntent.intentKind)
  expect(projected.riskKind).toBe(intent.edgeIntent.riskKind)
  expect(projected.claim).toBe(intent.edgeIntent.claim)
  expect(projected.claim).not.toBe(projected.intentKind)
  expect(projected.claim).not.toBe(projected.riskKind)
  expect(projected.confidence).toBe(intent.edgeIntent.confidence)
  expect(projected.enforcement).toBe(intent.edgeIntent.enforcement)
  expect(projected.anchors).toEqual(intent.edgeIntent.anchors)
  expect(projected.humanReadableSummary).toContain(projected.claim)
  expect(projected.humanReadableSummary).toContain(projected.riskKind)
  expect(projected.humanReadableSummary).toContain(projected.confidence)
  expect(projected.humanReadableSummary).toContain(projected.enforcement)

  expect(projection.vocabularyBoundary.classificationFields).toEqual([
    'edgeType',
    'intentKind',
    'riskKind',
    'confidence',
    'enforcement',
    'anchors.signalKind',
  ])
  expect(projection.vocabularyBoundary.projectSpecificClaimField).toBe('claim')
  expect(projection.vocabularyBoundary.claimBoundary).toContain('not replaced by a global enum')
}

describe('intent-critical Graph-source examples', () => {
  it('records native DevView intent before maintenance can erase UX acceptance meaning', async () => {
    const example = await readIntentExample(
      'examples/internal-legacy/intent-critical/native-maintenance-legacy/graph-source-intent.json',
    )
    const projection = await readProjection(
      'examples/internal-legacy/intent-critical/native-maintenance-legacy/generated/edge-intent-read-model-projection.json',
    )

    expectIntentPreservationFixture(example)
    expectProjectionPreservesEdgeIntent(
      example,
      projection,
      'examples/internal-legacy/intent-critical/native-maintenance-legacy/graph-source-intent.json',
    )
    expect(example.exampleKind).toBe('native-devview')
    expect(example.sourceMode).toBe('graph-source-intent-first')
    expect(example.intentRecords[0].intentType).toBe('ux-acceptance-intent')
    expect(example.intentRecords[0].edgeIntent.intentKind).toBe('ux-acceptance')
    expect(example.intentRecords[0].edgeIntent.riskKind).toBe('behavior-regression')
    expect(example.intentRecords[0].edgeIntent.confidence).toBe('user-confirmed')
    expect(example.intentRecords[0].edgeIntent.enforcement).toBe('validation-evidence')
    expect(example.intentRecords[0].statement).toContain('empty')
    expect(example.intentRecords[0].statement).toContain('full list')
    expect(example.intentRecords[0].nonGoal).toContain('hides all todos')
  })

  it('records retrofit DevView recovered intent before cleanup can delete fallback compatibility evidence', async () => {
    const example = await readIntentExample(
      'examples/internal-legacy/intent-critical/retrofit-maintenance-legacy/graph-source-intent.json',
    )
    const projection = await readProjection(
      'examples/internal-legacy/intent-critical/retrofit-maintenance-legacy/generated/edge-intent-read-model-projection.json',
    )

    expectIntentPreservationFixture(example)
    expectProjectionPreservesEdgeIntent(
      example,
      projection,
      'examples/internal-legacy/intent-critical/retrofit-maintenance-legacy/graph-source-intent.json',
    )
    expect(example.exampleKind).toBe('retrofit-devview')
    expect(example.sourceMode).toBe('retrofit-intent-recovered')
    expect(example.intentRecords[0].intentType).toBe('compatibility-rollback-intent')
    expect(example.intentRecords[0].edgeIntent.intentKind).toBe('compatibility-retention')
    expect(example.intentRecords[0].edgeIntent.riskKind).toBe('fallback-loss')
    expect(example.intentRecords[0].edgeIntent.confidence).toBe('history-derived')
    expect(example.intentRecords[0].edgeIntent.enforcement).toBe('review-required')
    expect(example.intentRecords[0].statement).toContain('compatibility export')
    expect(example.intentRecords[0].preservationRule).toContain('explicit retirement decision')
    expect(example.intentRecords[0].nonGoal).toContain('permission to delete')
  })

  it('projects native and retrofit edgeIntent fixtures through the CLI without changing claim text', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'devview-intent-projection-'))
    try {
      const nativeGraphSource =
        'examples/internal-legacy/intent-critical/native-maintenance-legacy/graph-source-intent.json'
      const retrofitGraphSource =
        'examples/internal-legacy/intent-critical/retrofit-maintenance-legacy/graph-source-intent.json'
      const nativeCommittedProjection = await readProjection(
        'examples/internal-legacy/intent-critical/native-maintenance-legacy/generated/edge-intent-read-model-projection.json',
      )
      const retrofitCommittedProjection = await readProjection(
        'examples/internal-legacy/intent-critical/retrofit-maintenance-legacy/generated/edge-intent-read-model-projection.json',
      )

      const nativeProjected = await runProjectIntentCli(
        nativeGraphSource,
        join(tempRoot, 'native-edge-intent-read-model-projection.json'),
      )
      const retrofitProjected = await runProjectIntentCli(
        retrofitGraphSource,
        join(tempRoot, 'retrofit-edge-intent-read-model-projection.json'),
      )

      expect(nativeProjected).toEqual(nativeCommittedProjection)
      expect(retrofitProjected).toEqual(retrofitCommittedProjection)
      expect(nativeProjected.edgeIntentProjections[0].claim).toBe(
        'empty search restores the full list after the query is cleared',
      )
      expect(retrofitProjected.edgeIntentProjections[0].claim).toBe(
        'compatibility export remains until explicit retirement approval and replacement evidence',
      )
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('reports native and retrofit edgeIntent projection health without broad enforcement', async () => {
    const report = await runIntentReportCli()

    expect(report.status).toBe('intent-report-pass')
    expect(report.projectedFixtureCount).toBe(2)
    expect(report.edgeIntentCount).toBe(2)
    expect(report.claimCount).toBe(2)
    expect(report.classificationCount).toBeGreaterThanOrEqual(12)
    expect(report.anchorCount).toBeGreaterThanOrEqual(4)
    expect(report.missingClassificationCount).toBe(0)
    expect(report.missingAnchorCount).toBe(0)
    expect(report.nonEnforcementStatement).toContain('does not introduce CI enforcement')
    expect(report.requiredCheckBoundary).toContain('not a required check')
    expect(report.validateAllBoundary).toContain('separate from broad validate-all')

    const native = report.fixtures.find((fixture) => fixture.sourceExampleKind === 'native-devview')
    const retrofit = report.fixtures.find((fixture) => fixture.sourceExampleKind === 'retrofit-devview')
    expect(native?.status).toBe('intent-projection-pass')
    expect(retrofit?.status).toBe('intent-projection-pass')
    expect(native?.claims).toContain('empty search restores the full list after the query is cleared')
    expect(retrofit?.claims).toContain(
      'compatibility export remains until explicit retirement approval and replacement evidence',
    )
    expect(native?.claims[0]).not.toBe('ux-acceptance')
    expect(retrofit?.claims[0]).not.toBe('compatibility-retention')
  })

  it('blocks project-intent when vocabulary classification or anchors are missing', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'devview-intent-projection-invalid-'))
    try {
      const source = await readIntentExample(
        'examples/internal-legacy/intent-critical/native-maintenance-legacy/graph-source-intent.json',
      )
      delete (
        source.intentRecords[0].edgeIntent as Partial<IntentCriticalExample['intentRecords'][number]['edgeIntent']>
      ).riskKind
      source.intentRecords[0].edgeIntent.anchors = []
      const invalidPath = join(tempRoot, 'invalid-graph-source-intent.json')
      await writeFile(invalidPath, `${JSON.stringify(source, null, 2)}\n`, 'utf8')

      const result = await runDevViewCli(
        [
          'graph',
          'read-model',
          'project-intent',
          '--graph-source',
          invalidPath,
          '--output',
          join(tempRoot, 'projection.json'),
          '--json',
        ],
        { cwd: resolve('.') },
      )
      expect(result.exitCode).not.toBe(0)
      expect(result.stdout).toBe('')
      expect(result.stderr).toContain('riskKind')
      expect(result.stderr).toContain('anchors')
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('reports blocked intent projection summary when classification or anchors are missing', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'devview-intent-report-invalid-'))
    try {
      const source = await readIntentExample(
        'examples/internal-legacy/intent-critical/native-maintenance-legacy/graph-source-intent.json',
      )
      delete (
        source.intentRecords[0].edgeIntent as Partial<IntentCriticalExample['intentRecords'][number]['edgeIntent']>
      ).intentKind
      source.intentRecords[0].edgeIntent.anchors = []
      const invalidPath = join(tempRoot, 'invalid-graph-source-intent.json')
      await writeFile(invalidPath, `${JSON.stringify(source, null, 2)}\n`, 'utf8')

      const result = await runDevViewCli(
        ['graph', 'read-model', 'report-intent', '--graph-source', invalidPath, '--json'],
        { cwd: resolve('.') },
      )
      expect(result.exitCode).not.toBe(0)
      expect(result.stdout).toBe('')
      const report = JSON.parse(result.stderr) as EdgeIntentProjectionReport & { issues: unknown[] }
      expect(report.status).toBe('intent-report-blocked')
      expect(report.projectedFixtureCount).toBe(0)
      expect(report.missingClassificationCount).toBeGreaterThanOrEqual(1)
      expect(report.missingAnchorCount).toBe(1)
      expect(report.fixtures[0].status).toBe('intent-projection-blocked')
      expect(report.fixtures[0].error).toContain('intentKind')
      expect(report.fixtures[0].error).toContain('anchors')
      expect(report.issues).toHaveLength(1)
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })
})
