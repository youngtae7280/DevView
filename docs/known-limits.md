# Known Limits

## Purpose

This document describes what PBE v0.5.0-beta does not do yet, what it intentionally does not do, and where reviewer or
user judgment is still required.

## Not a Fully Automatic Product Manager

PBE can draft Product Tree candidates and questions, but it does not own product meaning.

User confirmation is still required before product meaning is treated as confirmed.

## Not a Replacement for User Confirmation

Codex/AI cannot accept work on behalf of the user. Acceptance remains user-only.

PBE can recommend acceptance readiness, but it cannot replace explicit user acceptance.

## Not a Global Reverse-engineering Tool

PBE should not try to convert an entire existing project into a full Product Tree at once.

Existing project adoption should start from the next bounded slice.

## Not a GUI or Hosted Service

PBE v0.5.0-beta is CLI + artifact based.

It is not yet a GUI, daemon, SaaS, or hosted workflow manager.

## Not a Test Runner Replacement

PBE does not replace test frameworks.

It links Product/AC/Test/Evidence and requires proof, but tests still run through existing project tools.

## Not an Automatic Semantic Analyzer

PBE guidance can classify ambiguity and suggest questions, but it does not perfectly understand user intent.

Natural-language quality checks should not become hard validator failures until deterministic.

Profile recommendation is heuristic and conservative. It is not a full semantic product analysis engine.

Context recommendation is deterministic and heuristic. It routes the agent to likely relevant context, but it is not a
full semantic understanding engine.

Documentation routing is based on keyword and file path signals such as `docs/`, README, troubleshooting, install, and
PowerShell/npm help text.

Status context recommendation is heuristic and path-based. It recommends context files but does not guarantee semantic
completeness.

## Not a Substitute for Code Review

PBE improves traceability and evidence, but it does not replace engineering review. Reviewers still need to inspect
code, behavior, risks, security, accessibility, and maintainability when relevant.

## Existing Project Adoption Limits

PBE is safest when applied to the next bounded change slice of an existing project.

It is not intended to recover every historical product decision, old acceptance record, or undocumented behavior in one
large pass.

## Product Patch Limits

Product Patch Proposal is a user-confirmed Product Tree mutation flow.

It is not an automatic product decision engine.

Product Tree meaning should not be changed silently. Product Patch requires user confirmation before apply.

## RPD Interview Limits

RPD Interview Mode is guidance/skill/template driven. It can help draft Product Tree candidates and ask one
highest-impact question, but it is not a deterministic CLI interview engine.

## VD / Evidence Limits

VD Quality Rubric and Evidence Quality Rubric improve review quality, but they do not automatically prove that every
test/evidence is semantically perfect.

Reviewer judgment is still required.

## Parallel Safety Limits

Parallel Safety Policy is guidance.

No `pbe work parallel-check` command exists yet.

Default to sequential execution unless independence is proven.

## Migration Limits

Migration policy exists, but `pbe migrate` / `pbe doctor` are future candidates, not implemented commands.

Existing optional artifacts should remain compatible when missing, but deterministic migration tooling is not yet
available.

## File Change Guard Limits

File Change Guard checks whether changed files are explained by Work or Revision scope. It does not prove that every
change is semantically correct, complete, secure, or well-designed.

## Recommended Use Cases

- bounded feature slice
- existing project next change
- UI/UX revision loop
- acceptance/evidence-heavy work
- Codex task control
- regression-sensitive change
- product meaning changes that need Product Patch Proposal

## Not Recommended Use Cases

- entire repo auto-rewrite
- vague product strategy with no user confirmation
- code-only spike with no acceptance
- large refactor without scoped Work Tree
- accepting without evidence
- parallel mutation of the same PBE artifacts
