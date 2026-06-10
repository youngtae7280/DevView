---
name: pbe-vd
description: Generate Verification Design artifacts from WPD outputs and the RPD requirement tree.
---

# PBE VD

Use this skill to create Verification Design from WPD output.

VD is deterministic in Autoflow. Run it automatically after WPD succeeds.

VD owns verification design. It must preserve selected, deferred, foundation, blocked, and out-of-scope classifications from WPD and must not turn deferred implementation into current-slice verification failure.

## Inputs

```text
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/work-design.json
.pbe/blueprint/work-graph.json
.pbe/blueprint/work-roadmap.md
.pbe/blueprint/source-of-truth-matrix.md
.pbe/blueprint/foundation-contract.md
```

## Outputs

```text
.pbe/blueprint/verification-design.json
.pbe/blueprint/verification-plan.md
```

## Required Actions

1. Verify WPD completion.
2. Create one VerificationDesign entry for each selected and foundation work unit.
3. Record deferred and out-of-scope verification expectations separately.
4. Synthesize parent and integration verification bottom-up.
5. Create a root-level acceptance plan for the current slice.
6. Identify validation command candidates.
7. Identify regression risks, including deferred-module foundation risk.
8. Save `verification-design.json`.
9. Save `verification-plan.md`.
10. Update Source of Truth Matrix verification links.
11. Update `pbe-state.json` stage to `vd` or `acep_ready` when complete.
12. Update `pbe-state.json.autoflow.state` to `VD_DONE`.
13. Add `vd` to `autoflow.completedSteps`.
14. Set `autoflow.nextStep` to `dependency_impact_audit`.
15. Continue automatically to Dependency Impact Audit unless a blocker exists.

## VD Rules

- Do not conduct a long user interview in VD.
- Ask only for conditions that make verification impossible.
- Connect every validation item back to a requirement or work unit.
- Include focused validation, broader regression validation, and manual checks where needed.
- Mark uncertain validation commands as candidates rather than pretending they are guaranteed.
- Every verification item must link to a requirement ID and task/work ID.
- UI-related work must require UI/UX evidence.
- Do not allow a task to reach ACEP without verification links or an explicit explanation.
- Convert confirmed UI/UX direction into verification checks.
- Use WorkGraph nodes and edges to identify integration verification and regression checks.
- Verification must not assume RPD nodes are Codex task boundaries.
- Selected and foundation items require runnable verification or an explicit not-runnable reason.
- Deferred items require a deferral note, future verification hint, and dependency impact note.
- Out-of-scope items require no implementation verification, but must be recorded so they are not accidentally changed.

## VerificationDesign Shape

Each verification item should include:

- `id`
- `workDesignId`
- `taskId`
- `requirementNodeId`
- `requirementIds`
- `title`
- `acceptanceCriteria`
- `validationCommands`
- `manualChecks`
- `uiUxIds`
- `uiUxEvidenceRequired`
- `regressionRisks`
- `evidenceToCapture`

## Verification Plan Sections

`verification-plan.md` must include:

1. Selected Scope Verification
2. Foundation Verification
3. Deferred Scope Notes
4. Automated Tests
5. Manual Checks
6. UI/UX Evidence Checks
7. Regression Checks
8. Acceptance Checks
9. Not Runnable / Environment-limited Checks

Every verification item must state its linked requirement and task.

For UI/UX verification, include checks for confirmed states, required elements, accessibility expectations, and evidence requirements.

## Completion Report

Report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say that VD completed and that Dependency Impact Audit is the next automatic step. If the engine stops before Dependency Impact Audit, report that as a blocker or explicit manual pause.

Include:

- number of verification items
- selected/foundation/deferred verification split
- validation command candidates
- known manual checks
- created or updated files
- next automatic step: dependency impact audit
- expected human gate after that: implementation scope

Use `[Codex 메모]` only for short verification rationale or risk notes.
