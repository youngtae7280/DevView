# Review Failure Recovery

## Purpose

Repeated rejection is not an implementation problem until proven otherwise. It is an alignment problem first.

This guide prevents blind revision loops when the user repeatedly rejects the same area or says the direction is wrong.
Use existing Change, Impact, Product Patch, and Revision flow. Do not add a new Tree, State, CLI command, or validator.

## When This Applies

Use this guidance when:

- the same Product node or Work node is rejected two or more times
- the user says "아니야", "아직도 별로야", "방향이 틀렸어", or "감을 못 잡네"
- UI/UX or taste feedback repeats
- a revision was performed but the user repeats the same kind of dissatisfaction

## What Not To Do

- Do not immediately start another revision after repeated rejection.
- Do not blindly say "조금 더 고쳐보겠습니다" and iterate again.
- Do not reduce "별로다" to a small implementation bug without diagnosis.
- Do not handle Product meaning changes by directly editing `product-tree.json`.
- Do not create a new `alignment-failure-tree` or `review-diagnostic-tree`.

## Failure Types

### Product Meaning Mismatch

- Description: The delivered behavior does not match what the user meant.
- Example feedback: "검색은 제목뿐 아니라 메모 내용에서도 되어야 해."
- Recovery action: Product Patch Proposal.
- Flow: `pbe change create` -> `pbe impact analyze` -> `pbe product patch propose` -> user confirmation ->
  `pbe product patch apply` -> revision.

### Acceptance Criteria Too Vague

- Description: The AC allowed implementation that technically passed but did not satisfy the user's judgment.
- Example feedback: "테스트는 통과했는데 내가 원하는 결과가 아니야."
- Recovery action: clarify AC before revision.
- Flow: Change/Impact notes -> RPD/AC clarification -> Revision.

### UI/UX Taste Mismatch

- Description: The user repeatedly dislikes look, feel, density, tone, or interaction direction.
- Example feedback: "계속 별로야. 내가 원하는 깔끔함이 아니야."
- Recovery action: reference realignment.
- Flow: Change/Impact notes -> ask for reference/current disliked result/design constraints -> Revision.

### Missing Reference

- Description: The work depends on visual, behavioral, or product reference that was never captured.
- Example feedback: "이런 느낌이 아니라고 했잖아."
- Recovery action: capture one reference or explicit anti-reference before revision.
- Flow: Change/Impact notes -> reference realignment -> Revision.

### Scope Too Large

- Description: The slice is too broad, causing repeated unsatisfying partial fixes.
- Example feedback: "전체적으로 다 어설퍼."
- Recovery action: scope reduction.
- Flow: Change/Impact notes -> choose smaller slice -> WPD/VD/ACEP closure.

### Implementation Bug

- Description: Product meaning and AC are aligned, but the implementation is wrong.
- Example feedback: "검색어를 지우면 전체 목록이 안 돌아와."
- Recovery action: bounded implementation fix.
- Flow: `pbe change create` -> `pbe impact analyze` -> `pbe revision start` -> fix -> `pbe revision complete`.

### Technical Constraint Mismatch

- Description: The implementation is constrained by environment, platform, API, hardware, or dependency limits the user
  did not expect.
- Example feedback: "왜 실제 장비에서는 확인이 안 된 거야?"
- Recovery action: technical constraint review.
- Flow: Change/Impact notes -> clarify constraint/evidence plan -> Revision or defer.

### Verification Mismatch

- Description: Evidence proves the wrong thing or does not prove the user's acceptance concern.
- Example feedback: "테스트 결과 말고 화면에서 되는 걸 보여줘."
- Recovery action: update verification strategy and evidence requirements.
- Flow: Change/Impact notes -> VD clarification -> Revision.

## Recovery Modes

- `clarify_requirement`: refine Product meaning or AC before another revision.
- `reference_realignment`: capture reference, screenshot, disliked result, or design constraints.
- `scope_reduction`: shrink the next recovery slice.
- `product_patch_required`: Product Tree meaning needs before/after proposal and user confirmation.
- `implementation_fix`: bounded fix after alignment is clear.
- `technical_constraint_review`: explain environment/hardware/API constraints before retry.
- `human_override_constraint`: record explicit user constraint without inventing a new artifact family.

## Review Diagnostic Summary

Before another revision, summarize:

- trigger
- repeated signals
- affected Product/Work/Test
- failure type
- why blind revision is risky
- suspected causes
- recovery mode
- single recovery question
- Change/Impact notes
- whether Product Patch is needed
- whether reference or scope reduction is needed
- human override constraints
- next CLI command

Use [Review Diagnostic Template](../templates/review-diagnostic-template.md).

## Change / Impact Integration

Record diagnostic context in Change/Impact notes rather than creating a new diagnostic Tree.

Recommended flow:

```bash
pbe change create --summary "<user dissatisfaction or alignment issue>"
pbe impact analyze --change CH-001
```

After diagnosis, continue through the existing Revision flow only when alignment is clear enough to bound the work.

## Product Patch Integration

Use Product Patch Proposal when any of these change:

- AC changes
- user-visible behavior changes
- scope boundary changes
- verification criteria change
- Product Tree meaning changes

Flow:

```bash
pbe product patch propose --change CH-001 --product PT-001 --operation update_acceptance_criteria --summary "<meaning change>"
```

Apply only after explicit user confirmation, then re-enter Impact/Revision and downstream closure.

## Reference Realignment

If the user repeatedly says "깔끔하지 않아", ask for one of:

- preferred screenshot/reference
- disliked current screenshot
- design constraints
- examples of what to avoid
- theme/tone direction

Ask one recovery question at a time. Do not request a whole design brief unless the user wants to provide one.

## Scope Reduction

If the request is too broad, propose a smaller recovery slice:

- only search input layout
- only member table row density
- only empty state
- only primary action button placement

Scope reduction should preserve the user's dissatisfaction while making the next revision reviewable.

## Human Override Constraints

Do not create a new Tree for override constraints. Record them in Change/Impact notes or Product/Work constraints.

Examples:

- "Do not use cards in this admin table."
- "Keep this page dense; no marketing-style hero."
- "No destructive action in this slice."

## Examples

Product meaning mismatch:

```text
User: 검색은 제목뿐 아니라 메모 내용에서도 되어야 해.
Recovery: Product Patch Proposal before another revision.
```

UI/UX taste mismatch:

```text
User: 계속 별로야. 내가 원하는 깔끔함이 아니야.
Recovery question: 지금 결과에서 싫은 화면 부분 하나를 캡처 기준으로 지정해 주실 수 있나요?
```

Scope too large:

```text
User: 전체적으로 다 어설퍼.
Recovery question: 다음 recovery slice를 회원 테이블 row density만으로 줄일까요?
```

## Future Command / Validator Candidates

These are future candidates only. Do not implement them until dogfooding shows repeated deterministic failures with low
false-positive risk.

- `pbe review diagnose`
- `pbe realign start`
- `pbe realign complete`
- `REVIEW_REPEATED_REJECTION_DIAGNOSTIC_REQUIRED`
- `REVIEW_BLIND_REVISION_RISK`
- `REVIEW_REFERENCE_REQUIRED`
- `REVIEW_SCOPE_REDUCTION_RECOMMENDED`
