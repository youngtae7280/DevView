import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Guarded Graph Update Apply Plan CLI', () => {
  it('creates a deterministic before/after apply plan without mutating graph-source', async () => {
    const workspace = createWorkspace()
    writePlanInputs(workspace)
    const graphSourceBefore = readFileSync(join(workspace, 'graph-source.json'), 'utf8')

    const result = await runPlan(workspace)
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/apply-plan.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-guarded-graph-update-apply-plan')
    expect(payload.status).toBe('devview-guarded-graph-update-apply-plan-ready')
    expect(payload.applyPlanStatus).toBe('ready-deterministic-diff-preview-created')
    expect(payload.sourceGraphSource).toBe('graph-source.json')
    expect(payload.sourceGraphDeltaProposal).toBe('proposal.json')
    expect(payload.sourceGuardedGraphUpdateBoundaryRecord).toBe('boundary.json')
    expect(payload.operationSummary.supportedOperationCount).toBe(1)
    expect(payload.operationSummary.updatedNodeCount).toBe(1)
    expect(payload.operationPreviews[0]).toMatchObject({
      operationId: 'op-1',
      operationKind: 'update-node',
      targetKind: 'node',
      targetId: 'node-1',
      fieldPath: ['metadata', 'status'],
      beforeValue: 'old',
      afterValue: 'new',
    })
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.applyPlanOnly).toBe(true)
    expect(payload.applyCommandExecuted).toBe(false)
    expect(payload.providerInvoked).toBe(false)
    expect(payload.networkCallMade).toBe(false)
    expect(payload.hooksActivated).toBe(false)
    expect(payload.approvalAutomationEnabled).toBe(false)
    expect(payload.userAcceptanceAutomated).toBe(false)
    expect(written.graphDeltaApplied).toBe(false)
    expect(written.graphSourceMutated).toBe(false)
    expect(existsSync(join(workspace, '.tmp/apply-plan.md'))).toBe(true)
    expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(graphSourceBefore)
  })

  it('writes a blocked non-mutating plan when proposal has no concrete operations', async () => {
    const workspace = createWorkspace()
    writePlanInputs(workspace, { proposal: { graphDeltaOperations: [] } })

    const result = await runPlan(workspace)
    const payload = JSON.parse(result.stderr)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/apply-plan.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.status).toBe('devview-guarded-graph-update-apply-plan-blocked')
    expect(payload.applyPlanStatus).toBe('blocked-no-concrete-operations')
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.applyPlanOnly).toBe(true)
    expect(written.status).toBe('devview-guarded-graph-update-apply-plan-blocked')
  })

  it('blocks invalid graph-source before writing outputs', async () => {
    const workspace = createWorkspace()
    writePlanInputs(workspace, { graphSource: { sourceRecords: { nodes: 'not-an-array', edges: 'not-an-array' } } })

    const result = await runPlan(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('Invalid graph-source')
    expect(existsSync(join(workspace, '.tmp/apply-plan.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/apply-plan.md'))).toBe(false)
  })

  it('blocks boundary records that are not ready or have unsafe mutation flags with zero writes', async () => {
    for (const boundary of [{ status: 'devview-guarded-graph-update-boundary-blocked' }, { graphDeltaApplied: true }]) {
      const workspace = createWorkspace()
      writePlanInputs(workspace, { boundary })

      const result = await runPlan(workspace)

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues[0].message).toContain('Guarded Graph Update boundary record')
      expect(existsSync(join(workspace, '.tmp/apply-plan.json'))).toBe(false)
      expect(existsSync(join(workspace, '.tmp/apply-plan.md'))).toBe(false)
    }
  })

  it('blocks proposal mismatches where boundary fields are comparable', async () => {
    const workspace = createWorkspace()
    writePlanInputs(workspace, { boundary: { proposalId: 'other-proposal' } })

    const result = await runPlan(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('proposalId differs')
    expect(existsSync(join(workspace, '.tmp/apply-plan.json'))).toBe(false)
  })

  it('blocks protected output/source overwrites and output collisions with zero writes', async () => {
    const workspace = createWorkspace()
    writePlanInputs(workspace)
    const graphSourceBefore = readFileSync(join(workspace, 'graph-source.json'), 'utf8')

    const sourceOverwrite = await runPlan(workspace, { output: 'graph-source.json' })
    expect(sourceOverwrite.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(sourceOverwrite.stderr).issues[0].message).toContain('would overwrite')
    expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(graphSourceBefore)

    const collision = await runPlan(workspace, {
      output: '.tmp/apply-plan.json',
      markdown: '.tmp/apply-plan.json',
    })
    expect(collision.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(collision.stderr).issues[0].message).toContain('--output and --markdown must differ')
    expect(existsSync(join(workspace, '.tmp/apply-plan.json'))).toBe(false)
  })
})

function writePlanInputs(
  workspace: string,
  overrides: {
    graphSource?: Record<string, unknown>
    proposal?: Record<string, unknown>
    boundary?: Record<string, unknown>
  } = {},
): void {
  writeJson(join(workspace, 'graph-source.json'), {
    ...validGraphSource(),
    ...overrides.graphSource,
  })
  writeJson(join(workspace, 'proposal.json'), {
    ...validProposal(),
    ...overrides.proposal,
  })
  writeJson(join(workspace, 'boundary.json'), {
    ...validBoundaryRecord(),
    ...overrides.boundary,
  })
}

async function runPlan(
  workspace: string,
  options: { output?: string; markdown?: string } = {},
): Promise<Awaited<ReturnType<typeof runDevViewCli>>> {
  return runDevViewCli(
    [
      'graph',
      'read-model',
      'plan-guarded-graph-update',
      '--graph-source',
      'graph-source.json',
      '--proposal',
      'proposal.json',
      '--guarded-graph-update-boundary-record',
      'boundary.json',
      '--output',
      options.output ?? '.tmp/apply-plan.json',
      '--markdown',
      options.markdown ?? '.tmp/apply-plan.md',
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function validGraphSource(): Record<string, unknown> {
  return {
    sourceRecords: {
      nodes: [
        {
          id: 'node-1',
          type: 'Work',
          title: 'Add todo',
          metadata: {
            status: 'old',
          },
        },
      ],
      edges: [
        {
          id: 'edge-1',
          from: 'node-1',
          to: 'node-1',
          type: 'self',
        },
      ],
    },
    graphSourceMutated: false,
    graphDeltaApplied: false,
  }
}

function validProposal(): Record<string, unknown> {
  return {
    schemaId: 'devview-graph-update-proposal-v0',
    artifactRole: 'graph-delta-proposal-only-preview',
    status: 'generated-proposal-only-preview',
    proposalId: 'GDP-TEST',
    proposalOnly: true,
    approvalStatus: 'not-approved',
    nonEnforcing: true,
    enforcementStatus: 'not-enforced',
    graphDeltaOperations: [
      {
        operationId: 'op-1',
        targetKind: 'node',
        action: 'replace-field',
        targetId: 'node-1',
        fieldPath: ['metadata', 'status'],
        expectedBeforeValue: 'old',
        afterValue: 'new',
      },
    ],
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
    sourceGraphDeltaProposal: 'proposal.json',
    proposalId: 'GDP-TEST',
    operationSummary: {
      operationCount: 1,
      operationSourceField: 'graphDeltaOperations',
      operationKinds: ['update-node'],
    },
    chainComparisonStatus: 'matched-known-provenance-fields',
    chainComparisonLimitations: [],
    guardedUpdateReady: true,
    applyCommandEnabled: false,
    applyDeferred: true,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    requiredChecksConfigured: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    hooksActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    providerInvoked: false,
    networkCallMade: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    shellCommandsExecuted: false,
    filesMutated: false,
    nonMutatingBoundary: true,
  }
}
