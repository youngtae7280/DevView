import { validateTree } from '../../../domain/tree'
import type { Project } from '../../../domain/types'
import { getConfirmedRequirementLeaves } from '../shared/tree-context'

export function getRpdCompletionIssues(project: Project) {
  const issues: string[] = []

  if (!project.rootNodeId || !project.nodes[project.rootNodeId]) {
    issues.push('Root requirement node is missing.')
  }

  if (getConfirmedRequirementLeaves(project).length === 0) {
    issues.push('At least one confirmed_leaf requirement node is required.')
  }

  const treeValidation = validateTree(project)
  if (!treeValidation.valid) {
    issues.push(...treeValidation.errors)
  }

  const blockedSessions = Object.values(project.interviewSessions).filter(
    (session) => session.status === 'blocked',
  )
  if (blockedSessions.length > 0) {
    issues.push('Blocked interview sessions must be resolved before WPD.')
  }

  return issues
}

export function canCompleteRpd(project: Project) {
  return getRpdCompletionIssues(project).length === 0
}
