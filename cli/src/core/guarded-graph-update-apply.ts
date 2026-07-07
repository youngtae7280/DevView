import { constants } from 'node:fs'
import { copyFile, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'
import { projectGraphSourceReadModelToFile } from './read-model-evidence.js'

type JsonRecord = Record<string, unknown>

const REPORT_ROLE = 'devview-guarded-graph-update-apply-report'
const APPLY_PLAN_ROLE = 'devview-guarded-graph-update-apply-plan'
const APPLY_PLAN_STATUS_READY = 'devview-guarded-graph-update-apply-plan-ready'
const BOUNDARY_ROLE = 'devview-guarded-graph-update-boundary-record'
const BOUNDARY_STATUS_READY = 'devview-guarded-graph-update-boundary-ready'
const BOUNDARY_STATE = 'ready-for-future-guarded-graph-update-apply-command-no-mutation'

const proposalRoles = new Set([
  'graph-delta-proposal-only-preview',
  'devview-graph-delta-proposal-preview',
  'devview-graph-update-proposal-preview',
])

const unsafeAuthorityFields = [
  'guardedUpdateReady',
  'runtimeEvidenceSatisfied',
  'evidenceAccepted',
  'equivalenceProven',
  'scopeEnforced',
  'ciEnforcementEnabled',
  'requiredChecksConfigured',
  'branchProtectionChanged',
  'branchProtectionMutated',
  'requiredChecksMutated',
  'externalCiMutated',
  'diffRejectionEnabled',
  'diffRejectionActivated',
  'strictModeEnabled',
  'guidedEnforcementEnabled',
  'hooksActivated',
  'graphSourceMutated',
  'graphDeltaApplied',
  'filesMutated',
  'providerInvoked',
  'networkCallMade',
  'extensionExecutionAllowed',
  'extensionsExecuted',
  'shellCommandsExecuted',
  'approvalAutomationEnabled',
  'userAcceptanceAutomated',
]

export interface GuardedGraphUpdateApplyOptions {
  graphSource: string
  proposal: string
  applyPlan: string
  guardedGraphUpdateBoundaryRecord: string
  backupDir: string
  readModelOutput: string
  validationOutput: string
  output: string
  operator: string
  authorizationRationale: string
  authorizeGraphSourceMutation: boolean
  markdown?: string
}

export interface GuardedGraphUpdateApplyFinding {
  code: string
  severity: 'info' | 'warning' | 'error'
  message: string
  field?: string
  expected?: unknown
  actual?: unknown
}

type ApplyReportStatus =
  | 'devview-guarded-graph-update-applied'
  | 'devview-guarded-graph-update-apply-blocked'
  | 'devview-guarded-graph-update-apply-rolled-back'

type ApplyStatus =
  | 'applied-graph-source-mutated'
  | 'blocked-authorization-missing'
  | 'blocked-apply-plan-not-ready'
  | 'blocked-boundary-record-not-ready'
  | 'blocked-proposal-mismatch'
  | 'blocked-boundary-mismatch'
  | 'blocked-graph-source-hash-mismatch'
  | 'blocked-protected-target'
  | 'blocked-unsupported-operation-shape'
  | 'blocked-operation-preview-mismatch'
  | 'blocked-backup-unavailable'
  | 'blocked-mutated-graph-invalid'
  | 'rolled-back-post-apply-verification-failed'

export interface GuardedGraphUpdateApplyReport {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: ApplyReportStatus
  applyStatus: ApplyStatus
  sourceGraphSource: string
  sourceGraphDeltaProposal: string
  sourceGuardedGraphUpdateApplyPlan: string
  sourceGuardedGraphUpdateBoundaryRecord: string
  proposalId: string
  graphSourceOriginalHash: string
  graphSourceMutatedHash: string | null
  graphSourceCurrentHashBeforeApply: string
  applyPlanStatus: string
  boundaryRecordStatus: string
  boundaryGuardedUpdateReady: boolean
  boundaryApplyDeferred: boolean
  boundaryApplyCommandEnabled: boolean
  operatorAuthorizationStatus:
    | 'explicit-cli-operator-authorization-recorded'
    | 'blocked-explicit-cli-operator-authorization-missing'
  operatorId: string | null
  authorizationRationale: string | null
  authorizationSource: 'explicit-cli-input' | 'missing'
  backupDir: string
  backupCreated: boolean
  backupPath: string | null
  backupHash: string | null
  rollbackAvailable: boolean
  rollbackAttempted: boolean
  rollbackStatus: 'not-needed' | 'not-attempted' | 'restored-from-backup' | 'restore-failed'
  mutationApplied: boolean
  graphSourceMutated: boolean
  graphDeltaApplied: boolean
  filesMutated: boolean
  mutatedFilePaths: string[]
  concreteOperationCount: number
  appliedOperationIds: string[]
  operationApplicationSummary: {
    operationCount: number
    targetKinds: string[]
    fieldPaths: string[]
    updatedNodeCount: number
    updatedEdgeCount: number
    updatedRecordCount: number
  }
  readModelRegenerated: boolean
  readModelOutputPath: string
  validationOutputPath: string
  postApplyVerificationStatus:
    | 'not-run-blocked-before-mutation'
    | 'pass'
    | 'failed-before-replace'
    | 'failed-post-replace-rolled-back'
  validationFindings: GuardedGraphUpdateApplyFinding[]
  providerInvoked: false
  networkCallMade: false
  hooksActivated: false
  branchProtectionChanged: false
  branchProtectionMutated: false
  requiredChecksConfigured: false
  requiredChecksMutated: false
  externalCiMutated: false
  diffRejectionEnabled: false
  diffRejectionActivated: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  approvalAutomationEnabled: false
  codexSelfApprovalAllowed: false
  userAcceptanceAutomated: false
  extensionExecutionAllowed: false
  extensionsExecuted: false
  shellCommandsExecuted: false
  allowedWriteSet: string[]
  forbiddenMutationTargets: string[]
  writtenOutputPath: string | null
  markdownReportPath: string | null
  nonExecutionBoundary: string
}

export interface GuardedGraphUpdateApplyFileResult {
  report: GuardedGraphUpdateApplyReport
  outputPath: string
  markdownReport?: string
}

interface LoadedInputs {
  resolvedGraphSourcePath: string
  resolvedProposalPath: string
  resolvedApplyPlanPath: string
  resolvedBoundaryPath: string
  resolvedBackupDir: string
  resolvedReadModelOutputPath: string
  resolvedValidationOutputPath: string
  resolvedOutputPath: string
  resolvedMarkdownPath?: string
  proposal: JsonRecord
  applyPlan: JsonRecord
  boundary: JsonRecord
  graphSource: JsonRecord
  originalGraphSourceText: string
  originalGraphSourceHash: string
  backupPath: string
  operatorId: string
  authorizationRationale: string
}

interface GraphDeltaOperation {
  operationId: string
  targetKind: 'record' | 'node' | 'edge'
  action: 'replace-field'
  targetId: string
  fieldPath: string[]
  expectedBeforeValue: unknown
  afterValue: unknown
}

interface PostApplyValidation {
  status: 'pass'
  projectionPath: string
  graphSourceMutatedHash: string
}

export async function applyGuardedGraphUpdateFile(
  root: string,
  options: GuardedGraphUpdateApplyOptions,
): Promise<GuardedGraphUpdateApplyFileResult> {
  validateRequiredOptions(options)
  validateAuthorization(options)
  const inputs = await loadInputs(root, options)
  await validateAllTargets(root, inputs)
  validateGraphSourceTarget(root, inputs)
  validateApplyPlan(root, inputs)
  validateBoundaryRecord(root, inputs)
  validateProposal(root, inputs)
  compareInputs(root, inputs)
  validateGraphSourceHash(inputs)
  const operations = validateOperations(inputs)

  let backupHash: string | null = null
  try {
    await mkdir(inputs.resolvedBackupDir, { recursive: true })
    await copyFile(inputs.resolvedGraphSourcePath, inputs.backupPath, constants.COPYFILE_EXCL)
    backupHash = await validateBackup(inputs)
  } catch (error) {
    throw new Error(`Guarded Graph Update Apply backup unavailable: ${errorMessage(error)}`)
  }

  const mutatedGraphSource = deepClone(inputs.graphSource)
  applyOperations(mutatedGraphSource, operations)
  const tempGraphSourcePath = `${inputs.resolvedGraphSourcePath}.${process.pid}.${Date.now()}.guarded-apply.tmp`

  try {
    await writeFile(tempGraphSourcePath, `${JSON.stringify(mutatedGraphSource, null, 2)}\n`, 'utf8')
    await validateGraphSourceShapeFromFile(tempGraphSourcePath)
    verifyAfterState(mutatedGraphSource, operations)
  } catch (error) {
    await rm(tempGraphSourcePath, { force: true })
    throw new Error(`Guarded Graph Update Apply mutated graph invalid before replace: ${errorMessage(error)}`)
  }

  let graphSourceMutatedHash: string | null = null
  try {
    await rename(tempGraphSourcePath, inputs.resolvedGraphSourcePath)
    const mutatedText = await readFile(inputs.resolvedGraphSourcePath, 'utf8')
    graphSourceMutatedHash = sha256(mutatedText)
    verifyAfterState(parseJsonObject(mutatedText, 'mutated graph-source'), operations)
    const validation = await writePostApplyValidation(root, inputs, graphSourceMutatedHash)
    return writeReport(
      root,
      inputs,
      buildAppliedReport(root, inputs, operations, graphSourceMutatedHash, validation, backupHash),
    )
  } catch (error) {
    const rollbackStatus = await restoreBackup(inputs)
    const validation = {
      schemaVersion: 1,
      artifactRole: 'devview-guarded-graph-update-post-apply-validation',
      status: 'devview-guarded-graph-update-post-apply-validation-failed-rolled-back',
      postApplyVerificationStatus: 'failed-post-replace-rolled-back',
      error: errorMessage(error),
      rollbackStatus,
      graphDeltaApplied: false,
      graphSourceMutated: false,
      providerInvoked: false,
      networkCallMade: false,
      hooksActivated: false,
      approvalAutomationEnabled: false,
      userAcceptanceAutomated: false,
    }
    await writeJsonAtomic(inputs.resolvedValidationOutputPath, validation)
    return writeReport(
      root,
      inputs,
      buildRolledBackReport(root, inputs, operations, graphSourceMutatedHash, backupHash, rollbackStatus, error),
    )
  } finally {
    await rm(tempGraphSourcePath, { force: true })
  }
}

function validateRequiredOptions(options: GuardedGraphUpdateApplyOptions): void {
  const required: Array<[keyof GuardedGraphUpdateApplyOptions, string]> = [
    ['graphSource', '--graph-source <file>'],
    ['proposal', '--proposal <file>'],
    ['applyPlan', '--apply-plan <file>'],
    ['guardedGraphUpdateBoundaryRecord', '--guarded-graph-update-boundary-record <file>'],
    ['backupDir', '--backup-dir <dir>'],
    ['readModelOutput', '--read-model-output <file>'],
    ['validationOutput', '--validation-output <file>'],
    ['output', '--output <file>'],
    ['operator', '--operator <id>'],
    ['authorizationRationale', '--authorization-rationale <text>'],
  ]
  for (const [key, label] of required) {
    if (!options[key]) {
      throw new Error(`graph read-model apply-guarded-graph-update requires ${label}.`)
    }
  }
}

function validateAuthorization(options: GuardedGraphUpdateApplyOptions): void {
  if (options.authorizeGraphSourceMutation !== true) {
    throw new Error(
      'Guarded Graph Update Apply requires --authorize-graph-source-mutation for explicit graph-source mutation.',
    )
  }
  if (!options.operator.trim()) {
    throw new Error('Guarded Graph Update Apply requires a non-empty --operator value.')
  }
  if (!options.authorizationRationale.trim()) {
    throw new Error('Guarded Graph Update Apply requires a non-empty --authorization-rationale value.')
  }
}

async function loadInputs(root: string, options: GuardedGraphUpdateApplyOptions): Promise<LoadedInputs> {
  const resolvedGraphSourcePath = resolveRepoPath(root, options.graphSource)
  const resolvedProposalPath = resolveRepoPath(root, options.proposal)
  const resolvedApplyPlanPath = resolveRepoPath(root, options.applyPlan)
  const resolvedBoundaryPath = resolveRepoPath(root, options.guardedGraphUpdateBoundaryRecord)
  const resolvedBackupDir = resolveRepoPath(root, options.backupDir)
  const resolvedReadModelOutputPath = resolveRepoPath(root, options.readModelOutput)
  const resolvedValidationOutputPath = resolveRepoPath(root, options.validationOutput)
  const resolvedOutputPath = resolveRepoPath(root, options.output)
  const resolvedMarkdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : undefined
  const originalGraphSourceText = await readFile(resolvedGraphSourcePath, 'utf8')
  const originalGraphSourceHash = sha256(originalGraphSourceText)
  const backupPath = path.join(
    resolvedBackupDir,
    `${path.basename(resolvedGraphSourcePath)}.${originalGraphSourceHash.slice(0, 16)}.backup.json`,
  )
  return {
    resolvedGraphSourcePath,
    resolvedProposalPath,
    resolvedApplyPlanPath,
    resolvedBoundaryPath,
    resolvedBackupDir,
    resolvedReadModelOutputPath,
    resolvedValidationOutputPath,
    resolvedOutputPath,
    ...(resolvedMarkdownPath ? { resolvedMarkdownPath } : {}),
    proposal: await readRequiredJson(resolvedProposalPath, 'Graph Delta proposal'),
    applyPlan: await readRequiredJson(resolvedApplyPlanPath, 'Guarded Graph Update apply plan'),
    boundary: await readRequiredJson(resolvedBoundaryPath, 'Guarded Graph Update boundary record'),
    graphSource: parseJsonObject(originalGraphSourceText, 'graph-source'),
    originalGraphSourceText,
    originalGraphSourceHash,
    backupPath,
    operatorId: options.operator.trim(),
    authorizationRationale: options.authorizationRationale.trim(),
  }
}

async function readRequiredJson(filePath: string, label: string): Promise<JsonRecord> {
  const parsed = await readJsonSafe<unknown>(filePath)
  if (!parsed.ok) {
    throw new Error(`Unable to read ${label}: ${parsed.error}`)
  }
  const record = asRecord(parsed.value)
  if (!record) {
    throw new Error(`Unable to read ${label}: expected JSON object.`)
  }
  return record
}

async function validateAllTargets(root: string, inputs: LoadedInputs): Promise<void> {
  const outputTargets = [
    inputs.resolvedOutputPath,
    inputs.resolvedReadModelOutputPath,
    inputs.resolvedValidationOutputPath,
    inputs.backupPath,
    ...(inputs.resolvedMarkdownPath ? [inputs.resolvedMarkdownPath] : []),
  ]
  const unique = new Set(outputTargets.map((target) => normalizeResolvedPath(target)))
  if (unique.size !== outputTargets.length) {
    throw new Error(
      'Unsafe Guarded Graph Update Apply output paths: output, markdown, backup, read-model, and validation paths must be distinct.',
    )
  }
  const protectedPaths = collectProtectedPaths(root, inputs)
  for (const [label, target] of [
    ['output', inputs.resolvedOutputPath],
    ['markdown', inputs.resolvedMarkdownPath],
    ['read-model-output', inputs.resolvedReadModelOutputPath],
    ['validation-output', inputs.resolvedValidationOutputPath],
    ['backup', inputs.backupPath],
  ] as const) {
    if (target) {
      await validateWritableTarget(root, target, label, protectedPaths)
    }
  }
  validateBackupDir(root, inputs.resolvedBackupDir, protectedPaths)
}

async function validateWritableTarget(
  root: string,
  target: string,
  label: string,
  protectedPaths: Map<string, string>,
): Promise<void> {
  const protectedReason = protectedPaths.get(normalizeResolvedPath(target))
  if (protectedReason) {
    throw new Error(
      `Unsafe Guarded Graph Update Apply ${label} path: ${relativePath(root, target)} would overwrite ${protectedReason}.`,
    )
  }
  const protectedByPath = label === 'backup' ? isProtectedBackupPath(root, target) : isProtectedOutputPath(root, target)
  if (protectedByPath) {
    throw new Error(
      `Unsafe Guarded Graph Update Apply ${label} path: ${relativePath(root, target)} is inside a protected source/control path.`,
    )
  }
  const existingAuthority = await classifyExistingSourceAuthority(target)
  if (existingAuthority) {
    throw new Error(
      `Unsafe Guarded Graph Update Apply ${label} path: ${relativePath(root, target)} already contains ${existingAuthority}.`,
    )
  }
}

function validateBackupDir(root: string, backupDir: string, protectedPaths: Map<string, string>): void {
  if (isProtectedOutputPath(root, backupDir)) {
    throw new Error(
      `Unsafe Guarded Graph Update Apply backup-dir: ${relativePath(root, backupDir)} is inside a protected source/control path.`,
    )
  }
  for (const [protectedPath, reason] of protectedPaths) {
    if (isSubpath(backupDir, protectedPath) || isSubpath(protectedPath, backupDir)) {
      throw new Error(
        `Unsafe Guarded Graph Update Apply backup-dir: ${relativePath(root, backupDir)} overlaps ${reason}.`,
      )
    }
  }
}

function collectProtectedPaths(root: string, inputs: LoadedInputs): Map<string, string> {
  const protectedPaths = new Map<string, string>()
  const add = (filePath: string | undefined | null, reason: string): void => {
    if (filePath) {
      protectedPaths.set(normalizeResolvedPath(filePath), reason)
    }
  }
  add(inputs.resolvedGraphSourcePath, 'the explicit graph-source mutation target')
  add(inputs.resolvedProposalPath, 'the source Graph Delta proposal')
  add(inputs.resolvedApplyPlanPath, 'the source Guarded Graph Update apply plan')
  add(inputs.resolvedBoundaryPath, 'the source Guarded Graph Update boundary record')
  for (const source of [inputs.proposal, inputs.applyPlan, inputs.boundary]) {
    for (const candidate of collectConcretePathStrings(source)) {
      add(resolveRepoPath(root, candidate), `linked source artifact ${candidate}`)
    }
  }
  return protectedPaths
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) return null
  const record = asRecord(parsed.value)
  const artifactRole = stringValue(record?.artifactRole)
  if (artifactRole === REPORT_ROLE) return null
  if (
    artifactRole.startsWith('devview-') ||
    artifactRole.includes('evidence') ||
    artifactRole.includes('graph-source')
  ) {
    return `source artifactRole "${artifactRole}"`
  }
  if (asRecord(record?.sourceRecords)) {
    return 'graph-source-shaped sourceRecords'
  }
  return null
}

function validateGraphSourceTarget(root: string, inputs: LoadedInputs): void {
  const relative = relativePath(root, inputs.resolvedGraphSourcePath)
  if (isProtectedGraphSourceTargetPath(relative)) {
    throw new Error(
      `Guarded Graph Update Apply target is protected: ${relative} is not an allowed explicit graph-source mutation target.`,
    )
  }
  validateGraphSourceShape(inputs.graphSource)
}

function validateApplyPlan(root: string, inputs: LoadedInputs): void {
  const plan = inputs.applyPlan
  if (plan.artifactRole !== APPLY_PLAN_ROLE || plan.status !== APPLY_PLAN_STATUS_READY) {
    throw new Error(`Guarded Graph Update Apply requires apply plan ${APPLY_PLAN_ROLE}/${APPLY_PLAN_STATUS_READY}.`)
  }
  if (plan.applyPlanOnly !== true || plan.graphDeltaApplied !== false || plan.graphSourceMutated !== false) {
    throw new Error('Guarded Graph Update Apply plan must be plan-only and non-mutating.')
  }
  if (plan.applyCommandExecuted !== false) {
    throw new Error('Guarded Graph Update Apply plan must not have executed apply command already.')
  }
  const unresolved = Array.isArray(plan.unresolvedOperations) ? plan.unresolvedOperations : []
  const unsupportedCount = Number(asRecord(plan.operationSummary)?.unsupportedOperationCount ?? 0)
  if (unresolved.length > 0 || unsupportedCount !== 0) {
    throw new Error('Guarded Graph Update Apply plan has unresolved or unsupported operations.')
  }
  const actualGraphSource = relativePath(root, inputs.resolvedGraphSourcePath)
  const actualProposal = relativePath(root, inputs.resolvedProposalPath)
  const actualBoundary = relativePath(root, inputs.resolvedBoundaryPath)
  if (stringValue(plan.sourceGraphSource) !== actualGraphSource) {
    throw new Error('Guarded Graph Update Apply graph-source mismatch: apply plan sourceGraphSource differs.')
  }
  if (stringValue(plan.sourceGraphDeltaProposal) !== actualProposal) {
    throw new Error('Guarded Graph Update Apply proposal mismatch: apply plan sourceGraphDeltaProposal differs.')
  }
  if (stringValue(plan.sourceGuardedGraphUpdateBoundaryRecord) !== actualBoundary) {
    throw new Error(
      'Guarded Graph Update Apply boundary mismatch: apply plan sourceGuardedGraphUpdateBoundaryRecord differs.',
    )
  }
  validateNoUnsafeAuthority(plan, 'Guarded Graph Update apply plan')
}

function validateBoundaryRecord(root: string, inputs: LoadedInputs): void {
  const boundary = inputs.boundary
  if (boundary.artifactRole !== BOUNDARY_ROLE || boundary.status !== BOUNDARY_STATUS_READY) {
    throw new Error(`Guarded Graph Update Apply requires boundary record ${BOUNDARY_ROLE}/${BOUNDARY_STATUS_READY}.`)
  }
  if (boundary.guardedGraphUpdateBoundaryState !== BOUNDARY_STATE) {
    throw new Error('Guarded Graph Update Apply boundary record has unsupported boundary state.')
  }
  if (
    boundary.guardedUpdateReady !== true ||
    boundary.applyDeferred !== true ||
    boundary.applyCommandEnabled !== false ||
    boundary.graphDeltaApplied !== false ||
    boundary.graphSourceMutated !== false ||
    boundary.filesMutated !== false
  ) {
    throw new Error('Guarded Graph Update Apply boundary record must be ready, apply-deferred, and non-mutating.')
  }
  const sourceProposal = stringValue(boundary.sourceGraphDeltaProposal)
  if (sourceProposal && sourceProposal !== relativePath(root, inputs.resolvedProposalPath)) {
    throw new Error('Guarded Graph Update Apply boundary proposal mismatch: sourceGraphDeltaProposal differs.')
  }
  validateNoUnsafeAuthority(boundary, 'Guarded Graph Update boundary record', new Set(['guardedUpdateReady']))
}

function validateProposal(root: string, inputs: LoadedInputs): void {
  const proposal = inputs.proposal
  const artifactRole = stringValue(proposal.artifactRole)
  const schemaId = stringValue(proposal.schemaId)
  if (!proposalRoles.has(artifactRole) && schemaId !== 'devview-graph-update-proposal-v0') {
    throw new Error('Guarded Graph Update Apply proposal has unsupported artifactRole/schemaId.')
  }
  if (proposal.graphDeltaApplied === true || proposal.graphSourceMutated === true) {
    throw new Error('Guarded Graph Update Apply proposal must not already be applied or mutated.')
  }
  const proposalId = stringValue(proposal.proposalId)
  if (proposalId && proposalId !== stringValue(inputs.applyPlan.proposalId)) {
    throw new Error('Guarded Graph Update Apply proposalId differs from apply plan.')
  }
  if (proposalId && stringValue(inputs.boundary.proposalId) && proposalId !== stringValue(inputs.boundary.proposalId)) {
    throw new Error('Guarded Graph Update Apply proposalId differs from boundary record.')
  }
  void root
  validateNoUnsafeAuthority(proposal, 'Graph Delta proposal')
}

function compareInputs(root: string, inputs: LoadedInputs): void {
  const actualPlanBoundary = stringValue(inputs.applyPlan.sourceGuardedGraphUpdateBoundaryRecord)
  const actualBoundary = relativePath(root, inputs.resolvedBoundaryPath)
  if (actualPlanBoundary !== actualBoundary) {
    throw new Error('Guarded Graph Update Apply boundary mismatch: apply plan references a different boundary record.')
  }
  const boundarySourceGraph = stringValue(inputs.boundary.sourceGraphSource)
  if (boundarySourceGraph && boundarySourceGraph !== relativePath(root, inputs.resolvedGraphSourcePath)) {
    throw new Error('Guarded Graph Update Apply graph-source mismatch: boundary sourceGraphSource differs.')
  }
}

function validateGraphSourceHash(inputs: LoadedInputs): void {
  const expectedHash = stringValue(inputs.applyPlan.graphSourceOriginalHash)
  if (!expectedHash || expectedHash !== inputs.originalGraphSourceHash) {
    throw new Error('Guarded Graph Update Apply graphSourceOriginalHash mismatch; graph-source changed after plan.')
  }
}

function validateOperations(inputs: LoadedInputs): GraphDeltaOperation[] {
  const operations = parseGraphDeltaOperations(inputs.proposal, inputs.graphSource)
  compareOperationPreviews(operations, inputs.applyPlan)
  return operations
}

function parseGraphDeltaOperations(proposal: JsonRecord, graphSource: JsonRecord): GraphDeltaOperation[] {
  const rawOperations = proposal.graphDeltaOperations
  if (!Array.isArray(rawOperations) || rawOperations.length === 0) {
    throw new Error('Guarded Graph Update Apply requires non-empty supported graphDeltaOperations.')
  }
  return rawOperations.map((rawOperation, index) => parseOperation(index, rawOperation, graphSource))
}

function parseOperation(index: number, rawOperation: unknown, graphSource: JsonRecord): GraphDeltaOperation {
  const operation = asRecord(rawOperation)
  if (!operation) throw unsupportedOperation(index, 'operation must be an object')
  const operationId = stringValue(operation.operationId)
  const targetKind = stringValue(operation.targetKind)
  const action = stringValue(operation.action)
  const targetId = stringValue(operation.targetId)
  const fieldPath = operation.fieldPath
  if (!operationId) throw unsupportedOperation(index, 'operationId must be a non-empty string')
  if (!['record', 'node', 'edge'].includes(targetKind)) {
    throw unsupportedOperation(index, 'targetKind must be record, node, or edge')
  }
  if (action !== 'replace-field') throw unsupportedOperation(index, 'only replace-field is supported in v1')
  if (!targetId) throw unsupportedOperation(index, 'targetId must be a non-empty string')
  if (!isSafeFieldPath(fieldPath)) {
    throw unsupportedOperation(index, 'fieldPath must be a non-empty array of safe property names')
  }
  if (isIdentityOrCascadeField(targetKind as GraphDeltaOperation['targetKind'], fieldPath)) {
    throw unsupportedOperation(index, 'identity or cascade fields are blocked in v1')
  }
  if (!Object.hasOwn(operation, 'expectedBeforeValue')) {
    throw unsupportedOperation(index, 'expectedBeforeValue is required')
  }
  if (!Object.hasOwn(operation, 'afterValue')) throw unsupportedOperation(index, 'afterValue is required')
  const target = findTarget(graphSource, targetKind as GraphDeltaOperation['targetKind'], targetId)
  if (!target) throw unsupportedOperation(index, `target ${targetId} was not found`)
  const actualBefore = getPath(target, fieldPath)
  if (!deepEqual(actualBefore, operation.expectedBeforeValue)) {
    throw new Error(`Guarded Graph Update Apply expectedBeforeValue mismatch for operation ${operationId}.`)
  }
  return {
    operationId,
    targetKind: targetKind as GraphDeltaOperation['targetKind'],
    action: 'replace-field',
    targetId,
    fieldPath,
    expectedBeforeValue: operation.expectedBeforeValue,
    afterValue: operation.afterValue,
  }
}

function compareOperationPreviews(operations: GraphDeltaOperation[], applyPlan: JsonRecord): void {
  const previews = Array.isArray(applyPlan.operationPreviews) ? applyPlan.operationPreviews : []
  if (previews.length !== operations.length) {
    throw new Error('Guarded Graph Update Apply operation preview count mismatch.')
  }
  for (const operation of operations) {
    const preview = previews.map(asRecord).find((entry) => entry?.operationId === operation.operationId)
    if (!preview) {
      throw new Error(`Guarded Graph Update Apply missing operation preview for ${operation.operationId}.`)
    }
    const matches =
      stringValue(preview.operationId) === operation.operationId &&
      stringValue(preview.targetKind) === operation.targetKind &&
      stringValue(preview.action) === operation.action &&
      stringValue(preview.targetId) === operation.targetId &&
      deepEqual(preview.fieldPath, operation.fieldPath) &&
      deepEqual(preview.beforeValue, operation.expectedBeforeValue) &&
      deepEqual(preview.afterValue, operation.afterValue)
    if (!matches) {
      throw new Error(`Guarded Graph Update Apply operation preview mismatch for ${operation.operationId}.`)
    }
  }
}

async function validateBackup(inputs: LoadedInputs): Promise<string> {
  const backupText = await readFile(inputs.backupPath, 'utf8')
  const backupHash = sha256(backupText)
  if (backupHash !== inputs.originalGraphSourceHash) {
    throw new Error('backup hash does not match original graph-source hash')
  }
  return backupHash
}

function applyOperations(graphSource: JsonRecord, operations: GraphDeltaOperation[]): void {
  for (const operation of operations) {
    const target = findTarget(graphSource, operation.targetKind, operation.targetId)
    if (!target) throw new Error(`Operation target disappeared before apply: ${operation.targetId}`)
    setPath(target, operation.fieldPath, operation.afterValue)
  }
}

function verifyAfterState(graphSource: JsonRecord, operations: GraphDeltaOperation[]): void {
  for (const operation of operations) {
    const target = findTarget(graphSource, operation.targetKind, operation.targetId)
    if (!target) throw new Error(`Operation target missing after apply: ${operation.targetId}`)
    const actualAfter = getPath(target, operation.fieldPath)
    if (!deepEqual(actualAfter, operation.afterValue)) {
      throw new Error(`Operation ${operation.operationId} afterValue did not verify after apply.`)
    }
  }
}

async function writePostApplyValidation(
  root: string,
  inputs: LoadedInputs,
  graphSourceMutatedHash: string,
): Promise<PostApplyValidation> {
  const projection = await projectGraphSourceReadModelToFile(
    root,
    relativePath(root, inputs.resolvedGraphSourcePath),
    relativePath(root, inputs.resolvedReadModelOutputPath),
  )
  const validationArtifact = {
    schemaVersion: 1,
    artifactRole: 'devview-guarded-graph-update-post-apply-validation',
    status: 'devview-guarded-graph-update-post-apply-validation-pass',
    postApplyVerificationStatus: 'pass',
    projectionPath: relativePath(root, projection.projectionJsonPath),
    graphSourceMutatedHash,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    providerInvoked: false,
    networkCallMade: false,
    hooksActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
  }
  await writeJsonAtomic(inputs.resolvedValidationOutputPath, validationArtifact)
  return {
    status: 'pass',
    projectionPath: validationArtifact.projectionPath,
    graphSourceMutatedHash,
  }
}

async function restoreBackup(inputs: LoadedInputs): Promise<GuardedGraphUpdateApplyReport['rollbackStatus']> {
  try {
    await copyFile(inputs.backupPath, inputs.resolvedGraphSourcePath)
    return 'restored-from-backup'
  } catch {
    return 'restore-failed'
  }
}

function buildAppliedReport(
  root: string,
  inputs: LoadedInputs,
  operations: GraphDeltaOperation[],
  graphSourceMutatedHash: string,
  validation: PostApplyValidation,
  backupHash: string | null,
): GuardedGraphUpdateApplyReport {
  return {
    ...baseReport(root, inputs),
    status: 'devview-guarded-graph-update-applied',
    applyStatus: 'applied-graph-source-mutated',
    graphSourceMutatedHash,
    backupCreated: true,
    backupPath: relativePath(root, inputs.backupPath),
    backupHash,
    rollbackAvailable: true,
    rollbackAttempted: false,
    rollbackStatus: 'not-needed',
    mutationApplied: true,
    graphSourceMutated: true,
    graphDeltaApplied: true,
    filesMutated: true,
    mutatedFilePaths: [relativePath(root, inputs.resolvedGraphSourcePath)],
    concreteOperationCount: operations.length,
    appliedOperationIds: operations.map((operation) => operation.operationId),
    operationApplicationSummary: operationSummary(operations),
    readModelRegenerated: true,
    readModelOutputPath: validation.projectionPath,
    validationOutputPath: relativePath(root, inputs.resolvedValidationOutputPath),
    postApplyVerificationStatus: 'pass',
    validationFindings: [
      finding('GUARDED_GRAPH_UPDATE_APPLY_AUTHORIZATION_RECORDED', 'info', 'authorization', {
        message: 'Explicit CLI operator authorization was recorded before graph-source mutation.',
      }),
      finding('GUARDED_GRAPH_UPDATE_APPLY_BACKUP_VERIFIED', 'info', 'backup', {
        message: 'Graph-source backup was created with an original-hash match before mutation.',
      }),
      finding('GUARDED_GRAPH_UPDATE_APPLY_POST_VALIDATION_PASS', 'info', 'postApplyValidation', {
        message: 'Post-apply read-model projection and after-state verification completed.',
      }),
    ],
  }
}

function buildRolledBackReport(
  root: string,
  inputs: LoadedInputs,
  operations: GraphDeltaOperation[],
  graphSourceMutatedHash: string | null,
  backupHash: string | null,
  rollbackStatus: GuardedGraphUpdateApplyReport['rollbackStatus'],
  error: unknown,
): GuardedGraphUpdateApplyReport {
  return {
    ...baseReport(root, inputs),
    status: 'devview-guarded-graph-update-apply-rolled-back',
    applyStatus: 'rolled-back-post-apply-verification-failed',
    graphSourceMutatedHash,
    backupCreated: true,
    backupPath: relativePath(root, inputs.backupPath),
    backupHash,
    rollbackAvailable: true,
    rollbackAttempted: true,
    rollbackStatus,
    mutationApplied: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    filesMutated: false,
    mutatedFilePaths: [],
    concreteOperationCount: operations.length,
    appliedOperationIds: [],
    operationApplicationSummary: operationSummary(operations),
    readModelRegenerated: false,
    readModelOutputPath: relativePath(root, inputs.resolvedReadModelOutputPath),
    validationOutputPath: relativePath(root, inputs.resolvedValidationOutputPath),
    postApplyVerificationStatus: 'failed-post-replace-rolled-back',
    validationFindings: [
      finding('GUARDED_GRAPH_UPDATE_APPLY_POST_VALIDATION_FAILED_ROLLED_BACK', 'error', 'postApplyValidation', {
        message: `Post-apply validation failed after replace and rollback was attempted: ${errorMessage(error)}`,
      }),
    ],
  }
}

function baseReport(
  root: string,
  inputs: LoadedInputs,
): Omit<
  GuardedGraphUpdateApplyReport,
  | 'status'
  | 'applyStatus'
  | 'graphSourceMutatedHash'
  | 'backupCreated'
  | 'backupPath'
  | 'backupHash'
  | 'rollbackAvailable'
  | 'rollbackAttempted'
  | 'rollbackStatus'
  | 'mutationApplied'
  | 'graphSourceMutated'
  | 'graphDeltaApplied'
  | 'filesMutated'
  | 'mutatedFilePaths'
  | 'concreteOperationCount'
  | 'appliedOperationIds'
  | 'operationApplicationSummary'
  | 'readModelRegenerated'
  | 'readModelOutputPath'
  | 'validationOutputPath'
  | 'postApplyVerificationStatus'
  | 'validationFindings'
> {
  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    sourceGraphSource: relativePath(root, inputs.resolvedGraphSourcePath),
    sourceGraphDeltaProposal: relativePath(root, inputs.resolvedProposalPath),
    sourceGuardedGraphUpdateApplyPlan: relativePath(root, inputs.resolvedApplyPlanPath),
    sourceGuardedGraphUpdateBoundaryRecord: relativePath(root, inputs.resolvedBoundaryPath),
    proposalId: stringValue(inputs.proposal.proposalId) || stringValue(inputs.applyPlan.proposalId),
    graphSourceOriginalHash: inputs.originalGraphSourceHash,
    graphSourceCurrentHashBeforeApply: inputs.originalGraphSourceHash,
    applyPlanStatus: stringValue(inputs.applyPlan.status),
    boundaryRecordStatus: stringValue(inputs.boundary.status),
    boundaryGuardedUpdateReady: inputs.boundary.guardedUpdateReady === true,
    boundaryApplyDeferred: inputs.boundary.applyDeferred === true,
    boundaryApplyCommandEnabled: inputs.boundary.applyCommandEnabled === true,
    operatorAuthorizationStatus: 'explicit-cli-operator-authorization-recorded',
    operatorId: inputs.operatorId,
    authorizationRationale: inputs.authorizationRationale,
    authorizationSource: 'explicit-cli-input',
    backupDir: relativePath(root, inputs.resolvedBackupDir),
    providerInvoked: false,
    networkCallMade: false,
    hooksActivated: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    approvalAutomationEnabled: false,
    codexSelfApprovalAllowed: false,
    userAcceptanceAutomated: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    shellCommandsExecuted: false,
    allowedWriteSet: [
      relativePath(root, inputs.resolvedGraphSourcePath),
      relativePath(root, inputs.backupPath),
      relativePath(root, inputs.resolvedReadModelOutputPath),
      relativePath(root, inputs.resolvedValidationOutputPath),
      relativePath(root, inputs.resolvedOutputPath),
      ...(inputs.resolvedMarkdownPath ? [relativePath(root, inputs.resolvedMarkdownPath)] : []),
    ],
    forbiddenMutationTargets: [
      '.github/**',
      '.devview/** control/source files',
      '.codex/**',
      'branch protection',
      'required checks',
      'hooks',
      'global diff rejection',
      'provider/network/API state',
    ],
    writtenOutputPath: null,
    markdownReportPath: null,
    nonExecutionBoundary:
      'This DevView Guarded Graph Update Apply v1 mutates only the explicit graph-source JSON after explicit CLI operator authorization, backup, hash verification, and deterministic replace-field validation. It does not mutate .github, branch protection, required checks, hooks, external CI, provider/network/API state, runtime satisfaction, equivalence proof, Scope/CI authority, or user acceptance.',
  }
}

function operationSummary(
  operations: GraphDeltaOperation[],
): GuardedGraphUpdateApplyReport['operationApplicationSummary'] {
  const targetKinds = new Set(operations.map((operation) => operation.targetKind))
  const fieldPaths = new Set(operations.map((operation) => operation.fieldPath.join('.')))
  return {
    operationCount: operations.length,
    targetKinds: Array.from(targetKinds).sort(),
    fieldPaths: Array.from(fieldPaths).sort(),
    updatedNodeCount: countByTargetKind(operations, 'node'),
    updatedEdgeCount: countByTargetKind(operations, 'edge'),
    updatedRecordCount: countByTargetKind(operations, 'record'),
  }
}

async function writeReport(
  root: string,
  inputs: LoadedInputs,
  report: GuardedGraphUpdateApplyReport,
): Promise<GuardedGraphUpdateApplyFileResult> {
  const finalReport: GuardedGraphUpdateApplyReport = {
    ...report,
    writtenOutputPath: relativePath(root, inputs.resolvedOutputPath),
  }
  await writeJsonAtomic(inputs.resolvedOutputPath, finalReport)
  let markdownReport: string | undefined
  if (inputs.resolvedMarkdownPath) {
    finalReport.markdownReportPath = relativePath(root, inputs.resolvedMarkdownPath)
    markdownReport = finalReport.markdownReportPath
    await writeTextAtomic(inputs.resolvedMarkdownPath, renderGuardedGraphUpdateApplyMarkdown(finalReport))
    await writeJsonAtomic(inputs.resolvedOutputPath, finalReport)
  }
  return {
    report: finalReport,
    outputPath: relativePath(root, inputs.resolvedOutputPath),
    ...(markdownReport ? { markdownReport } : {}),
  }
}

function renderGuardedGraphUpdateApplyMarkdown(report: GuardedGraphUpdateApplyReport): string {
  const findings = report.validationFindings
    .filter((entry) => entry.severity === 'error')
    .map((entry) => `- ${entry.code}: ${entry.message}`)
  const operations = report.appliedOperationIds.length
    ? report.appliedOperationIds.map((operationId) => `- ${operationId}`).join('\n')
    : '- None.'
  return `# DevView Guarded Graph Update Apply

Status: \`${report.status}\`

| Field | Value |
| --- | --- |
| Apply status | \`${report.applyStatus}\` |
| Proposal ID | \`${report.proposalId}\` |
| Graph-source | \`${report.sourceGraphSource}\` |
| Graph delta applied | \`${report.graphDeltaApplied}\` |
| Graph-source mutated | \`${report.graphSourceMutated}\` |
| Files mutated | \`${report.filesMutated}\` |
| Backup | \`${report.backupPath ?? 'not-created'}\` |
| Rollback status | \`${report.rollbackStatus}\` |

## Applied Operations

${operations}

## Blocking Findings

${findings.length ? findings.join('\n') : '- None.'}

## Boundary

${report.nonExecutionBoundary}
`
}

function validateGraphSourceShape(graphSource: JsonRecord): void {
  const sourceRecords = asRecord(graphSource.sourceRecords)
  const hasSourceRecords = sourceRecords && Array.isArray(sourceRecords.nodes) && Array.isArray(sourceRecords.edges)
  const hasTopLevelGraph = Array.isArray(graphSource.nodes) && Array.isArray(graphSource.edges)
  const hasRecordsGraph = Array.isArray(graphSource.records) && Array.isArray(graphSource.nodes)
  if (!hasSourceRecords && !hasTopLevelGraph && !hasRecordsGraph) {
    throw new Error('expected sourceRecords or top-level graph arrays')
  }
}

async function validateGraphSourceShapeFromFile(filePath: string): Promise<void> {
  const parsed = await readJsonSafe<unknown>(filePath)
  if (!parsed.ok) throw new Error(parsed.error)
  const record = asRecord(parsed.value)
  if (!record) throw new Error('expected JSON object')
  validateGraphSourceShape(record)
}

function findTarget(
  graphSource: JsonRecord,
  targetKind: GraphDeltaOperation['targetKind'],
  targetId: string,
): JsonRecord | null {
  const sourceRecords = asRecord(graphSource.sourceRecords)
  const collection =
    targetKind === 'record'
      ? firstArray(graphSource.records, sourceRecords?.records)
      : targetKind === 'node'
        ? firstArray(graphSource.nodes, sourceRecords?.nodes)
        : firstArray(graphSource.edges, sourceRecords?.edges)
  const target = collection.find((entry) => asRecord(entry)?.id === targetId)
  return asRecord(target)
}

function firstArray(...values: unknown[]): unknown[] {
  return values.find((value): value is unknown[] => Array.isArray(value)) ?? []
}

function getPath(source: JsonRecord, fieldPath: string[]): unknown {
  let cursor: unknown = source
  for (const part of fieldPath) {
    const record = asRecord(cursor)
    if (!record) return undefined
    cursor = record[part]
  }
  return cursor
}

function setPath(source: JsonRecord, fieldPath: string[], value: unknown): void {
  let cursor: JsonRecord = source
  for (const part of fieldPath.slice(0, -1)) {
    const next = asRecord(cursor[part])
    if (!next) throw new Error(`Cannot set nested path ${fieldPath.join('.')}`)
    cursor = next
  }
  cursor[fieldPath[fieldPath.length - 1] ?? ''] = value
}

function isSafeFieldPath(value: unknown): value is string[] {
  const forbidden = new Set(['__proto__', 'prototype', 'constructor'])
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 4 &&
    value.every((part) => typeof part === 'string' && /^[A-Za-z0-9_-]+$/.test(part) && !forbidden.has(part))
  )
}

function isIdentityOrCascadeField(targetKind: GraphDeltaOperation['targetKind'], fieldPath: string[]): boolean {
  const first = fieldPath[0]
  if (first === 'id') return true
  if (targetKind === 'edge' && ['from', 'to', 'source', 'target'].includes(first ?? '')) return true
  return false
}

function unsupportedOperation(index: number, message: string): Error {
  return new Error(`Guarded Graph Update Apply unsupported operation at graphDeltaOperations[${index}]: ${message}.`)
}

function countByTargetKind(operations: GraphDeltaOperation[], targetKind: GraphDeltaOperation['targetKind']): number {
  return new Set(
    operations.filter((operation) => operation.targetKind === targetKind).map((operation) => operation.targetId),
  ).size
}

function validateNoUnsafeAuthority(record: JsonRecord, label: string, allowedTrueFields = new Set<string>()): void {
  const hits = collectUnsafeAuthorityHits(record, [], new Set(), allowedTrueFields)
  if (hits.length > 0) {
    throw new Error(`Unsafe ${label}: ${hits[0]?.field} must not be true for Guarded Graph Update Apply.`)
  }
}

function collectUnsafeAuthorityHits(
  value: unknown,
  pathParts: string[] = [],
  seen = new Set<unknown>(),
  allowedTrueFields = new Set<string>(),
): Array<{ field: string }> {
  if (typeof value !== 'object' || value === null || seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectUnsafeAuthorityHits(entry, [...pathParts, String(index)], seen, allowedTrueFields),
    )
  }
  const record = value as JsonRecord
  const hits: Array<{ field: string }> = []
  for (const [key, entry] of Object.entries(record)) {
    const nextPath = [...pathParts, key]
    if (unsafeAuthorityFields.includes(key) && entry === true && !allowedTrueFields.has(key)) {
      hits.push({ field: nextPath.join('.') })
    }
    hits.push(...collectUnsafeAuthorityHits(entry, nextPath, seen, allowedTrueFields))
  }
  return hits
}

function isProtectedGraphSourceTargetPath(relative: string): boolean {
  return (
    hasDevViewControlDirectory(relative) ||
    hasCodexControlDirectory(relative) ||
    hasHiddenControlDirectorySegment(relative) ||
    /^\.github\//i.test(relative) ||
    /(^|\/)(generated|read-model|source-authority|project-memory)(\/|\.|-)/i.test(relative)
  )
}

function isProtectedOutputPath(root: string, filePath: string): boolean {
  const relative = relativePath(root, filePath)
  return (
    hasDevViewControlDirectory(relative) ||
    hasCodexControlDirectory(relative) ||
    hasHiddenControlDirectorySegment(relative) ||
    /^\.github\//i.test(relative) ||
    /(^|\/)(graph-source|source-authority|project-memory)(\.|-)/i.test(relative)
  )
}

function isProtectedBackupPath(root: string, filePath: string): boolean {
  const relative = relativePath(root, filePath)
  return (
    hasDevViewControlDirectory(relative) ||
    hasCodexControlDirectory(relative) ||
    hasHiddenControlDirectorySegment(relative) ||
    /^\.github\//i.test(relative) ||
    /(^|\/)(source-authority|project-memory)(\.|-)/i.test(relative)
  )
}

function collectConcretePathStrings(value: unknown, seen = new Set<unknown>()): string[] {
  if (typeof value === 'string') return looksLikePath(value) ? [value] : []
  if (typeof value !== 'object' || value === null || seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) return value.flatMap((entry) => collectConcretePathStrings(entry, seen))
  return Object.values(value as JsonRecord).flatMap((entry) => collectConcretePathStrings(entry, seen))
}

function looksLikePath(value: string): boolean {
  return (
    value.includes('/') ||
    value.includes('\\') ||
    value.startsWith('.') ||
    /\.(json|md|txt|html|yml|yaml)$/i.test(value)
  )
}

function isSubpath(parent: string, child: string): boolean {
  const relative = path.relative(parent, child)
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative)
}

function finding(
  code: string,
  severity: GuardedGraphUpdateApplyFinding['severity'],
  field: string,
  input: { message: string; expected?: unknown; actual?: unknown },
): GuardedGraphUpdateApplyFinding {
  return {
    code,
    severity,
    message: input.message,
    field,
    ...(input.expected !== undefined ? { expected: input.expected } : {}),
    ...(input.actual !== undefined ? { actual: input.actual } : {}),
  }
}

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : null
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function resolveRepoPath(root: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(root, inputPath)
}

function normalizeResolvedPath(filePath: string): string {
  return path.resolve(filePath).replaceAll('\\', '/').toLowerCase()
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function parseJsonObject(text: string, label: string): JsonRecord {
  try {
    const parsed = JSON.parse(text.replace(/^\uFEFF/, '')) as unknown
    const record = asRecord(parsed)
    if (!record) throw new Error('expected JSON object')
    return record
  } catch (error) {
    throw new Error(`Unable to parse ${label}: ${errorMessage(error)}`)
  }
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
