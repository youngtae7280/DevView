import type { Project } from '../../../domain/types'
import type { RequirementNode } from '../rpd/rpd-types'

export type WorkDesignType = 'leaf' | 'parent' | 'root'

export type WorkDesignStatus =
  | 'not_started'
  | 'draft'
  | 'ready_for_parent_synthesis'
  | 'synthesized'
  | 'blocked'

export type SuggestedCycleSize =
  | 'single_pass'
  | 'mini_cycle'
  | 'staged_cycle'
  | 'high_risk_cycle'

export type WorkDependency = {
  nodeId?: string
  description: string
  reason: string
}

export type WorkDesign = {
  id: string
  nodeId: string
  type: WorkDesignType
  status: WorkDesignStatus
  goal: string
  context: string
  scope: string[]
  nonScope: string[]
  expectedOutputs: string[]
  implementationTasks: string[]
  dependencies: WorkDependency[]
  commonPrerequisites: string[]
  integrationTasks: string[]
  acceptanceCriteria: string[]
  suggestedCycleSize: SuggestedCycleSize
  humanReviewNotes: string[]
  stopConditions: string[]
  summary: string
  createdAt: string
  updatedAt: string
}

export type ImplementationRoadmap = {
  id: string
  phases: {
    id: string
    title: string
    goal: string
    nodeIds: string[]
    taskCardIds?: string[]
    exitCriteria: string[]
  }[]
  dependencyGraph: {
    fromNodeId: string
    toNodeId: string
    reason: string
  }[]
  recommendedOrder: string[]
  globalPrerequisites: string[]
  humanReviewPoints: {
    id: string
    title: string
    beforeNodeIds: string[]
    reason: string
    requiredDecision: string
  }[]
  summary: string
}

export type GenerateLeafWorkDesignInput = {
  project: Project
  node: RequirementNode
  facts: string[]
}

export type SynthesizeParentWorkDesignInput = {
  project: Project
  node: RequirementNode
  childDesigns: WorkDesign[]
}

export type GenerateImplementationRoadmapInput = {
  project: Project
  rootNode: RequirementNode
  workDesigns: Record<string, WorkDesign>
}

export interface WorkProcessDesigner {
  generateLeafWorkDesign(input: GenerateLeafWorkDesignInput): Promise<WorkDesign>
  synthesizeParentWorkDesign(
    input: SynthesizeParentWorkDesignInput,
  ): Promise<WorkDesign>
  generateImplementationRoadmap(
    input: GenerateImplementationRoadmapInput,
  ): Promise<ImplementationRoadmap>
}
