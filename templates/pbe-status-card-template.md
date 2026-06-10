# PBE Status Card Template

Use this card only for PBE stage completion, human gate arrival, failure, and status requests.

Do not use this card for ordinary AI answers that are not changing or reporting PBE workflow state.

Place this card before any free-form explanation.

```text
[PBE 상태 보고]

현재 단계:
- state: {autoflow.state}
- currentGate: {autoflow.currentGate}
- nextStep: {autoflow.nextStep}

방금 완료한 작업:
- {completed_work_summary}

생성/갱신된 산출물:
- {artifact_path}

검증:
- {validation_result}

왜 멈췄는가:
- {stop_reason_or_not_stopped}

다음 동작:
- {automatic_or_gate_next_action}

사용자가 답할 수 있는 말:
- 승인/진행: "{approval_example}"
- 수정: "{revision_example}"
- 질문: "{question_example}"
- 중단: "중단해주세요"

추천 답변:
"{recommended_reply}"
```

Use this optional section only when explanation or reasoning is helpful:

```text
[Codex 메모]

{short_explanation_or_rationale}
```

## Rules

- Keep `[PBE 상태 보고]` factual and structured.
- Put recommendations, tradeoffs, and rationale in `[Codex 메모]`.
- If a deterministic step will continue automatically, say that under `다음 동작`.
- If a human gate is active, say why PBE stopped under `왜 멈췄는가`.
- Always include one recommended reply when a human gate is active.
- Do not mix internal command names with user-facing choices unless the user explicitly asks for commands.
