# Evidence Quality Rubric

## Purpose

Evidence should prove that the linked Test and Acceptance Criteria are satisfied. Fresh evidence is not always good
evidence. Evidence must prove the linked Test / AC, not just say that work was done.

Use this rubric during ACEP execution and review when evidence quality is uncertain, contested, or too vague for a
reviewer to judge pass/fail.

## Freshness vs Quality

Freshness means the evidence was produced after the relevant implementation or revision. Quality means the evidence
shows the observable result that the Test and AC require.

Fresh but weak evidence can still block acceptance. A timestamp, status, or link is useful metadata, but it is not proof
by itself unless the evidence content shows what happened, under which input or condition, and what result was observed.

## Weak Evidence Smells

Weak evidence often looks like:

- "확인함"
- "테스트 통과"
- "문제 없음"
- "검색 기능 동작 확인"
- "UI 괜찮음"

These are weak because:

- it is unclear which Test they prove
- it is unclear which AC observable result they support
- there is no command output, screenshot, doc excerpt, or manual result
- there is no input, condition, or result
- a reviewer cannot re-check the claim
- timestamp/status/link metadata alone can still be weak if the evidence content is vague

## Good Evidence Requirements

Good evidence should:

- link to the Test it proves
- link to the AC or observable result it supports
- include observable output, screenshot, doc excerpt, or manual result
- match the evidence type to the work type
- include relevant input, condition, and result where applicable
- be specific enough for a reviewer to judge pass/fail
- identify known limitations, skipped checks, or `manual_not_verified` blockers

## Evidence Strength Levels

### Weak

- says only that something was checked, passed, or looks good
- has no command output, screenshot, doc excerpt, or manual result
- does not actually prove the linked Test / AC
- leaves the reviewer unsure what to inspect

### Acceptable

- links to the relevant Test / AC
- uses an evidence type that matches the work type
- includes command output, screenshot, doc excerpt, or manual result
- connects to the Test passCriteria

### Strong

- directly shows the AC observable result
- separates positive, negative, empty, error, or other needed cases
- includes concrete command output, screenshot, or doc excerpt
- has clear timestamp/status/link metadata when required
- lets a reviewer judge pass/fail from the evidence alone

## Evidence Type Matching

UI work:

- screenshot
- manual visual review result
- before/after screenshot when relevant

CLI behavior:

- command output
- exit code
- relevant stdout/stderr excerpt

Documentation work:

- doc excerpt
- changed section reference
- rendered markdown check if relevant

API behavior:

- request/response log
- status code
- payload excerpt

Hardware/environment-limited work:

- manual hardware log
- mock/fake result
- `manual_not_verified` blocker with reason

## AC / Test / Evidence Chain

The proof chain is:

```text
Product AC observableResult
-> Test scenario / passCriteria
-> Evidence artifact
-> Review / Acceptance
```

Evidence is weak when it skips the middle of the chain and only claims that the work was completed.

## UI Evidence

UI evidence should show the user-visible result, not only that UI files changed. Prefer screenshots or manual visual
results that identify the state being reviewed. For search, filtering, empty states, dialogs, or permissions, capture
the relevant state instead of a generic page screenshot.

## CLI Evidence

CLI evidence should include the command, exit result when relevant, and the output lines that prove the expected
behavior. Avoid only saying "tests passed" when the pass criteria require a specific test case.

## Documentation Evidence

Documentation evidence should cite the changed section and include a short excerpt that proves the required wording or
instruction exists. A file path alone is weaker than a section reference plus excerpt.

## Manual / Hardware Evidence

Manual or hardware-limited evidence should describe what was checked, what device/environment was used, and what result
was observed. If real hardware is unavailable, record the mock/fake/manual result or a `manual_not_verified` blocker
with the reason.

## Examples

### Weak Evidence

```text
검색 기능 동작 확인
```

This does not say which query was used, which rows were expected, which Test was linked, or what the reviewer should
inspect.

### Strong UI Evidence

AC:

```text
When the user enters "milk", only Todo titles containing "milk" shall remain visible.
```

Test:

```text
T-SEARCH-001 verifies title filtering by query.
```

Evidence:

- Screenshot: `search-query-milk-visible-rows.png`
- Manual result: Buy milk and Milk tea recipe are visible; Read book is hidden.
- Timestamp: `2026-06-13T00:00:00.000Z`
- Linked test: `T-SEARCH-001`

### Strong CLI Evidence

Command:

```powershell
npm.cmd test -- search.test.ts
```

Output:

```text
PASS filters todos by title
PASS empty query shows all todos
PASS no matching query shows empty state
```

### Strong Documentation Evidence

Changed section:

```text
docs/install.md > Recommended Local Verification
```

Excerpt:

```text
Run these commands sequentially. Do not start validate:pbe and test:examples in parallel on Windows...
```

## Future Validator Candidates

These are candidates only. Do not promote them directly to hard validator failures until dogfooding shows repeated,
deterministic failures with low false-positive risk.

- `EVIDENCE_TOO_VAGUE`
- `EVIDENCE_TYPE_MISMATCH`
- `EVIDENCE_OUTPUT_MISSING`
- `EVIDENCE_AC_LINK_WEAK`
- `EVIDENCE_REVIEWABILITY_WEAK`
- `EVIDENCE_MANUAL_NOT_VERIFIED_REASON_MISSING`
