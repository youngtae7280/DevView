# Autoflow Status Message Template

Use this template when the user asks for status, for example:

```text
@project-blueprint-engine status
현재 상태를 알려주세요
다음에 뭘 해야 하나요?
```

```text
[PBE 상태 보고]

현재 단계:
- state: {autoflow.state}
- currentGate: {autoflow.currentGate}
- nextStep: {autoflow.nextStep}

완료된 단계:
- {autoflow.completedSteps}

최근 완료 작업:
- {last_completed_work}

현재 대기 이유:
- {waiting_reason}

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

{short_status_explanation}
```
