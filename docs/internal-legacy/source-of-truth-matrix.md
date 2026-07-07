# PBE Source of Truth Matrix

| Artifact                | Owns                                                                           | Derived From                                | Must Not Decide                            |
| ----------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------ |
| Maintainability Graph   | approved graph-source relationships for explicitly promoted scopes             | user-approved promotion record, PBE trees   | user acceptance, unapproved scopes         |
| RPD                     | user intent, requirement meaning, ambiguity                                    | user input                                  | files, classes, tasks, validation commands |
| Scope Classification    | selected/deferred/foundation/blocked/out-of-scope                              | user scope decision, RPD                    | code design                                |
| Dependency Impact Audit | future module impact classification                                            | scope classification, RPD hints, WPD hints  | implementation details                     |
| WPD                     | module boundary, code responsibility, WorkGraph                                | RPD, scope classification                   | final execution status                     |
| VD                      | verification design                                                            | RPD, WPD, scope classification              | implementation order                       |
| Execution Planner       | phases, task order, parallel groups                                            | WPD, VD, scope classification               | user intent                                |
| ACEP                    | Cycle Contract and Node Execution Contract packaging, manifest, evidence rules | execution planner                           | scope changes                              |
| Coverage Audit          | coverage status                                                                | requirements, tasks, verification, evidence | new requirements                           |
| UX Audit                | UI/UX coverage status                                                          | UI/UX confirmation, VD, evidence            | new UX direction                           |
| Review Result           | actual outcome                                                                 | code diff, validation, audits               | new scope decisions                        |
| Revision Pack           | delta repair plan                                                              | user feedback, review result                | full re-planning unless requested          |

## Rules

- Each artifact owns only its responsibility.
- Duplicate mention of a requirement across artifacts is traceability, not a defect.
- Artifacts should declare `sourceOfTruthFor`, `derivedFrom`, and `mustNotOwn` where practical.
- For explicitly promoted Graph-source scopes, Maintainability Graph is the approved source model for the named scope.
  Tree-native artifacts remain maintained compatibility, fallback, or reference views until retirement is separately
  approved.
- Outside explicitly promoted scopes, the tree-native source-of-truth rules still apply.
- Task cards, when present, are execution or compatibility views inside ACEP packaging. They do not replace Product,
  Work, Test, Evidence, Acceptance, Cycle Contract, or Node Execution Contract authority.

## Example

```json
{
  "artifact": "slice-work-graph.json",
  "sourceOfTruthFor": ["code responsibility", "dependency structure"],
  "derivedFrom": ["requirement-tree.json", "scope-classification.json"],
  "mustNotOwn": ["user intent", "final execution status"]
}
```
