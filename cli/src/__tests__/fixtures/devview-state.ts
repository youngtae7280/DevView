import { join } from 'node:path'
import { writeJson } from './workspace'

export function writeDevViewState(
  workspace: string,
  state: string,
  options: {
    completedSteps?: string[]
    currentGate?: string | null
    nextStep?: string | null
    deliveryStatus?: string
    profile?: 'full' | 'lite' | 'bypass'
    stateHistory?: Array<Record<string, unknown>>
    activeRevision?: Record<string, unknown>
    revisionHistory?: Array<Record<string, unknown>>
  } = {},
): void {
  writeJson(join(workspace, '.devview', 'blueprint', 'devview-state.json'), {
    version: '0.2.0-alpha',
    stage: 'product_intake',
    mode: 'product_intake_tree_walk',
    autoflow: {
      enabled: true,
      profile: options.profile || 'full',
      state,
      completedSteps: options.completedSteps || ['start', 'product_intake'],
      currentGate: options.currentGate ?? null,
      nextStep: options.nextStep ?? 'work_planning',
      stateHistory: options.stateHistory || [],
    },
    deliveryStatus: options.deliveryStatus || 'waiting_root_confirmation',
    activeRevision: options.activeRevision,
    revisionHistory: options.revisionHistory,
  })
}

export function writeUserAcceptance(workspace: string): void {
  writeJson(join(workspace, '.devview', 'control', 'acceptance-tree.json'), {
    version: '0.2.0-tree-control',
    branches: [
      {
        id: 'AB-1',
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
  writeJson(join(workspace, '.devview', 'control', 'acceptance-tree.json'), {
    version: '0.2.0-tree-control',
    branches: [],
  })
}
