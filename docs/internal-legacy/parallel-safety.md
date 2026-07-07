# Parallel Safety Policy

## Purpose

This policy defines when PBE work, execution, and validation may run in parallel.

Default to sequential execution unless parallel safety is proven. Parallel work must be justified by independent files,
independent artifacts, independent shared resources, and independent state transitions.

## Default Rule

Use sequential execution by default.

Parallel execution is allowed only when the work is proven safe across source files, `.pbe` artifacts, generated
directories, state transitions, test environments, external resources, evidence, and review/acceptance order.

## What Counts As Parallel Work

Parallel work includes:

- two or more implementation tasks running at the same time
- two or more validation commands running at the same time
- a validation command running while another command rebuilds generated output
- multiple agents writing artifacts in the same active PBE run
- state transition commands started before the prior transition has completed

## Parallel Safety Dimensions

### 1. Source File Independence

Parallel work is risky when two tasks modify the same file.

Risky:

```text
WT-001 modifies docs/install.md
WT-002 modifies docs/install.md
```

Safer:

```text
WT-001 modifies docs/install.md
WT-002 modifies docs/troubleshooting.md
```

Different files are not enough by themselves. If different files change the same Product meaning, run Change/Impact
analysis and keep execution sequential until the impact is understood.

### 2. `.pbe` Artifact Independence

Multiple tasks writing the same `.pbe` artifact in parallel is blocked.

Blocked:

```text
two parallel tasks both update product-tree.json
two parallel tasks both update pbe-state
```

Product, Work, Test, Evidence, Acceptance, Change, Impact, and Product Patch artifact updates are sequential by default.
Codex should not run multiple artifact writers at the same time for the same active PBE run.

### 3. Generated / Shared Directory Independence

Shared generated directories are collision risks:

- `dist`
- `coverage`
- `tmp`
- `temp`
- `.cache`
- `clean-dist`

Example: `validate:pbe` and `test:examples` should not be started in parallel on Windows because both may touch
generated `dist` / `clean-dist` areas. Run verification commands sequentially.

### 4. `pbe-state` Transition Independence

State transition commands must not run in parallel.

Examples:

- `pbe rpd close`
- `pbe wpd close`
- `pbe vd close`
- `pbe execution start`
- `pbe review submit`
- `pbe accept`

Run state transition commands one at a time. Do not start two transition commands in the same active PBE run.

### 5. Test Environment Independence

Parallel tests are risky when they share:

- same database
- same HTTP port
- same snapshot output
- same hardware reader, printer, or device
- same temp directory
- same cache

Use sequential execution unless the environment is isolated per task.

### 6. External Resource Independence

Shared APIs, hardware, databases, filesystem locks, browser profiles, credentials, and cloud resources require manual
coordination or isolation before parallel execution.

### 7. Evidence Order Independence

If evidence from task A is valid only after task B completes, those tasks are not parallel-safe.

Evidence should be independently valid for each parallel task, or the dependent evidence should be captured in a later
sequential integration task.

### 8. Review / Acceptance Order Independence

If different Work items prove the same Acceptance Criteria or update the same Product node, review order may matter.
Prefer sequential review when the user decision is shared.

## Safe Parallel Work

Safety level: `safe`

Use this only when all are true:

- distinct `expectedFiles`
- no shared `.pbe` artifact writes
- no shared generated resource
- no state transition overlap
- independent test environment
- independent evidence
- independent review/acceptance

Example:

```text
WT-DOC-001 updates docs/install.md.
WT-DOC-002 updates docs/troubleshooting.md.
No shared generated output.
No state transition command.
Evidence is independent doc excerpt evidence.
```

## Risky Parallel Work

Safety level: `risky`

Treat parallel execution as risky when any are true:

- shared generated output
- adjacent files change the same Product behavior
- shared test environment
- same evidence target
- same Product node but different Work

Risky example:

```text
WT-TEST-001 changes scripts/test-examples.js.
WT-VALIDATE-001 changes scripts/validate-devview-files.js.
Both may interact with generated dist/clean-dist behavior.
Run sequentially unless isolation is explicit.
```

## Blocked Parallel Work

Safety level: `blocked`

Do not run in parallel when any are true:

- same file mutation
- same `.pbe` artifact mutation
- same `pbe-state` transition
- review, accept, or state commands run in parallel
- shared hardware or external resource without isolation

Blocked example:

```text
Task A runs pbe review submit.
Task B runs pbe accept.
Both mutate pbe-state / acceptance flow.
Do not run in parallel.
```

## Shared Resource Risks

Shared generated resources create nondeterministic failures. Windows filesystem locking can make this visible as an
`EPERM` error even when each command passes by itself.

Known example:

```text
npm.cmd run validate:pbe
npm.cmd run test:examples
```

Both commands build the CLI and may touch `dist` / `clean-dist`. Run them sequentially.

## PBE Artifact Risks

`.pbe` artifacts are durable workflow records. Parallel writes can lose traceability, overwrite evidence, or record an
invalid transition order.

Default policy:

- Product Tree writes are sequential.
- Work Tree writes are sequential.
- Test Tree writes are sequential.
- Evidence Tree writes are sequential unless isolated by explicit artifact merge rules.
- Acceptance Tree writes are sequential.
- Change/Impact/Product Patch writes are sequential.

## State Transition Risks

PBE state transition commands are single-writer operations. Run them one at a time and wait for the command result
before starting the next transition.

## Validation Command Risks

Validation commands may read broad repository state, rebuild generated output, or clean shared directories.

Policy:

- Run local verification commands sequentially.
- Do not start commands that rebuild or clean `dist` in parallel.
- On Windows, avoid parallel `validate:pbe` and `test:examples`.
- If a command fails only when run concurrently but passes sequentially, treat it as a local scheduling/resource sharing
  issue unless evidence shows a deterministic validator failure.

## Work Tree Guidance

A Work node claiming parallel safety should record:

- `expectedFiles`
- `expectedSharedFiles`
- `forbiddenFiles`
- `dependsOnWorkIds` or equivalent dependency edges
- shared resources
- generated outputs
- reason for the safety level

Parallel work is not safe just because files differ. Product behavior, evidence, and state transition independence must
also hold. If parallel safety is unclear, keep the work sequential.

## ACEP Execution Guidance

Codex should execute Work sequentially by default.

When parallel execution is requested or declared:

1. Complete a parallel safety checklist first.
2. Verify file, artifact, generated resource, state, environment, evidence, and review independence.
3. Run state transition commands sequentially.
4. Run validation commands sequentially unless shared generated resources are isolated.
5. On Windows, do not start `validate:pbe` and `test:examples` at the same time.

## Examples

Safe:

```text
WT-DOC-001 updates docs/install.md.
WT-DOC-002 updates docs/troubleshooting.md.
No shared generated output.
No state transition command.
Evidence is independent doc excerpt evidence.
```

Risky:

```text
WT-TEST-001 changes scripts/test-examples.js.
WT-VALIDATE-001 changes scripts/validate-devview-files.js.
Both may interact with generated dist/clean-dist behavior.
Run sequentially unless isolation is explicit.
```

Blocked:

```text
Task A runs pbe review submit.
Task B runs pbe accept.
Both mutate pbe-state / acceptance flow.
Do not run in parallel.
```

## Future Command / Validator Candidates

These are candidates only. Do not implement them until dogfooding shows repeated deterministic failures with low
false-positive risk.

- `pbe work parallel-check`
- `PARALLEL_SHARED_FILE_CONFLICT`
- `PARALLEL_PBE_ARTIFACT_CONFLICT`
- `PARALLEL_STATE_TRANSITION_CONFLICT`
- `PARALLEL_SHARED_RESOURCE_RISK`
- `PARALLEL_EVIDENCE_ORDER_DEPENDENCY`
