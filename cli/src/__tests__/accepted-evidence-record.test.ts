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

describe('Accepted Evidence Record CLI', () => {
  it('creates accepted Evidence only from hardened accept-evidence decision and matching source evidence', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())
    writeJson(join(workspace, 'decision.json'), validEvidenceDecision())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'create-accepted-evidence-record',
        '--evidence-decision',
        'decision.json',
        '--policy',
        'policy.json',
        '--source-evidence',
        'source-evidence.json',
        '--output',
        '.tmp/accepted-evidence.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/accepted-evidence.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-accepted-evidence-record')
    expect(payload.status).toBe('devview-accepted-evidence-recorded')
    expect(payload.acceptedEvidenceState).toBe('accepted-evidence-recorded-not-runtime-satisfied')
    expect(payload.evidenceAccepted).toBe(true)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.decisionKind).toBe('accept')
    expect(payload.decisionValue).toBe('accept-evidence')
    expect(payload.decisionActorType).toBe('human')
    expect(payload.sourceEvidenceHashAlgorithm).toBe('sha256')
    expect(payload.sourceEvidenceHash).toMatch(/^[a-f0-9]{64}$/)
    expect(written.acceptedClaims).toEqual([sourceEvidenceClaim()])
  })

  it('blocks defer, reject, and request-changes decisions before writing accepted evidence', async () => {
    for (const [decisionKind, decisionValue] of [
      ['defer', 'defer'],
      ['reject', 'reject-evidence'],
      ['request-changes', 'request-changes'],
    ]) {
      const workspace = createWorkspace()
      writeJson(join(workspace, 'policy.json'), validPolicy())
      writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())
      writeJson(
        join(workspace, 'decision.json'),
        validEvidenceDecision({
          decisionKind,
          decisionValue,
        }),
      )

      const result = await runDevViewCli(
        [
          'graph',
          'read-model',
          'create-accepted-evidence-record',
          '--evidence-decision',
          'decision.json',
          '--policy',
          'policy.json',
          '--source-evidence',
          'source-evidence.json',
          '--output',
          `.tmp/accepted-evidence-${decisionKind}.json`,
          '--json',
        ],
        { cwd: workspace, pluginRoot },
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues[0].message).toContain('decisionKind accept')
      expect(existsSync(join(workspace, `.tmp/accepted-evidence-${decisionKind}.json`))).toBe(false)
    }
  })

  it('blocks legacy or unhardened acceptance-looking decisions', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())
    const decision = validEvidenceDecision()
    delete decision.decisionLifecycleHardeningStatus
    writeJson(join(workspace, 'decision.json'), decision)

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'create-accepted-evidence-record',
        '--evidence-decision',
        'decision.json',
        '--policy',
        'policy.json',
        '--source-evidence',
        'source-evidence.json',
        '--output',
        '.tmp/accepted-evidence.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('decisionLifecycleHardeningStatus')
    expect(existsSync(join(workspace, '.tmp/accepted-evidence.json'))).toBe(false)
  })

  it('blocks source evidence path mismatch', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())
    writeJson(join(workspace, 'other-source-evidence.json'), validSourceEvidence())
    writeJson(join(workspace, 'decision.json'), validEvidenceDecision())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'create-accepted-evidence-record',
        '--evidence-decision',
        'decision.json',
        '--policy',
        'policy.json',
        '--source-evidence',
        'other-source-evidence.json',
        '--output',
        '.tmp/accepted-evidence.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('source evidence mismatch')
    expect(existsSync(join(workspace, '.tmp/accepted-evidence.json'))).toBe(false)
  })

  it('blocks source role and status mismatch where comparable', async () => {
    for (const [override, expectedMessage] of [
      [{ artifactRole: 'other-evidence-report' }, 'role mismatch'],
      [{ status: 'other-status' }, 'status mismatch'],
      [{ status: 'other-status', artifactRole: 'other-evidence-report' }, 'role mismatch'],
    ]) {
      const workspace = createWorkspace()
      writeJson(join(workspace, 'policy.json'), validPolicy())
      writeJson(join(workspace, 'source-evidence.json'), { ...validSourceEvidence(), ...override })
      writeJson(join(workspace, 'decision.json'), validEvidenceDecision())

      const result = await runDevViewCli(
        [
          'graph',
          'read-model',
          'create-accepted-evidence-record',
          '--evidence-decision',
          'decision.json',
          '--policy',
          'policy.json',
          '--source-evidence',
          'source-evidence.json',
          '--output',
          '.tmp/accepted-evidence.json',
          '--json',
        ],
        { cwd: workspace, pluginRoot },
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues[0].message).toContain(expectedMessage)
      expect(existsSync(join(workspace, '.tmp/accepted-evidence.json'))).toBe(false)
    }
  })

  it('blocks source evidence claim mismatch where comparable', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())
    writeJson(
      join(workspace, 'decision.json'),
      validEvidenceDecision({
        evidenceClaim: 'A stale human decision claim that no longer matches the current source evidence.',
      }),
    )

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'create-accepted-evidence-record',
        '--evidence-decision',
        'decision.json',
        '--policy',
        'policy.json',
        '--source-evidence',
        'source-evidence.json',
        '--output',
        '.tmp/accepted-evidence.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('claim mismatch')
    expect(existsSync(join(workspace, '.tmp/accepted-evidence.json'))).toBe(false)
  })

  it('blocks source evidence unsafe authority flags', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'source-evidence.json'), {
      ...validSourceEvidence(),
      runtimeEvidenceSatisfied: true,
    })
    writeJson(join(workspace, 'decision.json'), validEvidenceDecision())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'create-accepted-evidence-record',
        '--evidence-decision',
        'decision.json',
        '--policy',
        'policy.json',
        '--source-evidence',
        'source-evidence.json',
        '--output',
        '.tmp/accepted-evidence.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('runtimeEvidenceSatisfied')
    expect(existsSync(join(workspace, '.tmp/accepted-evidence.json'))).toBe(false)
  })

  it('blocks invalid or unsafe policy boundary', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), { ...validPolicy(), evidenceAccepted: true })
    writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())
    writeJson(join(workspace, 'decision.json'), validEvidenceDecision())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'create-accepted-evidence-record',
        '--evidence-decision',
        'decision.json',
        '--policy',
        'policy.json',
        '--source-evidence',
        'source-evidence.json',
        '--output',
        '.tmp/accepted-evidence.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('evidenceAccepted')
    expect(existsSync(join(workspace, '.tmp/accepted-evidence.json'))).toBe(false)
  })

  it('blocks non-human actor or disallowed decision source', async () => {
    for (const override of [{ decisionActorType: 'tool' }, { decisionSource: 'ci' }]) {
      const workspace = createWorkspace()
      writeJson(join(workspace, 'policy.json'), validPolicy())
      writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())
      writeJson(join(workspace, 'decision.json'), validEvidenceDecision(override))

      const result = await runDevViewCli(
        [
          'graph',
          'read-model',
          'create-accepted-evidence-record',
          '--evidence-decision',
          'decision.json',
          '--policy',
          'policy.json',
          '--source-evidence',
          'source-evidence.json',
          '--output',
          '.tmp/accepted-evidence.json',
          '--json',
        ],
        { cwd: workspace, pluginRoot },
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(existsSync(join(workspace, '.tmp/accepted-evidence.json'))).toBe(false)
    }
  })

  it('blocks output overwrite of source artifacts and unsafe markdown before JSON write', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())
    writeJson(join(workspace, 'decision.json'), validEvidenceDecision())
    const sourceBefore = readFileSync(join(workspace, 'source-evidence.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'create-accepted-evidence-record',
        '--evidence-decision',
        'decision.json',
        '--policy',
        'policy.json',
        '--source-evidence',
        'source-evidence.json',
        '--output',
        '.tmp/accepted-evidence.json',
        '--markdown',
        'source-evidence.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('would overwrite the source evidence artifact')
    expect(readFileSync(join(workspace, 'source-evidence.json'), 'utf8')).toBe(sourceBefore)
    expect(existsSync(join(workspace, '.tmp/accepted-evidence.json'))).toBe(false)
  })
})

function validPolicy(): Record<string, unknown> {
  return {
    artifactRole: 'devview-evidence-acceptance-policy-boundary-preview',
    status: 'devview-evidence-acceptance-policy-boundary-previewed',
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function validSourceEvidence(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-graph-delta-apply-report',
    status: 'devview-graph-delta-apply-blocked',
    applyStatus: 'blocked-no-concrete-mutation-operations',
    mutationApplied: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    backupCreated: false,
    readModelRegenerated: false,
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function validEvidenceDecision(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-evidence-decision-record',
    status: 'devview-evidence-decision-recorded',
    recordScope: 'explicit-human-evidence-decision-record-preview-no-acceptance',
    decisionLifecycleHardeningStatus: 'hardened-human-evidence-decision-record-v1',
    sourceEvidenceAcceptancePolicy: 'policy.json',
    sourceEvidenceAcceptanceReadiness: null,
    sourceEvidenceArtifact: 'source-evidence.json',
    sourceRuntimeReport: null,
    sourceScopeReport: null,
    sourceGraphDeltaApplyReport: null,
    sourceInstructionPack: null,
    sourceRequestCandidate: null,
    sourceProposal: null,
    evidenceKind: 'devview-graph-delta-apply-report-candidate',
    evidenceClaim: sourceEvidenceClaim(),
    claimScope: 'candidate-evidence-review-only',
    sourceEvidenceArtifactRole: 'devview-graph-delta-apply-report',
    sourceEvidenceStatus: 'devview-graph-delta-apply-blocked',
    sourceEvidenceReadable: true,
    sourceEvidenceJsonParsed: true,
    decisionValue: 'accept-evidence',
    decisionKind: 'accept',
    decisionSummary:
      'Human evidence acceptance decision recorded; accepted Evidence record is not created in this slice.',
    decisionRationale: 'Human accepts this evidence artifact for accepted evidence record calibration.',
    decisionActorType: 'human',
    decisionActorLabel: 'human-reviewer',
    decisionSource: 'explicit-cli-input',
    decisionTimestamp: '2026-07-06T00:00:00.000Z',
    decisionTimestampAuthorityStatus: 'cli-provided',
    reviewerIdentity: 'human-reviewer',
    reviewedAt: '2026-07-06T00:00:00.000Z',
    acceptedClaims: [],
    rejectedClaims: [],
    limitations: [],
    selfAcceptanceCheckStatus: 'passed-human-actor',
    selfAcceptanceRejected: false,
    evidenceDecisionRecorded: true,
    acceptedEvidenceRecordCreated: false,
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalAutomationEnabled: false,
    codexSelfAcceptanceAllowed: false,
    aiGeneratedAcceptanceAllowed: false,
    validatorSelfAcceptanceAllowed: false,
    ciSelfAcceptanceAllowed: false,
    userAcceptanceAutomated: false,
    ...overrides,
  }
}

function sourceEvidenceClaim(): string {
  return 'devview-graph-delta-apply-report with status devview-graph-delta-apply-blocked is reviewed as candidate evidence only.'
}
