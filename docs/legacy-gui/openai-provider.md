# OpenAI Provider

RPD keeps the Mock provider as the default and adds OpenAI as an optional local-development provider.

## Configuration

Create `.env.local` from `.env.example`:

```env
VITE_RPD_LLM_PROVIDER=openai
VITE_OPENAI_MODEL=gpt-4.1-mini
VITE_OPENAI_API_KEY=your-local-development-key
```

Use `VITE_RPD_LLM_PROVIDER=mock` or leave it unset to run without an API key.

## Behavior

- `mock`: all provider calls use `MockLlmProvider`.
- `openai` with an API key: provider calls use `OpenAiLlmProvider`.
- `openai` without an API key: the app starts and uses Mock fallback.
- OpenAI network/API/schema failures: only the failed request falls back to Mock.

The top status strip displays the active provider state.

## Validation Boundary

OpenAI is asked to return JSON for:

- Initial interview question
- Interview turn analysis
- Child requirement decomposition
- Generated artifacts

The app parses and validates every response before changing project state. AI output may suggest facts, next questions, child node drafts, and artifact text; it does not directly mutate node status or project state.

## Security Note

This implementation is for local browser-only MVP experiments. Vite exposes `VITE_*` values to the browser bundle, so `VITE_OPENAI_API_KEY` is visible to anyone who can inspect the app. Do not use this direct browser-key pattern for public deployment.

Production deployment should use a backend proxy or server-side API route that keeps the OpenAI API key off the client.
