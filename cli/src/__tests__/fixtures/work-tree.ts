import { join } from 'node:path'
import { writeJson } from './workspace'

export function writeWorkTree(
  workspace: string,
  options: {
    dependencyCycle?: boolean
    workScopeClass?: string
    workStatus?: string
  } = {},
): void {
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
