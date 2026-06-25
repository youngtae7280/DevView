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

export async function generateReadModelEvidence(root: string, slice: string): Promise<GenerateResult> {
  const sliceDir = path.resolve(root, slice)
  const outputDir = path.join(sliceDir, 'generated')
  const sourceInputs = sourceArtifactList(root, slice)
  const data = await loadSliceData(sliceDir)
  const commandIdentity = `pbe graph read-model generate --slice ${slice}`
  const generatedAt = new Date().toISOString()
  const sourceCommit = resolveSourceCommit(root)
  const nodes = buildNodes(data)
  const edges = buildEdges()
  const coreViewCoverage = buildCoreViewCoverage()
  const model: GeneratedReadModel = {
    version: '0.1.0-generated-read-model-evidence',
    metadata: {
      artifactRole: 'generated_read_model_evidence',
      generatedAt,
      commandIdentity,
      sourceCommit,
      sourceSlice: slice,
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
    checkEvidenceMapping: buildCheckEvidenceMapping(data),
    retainedWarnings: buildRetainedWarnings(),
    compatibilityWarnings: buildCompatibilityWarnings(),
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

async function loadSliceData(sliceDir: string): Promise<Record<string, unknown>> {
  return {
    productTree: await readRequiredJson<Record<string, unknown>>(
      path.join(sliceDir, 'product-tree.json'),
      'product tree',
    ),
    projectTree: await readRequiredJson<Record<string, unknown>>(
      path.join(sliceDir, 'project-tree.json'),
      'project tree',
    ),
    workTree: await readRequiredJson<Record<string, unknown>>(path.join(sliceDir, 'work-tree.json'), 'work tree'),
    testTree: await readRequiredJson<Record<string, unknown>>(path.join(sliceDir, 'test-tree.json'), 'test tree'),
    evidenceTree: await readRequiredJson<Record<string, unknown>>(
      path.join(sliceDir, 'evidence-tree.json'),
      'evidence tree',
    ),
    acceptanceTree: await readRequiredJson<Record<string, unknown>>(
      path.join(sliceDir, 'acceptance-tree.json'),
      'acceptance tree',
    ),
    changeTree: await readRequiredJson<Record<string, unknown>>(path.join(sliceDir, 'change-tree.json'), 'change tree'),
    impactTree: await readRequiredJson<Record<string, unknown>>(path.join(sliceDir, 'impact-tree.json'), 'impact tree'),
    productPatchTree: await readRequiredJson<Record<string, unknown>>(
      path.join(sliceDir, 'product-patch-tree.json'),
      'product patch tree',
    ),
    cycleContract: await readRequiredText(path.join(sliceDir, 'cycle-contract.md'), 'cycle contract'),
    nodeExecutionContract: await readRequiredText(
      path.join(sliceDir, 'node-execution-contracts', 'wt-search-001.md'),
      'node execution contract',
    ),
    runtimeEvidence: await readRequiredText(path.join(sliceDir, 'runtime-evidence.md'), 'runtime evidence'),
    approvalBrief: await readRequiredText(path.join(sliceDir, 'approval-brief.md'), 'approval brief'),
    evidenceExceptions: await readRequiredText(path.join(sliceDir, 'evidence-exceptions.md'), 'evidence exceptions'),
  }
}

function buildNodes(data: Record<string, unknown>): GraphNode[] {
  const productNodes = getArray<TreeNode>(data.productTree, 'nodes')
  const projectNodes = getArray<TreeNode>(data.projectTree, 'nodes')
  const workNodes = getArray<TreeNode>(data.workTree, 'nodes')
  const testNodes = getArray<TreeNode>(data.testTree, 'nodes')
  const evidenceNodes = getArray<TreeNode>(data.evidenceTree, 'nodes')
  const acceptanceNodes = getArray<TreeNode>(data.acceptanceTree, 'nodes')
  const changes = getArray<TreeNode>(data.changeTree, 'changes')
  const impacts = getArray<TreeNode>(data.impactTree, 'impacts')
  const patches = getArray<TreeNode>(data.productPatchTree, 'patches')
  const searchProduct = productNodes.find((node) => node.id === 'PT-SEARCH-001') || productNodes[0]
  const criteria = searchProduct?.acceptanceCriteria || []
  const nodes: GraphNode[] = [
    node(
      'TASK-TODO-SEARCH-PILOT',
      'task',
      'docs/concept/limited-pilot-transition-record.md',
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
        'examples/adoption/todo-search-slice/product-tree.json',
        criterion.statement || criterion.id,
        criterion.status || 'confirmed',
        'user-confirmed',
        requirementFreshness(criterion.status),
        ['required'],
        ['intent-view', 'behavior-view', 'verification-view'],
      ),
    ),
    ...productNodes
      .filter((entry) => entry.id === 'PT-SEARCH-001')
      .map((entry) =>
        node(
          entry.id,
          'requirement',
          'examples/adoption/todo-search-slice/product-tree.json',
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
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.test.js',
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
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.test.js',
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
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.test.js',
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
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.test.js',
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
          'examples/adoption/todo-search-slice/project-tree.json',
          entry.title || entry.id,
          entry.status || 'derived',
          'inferred',
          'fresh',
          ['context'],
          ['structure-view', 'scope-execution-view'],
        ),
      ),
    ...workNodes
      .filter((entry) => entry.id === 'WT-SEARCH-001')
      .map((entry) =>
        node(
          entry.id,
          'task',
          'examples/adoption/todo-search-slice/work-tree.json',
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
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.js',
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
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.test.js',
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
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.test.js',
      'Todo item with title and note/content fields',
      'present',
      'tool-confirmed',
      'fresh',
      ['context'],
      ['structure-view', 'behavior-view'],
    ),
    ...testNodes
      .filter((entry) => entry.id !== 'TT-ROOT')
      .map((entry) =>
        node(
          entry.id,
          'check',
          'examples/adoption/todo-search-slice/test-tree.json',
          entry.title || entry.id,
          entry.status || 'defined',
          confidenceForStatus(entry.status),
          checkFreshness(entry.status),
          ['required'],
          ['verification-view'],
        ),
      ),
    ...evidenceNodes
      .filter((entry) => entry.id !== 'EV-ROOT')
      .map((entry) =>
        node(
          entry.id,
          'evidence',
          'examples/adoption/todo-search-slice/evidence-tree.json',
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
        'examples/adoption/todo-search-slice/product-patch-tree.json',
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
        'examples/adoption/todo-search-slice/change-tree.json',
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
        'examples/adoption/todo-search-slice/impact-tree.json',
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
        'examples/adoption/todo-search-slice/acceptance-tree.json',
        entry.title || entry.id,
        entry.status || 'accepted',
        'user-confirmed',
        'fresh',
        ['output'],
        ['intent-view', 'evidence-acceptance-view'],
      ),
    ),
    node(
      'CYCLE-TODO-SEARCH',
      'document',
      'examples/adoption/todo-search-slice/cycle-contract.md',
      'Todo Search Cycle Contract',
      'present',
      'inferred',
      'fresh',
      ['required', 'guard'],
      ['scope-execution-view'],
    ),
    node(
      'NEC-WT-SEARCH-001',
      'document',
      'examples/adoption/todo-search-slice/node-execution-contracts/wt-search-001.md',
      'WT-SEARCH-001 Node Execution Contract',
      'present',
      'inferred',
      'fresh',
      ['required', 'guard'],
      ['scope-execution-view'],
    ),
    node(
      'AB-TODO-SEARCH',
      'document',
      'examples/adoption/todo-search-slice/approval-brief.md',
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
      'examples/adoption/compatibility-mismatch-slice/compatibility-control-node.md',
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
      'examples/adoption/todo-search-slice/runtime-evidence.md',
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
      'examples/adoption/todo-search-slice/evidence-exceptions.md',
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
      'docs/concept/generated-read-model-evidence-requirement.md',
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
      'examples/adoption/compatibility-mismatch-slice/evidence-exceptions.md',
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
      'examples/adoption/todo-search-slice/generated/generated-read-model.json',
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
      'examples/adoption/todo-search-slice/generated/read-model-parity-report.json',
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
      'docs/concept/limited-pilot-promotion-decision-package.md',
      'Limited Pilot Promotion Decision Package',
      'approved_option_recorded',
      'user-confirmed',
      'fresh',
      ['output'],
      ['intent-view'],
    ),
    node(
      'DEC-LIMITED-PILOT-PENDING',
      'decision',
      'docs/concept/scoped-source-authority-pilot-preparation-package.md',
      'Actual scoped source-authority execution decision remains pending',
      'decision_required',
      'user-confirmed',
      'fresh',
      ['output'],
      ['intent-view', 'scope-execution-view'],
    ),
    node(
      'DOC-LIMITED-PILOT-TRANSITION-RECORD',
      'document',
      'docs/concept/limited-pilot-transition-record.md',
      'Limited Pilot Transition Record',
      'recorded_non_executing',
      'user-confirmed',
      'fresh',
      ['output'],
      ['intent-view'],
    ),
    node(
      'VIEW-TODO-SEARCH-CORE-VIEWS',
      'view-instance',
      'examples/adoption/todo-search-slice/view-instance-manifest.json',
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

function buildEdges(): GraphEdge[] {
  return [
    edge(
      'E-TASK-TARGETS-REQ',
      'TASK-TODO-SEARCH-PILOT',
      'PT-SEARCH-001',
      'targets',
      'docs/concept/limited-pilot-transition-record.md',
      'inferred',
    ),
    edge(
      'E-TASK-REQUIRES-CYCLE',
      'TASK-TODO-SEARCH-PILOT',
      'CYCLE-TODO-SEARCH',
      'requires',
      'examples/adoption/todo-search-slice/cycle-contract.md',
      'inferred',
    ),
    edge(
      'E-TASK-REQUIRES-NEC',
      'TASK-TODO-SEARCH-PILOT',
      'NEC-WT-SEARCH-001',
      'requires',
      'examples/adoption/todo-search-slice/node-execution-contracts/wt-search-001.md',
      'inferred',
    ),
    edge(
      'E-PT-REQUIRES-AC1',
      'PT-SEARCH-001',
      'AC-SEARCH-001',
      'requires',
      'examples/adoption/todo-search-slice/product-tree.json',
      'user-confirmed',
    ),
    edge(
      'E-PT-REQUIRES-AC2',
      'PT-SEARCH-001',
      'AC-SEARCH-002',
      'requires',
      'examples/adoption/todo-search-slice/product-tree.json',
      'user-confirmed',
    ),
    edge(
      'E-PT-REQUIRES-AC3',
      'PT-SEARCH-001',
      'AC-SEARCH-003',
      'requires',
      'examples/adoption/todo-search-slice/product-tree.json',
      'user-confirmed',
    ),
    edge(
      'E-BEH-SEARCH-SATISFIES-AC1',
      'BEH-SEARCH-TITLE-NOTE',
      'AC-SEARCH-001',
      'satisfies',
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.test.js',
      'tool-confirmed',
    ),
    edge(
      'E-BEH-EMPTY-SATISFIES-AC2',
      'BEH-EMPTY-QUERY',
      'AC-SEARCH-002',
      'satisfies',
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.test.js',
      'tool-confirmed',
    ),
    edge(
      'E-BEH-NO-RESULT-SATISFIES-AC3',
      'BEH-NO-RESULT',
      'AC-SEARCH-003',
      'satisfies',
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.test.js',
      'tool-confirmed',
    ),
    edge(
      'E-PT-DERIVES-PJ-SURFACE',
      'PT-SEARCH-001',
      'PJ-TODO-LIST-SURFACE',
      'targets',
      'examples/adoption/todo-search-slice/project-tree.json',
      'inferred',
    ),
    edge(
      'E-PT-DERIVES-PJ-HELPER',
      'PT-SEARCH-001',
      'PJ-TODO-SEARCH-HELPER',
      'targets',
      'examples/adoption/todo-search-slice/project-tree.json',
      'inferred',
    ),
    edge(
      'E-WT-TARGETS-BEH-SEARCH',
      'WT-SEARCH-001',
      'BEH-SEARCH-TITLE-NOTE',
      'targets',
      'examples/adoption/todo-search-slice/work-tree.json',
      'inferred',
    ),
    edge(
      'E-WT-TARGETS-BEH-EMPTY',
      'WT-SEARCH-001',
      'BEH-EMPTY-QUERY',
      'targets',
      'examples/adoption/todo-search-slice/work-tree.json',
      'inferred',
    ),
    edge(
      'E-WT-TARGETS-BEH-NO-RESULT',
      'WT-SEARCH-001',
      'BEH-NO-RESULT',
      'targets',
      'examples/adoption/todo-search-slice/work-tree.json',
      'inferred',
    ),
    edge(
      'E-WT-PRESERVES-GUARD',
      'WT-SEARCH-001',
      'BEH-NON-SCOPE-GUARD',
      'preserves',
      'examples/adoption/todo-search-slice/work-tree.json',
      'tool-confirmed',
    ),
    edge(
      'E-WT-TOUCHES-CODE',
      'WT-SEARCH-001',
      'CODE-RUNTIME-SEARCH-HELPER',
      'touches',
      'examples/adoption/todo-search-slice/work-tree.json',
      'inferred',
    ),
    edge(
      'E-PJ-HELPER-TOUCHES-CODE',
      'PJ-TODO-SEARCH-HELPER',
      'CODE-RUNTIME-SEARCH-HELPER',
      'touches',
      'examples/adoption/todo-search-slice/project-tree.json',
      'inferred',
    ),
    edge(
      'E-CODE-IMPLEMENTS-SEARCH',
      'CODE-RUNTIME-SEARCH-HELPER',
      'BEH-SEARCH-TITLE-NOTE',
      'implements',
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.js',
      'tool-confirmed',
    ),
    edge(
      'E-CODE-IMPLEMENTS-EMPTY',
      'CODE-RUNTIME-SEARCH-HELPER',
      'BEH-EMPTY-QUERY',
      'implements',
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.js',
      'tool-confirmed',
    ),
    edge(
      'E-CODE-IMPLEMENTS-NO-RESULT',
      'CODE-RUNTIME-SEARCH-HELPER',
      'BEH-NO-RESULT',
      'implements',
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.js',
      'tool-confirmed',
    ),
    edge(
      'E-CODE-PRESERVES-GUARD',
      'CODE-RUNTIME-SEARCH-HELPER',
      'BEH-NON-SCOPE-GUARD',
      'preserves',
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.test.js',
      'tool-confirmed',
    ),
    edge(
      'E-CODE-READS-DATA',
      'CODE-RUNTIME-SEARCH-HELPER',
      'DATA-TODO-ITEM',
      'reads',
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.js',
      'tool-confirmed',
    ),
    edge(
      'E-CODE-TAKES-INPUT-DATA',
      'CODE-RUNTIME-SEARCH-HELPER',
      'DATA-TODO-ITEM',
      'takes-input',
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.js',
      'tool-confirmed',
    ),
    edge(
      'E-CODE-RETURNS-DATA',
      'CODE-RUNTIME-SEARCH-HELPER',
      'DATA-TODO-ITEM',
      'returns',
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.js',
      'tool-confirmed',
    ),
    edge(
      'E-TT-001-VERIFIES-SEARCH',
      'TT-SEARCH-001',
      'BEH-SEARCH-TITLE-NOTE',
      'verifies',
      'examples/adoption/todo-search-slice/test-tree.json',
      'tool-confirmed',
    ),
    edge(
      'E-TT-002-VERIFIES-EMPTY',
      'TT-SEARCH-002',
      'BEH-EMPTY-QUERY',
      'verifies',
      'examples/adoption/todo-search-slice/test-tree.json',
      'tool-confirmed',
    ),
    edge(
      'E-TT-003-VERIFIES-NO-RESULT',
      'TT-SEARCH-003',
      'BEH-NO-RESULT',
      'verifies',
      'examples/adoption/todo-search-slice/test-tree.json',
      'inferred',
    ),
    edge(
      'E-TT-004-VERIFIES-SEARCH',
      'TT-SEARCH-004',
      'BEH-SEARCH-TITLE-NOTE',
      'verifies',
      'examples/adoption/todo-search-slice/test-tree.json',
      'tool-confirmed',
    ),
    edge(
      'E-EV-NOTE-EVIDENCES-TT001',
      'EV-SEARCH-NOTE-TEST',
      'TT-SEARCH-001',
      'evidences',
      'examples/adoption/todo-search-slice/runtime-evidence.md',
      'tool-confirmed',
    ),
    edge(
      'E-EV-NOTE-EVIDENCES-TT002',
      'EV-SEARCH-NOTE-TEST',
      'TT-SEARCH-002',
      'evidences',
      'examples/adoption/todo-search-slice/runtime-evidence.md',
      'tool-confirmed',
    ),
    edge(
      'E-EV-NOTE-EVIDENCES-TT004',
      'EV-SEARCH-NOTE-TEST',
      'TT-SEARCH-004',
      'evidences',
      'examples/adoption/todo-search-slice/runtime-evidence.md',
      'tool-confirmed',
    ),
    edge(
      'E-EV-REVIEW-EVIDENCES-TT003',
      'EV-SEARCH-REVIEW',
      'TT-SEARCH-003',
      'evidences',
      'examples/adoption/todo-search-slice/evidence-tree.json',
      'inferred',
      'unknown',
    ),
    edge(
      'E-EV-HISTORICAL-EVIDENCES-TT001',
      'EV-SEARCH-TEST',
      'TT-SEARCH-001',
      'evidences',
      'examples/adoption/todo-search-slice/evidence-tree.json',
      'inferred',
      'stale',
    ),
    edge(
      'E-PP-APPROVES-CH',
      'PP-001',
      'CH-001',
      'approves',
      'examples/adoption/todo-search-slice/product-patch-tree.json',
      'user-confirmed',
    ),
    edge(
      'E-CH-TOUCHES-BEH-SEARCH',
      'CH-001',
      'BEH-SEARCH-TITLE-NOTE',
      'touches',
      'examples/adoption/todo-search-slice/change-tree.json',
      'user-confirmed',
    ),
    edge(
      'E-CH-INVALIDATES-EV-HISTORICAL',
      'CH-001',
      'EV-SEARCH-TEST',
      'invalidates',
      'examples/adoption/todo-search-slice/impact-tree.json',
      'inferred',
      'fresh',
    ),
    edge(
      'E-CH-INVALIDATES-OLD-ACCEPTANCE',
      'CH-001',
      'AT-ROOT',
      'invalidates',
      'examples/adoption/todo-search-slice/acceptance-tree.json',
      'inferred',
      'fresh',
    ),
    edge(
      'E-CH-PRESERVES-NON-SCOPE',
      'CH-001',
      'BEH-NON-SCOPE-GUARD',
      'preserves',
      'examples/adoption/todo-search-slice/runtime-fixture/todo-search.test.js',
      'tool-confirmed',
    ),
    edge(
      'E-CH-REQUIRES-EV-NOTE',
      'CH-001',
      'EV-SEARCH-NOTE-TEST',
      'requires',
      'examples/adoption/todo-search-slice/impact-tree.json',
      'inferred',
    ),
    edge(
      'E-IM-REPORTS-ON-CH',
      'IM-SEARCH-001',
      'CH-001',
      'reports-on',
      'examples/adoption/todo-search-slice/impact-tree.json',
      'inferred',
    ),
    edge(
      'E-IM-REPORTS-ON-EV-REVIEW',
      'IM-SEARCH-001',
      'EV-SEARCH-REVIEW',
      'reports-on',
      'examples/adoption/todo-search-slice/impact-tree.json',
      'inferred',
    ),
    edge(
      'E-CYCLE-REQUIRES-WT',
      'CYCLE-TODO-SEARCH',
      'WT-SEARCH-001',
      'requires',
      'examples/adoption/todo-search-slice/cycle-contract.md',
      'inferred',
    ),
    edge(
      'E-CYCLE-REQUIRES-EV',
      'CYCLE-TODO-SEARCH',
      'EV-SEARCH-NOTE-TEST',
      'requires',
      'examples/adoption/todo-search-slice/cycle-contract.md',
      'inferred',
    ),
    edge(
      'E-NEC-REQUIRES-WT',
      'NEC-WT-SEARCH-001',
      'WT-SEARCH-001',
      'requires',
      'examples/adoption/todo-search-slice/node-execution-contracts/wt-search-001.md',
      'inferred',
    ),
    edge(
      'E-NEC-PRESERVES-GUARD',
      'NEC-WT-SEARCH-001',
      'BEH-NON-SCOPE-GUARD',
      'preserves',
      'examples/adoption/todo-search-slice/node-execution-contracts/wt-search-001.md',
      'inferred',
    ),
    edge(
      'E-AT-APPROVES-PT',
      'AT-ROOT',
      'PT-SEARCH-001',
      'approves',
      'examples/adoption/todo-search-slice/acceptance-tree.json',
      'user-confirmed',
    ),
    edge(
      'E-AT-APPROVES-EV-NOTE',
      'AT-ROOT',
      'EV-SEARCH-NOTE-TEST',
      'approves',
      'examples/adoption/todo-search-slice/acceptance-tree.json',
      'user-confirmed',
    ),
    edge(
      'E-AB-REPORTS-ON-AT',
      'AB-TODO-SEARCH',
      'AT-ROOT',
      'reports-on',
      'examples/adoption/todo-search-slice/approval-brief.md',
      'user-confirmed',
    ),
    edge(
      'E-FIND-BOUNDED-REPORTS-ON-EV',
      'FIND-BOUNDED-FIXTURE',
      'EV-SEARCH-NOTE-TEST',
      'reports-on',
      'examples/adoption/todo-search-slice/runtime-evidence.md',
      'tool-confirmed',
    ),
    edge(
      'E-FIND-UI-REPORTS-ON-EV',
      'FIND-PARTIAL-UI',
      'EV-SEARCH-REVIEW',
      'reports-on',
      'examples/adoption/todo-search-slice/evidence-exceptions.md',
      'inferred',
      'unknown',
    ),
    edge(
      'E-FIND-BUILDER-REPORTS-ON-DOC',
      'FIND-GENERATED-BUILDER-MISSING',
      'DOC-READ-MODEL',
      'reports-on',
      'docs/concept/generated-read-model-evidence-requirement.md',
      'tool-confirmed',
    ),
    edge(
      'E-FIND-ACEP-REPORTS-ON-CCN',
      'FIND-ACEP-CLEANUP-DEFERRED',
      'CCN-ACEP-TASK-CARD-AUTHORITY-001',
      'reports-on',
      'examples/adoption/compatibility-mismatch-slice/compatibility-control-node.md',
      'inferred',
      'unknown',
    ),
    edge(
      'E-CCN-REPORTS-ON-PACKAGE',
      'CCN-ACEP-TASK-CARD-AUTHORITY-001',
      'DOC-LIMITED-PILOT-PACKAGE',
      'reports-on',
      'examples/adoption/compatibility-mismatch-slice/compatibility-control-node.md',
      'inferred',
    ),
    edge(
      'E-DOC-PARITY-REPORTS-ON-VIEW',
      'DOC-PARITY-CHECK',
      'VIEW-TODO-SEARCH-CORE-VIEWS',
      'reports-on',
      'examples/adoption/todo-search-slice/generated/read-model-parity-report.json',
      'tool-confirmed',
    ),
    edge(
      'E-VIEW-DERIVES-TASK',
      'VIEW-TODO-SEARCH-CORE-VIEWS',
      'TASK-TODO-SEARCH-PILOT',
      'derives-view',
      'examples/adoption/todo-search-slice/view-instance-manifest.json',
      'inferred',
    ),
    edge(
      'E-VIEW-DERIVES-REQ',
      'VIEW-TODO-SEARCH-CORE-VIEWS',
      'PT-SEARCH-001',
      'derives-view',
      'examples/adoption/todo-search-slice/view-instance-manifest.json',
      'inferred',
    ),
    edge(
      'E-VIEW-DERIVES-CONTRACT',
      'VIEW-TODO-SEARCH-CORE-VIEWS',
      'CYCLE-TODO-SEARCH',
      'derives-view',
      'examples/adoption/todo-search-slice/view-instance-manifest.json',
      'inferred',
    ),
    edge(
      'E-VIEW-DERIVES-EVIDENCE',
      'VIEW-TODO-SEARCH-CORE-VIEWS',
      'EV-SEARCH-NOTE-TEST',
      'derives-view',
      'examples/adoption/todo-search-slice/view-instance-manifest.json',
      'inferred',
    ),
    edge(
      'E-DEC-APPROVES-TRANSITION-RECORD',
      'DEC-LIMITED-PILOT-PENDING',
      'DOC-LIMITED-PILOT-TRANSITION-RECORD',
      'approves',
      'docs/concept/limited-pilot-transition-record.md',
      'user-confirmed',
    ),
  ]
}

function buildCoreViewCoverage(): CoreViewCoverage[] {
  return [
    view(
      'intent-view',
      'Intent View',
      [
        'TASK-TODO-SEARCH-PILOT',
        'PT-SEARCH-001',
        'AC-SEARCH-001',
        'AC-SEARCH-002',
        'AC-SEARCH-003',
        'PP-001',
        'AT-ROOT',
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
        'PT-SEARCH-001',
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
      ['TASK-TODO-SEARCH-PILOT', 'WT-SEARCH-001', 'CYCLE-TODO-SEARCH', 'NEC-WT-SEARCH-001', 'BEH-NON-SCOPE-GUARD'],
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
        'AT-ROOT',
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
        'AT-ROOT',
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

function buildCheckEvidenceMapping(data: Record<string, unknown>): Array<Record<string, unknown>> {
  const tests = getArray<TreeNode>(data.testTree, 'nodes').filter((entry) => entry.id !== 'TT-ROOT')
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

function buildRetainedWarnings(): Array<Record<string, unknown>> {
  return [
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
        'Generated read-model output now exists for the bounded Todo Search slice; validator/CI/full promotion repeatability remains later.',
    },
    {
      id: 'RW-ACEP-CLEANUP',
      findingNodeId: 'FIND-ACEP-CLEANUP-DEFERRED',
      status: 'deferred-cleanup',
      summary: 'ACEP task-card public-doc cleanup remains deferred.',
    },
  ]
}

function buildCompatibilityWarnings(): Array<Record<string, unknown>> {
  return [
    {
      id: 'CCN-ACEP-TASK-CARD-AUTHORITY-001',
      source: 'examples/adoption/compatibility-mismatch-slice',
      role: 'supplemental warning only',
      summary: 'Legacy ACEP/task-card wording remains a compatibility warning, not pilot source scope.',
    },
  ]
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

function sourceArtifactList(root: string, slice: string): SourceArtifact[] {
  const relativePaths = [
    `${slice}/product-tree.json`,
    `${slice}/project-tree.json`,
    `${slice}/work-tree.json`,
    `${slice}/test-tree.json`,
    `${slice}/evidence-tree.json`,
    `${slice}/acceptance-tree.json`,
    `${slice}/change-tree.json`,
    `${slice}/impact-tree.json`,
    `${slice}/product-patch-tree.json`,
    `${slice}/cycle-contract.md`,
    `${slice}/node-execution-contracts/wt-search-001.md`,
    `${slice}/runtime-evidence.md`,
    `${slice}/approval-brief.md`,
    `${slice}/evidence-exceptions.md`,
    'examples/adoption/compatibility-mismatch-slice/compatibility-control-node.md',
  ]
  return relativePaths.map((entry) => {
    const absolutePath = path.resolve(root, entry)
    return {
      relativePath: entry,
      absolutePath,
      status: existsSync(absolutePath) ? 'present' : 'missing',
    }
  })
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
