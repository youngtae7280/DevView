# Retrofit DevView Intent-Critical Maintenance Example

This fixture shows a retrofit DevView scenario where existing artifacts describe behavior, but the original maintenance
intent must be recovered and recorded before AI-assisted changes.

The example is intentionally small. It is a graph-source intent fixture, not an app implementation.

## Maintenance Risk

A legacy workflow exposes a compatibility export that appears redundant with the current graph/read-model view. A future
maintainer might delete it during cleanup. The recovered intent says the export is retained for rollback and external
audit compatibility until a separate retirement decision is approved.

## Graph-Source Intent Record

- `graph-source-intent.json`

The record captures:

- recovered compatibility intent
- rollback/fallback reason
- non-goal boundary
- evidence reason
- explicit retirement guardrail

This is a retrofit DevView example: the intent is reconstructed from existing artifacts before maintenance changes proceed.
