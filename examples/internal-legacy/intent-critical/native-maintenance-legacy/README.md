# Native DevView Intent-Critical Maintenance Example

This fixture shows a native DevView slice where the maintenance-critical intent is captured from the start in a graph-source
intent artifact.

The example is intentionally small. It does not implement an app. It records the kind of intent that prevents
vibe-coding maintenance from changing behavior just because a simpler implementation looks convenient.

## Maintenance Risk

A future maintainer might simplify empty-search behavior to show no results because that is common in search UIs. The
original product intent is the opposite: an empty query must preserve the full Todo list so users can clear search
without losing context.

## Graph-Source Intent Record

- `graph-source-intent.json`

The record captures:

- UX / acceptance intent
- non-goal boundary
- fallback reason
- evidence reason
- compatibility note

This is a native DevView example: the intent is recorded before maintenance work begins.
