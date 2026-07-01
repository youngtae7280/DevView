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
  sourceMode: 'compiler-boundary-mvp-dry-run'
  changeId: string
  changeType: string
  goal: string
  allowedScope: ExecutionContractScope[]
  forbiddenScope: ExecutionContractScope[]
  requiredContext: Array<Record<string, unknown>>
  requiredChecks: Array<Record<string, unknown>>
  requiredEvidence: Array<Record<string, unknown>>
  knownRisks: ExecutionContractRisk[]
  openUnknowns: ExecutionContractUnknown[]
  humanDecisions: ExecutionContractHumanDecision[]
  stopConditions: Array<Record<string, unknown>>
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
  blockingReasons: string[]
  warnings: string[]
  nonEnforcementStatement: string
  aiBoundary: string
  compilerBoundary: string
  humanDecisionBoundary: string
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

export async function reportCompilerBoundary(root: string): Promise<CompilerBoundaryReport> {
  const blockingReasons: string[] = []
  const warnings: string[] = []
  const registry = await readJsonSafe<CompilerBoundaryTaskRegistry>(path.resolve(root, taskRegistryPath))
  const schema = await readJsonSafe<ExecutionContractSchema>(path.resolve(root, contractSchemaPath))
  const dryRun = await readJsonSafe<ExecutionContractDryRun>(path.resolve(root, dryRunContractPath))

  let taskCounts = { total: 0, compilerRequired: 0, aiAdvisory: 0 }
  if (!registry.ok) {
    blockingReasons.push(`Unable to read compiler boundary task registry: ${registry.error}`)
  } else {
    const registryIssues = validateTaskRegistry(registry.value)
    blockingReasons.push(...registryIssues.blocking)
    warnings.push(...registryIssues.warnings)
    taskCounts = {
      total: registry.value.tasks.length,
      compilerRequired: registry.value.tasks.filter((task) => task.classification === 'compiler-required').length,
      aiAdvisory: registry.value.tasks.filter((task) => task.classification === 'ai-advisory').length,
    }
  }

  if (!schema.ok) {
    blockingReasons.push(`Unable to read execution contract schema: ${schema.error}`)
  } else {
    const schemaIssues = validateContractSchema(schema.value)
    blockingReasons.push(...schemaIssues.blocking)
    warnings.push(...schemaIssues.warnings)
  }

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
    blockingReasons.push(`Unable to read dry-run execution contract: ${dryRun.error}`)
  } else {
    const contractIssues = validateExecutionContract(dryRun.value)
    blockingReasons.push(...contractIssues.blocking)
    warnings.push(...contractIssues.warnings)
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

  const taskRegistryBlocked =
    !registry.ok || blockingReasons.some((reason) => reason.toLowerCase().includes('task registry'))
  const contractSchemaBlocked =
    !schema.ok || blockingReasons.some((reason) => reason.toLowerCase().includes('contract schema'))
  const dryRunContractBlocked =
    !dryRun.ok || blockingReasons.some((reason) => reason.toLowerCase().includes('dry-run contract'))
  const contractValidatorBlocked =
    !dryRun.ok || blockingReasons.some((reason) => reason.toLowerCase().includes('execution contract'))

  return {
    status: blockingReasons.length === 0 ? 'compiler-boundary-mvp-pass' : 'compiler-boundary-mvp-blocked',
    taskRegistryStatus: taskRegistryBlocked ? 'task-registry-blocked' : 'task-registry-pass',
    contractSchemaStatus: contractSchemaBlocked ? 'contract-schema-blocked' : 'contract-schema-pass',
    contractValidatorStatus: contractValidatorBlocked ? 'contract-validator-blocked' : 'contract-validator-pass',
    dryRunContractStatus: dryRunContractBlocked ? 'dry-run-contract-blocked' : 'dry-run-contract-pass',
    taskCounts,
    paths: {
      taskRegistry: taskRegistryPath,
      contractSchema: contractSchemaPath,
      dryRunContract: dryRunContractPath,
    },
    dryRunContract: dryRunSummary,
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
      } else if (!Array.isArray(value) || value.length === 0) {
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
  const requiredFields = stringArrayValue(record.requiredFields)
  const missingFields = requiredContractFields.filter((field) => !requiredFields.includes(field))
  if (missingFields.length > 0) {
    blocking.push(`Contract schema missing required fields: ${missingFields.join(', ')}.`)
  }
  const definitions = asRecord(record.fieldDefinitions)
  for (const field of requiredContractFields) {
    if (!definitions[field]) {
      blocking.push(`Contract schema fieldDefinitions missing ${field}.`)
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
  const openUnknowns = arrayValue(record.openUnknowns)
  for (const unknown of openUnknowns) {
    if (unknown.severity === 'critical' && unknown.status === 'open') {
      blocking.push(`Execution contract has blocking critical unknown: ${stringValue(unknown.id, 'unknown')}.`)
    }
  }
  const decisions = arrayValue(record.humanDecisions)
  const acceptedRiskIds = new Set(
    decisions
      .filter((decision) => ['accepted', 'mitigated'].includes(stringValue(decision.status, '')))
      .map((decision) => stringValue(decision.decides, '')),
  )
  for (const risk of arrayValue(record.knownRisks)) {
    const riskId = stringValue(risk.id, '')
    if (risk.severity === 'high' && !acceptedRiskIds.has(riskId)) {
      blocking.push(`Execution contract has high risk without human decision: ${riskId || 'unknown'}.`)
    }
  }
  if (!stringValue(record.nonExecutionStatement, '').includes('dry-run')) {
    warnings.push('Execution contract nonExecutionStatement should state that this MVP contract is dry-run only.')
  }
  return { blocking, warnings }
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

function stringValue(value: unknown, fallback = 'unknown'): string {
  return typeof value === 'string' ? value : fallback
}

export function compilerBoundaryRelativePath(root: string, absolutePath: string): string {
  return relativePath(root, absolutePath)
}
