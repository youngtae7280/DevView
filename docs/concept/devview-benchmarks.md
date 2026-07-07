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
