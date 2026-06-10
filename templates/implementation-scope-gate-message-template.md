# Implementation Scope Gate Message Template

```text
[PBE 상태 보고]

현재 단계:
- state: WAITING_IMPLEMENTATION_SCOPE
- currentGate: implementation_scope
- nextStep: implementation_scope

방금 완료한 작업:
- Dependency Impact Audit completed.

생성/갱신된 산출물:
- .pbe/blueprint/dependency-impact-audit.md
- .pbe/blueprint/dependency-impact-audit.json
- .pbe/blueprint/pbe-state.json
- .pbe/blueprint/source-of-truth-matrix.md

검증:
- {validation_summary}

왜 멈췄는가:
- 이번 slice에서 구현할 selected scope, 미룰 deferred scope, 필요한 foundation scope를 사용자가 선택해야 합니다.

다음 동작:
- 사용자가 범위를 승인하면 Architecture Runway 확인 또는 Plan Execution으로 이어집니다.

사용자가 답할 수 있는 말:
- 승인/진행: "추천 범위로 진행해주세요"
- 범위 수정: "Ethernet도 이번 범위에 포함해주세요"
- 질문: "이 범위에서 가장 위험한 부분이 뭔가요?"
- 중단: "중단해주세요"

추천 답변:
"추천 범위로 진행해주세요"
```

```text
[Codex 메모]

{recommended_scope_reasoning}
```
