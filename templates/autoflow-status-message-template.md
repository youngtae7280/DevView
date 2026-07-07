# Autoflow Status Message Template

Use this template when the user asks for status, for example:

```text
@project-blueprint-engine status
?占쎌옱 ?占쏀깭占??占쎈젮二쇱꽭???占쎌쓬??占??占쎌빞 ?占쎈굹??
```

```text
[DevView status report]

?占쎌옱 ?占쎄퀎:
- state: {autoflow.state}
- currentGate: {autoflow.currentGate}
- nextStep: {autoflow.nextStep}

?占쎈즺???占쎄퀎:
- {autoflow.completedSteps}

理쒓렐 ?占쎈즺 ?占쎌뾽:
- {last_completed_work}

?占쎌옱 ?占쏙옙??占쎌쑀:
- {waiting_reason}

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

{short_status_explanation}
```
