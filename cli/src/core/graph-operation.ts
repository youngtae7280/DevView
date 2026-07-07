import { spawn } from 'node:child_process'
import path from 'node:path'
import { relativePath, readJsonSafe, writeJsonAtomic, writeTextAtomic } from './fs.js'

type JsonObject = Record<string, any>

interface GraphUpdateProposal extends JsonObject {
  artifactRole: string
  status: string
  graphDeltaPath: string
  sourceRecordId: string
  proposedRecordState?: {
    status?: string
    activeCodeState?: string
  }
  proposedNodeUpdates?: Array<{
    id: string
    currentState?: string
    proposedState?: string
    intentClaim?: string
  }>
  changedFiles?: Array<{
    path: string
    additions?: string | number
    deletions?: string | number
  }>
  boundaries?: {
    mutatesGraphSource?: boolean
    appliesPatch?: boolean
    requiresReviewBeforeApply?: boolean
    maintainerIntentClaimed?: boolean
  }
}

interface GraphDelta extends JsonObject {
  artifactRole: string
  status: string
  graphSourcePath: string
  sourceRecordId: string
}

interface GraphSource extends JsonObject {
  records?: Array<{
    id: string
    path: string
    expectedStatus?: string
    expectedActiveCodeState?: string
  }>
  nodes?: Array<{
    id: string
    state?: string
    intentClaim?: string
  }>
}

export interface GraphOperationApplyProposalOptions {
  apply?: boolean
  output?: string
  markdown?: string
}

export interface GraphOperationApplyProposalResult {
  status: 'graph-update-proposal-preview-pass' | 'graph-update-proposal-apply-pass'
  applied: boolean
  proposalPath: string
  graphDeltaPath: string
  graphSourcePath: string
  sourceRecordId: string
  changedFiles: Array<{ path: string; additions?: string | number; deletions?: string | number }>
  plannedChanges: Array<{
    target: 'node' | 'record'
    id: string
    field: string
    before: string | undefined
    after: string | undefined
  }>
  changeCount: number
  outputPath?: string
  markdownPath?: string
  boundaries: {
    mutatesGraphSource: false
    appliesPatch: false
    maintainerIntentClaimed: false
    requiresReviewBeforeApply: true
    graphSourceWritten: boolean
  }
}

export interface GraphOperationGeneratePackOptions {
  recordId: string
  output?: string
  markdown?: string
}

export interface GraphOperationGeneratePackResult {
  status: 'generated-from-graph-source'
  artifactRole: 'native-instruction-pack-v0' | 'retrofit-instruction-pack-v0'
  graphSourcePath: string
  sourceRecordId: string
  sourceRecordPath: string
  target: JsonObject
  userConfirmedIntent: JsonObject
  allowedScope: {
    files: string[]
    expectedFlow?: string
    includedBehavior: string[]
  }
  forbiddenScope: {
    flows: Array<{ flow?: string; reason?: string }>
    excludedBehavior: string[]
    nonGoals: string[]
  }
  graphContext: {
    nodes: Array<{ id: string; kind?: string; state?: string; intentClaim?: string }>
    edgeIntents: Array<{
      id: string
      from?: string
      to?: string
      kind?: string
      classifications: string[]
      claim?: string
      confidence?: string
    }>
  }
  verification: {
    required: {
      build?: string
      runtime?: string
      hardware?: string
    }
    finalState: JsonObject
  }
  executionBoundary: {
    mayModifyExternalProject: false
    requiresUserApprovalBeforeApplying: true
    sourceOfTruth: string
  }
  outputPath?: string
  markdownPath?: string
}

export interface GraphOperationCaptureDeltaOptions {
  instructionPackPath: string
  targetRepoPath: string
  output?: string
  markdown?: string
}

export interface GraphOperationCaptureDeltaResult {
  status: 'generated-from-target-diff'
  artifactRole: 'native-graph-delta-v0' | 'retrofit-graph-delta-v0'
  graphSourcePath: string
  instructionPackPath: string
  sourceRecordId: string
  targetRepoPath: string
  changedFiles: Array<{ path: string; additions?: string; deletions?: string }>
  dirtyFileCount: number
  allowedFileStatus: 'dirty-files-within-instruction-pack'
  graphUpdate: {
    relatedNodes: Array<{ id: string; kind?: string; state?: string; intentClaim?: string }>
    relatedEdgeIntents: GraphOperationGeneratePackResult['graphContext']['edgeIntents']
    finalState: JsonObject
  }
  boundaries: {
    appliesPatch: false
    upstreamPrCreated: false
    maintainerIntentClaimed: false
  }
  outputPath?: string
  markdownPath?: string
}

export interface GraphOperationProposeUpdateOptions {
  output?: string
  markdown?: string
}

export interface GraphOperationProposeUpdateResult {
  schemaVersion: 1
  artifactRole: 'devview-graph-update-proposal-v0'
  status: 'generated-from-graph-delta'
  graphDeltaPath: string
  sourceRecordId: string
  proposedRecordState: JsonObject
  proposedNodeUpdates: Array<{
    id: string
    currentState?: string
    proposedState?: string
    intentClaim?: string
  }>
  changedFiles: GraphOperationCaptureDeltaResult['changedFiles']
  edgeIntentSummary: GraphOperationGeneratePackResult['graphContext']['edgeIntents']
  boundaries: {
    mutatesGraphSource: false
    appliesPatch: false
    requiresReviewBeforeApply: true
    maintainerIntentClaimed: false
  }
  outputPath?: string
  markdownPath?: string
}

export async function applyGraphUpdateProposal(
  root: string,
  proposalPath: string,
  options: GraphOperationApplyProposalOptions = {},
): Promise<GraphOperationApplyProposalResult> {
  const resolvedProposalPath = resolveRepoPath(root, proposalPath)
  const proposal = await loadJson<GraphUpdateProposal>(resolvedProposalPath)
  validateProposal(proposal, proposalPath)

  const resolvedDeltaPath = resolveRepoPath(root, proposal.graphDeltaPath)
  const delta = await loadJson<GraphDelta>(resolvedDeltaPath)
  validateDelta(delta, proposal)

  const resolvedGraphSourcePath = resolveRepoPath(root, delta.graphSourcePath)
  const graphSource = await loadJson<GraphSource>(resolvedGraphSourcePath)
  validateGraphSource(graphSource, delta.graphSourcePath)

  const plannedChanges = buildPlannedChanges(graphSource, proposal)
  const applied = Boolean(options.apply)

  if (applied && plannedChanges.length > 0) {
    applyPlannedChanges(graphSource, plannedChanges)
    await writeJsonAtomic(resolvedGraphSourcePath, graphSource)
  }

  const result: GraphOperationApplyProposalResult = {
    status: applied ? 'graph-update-proposal-apply-pass' : 'graph-update-proposal-preview-pass',
    applied,
    proposalPath: relativePath(root, resolvedProposalPath),
    graphDeltaPath: relativePath(root, resolvedDeltaPath),
    graphSourcePath: relativePath(root, resolvedGraphSourcePath),
    sourceRecordId: proposal.sourceRecordId,
    changedFiles: proposal.changedFiles || [],
    plannedChanges,
    changeCount: plannedChanges.length,
    boundaries: {
      mutatesGraphSource: false,
      appliesPatch: false,
      maintainerIntentClaimed: false,
      requiresReviewBeforeApply: true,
      graphSourceWritten: applied && plannedChanges.length > 0,
    },
  }

  if (options.output) {
    const outputPath = resolveRepoPath(root, options.output)
    await writeJsonAtomic(outputPath, result)
    result.outputPath = relativePath(root, outputPath)
  }

  if (options.markdown) {
    const markdownPath = resolveRepoPath(root, options.markdown)
    await writeTextAtomic(markdownPath, renderGraphOperationProposalMarkdown(result))
    result.markdownPath = relativePath(root, markdownPath)
  }

  return result
}

export async function generateGraphInstructionPack(
  root: string,
  graphSourcePath: string,
  options: GraphOperationGeneratePackOptions,
): Promise<GraphOperationGeneratePackResult> {
  const resolvedGraphSourcePath = resolveRepoPath(root, graphSourcePath)
  const graphSource = await loadJson<any>(resolvedGraphSourcePath)
  validateOperationGraphSource(graphSource, graphSourcePath)

  const recordRef = graphSource.records.find((entry: any) => entry.id === options.recordId)
  if (!recordRef) {
    throw new Error(`Record id not found in graph source: ${options.recordId}`)
  }

  const resolvedRecordPath = resolveRepoPath(root, recordRef.path)
  const record = await loadJson<any>(resolvedRecordPath)
  if (record.status !== recordRef.expectedStatus) {
    throw new Error(`Record status mismatch: expected ${recordRef.expectedStatus}, got ${record.status}`)
  }
  if (record.finalState?.activeCodeState !== recordRef.expectedActiveCodeState) {
    throw new Error(
      `Record activeCodeState mismatch: expected ${recordRef.expectedActiveCodeState}, got ${record.finalState?.activeCodeState}`,
    )
  }

  const directEdges = graphSource.edges.filter(
    (entry: any) => entry.from === options.recordId || entry.to === options.recordId,
  )
  const relatedNodeIds = new Set<string>([options.recordId])
  for (const edge of directEdges) {
    if (edge.from) {
      relatedNodeIds.add(edge.from)
    }
    if (edge.to) {
      relatedNodeIds.add(edge.to)
    }
  }

  const result: GraphOperationGeneratePackResult = {
    status: 'generated-from-graph-source',
    artifactRole:
      graphSource.artifactRole === 'native-graph-source-v0'
        ? 'native-instruction-pack-v0'
        : 'retrofit-instruction-pack-v0',
    graphSourcePath: relativePath(root, resolvedGraphSourcePath),
    sourceRecordId: options.recordId,
    sourceRecordPath: recordRef.path,
    target: record.target || {},
    userConfirmedIntent: record.userConfirmedIntent || {},
    allowedScope: {
      files: asStringArray(record.implementationPlan?.expectedFiles),
      expectedFlow: record.implementationPlan?.expectedFlow,
      includedBehavior: asStringArray(record.userConfirmedIntent?.includedBehavior),
    },
    forbiddenScope: {
      flows: asArray(record.forbiddenFlows).map((entry: any) => ({ flow: entry.flow, reason: entry.reason })),
      excludedBehavior: asStringArray(
        record.userConfirmedIntent?.excludedBehavior || record.userConfirmedIntent?.nonGoals,
      ),
      nonGoals: asStringArray(record.implementationPlan?.nonGoals),
    },
    graphContext: {
      nodes: graphSource.nodes
        .filter((entry: any) => relatedNodeIds.has(entry.id))
        .map((entry: any) => ({
          id: entry.id,
          kind: entry.kind,
          state: entry.state,
          intentClaim: entry.intentClaim,
        })),
      edgeIntents: directEdges.map((entry: any) => ({
        id: entry.id,
        from: entry.from,
        to: entry.to,
        kind: entry.kind,
        classifications: asStringArray(entry.edgeIntent?.classifications),
        claim: entry.edgeIntent?.claim,
        confidence: entry.edgeIntent?.confidence,
      })),
    },
    verification: {
      required: {
        build: record.evidence?.build?.status,
        runtime: record.evidence?.runtime?.status,
        hardware: record.evidence?.hardware?.status,
      },
      finalState: record.finalState || {},
    },
    executionBoundary: {
      mayModifyExternalProject: false,
      requiresUserApprovalBeforeApplying: true,
      sourceOfTruth: 'graph-source plus user-confirmed change record',
    },
  }

  if (options.output) {
    const outputPath = resolveRepoPath(root, options.output)
    await writeJsonAtomic(outputPath, result)
    result.outputPath = relativePath(root, outputPath)
  }
  if (options.markdown) {
    const markdownPath = resolveRepoPath(root, options.markdown)
    await writeTextAtomic(markdownPath, renderInstructionPackMarkdown(result))
    result.markdownPath = relativePath(root, markdownPath)
  }

  return result
}

export async function captureGraphDelta(
  root: string,
  graphSourcePath: string,
  options: GraphOperationCaptureDeltaOptions,
): Promise<GraphOperationCaptureDeltaResult> {
  const resolvedGraphSourcePath = resolveRepoPath(root, graphSourcePath)
  const graphSource = await loadJson<any>(resolvedGraphSourcePath)
  validateOperationGraphSource(graphSource, graphSourcePath)

  const resolvedInstructionPackPath = resolveRepoPath(root, options.instructionPackPath)
  const instructionPack = await loadJson<GraphOperationGeneratePackResult>(resolvedInstructionPackPath)
  if (normalizeSlash(instructionPack.graphSourcePath) !== normalizeSlash(relativePath(root, resolvedGraphSourcePath))) {
    throw new Error('Instruction pack does not belong to graph source.')
  }

  const resolvedTargetRepoPath = resolveRepoPath(root, options.targetRepoPath)
  const dirtyFiles = await readGitLines(resolvedTargetRepoPath, ['diff', '--name-only'])
  for (const file of dirtyFiles) {
    if (!instructionPack.allowedScope.files.includes(file)) {
      throw new Error(`Dirty file is outside instruction pack allowed files: ${file}`)
    }
  }

  const changedFiles = (await readGitLines(resolvedTargetRepoPath, ['diff', '--numstat']))
    .map(parseNumstatLine)
    .filter((entry): entry is { path: string; additions: string; deletions: string } => Boolean(entry))

  const relatedNodeIds = new Set<string>()
  for (const edgeIntent of instructionPack.graphContext.edgeIntents) {
    const edge = graphSource.edges.find((entry: any) => entry.id === edgeIntent.id)
    if (edge?.from) {
      relatedNodeIds.add(edge.from)
    }
    if (edge?.to) {
      relatedNodeIds.add(edge.to)
    }
  }

  const result: GraphOperationCaptureDeltaResult = {
    status: 'generated-from-target-diff',
    artifactRole:
      graphSource.artifactRole === 'native-graph-source-v0' ? 'native-graph-delta-v0' : 'retrofit-graph-delta-v0',
    graphSourcePath: relativePath(root, resolvedGraphSourcePath),
    instructionPackPath: relativePath(root, resolvedInstructionPackPath),
    sourceRecordId: instructionPack.sourceRecordId,
    targetRepoPath: relativePath(root, resolvedTargetRepoPath),
    changedFiles,
    dirtyFileCount: dirtyFiles.length,
    allowedFileStatus: 'dirty-files-within-instruction-pack',
    graphUpdate: {
      relatedNodes: graphSource.nodes
        .filter((entry: any) => relatedNodeIds.has(entry.id))
        .map((entry: any) => ({
          id: entry.id,
          kind: entry.kind,
          state: entry.state,
          intentClaim: entry.intentClaim,
        })),
      relatedEdgeIntents: instructionPack.graphContext.edgeIntents,
      finalState: instructionPack.verification.finalState,
    },
    boundaries: {
      appliesPatch: false,
      upstreamPrCreated: false,
      maintainerIntentClaimed: false,
    },
  }

  if (options.output) {
    const outputPath = resolveRepoPath(root, options.output)
    await writeJsonAtomic(outputPath, result)
    result.outputPath = relativePath(root, outputPath)
  }
  if (options.markdown) {
    const markdownPath = resolveRepoPath(root, options.markdown)
    await writeTextAtomic(markdownPath, renderGraphDeltaMarkdown(result))
    result.markdownPath = relativePath(root, markdownPath)
  }

  return result
}

export async function proposeGraphUpdate(
  root: string,
  graphDeltaPath: string,
  options: GraphOperationProposeUpdateOptions = {},
): Promise<GraphOperationProposeUpdateResult> {
  const resolvedGraphDeltaPath = resolveRepoPath(root, graphDeltaPath)
  const delta = await loadJson<GraphOperationCaptureDeltaResult>(resolvedGraphDeltaPath)

  const result: GraphOperationProposeUpdateResult = {
    schemaVersion: 1,
    artifactRole: 'devview-graph-update-proposal-v0',
    status: 'generated-from-graph-delta',
    graphDeltaPath: relativePath(root, resolvedGraphDeltaPath),
    sourceRecordId: delta.sourceRecordId,
    proposedRecordState: delta.graphUpdate.finalState,
    proposedNodeUpdates: delta.graphUpdate.relatedNodes.map((entry) => ({
      id: entry.id,
      currentState: entry.state,
      proposedState:
        entry.id === delta.sourceRecordId && typeof delta.graphUpdate.finalState.status === 'string'
          ? delta.graphUpdate.finalState.status
          : entry.state,
      intentClaim: entry.intentClaim,
    })),
    changedFiles: delta.changedFiles,
    edgeIntentSummary: delta.graphUpdate.relatedEdgeIntents,
    boundaries: {
      mutatesGraphSource: false,
      appliesPatch: false,
      requiresReviewBeforeApply: true,
      maintainerIntentClaimed: false,
    },
  }

  if (options.output) {
    const outputPath = resolveRepoPath(root, options.output)
    await writeJsonAtomic(outputPath, result)
    result.outputPath = relativePath(root, outputPath)
  }
  if (options.markdown) {
    const markdownPath = resolveRepoPath(root, options.markdown)
    await writeTextAtomic(markdownPath, renderGraphUpdateProposalMarkdown(result))
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

function validateProposal(proposal: GraphUpdateProposal, proposalPath: string): void {
  if (proposal.artifactRole !== 'devview-graph-update-proposal-v0') {
    throw new Error(`Proposal has unexpected artifactRole in ${proposalPath}: ${proposal.artifactRole}`)
  }
  if (proposal.status !== 'generated-from-graph-delta') {
    throw new Error(`Proposal has unexpected status in ${proposalPath}: ${proposal.status}`)
  }
  if (!proposal.graphDeltaPath) {
    throw new Error(`Proposal is missing graphDeltaPath: ${proposalPath}`)
  }
  if (!proposal.sourceRecordId) {
    throw new Error(`Proposal is missing sourceRecordId: ${proposalPath}`)
  }
  if (proposal.boundaries?.mutatesGraphSource !== false) {
    throw new Error('Proposal must declare boundaries.mutatesGraphSource=false before it can be applied.')
  }
  if (proposal.boundaries?.appliesPatch !== false) {
    throw new Error('Proposal must declare boundaries.appliesPatch=false before it can be applied.')
  }
  if (proposal.boundaries?.maintainerIntentClaimed !== false) {
    throw new Error('Proposal must declare boundaries.maintainerIntentClaimed=false before it can be applied.')
  }
}

function validateDelta(delta: GraphDelta, proposal: GraphUpdateProposal): void {
  if (!['retrofit-graph-delta-v0', 'native-graph-delta-v0'].includes(delta.artifactRole)) {
    throw new Error(`Graph delta has unexpected artifactRole: ${delta.artifactRole}`)
  }
  if (delta.status !== 'generated-from-target-diff') {
    throw new Error(`Graph delta has unexpected status: ${delta.status}`)
  }
  if (!delta.graphSourcePath) {
    throw new Error('Graph delta is missing graphSourcePath.')
  }
  if (delta.sourceRecordId !== proposal.sourceRecordId) {
    throw new Error(`Proposal/delta sourceRecordId mismatch: ${proposal.sourceRecordId} vs ${delta.sourceRecordId}`)
  }
}

function validateGraphSource(graphSource: GraphSource, graphSourcePath: string): void {
  if (!Array.isArray(graphSource.nodes)) {
    throw new Error(`Graph source nodes must be an array: ${graphSourcePath}`)
  }
  if (!Array.isArray(graphSource.records)) {
    throw new Error(`Graph source records must be an array: ${graphSourcePath}`)
  }
}

function validateOperationGraphSource(graphSource: any, graphSourcePath: string): void {
  if (!['native-graph-source-v0', 'retrofit-graph-source-v0'].includes(graphSource.artifactRole)) {
    throw new Error(`Graph source must be native-graph-source-v0 or retrofit-graph-source-v0: ${graphSourcePath}`)
  }
  if (!Array.isArray(graphSource.records)) {
    throw new Error(`Graph source records must be an array: ${graphSourcePath}`)
  }
  if (!Array.isArray(graphSource.nodes)) {
    throw new Error(`Graph source nodes must be an array: ${graphSourcePath}`)
  }
  if (!Array.isArray(graphSource.edges)) {
    throw new Error(`Graph source edges must be an array: ${graphSourcePath}`)
  }
}

function asArray(value: unknown): any[] {
  if (!value) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

function asStringArray(value: unknown): string[] {
  return asArray(value)
    .map((entry) => String(entry))
    .filter(Boolean)
}

function normalizeSlash(value: string): string {
  return value.replaceAll('\\', '/')
}

async function readGitLines(targetRepoPath: string, gitArgs: string[]): Promise<string[]> {
  const result = await runProcess('git', ['-C', targetRepoPath, ...gitArgs], targetRepoPath)
  return result.stdout
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function runProcess(command: string, args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })
    child.on('error', (error) => {
      reject(new Error(`Could not start ${command}: ${error.message}`))
    })
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        reject(new Error(`${command} exited with code ${code}.\n${stderr || stdout}`.trim()))
      }
    })
  })
}

function parseNumstatLine(line: string): { path: string; additions: string; deletions: string } | undefined {
  const match = /^(\S+)\s+(\S+)\s+(.+)$/.exec(line)
  if (!match) {
    return undefined
  }
  return {
    additions: match[1],
    deletions: match[2],
    path: match[3],
  }
}

function buildPlannedChanges(
  graphSource: GraphSource,
  proposal: GraphUpdateProposal,
): GraphOperationApplyProposalResult['plannedChanges'] {
  const plannedChanges: GraphOperationApplyProposalResult['plannedChanges'] = []

  for (const update of proposal.proposedNodeUpdates || []) {
    const node = graphSource.nodes?.find((entry) => entry.id === update.id)
    if (!node) {
      throw new Error(`Proposal references missing graph-source node: ${update.id}`)
    }
    if (update.currentState !== undefined && node.state !== update.currentState) {
      throw new Error(
        `Stale proposal for node ${update.id}: expected currentState ${update.currentState}, found ${node.state}`,
      )
    }
    if (update.proposedState !== undefined && node.state !== update.proposedState) {
      plannedChanges.push({
        target: 'node',
        id: update.id,
        field: 'state',
        before: node.state,
        after: update.proposedState,
      })
    }
  }

  const record = graphSource.records?.find((entry) => entry.id === proposal.sourceRecordId)
  if (!record) {
    throw new Error(`Proposal references missing graph-source record: ${proposal.sourceRecordId}`)
  }
  if (proposal.proposedRecordState?.status && record.expectedStatus !== proposal.proposedRecordState.status) {
    plannedChanges.push({
      target: 'record',
      id: record.id,
      field: 'expectedStatus',
      before: record.expectedStatus,
      after: proposal.proposedRecordState.status,
    })
  }
  if (
    proposal.proposedRecordState?.activeCodeState &&
    record.expectedActiveCodeState !== proposal.proposedRecordState.activeCodeState
  ) {
    plannedChanges.push({
      target: 'record',
      id: record.id,
      field: 'expectedActiveCodeState',
      before: record.expectedActiveCodeState,
      after: proposal.proposedRecordState.activeCodeState,
    })
  }

  return plannedChanges
}

function applyPlannedChanges(
  graphSource: GraphSource,
  plannedChanges: GraphOperationApplyProposalResult['plannedChanges'],
): void {
  for (const change of plannedChanges) {
    if (change.target === 'node') {
      const node = graphSource.nodes?.find((entry) => entry.id === change.id)
      if (node) {
        node.state = change.after
      }
    } else {
      const record = graphSource.records?.find((entry) => entry.id === change.id)
      if (record && change.field === 'expectedStatus') {
        record.expectedStatus = change.after
      }
      if (record && change.field === 'expectedActiveCodeState') {
        record.expectedActiveCodeState = change.after
      }
    }
  }
}

function renderGraphOperationProposalMarkdown(result: GraphOperationApplyProposalResult): string {
  const lines = [
    '# Graph Update Proposal Application Report',
    '',
    `Status: ${result.status}`,
    '',
    `Applied: ${result.applied}`,
    '',
    `Graph source: \`${result.graphSourcePath}\``,
    `Proposal: \`${result.proposalPath}\``,
    `Graph delta: \`${result.graphDeltaPath}\``,
    '',
    '## Changed Files',
    '',
    '| File | Additions | Deletions |',
    '| --- | ---: | ---: |',
  ]

  for (const file of result.changedFiles) {
    lines.push(`| ${file.path} | ${file.additions ?? ''} | ${file.deletions ?? ''} |`)
  }

  lines.push(
    '',
    '## Planned Graph-Source Changes',
    '',
    '| Target | ID | Field | Before | After |',
    '| --- | --- | --- | --- | --- |',
  )
  for (const change of result.plannedChanges) {
    lines.push(`| ${change.target} | ${change.id} | ${change.field} | ${change.before ?? ''} | ${change.after ?? ''} |`)
  }
  if (result.plannedChanges.length === 0) {
    lines.push('| none | - | - | - | - |')
  }

  lines.push(
    '',
    '## Boundaries',
    '',
    `- Mutates graph-source by proposal: ${result.boundaries.mutatesGraphSource}`,
    `- Applies target patch: ${result.boundaries.appliesPatch}`,
    `- Maintainer intent claimed: ${result.boundaries.maintainerIntentClaimed}`,
    `- Graph source written by this command: ${result.boundaries.graphSourceWritten}`,
  )

  return `${lines.join('\n')}\n`
}

function renderInstructionPackMarkdown(result: GraphOperationGeneratePackResult): string {
  const lines = [
    '# Graph Instruction Pack',
    '',
    `Status: ${result.status}`,
    '',
    `Record: ${result.sourceRecordId}`,
    `Graph source: \`${result.graphSourcePath}\``,
    '',
    '## User Intent',
    '',
    String(result.userConfirmedIntent.summary || 'Inspect userConfirmedIntent in the JSON output.'),
    '',
    '## Allowed Files',
    '',
  ]

  for (const file of result.allowedScope.files) {
    lines.push(`- \`${file}\``)
  }
  if (result.allowedScope.files.length === 0) {
    lines.push('- none')
  }

  lines.push('', '## Forbidden Flows', '')
  for (const flow of result.forbiddenScope.flows) {
    lines.push(`- ${flow.flow || ''}: ${flow.reason || ''}`)
  }
  if (result.forbiddenScope.flows.length === 0) {
    lines.push('- none')
  }

  lines.push('', '## Graph Edge Intent', '')
  for (const edge of result.graphContext.edgeIntents) {
    lines.push(`- \`${edge.id}\` [${edge.classifications.join(', ')}]: ${edge.claim || ''}`)
  }

  lines.push(
    '',
    '## Verification',
    '',
    `- Build: ${result.verification.required.build || ''}`,
    `- Runtime/UI: ${result.verification.required.runtime || ''}`,
    `- Hardware: ${result.verification.required.hardware || ''}`,
    '',
    '## Boundary',
    '',
    '- This pack does not apply changes by itself.',
    '- External project modification requires explicit user approval.',
  )

  return `${lines.join('\n')}\n`
}

function renderGraphDeltaMarkdown(result: GraphOperationCaptureDeltaResult): string {
  const lines = [
    '# Graph Delta',
    '',
    `Status: ${result.status}`,
    '',
    `Record: ${result.sourceRecordId}`,
    '',
    '## Changed Files',
    '',
    '| File | Additions | Deletions |',
    '| --- | ---: | ---: |',
  ]

  for (const file of result.changedFiles) {
    lines.push(`| ${file.path} | ${file.additions ?? ''} | ${file.deletions ?? ''} |`)
  }
  if (result.changedFiles.length === 0) {
    lines.push('| none | 0 | 0 |')
  }

  lines.push('', '## Related Graph Context', '')
  for (const node of result.graphUpdate.relatedNodes) {
    lines.push(`- \`${node.id}\` (${node.kind || ''}): ${node.intentClaim || ''}`)
  }

  lines.push(
    '',
    '## Boundaries',
    '',
    `- Applies patch: ${result.boundaries.appliesPatch}`,
    `- Upstream PR created: ${result.boundaries.upstreamPrCreated}`,
    `- Maintainer intent claimed: ${result.boundaries.maintainerIntentClaimed}`,
  )

  return `${lines.join('\n')}\n`
}

function renderGraphUpdateProposalMarkdown(result: GraphOperationProposeUpdateResult): string {
  const lines = [
    '# DevView Graph Update Proposal',
    '',
    `Status: ${result.status}`,
    '',
    `Record: ${result.sourceRecordId}`,
    '',
    '## Changed Files',
    '',
    '| File | Additions | Deletions |',
    '| --- | ---: | ---: |',
  ]

  for (const file of result.changedFiles) {
    lines.push(`| ${file.path} | ${file.additions ?? ''} | ${file.deletions ?? ''} |`)
  }
  if (result.changedFiles.length === 0) {
    lines.push('| none | 0 | 0 |')
  }

  lines.push('', '## Proposed Node Updates', '', '| Node | Current | Proposed |', '| --- | --- | --- |')
  for (const node of result.proposedNodeUpdates) {
    lines.push(`| ${node.id} | ${node.currentState || ''} | ${node.proposedState || ''} |`)
  }

  lines.push(
    '',
    '## Boundaries',
    '',
    `- Mutates graph-source: ${result.boundaries.mutatesGraphSource}`,
    `- Applies patch: ${result.boundaries.appliesPatch}`,
    `- Requires review before apply: ${result.boundaries.requiresReviewBeforeApply}`,
    `- Maintainer intent claimed: ${result.boundaries.maintainerIntentClaimed}`,
  )

  return `${lines.join('\n')}\n`
}
