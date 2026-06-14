---
name: pbe-review-result
description: Review executed PBE cycle results, present Product branch coverage, collect user acceptance or dissatisfaction, and close branches or create Change Nodes without Codex self-acceptance.
---

# PBE Review Result

## CLI Transition Rule

Use PBE CLI transition commands for workflow state changes. Do not edit `.pbe/blueprint/pbe-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

Use this skill after ACEP execution or revision execution has been closed by the CLI.

## Purpose

Prepare a review pack that lets the user decide whether to accept the current slice, request changes, ask questions, start the next slice, or complete the whole project.

Review is Product branch closure, not Codex self-acceptance. Codex must not mark work as `accepted` or Product branches as `accepted_done`.

This skill is a human gate in Autoflow. Stop here until the user approves, requests revision, asks a question, or stops.

## Inputs

Prefer v2 tree/control/evidence files when present:

```text
.pbe/tree/product-tree.json
.pbe/tree/project-tree.json
.pbe/tree/work-tree.json
.pbe/tree/test-tree.json
.pbe/execution/cycle-tree.json
.pbe/execution/cycle-contract.md
.pbe/control/change-tree.json
.pbe/control/impact-tree.json
.pbe/control/acceptance-tree.json
.pbe/control/legacy-control-inventory.json
.pbe/control/surface-completion-ledger.json
.pbe/control/hardware-readiness-ledger.json
.pbe/control/visual-verification-profile.json
.pbe/control/verification-miss-log.json
.pbe/evidence/evidence-tree.json
```

Also read ACEP review artifacts:

```text
.pbe/codex-execution-pack/17-final-report-template.md
.pbe/codex-execution-pack/16-final-coverage-check.md
.pbe/codex-execution-pack/15-ui-ux-evidence-checklist.md
.pbe/codex-execution-pack/04-traceability-matrix.json
.pbe/codex-execution-pack/execution-manifest.json
.pbe/codex-execution-pack/22-cycle-contract.md
```

Also inspect current changed files and validation results when available.

## Outputs

```text
.pbe/review/codex-final-report.md
.pbe/review/result-summary.md
.pbe/review/changed-files.md
.pbe/review/validation-results.md
.pbe/review/coverage-result.md
.pbe/review/ui-ux-evidence.md
.pbe/review/user-review-checklist.md
.pbe/review/user-feedback.md
```

When user approval is explicit, record the approval only as a user-driven acceptance record and use `pbe accept` for the transition. Do not infer acceptance from passing tests or silence.

## Delivery Status

Allowed Codex statuses:

```text
implemented
verified
submitted_for_review
revision_requested
revision_in_progress
revision_verified
```

Only the user can set:

```text
accepted
accepted_done
```

When this skill completes without explicit user approval, set or report status as:

```text
submitted_for_review
```

Use `pbe review submit` to enter `WAITING_REVIEW_RESULT`; do not hand-edit `pbe-state.json` for review submission. `pbe review submit` runs File Change Guard, so unexplained source file changes must be resolved through Work or Revision scope before review.

If the user approves at this gate, record the explicit user approval in Acceptance Tree and run `pbe accept` to move to `DONE` only when the approval closes the current branch/slice/project. `pbe accept` also runs File Change Guard. If source file changes are not explained by active Work or Revision scope, do not accept; open Change/Impact/Revision instead. If the user wants another slice, use implementation scope selection for the next slice instead of silently editing state.

## Branch Review Scope

The review pack must separate:

- active cycle ID
- included Product branches
- implemented Work nodes
- verified Test nodes
- evidence attached
- partial satisfaction
- stale or invalidated evidence
- reopened nodes
- surface completion layer: technical stable, parity reviewed, or product accepted
- legacy inventory gaps, when active
- dialog/subdialog, control, and event-handler gaps, when active
- items listed as not checked and whether they block closure
- visual/runtime verification gaps, when active
- hardware readiness and certification state, when active
- verification misses promoted or still pending, when active
- selected scope completed
- foundation scope completed
- deferred scope protected
- blocked scope, if any
- out-of-scope changes, if any
- failed or skipped validation
- remaining risks
- recommended next slice

## Evidence Quality Review

- During review, check whether evidence proves the linked Test/AC, not only whether evidence exists.
- Treat vague evidence such as "확인함" or "문제 없음" as weak.
- If evidence is weak, request stronger evidence before acceptance or create Change/Impact if verification strategy is
  wrong.
- If evidence proves the wrong thing, classify it as verification mismatch.
- Use `docs/evidence-quality-rubric.md` and `templates/evidence-quality-checklist-template.md` for weak or contested
  evidence.

## Acceptance Tree Rules

When the user explicitly approves the current slice:

1. Update only Product branches included in the active cycle.
2. Set branch status to `satisfied` or `accepted_done` only when evidence and review support it.
3. `accepted_done` requires explicit user acceptance text, `userAcceptedAt`, and linked evidence.
4. If coverage is partial, use `partial_satisfied` and explain what remains.
5. If impact analysis marks a branch `stale`, `invalidated`, or `reopened`, do not close it.
6. If required dialog/subdialog controls, event handlers, hardware actions, or workflow states are not checked, do not close the branch beyond the supported partial status.
7. After approval, move to `DONE` for the approved branch/slice/project, or to `WAITING_IMPLEMENTATION_SCOPE` when the user starts another slice.

Codex may recommend acceptance status, but the user is the only actor that can grant acceptance.

## User Review Checklist

Include:

- functional review
- UI/UX review
- validation review
- coverage audit review
- UX audit review
- evidence review
- surface completion and parity review
- hardware readiness review
- verification miss/root-cause review
- impact/reopen review
- remaining issues review
- final decision:
  - approve this slice
  - needs revision
  - start next slice
  - complete whole project
  - stop

## Friendly Gate Guidance

Do not show only internal commands. Use `[PBE 상태 보고]` first, following `templates/review-result-gate-message-template.md`. Put any reasoning under `[Codex 메모]`.

Explain:

```text
최종 결과 검토 단계입니다.

아래 내용을 확인해주세요:
- 실행 결과
- 실패한 테스트 케이스
- coverage audit 결과
- UX audit 결과
- Evidence Tree 반영 상태
- Impact/Reopen 상태
- 남은 리스크
- 재실행이 필요한 항목

이 결과가 괜찮으시면, 채팅창에 승인한다고 말해주세요.

수정이나 재실행이 필요하시면, 원하는 내용을 자연스럽게 말씀해주세요.

판단이 어려우시면 "완료해도 되는 상태인지 판단해주세요"처럼 물어보셔도 됩니다.
```

After approval, explain the next-slice gate:

```text
This slice is reviewed.

Choose one:
- complete the current slice
- start the next slice
- complete the whole project
- request a revision
```

## Revision Routing

If the user is dissatisfied:

1. If the user repeatedly rejects the same area, do not immediately continue to another revision. First classify the failure type.
2. Ask one recovery question before creating another revision when alignment is unclear.
3. If product meaning changed, use Product Patch Proposal.
4. If UI/UX taste is the issue, ask for reference, screenshot, disliked current result, or design constraints.
5. If scope is too large, propose a smaller recovery slice.
6. If acceptance criteria are vague, return to RPD/AC clarification before revision.
7. Record diagnostic context in Change/Impact notes rather than creating a new artifact.
8. Use `docs/review-failure-recovery.md` and `templates/review-diagnostic-template.md` for repeated rejection or alignment risk.
9. Run `pbe-collect-feedback`.
10. Map feedback to affected Product, Project, Work, Test, Evidence, UI/UX, Cycle, and compatibility requirement/task/verification IDs.
    10a. If the feedback is visual, parity, hardware, or repeated-failure related, map it to surface completion, legacy inventory, visual profile, hardware readiness, or verification miss entries when present.
11. Run `pbe change create` for feedback that changes product meaning, scope, UX, risk, acceptance, verification, or accepted work.
12. Run `pbe impact analyze` to create Impact Tree links.
13. Run `pbe revision start` before coding revision work.
14. Perform the bounded revision work inside the active Revision scope.
15. Run `pbe revision complete`.
16. Return through the normal WPD/VD/ACEP/Execution/Review/Accept closure path as required by CLI output.

If bounded revision work is needed after Change / Impact analysis, hand off to `pbe-run-revision` as a helper skill. Do not treat `pbe-run-revision` as a bypass around Product Patch, evidence, review, or user acceptance.

Revision must stay inside affected selected/foundation scope unless the user explicitly changes implementation scope.

## Completion Report

Report with `[PBE 상태 보고]` first:

- review pack paths
- active cycle ID
- included Product/Work/Test/Evidence summary
- selected/foundation/deferred/out-of-scope summary
- validations run and skipped
- coverage and UX audit status
- Impact Tree and reopened node status
- Acceptance Tree status
- surface completion layer summary, when active
- legacy inventory, visual/runtime, hardware readiness, and verification miss status, when active
- delivery status: `submitted_for_review`
- next human choices in natural language
- recommended reply for the user

Use `[Codex 메모]` only for short review guidance or risk interpretation.
