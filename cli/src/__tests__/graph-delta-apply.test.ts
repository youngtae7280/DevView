import { createHash } from 'node:crypto'
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

describe('Graph Delta Apply CLI', () => {
  it('applies a concrete replace-field operation in a temp graph-source with backup and post-validation', async () => {
    const workspace = workspaceWithApplyInputs()

    const result = await runApply(workspace)
    const payload = JSON.parse(result.stdout)
    const graphSource = JSON.parse(readFileSync(join(workspace, 'graph-source.json'), 'utf8'))
    const target = graphSource.sourceRecords.nodes.find((entry: { id: string }) => entry.id === 'PT-ROOT')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-graph-delta-apply-report')
    expect(payload.status).toBe('devview-graph-delta-apply-applied')
    expect(payload.applyStatus).toBe('applied-graph-source-mutated')
    expect(payload.backupCreated).toBe(true)
    expect(payload.rollbackAvailable).toBe(true)
    expect(payload.readModelRegenerated).toBe(true)
    expect(payload.consistencyCheckStatus).toBe('pass')
    expect(payload.graphSourceMutated).toBe(true)
    expect(payload.graphDeltaApplied).toBe(true)
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(target.freshnessStatus).toBe('fresh-after-apply-test')
    expect(existsSync(join(workspace, '.tmp/read-model.json'))).toBe(true)
    expect(existsSync(join(workspace, '.tmp/validation.json'))).toBe(true)
  })

  it('blocks proposal-only previews with no concrete operations without writing graph-source', async () => {
    const workspace = workspaceWithApplyInputs({ proposal: proposalOnlyPreview() })
    const before = readFileSync(join(workspace, 'graph-source.json'), 'utf8')

    const result = await runApply(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.status).toBe('devview-graph-delta-apply-blocked')
    expect(payload.applyStatus).toBe('blocked-no-concrete-mutation-operations')
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/backups'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/read-model.json'))).toBe(false)
  })

  it('blocks not-ready dry-run reports before backup or mutation', async () => {
    const workspace = workspaceWithApplyInputs({
      dryRun: { ...validDryRun(), status: 'devview-approved-apply-dry-run-blocked' },
    })
    const before = readFileSync(join(workspace, 'graph-source.json'), 'utf8')

    const result = await runApply(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.applyStatus).toBe('blocked-dry-run-not-ready')
    expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/backups'))).toBe(false)
  })

  it('blocks proposal mismatch before mutation', async () => {
    const workspace = workspaceWithApplyInputs({ proposal: validProposal({ proposalId: 'GDP-OTHER' }) })

    const result = await runApply(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.applyStatus).toBe('blocked-proposal-mismatch')
    expect(payload.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'GRAPH_DELTA_APPLY_PROPOSAL_ID_MISMATCH',
    )
  })

  it('blocks protected graph-source targets', async () => {
    const workspace = workspaceWithApplyInputs({ graphSourcePath: '.devview/graph-source.json' })

    const result = await runApply(workspace, { graphSource: '.devview/graph-source.json' })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.applyStatus).toBe('blocked-protected-target')
    expect(payload.graphSourceMutated).toBe(false)
  })

  it('blocks unsupported operation shapes before backup or mutation', async () => {
    const workspace = workspaceWithApplyInputs({
      proposal: validProposal({
        graphDeltaOperations: [
          {
            operationId: 'op-unsupported',
            targetKind: 'node',
            action: 'remove',
            targetId: 'PT-ROOT',
            fieldPath: ['freshnessStatus'],
            expectedBeforeValue: 'fresh',
            afterValue: 'gone',
          },
        ],
      }),
    })

    const result = await runApply(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.applyStatus).toBe('blocked-unsupported-operation-shape')
    expect(existsSync(join(workspace, '.tmp/backups'))).toBe(false)
  })

  it('blocks expectedBeforeValue mismatch before mutation', async () => {
    const workspace = workspaceWithApplyInputs({
      proposal: validProposal({
        graphDeltaOperations: [
          {
            ...validOperation(),
            expectedBeforeValue: 'stale-value',
          },
        ],
      }),
    })

    const result = await runApply(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.applyStatus).toBe('blocked-unsupported-operation-shape')
    expect(payload.validationFindings.map((finding: { code: string }) => finding.code)).toContain(
      'GRAPH_DELTA_APPLY_EXPECTED_BEFORE_MISMATCH',
    )
  })

  it('blocks backup failure before mutation', async () => {
    const workspace = workspaceWithApplyInputs()
    const graphSourceText = readFileSync(join(workspace, 'graph-source.json'), 'utf8')
    const backupHash = sha256(graphSourceText).slice(0, 16)
    writeJson(join(workspace, `.tmp/backups/graph-source.json.${backupHash}.backup.json`), { occupied: true })

    const result = await runApply(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.applyStatus).toBe('blocked-backup-unavailable')
    expect(payload.graphSourceMutated).toBe(false)
  })

  it('rolls back when post-mutation read-model validation fails', async () => {
    const workspace = workspaceWithApplyInputs({
      proposal: validProposal({
        graphDeltaOperations: [
          {
            operationId: 'op-break-id',
            targetKind: 'node',
            action: 'replace-field',
            targetId: 'PT-ROOT',
            fieldPath: ['id'],
            expectedBeforeValue: 'PT-ROOT',
            afterValue: 'PT-ROOT-BROKEN',
          },
        ],
      }),
    })
    const before = readFileSync(join(workspace, 'graph-source.json'), 'utf8')

    const result = await runApply(workspace)
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.status).toBe('devview-graph-delta-apply-rolled-back')
    expect(payload.applyStatus).toBe('rolled-back-post-validation-failed')
    expect(payload.rollbackAttempted).toBe(true)
    expect(payload.rollbackStatus).toBe('restored-from-backup')
    expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(before)
  })

  it('rejects unsafe markdown paths before mutation or JSON output', async () => {
    const workspace = workspaceWithApplyInputs()
    const before = readFileSync(join(workspace, 'graph-source.json'), 'utf8')

    const result = await runApply(workspace, { markdown: 'graph-source.json' })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('would overwrite the target graph-source input')
    expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/apply.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/backups'))).toBe(false)
  })
})

function workspaceWithApplyInputs(
  input: {
    dryRun?: Record<string, unknown>
    proposal?: Record<string, unknown>
    mutationPolicy?: Record<string, unknown>
    graphSourcePath?: string
  } = {},
): string {
  const workspace = createWorkspace()
  const graphSourcePath = input.graphSourcePath ?? 'graph-source.json'
  writeJson(join(workspace, 'dry-run.json'), input.dryRun ?? validDryRun())
  writeJson(join(workspace, 'proposal.json'), input.proposal ?? validProposal())
  writeJson(join(workspace, 'mutation-policy.json'), input.mutationPolicy ?? validMutationPolicy())
  writeJson(join(workspace, graphSourcePath), graphSourceFixture())
  return workspace
}

async function runApply(
  workspace: string,
  options: { graphSource?: string; markdown?: string } = {},
): Promise<Awaited<ReturnType<typeof runDevViewCli>>> {
  return runDevViewCli(
    [
      'graph',
      'read-model',
      'apply-graph-delta',
      '--dry-run-report',
      'dry-run.json',
      '--proposal',
      'proposal.json',
      '--graph-source',
      options.graphSource ?? 'graph-source.json',
      '--mutation-policy',
      'mutation-policy.json',
      '--backup-dir',
      '.tmp/backups',
      '--read-model-output',
      '.tmp/read-model.json',
      '--validation-output',
      '.tmp/validation.json',
      '--output',
      '.tmp/apply.json',
      '--markdown',
      options.markdown ?? '.tmp/apply.md',
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function validDryRun(): Record<string, unknown> {
  return {
    artifactRole: 'devview-approved-apply-dry-run-report',
    status: 'devview-approved-apply-dry-run-ready',
    dryRunReadinessStatus: 'dry-run-ready-for-future-apply-command',
    sourceGraphDeltaProposal: 'proposal.json',
    proposalId: 'GDP-TEST',
    graphDeltaApplyEnabled: false,
    graphDeltaApplied: false,
    graphSourceMutationAllowed: false,
    graphSourceMutated: false,
    mutationAllowed: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function validProposal(input: { proposalId?: string; graphDeltaOperations?: unknown[] } = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    schemaId: 'devview-graph-update-proposal-v0',
    artifactRole: 'graph-delta-proposal-only-preview',
    status: 'generated-proposal-only-preview',
    proposalId: input.proposalId ?? 'GDP-TEST',
    proposalOnly: true,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    boundaries: {
      graphSourceMutated: false,
      graphDeltaApplied: false,
      runtimeEvidenceSatisfied: false,
      acceptedEvidence: false,
      equivalenceProven: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
    },
    graphDeltaOperations: input.graphDeltaOperations ?? [validOperation()],
  }
}

function proposalOnlyPreview(): Record<string, unknown> {
  const proposal = validProposal()
  delete proposal.graphDeltaOperations
  return proposal
}

function validOperation(): Record<string, unknown> {
  return {
    operationId: 'op-001',
    targetKind: 'node',
    action: 'replace-field',
    targetId: 'PT-ROOT',
    fieldPath: ['freshnessStatus'],
    expectedBeforeValue: 'fresh',
    afterValue: 'fresh-after-apply-test',
  }
}

function validMutationPolicy(): Record<string, unknown> {
  return {
    artifactRole: 'devview-graph-source-mutation-policy-boundary-preview',
    status: 'devview-graph-source-mutation-policy-boundary-previewed',
    futureMutationTargetPolicy: {
      futureAllowedTarget: 'explicit-current-graph-source-only',
    },
    graphSourceMutationAllowed: false,
    graphSourceMutated: false,
    graphDeltaApplyEnabled: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    mutationPolicyRequirements: [
      { requirementId: 'backup-or-reversible-patch' },
      { requirementId: 'fallback-plan' },
      { requirementId: 'regenerate-read-model' },
      { requirementId: 'consistency-check' },
      { requirementId: 'mutation-report' },
      { requirementId: 'rollback-on-failure-policy' },
    ],
  }
}

function graphSourceFixture(): Record<string, unknown> {
  return JSON.parse(
    readFileSync(join(pluginRoot, 'examples/valid/todo-app-devview-run/graph-source.json'), 'utf8'),
  ) as Record<string, unknown>
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
