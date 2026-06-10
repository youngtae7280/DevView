# Next Slice Decision Gate Message Template

```text
[PBE 상태 보고]

현재 단계:
- state: WAITING_NEXT_SLICE_DECISION
- currentGate: next_slice_decision
- nextStep: next_slice_decision

방금 완료한 작업:
- Review Result approved for the current slice.

생성/갱신된 산출물:
- .pbe/review/result-summary.md
- .pbe/review/user-review-checklist.md
- .pbe/blueprint/pbe-state.json

검증:
- {validation_summary}

왜 멈췄는가:
- 현재 slice만 완료할지, 다음 slice를 시작할지, 전체 프로젝트를 완료할지 사용자가 결정해야 합니다.

다음 동작:
- 선택에 따라 SLICE_ACCEPTED, WAITING_IMPLEMENTATION_SCOPE, 또는 COMPLETED로 이동합니다.

사용자가 답할 수 있는 말:
- 현재 slice 완료: "현재 slice만 완료 처리해주세요"
- 다음 slice 시작: "다음 slice를 시작해주세요"
- 전체 완료: "프로젝트 전체 완료 처리해주세요"
- 수정: "이 부분은 수정하고 다시 검토해주세요"
- 중단: "중단해주세요"

추천 답변:
"현재 slice만 완료 처리해주세요"
```

```text
[Codex 메모]

{next_slice_reasoning}
```
