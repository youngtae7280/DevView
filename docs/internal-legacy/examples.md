# Examples

## New Project

```text
@project-blueprint-engine start
Project: small inventory tracker with inbound and outbound stock updates.
```

Codex creates `.pbe/blueprint/`, enables Autoflow, starts RPD Tree Walk, and asks one question about the root
requirement only if more information is needed.

## Existing Project Change

```text
@project-blueprint-engine start
Add order cancellation to this project.
```

Codex inspects the repo, writes a project brief, creates a root requirement for the change, enables Autoflow, and starts
Tree Walk.

## Status Card

When PBE reports workflow state, it uses:

```text
[PBE 상태 보고]

현재 단계:
- state: WAITING_IMPLEMENTATION_SCOPE
- currentGate: implementation_scope
- nextStep: implementation_scope

방금 완료한 작업:
- Dependency Impact Audit completed.

왜 멈췄는가:
- 이번 slice 범위를 사용자가 선택해야 합니다.

추천 답변:
"추천 범위로 진행해주세요"

[Codex 메모]

추천 범위는 하드웨어 의존 작업을 미루면서 안전한 foundation을 확보합니다.
```

## Continue Or Check Status

```text
현재 상태를 알려주세요
괜찮습니다. 다음 단계로 진행해주세요
```

Codex reads `.pbe/blueprint/pbe-state.json`, maps the natural language to status or continue, and resumes from the
current Autoflow state.

## Confirm UI/UX

Codex shows one UI/UX preview at a time and asks for confirmation before UI implementation planning.

The user can reply:

```text
승인합니다
프린터 연결 실패 시 재시도 버튼을 추가해주세요
이 UX에서 가장 위험한 부분이 뭔가요?
```

## Generate Work Design

After UI/UX approval, Codex automatically verifies that RPD is complete, then writes `work-design.json`,
`work-graph.json`, and `work-roadmap.md`.

## Generate Verification Design

Codex automatically verifies WPD output, then writes `verification-design.json` and `verification-plan.md`.

## Implementation Scope

After Dependency Impact Audit, PBE stops at Implementation Scope gate.

The user can reply:

```text
추천 범위로 진행해주세요
Ethernet도 이번 범위에 포함해주세요
이 범위에서 가장 위험한 부분이 뭔가요?
```

## Generate ACEP

Codex automatically runs execution planning, coverage audit, UX audit, and ACEP generation, then writes
`.pbe/codex-execution-pack/`.

The generated pack includes traceability matrix, UI/UX spec, evidence checklist, task-card views, completion criteria,
and final coverage check. Task-card views are execution-contract projections, not source authority.

## Run ACEP

Codex automatically reads the execution manifest, follows the operating loop, implements the selected scope through
task-card views, validates, and prepares final review.

Before reporting completion, Codex checks traceability, UI/UX evidence, and final coverage.

## Review Result

Codex prepares `.pbe/review/` and submits the result for user review. It does not mark the result accepted.

The user can reply:

```text
결과 괜찮습니다
실패한 테스트만 수정해서 다시 실행해주세요
완료해도 되는 상태인지 판단해주세요
```

## Revision

At the review gate, the user can say:

```text
실패한 케이스만 수정해서 다시 실행해주세요
```

Codex maps feedback to affected items, creates bounded revision tasks, runs regression checks, and submits for review
again.
