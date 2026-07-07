# Revision Flow

PBE treats dissatisfaction as structured input, not as permission to edit everything nearby.

## Flow

```text
User feedback
  -> Feedback Item
  -> Change Node
  -> Ambiguity Gate
  -> Revision RPD when needed
  -> Acceptance Criteria update
  -> Impact Tree
  -> Revision Pack
  -> Bounded revision execution
  -> Refreshed evidence
  -> Review Result gate
```

## Boundary Rules

Revision work must stay inside affected selected/foundation scope.

Do not rerun full RPD for normal feedback. Run Revision RPD only for the affected Change Node when feedback changes
product meaning, UX, scope, acceptance criteria, verification strategy, or accepted work.

Revision packs should declare:

- affected Product, Project, Work, Test, Evidence, Cycle, and Acceptance nodes
- allowed files
- forbidden files
- stale or reopened evidence
- impacted validation commands
- affected acceptance criteria
- criteria added, modified, or invalidated
- Revision RPD status
- re-review criteria

## Acceptance

Codex may report `revision_verified` or `submitted_for_review`. Only the user may mark the result `accepted`.

See [Revision RPD](revision-rpd.md).
