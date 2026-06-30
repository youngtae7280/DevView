import path from 'node:path'
import { relativePath, readJsonSafe, writeJsonAtomic, writeTextAtomic } from './fs.js'

type JsonObject = Record<string, any>

interface RetrofitGraphSource extends JsonObject {
  artifactRole: string
  status: string
  target?: {
    projectName?: string
    repoPath?: string
    sourcePath?: string
    upstream?: string
    observedSourceRef?: string
  }
  graphPolicy?: {
    nativeRetrofitModel?: string
    intentLocation?: string
    retrofitTruthRule?: string
    implementationRule?: string
  }
  records?: Array<{
    id: string
    path?: string
    expectedStatus?: string
    expectedActiveCodeState?: string
  }>
  nodes?: Array<{
    id: string
    kind?: string
    state?: string
    intentClaim?: string
    recordPath?: string
  }>
  edges?: Array<{
    id: string
    from?: string
    to?: string
    kind?: string
    edgeIntent?: {
      classifications?: string[]
      claim?: string
      confidence?: string
    }
  }>
}

export interface RetrofitPlanOptions {
  output?: string
  markdown?: string
}

export interface RetrofitPlanResult {
  status: 'retrofit-plan-pass'
  graphSourcePath: string
  target: {
    projectName?: string
    repoPath?: string
    sourcePath?: string
    upstream?: string
    observedSourceRef?: string
  }
  graphPolicy: {
    nativeRetrofitModel?: string
    intentLocation?: string
    retrofitTruthRule?: string
    implementationRule?: string
  }
  counts: {
    records: number
    nodes: number
    edges: number
    forbiddenBoundaries: number
    userConfirmedNodes: number
  }
  implementationReadyRecords: Array<{
    id: string
    path?: string
    expectedStatus?: string
    expectedActiveCodeState?: string
  }>
  retainedReferenceRecords: Array<{
    id: string
    path?: string
    expectedStatus?: string
    expectedActiveCodeState?: string
  }>
  forbiddenBoundaries: Array<{
    id: string
    state?: string
    intentClaim?: string
  }>
  edgeIntentSummary: {
    edgeIntentCount: number
    missingClaimCount: number
    missingClassificationCount: number
    confidenceValues: string[]
  }
  nextInputs: string[]
  outputPath?: string
  markdownPath?: string
  boundaries: {
    readsGraphSourceOnly: true
    mutatesTargetRepo: false
    appliesPatch: false
    claimsMaintainerIntent: false
  }
}

export async function buildRetrofitPlan(
  root: string,
  graphSourcePath: string,
  options: RetrofitPlanOptions = {},
): Promise<RetrofitPlanResult> {
  const resolvedGraphSourcePath = resolveRepoPath(root, graphSourcePath)
  const graphSource = await loadJson<RetrofitGraphSource>(resolvedGraphSourcePath)
  validateRetrofitGraphSource(graphSource, graphSourcePath)

  const nodes = graphSource.nodes || []
  const edges = graphSource.edges || []
  const records = graphSource.records || []
  const forbiddenBoundaries = nodes
    .filter((entry) => entry.kind === 'forbidden-flow-boundary')
    .map((entry) => ({ id: entry.id, state: entry.state, intentClaim: entry.intentClaim }))
  const implementationReadyRecords = records.filter(
    (entry) => entry.expectedActiveCodeState && !['reverted', 'not-applied'].includes(entry.expectedActiveCodeState),
  )
  const retainedReferenceRecords = records.filter((entry) =>
    ['reverted', 'not-applied'].includes(entry.expectedActiveCodeState || ''),
  )
  const edgeIntents = edges.map((entry) => entry.edgeIntent).filter(Boolean)
  const confidenceValues = Array.from(
    new Set(edgeIntents.map((entry) => entry?.confidence).filter((entry): entry is string => Boolean(entry))),
  ).sort()

  const result: RetrofitPlanResult = {
    status: 'retrofit-plan-pass',
    graphSourcePath: relativePath(root, resolvedGraphSourcePath),
    target: graphSource.target || {},
    graphPolicy: graphSource.graphPolicy || {},
    counts: {
      records: records.length,
      nodes: nodes.length,
      edges: edges.length,
      forbiddenBoundaries: forbiddenBoundaries.length,
      userConfirmedNodes: nodes.filter((entry) => entry.state?.includes('user-confirmed')).length,
    },
    implementationReadyRecords,
    retainedReferenceRecords,
    forbiddenBoundaries,
    edgeIntentSummary: {
      edgeIntentCount: edgeIntents.length,
      missingClaimCount: edgeIntents.filter((entry) => !entry?.claim).length,
      missingClassificationCount: edgeIntents.filter((entry) => !entry?.classifications?.length).length,
      confidenceValues,
    },
    nextInputs: buildNextInputs(implementationReadyRecords.length, forbiddenBoundaries.length),
    boundaries: {
      readsGraphSourceOnly: true,
      mutatesTargetRepo: false,
      appliesPatch: false,
      claimsMaintainerIntent: false,
    },
  }

  if (options.output) {
    const outputPath = resolveRepoPath(root, options.output)
    await writeJsonAtomic(outputPath, result)
    result.outputPath = relativePath(root, outputPath)
  }

  if (options.markdown) {
    const markdownPath = resolveRepoPath(root, options.markdown)
    await writeTextAtomic(markdownPath, renderRetrofitPlanMarkdown(result))
    result.markdownPath = relativePath(root, markdownPath)
  }

  return result
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(root, filePath)
}

async function loadJson<T>(filePath: string): Promise<T> {
  const result = await readJsonSafe<T>(filePath)
  if (!result.ok) {
    throw new Error(`Could not read JSON: ${filePath}: ${result.error}`)
  }
  return result.value
}

function validateRetrofitGraphSource(graphSource: RetrofitGraphSource, graphSourcePath: string): void {
  if (graphSource.artifactRole !== 'retrofit-graph-source-v0') {
    throw new Error(`Graph source must be retrofit-graph-source-v0: ${graphSourcePath}`)
  }
  if (graphSource.status !== 'active-retrofit-graph-source') {
    throw new Error(`Retrofit graph source must be active-retrofit-graph-source: ${graphSourcePath}`)
  }
  if (!Array.isArray(graphSource.records)) {
    throw new Error(`Retrofit graph source records must be an array: ${graphSourcePath}`)
  }
  if (!Array.isArray(graphSource.nodes)) {
    throw new Error(`Retrofit graph source nodes must be an array: ${graphSourcePath}`)
  }
  if (!Array.isArray(graphSource.edges)) {
    throw new Error(`Retrofit graph source edges must be an array: ${graphSourcePath}`)
  }
}

function buildNextInputs(readyRecordCount: number, forbiddenBoundaryCount: number): string[] {
  const inputs: string[] = []
  if (readyRecordCount === 0) {
    inputs.push('Add or select a user-confirmed change record before implementation.')
  }
  if (forbiddenBoundaryCount === 0) {
    inputs.push('Record forbidden flows/non-goals before implementation.')
  }
  inputs.push('Generate an instruction pack for one selected record before changing target code.')
  inputs.push(
    'After local changes, capture a graph delta and graph update proposal before applying graph-source status.',
  )
  return inputs
}

function renderRetrofitPlanMarkdown(result: RetrofitPlanResult): string {
  const lines = [
    '# Retrofit Plan',
    '',
    `Status: ${result.status}`,
    '',
    `Graph source: \`${result.graphSourcePath}\``,
    `Project: ${result.target.projectName || ''}`,
    `Source path: \`${result.target.sourcePath || ''}\``,
    '',
    '## Counts',
    '',
    `- Records: ${result.counts.records}`,
    `- Nodes: ${result.counts.nodes}`,
    `- Edges: ${result.counts.edges}`,
    `- Forbidden boundaries: ${result.counts.forbiddenBoundaries}`,
    `- Edge intents: ${result.edgeIntentSummary.edgeIntentCount}`,
    '',
    '## Implementation-Ready Records',
    '',
  ]

  for (const record of result.implementationReadyRecords) {
    lines.push(`- ${record.id}: ${record.expectedStatus || ''} / ${record.expectedActiveCodeState || ''}`)
  }
  if (result.implementationReadyRecords.length === 0) {
    lines.push('- none')
  }

  lines.push('', '## Forbidden Boundaries', '')
  for (const boundary of result.forbiddenBoundaries) {
    lines.push(`- ${boundary.id}: ${boundary.intentClaim || ''}`)
  }
  if (result.forbiddenBoundaries.length === 0) {
    lines.push('- none')
  }

  lines.push('', '## Next Inputs', '')
  for (const input of result.nextInputs) {
    lines.push(`- ${input}`)
  }

  lines.push(
    '',
    '## Boundaries',
    '',
    `- Reads graph-source only: ${result.boundaries.readsGraphSourceOnly}`,
    `- Mutates target repo: ${result.boundaries.mutatesTargetRepo}`,
    `- Applies patch: ${result.boundaries.appliesPatch}`,
    `- Claims maintainer intent: ${result.boundaries.claimsMaintainerIntent}`,
  )

  return `${lines.join('\n')}\n`
}
