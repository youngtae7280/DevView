# Project Blueprint Engine

Project Blueprint Engine is a Codex Plugin.

It does not provide a GUI, SaaS backend, or separate OpenAI API provider. It runs inside Codex as a set of skills, stores planning artifacts in `.pbe/`, generates an Autonomous Codex Execution Pack, and guides Codex through that pack until a human gate or stop condition.

PBE is optimized for safe, reviewable, staged project construction, not for speed.

## What PBE Produces

PBE is not only a task-card generator. It creates an execution contract:

- RPD requirement tree
- Source of Truth Matrix
- PBE Invariants
- Foundation Contract
- WPD WorkGraph
- VD verification design
- UI/UX confirmation and UI/UX spec
- staged parallel execution strategy
- traceability matrix
- evidence requirements
- final coverage check
- result review and bounded revision flow

## Plugin Structure

```text
.codex-plugin/
  plugin.json
skills/
  pbe-autoflow/
  pbe-start/
  pbe-rpd/
  pbe-ui-ux-confirm/
  pbe-wpd/
  pbe-vd/
  pbe-plan-execution/
  pbe-coverage-audit/
  pbe-ux-audit/
  pbe-generate-acep/
  pbe-run-acep/
  pbe-review-result/
  pbe-collect-feedback/
  pbe-create-revision-pack/
  pbe-run-revision/
templates/
schemas/
docs/
scripts/
```

## Usage

In Codex, start with:

```text
@project-blueprint-engine start
```

After that, deterministic stages continue automatically. PBE stops at human judgment gates and accepts natural-language responses:

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

The old step-by-step commands remain supported for manual control.

## How PBE Runs

PBE is easiest to understand as a stateful Codex workflow:

1. Codex reads the target repository and the existing `.pbe/` folder.
2. PBE stores durable state in `.pbe/blueprint/pbe-state.json`.
3. Deterministic stages continue automatically.
4. Human gates stop the flow only when product judgment is required.
5. ACEP turns the approved plan into a Codex execution contract.
6. Codex implements only selected and approved foundation scope.
7. The user, not Codex, decides whether the result is accepted.

```mermaid
flowchart TD
    A["User<br/>start or resume PBE"] --> B["pbe-start<br/>inspect repo and initialize or resume .pbe"]
    B --> C["RPD<br/>requirement tree walk"]
    C --> D{"Enough requirement info?"}
    D -- "No" --> E["Ask exactly one requirement question"]
    E --> C
    D -- "Yes" --> F["RPD_DONE"]

    F --> G{"UI/UX work involved?"}
    G -- "Yes" --> H["Human Gate<br/>UI/UX confirmation"]
    G -- "No" --> J["WPD"]
    H -- "approve" --> J
    H -- "revise" --> C
    H -- "ask" --> H
    H -- "stop" --> STOP["STOPPED"]

    J["WPD<br/>module boundary check and WorkGraph"] --> K["VD<br/>verification design"]
    K --> L["Dependency Impact Audit<br/>future and deferred module impact"]
    L --> M["Human Gate<br/>implementation scope"]
    M -- "select scope" --> N{"Architecture runway risk?"}
    M -- "revise scope" --> L
    M -- "stop" --> STOP

    N -- "Yes" --> O["Human Gate<br/>architecture runway"]
    N -- "No" --> P["Plan Execution"]
    O -- "approve foundation" --> P
    O -- "change scope" --> L
    O -- "stop" --> STOP

    P["Plan Execution<br/>staged_parallel strategy"] --> Q["Coverage Audit"]
    Q --> R["UX Audit"]
    R --> S["Generate ACEP<br/>execution contract"]
    S --> T["Run ACEP<br/>implementation, validation, evidence"]
    T --> U["Human Gate<br/>review result"]

    U -- "approve result" --> V["Human Gate<br/>next slice decision"]
    U -- "revise" --> W["Collect feedback"]
    W --> X["Create Revision Pack"]
    X --> Y["Run Revision"]
    Y --> U

    V -- "complete current slice" --> Z["SLICE_ACCEPTED"]
    V -- "start next slice" --> M
    V -- "complete project" --> DONE["COMPLETED"]
```

## Human Gates

PBE stops only where the user has to make a product or delivery decision.

| Gate | Why PBE Stops | Typical User Replies |
| --- | --- | --- |
| UI/UX confirmation | UI behavior should not be implemented before the user confirms the flow, wording, states, and exceptions. | `approve`, `change the failure screen`, `what is risky?` |
| Implementation scope | The user must decide what is selected now, what is deferred, what is foundation, and what is out of scope. | `select the recommended scope`, `defer Ethernet`, `foundation first` |
| Architecture runway | Future or deferred modules may require foundation work now to avoid rework later. | `approve the foundation`, `interface only`, `skip this foundation` |
| Review result | Codex can submit work for review, but only the user can accept it. | `looks good`, `fix the failed case`, `is this safe to finish?` |
| Next slice decision | A reviewed slice is not the same as whole-project completion. | `complete current slice`, `start next slice`, `complete project` |

## Artifact Flow

PBE's product interface is the `.pbe/` folder. The files are the contract between user intent, Codex planning, implementation, verification, and review.

```mermaid
flowchart LR
    A["User intent<br/>project request"] --> B[".pbe/blueprint/project-brief.md"]
    B --> C["requirement-tree.json<br/>RPD"]
    C --> D["ui-ux-preview.md/json"]
    D --> E["ui-ux-confirmation.md"]

    C --> F["work-design.json<br/>WPD"]
    E --> F
    F --> G["work-graph.json<br/>module-aware work graph"]
    G --> H["verification-design.json<br/>VD"]
    H --> I["verification-plan.md"]

    G --> J["dependency-impact-audit.md/json"]
    J --> K["foundation-contract.md"]
    J --> L["parallel-safety-contract.md"]

    G --> M["execution-strategy.json/md"]
    H --> M
    K --> M
    L --> M

    M --> N["coverage-audit.md"]
    E --> O["ux-audit.md"]
    N --> P[".pbe/codex-execution-pack/"]
    O --> P

    P --> Q["execution-manifest.json"]
    P --> R["task cards"]
    P --> S["traceability matrix"]
    P --> T["UI/UX spec"]
    P --> U["final coverage check"]

    Q --> V["Codex implementation"]
    V --> W[".pbe/review/"]
    W --> X{"User decision"}
    X -- "revise" --> Y[".pbe/revisions/rev-*/"]
    Y --> V
    X -- "approve" --> Z["next slice or complete"]
```

## Module Logic

Each PBE module has one job. The workflow is safe because no module silently expands another module's responsibility.

| Module | Input | What It Does | Output | User Involvement |
| --- | --- | --- | --- | --- |
| `pbe-start` | User request, target repo, existing `.pbe/` | Detects whether PBE is new or continuing, initializes state, chooses an execution profile, and starts RPD unless bypassed. | `pbe-state.json`, project brief, initial blueprint files | Usually one `start` request |
| `RPD` | User answers, project brief, existing requirement tree | Walks one requirement node at a time, asks one open-ended question when needed, extracts facts, confirms or decomposes nodes. RPD owns user intent, not coding tasks. | `requirement-tree.json`, `rpd-interview-log.md`, `rpd-summary.md` | Answers requirement questions and confirms summaries |
| `UI/UX Confirm` | RPD UI facts, UI-related requirements | Creates a text wireframe, markdown mockup, or prototype-level preview before implementation. Blocks UI work until confirmed, deferred, out of scope, or not required. | `ui-ux-preview.*`, `ui-ux-confirmation.md` | Confirms, revises, or asks about UI/UX |
| `WPD` | Confirmed RPD, UI/UX confirmation, Source of Truth Matrix | Runs Module Boundary Check internally. Converts requirements into a module-aware WorkGraph instead of copying RPD nodes into coding tasks. Classifies selected, foundation, deferred, blocked, and out-of-scope work. | `work-design.json`, `work-graph.json`, `work-roadmap.md` | Only if a boundary blocker needs a decision |
| `VD` | WorkDesign, WorkGraph, requirement tree | Creates verification items for selected and foundation work. Records deferred and out-of-scope verification notes without treating them as current failures. | `verification-design.json`, `verification-plan.md` | Only if verification is impossible without a decision |
| `Dependency Impact Audit` | WorkGraph, deferred/future modules, foundation hints | Checks whether future or deferred modules affect today's architecture. Classifies future impact as optional deferred, required foundation, blocking dependency, or high-impact future module. | `dependency-impact-audit.*`, foundation recommendations | Leads into implementation scope gate |
| `Implementation Scope Gate` | Dependency audit, WorkGraph, VD | Lets the user choose what this slice will implement, what stays deferred, and what foundation is required. | Updated state and scope classification | Required |
| `Architecture Runway Gate` | Required foundation, blocking dependency, high-impact module risk | Asks whether to approve structural work before implementation. Prevents Codex from accidentally building the wrong architecture for future modules. | Approved foundation decision | Required only when risk exists |
| `Plan Execution` | WorkGraph, VD, traceability, foundation and parallel contracts | Builds the staged execution strategy. Foundation runs first, safe independent tasks may become parallel groups, and every parallel group gets an integration task. | `execution-strategy.md/json` | Automatic unless planning is unsafe |
| `Coverage Audit` | Requirements, WorkGraph, VD, traceability, execution strategy | Checks that selected and foundation scope have work, verification, evidence, and traceability. Deferred and out-of-scope items must be documented but are not failures. | `coverage-audit.md` | Automatic unless blocking gaps exist |
| `UX Audit` | UI/UX confirmation, WPD, VD, ACEP UI files when present | Checks that confirmed UI/UX direction is represented in work, verification, task cards, states, and evidence requirements. | `ux-audit.md` | Automatic unless UI/UX coverage is missing |
| `Generate ACEP` | Blueprint artifacts, audits, execution strategy | Creates the Codex execution contract: manifest, task cards, traceability, UI/UX spec, validation commands, evidence checklist, final coverage check, and report template. | `.pbe/codex-execution-pack/` | Automatic after audits pass |
| `Run ACEP` | ACEP manifest, task cards, traceability, UI/UX spec | Executes selected and foundation scope only. Runs validation, records evidence, respects parallel strategy, performs final coverage, and submits for review. | Code changes, evidence, final report, review pack | Stops only on stop conditions |
| `Review Result` | Final report, validation, coverage, UX evidence | Packages the result for the user. Codex reports `submitted_for_review`; it does not mark work as accepted. | `.pbe/review/` | User accepts, asks, revises, or stops |
| `Revision Flow` | User feedback at review gate | Maps feedback to affected requirement/task/UI/verification items, creates a bounded Revision Pack, runs only affected work, then returns to review. | `.pbe/revisions/rev-*/` and updated review evidence | User describes what is wrong |

## State And Natural Language

The Autoflow state machine lives in `.pbe/blueprint/pbe-state.json` under `autoflow`.

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> STARTED: start
    STARTED --> RPD_DONE: rpd
    RPD_DONE --> WAITING_UI_UX_CONFIRM: UI/UX gate
    WAITING_UI_UX_CONFIRM --> UI_UX_APPROVED: approve
    UI_UX_APPROVED --> WPD_DONE: wpd
    WPD_DONE --> VD_DONE: vd
    VD_DONE --> DEPENDENCY_IMPACT_AUDITED: dependency audit
    DEPENDENCY_IMPACT_AUDITED --> WAITING_IMPLEMENTATION_SCOPE: scope gate
    WAITING_IMPLEMENTATION_SCOPE --> SCOPE_SELECTED: select scope
    SCOPE_SELECTED --> WAITING_ARCHITECTURE_RUNWAY_CONFIRM: runway needed
    WAITING_ARCHITECTURE_RUNWAY_CONFIRM --> ARCHITECTURE_RUNWAY_APPROVED: approve
    SCOPE_SELECTED --> PLAN_EXECUTED: no runway needed
    ARCHITECTURE_RUNWAY_APPROVED --> PLAN_EXECUTED: plan
    PLAN_EXECUTED --> COVERAGE_AUDITED: coverage
    COVERAGE_AUDITED --> UX_AUDITED: ux audit
    UX_AUDITED --> ACEP_GENERATED: generate acep
    ACEP_GENERATED --> ACEP_RUN_DONE: run acep
    ACEP_RUN_DONE --> WAITING_REVIEW_RESULT: review gate
    WAITING_REVIEW_RESULT --> WAITING_NEXT_SLICE_DECISION: approve result
    WAITING_REVIEW_RESULT --> WAITING_REVIEW_RESULT: revise and rerun
    WAITING_NEXT_SLICE_DECISION --> SLICE_ACCEPTED: complete current slice
    WAITING_NEXT_SLICE_DECISION --> WAITING_IMPLEMENTATION_SCOPE: start next slice
    WAITING_NEXT_SLICE_DECISION --> COMPLETED: complete project
    STARTED --> BLOCKED: automatic failure
    PLAN_EXECUTED --> BLOCKED: audit or planning failure
    ACEP_GENERATED --> BLOCKED: execution failure
```

Natural language is mapped to internal actions:

| User Says | Internal Action |
| --- | --- |
| `approve`, `looks good`, `괜찮습니다`, `이대로 진행해주세요` | `approve` or `continue` |
| `select scope: ...`, `이번에는 ...만 구현` | `select_scope` |
| `full scope`, `전체 진행` | `select_full_scope` |
| `defer ...`, `보류해주세요` | `mark_deferred` |
| `foundation first`, `인터페이스만`, `기반만` | `mark_foundation` |
| `what is risky?`, `검토해주세요` | `ask` |
| `fix ...`, `add ...`, `수정해주세요` | `revise` |
| `current status`, `현재 상태 알려줘` | `status` |
| `stop`, `중단해주세요` | `stop` |

## Response Format

When PBE reports workflow state, it separates the official state card from free-form explanation:

```text
[PBE 상태 보고]
...

[Codex 메모]
...
```

`[PBE 상태 보고]` is the authoritative workflow status. It shows the current stage, completed work, artifacts, validation, why PBE stopped, what happens next, possible user replies, and one recommended reply.

`[Codex 메모]` is optional. It contains explanation, rationale, or risk notes.

Ordinary AI answers that are not reporting PBE workflow state should not use the status card.

## Execution Profiles

```text
bypass
lite
full
```

- `bypass`: typo, single-file edit, or clearly bounded small bug fix.
- `lite`: existing blueprint and small slice with limited risk.
- `full`: project construction, new feature, multi-module work, UI/UX, architecture runway, parallel work, or future-module impact. This is the default PBE profile.

## Autoflow

```text
start
-> rpd
-> ui ux confirm gate
-> wpd
-> vd
-> dependency impact audit
-> implementation scope gate
-> architecture runway gate, when needed
-> plan execution
-> coverage audit
-> ux audit
-> generate acep
-> run acep
-> review result gate
-> next slice decision
```

Human gates:

- UI/UX confirmation
- implementation scope
- architecture runway
- result review
- next slice decision

## State Model

Autoflow state is stored in `.pbe/blueprint/pbe-state.json` under `autoflow`.

`COMPLETED` means the whole project is complete. A single slice completion should use `SLICE_ACCEPTED` or `WAITING_NEXT_SLICE_DECISION`.

## Parallel Safety

WPD creates a WorkGraph. Plan Execution converts that WorkGraph into a staged strategy.

PBE does not use RPD nodes directly as parallel coding tasks.

Default policy:

```text
default = sequential
maxInitialParallelGroupSize = 2
maxMatureParallelGroupSize = 3
moreThanMaxRequiresHumanApproval = true
```

Parallel tasks require known expected files, low unknown file-touch risk, no forbidden shared changes, and an integration task. Every parallel group requires integration evidence and cannot complete without an integration pass.

## Acceptance

Codex may report:

```text
implemented
verified
submitted_for_review
revision_requested
revision_in_progress
revision_verified
```

Only the user can mark work as:

```text
accepted
```

If the user is dissatisfied, feedback is mapped to affected requirements, tasks, UI/UX items, and verification items before a bounded Revision Pack is created.

## Validation

Validate plugin structure and JSON files:

```bash
npm run validate:pbe
```

Validate the Codex plugin manifest and skills:

```bash
python C:/Users/ytkim/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py .
```

## Legacy GUI

The previous React/Vite GUI implementation is deprecated and preserved only as legacy material. Do not extend the GUI path unless the product direction changes again.

Legacy notes live in:

```text
docs/legacy-gui/
```
