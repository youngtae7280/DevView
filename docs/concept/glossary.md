# Concept Glossary

Terms are classified as `canonical`, `legacy`, `compatibility`, `deprecated`, or `superseded`.

## Canonical Terms

| Term                    | Status    | Meaning                                                                                                                              |
| ----------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Product Tree            | canonical | Source of product truth: intent, behavior, constraints, UX decisions, acceptance criteria, and product non-scope.                    |
| Project Tree            | canonical | Derived architecture and ownership structure for modules, surfaces, boundaries, dependencies, and integration responsibilities.      |
| Work Tree               | canonical | Executable work nodes derived from Product and Project nodes.                                                                        |
| Test Tree               | canonical | Verification nodes that prove Product and Work nodes and declare required evidence.                                                  |
| Cycle Tree              | canonical | Selected implementation slice packaged into Cycle and Node Execution Contracts.                                                      |
| Change Tree             | canonical | Product, scope, UX, risk, acceptance, or verification changes discovered during review or execution.                                 |
| Impact Tree             | canonical | Affected Product, Project, Work, Test, Evidence, Cycle, and Acceptance nodes that must be stale, invalidated, or reopened.           |
| Evidence Tree           | canonical | Test results, logs, diffs, screenshots, manual notes, and other proof linked to nodes and criteria.                                  |
| Acceptance Tree         | canonical | User-controlled closure state for product branches or slices.                                                                        |
| Cycle Contract          | canonical | Contract for one selected implementation slice, including included scope, non-scope, tests, evidence, and stop conditions.           |
| Node Execution Contract | canonical | Contract for a single executable Work node, including source nodes, files, dependencies, tests, evidence, and rules.                 |
| Visual Design Contract  | canonical | Visual source, tokens, component rules, state coverage, evidence requirements, and waiver/not-required decisions for visual UI work. |
| Maintainability Graph   | canonical | Current canonical read model / alignment model over tree-native artifacts and long-term target source model candidate.               |
| View Tree Pack          | canonical | Conceptual projection pack that lets Codex read selected tree views without treating compatibility views as product truth.           |
| Approval Brief          | canonical | User-facing judgment surface for interpreted intent, result, verification, remaining judgment, and approval choice.                  |
| Human Gate              | canonical | Control mechanism used when PBE needs human judgment, authority, risk acceptance, or intent confirmation before safe progress.       |
| Check                   | canonical | Verification obligation: a condition, question, criterion, or judgment item that must be verified.                                   |
| Evidence                | canonical | Observable artifact showing that a Check was performed or satisfied; AI self-report alone is not Evidence.                           |
| Evidence Exception      | canonical | Visible record that required Evidence is absent or insufficient, including reason, residual risk, user judgment, and later remedy.   |
| Evidence Freshness      | canonical | Whether Evidence still supports the linked Check after the current change, impact, scope, or acceptance shift.                       |

## Transition Terms

| Term                        | Status    | Meaning                                                                                                                                                |
| --------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Transition Stance           | canonical | The documented position that current plugin behavior remains tree-native while Maintainability Graph is the long-term source model target.             |
| Operational Source Of Truth | canonical | The artifact structure that currently governs actual plugin behavior. In the current plugin, this is the tree-native artifact structure.               |
| Canonical Read Model        | canonical | A stable conceptual model used to align, inspect, and reason over current artifacts without yet replacing them.                                        |
| Target Source Model         | canonical | The intended future source model after explicit promotion approval.                                                                                    |
| Graph-Source Promotion      | canonical | The future transition where Maintainability Graph becomes the source model and tree-native artifacts become projections, compatibility, or view files. |

## Approval Brief Terms

| Term                 | Status    | Meaning                                                                                                                            |
| -------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Approval Brief State | canonical | The user-facing approval situation: Ready for approval, Review with warning, Decision required, or Blocked.                        |
| Approval Action      | canonical | The user choice available in the brief: Approve this step, Request revision, Resolve required item, or Defer approval.             |
| Ready for approval   | canonical | State where required checks have sufficient fresh evidence or no check applies, and no required user judgment or blocker remains.  |
| Review with warning  | canonical | State where result may be approvable but a visible low-risk warning, explicit low-risk exception, or non-blocking unknown remains. |
| Decision required    | canonical | State where approval or progress requires a user answer, choice, confirmation, or risk acceptance.                                 |
| Blocked              | canonical | State where PBE cannot safely continue or present the result as approvable until a blocker is resolved or reframed.                |
| Trace Detail         | canonical | Trigger-scoped trace shown only for high-risk triggers or explicit user requests; it must not become a full Graph dump.            |
| Remaining judgment   | canonical | The visible assumptions, unknowns, risks, conflicts, Human Gate reasons, and accepted or deferred risks that affect user judgment. |
| Verification summary | canonical | Approval Brief section that summarizes required Checks, Evidence status, exceptions, and remaining verification judgment.          |

## Compatibility Terms

| Term                          | Status        | Canonical Reading                                                                              |
| ----------------------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| RPD                           | compatibility | Product Tree growth.                                                                           |
| WPD                           | compatibility | Project Tree and Work Tree derivation.                                                         |
| VD                            | compatibility | Test Tree derivation.                                                                          |
| ACEP                          | compatibility | Cycle Contract and Node Execution Contract packaging, plus compatibility execution-pack files. |
| Revision                      | compatibility | Change Tree, Impact Tree, and Reopen protocol.                                                 |
| AI Context Pack               | compatibility | Shorthand for the context portion of Execution Contract packaging.                             |
| Task card                     | compatibility | Human-friendly execution view that must reference a Node Execution Contract when one exists.   |
| `.pbe/blueprint/*`            | compatibility | Backward-compatible views for tree-native source artifacts.                                    |
| `.pbe/codex-execution-pack/*` | compatibility | ACEP package view for Codex execution.                                                         |

## Legacy, Deprecated, And Superseded Terms

| Term                                   | Status     | Canonical Reading                                                                                  |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| 5 Layer                                | legacy     | Legacy explanatory frame. It is not the active architecture baseline.                              |
| Knowledge Graph                        | legacy     | Older or generic phrase for the traceability idea now narrowed to Maintainability Graph.           |
| GUI                                    | superseded | PBE does not pursue a GUI product direction unless the user explicitly changes product direction.  |
| SaaS backend                           | superseded | PBE does not pursue a SaaS backend direction unless the user explicitly changes product direction. |
| API provider                           | superseded | PBE does not provide a separate OpenAI API provider.                                               |
| Direct task execution from user prompt | deprecated | Product and work must pass through Product, Project, Work, Test, Cycle, and contract derivation.   |

## Conditional Term Mapping

Some older documents may use canonical terms as projection labels rather than source artifacts. Read them carefully:

| Older Usage                                | Interpretation                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Product Tree used as a UI or analysis view | Treat as an Intent / Flow View or compatibility projection unless the file is a tree artifact. |
| Work Tree used as task-card grouping       | Treat as a Work View or View Tree Pack source unless it refers to `.pbe/tree/work-tree.json`.  |
| AI Context Pack used as execution input    | Treat as Execution Contract context shorthand.                                                 |

If a new canonical term seems necessary but does not have a basis in existing docs or the work instruction, record it as
an open question instead of adding it here.
