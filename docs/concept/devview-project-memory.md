# DevView Project Memory

DevView Project Memory is the persistent project profile layer that sits before project-specific graph vocabulary is
allowed to influence traversal, selected slices, contract input, or instruction packs.

It answers a different question from Request IR. Request IR says what the user is asking for in this task. Project
Memory says what kind of project DevView is working inside, what must be preserved, what kind of improvement is
allowed, and which taxonomy/viewpoint extensions are only candidates until reviewed.

## Boundary Artifacts

The Project Memory boundary is recorded in:

```text
examples/valid/todo-app-devview-run/generated/devview-project-memory-boundary.runtime-evidence-only.preview.json
```

The related profile boundaries are:

```text
examples/valid/todo-app-devview-run/generated/devview-project-profile-schema-boundary.runtime-evidence-only.preview.json
examples/valid/todo-app-devview-run/generated/devview-taxonomy-profile-extension-boundary.runtime-evidence-only.preview.json
examples/valid/todo-app-devview-run/generated/devview-project-direction-change-boundary.runtime-evidence-only.preview.json
```

The current synthetic Project Memory preview used by tests is generated in temporary workspaces only. The canonical
boundary shape is represented by:

```text
examples/valid/todo-app-devview-run/generated/devview-project-memory-boundary.runtime-evidence-only.preview.json
```

These artifacts are preview-only. They do not approve a profile, apply taxonomy extensions, change traversal behavior,
generate a selected slice, generate contract input, generate an instruction pack, mutate graph-source, apply graph
deltas, satisfy Evidence, prove equivalence, enforce scope, configure CI, or replace human review.

## Native And Retrofit Modes

DevView Native projects treat the current source structure as the main product growth surface. Typical view trees are
route, component, service, domain, test, runtime, and risk. Native Project Memory should preserve current user-facing
behavior and source contracts unless a reviewed task explicitly opens behavior change.

DevView Retrofit projects treat legacy behavior as something to map and preserve before bounded improvement, porting,
or refactoring work is compiled. Typical view trees are legacy module, execution flow, parity, migration target, UI
layout surface, hardware boundary, and forbidden-flow boundary. Retrofit Project Memory must keep parity, hardware,
native interop, and forbidden behavior drift visible before any extension or task scope gains authority.

Hybrid projects are allowed, but they must state which side is editable and which side is context-only. Unknown projects
should block extension authority and route to clarification or human review.

## Project Memory To Extension Flow

Project Memory connects to taxonomy and view tree decisions through a proposal-only chain:

```text
Project Memory Candidate
-> profile schema boundary check
-> taxonomy profile extension candidate
-> view tree profile candidate
-> extension delta proposal
-> human review packet
-> approved project memory revision (future-only)
```

Unapproved extension vocabulary is not traversal authority, not selected-slice authority, not contract authority, and
not instruction-pack authority.

## Synthetic Retrofit Preview

The synthetic retrofit preview records `devviewMode: retrofit` and a project direction such as
`synthetic-retrofit`. It separates:

- whole project portfolio: observed inventory, context-only
- focused slice: detailed retrofit context with graph-backed records and instruction-pack preview context

The preview can reference a taxonomy profile candidate such as `synthetic-retrofit-extension-v0`. That profile may
include extension candidates such as `synthetic-adapter`, `execution-flow`, `ui-layout-surface`,
`forbidden-flow-boundary`, and `integration-target`. Those are project-specific extension candidates only; they do not
become authority until a future human-reviewed project memory revision exists.

## Direction Changes

When a user changes direction, for example from porting to behavior-preserving refactor, DevView must not silently
reinterpret the project graph. The direction change boundary requires:

```text
Direction Change Candidate
-> profile impact analysis
-> taxonomy extension delta proposal
-> view tree profile delta proposal
-> human review packet
-> approved project memory revision (future-only)
```

The current boundary does not implement approval or apply.

## Extension Gap Detector

The first report-only detector is implemented as:

```text
graph read-model report-project-memory-extension-gaps
```

It compares Project Memory required extension vocabulary against current graph-source/read-model vocabulary and reports
missing, extra, deprecated, and unapproved kinds. It remains advisory and proposal-only. It does not apply extensions,
mutate graph-source, change traversal, or authorize contracts.

Tests create synthetic calibration reports in temporary workspaces. No project-specific calibration fixture is shipped
in the DevView repo.

## Impact Report

The first direction-change impact report is implemented as:

```text
graph read-model report-project-memory-impact
```

It reads a direction-change candidate and reports preservation, improvement, source authority, taxonomy, and view tree
impact before any future revision can be reviewed. It does not approve or apply a Project Memory revision.

Tests create synthetic direction-change candidates and impact reports in temporary workspaces. No project-specific
direction-change fixture is shipped in the DevView repo.
