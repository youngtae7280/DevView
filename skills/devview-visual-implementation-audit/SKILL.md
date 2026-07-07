---
name: devview-visual-implementation-audit
description: Audit implemented UI visual work against Visual Design Contract, design tokens, component style contract, state coverage, and screenshot evidence.
---

# DevView Visual Implementation Audit

## CLI Transition Rule

Use DevView CLI transition commands for workflow state changes. Do not edit `.devview/blueprint/devview-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

Use this skill after Run execution-pack for UI visual work and before Review Result or branch closure.

It may also run before execution-pack generation as a preflight audit if artifacts are missing.

DevView remains a Codex Plugin workflow. Do not create a GUI app, hosted integration, SaaS backend, MCP server, daemon, or standalone runtime.

## Purpose

Ensure visual implementation is not accepted without proof that it follows the visual contract.

## Inputs

```text
.devview/blueprint/visual-reference.json
.devview/blueprint/visual-reference.md
.devview/blueprint/ui-theme-spec.md
.devview/blueprint/design-tokens.json
.devview/blueprint/component-style-contract.json
.devview/control/ui-surface-inventory.json
.devview/control/component-style-inventory.json
.devview/control/visual-verification-profile.json
.devview/evidence/evidence-tree.json
.devview/evidence/screenshots/
.devview/evidence/review-reports/
.devview/tree/product-tree.json
.devview/tree/work-tree.json
.devview/tree/test-tree.json
.devview/control/acceptance-tree.json
.devview/control/impact-tree.json
```

Read compatibility execution-pack files when present:

```text
.devview/codex-execution-pack/05-ui-ux-spec.json
.devview/codex-execution-pack/15-ui-ux-evidence-checklist.md
.devview/codex-execution-pack/11-task-cards/
.devview/codex-execution-pack/11-node-execution-contracts/
```

## Outputs

```text
.devview/evidence/visual-audit.md
.devview/control/visual-verification-profile.json
.devview/control/verification-miss-log.json
```

## Blocking Failures

Fail the audit if any selected visual UI work has:

```text
missing Visual Design Contract
missing Theme Spec or Design Tokens
missing Component Style Contract for changed shared components
required screenshot evidence missing
required UI state evidence missing
expanded/collapsed state missing when applicable
stale screenshot evidence
unrecorded visual deviation
hardcoded style left where token usage is required, unless documented
reopened/invalidated UI impact not handled
acceptance attempted without user-controlled visual decision
```

## Audit Checks

1. Visual source exists or is waived.
2. Theme Spec and Design Tokens exist when visual quality is not waived.
3. Component Style Contract exists for shared UI work.
4. UI Surface Inventory covers all selected UI surfaces.
5. verification-design/Test Tree includes visual/state checks.
6. execution-pack task cards include visual contract references.
7. Evidence Tree links screenshots/manual notes/test outputs to relevant UI Test/Product nodes.
8. Screenshot evidence covers required states.
9. Visual deviations are recorded with disposition: accepted, revise_required, deferred, out_of_scope, or waived.
10. Stale evidence blocks closure.

## CLI Gate

Before Review Result for UI visual work, run:

```bash
devview visual check
devview evidence check
devview files check
devview review submit
```

The audit does not hand-edit `devview-state.json`. After `visual-audit.md` has no unresolved blocking issues, required screenshot/manual evidence is current, and the result is pass, accepted, or explicitly waived by the user, run `devview review submit` so the CLI runs File Change Guard and records `VISUAL_AUDIT_DONE` and `WAITING_REVIEW_RESULT`.

## Completion Report

Report with `[DevView ?곹깭 蹂닿퀬]` first:

- pass/fail
- surfaces audited
- component contract coverage
- token usage findings
- screenshot evidence coverage
- missing/stale evidence
- visual deviations
- blocking issues
- whether Review Result may proceed

Use `[Codex 硫붾え]` only for short risk notes.
