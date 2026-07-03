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
requestIrValidatorImplemented: true
requestIrValidatorScope: schema-and-boundary-only
graphAwareRequestIrValidatorImplemented: true
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

## Schema-Only Validation

The first deterministic validator is now available as a schema-and-boundary-only pass:

```text
graph read-model validate-request-ir --candidate <candidatePath> --json
```

The Todo App calibration result is:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-validation.add-todo-runtime-evidence-only.preview.json
```

For the first calibration candidate it reports:

```text
schemaValidationStatus: schema-valid
requestIrValidationStatus: schema-valid-graph-validation-not-run
graphAuthorityValidationStatus: not-run
graphTraversalAllowed: false
contractGenerationAllowed: false
instructionPackGenerationAllowed: false
```

This is not graph-aware validation. It checks required fields, enum values, candidate-only boundaries, authority status,
confidence policy, ambiguity policy, and the safety rule that unvalidated candidates cannot drive traversal or contract
generation.

## Graph-Aware Validation

The graph-aware validation boundary is previewed in:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-graph-aware-validation-boundary.runtime-evidence-only.preview.json
```

The first non-traversing graph-aware validator is now available as:

```text
graph read-model validate-request-ir-graph --candidate <candidatePath> --schema-validation <schemaValidationPath> --json
```

The Todo App calibration graph-aware validation result is:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-graph-validation.add-todo-runtime-evidence-only.preview.json
```

This pass resolves schema-valid candidate fields against graph/read-model authority before traversal. The first
calibration values remain candidates until this validator resolves them:

```text
targetRecordIdCandidate: CH-001
targetComponentCandidate: Todo App
requestTypeCandidate: runtime-evidence-only
changeTypeCandidate: test-only-behavior-proof
```

For the current calibration fixture, graph-aware validation resolves `CH-001`, `Todo App`,
`runtime-evidence-only`, and `test-only-behavior-proof` against the structure-only graph-source/read-model metadata and
reports `graphValidationStatus: graph-aware-valid`.

`graphTraversalAllowed: true` means only that a later traversal pass may be attempted. The validator still reports
`graphTraversalExecuted: false`, `selectedGraphSliceGenerated: false`, `contractGenerationAllowed: false`,
`contractInputGenerated: false`, and `instructionPackGenerated: false`.

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

The current schema-only Request IR validator checks:

- enum values
- required fields
- candidate-only boundary fields
- authority status
- confidence and ambiguity policy
- graph traversal remains disallowed from unvalidated candidates
- contract generation remains disallowed from unvalidated candidates

The graph-aware Request IR validator checks:

- graph record existence
- target component existence
- changeType compatibility
- policy compatibility
- required evidence availability
- risk intent resolution

Previewed validation statuses are:

- `schema-valid-graph-validation-not-run`
- `graph-aware-valid`
- `validation-blocked`
- `clarification-required`
- `human-review-required`

The schema-only runtime validator and the graph-aware runtime validator are implemented. Graph traversal remains future
work.

Schema-valid does not mean validated-for-traversal. Graph-aware-valid means future traversal permission only. Edge
traversal, selected graph slice generation, contract input generation, and instruction pack generation remain blocked.

## Graph Traversal Plan Boundary

The traversal plan boundary preview for the Todo App calibration request is:

```text
examples/valid/todo-app-pbe-run/generated/graph-traversal-plan-boundary.add-todo-runtime-evidence-only.preview.json
```

The previewed traversal plan shape includes:

- `traversalPlanId`
- `sourceRequestIrCandidate`
- `sourceSchemaValidation`
- `sourceGraphAwareValidation`
- `startNodeCandidates`
- `startNodeResolutionStatus`
- `nodeSelectionRules`
- `edgeSelectionRules`
- `requiredNodeTypes`
- `optionalNodeTypes`
- `excludedNodeTypes`
- `requiredEdgeTypes`
- `optionalEdgeTypes`
- `excludedEdgeTypes`
- `traversalDepthLimit`
- `selectionTracePolicy`
- `ambiguityPolicy`
- `contractInputReadinessPolicy`

For the add-todo runtime-Evidence-only calibration, the future traversal intent starts from `CH-001` and should confirm
the target component, scope policy, allowed/forbidden scope sources, required evidence policy, stop conditions, output
requirements, and linked risks when present. These are future candidates only; no node or edge is selected by this
boundary artifact.

AI does not directly select the final graph slice. AI may suggest candidates; deterministic traversal selects the final
node/edge slice only after schema-only validation and graph-aware validation have succeeded.

## Selected Graph Slice Boundary

The selected graph slice boundary preview for the Todo App calibration request is:

```text
examples/valid/todo-app-pbe-run/generated/selected-graph-slice-boundary.add-todo-runtime-evidence-only.preview.json
```

It defines the future selected slice shape:

- `selectedGraphSliceId`
- `sourceTraversalPlan`
- `sourceGraphAwareValidation`
- `selectedNodes`
- `selectedEdges`
- `includedPolicyNodes`
- `includedScopeNodes`
- `includedEvidenceNodes`
- `includedRiskNodes`
- `excludedNodes`
- `excludedEdges`
- `selectionTrace`
- `sliceCompletenessStatus`
- `contractInputReadinessStatus`

Current required values remain:

```text
selectedGraphSliceStatus: not-generated
selectedGraphSliceGenerated: false
contractInputGenerated: false
instructionPackGenerated: false
```

If multiple target records/components match, if required policy/evidence nodes are missing, or if source authority
cannot be proven, the future slice must be marked ambiguous or incomplete and contract input generation must remain
blocked.

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

Contract compiler input cannot be generated directly from a Request IR Candidate, schema-only validation, graph-aware
validation, or traversal boundary preview. A future complete selected graph slice is the required handoff artifact.

## Hook Gateway Relationship

The DevView Codex Hook Gateway controls activation and routing. Natural Language Request Intake controls compiler frontend semantics.

The hook gateway may route future `UserPromptSubmit` events toward Request IR candidate creation. It must not treat unvalidated AI output as compiler authority, graph traversal authority, or instruction-pack authority.

## Runtime Boundary

After a Request IR exists and is validated, the deterministic compiler path should remain local, fast, and compatible with the advisory 5 second runtime budget. Runtime compiler passes must not call an LLM, use the network, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, or enforce CI.
