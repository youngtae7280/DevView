# Actual Representative Runtime Feasibility Demo Result

Status: strengthened manual Evidence pack / review result

## 1. Title / Date / Commit

| Field                          | Value                                                                 |
| ------------------------------ | --------------------------------------------------------------------- |
| Date                           | 2026-06-24                                                            |
| Repo path                      | `C:\Users\ytkim\Desktop\kyt_work\Project Blueprint Engine Plugin`     |
| Original demo basis commit     | `8948db79f3acb331c13bed7ecfb78e2a71d4231c`                            |
| Evidence strengthening basis   | `88e8f4b4650c8da0694d809cfe3b313b3fe26a99`                            |
| Compatibility supplement basis | `6fa469ca68317e7719b37a63f68dbb1c574a1a53`                            |
| Selected slice                 | `Todo Search Adoption + Product Meaning Feedback`                     |
| Result type                    | Manual Evidence pack and review result, not generated artifact design |

This result is not Graph-source promotion. It does not change source authority, promote Maintainability Graph to current
source, retire tree-native artifacts, implement runtime behavior, define schemas, implement validators, or create
migration/rollback mechanics.

Tree-native artifacts remain the current operational source of truth until a later promotion readiness review and
explicit user approval.

## 2. Selected Slice Summary

Selected representative slice:

```text
Todo Search Adoption + Product Meaning Feedback
```

Original selected scope:

- title-only Todo search

Confirmed revision scope after PP-001:

- title + note/content Todo search
- confirmation source: user approved PP-001 in parent orchestration chat on 2026-06-24
- selected Product node: `PT-SEARCH-001`
- selected Project nodes: `PJ-TODO-LIST-SURFACE`, `PJ-TODO-SEARCH-HELPER`
- selected Work node: `WT-SEARCH-001`
- selected Tests: `TT-SEARCH-001`, `TT-SEARCH-002`, `TT-SEARCH-003`
- selected Evidence: `EV-SEARCH-TEST`, `EV-SEARCH-REVIEW`
- accepted title-only slice: `AT-ROOT`

Observed deferred / non-scope examples:

- tag filter
- date filter
- fuzzy search
- server-side search
- saved search
- note/description search until Product Patch feedback

Confirmed product meaning feedback:

```text
Search should include todo note content.
```

Observed stale/reopen state after confirmation:

- `product-patch-tree.json` confirms expanding the search target from title-only to title + note/content.
- The patch is `confirmed_revision_required`, `requiresUserConfirmation: true`, and `userConfirmed: true`.
- `change-tree.json` records that feedback as `CH-001` with the Decision Control Node resolved.
- `impact-tree.json` classifies affected selected-slice nodes as stale, reopened, missing, or requiring refresh.
- Revised implementation, refreshed runtime Evidence, and renewed Acceptance are not demonstrated.

Supplemental compatibility slice:

```text
ACEP task-card-only authority wording
```

This supplemental slice is used only for the compatibility mismatch path. It does not change the selected Todo Search
product slice, does not clean up public docs, and does not change source authority.

## 3. Demo Source Discovery

Source discovery used observable repository files and command output only.

| Observation                          | Evidence                                                                                                                                                         | Status  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Current source before strengthening  | `git log -1 --oneline` returned `88e8f4b Record representative runtime feasibility demo result`.                                                                 | present |
| Root `.pbe` folder                   | `Test-Path .pbe` returned no root `.pbe` directory in this repository checkout.                                                                                  | present |
| Original slice artifact list         | `examples/adoption/todo-search-slice` contained Product, Work, Test, Evidence, Acceptance, Product Patch, README, and RPD summary snapshots.                     | present |
| Strengthened artifact list           | This update adds Project Tree, Cycle Contract, Node Execution Contract, Change Tree, Impact Tree, Compatibility Review, Approval Brief, and Evidence Exceptions. | present |
| Supplemental compatibility artifacts | `examples/adoption/compatibility-mismatch-slice` records a real ACEP task-card-only wording mismatch and applies compatibility policy.                           | present |
| Source-authority boundary            | New files are marked `demo_support_snapshot`, non-authoritative, or demo-support evidence snapshots.                                                             | present |

Because the repo root has no `.pbe` directory, this demo result does not claim a live project `.pbe` run. It records a
manual feasibility review over public docs, illustrative adoption snapshots, and selected-slice demo-support artifacts.

## 4. Added Selected-Slice Support Artifacts

| Artifact                                                                        | Role                                                             | Source references / derivation note                                                              | Limitation                                                                               |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `examples/adoption/todo-search-slice/project-tree.json`                         | Product -> Project -> Work trace.                                | Derived from Product `PT-SEARCH-001`, Work `WT-SEARCH-001`, README, and tree model docs.         | Manual demo-support snapshot; not CLI generated.                                         |
| `examples/adoption/todo-search-slice/cycle-contract.md`                         | Selected cycle scope and boundary.                               | Uses Product/Project/Work/Test/Evidence/Acceptance snapshots and execution contract docs.        | Manual evidence snapshot; not `pbe acep ready` output.                                   |
| `examples/adoption/todo-search-slice/node-execution-contracts/wt-search-001.md` | Node-level selected/forbidden scope.                             | Uses Work Tree expected/forbidden files, tests, evidence, and confirmed Product Patch scope.     | Does not prove source code exists or commands ran.                                       |
| `examples/adoption/todo-search-slice/change-tree.json`                          | Product meaning feedback as Change node.                         | Derives `CH-001` from confirmed `PP-001`, README, dogfooding docs, and Product Patch policy.     | Does not execute revision work or produce refreshed Evidence.                            |
| `examples/adoption/todo-search-slice/impact-tree.json`                          | Affected node classification for confirmed title + note meaning. | Derives impact from Product Patch, selected node links, and revision docs.                       | Refreshed implementation/test Evidence and renewed Acceptance remain missing.            |
| `examples/adoption/todo-search-slice/compatibility-review.md`                   | Real mismatch check and compatibility path judgment.             | Inspects selected-slice files and Legacy Compatibility Map boundary.                             | Finds no real selected-slice mismatch; supplemental slice covers the real mismatch path. |
| `examples/adoption/todo-search-slice/approval-brief.md`                         | Demo-support user judgment surface.                              | Summarizes strengthened evidence under Approval Brief policy.                                    | Does not accept product results or mutate Acceptance Tree.                               |
| `examples/adoption/todo-search-slice/evidence-exceptions.md`                    | Missing/partial/stale/not-applicable evidence records.           | Uses Evidence Tree, Product Patch, Impact Tree, compatibility review, and Check/Evidence policy. | Exceptions are visible limitations, not proof.                                           |

Supplemental compatibility support artifacts:

| Artifact                                                                                 | Role                                      | Source references / derivation note                                                                             | Limitation                                                                        |
| ---------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `examples/adoption/compatibility-mismatch-slice/README.md`                               | Supplemental compatibility slice summary. | Selects ACEP task-card-only authority wording as the primary real mismatch.                                     | Not a public-doc cleanup or source-authority change.                              |
| `examples/adoption/compatibility-mismatch-slice/source-observations.md`                  | Reviewable source wording table.          | Uses public docs, README, AGENTS, and concept policies as observable references.                                | Does not decide cleanup priority.                                                 |
| `examples/adoption/compatibility-mismatch-slice/compatibility-control-node.md`           | Compatibility Control Node candidate.     | Maps the mismatch to execution authority, source-of-truth clarity, scope verification, and promotion readiness. | Concept-level candidate only; no runtime Control Node implementation.             |
| `examples/adoption/compatibility-mismatch-slice/legacy-compatibility-map-application.md` | Policy application.                       | Applies Legacy Compatibility Map, Execution Contract, Control Node, Superseded Items, and decision-log policy.  | Cleanup remains deferred.                                                         |
| `examples/adoption/compatibility-mismatch-slice/evidence-exceptions.md`                  | Supplemental evidence exception records.  | Records present mismatch evidence, deferred cleanup, selected-slice limitation, and validator/CI exception.     | Exceptions are warning records, not proof of full promotion readiness.            |
| `examples/adoption/compatibility-mismatch-slice/approval-brief.md`                       | User-facing compatibility warning draft.  | Summarizes mismatch evidence under `Review with warning`.                                                       | Does not accept product results, clean up docs, or promote Maintainability Graph. |

## 5. Source References Table

| Source                                                                                   | Observed content / relevant claim                                                                                              | Demo claim supported                                      | Evidence status |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | --------------- |
| `docs/tree-model.md`                                                                     | Defines tree-native Product, Project, Work, Test, Cycle, Change, Impact, Evidence, and Acceptance model.                       | Tree-native artifacts remain current operational model.   | present         |
| `docs/source-of-truth-matrix.md`                                                         | Separates artifact ownership and states artifacts should not decide outside their responsibility.                              | Source authority separation and scope ownership.          | present         |
| `docs/source-of-truth-matrix.md`                                                         | Maps ACEP to executable task cards.                                                                                            | Primary real legacy/canonical mismatch.                   | present         |
| `docs/acep.md`                                                                           | Describes ACEP package and runner around task cards and `11-task-cards/`.                                                      | Supporting task-card-centered wording.                    | present         |
| `docs/parallel-execution.md`                                                             | Includes ACEP Task Cards -> Codex Coding Tasks in the transformation flow.                                                     | Supporting task-card-centered wording.                    | present         |
| `docs/usage.md`                                                                          | Describes ACEP as a contract with task cards plus traceability, evidence, coverage, strategy, and manifest files.              | Compatibility-safe public-doc counterweight.              | present         |
| `README.md`                                                                              | Defines ACEP as Cycle Contract and Node Execution Contract packaging.                                                          | Canonical compatibility reading.                          | present         |
| `AGENTS.md`                                                                              | Defines ACEP compatibility and requires cycle/node contract reading when present.                                              | Current operating instruction.                            | present         |
| `docs/execution-contracts.md`                                                            | Defines Cycle Contract and Node Execution Contract as implementation boundary.                                                 | Contract boundary concept.                                | present         |
| `docs/evidence-and-coverage.md`                                                          | Requires evidence or not-runnable explanation before verification is complete.                                                 | Check/Evidence and exception concept.                     | present         |
| `docs/result-review.md`                                                                  | Defines submitted-for-review output and says Codex must not mark `accepted`.                                                   | Approval and review separation.                           | present         |
| `docs/user-acceptance.md`                                                                | Separates Codex-owned statuses from user-owned `accepted`.                                                                     | Acceptance authority.                                     | present         |
| `docs/change-impact-revision.md`                                                         | Describes Change/Impact/Product Patch/Revision skeleton and evidence/acceptance invalidation.                                  | Stale/reopen and impact handling concept.                 | present         |
| `docs/revision-flow.md`                                                                  | Describes bounded revision with affected nodes, allowed files, forbidden files, and refreshed evidence.                        | Change lifecycle and scope boundary.                      | present         |
| `docs/product-patch-proposals.md`                                                        | Product meaning changes must start from Change node and Product Patch; downstream artifacts are not auto-rewritten.            | Product meaning feedback path and stale downstream proof. | present         |
| `docs/dogfooding-existing-project.md`                                                    | Walks through Todo title search adoption, acceptance, then note-content feedback through Change/Impact/Product Patch/Revision. | Selected slice narrative and stale/reopen pressure.       | present         |
| `docs/golden-scenarios.md`                                                               | Shows selected/deferred/foundation scope and Review/Accept separation for USB/Ethernet.                                        | Scope-boundary calibration, not selected Todo slice.      | partial         |
| `docs/traceability.md`                                                                   | Requires linked requirement, task, verification, and Evidence IDs when artifacts are present.                                  | Traceability rule for selected slice review.              | present         |
| `docs/concept/runtime-feasibility-demonstration.md`                                      | Defines minimum claims and feasibility status labels.                                                                          | Result status basis.                                      | present         |
| `docs/concept/representative-runtime-feasibility-demo.md`                                | Selects Todo Search Adoption + Product Meaning Feedback as primary representative slice.                                       | Slice selection basis.                                    | present         |
| `docs/concept/source-transition-path.md`                                                 | Keeps tree-native source authority until explicit promotion and user approval.                                                 | Non-promotion boundary.                                   | present         |
| `docs/concept/rollback-compatibility-strategy.md`                                        | Defines rollback/compatibility labels as concept labels only.                                                                  | Rollback readiness note.                                  | present         |
| `docs/concept/legacy-compatibility-map.md`                                               | Maps ACEP, task-card, `.pbe/blueprint/*`, and graph terms through compatibility policy.                                        | Compatibility mismatch interpretation.                    | present         |
| `examples/adoption/todo-search-slice/README.md`                                          | Names title-only scope, deferred search variants, flow commands, and post-acceptance note-content feedback path.               | Selected scope, non-scope, change pressure.               | present         |
| `examples/adoption/todo-search-slice/product-tree.json`                                  | Contains confirmed `PT-SEARCH-001` with acceptance criteria `AC-SEARCH-001..003` and title-only assumption.                    | Product intent and acceptance criteria.                   | present         |
| `examples/adoption/todo-search-slice/project-tree.json`                                  | Adds selected-slice Project boundary derived from Product/Work snapshots.                                                      | Product -> Project -> Work trace.                         | present         |
| `examples/adoption/todo-search-slice/work-tree.json`                                     | Contains implemented `WT-SEARCH-001`, expected files, forbidden files, done criteria, and validation hint.                     | Work scope and file boundary.                             | present         |
| `examples/adoption/todo-search-slice/cycle-contract.md`                                  | Adds selected cycle scope, deferred/non-scope, validation, evidence, and stop/change rules.                                    | Cycle Contract boundary.                                  | present         |
| `examples/adoption/todo-search-slice/node-execution-contracts/wt-search-001.md`          | Adds node-level allowed/forbidden files, tests, evidence, freshness rule, and stop conditions.                                 | Node-level execution boundary.                            | present         |
| `examples/adoption/todo-search-slice/test-tree.json`                                     | Contains passed tests linked to Product, Work, acceptance criteria, and Evidence nodes.                                        | Test coverage.                                            | present         |
| `examples/adoption/todo-search-slice/evidence-tree.json`                                 | Contains current test-output and review-note Evidence linked to Product, Work, Test, and criteria.                             | Evidence links and Check/Evidence separation.             | present         |
| `examples/adoption/todo-search-slice/acceptance-tree.json`                               | Contains user `accepted` title-only slice with Evidence/Test/Product/Work links.                                               | Durable user acceptance state.                            | present         |
| `examples/adoption/todo-search-slice/product-patch-tree.json`                            | Records user-confirmed `PP-001` expanding search from title to title + note/content.                                           | Product-meaning decision resolved.                        | present         |
| `examples/adoption/todo-search-slice/change-tree.json`                                   | Records `CH-001` as confirmed revision-required change linked to `PP-001`.                                                     | Change node evidence.                                     | present         |
| `examples/adoption/todo-search-slice/impact-tree.json`                                   | Classifies affected Product/Project/Work/Test/Evidence/Acceptance nodes after `PP-001` confirmation.                           | Impact/stale/reopen evidence.                             | present         |
| `examples/adoption/todo-search-slice/compatibility-review.md`                            | Records no real selected-slice mismatch found; no simulated mismatch treated as proof.                                         | Compatibility honesty.                                    | present         |
| `examples/adoption/todo-search-slice/approval-brief.md`                                  | Summarizes PP-001 confirmation and missing refreshed Evidence under `Blocked`.                                                 | Approval Brief surface.                                   | present         |
| `examples/adoption/todo-search-slice/evidence-exceptions.md`                             | Records fresh command output, screenshot, freshness, compatibility, and generated graph exceptions.                            | Evidence exception visibility.                            | present         |
| `examples/adoption/todo-search-slice/rpd-interview-summary.md`                           | Records rough request, title-only slice, ambiguity, risks, and non-scope candidates.                                           | Minimal clarification and risk context.                   | present         |
| `examples/adoption/compatibility-mismatch-slice/source-observations.md`                  | Records the real ACEP task-card-only mismatch and safer canonical counterweights.                                              | Supplemental compatibility mismatch Evidence.             | present         |
| `examples/adoption/compatibility-mismatch-slice/compatibility-control-node.md`           | Records candidate `CCN-ACEP-TASK-CARD-AUTHORITY-001`.                                                                          | Compatibility Control Node visibility.                    | present         |
| `examples/adoption/compatibility-mismatch-slice/legacy-compatibility-map-application.md` | Applies Legacy Compatibility Map and related policies to the mismatch.                                                         | Canonical mismatch interpretation.                        | present         |
| `examples/adoption/compatibility-mismatch-slice/evidence-exceptions.md`                  | Records deferred cleanup and selected-slice limitation.                                                                        | Evidence exception visibility.                            | present         |
| `examples/adoption/compatibility-mismatch-slice/approval-brief.md`                       | Summarizes the supplemental mismatch path under `Review with warning`.                                                         | Approval Brief compatibility warning.                     | present         |

## 6. Scenario Coverage Matrix

| Scenario                     | Required observation                                                                                                                        | Actual evidence found                                                                                                                     | Feasibility status     | Gap / next action                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| Happy path                   | Selected Product branch traces through Project, Work, Test, Evidence, Approval Brief, and Acceptance.                                       | Product, Project, Work, Cycle/Node Contract, Test, Evidence, Acceptance, and Approval Brief support artifacts exist.                      | demonstrated           | Demo-support artifacts are manual; a future generated/runtime run could strengthen repeatability.          |
| Stale evidence / reopen path | Post-acceptance feedback causes affected nodes to become stale, invalidated, reopened, or refreshed.                                        | Confirmed `PP-001`, Change Tree, and Impact Tree show decision resolved plus reopened Work/Test/Evidence/Acceptance refresh requirements. | partially demonstrated | Confirmation and impact are present; refreshed tests/evidence and renewed acceptance are not demonstrated. |
| Decision required path       | User judgment is required for scope, Product Patch confirmation, risk acceptance, or evidence exception.                                    | `PP-001` confirmation resolves the Product meaning decision; remaining judgment is about missing Evidence and renewed Acceptance timing.  | demonstrated           | Product decision is resolved, but product approval remains blocked by missing refreshed Evidence.          |
| Evidence exception path      | Missing, stale, partial, or exception Evidence is visible and not treated as proof.                                                         | `evidence-exceptions.md` records fresh command, screenshot, freshness, compatibility, and generated graph limitations.                    | demonstrated           | Exceptions still need later remedy if they become promotion-blocking.                                      |
| Compatibility mismatch path  | Legacy/canonical mismatch is interpreted through Legacy Compatibility Map and becomes Control Node candidate only when it affects judgment. | Supplemental compatibility slice records a real ACEP task-card-only mismatch and candidate `CCN-ACEP-TASK-CARD-AUTHORITY-001`.            | demonstrated           | Public-doc cleanup remains deferred; this is supplemental evidence, not Todo Search product behavior.      |
| Scope boundary path          | Out-of-contract discovery or forbidden scope does not silently expand selected work.                                                        | README, Work Tree, Cycle Contract, and Node Execution Contract now bound the approved title + note/content revision scope.                | demonstrated           | Tag/date/fuzzy/server/saved search remain out of scope.                                                    |

## 7. Minimum Feasibility Claim Result

| Minimum claim                                                                                                | Evidence found                                                                                                                                                                      | Feasibility status     | Notes                                                                                                           |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Tree-native artifacts remain current operational source while Maintainability Graph is read/alignment model. | Concept docs and all new support artifacts state non-promotion/source-authority boundaries.                                                                                         | demonstrated           | Manual graph interpretation remains read-only.                                                                  |
| Product intent -> Project/Work/Test/Evidence/Acceptance trace.                                               | Product, Project, Work, Test, Evidence, Acceptance, and support contracts are linked.                                                                                               | demonstrated           | Project trace is now supported by `project-tree.json`.                                                          |
| Cycle Contract / Node Execution Contract boundary.                                                           | `cycle-contract.md` and `node-execution-contracts/wt-search-001.md` record selected/deferred/forbidden scope.                                                                       | demonstrated           | Artifacts are manual demo support, not CLI output.                                                              |
| Check/Evidence separation and Evidence status/freshness/exception.                                           | Test/Evidence trees plus `evidence-exceptions.md` distinguish confirmed decision, stale/partial evidence, missing note/content evidence, and exceptions.                            | demonstrated           | Refreshed runtime Evidence remains missing.                                                                     |
| Approval Brief user judgment surface.                                                                        | `approval-brief.md` summarizes result under `Blocked`.                                                                                                                              | demonstrated           | It blocks renewed Acceptance because refreshed Evidence is missing.                                             |
| Control Node blocker/decision/stale/reopen/compatibility visibility.                                         | Change/Impact/Approval/Evidence exception artifacts and supplemental `compatibility-control-node.md` identify Decision, Evidence, Impact, Compatibility, and Acceptance candidates. | partially demonstrated | Candidates are visible, but no runtime Control Node implementation is created.                                  |
| Legacy Compatibility Map mismatch interpretation.                                                            | Supplemental compatibility slice applies the policy to real ACEP task-card-only wording.                                                                                            | demonstrated           | Public-doc cleanup remains deferred.                                                                            |
| Change Lifecycle affected node stale/invalidated/reopened/closed explanation.                                | `change-tree.json` and `impact-tree.json` classify confirmed affected nodes and required refresh actions.                                                                           | partially demonstrated | Decision is resolved, but revised implementation, refreshed Evidence, and renewed Acceptance are not performed. |

## 8. Maintainability Graph Read / Alignment Interpretation

This is a manual read/alignment interpretation. It does not create a graph artifact and does not change source authority.

### Node Categories Inferred From Existing Docs

| Graph category | Inferred records                                                                  | Evidence status |
| -------------- | --------------------------------------------------------------------------------- | --------------- |
| Product        | `PT-ROOT`, `PT-SEARCH-001`, acceptance criteria `AC-SEARCH-001..003`              | present         |
| Project        | `PJ-ROOT`, `PJ-TODO-LIST-SURFACE`, `PJ-TODO-SEARCH-HELPER`                        | present         |
| Work           | `WT-ROOT`, `WT-SEARCH-001`                                                        | present         |
| Test / Check   | `TT-SEARCH-001`, `TT-SEARCH-002`, `TT-SEARCH-003`, `TT-SEARCH-004`                | present         |
| Evidence       | `EV-SEARCH-TEST`, `EV-SEARCH-REVIEW`, `EV-SEARCH-NOTE-TEST`, `EX-SEARCH-001..007` | present         |
| Acceptance     | `AT-ROOT` reopened; renewed Acceptance is not ready                               | present         |
| Change         | `CH-001` and confirmed `PP-001`                                                   | present         |
| Impact         | `IM-SEARCH-001`                                                                   | present         |
| Decision       | Product Patch confirmation resolved for `PP-001`                                  | present         |
| Compatibility  | `CCN-ACEP-TASK-CARD-AUTHORITY-001` supplemental mismatch candidate                | present         |
| Scope boundary | deferred search variants, forbidden files, Cycle/Node Contract stop rules         | present         |

### Observable Edges / Links

| Link                                                                            | Observable source                                                                                | Status  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------- |
| `PT-ROOT -> PT-SEARCH-001`                                                      | `product-tree.json` parent/children                                                              | present |
| `PT-SEARCH-001 -> PJ-TODO-LIST-SURFACE / PJ-TODO-SEARCH-HELPER`                 | `project-tree.json`                                                                              | present |
| `PJ-TODO-LIST-SURFACE / PJ-TODO-SEARCH-HELPER -> WT-SEARCH-001`                 | `project-tree.json`, Node Execution Contract                                                     | present |
| `PT-SEARCH-001 -> WT-SEARCH-001`                                                | `work-tree.json.derivedFromProductNodeIds` and `product-tree.json.derivedTo`                     | present |
| `WT-SEARCH-001 -> AC-SEARCH-001..003`                                           | `work-tree.json.satisfiesAcceptanceCriteriaIds`                                                  | present |
| `PT-SEARCH-001 / WT-SEARCH-001 -> TT-SEARCH-001..004`                           | `test-tree.json.coversProductNodeIds`, `coversWorkNodeIds`, `coversAcceptanceCriteriaIds`        | present |
| `TT-SEARCH-001..004 -> EV-SEARCH-TEST / EV-SEARCH-REVIEW / EV-SEARCH-NOTE-TEST` | `test-tree.json.evidenceNodeIds` and `evidence-tree.json.provesTestNodeIds`                      | present |
| `EV-SEARCH-* -> AC-SEARCH-*`                                                    | `evidence-tree.json.provesAcceptanceCriteriaIds`                                                 | present |
| `Acceptance -> Product/Work/Test/Evidence`                                      | `acceptance-tree.json` node links                                                                | present |
| `PP-001 -> PT-SEARCH-001`                                                       | `product-patch-tree.json.targetProductNodeId`, `affectedProductNodeIds`, and confirmation fields | present |
| `CH-001 -> PP-001 -> IM-SEARCH-001`                                             | `change-tree.json` and `impact-tree.json`                                                        | present |
| `IM-SEARCH-001 -> affected Work/Test/Evidence/Acceptance`                       | `impact-tree.json.nodeClassifications`                                                           | present |
| `Compatibility mismatch -> Control candidate`                                   | `compatibility-mismatch-slice/compatibility-control-node.md`                                     | present |

### Why This Does Not Change Source Authority

- The interpretation is manual and read-only.
- New artifacts are marked as demo-support snapshots, not operational source.
- No source file was rewritten to a graph model.
- No tree-native artifact was marked superseded.
- No projection, graph file, validator, CLI command, or runtime source model was created.
- Remaining gaps are recorded as warnings, not inferred into `demonstrated` status.

## 9. Check / Evidence Review

| Required Check                                                         | Evidence found                                                                   | Evidence status | Review note                                                                      |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------- |
| Behavior check: title query filters visible todos.                     | `TT-SEARCH-001` and `EV-SEARCH-TEST`.                                            | partial / stale | Supports historical title behavior; partial for revised `AC-SEARCH-001`.         |
| Behavior check: note/content query filters visible todos.              | `TT-SEARCH-004` and `EV-SEARCH-NOTE-TEST`.                                       | missing         | Required after PP-001; no implementation or test output exists.                  |
| Behavior check: empty query restores full list.                        | `TT-SEARCH-002` and `EV-SEARCH-TEST`.                                            | present         | Supports `AC-SEARCH-002`.                                                        |
| Visual / manual check: no-result empty state.                          | `TT-SEARCH-003`, `EV-SEARCH-REVIEW`, `EX-SEARCH-002`.                            | partial         | Human review note exists for title-only behavior; refreshed review is required.  |
| Scope boundary check: tag/date/fuzzy/server/saved search not included. | README, Work Tree, Cycle Contract, Node Execution Contract.                      | present         | Boundaries are reviewable as demo support for title + note/content scope.        |
| Evidence freshness check after note-content feedback.                  | Product Patch, Change Tree, Impact Tree, Evidence Exceptions.                    | stale / missing | Existing title-only Evidence is stale/partial; note/content Evidence is missing. |
| Acceptance check for expanded title + note/content slice.              | Acceptance Tree reopened node links Product/Work/Test/Evidence.                  | blocked         | Renewed Acceptance is not ready because refreshed Evidence is missing.           |
| Product Patch decision check.                                          | `product-patch-tree.json` and `change-tree.json` record user confirmation.       | present         | Decision is resolved; evidence refresh remains pending.                          |
| Contract-boundary check.                                               | Cycle Contract and Node Execution Contract.                                      | present         | Manual demo-support artifacts, not CLI-generated contract output.                |
| Compatibility mismatch check.                                          | Todo Search Compatibility Review plus supplemental compatibility mismatch slice. | present         | Real mismatch is supplemental to Todo Search; cleanup remains deferred.          |
| Generated graph output check.                                          | `EX-SEARCH-005`.                                                                 | exception       | Manual read/alignment only; no generated graph output exists.                    |

AI self-report is not Evidence in this result. Feasibility status is based only on observable source files, command
outputs, linked records, demo-support artifacts, and explicit gap records.

## 10. Approval Brief Draft Summary

The demo-support Approval Brief is now recorded at:

```text
examples/adoption/todo-search-slice/approval-brief.md
```

Draft state label:

```text
Blocked
```

Reason:

- selected-slice evidence is materially stronger
- Product Patch `PP-001` confirmation is present
- stale/reopen tracking is materially stronger
- refreshed note/content runtime Evidence is missing
- renewed Acceptance is blocked
- compatibility mismatch path is now exercised by a supplemental real mismatch and bounded by policy
- public-doc cleanup for that mismatch remains deferred
- fresh product test command output, screenshot evidence, and generated graph output remain exceptions

The brief does not accept product results, close renewed Acceptance, create refreshed Evidence, or promote
Maintainability Graph.

## 11. Control Node Review

No runtime Control Node artifact is created by this result. The following are visible candidates:

| Candidate                            | Evidence                                                                                                             | Suggested status                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Decision Control Node candidate      | `PP-001`, `change-tree.json`, `approval-brief.md` record user confirmation before changing Product meaning.          | Resolved                             |
| Evidence Control Node candidate      | `evidence-exceptions.md` records stale/partial/missing/exception Evidence limits.                                    | Active / Blocked                     |
| Impact Control Node candidate        | `impact-tree.json` classifies affected nodes for confirmed `PP-001`.                                                 | Active until refresh evidence exists |
| Compatibility Control Node candidate | Supplemental `CCN-ACEP-TASK-CARD-AUTHORITY-001` records ACEP task-card-only authority wording as a bounded mismatch. | Active / Review with warning         |
| Acceptance Control Node candidate    | `acceptance-tree.json` and `impact-tree.json` reopen `AT-ROOT` for renewed Acceptance.                               | Waiting for refreshed Evidence       |

## 12. Rollback / Compatibility Readiness Note

Concept labels only:

| Label                      | Scoped meaning for this demo                                                                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rollback-not-needed`      | No source authority was changed during this demo result. No rollback action is needed for this document.                                                                           |
| `compatibility-maintained` | Legacy/compatibility terms remain mapped through Legacy Compatibility Map; no compatibility artifact was retired.                                                                  |
| `rollback-blocked`         | Any future promotion/rollback readiness claim still needs authority/projection strategy, generated/parity expectations, user approval, and unresolved evidence exception handling. |

No rollback, fallback, retirement, migration, or source-authority action was performed.

## 13. Final Feasibility Judgment

Overall demo status:

```text
partially demonstrated
```

Strengthened from prior result:

- Product -> Project -> Work trace is now reviewable.
- Cycle and Node Execution Contract boundaries are now reviewable.
- Change and Impact evidence are now present as selected-slice support artifacts.
- Evidence exceptions are explicit rather than implicit.
- Approval Brief surface is now present as a support artifact.
- Product Patch `PP-001` confirmation is now recorded with user approval source.
- Affected Work/Test/Evidence/Acceptance snapshots are reopened, stale, missing, or blocked as appropriate.
- Todo Search selected-slice compatibility review remains honest: no real mismatch is faked inside that slice.
- Supplemental compatibility mismatch path is now demonstrated with real ACEP task-card-only wording and a Control Node
  candidate.

Remaining blockers / gaps:

1. Refreshed title + note/content implementation, tests, Evidence, and renewed Acceptance do not exist.
2. `EV-SEARCH-NOTE-TEST` is missing, so expanded behavior cannot be accepted.
3. Public-doc cleanup for the observed ACEP task-card-only mismatch remains deferred.
4. Fresh product command output and screenshot evidence are explicit exceptions.
5. Generated graph/read-model output is not present.
6. New artifacts are manual demo-support snapshots, not CLI-generated runtime artifacts.

Promotion blocker:

```text
Graph-source promotion readiness review should not proceed as "ready" from this result alone.
```

Next evidence strengthening should decide:

1. whether to create actual implementation/test Evidence for title + note/content search, or
2. whether renewed Acceptance should stay blocked until a runnable Todo fixture can provide that Evidence, or
3. whether public-doc cleanup for the ACEP task-card-only mismatch is required before promotion readiness review.

## 14. Explicit Non-Promotion Statement

This demo result is not Graph-source promotion.

This demo result does not change source authority.

This demo result does not make Maintainability Graph the current operational source.

This demo result does not supersede Product, Project, Work, Test, Evidence, or Acceptance Trees.

Until a separate promotion readiness review passes and the user explicitly approves promotion, tree-native artifacts
remain the operational source of truth.
