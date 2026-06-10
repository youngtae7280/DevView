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
