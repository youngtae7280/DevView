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

describe('Runtime Evidence Satisfaction Binding Readiness CLI', () => {
  it('reports ready for matching accepted Evidence and required obligation without satisfying runtime Evidence', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'runtime-output.json'), validSourceEvidence())
    writeJson(
      join(workspace, 'accepted-evidence.json'),
      validAcceptedEvidence({
        sourceEvidenceHash: sha256(readFileSync(join(workspace, 'runtime-output.json'), 'utf8')),
      }),
    )
    writeJson(join(workspace, 'instruction-pack.json'), validInstructionPack())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-runtime-evidence-satisfaction-readiness',
        '--accepted-evidence',
        'accepted-evidence.json',
        '--instruction-pack',
        'instruction-pack.json',
        '--required-evidence-id',
        'required-evidence-tt-1',
        '--source-evidence',
        'runtime-output.json',
        '--output',
        '.tmp/runtime-readiness.json',
        '--markdown',
        '.tmp/runtime-readiness.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/runtime-readiness.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-runtime-evidence-satisfaction-readiness-preview')
    expect(payload.status).toBe('devview-runtime-evidence-satisfaction-readiness-ready')
    expect(payload.runtimeEvidenceSatisfactionReadinessStatus).toBe(
      'ready-accepted-evidence-linked-to-runtime-obligation',
    )
    expect(payload.sourceAcceptedEvidenceAccepted).toBe(true)
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.runtimeEvidenceSatisfactionAllowed).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.nonEnforcing).toBe(true)
    expect(written.evidenceAccepted).toBe(false)
    expect(existsSync(join(workspace, '.tmp/runtime-readiness.md'))).toBe(true)
  })

  it('reports blocked obligation mismatch for accepted Evidence that does not match the selected obligation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'source-evidence.json'), validSourceEvidence())
    writeJson(
      join(workspace, 'accepted-evidence.json'),
      validAcceptedEvidence({
        sourceEvidenceArtifact: 'source-evidence.json',
        evidenceKind: 'devview-graph-delta-apply-report-candidate',
        evidenceClaim: 'A human reviewed the blocked Graph Delta Apply lifecycle report as accepted evidence only.',
        acceptedClaims: ['A human reviewed the blocked Graph Delta Apply lifecycle report as accepted evidence only.'],
        sourceEvidenceHash: sha256(readFileSync(join(workspace, 'source-evidence.json'), 'utf8')),
      }),
    )
    writeJson(join(workspace, 'instruction-pack.json'), validInstructionPack())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-runtime-evidence-satisfaction-readiness',
        '--accepted-evidence',
        'accepted-evidence.json',
        '--instruction-pack',
        'instruction-pack.json',
        '--required-evidence-id',
        'required-evidence-tt-1',
        '--output',
        '.tmp/runtime-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('devview-runtime-evidence-satisfaction-readiness-blocked')
    expect(payload.runtimeEvidenceSatisfactionReadinessStatus).toBe('blocked-required-obligation-mismatch')
    expect(payload.evidenceAccepted).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(existsSync(join(workspace, '.tmp/runtime-readiness.json'))).toBe(true)
  })

  it('blocks missing or wrong accepted Evidence role and status', async () => {
    for (const acceptedOverride of [
      { artifactRole: 'devview-evidence-decision-record' },
      { status: 'devview-accepted-evidence-draft' },
    ]) {
      const workspace = createWorkspace()
      writeJson(join(workspace, 'accepted-evidence.json'), validAcceptedEvidence(acceptedOverride))
      writeJson(join(workspace, 'instruction-pack.json'), validInstructionPack())

      const result = await runDevViewCli(
        [
          'graph',
          'read-model',
          'report-runtime-evidence-satisfaction-readiness',
          '--accepted-evidence',
          'accepted-evidence.json',
          '--instruction-pack',
          'instruction-pack.json',
          '--required-evidence-id',
          'required-evidence-tt-1',
          '--output',
          '.tmp/runtime-readiness.json',
          '--json',
        ],
        { cwd: workspace, pluginRoot },
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues[0].message).toContain('Unsafe Accepted Evidence input')
      expect(existsSync(join(workspace, '.tmp/runtime-readiness.json'))).toBe(false)
    }
  })

  it('blocks accepted Evidence records with unsafe authority flags', async () => {
    for (const flag of [
      'runtimeEvidenceSatisfied',
      'equivalenceProven',
      'scopeEnforced',
      'ciEnforcementEnabled',
      'graphSourceMutated',
      'graphDeltaApplied',
    ]) {
      const workspace = createWorkspace()
      writeJson(join(workspace, 'accepted-evidence.json'), validAcceptedEvidence({ [flag]: true }))
      writeJson(join(workspace, 'instruction-pack.json'), validInstructionPack())

      const result = await runDevViewCli(
        [
          'graph',
          'read-model',
          'report-runtime-evidence-satisfaction-readiness',
          '--accepted-evidence',
          'accepted-evidence.json',
          '--instruction-pack',
          'instruction-pack.json',
          '--required-evidence-id',
          'required-evidence-tt-1',
          '--output',
          '.tmp/runtime-readiness.json',
          '--json',
        ],
        { cwd: workspace, pluginRoot },
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues[0].message).toContain(flag)
      expect(existsSync(join(workspace, '.tmp/runtime-readiness.json'))).toBe(false)
    }
  })

  it('reports missing required obligation id without satisfying runtime Evidence', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'accepted-evidence.json'), validAcceptedEvidence())
    writeJson(join(workspace, 'instruction-pack.json'), validInstructionPack())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-runtime-evidence-satisfaction-readiness',
        '--accepted-evidence',
        'accepted-evidence.json',
        '--instruction-pack',
        'instruction-pack.json',
        '--required-evidence-id',
        'missing-required-evidence',
        '--output',
        '.tmp/runtime-readiness.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.runtimeEvidenceSatisfactionReadinessStatus).toBe('blocked-required-obligation-missing')
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.evidenceAccepted).toBe(false)
  })

  it('blocks source evidence path and hash mismatches', async () => {
    const pathMismatchWorkspace = createWorkspace()
    writeJson(join(pathMismatchWorkspace, 'runtime-output.json'), validSourceEvidence())
    writeJson(join(pathMismatchWorkspace, 'other-output.json'), validSourceEvidence())
    writeJson(join(pathMismatchWorkspace, 'accepted-evidence.json'), validAcceptedEvidence())
    writeJson(join(pathMismatchWorkspace, 'instruction-pack.json'), validInstructionPack())

    const pathMismatch = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-runtime-evidence-satisfaction-readiness',
        '--accepted-evidence',
        'accepted-evidence.json',
        '--instruction-pack',
        'instruction-pack.json',
        '--required-evidence-id',
        'required-evidence-tt-1',
        '--source-evidence',
        'other-output.json',
        '--output',
        '.tmp/runtime-readiness.json',
        '--json',
      ],
      { cwd: pathMismatchWorkspace, pluginRoot },
    )

    expect(pathMismatch.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(pathMismatch.stderr).issues[0].message).toContain('source evidence mismatch')
    expect(existsSync(join(pathMismatchWorkspace, '.tmp/runtime-readiness.json'))).toBe(false)

    const hashMismatchWorkspace = createWorkspace()
    writeJson(join(hashMismatchWorkspace, 'runtime-output.json'), validSourceEvidence())
    writeJson(
      join(hashMismatchWorkspace, 'accepted-evidence.json'),
      validAcceptedEvidence({ sourceEvidenceHash: '0'.repeat(64) }),
    )
    writeJson(join(hashMismatchWorkspace, 'instruction-pack.json'), validInstructionPack())

    const hashMismatch = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-runtime-evidence-satisfaction-readiness',
        '--accepted-evidence',
        'accepted-evidence.json',
        '--instruction-pack',
        'instruction-pack.json',
        '--required-evidence-id',
        'required-evidence-tt-1',
        '--source-evidence',
        'runtime-output.json',
        '--output',
        '.tmp/runtime-readiness.json',
        '--json',
      ],
      { cwd: hashMismatchWorkspace, pluginRoot },
    )

    expect(hashMismatch.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(hashMismatch.stderr).issues[0].message).toContain('hash mismatch')
    expect(existsSync(join(hashMismatchWorkspace, '.tmp/runtime-readiness.json'))).toBe(false)
  })

  it('blocks unsafe optional runtime authority, check binding, or output requirement inputs', async () => {
    for (const [flag, artifactRole, status, statusField, cliFlag] of [
      [
        '--runtime-evidence-authority',
        'runtime-evidence-authority-preview',
        'runtime-evidence-authority-previewed',
        'runtimeEvidenceAuthorityStatus',
        'preview-only-not-satisfied',
      ],
      [
        '--evidence-check-binding',
        'evidence-check-binding-preview',
        'evidence-check-binding-previewed',
        'evidenceCheckBindingStatus',
        'preview-only-not-satisfied',
      ],
      [
        '--output-requirement',
        'output-requirement-for-test-evidence-preview',
        'output-requirement-for-test-evidence-previewed',
        'outputRequirementStatus',
        'preview-only-not-satisfied',
      ],
    ] as const) {
      const workspace = createWorkspace()
      const unsafeTrue = Boolean('unsafe-authority-fixture')
      writeJson(join(workspace, 'accepted-evidence.json'), validAcceptedEvidence())
      writeJson(join(workspace, 'instruction-pack.json'), validInstructionPack())
      writeJson(join(workspace, 'optional.json'), {
        artifactRole,
        status,
        [statusField]: cliFlag,
        runtimeEvidenceSatisfied: unsafeTrue,
      })

      const result = await runDevViewCli(
        [
          'graph',
          'read-model',
          'report-runtime-evidence-satisfaction-readiness',
          '--accepted-evidence',
          'accepted-evidence.json',
          '--instruction-pack',
          'instruction-pack.json',
          '--required-evidence-id',
          'required-evidence-tt-1',
          flag,
          'optional.json',
          '--output',
          '.tmp/runtime-readiness.json',
          '--json',
        ],
        { cwd: workspace, pluginRoot },
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(JSON.parse(result.stderr).issues[0].message).toContain('runtimeEvidenceSatisfied')
      expect(existsSync(join(workspace, '.tmp/runtime-readiness.json'))).toBe(false)
    }
  })

  it('blocks unsafe output paths with zero writes', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'accepted-evidence.json'), validAcceptedEvidence())
    writeJson(join(workspace, 'instruction-pack.json'), validInstructionPack())
    const instructionPackBefore = readFileSync(join(workspace, 'instruction-pack.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-runtime-evidence-satisfaction-readiness',
        '--accepted-evidence',
        'accepted-evidence.json',
        '--instruction-pack',
        'instruction-pack.json',
        '--required-evidence-id',
        'required-evidence-tt-1',
        '--output',
        '.tmp/runtime-readiness.json',
        '--markdown',
        'instruction-pack.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues[0].message).toContain('would overwrite the source Instruction Pack')
    expect(readFileSync(join(workspace, 'instruction-pack.json'), 'utf8')).toBe(instructionPackBefore)
    expect(existsSync(join(workspace, '.tmp/runtime-readiness.json'))).toBe(false)
  })
})

function validAcceptedEvidence(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-accepted-evidence-record',
    status: 'devview-accepted-evidence-recorded',
    acceptedEvidenceState: 'accepted-evidence-recorded-not-runtime-satisfied',
    sourceEvidenceDecisionRecord: 'evidence-decision.json',
    sourceEvidenceAcceptancePolicy: 'policy.json',
    sourceEvidenceAcceptanceReadiness: null,
    sourceEvidenceArtifact: 'runtime-output.json',
    sourceRuntimeReport: null,
    sourceScopeReport: null,
    sourceGraphDeltaApplyReport: null,
    sourceProposal: null,
    evidenceKind: 'selected_check_context-candidate',
    evidenceClaim:
      'Accepted evidence explicitly covers required-evidence-tt-1, evidence-tt-1, and runtime-output.json.',
    claimScope: 'accepted-evidence-review-record-only',
    sourceEvidenceArtifactRole: 'runtime-check-report',
    sourceEvidenceStatus: 'runtime-check-report-produced',
    sourceEvidenceHash: sha256(`${JSON.stringify(validSourceEvidence(), null, 2)}\n`),
    sourceEvidenceHashAlgorithm: 'sha256',
    decisionKind: 'accept',
    decisionValue: 'accept-evidence',
    decisionActorType: 'human',
    decisionActorLabel: 'human-reviewer',
    decisionSource: 'explicit-cli-input',
    decisionTimestamp: '2026-07-06T00:00:00.000Z',
    acceptedEvidenceTimestamp: '2026-07-06T00:00:00.000Z',
    acceptedEvidenceTimestampAuthorityStatus: 'runtime-generated',
    acceptedClaims: [
      'Accepted evidence explicitly covers required-evidence-tt-1, evidence-tt-1, and runtime-output.json.',
    ],
    limitations: [],
    acceptanceProvenanceStatus: 'human-decision-and-source-evidence-revalidated',
    evidenceAccepted: true,
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

function validInstructionPack(requiredOverride: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'instruction-pack',
    status: 'instruction-pack-generated',
    instructionPackGenerated: true,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    requiredEvidence: [
      {
        id: 'required-evidence-tt-1',
        sourceEvidenceId: 'evidence-tt-1',
        evidenceType: 'selected_check_context',
        artifact: 'runtime-output.json',
        sourceStatus: 'derived-from-selected-graph-slice',
        runtimeEvidenceSatisfied: false,
        acceptedEvidence: false,
        ...requiredOverride,
      },
    ],
  }
}

function validSourceEvidence(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'runtime-check-report',
    status: 'runtime-check-report-produced',
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
