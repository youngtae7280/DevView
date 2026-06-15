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
export type TraceabilityStageOption = 'wpd' | 'vd' | 'execution' | 'review' | 'accept'
export type ContextStageOption =
  | 'start'
  | 'rpd'
  | 'wpd'
  | 'vd'
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
  profile?: 'full' | 'lite' | 'bypass'
  brief?: string
  files?: string[]
  stage?: CliStageOption
  summary?: string
  source?: string
  change?: string
  patch?: string
  operation?: string
  product?: string[]
  work?: string[]
  test?: string[]
  evidence?: string[]
  acceptance?: string[]
}

export interface CliEnvironment {
  cwd: string
  pluginRoot?: string
}

export interface ParsedArgs {
  positionals: string[]
  options: CliOptions
}

export interface PbeProject {
  root: string
  pbeDir: string
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
    return 'pbe rpd check'
  }

  const exact: Record<string, string> = {
    ACCEPTANCE_CRITERIA_MISSING: 'pbe rpd check',
    AMBIGUITY_UNRESOLVED: 'pbe rpd check',
    NODE_NEEDS_CLARIFICATION: 'pbe rpd check',
    LEAF_NOT_TERMINAL: 'pbe rpd check',
    NODE_BLOCKED: 'pbe rpd check',
    BLOCKING_DECISION_OPEN: 'pbe rpd check',
    PRODUCT_WORK_LINK_MISSING: 'pbe wpd close',
    WORK_WITHOUT_PRODUCT: 'pbe wpd close',
    DEFERRED_SCOPE_LEAK: 'pbe wpd close',
    OUT_OF_SCOPE_LEAK: 'pbe wpd close',
    WORK_TEST_LINK_MISSING: 'pbe vd close',
    ACCEPTANCE_NOT_COVERED: 'pbe vd close',
    TEST_WITHOUT_WORK_OR_AC: 'pbe vd close',
    TEST_EVIDENCE_DECLARATION_MISSING: 'pbe vd close',
    TEST_EVIDENCE_LINK_MISSING: 'pbe execution complete',
    REQUIRED_TEST_NO_EVIDENCE: 'pbe execution complete',
    REQUIRED_TEST_NO_CURRENT_EVIDENCE: 'pbe execution complete',
    EVIDENCE_FILE_MISSING: 'pbe execution complete',
    EVIDENCE_TIMESTAMP_MISSING: 'pbe execution complete',
    EVIDENCE_STALE: 'pbe execution complete',
    EVIDENCE_SUPERSEDED: 'pbe execution complete',
    EVIDENCE_NOT_CURRENT: 'pbe execution complete',
    ACCEPTANCE_CLOSURE_MISSING: 'pbe accept',
    USER_APPROVAL_REQUIRED: 'pbe accept',
    USER_ACCEPTANCE_REQUIRED: 'pbe accept',
    ASSISTANT_ACCEPTED_STATUS: 'pbe accept',
    ASSISTANT_SET_ACCEPTED_STATUS: 'pbe accept',
    ACCEPT_STATE_BLOCKED: 'pbe review submit',
    REVISION_IMPACT_MISSING: 'pbe impact analyze',
    REVISION_IMPACT_AFFECTED_IDS_MISSING: 'pbe impact analyze',
    REVISION_CONTEXT_MISSING: 'pbe revision start',
    REVISION_CHANGE_MISMATCH: 'pbe revision start',
    REVISION_ACTIVE_CONTEXT_EMPTY: 'pbe impact analyze',
    REVISION_CONTEXT_NOT_IN_PROGRESS: 'pbe revision start',
    REVISION_ARTIFACT_TRANSACTION_FAILED: 'pbe revision start',
    REVISION_CHANGE_NOT_FOUND: 'pbe change create',
    FILE_CHANGE_OUTSIDE_WORK_SCOPE: 'pbe wpd close',
    FILE_CHANGE_FORBIDDEN: 'pbe wpd close',
    FILE_CHANGE_REQUIRES_REVISION: 'pbe change create',
    FILE_CHANGE_UNKNOWN_RISK: 'pbe wpd close',
    GIT_DIFF_UNAVAILABLE: 'pbe files check',
    IMPACT_AFFECTED_IDS_MISSING: 'pbe impact analyze',
    IMPACT_CHANGE_NOT_FOUND: 'pbe impact analyze',
    CHANGE_SUMMARY_MISSING: 'pbe change create',
    PRODUCT_PATCH_CHANGE_REQUIRED: 'pbe product patch propose',
    PRODUCT_PATCH_CHANGE_MISSING: 'pbe change create',
    PRODUCT_PATCH_TARGET_REQUIRED: 'pbe product patch propose',
    PRODUCT_PATCH_TARGET_MISSING: 'pbe rpd check',
    PRODUCT_PATCH_OPERATION_REQUIRED: 'pbe product patch propose',
    PRODUCT_PATCH_OPERATION_INVALID: 'pbe product patch propose',
    PRODUCT_PATCH_SUMMARY_REQUIRED: 'pbe product patch propose',
    PRODUCT_PATCH_CONFIRMATION_REQUIRED: 'pbe product patch apply',
    PRODUCT_PATCH_SNAPSHOT_MISMATCH: 'pbe product patch propose',
    PRODUCT_PATCH_ALREADY_APPLIED: 'pbe status',
  }

  if (exact[code]) {
    return exact[code]
  }
  if (code.startsWith('VISUAL_') || code.startsWith('UI_')) {
    return 'pbe visual check'
  }
  if (code.startsWith('STATE_') || code === 'UNKNOWN_STATE' || code === 'INVALID_TRANSITION') {
    return 'pbe status'
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
  if (file.includes('pbe-state')) {
    return 'State'
  }
  return undefined
}
