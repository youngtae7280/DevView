import { join } from 'node:path'
import { writeJson, writeText } from './workspace'

export function writeDependencyImpactAudit(workspace: string): void {
  writeJson(join(workspace, '.pbe', 'blueprint', 'dependency-impact-audit.json'), {
    schemaVersion: 1,
    status: 'passed',
    items: [],
  })
  writeText(
    join(workspace, '.pbe', 'blueprint', 'dependency-impact-audit.md'),
    '# Dependency Impact Audit\n\nPassed.\n',
  )
}

export function writeExecutionStrategy(workspace: string): void {
  writeJson(join(workspace, '.pbe', 'execution', 'cycle-tree.json'), {
    version: '0.2.0-tree-control',
    cycles: [{ id: 'CYCLE-1', status: 'selected', workNodeIds: ['WT-1'], testNodeIds: ['TT-1'] }],
  })
  writeText(join(workspace, '.pbe', 'execution', 'cycle-contract.md'), '# Cycle Contract\n\nSelected work: WT-1.\n')
  writeJson(join(workspace, '.pbe', 'blueprint', 'execution-strategy.json'), {
    schemaVersion: 1,
    strategy: 'sequential',
    phases: [{ id: 'phase-1', type: 'feature', taskIds: ['TASK-1'] }],
    parallelGroups: [],
  })
  writeText(join(workspace, '.pbe', 'blueprint', 'execution-strategy.md'), '# Execution Strategy\n\nSequential.\n')
}

export function writeCoverageAudit(workspace: string): void {
  writeText(join(workspace, '.pbe', 'blueprint', 'coverage-audit.md'), '# Coverage Audit\n\nPassed.\n')
}

export function writeUxAudit(workspace: string): void {
  writeText(join(workspace, '.pbe', 'blueprint', 'ux-audit.md'), '# UX Audit\n\nNot required or passed.\n')
}

export function writeExecutionManifest(workspace: string, options: { taskScopeClass?: string } = {}): void {
  writeJson(join(workspace, '.pbe', 'codex-execution-pack', 'execution-manifest.json'), {
    schemaVersion: 1,
    autonomyLevel: 'autonomous_until_stop',
    deliveryStatus: 'submitted_for_review',
    tasks: [
      {
        id: 'TASK-1',
        title: 'Implement status',
        file: '11-task-cards/TASK-1.md',
        scopeClass: options.taskScopeClass || 'selected',
        workGraphNodeIds: ['WT-1'],
        requirementIds: ['PT-1'],
        verificationIds: ['TT-1'],
        evidenceRequired: ['test output'],
      },
    ],
    phases: [],
    stopConditions: ['Any gate failure stops execution.'],
  })
}

export function writeFinalCoverage(workspace: string): void {
  writeText(join(workspace, '.pbe', 'codex-execution-pack', '16-final-coverage-check.md'), '# Final Coverage\n')
}
