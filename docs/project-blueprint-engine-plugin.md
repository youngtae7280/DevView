# Project Blueprint Engine Plugin

Project Blueprint Engine is now a Codex Plugin.

It does not provide a GUI. It does not call OpenAI APIs directly from a separate app. It runs inside Codex as a set of skills and writes durable planning artifacts to `.pbe/` in the target repository.

## Components

- RPD: Recursive Program Designer using Tree Walk Mode
- WPD: Work Process Designer
- VD: Verification Designer
- ACEP Generator: Autonomous Codex Execution Pack generator with traceability, UI/UX, evidence, and coverage gates
- ACEP Runner: guided implementation from the generated pack
- Result Review: review pack preparation
- Feedback Collector: user feedback classification and mapping
- Revision Pack Generator: bounded revision contract
- Revision Runner: scoped revision execution

## Execution Contract

PBE generates an execution contract, not just task cards.

The contract requires:

- requirement-to-task traceability
- task-to-verification traceability
- verification-to-evidence traceability
- UI/UX screen and state coverage
- final coverage check before final report
- result review before user acceptance
- revision loop when user feedback rejects or changes the result

## Entry Points

```text
@project-blueprint-engine start
@project-blueprint-engine rpd
@project-blueprint-engine wpd
@project-blueprint-engine vd
@project-blueprint-engine generate acep
@project-blueprint-engine run acep
```

## Target Repo State

PBE writes:

```text
.pbe/blueprint/
.pbe/codex-execution-pack/
```

The `.pbe/` files are the interface between planning and execution.
