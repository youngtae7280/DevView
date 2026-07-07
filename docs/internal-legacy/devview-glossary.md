# DevView Glossary

DevView is the public-facing name for the Codex plugin formerly called Project Blueprint Engine.

DevView is a graph-source development control plugin for Codex. It gives AI agents a developer's selective view of the
codebase before they change it by connecting code, requirements, tasks, tests, evidence, decisions, and changes into one
meaning graph, then extracting task-ready views and bounded Instruction Packs for safer code changes.

PBE remains the compatibility namespace for existing commands, artifact paths, validation scripts, generated files, and
historical records.

## Core Terms

### Graph Source / Meaning Graph

The graph-source artifact records durable project meaning: code, requirements, tasks, tests, evidence, decisions, risks,
changes, and their relationships. A meaning graph is the conceptual model behind that graph source.

The graph is a source of meaning, not an executor. It does not apply graph deltas, approve work, or enforce CI by
itself.

### View / Read Model

A view is a bounded projection of the meaning graph for a specific task, report, validation check, or review surface.

A read model is a machine-readable or generated view used by validators, reports, tests, or review packets. A read model
can be smaller than the graph, but it must preserve traceability back to the source meaning.

### View Tree

View Tree is a legacy-compatible derived view term. Tree-shaped artifacts can remain useful for compatibility, task
planning, or migration, but they should not be confused with the graph source when a graph-source authority scope has
been explicitly configured.

### Instruction Pack

An Instruction Pack is a bounded task handoff for Codex. It can include goal, selected scope, forbidden scope, required
context, checks, evidence, risks, stop conditions, and output requirements.

An Instruction Pack is not an execution source, not approval, not user acceptance, and not permission to ignore explicit
boundaries.

### Graph Delta

A Graph Delta is a proposed update to graph meaning after work or review. It can describe evidence, decisions, risks,
scope findings, or changed relationships.

DevView does not automatically apply graph deltas in this compatibility pass.

### Impact Preview

An Impact Preview describes likely downstream effects before a change is accepted into a work plan or graph update. It
helps review affected scope, tests, evidence, risks, and compatibility surfaces.

An Impact Preview is review evidence, not automatic approval.

### Promotion Review Packet

A Promotion Review Packet gathers compiler candidate, comparison fixture, semantic diff, source-authority gap, health,
validation, and checklist evidence for a human review.

It is not approval, not user acceptance, not an execution source, and not an enforcement switch.

## PBE To DevView Terminology

| Legacy-compatible term    | DevView-facing term                      | Status                                     |
| ------------------------- | ---------------------------------------- | ------------------------------------------ |
| Project Blueprint Engine  | DevView                                  | New public product/plugin name             |
| PBE                       | PBE compatibility namespace              | Still supported                            |
| `pbe` CLI                 | `pbe` compatibility CLI for DevView      | Preserved in this pass                     |
| `.pbe/`                   | `.pbe/` compatibility artifact namespace | Preserved in this pass                     |
| Blueprint                 | Meaning Graph / Graph Source             | Legacy-compatible, not immediately removed |
| Product Tree              | Product View                             | Legacy-compatible derived view             |
| Project Tree              | Project View                             | Legacy-compatible derived view             |
| Work Tree                 | Work View                                | Legacy-compatible derived view             |
| Test Tree                 | Test View                                | Legacy-compatible derived view             |
| Tree                      | View / View Tree / Read Model            | Legacy-compatible derived view             |
| ACEP                      | Instruction Pack                         | Compatibility term remains                 |
| Cycle Slice               | Selected Subgraph / Task Slice           | Compatibility term remains                 |
| Change Tree               | Graph Delta                              | Compatibility term remains                 |
| Impact Tree               | Impact Preview                           | Compatibility term remains                 |
| Revision Pack             | Repair Pack                              | Compatibility term remains                 |
| Coverage Audit            | Trace Coverage Audit                     | Compatibility term remains                 |
| Contract Compiler Dry-Run | Contract Compiler Dry-Run                | Name unchanged; behavior unchanged         |
| Promotion Review Packet   | Promotion Review Packet                  | Review artifact, not approval              |

## Compatibility Boundaries

- DevView does not rename the `pbe` CLI in this pass.
- DevView does not rename `.pbe/` directories in this pass.
- DevView does not rename `validate:pbe` or `validate:pbe:v2`.
- DevView does not rename generated artifact paths.
- DevView does not change sourceMode or provenance enum values.
- DevView does not change compiler, source-authority resolver, semantic diff, or readiness behavior.
- DevView does not turn generated compiler output, Instruction Packs, or review packets into execution authority,
  approval, or user acceptance.
- DevView does not introduce executor automation, graph delta apply, required checks, branch protection, CI enforcement,
  user acceptance automation, or tree-native retirement.
