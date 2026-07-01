# Compiler Input Model MVP

Status: MVP implemented / dry-run input fixture validator / local non-enforcing report

## Purpose

The Contract Fixture Validator answers: "Is this execution contract-shaped fixture safe enough to call a contract?"

The Compiler Input Model answers the preceding question: "What machine-readable facts may an Actual Contract Compiler
consume before it derives a contract?"

This layer exists so future contract compilation does not start from AI prose. It starts from bounded inputs:

- human request;
- graph snapshot;
- pack schema;
- policy snapshot;
- evidence index;
- target scope candidates.

## Current MVP Artifacts

- `examples/read-model-aggregate/compiler-input-model-schema.json`
- `examples/read-model-aggregate/generated/compiler-input-model-dry-run.json`

The local report command is:

```powershell
node dist/cli/index.js graph read-model report-compiler-input --json
```

The dry-run input uses the Todo Search whitespace-normalization dogfood as its first fixture.

## Validator Rules

The MVP blocks:

- missing required input groups;
- schema input definitions without source or bounded authority;
- dry-run inputs with missing human request, graph snapshot, pack schema, policy snapshot, evidence index, or target
  scope candidates;
- graph snapshot artifacts without id/path/role;
- policy entries without id/authority/status;
- evidence entries without id/artifact/evidenceType/freshness;
- target scope candidates without paths or derivation;
- any `compiledExecutionContract` claim inside the input fixture.

## Boundary

This MVP does not compile an execution contract, execute AI, apply graph deltas, accept work, enable required checks,
configure branch protection, expand source authority, or retire tree-native artifacts.

It only proves that a future Actual Contract Compiler has a machine-readable input surface to consume.
