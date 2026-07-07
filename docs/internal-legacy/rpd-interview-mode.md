# RPD Interview Mode

RPD Interview Mode helps a user turn a rough product request into a Product Tree candidate without asking the user to
write the Product Tree by hand.

The operating rule is: structure a rough request generously, but do not confirm product meaning without the user.

## Principles

- The user does not need to write Product Tree nodes directly.
- PBE/Codex drafts Product Tree candidates from the raw request.
- Draft Product Tree candidates are not confirmed Product nodes.
- Ambiguous wording is recorded as ambiguity, risk, or a missing decision instead of being silently implemented.
- Ask only the single highest-impact question when a human decision is needed.
- If the request is already clear enough, summarize it and ask for confirmation instead of running a long interview.
- Product Tree confirmation still requires explicit user confirmation and `pbe rpd close`.
- If `pbe rpd close` fails, follow the reported `suggestedFix` and `nextCommand`.
- Product meaning changes after RPD should go through Change/Impact/Revision and, when Product Tree changes are needed,
  Product Patch Proposal.

## Question Priority

When more than one question is possible, ask the highest-impact one only:

1. Scope decision
2. Risky product meaning decision
3. Acceptance or verification decision
4. UI/UX direction decision
5. Edge, error, or permission state decision

## Draft Response Shape

An RPD interview response should usually include:

- Raw request summary
- Draft Product Tree candidate
- Suggested first slice
- Ambiguity or missing decisions
- Risks
- Recommended single question
- Confirmation needed
- Next CLI command, usually `pbe rpd check`

Use [RPD Interview Summary Template](../templates/rpd-interview-summary-template.md) for a durable summary when useful.

## Example

User request:

```text
관리자 페이지 좀 쓸만하게 만들어줘. 회원 관리랑 검색도 있으면 좋겠어.
```

PBE response example:

```text
Draft Product Tree Candidate:
1. 관리자는 회원 목록을 볼 수 있어야 한다.
2. 관리자는 회원을 이름 또는 이메일로 검색할 수 있어야 한다.
3. 관리자는 회원 상태를 확인할 수 있어야 한다.

Suggested first slice:
회원 목록 + 검색

Ambiguity:
- "쓸만하게"의 기준이 불명확합니다.
- 상태 변경이 이번 범위인지 확인이 필요합니다.
- 삭제 기능이 포함되는지 확인이 필요합니다.

Recommended single question:
이번 첫 slice에 회원 상태 변경도 포함할까요?
1. 포함
2. 제외
3. 나중에
```

The candidate above is draft product meaning. It should not be marked `confirmed` until the user confirms the meaning.
After artifacts are updated, run `pbe rpd check`, then close RPD only with `pbe rpd close`.
