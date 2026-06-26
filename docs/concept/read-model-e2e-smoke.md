# Read-Model E2E Smoke

Status: local-smoke-implemented / ci-observation-integrated / non-enforcing / no-promotion-change

## Purpose

`npm run test:read-model:e2e` is a local dogfood smoke for the current mixed Graph-source transition. It copies the
read-model examples into a temporary workspace, runs the CLI against that workspace, and removes the temporary files after
the run so the repository's generated artifacts do not churn.

The non-enforcing `PBE Read-Model Evidence` workflow now also runs the smoke and writes
`examples/read-model-aggregate/generated/read-model-e2e-smoke-output.json` as an uploaded observation artifact.

The smoke checks:

- Todo Search graph-source-backed generation, 40 nodes / 59 edges / 7 Core Views
- Todo Search parity and validation pass
- Todo Search projection contract status `projection-contract-pass`
- Todo App PBE Run structure-only generation and validation, 22 nodes / 38 edges / 7 Core Views
- Todo App positive validate-all projection status `candidate-projection-contract-pass`
- registry-backed `graph read-model validate --all --json` status `aggregate-pass`
- candidate observation status `candidate-observation-pass` as separate report-only metadata

## Boundary

This local smoke is Evidence only. It does not add CI enforcement, required checks, repo-wide Graph-source promotion,
tree-native retirement, invalid fixture CI, or Todo App source-authority promotion.
