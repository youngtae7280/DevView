# Autoflow Failure Message Template

```text
[PBE 상태 보고]

현재 단계:
- state: BLOCKED
- currentGate: null
- nextStep: {failed_step}

방금 완료한 작업:
- Automatic execution stopped before completing {failed_step}.

생성/갱신된 산출물:
- {artifact_paths_or_none}

검증:
- {validation_summary}

왜 멈췄는가:
- {reason}

다음 동작:
- 문제를 수정한 뒤 아래 downstream 단계만 다시 실행합니다: {downstream_steps}

사용자가 답할 수 있는 말:
- 수정: "누락된 요구사항을 ACEP 테스트 케이스에 포함해주세요"
- 재실행: "실패한 테스트만 다시 실행해주세요"
- 질문: "이 실패가 환경 문제인지 확인해주세요"
- 중단: "중단해주세요"

추천 답변:
"이 실패가 환경 문제인지 확인해주세요"
```

```text
[Codex 메모]

사람이 확인할 것:
- 무엇이 실패했는지
- 사람이 수정해야 하는지
- 자동 재시도 가능한지
```
