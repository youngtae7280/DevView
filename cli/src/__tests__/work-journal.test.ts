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
        'graph-delta',
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
