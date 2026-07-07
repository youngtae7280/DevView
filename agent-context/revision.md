# Revision Context

Use when:

- User feedback requires bounded changes after review.
- Existing evidence or acceptance may be invalidated.
- The requested change affects already reviewed or accepted behavior.

Do:

- Record what changed, why it changed, and what prior proof is invalidated.
- Check whether product meaning changed before implementation.
- Replace affected evidence instead of reusing stale proof.
- Mark affected acceptance as needing re-review without deleting history.
- Work only inside affected selected or foundation scope.

Do not:

- Modify accepted branches quietly.
- Skip impact analysis.
- Use old evidence or old acceptance as current closure after affected revision.
- Let Codex accept the result for the user.

Escalate when:

- Affected nodes are unclear.
- Product meaning, acceptance criteria, or verification strategy changes.
- Revision scope may spill outside the original impact.
