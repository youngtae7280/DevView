# Graph Source Artifact Storage And Projection Generation Design

Status: implementation-branch-decision-surface / docs-only / no-artifact-created

## Purpose

This document defines the next implementation branch after limited Graph-source promotion:

```text
Graph source artifact/storage + projection generation
```

It prepares the storage and generation decision surface for the promoted Todo Search selected-slice scope. It does not
create the artifact, implement generators, modify CLI behavior, change workflows, retire tree-native artifacts, or expand
source authority.

## Current Baseline

| Area                  | Current state                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Promoted scope        | Todo Search selected-slice authority surface.                                                                                                   |
| Source model in scope | Maintainability Graph, as recorded by [broader-graph-source-promotion-execution-record.md](broader-graph-source-promotion-execution-record.md). |
| Fallback/reference    | Tree-native selected-slice artifacts retained as maintained compatibility / fallback / reference artifacts.                                     |
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

If implemented, the first graph source artifact should be strict JSON, non-generated, and located outside `generated/`.

Minimum shape:

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

Future projection generation should:

1. Read the promoted graph source artifact.
2. Generate read-model / view projection artifacts into `generated/`.
3. Compare generated projections against retained fallback/reference artifacts where parity is required.
4. Preserve source, projection, Evidence, fallback, and user-acceptance boundaries in every output manifest.
5. Keep Todo App PBE Run structure-only unless a separate authority package promotes it.

## Initial Implementation Sequence

Recommended sequence:

1. Add the non-generated graph source artifact for Todo Search selected slice.
2. Add parser/schema checks for the artifact.
3. Add projection generation from graph source to the existing read-model Evidence shape.
4. Add parity/validation tests proving projection output still matches the current Todo Search baseline.
5. Keep `validate --all` positive registry behavior stable until the projection path is reviewed.

## Non-Scope

This design does not:

- create the graph source artifact
- implement parser/schema/projection generation
- modify CLI commands
- modify workflow or CI
- regenerate generated artifacts
- add enforcement or required checks
- promote Todo App PBE Run beyond `structure-only`
- execute repo-wide Graph-source promotion
- retire tree-native artifacts
- replace user acceptance
