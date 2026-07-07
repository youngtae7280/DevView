# CLI-Backed Read-Model Evidence Output Design

Status: cli-backed-read-model-evidence-output-design / design-approved / bounded-implementation-complete

## Document Purpose

This document defines the concept-level output design for future generated / CLI-backed read-model Evidence before
actual scoped source-authority pilot execution can be reconsidered for the Todo Search selected slice.

It designs the evidence output shape, command surface, comparison rules, mismatch report expectations, and review labels.
Bounded Todo Search generation/comparison commands are now implemented, and scoped validator-backed Evidence is now
implemented separately. These remain Evidence surfaces only; they do not change source authority or approve broader
promotion.

## User Decision Trace

| Field                 | Value                                             |
| --------------------- | ------------------------------------------------- |
| Decision source       | parent orchestration chat                         |
| Decision date         | 2026-06-25                                        |
| Selected option       | `Prepare CLI-backed evidence output design first` |
| Decision scope        | Output design only                                |
| Explicit non-approval | implementation                                    |
| Explicit non-approval | CLI command                                       |
| Explicit non-approval | builder                                           |
| Explicit non-approval | parser                                            |
| Explicit non-approval | validator / CI                                    |
| Explicit non-approval | generated output                                  |
| Explicit non-approval | source authority change                           |
| Explicit non-approval | full Graph-source promotion                       |

## Design Purpose

[generated-read-model-evidence-requirement.md](generated-read-model-evidence-requirement.md) records that generated /
CLI-backed read-model Evidence is required before actual scoped source-authority pilot execution can be reconsidered.

This design defines what that future Evidence should look like and how it should be reviewed.

It does not:

- implement a command
- implement a builder
- implement a parser
- define a schema or TypeScript model
- create generated output
- validate source authority
- approve scoped execution

## Command / Surface Concept

The first two command surfaces are now implemented for bounded Todo Search Evidence. They remain scoped Evidence
commands, not source authority switches or promotion commands.

| Conceptual surface                                                                              | Purpose                                                                                  | Source inputs                                                                                                     | Output artifact                                                            | Required for scoped pilot?                                     | Future full promotion role                                             | Non-authority boundary                                                              |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `devview graph read-model generate --slice examples/internal-legacy/adoption/todo-search-slice` | Generate a read-model Evidence artifact from declared selected-slice inputs.             | Product/Project/Work/Test/Evidence/Acceptance, Change/Impact, contracts, runtime Evidence, warnings.              | `generated-read-model.json`, `generated-read-model.md`, optional manifest. | Yes, if user keeps generated output as execution prerequisite. | Possible input to broader generator design, not sufficient by itself.  | Generates Evidence only; does not switch source authority.                          |
| `devview graph read-model compare --generated <file> --manual <file>`                           | Compare generated output against the manual read-model parity artifact.                  | Generated read-model artifact and current manual parity artifact / View Instance Manifest.                        | `read-model-parity-report.json`, `read-model-parity-report.md`.            | Yes, if manual parity remains the review baseline.             | Validator input for scoped Todo Search; possible future broader input. | Reports mismatch only; does not auto-fix source or manual artifacts.                |
| `pbe evidence read-model --slice examples/internal-legacy/adoption/todo-search-slice`           | Produce an Evidence-oriented manifest summarizing run identity, source inputs, warnings. | Same selected-slice inputs plus command/test Evidence references and Approval Brief / Evidence exception records. | `read-model-evidence-manifest.json` or equivalent summary.                 | Helpful but not necessarily sufficient alone.                  | Possible CI/reporting input if later approved.                         | Evidence manifest only; not source, not acceptance, not source-transition approval. |

The scoped validator command is documented in
[validator-ci-backed-read-model-evidence-design.md](validator-ci-backed-read-model-evidence-design.md). Future CI
integration and broader command surfaces remain separate decisions.

## Output Artifact Design

These artifacts are conceptual outputs. They should not be treated as existing files until a later implementation task
creates them.

| Artifact candidate                  | Role                                                                                     | Required metadata                                                                                           | Required content / sections                                                                                                   | Source authority boundary                                                       | Review status labels                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `generated-read-model.json`         | Machine-readable generated read-model Evidence.                                          | timestamp, command identity, source commit, source slice, input artifact list, generation mode, run id.     | nodes with `nodeKind`, edges with `edgeType`, source references, view memberships, role tags, confidence/freshness, warnings. | Evidence only; cannot become source without explicit scoped execution approval. | `generated-present`, `generated-missing`, `generated-stale`, `generated-partial`.   |
| `generated-read-model.md`           | Human-readable explanation of generated output.                                          | same run identity metadata, source boundary statement, non-promotion statement.                             | source summary, node/edge summary, 7 Core View summary, Check/Evidence summary, warning summary, limitations.                 | Review summary only; not source authority.                                      | `generated-present`, `generated-partial`, `decision-required`.                      |
| `read-model-parity-report.json`     | Machine-readable generated/manual comparison report.                                     | generated artifact id, manual artifact id, comparison timestamp, source commit, comparison rule version.    | comparable units, mismatch list, severity, affected nodes/edges/views/warnings, control node candidates.                      | Reports mismatch only; does not update source or manual artifact.               | `comparison-pass`, `comparison-warning`, `comparison-blocked`, `decision-required`. |
| `read-model-parity-report.md`       | Human-readable comparison report for Approval Brief / Control Node review.               | same comparison metadata, non-authority statement.                                                          | summary, mismatch table, severity explanation, user judgment items, recommended blockers/warnings/defer candidates.           | Review report only; not source authority.                                       | `comparison-pass`, `comparison-warning`, `comparison-blocked`, `decision-required`. |
| `read-model-evidence-manifest.json` | Optional Evidence manifest tying generated output to source inputs and command Evidence. | run identity, input artifact hashes or references if later supported, command/test Evidence refs, warnings. | Evidence references, input list, generated output refs, comparison refs, retained warnings, gate status summary.              | Evidence index only; not source, not Acceptance, not promotion.                 | `generated-present`, `generated-partial`, `decision-required`.                      |

## Required Output Fields / Sections

Future generated output should include these fields or sections at concept level:

- run identity: timestamp, command identity, source commit, source slice, input artifact list
- source input references
- generated node list with `nodeKind`
- generated edge list with `edgeType`
- role tags restricted to allowed `viewScopedTags`
- view membership separated from tags
- 7 Core View coverage summary
- confidence vs freshness/status separation
- Check/Evidence mapping summary
- retained warnings and Evidence exceptions
- compatibility warning carry-forward
- source authority boundary statement
- generated/manual comparison summary
- mismatch list with category and severity
- Control Node candidate summary
- final non-promotion / non-authority statement

## Comparison / Parity Design

Generated output should be compared to the current manual parity artifact, but neither side should silently update the
other.

Comparable units:

- node id and `nodeKind`
- edge source, target, and `edgeType`
- source references
- view memberships
- role tags
- confidence and freshness/status
- warnings and Evidence exceptions
- source authority boundary statement
- 7 Core View coverage
- Check/Evidence mappings

Mismatch categories:

| Category                    | Meaning                                                                    | Example treatment                                                             |
| --------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| missing node                | Generated output omits a manual or source-required durable target.         | Warning or blocking depending on source/acceptance impact.                    |
| missing edge                | Generated output omits a required semantic relationship.                   | Warning or decision-required if traceability is affected.                     |
| wrong role tag              | Generated output uses invalid tag or confuses view membership with tags.   | Blocking for taxonomy/view integrity if invalid role tags appear.             |
| stale/freshness mismatch    | Generated output differs from known Evidence freshness.                    | Evidence Control Node candidate; decision-required if acceptance is affected. |
| source reference mismatch   | Generated output references the wrong source or lacks source traceability. | Blocking if source/fallback boundary becomes unclear.                         |
| warning omission            | Generated output hides retained warnings or Evidence exceptions.           | Blocking or decision-required depending on risk.                              |
| authority-boundary mismatch | Generated output implies source switch, promotion, or tree retirement.     | Blocking; Decision/Compatibility/Impact Control Node candidate.               |

Severity labels:

| Severity            | Meaning                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `info`              | Difference is explanatory or does not affect review judgment.                                  |
| `warning`           | Difference should be visible but may not block scoped execution discussion.                    |
| `blocking`          | Difference blocks scoped execution approval until fixed, deferred, or explicitly accepted.     |
| `decision-required` | Difference affects source, acceptance, risk, authority, or compatibility and needs user input. |

Treatment rules:

- mismatch never auto-fixes source artifacts
- mismatch never silently updates the manual artifact
- mismatch affecting source/acceptance/risk/authority requires user judgment
- mismatch may create Evidence, Impact, Compatibility, or Decision Control Node candidates
- mismatch must remain visible in Approval Brief or equivalent review surface when it affects user judgment

## Evidence Status Labels

These are concept labels, not schema enums:

| Label                | Meaning                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `generated-present`  | Generated output exists for the declared source inputs.                          |
| `generated-missing`  | Required generated output does not exist.                                        |
| `generated-stale`    | Generated output exists but may not reflect current inputs.                      |
| `generated-partial`  | Generated output exists but omits required inputs, views, warnings, or mappings. |
| `comparison-pass`    | Generated/manual comparison has no blocking or decision-required mismatch.       |
| `comparison-warning` | Comparison has visible non-blocking warnings.                                    |
| `comparison-blocked` | Comparison has blocking mismatch.                                                |
| `decision-required`  | Comparison or output affects a user judgment boundary.                           |

## Gate Relationship

### Evidence Gate

The output design clarifies what generated Evidence must show. Future generated output can satisfy part of the Evidence
gate if it is present, fresh, source-linked, warning-preserving, and comparable.

### Authority Gate

Generated output can support authority readiness by making source/fallback comparisons repeatable. It does not activate
source authority.

### Rollback / Fallback Gate

Generated/manual comparison can help identify fallback mismatch. It does not define rollback mechanics or make
rollback-ready status true by itself.

### Compatibility Gate

Generated output must carry compatibility warnings forward. It does not clean up public docs or retire compatibility
views.

### Approval Gate

Generated output may support a later user decision. It does not approve scoped execution, source transition, Acceptance,
or full promotion.

## Bounded Implementation Result

The user later approved the recommended implementation task. The bounded implementation now provides:

- `devview graph read-model generate --slice examples/internal-legacy/adoption/todo-search-slice`
- `devview graph read-model compare --generated <file> --manual <file>`
- `examples/internal-legacy/adoption/todo-search-slice/generated/generated-read-model.json`
- `examples/internal-legacy/adoption/todo-search-slice/generated/generated-read-model.md`
- `examples/internal-legacy/adoption/todo-search-slice/generated/read-model-evidence-manifest.json`
- `examples/internal-legacy/adoption/todo-search-slice/generated/read-model-parity-report.json`
- `examples/internal-legacy/adoption/todo-search-slice/generated/read-model-parity-report.md`

Implementation status:

```text
bounded-generated-read-model-evidence-builder / implemented-for-todo-search-slice / evidence-only
```

This result satisfies the design at bounded selected-slice scope. It does not implement validator/CI enforcement,
public-doc cleanup, scoped source-authority execution, full promotion, or broad graph-source migration.

Later scoped validator work adds:

- `devview graph read-model validate --slice examples/internal-legacy/adoption/todo-search-slice`
- `examples/internal-legacy/adoption/todo-search-slice/generated/read-model-validation-report.json`
- `examples/internal-legacy/adoption/todo-search-slice/generated/read-model-validation-report.md`

That validator-backed Evidence is local and scoped. It does not add CI workflow or enforcement.

## Non-Scope

This design and bounded implementation result do not include:

- broad implementation beyond the Todo Search selected-slice builder
- parser implementation
- schema/type model
- CI enforcement
- source authority change
- Graph-source promotion
- public-doc cleanup
- tree-native retirement
- broader scoped source-authority execution beyond the already recorded Todo Search bounded pilot

## Recommended Next User Decision Surface

After this design, the user approved and Codex implemented the bounded builder task, approved actual scoped
source-authority pilot execution for Todo Search, approved scoped validator-backed Evidence implementation, approved the
first non-enforcing manual CI workflow implementation, and reviewed run `28151296796` as CI-backed Evidence. The next
user decision surface is now:

1. `Keep workflow manual/non-enforcing and continue observation`
2. `Observe PR informational runs under policy`
3. `Design CI enforcement / required check policy`
4. `Require public-doc cleanup before broader promotion`
5. `Prepare broader Graph-source promotion review`
6. `Rollback / defer scoped source-authority pilot`

Recommended option after reviewed CI-backed Evidence:

```text
Keep workflow manual/non-enforcing and continue observation unless the user chooses the next major branch.
```

Reason:

- Generated output and parity report now exist for the bounded Todo Search slice.
- The initial generated/manual freshness warnings were reviewed and resolved in
  `examples/internal-legacy/adoption/todo-search-slice/generated/parity-warning-resolution.md`.
- The current parity report is `comparison-pass` with no mismatch, blocking, or decision-required entries.
- Scoped pilot execution is recorded for Todo Search only; broader source authority remains unchanged.
- Scoped validator-backed Evidence is `validation-pass`; manual CI-backed Evidence workflow exists, but CI artifact review
  is still future.

The user later gave that explicit bounded execution approval for the Todo Search selected slice. The execution is
recorded in [scoped-source-authority-pilot-execution-record.md](scoped-source-authority-pilot-execution-record.md). This
does not expand the design into full promotion, CI enforcement, public-doc cleanup, or repository-wide source authority
change.

That stricter repeatability design is now recorded in
[validator-ci-backed-read-model-evidence-design.md](validator-ci-backed-read-model-evidence-design.md). It now records
the scoped validator-backed Evidence implementation while keeping CI enforcement unimplemented.

The CI workflow integration design is recorded in
[ci-backed-read-model-evidence-workflow-design.md](ci-backed-read-model-evidence-workflow-design.md). It records the
manual `workflow_dispatch` implementation without PR/push triggers, required checks, branch protection, or enforcement.

## Approval Brief Draft

### Intent Understood

PBE has defined and implemented bounded CLI-backed/generated read-model Evidence output for the Todo Search selected
slice.

### Result Summary

The design proposes command surfaces, output artifacts, required fields/sections, generated/manual comparison rules,
mismatch categories, severity labels, Evidence status labels, gate relationships, and non-scope boundaries. The bounded
builder now creates generated output for Todo Search only.

### Verification Summary

| Check                           | Status       | Summary                                                                                                |
| ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| User selected design-first path | present      | Parent orchestration chat selected `Prepare CLI-backed evidence output design first`.                  |
| Requirement basis               | present      | `generated-read-model-evidence-requirement.md` defines generated Evidence prerequisite.                |
| Command/surface implementation  | present      | `devview graph read-model generate` and `devview graph read-model compare` exist for bounded Evidence. |
| Output artifact design          | present      | Generated artifact, summary, comparison report, and optional manifest roles are defined.               |
| Comparison / parity design      | present      | Comparable units, mismatch categories, severities, and treatment rules are defined.                    |
| Generated output                | present      | Bounded Todo Search generated read-model and parity report are created under `generated/`.             |
| Source authority change         | not approved | Generated output remains Evidence rather than automatic source.                                        |
| Validator-backed Evidence       | present      | Scoped Todo Search validator report is `validation-pass`.                                              |
| CI-backed Evidence              | reviewed     | Run `28151296796` is reviewed as `ci-evidence-pass`.                                                   |
| Comparison warning resolution   | present      | The five freshness warnings were reviewed and resolved; current parity status is pass.                 |

### Remaining Judgment

The user approved bounded scoped source-authority pilot execution with generated Evidence, scoped validator-backed
Evidence, and reviewed CI-backed Evidence. The remaining decision is whether to keep observing the pilot, design PR
informational triggers or enforcement policy, require public-doc cleanup, prepare broader promotion review, or
rollback/defer the pilot.

### Approval Choice Candidates

- `Keep workflow manual/non-enforcing and continue observation`
- `Observe PR informational runs under policy`
- `Design CI enforcement / required check policy`
- `Require public-doc cleanup before broader promotion`
- `Prepare broader Graph-source promotion review`
- `Rollback / defer scoped source-authority pilot`

### State Label

```text
Decision required
```

Reason: bounded generated Evidence, scoped pilot execution, scoped validator-backed Evidence, and manual workflow
implementation are recorded, but reviewed CI run artifact, enforcement, and broader promotion remain unapproved.

## Control Node Summary

| Control record                       | Family                       | Status                             | Reason                                                                                        |
| ------------------------------------ | ---------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- |
| Output design selected               | Decision Control Node        | resolved                           | User selected design-first work.                                                              |
| Bounded generated output             | Evidence Control Node        | present with warnings              | Todo Search generated output exists.                                                          |
| Scoped validator-backed Evidence     | Evidence Control Node        | present                            | Local validation report is `validation-pass`.                                                 |
| Manual CI-backed workflow            | Evidence Control Node        | implemented / artifact review open | Manual dispatch exists; reviewed CI artifact remains a later Evidence step.                   |
| Public-doc cleanup                   | Compatibility Control Node   | deferred / active warning          | ACEP cleanup remains separate and can still be required by user before implementation.        |
| Scoped source authority change       | Impact / Change Control Node | not started                        | No source transition or scoped execution is performed.                                        |
| Demo-support Acceptance with warning | Acceptance Control Node      | closed with warnings               | Demo-support acceptance remains separate from source-transition approval.                     |
| Generated/manual mismatch handling   | Evidence / Decision Control  | design-defined / execution pending | Future mismatches may create Evidence, Impact, Compatibility, or Decision Control candidates. |

## Gate Self-Check

| Gate                                    | Result | Notes                                                                                                                |
| --------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| Bounded Implementation Gate             | PASS   | Todo Search bounded builder and scoped validator are implemented; parser/schema/CI and broader builder work are not. |
| Non-Promotion Gate                      | PASS   | This design does not promote Maintainability Graph or change source authority.                                       |
| Design / Implementation Separation Gate | PASS   | Bounded implementation is separated from scoped source-authority execution approval.                                 |
| Evidence Output Clarity Gate            | PASS   | Output artifacts, fields, labels, comparison rules, and mismatch categories are described.                           |
| Taxonomy / View Integrity Gate          | PASS   | Node/Edge/Tag, view membership, allowed role tags, and 7 Core Views remain explicit.                                 |
| Source Authority Boundary Gate          | PASS   | Generated output remains Evidence unless a later explicit source transition approves otherwise.                      |
| User Approval Gate                      | PASS   | CI, broader execution, cleanup, and promotion still require later explicit user decisions.                           |

## Final Statement

This design now has a bounded Todo Search CLI-backed Evidence implementation.

That generated Evidence remains Evidence only.

It does not approve or execute scoped source-authority transition.

It does not change current source authority, retire tree-native artifacts, or declare Graph-source promotion.
