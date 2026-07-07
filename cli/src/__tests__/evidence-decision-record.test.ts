import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson, writeText } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Evidence Decision Record CLI', () => {
  it('records defer decisions without accepting evidence or satisfying runtime Evidence', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'readiness.json'), validReadiness())
    writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())
    writeJson(join(workspace, 'runtime-report.json'), validRuntimeReport())
    writeJson(join(workspace, 'apply-report.json'), validSourceEvidence())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-evidence-decision',
        '--policy',
        'policy.json',
        '--readiness',
        'readiness.json',
        '--source-evidence',
        'source-evidence.json',
        '--runtime-report',
        'runtime-report.json',
        '--apply-report',
        'apply-report.json',
        '--decision',
        'defer',
        '--reviewer',
        'human-reviewer',
        '--rationale',
        'Evidence acceptance is deferred.',
        '--decision-timestamp',
        '2026-07-06T00:00:00.000Z',
        '--output',
        '.tmp/evidence-decision.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/evidence-decision.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-evidence-decision-record')
    expect(payload.status).toBe('devview-evidence-decision-recorded')
    expect(payload.decisionLifecycleHardeningStatus).toBe('hardened-human-evidence-decision-record-v1')
    expect(payload.decisionKind).toBe('defer')
    expect(payload.decisionActorType).toBe('human')
    expect(payload.decisionSource).toBe('explicit-cli-input')
    expect(payload.decisionTimestampAuthorityStatus).toBe('cli-provided')
    expect(payload.acceptedEvidenceRecordCreated).toBe(false)
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(written.sourceRuntimeReport).toBe('runtime-report.json')
    expect(written.sourceGraphDeltaApplyReport).toBe('apply-report.json')
  })

  it('records accept-evidence as a decision record only, not accepted Evidence', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-evidence-decision',
        '--policy',
        'policy.json',
        '--source-evidence',
        'source-evidence.json',
        '--decision',
        'accept-evidence',
        '--reviewer',
        'human-reviewer',
        '--rationale',
        'Human records an acceptance decision, but no accepted evidence record is created in this slice.',
        '--output',
        '.tmp/evidence-decision.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.decisionKind).toBe('accept')
    expect(payload.acceptedClaims).toEqual([])
    expect(payload.acceptedEvidenceRecordCreated).toBe(false)
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.selfAcceptanceCheckStatus).toBe('passed-human-actor')
    expect(payload.codexSelfAcceptanceAllowed).toBe(false)
  })

  it('records reject and request-changes without accepting evidence', async () => {
    for (const [decisionValue, decisionKind] of [
      ['reject-evidence', 'reject'],
      ['request-changes', 'request-changes'],
    ]) {
      const workspace = createWorkspace()
      writeJson(join(workspace, 'policy.json'), validPolicy())
      writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())

      const result = await runDevViewCli(
        [
          'graph',
          'read-model',
          'record-evidence-decision',
          '--policy',
          'policy.json',
          '--source-evidence',
          'source-evidence.json',
          '--decision',
          decisionValue,
          '--reviewer',
          'human-reviewer',
          '--rationale',
          'Human does not accept evidence yet.',
          '--output',
          `.tmp/evidence-decision-${decisionKind}.json`,
          '--json',
        ],
        { cwd: workspace, pluginRoot },
      )
      const payload = JSON.parse(result.stdout)

      expect(result.exitCode).toBe(ExitCode.Success)
      expect(payload.decisionKind).toBe(decisionKind)
      expect(payload.evidenceAccepted).toBe(false)
      expect(payload.runtimeEvidenceSatisfied).toBe(false)
      expect(payload.acceptedEvidenceRecordCreated).toBe(false)
    }
  })

  it('blocks Codex, AI, tool, validator, or CI actor/source authority', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())

    const actorResult = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-evidence-decision',
        '--policy',
        'policy.json',
        '--source-evidence',
        'source-evidence.json',
        '--decision',
        'defer',
        '--reviewer',
        'human-reviewer',
        '--rationale',
        'No.',
        '--decision-actor-type',
        'tool',
        '--output',
        '.tmp/actor.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const sourceResult = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-evidence-decision',
        '--policy',
        'policy.json',
        '--source-evidence',
        'source-evidence.json',
        '--decision',
        'defer',
        '--reviewer',
        'human-reviewer',
        '--rationale',
        'No.',
        '--decision-source',
        'ci',
        '--output',
        '.tmp/source.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const reviewerResult = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-evidence-decision',
        '--policy',
        'policy.json',
        '--source-evidence',
        'source-evidence.json',
        '--decision',
        'defer',
        '--reviewer',
        'Codex',
        '--rationale',
        'No.',
        '--output',
        '.tmp/reviewer.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(actorResult.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(actorResult.stderr).issues[0].message).toContain('actor type')
    expect(sourceResult.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(sourceResult.stderr).issues[0].message).toContain('decision source')
    expect(reviewerResult.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(reviewerResult.stderr).issues[0].message).toContain('reviewer must be human-provided')
    expect(existsSync(join(workspace, '.tmp/actor.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/source.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/reviewer.json'))).toBe(false)
  })

  it('blocks missing source evidence and unknown decisions before output write', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())

    const missingResult = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-evidence-decision',
        '--policy',
        'policy.json',
        '--source-evidence',
        'missing-evidence.json',
        '--decision',
        'defer',
        '--reviewer',
        'human-reviewer',
        '--rationale',
        'No.',
        '--output',
        '.tmp/missing.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const unknownResult = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-evidence-decision',
        '--policy',
        'policy.json',
        '--source-evidence',
        'source-evidence.json',
        '--decision',
        'auto-accept',
        '--reviewer',
        'human-reviewer',
        '--rationale',
        'No.',
        '--output',
        '.tmp/unknown.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(missingResult.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(missingResult.stderr).issues[0].message).toContain('Unable to read source evidence artifact')
    expect(unknownResult.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(unknownResult.stderr).issues[0].message).toContain('not recognized')
    expect(existsSync(join(workspace, '.tmp/missing.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/unknown.json'))).toBe(false)
  })

  it('blocks source evidence that asserts unsafe authority', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'source-evidence.json'), {
      ...validSourceEvidence(),
      evidenceAccepted: true,
    })

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-evidence-decision',
        '--policy',
        'policy.json',
        '--source-evidence',
        'source-evidence.json',
        '--decision',
        'defer',
        '--reviewer',
        'human-reviewer',
        '--rationale',
        'No.',
        '--output',
        '.tmp/evidence-decision.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('evidenceAccepted')
    expect(existsSync(join(workspace, '.tmp/evidence-decision.json'))).toBe(false)
  })

  it('blocks output overwrite of source artifacts and unsafe markdown before JSON write', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeJson(join(workspace, 'readiness.json'), validReadiness())
    writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())
    const evidenceBefore = readFileSync(join(workspace, 'source-evidence.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-evidence-decision',
        '--policy',
        'policy.json',
        '--readiness',
        'readiness.json',
        '--source-evidence',
        'source-evidence.json',
        '--decision',
        'defer',
        '--reviewer',
        'human-reviewer',
        '--rationale',
        'No output should be written.',
        '--output',
        '.tmp/evidence-decision.json',
        '--markdown',
        'source-evidence.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('would overwrite the source evidence artifact')
    expect(readFileSync(join(workspace, 'source-evidence.json'), 'utf8')).toBe(evidenceBefore)
    expect(existsSync(join(workspace, '.tmp/evidence-decision.json'))).toBe(false)
  })

  it('allows text evidence as candidate evidence without accepting it', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'policy.json'), validPolicy())
    writeText(join(workspace, 'evidence.txt'), 'Manual evidence note for later human review.')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'record-evidence-decision',
        '--policy',
        'policy.json',
        '--source-evidence',
        'evidence.txt',
        '--decision',
        'defer',
        '--reviewer',
        'human-reviewer',
        '--rationale',
        'Text evidence is deferred.',
        '--output',
        '.tmp/text-evidence-decision.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.sourceEvidenceJsonParsed).toBe(false)
    expect(payload.evidenceKind).toBe('text-evidence-candidate')
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
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

function validReadiness(): Record<string, unknown> {
  return {
    artifactRole: 'devview-evidence-acceptance-readiness-preview',
    status: 'devview-evidence-acceptance-readiness-blocked',
    readinessScope: 'evidence-acceptance-readiness-preview-no-acceptance',
    evidenceAcceptanceReadinessStatus: 'blocked-mutation-readiness-not-ready',
    acceptanceAllowed: false,
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

function validRuntimeReport(): Record<string, unknown> {
  return {
    artifactRole: 'devview-runtime-smoke-report',
    status: 'runtime-smoke-pass-preview',
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}
