# Todo App Limited Source-Authority Pilot

Status: evaluated / blocked-for-now / remains-structure-only / no-promotion

## Purpose

This package evaluates whether the existing Todo App PBE Run can be advanced from Graph-source-backed
`structure-only` toward a narrowly bounded limited source-authority pilot.

The result is intentionally conservative: the current artifacts prove a strong structure-only projection contract, but
they do not yet support a real limited source-authority pilot without adding new pilot evidence. PBE should not fake a
source-authority promotion by changing labels while the required pilot inputs remain absent.

This package does not promote Todo App, expand repo-wide Graph-source authority, enable required checks, configure
branch protection, change CI enforcement, retire tree-native artifacts, change schemas or state, enroll invalid
fixtures, or replace user acceptance.

## Current Todo App Boundary

Current configured profile:

```text
todo-app-pbe-run-structure-only
```

Current slice:

```text
examples/valid/todo-app-pbe-run
```

Current status:

- graph-source-backed generation is present;
- projection contract passes with 22 nodes, 38 edges, and 7 Core Views;
- read-model validation passes with 16 checks;
- positive validate-all includes the Todo App profile;
- Todo App remains `structure-only`;
- canonical `.pbe` artifacts remain compatibility/fallback/reference;
- no parity backing, pilot marker backing, runtime fixture requirement, CI enforcement, tree-native retirement, or user
  acceptance replacement is created.

## Deterministic Evidence Present

The current artifacts support structure-only confidence:

| Evidence surface     | Current signal                                                                 |
| -------------------- | ------------------------------------------------------------------------------ |
| Graph source         | `examples/valid/todo-app-pbe-run/graph-source.json`                            |
| Projection contract  | `generated/graph-source-read-model-projection.json` passes                     |
| Generated read-model | `generated/generated-read-model.json`, 22 nodes / 38 edges / 7 Core Views      |
| Validation report    | `generated/read-model-validation-report.json`, `validation-pass`, 16 checks    |
| Evidence manifest    | `generated/read-model-evidence-manifest.json`                                  |
| Acceptance artifact  | `.pbe/control/acceptance-tree.json` contains accepted closure for the fixture  |
| Transition status    | `graph-source-transition-status.json` records `confirmed-structure-only` role  |
| Positive registry    | `read-model-slices.json` includes Todo App as `structure-only`                 |
| E2E smoke            | `test:read-model:e2e` checks Todo App structure-only generation and projection |

This is enough to keep Todo App in positive validate-all as a structure-only profile. It is not enough to make Todo App
source-authority-bearing beyond that boundary.

## Pilot Blockers

The pilot is blocked because the existing artifacts explicitly retain these limitations:

1. The registry profile policy level is `structure-only`.
2. The registry does not require `compare`.
3. No manual parity artifact is declared.
4. No parity report is required for Todo App.
5. No scoped source-authority pilot marker is required or present.
6. Runtime fixture evidence is attached-evidence-only and not required.
7. The graph-source artifact says it does not create parity backing, pilot marker backing, CI enforcement, or broader
   source authority.
8. The projection contract must preserve `structure-only` boundary text.
9. The transition status records `sourceAuthorityBeyondStructureOnly: not-approved`.
10. The retirement package remains `not-ready-structure-only`.

Changing labels without resolving these blockers would be a paper promotion, not a real pilot.

The sharper evidence package for these blockers is recorded in
[Todo App Source-Authority Evidence Package](todo-app-source-authority-evidence-package.md).

## Retry After Graph-Native Execution Contract Surface

After the first graph-native execution contract report surface was added, the retry evaluated the configured Todo Search
and Todo App slices with:

```text
node dist/cli/index.js graph execution-contract report --slice examples/adoption/todo-search-slice --json
node dist/cli/index.js graph execution-contract report --slice examples/valid/todo-app-pbe-run --json
```

Observed result:

| Slice       | Profile                           | Policy level          | Report signal                                                            | Pilot decision                           |
| ----------- | --------------------------------- | --------------------- | ------------------------------------------------------------------------ | ---------------------------------------- |
| Todo Search | `todo-search-selected-slice`      | `pilot-marker-backed` | Product/Work/Test/Evidence refs, source files, parity, pilot marker      | Preserve existing limited selected slice |
| Todo App    | `todo-app-pbe-run-structure-only` | `structure-only`      | Product/Work/Test/Evidence refs and source files, no parity/pilot marker | Keep blocked beyond structure-only       |

The new report surface improves reviewability, but it does not create the missing Todo App pilot evidence. Todo App
still lacks required parity backing, scoped pilot marker evidence, runtime fixture policy, and explicit approval for
source authority beyond `structure-only`.

Retry decision:

```text
No new Todo App source-authority pilot metadata is promoted in this retry.
```

Todo Search remains the already configured limited Graph-source selected slice. This retry does not broaden Todo Search
authority, enroll Todo App as a pilot, or change Candidate B required-check status.

## Minimum Real Pilot Requirements

Before Todo App can become a limited source-authority pilot, PBE needs a separate approved implementation branch that
adds or explicitly waives the missing evidence.

Minimum requirements:

1. Explicit user approval to evaluate Todo App beyond `structure-only`.
2. A Todo App-specific source-authority scope and non-scope statement.
3. A pilot marker or an explicitly approved replacement for pilot-marker evidence.
4. A parity policy: manual parity, deterministic projection parity, or an approved waiver with risk notes.
5. A runtime/behavior evidence policy for the add-todo capability.
6. Updated registry metadata that distinguishes the pilot from `structure-only`.
7. Updated projection contract checks that allow only the new bounded pilot scope.
8. Updated validation checks proving no repo-wide promotion, CI enforcement, or tree-native retirement was implied.
9. Focused tests proving Todo Search remains unchanged and invalid fixtures remain outside positive registry.
10. A user acceptance boundary stating that generated Evidence does not replace Product/user acceptance.

## Current Source-Authority Boundary

Todo App source authority remains:

```text
confirmed graph-source-backed structure-only
```

It is source-backed only for structure projection Evidence. It is not:

- parity-backed;
- pilot-marker-backed;
- runtime-backed;
- source-authority-bearing for product meaning;
- eligible for tree-native retirement;
- repo-wide Graph-source promotion;
- CI enforcement;
- required-check scope;
- user acceptance.

## What Remains Compatibility / Fallback / Reference

The following remain compatibility/fallback/reference for Todo App:

- canonical `.pbe/tree/*` artifacts;
- `.pbe/control/*` artifacts;
- `.pbe/evidence/*` artifacts;
- `.pbe/execution/*` artifacts;
- `.pbe/blueprint/*` compatibility views;
- generated read-model Evidence;
- validation reports;
- aggregate reports;
- E2E smoke reports;
- user acceptance records.

These artifacts must not be retired or overwritten by a pilot label change.

## Preserved Boundaries

This evaluation preserves:

- Todo Search limited Graph-source promoted selected-slice behavior;
- positive registry membership for only Todo Search and Todo App;
- invalid fixture exclusion from positive validate-all and CI;
- adoption-safe validation behavior;
- graph-native execution contract design boundaries;
- Candidate B as prepared but not required;
- non-enforcing graph health and E2E smoke;
- no branch protection or CI enforcement;
- no schema or state changes.

## Decision

Todo App limited source-authority pilot is blocked for now.

Current evidence package decision:

```text
Todo App remains confirmed graph-source-backed structure-only. The next implementation branch should add or explicitly
waive scoped pilot marker, parity, runtime evidence, and user approval requirements before changing registry policy
level.
```

Recommended next decision:

```text
Should PBE add the missing Todo App pilot evidence package, or should Todo App remain structure-only while external
dogfooding continues?
```

Recommended answer:

```text
Keep Todo App structure-only until a separate pilot evidence package is approved and implemented.
```
