---
name: devview-autoflow
description: Orchestrate DevView execution profiles, staged Autoflow, natural-language gates, scope selection, architecture runway approval, review, revision, and stop/status actions.
---

# DevView Autoflow

## CLI Transition Rule

Use DevView CLI transition commands for workflow state changes. Do not edit `.devview/blueprint/devview-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

## Agent Context Rule

Do not read all DevView docs by default.

Read `agent-context/README.md` first. Then read only the smallest matching context card. Load full docs only when the card says they are needed.

If the task is unclear, ask one concise question instead of broad repository or documentation scanning.

Do not start broad workflow adaptation or repo-wide conversion before user confirmation.

## Workload Cap Rule

- Do not expand a small request into repo-wide DevView adaptation.
- Prefer the smallest matching scope.
- Use compact summaries by default.
- Full workflow adaptation requires explicit user confirmation.
- DevView tracks decisions, scope, tests, evidence, changes, and acceptance records; it does not persist every explanation.

## Compact Fast Path and Compact Reporting

- For small scoped work, use compact reports by default.
- Do not expand a small request into long process narration.
- Keep the DevView control chain intact: intent, expectedFiles, AC, evidence, review, acceptance.
- Prefer `devview context pack` or `agent-context` before long docs.
- Full reporting is reserved for release/checkpoint/audit/high-risk/repeated-failure/user-requested cases.
- Compact reporting must not bypass state transitions, human gates, Review Result, or explicit user acceptance.
- Codex must not mark work accepted automatically.

## Human Gate Clarity Rule

Autoflow may continue only when clarity is sufficient and no hard trigger exists. If ambiguity or a hard trigger appears,
stop and ask the smallest Human Gate question that resolves the blocker.

Autoflow stop conditions:

- `clarityScore` below threshold
- hard trigger present
- unconfirmed Product -> Work implementation choice
- verification method is subjective/manual-only
- evidence is weak for the AC type
- scope exceeds selected profile cap
- acceptance is required

Do not hide Product -> Work, Work -> Test, or Evidence -> Acceptance assumptions inside automated flow. Short reporting
is fine; skipped gates are not.

## Role

`devview-autoflow` is an orchestration/helper skill.

It helps Codex select the next appropriate DevView skill or CLI phase, but it is not the source of truth for state transitions. The primary state transition path is the `devview` CLI command flow.

Do not use this skill to directly edit `.devview` state artifacts, and do not reintroduce legacy gate or direct state-edit instructions.

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

DevView is optimized for safe, reviewable, staged project construction, not for speed.

This means DevView may deliberately stop at human gates, may require foundation work before visible feature work, and may run sequentially when parallel safety cannot be proven.

## Routing Rules

When `.devview/` exists or the user mentions DevView, execution-pack, product-intake, work-planning, verification-design, traceability,
dependency impact, implementation scope, or DevView review, route implementation
work and deliverable-producing work through DevView before ordinary coding or file generation.

Deliverable-producing work includes code, tests, documents, slide decks, spreadsheets,
images, generated assets, review reports, and any repository file changes.

1. Read `.devview/blueprint/devview-state.json` before implementation or modification work.
2. If `autoflow.currentGate` is set, do not implement; report the active gate and ask for the user's decision.
3. If `autoflow.lastFailure` is set, do not continue downstream; report the failed step, repair options, and the last valid canonical state.
4. Before any downstream step or deliverable-producing action, verify product-intake completion. If any Root or leaf requirement is still `pending_interview`, `interviewing`, `ready_to_confirm`, `ready_to_decompose`, or `blocked`, stop at `root_confirmation` or continue product-intake.
5. If the CLI-reported next step is deterministic, run that DevView step before ordinary coding.
6. Use ordinary AI answers only for usage help, explanations, or reviews that do not change DevView workflow state.
7. Do not bypass DevView when the request touches selected, foundation, deferred, blocked, or out-of-scope work unless the profile is explicitly set to `bypass` and the risk is recorded.

## Execution Profiles

Use:

```text
bypass
lite
full
```

- `bypass`: typo, single-file edit, clearly bounded small bug fix. DevView should recommend not using the full workflow.
- `lite`: existing blueprint, small slice, limited scope and dependency review, no full execution-pack unless needed.
- `full`: new project, large feature, UI/UX, multi-module, parallel work, future-module impact, architecture decisions, or project construction. This is the default for DevView.

If risk grows while in `lite`, propose `full`. If the user explicitly keeps `lite`, continue and record the risk.

## State Model

Track state in `.devview/blueprint/devview-state.json` under `autoflow`, but do not write transition state by hand. Supported stage transitions and checkpoints must go through the deterministic `devview` CLI (`devview product-intake close`, `devview ui approve`, `devview work-planning close`, `devview verification-design close`, `devview scope select`, `devview dependency audit complete`, `devview plan execution complete`, `devview coverage audit complete`, `devview ux audit complete`, `devview execution-pack ready`, `devview execution start`, `devview execution complete`, `devview review submit`, `devview accept`, `devview change create`, `devview impact analyze`, `devview revision start`, `devview revision complete`, `devview files check`).

```text
INIT
PRODUCT_INTAKE_DONE
WAITING_UI_UX_CONFIRM
UI_UX_APPROVED
VISUAL_CONTRACT_READY
WORK_PLANNING_DONE
UI_SURFACE_INVENTORY_DONE
VERIFICATION_DESIGN_DONE
WAITING_IMPLEMENTATION_SCOPE
SCOPE_SELECTED
EXECUTION_PACK_READY
EXECUTION_IN_PROGRESS
EXECUTION_PACK_RUN_DONE
VISUAL_AUDIT_DONE
WAITING_REVIEW_RESULT
ACCEPTED
DONE
```

`DONE` means the user explicitly approved the current branch/slice/project. If the user starts another slice, move back to `WAITING_IMPLEMENTATION_SCOPE` with the new selected scope.

## Full Flow

```text
start
-> product-intake
-> ui ux confirm gate
-> visual reference intake and design system derive, when visual UI work is selected
-> work-planning
-> ui surface inventory, when visual UI work is selected
-> verification-design
-> dependency impact audit
-> implementation scope gate
-> architecture runway gate, when needed
-> plan execution
-> coverage audit
-> ux audit
-> generate execution-pack
-> run execution-pack
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

1. why DevView stopped
2. what risk exists
3. what the user should inspect
4. recommended choices
5. natural-language examples for approval, revision, questions, status, and stop

Do not show only internal commands.

## Official Response Separation

For DevView workflow state changes, stage completion, human gates, failures, and status requests, always separate the response into:

```text
[DevView ?곹깭 蹂닿퀬]
```

and, only when useful:

```text
[Codex 硫붾え]
```

Use `templates/stage-completion-status-card-template.md` as the base format.

Rules:

- `[DevView ?곹깭 蹂닿퀬]` is the official state card. Keep it factual, structured, and predictable.
- `[Codex 硫붾え]` is optional. Put reasoning, recommendations, tradeoffs, and context there.
- Do not mix free-form explanation into the state card.
- Do not use the state card for ordinary AI answers that are not reporting or changing DevView workflow state.
- Every human gate must include a `異붿쿇 ?듬?` line so the user knows exactly what to type next.
- Every deterministic stage completion must say whether DevView will continue automatically or has reached a human gate.

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

The owner for this step is `devview-dependency-impact-audit`.

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

If an automatic step fails, do not edit `autoflow.lastFailure` manually. Use the CLI failure output as the source of truth, follow its `suggestedFix` and `nextCommand`, keep the last valid canonical state, and do not continue downstream.

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

- product-intake nodes are not Codex tasks.
- Deferred items are not current-slice failures.
- Selected and foundation items must be covered.
- Foundation must not implement deferred behavior.
- Required Foundation requires approval before execution.
- Blocking Dependency stops automatic progress.
- If parallel safety cannot be proven, do not parallelize.
- Review and accept transitions must pass File Change Guard. `devview review submit` and `devview accept` run the guard; use `devview files check` before those transitions when source files changed.
- Source file changes that are not explained by active Work or Revision scope must open Change/Impact/Revision flow instead of advancing state.
- Codex cannot mark work accepted. Only the user can.
- Codex cannot treat a clear Root requirement as confirmed until the user approves the Root summary and decomposition decision.
