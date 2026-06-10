import { getProjectWarnings, getTreeSummary } from '../../domain/tree'
import type { InterviewMessage, ProgramNode, Project } from '../../domain/types'
import { MockLlmProvider } from './mockProvider'
import type {
  AnalyzeInterviewTurnInput,
  AnalyzeInterviewTurnOutput,
  DecomposeNodeInput,
  DecomposeNodeOutput,
  GenerateArtifactsInput,
  GenerateArtifactsOutput,
  GenerateInitialQuestionInput,
  GenerateQuestionOutput,
  LlmProvider,
  LlmProviderStatus,
  ProviderFallbackEvent,
} from './types'
import type {
  GenerateAcePackInput,
  AutonomousCodexExecutionPack,
} from '../../plugins/project-blueprint-engine/acep/acep-types'
import type { PbeLlmProvider } from '../../plugins/project-blueprint-engine/shared/llm-provider'
import type {
  AcceptancePlan,
  GenerateAcceptancePlanInput,
  GenerateLeafVerificationDesignInput,
  SynthesizeParentVerificationDesignInput,
  VerificationDesign,
} from '../../plugins/project-blueprint-engine/vd/vd-types'
import type {
  GenerateImplementationRoadmapInput,
  GenerateLeafWorkDesignInput,
  ImplementationRoadmap,
  SynthesizeParentWorkDesignInput,
  WorkDesign,
} from '../../plugins/project-blueprint-engine/wpd/wpd-types'
import {
  validateAnalyzeInterviewTurnOutput,
  validateDecomposeNodeOutput,
  validateGenerateArtifactsOutput,
  validateGenerateQuestionOutput,
} from './validation'

const DEFAULT_OPENAI_CHAT_COMPLETIONS_URL = '/api/openai/v1/chat/completions'
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini'
const COMMON_SYSTEM_PROMPT = [
  'You are the AI engine for Recursive Program Designer.',
  '',
  'RPD is not a coding tool. It is a requirement clarification tool.',
  'Your job is to help turn a vague software idea into a requirement tree.',
  '',
  'Rules:',
  '- Ask one question at a time.',
  '- Questions must be open-ended and free-text friendly.',
  '- Do not ask multiple questions in one response.',
  '- Do not provide multiple-choice options.',
  '- Focus on user role, usage context, expected result, business rule, data flow, and success criteria.',
  '- Avoid premature implementation details unless the user already mentioned them.',
  '- Return only valid JSON matching the requested schema.',
  '- Do not include markdown.',
  '- Do not mutate application state.',
].join('\n')

type FetchLike = typeof fetch

type OpenAiProviderOptions = {
  apiKey: string
  model?: string
  endpoint?: string
  sendAuthorizationHeader?: boolean
  fetchImpl?: FetchLike
}

type CreateConfiguredProviderOptions = {
  env?: Record<string, string | undefined>
  fetchImpl?: FetchLike
  onFallback?: (event: ProviderFallbackEvent) => void
}

type OpenAiJsonInput<T> = {
  apiKey: string
  model: string
  endpoint: string
  sendAuthorizationHeader: boolean
  fetchImpl: FetchLike
  schemaName: string
  schema: Record<string, unknown>
  userPrompt: string
  validate: (value: unknown) => T
}

export class OpenAiLlmProvider implements LlmProvider {
  readonly providerName = 'openai'
  readonly model: string
  private readonly apiKey: string
  private readonly endpoint: string
  private readonly sendAuthorizationHeader: boolean
  private readonly fetchImpl: FetchLike

  constructor(options: OpenAiProviderOptions) {
    this.apiKey = options.apiKey
    this.model = options.model?.trim() || DEFAULT_OPENAI_MODEL
    this.endpoint = options.endpoint?.trim() || DEFAULT_OPENAI_CHAT_COMPLETIONS_URL
    this.sendAuthorizationHeader = options.sendAuthorizationHeader ?? true
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  getStatus(): LlmProviderStatus {
    return {
      requestedProvider: 'openai',
      activeProvider: 'openai',
      model: this.model,
    }
  }

  async generateInitialQuestion(
    input: GenerateInitialQuestionInput,
  ): Promise<GenerateQuestionOutput> {
    return callOpenAiJson({
      apiKey: this.apiKey,
      model: this.model,
      endpoint: this.endpoint,
      sendAuthorizationHeader: this.sendAuthorizationHeader,
      fetchImpl: this.fetchImpl,
      schemaName: 'rpd_initial_question',
      schema: initialQuestionSchema,
      userPrompt: [
        'Create the first interview question for the selected node.',
        'Return JSON with exactly one question and a short reason.',
        '',
        contextBlock(input.project, input.node, input.parentNode),
      ].join('\n'),
      validate: validateGenerateQuestionOutput,
    })
  }

  async analyzeInterviewTurn(
    input: AnalyzeInterviewTurnInput,
  ): Promise<AnalyzeInterviewTurnOutput> {
    return callOpenAiJson({
      apiKey: this.apiKey,
      model: this.model,
      endpoint: this.endpoint,
      sendAuthorizationHeader: this.sendAuthorizationHeader,
      fetchImpl: this.fetchImpl,
      schemaName: 'rpd_interview_turn_analysis',
      schema: interviewTurnSchema,
      userPrompt: [
        'Analyze the latest user answer and decide the next interview state.',
        'Use ask_next_question or needs_clarification only when a single nextQuestion is needed.',
        'Use ready_to_decompose only when role, usage situation, expected result, and major rules are clear enough.',
        'Use suggest_confirm_leaf when the node is already small enough for RPD requirement decomposition.',
        '',
        contextBlock(input.project, input.node),
        '',
        'Interview messages:',
        JSON.stringify(serializeMessages(input.session.messages), null, 2),
        '',
        'Existing extracted facts:',
        JSON.stringify(input.session.extractedFacts, null, 2),
      ].join('\n'),
      validate: (value) => validateAnalyzeInterviewTurnOutput(value, input.node.id),
    })
  }

  async decomposeNode(input: DecomposeNodeInput): Promise<DecomposeNodeOutput> {
    return callOpenAiJson({
      apiKey: this.apiKey,
      model: this.model,
      endpoint: this.endpoint,
      sendAuthorizationHeader: this.sendAuthorizationHeader,
      fetchImpl: this.fetchImpl,
      schemaName: 'rpd_decompose_node',
      schema: decomposeNodeSchema,
      userPrompt: [
        'Create 2 to 8 child requirement modules for the selected node.',
        'Children must be requirement areas, not implementation filenames or code structure.',
        'Most children should start as needs_interview unless the requirement is already tiny and explicit.',
        '',
        contextBlock(input.project, input.node),
        '',
        'Relevant interview facts for this node:',
        JSON.stringify(nodeFacts(input.project, input.node), null, 2),
      ].join('\n'),
      validate: (value) => validateDecomposeNodeOutput(value, input.node),
    })
  }

  async generateArtifacts(
    input: GenerateArtifactsInput,
  ): Promise<GenerateArtifactsOutput> {
    return callOpenAiJson({
      apiKey: this.apiKey,
      model: this.model,
      endpoint: this.endpoint,
      sendAuthorizationHeader: this.sendAuthorizationHeader,
      fetchImpl: this.fetchImpl,
      schemaName: 'rpd_generated_artifacts',
      schema: artifactsSchema,
      userPrompt: [
        'Generate next-stage requirement artifacts from the current tree and interview facts.',
        'Do not generate source code. Do not decide final implementation priority or final work units.',
        'Clearly separate confirmed_leaf nodes, ready_to_decompose nodes, and active interviews.',
        '',
        projectBlock(input.project),
        '',
        'Current warnings:',
        JSON.stringify(getProjectWarnings(input.project), null, 2),
      ].join('\n'),
      validate: validateGenerateArtifactsOutput,
    })
  }
}

export class FallbackLlmProvider implements PbeLlmProvider {
  readonly providerName = 'openai-with-mock-fallback'
  private readonly primary: OpenAiLlmProvider | null
  private readonly mock: MockLlmProvider
  private readonly onFallback?: (event: ProviderFallbackEvent) => void
  private status: LlmProviderStatus

  constructor({
    primary,
    mock,
    initialFallbackReason,
    onFallback,
  }: {
    primary: OpenAiLlmProvider | null
    mock: MockLlmProvider
    initialFallbackReason?: string
    onFallback?: (event: ProviderFallbackEvent) => void
  }) {
    this.primary = primary
    this.mock = mock
    this.onFallback = onFallback
    this.status = primary
      ? primary.getStatus()
      : {
          requestedProvider: 'openai',
          activeProvider: 'mock',
          fallbackReason: initialFallbackReason,
        }
  }

  getStatus() {
    return this.status
  }

  async generateInitialQuestion(
    input: GenerateInitialQuestionInput,
  ): Promise<GenerateQuestionOutput> {
    return this.withFallback(
      'generateInitialQuestion',
      () => this.primary!.generateInitialQuestion(input),
      () => this.mock.generateInitialQuestion(input),
    )
  }

  async analyzeInterviewTurn(
    input: AnalyzeInterviewTurnInput,
  ): Promise<AnalyzeInterviewTurnOutput> {
    return this.withFallback(
      'analyzeInterviewTurn',
      () => this.primary!.analyzeInterviewTurn(input),
      () => this.mock.analyzeInterviewTurn(input),
    )
  }

  async decomposeNode(input: DecomposeNodeInput): Promise<DecomposeNodeOutput> {
    return this.withFallback(
      'decomposeNode',
      () => this.primary!.decomposeNode(input),
      () => this.mock.decomposeNode(input),
    )
  }

  async generateArtifacts(
    input: GenerateArtifactsInput,
  ): Promise<GenerateArtifactsOutput> {
    return this.withFallback(
      'generateArtifacts',
      () => this.primary!.generateArtifacts(input),
      () => this.mock.generateArtifacts(input),
    )
  }

  async generateLeafWorkDesign(
    input: GenerateLeafWorkDesignInput,
  ): Promise<WorkDesign> {
    return this.mock.generateLeafWorkDesign(input)
  }

  async synthesizeParentWorkDesign(
    input: SynthesizeParentWorkDesignInput,
  ): Promise<WorkDesign> {
    return this.mock.synthesizeParentWorkDesign(input)
  }

  async generateImplementationRoadmap(
    input: GenerateImplementationRoadmapInput,
  ): Promise<ImplementationRoadmap> {
    return this.mock.generateImplementationRoadmap(input)
  }

  async generateLeafVerificationDesign(
    input: GenerateLeafVerificationDesignInput,
  ): Promise<VerificationDesign> {
    return this.mock.generateLeafVerificationDesign(input)
  }

  async synthesizeParentVerificationDesign(
    input: SynthesizeParentVerificationDesignInput,
  ): Promise<VerificationDesign> {
    return this.mock.synthesizeParentVerificationDesign(input)
  }

  async generateAcceptancePlan(
    input: GenerateAcceptancePlanInput,
  ): Promise<AcceptancePlan> {
    return this.mock.generateAcceptancePlan(input)
  }

  async generateAutonomousCodexExecutionPack(
    input: GenerateAcePackInput,
  ): Promise<AutonomousCodexExecutionPack> {
    return this.mock.generateAutonomousCodexExecutionPack(input)
  }

  private async withFallback<T>(
    operation: ProviderFallbackEvent['operation'],
    primaryCall: () => Promise<T>,
    mockCall: () => Promise<T>,
  ): Promise<T> {
    if (!this.primary) {
      return mockCall()
    }

    try {
      const result = await primaryCall()

      this.status = this.primary.getStatus()
      return result
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)

      this.status = {
        requestedProvider: 'openai',
        activeProvider: 'mock',
        model: this.primary.model,
        fallbackReason: reason,
        lastFallbackReason: reason,
      }
      console.warn(
        `OpenAI provider failed during ${operation}; using MockLlmProvider fallback.`,
        error,
      )
      this.onFallback?.({ operation, reason })

      return mockCall()
    }
  }
}

export function createConfiguredProvider(
  options: CreateConfiguredProviderOptions = {},
): PbeLlmProvider {
  const env = options.env ?? import.meta.env
  const requestedProvider = (env.VITE_RPD_LLM_PROVIDER ?? 'mock')
    .trim()
    .toLowerCase()
  const apiKey = env.VITE_OPENAI_API_KEY?.trim()
  const model = env.VITE_OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL
  const endpoint =
    env.VITE_OPENAI_CHAT_COMPLETIONS_URL?.trim() ||
    DEFAULT_OPENAI_CHAT_COMPLETIONS_URL
  const mock = new MockLlmProvider()

  if (requestedProvider !== 'openai') {
    return mock
  }

  if (!apiKey) {
    return new FallbackLlmProvider({
      primary: null,
      mock,
      initialFallbackReason: 'OpenAI API key is missing.',
      onFallback: options.onFallback,
    })
  }

  return new FallbackLlmProvider({
    primary: new OpenAiLlmProvider({
      apiKey,
      model,
      endpoint,
      sendAuthorizationHeader: !endpoint.startsWith('/api/openai'),
      fetchImpl: options.fetchImpl,
    }),
    mock,
    onFallback: options.onFallback,
  })
}

async function callOpenAiJson<T>({
  apiKey,
  model,
  endpoint,
  sendAuthorizationHeader,
  fetchImpl,
  schemaName,
  schema,
  userPrompt,
  validate,
}: OpenAiJsonInput<T>): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (sendAuthorizationHeader) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: COMMON_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: schemaName,
          schema,
          strict: false,
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API ${response.status}: ${await safeResponseText(response)}`)
  }

  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenAI response did not include message content.')
  }

  return validate(parseJsonContent(content))
}

function contextBlock(
  project: Project,
  node: ProgramNode,
  parentNode?: ProgramNode,
) {
  return [
    'Project context:',
    JSON.stringify(
      {
        projectTitle: project.title,
        selectedNode: summarizeNodeForPrompt(node),
        parentNode: parentNode ? summarizeNodeForPrompt(parentNode) : null,
        treeSummary: getTreeSummary(project),
      },
      null,
      2,
    ),
  ].join('\n')
}

function projectBlock(project: Project) {
  return [
    'Project:',
    JSON.stringify(
      {
        title: project.title,
        rootNodeId: project.rootNodeId,
        treeSummary: getTreeSummary(project),
        nodes: Object.values(project.nodes).map(summarizeNodeForPrompt),
        interviewFacts: Object.values(project.interviewSessions).flatMap(
          (session) => session.extractedFacts,
        ),
      },
      null,
      2,
    ),
  ].join('\n')
}

function nodeFacts(project: Project, node: ProgramNode) {
  return node.interviewSessionIds.flatMap((sessionId) => {
    const session = project.interviewSessions[sessionId]
    return session ? session.extractedFacts : []
  })
}

function summarizeNodeForPrompt(node: ProgramNode) {
  return {
    id: node.id,
    title: node.title,
    description: node.description,
    depth: node.depth,
    status: node.status,
    summary: node.summary,
    aiHints: node.aiHints,
  }
}

function serializeMessages(messages: InterviewMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))
}

async function safeResponseText(response: Response) {
  try {
    const text = await response.text()
    return text.slice(0, 500)
  } catch {
    return 'Unable to read response body.'
  }
}

function parseJsonContent(content: string) {
  try {
    return JSON.parse(content)
  } catch {
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new Error('OpenAI response was not valid JSON.')
    }
    return JSON.parse(match[0])
  }
}

const stringSchema = { type: 'string', minLength: 1 }

const initialQuestionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['question', 'reason'],
  properties: {
    question: stringSchema,
    reason: { type: 'string' },
  },
}

const extractedFactSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['text', 'confidence'],
  properties: {
    text: stringSchema,
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
}

const interviewTurnSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['decision', 'extractedFacts'],
  properties: {
    decision: {
      type: 'string',
      enum: [
        'ask_next_question',
        'ready_to_decompose',
        'suggest_confirm_leaf',
        'needs_clarification',
        'blocked',
      ],
    },
    nextQuestion: { type: 'string' },
    extractedFacts: {
      type: 'array',
      items: extractedFactSchema,
    },
    nodeSummary: { type: 'string' },
    suggestedNextAction: {
      type: 'string',
      enum: ['interview', 'decompose', 'confirm_leaf'],
    },
    caution: { type: 'string' },
  },
}

const childDraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'description', 'suggestedInitialStatus'],
  properties: {
    title: stringSchema,
    description: stringSchema,
    suggestedInitialStatus: {
      type: 'string',
      enum: ['needs_interview', 'confirmed_leaf'],
    },
    rationale: { type: 'string' },
  },
}

const decomposeNodeSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['children', 'parentSummary'],
  properties: {
    children: {
      type: 'array',
      minItems: 2,
      maxItems: 8,
      items: childDraftSchema,
    },
    parentSummary: stringSchema,
  },
}

const artifactFieldsSchema = {
  productCharter: stringSchema,
  requirementTree: stringSchema,
  workUnitList: stringSchema,
  architectureDraft: stringSchema,
  implementationPlan: stringSchema,
  verificationPlan: stringSchema,
  aiCodingPrompt: stringSchema,
}

const artifactsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['artifacts', 'warnings'],
  properties: {
    artifacts: {
      type: 'object',
      additionalProperties: false,
      required: Object.keys(artifactFieldsSchema),
      properties: artifactFieldsSchema,
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
    },
  },
}
