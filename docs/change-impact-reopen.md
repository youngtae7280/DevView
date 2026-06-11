# Change, Impact, and Reopen Protocol

No silent blueprint edits during execution.

## Change Node triggers

Create a Change Node when a discovery or feedback changes product meaning, scope, UX, risk, acceptance, verification, or completed work.

If the change contains ambiguous product meaning or abstract quality language, mark `requiresRevisionRpd: true` and resolve it through Ambiguity Gate before creating implementation tasks.

## Impact Tree

Impact Tree records affected Product, Project, Work, Test, Evidence, UI/UX, and Acceptance nodes.

When acceptance criteria change, Impact Tree also records `affectedAcceptanceCriteriaIds` and whether impacted tests or evidence must be refreshed.

## Reopen states

```text
implemented -> stale
verified -> invalidated
accepted_done -> reopened
evidence_attached -> stale_evidence
```

## Revision

Revision tasks may touch only affected/reopened nodes unless the user approves a new mutation.

Revision RPD may update only the affected Change Node's Product/Acceptance Criteria scope. It is not permission to rewrite the whole blueprint.
