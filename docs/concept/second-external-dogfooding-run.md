# Second External Dogfooding Run

Status: completed-observation / external-project-local-run / no-upstream-push / narrower-blocker-found

## Purpose

This record captures the second bounded external dogfooding run after adoption-safe validation and the first
registry/projection generalization pass.

The goal was to verify whether an initialized external project can run PBE status and validation without being forced
to satisfy PBE plugin repository README, skills, templates, schemas, examples, or full compatibility inventory checks.

This run records observation evidence only. It does not push to the external repository, implement a broad external
feature slice, expand source authority, enable required checks, change branch protection, change CI behavior, change
schemas or state, or retire tree-native artifacts.

## External Target

- Repository: `https://github.com/mdn/todo-vue`
- Local temp checkout class: `%TEMP%\pbe-external-dogfooding-2\todo-vue-20260630004617`
- External HEAD observed: `8a7ef579f1d117a8ac9530a52f5c5a81c3e99676`
- Clone result: success
- External upstream push: not performed

The external checkout was used only for local smoke observation. The only external working tree mutation was local
`.pbe/` initialization.

## Commands Run

Commands were run from the external temp checkout using the local PBE CLI:

```powershell
node C:\Users\김영태\Documents\PBE\dist\cli\index.js profile recommend --brief "Add PBE tracking for a small docs-only or todo-search slice" --json
node C:\Users\김영태\Documents\PBE\dist\cli\index.js init --profile lite --brief "External dogfooding 2 adoption-safe validation smoke" --json
node C:\Users\김영태\Documents\PBE\dist\cli\index.js status --json
node C:\Users\김영태\Documents\PBE\dist\cli\index.js validate --json
git status --short
```

## Profile Recommendation Observation

`profile recommend` returned:

- `recommendedProfile`: `full`
- `workflowDepth`: `standard`
- `confidence`: `low`
- primary reason: uncertain scope/risk, no safe bypass or compact heuristic matched

This was conservative and safe. The brief contained both docs-only and todo-search wording, so the command did not
silently downgrade workflow depth. For the smoke run, `init --profile lite` was still run explicitly to observe compact
profile guidance after initialization.

## Initialization Result

`pbe init --profile lite` succeeded and created the usual `.pbe/` artifact skeleton.

Observed boundary:

- compact profile metadata was recorded;
- no dedicated `pbe lite` command was created;
- no reduced artifact initialization occurred;
- broad `.pbe` skeleton creation remains a known compatibility limitation.

## Status / Profile Observation

`pbe status --json` succeeded.

Observed status:

- `initialized`: `true`
- `profile`: `lite`
- `state`: `INIT`
- `recommendedNextCommand`: `pbe rpd close or pbe rpd check`
- `profileGuidance.profile`: `lite`
- compact workflow guidance appeared with must-keep guards and escalation triggers
- limitations correctly stated that `lite` is compatibility metadata, not a separate public workflow, and that there is
  no dedicated `pbe lite` command or reduced artifact initialization

This confirms status is usable in an initialized external project after `pbe init`.

## Adoption-Safe Validation Result

`pbe validate --json` did not run the PBE plugin repository validator stack against the external project.

The legacy validation section reported these initialized-project validators only:

```text
PBE layout
Autoflow state
RPD transition guard
WorkGraph
ACEP manifest
Revision
Project compatibility core
```

Legacy validation passed. This confirms the first external dogfooding blocker was resolved for repo-only validators:

- external README was not required to contain PBE plugin repository layout terms;
- skills inventory was not required;
- templates/schemas repository inventory was not required;
- examples fixtures were not required;
- full `.pbe/codex-execution-pack/` inventory was not required when not selected by current state.

## Remaining Validation Blocker

Overall `pbe validate --json` still failed because the v2 tree system found initialized visual profile references that
do not exist in the initialized Product/Project/Work/Test trees:

```text
visual profile VVP-001 references missing product node: PT-UI-001
visual profile VVP-001 references missing project node: PJ-SURFACE-001
visual profile VVP-001 references missing work node: WT-SURFACE-001
visual profile VVP-001 references missing test node: TT-SURFACE-001
```

This is a narrower adoption blocker than the first run. It is not a repo-only validation failure; it is an init/template
and v2 tree-system interaction issue.

The observed generated file was:

```text
.pbe/control/visual-verification-profile.json
```

It contained a draft `VVP-001` profile with placeholder references to `PT-UI-001`, `PJ-SURFACE-001`,
`WT-SURFACE-001`, and `TT-SURFACE-001`, while the initialized Product Tree only contained `PT-ROOT`.

## External Git Status

External `git status --short` showed:

```text
?? .pbe/
```

No external source files were changed. No external commit or push was made.

## What This Run Proved

- External clone/network access succeeded for `mdn/todo-vue`.
- `pbe init` can initialize the external project.
- `pbe status --json` is usable after external init.
- Compact profile guidance appears in external status output.
- Adoption-safe validation now skips repo-only validators for initialized external projects.
- The previous README/skills/templates/examples/full-ACEP repository validation blocker is resolved.

## Remaining Gaps Before Larger External Dogfooding

1. Init/template visual profile placeholders can make v2 tree validation fail immediately in a fresh external project.
2. Compact profile still creates broad artifacts; this is known but still adds adoption weight.
3. `profile recommend` stayed conservative for a mixed docs/todo-search brief; better expected-file hints may be needed
   for small external slices.
4. External validation should distinguish optional draft visual artifacts from required selected visual work.
5. Larger dogfooding should wait until fresh init can validate cleanly or the remaining v2 blocker is documented as an
   explicit expected limitation.

## Non-Goals

This run did not:

- push to the external upstream repository;
- implement a feature in the external project;
- expand source authority;
- promote Candidate B to a required check;
- configure branch protection or GitHub settings;
- change CI enforcement;
- retire tree-native artifacts;
- change schemas or state;
- change examples/valid or examples/invalid behavior;
- replace user acceptance.

## Next User Decision

The next decision is:

```text
Should PBE fix fresh-init visual profile placeholder validation before attempting a larger external dogfooding slice?
```

Recommended answer:

```text
Yes. Keep the fix narrow: missing optional/draft visual profile references should not block a fresh initialized external
project unless selected visual work or current state requires them.
```

## Follow-up Fix

Step 1 of the next sequence fixed this blocker narrowly: fresh init now writes the visual verification profile as
unconfigured / `not_required` instead of materializing placeholder Product, Project, Work, and Test node references.

The boundary remains strict for real artifacts:

- a fresh initialized external project should pass validation when no visual work is selected;
- malformed present visual verification profiles still fail when they reference missing required tree nodes;
- selected visual work can still require visual contract, inventory, screenshot/manual evidence, and review closure.
