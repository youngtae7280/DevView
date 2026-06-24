# Concept Decision Log

This log is the source of truth for confirmed concept decisions in the PBE runtime architecture alignment work.

## Active Decisions

| ID      | Status | Decision                                                                                                                                                                                                                                                                                                                                                                | Source                                                                            |
| ------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| DEC-001 | active | PBE is a Codex plugin workflow and tree-based development control system, not a GUI, SaaS backend, daemon, or separate OpenAI API provider.                                                                                                                                                                                                                             | `README.md`, `docs/core-concepts.md`                                              |
| DEC-002 | active | PBE is optimized for safe, reviewable, staged project construction rather than speed.                                                                                                                                                                                                                                                                                   | `README.md`, `AGENTS.md`                                                          |
| DEC-003 | active | The Product Tree is the source of product truth. Lower trees and execution artifacts derive from it.                                                                                                                                                                                                                                                                    | `README.md`, `docs/tree-model.md`                                                 |
| DEC-004 | active | Confirmed executable Product nodes require acceptance criteria or an explicit non-executable reason before downstream execution.                                                                                                                                                                                                                                        | `AGENTS.md`, `docs/core-concepts.md`                                              |
| DEC-005 | active | Project, Work, and Test Trees derive from Product Tree branches; Work Tree nodes are not direct copies of Product nodes.                                                                                                                                                                                                                                                | `docs/tree-model.md`, `docs/workflow.md`                                          |
| DEC-006 | active | Cycle Contracts and Node Execution Contracts are the boundary between planning and implementation.                                                                                                                                                                                                                                                                      | `docs/execution-contracts.md`                                                     |
| DEC-007 | active | Codex may submit work for review, but only the user may accept product results.                                                                                                                                                                                                                                                                                         | `docs/tree-model.md`, `docs/evidence-and-coverage.md`                             |
| DEC-008 | active | Feedback or drift that changes product meaning, scope, UX, risk, acceptance, or verification becomes a Change Node and flows through impact analysis.                                                                                                                                                                                                                   | `docs/change-impact-revision.md`, `docs/workflow.md`                              |
| DEC-009 | active | The deterministic CLI is a file-based gate and state transition layer. It must not become a GUI, MCP server, daemon, or API caller.                                                                                                                                                                                                                                     | `README.md`, `AGENTS.md`                                                          |
| DEC-010 | active | RPD, WPD, VD, ACEP, and Revision remain valid compatibility terms during the tree-native migration.                                                                                                                                                                                                                                                                     | `README.md`, `docs/tree-model.md`                                                 |
| DEC-011 | active | Existing "5 Layer" descriptions are legacy explanatory frames, not the active architecture baseline.                                                                                                                                                                                                                                                                    | `AGENTS.md`, `docs/concept/glossary.md`                                           |
| DEC-012 | active | Rollback mechanics, compatibility artifact generation, Graph-source promotion, and implementation details remain next-phase candidates. Concept policies through Rollback / Compatibility Strategy and representative demo slice selection are promoted; actual demo result recording is now covered by DEC-023.                                                        | Attached v2.1 work instruction; updated by Actual Runtime Feasibility Demo Result |
| DEC-013 | active | Long-term target is to promote Maintainability Graph to the source model, but during the current transition tree-native artifacts remain the operational source of truth.                                                                                                                                                                                               | Transition stance decision                                                        |
| DEC-014 | active | Approval Brief is the user-facing judgment surface for interpreted intent, result, verification, remaining judgment, and approval choice. It does not expose internal graph or execution contract details by default.                                                                                                                                                   | Approval Brief policy                                                             |
| DEC-015 | active | Approval Brief state labels are Ready for approval, Review with warning, Decision required, and Blocked; action labels are Approve this step, Request revision, Resolve required item, and Defer approval.                                                                                                                                                              | Approval Brief policy                                                             |
| DEC-016 | active | Check and Evidence are separate concepts: Check is the verification obligation, Evidence is observable proof, AI self-report is not Evidence, and Evidence exceptions must be visible rather than treated as proof.                                                                                                                                                     | Check/Evidence policy                                                             |
| DEC-017 | active | Control Nodes are control records for user judgment, change control, impact scope, acceptance closure, and block/reopen status. They do not replace Work, Evidence, Approval Brief, Acceptance Tree, or user approval.                                                                                                                                                  | Control Node policy                                                               |
| DEC-018 | active | Legacy Compatibility Map is a transition interpretation policy, not a migration script or runtime source promotion. Legacy terms/artifacts may remain compatibility views when mapped and not treated as authority.                                                                                                                                                     | Legacy Compatibility Map                                                          |
| DEC-019 | active | Runtime Feasibility Demonstration is a Graph-source promotion readiness gate, not source promotion. Representative feasibility requires observable Evidence and linked records, not AI self-report.                                                                                                                                                                     | Runtime Feasibility Demonstration                                                 |
| DEC-020 | active | Source Transition Path is a concept-level authority transition policy, not migration or implementation. Graph-source promotion cannot occur silently and requires explicit user approval.                                                                                                                                                                               | Source Transition Path                                                            |
| DEC-021 | active | Rollback / Compatibility Strategy is a concept-level safety policy required before Graph-source promotion can be considered. Rollback, fallback, and compatibility retirement require visible user judgment, and maintained compatibility views require explicit source-boundary, freshness, projection, and exception markings.                                        | Rollback / Compatibility Strategy work instruction and policy                     |
| DEC-022 | active | Representative Runtime Feasibility Demo slice selection is a readiness artifact before actual demo execution. The selected slice must cover happy path, stale/reopen, evidence exception, decision required, compatibility mismatch, and scope boundary scenarios with observable Evidence criteria; AI self-report is not Evidence.                                    | Representative Runtime Feasibility Demo                                           |
| DEC-023 | active | Actual Representative Runtime Feasibility Demo result records observed feasibility Evidence for the selected slice without promoting Maintainability Graph or changing source authority. Partial or blocked demo status must keep evidence gaps visible rather than treating AI summary as proof.                                                                       | Actual Runtime Feasibility Demo Result                                            |
| DEC-024 | active | Selected-slice evidence strengthening may add manual demo-support artifacts only when they include source references, derivation notes, limitations, and explicit non-promotion/source-authority boundaries. Such artifacts strengthen feasibility Evidence but do not become runtime source authority.                                                                 | Representative Demo Evidence Strengthening                                        |
| DEC-025 | active | Supplemental compatibility mismatch Evidence may strengthen the compatibility path when it uses real repository wording and maps it through Legacy Compatibility Map and Control Node policy. Observing such a mismatch does not require immediate public-doc cleanup, does not change source authority, and does not promote Maintainability Graph.                    | Compatibility Mismatch Supplemental Slice                                         |
| DEC-026 | active | User-confirmed PP-001 resolves the product-meaning decision for the representative Todo Search slice, but it does not by itself provide refreshed implementation/test Evidence or renewed Acceptance. Product Patch confirmation strengthens stale/reopen feasibility only when affected Work, Test, Evidence, Acceptance, and exceptions remain visible.               | PP-001 Confirmation Evidence                                                      |
| DEC-027 | active | Bounded runtime fixture tests can provide representative refreshed Evidence for the selected Todo Search slice when linked to Product, Work, Test, Evidence, command output, and explicit limitations. Passing fixture Evidence does not close renewed Acceptance, implement PBE runtime, change source authority, or promote Maintainability Graph.                    | Todo Search Runtime Evidence Fixture                                              |
| DEC-028 | active | User-renewed Acceptance for the representative Todo Search demo slice may close the demo-support acceptance branch with retained warnings, but it does not approve Graph-source promotion or change source authority. Retained warnings must be carried into Graph-source Promotion Readiness Review as explicit review items.                                          | Renewed Acceptance For Demo Slice                                                 |
| DEC-029 | active | Graph-source Promotion Readiness Review classifies prerequisites and retained warnings, but it does not promote Maintainability Graph or change source authority. A representative demo may be demonstrated with retained warnings while blockers, warnings, cleanup, and user promotion approval remain separately reviewable.                                         | Graph-source Promotion Readiness Review                                           |
| DEC-030 | active | A manual or generated Maintainability Graph read-model parity artifact can resolve the read-model output blocker for a limited pilot promotion decision only when it preserves source links, node/edge parity, warning status, and source-authority boundaries. Resolving that blocker for readiness does not promote Maintainability Graph or change source authority. | Maintainability Graph Read-Model Parity Artifact                                  |
| DEC-031 | active | Limited Pilot Promotion Decision Package is a user judgment surface for a scoped pilot decision. It may package Evidence, warnings, rollback/compatibility boundaries, and choices, but it does not execute promotion, approve full Graph-source promotion, change source authority, replace tree-native artifacts, or let Codex/PBE approve on the user's behalf.      | Limited Pilot Promotion Decision Package                                          |

## Supersede Relationships

| New Decision | Supersedes                                                                         | Reason                                                                                   |
| ------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| DEC-001      | Any description of PBE as a standalone app, SaaS, backend service, or API provider | The plugin workflow direction is explicit and stable.                                    |
| DEC-003      | Direct execution from unconfirmed user intent                                      | Product truth must be recorded before downstream work derives from it.                   |
| DEC-005      | Treating requirement nodes as direct coding tasks                                  | WPD must perform project and module derivation before executable work exists.            |
| DEC-006      | Task-card-only execution                                                           | Cycle and Node Execution Contracts are the canonical execution boundary.                 |
| DEC-011      | 5 Layer as active architecture                                                     | Current architecture is tree-native with skill, artifact, and CLI gate responsibilities. |

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

Potential older language in public docs should be read through the compatibility terms in [glossary.md](glossary.md). If
future review finds a public doc still presenting superseded terminology as active architecture, record it in
[open-questions.md](open-questions.md) or [superseded-items.md](superseded-items.md) before changing product meaning.
