# Ambiguity Taxonomy

## Purpose

Ambiguity is not one thing. RPD should classify ambiguity before asking questions so Codex can ask the highest-impact
question first instead of asking broad questions such as "please clarify the requirement."

Core principles:

- Ambiguity is not one thing.
- Ask the highest-impact question first.
- Record unanswered ambiguity as deferred ambiguity.
- Rubric first, validator later.
- Do not turn natural-language ambiguity judgment into an immediate hard validator failure.

## Why Ambiguity Classification Matters

Different ambiguity types block different parts of PBE:

- Scope ambiguity blocks first-slice selection.
- Behavior ambiguity blocks Product meaning.
- Verification ambiguity blocks Test Tree quality.
- UI/UX ambiguity may be deferrable when it does not affect current acceptance.

Classifying ambiguity helps RPD decide whether to draft, ask, defer, or move to summary and confirmation.

## Ambiguity Types

### Scope Ambiguity

- Definition: The requested screen, feature, user flow, or first slice boundary is unclear.
- Bad user request example: "관리자 페이지 좀 개선해줘."
- Why it matters: RPD cannot decide what is selected, deferred, or out of scope.
- Good single question example: "이번 첫 slice는 회원 목록 + 검색까지만 진행할까요?"
- When to defer: Defer lower-priority modules when the current slice boundary is clear enough.

### Behavior Ambiguity

- Definition: The system response, user action, or expected product behavior is unclear.
- Bad user request example: "검색 좀 되게 해줘."
- Why it matters: Product Tree nodes and acceptance criteria cannot state observable behavior.
- Good single question example: "이번 첫 slice에서 검색 대상은 title만인가요, title + note인가요?"
- When to defer: Defer advanced matching behavior, such as fuzzy search, when basic behavior is confirmed.

### Quality Ambiguity

- Definition: The request uses subjective quality terms without measurable criteria.
- Bad user request example: "좀 더 쓸만하고 깔끔하게 만들어줘."
- Why it matters: Abstract quality cannot become executable scope until translated into observable criteria.
- Good single question example: "이번 slice에서 '쓸만함'은 검색 결과를 더 빨리 찾는 것으로 정의해도 될까요?"
- When to defer: Defer aesthetic polish when functional acceptance is the current blocker.

### Data Ambiguity

- Definition: Required entities, fields, sample data, persistence rules, or data source boundaries are unclear.
- Bad user request example: "회원 정보도 같이 보여줘."
- Why it matters: Data ambiguity changes Product meaning, Work scope, Test fixtures, and privacy risk.
- Good single question example: "회원 목록 첫 slice에는 이름과 이메일만 표시하면 될까요?"
- When to defer: Defer optional fields when the minimum useful data set is confirmed.

### Permission/State Ambiguity

- Definition: Actor permissions, user roles, allowed states, destructive actions, or state transitions are unclear.
- Bad user request example: "관리자가 회원을 정리할 수 있게 해줘."
- Why it matters: Permission and state mistakes can create high-risk product behavior.
- Good single question example: "회원 삭제는 이번 범위에 포함되나요, 아니면 조회/검색만 포함하나요?"
- When to defer: Defer destructive actions or role-policy changes when read-only behavior is enough for the first slice.

### Verification Ambiguity

- Definition: It is unclear how success will be proven or what evidence is required.
- Bad user request example: "검색이 잘 되면 돼."
- Why it matters: VD cannot design Test nodes that prove Acceptance Criteria.
- Good single question example: "성공 판단은 화면에 결과가 보이는 것으로 충분한가요, 테스트 command output도
  필요할까요?"
- When to defer: Defer heavier automation when manual evidence is acceptable for a low-risk documentation or UI slice.

### UI/UX Ambiguity

- Definition: Layout, interaction model, visual priority, responsive behavior, or empty/error state experience is
  unclear.
- Bad user request example: "보기 좋게 바꿔줘."
- Why it matters: UI/UX ambiguity affects screenshots, manual review, and acceptance expectations.
- Good single question example: "이번 slice는 빠르게 찾는 dense admin UI가 우선인가요, 초보자용 guided UI가 우선인가요?"
- When to defer: Defer visual preference questions when Product behavior and acceptance can be confirmed first.

### Technical/Environment Ambiguity

- Definition: Runtime, platform, dependency, hardware, deployment, or environment limits are unclear.
- Bad user request example: "배포에서도 잘 되게 해줘."
- Why it matters: Environment ambiguity can change Work scope and available verification evidence.
- Good single question example: "이번 slice는 로컬 검증까지만 포함하고 배포 환경 검증은 제외할까요?"
- When to defer: Defer environment-specific validation when the current slice is local-only and that is explicit.

## Blocking Vs Deferrable Ambiguity

Blocking ambiguity prevents Product Tree confirmation, first-slice selection, or acceptance criteria from being written.

Deferrable ambiguity should be recorded when it does not block the current slice but may matter later. Do not silently
drop it.

Examples:

- Blocking: "Is deletion included in this slice?" when deletion changes scope and risk.
- Deferrable: "Should search support fuzzy matching?" when the user confirmed exact title search for the first slice.

## Question Priority

Ask the highest-impact question first:

1. Questions that decide this slice's scope.
2. Questions that change Product meaning.
3. Questions that determine verifiability.
4. Risky data, permission, deletion, or payment questions.
5. UI/UX preference questions.
6. Implementation convenience or technical choice questions.

## Good And Bad Questions

Bad:

- 요구사항을 더 자세히 알려주세요.
- 어떤 느낌을 원하시나요?
- 어떻게 만들까요?

Good:

- 이번 첫 slice에서 검색 대상은 title만인가요, title + note인가요?
- 회원 삭제는 이번 범위에 포함되나요?
- 이 작업은 관리자만 가능한 기능인가요?
- 성공 판단은 화면에 결과가 보이는 것으로 충분한가요, 테스트 command output도 필요할까요?

## RPD Interview Usage

Use this flow:

1. Do not ask the user to write the Product Tree directly.
2. Draft a Product Tree candidate first.
3. Classify ambiguity, risk, and missing decisions.
4. Ask only the highest-impact blocking question.
5. Record the remaining unanswered items as deferred ambiguity.
6. If the request is specific enough, skip extra interview turns and move to summary + confirmation.
7. Do not close RPD until ambiguity that blocks Product Tree confirmation is resolved.

## Examples

Rough request:

```text
Todo 목록이 많아지니까 찾기 불편해. 검색 좀 되게 해줘.
```

Draft interpretation:

- Scope: Todo list search for the next slice.
- Behavior ambiguity: search target is unclear.
- Verification ambiguity: evidence type is not yet selected.
- UI/UX ambiguity: empty-state design is not fully specified.

Highest-impact question:

```text
이번 첫 slice에서 검색 대상은 title만인가요, title + note인가요?
```

Deferred ambiguity:

- case sensitivity policy
- fuzzy search
- empty state copy
- server-side search

## Future Validator Candidates

These are future candidates only. Do not implement them until dogfooding shows repeated deterministic failures with low
false-positive risk.

- `RPD_AMBIGUITY_TYPE_MISSING`
- `RPD_BLOCKING_AMBIGUITY_UNRESOLVED`
- `RPD_QUESTION_TOO_BROAD`
- `RPD_DEFERRED_AMBIGUITY_NOT_RECORDED`
