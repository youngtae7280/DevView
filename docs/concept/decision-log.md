# Concept Decision Log

This log is the source of truth for confirmed concept decisions in the PBE runtime architecture alignment work.

## Active Decisions

| ID      | Status | Decision                                                                                                                                                                     | Source                                                |
| ------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| DEC-001 | active | PBE is a Codex plugin workflow and tree-based development control system, not a GUI, SaaS backend, daemon, or separate OpenAI API provider.                                  | `README.md`, `docs/core-concepts.md`                  |
| DEC-002 | active | PBE is optimized for safe, reviewable, staged project construction rather than speed.                                                                                        | `README.md`, `AGENTS.md`                              |
| DEC-003 | active | The Product Tree is the source of product truth. Lower trees and execution artifacts derive from it.                                                                         | `README.md`, `docs/tree-model.md`                     |
| DEC-004 | active | Confirmed executable Product nodes require acceptance criteria or an explicit non-executable reason before downstream execution.                                             | `AGENTS.md`, `docs/core-concepts.md`                  |
| DEC-005 | active | Project, Work, and Test Trees derive from Product Tree branches; Work Tree nodes are not direct copies of Product nodes.                                                     | `docs/tree-model.md`, `docs/workflow.md`              |
| DEC-006 | active | Cycle Contracts and Node Execution Contracts are the boundary between planning and implementation.                                                                           | `docs/execution-contracts.md`                         |
| DEC-007 | active | Codex may submit work for review, but only the user may accept product results.                                                                                              | `docs/tree-model.md`, `docs/evidence-and-coverage.md` |
| DEC-008 | active | Feedback or drift that changes product meaning, scope, UX, risk, acceptance, or verification becomes a Change Node and flows through impact analysis.                        | `docs/change-impact-revision.md`, `docs/workflow.md`  |
| DEC-009 | active | The deterministic CLI is a file-based gate and state transition layer. It must not become a GUI, MCP server, daemon, or API caller.                                          | `README.md`, `AGENTS.md`                              |
| DEC-010 | active | RPD, WPD, VD, ACEP, and Revision remain valid compatibility terms during the tree-native migration.                                                                          | `README.md`, `docs/tree-model.md`                     |
| DEC-011 | active | Existing "5 Layer" descriptions are legacy explanatory frames, not the active architecture baseline.                                                                         | `AGENTS.md`, `docs/concept/glossary.md`               |
| DEC-012 | active | Approval Brief, Check/Evidence policy, Control Node policy, Legacy Compatibility Map, and feasibility demonstration stay outline-only or next-phase candidates in this pass. | Attached v2.1 work instruction                        |
| DEC-013 | active | Long-term target is to promote Maintainability Graph to the source model, but during the current transition tree-native artifacts remain the operational source of truth.    | Transition stance decision                            |

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

Potential older language in public docs should be read through the compatibility terms in [glossary.md](glossary.md). If
future review finds a public doc still presenting superseded terminology as active architecture, record it in
[open-questions.md](open-questions.md) or [superseded-items.md](superseded-items.md) before changing product meaning.
