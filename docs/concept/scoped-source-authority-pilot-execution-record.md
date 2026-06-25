# Scoped Source-Authority Pilot Execution Record

Status: scoped-source-authority-pilot-execution-record / scoped-pilot-executed-with-fallback-ready / bounded-to-todo-search

## Document Purpose

This record documents the user-approved actual scoped source-authority pilot execution for the Todo Search selected
slice.

This is a bounded pilot execution record. It is not full Graph-source promotion, not repository-wide source authority
change, not public-doc cleanup, not validator/CI enforcement, and not tree-native artifact retirement.

## User Approval Trace

| Field           | Value                                                                            |
| --------------- | -------------------------------------------------------------------------------- |
| Approval source | parent orchestration chat                                                        |
| Approval date   | 2026-06-25                                                                       |
| Approved option | `Approve actual scoped source-authority pilot execution with generated Evidence` |
| Approval scope  | Todo Search selected slice only                                                  |
| Non-approval    | full Graph-source promotion                                                      |
| Non-approval    | repository-wide source authority change                                          |
| Non-approval    | tree-native artifact retirement                                                  |
| Non-approval    | public-doc cleanup                                                               |
| Non-approval    | validator/CI enforcement                                                         |

## Pilot Scope

### Primary Pilot Scope

```text
examples/adoption/todo-search-slice
```

The pilot applies only to the Todo Search selected slice and its generated Evidence outputs.

### Generated Evidence Input

- `examples/adoption/todo-search-slice/generated/generated-read-model.json`
- `examples/adoption/todo-search-slice/generated/read-model-evidence-manifest.json`
- `examples/adoption/todo-search-slice/generated/read-model-parity-report.json`
- `examples/adoption/todo-search-slice/generated/parity-warning-resolution.md`

### Manual / Reference Inputs

- tree-native selected-slice artifacts under `examples/adoption/todo-search-slice`
- `examples/adoption/todo-search-slice/maintainability-graph-read-model.json`
- `examples/adoption/todo-search-slice/view-instance-manifest.json`

### Supplemental Warning Only

```text
examples/adoption/compatibility-mismatch-slice
```

The compatibility mismatch slice remains warning Evidence only. It is not pilot source scope.

## Source-Authority Pilot Meaning

For this pilot only, the generated read-model output is accepted as the scoped Graph-first authority record for:

- Node/Edge/Tag interpretation of the Todo Search selected slice
- 7 Core View assembly and traversal
- generated/manual parity review
- Approval Brief and Control Node review preparation
- scoped source-transition observation inside the Todo Search slice

This pilot authority is limited, reversible, and dependent on:

- generated Evidence being present
- the generated/manual parity report being `comparison-pass`
- retained warnings remaining visible
- tree-native fallback/reference artifacts being preserved
- user acceptance authority remaining user-controlled

## What Does Not Become Authoritative

The pilot does not make these authoritative:

- full Maintainability Graph source model
- repository-wide graph source authority
- public docs or ACEP cleanup state
- supplemental compatibility mismatch slice
- validator/CI enforcement
- generated builder output outside the Todo Search selected slice
- Codex/PBE self-acceptance

## Source Authority Matrix

| Artifact / record                         | Pilot role                                                                 | Fallback / reference role                                                   | Retirement allowed? |
| ----------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------- |
| Product Tree selected-slice artifact      | Current operational product source and fallback source                     | Primary fallback for product meaning and acceptance criteria                | No                  |
| Project Tree selected-slice artifact      | Current operational project/boundary source and fallback source            | Primary fallback for structure and ownership boundaries                     | No                  |
| Work Tree selected-slice artifact         | Current operational work source and fallback source                        | Primary fallback for task/scope responsibility                              | No                  |
| Test Tree selected-slice artifact         | Current operational Check source and fallback source                       | Primary fallback for verification obligations                               | No                  |
| Evidence Tree selected-slice artifact     | Current operational Evidence source and fallback source                    | Primary fallback for proof, freshness, and exceptions                       | No                  |
| Acceptance Tree selected-slice artifact   | User-controlled demo-support Acceptance source                             | Primary fallback for acceptance status and retained warnings                | No                  |
| Generated read-model Evidence             | Pilot-scoped Graph-first authority record for Node/Edge/Tag interpretation | Compare against tree-native and manual parity artifacts; not broad source   | No                  |
| Generated parity report                   | Pilot gate Evidence; must remain `comparison-pass` for active pilot use    | Fallback trigger if mismatches become warning/blocking/decision-required    | No                  |
| Manual read-model parity artifact         | Reference artifact for parity and review continuity                        | Reference/fallback for manual review, not the active generated pilot record | No                  |
| View Instance Manifest                    | Projection/reference Evidence for 7 Core Views                             | Reference for view membership and role tags                                 | No                  |
| Compatibility mismatch supplemental slice | Warning/control Evidence only                                              | Reference for ACEP cleanup and compatibility caveat                         | No                  |
| Runtime fixture Evidence                  | Behavior Evidence supporting pilot readiness                               | Bounded runtime proof; not full Todo app implementation                     | No                  |
| Public docs / ACEP docs                   | Deferred cleanup input only                                                | Compatibility reference; cleanup requires separate approval                 | No                  |

## Fallback / Rollback Criteria

No rollback command is executed in this record because no tree-native artifact is retired and no repository-wide source
authority is changed.

Fallback to tree-native selected-slice artifacts is required if any of these occur:

- generated/manual parity report becomes `comparison-warning`, `comparison-blocked`, or `decision-required`
- generated output loses source references or Node/Edge/Tag taxonomy integrity
- source authority boundary text is missing or implies broader promotion
- retained warnings are hidden
- Check/Evidence separation becomes ambiguous
- user acceptance authority appears replaced by Codex/PBE
- compatibility mismatch affects current scope, verification, acceptance, or authority judgment

Fallback is user-visible. It must not silently rewrite generated output, manual parity artifacts, or tree-native
selected-slice artifacts.

## Retained Warnings

| Warning                                      | Pilot treatment                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| Bounded fixture Evidence                     | Acceptable for this scoped pilot; not full Todo app implementation.             |
| Partial UI screenshot/manual visual Evidence | Acceptable warning for this pilot; visual proof remains partial.                |
| Validator/CI-backed Evidence missing         | Future strengthening question; not required for this scoped pilot execution.    |
| ACEP task-card public-doc cleanup deferred   | Deferred cleanup; visible compatibility warning, not performed by this record.  |
| Full Graph-source promotion not approved     | Boundary condition; broader promotion requires separate readiness and approval. |

## Execution Outcome

```text
scoped-pilot-executed-with-fallback-ready
```

The pilot is executed only as a bounded source-authority record for the Todo Search selected slice. Generated Evidence
and `comparison-pass` parity are sufficient for this scoped pilot. Tree-native selected-slice artifacts remain retained
as fallback/reference, and broader promotion remains unapproved.

## Control Node Summary

| Control record                     | Family                       | Status                      | Notes                                                                                     |
| ---------------------------------- | ---------------------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| Actual scoped execution approval   | Decision Control Node        | resolved                    | User approved the bounded Todo Search scoped source-authority pilot execution.            |
| Generated Evidence / parity pass   | Evidence Control Node        | resolved for scoped pilot   | Generated read-model and parity report are present; parity is `comparison-pass`.          |
| Public-doc cleanup                 | Compatibility Control Node   | deferred / active warning   | ACEP task-card cleanup remains visible and is not executed here.                          |
| Scoped source authority transition | Impact / Change Control Node | executed in bounded scope   | Limited to Todo Search generated read-model authority with tree-native fallback retained. |
| Demo-support Acceptance            | Acceptance Control Node      | preserved with warnings     | User Acceptance remains user-controlled and is not replaced by graph authority.           |
| Validator/CI-backed repeatability  | Evidence Control Node        | open / future strengthening | Not required for this pilot, but still relevant before broader promotion or enforcement.  |

## User Acceptance Boundary

The renewed Todo Search demo-support Acceptance remains user-controlled. This pilot record does not let Codex/PBE
accept product results, source authority changes, broader promotion, or warning retirement on the user's behalf.

## Final Non-Promotion Statement

This record executes a bounded scoped source-authority pilot for `examples/adoption/todo-search-slice` only.

It does not promote the Maintainability Graph as the repository-wide source model, does not change full PBE source
authority, does not retire tree-native artifacts, does not clean up public docs, does not introduce validator/CI
enforcement, and does not authorize full Graph-source promotion.
