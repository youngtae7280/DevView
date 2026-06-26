# Read-Model Negative Fixture Storage Decision

Status: read-model-negative-fixture-storage-decision / decision-surface / design-only /
no-fixture-implementation / non-enforcing

## Purpose

This document decides how future negative read-model fixtures should be stored before creating any durable invalid
fixtures.

The current baseline already has:

- candidate registry fixture: `examples/read-model-aggregate/read-model-slices.json`
- parser and normalization tests for the candidate registry
- local non-enforcing `pbe graph read-model validate --all`
- non-enforcing manual and PR validate-all CI reviews
- aggregate Evidence output over Todo Search and Todo App PBE Run

Negative fixture storage remains open because future robustness work needs invalid inputs without mutating the positive
slice fixtures, changing source authority, or turning invalid fixtures into CI enforcement policy.

## Current Context

Current positive fixtures:

| Profile                           | Slice                                 | Policy level          | Status                                             |
| --------------------------------- | ------------------------------------- | --------------------- | -------------------------------------------------- |
| `todo-search-selected-slice`      | `examples/adoption/todo-search-slice` | `pilot-marker-backed` | Generated, parity-backed, validated, CI-reviewed   |
| `todo-app-pbe-run-structure-only` | `examples/valid/todo-app-pbe-run`     | `structure-only`      | Generated, structure-validated, aggregate-included |

Current negative coverage mostly uses focused tests that create or mutate temporary registry data. That is appropriate
for parser-level shape checks, but it may not be enough for future end-to-end `validate --all` robustness, cross-slice
leakage, malformed aggregate input, or policy-level artifact requirement failures.

## Candidate Storage Options

### Option A: Test-Only Temp Fixtures

Tests build invalid registry/report/slice shapes in a temporary directory.

Benefits:

- avoids repo clutter
- avoids committing malformed example artifacts
- avoids generated artifact churn
- keeps each test isolated
- makes mutation boundaries easy to enforce

Costs:

- less reviewable than durable examples
- repeated setup code can drift from real layout
- harder for non-test readers to inspect invalid scenarios

Best fit:

- duplicate profile ID
- missing top-level boundary
- unknown policy level
- unsupported command
- malformed JSON or malformed aggregate input
- small report shape corruption

### Option B: `examples/invalid/read-model-registry-*`

Durable invalid examples under `examples/invalid` with focused registry or slice shapes.

Benefits:

- reviewable in the repo
- fits the existing examples taxonomy for invalid inputs
- useful for future parser/planner/validate-all behavior documentation
- can support end-to-end negative CLI tests without inventing each fixture inline

Costs:

- adds repo surface area
- may require upkeep when schemas or profile policies evolve
- can be mistaken for source-bearing examples unless clearly named and documented
- should not contain generated output churn unless specifically needed

Best fit:

- unsupported profile ID with a realistic registry file
- wrong policy-level requirements
- parity required but comparison report missing
- pilot marker required but marker missing
- structure-only profile accidentally requiring parity or pilot marker
- invalid `viewScopedTags` in a realistic report or generated read-model
- missing Core View coverage in a realistic generated read-model

### Option C: `examples/read-model-aggregate/invalid-fixtures/*`

Invalid fixtures near the aggregate registry.

Benefits:

- colocates invalid registry and aggregate inputs with aggregate read-model examples
- keeps negative read-model fixtures out of unrelated examples
- convenient for aggregate-specific malformed report fixtures

Costs:

- may blur positive aggregate Evidence with invalid test fixtures
- can make `examples/read-model-aggregate` feel partly source/config and partly test data
- less aligned with existing `examples/invalid` naming

Best fit:

- aggregate malformed input
- missing per-slice validation report for report-only summarize behavior
- aggregate summary status-rule fixtures

### Option D: Docs-Only Examples

Keep invalid shapes as snippets in concept docs.

Benefits:

- zero test runtime cost
- no fixture drift from committed invalid files
- good for policy explanation before implementation

Costs:

- not executable Evidence
- cannot protect behavior from regressions
- easy to diverge from implementation

Best fit:

- early design examples
- policy explanations before parser or validator implementation exists

### Option E: Inline JSON Objects In Tests

Tests define invalid JSON objects directly in TypeScript.

Benefits:

- fastest for unit-level normalization tests
- low file overhead
- clear when testing a single field

Costs:

- not representative of repository paths
- weaker for path normalization, source input existence, or artifact layout behavior
- can become hard to read if scenarios grow large

Best fit:

- duplicate profile ID
- unknown policy level
- missing boundary field
- unsupported command value

## Negative Coverage Categories

| Category                                            | Preferred storage first               | Durable fixture candidate? | Notes                                                                 |
| --------------------------------------------------- | ------------------------------------- | -------------------------- | --------------------------------------------------------------------- |
| Duplicate profile ID                                | inline JSON or temp registry          | no                         | Cheap parser-level shape failure.                                     |
| Missing top-level boundary                          | inline JSON or temp registry          | no                         | Keep close to parser tests.                                           |
| Unknown policy level                                | inline JSON or temp registry          | no                         | No need for full repo fixture yet.                                    |
| Unsupported command                                 | inline JSON or temp registry          | maybe later                | Durable only when command planner behavior broadens.                  |
| Registry / in-code profile drift                    | existing positive registry comparison | no                         | Positive fixture drift test already covers this.                      |
| Missing required artifact                           | temp workspace copy                   | yes later                  | Durable if validate-all report-only or execution modes need examples. |
| Hidden retained warning                             | temp report copy                      | yes later                  | Durable if warning policy becomes more visible in docs or CLI.        |
| Invalid `viewScopedTags`                            | temp generated-read-model copy        | yes                        | Durable invalid slice/report can be useful and reviewable.            |
| Missing Core View coverage                          | temp generated-read-model copy        | yes                        | Durable only after expected Core View policy is stable.               |
| Parity required but comparison report missing       | temp Todo Search-like copy            | yes                        | Good durable candidate for policy-level requirement checks.           |
| Pilot marker required but marker missing            | temp Todo Search-like copy            | yes                        | Good durable candidate for `pilot-marker-backed` policy.              |
| Structure-only accidentally requiring parity/marker | inline/temp registry                  | yes later                  | Durable after registry policy schema stabilizes.                      |
| Malformed aggregate input                           | inline/temp report                    | maybe under aggregate path | Keep near aggregate tests if it becomes end-to-end.                   |
| Cross-slice dependency leakage                      | temp workspace copy                   | yes later                  | Durable only if behavior cannot be covered clearly with temp copies.  |

## Recommendation

Use a three-tier storage policy:

1. Keep parser-shape failures inline or temp-only.
2. Use temp workspace copies for mutation, missing-artifact, and cross-slice leakage tests.
3. Introduce durable `examples/invalid/read-model-*` fixtures only for behavior-level scenarios that are stable,
   review-worthy, and hard to understand from inline objects.

Do not place negative fixtures under `generated/`. Invalid fixtures are test inputs or review examples, not generated
Evidence outputs.

Recommended first durable candidates, if implementation is later approved:

1. `examples/invalid/read-model-pilot-marker-missing`
2. `examples/invalid/read-model-invalid-view-scoped-tags`
3. `examples/invalid/read-model-core-view-missing`
4. `examples/invalid/read-model-structure-only-policy-conflict`

The first candidate narrowing plan is recorded in
[read-model-negative-fixture-candidate-plan.md](read-model-negative-fixture-candidate-plan.md). It recommends starting
with invalid `viewScopedTags` and missing Core View coverage, while keeping pilot-marker-missing and structure-only
policy conflict as later or inline/temp candidates.

Recommended cases to keep inline/temp:

- duplicate profile ID
- missing top-level boundary
- unknown policy level
- unsupported command until command planner semantics broaden
- malformed single-field aggregate summaries

## Tradeoffs

| Tradeoff                        | Guidance                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------- |
| Repo clutter vs reviewability   | Durable fixtures should prove meaningful policy behavior, not field typos.       |
| Fixture drift burden            | Durable fixtures need update discipline when registry/profile policy changes.    |
| `examples/invalid` semantic fit | Use for stable invalid examples; avoid for tiny parser-only objects.             |
| Generated artifact churn        | Do not commit generated negative outputs unless a fixture explicitly needs them. |
| Boundary clarity                | Every durable invalid fixture must state it is non-authority test input.         |
| CI cost                         | PR workflow should not run invalid fixtures until separately designed.           |

## Mutation Boundary

Negative tests must not mutate positive fixtures.

Required rules:

- copy positive fixtures to a temp workspace before corrupting them
- never rewrite `examples/adoption/todo-search-slice`
- never rewrite `examples/valid/todo-app-pbe-run`
- never rewrite `examples/read-model-aggregate/read-model-slices.json` during negative tests
- keep durable invalid fixtures outside `generated/`
- delete temp workspaces after tests

## Relationship To Validate-All And CI

Negative fixtures are local test Evidence, not CI enforcement policy.

The current non-enforcing CI workflow should keep running positive configured profiles only:

```text
node dist/cli/index.js graph read-model validate --all --json
```

Invalid fixture execution in PR or manual CI would require a separate design and user decision because it affects
runtime, noise, failure semantics, and whether PR checks show red for intentionally invalid data.

## Non-Scope

This decision surface does not:

- create negative fixture files or directories
- implement parser, planner, CLI, or test changes
- modify `.github/workflows/read-model-evidence.yml`
- dispatch GitHub Actions
- create a PR
- regenerate generated artifacts
- add required checks
- add branch protection
- introduce CI enforcement
- expand source authority
- perform public-doc cleanup
- promote Todo App PBE Run beyond `structure-only`
- approve full Graph-source promotion

## Decision Options After This Surface

Option A: `Create durable negative fixture candidates`

- Create a small first set under `examples/invalid/read-model-*`.
- Best after the exact first durable cases are selected.

Option B: `Keep negative coverage temp-only for now`

- Continue with inline/temp tests until a behavior-level fixture need appears.
- Lowest repo clutter.

Option C: `Design CI invalid-fixture execution`

- Future-only; requires separate failure-semantics design.
- Not recommended before more local negative coverage exists.

Option D: `Defer negative fixture work`

- Accept current parser/temp negative tests for now.

Recommended next action:

```text
Keep negative coverage temp-only for parser and planner cases, then implement durable examples only for stable
behavior-level validate-all failures.
```

## Gate Self-Check

| Gate                               | Result | Notes                                                                  |
| ---------------------------------- | ------ | ---------------------------------------------------------------------- |
| Design-Only Gate                   | PASS   | No fixture file, code, test, workflow, or generated artifact is added. |
| Negative Fixture Boundary Gate     | PASS   | Invalid fixtures are test inputs, not source or generated Evidence.    |
| Positive Fixture Preservation Gate | PASS   | Positive Todo Search and Todo App fixtures must not be mutated.        |
| Validate-All Boundary Gate         | PASS   | Current validate-all positive workflow remains unchanged.              |
| Non-CI-Enforcement Gate            | PASS   | Invalid fixture execution in CI remains future-only.                   |
| Source Authority Boundary Gate     | PASS   | Fixture storage does not alter source authority.                       |
| Non-Full-Promotion Gate            | PASS   | Full Graph-source promotion remains separate.                          |
| User Approval Boundary Gate        | PASS   | Negative fixture policy does not replace user acceptance.              |

## Final Statement

This document records the negative fixture storage decision surface only. It does not create invalid fixtures, implement
tests, change workflow behavior, introduce enforcement, expand source authority, or approve promotion.
