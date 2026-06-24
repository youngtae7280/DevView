# Concept Glossary

Terms are classified as `canonical`, `active-operational`, `compatibility`, `legacy`, `superseded`, `deprecated`, or
`future-target`.

## Compatibility Status Categories

| Status             | Meaning                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------- |
| canonical          | Preferred current concept term or policy term.                                               |
| active-operational | Current runtime/file authority for plugin behavior.                                          |
| compatibility      | Valid bridge, shorthand, package label, or view when read through canonical policy.          |
| legacy             | Historical or older explanatory language that is not current architecture authority.         |
| superseded         | Replaced direction or framing that should not be revived without explicit product direction. |
| deprecated         | Discouraged behavior or interpretation that conflicts with current safety policy.            |
| future-target      | Long-term architectural target or candidate that is not current operational authority.       |

## Canonical Terms

| Term                    | Status                         | Meaning                                                                                                                              |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Product Tree            | canonical / active-operational | Source of product truth: intent, behavior, constraints, UX decisions, acceptance criteria, and product non-scope.                    |
| Project Tree            | canonical / active-operational | Derived architecture and ownership structure for modules, surfaces, boundaries, dependencies, and integration responsibilities.      |
| Work Tree               | canonical / active-operational | Executable work nodes derived from Product and Project nodes.                                                                        |
| Test Tree               | canonical / active-operational | Verification nodes that prove Product and Work nodes and declare required evidence.                                                  |
| Cycle Tree              | canonical / active-operational | Selected implementation slice packaged into Cycle and Node Execution Contracts.                                                      |
| Change Tree             | canonical / active-operational | Product, scope, UX, risk, acceptance, or verification changes discovered during review or execution.                                 |
| Impact Tree             | canonical / active-operational | Affected Product, Project, Work, Test, Evidence, Cycle, and Acceptance nodes that must be stale, invalidated, or reopened.           |
| Evidence Tree           | canonical / active-operational | Test results, logs, diffs, screenshots, manual notes, and other proof linked to nodes and criteria.                                  |
| Acceptance Tree         | canonical / active-operational | User-controlled closure state for product branches or slices.                                                                        |
| Cycle Contract          | canonical / active-operational | Contract for one selected implementation slice, including included scope, non-scope, tests, evidence, and stop conditions.           |
| Node Execution Contract | canonical / active-operational | Contract for a single executable Work node, including source nodes, files, dependencies, tests, evidence, and rules.                 |
| Visual Design Contract  | canonical / active-operational | Visual source, tokens, component rules, state coverage, evidence requirements, and waiver/not-required decisions for visual UI work. |
| Maintainability Graph   | canonical / future-target      | Current canonical read model / alignment model over tree-native artifacts and long-term target source model candidate.               |
| View Tree Pack          | canonical                      | Conceptual projection pack that lets Codex read selected tree views without treating compatibility views as product truth.           |
| Approval Brief          | canonical                      | User-facing judgment surface for interpreted intent, result, verification, remaining judgment, and approval choice.                  |
| Human Gate              | canonical                      | Control mechanism used when PBE needs human judgment, authority, risk acceptance, or intent confirmation before safe progress.       |
| Check                   | canonical                      | Verification obligation: a condition, question, criterion, or judgment item that must be verified.                                   |
| Evidence                | canonical                      | Observable artifact showing that a Check was performed or satisfied; AI self-report alone is not Evidence.                           |
| Evidence Exception      | canonical                      | Visible record that required Evidence is absent or insufficient, including reason, residual risk, user judgment, and later remedy.   |
| Evidence Freshness      | canonical                      | Whether Evidence still supports the linked Check after the current change, impact, scope, or acceptance shift.                       |
| Control Node            | canonical                      | Control record that tracks user judgment, change control, impact scope, acceptance closure, and block/reopen status.                 |

## Control Node Terms

| Term                       | Status    | Meaning                                                                                                    |
| -------------------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| Decision Control Node      | canonical | Tracks user choice, policy decision, scope decision, risk acceptance, or conflict resolution.              |
| Change Control Node        | canonical | Tracks feedback, drift, or discovery that changes product meaning, scope, UX, risk, acceptance, or checks. |
| Impact Control Node        | canonical | Tracks affected nodes and whether they are unaffected, stale, invalidated, reopened, or reclosed.          |
| Acceptance Control Node    | canonical | Tracks user approval, deferral, rejection, review request, invalidation, renewal, or closure status.       |
| Evidence Control Node      | canonical | Tracks missing, stale, partial, or exception Evidence when it affects warning, decision, block, or remedy. |
| Compatibility Control Node | canonical | Tracks legacy/canonical mismatch, parity gap, migration caveat, or accepted compatibility exception.       |

## Transition Terms

| Term                                    | Status    | Meaning                                                                                                                                                |
| --------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Transition Stance                       | canonical | The documented position that current plugin behavior remains tree-native while Maintainability Graph is the long-term source model target.             |
| Operational Source Of Truth             | canonical | The artifact structure that currently governs actual plugin behavior. In the current plugin, this is the tree-native artifact structure.               |
| Canonical Read Model                    | canonical | A stable conceptual model used to align, inspect, and reason over current artifacts without yet replacing them.                                        |
| Target Source Model                     | canonical | The intended future source model after explicit promotion approval.                                                                                    |
| Graph-Source Promotion                  | canonical | The future transition where Maintainability Graph becomes the source model and tree-native artifacts become projections, compatibility, or view files. |
| Legacy Compatibility Map                | canonical | Transition interpretation policy mapping older terms/artifacts to canonical concepts without runtime migration or Graph-source promotion.              |
| Runtime Feasibility Demonstration       | canonical | Graph-source promotion readiness gate that requires representative observable Evidence before source promotion can be considered.                      |
| Source Transition Path                  | canonical | Concept-level authority transition policy describing prerequisites and invariants before Maintainability Graph can be promoted to source model.        |
| Rollback / Compatibility Strategy       | canonical | Concept-level safety policy defining recovery and compatibility boundaries required before Graph-source promotion can be considered.                   |
| Representative Runtime Feasibility Demo | canonical | Readiness artifact selecting the representative slice and Evidence review criteria before actual runtime feasibility demo execution.                   |
| Actual Runtime Feasibility Demo Result  | canonical | Manual Evidence pack / review result recording observed feasibility Evidence, gaps, and non-promotion status for the selected representative slice.    |
| Graph-source Promotion Readiness Review | canonical | Review report that classifies promotion prerequisites, retained warnings, blockers, and remaining decisions without promoting source authority.        |
| Read-Model Parity Artifact              | canonical | Manual or generated read/alignment Evidence showing graph-style nodes, edges, parity status, warnings, and source-authority boundaries.                |

## Source Transition Terms

| Term                                | Status        | Meaning                                                                                                   |
| ----------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| Current tree-native source          | canonical     | Stage where Product/Project/Work/Test/Evidence/Acceptance Trees remain current operational source.        |
| Graph read-model alignment          | canonical     | Stage where Maintainability Graph explains and cross-checks tree-native artifacts without authority move. |
| Transition candidate                | canonical     | Candidate state where promotion review may be considered after prerequisites are prepared.                |
| Explicit promotion decision         | canonical     | User-approved source authority decision through Approval Brief or equivalent judgment surface.            |
| Graph-source promoted               | future-target | Future state where Maintainability Graph is source model; not current operational state.                  |
| Post-promotion compatibility period | future-target | Future transition period where prior tree-native artifacts may remain as projections or compatibility.    |
| Source authority change             | canonical     | Explicit user-approved change to which artifact/model is treated as operational source.                   |
| Projection                          | canonical     | View derived from a source model; not product truth by itself.                                            |
| Maintained compatibility view       | future-target | Future compatibility artifact kept for transition, review, or rollback after explicit promotion.          |
| Migration boundary                  | canonical     | Concept boundary separating source-authority policy from actual artifact/model migration mechanics.       |

## Rollback / Compatibility Terms

| Term                                 | Status        | Meaning                                                                                                                                |
| ------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| rollback                             | future-target | User-governed recovery concept that returns source authority to a previous safe point after future promotion.                          |
| fallback                             | canonical     | Safe judgment or recovery concept that defers to current operational source or a scoped compatibility view.                            |
| compatibility period                 | future-target | Period after explicit promotion when older artifacts may remain as projections, review aids, or rollback references.                   |
| archival snapshot                    | canonical     | Historical state preserved for rollback, reference, audit, or comparison; not current source authority by default.                     |
| retired artifact                     | canonical     | Artifact no longer used as an active compatibility bridge after explicit cleanup decision.                                             |
| Rollback status: rollback-not-needed | canonical     | Scoped review found no rollback need with Evidence or explicit not-applicable reason.                                                  |
| Rollback status: rollback-ready      | canonical     | Rollback could be performed if approved because authority, snapshots, affected views, and risks are clear.                             |
| Rollback status: rollback-required   | canonical     | Safe progress or approval requires rollback or equivalent user-approved recovery.                                                      |
| Rollback status: rollback-blocked    | canonical     | Rollback is needed or requested, but required Evidence, authority clarity, snapshot, or user decision is missing.                      |
| Rollback status: rollback-complete   | canonical     | User-approved rollback/recovery is complete and source authority, projections, Evidence, Acceptance, and Control Nodes are reviewable. |
| Compatibility status: maintained     | canonical     | A compatibility view remains active as an explicitly marked bridge, projection, review aid, or rollback reference.                     |
| Compatibility status: expiring       | canonical     | A compatibility view is planned for retirement but still has active dependency, review, or unresolved condition.                       |
| Compatibility status: retired        | canonical     | Artifact is no longer an active bridge after explicit cleanup decision and satisfied retirement conditions.                            |

## Runtime Feasibility Terms

| Term                                       | Status    | Meaning                                                                                                         |
| ------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------- |
| Feasibility status: demonstrated           | canonical | Required feasibility claim or scenario has observable Evidence and no unresolved blocker.                       |
| Feasibility status: partially demonstrated | canonical | Some Evidence exists, but coverage, freshness, or scenario breadth is limited.                                  |
| Feasibility status: blocked                | canonical | A required feasibility claim or scenario cannot be judged safely with current artifacts.                        |
| Feasibility status: deferred               | canonical | A claim or scenario is intentionally postponed with reason, risk, and later remedy condition.                   |
| Feasibility status: not-applicable         | canonical | A claim or scenario does not apply to the selected representative feasibility slice.                            |
| Representative slice                       | canonical | Bounded lifecycle slice selected to demonstrate runtime feasibility without proving all PBE behavior.           |
| Demo Evidence review checklist             | canonical | Review criteria for whether a future demo result has observable Evidence and linked records.                    |
| Demo output shape                          | canonical | Concept-level reporting shape for a future demo result; not a generated artifact specification.                 |
| Manual Evidence pack                       | canonical | Reviewable evidence result assembled from observable files, commands, linked records, and explicit gap records. |

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
