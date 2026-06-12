---
name: pbe-dependency-impact-audit
description: Audit deferred and future module impact before implementation scope selection and architecture runway approval.
---

# PBE Dependency Impact Audit

Use this skill after VD completes and before the Implementation Scope gate.

Dependency Impact Audit is deterministic in Autoflow. Run it automatically after
VD succeeds. It owns the explicit decision record for future or deferred module
impact. WPD may discover foundation candidates, but this step records whether
those candidates affect the current slice and whether the user must approve a
scope or architecture runway decision.

## Inputs

```text
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/work-design.json
.pbe/blueprint/work-graph.json
.pbe/blueprint/verification-design.json
.pbe/blueprint/foundation-contract.md
.pbe/blueprint/source-of-truth-matrix.md
```

## Outputs

```text
.pbe/blueprint/dependency-impact-audit.json
.pbe/blueprint/dependency-impact-audit.md
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
9. Update `pbe-state.json.artifacts.dependencyImpactAudit`.
10. After implementation scope is selected and state is `SCOPE_SELECTED`, run `pbe dependency audit complete`.
11. Do not hand-edit `pbe-state.json.autoflow.state`; the CLI records `dependency_impact_audit` in `completedSteps` and advances `nextStep` to `plan_execution`.
12. If the CLI fails, stop and report the missing artifact or prerequisite instead of continuing.

## Rules

- Do not implement deferred feature behavior.
- Do not decide user scope silently.
- Required foundation means structural work only: interfaces, adapters, state models, schemas, events, stubs, fixtures, or contracts.
- If any item is `blocking_dependency`, record `autoflow.lastFailure` unless the next safe action is a human scope decision.
- If any item is `required_foundation`, `blocking_dependency`, or `high_impact_future_module`, mark `architectureRunwayRequired` as `true`.
- If all future items are `optional_deferred`, record why no architecture runway is required.

## Completion Report

Report with `[PBE 상태 보고]` first, following
`templates/stage-completion-status-card-template.md`.

The state card must say that Dependency Impact Audit completed and that PBE is
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

Use `[Codex 메모]` only for short rationale about dependency or architecture risk.
