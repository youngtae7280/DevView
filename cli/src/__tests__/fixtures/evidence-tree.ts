import { join } from 'node:path'
import { writeJson, writeText } from './workspace'

export function writeEvidenceTree(workspace: string, options: { path?: string } = {}): void {
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

export function writeVisualScreenshotEvidence(workspace: string): void {
  const screenshotPath = join(workspace, '.pbe', 'evidence', 'screenshots', 'surface-1-default.png')
  writeText(screenshotPath, 'fake screenshot bytes')
  writeJson(join(workspace, '.pbe', 'evidence', 'evidence-tree.json'), {
    version: '0.2.0-tree-control',
    evidence: [
      {
        id: 'EV-VISUAL-1',
        type: 'screenshot',
        status: 'attached',
        path: '.pbe/evidence/screenshots/surface-1-default.png',
        provesNodeIds: ['TT-1'],
        evidenceForTestNodeIds: ['TT-1'],
        evidenceForAcceptanceCriteriaIds: ['AC-PT-1-1'],
      },
    ],
  })
}
