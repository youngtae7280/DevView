# DevView Benchmarks

DevView benchmark artifacts compare stored candidate results against golden answers without running Codex, Graphify,
native builds, retrofit tests, providers, shell commands, hooks, or graph updates.

The first benchmark surface is report-only:

```bash
devview benchmark evaluate-result \
  --benchmark-suite .tmp/benchmark-fixtures/suite.json \
  --task .tmp/benchmark-fixtures/task.json \
  --golden-answer .tmp/benchmark-fixtures/golden.json \
  --candidate-result .tmp/benchmark-fixtures/candidate.json \
  --output .tmp/benchmark-fixtures/evaluation.json \
  --markdown .tmp/benchmark-fixtures/evaluation.md \
  --json
```

Multiple stored evaluation reports can then be grouped into a report-only comparison matrix:

```bash
devview benchmark summarize-comparison \
  --evaluations .tmp/benchmark-fixtures/native-devview.json,.tmp/benchmark-fixtures/native-codex-only.json \
  --output .tmp/benchmark-fixtures/comparison-summary.json \
  --markdown .tmp/benchmark-fixtures/comparison-summary.md \
  --json
```

The exact benchmark source set can be locked into a tamper-evident report-only manifest before any benchmark claim is
treated as governed:

```bash
devview benchmark lock-suite \
  --benchmark-suite .tmp/benchmark-fixtures/suite.json \
  --tasks .tmp/benchmark-fixtures/task.json \
  --golden-answers .tmp/benchmark-fixtures/golden.json \
  --candidate-results .tmp/benchmark-fixtures/candidate-a.json,.tmp/benchmark-fixtures/candidate-b.json \
  --evaluations .tmp/benchmark-fixtures/evaluation-a.json,.tmp/benchmark-fixtures/evaluation-b.json \
  --comparison-summary .tmp/benchmark-fixtures/comparison-summary.json \
  --graphify-import-validations .tmp/benchmark-fixtures/graphify-import-validation.json \
  --output .tmp/benchmark-fixtures/suite-lock.json \
  --markdown .tmp/benchmark-fixtures/suite-lock.md \
  --json
```

The lock manifest records exact file-byte SHA-256 digests, evaluator and rubric versions, source identities, and
governance gaps such as missing golden-answer review metadata or held-out policy. It does not invent approval or run
any benchmark arm.

Static Graphify exports can be validated as import/mapping fixtures before any future live integration:

```bash
devview benchmark validate-graphify-import \
  --graphify-export .tmp/benchmark-fixtures/graphify-export.fixture.json \
  --mapping .tmp/benchmark-fixtures/graphify-to-devview-mapping.json \
  --benchmark-task .tmp/benchmark-fixtures/task.json \
  --golden-answer .tmp/benchmark-fixtures/golden.json \
  --output .tmp/benchmark-fixtures/graphify-import-validation.json \
  --markdown .tmp/benchmark-fixtures/graphify-import-validation.md \
  --json
```

## Comparison Arms

Benchmark specs can model these arms:

- `codex-only`
- `codex-graphify`
- `codex-devview`
- `codex-graphify-devview`

In the report-only foundation, these labels identify stored candidate results. DevView does not execute any arm.

## Golden-Answer Scoring

The default evaluator uses a 100-point rubric:

- task success
- scope accuracy
- context precision
- context recall
- regression risk
- evidence quality
- graph/update quality
- time/cost/iterations
- user interpretability and Work Journal usefulness

Golden answers may override weights, but scoring still uses explicit stored fields only. Unsafe execution or authority
flags block the evaluator before output is written.

## Comparison Summary

The aggregate comparison report groups scored evaluation reports by suite, task, project mode, and comparison group.
Each task row carries the four arm columns, missing-arm lists, pass/fail state, hard-failure counts, dimension scores,
and score deltas such as DevView versus Codex-only or Graphify versus Codex-only. The summary also carries compact
averages for Work Journal usefulness, Evidence quality, and scope accuracy.

Like the evaluator, the summary consumes stored JSON reports only. It does not perform live benchmark-task, Graphify,
native/retrofit build/test, extension-code, provider, hook, graph-update, or lifecycle-authority activity.

## Graphify Import Protocol

Graphify comparison arms start as static import fixtures, not live integrations. The import validation report checks a
stored Graphify-like export and a Graphify-to-DevView mapping for node/edge coverage, unmapped items, mapping conflicts,
and optional golden-answer context coverage. It produces source facts for future `codex-graphify` and
`codex-graphify-devview` candidate-result fixtures while keeping Graphify activity, provider activity, native benchmark
activity, graph updates, and lifecycle authority false.

The Native minimal benchmark includes stored `codex-graphify` and `codex-graphify-devview` candidate-result fixtures.
The combined arm references the static Graphify import validation report as a source fact, then relies on stored DevView
context, evidence, and graph/update summaries for scoring. It is still just JSON fixture data: no benchmark task,
Graphify integration, provider, native build/test, graph update, or lifecycle authority action is performed.

## Static Fixture Skeletons

The repository includes minimal Native and Retrofit benchmark skeletons under
`cli/src/__tests__/fixtures/benchmarks/`. They contain only suite, task, golden-answer, and stored candidate-result
JSON files for evaluator tests. They do not include buildable projects, live benchmark harnesses, live Graphify
outputs, native test activity, external service activity, command activity, graph updates, or extension code activity.

These fixtures are intentionally small CI-safe examples for proving that stored `codex-devview`, `codex-only`, and
`codex-graphify` candidate arms can be scored against golden answers. Public benchmark examples and executable harnesses
remain future work.

## Governance Boundary

Benchmark evaluation and comparison reports are useful evidence only after their source fixtures are locked. The suite
lock manifest is the first governance layer: it records the exact suite, task, golden-answer, candidate, evaluation,
comparison, and static Graphify import validation artifacts used for a claim. Enterprise readiness, signed record
envelopes, reviewer RBAC, held-out task governance, and live-run planning remain future work.
