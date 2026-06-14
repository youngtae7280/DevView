# Lite Mode Policy

## Purpose

Lite Mode defines the smallest safe PBE path for bounded, low-risk slices. It exists so small work does not feel like a
full project-construction workflow, but it must still preserve enough traceability for review and acceptance.

Lite mode is not a safety bypass.

Lite mode is a smaller PBE workflow for bounded, low-risk slices.

If Lite cannot preserve traceability from request -> AC -> Work -> Test/Evidence -> user review, it should escalate to
Full.

## What Lite Mode Is

Lite is appropriate for:

- existing project / existing blueprint
- small bounded change
- low-risk docs/copy/config/UI copy/test-only improvement
- limited expectedFiles
- no product meaning change
- no major UI/UX taste exploration
- no DB/schema/auth/permission/API/hardware/concurrency change

Lite keeps the PBE control chain, but it keeps the planning surface short.

## What Lite Mode Is Not

Lite is:

- not bypass
- not no-evidence mode
- not no-review mode
- not Codex self-acceptance
- not product meaning mutation shortcut
- not a way to skip File Change Guard
- not a replacement for Product Patch when product meaning changes

## When To Use Lite

Use Lite when the user asks for a small, bounded slice in an existing project and the likely file scope is easy to name
before implementation starts.

Good Lite candidates have a clear expected result, a small expectedFiles list, and a verification path that can be
summarized without a deep RPD/WPD/VD pass.

If the request grows while triaging or executing the work, switch to Full before continuing.

## Lite Minimal Workflow

```text
Rough request
-> Lite triage
-> Mini Product/AC summary
-> expectedFiles
-> minimal Test/Evidence plan
-> execution
-> files check
-> review submit
-> user accept
```

Current CLI commands available today:

```bash
pbe init --profile lite --brief "Fix empty-state copy"
pbe status
pbe execution start
pbe files check
pbe execution complete
pbe review submit
pbe accept
```

This is not a new Lite-specific command flow. It uses commands that exist today and documents the expected Lite
discipline around them.

## Must-Keep Guards

- user-only acceptance: Codex must not accept work on behalf of the user.
- no direct pbe-state edit: state transitions must still go through the CLI.
- expectedFiles / File Change Guard: changed source files must be explainable by the bounded Work or Revision scope.
- minimal Acceptance Criteria: the slice still needs concrete user-visible or reviewer-visible success criteria.
- minimal Test/Evidence link: evidence must prove the relevant Test or AC, even when the plan is small.
- evidence freshness/currentness: stale proof should not close the slice.
- review submit before accept: review and acceptance remain separate gates.
- Product Patch for product meaning changes: Lite must not silently mutate Product Tree meaning.
- Change/Impact for accepted-branch changes: already accepted work must reopen through the controlled change path.

## What Lite May Reduce

Lite may reduce:

- full RPD interview depth
- full WPD decomposition depth
- full VD rubric depth, when the change is not verification-heavy
- full visual design contract, when no UI/UX visual change exists
- parallel safety analysis, when work is strictly sequential
- product patch flow, when product meaning does not change

Reduce does not mean skip all. Lite should still leave a minimal summary, expectedFiles, and reviewable evidence.

## Escalation To Full

Escalate to Full when any of these appear:

- Product meaning changes
- AC cannot be made concrete
- feature scope is unclear
- UI/UX taste or visual design work
- DB/schema/auth/permission changes
- external API/hardware/concurrency changes
- multiple modules or many expectedFiles
- repeated review rejection
- Product Patch required
- evidence is manual-only and high risk
- ambiguity blocks acceptance criteria
- file changes exceed expectedFiles

## Bypass vs Lite vs Full

| Profile | Use when                                                        | Still required                                                | Escalate when                  |
| ------- | --------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------ |
| bypass  | no PBE tracking is needed or user explicitly opts out           | none beyond normal project discipline                         | any PBE traceability is needed |
| lite    | small bounded low-risk slice                                    | mini AC, expectedFiles, minimal evidence, review, user accept | scope/product/risk grows       |
| full    | new feature, unclear scope, UI/UX, multi-module, high-risk work | full PBE workflow                                             | default for uncertainty        |

## Examples

Good Lite examples:

- typo/copy fix with expectedFiles
- docs clarification
- small troubleshooting note
- test fixture wording correction
- low-risk config/doc-only change

Poor Lite examples:

- redesign admin page
- add new search behavior with unclear target fields
- change auth/permission behavior
- change database schema
- integrate hardware/API
- repeated user rejection

## Future Implementation Candidates

Current limitation: `--profile lite` now receives profile-aware guidance in `pbe status`. It still does not provide a
dedicated `pbe lite` command or reduced artifact initialization behavior.

These are candidates only. Do not implement them until they satisfy the Complexity Governance criteria:

- `pbe lite check`
- `pbe lite ready`
- profile-aware `pbe status`
- lite minimal artifact policy
- lite escalation checklist validator
