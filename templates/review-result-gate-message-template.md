# Review Result Gate Message Template

```text
[DevView status report]

?占쎌옱 ?占쎄퀎:
- state: WAITING_REVIEW_RESULT
- currentGate: review_result
- nextStep: review_result

諛⑷툑 ?占쎈즺???占쎌뾽:
- execution-pack ?占쎈뒗 Revision ?占쏀뻾 寃곌낵占?寃?占쎌슜?占쎈줈 ?占쎈━?占쎌뒿?占쎈떎.
- Codex??寃곌낵占?submitted_for_review ?占쏀깭占??占쎌텧?占쎌뒿?占쎈떎.
- accepted / accepted_done?占??占쎌슜?占쎈쭔 占????占쎌뒿?占쎈떎.

?占쎌꽦/媛깆떊???占쎌텧占?
- .devview/review/codex-final-report.md
- .devview/review/result-summary.md
- .devview/review/validation-results.md
- .devview/review/coverage-result.md
- .devview/review/ui-ux-evidence.md
- .devview/review/user-review-checklist.md
- .devview/control/acceptance-tree.json
- .devview/control/impact-tree.json
- .devview/evidence/evidence-tree.json

寃占?
- {validation_summary}

?占쎌씤???占쎌슜:
- ?占쏀뻾 寃곌낵
- ?占쏀뙣???占쎌뒪??耳?占쎌뒪
- coverage audit 寃곌낵
- UX audit 寃곌낵
- Evidence Tree 諛섏쁺 ?占쏀깭
- Impact/Reopen ?占쏀깭
- ?占쏙옙? 由ъ뒪??- ?占쎌떎?占쎌씠 ?占쎌슂????占쏙옙

?占쎌쓬 ?占쎌옉:
- ?占쎌씤?占쎈㈃ Acceptance Tree???占쎌슜???占쎌씤 湲곕줉???占쎄린占?Next Slice Decision gate占??占쎈룞?占쎈땲??
- ?占쎌젙 ?占쎌껌???占쎌쑝占?feedback mapping -> Change Tree -> Impact Tree -> revision pack -> revision run ?占쎌꽌占?吏꾪뻾?占쎈땲??

?占쎌슜?占쏙옙? ?占쏀븷 ???占쎈뒗 占?
- ?占쎌씤: "寃곌낵 愿쒖갖?占쎈땲??, "?占쎌씤?占쎈땲??, "??slice???占쎈즺?占쎈룄 ?占쎈땲??
- ?占쎌젙: "?占쏀뙣??耳?占쎌뒪占??占쎌젙?占쎌꽌 ?占쎌떆 ?占쏀뻾?占쎌＜?占쎌슂"
- 吏덈Ц: "?占쎈즺?占쎈룄 ?占쎈뒗 ?占쏀깭?占쏙옙? ?占쎈떒?占쎌＜?占쎌슂"
- 以묐떒: "以묐떒?占쎌＜?占쎌슂"

Recommended reply:
"寃곌낵 愿쒖갖?占쎈땲?? ?占쎌쓬 ?占쎄퀎占?吏꾪뻾?占쎌＜?占쎌슂"
```

```text
[Codex memo]

寃?占쏀븷 ?占쎈뒗 passing ?占쏙옙?占?蹂댐옙? 留먭퀬, included Product/Work/Test node媛 evidence?占??占쎄껐?占쎌뼱 ?占쎈뒗吏 ?占쎌씤?占쎌꽭??
Impact Tree??reopened, invalidated, stale ??占쏙옙???占쎌븘 ?占쎌쑝占??占쎌씤 ?占??revision???占쎌껌?占쎈뒗 寃껋씠 ?占쎌쟾?占쎈땲??
```
