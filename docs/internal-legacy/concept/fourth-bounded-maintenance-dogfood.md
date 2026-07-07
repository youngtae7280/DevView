# Fourth Bounded Maintenance Dogfood

Status: completed / native fixture wording maintenance / non-enforcing

## Requested Change

Run a native PBE maintenance dogfood pass against the intent-critical fixture.

Selected maintenance change:

- fixture: `examples/internal-legacy/intent-critical/native-pbe-maintenance/graph-source-intent.json`
- field: `intentRecords[0].edgeIntent.claim`
- old claim: `empty search restores the full list after clearing a query`
- new claim: `empty search restores the full list after the query is cleared`

The change makes the clear-search trigger more direct while preserving the acceptance meaning.

## Graph Context And edgeIntent Used

The native fixture represents a product behavior that was captured before maintenance begins:

- `intentKind`: `ux-acceptance`
- `riskKind`: `behavior-regression`
- `confidence`: `user-confirmed`
- `enforcement`: `validation-evidence`
- anchors: `Product Tree acceptance criterion` and `clear-search behavior check`
- boundary: projection exposes maintenance intent for review, but does not replace user acceptance.

## Expected Delta

Expected changed values:

- source fixture claim.
- generated native edgeIntent projection claim.
- generated `humanReadableSummary`.
- docs that quote the claim.

Expected unchanged values:

- source intent record ID.
- edge type, intent kind, risk kind, confidence, enforcement, and anchors.
- projection/report status.
- user-acceptance and non-enforcement boundaries.

## Actual Delta

`graph read-model project-intent` regenerated the native projection with the clearer claim while preserving the same
classifications and anchors.

## Why Behavior Did Not Change

This was a wording-only maintenance change to a graph-source intent fixture and generated projection. It did not alter
Todo search behavior, acceptance criteria, required checks, enforcement, source authority, or tree-retirement readiness.
