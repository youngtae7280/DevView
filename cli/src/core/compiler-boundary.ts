import path from 'node:path'
import { readJsonSafe, relativePath } from './fs.js'

export type CompilerBoundaryStatus = 'compiler-boundary-mvp-pass' | 'compiler-boundary-mvp-blocked'
export type CompilerBoundarySubStatus =
  | 'task-registry-pass'
  | 'task-registry-blocked'
  | 'contract-schema-pass'
  | 'contract-schema-blocked'
  | 'contract-validator-pass'
  | 'contract-validator-blocked'
  | 'dry-run-contract-pass'
  | 'dry-run-contract-blocked'

type TaskClassification = 'compiler-required' | 'ai-advisory'
type ContractSeverity = 'info' | 'warning' | 'blocking' | 'critical' | 'high'
type ContractAuthority = 'compiler' | 'policy' | 'graph' | 'human' | 'validator' | 'ai-advisory'
type CompilerBoundaryBucketStatus =
  | 'task-registry-pass'
  | 'task-registry-blocked'
  | 'contract-schema-pass'
  | 'contract-schema-blocked'
  | 'dry-run-contract-pass'
  | 'dry-run-contract-blocked'

interface CompilerBoundaryTask {
  taskId: string
  classification: TaskClassification
  reason: string
  inputs: string[]
  outputs: string[]
  requiredRelations: string[]
  validationRules: string[]
  executionAuthority: boolean
}

interface CompilerBoundaryTaskRegistry {
  schemaVersion: 1
  artifactRole: 'compiler-boundary-task-registry'
  status: 'compiler-boundary-mvp'
  boundaryPrinciple: {
    aiOutput: 'advisory'
    compilerOutput: 'authoritative'
    humanRole: 'decides'
  }
  tasks: CompilerBoundaryTask[]
}

interface ExecutionContractSchema {
  schemaVersion: 1
  artifactRole: 'execution-contract-mvp-schema'
  status: 'compiler-boundary-mvp'
  requiredFields: string[]
  fieldDefinitions: Record<string, Record<string, unknown>>
  nonEnforcementStatement: string
}

interface ExecutionContractScope {
  id: string
  scopeKind: string
  paths: string[]
  derivedFrom: string[]
}

interface ExecutionContractCheck {
  id: string
  command: string
  validates: string[]
}

interface ExecutionContractEvidence {
  id: string
  evidenceType: string
  fromCheck: string
  freshness: string
}

interface ExecutionContractContext {
  id: string
  artifact: string
  role: string
}

interface ExecutionContractStopCondition {
  id: string
  condition: string
  action: string
}

interface ExecutionContractUnknown {
  id: string
  severity: ContractSeverity
  status: string
  question: string
}

interface ExecutionContractRisk {
  id: string
  severity: ContractSeverity
  status: string
  mitigation?: string
}

interface ExecutionContractHumanDecision {
  id: string
  decides: string
  status: string
  decision: string
}

interface ExecutionContractDryRun {
  schemaVersion: 1
  artifactRole: 'execution-contract-dry-run'
  status: 'contract-dry-run-valid'
  sourceMode: 'compiler-boundary-mvp-dry-run' | 'contract-compiler-dry-run-v0'
  changeId: string
  changeType: string
  goal: string
  allowedScope: ExecutionContractScope[]
  forbiddenScope: ExecutionContractScope[]
  requiredContext: ExecutionContractContext[]
  requiredChecks: ExecutionContractCheck[]
  requiredEvidence: ExecutionContractEvidence[]
  knownRisks: ExecutionContractRisk[]
  openUnknowns: ExecutionContractUnknown[]
  humanDecisions: ExecutionContractHumanDecision[]
  stopConditions: ExecutionContractStopCondition[]
  outputRequirements: string[]
  nonExecutionStatement: string
}

export interface CompilerBoundaryReport {
  status: CompilerBoundaryStatus
  taskRegistryStatus: Extract<CompilerBoundarySubStatus, 'task-registry-pass' | 'task-registry-blocked'>
  contractSchemaStatus: Extract<CompilerBoundarySubStatus, 'contract-schema-pass' | 'contract-schema-blocked'>
  contractValidatorStatus: Extract<CompilerBoundarySubStatus, 'contract-validator-pass' | 'contract-validator-blocked'>
  dryRunContractStatus: Extract<CompilerBoundarySubStatus, 'dry-run-contract-pass' | 'dry-run-contract-blocked'>
  taskCounts: {
    total: number
    compilerRequired: number
    aiAdvisory: number
  }
  paths: {
    taskRegistry: string
    contractSchema: string
    dryRunContract: string
  }
  dryRunContract: {
    changeId: string
    changeType: string
    goal: string
    allowedScopeCount: number
    forbiddenScopeCount: number
    requiredCheckCount: number
    requiredEvidenceCount: number
    stopConditionCount: number
  }
  validationBuckets: {
    taskRegistry: CompilerBoundaryIssueBucket<
      Extract<CompilerBoundaryBucketStatus, 'task-registry-pass' | 'task-registry-blocked'>
    >
    contractSchema: CompilerBoundaryIssueBucket<
      Extract<CompilerBoundaryBucketStatus, 'contract-schema-pass' | 'contract-schema-blocked'>
    >
    dryRunContract: CompilerBoundaryIssueBucket<
      Extract<CompilerBoundaryBucketStatus, 'dry-run-contract-pass' | 'dry-run-contract-blocked'>
    >
  }
  blockingReasons: string[]
  warnings: string[]
  nonEnforcementStatement: string
  aiBoundary: string
  compilerBoundary: string
  humanDecisionBoundary: string
}

interface CompilerBoundaryIssues {
  blocking: string[]
  warnings: string[]
}

interface CompilerBoundaryIssueBucket<TStatus extends CompilerBoundaryBucketStatus> extends CompilerBoundaryIssues {
  status: TStatus
}

const taskRegistryPath = 'examples/read-model-aggregate/compiler-boundary-task-registry.json'
const contractSchemaPath = 'examples/read-model-aggregate/execution-contract-schema.json'
const dryRunContractPath = 'examples/read-model-aggregate/generated/execution-contract-dry-run.json'

const requiredContractFields = [
  'changeId',
  'changeType',
  'goal',
  'allowedScope',
  'forbiddenScope',
  'requiredContext',
  'requiredChecks',
  'requiredEvidence',
  'knownRisks',
  'openUnknowns',
  'humanDecisions',
  'stopConditions',
  'outputRequirements',
]

const allowedContractAuthorities: ContractAuthority[] = [
  'compiler',
  'policy',
  'graph',
  'human',
  'validator',
  'ai-advisory',
]
const allowedEvidenceFreshness = [
  'required-after-source-change',
  'required-after-graph-or-artifact-change',
  'required-after-policy-change',
  'required-after-contract-change',
  'required-before-acceptance',
]
const allowedStopConditionActions = ['stop-and-request-human-decision', 'stop-and-record-missing-evidence']
const allowedHumanDecisionStatuses = ['accepted', 'mitigated', 'rejected', 'deferred']
const allowedExecutionContractSourceModes = ['compiler-boundary-mvp-dry-run', 'contract-compiler-dry-run-v0']

export async function reportCompilerBoundary(root: string): Promise<CompilerBoundaryReport> {
  const registry = await readJsonSafe<CompilerBoundaryTaskRegistry>(path.resolve(root, taskRegistryPath))
  const schema = await readJsonSafe<ExecutionContractSchema>(path.resolve(root, contractSchemaPath))
  const dryRun = await readJsonSafe<ExecutionContractDryRun>(path.resolve(root, dryRunContractPath))

  let taskCounts = { total: 0, compilerRequired: 0, aiAdvisory: 0 }
  let registryIssues: CompilerBoundaryIssues
  if (!registry.ok) {
    registryIssues = {
      blocking: [`Unable to read compiler boundary task registry: ${registry.error}`],
      warnings: [],
    }
  } else {
    registryIssues = validateTaskRegistry(registry.value)
    taskCounts = {
      total: registry.value.tasks.length,
      compilerRequired: registry.value.tasks.filter((task) => task.classification === 'compiler-required').length,
      aiAdvisory: registry.value.tasks.filter((task) => task.classification === 'ai-advisory').length,
    }
  }

  let schemaIssues: CompilerBoundaryIssues
  if (!schema.ok) {
    schemaIssues = {
      blocking: [`Unable to read execution contract schema: ${schema.error}`],
      warnings: [],
    }
  } else {
    schemaIssues = validateContractSchema(schema.value)
  }

  let contractIssues: CompilerBoundaryIssues
  let dryRunSummary = {
    changeId: 'missing',
    changeType: 'missing',
    goal: 'missing',
    allowedScopeCount: 0,
    forbiddenScopeCount: 0,
    requiredCheckCount: 0,
    requiredEvidenceCount: 0,
    stopConditionCount: 0,
  }
  if (!dryRun.ok) {
    contractIssues = {
      blocking: [`Unable to read dry-run execution contract: ${dryRun.error}`],
      warnings: [],
    }
  } else {
    contractIssues = validateExecutionContract(dryRun.value)
    dryRunSummary = {
      changeId: stringValue(dryRun.value.changeId, 'missing'),
      changeType: stringValue(dryRun.value.changeType, 'missing'),
      goal: stringValue(dryRun.value.goal, 'missing'),
      allowedScopeCount: arrayValue(dryRun.value.allowedScope).length,
      forbiddenScopeCount: arrayValue(dryRun.value.forbiddenScope).length,
      requiredCheckCount: arrayValue(dryRun.value.requiredChecks).length,
      requiredEvidenceCount: arrayValue(dryRun.value.requiredEvidence).length,
      stopConditionCount: arrayValue(dryRun.value.stopConditions).length,
    }
  }

  const taskRegistryBucket = buildIssueBucket(registryIssues, 'task-registry-pass', 'task-registry-blocked')
  const contractSchemaBucket = buildIssueBucket(schemaIssues, 'contract-schema-pass', 'contract-schema-blocked')
  const dryRunContractBucket = buildIssueBucket(contractIssues, 'dry-run-contract-pass', 'dry-run-contract-blocked')
  const blockingReasons = [
    ...taskRegistryBucket.blocking,
    ...contractSchemaBucket.blocking,
    ...dryRunContractBucket.blocking,
  ]
  const warnings = [...taskRegistryBucket.warnings, ...contractSchemaBucket.warnings, ...dryRunContractBucket.warnings]

  return {
    status: blockingReasons.length === 0 ? 'compiler-boundary-mvp-pass' : 'compiler-boundary-mvp-blocked',
    taskRegistryStatus: taskRegistryBucket.status,
    contractSchemaStatus: contractSchemaBucket.status,
    contractValidatorStatus:
      dryRunContractBucket.status === 'dry-run-contract-blocked'
        ? 'contract-validator-blocked'
        : 'contract-validator-pass',
    dryRunContractStatus: dryRunContractBucket.status,
    taskCounts,
    paths: {
      taskRegistry: taskRegistryPath,
      contractSchema: contractSchemaPath,
      dryRunContract: dryRunContractPath,
    },
    dryRunContract: dryRunSummary,
    validationBuckets: {
      taskRegistry: taskRegistryBucket,
      contractSchema: contractSchemaBucket,
      dryRunContract: dryRunContractBucket,
    },
    blockingReasons,
    warnings,
    nonEnforcementStatement:
      'Compiler Boundary MVP is local/non-enforcing Evidence only. It does not enable required checks, branch protection, automatic AI execution, acceptance, or tree retirement.',
    aiBoundary:
      'AI may propose candidates, summaries, questions, narratives, and optional test ideas, but cannot finalize execution authority.',
    compilerBoundary:
      'Execution-affecting scope, checks, evidence, stop conditions, acceptance, and graph delta facts must be compiled from graph/policy/validator inputs.',
    humanDecisionBoundary:
      'Human decisions remain required for high risk acceptance, unknown-to-assumption conversion, scope exceptions, and final product acceptance.',
  }
}

export function validateTaskRegistry(registry: unknown): { blocking: string[]; warnings: string[] } {
  const blocking: string[] = []
  const warnings: string[] = []
  const record = asRecord(registry)
  if (record.schemaVersion !== 1) {
    blocking.push('Task registry schemaVersion must be 1.')
  }
  if (record.artifactRole !== 'compiler-boundary-task-registry') {
    blocking.push('Task registry artifactRole must be compiler-boundary-task-registry.')
  }
  if (record.status !== 'compiler-boundary-mvp') {
    blocking.push('Task registry status must be compiler-boundary-mvp.')
  }
  const boundaryPrinciple = asRecord(record.boundaryPrinciple)
  if (boundaryPrinciple.aiOutput !== 'advisory') {
    blocking.push('Task registry boundaryPrinciple.aiOutput must be advisory.')
  }
  if (boundaryPrinciple.compilerOutput !== 'authoritative') {
    blocking.push('Task registry boundaryPrinciple.compilerOutput must be authoritative.')
  }
  if (boundaryPrinciple.humanRole !== 'decides') {
    blocking.push('Task registry boundaryPrinciple.humanRole must be decides.')
  }
  const tasks = Array.isArray(record.tasks) ? record.tasks : []
  if (tasks.length === 0) {
    blocking.push('Task registry must contain at least one task.')
  }
  const seen = new Set<string>()
  for (const [index, taskValue] of tasks.entries()) {
    const task = asRecord(taskValue)
    const label = `Task registry task[${index}]`
    const taskId = stringValue(task.taskId, '')
    if (!taskId) {
      blocking.push(`${label} must include taskId.`)
    } else if (seen.has(taskId)) {
      blocking.push(`Task registry duplicate taskId: ${taskId}.`)
    }
    seen.add(taskId)
    if (!['compiler-required', 'ai-advisory'].includes(stringValue(task.classification, ''))) {
      blocking.push(`${label} must classify as compiler-required or ai-advisory.`)
    }
    for (const key of ['reason', 'inputs', 'outputs', 'requiredRelations', 'validationRules']) {
      const value = task[key]
      if (key === 'reason') {
        if (!stringValue(value, '')) blocking.push(`${label} must include reason.`)
      } else if (nonEmptyStringArray(value).length === 0) {
        blocking.push(`${label} must include non-empty ${key}.`)
      }
    }
    if (task.classification === 'compiler-required' && task.executionAuthority !== true) {
      blocking.push(`${label} compiler-required task must have executionAuthority true.`)
    }
    if (task.classification === 'ai-advisory' && task.executionAuthority !== false) {
      blocking.push(`${label} ai-advisory task must have executionAuthority false.`)
    }
  }
  if (tasks.length < 8) {
    warnings.push('Task registry MVP is intentionally compact; expand only after current compiler boundary stabilizes.')
  }
  return { blocking, warnings }
}

export function validateContractSchema(schema: unknown): { blocking: string[]; warnings: string[] } {
  const blocking: string[] = []
  const warnings: string[] = []
  const record = asRecord(schema)
  if (record.schemaVersion !== 1) {
    blocking.push('Contract schema schemaVersion must be 1.')
  }
  if (record.artifactRole !== 'execution-contract-mvp-schema') {
    blocking.push('Contract schema artifactRole must be execution-contract-mvp-schema.')
  }
  if (record.status !== 'compiler-boundary-mvp') {
    blocking.push('Contract schema status must be compiler-boundary-mvp.')
  }
  const requiredFields = stringArrayValue(record.requiredFields)
  const missingFields = requiredContractFields.filter((field) => !requiredFields.includes(field))
  if (missingFields.length > 0) {
    blocking.push(`Contract schema missing required fields: ${missingFields.join(', ')}.`)
  }
  const definitions = asRecord(record.fieldDefinitions)
  for (const field of requiredContractFields) {
    const definition = asRecord(definitions[field])
    if (Object.keys(definition).length === 0) {
      blocking.push(`Contract schema fieldDefinitions missing ${field}.`)
      continue
    }
    if (!stringValue(definition.source, '')) {
      blocking.push(`Contract schema fieldDefinitions.${field}.source is required.`)
    }
    if (!stringValue(definition.authority, '')) {
      blocking.push(`Contract schema fieldDefinitions.${field}.authority is required.`)
    } else if (!allowedContractAuthorities.includes(stringValue(definition.authority, '') as ContractAuthority)) {
      blocking.push(
        `Contract schema fieldDefinitions.${field}.authority must be one of: ${allowedContractAuthorities.join(', ')}.`,
      )
    }
  }
  if (!stringValue(record.nonEnforcementStatement, '').includes('does not enable required checks')) {
    blocking.push('Contract schema nonEnforcementStatement must preserve the non-required-check boundary.')
  }
  if (requiredFields.length > requiredContractFields.length) {
    warnings.push('Contract schema includes fields beyond MVP; ensure future validators own any added authority.')
  }
  return { blocking, warnings }
}

export function validateExecutionContract(contract: unknown): { blocking: string[]; warnings: string[] } {
  const blocking: string[] = []
  const warnings: string[] = []
  const record = asRecord(contract)
  if (record.schemaVersion !== 1) {
    blocking.push('Execution contract schemaVersion must be 1.')
  }
  if (record.artifactRole !== 'execution-contract-dry-run') {
    blocking.push('Execution contract artifactRole must be execution-contract-dry-run.')
  }
  if (record.status !== 'contract-dry-run-valid') {
    blocking.push('Execution contract status must be contract-dry-run-valid.')
  }
  const sourceMode = stringValue(record.sourceMode, '')
  if (!allowedExecutionContractSourceModes.includes(sourceMode)) {
    blocking.push(`Execution contract sourceMode must be one of: ${allowedExecutionContractSourceModes.join(', ')}.`)
  }
  for (const field of requiredContractFields) {
    if (!(field in record)) {
      blocking.push(`Execution contract missing required field: ${field}.`)
    }
  }
  if (!stringValue(record.goal, '')) {
    blocking.push('Execution contract goal is required.')
  }
  const allowedScope = arrayValue(record.allowedScope)
  const forbiddenScope = arrayValue(record.forbiddenScope)
  const requiredChecks = arrayValue(record.requiredChecks)
  const requiredEvidence = arrayValue(record.requiredEvidence)
  const requiredContext = arrayValue(record.requiredContext)
  const knownRisks = arrayValue(record.knownRisks)
  const openUnknowns = arrayValue(record.openUnknowns)
  const decisions = arrayValue(record.humanDecisions)
  const stopConditions = arrayValue(record.stopConditions)
  const decisionTargetIds = new Set(
    [
      stringValue(record.changeId, ''),
      ...allowedScope.map((scope) => stringValue(scope.id, '')),
      ...forbiddenScope.map((scope) => stringValue(scope.id, '')),
      ...knownRisks.map((risk) => stringValue(risk.id, '')),
      ...openUnknowns.map((unknown) => stringValue(unknown.id, '')),
    ].filter(Boolean),
  )
  if (allowedScope.length === 0) {
    blocking.push('Execution contract allowedScope is required.')
  }
  if (forbiddenScope.length === 0) {
    blocking.push('Execution contract forbiddenScope is required.')
  }
  const hasCodeScope = allowedScope.some((entry) => stringValue(entry.scopeKind, '') === 'code')
  if (hasCodeScope && requiredChecks.length === 0) {
    blocking.push('Execution contract with code scope requires at least one requiredCheck.')
  }
  if (requiredEvidence.length === 0) {
    blocking.push('Execution contract requiredEvidence is required.')
  }
  validateScopeEntries('allowedScope', allowedScope, blocking)
  validateScopeEntries('forbiddenScope', forbiddenScope, blocking)
  for (const [index, context] of requiredContext.entries()) {
    validateRequiredStringFields(
      `Execution contract requiredContext[${index}]`,
      context,
      ['id', 'artifact', 'role'],
      blocking,
    )
  }
  for (const [index, check] of requiredChecks.entries()) {
    const label = `Execution contract requiredChecks[${index}]`
    validateRequiredStringFields(label, check, ['id', 'command'], blocking)
    if (nonEmptyStringArray(check.validates).length === 0) {
      blocking.push(`${label}.validates must be a non-empty string array.`)
    }
  }
  const checkIds = new Set(requiredChecks.map((check) => stringValue(check.id, '')).filter(Boolean))
  for (const [index, evidence] of requiredEvidence.entries()) {
    const label = `Execution contract requiredEvidence[${index}]`
    validateRequiredStringFields(label, evidence, ['id', 'evidenceType', 'fromCheck', 'freshness'], blocking)
    const fromCheck = stringValue(evidence.fromCheck, '')
    if (fromCheck && !checkIds.has(fromCheck)) {
      blocking.push(`${label}.fromCheck must reference an existing requiredChecks.id: ${fromCheck}.`)
    }
    const freshness = stringValue(evidence.freshness, '')
    if (freshness && !allowedEvidenceFreshness.includes(freshness)) {
      blocking.push(`${label}.freshness must be one of: ${allowedEvidenceFreshness.join(', ')}.`)
    }
  }
  for (const unknown of openUnknowns) {
    validateRequiredStringFields(
      'Execution contract openUnknowns[]',
      unknown,
      ['id', 'severity', 'status', 'question'],
      blocking,
    )
    if (isUnknownBlocking(unknown)) {
      blocking.push(`Execution contract has blocking critical unknown: ${stringValue(unknown.id, 'unknown')}.`)
    }
  }
  for (const [index, decision] of decisions.entries()) {
    validateRequiredStringFields(
      `Execution contract humanDecisions[${index}]`,
      decision,
      ['id', 'decides', 'status', 'decision'],
      blocking,
    )
    const status = stringValue(decision.status, '')
    if (status && !allowedHumanDecisionStatuses.includes(status)) {
      blocking.push(
        `Execution contract humanDecisions[${index}].status must be one of: ${allowedHumanDecisionStatuses.join(
          ', ',
        )}.`,
      )
    }
    const target = stringValue(decision.decides, '')
    if (target && !decisionTargetIds.has(target)) {
      blocking.push(
        `Execution contract humanDecisions[${index}].decides must reference a known risk, unknown, scope, or change id: ${target}.`,
      )
    }
  }
  const acceptedRiskIds = new Set(
    decisions
      .filter((decision) => ['accepted', 'mitigated'].includes(stringValue(decision.status, '')))
      .map((decision) => stringValue(decision.decides, '')),
  )
  for (const risk of knownRisks) {
    validateRequiredStringFields('Execution contract knownRisks[]', risk, ['id', 'severity', 'status'], blocking)
    const riskId = stringValue(risk.id, '')
    if (isRiskDecisionRequired(risk) && !acceptedRiskIds.has(riskId)) {
      blocking.push(`Execution contract has high risk without human decision: ${riskId || 'unknown'}.`)
    }
  }
  for (const [index, stopCondition] of stopConditions.entries()) {
    validateRequiredStringFields(
      `Execution contract stopConditions[${index}]`,
      stopCondition,
      ['id', 'condition', 'action'],
      blocking,
    )
    const action = stringValue(stopCondition.action, '')
    if (action && !allowedStopConditionActions.includes(action)) {
      blocking.push(
        `Execution contract stopConditions[${index}].action must be one of: ${allowedStopConditionActions.join(', ')}.`,
      )
    }
  }
  if (stringArrayValue(record.outputRequirements).length === 0) {
    blocking.push('Execution contract outputRequirements must be a non-empty string array.')
  }
  if (!stringValue(record.nonExecutionStatement, '').includes('dry-run')) {
    blocking.push('Execution contract nonExecutionStatement must state that this MVP contract is dry-run only.')
  }
  return { blocking, warnings }
}

function buildIssueBucket<TPass extends CompilerBoundaryBucketStatus, TBlocked extends CompilerBoundaryBucketStatus>(
  issues: CompilerBoundaryIssues,
  passStatus: TPass,
  blockedStatus: TBlocked,
): CompilerBoundaryIssueBucket<TPass | TBlocked> {
  return {
    status: issues.blocking.length === 0 ? passStatus : blockedStatus,
    blocking: issues.blocking,
    warnings: issues.warnings,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function arrayValue(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((entry) => entry && typeof entry === 'object') : []
}

function stringArrayValue(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function nonEmptyStringArray(value: unknown): string[] {
  return stringArrayValue(value).filter((entry) => entry.trim().length > 0)
}

function stringValue(value: unknown, fallback = 'unknown'): string {
  return typeof value === 'string' ? value : fallback
}

function validateRequiredStringFields(
  label: string,
  record: Record<string, unknown>,
  fields: string[],
  blocking: string[],
): void {
  for (const field of fields) {
    if (!stringValue(record[field], '')) {
      blocking.push(`${label}.${field} is required.`)
    }
  }
}

function validateScopeEntries(
  label: 'allowedScope' | 'forbiddenScope',
  scopes: Array<Record<string, unknown>>,
  blocking: string[],
): void {
  for (const [index, scope] of scopes.entries()) {
    const scopeLabel = `Execution contract ${label}[${index}]`
    validateRequiredStringFields(scopeLabel, scope, ['id', 'scopeKind'], blocking)
    if (nonEmptyStringArray(scope.paths).length === 0) {
      blocking.push(`${scopeLabel}.paths must be a non-empty string array.`)
    }
    if (nonEmptyStringArray(scope.derivedFrom).length === 0) {
      blocking.push(`${scopeLabel}.derivedFrom must be a non-empty string array.`)
    }
  }
}

function isUnknownBlocking(unknown: Record<string, unknown>): boolean {
  return (
    ['critical', 'blocking'].includes(stringValue(unknown.severity, '')) && stringValue(unknown.status, '') === 'open'
  )
}

function isRiskDecisionRequired(risk: Record<string, unknown>): boolean {
  return ['critical', 'high', 'blocking'].includes(stringValue(risk.severity, ''))
}

export function compilerBoundaryRelativePath(root: string, absolutePath: string): string {
  return relativePath(root, absolutePath)
}
