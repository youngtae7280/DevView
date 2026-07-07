# Usage

Project Blueprint Engine is a Codex Plugin. It does not provide a GUI, does not run a separate browser app, and does not
call the OpenAI API directly from an app.

It runs inside Codex as a set of skills and writes planning artifacts into the target repository under `.pbe/`.

## Start

Start with:

```text
@project-blueprint-engine start
```

After `start`, PBE Autoflow continues deterministic steps automatically and stops only at human gates or failures.

## Manual Commands

Manual commands remain supported:

```text
@project-blueprint-engine status
@project-blueprint-engine continue
@project-blueprint-engine approve
@project-blueprint-engine revise "..."
@project-blueprint-engine stop
```

Natural language also works at gates:

```text
approve
looks good, continue
select scope: implement USB status only
defer Ethernet to the next slice
create the foundation interface first
fix only the failed case and rerun
current status please
stop
```

## PBE Status Card

When PBE finishes a step, reaches a gate, fails, or receives a status request, it answers with an official state card
first:

```text
[PBE 상태 보고]
```

The card includes:

- current state
- active gate
- next step
- completed work
- created or updated artifacts
- validation result
- why PBE stopped or whether it will continue automatically
- possible user replies
- recommended reply

If explanation is useful, it appears separately:

```text
[Codex 메모]
```

The status card is the workflow status. The Codex memo is explanation.

## Typical Flow

1. Start PBE in the target repo.
2. PBE runs RPD automatically, asking one requirement question at a time only when needed.
3. PBE stops at UI/UX confirmation and explains what to review.
4. After user approval, PBE automatically runs WPD, VD, and Dependency Impact Audit.
5. PBE stops at Implementation Scope gate so the user can choose selected/deferred/foundation scope.
6. If future modules affect current architecture, PBE stops at Architecture Runway gate.
7. After approval, PBE automatically runs Plan Execution, Coverage Audit, UX Audit, ACEP generation, and ACEP execution.
8. PBE stops at Result Review gate.
9. If the user approves the result, PBE moves to Next Slice Decision.
10. The user can complete the current slice, start another slice, or complete the whole project.

ACEP is a contract package. When `generate acep` runs, Codex creates traceability, UI/UX, evidence, final coverage,
execution strategy, and manifest files in addition to task-card views. Those views carry execution-contract obligations;
they do not replace the underlying trees or contracts.

## Example Start

```text
@project-blueprint-engine start
Project: inventory tracker with inbound and outbound stock updates.
```

For an existing repo:

```text
@project-blueprint-engine start
Add order cancellation to this project.
```

## Gates

At the UI/UX gate, review the preview and reply with approval, a revision request, or a question.

At the Implementation Scope gate, choose what is selected for this slice, what is deferred, what foundation is required,
and what is out of scope.

At the Architecture Runway gate, decide whether required foundation should be created before implementation.

At the final review gate, review execution results, failed tests, audit results, remaining risks, and retry items. Reply
with approval, a revision request, or a question.

At the Next Slice Decision gate, choose whether to complete the current slice, start the next slice, or complete the
whole project.

## What Codex Writes

PBE writes:

```text
.pbe/blueprint/
.pbe/codex-execution-pack/
.pbe/review/
.pbe/revisions/
```

Key blueprint files:

```text
.pbe/blueprint/source-of-truth-matrix.md
.pbe/blueprint/pbe-invariants.md
.pbe/blueprint/foundation-contract.md
.pbe/blueprint/parallel-safety-contract.md
.pbe/blueprint/work-graph.json
.pbe/blueprint/execution-strategy.json
```

Do not expect a React canvas, API key screen, or export UI. The files are the product interface.

## Completion Gate

`run acep` should not finish only because task-card views were attempted. It finishes after:

- selected scope is linked to task coverage
- required foundation is implemented and verified
- deferred and out-of-scope items are documented and protected
- every task has verification or an explanation
- every verification item has evidence or a not-runnable reason
- required UI screens and states have evidence
- every parallel group has an integration task
- every parallel group has integration evidence and pass status
- forbidden shared-risk changes did not run inside parallel groups
- final coverage check is complete
- result review pack is created
- delivery status is `submitted_for_review`

Only the user can mark the result `accepted`.
