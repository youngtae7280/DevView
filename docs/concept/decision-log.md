# Concept Decision Log

This log is the source of truth for confirmed concept decisions in the PBE runtime architecture alignment work.

## Active Decisions

| ID      | Status | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Source                                                                            |
| ------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| DEC-001 | active | PBE is a Codex plugin workflow and tree-based development control system, not a GUI, SaaS backend, daemon, or separate OpenAI API provider.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `README.md`, `docs/core-concepts.md`                                              |
| DEC-002 | active | PBE is optimized for safe, reviewable, staged project construction rather than speed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `README.md`, `AGENTS.md`                                                          |
| DEC-003 | active | The Product Tree is the source of product truth. Lower trees and execution artifacts derive from it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `README.md`, `docs/tree-model.md`                                                 |
| DEC-004 | active | Confirmed executable Product nodes require acceptance criteria or an explicit non-executable reason before downstream execution.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `AGENTS.md`, `docs/core-concepts.md`                                              |
| DEC-005 | active | Project, Work, and Test Trees derive from Product Tree branches; Work Tree nodes are not direct copies of Product nodes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `docs/tree-model.md`, `docs/workflow.md`                                          |
| DEC-006 | active | Cycle Contracts and Node Execution Contracts are the boundary between planning and implementation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `docs/execution-contracts.md`                                                     |
| DEC-007 | active | Codex may submit work for review, but only the user may accept product results.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `docs/tree-model.md`, `docs/evidence-and-coverage.md`                             |
| DEC-008 | active | Feedback or drift that changes product meaning, scope, UX, risk, acceptance, or verification becomes a Change Node and flows through impact analysis.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `docs/change-impact-revision.md`, `docs/workflow.md`                              |
| DEC-009 | active | The deterministic CLI is a file-based gate and state transition layer. It must not become a GUI, MCP server, daemon, or API caller.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `README.md`, `AGENTS.md`                                                          |
| DEC-010 | active | RPD, WPD, VD, ACEP, and Revision remain valid compatibility terms during the tree-native migration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `README.md`, `docs/tree-model.md`                                                 |
| DEC-011 | active | Existing "5 Layer" descriptions are legacy explanatory frames, not the active architecture baseline.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `AGENTS.md`, `docs/concept/glossary.md`                                           |
| DEC-012 | active | Rollback mechanics, compatibility artifact generation, Graph-source promotion, and implementation details remain next-phase candidates. Concept policies through Rollback / Compatibility Strategy and representative demo slice selection are promoted; actual demo result recording is now covered by DEC-023.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Attached v2.1 work instruction; updated by Actual Runtime Feasibility Demo Result |
| DEC-013 | active | Long-term target is to promote Maintainability Graph to the source model, but during the current transition tree-native artifacts remain the operational source of truth.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Transition stance decision                                                        |
| DEC-014 | active | Approval Brief is the user-facing judgment surface for interpreted intent, result, verification, remaining judgment, and approval choice. It does not expose internal graph or execution contract details by default.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Approval Brief policy                                                             |
| DEC-015 | active | Approval Brief state labels are Ready for approval, Review with warning, Decision required, and Blocked; action labels are Approve this step, Request revision, Resolve required item, and Defer approval.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Approval Brief policy                                                             |
| DEC-016 | active | Check and Evidence are separate concepts: Check is the verification obligation, Evidence is observable proof, AI self-report is not Evidence, and Evidence exceptions must be visible rather than treated as proof.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Check/Evidence policy                                                             |
| DEC-017 | active | Control Nodes are control records for user judgment, change control, impact scope, acceptance closure, and block/reopen status. They do not replace Work, Evidence, Approval Brief, Acceptance Tree, or user approval.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Control Node policy                                                               |
| DEC-018 | active | Legacy Compatibility Map is a transition interpretation policy, not a migration script or runtime source promotion. Legacy terms/artifacts may remain compatibility views when mapped and not treated as authority.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Legacy Compatibility Map                                                          |
| DEC-019 | active | Runtime Feasibility Demonstration is a Graph-source promotion readiness gate, not source promotion. Representative feasibility requires observable Evidence and linked records, not AI self-report.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Runtime Feasibility Demonstration                                                 |
| DEC-020 | active | Source Transition Path is a concept-level authority transition policy, not migration or implementation. Graph-source promotion cannot occur silently and requires explicit user approval.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Source Transition Path                                                            |
| DEC-021 | active | Rollback / Compatibility Strategy is a concept-level safety policy required before Graph-source promotion can be considered. Rollback, fallback, and compatibility retirement require visible user judgment, and maintained compatibility views require explicit source-boundary, freshness, projection, and exception markings.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Rollback / Compatibility Strategy work instruction and policy                     |
| DEC-022 | active | Representative Runtime Feasibility Demo slice selection is a readiness artifact before actual demo execution. The selected slice must cover happy path, stale/reopen, evidence exception, decision required, compatibility mismatch, and scope boundary scenarios with observable Evidence criteria; AI self-report is not Evidence.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Representative Runtime Feasibility Demo                                           |
| DEC-023 | active | Actual Representative Runtime Feasibility Demo result records observed feasibility Evidence for the selected slice without promoting Maintainability Graph or changing source authority. Partial or blocked demo status must keep evidence gaps visible rather than treating AI summary as proof.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Actual Runtime Feasibility Demo Result                                            |
| DEC-024 | active | Selected-slice evidence strengthening may add manual demo-support artifacts only when they include source references, derivation notes, limitations, and explicit non-promotion/source-authority boundaries. Such artifacts strengthen feasibility Evidence but do not become runtime source authority.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Representative Demo Evidence Strengthening                                        |
| DEC-025 | active | Supplemental compatibility mismatch Evidence may strengthen the compatibility path when it uses real repository wording and maps it through Legacy Compatibility Map and Control Node policy. Observing such a mismatch does not require immediate public-doc cleanup, does not change source authority, and does not promote Maintainability Graph.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Compatibility Mismatch Supplemental Slice                                         |
| DEC-026 | active | User-confirmed PP-001 resolves the product-meaning decision for the representative Todo Search slice, but it does not by itself provide refreshed implementation/test Evidence or renewed Acceptance. Product Patch confirmation strengthens stale/reopen feasibility only when affected Work, Test, Evidence, Acceptance, and exceptions remain visible.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | PP-001 Confirmation Evidence                                                      |
| DEC-027 | active | Bounded runtime fixture tests can provide representative refreshed Evidence for the selected Todo Search slice when linked to Product, Work, Test, Evidence, command output, and explicit limitations. Passing fixture Evidence does not close renewed Acceptance, implement PBE runtime, change source authority, or promote Maintainability Graph.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Todo Search Runtime Evidence Fixture                                              |
| DEC-028 | active | User-renewed Acceptance for the representative Todo Search demo slice may close the demo-support acceptance branch with retained warnings, but it does not approve Graph-source promotion or change source authority. Retained warnings must be carried into Graph-source Promotion Readiness Review as explicit review items.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Renewed Acceptance For Demo Slice                                                 |
| DEC-029 | active | Graph-source Promotion Readiness Review classifies prerequisites and retained warnings, but it does not promote Maintainability Graph or change source authority. A representative demo may be demonstrated with retained warnings while blockers, warnings, cleanup, and user promotion approval remain separately reviewable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Graph-source Promotion Readiness Review                                           |
| DEC-030 | active | A manual or generated Maintainability Graph read-model parity artifact can resolve the read-model output blocker for a limited pilot promotion decision only when it preserves source links, Node/Edge/Tag parity, warning status, and source-authority boundaries. Resolving that blocker for readiness does not promote Maintainability Graph or change source authority.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Maintainability Graph Read-Model Parity Artifact                                  |
| DEC-031 | active | Limited Pilot Promotion Decision Package is a user judgment surface for a scoped pilot decision. It may package Evidence, warnings, rollback/compatibility boundaries, and choices, but it does not execute promotion, approve full Graph-source promotion, change source authority, replace tree-native artifacts, or let Codex/PBE approve on the user's behalf.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Limited Pilot Promotion Decision Package                                          |
| DEC-032 | active | Graph-first PBE separates durable Nodes, durable Edges, and view-scoped Tags. Nodes are durable targets, Edges carry permanent semantic meaning, and Tags are temporary View Instance roles only; semantic relationships such as implements, verifies, evidences, and reports-on must be represented as Edges rather than Tags.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Graph Node / Edge / Tag Policy                                                    |
| DEC-033 | active | View Tree Pack is a task-scoped projection, not source authority. Its Core Views are Intent, Behavior, Structure, Scope / Execution, Impact, Verification, and Evidence / Acceptance; Scope / Execution View is required so execution boundaries, forbidden scope, and contracts are not buried in Structure or Impact.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | View Tree Pack and Graph Node / Edge / Tag Policy                                 |
| DEC-034 | active | Confidence and freshness/status are separate dimensions. `stale` is not confidence; confidence records support level such as tool-confirmed, user-confirmed, inferred, or low-confidence, while freshness/status records current validity such as fresh, stale, invalidated, or unknown.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Graph Node / Edge / Tag Policy                                                    |
| DEC-035 | active | Existing-project onboarding uses progressive Retrofit Graph Bootstrap rather than complete upfront graph reconstruction. PBE should start with structural anchors, infer behavior cautiously, record findings/unknowns, expand around real tasks, and grow verified graph relationships with Evidence or user judgment.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Retrofit Graph Bootstrap                                                          |
| DEC-036 | active | AI may propose graph updates, but product meaning, acceptance, risk decisions, and source-authority relationships require Evidence or user judgment before confirmation. AI self-report is not Evidence and cannot confirm source promotion, user acceptance, or hidden freshness.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Graph Node / Edge / Tag Policy and Retrofit Graph Bootstrap                       |
| DEC-037 | active | The Todo Search read-model parity artifact is refreshed under the Graph-first Node/Edge/Tag taxonomy for limited pilot review. The refresh adds node kinds, edge types, view-scoped tags, confidence/freshness separation, and 7 Core View coverage without changing source authority or approving promotion.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Todo Search Node/Edge/Tag Parity Refresh                                          |
| DEC-038 | active | The user approved `Approve limited pilot promotion decision` for the Todo Search selected slice only. This approval permits a bounded limited pilot transition record for `examples/adoption/todo-search-slice`, with retained warnings carried forward, but it is not full Graph-source promotion, broad source authority change, generated builder completion, public-doc cleanup, or tree-native artifact retirement.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Limited Pilot Transition Record                                                   |
| DEC-039 | active | Actual scoped limited pilot transition requires an execution plan and explicit execution mode selection. Dry-run / review-only scoped pilot execution does not change source authority, while any scoped source-authority pilot execution requires separate user approval, source boundary definition, rollback/fallback handling, compatibility marking, and Evidence gates.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Scoped Limited Pilot Transition Execution Plan                                    |
| DEC-040 | active | The user selected `Run dry-run / review-only scoped pilot first` for the Todo Search selected slice. The dry-run observation records workflow Evidence without changing source authority and cannot by itself approve scoped source-authority pilot execution, full Graph-source promotion, tree-native artifact retirement, generated builder implementation, or public-doc cleanup.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Dry-Run Scoped Limited Pilot Observation Record                                   |
| DEC-041 | active | The user approved preparation of a scoped source-authority pilot package for the Todo Search selected slice. Preparation approval does not approve actual scoped source-authority execution, full Graph-source promotion, source authority change, tree-native artifact retirement, generated builder implementation, or public-doc cleanup; execution still requires a later explicit user decision.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Scoped Source-Authority Pilot Preparation Package                                 |
| DEC-042 | active | The user requires generated builder / CLI-backed read-model Evidence before actual scoped source-authority pilot execution. This is a prerequisite decision only; it does not approve implementation, CLI command creation, validator/CI work, source authority change, tree-native artifact retirement, or Graph-source promotion.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Generated Read-Model Evidence Requirement                                         |
| DEC-043 | active | The user approved design-first work for CLI-backed read-model Evidence output. This defines command/surface, output artifact, generated/manual comparison, mismatch, status label, and gate expectations without implementing CLI, builder, parser, validator, CI, generated output, source authority change, or Graph-source promotion.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | CLI-Backed Read-Model Evidence Output Design                                      |
| DEC-044 | active | The user approved and Codex implemented a bounded generated read-model Evidence builder for the Todo Search selected slice. The builder can generate read-model Evidence and a generated/manual parity report, but its output is Evidence only and does not approve scoped source-authority execution, change source authority, retire tree-native artifacts, enforce validator/CI gates, clean up public docs, or promote Maintainability Graph.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Bounded Generated Read-Model Evidence Builder                                     |
| DEC-045 | active | The generated/manual freshness warnings from the first bounded Todo Search parity report were reviewed against source artifacts and resolved by correcting generated freshness mapping. The current parity report is `comparison-pass` with zero mismatches, but this warning resolution remains Evidence review only and does not approve scoped source-authority execution or change source authority.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Generated / Manual Parity Warning Resolution                                      |
| DEC-046 | active | The user approved actual scoped source-authority pilot execution for the Todo Search selected slice with generated Evidence and `comparison-pass` parity. The pilot is bounded to `examples/adoption/todo-search-slice`, uses generated read-model Evidence as the bounded Graph-first interpretation record for Node/Edge/Tag review and 7 Core View traversal, preserves tree-native artifacts as fallback/reference, and does not approve full Graph-source promotion, repository-wide source authority change, tree-native retirement, public-doc cleanup, or validator/CI enforcement.                                                                                                                                                                                                                                                                                                                            | Scoped Source-Authority Pilot Execution Record                                    |
| DEC-047 | active | The Todo Search scoped source-authority pilot review passed with retained warnings. Generated interpretation remained bounded to the selected slice, generated/manual parity remained `comparison-pass`, tree-native fallback/reference artifacts remained usable, retained warnings remained visible, and user acceptance authority remained user-controlled. The review does not expand pilot scope, approve full Graph-source promotion, introduce validator/CI enforcement, perform public-doc cleanup, or retire tree-native artifacts.                                                                                                                                                                                                                                                                                                                                                                           | Scoped Source-Authority Pilot Review                                              |
| DEC-048 | active | The Todo Search scoped source-authority pilot remains active under observation with retained warnings. Active observation keeps authority bounded to `examples/adoption/todo-search-slice`, requires parity to remain `comparison-pass`, preserves tree-native fallback/reference artifacts, and defines triggers for re-review, fallback/defer, validator/CI-backed Evidence, public-doc cleanup, or broader promotion review without performing those next-phase actions.                                                                                                                                                                                                                                                                                                                                                                                                                                            | Scoped Source-Authority Pilot Active Observation                                  |
| DEC-049 | active | Validator/CI-backed read-model Evidence is designed as a stronger future Evidence layer before broader execution, enforcement, or full promotion review. The design separates CLI command success, validator-backed Evidence, and CI-backed Evidence; defines scope levels, checks, report artifacts, statuses, and severity labels; and does not implement validation, add CI enforcement, change source authority, expand pilot scope, or make validation pass equivalent to user approval.                                                                                                                                                                                                                                                                                                                                                                                                                          | Validator / CI-Backed Read-Model Evidence Design                                  |
| DEC-050 | active | The user approved and Codex implemented a bounded scoped read-model validator command for the Todo Search selected slice. `pbe graph read-model validate --slice examples/adoption/todo-search-slice` creates validator-backed Evidence reports with `validation-pass` status for the current generated read-model and parity artifacts. This is local scoped Evidence only; it does not add CI workflow or enforcement, expand pilot scope, change source authority, retire tree-native artifacts, clean up public docs, or approve full Graph-source promotion.                                                                                                                                                                                                                                                                                                                                                      | Scoped Read-Model Validator-Backed Evidence                                       |
| DEC-051 | active | The user approved design of CI workflow integration for read-model Evidence. The CI-backed workflow design defines trigger modes, command sequence, artifact outputs, status semantics, waiver boundaries, and scoped-first strategy, but it does not add or modify `.github/workflows`, introduce CI enforcement, expand pilot scope, change source authority, retire tree-native artifacts, clean up public docs, or approve full Graph-source promotion.                                                                                                                                                                                                                                                                                                                                                                                                                                                            | CI-Backed Read-Model Evidence Workflow Design                                     |
| DEC-052 | active | The user approved implementation of a non-enforcing CI workflow for Todo Search read-model Evidence. `.github/workflows/read-model-evidence.yml` adds a manual `workflow_dispatch` workflow that runs the bounded generate, compare, validate, focused test, runtime fixture, and PBE validation commands and uploads read-model Evidence artifacts. It is informational Evidence only and does not add PR/push triggers, required checks, branch protection, CI enforcement, source authority changes, scope expansion, public-doc cleanup, tree-native retirement, or full Graph-source promotion.                                                                                                                                                                                                                                                                                                                   | Non-Enforcing CI Read-Model Evidence Workflow                                     |
| DEC-053 | active | The first attempt to run and review the manual `PBE Read-Model Evidence` workflow was blocked because the local GitHub CLI was not authenticated. No CI-backed run, artifact, or manifest is treated as Evidence by this attempt. A real manual workflow run and uploaded artifact review remain required before claiming reviewed CI-backed Evidence.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | CI-Backed Read-Model Evidence Run Review                                          |
| DEC-054 | active | GitHub Actions run `28151296796` reviewed the non-enforcing manual `PBE Read-Model Evidence` workflow on `main` via `workflow_dispatch`. The uploaded artifact bundle and CI manifest are reviewed as CI-backed Evidence with `ci-evidence-pass`, `validation-pass`, `comparison-pass`, zero warnings/blocking/decision-required counts, retained warning visibility, and explicit non-promotion/source-authority boundaries. This does not add CI enforcement, required checks, PR/push triggers, source authority changes, scope expansion, public-doc cleanup, tree-native retirement, or full Graph-source promotion.                                                                                                                                                                                                                                                                                              | CI-Backed Read-Model Evidence Run Review                                          |
| DEC-055 | active | Multi-slice read-model validation design is Evidence-only. It may define candidate slices, slice profiles, policy levels, and aggregate reporting rules, but it does not implement CLI refactors, add a second generated slice, change CI workflows, introduce enforcement, expand source authority, retire tree-native artifacts, clean up public docs, or approve full Graph-source promotion. `examples/valid/todo-app-pbe-run` is the next structural validation candidate, while `compatibility-mismatch-slice` remains supplemental warning/control Evidence and `examples/invalid/*` remain future negative fixtures.                                                                                                                                                                                                                                                                                           | Multi-Slice Read-Model Validation Design                                          |
| DEC-056 | active | Todo Search read-model assumptions are extracted into an explicit `SliceReadModelConfig` profile without intended behavior change. The extraction preserves the bounded Todo Search generated output, parity, validation, retained warnings, source-authority boundary, and non-promotion semantics; it does not implement a second slice, aggregate validation, CI workflow changes, enforcement, source authority expansion, public-doc cleanup, tree-native retirement, or full Graph-source promotion.                                                                                                                                                                                                                                                                                                                                                                                                             | Todo Search Read-Model Profile Extraction                                         |
| DEC-057 | active | `examples/valid/todo-app-pbe-run` is implemented as a second `SliceReadModelConfig` profile at `structure-only` policy level. The profile reads canonical `.pbe` source inputs and generates/validates structure-only read-model Evidence with 22 nodes, 38 edges, and 16 validation checks. It does not require manual parity, a View Instance Manifest, a scoped pilot marker, runtime fixture Evidence, or CI-backed Evidence; it does not implement aggregation, expand source authority, change CI workflows, enforce validation, clean up public docs, retire `.pbe` artifacts, or approve full Graph-source promotion.                                                                                                                                                                                                                                                                                          | Todo App PBE Run Structure-Only Read-Model Profile                                |
| DEC-058 | active | Per-slice read-model validation reports are self-contained Evidence units before aggregation. Each report records profile, source slice, source layout, policy level, evidence level, expected counts, generated read-model path, parity requirement/status, pilot marker requirement/status, runtime fixture requirement/status, retained warnings, fallback/reference summary, source-authority boundary, non-promotion statement, and a cross-slice dependency rule. This prepares future aggregation but does not implement aggregation, `validate --all`, CI workflow changes, enforcement, source authority expansion, or promotion.                                                                                                                                                                                                                                                                             | Per-Slice Read-Model Validation Report Independence Contract                      |
| DEC-059 | active | The first aggregate read-model Evidence summary is implemented over existing per-slice validation reports only. `pbe graph read-model summarize --slices examples/adoption/todo-search-slice,examples/valid/todo-app-pbe-run` writes an Evidence-only aggregate summary outside either slice, preserves per-slice boundaries, and does not run generate/compare/validate, implement `validate --all`, change CI workflows, expand source authority, enforce CI, clean up public docs, or approve full Graph-source promotion.                                                                                                                                                                                                                                                                                                                                                                                          | Read-Model Aggregate Summary Contract                                             |
| DEC-060 | active | The non-enforcing manual `PBE Read-Model Evidence` workflow now runs Todo Search generate/compare/validate, Todo App PBE Run structure-only generate/validate, and aggregate summarize, and uploads the expanded Evidence bundle plus CI manifest. The workflow remains `workflow_dispatch` only and does not add PR/push triggers, required checks, branch protection, CI enforcement, `validate --all`, source authority expansion, public-doc cleanup, tree-native retirement, Todo App promotion beyond structure-only, or full Graph-source promotion.                                                                                                                                                                                                                                                                                                                                                            | Non-Enforcing Aggregate CI Read-Model Evidence Workflow                           |
| DEC-061 | active | GitHub Actions run `28156403793` reviewed the aggregate-enabled non-enforcing `PBE Read-Model Evidence` workflow on `main` via `workflow_dispatch`. The uploaded artifact bundle and CI manifest are reviewed as CI-backed Evidence with `ci-evidence-pass`, Todo Search `validation-pass` / `comparison-pass`, Todo App PBE Run `validation-pass`, aggregate `aggregate-pass`, retained warning visibility, and explicit non-enforcement/non-promotion/source-authority boundaries. The run surfaced a Node.js 20 deprecation annotation as a CI hygiene warning, not an Evidence failure.                                                                                                                                                                                                                                                                                                                            | Aggregate-Enabled CI-Backed Evidence Run Review                                   |
| DEC-062 | active | The manual `PBE Read-Model Evidence` workflow was updated for Node 24 action/runtime hygiene by using `actions/checkout@v7`, `actions/setup-node@v6` with `node-version: 24`, and `actions/upload-artifact@v7`. Post-update run `28157938343` completed successfully on `main` via `workflow_dispatch`, reviewed the same aggregate-enabled artifact bundle as `ci-evidence-pass`, and did not show the prior Node.js 20 deprecation annotation. The workflow remains manual, non-enforcing Evidence only and does not add PR/push triggers, required checks, branch protection, CI enforcement, source authority expansion, public-doc cleanup, or full Graph-source promotion.                                                                                                                                                                                                                                       | Node 24 CI Hygiene Read-Model Evidence Run Review                                 |
| DEC-063 | active | PR informational read-model Evidence is designed as a future visibility mode only. The design defines candidate `pull_request` paths, artifact/manifest fields, Step Summary wording, and conservative failure semantics where real command/runtime/artifact failures fail the job while Evidence warning/decision states remain visible and non-enforcing. At the design stage this decision did not add PR triggers, required checks, branch protection, CI enforcement, source authority expansion, public-doc cleanup, `validate --all`, Todo App promotion beyond structure-only, or full Graph-source promotion; DEC-064 records the later non-enforcing PR trigger implementation.                                                                                                                                                                                                                              | PR Informational Read-Model Evidence Design                                       |
| DEC-064 | active | The `PBE Read-Model Evidence` workflow implements a non-enforcing `pull_request` informational trigger with path filters for workflow, CLI, scripts, declared read-model example slices, aggregate outputs, and concept docs. The workflow preserves `workflow_dispatch`, command sequence, artifact upload, and Evidence-only boundaries; PR runs record `pull_request-informational` trigger metadata and PR head/base fields in the CI manifest and Step Summary. This does not add `push`/`schedule`, required checks, branch protection, CI enforcement, source authority expansion, public-doc cleanup, `validate --all`, Todo App promotion beyond structure-only, or full Graph-source promotion.                                                                                                                                                                                                              | PR Informational Read-Model Evidence Workflow Implementation                      |
| DEC-065 | active | Temporary PR #1 reviewed the non-enforcing PR informational read-model Evidence workflow. Run `28207822252` completed successfully on `pull_request`, wrote `triggerMode: pull_request-informational`, recorded PR number/head/base metadata, preserved Todo Search `validation-pass` / `comparison-pass`, Todo App PBE Run `validation-pass`, aggregate `aggregate-pass`, and kept source-authority, non-enforcement, and non-promotion boundaries visible. The temporary smoke PR was closed without merge and its remote branch was deleted. This does not add required checks, branch protection, CI enforcement, source authority expansion, public-doc cleanup, `validate --all`, Todo App promotion beyond structure-only, or full Graph-source promotion.                                                                                                                                                      | PR Informational Read-Model Evidence Run Review                                   |
| DEC-066 | active | PR informational observation policy is established as a non-enforcing observation standard for future PR read-model Evidence runs. It defines observation metrics, a recommended observation window of at least three real PR informational runs or one week of normal PR activity, path-filter refinement criteria, failure classification, and escalation criteria. It does not modify workflow triggers, create PRs, dispatch GitHub Actions, add required checks, introduce CI enforcement, expand source authority, perform public-doc cleanup, implement `validate --all`, promote Todo App PBE Run beyond structure-only, or approve full Graph-source promotion.                                                                                                                                                                                                                                               | PR Informational Observation Policy                                               |
| DEC-067 | active | PR informational observation log/runbook is established as an append-only recording surface for future PR read-model Evidence observations. It records the manual baseline run, first real PR informational run, reusable entry template, review checklist, observation counter, failure/noise classifications, and decision thresholds. It does not modify workflows, create PRs, dispatch GitHub Actions, add required checks, introduce CI enforcement, expand source authority, perform public-doc cleanup, implement `validate --all`, promote Todo App PBE Run beyond structure-only, or approve full Graph-source promotion.                                                                                                                                                                                                                                                                                    | PR Informational Observation Log                                                  |
| DEC-068 | active | Read-model `validate --all` contract is established as design-only guidance for a future all-slice validation surface. It defines the current slice profiles, proposed explicit slice registry fields, execution modes, aggregate relationship, failure semantics, source-authority boundaries, and PR observation separation. It does not implement CLI behavior, modify workflows, dispatch GitHub Actions, create PRs, add required checks, introduce CI enforcement, expand source authority, perform public-doc cleanup, promote Todo App PBE Run beyond structure-only, or approve full Graph-source promotion.                                                                                                                                                                                                                                                                                                  | Read-Model Validate-All Contract                                                  |
| DEC-069 | active | Read-model slice registry fixture and test strategy is established as a design-only prerequisite for future `validate --all` implementation. It defines the proposed registry fixture shape, positive fixture expectations, negative fixture categories, test classes, execution ordering, non-mutation expectations, and implementation readiness criteria. It does not create a registry file, implement parser/planner/CLI behavior, modify workflows, dispatch GitHub Actions, create PRs, add required checks, introduce CI enforcement, expand source authority, perform public-doc cleanup, or approve full Graph-source promotion.                                                                                                                                                                                                                                                                             | Read-Model Slice Registry Test Strategy                                           |
| DEC-070 | active | Read-model slice registry storage/location decision surface is established. It compares candidate locations and file formats, recommends a non-generated JSON registry candidate at `examples/read-model-aggregate/read-model-slices.json`, defines artifact role and mutation boundaries, and keeps existing in-code profiles as fallback until command behavior consumes registry metadata. DEC-071 later creates the candidate file; parser/planner/CLI behavior, workflow changes, GitHub Actions dispatch, enforcement, source authority expansion, public-doc cleanup, and full Graph-source promotion remain separate.                                                                                                                                                                                                                                                                                          | Read-Model Slice Registry Storage Decision                                        |
| DEC-071 | active | Candidate read-model slice registry file is created at `examples/read-model-aggregate/read-model-slices.json` as strict JSON, non-generated execution metadata. It includes only `todo-search-selected-slice` and `todo-app-pbe-run-structure-only`, records profile policy levels, required commands/artifacts, expected counts, retained warnings, fallback references, and source-authority / non-promotion / user-acceptance boundaries. It does not implement `validate --all`, change CI enforcement, expand source authority, perform public-doc cleanup, promote Todo App PBE Run beyond structure-only, or approve full Graph-source promotion.                                                                                                                                                                                                                                                               | Read-Model Slice Registry Fixture                                                 |
| DEC-072 | active | Candidate read-model slice registry parser/normalization and focused profile-comparison tests are implemented without making CLI command behavior registry-driven. The helper reads strict JSON, validates top-level boundaries and profile fields, rejects duplicate profile IDs and unknown policy levels, normalizes slash direction, and builds non-executing command plans for the current two profiles. Existing generate/compare/validate/summarize behavior remains driven by in-code profiles; `validate --all`, workflow changes, CI enforcement, source authority expansion, public-doc cleanup, and full Graph-source promotion remain unimplemented.                                                                                                                                                                                                                                                      | Read-Model Registry Parser Tests                                                  |
| DEC-073 | active | Local non-enforcing `pbe graph read-model validate --all` is implemented from the candidate registry. The command reads `examples/read-model-aggregate/read-model-slices.json`, runs included profiles' declared generate/compare/validate commands, preserves Todo Search parity requirements and Todo App PBE Run structure-only boundaries, writes the aggregate summary, and reports Evidence-only / non-promotion / non-enforcement boundaries. It does not change `.github/workflows/read-model-evidence.yml`, create PRs, dispatch GitHub Actions, add required checks, introduce CI enforcement, expand source authority, perform public-doc cleanup, promote Todo App PBE Run beyond structure-only, or approve full Graph-source promotion.                                                                                                                                                                  | Registry-Backed Read-Model Validate All                                           |
| DEC-074 | active | CI validate-all integration design is established for a future non-enforcing workflow simplification. The design compares the current explicit CI command sequence with a candidate `graph read-model validate --all` sequence, preserves focused tests, runtime fixture tests, PBE validation, artifact upload, CI manifest, Step Summary, source-authority, non-enforcement, and non-promotion boundaries, and records migration/equivalence review criteria. It does not modify `.github/workflows/read-model-evidence.yml`, dispatch GitHub Actions, create PRs, add required checks, introduce enforcement, expand source authority, perform public-doc cleanup, promote Todo App PBE Run beyond structure-only, or approve full Graph-source promotion.                                                                                                                                                          | CI Validate-All Integration Design                                                |
| DEC-075 | active | The non-enforcing `PBE Read-Model Evidence` workflow now uses local registry-backed `graph read-model validate --all` for read-model Evidence production. The workflow keeps `workflow_dispatch` and non-enforcing `pull_request` informational triggers, focused tests, runtime fixture tests, PBE validation, artifact upload, CI manifest, Step Summary, source-authority, non-enforcement, and non-promotion boundaries. Manual run `28210541509` reviewed the switched workflow as `ci-evidence-pass` with `validateAllStatus: aggregate-pass`. This does not add required checks, branch protection, CI enforcement, source authority expansion, public-doc cleanup, Todo App promotion beyond structure-only, or full Graph-source promotion.                                                                                                                                                                   | CI Validate-All Workflow Switch                                                   |
| DEC-076 | active | PR #2 reviewed the validate-all-centered non-enforcing PR informational workflow. Run `28210904900` completed successfully on `pull_request`, wrote `triggerMode: pull_request-informational`, recorded PR number/head/base metadata, preserved `sourceMode: registry-backed validate-all`, `validateAllStatus: aggregate-pass`, Todo Search `validation-pass` / `comparison-pass`, Todo App PBE Run `validation-pass`, aggregate `aggregate-pass`, and source-authority, non-enforcement, and non-promotion boundaries. The draft smoke PR was closed without merge and its remote branch was deleted. This does not add required checks, branch protection, CI enforcement, source authority expansion, public-doc cleanup, Todo App promotion beyond structure-only, or full Graph-source promotion.                                                                                                                | Validate-All PR Informational Run Review                                          |
| DEC-077 | active | Read-model negative fixture storage decision surface is established. Parser-shape failures should stay inline/temp first; mutation, missing-artifact, and cross-slice leakage tests should use temp workspace copies; durable `examples/invalid/read-model-*` fixtures should be reserved for stable behavior-level validate-all failures such as missing pilot marker, invalid `viewScopedTags`, missing Core View coverage, or structure-only policy conflicts. Later decisions implement the first durable fixtures under this policy. The storage decision does not modify workflows, dispatch GitHub Actions, introduce enforcement, expand source authority, perform public-doc cleanup, promote Todo App PBE Run beyond structure-only, or approve full Graph-source promotion.                                                                                                                                 | Read-Model Negative Fixture Storage Decision                                      |
| DEC-078 | active | First durable read-model negative fixture candidate plan is established as guidance for staged negative fixture work. It selected invalid `viewScopedTags` and missing Core View coverage as the first generic candidates and kept authority/policy fixtures separate until explicitly implemented. Later decisions DEC-079, DEC-080, and DEC-081 implement the invalid tag, missing Core View, and missing pilot marker fixtures as local focused test inputs only. The plan does not approve workflow changes, CI enforcement, source authority expansion, public-doc cleanup, Todo App promotion beyond structure-only, or full Graph-source promotion.                                                                                                                                                                                                                                                             | Read-Model Negative Fixture Candidate Plan                                        |
| DEC-079 | active | The first durable read-model negative fixture, `examples/invalid/read-model-invalid-view-scoped-tags`, is implemented as local focused test input. It stores an invalid generated-read-model-like JSON outside `generated/`, documents that it is not generated Evidence or source authority, and proves that invalid `viewScopedTags` produces a blocking validation result. The fixture is not included in the validate-all registry or CI workflow and does not change parser/CLI command behavior, add enforcement, expand source authority, perform public-doc cleanup, promote Todo App PBE Run beyond structure-only, or approve full Graph-source promotion.                                                                                                                                                                                                                                                   | Invalid View-Scoped Tags Fixture                                                  |
| DEC-080 | active | The second durable read-model negative fixture, `examples/invalid/read-model-core-view-missing`, is implemented as local focused test input. It stores an invalid generated-read-model-like JSON outside `generated/`, documents that it is not generated Evidence or source authority, and proves that missing required Core View coverage produces a blocking validation result while allowed `viewScopedTags` still pass. The fixture is not included in the validate-all registry or CI workflow and does not change parser/CLI command behavior, add enforcement, expand source authority, perform public-doc cleanup, promote Todo App PBE Run beyond structure-only, or approve full Graph-source promotion.                                                                                                                                                                                                    | Missing Core View Fixture                                                         |
| DEC-081 | active | The durable missing pilot marker fixture, `examples/invalid/read-model-pilot-marker-missing`, is implemented as local focused authority-boundary test input. It stores README plus small absence metadata outside `generated/`, removes only `generated/scoped-source-authority-pilot-marker.json` in a temp Todo Search validation workspace, preserves `comparison-pass` parity, and proves that a `pilot-marker-backed` profile returns a blocking `pilot-marker-exists` validation result when the marker is absent. The fixture is not included in the validate-all registry or CI workflow and does not add enforcement, expand source authority, perform public-doc cleanup, or approve full Graph-source promotion.                                                                                                                                                                                            | Missing Pilot Marker Fixture                                                      |
| DEC-082 | active | Structure-only policy conflict coverage is implemented as inline/temp registry normalization tests rather than a durable fixture. The registry normalization now rejects a `structure-only` profile that requires `compare`, sets parity or pilot marker requirements to required, or lists parity/pilot marker required artifacts. This preserves Todo App PBE Run as structure-only, keeps the positive registry valid, adds no `examples/invalid/read-model-structure-only-policy-conflict` fixture, changes no CLI command surface, and does not modify workflows, add enforcement, expand source authority, or approve full Graph-source promotion.                                                                                                                                                                                                                                                               | Structure-Only Policy Conflict Coverage                                           |
| DEC-083 | active | Read-model focused tests are stabilized without behavior changes by narrowing temp workspace setup to the read-model slices, aggregate registry/artifacts, compatibility fixture, and concept docs actually needed by the suite. The focused suite preserves registry-backed validate-all, positive Todo Search/Todo App behavior, durable negative fixture checks, structure-only policy conflict coverage, and non-mutation boundaries while avoiding repeated full `examples/` and `docs/` copies. This changes no CLI output semantics, generated artifact semantics, workflow behavior, CI enforcement, source authority, Todo App promotion, or full Graph-source promotion.                                                                                                                                                                                                                                     | Read-Model Focused Test Stabilization                                             |
| DEC-084 | active | Read-model invalid fixture CI inclusion policy is established as design-only guidance. The current recommendation is to keep invalid fixtures local-only while the manual and PR CI workflow continues to run positive registry-backed `validate --all` only. Optional manual invalid-fixture CI, PR informational invalid-fixture CI, and required/enforcing invalid-fixture gates remain future-only and require separate approval, runtime/noise policy, artifact vocabulary, and failure semantics. This policy changes no code, tests, workflow triggers, generated artifacts, registry entries, CI enforcement, source authority, Todo App structure-only status, or full Graph-source promotion.                                                                                                                                                                                                                | Read-Model Invalid Fixture CI Policy                                              |
| DEC-085 | active | The third real PR informational read-model Evidence observation is reviewed. Draft PR #3 triggered run `28213236499` on `pull_request`; the run completed successfully with `triggerMode: pull_request-informational`, `sourceMode: registry-backed validate-all`, `validateAllStatus: aggregate-pass`, Todo Search `validation-pass` / `comparison-pass`, Todo App PBE Run `validation-pass`, aggregate `aggregate-pass`, retained warning visibility, and source-authority / non-enforcement / non-promotion boundaries. The temporary PR was closed without merge and its remote branch was deleted. The three-real-PR observation count threshold is satisfied, so path-filter or failure-semantics refinement may be considered separately, but this decision does not change workflow filters, add enforcement, expand source authority, include invalid fixtures in CI, or approve full Graph-source promotion. | Third PR Informational Observation Review                                         |
| DEC-086 | active | PR informational path-filter and failure-semantics refinement is established as a design-only decision surface after PR #1, PR #2, and PR #3 satisfied the initial run-count observation threshold. Because all three reviewed PR runs were `ci-evidence-pass` with no blocker, repeated noise, missed artifact, hidden warning, or boundary ambiguity, the recommendation is to keep current path filters and failure semantics unchanged for now. Future narrowing, broadening, invalid-fixture CI, required checks, enforcement, source authority expansion, or promotion still require separate explicit decisions.                                                                                                                                                                                                                                                                                                | PR Informational Path-Filter Refinement                                           |
| DEC-087 | active | Broader Graph-source promotion review inputs are packaged as docs-only review material with status `promotion-review-inputs-ready-with-caveats`. The package inventories the Todo Search scoped pilot, generated/parity/validation reports, registry-backed `validate --all`, manual and PR CI-backed Evidence, positive registry, local negative fixture coverage, path-filter/failure-semantics policy, and remaining caveats. It does not approve Graph-source promotion, expand source authority, retire tree-native artifacts, change workflows/code/tests/generated artifacts, add enforcement, include invalid fixtures in CI, clean up public docs, promote Todo App beyond structure-only, or replace user acceptance.                                                                                                                                                                                        | Broader Graph-Source Promotion Review Inputs                                      |
| DEC-088 | active | Public-doc cleanup or explicit waiver decision package is prepared as docs-only review material for broader Graph-source promotion planning. It inventories public/user-facing docs for task-card authority, source-authority, compatibility-view, generated-Evidence, and legacy wording risks, and recommends cleanup before actual full promotion unless the user explicitly approves a visible waiver. DEC-090, DEC-091, DEC-092, and DEC-093 later implement or review Batch A, Batch B, Batch C, and Batch D only. The package does not approve waiver, expand source authority, approve promotion, retire tree-native artifacts, change workflow/code/tests/generated artifacts, add enforcement, or replace user acceptance.                                                                                                                                                                                   | Public-Doc Cleanup Or Waiver Decision Package                                     |
| DEC-089 | active | Public-doc cleanup implementation plan is prepared as planning material before broader Graph-source promotion. It stages cleanup into Batch A (`docs/source-of-truth-matrix.md`), Batch B (`README.md`, `docs/acep.md`, `docs/workflow.md`), Batch C (`docs/examples.md`, `docs/usage.md`, `docs/traceability-rules.md`, `docs/ux-auditor.md`, `docs/coverage-auditor.md`), and Batch D (`docs/file-format.md`, `AGENTS.md` review-only). DEC-090, DEC-091, DEC-092, and DEC-093 later implement or review Batch A/B/C/D while preserving `no-waiver-approved`. The plan does not approve waiver, expand source authority, approve promotion, change workflow/code/tests/generated artifacts, add enforcement, or replace user acceptance.                                                                                                                                                                             | Public-Doc Cleanup Implementation Plan                                            |
| DEC-090 | active | Batch A public-doc cleanup is implemented in `docs/source-of-truth-matrix.md`. The ACEP row now frames ACEP as Cycle Contract and Node Execution Contract packaging, manifest, and evidence rules rather than ownership of executable task cards, and a rule states task cards are execution or compatibility views that do not replace Product, Work, Test, Evidence, Acceptance, Cycle Contract, or Node Execution Contract authority. Batch B is later implemented by DEC-091; Batch C/D, waiver approval, source authority expansion, Graph-source promotion, tree-native retirement, workflow/code/test/generated changes, enforcement, and user acceptance changes remain separate.                                                                                                                                                                                                                              | Batch A Public-Doc Cleanup                                                        |
| DEC-091 | active | Batch B public-doc cleanup is implemented in `README.md`, `docs/acep.md`, and `docs/workflow.md`. Task-card shorthand remains where useful, but those docs now frame task cards as task-card views, compatibility/execution views, or projections inside ACEP / Cycle Contract / Node Execution Contract packaging. ACEP remains execution-pack and obligation packaging, not source authority. Batch C/D, waiver approval, source authority expansion, Graph-source promotion, tree-native retirement, workflow/code/test/generated changes, enforcement, and user acceptance changes remain separate.                                                                                                                                                                                                                                                                                                                | Batch B Public-Doc Cleanup                                                        |
| DEC-092 | active | Batch C public-doc cleanup is implemented in `docs/examples.md`, `docs/usage.md`, `docs/traceability-rules.md`, `docs/ux-auditor.md`, and `docs/coverage-auditor.md`. Examples and usage now describe task-card views as selected-scope execution aids and contract-obligation carriers; traceability and audit docs now treat task-card views as execution-contract projections or traceability carriers rather than source authority. Audit strictness is preserved. Batch D is later reviewed by DEC-093, and waiver approval, source authority expansion, Graph-source promotion, tree-native retirement, workflow/code/test/generated changes, enforcement, and user acceptance changes remain separate.                                                                                                                                                                                                          | Batch C Public-Doc Cleanup                                                        |
| DEC-093 | active | Optional Batch D public-doc cleanup is reviewed and implemented only where needed. `docs/file-format.md` remains unchanged because it only lists file layout paths, while `AGENTS.md` now frames visual task-card wording as task-card views that project Node Execution Contract obligations. This does not approve waiver, source authority expansion, Graph-source promotion, tree-native retirement, workflow/code/test/generated changes, enforcement, Todo App promotion, or user acceptance.                                                                                                                                                                                                                                                                                                                                                                                                                    | Batch D Public-Doc Cleanup                                                        |
| DEC-094 | active | Source-authority expansion design package is prepared as docs-only review material before any broader Graph-source promotion decision. It records current tree-native authority, candidate future artifact roles, a candidate authority matrix, staged expansion path, and risks/caveats. It does not expand source authority, approve Graph-source promotion, retire tree-native artifacts, modify public docs, change workflow/code/CLI/tests/generated artifacts, add enforcement, include invalid fixtures in CI, promote Todo App beyond `structure-only`, or replace user acceptance.                                                                                                                                                                                                                                                                                                                            | Source-Authority Expansion Design Package                                         |
| DEC-095 | active | Source-authority rollback/fallback plan is prepared as docs-only review material for the candidate broader authority matrix. It records fallback precedence, rollback triggers, trigger-specific actions, snapshot/reference requirements, compatibility-retirement guardrails, and the readiness label `rollback-fallback-plan-ready-for-promotion-package-with-caveats`. It does not execute rollback, expand source authority, approve Graph-source promotion, retire tree-native artifacts, modify public docs, change workflow/code/CLI/tests/generated artifacts, add enforcement, include invalid fixtures in CI, promote Todo App beyond `structure-only`, or replace user acceptance.                                                                                                                                                                                                                         | Source-Authority Rollback/Fallback Plan                                           |
| DEC-096 | active | Broader Graph-source promotion decision package is prepared as the docs-only user decision surface with readiness label `promotion-decision-package-ready / preparation-complete-with-user-decision-required`. It collects the matured Evidence inventory, public-doc cleanup Batch A/B/C/D status, candidate source-authority matrix, rollback/fallback plan, retained caveats, and decision options. This completes the pre-promotion preparation package for user judgment, but it does not execute promotion, expand source authority, retire tree-native artifacts, change workflow/code/CLI/tests/generated artifacts, add enforcement, promote Todo App beyond `structure-only`, approve waiver, or replace user acceptance.                                                                                                                                                                                    | Broader Graph-Source Promotion Decision Package                                   |
| DEC-097 | active | The user approved and executed the limited Graph-source promotion branch after preparation reached 100%. Maintainability Graph is now the limited source model for the Todo Search selected-slice authority surface. Tree-native selected-slice artifacts are maintained compatibility / fallback / reference artifacts and are not retired. Outside the promoted Todo Search scope, tree-native artifacts remain operational source. Generated read-models, validation reports, aggregate summaries, CI manifests, and PR runs remain Evidence, not independent authority or user acceptance. Repo-wide promotion, tree-native retirement, CI enforcement, invalid-fixture CI inclusion, Todo App promotion beyond `structure-only`, migration scripts, and required checks remain separate future decisions.                                                                                                         | Broader Graph-Source Promotion Execution Record                                   |
| DEC-098 | active | Post-promotion observation runbook is established for the executed limited Todo Search Graph-source promoted scope. It defines execution-health criteria, observation log fields, escalation triggers, and an initial window of at least 3 healthy post-promotion observations or 1 week of normal graph/read-model changes. It does not change workflows, CLI behavior, generated artifacts, registry entries, enforcement, repo-wide promotion, Todo App structure-only status, tree-native fallback/reference retention, or user acceptance authority.                                                                                                                                                                                                                                                                                                                                                              | Post-Promotion Observation Runbook                                                |
| DEC-099 | active | The next implementation branch decision surface is Graph source artifact/storage plus projection generation. The preferred first candidate is a non-generated Todo Search slice-local graph source artifact outside `generated/`, followed by parser/schema checks and projection generation into generated read-model Evidence. This is design-only: it creates no artifacts, implements no parser/generator, changes no CLI/workflow behavior, expands no authority, retires no fallback artifacts, and does not promote Todo App beyond `structure-only`.                                                                                                                                                                                                                                                                                                                                                           | Graph Source Artifact Storage And Projection Design                               |
| DEC-100 | active | The first concrete graph source artifact/storage step is implemented for the promoted Todo Search selected-slice scope. `examples/adoption/todo-search-slice/graph-source.json` is a non-generated limited graph source artifact outside `generated/`, with explicit source/projection/fallback/user-acceptance boundaries. Internal helpers parse/normalize it and project its source records to the current Todo Search read-model shape; focused tests prove the projection preserves 40 nodes, 59 edges, and 7 Core Views. This does not add a CLI projection command, change workflows, regenerate generated artifacts, alter validate-all registry semantics, retire fallback artifacts, expand repo-wide authority, promote Todo App beyond `structure-only`, or add enforcement.                                                                                                                               | First Graph Source Artifact                                                       |
| DEC-101 | active | A minimal CLI projection path is implemented for the promoted Todo Search graph source artifact: `pbe graph read-model project --graph-source examples/adoption/todo-search-slice/graph-source.json --output examples/adoption/todo-search-slice/generated/graph-source-read-model-projection.json`. The command writes an explicit generated projection artifact preserving 40 nodes, 59 edges, 7 Core Views, source/projection/fallback/user-acceptance boundaries, and default `generate` behavior. It does not change workflow behavior, validate-all registry semantics, repo-wide authority, fallback retention, enforcement, invalid-fixture CI inclusion, tree retirement, or Todo App `structure-only` status.                                                                                                                                                                                                | Todo Search Graph Source Projection CLI                                           |
| DEC-102 | active | Graph-source and graph-source projection artifact contract hardening is implemented as internal validator/helper coverage and focused tests. The contract checks source scope, projection role, metadata alignment, fallback/reference retention, user-acceptance and non-promotion boundaries, expected 40-node / 59-edge / 7-Core-View shape, and projection parity with the source records. This does not add workflow integration, validate-all registry changes, enforcement, invalid-fixture CI inclusion, repo-wide authority expansion, tree retirement, or Todo App promotion.                                                                                                                                                                                                                                                                                                                                | Graph Source Projection Contract Hardening                                        |
| DEC-103 | active | Local registry-backed `graph read-model validate --all` now includes the Todo Search graph-source projection contract check when the registry profile declares the projection artifact. JSON output exposes `projectionContractStatus`, and missing/corrupt projection artifacts block the local validate-all status while leaving existing per-slice validation reports and aggregate summarize semantics visible. This is non-enforcing and does not change workflows, required checks, repo-wide authority, tree retirement, invalid-fixture CI inclusion, or Todo App `structure-only` status.                                                                                                                                                                                                                                                                                                                     | Validate-All Projection Contract Integration                                      |
| DEC-104 | active | The non-enforcing manual/PR read-model Evidence workflow now captures local validate-all `projectionContractStatus` into the CI manifest, Step Summary, and artifact bundle. Manual run `28218687289` and PR #4 run `28218854329` reviewed the capture path as `ci-evidence-pass` with Todo Search `projection-contract-pass` and Todo App PBE Run `not-configured`. The workflow triggers remain `workflow_dispatch` plus non-enforcing `pull_request`; no required checks, enforcement, repo-wide promotion, tree retirement, invalid-fixture CI inclusion, or Todo App promotion are added.                                                                                                                                                                                                                                                                                                                         | CI Projection Contract Observation Capture                                        |
| DEC-105 | active | Todo Search promoted-scope read-model generation is now graph-source-backed in a bounded way. `graph read-model generate --slice examples/adoption/todo-search-slice` reads `examples/adoption/todo-search-slice/graph-source.json` and uses its source records for generated nodes, edges, and Core View coverage while preserving the 40-node / 59-edge / 7-Core-View shape, parity pass, validation pass, fallback/reference boundaries, and generated Evidence role. Manual CI run `28219396764` and PR #5 run `28219583619` reviewed this as `ci-evidence-pass`. Todo App PBE Run remains structure-only/profile-builder; workflows, required checks, enforcement, repo-wide promotion, tree retirement, invalid-fixture CI inclusion, and Todo App promotion remain unchanged.                                                                                                                                   | Todo Search Graph-Source-Backed Generation                                        |

## Supersede Relationships

| New Decision | Supersedes                                                                         | Reason                                                                                                                                                            |
| ------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEC-001      | Any description of PBE as a standalone app, SaaS, backend service, or API provider | The plugin workflow direction is explicit and stable.                                                                                                             |
| DEC-097      | DEC-013 within the approved Todo Search selected-slice scope                       | The limited execution record changes source authority for the named scope only; DEC-013 remains active outside promoted scopes.                                   |
| DEC-105      | DEC-101 default-generation non-change note within Todo Search promoted scope       | Todo Search default read-model generation now uses the bounded graph source records; DEC-101 remains active for the explicit projection CLI and other boundaries. |
| DEC-003      | Direct execution from unconfirmed user intent                                      | Product truth must be recorded before downstream work derives from it.                                                                                            |
| DEC-005      | Treating requirement nodes as direct coding tasks                                  | WPD must perform project and module derivation before executable work exists.                                                                                     |
| DEC-006      | Task-card-only execution                                                           | Cycle and Node Execution Contracts are the canonical execution boundary.                                                                                          |
| DEC-011      | 5 Layer as active architecture                                                     | Current architecture is tree-native with skill, artifact, and CLI gate responsibilities.                                                                          |

## Conflict Check

No active concept repository conflict is intentionally left unresolved in this pass.

DEC-013 does not supersede DEC-003. DEC-003 remains the current operational source decision, while DEC-013 records the
long-term Graph-source promotion target and the requirement for separate approval.

DEC-014 and DEC-015 do not supersede DEC-007. Approval Brief explains a user-facing judgment situation, while the user
remains the acceptance authority and Acceptance Tree remains the durable closure record.

DEC-016 does not replace DEC-006 or DEC-014. Execution Contracts may declare required Checks and Evidence obligations,
while Approval Brief summarizes them for user judgment and Acceptance Tree remains durable acceptance state.

DEC-017 does not replace DEC-008, DEC-014, DEC-016, or Acceptance Tree. Control Nodes explain workflow control points,
while Change/Impact artifacts, Approval Brief, Check/Evidence records, and durable acceptance state keep their separate
roles.

DEC-018 does not supersede DEC-013. Tree-native artifacts remain current operational source of truth until a separate
Graph-source promotion phase is explicitly approved.

DEC-019 does not supersede DEC-013, DEC-016, DEC-017, or DEC-018. It defines the feasibility-readiness standard while
tree-native artifacts remain operational source, Check/Evidence rules define proof, Control Nodes define workflow
control, and Legacy Compatibility Map defines compatibility interpretation.

DEC-020 does not supersede DEC-013 or DEC-019. Tree-native artifacts remain current operational source until explicit
promotion, and feasibility evidence remains a prerequisite rather than promotion itself.

DEC-021 does not supersede DEC-013, DEC-018, DEC-019, or DEC-020. It defines recovery and compatibility safety
requirements for a future transition while tree-native artifacts remain current operational source, Legacy Compatibility
Map continues to define compatibility interpretation, runtime feasibility remains a prerequisite, and Source Transition
Path remains the authority transition policy.

DEC-022 does not supersede DEC-019, DEC-020, or DEC-021. It selects the representative slice and Evidence review
criteria needed before actual demo execution, while Runtime Feasibility Demonstration remains the evidence-bearing gate,
Source Transition Path remains the authority policy, and Rollback / Compatibility Strategy remains the safety policy.

DEC-023 does not supersede DEC-019, DEC-020, DEC-021, or DEC-022. It records the observed result of the selected demo
slice, while partial findings remain promotion blockers or evidence-strengthening inputs and source authority remains
tree-native until explicit promotion.

DEC-024 does not supersede DEC-006, DEC-013, DEC-019, DEC-020, or DEC-023. Manual demo-support Project, Contract,
Change, Impact, Approval, Compatibility, or Evidence Exception artifacts may reduce review gaps, but they do not replace
CLI-generated runtime artifacts, source-transition prerequisites, or explicit user approval.

DEC-025 does not supersede DEC-006, DEC-018, DEC-020, DEC-023, or DEC-024. It records a real compatibility mismatch as
reviewable Evidence and a Control Node candidate, while Cycle and Node Execution Contracts remain the execution
boundary, Legacy Compatibility Map remains the interpretation policy, public-doc cleanup remains a separate judgment,
and source authority remains tree-native until explicit promotion.

DEC-026 does not supersede DEC-007, DEC-016, DEC-023, DEC-024, or DEC-025. It resolves the PP-001 product-meaning
decision for the manual demo-support slice, while Evidence remains observable-artifact based, Acceptance remains
user-controlled, compatibility cleanup remains deferred, and source authority remains unchanged.

DEC-027 does not supersede DEC-007, DEC-016, DEC-019, DEC-023, DEC-024, or DEC-026. It records fresh bounded runtime
fixture Evidence for the representative slice, while user Acceptance remains separate, AI self-report remains
non-evidence, Runtime Feasibility Demonstration remains a readiness gate, manual demo-support artifacts remain
non-authoritative, and source authority remains tree-native until explicit promotion.

DEC-028 does not supersede DEC-007, DEC-020, DEC-021, DEC-023, DEC-025, DEC-026, or DEC-027. It records explicit user
renewed Acceptance for the representative demo-support slice, while source promotion still requires source transition
boundaries, rollback/compatibility judgment, readiness review handling, retained warning outcomes, and explicit user
approval for promotion.

DEC-029 does not supersede DEC-013, DEC-019, DEC-020, DEC-021, DEC-023, DEC-027, or DEC-028. It records the readiness
review and warning classification, while Maintainability Graph remains a read/alignment model, source transition still
requires explicit user approval, rollback/compatibility strategy remains a prerequisite, demo Evidence remains scoped,
bounded fixture Evidence remains representative rather than full-product proof, and renewed Acceptance remains
demo-slice acceptance rather than promotion approval.

DEC-030 does not supersede DEC-013, DEC-020, DEC-021, DEC-027, DEC-028, or DEC-029. It resolves the read-model output
blocker only for limited pilot decision preparation, while generated builder output, full promotion repeatability,
source transition approval, rollback/compatibility safety, bounded fixture limits, and user promotion approval remain
separate.

DEC-031 does not supersede DEC-007, DEC-013, DEC-020, DEC-021, DEC-029, or DEC-030. It creates the user-facing decision
package for a limited pilot decision, while user acceptance authority, current tree-native source authority, source
transition prerequisites, rollback/compatibility safety, readiness warning classification, manual parity limits, and
explicit user promotion approval remain separate.

DEC-032 does not supersede DEC-003, DEC-013, DEC-018, DEC-020, or DEC-030. It refines the target Graph-first model and
read/alignment taxonomy while tree-native artifacts remain current operational source until explicit promotion.

DEC-033 does not supersede DEC-006, DEC-014, DEC-020, DEC-030, or DEC-031. It defines View Tree Pack as a projection and
adds Scope / Execution View, while Cycle/Node Execution Contracts remain the current execution boundary, Approval Brief
remains the user judgment surface, and limited pilot approval remains a user decision even after Graph-first parity
refresh.

DEC-034 does not supersede DEC-016, DEC-023, DEC-027, or DEC-030. It separates confidence from freshness/status while
Check/Evidence policy still controls proof and AI self-report remains non-evidence.

DEC-035 does not supersede DEC-003, DEC-005, DEC-013, or DEC-019. It defines a retrofit onboarding policy for existing
projects without PBE, while PBE-managed projects still use tree-native Product/Project/Work/Test/Evidence/Acceptance
artifacts as current operational source.

DEC-036 does not supersede DEC-007, DEC-016, DEC-020, or DEC-031. It constrains AI graph update proposals while user
acceptance authority, Evidence requirements, source-transition approval, and limited pilot decision authority remain
user- or evidence-gated.

DEC-037 does not supersede DEC-013, DEC-020, DEC-030, DEC-031, DEC-032, or DEC-033. It updates the manual limited-pilot
parity artifact under the new taxonomy while Maintainability Graph remains a read/alignment model, source transition
still requires explicit user approval, manual parity remains non-authoritative, and View Tree Pack remains a projection.

DEC-038 does not supersede DEC-013, DEC-020, DEC-021, DEC-031, or DEC-037. It records the user's bounded limited pilot
decision for the Todo Search selected slice after the Node/Edge/Tag refresh, while full Graph-source promotion, broad
source authority change, rollback/compatibility execution, generated builder support, public-doc cleanup, and
tree-native artifact retirement remain separate.

DEC-039 does not supersede DEC-020, DEC-021, DEC-030, DEC-031, or DEC-038. It plans the next execution-mode decision
after the bounded limited pilot approval, while the approval record remains non-executing, dry-run remains
non-authoritative, scoped source-authority pilot execution requires separate approval, and full Graph-source promotion
remains out of scope.

DEC-040 does not supersede DEC-020, DEC-021, DEC-030, DEC-031, DEC-038, or DEC-039. It records the user's dry-run mode
selection and the review-only observation result, while source transition policy, rollback/compatibility requirements,
manual parity limits, limited pilot decision boundaries, the bounded transition record, and the execution plan's
separation between dry-run and scoped authority execution remain active.

DEC-041 does not supersede DEC-020, DEC-021, DEC-030, DEC-031, DEC-038, DEC-039, or DEC-040. It prepares a user decision
surface for possible scoped authority execution, while source transition policy, rollback/fallback requirements, manual
parity limits, limited pilot decision boundaries, the execution plan, dry-run observation, and actual execution approval
remain separate.

DEC-042 does not supersede DEC-016, DEC-020, DEC-021, DEC-030, DEC-039, DEC-040, or DEC-041. It strengthens the Evidence
prerequisite before any authority-bearing scoped execution, while Check/Evidence policy, source transition policy,
rollback/fallback gates, manual parity limits, execution-mode separation, dry-run observation, preparation-package
boundaries, and future user approval remain active.

DEC-043 does not supersede DEC-016, DEC-020, DEC-021, DEC-030, DEC-039, DEC-040, DEC-041, or DEC-042. It designs the
future evidence output surface while Check/Evidence policy, source transition policy, rollback/fallback gates, manual
parity limits, execution separation, dry-run observation, preparation-package boundaries, generated Evidence
requirement, and future implementation/execution approvals remain active.

DEC-044 does not supersede DEC-016, DEC-020, DEC-021, DEC-030, DEC-039, DEC-040, DEC-041, DEC-042, or DEC-043. It
implements bounded Evidence generation and comparison for the Todo Search selected slice only. Generated output remains
Evidence, not source authority. Scoped source-authority execution was still unapproved at DEC-044 time and is later
handled separately by DEC-046.

DEC-045 does not supersede DEC-016, DEC-020, DEC-021, DEC-034, DEC-042, DEC-043, or DEC-044. It resolves a bounded
generated/manual parity warning review by aligning generated freshness/status mapping with source artifacts. It does not
make generated output source authority, does not execute a scoped source-authority pilot, and does not remove the need
for user approval before any source boundary changes.

DEC-046 does not supersede DEC-003, DEC-007, DEC-013, DEC-016, DEC-020, DEC-021, DEC-033, DEC-038, DEC-044, or DEC-045.
It executes a bounded Todo Search scoped pilot only. Tree-native selected-slice artifacts remain fallback/reference and
are not retired; user Acceptance authority remains user-controlled; full Graph-source promotion, repository-wide source
authority change, public-doc cleanup, and validator/CI enforcement remain separate future decisions.

DEC-047 does not supersede DEC-046. It reviews the bounded pilot after execution and keeps the same authority boundary:
Todo Search selected slice only, fallback ready, retained warnings visible, and no broader promotion.

DEC-048 does not supersede DEC-047. It records the observation mode after review: keep active with retained warnings,
watch trigger conditions, and require a separate user decision before validator/CI enforcement, public-doc cleanup,
broader promotion review, rollback/defer, or scope expansion.

DEC-049 does not supersede DEC-048. It responds to one active-observation trigger by defining validator/CI-backed
Evidence design only. It does not start validator implementation, add CI enforcement, or approve broader source
authority.

DEC-050 does not supersede DEC-046, DEC-047, DEC-048, or DEC-049. It implements scoped validator-backed Evidence for
Todo Search only. CI-backed Evidence, validator enforcement, public-doc cleanup, broader execution, full promotion
review, and any source authority expansion remain separate future decisions.

DEC-051 does not supersede DEC-050. It designs a future CI-backed Evidence workflow after local validator-backed
Evidence exists. It does not implement CI, make CI required, expand the scoped pilot, or change the source-transition
approval boundary.

DEC-052 does not supersede DEC-051. It implements only the first non-enforcing manual CI-backed Evidence workflow for
Todo Search. PR/push triggers, required-check enforcement, multi-slice validation, repo-wide promotion readiness,
public-doc cleanup, and source authority changes remain separate future decisions.

DEC-053 does not supersede DEC-052. It records an attempted manual workflow run review and preserves Evidence honesty:
the workflow exists, but no authenticated CI run artifact has been reviewed yet.

DEC-054 does not supersede DEC-052 or DEC-053. It resolves the CI run review blocker by recording the later authenticated
manual workflow run and artifact review, while preserving the same non-enforcement and source-authority boundaries.

DEC-055 does not supersede DEC-054. It uses the Todo Search local/CI-backed baseline as Evidence for designing later
multi-slice validation, but it does not broaden the active pilot or implement a second slice.

DEC-057 does not supersede DEC-056. It adds a second structure-only fixture/profile after the Todo Search extraction,
while keeping Todo Search as the only active scoped source-authority pilot.

DEC-058 does not supersede DEC-057. It strengthens the report contract for the existing two generated slices so they can
be read independently before any later aggregate reporting.

DEC-059 does not supersede DEC-058. It implements the first aggregate read-model Evidence summary over existing
per-slice validation reports only. The aggregate summary is Evidence-only and does not run validation, implement
`validate --all`, change CI workflows, expand source authority, promote Maintainability Graph, or replace user approval.

DEC-060 does not supersede DEC-052, DEC-054, DEC-057, DEC-058, or DEC-059. It extends the existing manual workflow to
produce Todo App structure-only and aggregate summary artifacts, but keeps the workflow non-enforcing and
manual-dispatch only. DEC-061 later records the aggregate-enabled run review without changing enforcement or authority.

DEC-061 does not supersede DEC-060. It records the observed aggregate-enabled workflow run and artifact review, while
PR/push triggers, required checks, branch protection, CI enforcement, `validate --all`, source authority expansion,
public-doc cleanup, and full Graph-source promotion remain separate future decisions.

DEC-062 does not supersede DEC-060 or DEC-061. It resolves the Node.js 20 CI hygiene warning observed in the historical
aggregate-enabled run by updating action/runtime settings and reviewing a post-update manual run, while preserving the
same non-enforcing workflow boundary and Evidence-only source-authority stance.

DEC-063 does not supersede DEC-060, DEC-061, or DEC-062. It designs a possible future PR-visible signal on top of the
reviewed manual workflow baseline. DEC-064 records the later workflow-change approval and implementation while keeping
enforcement, source authority, and promotion decisions separate.

DEC-064 does not supersede DEC-060, DEC-061, DEC-062, or DEC-063. It implements the PR-visible signal described by
DEC-063, while preserving manual dispatch, non-enforcement, source-authority boundaries, and full-promotion separation.
Required checks, branch protection, CI enforcement, `validate --all`, broader source authority, public-doc cleanup, and
PR run review remain separate decisions or evidence steps.

DEC-065 does not supersede DEC-064. It reviews the first real PR informational run and confirms the implementation's
artifact metadata and boundaries, while required checks, branch protection, CI enforcement, `validate --all`, broader
source authority, public-doc cleanup, path-filter refinement, and promotion decisions remain separate.

DEC-066 does not supersede DEC-064 or DEC-065. It defines how to observe additional PR informational runs after the first
review, while keeping path-filter changes, failure-semantics revisions, required checks, CI enforcement, `validate --all`,
broader source authority, public-doc cleanup, and promotion decisions separate.

DEC-067 does not supersede DEC-066. It provides the append-only log and runbook for applying the observation policy,
while keeping workflow changes, new PR creation, GitHub Actions dispatch, path-filter changes, required checks, CI
enforcement, `validate --all`, broader source authority, public-doc cleanup, and promotion decisions separate.

DEC-068 does not supersede DEC-059, DEC-066, or DEC-067. It defines the contract for a future all-slice validation
surface, while keeping the existing aggregate summary command report-only, the PR observation window active, and any CLI
implementation, workflow change, CI enforcement, source authority expansion, public-doc cleanup, or promotion decision
separate.

DEC-069 does not supersede DEC-068. It defines fixture and test strategy before implementation, while keeping actual
registry file creation, parser/planner implementation, `validate --all`, workflow changes, CI enforcement, source
authority expansion, public-doc cleanup, and promotion decisions separate.

DEC-070 does not supersede DEC-069. It records the storage/location and format decision surface for a future registry
file, while keeping candidate file creation, parser/planner implementation, `validate --all`, workflow changes, CI
enforcement, source authority expansion, public-doc cleanup, and promotion decisions separate. DEC-071 later resolves
the candidate file creation step only.

DEC-071 does not supersede DEC-070. It executes the approved candidate registry-file creation step while keeping parser
and planner consumption, `validate --all`, workflow changes, CI enforcement, source authority expansion, public-doc
cleanup, Todo App promotion beyond structure-only, and full Graph-source promotion separate.

DEC-072 does not supersede DEC-071. It adds parser/normalization and non-executing command-plan tests for the candidate
registry while keeping CLI command behavior, `validate --all`, workflow changes, CI enforcement, source authority
expansion, public-doc cleanup, Todo App promotion beyond structure-only, and full Graph-source promotion separate.

DEC-073 does not supersede DEC-059, DEC-060, or DEC-072. It adds a local registry-backed Evidence command that runs the
declared per-slice command plan before aggregate summary generation. The existing report-only summarize command and the
manual/PR CI workflow command sequence remain separate, and CI workflow consumption, required checks, enforcement,
source authority expansion, public-doc cleanup, Todo App promotion beyond structure-only, and full Graph-source
promotion remain unapproved.

DEC-074 does not supersede DEC-060, DEC-064, or DEC-073. It designs a possible future workflow simplification that would
call local `validate --all`, while keeping the current workflow unchanged and preserving PR observation, artifact
review, required-check/enforcement, source authority, public-doc cleanup, Todo App promotion, and full promotion as
separate decisions.

DEC-075 does not supersede DEC-064 or DEC-073. It changes only the non-enforcing workflow read-model command sequence to
call local `validate --all`; trigger policy, PR informational observation, required checks, enforcement, source
authority, public-doc cleanup, Todo App promotion, and full promotion remain separate decisions.

DEC-076 does not supersede DEC-064 or DEC-075. It records the first PR informational Evidence run after the validate-all
workflow switch, while keeping the workflow non-enforcing and preserving required checks, enforcement, source authority,
public-doc cleanup, Todo App promotion, and full promotion as separate future decisions.

DEC-077 does not supersede DEC-069 or DEC-073. It narrows where future invalid read-model fixtures should live, while
leaving actual fixture creation, parser/test implementation, CI invalid-fixture execution, enforcement, source
authority, public-doc cleanup, Todo App promotion, and full promotion as separate decisions.

DEC-078 does not supersede DEC-077. It narrows the first durable fixture candidate set while leaving fixture
implementation, focused tests, parser/validator behavior, CI invalid-fixture execution, enforcement, source authority,
public-doc cleanup, Todo App promotion, and full promotion as separate decisions.

DEC-086 does not supersede DEC-066, DEC-067, DEC-084, or DEC-085. It records a refinement recommendation after the
three-run observation threshold was satisfied, while keeping the workflow unchanged and preserving path-filter
implementation, failure-semantics changes, invalid-fixture CI, required checks, enforcement, source authority expansion,
public-doc cleanup, Todo App promotion, and full promotion as separate decisions.

DEC-087 does not supersede DEC-013, DEC-037, DEC-075, DEC-084, DEC-085, or DEC-086. It packages review inputs for a
future broader Graph-source promotion decision, while keeping actual promotion, source authority expansion, tree-native
retirement, workflow/code changes, CI enforcement, public-doc cleanup, invalid-fixture CI, Todo App promotion, rollback
execution, and user approval as separate future decisions.

DEC-088 does not supersede DEC-087 or public documentation. It creates the cleanup-or-waiver decision package only,
while keeping actual public-doc edits, waiver approval, promotion approval, source authority expansion, compatibility
retirement, enforcement, workflow/code changes, and user acceptance as separate decisions.

DEC-089 does not supersede DEC-088 or public documentation. It plans cleanup sequencing only, while keeping actual
public-doc edits, waiver approval, promotion approval, source authority expansion, compatibility retirement,
enforcement, workflow/code changes, and user acceptance as separate decisions.

DEC-090 does not supersede DEC-088 or DEC-089. It implements only Batch A in `docs/source-of-truth-matrix.md`, while
keeping later cleanup, waiver approval, source authority expansion, Graph-source promotion, tree-native retirement,
workflow/code/test/generated changes, enforcement, and user acceptance as separate decisions.

DEC-091 does not supersede DEC-088, DEC-089, or DEC-090. It implements only Batch B in `README.md`, `docs/acep.md`, and
`docs/workflow.md`, while keeping Batch C/D cleanup, waiver approval, source authority expansion, Graph-source
promotion, tree-native retirement, workflow/code/test/generated changes, enforcement, and user acceptance as separate
decisions.

DEC-092 does not supersede DEC-088, DEC-089, DEC-090, or DEC-091. It implements only Batch C in examples, usage,
traceability, and audit docs, while keeping optional Batch D review, waiver approval, source authority expansion,
Graph-source promotion, tree-native retirement, workflow/code/test/generated changes, enforcement, and user acceptance
as separate decisions.

DEC-093 does not supersede DEC-088, DEC-089, DEC-090, DEC-091, or DEC-092. It completes the optional Batch D review
surface only, while keeping waiver approval, promotion approval, source authority expansion, tree-native retirement,
workflow/code/test/generated changes, enforcement, and user acceptance as separate decisions.

DEC-094 does not supersede DEC-087, DEC-088, DEC-089, DEC-090, DEC-091, DEC-092, or DEC-093. It prepares a candidate
authority matrix and staged expansion design only, while keeping source authority expansion, Graph-source promotion,
tree-native retirement, public-doc cleanup edits, workflow/code/CLI/test/generated changes, enforcement, invalid-fixture
CI, Todo App promotion, and user acceptance as separate decisions.

DEC-095 does not supersede DEC-021, DEC-087, DEC-094, or existing rollback policy. It prepares a concrete docs-only
fallback plan for the candidate authority matrix, while keeping rollback execution, source authority expansion,
Graph-source promotion, tree-native retirement, public-doc cleanup edits, workflow/code/CLI/test/generated changes,
enforcement, invalid-fixture CI, Todo App promotion, and user acceptance as separate decisions.

DEC-096 does not supersede DEC-013, DEC-087, DEC-088, DEC-094, DEC-095, or user acceptance authority. It packages the
review inputs, cleanup status, authority matrix, rollback/fallback plan, and decision options for explicit user judgment
only. Actual Graph-source promotion, source authority expansion, tree-native retirement, enforcement, waiver approval,
rollback/defer action, and execution planning remain separate follow-up decisions after the user chooses a branch.

DEC-097 supersedes DEC-013 only within the approved Todo Search selected-slice authority surface. In that bounded scope,
Maintainability Graph is now the limited source model and tree-native selected-slice artifacts are maintained
compatibility / fallback / reference artifacts. DEC-013 remains active for all unpromoted scopes. DEC-097 does not
supersede DEC-003, DEC-007, DEC-016, DEC-021, DEC-073, DEC-075, DEC-084, DEC-095, or user acceptance authority. It does
not retire tree-native artifacts, promote Todo App beyond `structure-only`, add CI enforcement, add invalid fixtures to
CI, approve required checks, execute repo-wide promotion, or replace user-controlled acceptance.

DEC-098 does not supersede DEC-095 or DEC-097. It operationalizes observation criteria for the executed limited scope
only while preserving fallback/reference artifacts, non-enforcing CI, Todo App structure-only status, and user
acceptance boundaries.

DEC-099 does not supersede DEC-073, DEC-097, or DEC-098. It identifies the next implementation branch and recommended
storage/projection direction, while leaving artifact creation, parser/generator implementation, CLI/workflow changes,
generated output refresh, repo-wide promotion, tree-native retirement, and enforcement as future work.

DEC-100 does not supersede DEC-073, DEC-097, DEC-098, or DEC-099. It implements the first bounded source artifact and
internal projection proof only. CLI exposure, generated projection output refresh, schema hardening, repo-wide source
storage, workflow integration, enforcement, and artifact retirement remain future work.

DEC-101 does not supersede DEC-073, DEC-097, DEC-098, DEC-099, or DEC-100. It exposes the first bounded graph-source
projection output path only. Workflow integration, validate-all registry changes, schema hardening, repo-wide source
storage, enforcement, tree retirement, invalid-fixture CI inclusion, and Todo App promotion remain future work.

DEC-102 does not supersede DEC-073, DEC-097, DEC-098, DEC-099, DEC-100, or DEC-101. It hardens the bounded Todo Search
source/projection contract only. Workflow integration, validate-all registry changes, enforcement, repo-wide source
authority, tree retirement, invalid-fixture CI inclusion, and Todo App promotion remain future work.
DEC-103 does not supersede DEC-073, DEC-097, DEC-098, DEC-099, DEC-100, DEC-101, or DEC-102. It integrates the bounded
projection contract into local validate-all only. Workflow changes, CI enforcement, repo-wide authority, tree
retirement, invalid-fixture CI inclusion, and Todo App promotion remain future work.

DEC-104 does not supersede DEC-073, DEC-097, DEC-098, DEC-099, DEC-100, DEC-101, DEC-102, or DEC-103. It exposes
the local projection contract status in non-enforcing CI artifacts only. Manual/PR observation is reviewed; enforcement,
repo-wide authority, tree retirement, invalid-fixture CI inclusion, and Todo App promotion remain future work.

DEC-105 supersedes only the DEC-101 statement that default Todo Search generation was unchanged. It does not supersede
DEC-097 through DEC-104 otherwise: the change is bounded to Todo Search generated read-model record sourcing and does
not change workflow triggers, enforcement, repo-wide authority, fallback retention, tree retirement, invalid-fixture CI,
or Todo App `structure-only` status.

DEC-106 does not supersede DEC-097 through DEC-105. It adds the first Todo App PBE Run graph-source candidate artifact
and focused candidate validation tests only. The artifact is structure-only review input, is not consumed by
`validate --all`, is not enrolled in CI or the positive registry, does not add parity/pilot-marker requirements, and does
not promote Todo App PBE Run beyond `structure-only`.

DEC-107 does not supersede DEC-097 through DEC-106. It exposes explicit projection for the Todo App PBE Run
structure-only candidate and commits the generated candidate projection artifact. The projection preserves the 22-node /
38-edge / 7-Core-View shape, but remains candidate Evidence only; it is not consumed by validate-all, is not enrolled in
CI or the positive registry, and does not promote Todo App PBE Run beyond `structure-only`.

DEC-108 does not supersede DEC-097 through DEC-107. It adds an internal committed-artifact contract check for the Todo
App PBE Run candidate projection only. The check preserves candidate/structure-only boundaries and rejects
source-authority creation or validate-all enrollment claims, while leaving positive validate-all, CI workflow behavior,
enforcement, and Todo App promotion unchanged.

DEC-109 does not supersede DEC-097 through DEC-108. It adds local `graph read-model observe-candidates` reporting for
candidate projection contracts outside positive validate-all semantics. The command can block on candidate projection
drift, but it does not modify the positive registry, aggregate summary, CI workflow, enforcement policy, or Todo App
source-authority status.

DEC-110 does not supersede DEC-097 through DEC-109. It captures `graph read-model observe-candidates` output in the
non-enforcing read-model Evidence workflow as separate CI artifact metadata and Step Summary fields only. Candidate
observation remains separate from `validateAllStatus`, `aggregateStatus`, the positive registry, enforcement, and Todo
App source-authority status.

DEC-111 does not supersede DEC-097 through DEC-110. It records manual CI review of candidate-observation artifact
capture in run `28221088498` and a small manifest artifact list fix before that review. The reviewed workflow remains
manual/PR informational only and does not enroll Todo App in positive validate-all, source authority, enforcement, or
promotion.

DEC-112 does not supersede DEC-097 through DEC-111. It records PR informational review of candidate-observation artifact
capture in PR #6 run `28221326457`. The review confirms PR metadata plus candidate observation fields while preserving
positive validate-all, aggregate status, non-enforcement, and Todo App `structure-only` boundaries.

DEC-113 does not supersede DEC-097 through DEC-112. It prepares the Todo App graph-source enrollment decision package
only. The recommended next safe branch is bounded non-authority enrollment in positive validate-all, but registry,
workflow, CLI behavior, source authority, Todo App promotion, enforcement, and tree retirement remain unchanged.

DEC-114 does not supersede DEC-097 through DEC-113. It implements bounded non-authority Todo App projection-contract
enrollment in local positive `validate --all` only. Todo App remains `structure-only`, not parity-backed,
not pilot-marker-backed, not source-authority-bearing, and not promoted. Workflow behavior, CI review, repo-wide
promotion, tree retirement, enforcement, invalid-fixture CI, and required checks remain future decisions.

DEC-115 does not supersede DEC-097 through DEC-114. It updates the main README to describe the current mixed
Graph-source transition state: Todo Search selected scope is limited Graph-source promoted and graph-source-backed,
tree-native artifacts remain source/fallback as applicable, Todo App remains structure-only/non-authority, and
repo-wide promotion, tree retirement, enforcement, and required checks remain incomplete.

DEC-116 does not supersede DEC-097 through DEC-115. It records manual CI review of Todo App bounded non-authority
projection-contract enrollment in run `28222731063`. The run confirms Todo App positive validate-all
`candidate-projection-contract-pass`, Todo Search `projection-contract-pass`, aggregate pass, and separate candidate
observation metadata, without workflow behavior changes, source authority expansion, promotion, or enforcement.

DEC-117 does not supersede DEC-097 through DEC-116. It records PR informational CI review of the same Todo App bounded
non-authority projection-contract enrollment in PR #7 run `28223010185`. The smoke PR was closed without merge and the
branch was deleted; no workflow behavior change, source authority expansion, promotion, enforcement, required check, or
tree retirement is introduced.

DEC-118 does not supersede DEC-097 through DEC-117. It adds local `npm run test:read-model:e2e` dogfood coverage for the
mixed Graph-source transition in a temporary workspace. The smoke checks Todo Search graph-source-backed
generate/compare/validate/projection, Todo App structure-only generate/validate/non-authority projection, validate-all
aggregate pass, and separate candidate observation without CI enforcement, required checks, repo-wide promotion, tree
retirement, or Todo App source-authority promotion.

DEC-119 does not supersede DEC-097 through DEC-118. It integrates the E2E smoke into the non-enforcing read-model
Evidence workflow as observation metadata and uploads `read-model-e2e-smoke-output.json`. The integration records
`e2eSmokeStatus` in the CI manifest and Step Summary without adding required checks, enforcement, repo-wide promotion,
tree retirement, or Todo App source-authority promotion.

DEC-120 does not supersede DEC-097 through DEC-119. It records manual CI review of E2E smoke observation in run
`28223860233`. The reviewed artifact confirms `e2eSmokeStatus: e2e-smoke-pass`, Todo Search
`projection-contract-pass`, Todo App `candidate-projection-contract-pass`, validate-all aggregate pass, and separate
candidate observation metadata without adding enforcement, repo-wide promotion, tree retirement, or Todo App
source-authority promotion.

DEC-121 does not supersede DEC-097 through DEC-120. It records PR informational review of E2E smoke observation in PR
#8 run `28224088829`. The smoke PR was closed without merge and the branch was deleted; the reviewed artifact confirms
the same E2E smoke, projection, validate-all, and candidate-observation statuses without adding enforcement, repo-wide
promotion, tree retirement, or Todo App source-authority promotion.

DEC-122 does not supersede DEC-097 through DEC-121. It makes Todo App PBE Run structure-only generation
graph-source-candidate-backed locally: `graph read-model generate --slice examples/valid/todo-app-pbe-run` reads
`graph-source-candidate.json`, preserves 22 nodes / 38 edges / 7 Core Views and validation pass, and records
`non-authority-structure-only` metadata. Todo App remains structure-only, candidate/non-promotional, not
source-authority-bearing, and not repo-wide promotion.

DEC-123 does not supersede DEC-097 through DEC-122. It records manual CI review of Todo App graph-source-candidate-backed
generation metadata in run `28224636333`. The reviewed artifact confirms `readModelSourceMode: graph-source-backed`,
`graphSourceAuthorityStatus: non-authority-structure-only`, Todo App 22/38/7 validation/projection pass, Todo Search
projection pass, E2E smoke pass, and validate-all aggregate pass without Todo App source-authority promotion,
repo-wide promotion, tree retirement, enforcement, or required checks.

DEC-124 does not supersede DEC-097 through DEC-123. It records PR informational CI review of the same Todo App
graph-source-candidate-backed generation metadata in PR #9 run `28224878648`. The smoke PR was closed without merge and
the branch was deleted; the reviewed artifact confirms PR metadata plus the same Todo App/Todo Search/E2E/validate-all
statuses without Todo App source-authority promotion, repo-wide promotion, tree retirement, enforcement, or required
checks.

DEC-125 does not supersede DEC-097 through DEC-124. It confirms Todo App PBE Run as a graph-source-backed
`structure-only` slice: `graph read-model generate --slice examples/valid/todo-app-pbe-run` reads
`examples/valid/todo-app-pbe-run/graph-source.json`, positive `validate --all` checks
`generated/graph-source-read-model-projection.json` as `projection-contract-pass`, and E2E smoke records
`confirmed-structure-only-graph-source`. This is graph-source confirmation only and does not add enforcement, required
checks, tree retirement, invalid-fixture CI, parity backing, pilot-marker backing, or promotion beyond `structure-only`.

DEC-126 does not supersede DEC-097 through DEC-125. It records manual run `28226270934` and PR #10 run `28226357099`
reviewing confirmed Todo App graph-source-backed metadata in non-enforcing CI. The reviewed artifacts record Todo App
`projection-contract-pass`, `structure-only-confirmed`, `confirmed-structure-only-graph-source`, 22 nodes / 38 edges /
7 Core Views, E2E smoke pass, validate-all aggregate pass, and uploaded `graph-source-read-model-projection.json`.
Workflow triggers remain manual plus PR informational; no enforcement, required check, tree retirement, invalid-fixture
CI, or promotion beyond `structure-only` is introduced.

DEC-127 does not supersede DEC-097 through DEC-126. It records repo-wide Graph-source transition mechanics after Todo
Search and Todo App PBE Run both became graph-source-backed configured read-model slices.
`examples/read-model-aggregate/graph-source-transition-status.json` records the confirmed source direction, Todo Search
as `limited-graph-source-promoted`, Todo App as `confirmed-structure-only-graph-source`, and tree-native artifacts as
compatibility/fallback/reference. The slice registry is marked `active-consumed-by-validate-all`, and the local E2E
smoke checks the status artifact. This mechanics step does not retire tree-native artifacts, add required checks, enable
CI enforcement, include invalid fixtures in CI, or promote Todo App beyond `structure-only`.

DEC-128 does not supersede DEC-097 through DEC-127. It adds native and retrofit intent-critical Graph-source maintenance
examples under `examples/intent-critical/` plus focused tests. The examples record UX/acceptance intent, non-goals,
fallback/rollback reasons, evidence reasons, and compatibility reasons so AI-assisted maintenance cannot silently change
behavior when original intent is missing. This is example/validation surface only; it does not add tree retirement,
enforcement, required checks, invalid-fixture CI, or repo-wide source authority expansion.

DEC-129 does not supersede DEC-097 through DEC-128. It records the edge-level intent vocabulary direction:
Graph-source remains the single source direction, intent is primarily graph edge annotation, node intent is supporting
context, concrete intent stays as short project-specific edge `claim` text, and vocabulary/table values are limited to
repeatable classifications such as type, intent kind, risk kind, signal kind, confidence, enforcement, source role, and
lifecycle status. Native and retrofit PBE use the same edge-intent model and differ by signal origin/confidence only.
This is design/fixture alignment only and does not add broad schema enforcement, required checks, tree retirement, or a
separate intent source.

DEC-130 does not supersede DEC-097 through DEC-129. It adds a minimal intent-critical projection surface for the native
and retrofit fixtures: `generated/edge-intent-read-model-projection.json` preserves edge-level intent classifications,
project-specific `claim`, confidence, enforcement, anchors, and a human-readable summary. Focused tests compare the
projection against the source `edgeIntent` and prove the claim is not replaced by enum/table vocabulary. This remains
intent projection surface only and is not integrated into broad validate-all, enforcement, required checks, or tree
retirement.

DEC-131 does not supersede DEC-097 through DEC-130. It adds the small `graph read-model project-intent --graph-source
<path> --output <path> --json` CLI/report surface for intent-critical native/retrofit fixtures. The command regenerates
the existing edge-intent read-model projection shape, preserves project-specific claims and vocabulary classifications,
and reports clear validation failures when required classifications or anchors are missing. It remains separate from
broad validate-all, enforcement, required checks, and tree retirement.

DEC-132 does not supersede DEC-097 through DEC-131. It adds non-enforcing CI observation of the native and retrofit
edgeIntent projection command to `.github/workflows/read-model-evidence.yml`. The workflow now records
`edgeIntentProjectionObservationStatus` in the CI manifest and Step Summary and uploads the native/retrofit projection
files plus command outputs. This is intent projection CI observation only and does not integrate intent projection into
broad validate-all enforcement, required checks, or tree retirement.

DEC-133 does not supersede DEC-097 through DEC-132. It records manual workflow run `28346777344` reviewing the new
edgeIntent projection CI observation surface. The artifact manifest records
`edgeIntentProjectionObservationStatus: edge-intent-projection-pass`, native and retrofit command outputs both report
`intent-projection-pass`, both projection artifacts are uploaded, validate-all remains `aggregate-pass`, and the E2E
smoke remains `e2e-smoke-pass`. This review does not add PR-required enforcement, broad intent schema enforcement, or
tree retirement.

DEC-134 does not supersede DEC-097 through DEC-133. It records PR #11 run `28346897073` reviewing the same edgeIntent
projection CI observation surface in `pull_request-informational` mode. The smoke PR was closed without merge and its
remote branch was deleted; the reviewed artifact confirms PR metadata, `edgeIntentProjectionObservationStatus:
edge-intent-projection-pass`, native and retrofit `intent-projection-pass`, validate-all `aggregate-pass`, and E2E smoke
pass without required checks, broad intent schema enforcement, or tree retirement.

DEC-135 does not supersede DEC-097 through DEC-134. It adds the local
`graph read-model report-intent --json` report/validation surface for native and retrofit edgeIntent projections. The
report summarizes fixture count, edgeIntent count, claim count, classification count, anchor count, missing
classification count, and missing anchor count, and blocks locally when required classifications or anchors are missing.
It remains local intent report/validation only and does not add broad validate-all intent enforcement, required checks,
or tree retirement.

DEC-136 does not supersede DEC-097 through DEC-135. It adds `report-intent` coverage to the local
`npm run test:read-model:e2e` smoke. The smoke now verifies `intent-report-pass`, native/retrofit summaries, nonzero
edgeIntent/claim/classification/anchor counts, and zero missing classification/anchor counts while preserving the same
non-enforcing E2E boundary.

DEC-137 does not supersede DEC-097 through DEC-136. It records manual workflow run `28348764191` reviewing the E2E
smoke after `report-intent` coverage was added. The artifact manifest records `e2eSmokeStatus: e2e-smoke-pass`, and the
uploaded E2E output records `intentReport.status: intent-report-pass`, native/retrofit fixture summaries, nonzero
edgeIntent/claim/classification/anchor counts, zero missing classification/anchor counts, and validate-all
`aggregate-pass`. This remains manual CI observation only and does not add broad intent schema enforcement, required
checks, or tree retirement.

DEC-138 does not supersede DEC-097 through DEC-137. It records PR #12 run `28348903718` reviewing the same E2E
`intentReport` visibility in `pull_request-informational` mode. The smoke PR was closed without merge and its remote
branch was deleted; the reviewed artifact confirms PR metadata, `e2eSmokeStatus: e2e-smoke-pass`,
`intentReport.status: intent-report-pass`, native/retrofit summaries, zero missing classification/anchor counts, and
validate-all `aggregate-pass` without broad intent schema enforcement, required checks, or tree retirement.

DEC-139 does not supersede DEC-097 through DEC-138. It records tree-native compatibility/fallback/reference retirement
readiness criteria in `examples/read-model-aggregate/graph-source-transition-status.json` and verifies those fields in
the local E2E smoke. Current readiness remains `retirement-not-ready`: Todo Search is
`closer-but-not-retirement-ready` pending explicit retirement approval, and Todo App is `not-retirement-ready` because
source authority beyond `structure-only` is not approved. This is retirement criteria/readiness only and does not retire
tree-native artifacts, add enforcement, or enable required checks.

DEC-140 does not supersede DEC-097 through DEC-139. It prepares
`tree-native-retirement-approval-package.md` and status-artifact references for Todo Search, Todo App PBE Run, and
repo-wide tree-native retirement decisions. Todo Search is classified as `approval-candidate-not-approved`; Todo App is
`not-ready-structure-only`; repo-wide retirement is `not-ready`. The E2E smoke verifies those package statuses, but no
tree-native artifact is retired, deprecated, deleted, enforced, or required-check gated.

DEC-141 does not supersede DEC-097 through DEC-140. It adds local
`graph read-model report-health --json` as a non-enforcing Graph-source transition health summary. The report reads
existing validate-all aggregate output, projection contracts, edgeIntent report health, transition status, retirement
readiness, and retirement approval package statuses. It is local reporting only and does not rerun E2E, mutate generated
artifacts, add required checks, enforce CI, or approve tree-native retirement.

DEC-142 does not supersede DEC-097 through DEC-141. It captures `graph read-model report-health --json` in the
non-enforcing read-model Evidence workflow and records manual run `28350824272` reviewing
`healthReportStatus: graph-source-health-pass`, validate-all `aggregate-pass`, edgeIntent `intent-report-pass`,
retirement readiness `retirement-not-ready`, and enforcement status `non-enforcing`. This is CI observation only and
does not add required checks, enforcement, or tree-native retirement.

DEC-143 does not supersede DEC-097 through DEC-142. It records PR #13 run `28351078223` reviewing the same graph-source
health report visibility in `pull_request-informational` mode. The reviewed artifact confirms PR metadata,
`healthReportStatus: graph-source-health-pass`, validate-all `aggregate-pass`, edgeIntent `intent-report-pass` with 2
edgeIntent records, retirement readiness `retirement-not-ready`, and enforcement status `non-enforcing`; the smoke PR
was closed unmerged and its branch/temp artifacts were removed. This remains PR health CI observation only and does not
add actual retirement, enforcement, or required checks.

DEC-144 does not supersede DEC-097 through DEC-143. It adds a human-readable Markdown companion output for
`graph read-model report-health --json --markdown <path>` and includes `read-model-health-report-output.md` in the
non-enforcing read-model Evidence workflow artifact bundle, manifest, and Step Summary. The Markdown summary improves
review discoverability for overall health, source status, validate-all/E2E/edgeIntent status, retirement readiness,
retirement package status, boundaries, and reproduction commands. It does not add actual retirement, enforcement,
required checks, or source authority changes.

DEC-145 does not supersede DEC-097 through DEC-144. It records manual workflow run `28351612200` reviewing the health
Markdown summary artifact after DEC-144. The artifact bundle includes
`examples/read-model-aggregate/generated/read-model-health-report-output.md`; the CI manifest includes the Markdown
artifact path; the Markdown content includes overall health, Todo Search/Todo App source status, validate-all,
edgeIntent, retirement readiness/package status, non-enforcement boundaries, and reproduction commands. This remains
manual CI observation only and does not add actual retirement, enforcement, or required checks.

DEC-146 does not supersede DEC-097 through DEC-145. It records PR #14 run `28351775566` reviewing health Markdown
summary artifact visibility in `pull_request-informational` mode. The reviewed artifact confirms PR metadata,
`read-model-health-report-output.md` presence, manifest artifact-path visibility, `graph-source-health-pass`,
`aggregate-pass`, `intent-report-pass`, retirement readiness/package statuses, and the `non-enforcing` boundary. The
smoke PR was closed unmerged and its branch/temp artifacts were removed. This remains PR health Markdown observation
only and does not add actual retirement, enforcement, or required checks.

DEC-147 does not supersede DEC-097 through DEC-146. It applies narrow Todo Search fallback/reference deprecation
mechanics only: tree-native selected-slice artifacts are now marked `deprecated-fallback-reference-not-deleted`, not
source for graph-source-backed Todo Search read-model generation, and still retained for rollback. Todo App remains
`not-ready-structure-only`, repo-wide retirement remains `not-ready`, no files are deleted, and no required check,
branch protection, or enforcement setting is enabled.

DEC-148 does not supersede DEC-097 through DEC-147. It adds non-enforcing CI observation for the PBE operation-chain
dogfood package by running `scripts/invoke-pbe-v0.ps1 -Command operation-chain` and `-Command evaluate-dogfood` in the
read-model Evidence workflow. The CI manifest, Step Summary, and artifact bundle now expose `operationChainStatus`,
`dogfoodEvaluationStatus`, and the generated `outputs/` reports. This is observation only and does not add required
checks, branch protection, tree retirement, enforcement, or source-authority expansion.

DEC-149 does not supersede DEC-097 through DEC-148. It records manual workflow run `28423595270` reviewing the
operation-chain CI observation after a failed first run exposed Linux path and BOM parsing portability gaps. The
successful rerun records `ci-evidence-pass`, `operationChainStatus: pbe-operation-chain-pass`, and
`dogfoodEvaluationStatus: pbe-dogfood-evaluation-pass`, with both `outputs/pbe-operation-chain` reports present in the
artifact bundle. This remains non-enforcing CI observation only.

DEC-150 does not supersede DEC-097 through DEC-149. It records PR #15 run `28423731988` reviewing the same
operation-chain CI observation in `pull_request-informational` mode. The artifact manifest includes PR metadata,
`operationChainStatus: pbe-operation-chain-pass`, and `dogfoodEvaluationStatus: pbe-dogfood-evaluation-pass`; the
operation-chain and dogfood reports are present in the artifact bundle. The temporary PR was closed unmerged and the
smoke branch was deleted. This remains non-enforcing CI observation only.

DEC-151 does not supersede DEC-097 through DEC-150. It records the first real external operation-chain dogfood against a
local `mdn/todo-vue` checkout at `8a7ef579f1d117a8ac9530a52f5c5a81c3e99676`. PBE recovered a bounded retrofit graph
source, generated an instruction pack, applied only a local README clarification, captured a graph delta with one dirty
file and three additions, and generated a graph update proposal without mutating graph-source. `npm ci` passed, while
`npm run build` was recorded as blocked by the local Node/toolchain baseline rather than the selected README-only slice.
No upstream PR, maintainer approval claim, required check, enforcement, source-authority expansion, or tree retirement is
introduced.

DEC-152 does not supersede DEC-097 through DEC-151. It records the first real external behavior-change dogfood against a
local `component/escape-html` checkout at `b42947eefa79efff01b3fe988c4c7e7b051ec8d8`. PBE recovered stringification and
escaping intent from README/source/tests, generated an instruction pack, applied a bounded code/test change
(`String(value)` coercion plus a Symbol assertion), passed the external project's `npm test` suite with 31 tests, captured
a graph delta for `index.js` and `test/index.js`, and generated a graph update proposal without mutating graph-source.
No upstream PR, maintainer approval claim, required check, enforcement, source-authority expansion, or tree retirement is
introduced.

DEC-153 does not supersede DEC-097 through DEC-152. It adds `pbe graph operation apply-proposal` as the first CLI surface
for graph update proposal review/application. The command defaults to dry-run preview, validates proposal/delta/source
alignment and stale current-state boundaries, and only writes graph-source node/record status fields when explicit
`--apply` is provided. This is implementation/UX completion for the proposal application flow; it does not apply target
code patches, create upstream PRs, enable enforcement, add required checks, or retire tree-native artifacts.

DEC-154 does not supersede DEC-097 through DEC-153. It adds `pbe graph operation run-chain` as a CLI wrapper around the
existing plugin-local operation-chain script. `--dry-run` returns the wrapped command plan without executing PowerShell;
running without `--dry-run` delegates to `scripts/invoke-pbe-v0.ps1` and preserves the script's existing output behavior.
This improves implementation/UX by removing the need to remember the script path. It does not replace the script
implementation, apply graph proposals, enable enforcement, add required checks, or retire tree-native artifacts.

DEC-155 does not supersede DEC-097 through DEC-154. It adds `pbe graph retrofit plan` as a target-safe retrofit start UX.
The command reads an active retrofit graph-source and reports target summary, implementation-ready records, retained
reference records, forbidden-flow boundaries, edgeIntent coverage, and next inputs before instruction-pack generation or
target-code changes. It does not mutate the target project, apply patches, infer maintainer approval, enable enforcement,
or retire tree-native artifacts.

DEC-156 does not supersede DEC-097 through DEC-155. It adds explicit CLI operation-chain steps:
`pbe graph operation generate-pack`, `pbe graph operation capture-delta`, and `pbe graph operation propose-update`.
Together they cover graph-source record selection, instruction-pack generation, target git-diff capture, graph-delta
creation, and graph update proposal generation without requiring users to call the underlying PowerShell scripts
directly. `generate-pack` preserves the existing `generated-from-graph-source` instruction-pack status,
`capture-delta` blocks dirty files outside the allowed instruction-pack scope, and `propose-update` creates a
review-required graph update proposal. These commands do not patch target repos, mutate graph-source automatically,
claim maintainer approval, enable enforcement, add required checks, or retire tree-native artifacts.

DEC-157 does not supersede DEC-097 through DEC-156. It adds the user-facing Graph Operation Runbook and
`npm run test:graph-operation:flow` smoke. The runbook gives the practical sequence from graph inspection through
instruction-pack generation, bounded target change, graph-delta capture, graph update proposal generation,
`apply-proposal` preview, and explicit `--apply`. The smoke creates an isolated temporary target git repo and exercises
that CLI sequence without touching external projects or committed graph-source fixtures. This improves usability and
regression coverage only; it does not add required checks, enforcement, target patching, upstream PR creation, source
authority expansion, or tree-native retirement.

DEC-158 does not supersede DEC-097 through DEC-157. It adds a read-only large external KEP retrofit dogfood fixture for
Kubernetes KEP-753 Sidecar Containers. The fixture maps formal KEP intent from `kubernetes/enhancements` to related
`kubernetes/kubernetes` source/test surfaces, forbidden boundaries, and an instruction-pack-ready record without cloning
or mutating Kubernetes. Focused tests verify `graph retrofit plan` and `graph operation generate-pack` can read the
fixture, preserve edgeIntent coverage, expose forbidden boundaries, and keep external mutation disabled. This does not
run Kubernetes tests, claim maintainer approval, create upstream PRs, enroll Kubernetes in positive validate-all, add
enforcement, or expand source authority.

DEC-159 does not supersede DEC-097 through DEC-158. It expands the Kubernetes KEP-753 retrofit fixture from broad
source/test surfaces to exact KEP section, code symbol, and test anchors. The graph now records symbols such as
`IsRestartableInitContainer`, `computeInitContainerActions`, and `AggregateContainerRequests`, plus unit/e2e test anchors
for restartable init-container behavior. Focused tests verify the expanded anchor map and updated graph counts. This
remains read-only external dogfood Evidence and still does not clone or mutate Kubernetes, run Kubernetes tests, claim
maintainer approval, create upstream PRs, enable enforcement, or expand source authority.

DEC-160 does not supersede DEC-097 through DEC-159. It adds the Compiler Boundary MVP: a compiler-required vs
AI-advisory task registry, an Execution Contract MVP schema, a Todo Search dry-run execution contract fixture, the local
`pbe graph read-model report-compiler-boundary --json` report command, and health/E2E observation of compiler boundary
status. This proves that execution-affecting contract facts can be validated as compiler-owned artifacts before AI
execution. It remains non-enforcing and does not enable required checks, branch protection, automatic AI execution,
acceptance, graph delta application, source-authority expansion, or tree-native retirement.

DEC-161 does not supersede DEC-097 through DEC-160. It hardens the Compiler Boundary MVP as a Contract Fixture Validator:
registry, schema, and dry-run contract issues are bucketed separately; boundary-principle, status, source-mode, scope,
check, Evidence, stop-condition, unknown, risk, and human-decision shapes are validated more strictly; and the current
layer is explicitly separated from a future Actual Contract Compiler. This remains non-enforcing and does not enable
required checks, branch protection, automatic AI execution, graph delta application, acceptance, source-authority
expansion, or tree-native retirement.

DEC-162 does not supersede DEC-097 through DEC-161. It closes the next Compiler Boundary validator gaps: high, critical,
and blocking risks now require a linked accepted or mitigated human decision even when the risk itself claims
`mitigated`; schema field authorities, Evidence freshness, stop-condition actions, human-decision statuses, and
human-decision targets are checked against bounded vocabularies or known ids; and a durable invalid fixture records the
self-mitigated high-risk case. This remains Contract Fixture Validator hardening only and does not create an Actual
Contract Compiler, required check, branch protection rule, automatic AI execution path, acceptance authority, graph delta
application, source-authority expansion, or tree-native retirement.

DEC-163 does not supersede DEC-097 through DEC-162. It adds the Compiler Input Model MVP: a machine-readable schema,
Todo Search dry-run input fixture, and local `graph read-model report-compiler-input --json` command that validate the
input surface a future Actual Contract Compiler may consume. The MVP defines human request, graph snapshot, pack schema,
policy snapshot, evidence index, and target scope candidates as inputs and explicitly blocks compiled contract claims
inside the input fixture. This remains non-executing and does not create an Actual Contract Compiler, required check,
branch protection rule, automatic AI execution path, graph delta application, acceptance authority, source-authority
expansion, or tree-native retirement.

DEC-164 does not supersede DEC-097 through DEC-163. It hardens the Compiler Input Model MVP with cross-reference
validation: graph snapshot and evidence artifact paths must exist, target scope candidate paths must exist,
`graph-source:node:<id>` derivations must resolve to known graph-source node ids, pack schema required groups must use
known input groups, and policy/status/freshness/scope-kind/confidence values must stay within bounded vocabularies. This
remains input validation only and does not create an Actual Contract Compiler, required check, branch protection rule,
automatic AI execution path, graph delta application, acceptance authority, source-authority expansion, or tree-native
retirement.

DEC-165 does not supersede DEC-097 through DEC-164. It adds Contract Compiler Dry-Run v0: a local deterministic compiler
surface that consumes the current validated Compiler Input Model `bug_fix` fixture, writes a candidate
`execution-contract-dry-run.generated.json`, and feeds that candidate back through the Contract Fixture Validator. This
is still non-executing and non-enforcing. It does not execute AI, apply graph deltas, accept work, enable required
checks, configure branch protection, expand source authority, or retire tree-native artifacts.

DEC-166 does not supersede DEC-097 through DEC-165. It hardens Contract Compiler Dry-Run to v0.1: compiler-produced
candidates now use `sourceMode: contract-compiler-dry-run-v0`, unsupported inputs report `contract-candidate-not-run`,
Evidence/check derivation comes from `policySnapshot.evidenceCheckMappings`, forbidden-scope derivation comes from
`policySnapshot.forbiddenScopeRules`, and the compiler writes a generated-vs-hand-written diff report at
`examples/read-model-aggregate/generated/execution-contract-dry-run.diff.json`. This remains dry-run Evidence only and
does not execute AI, apply graph deltas, accept work, enable required checks, configure branch protection, expand source
authority, or retire tree-native artifacts.

DEC-167 does not supersede DEC-097 through DEC-166. It clarifies Contract Compiler Dry-Run review semantics:
`contract-compiler-dry-run-pass` and `contract-candidate-pass` do not imply compiler/hand-written equivalence. Health,
E2E, and the diff artifact now expose `non-blocking-review-diff` and `compiler-equivalence-not-proven` while a diff is
present. The diff report also includes id-based summaries for scopes, checks, and Evidence, and compiler input
validation requires `policy:<id>` forbidden-scope derivations to resolve to known `policySnapshot.policies[].id` values.
Supported-but-uncompilable inputs now report `contract-candidate-blocked`, while unsupported inputs remain
`contract-candidate-not-run`. This remains dry-run review Evidence only and does not execute AI, apply graph deltas,
accept work, enable required checks, configure branch protection, expand source authority, or retire tree-native
artifacts.

DEC-168 does not supersede DEC-097 through DEC-167. It classifies Contract Compiler Dry-Run generated-vs-hand-written
diffs with fixture-specific semantic review metadata: `semanticDiffs[]`, `semanticClassificationCounts`,
`highestReviewSeverity`, and `compilerPromotionReadiness`. Current rules classify missing allowed scope as
`conservative-restriction`, missing forbidden scope as `policy-loss`, extra forbidden scope as `policy-expansion`, extra
checks as `safe-additive`, missing checks or extra Evidence as `evidence-chain-mismatch`, and missing Evidence as
`semantic-loss`. The current Todo Search dry-run remains `compiler-promotion-not-ready` because semantic/policy losses
block promotion readiness. This remains non-enforcing review metadata only and does not execute AI, apply graph deltas,
accept work, enable required checks, configure branch protection, expand source authority, or retire tree-native
artifacts.

DEC-169 does not supersede DEC-097 through DEC-168. It hardens semantic diff classification into an explicit dry-run
v0.1 rule table with `ruleId`, `targetField`, `condition`, `classification`, `reviewSeverity`, `promotionImpact`, and
`reason`. Each `semanticDiffs[]` entry records `matchedRuleId`; unmatched field differences use
`semantic-diff-rule-unknown`, are counted in `semanticDiffRuleCoverage`, and prevent promotion readiness. The
`compilerPromotionReadiness` value is derived from semantic diffs rather than asserted separately. This remains
non-enforcing review metadata only and does not execute AI, apply graph deltas, accept work, enable required checks,
configure branch protection, expand source authority, or retire tree-native artifacts.

DEC-170 does not supersede DEC-097 through DEC-169. It triages Contract Compiler Dry-Run unknown semantic diffs:
`sourceMode` and `nonExecutionStatement` are classified as `metadata-only`, while `requiredContext`, `knownRisks`, and
`stopConditions` are now covered by id-based semantic summaries and explicit rules. The remaining unknown field is
`outputRequirements`, recorded as unclassified review debt in `semanticDiffRuleCoverage.unknownFields`. This remains
non-enforcing review metadata only and does not execute AI, apply graph deltas, accept work, enable required checks,
configure branch protection, expand source authority, or retire tree-native artifacts.

DEC-171 does not supersede DEC-097 through DEC-170. It closes the current Contract Compiler Dry-Run unknown semantic
diff set by classifying `outputRequirements` as `output-requirement-loss`. The generated candidate replaces the
hand-written obligations to report actual git-diff changed files and command-derived Evidence status with compiler
input/candidate/diff status reporting, so output obligations are not equivalent and compiler promotion remains
`compiler-promotion-not-ready`. The current dry-run diff set is fully classified, but this remains non-enforcing review
metadata only and does not execute AI, apply graph deltas, accept work, enable required checks, configure branch
protection, expand source authority, or retire tree-native artifacts.

DEC-172 does not supersede DEC-097 through DEC-171. It closes Contract Compiler Dry-Run v0.1 hardening as
classification-complete, not equivalence-proven: the diff artifact and health report now expose
`contract-compiler-dry-run-v0.1-classification-complete`, `semantic-diff-unknowns-zero`,
`semanticDiffCoverageComplete: true`, and `equivalenceProven: false`. v0.1 proves deterministic candidate generation,
contract revalidation, diff detection, semantic classification, zero unknown coverage, and readiness derivation; it does
not prove semantic equivalence, execution readiness, output requirement preservation, source-authority completeness, or
arbitrary changeType support. The recommended v0.2 direction is Output Requirement Source Authority or a
source-authority resolver before pack-schema widening. This remains non-enforcing review metadata only and does not
execute AI, apply graph deltas, accept work, enable required checks, configure branch protection, expand source
authority, or retire tree-native artifacts.

DEC-173 does not supersede DEC-097 through DEC-172. It begins Contract Compiler Dry-Run v0.2 as Output Requirement
Source Authority preview only. The Compiler Input Model dry-run fixture now includes `outputRequirementSources[]`, and
the compiler writes `output-requirement-source-authority.preview.json` showing source authority entries, derived output
requirement candidates, hand-written output requirement mappings, generated preservation status, and unresolved
obligations. At that preview-only stage, the preview explained `output-requirement-loss` as source authority being
present while compiler output mapping was not yet applied. It does not rewrite generated output requirements, prove
equivalence, execute AI, apply
graph deltas, accept work, enable required checks, configure branch protection, expand source authority, retire
tree-native artifacts, or widen changeType support.

DEC-174 does not supersede DEC-097 through DEC-173. It connects Output Requirement Source Authority to the current
Contract Compiler Dry-Run candidate for `outputRequirements` only. Generated output requirements are now derived from
`outputRequirementSources[]` and no longer copied from the hand-written comparison contract or replaced by compiler
self-reporting. The preview now reports `generated-output-requirements-preserved` with zero unresolved output
obligations for the current Todo Search `bug_fix` fixture, while `equivalenceProven` remains false and
`compilerPromotionReadiness` remains `compiler-promotion-not-ready` because other semantic and policy losses remain.
This does not execute AI, apply graph deltas, accept work, enable required checks, configure branch protection, expand
source authority beyond output requirements, retire tree-native artifacts, or widen changeType support.

DEC-175 does not supersede DEC-097 through DEC-174. It adds a non-enforcing Contract Source Authority Gap Preview for
the remaining semantic/policy losses after output requirement preservation. The compiler writes
`contract-source-authority-gap.preview.json`, summarizing field-level gaps for `allowedScope`, `forbiddenScope`,
`requiredContext`, `requiredEvidence`, `knownRisks`, and `stopConditions`, including missing/extra ids, candidate
source-authority types, remaining loss counts, and one next recommended resolver. The current recommendation is
`policy-forbidden-scope-source-authority` because `forbiddenScope` still has policy-loss. This is review metadata only:
it does not implement the resolver, execute AI, apply graph deltas, accept work, enable required checks, configure
branch protection, expand source authority, retire tree-native artifacts, or widen changeType support.

DEC-176 does not supersede DEC-097 through DEC-175. It connects the policy forbidden-scope source authority resolver to
the current Contract Compiler Dry-Run candidate for `forbiddenScope` only. Generated forbidden scope is now derived from
`policySnapshot.forbiddenScopeRules[]`; the hand-written dry-run contract remains a comparison fixture and is not a
compiler source. The generated-vs-hand-written diff no longer reports forbidden-scope policy-loss for the current Todo
Search `bug_fix` fixture. The source-authority gap preview now reports four remaining losses, keeps
`compilerPromotionReadiness` as `compiler-promotion-not-ready`, keeps `equivalenceProven` false, and recommends
`stop-condition-source-authority` as the next narrow resolver. This does not execute AI, apply graph deltas, accept work,
enable required checks, configure branch protection, expand source authority beyond forbidden scope, retire tree-native
artifacts, or widen changeType support.

DEC-177 does not supersede DEC-097 through DEC-176. It connects stop-condition source authority to the current Contract
Compiler Dry-Run candidate for `stopConditions` only. The Compiler Input Model now includes `stopConditionSources[]`,
and generated stop conditions are derived from those source authority entries rather than from the hand-written
comparison contract. The generated-vs-hand-written diff no longer reports stop-condition policy-loss for the current
Todo Search `bug_fix` fixture. The source-authority gap preview now reports three remaining semantic losses, zero
remaining policy losses, keeps `compilerPromotionReadiness` as `compiler-promotion-not-ready`, keeps
`equivalenceProven` false, and recommends `evidence-source-authority` as the next narrow resolver. This does not execute
AI, apply graph deltas, accept work, enable required checks, configure branch protection, expand source authority beyond
stop conditions, retire tree-native artifacts, or widen changeType support.

DEC-178 does not supersede DEC-097 through DEC-177. It connects Evidence source authority to the current Contract
Compiler Dry-Run candidate for `requiredEvidence` only. Generated required Evidence is now derived from
`evidenceIndex.entries[]` plus `policySnapshot.evidenceCheckMappings[]`; the hand-written dry-run contract remains a
comparison fixture and is not a compiler source. The generated-vs-hand-written diff no longer reports required-Evidence
semantic loss or evidence-chain mismatch for the current Todo Search `bug_fix` fixture. The source-authority gap preview
now reports two remaining semantic losses, zero remaining policy losses, keeps `compilerPromotionReadiness` as
`compiler-promotion-not-ready`, keeps `equivalenceProven` false, and recommends `context-source-authority` as the next
narrow resolver. This does not execute AI, apply graph deltas, accept work, enable required checks, configure branch
protection, expand source authority beyond required Evidence, retire tree-native artifacts, or widen changeType support.

DEC-179 does not supersede DEC-097 through DEC-178. It connects context source authority to the current Contract Compiler
Dry-Run candidate for `requiredContext` only. Generated required context is now derived from
`graphSnapshot.artifacts[]`; the hand-written dry-run contract remains a comparison fixture and is not a compiler source.
The generated-vs-hand-written diff no longer reports required-context semantic loss for the current Todo Search
`bug_fix` fixture. The source-authority gap preview now reports one remaining semantic loss, zero remaining policy
losses, keeps `compilerPromotionReadiness` as `compiler-promotion-not-ready`, keeps `equivalenceProven` false, and
recommends `risk-source-authority` as the next narrow resolver. This does not execute AI, apply graph deltas, accept
work, enable required checks, configure branch protection, expand source authority beyond required context, retire
tree-native artifacts, or widen changeType support.

DEC-180 does not supersede DEC-097 through DEC-179. It connects risk source authority to the current Contract Compiler
Dry-Run candidate for `knownRisks` only. The Compiler Input Model now includes `riskSources[]`, and generated known risks
are derived from those source authority entries rather than from the hand-written comparison contract or ad hoc compiler
self-risk text. The generated-vs-hand-written diff no longer reports known-risk semantic loss for the current Todo Search
`bug_fix` fixture. The source-authority gap preview now reports zero remaining semantic/policy losses, keeps
`compilerPromotionReadiness` as `compiler-promotion-not-ready` because allowed scope still has conservative review debt,
keeps `equivalenceProven` false, and recommends `allowed-scope-source-authority` as the next narrow resolver. This does
not execute AI, apply graph deltas, accept work, enable required checks, configure branch protection, expand source
authority beyond known risks, retire tree-native artifacts, or widen changeType support.

DEC-181 does not supersede DEC-097 through DEC-180. It connects allowed-scope source authority to the current Contract
Compiler Dry-Run candidate for `allowedScope` only. Generated allowed scope is now derived from
`targetScopeCandidates[]`, which keep graph-backed source references and optional contract-facing derivation references;
the hand-written dry-run contract remains a comparison fixture and is not a compiler source. The generated-vs-hand-
written diff no longer reports allowed-scope conservative review debt for the current Todo Search `bug_fix` fixture. The
source-authority gap preview now reports zero remaining semantic/policy losses, no fields requiring another resolver,
`nextRecommendedResolver: none`, `compilerPromotionReadiness: compiler-promotion-review-required`, and
`equivalenceProven: false` because review-only differences such as source mode, additive health check, and boundary
wording remain. This does not execute AI, apply graph deltas, accept work, enable required checks, configure branch
protection, expand source authority beyond allowed scope, retire tree-native artifacts, widen changeType support, or
promote the compiler candidate to an execution source.

DEC-182 does not supersede DEC-097 through DEC-181. It adds a Contract Compiler equivalence/readiness policy summary
after v0.2 source-authority reconstruction. The diff artifact and health report now separate
`source-authority-preserved`, `semantic-diff-clean`, `review-only-diff-detected`, `equivalenceCandidate: true`,
`equivalenceProven: false`, and `compiler-promotion-review-required`. This makes the current Todo Search `bug_fix`
candidate reviewable as an equivalence candidate while explicitly refusing to treat it as equivalence-proven or
authoritative. It does not execute AI, apply graph deltas, accept work, enable required checks, configure branch
protection, expand source authority, retire tree-native artifacts, widen changeType support, or promote the compiler
candidate to an execution source.

DEC-183 does not supersede DEC-097 through DEC-182. It adds the Contract Compiler Promotion Review Policy and the
generated `contract-compiler-promotion-review.preview.json` packet. The packet collects the generated candidate,
hand-written comparison fixture, semantic diff artifact, source-authority previews, validation commands, explicit
non-goals, and human checklist so a later reviewer can approve, reject, or request changes. Current status is
`promotion-review-ready-for-human` with `approvalStatus: not-approved`, `equivalenceCandidate: true`, and
`equivalenceProven: false`. This does not approve compiler promotion, accept user work, execute AI, apply graph deltas,
enable required checks, configure branch protection, introduce CI enforcement, retire tree-native artifacts, widen
changeType support, or make the generated contract authoritative.

DEC-184 does not supersede DEC-097 through DEC-183. It hardens the remaining Contract Compiler Promotion Review
review-only diffs by classifying them as `source-mode-metadata-only`, `validation-superset-review-only`, and
`boundary-wording-review-required`. The review packet now records required human checks and acceptance risk for each
review-only diff, and health reports whether boundary wording review is required. `equivalenceCandidate` may remain
true, but `equivalenceProven` remains false and `approvalStatus` remains `not-approved`. This does not approve compiler
promotion, accept user work, execute AI, apply graph deltas, enable required checks, configure branch protection,
introduce CI enforcement, retire tree-native artifacts, widen changeType support, or make the generated contract
authoritative.

DEC-185 does not supersede DEC-097 through DEC-184. It records the first human review decision for the DevView Contract
Compiler Promotion Review Packet, scoped only to the current Todo Search whitespace-normalization `bug_fix` dry-run
fixture, current generated candidate, and current promotion review packet. The decision status is
`approved-for-current-fixture-promotion-review`: the reviewer accepts the review-only diffs for this fixture's promotion
review packet, including source-mode provenance, additive non-enforcing health-check validation, and boundary wording
after the DevView boundary audit. This is a docs-only decision record. It does not set `equivalenceProven: true`, does
not update generated `approvalStatus`, does not approve arbitrary fixtures or change types, does not execute AI, apply
graph deltas, accept user work, enable required checks, configure branch protection, introduce CI enforcement, retire
tree-native artifacts, rename PBE compatibility surfaces, or make the generated contract authoritative.

DEC-186 does not supersede DEC-097 through DEC-185. It selects the `component/escape-html` Symbol stringification
behavior-change dogfood as the second/calibration fixture candidate for Contract Compiler Dry-Run generalization
observation. The selection is planning-only: the fixture has graph source, instruction pack, graph delta, graph update
proposal, and external project test Evidence, making it meaningfully different from the current Todo Search
whitespace-normalization `bug_fix` fixture. This does not implement compiler support for the second fixture, mark it as
supported, generalize the current human decision, set `equivalenceProven: true`, update generated `approvalStatus`,
execute AI, apply graph deltas, accept user work, enable required checks, configure branch protection, introduce CI
enforcement, retire tree-native artifacts, widen changeType support, rename PBE compatibility surfaces, or make any
generated contract authoritative.

DEC-187 does not supersede DEC-097 through DEC-186. It adds a calibration-only Compiler Input Model draft for the
selected `component/escape-html` Symbol stringification fixture at
`examples/retrofit/open-source/escape-html/generated/compiler-input-model-calibration-draft.json`. The draft records
which input groups can be represented and which gaps remain, including unsupported external project check IDs, external
checkout paths, behavior-change shape under current `bug_fix` vocabulary, and graph delta/proposal review-only
bindings. The draft status is `calibration-draft`, `not-supported`, `not-approved`, and `equivalenceProven: false`. It
does not wire the second fixture into the compiler command, create a promotion packet, approve the fixture, execute AI,
apply graph deltas, accept user work, enable required checks, configure branch protection, introduce CI enforcement,
retire tree-native artifacts, widen changeType support, rename PBE compatibility surfaces, or make any generated
contract authoritative.

DEC-188 does not supersede DEC-097 through DEC-187. It adds a static calibration observation preview for the selected
`component/escape-html` draft at
`examples/retrofit/open-source/escape-html/generated/compiler-input-calibration-observation.preview.json`. The
observation classifies the draft as `not-supported`, `not-eligible-current-command-not-wired`, and
`contract-candidate-not-run`, while identifying reusable source-authority concepts and gaps around external required
checks, external checkout path authority, behavior-change pack schema policy, risk vocabulary, anchor-level context, and
graph-delta review bindings. The recommended next step is `v0.3-calibration-unsupported-blocked-reporting`, not second
fixture support. This does not wire the fixture into `compile-contract --dry-run`, compile a candidate, create a
promotion packet, approve the fixture, set `equivalenceProven: true`, execute AI, apply graph deltas, accept user work,
enable required checks, configure branch protection, introduce CI enforcement, retire tree-native artifacts, widen
changeType support, rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-189 does not supersede DEC-097 through DEC-188. It selects `behavior-change pack schema policy` as the first v0.3
calibration scope for the `component/escape-html` Symbol stringification draft. The decision narrows the next
calibration work to recognizing and reporting behavior-change-shaped calibration inputs without broad behavior-change
support. The second fixture remains `not-supported`, `not-eligible-current-command-not-wired`,
`contract-candidate-not-run`, `not-approved`, and `equivalenceProven: false`. External required-check binding, external
checkout path authority, anchor-level context, risk vocabulary expansion, and graph-delta review binding are explicitly
deferred. This does not wire the fixture into `compile-contract --dry-run`, compile a candidate, create a promotion
packet, approve the fixture, set `equivalenceProven: true`, execute AI, apply graph deltas, accept user work, enable
required checks, configure branch protection, introduce CI enforcement, retire tree-native artifacts, widen changeType
support, rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-190 does not supersede DEC-097 through DEC-189. It implements the first v0.3 scope as a calibration-only
behavior-change policy preview at
`examples/retrofit/open-source/escape-html/generated/behavior-change-calibration-policy.preview.json` and updates the
escape-html calibration observation to `behavior-change-calibration-policy-recognized`. This recognizes the
behavior-change-shaped draft as a calibration input boundary while keeping it `not-supported`,
`not-eligible-current-command-not-wired`, `contract-candidate-not-run`, `not-approved`, and `equivalenceProven: false`.
The next recommended scope is external required-check binding, but that binding is not implemented here. This does not
wire the fixture into `compile-contract --dry-run`, compile a candidate, create a promotion packet, approve the fixture,
set `equivalenceProven: true`, execute AI, apply graph deltas, accept user work, enable required checks, configure
branch protection, introduce CI enforcement, retire tree-native artifacts, widen changeType support, rename PBE
compatibility surfaces, or make any generated contract authoritative.

DEC-191 does not supersede DEC-097 through DEC-190. It adds a preview-only external required-check binding artifact for
the selected `component/escape-html` behavior-change calibration draft at
`examples/retrofit/open-source/escape-html/generated/external-required-check-binding.preview.json`. The preview maps
observed dogfood Evidence to candidate check ids such as `check-escape-html-npm-test`,
`check-escape-html-dogfood-validator`, and `check-escape-html-graph-delta-review`, while reporting
`external-required-check-binding-blocked-by-checkout-authority`. The second fixture remains `not-supported`,
`not-eligible-current-command-not-wired`, `contract-candidate-not-run`, `not-approved`, and `equivalenceProven: false`;
the next recommended scope is external checkout path authority. This does not register supported compiler checks, create
CI required checks, configure branch protection, wire the fixture into `compile-contract --dry-run`, compile a
candidate, create a promotion packet, approve the fixture, set `equivalenceProven: true`, execute AI, apply graph
deltas, accept user work, retire tree-native artifacts, widen changeType support, rename PBE compatibility surfaces, or
make any generated contract authoritative.

DEC-192 does not supersede DEC-097 through DEC-191. It adds a preview-only external checkout path authority artifact for
the selected `component/escape-html` behavior-change calibration draft at
`examples/retrofit/open-source/escape-html/generated/external-checkout-path-authority.preview.json`. The preview records
static dogfood metadata for `work/external/escape-html`, including the expected upstream, observed clone head, dirty
files, and authority limits, while reporting
`external-checkout-path-authority-previewed-calibration-local`. The external required-check binding status moves to
`external-required-check-binding-awaiting-authoritative-checkout`, not to enforced or supported required checks. The
second fixture remains `not-supported`, `not-eligible-current-command-not-wired`, `contract-candidate-not-run`,
`not-approved`, and `equivalenceProven: false`; the next recommended scope is bounded risk vocabulary. This does not
make the local checkout portable authority, run external checks as required checks, modify external files, wire the
fixture into `compile-contract --dry-run`, compile a candidate, create a promotion packet, approve the fixture, set
`equivalenceProven: true`, execute AI, apply graph deltas, accept user work, create CI enforcement, configure branch
protection, retire tree-native artifacts, widen changeType support, rename PBE compatibility surfaces, or make any
generated contract authoritative.

DEC-193 does not supersede DEC-097 through DEC-192. It adds a preview-only anchor-level context artifact for the
selected `component/escape-html` behavior-change calibration draft at
`examples/retrofit/open-source/escape-html/generated/anchor-level-context.preview.json`. The preview records approximate
source and test anchors for Symbol stringification, including the input coercion point, existing non-string
stringification tests, the Symbol assertion, and escape-vocabulary guard tests, while reporting
`anchor-level-context-previewed-approximate`. Exact line ranges remain unresolved, the external checkout remains
calibration-local and non-portable, and the anchors are review metadata only. The second fixture remains
`not-supported`, `not-eligible-current-command-not-wired`, `contract-candidate-not-run`, `not-approved`, and
`equivalenceProven: false`; the next recommended scope remains bounded risk vocabulary. This does not make anchors edit
permission, supported compiler context, source checkout authority, candidate generation authority, promotion approval,
CI enforcement, required checks, branch protection, graph delta apply authority, user acceptance, tree retirement,
arbitrary changeType support, or any generated contract authoritative.

DEC-194 does not supersede DEC-097 through DEC-193. It adds a preview-only risk vocabulary artifact for the selected
`component/escape-html` behavior-change calibration draft at
`examples/retrofit/open-source/escape-html/generated/risk-vocabulary.preview.json`. The preview names bounded
behavior-change risks such as runtime compatibility, input coercion behavior, Symbol handling regression, escaping
correctness, non-string input drift, test coverage insufficiency, and source-authority boundary risk, while reporting
`risk-vocabulary-previewed`. These terms are linked to approximate anchors and observed Evidence, but they do not prove
mitigation, final compiler risk policy, or support. The second fixture remains `not-supported`,
`not-eligible-current-command-not-wired`, `contract-candidate-not-run`, `not-approved`, and `equivalenceProven: false`;
the next recommended scope is graph-delta review binding. This does not wire the fixture into `compile-contract
--dry-run`, compile a candidate, create or approve a promotion packet, run external checks as required checks, create CI
enforcement, configure branch protection, set `equivalenceProven: true`, execute AI, apply graph deltas, accept user
work, retire tree-native artifacts, widen changeType support, rename PBE compatibility surfaces, or make any generated
contract authoritative.

DEC-195 does not supersede DEC-097 through DEC-194. It adds a preview-only graph-delta review binding artifact for the
selected `component/escape-html` behavior-change calibration draft at
`examples/retrofit/open-source/escape-html/generated/graph-delta-review-binding.preview.json`. The preview binds the
existing graph delta, graph update proposal, anchors, risk terms, and Evidence into review questions for input coercion,
Symbol handling, escaping preservation, non-string input preservation, and source-authority boundaries, while reporting
`graph-delta-review-binding-previewed` and `v0.3-calibration-preview-gap-set-complete`. The second fixture remains
`not-supported`, `not-eligible-current-command-not-wired`, `contract-candidate-not-run`, `not-approved`, and
`equivalenceProven: false`; the next recommended step is v0.3 calibration closeout. This does not apply graph deltas,
mutate graph source, prove semantic equivalence, wire the fixture into `compile-contract --dry-run`, compile a
candidate, create or approve a promotion packet, run external checks as required checks, create CI enforcement,
configure branch protection, set `equivalenceProven: true`, execute AI, accept user work, retire tree-native artifacts,
widen changeType support, rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-196 does not supersede DEC-097 through DEC-195. It closes the v0.3 `component/escape-html` calibration preview cycle
as observation-complete only. The completed preview axes are behavior-change calibration policy, external required-check
binding, external checkout path authority, anchor-level context, risk vocabulary, and graph-delta review binding, with
`previewGapSetStatus: v0.3-calibration-preview-gap-set-complete`. The second fixture remains `not-supported`,
`not-eligible-current-command-not-wired`, `contract-candidate-not-run`, `not-approved`, and `equivalenceProven: false`.
The closeout decision is `close-v0.3-escape-html-calibration-preview-cycle`, and the recommended next step is selecting
a third calibration fixture before promoting preview concepts into general report generation or compiler behavior. This
does not wire the fixture into `compile-contract --dry-run`, compile a candidate, create or approve a promotion packet,
run external checks as required checks, apply graph deltas, mutate graph source, prove semantic equivalence, prove risk
mitigation, create CI enforcement, configure branch protection, set `equivalenceProven: true`, execute AI, accept user
work, retire tree-native artifacts, widen changeType support, rename PBE compatibility surfaces, or make any generated
contract authoritative.

DEC-197 does not supersede DEC-097 through DEC-196. It selects `Todo App add-todo runtime evidence-only calibration` as
the third contract compiler calibration fixture shape. The fixture is selected as a `test-only behavior proof` target
using the existing `examples/valid/todo-app-pbe-run` structure-only surfaces and
`docs/concept/todo-app-source-authority-evidence-package.md` as planning context. Its initial expected statuses are
`calibration-fixture-selected`, `not-supported`, `contract-candidate-not-run`, `not-approved`, and
`equivalenceProven: false`. The selection is meant to test whether DevView can reason about a proof-focused task where
test/Evidence scope is primary and production source edits are forbidden. It does not promote Todo App beyond
`structure-only`, wire the third fixture into `compile-contract --dry-run`, compile a candidate, create or approve a
promotion packet, generalize the Todo Search human decision, promote the `escape-html` fixture, create CI enforcement,
configure branch protection, set `equivalenceProven: true`, execute AI, accept user work, retire tree-native artifacts,
rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-198 does not supersede DEC-097 through DEC-197. It adds the calibration-only draft
`examples/valid/todo-app-pbe-run/generated/compiler-input-model-calibration-draft.runtime-evidence-only.json` for the
selected `Todo App add-todo runtime evidence-only calibration` fixture. The draft models a `test-only-behavior-proof`
shape with test/Evidence-oriented candidate scope, production source edits forbidden through the conceptual `src/todos.ts`
path, missing runtime command Evidence, attached structure-only Evidence that is not authoritative runtime proof, output
obligations for Evidence status and source non-modification, stop conditions for production-source edits or Evidence
being treated as acceptance, and risks for scope drift, Evidence authority confusion, and acceptance-boundary confusion.
The draft remains `calibration-draft`, `not-supported`, `contract-candidate-not-run`, `not-approved`, and
`equivalenceProven: false`. It does not reinterpret the existing Todo App positive fixture beyond `structure-only`, wire
the draft into `compile-contract --dry-run`, compile a candidate, create or approve a promotion packet, create required
checks or CI enforcement, set `equivalenceProven: true`, execute AI, accept user work, retire tree-native artifacts,
rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-199 does not supersede DEC-097 through DEC-198. It adds the preview-only third-fixture observation artifact
`examples/valid/todo-app-pbe-run/generated/compiler-input-calibration-observation.runtime-evidence-only.preview.json`.
The observation records the `Todo App add-todo runtime evidence-only calibration` gaps:
`test-only-allowed-scope`, `production-source-forbidden-scope`, `runtime-evidence-authority`,
`evidence-check-binding`, `output-requirement-for-test-evidence`, `stop-condition-when-source-edits-needed`, and
`compliance-checker-bridge`. The fixture remains `not-supported`, `not-eligible-current-command-not-wired`,
`contract-candidate-not-run`, `not-approved`, and `equivalenceProven: false`; runtime command Evidence and production
source non-modification Evidence remain unresolved. The recommended next step is
`select-third-fixture-first-preview-scope`, with `runtime-evidence-authority` as the first recommended scope. This does
not reinterpret Todo App beyond `structure-only`, wire the fixture into `compile-contract --dry-run`, compile a
candidate, create or approve a promotion packet, create required checks or CI enforcement, allow production source
edits, set `equivalenceProven: true`, execute AI, accept user work, retire tree-native artifacts, rename PBE
compatibility surfaces, or make any generated contract authoritative.

DEC-200 does not supersede DEC-097 through DEC-199. It adds the preview-only test-only scope boundary artifact
`examples/valid/todo-app-pbe-run/generated/test-only-scope-boundary.runtime-evidence-only.preview.json` and links it
from the third-fixture observation. The boundary previews test/Evidence-oriented candidate scope, unresolved runtime
command output and source non-modification report surfaces, forbidden production source edits, forbidden Todo App profile
promotion, forbidden acceptance-state mutation, and the stop-required behavior when runtime proof appears to require
production implementation changes. The updated observation marks `test-only-allowed-scope` as
`test-only-scope-boundary-previewed`, `production-source-forbidden-scope` as
`production-source-boundary-previewed`, and `stop-condition-when-source-edits-needed` as
`source-edit-stop-condition-previewed`, while `runtime-evidence-authority`, `evidence-check-binding`,
`output-requirement-for-test-evidence`, and `compliance-checker-bridge` remain unresolved. This does not support the
third fixture, wire it into `compile-contract --dry-run`, compile a candidate, enforce scope, execute checks, allow
production source edits, create or approve a promotion packet, satisfy runtime Evidence, create required checks or CI
enforcement, set `equivalenceProven: true`, execute AI, accept user work, retire tree-native artifacts, rename PBE
compatibility surfaces, or make any generated contract authoritative.

DEC-201 does not supersede DEC-097 through DEC-200. It adds the preview-only runtime Evidence authority artifact
`examples/valid/todo-app-pbe-run/generated/runtime-evidence-authority.runtime-evidence-only.preview.json` and links it
from the third-fixture observation. The preview defines candidate authoritative Evidence types such as captured runtime
command output, structured runtime test artifacts, and human-reviewed manual runtime observation records, while marking
Codex natural-language claims, uncaptured local commands, attached structure-only Evidence alone, and reports after
production source edits as non-authoritative for this calibration fixture. The updated observation marks
`runtime-evidence-authority` as `runtime-evidence-authority-previewed`, keeps runtime Evidence unsatisfied and missing,
and leaves `evidence-check-binding`, `output-requirement-for-test-evidence`, and `compliance-checker-bridge` unresolved.
The next recommended scope is `evidence-check-binding`. This does not support the third fixture, wire it into
`compile-contract --dry-run`, compile a candidate, run or capture passing runtime Evidence, allow production source
edits, create or approve a promotion packet, create required checks or CI enforcement, set `equivalenceProven: true`,
execute AI, accept user work, retire tree-native artifacts, rename PBE compatibility surfaces, or make any generated
contract authoritative.

DEC-202 does not supersede DEC-097 through DEC-201. It adds the preview-only evidence/check binding artifact
`examples/valid/todo-app-pbe-run/generated/evidence-check-binding.runtime-evidence-only.preview.json` and links it from
the third-fixture observation. The preview maps candidate checks to expected Evidence:
`check-todo-app-runtime-add-todo` to missing authoritative runtime command Evidence,
`check-todo-app-attached-evidence-review` to present attached structure-only Evidence that is not runtime proof, and
`check-todo-app-production-source-unchanged` to missing future source non-modification Evidence. The updated observation
marks `evidence-check-binding` as `evidence-check-binding-previewed`, keeps runtime Evidence unsatisfied and missing, and
leaves `output-requirement-for-test-evidence` and `compliance-checker-bridge` unresolved. The next recommended scope is
`output-requirement-for-test-evidence`. This does not support the third fixture, wire it into `compile-contract
--dry-run`, compile a candidate, run checks, capture passing Evidence, turn candidate checks into required checks,
create CI enforcement or branch protection, allow production source edits, create or approve a promotion packet, set
`equivalenceProven: true`, execute AI, accept user work, retire tree-native artifacts, rename PBE compatibility surfaces,
or make any generated contract authoritative.

DEC-203 does not supersede DEC-097 through DEC-202. It adds the preview-only output requirement artifact
`examples/valid/todo-app-pbe-run/generated/output-requirement-for-test-evidence.runtime-evidence-only.preview.json` and
links it from the third-fixture observation. The preview defines required report items for candidate check attempt
status, captured command output or explicit missing Evidence status, runtime Evidence status, runtime Evidence authority
satisfaction, production source non-modification, source-edit stop condition status, and non-promotion/non-acceptance
boundaries. The updated observation marks `output-requirement-for-test-evidence` as
`output-requirement-for-test-evidence-previewed`, keeps runtime Evidence missing and evidence/check binding unsatisfied,
and leaves `compliance-checker-bridge` unresolved. The next recommended scope is `compliance-checker-bridge`. This does
not support the third fixture, wire it into `compile-contract --dry-run`, compile a candidate, run checks, capture
passing Evidence, turn candidate checks into required checks, generate final output requirements, implement compliance
checker behavior, create CI enforcement or branch protection, allow production source edits, create or approve a
promotion packet, set `equivalenceProven: true`, execute AI, accept user work, retire tree-native artifacts, rename PBE
compatibility surfaces, or make any generated contract authoritative.

DEC-204 does not supersede DEC-097 through DEC-203. It adds the preview-only compliance-checker bridge artifact
`examples/valid/todo-app-pbe-run/generated/compliance-checker-bridge.runtime-evidence-only.preview.json` and links it
from the third-fixture observation. The bridge previews future checks for production source edits during a test-only
fixture, missing runtime Evidence, candidate checks reported without captured output, missing source modification and
stop condition statements, Evidence claimed satisfied while runtime Evidence remains missing, candidate checks treated
as enforced required checks, and output reports missing required Evidence references. The updated observation marks
`compliance-checker-bridge` as `compliance-checker-bridge-previewed`, records
`previewGapSetStatus: runtime-evidence-only-preview-gap-set-complete`, and recommends
`runtime-evidence-only-preview-closeout` as the next scope. The fixture remains `not-supported`,
`not-eligible-current-command-not-wired`, `contract-candidate-not-run`, `not-approved`, and `equivalenceProven: false`;
runtime Evidence remains missing and evidence/check binding remains unsatisfied. This does not implement the compliance
checker, inspect diffs, detect file modifications, parse command output, report or enforce violations, support the third
fixture, wire it into `compile-contract --dry-run`, compile a candidate, run checks, capture passing Evidence, turn
candidate checks into required checks, create CI enforcement or branch protection, allow production source edits, create
or approve a promotion packet, set `equivalenceProven: true`, execute AI, accept user work, retire tree-native
artifacts, rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-205 does not supersede DEC-097 through DEC-204. It closes the runtime Evidence-only preview observation cycle for
the `Todo App add-todo runtime evidence-only calibration` fixture. The closeout records the completed preview axes:
test-only scope boundary, runtime Evidence authority, evidence/check binding, output requirement for test Evidence, and
compliance-checker bridge. The third fixture remains `not-supported`, `not-eligible-current-command-not-wired`,
`contract-candidate-not-run`, `not-approved`, and `equivalenceProven: false`; runtime Evidence remains missing,
evidence/check binding remains `preview-only-not-satisfied`, and no compliance checker is implemented. The closeout
distinguishes closed preview gaps from unresolved support blockers and recommends
`cross-fixture-calibration-synthesis` before promoting preview concepts into general compiler logic, report generation,
or compliance-checker implementation. This does not support the third fixture, wire it into `compile-contract --dry-run`,
compile a candidate, create or approve a promotion packet, claim runtime Evidence is satisfied, invent command output,
turn candidate checks into required checks, enforce scope, inspect or reject diffs, allow production source edits,
promote `escape-html`, set `equivalenceProven: true`, execute AI, apply graph deltas, create CI enforcement or branch
protection, accept user work, retire tree-native artifacts, rename PBE compatibility surfaces, or make any generated
contract authoritative.

DEC-206 does not supersede DEC-097 through DEC-205. It records the cross-fixture calibration synthesis across the current
Todo Search `bug_fix` success fixture, the `escape-html` external `behavior-change` preview fixture, and the Todo App
runtime Evidence-only `test-only-behavior-proof` preview fixture. The synthesis identifies reusable review/modeling
concepts such as source-authority preservation, scope boundary, forbidden scope, Evidence authority, evidence/check
binding, output requirement binding, stop conditions, risk vocabulary, graph-delta review binding, and
compliance-checker bridge, while keeping external checkout authority, external required-check binding, approximate
anchor context, test-only production-source forbidden scope, runtime Evidence authority, proof-only output requirements,
and compliance-checker bridge details fixture-specific until broader policy exists. It records overfitting risks and
recommends a formal `compiler-eligibility-status-model` as the next milestone before adding fixture support or promoting
preview concepts into compiler/report/checker logic. This does not mark calibration fixtures supported, wire them into
`compile-contract --dry-run`, generate contract candidates, create or approve promotion review packets, claim runtime
Evidence is satisfied, implement compliance checking, promote static preview artifacts into compiler output, turn
candidate checks into required checks, set `equivalenceProven: true`, execute AI, apply graph deltas, create CI
enforcement or branch protection, accept user work, retire tree-native artifacts, rename PBE compatibility surfaces, or
make any generated contract authoritative.

DEC-207 does not supersede DEC-097 through DEC-206. It adds
`docs/concept/contract-compiler-eligibility-status-model.md` as the conceptual lifecycle model for compiler calibration
fixture status. The model defines fixture selection, calibration recognition, preview gap, compile eligibility, candidate
generation, semantic diff, promotion review, approval, equivalence, and execution/enforcement status categories. It
records meanings for existing statuses such as `calibration-fixture-selected`, `policy-recognized`,
`preview-gap-set-complete`, `not-supported`, `not-eligible-current-command-not-wired`, `contract-candidate-not-run`,
`promotion-not-eligible`, `not-approved`, `equivalenceCandidate: true`, and `equivalenceProven: false`; it also records
allowed and forbidden lifecycle transitions and maps the model to the current Todo Search, `escape-html`, and Todo App
runtime Evidence-only fixtures. The next recommended decision is whether to select a fourth calibration fixture or start
a minimal compliance-checker design preview. This does not mark calibration fixtures supported, wire them into
`compile-contract --dry-run`, generate contract candidates, create or approve promotion review packets, claim runtime
Evidence is satisfied, implement compliance checking, promote static preview artifacts into compiler output, turn
candidate checks into required checks, set `equivalenceProven: true`, execute AI, apply graph deltas, create CI
enforcement or branch protection, accept user work, retire tree-native artifacts, rename PBE compatibility surfaces, or
make any generated contract authoritative.

DEC-208 does not supersede DEC-097 through DEC-207. It adds
`docs/concept/devview-compliance-checker-mvp-scope.md` as the planning-only scope decision for the first future DevView
compliance-checker MVP axis. The selected axis is `scope-compliance-preview`, chosen because it is the smallest
mechanical checker surface for comparing actual changed files against allowed and forbidden contract scope, and because
it connects directly to the Todo App runtime Evidence-only calibration fixture where production source edits are
forbidden or stop-required. The document defines future checker purpose, expected future inputs, conceptual violation
categories, fixture relevance, status-model dependencies, the non-enforcement boundary, and a recommended future
preview artifact path:
`examples/valid/todo-app-pbe-run/generated/scope-compliance-checker.runtime-evidence-only.preview.json`. This does not
implement the compliance checker, inspect or reject diffs, enforce scope, wire checker behavior into compiler execution,
CI, required checks, or branch protection, mark calibration fixtures supported, generate contract candidates, approve
fixtures, claim runtime Evidence is satisfied, promote static preview artifacts into compiler output, turn candidate
checks into required checks, set `equivalenceProven: true`, execute AI, apply graph deltas, automate user acceptance,
retire tree-native artifacts, rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-209 does not supersede DEC-097 through DEC-208. It adds the preview-only scope compliance checker artifact
`examples/valid/todo-app-pbe-run/generated/scope-compliance-checker.runtime-evidence-only.preview.json` for the Todo App
runtime Evidence-only calibration fixture and links it from the third-fixture observation artifact. The preview narrows
the first compliance-checker MVP axis to `scope-compliance-preview`, records future checker inputs such as contract
allowed/forbidden scope, future actual changed-file list, future diff summary, agent output report, and source
non-modification Evidence, and names conceptual violation categories such as `allowed-scope-violation`,
`forbidden-scope-violation`, `production-source-modified-in-test-only-fixture`, `missing-changed-file-list`, and
`scope-status-overclaim`. The observation now records `scopeCompliancePreviewStatus:
scope-compliance-checker-previewed` while preserving `not-supported`, `not-eligible-current-command-not-wired`,
`contract-candidate-not-run`, `not-approved`, `equivalenceProven: false`, missing runtime Evidence, and unsatisfied
evidence/check binding. This does not implement the compliance checker, inspect actual diffs, collect changed files,
reject diffs, enforce scope, wire checker behavior into compiler execution, CI, required checks, or branch protection,
mark calibration fixtures supported, generate contract candidates, approve fixtures, claim runtime Evidence is
satisfied, promote static preview artifacts into compiler output, turn candidate checks into required checks, execute
AI, apply graph deltas, automate user acceptance, retire tree-native artifacts, rename PBE compatibility surfaces, or
make any generated contract authoritative.

DEC-210 does not supersede DEC-097 through DEC-209. It adds
`docs/concept/scope-compliance-checker-implementation-readiness.md` as the planning-only readiness criteria for the
first future scope compliance checker implementation slice. The readiness model defines required future inputs for
execution contract source, allowed scope source, forbidden scope source, changed file list source, generated result
artifact path, fixture identity, and support/eligibility status inputs. It records readiness questions for changed-file
authority, path normalization, missing-input reporting, result artifact location, and non-enforcing result behavior. It
also defines conceptual result states including `scope-compliance-not-run`, `scope-compliance-input-missing`,
`scope-compliance-preview-only`, `scope-compliance-potential-violation`, and
`scope-compliance-no-violation-observed`, while marking the readiness status as
`implementation-not-ready-inputs-unresolved`. The recommended next task is `scope-compliance-result-preview-schema`.
This does not implement the compliance checker, inspect actual diffs, collect changed files, reject diffs, enforce
scope, wire checker behavior into compiler execution, CI, required checks, or branch protection, mark calibration
fixtures supported, generate contract candidates, approve fixtures, claim runtime Evidence is satisfied, promote static
preview artifacts into compiler output, turn candidate checks into required checks, set `equivalenceProven: true`,
execute AI, apply graph deltas, automate user acceptance, retire tree-native artifacts, rename PBE compatibility
surfaces, or make any generated contract authoritative.

DEC-211 does not supersede DEC-097 through DEC-210. It adds the static preview-only scope compliance result artifact
`examples/valid/todo-app-pbe-run/generated/scope-compliance-result.runtime-evidence-only.preview.json` for the Todo App
runtime Evidence-only calibration fixture and links it from the third-fixture observation artifact. The result preview
records `scopeComplianceResultStatus: scope-compliance-input-missing`, `changedFileListStatus:
missing-or-not-authoritative`, `enforcementStatus: non-enforcing-preview`, `checkerRun: false`,
`actualDiffInspected: false`, `changedFilesCollected: false`, and `scopeEnforced: false`. It keeps evaluated violations
empty and lists future violation categories as not evaluated because no authoritative changed-file list, path
normalization rule, supported contract scope source, or implemented result classifier exists. The observation now records
`scopeComplianceResultPreviewStatus: scope-compliance-input-missing-previewed` while preserving `not-supported`,
`not-eligible-current-command-not-wired`, `contract-candidate-not-run`, `not-approved`, `equivalenceProven: false`,
missing runtime Evidence, and unsatisfied evidence/check binding. This does not implement the compliance checker,
inspect actual diffs, collect changed files, report no-violation, detect violations, reject diffs, enforce scope, wire
checker behavior into compiler execution, CI, required checks, or branch protection, mark calibration fixtures
supported, generate contract candidates, approve fixtures, claim runtime Evidence is satisfied, promote static preview
artifacts into compiler output, set `equivalenceProven: true`, execute AI, apply graph deltas, automate user acceptance,
retire tree-native artifacts, rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-212 does not supersede DEC-097 through DEC-211. It adds the preview-only changed-file list authority artifact
`examples/valid/todo-app-pbe-run/generated/changed-file-list-authority.runtime-evidence-only.preview.json` for the Todo
App runtime Evidence-only scope compliance checker preview. The artifact records
`changedFileListAuthorityStatus: changed-file-list-authority-unresolved`, `currentChangedFileListStatus:
changed-file-list-missing`, `checkerRun: false`, `actualDiffInspected: false`, and `changedFilesCollected: false`. It
classifies candidate future sources including `git diff --name-only`, generated patch metadata, execution transcript
metadata, review packet changed-file lists, agent-reported changed files, and fixture-provided preview input. It records
agent-reported changed files as claim-only and not authoritative, fixture-provided changed-file lists as preview-only
and suitable for the first static result-shape slice, and git-derived changed files as a later authoritative candidate
after base/head and path normalization policy exist. The scope compliance checker preview, result preview, observation,
and docs now link this authority preview while preserving `not-supported`, `not-eligible-current-command-not-wired`,
`contract-candidate-not-run`, `not-approved`, `equivalenceProven: false`, missing runtime Evidence, and unsatisfied
evidence/check binding. This does not implement changed-file collection, inspect actual diffs, run the compliance
checker, report no-violation, detect violations, reject diffs, enforce scope, wire checker behavior into compiler
execution, CI, required checks, or branch protection, mark calibration fixtures supported, generate contract candidates,
approve fixtures, claim runtime Evidence is satisfied, promote static preview artifacts into compiler output, set
`equivalenceProven: true`, execute AI, apply graph deltas, automate user acceptance, retire tree-native artifacts,
rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-213 does not supersede DEC-097 through DEC-212. It adds the preview-only fixture-provided changed-file list artifact
`examples/valid/todo-app-pbe-run/generated/fixture-provided-changed-file-list.runtime-evidence-only.preview.json` for the
Todo App runtime Evidence-only scope compliance checker preview. The artifact records
`inputAuthorityStatus: fixture-provided-preview-only`, `changedFileListStatus:
fixture-provided-preview-input-available`, `authoritativeChangedFileListStatus: missing-or-not-authoritative`,
`checkerRun: false`, `actualDiffInspected: false`, and `changedFilesCollected: false`. It defines two static scenarios:
a test/Evidence-only changed-file scenario and a production-source-modified scenario. Both scenarios are preview inputs
for future result-shape design only; they are not actual diff output, not collected from Git, not agent-reported changed
files, not execution transcript metadata, and not authoritative runtime Evidence. The changed-file list authority
preview, scope compliance checker preview, result preview, observation, and docs now link this fixture-provided preview
while preserving `not-supported`, `not-eligible-current-command-not-wired`, `contract-candidate-not-run`,
`not-approved`, `equivalenceProven: false`, missing runtime Evidence, unsatisfied evidence/check binding,
`checkerRun: false`, and `evaluatedViolations: []`. This does not implement changed-file collection, inspect actual
diffs, run scope compliance evaluation, report no-violation, report actual violations, reject diffs, enforce scope, wire
checker behavior into compiler execution, CI, required checks, or branch protection, mark calibration fixtures
supported, generate contract candidates, approve fixtures, claim runtime Evidence is satisfied, promote static preview
artifacts into compiler output, set `equivalenceProven: true`, execute AI, apply graph deltas, automate user acceptance,
retire tree-native artifacts, rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-214 does not supersede DEC-097 through DEC-213. It adds the preview-only scope compliance fixture input consumption
artifact
`examples/valid/todo-app-pbe-run/generated/scope-compliance-fixture-input-consumption.runtime-evidence-only.preview.json`
for the Todo App runtime Evidence-only scope compliance checker preview. The artifact records
`status: scope-compliance-fixture-input-present-preview-only`, `consumptionMode: static-preview-reference-only`,
`fixtureProvidedInputStatus: fixture-provided-preview-input-available`, `fixtureProvidedInputAuthorityStatus:
fixture-provided-preview-only`, `checkerRun: false`, `actualDiffInspected: false`, `changedFilesCollected: false`, and
`evaluatedViolations: []`. It links the fixture-provided test/Evidence-only and production-source-modified scenarios as
present preview input, but marks both as `input-present-not-evaluated`. The result preview, checker preview,
observation, and docs now record this input-present preview state while preserving `scopeComplianceResultStatus:
scope-compliance-input-missing`, `not-supported`, `not-eligible-current-command-not-wired`,
`contract-candidate-not-run`, `not-approved`, `equivalenceProven: false`, missing runtime Evidence, and unsatisfied
evidence/check binding. This does not implement changed-file collection, inspect actual diffs, run scope compliance
evaluation, normalize paths, compare scope, report no-violation, report actual violations, reject diffs, enforce scope,
wire checker behavior into compiler execution, CI, required checks, or branch protection, mark calibration fixtures
supported, generate contract candidates, approve fixtures, claim runtime Evidence is satisfied, promote static preview
artifacts into compiler output, set `equivalenceProven: true`, execute AI, apply graph deltas, automate user acceptance,
retire tree-native artifacts, rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-215 does not supersede DEC-097 through DEC-214. It adds the preview-only scope compliance dry-run skeleton artifact
`examples/valid/todo-app-pbe-run/generated/scope-compliance-dry-run-skeleton.runtime-evidence-only.preview.json` for the
Todo App runtime Evidence-only scope compliance checker preview. The artifact records
`dryRunSkeletonStatus: preview-only-not-executable`, `resultStatus: scope-compliance-dry-run-not-run`,
`currentStageStatus: stopped-before-evaluation`, `stopReason: authoritative-changed-file-list-missing`,
`checkerRun: false`, `actualDiffInspected: false`, `changedFilesCollected: false`, and `evaluatedViolations: []`. It
describes planned future stages for loading contract scope, loading an authoritative changed-file list, normalizing
paths, comparing allowed scope, comparing forbidden scope, and emitting a non-enforcing result, while marking each stage
not run or blocked. The result preview, checker preview, observation, changed-file authority preview, fixture-provided
changed-file preview, fixture input consumption preview, and docs now link this skeleton while preserving
`scopeComplianceResultStatus: scope-compliance-input-missing`, `not-supported`,
`not-eligible-current-command-not-wired`, `contract-candidate-not-run`, `not-approved`, `equivalenceProven: false`,
missing runtime Evidence, and unsatisfied evidence/check binding. This does not implement the compliance checker,
implement changed-file collection, inspect actual diffs, run checker dry-run logic, evaluate fixture-provided scenarios,
normalize paths, compare scope, report no-violation, report actual violations, reject diffs, enforce scope, wire checker
behavior into compiler execution, CI, required checks, or branch protection, mark calibration fixtures supported,
generate contract candidates, approve fixtures, claim runtime Evidence is satisfied, promote static preview artifacts
into compiler output, set `equivalenceProven: true`, execute AI, apply graph deltas, automate user acceptance, retire
tree-native artifacts, rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-216 does not supersede DEC-097 through DEC-215. It adds the preview-only scope compliance not-run report artifact
`examples/valid/todo-app-pbe-run/generated/scope-compliance-not-run-report.runtime-evidence-only.preview.json` for the
Todo App runtime Evidence-only scope compliance checker preview. The artifact records
`reportStatus: scope-compliance-not-run-report-previewed`, `scopeComplianceResultStatus:
scope-compliance-input-missing`, `stopReason: authoritative-changed-file-list-missing`, `nextRequiredInput:
authoritative-changed-file-list`, `checkerRun: false`, `actualDiffInspected: false`, `changedFilesCollected: false`,
and `evaluatedViolations: []`. It explains why the checker did not run: no authoritative changed-file list exists,
fixture-provided changed-file input is preview-only, no actual diff was inspected, no changed files were collected, and
no violation categories were evaluated. The result preview, checker preview, observation, and docs now link this
not-run report while preserving `not-supported`, `not-eligible-current-command-not-wired`, `contract-candidate-not-run`,
`not-approved`, `equivalenceProven: false`, missing runtime Evidence, unsatisfied evidence/check binding, and the
non-enforcing scope-compliance boundary. This does not implement the compliance checker, implement changed-file
collection, inspect actual diffs, run checker dry-run logic, evaluate fixture-provided scenarios, normalize paths,
compare scope, report no-violation, report actual violations, reject diffs, enforce scope, wire checker behavior into
compiler execution, CI, required checks, or branch protection, mark calibration fixtures supported, generate contract
candidates, approve fixtures, claim runtime Evidence is satisfied, promote static preview artifacts into compiler
output, set `equivalenceProven: true`, execute AI, apply graph deltas, automate user acceptance, retire tree-native
artifacts, rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-217 does not supersede DEC-097 through DEC-216. It decides the authoritative changed-file input boundary for the
scope compliance checker MVP without implementing changed-file collection. The decision records
`authoritativeChangedFileInputBoundaryDecisionStatus: authoritative-changed-file-input-boundary-decided`: agent-reported
changed files are not authoritative, fixture-provided changed files remain preview-only and limited to static
result-shape design, review-packet changed files remain review context for this MVP boundary, execution-metadata changed
files may become authoritative later if a trusted executor emits them, and git-derived changed files are the selected
first real authoritative candidate for a later implementation task. The changed-file authority preview, scope
compliance result preview, dry-run skeleton, not-run report, observation, and docs now record this boundary while
preserving `scopeComplianceResultStatus: scope-compliance-input-missing`, `checkerRun: false`,
`actualDiffInspected: false`, `changedFilesCollected: false`, `evaluatedViolations: []`, `not-supported`,
`contract-candidate-not-run`, `not-approved`, `equivalenceProven: false`, missing runtime Evidence, and unsatisfied
evidence/check binding. This does not run `git diff`, implement changed-file collection, inspect actual diffs, run the
compliance checker, run checker dry-run logic, evaluate fixture-provided changed-file scenarios, normalize paths,
compare scope, report no-violation, report actual violations, reject diffs, enforce scope, wire checker behavior into
compiler execution, CI, required checks, or branch protection, mark calibration fixtures supported, generate contract
candidates, approve fixtures, claim runtime Evidence is satisfied, promote static preview artifacts into compiler
output, set `equivalenceProven: true`, execute AI, apply graph deltas, automate user acceptance, retire tree-native
artifacts, rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-218 does not supersede DEC-097 through DEC-217. It adds the preview-only git-derived changed-file input design
artifact
`examples/valid/todo-app-pbe-run/generated/git-derived-changed-file-input-design.runtime-evidence-only.preview.json` for
the Todo App runtime Evidence-only scope compliance checker preview. The artifact records
`inputDesignStatus: git-derived-input-design-previewed`, `authorityClass: git-diff-derived-authoritative-candidate`,
`checkerRun: false`, `actualDiffInspected: false`, `changedFilesCollected: false`, and `evaluatedViolations: []`. It
designs future command shapes such as `git diff --name-only <baseRef> <headRef>` and `git diff --name-status
--find-renames <baseRef> <headRef>` without executing them or encoding actual changed-file output. It recommends
explicit base/head refs or a committed range for the first implementation, defers working-tree, staged, and untracked
modes, records repository-root-relative POSIX path normalization needs, and states that generated read-model churn
should be reported honestly unless a separate explicit suppression policy is later approved. The changed-file authority
preview, scope compliance result preview, dry-run skeleton, not-run report, checker preview, observation, and docs now
link this design while preserving `scopeComplianceResultStatus: scope-compliance-input-missing`, `checkerRun: false`,
`actualDiffInspected: false`, `changedFilesCollected: false`, `evaluatedViolations: []`, `not-supported`,
`contract-candidate-not-run`, `not-approved`, `equivalenceProven: false`, missing runtime Evidence, and unsatisfied
evidence/check binding. This does not implement changed-file collection, run `git diff`, inspect actual diffs, run the
compliance checker, run checker dry-run logic, evaluate fixture-provided changed-file scenarios, normalize paths in
code, compare scope, report no-violation, report actual violations, reject diffs, enforce scope, wire checker behavior
into compiler execution, CI, required checks, or branch protection, mark calibration fixtures supported, generate
contract candidates, approve fixtures, claim runtime Evidence is satisfied, promote static preview artifacts into
compiler output, set `equivalenceProven: true`, execute AI, apply graph deltas, automate user acceptance, retire
tree-native artifacts, rename PBE compatibility surfaces, or make any generated contract authoritative.

DEC-219 does not supersede DEC-097 through DEC-218. It decides the implementation scope for the first git-derived
changed-file collection slice without implementing collection. The decision records
`gitDerivedChangedFileCollectionScopeDecisionStatus: git-derived-collection-scope-decided`: the next implementation
slice is collection-only, explicit base/head refs are first, a committed range such as `HEAD~1..HEAD` remains a
convenience candidate after explicit-ref handling is defined, working-tree/staged/untracked modes remain deferred, and
the future output is a collection artifact rather than a scope compliance result. The future collection-only state may
set `changedFilesCollected: true`, but must keep `checkerRun: false`, `evaluatedViolations: []`, and
`scopeComplianceEvaluationStatus: not-evaluated`; collection success does not imply scope compliance. The git-derived
input design preview, result preview, dry-run skeleton, not-run report, checker preview, observation, and docs now link
this scope decision while preserving the current state: `checkerRun: false`, `actualDiffInspected: false`,
`changedFilesCollected: false`, `evaluatedViolations: []`, no clean result, no actual violation, no rejection, no
enforcement, no fixture approval, no runtime Evidence satisfaction, and `equivalenceProven: false`. This does not
implement changed-file collection, run `git diff` as checker input, inspect actual diffs, run the compliance checker,
evaluate allowedScope or forbiddenScope, evaluate fixture-provided changed-file scenarios, normalize paths in code,
compare scope, report no-violation, report actual violations, reject diffs, enforce scope, wire checker behavior into
compiler execution, CI, required checks, or branch protection, mark calibration fixtures supported, generate contract
candidates, approve fixtures, claim runtime Evidence is satisfied, execute AI, apply graph deltas, automate user
acceptance, retire tree-native artifacts, rename PBE compatibility surfaces, or make any generated contract
authoritative.

DEC-220 does not supersede DEC-097 through DEC-219. It implements the first git-derived changed-file collection-only
slice for the Todo App runtime Evidence-only scope compliance input layer. The new command
`graph read-model collect-changed-files --base <baseRef> --head <headRef> --json` produces
`examples/valid/todo-app-pbe-run/generated/git-derived-changed-file-collection.runtime-evidence-only.preview.json`.
The artifact records `collectionStatus: git-derived-changed-files-collected`, `authorityClass:
git-derived-changed-files`, `collectionMode: explicit-base-head`, `changedFilesCollected: true`, `checkerRun: false`,
`scopeComplianceEvaluationStatus: not-evaluated`, and `evaluatedViolations: []`. Git is used only to collect
changed-file names/status between explicit refs; patch hunks and file contents are not inspected. Paths are normalized
to repository-root-relative POSIX-style paths, rename/delete status is preserved where Git reports it, and generated
files are reported honestly rather than suppressed. The scope compliance result, dry-run skeleton, not-run report,
observation, and docs now link the collection artifact while preserving no clean result, no actual violation, no
allowedScope or forbiddenScope evaluation, no rejection, no enforcement, no CI/required-check/branch-protection wiring,
no fixture approval, no runtime Evidence satisfaction, and `equivalenceProven: false`.

DEC-221 does not supersede DEC-097 through DEC-220. It adds the scope compliance collection input consumption preview
artifact
`examples/valid/todo-app-pbe-run/generated/scope-compliance-collection-input-consumption.runtime-evidence-only.preview.json`.
The preview records `consumptionStatus: scope-compliance-collection-input-consumption-previewed`,
`inputAuthorityClass: git-derived-changed-files`, `inputCollectionStatus: git-derived-changed-files-collected`,
`changedFilesCollected: true`, `inputAcceptedForFutureEvaluation: true`, `inputConsumedForEvaluation: false`,
`checkerRun: false`, `scopeComplianceEvaluationStatus: not-evaluated`, and `evaluatedViolations: []`. This means the
collection artifact has the right authority class and shape for future evaluation input, but it is not consumed for
evaluation yet. The collection artifact, scope compliance result preview, checker preview, not-run report, observation,
and docs now link this boundary while preserving no allowedScope or forbiddenScope comparison, no path pattern matching,
no violation classification, no no-violation claim, no actual violation claim, no rejection, no enforcement, no
CI/required-check/branch-protection wiring, no fixture approval, no runtime Evidence satisfaction, and
`equivalenceProven: false`.

DEC-222 does not supersede DEC-097 through DEC-221. It adds the allowed/forbidden scope input binding preview artifact
`examples/valid/todo-app-pbe-run/generated/scope-compliance-scope-input-binding.runtime-evidence-only.preview.json`.
The preview records `bindingStatus: scope-compliance-scope-input-binding-previewed`, allowed scope bound to
`compiler-input-model-calibration-draft.runtime-evidence-only.json` `targetScopeCandidates[]`, forbidden scope bound to
the same draft's `policySnapshot.forbiddenScopeRules[]`, `scopeInputsAcceptedForFutureEvaluation: true`,
`scopeInputsConsumedForEvaluation: false`, `checkerRun: false`, `scopeComplianceEvaluationStatus: not-evaluated`, and
`evaluatedViolations: []`. This identifies scope input sources for a future checker only. It does not create a new
source of truth, does not make the calibration draft a supported execution contract, does not implement path matching,
does not compare changed files against allowedScope or forbiddenScope, does not classify violations, does not report
clean or actual violation results, does not reject or enforce diffs, does not wire CI/required checks/branch protection,
does not support or approve the fixture, does not satisfy runtime Evidence, and does not set `equivalenceProven: true`.

DEC-223 does not supersede DEC-097 through DEC-222. It adds the path pattern matching policy preview artifact
`examples/valid/todo-app-pbe-run/generated/scope-compliance-path-pattern-policy.runtime-evidence-only.preview.json`.
The preview records `policyStatus: scope-compliance-path-pattern-policy-previewed`,
`policyAcceptedForFutureEvaluation: true`, `policyConsumedForEvaluation: false`, `checkerRun: false`,
`scopeComplianceEvaluationStatus: not-evaluated`, and `evaluatedViolations: []`. It previews repository-root-relative
POSIX paths, Windows separator normalization, no absolute local paths, glob-like patterns without regex for the first
slice, forbidden-over-allowed precedence, unknown-pattern blocking, unmatched-path future categorization, generated-file
honesty, rename/delete handling, and unresolved case-sensitivity policy. This policy is not a matcher: it does not
compare changed files against allowedScope or forbiddenScope, does not classify violations, does not report clean or
actual violation results, does not reject or enforce diffs, does not wire CI/required checks/branch protection, does
not support or approve the fixture, does not satisfy runtime Evidence, and does not set `equivalenceProven: true`.

DEC-224 does not supersede DEC-097 through DEC-223. It adds the scope compliance violation category schema preview
artifact
`examples/valid/todo-app-pbe-run/generated/scope-compliance-violation-category-schema.runtime-evidence-only.preview.json`.
The preview records `schemaStatus: scope-compliance-violation-category-schema-previewed`,
`categorySchemaAcceptedForFutureEvaluation: true`, `categorySchemaConsumedForEvaluation: false`, `checkerRun: false`,
`scopeComplianceEvaluationStatus: not-evaluated`, and `evaluatedViolations: []`. It defines future category vocabulary
for `forbidden-scope-match`, `allowed-scope-match`, `scope-unmatched-path`, `unknown-pattern`, `unparsable-pattern`,
`generated-file-review-required`, `rename-review-required`, `deleted-file-review-required`, and
`case-sensitivity-review-required`, along with conservative severity/blocking policy. This schema is not an actual
finding set: it does not implement path matching, compare changed files against allowedScope or forbiddenScope, evaluate
scope compliance, generate result output, report no-violation, report actual violations, reject or enforce diffs, wire
CI/required checks/branch protection, support or approve the fixture, satisfy runtime Evidence, or set
`equivalenceProven: true`.

DEC-225 does not supersede DEC-097 through DEC-224. It adds the scope compliance evaluation result shape preview
artifact
`examples/valid/todo-app-pbe-run/generated/scope-compliance-evaluation-result-shape.runtime-evidence-only.preview.json`.
The preview records `resultShapeStatus: scope-compliance-evaluation-result-shape-previewed`, `checkerRun: false`,
`inputConsumedForEvaluation: false`, `scopeInputsConsumedForEvaluation: false`,
`pathPolicyConsumedForEvaluation: false`, `categorySchemaConsumedForEvaluation: false`,
`scopeComplianceEvaluationStatus: not-evaluated`, `scopeComplianceResult: no-result`, and
`evaluatedViolations: []`. It defines future result states for `not-evaluated`, `evaluation-blocked`,
`evaluated-clean`, `evaluated-with-review-required`, and `evaluated-with-blocking-violations`. Empty finding arrays
remain not evaluated, not clean, while `checkerRun` is false. This preview does not implement path matching, compare
changed files against allowedScope or forbiddenScope, evaluate scope compliance, generate actual evaluation results,
report no-violation, report actual violations, reject or enforce diffs, wire CI/required checks/branch protection,
support or approve the fixture, satisfy runtime Evidence, or set `equivalenceProven: true`.

DEC-226 does not supersede DEC-097 through DEC-225. It implements the helper-only path pattern matcher
`cli/src/core/scope-compliance-path-pattern.ts` for the future scope compliance checker. The helper normalizes one
repository-root-relative path, rejects absolute local paths, supports exact path matching, trailing-slash directory
prefix patterns, and simple first-slice glob-like patterns, and returns helper-level fields such as `matched`,
`matchKind`, `patternValid`, `pathValid`, and `reason`. The helper does not consume the git-derived collection artifact
as a checker, does not compare changed files against allowedScope or forbiddenScope, does not produce
`forbidden-scope-match`, `allowed-scope-match`, or `scope-unmatched-path` findings, does not run scope compliance
evaluation, does not generate clean or actual violation results, does not reject or enforce diffs, does not wire
CI/required checks/branch protection, does not support or approve the fixture, does not satisfy runtime Evidence, and
does not set `equivalenceProven: true`.

## DEC-227 Implement Non-Enforcing Scope Compliance Evaluator

DEC-227 does not supersede DEC-097 through DEC-226. It implements the first advisory scope compliance evaluator helper
`cli/src/core/scope-compliance-evaluator.ts` and records the non-enforcing evaluation artifact
`examples/valid/todo-app-pbe-run/generated/scope-compliance-evaluation.runtime-evidence-only.preview.json`.

The evaluator consumes normalized changed-file inputs, allowed scope patterns, forbidden scope patterns, the path
matching helper, the violation category vocabulary, and the evaluation result shape. It is local and deterministic. It
evaluates forbidden matches before allowed matches, treats unmatched paths as review-required, and treats unknown or
unsupported patterns as evaluation-blocking. The Todo App runtime Evidence-only artifact records `checkerRun: true`,
`nonEnforcing: true`, `scopeComplianceEvaluationStatus: evaluation-blocked`,
`scopeComplianceResult: evaluation-blocked`, `enforcementStatus: not-enforced`, and `evaluatedViolations: []`.

This decision does not introduce scope enforcement, diff rejection, CI required checks, branch protection, fixture
support, promotion approval, runtime Evidence satisfaction, equivalence proof, executor automation, graph delta apply,
or automated user acceptance. The evaluator is advisory only, and clean or blocking states from this slice are not
approval or enforcement authority.

## DEC-228 Add Advisory DevView Runtime Performance Budget

DEC-228 does not supersede DEC-097 through DEC-227. It adds
`docs/concept/devview-runtime-performance-budget.md`, the advisory timing smoke
`scripts/devview-runtime-timing-smoke.mjs`, and the npm script `devview:runtime:smoke`.

The runtime target is 5000ms for selected local deterministic DevView passes during normal task slices. This target
excludes Codex or AI editing time, full test suite runtime, full validation suite runtime, CI runtime, human review
time, Markdown documentation authoring, and DEC authoring. The timing smoke measures compiler input reporting, contract
compiler dry-run, git-derived changed-file collection, and advisory `graph read-model check-scope`. The collection
measurement writes to a `.tmp` smoke artifact rather than refreshing the tracked Todo App preview collection artifact.
The smoke lists graph delta proposal generation as a pending deterministic step when no supported runtime proposal
surface exists yet.

The timing smoke is advisory only. Timing over the target does not fail CI, create a required check, reject diffs,
enforce scope, approve fixtures, set `equivalenceProven: true`, satisfy runtime Evidence, apply graph deltas, introduce
executor automation, or replace user acceptance. `graph read-model report-health --json` exposes the timing smoke as a
non-enforcing summary with `runtimeBudgetEnforced: false` and does not run the smoke itself.

## DEC-229 Expose Advisory Scope Compliance Evaluator CLI

DEC-229 does not supersede DEC-097 through DEC-228. It adds the advisory CLI command
`graph read-model check-scope --base <baseRef> --head <headRef> --json` for the non-enforcing scope compliance
evaluator. The command collects git-derived changed-file names/status for explicit refs in memory, loads the current
Todo App runtime Evidence-only allowed/forbidden scope inputs, runs the evaluator, and prints JSON. It writes an
advisory evaluation artifact only when `--output <file>` is explicitly supplied.

The command is advisory only. Advisory findings do not reject diffs, fail CI, configure required checks, enforce scope,
approve fixtures, set `equivalenceProven: true`, satisfy runtime Evidence, apply graph deltas, introduce executor
automation, or replace user acceptance. Runtime failures such as invalid refs or unreadable internal inputs can still
return a nonzero exit code. The timing smoke includes this command as part of the advisory runtime budget, and
`report-health` names the CLI surface without running it as a gate.

## DEC-230 Add Compact Advisory Scope Runtime Report

DEC-230 does not supersede DEC-097 through DEC-229. It adds the compact advisory report surface
`graph read-model check-scope --base <baseRef> --head <headRef> --markdown <file> --json`. The report summarizes the
same advisory `check-scope` result with base/head refs, changed/evaluated file counts, result state, non-enforcement
status, finding counts, and advisory runtime-budget status. It is a readability layer over the advisory evaluator, not a
new checker mode.

The compact report is advisory only. It does not enforce scope, reject diffs, fail based on advisory findings, introduce
CI required checks, change branch protection, approve fixtures, set `equivalenceProven: true`, satisfy runtime Evidence,
apply graph deltas, introduce executor automation, or replace user acceptance. Runtime timing smoke may write the compact
report under `.tmp` while keeping the runtime budget advisory and avoiding tracked preview artifact churn.

## DEC-231 Preview Graph Delta Proposal Boundary From Advisory Scope Results

DEC-231 does not supersede DEC-097 through DEC-230. It adds the preview artifact
`examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-boundary.runtime-evidence-only.preview.json` to define
how advisory `check-scope` JSON, compact runtime reports, git-derived changed-file collection, and non-enforcing scope
evaluation may later inform graph delta proposal candidates.

The boundary is proposal-only. It previews candidate types such as scope-finding review notes, risk updates, Evidence
links, decision notes, changed-file observations, and runtime report links, but it does not create approved graph
updates. It records `proposalOnly: true`, `graphSourceMutated: false`, `graphDeltaApplied: false`,
`requiresHumanReview: true`, and `approvalStatus: not-approved`. No graph-source mutation, graph delta apply, approval,
equivalence proof, runtime Evidence satisfaction, enforcement, CI required check, branch protection, executor
automation, or user acceptance automation is introduced.

Potential older language in public docs should be read through the compatibility terms in [glossary.md](glossary.md). If
future review finds a public doc still presenting superseded terminology as active architecture, record it in
[open-questions.md](open-questions.md) or [superseded-items.md](superseded-items.md) before changing product meaning.

## DEC-232 Align Advisory Scope Results With Graph Delta Proposal Candidate Schema

DEC-232 does not supersede DEC-097 through DEC-231. It adds the preview artifact
`examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-candidate-schema.runtime-evidence-only.preview.json` to
align advisory `check-scope` result concepts with the existing graph operation proposal shape.

The alignment references `schemas/pbe/graph-update-proposal-v0.json`, `schemas/pbe/graph-delta-v0.json`, and existing
`graph operation capture-delta`, `propose-update`, and `apply-proposal` boundaries. Changed-file observations partially
align with `changedFiles`, risk and decision-note candidates partially align with `proposedRecordState`, and boundary
requirements align with `boundaries`. Evidence links, runtime report links, source record binding, graph delta source
selection, and edge intent mapping remain review-required unresolved mappings.

This is proposal-candidate schema alignment only. It does not generate a `pbe-graph-update-proposal-v0` artifact, mutate
graph-source, apply graph deltas, approve proposals, change equivalence behavior, satisfy runtime Evidence, enforce
scope, reject diffs, introduce CI required checks, change branch protection, introduce executor automation, or automate
user acceptance.

## DEC-233 Decide Graph Delta Proposal Unresolved Mappings

DEC-233 does not supersede DEC-097 through DEC-232. It adds the preview artifact
`examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-unresolved-mapping-decision.runtime-evidence-only.preview.json`
to record the narrow mapping decisions required before a proposal-only generator can be considered.

The decision identifies `CH-001` as an existing Todo App structure-only change node candidate for future `sourceRecordId`
review. It does not treat advisory `check-scope` output as source authority, and it does not make `CH-001` an apply-ready
operation-chain record. `graphDeltaPath` remains unresolved until a graph-delta-compatible source artifact exists,
because advisory `check-scope` output and git-derived changed-file collection are not graph deltas. Advisory evaluation
JSON may be linked only as an `evidence-link-candidate`, compact markdown may be linked only as a
`runtime-report-link-candidate`, and both remain candidate-only until human review.

This is a proposal-only mapping decision. It does not generate graph delta proposals, mutate graph-source, apply graph
deltas, approve graph updates, change equivalence behavior, satisfy runtime Evidence, enforce scope, reject diffs,
introduce CI required checks, change branch protection, introduce executor automation, or automate user acceptance.

## DEC-234 Preview Graph-Delta-Compatible Source Artifact

DEC-234 does not supersede DEC-097 through DEC-233. It adds the preview artifact
`examples/valid/todo-app-pbe-run/generated/graph-delta-compatible-source.runtime-evidence-only.preview.json` as the
future proposal-only generator input shape for the Todo App runtime Evidence-only calibration fixture.

The source preview gathers references to advisory `check-scope` JSON, compact advisory runtime reports, git-derived
changed-file collection, non-enforcing scope evaluation, the proposal boundary preview, candidate schema alignment, and
the unresolved mapping decision. It keeps `CH-001` as a structure-only `sourceRecordId` review candidate, records
Evidence/report links as candidate-only context, and leaves `graphDeltaPath` candidate-only/not-written until a future
generator task selects an output policy.

This source artifact is not graph-source, not a `graph-delta-v0` artifact, not a `pbe-graph-update-proposal-v0`
artifact, and not apply. It does not generate proposals, mutate graph-source, apply graph deltas, approve graph updates,
change equivalence behavior, satisfy runtime Evidence, enforce scope, reject diffs, introduce CI required checks, change
branch protection, introduce executor automation, or automate user acceptance.

## DEC-235 Decide Proposal-Only Graph Delta Generator Scope

DEC-235 does not supersede DEC-097 through DEC-234. It adds the preview artifact
`examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-generator-scope-decision.runtime-evidence-only.preview.json`
to define the narrow future generator/CLI scope before any proposal-only implementation begins.

The decision selects a first future slice that reads the graph-delta-compatible source artifact, validates required
boundary fields, and emits proposal-shaped preview JSON through stdout by default or a file only when explicit `--output`
is supplied. It records the preferred future advisory command shape
`graph read-model propose-graph-delta --source <sourceArtifact> --output <proposalPath> --json`, keeps advisory findings
non-failing, and reserves nonzero exits for malformed input, unreadable sources, boundary validation failures, or runtime
errors.

This is a scope decision only. It does not implement the generator, generate graph update proposals, mutate graph-source,
apply graph deltas, approve graph updates, change equivalence behavior, satisfy runtime Evidence, enforce scope, reject
diffs, introduce CI required checks, change branch protection, introduce executor automation, or automate user
acceptance.

## DEC-236 Implement Proposal-Only Graph Delta Generator

DEC-236 does not supersede DEC-097 through DEC-235. It implements the first small proposal-only generator/CLI selected by
DEC-235:

```text
graph read-model propose-graph-delta --source <sourceArtifact> --json
graph read-model propose-graph-delta --source <sourceArtifact> --output <proposalPath> --json
```

The generator reads a graph-delta-compatible source artifact, validates required non-apply boundaries, and emits a
`graph-delta-proposal-only-preview` object aligned to `pbe-graph-update-proposal-v0` through `schemaId`. It writes
nothing by default and writes only to an explicit `--output` path. It preserves `CH-001` as a
`structure-only-review-candidate`, keeps advisory Evidence/report links candidate-only, and records human review
questions for source record identity, Evidence acceptance, and default output path policy.

The implementation is proposal-only and unapproved. It does not create an apply-ready `pbe-graph-update-proposal-v0`
artifact, mutate graph-source, apply graph deltas, approve graph updates, change equivalence behavior, satisfy runtime
Evidence, enforce scope, reject diffs, introduce CI required checks, change branch protection, introduce executor
automation, or automate user acceptance. The default graphDeltaPath policy remains unresolved except for explicit preview
output paths supplied by the caller.

## DEC-237 Add Human Review Packet For Proposal-Only Graph Delta Previews

DEC-237 does not supersede DEC-097 through DEC-236. It adds the Human Review Packet surface for proposal-only Graph
Delta previews:

```text
graph read-model review-graph-delta --proposal <proposalPath> --json
graph read-model review-graph-delta --proposal <proposalPath> --markdown <file> --json
```

The packet command reads a `graph-delta-proposal-only-preview`, validates required non-apply and non-approval
boundaries, and emits `reviewPacketStatus: review-required` with compact counts, candidate-only items, and human review
questions. JSON is stdout by default. Markdown is written only when explicit `--markdown` is supplied.

The review packet is review input only. It does not record approval, record human decisions, mutate graph-source, apply
graph deltas, approve graph updates, change equivalence behavior, satisfy runtime Evidence, enforce scope, reject diffs,
introduce CI required checks, change branch protection, introduce executor automation, or automate user acceptance.

## DEC-238 Define DevView Codex Hook Gateway Boundary

DEC-238 does not supersede DEC-097 through DEC-237. It previews the DevView Codex Hook Gateway boundary for future
DevView ON activation and routing through Codex lifecycle hooks.

The boundary preview is recorded in:

```text
examples/valid/todo-app-pbe-run/generated/devview-codex-hook-gateway-boundary.runtime-evidence-only.preview.json
```

It defines future responsibilities for `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, and `Stop`;
activation modes (`off`, future `advisory`, future `guided`, and reserved `strict-disabled`); a transient session
artifact shape under `.tmp/devview/sessions/<sessionId>/session.json`; bypass detection statuses; UserPromptSubmit
additional context policy; and hook trust/health prerequisites.

This is an activation/routing boundary only. It does not implement hook scripts, introduce actual blocking hook
behavior, call an LLM from hooks, mutate graph-source, apply graph deltas, approve graph updates, record human
decisions, change equivalence behavior, satisfy runtime Evidence, enforce scope as CI, introduce required checks, change
branch protection, introduce executor automation, or automate user acceptance. Strict mode remains disabled.

## DEC-239 Define Natural Language Request Intake Compiler Frontend Boundary

DEC-239 does not supersede DEC-097 through DEC-238. It previews DevView's natural-language compiler frontend boundary:

```text
natural language request
-> AI Request IR candidate
-> deterministic Request IR validation
-> graph traversal plan
-> selected node/edge slice
-> contract compiler input
```

The boundary preview is recorded in:

```text
examples/valid/todo-app-pbe-run/generated/natural-language-request-intake-boundary.runtime-evidence-only.preview.json
```

Natural language is accepted as the human request surface. A future AI analyzer may classify and propose a Request IR
candidate, but AI-produced fields are candidate-only. Unvalidated AI output cannot drive graph traversal, selected graph
slice generation, contract compiler input generation, or instruction pack generation. Deterministic compiler behavior
begins after Request IR validation.

This decision does not implement an AI classifier, call an LLM from runtime code, implement hook scripts, implement hook
health/install/trust checks, mutate graph-source, apply graph deltas, approve graph updates, record human decisions,
change equivalence behavior, satisfy runtime Evidence, enforce scope, introduce CI required checks, change branch
protection, or automate user acceptance.

## DEC-240 Define Request IR Candidate Schema And Calibration Fixture

DEC-240 does not supersede DEC-097 through DEC-239. It defines the first Request IR Candidate schema preview and the
first Todo App runtime-Evidence-only calibration candidate fixture for natural-language request intake.

The schema and fixture are recorded in:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-candidate-schema.runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json
```

The Request IR Candidate shape is candidate-only. A future AI analyzer may produce fields such as
`requestTypeCandidate`, `changeTypeCandidate`, `targetRecordIdCandidate`, scope intent candidates, required Evidence
intent candidates, confidence, ambiguities, clarification state, and human-review state. The first calibration fixture
models a Korean request to add Todo App add-button behavior evidence without touching production source, classifying it
as `runtime-evidence-only` and `test-only-behavior-proof` with `CH-001` and `Todo App` as candidate targets.

At this DEC-240 step, no AI classifier is implemented, no runtime LLM call is introduced, and no Request IR validator is
implemented. Unvalidated AI output cannot drive graph traversal, selected graph slice generation, contract compiler input generation, or
instruction pack generation. The schema and fixture do not mutate graph-source, apply graph deltas, approve graph
updates, record human decisions, change equivalence behavior, satisfy runtime Evidence, enforce scope, introduce CI
required checks, change branch protection, or automate user acceptance.

## DEC-241 Implement Schema-Only Request IR Candidate Validator

DEC-241 does not supersede DEC-097 through DEC-240. It implements the first deterministic Request IR Candidate
validation pass:

```text
graph read-model validate-request-ir --candidate <candidatePath> --json
graph read-model validate-request-ir --candidate <candidatePath> --output <validationPath> --json
```

The validator is schema-and-boundary-only. It checks required fields, narrow request type enum values, candidate-only
boundary fields, authority status, confidence policy, ambiguity policy, and the rule that unvalidated Request IR
Candidates cannot drive graph traversal, contract generation, or instruction-pack generation. The Todo App calibration
result is recorded in:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-validation.add-todo-runtime-evidence-only.preview.json
```

A schema-valid result remains `schema-valid-graph-validation-not-run`, with `graphAuthorityValidationStatus: not-run`,
`graphTraversalAllowed: false`, `contractGenerationAllowed: false`, and `instructionPackGenerationAllowed: false`.

This decision does not implement an AI classifier, call an LLM from runtime code, perform graph-aware validation,
validate graph node or edge existence, run graph traversal, select graph slices, generate contract compiler input,
generate instruction packs, mutate graph-source, apply graph deltas, approve graph updates, record human decisions,
change equivalence behavior, satisfy runtime Evidence, enforce scope, introduce CI required checks, change branch
protection, or automate user acceptance.

## DEC-242 Define Request IR Graph-Aware Validation Boundary

DEC-242 does not supersede DEC-097 through DEC-241. It previews the Request IR graph-aware validation boundary that must
exist between schema-only Request IR Candidate validation and graph traversal.

The boundary preview is recorded in:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-graph-aware-validation-boundary.runtime-evidence-only.preview.json
```

The preview defines schema-only validation as a prerequisite, identifies graph/read-model authority inputs, and records
future checks for `targetRecordIdCandidate`, `targetComponentCandidate`, `requestTypeCandidate`, `changeTypeCandidate`,
scope intent candidates, required Evidence intent candidates, and risk intent candidates. For the Todo App calibration
fixture it keeps `CH-001`, `Todo App`, `runtime-evidence-only`, and `test-only-behavior-proof` as candidate values that
require future graph-aware validation.

The boundary is preview-only. It does not implement graph-aware validation, run graph traversal, select nodes or edges,
generate selected graph slice artifacts, generate contract compiler input, generate instruction packs, call an LLM,
implement an AI classifier, mutate graph-source, apply graph deltas, approve graph updates, record human decisions,
change equivalence behavior, satisfy runtime Evidence, enforce scope, introduce CI required checks, change branch
protection, or automate user acceptance.

## DEC-243 Implement Request IR Graph-Aware Validator

DEC-243 does not supersede DEC-097 through DEC-242. It implements the first deterministic graph-aware Request IR
validator as a non-traversing compiler frontend pass.

The implementation is exposed through:

```text
graph read-model validate-request-ir-graph --candidate <candidatePath> --schema-validation <schemaValidationPath> --json
```

The validator is implemented in:

```text
cli/src/core/request-ir-graph-aware-validator.ts
```

The Todo App calibration result is recorded in:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-graph-validation.add-todo-runtime-evidence-only.preview.json
```

The validator requires schema-only Request IR validation first, reads graph/read-model authority metadata, and resolves
the first calibration candidate values `CH-001`, `Todo App`, `runtime-evidence-only`, and
`test-only-behavior-proof`. A successful result may set `graphTraversalAllowed: true`, but this means future traversal
permission only.

The validator is graph-aware but non-traversing. It does not implement an AI classifier, call an LLM, run graph
traversal, create graph traversal plans, select nodes or edges, generate selected graph slice artifacts, generate
contract compiler input, generate instruction packs, mutate graph-source, apply graph deltas, approve graph updates,
record human decisions, change equivalence behavior, satisfy runtime Evidence, enforce scope, introduce CI required
checks, change branch protection, or automate user acceptance.

## DEC-244 Define Graph Traversal Plan and Selected Graph Slice Boundary

DEC-244 does not supersede DEC-097 through DEC-243. It defines the next compiler frontend boundary after graph-aware
Request IR validation: a future Graph Traversal Plan and a future Selected Graph Slice.

The traversal plan boundary is recorded in:

```text
examples/valid/todo-app-pbe-run/generated/graph-traversal-plan-boundary.add-todo-runtime-evidence-only.preview.json
```

The selected graph slice boundary is recorded in:

```text
examples/valid/todo-app-pbe-run/generated/selected-graph-slice-boundary.add-todo-runtime-evidence-only.preview.json
```

The traversal boundary records that a future planner may run only after schema-only validation and graph-aware
validation have passed, `graphTraversalAllowed: true` is present, target record/component resolution is complete,
changeType compatibility is resolved, and required evidence policy is resolvable. For the Todo App calibration fixture,
the future traversal intent starts from `CH-001` and may later confirm the target component, scope policy,
allowed/forbidden scope sources, required evidence policy, stop conditions, output requirements, and linked risks.
`requiredNodeTypes`, `optionalNodeTypes`, `excludedNodeTypes`, `requiredEdgeTypes`, `optionalEdgeTypes`, and
`excludedEdgeTypes` are limited to actual graph-source taxonomy vocabulary. Planner semantics such as target component,
scope policy, required Evidence, output requirement, and risk are recorded separately as node roles, edge roles,
selection intents, and contract input source roles.

The selected graph slice boundary defines the future selected node/edge slice shape and contract input readiness policy.
It keeps `selectedGraphSliceStatus: not-generated`, `selectedGraphSliceGenerated: false`,
`contractInputGenerated: false`, and `instructionPackGenerated: false`. Contract input cannot be generated directly
from the Request IR Candidate, schema-only validation, graph-aware validation, or traversal boundary preview.

This decision is preview-only. It does not implement graph traversal, execute graph traversal, select nodes or edges,
generate selected graph slice artifacts as actual traversal output, generate contract compiler input, generate
instruction packs, call an LLM, implement an AI classifier, mutate graph-source, apply graph deltas, approve graph
updates, record human decisions, change equivalence behavior, satisfy runtime Evidence, enforce scope, introduce CI
required checks, change branch protection, or automate user acceptance.

## DEC-245 Implement Deterministic Graph Traversal Plan Generator

DEC-245 does not supersede DEC-097 through DEC-244. It implements the first deterministic Graph Traversal Plan generator
after graph-aware Request IR validation.

The generator is exposed through:

```text
graph read-model plan-traversal --graph-validation <graphAwareValidationPath> --json
```

The implementation is recorded in:

```text
cli/src/core/graph-traversal-plan.ts
```

The Todo App calibration plan is generated at:

```text
examples/valid/todo-app-pbe-run/generated/graph-traversal-plan.add-todo-runtime-evidence-only.preview.json
```

The generator consumes a `request-ir-graph-aware-validation` artifact, reads the referenced graph source and generated
read model, validates traversal prerequisites, resolves the start node `CH-001`, and emits graph taxonomy-backed node
and edge type fields plus separate planner role/intent/source-role fields. It may report
`selectedGraphSlicePlanningAllowed: true`, but that is permission for a later selected-slice pass only.

Selected graph slice generation is still not implemented. Graph traversal execution and final node/edge selection are
not claimed. Contract input generation remains blocked until a selected graph slice exists. This decision does not
generate instruction packs, call an LLM, implement an AI analyzer, implement hook scripts, mutate graph-source, apply
graph deltas, approve graph updates, record human decisions, change equivalence behavior, satisfy runtime Evidence,
enforce scope, introduce CI required checks, change branch protection, or automate user acceptance.

## DEC-246 Implement Deterministic Selected Graph Slice Generator

DEC-246 does not supersede DEC-097 through DEC-245. It implements the first deterministic Selected Graph Slice generator
after Graph Traversal Plan generation.

The generator is exposed through:

```text
graph read-model select-slice --traversal-plan <planPath> --json
```

The implementation is recorded in:

```text
cli/src/core/selected-graph-slice.ts
```

The Todo App calibration slice is generated at:

```text
examples/valid/todo-app-pbe-run/generated/selected-graph-slice.add-todo-runtime-evidence-only.preview.json
```

The generator consumes a ready `graph-traversal-plan` artifact, reads the referenced graph source and generated read
model, validates slice prerequisites, resolves the single start node `CH-001`, and selects a bounded direct
graph-source/read-model slice. Selection is deterministic and traceable: selected nodes, selected edges, category
groups, excluded items, and selection trace entries are written into the selected slice artifact.

For the Todo App runtime-Evidence-only calibration, the selected nodes are `CH-001`, `WT-1`, `TT-1`, `EV-1`, and
`IM-001`. The selected edges are `E-CH-001-TOUCHES-WT-1`, `E-CH-001-PRESERVES-TT-1`,
`E-CH-001-PRESERVES-EV-1`, and `E-IM-001-REPORTS-ON-CH-001`. Approval edges remain excluded unless a future explicit
policy says otherwise.

The selected slice is not contract compiler input yet. Contract input generation remains blocked until a future
selected-slice-to-contract-input mapper exists. This decision does not generate instruction packs, call an LLM,
implement an AI analyzer, implement hook scripts, mutate graph-source, apply graph deltas, approve graph updates,
record human decisions, change equivalence behavior, satisfy runtime Evidence, enforce scope, introduce CI required
checks, change branch protection, or automate user acceptance.

## DEC-247 Implement Selected Graph Slice to Contract Compiler Input Generator

DEC-247 does not supersede DEC-097 through DEC-246. It implements the first deterministic mapper from a generated
Selected Graph Slice to Contract Compiler Input.

The generator is exposed through:

```text
graph read-model generate-contract-input --selected-slice <selectedSlicePath> --json
```

The implementation is recorded in:

```text
cli/src/core/contract-input-generator.ts
```

The Todo App calibration Contract Compiler Input is generated at:

```text
examples/valid/todo-app-pbe-run/generated/contract-compiler-input.add-todo-runtime-evidence-only.preview.json
```

The generator consumes a generated `selected-graph-slice` artifact, validates selected-slice prerequisites, preserves
source authority links, and maps the slice into existing compiler input model groups: `humanRequest`, `graphSnapshot`,
`packSchema`, `policySnapshot`, `evidenceIndex`, `targetScopeCandidates`, `outputRequirementSources`,
`stopConditionSources`, and `riskSources`. The generated input is deterministic and traceable to selected nodes, edges,
and the graph-aware validation context.

For the Todo App runtime-Evidence-only calibration, `targetScopeCandidates` keep selected context from `CH-001`, `WT-1`,
`TT-1`, and `EV-1`, while `allowedScope` is narrowed to selected check/evidence/report-oriented artifacts derived from
`TT-1` and `EV-1`. Change-tree and work-tree context paths are not authorized as editable allowed scope. Evidence paths
are fixture-root normalized when a selected node points at `.pbe/...`; risk context comes from `IM-001`; output
requirements remain preview/advisory reporting obligations; and forbidden production source changes remain unresolved
unless selected graph/source authority proves a concrete path.

This frontend artifact reports `frontend-field-compatible-with-compiler-input-model-groups` and
`backendDryRunValidationStatus: not-run-not-same-artifact-role`. It is intentionally not a
`compiler-input-model-dry-run` artifact and does not claim backend dry-run validation passed.

Instruction pack generation is still not implemented in the frontend path. This decision does not invoke the backend
contract compiler dry-run, trigger Codex execution, generate instruction packs, call an LLM, implement an AI analyzer,
implement hook scripts, mutate graph-source, apply graph deltas, approve graph updates, record human decisions, change
equivalence behavior, satisfy runtime Evidence, enforce scope, introduce CI required checks, change branch protection,
or automate user acceptance.

## DEC-248 Implement Contract Input to Instruction Pack Generator

DEC-248 does not supersede DEC-097 through DEC-247. It implements the first deterministic frontend generator from
generated Contract Compiler Input to Instruction Pack JSON/Markdown.

The generator is exposed through:

```text
graph read-model generate-instruction-pack --contract-input <contractInputPath> --json
```

The implementation is recorded in:

```text
cli/src/core/instruction-pack-generator.ts
```

The Todo App calibration Instruction Pack outputs are generated at:

```text
examples/valid/todo-app-pbe-run/generated/instruction-pack.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/instruction-pack.add-todo-runtime-evidence-only.preview.md
```

The generator consumes a generated `contract-compiler-input` artifact, validates required non-execution safety fields,
preserves the narrowed allowed scope from `TT-1` and `EV-1`, carries unresolved production-source forbidden scope,
graph-source mutation ban, approval/acceptance ban, required Evidence, stop conditions, known risks, output
requirements, and trace context into a deterministic pack for Codex/human review.

Explicit JSON/Markdown preview output is allowed only when the target path is not a source-authority path, not a
selected frontend input, not a concrete forbidden-scope path, not a graph snapshot artifact, not an Evidence authority
artifact, not a selected scope candidate path, and not an existing graph-source/source-authority-shaped JSON artifact.
The generator checks these output authority boundaries before writing, so blocked output paths leave existing files
unchanged.

The generated pack is not approval and does not trigger Codex execution. This decision does not call an LLM, implement
an AI analyzer, implement hook scripts, mutate graph-source, apply graph deltas, approve graph updates, record human
decisions, change equivalence behavior, satisfy runtime Evidence, enforce scope, introduce CI required checks, change
branch protection, or automate user acceptance.

## DEC-249 Define AI Request Analyzer Boundary

DEC-249 does not supersede DEC-097 through DEC-248. It previews the AI Request Analyzer boundary before any analyzer
implementation or LLM/API integration.

The boundary preview is recorded in:

```text
examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-boundary.add-todo-runtime-evidence-only.preview.json
```

The analyzer role is restricted to producing Request IR Candidate JSON from raw natural-language request text plus
optional repo/session context. Analyzer output has `candidateAuthorityStatus: ai-generated-candidate-not-validated` and
must pass deterministic `validate-request-ir` and `validate-request-ir-graph` before any traversal plan may be
attempted.

The preview records `analyzerImplemented: false`, `llmInvoked: false`, and `requestIrCandidateGenerated: false`.
Analyzer output cannot directly drive graph traversal, selected graph slice generation, contract compiler input
generation, instruction pack generation, Codex execution, graph-source mutation, graph delta apply, approval or human
decision recording, runtime Evidence satisfaction, equivalence proof, scope enforcement, or CI enforcement. Future LLM
inference time is outside the 5 second deterministic DevView runtime budget; the deterministic budget begins after a
candidate exists and validation commands run.

## DEC-250 Define DevView Hook Gateway Health Boundary

DEC-250 does not supersede DEC-097 through DEC-249. It previews the DevView Hook Gateway health/readiness boundary
before any hook scripts, installation, trust mutation, or blocking behavior are implemented.

The boundary preview is recorded in:

```text
examples/valid/todo-app-pbe-run/generated/devview-hook-gateway-health-boundary.runtime-evidence-only.preview.json
```

The health boundary defines what a future deterministic preflight should check before DevView treats hooks as active:
DevView mode (`off`, future `advisory`, future `guided`, or reserved `strict-disabled`), strict mode disabled state,
hook config/script presence, explicit repo/session trust state, observed hook events, UserPromptSubmit context readiness,
PreToolUse/PostToolUse/Stop readiness, bypass-detection readiness, and frontend artifact availability from AI Request
Analyzer boundary through Instruction Pack preview.

This is a boundary preview only. It does not implement a health-check CLI, implement hook scripts, install hooks, trust
commands, block Codex execution, enable strict or guided enforcement, call an LLM, mutate graph-source, apply graph
deltas, approve graph updates, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope,
introduce CI required checks, change branch protection, or automate user acceptance. A future actual health check should
remain lightweight and fit within the advisory 5 second deterministic DevView runtime budget.

## DEC-251 Implement Hook Gateway Health Report CLI

DEC-251 does not supersede DEC-097 through DEC-250. It implements a report-only deterministic CLI that reads the Hook
Gateway health boundary preview and emits compact readiness JSON.

The command is exposed through:

```text
graph read-model report-hook-gateway-health --boundary <healthBoundaryPath> --json
```

The implementation is recorded in:

```text
cli/src/core/hook-gateway-health-report.ts
```

The command reports `healthCheckImplemented: true` for the report command itself, while preserving
`hookScriptsImplemented: false`, `actualBlockingHookBehaviorImplemented: false`, `strictModeEnabled: false`,
`guidedEnforcementEnabled: false`, `nonEnforcing: true`, and `runtimeBudgetEnforced: false`. It summarizes future
readiness items and frontend artifact availability from the boundary preview.

Explicit report output is allowed only for dedicated preview/report paths. The command rejects output paths before
writing when they would overwrite the source health boundary, linked source/preview artifacts, or source-authority-shaped
JSON artifacts.

This decision does not implement hook scripts, install hooks, trust commands, block Codex execution, enable strict or
guided enforcement, call an LLM, make network calls, mutate graph-source, apply graph deltas, approve graph updates,
record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, introduce CI required checks, change
branch protection, or automate user acceptance.

## DEC-252 Generate AI Request Analyzer Prompt Pack

DEC-252 does not supersede DEC-097 through DEC-251. It implements a deterministic prompt/input contract pack generator
for future AI Request Analyzer use, without implementing the analyzer or calling an LLM/API.

The command is exposed through:

```text
graph read-model generate-ai-request-analyzer-pack --boundary <analyzerBoundaryPath> --schema <requestIrCandidateSchemaPath> --json
```

The implementation is recorded in:

```text
cli/src/core/ai-request-analyzer-pack.ts
```

The Todo App calibration outputs are:

```text
examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-pack.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-pack.add-todo-runtime-evidence-only.preview.md
```

The generated pack contains future analyzer role guidance, required Request IR Candidate fields, narrow request type
taxonomy, confidence and ambiguity policy, required candidate boundary fields, safety instructions, forbidden use, and
the deterministic validation chain required before traversal. It preserves `llmInvoked: false`,
`networkCallsAllowed: false`, `requestIrCandidateGenerated: false`, `candidateOnly: true`, and downstream
traversal/slice/contract/input/execution/apply/approval/evidence/equivalence/enforcement flags false.

Explicit JSON/Markdown preview output is allowed only when the target path is not the analyzer boundary, Request IR
Candidate schema, calibration candidate, linked source/preview artifact, graph-source/read-model source authority, or
selected frontend/source artifact. The generator checks output authority before writing, so unsafe Markdown paths also
prevent safe JSON output from being written first.

This decision does not implement an AI analyzer, call an LLM/API, make network calls, generate a Request IR Candidate,
run Request IR validation, run graph traversal, generate selected graph slices, generate Contract Compiler Input,
generate execution Instruction Packs, trigger Codex execution, implement hook scripts, mutate graph-source, apply graph
deltas, approve graph updates, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope,
introduce CI required checks, change branch protection, or automate user acceptance.

## DEC-253 Define Runtime Smoke Lanes

DEC-253 does not supersede DEC-097 through DEC-252. It defines advisory runtime smoke lanes so the growing deterministic
smoke can keep broad coverage without making every new report or setup command part of the core request-to-pack budget.

The lane boundary preview is recorded in:

```text
examples/valid/todo-app-pbe-run/generated/devview-runtime-smoke-lane-boundary.runtime-evidence-only.preview.json
```

The timing smoke now reports `steps[].runtimeLane`, `runtimeLanePolicyStatus`, `runtimeSmokeLaneBoundary`,
`laneDefinitions`, and `laneTotals` while preserving the existing all-steps `measuredTotalMs` snapshot. The lane totals
are advisory and not enforced.

Current lanes:

- `analyzer-preflight-lane`: deterministic analyzer prompt/input setup, currently
  `generate-ai-request-analyzer-pack`.
- `core-critical-lane`: deterministic Request IR Candidate validation through Instruction Pack generation.
- `activation-readiness-lane`: report-only Hook Gateway readiness reporting.
- `advisory-backend-lane`: compiler dry-run/reporting, changed-file/scope advisory checks, proposal-only Graph Delta,
  and Human Review Packet reporting.

New report-only commands must not automatically enter `core-critical-lane`; they may remain in the all-steps advisory
smoke or use a non-critical lane until a later explicit decision promotes them. This decision does not remove existing
smoke coverage, enforce runtime budgets, fail CI on timing, reject diffs, enable strict/guided hook blocking, mutate
graph-source, apply graph deltas, approve graph updates, record human decisions, satisfy runtime Evidence, prove
equivalence, enforce scope, introduce CI required checks, change branch protection, or automate user acceptance.

## DEC-254 Report DevView Frontend Artifact Chain

DEC-254 does not supersede DEC-097 through DEC-253. It implements a deterministic report-only manifest for the current
Todo App frontend calibration artifact chain from natural-language intake through Instruction Pack preview.

The command is exposed through:

```text
graph read-model report-frontend-chain --intake <naturalLanguageIntakeBoundaryPath> --json
```

The implementation is recorded in:

```text
cli/src/core/frontend-chain-report.ts
```

The Todo App calibration outputs are:

```text
examples/valid/todo-app-pbe-run/generated/devview-frontend-chain.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/devview-frontend-chain.add-todo-runtime-evidence-only.preview.md
```

The manifest reads linked calibration artifacts and records each stage's artifact role, status, path, generated or
implemented state, and authority boundary. The current terminal stage is
`instruction-pack-preview-generated-no-codex-execution`.

Explicit JSON/Markdown report output is allowed only for dedicated manifest/report paths. The command rejects output
paths before writing when they would overwrite the source intake boundary, linked frontend artifacts, graph-source or
read-model source authority, selected slices, Contract Compiler Input, Instruction Pack artifacts, or other selected
frontend/source artifacts. Unsafe Markdown output also prevents safe JSON output from being written first.

This decision does not add the manifest to the core-critical runtime lane by default, call an LLM, generate a Request IR
Candidate, implement hook sessions, trigger Codex execution, mutate graph-source, apply graph deltas, approve graph
updates, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, introduce CI required
checks, change branch protection, or automate user acceptance.

## DEC-255 Define Clarification Interview Boundary

DEC-255 does not supersede DEC-097 through DEC-254. It defines the boundary for stopping ambiguous natural-language
requests before graph traversal and routing them to short structured clarification questions.

The boundary preview is recorded in:

```text
examples/valid/todo-app-pbe-run/generated/clarification-interview-boundary.add-todo-runtime-evidence-only.preview.json
```

Clarification is required when analyzer output or deterministic validation sees low confidence, `unknown` request type,
missing target record/component, ambiguous allowed or forbidden scope, missing evidence requirement, conflict between
user intent and graph/source authority, production-source edit ambiguity, or an implicit request for approval, graph
apply, acceptance, runtime Evidence satisfaction, equivalence proof, scope enforcement, or CI enforcement.

Clarification questions are constrained to one to three short questions at a time, each mapped to a Request IR field.
Questions may offer choices plus freeform clarification, but neither the question nor the answer records approval,
acceptance, runtime Evidence satisfaction, graph-source authority, or enforcement.

Clarification answers may create only a future revised Request IR Candidate with
`revisionAuthorityStatus: clarification-derived-candidate-not-validated`. A revised candidate must run through
`validate-request-ir` and `validate-request-ir-graph` again before graph traversal may be attempted. Clarification
answers cannot directly generate selected slices, Contract Compiler Input, Instruction Packs, or Codex execution.

This decision does not implement an interview UI, implement a Request IR revision generator, call an LLM/API, make
network calls, implement hook sessions, run graph traversal, generate selected graph slices, generate Contract Compiler
Input, generate Instruction Packs, trigger Codex execution, mutate graph-source, apply graph deltas, approve graph
updates, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, introduce CI required
checks, change branch protection, or automate user acceptance.

## DEC-256 Generate Clarification Interview Pack

DEC-256 does not supersede DEC-097 through DEC-255. It implements a deterministic report-only Clarification Interview
Pack generator that consumes a Clarification Interview boundary preview and a candidate-only Request IR artifact, then
emits a question-plan preview JSON and optional Markdown.

The command is exposed through:

```text
graph read-model generate-clarification-interview-pack --boundary <clarificationBoundaryPath> --candidate <requestIrCandidatePath> --json
```

The implementation is recorded in:

```text
cli/src/core/clarification-interview-pack.ts
```

The Todo App calibration outputs are:

```text
examples/valid/todo-app-pbe-run/generated/clarification-interview-pack.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/clarification-interview-pack.add-todo-runtime-evidence-only.preview.md
```

For the current calibration candidate, the generator records
`questionPlanStatus: no-questions-required-for-current-calibration-candidate` with `questionCount: 0`. If a future
candidate is ambiguous, the generator may produce one to three short structured questions mapped to Request IR fields,
with choices plus freeform clarification and `answerAuthorityStatus: clarification-answer-not-approval`.

The generator validates boundary role/status and candidate-only authority before planning questions. It rejects unsafe
candidate escalation such as `graphTraversalAllowed: true`, `contractGenerationAllowed: true`, or
`instructionPackGenerationAllowed: true`. Explicit JSON/Markdown output paths are guarded before writing and may not
overwrite the source boundary, source candidate, linked schema/intake/analyzer artifacts, graph-source/read-model source
authority, evidence artifacts, or selected frontend/source artifacts. Unsafe Markdown output prevents safe JSON output
from being written first.

This decision does not implement an interview UI, implement a Request IR Candidate revision generator, call an LLM/API,
make network calls, run Request IR validation, run graph traversal, generate selected graph slices, generate Contract
Compiler Input, generate Instruction Packs, trigger Codex execution, mutate graph-source, apply graph deltas, approve
graph updates, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, introduce CI
required checks, change branch protection, or automate user acceptance.

## DEC-257 Generate Revised Request IR Candidate From Clarification Answers

DEC-257 does not supersede DEC-097 through DEC-256. It implements a deterministic clarification-answer revision pass
that consumes a Clarification Interview Pack plus clarification answers and emits a revised Request IR Candidate preview.

The command is exposed through:

```text
graph read-model revise-request-ir-candidate --clarification-pack <packPath> --answers <answersPath> --output <revisedCandidatePath> --json
```

The implementation is recorded in:

```text
cli/src/core/request-ir-candidate-reviser.ts
```

The Todo App no-op calibration answer and revised candidate artifacts are:

```text
examples/valid/todo-app-pbe-run/generated/clarification-answers.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/request-ir-candidate.revised.add-todo-runtime-evidence-only.preview.json
```

For the current calibration, the Clarification Interview Pack has `questionCount: 0`, so the answers artifact records
`answerSetStatus: no-answers-required-for-current-calibration-candidate` and the revision is
`no-op-revision-generated`. Ambiguous future answers may revise only fields mapped by generated questions and only within
the Clarification Interview boundary vocabulary: `requestTypeCandidate`, `targetRecordIdCandidate`,
`targetComponentCandidate`, `allowedScopeIntentCandidate`, `forbiddenScopeIntentCandidate`,
`requiredEvidenceIntentCandidate`, and `riskIntentCandidate`.

The revised candidate preserves `requestIrCandidateStatus: candidate-only`,
`revisionAuthorityStatus: clarification-derived-candidate-not-validated`,
`authorityStatus: not-authoritative-until-validated`, `validationRequiredAgain: true`,
`graphTraversalAllowed: false`, `contractGenerationAllowed: false`, and `instructionPackGenerationAllowed: false`.
Answers cannot set approval, graph apply, runtime Evidence satisfaction, equivalence proof, enforcement, traversal,
contract, or instruction-pack authority. Unknown `questionId` values and unsafe answer authority fields block revision.
The command guards explicit output paths before writing so they cannot overwrite the pack, answers, original candidate,
linked schema/intake/analyzer artifacts, graph-source/read-model authority, evidence paths, or source-authority-shaped
JSON.

This decision does not call an LLM/API, implement an interview UI, run Request IR validation, run graph traversal,
generate selected graph slices, generate Contract Compiler Input, generate Instruction Packs, trigger Codex execution,
mutate graph-source, apply graph deltas, approve graph updates, record human decisions, satisfy runtime Evidence, prove
equivalence, enforce scope, introduce CI required checks, change branch protection, or automate user acceptance.

## DEC-258 Add AI Request Analyzer Command Surface

DEC-258 does not supersede DEC-097 through DEC-257. It implements the first `analyze-request` CLI surface for the future
AI Request Analyzer while keeping provider execution disabled.

The command is exposed through:

```text
graph read-model analyze-request --request <naturalLanguageText> --pack <aiRequestAnalyzerPackPath> --json
```

The implementation is recorded in:

```text
cli/src/core/ai-request-analyzer-run.ts
```

The Todo App provider-disabled run-result preview is:

```text
examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-run.provider-disabled.add-todo-runtime-evidence-only.preview.json
```

Without `--external-candidate`, the command is blocked with `analyzerProviderStatus: provider-disabled`,
`llmInvoked: false`, `networkCallsAllowed: false`, `requestIrCandidateGenerated: false`, and
`candidateImportRequired: true`. With `--external-candidate`, the command may import a precomputed Request IR Candidate
only after checking request text consistency, analyzer pack schema consistency, candidate-only safety fields, and unsafe
authority escalation. Imported candidates are normalized to `artifactRole: request-ir-candidate`,
`requestIrCandidateStatus: candidate-only`, `authorityStatus: not-authoritative-until-validated`,
`graphTraversalAllowed: false`, `contractGenerationAllowed: false`, and `instructionPackGenerationAllowed: false`.

Explicit output paths are guarded before writing so they cannot overwrite the analyzer pack, external candidate, linked
boundary/schema/intake/clarification artifacts, graph-source/read-model authority, evidence paths, or
source-authority-shaped JSON. Provider-disabled mode may write only an analyzer run-result preview. Blocked external
candidate imports do not write partial candidate output.

This decision does not implement an analyzer provider, call an LLM/API, make network calls, run Request IR validation,
run graph traversal, generate selected graph slices, generate Contract Compiler Input, generate Instruction Packs,
trigger Codex execution, mutate graph-source, apply graph deltas, approve graph updates, record human decisions, satisfy
runtime Evidence, prove equivalence, enforce scope, introduce CI required checks, change branch protection, or automate
user acceptance.

## DEC-259 Generate UserPromptSubmit Context Preview

DEC-259 does not supersede DEC-097 through DEC-258. It implements a deterministic advisory context preview for the future
DevView Hook Gateway `UserPromptSubmit` event without implementing actual hook scripts or blocking behavior.

The command is exposed through:

```text
graph read-model prepare-user-prompt-context --frontend-chain <frontendChainReport> --hook-health <healthReportOrBoundary> --instruction-pack <instructionPackJson> --instruction-markdown <instructionPackMarkdown> --json
```

The implementation is recorded in:

```text
cli/src/core/user-prompt-context.ts
```

The Todo App calibration outputs are:

```text
examples/valid/todo-app-pbe-run/generated/devview-user-prompt-submit-context.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/devview-user-prompt-submit-context.add-todo-runtime-evidence-only.preview.md
```

The preview reads the generated frontend chain report, Hook Gateway health report or boundary, Instruction Pack JSON,
and Instruction Pack Markdown. It emits `artifactRole: devview-user-prompt-submit-context-preview`,
`additionalContextInjectionReady: true`, `devviewMode: advisory`, `strictModeEnabled: false`,
`guidedEnforcementEnabled: false`, and `actualHookScriptsImplemented: false`. Its Markdown is compact additionalContext
for Codex: DevView status, terminal frontend stage, allowed/forbidden scope, required evidence, output requirements,
stop conditions, known risks, and the validation chain that produced the Instruction Pack preview.

The command blocks wrong roles/statuses, unsafe strict/guided/enforcement/approval/Evidence/equivalence signals, and
unsafe output paths before writing. `--output` and `--markdown` cannot overwrite the frontend chain, Hook Gateway health
artifact, Instruction Pack JSON/Markdown, linked source artifacts, graph/read-model authority, evidence paths, or
source-authority-shaped JSON.

This decision does not install hook scripts, mutate install/trust state, block Codex execution, call an LLM/API, make
network calls, run graph traversal, mutate graph-source, apply graph deltas, approve graph updates, record human
decisions, satisfy runtime Evidence, prove equivalence, enforce scope, introduce CI required checks, change branch
protection, or automate user acceptance.

## DEC-260 Define Hook Install Trust Boundary

DEC-260 does not supersede DEC-097 through DEC-259. It defines the preview boundary for deciding whether future DevView
hook scripts/config may be installed or trusted.

The boundary preview is recorded in:

```text
examples/valid/todo-app-pbe-run/generated/devview-hook-install-trust-boundary.runtime-evidence-only.preview.json
```

The preview links to the Hook Gateway boundary, Hook Gateway health boundary, and UserPromptSubmit context preview. It
defines repo-local hook config/script candidates, session-local context artifact candidates, generated preview artifact
candidates, trust prerequisites, future decision states, and disallowed mutations.

The current state remains conservative: `installTrustDecisionImplemented: false`,
`actualInstallOrTrustMutationImplemented: false`, `hookScriptsInstalled: false`, `hookGatewayTrusted:
not-checked-preview-only`, `hookGatewayActive: not-checked-preview-only`, `strictModeEnabled: false`,
`guidedEnforcementEnabled: false`, and `actualBlockingHookBehaviorImplemented: false`. Future advisory install requires
an explicit user decision, explicit repo path, advisory mode first, strict mode disabled, and health/context preview
availability. Future decision states such as `user-approved-advisory-install` and `revoked` are documented as future
only.

This decision does not install hooks, trust commands, mutate Codex or repo config, activate hooks, block Codex
execution, call an LLM/API, make network calls, mutate graph-source, apply graph deltas, approve graph updates, record
human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, introduce CI required checks, change branch
protection, or automate user acceptance.

## DEC-261 Generate Hook Script Scaffold Preview

DEC-261 does not supersede DEC-097 through DEC-260. It adds a deterministic preview-only Hook Gateway script scaffold
surface for Phase 12 session integration.

The command is:

```text
graph read-model generate-hook-script-scaffold --boundary <gatewayBoundary> --hook-health <healthBoundary> --install-trust <installTrustBoundary> --user-prompt-context <contextPreview> --json
```

The Todo App calibration artifacts are:

```text
examples/valid/todo-app-pbe-run/generated/devview-hook-script-scaffold.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/devview-hook-script-scaffold.add-todo-runtime-evidence-only.preview.md
```

The scaffold emits preview template records for `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, and
`Stop`. Each template is `not-installed-preview-only`, `not-active-preview-only`, and
`non-enforcing-advisory-only`. The generator reads the Hook Gateway boundary, Hook Gateway health boundary,
install/trust boundary, and UserPromptSubmit context preview, then blocks unsafe authority signals and active hook/config
output paths before writing either JSON or Markdown.

The runtime smoke includes this command in the `activation-readiness-lane`, not the `core-critical-lane`. The timing
budget remains advisory and non-enforced.

This decision does not install hook scripts, write active hook config, trust repositories, mutate Codex or repo config,
activate hooks, block Codex execution, call an LLM/API, make network calls, mutate graph-source, apply graph deltas,
approve graph updates, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, introduce CI
required checks, change branch protection, or automate user acceptance.

## DEC-262 Generate Hook Script Template Preview

DEC-262 does not supersede DEC-097 through DEC-261. It materializes the Hook Gateway script scaffold into review-only
script body previews while preserving the no-install/no-activation boundary.

The command is:

```text
graph read-model generate-hook-script-templates --scaffold <hookScriptScaffold> --json
```

The Todo App calibration artifacts are:

```text
examples/valid/todo-app-pbe-run/generated/devview-hook-script-template.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/devview-hook-script-template.add-todo-runtime-evidence-only.preview.md
```

The output has `artifactRole: devview-hook-script-template-preview` and contains `powershell-preview` body lines for
`SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, and `Stop`. The bodies are review artifacts only and
remain `not-installed-preview-only`, `not-active-preview-only`, and `no-mutation-no-blocking-preview`. Output guards
reject active hook/config paths such as `.codex/hooks/...` and source artifact overwrites before writing either JSON or
Markdown.

The runtime smoke includes this command in the `activation-readiness-lane`, not the `core-critical-lane`. The timing
budget remains advisory and non-enforced.

This decision does not write active hook files, install hooks, trust repositories, mutate Codex or repo config, activate
hooks, block Codex execution, call an LLM/API, make network calls, run validation or traversal, mutate graph-source,
apply graph deltas, approve graph updates, record human decisions, satisfy runtime Evidence, prove equivalence, enforce
scope, introduce CI required checks, change branch protection, or automate user acceptance.

## DEC-263 Generate Hook Session Manifest Preview

DEC-263 does not supersede DEC-097 through DEC-262. It adds a deterministic preview-only session manifest for the Hook
Gateway activation path without starting or activating hooks.

The command is:

```text
graph read-model generate-hook-session-manifest --hook-health <healthReportOrBoundary> --user-prompt-context <contextPreview> --script-scaffold <scaffoldPreview> --script-templates <templatePreview> --json
```

The Todo App calibration artifacts are:

```text
examples/valid/todo-app-pbe-run/generated/devview-hook-session-manifest.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/devview-hook-session-manifest.add-todo-runtime-evidence-only.preview.md
```

The output has `artifactRole: devview-hook-session-manifest-preview`, `sessionStatus: not-started-preview-only`,
`hooksActive: false`, `hookScriptsInstalled: false`, `hookGatewayActive: not-checked-preview-only`, and
`bypassDetectionStatus: preview-only-non-enforcing`. It records transient `.tmp/devview/sessions/<sessionId>/...`
candidate paths and readiness for `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, and `Stop`.

The command is not included in the current all-steps runtime smoke because adding it produced an advisory over-target
snapshot while the `core-critical-lane` remained well under 5 seconds. It should be added to a future lane-specific smoke
or reintroduced after timing optimization.

This decision does not start a hook session, install hooks, activate hooks, write active hook files, trust repositories,
mutate Codex or repo config, block Codex execution, call an LLM/API, make network calls, run validation or traversal,
mutate graph-source, apply graph deltas, approve graph updates, record human decisions, satisfy runtime Evidence, prove
equivalence, enforce scope, introduce CI required checks, change branch protection, or automate user acceptance.

## DEC-264 Report Hook Activation Preview Chain

DEC-264 does not supersede DEC-097 through DEC-263. It adds a deterministic report-only command that checks continuity
across the Hook Gateway activation preview artifacts without activating hooks.

The command is:

```text
graph read-model report-hook-activation-chain --hook-health <healthReportOrBoundary> --user-prompt-context <contextPreview> --script-scaffold <scaffoldPreview> --script-templates <templatePreview> --session-manifest <sessionManifestPreview> --json
```

The Todo App calibration artifacts are:

```text
examples/valid/todo-app-pbe-run/generated/devview-hook-activation-chain.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/devview-hook-activation-chain.add-todo-runtime-evidence-only.preview.md
```

The output has `artifactRole: devview-hook-activation-chain-report` and
`terminalActivationStage: session-manifest-preview-generated-no-hook-activation`. It checks source-path continuity from
health/context/scaffold/templates into the session manifest and requires each hook event to remain
`preview-ready-not-active`, `hookActive: false`, and `blockingEnabled: false`.

The command is not included in the current all-steps runtime smoke because the related session manifest preview already
pushed one local advisory snapshot over target while the `core-critical-lane` stayed under 5 seconds. The command should
be added to a future lane-specific smoke or reintroduced after timing optimization.

This decision does not install hooks, activate hooks, trust repositories, mutate Codex or repo config, block Codex
execution, call an LLM/API, make network calls, run validation or traversal, mutate graph-source, apply graph deltas,
approve graph updates, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, introduce CI
required checks, change branch protection, or automate user acceptance.

## DEC-265 Define Human Decision Record Boundary

DEC-265 does not supersede DEC-097 through DEC-264. It opens Phase 13 with a boundary preview only: Human Review Packet
generation remains separate from any future human-authored decision record, approved proposal state, or graph delta
apply.

The Todo App calibration artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-human-decision-record-boundary.runtime-evidence-only.preview.json
```

The output has `artifactRole: devview-human-decision-record-boundary-preview` and
`status: devview-human-decision-record-boundary-previewed`. It defines future inputs such as
`sourceHumanReviewPacket`, `sourceGraphDeltaProposal`, and `sourceRuntimeReport`, plus the allowed future decision
values:

```text
approve-proposal
reject-proposal
request-revision
defer-decision
```

The boundary requires future decisions to be human-authored and explicit. Codex output, validator success, runtime smoke,
CI success, review packet generation, or proposal generation cannot self-approve a proposal.

This decision does not implement a decision recording CLI, record a human decision, approve a proposal, create approved
proposal state, apply a graph delta, mutate graph-source, accept runtime Evidence, prove equivalence, enforce scope,
introduce CI required checks, change branch protection, or automate user acceptance.

## DEC-266 Define Human Decision Record Command Boundary

DEC-266 does not supersede DEC-097 through DEC-265. It previews the future command contract for recording a
human-authored decision while still leaving the command unimplemented.

The Todo App calibration artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-human-decision-record-command-boundary.runtime-evidence-only.preview.json
```

The future command shape is:

```text
graph read-model record-human-decision --review-packet <packet> --proposal <proposal> --decision <value> --output <decisionRecord> --json
```

The boundary defines required future inputs, allowed decision values, provenance checks, and output authority guard
expectations. The eventual command must require explicit human provenance, reject Codex/AI self-approval, and keep
decision recording separate from approved proposal state creation and graph delta apply.

This decision does not add a CLI command, record a human decision, approve a proposal, create approved proposal state,
apply a graph delta, mutate graph-source, accept runtime Evidence, prove equivalence, enforce scope, introduce CI
required checks, change branch protection, or automate user acceptance.

## DEC-267 Define Approved Proposal State Boundary

DEC-267 does not supersede DEC-097 through DEC-266. It previews the future state that may follow a human-authored
`approve-proposal` decision, while keeping that state separate from graph delta apply.

The Todo App calibration artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-approved-proposal-state-boundary.runtime-evidence-only.preview.json
```

The boundary points back to the Human Decision Record boundary and command boundary. It requires future tooling to check
that the decision record is human-authored, uses `decisionValue: approve-proposal`, matches the reviewed proposal, and
is not stale against the current graph-source/read-model baseline.

The approved state is still not apply. A future approved proposal state may become input to a separate apply boundary,
but it must not itself mutate graph-source or apply deltas.

This decision does not implement approved proposal state creation, create approved proposal state, apply a graph delta,
mutate graph-source, record a human decision, accept runtime Evidence, prove equivalence, enforce scope, introduce CI
required checks, change branch protection, or automate user acceptance.

## DEC-268 Define Graph Delta Apply Boundary

DEC-268 does not supersede DEC-097 through DEC-267. It previews the future graph delta apply boundary without adding an
apply command or mutating graph-source.

The Todo App calibration artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-graph-delta-apply-boundary.runtime-evidence-only.preview.json
```

The boundary points back to the Human Decision Record and Approved Proposal State boundaries. It defines future apply
inputs and checks: approved proposal state, current graph-source identity/hash, proposal delta match, stale proposal
rejection, conflict detection, rollback/fallback readiness, and dry-run/apply separation.

Dry-run and apply remain separate. The preview requires a future dry-run surface before any `--apply` mutation and
requires a current graph-source recheck at apply time.

This decision does not add an apply CLI command, enable graph delta apply, apply graph deltas, mutate graph-source,
create approved proposal state, record a human decision, accept runtime Evidence, prove equivalence, enforce scope,
introduce CI required checks, change branch protection, or automate user acceptance.

## DEC-269 Define Evidence Acceptance Policy Boundary

DEC-269 does not supersede DEC-097 through DEC-268. It previews the future Evidence acceptance policy without accepting
Evidence or setting runtime Evidence satisfaction.

The Todo App calibration artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-evidence-acceptance-policy-boundary.runtime-evidence-only.preview.json
```

The boundary separates three states that must not be conflated:

```text
evidence-linked
evidence-accepted
runtime-evidence-satisfied
```

Future tooling must not treat Codex claims, AI output, CI pass, validator pass, runtime smoke, Human Review Packet
generation, or graph apply as Evidence acceptance by itself. Evidence acceptance may require human judgment or a
separately approved deterministic policy, and runtime Evidence satisfaction requires accepted Evidence to be bound to
the relevant runtime obligation.

This decision does not implement Evidence acceptance, accept Evidence, set `runtimeEvidenceSatisfied: true`, prove
equivalence, enforce scope, apply graph deltas, mutate graph-source, introduce CI required checks, change branch
protection, or automate user acceptance.

## DEC-270 Define Graph-source Mutation Policy Boundary

DEC-270 does not supersede DEC-097 through DEC-269. It previews the future graph-source mutation policy without allowing
or performing any graph-source writes.

The Todo App calibration artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-graph-source-mutation-policy-boundary.runtime-evidence-only.preview.json
```

The boundary defines the only future mutation target class as an explicit current graph-source after approved proposal
state and apply preconditions. It forbids mutation of unrelated graph-source files, generated read-model outputs,
Evidence artifacts, proposal/review/decision inputs, Codex hook/config files, CI or branch protection configuration, and
production source.

It also previews required pre-mutation backup, rollback, fallback, path containment, dry-run review, and post-mutation
read-model regeneration, consistency check, mutation report, and rollback-on-failure requirements.

This decision does not implement mutation policy execution, allow graph-source mutation, write graph-source, apply graph
deltas, create approved proposal state, record human decisions, accept Evidence, satisfy runtime Evidence, prove
equivalence, enforce scope, introduce CI required checks, change branch protection, mutate production source, mutate
Codex hook/config files, or automate user acceptance.

## DEC-271 Record DevView Roadmap Completion Audit Preview

DEC-271 does not supersede DEC-097 through DEC-270. It records a calibration audit artifact summarizing the roadmap
state across Phase 1 through Phase 13.

The Todo App calibration artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-roadmap-completion-audit.runtime-evidence-only.preview.json
```

The audit lists implemented command surfaces for deterministic request validation, graph traversal, selected slice,
contract input generation, instruction pack generation, analyzer pack/import surfaces, clarification pack/revision
surfaces, hook preview chain surfaces, advisory scope/proposal/review surfaces, and controlled-apply boundary previews.

It also lists explicit non-goals still preserved as future or disabled: Codex execution, active hooks, guided/strict
blocking, LLM provider execution, human decision recording, approved state creation, graph delta apply, graph-source
mutation, Evidence acceptance, runtime Evidence satisfaction, equivalence proof, scope enforcement, CI required checks,
branch protection changes, approval automation, and user acceptance automation.

This decision does not implement missing future actions, execute Codex, call an LLM/API, activate hooks, record human
decisions, approve proposals, apply graph deltas, mutate graph-source, accept Evidence, satisfy runtime Evidence, prove
equivalence, enforce scope, introduce CI required checks, change branch protection, or automate user acceptance.

## DEC-272 Record Explicit Human Decision Preview

DEC-272 does not supersede DEC-097 through DEC-271. It implements the `graph read-model record-human-decision` command
as an explicit human decision record surface without approved proposal state creation or apply.

The Todo App calibration artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-human-decision-record.defer-decision.runtime-evidence-only.preview.json
```

The command consumes a proposal-only Graph Delta preview, a Human Review Packet, an explicit decision value from the
Human Decision Record boundary vocabulary, a human reviewer identity, and a human-authored rationale. The calibration
decision uses `defer-decision`, leaving the proposal unapproved.

Output authority guards reject attempts to overwrite the boundary, review packet, proposal, runtime report,
graph-source-shaped artifacts, Evidence/source artifacts, or selected frontend/source artifacts. Unsafe Markdown output
prevents JSON output from being written first.

This decision records decision metadata only. It does not create approved proposal state, apply graph deltas, mutate
graph-source, accept Evidence, satisfy runtime Evidence, prove equivalence, enforce scope, introduce CI required checks,
change branch protection, automate approval, or automate user acceptance.

## DEC-273 Create Approved Proposal State Preview

DEC-273 does not supersede DEC-097 through DEC-272. It implements
`graph read-model create-approved-proposal-state` as a preview-only state transition after an explicit Human Decision
Record.

The Todo App calibration artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-approved-proposal-state.blocked-defer-decision.runtime-evidence-only.preview.json
```

The command consumes an Approved Proposal State boundary, a Human Decision Record, and a proposal-only Graph Delta
preview. It verifies the decision record role/status/provenance, proposal-only safety fields, proposal id/path
consistency, and output authority. A `decisionValue: approve-proposal` can create an approved-state preview, while the
calibration `defer-decision` input produces a blocked preview with `approvedProposalStateCreated: false`.

This decision does not apply graph deltas, mutate graph-source, accept Evidence, satisfy runtime Evidence, prove
equivalence, enforce scope, introduce CI required checks, change branch protection, automate approval, or automate user
acceptance.

## DEC-274 Check Graph Delta Apply Readiness

DEC-274 does not supersede DEC-097 through DEC-273. It implements
`graph read-model check-graph-delta-apply` as an apply-readiness preview surface after Approved Proposal State preview.

The Todo App calibration artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-graph-delta-apply-readiness.blocked-defer-decision.runtime-evidence-only.preview.json
```

The command consumes a Graph Delta Apply boundary, an Approved Proposal State preview, and a proposal-only Graph Delta
preview. It verifies role/status/safety fields, proposal id/path consistency, and output authority. The calibration
readiness is blocked because the approved-state preview was blocked by `defer-decision`.

This decision does not add an apply command, apply graph deltas, mutate graph-source, accept Evidence, satisfy runtime
Evidence, prove equivalence, enforce scope, introduce CI required checks, change branch protection, automate approval,
or automate user acceptance.

## DEC-275 Report Graph-source Mutation Readiness

DEC-275 does not supersede DEC-097 through DEC-274. It implements
`graph read-model report-graph-source-mutation-readiness` as a readiness-only surface after Graph Delta Apply readiness.

The Todo App calibration artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-graph-source-mutation-readiness.blocked-defer-decision.runtime-evidence-only.preview.json
```

The command consumes a Graph-source Mutation Policy boundary and a Graph Delta Apply readiness preview. It validates
policy/readiness safety fields and output authority, then reports whether mutation readiness is blocked or ready. The
calibration readiness is blocked because apply readiness is blocked.

This decision does not write graph-source, apply graph deltas, accept Evidence, satisfy runtime Evidence, prove
equivalence, enforce scope, introduce CI required checks, change branch protection, mutate production source, mutate
Codex hook/config files, automate approval, or automate user acceptance.

## DEC-276 Report Evidence Acceptance Readiness

DEC-276 does not supersede DEC-097 through DEC-275. It implements
`graph read-model report-evidence-acceptance-readiness` as a readiness-only surface after Graph-source Mutation
readiness.

The Todo App calibration artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-evidence-acceptance-readiness.blocked-defer-decision.runtime-evidence-only.preview.json
```

The command consumes an Evidence Acceptance Policy boundary and a Graph-source Mutation readiness preview. It validates
policy/readiness safety fields and output authority, then reports whether Evidence acceptance readiness is blocked or
ready. The calibration readiness is blocked because graph-source mutation readiness is blocked.

This decision does not implement an Evidence acceptance command, accept Evidence, satisfy runtime Evidence, prove
equivalence, apply graph deltas, mutate graph-source, enforce scope, introduce CI required checks, change branch
protection, mutate production source, mutate Codex hook/config files, automate approval, or automate user acceptance.

## DEC-277 Report Equivalence Proof Readiness

DEC-277 does not supersede DEC-097 through DEC-276. It implements
`graph read-model report-equivalence-proof-readiness` as a readiness-only surface after Evidence Acceptance readiness.

The Todo App calibration artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-equivalence-proof-readiness.blocked-defer-decision.runtime-evidence-only.preview.json
```

The command consumes an Equivalence Proof Policy boundary and an Evidence Acceptance readiness preview. It validates
policy/readiness safety fields and output authority, then reports whether equivalence proof readiness is blocked or
ready. The calibration readiness is blocked because Evidence acceptance readiness is blocked.

This decision does not implement an equivalence proof command, prove equivalence, set `equivalenceProven: true`, accept
Evidence, satisfy runtime Evidence, apply graph deltas, mutate graph-source, enforce scope, introduce CI required
checks, change branch protection, mutate production source, mutate Codex hook/config files, automate approval, or
automate user acceptance.

## DEC-278 Report Scope/CI Enforcement Readiness Disabled

DEC-278 does not supersede DEC-097 through DEC-277. It implements
`graph read-model report-scope-ci-enforcement-readiness` as a disabled readiness-only surface after Equivalence Proof
readiness.

The Todo App calibration artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-scope-ci-enforcement-readiness.blocked-defer-decision.runtime-evidence-only.preview.json
```

The command consumes a Scope/CI Enforcement Policy boundary and an Equivalence Proof readiness preview. It validates
policy/readiness safety fields and output authority, then reports whether future enforcement prerequisites are blocked
or ready while keeping enforcement disabled. The calibration readiness is blocked because Equivalence Proof readiness is
blocked.

This decision does not implement scope enforcement, CI required checks, branch protection mutation, diff rejection,
strict/guided blocking activation, equivalence proof, Evidence acceptance, runtime Evidence satisfaction, graph delta
apply, graph-source mutation, approval automation, or user acceptance automation.

## DEC-279 Refresh Roadmap Completion Audit After Readiness Chain

DEC-279 does not supersede DEC-097 through DEC-278. It refreshes the static roadmap completion audit preview after the
Phase 13 controlled decision/readiness chain was connected through disabled Scope/CI enforcement readiness.

The refreshed audit artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-roadmap-completion-audit.runtime-evidence-only.preview.json
```

The audit now lists the implemented command surfaces for explicit human decision recording, approved proposal state
preview, Graph Delta apply readiness, graph-source mutation readiness, Evidence acceptance readiness, equivalence proof
readiness, and disabled Scope/CI enforcement readiness. It also records that the calibration remains `defer-decision`
and blocked for approved-state/apply/mutation/evidence/equivalence/enforcement readiness.

This decision is an audit refresh only. It does not execute Codex, call an LLM, activate hooks, record new decisions,
approve proposals, apply graph deltas, mutate graph-source, accept Evidence, satisfy runtime Evidence, prove
equivalence, enforce scope, configure CI, configure required checks, change branch protection, reject diffs, or replace
user acceptance.

## DEC-280 Materialize Advisory Hook Script Bundle Preview

DEC-280 does not supersede DEC-097 through DEC-279. It implements
`graph read-model materialize-hook-script-bundle` as a repo-local preview materializer for advisory Hook Gateway scripts.

The Todo App calibration artifacts are:

```text
examples/valid/todo-app-pbe-run/generated/devview-hook-script-bundle.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/devview-hook-script-bundle.add-todo-runtime-evidence-only.preview.md
```

The command consumes a Hook script template preview and a Hook session manifest preview, validates preview-only safety
fields and output authority, then writes five advisory `.ps1` review files under a dedicated bundle directory such as
`.tmp/devview-hook-script-bundle/...`. It blocks active hook/config locations, source artifact overwrites, generated
source-authority output overwrites, unsafe bundle directories, and unsafe Markdown/output combinations before partial
writes.

This decision does not install hooks, mutate Codex configuration, trust repositories, start an active hook session,
block tool use, execute Codex, call an LLM, run validation/traversal, mutate graph-source, apply graph deltas, automate
approval, record human decisions, accept or satisfy Evidence, prove equivalence, enforce scope, configure CI, require
checks, change branch protection, reject diffs, or automate user acceptance.

## DEC-281 Record Roadmap Final Handoff Preview

DEC-281 does not supersede DEC-097 through DEC-280. It records the DevView roadmap final handoff preview for the Todo
App runtime Evidence-only calibration.

The handoff artifacts are:

```text
examples/valid/todo-app-pbe-run/generated/devview-roadmap-final-handoff.runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/devview-roadmap-final-handoff.runtime-evidence-only.preview.md
```

The handoff uses the roadmap completion audit as its source and summarizes the safe MVP end state: compiler frontend to
Instruction Pack preview, analyzer and clarification candidate-only boundaries, activation preview chain with repo-local
advisory hook script bundle, advisory backend/review surfaces, and Phase 13 controlled readiness chain. It also separates
future productization work from current authority: broader fixture coverage, explicit hook install/trust design, actual
LLM analyzer provider integration, and separate approved apply/mutation/evidence/equivalence/enforcement policy design.

This decision is a handoff summary only. It does not execute Codex, call an LLM, activate hooks, install hooks, mutate
trust/config, record new human decisions, approve proposals, apply graph deltas, mutate graph-source, accept Evidence,
satisfy runtime Evidence, prove equivalence, enforce scope, configure CI, configure required checks, change branch
protection, reject diffs, or replace user acceptance.

## DEC-282 Implement DevViewGraph HTML Inspector MVP

DEC-282 does not supersede DEC-097 through DEC-281. It implements `graph read-model render-devview-graph` as a
read-only HTML/data inspector for the CardPrinterConfig retrofit demo.

The boundary artifact is:

```text
examples/valid/todo-app-pbe-run/generated/devview-graph-html-boundary.runtime-evidence-only.preview.json
```

The original CardPrinterConfig-only demo artifacts are:

```text
outputs/devview-graph/cardprinterconfig.devviewgraph.html
outputs/devview-graph/cardprinterconfig.devviewgraph.data.json
```

The command consumes a `retrofit-graph-source-v0` graph source and a `retrofit-instruction-pack-v0` instruction pack,
then renders one full graph with highlighted selected subgraph, viewpoint trees, node/edge inspector details, subgraph
summary, pack mapping, and compilation trace. For the CardPrinterConfig demo, the selected subgraph includes
`change.laminator-tag-layout`, `ui.laminator-tag-param-columns`, and `boundary.laminator-layout-only`, while
`change.smart51-test-setting` remains visible only as reverted/context graph history.

Output authority guards reject attempts to overwrite the source graph-source, source instruction pack, source record
artifacts, linked generated/source-authority artifacts, or identical HTML/data output paths before any partial write.

This decision implements a visualization/report artifact only. It does not execute Codex, call an LLM/API, mutate
graph-source, apply graph deltas, approve work, record human decisions, satisfy runtime Evidence, prove equivalence,
enforce scope, configure CI, configure required checks, change branch protection, reject diffs, or replace user
acceptance.

## DEC-283 Expand DevViewGraph To WindowsUtility Portfolio View

DEC-283 does not supersede DEC-097 through DEC-282. It expands the DevViewGraph demo from a CardPrinterConfig-only
slice to a WindowsUtility portfolio graph with CardPrinterConfig as the selected detailed retrofit subgraph.

The portfolio graph and matching instruction pack are:

```text
examples/retrofit/windowsutility/graph-source.json
outputs/retrofit/instruction-packs/windowsutility-laminator-tag-layout.instruction-pack.json
```

The generated inspector artifacts are:

```text
outputs/devview-graph/windowsutility.devviewgraph.html
outputs/devview-graph/windowsutility.devviewgraph.data.json
```

The portfolio graph treats top-level `Utility_Windows/src` directories as observed inventory nodes. Only the
CardPrinterConfig detailed retrofit nodes, edges, and records are used as the selected instruction-pack context. The
HTML inspector now supports mouse drag, mouse-wheel zoom, compact zoom controls, and a clearer `Instruction Sources`
panel that groups allowed files, forbidden scope, and verification instead of exposing a raw pack mapping list.

This decision implements visualization/report improvements only. It does not mutate `Utility_Windows`, mutate
`WindowsUtility`, execute Codex, call an LLM/API, apply graph deltas, approve work, record human decisions, satisfy
runtime Evidence, prove equivalence, enforce scope, configure CI, configure required checks, change branch protection,
reject diffs, or replace user acceptance.

## DEC-284 Use Network Layout For DevViewGraph

DEC-284 does not supersede DEC-097 through DEC-283. It corrects the DevViewGraph presentation model so the inspector
looks like a graph, not a left-to-right tree or pipeline.

The DevViewGraph data model now records:

```text
graph.layoutMode: deterministic-network-orbit
```

The renderer places WindowsUtility legacy portfolio modules around the legacy product node, integration targets around
the WindowsUtility integration product node, and the selected CardPrinterConfig retrofit slice as a highlighted network
inside the same graph. Viewpoint trees remain clickable highlight sets over that graph; they are not rendered as
separate tree layouts. Edges are drawn as directional node-to-node curves based on actual node centers rather than
left-to-right column curves.

This decision changes visualization/layout only. It does not change graph source authority, selected subgraph semantics,
instruction pack authority, output authority guards, Codex execution, graph mutation, graph delta apply, approval,
runtime Evidence satisfaction, equivalence proof, scope enforcement, CI enforcement, required checks, branch
protection, diff rejection, or user acceptance.
