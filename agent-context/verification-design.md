# Verification Context

Use when:

- Work items need test or evidence coverage.
- Acceptance criteria need concrete verification.
- UI, visual, evidence, or review closure depends on proof quality.

Do:

- Prove acceptance criteria, not just that tests exist.
- Record scenario, input, precondition, expected result, pass criteria, and required evidence.
- Match evidence type to what the behavior must prove.
- Require screenshot or manual visual evidence for UI states when applicable.

Do not:

- Use generic tests such as "check it works".
- Treat build/open smoke as product acceptance evidence.
- Close verification when selected work lacks meaningful proof.
- Ignore UI states, error states, or exception flows that were selected.

Escalate when:

- Existing tests do not prove user-visible behavior.
- Evidence type is unclear.
- UI or visual state verification is required.
