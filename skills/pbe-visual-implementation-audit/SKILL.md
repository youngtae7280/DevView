---
name: pbe-visual-implementation-audit
description: Audit implemented UI visual work against Visual Design Contract, design tokens, component style contract, state coverage, and screenshot evidence.
---

# PBE Visual Implementation Audit

Use this skill after Run ACEP for UI visual work and before Review Result or branch closure.

It may also run before ACEP generation as a preflight audit if artifacts are missing.

PBE remains a Codex Plugin workflow. Do not create a GUI app, API provider, SaaS backend, MCP server, daemon, or standalone runtime.

## Purpose

Ensure visual implementation is not accepted without proof that it follows the visual contract.

## Inputs

```text
.pbe/blueprint/visual-reference.json
.pbe/blueprint/visual-reference.md
.pbe/blueprint/ui-theme-spec.md
.pbe/blueprint/design-tokens.json
.pbe/blueprint/component-style-contract.json
.pbe/control/ui-surface-inventory.json
.pbe/control/component-style-inventory.json
.pbe/control/visual-verification-profile.json
.pbe/evidence/evidence-tree.json
.pbe/evidence/screenshots/
.pbe/evidence/review-reports/
.pbe/tree/product-tree.json
.pbe/tree/work-tree.json
.pbe/tree/test-tree.json
.pbe/control/acceptance-tree.json
.pbe/control/impact-tree.json
```

Read compatibility ACEP files when present:

```text
.pbe/codex-execution-pack/05-ui-ux-spec.json
.pbe/codex-execution-pack/15-ui-ux-evidence-checklist.md
.pbe/codex-execution-pack/11-task-cards/
.pbe/codex-execution-pack/11-node-execution-contracts/
```

## Outputs

```text
.pbe/evidence/review-reports/visual-audit.md
.pbe/control/visual-verification-profile.json
.pbe/control/verification-miss-log.json
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
5. VD/Test Tree includes visual/state checks.
6. ACEP task cards include visual contract references.
7. Evidence Tree links screenshots/manual notes/test outputs to relevant UI Test/Product nodes.
8. Screenshot evidence covers required states.
9. Visual deviations are recorded with disposition: accepted, revise_required, deferred, out_of_scope, or waived.
10. Stale evidence blocks closure.

## Completion Report

Report with `[PBE 상태 보고]` first:

- pass/fail
- surfaces audited
- component contract coverage
- token usage findings
- screenshot evidence coverage
- missing/stale evidence
- visual deviations
- blocking issues
- whether Review Result may proceed

Use `[Codex 메모]` only for short risk notes.
