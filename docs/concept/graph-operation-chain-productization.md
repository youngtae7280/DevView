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
- CLI graph update proposal entry point: `pbe graph operation apply-proposal`.
- CLI retrofit planning entry point: `pbe graph retrofit plan`.
- Generated observation reports under `outputs/`.
- Non-enforcing CI observation through `.github/workflows/read-model-evidence.yml`.

## Local Commands

```powershell
npm run validate:pbe:operation-chain
```

```powershell
npm run validate:pbe:dogfood
```

The operation-chain command recreates small ignored target repos under `work/`
and validates graph-source, instruction pack, graph delta, graph update
proposal, and dogfood evaluation surfaces.

The CLI wrapper exposes the same operation-chain script path through a stable command:

```powershell
node dist/cli/index.js graph operation run-chain --dry-run --json
```

`--dry-run` previews the wrapped command. Running without `--dry-run` delegates to the existing script and preserves its
output behavior.

Graph update proposals can now be previewed or applied through the CLI:

```powershell
node dist/cli/index.js graph operation apply-proposal --proposal <proposal.json> --json
```

Preview mode is the default. Applying requires explicit `--apply` and updates only graph-source node/record status fields
after stale-state and boundary checks pass.

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
