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

export interface ValidationIssue {
  validator: string
  code: string
  severity: IssueSeverity
  file?: string
  nodeId?: string
  message: string
  suggestedFix?: string
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
  stage?: TraceabilityStageOption
  summary?: string
  source?: string
  change?: string
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
  return input
}

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some((entry) => entry.severity === 'error')
}
