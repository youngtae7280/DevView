import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'

type JsonRecord = Record<string, unknown>

const POLICY_ROLE = 'devview-graph-source-mutation-policy-boundary-preview'
const POLICY_STATUS = 'devview-graph-source-mutation-policy-boundary-previewed'
const APPLY_READINESS_ROLE = 'devview-graph-delta-apply-readiness-preview'
const MUTATION_READINESS_ROLE = 'devview-graph-source-mutation-readiness-preview'

export interface GraphSourceMutationReadinessOptions {
  policy: string
  applyReadiness: string
  output?: string
  markdown?: string
}

export interface GraphSourceMutationReadinessFileResult {
  readiness: GraphSourceMutationReadinessPreview
  outputPath?: string
  markdownReport?: string
}

export interface GraphSourceMutationReadinessPreview {
  schemaVersion: 1
  artifactRole: typeof MUTATION_READINESS_ROLE
  status: 'devview-graph-source-mutation-readiness-ready' | 'devview-graph-source-mutation-readiness-blocked'
  readinessScope: 'graph-source-mutation-readiness-preview-no-write'
  sourcePolicyBoundary: string
  sourceApplyReadiness: string
  sourceApprovedProposalState: string | null
  sourceGraphDeltaProposal: string | null
  proposalId: string
  mutationReadinessStatus: 'dry-run-ready-apply-readiness-present' | 'blocked-apply-readiness-not-ready'
  applyReadinessStatus: string
  mutationAllowed: false
  graphSourceMutationAllowed: false
  graphSourceMutated: false
  graphDeltaApplyEnabled: false
  graphDeltaApplied: false
  approvedProposalStateCreated: boolean
  humanDecisionRecorded: boolean
  humanReviewRequired: true
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  strictModeEnabled: false
  guidedEnforcementEnabled: false
  validationFindings: GraphSourceMutationReadinessFinding[]
  allowedUse: string[]
  forbiddenUse: string[]
  outputWritePolicy: 'explicit-output-only'
  writtenOutputPath: string | null
  writtenOutputPathAuthorityStatus:
    | 'not-written-stdout-only'
    | 'explicit-mutation-readiness-output-not-source-authority'
  markdownReportPath: string | null
  nonExecutionBoundary: string
}

export interface GraphSourceMutationReadinessFinding {
  code: string
  severity: 'info' | 'warning' | 'error'
  message: string
  field?: string
  expected?: unknown
  actual?: unknown
}

export async function reportGraphSourceMutationReadinessFile(
  root: string,
  options: GraphSourceMutationReadinessOptions,
): Promise<GraphSourceMutationReadinessFileResult> {
  validateRequiredInputs(options)

  const resolvedPolicyPath = resolveRepoPath(root, options.policy)
  const policy = await readRequiredJson(resolvedPolicyPath, 'Graph-source Mutation Policy boundary')
  validatePolicy(policy)

  const resolvedApplyReadinessPath = resolveRepoPath(root, options.applyReadiness)
  const applyReadiness = await readRequiredJson(resolvedApplyReadinessPath, 'Graph Delta Apply readiness')
  validateApplyReadiness(applyReadiness)

  await assertOutputAuthority(root, {
    policy,
    resolvedPolicyPath,
    applyReadiness,
    resolvedApplyReadinessPath,
    output: options.output,
    markdown: options.markdown,
  })

  const readiness = buildMutationReadiness(root, {
    resolvedPolicyPath,
    applyReadiness,
    resolvedApplyReadinessPath,
  })

  let outputPath: string | undefined
  let markdownReport: string | undefined
  if (options.output) {
    const resolvedOutputPath = resolveRepoPath(root, options.output)
    outputPath = relativePath(root, resolvedOutputPath)
    readiness.writtenOutputPath = outputPath
    readiness.writtenOutputPathAuthorityStatus = 'explicit-mutation-readiness-output-not-source-authority'
    await writeJsonAtomic(resolvedOutputPath, readiness)
  }
  if (options.markdown) {
    const resolvedMarkdownPath = resolveRepoPath(root, options.markdown)
    markdownReport = relativePath(root, resolvedMarkdownPath)
    readiness.markdownReportPath = markdownReport
    await writeTextAtomic(resolvedMarkdownPath, renderMutationReadinessMarkdown(readiness))
  }

  return { readiness, ...(outputPath ? { outputPath } : {}), ...(markdownReport ? { markdownReport } : {}) }
}

function buildMutationReadiness(
  root: string,
  input: { resolvedPolicyPath: string; applyReadiness: JsonRecord; resolvedApplyReadinessPath: string },
): GraphSourceMutationReadinessPreview {
  const ready = input.applyReadiness.status === 'devview-graph-delta-apply-readiness-ready'
  return {
    schemaVersion: 1,
    artifactRole: MUTATION_READINESS_ROLE,
    status: ready ? 'devview-graph-source-mutation-readiness-ready' : 'devview-graph-source-mutation-readiness-blocked',
    readinessScope: 'graph-source-mutation-readiness-preview-no-write',
    sourcePolicyBoundary: relativePath(root, input.resolvedPolicyPath),
    sourceApplyReadiness: relativePath(root, input.resolvedApplyReadinessPath),
    sourceApprovedProposalState: stringValue(input.applyReadiness.sourceApprovedProposalState) || null,
    sourceGraphDeltaProposal: stringValue(input.applyReadiness.sourceGraphDeltaProposal) || null,
    proposalId: stringValue(input.applyReadiness.proposalId) || 'unknown-proposal',
    mutationReadinessStatus: ready ? 'dry-run-ready-apply-readiness-present' : 'blocked-apply-readiness-not-ready',
    applyReadinessStatus: stringValue(input.applyReadiness.applyReadinessStatus),
    mutationAllowed: false,
    graphSourceMutationAllowed: false,
    graphSourceMutated: false,
    graphDeltaApplyEnabled: false,
    graphDeltaApplied: false,
    approvedProposalStateCreated: input.applyReadiness.approvedProposalStateCreated === true,
    humanDecisionRecorded: input.applyReadiness.humanDecisionRecorded === true,
    humanReviewRequired: true,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    validationFindings: ready
      ? []
      : [
          {
            code: 'GRAPH_SOURCE_MUTATION_APPLY_READINESS_NOT_READY',
            severity: 'warning',
            field: 'applyReadinessStatus',
            expected: 'dry-run-ready-approved-state-present',
            actual: input.applyReadiness.applyReadinessStatus,
            message: 'Graph-source mutation readiness is blocked because Graph Delta apply readiness is not ready.',
          },
        ],
    allowedUse: ready
      ? [
          'review graph-source mutation readiness before a separate future mutation command',
          'preserve apply-readiness provenance without writing graph-source',
          'serve as mutation dry-run readiness context only',
        ]
      : [
          'document why graph-source mutation readiness is blocked',
          'preserve apply-readiness provenance for human review',
          'keep blocked inputs out of mutation-ready state',
        ],
    forbiddenUse: [
      'graph-source mutation',
      'graph delta apply',
      'runtime Evidence satisfaction',
      'Evidence acceptance',
      'equivalence proof',
      'scope enforcement',
      'CI required check',
      'branch protection mutation',
      'production source mutation',
      'Codex hook or config mutation',
      'user acceptance automation',
    ],
    outputWritePolicy: 'explicit-output-only',
    writtenOutputPath: null,
    writtenOutputPathAuthorityStatus: 'not-written-stdout-only',
    markdownReportPath: null,
    nonExecutionBoundary:
      'This Graph-source Mutation readiness command reports readiness only. It does not write graph-source, apply graph deltas, accept Evidence, satisfy runtime Evidence, prove equivalence, enforce scope, configure CI or required checks, change branch protection, mutate production source, mutate Codex hook/config files, or replace user acceptance.',
  }
}

export function renderMutationReadinessMarkdown(readiness: GraphSourceMutationReadinessPreview): string {
  return `# DevView Graph-source Mutation Readiness

Status: \`${readiness.status}\`

| Field | Value |
| --- | --- |
| Mutation readiness | \`${readiness.mutationReadinessStatus}\` |
| Apply readiness | \`${readiness.applyReadinessStatus}\` |
| Mutation allowed | \`${readiness.mutationAllowed}\` |
| Proposal | \`${readiness.sourceGraphDeltaProposal ?? 'none'}\` |
| Proposal ID | \`${readiness.proposalId}\` |
| Apply readiness source | \`${readiness.sourceApplyReadiness}\` |

## Non-Execution Boundary

- Graph-source mutated: \`${readiness.graphSourceMutated}\`
- Graph delta applied: \`${readiness.graphDeltaApplied}\`
- Runtime Evidence satisfied: \`${readiness.runtimeEvidenceSatisfied}\`
- Evidence accepted: \`${readiness.evidenceAccepted}\`
- Equivalence proven: \`${readiness.equivalenceProven}\`
- Scope enforced: \`${readiness.scopeEnforced}\`
- CI enforcement enabled: \`${readiness.ciEnforcementEnabled}\`
`
}

function validateRequiredInputs(options: GraphSourceMutationReadinessOptions): void {
  if (!options.policy) {
    throw new Error('report-graph-source-mutation-readiness requires --policy <policyBoundaryPath>.')
  }
  if (!options.applyReadiness) {
    throw new Error('report-graph-source-mutation-readiness requires --apply-readiness <applyReadinessPath>.')
  }
}

function validatePolicy(policy: JsonRecord): void {
  if (policy.artifactRole !== POLICY_ROLE || policy.status !== POLICY_STATUS) {
    throw new Error(`Unsafe Graph-source Mutation Policy boundary: expected ${POLICY_ROLE}/${POLICY_STATUS}.`)
  }
  for (const field of [
    'graphSourceMutationAllowed',
    'graphSourceMutated',
    'graphDeltaApplyEnabled',
    'graphDeltaApplied',
    'runtimeEvidenceSatisfied',
    'evidenceAccepted',
    'equivalenceProven',
    'scopeEnforced',
    'ciEnforcementEnabled',
  ]) {
    if (policy[field] !== false) {
      throw new Error(`Unsafe Graph-source Mutation Policy boundary: ${field} must be false.`)
    }
  }
}

function validateApplyReadiness(applyReadiness: JsonRecord): void {
  if (applyReadiness.artifactRole !== APPLY_READINESS_ROLE) {
    throw new Error(
      `Unsafe Graph Delta Apply readiness input: artifactRole must be ${JSON.stringify(APPLY_READINESS_ROLE)}.`,
    )
  }
  if (
    applyReadiness.status !== 'devview-graph-delta-apply-readiness-ready' &&
    applyReadiness.status !== 'devview-graph-delta-apply-readiness-blocked'
  ) {
    throw new Error('Unsafe Graph Delta Apply readiness input: status must be ready or blocked preview.')
  }
  for (const field of [
    'graphDeltaApplyEnabled',
    'graphDeltaApplied',
    'graphSourceMutationAllowed',
    'graphSourceMutated',
    'runtimeEvidenceSatisfied',
    'equivalenceProven',
    'scopeEnforced',
    'ciEnforcementEnabled',
  ]) {
    if (applyReadiness[field] !== false) {
      throw new Error(`Unsafe Graph Delta Apply readiness boundary: ${field} must be false.`)
    }
  }
}

async function assertOutputAuthority(
  root: string,
  input: {
    policy: JsonRecord
    resolvedPolicyPath: string
    applyReadiness: JsonRecord
    resolvedApplyReadinessPath: string
    output?: string
    markdown?: string
  },
): Promise<void> {
  if (!input.output && !input.markdown) {
    return
  }
  const resolvedOutputPath = input.output ? resolveRepoPath(root, input.output) : undefined
  const resolvedMarkdownPath = input.markdown ? resolveRepoPath(root, input.markdown) : undefined
  if (resolvedOutputPath && resolvedMarkdownPath && pathKey(resolvedOutputPath) === pathKey(resolvedMarkdownPath)) {
    throw new Error(
      'Graph-source Mutation readiness output is unsafe: --output and --markdown must be different paths.',
    )
  }

  const protectedPaths = buildProtectedPathMap(root, input)
  for (const [label, requested, resolved] of [
    ['JSON output', input.output, resolvedOutputPath],
    ['Markdown output', input.markdown, resolvedMarkdownPath],
  ] as const) {
    if (!requested || !resolved) {
      continue
    }
    const protectedReason = protectedPaths.get(pathKey(resolved))
    if (protectedReason) {
      throw new Error(
        `Graph-source Mutation readiness ${label} path is unsafe: ${requested} would overwrite ${protectedReason}.`,
      )
    }
    const existingAuthority = await classifyExistingSourceAuthority(resolved)
    if (existingAuthority) {
      throw new Error(
        `Graph-source Mutation readiness ${label} path is unsafe: ${requested} already contains ${existingAuthority}. Choose a dedicated mutation-readiness output path.`,
      )
    }
  }
}

function buildProtectedPathMap(
  root: string,
  input: {
    policy: JsonRecord
    resolvedPolicyPath: string
    applyReadiness: JsonRecord
    resolvedApplyReadinessPath: string
  },
): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const addResolved = (candidatePath: string | undefined, reason: string): void => {
    if (candidatePath && !protectedPaths.has(pathKey(candidatePath))) {
      protectedPaths.set(pathKey(candidatePath), reason)
    }
  }
  const addConcrete = (candidate: unknown, reason: string): void => {
    const candidatePath = stringValue(candidate)
    if (!isConcreteOutputProtectedPath(candidatePath)) {
      return
    }
    addResolved(resolveRepoPath(root, candidatePath), reason)
  }

  addResolved(input.resolvedPolicyPath, 'the source Graph-source Mutation Policy boundary')
  addResolved(input.resolvedApplyReadinessPath, 'the source Graph Delta Apply readiness')
  addConcrete(input.applyReadiness.sourceApprovedProposalState, 'the source Approved Proposal State')
  addConcrete(input.applyReadiness.sourceGraphDeltaProposal, 'the source Graph Delta proposal')

  for (const source of [input.policy, input.applyReadiness]) {
    for (const candidatePath of collectConcretePathStrings(source)) {
      addConcrete(candidatePath, `linked source artifact ${candidatePath}`)
    }
  }
  return protectedPaths
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) {
    return null
  }
  const record = asRecord(parsed.value)
  const artifactRole = stringValue(record?.artifactRole)
  if (!artifactRole || artifactRole === MUTATION_READINESS_ROLE) {
    return null
  }
  if (
    artifactRole === POLICY_ROLE ||
    artifactRole === APPLY_READINESS_ROLE ||
    artifactRole.includes('graph-source') ||
    artifactRole.includes('evidence') ||
    artifactRole.includes('read-model') ||
    [
      'devview-approved-proposal-state-preview',
      'devview-human-decision-record',
      'graph-delta-human-review-packet',
      'graph-delta-proposal-only-preview',
      'contract-compiler-input',
      'instruction-pack',
      'selected-graph-slice',
      'graph-traversal-plan',
      'request-ir-graph-aware-validation',
      'request-ir-candidate',
    ].includes(artifactRole)
  ) {
    return `source artifactRole "${artifactRole}"`
  }
  if (asRecord(record?.sourceRecords)) {
    return 'graph-source-shaped sourceRecords'
  }
  return null
}

async function readRequiredJson(filePath: string, label: string): Promise<JsonRecord> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) {
    throw new Error(`Unable to read ${label}: ${parsed.error}`)
  }
  const record = asRecord(parsed.value)
  if (!record) {
    throw new Error(`Unable to read ${label}: expected JSON object.`)
  }
  return record
}

function collectConcretePathStrings(value: unknown, seen = new Set<unknown>()): string[] {
  if (typeof value === 'string') {
    return isConcreteOutputProtectedPath(value) ? [value] : []
  }
  if (typeof value !== 'object' || value === null || seen.has(value)) {
    return []
  }
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectConcretePathStrings(entry, seen))
  }
  return Object.values(value as JsonRecord).flatMap((entry) => collectConcretePathStrings(entry, seen))
}

function isConcreteOutputProtectedPath(value: string): boolean {
  return (
    value.includes('/') ||
    value.includes('\\') ||
    value.startsWith('.') ||
    value.endsWith('.json') ||
    value.endsWith('.md') ||
    value.endsWith('.txt')
  )
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : null
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}
