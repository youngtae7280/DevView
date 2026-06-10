# Stage Completion Status Card Template

Use this after any PBE deterministic stage completes.

```text
[PBE 상태 보고]

현재 단계:
- state: {autoflow.state}
- currentGate: {autoflow.currentGate}
- nextStep: {autoflow.nextStep}

방금 완료한 작업:
- {stage_name}: {stage_result}

생성/갱신된 산출물:
- {artifact_path}

검증:
- {validation_summary}

왜 멈췄는가:
- {if_gate: "사람의 판단이 필요한 gate에 도착했습니다."}
- {if_auto: "멈추지 않습니다. 다음 자동 단계로 이어집니다."}
- {if_blocked: "자동 진행 중 blocker가 발생했습니다."}

다음 동작:
- {next_action}

사용자가 답할 수 있는 말:
- 승인/진행: "{approval_example}"
- 수정: "{revision_example}"
- 질문: "{question_example}"
- 중단: "중단해주세요"

추천 답변:
"{recommended_reply}"
```

```text
[Codex 메모]

{optional_rationale}
```
