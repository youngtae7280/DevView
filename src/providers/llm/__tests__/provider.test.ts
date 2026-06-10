import { describe, expect, it, vi } from 'vitest'
import { createProjectWithRoot } from '../../../domain/tree'
import { createConfiguredProvider } from '../openAiProvider'
import {
  validateAnalyzeInterviewTurnOutput,
  validateDecomposeNodeOutput,
} from '../validation'

describe('LLM provider selection', () => {
  it('uses MockLlmProvider when provider is mock', () => {
    const provider = createConfiguredProvider({
      env: {
        VITE_RPD_LLM_PROVIDER: 'mock',
      },
    })

    expect(provider.getStatus().activeProvider).toBe('mock')
    expect(provider.getStatus().requestedProvider).toBe('mock')
  })

  it('uses OpenAI when provider is openai and an API key exists', () => {
    const provider = createConfiguredProvider({
      env: {
        VITE_RPD_LLM_PROVIDER: 'openai',
        VITE_OPENAI_API_KEY: 'test-key',
        VITE_OPENAI_MODEL: 'gpt-4.1-mini',
      },
    })

    expect(provider.getStatus().activeProvider).toBe('openai')
    expect(provider.getStatus().model).toBe('gpt-4.1-mini')
  })

  it('falls back to Mock when OpenAI is selected without an API key', () => {
    const provider = createConfiguredProvider({
      env: {
        VITE_RPD_LLM_PROVIDER: 'openai',
        VITE_OPENAI_API_KEY: '',
      },
    })

    expect(provider.getStatus().activeProvider).toBe('mock')
    expect(provider.getStatus().requestedProvider).toBe('openai')
    expect(provider.getStatus().fallbackReason).toContain('API key')
  })
})

describe('LLM schema validation', () => {
  it('accepts a valid interview turn analysis', () => {
    const output = validateAnalyzeInterviewTurnOutput(
      {
        decision: 'ask_next_question',
        nextQuestion: 'Who uses this feature in the real workflow?',
        extractedFacts: [
          {
            text: 'Admins record inbound stock.',
            confidence: 'high',
          },
        ],
        suggestedNextAction: 'interview',
      },
      'node_1',
    )

    expect(output.decision).toBe('ask_next_question')
    expect(output.extractedFacts[0].nodeId).toBe('node_1')
  })

  it('rejects invalid interview decisions', () => {
    expect(() =>
      validateAnalyzeInterviewTurnOutput(
        {
          decision: 'done',
          extractedFacts: [],
        },
        'node_1',
      ),
    ).toThrow(/decision/)
  })

  it('requires a next question for follow-up decisions', () => {
    expect(() =>
      validateAnalyzeInterviewTurnOutput(
        {
          decision: 'needs_clarification',
          extractedFacts: [],
        },
        'node_1',
      ),
    ).toThrow(/nextQuestion/)
  })

  it('rejects child nodes with empty titles', () => {
    const project = createProjectWithRoot('Build inventory software')
    const root = project.nodes[project.rootNodeId!]

    expect(() =>
      validateDecomposeNodeOutput(
        {
          parentSummary: 'Inventory software for operators.',
          children: [
            {
              title: '',
              description: 'Clarify inbound stock behavior.',
              suggestedInitialStatus: 'needs_interview',
            },
          ],
        },
        root,
      ),
    ).toThrow(/title/)
  })
})

describe('OpenAI fallback', () => {
  it('returns Mock output and records fallback when OpenAI fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const fallbackEvents: string[] = []
    const provider = createConfiguredProvider({
      env: {
        VITE_RPD_LLM_PROVIDER: 'openai',
        VITE_OPENAI_API_KEY: 'test-key',
        VITE_OPENAI_MODEL: 'gpt-4.1-mini',
      },
      fetchImpl: async () => new Response('rate limited', { status: 429 }),
      onFallback: (event) => fallbackEvents.push(event.operation),
    })
    const project = createProjectWithRoot('Build inventory software')
    const root = project.nodes[project.rootNodeId!]

    const output = await provider.generateInitialQuestion({ project, node: root })

    expect(output.question).toContain(root.title)
    expect(provider.getStatus().activeProvider).toBe('mock')
    expect(provider.getStatus().lastFallbackReason).toContain('429')
    expect(fallbackEvents).toEqual(['generateInitialQuestion'])
    warnSpy.mockRestore()
  })
})
