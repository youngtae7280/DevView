# Read-Model Invalid Fixture CI Policy

Status: read-model-invalid-fixture-ci-policy / design-only / no-workflow-change / non-enforcing

## Purpose

This decision surface defines whether invalid read-model fixtures should be included in CI. It exists because the
negative fixture set is now useful enough to consider CI visibility, but the current manual and PR read-model Evidence
workflow is intentionally positive-slice only.

Current recommendation:

```text
Keep invalid read-model fixtures local-only for now.
```

Do not add invalid fixtures to the current manual or PR CI workflow until a separate explicit decision defines runtime
cost, noise handling, artifact reporting, and failure semantics.

The PR informational path-filter and failure-semantics refinement surface is recorded in
[pr-informational-path-filter-refinement.md](pr-informational-path-filter-refinement.md). It keeps invalid-fixture
expected-blocking behavior separate from the current positive registry-backed PR workflow.

[broader-graph-source-promotion-review-inputs.md](broader-graph-source-promotion-review-inputs.md) records local
negative fixture coverage as a review input and a caveat. It does not make invalid fixtures CI-backed or promotion
blocking by itself.

## Current Baseline

Current positive CI / validate-all path:

- registry: `examples/internal-legacy/read-model-aggregate/read-model-slices.json`
- command: `devview graph read-model validate --all`
- included positive slices:
  - `examples/internal-legacy/adoption/todo-search-slice`
  - `examples/valid/todo-app-devview-run`
- expected aggregate status: `aggregate-pass`
- source mode: registry-backed positive read-model Evidence only
- latest PR observation: PR #3 / run `28213236499` confirmed the positive artifact bundle still excludes invalid
  fixtures

Current negative coverage:

| Case                           | Storage                                                | Current execution mode | CI included? |
| ------------------------------ | ------------------------------------------------------ | ---------------------- | ------------ |
| Invalid `viewScopedTags`       | `examples/invalid/read-model-invalid-view-scoped-tags` | local focused test     | no           |
| Missing Core View coverage     | `examples/invalid/read-model-core-view-missing`        | local focused test     | no           |
| Missing scoped pilot marker    | `examples/invalid/read-model-pilot-marker-missing`     | local focused test     | no           |
| Structure-only policy conflict | inline/temp registry normalization test                | local focused test     | no           |

These invalid fixtures are local negative validation inputs. They are not generated Evidence, source authority,
positive slice registry entries, aggregate-pass inputs, source promotion records, CI enforcement gates, or user
acceptance.

## Invalid Fixture Role

Invalid fixtures prove that validators and registry policy checks fail when they should. Their role is different from
positive read-model Evidence:

| Aspect           | Positive read-model Evidence                                  | Invalid fixture coverage                              |
| ---------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| Purpose          | Show configured slices can generate, validate, and aggregate. | Show bad read-model shapes are blocked.               |
| Registry         | Included in `read-model-slices.json`.                         | Not included in the positive registry.                |
| Aggregate status | Contributes to `aggregate-pass` / warning / blocked.          | Must not affect positive aggregate status by default. |
| Artifact role    | Generated/reviewed Evidence artifact.                         | Test input or absence scenario.                       |
| Authority        | Evidence only; no source promotion.                           | No source authority, no generated Evidence.           |
| CI meaning       | Non-enforcing visibility for configured slices.               | Future optional robustness signal only if approved.   |

## Options

### Option 1: Keep Invalid Fixtures Local-Only

Invalid fixtures remain in local focused tests and are not run by manual or PR CI.

Benefits:

- preserves the current CI meaning: positive registry-backed read-model Evidence only
- avoids making intentionally invalid inputs look like failed product Evidence
- avoids extra PR noise and runtime
- avoids changing `aggregate-pass` semantics
- keeps invalid fixtures out of the positive validate-all registry

Costs:

- CI does not directly prove negative fixture behavior on every PR
- regressions are caught when the focused test suite runs locally or in the existing CI focused-test step, not as a
  distinct invalid-fixture artifact class

Recommendation:

```text
Recommended current mode.
```

### Option 2: Optional Manual CI Invalid-Fixture Job Later

A future manually dispatched job could run invalid fixture checks as a separate robustness bundle.

Requirements before implementation:

- separate trigger or explicit workflow input
- separate artifact name, for example `pbe-read-model-invalid-fixture-evidence`
- manifest status labels that do not conflict with positive `ci-evidence-pass`
- clear expectation that failing invalid fixtures means "expected blocker observed" when behavior is correct
- no effect on positive aggregate status

Benefits:

- allows periodic CI confirmation without PR noise
- keeps invalid fixture semantics separate from positive Evidence

Costs:

- adds workflow complexity
- requires careful status vocabulary to avoid treating expected failures as CI failures

Recommendation:

```text
Candidate future mode after explicit approval.
```

### Option 3: PR Informational Invalid-Fixture Job Later

A future PR informational job could run invalid fixture checks when validator, registry, or invalid fixture files
change.

Requirements before implementation:

- path filters limited to validator/registry/invalid fixture surfaces
- job name clearly marked informational and non-enforcing
- job success semantics based on expected blocking results, not "all commands pass"
- Step Summary explaining that invalid fixtures are expected to produce validation-blocked reports
- no branch protection or required-check coupling

Benefits:

- catches negative-fixture regressions before merge
- visible when validator changes affect safety behavior

Costs:

- can add red/noisy PR signals if semantics are not carefully separated
- may confuse readers because invalid inputs should fail validation while the job should pass when the expected failure
  is observed

Recommendation:

```text
Future-only. Do not add until observation policy and reporting vocabulary are approved.
```

### Option 4: Required / Enforcing Invalid-Fixture Gate

Invalid fixtures become a required check or merge-blocking gate.

Requirements before implementation:

- explicit user approval
- branch protection decision
- stable failure vocabulary
- low-noise path filters
- documented rollback path
- clear separation from source authority and user acceptance

Benefits:

- strongest automated regression protection

Costs:

- changes merge policy
- can block unrelated PRs
- risks over-automating source-authority-adjacent behavior

Recommendation:

```text
Future-only. Not approved by this policy.
```

## Relation To Validate-All

Current `validate --all` remains positive-registry only:

```text
read-model-slices.json -> configured positive profiles -> aggregate summary
```

Invalid fixtures must not be added to `examples/internal-legacy/read-model-aggregate/read-model-slices.json` or to aggregate-pass
calculation unless a separate invalid-fixture mode is designed.

If a future invalid-fixture mode exists, it should use a separate command, option, or job identity rather than changing
the meaning of the current positive validate-all command. Candidate future surfaces might be:

- `devview graph read-model validate-invalid-fixtures`
- `devview graph read-model validate --invalid-fixtures`
- CI-only script wrapper around focused invalid fixture tests

Those names are examples only. No command is implemented or approved here.

## Future Artifact Expectations

If invalid fixtures are later included in CI, reports should be separate from positive read-model Evidence artifacts.

Candidate artifact fields:

- `evidenceLevel`: `ci-backed`
- `artifactRole`: `invalid-fixture-behavior-evidence`
- `triggerMode`: `workflow_dispatch-invalid-fixtures` or `pull_request-invalid-fixtures-informational`
- `includedInvalidFixtures`
- expected blocker id for each fixture
- observed status for each fixture
- `expectedBlockingObserved`: `true` / `false`
- positive registry unaffected: `true`
- source authority boundary
- non-enforcement statement
- non-promotion statement
- retained warning visibility

Candidate summary status labels:

- `invalid-fixture-check-pass`: every invalid fixture produced the expected blocking result
- `invalid-fixture-check-warning`: expected blocker observed but ancillary warning needs review
- `invalid-fixture-check-blocked`: an invalid fixture did not produce its expected blocker, or fixture setup failed
- `decision-required`: behavior changed in a way that needs user or maintainer judgment

These labels are intentionally separate from positive `ci-evidence-pass` and aggregate status labels.

## Failure Semantics

For future invalid-fixture CI modes:

- Expected validation blocking is a success condition for the invalid fixture check.
- Missing expected blocking is a failure of validator behavior.
- Runtime errors, malformed fixture setup, or missing fixture files should fail the invalid-fixture job.
- Positive `validate --all` aggregate status must remain independent.
- PR informational mode must remain non-enforcing unless a separate required-check decision is approved.
- CI pass must not become user acceptance or source promotion.

## Boundaries

This policy does not:

- modify `.github/workflows/read-model-evidence.yml`
- add invalid fixtures to `examples/internal-legacy/read-model-aggregate/read-model-slices.json`
- change `devview graph read-model validate --all`
- regenerate generated artifacts
- create a PR
- dispatch GitHub Actions
- add required checks, branch protection, or CI enforcement
- expand source authority
- approve full Graph-source promotion
- perform public-doc cleanup
- promote Todo App DevView Run beyond `structure-only`

## Recommendation

Keep the current implementation local-only:

```text
invalid fixtures -> local focused tests only
positive registry -> validate-all / manual CI / PR informational CI
```

Reopen CI inclusion only after one of these happens:

- repeated validator changes make local-only negative coverage insufficient
- focused test runtime remains stable after more invalid fixtures
- PR observation shows low noise and clear failure semantics
- user explicitly asks for invalid-fixture CI visibility
- a separate artifact vocabulary is approved
