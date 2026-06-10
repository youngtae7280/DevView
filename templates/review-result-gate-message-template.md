# Review Result Gate Message Template

```text
[PBE 상태 보고]

현재 단계:
- state: WAITING_REVIEW_RESULT
- currentGate: review_result
- nextStep: review_result

방금 완료한 작업:
- ACEP execution completed and review pack prepared.

생성/갱신된 산출물:
- .pbe/review/codex-final-report.md
- .pbe/review/result-summary.md
- .pbe/review/validation-results.md
- .pbe/review/coverage-result.md
- .pbe/review/ui-ux-evidence.md
- .pbe/review/user-review-checklist.md

검증:
- {validation_summary}

왜 멈췄는가:
- Codex는 결과를 accepted로 표시할 수 없습니다. 사용자가 결과를 검토해야 합니다.

다음 동작:
- 사용자가 승인하면 Next Slice Decision gate로 이동합니다.
- 수정 요청이 있으면 feedback mapping -> revision pack -> revision run으로 이어집니다.

사용자가 답할 수 있는 말:
- 승인/진행: "결과 괜찮습니다"
- 수정: "실패한 케이스만 수정해서 다시 실행해주세요"
- 질문: "완료해도 되는 상태인지 판단해주세요"
- 중단: "중단해주세요"

추천 답변:
"결과 괜찮습니다"
```

```text
[Codex 메모]

검토할 항목:
- 실행 결과
- 실패한 테스트 케이스
- coverage audit 결과
- UX audit 결과
- 남은 리스크
- 재실행이 필요한 항목
```
