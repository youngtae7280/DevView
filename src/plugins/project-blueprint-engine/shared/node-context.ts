import type { Project } from '../../../domain/types'
import { getNodeFacts } from './tree-context'

export function createNodeContext(project: Project, nodeId: string) {
  const node = project.nodes[nodeId]

  if (!node) {
    return null
  }

  return {
    node,
    parent: node.parentId ? project.nodes[node.parentId] ?? null : null,
    children: node.children
      .map((childId) => project.nodes[childId])
      .filter(Boolean),
    facts: getNodeFacts(project, node),
  }
}
