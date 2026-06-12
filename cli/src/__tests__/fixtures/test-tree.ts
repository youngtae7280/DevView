import { join } from 'node:path'
import { writeJson } from './workspace'

export function writeTestTree(
  workspace: string,
  options: {
    verifiesWork?: boolean
    verifiesAcceptanceCriteria?: boolean
    testType?: string
    evidenceRequired?: string[]
  } = {},
): void {
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
