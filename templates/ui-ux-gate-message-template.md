# UI/UX Gate Message Template

```text
[PBE 상태 보고]

현재 단계:
- state: WAITING_UI_UX_CONFIRM
- currentGate: ui_ux_confirm
- nextStep: ui_ux_confirm

방금 완료한 작업:
- RPD Tree Walk completed or UI/UX preview generated.

생성/갱신된 산출물:
- .pbe/blueprint/ui-ux-preview.md
- .pbe/blueprint/ui-ux-confirmation.md
- .pbe/blueprint/ui-ux-confirmation-log.md

검증:
- {validation_summary}

왜 멈췄는가:
- UI/UX 방향을 사용자가 확인하기 전에는 구현 계획과 UI 구현을 진행하지 않습니다.

다음 동작:
- UI/UX가 승인되면 WPD -> VD -> Dependency Impact Audit -> Implementation Scope Gate로 이어집니다.

사용자가 답할 수 있는 말:
- 승인/진행: "승인합니다. 계속 진행해주세요"
- 수정: "프린터 연결 실패 시 재시도 버튼을 추가해주세요"
- 질문: "이 UX에서 가장 위험한 부분이 뭔가요?"
- 중단: "중단해주세요"

추천 답변:
"승인합니다. 계속 진행해주세요"
```

```text
[Codex 메모]

검토할 항목:
- 핵심 사용자 흐름
- 화면 구성
- 버튼, 문구, 용어
- empty/loading/success/error/permission 상태
- 예외 상황 처리
```
