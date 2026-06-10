import type { Project } from '../../../domain/types'
import type { ProjectBlueprint } from '../types'

export type AutonomyLevel =
  | 'manual_each_task'
  | 'manual_each_phase'
  | 'autonomous_until_stop'

export type AceFile = {
  path: string
  content: string
  kind: 'markdown' | 'json'
}

export type ExecutionManifest = {
  version: string
  mode: 'autonomous'
  projectName: string
  entrypoint: string
  policyFile: string
  operatingLoop: string
  tasks: {
    id: string
    file: string
    title: string
    dependsOn: string[]
    phase: string
    nodeId: string
  }[]
  requiredValidation: string[]
  completionCriteriaFile: string
  failureRecoveryFile: string
  finalReportTemplateFile: string
}

export type CodexTaskCard = {
  id: string
  nodeId: string
  title: string
  goal: string
  context: string
  scope: string[]
  nonScope: string[]
  expectedChanges: string[]
  acceptanceCriteria: string[]
  validationPlan: string[]
  evidenceRequired: string[]
  humanReviewPoints: string[]
  stopConditions: string[]
  dependencies: string[]
  prompt: string
}

export type AutonomousCodexExecutionPack = {
  id: string
  projectName: string
  autonomyLevel: AutonomyLevel
  files: AceFile[]
  manifest: ExecutionManifest
  taskCards: CodexTaskCard[]
  topLevelPrompt: string
  createdAt: string
}

export type GenerateAcePackInput = {
  project: Project
  blueprint: ProjectBlueprint
  autonomyLevel?: AutonomyLevel
}
