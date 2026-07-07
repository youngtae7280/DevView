# Stage Completion Status Card Template

Use this after any DevView deterministic stage completes.

```text
[DevView status report]

?占쎌옱 ?占쎄퀎:
- state: {autoflow.state}
- currentGate: {autoflow.currentGate}
- nextStep: {autoflow.nextStep}

諛⑷툑 ?占쎈즺???占쎌뾽:
- {stage_name}: {stage_result}

?占쎌꽦/媛깆떊???占쎌텧占?
- {artifact_path}

寃占?
- {validation_summary}

??硫덉톬?占쏙옙?:
- {if_gate: "?占쎈엺???占쎈떒???占쎌슂??gate???占쎌갑?占쎌뒿?占쎈떎."}
- {if_auto: "硫덉텛吏 ?占쎌뒿?占쎈떎. ?占쎌쓬 ?占쎈룞 ?占쎄퀎占??占쎌뼱吏묐땲??"}
- {if_blocked: "?占쎈룞 吏꾪뻾 占?blocker媛 諛쒖깮?占쎌뒿?占쎈떎."}

?占쎌쓬 ?占쎌옉:
- {next_action}

?占쎌슜?占쏙옙? ?占쏀븷 ???占쎈뒗 占?
- ?占쎌씤/吏꾪뻾: "{approval_example}"
- ?占쎌젙: "{revision_example}"
- 吏덈Ц: "{question_example}"
- 以묐떒: "以묐떒?占쎌＜?占쎌슂"

Recommended reply:
"{recommended_reply}"
```

```text
[Codex memo]

{optional_rationale}
```
