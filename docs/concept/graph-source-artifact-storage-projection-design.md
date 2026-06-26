# Graph Source Artifact Storage And Projection Generation Design

Status: first-artifact-implemented / minimal-cli-projection-path / graph-source-backed-generation /
todo-app-confirmed-structure-only-graph-source / candidate-observation-ci-artifact-capture /
todo-app-positive-validate-all-enrollment-local-first

## Purpose

This document defines the next implementation branch after limited Graph-source promotion:

```text
Graph source artifact/storage + projection generation
```

It prepares and now records the first storage and projection step for the promoted Todo Search selected-slice scope. The
first non-generated graph source artifact exists, and focused tests prove projection preserves the current Todo Search
read-model shape. A minimal CLI projection path now writes an explicit generated projection artifact when invoked. This
now also backs Todo Search default read-model generation from the bounded graph source records. It does not change
workflows, retained fallback artifacts, Todo App structure-only behavior, or source authority beyond the executed limited
scope.

The next bounded expansion surface is now confirmed as a structure-only graph-source artifact for the Todo App PBE Run:

```text
examples/valid/todo-app-pbe-run/graph-source.json
```

This graph source backs the current structure-only generated read-model records and is consumed by local positive
`validate --all` as a confirmed structure-only projection-contract check. It is not parity-backed, not
pilot-marker-backed, not enforcement, and not promotion beyond `structure-only`.

## Current Baseline

| Area                  | Current state                                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Promoted scope        | Todo Search selected-slice authority surface.                                                                                                        |
| Source model in scope | Maintainability Graph, as recorded by [broader-graph-source-promotion-execution-record.md](broader-graph-source-promotion-execution-record.md).      |
| Fallback/reference    | Tree-native selected-slice artifacts retained as maintained compatibility / fallback / reference artifacts.                                          |
| Graph source artifact | `examples/adoption/todo-search-slice/graph-source.json` exists as non-generated limited source artifact.                                             |
| Generated projections | Existing generated read-model artifacts and the graph-source projection output remain Evidence/projection outputs, not independent source authority. |
| Positive registry     | `examples/read-model-aggregate/read-model-slices.json` includes Todo Search and Todo App PBE Run only.                                               |
| Todo App PBE Run      | `structure-only`, graph-source-backed with a confirmed projection contract in local positive validate-all; not parity-backed or pilot-marker-backed. |
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
expected counts, Core Views, and source-record parity. Local registry-backed `validate --all` now runs this projection
contract check for the Todo Search profile and exposes `projectionContractStatus` in JSON output. The generated
projection artifact is:

```text
examples/adoption/todo-search-slice/generated/graph-source-read-model-projection.json
```

Todo Search `graph read-model generate --slice examples/adoption/todo-search-slice` now uses the same bounded graph
source records for generated nodes, edges, and Core View coverage while preserving the existing generated Evidence role,
manual parity pass, validation pass, and 40-node / 59-edge / 7-Core-View shape.
Manual CI run `28219396764` and PR #5 run `28219583619` reviewed this graph-source-backed generation path with
`ci-evidence-pass`, `comparison-pass`, `validation-pass`, and `projection-contract-pass`.

Future projection generation hardening should:

1. Read the promoted graph source artifact.
2. Generate or refresh read-model / view projection artifacts into `generated/`.
3. Compare generated projections against retained fallback/reference artifacts where parity is required.
4. Preserve source, projection, Evidence, fallback, and user-acceptance boundaries in every output manifest.
5. Keep Todo App PBE Run structure-only unless a separate authority package promotes it.

## Todo App Structure-Only Graph Source

The Todo App structure-only graph source is strict JSON, non-generated, and located outside `generated/`:

```text
examples/valid/todo-app-pbe-run/graph-source.json
```

Implemented boundary:

- `artifactRole: structure-only-graph-source`
- `status: confirmed-graph-source-backed`
- `graphSourceScope: todo-app-pbe-run-structure-only`
- `policyLevel: structure-only`
- source records preserve the current 22-node / 38-edge / 7-Core-View structure-only projection
- graph-source boundaries state that the artifact is consumed by positive validate-all only as a confirmed
  structure-only projection contract

Focused tests parse the graph source, compare its records to the existing Todo App structure-only generated read-model,
and reject attempts to mark the structure-only source as promoted beyond its bounded role.

The same `graph read-model project --graph-source ... --output ...` CLI surface now projects this source into:

```text
examples/valid/todo-app-pbe-run/generated/graph-source-read-model-projection.json
```

The projection preserves 22 nodes, 38 edges, and 7 Core Views. Its metadata uses
`structure_only_graph_source_read_model_projection` and `structure-only`; its boundaries state that it does not promote
Todo App PBE Run beyond structure-only, does not add parity or pilot marker requirements, and participates in positive
validate-all only as a confirmed structure-only projection contract. Focused tests validate the committed projection
contract directly and reject projection boundary drift, including broader authority creation claims.

The local observation command checks this candidate projection outside positive validate-all semantics:

```bash
pbe graph read-model observe-candidates
```

It reports `candidate-observation-pass` for backward-compatible observation output when the Todo App projection contract
passes, or `candidate-observation-blocked` when the projection is missing, malformed, or claims broader authority. This
command remains local and non-promotional; positive validate-all now checks the same confirmed structure-only projection
contract.

The non-enforcing read-model Evidence workflow now runs the same observation command after positive validate-all and
uploads:

```text
examples/read-model-aggregate/generated/read-model-candidate-observation-output.json
examples/valid/todo-app-pbe-run/generated/graph-source-read-model-projection.json
```

The CI manifest and Step Summary expose `candidateObservationStatus` and the Todo App candidate projection status as
separate observation metadata. These fields do not change `validateAllStatus`, `aggregateStatus`, the positive registry,
source authority, or Todo App promotion status.

Manual workflow run `28221088498` reviewed this candidate-observation capture on `workflow_dispatch` at commit
`68c2d20775ecbdd118a7d7b91053239ed4cd97f9`. The artifact manifest recorded
`candidateObservationStatus: candidate-observation-pass`, Todo App candidate `candidate-projection-contract-pass`,
positive Todo App projection `not-configured`, `validateAllStatus: aggregate-pass`, and `aggregateStatus:
aggregate-pass`. The artifact bundle included both `read-model-candidate-observation-output.json` and
`graph-source-candidate-read-model-projection.json`.
PR #6 run `28221326457` reviewed the same fields in `pull_request-informational` mode with PR metadata present.

The next decision surface was recorded in
[todo-app-graph-source-enrollment-decision-package.md](todo-app-graph-source-enrollment-decision-package.md), and the
local-first bounded enrollment has now advanced to confirmed structure-only graph-source-backed generation. Fresh
manual/PR CI review of the confirmed label remains the next observation step.

Todo App structure-only generation now uses the confirmed graph-source records for generated read-model output:

```bash
pbe graph read-model generate --slice examples/valid/todo-app-pbe-run
```

The generated read-model preserves 22 nodes, 38 edges, and 7 Core Views, records `readModelSourceMode:
graph-source-backed`, and keeps `graphSourceAuthorityStatus: confirmed-structure-only-graph-source`. This is a
structure-only graph-source-backed generation path, not parity backing, pilot-marker backing, enforcement, or promotion
beyond structure-only.

Manual workflow run `28224636333` reviewed this metadata in uploaded CI artifacts: Todo App generation recorded
`graph-source-backed` and `non-authority-structure-only`, validation stayed `validation-pass`, positive projection stayed
`candidate-projection-contract-pass`, and validate-all/E2E smoke stayed pass.
PR #9 run `28224878648` reviewed the same fields through `pull_request-informational` mode with PR metadata present.

## Initial Implementation Sequence

Recommended sequence:

1. Review the graph source projection helper, CLI surface, artifact shape, and contract hardening tests.
2. Keep manual/PR workflow observation of projection contract status visible.
3. Add parity/validation tests for any new projection output shape before broadening its use.
4. Keep `validate --all` positive registry behavior bounded to the declared Todo Search and Todo App profiles.

## Non-Scope

This design does not:

- create a repo-wide graph source artifact
- modify workflow trigger mode, required checks, or enforcement
- regenerate unrelated generated artifacts
- add enforcement or required checks
- promote Todo App PBE Run beyond `structure-only`
- promote the Todo App candidate artifact into source authority or beyond `structure-only`
- execute repo-wide Graph-source promotion
- retire tree-native artifacts
- replace user acceptance
