import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runPbeCli } from '../app'
import { ExitCode } from '../core/types'
import { writeExecutionManifest, writeFinalCoverage } from './fixtures/acep'
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
  it('prints help', async () => {
    const result = await runPbeCli(['--help'], { cwd: pluginRoot, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(result.stdout).toContain('Project Blueprint Engine CLI')
    expect(result.stdout).toContain('rpd close')
    expect(result.stdout).toContain('wpd close')
    expect(result.stdout).toContain('review submit')
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
    expect(JSON.parse(status.stdout).state).toBe('RPD_DONE')
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
    expect(state.autoflow.nextStep).toBe('visual_reference_intake')
    expect(state.autoflow.stateHistory.map((entry: { to: string }) => entry.to)).toEqual([
      'WAITING_UI_UX_CONFIRM',
      'UI_UX_APPROVED',
    ])
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

  it('accepts VD coverage when a Test node verifies the Work acceptance criteria', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeWorkTree(workspace)
    writeTestTree(workspace, { verifiesWork: false, verifiesAcceptanceCriteria: true })

    const result = await runPbeCli(['vd', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).ok).toBe(true)
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
    expect(state.autoflow.stateHistory.at(-1)).toMatchObject({
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
    expect(state.autoflow.currentGate).toBe('implementation_scope')
  })

  it('runs deterministic transition commands through review submit', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writePbeState(workspace, 'VD_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)
    writeEvidenceTree(workspace)

    const scope = await runPbeCli(['scope', 'select', '--json'], { cwd: workspace, pluginRoot })
    const acep = await runPbeCli(['acep', 'ready', '--json'], { cwd: workspace, pluginRoot })
    const execution = await runPbeCli(['execution', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const review = await runPbeCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })

    expect(scope.exitCode).toBe(ExitCode.Success)
    expect(acep.exitCode).toBe(ExitCode.Success)
    expect(execution.exitCode).toBe(ExitCode.Success)
    expect(review.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('WAITING_REVIEW_RESULT')
    expect(state.deliveryStatus).toBe('submitted_for_review')
    expect(state.autoflow.stateHistory.map((entry: { to: string }) => entry.to)).toEqual([
      'WAITING_IMPLEMENTATION_SCOPE',
      'SCOPE_SELECTED',
      'ACEP_READY',
      'ACEP_RUN_DONE',
      'WAITING_REVIEW_RESULT',
    ])
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
})

function readState(workspace: string): Record<string, any> {
  return JSON.parse(readFileSync(join(workspace, '.pbe', 'blueprint', 'pbe-state.json'), 'utf8'))
}
