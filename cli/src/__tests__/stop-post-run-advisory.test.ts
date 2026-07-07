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

describe('Stop/Post Run advisory report CLI', () => {
  it('summarizes a complete post-run chain as review-ready but not approved', async () => {
    const workspace = createWorkspace()
    writeStopPostRunInputs(workspace)

    const result = await runDevViewCli([...baseArgs(), ...completeArgs()], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)
    const report = JSON.parse(readFileSync(join(workspace, '.tmp/stop-post-run.json'), 'utf8'))
    const markdown = readFileSync(join(workspace, '.tmp/stop-post-run.md'), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-stop-post-run-advisory-report')
    expect(payload.postRunCompletenessStatus).toBe('review-ready-not-approved')
    expect(report.status).toBe('stop-post-run-advisory-review-ready-not-approved')
    expect(report.changedFileSummary.changedFileCount).toBe(2)
    expect(report.instructionSummary.allowedScopeCount).toBe(1)
    expect(report.scopeSummary.scopeReportStatus).toBe('present')
    expect(report.proposalReviewSummary.proposalOnly).toBe(true)
    expect(report.proposalReviewSummary.reviewReadyNotApproved).toBe(true)
    expect(report.approvalStatus).toBe('not-approved')
    expect(report.runtimeEvidenceSatisfied).toBe(false)
    expect(report.evidenceAccepted).toBe(false)
    expect(report.equivalenceProven).toBe(false)
    expect(report.scopeEnforced).toBe(false)
    expect(report.ciEnforcementEnabled).toBe(false)
    expect(report.graphSourceMutated).toBe(false)
    expect(report.graphDeltaApplied).toBe(false)
    expect(report.changedFilesModified).toBe(false)
    expect(report.changedFilesReverted).toBe(false)
    expect(report.toolBlockingEnabled).toBe(false)
    expect(markdown).toContain('DevView Stop/Post Run Advisory')
    expect(markdown).toContain('Human review required: true')
  })

  it('reports no changed files as clean/no-op without approval or Evidence satisfaction', async () => {
    const workspace = createWorkspace()
    writeStopPostRunInputs(workspace, {
      changedFiles: { normalizedChangedFiles: [], changedFiles: [], generatedFileHandling: { generatedFiles: [] } },
    })

    const result = await runDevViewCli([...baseArgs(), '--changed-files', 'generated/changed-files.json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.status).toBe('stop-post-run-advisory-clean-no-op')
    expect(payload.postRunCompletenessStatus).toBe('clean-no-changes-observed')
    expect(payload.approvalStatus).toBe('not-approved')
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.nextRequiredCommands[0]).toContain('No post-run file-change follow-up')
  })

  it('reports changed files without an instruction pack as an advisory gap', async () => {
    const workspace = createWorkspace()
    writeStopPostRunInputs(workspace)

    const result = await runDevViewCli([...baseArgs(), '--changed-files', 'generated/changed-files.json'], {
      cwd: workspace,
      pluginRoot,
    })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.postRunCompletenessStatus).toBe('missing-instruction-pack')
    expect(payload.advisoryFindings.map((entry: { code: string }) => entry.code)).toContain(
      'STOP_POST_RUN_INSTRUCTION_PACK_MISSING',
    )
    expect(payload.nextRequiredCommands[0]).toContain('run-preflight-session')
    expect(payload.scopeEnforced).toBe(false)
  })

  it('reports missing scope check when instruction context and changed files are present', async () => {
    const workspace = createWorkspace()
    writeStopPostRunInputs(workspace)

    const result = await runDevViewCli(
      [
        ...baseArgs(),
        '--changed-files',
        'generated/changed-files.json',
        '--instruction-pack',
        'generated/instruction-pack.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.postRunCompletenessStatus).toBe('missing-scope-report')
    expect(payload.nextRequiredCommands[0]).toContain('check-scope')
  })

  it('suggests staged scope check for staged changed-file collections', async () => {
    const workspace = createWorkspace()
    writeStopPostRunInputs(workspace, {
      changedFiles: {
        collectionMode: 'staged-index',
        sourceMode: 'staged-index',
      },
    })

    const result = await runDevViewCli(
      [
        ...baseArgs(),
        '--changed-files',
        'generated/changed-files.json',
        '--instruction-pack',
        'generated/instruction-pack.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.postRunCompletenessStatus).toBe('missing-scope-report')
    expect(payload.changedFileSummary.collectionMode).toBe('staged-index')
    expect(payload.nextRequiredCommands[0]).toContain('check-scope --staged')
  })

  it('suggests untracked scope check for untracked changed-file collections', async () => {
    const workspace = createWorkspace()
    writeStopPostRunInputs(workspace, {
      changedFiles: {
        collectionMode: 'untracked-files',
        sourceMode: 'untracked-files',
      },
    })

    const result = await runDevViewCli(
      [
        ...baseArgs(),
        '--changed-files',
        'generated/changed-files.json',
        '--instruction-pack',
        'generated/instruction-pack.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.postRunCompletenessStatus).toBe('missing-scope-report')
    expect(payload.changedFileSummary.collectionMode).toBe('untracked-files')
    expect(payload.nextRequiredCommands[0]).toContain('check-scope --untracked')
  })

  it('reports missing proposal and missing review packet as next deterministic commands', async () => {
    const workspace = createWorkspace()
    writeStopPostRunInputs(workspace)

    const missingProposal = await runDevViewCli(
      [
        ...baseArgs(),
        '--changed-files',
        'generated/changed-files.json',
        '--instruction-pack',
        'generated/instruction-pack.json',
        '--scope-report',
        'generated/scope-report.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const missingProposalPayload = JSON.parse(missingProposal.stdout)

    expect(missingProposal.exitCode).toBe(ExitCode.Success)
    expect(missingProposalPayload.postRunCompletenessStatus).toBe('missing-proposal')
    expect(missingProposalPayload.nextRequiredCommands[0]).toContain('propose-graph-delta')

    const missingReview = await runDevViewCli(
      [
        ...baseArgs('.tmp/stop-post-run-review.json', '.tmp/stop-post-run-review.md'),
        '--changed-files',
        'generated/changed-files.json',
        '--instruction-pack',
        'generated/instruction-pack.json',
        '--scope-report',
        'generated/scope-report.json',
        '--proposal',
        'generated/proposal.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const missingReviewPayload = JSON.parse(missingReview.stdout)

    expect(missingReview.exitCode).toBe(ExitCode.Success)
    expect(missingReviewPayload.postRunCompletenessStatus).toBe('missing-review-packet')
    expect(missingReviewPayload.nextRequiredCommands[0]).toContain('review-graph-delta')
  })

  it('keeps forbidden scope findings advisory and non-enforcing', async () => {
    const workspace = createWorkspace()
    writeStopPostRunInputs(workspace, {
      scopeReport: {
        evaluatedViolationCount: 1,
        blockingFindingCount: 1,
        scopeComplianceResult: 'forbidden-scope-indicated',
        findings: [{ category: 'forbidden-scope', path: 'src/todo.ts' }],
      },
    })

    const result = await runDevViewCli([...baseArgs(), ...completeArgs()], { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.scopeSummary.forbiddenScopeIndicated).toBe(true)
    expect(payload.advisoryFindings.map((entry: { code: string }) => entry.code)).toContain(
      'STOP_POST_RUN_FORBIDDEN_SCOPE_ADVISORY',
    )
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(payload.toolBlockingEnabled).toBe(false)
  })

  it('rejects protected source and markdown paths before partial write', async () => {
    const workspace = createWorkspace()
    writeStopPostRunInputs(workspace)

    const result = await runDevViewCli(
      [
        ...baseArgs('.tmp/unsafe.json', 'generated/instruction-pack.json'),
        '--changed-files',
        'generated/changed-files.json',
        '--instruction-pack',
        'generated/instruction-pack.json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('STOP_POST_RUN_ADVISORY_FAILED')
    expect(existsSync(join(workspace, '.tmp/unsafe.json'))).toBe(false)
  })

  it('does not run Git, scope check, proposal, review, provider, network, or preflight when optional artifacts are absent', async () => {
    const workspace = createWorkspace()
    writeStopPostRunInputs(workspace)

    const result = await runDevViewCli(baseArgs(), { cwd: workspace, pluginRoot })
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.postRunCompletenessStatus).toBe('missing-changed-files')
    expect(payload.nextRequiredCommands[0]).toContain('collect-changed-files')
    expect(payload.nextRequiredCommands).toEqual([
      'graph read-model collect-changed-files --working-tree --output <changedFiles> --json',
      'graph read-model collect-changed-files --staged --output <changedFiles> --json',
      'graph read-model collect-changed-files --untracked --output <changedFiles> --json',
    ])
    expect(existsSync(join(workspace, '.tmp/devview-runtime-timing-smoke'))).toBe(false)
    expect(existsSync(join(workspace, '.tmp/devview-preflight'))).toBe(false)
    expect(payload.codexExecutionControlled).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
  })
})

function baseArgs(output = '.tmp/stop-post-run.json', markdown = '.tmp/stop-post-run.md'): string[] {
  return [
    'graph',
    'read-model',
    'report-stop-post-run-advisory',
    '--user-prompt-advisory',
    'generated/user-prompt-advisory.json',
    '--hook-health',
    'generated/hook-health.json',
    '--preflight-session',
    'generated/preflight.json',
    '--output',
    output,
    '--markdown',
    markdown,
    '--json',
  ]
}

function completeArgs(): string[] {
  return [
    '--instruction-pack',
    'generated/instruction-pack.json',
    '--instruction-markdown',
    'generated/instruction-pack.md',
    '--changed-files',
    'generated/changed-files.json',
    '--scope-report',
    'generated/scope-report.json',
    '--runtime-report',
    'generated/runtime-report.md',
    '--proposal',
    'generated/proposal.json',
    '--review-packet',
    'generated/review-packet.json',
  ]
}

function writeStopPostRunInputs(
  workspace: string,
  overrides: {
    changedFiles?: Record<string, unknown>
    scopeReport?: Record<string, unknown>
  } = {},
): void {
  writeJson(join(workspace, 'generated/user-prompt-advisory.json'), userPromptAdvisory())
  writeJson(join(workspace, 'generated/hook-health.json'), hookHealth())
  writeJson(join(workspace, 'generated/preflight.json'), preflight())
  writeJson(join(workspace, 'generated/instruction-pack.json'), instructionPack())
  writeText(join(workspace, 'generated/instruction-pack.md'), '# Instruction Pack\n')
  writeJson(join(workspace, 'generated/changed-files.json'), {
    ...changedFiles(),
    ...(overrides.changedFiles ?? {}),
  })
  writeJson(join(workspace, 'generated/scope-report.json'), {
    ...scopeReport(),
    ...(overrides.scopeReport ?? {}),
  })
  writeText(join(workspace, 'generated/runtime-report.md'), '# Runtime Report\n\nLinked only.\n')
  writeJson(join(workspace, 'generated/proposal.json'), proposal())
  writeJson(join(workspace, 'generated/review-packet.json'), reviewPacket())
}

function userPromptAdvisory(): Record<string, unknown> {
  return {
    artifactRole: 'devview-user-prompt-submit-advisory-report',
    status: 'user-prompt-submit-advisory-generated',
    additionalContextInjectionReady: true,
    sourceRequestIrCandidate: 'generated/candidate.json',
    preflightTerminalStage: 'instruction-pack-preview-generated-no-codex-execution',
    codexExecutionTriggered: false,
    toolBlockingEnabled: false,
    preToolUseBlockingEnabled: false,
    postToolUseBlockingEnabled: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function hookHealth(): Record<string, unknown> {
  return {
    artifactRole: 'devview-hook-gateway-health-boundary-preview',
    status: 'devview-hook-gateway-health-boundary-previewed',
    hookScriptsInstalled: false,
    strictModeEnabled: false,
    guidedEnforcementEnabled: false,
    actualBlockingHookBehaviorImplemented: false,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function preflight(): Record<string, unknown> {
  return {
    artifactRole: 'devview-preflight-session-chain-report',
    status: 'devview-preflight-session-chain-report-generated',
    terminalStage: 'instruction-pack-preview-generated-no-codex-execution',
    stageArtifacts: {
      instructionPack: 'generated/instruction-pack.json',
      instructionMarkdown: 'generated/instruction-pack.md',
    },
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function instructionPack(): Record<string, unknown> {
  return {
    artifactRole: 'instruction-pack',
    status: 'instruction-pack-generated',
    instructionPackGenerated: true,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    taskSummary: 'Review add button runtime evidence.',
    allowedScope: [{ id: 'allowed-evidence', paths: ['examples/valid/todo-app-devview-run/.devview/evidence/a.txt'] }],
    forbiddenScope: [{ id: 'forbidden-source', paths: ['src/todo.ts'] }],
    requiredEvidence: [{ id: 'evidence-1' }],
    outputRequirements: [{ id: 'output-1' }],
    stopConditions: [{ id: 'stop-1' }],
    knownRisks: [{ id: 'risk-1' }],
  }
}

function changedFiles(): Record<string, unknown> {
  return {
    artifactRole: 'git-derived-changed-file-collection-preview',
    status: 'git-derived-changed-files-collected',
    authorityClass: 'git-derived-changed-files',
    normalizedChangedFiles: [
      { status: 'M', statusCode: 'M', path: 'examples/valid/todo-app-devview-run/.devview/evidence/a.txt' },
      { status: 'A', statusCode: 'A', path: 'examples/valid/todo-app-devview-run/.devview/evidence/b.txt' },
    ],
    generatedFileHandling: { generatedFiles: [] },
    scopeEnforced: false,
    diffRejected: false,
    actualViolationClaimed: false,
  }
}

function scopeReport(): Record<string, unknown> {
  return {
    artifactRole: 'scope-compliance-advisory-evaluation',
    status: 'scope-compliance-advisory-evaluation-complete',
    scopeComplianceResult: 'advisory-scope-check-complete',
    scopeComplianceEvaluationStatus: 'evaluated-non-enforcing',
    evaluatedViolationCount: 0,
    blockingFindingCount: 0,
    reviewRequiredFindingCount: 0,
    advisoryFindingCount: 1,
    findings: [],
    nonEnforcing: true,
    scopeEnforced: false,
    diffRejected: false,
    approvalStatus: 'not-approved',
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    graphDeltaApplied: false,
  }
}

function proposal(): Record<string, unknown> {
  return {
    artifactRole: 'graph-delta-proposal-only-preview',
    status: 'generated-proposal-only-preview',
    schemaId: 'devview-graph-update-proposal-v0',
    proposalId: 'proposal-test',
    proposalOnly: true,
    proposalGenerated: true,
    humanReviewQuestions: [{ id: 'question-1' }],
    boundaries: {
      proposalOnly: true,
      graphSourceMutated: false,
      graphDeltaApplied: false,
      approvalStatus: 'not-approved',
      runtimeEvidenceSatisfied: false,
      equivalenceProven: false,
      scopeEnforced: false,
      diffRejected: false,
      acceptedEvidence: false,
    },
    nonEnforcing: true,
  }
}

function reviewPacket(): Record<string, unknown> {
  return {
    artifactRole: 'graph-delta-human-review-packet',
    reviewPacketStatus: 'review-required',
    sourceProposal: 'generated/proposal.json',
    proposalId: 'proposal-test',
    humanReviewQuestions: [{ id: 'question-1' }],
    blockingReviewItems: [],
    reviewRequiredItems: [{ id: 'review-1' }],
    approvalStatus: 'not-approved',
    graphSourceMutated: false,
    graphDeltaApplied: false,
    humanDecisionRecorded: false,
    candidateEvidenceAccepted: false,
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    nonEnforcing: true,
  }
}
