---
name: pbe-create-revision-pack
description: Convert mapped user feedback into a bounded Revision Pack that changes only affected scope.
---

# PBE Create Revision Pack

Use this skill after `pbe-collect-feedback`.

In Autoflow, run this skill automatically after feedback is mapped clearly.

## Purpose

Create a bounded revision instruction pack from user feedback. Revision is patch work, not a full project rewrite.

The revision pack must preserve implementation scope classifications. Feedback may affect selected or foundation work from the current slice. Deferred or out-of-scope work can only enter the revision if the user explicitly changes the scope at a human gate.

## Inputs

```text
.pbe/review/feedback-items.json
.pbe/review/user-feedback.md
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/work-design.json
.pbe/blueprint/verification-design.json
.pbe/codex-execution-pack/execution-manifest.json
```

## Output Folder

```text
.pbe/revisions/rev-001/
```

Use the next available revision number.

## Required Files

```text
00-revision-summary.md
01-user-feedback.md
02-affected-nodes.md
03-revision-requirements.md
04-revision-work-plan.md
05-revision-verification-plan.md
06-revision-task-cards/revision-task-001.md
07-regression-checks.md
08-review-checklist.md
revision-manifest.json
```

## Scope Rules

1. Include only feedback-mapped affected requirements, tasks, UI/UX items, and verification items.
2. Do not modify unrelated behavior.
3. Include regression checks for previously accepted or unaffected behavior.
4. If feedback scope is unclear, ask clarification before creating implementation tasks.
5. Record explicit non-scope.
6. Preserve `selected`, `foundation`, `deferred`, `blocked`, and `out_of_scope` classifications.
7. Do not convert deferred items into revision tasks without user scope approval.
8. If feedback reveals a missing foundation dependency, create a foundation revision task and record why it is required.

## Autoflow

When the revision pack is created:

- Add `create_revision_pack` to `pbe-state.json.autoflow.completedSteps`.
- Set `autoflow.nextStep` to `run_revision`.
- Continue automatically to `pbe-run-revision`.

When revision scope is unclear or too broad:

- Set `autoflow.state` to `BLOCKED` or keep the user at the Review Result gate with one clarification question.
- Do not run revision tasks.

## Completion Report

Report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say whether the revision pack was created and PBE is continuing automatically to Revision Runner, or whether scope is unclear and the user must answer.

Include revision pack path, affected scope, task count, regression checks, next step, user reply examples when blocked, and one recommended reply.

Use `[Codex 메모]` only for short explanation of revision boundaries.
