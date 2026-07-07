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
    expect(payload.sourceExtensionProfileCatalog).toBe('generated/extension-profile-catalog.json')
    expect(payload.sourceExtensionContextPlan).toBe('generated/extension-context-plan.json')
    expect(payload.sourceExtensionAdapterCompatibilityReport).toBe('generated/extension-adapter-compatibility.json')
    expect(payload.sourceNativeRetrofitProfileValidationReport).toBe(
      'generated/native-retrofit-profile-validation.json',
    )
    expect(payload.sourceEvidenceDecision).toBe('generated/evidence-decision.json')
    expect(payload.sourceAcceptedEvidence).toBe('generated/accepted-evidence.json')
    expect(payload.sourceRuntimeEvidenceSatisfactionReadiness).toBe(
      'generated/runtime-evidence-satisfaction-readiness.json',
    )
    expect(payload.sourceScopeCiEnforcementRecord).toBe('generated/scope-ci-record.json')
    expect(payload.sourceGuardedGraphUpdateBoundaryRecord).toBe('generated/guarded-boundary-record.json')
    expect(payload.sourceGuardedGraphUpdateApplyPlan).toBe('generated/guarded-apply-plan.json')
    expect(payload.sourceGuardedGraphUpdateApplyReport).toBe('generated/guarded-apply-report.json')
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
        ['extension-profile-catalog', 'advisory'],
        ['extension-context-plan', 'advisory'],
        ['extension-adapter-compatibility-report', 'advisory'],
        ['native-retrofit-profile-validation-report', 'advisory'],
        ['evidence-decision', 'completed'],
        ['accepted-evidence', 'completed'],
        ['runtime-evidence-satisfaction-readiness', 'blocked'],
        ['equivalence-proof-readiness', 'blocked'],
        ['scope-ci-enforcement-readiness', 'blocked'],
        ['scope-ci-enforcement-record', 'completed'],
        ['guarded-graph-update-boundary-record', 'completed'],
        ['guarded-graph-update-apply-plan', 'advisory'],
        ['guarded-graph-update-apply-report', 'completed'],
      ]),
    )
    expect(
      payload.sourceArtifacts.find((entry: { sourceId: string }) => entry.sourceId === 'extension-profile-catalog')
        .sourceFactSummary,
    ).toEqual(
      expect.objectContaining({
        extensionCatalogStatus: 'compiled-declarative-capabilities-only',
        catalogEntryCount: 2,
        graphIngestionCandidateCount: 1,
        nativeRetrofitHintStatus: 'profile-mode-declared',
        nativeRetrofitMode: 'native',
        downstreamCompatibility: expect.objectContaining({
          canInformViewTree: true,
          canInformContextPack: true,
          canInformEvidenceAdapterValidation: true,
          canInformPolicyValidation: true,
          canInformGraphIngestionPlanning: true,
          canExecuteExtensionCode: false,
        }),
      }),
    )
    expect(
      payload.sourceArtifacts.find((entry: { sourceId: string }) => entry.sourceId === 'extension-context-plan')
        .sourceFactSummary,
    ).toEqual(
      expect.objectContaining({
        extensionContextPlanStatus: 'generated-report-only-hints',
        planningScope: 'extension-context-planning-report-only',
        viewTreeHintCount: 1,
        canInformViewTree: true,
        contextPackHintCount: 1,
        canInformContextPack: true,
        evidenceAdapterCount: 1,
        policyExtensionCount: 1,
        graphIngestionCandidateCount: 1,
        nativeRetrofitHintStatus: 'profile-mode-declared',
        downstreamActionCount: 3,
        sourceViewTreeAlignmentSupplied: true,
        sourceContextPackAlignmentSupplied: true,
        traversalAuthorityGranted: false,
        viewTreeMutated: false,
        contextPackMutated: false,
      }),
    )
    expect(
      payload.sourceArtifacts.find(
        (entry: { sourceId: string }) => entry.sourceId === 'extension-adapter-compatibility-report',
      ).sourceFactSummary,
    ).toEqual(
      expect.objectContaining({
        adapterCompatibilityStatus: 'validated-report-only-compatibility',
        compatibilityScope: 'extension-adapter-compatibility-report-only',
        evidenceAdapterCompatibilityStatus: 'compatible',
        evidenceAdapterCount: 1,
        policyExtensionCompatibilityStatus: 'compatible',
        policyExtensionCount: 1,
        proofLifecycleCompatibilityStatus: 'compatible',
        readinessSourceComparisonCount: 3,
        graphIngestionCandidateCount: 1,
        nativeRetrofitHintStatus: 'profile-mode-declared',
        downstreamActionCount: 3,
        adapterExecuted: false,
        policyEnforced: false,
        runtimeEvidenceSatisfied: false,
        equivalenceProven: false,
        scopeEnforced: false,
        ciEnforcementEnabled: false,
      }),
    )
    expect(
      payload.sourceArtifacts.find(
        (entry: { sourceId: string }) => entry.sourceId === 'native-retrofit-profile-validation-report',
      ).sourceFactSummary,
    ).toEqual(
      expect.objectContaining({
        nativeRetrofitValidationStatus: 'passed-report-only-profile-validation',
        nativeRetrofitMode: 'native',
        modeInferenceStatus: 'mode-declared-in-project-profile',
        modeCoverageStatus: 'covered',
        evidenceAdapterCoverageStatus: 'covered',
        policyScopeCoverageStatus: 'covered',
        graphIngestionCoverageStatus: 'covered',
        nativeBoundaryCoverageStatus: 'covered',
        retrofitParityCoverageStatus: 'future-only',
        validationFindingCount: 0,
        downstreamActionCount: 1,
        extensionExecutionAllowed: false,
        providerInvoked: false,
        networkCallMade: false,
        shellCommandsExecuted: false,
        graphSourceMutated: false,
        graphDeltaApplied: false,
      }),
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
    ).toHaveLength(21)
    expectSafetyFalse(payload.safetyInvariantSummary)
  })

  it('blocks wrong extension profile catalog role/status with execution flags as zero-write', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    writeJson(join(workspace, 'generated/not-extension-catalog.json'), {
      artifactRole: 'devview-extension-readiness-report',
      status: 'devview-extension-readiness-ready',
      extensionExecutionAllowed: true,
      providerInvoked: true,
      networkCallMade: true,
      shellCommandsExecuted: true,
    })

    const result = await runDevViewCli(
      [
        ...baseArgs(),
        '--extension-profile-catalog',
        'generated/not-extension-catalog.json',
        '--output',
        '.tmp/baseline.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('EXTENSION_PROFILE_CATALOG_ROLE_STATUS_INVALID')
    expect(existsSync(join(workspace, '.tmp/baseline.json'))).toBe(false)
  })

  it('blocks wrong extension context plan role/status with traversal or execution flags as zero-write', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    writeJson(join(workspace, 'generated/not-extension-context-plan.json'), {
      artifactRole: 'devview-extension-profile-catalog',
      status: 'devview-extension-profile-catalog-compiled',
      extensionExecutionAllowed: true,
      providerInvoked: true,
      networkCallMade: true,
      shellCommandsExecuted: true,
      traversalAuthorityGranted: true,
      viewTreeMutated: true,
      contextPackMutated: true,
    })

    const result = await runDevViewCli(
      [
        ...baseArgs(),
        '--extension-context-plan',
        'generated/not-extension-context-plan.json',
        '--output',
        '.tmp/baseline.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('EXTENSION_CONTEXT_PLAN_ROLE_STATUS_INVALID')
    expect(existsSync(join(workspace, '.tmp/baseline.json'))).toBe(false)
  })

  it('blocks wrong extension adapter compatibility report role/status with authority flags as zero-write', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    writeJson(join(workspace, 'generated/not-extension-adapter-compatibility.json'), {
      artifactRole: 'devview-extension-context-plan',
      status: 'devview-extension-context-plan-generated',
      adapterExecuted: true,
      policyEnforced: true,
      providerInvoked: true,
      networkCallMade: true,
      shellCommandsExecuted: true,
      runtimeEvidenceSatisfied: true,
      equivalenceProven: true,
      scopeEnforced: true,
      graphSourceMutated: true,
    })

    const result = await runDevViewCli(
      [
        ...baseArgs(),
        '--extension-adapter-compatibility-report',
        'generated/not-extension-adapter-compatibility.json',
        '--output',
        '.tmp/baseline.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('EXTENSION_ADAPTER_COMPATIBILITY_ROLE_STATUS_INVALID')
    expect(existsSync(join(workspace, '.tmp/baseline.json'))).toBe(false)
  })

  it('blocks wrong Native/Retrofit validation report role/status with authority flags as zero-write', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    writeJson(join(workspace, 'generated/not-native-retrofit-profile-validation.json'), {
      artifactRole: 'devview-extension-adapter-compatibility-report',
      status: 'devview-extension-adapter-compatibility-validated',
      providerInvoked: true,
      networkCallMade: true,
      shellCommandsExecuted: true,
      extensionExecutionAllowed: true,
      graphSourceMutated: true,
      graphDeltaApplied: true,
      runtimeEvidenceSatisfied: true,
      equivalenceProven: true,
      scopeEnforced: true,
    })

    const result = await runDevViewCli(
      [
        ...baseArgs(),
        '--native-retrofit-profile-validation-report',
        'generated/not-native-retrofit-profile-validation.json',
        '--output',
        '.tmp/baseline.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('NATIVE_RETROFIT_PROFILE_VALIDATION_ROLE_STATUS_INVALID')
    expect(existsSync(join(workspace, '.tmp/baseline.json'))).toBe(false)
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

  it('accepts successful Guarded Graph Update apply reports as source facts without baseline mutation authority', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    writeJson(join(workspace, 'generated/guarded-apply-report.json'), guardedGraphUpdateApplyReport())

    const result = await runDevViewCli(
      [
        ...baseArgs(),
        '--guarded-graph-update-apply-report',
        'generated/guarded-apply-report.json',
        '--output',
        '.tmp/baseline.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const applyReport = payload.sourceArtifacts.find(
      (entry: { sourceId: string }) => entry.sourceId === 'guarded-graph-update-apply-report',
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(applyReport.classification).toBe('completed')
    expect(applyReport.sourceFactSummary).toEqual(
      expect.objectContaining({
        applyStatus: 'applied-graph-source-mutated',
        sourceGraphUpdateApplied: true,
        sourceGraphDeltaApplied: true,
        sourceGraphSourceMutated: true,
        sourceFilesMutated: true,
        mutatedFilePaths: ['.tmp/guarded-graph-update-apply/graph-source.json'],
        graphSourceMutatedHash: 'sha256:mutated-graph',
        operationCount: 1,
        rollbackAttempted: false,
      }),
    )
    expectSafetyFalse(payload.safetyInvariantSummary)
  })

  it('summarizes rolled-back Guarded Graph Update apply reports as blocked source facts', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    writeJson(
      join(workspace, 'generated/guarded-apply-report.json'),
      guardedGraphUpdateApplyReport('devview-guarded-graph-update-apply-rolled-back'),
    )

    const result = await runDevViewCli(
      [
        ...baseArgs(),
        '--guarded-graph-update-apply-report',
        'generated/guarded-apply-report.json',
        '--output',
        '.tmp/baseline.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const applyReport = payload.sourceArtifacts.find(
      (entry: { sourceId: string }) => entry.sourceId === 'guarded-graph-update-apply-report',
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(applyReport.classification).toBe('blocked')
    expect(applyReport.sourceFactSummary).toEqual(
      expect.objectContaining({
        sourceGraphUpdateApplied: false,
        sourceGraphUpdateRolledBack: true,
        sourceGraphDeltaApplied: false,
        sourceGraphSourceMutated: false,
        sourceFilesMutated: false,
        rollbackAttempted: true,
        rollbackStatus: 'restored-from-backup',
      }),
    )
    expectSafetyFalse(payload.safetyInvariantSummary)
  })

  it('blocks wrong Guarded Graph Update apply report role/status with mutation true as zero-write', async () => {
    const workspace = createWorkspace()
    writeBaselineInputs(workspace)
    writeJson(join(workspace, 'generated/not-guarded-apply-report.json'), {
      artifactRole: 'devview-guarded-graph-update-apply-plan',
      status: 'devview-guarded-graph-update-apply-plan-ready',
      graphDeltaApplied: true,
      graphSourceMutated: true,
      filesMutated: true,
      providerInvoked: false,
      networkCallMade: false,
    })

    const result = await runDevViewCli(
      [
        ...baseArgs(),
        '--guarded-graph-update-apply-report',
        'generated/not-guarded-apply-report.json',
        '--output',
        '.tmp/baseline.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('GUARDED_APPLY_REPORT_ROLE_STATUS_INVALID')
    expect(existsSync(join(workspace, '.tmp/baseline.json'))).toBe(false)
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
    '--extension-profile-catalog',
    'generated/extension-profile-catalog.json',
    '--extension-context-plan',
    'generated/extension-context-plan.json',
    '--extension-adapter-compatibility-report',
    'generated/extension-adapter-compatibility.json',
    '--native-retrofit-profile-validation-report',
    'generated/native-retrofit-profile-validation.json',
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
    '--guarded-graph-update-apply-report',
    'generated/guarded-apply-report.json',
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
  writeJson(join(workspace, 'generated/extension-profile-catalog.json'), extensionProfileCatalog())
  writeJson(join(workspace, 'generated/extension-context-plan.json'), extensionContextPlan())
  writeJson(join(workspace, 'generated/extension-adapter-compatibility.json'), extensionAdapterCompatibilityReport())
  writeJson(
    join(workspace, 'generated/native-retrofit-profile-validation.json'),
    nativeRetrofitProfileValidationReport(),
  )
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
  writeJson(join(workspace, 'generated/guarded-apply-report.json'), guardedGraphUpdateApplyReport())
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

function extensionProfileCatalog(
  status:
    | 'devview-extension-profile-catalog-compiled'
    | 'devview-extension-profile-catalog-blocked' = 'devview-extension-profile-catalog-compiled',
): Record<string, unknown> {
  return {
    artifactRole: 'devview-extension-profile-catalog',
    status,
    extensionCatalogStatus:
      status === 'devview-extension-profile-catalog-compiled'
        ? 'compiled-declarative-capabilities-only'
        : 'blocked-invalid-extension-manifest',
    catalogEntryCount: 2,
    extensionCatalogEntries: [
      { extensionId: 'todo-view-tree', extensionKind: 'view-tree-extractor' },
      { extensionId: 'todo-graphify-protocol', extensionKind: 'analyzer' },
    ],
    capabilityCatalog: {
      analyzerExtensions: ['todo-graphify-protocol'],
      viewTreeExtractorExtensions: ['todo-view-tree'],
      contextPackExtensions: ['todo-view-tree'],
      evidenceAdapters: ['todo-view-tree'],
      policyExtensions: ['todo-view-tree'],
      skillWorkflowExtensions: [],
      graphIngestionCandidates: ['todo-graphify-protocol'],
    },
    graphIngestionCandidates: [
      {
        extensionId: 'todo-graphify-protocol',
        protocolStatus: 'protocol-only-not-executed',
      },
    ],
    nativeRetrofitProfileHints: {
      mode: 'native',
      hintStatus: 'profile-mode-declared',
      nativeSignals: ['native'],
      retrofitSignals: [],
      sourceFields: ['projectMode'],
      futureFieldCandidates: [],
    },
    downstreamCompatibility: {
      canInformViewTree: true,
      canInformContextPack: true,
      canInformEvidenceAdapterValidation: true,
      canInformPolicyValidation: true,
      canInformGraphIngestionPlanning: true,
      canExecuteExtensionCode: false,
      canSatisfyEvidence: false,
      canProveEquivalence: false,
      canEnforceScope: false,
    },
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
    hooksActivated: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
  }
}

function extensionContextPlan(
  status:
    | 'devview-extension-context-plan-generated'
    | 'devview-extension-context-plan-blocked' = 'devview-extension-context-plan-generated',
): Record<string, unknown> {
  return {
    artifactRole: 'devview-extension-context-plan',
    status,
    planningScope: 'extension-context-planning-report-only',
    extensionContextPlanStatus:
      status === 'devview-extension-context-plan-generated'
        ? 'generated-report-only-hints'
        : 'blocked-extension-profile-catalog-invalid',
    sourceExtensionProfileCatalog: 'generated/extension-profile-catalog.json',
    sourceViewTree: 'generated/view-tree.json',
    sourceContextPack: 'generated/context-pack.json',
    viewTreeHintPlan: {
      applicableViewTreeExtractorExtensions: ['todo-view-tree'],
      analyzerExtensions: ['todo-graphify-protocol'],
      graphIngestionCandidates: ['todo-graphify-protocol'],
      canInformViewTree: true,
      alignmentStatus: 'view-tree-extension-hints-available-for-source-view-tree',
      authorityStatus: 'hint-only-not-traversal-authority',
    },
    contextPackHintPlan: {
      contextPackExtensions: ['todo-view-tree'],
      analyzerExtensions: ['todo-graphify-protocol'],
      canInformContextPack: true,
      alignmentStatus: 'context-pack-extension-hints-available-for-source-context-pack',
      authorityStatus: 'hint-only-not-context-pack-authority',
    },
    evidencePolicyHintPlan: {
      evidenceAdapters: ['todo-evidence-adapter'],
      policyExtensions: ['todo-policy-extension'],
      canSatisfyEvidence: false,
      canProveEquivalence: false,
      canEnforceScope: false,
      authorityStatus: 'hint-only-not-evidence-proof-or-scope-authority',
    },
    graphIngestionPlanning: {
      candidates: [{ extensionId: 'todo-graphify-protocol', graphProviderKind: 'graphify' }],
      candidateCount: 1,
      graphifyCandidateCount: 1,
      providerInvoked: false,
      networkCallMade: false,
      shellCommandsExecuted: false,
      executionAllowed: false,
      authorityStatus: 'protocol-only-not-graph-ingestion-authority',
    },
    nativeRetrofitPlanning: {
      mode: 'native',
      hintStatus: 'profile-mode-declared',
    },
    downstreamActionPlan: [
      { actionId: 'connect-view-tree-hints' },
      { actionId: 'connect-context-pack-hints' },
      { actionId: 'plan-graph-ingestion-protocol' },
    ],
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
    hooksActivated: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    traversalAuthorityGranted: false,
    viewTreeMutated: false,
    contextPackMutated: false,
  }
}

function extensionAdapterCompatibilityReport(
  status:
    | 'devview-extension-adapter-compatibility-validated'
    | 'devview-extension-adapter-compatibility-blocked' = 'devview-extension-adapter-compatibility-validated',
): Record<string, unknown> {
  return {
    artifactRole: 'devview-extension-adapter-compatibility-report',
    status,
    compatibilityScope: 'extension-adapter-compatibility-report-only',
    adapterCompatibilityStatus:
      status === 'devview-extension-adapter-compatibility-validated'
        ? 'validated-report-only-compatibility'
        : 'blocked-source-chain-mismatch',
    sourceExtensionProfileCatalog: 'generated/extension-profile-catalog.json',
    sourceExtensionContextPlan: 'generated/extension-context-plan.json',
    evidenceAdapterCompatibility: {
      compatibilityStatus: 'compatible',
      extensionIds: ['todo-evidence-adapter'],
      sourceReadinessStatus: 'devview-runtime-evidence-satisfaction-readiness-blocked',
      requiredMappingId: 'required-evidence-1',
      adapterExecuted: false,
      runtimeEvidenceSatisfied: false,
      equivalenceProven: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
      authorityStatus: 'source-fact-only-not-lifecycle-authority',
    },
    policyExtensionCompatibility: {
      compatibilityStatus: 'compatible',
      extensionIds: ['todo-policy-extension'],
      sourceReadinessStatus: 'devview-scope-ci-enforcement-readiness-blocked',
      requiredMappingId: 'scope-ci-policy',
      policyEnforced: false,
      runtimeEvidenceSatisfied: false,
      equivalenceProven: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
      authorityStatus: 'source-fact-only-not-lifecycle-authority',
    },
    proofLifecycleCompatibility: {
      compatibilityStatus: 'compatible',
      extensionIds: ['todo-evidence-adapter'],
      sourceReadinessStatus: 'devview-equivalence-proof-readiness-blocked',
      requiredMappingId: 'equivalence-proof',
      runtimeEvidenceSatisfied: false,
      equivalenceProven: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
      authorityStatus: 'source-fact-only-not-lifecycle-authority',
    },
    readinessSourceComparisons: {
      runtimeEvidence: { comparisonStatus: 'source-summarized-only' },
      equivalenceProof: { comparisonStatus: 'source-summarized-only' },
      scopeCi: { comparisonStatus: 'source-summarized-only' },
    },
    graphIngestionPlanningContext: {
      candidateCount: 1,
      graphifyCandidateCount: 1,
      protocolStatus: 'protocol-only-not-executed',
      providerInvoked: false,
      networkCallMade: false,
      shellCommandsExecuted: false,
      executionAllowed: false,
    },
    nativeRetrofitAdapterHints: {
      mode: 'native',
      hintStatus: 'profile-mode-declared',
      nativeSignals: ['native'],
      retrofitSignals: [],
      adapterRelevanceStatus: 'native-retrofit-adapter-hints-available',
    },
    downstreamActionPlan: [
      { actionId: 'connect-evidence-adapter-validation' },
      { actionId: 'connect-policy-extension-validation' },
      { actionId: 'plan-native-retrofit-evidence-adapters' },
    ],
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    adapterExecuted: false,
    policyEnforced: false,
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
    hooksActivated: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    traversalAuthorityGranted: false,
    viewTreeMutated: false,
    contextPackMutated: false,
  }
}

function nativeRetrofitProfileValidationReport(
  status:
    | 'devview-native-retrofit-profile-validation-passed'
    | 'devview-native-retrofit-profile-validation-blocked' = 'devview-native-retrofit-profile-validation-passed',
): Record<string, unknown> {
  return {
    artifactRole: 'devview-native-retrofit-profile-validation-report',
    status,
    validationScope: 'native-retrofit-profile-validation-report-only',
    nativeRetrofitValidationStatus:
      status === 'devview-native-retrofit-profile-validation-passed'
        ? 'passed-report-only-profile-validation'
        : 'blocked-source-chain-mismatch',
    sourceProjectProfile: 'generated/project-profile.json',
    sourceExtensionProfileCatalog: 'generated/extension-profile-catalog.json',
    sourceExtensionAdapterCompatibilityReport: 'generated/extension-adapter-compatibility.json',
    sourceExtensionContextPlan: 'generated/extension-context-plan.json',
    sourceChainComparison: {
      projectProfileComparisonStatus: 'matched-profile-source',
      catalogAdapterComparisonStatus: 'matched-adapter-catalog-source',
      contextPlanComparisonStatus: 'matched-context-plan-source',
      limitations: [],
    },
    nativeRetrofitModeSummary: {
      mode: 'native',
      modeInferenceStatus: 'mode-declared-in-project-profile',
      declaredMode: 'native',
      inferredMode: null,
      nativeSignals: ['native'],
      retrofitSignals: [],
      sourceFields: ['devviewMode'],
      modeInferenceLimitations: [],
    },
    profileCoverage: {
      mode: { coverageStatus: 'covered', summary: 'Mode resolved as native.', signals: ['native'], gaps: [] },
      stackDomainPlatform: {
        coverageStatus: 'covered',
        summary: 'Project stack/domain/platform hints are present.',
        signals: ['typescript', 'windows'],
        gaps: [],
      },
      sourceBoundaryProtectedPaths: {
        coverageStatus: 'covered',
        summary: 'Source boundary hints are present.',
        signals: ['src/native'],
        gaps: [],
      },
      evidenceAdapterCoverage: {
        coverageStatus: 'covered',
        summary: 'compatible',
        signals: ['1 evidence adapter(s)'],
        gaps: [],
      },
      policyScopeCoverage: {
        coverageStatus: 'covered',
        summary: 'compatible',
        signals: ['1 policy extension(s)'],
        gaps: [],
      },
      graphIngestionCoverage: {
        coverageStatus: 'covered',
        summary: 'Protocol-only graph ingestion hints are present.',
        signals: ['1 catalog graph ingestion candidate(s)'],
        gaps: [],
      },
      nativeBoundaryCoverage: {
        coverageStatus: 'covered',
        summary: 'Native boundary hints are present.',
        signals: ['native-interop'],
        gaps: [],
      },
      retrofitParityCoverage: {
        coverageStatus: 'future-only',
        summary: 'Retrofit parity hints are not declared yet.',
        signals: [],
        gaps: ['Add retrofit parity hints if this becomes a retrofit fixture.'],
      },
    },
    validationFindings: [],
    downstreamActionPlan: [{ actionId: 'plan-native-retrofit-fixture' }],
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
    hooksActivated: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    adapterExecuted: false,
    policyEnforced: false,
    traversalAuthorityGranted: false,
    viewTreeMutated: false,
    contextPackMutated: false,
  }
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

function guardedGraphUpdateApplyReport(
  status:
    | 'devview-guarded-graph-update-applied'
    | 'devview-guarded-graph-update-apply-blocked'
    | 'devview-guarded-graph-update-apply-rolled-back' = 'devview-guarded-graph-update-applied',
): Record<string, unknown> {
  const applied = status === 'devview-guarded-graph-update-applied'
  const rolledBack = status === 'devview-guarded-graph-update-apply-rolled-back'
  return {
    artifactRole: 'devview-guarded-graph-update-apply-report',
    status,
    applyStatus: applied
      ? 'applied-graph-source-mutated'
      : rolledBack
        ? 'rolled-back-post-apply-verification-failed'
        : 'blocked-apply-plan-not-ready',
    graphSourceOriginalHash: 'sha256:graph-source',
    graphSourceMutatedHash: applied ? 'sha256:mutated-graph' : null,
    graphDeltaApplied: applied,
    graphSourceMutated: applied,
    filesMutated: applied,
    mutatedFilePaths: applied ? ['.tmp/guarded-graph-update-apply/graph-source.json'] : [],
    concreteOperationCount: 1,
    operationApplicationSummary: {
      operationCount: 1,
      targetKinds: ['node'],
      fieldPaths: ['status'],
    },
    rollbackAttempted: rolledBack,
    rollbackStatus: rolledBack ? 'restored-from-backup' : 'not-needed',
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
