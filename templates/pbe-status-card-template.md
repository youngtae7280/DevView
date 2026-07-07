# DevView Status Card Template

Use this card only for DevView stage completion, human gate arrival, failure, and status requests.

Do not use this card for ordinary AI answers that are not changing or reporting DevView workflow state.

Place this card before any free-form explanation.

```text
[DevView status report]

?占쎌옱 ?占쎄퀎:
- state: {autoflow.state}
- currentGate: {autoflow.currentGate}
- nextStep: {autoflow.nextStep}

諛⑷툑 ?占쎈즺???占쎌뾽:
- {completed_work_summary}

?占쎌꽦/媛깆떊???占쎌텧占?
- {artifact_path}

寃占?
- {validation_result}

??硫덉톬?占쏙옙?:
- {stop_reason_or_not_stopped}

?占쎌쓬 ?占쎌옉:
- {automatic_or_gate_next_action}

?占쎌슜?占쏙옙? ?占쏀븷 ???占쎈뒗 占?
- ?占쎌씤/吏꾪뻾: "{approval_example}"
- ?占쎌젙: "{revision_example}"
- 吏덈Ц: "{question_example}"
- 以묐떒: "以묐떒?占쎌＜?占쎌슂"

Recommended reply:
"{recommended_reply}"
```

Use this optional section only when explanation or reasoning is helpful:

```text
[Codex memo]

{short_explanation_or_rationale}
```

## Rules

- Keep `[DevView status report]` factual and structured.
- Put recommendations, tradeoffs, and rationale in `[Codex memo]`.
- If a deterministic step will continue automatically, say that under `?占쎌쓬 ?占쎌옉`.
- If a human gate is active, say why DevView stopped under `??硫덉톬?占쏙옙?`.
- Always include one recommended reply when a human gate is active.
- Do not mix internal command names with user-facing choices unless the user explicitly asks for commands.
