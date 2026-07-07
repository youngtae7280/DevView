---
name: devview-visual-reference-intake
description: Determine and record the source of visual design direction for UI work before visual implementation proceeds.
---

# DevView Visual Reference Intake

## CLI Transition Rule

Use DevView CLI transition commands for workflow state changes. Do not edit `.devview/blueprint/devview-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

Use this skill after UI/UX confirmation and before work-planning or execution-pack when selected work changes visual appearance.

DevView remains a Codex Plugin workflow. Do not create a GUI app, hosted integration, SaaS backend, MCP server, daemon, or standalone runtime.

This skill is a human gate only when no valid visual contract source exists.

## Purpose

Prevent visual implementation from starting from vague language such as `clean`, `modern`, `nice`, or `make it look like this`.

DevView must first record the source of the Visual Design Contract.

## Inputs

```text
.devview/tree/product-tree.json
.devview/blueprint/requirement-tree.json
.devview/blueprint/product-intake-summary.md
.devview/blueprint/ui-ux-preview.json
.devview/blueprint/ui-ux-confirmation.md
```

Read paths only when they exist.

## Outputs

```text
.devview/blueprint/visual-reference.json
.devview/blueprint/visual-reference.md
.devview/blueprint/visual-reference-intake-log.md
```

## Valid Visual Contract Sources

Use exactly one primary source unless the user intentionally provides multiple references:

```text
reference_screenshot
reference_app_or_site
existing_project_screen
interview_derived
default_devview_clean_theme
visual_quality_waived
not_required
```

## Rules

1. If selected UI work does not change visual appearance, mark `primarySource` as `not_required` and continue.
2. If the user provided a screenshot, image, mockup, before/after target, or reference screen, record `reference_screenshot`.
3. If the user named or linked an app/site/product as a visual reference, record `reference_app_or_site`.
4. If the user asks to follow an existing screen in the target project, record `existing_project_screen`.
5. If no visual source exists, stop and ask the user to choose a source.
6. Do not ask only for a screenshot. Offer all six source choices.
7. If the user chooses interview, ask no more than three initial questions, then create an interview-derived draft.
8. If the user chooses default theme, record `default_devview_clean_theme` and continue to design system derivation.
9. If the user waives visual quality, record `visual_quality_waived`, scope, reason, and risk accepted by the user.
10. Do not implement UI in this skill.

## Human Gate Message

Use friendly wording instead of command-only instructions:

```text
UI visual direction is required before implementation.

Please choose one:
1. Attach a reference screenshot.
2. Name or link a reference app/site.
3. Use an existing project screen as the baseline.
4. Answer a short visual preference interview.
5. Use the default DevView Clean Theme.
6. Waive visual quality gating for this slice.

Recommended reply:
"Use the default DevView Clean Theme."
```

If interview is selected, ask at most these three initial questions:

```text
1. What overall UI type fits best?
   A. clean business SaaS
   B. developer tool
   C. dashboard-heavy
   D. compact settings/tooling UI
   E. premium product style

2. What density should the UI use?
   A. compact
   B. normal
   C. spacious

3. What color direction should be used?
   A. neutral + blue accent
   B. dark mode
   C. monochrome
   D. brand-color based
   E. not sure; propose one
```

## Completion Report

Report with `[DevView ?곹깭 蹂닿퀬]` first:

- whether visual work is required
- chosen visual contract source
- visual reference artifact paths
- whether design system derivation may proceed
- blocked item, if no source exists
- recommended user reply when blocked

Use `[Codex 硫붾え]` only for short risk notes.
