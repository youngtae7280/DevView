# PR Informational Path-Filter Refinement

Status: pr-informational-path-filter-refinement / design-only / no-workflow-change / non-enforcing

## Purpose

This document records the decision surface for refining the non-enforcing PR informational read-model Evidence workflow
after the initial three-real-PR observation count was satisfied.

It answers two questions:

1. Should the current `pull_request.paths` filter be narrowed, expanded, split, or left unchanged?
2. Should PR informational failure semantics change after three successful observations?

This is a design-only document. It does not modify `.github/workflows/read-model-evidence.yml`, code, tests, generated
artifacts, source authority, CI enforcement, required checks, branch protection, public docs, or promotion state.

The broader promotion review input package in
[broader-graph-source-promotion-review-inputs.md](broader-graph-source-promotion-review-inputs.md) treats this
path-filter/failure-semantics design as one input to a future promotion review. It does not turn PR informational
Evidence into enforcement or source authority.

## Observation Summary

Reviewed PR informational runs:

| PR   | Run ID        | Workflow era                 | Result             | Notes                                                              |
| ---- | ------------- | ---------------------------- | ------------------ | ------------------------------------------------------------------ |
| `#1` | `28207822252` | explicit read-model steps    | `ci-evidence-pass` | First PR metadata and artifact review.                             |
| `#2` | `28210904900` | registry-backed validate-all | `ci-evidence-pass` | First PR review after workflow switched to local `validate --all`. |
| `#3` | `28213236499` | registry-backed validate-all | `ci-evidence-pass` | Third PR observation; run-count threshold is satisfied.            |

Across the three reviewed PR runs:

- event was `pull_request`
- trigger mode was `pull_request-informational`
- artifact bundle was present and reviewed
- Todo Search remained `validation-pass` / `comparison-pass`
- Todo App DevView Run remained `validation-pass` / parity `not-required`
- aggregate status remained `aggregate-pass`
- source-authority, non-enforcement, and non-promotion boundaries remained visible
- no blocker, missing artifact, malformed manifest, hidden retained warning, or confirmed path-filter noise was recorded

The threshold being satisfied means refinement is eligible for discussion. It does not automatically justify changing
the workflow.

## Current Path Filters

Current workflow trigger scope:

```text
.github/workflows/read-model-evidence.yml
cli/src/**
scripts/**
examples/internal-legacy/adoption/todo-search-slice/**
examples/valid/todo-app-devview-run/**
examples/internal-legacy/read-model-aggregate/**
docs/concept/**
```

Intended coverage:

| Path filter                                              | Intended signal                                                                 | Current observation                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `.github/workflows/read-model-evidence.yml`              | Workflow changes can directly break CI-backed Evidence.                         | Keep. Low noise and high drift risk if excluded.                                |
| `cli/src/**`                                             | Read-model generate/compare/validate/summarize and registry behavior live here. | Keep. High drift risk if excluded.                                              |
| `scripts/**`                                             | PBE validation support can affect Evidence trust.                               | Keep for now. Ownership is broader than read-model, but no noise is proven yet. |
| `examples/internal-legacy/adoption/todo-search-slice/**` | Todo Search is the pilot-marker-backed slice.                                   | Keep. Direct Evidence input/output surface.                                     |
| `examples/valid/todo-app-devview-run/**`                 | Todo App DevView Run is the structure-only second profile.                      | Keep. Direct Evidence input/output surface.                                     |
| `examples/internal-legacy/read-model-aggregate/**`       | Registry and aggregate artifacts live here.                                     | Keep. Direct validate-all and aggregate surface.                                |
| `docs/concept/**`                                        | Concept docs define Evidence boundaries and workflow policy.                    | Keep for now. Three smoke observations used this path intentionally.            |

## Refinement Options

### Option 1: Keep Current Broad Informational Filters

Keep the current path set unchanged until observation shows actual noise, repeated cost issues, or missed drift.

Benefits:

- preserves the reviewed behavior from PR #1, PR #2, and PR #3
- avoids a premature narrowing that could hide read-model policy drift
- keeps workflow, CLI, registry, slice, aggregate, and concept-boundary changes visible
- requires no workflow change or re-review run

Costs:

- concept-only edits may continue to trigger informational runs
- `scripts/**` may include files that are not read-model-specific

Recommendation:

```text
Recommended current mode.
```

### Option 2: Narrow `docs/concept/**`

Replace the broad concept-doc filter with a read-model-focused list such as:

```text
docs/concept/*read-model*.md
docs/concept/pr-informational-*.md
docs/concept/ci-*-read-model*.md
docs/concept/ci-validate-all-integration-design.md
docs/concept/decision-log.md
docs/concept/open-questions.md
docs/concept/resolved-questions.md
```

Benefits:

- reduces runs for concept documents unrelated to read-model Evidence
- keeps explicit read-model policy surfaces covered

Costs:

- path globs become harder to review
- concept docs sometimes cross-link source authority, rollback, promotion, and validation boundaries in files whose names
  do not include `read-model`
- a missed doc path could let important boundary drift avoid PR visibility

Recommendation:

```text
Do not implement yet. Reconsider only if concept-doc noise is observed in ordinary PR flow.
```

### Option 3: Narrow Or Keep `scripts/**`

Two choices remain plausible:

- keep `scripts/**` broad until script ownership is clearer
- replace it later with narrower PBE/read-model validation script paths after a script inventory

Benefits of keeping broad:

- avoids missing validation-support drift
- keeps simple path semantics

Costs of keeping broad:

- scripts unrelated to read-model Evidence can trigger PR informational runs

Recommendation:

```text
Keep broad for now; inventory script ownership before narrowing.
```

### Option 4: Add Package, Build, Schema, Or Template Paths

Possible future additions:

```text
package.json
package-lock.json
tsconfig*.json
schemas/**
templates/**
```

Benefits:

- can catch dependency, build, schema, or template drift that changes `validate --all` behavior

Costs:

- broader trigger surface may increase PR run frequency
- package/build/schema ownership may exceed read-model Evidence scope
- adding these paths should be paired with observation of a missed-drift case or explicit risk analysis

Recommendation:

```text
Do not add now. Reconsider after a missed-drift observation or package/schema ownership review.
```

### Option 5: Split Positive Read-Model And Future Invalid-Fixture Jobs

Keep the current positive registry-backed workflow as-is, and design a separate optional invalid-fixture job later if
invalid fixture CI becomes useful.

Benefits:

- keeps positive aggregate semantics stable
- avoids mixing intentionally invalid inputs into `aggregate-pass`
- preserves the local-only invalid fixture policy

Costs:

- future invalid-fixture CI would need separate artifact vocabulary and failure semantics

Recommendation:

```text
Keep invalid fixtures out of current PR informational workflow.
```

## Failure Semantics Options

### Option 1: Keep Command, Runtime, And Artifact Integrity Failures As Job Failures

The workflow should continue to fail the job when:

- install/build fails
- `validate --all` throws or exits non-zero unexpectedly
- focused tests fail
- runtime fixture tests fail
- PBE validation fails
- required artifacts or manifests are missing or malformed

Recommendation:

```text
Keep this behavior.
```

The workflow is not a required check, so a red PR status is still not merge enforcement. It is a visible technical
signal that must be interpreted by reviewers.

### Option 2: Keep Aggregate Warning And Decision-Required Visible But Non-Enforcing

If future aggregate output is `aggregate-warning` or `decision-required`, the PR summary and manifest should make the
status visible. Whether the job exits non-zero should remain a separate implementation decision.

Recommendation:

```text
Keep warnings and decision-required states visible in artifacts and Step Summary. Do not treat them as source promotion
or user approval.
```

### Option 3: Define Aggregate-Blocked PR Informational Behavior Before It Occurs

An `aggregate-blocked` result means at least one configured positive slice is blocking. In PR informational mode there
are two candidate behaviors:

| Candidate behavior                | Pros                                                   | Cons                                                            |
| --------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| Job fails on `aggregate-blocked`  | Makes positive Evidence breakage highly visible.       | Can be socially treated as merge enforcement even if optional.  |
| Job succeeds with blocked summary | Avoids red PR status while preserving non-enforcement. | Risks under-signaling a serious read-model Evidence regression. |

Recommendation:

```text
Keep current command behavior until an aggregate-blocked case is observed or deliberately tested in a non-merge context.
If revised later, preserve explicit wording that PR status is informational and not required-check enforcement.
```

### Option 4: Keep Invalid Fixture Expected-Blocking Separate From Positive CI

Invalid fixtures intentionally expect blockers. Their success condition is "the validator blocks the bad input," which
has different semantics from positive `validate --all`.

Recommendation:

```text
Do not mix invalid-fixture expected-blocking semantics into the current positive PR informational job.
```

## Recommendation

Recommended current decision:

```text
Keep current PR informational path filters and failure semantics unchanged.
```

Reasons:

- three PR runs were reviewed successfully
- no blocker, false positive, repeated noise, missing artifact, or hidden-boundary issue was recorded
- current filters are simple and already reviewed
- narrowing docs or scripts without observed noise could hide future policy drift
- invalid fixture CI remains a separate local-only policy surface
- enforcement, required checks, and source authority changes still require explicit user decisions

## Next Decision Candidates

Future work may choose one of these explicit branches:

| Candidate decision                        | When to consider                                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Continue observation                      | Default path while PR informational runs remain low-noise and successful.                           |
| Implement path-filter narrowing           | After real PR noise or cost shows that `docs/concept/**` or `scripts/**` is too broad.              |
| Add package/build/schema/template filters | After a missed-drift case or ownership review shows those paths can affect read-model Evidence.     |
| Refine failure semantics                  | After an aggregate warning, decision-required, aggregate-blocked, or repeated runtime failure case. |
| Design invalid-fixture CI mode            | Only after separate approval and a vocabulary for expected-blocking invalid fixture results.        |
| Design required-check/enforcement policy  | Only after explicit user approval; not implied by PR informational `ci-evidence-pass`.              |
| Keep local-only invalid fixtures          | Current recommendation until a separate CI invalid-fixture decision changes it.                     |

## Boundaries

This refinement design does not:

- modify `.github/workflows/read-model-evidence.yml`
- modify code, CLI commands, tests, or generated artifacts
- create a PR or dispatch GitHub Actions
- add invalid fixtures to CI or the positive registry
- add required checks, branch protection, merge blocking, or CI enforcement
- expand source authority
- promote Todo App DevView Run beyond `structure-only`
- clean up public docs
- approve full Graph-source promotion
- replace user acceptance
