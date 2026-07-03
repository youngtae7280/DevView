# Graph Operation-Chain Productization

Status: local-dogfood-productized / ci-observed / non-enforcing / no required check

This package turns the local PBE operation-chain experiments into versioned repo
artifacts.

Current shared loop:

```text
graph-source -> instruction pack -> local change -> graph delta -> graph update proposal -> graph-source apply preview/apply
```

## Added Surface

- Common schema notes under `schemas/pbe/`.
- Retrofit change-record schema under `schemas/retrofit/`.
- Native dogfood examples under `examples/native/`.
- Retrofit dogfood examples under `examples/retrofit/`.
- Local PowerShell entry point: `scripts/invoke-pbe-v0.ps1`.
- CLI operation-chain entry point: `pbe graph operation run-chain`.
- CLI graph instruction-pack generation entry point: `pbe graph operation generate-pack`.
- CLI graph delta capture entry point: `pbe graph operation capture-delta`.
- CLI graph update proposal generation entry point: `pbe graph operation propose-update`.
- CLI graph update proposal entry point: `pbe graph operation apply-proposal`.
- CLI retrofit planning entry point: `pbe graph retrofit plan`.
- Local graph operation flow smoke: `npm run test:graph-operation:flow`.
- Generated observation reports under `outputs/`.
- Non-enforcing CI observation through `.github/workflows/read-model-evidence.yml`.

## Local Commands

```powershell
npm run validate:pbe:operation-chain
```

```powershell
npm run validate:pbe:dogfood
```

```powershell
npm run test:graph-operation:flow
```

The operation-chain command recreates small ignored target repos under `work/`
and validates graph-source, instruction pack, graph delta, graph update
proposal, and dogfood evaluation surfaces.

The graph operation flow smoke creates an isolated temporary target git repo and runs the explicit CLI sequence:
`generate-pack`, `capture-delta`, `propose-update`, `apply-proposal` preview, and `apply-proposal --apply`. It proves the
CLI path works without touching external projects or committed graph-source fixtures.

The CLI wrapper exposes the same operation-chain script path through a stable command:

```powershell
node dist/cli/index.js graph operation run-chain --dry-run --json
```

`--dry-run` previews the wrapped command. Running without `--dry-run` delegates to the existing script and preserves its
output behavior.

The operation chain can also be driven as explicit CLI steps:

```powershell
node dist/cli/index.js graph operation generate-pack --graph-source <graph-source.json> --record <record-id> --json
node dist/cli/index.js graph operation capture-delta --graph-source <graph-source.json> --instruction-pack <pack.json> --target-repo <target-repo> --json
node dist/cli/index.js graph operation propose-update --graph-delta <delta.json> --json
```

These commands preserve the same boundaries as the script artifacts: instruction packs do not apply changes, graph deltas
only read git diff, and update proposals do not mutate graph-source until reviewed through `apply-proposal`.

Graph update proposals can now be previewed or applied through the CLI:

```powershell
node dist/cli/index.js graph operation apply-proposal --proposal <proposal.json> --json
```

Preview mode is the default. Applying requires explicit `--apply` and updates only graph-source node/record status fields
after stale-state and boundary checks pass.

Advisory DevView `check-scope` output is not a graph update proposal by itself. The Todo App runtime Evidence-only
calibration now records a proposal candidate schema alignment preview at
`examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-candidate-schema.runtime-evidence-only.preview.json`.
That preview maps advisory scope candidate categories to the existing `pbe-graph-update-proposal-v0` fields where
possible, and marks Evidence/report link mappings as unresolved. It does not run `propose-update`, create approved graph
updates, mutate graph-source, or apply graph deltas.

The follow-on mapping decision preview is
`examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-unresolved-mapping-decision.runtime-evidence-only.preview.json`.
It keeps `graphDeltaPath` unresolved until a graph-delta-compatible source exists and treats advisory JSON/markdown links
as candidate review context only.

The graph-delta-compatible source preview is
`examples/valid/todo-app-pbe-run/generated/graph-delta-compatible-source.runtime-evidence-only.preview.json`. It is a
proposal-only generator input shape that collects advisory runtime output, changed-file collection, scope
evaluation, proposal boundary, schema alignment, and mapping decisions. It is not graph-source, not `graph-delta-v0`,
not `pbe-graph-update-proposal-v0`, and not apply.

The proposal-only generator scope decision is
`examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-generator-scope-decision.runtime-evidence-only.preview.json`.
It selected the advisory command shape
`graph read-model propose-graph-delta --source <sourceArtifact> --output <proposalPath> --json` for the first slice.
That proposal-only CLI is now implemented. It emits `graph-delta-proposal-only-preview` JSON through stdout by default
or an explicit `--output` path, preserves unapproved/non-enforcing/human-review-required boundaries, and remains separate
from `graph operation apply-proposal`. It does not mutate graph-source, apply graph deltas, approve updates, satisfy
runtime Evidence, prove equivalence, enforce scope, or reject diffs.

The Human Review Packet surface is now available through
`graph read-model review-graph-delta --proposal <proposalPath> --markdown <file> --json`. It summarizes a
proposal-only preview for human developers, but it is review input only. It does not record approval, record a human
decision, mutate graph-source, apply graph deltas, satisfy runtime Evidence, prove equivalence, enforce scope, or reject
diffs.

Retrofit graph sources can be inspected before implementation:

```powershell
node dist/cli/index.js graph retrofit plan --graph-source <retrofit-graph-source.json> --json
```

The plan summarizes implementation-ready records, retained reference records, forbidden-flow boundaries, edgeIntent
coverage, and next inputs without touching the target project.

The read-model Evidence workflow also runs the same operation-chain and dogfood
evaluation commands with `pwsh`, uploads the `outputs/` reports, and records
`operationChainStatus` plus `dogfoodEvaluationStatus` in the CI manifest and
Step Summary. This is observation only; it is not a required check.

## Current Coverage

- CardPrinterConfig retrofit fixture smoke in fixture-only mode.
- cJSON-style open-source retrofit dogfood with maintainer-intent boundary.
- Real `mdn/todo-vue` external checkout dogfood with README-only instruction pack, graph delta, graph update proposal,
  and local Node/toolchain baseline blocker separation.
- Real `component/escape-html` external checkout dogfood with recovered stringification/escaping intent, a Symbol input
  code/test behavior change, project test pass, graph delta, and graph update proposal.
- Native graph-notes README-only dogfood.
- Native graph-counter behavior dogfood with a runtime test.

## Boundaries

- Non-enforcing local and CI observation only.
- No required check or branch protection.
- No tree retirement.
- No mutation of `Utility_Windows`.
- `work/` and `.tmp/` are ignored generated target areas.
