---
name: devview-design-system-derive
description: Derive Theme Spec, Design Tokens, and Component Style Contract from a visual reference, interview, existing project screen, or default DevView Clean Theme.
---

# DevView Design System Derive

## CLI Transition Rule

Use DevView CLI transition commands for workflow state changes. Do not edit `.devview/blueprint/devview-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

Use this skill after Visual Reference Intake and before WPD, ACEP, or UI implementation for visual UI work.

DevView remains a Codex Plugin workflow. Do not create a GUI app, hosted integration, SaaS backend, MCP server, daemon, or standalone runtime.

## Purpose

Convert visual direction into concrete artifacts Codex can implement and verify.

Do not let adjectives such as `modern`, `clean`, or `professional` become implementation authority unless they are translated into tokens and component rules.

## Inputs

```text
.devview/blueprint/visual-reference.json
.devview/blueprint/visual-reference.md
.devview/blueprint/ui-ux-preview.json
.devview/blueprint/ui-ux-confirmation.md
.devview/tree/product-tree.json
```

When the source is `reference_screenshot`, use the screenshot or image supplied by the user as the visual reference.

## Outputs

```text
.devview/blueprint/ui-theme-spec.md
.devview/blueprint/design-tokens.json
.devview/blueprint/component-style-contract.json
.devview/blueprint/design-system-derivation-log.md
```

## Required Token Groups

```text
colors
spacing
radius
typography
border
shadow
motion
zIndex optional
componentAliases optional
```

## Required Component Contracts

Cover these components when relevant to selected scope:

```text
Button
Input
Select
Checkbox/Switch
Card
Panel
Modal/Dialog
Tabs
Sidebar
Header
Toolbar
Table
List item
Expand/Collapse control
Empty state
Loading state
Error state
```

Each component contract must include:

```text
visualRole
requiredTokens
allowedVariants
requiredStates
forbiddenChanges
evidenceRequired
```

## Default DevView Clean Theme

If source is `default_devview_clean_theme`, materialize it into actual tokens and rules. The default theme is not permission for arbitrary style choices.

Baseline:

```text
neutral page background
white or near-white panels
subtle borders
minimal shadow
8px spacing scale
12px panel radius
8px control radius
blue primary action
compact professional layout
clear text hierarchy
no decorative color noise
```

## Rules

1. Do not implement code.
2. Do not invent unrelated brand colors unless the source supports them.
3. Do not remove or simplify existing controls as part of visual derivation.
4. Distinguish `must_follow`, `recommended`, `unknown`, and `user_decision_needed` items.
5. If a screenshot does not reveal a required state, mark that state as `unknown`, not guessed.
6. If the source is interview-derived, preserve the user's choices and make reasonable defaults explicit.
7. If the source is waived, produce a minimal waiver artifact instead of tokens and mark visual evidence as reduced.
8. The output must be concrete enough for WPD, VD, ACEP, and audits.

## Completion Report

Report with `[DevView ?곹깭 蹂닿퀬]` first:

- visual source used
- theme spec path
- design token path
- component style contract path
- unresolved visual decisions
- whether WPD may proceed

Use `[Codex 硫붾え]` only for short risk notes.
