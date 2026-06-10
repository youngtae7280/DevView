import type { NodeStatus } from './types'

export type NodeAction =
  | 'start_interview'
  | 'submit_answer'
  | 'decompose'
  | 'confirm_leaf'

export const STATUS_LABELS: Record<NodeStatus, string> = {
  needs_interview: 'Needs interview',
  interviewing: 'Interviewing',
  ready_to_decompose: 'Ready to decompose',
  expanded: 'Expanded',
  confirmed_leaf: 'Confirmed leaf',
}

const TRANSITIONS: Record<NodeAction, NodeStatus[]> = {
  start_interview: ['needs_interview', 'confirmed_leaf'],
  submit_answer: ['interviewing'],
  decompose: ['ready_to_decompose'],
  confirm_leaf: ['needs_interview', 'interviewing', 'ready_to_decompose'],
}

export function canRunAction(status: NodeStatus, action: NodeAction) {
  return TRANSITIONS[action].includes(status)
}

export function nextStatusForAction(action: NodeAction): NodeStatus {
  switch (action) {
    case 'start_interview':
      return 'interviewing'
    case 'submit_answer':
      return 'ready_to_decompose'
    case 'decompose':
      return 'expanded'
    case 'confirm_leaf':
      return 'confirmed_leaf'
  }
}
