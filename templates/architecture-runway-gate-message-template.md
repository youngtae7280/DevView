# Architecture Runway Gate Message Template

```text
[PBE 상태 보고]

현재 단계:
- state: WAITING_ARCHITECTURE_RUNWAY_CONFIRM
- currentGate: architecture_runway
- nextStep: architecture_runway

방금 완료한 작업:
- Implementation scope selected.
- Required foundation or high-impact future dependency identified.

생성/갱신된 산출물:
- .pbe/blueprint/foundation-contract.md
- .pbe/blueprint/source-of-truth-matrix.md
- .pbe/blueprint/pbe-state.json

검증:
- {validation_summary}

왜 멈췄는가:
- 현재 구현 전에 필요한 foundation 작업을 사용자가 승인해야 합니다.

다음 동작:
- foundation 승인이 되면 Plan Execution부터 자동 진행합니다.

사용자가 답할 수 있는 말:
- 승인/진행: "구조만 먼저 잡고 진행해주세요"
- 범위 수정: "foundation 없이 선택 범위만 진행해주세요"
- 질문: "foundation을 건너뛰면 어떤 위험이 있나요?"
- 중단: "중단해주세요"

추천 답변:
"구조만 먼저 잡고 진행해주세요"
```

```text
[Codex 메모]

{foundation_reasoning}
```
