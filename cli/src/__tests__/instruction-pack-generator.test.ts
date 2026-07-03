import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runPbeCli } from '../app'
import { generateInstructionPack, renderInstructionPackMarkdown } from '../core/instruction-pack-generator'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Instruction Pack generator core', () => {
  it('generates a frontend instruction pack from contract input without execution', () => {
    const result = generateInstructionPack(validContractInput(), 'contract-input.json')

    expect(result.status).toBe('instruction-pack-generated')
    expect(result.instructionPackGenerated).toBe(true)
    expect(result.codexExecutionTriggered).toBe(false)
    expect(result.graphSourceMutated).toBe(false)
    expect(result.graphDeltaApplied).toBe(false)
    expect(result.approvalStatus).toBe('not-approved')
    expect(result.equivalenceProven).toBe(false)
    expect(result.runtimeEvidenceSatisfied).toBe(false)
    expect(result.scopeEnforced).toBe(false)
    expect(result.ciEnforcementEnabled).toBe(false)
    expect(result.allowedScope.map((entry) => entry.id)).toEqual(['allowed-scope-tt-1', 'allowed-scope-ev-1'])
    const allowedScopePaths = result.allowedScope.flatMap((entry) => entry.paths as string[])
    expect(allowedScopePaths).not.toContain('examples/valid/todo-app-pbe-run/.pbe/control/change-tree.json')
    expect(allowedScopePaths).not.toContain('examples/valid/todo-app-pbe-run/.pbe/tree/work-tree.json')
    expect(result.forbiddenScope).toContainEqual(
      expect.objectContaining({
        id: 'forbidden-production-source-changes',
        paths: ['unresolved:production-source-changes'],
      }),
    )
    expect(result.requiredEvidence.map((entry) => entry.id)).toContain('required-evidence-ev-1')
    expect(result.outputRequirements.length).toBeGreaterThan(0)
    expect(result.stopConditions.length).toBeGreaterThan(0)
    expect(result.knownRisks.length).toBeGreaterThan(0)
    expect(result.executionInstructions.join('\n')).toContain('Unresolved forbidden scope markers remain forbidden')
  })

  it('blocks when contract input prerequisites are unsafe', () => {
    const input = {
      ...validContractInput(),
      contractInputGenerated: false,
      approvalStatus: 'approved',
    }

    const result = generateInstructionPack(input)

    expect(result.status).toBe('instruction-pack-blocked')
    expect(result.instructionPackGenerated).toBe(false)
    expect(result.codexExecutionTriggered).toBe(false)
    expect(result.humanReviewRequired).toBe(true)
    expect(result.validationFindings).toContainEqual(
      expect.objectContaining({
        code: 'INSTRUCTION_PACK_CONTRACT_INPUT_PREREQUISITE_UNSAFE',
        field: 'contractInputGenerated',
        severity: 'error',
      }),
    )
    expect(result.validationFindings).toContainEqual(
      expect.objectContaining({
        code: 'INSTRUCTION_PACK_CONTRACT_INPUT_PREREQUISITE_UNSAFE',
        field: 'approvalStatus',
        severity: 'error',
      }),
    )
  })

  it('renders markdown review instructions without approval or enforcement claims', () => {
    const result = generateInstructionPack(validContractInput(), 'contract-input.json')
    const markdown = renderInstructionPackMarkdown(result)

    expect(markdown).toContain('## Allowed Scope')
    expect(markdown).toContain('## Forbidden Scope')
    expect(markdown).toContain('## Required Evidence')
    expect(markdown).toContain('## Stop Conditions')
    expect(markdown).toContain('This pack is not approval.')
    expect(markdown).toContain('This pack does not trigger Codex execution.')
    expect(markdown).toContain('This pack does not satisfy runtime Evidence.')
    expect(markdown).toContain('This pack does not enforce scope or CI.')
    expect(markdown).not.toContain('runtime Evidence satisfied')
    expect(markdown).not.toContain('approved execution')
  })
})

describe('Instruction Pack generator CLI', () => {
  it('writes only explicit JSON and Markdown outputs without mutating inputs', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'contract-input.json'), validContractInput())
    writeJson(join(workspace, 'graph-source.json'), { sourceRecords: { nodes: [], edges: [] } })
    const contractInputBefore = readFileSync(join(workspace, 'contract-input.json'), 'utf8')
    const graphSourceBefore = readFileSync(join(workspace, 'graph-source.json'), 'utf8')
    const outputPath = join('.tmp', 'instruction-pack.json')
    const markdownPath = join('.tmp', 'instruction-pack.md')

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'generate-instruction-pack',
        '--contract-input',
        'contract-input.json',
        '--output',
        outputPath,
        '--markdown',
        markdownPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))
    const markdown = readFileSync(join(workspace, markdownPath), 'utf8')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('graph read-model generate-instruction-pack')
    expect(payload.outputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(payload.markdownReport).toBe(markdownPath.replaceAll('\\', '/'))
    expect(payload.instructionPackGenerated).toBe(true)
    expect(payload.codexExecutionTriggered).toBe(false)
    expect(payload.graphSourceMutated).toBe(false)
    expect(payload.graphDeltaApplied).toBe(false)
    expect(written.artifactRole).toBe('instruction-pack')
    expect(written.writtenOutputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(written.markdownReportPath).toBe(markdownPath.replaceAll('\\', '/'))
    expect(markdown).toContain('# Frontend Instruction Pack')
    expect(markdown).toContain('This pack does not mutate graph-source.')
    expect(existsSync(join(workspace, outputPath))).toBe(true)
    expect(readFileSync(join(workspace, 'contract-input.json'), 'utf8')).toBe(contractInputBefore)
    expect(readFileSync(join(workspace, 'graph-source.json'), 'utf8')).toBe(graphSourceBefore)
  })
})

function validContractInput(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'contract-compiler-input',
    status: 'contract-compiler-input-generated',
    sourceSelectedGraphSlice:
      'examples/valid/todo-app-pbe-run/generated/selected-graph-slice.add-todo-runtime-evidence-only.preview.json',
    sourceTraversalPlan:
      'examples/valid/todo-app-pbe-run/generated/graph-traversal-plan.add-todo-runtime-evidence-only.preview.json',
    sourceGraphAwareValidation:
      'examples/valid/todo-app-pbe-run/generated/request-ir-graph-validation.add-todo-runtime-evidence-only.preview.json',
    graphSourcePath: 'examples/valid/todo-app-pbe-run/graph-source.json',
    generatedReadModelPath: 'examples/valid/todo-app-pbe-run/generated/generated-read-model.json',
    changeId: 'change-ch-001-contract-input-preview',
    contractInputGenerated: true,
    instructionPackGenerated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    humanRequest: {
      text: 'Add Todo App runtime evidence only without production source edits.',
      authorityStatus: 'trace-context-not-approval',
    },
    graphSnapshot: {
      artifacts: [
        {
          id: 'todo-app-graph-source',
          path: 'examples/valid/todo-app-pbe-run/graph-source.json',
          role: 'graph source authority',
        },
      ],
    },
    packSchema: {
      changeType: 'test-only-behavior-proof',
    },
    policySnapshot: {
      policies: [{ id: 'runtime-evidence-only-no-production-source', status: 'policy-active' }],
    },
    evidenceIndex: {
      entries: [
        {
          id: 'evidence-ev-1',
          artifact: 'examples/valid/todo-app-pbe-run/.pbe/evidence/test-results/todo-add.txt',
        },
      ],
    },
    targetScopeCandidates: [
      {
        id: 'scope-ch-001',
        scopeKind: 'product',
        paths: ['examples/valid/todo-app-pbe-run/.pbe/control/change-tree.json'],
        contextOnly: true,
      },
      {
        id: 'scope-wt-1',
        scopeKind: 'workflow',
        paths: ['examples/valid/todo-app-pbe-run/.pbe/tree/work-tree.json'],
        contextOnly: true,
      },
      {
        id: 'scope-tt-1',
        scopeKind: 'test',
        paths: ['examples/valid/todo-app-pbe-run/.pbe/tree/test-tree.json'],
      },
      {
        id: 'scope-ev-1',
        scopeKind: 'evidence',
        paths: [
          'examples/valid/todo-app-pbe-run/.pbe/evidence/evidence-tree.json',
          'examples/valid/todo-app-pbe-run/.pbe/evidence/test-results/todo-add.txt',
        ],
      },
    ],
    allowedScope: [
      {
        id: 'allowed-scope-tt-1',
        scopeKind: 'test',
        paths: ['examples/valid/todo-app-pbe-run/.pbe/tree/test-tree.json'],
      },
      {
        id: 'allowed-scope-ev-1',
        scopeKind: 'evidence',
        paths: [
          'examples/valid/todo-app-pbe-run/.pbe/evidence/evidence-tree.json',
          'examples/valid/todo-app-pbe-run/.pbe/evidence/test-results/todo-add.txt',
        ],
      },
    ],
    forbiddenScope: [
      {
        id: 'forbidden-production-source-changes',
        scopeKind: 'code',
        paths: ['unresolved:production-source-changes'],
        sourceStatus: 'unresolved-from-request-intent-not-derived-from-selected-slice',
      },
      {
        id: 'forbidden-graph-source-mutation',
        scopeKind: 'graph',
        paths: ['examples/valid/todo-app-pbe-run/graph-source.json'],
      },
      {
        id: 'forbidden-approval-or-acceptance-changes',
        scopeKind: 'product',
        paths: ['examples/valid/todo-app-pbe-run/.pbe/control/acceptance-tree.json'],
      },
    ],
    requiredEvidence: [
      {
        id: 'required-evidence-ev-1',
        artifact: 'examples/valid/todo-app-pbe-run/.pbe/evidence/test-results/todo-add.txt',
        runtimeEvidenceSatisfied: false,
      },
    ],
    outputRequirements: [
      {
        id: 'output-report-selected-evidence-status',
        requiredReportTarget: 'Report selected evidence/check status for EV-1.',
      },
    ],
    stopConditions: [
      {
        id: 'stop-if-selected-evidence-unavailable',
        condition: 'Selected evidence/check nodes cannot be reviewed or linked to command output.',
      },
    ],
    knownRisks: [
      {
        id: 'risk-im-001-scope-drift',
        mitigation: 'Review selected slice finding before contract generation.',
      },
    ],
    mappingTrace: [
      {
        targetField: 'allowedScope',
        sourceTargetScopeCandidate: 'scope-ev-1',
      },
    ],
    validationFindings: [
      {
        code: 'CONTRACT_INPUT_FORBIDDEN_SCOPE_PATH_UNRESOLVED',
        severity: 'warning',
        message: 'Production source changes are forbidden but unresolved.',
      },
    ],
  }
}
