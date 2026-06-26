# Read-Model Aggregate Summary Contract

Status: read-model-aggregate-summary-contract / first-aggregate-summary-implemented / aggregate-ci-backed-run-reviewed

## Purpose

This contract defines the first cross-slice read-model Evidence summary after per-slice validation reports became
self-contained Evidence units.

The aggregate summary reads existing per-slice validation reports and writes one cross-slice Evidence summary. It does
not run read-model generation, parity comparison, validation, `validate --all`, CI enforcement, source authority
expansion, public-doc cleanup, tree-native retirement, or full Graph-source promotion.

## Implemented Command

```text
pbe graph read-model summarize --slices examples/adoption/todo-search-slice,examples/valid/todo-app-pbe-run
```

The command reads only:

- `examples/adoption/todo-search-slice/generated/read-model-validation-report.json`
- `examples/valid/todo-app-pbe-run/generated/read-model-validation-report.json`

The command writes:

- `examples/read-model-aggregate/generated/read-model-aggregate-summary.json`
- `examples/read-model-aggregate/generated/read-model-aggregate-summary.md`

The output directory is outside either slice because the aggregate summary is a cross-slice Evidence summary, not a
slice-owned source artifact.

## Included Slices

| Slice                                 | Profile id                        | Policy level          | Source layout       | Current validation |
| ------------------------------------- | --------------------------------- | --------------------- | ------------------- | ------------------ |
| `examples/adoption/todo-search-slice` | `todo-search-selected-slice`      | `pilot-marker-backed` | `flat-demo-support` | `validation-pass`  |
| `examples/valid/todo-app-pbe-run`     | `todo-app-pbe-run-structure-only` | `structure-only`      | `canonical-pbe`     | `validation-pass`  |

Todo Search remains the only active scoped source-authority pilot. Todo App PBE Run remains structure-only and is not
parity-backed, pilot-marker-backed, or authority-bearing, even when included in the reviewed aggregate-enabled CI
artifact bundle.

## Aggregate Decision Rule

| Aggregate status    | Rule                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `aggregate-blocked` | Any included slice has a missing, malformed, or blocking validation report.                               |
| `decision-required` | No included slice is blocking, but at least one included slice requires user judgment.                    |
| `aggregate-warning` | No included slice is blocking or decision-required, but at least one included slice has warnings.         |
| `aggregate-pass`    | All included slices pass their declared policy level with 0 warning / blocking / decision-required count. |

Missing or malformed per-slice reports are visible as aggregate blockers. The aggregate summary does not silently
repair, regenerate, compare, validate, or reinterpret the source slice.

## Required Per-Slice Summary Fields

Each per-slice entry must carry enough information to remain reviewable without opening the source report first:

- source slice path
- profile id
- source layout
- policy level
- validation status
- check, pass, warning, blocking, and decision-required counts
- parity requirement/status/path summary
- pilot marker requirement/status/path summary
- runtime fixture requirement/status summary
- retained warnings / accepted limitations
- source authority boundary
- non-promotion statement

## Boundary

Aggregate summary is Evidence only.

It does not:

- run `generate`, `compare`, `validate`, or `validate --all`
- expand source authority
- make generated read-model output the repository source
- turn structure-only slices into pilot slices
- introduce CI enforcement, required checks, PR triggers, or branch protection
- treat `aggregate-pass` as user approval
- approve broader Graph-source promotion
- retire tree-native or `.pbe` artifacts
- perform public-doc cleanup

## Current Result

The current aggregate summary is:

```text
aggregate-pass
```

Current counts:

- included slices: 2
- warning: 0
- blocking: 0
- decision-required: 0

This result means the two current per-slice validation reports can be read together as an Evidence summary. It does not
approve broader execution, CI enforcement, source authority expansion, or full Graph-source promotion.

## Non-Enforcing CI Workflow Use

The manual `PBE Read-Model Evidence` workflow now runs the aggregate summarize command after generating and validating
the Todo Search and Todo App PBE Run per-slice reports:

```text
node dist/cli/index.js graph read-model summarize --slices examples/adoption/todo-search-slice,examples/valid/todo-app-pbe-run --json
```

The workflow is still `workflow_dispatch` only and non-enforcing. Running aggregate summarize in CI does not turn the
aggregate into validation execution, does not implement `validate --all`, and does not expand source authority. A new
aggregate-enabled workflow run, `28156403793`, has now been reviewed as CI-backed Evidence with `ci-evidence-pass` and
aggregate `aggregate-pass`. Post-update run `28157938343` reviewed the same aggregate-enabled workflow after the Node 24
action/runtime update. The earlier Todo Search-only run `28151296796` remains historical CI-backed Evidence for the
first workflow shape.

## Tests

Focused tests cover:

- aggregate pass with the two current per-slice reports
- warning / blocking / decision-required status calculation
- no mutation of per-slice validation reports
- aggregate summary reads validation reports only and does not depend on generated read-model files
- missing or malformed per-slice report produces aggregate-blocked

## Next Decision Surface

Recommended next work remains bounded:

1. keep aggregate summary as Evidence-only and observe stability
2. keep the aggregate-enabled manual/PR informational workflow non-enforcing and observe
3. use [pr-informational-observation-policy.md](pr-informational-observation-policy.md) before refining PR filters or
   failure semantics
4. use [read-model-validate-all-contract.md](read-model-validate-all-contract.md) as the design-only contract before any
   future `validate --all` implementation decision
5. use [read-model-slice-registry-test-strategy.md](read-model-slice-registry-test-strategy.md) before creating a
   registry fixture or parser/planner tests
6. decide whether to strengthen Todo App PBE Run beyond structure-only
7. keep source authority expansion and full promotion as separate explicit decisions

## Final Statement

This contract and implementation create the first aggregate Evidence summary only. They do not change source authority,
do not create CI enforcement, do not approve full Graph-source promotion, and do not replace user judgment.
