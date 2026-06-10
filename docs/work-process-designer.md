# Work Process Designer

WPD converts confirmed requirements into implementable work designs and a module-aware WorkGraph.

## Inputs

```text
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/rpd-summary.md
.pbe/blueprint/ui-ux-confirmation.md
```

## Outputs

```text
.pbe/blueprint/work-design.json
.pbe/blueprint/work-graph.json
.pbe/blueprint/work-roadmap.md
```

## Boundary-Aware Method

```text
RPD Requirement Tree
-> WPD Module Boundary Check
-> WPD WorkGraph
-> WorkDesign entries
-> root implementation roadmap
```

WPD does not copy RPD nodes directly into Codex coding tasks. A single RPD node may split into several WorkGraph nodes. Several RPD nodes may merge into one shared foundation. A parent RPD node may become an integration task. UI/UX requirements may split into UI work, verification work, and evidence work.

## Module Boundary Check

Module Boundary Check is an internal WPD step, not a separate MVP skill.

It checks:

1. module ownership
2. overlapping responsibilities
3. shared data models, schemas, or types
4. shared validation, API contracts, or UI contracts
5. foundation work required before feature work
6. independent feature candidates
7. integration task candidates
8. likely same-file or shared-module conflicts
9. parallelization risks
10. blockers that require user input

It records:

- boundaryFindings
- sharedFoundations
- featureCandidates
- integrationPoints
- parallelizationRisks
- boundaryBlockers

If blockers remain, WPD should stop before creating a parallelization-ready WorkGraph.

## WorkGraph

WorkGraph represents coding responsibility and dependencies, not the user's requirement tree.

Node types:

- foundation
- feature
- ui
- api
- domain
- integration
- verification
- documentation
- review

Edge types:

- depends_on
- integrates_into
- validates
- documents
- blocks_parallelization

Each node includes related requirement IDs, expected outputs, risk level, expected files when known, and whether it can run in parallel.

## UI/UX Contract

UI-related work must include:

- Approved UI/UX Direction
- UI/UX Non-Scope
- UI/UX Implementation Notes

Unconfirmed UI/UX items block WPD unless they are deferred or out of scope.

## Next Step

After VD, run `pbe-plan-execution` to convert the WorkGraph into `staged_parallel` phases, parallel groups, integration tasks, and final validation strategy.
