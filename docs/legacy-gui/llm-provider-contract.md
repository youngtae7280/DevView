# LLM Provider Contract

## Interface

```ts
interface LlmProvider {
  readonly providerName: string
  getStatus(): LlmProviderStatus
  generateInitialQuestion(input: GenerateInitialQuestionInput): Promise<GenerateQuestionOutput>
  analyzeInterviewTurn(input: AnalyzeInterviewTurnInput): Promise<AnalyzeInterviewTurnOutput>
  decomposeNode(input: DecomposeNodeInput): Promise<DecomposeNodeOutput>
  generateArtifacts(input: GenerateArtifactsInput): Promise<GenerateArtifactsOutput>
}
```

## Inputs

- `GenerateInitialQuestionInput`: current project, selected node, and optional parent node.
- `AnalyzeInterviewTurnInput`: current project, selected node, and current interview session.
- `DecomposeNodeInput`: current project and selected node.
- `GenerateArtifactsInput`: full current project.

## Outputs

- `GenerateQuestionOutput`: one free-text question and a reason.
- `AnalyzeInterviewTurnOutput`: decision, optional next question, extracted facts, optional summary, and optional AI hint.
- `DecomposeNodeOutput`: child `ProgramNode[]` plus provider notes.
- `GenerateArtifactsOutput`: `GeneratedArtifacts` plus unresolved warning text.

## Provider Status

`getStatus()` returns the configured provider, active provider, optional model, and fallback reason. The app displays this in the top status strip.

- Mock mode: `requestedProvider=mock`, `activeProvider=mock`
- OpenAI mode: `requestedProvider=openai`, `activeProvider=openai`, `model=<VITE_OPENAI_MODEL>`
- Fallback mode: `requestedProvider=openai`, `activeProvider=mock`, `fallbackReason=<reason>`

## Validation Rules

Generated nodes must have:

- Non-empty title
- Valid `NodeStatus`
- A `children` array

Interview questions are not choice lists. A provider must return at most one next question, and it must be a free-text prompt.

OpenAI responses are parsed as JSON and validated before application state is changed. Invalid OpenAI responses throw inside the provider layer and are handled by Mock fallback for that request.

## Mock Provider

`MockLlmProvider` is the default. It asks one initial question, analyzes the latest free-form answer, extracts facts, and decides whether to ask the next question, mark the node ready to decompose, or suggest confirming it as a leaf.

## Real Provider Notes

Do not hardcode API keys in frontend code. The current `OpenAiLlmProvider` reads `VITE_OPENAI_API_KEY` for local browser-only experiments. A production OpenAI provider should call a secure backend adapter or server-side API route.
