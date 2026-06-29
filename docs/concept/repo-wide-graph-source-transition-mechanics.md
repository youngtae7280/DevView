# Repo-Wide Graph-Source Transition Mechanics

Status: implementation-mechanics / bounded / non-enforcing

## Purpose

This record captures the first repo-wide transition mechanics after Todo Search and Todo App PBE Run both became
graph-source-backed configured read-model slices.

It does not delete tree-native artifacts, enable enforcement, enroll invalid fixtures in CI, or promote Todo App beyond
`structure-only`. Todo Search tree-native selected-slice artifacts are deprecated fallback/reference records only; they
remain present and rollback-capable.

## Machine-Readable Status

The transition status artifact is:

- `examples/read-model-aggregate/graph-source-transition-status.json`

The artifact records:

- `sourceDirection: graph-source-confirmed-for-configured-read-model-slices`
- `treeNativeRole: compatibility-fallback-reference-with-todo-search-deprecated-fallback`
- `retirementReadinessSummary.status: retirement-not-ready`
- Todo Search source role: `limited-graph-source-promoted`
- Todo App source role: `confirmed-structure-only-graph-source`
- repo-wide boundaries: promotion not complete, tree-native retirement not complete, required checks/branch protection/CI
  enforcement not enabled, Todo App beyond `structure-only` not approved

## Tree-Native Retirement Readiness

The same status artifact now records criteria for deciding when tree-native artifacts could move from
compatibility/fallback/reference into retired or deprecated status. The criteria are intentionally stricter than current
operation:

- graph-source-backed generation is stable
- projection/read-model parity passes, or the slice has accepted structure-only status
- validate-all reports `aggregate-pass`
- E2E smoke passes, including `intentReport`
- manual and PR CI observation have reviewed the relevant fields
- rollback/fallback planning is present
- user acceptance and source-authority boundaries are clear
- no stale Evidence or hidden warning is concealed
- explicit user-approved retirement action is in scope

Repo-wide readiness remains `retirement-not-ready`.

| Slice                             | Current readiness                           | Boundary                                                                                                                        |
| --------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `todo-search-selected-slice`      | `deprecated-fallback-reference-not-deleted` | Tree-native selected-slice artifacts are deprecated fallback/reference, not source, and remain present with rollback available. |
| `todo-app-pbe-run-structure-only` | `not-retirement-ready`                      | The slice is confirmed graph-source-backed for `structure-only`, but source authority beyond structure-only is not approved.    |

The approval decision surface is prepared in
[tree-native-retirement-approval-package.md](tree-native-retirement-approval-package.md). It classifies Todo Search as
`retirement-candidate-not-deleted`, Todo App as `not-ready-structure-only`, and repo-wide retirement as `not-ready`.

## Registry Alignment

`examples/read-model-aggregate/read-model-slices.json` is now recorded as
`active-consumed-by-validate-all`.

The registry still has exactly two positive validate-all profiles:

| Profile                           | Source role                                        | Positive validate-all role                                                              |
| --------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `todo-search-selected-slice`      | limited graph-source promoted selected slice       | graph-source-backed generate/compare/validate plus source-backed projection contract    |
| `todo-app-pbe-run-structure-only` | confirmed graph-source-backed structure-only slice | graph-source-backed generate/validate plus confirmed structure-only projection contract |

## E2E Check

`npm run test:read-model:e2e` now reads the transition status artifact and checks:

- Todo Search remains 40 nodes / 59 edges / 7 Core Views with source-backed projection contract.
- Todo App remains 22 nodes / 38 edges / 7 Core Views with confirmed structure-only projection contract.
- Todo Search tree-native selected-slice artifacts remain present as deprecated fallback/reference, not source.
- Todo App and repo-wide tree-native artifacts remain compatibility/fallback/reference.
- repo-wide promotion, tree-native retirement, and CI enforcement remain incomplete.
- retirement readiness remains non-destructive, with Todo Search deprecated-not-deleted and Todo App not-ready.

## Local Health Report

`graph read-model report-health --json --markdown <path>` provides a non-enforcing local summary over the current
Graph-source transition state. It reads existing validate-all aggregate output, projection contracts, edgeIntent report
health, transition status, retirement readiness, and retirement approval package statuses. The optional Markdown output
is a human-readable companion summary for artifact review; it does not rerun E2E, mutate generated source artifacts,
create required checks, or approve tree-native retirement.

The non-enforcing read-model Evidence workflow now captures the same health report as
`read-model-health-report-output.json` and `read-model-health-report-output.md`; manual run `28350824272` reviewed the
JSON artifact and manifest fields as `graph-source-health-pass`. PR #13 run `28351078223` reviewed the same health
report in `pull_request-informational` mode with PR metadata present. Manual run `28351612200` reviewed the Markdown
summary artifact path and human-readable health content. PR #14 run `28351775566` reviewed the Markdown summary in
`pull_request-informational` mode with PR metadata present.

## Boundaries

This mechanics step is intentionally not:

- file deletion or physical tree-native retirement
- required check or branch protection configuration
- CI enforcement
- invalid fixture CI inclusion
- Todo App parity-backed or pilot-marker-backed promotion
- Todo App source authority beyond `structure-only`
- replacement of user acceptance

## Next Decision Surface

The next bounded decision should choose one of:

- continue observing the two graph-source-backed configured slices
- design repo-wide transition mechanics for additional slice enrollment
- prepare an explicit tree-native retirement approval package, or continue retaining compatibility/fallback/reference
- design enforcement/required-check policy separately
