export enum ExitCode {
  Success = 0,
  ValidationFailed = 1,
  InvalidArguments = 2,
  NotInitialized = 3,
  TransitionBlocked = 4,
  SchemaError = 5,
  InternalError = 6,
}

export type IssueSeverity = 'info' | 'warning' | 'error'
export type TraceabilityStageOption = 'work-planning' | 'verification-design' | 'execution' | 'review' | 'accept'
export type ContextStageOption =
  | 'start'
  | 'product-intake'
  | 'work-planning'
  | 'verification-design'
  | 'execution'
  | 'review'
  | 'revision'
  | 'product-patch'
  | 'parallel'
  | 'documentation'
  | 'docs'
export type CliStageOption = TraceabilityStageOption | ContextStageOption

export interface ValidationIssue {
  validator: string
  code: string
  severity: IssueSeverity
  message: string
  file?: string
  nodeId?: string
  nodeType?: string
  stage?: string
  reason?: string
  suggestedFix?: string
  nextCommand?: string
}

export interface CommandResult {
  ok: boolean
  command: string
  exitCode: ExitCode
  message?: string
  data?: Record<string, unknown>
  issues: ValidationIssue[]
}

export interface CliOptions {
  root: string
  json: boolean
  verbose: boolean
  noColor: boolean
  force: boolean
  apply: boolean
  dryRun: boolean
  all: boolean
  workingTree: boolean
  staged: boolean
  untracked: boolean
  profile?: 'full' | 'lite' | 'bypass'
  brief?: string
  maxChars?: number
  text?: string
  transition?: string
  files?: string[]
  stage?: CliStageOption
  summary?: string
  title?: string
  runId?: string
  source?: string
  change?: string
  patch?: string
  operation?: string
  product?: string[]
  work?: string[]
  test?: string[]
  evidence?: string[]
  acceptance?: string[]
  slice?: string
  slices?: string
  generated?: string
  readModel?: string
  graphSource?: string
  projectMemory?: string
  directionChange?: string
  record?: string
  instructionPack?: string
  graphDelta?: string
  targetRepo?: string
  manual?: string
  output?: string
  dataOutput?: string
  runOutput?: string
  markdown?: string
  request?: string
  prompt?: string
  promptFile?: string
  pack?: string
  analyzerRun?: string
  analyzerPack?: string
  providerConfig?: string
  externalCandidate?: string
  invokeProvider: boolean
  allowNetworkProvider: boolean
  providerMode?: string
  mockProviderResponse?: string
  proposal?: string
  dryRunReport?: string
  approvedApplyDryRun?: string
  reviewPacket?: string
  decisionRecord?: string
  evidenceDecision?: string
  acceptedEvidence?: string
  decision?: string
  reviewer?: string
  rationale?: string
  decisionActorType?: string
  decisionSource?: string
  decisionTimestamp?: string
  runtimeReport?: string
  candidate?: string
  schemaValidation?: string
  graphValidation?: string
  traversalPlan?: string
  viewTree?: string
  selectedSlice?: string
  contractInput?: string
  approvedState?: string
  approvedStateBoundary?: string
  applyBoundary?: string
  applyReadiness?: string
  mutationPolicy?: string
  backupDir?: string
  readModelOutput?: string
  mutationReadiness?: string
  readiness?: string
  sourceEvidence?: string
  runtimeEvidenceAuthority?: string
  evidenceCheckBinding?: string
  outputRequirement?: string
  requiredEvidenceId?: string
  runtimeEvidenceSatisfactionRecord?: string
  runtimeEvidenceSatisfactionReadiness?: string
  evidenceAcceptanceReadiness?: string
  equivalenceProofReadiness?: string
  policy?: string
  applyReport?: string
  checkReport?: string
  requestCandidate?: string
  scaffold?: string
  scriptScaffold?: string
  scriptTemplates?: string
  sessionManifest?: string
  bundleDir?: string
  outputDir?: string
  sessionId?: string
  clarificationPack?: string
  answers?: string
  revisedCandidateOutput?: string
  validationOutput?: string
  boundary?: string
  intake?: string
  frontendChain?: string
  baseline?: string
  roadmapAudit?: string
  finalHandoff?: string
  hookActivationChain?: string
  extensionReadiness?: string
  scopeCiEnforcementReadiness?: string
  hookHealth?: string
  userPromptAdvisory?: string
  preflightSession?: string
  devviewMode?: string
  installTrust?: string
  userPromptContext?: string
  instructionMarkdown?: string
  changedFiles?: string
  scopeReport?: string
  schema?: string
  projectProfile?: string
  extensionsDir?: string
  base?: string
  head?: string
  scope?: string
}

export interface CliEnvironment {
  cwd: string
  pluginRoot?: string
}

export interface ParsedArgs {
  positionals: string[]
  options: CliOptions
}

export interface DevViewProject {
  root: string
  devviewDir: string
  initialized: boolean
  statePath: string
  state: Record<string, unknown> | null
  decisionQueue: Record<string, unknown> | null
}

export function issue(input: ValidationIssue): ValidationIssue {
  return {
    ...input,
    nodeType: input.nodeType || inferNodeType(input),
    reason: input.reason || (input.severity === 'error' ? input.message : undefined),
    nextCommand: input.nextCommand || nextCommandForIssue(input.code),
  }
}

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some((entry) => entry.severity === 'error')
}

export function nextCommandForIssue(code: string): string | undefined {
  if (code.startsWith('AC_') || code === 'ABSTRACT_QUALITY_TERM' || code === 'ROOT_NOT_CONFIRMED_BY_USER') {
    return 'devview product-intake check'
  }

  const exact: Record<string, string> = {
    ACCEPTANCE_CRITERIA_MISSING: 'devview product-intake check',
    AMBIGUITY_UNRESOLVED: 'devview product-intake check',
    NODE_NEEDS_CLARIFICATION: 'devview product-intake check',
    LEAF_NOT_TERMINAL: 'devview product-intake check',
    NODE_BLOCKED: 'devview product-intake check',
    BLOCKING_DECISION_OPEN: 'devview product-intake check',
    PRODUCT_WORK_LINK_MISSING: 'devview work-planning close',
    WORK_WITHOUT_PRODUCT: 'devview work-planning close',
    DEFERRED_SCOPE_LEAK: 'devview work-planning close',
    OUT_OF_SCOPE_LEAK: 'devview work-planning close',
    WORK_TEST_LINK_MISSING: 'devview verification-design close',
    ACCEPTANCE_NOT_COVERED: 'devview verification-design close',
    TEST_WITHOUT_WORK_OR_AC: 'devview verification-design close',
    TEST_EVIDENCE_DECLARATION_MISSING: 'devview verification-design close',
    TEST_EVIDENCE_LINK_MISSING: 'devview execution complete',
    REQUIRED_TEST_NO_EVIDENCE: 'devview execution complete',
    REQUIRED_TEST_NO_CURRENT_EVIDENCE: 'devview execution complete',
    EVIDENCE_FILE_MISSING: 'devview execution complete',
    EVIDENCE_TIMESTAMP_MISSING: 'devview execution complete',
    EVIDENCE_STALE: 'devview execution complete',
    EVIDENCE_SUPERSEDED: 'devview execution complete',
    EVIDENCE_NOT_CURRENT: 'devview execution complete',
    ACCEPTANCE_CLOSURE_MISSING: 'devview accept',
    USER_APPROVAL_REQUIRED: 'devview accept',
    USER_ACCEPTANCE_REQUIRED: 'devview accept',
    ASSISTANT_ACCEPTED_STATUS: 'devview accept',
    ASSISTANT_SET_ACCEPTED_STATUS: 'devview accept',
    ACCEPT_STATE_BLOCKED: 'devview review submit',
    REVISION_IMPACT_MISSING: 'devview impact analyze',
    REVISION_IMPACT_AFFECTED_IDS_MISSING: 'devview impact analyze',
    REVISION_CONTEXT_MISSING: 'devview revision start',
    REVISION_CHANGE_MISMATCH: 'devview revision start',
    REVISION_ACTIVE_CONTEXT_EMPTY: 'devview impact analyze',
    REVISION_CONTEXT_NOT_IN_PROGRESS: 'devview revision start',
    REVISION_ARTIFACT_TRANSACTION_FAILED: 'devview revision start',
    REVISION_CHANGE_NOT_FOUND: 'devview change create',
    FILE_CHANGE_OUTSIDE_WORK_SCOPE: 'devview work-planning close',
    FILE_CHANGE_FORBIDDEN: 'devview work-planning close',
    FILE_CHANGE_REQUIRES_REVISION: 'devview change create',
    FILE_CHANGE_UNKNOWN_RISK: 'devview work-planning close',
    GIT_DIFF_UNAVAILABLE: 'devview files check',
    IMPACT_AFFECTED_IDS_MISSING: 'devview impact analyze',
    IMPACT_CHANGE_NOT_FOUND: 'devview impact analyze',
    CHANGE_SUMMARY_MISSING: 'devview change create',
    PRODUCT_PATCH_CHANGE_REQUIRED: 'devview product patch propose',
    PRODUCT_PATCH_CHANGE_MISSING: 'devview change create',
    PRODUCT_PATCH_TARGET_REQUIRED: 'devview product patch propose',
    PRODUCT_PATCH_TARGET_MISSING: 'devview product-intake check',
    PRODUCT_PATCH_OPERATION_REQUIRED: 'devview product patch propose',
    PRODUCT_PATCH_OPERATION_INVALID: 'devview product patch propose',
    PRODUCT_PATCH_SUMMARY_REQUIRED: 'devview product patch propose',
    PRODUCT_PATCH_CONFIRMATION_REQUIRED: 'devview product patch apply',
    PRODUCT_PATCH_SNAPSHOT_MISMATCH: 'devview product patch propose',
    PRODUCT_PATCH_ALREADY_APPLIED: 'devview status',
  }

  if (exact[code]) {
    return exact[code]
  }
  if (code.startsWith('VISUAL_') || code.startsWith('UI_')) {
    return 'devview visual check'
  }
  if (code.startsWith('STATE_') || code === 'UNKNOWN_STATE' || code === 'INVALID_TRANSITION') {
    return 'devview status'
  }
  return undefined
}

function inferNodeType(input: ValidationIssue): string | undefined {
  const file = (input.file || '').toLowerCase()
  const nodeId = (input.nodeId || '').toUpperCase()
  if (nodeId.startsWith('PT-')) {
    return 'Product'
  }
  if (nodeId.startsWith('WT-')) {
    return 'Work'
  }
  if (nodeId.startsWith('TT-')) {
    return 'Test'
  }
  if (nodeId.startsWith('EV-')) {
    return 'Evidence'
  }
  if (nodeId.startsWith('CH-')) {
    return 'Change'
  }
  if (nodeId.startsWith('IM-')) {
    return 'Impact'
  }
  if (file.includes('product-tree')) {
    return 'Product'
  }
  if (file.includes('work-tree')) {
    return 'Work'
  }
  if (file.includes('test-tree')) {
    return 'Test'
  }
  if (file.includes('evidence-tree')) {
    return 'Evidence'
  }
  if (file.includes('acceptance-tree')) {
    return 'Acceptance'
  }
  if (file.includes('change-tree')) {
    return 'Change'
  }
  if (file.includes('impact-tree')) {
    return 'Impact'
  }
  if (file.includes('devview-state')) {
    return 'State'
  }
  return undefined
}
