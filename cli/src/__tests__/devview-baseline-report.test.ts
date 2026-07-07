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

describe('DevView core baseline freeze report CLI', () => {
  it('writes baseline JSON and Markdown without granting authority', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)

    const result = await runDevViewCli(
      [...baseArgs(), '--output', '.tmp/baseline.json', '--markdown', '.tmp/baseline.md'],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, '.tmp/baseline.json'), 'utf8'))
    const markdown = readFileSync(join(workspace, '.tmp/baseline.md'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-core-baseline-freeze-report')
    expect(payload.status).toBe('devview-core-baseline-freeze-report-generated')
    expect(payload.baselineCompletenessStatus).toBe('complete')
    expect(payload.classificationTaxonomy.map((entry: { classification: string }) => entry.classification)).toEqual([
      'completed',
      'advisory',
      'blocked',
      'future-only',
    ])
    expect(payload.baselineLanes.map((entry: { laneId: string }) => entry.laneId)).toEqual(
      expect.arrayContaining(['compiler-frontend', 'activation-preview', 'phase-13-controlled-apply-readiness']),
    )
    expect(payload.sourceApprovedApplyDryRun).toBe('generated/approved-apply-dry-run.json')
    expect(payload.sourceGraphDeltaApplyReport).toBe('generated/graph-delta-apply-report.json')
    expect(payload.sourceExtensionReadiness).toBe('generated/extension-readiness.json')
    expect(payload.sourceEvidenceDecision).toBe('generated/evidence-decision.json')
    expect(payload.sourceAcceptedEvidence).toBe('generated/accepted-evidence.json')
    expect(payload.sourceRuntimeEvidenceSatisfactionReadiness).toBe(
      'generated/runtime-evidence-satisfaction-readiness.json',
    )
    expect(payload.sourceScopeCiEnforcementRecord).toBe('generated/scope-ci-record.json')
    expect(payload.sourceGuardedGraphUpdateBoundaryRecord).toBe('generated/guarded-boundary-record.json')
    expect(payload.sourceGuardedGraphUpdateApplyPlan).toBe('generated/guarded-apply-plan.json')
    expect(
      payload.sourceArtifacts.map((entry: { sourceId: string; classification: string }) => [
        entry.sourceId,
        entry.classification,
      ]),
    ).toEqual(
      expect.arrayContaining([
        ['approved-apply-dry-run', 'advisory'],
        ['graph-delta-apply-report', 'blocked'],
        ['extension-readiness', 'advisory'],
        ['evidence-decision', 'completed'],
        ['accepted-evidence', 'completed'],
        ['runtime-evidence-satisfaction-readiness', 'blocked'],
        ['equivalence-proof-readiness', 'blocked'],
        ['scope-ci-enforcement-readiness', 'blocked'],
        ['scope-ci-enforcement-record', 'completed'],
        ['guarded-graph-update-boundary-record', 'completed'],
        ['guarded-graph-update-apply-plan', 'advisory'],
      ]),
    )
    expect(
      payload.sourceArtifacts.find(
        (entry: { sourceId: string }) => entry.sourceId === 'guarded-graph-update-apply-plan',
      ).sourceFactSummary,
    ).toEqual(
      expect.objectContaining({
        applyPlanStatus: 'ready-deterministic-diff-preview-created',
        operationCount: 1,
        operationKinds: ['update-node'],
        unresolvedOperationCount: 0,
        graphSourceOriginalHash: 'sha256:graph-source',
        planComparisonStatus: 'matched-boundary-proposal-and-current-graph-source',
        applyPlanOnly: true,
        graphDeltaApplied: false,
        graphSourceMutated: false,
      }),
    )
    expectSafetyFalse(payload.safetyInvariantSummary)
    expect(written.writtenOutputPath).toBe('.tmp/baseline.json')
    expect(markdown).toContain('## Baseline Lanes')
    expect(markdown).toContain('## Future Only')
    expect(markdown).toContain('Project Memory extension authority remain disabled')
  })

  it('reports partial-with-warnings when optional artifacts are omitted', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'report-devview-baseline',
        '--roadmap-audit',
        'generated/roadmap.json',
        '--final-handoff',
        'generated/final-handoff.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.baselineCompletenessStatus).toBe('partial-with-warnings')
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'DEVVIEW_BASELINE_OPTIONAL_INPUT_NOT_PROVIDED',
    )
    expect(
      payload.sourceArtifacts.filter((entry: { readStatus: string }) => entry.readStatus === 'missing-optional'),
    ).toHaveLength(16)
    expectSafetyFalse(payload.safetyInvariantSummary)
  })

  it('summarizes blocked Guarded Graph Update apply plans as blocked source facts', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    writeJson(
      join(workspace, 'generated/guarded-apply-plan.json'),
      guardedGraphUpdateApplyPlan('devview-guarded-graph-update-apply-plan-blocked'),
    )

    const result = await runDevViewCli([...baseArgs(), '--output', '.tmp/baseline.json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    const applyPlan = payload.sourceArtifacts.find(
      (entry: { sourceId: string }) => entry.sourceId === 'guarded-graph-update-apply-plan',
    )
    expect(applyPlan.classification).toBe('blocked')
    expect(applyPlan.sourceFactSummary.applyPlanStatus).toBe('blocked-no-concrete-operations')
    expect(payload.safetyInvariantSummary.graphDeltaApplied).toBe(false)
    expect(payload.safetyInvariantSummary.graphSourceMutated).toBe(false)
  })

  it('blocks unsafe output overwrite before writing', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    const before = readFileSync(join(workspace, 'generated/roadmap.json'), 'utf8')

    const result = await runDevViewCli([...baseArgs(), '--output', 'generated/roadmap.json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('would overwrite the source Roadmap completion audit')
    expect(readFileSync(join(workspace, 'generated/roadmap.json'), 'utf8')).toBe(before)
  })

  it('blocks unsafe Markdown before JSON output is written', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    const before = readFileSync(join(workspace, 'generated/frontend-chain.json'), 'utf8')

    const result = await runDevViewCli(
      [...baseArgs(), '--output', '.tmp/baseline.json', '--markdown', 'generated/frontend-chain.json'],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('would overwrite the source Frontend chain report')
    expect(existsSync(join(workspace, '.tmp/baseline.json'))).toBe(false)
    expect(readFileSync(join(workspace, 'generated/frontend-chain.json'), 'utf8')).toBe(before)
  })

  it('blocks unsafe authority signals in provided artifacts', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace, {
      finalHandoff: {
        safetyInvariantSummary: {
          graphDeltaApplied: true,
        },
      },
    })

    const result = await runDevViewCli([...baseArgs(), '--output', '.tmp/baseline.json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('graphDeltaApplied')
    expect(existsSync(join(workspace, '.tmp/baseline.json'))).toBe(false)
  })

  it('blocks unsafe accepted Evidence source records', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    writeJson(join(workspace, 'generated/accepted-evidence.json'), {
      ...acceptedEvidenceRecord(),
      runtimeEvidenceSatisfied: true,
    })

    const result = await runDevViewCli([...baseArgs(), '--output', '.tmp/baseline.json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('runtimeEvidenceSatisfied')
    expect(existsSync(join(workspace, '.tmp/baseline.json'))).toBe(false)
  })

  it('blocks wrong Guarded Graph Update apply plan source with zero writes', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    writeJson(join(workspace, 'generated/guarded-apply-plan.json'), {
      artifactRole: 'devview-graph-delta-apply-report',
      status: 'devview-graph-delta-apply-blocked',
      applyPlanOnly: true,
      graphDeltaApplied: true,
      graphSourceMutated: false,
      providerInvoked: false,
      networkCallMade: false,
      hooksActivated: false,
      approvalAutomationEnabled: false,
      userAcceptanceAutomated: false,
    })

    const result = await runDevViewCli([...baseArgs(), '--output', '.tmp/baseline.json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('Guarded Graph Update apply plan')
    expect(existsSync(join(workspace, '.tmp/baseline.json'))).toBe(false)
  })

  it('blocks evidenceAccepted true outside accepted Evidence records', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    writeJson(join(workspace, 'generated/evidence-decision.json'), {
      artifactRole: 'devview-evidence-decision-record',
      status: 'devview-evidence-decision-recorded',
      evidenceAccepted: true,
      runtimeEvidenceSatisfied: false,
      equivalenceProven: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
      graphDeltaApplied: false,
      graphSourceMutated: false,
    })

    const result = await runDevViewCli([...baseArgs(), '--output', '.tmp/baseline.json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('evidenceAccepted')
    expect(existsSync(join(workspace, '.tmp/baseline.json'))).toBe(false)
  })

  it('blocks Scope/CI true flags outside the exact Scope/CI enforcement record source shape', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    writeJson(join(workspace, 'generated/scope-ci-record.json'), {
      artifactRole: 'devview-scope-ci-enforcement-readiness-preview',
      status: 'devview-scope-ci-enforcement-readiness-ready',
      scopeEnforced: true,
      ciEnforcementEnabled: true,
      runtimeEvidenceSatisfied: false,
      evidenceAccepted: false,
      equivalenceProven: false,
      graphDeltaApplied: false,
      graphSourceMutated: false,
    })

    const result = await runDevViewCli([...baseArgs(), '--output', '.tmp/baseline.json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('scopeEnforced')
    expect(existsSync(join(workspace, '.tmp/baseline.json'))).toBe(false)
  })

  it('blocks guardedUpdateReady true outside the exact Guarded Graph Update boundary record source shape', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    writeJson(join(workspace, 'generated/guarded-boundary-record.json'), {
      artifactRole: 'devview-graph-delta-apply-report',
      status: 'devview-graph-delta-apply-blocked',
      guardedUpdateReady: true,
      graphDeltaApplied: false,
      graphSourceMutated: false,
    })

    const result = await runDevViewCli([...baseArgs(), '--output', '.tmp/baseline.json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('guardedUpdateReady')
    expect(existsSync(join(workspace, '.tmp/baseline.json'))).toBe(false)
  })

  it('blocks new optional source overwrite before JSON output is written', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    const before = readFileSync(join(workspace, 'generated/runtime-evidence-satisfaction-readiness.json'), 'utf8')

    const result = await runDevViewCli(
      [
        ...baseArgs(),
        '--output',
        '.tmp/baseline.json',
        '--markdown',
        'generated/runtime-evidence-satisfaction-readiness.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('Runtime Evidence satisfaction readiness')
    expect(existsSync(join(workspace, '.tmp/baseline.json'))).toBe(false)
    expect(readFileSync(join(workspace, 'generated/runtime-evidence-satisfaction-readiness.json'), 'utf8')).toBe(before)
  })
})

function baseArgs(): string[] {
  return [
    'graph',
    'read-model',
    'report-devview-baseline',
    '--roadmap-audit',
    'generated/roadmap.json',
    '--final-handoff',
    'generated/final-handoff.json',
    '--frontend-chain',
    'generated/frontend-chain.json',
    '--hook-activation-chain',
    'generated/hook-activation.json',
    '--extension-readiness',
    'generated/extension-readiness.json',
    '--apply-readiness',
    'generated/apply-readiness.json',
    '--approved-apply-dry-run',
    'generated/approved-apply-dry-run.json',
    '--apply-report',
    'generated/graph-delta-apply-report.json',
    '--mutation-readiness',
    'generated/mutation-readiness.json',
    '--evidence-acceptance-readiness',
    'generated/evidence-readiness.json',
    '--evidence-decision',
    'generated/evidence-decision.json',
    '--accepted-evidence',
    'generated/accepted-evidence.json',
    '--runtime-evidence-satisfaction-readiness',
    'generated/runtime-evidence-satisfaction-readiness.json',
    '--equivalence-proof-readiness',
    'generated/equivalence-readiness.json',
    '--scope-ci-enforcement-readiness',
    'generated/scope-ci-readiness.json',
    '--scope-ci-enforcement-record',
    'generated/scope-ci-record.json',
    '--guarded-graph-update-boundary-record',
    'generated/guarded-boundary-record.json',
    '--guarded-graph-update-apply-plan',
    'generated/guarded-apply-plan.json',
    '--json',
  ]
}

function writeBaselineInputs(
  workspace: string,
  overrides: {
    roadmap?: Record<string, unknown>
    finalHandoff?: Record<string, unknown>
  } = {},
): void {
  writeJson(join(workspace, 'generated/frontend-chain.json'), {
    artifactRole: 'devview-frontend-chain-report',
    status: 'devview-frontend-chain-report-generated',
    terminalStage: 'instruction-pack-preview-generated-no-codex-execution',
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  })
  writeJson(join(workspace, 'generated/hook-activation.json'), {
    artifactRole: 'devview-hook-activation-chain-report',
    status: 'devview-hook-activation-chain-report-generated',
    hooksActive: false,
    hookScriptsInstalled: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    actualBlockingHookBehaviorImplemented: false,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  })
  writeJson(join(workspace, 'generated/extension-readiness.json'), {
    artifactRole: 'devview-extension-readiness-report',
    status: 'devview-extension-readiness-ready',
    readinessStatus: 'ready-extension-manifests-validated',
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
    shellCommandsExecuted: false,
    filesMutated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    nonEnforcing: true,
  })
  writeJson(join(workspace, 'generated/apply-readiness.json'), readiness('devview-graph-delta-apply-readiness-preview'))
  writeJson(join(workspace, 'generated/approved-apply-dry-run.json'), {
    artifactRole: 'devview-approved-apply-dry-run-report',
    status: 'devview-approved-apply-dry-run-ready',
    dryRunReadinessStatus: 'dry-run-ready-for-future-apply-command',
    nonEnforcing: true,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  })
  writeJson(join(workspace, 'generated/graph-delta-apply-report.json'), {
    artifactRole: 'devview-graph-delta-apply-report',
    status: 'devview-graph-delta-apply-blocked',
    applyStatus: 'blocked-no-concrete-mutation-operations',
    mutationApplied: false,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  })
  writeJson(
    join(workspace, 'generated/mutation-readiness.json'),
    readiness('devview-graph-source-mutation-readiness-preview'),
  )
  writeJson(
    join(workspace, 'generated/evidence-readiness.json'),
    readiness('devview-evidence-acceptance-readiness-preview'),
  )
  writeJson(join(workspace, 'generated/evidence-decision.json'), {
    artifactRole: 'devview-evidence-decision-record',
    status: 'devview-evidence-decision-recorded',
    decisionKind: 'accept',
    decisionValue: 'accept-evidence',
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    graphDeltaApplied: false,
    graphSourceMutated: false,
  })
  writeJson(join(workspace, 'generated/accepted-evidence.json'), acceptedEvidenceRecord())
  writeJson(join(workspace, 'generated/runtime-evidence-satisfaction-readiness.json'), {
    artifactRole: 'devview-runtime-evidence-satisfaction-readiness-preview',
    status: 'devview-runtime-evidence-satisfaction-readiness-blocked',
    runtimeEvidenceSatisfactionReadinessStatus: 'blocked-required-obligation-mismatch',
    nonEnforcing: true,
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    graphDeltaApplied: false,
    graphSourceMutated: false,
  })
  writeJson(
    join(workspace, 'generated/equivalence-readiness.json'),
    readiness('devview-equivalence-proof-readiness-preview'),
  )
  writeJson(
    join(workspace, 'generated/scope-ci-readiness.json'),
    readiness('devview-scope-ci-enforcement-readiness-preview'),
  )
  writeJson(join(workspace, 'generated/scope-ci-record.json'), scopeCiEnforcementRecord())
  writeJson(join(workspace, 'generated/guarded-boundary-record.json'), guardedGraphUpdateBoundaryRecord())
  writeJson(join(workspace, 'generated/guarded-apply-plan.json'), guardedGraphUpdateApplyPlan())
  writeJson(join(workspace, 'generated/roadmap.json'), {
    artifactRole: 'devview-roadmap-completion-audit-preview',
    status: 'devview-roadmap-completion-audit-previewed',
    implementedCommandSurface: ['graph read-model report-project-memory-extension-gaps'],
    explicitlyNotImplemented: ['Codex execution', 'graph delta apply'],
    ...overrides.roadmap,
  })
  writeJson(join(workspace, 'generated/final-handoff.json'), {
    artifactRole: 'devview-roadmap-final-handoff-preview',
    status: 'devview-roadmap-final-handoff-previewed',
    handoffLanes: [
      {
        laneId: 'compiler-frontend',
        laneStatus: 'complete-for-calibration-preview',
        terminalArtifact: 'generated/instruction-pack.json',
        authorityBoundary: 'Instruction Pack preview is not Codex execution.',
      },
      {
        laneId: 'activation-preview',
        laneStatus: 'preview-chain-complete-no-active-hooks',
        terminalArtifacts: ['generated/hook-activation.json'],
        authorityBoundary: 'Hooks are not installed, active, trusted, or blocking.',
      },
      {
        laneId: 'project-specific-extension-foundation',
        laneStatus: 'report-only-extension-readiness-ready',
        terminalArtifacts: ['generated/extension-readiness.json'],
        authorityBoundary:
          'Extension manifests are declarative only; no extension code, provider, network, shell, mutation, or enforcement authority is granted.',
      },
      {
        laneId: 'phase-13-controlled-apply-readiness',
        laneStatus: 'readiness-chain-connected-currently-blocked-by-defer-decision',
        terminalArtifacts: ['generated/scope-ci-readiness.json'],
        authorityBoundary: 'Apply, mutation, evidence, proof, and enforcement stay blocked.',
      },
    ],
    explicitlyStillDisabled: ['LLM/API provider execution', 'scope enforcement'],
    safetyInvariantSummary: {
      graphSourceMutated: false,
      graphDeltaApplied: false,
      runtimeEvidenceSatisfied: false,
      equivalenceProven: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
      strictModeEnabled: false,
      guidedEnforcementEnabled: false,
    },
    ...overrides.finalHandoff,
  })
}

function acceptedEvidenceRecord(): Record<string, unknown> {
  return {
    artifactRole: 'devview-accepted-evidence-record',
    status: 'devview-accepted-evidence-recorded',
    acceptedEvidenceState: 'accepted-evidence-recorded-not-runtime-satisfied',
    evidenceAccepted: true,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
  }
}

function scopeCiEnforcementRecord(): Record<string, unknown> {
  return {
    artifactRole: 'devview-scope-ci-enforcement-record',
    status: 'devview-scope-ci-enforcement-recorded',
    scopeCiEnforcementState: 'scope-ci-enforcement-recorded-no-external-ci-mutation',
    scopeEnforced: true,
    ciEnforcementEnabled: true,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    requiredChecksConfigured: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    hooksActivated: false,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    providerInvoked: false,
    networkCallMade: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    shellCommandsExecuted: false,
    filesMutated: false,
  }
}

function guardedGraphUpdateBoundaryRecord(): Record<string, unknown> {
  return {
    artifactRole: 'devview-guarded-graph-update-boundary-record',
    status: 'devview-guarded-graph-update-boundary-ready',
    guardedGraphUpdateBoundaryState: 'ready-for-future-guarded-graph-update-apply-command-no-mutation',
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
  }
}

function guardedGraphUpdateApplyPlan(
  status:
    | 'devview-guarded-graph-update-apply-plan-ready'
    | 'devview-guarded-graph-update-apply-plan-blocked' = 'devview-guarded-graph-update-apply-plan-ready',
): Record<string, unknown> {
  return {
    artifactRole: 'devview-guarded-graph-update-apply-plan',
    status,
    applyPlanStatus:
      status === 'devview-guarded-graph-update-apply-plan-ready'
        ? 'ready-deterministic-diff-preview-created'
        : 'blocked-no-concrete-operations',
    graphSourceOriginalHash: 'sha256:graph-source',
    planComparisonStatus: 'matched-boundary-proposal-and-current-graph-source',
    operationSummary: {
      operationCount: 1,
      supportedOperationCount: status === 'devview-guarded-graph-update-apply-plan-ready' ? 1 : 0,
      unsupportedOperationCount: status === 'devview-guarded-graph-update-apply-plan-ready' ? 0 : 1,
      operationKinds: ['update-node'],
    },
    unresolvedOperations: status === 'devview-guarded-graph-update-apply-plan-ready' ? [] : [{ code: 'NO_CONCRETE' }],
    guardedUpdateReady: false,
    applyPlanOnly: true,
    applyCommandExecuted: false,
    applyCommandEnabled: false,
    applyDeferred: true,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    providerInvoked: false,
    networkCallMade: false,
    hooksActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function readiness(artifactRole: string): Record<string, unknown> {
  return {
    artifactRole,
    status: `${artifactRole.replace('-preview', '')}-blocked`,
    graphDeltaApplied: false,
    graphSourceMutated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    requiredChecksConfigured: false,
    branchProtectionChanged: false,
    diffRejectionEnabled: false,
  }
}

function expectSafetyFalse(summary: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(summary)) {
    expect(value, key).toBe(false)
  }
}
