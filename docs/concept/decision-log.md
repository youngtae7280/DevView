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

Potential older language in public docs should be read through the compatibility terms in [glossary.md](glossary.md). If
future review finds a public doc still presenting superseded terminology as active architecture, record it in
[open-questions.md](open-questions.md) or [superseded-items.md](superseded-items.md) before changing product meaning.
