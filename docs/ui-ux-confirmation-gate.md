# UI/UX Confirmation Gate

UI/UX confirmation happens before implementation planning continues.

## Purpose

Codex must show the user one UI/UX preview before implementing UI work. The preview can be one of:

- `text_wireframe`
- `markdown_mockup`
- `prototype`

## Files

```text
.pbe/blueprint/ui-ux-preview.json
.pbe/blueprint/ui-ux-preview.md
.pbe/blueprint/ui-ux-confirmation.md
.pbe/blueprint/ui-ux-confirmation-log.md
```

## Statuses

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

- Show one screen or flow preview at a time.
- Do not mark a preview confirmed until the user explicitly confirms it.
- If the user requests changes, update the preview and log the revision.
- Do not proceed to WPD, ACEP, or UI implementation while required UI/UX items are unconfirmed.
