# Revision RPD

Revision RPD is RPD scoped to a Change Node. It exists so feedback during or after implementation does not restart the
whole requirements process.

## Flow

```text
User Feedback
-> Feedback Item
-> Change Node
-> Ambiguity Gate
-> Revision RPD when needed
-> EARS Criteria update
-> Impact Tree
-> Reopen stale/invalidated nodes
-> Revision Pack
-> Run Revision
-> Evidence update
-> Review Result
```

## Rule

Do not rerun full RPD for ordinary revision feedback. Run Revision RPD only for the affected Change Node when feedback
changes product meaning, UX, scope, acceptance criteria, verification strategy, or accepted work.

## Feedback Routing

Simple copy change: usually no Revision RPD. Create Change and Impact entries, then revise.

Clear bug report: usually no Revision RPD. Add or rerun Test Tree coverage.

Ambiguous UX feedback: Revision RPD required. Run Ambiguity Gate and ask one focused question.

New feature request: Revision RPD usually required. Add Product Tree nodes only after confirmation.

Acceptance criteria change: Revision RPD required. Update criteria, Test Tree, Evidence needs, and Impact Tree.

Verification strategy change: Revision RPD may be required when it changes completion meaning.

## Boundary

Revision RPD may update only affected Product nodes and acceptance criteria. Scope expansion still requires the relevant
human gate. Deferred or out-of-scope work must not enter the revision silently.
