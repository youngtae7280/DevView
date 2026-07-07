import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { writeJsonArtifactTransaction } from '../core/artifact-transaction'
import { recommendContext } from '../core/context-recommendation'
import { recommendProfile } from '../core/profile-recommendation'
import { canTransition, isDevViewState, normalizeDevViewState, DEVVIEW_STATE } from '../core/state-machine'
import { checkpointDevViewState, transitionDevViewState } from '../core/state-transition'
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
} from './fixtures/execution-pack'
import { writeEvidenceTree, writeVisualScreenshotEvidence } from './fixtures/evidence-tree'
import { writeEmptyAcceptance, writeDevViewState, writeUserAcceptance } from './fixtures/devview-state'
import {
  writeDecisionQueue,
  writeExecutableProduct,
  writeMinimalDevView,
  writeRequirementCompat,
} from './fixtures/product-tree'
import { writeTestTree } from './fixtures/test-tree'
import { cleanupWorkspaces, createWorkspace, writeJson, writeText } from './fixtures/workspace'
import { writePassingVisualAudit, writeVisualContractArtifacts } from './fixtures/visual'
import { writeWorkTree } from './fixtures/work-tree'

const pluginRoot = resolve(process.cwd())
const retiredWorkflowStateValues = [
  [82, 80, 68, 95, 68, 79, 78, 69],
  [87, 80, 68, 95, 68, 79, 78, 69],
  [86, 68, 95, 68, 79, 78, 69],
  [65, 67, 69, 80, 95, 82, 69, 65, 68, 89],
].map((codes) => String.fromCharCode(...codes))
const retiredWorkflowCommandAliases = [
  [114, 112, 100],
  [119, 112, 100],
  [118, 100],
  [97, 99, 101, 112],
].map((codes) => String.fromCharCode(...codes))

afterEach(() => {
  cleanupWorkspaces()
})

describe('DevView CLI', () => {
  it('recognizes canonical DevView states and transition helpers', () => {
    expect(isDevViewState(DEVVIEW_STATE.PRODUCT_INTAKE_DONE)).toBe(true)
    expect(isDevViewState('NOT_A_DEVVIEW_STATE')).toBe(false)
    expect(canTransition(DEVVIEW_STATE.PRODUCT_INTAKE_DONE, DEVVIEW_STATE.WORK_PLANNING_DONE)).toBe(true)
    expect(canTransition(DEVVIEW_STATE.SCOPE_SELECTED, DEVVIEW_STATE.WORK_PLANNING_DONE)).toBe(false)
    expect(canTransition(DEVVIEW_STATE.EXECUTION_PACK_READY, DEVVIEW_STATE.EXECUTION_PACK_RUN_DONE)).toBe(false)
    expect(canTransition(DEVVIEW_STATE.WAITING_REVIEW_RESULT, DEVVIEW_STATE.DONE)).toBe(false)
    expect(canTransition(DEVVIEW_STATE.WAITING_REVIEW_RESULT, DEVVIEW_STATE.ACCEPTED)).toBe(true)
    expect(canTransition(DEVVIEW_STATE.ACCEPTED, DEVVIEW_STATE.DONE)).toBe(true)
  })

  it('accepts only canonical DevView workflow states', () => {
    expect(normalizeDevViewState('PRODUCT_INTAKE_DONE')).toBe('PRODUCT_INTAKE_DONE')
    expect(normalizeDevViewState('WORK_PLANNING_DONE')).toBe('WORK_PLANNING_DONE')
    expect(normalizeDevViewState('VERIFICATION_DESIGN_DONE')).toBe('VERIFICATION_DESIGN_DONE')
    expect(normalizeDevViewState('EXECUTION_PACK_READY')).toBe('EXECUTION_PACK_READY')
    expect(normalizeDevViewState('EXECUTION_PACK_RUN_DONE')).toBe('EXECUTION_PACK_RUN_DONE')
    for (const retiredState of retiredWorkflowStateValues) {
      expect(normalizeDevViewState(retiredState)).toBeNull()
    }
  })

  it('prints help', async () => {
    const result = await runDevViewCli(['--help'], { cwd: pluginRoot, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(result.stdout).toContain('DevView CLI')
    expect(result.stdout).toContain('gate assess')
    expect(result.stdout).toContain('profile recommend')
    expect(result.stdout).toContain('context recommend')
    expect(result.stdout).toContain('context pack')
    expect(result.stdout).toContain('graph execution-contract report')
    expect(result.stdout).toContain('graph read-model generate-view-tree')
    expect(result.stdout).toContain('product-intake close')
    expect(result.stdout).toContain('work-planning close')
    expect(result.stdout).toContain('execution start')
    expect(result.stdout).toContain('review submit')
  })

  it('routes canonical workflow command groups while keeping validators authoritative', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'INIT')

    for (const args of [
      ['product-intake', 'check', '--json'],
      ['work-planning', 'check', '--json'],
      ['verification-design', 'check', '--json'],
      ['execution-pack', 'check', '--json'],
    ]) {
      const result = await runDevViewCli(args, { cwd: workspace, pluginRoot })
      const payload = JSON.parse(result.stdout || result.stderr)
      expect(payload.command).toBe(args.slice(0, 2).join(' '))
      expect(payload.message || '').not.toContain('Unknown command')
    }
  })

  it('rejects removed workflow command aliases', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'INIT')

    for (const command of retiredWorkflowCommandAliases) {
      const args = [command, 'check', '--json']
      const result = await runDevViewCli(args, { cwd: workspace, pluginRoot })
      expect(result.exitCode).toBe(ExitCode.InvalidArguments)
      const payload = JSON.parse(result.stderr)
      expect(payload.message).toContain('Unknown command')
    }
  })

  it('assesses Product to Work UI ambiguity and recommends a Human Gate', async () => {
    const result = await runDevViewCli(
      [
        'gate',
        'assess',
        '--text',
        'choices should be displayed',
        '--transition',
        'product-to-work',
        '--profile',
        'lite',
        '--json',
      ],
      { cwd: createWorkspace(), pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.requiresHumanGate).toBe(true)
    expect(payload.hardTriggers).toEqual(
      expect.arrayContaining(['user-facing-ui-choice', 'multiple-implementation-options']),
    )
    expect(payload.clarity.dimensions.implementationSpecificity).toBe(0)
    expect(payload.recommendedQuestion).toContain('Selection UI is unspecified')
    expect(payload.readOnly).toBe(true)
  })

  it('raises clarity when Product to Work implementation is specified', async () => {
    const ambiguous = await runDevViewCli(
      ['gate', 'assess', '--text', 'choices should be displayed', '--transition', 'product-to-work', '--json'],
      { cwd: createWorkspace(), pluginRoot },
    )
    const specified = await runDevViewCli(
      [
        'gate',
        'assess',
        '--text',
        'choices should be displayed as a Combobox with 2 to 3 options',
        '--transition',
        'product-to-work',
        '--profile',
        'lite',
        '--json',
      ],
      { cwd: createWorkspace(), pluginRoot },
    )

    expect(ambiguous.exitCode).toBe(ExitCode.Success)
    expect(specified.exitCode).toBe(ExitCode.Success)
    const ambiguousPayload = JSON.parse(ambiguous.stdout)
    const specifiedPayload = JSON.parse(specified.stdout)
    expect(specifiedPayload.clarity.dimensions.implementationSpecificity).toBe(2)
    expect(specifiedPayload.clarity.score).toBeGreaterThan(ambiguousPayload.clarity.score)
    expect(specifiedPayload.hardTriggers).not.toContain('user-facing-ui-choice')
    expect(specifiedPayload.hardTriggers).not.toContain('multiple-implementation-options')
    expect(specifiedPayload.requiresHumanGate).toBe(false)
    expect(specifiedPayload.recommendedQuestion).toBeNull()
  })

  it('omits the Recommended question section when Human Gate is not required', async () => {
    const result = await runDevViewCli(
      [
        'gate',
        'assess',
        '--text',
        'choices should be displayed as a Combobox with 2 to 3 options',
        '--transition',
        'product-to-work',
        '--profile',
        'lite',
      ],
      { cwd: createWorkspace(), pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(result.stdout).toContain('Requires Human Gate: no')
    expect(result.stdout).toContain('No Human Gate required.')
    expect(result.stdout).not.toContain('Recommended question:')
  })

  it('routes save/storage ambiguity to a storage question instead of a UI control question', async () => {
    const result = await runDevViewCli(
      [
        'gate',
        'assess',
        '--text',
        '\uC800\uC7A5 \uAE30\uB2A5\uC744 \uCD94\uAC00\uD574\uC918',
        '--transition',
        'product-to-work',
        '--profile',
        'lite',
        '--json',
      ],
      { cwd: createWorkspace(), pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.requiresHumanGate).toBe(true)
    expect(payload.hardTriggers).toContain('multiple-implementation-options')
    expect(payload.recommendedQuestion).toMatch(/localStorage|DB\/API|\uC800\uC7A5/)
    expect(payload.recommendedQuestion).not.toContain('Combobox')
    expect(payload.recommendedQuestion).not.toContain('\uCE74\uB4DC\uD615')
  })

  it('keeps storage implementation specified without a recommended question', async () => {
    const result = await runDevViewCli(
      [
        'gate',
        'assess',
        '--text',
        'localStorage\uC5D0 \uC790\uB3D9 \uC800\uC7A5\uB418\uAC8C \uD574\uC918',
        '--transition',
        'product-to-work',
        '--profile',
        'lite',
        '--json',
      ],
      { cwd: createWorkspace(), pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.requiresHumanGate).toBe(false)
    expect(payload.recommendedQuestion).toBeNull()
  })

  it('keeps specified UI controls without a recommended question', async () => {
    const result = await runDevViewCli(
      [
        'gate',
        'assess',
        '--text',
        '\uC120\uD0DD\uC9C0\uB294 \uBC84\uD2BC 3\uAC1C\uB85C \uD45C\uC2DC\uD55C\uB2E4',
        '--transition',
        'product-to-work',
        '--profile',
        'lite',
        '--json',
      ],
      { cwd: createWorkspace(), pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.requiresHumanGate).toBe(false)
    expect(payload.recommendedQuestion).toBeNull()
  })

  it('routes auth high-risk ambiguity to a scope and verification question', async () => {
    const result = await runDevViewCli(
      [
        'gate',
        'assess',
        '--text',
        '\uC778\uC99D \uB85C\uC9C1\uC744 \uACE0\uCCD0\uC918',
        '--transition',
        'work-scope',
        '--profile',
        'lite',
        '--json',
      ],
      { cwd: createWorkspace(), pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.requiresHumanGate).toBe(true)
    expect(payload.hardTriggers).toContain('high-risk-area')
    expect(payload.recommendedQuestion).toMatch(
      /\uC778\uC99D|\uBCF4\uC548|\uAD8C\uD55C|verification criteria|high-risk/,
    )
  })

  it('assesses subjective quality as requiring a Human Gate', async () => {
    const result = await runDevViewCli(
      [
        'gate',
        'assess',
        '--text',
        'make the UI clean and natural',
        '--transition',
        'product-tree',
        '--profile',
        'lite',
        '--json',
      ],
      { cwd: createWorkspace(), pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.requiresHumanGate).toBe(true)
    expect(payload.hardTriggers).toContain('subjective-quality')
    expect(payload.recommendedQuestion).toContain('quality target is subjective')
  })

  it('assesses restricted and high-risk file scope as requiring a Human Gate', async () => {
    const result = await runDevViewCli(
      [
        'gate',
        'assess',
        '--text',
        'update package.json and schema for auth migration',
        '--transition',
        'work-scope',
        '--profile',
        'lite',
        '--json',
      ],
      { cwd: createWorkspace(), pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.requiresHumanGate).toBe(true)
    expect(payload.hardTriggers).toEqual(expect.arrayContaining(['restricted-file-change', 'high-risk-area']))
    expect(payload.recommendedQuestion).toContain('high-risk area')
  })

  it('always requires a Human Gate for acceptance assessment', async () => {
    const result = await runDevViewCli(
      ['gate', 'assess', '--text', 'all tests passed', '--transition', 'acceptance', '--profile', 'lite', '--json'],
      { cwd: createWorkspace(), pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.requiresHumanGate).toBe(true)
    expect(payload.hardTriggers).toContain('final-acceptance')
    expect(payload.recommendedQuestion).toContain('Do you accept this result')
  })

  it('prints Human Gate assessment text output', async () => {
    const result = await runDevViewCli(
      [
        'gate',
        'assess',
        '--text',
        'choices should be displayed',
        '--transition',
        'product-to-work',
        '--profile',
        'lite',
      ],
      { cwd: createWorkspace(), pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(result.stdout).toContain('Human Gate Assessment')
    expect(result.stdout).toContain('Requires Human Gate: yes')
    expect(result.stdout).toContain('Recommended question:')
  })

  it('does not create .devview or mutate files when assessing Human Gate clarity', async () => {
    const workspace = createWorkspace()
    const readmePath = join(workspace, 'README.md')
    writeText(readmePath, 'Before assessment\n')
    const before = readFileSync(readmePath, 'utf8')

    const result = await runDevViewCli(
      ['gate', 'assess', '--text', 'choices should be displayed', '--transition', 'product-to-work'],
      { cwd: workspace, pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(existsSync(join(workspace, '.devview'))).toBe(false)
    expect(readFileSync(readmePath, 'utf8')).toBe(before)
  })

  it('recommends lite for docs-only briefs and files', async () => {
    const direct = recommendProfile({
      brief: 'Update docs/troubleshooting.md with npm.ps1 explanation',
      files: ['docs/troubleshooting.md', 'docs/install.md'],
    })
    const workspace = createWorkspace()

    const result = await runDevViewCli(
      [
        'profile',
        'recommend',
        '--brief',
        'Update docs/troubleshooting.md with npm.ps1 explanation',
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
    const result = await runDevViewCli(
      ['profile', 'recommend', '--brief', 'Can you explain how DevView works?', '--json'],
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
    ['Improve the admin page UI UX visual design polish', 'UI/UX or visual design signal detected'],
    ['Change the permission policy and DB schema', 'DB/schema change signal detected'],
  ])('recommends full for high-risk brief: %s', async (brief, expectedReason) => {
    const result = await runDevViewCli(['profile', 'recommend', '--brief', brief, '--json'], {
      cwd: createWorkspace(),
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.recommendedProfile).toBe('full')
    expect(payload.reasons).toContain(expectedReason)
  })

  it('recommends full when files include CLI, validator, schema, state, or fixture paths', async () => {
    const result = await runDevViewCli(
      [
        'profile',
        'recommend',
        '--brief',
        'Update CLI state handling.',
        '--files',
        'cli/src/commands/status.ts,schemas/devview-state.schema.json,examples/valid/todo-app-devview-run/README.md',
        '--json',
      ],
      { cwd: createWorkspace(), pluginRoot },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.recommendedProfile).toBe('full')
    expect(payload.reasons).toContain('high-risk file path: cli/src/commands/status.ts')
    expect(payload.reasons).toContain('high-risk file path: schemas/devview-state.schema.json')
  })

  it('fails profile recommendation when --brief is missing', async () => {
    const result = await runDevViewCli(['profile', 'recommend', '--json'], { cwd: createWorkspace(), pluginRoot })

    expect(result.exitCode).toBe(ExitCode.InvalidArguments)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues[0].code).toBe('PROFILE_BRIEF_REQUIRED')
    expect(payload.issues[0].message).toBe('Missing required option: --brief')
  })

  it('prints profile recommendation JSON and does not initialize DevView', async () => {
    const workspace = createWorkspace()

    const result = await runDevViewCli(['profile', 'recommend', '--brief', 'README update', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload).toMatchObject({
      recommendedProfile: 'lite',
      confidence: 'medium',
      suggestedInitCommand: 'devview init --profile lite --brief "README update"',
    })
    expect(payload.workflowDepth).toBe('compact')
    expect(payload.escalationTriggers).toContain('product meaning change')
    expect(payload.notes).toContain('This is a recommendation only. It does not initialize DevView.')
    expect(existsSync(join(workspace, '.devview'))).toBe(false)
  })

  it('keeps plugin repository validation on the strict repo path', async () => {
    const result = await runDevViewCli(['validate', '--json'], { cwd: pluginRoot, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    const legacyReport = payload.validators.find(
      (entry: { name: string }) => entry.name === 'DevView repository validator',
    )
    expect(legacyReport.output).toContain('Plugin structure')
    expect(legacyReport.output).toContain('Skills')
    expect(legacyReport.output).toContain('Templates')
    expect(legacyReport.output).toContain('Examples')
    expect(legacyReport.output).toContain('Compatibility core')
  })

  it('validates an external initialized project without requiring plugin README layout', async () => {
    const workspace = createWorkspace()
    writeExternalInitializedProject(workspace)

    const result = await runDevViewCli(['validate', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    const legacyReport = payload.validators.find(
      (entry: { name: string }) => entry.name === 'DevView repository validator',
    )
    expect(legacyReport.output).toContain('DevView public terminology and legacy layout')
    expect(legacyReport.output).toContain('Project compatibility core')
    expect(legacyReport.output).not.toContain('README_LAYOUT_TERM_MISSING')
    expect(legacyReport.output).not.toContain('Skills')
    expect(legacyReport.output).not.toContain('Examples')
  })

  it('keeps the external initialized project smoke fixture adoption-safe after fresh init', async () => {
    const workspace = createWorkspace()
    writeText(join(workspace, 'README.md'), '# External app\n\nOrdinary project README.\n')

    const init = await runDevViewCli(
      ['init', '--profile', 'lite', '--brief', 'Fresh external validation smoke', '--json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )

    expect(init.exitCode).toBe(ExitCode.Success)
    const visualProfile = JSON.parse(
      readFileSync(join(workspace, '.devview', 'control', 'visual-verification-profile.json'), 'utf8'),
    )
    expect(visualProfile.profiles).toEqual([])
    expect(visualProfile.contractChecks.every((check: { status: string }) => check.status === 'not_required')).toBe(
      true,
    )

    const result = await runDevViewCli(['validate', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    const legacyReport = payload.validators.find(
      (entry: { name: string }) => entry.name === 'DevView repository validator',
    )
    expect(legacyReport.output).not.toContain('README_LAYOUT_TERM_MISSING')
    expect(legacyReport.output).not.toContain('Skills')
    expect(legacyReport.output).not.toContain('Templates')
    expect(legacyReport.output).not.toContain('Examples')
    expect(payload.validators.find((entry: { name: string }) => entry.name === 'DevView legacy tree system').ok).toBe(
      true,
    )
    expect(JSON.stringify(payload)).not.toContain('visual profile VVP-001 references missing product node')
  })

  it('rejects a malformed present visual profile in an external initialized project smoke fixture', async () => {
    const workspace = createWorkspace()
    writeText(join(workspace, 'README.md'), '# External app\n\nOrdinary project README.\n')

    const init = await runDevViewCli(
      ['init', '--profile', 'lite', '--brief', 'Fresh external validation smoke', '--json'],
      {
        cwd: workspace,
        pluginRoot,
      },
    )

    expect(init.exitCode).toBe(ExitCode.Success)
    const visualProfilePath = join(workspace, '.devview', 'control', 'visual-verification-profile.json')
    const visualProfile = JSON.parse(readFileSync(visualProfilePath, 'utf8'))
    visualProfile.profiles = [
      {
        id: 'VVP-REGRESSION-INVALID',
        surfaceId: 'SURFACE-REGRESSION',
        title: 'Invalid present visual profile',
        applicability: 'required',
        productNodeIds: ['PT-MISSING'],
        projectNodeIds: [],
        workNodeIds: [],
        testNodeIds: [],
        evidenceNodeIds: [],
        checks: [],
      },
    ]
    writeJson(visualProfilePath, visualProfile)

    const result = await runDevViewCli(['validate', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.stringify(JSON.parse(result.stderr))).toContain(
      'visual profile VVP-REGRESSION-INVALID references missing product node: PT-MISSING',
    )
  })

  it('allows missing full execution pack in an external project when state does not require it', async () => {
    const workspace = createWorkspace()
    writeExternalInitializedProject(workspace)
    mkdirSync(join(workspace, storageRoot(workspace), 'codex-execution-pack'), { recursive: true })

    const result = await runDevViewCli(['validate', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
  })

  it('rejects an invalid present optional execution pack artifact in an external project', async () => {
    const workspace = createWorkspace()
    writeExternalInitializedProject(workspace)
    writeJson(join(workspace, storageRoot(workspace), 'codex-execution-pack', 'execution-manifest.json'), {
      phases: 'not-an-array',
      validationCommands: [],
      tasks: [],
    })

    const result = await runDevViewCli(['validate', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.stringify(JSON.parse(result.stderr))).toContain('EXECUTION_PACK_MANIFEST_FIELD_INVALID')
  })

  it('fails validation for an uninitialized non-plugin root', async () => {
    const workspace = createWorkspace()
    writeText(join(workspace, 'README.md'), '# External app\n\nThis project has not initialized DevView.\n')

    const result = await runDevViewCli(['validate', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.stringify(JSON.parse(result.stderr))).toContain('DEVVIEW_NOT_INITIALIZED')
  })

  it('recommends product intake context for explicit stage', async () => {
    const result = await runDevViewCli(['context', 'recommend', '--stage', 'product-intake', '--json'], {
      cwd: createWorkspace(),
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.detectedStage).toBe('product-intake')
    expect(payload.skills).toContain('devview-product-intake')
    expect(payload.readFirst).toContain('agent-context/product-intake.md')
    expect(payload.readOnlyIfNeeded).toContain('docs/ambiguity-taxonomy.md')
  })

  it('recommends verification design and Evidence context for explicit verification stage', async () => {
    const result = await runDevViewCli(['context', 'recommend', '--stage', 'verification-design', '--json'], {
      cwd: createWorkspace(),
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.detectedStage).toBe('verification-design')
    expect(payload.skills).toContain('devview-verification-design')
    expect(payload.readFirst).toContain('agent-context/verification-design.md')
    expect(payload.readFirst).toContain('agent-context/evidence.md')
  })

  it('recommends Review and Evidence context for explicit review stage', async () => {
    const result = await runDevViewCli(['context', 'recommend', '--stage', 'review', '--json'], {
      cwd: createWorkspace(),
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.detectedStage).toBe('review')
    expect(payload.skills).toContain('devview-review-result')
    expect(payload.readFirst).toContain('agent-context/review.md')
    expect(payload.readFirst).toContain('agent-context/evidence.md')
  })

  it('adds compact context and docs when profile is lite', async () => {
    const recommendation = recommendContext({ stage: 'verification-design', profile: 'lite' })

    expect(recommendation.readFirst).toContain('agent-context/lite.md')
    expect(recommendation.readOnlyIfNeeded).toContain('docs/lite-mode-policy.md')
    expect(recommendation.reasons).toContain('compact workflow depth adds guard guidance')
  })

  it('detects documentation context from troubleshooting npm brief', async () => {
    const result = await runDevViewCli(
      [
        'context',
        'recommend',
        '--brief',
        'docs/troubleshooting.md??npm.cmd ??�쎈�??�뷂??',
        '--profile',
        'lite',
        '--json',
      ],
      {
        cwd: createWorkspace(),
        pluginRoot,
      },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.detectedStage).toBe('documentation')
    expect(payload.profile).toBe('lite')
    expect(payload.skills).toContain('devview-run-execution-pack')
    expect(payload.readFirst.filter((entry: string) => entry === 'agent-context/lite.md')).toHaveLength(1)
    expect(payload.readFirst).toContain('agent-context/evidence.md')
    expect(payload.readOnlyIfNeeded).toContain('docs/troubleshooting.md')
    expect(payload.readOnlyIfNeeded).toContain('docs/install.md')
    expect(payload.readOnlyIfNeeded).toContain('docs/evidence-quality-rubric.md')
    expect(payload.doNotReadByDefault).toContain('docs/review-failure-recovery.md')
    expect(payload.doNotReadByDefault).toContain('docs/parallel-safety.md')
    expect(payload.doNotReadByDefault).toContain('docs/migration-policy.md')
    expect(payload.doNotReadByDefault).toContain('docs/complexity-governance.md')
  })

  it('detects documentation context from README maintenance brief', async () => {
    const result = await runDevViewCli(['context', 'recommend', '--brief', 'README maintenance', '--json'], {
      cwd: createWorkspace(),
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).detectedStage).toBe('documentation')
  })

  it('detects documentation context from install PowerShell npm brief', async () => {
    const result = await runDevViewCli(
      ['context', 'recommend', '--brief', '??�쎌???�몄�??PowerShell npm.ps1 ??�쎈�???�쎈�??�뷂??', '--json'],
      {
        cwd: createWorkspace(),
        pluginRoot,
      },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).detectedStage).toBe('documentation')
  })

  it('supports documentation and docs context stages', async () => {
    const documentation = await runDevViewCli(['context', 'recommend', '--stage', 'documentation', '--json'], {
      cwd: createWorkspace(),
      pluginRoot,
    })
    const docsAlias = await runDevViewCli(['context', 'recommend', '--stage', 'docs', '--json'], {
      cwd: createWorkspace(),
      pluginRoot,
    })

    expect(documentation.exitCode).toBe(ExitCode.Success)
    expect(docsAlias.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(documentation.stdout).detectedStage).toBe('documentation')
    expect(JSON.parse(docsAlias.stdout).detectedStage).toBe('documentation')
  })

  it('detects verification design context from verification design brief', async () => {
    const result = await runDevViewCli(
      ['context', 'recommend', '--brief', 'verification design test tree', '--profile', 'lite', '--json'],
      {
        cwd: createWorkspace(),
        pluginRoot,
      },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.detectedStage).toBe('verification-design')
    expect(payload.profile).toBe('lite')
    expect(payload.readFirst).toEqual([
      'agent-context/verification-design.md',
      'agent-context/evidence.md',
      'agent-context/lite.md',
    ])
    expect(payload.readOnlyIfNeeded).toContain('docs/evidence-quality-rubric.md')
    expect(payload.readOnlyIfNeeded).toContain('docs/evidence-quality-rubric.md')
    expect(payload.readOnlyIfNeeded).toContain('docs/lite-mode-policy.md')
    expect(payload.doNotReadByDefault).toContain('docs/review-failure-recovery.md')
    expect(payload.doNotReadByDefault).toContain('docs/parallel-safety.md')
    expect(payload.doNotReadByDefault).toContain('docs/migration-policy.md')
    expect(payload.reasons).toContain('brief appears to ask for verification design')
    expect(payload.notes).toContain('This command is read-only and does not modify DevView state.')
  })

  it('detects review context from rejection brief', async () => {
    const result = await runDevViewCli(
      ['context', 'recommend', '--brief', 'Review was rejected by user feedback', '--json'],
      {
        cwd: createWorkspace(),
        pluginRoot,
      },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.detectedStage).toBe('review')
    expect(payload.skills).toContain('devview-review-result')
    expect(payload.readFirst).toContain('agent-context/review.md')
  })

  it('detects product patch context from product meaning brief', async () => {
    const result = await runDevViewCli(
      ['context', 'recommend', '--brief', 'product patch acceptance criteria change', '--json'],
      {
        cwd: createWorkspace(),
        pluginRoot,
      },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.detectedStage).toBe('product-patch')
    expect(payload.readFirst).toContain('agent-context/product-patch.md')
    expect(payload.readOnlyIfNeeded).toContain('docs/product-patch-proposals.md')
  })

  it('detects parallel context from clean-dist conflict brief', async () => {
    const result = await runDevViewCli(['context', 'recommend', '--brief', '蹂묐??clean-dist conflict', '--json'], {
      cwd: createWorkspace(),
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.detectedStage).toBe('parallel')
    expect(payload.readFirst).toContain('agent-context/parallel.md')
  })

  it('fails context recommendation when both --brief and --stage are missing', async () => {
    const result = await runDevViewCli(['context', 'recommend', '--json'], { cwd: createWorkspace(), pluginRoot })

    expect(result.exitCode).toBe(ExitCode.InvalidArguments)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues[0].code).toBe('CONTEXT_INPUT_REQUIRED')
  })

  it('prints context recommendation JSON fields and text output', async () => {
    const jsonResult = await runDevViewCli(
      ['context', 'recommend', '--stage', 'verification-design', '--profile', 'lite', '--json'],
      {
        cwd: createWorkspace(),
        pluginRoot,
      },
    )
    const textResult = await runDevViewCli(
      ['context', 'recommend', '--stage', 'verification-design', '--profile', 'lite'],
      {
        cwd: createWorkspace(),
        pluginRoot,
      },
    )

    expect(jsonResult.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(jsonResult.stdout)
    expect(payload).toHaveProperty('skills')
    expect(payload).toHaveProperty('readFirst')
    expect(payload).toHaveProperty('readOnlyIfNeeded')
    expect(payload).toHaveProperty('doNotReadByDefault')
    expect(payload).toHaveProperty('reasons')
    expect(payload).toHaveProperty('notes')
    expect(textResult.stdout).toContain('Recommended context')
    expect(textResult.stdout).toContain('Read first:')
    expect(textResult.stdout).toContain('agent-context/verification-design.md')
  })

  it('does not create .devview or mutate state when recommending context', async () => {
    const emptyWorkspace = createWorkspace()
    const emptyResult = await runDevViewCli(['context', 'recommend', '--stage', 'start'], {
      cwd: emptyWorkspace,
      pluginRoot,
    })
    expect(emptyResult.exitCode).toBe(ExitCode.Success)
    expect(existsSync(join(emptyWorkspace, '.devview'))).toBe(false)

    const initializedWorkspace = createWorkspace()
    writeDevViewState(initializedWorkspace, 'PRODUCT_INTAKE_DONE')
    const beforeState = readStateText(initializedWorkspace)
    const initializedResult = await runDevViewCli(
      ['context', 'recommend', '--brief', 'verification design test tree'],
      {
        cwd: initializedWorkspace,
        pluginRoot,
      },
    )

    expect(initializedResult.exitCode).toBe(ExitCode.Success)
    expect(readStateText(initializedWorkspace)).toBe(beforeState)
  })

  it('prints a markdown context pack from readFirst files', async () => {
    const result = await runDevViewCli(
      ['context', 'pack', '--brief', 'docs/known-limits.md one line update', '--profile', 'lite'],
      {
        cwd: createWorkspace(),
        pluginRoot,
      },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(result.stdout).toContain('# DevView Context Pack')
    expect(result.stdout).toContain('## Recommendation Summary')
    expect(result.stdout).toContain('## Suggested Human Gate Assessment')
    expect(result.stdout).toContain('devview gate assess')
    expect(result.stdout).toContain('## Included Context')
    expect(result.stdout).toContain('## Read Only If Needed')
    expect(result.stdout).toContain('## Do Not Read By Default')
    expect(result.stdout).toContain('### agent-context/lite.md')
    expect(result.stdout).toContain('# Compact Depth Context')
  })

  it('prints context pack JSON with only readFirst files included', async () => {
    const result = await runDevViewCli(
      ['context', 'pack', '--brief', 'docs/known-limits.md one line update', '--profile', 'lite', '--json'],
      {
        cwd: createWorkspace(),
        pluginRoot,
      },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.artifactRole).toBe('devview-context-pack-preview')
    expect(payload.status).toBe('devview-context-pack-preview-generated')
    expect(payload.contextPackRole).toBe('bounded-subgraph-package-around-view-tree')
    expect(payload.sourceViewTreeArtifactRole).toBe('devview-view-tree-preview')
    expect(payload.contextPackGenerated).toBe(true)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(payload.runtimeEvidenceSatisfied).toBe(false)
    expect(payload.equivalenceProven).toBe(false)
    expect(payload.scopeEnforced).toBe(false)
    expect(payload.ciEnforcementEnabled).toBe(false)
    expect(payload.recommendation.detectedStage).toBe('documentation')
    expect(payload).toHaveProperty('includedFiles')
    expect(payload).toHaveProperty('suggestedGateAssessment')
    expect(payload).toHaveProperty('bundle')
    expect(payload.readOnly).toBe(true)
    expect(payload.suggestedGateAssessment.enabled).toBe(true)
    expect(payload.suggestedGateAssessment.transition).toBe('work-scope')
    expect(payload.suggestedGateAssessment.profile).toBe('lite')
    expect(payload.suggestedGateAssessment.command).toContain('devview gate assess')
    const includedPaths = payload.includedFiles.map((entry: { path: string }) => entry.path)
    expect(includedPaths).toEqual(payload.recommendation.readFirst)
    expect(includedPaths).toContain('agent-context/lite.md')
    expect(includedPaths).toContain('agent-context/evidence.md')
    expect(includedPaths).not.toContain('docs/lite-mode-policy.md')
    expect(includedPaths).not.toContain('docs/evidence-quality-rubric.md')
  })

  it('truncates context pack bundle with --max-chars and records a warning', async () => {
    const result = await runDevViewCli(
      ['context', 'pack', '--brief', 'verification design work', '--profile', 'lite', '--max-chars', '500', '--json'],
      {
        cwd: createWorkspace(),
        pluginRoot,
      },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.bundle.length).toBeLessThanOrEqual(500)
    expect(payload.warnings.some((entry: string) => entry.includes('bundle was truncated'))).toBe(true)
  })

  it('suggests a gate assessment command from context pack JSON when brief is provided', async () => {
    const brief = '\uC120\uD0DD\uC9C0\uAC00 \uD45C\uC2DC\uB418\uC5B4\uC57C \uD55C\uB2E4'
    const result = await runDevViewCli(['context', 'pack', '--brief', brief, '--profile', 'lite', '--json'], {
      cwd: createWorkspace(),
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.suggestedGateAssessment.enabled).toBe(true)
    expect(payload.suggestedGateAssessment.command).toContain('devview gate assess')
    expect(payload.suggestedGateAssessment.command).toContain(brief)
    expect(payload.suggestedGateAssessment.profile).toBe('lite')
    expect(payload.suggestedGateAssessment.transition).toBeTruthy()
  })

  it('maps documentation context pack gate assessment to work-scope', async () => {
    const result = await runDevViewCli(
      ['context', 'pack', '--brief', 'docs/known-limits.md wording update', '--profile', 'lite', '--json'],
      {
        cwd: createWorkspace(),
        pluginRoot,
      },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.recommendation.detectedStage).toBe('documentation')
    expect(payload.suggestedGateAssessment.enabled).toBe(true)
    expect(payload.suggestedGateAssessment.transition).toBe('work-scope')
  })

  it('maps verification design stage context pack gate assessment to work-to-test without brief command generation', async () => {
    const result = await runDevViewCli(
      ['context', 'pack', '--stage', 'verification-design', '--profile', 'lite', '--json'],
      {
        cwd: createWorkspace(),
        pluginRoot,
      },
    )

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.recommendation.detectedStage).toBe('verification-design')
    expect(payload.suggestedGateAssessment.enabled).toBe(false)
    expect(payload.suggestedGateAssessment.transition).toBe('work-to-test')
    expect(payload.suggestedGateAssessment.reason).toContain('No brief/text was provided')
  })

  it('does not create .devview, mutate state, or change git status when packing context', async () => {
    const emptyWorkspace = createWorkspace()
    const emptyResult = await runDevViewCli(['context', 'pack', '--stage', 'start'], {
      cwd: emptyWorkspace,
      pluginRoot,
    })
    expect(emptyResult.exitCode).toBe(ExitCode.Success)
    expect(existsSync(join(emptyWorkspace, '.devview'))).toBe(false)

    const initializedWorkspace = createWorkspace()
    writeDevViewState(initializedWorkspace, 'PRODUCT_INTAKE_DONE')
    const beforeState = readStateText(initializedWorkspace)
    const initializedResult = await runDevViewCli(['context', 'pack', '--brief', 'docs update'], {
      cwd: initializedWorkspace,
      pluginRoot,
    })
    expect(initializedResult.exitCode).toBe(ExitCode.Success)
    expect(readStateText(initializedWorkspace)).toBe(beforeState)

    const beforeGitStatus = execFileSync('git', ['status', '--short'], { cwd: pluginRoot, encoding: 'utf8' })
    const gitResult = await runDevViewCli(['context', 'pack', '--stage', 'verification-design'], {
      cwd: pluginRoot,
      pluginRoot,
    })
    const afterGitStatus = execFileSync('git', ['status', '--short'], { cwd: pluginRoot, encoding: 'utf8' })
    expect(gitResult.exitCode).toBe(ExitCode.Success)
    expect(afterGitStatus).toBe(beforeGitStatus)
  })

  it('keeps context pack recommendation consistent with context recommend', async () => {
    const args = ['--brief', 'docs/known-limits.md one line update', '--profile', 'lite', '--json']
    const recommend = await runDevViewCli(['context', 'recommend', ...args], {
      cwd: createWorkspace(),
      pluginRoot,
    })
    const pack = await runDevViewCli(['context', 'pack', ...args], {
      cwd: createWorkspace(),
      pluginRoot,
    })

    expect(recommend.exitCode).toBe(ExitCode.Success)
    expect(pack.exitCode).toBe(ExitCode.Success)
    const recommendPayload = JSON.parse(recommend.stdout)
    const packPayload = JSON.parse(pack.stdout)
    expect(packPayload.recommendation.detectedStage).toBe(recommendPayload.detectedStage)
    expect(packPayload.recommendation.readFirst).toEqual(recommendPayload.readFirst)
  })

  it('reports status as not initialized when DevView state is missing', async () => {
    const workspace = createWorkspace()

    const result = await runDevViewCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.NotInitialized)
    const payload = JSON.parse(result.stderr)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].code).toBe('DEVVIEW_NOT_INITIALIZED')
  })

  it('initializes DevView artifacts without overwriting existing files', async () => {
    const workspace = createWorkspace()

    const init = await runDevViewCli(['init', '--profile', 'full', '--brief', 'Build a printer setup flow', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const secondInit = await runDevViewCli(['init', '--profile', 'full', '--brief', 'Changed brief', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const status = await runDevViewCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(init.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(init.stdout).created).toContain('.devview/tree/product-tree.json')
    expect(secondInit.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(secondInit.stdout).skipped).toContain('.devview/tree/product-tree.json')
    expect(status.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(status.stdout).state).toBe('INIT')
  })

  it.each([
    ['INIT', 'devview product-intake close or devview product-intake check'],
    ['WORK_PLANNING_DONE', 'devview verification-design close'],
    ['EXECUTION_PACK_READY', 'devview execution start'],
    ['EXECUTION_IN_PROGRESS', 'devview execution complete'],
  ])('recommends the next status command for %s', async (state, expectedCommand) => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, state)

    const result = await runDevViewCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.state).toBe(state)
    expect(payload.recommendedNextCommand).toBe(expectedCommand)
  })

  it('points review result status to acceptance or change routing', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'WAITING_REVIEW_RESULT')

    const result = await runDevViewCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.recommendedNextCommand).toContain('devview accept')
    expect(payload.recommendedNextCommand).toContain('devview change create')
  })

  it('includes active revision and last transition in status JSON', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'REVISION_REQUESTED', {
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

    const result = await runDevViewCli(['status', '--json'], { cwd: workspace, pluginRoot })

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
    writeDevViewState(workspace, 'UNKNOWN_STATE')

    const result = await runDevViewCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.state).toBe('UNKNOWN_STATE')
    expect(payload.recommendedNextCommand).toBe('devview validate')
    expect(payload.blockingIssues.map((entry: { code: string }) => entry.code)).toContain('UNKNOWN_STATE')
    expect(payload.suggestedFixes[0]).toContain('devview validate')
  })

  it('keeps existing status JSON fields while adding navigator fields', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'WORK_PLANNING_DONE', {
      currentGate: 'work_planning',
      nextStep: 'verification_design',
      deliveryStatus: 'wpd_done',
    })

    const result = await runDevViewCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload).toMatchObject({
      initialized: true,
      profile: 'full',
      state: 'WORK_PLANNING_DONE',
      currentGate: 'work_planning',
      nextStep: 'verification_design',
      deliveryStatus: 'wpd_done',
      stateHistoryCount: 0,
      recommendedNextCommand: 'devview verification-design close',
    })
    expect(payload).toHaveProperty('openBlockingDecisions')
    expect(payload).toHaveProperty('artifacts')
    expect(payload).toHaveProperty('activeRevision')
    expect(payload).toHaveProperty('lastTransition')
    expect(payload).toHaveProperty('blockingIssues')
    expect(payload).toHaveProperty('suggestedFixes')
  })

  it('adds recommended context to lite verification design status JSON without changing the next command', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'VERIFICATION_DESIGN_IN_PROGRESS', { profile: 'lite' })
    const beforeState = readStateText(workspace)

    const result = await runDevViewCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.recommendedNextCommand).toBe('devview verification-design close')
    expect(payload.recommendedContext).toMatchObject({
      detectedStage: 'verification-design',
      profile: 'lite',
      skills: ['devview-verification-design'],
    })
    expect(payload.recommendedContext.readFirst).toContain('agent-context/verification-design.md')
    expect(payload.recommendedContext.readFirst).toContain('agent-context/evidence.md')
    expect(payload.recommendedContext.readFirst).toContain('agent-context/lite.md')
    expect(payload.recommendedContext.readOnlyIfNeeded).toContain('docs/evidence-quality-rubric.md')
    expect(payload.recommendedContext.readOnlyIfNeeded).toContain('docs/evidence-quality-rubric.md')
    expect(payload.recommendedContext.readOnlyIfNeeded).toContain('docs/lite-mode-policy.md')
    expect(readStateText(workspace)).toBe(beforeState)
  })

  it('shows a short recommended context section in status text output', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'VERIFICATION_DESIGN_IN_PROGRESS', { profile: 'lite' })

    const result = await runDevViewCli(['status'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(result.stdout).toContain('Recommended context:')
    expect(result.stdout).toContain('Read first: agent-context/verification-design.md')
    expect(result.stdout).toContain('agent-context/lite.md')
    expect(result.stdout).toContain('Full docs only if needed: docs/evidence-quality-rubric.md')
  })

  it('includes recommended context for full profile without adding the Lite card', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'VERIFICATION_DESIGN_IN_PROGRESS', { profile: 'full' })

    const result = await runDevViewCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.profileGuidance.profile).toBe('full')
    expect(payload.recommendedContext.detectedStage).toBe('verification-design')
    expect(payload.recommendedContext.profile).toBe('full')
    expect(payload.recommendedContext.readFirst).toContain('agent-context/verification-design.md')
    expect(payload.recommendedContext.readFirst).not.toContain('agent-context/lite.md')
  })

  it('keeps bypass status context minimal', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'VERIFICATION_DESIGN_IN_PROGRESS', { profile: 'bypass' })

    const result = await runDevViewCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.profileGuidance.profile).toBe('bypass')
    expect(payload.recommendedContext.detectedStage).toBe('verification-design')
    expect(payload.recommendedContext.profile).toBe('bypass')
    expect(payload.recommendedContext.skills).toEqual([])
    expect(payload.recommendedContext.readFirst).toEqual(['agent-context/start.md'])
  })

  it('shows compact guidance in status text output', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'WORK_PLANNING_DONE', { profile: 'lite' })

    const result = await runDevViewCli(['status'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(result.stdout).toContain('Profile: lite')
    expect(result.stdout).toContain('Recommended next command: devview verification-design close')
    expect(result.stdout).toContain('Compact workflow guidance:')
    expect(result.stdout).toContain('compact DevView guidance for a bounded low-risk slice')
    expect(result.stdout).toContain('Increase to full planning depth if product meaning change')
  })

  it('includes compact profile guidance in status JSON without changing next command', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'WORK_PLANNING_DONE', { profile: 'lite' })

    const result = await runDevViewCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const payload = JSON.parse(result.stdout)
    expect(payload.profile).toBe('lite')
    expect(payload.recommendedNextCommand).toBe('devview verification-design close')
    expect(payload.profileGuidance).toMatchObject({
      profile: 'lite',
      workflowDepth: 'compact',
      summary:
        'This run uses compact DevView guidance for a bounded low-risk slice. It is not a separate mode or a safety bypass.',
    })
    expect(payload.profileGuidance.mustKeepGuards).toContain('expectedFiles / File Change Guard')
    expect(payload.profileGuidance.mustKeepGuards).toContain('minimal Test/Evidence')
    expect(payload.profileGuidance.escalationTriggers).toContain('product meaning change')
    expect(payload.profileGuidance.escalationTriggers).toContain('Product Patch required')
    expect(payload.profileGuidance.limitations).toContain('No dedicated devview lite command')
  })

  it.each([
    ['full', 'Full-depth workflow guidance:'],
    ['bypass', 'No-tracking guidance:'],
  ] as const)('does not fail status for %s profile guidance', async (profile, expectedText) => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'INIT', { profile })

    const textResult = await runDevViewCli(['status'], { cwd: workspace, pluginRoot })
    const jsonResult = await runDevViewCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(textResult.exitCode).toBe(ExitCode.Success)
    expect(textResult.stdout).toContain(expectedText)
    expect(jsonResult.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(jsonResult.stdout).profileGuidance.profile).toBe(profile)
  })

  it('blocks work-planning gate before product intake can close', async () => {
    const workspace = createWorkspace()
    await runDevViewCli(['init', '--brief', 'Make the UI clean'], { cwd: workspace, pluginRoot })

    const result = await runDevViewCli(['gate', 'work-planning', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('ROOT_NOT_CONFIRMED_BY_USER')
  })

  it('rejects product intake close when selected Product has unresolved abstract quality terms', async () => {
    const workspace = createWorkspace()
    writeMinimalDevView(workspace, {
      productTitle: 'Make the UI clean',
      ambiguityResolved: false,
      includeAcceptanceCriteria: true,
      rootUserConfirmed: true,
    })

    const result = await runDevViewCli(['product-intake', 'close', '--json'], { cwd: workspace, pluginRoot })

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
  ])('rejects product intake close when structured acceptance criterion lacks %s', async (_field, code, mutate) => {
    const workspace = createWorkspace()
    writeMinimalDevView(workspace, {
      productTitle: 'Show connected status',
      ambiguityResolved: true,
      includeAcceptanceCriteria: true,
      rootUserConfirmed: true,
    })
    mutateFirstAcceptanceCriterion(workspace, mutate)

    const result = await runDevViewCli(['product-intake', 'close', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(code)
  })

  it('rejects product intake close when acceptance criterion contains an abstract quality term', async () => {
    const workspace = createWorkspace()
    writeMinimalDevView(workspace, {
      productTitle: 'Show connected status',
      ambiguityResolved: true,
      includeAcceptanceCriteria: true,
      rootUserConfirmed: true,
    })
    mutateFirstAcceptanceCriterion(workspace, (criterion) => {
      criterion.observableResult = 'The status is shown cleanly.'
    })

    const result = await runDevViewCli(['product-intake', 'close', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('AC_ABSTRACT_TERM')
  })

  it('allows acceptanceNotRequiredReason for a non-executable foundation Product node', async () => {
    const workspace = createWorkspace()
    writeJson(treePath(workspace, 'product-tree.json'), {
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
    writeDevViewState(workspace, 'INIT')

    const result = await runDevViewCli(['product-intake', 'close', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).state).toBe('PRODUCT_INTAKE_DONE')
  })

  it('closes product intake and updates state when root and leaf are user-confirmed', async () => {
    const workspace = createWorkspace()
    writeMinimalDevView(workspace, {
      productTitle: 'Show connected status',
      ambiguityResolved: true,
      includeAcceptanceCriteria: true,
      rootUserConfirmed: true,
    })

    const result = await runDevViewCli(['product-intake', 'close', '--json'], { cwd: workspace, pluginRoot })
    const status = await runDevViewCli(['status', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).state).toBe('PRODUCT_INTAKE_DONE')
    const statusPayload = JSON.parse(status.stdout)
    expect(statusPayload.state).toBe('PRODUCT_INTAKE_DONE')
    expect(statusPayload.stateHistoryCount).toBe(1)
    expect(statusPayload.lastTransition).toMatchObject({
      from: 'INIT',
      to: 'PRODUCT_INTAKE_DONE',
      command: 'product-intake close',
    })
    expect(readState(workspace).autoflow.stateHistory).toHaveLength(1)
  })

  it('records UI/UX user approval through the CLI', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'PRODUCT_INTAKE_DONE')
    writeText(
      blueprintPath(workspace, 'ui-ux-confirmation.md'),
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

    const result = await runDevViewCli(['ui', 'approve', '--json'], { cwd: workspace, pluginRoot })

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
    writeDevViewState(workspace, 'EXECUTION_PACK_READY')
    writeText(
      blueprintPath(workspace, 'ui-ux-confirmation.md'),
      '# UI/UX Confirmation\n\n- Status: confirmed\n- Confirmed by: user\n',
    )

    const before = readStateText(workspace)
    const result = await runDevViewCli(['ui', 'approve', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'INVALID_TRANSITION',
    )
    expect(after).toBe(before)
  })

  it('blocks accept gate without user approval', async () => {
    const workspace = createWorkspace()
    writeMinimalDevView(workspace, {
      productTitle: 'Show connected status',
      ambiguityResolved: true,
      includeAcceptanceCriteria: true,
      rootUserConfirmed: true,
      acceptedByAssistant: true,
    })

    const result = await runDevViewCli(['gate', 'accept', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('ASSISTANT_ACCEPTED_STATUS')
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('USER_APPROVAL_REQUIRED')
  })

  it('rejects work planning when Work Tree dependencies contain a cycle', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDevViewState(workspace, 'UI_UX_APPROVED')
    writeDecisionQueue(workspace)
    writeWorkTree(workspace, { dependencyCycle: true })

    const result = await runDevViewCli(['work-planning', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('DEPENDENCY_CYCLE')
  })

  it('stage-aware work planning traceability requires Product to Work links only', async () => {
    const missingWorkWorkspace = createWorkspace()
    writeExecutableProduct(missingWorkWorkspace)
    const missingWork = await runDevViewCli(['trace', 'check', '--stage', 'work-planning', '--json'], {
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
    const noTest = await runDevViewCli(['trace', 'check', '--stage', 'work-planning', '--json'], {
      cwd: noTestWorkspace,
      pluginRoot,
    })

    expect(noTest.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(noTest.stdout).ok).toBe(true)
  })

  it('prints consistent JSON issue metadata for failed validation', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)

    const result = await runDevViewCli(['trace', 'check', '--stage', 'work-planning', '--json'], {
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
      file: '.devview/tree/work-tree.json',
      nodeType: 'Product',
      stage: 'work-planning',
      reason: expect.any(String),
      suggestedFix: expect.any(String),
      nextCommand: 'devview work-planning close',
    })
  })

  it('prints suggested fix and next command in text failure output', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)

    const result = await runDevViewCli(['trace', 'check', '--stage', 'work-planning'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(result.stderr).toContain('Command: trace check')
    expect(result.stderr).toContain('Status: FAIL')
    expect(result.stderr).toContain('Issues: 1 total, 1 error')
    expect(result.stderr).toContain('[error] PRODUCT_WORK_LINK_MISSING')
    expect(result.stderr).toContain('Suggested fix:')
    expect(result.stderr).toContain('Next command: devview work-planning close')
  })

  it('stage-aware work planning traceability rejects inactive Product scope leaks', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { scopeClass: 'deferred', status: 'deferred' })
    writeWorkTree(workspace)

    const result = await runDevViewCli(['trace', 'check', '--stage', 'work-planning', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('DEFERRED_SCOPE_LEAK')
  })

  it('accepts verification design coverage when a Test node verifies the Work acceptance criteria', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeWorkTree(workspace)
    writeTestTree(workspace, { verifiesWork: false, verifiesAcceptanceCriteria: true })

    const result = await runDevViewCli(['verification-design', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).ok).toBe(true)
  })

  it('stage-aware verification design traceability requires Work and acceptance criteria to be covered by tests', async () => {
    const missingTestWorkspace = createWorkspace()
    writeExecutableProduct(missingTestWorkspace)
    writeWorkTree(missingTestWorkspace)
    const missingTest = await runDevViewCli(['trace', 'check', '--stage', 'verification-design', '--json'], {
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
    const missingAc = await runDevViewCli(['trace', 'check', '--stage', 'verification-design', '--json'], {
      cwd: missingAcWorkspace,
      pluginRoot,
    })

    expect(missingAc.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(missingAc.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ACCEPTANCE_NOT_COVERED',
    )
  })

  it('stage-aware verification design traceability does not require Evidence Tree files yet', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeWorkTree(workspace)
    writeTestTree(workspace)

    const result = await runDevViewCli(['trace', 'check', '--stage', 'verification-design', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).ok).toBe(true)
  })

  it('stage-aware verification design traceability requires tests to declare evidence', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeWorkTree(workspace)
    writeTestTree(workspace, { evidenceRequired: [] })

    const result = await runDevViewCli(['trace', 'check', '--stage', 'verification-design', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('TEST_EVIDENCE_DECLARATION_MISSING')
  })

  it('rejects verification design close when required acceptance criteria are not covered by Test Tree', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'WORK_PLANNING_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace, { verifiesAcceptanceCriteria: false })

    const before = readStateText(workspace)
    const result = await runDevViewCli(['verification-design', 'close', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('ACCEPTANCE_NOT_COVERED')
    expect(after).toBe(before)
  })

  it('rejects verification design check when UI acceptance criteria lack screenshot or manual evidence coverage', async () => {
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

    const result = await runDevViewCli(['verification-design', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('UI_ACCEPTANCE_EVIDENCE_NOT_COVERED')
  })

  it('rejects UI Test nodes without screenshot or manual evidence requirement', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeWorkTree(workspace)
    writeTestTree(workspace, { testType: 'ui_state_test', evidenceRequired: ['test log'] })

    const result = await runDevViewCli(['verification-design', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('UI_EVIDENCE_MISSING')
  })

  it('rejects selected visual UI work without a visual reference', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })

    const result = await runDevViewCli(['visual', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('VISUAL_REFERENCE_MISSING')
  })

  it('accepts default DevView Clean Theme when visual contract artifacts are present', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeVisualContractArtifacts(workspace)

    const result = await runDevViewCli(['visual', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).ok).toBe(true)
  })

  it('allows work planning gate for visual work after Visual Contract and before UI Surface Inventory', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'UI_UX_APPROVED')
    writeVisualContractArtifacts(workspace, { contractOnly: true })

    const result = await runDevViewCli(['gate', 'work-planning', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).ok).toBe(true)
  })

  it('blocks verification design gate for visual work before UI Surface Inventory exists', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'WORK_PLANNING_DONE')
    writeWorkTree(workspace)
    writeVisualContractArtifacts(workspace, { contractOnly: true })

    const result = await runDevViewCli(['gate', 'verification-design', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('UI_SURFACE_INVENTORY_MISSING')
  })

  it('rejects review evidence when required visual screenshot evidence is missing', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeVisualContractArtifacts(workspace, { requiredScreenshot: true })
    writeJson(evidencePath(workspace, 'evidence-tree.json'), {
      version: '0.2.0-tree-control',
      evidence: [],
    })

    const result = await runDevViewCli(['evidence', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('VISUAL_SCREENSHOT_EVIDENCE_MISSING')
  })

  it('rejects stale visual screenshot evidence', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { visualImpact: true })
    writeVisualContractArtifacts(workspace, { requiredScreenshot: true })
    writeJson(evidencePath(workspace, 'evidence-tree.json'), {
      version: '0.2.0-tree-control',
      evidence: [
        {
          id: 'EV-VISUAL-1',
          type: 'screenshot',
          status: 'stale_evidence',
          path: '.devview/evidence/screenshots/surface-1-default.png',
          provesNodeIds: ['TT-1'],
          evidenceForTestNodeIds: ['TT-1'],
        },
      ],
    })

    const result = await runDevViewCli(['evidence', 'check', '--json'], { cwd: workspace, pluginRoot })

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
    writeDevViewState(workspace, 'EXECUTION_PACK_RUN_DONE')
    writeVisualScreenshotEvidence(workspace)

    const result = await runDevViewCli(['gate', 'review-result', '--json'], { cwd: workspace, pluginRoot })

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
    writeDevViewState(workspace, 'EXECUTION_PACK_RUN_DONE')
    writeVisualScreenshotEvidence(workspace)
    writeText(
      evidencePath(workspace, 'visual-audit.md'),
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

    const result = await runDevViewCli(['gate', 'review-result', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('VISUAL_AUDIT_BLOCKING_ISSUES')
  })

  it('rejects execution pack manifests that include inactive scope tasks', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { scopeClass: 'deferred', status: 'deferred' })
    writeWorkTree(workspace, { workScopeClass: 'deferred', workStatus: 'deferred' })
    writeExecutionManifest(workspace, { taskScopeClass: 'deferred' })
    writeFinalCoverage(workspace)

    const result = await runDevViewCli(['execution-pack', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const payload = JSON.parse(result.stderr)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain('EXECUTION_PACK_SCOPE_LEAK')
  })

  it('rejects Evidence nodes whose attached file path is missing', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace, { path: '.devview/evidence/test-results/missing.log' })

    const result = await runDevViewCli(['evidence', 'check', '--json'], { cwd: workspace, pluginRoot })

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
    writeDevViewState(workspace, 'EXECUTION_PACK_RUN_DONE')
    writeWorkTree(workspace, { workUpdatedAt: '2026-06-12T10:00:00.000Z' })
    writeTestTree(workspace)
    writeEvidenceTree(workspace, {
      createdAt: '2026-06-12T09:00:00.000Z',
      provesWorkNodeIds: ['WT-1'],
    })

    const before = readStateText(workspace)
    const result = await runDevViewCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain('EVIDENCE_STALE')
    expect(after).toBe(before)
  })

  it('passes file guard when changed source file is within Work expectedFiles', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'WORK_PLANNING_DONE')
    writeWorkTree(workspace)
    writeText(join(workspace, 'src', 'status.ts'), 'export const status = "baseline"\n')
    initGitRepository(workspace)
    writeText(join(workspace, 'src', 'status.ts'), 'export const status = "changed"\n')

    const result = await runDevViewCli(['files', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).issues).toEqual([])
  })

  it('fails file guard when changed source file matches forbiddenFiles', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'WORK_PLANNING_DONE')
    writeWorkTree(workspace)
    addWorkNodeFields(workspace, 'WT-1', { forbiddenFiles: ['src/secret.ts'] })
    writeText(join(workspace, 'src', 'secret.ts'), 'export const secret = "baseline"\n')
    initGitRepository(workspace)
    writeText(join(workspace, 'src', 'secret.ts'), 'export const secret = "changed"\n')

    const result = await runDevViewCli(['files', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'FILE_CHANGE_FORBIDDEN',
    )
  })

  it('fails file guard for unknown source files when Work scope has no unknownFileTouchRisk', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'WORK_PLANNING_DONE')
    writeWorkTree(workspace)
    writeText(join(workspace, 'src', 'outside.ts'), 'export const outside = "baseline"\n')
    initGitRepository(workspace)
    writeText(join(workspace, 'src', 'outside.ts'), 'export const outside = "changed"\n')

    const result = await runDevViewCli(['files', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'FILE_CHANGE_OUTSIDE_WORK_SCOPE',
    )
  })

  it('does not treat legacy storage-only artifact changes as source file violations', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'WORK_PLANNING_DONE')
    writeWorkTree(workspace)
    initGitRepository(workspace)
    writeText(blueprintPath(workspace, 'notes.md'), 'artifact update\n')

    const result = await runDevViewCli(['files', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).issues).toEqual([])
  })

  it('fails file guard for DONE source changes without activeRevision', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'DONE', { deliveryStatus: 'accepted', completedSteps: ['complete'], nextStep: null })
    writeWorkTree(workspace)
    writeText(join(workspace, 'src', 'status.ts'), 'export const status = "baseline"\n')
    initGitRepository(workspace)
    writeText(join(workspace, 'src', 'status.ts'), 'export const status = "changed"\n')

    const result = await runDevViewCli(['files', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'FILE_CHANGE_REQUIRES_REVISION',
    )
  })

  it('allows activeRevision source changes inside affected Work expectedFiles', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'REVISION_REQUESTED', {
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

    const result = await runDevViewCli(['files', 'check', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(result.stdout).issues).toEqual([])
  })

  it('fails activeRevision source changes outside affected Work expectedFiles', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'REVISION_REQUESTED', {
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

    const result = await runDevViewCli(['files', 'check', '--json'], { cwd: workspace, pluginRoot })

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
    writeDevViewState(workspace, 'EXECUTION_PACK_RUN_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace)
    writeText(join(workspace, 'src', 'outside.ts'), 'export const outside = "baseline"\n')
    initGitRepository(workspace)
    writeText(join(workspace, 'src', 'outside.ts'), 'export const outside = "changed"\n')

    const before = readStateText(workspace)
    const result = await runDevViewCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })
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
    writeDevViewState(workspace, 'WAITING_REVIEW_RESULT')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace)
    writeUserAcceptance(workspace)
    writeText(join(workspace, 'src', 'outside.ts'), 'export const outside = "baseline"\n')
    initGitRepository(workspace)
    writeText(join(workspace, 'src', 'outside.ts'), 'export const outside = "changed"\n')

    const before = readStateText(workspace)
    const result = await runDevViewCli(['accept', '--json'], { cwd: workspace, pluginRoot })
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
    writeDevViewState(workspace, 'WAITING_REVIEW_RESULT')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace, { status: 'stale' })
    writeUserAcceptance(workspace)

    const before = readStateText(workspace)
    const result = await runDevViewCli(['accept', '--json'], { cwd: workspace, pluginRoot })
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
    writeDevViewState(workspace, 'EXECUTION_IN_PROGRESS')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)
    writeEvidenceTree(workspace, { omitTimestamp: true })

    const result = await runDevViewCli(['execution', 'complete', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('EXECUTION_PACK_RUN_DONE')
    expect(state.deliveryStatus).toBe('verified')
  })

  it('does not mutate state when review submit finds timestamp-missing evidence', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'EXECUTION_PACK_RUN_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace, { omitTimestamp: true })

    const before = readStateText(workspace)
    const result = await runDevViewCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })
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
    writeDevViewState(workspace, 'WAITING_REVIEW_RESULT')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace, { omitTimestamp: true })
    writeUserAcceptance(workspace)

    const before = readStateText(workspace)
    const result = await runDevViewCli(['accept', '--json'], { cwd: workspace, pluginRoot })
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
    writeDevViewState(workspace, 'EXECUTION_PACK_RUN_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace, { status: 'superseded' })

    const before = readStateText(workspace)
    const result = await runDevViewCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })
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
    writeDevViewState(workspace, 'WAITING_REVIEW_RESULT')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace, { status: 'superseded' })
    writeUserAcceptance(workspace)

    const before = readStateText(workspace)
    const result = await runDevViewCli(['accept', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'EVIDENCE_SUPERSEDED',
    )
    expect(after).toBe(before)
  })

  it('transitions work planning through CLI and records state history', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'UI_UX_APPROVED')
    writeWorkTree(workspace)

    const result = await runDevViewCli(['work-planning', 'close', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('WORK_PLANNING_DONE')
    expect(state.autoflow.completedSteps).toContain('work_planning')
    expect(state.autoflow.currentGate).toBeNull()
    expect(state.autoflow.nextStep).toBe('verification_design')
    expectLastTransition(state, {
      from: 'UI_UX_APPROVED',
      to: 'WORK_PLANNING_DONE',
      command: 'work-planning close',
    })
  })

  it('transitions verification design and opens implementation scope gate', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'WORK_PLANNING_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)

    const result = await runDevViewCli(['verification-design', 'close', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('VERIFICATION_DESIGN_DONE')
    expect(state.autoflow.completedSteps).toContain('verification_design')
    expect(state.autoflow.currentGate).toBe('implementation_scope')
    expect(state.autoflow.nextStep).toBe('implementation_scope')
    expectLastTransition(state, {
      from: 'WORK_PLANNING_DONE',
      to: 'VERIFICATION_DESIGN_DONE',
      command: 'verification-design close',
    })
  })

  it('does not mutate state when verification design close runs from the wrong state', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'SCOPE_SELECTED')
    writeWorkTree(workspace)
    writeTestTree(workspace)

    const before = readStateText(workspace)
    const result = await runDevViewCli(['verification-design', 'close', '--json'], { cwd: workspace, pluginRoot })
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
    writeDevViewState(workspace, 'VERIFICATION_DESIGN_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)

    const result = await runDevViewCli(['scope', 'select', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('SCOPE_SELECTED')
    expect(state.autoflow.completedSteps).toContain('implementation_scope')
    expect(state.autoflow.currentGate).toBeNull()
    expect(state.autoflow.nextStep).toBe('generate_execution_pack')
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
    writeDevViewState(workspace, 'PRODUCT_INTAKE_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)

    const before = readStateText(workspace)
    const result = await runDevViewCli(['scope', 'select', '--json'], { cwd: workspace, pluginRoot })
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
    writeDevViewState(workspace, 'VERIFICATION_DESIGN_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeDependencyImpactAudit(workspace)
    writeExecutionStrategy(workspace)
    writeCoverageAudit(workspace)
    writeUxAudit(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)
    writeEvidenceTree(workspace)

    const scope = await runDevViewCli(['scope', 'select', '--json'], { cwd: workspace, pluginRoot })
    const dependency = await runDevViewCli(['dependency', 'audit', 'complete', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const plan = await runDevViewCli(['plan', 'execution', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const coverage = await runDevViewCli(['coverage', 'audit', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const ux = await runDevViewCli(['ux', 'audit', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const executionPack = await runDevViewCli(['execution-pack', 'ready', '--json'], { cwd: workspace, pluginRoot })
    const executionStart = await runDevViewCli(['execution', 'start', '--json'], { cwd: workspace, pluginRoot })
    const execution = await runDevViewCli(['execution', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const review = await runDevViewCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })

    expect(scope.exitCode).toBe(ExitCode.Success)
    expect(dependency.exitCode).toBe(ExitCode.Success)
    expect(plan.exitCode).toBe(ExitCode.Success)
    expect(coverage.exitCode).toBe(ExitCode.Success)
    expect(ux.exitCode).toBe(ExitCode.Success)
    expect(executionPack.exitCode).toBe(ExitCode.Success)
    expect(executionStart.exitCode).toBe(ExitCode.Success)
    expect(execution.exitCode).toBe(ExitCode.Success)
    expect(review.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('WAITING_REVIEW_RESULT')
    expect(state.deliveryStatus).toBe('submitted_for_review')
    expect(state.autoflow.stateHistory.map((entry: { to: string }) => entry.to)).toEqual([
      'WAITING_IMPLEMENTATION_SCOPE',
      'SCOPE_SELECTED',
      'EXECUTION_PACK_READY',
      'EXECUTION_IN_PROGRESS',
      'EXECUTION_PACK_RUN_DONE',
      'WAITING_REVIEW_RESULT',
    ])
  })

  it('transitions execution pack ready through the CLI', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'SCOPE_SELECTED', {
      completedSteps: [
        'start',
        'product-intake',
        'work-planning',
        'verification-design',
        'implementation_scope',
        'dependency_impact_audit',
        'plan_execution',
        'coverage_audit',
        'ux_audit',
      ],
      nextStep: 'generate_execution_pack',
    })
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)

    const result = await runDevViewCli(['execution-pack', 'ready', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('EXECUTION_PACK_READY')
    expect(state.autoflow.completedSteps).toContain('generate_execution_pack')
    expect(state.autoflow.currentGate).toBeNull()
    expect(state.autoflow.nextStep).toBe('run_execution_pack')
    expectLastTransition(state, {
      from: 'SCOPE_SELECTED',
      to: 'EXECUTION_PACK_READY',
      command: 'execution-pack ready',
    })
  })

  it('transitions execution pack runtime start through the CLI', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'EXECUTION_PACK_READY')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)

    const result = await runDevViewCli(['execution', 'start', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('EXECUTION_IN_PROGRESS')
    expect(state.autoflow.completedSteps).toContain('execution_start')
    expect(state.autoflow.currentGate).toBeNull()
    expect(state.autoflow.nextStep).toBe('run_execution_pack')
    expectLastTransition(state, {
      from: 'EXECUTION_PACK_READY',
      to: 'EXECUTION_IN_PROGRESS',
      command: 'execution start',
    })
  })

  it('does not mutate state when execution start runs from the wrong state', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'SCOPE_SELECTED')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)

    const before = readStateText(workspace)
    const result = await runDevViewCli(['execution', 'start', '--json'], { cwd: workspace, pluginRoot })
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
    writeDevViewState(workspace, 'EXECUTION_IN_PROGRESS')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)
    writeEvidenceTree(workspace)

    const result = await runDevViewCli(['execution', 'complete', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('EXECUTION_PACK_RUN_DONE')
    expect(state.deliveryStatus).toBe('verified')
    expect(state.autoflow.completedSteps).toContain('run_execution_pack')
    expectLastTransition(state, {
      from: 'EXECUTION_IN_PROGRESS',
      to: 'EXECUTION_PACK_RUN_DONE',
      command: 'execution complete',
    })
  })

  it('rejects the direct EXECUTION_PACK_READY to EXECUTION_PACK_RUN_DONE execution shortcut', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'EXECUTION_PACK_READY')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)
    writeEvidenceTree(workspace)

    const before = readStateText(workspace)
    const result = await runDevViewCli(['execution', 'complete', '--json'], { cwd: workspace, pluginRoot })
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
    writeDevViewState(workspace, 'EXECUTION_IN_PROGRESS')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)

    const before = readStateText(workspace)
    const result = await runDevViewCli(['execution', 'complete', '--json'], { cwd: workspace, pluginRoot })
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
    const missingEvidence = await runDevViewCli(['trace', 'check', '--stage', 'execution', '--json'], {
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
    writeEvidenceTree(missingFileWorkspace, { path: '.devview/evidence/test-results/missing.log' })
    const trace = await runDevViewCli(['trace', 'check', '--stage', 'execution', '--json'], {
      cwd: missingFileWorkspace,
      pluginRoot,
    })
    const evidence = await runDevViewCli(['evidence', 'check', '--json'], { cwd: missingFileWorkspace, pluginRoot })

    expect(trace.exitCode).toBe(ExitCode.Success)
    expect(evidence.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(evidence.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'EVIDENCE_FILE_MISSING',
    )
  })

  it('does not mutate state when execution pack ready runs from the wrong state', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'EXECUTION_PACK_RUN_DONE', {
      completedSteps: [
        'start',
        'product-intake',
        'work-planning',
        'verification-design',
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
    const result = await runDevViewCli(['execution-pack', 'ready', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'INVALID_TRANSITION',
    )
    expect(after).toBe(before)
  })

  it('records pre-execution-pack checkpoints without changing top-level state', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'SCOPE_SELECTED', {
      completedSteps: ['start', 'product_intake', 'work_planning', 'verification_design', 'implementation_scope'],
      nextStep: 'dependency_impact_audit',
    })
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeDependencyImpactAudit(workspace)
    writeExecutionStrategy(workspace)
    writeCoverageAudit(workspace)
    writeUxAudit(workspace)

    const dependency = await runDevViewCli(['dependency', 'audit', 'complete', '--json'], {
      cwd: workspace,
      pluginRoot,
    })
    const plan = await runDevViewCli(['plan', 'execution', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const coverage = await runDevViewCli(['coverage', 'audit', 'complete', '--json'], { cwd: workspace, pluginRoot })
    const ux = await runDevViewCli(['ux', 'audit', 'complete', '--json'], { cwd: workspace, pluginRoot })

    expect(dependency.exitCode).toBe(ExitCode.Success)
    expect(plan.exitCode).toBe(ExitCode.Success)
    expect(coverage.exitCode).toBe(ExitCode.Success)
    expect(ux.exitCode).toBe(ExitCode.Success)

    const state = readState(workspace)
    expect(state.autoflow.state).toBe('SCOPE_SELECTED')
    expect(state.autoflow.nextStep).toBe('generate_execution_pack')
    expect(state.autoflow.completedSteps).toEqual(
      expect.arrayContaining(['dependency_impact_audit', 'plan_execution', 'coverage_audit', 'ux_audit']),
    )
    expect(state.autoflow.stateHistory).toEqual([])
  })

  it('blocks execution pack ready until pre-execution-pack checkpoints are completed', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'SCOPE_SELECTED', {
      completedSteps: ['start', 'product_intake', 'work_planning', 'verification_design', 'implementation_scope'],
      nextStep: 'generate_execution_pack',
    })
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeExecutionManifest(workspace)
    writeFinalCoverage(workspace)

    const before = JSON.stringify(readState(workspace))
    const result = await runDevViewCli(['execution-pack', 'ready', '--json'], { cwd: workspace, pluginRoot })
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
    writeDevViewState(workspace, 'SCOPE_SELECTED', {
      completedSteps: ['start', 'product_intake', 'work_planning', 'verification_design', 'implementation_scope'],
      nextStep: 'dependency_impact_audit',
    })
    writeWorkTree(workspace)
    writeTestTree(workspace)

    const before = JSON.stringify(readState(workspace))
    const result = await runDevViewCli(['dependency', 'audit', 'complete', '--json'], { cwd: workspace, pluginRoot })
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
    writeDevViewState(workspace, 'WORK_PLANNING_DONE')

    const before = JSON.stringify(readState(workspace))
    const result = await runDevViewCli(['verification-design', 'close', '--json'], { cwd: workspace, pluginRoot })
    const after = JSON.stringify(readState(workspace))

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(after).toBe(before)
  })

  it('blocks invalid transition and leaves state untouched', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'EXECUTION_PACK_READY')
    writeWorkTree(workspace)

    const before = JSON.stringify(readState(workspace))
    const result = await runDevViewCli(['work-planning', 'close', '--json'], { cwd: workspace, pluginRoot })
    const after = JSON.stringify(readState(workspace))

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'INVALID_TRANSITION',
    )
    expect(after).toBe(before)
  })

  it('does not mutate state on transition helper invalid JSON or unknown state failures', async () => {
    const invalidJsonWorkspace = createWorkspace()
    writeText(join(invalidJsonWorkspace, '.devview', 'blueprint', 'devview-state.json'), '{ invalid json')
    const invalidJsonBefore = readStateText(invalidJsonWorkspace)
    const invalidJsonResult = await transitionDevViewState(
      invalidJsonWorkspace,
      'test transition',
      [DEVVIEW_STATE.PRODUCT_INTAKE_DONE],
      {
        nextStep: 'work-planning',
      },
    )
    expect(invalidJsonResult.exitCode).toBe(ExitCode.SchemaError)
    expect(readStateText(invalidJsonWorkspace)).toBe(invalidJsonBefore)

    const unknownStateWorkspace = createWorkspace()
    writeDevViewState(unknownStateWorkspace, 'UNKNOWN_STATE')
    const unknownStateBefore = readStateText(unknownStateWorkspace)
    const unknownStateResult = await transitionDevViewState(
      unknownStateWorkspace,
      'test transition',
      [DEVVIEW_STATE.PRODUCT_INTAKE_DONE],
      { nextStep: 'work-planning' },
    )
    expect(unknownStateResult.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(readStateText(unknownStateWorkspace)).toBe(unknownStateBefore)
  })

  it('does not mutate state on checkpoint helper blocked state failures', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'VERIFICATION_DESIGN_DONE')

    const before = readStateText(workspace)
    const result = await checkpointDevViewState(workspace, 'test checkpoint', [DEVVIEW_STATE.SCOPE_SELECTED], {
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
    writeDevViewState(workspace, 'WORK_PLANNING_DONE', {
      stateHistory: [
        { from: 'INIT', to: 'PRODUCT_INTAKE_DONE', command: 'product-intake close', at: '2026-01-01T00:00:00.000Z' },
      ],
    })
    writeWorkTree(workspace)
    writeTestTree(workspace)

    const before = JSON.stringify(readState(workspace))
    const result = await runDevViewCli(['verification-design', 'close', '--json'], { cwd: workspace, pluginRoot })
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
    writeDevViewState(workspace, 'WAITING_REVIEW_RESULT')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace)
    writeEmptyAcceptance(workspace)

    const blocked = await runDevViewCli(['accept', '--json'], { cwd: workspace, pluginRoot })
    expect(blocked.exitCode).toBe(ExitCode.ValidationFailed)
    expect(readState(workspace).autoflow.state).toBe('WAITING_REVIEW_RESULT')

    writeUserAcceptance(workspace)
    const accepted = await runDevViewCli(['accept', '--json'], { cwd: workspace, pluginRoot })

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
    writeDevViewState(workspace, 'WAITING_REVIEW_RESULT')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace)
    writeJson(controlPath(workspace, 'acceptance-tree.json'), {
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
    const result = await runDevViewCli(['accept', '--json'], { cwd: workspace, pluginRoot })
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
    writeDevViewState(workspace, 'EXECUTION_PACK_RUN_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace)
    writeUserAcceptance(workspace)

    const before = readStateText(workspace)
    const result = await runDevViewCli(['accept', '--json'], { cwd: workspace, pluginRoot })
    const after = readStateText(workspace)

    expect(result.exitCode).toBe(ExitCode.TransitionBlocked)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'ACCEPT_STATE_BLOCKED',
    )
    expect(after).toBe(before)
  })

  it('does not submit review before execution pack run is done', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace)
    writeRequirementCompat(workspace)
    writeDecisionQueue(workspace)
    writeDevViewState(workspace, 'EXECUTION_IN_PROGRESS')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeEvidenceTree(workspace)

    const before = readStateText(workspace)
    const result = await runDevViewCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })
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
    const missingEvidence = await runDevViewCli(['trace', 'check', '--stage', 'review', '--json'], {
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
    const noAcceptance = await runDevViewCli(['trace', 'check', '--stage', 'review', '--json'], {
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
    const missingAcceptance = await runDevViewCli(['trace', 'check', '--stage', 'accept', '--json'], {
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
    writeJson(controlPath(assistantAcceptanceWorkspace, 'acceptance-tree.json'), {
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
    const assistantAcceptance = await runDevViewCli(['trace', 'check', '--stage', 'accept', '--json'], {
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
    const accepted = await runDevViewCli(['trace', 'check', '--stage', 'accept', '--json'], {
      cwd: acceptedWorkspace,
      pluginRoot,
    })

    expect(accepted.exitCode).toBe(ExitCode.Success)
    expect(JSON.parse(accepted.stdout).ok).toBe(true)
  })

  it('creates a Change node from user feedback', async () => {
    const workspace = createWorkspace()
    writeChangeTree(workspace)

    const result = await runDevViewCli(
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
    const result = await runDevViewCli(['change', 'create', '--json'], { cwd: workspace, pluginRoot })
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

    const result = await runDevViewCli(
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
    const result = await runDevViewCli(['impact', 'analyze', '--change', 'CH-404', '--product', 'PT-1', '--json'], {
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
    const result = await runDevViewCli(['impact', 'analyze', '--change', 'CH-001', '--json'], {
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
    const result = await runDevViewCli(
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

    const result = await runDevViewCli(
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

    const result = await runDevViewCli(
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

    const result = await runDevViewCli(
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

    const result = await runDevViewCli(
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

    const result = await runDevViewCli(['product', 'patch', 'apply', '--json'], {
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
    const result = await runDevViewCli(['product', 'patch', 'apply', '--patch', 'PP-001', '--json'], {
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

    const result = await runDevViewCli(['product', 'patch', 'apply', '--patch', 'PP-001', '--json'], {
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
    const result = await runDevViewCli(['product', 'patch', 'apply', '--patch', 'PP-001', '--json'], {
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
    await runDevViewCli(['product', 'patch', 'apply', '--patch', 'PP-001', '--json'], { cwd: workspace, pluginRoot })

    const result = await runDevViewCli(['product', 'patch', 'apply', '--patch', 'PP-001', '--json'], {
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

  it('devview validate accepts a valid initialized Product Patch Tree', async () => {
    const workspace = createWorkspace()
    copyValidExample(workspace)
    writeProductPatchTree(workspace, [productPatchFixture(workspace)])

    const result = await runDevViewCli(['validate', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
  })

  it('devview validate rejects an invalid initialized Product Patch Tree', async () => {
    const workspace = createWorkspace()
    copyValidExample(workspace)
    writeProductPatchTree(workspace, [{ ...productPatchFixture(workspace), operation: 'legacy_direct_edit' }])

    const result = await runDevViewCli(['validate', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'PRODUCT_PATCH_OPERATION_INVALID',
    )
  })

  it('blocks revision start when the Change node has no Impact analysis', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'WAITING_REVIEW_RESULT')
    writeChangeTree(workspace, [{ id: 'CH-001', type: 'feedback', status: 'proposed', summary: 'Adjust collapse' }])
    writeImpactTree(workspace)

    const beforeState = readStateText(workspace)
    const result = await runDevViewCli(['revision', 'start', '--change', 'CH-001', '--json'], {
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
    writeDevViewState(workspace, 'DONE', { deliveryStatus: 'accepted', completedSteps: ['complete'], nextStep: null })
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
    const result = await runDevViewCli(['revision', 'start', '--change', 'CH-001', '--json'], {
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
    writeDevViewState(workspace, 'DONE', { deliveryStatus: 'accepted', completedSteps: ['complete'], nextStep: null })
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
    writeText(evidencePath(workspace, 'evidence-tree.json'), '{ invalid json')
    writeUserAcceptance(workspace)

    const beforeState = readStateText(workspace)
    const beforeEvidence = readEvidenceText(workspace)
    const beforeAcceptance = readControlText(workspace, 'acceptance-tree.json')
    const result = await runDevViewCli(['revision', 'start', '--change', 'CH-001', '--json'], {
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
    writeDevViewState(workspace, 'DONE', { deliveryStatus: 'accepted', completedSteps: ['complete'], nextStep: null })
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
    writeText(controlPath(workspace, 'acceptance-tree.json'), '{ invalid json')

    const beforeState = readStateText(workspace)
    const beforeEvidence = readEvidenceText(workspace)
    const beforeAcceptance = readControlText(workspace, 'acceptance-tree.json')
    const result = await runDevViewCli(['revision', 'start', '--change', 'CH-001', '--json'], {
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
    writeDevViewState(workspace, 'DONE', { deliveryStatus: 'accepted', completedSteps: ['complete'], nextStep: null })
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

    const result = await runDevViewCli(['revision', 'start', '--change', 'CH-001', '--json'], {
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
    writeDevViewState(workspace, 'REVISION_REQUESTED')
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
    const result = await runDevViewCli(['revision', 'complete', '--change', 'CH-001', '--json'], {
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
    writeDevViewState(workspace, 'REVISION_REQUESTED', {
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
    const result = await runDevViewCli(['revision', 'complete', '--change', 'CH-002', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)).toContain(
      'REVISION_CHANGE_MISMATCH',
    )
    expect(readStateText(workspace)).toBe(beforeState)
  })

  it('completes revision by returning to work-planning flow instead of DONE', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'REVISION_REQUESTED', {
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

    const result = await runDevViewCli(['revision', 'complete', '--change', 'CH-001', '--json'], {
      cwd: workspace,
      pluginRoot,
    })

    expect(result.exitCode).toBe(ExitCode.Success)
    const state = readState(workspace)
    expect(state.autoflow.state).toBe('WORK_PLANNING_IN_PROGRESS')
    expect(state.autoflow.nextStep).toBe('work_planning')
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
      to: 'WORK_PLANNING_IN_PROGRESS',
      command: 'revision complete',
    })
  })

  it('keeps original artifacts when a JSON artifact transaction cannot prepare every write', async () => {
    const workspace = createWorkspace()
    const firstPath = blueprintPath(workspace, 'transaction-first.json')
    const blockingPath = blueprintPath(workspace, 'not-a-directory')
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
    writeDevViewState(workspace, 'EXECUTION_PACK_RUN_DONE')
    writeWorkTree(workspace)
    writeTestTree(workspace)
    writeVisualContractArtifacts(workspace, { requiredScreenshot: true })
    writeVisualScreenshotEvidence(workspace)
    writePassingVisualAudit(workspace)

    const result = await runDevViewCli(['review', 'submit', '--json'], { cwd: workspace, pluginRoot })

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
    writeDevViewState(workspace, 'UNKNOWN_STATE', {
      stateHistory: [{ from: 'INIT', to: 'WORK_PLANNING_DONE', command: 'bad', at: '2026-01-01T00:00:00.000Z' }],
    })

    const result = await runDevViewCli(['validate', '--json'], { cwd: workspace, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    const codes = JSON.parse(result.stderr).issues.map((entry: { code: string }) => entry.code)
    expect(codes).toContain('UNKNOWN_STATE')
    expect(codes).toContain('STATE_HISTORY_INVALID_TRANSITION')
  })

  it('state validator accepts a known canonical state', async () => {
    const workspace = createWorkspace()
    writeDevViewState(workspace, 'PRODUCT_INTAKE_DONE')

    const issues = await validateState(workspace)

    expect(issues).toEqual([])
  })
})

function readState(workspace: string): Record<string, any> {
  return JSON.parse(readStateText(workspace))
}

function readStateText(workspace: string): string {
  return readFileSync(existingStatePath(workspace), 'utf8')
}

function existingStatePath(workspace: string): string {
  return join(workspace, '.devview', 'blueprint', 'devview-state.json')
}

function storageRoot(workspace: string): '.devview' {
  return '.devview'
}

function treePath(workspace: string, fileName: string): string {
  return join(workspace, storageRoot(workspace), 'tree', fileName)
}

function controlPath(workspace: string, fileName: string): string {
  return join(workspace, storageRoot(workspace), 'control', fileName)
}

function evidencePath(workspace: string, fileName: string): string {
  return join(workspace, storageRoot(workspace), 'evidence', fileName)
}

function blueprintPath(workspace: string, fileName: string): string {
  return join(workspace, storageRoot(workspace), 'blueprint', fileName)
}

function writeChangeTree(workspace: string, changes: Array<Record<string, any>> = []): void {
  writeJson(controlPath(workspace, 'change-tree.json'), {
    version: '0.2.0-tree-control',
    schemaVersion: 1,
    changes,
  })
}

function writeImpactTree(workspace: string, impacts: Array<Record<string, any>> = []): void {
  writeJson(controlPath(workspace, 'impact-tree.json'), {
    version: '0.2.0-tree-control',
    impacts,
  })
}

function writeProductPatchTree(workspace: string, patches: Array<Record<string, any>> = []): void {
  writeJson(controlPath(workspace, 'product-patch-tree.json'), {
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
  return readFileSync(treePath(workspace, 'product-tree.json'), 'utf8')
}

function readEvidenceTree(workspace: string): Record<string, any> {
  return JSON.parse(readEvidenceText(workspace))
}

function readAcceptanceTree(workspace: string): Record<string, any> {
  return JSON.parse(readControlText(workspace, 'acceptance-tree.json'))
}

function readEvidenceText(workspace: string): string {
  return readFileSync(evidencePath(workspace, 'evidence-tree.json'), 'utf8')
}

function addWorkNodeFields(workspace: string, workId: string, fields: Record<string, unknown>): void {
  const workTreePath = treePath(workspace, 'work-tree.json')
  const workTree = JSON.parse(readFileSync(workTreePath, 'utf8'))
  const node = workTree.nodes.find((entry: Record<string, unknown>) => entry.id === workId)
  Object.assign(node, fields)
  writeJson(workTreePath, workTree)
}

function initGitRepository(workspace: string): void {
  execFileSync('git', ['init'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'devview@example.test'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'DevView Test'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['add', '.'], { cwd: workspace, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'baseline'], { cwd: workspace, stdio: 'ignore' })
}

function writeExternalInitializedProject(workspace: string): void {
  writeText(join(workspace, 'README.md'), '# External app\n\nOrdinary project README.\n')
  for (const relativePath of ['.devview/tree', '.devview/execution', '.devview/control', '.devview/evidence']) {
    mkdirSync(join(workspace, relativePath), { recursive: true })
  }
  const state = JSON.parse(readFileSync(join(pluginRoot, 'templates', 'devview-state.template.json'), 'utf8'))
  state.projectId = 'external-app'
  state.autoflow.state = 'INIT'
  state.autoflow.completedSteps = ['start']
  state.autoflow.currentGate = null
  state.autoflow.nextStep = 'product_intake'
  writeJson(join(workspace, '.devview', 'blueprint', 'devview-state.json'), state)
}

function readControlText(workspace: string, fileName: string): string {
  return readFileSync(controlPath(workspace, fileName), 'utf8')
}

async function proposeProductPatch(workspace: string): Promise<void> {
  const result = await runDevViewCli(
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
  writeJson(controlPath(workspace, 'product-patch-tree.json'), patchTree)
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
  const productTreePath = treePath(workspace, 'product-tree.json')
  const productTree = JSON.parse(readFileSync(productTreePath, 'utf8'))
  const node = productTree.nodes.find((entry: Record<string, unknown>) => entry.id === productId)
  Object.assign(node, fields)
  writeJson(productTreePath, productTree)
}

function copyValidExample(workspace: string): void {
  cpSync(join(pluginRoot, 'examples', 'valid', 'todo-app-devview-run', '.'), workspace, {
    recursive: true,
    force: true,
  })
  for (const entry of ['.codex-plugin', 'skills', 'templates', 'schemas', 'docs']) {
    cpSync(join(pluginRoot, entry), join(workspace, entry), { recursive: true, force: true })
  }
  cpSync(join(pluginRoot, 'AGENTS.md'), join(workspace, 'AGENTS.md'), { force: true })
}

function mutateFirstAcceptanceCriterion(
  workspace: string,
  mutate: (criterion: Record<string, any>, productTree: Record<string, any>) => void,
): void {
  const productTreePath = treePath(workspace, 'product-tree.json')
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
