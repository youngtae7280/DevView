# Graph Source Artifact Storage And Projection Generation Design

Status: first-artifact-implemented / internal-projection-helper / no-cli-surface-change

## Purpose

This document defines the next implementation branch after limited Graph-source promotion:

```text
Graph source artifact/storage + projection generation
```

It prepares and now records the first storage and projection step for the promoted Todo Search selected-slice scope. The
first non-generated graph source artifact exists, and focused tests prove internal projection preserves the current Todo
Search read-model shape. This does not modify CLI behavior, change workflows, retire tree-native artifacts, or expand
source authority beyond the executed limited scope.

## Current Baseline

| Area                  | Current state                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Promoted scope        | Todo Search selected-slice authority surface.                                                                                                   |
| Source model in scope | Maintainability Graph, as recorded by [broader-graph-source-promotion-execution-record.md](broader-graph-source-promotion-execution-record.md). |
| Fallback/reference    | Tree-native selected-slice artifacts retained as maintained compatibility / fallback / reference artifacts.                                     |
| Graph source artifact | `examples/adoption/todo-search-slice/graph-source.json` exists as non-generated limited source artifact.                                        |
| Generated projections | Existing generated read-model artifacts remain Evidence/projection outputs, not independent source authority.                                   |
| Positive registry     | `examples/read-model-aggregate/read-model-slices.json` includes Todo Search and Todo App PBE Run only.                                          |
| Todo App PBE Run      | `structure-only`, not source-bearing.                                                                                                           |
| CI                    | Manual and PR informational, non-enforcing.                                                                                                     |

## Candidate Storage Locations

| Candidate location                                                | Pros                                                                    | Risks / caveats                                                                                  | Recommendation                   |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------- |
| `examples/adoption/todo-search-slice/graph-source.json`           | Co-located with promoted scope; clearly non-generated if at slice root. | Needs schema and projection rules before creation.                                               | Preferred first candidate.       |
| `examples/adoption/todo-search-slice/generated/graph-source.json` | Close to generated Evidence.                                            | Bad boundary: source artifact under `generated/` can imply generated output is source authority. | Avoid.                           |
| `examples/read-model-aggregate/graph-source-registry.json`        | Could support future multi-slice source registry.                       | Too broad for first limited promoted scope.                                                      | Defer.                           |
| `.pbe/graph/source.json`                                          | Closer to future canonical repo layout.                                 | Repo has no active `.pbe/` artifacts here; premature for example-scope branch.                   | Future-only.                     |
| Docs-only concept record                                          | Lowest risk.                                                            | Cannot support projection generation.                                                            | Already covered by current docs. |

## Recommended First Artifact Shape

The first graph source artifact is strict JSON, non-generated, and located outside `generated/`:

```text
examples/adoption/todo-search-slice/graph-source.json
```

Implemented shape:

```json
{
  "schemaVersion": 1,
  "artifactRole": "limited-graph-source",
  "promotionScope": "todo-search-selected-slice",
  "sourceAuthorityBoundary": "...",
  "fallbackReferences": [],
  "nodes": [],
  "edges": [],
  "viewPolicies": [],
  "projectionTargets": []
}
```

The artifact should store durable graph source records. It should not store generated report status as source facts.

## Projection Generation Expectations

Current internal projection helper:

```text
loadGraphSourceArtifact -> projectGraphSourceReadModel
```

Focused tests prove that projection from `graph-source.json` preserves the current Todo Search generated read-model
nodes, edges, and Core View coverage.

Future CLI-facing projection generation should:

1. Read the promoted graph source artifact.
2. Generate read-model / view projection artifacts into `generated/`.
3. Compare generated projections against retained fallback/reference artifacts where parity is required.
4. Preserve source, projection, Evidence, fallback, and user-acceptance boundaries in every output manifest.
5. Keep Todo App PBE Run structure-only unless a separate authority package promotes it.

## Initial Implementation Sequence

Recommended sequence:

1. Review the internal graph source projection helper and artifact shape.
2. Decide whether projection generation needs a CLI surface or should remain internal until schema hardening.
3. If approved, generate read-model / view projection artifacts from graph source into `generated/`.
4. Add parity/validation tests proving projection output still matches the current Todo Search baseline.
5. Keep `validate --all` positive registry behavior stable until the projection path is reviewed.

## Non-Scope

This design does not:

- create a repo-wide graph source artifact
- add a CLI projection command
- modify CLI commands
- modify workflow or CI
- regenerate generated artifacts
- add enforcement or required checks
- promote Todo App PBE Run beyond `structure-only`
- execute repo-wide Graph-source promotion
- retire tree-native artifacts
- replace user acceptance
