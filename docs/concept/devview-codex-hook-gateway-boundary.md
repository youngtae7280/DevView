# DevView Codex Hook Gateway Boundary

This document defines the preview boundary for using Codex lifecycle hooks as the DevView activation gateway.

DevView already has a later deterministic runtime path:

- advisory `graph read-model check-scope`
- compact advisory scope report
- graph-delta-compatible source artifact
- proposal-only Graph Delta preview generation
- Human Review Packet generation

The hook gateway answers a different question: when DevView is ON, how should natural-language Codex execution be routed through DevView context, preflight, contract, post-check, proposal, and review-packet expectations?

This boundary is preview-only. It does not implement hook scripts, block tool calls, call an LLM from hooks, mutate graph-source, apply graph deltas, approve graph updates, satisfy runtime Evidence, prove equivalence, create CI required checks, or automate user acceptance.

## Preview Artifact

The boundary preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-codex-hook-gateway-boundary.runtime-evidence-only.preview.json
```

Required safety values remain:

```text
hookScriptsImplemented: false
actualBlockingHookBehaviorImplemented: false
strictModeEnabled: false
ciEnforcementEnabled: false
graphApplyEnabled: false
approvalAutomationEnabled: false
graphSourceMutated: false
graphDeltaApplied: false
approvalStatus: not-approved
humanDecisionRecorded: false
```

## Activation Modes

The preview defines four DevView modes:

- `off`: no automatic DevView hook intervention.
- `advisory`: future hooks may add DevView context and report missing pipeline steps without blocking.
- `guided`: future hooks may block unsafe prompt/tool/stop flow when required session artifacts or contract boundaries are missing.
- `strict-disabled`: reserved future mode and explicitly unavailable now.

Current status is conservative: strict mode is disabled, CI enforcement is disabled, graph apply is disabled, and approval automation is disabled.

## Hook Responsibilities

The previewed lifecycle responsibilities are:

- `SessionStart`: load DevView enabled/mode state, inject project-level DevView context, and remind Codex that unvalidated AI output is candidate-only.
- `UserPromptSubmit`: when DevView is ON, append DevView context to the natural-language request. In a future guided mode, require a DevView preflight/session before editing begins.
- `PreToolUse`: check for DevView session and contract boundaries before edit-capable tools. Future advisory mode may warn; future guided mode may block when required state is missing.
- `PostToolUse`: observe changed files and update transient session state when safe. It must not undo side effects.
- `Stop`: verify post-check, advisory scope report, proposal-only preview, and Human Review Packet requirements. Future guided mode may request continuation when required post-checks are missing.

## Session Artifact Preview

A future transient session artifact may live under:

```text
.tmp/devview/sessions/<sessionId>/session.json
```

The previewed shape includes request intake, Request IR candidate paths, validated Request IR paths, graph traversal status, execution contract path, instruction pack path, post-check status, scope report path, proposal preview path, Human Review Packet path, and safety fields:

```text
approvalStatus: not-approved
graphSourceMutated: false
graphDeltaApplied: false
```

This session artifact is transient runtime state. It is not graph-source, not a graph delta, not approval, and not accepted Evidence.

## Bypass Detection

The gateway preview defines bypass detection statuses for:

- missing preflight
- missing contract
- missing post-check
- missing Human Review Packet

Advisory mode reports bypass risk. Guided mode may block or request continuation in a future implementation. Strict mode remains disabled.

## UserPromptSubmit Context

When DevView is ON, future `UserPromptSubmit` behavior should append context saying:

- DevView is ON.
- Natural-language requests must be analyzed into a Request IR candidate before editing.
- AI analyzer output is candidate-only and must be validated.
- Editing should wait for a DevView execution contract and instruction pack unless the active gateway mode explicitly allows advisory bypass.
- After editing, Codex should run post-checks, advisory `check-scope`, proposal-only Graph Delta generation, and Human Review Packet generation.
- Codex must not approve, apply, mutate graph-source, satisfy Evidence, record decisions, or automate acceptance.

This context does not generate instruction packs from unvalidated AI output.

## Natural Language Request Intake

The compiler frontend semantics for natural-language request intake are previewed separately in
[natural-language-request-intake-boundary.md](natural-language-request-intake-boundary.md) and:

```text
examples/valid/todo-app-pbe-run/generated/natural-language-request-intake-boundary.runtime-evidence-only.preview.json
```

The Hook Gateway is the activation and routing boundary. Natural Language Request Intake is the compiler frontend
semantics boundary. Future `UserPromptSubmit` hooks may route a request toward Request IR candidate creation, but they
must not let unvalidated AI output drive graph traversal, contract compiler input generation, or instruction pack
generation.

The Request IR Candidate schema and first calibration fixture are previewed as future analyzer outputs:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-candidate-schema.runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json
```

The schema-only validation result for that fixture is:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-validation.add-todo-runtime-evidence-only.preview.json
```

These files do not implement hook behavior or AI classification. The schema-only validator checks schema and
candidate-only safety boundaries. The graph-aware Request IR validator is now implemented as a non-traversing pass; a
graph-aware-valid result may permit a later traversal attempt but still cannot itself drive graph traversal, contract
generation, or instruction pack generation.

The graph-aware validation boundary and first validation result are:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-graph-aware-validation-boundary.runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/request-ir-graph-validation.add-todo-runtime-evidence-only.preview.json
```

They are still not hook behavior, not graph traversal, not selected graph slice generation, and not contract compiler
input generation.

## Trust Boundary

Project-local hooks require explicit trust and enablement. DevView must not assume a hook gateway is active until a future health check confirms:

- hooks are enabled;
- project hook config is present;
- DevView hook commands are trusted;
- expected hook events have been observed.

The previewed health statuses are:

```text
hookGatewayConfigured: not-checked
hookGatewayTrusted: not-checked
hookGatewayActive: not-checked
lastObservedHookEvent: null
```

## Runtime Boundary

Future hook scripts must remain lightweight and compatible with the advisory 5 second deterministic runtime budget. They must avoid AI calls, network calls, full repo scans, patch/hunk inspection, file-content semantic analysis, and full validation inside the hook path unless a later explicit decision changes the boundary.

The current task adds no measured hook runtime. It only records the activation and routing boundary.
