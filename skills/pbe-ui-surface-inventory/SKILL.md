---
name: pbe-ui-surface-inventory
description: Inventory UI surfaces, components, states, files, and screenshot evidence requirements before visual implementation.
---

# PBE UI Surface Inventory

Use this skill during WPD or immediately after WPD when visual UI work is selected.

PBE remains a Codex Plugin workflow. Do not create a GUI app, API provider, SaaS backend, MCP server, daemon, or standalone runtime.

## Purpose

Prevent Codex from applying visual changes as one-off screen patches. Identify reusable components, UI surfaces, required states, and evidence needs before execution.

## Inputs

```text
.pbe/tree/product-tree.json
.pbe/tree/project-tree.json
.pbe/tree/work-tree.json
.pbe/blueprint/work-design.json
.pbe/blueprint/work-graph.json
.pbe/blueprint/ui-theme-spec.md
.pbe/blueprint/design-tokens.json
.pbe/blueprint/component-style-contract.json
```

Also inspect the target repository files to find UI components, styles, routes, pages, dialogs, panels, and stateful surfaces.

## Outputs

```text
.pbe/control/ui-surface-inventory.json
.pbe/control/component-style-inventory.json
.pbe/blueprint/ui-surface-inventory.md
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
5. The inventory must feed VD screenshot evidence requirements and ACEP task cards.

## Completion Report

Report with `[PBE 상태 보고]` first:

- surfaces inventoried
- shared components inventoried
- high-risk visual surfaces
- missing state coverage
- hardcoded style risks
- whether VD may proceed
