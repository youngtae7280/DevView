import { join } from 'node:path'
import { writeJson } from './workspace'

export function writePbeState(
  workspace: string,
  state: string,
  options: {
    completedSteps?: string[]
    currentGate?: string | null
    nextStep?: string | null
    deliveryStatus?: string
    stateHistory?: Array<Record<string, unknown>>
  } = {},
): void {
  writeJson(join(workspace, '.pbe', 'blueprint', 'pbe-state.json'), {
    version: '0.2.0-alpha',
    stage: 'rpd',
    mode: 'rpd_tree_walk',
    autoflow: {
      enabled: true,
      profile: 'full',
      state,
      completedSteps: options.completedSteps || ['start', 'rpd'],
      currentGate: options.currentGate ?? null,
      nextStep: options.nextStep ?? 'wpd',
      stateHistory: options.stateHistory || [],
    },
    deliveryStatus: options.deliveryStatus || 'waiting_root_confirmation',
  })
}

export function writeUserAcceptance(workspace: string): void {
  writeJson(join(workspace, '.pbe', 'control', 'acceptance-tree.json'), {
    version: '0.2.0-tree-control',
    branches: [
      {
        productNodeId: 'PT-1',
        status: 'accepted_done',
        decisionSource: {
          actor: 'user',
          source: 'explicit_user_reply',
        },
        evidenceNodeIds: ['EV-1'],
      },
    ],
  })
}

export function writeEmptyAcceptance(workspace: string): void {
  writeJson(join(workspace, '.pbe', 'control', 'acceptance-tree.json'), {
    version: '0.2.0-tree-control',
    branches: [],
  })
}
