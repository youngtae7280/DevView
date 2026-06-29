# PR Informational Observation Log

Status: pr-informational-observation-log / append-only-runbook-established / non-enforcing

This document is the append-only observation log and review runbook for non-enforcing PR informational read-model
Evidence runs.

It is not a source-authority record, CI enforcement policy, required-check policy, branch-protection rule, promotion
decision, or user acceptance record. It gives future reviewers a repeatable way to inspect PR-triggered read-model
Evidence without changing workflow behavior.

## Current Baseline

| Baseline item             | Current value                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| Manual dispatch baseline  | Run `28207696557`, `workflow_dispatch`, `success`, `ci-evidence-pass`                                    |
| First real PR run         | PR `#1`, run `28207822252`, `pull_request`, `pull_request-informational`, `success`, `ci-evidence-pass`  |
| Latest PR run             | PR `#11`, run `28346897073`, `pull_request`, `pull_request-informational`, `success`, `ci-evidence-pass` |
| Current workflow mode     | `workflow_dispatch` plus non-enforcing `pull_request-informational`                                      |
| Included slices           | `examples/adoption/todo-search-slice`; `examples/valid/todo-app-pbe-run`; aggregate summary              |
| Workflow command mode     | registry-backed `validate --all` after manual run `28210541509`                                          |
| Observation policy        | [pr-informational-observation-policy.md](pr-informational-observation-policy.md)                         |
| Refinement design         | [pr-informational-path-filter-refinement.md](pr-informational-path-filter-refinement.md)                 |
| Current real PR run count | 8 reviewed real PR informational runs                                                                    |
| Target before refinement  | Run-count threshold satisfied; refinement may be considered but is not automatic.                        |
| Enforcement / authority   | Not approved. PR Evidence is informational only and does not change source authority.                    |

Negative fixture policy is documented separately in
[read-model-negative-fixture-storage-decision.md](read-model-negative-fixture-storage-decision.md). Current PR
informational observations run positive configured profiles only.
Invalid fixture CI inclusion policy is documented in
[read-model-invalid-fixture-ci-policy.md](read-model-invalid-fixture-ci-policy.md); no invalid-fixture PR observation
entries are expected unless a separate future mode is approved.
The path-filter and failure-semantics refinement design is documented in
[pr-informational-path-filter-refinement.md](pr-informational-path-filter-refinement.md); it keeps the current workflow
unchanged after three successful PR observations.

## Baseline Entries

### Baseline Entry 1: Manual Dispatch Run

| Field                        | Value                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry type                   | Manual CI-backed Evidence baseline                                                                                                                 |
| Run ID                       | `28207696557`                                                                                                                                      |
| Run URL                      | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28207696557`                                                         |
| Event / trigger mode         | `workflow_dispatch` / `workflow_dispatch`                                                                                                          |
| Source branch / commit       | `main` / `0e5ceb90ed095ffdfda2cf34f3f9ed05f9d56bd3`                                                                                                |
| Artifact bundle              | Present and reviewed                                                                                                                               |
| Manifest status              | `ci-evidence-pass`                                                                                                                                 |
| Evidence level               | `ci-backed`                                                                                                                                        |
| Todo Search status           | `validation-pass`, `comparison-pass`, 40 nodes / 59 edges, 20 checks                                                                               |
| Todo App PBE Run status      | `validation-pass`, `not-required` parity, 22 nodes / 38 edges, 16 checks                                                                           |
| Aggregate status             | `aggregate-pass`, 2 included slices                                                                                                                |
| Warning / blocker / decision | 0 / 0 / 0 at aggregate status level                                                                                                                |
| Retained warning visibility  | Present                                                                                                                                            |
| Boundary visibility          | Source-authority boundary, non-enforcement statement, and non-promotion statement present                                                          |
| Failure / noise class        | None                                                                                                                                               |
| Interpretation               | Manual workflow mode remains valid after PR informational implementation; this does not count as a real PR observation for path-filter refinement. |

### Baseline Entry 2: First Real PR Informational Run

| Field                        | Value                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Entry type                   | First real PR informational smoke review                                                                                              |
| PR                           | `#1`; temporary smoke PR; closed without merge                                                                                        |
| Run ID                       | `28207822252`                                                                                                                         |
| Run URL                      | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28207822252`                                            |
| Job ID / URL                 | `83562348328`; `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28207822252/job/83562348328`             |
| Event / trigger mode         | `pull_request` / `pull_request-informational`                                                                                         |
| Head SHA / base SHA          | `3f3987c46f37639b1c1b7a56639a088a859ade5e` / `0e5ceb90ed095ffdfda2cf34f3f9ed05f9d56bd3`                                               |
| Head ref / base ref          | `pbe/pr-info-read-model-smoke-20260626` / `main`                                                                                      |
| Source ref / manifest commit | `refs/pull/1/merge` / `b2c664cfe658eaeb08c3bf28e8c8a22eec864fac`                                                                      |
| Changed path categories      | `docs/concept/**` smoke change                                                                                                        |
| Artifact bundle              | Present and reviewed                                                                                                                  |
| Manifest status              | `ci-evidence-pass`                                                                                                                    |
| Evidence level               | `ci-backed`                                                                                                                           |
| Todo Search status           | `validation-pass`, `comparison-pass`, 40 nodes / 59 edges, 20 checks                                                                  |
| Todo App PBE Run status      | `validation-pass`, `not-required` parity, 22 nodes / 38 edges, 16 checks                                                              |
| Aggregate status             | `aggregate-pass`, 2 included slices, 0 warnings / 0 blocking / 0 decision-required                                                    |
| Retained warning visibility  | Present; `retainedWarningsRemainVisible: true`                                                                                        |
| Boundary visibility          | Source-authority boundary, non-enforcement statement, and non-promotion statement present                                             |
| Failure / noise class        | No failure; docs-only trigger was intentional smoke signal rather than confirmed long-term filter evidence                            |
| Interpretation               | Continue observation. Do not refine filters, discuss enforcement, or broaden validation scope until more real PR signal is collected. |
| Cleanup                      | PR closed without merge; remote smoke branch deleted                                                                                  |

### Baseline Entry 3: Validate-All PR Informational Run

| Field                        | Value                                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry type                   | First validate-all-centered PR informational smoke review                                                                                    |
| PR                           | `#2`; draft temporary smoke PR; closed without merge                                                                                         |
| Run ID                       | `28210904900`                                                                                                                                |
| Run URL                      | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28210904900`                                                   |
| Job ID / URL                 | `83571819410`; `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28210904900/job/83571819410`                    |
| Event / trigger mode         | `pull_request` / `pull_request-informational`                                                                                                |
| Head SHA / base SHA          | `dadc1fd415a57342e7e1084c561868e242b39c54` / `ffad659d620e034bce0a24c18c6b41298e376451`                                                      |
| Head ref / base ref          | `pbe/pr-info-validate-all-smoke-20260626` / `main`                                                                                           |
| Source ref / manifest commit | `refs/pull/2/merge` / `88affca60d9f5081c848c03e65a2801f90733968`                                                                             |
| Changed path categories      | `docs/concept/**` smoke change                                                                                                               |
| Artifact bundle              | Present and reviewed                                                                                                                         |
| Manifest status              | `ci-evidence-pass`                                                                                                                           |
| Evidence level               | `ci-backed`                                                                                                                                  |
| Source mode                  | `registry-backed validate-all`; `validateAllStatus: aggregate-pass`                                                                          |
| Todo Search status           | `validation-pass`, `comparison-pass`, 40 nodes / 59 edges, 20 checks                                                                         |
| Todo App PBE Run status      | `validation-pass`, `not-required` parity, 22 nodes / 38 edges, 16 checks                                                                     |
| Aggregate status             | `aggregate-pass`, 2 included slices, 0 warnings / 0 blocking / 0 decision-required                                                           |
| Retained warning visibility  | Present; `retainedWarningsRemainVisible: true`                                                                                               |
| Boundary visibility          | Source-authority boundary, non-enforcement statement, and non-promotion statement present                                                    |
| Failure / noise class        | No failure; docs-only trigger was intentional smoke signal for the validate-all workflow switch, not enough long-term filter evidence alone  |
| Interpretation               | Continue observation. One more real PR run or one week of normal PR flow is recommended before path-filter refinement or enforcement design. |
| Cleanup                      | PR closed without merge; remote smoke branch deleted                                                                                         |

### Baseline Entry 4: Third PR Informational Observation Run

| Field                        | Value                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Entry type                   | Third real PR informational observation and second validate-all-centered PR observation                                                                |
| PR                           | `#3`; draft temporary smoke PR; closed without merge                                                                                                   |
| Run ID                       | `28213236499`                                                                                                                                          |
| Run URL                      | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28213236499`                                                             |
| Job ID / URL                 | `83578792524`; `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28213236499/job/83578792524`                              |
| Event / trigger mode         | `pull_request` / `pull_request-informational`                                                                                                          |
| Head SHA / base SHA          | `b9f2048541b884fb6eb74234f7fecd844102abc8` / `e7722e0faaa4cbe90d9d24ae7ad1cc69c18d58dd`                                                                |
| Head ref / base ref          | `pbe/pr-info-observation-smoke-20260626-3` / `main`                                                                                                    |
| Source ref / manifest commit | `refs/pull/3/merge` / `a1ff90963040f43abec3ce3ef80efd1d25263199`                                                                                       |
| Changed path categories      | `docs/concept/**` smoke change                                                                                                                         |
| Artifact bundle              | Present and reviewed                                                                                                                                   |
| Manifest status              | `ci-evidence-pass`                                                                                                                                     |
| Evidence level               | `ci-backed`                                                                                                                                            |
| Source mode                  | `registry-backed validate-all`; `validateAllStatus: aggregate-pass`                                                                                    |
| Todo Search status           | `validation-pass`, `comparison-pass`, 40 nodes / 59 edges, 20 checks                                                                                   |
| Todo App PBE Run status      | `validation-pass`, `not-required` parity, 22 nodes / 38 edges, 16 checks                                                                               |
| Aggregate status             | `aggregate-pass`, 2 included slices, 0 warnings / 0 blocking / 0 decision-required                                                                     |
| Invalid fixture status       | Not included in artifact bundle, positive registry, validate-all aggregate path, or CI workflow                                                        |
| Retained warning visibility  | Present; `retainedWarningsRemainVisible: true`                                                                                                         |
| Boundary visibility          | Source-authority boundary, non-enforcement statement, and non-promotion statement present                                                              |
| Failure / noise class        | No failure; docs-only trigger is now the third observed PR informational run and can inform a later path-filter refinement decision surface            |
| Interpretation               | Run-count threshold is satisfied. Path-filter or failure-semantics refinement can now be considered, but enforcement/source-promotion remain separate. |
| Cleanup                      | Downloaded `.tmp` artifacts removed; PR closed without merge; remote smoke branch deleted                                                              |

### Baseline Entry 5: Projection-Status PR Informational Observation Run

| Field                        | Value                                                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry type                   | PR informational smoke review for CI-captured graph-source projection contract status                                                         |
| PR                           | `#4`; draft temporary smoke PR; closed without merge                                                                                          |
| Run ID                       | `28218854329`                                                                                                                                 |
| Run URL                      | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28218854329`                                                    |
| Job ID / URL                 | `83595495607`; `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28218854329/job/83595495607`                     |
| Event / trigger mode         | `pull_request` / `pull_request-informational`                                                                                                 |
| Head SHA / base SHA          | `38c8ef4b0a631b9a1e95fca55c171d3a58abc58a` / `417f5d06166d8e9c062dc46de479af19e586681e`                                                       |
| Head ref / base ref          | `pbe/pr-info-projection-status-smoke-20260626` / `main`                                                                                       |
| Source ref / manifest commit | `refs/pull/4/merge` / `531caed9978225310aff1f0f33c9529930e791bf`                                                                              |
| Changed path categories      | `docs/concept/**` smoke change                                                                                                                |
| Artifact bundle              | Present and reviewed                                                                                                                          |
| Manifest status              | `ci-evidence-pass`                                                                                                                            |
| Evidence level               | `ci-backed`                                                                                                                                   |
| Source mode                  | `registry-backed validate-all`; `validateAllStatus: aggregate-pass`                                                                           |
| Projection contract status   | Todo Search `projection-contract-pass`; Todo App PBE Run `not-configured`; top-level `projectionContractStatus` present                       |
| Projection artifacts         | `read-model-validate-all-output.json` and `graph-source-read-model-projection.json` present in artifact bundle                                |
| Todo Search status           | `validation-pass`, `comparison-pass`, 40 nodes / 59 edges, 20 checks                                                                          |
| Todo App PBE Run status      | `validation-pass`, `not-required` parity, 22 nodes / 38 edges, 16 checks                                                                      |
| Aggregate status             | `aggregate-pass`, 2 included slices, 0 warnings / 0 blocking / 0 decision-required                                                            |
| Boundary visibility          | Source-authority boundary, non-enforcement statement, and non-promotion statement present                                                     |
| Failure / noise class        | No failure; docs-only smoke verified PR projection-status capture after manual run `28218687289`                                              |
| Interpretation               | Projection-status capture is reviewed in both manual and PR informational modes. Enforcement/source-promotion remain separate future choices. |
| Cleanup                      | Downloaded `.tmp` artifacts removed; PR closed without merge; remote smoke branch deleted                                                     |

### Baseline Entry 6: Graph-Source-Backed Generation PR Observation Run

| Field                        | Value                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry type                   | PR informational smoke review for graph-source-backed Todo Search generation                                                                          |
| PR                           | `#5`; draft temporary smoke PR; closed without merge                                                                                                  |
| Run ID                       | `28219583619`                                                                                                                                         |
| Run URL                      | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28219583619`                                                            |
| Job ID / URL                 | `83597708416`; `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28219583619/job/83597708416`                             |
| Event / trigger mode         | `pull_request` / `pull_request-informational`                                                                                                         |
| Head SHA / base SHA          | `47ed16a208bde2881145c53e1758a00a73483078` / `673edf81ddad20d2cfbd5cadb54597f0a2ebf447`                                                               |
| Head ref / base ref          | `pbe/pr-info-graph-source-generation-smoke-20260626` / `main`                                                                                         |
| Source ref / manifest commit | `refs/pull/5/merge` / `bae41d3feae1254f4b009dc97e1e0367c69441a0`                                                                                      |
| Changed path categories      | `docs/concept/**` smoke change                                                                                                                        |
| Artifact bundle              | Present and reviewed                                                                                                                                  |
| Manifest status              | `ci-evidence-pass`                                                                                                                                    |
| Evidence level               | `ci-backed`                                                                                                                                           |
| Source mode                  | `registry-backed validate-all`; `validateAllStatus: aggregate-pass`                                                                                   |
| Generated source mode        | Todo Search generated read-model metadata records `readModelSourceMode: graph-source-backed`                                                          |
| Graph source artifact        | Todo Search generated read-model metadata records `examples/adoption/todo-search-slice/graph-source.json`                                             |
| Projection contract status   | Todo Search `projection-contract-pass`; Todo App PBE Run `not-configured`                                                                             |
| Todo Search status           | `validation-pass`, `comparison-pass`, 40 nodes / 59 edges, 20 checks                                                                                  |
| Todo App PBE Run status      | `validation-pass`, `not-required` parity, 22 nodes / 38 edges, 16 checks                                                                              |
| Aggregate status             | `aggregate-pass`, 2 included slices, 0 warnings / 0 blocking / 0 decision-required                                                                    |
| Boundary visibility          | Source-authority boundary, non-enforcement statement, and non-promotion statement present                                                             |
| Failure / noise class        | No failure; docs-only smoke verified PR behavior after Todo Search generation became graph-source-backed                                              |
| Interpretation               | Graph-source-backed generation is reviewed in both manual and PR informational modes. Broader promotion/enforcement remain separate future decisions. |
| Cleanup                      | Downloaded `.tmp` artifacts removed; PR closed without merge; remote smoke branch deleted                                                             |

### Baseline Entry 7: Candidate-Observation PR Informational Run

| Field                            | Value                                                                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry type                       | PR informational smoke review for Todo App candidate-observation artifact capture                                                             |
| PR                               | `#6`; draft temporary smoke PR; closed without merge                                                                                          |
| Run ID                           | `28221326457`                                                                                                                                 |
| Run URL                          | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28221326457`                                                    |
| Job ID / URL                     | `83603072131`; `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28221326457/job/83603072131`                     |
| Event / trigger mode             | `pull_request` / `pull_request-informational`                                                                                                 |
| Head SHA / base SHA              | `8abd88e8ade3f6b78a382ff2909fc6a49b1d236b` / `891cc3633d9c5b4e033d3b4abdb1c5961e51ae0b`                                                       |
| Head ref / base ref              | `pbe/pr-info-candidate-observation-smoke-20260626` / `main`                                                                                   |
| Source ref / manifest commit     | `refs/pull/6/merge` / `fd8e00f11494351d809c300cf0f0316c7546463d`                                                                              |
| Changed path categories          | `docs/concept/**` smoke change                                                                                                                |
| Artifact bundle                  | Present and reviewed                                                                                                                          |
| Manifest status                  | `ci-evidence-pass`                                                                                                                            |
| Evidence level                   | `ci-backed`                                                                                                                                   |
| Source mode                      | `registry-backed validate-all`; `validateAllStatus: aggregate-pass`                                                                           |
| Candidate observation status     | `candidate-observation-pass`; Todo App candidate `candidate-projection-contract-pass`; candidate output artifact present                      |
| Candidate projection artifact    | `valid/todo-app-pbe-run/generated/graph-source-candidate-read-model-projection.json` present                                                  |
| Positive validate-all separation | Todo App positive projection remains `not-configured`; `aggregateStatus: aggregate-pass` remains separate from candidate observation          |
| Projection contract status       | Todo Search `projection-contract-pass`; Todo App PBE Run positive path `not-configured`                                                       |
| Todo Search status               | `validation-pass`, `comparison-pass`, 40 nodes / 59 edges, 20 checks                                                                          |
| Todo App PBE Run status          | `validation-pass`, `not-required` parity, 22 nodes / 38 edges, 16 checks                                                                      |
| Aggregate status                 | `aggregate-pass`, 2 included slices, 0 warnings / 0 blocking / 0 decision-required                                                            |
| Boundary visibility              | Source-authority boundary, non-enforcement statement, non-promotion statement, and candidate positive-validate-all boundary present           |
| Failure / noise class            | No failure; docs-only smoke verified PR candidate-observation capture after manual run `28221088498`                                          |
| Interpretation                   | Candidate observation is reviewed in both manual and PR informational modes without enrolling Todo App in positive validate-all or promotion. |
| Cleanup                          | Downloaded `.tmp` artifacts removed; PR closed without merge; remote smoke branch deleted                                                     |

### Baseline Entry 8: Confirmed Todo App Graph-Source PR Informational Run

| Field                   | Value                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry type              | PR informational smoke review for confirmed Todo App graph-source-backed metadata                                                                   |
| PR                      | `#10`; draft temporary smoke PR; closed without merge                                                                                               |
| Run ID                  | `28226357099`                                                                                                                                       |
| Run URL                 | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28226357099`                                                          |
| Event / trigger mode    | `pull_request` / `pull_request-informational`                                                                                                       |
| Head SHA / base SHA     | `cffe52fb9944a093d79096a70f804e69eee42b46` / `8a8ef76b63272d2303978dae51b1d0709fb632c4`                                                             |
| Head ref / base ref     | `pbe/pr-info-confirmed-todo-app-smoke-20260626` / `main`                                                                                            |
| Artifact bundle         | Present and reviewed; Todo App `graph-source-read-model-projection.json` uploaded                                                                   |
| Manifest status         | `ci-evidence-pass`; PR metadata present                                                                                                             |
| Todo Search status      | graph-source-backed; `projection-contract-pass`; 40 nodes / 59 edges / 7 Core Views; validation/parity pass                                         |
| Todo App PBE Run status | graph-source-backed; `projection-contract-pass`; `structure-only-confirmed`; `confirmed-structure-only-graph-source`; 22 nodes / 38 edges / 7 views |
| Validate-all / E2E      | `aggregate-pass`; `e2e-smoke-pass`                                                                                                                  |
| Boundary visibility     | Informational PR Evidence only; no enforcement, required check, tree retirement, or invalid fixture CI                                              |
| Failure / noise class   | No failure; docs-only smoke verified PR visibility after Todo App confirmed graph-source-backed rename                                              |
| Cleanup                 | Artifact temp directory removed; PR closed without merge; remote smoke branch deleted                                                               |

### Baseline Entry 9: edgeIntent Projection PR Informational Run

| Field                             | Value                                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Entry type                        | PR informational smoke review for edgeIntent projection observation artifact capture                                              |
| PR                                | `#11`; draft temporary smoke PR; closed without merge                                                                             |
| Run ID                            | `28346897073`                                                                                                                     |
| Run URL                           | `https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28346897073`                                        |
| Event / trigger mode              | `pull_request` / `pull_request-informational`                                                                                     |
| Head SHA / base SHA               | `78ecd973feee35e580c5c783aeaaccb8fc9e4343` / `bfb4714b76d304e23c5a23b140ddd63db0af9f21`                                           |
| Head ref / base ref               | `pbe/pr-info-edge-intent-smoke-20260629` / `main`                                                                                 |
| Artifact bundle                   | Present and reviewed; native/retrofit edgeIntent projection artifacts and command outputs uploaded                                |
| Manifest status                   | `ci-evidence-pass`; PR metadata present                                                                                           |
| edgeIntent projection observation | `edgeIntentProjectionObservationStatus: edge-intent-projection-pass`                                                              |
| Native / retrofit intent fixture  | Native `intent-projection-pass`; retrofit `intent-projection-pass`; 1 projected intent each                                       |
| Validate-all / E2E                | `aggregate-pass`; `e2e-smoke-pass`                                                                                                |
| Todo Search / Todo App projection | Todo Search `projection-contract-pass`; Todo App `projection-contract-pass`                                                       |
| Boundary visibility               | PR intent projection observation only; no broad validate-all intent enforcement, required check, or tree retirement               |
| Failure / noise class             | No failure; docs-only smoke verified PR visibility after edgeIntent projection observation was added to CI                        |
| Cleanup                           | Artifact temp directory removed; PR closed without merge; remote smoke branch deleted                                             |
| Recommended next interpretation   | Continue toward any next intent projection decision separately; do not treat this observation as broad intent schema enforcement. |

## Future Observation Entry Template

Append future PR informational observations below the baseline entries or in a later section using this template.
Do not rewrite old entries except to add a correction note with date and reason.

```text
### Observation Entry N: <PR # / short description>

PR:
Run ID:
Run URL:
Event / trigger mode:
Head SHA / base SHA:
Head ref / base ref:
Changed path categories:
Artifact bundle presence:
Manifest status / evidence level:
Todo Search validation / parity:
Todo App PBE Run structure-only validation:
Aggregate status:
Warnings / blocking / decision-required:
Retained warning visibility:
Boundary visibility:
Failure / noise classification:
Interpretation:
Recommended follow-up:
Temporary artifact cleanup:
```

## Review Checklist

Use this checklist for each new PR informational run.

1. Confirm run identity:

   ```bash
   gh run view <run-id> --json databaseId,status,conclusion,event,headBranch,headSha,url,jobs
   ```

2. Download artifacts to a temporary directory:

   ```bash
   gh run download <run-id> --name pbe-todo-search-read-model-evidence --dir .tmp/read-model-evidence-pr-run-<run-id>
   ```

3. Inspect the CI manifest and reports:

   - parse `adoption/todo-search-slice/generated/read-model-ci-evidence-manifest.json`
   - parse `adoption/todo-search-slice/generated/read-model-validation-report.json`
   - parse `adoption/todo-search-slice/generated/read-model-parity-report.json`
   - parse `valid/todo-app-pbe-run/generated/read-model-validation-report.json`
   - parse `read-model-aggregate/generated/read-model-aggregate-summary.json`

4. Confirm PR metadata exists for PR-triggered runs:

   - `eventName: pull_request`
   - `triggerMode: pull_request-informational`
   - PR number
   - head/base SHA
   - head/base ref

5. Confirm Evidence status:

   - Todo Search validation/parity status
   - Todo App PBE Run structure-only validation status
   - aggregate status and included slice count
   - warning/blocking/decision-required counts
   - retained warnings remain visible

6. Confirm boundary statements:

   - source authority boundary present
   - non-enforcement statement present
   - non-promotion statement present
   - no required-check, branch-protection, source-authority, or user-acceptance implication

7. Classify the run:

   - `continue-observation`
   - `refine-filter-candidate`
   - `fix-workflow-candidate`
   - `escalate-for-user-decision`
   - `true-blocker`

8. Remove downloaded temporary artifacts after review:

   ```bash
   Remove-Item -Recurse -Force .tmp/read-model-evidence-pr-run-<run-id>
   ```

## Changed Path Categories

Record changed paths by category instead of only listing filenames:

| Category              | Examples                                                                                   | Observation use                                                        |
| --------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Workflow              | `.github/workflows/read-model-evidence.yml`                                                | Must keep manual and PR informational boundaries visible.              |
| CLI / read-model core | `cli/src/**`, `scripts/**`                                                                 | High signal; should normally trigger read-model Evidence.              |
| Todo Search slice     | `examples/adoption/todo-search-slice/**`                                                   | High signal for parity-backed scoped pilot Evidence.                   |
| Todo App structure    | `examples/valid/todo-app-pbe-run/**`                                                       | High signal for structure-only profile Evidence.                       |
| Aggregate summary     | `examples/read-model-aggregate/**`                                                         | Useful for aggregate artifact drift; watch for artifact churn.         |
| Concept docs          | `docs/concept/**`                                                                          | Useful while policies are changing; may be noisy after policy settles. |
| Other docs / files    | Files outside current filters or outside the declared graph read-model Evidence boundaries | Use to decide whether filters are too broad or too narrow.             |

## Failure And Noise Classification

| Classification                | Meaning                                                                                        | Default interpretation                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `command-runtime-failure`     | Build, generate, compare, validate, summarize, or test command failed.                         | Workflow or source issue; fix before treating Evidence as pass.         |
| `artifact-integrity-failure`  | Expected artifact is missing, malformed, or internally inconsistent.                           | Blocking for that run; inspect workflow output and manifest generation. |
| `evidence-warning`            | Evidence status warns but commands and artifacts are valid.                                    | Keep visible; may not require workflow failure while non-enforcing.     |
| `decision-required`           | Evidence is valid but needs human judgment before the next authority/enforcement step.         | Record and escalate only after separate user decision.                  |
| `true-blocker`                | Boundary ambiguity, hidden warnings, invalid taxonomy, missing required PR metadata, or drift. | Immediate re-review; do not wait for the observation window.            |
| `noise-or-false-positive`     | Trigger is technically correct but not useful for graph read-model Evidence signal.            | Candidate for later path-filter refinement if repeated.                 |
| `continue-observation-signal` | Run is useful, boundaries are visible, and status remains pass or clearly explained.           | Count toward the observation target.                                    |

## Observation Counter

| Counter                                   | Current value                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Real PR informational runs reviewed       | 3                                                                                                        |
| Manual dispatch runs reviewed after PR CI | 1                                                                                                        |
| Target before filter refinement           | Run-count threshold satisfied; next step may design path-filter/failure-semantics refinement if desired. |
| Enforcement discussion state              | Closed until a separate user decision reopens it.                                                        |
| All-slice validation state                | Local and CI validate-all are implemented as non-enforcing Evidence only.                                |
| Registry test strategy state              | Implemented for registry parser/planner tests; invalid fixtures remain local-only.                       |

## Decision Thresholds

### Immediate Re-Review Triggers

Re-review before the observation window completes if any of these appear:

- missing PR metadata in the CI manifest
- source-authority, enforcement, required-check, or promotion boundary ambiguity
- hidden retained warnings
- aggregate status `aggregate-blocked` or `decision-required`
- Todo Search parity no longer `comparison-pass`
- Todo App PBE Run appears promoted beyond `structure-only` without a separate decision
- artifact bundle missing or malformed
- repeated command/runtime failure on ordinary PR changes

### Path-Filter Refinement Triggers

Consider path-filter refinement only after enough observation signal exists, or immediately after a clear false-positive
pattern:

- docs/concept-only PRs dominate the sample without useful Evidence drift
- aggregate artifact churn triggers repeated low-value runs
- CLI/script changes are missed by the current filters
- slice source or generated report changes happen outside the current filters
- workflow edits need explicit review signal

### Enforcement Discussion Boundary

Required checks, branch protection, CI enforcement, or `validate --all` workflow integration remains a separate user
decision.
Neither a green PR informational run nor this log can approve enforcement or source promotion.

All-slice validation implementation is governed by
[read-model-validate-all-contract.md](read-model-validate-all-contract.md) and remains separate from this observation
log.
The non-enforcing CI workflow switch to local `validate --all` is implemented and manually reviewed in
[ci-validate-all-integration-design.md](ci-validate-all-integration-design.md). PR #2 and PR #3 are now appended here as
validate-all-centered PR observations.
Registry fixture/test implementation is governed by
[read-model-slice-registry-test-strategy.md](read-model-slice-registry-test-strategy.md) and also remains separate from
this log.

## Gate Self-Check

| Gate                             | Result | Notes                                                                                  |
| -------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Append-Only Log Gate             | PASS   | Establishes a repeatable log/runbook for later observations.                           |
| Observation-Only Gate            | PASS   | Does not run Actions, create PRs, or change workflow behavior.                         |
| Non-Enforcement Gate             | PASS   | Required checks, branch protection, and CI enforcement remain out of scope.            |
| Source Authority Boundary Gate   | PASS   | PR Evidence remains Evidence only and does not expand source authority.                |
| Non-Full-Promotion Gate          | PASS   | Full Graph-source promotion remains separate and unapproved.                           |
| Path-Filter Refinement Gate      | PASS   | Defines how to record signal before later filter changes; does not change filters now. |
| Retained Warning Visibility Gate | PASS   | Hidden warnings trigger immediate re-review.                                           |
| Todo App Structure-Only Gate     | PASS   | Todo App PBE Run remains structure-only.                                               |
| User Approval Boundary Gate      | PASS   | PR pass and log entries cannot replace user acceptance or approve enforcement.         |
| Temporary Artifact Hygiene Gate  | PASS   | Downloaded CI artifacts are reviewed from `.tmp/` and then removed.                    |

## Final Statement

This log/runbook records and standardizes observation of future PR informational read-model Evidence runs. It does not
modify the workflow, dispatch GitHub Actions, create PRs, introduce enforcement, expand source authority, approve full
Graph-source promotion, perform public-doc cleanup, or promote Todo App PBE Run beyond `structure-only`.

<!-- temporary smoke note: E2E intentReport PR observation 2026-06-29T13:35:15+09:00 -->
