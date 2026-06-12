---
name: pbe-autoflow
description: Orchestrate PBE execution profiles, staged Autoflow, natural-language gates, scope selection, architecture runway approval, review, revision, and stop/status actions.
---

# PBE Autoflow

Use this skill for:

```text
@project-blueprint-engine status
@project-blueprint-engine continue
@project-blueprint-engine approve
@project-blueprint-engine revise "..."
@project-blueprint-engine stop
```

Also use it for natural-language gate responses such as:

```text
approve this and continue
this looks good
select scope: implement USB status only
defer Ethernet to the next slice
create the foundation interface first
what is the dependency impact?
fix only the failed case and rerun
start the next slice
complete the current slice
complete the whole project
stop
current status please
```

## Philosophy

PBE is optimized for safe, reviewable, staged project construction, not for speed.

This means PBE may deliberately stop at human gates, may require foundation work before visible feature work, and may run sequentially when parallel safety cannot be proven.

## Routing Rules

When `.pbe/` exists or the user mentions PBE, ACEP, RPD, WPD, VD, traceability,
dependency impact, implementation scope, or PBE review, route implementation
work and deliverable-producing work through PBE before ordinary coding or file generation.

Deliverable-producing work includes code, tests, documents, slide decks, spreadsheets,
images, generated assets, review reports, and any repository file changes.

1. Read `.pbe/blueprint/pbe-state.json` before implementation or modification work.
2. If `autoflow.currentGate` is set, do not implement; report the active gate and ask for the user's decision.
3. If `autoflow.lastFailure` is set, do not continue downstream; report the failed step, repair options, and the last valid canonical state.
4. Before any downstream step or deliverable-producing action, verify RPD completion. If any Root or leaf requirement is still `pending_interview`, `interviewing`, `ready_to_confirm`, `ready_to_decompose`, or `blocked`, stop at `root_confirmation` or continue RPD.
5. If `autoflow.nextStep` is deterministic, run that PBE step before ordinary coding.
6. Use ordinary AI answers only for usage help, explanations, or reviews that do not change PBE workflow state.
7. Do not bypass PBE when the request touches selected, foundation, deferred, blocked, or out-of-scope work unless the profile is explicitly set to `bypass` and the risk is recorded.

## Execution Profiles

Use:

```text
bypass
lite
full
```

- `bypass`: typo, single-file edit, clearly bounded small bug fix. PBE should recommend not using the full workflow.
- `lite`: existing blueprint, small slice, limited scope and dependency review, no full ACEP unless needed.
- `full`: new project, large feature, UI/UX, multi-module, parallel work, future-module impact, architecture decisions, or project construction. This is the default for PBE.

If risk grows while in `lite`, propose `full`. If the user explicitly keeps `lite`, continue and record the risk.

## State Model

Track state in `.pbe/blueprint/pbe-state.json` under `autoflow`. Supported stage transitions should be written by the deterministic `pbe` CLI (`pbe rpd close`, `pbe ui approve`, `pbe wpd close`, `pbe vd close`, `pbe scope select`, `pbe acep ready`, `pbe execution complete`, `pbe review submit`, `pbe accept`) instead of hand-editing the state file.

```text
INIT
RPD_DONE
WAITING_UI_UX_CONFIRM
UI_UX_APPROVED
VISUAL_CONTRACT_READY
WPD_DONE
UI_SURFACE_INVENTORY_DONE
VD_DONE
WAITING_IMPLEMENTATION_SCOPE
SCOPE_SELECTED
ACEP_READY
ACEP_RUN_DONE
VISUAL_AUDIT_DONE
WAITING_REVIEW_RESULT
DONE
```

`DONE` means the user explicitly approved the current branch/slice/project. If the user starts another slice, move back to `WAITING_IMPLEMENTATION_SCOPE` with the new selected scope.

## Full Flow

```text
start
-> rpd
-> ui ux confirm gate
-> visual reference intake and design system derive, when visual UI work is selected
-> wpd
-> ui surface inventory, when visual UI work is selected
-> vd
-> dependency impact audit
-> implementation scope gate
-> architecture runway gate, when needed
-> plan execution
-> coverage audit
-> ux audit
-> generate acep
-> run acep
-> visual implementation audit, when visual UI work is selected
-> review result gate
-> done or next selected scope
```

Deterministic steps continue automatically. Human gates stop and explain why.

## Human Gates

Stop and guide the user at:

- `root_confirmation`
- `ui_ux_confirm`
- `implementation_scope`
- `architecture_runway`
- `review_result`
- `next_slice_decision`

For every gate, explain:

1. why PBE stopped
2. what risk exists
3. what the user should inspect
4. recommended choices
5. natural-language examples for approval, revision, questions, status, and stop

Do not show only internal commands.

## Official Response Separation

For PBE workflow state changes, stage completion, human gates, failures, and status requests, always separate the response into:

```text
[PBE 상태 보고]
```

and, only when useful:

```text
[Codex 메모]
```

Use `templates/pbe-status-card-template.md` as the base format.

Rules:

- `[PBE 상태 보고]` is the official state card. Keep it factual, structured, and predictable.
- `[Codex 메모]` is optional. Put reasoning, recommendations, tradeoffs, and context there.
- Do not mix free-form explanation into the state card.
- Do not use the state card for ordinary AI answers that are not reporting or changing PBE workflow state.
- Every human gate must include a `추천 답변` line so the user knows exactly what to type next.
- Every deterministic stage completion must say whether PBE will continue automatically or has reached a human gate.

Use these templates:

- `templates/stage-completion-status-card-template.md` after deterministic stage completion.
- `templates/autoflow-status-message-template.md` for status requests.
- `templates/implementation-scope-gate-message-template.md` at `implementation_scope`.
- `templates/architecture-runway-gate-message-template.md` at `architecture_runway`.
- `templates/next-slice-decision-gate-message-template.md` at `next_slice_decision`.
- `templates/ui-ux-gate-message-template.md` at `ui_ux_confirm`.
- `templates/review-result-gate-message-template.md` at `review_result`.
- `templates/autoflow-failure-message-template.md` for blocked automatic execution.

## Natural Language Mapping

Map natural language to actions:

```text
"approve", "looks good", "continue", "this is okay" -> approve / continue
"confirm this root", "use this structure" -> approve_root_confirmation
"select scope: ...", "implement only ..." -> select_scope
"full scope", "implement everything" -> select_full_scope
"defer ...", "postpone ..." -> mark_deferred
"foundation first", "stub only", "interface only" -> mark_foundation
"what is the dependency impact?" -> ask_dependency_impact
"fix ...", "add ...", "change ..." -> revise
"review ...", "what is risky?" -> ask
"current status" -> status
"stop", "cancel" -> stop
"complete current slice" -> complete_current_slice
"start next slice" -> start_next_slice
"complete project" -> complete_project
```

## Scope Classification

Every requirement, feature, or module must be classified:

- `selected`: implemented and verified in this slice
- `deferred`: explicitly postponed; not a failure
- `foundation`: structural preparation needed now for future modules
- `blocked`: cannot safely implement current slice without a decision or missing dependency
- `out_of_scope`: must not be changed in this work

Rules:

- Deferred is not failure.
- Missing selected scope is failure.
- Missing foundation scope is failure.
- Blocking dependencies stop Autoflow.
- Out-of-scope changes are a warning or failure depending on impact.

## Dependency Impact Audit

The owner for this step is `pbe-dependency-impact-audit`.

Before implementation scope is selected, inspect deferred and future modules:

- Does a future module affect current architecture?
- Is an interface, schema, state model, event, adapter, or stub needed now?
- Could adding the future module later cause a breaking change?
- Is the selected slice too small and likely to create the wrong structure?

Classify future items as:

- `Optional Deferred`
- `Required Foundation`
- `Blocking Dependency`
- `High-Impact Future Module`

## Architecture Runway Gate

If Required Foundation, Blocking Dependency, or High-Impact Future Module exists, stop and ask before execution.

Explain:

- what future item affects the current structure
- what foundation work is recommended
- what will remain deferred
- what risk exists if the foundation is skipped

The user can answer naturally, for example:

```text
approve this foundation and continue
create only the interface and keep Ethernet deferred
skip the foundation and continue with USB only
make Ethernet part of this slice too
```

## Failure Response

If an automatic step fails, record `lastFailure`, keep the last valid canonical state, and do not continue downstream.

Report:

```text
Failed step:
{failed_step}

Problem:
{reason}

Human check:
- what failed
- whether a human decision is needed
- whether automatic retry is safe

If revision is needed, describe the desired change naturally.

Downstream steps to rerun after repair:
{downstream_steps}
```

## Invariants

- RPD nodes are not Codex tasks.
- Deferred items are not current-slice failures.
- Selected and foundation items must be covered.
- Foundation must not implement deferred behavior.
- Required Foundation requires approval before execution.
- Blocking Dependency stops automatic progress.
- If parallel safety cannot be proven, do not parallelize.
- Codex cannot mark work accepted. Only the user can.
- Codex cannot treat a clear Root requirement as confirmed until the user approves the Root summary and decomposition decision.
