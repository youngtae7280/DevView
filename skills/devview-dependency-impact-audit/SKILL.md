---
name: devview-dependency-impact-audit
description: Audit deferred and future module impact before implementation scope selection and architecture runway approval.
---

# DevView Dependency Impact Audit

## CLI Transition Rule

Use DevView CLI transition commands for workflow state changes. Do not edit `.devview/blueprint/devview-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

Use this skill after VD completes and before the Implementation Scope gate.

Dependency Impact Audit is deterministic in Autoflow. Run it automatically after
VD succeeds. It owns the explicit decision record for future or deferred module
impact. WPD may discover foundation candidates, but this step records whether
those candidates affect the current slice and whether the user must approve a
scope or architecture runway decision.

## Inputs

```text
.devview/blueprint/requirement-tree.json
.devview/blueprint/work-design.json
.devview/blueprint/work-graph.json
.devview/blueprint/verification-design.json
.devview/blueprint/foundation-contract.md
.devview/blueprint/source-of-truth-matrix.md
```

## Outputs

```text
.devview/blueprint/dependency-impact-audit.json
.devview/blueprint/dependency-impact-audit.md
```

## Required Actions

1. Read deferred, foundation, blocked, and out-of-scope requirements from RPD/WPD.
2. Read WorkGraph shared foundations, boundary findings, integration points, and parallelization risks.
3. Identify future or deferred modules that can change current architecture.
4. Classify each future item as:
   - `optional_deferred`
   - `required_foundation`
   - `blocking_dependency`
   - `high_impact_future_module`
5. For each item, record:
   - related requirement IDs
   - related WorkGraph node IDs
   - current slice impact
   - required foundation IDs
   - risk if skipped
   - pending or completed user decision
6. Save `dependency-impact-audit.json`.
7. Save `dependency-impact-audit.md`.
8. Update Source of Truth Matrix links.
9. Ensure `dependency-impact-audit.json` is saved at the expected artifact path.
10. After implementation scope is selected and state is `SCOPE_SELECTED`, run `devview dependency audit complete`.
11. Do not hand-edit workflow state; the CLI records the dependency-audit checkpoint and reports the next command.
12. If the CLI fails, stop and report the missing artifact or prerequisite instead of continuing.

## Rules

- Do not implement deferred feature behavior.
- Do not decide user scope silently.
- Required foundation means structural work only: interfaces, adapters, state models, schemas, events, stubs, fixtures, or contracts.
- If any item is `blocking_dependency`, stop at the appropriate human decision or CLI failure output; do not write `autoflow.lastFailure` by hand.
- If any item is `required_foundation`, `blocking_dependency`, or `high_impact_future_module`, mark `architectureRunwayRequired` as `true`.
- If all future items are `optional_deferred`, record why no architecture runway is required.

## Completion Report

Report with `[DevView ?곹깭 蹂닿퀬]` first, following
`templates/stage-completion-status-card-template.md`.

The state card must say that Dependency Impact Audit completed and that DevView is
stopping at the Implementation Scope gate.

Include:

- future items audited
- optional deferred items
- required foundation items
- blocking dependencies
- high-impact future modules
- whether Architecture Runway is required
- created or updated files
- next human gate: implementation scope
- natural-language replies and one recommended reply

Use `[Codex 硫붾え]` only for short rationale about dependency or architecture risk.
