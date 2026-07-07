# Adaptive Workflow Depth Policy

## Purpose

PBE has one public workflow: keep user intent, scope, work, tests, evidence, review, and acceptance connected.

This document replaces the earlier "Lite Mode" framing with adaptive workflow depth. Small work should use a compact PBE
path, but that path is not a separate mode and is not a safety bypass.

The file path remains `docs/lite-mode-policy.md` for compatibility with existing links, CLI output, and context packs.

## Public Model

Users should not have to choose between public PBE modes.

The normal app-first entry is:

```text
@project-blueprint-engine start
```

PBE/Codex should inspect the current repository, identify the target task or slice, and choose the smallest depth that
still preserves traceability.

## Compatibility Profile Values

The CLI still accepts `full`, `lite`, and `bypass` as compatibility profile metadata because existing artifacts, tests,
and helper commands already use those values.

Treat them as depth hints:

| Compatibility value | Workflow depth | Meaning                                                                                              |
| ------------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `full`              | standard       | Use normal full planning depth for unclear, high-risk, UI/UX, multi-module, or product-meaning work. |
| `lite`              | compact        | Use the same PBE workflow with shorter planning/reporting for bounded low-risk slices.               |
| `bypass`            | none           | Do not initialize PBE tracking unless traceability becomes necessary.                                |

These values are not separate product workflows. They must not be presented as a replacement for the normal PBE flow.

## Compact Depth Is Not Bypass

Compact depth is appropriate only when PBE can still preserve:

```text
request -> AC -> Work -> Test/Evidence -> review -> user acceptance
```

If that chain cannot be preserved, increase to full planning depth.

## When Compact Depth Is Appropriate

Use compact depth for:

- existing project / existing blueprint
- small bounded change
- low-risk docs/copy/config/UI copy/test-only improvement
- limited expectedFiles
- no product meaning change
- no major UI/UX taste exploration
- no DB/schema/auth/permission/API/hardware/concurrency change

Compact depth keeps the PBE control chain, but keeps the planning surface short.

## What Compact Depth Is Not

Compact depth is:

- not a safety bypass
- not no-evidence mode
- not no-review mode
- not Codex self-acceptance
- not product meaning mutation shortcut
- not a way to skip File Change Guard
- not a replacement for Product Patch when product meaning changes

## Minimal Workflow

```text
Rough request
-> triage
-> mini Product/AC summary
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

This is not a new `pbe lite` command flow. It uses existing commands and records `lite` only as compatibility metadata.

## Must-Keep Guards

- user-only acceptance: Codex must not accept work on behalf of the user.
- no direct pbe-state edit: state transitions must still go through the CLI.
- expectedFiles / File Change Guard: changed source files must be explainable by bounded Work or Revision scope.
- minimal Acceptance Criteria: the slice still needs concrete user-visible or reviewer-visible success criteria.
- minimal Test/Evidence link: evidence must prove the relevant Test or AC, even when the plan is small.
- evidence freshness/currentness: stale proof should not close the slice.
- review submit before accept: review and acceptance remain separate gates.
- Product Patch for product meaning changes: compact depth must not silently mutate Product Tree meaning.
- Change/Impact for accepted-branch changes: already accepted work must reopen through the controlled change path.

## What Compact Depth May Reduce

Compact depth may reduce:

- RPD interview depth
- WPD decomposition depth
- VD rubric depth, when the change is not verification-heavy
- visual design contract depth, when no UI/UX visual change exists
- parallel safety analysis, when work is strictly sequential
- product patch flow, when product meaning does not change
- reporting length
- default validation breadth during interactive work

Reduce does not mean skip all. Compact depth should still leave a minimal summary, expectedFiles, and reviewable
evidence.

## Workload Cap

Compact work is workload-limited. It should not create repo-wide process docs, modify AGENTS.md, or run full
validation/test/build by default unless explicitly approved.

Expected files should normally be 1 to 3 files. Keep default compact artifacts to a mini Product/AC summary,
expectedFiles, minimal Test/Evidence, files check, and compact review summary.

See [Workload Cap and Artifact Minimalism](workload-cap-and-artifact-minimalism.md).

## Increase To Full Planning Depth

Increase to full planning depth when any of these appear:

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

## Bypass vs Compact vs Full Depth

| Depth   | Use when                                                        | Still required                                                | Increase when                  |
| ------- | --------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------ |
| none    | no PBE tracking is needed or user explicitly opts out           | normal project discipline                                     | any PBE traceability is needed |
| compact | small bounded low-risk slice                                    | mini AC, expectedFiles, minimal evidence, review, user accept | scope/product/risk grows       |
| full    | new feature, unclear scope, UI/UX, multi-module, high-risk work | full PBE workflow                                             | default for uncertainty        |

## Examples

Good compact-depth examples:

- typo/copy fix with expectedFiles
- docs clarification
- small troubleshooting note
- test fixture wording correction
- low-risk config/doc-only change

Poor compact-depth examples:

- redesign admin page
- add new search behavior with unclear target fields
- change auth/permission behavior
- change database schema
- integrate hardware/API
- repeated user rejection

## Current CLI Support

`pbe profile recommend` can recommend a compatibility profile value and workflow depth from a brief and optional
expected files. It does not initialize PBE.

`pbe status` can show guidance for the stored compatibility profile metadata. This guidance does not change state
transitions, does not add a `pbe lite` command, and does not reduce artifact initialization behavior.

Current decision: keep broad-skeleton initialization for `lite` until lightweight Product/Work/Test/Evidence authoring
and external slice enrollment are clearer. See
[Lite Artifact Initialization Decision](concept/lite-artifact-initialization-decision.md).

## Future Implementation Candidates

These are candidates only. Do not implement them until they satisfy the Complexity Governance criteria:

- adaptive-depth status wording cleanup across all commands
- compact artifact policy
- compact-depth escalation checklist validator
- profile metadata migration or rename, if compatibility allows
