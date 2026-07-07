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

describe('Equivalence Proof Record CLI', () => {
  it('records narrow equivalence proof from a Runtime Evidence satisfaction record without enforcement', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'runtime-satisfaction-record.json'), validRuntimeSatisfactionRecord())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-equivalence-proof',
        '--policy',
        'policy.json',
        '--runtime-evidence-satisfaction-record',
        'runtime-satisfaction-record.json',
        '--output',
        '.tmp/equivalence-proof-record.json',
        '--markdown',
        '.tmp/equivalence-proof-record.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/equivalence-proof-record.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-equivalence-proof-record')
    expect(payload.status).toBe('devview-equivalence-proof-recorded')
    expect(payload.equivalenceProofKind).toBe('runtime-evidence-obligation-equivalence-v1')
    expect(payload.equivalenceProven).toBe(true)
    expect(payload.sourceRuntimeEvidenceSatisfied).toBe(true)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.providerInvoked).toBe(false)
    expect(payload.networkCallMade).toBe(false)
    expect(payload.extensionExecutionAllowed).toBe(false)
    expect(payload.nonEnforcing).toBe(true)
    expect(payload.sourceRuntimeEvidenceSatisfactionRecord).toBe('runtime-satisfaction-record.json')
    expect(written.equivalenceProven).toBe(true)
    expect(existsSync(join(workspace, '.tmp/equivalence-proof-record.md'))).toBe(true)
  })

  it('blocks readiness-only input because actual runtime satisfaction record is required', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'runtime-readiness.json'), {
      artifactRole: 'devview-runtime-evidence-satisfaction-readiness-preview',
      status: 'devview-runtime-evidence-satisfaction-readiness-ready',
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-equivalence-proof',
        '--policy',
        'policy.json',
        '--runtime-evidence-satisfaction-record',
        'runtime-readiness.json',
        '--output',
        '.tmp/equivalence-proof-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain(
      'expected devview-runtime-evidence-satisfaction-record',
    )
    expect(existsSync(join(workspace, '.tmp/equivalence-proof-record.json'))).toBe(false)
  })

  it('blocks unsafe Runtime Evidence satisfaction record flags before proof output', async () => {
    for (const flag of ['evidenceAccepted', 'equivalenceProven', 'scopeEnforced', 'ciEnforcementEnabled']) {
      const workspace = createWorkspace()
      writeJson(join(workspace, 'policy.json'), validPolicy())
      writeJson(join(workspace, 'runtime-satisfaction-record.json'), validRuntimeSatisfactionRecord({ [flag]: true }))

      const result = await runDevViewCli(
        [
          'graph',
          'read-model',
          'record-equivalence-proof',
          '--policy',
          'policy.json',
          '--runtime-evidence-satisfaction-record',
          'runtime-satisfaction-record.json',
          '--output',
          '.tmp/equivalence-proof-record.json',
          '--json',
        ],
        { cwd: workspace, pluginRoot },
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues[0].message).toContain(flag)
      expect(existsSync(join(workspace, '.tmp/equivalence-proof-record.json'))).toBe(false)
    }
  })

  it('blocks runtime satisfaction records that do not assert runtime Evidence satisfaction', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(
      join(workspace, 'runtime-satisfaction-record.json'),
      validRuntimeSatisfactionRecord({ runtimeEvidenceSatisfied: false }),
    )

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-equivalence-proof',
        '--policy',
        'policy.json',
        '--runtime-evidence-satisfaction-record',
        'runtime-satisfaction-record.json',
        '--output',
        '.tmp/equivalence-proof-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('runtimeEvidenceSatisfied must be true')
    expect(existsSync(join(workspace, '.tmp/equivalence-proof-record.json'))).toBe(false)
  })

  it('blocks unsafe policy boundaries before proof output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy({ equivalenceProven: true }))
    writeJson(join(workspace, 'runtime-satisfaction-record.json'), validRuntimeSatisfactionRecord())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-equivalence-proof',
        '--policy',
        'policy.json',
        '--runtime-evidence-satisfaction-record',
        'runtime-satisfaction-record.json',
        '--output',
        '.tmp/equivalence-proof-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('equivalenceProven')
    expect(existsSync(join(workspace, '.tmp/equivalence-proof-record.json'))).toBe(false)
  })

  it('blocks protected output paths with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'runtime-satisfaction-record.json'), validRuntimeSatisfactionRecord())
    const satisfactionBefore = readFileSync(join(workspace, 'runtime-satisfaction-record.json'), 'utf8')

    const overwriteSatisfaction = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-equivalence-proof',
        '--policy',
        'policy.json',
        '--runtime-evidence-satisfaction-record',
        'runtime-satisfaction-record.json',
        '--output',
        '.tmp/equivalence-proof-record.json',
        '--markdown',
        'runtime-satisfaction-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(overwriteSatisfaction.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(overwriteSatisfaction.stderr).issues[0].message).toContain('would overwrite')
    expect(readFileSync(join(workspace, 'runtime-satisfaction-record.json'), 'utf8')).toBe(satisfactionBefore)
    expect(existsSync(join(workspace, '.tmp/equivalence-proof-record.json'))).toBe(false)

    const markdownCollision = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-equivalence-proof',
        '--policy',
        'policy.json',
        '--runtime-evidence-satisfaction-record',
        'runtime-satisfaction-record.json',
        '--output',
        '.tmp/equivalence-proof-record.json',
        '--markdown',
        '.tmp/equivalence-proof-record.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(markdownCollision.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(markdownCollision.stderr).issues[0].message).toContain('--output and --markdown must differ')
    expect(existsSync(join(workspace, '.tmp/equivalence-proof-record.json'))).toBe(false)
  })
})

function validPolicy(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    artifactRole: 'devview-equivalence-proof-policy-boundary-preview',
    status: 'devview-equivalence-proof-policy-boundary-previewed',
    equivalenceProven: false,
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    ...overrides,
  }
}

function validRuntimeSatisfactionRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-runtime-evidence-satisfaction-record',
    status: 'devview-runtime-evidence-satisfaction-recorded',
    runtimeEvidenceSatisfactionState: 'runtime-evidence-satisfied-for-explicit-obligation',
    sourceRuntimeEvidenceSatisfactionReadiness: 'runtime-readiness.json',
    sourceAcceptedEvidenceRecord: 'accepted-evidence.json',
    sourceInstructionPack: 'instruction-pack.json',
    sourceContractInput: null,
    sourceEvidenceArtifact: 'runtime-output.json',
    sourceRuntimeEvidenceAuthority: null,
    sourceEvidenceCheckBinding: null,
    sourceOutputRequirement: null,
    sourceRuntimeReport: null,
    sourceScopeReport: null,
    sourceGraphDeltaApplyReport: null,
    sourceCheckReport: null,
    requiredEvidenceId: 'required-evidence-tt-1',
    matchedRequiredEvidence: {
      id: 'required-evidence-tt-1',
      sourceEvidenceId: 'evidence-tt-1',
      evidenceType: 'selected_check_context',
      artifact: 'runtime-output.json',
      sourceStatus: 'derived-from-selected-graph-slice',
      runtimeEvidenceSatisfied: false,
      acceptedEvidence: false,
    },
    acceptedEvidenceClaim:
      'Accepted evidence explicitly covers required-evidence-tt-1, evidence-tt-1, and runtime-output.json.',
    acceptedEvidenceKind: 'selected_check_context-candidate',
    sourceAcceptedEvidenceAccepted: true,
    sourceEvidenceHash: 'a'.repeat(64),
    sourceEvidenceHashAlgorithm: 'sha256',
    satisfactionProvenanceStatus: 'ready-binding-and-source-evidence-revalidated',
    runtimeEvidenceSatisfied: true,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    providerInvoked: false,
    networkCallMade: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    shellCommandsExecuted: false,
    nonEnforcing: true,
    ...overrides,
  }
}
