---
name: devview-ui-surface-inventory
description: Inventory UI surfaces, components, states, files, and screenshot evidence requirements before visual implementation.
---

# DevView UI Surface Inventory

## CLI Transition Rule

Use DevView CLI transition commands for workflow state changes. Do not edit `.devview/blueprint/devview-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

Use this skill during work-planning or immediately after work-planning when visual UI work is selected.

DevView remains a Codex Plugin workflow. Do not create a GUI app, hosted integration, SaaS backend, MCP server, daemon, or standalone runtime.

## Purpose

Prevent Codex from applying visual changes as one-off screen patches. Identify reusable components, UI surfaces, required states, and evidence needs before execution.

## Inputs

```text
.devview/tree/product-tree.json
.devview/tree/project-tree.json
.devview/tree/work-tree.json
.devview/blueprint/work-design.json
.devview/blueprint/work-graph.json
.devview/blueprint/ui-theme-spec.md
.devview/blueprint/design-tokens.json
.devview/blueprint/component-style-contract.json
```

Also inspect the target repository files to find UI components, styles, routes, pages, dialogs, panels, and stateful surfaces.

## Outputs

```text
.devview/control/ui-surface-inventory.json
.devview/control/component-style-inventory.json
.devview/blueprint/ui-surface-inventory.md
```

## Inventory Requirements

Each UI surface should include:

```text
surfaceId
name
surfaceType
owningFiles
styleFiles
reusableComponentsUsed
statesRequired
requiredScreenshots
relatedProductNodes
relatedWorkNodes
relatedTestNodes if already known
deferredOrOutOfScopeVisualItems
riskNotes
```

Each component should include:

```text
componentName
componentType
owningFiles
styleSource
usedBySurfaces
usesDesignTokens
hardcodedStyleFindings
requiredContractRef
visualChangeScope
exceptionReason if any
```

## Required State Coverage

Check for relevant states:

```text
default
hover
focus
active
disabled
empty
loading
success
error
permission_denied
expanded
collapsed
selected
unselected
resized
responsive_small
responsive_large
```

Only require states that matter for the selected Product/Work scope, but do not silently ignore visible states.

## Rules

1. Shared components must be identified before local visual patches are planned.
2. If a command opens a dialog, popup, subdialog, secondary route, or child workflow, inventory the child surface.
3. Expanded/collapsed controls must not be removed unless explicitly out of scope and approved.
4. Hardcoded colors, spacing, radius, shadows, and typography should be flagged when tokens should be used.
5. The inventory must feed verification-design screenshot evidence requirements and execution-pack task cards.

## Completion Report

Report with `[DevView ?곹깭 蹂닿퀬]` first:

- surfaces inventoried
- shared components inventoried
- high-risk visual surfaces
- missing state coverage
- hardcoded style risks
- whether verification-design may proceed
