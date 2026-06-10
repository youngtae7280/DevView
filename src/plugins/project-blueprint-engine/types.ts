import type { InterviewSession } from '../../domain/types'
import type { AutonomousCodexExecutionPack } from './acep/acep-types'
import type { RequirementNode } from './rpd/rpd-types'
import type { AcceptancePlan, VerificationDesign } from './vd/vd-types'
import type { ImplementationRoadmap, WorkDesign } from './wpd/wpd-types'

export type ProjectBlueprintStatus =
  | 'rpd_in_progress'
  | 'rpd_completed'
  | 'wpd_in_progress'
  | 'wpd_completed'
  | 'vd_in_progress'
  | 'vd_completed'
  | 'acep_ready'
  | 'exported'

export type ProjectBlueprint = {
  id: string
  name: string
  status: ProjectBlueprintStatus
  rootNodeId: string
  requirementNodes: Record<string, RequirementNode>
  interviewSessions: Record<string, InterviewSession>
  workDesigns: Record<string, WorkDesign>
  verificationDesigns: Record<string, VerificationDesign>
  implementationRoadmap?: ImplementationRoadmap
  acceptancePlan?: AcceptancePlan
  acep?: AutonomousCodexExecutionPack
  createdAt: string
  updatedAt: string
}
