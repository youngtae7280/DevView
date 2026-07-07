# Golden Scenarios

## USB Selected, Ethernet Deferred But Required Foundation

1. User starts PBE.
2. RPD is generated.
3. UI/UX confirmation gate opens.
4. User approves UI/UX.
5. WPD and VD are generated.
6. Dependency Impact Audit detects that Ethernet affects the connection architecture.
7. Implementation Scope gate opens.
8. User says: `select scope: implement USB status only; defer Ethernet to the next slice`.
9. USB is selected.
10. Ethernet is deferred.
11. Ethernet impact is classified as Required Foundation.
12. Architecture Runway gate opens.
13. User approves foundation only.
14. WorkGraph and execution plan include selected USB work and foundation interface/stub work.
15. ACEP implements USB.
16. ACEP creates only the Ethernet foundation needed for future compatibility.
17. Ethernet real behavior is not implemented.
18. Coverage passes selected and foundation scope.
19. Deferred Ethernet is not treated as failure.
20. Review separates completed selected scope, completed foundation scope, and deferred scope.
21. Review approval records explicit user approval and moves the reviewed slice to `DONE`.
22. Starting another slice moves back to `WAITING_IMPLEMENTATION_SCOPE`; `DONE` must not be inferred by Codex without
    user approval.

## Required Checks

- Source of Truth Matrix links USB selected scope and Ethernet deferred/foundation scope.
- Foundation Contract states exactly what Ethernet foundation is allowed to create.
- Parallel Safety Contract prevents USB and Ethernet foundation work from running in parallel if they touch shared
  connection files.
- Final Coverage Check does not fail only because Ethernet behavior is deferred.
