# PBE v0.5.0-beta Readiness

## Purpose

This document defines what it means for PBE to be ready for the public `v0.5.0-beta` track. It separates the internal
implementation roadmap name from the public release name and clarifies what is included, what must pass, and what is not
yet v1.0.

## Version Naming

PBE 9.5 is the internal implementation roadmap name.

PBE v0.5.0-beta is the public beta release track name.

## What v0.5.0-beta Means

PBE v0.5.0-beta is not a production SaaS, hosted service, GUI product, or stable v1.0 release.

It is a CLI + file-artifact based development control layer for Codex/PBE workflows.

Beta-ready means:

- core control flow exists
- CLI state transitions exist
- Product / Work / Test / Evidence / Acceptance chain exists
- Change / Impact / Revision flow exists
- Product Patch Proposal exists
- File Change Guard exists
- RPD Interview / Draft UX guidance exists
- examples and dogfooding examples exist
- install/troubleshooting docs exist
- self-dogfooding run exists

## What Is Included

- CLI state transition engine
- RPD / WPD / VD / ACEP / execution / review / accept flow
- structured Acceptance Criteria
- traceability closure
- evidence freshness
- evidence quality guidance
- VD quality guidance
- ambiguity taxonomy
- parallel safety policy
- review failure recovery guidance
- Change / Impact / Revision
- Product Patch Proposal
- File Change Guard
- Skills CLI-sync validator
- valid/invalid examples
- adoption/dogfooding examples
- install/troubleshooting docs
- migration compatibility policy
- complexity governance

## Required Local Verification

Run local verification commands sequentially. On Windows, do not start `validate:pbe` and `test:examples` in parallel
because both may touch generated `dist` / `clean-dist` areas.

```powershell
npm.cmd run format:check
npm.cmd run validate:pbe
npm.cmd run validate:pbe:v2
npm.cmd run test:examples
npm.cmd run typecheck
npm.cmd test
node dist/cli/index.js --help
node dist/cli/index.js validate --json
```

## Required CI Status

The beta candidate should have a passing CI run on the target branch before release notes or distribution guidance are
published.

CI should confirm the same core guarantees as local verification: formatting, typechecking, tests, PBE validation, and
example fixture behavior.

## Required Documentation

The beta candidate should include:

- install and troubleshooting docs
- CLI reference
- core model docs
- RPD Interview Mode
- VD Quality Rubric
- Evidence Quality Rubric
- Parallel Safety Policy
- Review Failure Recovery
- Migration / Compatibility Policy
- Complexity Governance
- Known Limits

## Required Examples

The beta candidate should include:

- valid example fixture
- invalid regression fixtures
- existing project adoption example
- self-dogfooding example

Examples should remain clear about whether they are validator fixtures, adoption examples, or dogfooding records.

## Required Safety Guards

- State machine transition guard
- structured AC guard
- traceability closure
- evidence freshness
- assistant acceptance block
- revision safety
- file change guard
- Product Patch confirmation
- Skills CLI-sync validator
- complexity governance

## Manual Review Checklist

- [ ] Public docs do not imply PBE is a hosted service, GUI, or production SaaS.
- [ ] README links point to install, troubleshooting, CLI reference, beta readiness, and known limits.
- [ ] New optional artifacts preserve existing project compatibility.
- [ ] Valid and invalid examples still demonstrate expected behavior.
- [ ] Known limits are visible before users adopt PBE for high-stakes workflows.
- [ ] No package version, tag, or release artifact is created accidentally.

## Not Yet v1.0

PBE v0.5.0-beta is not v1.0 because:

- real-world adoption evidence is still limited
- artifact schemas may still change
- migration tooling is policy-level, not implemented command-level
- RPD Interview is guidance/skill-level, not a deterministic CLI interview engine
- package distribution is not yet stabilized
- public user experience may still be rough
- breaking changes are still possible during beta

## Beta Exit Criteria

v0.6:

- more real project dogfooding
- rough UX fixes
- status/next-action hardening if needed

v0.7:

- RPD Interview automation candidates evaluated
- repeated dogfooding failures converted to safe validators where deterministic

v0.8:

- adoption/migration tooling candidates evaluated
- `pbe doctor` / `pbe migrate` feasibility reviewed

v0.9:

- release candidate
- breaking change surface reduced
- migration policy tested

v1.0:

- stable public workflow
- documented migration path
- multiple real project validations
- known limits accepted

## Release Checklist

- [ ] Required local verification passes sequentially.
- [ ] Required CI status is green.
- [ ] README links include beta readiness and known limits.
- [ ] No accidental package version change was made.
- [ ] No git tag or release was created before explicit release approval.
- [ ] Migration / Compatibility Policy is current.
- [ ] Known Limits are current.
- [ ] Release notes identify beta status and non-v1.0 limits.
