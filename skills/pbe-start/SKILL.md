---
name: pbe-start
description: Start Project Blueprint Engine in a target repo, enable autoflow, create .pbe blueprint files, and begin RPD automatically.
---

# PBE Start

Use this skill when the user asks to start Project Blueprint Engine, for example:

```text
@project-blueprint-engine start
Project: inventory management program
```

or:

```text
@project-blueprint-engine start
Add order cancellation to this existing project.
```

## Purpose

Initialize `.pbe/blueprint/` in the target repository. PBE is not a GUI and does not call OpenAI APIs from a separate app. It is a Codex skill workflow that writes durable planning artifacts into the repository.

`start` enables Autoflow. The user should not need to type each internal step
manually after start.

PBE is optimized for safe, reviewable, staged project construction, not for speed. Default to the `full` execution profile for new projects, large features, UI/UX work, multi-module changes, architecture decisions, parallel work, or future-module impact.

Use `bypass` only when the request is a typo, single-file edit, or clearly bounded small bug fix. Use `lite` only when a blueprint already exists and the user asks for a small slice that does not need full ACEP execution.

## Required Actions

1. Inspect the target repository enough to understand whether this is a new project or a change to an existing project.
2. Create `.pbe/blueprint/` if it does not exist.
3. Create or update `.pbe/blueprint/pbe-state.json`.
4. Create or update `.pbe/blueprint/project-brief.md`.
5. Create `.pbe/blueprint/requirement-tree.json` with a root node if it does not exist.
6. Create `.pbe/blueprint/source-of-truth-matrix.md` from the Source of Truth Matrix template.
7. Create `.pbe/blueprint/pbe-invariants.md` from the PBE Invariants template.
8. Create `.pbe/blueprint/foundation-contract.md` and `.pbe/blueprint/parallel-safety-contract.md` placeholders.
9. Create `.pbe/blueprint/requirement-tree.md`, `.pbe/blueprint/rpd-interview-log.md`, and `.pbe/blueprint/rpd-summary.md`.
10. Initialize UI/UX confirmation placeholders when UI work may be involved.
11. Initialize `pbe-state.json.autoflow` with:
   - `state`: `STARTED`
   - `enabled`: `true`
   - `profile`: `full`, `lite`, or `bypass`
   - `completedSteps`: `["start"]`
   - `nextStep`: `rpd`
12. Immediately begin RPD Tree Walk unless the selected profile is `bypass`.
13. If the provided project brief is enough to complete RPD safely, continue automatically until the UI/UX confirmation gate.
14. If RPD needs more information, ask exactly one RPD question. The user should answer naturally; do not require `@project-blueprint-engine rpd`.

## File Contract

Use these paths:

```text
.pbe/blueprint/pbe-state.json
.pbe/blueprint/project-brief.md
.pbe/blueprint/source-of-truth-matrix.md
.pbe/blueprint/pbe-invariants.md
.pbe/blueprint/foundation-contract.md
.pbe/blueprint/parallel-safety-contract.md
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/requirement-tree.md
.pbe/blueprint/rpd-interview-log.md
.pbe/blueprint/rpd-summary.md
.pbe/blueprint/ui-ux-preview.json
.pbe/blueprint/ui-ux-preview.md
.pbe/blueprint/ui-ux-confirmation.md
.pbe/blueprint/ui-ux-confirmation-log.md
```

The initial root node status is `pending_interview` unless the user already provided enough detail to begin as `interviewing`.

## Startup State

Set `pbe-state.json` stage to `rpd` and mode to `rpd_tree_walk`.

Set `pbe-state.json.autoflow.state` to `STARTED`.

Set `pbe-state.json.autoflow.profile` to the chosen profile. If no profile is explicitly requested, set it to `full`.

Do not generate WPD, VD, ACEP, review, feedback, or revision files during start unless RPD is already complete and the next deterministic step can safely continue. Stop at UI/UX confirmation when UI/UX judgment is required.

## Profile Decision

Report the chosen profile and why:

- `bypass`: PBE not needed; tell the user the direct coding path is safer and faster.
- `lite`: small slice with known blueprint and limited dependency impact.
- `full`: project construction, multi-module scope, UI/UX, parallel work, architecture runway, or future-impact risk.

If profile is `bypass`, do not manufacture `.pbe` artifacts unless the user explicitly wants them.

## Autoflow Behavior

After initialization:

```text
start -> rpd
```

When RPD completes:

```text
rpd -> ui ux confirm gate
```

At the UI/UX gate, stop and show the friendly UI/UX confirmation guidance. Do
not tell the user only to run another command.

## Response Format

After initialization, report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must include:

- created or updated files
- current stage
- execution profile
- current node id and title
- autoflow state
- next action
- the single next RPD question, if RPD needs more input
- UI/UX confirmation guidance, if RPD completed and UI/UX confirmation is required
- whether PBE will continue automatically or is stopped at a human gate
- user reply examples and one recommended reply when a human response is needed

Use `[Codex 메모]` only for short rationale, such as why the selected execution profile was chosen.

Ask only one open-ended question.
