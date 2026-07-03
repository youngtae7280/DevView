# Natural Language Request Intake Boundary

This document defines the preview boundary for DevView's missing compiler frontend:

```text
natural language request
-> AI Request IR candidate
-> deterministic Request IR validation
-> graph traversal plan
-> selected node/edge slice
-> contract compiler input
```

This is a boundary preview only. It does not implement an AI classifier, call an LLM from runtime code, run graph traversal, generate contract compiler input, generate instruction packs, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, or enforce CI.

## Preview Artifact

The boundary preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/natural-language-request-intake-boundary.runtime-evidence-only.preview.json
```

Required safety values include:

```text
aiClassifierImplemented: false
llmCallsIntroduced: false
requestIrValidatorImplemented: false
graphTraversalImplementedFromRequestIr: false
selectedGraphSliceGenerated: false
contractCompilerInputGenerated: false
instructionPackGenerated: false
graphSourceMutated: false
graphDeltaApplied: false
approvalStatus: not-approved
```

## Frontend Flow

The intended frontend flow is:

- `naturalLanguageRequest`: the human-facing request surface.
- `aiRequestAnalyzer`: a future assistive producer of structured candidates.
- `requestIrCandidate`: candidate-only structured interpretation of the request.
- `requestIrValidation`: deterministic gate before traversal or contract generation.
- `graphTraversalPlan`: deterministic selection plan after validation.
- `selectedGraphSlice`: validated node/edge slice for compiler use.
- `contractCompilerInput`: generated only from validated request and selected graph context.

Natural language starts intake, but it is not graph traversal authority by itself. AI may classify and propose, but DevView must validate before the deterministic compiler path begins.

## Request IR Candidate Shape

The previewed Request IR candidate includes:

- `requestText`
- `requestLanguage`
- `requestTypeCandidate`
- `changeTypeCandidate`
- `targetRecordIdCandidate`
- `targetComponentCandidate`
- `intentSummaryCandidate`
- `allowedScopeIntentCandidate`
- `forbiddenScopeIntentCandidate`
- `requiredEvidenceIntentCandidate`
- `riskIntentCandidate`
- `confidence`
- `ambiguities`
- `requiresClarification`
- `humanReviewRequired`

All AI-produced fields are candidate-only. Target record and component candidates require deterministic existence checks before they can influence graph traversal.

The Request IR Candidate schema preview is:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-candidate-schema.runtime-evidence-only.preview.json
```

It defines the future AI analyzer output shape, required fields, narrow request type taxonomy, confidence policy, and
future validator expectations. The schema is not a validated Request IR schema implementation; it is candidate-only and
does not permit graph traversal, contract generation, or instruction pack generation.

The first calibration Request IR candidate fixture is:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json
```

It models the natural-language request:

```text
Todo App에서 add 버튼 동작 증거만 추가해줘. production source는 건드리지 마.
```

The candidate is conservatively classified as `requestTypeCandidate: runtime-evidence-only`,
`changeTypeCandidate: test-only-behavior-proof`, `targetRecordIdCandidate: CH-001`, and
`targetComponentCandidate: Todo App`. It remains candidate-only and not validated.

## Request Type Taxonomy

The first taxonomy is deliberately narrow:

- `runtime-evidence-only`
- `behavior-change`
- `bug-fix`
- `refactor`
- `documentation-only`
- `investigation-only`
- `unknown`

Arbitrary request types are not allowed. Unknown or low-confidence classification must lead to clarification-required or human-review-required state before traversal.

## Trust Boundary

Required trust statuses are:

```text
aiAnalyzerOutputStatus: candidate-only
requestIrAuthorityStatus: not-authoritative-until-validated
graphTraversalAllowedFromUnvalidatedAiOutput: false
contractGenerationAllowedFromUnvalidatedAiOutput: false
instructionPackGenerationAllowedFromUnvalidatedAiOutput: false
```

AI may classify and propose. DevView validates. Deterministic graph traversal and contract generation begin only after validation.

## Validation Boundary

Future deterministic Request IR validation should check:

- enum values
- required fields
- graph record existence
- target component existence
- changeType compatibility
- policy compatibility
- required evidence availability
- unresolved ambiguity

Previewed validation statuses are:

- `validated`
- `validation-blocked`
- `clarification-required`
- `human-review-required`

The runtime validator is not implemented in this task.

## Graph Traversal Plan Boundary

The previewed traversal plan shape includes:

- `traversalPlanId`
- `sourceRequestIr`
- `startNodes`
- `nodeSelectionRules`
- `edgeSelectionRules`
- `selectedNodeCandidates`
- `selectedEdgeCandidates`
- `excludedNodes`
- `excludedEdges`
- `selectionTrace`
- `confidence`
- `requiresHumanReview`

AI does not directly select the final graph slice. AI may suggest candidates; deterministic traversal selects the final node/edge slice after Request IR validation.

## Contract Input Mapping

A validated Request IR may later feed:

- `targetScopeCandidates`
- `allowedScope`
- `forbiddenScope`
- `requiredEvidence`
- `stopConditions`
- `knownRisks`
- `outputRequirements`

The mapping is previewed only. No contract compiler input is generated here.

## Hook Gateway Relationship

The DevView Codex Hook Gateway controls activation and routing. Natural Language Request Intake controls compiler frontend semantics.

The hook gateway may route future `UserPromptSubmit` events toward Request IR candidate creation. It must not treat unvalidated AI output as compiler authority, graph traversal authority, or instruction-pack authority.

## Runtime Boundary

After a Request IR exists and is validated, the deterministic compiler path should remain local, fast, and compatible with the advisory 5 second runtime budget. Runtime compiler passes must not call an LLM, use the network, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, or enforce CI.
