import type { Project } from '../../../domain/types'
import type { RequirementNode } from '../rpd/rpd-types'

export function getConfirmedRequirementLeaves(project: Project) {
  return Object.values(project.nodes).filter(
    (node) => node.status === 'confirmed_leaf',
  )
}

export function getNodeFacts(project: Project, node: RequirementNode) {
  return node.interviewSessionIds.flatMap((sessionId) => {
    const session = project.interviewSessions[sessionId]
    return session ? session.extractedFacts.map((fact) => fact.text) : []
  })
}

export function getNodesBottomUp(project: Project) {
  return Object.values(project.nodes).sort((left, right) => right.depth - left.depth)
}

export function getNodeLineage(project: Project, node: RequirementNode) {
  const lineage: RequirementNode[] = []
  let cursor: RequirementNode | undefined = node

  while (cursor) {
    lineage.unshift(cursor)
    cursor = cursor.parentId ? project.nodes[cursor.parentId] : undefined
  }

  return lineage
}

export function getNodeTitle(project: Project, nodeId: string) {
  return project.nodes[nodeId]?.title ?? nodeId
}
