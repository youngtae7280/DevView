import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('PBE validator', () => {
  it('rejects parallel tasks that declare the same expected file', () => {
    const workspace = createValidatorWorkspace()
    writePbeFixture(workspace, {
      firstExpectedFile: 'src/features/shared.ts',
      secondExpectedFile: './src/features/shared.ts',
    })

    const result = runValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('same expectedFiles conflict')
  })

  it('accepts parallel tasks with distinct expected files', () => {
    const workspace = createValidatorWorkspace()
    writePbeFixture(workspace, {
      firstExpectedFile: 'src/features/one.ts',
      secondExpectedFile: 'src/features/two.ts',
    })

    const result = runValidator(workspace)

    expect(result.status).toBe(0)
    expect(result.output).toContain('PBE validation passed.')
  })

  it('rejects submitted review when the root requirement is still interviewing', () => {
    const workspace = createValidatorWorkspace()
    writePbeFixture(
      workspace,
      {
        firstExpectedFile: 'src/features/one.ts',
        secondExpectedFile: 'src/features/two.ts',
      },
      {
        requirementStatus: 'interviewing',
        deliveryStatus: 'submitted_for_review',
      },
    )

    const result = runValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('RPD_INCOMPLETE_DOWNSTREAM_BLOCKED')
    expect(result.output).toContain('Requirement node REQ-1 is interviewing')
  })

  it('rejects downstream execution while a blocking decision is open', () => {
    const workspace = createValidatorWorkspace()
    writePbeFixture(workspace, {
      firstExpectedFile: 'src/features/one.ts',
      secondExpectedFile: 'src/features/two.ts',
    })
    writeBlockingDecisionQueue(workspace)

    const result = runValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('RPD_INCOMPLETE_DOWNSTREAM_BLOCKED')
    expect(result.output).toContain('Decision DEC-ROOT is open with blockingLevel=blocking')
  })
})

function createValidatorWorkspace() {
  const workspace = mkdtempSync(join(tmpdir(), 'pbe-validator-'))
  tempRoots.push(workspace)

  for (const entry of ['.codex-plugin', 'skills', 'templates', 'schemas', 'docs']) {
    cpSync(resolve(process.cwd(), entry), join(workspace, entry), { recursive: true })
  }
  cpSync(resolve(process.cwd(), 'AGENTS.md'), join(workspace, 'AGENTS.md'))

  return workspace
}

function runValidator(workspace: string) {
  try {
    const output = execFileSync(
      process.execPath,
      [resolve(process.cwd(), 'scripts/validate-pbe-files.js')],
      {
        cwd: workspace,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    return { status: 0, output }
  } catch (error) {
    const failure = error as { status?: number; stdout?: Buffer; stderr?: Buffer }
    return {
      status: failure.status ?? 1,
      output: `${failure.stdout?.toString() || ''}${failure.stderr?.toString() || ''}`,
    }
  }
}

function writePbeFixture(
  workspace: string,
  files: {
    firstExpectedFile: string
    secondExpectedFile: string
  },
  options: {
    requirementStatus?: string
    deliveryStatus?: string
  } = {},
) {
  const blueprintRoot = join(workspace, '.pbe', 'blueprint')
  const acepRoot = join(workspace, '.pbe', 'codex-execution-pack')
  const taskRoot = join(acepRoot, '11-task-cards')
  mkdirSync(blueprintRoot, { recursive: true })
  mkdirSync(taskRoot, { recursive: true })

  const pbeState = {
    schemaVersion: 1,
    stage: 'acep_ready',
    mode: 'acep_generation',
    artifacts: {
      pbeRoutingContract: '.pbe/blueprint/pbe-routing-contract.md',
    },
    autoflow: {
      schemaVersion: 1,
      enabled: true,
      profile: 'full',
      state: 'ACEP_GENERATED',
      completedSteps: [
        'start',
        'rpd',
        'wpd',
        'vd',
        'dependency_impact_audit',
        'plan_execution',
        'coverage_audit',
        'ux_audit',
        'generate_acep',
      ],
      currentGate: null,
      nextStep: 'run_acep',
      deterministicSteps: [
        'rpd',
        'wpd',
        'vd',
        'dependency_impact_audit',
        'plan_execution',
        'coverage_audit',
        'ux_audit',
        'generate_acep',
        'run_acep',
      ],
      humanGates: [
        'ui_ux_confirm',
        'implementation_scope',
        'architecture_runway',
        'review_result',
        'next_slice_decision',
      ],
    },
  } as Record<string, unknown>
  if (options.deliveryStatus) {
    pbeState.deliveryStatus = options.deliveryStatus
  }
  writeJson(join(blueprintRoot, 'pbe-state.json'), pbeState)
  writeJson(join(blueprintRoot, 'requirement-tree.json'), {
    schemaVersion: 1,
    rootNodeId: 'REQ-1',
    nodes: [
      {
        id: 'REQ-1',
        title: 'Example requirement',
        status: options.requirementStatus || 'confirmed',
        children: [],
        uiImpact: 'none',
      },
    ],
  })
  writeJson(join(blueprintRoot, 'work-graph.json'), {
    schemaVersion: 1,
    id: 'WG',
    summary: 'Validator fixture graph',
    moduleBoundaryCheck: {
      status: 'complete',
      summary: 'No boundary blockers.',
    },
    nodes: [
      workGraphNode('WG-A', 'First feature', [files.firstExpectedFile], true),
      workGraphNode('WG-B', 'Second feature', [files.secondExpectedFile], true),
      workGraphNode('WG-INT', 'Integration', ['src/features/integration.ts'], false),
    ],
    edges: [],
  })
  writeJson(join(blueprintRoot, 'verification-design.json'), {
    schemaVersion: 1,
    verificationItems: [
      verificationItem('V-A'),
      verificationItem('V-B'),
      verificationItem('V-INT'),
    ],
  })
  writeJson(join(blueprintRoot, 'dependency-impact-audit.json'), {
    schemaVersion: 1,
    status: 'complete',
    futureItems: [],
    scopeDecisionRequired: false,
    architectureRunwayRequired: false,
    summary: 'No future impact.',
  })

  const traceability = {
    schemaVersion: 1,
    items: [
      {
        requirementNodeId: 'REQ-1',
        requirementTitle: 'Example requirement',
        linkedTaskIds: ['TASK-A', 'TASK-B', 'TASK-INT'],
        linkedVerificationIds: ['V-A', 'V-B', 'V-INT'],
        evidenceRequired: ['validation output'],
        evidenceCaptured: ['validator fixture'],
        coverageStatus: 'covered',
      },
    ],
  }
  writeJson(join(blueprintRoot, 'traceability-matrix.json'), traceability)

  for (const file of requiredAcepMarkdownFiles) {
    writeFileSync(join(acepRoot, file), `# ${file}\n`, 'utf8')
  }
  writeFileSync(join(taskRoot, 'task-a.md'), '# Task A\n\n## Execution Strategy\n', 'utf8')
  writeFileSync(join(taskRoot, 'task-b.md'), '# Task B\n\n## Execution Strategy\n', 'utf8')
  writeFileSync(join(taskRoot, 'task-int.md'), '# Task INT\n\n## Execution Strategy\n', 'utf8')

  writeJson(join(acepRoot, '04-traceability-matrix.json'), traceability)
  writeJson(join(acepRoot, '05-ui-ux-spec.json'), {
    schemaVersion: 1,
    screens: [],
  })
  writeJson(join(acepRoot, 'execution-manifest.json'), {
    schemaVersion: 1,
    autonomyLevel: 'autonomous_until_stop',
    executionStrategy: 'staged_parallel',
    parallelPolicy: {
      default: 'sequential',
      maxInitialParallelGroupSize: 2,
      maxMatureParallelGroupSize: 3,
      moreThanMaxRequiresHumanApproval: true,
    },
    phases: [
      {
        id: 'PHASE-1',
        title: 'Parallel phase',
        mode: 'parallel',
        parallelGroups: [
          {
            id: 'PG-1',
            tasks: ['TASK-A', 'TASK-B'],
            integrationTask: 'TASK-INT',
            integrationEvidenceRequired: true,
            groupCannotCompleteWithoutIntegrationPass: true,
            conflictRisk: 'low',
            requiredCompletedBeforeStart: [],
          },
        ],
      },
    ],
    tasks: [
      parallelTask('TASK-A', 'WG-A', 'V-A', files.firstExpectedFile, '11-task-cards/task-a.md'),
      parallelTask('TASK-B', 'WG-B', 'V-B', files.secondExpectedFile, '11-task-cards/task-b.md'),
      {
        ...parallelTask('TASK-INT', 'WG-INT', 'V-INT', 'src/features/integration.ts', '11-task-cards/task-int.md'),
        executionMode: 'integration',
        parallelGroup: 'PG-1',
        integrationTask: 'TASK-INT',
      },
    ],
    stopConditions: ['parallel_group_same_file_conflict'],
  })
}

function writeBlockingDecisionQueue(workspace: string) {
  const controlRoot = join(workspace, '.pbe', 'control')
  mkdirSync(controlRoot, { recursive: true })
  writeJson(join(controlRoot, 'decision-queue.json'), {
    version: '0.2.0-tree-control',
    decisions: [
      {
        id: 'DEC-ROOT',
        status: 'open',
        targetNodeId: 'REQ-1',
        reason: 'Root confirmation is required before downstream execution.',
        question: 'Should this Root requirement structure be confirmed?',
        blockingLevel: 'blocking',
      },
    ],
  })
}

const requiredAcepMarkdownFiles = [
  '00-readme.md',
  '01-autonomous-execution-policy.md',
  '02-project-blueprint.md',
  '03-requirement-tree.md',
  '04-traceability-matrix.md',
  '05-ui-ux-spec.md',
  '06-ui-ux-preview.md',
  '07-ui-ux-confirmation.md',
  '08-work-roadmap.md',
  '09-verification-plan.md',
  '10-codex-operating-loop.md',
  '12-validation-commands.md',
  '13-completion-criteria.md',
  '14-failure-recovery.md',
  '15-ui-ux-evidence-checklist.md',
  '16-final-coverage-check.md',
  '17-final-report-template.md',
  '18-execution-strategy.md',
  '19-source-of-truth-matrix.md',
  '20-foundation-contract.md',
  '21-parallel-safety-contract.md',
]

function workGraphNode(id: string, title: string, expectedFiles: string[], canRunInParallel: boolean) {
  return {
    id,
    title,
    type: canRunInParallel ? 'feature' : 'integration',
    scopeClass: 'selected',
    relatedRequirementNodeIds: ['REQ-1'],
    expectedFiles,
    expectedSharedFiles: [],
    forbiddenFiles: [],
    unknownFileTouchRisk: 'none',
    affectedDomains: ['domain-model'],
    expectedOutputs: ['changed files'],
    riskLevel: canRunInParallel ? 'low' : 'medium',
    canRunInParallel,
    mustRunSequentiallyReason: canRunInParallel ? undefined : 'Integration must run after the parallel group.',
    uiImpact: 'none',
  }
}

function verificationItem(id: string) {
  return {
    id,
    title: `${id} validation`,
    requirementIds: ['REQ-1'],
    evidenceToCapture: ['validation output'],
  }
}

function parallelTask(
  id: string,
  workGraphNodeId: string,
  verificationId: string,
  expectedFile: string,
  taskCard: string,
) {
  return {
    id,
    title: `${id} task`,
    taskCard,
    requirementIds: ['REQ-1'],
    verificationIds: [verificationId],
    evidenceRequired: ['validation output'],
    executionMode: 'parallel_group',
    scopeClass: 'selected',
    workGraphNodeIds: [workGraphNodeId],
    parallelGroup: 'PG-1',
    conflictRisk: 'low',
    expectedFiles: [expectedFile],
    expectedSharedFiles: [],
    forbiddenFiles: [],
    dependencyResolved: true,
    writeSetKnown: true,
    rollbackPathAvailable: true,
    uiImpact: 'none',
  }
}

function writeJson(file: string, value: unknown) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
