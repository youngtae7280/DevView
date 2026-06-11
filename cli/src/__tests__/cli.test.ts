import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runPbeCli } from '../app'
import { ExitCode } from '../core/types'

const pluginRoot = resolve(process.cwd())
const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('PBE CLI', () => {
  it('prints help', async () => {
    const result = await runPbeCli(['--help'], { cwd: pluginRoot, pluginRoot })

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(result.stdout).toContain('Project Blueprint Engine CLI')
    expect(result.stdout).toContain('rpd close')
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
    expect(JSON.parse(status.stdout).state).toBe('STARTED')
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
      productTitle: '화면을 깔끔하게 만든다',
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
    writePbeState(workspace, 'WPD_IN_PROGRESS')
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

  it('rejects ACEP manifests that include inactive scope tasks', async () => {
    const workspace = createWorkspace()
    writeExecutableProduct(workspace, { scopeClass: 'deferred', status: 'deferred' })
    writeWorkTree(workspace, { workScopeClass: 'deferred', workStatus: 'deferred' })
    writeExecutionManifest(workspace, { taskScopeClass: 'deferred' })
    writeText(join(workspace, '.pbe', 'codex-execution-pack', '16-final-coverage-check.md'), '# Final Coverage\n')

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
})

function createWorkspace(): string {
  const workspace = mkdtempSync(join(tmpdir(), 'pbe-cli-'))
  tempRoots.push(workspace)
  return workspace
}

function writeMinimalPbe(
  workspace: string,
  options: {
    productTitle: string
    ambiguityResolved: boolean
    includeAcceptanceCriteria: boolean
    rootUserConfirmed: boolean
    acceptedByAssistant?: boolean
  },
) {
  const productStatus = options.acceptedByAssistant ? 'accepted' : 'confirmed'
  writeJson(join(workspace, '.pbe', 'tree', 'product-tree.json'), {
    version: '0.2.0-tree-control',
    rootNodeId: 'PT-ROOT',
    nodes: [
      {
        id: 'PT-ROOT',
        type: 'goal',
        title: options.productTitle,
        status: productStatus,
        parent: null,
        children: [],
        source: options.rootUserConfirmed ? { actor: options.acceptedByAssistant ? 'assistant' : 'user', type: 'user_interview' } : {},
        why: '',
        scopeClass: 'selected',
        acceptance: [],
        acceptanceCriteria: options.includeAcceptanceCriteria
          ? [
              {
                id: 'AC-PT-ROOT-1',
                format: 'EARS',
                type: 'event_driven',
                condition: 'The status changes',
                systemResponse: 'The system shows the updated status text',
                statement: 'WHEN the status changes, THE SYSTEM SHALL show the updated status text.',
                status: 'confirmed',
                source: {
                  type: 'user_interview',
                  sourceNodeId: 'PT-ROOT',
                },
                verification: {
                  required: true,
                  suggestedTestNodeIds: [],
                  evidenceTypes: ['test_log'],
                },
              },
            ]
          : [],
        ambiguity: {
          status: options.ambiguityResolved ? 'clear' : 'partial',
          type: options.ambiguityResolved ? 'none' : 'abstract_quality',
          terms: options.ambiguityResolved ? [] : ['깔끔하게'],
          missing: options.ambiguityResolved ? [] : ['completion_criteria'],
        },
        ambiguityResolution: {
          status: options.ambiguityResolved ? 'resolved' : 'pending',
          resolvedTerms: options.ambiguityResolved ? ['status text is observable'] : [],
        },
        derivedTo: [],
        evidence: [],
      },
    ],
  })
  writeJson(join(workspace, '.pbe', 'blueprint', 'requirement-tree.json'), {
    schemaVersion: 1,
    rootNodeId: 'req-root',
    traversal: 'breadth_first',
    nodes: [
      {
        id: 'req-root',
        parentId: null,
        title: options.productTitle,
        summary: options.productTitle,
        status: 'confirmed',
        depth: 0,
        children: [],
        facts: [],
        openQuestions: [],
        decisions: [],
        scope: [],
        nonScope: [],
      },
    ],
  })
  writeJson(join(workspace, '.pbe', 'control', 'decision-queue.json'), {
    version: '0.2.0-tree-control',
    decisions: [],
  })
  writeJson(join(workspace, '.pbe', 'control', 'acceptance-tree.json'), {
    version: '0.2.0-tree-control',
    branches: options.acceptedByAssistant
      ? [
          {
            productNodeId: 'PT-ROOT',
            status: 'accepted_done',
            decisionSource: {
              actor: 'assistant',
            },
            evidenceNodeIds: [],
          },
        ]
      : [],
  })
  writeJson(join(workspace, '.pbe', 'blueprint', 'pbe-state.json'), {
    version: '0.2.0-alpha',
    autoflow: {
      enabled: true,
      profile: 'full',
      state: 'RPD_IN_PROGRESS',
      completedSteps: ['start'],
      currentGate: null,
      nextStep: 'rpd',
      lastUserAction: options.acceptedByAssistant ? { actor: 'assistant' } : { actor: 'user' },
    },
    artifacts: {
      productTree: '.pbe/tree/product-tree.json',
      decisionQueue: '.pbe/control/decision-queue.json',
      acceptanceTree: '.pbe/control/acceptance-tree.json',
      requirementTree: '.pbe/blueprint/requirement-tree.json',
    },
    deliveryStatus: options.acceptedByAssistant ? 'accepted' : 'waiting_root_confirmation',
  })
}

function writeJson(file: string, value: unknown) {
  mkdirSync(resolve(file, '..'), { recursive: true })
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function writeText(file: string, value: string) {
  mkdirSync(resolve(file, '..'), { recursive: true })
  writeFileSync(file, value, 'utf8')
}

function writeExecutableProduct(
  workspace: string,
  options: { scopeClass?: string; status?: string } = {},
) {
  writeJson(join(workspace, '.pbe', 'tree', 'product-tree.json'), {
    version: '0.2.0-tree-control',
    rootNodeId: 'PT-ROOT',
    nodes: [
      {
        id: 'PT-ROOT',
        type: 'goal',
        title: 'Root goal',
        status: 'confirmed',
        parent: null,
        children: ['PT-1'],
        source: { actor: 'user', type: 'user_interview' },
        scopeClass: 'selected',
        acceptanceCriteria: [],
        ambiguity: { status: 'clear', type: 'none', missing: [] },
        ambiguityResolution: { status: 'resolved', resolvedTerms: [] },
      },
      {
        id: 'PT-1',
        type: 'capability',
        title: 'Show connected status',
        status: options.status || 'confirmed',
        parent: 'PT-ROOT',
        children: [],
        source: { actor: 'user', type: 'user_interview' },
        scopeClass: options.scopeClass || 'selected',
        acceptanceCriteria: [
          {
            id: 'AC-PT-1-1',
            format: 'EARS',
            type: 'event_driven',
            condition: 'The connection status changes',
            systemResponse: 'The system shows the updated status',
            statement: 'WHEN the connection status changes, THE SYSTEM SHALL show the updated status.',
            status: 'confirmed',
            source: { type: 'user_interview', sourceNodeId: 'PT-1' },
            verification: {
              required: true,
              evidenceTypes: ['test_output'],
            },
          },
        ],
        ambiguity: { status: 'clear', type: 'none', missing: [] },
        ambiguityResolution: { status: 'resolved', resolvedTerms: [] },
      },
    ],
  })
}

function writeRequirementCompat(workspace: string) {
  writeJson(join(workspace, '.pbe', 'blueprint', 'requirement-tree.json'), {
    schemaVersion: 1,
    rootNodeId: 'req-root',
    traversal: 'breadth_first',
    nodes: [
      {
        id: 'req-root',
        parentId: null,
        title: 'Root goal',
        summary: 'Root goal',
        status: 'confirmed',
        depth: 0,
        children: [],
        facts: [],
        openQuestions: [],
        decisions: [],
        scope: [],
        nonScope: [],
      },
    ],
  })
}

function writeDecisionQueue(workspace: string) {
  writeJson(join(workspace, '.pbe', 'control', 'decision-queue.json'), {
    version: '0.2.0-tree-control',
    decisions: [],
  })
}

function writePbeState(workspace: string, state: string) {
  writeJson(join(workspace, '.pbe', 'blueprint', 'pbe-state.json'), {
    version: '0.2.0-alpha',
    autoflow: {
      enabled: true,
      profile: 'full',
      state,
      completedSteps: ['start', 'rpd'],
      currentGate: null,
      nextStep: 'wpd',
    },
    deliveryStatus: 'waiting_root_confirmation',
  })
}

function writeWorkTree(
  workspace: string,
  options: {
    dependencyCycle?: boolean
    workScopeClass?: string
    workStatus?: string
  } = {},
) {
  const secondNode = options.dependencyCycle
    ? [
        {
          id: 'WT-2',
          type: 'feature_task',
          title: 'Second work item',
          status: 'ready',
          derivedFromProductNodeIds: ['PT-1'],
          derivedFromProjectNodeIds: [],
          scopeClass: 'selected',
          expectedFiles: ['src/second.ts'],
          unknownFileTouchRisk: false,
          dependencies: ['WT-1'],
          satisfiesAcceptanceCriteriaIds: ['AC-PT-1-1'],
        },
      ]
    : []
  writeJson(join(workspace, '.pbe', 'tree', 'work-tree.json'), {
    version: '0.2.0-tree-control',
    rootNodeId: 'WT-ROOT',
    nodes: [
      {
        id: 'WT-ROOT',
        type: 'foundation_task',
        title: 'Work root',
        status: 'ready',
        derivedFromProductNodeIds: [],
        derivedFromProjectNodeIds: [],
        scopeClass: 'foundation',
      },
      {
        id: 'WT-1',
        type: 'feature_task',
        title: 'Implement connected status',
        status: options.workStatus || 'ready',
        derivedFromProductNodeIds: ['PT-1'],
        derivedFromProjectNodeIds: [],
        scopeClass: options.workScopeClass || 'selected',
        expectedFiles: ['src/status.ts'],
        unknownFileTouchRisk: false,
        dependencies: options.dependencyCycle ? ['WT-2'] : [],
        satisfiesAcceptanceCriteriaIds: ['AC-PT-1-1'],
      },
      ...secondNode,
    ],
  })
}

function writeTestTree(
  workspace: string,
  options: {
    verifiesWork?: boolean
    verifiesAcceptanceCriteria?: boolean
    testType?: string
    evidenceRequired?: string[]
  } = {},
) {
  writeJson(join(workspace, '.pbe', 'tree', 'test-tree.json'), {
    version: '0.2.0-tree-control',
    rootNodeId: 'TT-ROOT',
    nodes: [
      {
        id: 'TT-ROOT',
        type: 'acceptance_check',
        title: 'Test root',
        status: 'planned',
        verifiesProductNodeIds: [],
        verifiesWorkNodeIds: [],
        evidenceRequired: [],
      },
      {
        id: 'TT-1',
        type: options.testType || 'unit_test',
        title: 'Verify connected status',
        status: 'planned',
        verifiesProductNodeIds: ['PT-1'],
        verifiesWorkNodeIds: options.verifiesWork === false ? [] : ['WT-1'],
        verifiesAcceptanceCriteriaIds: options.verifiesAcceptanceCriteria === false ? [] : ['AC-PT-1-1'],
        evidenceRequired: options.evidenceRequired || ['test output'],
      },
    ],
  })
}

function writeEvidenceTree(workspace: string, options: { path?: string } = {}) {
  writeJson(join(workspace, '.pbe', 'evidence', 'evidence-tree.json'), {
    version: '0.2.0-tree-control',
    evidence: [
      {
        id: 'EV-1',
        type: 'test_output',
        status: 'attached',
        path: options.path,
        provesNodeIds: ['TT-1'],
        evidenceForTestNodeIds: ['TT-1'],
        evidenceForAcceptanceCriteriaIds: ['AC-PT-1-1'],
      },
    ],
  })
}

function writeExecutionManifest(workspace: string, options: { taskScopeClass: string }) {
  writeJson(join(workspace, '.pbe', 'codex-execution-pack', 'execution-manifest.json'), {
    schemaVersion: 1,
    autonomyLevel: 'autonomous_until_stop',
    deliveryStatus: 'submitted_for_review',
    tasks: [
      {
        id: 'TASK-1',
        title: 'Inactive task',
        file: '11-task-cards/TASK-1.md',
        scopeClass: options.taskScopeClass,
        workGraphNodeIds: ['WT-1'],
        requirementIds: ['PT-1'],
        verificationIds: ['TT-1'],
        evidenceRequired: ['test output'],
      },
    ],
    stopConditions: ['Any gate failure stops execution.'],
  })
}
