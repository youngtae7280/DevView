# RPD Context

RPD is tree-control compatibility context for Product Tree growth. For Graph-source/read-model source-authority work,
use graph-source concept docs first and treat Product Tree artifacts as compatibility/fallback/reference unless a
separate decision says otherwise.

Use when:

- The task is about user intent, Product Tree growth, ambiguity, or Root confirmation.
- A requirement is still pending, interviewing, ready to confirm, or ambiguous.
- A downstream stage wants to start but Product nodes are not confirmed.

Do:

- Propose a draft Product Tree candidate instead of asking the user to write one.
- Classify ambiguity type before deciding whether to ask more.
- Ask the single most important question.
- For clear requests, propose Root summary and child structure, then ask for confirm, revise, or decompose.
- Require structured acceptance criteria for confirmed executable Product nodes.

Do not:

- Treat a clear request as already user-confirmed.
- Close RPD while unresolved blocking ambiguity remains.
- Convert Product Tree nodes directly into coding tasks.
- Ask broad interview questions when one confirmation question is enough.

Escalate / read full docs when:

- Ambiguity affects scope, UX, risk, acceptance criteria, verification, or existing accepted work.
- The Root node cannot be summarized without assumptions.
- Abstract quality terms remain executable.

Full references:

- [docs/rpd-interview-mode.md](../docs/rpd-interview-mode.md)
- [docs/ambiguity-taxonomy.md](../docs/ambiguity-taxonomy.md)
