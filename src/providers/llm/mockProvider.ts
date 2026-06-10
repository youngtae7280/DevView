import {
  createId,
  getLeafNodes,
  getProjectWarnings,
  getRootToLeafNodes,
  getTreeSummary,
  nowIso,
} from '../../domain/tree'
import type {
  ExtractedFact,
  GeneratedArtifacts,
  InferredComplexity,
  ProgramNode,
  Project,
} from '../../domain/types'
import type {
  AnalyzeInterviewTurnInput,
  AnalyzeInterviewTurnOutput,
  DecomposeNodeInput,
  DecomposeNodeOutput,
  GenerateArtifactsInput,
  GenerateArtifactsOutput,
  GenerateInitialQuestionInput,
  GenerateQuestionOutput,
} from './types'
import { generateAutonomousCodexExecutionPack } from '../../plugins/project-blueprint-engine/acep/acep-generator'
import { MockVerificationDesigner } from '../../plugins/project-blueprint-engine/vd/vd-engine'
import type {
  AcceptancePlan,
  GenerateAcceptancePlanInput,
  GenerateLeafVerificationDesignInput,
  SynthesizeParentVerificationDesignInput,
  VerificationDesign,
} from '../../plugins/project-blueprint-engine/vd/vd-types'
import { MockWorkProcessDesigner } from '../../plugins/project-blueprint-engine/wpd/wpd-engine'
import type {
  GenerateImplementationRoadmapInput,
  GenerateLeafWorkDesignInput,
  ImplementationRoadmap,
  SynthesizeParentWorkDesignInput,
  WorkDesign,
} from '../../plugins/project-blueprint-engine/wpd/wpd-types'
import type {
  AutonomousCodexExecutionPack,
  GenerateAcePackInput,
} from '../../plugins/project-blueprint-engine/acep/acep-types'
import type { PbeLlmProvider } from '../../plugins/project-blueprint-engine/shared/llm-provider'
import { validateGeneratedNodes } from './validation'

type ModuleSeed = {
  title: string
  description: string
  inferredComplexity?: InferredComplexity
  caution?: string
}

const inventorySeeds: ModuleSeed[] = [
  {
    title: 'Login and permission context',
    description: 'Clarify who can access inventory features and what each role may do.',
    inferredComplexity: 'medium',
  },
  {
    title: 'Inventory browsing context',
    description: 'Clarify how users find current stock and understand item status.',
    inferredComplexity: 'low',
  },
  {
    title: 'Inbound stock context',
    description: 'Clarify how incoming stock is recorded and reflected in inventory.',
    inferredComplexity: 'high',
    caution: 'Quantity changes may require later design-stage validation.',
  },
  {
    title: 'Outbound stock context',
    description: 'Clarify how stock leaves inventory and how negative stock is prevented.',
    inferredComplexity: 'high',
    caution: 'Business rules can affect data consistency.',
  },
  {
    title: 'Inventory history context',
    description: 'Clarify what events must be traceable for audit and recovery.',
    inferredComplexity: 'medium',
  },
  {
    title: 'Reporting context',
    description: 'Clarify what summaries users need after stock activity occurs.',
    inferredComplexity: 'low',
  },
]

const commerceSeeds: ModuleSeed[] = [
  {
    title: 'Product catalog context',
    description: 'Clarify how products are presented and discovered.',
    inferredComplexity: 'medium',
  },
  {
    title: 'Cart and checkout context',
    description: 'Clarify how customers move from selection to order intent.',
    inferredComplexity: 'high',
    caution: 'Payment and order consistency should be validated in a later stage.',
  },
  {
    title: 'Member context',
    description: 'Clarify how accounts, profiles, and order history behave.',
    inferredComplexity: 'medium',
  },
  {
    title: 'Admin operation context',
    description: 'Clarify how staff manage products, orders, and customer issues.',
    inferredComplexity: 'high',
  },
]

const fallbackSeeds: ModuleSeed[] = [
  {
    title: 'Primary user context',
    description: 'Clarify who uses the program and what they are trying to accomplish.',
    inferredComplexity: 'medium',
  },
  {
    title: 'Core behavior context',
    description: 'Clarify the main situation, action, and expected result.',
    inferredComplexity: 'high',
  },
  {
    title: 'Data context',
    description: 'Clarify what information is created, changed, saved, or reviewed.',
    inferredComplexity: 'medium',
  },
  {
    title: 'Exception context',
    description: 'Clarify what can go wrong and what users expect when it does.',
    inferredComplexity: 'medium',
  },
]

export class MockLlmProvider implements PbeLlmProvider {
  readonly providerName = 'mock'
  private readonly workDesigner = new MockWorkProcessDesigner()
  private readonly verificationDesigner = new MockVerificationDesigner()

  getStatus() {
    return {
      requestedProvider: 'mock',
      activeProvider: 'mock',
    } as const
  }

  async generateInitialQuestion(
    input: GenerateInitialQuestionInput,
  ): Promise<GenerateQuestionOutput> {
    return {
      question: `"${input.node.title}" 기능은 실제로 누가, 어떤 상황에서 사용하게 될까요?`,
      reason: 'The first question asks for user context before implementation details.',
    }
  }

  async analyzeInterviewTurn(
    input: AnalyzeInterviewTurnInput,
  ): Promise<AnalyzeInterviewTurnOutput> {
    const lastUserMessage = [...input.session.messages]
      .reverse()
      .find((message) => message.role === 'user')
    const answer = lastUserMessage?.content.trim() ?? ''
    const questionCount = input.session.messages.filter(
      (message) => message.role === 'ai',
    ).length
    const extractedFacts = extractFacts(input.node.id, answer)

    if (isConfirmLeafAnswer(answer)) {
      return {
        decision: 'suggest_confirm_leaf',
        extractedFacts,
        nodeSummary: summarizeNode(input.node, input.session.extractedFacts, extractedFacts),
        suggestedNextAction: 'confirm_leaf',
        caution:
          'Confirmed leaf means this requirement branch is sufficiently decomposed for RPD, not that it is a final development task unit.',
      }
    }

    if (isAnswerSufficient(answer) || questionCount >= 3) {
      return {
        decision: 'ready_to_decompose',
        extractedFacts,
        nodeSummary: summarizeNode(input.node, input.session.extractedFacts, extractedFacts),
        suggestedNextAction: 'decompose',
      }
    }

    if (isAmbiguousAnswer(answer)) {
      return {
        decision: 'needs_clarification',
        nextQuestion: `"${input.node.title}"에서 사용자가 성공했다고 판단하려면 어떤 결과를 볼 수 있어야 할까요?`,
        extractedFacts,
        suggestedNextAction: 'interview',
      }
    }

    return {
      decision: 'ask_next_question',
      nextQuestion: nextQuestionFor(input.node, questionCount),
      extractedFacts,
      suggestedNextAction: 'interview',
    }
  }

  async decomposeNode(
    input: DecomposeNodeInput,
  ): Promise<DecomposeNodeOutput> {
    const seeds = pickSeeds(input)
    const children = seeds.map((seed) => createChildNode(input.node, seed))
    const validation = validateGeneratedNodes(children)

    return {
      children: validation.value,
      notes: [
        'Mock provider generated child requirement nodes from current interview facts.',
        ...validation.warnings,
      ],
    }
  }

  async generateArtifacts(
    input: GenerateArtifactsInput,
  ): Promise<GenerateArtifactsOutput> {
    const warnings = getProjectWarnings(input.project).map(
      (warning) => warning.message,
    )

    return {
      artifacts: buildArtifacts(input.project),
      warnings,
    }
  }

  async generateLeafWorkDesign(
    input: GenerateLeafWorkDesignInput,
  ): Promise<WorkDesign> {
    return this.workDesigner.generateLeafWorkDesign(input)
  }

  async synthesizeParentWorkDesign(
    input: SynthesizeParentWorkDesignInput,
  ): Promise<WorkDesign> {
    return this.workDesigner.synthesizeParentWorkDesign(input)
  }

  async generateImplementationRoadmap(
    input: GenerateImplementationRoadmapInput,
  ): Promise<ImplementationRoadmap> {
    return this.workDesigner.generateImplementationRoadmap(input)
  }

  async generateLeafVerificationDesign(
    input: GenerateLeafVerificationDesignInput,
  ): Promise<VerificationDesign> {
    return this.verificationDesigner.generateLeafVerificationDesign(input)
  }

  async synthesizeParentVerificationDesign(
    input: SynthesizeParentVerificationDesignInput,
  ): Promise<VerificationDesign> {
    return this.verificationDesigner.synthesizeParentVerificationDesign(input)
  }

  async generateAcceptancePlan(
    input: GenerateAcceptancePlanInput,
  ): Promise<AcceptancePlan> {
    return this.verificationDesigner.generateAcceptancePlan(input)
  }

  async generateAutonomousCodexExecutionPack(
    input: GenerateAcePackInput,
  ): Promise<AutonomousCodexExecutionPack> {
    return generateAutonomousCodexExecutionPack(input)
  }
}

function pickSeeds(input: DecomposeNodeInput): ModuleSeed[] {
  const text = [
    input.node.title,
    input.node.description,
    input.node.summary ?? '',
    ...input.node.interviewSessionIds.flatMap((sessionId) => {
      const session = input.project.interviewSessions[sessionId]
      return session
        ? [
            ...session.messages.map((message) => message.content),
            ...session.extractedFacts.map((fact) => fact.text),
          ]
        : []
    }),
  ]
    .join(' ')
    .toLowerCase()

  if (input.node.depth >= 2) {
    return focusedFallbackSeeds(input.node)
  }

  if (
    text.includes('inventory') ||
    text.includes('warehouse') ||
    text.includes('stock') ||
    text.includes('재고') ||
    text.includes('창고') ||
    text.includes('입고') ||
    text.includes('출고')
  ) {
    return input.node.depth === 0
      ? inventorySeeds
      : focusedInventorySeeds(input.node)
  }

  if (
    text.includes('shop') ||
    text.includes('commerce') ||
    text.includes('store') ||
    text.includes('shopping') ||
    text.includes('쇼핑몰') ||
    text.includes('상품') ||
    text.includes('주문')
  ) {
    return input.node.depth === 0 ? commerceSeeds : focusedCommerceSeeds(input.node)
  }

  return input.node.depth === 0 ? fallbackSeeds : focusedFallbackSeeds(input.node)
}

function focusedInventorySeeds(node: ProgramNode): ModuleSeed[] {
  return [
    {
      title: `${node.title} usage situation`,
      description: `Clarify the real-world trigger and user role for ${node.title}.`,
      inferredComplexity: 'medium',
    },
    {
      title: `${node.title} result expectation`,
      description: `Clarify the visible result that proves ${node.title} succeeded.`,
      inferredComplexity: 'medium',
    },
    {
      title: `${node.title} exception situation`,
      description: `Clarify what may go wrong in ${node.title} and how users notice it.`,
      inferredComplexity: 'high',
      caution: 'This branch likely needs later validation in the work-planning stage.',
    },
  ]
}

function focusedCommerceSeeds(node: ProgramNode): ModuleSeed[] {
  return [
    {
      title: `${node.title} customer situation`,
      description: `Clarify when a customer or operator uses ${node.title}.`,
      inferredComplexity: 'medium',
    },
    {
      title: `${node.title} expected outcome`,
      description: `Clarify what outcome makes ${node.title} feel complete.`,
      inferredComplexity: 'medium',
    },
    {
      title: `${node.title} handoff information`,
      description: `Clarify what information ${node.title} exchanges with other parts of the product.`,
      inferredComplexity: 'high',
    },
  ]
}

function focusedFallbackSeeds(node: ProgramNode): ModuleSeed[] {
  return [
    {
      title: `${node.title} user and situation`,
      description: `Clarify who uses ${node.title} and under what condition.`,
      inferredComplexity: 'medium',
    },
    {
      title: `${node.title} behavior and result`,
      description: `Clarify what action happens and what result should be visible.`,
      inferredComplexity: 'medium',
    },
    {
      title: `${node.title} boundary and exception`,
      description: `Clarify what is outside ${node.title} and what can go wrong.`,
      inferredComplexity: 'medium',
    },
  ]
}

function createChildNode(parent: ProgramNode, seed: ModuleSeed): ProgramNode {
  const timestamp = nowIso()

  return {
    id: createId('node'),
    parentId: parent.id,
    title: seed.title,
    description: seed.description,
    depth: parent.depth + 1,
    status: 'needs_interview',
    children: [],
    interviewSessionIds: [],
    aiHints: {
      suggestedNextAction: 'interview',
      inferredComplexity: seed.inferredComplexity ?? 'medium',
      caution: seed.caution,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function nextQuestionFor(node: ProgramNode, questionCount: number) {
  const questions = [
    `"${node.title}"에서 사용자가 성공했다고 판단하려면 어떤 결과를 볼 수 있어야 할까요?`,
    `"${node.title}"가 다른 기능과 주고받아야 하는 정보가 있다면 무엇인가요?`,
    `"${node.title}"에서 실수하거나 실패하면 가장 문제가 되는 상황은 무엇인가요?`,
    `"${node.title}"를 더 나누지 않아도 된다고 느끼는 기준은 무엇인가요?`,
  ]

  return questions[Math.min(questionCount, questions.length - 1)]
}

function isConfirmLeafAnswer(answer: string) {
  const normalized = answer.toLowerCase()
  return [
    '여기서 확정',
    '이정도면 충분',
    '이 정도면 충분',
    '그만',
    'stop',
    'confirm',
    'enough',
  ].some((keyword) => normalized.includes(keyword))
}

function isAmbiguousAnswer(answer: string) {
  const normalized = answer.trim().toLowerCase()
  return (
    normalized.length < 10 ||
    ['몰라', '모르겠', '기본', '나중', 'unknown', 'default', 'later'].some(
      (keyword) => normalized.includes(keyword),
    )
  )
}

function isAnswerSufficient(answer: string) {
  const normalized = answer.toLowerCase()
  const markers = [
    '사용',
    '관리자',
    '사용자',
    '담당자',
    '입력',
    '저장',
    '확인',
    '결과',
    '화면',
    '오류',
    '실패',
    '권한',
    'when',
    'user',
    'admin',
    'operator',
    'save',
    'result',
    'error',
    'screen',
  ]
  const hitCount = markers.filter((marker) => normalized.includes(marker)).length

  return answer.trim().length >= 35 && hitCount >= 2
}

function extractFacts(nodeId: string, answer: string): ExtractedFact[] {
  if (!answer.trim()) {
    return []
  }

  return [
    {
      id: createId('fact'),
      nodeId,
      text: answer.trim(),
      sourceMessageId: '',
      confidence: isAnswerSufficient(answer) ? 'high' : 'medium',
    },
  ]
}

function summarizeNode(
  node: ProgramNode,
  existingFacts: ExtractedFact[],
  newFacts: ExtractedFact[],
) {
  const facts = [...existingFacts, ...newFacts].map((fact) => fact.text)
  const source = facts.length > 0 ? facts.join(' ') : node.description

  return source.length > 220 ? `${source.slice(0, 217)}...` : source
}

function buildArtifacts(project: Project): GeneratedArtifacts {
  const generatedAt = nowIso()
  const root = project.rootNodeId ? project.nodes[project.rootNodeId] : null
  const nodes = getRootToLeafNodes(project)
  const confirmedLeaves = nodes.filter((node) => node.status === 'confirmed_leaf')
  const readyNodes = nodes.filter((node) => node.status === 'ready_to_decompose')
  const interviewingNodes = nodes.filter((node) => node.status === 'interviewing')
  const expandedNodes = nodes.filter((node) => node.status === 'expanded')
  const leafNodes = getLeafNodes(project)
  const allSessions = Object.values(project.interviewSessions)
  const facts = allSessions.flatMap((session) =>
    session.extractedFacts.map((fact) => ({
      ...fact,
      nodeTitle: project.nodes[fact.nodeId]?.title ?? fact.nodeId,
    })),
  )

  return {
    productCharter: [
      '# Product Charter',
      '',
      `Product: ${project.title}`,
      `Original request: ${root?.description ?? 'Not provided'}`,
      '',
      '## Goal',
      'Clarify a program idea into a requirement tree through user-selected, one-question-at-a-time interviews.',
      '',
      '## RPD Boundary',
      '- RPD captures requirement decomposition, not final implementation priority or work-unit planning.',
      '- confirmed_leaf means this branch is sufficiently decomposed for RPD.',
      '',
      '## Current Scope',
      ...nodes.map((node) => `- ${node.title} (${node.status}): ${node.summary ?? node.description}`),
      '',
      '## Confirmed Leaves',
      ...(confirmedLeaves.length > 0
        ? confirmedLeaves.map((node) => `- ${node.title}: ${node.summary ?? node.description}`)
        : ['- None yet']),
    ].join('\n'),
    requirementTree: [
      '# Requirement Tree',
      '',
      '```text',
      getTreeSummary(project),
      '```',
      '',
      '## Interview Summaries',
      ...nodes.flatMap((node) => [
        `### ${node.title}`,
        node.summary ? node.summary : 'No summary yet.',
        '',
        'Facts:',
        ...node.interviewSessionIds.flatMap((sessionId) => {
          const session = project.interviewSessions[sessionId]
          return session && session.extractedFacts.length > 0
            ? session.extractedFacts.map((fact) => `- ${fact.text}`)
            : ['- None recorded.']
        }),
      ]),
    ].join('\n'),
    workUnitList: [
      '# Confirmed Requirement Leaves',
      '',
      'These are final requirement leaves for RPD. They are not yet final development work units.',
      '',
      ...(confirmedLeaves.length > 0
        ? confirmedLeaves.map(
            (node) => `## ${node.title}\n${node.summary ?? node.description}`,
          )
        : leafNodes.map(
            (node) =>
              `## ${node.title}\nStatus: ${node.status}\n${node.summary ?? node.description}`,
          )),
      '',
      '## Ready But Not Expanded',
      ...(readyNodes.length > 0
        ? readyNodes.map((node) => `- ${node.title}: ${node.summary ?? node.description}`)
        : ['- None']),
      '',
      '## Still Interviewing',
      ...(interviewingNodes.length > 0
        ? interviewingNodes.map((node) => `- ${node.title}`)
        : ['- None']),
    ].join('\n\n'),
    architectureDraft: [
      '# Architecture Draft',
      '',
      'This is an initial recommendation based only on requirement decomposition, not a final implementation plan.',
      '',
      '## Expanded Structure',
      ...expandedNodes.map((node) => `- ${node.title}: ${node.children.length} child nodes`),
      '',
      '## Candidate Areas',
      ...nodes
        .filter((node) => node.depth <= 2)
        .map((node) => `- ${node.title}: ${node.description}`),
      '',
      '## Cautions',
      ...nodes
        .filter((node) => node.aiHints?.caution)
        .map((node) => `- ${node.title}: ${node.aiHints?.caution}`),
    ].join('\n'),
    implementationPlan: [
      '# Next-stage Planning Notes',
      '',
      'RPD does not decide priority, risk, cycle size, or final implementation units.',
      'The next planning engine should use confirmed leaves and extracted facts as input.',
      '',
      '## Inputs For Next Stage',
      ...confirmedLeaves.map((node) => `- ${node.title}: ${node.summary ?? node.description}`),
      '',
      '## Open Requirement Branches',
      ...readyNodes.map((node) => `- Ready to decompose: ${node.title}`),
      ...interviewingNodes.map((node) => `- Still interviewing: ${node.title}`),
    ].join('\n'),
    verificationPlan: [
      '# Verification Plan',
      '',
      '## RPD Flow Checks',
      '- A selected node asks one AI question at a time.',
      '- User answers are free-form text, not radio/select choices.',
      '- Enough answer detail changes the node to ready_to_decompose.',
      '- Child nodes are generated only when the user clicks Make child modules.',
      '- Confirm here changes a node to confirmed_leaf.',
      '',
      '## Artifact Checks',
      '- Interview summaries are present.',
      '- Extracted facts are present.',
      '- confirmed_leaf and ready_to_decompose nodes are separated.',
    ].join('\n'),
    aiCodingPrompt: [
      '# AI Coding Prompt',
      '',
      'You are continuing from a Recursive Program Designer package.',
      '',
      '## Important Boundary',
      'Do not treat confirmed_leaf nodes as final development work units. They are final requirement-decomposition leaves only.',
      '',
      '## Requirement Leaves',
      ...confirmedLeaves.map((node) => `- ${node.title}: ${node.summary ?? node.description}`),
      '',
      '## Extracted Facts',
      ...(facts.length > 0
        ? facts.map((fact) => `- ${fact.nodeTitle}: ${fact.text}`)
        : ['- None recorded yet']),
      '',
      '## Recommended Next Step',
      'Run a separate work-planning pass to decide priority, risk, cycle size, and actual implementation units.',
    ].join('\n'),
    generatedAt,
  }
}
