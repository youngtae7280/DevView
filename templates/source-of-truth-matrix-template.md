# DevView Source of Truth Matrix

| Artifact                | Owns                                              | Derived From                                                    | Must Not Decide                            |
| ----------------------- | ------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------ |
| product-intake          | user intent, requirement meaning, ambiguity       | user input                                                      | files, classes, tasks, validation commands |
| Scope Classification    | selected/deferred/foundation/blocked/out-of-scope | user scope decision, product-intake                             | code design                                |
| Dependency Impact Audit | future module impact classification               | scope classification, product-intake hints, work-planning hints | implementation details                     |
| work-planning           | module boundary, code responsibility, WorkGraph   | product-intake, scope classification                            | final execution status                     |
| verification-design     | verification design                               | product-intake, work-planning, scope classification             | implementation order                       |
| Execution Planner       | phases, task order, parallel groups               | work-planning, verification-design, scope classification        | user intent                                |
| execution-pack          | executable task cards                             | execution planner                                               | scope changes                              |
| Coverage Audit          | coverage status                                   | requirements, tasks, verification, evidence                     | new requirements                           |
| UX Audit                | UI/UX coverage status                             | UI/UX confirmation, verification-design, evidence               | new UX direction                           |
| Review Result           | actual outcome                                    | code diff, validation, audits                                   | new scope decisions                        |
| Revision Pack           | delta repair plan                                 | user feedback, review result                                    | full re-planning unless requested          |
