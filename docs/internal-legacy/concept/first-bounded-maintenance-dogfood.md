# First Bounded Maintenance Dogfood

Status: completed / report-only / non-enforcing

## Requested Maintenance Task

Use a small Graph-source PBE maintenance scenario to show how read-model, edgeIntent, health, and E2E signals guide a
safe change without changing application behavior.

Selected scenario:

- fixture: `examples/internal-legacy/intent-critical/retrofit-pbe-maintenance/graph-source-intent.json`
- maintenance question: can a compatibility export be removed because the current graph-source projection already shows
  the same visible fields?
- dogfood outcome: no behavior or fixture change. The maintenance decision is to preserve the compatibility export until
  an explicit retirement approval exists.

## Graph-Source Context Used

The retrofit fixture records recovered maintenance intent before cleanup proceeds:

- `maintenanceScenario`: a maintainer removes a compatibility export as duplicate.
- `vibeCodingRisk`: AI-assisted cleanup may delete fallback evidence needed for rollback, audit comparison, or external
  consumers.
- `preservationRule`: compatibility exports must not be retired without explicit retirement decision and replacement
  evidence.
- `nonGoal`: graph-source-backed generation is not permission to delete tree-native or compatibility artifacts.

This made the bounded maintenance task a documentation/evidence decision, not a code cleanup.

## Relevant edgeIntent Signal

Focused command:

```bash
node dist/cli/index.js graph read-model report-intent --graph-source examples/internal-legacy/intent-critical/retrofit-pbe-maintenance/graph-source-intent.json --json
```

Observed signal:

- status: `intent-report-pass`
- projected fixtures: `1`
- edgeIntent count: `1`
- claim: `compatibility export remains until explicit retirement approval and replacement evidence`
- classification count: `6`
- anchors: `2`
- missing classifications: `0`
- missing anchors: `0`
- boundary: report-intent is local validation Evidence only, not a required check or merge gate.

The claim and anchors turned a tempting cleanup into an explicit stop condition: do not remove the export as a duplicate
unless a separate retirement decision changes the product/control meaning.

## Changes Made

This dogfood slice added this report and refreshed generated read-model Evidence metadata through the local
`validate-all` path. It did not change app behavior, graph-source authority, required checks, branch protection, or
tree-retirement status.

## Validation Run

Commands run during the dogfood pass:

```bash
npm run build:cli
node dist/cli/index.js graph read-model report-intent --json
node dist/cli/index.js graph read-model report-intent --graph-source examples/internal-legacy/intent-critical/retrofit-pbe-maintenance/graph-source-intent.json --json
node dist/cli/index.js graph read-model report-health --json --markdown .tmp/dogfood-read-model-health.md
node dist/cli/index.js graph read-model validate --all --json
npm run test:read-model:e2e
npx vitest run cli/src/__tests__/intent-critical-examples.test.ts
```

Observed results:

- overall `report-intent`: `intent-report-pass`, `2` edgeIntents, `2` claims, `12` classifications, `4` anchors.
- retrofit-only `report-intent`: `intent-report-pass`, `1` edgeIntent, `1` claim, `6` classifications, `2` anchors.
- `report-health`: `graph-source-health-pass`, `aggregate-pass`, edgeIntent `intent-report-pass`,
  `retirement-not-ready`, `non-enforcing`.
- `validate --all`: `aggregate-pass`, `2` slices, `0` warnings, `0` blocking issues, `0` decision-required issues.
- `test:read-model:e2e`: `e2e-smoke-pass`, intent report separated from validate-all.
- focused intent-critical test: `6` tests passed.

## What PBE Prevented Or Clarified

PBE prevented treating visible projection parity as cleanup permission. The graph-source/read-model view showed the
compatibility-retention claim, the fallback/audit anchors, and the explicit retirement boundary before any code or
fixture cleanup was attempted.

The maintenance conclusion is intentionally conservative:

- keep the compatibility export;
- record the dogfood evidence;
- require a future retirement decision before deleting fallback/reference artifacts;
- keep health, E2E, report-intent, and validate-all non-enforcing.

## Boundaries

This dogfood report does not approve enforcement, required checks, source-authority expansion, branch protection,
tree-native retirement, or Todo App promotion beyond confirmed structure-only status.
