# Read-Model Invalid Fixture Boundary Readiness

Status: read-model-invalid-fixture-boundary-readiness / docs-only / non-enforcing / no-workflow-change

## Purpose

This package records the current boundary between positive read-model Evidence and invalid / negative read-model
fixtures before external dogfooding.

The goal is to keep intentionally invalid fixtures useful as regression inputs without letting them leak into the
positive registry, `validate --all`, CI Evidence, source-authority claims, or required-check policy.

This package does not enroll invalid fixtures in CI, change validator behavior, change CLI behavior, change schemas,
change tests, modify GitHub Actions, or create a required check.

## Current Boundary

Current positive registry-backed read-model validation is scoped to:

- `examples/internal-legacy/read-model-aggregate/read-model-slices.json`
- `node dist/cli/index.js graph read-model validate --all --json`
- `.github/workflows/read-model-evidence.yml`

The positive registry currently contains the configured positive profiles only:

- `todo-search-selected-slice`
- `todo-app-devview-run-structure-only`

Current durable read-model invalid fixtures live outside the positive registry:

- `examples/invalid/read-model-invalid-view-scoped-tags`
- `examples/invalid/read-model-core-view-missing`
- `examples/invalid/read-model-pilot-marker-missing`

These fixtures are local focused negative test inputs. They are not generated Evidence, source authority, source
promotion records, CI enforcement, required checks, aggregate-pass inputs, or user acceptance.

## Negative Fixture Purpose

Invalid fixtures exist to prove that bad read-model shapes fail in expected ways.

| Fixture                    | Expected blocker             | Purpose                                                              |
| -------------------------- | ---------------------------- | -------------------------------------------------------------------- |
| Invalid `viewScopedTags`   | `view-scoped-tags-allowed`   | Proves invalid role tags block validation.                           |
| Missing Core View coverage | `core-view-coverage-present` | Proves required Core View coverage cannot silently disappear.        |
| Missing pilot marker       | `pilot-marker-exists`        | Proves `pilot-marker-backed` profiles require a scoped pilot marker. |

Structure-only policy conflict remains inline / temp focused coverage rather than a durable invalid fixture.

## Positive Registry Separation

Invalid fixtures must stay out of:

- `examples/internal-legacy/read-model-aggregate/read-model-slices.json`
- positive `graph read-model validate --all`
- positive aggregate summaries
- CI artifact bundles whose role is positive read-model Evidence
- source-authority promotion packages
- user / Product acceptance records

If a future negative suite is approved, it should have a separate command, job identity, artifact role, and status
vocabulary. It should not change what positive `validate --all` means.

## CI Boundary

The current read-model workflow is positive-slice Evidence only.

It runs positive registry-backed validation, candidate observation, E2E smoke, intent projection observation,
graph-source health reporting, focused tests, runtime fixture tests, and PBE validation. The workflow does not turn
invalid fixtures into CI enrollment, branch protection, merge blocking, or required checks.

Candidate B remains:

```text
node dist/cli/index.js graph read-model report-health --json
npm.cmd run test:read-model:e2e
```

Candidate B passing does not approve invalid fixture CI enrollment.

Registry / projection generalization also does not approve invalid fixture positive enrollment. Generalization may make
more positive profiles possible later, but invalid fixtures remain negative expected-failure inputs unless a separate
decision changes that.

## Failure Semantics For A Future Negative Suite

Before invalid fixtures are enrolled in any CI-visible mode, failure vocabulary must separate these cases:

| Case                             | Meaning                                                     | Desired handling                                                      |
| -------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------- |
| Expected failure observed        | The invalid fixture produced the intended blocker.          | Negative suite passes for that fixture.                               |
| Expected failure missing         | Validator behavior failed to block known-bad input.         | Negative suite blocks.                                                |
| False positive                   | A valid positive slice is incorrectly blocked.              | Fix validator or fixture policy before enforcement.                   |
| Infra failure                    | CI, install, build, filesystem, timeout, or runner failure. | Treat separately from validator semantics; rerun or investigate.      |
| Temporary GitHub Actions failure | Transient platform or dependency failure.                   | Do not reinterpret as read-model policy failure without confirmation. |
| Retained warning                 | A warning remains visible but is not the expected blocker.  | Keep visible; decide whether it is acceptable for the suite mode.     |

Expected validation blocking must be a success condition for invalid fixtures, not a red product Evidence signal. This
is why invalid fixtures should not be mixed into the positive aggregate path.

## Conditions Before CI Enrollment

Invalid fixture CI enrollment requires an explicit future decision package that answers:

1. Which invalid fixtures are deterministic enough for repeatable CI?
2. Is the mode manual-only, PR informational, or required?
3. What job name and artifact role make the expected-failure semantics clear?
4. Which paths trigger the job?
5. How are expected failures, false positives, infra failures, retained warnings, and temporary CI failures reported?
6. Does the job affect branch protection or merge blocking?
7. How are generated artifacts avoided or isolated?
8. How is the positive registry kept independent?
9. What rollback or waiver policy applies if the suite becomes noisy?
10. Who approves the enrollment?

Until those questions are resolved, invalid fixtures remain local focused tests and reviewable examples only.

## External Dogfooding Use

During external dogfooding, invalid fixtures may be used as:

- local regression examples for validator safety
- documentation examples for expected blocking behavior
- focused test inputs when read-model validator behavior changes
- reference cases for future negative suite design

They must not be used as:

- proof that a positive slice is complete
- proof of source authority
- Product acceptance
- positive aggregate Evidence
- required-check readiness by themselves

## Non-Actions In This Package

This package does not:

- add invalid fixtures to CI
- add invalid fixtures to `read-model-slices.json`
- change `graph read-model validate --all`
- change CLI, validator, schema, or test behavior
- modify `.github/workflows/read-model-evidence.yml`
- create a required check
- change branch protection
- expand source authority
- promote Todo App beyond `structure-only`
- retire tree-native artifacts
- replace user acceptance

## Next User Approval Branch

The next explicit user decision is:

```text
Should PBE formalize invalid read-model fixtures as a separate negative suite, or keep them local-focused while external
dogfooding continues?
```

If approved later, the next package should define negative suite command / CI identity, artifact vocabulary,
expected-failure semantics, waiver policy, and whether it is manual-only, PR informational, or required.

## Readiness Summary

- Positive registry separation: ready and currently preserved.
- Durable invalid fixture boundary markers: present.
- Focused local negative coverage: present.
- Positive CI workflow separation: preserved.
- Required-check enrollment: not approved.
- Invalid fixture CI enrollment: not approved.
- External dogfooding boundary: ready for review.
