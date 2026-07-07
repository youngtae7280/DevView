# Edge-Level Intent Vocabulary Design

Status: design decision / fixture-aligned / no broad schema enforcement

## Decision

Graph-source remains the single source direction. PBE does not create a separate intent ledger as another main source.

Intent is represented primarily as graph edge annotation. Node-level intent can exist as supporting context, but the
maintenance-critical relationship should live on the edge that explains why two records are connected or constrained.

## Why Edge-Level Intent

Vibe-coding maintenance often changes behavior when it sees shape but not reason. Edge-level intent keeps the reason
near the relationship that could be broken:

- acceptance intent protecting behavior
- non-goal boundaries preventing plausible wrong rewrites
- fallback or rollback reasons preventing premature artifact deletion
- evidence reasons explaining what must remain observable
- compatibility reasons explaining why old-looking artifacts still matter

## Vocabulary Boundary

PBE should not turn every concrete intent sentence into an enum or global table.

Use vocabulary/table values only for repeatable classifications:

| Category                    | Examples                                                                       |
| --------------------------- | ------------------------------------------------------------------------------ |
| node type                   | requirement, work, test, evidence, acceptance, task                            |
| edge type                   | preserves-intent, verifies, derives-from, fallback-for, blocks-retirement      |
| intent kind                 | ux-acceptance, non-goal, compatibility-retention, rollback-fallback            |
| risk kind                   | behavior-regression, fallback-loss, evidence-loss, compatibility-confusion     |
| evidence/source signal kind | acceptance, evidence, compatibility, fallback, contract, docs, tests, code     |
| confidence                  | user-confirmed, contract-derived, history-derived, recovered, inferred         |
| enforcement                 | validation-evidence, review-required, advisory, non-enforcing                  |
| artifact/source role        | graph-source, projection, compatibility-fallback-reference, generated-evidence |
| lifecycle status            | active, retained, deprecated-candidate, retirement-pending, blocked            |

Use a short project-specific `claim` on the edge for the concrete intent:

```json
{
  "edgeType": "preserves-intent",
  "intentKind": "ux-acceptance",
  "riskKind": "behavior-regression",
  "claim": "empty search restores the full list after clearing a query",
  "confidence": "user-confirmed",
  "enforcement": "validation-evidence"
}
```

The `claim` is intentionally not global vocabulary. It is the compact, human-readable project sentence that prevents
maintenance intent loss.

## Native And Retrofit

Native PBE and retrofit PBE use the same edge-intent model.

The difference is input signal origin and confidence:

| Flow         | Signal origins                                                                             | Typical confidence                   |
| ------------ | ------------------------------------------------------------------------------------------ | ------------------------------------ |
| native PBE   | RPD, WPD, VD, Acceptance, Non-goal, Evidence, Cycle/Node Execution Contract                | user-confirmed, contract-derived     |
| retrofit PBE | code, tests, docs, compatibility artifacts, fallback records, history-derived observations | history-derived, recovered, inferred |

Do not create separate native/retrofit branching logic just to model intent. Normalize both into the same edge annotation
shape.

## Read-Model Projection

Future compact graph forms may use IDs/codes for the repeatable vocabulary. Read-models should expand those codes into
human-readable vocabulary labels and preserve the project-specific `claim`.

Projection should make intent inspectable, but it must not replace user acceptance, create enforcement, retire
tree-native artifacts, or expand source authority.

The first fixture projection surface is intentionally small:

- `examples/internal-legacy/intent-critical/native-pbe-maintenance/generated/edge-intent-read-model-projection.json`
- `examples/internal-legacy/intent-critical/retrofit-pbe-maintenance/generated/edge-intent-read-model-projection.json`

Each projection keeps classification fields (`edgeType`, `intentKind`, `riskKind`, `confidence`, `enforcement`, and
anchor signal kinds) as vocabulary-style values while preserving `claim` as short project-specific text.

The projection can now be regenerated with:

```bash
node dist/cli/index.js graph read-model project-intent --graph-source <path> --output <path> --json
```

This command is intentionally separate from broad `validate --all` semantics.

Local projection health can be summarized with:

```bash
node dist/cli/index.js graph read-model report-intent --json
```

The report covers the native and retrofit fixtures, returns `intent-report-pass` or `intent-report-blocked`, and reports
fixture count, edgeIntent count, claim count, classification count, anchor count, missing classification count, and
missing anchor count. It remains local validation Evidence and is not a required check.

The non-enforcing read-model Evidence workflow now runs the same command for the native and retrofit fixtures as
report-only CI observation. The uploaded artifact bundle includes the regenerated projection files and command outputs,
and the CI manifest records `edgeIntentProjectionObservationStatus`. This visibility does not enroll intent projection
in broad `validate --all` enforcement.

## Fixture Alignment

The current fixture alignment is:

- `examples/internal-legacy/intent-critical/native-pbe-maintenance/graph-source-intent.json`
- `examples/internal-legacy/intent-critical/retrofit-pbe-maintenance/graph-source-intent.json`

Both fixtures use `edgeIntent` with:

- `edgeType`
- `intentKind`
- `riskKind`
- `claim`
- `confidence`
- `enforcement`
- `anchors`

Both fixture projections expose the same fields under `edgeIntentProjections` for human-readable read-model review.

Focused tests verify that native and retrofit examples use the same edge-intent shape while differing by signal
origin/confidence, and that the `project-intent` CLI preserves committed projection shape.

## Non-Scope

This design does not implement:

- broad graph schema enforcement
- required checks or branch protection
- CI enforcement
- tree-native retirement
- repo-wide source authority expansion
- a separate intent ledger as source
