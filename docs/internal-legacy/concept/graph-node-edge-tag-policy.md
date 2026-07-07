# Graph Node / Edge / Tag Policy

Status: concept policy

## Document Purpose

This document defines how Graph-first PBE separates durable graph meaning from task-scoped view roles.

It stabilizes three responsibilities:

```text
Node = durable target
Edge = durable semantic relationship
Tag = temporary role inside a View Instance
```

This policy is concept-level only. It does not define a TypeScript schema, validator, CLI command, graph builder,
runtime model, or migration script.

Current operational source is now scoped. This policy is source-authority-bearing inside the promoted Todo Search
selected-slice scope and remains the target/read-alignment taxonomy outside explicitly promoted scopes. It does not
declare repo-wide Graph-source promotion.

## Core Definitions

### Node

A Node is a durable target that can be referenced again across tasks, reviews, changes, evidence, and future graph
expansion.

A Node should exist when PBE needs to preserve identity for something maintainable:

- a user request
- a requirement or behavior
- a code unit or file/symbol anchor
- a data shape
- a check or evidence item
- a change, finding, decision, document, or log
- a task or view-instance candidate

A Node is not a temporary view role. If a thing must be linked, verified, approved, invalidated, or reopened later, it is
a Node candidate.

### Edge

An Edge is a durable semantic relationship between Nodes.

Edges carry maintainability meaning. They answer questions such as:

- Which code implements which behavior?
- Which check verifies which behavior?
- Which evidence evidences which check?
- Which finding reports on which code?
- Which decision approves, rejects, or resolves which change?
- Which view instance derives from which task and source nodes?

Semantic relationships must not be encoded as tags.

### Tag

A Tag is a view-scoped role inside a View Instance.

Tags are useful for task-local reading, filtering, and context assembly, but they are not durable graph meaning. A tag may
say that a node is a `target`, `context`, `guard`, `required`, `stale`, `blocked`, or `output` inside one view instance.
The same Node may receive different tags in another View Instance.

Tags must not replace Edges.

## Node Kind Candidates

These are concept candidates for a future Graph-first taxonomy. They are not schema enums yet.

| Node kind     | Meaning                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------- |
| request       | User request, maintenance prompt, review ask, or orchestration input.                           |
| requirement   | Product intent, acceptance criterion, user need, policy requirement, or product non-scope.      |
| behavior      | Intended, observed, inferred, or candidate behavior.                                            |
| code          | File, symbol, module, UI surface, command, script, or implementation anchor.                    |
| data          | Data shape, config, fixture, database entity, event payload, or state object.                   |
| check         | Verification obligation, acceptance check, regression check, visual check, or risk check.       |
| evidence      | Observable proof: test result, command output, screenshot, log, review note, or exception.      |
| change        | Product, scope, UX, risk, acceptance, verification, or compatibility change.                    |
| finding       | Risk, defect, unknown, mismatch, partial coverage, stale area, or audit result.                 |
| decision      | User, policy, approval, rejection, deferral, or risk-acceptance decision.                       |
| document      | Public doc, concept policy, contract, generated report, compatibility artifact, or manual pack. |
| log           | Execution log, trace excerpt, audit log, or evidence-bearing output stream.                     |
| task          | Maintenance task, implementation slice, review task, or graph update proposal scope candidate.  |
| view-instance | Durable record of one assembled task-scoped projection.                                         |

`task` and `view-instance` are graph record/node candidates. Whether they become first-class node kinds or separate
durable record kinds remains an open schema question.

## Edge Type Candidates

These are concept candidates for durable semantic relationships. They are not schema enums yet.

| Edge type    | Meaning                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| targets      | Request, task, or view targets a requirement, behavior, code, or scope. |
| implements   | Code implements behavior or requirement.                                |
| satisfies    | Work, behavior, or evidence satisfies a requirement or criterion.       |
| depends-on   | Node depends on another node for correctness, execution, or context.    |
| calls        | Code or behavior calls another code path or operation.                  |
| reads        | Code or behavior reads data, config, input, or state.                   |
| writes       | Code or behavior writes data, config, output, or state.                 |
| takes-input  | Behavior, code, check, or task consumes a specific input.               |
| returns      | Behavior, code, check, or task produces a result.                       |
| verifies     | Check verifies behavior, requirement, work, or risk boundary.           |
| evidences    | Evidence proves or supports a check.                                    |
| touches      | Task, work, change, or code touches a file, symbol, surface, or data.   |
| reports-on   | Finding reports on code, behavior, evidence, risk, or compatibility.    |
| requires     | Task, check, transition, or decision requires evidence or judgment.     |
| invalidates  | Change, finding, or drift invalidates node, edge, evidence, or view.    |
| preserves    | Transition, rollback, or parity artifact preserves a relationship.      |
| resolves     | Decision, change, evidence, or task resolves a finding or unknown.      |
| approves     | User decision approves acceptance, scope, risk, transition, or closure. |
| rejects      | User decision rejects proposal, assumption, risk, or transition.        |
| derives-view | View instance derives from task, source nodes, and traversal rules.     |

Examples:

```text
code implements behavior
check verifies behavior
evidence evidences check
finding reports-on code
decision approves acceptance
view-instance derives-view task
```

These are Edge meanings, not Tags.

## View-Scoped Tag Candidates

View-scoped tags should stay generic and reusable:

| Tag       | View-scoped meaning                                                                |
| --------- | ---------------------------------------------------------------------------------- |
| target    | Node is the main focus of this view instance.                                      |
| context   | Node is relevant supporting context.                                               |
| candidate | Node is a candidate for confirmation, expansion, impact, or future edge creation.  |
| guard     | Node limits scope, risk, safety, non-scope, or forbidden action.                   |
| required  | Node is required for the task or review represented by this view.                  |
| stale     | Node is stale in this view instance or for this task's judgment.                   |
| blocked   | Node blocks progress or approval within this view instance.                        |
| output    | Node is an expected output, result, or deliverable for this view instance or task. |

Do not create node-kind-specific tag explosions such as:

```text
code.target
test.required
evidence.output
behavior.context
```

Use generic tags plus durable Node kinds and Edges instead.

## Confidence And Freshness / Status Separation

Confidence and freshness/status must not be mixed.

Recommended confidence labels:

| Confidence     | Meaning                                                                       |
| -------------- | ----------------------------------------------------------------------------- |
| tool-confirmed | Supported by tool output, parser output, command result, or generated report. |
| user-confirmed | Confirmed by user decision, acceptance, or explicit human review note.        |
| inferred       | Inferred from code, docs, logs, or behavior with reasonable support.          |
| low-confidence | Plausible but weakly supported; should be visible and reviewable.             |

Recommended freshness/status labels:

| Freshness / status | Meaning                                                         |
| ------------------ | --------------------------------------------------------------- |
| fresh              | Still valid for the current task, change, or acceptance state.  |
| stale              | May no longer be valid after change, drift, or scope expansion. |
| invalidated        | Known to be no longer valid.                                    |
| unknown            | Freshness or validity cannot be judged with current Evidence.   |

`stale` is not a confidence value. A relation can be high-confidence and stale at the same time.

## AI Update Proposal / Gated Update Principle

Use conservative language around AI graph updates:

```text
AI creates Graph update proposals.
Structurally verifiable edges may be applied with tool or evidence support.
Product meaning, acceptance, risk decision, and source-authority edges require Evidence or user judgment before they are confirmed.
```

AI may propose:

- candidate Nodes
- candidate Edges
- confidence/freshness labels
- View Instance manifests
- finding/unknown records
- Evidence requirements

AI must not silently confirm:

- product meaning
- user acceptance
- risk acceptance
- source authority change
- compatibility retirement
- hidden Evidence freshness
- promotion approval

AI self-report is not Evidence.

## View Instance Manifest

A View Instance Manifest is a durable record candidate describing one task-scoped projection. It should record:

- task or request target
- selected view type
- source nodes and traversal rules
- included and excluded node kinds
- view-scoped tags
- confidence/freshness caveats
- required checks and evidence
- stop conditions
- source-authority boundary

The manifest may be represented as a `view-instance` node candidate or as a separate durable record in a later schema.
This policy does not decide that storage form.

## Source Authority Boundary

Current operational source:

```text
limited Graph-source promoted for Todo Search selected-slice; tree-native artifacts elsewhere
```

Target Graph-first architecture:

```text
Maintainability Graph as source model inside explicitly promoted scopes
```

This policy is authority-bearing only inside the promoted Todo Search selected-slice scope. It does not mark
tree-native artifacts as retired and does not promote Maintainability Graph repo-wide.

## Gate Self-Check

| Gate                         | Result | Notes                                                                                                |
| ---------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| Source Authority Safety      | PASS   | Source authority is limited to the promoted Todo Search scope; tree-native source remains elsewhere. |
| Node / Edge / Tag Separation | PASS   | Durable targets, durable semantic relations, and view-scoped roles are separated.                    |
| Tag Explosion Control        | PASS   | Generic view tags are preferred over node-kind-specific tag names.                                   |
| Confidence / Freshness Split | PASS   | Confidence labels and freshness/status labels are distinct.                                          |
| AI Update Safety             | PASS   | AI can propose graph updates; product/acceptance/risk/source authority require evidence/user.        |
| Implementation Boundary      | PASS   | No schema, CLI, runtime, validator, migration, or graph builder is defined.                          |
