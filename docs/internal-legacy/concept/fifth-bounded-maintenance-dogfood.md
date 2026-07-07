# Fifth Bounded Maintenance Dogfood

Status: completed / retrofit anchor consistency / non-enforcing

## Requested Change

Run a retrofit PBE maintenance dogfood pass after the claim wording change by clarifying the fallback anchor text.

Selected maintenance change:

- fixture: `examples/internal-legacy/intent-critical/retrofit-maintenance-legacy/graph-source-intent.json`
- field: `intentRecords[0].edgeIntent.anchors[1].artifact`
- old anchor artifact: `rollback/audit review history`
- new anchor artifact: `rollback/audit and replacement-evidence review history`

The change aligns the fallback anchor with the second dogfood claim, which now names replacement evidence explicitly.

## Graph Context And edgeIntent Used

The retrofit fixture represents recovered compatibility intent:

- `intentKind`: `compatibility-retention`
- `riskKind`: `fallback-loss`
- `confidence`: `history-derived`
- `enforcement`: `review-required`
- anchors: compatibility export plus rollback/audit/replacement-evidence review history.
- boundary: projection does not approve compatibility retirement.

## Expected Delta

Expected changed values:

- retrofit source anchor artifact text.
- generated retrofit projection anchor artifact text.

Expected unchanged values:

- claim text from the second dogfood.
- source intent record ID.
- edge type, intent kind, risk kind, confidence, enforcement, and anchor count.
- projection/report status.
- non-enforcement, required-check, and retirement boundaries.

## Actual Delta

`graph read-model project-intent` regenerated the retrofit projection with the clarified fallback anchor. The projection
kept one edgeIntent, one claim, six classifications, and two anchors.

## Why Behavior Did Not Change

This was a wording-only maintenance change to an anchor label. It did not retire compatibility artifacts, alter source
authority, add enforcement, create required checks, change application behavior, or approve tree retirement.
