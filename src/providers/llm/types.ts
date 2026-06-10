import type {
  ExtractedFact,
  GeneratedArtifacts,
  InterviewSession,
  InterviewTurnDecision,
  ProgramNode,
  Project,
  SuggestedNextAction,
} from '../../domain/types'

export type DecomposeNodeInput = {
  project: Project
  node: ProgramNode
}

export type DecomposeNodeOutput = {
  children: ProgramNode[]
  notes: string[]
}

export type GenerateInitialQuestionInput = {
  project: Project
  node: ProgramNode
  parentNode?: ProgramNode
}

export type GenerateQuestionOutput = {
  question: string
  reason: string
}

export type AnalyzeInterviewTurnInput = {
  project: Project
  node: ProgramNode
  session: InterviewSession
}

export type AnalyzeInterviewTurnOutput = {
  decision: InterviewTurnDecision
  nextQuestion?: string
  extractedFacts: ExtractedFact[]
  nodeSummary?: string
  suggestedNextAction?: SuggestedNextAction
  caution?: string
}

export type GenerateArtifactsInput = {
  project: Project
}

export type GenerateArtifactsOutput = {
  artifacts: GeneratedArtifacts
  warnings: string[]
}

export type LlmProviderName = 'mock' | 'openai'

export type LlmProviderStatus = {
  requestedProvider: string
  activeProvider: LlmProviderName
  model?: string
  fallbackReason?: string
  lastFallbackReason?: string
}

export type ProviderFallbackEvent = {
  operation: keyof Pick<
    LlmProvider,
    | 'generateInitialQuestion'
    | 'analyzeInterviewTurn'
    | 'decomposeNode'
    | 'generateArtifacts'
  >
  reason: string
}

export interface LlmProvider {
  readonly providerName: string
  getStatus(): LlmProviderStatus
  generateInitialQuestion(
    input: GenerateInitialQuestionInput,
  ): Promise<GenerateQuestionOutput>
  analyzeInterviewTurn(
    input: AnalyzeInterviewTurnInput,
  ): Promise<AnalyzeInterviewTurnOutput>
  decomposeNode(input: DecomposeNodeInput): Promise<DecomposeNodeOutput>
  generateArtifacts(
    input: GenerateArtifactsInput,
  ): Promise<GenerateArtifactsOutput>
}
