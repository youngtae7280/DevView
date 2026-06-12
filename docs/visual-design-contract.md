# Visual Design Contract

PBE UI/UX confirmation approves flow, structure, wording, controls, states, and exception handling. Visual Design Contract adds a second layer for visual appearance: reference source, theme, tokens, component rules, surface inventory, screenshot evidence, and final visual audit.

This stays inside the Codex Plugin workflow. It is not a GUI app, API provider, SaaS product, MCP server, daemon, or standalone runtime.

## Flow

```text
UI visual work detected
-> Visual Reference Intake
-> Theme Spec
-> Design Tokens
-> Component Style Contract
-> UI Surface Inventory
-> VD visual evidence requirements
-> ACEP task card / Node Execution Contract refs
-> Screenshot or manual visual evidence
-> Visual Implementation Audit
-> User review and acceptance
```

## Source Choices

When selected UI work changes visual appearance, PBE must record one source:

1. Reference screenshot.
2. Reference app or site.
3. Existing project screen.
4. Short visual interview.
5. Default PBE Clean Theme.
6. Visual quality waiver for this slice.

If no source exists, PBE stops and asks the user to choose. It must not ask only for a screenshot.

## Artifacts

```text
.pbe/blueprint/visual-reference.json
.pbe/blueprint/visual-reference.md
.pbe/blueprint/ui-theme-spec.md
.pbe/blueprint/design-tokens.json
.pbe/blueprint/component-style-contract.json
.pbe/control/ui-surface-inventory.json
.pbe/control/component-style-inventory.json
.pbe/control/visual-verification-profile.json
.pbe/evidence/screenshots/
.pbe/evidence/review-reports/visual-audit.md
```

## Invariants

- Visual UI changes require Visual Design Contract source or explicit user waiver.
- Reference source requires Theme Spec, Design Tokens, and Component Style Contract before implementation unless waived or not required.
- Design tokens must include colors, spacing, radius, typography, border, shadow, and motion.
- Shared visual component changes require Component Style Contract reference or approved exception.
- UI Surface Inventory must list selected surfaces, child surfaces, relevant states, and screenshot/manual evidence requirements.
- VD must translate required states into Test Tree evidence requirements.
- ACEP task cards and Node Execution Contracts must carry visual contract refs for visual UI work.
- Missing or stale screenshot/manual visual evidence blocks UI closure.
- Visual deviations must be recorded and resolved before closure.
- Codex may submit visual work for review, but only the user may accept it.

## Default PBE Clean Theme

The default theme is a concrete fallback, not permission for arbitrary styling:

- neutral page background
- white or near-white panels
- subtle borders
- minimal shadow
- 8px spacing scale
- 12px panel radius
- 8px control radius
- blue primary action
- compact professional layout
- clear text hierarchy
- no decorative color noise

The default theme must still be materialized into `design-tokens.json` and `component-style-contract.json`.

## CLI Guard

`pbe visual check` validates the Visual Design Contract layer when visual UI work is selected. `pbe gate acep`, `pbe acep check`, `pbe evidence check`, and `pbe gate review-submit` also enforce the relevant visual-contract checks.
