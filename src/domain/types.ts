import type { ProjectBlueprint } from '../plugins/project-blueprint-engine/types'

export type NodeStatus =
  | 'needs_interview'
  | 'interviewing'
  | 'ready_to_decompose'
  | 'expanded'
  | 'confirmed_leaf'

export type InterviewSessionStatus =
  | 'active'
  | 'ready_to_decompose'
  | 'completed'
  | 'blocked'

export type InterviewMessageRole = 'ai' | 'user' | 'system'

export type InterviewTurnDecision =
  | 'ask_next_question'
  | 'ready_to_decompose'
  | 'suggest_confirm_leaf'
  | 'needs_clarification'
  | 'blocked'

export type ExtractedFactConfidence = 'low' | 'medium' | 'high'

export type SuggestedNextAction = 'interview' | 'decompose' | 'confirm_leaf'

export type InferredComplexity = 'low' | 'medium' | 'high'

export type AiHints = {
  suggestedNextAction?: SuggestedNextAction
  caution?: string
  inferredComplexity?: InferredComplexity
}

export type InterviewMessage = {
  id: string
  role: InterviewMessageRole
  content: string
  createdAt: string
}

export type ExtractedFact = {
  id: string
  nodeId: string
  text: string
  sourceMessageId: string
  confidence: ExtractedFactConfidence
}

export type InterviewSession = {
  id: string
  nodeId: string
  status: InterviewSessionStatus
  messages: InterviewMessage[]
  extractedFacts: ExtractedFact[]
  unresolvedQuestions: string[]
  currentDecision: InterviewTurnDecision
  startedAt: string
  updatedAt: string
}

export type ProgramNode = {
  id: string
  parentId: string | null
  title: string
  description: string
  depth: number
  status: NodeStatus
  children: string[]
  summary?: string
  userNote?: string
  interviewSessionIds: string[]
  aiHints?: AiHints
  userIntent?: string
  createdAt: string
  updatedAt: string
}

export type ProgramEdge = {
  id: string
  source: string
  target: string
  label?: string
}

export type GeneratedArtifacts = {
  productCharter: string
  requirementTree: string
  workUnitList: string
  architectureDraft: string
  implementationPlan: string
  verificationPlan: string
  aiCodingPrompt: string
  generatedAt: string
}

export type Project = {
  id: string
  title: string
  rootNodeId: string | null
  nodes: Record<string, ProgramNode>
  edges: ProgramEdge[]
  interviewSessions: Record<string, InterviewSession>
  artifacts: GeneratedArtifacts | null
  pbe?: ProjectBlueprint | null
  createdAt: string
  updatedAt: string
  schemaVersion: 2
}

export type ProjectWarning = {
  nodeId: string
  message: string
  severity: 'info' | 'warning' | 'critical'
}

export const NODE_STATUSES: NodeStatus[] = [
  'needs_interview',
  'interviewing',
  'ready_to_decompose',
  'expanded',
  'confirmed_leaf',
]

export const INTERVIEW_LIMITS = {
  minQuestions: 1,
  defaultSoftLimit: 3,
  complexHardLimit: 7,
} as const
