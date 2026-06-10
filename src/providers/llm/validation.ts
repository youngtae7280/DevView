import {
  type ExtractedFact,
  type ExtractedFactConfidence,
  type GeneratedArtifacts,
  type InterviewTurnDecision,
  NODE_STATUSES,
  type NodeStatus,
  type ProgramNode,
  type SuggestedNextAction,
} from '../../domain/types'
import type {
  AnalyzeInterviewTurnOutput,
  DecomposeNodeOutput,
  GenerateArtifactsOutput,
  GenerateQuestionOutput,
} from './types'

export type ValidationResult<T> = {
  value: T[]
  warnings: string[]
}

export function validateGeneratedNodes(
  nodes: ProgramNode[],
): ValidationResult<ProgramNode> {
  const warnings: string[] = []
  const value = nodes.filter((node) => {
    if (!node.title.trim()) {
      warnings.push('A generated node was removed because its title was empty.')
      return false
    }

    if (!NODE_STATUSES.includes(node.status)) {
      warnings.push(`${node.title} had an invalid status.`)
      return false
    }

    if (!Array.isArray(node.children)) {
      warnings.push(`${node.title} was removed because children was invalid.`)
      return false
    }

    return true
  })

  return { value, warnings }
}

const DECISIONS: InterviewTurnDecision[] = [
  'ask_next_question',
  'ready_to_decompose',
  'suggest_confirm_leaf',
  'needs_clarification',
  'blocked',
]
const CONFIDENCE: ExtractedFactConfidence[] = ['low', 'medium', 'high']
const NEXT_ACTIONS: SuggestedNextAction[] = [
  'interview',
  'decompose',
  'confirm_leaf',
]
const CHILD_STATUSES: NodeStatus[] = ['needs_interview', 'confirmed_leaf']

export function validateGenerateQuestionOutput(
  value: unknown,
): GenerateQuestionOutput {
  const record = asRecord(value, 'initial question output')
  const question = requiredString(record, 'question')
  const reason = optionalString(record.reason) ?? ''

  assertSingleFreeTextQuestion(question, 'question')

  return { question, reason }
}

export function validateAnalyzeInterviewTurnOutput(
  value: unknown,
  nodeId: string,
): AnalyzeInterviewTurnOutput {
  const record = asRecord(value, 'interview turn output')
  const decision = enumValue(
    record.decision,
    DECISIONS,
    'decision',
  ) as InterviewTurnDecision
  const nextQuestion = optionalString(record.nextQuestion)

  if (
    (decision === 'ask_next_question' ||
      decision === 'needs_clarification') &&
    !nextQuestion
  ) {
    throw new Error(`${decision} requires nextQuestion.`)
  }

  if (nextQuestion) {
    assertSingleFreeTextQuestion(nextQuestion, 'nextQuestion')
  }

  const extractedFacts = validateExtractedFacts(record.extractedFacts, nodeId)
  const nodeSummary = optionalString(record.nodeSummary)
  const suggestedNextAction =
    record.suggestedNextAction === undefined
      ? undefined
      : (enumValue(
          record.suggestedNextAction,
          NEXT_ACTIONS,
          'suggestedNextAction',
        ) as SuggestedNextAction)
  const caution = optionalString(record.caution)

  return {
    decision,
    nextQuestion,
    extractedFacts,
    nodeSummary,
    suggestedNextAction,
    caution,
  }
}

export function validateDecomposeNodeOutput(
  value: unknown,
  parent: ProgramNode,
): DecomposeNodeOutput {
  const record = asRecord(value, 'decompose node output')
  const rawChildren = arrayValue(record.children, 'children')
  const parentSummary = requiredString(record, 'parentSummary')

  if (rawChildren.length === 0) {
    throw new Error('children must contain at least one child.')
  }

  const timestamp = providerNowIso()
  const children = rawChildren.slice(0, 8).map((item) => {
    const child = asRecord(item, 'child')
    const title = requiredString(child, 'title')
    const description = requiredString(child, 'description')
    const status = enumValue(
      child.suggestedInitialStatus,
      CHILD_STATUSES,
      'suggestedInitialStatus',
    ) as NodeStatus
    const rationale = optionalString(child.rationale)

    return {
      id: createProviderId('node'),
      parentId: parent.id,
      title,
      description,
      depth: parent.depth + 1,
      status,
      children: [],
      summary: status === 'confirmed_leaf' ? description : undefined,
      interviewSessionIds: [],
      aiHints: {
        suggestedNextAction: status === 'needs_interview' ? 'interview' : undefined,
        inferredComplexity: 'medium',
        caution: rationale,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies ProgramNode
  })
  const validation = validateGeneratedNodes(children)

  if (validation.value.length === 0) {
    throw new Error('No valid child nodes were generated.')
  }

  return {
    children: validation.value,
    notes: [
      `OpenAI parent summary: ${parentSummary}`,
      ...validation.warnings,
      ...(rawChildren.length > 8
        ? ['OpenAI returned more than 8 children; extra children were ignored.']
        : []),
    ],
  }
}

export function validateGenerateArtifactsOutput(
  value: unknown,
): GenerateArtifactsOutput {
  const record = asRecord(value, 'artifact output')
  const artifactRecord = asRecord(record.artifacts ?? value, 'artifacts')
  const artifacts: GeneratedArtifacts = {
    productCharter: requiredString(artifactRecord, 'productCharter'),
    requirementTree: requiredString(artifactRecord, 'requirementTree'),
    workUnitList: requiredString(artifactRecord, 'workUnitList'),
    architectureDraft: requiredString(artifactRecord, 'architectureDraft'),
    implementationPlan: requiredString(artifactRecord, 'implementationPlan'),
    verificationPlan: requiredString(artifactRecord, 'verificationPlan'),
    aiCodingPrompt: requiredString(artifactRecord, 'aiCodingPrompt'),
    generatedAt: providerNowIso(),
  }
  const warnings = record.warnings === undefined
    ? []
    : arrayValue(record.warnings, 'warnings').map((item) => {
        if (typeof item !== 'string') {
          throw new Error('warnings must contain only strings.')
        }
        return item
      })

  return { artifacts, warnings }
}

function validateExtractedFacts(value: unknown, nodeId: string): ExtractedFact[] {
  return arrayValue(value, 'extractedFacts').map((item) => {
    const fact = asRecord(item, 'extracted fact')
    const text = requiredString(fact, 'text')
    const confidence = enumValue(
      fact.confidence,
      CONFIDENCE,
      'confidence',
    ) as ExtractedFactConfidence

    return {
      id: createProviderId('fact'),
      nodeId,
      text,
      sourceMessageId: '',
      confidence,
    }
  })
}

function assertSingleFreeTextQuestion(question: string, label: string) {
  if (!question.trim()) {
    throw new Error(`${label} must not be empty.`)
  }

  const questionMarkCount = (question.match(/[?？]/g) ?? []).length

  if (questionMarkCount > 1) {
    throw new Error(`${label} must contain only one question.`)
  }

  if (/\n\s*([-*]|\d+[.)]|[A-D][.)])/i.test(question)) {
    throw new Error(`${label} must not contain a choice list.`)
  }

  if (/\b(multiple choice|choose one|radio|select one|option list)\b/i.test(question)) {
    throw new Error(`${label} must be free-text friendly.`)
  }
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`)
  }

  return value as Record<string, unknown>
}

function arrayValue(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`)
  }

  return value
}

function requiredString(record: Record<string, unknown>, key: string) {
  const value = record[key]

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${key} must be a non-empty string.`)
  }

  return value.trim()
}

function optionalString(value: unknown) {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new Error('Optional text fields must be strings.')
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function enumValue<T extends string>(value: unknown, allowed: T[], label: string) {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}.`)
  }

  return value
}

function createProviderId(prefix: string) {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)

  return `${prefix}_${random}`
}

function providerNowIso() {
  return new Date().toISOString()
}
