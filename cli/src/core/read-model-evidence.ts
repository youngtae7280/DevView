import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { format } from 'prettier'
import { readJsonSafe, readTextSafe, relativePath, writeTextAtomic } from './fs.js'

const allowedViewScopedTags = ['target', 'context', 'candidate', 'guard', 'required', 'stale', 'blocked', 'output']
const coreViewNames = [
  'Intent View',
  'Behavior View',
  'Structure View',
  'Scope / Execution View',
  'Impact View',
  'Verification View',
  'Evidence / Acceptance View',
]

type Confidence = 'tool-confirmed' | 'user-confirmed' | 'inferred' | 'low-confidence'
type FreshnessStatus = 'fresh' | 'stale' | 'invalidated' | 'unknown'
type ParityStatus = 'present' | 'partial' | 'missing' | 'not-applicable' | 'exception'
type Severity = 'info' | 'warning' | 'blocking' | 'decision-required'

interface SourceArtifact {
  relativePath: string
  absolutePath: string
  status: 'present' | 'missing'
}

interface GraphNode {
  id: string
  nodeKind: string
  sourceArtifact: string
  title: string
  status: string
  confidence: Confidence
  freshnessStatus: FreshnessStatus
  parityStatus: ParityStatus
  viewScopedTags: string[]
  includedInViewIds: string[]
  viewRoles: Record<string, string[]>
  notes?: string
}

interface GraphEdge {
  id: string
  from: string
  to: string
  edgeType: string
  confidence: Confidence
  freshnessStatus: FreshnessStatus
  parityStatus: ParityStatus
  source: string
  notes?: string
}

interface CoreViewCoverage {
  viewId: string
  name: string
  coverageStatus: ParityStatus
  includedNodeIds: string[]
  includedEdgeIds: string[]
  viewScopedTags: string[]
  boundaryNotes: string
}

interface GeneratedReadModel {
  version: string
  metadata: Record<string, unknown>
  sourceInputs: SourceArtifact[]
  taxonomy: Record<string, unknown>
  nodes: GraphNode[]
  edges: GraphEdge[]
  coreViewCoverage: CoreViewCoverage[]
  checkEvidenceMapping: Array<Record<string, unknown>>
  retainedWarnings: Array<Record<string, unknown>>
  compatibilityWarnings: Array<Record<string, unknown>>
  sourceAuthorityBoundary: string
  nonPromotionStatement: string
}

interface Mismatch {
  category: string
  severity: Severity
  subject: string
  generatedValue?: unknown
  manualValue?: unknown
  message: string
  controlNodeCandidate?: string
}

interface ParityReport {
  version: string
  metadata: Record<string, unknown>
  sourceAuthorityBoundary: string
  nonPromotionStatement: string
  comparisonUnits: string[]
  mismatchCategories: string[]
  severityLabels: Severity[]
  summary: {
    generatedNodeCount: number
    manualNodeCount: number
    generatedEdgeCount: number
    manualEdgeCount: number
    mismatchCount: number
    blockingCount: number
    decisionRequiredCount: number
    status: 'comparison-pass' | 'comparison-warning' | 'comparison-blocked' | 'decision-required'
  }
  mismatches: Mismatch[]
  controlNodeCandidates: Array<Record<string, string>>
  treatmentRules: string[]
}

interface GenerateResult {
  generatedJsonPath: string
  generatedMarkdownPath: string
  manifestPath: string
  model: GeneratedReadModel
}

interface CompareResult {
  reportJsonPath: string
  reportMarkdownPath: string
  report: ParityReport
}

type ValidationStatus = 'validation-pass' | 'validation-warning' | 'validation-blocked' | 'decision-required'
type ValidationEvidenceLevel = 'validator-backed'

interface ValidationCheck {
  id: string
  title: string
  severity: Severity
  status: 'pass' | 'warning' | 'blocking' | 'decision-required'
  message: string
  sourceRefs: string[]
}

interface ValidationReport {
  version: string
  metadata: Record<string, unknown>
  status: ValidationStatus
  evidenceLevel: ValidationEvidenceLevel
  scopeLevel: 'scoped-slice-validation'
  sourceAuthorityBoundary: string
  nonPromotionStatement: string
  summary: {
    checkCount: number
    passCount: number
    warningCount: number
    blockingCount: number
    decisionRequiredCount: number
    status: ValidationStatus
  }
  checks: ValidationCheck[]
  retainedWarnings: Array<Record<string, unknown>>
  fallbackReferenceStatus: Array<Record<string, unknown>>
  recommendedNextDecisionSurface: string[]
}

interface ValidateResult {
  reportJsonPath: string
  reportMarkdownPath: string
  report: ValidationReport
}

interface TreeNode {
  id: string
  title?: string
  status?: string
  acceptanceCriteria?: AcceptanceCriterion[]
  [key: string]: unknown
}

interface AcceptanceCriterion {
  id: string
  statement?: string
  status?: string
  [key: string]: unknown
}

export interface SliceReadModelConfig {
  profileId: string
  displayName: string
  supportedSlice: string
  policyLevel: 'pilot-marker-backed'
  sourceLayout: 'flat-demo-support'
  expectedCounts: {
    nodes: number
    edges: number
    validationChecks: number
  }
  ids: {
    product: string
    work: string
    testRoot: string
    evidenceRoot: string
    acceptanceRoot: string
    cycleContract: string
    nodeExecutionContract: string
    viewInstance: string
  }
  artifacts: {
    productTree: string
    projectTree: string
    workTree: string
    testTree: string
    evidenceTree: string
    acceptanceTree: string
    changeTree: string
    impactTree: string
    productPatchTree: string
    cycleContract: string
    nodeExecutionContract: string
    runtimeEvidence: string
    approvalBrief: string
    evidenceExceptions: string
    runtimeHelper: string
    runtimeTest: string
    viewManifest: string
    generatedReadModel: string
    generatedParityReport: string
    scopedPilotMarker: string
    limitedPilotTransitionRecord: string
    limitedPilotPackage: string
    scopedPilotExecutionRecord: string
    scopedPilotReview: string
    scopedPilotActiveObservation: string
    generatedEvidenceRequirement: string
    compatibilitySlice: string
    compatibilityControlNode: string
    compatibilityEvidenceExceptions: string
  }
  sourceArtifactRelativePaths: string[]
  retainedWarnings: Array<Record<string, unknown>>
  compatibilityWarnings: Array<Record<string, unknown>>
}

export const todoSearchReadModelProfile: SliceReadModelConfig = {
  profileId: 'todo-search-selected-slice',
  displayName: 'Todo Search Adoption + Product Meaning Feedback',
  supportedSlice: 'examples/adoption/todo-search-slice',
  policyLevel: 'pilot-marker-backed',
  sourceLayout: 'flat-demo-support',
  expectedCounts: {
    nodes: 40,
    edges: 59,
    validationChecks: 20,
  },
  ids: {
    product: 'PT-SEARCH-001',
    work: 'WT-SEARCH-001',
    testRoot: 'TT-ROOT',
    evidenceRoot: 'EV-ROOT',
    acceptanceRoot: 'AT-ROOT',
    cycleContract: 'CYCLE-TODO-SEARCH',
    nodeExecutionContract: 'NEC-WT-SEARCH-001',
    viewInstance: 'VIEW-TODO-SEARCH-CORE-VIEWS',
  },
  artifacts: {
    productTree: 'product-tree.json',
    projectTree: 'project-tree.json',
    workTree: 'work-tree.json',
    testTree: 'test-tree.json',
    evidenceTree: 'evidence-tree.json',
    acceptanceTree: 'acceptance-tree.json',
    changeTree: 'change-tree.json',
    impactTree: 'impact-tree.json',
    productPatchTree: 'product-patch-tree.json',
    cycleContract: 'cycle-contract.md',
    nodeExecutionContract: 'node-execution-contracts/wt-search-001.md',
    runtimeEvidence: 'runtime-evidence.md',
    approvalBrief: 'approval-brief.md',
    evidenceExceptions: 'evidence-exceptions.md',
    runtimeHelper: 'runtime-fixture/todo-search.js',
    runtimeTest: 'runtime-fixture/todo-search.test.js',
    viewManifest: 'view-instance-manifest.json',
    generatedReadModel: 'generated/generated-read-model.json',
    generatedParityReport: 'generated/read-model-parity-report.json',
    scopedPilotMarker: 'generated/scoped-source-authority-pilot-marker.json',
    limitedPilotTransitionRecord: 'docs/concept/limited-pilot-transition-record.md',
    limitedPilotPackage: 'docs/concept/limited-pilot-promotion-decision-package.md',
    scopedPilotExecutionRecord: 'docs/concept/scoped-source-authority-pilot-execution-record.md',
    scopedPilotReview: 'docs/concept/scoped-source-authority-pilot-review.md',
    scopedPilotActiveObservation: 'docs/concept/scoped-source-authority-pilot-active-observation.md',
    generatedEvidenceRequirement: 'docs/concept/generated-read-model-evidence-requirement.md',
    compatibilitySlice: 'examples/adoption/compatibility-mismatch-slice',
    compatibilityControlNode: 'examples/adoption/compatibility-mismatch-slice/compatibility-control-node.md',
    compatibilityEvidenceExceptions: 'examples/adoption/compatibility-mismatch-slice/evidence-exceptions.md',
  },
  sourceArtifactRelativePaths: [
    'product-tree.json',
    'project-tree.json',
    'work-tree.json',
    'test-tree.json',
    'evidence-tree.json',
    'acceptance-tree.json',
    'change-tree.json',
    'impact-tree.json',
    'product-patch-tree.json',
    'cycle-contract.md',
    'node-execution-contracts/wt-search-001.md',
    'runtime-evidence.md',
    'approval-brief.md',
    'evidence-exceptions.md',
    'generated/scoped-source-authority-pilot-marker.json',
    'docs/concept/scoped-source-authority-pilot-execution-record.md',
    'docs/concept/scoped-source-authority-pilot-review.md',
    'docs/concept/scoped-source-authority-pilot-active-observation.md',
    'examples/adoption/compatibility-mismatch-slice/compatibility-control-node.md',
  ],
  retainedWarnings: [
    {
      id: 'RW-BOUNDED-FIXTURE',
      findingNodeId: 'FIND-BOUNDED-FIXTURE',
      status: 'acceptable-warning',
      summary: 'Bounded fixture Evidence is not full Todo app implementation.',
    },
    {
      id: 'RW-PARTIAL-UI',
      findingNodeId: 'FIND-PARTIAL-UI',
      status: 'acceptable-warning',
      summary: 'UI screenshot/manual visual Evidence remains partial for the no-result empty state.',
    },
    {
      id: 'RW-GENERATED-BUILDER',
      findingNodeId: 'FIND-GENERATED-BUILDER-MISSING',
      status: 'generated-present-for-bounded-slice',
      summary:
        'Generated read-model output and scoped validator-backed Evidence now exist for the bounded Todo Search slice; CI/full promotion repeatability remains later.',
    },
    {
      id: 'RW-ACEP-CLEANUP',
      findingNodeId: 'FIND-ACEP-CLEANUP-DEFERRED',
      status: 'deferred-cleanup',
      summary: 'ACEP task-card public-doc cleanup remains deferred.',
    },
  ],
  compatibilityWarnings: [
    {
      id: 'CCN-ACEP-TASK-CARD-AUTHORITY-001',
      source: 'examples/adoption/compatibility-mismatch-slice',
      role: 'supplemental warning only',
      summary: 'Legacy ACEP/task-card wording remains a compatibility warning, not pilot source scope.',
    },
  ],
}

export function getSliceReadModelProfile(slice: string): SliceReadModelConfig {
  const normalized = normalizePath(slice)
  if (normalized === todoSearchReadModelProfile.supportedSlice) {
    return todoSearchReadModelProfile
  }
  throw new Error(
    `No read-model profile is configured for slice "${slice}". Currently supported profile: ${todoSearchReadModelProfile.supportedSlice}`,
  )
}

export async function generateReadModelEvidence(root: string, slice: string): Promise<GenerateResult> {
  const profile = getSliceReadModelProfile(slice)
  const sliceDir = path.resolve(root, slice)
  const outputDir = path.join(sliceDir, 'generated')
  const sourceInputs = sourceArtifactList(root, slice, profile)
  const data = await loadSliceData(sliceDir, profile)
  const commandIdentity = `pbe graph read-model generate --slice ${slice}`
  const generatedAt = new Date().toISOString()
  const sourceCommit = resolveSourceCommit(root)
  const nodes = buildNodes(data, profile)
  const edges = buildEdges(profile)
  const coreViewCoverage = buildCoreViewCoverage(profile)
  const model: GeneratedReadModel = {
    version: '0.1.0-generated-read-model-evidence',
    metadata: {
      artifactRole: 'generated_read_model_evidence',
      generatedAt,
      commandIdentity,
      sourceCommit,
      sourceSlice: slice,
      sliceProfile: profile.profileId,
      sliceProfileDisplayName: profile.displayName,
      slicePolicyLevel: profile.policyLevel,
      sourceLayout: profile.sourceLayout,
      inputArtifactList: sourceInputs.map((entry) => entry.relativePath),
      generatedStatus: 'generated-present',
      sourceAuthority: 'Tree-native selected-slice artifacts remain current operational source.',
      nonPromotionStatement:
        'This generated read-model is Evidence only. It does not promote Maintainability Graph, change source authority, retire tree-native artifacts, approve scoped source-authority execution, or clean up public docs.',
      taxonomyBasis: 'docs/concept/graph-node-edge-tag-policy.md',
      coreViewBasis: 'docs/concept/view-tree-pack.md 7 Core Views',
      viewMembershipBoundary:
        'View membership is represented by includedInViewIds and coreViewCoverage. viewScopedTags contains only role tags.',
    },
    sourceInputs,
    taxonomy: {
      nodeKindsUsed: unique(nodes.map((node) => node.nodeKind)),
      edgeTypesUsed: unique(edges.map((edge) => edge.edgeType)),
      viewScopedTagsAllowed: allowedViewScopedTags,
      tagBoundary:
        'Tags describe temporary roles inside a View Instance only. Durable semantic meaning is represented by edges, not tags.',
    },
    nodes,
    edges,
    coreViewCoverage,
    checkEvidenceMapping: buildCheckEvidenceMapping(data, profile),
    retainedWarnings: buildRetainedWarnings(profile),
    compatibilityWarnings: buildCompatibilityWarnings(profile),
    sourceAuthorityBoundary: 'Tree-native selected-slice artifacts remain current operational source.',
    nonPromotionStatement:
      'Generated output is reviewable Evidence only and cannot change source authority without later explicit user approval.',
  }
  assertAllowedTags(model)
  const generatedJsonPath = path.join(outputDir, 'generated-read-model.json')
  const generatedMarkdownPath = path.join(outputDir, 'generated-read-model.md')
  const manifestPath = path.join(outputDir, 'read-model-evidence-manifest.json')
  await writeFormattedJson(generatedJsonPath, model)
  await writeFormattedMarkdown(generatedMarkdownPath, renderGeneratedReadModelMarkdown(model))
  await writeFormattedJson(manifestPath, buildEvidenceManifest(model, generatedJsonPath, generatedMarkdownPath, root))
  return { generatedJsonPath, generatedMarkdownPath, manifestPath, model }
}

export async function compareReadModelEvidence(
  root: string,
  generatedPath: string,
  manualPath: string,
): Promise<CompareResult> {
  const generated = await readRequiredJson<GeneratedReadModel>(
    path.resolve(root, generatedPath),
    'generated read-model',
  )
  const manual = await readRequiredJson<GeneratedReadModel>(path.resolve(root, manualPath), 'manual read-model')
  const report = buildParityReport(root, generatedPath, manualPath, generated, manual)
  const outputDir = path.dirname(path.resolve(root, generatedPath))
  const reportJsonPath = path.join(outputDir, 'read-model-parity-report.json')
  const reportMarkdownPath = path.join(outputDir, 'read-model-parity-report.md')
  await writeFormattedJson(reportJsonPath, report)
  await writeFormattedMarkdown(reportMarkdownPath, renderParityReportMarkdown(report))
  return { reportJsonPath, reportMarkdownPath, report }
}

export async function validateReadModelEvidence(root: string, slice: string): Promise<ValidateResult> {
  const profile = getSliceReadModelProfile(slice)
  const sliceDir = path.resolve(root, slice)
  const outputDir = path.join(sliceDir, 'generated')
  const generatedPath = path.join(outputDir, 'generated-read-model.json')
  const parityPath = path.join(outputDir, 'read-model-parity-report.json')
  const manifestPath = path.join(outputDir, 'read-model-evidence-manifest.json')
  const markerPath = path.join(outputDir, 'scoped-source-authority-pilot-marker.json')
  const generated = await readRequiredJson<GeneratedReadModel>(generatedPath, 'generated read-model')
  const parity = await readRequiredJson<ParityReport>(parityPath, 'read-model parity report')
  const manifest = await readRequiredJson<Record<string, unknown>>(manifestPath, 'read-model evidence manifest')
  const marker = await readRequiredJson<Record<string, unknown>>(markerPath, 'scoped source-authority pilot marker')
  const report = buildValidationReport(root, slice, profile, generated, parity, manifest, marker)
  const reportJsonPath = path.join(outputDir, 'read-model-validation-report.json')
  const reportMarkdownPath = path.join(outputDir, 'read-model-validation-report.md')
  await writeFormattedJson(reportJsonPath, report)
  await writeFormattedMarkdown(reportMarkdownPath, renderValidationReportMarkdown(report))
  return { reportJsonPath, reportMarkdownPath, report }
}

async function loadSliceData(sliceDir: string, profile: SliceReadModelConfig): Promise<Record<string, unknown>> {
  const artifactPath = (relativePathFromSlice: string) => path.join(sliceDir, ...relativePathFromSlice.split('/'))
  return {
    productTree: await readRequiredJson<Record<string, unknown>>(
      artifactPath(profile.artifacts.productTree),
      'product tree',
    ),
    projectTree: await readRequiredJson<Record<string, unknown>>(
      artifactPath(profile.artifacts.projectTree),
      'project tree',
    ),
    workTree: await readRequiredJson<Record<string, unknown>>(artifactPath(profile.artifacts.workTree), 'work tree'),
    testTree: await readRequiredJson<Record<string, unknown>>(artifactPath(profile.artifacts.testTree), 'test tree'),
    evidenceTree: await readRequiredJson<Record<string, unknown>>(
      artifactPath(profile.artifacts.evidenceTree),
      'evidence tree',
    ),
    acceptanceTree: await readRequiredJson<Record<string, unknown>>(
      artifactPath(profile.artifacts.acceptanceTree),
      'acceptance tree',
    ),
    changeTree: await readRequiredJson<Record<string, unknown>>(
      artifactPath(profile.artifacts.changeTree),
      'change tree',
    ),
    impactTree: await readRequiredJson<Record<string, unknown>>(
      artifactPath(profile.artifacts.impactTree),
      'impact tree',
    ),
    productPatchTree: await readRequiredJson<Record<string, unknown>>(
      artifactPath(profile.artifacts.productPatchTree),
      'product patch tree',
    ),
    cycleContract: await readRequiredText(artifactPath(profile.artifacts.cycleContract), 'cycle contract'),
    nodeExecutionContract: await readRequiredText(
      artifactPath(profile.artifacts.nodeExecutionContract),
      'node execution contract',
    ),
    runtimeEvidence: await readRequiredText(artifactPath(profile.artifacts.runtimeEvidence), 'runtime evidence'),
    approvalBrief: await readRequiredText(artifactPath(profile.artifacts.approvalBrief), 'approval brief'),
    evidenceExceptions: await readRequiredText(
      artifactPath(profile.artifacts.evidenceExceptions),
      'evidence exceptions',
    ),
  }
}

function buildNodes(data: Record<string, unknown>, profile: SliceReadModelConfig): GraphNode[] {
  const productNodes = getArray<TreeNode>(data.productTree, 'nodes')
  const projectNodes = getArray<TreeNode>(data.projectTree, 'nodes')
  const workNodes = getArray<TreeNode>(data.workTree, 'nodes')
  const testNodes = getArray<TreeNode>(data.testTree, 'nodes')
  const evidenceNodes = getArray<TreeNode>(data.evidenceTree, 'nodes')
  const acceptanceNodes = getArray<TreeNode>(data.acceptanceTree, 'nodes')
  const changes = getArray<TreeNode>(data.changeTree, 'changes')
  const impacts = getArray<TreeNode>(data.impactTree, 'impacts')
  const patches = getArray<TreeNode>(data.productPatchTree, 'patches')
  const searchProduct = productNodes.find((node) => node.id === profile.ids.product) || productNodes[0]
  const criteria = searchProduct?.acceptanceCriteria || []
  const nodes: GraphNode[] = [
    node(
      'TASK-TODO-SEARCH-PILOT',
      'task',
      profile.artifacts.limitedPilotTransitionRecord,
      'Todo Search generated read-model Evidence task',
      'generated_evidence_prepared',
      'inferred',
      'fresh',
      ['target', 'required'],
      ['intent-view', 'scope-execution-view'],
    ),
    ...criteria.map((criterion) =>
      node(
        criterion.id,
        'requirement',
        sliceArtifact(profile, 'productTree'),
        criterion.statement || criterion.id,
        criterion.status || 'confirmed',
        'user-confirmed',
        requirementFreshness(criterion.status),
        ['required'],
        ['intent-view', 'behavior-view', 'verification-view'],
      ),
    ),
    ...productNodes
      .filter((entry) => entry.id === profile.ids.product)
      .map((entry) =>
        node(
          entry.id,
          'requirement',
          sliceArtifact(profile, 'productTree'),
          entry.title || entry.id,
          entry.status || 'confirmed',
          'user-confirmed',
          'fresh',
          ['target', 'required'],
          ['intent-view', 'behavior-view'],
        ),
      ),
    node(
      'BEH-SEARCH-TITLE-NOTE',
      'behavior',
      sliceArtifact(profile, 'runtimeTest'),
      'Search query matches Todo title or note/content',
      'verified_by_runtime_fixture',
      'tool-confirmed',
      'fresh',
      ['target', 'required'],
      ['behavior-view', 'verification-view'],
    ),
    node(
      'BEH-EMPTY-QUERY',
      'behavior',
      sliceArtifact(profile, 'runtimeTest'),
      'Blank query returns all todos',
      'verified_by_runtime_fixture',
      'tool-confirmed',
      'fresh',
      ['guard', 'required'],
      ['behavior-view', 'verification-view'],
    ),
    node(
      'BEH-NO-RESULT',
      'behavior',
      sliceArtifact(profile, 'runtimeTest'),
      'No matching title or note/content returns empty result',
      'runtime_behavior_present_visual_partial',
      'tool-confirmed',
      'fresh',
      ['required'],
      ['behavior-view', 'verification-view'],
    ),
    node(
      'BEH-NON-SCOPE-GUARD',
      'behavior',
      sliceArtifact(profile, 'runtimeTest'),
      'Tag/date/fuzzy/server/saved search remain out of selected scope',
      'guard_verified',
      'tool-confirmed',
      'fresh',
      ['guard'],
      ['behavior-view', 'scope-execution-view'],
    ),
    ...projectNodes
      .filter((entry) => entry.id !== 'PJ-ROOT')
      .map((entry) =>
        node(
          entry.id,
          'code',
          sliceArtifact(profile, 'projectTree'),
          entry.title || entry.id,
          entry.status || 'derived',
          'inferred',
          'fresh',
          ['context'],
          ['structure-view', 'scope-execution-view'],
        ),
      ),
    ...workNodes
      .filter((entry) => entry.id === profile.ids.work)
      .map((entry) =>
        node(
          entry.id,
          'task',
          sliceArtifact(profile, 'workTree'),
          entry.title || entry.id,
          entry.status || 'selected',
          'inferred',
          'fresh',
          ['target', 'required'],
          ['scope-execution-view', 'impact-view'],
        ),
      ),
    node(
      'CODE-RUNTIME-SEARCH-HELPER',
      'code',
      sliceArtifact(profile, 'runtimeHelper'),
      'Bounded runtime fixture search helper',
      'present',
      'tool-confirmed',
      'fresh',
      ['output'],
      ['structure-view', 'behavior-view'],
    ),
    node(
      'CODE-RUNTIME-SEARCH-TEST',
      'code',
      sliceArtifact(profile, 'runtimeTest'),
      'Bounded runtime fixture Vitest tests',
      'present',
      'tool-confirmed',
      'fresh',
      ['output'],
      ['structure-view', 'verification-view'],
    ),
    node(
      'DATA-TODO-ITEM',
      'data',
      sliceArtifact(profile, 'runtimeTest'),
      'Todo item with title and note/content fields',
      'present',
      'tool-confirmed',
      'fresh',
      ['context'],
      ['structure-view', 'behavior-view'],
    ),
    ...testNodes
      .filter((entry) => entry.id !== profile.ids.testRoot)
      .map((entry) =>
        node(
          entry.id,
          'check',
          sliceArtifact(profile, 'testTree'),
          entry.title || entry.id,
          entry.status || 'defined',
          confidenceForStatus(entry.status),
          checkFreshness(entry.status),
          ['required'],
          ['verification-view'],
        ),
      ),
    ...evidenceNodes
      .filter((entry) => entry.id !== profile.ids.evidenceRoot)
      .map((entry) =>
        node(
          entry.id,
          'evidence',
          sliceArtifact(profile, 'evidenceTree'),
          entry.title || entry.id,
          entry.status || 'present',
          confidenceForStatus(entry.status),
          statusFreshness(entry.status),
          evidenceTags(entry.status),
          ['evidence-acceptance-view', 'verification-view'],
        ),
      ),
    ...patches.map((entry) =>
      node(
        entry.id,
        'decision',
        sliceArtifact(profile, 'productPatchTree'),
        entry.title || entry.id,
        entry.status || 'confirmed',
        'user-confirmed',
        'fresh',
        ['context'],
        ['intent-view', 'impact-view'],
      ),
    ),
    ...changes.map((entry) =>
      node(
        entry.id,
        'change',
        sliceArtifact(profile, 'changeTree'),
        textField(entry, 'summary', entry.title || entry.id),
        entry.status || 'closed',
        'user-confirmed',
        'fresh',
        ['context'],
        ['impact-view'],
      ),
    ),
    ...impacts.map((entry) =>
      node(
        entry.id,
        'finding',
        sliceArtifact(profile, 'impactTree'),
        textField(entry, 'overallImpact', entry.title || entry.id),
        entry.status || 'closed',
        'inferred',
        'fresh',
        ['stale'],
        ['impact-view'],
      ),
    ),
    ...acceptanceNodes.map((entry) =>
      node(
        entry.id,
        'decision',
        sliceArtifact(profile, 'acceptanceTree'),
        entry.title || entry.id,
        entry.status || 'accepted',
        'user-confirmed',
        'fresh',
        ['output'],
        ['intent-view', 'evidence-acceptance-view'],
      ),
    ),
    node(
      profile.ids.cycleContract,
      'document',
      sliceArtifact(profile, 'cycleContract'),
      'Todo Search Cycle Contract',
      'present',
      'inferred',
      'fresh',
      ['required', 'guard'],
      ['scope-execution-view'],
    ),
    node(
      profile.ids.nodeExecutionContract,
      'document',
      sliceArtifact(profile, 'nodeExecutionContract'),
      `${profile.ids.work} Node Execution Contract`,
      'present',
      'inferred',
      'fresh',
      ['required', 'guard'],
      ['scope-execution-view'],
    ),
    node(
      'AB-TODO-SEARCH',
      'document',
      sliceArtifact(profile, 'approvalBrief'),
      'Todo Search Approval Brief',
      'present',
      'user-confirmed',
      'fresh',
      ['output'],
      ['evidence-acceptance-view'],
    ),
    node(
      'CCN-ACEP-TASK-CARD-AUTHORITY-001',
      'finding',
      profile.artifacts.compatibilityControlNode,
      'ACEP task-card compatibility cleanup deferred',
      'deferred_warning',
      'inferred',
      'fresh',
      ['context'],
      ['impact-view'],
    ),
    node(
      'FIND-BOUNDED-FIXTURE',
      'finding',
      sliceArtifact(profile, 'runtimeEvidence'),
      'Bounded fixture is not full Todo app implementation',
      'retained_warning',
      'tool-confirmed',
      'fresh',
      ['context'],
      ['evidence-acceptance-view'],
    ),
    node(
      'FIND-PARTIAL-UI',
      'finding',
      sliceArtifact(profile, 'evidenceExceptions'),
      'UI screenshot/manual visual Evidence remains partial',
      'retained_warning',
      'inferred',
      'stale',
      ['stale'],
      ['evidence-acceptance-view'],
    ),
    node(
      'FIND-GENERATED-BUILDER-MISSING',
      'finding',
      profile.artifacts.generatedEvidenceRequirement,
      'Generated builder was missing before this command',
      'resolved_by_generated_output_for_bounded_slice',
      'tool-confirmed',
      'fresh',
      ['output'],
      ['evidence-acceptance-view'],
    ),
    node(
      'FIND-ACEP-CLEANUP-DEFERRED',
      'finding',
      profile.artifacts.compatibilityEvidenceExceptions,
      'ACEP public-doc cleanup deferred',
      'deferred_warning',
      'inferred',
      'fresh',
      ['context'],
      ['impact-view'],
    ),
    node(
      'DOC-READ-MODEL',
      'document',
      sliceArtifact(profile, 'generatedReadModel'),
      'Generated read-model Evidence output',
      'generated_present',
      'tool-confirmed',
      'fresh',
      ['output'],
      ['evidence-acceptance-view'],
    ),
    node(
      'DOC-PARITY-CHECK',
      'document',
      sliceArtifact(profile, 'generatedParityReport'),
      'Generated/manual parity report',
      'pending_compare',
      'tool-confirmed',
      'fresh',
      ['output'],
      ['evidence-acceptance-view'],
    ),
    node(
      'DOC-LIMITED-PILOT-PACKAGE',
      'document',
      profile.artifacts.limitedPilotPackage,
      'Limited Pilot Promotion Decision Package',
      'approved_option_recorded',
      'user-confirmed',
      'fresh',
      ['output'],
      ['intent-view'],
    ),
    node(
      'DEC-SCOPED-PILOT-EXECUTION',
      'decision',
      profile.artifacts.scopedPilotExecutionRecord,
      'Actual scoped source-authority pilot execution approved for Todo Search',
      'scoped_pilot_executed_with_fallback_ready',
      'user-confirmed',
      'fresh',
      ['output'],
      ['intent-view', 'scope-execution-view'],
    ),
    node(
      'DOC-LIMITED-PILOT-TRANSITION-RECORD',
      'document',
      profile.artifacts.limitedPilotTransitionRecord,
      'Limited Pilot Transition Record',
      'recorded_non_executing',
      'user-confirmed',
      'fresh',
      ['output'],
      ['intent-view'],
    ),
    node(
      profile.ids.viewInstance,
      'view-instance',
      sliceArtifact(profile, 'viewManifest'),
      'Todo Search 7 Core View projection',
      'present',
      'inferred',
      'fresh',
      ['output'],
      [
        'intent-view',
        'behavior-view',
        'structure-view',
        'scope-execution-view',
        'impact-view',
        'verification-view',
        'evidence-acceptance-view',
      ],
    ),
  ]
  return nodes
}

function buildEdges(profile: SliceReadModelConfig): GraphEdge[] {
  return [
    edge(
      'E-TASK-TARGETS-REQ',
      'TASK-TODO-SEARCH-PILOT',
      profile.ids.product,
      'targets',
      profile.artifacts.limitedPilotTransitionRecord,
      'inferred',
    ),
    edge(
      'E-TASK-REQUIRES-CYCLE',
      'TASK-TODO-SEARCH-PILOT',
      profile.ids.cycleContract,
      'requires',
      sliceArtifact(profile, 'cycleContract'),
      'inferred',
    ),
    edge(
      'E-TASK-REQUIRES-NEC',
      'TASK-TODO-SEARCH-PILOT',
      profile.ids.nodeExecutionContract,
      'requires',
      sliceArtifact(profile, 'nodeExecutionContract'),
      'inferred',
    ),
    edge(
      'E-PT-REQUIRES-AC1',
      profile.ids.product,
      'AC-SEARCH-001',
      'requires',
      sliceArtifact(profile, 'productTree'),
      'user-confirmed',
    ),
    edge(
      'E-PT-REQUIRES-AC2',
      profile.ids.product,
      'AC-SEARCH-002',
      'requires',
      sliceArtifact(profile, 'productTree'),
      'user-confirmed',
    ),
    edge(
      'E-PT-REQUIRES-AC3',
      profile.ids.product,
      'AC-SEARCH-003',
      'requires',
      sliceArtifact(profile, 'productTree'),
      'user-confirmed',
    ),
    edge(
      'E-BEH-SEARCH-SATISFIES-AC1',
      'BEH-SEARCH-TITLE-NOTE',
      'AC-SEARCH-001',
      'satisfies',
      sliceArtifact(profile, 'runtimeTest'),
      'tool-confirmed',
    ),
    edge(
      'E-BEH-EMPTY-SATISFIES-AC2',
      'BEH-EMPTY-QUERY',
      'AC-SEARCH-002',
      'satisfies',
      sliceArtifact(profile, 'runtimeTest'),
      'tool-confirmed',
    ),
    edge(
      'E-BEH-NO-RESULT-SATISFIES-AC3',
      'BEH-NO-RESULT',
      'AC-SEARCH-003',
      'satisfies',
      sliceArtifact(profile, 'runtimeTest'),
      'tool-confirmed',
    ),
    edge(
      'E-PT-DERIVES-PJ-SURFACE',
      profile.ids.product,
      'PJ-TODO-LIST-SURFACE',
      'targets',
      sliceArtifact(profile, 'projectTree'),
      'inferred',
    ),
    edge(
      'E-PT-DERIVES-PJ-HELPER',
      profile.ids.product,
      'PJ-TODO-SEARCH-HELPER',
      'targets',
      sliceArtifact(profile, 'projectTree'),
      'inferred',
    ),
    edge(
      'E-WT-TARGETS-BEH-SEARCH',
      profile.ids.work,
      'BEH-SEARCH-TITLE-NOTE',
      'targets',
      sliceArtifact(profile, 'workTree'),
      'inferred',
    ),
    edge(
      'E-WT-TARGETS-BEH-EMPTY',
      profile.ids.work,
      'BEH-EMPTY-QUERY',
      'targets',
      sliceArtifact(profile, 'workTree'),
      'inferred',
    ),
    edge(
      'E-WT-TARGETS-BEH-NO-RESULT',
      profile.ids.work,
      'BEH-NO-RESULT',
      'targets',
      sliceArtifact(profile, 'workTree'),
      'inferred',
    ),
    edge(
      'E-WT-PRESERVES-GUARD',
      profile.ids.work,
      'BEH-NON-SCOPE-GUARD',
      'preserves',
      sliceArtifact(profile, 'workTree'),
      'tool-confirmed',
    ),
    edge(
      'E-WT-TOUCHES-CODE',
      profile.ids.work,
      'CODE-RUNTIME-SEARCH-HELPER',
      'touches',
      sliceArtifact(profile, 'workTree'),
      'inferred',
    ),
    edge(
      'E-PJ-HELPER-TOUCHES-CODE',
      'PJ-TODO-SEARCH-HELPER',
      'CODE-RUNTIME-SEARCH-HELPER',
      'touches',
      sliceArtifact(profile, 'projectTree'),
      'inferred',
    ),
    edge(
      'E-CODE-IMPLEMENTS-SEARCH',
      'CODE-RUNTIME-SEARCH-HELPER',
      'BEH-SEARCH-TITLE-NOTE',
      'implements',
      sliceArtifact(profile, 'runtimeHelper'),
      'tool-confirmed',
    ),
    edge(
      'E-CODE-IMPLEMENTS-EMPTY',
      'CODE-RUNTIME-SEARCH-HELPER',
      'BEH-EMPTY-QUERY',
      'implements',
      sliceArtifact(profile, 'runtimeHelper'),
      'tool-confirmed',
    ),
    edge(
      'E-CODE-IMPLEMENTS-NO-RESULT',
      'CODE-RUNTIME-SEARCH-HELPER',
      'BEH-NO-RESULT',
      'implements',
      sliceArtifact(profile, 'runtimeHelper'),
      'tool-confirmed',
    ),
    edge(
      'E-CODE-PRESERVES-GUARD',
      'CODE-RUNTIME-SEARCH-HELPER',
      'BEH-NON-SCOPE-GUARD',
      'preserves',
      sliceArtifact(profile, 'runtimeTest'),
      'tool-confirmed',
    ),
    edge(
      'E-CODE-READS-DATA',
      'CODE-RUNTIME-SEARCH-HELPER',
      'DATA-TODO-ITEM',
      'reads',
      sliceArtifact(profile, 'runtimeHelper'),
      'tool-confirmed',
    ),
    edge(
      'E-CODE-TAKES-INPUT-DATA',
      'CODE-RUNTIME-SEARCH-HELPER',
      'DATA-TODO-ITEM',
      'takes-input',
      sliceArtifact(profile, 'runtimeHelper'),
      'tool-confirmed',
    ),
    edge(
      'E-CODE-RETURNS-DATA',
      'CODE-RUNTIME-SEARCH-HELPER',
      'DATA-TODO-ITEM',
      'returns',
      sliceArtifact(profile, 'runtimeHelper'),
      'tool-confirmed',
    ),
    edge(
      'E-TT-001-VERIFIES-SEARCH',
      'TT-SEARCH-001',
      'BEH-SEARCH-TITLE-NOTE',
      'verifies',
      sliceArtifact(profile, 'testTree'),
      'tool-confirmed',
    ),
    edge(
      'E-TT-002-VERIFIES-EMPTY',
      'TT-SEARCH-002',
      'BEH-EMPTY-QUERY',
      'verifies',
      sliceArtifact(profile, 'testTree'),
      'tool-confirmed',
    ),
    edge(
      'E-TT-003-VERIFIES-NO-RESULT',
      'TT-SEARCH-003',
      'BEH-NO-RESULT',
      'verifies',
      sliceArtifact(profile, 'testTree'),
      'inferred',
    ),
    edge(
      'E-TT-004-VERIFIES-SEARCH',
      'TT-SEARCH-004',
      'BEH-SEARCH-TITLE-NOTE',
      'verifies',
      sliceArtifact(profile, 'testTree'),
      'tool-confirmed',
    ),
    edge(
      'E-EV-NOTE-EVIDENCES-TT001',
      'EV-SEARCH-NOTE-TEST',
      'TT-SEARCH-001',
      'evidences',
      sliceArtifact(profile, 'runtimeEvidence'),
      'tool-confirmed',
    ),
    edge(
      'E-EV-NOTE-EVIDENCES-TT002',
      'EV-SEARCH-NOTE-TEST',
      'TT-SEARCH-002',
      'evidences',
      sliceArtifact(profile, 'runtimeEvidence'),
      'tool-confirmed',
    ),
    edge(
      'E-EV-NOTE-EVIDENCES-TT004',
      'EV-SEARCH-NOTE-TEST',
      'TT-SEARCH-004',
      'evidences',
      sliceArtifact(profile, 'runtimeEvidence'),
      'tool-confirmed',
    ),
    edge(
      'E-EV-REVIEW-EVIDENCES-TT003',
      'EV-SEARCH-REVIEW',
      'TT-SEARCH-003',
      'evidences',
      sliceArtifact(profile, 'evidenceTree'),
      'inferred',
      'unknown',
    ),
    edge(
      'E-EV-HISTORICAL-EVIDENCES-TT001',
      'EV-SEARCH-TEST',
      'TT-SEARCH-001',
      'evidences',
      sliceArtifact(profile, 'evidenceTree'),
      'inferred',
      'stale',
    ),
    edge(
      'E-PP-APPROVES-CH',
      'PP-001',
      'CH-001',
      'approves',
      sliceArtifact(profile, 'productPatchTree'),
      'user-confirmed',
    ),
    edge(
      'E-CH-TOUCHES-BEH-SEARCH',
      'CH-001',
      'BEH-SEARCH-TITLE-NOTE',
      'touches',
      sliceArtifact(profile, 'changeTree'),
      'user-confirmed',
    ),
    edge(
      'E-CH-INVALIDATES-EV-HISTORICAL',
      'CH-001',
      'EV-SEARCH-TEST',
      'invalidates',
      sliceArtifact(profile, 'impactTree'),
      'inferred',
      'fresh',
    ),
    edge(
      'E-CH-INVALIDATES-OLD-ACCEPTANCE',
      'CH-001',
      profile.ids.acceptanceRoot,
      'invalidates',
      sliceArtifact(profile, 'acceptanceTree'),
      'inferred',
      'fresh',
    ),
    edge(
      'E-CH-PRESERVES-NON-SCOPE',
      'CH-001',
      'BEH-NON-SCOPE-GUARD',
      'preserves',
      sliceArtifact(profile, 'runtimeTest'),
      'tool-confirmed',
    ),
    edge(
      'E-CH-REQUIRES-EV-NOTE',
      'CH-001',
      'EV-SEARCH-NOTE-TEST',
      'requires',
      sliceArtifact(profile, 'impactTree'),
      'inferred',
    ),
    edge(
      'E-IM-REPORTS-ON-CH',
      'IM-SEARCH-001',
      'CH-001',
      'reports-on',
      sliceArtifact(profile, 'impactTree'),
      'inferred',
    ),
    edge(
      'E-IM-REPORTS-ON-EV-REVIEW',
      'IM-SEARCH-001',
      'EV-SEARCH-REVIEW',
      'reports-on',
      sliceArtifact(profile, 'impactTree'),
      'inferred',
    ),
    edge(
      'E-CYCLE-REQUIRES-WT',
      profile.ids.cycleContract,
      profile.ids.work,
      'requires',
      sliceArtifact(profile, 'cycleContract'),
      'inferred',
    ),
    edge(
      'E-CYCLE-REQUIRES-EV',
      profile.ids.cycleContract,
      'EV-SEARCH-NOTE-TEST',
      'requires',
      sliceArtifact(profile, 'cycleContract'),
      'inferred',
    ),
    edge(
      'E-NEC-REQUIRES-WT',
      profile.ids.nodeExecutionContract,
      profile.ids.work,
      'requires',
      sliceArtifact(profile, 'nodeExecutionContract'),
      'inferred',
    ),
    edge(
      'E-NEC-PRESERVES-GUARD',
      profile.ids.nodeExecutionContract,
      'BEH-NON-SCOPE-GUARD',
      'preserves',
      sliceArtifact(profile, 'nodeExecutionContract'),
      'inferred',
    ),
    edge(
      'E-AT-APPROVES-PT',
      profile.ids.acceptanceRoot,
      profile.ids.product,
      'approves',
      sliceArtifact(profile, 'acceptanceTree'),
      'user-confirmed',
    ),
    edge(
      'E-AT-APPROVES-EV-NOTE',
      profile.ids.acceptanceRoot,
      'EV-SEARCH-NOTE-TEST',
      'approves',
      sliceArtifact(profile, 'acceptanceTree'),
      'user-confirmed',
    ),
    edge(
      'E-AB-REPORTS-ON-AT',
      'AB-TODO-SEARCH',
      profile.ids.acceptanceRoot,
      'reports-on',
      sliceArtifact(profile, 'approvalBrief'),
      'user-confirmed',
    ),
    edge(
      'E-FIND-BOUNDED-REPORTS-ON-EV',
      'FIND-BOUNDED-FIXTURE',
      'EV-SEARCH-NOTE-TEST',
      'reports-on',
      sliceArtifact(profile, 'runtimeEvidence'),
      'tool-confirmed',
    ),
    edge(
      'E-FIND-UI-REPORTS-ON-EV',
      'FIND-PARTIAL-UI',
      'EV-SEARCH-REVIEW',
      'reports-on',
      sliceArtifact(profile, 'evidenceExceptions'),
      'inferred',
      'unknown',
    ),
    edge(
      'E-FIND-BUILDER-REPORTS-ON-DOC',
      'FIND-GENERATED-BUILDER-MISSING',
      'DOC-READ-MODEL',
      'reports-on',
      profile.artifacts.generatedEvidenceRequirement,
      'tool-confirmed',
    ),
    edge(
      'E-FIND-ACEP-REPORTS-ON-CCN',
      'FIND-ACEP-CLEANUP-DEFERRED',
      'CCN-ACEP-TASK-CARD-AUTHORITY-001',
      'reports-on',
      profile.artifacts.compatibilityControlNode,
      'inferred',
      'unknown',
    ),
    edge(
      'E-CCN-REPORTS-ON-PACKAGE',
      'CCN-ACEP-TASK-CARD-AUTHORITY-001',
      'DOC-LIMITED-PILOT-PACKAGE',
      'reports-on',
      profile.artifacts.compatibilityControlNode,
      'inferred',
    ),
    edge(
      'E-DOC-PARITY-REPORTS-ON-VIEW',
      'DOC-PARITY-CHECK',
      profile.ids.viewInstance,
      'reports-on',
      sliceArtifact(profile, 'generatedParityReport'),
      'tool-confirmed',
    ),
    edge(
      'E-VIEW-DERIVES-TASK',
      profile.ids.viewInstance,
      'TASK-TODO-SEARCH-PILOT',
      'derives-view',
      sliceArtifact(profile, 'viewManifest'),
      'inferred',
    ),
    edge(
      'E-VIEW-DERIVES-REQ',
      profile.ids.viewInstance,
      profile.ids.product,
      'derives-view',
      sliceArtifact(profile, 'viewManifest'),
      'inferred',
    ),
    edge(
      'E-VIEW-DERIVES-CONTRACT',
      profile.ids.viewInstance,
      profile.ids.cycleContract,
      'derives-view',
      sliceArtifact(profile, 'viewManifest'),
      'inferred',
    ),
    edge(
      'E-VIEW-DERIVES-EVIDENCE',
      profile.ids.viewInstance,
      'EV-SEARCH-NOTE-TEST',
      'derives-view',
      sliceArtifact(profile, 'viewManifest'),
      'inferred',
    ),
    edge(
      'E-DEC-APPROVES-TRANSITION-RECORD',
      'DEC-SCOPED-PILOT-EXECUTION',
      'DOC-LIMITED-PILOT-TRANSITION-RECORD',
      'approves',
      profile.artifacts.scopedPilotExecutionRecord,
      'user-confirmed',
    ),
  ]
}

function buildCoreViewCoverage(profile: SliceReadModelConfig): CoreViewCoverage[] {
  return [
    view(
      'intent-view',
      'Intent View',
      [
        'TASK-TODO-SEARCH-PILOT',
        profile.ids.product,
        'AC-SEARCH-001',
        'AC-SEARCH-002',
        'AC-SEARCH-003',
        'PP-001',
        profile.ids.acceptanceRoot,
      ],
      [
        'E-TASK-TARGETS-REQ',
        'E-PT-REQUIRES-AC1',
        'E-PT-REQUIRES-AC2',
        'E-PT-REQUIRES-AC3',
        'E-PP-APPROVES-CH',
        'E-AT-APPROVES-PT',
      ],
      ['target', 'required', 'output'],
      'Shows product meaning and user acceptance without changing source authority.',
    ),
    view(
      'behavior-view',
      'Behavior View',
      [
        profile.ids.product,
        'BEH-SEARCH-TITLE-NOTE',
        'BEH-EMPTY-QUERY',
        'BEH-NO-RESULT',
        'BEH-NON-SCOPE-GUARD',
        'CODE-RUNTIME-SEARCH-HELPER',
        'DATA-TODO-ITEM',
      ],
      [
        'E-BEH-SEARCH-SATISFIES-AC1',
        'E-BEH-EMPTY-SATISFIES-AC2',
        'E-BEH-NO-RESULT-SATISFIES-AC3',
        'E-CODE-IMPLEMENTS-SEARCH',
        'E-CODE-IMPLEMENTS-EMPTY',
        'E-CODE-IMPLEMENTS-NO-RESULT',
        'E-CODE-PRESERVES-GUARD',
      ],
      ['target', 'guard', 'required'],
      'Shows title + note/content behavior and non-scope guards.',
    ),
    view(
      'structure-view',
      'Structure View',
      [
        'PJ-TODO-LIST-SURFACE',
        'PJ-TODO-SEARCH-HELPER',
        'CODE-RUNTIME-SEARCH-HELPER',
        'CODE-RUNTIME-SEARCH-TEST',
        'DATA-TODO-ITEM',
      ],
      ['E-CODE-READS-DATA'],
      ['context'],
      'Shows bounded fixture and project anchors only.',
    ),
    view(
      'scope-execution-view',
      'Scope / Execution View',
      [
        'TASK-TODO-SEARCH-PILOT',
        profile.ids.work,
        profile.ids.cycleContract,
        profile.ids.nodeExecutionContract,
        'BEH-NON-SCOPE-GUARD',
      ],
      [
        'E-TASK-REQUIRES-CYCLE',
        'E-TASK-REQUIRES-NEC',
        'E-CYCLE-REQUIRES-WT',
        'E-NEC-REQUIRES-WT',
        'E-WT-PRESERVES-GUARD',
      ],
      ['target', 'required', 'guard'],
      'Shows selected/deferred/forbidden boundary.',
    ),
    view(
      'impact-view',
      'Impact View',
      [
        'PP-001',
        'CH-001',
        'IM-SEARCH-001',
        'EV-SEARCH-TEST',
        profile.ids.acceptanceRoot,
        'FIND-ACEP-CLEANUP-DEFERRED',
        'CCN-ACEP-TASK-CARD-AUTHORITY-001',
      ],
      [
        'E-PP-APPROVES-CH',
        'E-CH-INVALIDATES-EV-HISTORICAL',
        'E-CH-INVALIDATES-OLD-ACCEPTANCE',
        'E-IM-REPORTS-ON-CH',
        'E-FIND-ACEP-REPORTS-ON-CCN',
      ],
      ['context', 'stale'],
      'Shows PP-001 impact, retained compatibility cleanup warning, and stale/reopen history.',
    ),
    view(
      'verification-view',
      'Verification View',
      [
        'TT-SEARCH-001',
        'TT-SEARCH-002',
        'TT-SEARCH-003',
        'TT-SEARCH-004',
        'BEH-SEARCH-TITLE-NOTE',
        'BEH-EMPTY-QUERY',
        'BEH-NO-RESULT',
        'EV-SEARCH-NOTE-TEST',
      ],
      [
        'E-TT-001-VERIFIES-SEARCH',
        'E-TT-002-VERIFIES-EMPTY',
        'E-TT-003-VERIFIES-NO-RESULT',
        'E-TT-004-VERIFIES-SEARCH',
        'E-EV-NOTE-EVIDENCES-TT004',
      ],
      ['required', 'stale'],
      'Shows checks and partial visual review warning.',
    ),
    view(
      'evidence-acceptance-view',
      'Evidence / Acceptance View',
      [
        'EV-SEARCH-TEST',
        'EV-SEARCH-REVIEW',
        'EV-SEARCH-NOTE-TEST',
        profile.ids.acceptanceRoot,
        'AB-TODO-SEARCH',
        'FIND-BOUNDED-FIXTURE',
        'FIND-PARTIAL-UI',
        'DOC-READ-MODEL',
        'DOC-PARITY-CHECK',
      ],
      [
        'E-EV-NOTE-EVIDENCES-TT001',
        'E-EV-NOTE-EVIDENCES-TT002',
        'E-EV-NOTE-EVIDENCES-TT004',
        'E-EV-REVIEW-EVIDENCES-TT003',
        'E-AT-APPROVES-EV-NOTE',
        'E-AB-REPORTS-ON-AT',
        'E-FIND-BOUNDED-REPORTS-ON-EV',
        'E-FIND-UI-REPORTS-ON-EV',
        'E-DOC-PARITY-REPORTS-ON-VIEW',
      ],
      ['output', 'stale', 'context'],
      'Shows Evidence, user acceptance with warnings, and non-promotion boundary.',
    ),
  ]
}

function buildCheckEvidenceMapping(
  data: Record<string, unknown>,
  profile: SliceReadModelConfig,
): Array<Record<string, unknown>> {
  const tests = getArray<TreeNode>(data.testTree, 'nodes').filter((entry) => entry.id !== profile.ids.testRoot)
  const evidence = getArray<TreeNode>(data.evidenceTree, 'nodes')
  return tests.map((test) => ({
    checkNodeId: test.id,
    checkTitle: test.title,
    evidenceNodeIds: test.evidenceNodeIds || [],
    evidenceStatuses: (Array.isArray(test.evidenceNodeIds) ? test.evidenceNodeIds : []).map((id) => {
      const found = evidence.find((entry) => entry.id === id)
      return { evidenceNodeId: id, status: found?.status || 'missing' }
    }),
    checkEvidenceSeparation: 'Check node records the verification obligation; Evidence nodes record observable proof.',
  }))
}

function buildRetainedWarnings(profile: SliceReadModelConfig): Array<Record<string, unknown>> {
  return profile.retainedWarnings
}

function buildCompatibilityWarnings(profile: SliceReadModelConfig): Array<Record<string, unknown>> {
  return profile.compatibilityWarnings
}

function buildEvidenceManifest(
  model: GeneratedReadModel,
  generatedJsonPath: string,
  generatedMarkdownPath: string,
  root: string,
): Record<string, unknown> {
  return {
    version: '0.1.0-read-model-evidence-manifest',
    generatedAt: model.metadata.generatedAt,
    commandIdentity: model.metadata.commandIdentity,
    sourceCommit: model.metadata.sourceCommit,
    sourceSlice: model.metadata.sourceSlice,
    generatedArtifacts: [relativePath(root, generatedJsonPath), relativePath(root, generatedMarkdownPath)],
    sourceInputs: model.sourceInputs,
    retainedWarnings: model.retainedWarnings,
    compatibilityWarnings: model.compatibilityWarnings,
    sourceAuthorityBoundary: model.sourceAuthorityBoundary,
    nonPromotionStatement: model.nonPromotionStatement,
  }
}

function buildParityReport(
  root: string,
  generatedPath: string,
  manualPath: string,
  generated: GeneratedReadModel,
  manual: GeneratedReadModel,
): ParityReport {
  const mismatches: Mismatch[] = []
  compareNodes(generated, manual, mismatches)
  compareEdges(generated, manual, mismatches)
  compareCoreViews(generated, manual, mismatches)
  compareTags(generated, 'generated', mismatches)
  compareWarnings(generated, manual, mismatches)
  compareBoundary(generated, manual, mismatches)
  const blockingCount = mismatches.filter((entry) => entry.severity === 'blocking').length
  const decisionRequiredCount = mismatches.filter((entry) => entry.severity === 'decision-required').length
  const warningCount = mismatches.filter((entry) => entry.severity === 'warning').length
  const status =
    blockingCount > 0
      ? 'comparison-blocked'
      : decisionRequiredCount > 0
        ? 'decision-required'
        : warningCount > 0
          ? 'comparison-warning'
          : 'comparison-pass'
  return {
    version: '0.1.0-read-model-parity-report',
    metadata: {
      comparedAt: new Date().toISOString(),
      commandIdentity: `pbe graph read-model compare --generated ${generatedPath} --manual ${manualPath}`,
      sourceCommit: resolveSourceCommit(root),
      generatedArtifact: generatedPath,
      manualArtifact: manualPath,
      comparisonScope: 'Todo Search selected-slice read-model Evidence',
    },
    sourceAuthorityBoundary: 'Comparison reports Evidence only and does not update source or manual artifacts.',
    nonPromotionStatement:
      'This parity report does not promote Maintainability Graph, change source authority, approve scoped source-authority execution, or retire tree-native artifacts.',
    comparisonUnits: [
      'node id/kind',
      'edge source/target/type',
      'source references',
      'view memberships',
      'role tags',
      'confidence and freshness/status',
      'warnings and Evidence exceptions',
      'source authority boundary statement',
      '7 Core View coverage',
      'Check/Evidence mappings',
    ],
    mismatchCategories: [
      'missing node',
      'missing edge',
      'wrong role tag',
      'stale/freshness mismatch',
      'source reference mismatch',
      'warning omission',
      'authority-boundary mismatch',
    ],
    severityLabels: ['info', 'warning', 'blocking', 'decision-required'],
    summary: {
      generatedNodeCount: generated.nodes.length,
      manualNodeCount: manual.nodes.length,
      generatedEdgeCount: generated.edges.length,
      manualEdgeCount: manual.edges.length,
      mismatchCount: mismatches.length,
      blockingCount,
      decisionRequiredCount,
      status,
    },
    mismatches,
    controlNodeCandidates: buildControlNodeCandidates(mismatches),
    treatmentRules: [
      'Mismatch never auto-fixes source artifacts.',
      'Mismatch never silently updates manual parity artifacts.',
      'Mismatch affecting source, acceptance, risk, or authority requires user judgment.',
      'Mismatch can create Evidence, Impact, Compatibility, or Decision Control Node candidates depending on severity.',
    ],
  }
}

function buildValidationReport(
  root: string,
  slice: string,
  profile: SliceReadModelConfig,
  generated: GeneratedReadModel,
  parity: ParityReport,
  manifest: Record<string, unknown>,
  marker: Record<string, unknown>,
): ValidationReport {
  const commandIdentity = `pbe graph read-model validate --slice ${slice}`
  const checks = buildValidationChecks(root, slice, profile, generated, parity, manifest, marker)
  const blockingCount = checks.filter((entry) => entry.status === 'blocking').length
  const decisionRequiredCount = checks.filter((entry) => entry.status === 'decision-required').length
  const warningCount = checks.filter((entry) => entry.status === 'warning').length
  const passCount = checks.filter((entry) => entry.status === 'pass').length
  const status =
    blockingCount > 0
      ? 'validation-blocked'
      : decisionRequiredCount > 0
        ? 'decision-required'
        : warningCount > 0
          ? 'validation-warning'
          : 'validation-pass'
  return {
    version: '0.1.0-read-model-validation-report',
    metadata: {
      validatedAt: new Date().toISOString(),
      commandIdentity,
      sourceCommit: resolveSourceCommit(root),
      sourceSlice: slice,
      sliceProfile: profile.profileId,
      scopeLevel: 'scoped-slice-validation',
      generatedReadModel: `${slice}/generated/generated-read-model.json`,
      parityReport: `${slice}/generated/read-model-parity-report.json`,
      evidenceManifest: `${slice}/generated/read-model-evidence-manifest.json`,
      pilotMarker: `${slice}/generated/scoped-source-authority-pilot-marker.json`,
    },
    status,
    evidenceLevel: 'validator-backed',
    scopeLevel: 'scoped-slice-validation',
    sourceAuthorityBoundary:
      'Validator-backed Evidence checks the bounded Todo Search read-model outputs only. It does not change source authority.',
    nonPromotionStatement:
      'Validation pass is Evidence only. It does not promote Maintainability Graph, expand pilot scope, retire tree-native artifacts, introduce CI enforcement, or replace user approval.',
    summary: {
      checkCount: checks.length,
      passCount,
      warningCount,
      blockingCount,
      decisionRequiredCount,
      status,
    },
    checks,
    retainedWarnings: generated.retainedWarnings,
    fallbackReferenceStatus: buildFallbackReferenceStatus(root, marker),
    recommendedNextDecisionSurface: [
      'Continue active observation',
      'Design CI workflow integration before broader enforcement',
      'Apply scoped validator to another explicitly approved slice',
      'Perform public-doc cleanup',
      'Prepare broader Graph-source promotion review',
      'Rollback or defer scoped pilot',
    ],
  }
}

function buildValidationChecks(
  root: string,
  slice: string,
  profile: SliceReadModelConfig,
  generated: GeneratedReadModel,
  parity: ParityReport,
  manifest: Record<string, unknown>,
  marker: Record<string, unknown>,
): ValidationCheck[] {
  const outputPrefix = `${slice}/generated`
  const sourceInputs = generated.sourceInputs || []
  const markerScope = getPath(marker, ['pilotScope', 'primary'])
  const activeObservationScope = getPath(marker, ['activeObservation', 'scope'])
  return [
    check(
      'generated-read-model-exists',
      'Generated read-model exists and parses',
      Boolean(generated.version && Array.isArray(generated.nodes) && Array.isArray(generated.edges)),
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'parity-report-exists',
      'Parity report exists and parses',
      Boolean(parity.version && parity.summary),
      'blocking',
      `${outputPrefix}/read-model-parity-report.json`,
    ),
    check(
      'evidence-manifest-exists',
      'Evidence manifest exists and parses',
      Boolean(manifest.version && manifest.sourceInputs),
      'blocking',
      `${outputPrefix}/read-model-evidence-manifest.json`,
    ),
    check(
      'pilot-marker-exists',
      'Scoped pilot marker exists and parses',
      Boolean(marker.version && marker.status),
      'blocking',
      `${outputPrefix}/scoped-source-authority-pilot-marker.json`,
    ),
    check(
      'source-input-artifacts-present',
      'Source input artifacts exist or are explicitly represented',
      sourceInputs.length > 0 && sourceInputs.every((entry) => entry.status === 'present'),
      'blocking',
      'generated sourceInputs',
    ),
    check(
      'parity-status-pass',
      'Generated/manual parity is comparison-pass',
      parity.summary.status === 'comparison-pass',
      'blocking',
      `${outputPrefix}/read-model-parity-report.json`,
    ),
    check(
      'parity-counts-zero',
      'Mismatch, blocking, and decision-required counts are zero',
      parity.summary.mismatchCount === 0 &&
        parity.summary.blockingCount === 0 &&
        parity.summary.decisionRequiredCount === 0,
      'blocking',
      `${outputPrefix}/read-model-parity-report.json`,
    ),
    check(
      'node-edge-tag-taxonomy-valid',
      'Node/Edge/Tag taxonomy is valid',
      hasTaxonomy(generated),
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'view-scoped-tags-allowed',
      'viewScopedTags uses allowed role tags only',
      invalidViewScopedTags(generated).length === 0,
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
      invalidViewScopedTags(generated),
    ),
    check(
      'view-membership-separated',
      'View membership is separated from tags',
      viewMembershipSeparated(generated),
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'core-view-coverage-present',
      '7 Core View coverage is present',
      missingCoreViews(generated).length === 0,
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
      missingCoreViews(generated),
    ),
    check(
      'confidence-freshness-separated',
      'Confidence and freshness/status are separated',
      confidenceFreshnessSeparated(generated),
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'check-evidence-mapping-present',
      'Check/Evidence mapping is present',
      Array.isArray(generated.checkEvidenceMapping) && generated.checkEvidenceMapping.length > 0,
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'source-authority-boundary-bounded',
      'Source authority boundary is present and bounded',
      /Tree-native selected-slice artifacts remain current operational source/i.test(
        generated.sourceAuthorityBoundary,
      ) &&
        String(markerScope) === slice &&
        String(activeObservationScope).includes(slice),
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'non-promotion-statement-present',
      'Non-promotion statement is present',
      /does not promote|cannot change source authority/i.test(generated.nonPromotionStatement) &&
        /does not promote|does not change source authority/i.test(String(marker.nonPromotionStatement || '')),
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'retained-warnings-visible',
      'Retained warnings are visible',
      Array.isArray(generated.retainedWarnings) &&
        generated.retainedWarnings.length >= 4 &&
        Array.isArray(marker.retainedWarnings) &&
        marker.retainedWarnings.length >= 4,
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'fallback-reference-artifacts-present',
      'Fallback/reference artifacts are present',
      buildFallbackReferenceStatus(root, marker).every((entry) => entry.status === 'present'),
      'blocking',
      `${outputPrefix}/scoped-source-authority-pilot-marker.json`,
    ),
    check(
      'user-acceptance-authority-preserved',
      'User acceptance authority is not replaced by Codex/PBE',
      !/codex\/pbe self-acceptance|replace user acceptance/i.test(
        `${generated.sourceAuthorityBoundary} ${generated.nonPromotionStatement} ${marker.nonPromotionStatement || ''}`,
      ) &&
        generated.nodes.some(
          (entry) => entry.id === profile.ids.acceptanceRoot && entry.confidence === 'user-confirmed',
        ),
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'compatibility-warning-boundary-preserved',
      'Supplemental compatibility warning boundary is preserved',
      generated.compatibilityWarnings.some((entry) => /supplemental warning only/i.test(String(entry.role || ''))) &&
        String(getPath(marker, ['pilotScope', 'supplementalWarningOnly'])) === profile.artifacts.compatibilitySlice,
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'no-repo-wide-promotion-or-retirement',
      'No statement implies repo-wide promotion or tree-native retirement',
      noRepoWidePromotionOrRetirement(generated, marker),
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
  ]
}

function check(
  id: string,
  title: string,
  passed: boolean,
  failureSeverity: Exclude<ValidationCheck['status'], 'pass'>,
  sourceRef: string,
  detail?: unknown,
): ValidationCheck {
  const severity = passed ? 'info' : failureSeverity === 'blocking' ? 'blocking' : failureSeverity
  return {
    id,
    title,
    severity,
    status: passed ? 'pass' : failureSeverity,
    message: passed ? 'Check passed.' : `Check failed.${detail ? ` Detail: ${JSON.stringify(detail)}` : ''}`,
    sourceRefs: [sourceRef],
  }
}

function buildFallbackReferenceStatus(root: string, marker: Record<string, unknown>): Array<Record<string, unknown>> {
  const fallbackReferences = getPath(marker, ['pilotAuthority', 'fallbackReference'])
  const paths = Array.isArray(fallbackReferences) ? fallbackReferences.map(String) : []
  return paths.map((entry) => ({
    path: entry,
    status: existsSync(path.resolve(root, entry)) ? 'present' : 'missing',
  }))
}

function hasTaxonomy(model: GeneratedReadModel): boolean {
  return (
    Array.isArray(model.taxonomy.nodeKindsUsed) &&
    model.taxonomy.nodeKindsUsed.length > 0 &&
    Array.isArray(model.taxonomy.edgeTypesUsed) &&
    model.taxonomy.edgeTypesUsed.length > 0 &&
    Array.isArray(model.taxonomy.viewScopedTagsAllowed) &&
    allowedViewScopedTags.every((entry) => (model.taxonomy.viewScopedTagsAllowed as unknown[]).includes(entry))
  )
}

function invalidViewScopedTags(model: GeneratedReadModel): string[] {
  const allowed = new Set(allowedViewScopedTags)
  return unique(
    [
      ...model.nodes.flatMap((entry) => entry.viewScopedTags),
      ...model.coreViewCoverage.flatMap((entry) => entry.viewScopedTags),
    ].filter((entry) => !allowed.has(entry)),
  )
}

function viewMembershipSeparated(model: GeneratedReadModel): boolean {
  return (
    model.nodes.every(
      (entry) =>
        Array.isArray(entry.includedInViewIds) &&
        entry.includedInViewIds.every((viewId) => /-view$/.test(viewId)) &&
        entry.viewScopedTags.every((tag) => !/-view$/.test(tag)),
    ) && model.coreViewCoverage.every((entry) => entry.viewScopedTags.every((tag) => !/-view$/.test(tag)))
  )
}

function missingCoreViews(model: GeneratedReadModel): string[] {
  const views = new Set(model.coreViewCoverage.map((entry) => entry.name))
  return coreViewNames.filter((entry) => !views.has(entry))
}

function confidenceFreshnessSeparated(model: GeneratedReadModel): boolean {
  const confidenceValues = new Set(['tool-confirmed', 'user-confirmed', 'inferred', 'low-confidence'])
  const freshnessValues = new Set(['fresh', 'stale', 'invalidated', 'unknown'])
  return [...model.nodes, ...model.edges].every(
    (entry) =>
      confidenceValues.has(entry.confidence) &&
      freshnessValues.has(entry.freshnessStatus) &&
      entry.confidence !== ('stale' as Confidence),
  )
}

function noRepoWidePromotionOrRetirement(model: GeneratedReadModel, marker: Record<string, unknown>): boolean {
  const text = JSON.stringify({
    generatedBoundary: model.sourceAuthorityBoundary,
    generatedNonPromotion: model.nonPromotionStatement,
    markerStatus: marker.status,
    markerNonPromotion: marker.nonPromotionStatement,
    activeObservation: marker.activeObservation,
  }).toLowerCase()
  return ![
    'full graph-source promotion approved',
    'repository-wide source authority approved',
    'tree-native artifacts retired',
    'tree-native artifact retirement approved',
  ].some((phrase) => text.includes(phrase))
}

function getPath(source: Record<string, unknown>, pathSegments: string[]): unknown {
  let current: unknown = source
  for (const segment of pathSegments) {
    if (typeof current !== 'object' || current === null) {
      return undefined
    }
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function compareNodes(generated: GeneratedReadModel, manual: GeneratedReadModel, mismatches: Mismatch[]): void {
  const generatedMap = new Map(generated.nodes.map((entry) => [entry.id, entry]))
  for (const manualNode of manual.nodes) {
    const generatedNode = generatedMap.get(manualNode.id)
    if (!generatedNode) {
      mismatches.push(
        mismatch(
          'missing node',
          'warning',
          manualNode.id,
          'Manual node is not present in generated output.',
          undefined,
          manualNode.nodeKind,
          'Evidence Control Node',
        ),
      )
    } else if (generatedNode.nodeKind !== manualNode.nodeKind) {
      mismatches.push(
        mismatch(
          'missing node',
          'decision-required',
          manualNode.id,
          'Generated node kind differs from manual parity artifact.',
          generatedNode.nodeKind,
          manualNode.nodeKind,
          'Decision Control Node',
        ),
      )
    } else if (
      generatedNode.freshnessStatus !== manualNode.freshnessStatus &&
      manualNode.freshnessStatus !== 'unknown'
    ) {
      mismatches.push(
        mismatch(
          'stale/freshness mismatch',
          'warning',
          manualNode.id,
          'Generated freshness differs from manual parity artifact.',
          generatedNode.freshnessStatus,
          manualNode.freshnessStatus,
          'Evidence Control Node',
        ),
      )
    }
  }
}

function compareEdges(generated: GeneratedReadModel, manual: GeneratedReadModel, mismatches: Mismatch[]): void {
  const generatedMap = new Map(generated.edges.map((entry) => [entry.id, entry]))
  for (const manualEdge of manual.edges) {
    const generatedEdge = generatedMap.get(manualEdge.id)
    if (!generatedEdge) {
      mismatches.push(
        mismatch(
          'missing edge',
          'warning',
          manualEdge.id,
          'Manual edge is not present in generated output.',
          undefined,
          `${manualEdge.from}->${manualEdge.to}:${manualEdge.edgeType}`,
          'Impact Control Node',
        ),
      )
    } else if (
      generatedEdge.from !== manualEdge.from ||
      generatedEdge.to !== manualEdge.to ||
      generatedEdge.edgeType !== manualEdge.edgeType
    ) {
      mismatches.push(
        mismatch(
          'missing edge',
          'decision-required',
          manualEdge.id,
          'Generated edge relationship differs from manual parity artifact.',
          `${generatedEdge.from}->${generatedEdge.to}:${generatedEdge.edgeType}`,
          `${manualEdge.from}->${manualEdge.to}:${manualEdge.edgeType}`,
          'Decision Control Node',
        ),
      )
    }
  }
}

function compareCoreViews(generated: GeneratedReadModel, manual: GeneratedReadModel, mismatches: Mismatch[]): void {
  const generatedNames = new Set(generated.coreViewCoverage.map((entry) => entry.name))
  for (const name of coreViewNames) {
    if (!generatedNames.has(name)) {
      mismatches.push(
        mismatch(
          'warning omission',
          'blocking',
          name,
          'Generated output omits required Core View coverage.',
          undefined,
          name,
          'Evidence Control Node',
        ),
      )
    }
  }
  const manualNames = new Set(manual.coreViewCoverage.map((entry) => entry.name))
  for (const name of manualNames) {
    if (!generatedNames.has(name)) {
      mismatches.push(
        mismatch(
          'warning omission',
          'warning',
          name,
          'Generated output omits a manual Core View.',
          undefined,
          name,
          'Evidence Control Node',
        ),
      )
    }
  }
}

function compareTags(model: GeneratedReadModel, label: string, mismatches: Mismatch[]): void {
  const allowed = new Set(allowedViewScopedTags)
  for (const record of [...model.nodes, ...model.coreViewCoverage]) {
    for (const tag of record.viewScopedTags) {
      if (!allowed.has(tag)) {
        mismatches.push(
          mismatch(
            'wrong role tag',
            'blocking',
            `${label}:${recordLabel(record)}`,
            'Invalid viewScopedTags value.',
            tag,
            allowedViewScopedTags,
            'Evidence Control Node',
          ),
        )
      }
    }
  }
}

function compareWarnings(generated: GeneratedReadModel, manual: GeneratedReadModel, mismatches: Mismatch[]): void {
  const generatedWarnings = new Set(generated.retainedWarnings.map((entry) => String(entry.id)))
  for (const warning of manual.retainedWarnings || []) {
    const id = String(warning.id || '')
    if (id && !generatedWarnings.has(id) && id !== 'FIND-GENERATED-BUILDER-MISSING') {
      mismatches.push(
        mismatch(
          'warning omission',
          'warning',
          id,
          'Manual retained warning is not carried in generated output.',
          undefined,
          id,
          'Compatibility Control Node',
        ),
      )
    }
  }
}

function compareBoundary(generated: GeneratedReadModel, manual: GeneratedReadModel, mismatches: Mismatch[]): void {
  if (!/Tree-native/i.test(generated.sourceAuthorityBoundary) || !/Evidence/i.test(generated.nonPromotionStatement)) {
    mismatches.push(
      mismatch(
        'authority-boundary mismatch',
        'blocking',
        'generated-boundary',
        'Generated output does not preserve source authority boundary statement.',
        generated.sourceAuthorityBoundary,
        manual.sourceAuthorityBoundary,
        'Decision Control Node',
      ),
    )
  }
}

function buildControlNodeCandidates(mismatches: Mismatch[]): Array<Record<string, string>> {
  if (mismatches.length === 0) {
    return [
      {
        family: 'Evidence Control Node',
        status: 'resolved-for-generated-output',
        reason: 'Generated/manual comparison produced no mismatch.',
      },
    ]
  }
  return unique(mismatches.map((entry) => entry.controlNodeCandidate).filter(isString)).map((family) => ({
    family,
    status: 'candidate',
    reason: 'Generated/manual parity mismatch needs review before authority-bearing execution.',
  }))
}

function renderGeneratedReadModelMarkdown(model: GeneratedReadModel): string {
  const metadata = model.metadata
  return `# Generated Read-Model Evidence

Status: generated-present / evidence-only / source-authority-unchanged

## Run Identity

- Generated at: ${String(metadata.generatedAt)}
- Command identity: \`${String(metadata.commandIdentity)}\`
- Source commit: ${String(metadata.sourceCommit)}
- Source slice: \`${String(metadata.sourceSlice)}\`

## Boundary

${model.sourceAuthorityBoundary}

${model.nonPromotionStatement}

## Source Inputs

${model.sourceInputs.map((entry) => `- ${entry.relativePath}: ${entry.status}`).join('\n')}

## Node / Edge / Tag Summary

- Nodes: ${model.nodes.length}
- Edges: ${model.edges.length}
- Node kinds: ${String((metadata.nodeKindsUsed || model.taxonomy.nodeKindsUsed) as string[])}
- Edge types: ${String((metadata.edgeTypesUsed || model.taxonomy.edgeTypesUsed) as string[])}
- Allowed view-scoped tags: ${allowedViewScopedTags.join(', ')}

View membership is separated from \`viewScopedTags\` through \`includedInViewIds\` and \`coreViewCoverage\`.

## 7 Core View Coverage

| View | Status | Nodes | Edges |
| ---- | ------ | ----- | ----- |
${model.coreViewCoverage.map((viewCoverage) => `| ${viewCoverage.name} | ${viewCoverage.coverageStatus} | ${viewCoverage.includedNodeIds.length} | ${viewCoverage.includedEdgeIds.length} |`).join('\n')}

## Check / Evidence Mapping

| Check | Evidence | Summary |
| ----- | -------- | ------- |
${model.checkEvidenceMapping.map((entry) => `| ${String(entry.checkNodeId)} | ${formatList(entry.evidenceNodeIds)} | ${String(entry.checkEvidenceSeparation)} |`).join('\n')}

## Retained Warnings

${model.retainedWarnings.map((entry) => `- ${String(entry.id)}: ${String(entry.status)} - ${String(entry.summary)}`).join('\n')}

## Compatibility Warning Carry-Forward

${model.compatibilityWarnings.map((entry) => `- ${String(entry.id)}: ${String(entry.summary)}`).join('\n')}
`
}

function renderParityReportMarkdown(report: ParityReport): string {
  return `# Read-Model Parity Report

Status: ${report.summary.status}

## Run Identity

- Compared at: ${String(report.metadata.comparedAt)}
- Command identity: \`${String(report.metadata.commandIdentity)}\`
- Source commit: ${String(report.metadata.sourceCommit)}

## Boundary

${report.sourceAuthorityBoundary}

${report.nonPromotionStatement}

## Summary

- Generated nodes: ${report.summary.generatedNodeCount}
- Manual nodes: ${report.summary.manualNodeCount}
- Generated edges: ${report.summary.generatedEdgeCount}
- Manual edges: ${report.summary.manualEdgeCount}
- Mismatches: ${report.summary.mismatchCount}
- Blocking: ${report.summary.blockingCount}
- Decision required: ${report.summary.decisionRequiredCount}

## Mismatches

| Severity | Category | Subject | Message |
| -------- | -------- | ------- | ------- |
${report.mismatches.length === 0 ? '| info | none | generated/manual parity | No mismatches found. |' : report.mismatches.map((entry) => `| ${entry.severity} | ${entry.category} | ${entry.subject} | ${entry.message} |`).join('\n')}

## Control Node Candidates

${report.controlNodeCandidates.map((entry) => `- ${String(entry.family)}: ${String(entry.status)} - ${String(entry.reason)}`).join('\n')}

## Treatment Rules

${report.treatmentRules.map((entry) => `- ${entry}`).join('\n')}
`
}

function renderValidationReportMarkdown(report: ValidationReport): string {
  return `# Read-Model Validation Report

Status: ${report.status}

Evidence level: ${report.evidenceLevel}

## Run Identity

- Validated at: ${String(report.metadata.validatedAt)}
- Command identity: \`${String(report.metadata.commandIdentity)}\`
- Source commit: ${String(report.metadata.sourceCommit)}
- Source slice: \`${String(report.metadata.sourceSlice)}\`
- Scope level: ${report.scopeLevel}

## Boundary

${report.sourceAuthorityBoundary}

${report.nonPromotionStatement}

## Summary

- Checks: ${report.summary.checkCount}
- Passed: ${report.summary.passCount}
- Warnings: ${report.summary.warningCount}
- Blocking: ${report.summary.blockingCount}
- Decision required: ${report.summary.decisionRequiredCount}

## Checks

| Status | Severity | Check | Message |
| ------ | -------- | ----- | ------- |
${report.checks.map((entry) => `| ${entry.status} | ${entry.severity} | ${entry.title} | ${entry.message} |`).join('\n')}

## Retained Warnings

${report.retainedWarnings.map((entry) => `- ${String(entry.id)}: ${String(entry.status)} - ${String(entry.summary)}`).join('\n')}

## Fallback / Reference Status

${report.fallbackReferenceStatus.map((entry) => `- ${String(entry.path)}: ${String(entry.status)}`).join('\n')}

## Recommended Next Decision Surface

${report.recommendedNextDecisionSurface.map((entry) => `- ${entry}`).join('\n')}
`
}

function sourceArtifactList(root: string, slice: string, profile: SliceReadModelConfig): SourceArtifact[] {
  const relativePaths = profile.sourceArtifactRelativePaths.map((entry) =>
    isSliceRelativeArtifact(entry) ? `${slice}/${entry}` : entry,
  )
  return relativePaths.map((entry) => {
    const absolutePath = path.resolve(root, entry)
    return {
      relativePath: entry,
      absolutePath,
      status: existsSync(absolutePath) ? 'present' : 'missing',
    }
  })
}

function isSliceRelativeArtifact(relativePathFromProfile: string): boolean {
  return !relativePathFromProfile.startsWith('docs/') && !relativePathFromProfile.startsWith('examples/')
}

function sliceArtifact(profile: SliceReadModelConfig, artifactKey: keyof SliceReadModelConfig['artifacts']): string {
  return `${profile.supportedSlice}/${profile.artifacts[artifactKey]}`
}

async function readRequiredJson<T>(filePath: string, label: string): Promise<T> {
  const parsed = await readJsonSafe<T>(filePath)
  if (!parsed.ok) {
    throw new Error(`Could not read ${label} at ${filePath}: ${parsed.error}`)
  }
  return parsed.value
}

async function readRequiredText(filePath: string, label: string): Promise<string> {
  const parsed = await readTextSafe(filePath)
  if (!parsed.ok) {
    throw new Error(`Could not read ${label} at ${filePath}: ${parsed.error}`)
  }
  return parsed.value
}

function node(
  id: string,
  nodeKind: string,
  sourceArtifact: string,
  title: string,
  status: string,
  confidence: Confidence,
  freshnessStatus: FreshnessStatus,
  viewScopedTags: string[],
  includedInViewIds: string[],
): GraphNode {
  const viewRoles = Object.fromEntries(includedInViewIds.map((viewId) => [viewId, viewScopedTags]))
  return {
    id,
    nodeKind,
    sourceArtifact,
    title,
    status,
    confidence,
    freshnessStatus,
    parityStatus: 'present',
    viewScopedTags: unique(viewScopedTags),
    includedInViewIds,
    viewRoles,
  }
}

function edge(
  id: string,
  from: string,
  to: string,
  edgeType: string,
  source: string,
  confidence: Confidence,
  freshnessStatus: FreshnessStatus = 'fresh',
): GraphEdge {
  return { id, from, to, edgeType, confidence, freshnessStatus, parityStatus: 'present', source }
}

function view(
  viewId: string,
  name: string,
  includedNodeIds: string[],
  includedEdgeIds: string[],
  viewScopedTags: string[],
  boundaryNotes: string,
): CoreViewCoverage {
  return {
    viewId,
    name,
    coverageStatus: 'present',
    includedNodeIds,
    includedEdgeIds,
    viewScopedTags: unique(viewScopedTags),
    boundaryNotes,
  }
}

function mismatch(
  category: string,
  severity: Severity,
  subject: string,
  message: string,
  generatedValue: unknown,
  manualValue: unknown,
  controlNodeCandidate: string,
): Mismatch {
  return { category, severity, subject, message, generatedValue, manualValue, controlNodeCandidate }
}

function confidenceForStatus(status: unknown): Confidence {
  const value = String(status || '')
  if (/passed|present_fresh|runtime_fixture/i.test(value)) {
    return 'tool-confirmed'
  }
  if (/accepted|confirmed|approved/i.test(value)) {
    return 'user-confirmed'
  }
  if (/partial|pending|warning/i.test(value)) {
    return 'inferred'
  }
  return 'inferred'
}

function statusFreshness(status: unknown): FreshnessStatus {
  const value = String(status || '')
  if (/stale|historical|pending|partial/i.test(value)) {
    return 'stale'
  }
  if (/invalidated/i.test(value)) {
    return 'invalidated'
  }
  if (/unknown/i.test(value)) {
    return 'unknown'
  }
  return 'fresh'
}

function requirementFreshness(status: unknown): FreshnessStatus {
  const value = String(status || '')
  if (/confirmed_runtime_behavior_present_visual_review_pending/i.test(value)) {
    return 'fresh'
  }
  return statusFreshness(status)
}

function checkFreshness(status: unknown): FreshnessStatus {
  const value = String(status || '')
  if (/partial_runtime_behavior_present_visual_review_pending/i.test(value)) {
    return 'fresh'
  }
  return statusFreshness(status)
}

function evidenceTags(status: unknown): string[] {
  const value = String(status || '')
  if (/partial|pending|historical/i.test(value)) {
    return ['stale', 'context']
  }
  return ['output', 'required']
}

function assertAllowedTags(model: GeneratedReadModel): void {
  const allowed = new Set(allowedViewScopedTags)
  const tags = [
    ...model.nodes.flatMap((entry) => entry.viewScopedTags),
    ...model.coreViewCoverage.flatMap((entry) => entry.viewScopedTags),
  ]
  const invalidTags = unique(tags).filter((entry) => !allowed.has(entry))
  if (invalidTags.length > 0) {
    throw new Error(`Generated invalid viewScopedTags: ${invalidTags.join(', ')}`)
  }
}

function resolveSourceCommit(root: string): string {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim()
  } catch {
    return 'unavailable'
  }
}

function getArray<T>(source: unknown, key: string): T[] {
  if (typeof source !== 'object' || source === null) {
    return []
  }
  const value = (source as Record<string, unknown>)[key]
  return Array.isArray(value) ? (value as T[]) : []
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function formatList(value: unknown): string {
  return Array.isArray(value) ? value.map(String).join(', ') : String(value || '')
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/\/+$/, '')
}

async function writeFormattedJson(filePath: string, value: unknown): Promise<void> {
  const formatted = await format(JSON.stringify(value), { parser: 'json', printWidth: 120, trailingComma: 'all' })
  await writeTextAtomic(filePath, formatted)
}

async function writeFormattedMarkdown(filePath: string, value: string): Promise<void> {
  const formatted = await format(value, { parser: 'markdown', printWidth: 120, proseWrap: 'always' })
  await writeTextAtomic(filePath, formatted)
}

function textField(source: Record<string, unknown>, key: string, fallback: string): string {
  const value = source[key]
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function recordLabel(record: GraphNode | CoreViewCoverage): string {
  return 'id' in record ? record.id : record.name
}
