import type { Project } from '../../../domain/types'
import type { RequirementNode } from '../rpd/rpd-types'
import type { WorkDesign } from '../wpd/wpd-types'

export type VerificationDesignType = 'leaf' | 'parent' | 'root'

export type VerificationDesignStatus =
  | 'not_started'
  | 'draft'
  | 'ready_for_parent_synthesis'
  | 'synthesized'
  | 'blocked'

export type VerificationDesign = {
  id: string
  nodeId: string
  type: VerificationDesignType
  status: VerificationDesignStatus
  verificationGoal: string
  testIdeas: string[]
  validationCommands: string[]
  evidenceRequired: string[]
  regressionRisks: string[]
  manualChecks: string[]
  parentIntegrationChecks: string[]
  acceptanceCriteria: string[]
  failureRecoveryNotes: string[]
  summary: string
  createdAt: string
  updatedAt: string
}

export type AcceptancePlan = {
  id: string
  rootAcceptanceCriteria: string[]
  integrationTestAreas: string[]
  regressionRiskAreas: string[]
  requiredEvidence: string[]
  suggestedValidationCommands: string[]
  manualReviewChecklist: string[]
  releaseReadinessChecks: string[]
  summary: string
}

export type GenerateLeafVerificationDesignInput = {
  project: Project
  node: RequirementNode
  workDesign: WorkDesign
}

export type SynthesizeParentVerificationDesignInput = {
  project: Project
  node: RequirementNode
  childDesigns: VerificationDesign[]
  workDesign?: WorkDesign
}

export type GenerateAcceptancePlanInput = {
  project: Project
  rootNode: RequirementNode
  verificationDesigns: Record<string, VerificationDesign>
  workDesigns: Record<string, WorkDesign>
}

export interface VerificationDesigner {
  generateLeafVerificationDesign(
    input: GenerateLeafVerificationDesignInput,
  ): Promise<VerificationDesign>
  synthesizeParentVerificationDesign(
    input: SynthesizeParentVerificationDesignInput,
  ): Promise<VerificationDesign>
  generateAcceptancePlan(input: GenerateAcceptancePlanInput): Promise<AcceptancePlan>
}
