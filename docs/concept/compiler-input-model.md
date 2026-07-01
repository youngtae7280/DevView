# Compiler Input Model MVP

Status: MVP implemented / dry-run input fixture validator / cross-reference validation / local non-enforcing report

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

The next local dry-run layer consumes this input through
[contract-compiler-dry-run.md](contract-compiler-dry-run.md).

## Validator Rules

The MVP blocks:

- missing required input groups;
- schema input definitions without source or bounded authority;
- dry-run inputs with missing human request, graph snapshot, pack schema, policy snapshot, evidence index, or target
  scope candidates;
- graph snapshot artifacts without id/path/role;
- graph snapshot artifact paths that do not exist;
- policy entries without id/authority/status;
- policy entries with authority or status outside the current bounded vocabulary;
- policy snapshots without `evidenceCheckMappings[]` for compiler-owned Evidence/check derivation;
- evidence check mappings without `evidenceType`, `requiredCheckId`, or `compiledEvidenceType`;
- policy snapshots without `forbiddenScopeRules[]` for compiler-owned forbidden-scope derivation;
- forbidden scope rules without id, bounded scope kind, existing paths, or derivation;
- evidence entries without id/artifact/evidenceType/freshness;
- evidence entries whose artifact path does not exist;
- evidence freshness outside the current bounded vocabulary;
- target scope candidates without paths or derivation;
- target scope candidate paths that do not exist;
- target scope candidate `derivedFrom` references that do not point at a known `graph-source:node:<id>`;
- target scope candidate scope kind or confidence outside the current bounded vocabulary;
- pack schema required input groups outside the current input group vocabulary;
- any `compiledExecutionContract` claim inside the input fixture.

## Boundary

This MVP does not compile an execution contract by itself, execute AI, apply graph deltas, accept work, enable required
checks, configure branch protection, expand source authority, or retire tree-native artifacts.

It only proves that a future Actual Contract Compiler has a machine-readable input surface to consume.
