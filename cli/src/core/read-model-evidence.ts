import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { format } from 'prettier'
import { reportCompilerBoundary, type CompilerBoundaryReport } from './compiler-boundary.js'
import { reportCompilerInputModel, type CompilerInputModelReport } from './compiler-input-model.js'
import { compileExecutionContractDryRun, type ContractCompilerDryRunReport } from './contract-compiler-dry-run.js'
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

export interface GraphSourceArtifact {
  schemaVersion: 1
  artifactRole: 'limited-graph-source'
  status: 'limited-source-active'
  promotionScope: 'todo-search-selected-slice'
  sourceSlice: string
  sourceProfile: string
  sourceAuthorityBoundary: string
  projectionBoundary: string
  fallbackReferences: string[]
  retainedCompatibilityArtifacts: string[]
  sourceRecords: {
    nodes: GraphNode[]
    edges: GraphEdge[]
    coreViewCoverage: CoreViewCoverage[]
  }
  projectionTargets: Array<Record<string, string>>
  userAcceptanceBoundary: string
}

export interface StructureOnlyGraphSourceCandidateArtifact {
  schemaVersion: 1
  artifactRole: 'structure-only-graph-source'
  status: 'confirmed-graph-source-backed'
  graphSourceScope: 'todo-app-pbe-run-structure-only'
  sourceSlice: string
  sourceProfile: string
  policyLevel: 'structure-only'
  sourceAuthorityBoundary: string
  projectionBoundary: string
  fallbackReferences: string[]
  retainedCompatibilityArtifacts: string[]
  sourceRecords: GraphSourceArtifact['sourceRecords']
  graphSourceBoundaries: {
    nonPromotionStatement: string
    userAcceptanceBoundary: string
    validateAllBoundary: string
  }
}

export interface GraphSourceProjectionResult {
  graphSourcePath: string
  projection: GraphSourceProjectionArtifact
}

export interface StructureOnlyGraphSourceCandidateProjectionArtifact
  extends Pick<GeneratedReadModel, 'taxonomy' | 'nodes' | 'edges' | 'coreViewCoverage'> {
  metadata: {
    artifactRole: 'structure_only_graph_source_read_model_projection'
    sourceArtifact: string
    sourceSlice: string
    sourceProfile: string
    graphSourceScope: 'todo-app-pbe-run-structure-only'
    policyLevel: 'structure-only'
    projectionBoundary: string
  }
  fallbackReferences: string[]
  retainedCompatibilityArtifacts: string[]
  sourceAuthorityBoundary: string
  nonPromotionStatement: string
  userAcceptanceBoundary: string
  validateAllBoundary: string
}

export interface StructureOnlyGraphSourceCandidateProjectionResult {
  graphSourcePath: string
  projection: StructureOnlyGraphSourceCandidateProjectionArtifact
}

export type GraphSourceProjectionFileResult = (
  | GraphSourceProjectionResult
  | StructureOnlyGraphSourceCandidateProjectionResult
) & {
  projectionJsonPath: string
}

export interface GraphSourceProjectionArtifact
  extends Pick<GeneratedReadModel, 'taxonomy' | 'nodes' | 'edges' | 'coreViewCoverage'> {
  metadata: {
    artifactRole: 'graph_source_read_model_projection'
    sourceArtifact: string
    sourceSlice: string
    sourceProfile: string
    promotionScope: 'todo-search-selected-slice'
    projectionBoundary: string
  }
  fallbackReferences: string[]
  retainedCompatibilityArtifacts: string[]
  sourceAuthorityBoundary: string
  nonPromotionStatement: string
  userAcceptanceBoundary: string
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
  sliceValidationContract?: Record<string, unknown>
  recommendedNextDecisionSurface: string[]
}

interface ValidateResult {
  reportJsonPath: string
  reportMarkdownPath: string
  report: ValidationReport
}

type AggregateStatus = 'aggregate-pass' | 'aggregate-warning' | 'aggregate-blocked' | 'decision-required'

interface PerSliceAggregateSummary {
  sourceSlice: string
  reportPath: string
  reportStatus: 'present' | 'missing' | 'malformed'
  profileId: string
  policyLevel: string
  sourceLayout: string
  validationStatus: string
  checkCount: number
  passCount: number
  warningCount: number
  blockingCount: number
  decisionRequiredCount: number
  parityRequirement: Record<string, unknown>
  pilotMarkerRequirement: Record<string, unknown>
  runtimeFixtureRequirement: Record<string, unknown>
  retainedWarningCount: number
  acceptedLimitations: Array<Record<string, unknown>>
  sourceAuthorityBoundary: string
  nonPromotionStatement: string
  notes: string[]
}

interface AggregateReadModelSummary {
  version: string
  metadata: Record<string, unknown>
  status: AggregateStatus
  aggregateBoundary: string
  nonPromotionStatement: string
  decisionRule: string[]
  includedSlices: string[]
  summary: {
    sliceCount: number
    presentReportCount: number
    missingReportCount: number
    malformedReportCount: number
    validationPassCount: number
    warningCount: number
    blockingCount: number
    decisionRequiredCount: number
    retainedWarningCount: number
    status: AggregateStatus
  }
  perSliceSummaries: PerSliceAggregateSummary[]
  recommendedNextDecisionSurface: string[]
}

interface AggregateResult {
  summaryJsonPath: string
  summaryMarkdownPath: string
  summary: AggregateReadModelSummary
}

interface ValidateAllProfileResult {
  profileId: string
  sourceSlice: string
  policyLevel: SliceReadModelConfig['policyLevel']
  commands: Array<Record<string, unknown>>
  status: 'pass' | 'blocked' | 'decision-required'
}

interface ValidateAllResult {
  status: AggregateStatus
  registryPath: string
  includedProfiles: Array<{
    profileId: string
    sourceSlice: string
    policyLevel: SliceReadModelConfig['policyLevel']
    requiredCommands: RegistryCommand[]
    projectionContractRequired: boolean
  }>
  perSliceResults: ValidateAllProfileResult[]
  aggregateResult: AggregateResult
  sourceAuthorityBoundary: string
  nonPromotionStatement: string
  nonEnforcementStatement: string
}

interface CandidateObservationResult {
  status: 'candidate-observation-pass' | 'candidate-observation-blocked'
  observedCandidates: Array<{
    profileId: string
    sourceSlice: string
    graphSource: string
    projection: string
    status: 'projection-contract-pass' | 'projection-contract-blocked'
    nodeCount: number
    edgeCount: number
    coreViewCount: number
    policyLevel: 'structure-only'
    nonPromotionStatement: string
    sourceAuthorityBoundary: string
    validateAllBoundary: string
    error?: string
  }>
  sourceAuthorityBoundary: string
  nonPromotionStatement: string
  validateAllBoundary: string
}

interface IntentCriticalGraphSourceExample {
  schemaVersion: 1
  artifactRole: 'intent-critical-graph-source-example'
  exampleKind: 'native-pbe' | 'retrofit-pbe'
  status: 'intent-preservation-fixture'
  sourceSlice: string
  intentRecords: IntentCriticalRecord[]
}

interface IntentCriticalRecord {
  id: string
  edgeIntent: EdgeIntentAnnotation
}

interface EdgeIntentAnnotation {
  edgeType: string
  intentKind: string
  riskKind: string
  claim: string
  confidence: string
  enforcement: string
  anchors: EdgeIntentAnchor[]
}

interface EdgeIntentAnchor {
  signalKind: string
  sourceRole: string
  artifact: string
}

interface EdgeIntentReadModelProjection {
  schemaVersion: 1
  artifactRole: 'edge-intent-read-model-projection'
  projectionStatus: 'intent-projection-pass'
  sourceArtifact: string
  sourceExampleKind: 'native-pbe' | 'retrofit-pbe'
  projectionBoundary: string
  edgeIntentProjections: Array<
    EdgeIntentAnnotation & {
      sourceIntentRecordId: string
      humanReadableSummary: string
    }
  >
  vocabularyBoundary: {
    classificationFields: string[]
    projectSpecificClaimField: 'claim'
    claimBoundary: string
  }
}

interface EdgeIntentProjectionFileResult {
  graphSourcePath: string
  projectionJsonPath: string
  projection: EdgeIntentReadModelProjection
}

interface EdgeIntentProjectionReportResult {
  status: 'intent-report-pass' | 'intent-report-blocked'
  projectedFixtureCount: number
  edgeIntentCount: number
  claimCount: number
  classificationCount: number
  anchorCount: number
  missingClassificationCount: number
  missingAnchorCount: number
  fixtures: EdgeIntentProjectionFixtureSummary[]
  nonEnforcementStatement: string
  requiredCheckBoundary: string
  validateAllBoundary: string
}

interface GraphSourceHealthReport {
  status: 'graph-source-health-pass' | 'graph-source-health-blocked'
  validateAll: {
    status: AggregateStatus | 'missing' | 'malformed'
    aggregateStatus: AggregateStatus | 'missing' | 'malformed'
    sliceCount: number
    source: string
  }
  e2eSmoke: {
    status: 'referenced-by-transition-status' | 'not-referenced'
    command: 'npm run test:read-model:e2e'
    intentReportExpected: boolean
  }
  todoSearch: {
    sourceMode: string
    graphSourceArtifact: string
    projectionContractStatus: 'projection-contract-pass' | 'projection-contract-blocked'
    nodeCount: number
    edgeCount: number
    coreViewCount: number
    retirementApprovalStatus: string
    retirementReadinessStatus: string
  }
  todoApp: {
    sourceMode: string
    graphSourceAuthorityStatus: string
    projectionContractStatus: 'projection-contract-pass' | 'projection-contract-blocked'
    nodeCount: number
    edgeCount: number
    coreViewCount: number
    retirementApprovalStatus: string
    retirementReadinessStatus: string
  }
  edgeIntent: Pick<
    EdgeIntentProjectionReportResult,
    | 'status'
    | 'projectedFixtureCount'
    | 'edgeIntentCount'
    | 'claimCount'
    | 'classificationCount'
    | 'anchorCount'
    | 'missingClassificationCount'
    | 'missingAnchorCount'
  >
  compilerBoundary: Pick<
    CompilerBoundaryReport,
    'status' | 'taskRegistryStatus' | 'contractSchemaStatus' | 'contractValidatorStatus' | 'dryRunContractStatus'
  > & {
    dryRunChangeId: string
    requiredCheckCount: number
    requiredEvidenceCount: number
  }
  compilerInputModel: Pick<CompilerInputModelReport, 'status' | 'inputSchemaStatus' | 'dryRunInputStatus'> & {
    dryRunChangeId: string
    graphSnapshotArtifactCount: number
    policyCount: number
    evidenceEntryCount: number
    targetScopeCandidateCount: number
    outputRequirementSourceCount: number
    stopConditionSourceCount: number
    riskSourceCount: number
  }
  contractCompilerDryRun: Pick<ContractCompilerDryRunReport, 'status' | 'inputModelStatus' | 'candidateStatus'> & {
    dryRunChangeId: string
    requiredCheckCount: number
    requiredEvidenceCount: number
    outputCandidate: string
    candidateDiffStatus: string
    candidateDiffReviewStatus: string
    candidateEquivalenceStatus: string
    differingFieldCount: number
    diffReport: string
    diffReviewBoundary: string
    compilerPromotionReadiness: string
    promotionReadiness: string
    highestReviewSeverity: string
    semanticClassificationCounts: Record<string, number>
    semanticDiffRuleCoverage: {
      totalDiffs: number
      classifiedDiffs: number
      unknownDiffs: number
      matchedRuleIds: string[]
      unknownFields: string[]
    }
    v01CloseoutStatus: string
    semanticDiffUnknownsStatus: string
    semanticDiffUnknownsResolved: boolean
    semanticDiffCoverageComplete: boolean
    equivalencePolicy: ContractCompilerDryRunReport['candidateDiff']['equivalencePolicy']
    equivalenceProven: boolean
    outputRequirementSourceAuthorityPreview: ContractCompilerDryRunReport['outputRequirementSourceAuthorityPreview']
    outputRequirementSourceAuthorityPreviewPath: string
    sourceAuthorityGapPreview: ContractCompilerDryRunReport['sourceAuthorityGapPreview']
    sourceAuthorityGapPreviewPath: string
    promotionReview: ContractCompilerDryRunReport['promotionReview']
    promotionReviewPacketPath: string
  }
  treeNativeRetirement: {
    readinessStatus: string
    todoSearchApprovalStatus: string
    todoAppApprovalStatus: string
    repoWideApprovalStatus: string
    explicitRetirementApproval: string
    retirementAction: string
  }
  runtimeBudget: {
    runtimeBudgetTargetMs: 5000
    lastTimingSmokeStatus: 'not-run-by-report-health'
    timingSmokeCommand: 'npm run devview:runtime:smoke'
    advisoryOnly: true
    runtimeBudgetEnforced: false
    aiEditingTimeExcluded: true
    fullValidationExcluded: true
    ciRuntimeExcluded: true
    humanReviewExcluded: true
  }
  scopeComplianceEvaluator: {
    scopeComplianceEvaluatorStatus: 'advisory-cli-available'
    command: 'graph read-model check-scope --base <baseRef> --head <headRef> --json'
    compactReportCommand: 'graph read-model check-scope --base <baseRef> --head <headRef> --markdown <file> --json'
    compactReportStatus: 'compact-advisory-runtime-report-available'
    nonEnforcing: true
    enforcementStatus: 'not-enforced'
    lastEvaluationArtifact: string
    reportHealthRunsEvaluator: false
    compactReportIsBlocking: false
    advisoryFindingsAreBlocking: false
  }
  graphDeltaProposalGenerator: {
    graphDeltaProposalGeneratorStatus: 'proposal-only-cli-available'
    command: 'graph read-model propose-graph-delta --source <sourceArtifact> --json'
    explicitOutputCommand: 'graph read-model propose-graph-delta --source <sourceArtifact> --output <proposalPath> --json'
    proposalOnly: true
    graphSourceMutated: false
    graphDeltaApplied: false
    approvalStatus: 'not-approved'
    nonEnforcing: true
    enforcementStatus: 'not-enforced'
    lastProposalPreviewArtifact: string
    reportHealthRunsGenerator: false
  }
  graphDeltaHumanReviewPacket: {
    graphDeltaHumanReviewPacketStatus: 'review-packet-cli-available'
    command: 'graph read-model review-graph-delta --proposal <proposalPath> --json'
    markdownCommand: 'graph read-model review-graph-delta --proposal <proposalPath> --markdown <file> --json'
    reviewPacketSurface: 'human-review-input-only'
    approvalStatus: 'not-approved'
    graphSourceMutated: false
    graphDeltaApplied: false
    humanDecisionRecorded: false
    reportHealthRunsReviewPacket: false
  }
  requestIrGraphValidator: {
    requestIrGraphValidatorStatus: 'graph-aware-cli-available'
    command: 'graph read-model validate-request-ir-graph --candidate <candidatePath> --schema-validation <schemaValidationPath> --json'
    graphValidationStatus: 'not-run-by-report-health'
    graphTraversalAllowed: false
    graphTraversalExecuted: false
    selectedGraphSliceGenerated: false
    contractGenerationAllowed: false
    contractInputGenerated: false
    instructionPackGenerationAllowed: false
    instructionPackGenerated: false
    reportHealthRunsValidator: false
  }
  enforcementStatus: 'non-enforcing'
  nonEnforcementStatement: string
  requiredCheckBoundary: string
  blockingReasons: string[]
}

interface EdgeIntentProjectionFixtureSummary {
  graphSource: string
  sourceExampleKind: 'native-pbe' | 'retrofit-pbe' | 'unknown'
  status: 'intent-projection-pass' | 'intent-projection-blocked'
  edgeIntentCount: number
  claimCount: number
  classificationCount: number
  anchorCount: number
  missingClassificationCount: number
  missingAnchorCount: number
  claims: string[]
  classificationFields: string[]
  error?: string
}

const defaultIntentCriticalGraphSourcePaths = [
  'examples/intent-critical/native-pbe-maintenance/graph-source-intent.json',
  'examples/intent-critical/retrofit-pbe-maintenance/graph-source-intent.json',
]

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
  policyLevel: 'pilot-marker-backed' | 'structure-only'
  sourceLayout: 'flat-demo-support' | 'canonical-pbe'
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
    productPatchTree?: string
    cycleContract: string
    cycleTree?: string
    nodeExecutionContract?: string
    runtimeEvidence?: string
    approvalBrief?: string
    evidenceExceptions?: string
    runtimeHelper?: string
    runtimeTest?: string
    viewManifest?: string
    manualReadModel?: string
    generatedReadModel: string
    generatedParityReport?: string
    validationReport?: string
    evidenceManifest?: string
    scopedPilotMarker?: string
    limitedPilotTransitionRecord?: string
    limitedPilotPackage?: string
    scopedPilotExecutionRecord?: string
    scopedPilotReview?: string
    scopedPilotActiveObservation?: string
    generatedEvidenceRequirement?: string
    compatibilitySlice?: string
    compatibilityControlNode?: string
    compatibilityEvidenceExceptions?: string
    graphSource?: string
    workGraph?: string
    sourceOfTruthMatrix?: string
    evidenceOutput?: string
    pbeState?: string
  }
  sourceArtifactRelativePaths: string[]
  retainedWarnings: Array<Record<string, unknown>>
  compatibilityWarnings: Array<Record<string, unknown>>
}

type RegistryCommand = 'generate' | 'compare' | 'validate'

export interface ReadModelSliceRegistryProfile {
  profileId: string
  sourceSlice: string
  sourceLayout: SliceReadModelConfig['sourceLayout']
  policyLevel: SliceReadModelConfig['policyLevel']
  includedInValidateAll: boolean
  requiredCommands: RegistryCommand[]
  requiredArtifacts: Record<string, string>
  optionalArtifacts: Record<string, string>
  expectedCounts: {
    nodes: number
    edges: number
    validationChecks: number
  }
  parityRequirement: Record<string, unknown>
  pilotMarkerRequirement: Record<string, unknown>
  runtimeFixtureRequirement: Record<string, unknown>
  retainedWarnings: string[]
  fallbackReferences: string[]
  ciInclusion: string
  boundaryStatements: {
    sourceAuthorityBoundary: string
    nonPromotionStatement: string
    userAcceptanceBoundary: string
  }
}

export interface ReadModelSliceRegistry {
  schemaVersion: 1
  registryRole: 'read-model-slice-registry-fixture'
  status: string
  sourceAuthorityBoundary: string
  nonPromotionStatement: string
  mutationBoundary: string
  profiles: ReadModelSliceRegistryProfile[]
}

export interface ReadModelRegistryCommandPlan {
  profileId: string
  sourceSlice: string
  policyLevel: SliceReadModelConfig['policyLevel']
  commands: RegistryCommand[]
  requiredArtifacts: Record<string, string>
  optionalArtifacts: Record<string, string>
  expectedCounts: ReadModelSliceRegistryProfile['expectedCounts']
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
    manualReadModel: 'maintainability-graph-read-model.json',
    generatedReadModel: 'generated/generated-read-model.json',
    generatedParityReport: 'generated/read-model-parity-report.json',
    validationReport: 'generated/read-model-validation-report.json',
    evidenceManifest: 'generated/read-model-evidence-manifest.json',
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
    graphSource: 'graph-source.json',
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
    'graph-source.json',
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

export const todoAppPbeRunStructureOnlyProfile: SliceReadModelConfig = {
  profileId: 'todo-app-pbe-run-structure-only',
  displayName: 'Todo App PBE Golden Run',
  supportedSlice: 'examples/valid/todo-app-pbe-run',
  policyLevel: 'structure-only',
  sourceLayout: 'canonical-pbe',
  expectedCounts: {
    nodes: 22,
    edges: 38,
    validationChecks: 16,
  },
  ids: {
    product: 'PT-1',
    work: 'WT-1',
    testRoot: 'TT-ROOT',
    evidenceRoot: 'EV-ROOT',
    acceptanceRoot: 'ACCEPT-PT-1',
    cycleContract: 'CY-1',
    nodeExecutionContract: 'CY-1-CONTRACT',
    viewInstance: 'VIEW-TODO-APP-PBE-RUN-STRUCTURE',
  },
  artifacts: {
    productTree: '.pbe/tree/product-tree.json',
    projectTree: '.pbe/tree/project-tree.json',
    workTree: '.pbe/tree/work-tree.json',
    testTree: '.pbe/tree/test-tree.json',
    evidenceTree: '.pbe/evidence/evidence-tree.json',
    acceptanceTree: '.pbe/control/acceptance-tree.json',
    changeTree: '.pbe/control/change-tree.json',
    impactTree: '.pbe/control/impact-tree.json',
    cycleContract: '.pbe/execution/cycle-contract.md',
    cycleTree: '.pbe/execution/cycle-tree.json',
    generatedReadModel: 'generated/generated-read-model.json',
    validationReport: 'generated/read-model-validation-report.json',
    evidenceManifest: 'generated/read-model-evidence-manifest.json',
    workGraph: '.pbe/blueprint/work-graph.json',
    sourceOfTruthMatrix: '.pbe/blueprint/source-of-truth-matrix.md',
    evidenceOutput: '.pbe/evidence/test-results/todo-add.txt',
    pbeState: '.pbe/blueprint/pbe-state.json',
    graphSource: 'graph-source.json',
  },
  sourceArtifactRelativePaths: [
    '.pbe/tree/product-tree.json',
    '.pbe/tree/project-tree.json',
    '.pbe/tree/work-tree.json',
    '.pbe/tree/test-tree.json',
    '.pbe/evidence/evidence-tree.json',
    '.pbe/control/acceptance-tree.json',
    '.pbe/control/change-tree.json',
    '.pbe/control/impact-tree.json',
    '.pbe/execution/cycle-tree.json',
    '.pbe/execution/cycle-contract.md',
    '.pbe/blueprint/work-graph.json',
    '.pbe/blueprint/source-of-truth-matrix.md',
    '.pbe/evidence/test-results/todo-add.txt',
    '.pbe/blueprint/pbe-state.json',
    'graph-source.json',
  ],
  retainedWarnings: [
    {
      id: 'RW-STRUCTURE-ONLY',
      findingNodeId: 'FIND-STRUCTURE-ONLY-LIMITATION',
      status: 'structure-only-limitation',
      summary:
        'This profile validates canonical .pbe structure only; no manual parity artifact, pilot marker, CI-backed Evidence, or source-authority pilot is required or claimed.',
    },
    {
      id: 'RW-NO-RUNTIME-FIXTURE',
      findingNodeId: 'FIND-NO-RUNTIME-FIXTURE',
      status: 'accepted-structure-only-limitation',
      summary:
        'The fixture contains attached test-output Evidence but no runnable app/runtime fixture is required for structure-only validation.',
    },
  ],
  compatibilityWarnings: [],
}

export function getSliceReadModelProfile(slice: string): SliceReadModelConfig {
  const normalized = normalizePath(slice)
  if (normalized === todoSearchReadModelProfile.supportedSlice) {
    return todoSearchReadModelProfile
  }
  if (normalized === todoAppPbeRunStructureOnlyProfile.supportedSlice) {
    return todoAppPbeRunStructureOnlyProfile
  }
  throw new Error(
    `No read-model profile is configured for slice "${slice}". Currently supported profiles: ${[
      todoSearchReadModelProfile.supportedSlice,
      todoAppPbeRunStructureOnlyProfile.supportedSlice,
    ].join(', ')}`,
  )
}

export async function loadReadModelSliceRegistry(
  root: string,
  registryPath = 'examples/read-model-aggregate/read-model-slices.json',
): Promise<ReadModelSliceRegistry> {
  const absoluteRegistryPath = path.resolve(root, registryPath)
  const parsed = await readJsonSafe<unknown>(absoluteRegistryPath)
  if (!parsed.ok) {
    throw new Error(`Unable to read read-model slice registry at ${registryPath}: ${parsed.error}`)
  }
  return normalizeReadModelSliceRegistry(parsed.value, registryPath)
}

export function normalizeReadModelSliceRegistry(
  value: unknown,
  registryPath = 'read-model-slices.json',
): ReadModelSliceRegistry {
  const errors: string[] = []
  const source = asRecord(value, 'registry', errors)
  const schemaVersion = source.schemaVersion
  const registryRole = source.registryRole
  const status = requiredString(source, 'status', errors)
  const sourceAuthorityBoundary = requiredString(source, 'sourceAuthorityBoundary', errors)
  const nonPromotionStatement = requiredString(source, 'nonPromotionStatement', errors)
  const mutationBoundary = requiredString(source, 'mutationBoundary', errors)
  const profilesValue = source.profiles

  if (schemaVersion !== 1) {
    errors.push('registry.schemaVersion must be 1')
  }
  if (registryRole !== 'read-model-slice-registry-fixture') {
    errors.push('registry.registryRole must be read-model-slice-registry-fixture')
  }
  if (!Array.isArray(profilesValue)) {
    errors.push('registry.profiles must be an array')
  }

  const profiles: ReadModelSliceRegistryProfile[] = []
  const seenProfileIds = new Set<string>()
  if (Array.isArray(profilesValue)) {
    for (const [index, profileValue] of profilesValue.entries()) {
      const profile = normalizeReadModelSliceRegistryProfile(profileValue, index, errors)
      if (profile) {
        if (seenProfileIds.has(profile.profileId)) {
          errors.push(`registry.profiles[${index}].profileId duplicates ${profile.profileId}`)
        }
        validateReadModelRegistryPolicyConsistency(profile, index, errors)
        seenProfileIds.add(profile.profileId)
        profiles.push(profile)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid read-model slice registry ${registryPath}: ${errors.join('; ')}`)
  }

  return {
    schemaVersion: 1,
    registryRole: 'read-model-slice-registry-fixture',
    status,
    sourceAuthorityBoundary,
    nonPromotionStatement,
    mutationBoundary,
    profiles,
  }
}

export function buildReadModelRegistryCommandPlans(registry: ReadModelSliceRegistry): ReadModelRegistryCommandPlan[] {
  return registry.profiles
    .filter((profile) => profile.includedInValidateAll)
    .map((profile) => ({
      profileId: profile.profileId,
      sourceSlice: profile.sourceSlice,
      policyLevel: profile.policyLevel,
      commands: [...profile.requiredCommands],
      requiredArtifacts: { ...profile.requiredArtifacts },
      optionalArtifacts: { ...profile.optionalArtifacts },
      expectedCounts: { ...profile.expectedCounts },
    }))
}

export async function loadGraphSourceArtifact(
  root: string,
  graphSourcePath = `${todoSearchReadModelProfile.supportedSlice}/graph-source.json`,
): Promise<GraphSourceArtifact> {
  const absoluteGraphSourcePath = path.resolve(root, graphSourcePath)
  const parsed = await readJsonSafe<unknown>(absoluteGraphSourcePath)
  if (!parsed.ok) {
    throw new Error(`Unable to read graph source artifact at ${graphSourcePath}: ${parsed.error}`)
  }
  return normalizeGraphSourceArtifact(parsed.value, graphSourcePath)
}

export async function loadStructureOnlyGraphSourceCandidateArtifact(
  root: string,
  graphSourcePath = `${todoAppPbeRunStructureOnlyProfile.supportedSlice}/graph-source.json`,
): Promise<StructureOnlyGraphSourceCandidateArtifact> {
  const absoluteGraphSourcePath = path.resolve(root, graphSourcePath)
  const parsed = await readJsonSafe<unknown>(absoluteGraphSourcePath)
  if (!parsed.ok) {
    throw new Error(`Unable to read structure-only graph source at ${graphSourcePath}: ${parsed.error}`)
  }
  return normalizeStructureOnlyGraphSourceCandidateArtifact(parsed.value, graphSourcePath)
}

export async function loadStructureOnlyGraphSourceCandidateProjectionArtifact(
  root: string,
  projectionPath = `${todoAppPbeRunStructureOnlyProfile.supportedSlice}/generated/graph-source-read-model-projection.json`,
  graphSourcePath = `${todoAppPbeRunStructureOnlyProfile.supportedSlice}/graph-source.json`,
): Promise<StructureOnlyGraphSourceCandidateProjectionArtifact> {
  const graphSource = await loadStructureOnlyGraphSourceCandidateArtifact(root, graphSourcePath)
  const absoluteProjectionPath = path.resolve(root, projectionPath)
  const parsed = await readJsonSafe<unknown>(absoluteProjectionPath)
  if (!parsed.ok) {
    throw new Error(`Unable to read structure-only graph source projection at ${projectionPath}: ${parsed.error}`)
  }
  return normalizeStructureOnlyGraphSourceCandidateProjectionArtifact(
    parsed.value,
    graphSource,
    projectionPath,
    graphSourcePath,
  )
}

export async function loadGraphSourceProjectionArtifact(
  root: string,
  projectionPath = `${todoSearchReadModelProfile.supportedSlice}/generated/graph-source-read-model-projection.json`,
  graphSourcePath = `${todoSearchReadModelProfile.supportedSlice}/graph-source.json`,
): Promise<GraphSourceProjectionArtifact> {
  const graphSource = await loadGraphSourceArtifact(root, graphSourcePath)
  const absoluteProjectionPath = path.resolve(root, projectionPath)
  const parsed = await readJsonSafe<unknown>(absoluteProjectionPath)
  if (!parsed.ok) {
    throw new Error(`Unable to read graph source projection artifact at ${projectionPath}: ${parsed.error}`)
  }
  return normalizeGraphSourceProjectionArtifact(parsed.value, graphSource, projectionPath, graphSourcePath)
}

export async function observeReadModelCandidateProjections(root: string): Promise<CandidateObservationResult> {
  const graphSourceCandidatePath = `${todoAppPbeRunStructureOnlyProfile.supportedSlice}/graph-source.json`
  const projectionPath = `${todoAppPbeRunStructureOnlyProfile.supportedSlice}/generated/graph-source-read-model-projection.json`
  try {
    const projection = await loadStructureOnlyGraphSourceCandidateProjectionArtifact(
      root,
      projectionPath,
      graphSourceCandidatePath,
    )
    return {
      status: 'candidate-observation-pass',
      observedCandidates: [
        {
          profileId: projection.metadata.sourceProfile,
          sourceSlice: projection.metadata.sourceSlice,
          graphSource: graphSourceCandidatePath,
          projection: projectionPath,
          status: 'projection-contract-pass',
          nodeCount: projection.nodes.length,
          edgeCount: projection.edges.length,
          coreViewCount: projection.coreViewCoverage.length,
          policyLevel: 'structure-only',
          nonPromotionStatement: projection.nonPromotionStatement,
          sourceAuthorityBoundary: projection.sourceAuthorityBoundary,
          validateAllBoundary: projection.validateAllBoundary,
        },
      ],
      sourceAuthorityBoundary:
        'Graph-source observation checks confirmed structure-only graph-source projections only. It does not create enforcement or promotion beyond structure-only.',
      nonPromotionStatement:
        'Graph-source observation pass does not promote Todo App PBE Run beyond structure-only, approve repo-wide Graph-source promotion, or replace user acceptance.',
      validateAllBoundary:
        'Graph-source observation remains a separate report-only command. The Todo App graph-source projection is also checked by positive validate-all as confirmed structure-only Evidence.',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      status: 'candidate-observation-blocked',
      observedCandidates: [
        {
          profileId: todoAppPbeRunStructureOnlyProfile.profileId,
          sourceSlice: todoAppPbeRunStructureOnlyProfile.supportedSlice,
          graphSource: graphSourceCandidatePath,
          projection: projectionPath,
          status: 'projection-contract-blocked',
          nodeCount: 0,
          edgeCount: 0,
          coreViewCount: 0,
          policyLevel: 'structure-only',
          nonPromotionStatement: 'Blocked graph-source observation does not imply promotion beyond structure-only.',
          sourceAuthorityBoundary: 'Blocked graph-source observation does not create enforcement or user acceptance.',
          validateAllBoundary:
            'Blocked graph-source observation remains report-only; positive validate-all may also block on the same structure-only projection contract.',
          error: message,
        },
      ],
      sourceAuthorityBoundary:
        'Graph-source observation checks confirmed structure-only graph-source projections only. It does not create enforcement or promotion beyond structure-only.',
      nonPromotionStatement:
        'Graph-source observation block does not promote Todo App PBE Run beyond structure-only, approve repo-wide Graph-source promotion, or replace user acceptance.',
      validateAllBoundary:
        'Graph-source observation remains a separate report-only command. The Todo App graph-source projection is also checked by positive validate-all as confirmed structure-only Evidence.',
    }
  }
}

export function projectGraphSourceReadModel(
  graphSource: GraphSourceArtifact,
  graphSourcePath = `${todoSearchReadModelProfile.supportedSlice}/graph-source.json`,
): GraphSourceProjectionResult {
  return {
    graphSourcePath: normalizePath(graphSourcePath),
    projection: {
      metadata: {
        artifactRole: 'graph_source_read_model_projection',
        sourceArtifact: normalizePath(graphSourcePath),
        sourceSlice: graphSource.sourceSlice,
        sourceProfile: graphSource.sourceProfile,
        promotionScope: graphSource.promotionScope,
        projectionBoundary: graphSource.projectionBoundary,
      },
      taxonomy: {
        nodeKindsUsed: unique(graphSource.sourceRecords.nodes.map((node) => node.nodeKind)),
        edgeTypesUsed: unique(graphSource.sourceRecords.edges.map((edge) => edge.edgeType)),
        viewScopedTagsAllowed: allowedViewScopedTags,
        tagBoundary:
          'Tags describe temporary roles inside a View Instance only. Durable semantic meaning is represented by edges, not tags.',
      },
      nodes: cloneJson(graphSource.sourceRecords.nodes),
      edges: cloneJson(graphSource.sourceRecords.edges),
      coreViewCoverage: cloneJson(graphSource.sourceRecords.coreViewCoverage),
      fallbackReferences: cloneJson(graphSource.fallbackReferences),
      retainedCompatibilityArtifacts: cloneJson(graphSource.retainedCompatibilityArtifacts),
      sourceAuthorityBoundary: graphSource.sourceAuthorityBoundary,
      nonPromotionStatement:
        'Projection from graph-source artifact is Evidence/projection output. It does not replace user acceptance, CI enforcement, or repo-wide promotion.',
      userAcceptanceBoundary: graphSource.userAcceptanceBoundary,
    },
  }
}

export function projectStructureOnlyGraphSourceCandidateReadModel(
  graphSource: StructureOnlyGraphSourceCandidateArtifact,
  graphSourcePath = `${todoAppPbeRunStructureOnlyProfile.supportedSlice}/graph-source.json`,
): StructureOnlyGraphSourceCandidateProjectionResult {
  return {
    graphSourcePath: normalizePath(graphSourcePath),
    projection: {
      metadata: {
        artifactRole: 'structure_only_graph_source_read_model_projection',
        sourceArtifact: normalizePath(graphSourcePath),
        sourceSlice: graphSource.sourceSlice,
        sourceProfile: graphSource.sourceProfile,
        graphSourceScope: graphSource.graphSourceScope,
        policyLevel: 'structure-only',
        projectionBoundary: graphSource.projectionBoundary,
      },
      taxonomy: {
        nodeKindsUsed: unique(graphSource.sourceRecords.nodes.map((node) => node.nodeKind)),
        edgeTypesUsed: unique(graphSource.sourceRecords.edges.map((edge) => edge.edgeType)),
        viewScopedTagsAllowed: allowedViewScopedTags,
        tagBoundary:
          'Tags describe temporary roles inside a View Instance only. Durable semantic meaning is represented by edges, not tags.',
      },
      nodes: cloneJson(graphSource.sourceRecords.nodes),
      edges: cloneJson(graphSource.sourceRecords.edges),
      coreViewCoverage: cloneJson(graphSource.sourceRecords.coreViewCoverage),
      fallbackReferences: cloneJson(graphSource.fallbackReferences),
      retainedCompatibilityArtifacts: cloneJson(graphSource.retainedCompatibilityArtifacts),
      sourceAuthorityBoundary: graphSource.sourceAuthorityBoundary,
      nonPromotionStatement: graphSource.graphSourceBoundaries.nonPromotionStatement,
      userAcceptanceBoundary: graphSource.graphSourceBoundaries.userAcceptanceBoundary,
      validateAllBoundary: graphSource.graphSourceBoundaries.validateAllBoundary,
    },
  }
}

export async function projectGraphSourceReadModelToFile(
  root: string,
  graphSourcePath = `${todoSearchReadModelProfile.supportedSlice}/graph-source.json`,
  outputPath?: string,
): Promise<GraphSourceProjectionFileResult> {
  const normalizedGraphSourcePath = normalizePath(graphSourcePath)
  const absoluteGraphSourcePath = path.resolve(root, normalizedGraphSourcePath)
  const parsed = await readJsonSafe<unknown>(absoluteGraphSourcePath)
  if (!parsed.ok) {
    throw new Error(`Unable to read graph source artifact at ${normalizedGraphSourcePath}: ${parsed.error}`)
  }
  const source = asRecord(parsed.value, 'graphSource', [])
  const result =
    source.artifactRole === 'structure-only-graph-source'
      ? projectStructureOnlyGraphSourceCandidateReadModel(
          normalizeStructureOnlyGraphSourceCandidateArtifact(parsed.value, normalizedGraphSourcePath),
          normalizedGraphSourcePath,
        )
      : projectGraphSourceReadModel(
          normalizeGraphSourceArtifact(parsed.value, normalizedGraphSourcePath),
          normalizedGraphSourcePath,
        )
  const defaultOutput =
    source.artifactRole === 'structure-only-graph-source'
      ? `${todoAppPbeRunStructureOnlyProfile.supportedSlice}/generated/graph-source-read-model-projection.json`
      : `${todoSearchReadModelProfile.supportedSlice}/generated/graph-source-read-model-projection.json`
  const projectionJsonPath = path.resolve(root, outputPath || defaultOutput)
  await writeFormattedJson(projectionJsonPath, result.projection)
  return {
    ...result,
    projectionJsonPath,
  }
}

export async function projectIntentCriticalGraphSourceToFile(
  root: string,
  graphSourcePath: string,
  outputPath?: string,
): Promise<EdgeIntentProjectionFileResult> {
  const normalizedGraphSourcePath = normalizePath(graphSourcePath)
  const absoluteGraphSourcePath = path.resolve(root, normalizedGraphSourcePath)
  const parsed = await readJsonSafe<unknown>(absoluteGraphSourcePath)
  if (!parsed.ok) {
    throw new Error(`Unable to read intent graph source artifact at ${normalizedGraphSourcePath}: ${parsed.error}`)
  }
  const graphSource = normalizeIntentCriticalGraphSourceExample(parsed.value, normalizedGraphSourcePath)
  const projection = projectIntentCriticalGraphSource(graphSource, normalizedGraphSourcePath)
  const defaultOutput = `${path.dirname(normalizedGraphSourcePath)}/generated/edge-intent-read-model-projection.json`
  const projectionJsonPath = path.resolve(root, outputPath || defaultOutput)
  await writeFormattedJson(projectionJsonPath, projection)
  return {
    graphSourcePath: normalizedGraphSourcePath,
    projectionJsonPath,
    projection,
  }
}

export async function reportIntentCriticalProjection(
  root: string,
  graphSourcePaths = defaultIntentCriticalGraphSourcePaths,
): Promise<EdgeIntentProjectionReportResult> {
  const fixtures: EdgeIntentProjectionFixtureSummary[] = []
  for (const graphSourcePath of graphSourcePaths) {
    const normalizedGraphSourcePath = normalizePath(graphSourcePath)
    const absoluteGraphSourcePath = path.resolve(root, normalizedGraphSourcePath)
    const parsed = await readJsonSafe<unknown>(absoluteGraphSourcePath)
    if (!parsed.ok) {
      fixtures.push(blockedEdgeIntentFixtureSummary(normalizedGraphSourcePath, `Unable to read: ${parsed.error}`))
      continue
    }

    try {
      const graphSource = normalizeIntentCriticalGraphSourceExample(parsed.value, normalizedGraphSourcePath)
      const projection = projectIntentCriticalGraphSource(graphSource, normalizedGraphSourcePath)
      fixtures.push(summarizeEdgeIntentProjectionFixture(normalizedGraphSourcePath, projection))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      fixtures.push(blockedEdgeIntentFixtureSummary(normalizedGraphSourcePath, message))
    }
  }

  const status = fixtures.every((fixture) => fixture.status === 'intent-projection-pass')
    ? 'intent-report-pass'
    : 'intent-report-blocked'

  return {
    status,
    projectedFixtureCount: fixtures.filter((fixture) => fixture.status === 'intent-projection-pass').length,
    edgeIntentCount: sumFixtureField(fixtures, 'edgeIntentCount'),
    claimCount: sumFixtureField(fixtures, 'claimCount'),
    classificationCount: sumFixtureField(fixtures, 'classificationCount'),
    anchorCount: sumFixtureField(fixtures, 'anchorCount'),
    missingClassificationCount: sumFixtureField(fixtures, 'missingClassificationCount'),
    missingAnchorCount: sumFixtureField(fixtures, 'missingAnchorCount'),
    fixtures,
    nonEnforcementStatement:
      'Intent projection report is local validation Evidence only and does not introduce CI enforcement.',
    requiredCheckBoundary: 'Intent projection report is not a required check, branch protection rule, or merge gate.',
    validateAllBoundary: 'Intent projection report remains separate from broad validate-all intent enforcement.',
  }
}

export async function reportGraphSourceHealth(root: string): Promise<GraphSourceHealthReport> {
  const blockingReasons: string[] = []
  const aggregatePath = 'examples/read-model-aggregate/generated/read-model-aggregate-summary.json'
  const aggregateResult = await readJsonSafe<AggregateReadModelSummary>(path.resolve(root, aggregatePath))
  const aggregate =
    aggregateResult.ok && typeof aggregateResult.value === 'object'
      ? aggregateResult.value
      : ({
          status: aggregateResult.ok ? 'malformed' : 'missing',
          summary: { sliceCount: 0 },
        } as unknown as AggregateReadModelSummary)
  if (!aggregateResult.ok) {
    blockingReasons.push(`Unable to read aggregate summary: ${aggregateResult.error}`)
  } else if (aggregate.status !== 'aggregate-pass') {
    blockingReasons.push(`validate-all aggregate status is ${aggregate.status}`)
  }

  const transitionPath = 'examples/read-model-aggregate/graph-source-transition-status.json'
  const transitionResult = await readJsonSafe<unknown>(path.resolve(root, transitionPath))
  const transition = transitionResult.ok ? asRecord(transitionResult.value, 'graphSourceTransitionStatus', []) : {}
  if (!transitionResult.ok) {
    blockingReasons.push(`Unable to read graph-source transition status: ${transitionResult.error}`)
  }
  const retirementReadinessSummary = asRecord(
    transition.retirementReadinessSummary,
    'graphSourceTransitionStatus.retirementReadinessSummary',
    [],
  )
  const retirementApprovalPackages = Array.isArray(transition.retirementApprovalPackages)
    ? (transition.retirementApprovalPackages as Array<Record<string, unknown>>)
    : []
  if (retirementApprovalPackages.length !== 3) {
    blockingReasons.push(
      'Tree-native retirement approval package statuses must cover Todo Search, Todo App, and repo-wide scopes.',
    )
  }
  const transitionSlices = Array.isArray(transition.configuredSlices)
    ? (transition.configuredSlices as Array<Record<string, unknown>>)
    : []
  const validatedBy = Array.isArray(transition.validatedBy) ? transition.validatedBy : []

  const todoSearchGenerated = await readGeneratedReadModelHealth(
    root,
    `${todoSearchReadModelProfile.supportedSlice}/generated/generated-read-model.json`,
    blockingReasons,
  )
  const todoAppGenerated = await readGeneratedReadModelHealth(
    root,
    `${todoAppPbeRunStructureOnlyProfile.supportedSlice}/generated/generated-read-model.json`,
    blockingReasons,
  )

  const todoSearchProjection = await readProjectionHealth(
    () => loadGraphSourceProjectionArtifact(root),
    blockingReasons,
    'Todo Search projection contract',
  )
  const todoAppProjection = await readProjectionHealth(
    () => loadStructureOnlyGraphSourceCandidateProjectionArtifact(root),
    blockingReasons,
    'Todo App projection contract',
  )

  const intentReport = await reportIntentCriticalProjection(root)
  if (intentReport.status !== 'intent-report-pass') {
    blockingReasons.push(`edgeIntent report status is ${intentReport.status}`)
  }
  if (intentReport.missingClassificationCount !== 0 || intentReport.missingAnchorCount !== 0) {
    blockingReasons.push('edgeIntent report has missing classification or anchor counts')
  }

  const compilerBoundary = await reportCompilerBoundary(root)
  if (compilerBoundary.status !== 'compiler-boundary-mvp-pass') {
    blockingReasons.push(`compiler boundary status is ${compilerBoundary.status}`)
  }
  blockingReasons.push(...compilerBoundary.blockingReasons.map((reason) => `compiler boundary: ${reason}`))

  const compilerInputModel = await reportCompilerInputModel(root)
  if (compilerInputModel.status !== 'compiler-input-model-pass') {
    blockingReasons.push(`compiler input model status is ${compilerInputModel.status}`)
  }
  blockingReasons.push(...compilerInputModel.blockingReasons.map((reason) => `compiler input model: ${reason}`))

  const contractCompilerDryRun = await compileExecutionContractDryRun(root, { writeOutput: false })
  if (contractCompilerDryRun.status !== 'contract-compiler-dry-run-pass') {
    blockingReasons.push(`contract compiler dry-run status is ${contractCompilerDryRun.status}`)
  }
  blockingReasons.push(
    ...contractCompilerDryRun.blockingReasons.map((reason) => `contract compiler dry-run: ${reason}`),
  )

  const todoSearchTransition = findByField(transitionSlices, 'profileId', todoSearchReadModelProfile.profileId)
  const todoAppTransition = findByField(transitionSlices, 'profileId', todoAppPbeRunStructureOnlyProfile.profileId)
  const todoSearchRetirement = asRecord(todoSearchTransition.retirementReadiness, 'todoSearch.retirementReadiness', [])
  const todoAppRetirement = asRecord(todoAppTransition.retirementReadiness, 'todoApp.retirementReadiness', [])
  const todoSearchPackage = findByField(retirementApprovalPackages, 'scope', 'todo-search-selected-slice')
  const todoAppPackage = findByField(retirementApprovalPackages, 'scope', 'todo-app-pbe-run-structure-only')
  const repoWidePackage = findByField(retirementApprovalPackages, 'scope', 'repo-wide')

  if (todoSearchPackage.status !== 'retirement-candidate-not-deleted') {
    blockingReasons.push(`Todo Search retirement approval package status is ${String(todoSearchPackage.status)}`)
  }
  if (todoAppPackage.status !== 'not-ready-structure-only') {
    blockingReasons.push(`Todo App retirement approval package status is ${String(todoAppPackage.status)}`)
  }
  if (repoWidePackage.status !== 'not-ready') {
    blockingReasons.push(`Repo-wide retirement approval package status is ${String(repoWidePackage.status)}`)
  }

  return {
    status: blockingReasons.length === 0 ? 'graph-source-health-pass' : 'graph-source-health-blocked',
    validateAll: {
      status: aggregate.status || (aggregateResult.ok ? 'malformed' : 'missing'),
      aggregateStatus: aggregate.status || (aggregateResult.ok ? 'malformed' : 'missing'),
      sliceCount: Number(aggregate.summary?.sliceCount || 0),
      source: aggregatePath,
    },
    e2eSmoke: {
      status: validatedBy.includes('npm run test:read-model:e2e')
        ? 'referenced-by-transition-status'
        : 'not-referenced',
      command: 'npm run test:read-model:e2e',
      intentReportExpected: true,
    },
    todoSearch: {
      sourceMode: String(todoSearchGenerated.metadata.readModelSourceMode || 'unknown'),
      graphSourceArtifact: String(todoSearchGenerated.metadata.graphSourceArtifact || 'unknown'),
      projectionContractStatus: todoSearchProjection.status,
      nodeCount: todoSearchProjection.nodeCount,
      edgeCount: todoSearchProjection.edgeCount,
      coreViewCount: todoSearchProjection.coreViewCount,
      retirementApprovalStatus: String(todoSearchPackage.status || 'missing'),
      retirementReadinessStatus: String(todoSearchRetirement.status || 'missing'),
    },
    todoApp: {
      sourceMode: String(todoAppGenerated.metadata.readModelSourceMode || 'unknown'),
      graphSourceAuthorityStatus: String(todoAppGenerated.metadata.graphSourceAuthorityStatus || 'unknown'),
      projectionContractStatus: todoAppProjection.status,
      nodeCount: todoAppProjection.nodeCount,
      edgeCount: todoAppProjection.edgeCount,
      coreViewCount: todoAppProjection.coreViewCount,
      retirementApprovalStatus: String(todoAppPackage.status || 'missing'),
      retirementReadinessStatus: String(todoAppRetirement.status || 'missing'),
    },
    edgeIntent: {
      status: intentReport.status,
      projectedFixtureCount: intentReport.projectedFixtureCount,
      edgeIntentCount: intentReport.edgeIntentCount,
      claimCount: intentReport.claimCount,
      classificationCount: intentReport.classificationCount,
      anchorCount: intentReport.anchorCount,
      missingClassificationCount: intentReport.missingClassificationCount,
      missingAnchorCount: intentReport.missingAnchorCount,
    },
    compilerBoundary: {
      status: compilerBoundary.status,
      taskRegistryStatus: compilerBoundary.taskRegistryStatus,
      contractSchemaStatus: compilerBoundary.contractSchemaStatus,
      contractValidatorStatus: compilerBoundary.contractValidatorStatus,
      dryRunContractStatus: compilerBoundary.dryRunContractStatus,
      dryRunChangeId: compilerBoundary.dryRunContract.changeId,
      requiredCheckCount: compilerBoundary.dryRunContract.requiredCheckCount,
      requiredEvidenceCount: compilerBoundary.dryRunContract.requiredEvidenceCount,
    },
    compilerInputModel: {
      status: compilerInputModel.status,
      inputSchemaStatus: compilerInputModel.inputSchemaStatus,
      dryRunInputStatus: compilerInputModel.dryRunInputStatus,
      dryRunChangeId: compilerInputModel.dryRunInput.changeId,
      graphSnapshotArtifactCount: compilerInputModel.dryRunInput.graphSnapshotArtifactCount,
      policyCount: compilerInputModel.dryRunInput.policyCount,
      evidenceEntryCount: compilerInputModel.dryRunInput.evidenceEntryCount,
      targetScopeCandidateCount: compilerInputModel.dryRunInput.targetScopeCandidateCount,
      outputRequirementSourceCount: compilerInputModel.dryRunInput.outputRequirementSourceCount,
      stopConditionSourceCount: compilerInputModel.dryRunInput.stopConditionSourceCount,
      riskSourceCount: compilerInputModel.dryRunInput.riskSourceCount,
    },
    contractCompilerDryRun: {
      status: contractCompilerDryRun.status,
      inputModelStatus: contractCompilerDryRun.inputModelStatus,
      candidateStatus: contractCompilerDryRun.candidateStatus,
      dryRunChangeId: contractCompilerDryRun.candidate.changeId,
      requiredCheckCount: contractCompilerDryRun.candidate.requiredCheckCount,
      requiredEvidenceCount: contractCompilerDryRun.candidate.requiredEvidenceCount,
      outputCandidate: contractCompilerDryRun.paths.outputCandidate,
      candidateDiffStatus: contractCompilerDryRun.candidateDiff.status,
      candidateDiffReviewStatus: contractCompilerDryRun.candidateDiff.reviewStatus,
      candidateEquivalenceStatus: contractCompilerDryRun.candidateDiff.equivalenceStatus,
      differingFieldCount: contractCompilerDryRun.candidateDiff.differingFieldCount,
      diffReport: contractCompilerDryRun.paths.diffReport,
      diffReviewBoundary: contractCompilerDryRun.candidateDiff.reviewBoundary,
      compilerPromotionReadiness: contractCompilerDryRun.candidateDiff.compilerPromotionReadiness,
      promotionReadiness: contractCompilerDryRun.candidateDiff.promotionReadiness,
      highestReviewSeverity: contractCompilerDryRun.candidateDiff.highestReviewSeverity,
      semanticClassificationCounts: contractCompilerDryRun.candidateDiff.semanticClassificationCounts,
      semanticDiffRuleCoverage: contractCompilerDryRun.candidateDiff.semanticDiffRuleCoverage,
      v01CloseoutStatus: contractCompilerDryRun.candidateDiff.v01CloseoutStatus,
      semanticDiffUnknownsStatus: contractCompilerDryRun.candidateDiff.semanticDiffUnknownsStatus,
      semanticDiffUnknownsResolved: contractCompilerDryRun.candidateDiff.semanticDiffUnknownsResolved,
      semanticDiffCoverageComplete: contractCompilerDryRun.candidateDiff.semanticDiffCoverageComplete,
      equivalencePolicy: contractCompilerDryRun.candidateDiff.equivalencePolicy,
      equivalenceProven: contractCompilerDryRun.candidateDiff.equivalenceProven,
      outputRequirementSourceAuthorityPreview: contractCompilerDryRun.outputRequirementSourceAuthorityPreview,
      outputRequirementSourceAuthorityPreviewPath: contractCompilerDryRun.paths.outputRequirementSourceAuthorityPreview,
      sourceAuthorityGapPreview: contractCompilerDryRun.sourceAuthorityGapPreview,
      sourceAuthorityGapPreviewPath: contractCompilerDryRun.paths.sourceAuthorityGapPreview,
      promotionReview: contractCompilerDryRun.promotionReview,
      promotionReviewPacketPath: contractCompilerDryRun.paths.promotionReviewPacket,
    },
    treeNativeRetirement: {
      readinessStatus: String(retirementReadinessSummary.status || 'missing'),
      todoSearchApprovalStatus: String(todoSearchPackage.status || 'missing'),
      todoAppApprovalStatus: String(todoAppPackage.status || 'missing'),
      repoWideApprovalStatus: String(repoWidePackage.status || 'missing'),
      explicitRetirementApproval: String(retirementReadinessSummary.explicitRetirementApproval || 'missing'),
      retirementAction: String(retirementReadinessSummary.retirementAction || 'missing'),
    },
    runtimeBudget: {
      runtimeBudgetTargetMs: 5000,
      lastTimingSmokeStatus: 'not-run-by-report-health',
      timingSmokeCommand: 'npm run devview:runtime:smoke',
      advisoryOnly: true,
      runtimeBudgetEnforced: false,
      aiEditingTimeExcluded: true,
      fullValidationExcluded: true,
      ciRuntimeExcluded: true,
      humanReviewExcluded: true,
    },
    scopeComplianceEvaluator: {
      scopeComplianceEvaluatorStatus: 'advisory-cli-available',
      command: 'graph read-model check-scope --base <baseRef> --head <headRef> --json',
      compactReportCommand: 'graph read-model check-scope --base <baseRef> --head <headRef> --markdown <file> --json',
      compactReportStatus: 'compact-advisory-runtime-report-available',
      nonEnforcing: true,
      enforcementStatus: 'not-enforced',
      lastEvaluationArtifact:
        'examples/valid/todo-app-pbe-run/generated/scope-compliance-evaluation.runtime-evidence-only.preview.json',
      reportHealthRunsEvaluator: false,
      compactReportIsBlocking: false,
      advisoryFindingsAreBlocking: false,
    },
    graphDeltaProposalGenerator: {
      graphDeltaProposalGeneratorStatus: 'proposal-only-cli-available',
      command: 'graph read-model propose-graph-delta --source <sourceArtifact> --json',
      explicitOutputCommand:
        'graph read-model propose-graph-delta --source <sourceArtifact> --output <proposalPath> --json',
      proposalOnly: true,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      approvalStatus: 'not-approved',
      nonEnforcing: true,
      enforcementStatus: 'not-enforced',
      lastProposalPreviewArtifact:
        'examples/valid/todo-app-pbe-run/generated/graph-delta-compatible-source.runtime-evidence-only.preview.json',
      reportHealthRunsGenerator: false,
    },
    graphDeltaHumanReviewPacket: {
      graphDeltaHumanReviewPacketStatus: 'review-packet-cli-available',
      command: 'graph read-model review-graph-delta --proposal <proposalPath> --json',
      markdownCommand: 'graph read-model review-graph-delta --proposal <proposalPath> --markdown <file> --json',
      reviewPacketSurface: 'human-review-input-only',
      approvalStatus: 'not-approved',
      graphSourceMutated: false,
      graphDeltaApplied: false,
      humanDecisionRecorded: false,
      reportHealthRunsReviewPacket: false,
    },
    requestIrGraphValidator: {
      requestIrGraphValidatorStatus: 'graph-aware-cli-available',
      command:
        'graph read-model validate-request-ir-graph --candidate <candidatePath> --schema-validation <schemaValidationPath> --json',
      graphValidationStatus: 'not-run-by-report-health',
      graphTraversalAllowed: false,
      graphTraversalExecuted: false,
      selectedGraphSliceGenerated: false,
      contractGenerationAllowed: false,
      contractInputGenerated: false,
      instructionPackGenerationAllowed: false,
      instructionPackGenerated: false,
      reportHealthRunsValidator: false,
    },
    enforcementStatus: 'non-enforcing',
    nonEnforcementStatement:
      'Graph-source health report is local/non-enforcing summary only. It does not create required checks, branch protection, merge enforcement, or user acceptance.',
    requiredCheckBoundary:
      'Health pass is not a required check and does not approve tree-native retirement, source authority expansion, or enforcement.',
    blockingReasons,
  }
}

export async function writeGraphSourceHealthMarkdownReport(
  root: string,
  report: GraphSourceHealthReport,
  outputPath: string,
): Promise<string> {
  const absoluteOutputPath = path.resolve(root, outputPath)
  await writeFormattedMarkdown(absoluteOutputPath, renderGraphSourceHealthMarkdown(report))
  return absoluteOutputPath
}

export function renderGraphSourceHealthMarkdown(report: GraphSourceHealthReport): string {
  const blockingReasons =
    report.blockingReasons.length === 0 ? '- None.' : report.blockingReasons.map((reason) => `- ${reason}`).join('\n')
  const semanticDiffSummary = formatSemanticClassificationCounts(
    report.contractCompilerDryRun.semanticClassificationCounts,
  )
  const unknownSemanticFields = formatUnknownSemanticFields(
    report.contractCompilerDryRun.semanticDiffRuleCoverage.unknownFields,
  )

  return `# Graph-Source Health Report

Status: \`${report.status}\`

## Source Status

| Slice | Source status | Projection | Counts | Retirement |
| --- | --- | --- | --- | --- |
| Todo Search | \`${report.todoSearch.sourceMode}\` | \`${report.todoSearch.projectionContractStatus}\` | ${report.todoSearch.nodeCount} nodes / ${report.todoSearch.edgeCount} edges / ${report.todoSearch.coreViewCount} Core Views | \`${report.todoSearch.retirementReadinessStatus}\`; package \`${report.todoSearch.retirementApprovalStatus}\` |
| Todo App PBE Run | \`${report.todoApp.sourceMode}\` / \`${report.todoApp.graphSourceAuthorityStatus}\` | \`${report.todoApp.projectionContractStatus}\` | ${report.todoApp.nodeCount} nodes / ${report.todoApp.edgeCount} edges / ${report.todoApp.coreViewCount} Core Views | \`${report.todoApp.retirementReadinessStatus}\`; package \`${report.todoApp.retirementApprovalStatus}\` |

## Evidence Status

| Surface | Status |
| --- | --- |
| Validate-all aggregate | \`${report.validateAll.aggregateStatus}\` (${report.validateAll.sliceCount} slices) |
| E2E smoke | \`${report.e2eSmoke.status}\`; command \`${report.e2eSmoke.command}\` |
| edgeIntent report | \`${report.edgeIntent.status}\`; ${report.edgeIntent.edgeIntentCount} edgeIntents / ${report.edgeIntent.claimCount} claims / ${report.edgeIntent.classificationCount} classifications / ${report.edgeIntent.anchorCount} anchors |
| Missing edgeIntent classifications | \`${report.edgeIntent.missingClassificationCount}\` |
| Missing edgeIntent anchors | \`${report.edgeIntent.missingAnchorCount}\` |
| Compiler Boundary MVP | \`${report.compilerBoundary.status}\` |
| Compiler task registry | \`${report.compilerBoundary.taskRegistryStatus}\` |
| Execution contract schema | \`${report.compilerBoundary.contractSchemaStatus}\` |
| Dry-run contract validator | \`${report.compilerBoundary.contractValidatorStatus}\` |
| Dry-run contract | \`${report.compilerBoundary.dryRunContractStatus}\`; \`${report.compilerBoundary.dryRunChangeId}\`; ${report.compilerBoundary.requiredCheckCount} checks / ${report.compilerBoundary.requiredEvidenceCount} evidence requirements |
| Compiler Input Model MVP | \`${report.compilerInputModel.status}\` |
| Compiler input schema | \`${report.compilerInputModel.inputSchemaStatus}\` |
| Dry-run compiler input | \`${report.compilerInputModel.dryRunInputStatus}\`; \`${report.compilerInputModel.dryRunChangeId}\`; ${report.compilerInputModel.graphSnapshotArtifactCount} graph artifacts / ${report.compilerInputModel.policyCount} policies / ${report.compilerInputModel.evidenceEntryCount} evidence entries / ${report.compilerInputModel.targetScopeCandidateCount} scope candidates / ${report.compilerInputModel.outputRequirementSourceCount} output sources / ${report.compilerInputModel.stopConditionSourceCount} stop sources / ${report.compilerInputModel.riskSourceCount} risk sources |
| Contract Compiler Dry-Run | \`${report.contractCompilerDryRun.status}\` |
| Compiled contract candidate | \`${report.contractCompilerDryRun.candidateStatus}\`; \`${report.contractCompilerDryRun.dryRunChangeId}\`; ${report.contractCompilerDryRun.requiredCheckCount} checks / ${report.contractCompilerDryRun.requiredEvidenceCount} evidence requirements |
| Generated vs hand-written contract diff | \`${report.contractCompilerDryRun.candidateDiffStatus}\`; \`${report.contractCompilerDryRun.candidateDiffReviewStatus}\`; \`${report.contractCompilerDryRun.candidateEquivalenceStatus}\`; ${report.contractCompilerDryRun.differingFieldCount} differing fields; \`${report.contractCompilerDryRun.diffReport}\` |
| Contract compiler v0.1 closeout | \`${report.contractCompilerDryRun.v01CloseoutStatus}\`; \`${report.contractCompilerDryRun.semanticDiffUnknownsStatus}\`; coverage complete \`${report.contractCompilerDryRun.semanticDiffCoverageComplete}\`; equivalence proven \`${report.contractCompilerDryRun.equivalenceProven}\` |
| Contract equivalence/readiness policy | \`${report.contractCompilerDryRun.equivalencePolicy.sourceAuthorityPreservationStatus}\`; \`${report.contractCompilerDryRun.equivalencePolicy.semanticDiffPolicyStatus}\`; \`${report.contractCompilerDryRun.equivalencePolicy.reviewOnlyDiffStatus}\`; blocking semantic loss ${report.contractCompilerDryRun.equivalencePolicy.blockingSemanticLossCount}; review-only diffs ${report.contractCompilerDryRun.equivalencePolicy.reviewOnlyDiffCount}; equivalence candidate \`${report.contractCompilerDryRun.equivalencePolicy.equivalenceCandidate}\`; equivalence proven \`${report.contractCompilerDryRun.equivalencePolicy.equivalenceProven}\` |
| Contract compiler promotion review packet | \`${report.contractCompilerDryRun.promotionReview.status}\`; approval \`${report.contractCompilerDryRun.promotionReview.approvalStatus}\`; equivalence candidate \`${report.contractCompilerDryRun.promotionReview.equivalenceCandidate}\`; equivalence proven \`${report.contractCompilerDryRun.promotionReview.equivalenceProven}\`; review-only diffs ${report.contractCompilerDryRun.promotionReview.reviewOnlyDiffCount}; boundary wording review required \`${report.contractCompilerDryRun.promotionReview.boundaryWordingReviewRequired}\`; checklist ${report.contractCompilerDryRun.promotionReview.checklistPassCount} pass / ${report.contractCompilerDryRun.promotionReview.checklistDecisionRequiredCount} decision-required / ${report.contractCompilerDryRun.promotionReview.checklistBlockedCount} blocked; \`${report.contractCompilerDryRun.promotionReviewPacketPath}\` |
| Output requirement source authority preview | \`${report.contractCompilerDryRun.outputRequirementSourceAuthorityPreview.status}\`; ${report.contractCompilerDryRun.outputRequirementSourceAuthorityPreview.sourceAuthorityEntryCount} source entries / ${report.contractCompilerDryRun.outputRequirementSourceAuthorityPreview.derivedOutputRequirementCount} derived requirements / ${report.contractCompilerDryRun.outputRequirementSourceAuthorityPreview.unresolvedObligationCount} unresolved; \`${report.contractCompilerDryRun.outputRequirementSourceAuthorityPreview.generatedPreservationStatus}\`; \`${report.contractCompilerDryRun.outputRequirementSourceAuthorityPreviewPath}\` |
| Source authority gap preview | \`${report.contractCompilerDryRun.sourceAuthorityGapPreview.status}\`; ${report.contractCompilerDryRun.sourceAuthorityGapPreview.remainingLossCount} remaining losses (${report.contractCompilerDryRun.sourceAuthorityGapPreview.remainingSemanticLossCount} semantic / ${report.contractCompilerDryRun.sourceAuthorityGapPreview.remainingPolicyLossCount} policy); fields ${formatFieldList(report.contractCompilerDryRun.sourceAuthorityGapPreview.fieldsRequiringSourceAuthority)}; next \`${report.contractCompilerDryRun.sourceAuthorityGapPreview.nextRecommendedResolver}\`; \`${report.contractCompilerDryRun.sourceAuthorityGapPreviewPath}\` |
| Contract semantic diff review | \`${report.contractCompilerDryRun.compilerPromotionReadiness}\`; severity \`${report.contractCompilerDryRun.highestReviewSeverity}\`; unknown semantic diffs ${report.contractCompilerDryRun.semanticDiffRuleCoverage.unknownDiffs}; unknown fields ${unknownSemanticFields}; ${semanticDiffSummary} |
| DevView runtime timing smoke | target ${report.runtimeBudget.runtimeBudgetTargetMs}ms; last \`${report.runtimeBudget.lastTimingSmokeStatus}\`; advisory \`${report.runtimeBudget.advisoryOnly}\`; enforced \`${report.runtimeBudget.runtimeBudgetEnforced}\`; command \`${report.runtimeBudget.timingSmokeCommand}\` |
| Scope compliance evaluator CLI | \`${report.scopeComplianceEvaluator.scopeComplianceEvaluatorStatus}\`; compact report \`${report.scopeComplianceEvaluator.compactReportStatus}\`; non-enforcing \`${report.scopeComplianceEvaluator.nonEnforcing}\`; enforced \`${report.scopeComplianceEvaluator.enforcementStatus}\`; health runs evaluator \`${report.scopeComplianceEvaluator.reportHealthRunsEvaluator}\`; command \`${report.scopeComplianceEvaluator.command}\`; compact command \`${report.scopeComplianceEvaluator.compactReportCommand}\` |
| Graph Delta proposal-only generator CLI | \`${report.graphDeltaProposalGenerator.graphDeltaProposalGeneratorStatus}\`; proposal-only \`${report.graphDeltaProposalGenerator.proposalOnly}\`; graph-source mutated \`${report.graphDeltaProposalGenerator.graphSourceMutated}\`; graph delta applied \`${report.graphDeltaProposalGenerator.graphDeltaApplied}\`; approval \`${report.graphDeltaProposalGenerator.approvalStatus}\`; health runs generator \`${report.graphDeltaProposalGenerator.reportHealthRunsGenerator}\`; command \`${report.graphDeltaProposalGenerator.command}\` |
| Graph Delta human review packet CLI | \`${report.graphDeltaHumanReviewPacket.graphDeltaHumanReviewPacketStatus}\`; surface \`${report.graphDeltaHumanReviewPacket.reviewPacketSurface}\`; approval \`${report.graphDeltaHumanReviewPacket.approvalStatus}\`; graph-source mutated \`${report.graphDeltaHumanReviewPacket.graphSourceMutated}\`; graph delta applied \`${report.graphDeltaHumanReviewPacket.graphDeltaApplied}\`; decision recorded \`${report.graphDeltaHumanReviewPacket.humanDecisionRecorded}\`; health runs packet \`${report.graphDeltaHumanReviewPacket.reportHealthRunsReviewPacket}\`; command \`${report.graphDeltaHumanReviewPacket.command}\` |
| Request IR graph-aware validator CLI | \`${report.requestIrGraphValidator.requestIrGraphValidatorStatus}\`; graph validation \`${report.requestIrGraphValidator.graphValidationStatus}\`; traversal allowed \`${report.requestIrGraphValidator.graphTraversalAllowed}\`; traversal executed \`${report.requestIrGraphValidator.graphTraversalExecuted}\`; selected slice generated \`${report.requestIrGraphValidator.selectedGraphSliceGenerated}\`; contract generation allowed \`${report.requestIrGraphValidator.contractGenerationAllowed}\`; health runs validator \`${report.requestIrGraphValidator.reportHealthRunsValidator}\`; command \`${report.requestIrGraphValidator.command}\` |

${report.contractCompilerDryRun.diffReviewBoundary}

Semantic diff classification is non-blocking review metadata only. \`compiler-equivalence-not-proven\` means the compiler
candidate is valid, but promotion/equivalence is not proven; see \`${report.contractCompilerDryRun.diffReport}\` for the
full semantic diff artifact.

${report.contractCompilerDryRun.equivalencePolicy.policyBoundary}

${report.contractCompilerDryRun.promotionReview.nonExecutionBoundary}

## Retirement And Enforcement

| Field | Status |
| --- | --- |
| Tree-native retirement readiness | \`${report.treeNativeRetirement.readinessStatus}\` |
| Todo Search retirement package | \`${report.treeNativeRetirement.todoSearchApprovalStatus}\` |
| Todo App retirement package | \`${report.treeNativeRetirement.todoAppApprovalStatus}\` |
| Repo-wide retirement package | \`${report.treeNativeRetirement.repoWideApprovalStatus}\` |
| Explicit retirement approval | \`${report.treeNativeRetirement.explicitRetirementApproval}\` |
| Retirement action | \`${report.treeNativeRetirement.retirementAction}\` |
| Enforcement status | \`${report.enforcementStatus}\` |

## Blocking Reasons

${blockingReasons}

## Boundaries

- ${report.nonEnforcementStatement}
- ${report.requiredCheckBoundary}
- DevView runtime timing smoke is advisory only. It excludes AI editing time, full validation, CI runtime, and human review time, and it does not enforce the ${report.runtimeBudget.runtimeBudgetTargetMs}ms target.
- Scope compliance evaluator findings from \`${report.scopeComplianceEvaluator.command}\` are advisory only. The compact report surface \`${report.scopeComplianceEvaluator.compactReportCommand}\` summarizes the same result without making it blocking. Report-health does not run the evaluator and advisory findings do not reject diffs or create required checks.
- Graph Delta proposal-only previews from \`${report.graphDeltaProposalGenerator.command}\` are unapproved review artifacts only. Report-health does not run the generator, mutate graph-source, apply graph deltas, approve updates, satisfy runtime Evidence, or enforce scope.
- Graph Delta human review packets from \`${report.graphDeltaHumanReviewPacket.command}\` are review input only. Report-health does not run the packet command, record human decisions, approve proposals, mutate graph-source, apply graph deltas, satisfy runtime Evidence, or enforce scope.
- Request IR graph-aware validation from \`${report.requestIrGraphValidator.command}\` resolves candidate fields for future traversal permission only. Report-health does not run the validator, run traversal, select graph slices, generate contract input, generate instruction packs, mutate graph-source, or approve work.

## Reproduce

\`\`\`bash
npm run build:cli
npm run devview:runtime:smoke
node dist/cli/index.js graph read-model check-scope --base HEAD~1 --head HEAD --json
node dist/cli/index.js graph read-model check-scope --base HEAD~1 --head HEAD --markdown .tmp/devview-scope-runtime-report.md --json
node dist/cli/index.js graph read-model propose-graph-delta --source examples/valid/todo-app-pbe-run/generated/graph-delta-compatible-source.runtime-evidence-only.preview.json --output .tmp/devview-graph-delta-proposal.preview.json --json
node dist/cli/index.js graph read-model review-graph-delta --proposal .tmp/devview-graph-delta-proposal.preview.json --markdown .tmp/devview-graph-delta-review-packet.md --json
node dist/cli/index.js graph read-model validate-request-ir-graph --candidate examples/valid/todo-app-pbe-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json --schema-validation examples/valid/todo-app-pbe-run/generated/request-ir-validation.add-todo-runtime-evidence-only.preview.json --json
node dist/cli/index.js graph read-model validate --all --json
npm run test:read-model:e2e
node dist/cli/index.js graph read-model report-compiler-boundary --json
node dist/cli/index.js graph read-model compile-contract --dry-run --json
node dist/cli/index.js graph read-model report-health --json --markdown examples/read-model-aggregate/generated/read-model-health-report-output.md
\`\`\`
`
}

function formatSemanticClassificationCounts(counts: Record<string, number>): string {
  const entries = Object.entries(counts).filter(([, count]) => count > 0)
  return entries.length === 0 ? 'semantic diffs: none' : entries.map(([key, count]) => `${key}: ${count}`).join(', ')
}

function formatUnknownSemanticFields(fields: string[]): string {
  return fields.length === 0 ? 'none' : fields.join(', ')
}

function formatFieldList(fields: string[]): string {
  return fields.length === 0 ? 'none' : fields.join(', ')
}

async function readGeneratedReadModelHealth(
  root: string,
  generatedPath: string,
  blockingReasons: string[],
): Promise<{ metadata: Record<string, unknown> }> {
  const parsed = await readJsonSafe<GeneratedReadModel>(path.resolve(root, generatedPath))
  if (!parsed.ok) {
    blockingReasons.push(`Unable to read generated read-model at ${generatedPath}: ${parsed.error}`)
    return { metadata: {} }
  }
  const metadata = asRecord(parsed.value.metadata, `${generatedPath}.metadata`, [])
  return { metadata }
}

async function readProjectionHealth(
  loader: () => Promise<{ nodes: unknown[]; edges: unknown[]; coreViewCoverage: unknown[] }>,
  blockingReasons: string[],
  label: string,
): Promise<{
  status: 'projection-contract-pass' | 'projection-contract-blocked'
  nodeCount: number
  edgeCount: number
  coreViewCount: number
}> {
  try {
    const projection = await loader()
    return {
      status: 'projection-contract-pass',
      nodeCount: projection.nodes.length,
      edgeCount: projection.edges.length,
      coreViewCount: projection.coreViewCoverage.length,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    blockingReasons.push(`${label} blocked: ${message}`)
    return {
      status: 'projection-contract-blocked',
      nodeCount: 0,
      edgeCount: 0,
      coreViewCount: 0,
    }
  }
}

function findByField(entries: Array<Record<string, unknown>>, key: string, value: string): Record<string, unknown> {
  return entries.find((entry) => entry[key] === value) || {}
}

export function projectIntentCriticalGraphSource(
  graphSource: IntentCriticalGraphSourceExample,
  graphSourcePath: string,
): EdgeIntentReadModelProjection {
  return {
    schemaVersion: 1,
    artifactRole: 'edge-intent-read-model-projection',
    projectionStatus: 'intent-projection-pass',
    sourceArtifact: normalizePath(graphSourcePath),
    sourceExampleKind: graphSource.exampleKind,
    projectionBoundary:
      graphSource.exampleKind === 'retrofit-pbe'
        ? 'This projection exposes edge-level maintenance intent for human review. It does not create a separate intent ledger, replace graph source, add enforcement, or approve compatibility retirement.'
        : 'This projection exposes edge-level maintenance intent for human review. It does not create a separate intent ledger, replace graph source, add enforcement, or replace user acceptance.',
    edgeIntentProjections: graphSource.intentRecords.map((record) => ({
      sourceIntentRecordId: record.id,
      ...cloneJson(record.edgeIntent),
      humanReadableSummary: renderEdgeIntentSummary(record.edgeIntent),
    })),
    vocabularyBoundary: {
      classificationFields: ['edgeType', 'intentKind', 'riskKind', 'confidence', 'enforcement', 'anchors.signalKind'],
      projectSpecificClaimField: 'claim',
      claimBoundary:
        'The claim is preserved as short project-specific language and is not replaced by a global enum or table.',
    },
  }
}

function summarizeEdgeIntentProjectionFixture(
  graphSourcePath: string,
  projection: EdgeIntentReadModelProjection,
): EdgeIntentProjectionFixtureSummary {
  const classificationFields = projection.vocabularyBoundary.classificationFields
  return {
    graphSource: normalizePath(graphSourcePath),
    sourceExampleKind: projection.sourceExampleKind,
    status: projection.projectionStatus,
    edgeIntentCount: projection.edgeIntentProjections.length,
    claimCount: projection.edgeIntentProjections.filter((entry) => entry.claim.length > 0).length,
    classificationCount: projection.edgeIntentProjections.length * classificationFields.length,
    anchorCount: projection.edgeIntentProjections.reduce((sum, entry) => sum + entry.anchors.length, 0),
    missingClassificationCount: 0,
    missingAnchorCount: 0,
    claims: projection.edgeIntentProjections.map((entry) => entry.claim),
    classificationFields,
  }
}

function blockedEdgeIntentFixtureSummary(graphSourcePath: string, error: string): EdgeIntentProjectionFixtureSummary {
  return {
    graphSource: normalizePath(graphSourcePath),
    sourceExampleKind: 'unknown',
    status: 'intent-projection-blocked',
    edgeIntentCount: 0,
    claimCount: 0,
    classificationCount: 0,
    anchorCount: 0,
    missingClassificationCount: countEdgeIntentClassificationProblems(error),
    missingAnchorCount: countEdgeIntentAnchorProblems(error),
    claims: [],
    classificationFields: ['edgeType', 'intentKind', 'riskKind', 'confidence', 'enforcement', 'anchors.signalKind'],
    error,
  }
}

function countEdgeIntentClassificationProblems(message: string): number {
  return ['edgeType', 'intentKind', 'riskKind', 'confidence', 'enforcement'].filter((field) => message.includes(field))
    .length
}

function countEdgeIntentAnchorProblems(message: string): number {
  return message.includes('anchors') ? 1 : 0
}

function sumFixtureField(
  fixtures: EdgeIntentProjectionFixtureSummary[],
  field:
    | 'edgeIntentCount'
    | 'claimCount'
    | 'classificationCount'
    | 'anchorCount'
    | 'missingClassificationCount'
    | 'missingAnchorCount',
): number {
  return fixtures.reduce((sum, fixture) => sum + fixture[field], 0)
}

function renderEdgeIntentSummary(edgeIntent: EdgeIntentAnnotation): string {
  const label =
    edgeIntent.intentKind === 'ux-acceptance'
      ? 'UX acceptance intent'
      : edgeIntent.intentKind === 'compatibility-retention'
        ? 'Compatibility-retention intent'
        : `${edgeIntent.intentKind} intent`
  return `${label}: ${edgeIntent.claim}. Risk: ${edgeIntent.riskKind}. Confidence: ${edgeIntent.confidence}. Enforcement: ${edgeIntent.enforcement}.`
}

export function normalizeIntentCriticalGraphSourceExample(
  value: unknown,
  graphSourcePath = 'graph-source-intent.json',
): IntentCriticalGraphSourceExample {
  const errors: string[] = []
  const source = asRecord(value, 'intentGraphSource', errors)
  const schemaVersion = source.schemaVersion
  const artifactRole = source.artifactRole
  const exampleKind = requiredEnum(
    source,
    'exampleKind',
    ['native-pbe', 'retrofit-pbe'] as const,
    errors,
    'intentGraphSource',
  )
  const status = source.status
  const sourceSlice = requiredString(source, 'sourceSlice', errors, 'intentGraphSource')
  const intentRecords = requiredRecordArray<Record<string, unknown>>(
    source,
    'intentRecords',
    errors,
    'intentGraphSource',
  ).map((record, index) => normalizeIntentCriticalRecord(record, index, errors))

  if (schemaVersion !== 1) {
    errors.push('intentGraphSource.schemaVersion must be 1')
  }
  if (artifactRole !== 'intent-critical-graph-source-example') {
    errors.push('intentGraphSource.artifactRole must be intent-critical-graph-source-example')
  }
  if (status !== 'intent-preservation-fixture') {
    errors.push('intentGraphSource.status must be intent-preservation-fixture')
  }
  if (intentRecords.length === 0) {
    errors.push('intentGraphSource.intentRecords must include at least one edgeIntent record')
  }

  if (errors.length > 0) {
    throw new Error(`Invalid intent graph source ${graphSourcePath}: ${errors.join('; ')}`)
  }

  return {
    schemaVersion: 1,
    artifactRole: 'intent-critical-graph-source-example',
    exampleKind,
    status: 'intent-preservation-fixture',
    sourceSlice: normalizePath(sourceSlice),
    intentRecords,
  }
}

function normalizeIntentCriticalRecord(
  value: Record<string, unknown>,
  index: number,
  errors: string[],
): IntentCriticalRecord {
  const prefix = `intentGraphSource.intentRecords[${index}]`
  const id = requiredString(value, 'id', errors, prefix)
  const edgeIntent = normalizeEdgeIntentAnnotation(
    asRecord(value.edgeIntent, `${prefix}.edgeIntent`, errors),
    prefix,
    errors,
  )
  return { id, edgeIntent }
}

function normalizeEdgeIntentAnnotation(
  value: Record<string, unknown>,
  prefix: string,
  errors: string[],
): EdgeIntentAnnotation {
  const edgePrefix = `${prefix}.edgeIntent`
  const edgeType = requiredString(value, 'edgeType', errors, edgePrefix)
  const intentKind = requiredString(value, 'intentKind', errors, edgePrefix)
  const riskKind = requiredString(value, 'riskKind', errors, edgePrefix)
  const claim = requiredString(value, 'claim', errors, edgePrefix)
  const confidence = requiredString(value, 'confidence', errors, edgePrefix)
  const enforcement = requiredString(value, 'enforcement', errors, edgePrefix)
  const anchors = requiredRecordArray<Record<string, unknown>>(value, 'anchors', errors, edgePrefix).map(
    (anchor, index) => ({
      signalKind: requiredString(anchor, 'signalKind', errors, `${edgePrefix}.anchors[${index}]`),
      sourceRole: requiredString(anchor, 'sourceRole', errors, `${edgePrefix}.anchors[${index}]`),
      artifact: requiredString(anchor, 'artifact', errors, `${edgePrefix}.anchors[${index}]`),
    }),
  )

  if (edgeType !== 'preserves-intent') {
    errors.push(`${edgePrefix}.edgeType must be preserves-intent`)
  }
  for (const [key, valueToCheck] of Object.entries({ intentKind, riskKind, confidence, enforcement })) {
    if (!/^[a-z-]+$/.test(valueToCheck)) {
      errors.push(`${edgePrefix}.${key} must be vocabulary-style kebab-case`)
    }
  }
  if (claim.length < 20) {
    errors.push(`${edgePrefix}.claim must preserve short project-specific text`)
  }
  if (claim === intentKind || claim === riskKind) {
    errors.push(`${edgePrefix}.claim must not be replaced by vocabulary enum values`)
  }
  if (anchors.length === 0) {
    errors.push(`${edgePrefix}.anchors must include at least one source signal anchor`)
  }

  return {
    edgeType,
    intentKind,
    riskKind,
    claim,
    confidence,
    enforcement,
    anchors,
  }
}

export function normalizeGraphSourceProjectionArtifact(
  value: unknown,
  graphSource: GraphSourceArtifact,
  projectionPath = `${todoSearchReadModelProfile.supportedSlice}/generated/graph-source-read-model-projection.json`,
  graphSourcePath = `${todoSearchReadModelProfile.supportedSlice}/graph-source.json`,
): GraphSourceProjectionArtifact {
  const errors: string[] = []
  const projection = asRecord(value, 'graphSourceProjection', errors)
  const metadata = asRecord(projection.metadata, 'graphSourceProjection.metadata', errors)
  const expectedProjection = projectGraphSourceReadModel(graphSource, graphSourcePath).projection
  const nodes = requiredRecordArray<GraphNode>(projection, 'nodes', errors, 'graphSourceProjection')
  const edges = requiredRecordArray<GraphEdge>(projection, 'edges', errors, 'graphSourceProjection')
  const coreViewCoverage = requiredRecordArray<CoreViewCoverage>(
    projection,
    'coreViewCoverage',
    errors,
    'graphSourceProjection',
  )
  const fallbackReferences = requiredStringArray(projection, 'fallbackReferences', errors, 'graphSourceProjection')
  const retainedCompatibilityArtifacts = requiredStringArray(
    projection,
    'retainedCompatibilityArtifacts',
    errors,
    'graphSourceProjection',
  )
  const sourceAuthorityBoundary = requiredString(projection, 'sourceAuthorityBoundary', errors, 'graphSourceProjection')
  const nonPromotionStatement = requiredString(projection, 'nonPromotionStatement', errors, 'graphSourceProjection')
  const userAcceptanceBoundary = requiredString(projection, 'userAcceptanceBoundary', errors, 'graphSourceProjection')
  const taxonomy = asRecord(projection.taxonomy, 'graphSourceProjection.taxonomy', errors)
  const viewScopedTagsAllowed = Array.isArray(taxonomy.viewScopedTagsAllowed)
    ? taxonomy.viewScopedTagsAllowed.map(String)
    : []

  if (metadata.artifactRole !== 'graph_source_read_model_projection') {
    errors.push('graphSourceProjection.metadata.artifactRole must be graph_source_read_model_projection')
  }
  if (normalizePath(String(metadata.sourceArtifact || '')) !== normalizePath(graphSourcePath)) {
    errors.push(`graphSourceProjection.metadata.sourceArtifact must be ${normalizePath(graphSourcePath)}`)
  }
  if (normalizePath(String(metadata.sourceSlice || '')) !== graphSource.sourceSlice) {
    errors.push(`graphSourceProjection.metadata.sourceSlice must be ${graphSource.sourceSlice}`)
  }
  if (metadata.sourceProfile !== graphSource.sourceProfile) {
    errors.push(`graphSourceProjection.metadata.sourceProfile must be ${graphSource.sourceProfile}`)
  }
  if (metadata.promotionScope !== graphSource.promotionScope) {
    errors.push(`graphSourceProjection.metadata.promotionScope must be ${graphSource.promotionScope}`)
  }
  if (metadata.projectionBoundary !== graphSource.projectionBoundary) {
    errors.push('graphSourceProjection.metadata.projectionBoundary must match graph source projectionBoundary')
  }
  if (nodes.length !== todoSearchReadModelProfile.expectedCounts.nodes) {
    errors.push(`graphSourceProjection.nodes must contain ${todoSearchReadModelProfile.expectedCounts.nodes} nodes`)
  }
  if (edges.length !== todoSearchReadModelProfile.expectedCounts.edges) {
    errors.push(`graphSourceProjection.edges must contain ${todoSearchReadModelProfile.expectedCounts.edges} edges`)
  }
  if (coreViewCoverage.length !== coreViewNames.length) {
    errors.push(`graphSourceProjection.coreViewCoverage must contain ${coreViewNames.length} Core Views`)
  }
  if (JSON.stringify(nodes) !== JSON.stringify(expectedProjection.nodes)) {
    errors.push('graphSourceProjection.nodes must match graph source projection nodes')
  }
  if (JSON.stringify(edges) !== JSON.stringify(expectedProjection.edges)) {
    errors.push('graphSourceProjection.edges must match graph source projection edges')
  }
  if (JSON.stringify(coreViewCoverage) !== JSON.stringify(expectedProjection.coreViewCoverage)) {
    errors.push('graphSourceProjection.coreViewCoverage must match graph source projection Core Views')
  }
  if (sourceAuthorityBoundary !== graphSource.sourceAuthorityBoundary) {
    errors.push('graphSourceProjection.sourceAuthorityBoundary must match graph source sourceAuthorityBoundary')
  }
  if (!nonPromotionStatement.includes('repo-wide promotion')) {
    errors.push('graphSourceProjection.nonPromotionStatement must preserve repo-wide promotion boundary')
  }
  if (userAcceptanceBoundary !== graphSource.userAcceptanceBoundary) {
    errors.push('graphSourceProjection.userAcceptanceBoundary must match graph source userAcceptanceBoundary')
  }
  for (const fallback of graphSource.fallbackReferences) {
    if (!fallbackReferences.map(normalizePath).includes(fallback)) {
      errors.push(`graphSourceProjection.fallbackReferences missing ${fallback}`)
    }
  }
  for (const retained of graphSource.retainedCompatibilityArtifacts) {
    if (!retainedCompatibilityArtifacts.map(normalizePath).includes(retained)) {
      errors.push(`graphSourceProjection.retainedCompatibilityArtifacts missing ${retained}`)
    }
  }
  for (const allowedTag of allowedViewScopedTags) {
    if (!viewScopedTagsAllowed.includes(allowedTag)) {
      errors.push(`graphSourceProjection.taxonomy.viewScopedTagsAllowed missing ${allowedTag}`)
    }
  }

  const normalizedProjection: GraphSourceProjectionArtifact = {
    metadata: {
      artifactRole: 'graph_source_read_model_projection',
      sourceArtifact: normalizePath(String(metadata.sourceArtifact || '')),
      sourceSlice: normalizePath(String(metadata.sourceSlice || '')),
      sourceProfile: String(metadata.sourceProfile || ''),
      promotionScope: 'todo-search-selected-slice',
      projectionBoundary: String(metadata.projectionBoundary || ''),
    },
    taxonomy: expectedProjection.taxonomy,
    nodes,
    edges,
    coreViewCoverage,
    fallbackReferences: fallbackReferences.map(normalizePath),
    retainedCompatibilityArtifacts: retainedCompatibilityArtifacts.map(normalizePath),
    sourceAuthorityBoundary,
    nonPromotionStatement,
    userAcceptanceBoundary,
  }
  assertAllowedTags({
    version: 'graph-source-projection-normalization',
    metadata: {},
    sourceInputs: [],
    taxonomy: {},
    nodes: normalizedProjection.nodes,
    edges: normalizedProjection.edges,
    coreViewCoverage: normalizedProjection.coreViewCoverage,
    checkEvidenceMapping: [],
    retainedWarnings: [],
    compatibilityWarnings: [],
    sourceAuthorityBoundary,
    nonPromotionStatement,
  })

  const declaredProjectionTargets = graphSource.projectionTargets.map((target) => target.path).filter(Boolean)
  if (!declaredProjectionTargets.includes(normalizePath(projectionPath))) {
    errors.push(`graphSource.projectionTargets must include ${normalizePath(projectionPath)}`)
  }
  if (errors.length > 0) {
    throw new Error(`Invalid graph source projection artifact ${projectionPath}: ${errors.join('; ')}`)
  }
  return normalizedProjection
}

export function normalizeStructureOnlyGraphSourceCandidateProjectionArtifact(
  value: unknown,
  graphSource: StructureOnlyGraphSourceCandidateArtifact,
  projectionPath = `${todoAppPbeRunStructureOnlyProfile.supportedSlice}/generated/graph-source-read-model-projection.json`,
  graphSourcePath = `${todoAppPbeRunStructureOnlyProfile.supportedSlice}/graph-source.json`,
): StructureOnlyGraphSourceCandidateProjectionArtifact {
  const errors: string[] = []
  const projection = asRecord(value, 'structureOnlyGraphSourceProjection', errors)
  const metadata = asRecord(projection.metadata, 'structureOnlyGraphSourceProjection.metadata', errors)
  const expectedProjection = projectStructureOnlyGraphSourceCandidateReadModel(graphSource, graphSourcePath).projection
  const nodes = requiredRecordArray<GraphNode>(projection, 'nodes', errors, 'structureOnlyGraphSourceProjection')
  const edges = requiredRecordArray<GraphEdge>(projection, 'edges', errors, 'structureOnlyGraphSourceProjection')
  const coreViewCoverage = requiredRecordArray<CoreViewCoverage>(
    projection,
    'coreViewCoverage',
    errors,
    'structureOnlyGraphSourceProjection',
  )
  const fallbackReferences = requiredStringArray(
    projection,
    'fallbackReferences',
    errors,
    'structureOnlyGraphSourceProjection',
  )
  const retainedCompatibilityArtifacts = requiredStringArray(
    projection,
    'retainedCompatibilityArtifacts',
    errors,
    'structureOnlyGraphSourceProjection',
  )
  const sourceAuthorityBoundary = requiredString(
    projection,
    'sourceAuthorityBoundary',
    errors,
    'structureOnlyGraphSourceProjection',
  )
  const nonPromotionStatement = requiredString(
    projection,
    'nonPromotionStatement',
    errors,
    'structureOnlyGraphSourceProjection',
  )
  const userAcceptanceBoundary = requiredString(
    projection,
    'userAcceptanceBoundary',
    errors,
    'structureOnlyGraphSourceProjection',
  )
  const validateAllBoundary = requiredString(
    projection,
    'validateAllBoundary',
    errors,
    'structureOnlyGraphSourceProjection',
  )

  if (metadata.artifactRole !== 'structure_only_graph_source_read_model_projection') {
    errors.push(
      'structureOnlyGraphSourceProjection.metadata.artifactRole must be structure_only_graph_source_read_model_projection',
    )
  }
  if (normalizePath(String(metadata.sourceArtifact || '')) !== normalizePath(graphSourcePath)) {
    errors.push(`structureOnlyGraphSourceProjection.metadata.sourceArtifact must be ${normalizePath(graphSourcePath)}`)
  }
  if (metadata.sourceProfile !== graphSource.sourceProfile) {
    errors.push(`structureOnlyGraphSourceProjection.metadata.sourceProfile must be ${graphSource.sourceProfile}`)
  }
  if (metadata.graphSourceScope !== graphSource.graphSourceScope) {
    errors.push(`structureOnlyGraphSourceProjection.metadata.graphSourceScope must be ${graphSource.graphSourceScope}`)
  }
  if (metadata.policyLevel !== 'structure-only') {
    errors.push('structureOnlyGraphSourceProjection.metadata.policyLevel must be structure-only')
  }
  if (nodes.length !== todoAppPbeRunStructureOnlyProfile.expectedCounts.nodes) {
    errors.push(
      `structureOnlyGraphSourceProjection.nodes must contain ${todoAppPbeRunStructureOnlyProfile.expectedCounts.nodes} nodes`,
    )
  }
  if (edges.length !== todoAppPbeRunStructureOnlyProfile.expectedCounts.edges) {
    errors.push(
      `structureOnlyGraphSourceProjection.edges must contain ${todoAppPbeRunStructureOnlyProfile.expectedCounts.edges} edges`,
    )
  }
  if (coreViewCoverage.length !== coreViewNames.length) {
    errors.push(`structureOnlyGraphSourceProjection.coreViewCoverage must contain ${coreViewNames.length} Core Views`)
  }
  if (JSON.stringify(nodes) !== JSON.stringify(expectedProjection.nodes)) {
    errors.push('structureOnlyGraphSourceProjection.nodes must match graph source records')
  }
  if (JSON.stringify(edges) !== JSON.stringify(expectedProjection.edges)) {
    errors.push('structureOnlyGraphSourceProjection.edges must match graph source records')
  }
  if (JSON.stringify(coreViewCoverage) !== JSON.stringify(expectedProjection.coreViewCoverage)) {
    errors.push('structureOnlyGraphSourceProjection.coreViewCoverage must match graph source records')
  }
  if (!sourceAuthorityBoundary.includes('structure-only')) {
    errors.push('structureOnlyGraphSourceProjection.sourceAuthorityBoundary must preserve structure-only boundary')
  }
  if (!sourceAuthorityBoundary.includes('does not create') && !sourceAuthorityBoundary.includes('does not add')) {
    errors.push('structureOnlyGraphSourceProjection.sourceAuthorityBoundary must deny broader authority creation')
  }
  if (!nonPromotionStatement.includes('not promote Todo App')) {
    errors.push('structureOnlyGraphSourceProjection.nonPromotionStatement must block Todo App promotion')
  }
  if (!validateAllBoundary.includes('positive validate-all') || !validateAllBoundary.includes('structure-only')) {
    errors.push('structureOnlyGraphSourceProjection.validateAllBoundary must keep positive validate-all structure-only')
  }
  if (userAcceptanceBoundary !== graphSource.graphSourceBoundaries.userAcceptanceBoundary) {
    errors.push(
      'structureOnlyGraphSourceProjection.userAcceptanceBoundary must match graph source userAcceptanceBoundary',
    )
  }

  const normalizedProjection: StructureOnlyGraphSourceCandidateProjectionArtifact = {
    metadata: {
      artifactRole: 'structure_only_graph_source_read_model_projection',
      sourceArtifact: normalizePath(String(metadata.sourceArtifact || '')),
      sourceSlice: normalizePath(String(metadata.sourceSlice || '')),
      sourceProfile: String(metadata.sourceProfile || ''),
      graphSourceScope: 'todo-app-pbe-run-structure-only',
      policyLevel: 'structure-only',
      projectionBoundary: String(metadata.projectionBoundary || ''),
    },
    taxonomy: expectedProjection.taxonomy,
    nodes,
    edges,
    coreViewCoverage,
    fallbackReferences: fallbackReferences.map(normalizePath),
    retainedCompatibilityArtifacts: retainedCompatibilityArtifacts.map(normalizePath),
    sourceAuthorityBoundary,
    nonPromotionStatement,
    userAcceptanceBoundary,
    validateAllBoundary,
  }
  assertAllowedTags({
    version: 'structure-only-graph-source-projection-normalization',
    metadata: {},
    sourceInputs: [],
    taxonomy: {},
    nodes: normalizedProjection.nodes,
    edges: normalizedProjection.edges,
    coreViewCoverage: normalizedProjection.coreViewCoverage,
    checkEvidenceMapping: [],
    retainedWarnings: [],
    compatibilityWarnings: [],
    sourceAuthorityBoundary,
    nonPromotionStatement,
  })

  if (errors.length > 0) {
    throw new Error(`Invalid structure-only graph source candidate projection ${projectionPath}: ${errors.join('; ')}`)
  }
  return normalizedProjection
}

export function normalizeGraphSourceArtifact(
  value: unknown,
  graphSourcePath = `${todoSearchReadModelProfile.supportedSlice}/graph-source.json`,
): GraphSourceArtifact {
  const errors: string[] = []
  const source = asRecord(value, 'graphSource', errors)
  const schemaVersion = source.schemaVersion
  const artifactRole = source.artifactRole
  const status = source.status
  const promotionScope = source.promotionScope
  const sourceSlice = requiredString(source, 'sourceSlice', errors, 'graphSource')
  const sourceProfile = requiredString(source, 'sourceProfile', errors, 'graphSource')
  const sourceAuthorityBoundary = requiredString(source, 'sourceAuthorityBoundary', errors, 'graphSource')
  const projectionBoundary = requiredString(source, 'projectionBoundary', errors, 'graphSource')
  const fallbackReferences = requiredStringArray(source, 'fallbackReferences', errors, 'graphSource')
  const retainedCompatibilityArtifacts = requiredStringArray(
    source,
    'retainedCompatibilityArtifacts',
    errors,
    'graphSource',
  )
  const sourceRecords = normalizeGraphSourceRecords(source.sourceRecords, errors)
  const projectionTargets = normalizeProjectionTargets(source.projectionTargets, errors)
  const userAcceptanceBoundary = requiredString(source, 'userAcceptanceBoundary', errors, 'graphSource')

  if (schemaVersion !== 1) {
    errors.push('graphSource.schemaVersion must be 1')
  }
  if (artifactRole !== 'limited-graph-source') {
    errors.push('graphSource.artifactRole must be limited-graph-source')
  }
  if (status !== 'limited-source-active') {
    errors.push('graphSource.status must be limited-source-active')
  }
  if (promotionScope !== 'todo-search-selected-slice') {
    errors.push('graphSource.promotionScope must be todo-search-selected-slice')
  }
  if (normalizePath(sourceSlice) !== todoSearchReadModelProfile.supportedSlice) {
    errors.push(`graphSource.sourceSlice must be ${todoSearchReadModelProfile.supportedSlice}`)
  }
  if (sourceProfile !== todoSearchReadModelProfile.profileId) {
    errors.push(`graphSource.sourceProfile must be ${todoSearchReadModelProfile.profileId}`)
  }
  if (sourceRecords.nodes.length !== todoSearchReadModelProfile.expectedCounts.nodes) {
    errors.push(`graphSource.sourceRecords.nodes must contain ${todoSearchReadModelProfile.expectedCounts.nodes} nodes`)
  }
  if (sourceRecords.edges.length !== todoSearchReadModelProfile.expectedCounts.edges) {
    errors.push(`graphSource.sourceRecords.edges must contain ${todoSearchReadModelProfile.expectedCounts.edges} edges`)
  }
  if (sourceRecords.coreViewCoverage.length !== coreViewNames.length) {
    errors.push(`graphSource.sourceRecords.coreViewCoverage must contain ${coreViewNames.length} Core Views`)
  }

  const graphSource: GraphSourceArtifact = {
    schemaVersion: 1,
    artifactRole: 'limited-graph-source',
    status: 'limited-source-active',
    promotionScope: 'todo-search-selected-slice',
    sourceSlice: normalizePath(sourceSlice),
    sourceProfile,
    sourceAuthorityBoundary,
    projectionBoundary,
    fallbackReferences: fallbackReferences.map(normalizePath),
    retainedCompatibilityArtifacts: retainedCompatibilityArtifacts.map(normalizePath),
    sourceRecords,
    projectionTargets,
    userAcceptanceBoundary,
  }
  assertAllowedTags({
    version: 'graph-source-normalization',
    metadata: {},
    sourceInputs: [],
    taxonomy: {},
    nodes: graphSource.sourceRecords.nodes,
    edges: graphSource.sourceRecords.edges,
    coreViewCoverage: graphSource.sourceRecords.coreViewCoverage,
    checkEvidenceMapping: [],
    retainedWarnings: [],
    compatibilityWarnings: [],
    sourceAuthorityBoundary,
    nonPromotionStatement: projectionBoundary,
  })

  if (errors.length > 0) {
    throw new Error(`Invalid graph source artifact ${graphSourcePath}: ${errors.join('; ')}`)
  }
  return graphSource
}

export function normalizeStructureOnlyGraphSourceCandidateArtifact(
  value: unknown,
  graphSourcePath = `${todoAppPbeRunStructureOnlyProfile.supportedSlice}/graph-source.json`,
): StructureOnlyGraphSourceCandidateArtifact {
  const errors: string[] = []
  const source = asRecord(value, 'structureOnlyGraphSource', errors)
  const schemaVersion = source.schemaVersion
  const artifactRole = source.artifactRole
  const status = source.status
  const graphSourceScope = source.graphSourceScope
  const sourceSlice = requiredString(source, 'sourceSlice', errors, 'structureOnlyGraphSource')
  const sourceProfile = requiredString(source, 'sourceProfile', errors, 'structureOnlyGraphSource')
  const policyLevel = source.policyLevel
  const sourceAuthorityBoundary = requiredString(source, 'sourceAuthorityBoundary', errors, 'structureOnlyGraphSource')
  const projectionBoundary = requiredString(source, 'projectionBoundary', errors, 'structureOnlyGraphSource')
  const fallbackReferences = requiredStringArray(source, 'fallbackReferences', errors, 'structureOnlyGraphSource')
  const retainedCompatibilityArtifacts = requiredStringArray(
    source,
    'retainedCompatibilityArtifacts',
    errors,
    'structureOnlyGraphSource',
  )
  const sourceRecords = normalizeGraphSourceRecords(source.sourceRecords, errors)
  const graphSourceBoundaries = asRecord(
    source.graphSourceBoundaries,
    'structureOnlyGraphSource.graphSourceBoundaries',
    errors,
  )
  const nonPromotionStatement = requiredString(
    graphSourceBoundaries,
    'nonPromotionStatement',
    errors,
    'structureOnlyGraphSource.graphSourceBoundaries',
  )
  const userAcceptanceBoundary = requiredString(
    graphSourceBoundaries,
    'userAcceptanceBoundary',
    errors,
    'structureOnlyGraphSource.graphSourceBoundaries',
  )
  const validateAllBoundary = requiredString(
    graphSourceBoundaries,
    'validateAllBoundary',
    errors,
    'structureOnlyGraphSource.graphSourceBoundaries',
  )

  if (schemaVersion !== 1) {
    errors.push('structureOnlyGraphSource.schemaVersion must be 1')
  }
  if (artifactRole !== 'structure-only-graph-source') {
    errors.push('structureOnlyGraphSource.artifactRole must be structure-only-graph-source')
  }
  if (status !== 'confirmed-graph-source-backed') {
    errors.push('structureOnlyGraphSource.status must be confirmed-graph-source-backed')
  }
  if (graphSourceScope !== 'todo-app-pbe-run-structure-only') {
    errors.push('structureOnlyGraphSource.graphSourceScope must be todo-app-pbe-run-structure-only')
  }
  if (normalizePath(sourceSlice) !== todoAppPbeRunStructureOnlyProfile.supportedSlice) {
    errors.push(`structureOnlyGraphSource.sourceSlice must be ${todoAppPbeRunStructureOnlyProfile.supportedSlice}`)
  }
  if (sourceProfile !== todoAppPbeRunStructureOnlyProfile.profileId) {
    errors.push(`structureOnlyGraphSource.sourceProfile must be ${todoAppPbeRunStructureOnlyProfile.profileId}`)
  }
  if (policyLevel !== 'structure-only') {
    errors.push('structureOnlyGraphSource.policyLevel must be structure-only')
  }
  if (sourceRecords.nodes.length !== todoAppPbeRunStructureOnlyProfile.expectedCounts.nodes) {
    errors.push(
      `structureOnlyGraphSource.sourceRecords.nodes must contain ${todoAppPbeRunStructureOnlyProfile.expectedCounts.nodes} nodes`,
    )
  }
  if (sourceRecords.edges.length !== todoAppPbeRunStructureOnlyProfile.expectedCounts.edges) {
    errors.push(
      `structureOnlyGraphSource.sourceRecords.edges must contain ${todoAppPbeRunStructureOnlyProfile.expectedCounts.edges} edges`,
    )
  }
  if (sourceRecords.coreViewCoverage.length !== coreViewNames.length) {
    errors.push(
      `structureOnlyGraphSource.sourceRecords.coreViewCoverage must contain ${coreViewNames.length} Core Views`,
    )
  }
  if (!sourceAuthorityBoundary.includes('structure-only')) {
    errors.push('structureOnlyGraphSource.sourceAuthorityBoundary must preserve structure-only boundary')
  }
  if (!nonPromotionStatement.includes('not promote Todo App')) {
    errors.push('structureOnlyGraphSource.graphSourceBoundaries.nonPromotionStatement must block Todo App promotion')
  }
  if (!validateAllBoundary.includes('positive validate-all') || !validateAllBoundary.includes('structure-only')) {
    errors.push(
      'structureOnlyGraphSource.graphSourceBoundaries.validateAllBoundary must keep positive validate-all structure-only',
    )
  }

  const graphSourceCandidate: StructureOnlyGraphSourceCandidateArtifact = {
    schemaVersion: 1,
    artifactRole: 'structure-only-graph-source',
    status: 'confirmed-graph-source-backed',
    graphSourceScope: 'todo-app-pbe-run-structure-only',
    sourceSlice: normalizePath(sourceSlice),
    sourceProfile,
    policyLevel: 'structure-only',
    sourceAuthorityBoundary,
    projectionBoundary,
    fallbackReferences: fallbackReferences.map(normalizePath),
    retainedCompatibilityArtifacts: retainedCompatibilityArtifacts.map(normalizePath),
    sourceRecords,
    graphSourceBoundaries: {
      nonPromotionStatement,
      userAcceptanceBoundary,
      validateAllBoundary,
    },
  }
  assertAllowedTags({
    version: 'structure-only-graph-source-normalization',
    metadata: {},
    sourceInputs: [],
    taxonomy: {},
    nodes: graphSourceCandidate.sourceRecords.nodes,
    edges: graphSourceCandidate.sourceRecords.edges,
    coreViewCoverage: graphSourceCandidate.sourceRecords.coreViewCoverage,
    checkEvidenceMapping: [],
    retainedWarnings: [],
    compatibilityWarnings: [],
    sourceAuthorityBoundary,
    nonPromotionStatement,
  })

  if (errors.length > 0) {
    throw new Error(`Invalid structure-only graph source ${graphSourcePath}: ${errors.join('; ')}`)
  }
  return graphSourceCandidate
}

function validateReadModelRegistryPolicyConsistency(
  profile: ReadModelSliceRegistryProfile,
  index: number,
  errors: string[],
): void {
  const prefix = `registry.profiles[${index}]`
  if (profile.requiredCommands.includes('compare') && !profile.requiredArtifacts.manualReadModel) {
    errors.push(`${prefix}.requiredArtifacts.manualReadModel is required when requiredCommands includes compare`)
  }
  if (profile.optionalArtifacts.graphSourceProjection && !profile.optionalArtifacts.graphSource) {
    errors.push(`${prefix}.optionalArtifacts.graphSource is required when graphSourceProjection is declared`)
  }
  if (profile.policyLevel === 'structure-only') {
    if (profile.requiredCommands.includes('compare')) {
      errors.push(`${prefix}.requiredCommands must not include compare for structure-only policy`)
    }
    if (profile.parityRequirement.required === true) {
      errors.push(`${prefix}.parityRequirement.required must be false for structure-only policy`)
    }
    if (profile.pilotMarkerRequirement.required === true) {
      errors.push(`${prefix}.pilotMarkerRequirement.required must be false for structure-only policy`)
    }
    if ('parityReport' in profile.requiredArtifacts) {
      errors.push(`${prefix}.requiredArtifacts.parityReport is not allowed for structure-only policy`)
    }
    if ('scopedPilotMarker' in profile.requiredArtifacts) {
      errors.push(`${prefix}.requiredArtifacts.scopedPilotMarker is not allowed for structure-only policy`)
    }
  }
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
  const readModelRecords = await buildGeneratedReadModelRecords(root, data, profile)
  const nodes = readModelRecords.nodes
  const edges = readModelRecords.edges
  const coreViewCoverage = readModelRecords.coreViewCoverage
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
      sourceAuthority: sourceAuthorityBoundaryForProfile(profile),
      nonPromotionStatement: nonPromotionStatementForProfile(profile),
      taxonomyBasis: 'docs/concept/graph-node-edge-tag-policy.md',
      coreViewBasis: 'docs/concept/view-tree-pack.md 7 Core Views',
      viewMembershipBoundary:
        'View membership is represented by includedInViewIds and coreViewCoverage. viewScopedTags contains only role tags.',
      ...readModelRecords.metadata,
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
    sourceAuthorityBoundary: sourceAuthorityBoundaryForProfile(profile),
    nonPromotionStatement: nonPromotionStatementForProfile(profile),
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

async function buildGeneratedReadModelRecords(
  root: string,
  data: Record<string, unknown>,
  profile: SliceReadModelConfig,
): Promise<
  Pick<GeneratedReadModel, 'nodes' | 'edges' | 'coreViewCoverage'> & {
    metadata: Record<string, unknown>
  }
> {
  if (profile.policyLevel === 'pilot-marker-backed' && profile.artifacts.graphSource) {
    const graphSourcePath = `${profile.supportedSlice}/${profile.artifacts.graphSource}`
    const graphSource = await loadGraphSourceArtifact(root, graphSourcePath)
    const projection = projectGraphSourceReadModel(graphSource, graphSourcePath).projection
    return {
      nodes: cloneJson(projection.nodes),
      edges: cloneJson(projection.edges),
      coreViewCoverage: cloneJson(projection.coreViewCoverage),
      metadata: {
        readModelSourceMode: 'graph-source-backed',
        graphSourceArtifact: graphSourcePath,
        graphSourceProjectionRole: projection.metadata.artifactRole,
        graphSourcePromotionScope: projection.metadata.promotionScope,
        graphSourceProjectionBoundary: projection.metadata.projectionBoundary,
        fallbackReferences: cloneJson(projection.fallbackReferences),
      },
    }
  }

  if (profile.policyLevel === 'structure-only' && profile.artifacts.graphSource) {
    const graphSourceCandidatePath = `${profile.supportedSlice}/${profile.artifacts.graphSource}`
    const graphSourceCandidate = await loadStructureOnlyGraphSourceCandidateArtifact(root, graphSourceCandidatePath)
    const projection = projectStructureOnlyGraphSourceCandidateReadModel(
      graphSourceCandidate,
      graphSourceCandidatePath,
    ).projection
    return {
      nodes: cloneJson(projection.nodes),
      edges: cloneJson(projection.edges),
      coreViewCoverage: cloneJson(projection.coreViewCoverage),
      metadata: {
        readModelSourceMode: 'graph-source-backed',
        graphSourceArtifact: graphSourceCandidatePath,
        graphSourceProjectionRole: projection.metadata.artifactRole,
        graphSourceStatus: graphSourceCandidate.status,
        graphSourceScope: graphSourceCandidate.graphSourceScope,
        graphSourcePolicyLevel: graphSourceCandidate.policyLevel,
        graphSourceBoundary: graphSourceCandidate.sourceAuthorityBoundary,
        graphSourceProjectionBoundary: projection.metadata.projectionBoundary,
        graphSourcePromotionStatus: 'structure-only-confirmed',
        graphSourceAuthorityStatus: 'confirmed-structure-only-graph-source',
        fallbackReferences: cloneJson(projection.fallbackReferences),
      },
    }
  }

  return {
    nodes: buildNodes(data, profile),
    edges: buildEdges(data, profile),
    coreViewCoverage: buildCoreViewCoverage(profile),
    metadata: {},
  }
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
  const manifestPath = path.join(outputDir, 'read-model-evidence-manifest.json')
  const generated = await readRequiredJson<GeneratedReadModel>(generatedPath, 'generated read-model')
  const manifest = await readRequiredJson<Record<string, unknown>>(manifestPath, 'read-model evidence manifest')
  const parity =
    profile.policyLevel === 'pilot-marker-backed'
      ? await readRequiredJson<ParityReport>(
          path.join(outputDir, 'read-model-parity-report.json'),
          'read-model parity report',
        )
      : undefined
  const marker =
    profile.policyLevel === 'pilot-marker-backed'
      ? await readOptionalJson<Record<string, unknown> | undefined>(
          path.join(outputDir, 'scoped-source-authority-pilot-marker.json'),
          undefined,
        )
      : undefined
  const report = buildValidationReport(root, slice, profile, generated, parity, manifest, marker)
  const reportJsonPath = path.join(outputDir, 'read-model-validation-report.json')
  const reportMarkdownPath = path.join(outputDir, 'read-model-validation-report.md')
  await writeFormattedJson(reportJsonPath, report)
  await writeFormattedMarkdown(reportMarkdownPath, renderValidationReportMarkdown(report))
  return { reportJsonPath, reportMarkdownPath, report }
}

export async function summarizeReadModelEvidence(root: string, slices: string[]): Promise<AggregateResult> {
  const normalizedSlices = unique(slices.map(normalizePath).filter(Boolean))
  if (normalizedSlices.length === 0) {
    throw new Error('graph read-model summarize requires at least one --slices entry.')
  }
  const commandIdentity = `pbe graph read-model summarize --slices ${normalizedSlices.join(',')}`
  const perSliceSummaries = await Promise.all(
    normalizedSlices.map((slice) => buildPerSliceAggregateSummary(root, slice)),
  )
  const status = aggregateStatus(perSliceSummaries)
  const outputDir = path.join(path.resolve(root), 'examples', 'read-model-aggregate', 'generated')
  const summary: AggregateReadModelSummary = {
    version: '0.1.0-read-model-aggregate-summary',
    metadata: {
      summarizedAt: new Date().toISOString(),
      commandIdentity,
      sourceCommit: resolveSourceCommit(root),
      aggregateArtifactRole: 'cross-slice-evidence-summary',
      inputReportList: normalizedSlices.map((slice) => `${slice}/generated/read-model-validation-report.json`),
      sourceMode: 'existing-per-slice-validation-reports-only',
      generationBoundary:
        'Aggregate summarize reads per-slice validation reports only. It does not run generate, compare, validate, or validate --all.',
    },
    status,
    aggregateBoundary:
      'Aggregate read-model summary is Evidence-only over existing per-slice validation reports. It does not expand source authority, introduce CI enforcement, approve promotion, run validation, or replace user approval.',
    nonPromotionStatement:
      'Aggregate-pass is not user acceptance, source-authority expansion, CI enforcement, or full Graph-source promotion.',
    decisionRule: [
      'Any slice with blocking status, missing report, or malformed report => aggregate-blocked.',
      'Otherwise, any decision-required slice => decision-required.',
      'Otherwise, any warning slice => aggregate-warning.',
      'All included slices validation-pass with 0 warning/blocking/decision-required => aggregate-pass.',
    ],
    includedSlices: normalizedSlices,
    summary: aggregateCounts(perSliceSummaries, status),
    perSliceSummaries,
    recommendedNextDecisionSurface: [
      'Keep aggregate summary as Evidence-only and observe report stability',
      'Design per-slice validation aggregation implementation separately',
      'Decide whether validate --all is needed after aggregate reports remain stable',
      'Decide whether CI should run aggregate summarize in non-enforcing mode',
      'Do not treat aggregate-pass as source promotion or user acceptance',
    ],
  }
  const summaryJsonPath = path.join(outputDir, 'read-model-aggregate-summary.json')
  const summaryMarkdownPath = path.join(outputDir, 'read-model-aggregate-summary.md')
  await writeFormattedJson(summaryJsonPath, summary)
  await writeFormattedMarkdown(summaryMarkdownPath, renderAggregateSummaryMarkdown(summary))
  return { summaryJsonPath, summaryMarkdownPath, summary }
}

export async function validateAllReadModelEvidence(
  root: string,
  registryPath = 'examples/read-model-aggregate/read-model-slices.json',
): Promise<ValidateAllResult> {
  const registry = await loadReadModelSliceRegistry(root, registryPath)
  const plans = buildReadModelRegistryCommandPlans(registry)
  if (plans.length === 0) {
    throw new Error(`Read-model registry ${registryPath} has no profiles included in validate-all.`)
  }

  const perSliceResults: ValidateAllProfileResult[] = []
  for (const plan of plans) {
    const profile = getSliceReadModelProfile(plan.sourceSlice)
    const registryProfile = assertRegistryProfileMatchesConfig(registryPath, registry.profiles, profile)
    perSliceResults.push(await runValidateAllProfilePlan(root, profile, registryProfile, plan.commands))
  }

  const aggregateResult = await summarizeReadModelEvidence(
    root,
    plans.map((plan) => plan.sourceSlice),
  )

  const status = validateAllAggregateStatus(perSliceResults, aggregateResult.summary.status)

  return {
    status,
    registryPath,
    includedProfiles: plans.map((plan) => ({
      profileId: plan.profileId,
      sourceSlice: plan.sourceSlice,
      policyLevel: plan.policyLevel,
      requiredCommands: [...plan.commands],
      projectionContractRequired: Boolean(
        registry.profiles.find((entry) => entry.sourceSlice === plan.sourceSlice)?.optionalArtifacts
          .graphSourceProjection,
      ),
    })),
    perSliceResults,
    aggregateResult,
    sourceAuthorityBoundary:
      'Registry-backed validate-all is local Evidence over configured read-model slices only. It does not expand source authority.',
    nonPromotionStatement:
      'validate-all pass is not user acceptance, source-authority expansion, CI enforcement, or full Graph-source promotion.',
    nonEnforcementStatement:
      'This local validate-all command is non-enforcing and is not wired to required checks, branch protection, or CI enforcement.',
  }
}

async function runValidateAllProfilePlan(
  root: string,
  profile: SliceReadModelConfig,
  registryProfile: ReadModelSliceRegistryProfile,
  commands: RegistryCommand[],
): Promise<ValidateAllProfileResult> {
  const commandResults: Array<Record<string, unknown>> = []
  let status: ValidateAllProfileResult['status'] = 'pass'

  for (const command of commands) {
    if (command === 'generate') {
      const result = await generateReadModelEvidence(root, profile.supportedSlice)
      const generatedReadModelPath = registrySliceArtifact(
        registryProfile,
        requiredRegistryArtifact(registryProfile, 'generatedReadModel'),
      )
      const evidenceManifestPath = registrySliceArtifact(
        registryProfile,
        requiredRegistryArtifact(registryProfile, 'evidenceManifest'),
      )
      commandResults.push({
        command,
        status: 'pass',
        generatedReadModel: generatedReadModelPath,
        evidenceManifest: evidenceManifestPath,
        generatedReadModelMatchesRegistry: relativePath(root, result.generatedJsonPath) === generatedReadModelPath,
        evidenceManifestMatchesRegistry: relativePath(root, result.manifestPath) === evidenceManifestPath,
        nodeCount: result.model.nodes.length,
        edgeCount: result.model.edges.length,
      })
    } else if (command === 'compare') {
      const result = await compareReadModelEvidence(
        root,
        registrySliceArtifact(registryProfile, requiredRegistryArtifact(registryProfile, 'generatedReadModel')),
        registrySliceArtifact(registryProfile, requiredRegistryArtifact(registryProfile, 'manualReadModel')),
      )
      const comparisonStatus = result.report.summary.status
      if (comparisonStatus === 'comparison-blocked') {
        status = 'blocked'
      } else if (comparisonStatus === 'decision-required') {
        status = 'decision-required'
      }
      commandResults.push({
        command,
        status: comparisonStatus,
        parityReport: registrySliceArtifact(registryProfile, requiredRegistryArtifact(registryProfile, 'parityReport')),
        parityReportMatchesRegistry:
          relativePath(root, result.reportJsonPath) ===
          registrySliceArtifact(registryProfile, requiredRegistryArtifact(registryProfile, 'parityReport')),
        mismatchCount: result.report.summary.mismatchCount,
        blockingCount: result.report.summary.blockingCount,
        decisionRequiredCount: result.report.summary.decisionRequiredCount,
      })
    } else if (command === 'validate') {
      const result = await validateReadModelEvidence(root, profile.supportedSlice)
      if (result.report.status === 'validation-blocked') {
        status = 'blocked'
      } else if (result.report.status === 'decision-required') {
        status = 'decision-required'
      }
      commandResults.push({
        command,
        status: result.report.status,
        validationReport: registrySliceArtifact(
          registryProfile,
          requiredRegistryArtifact(registryProfile, 'validationReport'),
        ),
        validationReportMatchesRegistry:
          relativePath(root, result.reportJsonPath) ===
          registrySliceArtifact(registryProfile, requiredRegistryArtifact(registryProfile, 'validationReport')),
        checkCount: result.report.summary.checkCount,
        warningCount: result.report.summary.warningCount,
        blockingCount: result.report.summary.blockingCount,
        decisionRequiredCount: result.report.summary.decisionRequiredCount,
      })
    } else {
      throw new Error(`Unsupported read-model registry command "${command}" for ${profile.profileId}.`)
    }
  }

  const graphSourceProjectionPath = registryProfile.optionalArtifacts.graphSourceProjection
  const graphSourcePath = registryProfile.optionalArtifacts.graphSource
  if (profile.policyLevel === 'pilot-marker-backed' && graphSourcePath && graphSourceProjectionPath) {
    try {
      const projection = await loadGraphSourceProjectionArtifact(
        root,
        registrySliceArtifact(registryProfile, graphSourceProjectionPath),
        registrySliceArtifact(registryProfile, graphSourcePath),
      )
      commandResults.push({
        command: 'project-contract',
        status: 'projection-contract-pass',
        graphSource: registrySliceArtifact(registryProfile, graphSourcePath),
        projection: registrySliceArtifact(registryProfile, graphSourceProjectionPath),
        nodeCount: projection.nodes.length,
        edgeCount: projection.edges.length,
        coreViewCount: projection.coreViewCoverage.length,
        contractMode: 'source-backed',
        sourceAuthorityBoundary: projection.sourceAuthorityBoundary,
        nonPromotionStatement: projection.nonPromotionStatement,
      })
    } catch (error) {
      status = 'blocked'
      commandResults.push({
        command: 'project-contract',
        status: 'projection-contract-blocked',
        graphSource: registrySliceArtifact(registryProfile, graphSourcePath),
        projection: registrySliceArtifact(registryProfile, graphSourceProjectionPath),
        blockingCount: 1,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const graphSourceCandidateProjectionPath = registryProfile.optionalArtifacts.graphSourceProjection
  const graphSourceCandidatePath = registryProfile.optionalArtifacts.graphSource
  if (profile.policyLevel === 'structure-only' && graphSourceCandidateProjectionPath && graphSourceCandidatePath) {
    try {
      const projection = await loadStructureOnlyGraphSourceCandidateProjectionArtifact(
        root,
        registrySliceArtifact(registryProfile, graphSourceCandidateProjectionPath),
        registrySliceArtifact(registryProfile, graphSourceCandidatePath),
      )
      commandResults.push({
        command: 'project-contract',
        status: 'projection-contract-pass',
        graphSource: registrySliceArtifact(registryProfile, graphSourceCandidatePath),
        projection: registrySliceArtifact(registryProfile, graphSourceCandidateProjectionPath),
        nodeCount: projection.nodes.length,
        edgeCount: projection.edges.length,
        coreViewCount: projection.coreViewCoverage.length,
        contractMode: 'structure-only-confirmed',
        sourceAuthorityBoundary: projection.sourceAuthorityBoundary,
        nonPromotionStatement: projection.nonPromotionStatement,
        validateAllBoundary: projection.validateAllBoundary,
      })
    } catch (error) {
      status = 'blocked'
      commandResults.push({
        command: 'project-contract',
        status: 'projection-contract-blocked',
        graphSource: registrySliceArtifact(registryProfile, graphSourceCandidatePath),
        projection: registrySliceArtifact(registryProfile, graphSourceCandidateProjectionPath),
        contractMode: 'structure-only-confirmed',
        blockingCount: 1,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    profileId: profile.profileId,
    sourceSlice: profile.supportedSlice,
    policyLevel: profile.policyLevel,
    commands: commandResults,
    status,
  }
}

function assertRegistryProfileMatchesConfig(
  registryPath: string,
  registryProfiles: ReadModelSliceRegistryProfile[],
  profile: SliceReadModelConfig,
): ReadModelSliceRegistryProfile {
  const registryProfile = registryProfiles.find((entry) => entry.sourceSlice === profile.supportedSlice)
  if (!registryProfile) {
    throw new Error(`Read-model registry ${registryPath} does not include configured slice ${profile.supportedSlice}.`)
  }

  const mismatches: string[] = []
  if (registryProfile.profileId !== profile.profileId) {
    mismatches.push(`profileId ${registryProfile.profileId} != ${profile.profileId}`)
  }
  if (registryProfile.sourceLayout !== profile.sourceLayout) {
    mismatches.push(`sourceLayout ${registryProfile.sourceLayout} != ${profile.sourceLayout}`)
  }
  if (registryProfile.policyLevel !== profile.policyLevel) {
    mismatches.push(`policyLevel ${registryProfile.policyLevel} != ${profile.policyLevel}`)
  }
  if (registryProfile.expectedCounts.nodes !== profile.expectedCounts.nodes) {
    mismatches.push(`nodes ${registryProfile.expectedCounts.nodes} != ${profile.expectedCounts.nodes}`)
  }
  if (registryProfile.expectedCounts.edges !== profile.expectedCounts.edges) {
    mismatches.push(`edges ${registryProfile.expectedCounts.edges} != ${profile.expectedCounts.edges}`)
  }
  if (registryProfile.expectedCounts.validationChecks !== profile.expectedCounts.validationChecks) {
    mismatches.push(
      `validationChecks ${registryProfile.expectedCounts.validationChecks} != ${profile.expectedCounts.validationChecks}`,
    )
  }
  for (const key of ['generatedReadModel', 'evidenceManifest', 'validationReport'] as const) {
    const registryArtifact = registryProfile.requiredArtifacts[key]
    const configuredArtifact = profile.artifacts[key]
    if (configuredArtifact && registryArtifact !== configuredArtifact) {
      mismatches.push(`requiredArtifacts.${key} ${registryArtifact || 'missing'} != ${configuredArtifact}`)
    }
  }
  for (const key of ['manualReadModel', 'generatedParityReport', 'scopedPilotMarker'] as const) {
    const registryKey = key === 'generatedParityReport' ? 'parityReport' : key
    const registryArtifact = registryProfile.requiredArtifacts[registryKey]
    const configuredArtifact = profile.artifacts[key]
    if (configuredArtifact && registryArtifact !== configuredArtifact) {
      mismatches.push(`requiredArtifacts.${registryKey} ${registryArtifact || 'missing'} != ${configuredArtifact}`)
    }
  }
  if (profile.artifacts.graphSource) {
    const registryGraphSource = registryProfile.optionalArtifacts.graphSource
    if (registryGraphSource !== profile.artifacts.graphSource) {
      mismatches.push(
        `optionalArtifacts.graphSource ${registryGraphSource || 'missing'} != ${profile.artifacts.graphSource}`,
      )
    }
  }

  if (mismatches.length > 0) {
    throw new Error(
      `Read-model registry ${registryPath} does not match in-code profile ${profile.profileId}: ${mismatches.join('; ')}`,
    )
  }
  return registryProfile
}

function requiredRegistryArtifact(registryProfile: ReadModelSliceRegistryProfile, artifactKey: string): string {
  const artifact = registryProfile.requiredArtifacts[artifactKey]
  if (!artifact) {
    throw new Error(
      `Read-model registry profile ${registryProfile.profileId} must declare requiredArtifacts.${artifactKey}.`,
    )
  }
  return artifact
}

function registrySliceArtifact(registryProfile: ReadModelSliceRegistryProfile, artifactPath: string): string {
  return `${registryProfile.sourceSlice}/${artifactPath}`
}

function validateAllAggregateStatus(
  perSliceResults: ValidateAllProfileResult[],
  aggregateStatusValue: AggregateStatus,
): AggregateStatus {
  if (perSliceResults.some((entry) => entry.status === 'blocked')) {
    return 'aggregate-blocked'
  }
  if (perSliceResults.some((entry) => entry.status === 'decision-required')) {
    return 'decision-required'
  }
  return aggregateStatusValue
}

async function buildPerSliceAggregateSummary(root: string, slice: string): Promise<PerSliceAggregateSummary> {
  const reportPath = `${slice}/generated/read-model-validation-report.json`
  const absoluteReportPath = path.resolve(root, reportPath)
  const parsed = await readJsonSafe<ValidationReport>(absoluteReportPath)
  if (!parsed.ok) {
    const reportStatus = existsSync(absoluteReportPath) ? 'malformed' : 'missing'
    return {
      sourceSlice: slice,
      reportPath,
      reportStatus,
      profileId: 'unknown',
      policyLevel: 'unknown',
      sourceLayout: 'unknown',
      validationStatus: reportStatus,
      checkCount: 0,
      passCount: 0,
      warningCount: 0,
      blockingCount: 1,
      decisionRequiredCount: 0,
      parityRequirement: { required: 'unknown', status: 'unknown' },
      pilotMarkerRequirement: { required: 'unknown', status: 'unknown' },
      runtimeFixtureRequirement: { required: 'unknown', status: 'unknown' },
      retainedWarningCount: 0,
      acceptedLimitations: [],
      sourceAuthorityBoundary: 'unavailable because the per-slice validation report could not be read',
      nonPromotionStatement: 'Aggregate summary did not infer promotion from a missing or malformed report.',
      notes: [`Per-slice validation report is ${reportStatus}: ${parsed.error}`],
    }
  }
  const report = parsed.value
  const contract = objectValue(report.sliceValidationContract)
  const metadata = objectValue(report.metadata)
  const summary = objectValue(report.summary)
  const retainedWarnings = Array.isArray(report.retainedWarnings)
    ? report.retainedWarnings
    : arrayValue(getPath(contract, ['retainedWarnings']))
  return {
    sourceSlice: stringValue(getPath(contract, ['sourceSlice']), stringValue(metadata.sourceSlice, slice)),
    reportPath,
    reportStatus: 'present',
    profileId: stringValue(
      getPath(contract, ['profileId']),
      stringValue(metadata.profileId, stringValue(metadata.sliceProfile)),
    ),
    policyLevel: stringValue(getPath(contract, ['policyLevel']), stringValue(metadata.policyLevel, 'unknown')),
    sourceLayout: stringValue(getPath(contract, ['sourceLayout']), stringValue(metadata.sourceLayout, 'unknown')),
    validationStatus: stringValue(report.status, stringValue(summary.status, 'unknown')),
    checkCount: numberValue(getPath(summary, ['checkCount'])),
    passCount: numberValue(getPath(summary, ['passCount'])),
    warningCount: numberValue(getPath(summary, ['warningCount'])),
    blockingCount: numberValue(getPath(summary, ['blockingCount'])),
    decisionRequiredCount: numberValue(getPath(summary, ['decisionRequiredCount'])),
    parityRequirement: objectValue(getPath(contract, ['parityRequirement']) || metadata.parityRequirement),
    pilotMarkerRequirement: objectValue(
      getPath(contract, ['pilotMarkerRequirement']) || metadata.pilotMarkerRequirement,
    ),
    runtimeFixtureRequirement: objectValue(
      getPath(contract, ['runtimeFixtureRequirement']) || metadata.runtimeFixtureRequirement,
    ),
    retainedWarningCount: retainedWarnings.length,
    acceptedLimitations: retainedWarnings,
    sourceAuthorityBoundary: stringValue(
      getPath(contract, ['sourceAuthorityBoundary']),
      stringValue(report.sourceAuthorityBoundary, 'missing source authority boundary'),
    ),
    nonPromotionStatement: stringValue(
      getPath(contract, ['nonPromotionStatement']),
      stringValue(report.nonPromotionStatement, 'missing non-promotion statement'),
    ),
    notes: [
      'Per-slice validation report is interpreted as an independent Evidence unit.',
      stringValue(
        getPath(contract, ['crossSliceDependencyRule']),
        'No cross-slice dependency rule was found in the report.',
      ),
    ],
  }
}

function aggregateStatus(perSliceSummaries: PerSliceAggregateSummary[]): AggregateStatus {
  if (
    perSliceSummaries.some(
      (entry) =>
        entry.reportStatus !== 'present' || entry.validationStatus === 'validation-blocked' || entry.blockingCount > 0,
    )
  ) {
    return 'aggregate-blocked'
  }
  if (
    perSliceSummaries.some((entry) => entry.validationStatus === 'decision-required' || entry.decisionRequiredCount > 0)
  ) {
    return 'decision-required'
  }
  if (perSliceSummaries.some((entry) => entry.validationStatus === 'validation-warning' || entry.warningCount > 0)) {
    return 'aggregate-warning'
  }
  return 'aggregate-pass'
}

function aggregateCounts(
  perSliceSummaries: PerSliceAggregateSummary[],
  status: AggregateStatus,
): AggregateReadModelSummary['summary'] {
  return {
    sliceCount: perSliceSummaries.length,
    presentReportCount: perSliceSummaries.filter((entry) => entry.reportStatus === 'present').length,
    missingReportCount: perSliceSummaries.filter((entry) => entry.reportStatus === 'missing').length,
    malformedReportCount: perSliceSummaries.filter((entry) => entry.reportStatus === 'malformed').length,
    validationPassCount: perSliceSummaries.filter((entry) => entry.validationStatus === 'validation-pass').length,
    warningCount: sum(perSliceSummaries.map((entry) => entry.warningCount)),
    blockingCount: sum(perSliceSummaries.map((entry) => entry.blockingCount)),
    decisionRequiredCount: sum(perSliceSummaries.map((entry) => entry.decisionRequiredCount)),
    retainedWarningCount: sum(perSliceSummaries.map((entry) => entry.retainedWarningCount)),
    status,
  }
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
    productPatchTree: await readOptionalJson<Record<string, unknown>>(
      profile.artifacts.productPatchTree ? artifactPath(profile.artifacts.productPatchTree) : undefined,
      { patches: [] },
    ),
    cycleContract: await readRequiredText(artifactPath(profile.artifacts.cycleContract), 'cycle contract'),
    cycleTree: await readOptionalJson<Record<string, unknown>>(
      profile.artifacts.cycleTree ? artifactPath(profile.artifacts.cycleTree) : undefined,
      { cycles: [] },
    ),
    nodeExecutionContract: await readOptionalText(
      profile.artifacts.nodeExecutionContract ? artifactPath(profile.artifacts.nodeExecutionContract) : undefined,
    ),
    runtimeEvidence: await readOptionalText(
      profile.artifacts.runtimeEvidence ? artifactPath(profile.artifacts.runtimeEvidence) : undefined,
    ),
    approvalBrief: await readOptionalText(
      profile.artifacts.approvalBrief ? artifactPath(profile.artifacts.approvalBrief) : undefined,
    ),
    evidenceExceptions: await readOptionalText(
      profile.artifacts.evidenceExceptions ? artifactPath(profile.artifacts.evidenceExceptions) : undefined,
    ),
    workGraph: await readOptionalJson<Record<string, unknown>>(
      profile.artifacts.workGraph ? artifactPath(profile.artifacts.workGraph) : undefined,
      { nodes: [], edges: [] },
    ),
    sourceOfTruthMatrix: await readOptionalText(
      profile.artifacts.sourceOfTruthMatrix ? artifactPath(profile.artifacts.sourceOfTruthMatrix) : undefined,
    ),
    evidenceOutput: await readOptionalText(
      profile.artifacts.evidenceOutput ? artifactPath(profile.artifacts.evidenceOutput) : undefined,
    ),
    pbeState: await readOptionalJson<Record<string, unknown>>(
      profile.artifacts.pbeState ? artifactPath(profile.artifacts.pbeState) : undefined,
      {},
    ),
  }
}

function buildNodes(data: Record<string, unknown>, profile: SliceReadModelConfig): GraphNode[] {
  if (profile.sourceLayout === 'canonical-pbe') {
    return buildCanonicalPbeStructureNodes(data, profile)
  }
  return buildTodoSearchNodes(data, profile)
}

function buildTodoSearchNodes(data: Record<string, unknown>, profile: SliceReadModelConfig): GraphNode[] {
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
      sliceArtifact(profile, 'limitedPilotTransitionRecord'),
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
      sliceArtifact(profile, 'compatibilityControlNode'),
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
      sliceArtifact(profile, 'generatedEvidenceRequirement'),
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
      sliceArtifact(profile, 'compatibilityEvidenceExceptions'),
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
      sliceArtifact(profile, 'limitedPilotPackage'),
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
      sliceArtifact(profile, 'scopedPilotExecutionRecord'),
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
      sliceArtifact(profile, 'limitedPilotTransitionRecord'),
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

function buildCanonicalPbeStructureNodes(data: Record<string, unknown>, profile: SliceReadModelConfig): GraphNode[] {
  const productNodes = getArray<TreeNode>(data.productTree, 'nodes')
  const projectNodes = getArray<TreeNode>(data.projectTree, 'nodes')
  const workNodes = getArray<TreeNode>(data.workTree, 'nodes')
  const testNodes = getArray<TreeNode>(data.testTree, 'nodes')
  const evidenceRecords = getArray<TreeNode>(data.evidenceTree, 'evidence')
  const acceptanceBranches = getArray<TreeNode>(data.acceptanceTree, 'branches')
  const changes = getArray<TreeNode>(data.changeTree, 'changes')
  const impacts = getArray<TreeNode>(data.impactTree, 'impacts')
  const cycles = getArray<TreeNode>(data.cycleTree, 'cycles')
  const workGraphNodes = getArray<TreeNode>(data.workGraph, 'nodes')
  const criteria = productNodes.flatMap((entry) => entry.acceptanceCriteria || [])
  return [
    ...productNodes.map((entry) =>
      node(
        entry.id,
        'requirement',
        sliceArtifact(profile, 'productTree'),
        entry.title || entry.id,
        entry.status || 'confirmed',
        confidenceForStatus(entry.status),
        statusFreshness(entry.status),
        entry.id === profile.ids.product ? ['target', 'required'] : ['context'],
        ['intent-view', 'behavior-view'],
      ),
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
        ['intent-view', 'verification-view'],
      ),
    ),
    ...projectNodes.map((entry) =>
      node(
        entry.id,
        'code',
        sliceArtifact(profile, 'projectTree'),
        entry.title || entry.id,
        entry.status || 'derived',
        'inferred',
        statusFreshness(entry.status),
        ['context'],
        ['structure-view'],
      ),
    ),
    ...workNodes.map((entry) =>
      node(
        entry.id,
        'task',
        sliceArtifact(profile, 'workTree'),
        entry.title || entry.id,
        entry.status || 'implemented',
        'inferred',
        statusFreshness(entry.status),
        entry.id === profile.ids.work ? ['target', 'required'] : ['context'],
        ['scope-execution-view', 'impact-view'],
      ),
    ),
    ...testNodes.map((entry) =>
      node(
        entry.id,
        'check',
        sliceArtifact(profile, 'testTree'),
        entry.title || entry.id,
        entry.status || 'passed',
        confidenceForStatus(entry.status),
        checkFreshness(entry.status),
        ['required'],
        ['verification-view'],
      ),
    ),
    ...evidenceRecords.map((entry) =>
      node(
        entry.id,
        'evidence',
        sliceArtifact(profile, 'evidenceTree'),
        String(entry.title || entry.path || entry.id),
        entry.status || 'attached',
        confidenceForStatus(entry.status),
        statusFreshness(entry.status),
        ['output', 'required'],
        ['verification-view', 'evidence-acceptance-view'],
      ),
    ),
    ...acceptanceBranches.map((entry) =>
      node(
        `ACCEPT-${String(entry.productNodeId || profile.ids.product)}`,
        'decision',
        sliceArtifact(profile, 'acceptanceTree'),
        textField(entry, 'coverageSummary', `Acceptance for ${String(entry.productNodeId || profile.ids.product)}`),
        entry.status || 'accepted_done',
        'user-confirmed',
        statusFreshness(entry.status),
        ['output'],
        ['intent-view', 'evidence-acceptance-view'],
      ),
    ),
    ...changes.map((entry) =>
      node(
        entry.id,
        'change',
        sliceArtifact(profile, 'changeTree'),
        textField(entry, 'summary', entry.title || entry.id),
        entry.status || 'impact_analyzed',
        'inferred',
        statusFreshness(entry.status),
        ['context'],
        ['impact-view'],
      ),
    ),
    ...impacts.map((entry) =>
      node(
        entry.id,
        'finding',
        sliceArtifact(profile, 'impactTree'),
        textField(entry, 'reason', entry.title || entry.id),
        entry.status || 'analyzed',
        'inferred',
        statusFreshness(entry.status),
        ['context'],
        ['impact-view'],
      ),
    ),
    ...cycles.map((entry) =>
      node(
        entry.id,
        'task',
        sliceArtifact(profile, 'cycleTree'),
        String(entry.goal || entry.title || entry.id),
        entry.status || 'accepted',
        'inferred',
        statusFreshness(entry.status),
        ['required'],
        ['scope-execution-view'],
      ),
    ),
    node(
      profile.ids.nodeExecutionContract,
      'document',
      sliceArtifact(profile, 'cycleContract'),
      'Cycle Contract for add-todo golden run',
      'present',
      'inferred',
      'fresh',
      ['required', 'guard'],
      ['scope-execution-view'],
    ),
    node(
      'WG-TODO-1',
      'document',
      sliceArtifact(profile, 'workGraph'),
      'Todo App WorkGraph compatibility view',
      'present',
      'inferred',
      'fresh',
      ['context'],
      ['structure-view', 'scope-execution-view'],
    ),
    ...workGraphNodes.map((entry) =>
      node(
        `WG-NODE-${entry.id}`,
        'task',
        sliceArtifact(profile, 'workGraph'),
        entry.title || entry.id,
        String(entry.scopeClass || 'selected'),
        'inferred',
        'fresh',
        ['context'],
        ['structure-view', 'scope-execution-view'],
      ),
    ),
    node(
      'DOC-SOURCE-OF-TRUTH-MATRIX',
      'document',
      sliceArtifact(profile, 'sourceOfTruthMatrix'),
      'Todo App source-of-truth matrix',
      'present',
      'inferred',
      'fresh',
      ['guard'],
      ['scope-execution-view'],
    ),
    node(
      'LOG-TODO-ADD-EVIDENCE',
      'log',
      sliceArtifact(profile, 'evidenceOutput'),
      'Attached todo-add test output',
      'present',
      'tool-confirmed',
      'fresh',
      ['output'],
      ['verification-view', 'evidence-acceptance-view'],
    ),
    node(
      profile.ids.viewInstance,
      'view-instance',
      sliceArtifact(profile, 'generatedReadModel'),
      'Todo App structure-only 7 Core View projection',
      'generated_present',
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
    node(
      'FIND-STRUCTURE-ONLY-LIMITATION',
      'finding',
      'docs/concept/multi-slice-read-model-validation-design.md',
      'Structure-only profile is not parity-backed, pilot-marker-backed, or CI-backed',
      'retained_limitation',
      'inferred',
      'fresh',
      ['context'],
      ['evidence-acceptance-view'],
    ),
    node(
      'FIND-NO-RUNTIME-FIXTURE',
      'finding',
      sliceArtifact(profile, 'evidenceOutput'),
      'Attached evidence exists, but no runnable runtime fixture is required for structure-only validation',
      'structure_only_limitation',
      'inferred',
      'fresh',
      ['context'],
      ['verification-view', 'evidence-acceptance-view'],
    ),
  ]
}

function buildEdges(data: Record<string, unknown>, profile: SliceReadModelConfig): GraphEdge[] {
  if (profile.sourceLayout === 'canonical-pbe') {
    return buildCanonicalPbeStructureEdges(data, profile)
  }
  return buildTodoSearchEdges(profile)
}

function buildCanonicalPbeStructureEdges(data: Record<string, unknown>, profile: SliceReadModelConfig): GraphEdge[] {
  const productNodes = getArray<TreeNode>(data.productTree, 'nodes')
  const workNodes = getArray<TreeNode>(data.workTree, 'nodes')
  const testNodes = getArray<TreeNode>(data.testTree, 'nodes')
  const evidenceRecords = getArray<TreeNode>(data.evidenceTree, 'evidence')
  const acceptanceBranches = getArray<TreeNode>(data.acceptanceTree, 'branches')
  const changes = getArray<TreeNode>(data.changeTree, 'changes')
  const impacts = getArray<TreeNode>(data.impactTree, 'impacts')
  const cycles = getArray<TreeNode>(data.cycleTree, 'cycles')
  const edges: GraphEdge[] = []
  for (const productNode of productNodes) {
    for (const child of stringArray(productNode.children)) {
      edges.push(
        edge(
          `E-${productNode.id}-TARGETS-${child}`,
          productNode.id,
          child,
          'targets',
          sliceArtifact(profile, 'productTree'),
          'user-confirmed',
        ),
      )
    }
    for (const projectId of stringArray(productNode.derivedTo).filter((entry) => entry.startsWith('PJ-'))) {
      edges.push(
        edge(
          `E-${productNode.id}-TARGETS-${projectId}`,
          productNode.id,
          projectId,
          'targets',
          sliceArtifact(profile, 'productTree'),
          'inferred',
        ),
      )
    }
    for (const workId of stringArray(productNode.derivedTo).filter((entry) => entry.startsWith('WT-'))) {
      edges.push(
        edge(
          `E-${productNode.id}-TARGETS-${workId}`,
          productNode.id,
          workId,
          'targets',
          sliceArtifact(profile, 'productTree'),
          'inferred',
        ),
      )
    }
    for (const testId of stringArray(productNode.derivedTo).filter((entry) => entry.startsWith('TT-'))) {
      edges.push(
        edge(
          `E-${productNode.id}-REQUIRES-${testId}`,
          productNode.id,
          testId,
          'requires',
          sliceArtifact(profile, 'productTree'),
          'inferred',
        ),
      )
    }
    for (const criterion of productNode.acceptanceCriteria || []) {
      edges.push(
        edge(
          `E-${productNode.id}-REQUIRES-${criterion.id}`,
          productNode.id,
          criterion.id,
          'requires',
          sliceArtifact(profile, 'productTree'),
          'user-confirmed',
        ),
      )
    }
  }
  for (const workNode of workNodes) {
    for (const productId of stringArray(workNode.derivedFromProductNodeIds)) {
      edges.push(
        edge(
          `E-${workNode.id}-SATISFIES-${productId}`,
          workNode.id,
          productId,
          'satisfies',
          sliceArtifact(profile, 'workTree'),
          'inferred',
        ),
      )
    }
    for (const projectId of stringArray(workNode.derivedFromProjectNodeIds)) {
      edges.push(
        edge(
          `E-${workNode.id}-TOUCHES-${projectId}`,
          workNode.id,
          projectId,
          'touches',
          sliceArtifact(profile, 'workTree'),
          'inferred',
        ),
      )
    }
    for (const criterionId of stringArray(workNode.satisfiesAcceptanceCriteriaIds)) {
      edges.push(
        edge(
          `E-${workNode.id}-SATISFIES-${criterionId}`,
          workNode.id,
          criterionId,
          'satisfies',
          sliceArtifact(profile, 'workTree'),
          'inferred',
        ),
      )
    }
  }
  for (const testNode of testNodes) {
    for (const productId of stringArray(testNode.verifiesProductNodeIds)) {
      edges.push(
        edge(
          `E-${testNode.id}-VERIFIES-${productId}`,
          testNode.id,
          productId,
          'verifies',
          sliceArtifact(profile, 'testTree'),
          'tool-confirmed',
        ),
      )
    }
    for (const workId of stringArray(testNode.verifiesWorkNodeIds)) {
      edges.push(
        edge(
          `E-${testNode.id}-VERIFIES-${workId}`,
          testNode.id,
          workId,
          'verifies',
          sliceArtifact(profile, 'testTree'),
          'tool-confirmed',
        ),
      )
    }
    for (const criterionId of stringArray(testNode.verifiesAcceptanceCriteriaIds)) {
      edges.push(
        edge(
          `E-${testNode.id}-VERIFIES-${criterionId}`,
          testNode.id,
          criterionId,
          'verifies',
          sliceArtifact(profile, 'testTree'),
          'tool-confirmed',
        ),
      )
    }
  }
  for (const evidenceRecord of evidenceRecords) {
    for (const testId of stringArray(evidenceRecord.evidenceForTestNodeIds)) {
      edges.push(
        edge(
          `E-${evidenceRecord.id}-EVIDENCES-${testId}`,
          evidenceRecord.id,
          testId,
          'evidences',
          sliceArtifact(profile, 'evidenceTree'),
          'tool-confirmed',
        ),
      )
    }
    for (const criterionId of stringArray(evidenceRecord.evidenceForAcceptanceCriteriaIds)) {
      edges.push(
        edge(
          `E-${evidenceRecord.id}-EVIDENCES-${criterionId}`,
          evidenceRecord.id,
          criterionId,
          'evidences',
          sliceArtifact(profile, 'evidenceTree'),
          'tool-confirmed',
        ),
      )
    }
    edges.push(
      edge(
        `E-LOG-EVIDENCES-${evidenceRecord.id}`,
        'LOG-TODO-ADD-EVIDENCE',
        evidenceRecord.id,
        'evidences',
        sliceArtifact(profile, 'evidenceOutput'),
        'tool-confirmed',
      ),
    )
  }
  for (const branch of acceptanceBranches) {
    const acceptanceId = `ACCEPT-${String(branch.productNodeId || profile.ids.product)}`
    if (branch.productNodeId) {
      edges.push(
        edge(
          `E-${acceptanceId}-APPROVES-${String(branch.productNodeId)}`,
          acceptanceId,
          String(branch.productNodeId),
          'approves',
          sliceArtifact(profile, 'acceptanceTree'),
          'user-confirmed',
        ),
      )
    }
    for (const evidenceId of stringArray(branch.evidenceNodeIds)) {
      edges.push(
        edge(
          `E-${acceptanceId}-APPROVES-${evidenceId}`,
          acceptanceId,
          evidenceId,
          'approves',
          sliceArtifact(profile, 'acceptanceTree'),
          'user-confirmed',
        ),
      )
    }
  }
  for (const change of changes) {
    for (const workId of stringArray(change.affectedWorkNodeIds)) {
      edges.push(
        edge(
          `E-${change.id}-TOUCHES-${workId}`,
          change.id,
          workId,
          'touches',
          sliceArtifact(profile, 'changeTree'),
          'inferred',
        ),
      )
    }
    for (const testId of stringArray(change.affectedTestNodeIds)) {
      edges.push(
        edge(
          `E-${change.id}-PRESERVES-${testId}`,
          change.id,
          testId,
          'preserves',
          sliceArtifact(profile, 'changeTree'),
          'inferred',
        ),
      )
    }
    for (const evidenceId of stringArray(change.affectedEvidenceNodeIds)) {
      edges.push(
        edge(
          `E-${change.id}-PRESERVES-${evidenceId}`,
          change.id,
          evidenceId,
          'preserves',
          sliceArtifact(profile, 'changeTree'),
          'inferred',
        ),
      )
    }
  }
  for (const impact of impacts) {
    if (impact.changeId) {
      edges.push(
        edge(
          `E-${impact.id}-REPORTS-ON-${String(impact.changeId)}`,
          impact.id,
          String(impact.changeId),
          'reports-on',
          sliceArtifact(profile, 'impactTree'),
          'inferred',
        ),
      )
    }
    if (impact.affectedNodeId) {
      edges.push(
        edge(
          `E-${impact.id}-REPORTS-ON-${String(impact.affectedNodeId)}`,
          impact.id,
          String(impact.affectedNodeId),
          'reports-on',
          sliceArtifact(profile, 'impactTree'),
          'inferred',
        ),
      )
    }
  }
  for (const cycle of cycles) {
    for (const workId of stringArray(cycle.includedWorkNodeIds)) {
      edges.push(
        edge(
          `E-${cycle.id}-REQUIRES-${workId}`,
          cycle.id,
          workId,
          'requires',
          sliceArtifact(profile, 'cycleTree'),
          'inferred',
        ),
      )
    }
    for (const testId of stringArray(cycle.includedTestNodeIds)) {
      edges.push(
        edge(
          `E-${cycle.id}-REQUIRES-${testId}`,
          cycle.id,
          testId,
          'requires',
          sliceArtifact(profile, 'cycleTree'),
          'inferred',
        ),
      )
    }
    for (const evidenceId of stringArray(cycle.requiredEvidence)) {
      edges.push(
        edge(
          `E-${cycle.id}-REQUIRES-${evidenceId}`,
          cycle.id,
          evidenceId,
          'requires',
          sliceArtifact(profile, 'cycleTree'),
          'inferred',
        ),
      )
    }
  }
  edges.push(
    edge(
      'E-CYCLE-CONTRACT-REPORTS-ON-CY-1',
      profile.ids.nodeExecutionContract,
      profile.ids.cycleContract,
      'reports-on',
      sliceArtifact(profile, 'cycleContract'),
      'inferred',
    ),
  )
  edges.push(
    edge(
      'E-WORKGRAPH-DERIVES-WT-1',
      'WG-TODO-1',
      profile.ids.work,
      'derives-view',
      sliceArtifact(profile, 'workGraph'),
      'inferred',
    ),
  )
  edges.push(
    edge(
      'E-SOT-PRESERVES-SOURCE-BOUNDARY',
      'DOC-SOURCE-OF-TRUTH-MATRIX',
      profile.ids.product,
      'preserves',
      sliceArtifact(profile, 'sourceOfTruthMatrix'),
      'inferred',
    ),
  )
  edges.push(
    edge(
      'E-VIEW-DERIVES-PT-1',
      profile.ids.viewInstance,
      profile.ids.product,
      'derives-view',
      sliceArtifact(profile, 'generatedReadModel'),
      'inferred',
    ),
  )
  edges.push(
    edge(
      'E-VIEW-DERIVES-WT-1',
      profile.ids.viewInstance,
      profile.ids.work,
      'derives-view',
      sliceArtifact(profile, 'generatedReadModel'),
      'inferred',
    ),
  )
  edges.push(
    edge(
      'E-VIEW-DERIVES-TT-1',
      profile.ids.viewInstance,
      'TT-1',
      'derives-view',
      sliceArtifact(profile, 'generatedReadModel'),
      'inferred',
    ),
  )
  edges.push(
    edge(
      'E-FIND-STRUCTURE-ONLY-REPORTS-ON-VIEW',
      'FIND-STRUCTURE-ONLY-LIMITATION',
      profile.ids.viewInstance,
      'reports-on',
      'docs/concept/multi-slice-read-model-validation-design.md',
      'inferred',
    ),
  )
  edges.push(
    edge(
      'E-FIND-NO-RUNTIME-REPORTS-ON-EV',
      'FIND-NO-RUNTIME-FIXTURE',
      'EV-1',
      'reports-on',
      sliceArtifact(profile, 'evidenceOutput'),
      'inferred',
    ),
  )
  return edges
}

function buildTodoSearchEdges(profile: SliceReadModelConfig): GraphEdge[] {
  return [
    edge(
      'E-TASK-TARGETS-REQ',
      'TASK-TODO-SEARCH-PILOT',
      profile.ids.product,
      'targets',
      sliceArtifact(profile, 'limitedPilotTransitionRecord'),
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
      sliceArtifact(profile, 'generatedEvidenceRequirement'),
      'tool-confirmed',
    ),
    edge(
      'E-FIND-ACEP-REPORTS-ON-CCN',
      'FIND-ACEP-CLEANUP-DEFERRED',
      'CCN-ACEP-TASK-CARD-AUTHORITY-001',
      'reports-on',
      sliceArtifact(profile, 'compatibilityControlNode'),
      'inferred',
      'unknown',
    ),
    edge(
      'E-CCN-REPORTS-ON-PACKAGE',
      'CCN-ACEP-TASK-CARD-AUTHORITY-001',
      'DOC-LIMITED-PILOT-PACKAGE',
      'reports-on',
      sliceArtifact(profile, 'compatibilityControlNode'),
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
      sliceArtifact(profile, 'scopedPilotExecutionRecord'),
      'user-confirmed',
    ),
  ]
}

function buildCoreViewCoverage(profile: SliceReadModelConfig): CoreViewCoverage[] {
  if (profile.sourceLayout === 'canonical-pbe') {
    return buildCanonicalPbeStructureCoreViewCoverage(profile)
  }
  return buildTodoSearchCoreViewCoverage(profile)
}

function buildCanonicalPbeStructureCoreViewCoverage(profile: SliceReadModelConfig): CoreViewCoverage[] {
  return [
    view(
      'intent-view',
      'Intent View',
      ['PT-ROOT', profile.ids.product, 'AC-PT-1-1', profile.ids.acceptanceRoot],
      [
        `E-PT-ROOT-TARGETS-${profile.ids.product}`,
        `E-${profile.ids.product}-REQUIRES-AC-PT-1-1`,
        `E-${profile.ids.acceptanceRoot}-APPROVES-${profile.ids.product}`,
      ],
      ['target', 'required', 'output'],
      'Shows the accepted add-todo product meaning and user-controlled acceptance.',
    ),
    view(
      'behavior-view',
      'Behavior View',
      [profile.ids.product, 'AC-PT-1-1', profile.ids.work, 'TT-1'],
      [
        `E-${profile.ids.work}-SATISFIES-${profile.ids.product}`,
        `E-${profile.ids.work}-SATISFIES-AC-PT-1-1`,
        'E-TT-1-VERIFIES-AC-PT-1-1',
      ],
      ['target', 'required'],
      'Shows add-todo behavior through requirement, work, and acceptance-check structure.',
    ),
    view(
      'structure-view',
      'Structure View',
      ['PJ-ROOT', 'PJ-1', 'WG-TODO-1', 'WG-NODE-WT-1', 'DOC-SOURCE-OF-TRUTH-MATRIX'],
      ['E-WT-1-TOUCHES-PJ-1', 'E-WORKGRAPH-DERIVES-WT-1', 'E-SOT-PRESERVES-SOURCE-BOUNDARY'],
      ['context'],
      'Shows canonical .pbe project/workgraph/source-of-truth structure.',
    ),
    view(
      'scope-execution-view',
      'Scope / Execution View',
      ['WT-ROOT', profile.ids.work, profile.ids.cycleContract, profile.ids.nodeExecutionContract, 'WG-TODO-1'],
      [
        `E-${profile.ids.cycleContract}-REQUIRES-${profile.ids.work}`,
        `E-${profile.ids.cycleContract}-REQUIRES-TT-1`,
        'E-CYCLE-CONTRACT-REPORTS-ON-CY-1',
      ],
      ['target', 'required', 'guard'],
      'Shows selected Work/Test/Evidence scope without creating a source-authority pilot marker.',
    ),
    view(
      'impact-view',
      'Impact View',
      ['CH-001', 'IM-001', profile.ids.work, 'TT-1', 'EV-1'],
      ['E-CH-001-TOUCHES-WT-1', 'E-IM-001-REPORTS-ON-CH-001', 'E-IM-001-REPORTS-ON-WT-1'],
      ['context'],
      'Shows analyzed non-blocking change/impact skeleton from the fixture.',
    ),
    view(
      'verification-view',
      'Verification View',
      ['TT-ROOT', 'TT-1', 'EV-1', 'LOG-TODO-ADD-EVIDENCE', 'FIND-NO-RUNTIME-FIXTURE'],
      ['E-TT-1-VERIFIES-PT-1', 'E-TT-1-VERIFIES-WT-1', 'E-EV-1-EVIDENCES-TT-1', 'E-LOG-EVIDENCES-EV-1'],
      ['required', 'output', 'context'],
      'Shows Check/Evidence mapping and the structure-only no-runtime-fixture limitation.',
    ),
    view(
      'evidence-acceptance-view',
      'Evidence / Acceptance View',
      ['EV-1', 'LOG-TODO-ADD-EVIDENCE', profile.ids.acceptanceRoot, 'FIND-STRUCTURE-ONLY-LIMITATION'],
      [
        'E-EV-1-EVIDENCES-AC-PT-1-1',
        `E-${profile.ids.acceptanceRoot}-APPROVES-EV-1`,
        'E-FIND-STRUCTURE-ONLY-REPORTS-ON-VIEW',
      ],
      ['output', 'context'],
      'Shows attached evidence, accepted branch, and non-promotion structure-only boundary.',
    ),
  ]
}

function buildTodoSearchCoreViewCoverage(profile: SliceReadModelConfig): CoreViewCoverage[] {
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
  parity: ParityReport | undefined,
  manifest: Record<string, unknown>,
  marker: Record<string, unknown> | undefined,
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
  const fallbackReferenceStatus = buildFallbackReferenceStatus(root, marker, generated)
  const parityRequirement = validationParityRequirement(slice, profile, parity)
  const pilotMarkerRequirement = validationPilotMarkerRequirement(slice, profile, marker)
  const runtimeFixtureRequirement = validationRuntimeFixtureRequirement(root, profile)
  const expectedCounts = {
    nodes: profile.expectedCounts.nodes,
    edges: profile.expectedCounts.edges,
    validationChecks: profile.expectedCounts.validationChecks,
  }
  return {
    version: '0.1.0-read-model-validation-report',
    metadata: {
      validatedAt: new Date().toISOString(),
      commandIdentity,
      sourceCommit: resolveSourceCommit(root),
      sourceSlice: slice,
      profileId: profile.profileId,
      sliceProfile: profile.profileId,
      sourceLayout: profile.sourceLayout,
      policyLevel: profile.policyLevel,
      evidenceLevel: 'validator-backed',
      scopeLevel: 'scoped-slice-validation',
      expectedCounts,
      generatedReadModel: `${slice}/generated/generated-read-model.json`,
      parityRequirement,
      parityReport: parityRequirement.path,
      evidenceManifest: `${slice}/generated/read-model-evidence-manifest.json`,
      pilotMarkerRequirement,
      pilotMarker: pilotMarkerRequirement.path,
      runtimeFixtureRequirement,
      retainedWarningCount: generated.retainedWarnings.length,
      fallbackReferenceCount: fallbackReferenceStatus.length,
    },
    status,
    evidenceLevel: 'validator-backed',
    scopeLevel: 'scoped-slice-validation',
    sourceAuthorityBoundary: validationBoundaryForProfile(profile),
    nonPromotionStatement: validationNonPromotionStatementForProfile(profile),
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
    fallbackReferenceStatus,
    sliceValidationContract: {
      version: '0.1.0-per-slice-validation-report-independence',
      reportUnit: 'per-slice-validation-report',
      sourceSlice: slice,
      profileId: profile.profileId,
      sourceLayout: profile.sourceLayout,
      policyLevel: profile.policyLevel,
      evidenceLevel: 'validator-backed',
      scopeLevel: 'scoped-slice-validation',
      expectedCounts,
      generatedReadModel: {
        path: `${slice}/generated/generated-read-model.json`,
        status: generated.version ? 'present' : 'missing',
        nodeCount: generated.nodes.length,
        edgeCount: generated.edges.length,
      },
      parityRequirement,
      pilotMarkerRequirement,
      runtimeFixtureRequirement,
      retainedWarnings: generated.retainedWarnings,
      fallbackReferenceSummary: {
        count: fallbackReferenceStatus.length,
        missingCount: fallbackReferenceStatus.filter((entry) => entry.status === 'missing').length,
      },
      sourceAuthorityBoundary: validationBoundaryForProfile(profile),
      nonPromotionStatement: validationNonPromotionStatementForProfile(profile),
      crossSliceDependencyRule:
        'Validation uses the target slice profile, generated artifacts, and declared source inputs only. It must not depend on another slice generated directory, manual parity artifact, pilot marker, or runtime fixture unless that artifact is declared by this profile.',
    },
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
  parity: ParityReport | undefined,
  manifest: Record<string, unknown>,
  marker: Record<string, unknown> | undefined,
): ValidationCheck[] {
  if (profile.policyLevel === 'structure-only') {
    return buildStructureOnlyValidationChecks(root, slice, profile, generated, manifest)
  }
  if (!parity) {
    throw new Error(`Profile ${profile.profileId} requires parity report validation input.`)
  }
  const outputPrefix = `${slice}/generated`
  const sourceInputs = generated.sourceInputs || []
  const markerScope = marker ? getPath(marker, ['pilotScope', 'primary']) : undefined
  const activeObservationScope = marker ? getPath(marker, ['activeObservation', 'scope']) : undefined
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
      Boolean(marker?.version && marker.status),
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
        /does not promote|does not change source authority/i.test(String(marker?.nonPromotionStatement || '')),
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'retained-warnings-visible',
      'Retained warnings are visible',
      Array.isArray(generated.retainedWarnings) &&
        generated.retainedWarnings.length >= 4 &&
        Array.isArray(marker?.retainedWarnings) &&
        (marker?.retainedWarnings?.length ?? 0) >= 4,
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
        `${generated.sourceAuthorityBoundary} ${generated.nonPromotionStatement} ${marker?.nonPromotionStatement || ''}`,
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
        String(marker ? getPath(marker, ['pilotScope', 'supplementalWarningOnly']) : undefined) ===
          profile.artifacts.compatibilitySlice,
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

function validationParityRequirement(
  slice: string,
  profile: SliceReadModelConfig,
  parity: ParityReport | undefined,
): Record<string, unknown> {
  if (profile.policyLevel !== 'pilot-marker-backed') {
    return {
      required: false,
      status: 'not-required',
      path: 'not-required-for-structure-only',
      reason: 'Structure-only validation does not require generated/manual parity.',
    }
  }
  return {
    required: true,
    status: parity?.summary.status === 'comparison-pass' ? 'pass' : 'missing-or-not-pass',
    path: `${slice}/generated/read-model-parity-report.json`,
    parityStatus: parity?.summary.status || 'missing',
    mismatchCount: parity?.summary.mismatchCount ?? 'unknown',
    blockingCount: parity?.summary.blockingCount ?? 'unknown',
    decisionRequiredCount: parity?.summary.decisionRequiredCount ?? 'unknown',
  }
}

function validationPilotMarkerRequirement(
  slice: string,
  profile: SliceReadModelConfig,
  marker: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (profile.policyLevel !== 'pilot-marker-backed') {
    return {
      required: false,
      status: 'not-required',
      path: 'not-required-for-structure-only',
      reason: 'Structure-only validation does not require a scoped source-authority pilot marker.',
    }
  }
  return {
    required: true,
    status: marker ? 'present' : 'missing',
    path: `${slice}/generated/scoped-source-authority-pilot-marker.json`,
    markerStatus: marker ? getPath(marker, ['status']) || 'present' : 'missing',
    primaryScope: marker ? getPath(marker, ['pilotScope', 'primary']) || 'unknown' : 'missing',
  }
}

function validationRuntimeFixtureRequirement(root: string, profile: SliceReadModelConfig): Record<string, unknown> {
  if (profile.policyLevel === 'structure-only') {
    const evidencePath = profile.artifacts.evidenceOutput ? sliceArtifact(profile, 'evidenceOutput') : undefined
    return {
      required: false,
      status: evidencePath && existsSync(path.resolve(root, evidencePath)) ? 'attached-evidence-only' : 'not-required',
      path: evidencePath || 'not-required-for-structure-only',
      reason:
        'Structure-only validation does not require a runnable runtime fixture; attached evidence text may be referenced when present.',
    }
  }
  const helperPath = profile.artifacts.runtimeHelper ? sliceArtifact(profile, 'runtimeHelper') : undefined
  const testPath = profile.artifacts.runtimeTest ? sliceArtifact(profile, 'runtimeTest') : undefined
  const helperPresent = helperPath ? existsSync(path.resolve(root, helperPath)) : false
  const testPresent = testPath ? existsSync(path.resolve(root, testPath)) : false
  return {
    required: true,
    status: helperPresent && testPresent ? 'present' : 'missing',
    helperPath: helperPath || 'missing',
    helperStatus: helperPresent ? 'present' : 'missing',
    testPath: testPath || 'missing',
    testStatus: testPresent ? 'present' : 'missing',
  }
}

function buildStructureOnlyValidationChecks(
  root: string,
  slice: string,
  profile: SliceReadModelConfig,
  generated: GeneratedReadModel,
  manifest: Record<string, unknown>,
): ValidationCheck[] {
  const outputPrefix = `${slice}/generated`
  const sourceInputs = generated.sourceInputs || []
  return [
    check(
      'generated-read-model-exists',
      'Generated read-model exists and parses',
      Boolean(generated.version && Array.isArray(generated.nodes) && Array.isArray(generated.edges)),
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'evidence-manifest-exists',
      'Evidence manifest exists and parses',
      Boolean(manifest.version && manifest.sourceInputs),
      'blocking',
      `${outputPrefix}/read-model-evidence-manifest.json`,
    ),
    check(
      'source-input-artifacts-present',
      'Canonical .pbe source input artifacts exist',
      sourceInputs.length > 0 && sourceInputs.every((entry) => entry.status === 'present'),
      'blocking',
      'generated sourceInputs',
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
      '7 Core View coverage is present for structure-only validation',
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
      'Check/Evidence mapping is present where source inputs support it',
      Array.isArray(generated.checkEvidenceMapping) && generated.checkEvidenceMapping.length > 0,
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'source-authority-boundary-bounded',
      'Source authority boundary is present and bounded',
      /current operational source/i.test(generated.sourceAuthorityBoundary) &&
        String(generated.metadata.sourceSlice || '') === slice &&
        String(generated.metadata.sliceProfile || '') === profile.profileId,
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'non-promotion-statement-present',
      'Non-promotion statement is present',
      /does not promote|cannot change source authority|does not change source authority/i.test(
        generated.nonPromotionStatement,
      ),
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'retained-limitations-visible',
      'Structure-only limitations are visible',
      Array.isArray(generated.retainedWarnings) &&
        generated.retainedWarnings.some((entry) => entry.id === 'RW-STRUCTURE-ONLY'),
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'fallback-reference-artifacts-present',
      'Fallback/reference source artifacts are present',
      buildFallbackReferenceStatus(root, undefined, generated).every((entry) => entry.status === 'present'),
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'user-acceptance-authority-preserved',
      'User acceptance authority is not replaced by Codex/PBE',
      !/codex\/pbe self-acceptance|replace user acceptance/i.test(
        `${generated.sourceAuthorityBoundary} ${generated.nonPromotionStatement}`,
      ) &&
        generated.nodes.some(
          (entry) => entry.id === profile.ids.acceptanceRoot && entry.confidence === 'user-confirmed',
        ),
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'supplemental-compatibility-not-source-scope',
      'Supplemental compatibility slice is not source scope for structure-only validation',
      generated.compatibilityWarnings.length === 0,
      'blocking',
      `${outputPrefix}/generated-read-model.json`,
    ),
    check(
      'no-repo-wide-promotion-or-retirement',
      'No statement implies repo-wide promotion or tree-native retirement',
      noRepoWidePromotionOrRetirement(generated),
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

function buildFallbackReferenceStatus(
  root: string,
  marker: Record<string, unknown> | undefined,
  generated?: GeneratedReadModel,
): Array<Record<string, unknown>> {
  const fallbackReferences = marker ? getPath(marker, ['pilotAuthority', 'fallbackReference']) : undefined
  const paths = Array.isArray(fallbackReferences)
    ? fallbackReferences.map(String)
    : generated
      ? generated.sourceInputs.map((entry) => entry.relativePath)
      : []
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

function noRepoWidePromotionOrRetirement(model: GeneratedReadModel, marker?: Record<string, unknown>): boolean {
  const text = JSON.stringify({
    generatedBoundary: model.sourceAuthorityBoundary,
    generatedNonPromotion: model.nonPromotionStatement,
    markerStatus: marker?.status,
    markerNonPromotion: marker?.nonPromotionStatement,
    activeObservation: marker?.activeObservation,
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

function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function arrayValue(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? (value.filter((entry) => typeof entry === 'object' && entry !== null) as Array<Record<string, unknown>>)
    : []
}

function stringValue(value: unknown, fallback = 'unknown'): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
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
- Profile id: \`${String(report.metadata.profileId || report.metadata.sliceProfile)}\`
- Source layout: ${String(report.metadata.sourceLayout)}
- Policy level: ${String(report.metadata.policyLevel)}
- Scope level: ${report.scopeLevel}

## Boundary

${report.sourceAuthorityBoundary}

${report.nonPromotionStatement}

## Per-Slice Independence Contract

- Report unit: ${String(getPath(report.sliceValidationContract || {}, ['reportUnit']) || 'per-slice-validation-report')}
- Expected nodes: ${String(getPath(report.sliceValidationContract || {}, ['expectedCounts', 'nodes']) || 'unknown')}
- Expected edges: ${String(getPath(report.sliceValidationContract || {}, ['expectedCounts', 'edges']) || 'unknown')}
- Expected validation checks: ${String(getPath(report.sliceValidationContract || {}, ['expectedCounts', 'validationChecks']) || 'unknown')}
- Generated read-model: ${String(getPath(report.sliceValidationContract || {}, ['generatedReadModel', 'path']) || report.metadata.generatedReadModel)}
- Parity requirement: ${String(getPath(report.sliceValidationContract || {}, ['parityRequirement', 'status']) || 'unknown')} (${String(getPath(report.sliceValidationContract || {}, ['parityRequirement', 'path']) || 'unknown')})
- Pilot marker requirement: ${String(getPath(report.sliceValidationContract || {}, ['pilotMarkerRequirement', 'status']) || 'unknown')} (${String(getPath(report.sliceValidationContract || {}, ['pilotMarkerRequirement', 'path']) || 'unknown')})
- Runtime fixture requirement: ${String(getPath(report.sliceValidationContract || {}, ['runtimeFixtureRequirement', 'status']) || 'unknown')}
- Fallback/reference count: ${String(getPath(report.sliceValidationContract || {}, ['fallbackReferenceSummary', 'count']) || report.fallbackReferenceStatus.length)}
- Missing fallback/reference count: ${String(getPath(report.sliceValidationContract || {}, ['fallbackReferenceSummary', 'missingCount']) || 0)}

${String(getPath(report.sliceValidationContract || {}, ['crossSliceDependencyRule']) || '')}

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

function renderAggregateSummaryMarkdown(summary: AggregateReadModelSummary): string {
  return `# Read-Model Aggregate Summary

Status: ${summary.status}

## Run Identity

- Summarized at: ${String(summary.metadata.summarizedAt)}
- Command identity: \`${String(summary.metadata.commandIdentity)}\`
- Source commit: ${String(summary.metadata.sourceCommit)}
- Source mode: ${String(summary.metadata.sourceMode)}
- Input reports: ${Array.isArray(summary.metadata.inputReportList) ? summary.metadata.inputReportList.map((entry) => `\`${String(entry)}\``).join(', ') : 'unknown'}

## Boundary

${summary.aggregateBoundary}

${summary.nonPromotionStatement}

## Decision Rule

${summary.decisionRule.map((entry) => `- ${entry}`).join('\n')}

## Aggregate Counts

- Included slices: ${summary.summary.sliceCount}
- Present reports: ${summary.summary.presentReportCount}
- Missing reports: ${summary.summary.missingReportCount}
- Malformed reports: ${summary.summary.malformedReportCount}
- Validation-pass slices: ${summary.summary.validationPassCount}
- Warnings: ${summary.summary.warningCount}
- Blocking: ${summary.summary.blockingCount}
- Decision required: ${summary.summary.decisionRequiredCount}
- Retained warnings / accepted limitations: ${summary.summary.retainedWarningCount}

## Per-Slice Summary

| Slice | Profile | Policy | Layout | Validation | Checks | Warnings | Blocking | Decision Required | Parity | Pilot Marker | Runtime Fixture |
| ----- | ------- | ------ | ------ | ---------- | ------ | -------- | -------- | ----------------- | ------ | ------------ | --------------- |
${summary.perSliceSummaries
  .map(
    (entry) =>
      `| \`${entry.sourceSlice}\` | \`${entry.profileId}\` | ${entry.policyLevel} | ${entry.sourceLayout} | ${entry.validationStatus} | ${entry.checkCount} | ${entry.warningCount} | ${entry.blockingCount} | ${entry.decisionRequiredCount} | ${String(entry.parityRequirement.status || 'unknown')} | ${String(entry.pilotMarkerRequirement.status || 'unknown')} | ${String(entry.runtimeFixtureRequirement.status || 'unknown')} |`,
  )
  .join('\n')}

## Source Authority / Non-Promotion Boundary By Slice

${summary.perSliceSummaries
  .map(
    (entry) => `### ${entry.sourceSlice}

- Source authority boundary: ${entry.sourceAuthorityBoundary}
- Non-promotion statement: ${entry.nonPromotionStatement}
- Report status: ${entry.reportStatus}
- Report path: \`${entry.reportPath}\`
- Retained warnings / accepted limitations:
${entry.acceptedLimitations.map((warning) => `  - ${String(warning.id)}: ${String(warning.status)} - ${String(warning.summary)}`).join('\n') || '  - none recorded'}
- Notes:
${entry.notes.map((note) => `  - ${note}`).join('\n')}
`,
  )
  .join('\n')}

## Recommended Next Decision Surface

${summary.recommendedNextDecisionSurface.map((entry) => `- ${entry}`).join('\n')}
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
  const artifact = profile.artifacts[artifactKey]
  if (!artifact) {
    throw new Error(`Profile ${profile.profileId} does not define artifact ${String(artifactKey)}`)
  }
  return isSliceRelativeArtifact(artifact) ? `${profile.supportedSlice}/${artifact}` : artifact
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

async function readOptionalJson<T>(filePath: string | undefined, fallback: T): Promise<T> {
  if (!filePath) {
    return fallback
  }
  const parsed = await readJsonSafe<T>(filePath)
  return parsed.ok ? parsed.value : fallback
}

async function readOptionalText(filePath: string | undefined): Promise<string> {
  if (!filePath) {
    return ''
  }
  const parsed = await readTextSafe(filePath)
  return parsed.ok ? parsed.value : ''
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

function sourceAuthorityBoundaryForProfile(profile: SliceReadModelConfig): string {
  if (profile.policyLevel === 'structure-only') {
    return 'Canonical .pbe tree/control/execution/evidence artifacts remain current operational source for this structure-only fixture.'
  }
  return 'Tree-native selected-slice artifacts remain current operational source.'
}

function nonPromotionStatementForProfile(profile: SliceReadModelConfig): string {
  if (profile.policyLevel === 'structure-only') {
    return 'Generated structure-only output is reviewable Evidence only. It does not change source authority, create a pilot marker, require parity, introduce CI enforcement, retire .pbe artifacts, or approve promotion.'
  }
  return 'Generated output is reviewable Evidence only and cannot change source authority without later explicit user approval.'
}

function validationBoundaryForProfile(profile: SliceReadModelConfig): string {
  if (profile.policyLevel === 'structure-only') {
    return 'Validator-backed Evidence checks structure-only generated read-model outputs for this canonical .pbe fixture. It does not change source authority.'
  }
  return 'Validator-backed Evidence checks the bounded Todo Search read-model outputs only. It does not change source authority.'
}

function validationNonPromotionStatementForProfile(profile: SliceReadModelConfig): string {
  if (profile.policyLevel === 'structure-only') {
    return 'Structure-only validation pass is Evidence only. It does not promote Maintainability Graph, create a source-authority pilot, require parity, introduce CI enforcement, retire .pbe artifacts, or replace user approval.'
  }
  return 'Validation pass is Evidence only. It does not promote Maintainability Graph, expand pilot scope, retire tree-native artifacts, introduce CI enforcement, or replace user approval.'
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

function normalizeReadModelSliceRegistryProfile(
  value: unknown,
  index: number,
  errors: string[],
): ReadModelSliceRegistryProfile | null {
  const prefix = `registry.profiles[${index}]`
  const source = asRecord(value, prefix, errors)
  if (Object.keys(source).length === 0) {
    return null
  }

  const profileId = requiredString(source, 'profileId', errors, prefix)
  const sourceSlice = normalizePath(requiredString(source, 'sourceSlice', errors, prefix))
  const sourceLayout = requiredEnum<SliceReadModelConfig['sourceLayout']>(
    source,
    'sourceLayout',
    ['flat-demo-support', 'canonical-pbe'],
    errors,
    prefix,
  )
  const policyLevel = requiredEnum<SliceReadModelConfig['policyLevel']>(
    source,
    'policyLevel',
    ['pilot-marker-backed', 'structure-only'],
    errors,
    prefix,
  )
  const includedInValidateAll = requiredBoolean(source, 'includedInValidateAll', errors, prefix)
  const requiredCommands = requiredStringEnumArray<RegistryCommand>(
    source,
    'requiredCommands',
    ['generate', 'compare', 'validate'],
    errors,
    prefix,
  )
  const requiredArtifacts = requiredStringRecord(source, 'requiredArtifacts', errors, prefix)
  const optionalArtifacts = optionalStringRecord(source, 'optionalArtifacts', errors, prefix)
  const expectedCounts = requiredExpectedCounts(source, errors, prefix)
  const parityRequirement = requiredPlainRecord(source, 'parityRequirement', errors, prefix)
  const pilotMarkerRequirement = requiredPlainRecord(source, 'pilotMarkerRequirement', errors, prefix)
  const runtimeFixtureRequirement = requiredPlainRecord(source, 'runtimeFixtureRequirement', errors, prefix)
  const retainedWarnings = requiredStringArray(source, 'retainedWarnings', errors, prefix)
  const fallbackReferences = requiredStringArray(source, 'fallbackReferences', errors, prefix)
  const ciInclusion = requiredString(source, 'ciInclusion', errors, prefix)
  const boundarySource = requiredPlainRecord(source, 'boundaryStatements', errors, prefix)
  const boundaryStatements = {
    sourceAuthorityBoundary: requiredString(
      boundarySource,
      'sourceAuthorityBoundary',
      errors,
      `${prefix}.boundaryStatements`,
    ),
    nonPromotionStatement: requiredString(
      boundarySource,
      'nonPromotionStatement',
      errors,
      `${prefix}.boundaryStatements`,
    ),
    userAcceptanceBoundary: requiredString(
      boundarySource,
      'userAcceptanceBoundary',
      errors,
      `${prefix}.boundaryStatements`,
    ),
  }

  return {
    profileId,
    sourceSlice,
    sourceLayout,
    policyLevel,
    includedInValidateAll,
    requiredCommands,
    requiredArtifacts,
    optionalArtifacts,
    expectedCounts,
    parityRequirement,
    pilotMarkerRequirement,
    runtimeFixtureRequirement,
    retainedWarnings,
    fallbackReferences,
    ciInclusion,
    boundaryStatements,
  }
}

function normalizeGraphSourceRecords(value: unknown, errors: string[]): GraphSourceArtifact['sourceRecords'] {
  const records = asRecord(value, 'graphSource.sourceRecords', errors)
  const nodes = requiredRecordArray<GraphNode>(records, 'nodes', errors, 'graphSource.sourceRecords')
  const edges = requiredRecordArray<GraphEdge>(records, 'edges', errors, 'graphSource.sourceRecords')
  const coreViewCoverage = requiredRecordArray<CoreViewCoverage>(
    records,
    'coreViewCoverage',
    errors,
    'graphSource.sourceRecords',
  )

  const nodeIds = new Set<string>()
  for (const [index, node] of nodes.entries()) {
    if (!isString(node.id) || node.id.length === 0) {
      errors.push(`graphSource.sourceRecords.nodes[${index}].id must be a non-empty string`)
    }
    if (!isString(node.nodeKind) || node.nodeKind.length === 0) {
      errors.push(`graphSource.sourceRecords.nodes[${index}].nodeKind must be a non-empty string`)
    }
    nodeIds.add(String(node.id))
  }

  for (const [index, edge] of edges.entries()) {
    if (!isString(edge.id) || edge.id.length === 0) {
      errors.push(`graphSource.sourceRecords.edges[${index}].id must be a non-empty string`)
    }
    if (!isString(edge.from) || !nodeIds.has(edge.from)) {
      errors.push(`graphSource.sourceRecords.edges[${index}].from must reference a source node`)
    }
    if (!isString(edge.to) || !nodeIds.has(edge.to)) {
      errors.push(`graphSource.sourceRecords.edges[${index}].to must reference a source node`)
    }
    if (!isString(edge.edgeType) || edge.edgeType.length === 0) {
      errors.push(`graphSource.sourceRecords.edges[${index}].edgeType must be a non-empty string`)
    }
  }

  const coreViewNamesFound = new Set(coreViewCoverage.map((view) => view.name))
  for (const name of coreViewNames) {
    if (!coreViewNamesFound.has(name)) {
      errors.push(`graphSource.sourceRecords.coreViewCoverage missing ${name}`)
    }
  }

  return { nodes, edges, coreViewCoverage }
}

function normalizeProjectionTargets(value: unknown, errors: string[]): Array<Record<string, string>> {
  if (!Array.isArray(value)) {
    errors.push('graphSource.projectionTargets must be an array')
    return []
  }
  return value.map((entry, index) => {
    const record = asRecord(entry, `graphSource.projectionTargets[${index}]`, errors)
    const output: Record<string, string> = {}
    for (const [key, entryValue] of Object.entries(record)) {
      if (typeof entryValue !== 'string' || entryValue.length === 0) {
        errors.push(`graphSource.projectionTargets[${index}].${key} must be a non-empty string`)
      } else {
        output[key] = normalizePath(entryValue)
      }
    }
    return output
  })
}

function requiredRecordArray<T>(source: Record<string, unknown>, key: string, errors: string[], prefix: string): T[] {
  const value = source[key]
  if (
    !Array.isArray(value) ||
    !value.every((entry) => typeof entry === 'object' && entry !== null && !Array.isArray(entry))
  ) {
    errors.push(`${prefix}.${key} must be an array of objects`)
    return []
  }
  return value as T[]
}

function asRecord(value: unknown, label: string, errors: string[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    errors.push(`${label} must be an object`)
    return {}
  }
  return value as Record<string, unknown>
}

function requiredString(source: Record<string, unknown>, key: string, errors: string[], prefix = 'registry'): string {
  const value = source[key]
  if (typeof value !== 'string' || value.length === 0) {
    errors.push(`${prefix}.${key} must be a non-empty string`)
    return ''
  }
  return value
}

function requiredBoolean(source: Record<string, unknown>, key: string, errors: string[], prefix: string): boolean {
  const value = source[key]
  if (typeof value !== 'boolean') {
    errors.push(`${prefix}.${key} must be a boolean`)
    return false
  }
  return value
}

function requiredEnum<T extends string>(
  source: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  errors: string[],
  prefix: string,
): T {
  const value = source[key]
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    errors.push(`${prefix}.${key} must be one of ${allowed.join(', ')}`)
    return allowed[0]
  }
  return value as T
}

function requiredStringArray(source: Record<string, unknown>, key: string, errors: string[], prefix: string): string[] {
  const value = source[key]
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string' && entry.length > 0)) {
    errors.push(`${prefix}.${key} must be an array of non-empty strings`)
    return []
  }
  return value
}

function requiredStringEnumArray<T extends string>(
  source: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  errors: string[],
  prefix: string,
): T[] {
  const values = requiredStringArray(source, key, errors, prefix)
  const invalid = values.filter((entry) => !allowed.includes(entry as T))
  if (invalid.length > 0) {
    errors.push(`${prefix}.${key} contains unsupported values: ${invalid.join(', ')}`)
  }
  return values.filter((entry) => allowed.includes(entry as T)) as T[]
}

function requiredStringRecord(
  source: Record<string, unknown>,
  key: string,
  errors: string[],
  prefix: string,
): Record<string, string> {
  const value = source[key]
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    errors.push(`${prefix}.${key} must be an object with string values`)
    return {}
  }
  const record = value as Record<string, unknown>
  const output: Record<string, string> = {}
  for (const [entryKey, entryValue] of Object.entries(record)) {
    if (typeof entryValue !== 'string' || entryValue.length === 0) {
      errors.push(`${prefix}.${key}.${entryKey} must be a non-empty string`)
      continue
    }
    output[entryKey] = normalizePath(entryValue)
  }
  return output
}

function optionalStringRecord(
  source: Record<string, unknown>,
  key: string,
  errors: string[],
  prefix: string,
): Record<string, string> {
  if (!(key in source)) {
    return {}
  }
  return requiredStringRecord(source, key, errors, prefix)
}

function requiredPlainRecord(
  source: Record<string, unknown>,
  key: string,
  errors: string[],
  prefix: string,
): Record<string, unknown> {
  const value = source[key]
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    errors.push(`${prefix}.${key} must be an object`)
    return {}
  }
  return value as Record<string, unknown>
}

function requiredExpectedCounts(
  source: Record<string, unknown>,
  errors: string[],
  prefix: string,
): ReadModelSliceRegistryProfile['expectedCounts'] {
  const counts = requiredPlainRecord(source, 'expectedCounts', errors, prefix)
  return {
    nodes: requiredNumber(counts, 'nodes', errors, `${prefix}.expectedCounts`),
    edges: requiredNumber(counts, 'edges', errors, `${prefix}.expectedCounts`),
    validationChecks: requiredNumber(counts, 'validationChecks', errors, `${prefix}.expectedCounts`),
  }
}

function requiredNumber(source: Record<string, unknown>, key: string, errors: string[], prefix: string): number {
  const value = source[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    errors.push(`${prefix}.${key} must be a finite number`)
    return 0
  }
  return value
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function formatList(value: unknown): string {
  return Array.isArray(value) ? value.map(String).join(', ') : String(value || '')
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/\/+$/, '')
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
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
