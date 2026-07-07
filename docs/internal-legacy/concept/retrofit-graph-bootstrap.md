# Retrofit Graph Bootstrap

Status: concept policy

## Document Purpose

Retrofit Graph Bootstrap defines how PBE can be introduced into an existing project that was not built with PBE.

The goal is to make PBE useful without pretending that the full Maintainability Graph is known on day one.

This document is concept-level only. It does not define a scanner, CLI command, schema, validator, runtime model,
generated builder, migration script, or implementation plan.

Current operational source remains whatever the current project uses plus any tree-native PBE artifacts that are later
created. This policy does not promote Maintainability Graph or change source authority.

## Core Principle

Do not require complete upfront Graph reconstruction.

Existing projects usually lack complete Product, Work, Test, Evidence, and Acceptance history. PBE should grow a graph
progressively:

```text
structural bootstrap
-> behavior inference
-> finding / unknown records
-> task-driven expansion
-> verified graph growth
```

The graph begins as a partial read/alignment model with confidence and freshness labels, not as a complete source model.

## Phase 1: Structural Bootstrap

Structural Bootstrap anchors what can be observed with relatively low semantic risk.

Create or propose durable node anchors for:

- code files, symbols, modules, commands, and entry points
- checks and test files
- documents and public usage notes
- logs or command outputs
- evidence-like artifacts
- data shapes, config files, fixtures, and state stores

Create only high-confidence structural edges first:

- `depends-on`
- `calls`
- `reads`
- `writes`
- `touches`
- `takes-input`
- `returns`

Structural Bootstrap should avoid inferring product requirements from code behavior. It may say a route calls a helper,
or a test touches a fixture. It should not say that the observed behavior is the intended product requirement unless a
Product record, user decision, or accepted document supports that meaning.

## Phase 2: Behavior Inference

Behavior Inference creates behavior candidates and inferred edges from observed code, tests, docs, and runtime traces.

Possible candidate records:

- observed behavior
- inferred behavior
- product candidate
- expected result candidate
- regression behavior candidate

Possible inferred edges:

- `code implements behavior`
- `check verifies behavior`
- `evidence evidences check`
- `finding reports-on behavior`

Every inferred behavior relationship needs confidence and freshness/status metadata. Inferred behavior must not be
silently upgraded into a Product Requirement.

## Phase 3: Finding / Unknown Records

When PBE does not know something, it records the uncertainty instead of hiding it.

Use findings or unknowns for:

- unclear product intent
- ambiguous ownership
- missing tests
- stale evidence
- risky code paths
- compatibility mismatch
- unverified runtime behavior
- partial traceability
- source authority ambiguity

Finding and Unknown records are useful graph nodes because they prevent AI from filling gaps with unsupported claims.

Observed Behavior is not Product Requirement.

AI self-report is not Evidence.

## Phase 4: Task-Driven Expansion

Do not expand the entire graph just because a project is being onboarded.

For each maintenance request, build a task-scoped View Instance around:

- the request target
- nearby code nodes
- related checks and evidence
- affected behavior candidates
- known findings and unknowns
- scope boundaries and forbidden areas
- required decisions or acceptance questions

Task-driven expansion keeps retrofit work bounded. It also prevents the graph from becoming a large unverified map that
looks authoritative but is actually speculative.

## Phase 5: Verified Graph Growth

After a task is executed and reviewed, grow the graph with verified relationships.

Possible verified additions:

- change nodes and `invalidates` / `preserves` edges
- check nodes and `verifies` edges
- evidence nodes and `evidences` edges
- decision nodes and `approves`, `rejects`, or `resolves` edges
- findings that were resolved or accepted as risk
- refreshed freshness/status labels
- acceptance records that remain user-controlled

Verified growth requires observable Evidence or user judgment depending on relationship type.

## Confidence / Freshness Treatment

Retrofit graph records must keep confidence separate from freshness/status.

Examples:

| Record example                                     | Confidence     | Freshness/status |
| -------------------------------------------------- | -------------- | ---------------- |
| Static import edge from parser output              | tool-confirmed | fresh            |
| Behavior inferred from a test name                 | inferred       | unknown          |
| Product meaning confirmed by user review           | user-confirmed | fresh            |
| Old screenshot linked to a changed UI surface      | tool-confirmed | stale            |
| Compatibility mismatch observed in public docs     | tool-confirmed | fresh            |
| Suspected behavior with weak code/document support | low-confidence | unknown          |

`stale` is not confidence. It describes current validity after change, drift, or task scope.

## Update Safety

AI may propose graph growth. It must not silently confirm graph truth.

Safe update principle:

```text
AI proposes candidate nodes and edges.
Tools and evidence can confirm structural relationships.
Users or accepted evidence confirm product meaning, acceptance, risk decisions, and source authority.
Unknowns and findings stay visible until resolved.
```

Do not hide:

- missing Evidence
- stale Evidence
- inferred-only behavior
- unconfirmed Product Candidates
- unresolved Risk or Unknown records
- compatibility caveats
- out-of-contract discoveries

## Retrofit Output Shape

A retrofit pass may produce:

- structural node inventory
- behavior candidate list
- finding / unknown list
- task-scoped View Instance Manifest
- checks and required Evidence list
- source references and confidence/freshness notes
- Graph update proposal

These are review aids. They are not source authority unless a later explicit source policy says so.

## Source Authority Boundary

Retrofit Graph Bootstrap does not:

- make Maintainability Graph current source
- replace Product, Project, Work, Test, Evidence, or Acceptance Trees
- perform Graph-source promotion
- migrate legacy artifacts
- close user acceptance
- implement scanners, validators, CLI commands, or generated graph builders

It only defines how PBE can begin with partial, honest, evidence-aware graph growth when a project was not originally
created under PBE.

## Gate Self-Check

| Gate                    | Result | Notes                                                                                       |
| ----------------------- | ------ | ------------------------------------------------------------------------------------------- |
| No Full Upfront Graph   | PASS   | Retrofit begins with structural anchors and grows around real tasks.                        |
| Observed Vs Required    | PASS   | Observed behavior is separated from Product Requirement.                                    |
| Unknown Visibility      | PASS   | Findings and unknowns are first-class records rather than hidden assumptions.               |
| Evidence Safety         | PASS   | AI self-report is not Evidence; verified growth needs observable proof or user judgment.    |
| Source Authority Safety | PASS   | Retrofit does not promote Maintainability Graph or change current operational source.       |
| Implementation Boundary | PASS   | No CLI, scanner, schema, runtime, validator, migration, or generated builder is introduced. |
