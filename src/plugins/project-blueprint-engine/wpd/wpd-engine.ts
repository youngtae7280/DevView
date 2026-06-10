import { getNodeFacts, getNodeTitle } from '../shared/tree-context'
import { createPbeId, nowIso } from '../shared/ids'
import type {
  GenerateImplementationRoadmapInput,
  GenerateLeafWorkDesignInput,
  ImplementationRoadmap,
  SynthesizeParentWorkDesignInput,
  WorkDesign,
  WorkProcessDesigner,
} from './wpd-types'

export class MockWorkProcessDesigner implements WorkProcessDesigner {
  async generateLeafWorkDesign(
    input: GenerateLeafWorkDesignInput,
  ): Promise<WorkDesign> {
    const timestamp = nowIso()
    const facts = input.facts.length > 0 ? input.facts : getNodeFacts(input.project, input.node)
    const context =
      facts.length > 0
        ? facts.join(' ')
        : input.node.summary ?? input.node.description

    return {
      id: createPbeId('work'),
      nodeId: input.node.id,
      type: 'leaf',
      status: 'ready_for_parent_synthesis',
      goal: `Implement the requirement captured by "${input.node.title}".`,
      context,
      scope: [
        input.node.summary ?? input.node.description,
        'Implement only behavior directly supported by the confirmed requirement leaf.',
      ],
      nonScope: [
        'Do not add unrelated product features.',
        'Do not perform deployment, payment, permission, or destructive data changes.',
      ],
      expectedOutputs: [
        'Focused source changes for the requirement leaf.',
        'Tests or validation notes proving the leaf behavior.',
      ],
      implementationTasks: [
        'Inspect the existing code and locate the smallest relevant module boundary.',
        'Implement the leaf behavior with a minimal coherent change.',
        'Add or update focused validation for the changed behavior.',
      ],
      dependencies: input.node.parentId
        ? [
            {
              nodeId: input.node.parentId,
              description: `Parent requirement: ${getNodeTitle(input.project, input.node.parentId)}`,
              reason: 'The parent defines the local product boundary for this leaf.',
            },
          ]
        : [],
      commonPrerequisites: [
        'Read the current repository instructions and package scripts.',
        'Preserve existing behavior outside the approved scope.',
      ],
      integrationTasks: [
        'Wire the implementation into the nearest existing flow.',
        'Confirm no sibling requirement behavior regressed.',
      ],
      acceptanceCriteria: [
        'The confirmed requirement is implemented in the smallest sensible scope.',
        'Focused validation passes or the unavailable validation is documented.',
      ],
      suggestedCycleSize:
        input.node.aiHints?.inferredComplexity === 'high'
          ? 'staged_cycle'
          : 'mini_cycle',
      humanReviewNotes: [
        'Human review is only required if a stop condition is reached.',
      ],
      stopConditions: [
        'The task requires credentials, payment, deployment, or destructive migration.',
        'The required change falls outside the confirmed requirement scope.',
        'The same validation failure repeats three times.',
      ],
      summary: `Leaf work design for ${input.node.title}.`,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  }

  async synthesizeParentWorkDesign(
    input: SynthesizeParentWorkDesignInput,
  ): Promise<WorkDesign> {
    const timestamp = nowIso()
    const type = input.node.parentId ? 'parent' : 'root'
    const childTitles = input.childDesigns
      .map((design) => getNodeTitle(input.project, design.nodeId))
      .join(', ')

    return {
      id: createPbeId('work'),
      nodeId: input.node.id,
      type,
      status: 'synthesized',
      goal: `Coordinate child work for "${input.node.title}".`,
      context: input.node.summary ?? input.node.description,
      scope: [
        `Coordinate these child designs: ${childTitles || 'No child designs listed.'}`,
        'Keep integration within the parent requirement boundary.',
      ],
      nonScope: [
        'Do not invent child requirements that were not produced by RPD.',
        'Do not expand scope beyond approved descendant work designs.',
      ],
      expectedOutputs: [
        'Integrated child behavior.',
        'A clear handoff between child requirement implementations.',
      ],
      implementationTasks: [
        'Complete child task cards in dependency order.',
        'Resolve integration seams between completed child tasks.',
        'Run parent-level validation once child work is complete.',
      ],
      dependencies: input.childDesigns.map((design) => ({
        nodeId: design.nodeId,
        description: `Child design: ${getNodeTitle(input.project, design.nodeId)}`,
        reason: 'Parent synthesis depends on child work design completion.',
      })),
      commonPrerequisites: unique(
        input.childDesigns.flatMap((design) => design.commonPrerequisites),
      ),
      integrationTasks: unique(
        input.childDesigns.flatMap((design) => design.integrationTasks),
      ),
      acceptanceCriteria: unique(
        input.childDesigns.flatMap((design) => design.acceptanceCriteria),
      ),
      suggestedCycleSize: input.childDesigns.some(
        (design) => design.suggestedCycleSize === 'high_risk_cycle',
      )
        ? 'high_risk_cycle'
        : 'staged_cycle',
      humanReviewNotes: unique(
        input.childDesigns.flatMap((design) => design.humanReviewNotes),
      ),
      stopConditions: unique(
        input.childDesigns.flatMap((design) => design.stopConditions),
      ),
      summary: `Synthesized ${type} work design from ${input.childDesigns.length} child design(s).`,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  }

  async generateImplementationRoadmap(
    input: GenerateImplementationRoadmapInput,
  ): Promise<ImplementationRoadmap> {
    const leafDesigns = Object.values(input.workDesigns)
      .filter((design) => design.type === 'leaf')
      .sort((left, right) => {
        const leftNode = input.project.nodes[left.nodeId]
        const rightNode = input.project.nodes[right.nodeId]
        return (leftNode?.depth ?? 0) - (rightNode?.depth ?? 0)
      })
    const orderedNodeIds = leafDesigns.map((design) => design.nodeId)
    const rootChildren = input.rootNode.children.filter((nodeId) =>
      orderedNodeIds.some((leafId) => isDescendantOf(input.project, leafId, nodeId)),
    )
    const phaseNodeGroups =
      rootChildren.length > 0
        ? rootChildren.map((nodeId) => ({
            anchorId: nodeId,
            nodeIds: orderedNodeIds.filter((leafId) =>
              isDescendantOf(input.project, leafId, nodeId),
            ),
          }))
        : [{ anchorId: input.rootNode.id, nodeIds: orderedNodeIds }]

    return {
      id: createPbeId('roadmap'),
      phases: phaseNodeGroups.map((group, index) => ({
        id: createPbeId('phase'),
        title: `Phase ${index + 1}: ${getNodeTitle(input.project, group.anchorId)}`,
        goal: `Complete work under ${getNodeTitle(input.project, group.anchorId)}.`,
        nodeIds: group.nodeIds,
        exitCriteria: [
          'All task cards in this phase are implemented.',
          'Focused validation for the phase passes or is documented.',
        ],
      })),
      dependencyGraph: orderedNodeIds.slice(1).map((nodeId, index) => ({
        fromNodeId: orderedNodeIds[index],
        toNodeId: nodeId,
        reason: 'Mock roadmap keeps leaf task cards in a conservative sequential order.',
      })),
      recommendedOrder: orderedNodeIds,
      globalPrerequisites: [
        'Inspect repository instructions before editing.',
        'Identify package manager and validation commands before task execution.',
        'Do not leave the approved RPD/WPD scope.',
      ],
      humanReviewPoints: [
        {
          id: createPbeId('review'),
          title: 'Stop-condition review',
          beforeNodeIds: orderedNodeIds,
          reason: 'Human review is required only if a stop condition occurs.',
          requiredDecision:
            'Decide whether to narrow scope, provide missing information, or stop.',
        },
      ],
      summary: `Implementation roadmap with ${orderedNodeIds.length} leaf task(s).`,
    }
  }
}

function isDescendantOf(
  project: GenerateImplementationRoadmapInput['project'],
  nodeId: string,
  ancestorId: string,
) {
  let cursor = project.nodes[nodeId]

  while (cursor) {
    if (cursor.id === ancestorId) {
      return true
    }
    cursor = cursor.parentId ? project.nodes[cursor.parentId] : undefined
  }

  return false
}

function unique(items: string[]) {
  return [...new Set(items.filter((item) => item.trim()))]
}
