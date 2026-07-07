import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())
const sourceFixture = join(pluginRoot, 'examples/valid/todo-app-devview-run/graph-source.json')

afterEach(() => {
  cleanupWorkspaces()
})

describe('Guarded Graph Update Apply CLI', () => {
  it('applies one authorized replace-field operation to a temp graph-source copy', async () => {
    const workspace = createWorkspace()
    writeApplyInputs(workspace)
    const graphBefore = readFileSync(join(workspace, 'graph-source.json'), 'utf8')

    const result = await runApply(workspace)
    const payload = JSON.parse(result.stdout)
    const graphAfter = JSON.parse(readFileSync(join(workspace, 'graph-source.json'), 'utf8'))
    const report = JSON.parse(readFileSync(join(workspace, '.tmp/apply-report.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-guarded-graph-update-apply-report')
    expect(payload.status).toBe('devview-guarded-graph-update-applied')
    expect(payload.operatorAuthorizationStatus).toBe('explicit-cli-operator-authorization-recorded')
    expect(payload.graphDeltaApplied).toBe(true)
    expect(payload.graphSourceMutated).toBe(true)
    expect(payload.filesMutated).toBe(true)
    expect(payload.providerInvoked).toBe(false)
    expect(payload.networkCallMade).toBe(false)
    expect(payload.hooksActivated).toBe(false)
    expect(payload.approvalAutomationEnabled).toBe(false)
    expect(payload.userAcceptanceAutomated).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(nodeStatus(graphAfter, 'WT-1')).toBe('implemented_verified')
    expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).not.toBe(graphBefore)
    expect(
      existsSync(
        join(workspace, '.tmp/backups/graph-source.json.' + sha256(graphBefore).slice(0, 16) + '.backup.json'),
      ),
    ).toBe(true)
    expect(existsSync(join(workspace, '.tmp/read-model.json'))).toBe(true)
    expect(existsSync(join(workspace, '.tmp/post-apply-validation.json'))).toBe(true)
    expect(existsSync(join(workspace, '.tmp/apply-report.md'))).toBe(true)
    expect(report.graphDeltaApplied).toBe(true)
    expect(report.graphSourceMutated).toBe(true)
    expect(report.filesMutated).toBe(true)
  })

  it('requires explicit authorization before any backup or output write', async () => {
    const workspace = createWorkspace()
    writeApplyInputs(workspace)
    const graphBefore = readFileSync(join(workspace, 'graph-source.json'), 'utf8')

    const result = await runApply(workspace, { authorize: false })

    expect(result.exitCode).not.toBe(ExitCode.Success)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('--authorize-graph-source-mutation')
    expectNoWrites(workspace)
    expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(graphBefore)
  })

  it('blocks wrong or blocked apply plans with zero writes', async () => {
    for (const applyPlan of [
      { status: 'devview-guarded-graph-update-apply-plan-blocked' },
      { artifactRole: 'devview-guarded-graph-update-boundary-record' },
    ]) {
      const workspace = createWorkspace()
      writeApplyInputs(workspace, { applyPlan })
      const graphBefore = readFileSync(join(workspace, 'graph-source.json'), 'utf8')

      const result = await runApply(workspace)

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues[0].message).toContain('apply plan')
      expectNoWrites(workspace)
      expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(graphBefore)
    }
  })

  it('blocks boundary/proposal mismatches with zero writes', async () => {
    const workspace = createWorkspace()
    writeApplyInputs(workspace, { boundary: { proposalId: 'OTHER' } })

    const result = await runApply(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('proposalId differs')
    expectNoWrites(workspace)
  })

  it('blocks current graph-source hash mismatch with zero writes', async () => {
    const workspace = createWorkspace()
    writeApplyInputs(workspace)
    const graph = JSON.parse(readFileSync(join(workspace, 'graph-source.json'), 'utf8'))
    graph.sourceRecords.nodes[0].status = 'changed-after-plan'
    writeJson(join(workspace, 'graph-source.json'), graph)

    const result = await runApply(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('graphSourceOriginalHash mismatch')
    expectNoWrites(workspace)
  })

  it('blocks unsupported operations, target misses, expected-before mismatches, and identity fields', async () => {
    for (const operation of [
      { action: 'add-node' },
      { targetId: 'missing-node' },
      { expectedBeforeValue: 'not-the-current-value' },
      { fieldPath: ['id'], expectedBeforeValue: 'WT-1', afterValue: 'WT-2' },
    ]) {
      const workspace = createWorkspace()
      writeApplyInputs(workspace, { operation })
      const graphBefore = readFileSync(join(workspace, 'graph-source.json'), 'utf8')

      const result = await runApply(workspace)

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expectNoWrites(workspace)
      expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(graphBefore)
    }
  })

  it('blocks backup collisions before graph-source mutation', async () => {
    const workspace = createWorkspace()
    writeApplyInputs(workspace)
    const graphBefore = readFileSync(join(workspace, 'graph-source.json'), 'utf8')
    mkdirSync(join(workspace, '.tmp/backups'), { recursive: true })
    writeFileSync(
      join(workspace, '.tmp/backups/graph-source.json.' + sha256(graphBefore).slice(0, 16) + '.backup.json'),
      'already exists',
      'utf8',
    )

    const result = await runApply(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('backup unavailable')
    expect(existsSync(join(workspace, '.tmp/apply-report.json'))).toBe(false)
    expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(graphBefore)
  })

  it('rolls back when post-apply validation output cannot be written', async () => {
    const workspace = createWorkspace()
    writeApplyInputs(workspace)
    const graphBefore = readFileSync(join(workspace, 'graph-source.json'), 'utf8')
    mkdirSync(join(workspace, '.tmp/read-model-as-dir'), { recursive: true })

    const result = await runApply(workspace, { readModelOutput: '.tmp/read-model-as-dir' })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.status).toBe('devview-guarded-graph-update-apply-rolled-back')
    expect(payload.rollbackAttempted).toBe(true)
    expect(payload.rollbackStatus).toBe('restored-from-backup')
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.filesMutated).toBe(false)
    expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(graphBefore)
    expect(existsSync(join(workspace, '.tmp/apply-report.json'))).toBe(true)
  })

  it('blocks source overwrites, output collisions, and protected targets with zero writes', async () => {
    const sourceOverwrite = createWorkspace()
    writeApplyInputs(sourceOverwrite)
    const overwrite = await runApply(sourceOverwrite, { output: 'proposal.json' })
    expect(overwrite.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(overwrite.stderr).issues[0].message).toContain('would overwrite')
    expectNoWrites(sourceOverwrite)

    const collisionWorkspace = createWorkspace()
    writeApplyInputs(collisionWorkspace)
    const collision = await runApply(collisionWorkspace, {
      output: '.tmp/apply-report.json',
      markdown: '.tmp/apply-report.json',
    })
    expect(collision.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(collision.stderr).issues[0].message).toContain('must be distinct')
    expectNoWrites(collisionWorkspace)

    const protectedWorkspace = createWorkspace()
    writeApplyInputs(protectedWorkspace)
    const protectedResult = await runApply(protectedWorkspace, { graphSource: '.devview/graph-source.json' })
    expect(protectedResult.exitCode).toBe(ExitCode.ValidationFailed)
  })
})

function writeApplyInputs(
  workspace: string,
  overrides: {
    operation?: Record<string, unknown>
    proposal?: Record<string, unknown>
    applyPlan?: Record<string, unknown>
    boundary?: Record<string, unknown>
  } = {},
): void {
  const graphSource = JSON.parse(readFileSync(sourceFixture, 'utf8')) as Record<string, unknown>
  writeJson(join(workspace, 'graph-source.json'), graphSource)
  const graphText = readFileSync(join(workspace, 'graph-source.json'), 'utf8')
  const operation = { ...validOperation(), ...overrides.operation }
  const proposal = {
    ...validProposal(operation),
    ...overrides.proposal,
  }
  const boundary = {
    ...validBoundaryRecord(),
    ...overrides.boundary,
  }
  const applyPlan = {
    ...validApplyPlan(sha256(graphText), operation),
    ...overrides.applyPlan,
  }
  writeJson(join(workspace, 'proposal.json'), proposal)
  writeJson(join(workspace, 'boundary.json'), boundary)
  writeJson(join(workspace, 'apply-plan.json'), applyPlan)
}

async function runApply(
  workspace: string,
  options: {
    graphSource?: string
    output?: string
    markdown?: string
    readModelOutput?: string
    validationOutput?: string
    authorize?: boolean
  } = {},
): Promise<Awaited<ReturnType<typeof runDevViewCli>>> {
  const args = [
    'graph',
    'read-model',
    'apply-guarded-graph-update',
    '--graph-source',
    options.graphSource ?? 'graph-source.json',
    '--proposal',
    'proposal.json',
    '--apply-plan',
    'apply-plan.json',
    '--guarded-graph-update-boundary-record',
    'boundary.json',
    '--backup-dir',
    '.tmp/backups',
    '--read-model-output',
    options.readModelOutput ?? '.tmp/read-model.json',
    '--validation-output',
    options.validationOutput ?? '.tmp/post-apply-validation.json',
    '--output',
    options.output ?? '.tmp/apply-report.json',
    '--operator',
    'devview-test-operator',
    '--authorization-rationale',
    'Test operator authorizes mutation of a temp graph-source copy.',
    '--markdown',
    options.markdown ?? '.tmp/apply-report.md',
    '--json',
  ]
  if (options.authorize !== false) {
    args.splice(args.length - 3, 0, '--authorize-graph-source-mutation')
  }
  return runDevViewCli(args, { cwd: workspace, pluginRoot })
}

function expectNoWrites(workspace: string): void {
  expect(existsSync(join(workspace, '.tmp/apply-report.json'))).toBe(false)
  expect(existsSync(join(workspace, '.tmp/apply-report.md'))).toBe(false)
  expect(existsSync(join(workspace, '.tmp/read-model.json'))).toBe(false)
  expect(existsSync(join(workspace, '.tmp/post-apply-validation.json'))).toBe(false)
  expect(existsSync(join(workspace, '.tmp/backups'))).toBe(false)
}

function validOperation(): Record<string, unknown> {
  return {
    operationId: 'op-1',
    targetKind: 'node',
    action: 'replace-field',
    targetId: 'WT-1',
    fieldPath: ['status'],
    expectedBeforeValue: 'implemented',
    afterValue: 'implemented_verified',
  }
}

function validProposal(operation: Record<string, unknown>): Record<string, unknown> {
  return {
    schemaId: 'devview-graph-update-proposal-v0',
    artifactRole: 'graph-delta-proposal-only-preview',
    status: 'generated-proposal-only-preview',
    proposalId: 'GDP-TEST',
    proposalOnly: true,
    approvalStatus: 'not-approved',
    nonEnforcing: true,
    enforcementStatus: 'not-enforced',
    graphDeltaOperations: [operation],
    graphDeltaApplied: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    providerInvoked: false,
    networkCallMade: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
  }
}

function validBoundaryRecord(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-guarded-graph-update-boundary-record',
    status: 'devview-guarded-graph-update-boundary-ready',
    guardedGraphUpdateBoundaryState: 'ready-for-future-guarded-graph-update-apply-command-no-mutation',
    sourceGraphSource: 'graph-source.json',
    sourceGraphDeltaProposal: 'proposal.json',
    proposalId: 'GDP-TEST',
    guardedUpdateReady: true,
    applyCommandEnabled: false,
    applyDeferred: true,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    filesMutated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    providerInvoked: false,
    networkCallMade: false,
    hooksActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
  }
}

function validApplyPlan(graphSourceOriginalHash: string, operation: Record<string, unknown>): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-guarded-graph-update-apply-plan',
    status: 'devview-guarded-graph-update-apply-plan-ready',
    applyPlanStatus: 'ready-deterministic-diff-preview-created',
    sourceGraphSource: 'graph-source.json',
    sourceGraphDeltaProposal: 'proposal.json',
    sourceGuardedGraphUpdateBoundaryRecord: 'boundary.json',
    proposalId: 'GDP-TEST',
    graphSourceOriginalHash,
    operationSummary: {
      operationCount: 1,
      supportedOperationCount: 1,
      unsupportedOperationCount: 0,
    },
    operationPreviews: [
      {
        operationId: operation.operationId,
        operationKind: 'update-node',
        targetKind: operation.targetKind,
        action: operation.action,
        targetId: operation.targetId,
        fieldPath: operation.fieldPath,
        beforeValue: operation.expectedBeforeValue,
        afterValue: operation.afterValue,
      },
    ],
    unresolvedOperations: [],
    validationFindings: [],
    applyPlanOnly: true,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    applyCommandExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
    hooksActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
  }
}

function nodeStatus(graphSource: Record<string, unknown>, nodeId: string): unknown {
  const sourceRecords = graphSource.sourceRecords as { nodes: Array<Record<string, unknown>> }
  return sourceRecords.nodes.find((node) => node.id === nodeId)?.status
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
