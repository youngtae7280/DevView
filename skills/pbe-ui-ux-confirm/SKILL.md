---
name: pbe-ui-ux-confirm
description: Create UI/UX previews from RPD output and require user confirmation before WPD, ACEP, or UI implementation proceeds.
---

# PBE UI/UX Confirm

Use this skill after RPD and before WPD when the project includes UI-facing screens, forms, flows, navigation, status messages, or visual states.

PBE remains a Codex Plugin workflow. Do not create a GUI app, API provider, or SaaS backend for confirmation.

This skill is a human gate in Autoflow. Stop here until the user approves, requests revision, asks a question, or stops.

## Purpose

Generate a UI/UX preview and get explicit user confirmation before implementation planning continues.

## Inputs

```text
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/rpd-summary.md
.pbe/blueprint/source-of-truth-matrix.md
```

## Outputs

```text
.pbe/blueprint/ui-ux-preview.json
.pbe/blueprint/ui-ux-preview.md
.pbe/blueprint/ui-ux-confirmation.md
.pbe/blueprint/ui-ux-confirmation-log.md
.pbe/blueprint/visual-reference.json when selected UI work changes visual appearance
```

## Preview Levels

Use exactly one preview level for each screen or flow:

```text
text_wireframe
markdown_mockup
prototype
```

- `text_wireframe`: describes screen structure and flow in text.
- `markdown_mockup`: shows an ASCII or Markdown mockup.
- `prototype`: describes or creates a mock-data prototype with no real API integration.

Choose the lightest preview level that can support user confirmation. Ask the user only if the level is unclear.

## Confirmation Status

Use these statuses:

```text
not_required
preview_needed
preview_generated
revision_requested
confirmed
deferred
out_of_scope
blocked
```

## Rules

1. Show only one screen or flow preview at a time.
2. Do not mark a UI/UX item `confirmed` until the user explicitly confirms it.
3. If the user requests changes, mark it `revision_requested`, update the preview, and append to the confirmation log.
4. Do not proceed to WPD or ACEP while any required UI/UX item is not `confirmed`, `deferred`, `out_of_scope`, or `not_required`.
5. If the user defers or excludes a UI/UX item, record the reason.
6. Do not implement UI during confirmation.
7. If the user approves in natural language, update the confirmation artifact and run `pbe ui approve` so the CLI records `UI_UX_APPROVED`, clears the gate, and writes state history.
8. If the user requests revision, update the preview and stay at `WAITING_UI_UX_CONFIRM`.
9. If the user asks a question, answer from the preview and confirmation artifacts and stay at `WAITING_UI_UX_CONFIRM`.

## Visual Design Contract Handoff

UI/UX confirmation approves product flow, wording, controls, states, and exceptions. It does not by itself authorize visual redesign.

When selected UI work changes visual appearance, run or hand off to:

```text
pbe-visual-reference-intake
pbe-design-system-derive
```

Before WPD, ACEP, or UI implementation proceeds, selected visual UI work must have one of:

- `visual-reference.json` with `primarySource` set to `reference_screenshot`, `reference_app_or_site`, `existing_project_screen`, `interview_derived`, or `default_pbe_clean_theme`
- `visual-reference.json` with `primarySource: visual_quality_waived` and user-accepted waiver metadata
- `visual-reference.json` with `primarySource: not_required` only when no visual appearance changes are selected

If no visual source exists, stop at the visual source gate and offer all six choices. Do not ask only for a screenshot.

The six choices are:

1. Reference screenshot.
2. Reference app or site.
3. Existing project screen.
4. Short visual interview.
5. Default PBE Clean Theme.
6. Visual quality waiver for this slice.

## Friendly Gate Guidance

Use friendly guidance instead of internal command-only instructions:

```text
UI/UX confirmation is needed.

Please review:
- core user flow
- screen structure
- buttons, labels, and terms
- empty, loading, success, error, and permission states
- exception handling

If this looks okay, say so naturally.

Examples:
"approve"
"looks good, continue"
"this is okay"

If changes are needed, describe what should change.

Examples:
"add a retry button when printer connection fails"
"the card eject failure screen seems missing"
"show initial setup before the main flow"

If you are unsure, ask for review help.

Examples:
"what is the riskiest part of this UX?"
"check whether an exception case is missing"
"find anything awkward from a user perspective"

After approval, PBE continues automatically:
WPD -> VD -> Dependency Impact Audit -> Implementation Scope Gate
```

Also list the preview and confirmation file paths.

Use `[PBE 상태 보고]` first, following `templates/ui-ux-gate-message-template.md`. If additional explanation is useful, put it under `[Codex 메모]`.

## Approval Mapping

Treat these user responses as approval:

```text
approve
looks good
continue
this is okay
```

After approval, automatically run:

```text
WPD -> VD -> Dependency Impact Audit -> Implementation Scope Gate
```

If any downstream step fails, stop and show the failure response from `templates/autoflow-failure-message-template.md`.

## Completion Report

Report with `[PBE 상태 보고]` first:

- preview file paths
- confirmed screens/flows
- visual source status and whether a Visual Design Contract is required
- deferred or out_of_scope screens/flows
- blocked items
- whether WPD may proceed
- autoflow state
- next automatic downstream steps
- user reply examples
- recommended reply
