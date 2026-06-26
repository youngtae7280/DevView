# Graph Source Artifact Storage And Projection Generation Design

Status: first-artifact-implemented / minimal-cli-projection-path / no-workflow-change

## Purpose

This document defines the next implementation branch after limited Graph-source promotion:

```text
Graph source artifact/storage + projection generation
```

It prepares and now records the first storage and projection step for the promoted Todo Search selected-slice scope. The
first non-generated graph source artifact exists, and focused tests prove projection preserves the current Todo Search
read-model shape. A minimal CLI projection path now writes an explicit generated projection artifact when invoked. This
does not change default generation, workflows, retained fallback artifacts, or source authority beyond the executed
limited scope.

## Current Baseline

| Area                  | Current state                                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Promoted scope        | Todo Search selected-slice authority surface.                                                                                                        |
| Source model in scope | Maintainability Graph, as recorded by [broader-graph-source-promotion-execution-record.md](broader-graph-source-promotion-execution-record.md).      |
| Fallback/reference    | Tree-native selected-slice artifacts retained as maintained compatibility / fallback / reference artifacts.                                          |
| Graph source artifact | `examples/adoption/todo-search-slice/graph-source.json` exists as non-generated limited source artifact.                                             |
| Generated projections | Existing generated read-model artifacts and the graph-source projection output remain Evidence/projection outputs, not independent source authority. |
| Positive registry     | `examples/read-model-aggregate/read-model-slices.json` includes Todo Search and Todo App PBE Run only.                                               |
| Todo App PBE Run      | `structure-only`, not source-bearing.                                                                                                                |
| CI                    | Manual and PR informational, non-enforcing.                                                                                                          |

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

Current projection helper and CLI surface:

```text
loadGraphSourceArtifact -> projectGraphSourceReadModel -> projectGraphSourceReadModelToFile
pbe graph read-model project --graph-source examples/adoption/todo-search-slice/graph-source.json --output examples/adoption/todo-search-slice/generated/graph-source-read-model-projection.json
```

Focused tests prove that projection from `graph-source.json` preserves the current Todo Search generated read-model
nodes, edges, and Core View coverage. Contract tests now also validate the committed source/projection artifact pair for
metadata, source scope, projection role, fallback/reference retention, user-acceptance boundary, non-promotion wording,
expected counts, Core Views, and source-record parity. The generated projection artifact is:

```text
examples/adoption/todo-search-slice/generated/graph-source-read-model-projection.json
```

Future projection generation hardening should:

1. Read the promoted graph source artifact.
2. Generate or refresh read-model / view projection artifacts into `generated/`.
3. Compare generated projections against retained fallback/reference artifacts where parity is required.
4. Preserve source, projection, Evidence, fallback, and user-acceptance boundaries in every output manifest.
5. Keep Todo App PBE Run structure-only unless a separate authority package promotes it.

## Initial Implementation Sequence

Recommended sequence:

1. Review the graph source projection helper, CLI surface, artifact shape, and contract hardening tests.
2. Decide whether schema hardening should extend into validate-all planning or remain standalone for another observation pass.
3. Add parity/validation tests for any new projection output shape before broadening its use.
4. Keep `validate --all` positive registry behavior stable until the projection path is reviewed.

## Non-Scope

This design does not:

- create a repo-wide graph source artifact
- change default `graph read-model generate` behavior
- modify workflow or CI
- regenerate unrelated generated artifacts
- add enforcement or required checks
- promote Todo App PBE Run beyond `structure-only`
- execute repo-wide Graph-source promotion
- retire tree-native artifacts
- replace user acceptance
