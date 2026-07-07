# Workload Cap and Artifact Minimalism

## Purpose

This policy keeps PBE from turning small work into broad process work. It limits how much analysis, documentation,
validation, and reporting PBE should create for a bounded task or slice.

## Core Principle

PBE is not a document production system.

PBE tracks decisions and evidence, not every explanation. It should persist only the decisions, scope, tests, evidence,
changes, and acceptance records needed to control the work.

Small work should leave small artifacts.

Do not create process documents unless the user explicitly asks or the workflow requires them.

## What PBE Should Persist

- Product intent / minimal AC
- Work scope / expectedFiles
- Test/Evidence plan
- Evidence result
- Review / user acceptance
- Change / Impact / Revision when needed
- Product Patch when product meaning changes

## What PBE Should Not Create By Default

Do not create or modify these by default:

- repo-wide workflow adaptation docs
- long process reports
- new governance docs
- new AI workflow docs
- AGENTS.md changes
- CI/package/schema/template changes
- examples changes

Exceptions are allowed when the user explicitly asks, the selected scope includes the item, or the workflow needs it to
control risk, evidence, review, or acceptance.

## Start Is Not Repo-wide Adoption

`@project-blueprint-engine start` means:

- inspect current repo state lightly
- choose the smallest safe workflow depth
- identify the next task/slice
- ask one concise question if unclear
- initialize only after the target is clear

It does not mean:

- convert the whole repo to PBE
- create workflow adaptation reports
- rewrite AGENTS.md
- add project process docs
- close RPD/WPD/VD in one broad pass

Repo-wide adoption requires a separate explicit request and user confirmation.

## Compact Workload Cap

Compact workflow depth is workload-limited. It is not a safety bypass.

Default compact limits:

- expectedFiles should normally be 1 to 3 files
- no AGENTS.md changes unless explicitly approved
- no new process docs unless explicitly approved
- no CI/package/schema/template changes
- no examples/valid or examples/invalid changes
- no repo-wide analysis
- no full validation/test/build by default
- no long report by default

Default compact artifacts:

- mini Product/AC summary
- expectedFiles
- minimal Test/Evidence
- files check
- compact review summary

### Clarity-Based Escalation

Escalation should be based on clarity score plus hard triggers. If the request is small but implementation choices are
unclear, ask a focused Human Gate question instead of expanding into broad analysis or full workflow adaptation.

Examples:

- "Selection UI is unspecified. Use button list, Combobox, or card list?"
- "This change needs package/schema updates and exceeds the compact cap. Increase to full planning depth?"

## Full-Depth Workload Cap

Full planning depth is broader than compact depth, but it is not unlimited. Even in full depth, these require prior
notice or confirmation:

- AGENTS.md changes
- CI/package/script changes
- schema/template changes
- examples/valid or examples/invalid changes
- repo-wide workflow adaptation
- new long-lived governance/process docs

## Document Creation Policy

Default to compact structured summaries.

Create new docs only when:

- the user explicitly asks
- long-lived policy/reference is needed
- the selected work scope includes documentation
- evidence requires a document artifact

## Report Policy

Interactive report:

- short
- what changed
- validation summary
- next action

### Compact Completion Report

A normal compact completion report should usually include:

- changed files
- AC result
- evidence summary
- validation summary
- next action or review need

Avoid long narrative reports unless the task is a release/checkpoint, audit/dogfooding run, repeated failure recovery,
high-risk change, or the user explicitly asks for a full report.

Compact reporting must not omit AC, evidence, review, or acceptance.

Checkpoint report:

- changed files
- evidence
- risks

Full report:

- only when requested or release/checkpoint requires it

## Escalation Rules

Stop and propose full planning depth when compact work encounters:

- expectedFiles exceed the cap
- new process docs are needed
- AGENTS.md or CI/package/schema/template changes are needed
- product meaning changes
- UI/UX taste work appears
- repeated rejection appears
- evidence becomes high-risk/manual-only

## Examples

Good compact behavior:

- update one troubleshooting paragraph
- run focused checks
- report the changed file and validation result

Poor compact behavior:

- create a repo-wide workflow adaptation report
- rewrite AGENTS.md
- add CI/example/schema changes for a one-line docs fix
- run every possible validation when a focused check is enough and no checkpoint requires more
