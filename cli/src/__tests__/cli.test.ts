import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runPbeCli } from '../app'
import { writeJsonArtifactTransaction } from '../core/artifact-transaction'
import { recommendProfile } from '../core/profile-recommendation'
import { canTransition, isPbeState, PBE_STATE } from '../core/state-machine'
import { checkpointPbeState, transitionPbeState } from '../core/state-transition'
import { ExitCode } from '../core/types'
import { validateEvidence } from '../validators/evidence-validator'
import { validateProductPatchTree } from '../validators/product-patch-validator'
import { validateState } from '../validators/state-validator'
import {
  writeCoverageAudit,
  writeDependencyImpactAudit,
  writeExecutionManifest,
  writeExecutionStrategy,
  writeFinalCoverage,
  writeUxAudit,
} from './fixtures/acep'
import { writeEvidenceTree, writeVisualScreenshotEvidence } from './fixtures/evidence-tree'
import { writeEmptyAcceptance, writePbeState, writeUserAcceptance } from './fixtures/pbe-state'
import {
  writeDecisionQueue,
  writeExecutableProduct,
  writeMinimalPbe,
  writeRequirementCompat,
} from './fixtures/product-tree'
import { writeTestTree } from './fixtures/test-tree'
import { cleanupWorkspaces, createWorkspace, writeJson, writeText } from './fixtures/workspace'
import { writePassingVisualAudit, writeVisualContractArtifacts } from './fixtures/visual'
import { writeWorkTree } from './fixtures/work-tree'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('PBE CLI', () => {
  it('recognizes canonical PBE states and transition helpers', () => {
    expect(isPbeState(PBE_STATE.RPD_DONE)).toBe(true)
    expect(isPbeState('NOT_A_PBE_STATE')).toBe(false)
    expect(canTransition(PBE_STATE.RPD_DONE, PBE_STATE.WPD_DONE)).toBe(true)
    expect(canTransition(PBE_STATE.SCOPE_SELECTED, PBE_STATE.WPD_DONE)).toBe(false)
    expect(canTransition(PBE_STATE.ACEP_READY, PBE_STATE.ACEP_RUN_DONE)).toBe(false)
    expect(canTransition(PBE_STATE.WAITING_REVIEW_RESULT, PBE_STATE.DONE)).toBe(false)
    expect(canTransition(PBE_STATE.WAITING_REVIEW_RESULT, PBE_STATE.ACCEPTED)).toBe(true)
    expect(canTransition(PBE_STATE.ACCEPTED, PBE_STATE.DONE)).toBe(true)
  })

  it('prints help', async () => {
    const result = await runPbeCli(['--help'], { cwd: pluginRoot, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(result.stdout).toContain('Project Blueprint Engine CLI')
    expect(result.stdout).toContain('profile recommend')
    expect(result.stdout).toContain('rpd close')
    expect(result.stdout).toContain('wpd close')
    expect(result.stdout).toContain('execution start')
    expect(result.stdout).toContain('review submit')
  })

  it('recommends lite for docs-only briefs and files', async () => {
    const direct = recommendProfile({
      brief: 'docs/troubleshooting.md에 npm.ps1 설명 추가',
      files: ['docs/troubleshooting.md', 'docs/install.md'],
    })
    const workspace = createWorkspace()

    const result = await runPbeCli(
      [
        'profile',
        'recommend',
        '--brief',
        'docs/troubleshooting.md에 npm.ps1 설명 추가',
        '--files',
        'docs/troubleshooting.md,docs/install.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(direct.recommendedProfile).toBe('lite')
    expect(direct.confidence).toBe('high')
    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.recommendedProfile).toBe('lite')
    expect(payload.confidence).toBe('high')
    expect(payload.reasons).toContain('docs-only or low-risk documentation change')
    expect(payload.reasons).toContain('bounded expected files')
  })

  it('recommends bypass for explanation-only briefs without changes', async () => {
    const result = await runPbeCli(
      ['profile', 'recommend', '--brief', '이 문서 내용 설명해줘. 파일 수정은 하지 마.', '--json'],
      {
        cwd: createWorkspace(),
        pluginRoot,
      },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.recommendedProfile).toBe('bypass')
    expect(payload.reasons).toContain('question/explanation request detected')
  })

  it.each([
    ['관리자 페이지를 깔끔하게 개선해줘', 'UI/UX or visual design signal detected'],
    ['권한 정책과 DB schema를 바꿔줘', 'DB/schema change signal detected'],
  ])('recommends full for high-risk brief: %s', async (brief, expectedReason) => {
    const result = await runPbeCli(['profile', 'recommend', '--brief', brief, '--json'], {
      cwd: createWorkspace(),
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.recommendedProfile).toBe('full')
    expect(payload.reasons).toContain(expectedReason)
  })

  it('recommends full when files include CLI, validator, schema, state, or fixture paths', async () => {
    const result = await runPbeCli(
      [
        'profile',
        'recommend',
        '--brief',
        '작은 문서 정리',
        '--files',
        'cli/src/commands/status.ts,schemas/pbe-state.schema.json,examples/valid/todo-app-pbe-run/README.md',
        '--json',
      ],
      { cwd: createWorkspace(), pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.recommendedProfile).toBe('full')
    expect(payload.reasons).toContain('high-risk file path: cli/src/commands/status.ts')
    expect(payload.reasons).toContain('high-risk file path: schemas/pbe-state.schema.json')
  })

  it('fails profile recommendation when --brief is missing', async () => {
    const result = await runPbeCli(['profile', 'recommend', '--json'], { cwd: createWorkspace(), pluginRoot })

    expect(result.exitCode).toBe(ExitCode.InvalidArguments)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues[0].code).toBe('PROFILE_BRIEF_REQUIRED')
    expect(payload.issues[0].message).toBe('Missing required option: --brief')
  })

  it('prints profile recommendation JSON and does not initialize PBE', async () => {
    const workspace = createWorkspace()

    const result = await runPbeCli(['profile', 'recommend', '--brief', 'README 링크 문구 한 줄 정리', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload).toMatchObject({
      recommendedProfile: 'lite',
      confidence: 'medium',
      suggestedInitCommand: 'pbe init --profile lite --brief "README 링크 문구 한 줄 정리"',
    })
    expect(payload.escalationTriggers).toContain('product meaning change')
    expect(payload.notes).toContain('This is a recommendation only. It does not initialize PBE.')
    expect(existsSync(join(workspace, '.pbe'))).toBe(false)
  })

  it('reports status as not initialized when .pbe is missing', async () => {
    const workspace = createWorkspace()

    const result = await runPbeCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.NotInitialized)
    const payload = JSON.parse(result.stderr)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].code).toBe('PBE_NOT_INITIALIZED')
  })

  it('initializes .pbe artifacts without overwriting existing files', async () => {
    const workspace = createWorkspace()

    const init = await runPbeCli(['init', '--profile', 'full', '--brief', 'Build a printer setup flow', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const secondInit = await runPbeCli(['init', '--profile', 'full', '--brief', 'Changed brief', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const status = await runPbeCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(init.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(init.stdout).created).toContain('.pbe/tree/product-tree.json')
    expect(secondInit.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(secondInit.stdout).skipped).toContain('.pbe/tree/product-tree.json')
    expect(status.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(status.stdout).state).toBe('INIT')
  })

  it.each([
    ['INIT', 'pbe rpd close or pbe rpd check'],
    ['WPD_DONE', 'pbe vd close'],
    ['ACEP_READY', 'pbe execution start'],
    ['EXECUTION_IN_PROGRESS', 'pbe execution complete'],
  ])('recommends the next status command for %s', async (state, expectedCommand) => {
    const workspace = createWorkspace()
    writePbeState(workspace, state)

    const result = await runPbeCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.state).toBe(state)
    expect(payload.recommendedNextCommand).toBe(expectedCommand)
  })

  it('points review result status to acceptance or change routing', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'WAITING_REVIEW_RESULT')

    const result = await runPbeCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.recommendedNextCommand).toContain('pbe accept')
    expect(payload.recommendedNextCommand).toContain('pbe change create')
  })

  it('includes active revision and last transition in status JSON', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'REVISION_REQUESTED', {
      activeRevision: {
        changeNodeId: 'CH-001',
        status: 'in_progress',
        startedAt: '2026-06-12T00:00:00.000Z',
        impactNodeIds: ['IM-001'],
        affectedWorkNodeIds: ['WT-1'],
      },
      stateHistory: [
        {
          from: 'WAITING_REVIEW_RESULT',
          to: 'REVISION_REQUESTED',
          command: 'change create',
          at: '2026-06-12T00:00:00.000Z',
        },
      ],
    })

    const result = await runPbeCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.activeRevision).toMatchObject({
      changeNodeId: 'CH-001',
      status: 'in_progress',
      impactNodeIds: ['IM-001'],
      affectedWorkNodeIds: ['WT-1'],
    })
    expect(payload.lastTransition).toMatchObject({
      from: 'WAITING_REVIEW_RESULT',
      to: 'REVISION_REQUESTED',
      command: 'change create',
    })
  })

  it('reports unknown status state without running full validation', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'UNKNOWN_STATE')

    const result = await runPbeCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.state).toBe('UNKNOWN_STATE')
    expect(payload.recommendedNextCommand).toBe('pbe validate')
    expect(payload.blockingIssues.map((entry: { code: string }) => entry.code)).toContain('UNKNOWN_STATE')
    expect(payload.suggestedFixes[0]).toContain('pbe validate')
  })

  it('keeps existing status JSON fields while adding navigator fields', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'WPD_DONE', {
      currentGate: 'wpd',
      nextStep: 'vd',
      deliveryStatus: 'wpd_done',
    })

    const result = await runPbeCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload).toMatchObject({
      initialized: true,
      profile: 'full',
      state: 'WPD_DONE',
      currentGate: 'wpd',
      nextStep: 'vd',
      deliveryStatus: 'wpd_done',
      stateHistoryCount: 0,
      recommendedNextCommand: 'pbe vd close',
    })
    expect(payload).toHaveProperty('openBlockingDecisions')
    expect(payload).toHaveProperty('artifacts')
    expect(payload).toHaveProperty('activeRevision')
    expect(payload).toHaveProperty('lastTransition')
    expect(payload).toHaveProperty('blockingIssues')
    expect(payload).toHaveProperty('suggestedFixes')
  })

  it('shows Lite guidance in status text output', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'WPD_DONE', { profile: 'lite' })

    const result = await runPbeCli(['status'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(result.stdout).toContain('Profile: lite')
    expect(result.stdout).toContain('Recommended next command: pbe vd close')
    expect(result.stdout).toContain('Lite guidance:')
    expect(result.stdout).toContain('Lite mode is a smaller PBE workflow')
    expect(result.stdout).toContain('Escalate to full if product meaning change')
  })

  it('includes Lite profile guidance in status JSON without changing next command', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'WPD_DONE', { profile: 'lite' })

    const result = await runPbeCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.profile).toBe('lite')
    expect(payload.recommendedNextCommand).toBe('pbe vd close')
    expect(payload.profileGuidance).toMatchObject({
      profile: 'lite',
      summary: 'Lite mode is a smaller PBE workflow for bounded low-risk slices, not a safety bypass.',
    })
    expect(payload.profileGuidance.mustKeepGuards).toContain('expectedFiles / File Change Guard')
    expect(payload.profileGuidance.mustKeepGuards).toContain('minimal Test/Evidence')
    expect(payload.profileGuidance.escalationTriggers).toContain('product meaning change')
    expect(payload.profileGuidance.escalationTriggers).toContain('Product Patch required')
    expect(payload.profileGuidance.limitations).toContain('No dedicated pbe lite command yet')
  })

  it.each([
    ['full', 'Full guidance:'],
    ['bypass', 'Bypass guidance:'],
  ] as const)('does not fail status for %s profile guidance', async (profile, expectedText) => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'INIT', { profile })

    const textResult = await runPbeCli(['status'], { cwd: workspace, pluginRoot })
    const jsonResult = await runPbeCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(textResult.exitCode).toBe(ExitCode.Success)
    expect(textResult.stdout).toContain(expectedText)
    expect(jsonResult.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(jsonResult.stdout).profileGuidance.profile).toBe(profile)
  })

  it('blocks WPD gate before RPD can close', async () => {
    const workspace = createWorkspace()
    await runPbeCli(['init', '--brief', 'Make the UI clean'], { cwd: workspace, pluginRoot })

    const result = await runPbeCli(['gate', 'wpd', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('ROOT_NOT_CONFIRMED_BY_USER')
  })

  it('rejects RPD close when selected Product has unresolved abstract quality terms', async () => {
    const workspace = createWorkspace()
    writeMinimalPbe(workspace, {
      productTitle: 'Make the UI clean',
      ambiguityResolved: false,
      includeAcceptanceCriteria: true,
      rootUserConfirmed: true,
    })

    const result = await runPbeCli(['rpd', 'close', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('ABSTRACT_QUALITY_TERM')
  })

  it.each([
    [
      'id',
      'AC_ID_MISSING',
      (criterion: Record<string, any>) => {
        delete criterion.id
      },
    ],
    [
      'condition',
      'AC_CONDITION_MISSING',
      (criterion: Record<string, any>) => {
        delete criterion.condition
        criterion.statement = 'THE SYSTEM SHALL show the updated status text.'
      },
    ],
    [
      'observable result',
      'AC_OBSERVABLE_RESULT_MISSING',
      (criterion: Record<string, any>) => {
        delete criterion.observableResult
      },
    ],
    [
      'verification method',
      'AC_VERIFICATION_METHOD_MISSING',
      (criterion: Record<string, any>) => {
        delete criterion.verificationMethod
        delete criterion.verification.method
      },
    ],
    [
      'required evidence',
      'AC_EVIDENCE_REQUIREMENT_MISSING',
      (criterion: Record<string, any>) => {
        delete criterion.requiredEvidence
        criterion.verification.evidenceTypes = []
      },
    ],
  ])('rejects RPD close when structured acceptance criterion lacks %s', async (_field, code, mutate) => {
    const workspace = createWorkspace()
    writeMinimalPbe(workspace, {
      productTitle: 'Show connected status',
      ambiguityResolved: true,
      includeAcceptanceCriteria: true,
      rootUserConfirmed: true,
    })
    mutateFirstAcceptanceCriterion(workspace, mutate)

    const result = await runPbeCli(['rpd', 'close', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(code)
  })

  it('rejects RPD close when acceptance criterion contains an abstract quality term', async () => {
    const workspace = createWorkspace()
    writeMinimalPbe(workspace, {
      productTitle: 'Show connected status',
      ambiguityResolved: true,
      includeAcceptanceCriteria: true,
      rootUserConfirmed: true,
    })
    mutateFirstAcceptanceCriterion(workspace, (criterion) => {
      criterion.observableResult = 'The status is shown 깔끔하게.'
    })

    const result = await runPbeCli(['rpd', 'close', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('AC_ABSTRACT_TERM')
  })

  it('allows acceptanceNotRequiredReason for a non-executable foundation Product node', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, '.pbe', 'tree', 'product-tree.json'), {
      version: '0.2.0-tree-control',
      rootNodeId: 'PT-ROOT',
      nodes: [
        {
          id: 'PT-ROOT',
          type: 'non_goal',
          title: 'Foundation grouping node',
          status: 'confirmed',
          parent: null,
          children: [],
          source: { actor: 'user', type: 'user_interview' },
          scopeClass: 'foundation',
          acceptanceCriteria: [],
          acceptanceNotRequiredReason:
            'This node groups implementation foundation and has no user-observable behavior.',
          ambiguity: { status: 'clear', type: 'none', missing: [] },
          ambiguityResolution: { status: 'resolved', resolvedTerms: [] },
        },
      ],
    })
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'INIT')

    const result = await runPbeCli(['rpd', 'close', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).state).toBe('RPD_DONE')
  })

  it('closes RPD and updates state when root and leaf are user-confirmed', async () => {
    const workspace = createWorkspace()
    writeMinimalPbe(workspace, {
      productTitle: 'Show connected status',
      ambiguityResolved: true,
      includeAcceptanceCriteria: true,
      rootUserConfirmed: true,
    })

    const result = await runPbeCli(['rpd', 'close', '--json'], { cwd: workspace, pluginRoot })
    const status = await runPbeCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).state).toBe('RPD_DONE')
    const statusPayload = JSON.parse(status.stdout)
    expect(statusPayload.state).toBe('RPD_DONE')
    expect(statusPayload.stateHistoryCount).toBe(1)
    expect(statusPayload.lastTransition).toMatchObject({
      from: 'INIT',
      to: 'RPD_DONE',
      command: 'rpd close',
    })
    expect(readState(workspace).autoflow.stateHistory).toHaveLength(1)
  })

  it('records UI/UX user approval through the CLI', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'RPD_DONE')
    writeText(
      join(workspace, '.pbe', 'blueprint', 'ui-ux-confirmation.md'),
      [
        '# UI/UX Confirmation',
        '',
        '## Item: SCREEN-001',
        '',
        '- Status: confirmed',
        '- Confirmed by: user',
        '',
        '## Confirmed Direction',
        '',
        '- User approved the proposed UI/UX direction.',
        '',
      ].join('\n'),
    )

    const result = await runPbeCli(['ui', 'approve', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('UI_UX_APPROVED')
    expect(state.autoflow.completedSteps).toContain('ui_ux_confirm')
    expect(state.autoflow.currentGate).toBeNull()
    expect(state.autoflow.nextStep).toBe('visual_reference_intake')
    expect(state.autoflow.stateHistory.map((entry: { to: string }) => entry.to)).toEqual([
      'WAITING_UI_UX_CONFIRM',
      'UI_UX_APPROVED',
    ])
    expectLastTransition(state, {
      from: 'WAITING_UI_UX_CONFIRM',
      to: 'UI_UX_APPROVED',
      command: 'ui approve',
      actor: 'user',
    })
  })

  it('does not mutate state when UI/UX approval runs from the wrong state', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'ACEP_READY')
    writeText(
      join(workspace, '.pbe', 'blueprint', 'ui-ux-confirmation.md'),
      '# UI/UX Confirmation\n\n- Status: confirmed\n- Confirmed by: user\n',
    )

    const before = readStateText(workspace)
    const result = await runPbeCli(['ui', 'approve', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'INVALID_TRANSITION',
    )
    expect(after).toBe(before)
  })

  it('blocks accept gate without user approval', async () => {
    const workspace = createWorkspace()
    writeMinimalPbe(workspace, {
      productTitle: 'Show connected status',
      ambiguityResolved: true,
      includeAcceptanceCriteria: true,
      rootUserConfirmed: true,
      acceptedByAssistant: true,
    })

    const result = await runPbeCli(['gate', 'accept', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('ASSISTANT_ACCEPTED_STATUS')
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('USER_APPROVAL_REQUIRED')
  })

  it('rejects WPD when Work Tree dependencies contain a cycle', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writePbeState(workspace, 'UI_UX_APPROVED')
    writeDecisionQueue(workspace)
    writeWorkTree(workspace, { dependencyCycle: true })

    const result = await runPbeCli(['wpd', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('DEPENDENCY_CYCLE')
  })

  it('stage-aware WPD traceability requires Product to Work links only', async () => {
    const missingWorkWorkspace = createWorkspace()
    writeExecutableProduct(missingWorkWorkspace)
    const missingWork = await runPbeCli(['trace', 'check', '--stage', 'wpd', '--json'], {
      cwd: missingWorkWorkspace,
      pluginRoot,
    })

    expect(missingWork.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(missingWork.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PRODUCT_WORK_LINK_MISSING',
    )

    const noTestWorkspace = createWorkspace()
    writeExecutableProduct(noTestWorkspace)
    writeWorkTree(noTestWorkspace)
    const noTest = await runPbeCli(['trace', 'check', '--stage', 'wpd', '--json'], {
      cwd: noTestWorkspace,
      pluginRoot,
    })

    expect(noTest.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(noTest.stdout).ok).toBe(true)
  })

  it('prints consistent JSON issue metadata for failed validation', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)

    const result = await runPbeCli(['trace', 'check', '--stage', 'wpd', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    const issue = payload.issues.find((entry: { code: string }) => entry.code === 'PRODUCT_WORK_LINK_MISSING')
    expect(issue).toMatchObject({
      code: 'PRODUCT_WORK_LINK_MISSING',
      severity: 'error',
      message: expect.any(String),
      file: '.pbe/tree/work-tree.json',
      nodeType: 'Product',
      stage: 'wpd',
      reason: expect.any(String),
      suggestedFix: expect.any(String),
      nextCommand: 'pbe wpd close',
    })
  })

  it('prints suggested fix and next command in text failure output', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)

    const result = await runPbeCli(['trace', 'check', '--stage', 'wpd'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(result.stderr).toContain('Command: trace check')
    expect(result.stderr).toContain('Status: FAIL')
    expect(result.stderr).toContain('Issues: 1 total, 1 error')
    expect(result.stderr).toContain('[error] PRODUCT_WORK_LINK_MISSING')
    expect(result.stderr).toContain('Suggested fix:')
    expect(result.stderr).toContain('Next command: pbe wpd close')
  })

  it('stage-aware WPD traceability rejects inactive Product scope leaks', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { scopeClass: 'deferred', status: 'deferred' })
    writeWorkTree(workspace)

    const result = await runPbeCli(['trace', 'check', '--stage', 'wpd', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('DEFERRED_SCOPE_LEAK')
  })

  it('accepts VD coverage when a Test node verifies the Work acceptance criteria', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeWorkTree(workspace)
    writeTestTree(workspace, { verifiesWork: false, verifiesAcceptanceCriteria: true })

    const result = await runPbeCli(['vd', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).ok).toBe(true)
  })

  it('stage-aware VD traceability requires Work and acceptance criteria to be covered by tests', async () => {
    const missingTestWorkspace = createWorkspace()
    writeExecutableProduct(missingTestWorkspace)
    writeWorkTree(missingTestWorkspace)
    const missingTest = await runPbeCli(['trace', 'check', '--stage', 'vd', '--json'], {
      cwd: missingTestWorkspace,
      pluginRoot,
    })

    expect(missingTest.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(missingTest.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'WORK_TEST_LINK_MISSING',
    )

    const missingAcWorkspace = createWorkspace()
    writeExecutableProduct(missingAcWorkspace)
    writeWorkTree(missingAcWorkspace)
    writeTestTree(missingAcWorkspace, { verifiesAcceptanceCriteria: false })
    const missingAc = await runPbeCli(['trace', 'check', '--stage', 'vd', '--json'], {
      cwd: missingAcWorkspace,
      pluginRoot,
    })

    expect(missingAc.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(missingAc.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ACCEPTANCE_NOT_COVERED',
    )
  })

  it('stage-aware VD traceability does not require Evidence Tree files yet', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeWorkTree(workspace)
    writeTestTree(workspace)

    const result = await runPbeCli(['trace', 'check', '--stage', 'vd', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).ok).toBe(true)
  })

  it('stage-aware VD traceability requires tests to declare evidence', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeWorkTree(workspace)
    writeTestTree(workspace, { evidenceRequired: [] })

    const result = await runPbeCli(['trace', 'check', '--stage', 'vd', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('TEST_EVIDENCE_DECLARATION_MISSING')
  })

  it('rejects VD close when required acceptance criteria are not covered by Test Tree', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'WPD_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace, { verifiesAcceptanceCriteria: false })

    const before = readStateText(workspace)
    const result = await runPbeCli(['vd', 'close', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('ACCEPTANCE_NOT_COVERED')
    expect(after).toBe(before)
  })

  it('rejects VD check when UI acceptance criteria lack screenshot or manual evidence coverage', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    mutateFirstAcceptanceCriterion(workspace, (criterion) => {
      criterion.verificationMethod = 'test_log'
      criterion.requiredEvidence = ['test_output']
      criterion.verification.method = 'test_log'
      criterion.verification.evidenceTypes = ['test_output']
    })
    writeWorkTree(workspace)
    writeTestTree(workspace, { evidenceRequired: ['test output'] })

    const result = await runPbeCli(['vd', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('UI_ACCEPTANCE_EVIDENCE_NOT_COVERED')
  })

  it('rejects UI Test nodes without screenshot or manual evidence requirement', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeWorkTree(workspace)
    writeTestTree(workspace, { testType: 'ui_state_test', evidenceRequired: ['test log'] })

    const result = await runPbeCli(['vd', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('UI_EVIDENCE_MISSING')
  })

  it('rejects selected visual UI work without a visual reference', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })

    const result = await runPbeCli(['visual', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('VISUAL_REFERENCE_MISSING')
  })

  it('accepts default PBE Clean Theme when visual contract artifacts are present', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeVisualContractArtifacts(workspace)

    const result = await runPbeCli(['visual', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).ok).toBe(true)
  })

  it('allows WPD gate for visual work after Visual Contract and before UI Surface Inventory', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'UI_UX_APPROVED')
    writeVisualContractArtifacts(workspace, { contractOnly: true })

    const result = await runPbeCli(['gate', 'wpd', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).ok).toBe(true)
  })

  it('blocks VD gate for visual work before UI Surface Inventory exists', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'WPD_DONE')
    writeWorkTree(workspace)
    writeVisualContractArtifacts(workspace, { contractOnly: true })

    const result = await runPbeCli(['gate', 'vd', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('UI_SURFACE_INVENTORY_MISSING')
  })

  it('rejects review evidence when required visual screenshot evidence is missing', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeVisualContractArtifacts(workspace, { requiredScreenshot: true })
    writeJson(join(workspace, '.pbe', 'evidence', 'evidence-tree.json'), {
      version: '0.2.0-tree-control',
      evidence: [],
    })

    const result = await runPbeCli(['evidence', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('VISUAL_SCREENSHOT_EVIDENCE_MISSING')
  })

  it('rejects stale visual screenshot evidence', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeVisualContractArtifacts(workspace, { requiredScreenshot: true })
    writeJson(join(workspace, '.pbe', 'evidence', 'evidence-tree.json'), {
      version: '0.2.0-tree-control',
      evidence: [
        {
          id: 'EV-VISUAL-1',
          type: 'screenshot',
          status: 'stale_evidence',
          path: '.pbe/evidence/screenshots/surface-1-default.png',
          provesNodeIds: ['TT-1'],
          evidenceForTestNodeIds: ['TT-1'],
        },
      ],
    })

    const result = await runPbeCli(['evidence', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('STALE_VISUAL_EVIDENCE')
  })

  it('blocks Review Result for visual UI work when visual audit is missing', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeVisualContractArtifacts(workspace, { requiredScreenshot: true })
    writePbeState(workspace, 'ACEP_RUN_DONE')
    writeVisualScreenshotEvidence(workspace)

    const result = await runPbeCli(['gate', 'review-result', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('VISUAL_AUDIT_MISSING')
  })

  it('blocks Review Result when visual audit has unresolved blocking issues', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeVisualContractArtifacts(workspace, { requiredScreenshot: true })
    writePbeState(workspace, 'ACEP_RUN_DONE')
    writeVisualScreenshotEvidence(workspace)
    writeText(
      join(workspace, '.pbe', 'evidence', 'visual-audit.md'),
      [
        '# Visual Implementation Audit',
        '',
        '## Scope',
        '## Visual Contract Artifacts',
        '## Screenshot Evidence',
        '## State Coverage',
        '## Component Contract Compliance',
        '## Deviations',
        '## Blocking Issues',
        '- Missing selected state screenshot',
        '',
        '## Result',
        '- Status: pass',
        '',
      ].join('\n'),
    )

    const result = await runPbeCli(['gate', 'review-result', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('VISUAL_AUDIT_BLOCKING_ISSUES')
  })

  it('rejects ACEP manifests that include inactive scope tasks', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { scopeClass: 'deferred', status: 'deferred' })
    writeWorkTree(workspace, { workScopeClass: 'deferred', workStatus: 'deferred' })
    writeExecutionManifest(workspace, { taskScopeClass: 'deferred' })
    writeFinalCoverage(workspace)

    const result = await runPbeCli(['acep', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('ACEP_SCOPE_LEAK')
  })

  it('rejects Evidence nodes whose attached file path is missing', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace, { path: '.pbe/evidence/test-results/missing.log' })

    const result = await runPbeCli(['evidence', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('EVIDENCE_FILE_MISSING')
  })

  it('accepts current evidence across execution, review, and accept evidence validation stages', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { productUpdatedAt: '2026-06-12T10:00:00.000Z' })
    writeWorkTree(workspace, { workUpdatedAt: '2026-06-12T10:30:00.000Z' })
    writeTestTree(workspace, { testUpdatedAt: '2026-06-12T11:00:00.000Z' })
    writeEvidenceTree(workspace, {
      createdAt: '2026-06-12T12:00:00.000Z',
      provesProductNodeIds: ['PT-1'],
      provesWorkNodeIds: ['WT-1'],
      provesTestNodeIds: ['TT-1'],
    })
    writeUserAcceptance(workspace)

    const executionIssues = await validateEvidence(workspace, { stage: 'execution', requireVisualAudit: false })
    const reviewIssues = await validateEvidence(workspace, { stage: 'review', requireVisualAudit: false })
    const acceptIssues = await validateEvidence(workspace, { stage: 'accept', requireVisualAudit: false })

    expect(executionIssues.filter((entry) => entry.severity === 'error')).toEqual([])
    expect(reviewIssues.filter((entry) => entry.severity === 'error')).toEqual([])
    expect(acceptIssues.filter((entry) => entry.severity === 'error')).toEqual([])
  })

  it('warns about missing evidence timestamps during execution but fails review and accept', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace, { omitTimestamp: true })
    writeUserAcceptance(workspace)

    const executionIssues = await validateEvidence(workspace, { stage: 'execution', requireVisualAudit: false })
    const reviewIssues = await validateEvidence(workspace, { stage: 'review', requireVisualAudit: false })
    const acceptIssues = await validateEvidence(workspace, { stage: 'accept', requireVisualAudit: false })

    expect(executionIssues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'EVIDENCE_TIMESTAMP_MISSING', severity: 'warning' })]),
    )
    expect(reviewIssues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'EVIDENCE_TIMESTAMP_MISSING', severity: 'error' })]),
    )
    expect(acceptIssues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'EVIDENCE_TIMESTAMP_MISSING', severity: 'error' })]),
    )
  })

  it('rejects stale evidence when it is older than linked Work or Test nodes', async () => {
    const workWorkspace = createWorkspace()
    writeExecutableProduct(workWorkspace)
    writeWorkTree(workWorkspace, { workUpdatedAt: '2026-06-12T10:00:00.000Z' })
    writeTestTree(workWorkspace)
    writeEvidenceTree(workWorkspace, {
      createdAt: '2026-06-12T09:00:00.000Z',
      provesWorkNodeIds: ['WT-1'],
    })

    const testWorkspace = createWorkspace()
    writeExecutableProduct(testWorkspace)
    writeWorkTree(testWorkspace)
    writeTestTree(testWorkspace, { testUpdatedAt: '2026-06-12T10:00:00.000Z' })
    writeEvidenceTree(testWorkspace, { createdAt: '2026-06-12T09:00:00.000Z' })

    const workIssues = await validateEvidence(workWorkspace, { stage: 'review', requireVisualAudit: false })
    const testIssues = await validateEvidence(testWorkspace, { stage: 'review', requireVisualAudit: false })

    expect(workIssues.map((entry) => entry.code)).toContain('EVIDENCE_STALE')
    expect(testIssues.map((entry) => entry.code)).toContain('EVIDENCE_STALE')
  })

  it('does not mutate state when review submit finds stale evidence', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'ACEP_RUN_DONE')
    writeWorkTree(workspace, { workUpdatedAt: '2026-06-12T10:00:00.000Z' })
    writeTestTree(workspace)
    writeEvidenceTree(workspace, {
      createdAt: '2026-06-12T09:00:00.000Z',
      provesWorkNodeIds: ['WT-1'],
    })

    const before = readStateText(workspace)
    const result = await runPbeCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain('EVIDENCE_STALE')
    expect(after).toBe(before)
  })

  it('passes file guard when changed source file is within Work expectedFiles', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'WPD_DONE')
    writeWorkTree(workspace)
    writeText(join(workspace, 'src', 'status.ts'), 'export const status = "baseline"\n')
    initGitRepository(workspace)
    writeText(join(workspace, 'src', 'status.ts'), 'export const status = "changed"\n')

    const result = await runPbeCli(['files', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).issues).toEqual([])
  })

  it('fails file guard when changed source file matches forbiddenFiles', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'WPD_DONE')
    writeWorkTree(workspace)
    addWorkNodeFields(workspace, 'WT-1', { forbiddenFiles: ['src/secret.ts'] })
    writeText(join(workspace, 'src', 'secret.ts'), 'export const secret = "baseline"\n')
    initGitRepository(workspace)
    writeText(join(workspace, 'src', 'secret.ts'), 'export const secret = "changed"\n')

    const result = await runPbeCli(['files', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'FILE_CHANGE_FORBIDDEN',
    )
  })

  it('fails file guard for unknown source files when Work scope has no unknownFileTouchRisk', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'WPD_DONE')
    writeWorkTree(workspace)
    writeText(join(workspace, 'src', 'outside.ts'), 'export const outside = "baseline"\n')
    initGitRepository(workspace)
    writeText(join(workspace, 'src', 'outside.ts'), 'export const outside = "changed"\n')

    const result = await runPbeCli(['files', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'FILE_CHANGE_OUTSIDE_WORK_SCOPE',
    )
  })

  it('does not treat .pbe-only artifact changes as source file violations', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'WPD_DONE')
    writeWorkTree(workspace)
    initGitRepository(workspace)
    writeText(join(workspace, '.pbe', 'blueprint', 'notes.md'), 'artifact update\n')

    const result = await runPbeCli(['files', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).issues).toEqual([])
  })

  it('fails file guard for DONE source changes without activeRevision', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'DONE', { deliveryStatus: 'accepted', completedSteps: ['complete'], nextStep: null })
    writeWorkTree(workspace)
    writeText(join(workspace, 'src', 'status.ts'), 'export const status = "baseline"\n')
    initGitRepository(workspace)
    writeText(join(workspace, 'src', 'status.ts'), 'export const status = "changed"\n')

    const result = await runPbeCli(['files', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'FILE_CHANGE_REQUIRES_REVISION',
    )
  })

  it('allows activeRevision source changes inside affected Work expectedFiles', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'REVISION_REQUESTED', {
      activeRevision: {
        changeNodeId: 'CH-001',
        impactNodeIds: ['IM-001'],
        affectedWorkNodeIds: ['WT-1'],
        status: 'in_progress',
      },
    })
    writeWorkTree(workspace)
    writeText(join(workspace, 'src', 'status.ts'), 'export const status = "baseline"\n')
    initGitRepository(workspace)
    writeText(join(workspace, 'src', 'status.ts'), 'export const status = "changed"\n')

    const result = await runPbeCli(['files', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).issues).toEqual([])
  })

  it('fails activeRevision source changes outside affected Work expectedFiles', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'REVISION_REQUESTED', {
      activeRevision: {
        changeNodeId: 'CH-001',
        impactNodeIds: ['IM-001'],
        affectedWorkNodeIds: ['WT-1'],
        status: 'in_progress',
      },
    })
    writeWorkTree(workspace)
    writeText(join(workspace, 'src', 'outside.ts'), 'export const outside = "baseline"\n')
    initGitRepository(workspace)
    writeText(join(workspace, 'src', 'outside.ts'), 'export const outside = "changed"\n')

    const result = await runPbeCli(['files', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'FILE_CHANGE_OUTSIDE_WORK_SCOPE',
    )
  })

  it('does not mutate state when review submit finds unexplained source changes', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'ACEP_RUN_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace)
    writeText(join(workspace, 'src', 'outside.ts'), 'export const outside = "baseline"\n')
    initGitRepository(workspace)
    writeText(join(workspace, 'src', 'outside.ts'), 'export const outside = "changed"\n')

    const before = readStateText(workspace)
    const result = await runPbeCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'FILE_CHANGE_REQUIRES_REVISION',
    )
    expect(after).toBe(before)
  })

  it('does not mutate state when accept finds unexplained source changes', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writePbeState(workspace, 'WAITING_REVIEW_RESULT')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace)
    writeUserAcceptance(workspace)
    writeText(join(workspace, 'src', 'outside.ts'), 'export const outside = "baseline"\n')
    initGitRepository(workspace)
    writeText(join(workspace, 'src', 'outside.ts'), 'export const outside = "changed"\n')

    const before = readStateText(workspace)
    const result = await runPbeCli(['accept', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'FILE_CHANGE_REQUIRES_REVISION',
    )
    expect(after).toBe(before)
  })

  it('rejects superseded evidence as current proof unless fresh replacement evidence is linked', async () => {
    const supersededWorkspace = createWorkspace()
    writeExecutableProduct(supersededWorkspace)
    writeWorkTree(supersededWorkspace)
    writeTestTree(supersededWorkspace)
    writeEvidenceTree(supersededWorkspace, { status: 'superseded' })

    const supersededByWorkspace = createWorkspace()
    writeExecutableProduct(supersededByWorkspace)
    writeWorkTree(supersededByWorkspace)
    writeTestTree(supersededByWorkspace)
    writeEvidenceTree(supersededByWorkspace, { supersededByEvidenceId: 'EV-2' })

    const replacedWorkspace = createWorkspace()
    writeExecutableProduct(replacedWorkspace)
    writeWorkTree(replacedWorkspace)
    writeTestTree(replacedWorkspace)
    writeEvidenceTree(replacedWorkspace, {
      supersedesEvidenceIds: ['EV-OLD'],
      extraEvidence: [
        {
          id: 'EV-OLD',
          type: 'test_output',
          status: 'superseded',
          createdAt: '2026-06-12T09:00:00.000Z',
          supersededByEvidenceId: 'EV-1',
          provesNodeIds: ['TT-1'],
          evidenceForTestNodeIds: ['TT-1'],
        },
      ],
    })

    const supersededIssues = await validateEvidence(supersededWorkspace, {
      stage: 'review',
      requireVisualAudit: false,
    })
    const supersededByIssues = await validateEvidence(supersededByWorkspace, {
      stage: 'review',
      requireVisualAudit: false,
    })
    const replacedIssues = await validateEvidence(replacedWorkspace, { stage: 'review', requireVisualAudit: false })

    expect(supersededIssues.map((entry) => entry.code)).toContain('EVIDENCE_SUPERSEDED')
    expect(supersededByIssues.map((entry) => entry.code)).toContain('EVIDENCE_SUPERSEDED')
    expect(replacedIssues.filter((entry) => entry.severity === 'error')).toEqual([])
  })

  it('does not mutate state when accept finds stale status evidence', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'WAITING_REVIEW_RESULT')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace, { status: 'stale' })
    writeUserAcceptance(workspace)

    const before = readStateText(workspace)
    const result = await runPbeCli(['accept', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain('EVIDENCE_STALE')
    expect(after).toBe(before)
  })

  it('allows execution complete when evidence timestamp is missing under execution warning policy', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'EXECUTION_IN_PROGRESS')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)
    writeEvidenceTree(workspace, { omitTimestamp: true })

    const result = await runPbeCli(['execution', 'complete', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('ACEP_RUN_DONE')
    expect(state.deliveryStatus).toBe('verified')
  })

  it('does not mutate state when review submit finds timestamp-missing evidence', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'ACEP_RUN_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace, { omitTimestamp: true })

    const before = readStateText(workspace)
    const result = await runPbeCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'EVIDENCE_TIMESTAMP_MISSING',
    )
    expect(after).toBe(before)
  })

  it('does not mutate state when accept finds timestamp-missing evidence', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'WAITING_REVIEW_RESULT')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace, { omitTimestamp: true })
    writeUserAcceptance(workspace)

    const before = readStateText(workspace)
    const result = await runPbeCli(['accept', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'EVIDENCE_TIMESTAMP_MISSING',
    )
    expect(after).toBe(before)
  })

  it('does not mutate state when review submit finds superseded evidence', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'ACEP_RUN_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace, { status: 'superseded' })

    const before = readStateText(workspace)
    const result = await runPbeCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'EVIDENCE_SUPERSEDED',
    )
    expect(after).toBe(before)
  })

  it('does not mutate state when accept finds superseded evidence', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'WAITING_REVIEW_RESULT')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace, { status: 'superseded' })
    writeUserAcceptance(workspace)

    const before = readStateText(workspace)
    const result = await runPbeCli(['accept', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'EVIDENCE_SUPERSEDED',
    )
    expect(after).toBe(before)
  })

  it('transitions WPD through CLI and records state history', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'UI_UX_APPROVED')
    writeWorkTree(workspace)

    const result = await runPbeCli(['wpd', 'close', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('WPD_DONE')
    expect(state.autoflow.completedSteps).toContain('wpd')
    expect(state.autoflow.currentGate).toBeNull()
    expect(state.autoflow.nextStep).toBe('vd')
    expectLastTransition(state, {
      from: 'UI_UX_APPROVED',
      to: 'WPD_DONE',
      command: 'wpd close',
    })
  })

  it('transitions VD and opens implementation scope gate', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'WPD_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)

    const result = await runPbeCli(['vd', 'close', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('VD_DONE')
    expect(state.autoflow.completedSteps).toContain('vd')
    expect(state.autoflow.currentGate).toBe('implementation_scope')
    expect(state.autoflow.nextStep).toBe('implementation_scope')
    expectLastTransition(state, {
      from: 'WPD_DONE',
      to: 'VD_DONE',
      command: 'vd close',
    })
  })

  it('does not mutate state when VD close runs from the wrong state', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'SCOPE_SELECTED')
    writeWorkTree(workspace)
    writeTestTree(workspace)

    const before = readStateText(workspace)
    const result = await runPbeCli(['vd', 'close', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'INVALID_TRANSITION',
    )
    expect(after).toBe(before)
  })

  it('transitions implementation scope selection through the CLI', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'VD_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)

    const result = await runPbeCli(['scope', 'select', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('SCOPE_SELECTED')
    expect(state.autoflow.completedSteps).toContain('implementation_scope')
    expect(state.autoflow.currentGate).toBeNull()
    expect(state.autoflow.nextStep).toBe('generate_acep')
    expect(state.autoflow.stateHistory.map((entry: { to: string }) => entry.to)).toEqual([
      'WAITING_IMPLEMENTATION_SCOPE',
      'SCOPE_SELECTED',
    ])
    expectLastTransition(state, {
      from: 'WAITING_IMPLEMENTATION_SCOPE',
      to: 'SCOPE_SELECTED',
      command: 'scope select',
      actor: 'user',
    })
  })

  it('does not mutate state when scope select runs from the wrong state', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'RPD_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)

    const before = readStateText(workspace)
    const result = await runPbeCli(['scope', 'select', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'INVALID_TRANSITION',
    )
    expect(after).toBe(before)
  })

  it('runs deterministic transition commands through review submit', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'VD_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeDependencyImpactAudit(workspace)
    writeExecutionStrategy(workspace)
    writeCoverageAudit(workspace)
    writeUxAudit(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)
    writeEvidenceTree(workspace)

    const scope = await runPbeCli(['scope', 'select', '--json'], { cwd: workspace, pluginRoot })
    const dependency = await runPbeCli(['dependency', 'audit', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const plan = await runPbeCli(['plan', 'execution', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const coverage = await runPbeCli(['coverage', 'audit', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const ux = await runPbeCli(['ux', 'audit', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const acep = await runPbeCli(['acep', 'ready', '--json'], { cwd: workspace, pluginRoot })
    const executionStart = await runPbeCli(['execution', 'start', '--json'], { cwd: workspace, pluginRoot })
    const execution = await runPbeCli(['execution', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const review = await runPbeCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })

    expect(scope.exitCode).toBe(ExitCode.Success)
    expect(dependency.exitCode).toBe(ExitCode.Success)
    expect(plan.exitCode).toBe(ExitCode.Success)
    expect(coverage.exitCode).toBe(ExitCode.Success)
    expect(ux.exitCode).toBe(ExitCode.Success)
    expect(acep.exitCode).toBe(ExitCode.Success)
    expect(executionStart.exitCode).toBe(ExitCode.Success)
    expect(execution.exitCode).toBe(ExitCode.Success)
    expect(review.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('WAITING_REVIEW_RESULT')
    expect(state.deliveryStatus).toBe('submitted_for_review')
    expect(state.autoflow.stateHistory.map((entry: { to: string }) => entry.to)).toEqual([
      'WAITING_IMPLEMENTATION_SCOPE',
      'SCOPE_SELECTED',
      'ACEP_READY',
      'EXECUTION_IN_PROGRESS',
      'ACEP_RUN_DONE',
      'WAITING_REVIEW_RESULT',
    ])
  })

  it('transitions ACEP ready through the CLI', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'SCOPE_SELECTED', {
      completedSteps: [
        'start',
        'rpd',
        'wpd',
        'vd',
        'implementation_scope',
        'dependency_impact_audit',
        'plan_execution',
        'coverage_audit',
        'ux_audit',
      ],
      nextStep: 'generate_acep',
    })
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)

    const result = await runPbeCli(['acep', 'ready', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('ACEP_READY')
    expect(state.autoflow.completedSteps).toContain('generate_acep')
    expect(state.autoflow.currentGate).toBeNull()
    expect(state.autoflow.nextStep).toBe('run_acep')
    expectLastTransition(state, {
      from: 'SCOPE_SELECTED',
      to: 'ACEP_READY',
      command: 'acep ready',
    })
  })

  it('transitions ACEP execution start through the CLI', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'ACEP_READY')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)

    const result = await runPbeCli(['execution', 'start', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('EXECUTION_IN_PROGRESS')
    expect(state.autoflow.completedSteps).toContain('execution_start')
    expect(state.autoflow.currentGate).toBeNull()
    expect(state.autoflow.nextStep).toBe('run_acep')
    expectLastTransition(state, {
      from: 'ACEP_READY',
      to: 'EXECUTION_IN_PROGRESS',
      command: 'execution start',
    })
  })

  it('does not mutate state when execution start runs from the wrong state', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'SCOPE_SELECTED')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)

    const before = readStateText(workspace)
    const result = await runPbeCli(['execution', 'start', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'INVALID_TRANSITION',
    )
    expect(after).toBe(before)
  })

  it('transitions execution complete only from EXECUTION_IN_PROGRESS', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'EXECUTION_IN_PROGRESS')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)
    writeEvidenceTree(workspace)

    const result = await runPbeCli(['execution', 'complete', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('ACEP_RUN_DONE')
    expect(state.deliveryStatus).toBe('verified')
    expect(state.autoflow.completedSteps).toContain('run_acep')
    expectLastTransition(state, {
      from: 'EXECUTION_IN_PROGRESS',
      to: 'ACEP_RUN_DONE',
      command: 'execution complete',
    })
  })

  it('rejects the direct ACEP_READY to ACEP_RUN_DONE execution shortcut', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'ACEP_READY')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)
    writeEvidenceTree(workspace)

    const before = readStateText(workspace)
    const result = await runPbeCli(['execution', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'INVALID_TRANSITION',
    )
    expect(after).toBe(before)
  })

  it('does not mutate state when execution complete lacks required evidence', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'EXECUTION_IN_PROGRESS')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)

    const before = readStateText(workspace)
    const result = await runPbeCli(['execution', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'EVIDENCE_TREE_MISSING',
    )
    expect(after).toBe(before)
  })

  it('stage-aware execution traceability requires Test to Evidence links but not evidence file existence', async () => {
    const missingEvidenceWorkspace = createWorkspace()
    writeExecutableProduct(missingEvidenceWorkspace)
    writeWorkTree(missingEvidenceWorkspace)
    writeTestTree(missingEvidenceWorkspace)
    const missingEvidence = await runPbeCli(['trace', 'check', '--stage', 'execution', '--json'], {
      cwd: missingEvidenceWorkspace,
      pluginRoot,
    })

    expect(missingEvidence.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(missingEvidence.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'TEST_EVIDENCE_LINK_MISSING',
    )

    const missingFileWorkspace = createWorkspace()
    writeExecutableProduct(missingFileWorkspace)
    writeWorkTree(missingFileWorkspace)
    writeTestTree(missingFileWorkspace)
    writeEvidenceTree(missingFileWorkspace, { path: '.pbe/evidence/test-results/missing.log' })
    const trace = await runPbeCli(['trace', 'check', '--stage', 'execution', '--json'], {
      cwd: missingFileWorkspace,
      pluginRoot,
    })
    const evidence = await runPbeCli(['evidence', 'check', '--json'], { cwd: missingFileWorkspace, pluginRoot })

    expect(trace.exitCode).toBe(ExitCode.Success)
    expect(evidence.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(evidence.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'EVIDENCE_FILE_MISSING',
    )
  })

  it('does not mutate state when ACEP ready runs from the wrong state', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'ACEP_RUN_DONE', {
      completedSteps: [
        'start',
        'rpd',
        'wpd',
        'vd',
        'implementation_scope',
        'dependency_impact_audit',
        'plan_execution',
        'coverage_audit',
        'ux_audit',
      ],
    })
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)

    const before = readStateText(workspace)
    const result = await runPbeCli(['acep', 'ready', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'INVALID_TRANSITION',
    )
    expect(after).toBe(before)
  })

  it('records pre-ACEP checkpoints without changing top-level state', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'SCOPE_SELECTED', {
      completedSteps: ['start', 'rpd', 'wpd', 'vd', 'implementation_scope'],
      nextStep: 'dependency_impact_audit',
    })
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeDependencyImpactAudit(workspace)
    writeExecutionStrategy(workspace)
    writeCoverageAudit(workspace)
    writeUxAudit(workspace)

    const dependency = await runPbeCli(['dependency', 'audit', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const plan = await runPbeCli(['plan', 'execution', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const coverage = await runPbeCli(['coverage', 'audit', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const ux = await runPbeCli(['ux', 'audit', 'complete', '--json'], { cwd: workspace, pluginRoot })

    expect(dependency.exitCode).toBe(ExitCode.Success)
    expect(plan.exitCode).toBe(ExitCode.Success)
    expect(coverage.exitCode).toBe(ExitCode.Success)
    expect(ux.exitCode).toBe(ExitCode.Success)

    const state = readState(workspace)
    expect(state.autoflow.state).toBe('SCOPE_SELECTED')
    expect(state.autoflow.nextStep).toBe('generate_acep')
    expect(state.autoflow.completedSteps).toEqual(
      expect.arrayContaining(['dependency_impact_audit', 'plan_execution', 'coverage_audit', 'ux_audit']),
    )
    expect(state.autoflow.stateHistory).toEqual([])
  })

  it('blocks ACEP ready until pre-ACEP checkpoints are completed', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'SCOPE_SELECTED', {
      completedSteps: ['start', 'rpd', 'wpd', 'vd', 'implementation_scope'],
      nextStep: 'generate_acep',
    })
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)

    const before = JSON.stringify(readState(workspace))
    const result = await runPbeCli(['acep', 'ready', '--json'], { cwd: workspace, pluginRoot })
    const after = JSON.stringify(readState(workspace))

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const codes = JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)
    expect(codes).toContain('CHECKPOINT_STEP_MISSING')
    expect(after).toBe(before)
  })

  it('does not mutate state when a checkpoint artifact is missing', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'SCOPE_SELECTED', {
      completedSteps: ['start', 'rpd', 'wpd', 'vd', 'implementation_scope'],
      nextStep: 'dependency_impact_audit',
    })
    writeWorkTree(workspace)
    writeTestTree(workspace)

    const before = JSON.stringify(readState(workspace))
    const result = await runPbeCli(['dependency', 'audit', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const after = JSON.stringify(readState(workspace))

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'CHECKPOINT_ARTIFACT_MISSING',
    )
    expect(after).toBe(before)
  })

  it('does not mutate state when a transition command fails validation', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'WPD_DONE')

    const before = JSON.stringify(readState(workspace))
    const result = await runPbeCli(['vd', 'close', '--json'], { cwd: workspace, pluginRoot })
    const after = JSON.stringify(readState(workspace))

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(after).toBe(before)
  })

  it('blocks invalid transition and leaves state untouched', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'ACEP_READY')
    writeWorkTree(workspace)

    const before = JSON.stringify(readState(workspace))
    const result = await runPbeCli(['wpd', 'close', '--json'], { cwd: workspace, pluginRoot })
    const after = JSON.stringify(readState(workspace))

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'INVALID_TRANSITION',
    )
    expect(after).toBe(before)
  })

  it('does not mutate state on transition helper invalid JSON or unknown state failures', async () => {
    const invalidJsonWorkspace = createWorkspace()
    writeText(join(invalidJsonWorkspace, '.pbe', 'blueprint', 'pbe-state.json'), '{ invalid json')
    const invalidJsonBefore = readStateText(invalidJsonWorkspace)
    const invalidJsonResult = await transitionPbeState(invalidJsonWorkspace, 'test transition', [PBE_STATE.RPD_DONE], {
      nextStep: 'wpd',
    })
    expect(invalidJsonResult.exitCode).toBe(ExitCode.SchemaError)
    expect(readStateText(invalidJsonWorkspace)).toBe(invalidJsonBefore)

    const unknownStateWorkspace = createWorkspace()
    writePbeState(unknownStateWorkspace, 'UNKNOWN_STATE')
    const unknownStateBefore = readStateText(unknownStateWorkspace)
    const unknownStateResult = await transitionPbeState(
      unknownStateWorkspace,
      'test transition',
      [PBE_STATE.RPD_DONE],
      { nextStep: 'wpd' },
    )
    expect(unknownStateResult.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(readStateText(unknownStateWorkspace)).toBe(unknownStateBefore)
  })

  it('does not mutate state on checkpoint helper blocked state failures', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'VD_DONE')

    const before = readStateText(workspace)
    const result = await checkpointPbeState(workspace, 'test checkpoint', [PBE_STATE.SCOPE_SELECTED], {
      completedSteps: ['dependency_impact_audit'],
      nextStep: 'plan_execution',
    })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(result.issues.map((entry) => entry.code)).toContain('CHECKPOINT_STATE_BLOCKED')
    expect(after).toBe(before)
  })

  it('blocks transition commands when state history is inconsistent', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'WPD_DONE', {
      stateHistory: [{ from: 'INIT', to: 'RPD_DONE', command: 'rpd close', at: '2026-01-01T00:00:00.000Z' }],
    })
    writeWorkTree(workspace)
    writeTestTree(workspace)

    const before = JSON.stringify(readState(workspace))
    const result = await runPbeCli(['vd', 'close', '--json'], { cwd: workspace, pluginRoot })
    const after = JSON.stringify(readState(workspace))

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'STATE_HISTORY_CURRENT_MISMATCH',
    )
    expect(after).toBe(before)
  })

  it('accepts only after explicit user acceptance metadata exists', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'WAITING_REVIEW_RESULT')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace)
    writeEmptyAcceptance(workspace)

    const blocked = await runPbeCli(['accept', '--json'], { cwd: workspace, pluginRoot })
    expect(blocked.exitCode).toBe(ExitCode.ValidationFailed)
    expect(readState(workspace).autoflow.state).toBe('WAITING_REVIEW_RESULT')

    writeUserAcceptance(workspace)
    const accepted = await runPbeCli(['accept', '--json'], { cwd: workspace, pluginRoot })

    expect(accepted.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('DONE')
    expect(state.deliveryStatus).toBe('accepted')
    expect(state.acceptance.setBy).toBe('user')
    expect(state.autoflow.stateHistory.map((entry: { to: string }) => entry.to)).toEqual(['ACCEPTED', 'DONE'])
    expectLastTransition(state, {
      from: 'ACCEPTED',
      to: 'DONE',
      command: 'accept',
      actor: 'user',
    })
  })

  it('does not accept with assistant-only acceptance metadata', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'WAITING_REVIEW_RESULT')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace)
    writeJson(join(workspace, '.pbe', 'control', 'acceptance-tree.json'), {
      version: '0.2.0-tree-control',
      branches: [
        {
          productNodeId: 'PT-1',
          status: 'accepted_done',
          decisionSource: {
            actor: 'assistant',
            source: 'inferred_by_codex',
          },
          evidenceNodeIds: ['EV-1'],
        },
      ],
    })

    const before = readStateText(workspace)
    const result = await runPbeCli(['accept', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toEqual(
      expect.arrayContaining(['ASSISTANT_ACCEPTED_STATUS', 'USER_APPROVAL_REQUIRED']),
    )
    expect(after).toBe(before)
  })

  it('does not accept before the review result gate', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'ACEP_RUN_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace)
    writeUserAcceptance(workspace)

    const before = readStateText(workspace)
    const result = await runPbeCli(['accept', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ACCEPT_STATE_BLOCKED',
    )
    expect(after).toBe(before)
  })

  it('does not submit review before ACEP run is done', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'EXECUTION_IN_PROGRESS')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace)

    const before = readStateText(workspace)
    const result = await runPbeCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'INVALID_TRANSITION',
    )
    expect(after).toBe(before)
  })

  it('stage-aware review traceability requires Evidence closure but not Acceptance closure', async () => {
    const missingEvidenceWorkspace = createWorkspace()
    writeExecutableProduct(missingEvidenceWorkspace)
    writeWorkTree(missingEvidenceWorkspace)
    writeTestTree(missingEvidenceWorkspace)
    const missingEvidence = await runPbeCli(['trace', 'check', '--stage', 'review', '--json'], {
      cwd: missingEvidenceWorkspace,
      pluginRoot,
    })

    expect(missingEvidence.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(missingEvidence.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'TEST_EVIDENCE_LINK_MISSING',
    )

    const noAcceptanceWorkspace = createWorkspace()
    writeExecutableProduct(noAcceptanceWorkspace)
    writeWorkTree(noAcceptanceWorkspace)
    writeTestTree(noAcceptanceWorkspace)
    writeEvidenceTree(noAcceptanceWorkspace)
    const noAcceptance = await runPbeCli(['trace', 'check', '--stage', 'review', '--json'], {
      cwd: noAcceptanceWorkspace,
      pluginRoot,
    })

    expect(noAcceptance.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(noAcceptance.stdout).ok).toBe(true)
  })

  it('stage-aware accept traceability requires user Acceptance closure', async () => {
    const missingAcceptanceWorkspace = createWorkspace()
    writeExecutableProduct(missingAcceptanceWorkspace)
    writeWorkTree(missingAcceptanceWorkspace)
    writeTestTree(missingAcceptanceWorkspace)
    writeEvidenceTree(missingAcceptanceWorkspace)
    writeEmptyAcceptance(missingAcceptanceWorkspace)
    const missingAcceptance = await runPbeCli(['trace', 'check', '--stage', 'accept', '--json'], {
      cwd: missingAcceptanceWorkspace,
      pluginRoot,
    })

    expect(missingAcceptance.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(missingAcceptance.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ACCEPTANCE_CLOSURE_MISSING',
    )

    const assistantAcceptanceWorkspace = createWorkspace()
    writeExecutableProduct(assistantAcceptanceWorkspace)
    writeWorkTree(assistantAcceptanceWorkspace)
    writeTestTree(assistantAcceptanceWorkspace)
    writeEvidenceTree(assistantAcceptanceWorkspace)
    writeJson(join(assistantAcceptanceWorkspace, '.pbe', 'control', 'acceptance-tree.json'), {
      version: '0.2.0-tree-control',
      branches: [
        {
          productNodeId: 'PT-1',
          status: 'accepted_done',
          decisionSource: {
            actor: 'assistant',
            source: 'inferred_by_codex',
          },
          evidenceNodeIds: ['EV-1'],
        },
      ],
    })
    const assistantAcceptance = await runPbeCli(['trace', 'check', '--stage', 'accept', '--json'], {
      cwd: assistantAcceptanceWorkspace,
      pluginRoot,
    })

    expect(assistantAcceptance.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(assistantAcceptance.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ACCEPTANCE_CLOSURE_MISSING',
    )

    const acceptedWorkspace = createWorkspace()
    writeExecutableProduct(acceptedWorkspace)
    writeWorkTree(acceptedWorkspace)
    writeTestTree(acceptedWorkspace)
    writeEvidenceTree(acceptedWorkspace)
    writeUserAcceptance(acceptedWorkspace)
    const accepted = await runPbeCli(['trace', 'check', '--stage', 'accept', '--json'], {
      cwd: acceptedWorkspace,
      pluginRoot,
    })

    expect(accepted.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(accepted.stdout).ok).toBe(true)
  })

  it('creates a Change node from user feedback', async () => {
    const workspace = createWorkspace()
    writeChangeTree(workspace)

    const result = await runPbeCli(
      ['change', 'create', '--summary', 'Collapse state must keep expand button visible', '--json'],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    const changeTree = readChangeTree(workspace)
    expect(payload.changeId).toBe('CH-001')
    expect(changeTree.changes[0]).toMatchObject({
      id: 'CH-001',
      type: 'feedback',
      source: 'user_feedback',
      summary: 'Collapse state must keep expand button visible',
      status: 'proposed',
      affectedProductNodeIds: [],
      affectedWorkNodeIds: [],
      affectedTestNodeIds: [],
      affectedEvidenceNodeIds: [],
      affectedAcceptanceNodeIds: [],
    })
  })

  it('does not mutate Change Tree when change create lacks summary', async () => {
    const workspace = createWorkspace()
    writeChangeTree(workspace)

    const before = readControlText(workspace, 'change-tree.json')
    const result = await runPbeCli(['change', 'create', '--json'], { cwd: workspace, pluginRoot })
    const after = readControlText(workspace, 'change-tree.json')

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'CHANGE_SUMMARY_MISSING',
    )
    expect(after).toBe(before)
  })

  it('creates an Impact node and marks the Change node impact_analyzed', async () => {
    const workspace = createWorkspace()
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Adjust collapse' }])
    writeImpactTree(workspace)

    const result = await runPbeCli(
      ['impact', 'analyze', '--change', 'CH-001', '--product', 'PT-1', '--work', 'WT-2', '--test', 'TT-3', '--json'],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const changeTree = readChangeTree(workspace)
    const impactTree = readImpactTree(workspace)
    expect(changeTree.changes[0].status).toBe('impact_analyzed')
    expect(impactTree.impacts[0]).toMatchObject({
      id: 'IM-001',
      changeNodeId: 'CH-001',
      changeId: 'CH-001',
      status: 'analyzed',
      affectedProductNodeIds: ['PT-1'],
      affectedWorkNodeIds: ['WT-2'],
      affectedTestNodeIds: ['TT-3'],
      impactType: 'requires_retest',
      requiredAction: 'retest',
    })
  })

  it('does not mutate control artifacts when impact analyze references a missing Change node', async () => {
    const workspace = createWorkspace()
    writeChangeTree(workspace)
    writeImpactTree(workspace)

    const beforeChange = readControlText(workspace, 'change-tree.json')
    const beforeImpact = readControlText(workspace, 'impact-tree.json')
    const result = await runPbeCli(['impact', 'analyze', '--change', 'CH-404', '--product', 'PT-1', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const afterChange = readControlText(workspace, 'change-tree.json')
    const afterImpact = readControlText(workspace, 'impact-tree.json')

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'IMPACT_CHANGE_NOT_FOUND',
    )
    expect(afterChange).toBe(beforeChange)
    expect(afterImpact).toBe(beforeImpact)
  })

  it('does not mutate control artifacts when impact analyze has no affected ids', async () => {
    const workspace = createWorkspace()
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Adjust collapse' }])
    writeImpactTree(workspace)

    const beforeChange = readControlText(workspace, 'change-tree.json')
    const beforeImpact = readControlText(workspace, 'impact-tree.json')
    const result = await runPbeCli(['impact', 'analyze', '--change', 'CH-001', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const afterChange = readControlText(workspace, 'change-tree.json')
    const afterImpact = readControlText(workspace, 'impact-tree.json')

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'IMPACT_AFFECTED_IDS_MISSING',
    )
    expect(afterChange).toBe(beforeChange)
    expect(afterImpact).toBe(beforeImpact)
  })

  it('proposes a Product Patch from an existing Change and Product node without changing Product Tree', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Search by email' }])

    const beforeProduct = readProductText(workspace)
    const result = await runPbeCli(
      [
        'product',
        'patch',
        'propose',
        '--change',
        'CH-001',
        '--product',
        'PT-1',
        '--operation',
        'update_acceptance_criteria',
        '--summary',
        'Search should include email',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(readProductText(workspace)).toBe(beforeProduct)
    const patchTree = readProductPatchTree(workspace)
    expect(patchTree.patches[0]).toMatchObject({
      id: 'PP-001',
      changeNodeId: 'CH-001',
      targetProductNodeId: 'PT-1',
      operation: 'update_acceptance_criteria',
      status: 'proposed',
      requiresUserConfirmation: true,
      userConfirmed: false,
      affectedProductNodeIds: ['PT-1'],
      afterProposal: {
        acceptance: ['Search should include email'],
      },
    })
  })

  it('does not propose a Product Patch for a missing Change node', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeChangeTree(workspace)

    const result = await runPbeCli(
      [
        'product',
        'patch',
        'propose',
        '--change',
        'CH-404',
        '--product',
        'PT-1',
        '--operation',
        'update_acceptance_criteria',
        '--summary',
        'Search should include email',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PRODUCT_PATCH_CHANGE_MISSING',
    )
  })

  it('does not propose a Product Patch for a missing Product node', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Search by email' }])

    const result = await runPbeCli(
      [
        'product',
        'patch',
        'propose',
        '--change',
        'CH-001',
        '--product',
        'PT-404',
        '--operation',
        'update_acceptance_criteria',
        '--summary',
        'Search should include email',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PRODUCT_PATCH_TARGET_MISSING',
    )
  })

  it('does not propose a Product Patch without an operation', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Search by email' }])

    const result = await runPbeCli(
      [
        'product',
        'patch',
        'propose',
        '--change',
        'CH-001',
        '--product',
        'PT-1',
        '--summary',
        'Search should include email',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PRODUCT_PATCH_OPERATION_REQUIRED',
    )
  })

  it('does not propose a Product Patch without a summary', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Search by email' }])

    const result = await runPbeCli(
      [
        'product',
        'patch',
        'propose',
        '--change',
        'CH-001',
        '--product',
        'PT-1',
        '--operation',
        'update_acceptance_criteria',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PRODUCT_PATCH_SUMMARY_REQUIRED',
    )
  })

  it('does not apply a Product Patch without a patch id', async () => {
    const workspace = createWorkspace()

    const result = await runPbeCli(['product', 'patch', 'apply', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PRODUCT_PATCH_ID_REQUIRED',
    )
  })

  it('does not apply a Product Patch without user confirmation', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Search by email' }])
    await proposeProductPatch(workspace)

    const beforeProduct = readProductText(workspace)
    const beforePatch = readControlText(workspace, 'product-patch-tree.json')
    const result = await runPbeCli(['product', 'patch', 'apply', '--patch', 'PP-001', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PRODUCT_PATCH_CONFIRMATION_REQUIRED',
    )
    expect(readProductText(workspace)).toBe(beforeProduct)
    expect(readControlText(workspace, 'product-patch-tree.json')).toBe(beforePatch)
  })

  it('applies a confirmed Product Patch and marks it applied', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Search by email' }])
    await proposeProductPatch(workspace)
    confirmProductPatch(workspace, 'PP-001')

    const result = await runPbeCli(['product', 'patch', 'apply', '--patch', 'PP-001', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    const productTree = readProductTree(workspace)
    const node = productTree.nodes.find((entry: Record<string, any>) => entry.id === 'PT-1')
    expect(node.acceptance).toEqual(['Search should include email'])
    const patch = readProductPatchTree(workspace).patches[0]
    expect(patch.status).toBe('applied')
    expect(patch.appliedAt).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/))
    expect(JSON.parse(result.stdout).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PRODUCT_PATCH_DOWNSTREAM_REVALIDATION_REQUIRED',
    )
  })

  it('does not apply a Product Patch when beforeSnapshot is stale', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Search by email' }])
    await proposeProductPatch(workspace)
    confirmProductPatch(workspace, 'PP-001')
    mutateProductNode(workspace, 'PT-1', { title: 'Changed after proposal' })

    const beforeProduct = readProductText(workspace)
    const result = await runPbeCli(['product', 'patch', 'apply', '--patch', 'PP-001', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PRODUCT_PATCH_SNAPSHOT_MISMATCH',
    )
    expect(readProductText(workspace)).toBe(beforeProduct)
  })

  it('does not reapply an applied Product Patch', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Search by email' }])
    await proposeProductPatch(workspace)
    confirmProductPatch(workspace, 'PP-001')
    await runPbeCli(['product', 'patch', 'apply', '--patch', 'PP-001', '--json'], { cwd: workspace, pluginRoot })

    const result = await runPbeCli(['product', 'patch', 'apply', '--patch', 'PP-001', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PRODUCT_PATCH_ALREADY_APPLIED',
    )
  })

  it('Product Patch validator accepts a valid Product Patch Tree', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Search by email' }])
    writeProductPatchTree(workspace, [productPatchFixture(workspace)])

    const issues = await validateProductPatchTree(workspace)

    expect(issues).toEqual([])
  })

  it('Product Patch validator rejects an invalid Product Patch Tree', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Search by email' }])
    writeProductPatchTree(workspace, [{ ...productPatchFixture(workspace), operation: 'legacy_direct_edit' }])

    const issues = await validateProductPatchTree(workspace)

    expect(issues.map((entry) => entry.code)).toContain('PRODUCT_PATCH_OPERATION_INVALID')
  })

  it('Product Patch validator passes when Product Patch Tree is absent', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Search by email' }])

    const issues = await validateProductPatchTree(workspace)

    expect(issues).toEqual([])
  })

  it('pbe validate accepts a valid initialized Product Patch Tree', async () => {
    const workspace = createWorkspace()
    copyValidExample(workspace)
    writeProductPatchTree(workspace, [productPatchFixture(workspace)])

    const result = await runPbeCli(['validate', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
  })

  it('pbe validate rejects an invalid initialized Product Patch Tree', async () => {
    const workspace = createWorkspace()
    copyValidExample(workspace)
    writeProductPatchTree(workspace, [{ ...productPatchFixture(workspace), operation: 'legacy_direct_edit' }])

    const result = await runPbeCli(['validate', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PRODUCT_PATCH_OPERATION_INVALID',
    )
  })

  it('blocks revision start when the Change node has no Impact analysis', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'WAITING_REVIEW_RESULT')
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Adjust collapse' }])
    writeImpactTree(workspace)

    const beforeState = readStateText(workspace)
    const result = await runPbeCli(['revision', 'start', '--change', 'CH-001', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const afterState = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'REVISION_IMPACT_MISSING',
    )
    expect(afterState).toBe(beforeState)
  })

  it('does not mutate state, Evidence, or Acceptance when revision Impact has no affected ids', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'DONE', { deliveryStatus: 'accepted', completedSteps: ['complete'], nextStep: null })
    writeChangeTree(workspace, [
      { id: 'CH-001', type: 'feedback', status: 'impact_analyzed', summary: 'Adjust collapse' },
    ])
    writeImpactTree(workspace, [
      {
        id: 'IM-001',
        changeNodeId: 'CH-001',
        changeId: 'CH-001',
        status: 'analyzed',
        impactType: 'requires_retest',
        requiredAction: 'retest',
      },
    ])
    writeEvidenceTree(workspace)
    writeUserAcceptance(workspace)

    const beforeState = readStateText(workspace)
    const beforeEvidence = readEvidenceText(workspace)
    const beforeAcceptance = readControlText(workspace, 'acceptance-tree.json')
    const result = await runPbeCli(['revision', 'start', '--change', 'CH-001', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'REVISION_IMPACT_AFFECTED_IDS_MISSING',
    )
    expect(readStateText(workspace)).toBe(beforeState)
    expect(readEvidenceText(workspace)).toBe(beforeEvidence)
    expect(readControlText(workspace, 'acceptance-tree.json')).toBe(beforeAcceptance)
  })

  it('does not open revision state when affected Evidence Tree is invalid JSON', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'DONE', { deliveryStatus: 'accepted', completedSteps: ['complete'], nextStep: null })
    writeChangeTree(workspace, [
      { id: 'CH-001', type: 'feedback', status: 'impact_analyzed', summary: 'Adjust collapse' },
    ])
    writeImpactTree(workspace, [
      {
        id: 'IM-001',
        changeNodeId: 'CH-001',
        changeId: 'CH-001',
        status: 'analyzed',
        affectedEvidenceNodeIds: ['EV-1'],
      },
    ])
    writeText(join(workspace, '.pbe', 'evidence', 'evidence-tree.json'), '{ invalid json')
    writeUserAcceptance(workspace)

    const beforeState = readStateText(workspace)
    const beforeEvidence = readEvidenceText(workspace)
    const beforeAcceptance = readControlText(workspace, 'acceptance-tree.json')
    const result = await runPbeCli(['revision', 'start', '--change', 'CH-001', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'EVIDENCE_TREE_INVALID_JSON',
    )
    expect(readStateText(workspace)).toBe(beforeState)
    expect(readEvidenceText(workspace)).toBe(beforeEvidence)
    expect(readControlText(workspace, 'acceptance-tree.json')).toBe(beforeAcceptance)
  })

  it('does not open revision state or invalidate Evidence when affected Acceptance Tree is invalid JSON', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'DONE', { deliveryStatus: 'accepted', completedSteps: ['complete'], nextStep: null })
    writeChangeTree(workspace, [
      { id: 'CH-001', type: 'feedback', status: 'impact_analyzed', summary: 'Adjust collapse' },
    ])
    writeImpactTree(workspace, [
      {
        id: 'IM-001',
        changeNodeId: 'CH-001',
        changeId: 'CH-001',
        status: 'analyzed',
        affectedEvidenceNodeIds: ['EV-1'],
        affectedAcceptanceNodeIds: ['AB-1'],
      },
    ])
    writeEvidenceTree(workspace)
    writeText(join(workspace, '.pbe', 'control', 'acceptance-tree.json'), '{ invalid json')

    const beforeState = readStateText(workspace)
    const beforeEvidence = readEvidenceText(workspace)
    const beforeAcceptance = readControlText(workspace, 'acceptance-tree.json')
    const result = await runPbeCli(['revision', 'start', '--change', 'CH-001', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ACCEPTANCE_TREE_INVALID_JSON',
    )
    expect(readStateText(workspace)).toBe(beforeState)
    expect(readEvidenceText(workspace)).toBe(beforeEvidence)
    expect(readControlText(workspace, 'acceptance-tree.json')).toBe(beforeAcceptance)
  })

  it('starts revision from accepted/done state, records activeRevision, and invalidates affected proof', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace)
    writeUserAcceptance(workspace)
    writePbeState(workspace, 'DONE', { deliveryStatus: 'accepted', completedSteps: ['complete'], nextStep: null })
    writeChangeTree(workspace, [
      { id: 'CH-001', type: 'feedback', status: 'impact_analyzed', summary: 'Adjust collapse' },
    ])
    writeImpactTree(workspace, [
      {
        id: 'IM-001',
        changeNodeId: 'CH-001',
        changeId: 'CH-001',
        status: 'analyzed',
        affectedProductNodeIds: ['PT-1'],
        affectedWorkNodeIds: ['WT-1'],
        affectedTestNodeIds: ['TT-1'],
        affectedEvidenceNodeIds: ['EV-1'],
        affectedAcceptanceNodeIds: ['AB-1'],
        affectedNodeId: 'PT-1',
        impactType: 'requires_retest',
        requiredAction: 'retest',
      },
    ])

    const result = await runPbeCli(['revision', 'start', '--change', 'CH-001', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('REVISION_REQUESTED')
    expect(state.deliveryStatus).toBe('revision_requested')
    expectLastTransition(state, {
      from: 'DONE',
      to: 'REVISION_REQUESTED',
      command: 'revision start',
    })
    expect(state.activeRevision).toMatchObject({
      changeNodeId: 'CH-001',
      impactNodeIds: ['IM-001'],
      affectedProductNodeIds: ['PT-1'],
      affectedWorkNodeIds: ['WT-1'],
      affectedTestNodeIds: ['TT-1'],
      affectedEvidenceNodeIds: ['EV-1'],
      affectedAcceptanceNodeIds: ['AB-1'],
      status: 'in_progress',
    })
    expect(state.activeRevision.startedAt).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/))

    const evidence = readEvidenceTree(workspace).evidence[0]
    expect(evidence).toMatchObject({
      id: 'EV-1',
      previousStatus: 'current',
      status: 'invalidated',
      invalidatedByChangeNodeId: 'CH-001',
      invalidatedByRevisionChangeNodeId: 'CH-001',
    })
    expect(evidence.invalidatedAt).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/))

    const acceptance = readAcceptanceTree(workspace).branches[0]
    expect(acceptance).toMatchObject({
      id: 'AB-1',
      previousStatus: 'accepted_done',
      status: 'invalidated',
      requiresReacceptance: true,
      invalidatedByChangeNodeId: 'CH-001',
      invalidatedByRevisionChangeNodeId: 'CH-001',
    })
    expect(acceptance.invalidatedAt).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/))

    const evidenceIssues = await validateEvidence(workspace, { stage: 'review', requireVisualAudit: false })
    expect(evidenceIssues.map((entry) => entry.code)).toContain('EVIDENCE_NOT_CURRENT')
  })

  it('blocks revision complete when activeRevision is missing and leaves artifacts unchanged', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'REVISION_REQUESTED')
    writeChangeTree(workspace, [
      { id: 'CH-001', type: 'feedback', status: 'impact_analyzed', summary: 'Adjust collapse' },
    ])
    writeImpactTree(workspace, [
      {
        id: 'IM-001',
        changeNodeId: 'CH-001',
        changeId: 'CH-001',
        status: 'analyzed',
        affectedWorkNodeIds: ['WT-1'],
      },
    ])
    writeEvidenceTree(workspace)
    writeUserAcceptance(workspace)

    const beforeState = readStateText(workspace)
    const beforeEvidence = readEvidenceText(workspace)
    const beforeAcceptance = readControlText(workspace, 'acceptance-tree.json')
    const result = await runPbeCli(['revision', 'complete', '--change', 'CH-001', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'REVISION_CONTEXT_MISSING',
    )
    expect(readStateText(workspace)).toBe(beforeState)
    expect(readEvidenceText(workspace)).toBe(beforeEvidence)
    expect(readControlText(workspace, 'acceptance-tree.json')).toBe(beforeAcceptance)
  })

  it('blocks revision complete when command change id differs from activeRevision', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'REVISION_REQUESTED', {
      activeRevision: {
        changeNodeId: 'CH-001',
        impactNodeIds: ['IM-001'],
        affectedWorkNodeIds: ['WT-1'],
        status: 'in_progress',
      },
    })
    writeChangeTree(workspace, [
      { id: 'CH-001', type: 'feedback', status: 'impact_analyzed', summary: 'Adjust collapse' },
      { id: 'CH-002', type: 'feedback', status: 'impact_analyzed', summary: 'Adjust copy' },
    ])
    writeImpactTree(workspace, [
      {
        id: 'IM-002',
        changeNodeId: 'CH-002',
        changeId: 'CH-002',
        status: 'analyzed',
        affectedWorkNodeIds: ['WT-2'],
      },
    ])

    const beforeState = readStateText(workspace)
    const result = await runPbeCli(['revision', 'complete', '--change', 'CH-002', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'REVISION_CHANGE_MISMATCH',
    )
    expect(readStateText(workspace)).toBe(beforeState)
  })

  it('completes revision by returning to WPD flow instead of DONE', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'REVISION_REQUESTED', {
      activeRevision: {
        changeNodeId: 'CH-001',
        impactNodeIds: ['IM-001'],
        affectedWorkNodeIds: ['WT-1'],
        startedAt: '2026-06-12T10:00:00.000Z',
        status: 'in_progress',
      },
    })
    writeChangeTree(workspace, [
      { id: 'CH-001', type: 'feedback', status: 'impact_analyzed', summary: 'Adjust collapse' },
    ])
    writeImpactTree(workspace, [
      {
        id: 'IM-001',
        changeNodeId: 'CH-001',
        changeId: 'CH-001',
        status: 'analyzed',
        affectedWorkNodeIds: ['WT-1'],
        affectedNodeId: 'WT-1',
        impactType: 'requires_retest',
        requiredAction: 'retest',
      },
    ])

    const result = await runPbeCli(['revision', 'complete', '--change', 'CH-001', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('WPD_IN_PROGRESS')
    expect(state.autoflow.nextStep).toBe('wpd')
    expect(state.deliveryStatus).not.toBe('accepted')
    expect(state.activeRevision).toBeUndefined()
    expect(state.revisionHistory.at(-1)).toMatchObject({
      changeNodeId: 'CH-001',
      impactNodeIds: ['IM-001'],
      affectedWorkNodeIds: ['WT-1'],
      status: 'completed',
    })
    expect(state.revisionHistory.at(-1).completedAt).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/))
    expectLastTransition(state, {
      from: 'REVISION_REQUESTED',
      to: 'WPD_IN_PROGRESS',
      command: 'revision complete',
    })
  })

  it('keeps original artifacts when a JSON artifact transaction cannot prepare every write', async () => {
    const workspace = createWorkspace()
    const firstPath = join(workspace, '.pbe', 'blueprint', 'transaction-first.json')
    const blockingPath = join(workspace, '.pbe', 'blueprint', 'not-a-directory')
    writeText(firstPath, '{\n  "value": "original"\n}\n')
    writeText(blockingPath, 'blocks child file writes')

    await expect(
      writeJsonArtifactTransaction([
        { filePath: firstPath, value: { value: 'next' } },
        { filePath: join(blockingPath, 'child.json'), value: { value: 'unreachable' } },
      ]),
    ).rejects.toThrow(/Artifact transaction failed/)

    expect(readFileSync(firstPath, 'utf8')).toBe('{\n  "value": "original"\n}\n')
    expect(readFileSync(blockingPath, 'utf8')).toBe('blocks child file writes')
  })

  it('review submit records visual audit transition for visual UI work', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'ACEP_RUN_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeVisualContractArtifacts(workspace, { requiredScreenshot: true })
    writeVisualScreenshotEvidence(workspace)
    writePassingVisualAudit(workspace)

    const result = await runPbeCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('WAITING_REVIEW_RESULT')
    expect(state.deliveryStatus).toBe('submitted_for_review')
    expect(state.autoflow.stateHistory.map((entry: { to: string }) => entry.to)).toEqual([
      'VISUAL_AUDIT_DONE',
      'WAITING_REVIEW_RESULT',
    ])
  })

  it('validate reports unknown state and broken state history', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'UNKNOWN_STATE', {
      stateHistory: [{ from: 'INIT', to: 'WPD_DONE', command: 'bad', at: '2026-01-01T00:00:00.000Z' }],
    })

    const result = await runPbeCli(['validate', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const codes = JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)
    expect(codes).toContain('UNKNOWN_STATE')
    expect(codes).toContain('STATE_HISTORY_INVALID_TRANSITION')
  })

  it('state validator accepts a known canonical state', async () => {
    const workspace = createWorkspace()
    writePbeState(workspace, 'RPD_DONE')

    const issues = await validateState(workspace)

    expect(issues).toEqual([])
  })
})

function readState(workspace: string): Record<string, any> {
  return JSON.parse(readFileSync(join(workspace, '.pbe', 'blueprint', 'pbe-state.json'), 'utf8'))
}

function readStateText(workspace: string): string {
  return readFileSync(join(workspace, '.pbe', 'blueprint', 'pbe-state.json'), 'utf8')
}

function writeChangeTree(workspace: string, changes: Array<Record<string, any>> = []): void {
  writeJson(join(workspace, '.pbe', 'control', 'change-tree.json'), {
    version: '0.2.0-tree-control',
    schemaVersion: 1,
    changes,
  })
}

function writeImpactTree(workspace: string, impacts: Array<Record<string, any>> = []): void {
  writeJson(join(workspace, '.pbe', 'control', 'impact-tree.json'), {
    version: '0.2.0-tree-control',
    impacts,
  })
}

function writeProductPatchTree(workspace: string, patches: Array<Record<string, any>> = []): void {
  writeJson(join(workspace, '.pbe', 'control', 'product-patch-tree.json'), {
    version: '0.2.0-tree-control',
    patches,
  })
}

function readChangeTree(workspace: string): Record<string, any> {
  return JSON.parse(readControlText(workspace, 'change-tree.json'))
}

function readImpactTree(workspace: string): Record<string, any> {
  return JSON.parse(readControlText(workspace, 'impact-tree.json'))
}

function readProductPatchTree(workspace: string): Record<string, any> {
  return JSON.parse(readControlText(workspace, 'product-patch-tree.json'))
}

function readProductTree(workspace: string): Record<string, any> {
  return JSON.parse(readProductText(workspace))
}

function readProductText(workspace: string): string {
  return readFileSync(join(workspace, '.pbe', 'tree', 'product-tree.json'), 'utf8')
}

function readEvidenceTree(workspace: string): Record<string, any> {
  return JSON.parse(readEvidenceText(workspace))
}

function readAcceptanceTree(workspace: string): Record<string, any> {
  return JSON.parse(readControlText(workspace, 'acceptance-tree.json'))
}

function readEvidenceText(workspace: string): string {
  return readFileSync(join(workspace, '.pbe', 'evidence', 'evidence-tree.json'), 'utf8')
}

function addWorkNodeFields(workspace: string, workId: string, fields: Record<string, unknown>): void {
  const workTreePath = join(workspace, '.pbe', 'tree', 'work-tree.json')
  const workTree = JSON.parse(readFileSync(workTreePath, 'utf8'))
  const node = workTree.nodes.find((entry: Record<string, unknown>) => entry.id === workId)
  Object.assign(node, fields)
  writeJson(workTreePath, workTree)
}

function initGitRepository(workspace: string): void {
  execFileSync('git', ['init'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'pbe@example.test'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'PBE Test'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['add', '.'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'baseline'], { cwd: workspace, stdio: 'ignore' })
}

function readControlText(workspace: string, fileName: string): string {
  return readFileSync(join(workspace, '.pbe', 'control', fileName), 'utf8')
}

async function proposeProductPatch(workspace: string): Promise<void> {
  const result = await runPbeCli(
    [
      'product',
      'patch',
      'propose',
      '--change',
      'CH-001',
      '--product',
      'PT-1',
      '--operation',
      'update_acceptance_criteria',
      '--summary',
      'Search should include email',
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
  expect(result.exitCode).toBe(ExitCode.Success)
}

function confirmProductPatch(workspace: string, patchId: string): void {
  const patchTree = readProductPatchTree(workspace)
  const patch = patchTree.patches.find((entry: Record<string, any>) => entry.id === patchId)
  patch.userConfirmed = true
  patch.confirmation = {
    actor: 'user',
    confirmedAt: '2026-06-12T00:00:00.000Z',
  }
  writeJson(join(workspace, '.pbe', 'control', 'product-patch-tree.json'), patchTree)
}

function productPatchFixture(workspace: string): Record<string, any> {
  const node = readProductTree(workspace).nodes.find((entry: Record<string, any>) => entry.id === 'PT-1')
  return {
    id: 'PP-001',
    changeNodeId: 'CH-001',
    targetProductNodeId: 'PT-1',
    operation: 'update_acceptance_criteria',
    status: 'proposed',
    requiresUserConfirmation: true,
    userConfirmed: false,
    beforeSnapshot: node,
    afterProposal: { acceptance: ['Search should include email'] },
    affectedProductNodeIds: ['PT-1'],
    createdAt: '2026-06-12T00:00:00.000Z',
    appliedAt: null,
  }
}

function mutateProductNode(workspace: string, productId: string, fields: Record<string, unknown>): void {
  const productTreePath = join(workspace, '.pbe', 'tree', 'product-tree.json')
  const productTree = JSON.parse(readFileSync(productTreePath, 'utf8'))
  const node = productTree.nodes.find((entry: Record<string, unknown>) => entry.id === productId)
  Object.assign(node, fields)
  writeJson(productTreePath, productTree)
}

function copyValidExample(workspace: string): void {
  cpSync(join(pluginRoot, 'examples', 'valid', 'todo-app-pbe-run', '.'), workspace, { recursive: true, force: true })
  for (const entry of ['.codex-plugin', 'skills', 'templates', 'schemas', 'docs']) {
    cpSync(join(pluginRoot, entry), join(workspace, entry), { recursive: true, force: true })
  }
  cpSync(join(pluginRoot, 'AGENTS.md'), join(workspace, 'AGENTS.md'), { force: true })
}

function mutateFirstAcceptanceCriterion(
  workspace: string,
  mutate: (criterion: Record<string, any>, productTree: Record<string, any>) => void,
): void {
  const productTreePath = join(workspace, '.pbe', 'tree', 'product-tree.json')
  const productTree = JSON.parse(readFileSync(productTreePath, 'utf8'))
  const node = productTree.nodes.find((entry: Record<string, any>) => entry.acceptanceCriteria?.length > 0)
  mutate(node.acceptanceCriteria[0], productTree)
  writeJson(productTreePath, productTree)
}

function expectLastTransition(
  state: Record<string, any>,
  expected: { from: string; to: string; command: string; actor?: string },
): void {
  const transition = state.autoflow.stateHistory.at(-1)
  expect(transition).toMatchObject(expected)
  expect(transition.at).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/))
}
