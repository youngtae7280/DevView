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

describe('DevView Work Journal renderer', () => {
  it('renders cumulative static journal data and HTML without authority promotion', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)

    const result = await runDevViewCli(workJournalArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)
    const data = JSON.parse(readFileSync(join(workspace, '.devview/generated/work-journal/index.data.json'), 'utf8'))
    const run = JSON.parse(
      readFileSync(join(workspace, '.devview/generated/work-journal/runs/todo-add/run.json'), 'utf8'),
    )
    const html = readFileSync(join(workspace, '.devview/generated/work-journal/index.html'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('work-journal render')
    expect(payload.artifactRole).toBe('devview-work-journal-data-preview')
    expect(payload.htmlArtifactRole).toBe('devview-work-journal-html-preview')
    expect(data.artifactRole).toBe('devview-work-journal-data-preview')
    expect(data.htmlArtifactRole).toBe('devview-work-journal-html-preview')
    expect(data.currentRunId).toBe('todo-add')
    expect(data.runs).toHaveLength(1)
    expect(run.runId).toBe('todo-add')
    expect(run.status).toBe('blocked')
    expect(run.blockedReason).toContain('Runtime Evidence')
    expect(run.evidenceSummary).toEqual(
      expect.objectContaining({
        required: 2,
        provided: 0,
        missing: 2,
        status: 'devview-runtime-evidence-satisfaction-readiness-blocked',
      }),
    )
    expect(run.scopeSummary).toEqual(
      expect.objectContaining({
        allowed: 2,
        forbidden: 1,
        violations: 0,
        protectedPathBlocks: 1,
      }),
    )
    expect(run.authoritySummary.runtimeEvidence.displayState).toBe('preview-only-blocked')
    expect(run.authoritySummary.equivalenceProof.displayState).toBe('preview-only-blocked')
    expect(run.authoritySummary.scopeCi.displayState).toBe('preview-only-blocked')
    expect(run.authoritySummary.guardedUpdate.displayState).toBe('blocked')
    expect(run.authoritySummary.guardedUpdate.nextAction).toContain('Resolve blocked graph update')
    expect(run.authoritySummary.journalAuthorityFlags.runtimeEvidenceSatisfied).toBe(false)
    expect(run.authoritySummary.journalAuthorityFlags.equivalenceProven).toBe(false)
    expect(run.flow.map((step: { label: string }) => step.label)).toEqual([
      'Maintainability Graph',
      'View Tree',
      'Context Pack',
      'Instruction Pack',
      'Project Extensions',
      'Runtime Evidence',
      'Equivalence Proof',
      'Graph Delta',
      'Guarded Update',
      'Scope/CI',
    ])
    expect(run.artifacts.map((artifact: { sourceId: string }) => artifact.sourceId)).toEqual(
      expect.arrayContaining([
        'baseline',
        'maintainability-graph',
        'view-tree',
        'context-pack',
        'instruction-pack',
        'extension-readiness',
        'runtime-evidence-satisfaction-readiness',
        'runtime-evidence-satisfaction-record',
        'equivalence-proof-readiness',
        'equivalence-proof-record',
        'scope-ci',
        'scope-ci-enforcement-record',
        'graph-delta',
        'guarded-graph-update-boundary-record',
        'guarded-update',
      ]),
    )
    expect(run.auditProvenance.length).toBeGreaterThan(7)
    expect(data.outputPaths.htmlOutputPath).toBe('.devview/generated/work-journal/index.html')
    expect(data.safetyFlags.staticHtmlOnly).toBe(true)
    expect(data.safetyFlags.providerInvoked).toBe(false)
    expect(data.safetyFlags.networkCallMade).toBe(false)
    expect(data.safetyFlags.extensionExecutionAllowed).toBe(false)
    expect(data.safetyFlags.extensionsExecuted).toBe(false)
    expect(data.safetyFlags.shellCommandsExecuted).toBe(false)
    expect(data.safetyFlags.filesMutatedOutsideExplicitOutputs).toBe(false)
    expect(data.safetyFlags.graphSourceMutated).toBe(false)
    expect(data.safetyFlags.graphDeltaApplied).toBe(false)
    expect(data.safetyFlags.runtimeEvidenceSatisfied).toBe(false)
    expect(data.safetyFlags.evidenceAccepted).toBe(false)
    expect(data.safetyFlags.equivalenceProven).toBe(false)
    expect(data.safetyFlags.scopeEnforced).toBe(false)
    expect(data.safetyFlags.ciEnforcementEnabled).toBe(false)
    expect(data.safetyFlags.approvalAutomationEnabled).toBe(false)
    expect(data.safetyFlags.userAcceptanceAutomated).toBe(false)
    expect(data.safetyFlags.nonEnforcing).toBe(true)
    expect(html).toContain('DevView Work Journal')
    expect(html).toContain('Current Work Flow')
    expect(html).toContain('workflow-step-list')
    expect(html).toContain('class="inspector"')
    expect(html).toContain('Source artifacts and provenance')
    expect(html).toContain('Run JSON')
    expect(html).toContain('static visualization/report artifact')
    expect(html).toContain('Guarded Update')
  })

  it('summarizes actual runtime and equivalence records as source facts without promoting journal authority', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeActualAuthorityRecords(workspace)

    const result = await runDevViewCli(
      workJournalArgs(undefined, undefined, undefined, [
        '--runtime-evidence-satisfaction-record',
        'generated/runtime-satisfaction-record.json',
        '--equivalence-proof-record',
        'generated/equivalence-proof-record.json',
      ]),
      { cwd: workspace, pluginRoot },
    )
    const data = JSON.parse(readFileSync(join(workspace, '.devview/generated/work-journal/index.data.json'), 'utf8'))
    const run = JSON.parse(
      readFileSync(join(workspace, '.devview/generated/work-journal/runs/todo-add/run.json'), 'utf8'),
    )
    const html = readFileSync(join(workspace, '.devview/generated/work-journal/index.html'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(run.authoritySummary.runtimeEvidence).toEqual(
      expect.objectContaining({
        readinessStatus: 'devview-runtime-evidence-satisfaction-readiness-blocked',
        actualRecordStatus: 'devview-runtime-evidence-satisfaction-recorded',
        displayState: 'actual-record-satisfied',
      }),
    )
    expect(run.authoritySummary.equivalenceProof).toEqual(
      expect.objectContaining({
        readinessStatus: 'devview-equivalence-proof-readiness-blocked',
        actualRecordStatus: 'devview-equivalence-proof-recorded',
        displayState: 'actual-record-proven',
      }),
    )
    expect(run.flow.find((step: { stepId: string }) => step.stepId === 'runtime-evidence')).toEqual(
      expect.objectContaining({
        sourceId: 'runtime-evidence-satisfaction-record',
        authority: 'actual-record',
        status: 'devview-runtime-evidence-satisfaction-recorded',
      }),
    )
    expect(run.flow.find((step: { stepId: string }) => step.stepId === 'equivalence-proof')).toEqual(
      expect.objectContaining({
        sourceId: 'equivalence-proof-record',
        authority: 'actual-record',
        status: 'devview-equivalence-proof-recorded',
      }),
    )
    expect(run.evidenceSummary).toEqual(
      expect.objectContaining({
        required: 2,
        provided: 1,
        missing: 1,
        status: 'actual-runtime-evidence-satisfaction-record-present',
      }),
    )
    expect(data.safetyFlags.runtimeEvidenceSatisfied).toBe(false)
    expect(data.safetyFlags.equivalenceProven).toBe(false)
    expect(data.safetyFlags.scopeEnforced).toBe(false)
    expect(data.safetyFlags.ciEnforcementEnabled).toBe(false)
    expect(html).toContain('actual-record-satisfied')
    expect(html).toContain('actual-record-proven')
    expect(html).toContain('preview-only-blocked')
  })

  it('summarizes compiled extension profile catalogs as report-only source facts', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeJson(join(workspace, 'generated/extension-profile-catalog.json'), extensionProfileCatalog())

    const result = await runDevViewCli(
      workJournalArgs(undefined, undefined, undefined, [
        '--extension-profile-catalog',
        'generated/extension-profile-catalog.json',
      ]),
      { cwd: workspace, pluginRoot },
    )
    const data = JSON.parse(readFileSync(join(workspace, '.devview/generated/work-journal/index.data.json'), 'utf8'))
    const run = JSON.parse(
      readFileSync(join(workspace, '.devview/generated/work-journal/runs/todo-add/run.json'), 'utf8'),
    )
    const html = readFileSync(join(workspace, '.devview/generated/work-journal/index.html'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(run.authoritySummary.extensions).toEqual(
      expect.objectContaining({
        readinessStatus: 'devview-extension-readiness-ready',
        catalogStatus: 'devview-extension-profile-catalog-compiled',
        displayState: 'catalog-compiled',
        catalogEntryCount: 2,
        graphIngestionCandidateCount: 1,
        nativeRetrofitHintStatus: 'profile-mode-declared',
        nativeRetrofitMode: 'native',
        executionAllowed: false,
        providerInvoked: false,
        networkCallMade: false,
        shellCommandsExecuted: false,
      }),
    )
    expect(run.authoritySummary.extensions.capabilityGroupCounts).toEqual(
      expect.objectContaining({
        analyzerExtensions: 1,
        viewTreeExtractorExtensions: 1,
        contextPackExtensions: 1,
        evidenceAdapters: 1,
        policyExtensions: 1,
        graphIngestionCandidates: 1,
      }),
    )
    expect(run.flow.find((step: { stepId: string }) => step.stepId === 'extension-readiness')).toEqual(
      expect.objectContaining({
        sourceId: 'extension-profile-catalog',
        authority: 'preview-only',
        status: 'devview-extension-profile-catalog-compiled',
      }),
    )
    const catalogArtifact = run.artifacts.find(
      (artifact: { sourceId: string }) => artifact.sourceId === 'extension-profile-catalog',
    )
    expect(catalogArtifact.sourceFactSummary).toEqual(
      expect.objectContaining({
        extensionCatalogStatus: 'compiled-declarative-capabilities-only',
        catalogEntryCount: 2,
        graphIngestionCandidateCount: 1,
      }),
    )
    expect(data.safetyFlags.extensionExecutionAllowed).toBe(false)
    expect(data.safetyFlags.extensionsExecuted).toBe(false)
    expect(data.safetyFlags.providerInvoked).toBe(false)
    expect(data.safetyFlags.networkCallMade).toBe(false)
    expect(data.safetyFlags.shellCommandsExecuted).toBe(false)
    expect(data.safetyFlags.graphSourceMutated).toBe(false)
    expect(data.safetyFlags.graphDeltaApplied).toBe(false)
    expect(html).toContain('Extensions')
    expect(html).toContain('catalog-compiled')
    expect(html).toContain('Source artifacts and provenance')
  })

  it('summarizes actual Scope/CI enforcement records as source facts without mutating external systems', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeActualAuthorityRecords(workspace)

    const result = await runDevViewCli(
      workJournalArgs(undefined, undefined, undefined, [
        '--scope-ci-enforcement-record',
        'generated/scope-ci-record.json',
      ]),
      { cwd: workspace, pluginRoot },
    )
    const data = JSON.parse(readFileSync(join(workspace, '.devview/generated/work-journal/index.data.json'), 'utf8'))
    const run = JSON.parse(
      readFileSync(join(workspace, '.devview/generated/work-journal/runs/todo-add/run.json'), 'utf8'),
    )
    const html = readFileSync(join(workspace, '.devview/generated/work-journal/index.html'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(run.authoritySummary.scopeCi).toEqual(
      expect.objectContaining({
        readinessStatus: 'devview-scope-ci-enforcement-readiness-blocked',
        actualRecordStatus: 'devview-scope-ci-enforcement-recorded',
        activationStatus: 'actual-record-present',
        displayState: 'actual-record-scope-ci',
      }),
    )
    expect(run.flow.find((step: { stepId: string }) => step.stepId === 'scope-ci')).toEqual(
      expect.objectContaining({
        sourceId: 'scope-ci-enforcement-record',
        authority: 'actual-record',
        status: 'devview-scope-ci-enforcement-recorded',
      }),
    )
    expect(run.scopeSummary.status).toBe('actual-scope-ci-enforcement-record-present')
    expect(data.safetyFlags.scopeEnforced).toBe(false)
    expect(data.safetyFlags.ciEnforcementEnabled).toBe(false)
    expect(data.safetyFlags.graphSourceMutated).toBe(false)
    expect(data.safetyFlags.graphDeltaApplied).toBe(false)
    expect(data.safetyFlags.providerInvoked).toBe(false)
    expect(data.safetyFlags.networkCallMade).toBe(false)
    expect(html).toContain('actual-record-scope-ci')
    expect(html).toContain('Source artifacts and provenance')
    expect(html).toContain('Run JSON')
  })

  it('summarizes Guarded Graph Update boundary records as deferred source facts', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeJson(join(workspace, 'generated/guarded-boundary-record.json'), guardedGraphUpdateBoundaryRecord())

    const result = await runDevViewCli(
      workJournalArgs(undefined, undefined, undefined, [
        '--guarded-graph-update-boundary-record',
        'generated/guarded-boundary-record.json',
      ]),
      { cwd: workspace, pluginRoot },
    )
    const data = JSON.parse(readFileSync(join(workspace, '.devview/generated/work-journal/index.data.json'), 'utf8'))
    const run = JSON.parse(
      readFileSync(join(workspace, '.devview/generated/work-journal/runs/todo-add/run.json'), 'utf8'),
    )
    const html = readFileSync(join(workspace, '.devview/generated/work-journal/index.html'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(run.authoritySummary.guardedUpdate).toEqual(
      expect.objectContaining({
        boundaryRecordStatus: 'devview-guarded-graph-update-boundary-ready',
        applyReportStatus: 'devview-graph-delta-apply-blocked',
        displayState: 'actual-boundary-ready-apply-deferred',
      }),
    )
    expect(run.authoritySummary.guardedUpdate.nextAction).toContain('Plan explicit guarded apply')
    expect(run.flow.find((step: { stepId: string }) => step.stepId === 'guarded-update')).toEqual(
      expect.objectContaining({
        sourceId: 'guarded-graph-update-boundary-record',
        authority: 'actual-record',
        status: 'devview-guarded-graph-update-boundary-ready',
      }),
    )
    expect(data.safetyFlags.graphSourceMutated).toBe(false)
    expect(data.safetyFlags.graphDeltaApplied).toBe(false)
    expect(data.safetyFlags.providerInvoked).toBe(false)
    expect(data.safetyFlags.networkCallMade).toBe(false)
    expect(html).toContain('actual-boundary-ready-apply-deferred')
    expect(html).toContain('Guarded Update')
    expect(html).toContain('Run JSON')
  })

  it('summarizes Guarded Graph Update apply plans as compact non-mutating source facts', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeJson(join(workspace, 'generated/guarded-boundary-record.json'), guardedGraphUpdateBoundaryRecord())
    writeJson(join(workspace, 'generated/guarded-apply-plan.json'), guardedGraphUpdateApplyPlan())

    const result = await runDevViewCli(
      workJournalArgs(undefined, undefined, undefined, [
        '--guarded-graph-update-boundary-record',
        'generated/guarded-boundary-record.json',
        '--guarded-graph-update-apply-plan',
        'generated/guarded-apply-plan.json',
      ]),
      { cwd: workspace, pluginRoot },
    )
    const data = JSON.parse(readFileSync(join(workspace, '.devview/generated/work-journal/index.data.json'), 'utf8'))
    const run = JSON.parse(
      readFileSync(join(workspace, '.devview/generated/work-journal/runs/todo-add/run.json'), 'utf8'),
    )
    const html = readFileSync(join(workspace, '.devview/generated/work-journal/index.html'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(run.authoritySummary.guardedUpdate).toEqual(
      expect.objectContaining({
        boundaryRecordStatus: 'devview-guarded-graph-update-boundary-ready',
        applyPlanStatus: 'ready-deterministic-diff-preview-created',
        applyPlanArtifactStatus: 'devview-guarded-graph-update-apply-plan-ready',
        displayState: 'apply-plan-ready',
        planComparisonStatus: 'matched-boundary-proposal-and-current-graph-source',
      }),
    )
    expect(run.authoritySummary.guardedUpdate.operationSummary).toEqual(
      expect.objectContaining({
        operationCount: 1,
        operationKinds: ['update-node'],
        unresolvedOperationCount: 0,
        graphSourceOriginalHash: 'sha256:graph-source',
      }),
    )
    expect(run.authoritySummary.guardedUpdate.nextAction).toContain('policy-gated apply')
    expect(run.flow.find((step: { stepId: string }) => step.stepId === 'guarded-update')).toEqual(
      expect.objectContaining({
        sourceId: 'guarded-graph-update-apply-plan',
        authority: 'preview-only',
        status: 'devview-guarded-graph-update-apply-plan-ready',
      }),
    )
    expect(run.artifacts.map((artifact: { sourceId: string }) => artifact.sourceId)).toContain(
      'guarded-graph-update-apply-plan',
    )
    expect(data.safetyFlags.graphSourceMutated).toBe(false)
    expect(data.safetyFlags.graphDeltaApplied).toBe(false)
    expect(html).toContain('apply-plan-ready')
    expect(html).toContain('Source artifacts and provenance')
    expect(html).toContain('Run JSON')
  })

  it('shows blocked Guarded Graph Update apply plans without claiming graph update', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeJson(
      join(workspace, 'generated/guarded-apply-plan.json'),
      guardedGraphUpdateApplyPlan('devview-guarded-graph-update-apply-plan-blocked'),
    )

    const result = await runDevViewCli(
      workJournalArgs(undefined, undefined, undefined, [
        '--guarded-graph-update-apply-plan',
        'generated/guarded-apply-plan.json',
      ]),
      { cwd: workspace, pluginRoot },
    )
    const run = JSON.parse(
      readFileSync(join(workspace, '.devview/generated/work-journal/runs/todo-add/run.json'), 'utf8'),
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(run.authoritySummary.guardedUpdate.displayState).toBe('apply-plan-blocked')
    expect(run.authoritySummary.guardedUpdate.applyPlanStatus).toBe('blocked-no-concrete-operations')
    expect(run.authoritySummary.guardedUpdate.nextAction).toContain('Resolve apply plan blockers')
    expect(run.flow.find((step: { stepId: string }) => step.stepId === 'guarded-update')).toEqual(
      expect.objectContaining({
        sourceId: 'guarded-graph-update-apply-plan',
        authority: 'blocked',
        status: 'devview-guarded-graph-update-apply-plan-blocked',
      }),
    )
  })

  it('summarizes actual Guarded Graph Update apply reports compactly without journal mutation authority', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeJson(join(workspace, 'generated/guarded-apply-report.json'), guardedGraphUpdateApplyReport())

    const result = await runDevViewCli(
      workJournalArgs(undefined, undefined, undefined, [
        '--guarded-graph-update-apply-report',
        'generated/guarded-apply-report.json',
      ]),
      { cwd: workspace, pluginRoot },
    )
    const data = JSON.parse(readFileSync(join(workspace, '.devview/generated/work-journal/index.data.json'), 'utf8'))
    const run = JSON.parse(
      readFileSync(join(workspace, '.devview/generated/work-journal/runs/todo-add/run.json'), 'utf8'),
    )
    const html = readFileSync(join(workspace, '.devview/generated/work-journal/index.html'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(run.authoritySummary.guardedUpdate).toEqual(
      expect.objectContaining({
        applyReportStatus: 'devview-guarded-graph-update-applied',
        applyStatus: 'applied-graph-source-mutated',
        sourceGraphUpdateApplied: true,
        sourceGraphUpdateRolledBack: false,
        mutatedFilePaths: ['.tmp/guarded-graph-update-apply/graph-source.json'],
        graphSourceMutatedHash: 'sha256:mutated-graph',
        rollbackStatus: 'not-needed',
        displayState: 'actual-graph-update-applied',
      }),
    )
    expect(run.authoritySummary.guardedUpdate.operationSummary).toEqual(
      expect.objectContaining({
        operationCount: 1,
        targetKinds: ['node'],
        fieldPaths: ['status'],
      }),
    )
    expect(run.flow.find((step: { stepId: string }) => step.stepId === 'guarded-update')).toEqual(
      expect.objectContaining({
        sourceId: 'guarded-graph-update-apply-report',
        authority: 'actual-record',
        status: 'devview-guarded-graph-update-applied',
      }),
    )
    expect(data.safetyFlags.graphSourceMutated).toBe(false)
    expect(data.safetyFlags.graphDeltaApplied).toBe(false)
    expect(data.safetyFlags.providerInvoked).toBe(false)
    expect(data.safetyFlags.networkCallMade).toBe(false)
    expect(html).toContain('actual-graph-update-applied')
    expect(html).toContain('Source artifacts and provenance')
  })

  it('represents rolled-back Guarded Graph Update apply reports as not currently applied', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeJson(
      join(workspace, 'generated/guarded-apply-report.json'),
      guardedGraphUpdateApplyReport('devview-guarded-graph-update-apply-rolled-back'),
    )

    const result = await runDevViewCli(
      workJournalArgs(undefined, undefined, undefined, [
        '--guarded-graph-update-apply-report',
        'generated/guarded-apply-report.json',
      ]),
      { cwd: workspace, pluginRoot },
    )
    const run = JSON.parse(
      readFileSync(join(workspace, '.devview/generated/work-journal/runs/todo-add/run.json'), 'utf8'),
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(run.authoritySummary.guardedUpdate).toEqual(
      expect.objectContaining({
        applyReportStatus: 'devview-guarded-graph-update-apply-rolled-back',
        sourceGraphUpdateApplied: false,
        sourceGraphUpdateRolledBack: true,
        rollbackStatus: 'restored-from-backup',
        displayState: 'actual-graph-update-rolled-back',
      }),
    )
    expect(run.flow.find((step: { stepId: string }) => step.stepId === 'guarded-update')).toEqual(
      expect.objectContaining({
        sourceId: 'guarded-graph-update-apply-report',
        authority: 'blocked',
        status: 'devview-guarded-graph-update-apply-rolled-back',
      }),
    )
  })

  it('blocks wrong Guarded Graph Update apply report role/status with graph mutation facts before writing outputs', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeJson(join(workspace, 'generated/not-guarded-apply-report.json'), {
      artifactRole: 'devview-guarded-graph-update-apply-plan',
      status: 'devview-guarded-graph-update-apply-plan-ready',
      graphDeltaApplied: true,
      graphSourceMutated: true,
      filesMutated: true,
      providerInvoked: false,
      networkCallMade: false,
      hooksActivated: false,
      approvalAutomationEnabled: false,
      userAcceptanceAutomated: false,
    })

    const result = await runDevViewCli(
      workJournalArgs('.tmp/journal.html', '.tmp/journal.data.json', '.tmp/run.json', [
        '--guarded-graph-update-apply-report',
        'generated/not-guarded-apply-report.json',
      ]),
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('unsupported role/status')
    expect(existsSync(join(workspace, '.tmp/journal.html'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/journal.data.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/run.json'))).toBe(false)
  })

  it('preserves previous Work Journal runs and replaces the current run deterministically', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeJson(join(workspace, '.devview/generated/work-journal/index.data.json'), previousJournalData())

    const result = await runDevViewCli(workJournalArgs(), { cwd: workspace, pluginRoot })
    const data = JSON.parse(readFileSync(join(workspace, '.devview/generated/work-journal/index.data.json'), 'utf8'))
    const html = readFileSync(join(workspace, '.devview/generated/work-journal/index.html'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(data.currentRunId).toBe('todo-add')
    expect(data.runs.map((run: { runId: string }) => run.runId)).toEqual(['previous-work', 'todo-add'])
    expect(data.runs[0].title).toBe('Previous DevView Work')
    expect(data.runs[1].title).toBe('Todo Add Calibration')
    expect(html).toContain('Previous DevView Work')
    expect(html).toContain('Todo Add Calibration')
  })

  it('requires --run-id before writing outputs', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)

    const result = await runDevViewCli(
      [
        'work-journal',
        'render',
        '--baseline',
        'generated/baseline.json',
        '--output',
        '.tmp/work-journal.html',
        '--data-output',
        '.tmp/work-journal.data.json',
        '--run-output',
        '.tmp/run.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.InvalidArguments)
    expect(payload.issues[0].message).toContain('--run-id')
    expect(existsSync(join(workspace, '.tmp/work-journal.html'))).toBe(false)
  })

  it('blocks protected control output paths before writing paired outputs', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)

    const result = await runDevViewCli(
      [
        ...workJournalArgs(
          '.devview/control/index.html',
          '.tmp/should-not-exist.json',
          '.tmp/should-not-exist-run.json',
        ),
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('protected source/control path')
    expect(existsSync(join(workspace, '.tmp/should-not-exist.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/should-not-exist-run.json'))).toBe(false)
  })

  it('blocks source and public file output paths before writing paired outputs', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)

    const result = await runDevViewCli(
      [...workJournalArgs('README.md', '.tmp/should-not-exist.json', '.tmp/should-not-exist-run.json')],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('protected source/control path')
    expect(existsSync(join(workspace, 'README.md'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/should-not-exist.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/should-not-exist-run.json'))).toBe(false)
  })

  it('blocks output collisions with zero writes', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)

    const result = await runDevViewCli(
      [...workJournalArgs('.tmp/journal.html', '.tmp/journal.html', '.tmp/run.json')],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('collides')
    expect(existsSync(join(workspace, '.tmp/journal.html'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/run.json'))).toBe(false)
  })

  it('blocks overwriting source artifacts with zero writes', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    const baselinePath = join(workspace, 'generated/baseline.json')
    const before = readFileSync(baselinePath, 'utf8')

    const result = await runDevViewCli(
      [...workJournalArgs('generated/baseline.json', '.tmp/should-not-exist.json', '.tmp/should-not-exist-run.json')],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('would overwrite source DevView baseline freeze')
    expect(readFileSync(baselinePath, 'utf8')).toBe(before)
    expect(existsSync(join(workspace, '.tmp/should-not-exist.json'))).toBe(false)
  })

  it('blocks unsafe true authority fields in source artifacts with zero writes', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    const unsafeRuntimeSatisfied = Boolean(1)
    writeJson(join(workspace, 'generated/baseline.json'), {
      artifactRole: 'devview-core-baseline-freeze',
      status: 'devview-core-baseline-freeze-reported',
      runtimeEvidenceSatisfied: unsafeRuntimeSatisfied,
    })

    const result = await runDevViewCli(
      [...workJournalArgs('.tmp/journal.html', '.tmp/journal.data.json', '.tmp/run.json')],
      {
        cwd: workspace,
        pluginRoot,
      },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('unsafe true authority field runtimeEvidenceSatisfied')
    expect(existsSync(join(workspace, '.tmp/journal.html'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/journal.data.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/run.json'))).toBe(false)
  })

  it('blocks wrong actual record role/status with authority true before writing outputs', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeJson(join(workspace, 'generated/not-runtime-record.json'), {
      artifactRole: 'devview-runtime-evidence-satisfaction-readiness-preview',
      status: 'devview-runtime-evidence-satisfaction-readiness-ready',
      runtimeEvidenceSatisfied: true,
      evidenceAccepted: false,
      equivalenceProven: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
    })

    const result = await runDevViewCli(
      workJournalArgs('.tmp/journal.html', '.tmp/journal.data.json', '.tmp/run.json', [
        '--runtime-evidence-satisfaction-record',
        'generated/not-runtime-record.json',
      ]),
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('unsupported role/status')
    expect(existsSync(join(workspace, '.tmp/journal.html'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/journal.data.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/run.json'))).toBe(false)
  })

  it('blocks wrong extension catalog role/status with execution flags before writing outputs', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeJson(join(workspace, 'generated/not-extension-catalog.json'), {
      artifactRole: 'devview-extension-readiness-report',
      status: 'devview-extension-readiness-ready',
      extensionExecutionAllowed: true,
      providerInvoked: true,
      networkCallMade: true,
      shellCommandsExecuted: true,
    })

    const result = await runDevViewCli(
      workJournalArgs('.tmp/journal.html', '.tmp/journal.data.json', '.tmp/run.json', [
        '--extension-profile-catalog',
        'generated/not-extension-catalog.json',
      ]),
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('unsupported role/status')
    expect(existsSync(join(workspace, '.tmp/journal.html'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/journal.data.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/run.json'))).toBe(false)
  })

  it('blocks wrong Scope/CI record role/status with authority true before writing outputs', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeJson(join(workspace, 'generated/not-scope-ci-record.json'), {
      artifactRole: 'devview-scope-ci-enforcement-readiness-preview',
      status: 'devview-scope-ci-enforcement-readiness-ready',
      scopeEnforced: true,
      ciEnforcementEnabled: true,
      runtimeEvidenceSatisfied: false,
      evidenceAccepted: false,
      equivalenceProven: false,
    })

    const result = await runDevViewCli(
      workJournalArgs('.tmp/journal.html', '.tmp/journal.data.json', '.tmp/run.json', [
        '--scope-ci-enforcement-record',
        'generated/not-scope-ci-record.json',
      ]),
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('unsupported role/status')
    expect(existsSync(join(workspace, '.tmp/journal.html'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/journal.data.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/run.json'))).toBe(false)
  })

  it('blocks wrong Guarded Graph Update boundary role/status with guarded ready true before writing outputs', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeJson(join(workspace, 'generated/not-guarded-boundary.json'), {
      artifactRole: 'devview-graph-delta-apply-report',
      status: 'devview-graph-delta-apply-blocked',
      guardedUpdateReady: true,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      providerInvoked: false,
      networkCallMade: false,
    })

    const result = await runDevViewCli(
      workJournalArgs('.tmp/journal.html', '.tmp/journal.data.json', '.tmp/run.json', [
        '--guarded-graph-update-boundary-record',
        'generated/not-guarded-boundary.json',
      ]),
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('unsupported role/status')
    expect(existsSync(join(workspace, '.tmp/journal.html'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/journal.data.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/run.json'))).toBe(false)
  })

  it('blocks wrong Guarded Graph Update apply plan role/status or graph mutation flags before writing outputs', async () => {
    const workspace = createWorkspace()
    writeWorkJournalSources(workspace)
    writeJson(join(workspace, 'generated/not-guarded-apply-plan.json'), {
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

    const result = await runDevViewCli(
      workJournalArgs('.tmp/journal.html', '.tmp/journal.data.json', '.tmp/run.json', [
        '--guarded-graph-update-apply-plan',
        'generated/not-guarded-apply-plan.json',
      ]),
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('unsupported role/status')
    expect(existsSync(join(workspace, '.tmp/journal.html'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/journal.data.json'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/run.json'))).toBe(false)
  })
})

function workJournalArgs(
  output = '.devview/generated/work-journal/index.html',
  dataOutput = '.devview/generated/work-journal/index.data.json',
  runOutput = '.devview/generated/work-journal/runs/todo-add/run.json',
  extraArgs: string[] = [],
): string[] {
  return [
    'work-journal',
    'render',
    '--run-id',
    'todo-add',
    '--title',
    'Todo Add Calibration',
    '--baseline',
    'generated/baseline.json',
    '--graph-source',
    'generated/maintainability-graph.json',
    '--view-tree',
    'generated/view-tree.json',
    '--contract-input',
    'generated/context-pack.json',
    '--instruction-pack',
    'generated/instruction-pack.json',
    '--extension-readiness',
    'generated/extension-readiness.json',
    '--runtime-evidence-satisfaction-readiness',
    'generated/runtime-readiness.json',
    '--equivalence-proof-readiness',
    'generated/equivalence-readiness.json',
    '--scope-ci-enforcement-readiness',
    'generated/scope-ci-readiness.json',
    '--proposal',
    'generated/graph-delta-proposal.json',
    '--apply-report',
    'generated/apply-report.json',
    '--output',
    output,
    '--data-output',
    dataOutput,
    '--run-output',
    runOutput,
    ...extraArgs,
    '--json',
  ]
}

function writeWorkJournalSources(workspace: string): void {
  writeJson(join(workspace, 'generated/baseline.json'), {
    artifactRole: 'devview-core-baseline-freeze',
    status: 'devview-core-baseline-freeze-reported',
    baselineCompletenessStatus: 'complete',
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
  })
  writeJson(join(workspace, 'generated/maintainability-graph.json'), {
    artifactRole: 'devview-maintainability-graph-source',
    sourceRecords: [],
  })
  writeJson(join(workspace, 'generated/view-tree.json'), {
    artifactRole: 'devview-view-tree-preview',
    status: 'devview-view-tree-generated',
    includedNodeIds: ['todo.add'],
  })
  writeJson(join(workspace, 'generated/context-pack.json'), {
    artifactRole: 'contract-compiler-input-preview',
    status: 'contract-compiler-input-generated',
    boundedSubgraph: { nodeIds: ['todo.add'] },
    allowedFiles: ['src/todo.ts', 'test/todo.test.ts'],
    forbiddenFiles: ['src/payment.ts'],
  })
  writeJson(join(workspace, 'generated/instruction-pack.json'), {
    artifactRole: 'instruction-pack-preview',
    status: 'instruction-pack-generated',
    requiredEvidence: [{ id: 'required-evidence-1' }, { id: 'required-evidence-2' }],
  })
  writeJson(join(workspace, 'generated/extension-readiness.json'), {
    artifactRole: 'devview-extension-readiness-preview',
    status: 'devview-extension-readiness-ready',
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
  })
  writeJson(join(workspace, 'generated/runtime-readiness.json'), {
    artifactRole: 'devview-runtime-evidence-satisfaction-readiness-preview',
    status: 'devview-runtime-evidence-satisfaction-readiness-blocked',
    runtimeEvidenceSatisfactionReadinessStatus: 'blocked-required-obligation-mismatch',
    sourceAcceptedEvidenceAccepted: true,
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    nonEnforcing: true,
  })
  writeJson(join(workspace, 'generated/equivalence-readiness.json'), {
    artifactRole: 'devview-equivalence-proof-readiness-preview',
    status: 'devview-equivalence-proof-readiness-blocked',
    equivalenceProofReadinessStatus: 'blocked-runtime-evidence-satisfaction-readiness-not-ready',
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    nonEnforcing: true,
  })
  writeJson(join(workspace, 'generated/scope-ci-readiness.json'), {
    artifactRole: 'devview-scope-ci-enforcement-readiness-preview',
    status: 'devview-scope-ci-enforcement-readiness-blocked',
    scopeCiEnforcementReadinessStatus: 'blocked-equivalence-proof-readiness-not-ready',
    scopeViolationCount: 0,
    protectedPathBlockCount: 1,
    evidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    nonEnforcing: true,
  })
  writeJson(join(workspace, 'generated/graph-delta-proposal.json'), {
    artifactRole: 'graph-delta-proposal-only-preview',
    status: 'graph-delta-proposal-previewed',
  })
  writeJson(join(workspace, 'generated/apply-report.json'), {
    artifactRole: 'devview-graph-delta-apply-report',
    status: 'devview-graph-delta-apply-blocked',
    applyStatus: 'blocked-no-concrete-mutation-operations',
    graphSourceMutated: false,
    graphDeltaApplied: false,
  })
}

function writeActualAuthorityRecords(workspace: string): void {
  writeJson(join(workspace, 'generated/runtime-satisfaction-record.json'), {
    artifactRole: 'devview-runtime-evidence-satisfaction-record',
    status: 'devview-runtime-evidence-satisfaction-recorded',
    requiredEvidenceId: 'required-evidence-1',
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
    filesMutated: false,
  })
  writeJson(join(workspace, 'generated/equivalence-proof-record.json'), {
    artifactRole: 'devview-equivalence-proof-record',
    status: 'devview-equivalence-proof-recorded',
    sourceRuntimeEvidenceSatisfied: true,
    equivalenceProven: true,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
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
    filesMutated: false,
  })
  writeJson(join(workspace, 'generated/scope-ci-record.json'), {
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
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    hooksActivated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    providerInvoked: false,
    networkCallMade: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    shellCommandsExecuted: false,
    filesMutated: false,
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

function guardedGraphUpdateBoundaryRecord(): Record<string, unknown> {
  return {
    artifactRole: 'devview-guarded-graph-update-boundary-record',
    status: 'devview-guarded-graph-update-boundary-ready',
    guardedGraphUpdateBoundaryState: 'ready-for-future-guarded-graph-update-apply-command-no-mutation',
    guardedUpdateReady: true,
    applyCommandEnabled: false,
    applyDeferred: true,
    graphSourceMutated: false,
    graphDeltaApplied: false,
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
    graphSourceMutated: false,
    graphDeltaApplied: false,
    applyPlanOnly: true,
    applyCommandExecuted: false,
    applyCommandEnabled: false,
    applyDeferred: true,
    providerInvoked: false,
    networkCallMade: false,
    hooksActivated: false,
    branchProtectionMutated: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    filesMutated: false,
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

function previousJournalData(): unknown {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-work-journal-data-preview',
    htmlArtifactRole: 'devview-work-journal-html-preview',
    status: 'devview-work-journal-data-generated',
    journalScope: 'cumulative-static-work-journal-preview',
    currentRunId: 'previous-work',
    runs: [
      {
        runId: 'previous-work',
        title: 'Previous DevView Work',
        status: 'ready-for-review',
        nextAction: 'Review prior work.',
        blockedReason: null,
        flow: [],
        artifacts: [],
        auditProvenance: [],
      },
      {
        runId: 'todo-add',
        title: 'Stale Todo Add Calibration',
        status: 'advisory',
        nextAction: 'This run should be replaced.',
        blockedReason: null,
        flow: [],
        artifacts: [],
        auditProvenance: [],
      },
    ],
    safetyFlags: {
      staticHtmlOnly: true,
      providerInvoked: false,
      networkCallMade: false,
      extensionExecutionAllowed: false,
      extensionsExecuted: false,
      shellCommandsExecuted: false,
      filesMutatedOutsideExplicitOutputs: false,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      runtimeEvidenceSatisfied: false,
      evidenceAccepted: false,
      equivalenceProven: false,
      scopeEnforced: false,
      ciEnforcementEnabled: false,
      approvalAutomationEnabled: false,
      userAcceptanceAutomated: false,
      nonEnforcing: true,
    },
    outputPaths: {
      htmlOutputPath: '.devview/generated/work-journal/index.html',
      dataOutputPath: '.devview/generated/work-journal/index.data.json',
      runOutputPath: '.devview/generated/work-journal/runs/previous-work/run.json',
    },
    nonExecutionBoundary: 'Static previous journal.',
  }
}
