# Second Bounded Maintenance Dogfood

Status: completed / fixture-wording maintenance / non-enforcing

## Requested Change

Run a second small Graph-source PBE dogfood pass with a real fixture wording change, then prove the
`project-intent` -> `report-intent` -> health -> E2E chain stays healthy.

Selected maintenance change:

- fixture: `examples/internal-legacy/intent-critical/retrofit-pbe-maintenance/graph-source-intent.json`
- field: `intentRecords[0].edgeIntent.claim`
- old claim: `compatibility export stays until explicit retirement approval`
- new claim: `compatibility export remains until explicit retirement approval and replacement evidence`

The change makes the replacement-evidence boundary visible in the short edgeIntent claim. It does not alter the
maintenance scenario, intent kind, risk kind, anchors, enforcement mode, source authority boundary, or retirement status.

## Graph Context And edgeIntent Used

The retrofit fixture represents a cleanup temptation: a maintainer sees a graph-source projection with the same visible
fields and wants to delete the compatibility export as duplicate.

The graph-source context kept the maintenance task bounded:

- `intentKind`: `compatibility-retention`
- `riskKind`: `fallback-loss`
- `confidence`: `history-derived`
- `enforcement`: `review-required`
- anchors: `legacy compatibility export` and `rollback/audit review history`
- boundary: projection exposes maintenance intent for review, but does not approve compatibility retirement.

## Expected Delta

Expected changed values:

- source fixture claim
- generated edgeIntent projection claim
- generated `humanReadableSummary`
- docs that quote the claim

Expected unchanged values:

- `sourceIntentRecordId`
- `edgeType`
- `intentKind`
- `riskKind`
- `confidence`
- `enforcement`
- anchors
- projection and validation status
- non-enforcement, required-check, and retirement boundaries

## Actual Delta

`graph read-model project-intent` regenerated the retrofit projection successfully:

```bash
node dist/cli/index.js graph read-model project-intent --graph-source examples/internal-legacy/intent-critical/retrofit-pbe-maintenance/graph-source-intent.json --output examples/internal-legacy/intent-critical/retrofit-pbe-maintenance/generated/edge-intent-read-model-projection.json --json
```

Observed projection result:

- status: `intent-projection-pass`
- projected intents: `1`
- claim: `compatibility export remains until explicit retirement approval and replacement evidence`
- anchors: unchanged at `2`
- enforcement: unchanged at `review-required`
- projection boundary: unchanged; no enforcement or compatibility retirement approval.

## Validation Chain

Commands run after the wording change:

```bash
npm run build:cli
node dist/cli/index.js graph read-model project-intent --graph-source examples/internal-legacy/intent-critical/retrofit-pbe-maintenance/graph-source-intent.json --output examples/internal-legacy/intent-critical/retrofit-pbe-maintenance/generated/edge-intent-read-model-projection.json --json
node dist/cli/index.js graph read-model report-intent --graph-source examples/internal-legacy/intent-critical/retrofit-pbe-maintenance/graph-source-intent.json --json
node dist/cli/index.js graph read-model report-intent --json
node dist/cli/index.js graph read-model report-health --json
node dist/cli/index.js graph read-model validate --all --json
npm run test:read-model:e2e
npx vitest run cli/src/__tests__/intent-critical-examples.test.ts
```

Expected passing signals:

- retrofit-only `report-intent`: `intent-report-pass`, `1` edgeIntent, `1` claim, `6` classifications, `2` anchors.
- overall `report-intent`: `intent-report-pass`, `2` edgeIntents, `2` claims, `12` classifications, `4` anchors.
- `report-health`: `graph-source-health-pass`, edgeIntent `intent-report-pass`, `non-enforcing`.
- `validate --all`: `aggregate-pass`; this remains local Evidence and not enforcement.
- `test:read-model:e2e`: `e2e-smoke-pass`; intent report remains separated from validate-all.
- focused intent-critical tests: projection and report tests pass with the new claim text.

## Why Behavior Did Not Change

This was a wording maintenance change to a graph-source intent fixture and its generated projection. It clarified the
short claim, but did not change application code, generated read-model authority, source promotion, required checks,
branch protection, acceptance, or tree-retirement readiness.

The useful dogfood result is that the graph-source fixture and generated projection changed together, while the
validation/report chain confirmed the same anchors and boundaries still hold.
