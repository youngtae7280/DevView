# Change, Impact, and Reopen Protocol

No silent blueprint edits during execution.

## Change Node triggers

Create a Change Node when a discovery or feedback changes product meaning, scope, UX, risk, acceptance, verification, or completed work.

## Impact Tree

Impact Tree records affected Product, Project, Work, Test, Evidence, UI/UX, and Acceptance nodes.

## Reopen states

```text
implemented -> stale
verified -> invalidated
accepted_done -> reopened
evidence_attached -> stale_evidence
```

## Revision

Revision tasks may touch only affected/reopened nodes unless the user approves a new mutation.
