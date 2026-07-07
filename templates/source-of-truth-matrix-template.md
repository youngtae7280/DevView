# DevView Source of Truth Matrix

| Artifact                | Owns                                              | Derived From                                | Must Not Decide                            |
| ----------------------- | ------------------------------------------------- | ------------------------------------------- | ------------------------------------------ |
| RPD                     | user intent, requirement meaning, ambiguity       | user input                                  | files, classes, tasks, validation commands |
| Scope Classification    | selected/deferred/foundation/blocked/out-of-scope | user scope decision, RPD                    | code design                                |
| Dependency Impact Audit | future module impact classification               | scope classification, RPD hints, WPD hints  | implementation details                     |
| WPD                     | module boundary, code responsibility, WorkGraph   | RPD, scope classification                   | final execution status                     |
| VD                      | verification design                               | RPD, WPD, scope classification              | implementation order                       |
| Execution Planner       | phases, task order, parallel groups               | WPD, VD, scope classification               | user intent                                |
| ACEP                    | executable task cards                             | execution planner                           | scope changes                              |
| Coverage Audit          | coverage status                                   | requirements, tasks, verification, evidence | new requirements                           |
| UX Audit                | UI/UX coverage status                             | UI/UX confirmation, VD, evidence            | new UX direction                           |
| Review Result           | actual outcome                                    | code diff, validation, audits               | new scope decisions                        |
| Revision Pack           | delta repair plan                                 | user feedback, review result                | full re-planning unless requested          |
