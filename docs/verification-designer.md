# Verification Designer

VD converts work design into verification design.

## Inputs

```text
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/work-design.json
.pbe/blueprint/work-graph.json
.pbe/blueprint/work-roadmap.md
.pbe/blueprint/ui-ux-confirmation.md
```

## Outputs

```text
.pbe/blueprint/verification-design.json
.pbe/blueprint/verification-plan.md
```

## WorkGraph Method

```text
WPD WorkGraph node
-> linked verification design
-> integration verification for integration nodes and parallel groups
-> root acceptance plan
```

VD should connect verification to WorkGraph nodes and WorkDesign entries. It
must not assume RPD requirement nodes are direct Codex task boundaries.

## UI/UX Verification

Confirmed UI/UX direction must become verification checks. UI verification should cover required elements, required states, accessibility expectations, and evidence.
