import { join } from 'node:path'
import { writeJson, writeText } from './workspace'

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
