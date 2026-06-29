# VD Context

VD is tree-control compatibility context for Test Tree derivation and verification planning. For
Graph-source/read-model source-authority work, treat VD/Test Tree artifacts as compatibility/fallback/reference unless
the configured graph-source registry or a separate approval gives them source-authority role.

Use when:

- Work nodes need Test Tree coverage.
- Acceptance criteria need concrete verification.
- UI, visual, evidence, or review closure depends on test design.

Do:

- Prove acceptance criteria, not just that tests exist.
- Write concrete scenario, input, precondition, expected result, pass criteria, and required evidence.
- Link tests with `verifiesAcceptanceCriteriaIds` when criteria exist.
- Match evidence type to what the test must prove.
- Require screenshot or manual visual evidence for UI states when applicable.

Do not:

- Use generic tests such as "search test" or "check it works".
- Treat build/open smoke as product acceptance evidence.
- Close VD when selected Work lacks meaningful Test coverage.
- Ignore UI states, error states, or exception flows that were selected.

Escalate / read full docs when:

- Test coverage exists but does not prove user-visible behavior.
- Evidence type is unclear.
- UI or visual state verification is required.

Full references:

- [docs/vd-quality-rubric.md](../docs/vd-quality-rubric.md)
- [docs/evidence-quality-rubric.md](../docs/evidence-quality-rubric.md)
