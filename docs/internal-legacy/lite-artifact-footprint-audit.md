# Lite Artifact Footprint Audit

## Purpose

This audit measures whether the `lite` compatibility profile value materially reduces generated PBE artifacts compared
with `full`.

`lite`, `full`, and `bypass` are compatibility profile values in the current CLI. They should be interpreted as
workflow-depth hints, not separate public product modes.

## Method

- Temporary directories were used under `%TEMP%`.
- The repo root `.pbe` was not created or modified.
- The audit only measured generated artifacts.
- No CLI, schema, validator, template, skill, or docs behavior was changed.

Commands measured:

```bash
node dist/cli/index.js init --profile lite --brief "Artifact footprint audit lite"
node dist/cli/index.js init --profile full --brief "Artifact footprint audit full"
node dist/cli/index.js init --profile bypass --brief "Artifact footprint audit bypass"
```

Each profile was initialized in its own temporary folder:

```text
%TEMP%/pbe-footprint-audit-20260615171638/lite
%TEMP%/pbe-footprint-audit-20260615171638/full
%TEMP%/pbe-footprint-audit-20260615171638/bypass
```

## Summary

Lite, Full, and Bypass compatibility values currently generate the same `.pbe` artifact footprint.

The profiles differ in stored profile metadata and brief-derived initial content, but not in generated file count,
directory count, or artifact families.

## Profile Footprint Comparison

| Profile | .pbe files | .pbe directories | Notes                                                                |
| ------- | ---------: | ---------------: | -------------------------------------------------------------------- |
| lite    |         27 |               13 | Same generated artifact footprint as Full; `autoflow.profile=lite`   |
| full    |         27 |               13 | Baseline full artifact footprint; `autoflow.profile=full`            |
| bypass  |         27 |               13 | Same generated artifact footprint as Full; `autoflow.profile=bypass` |

State summary for all three profiles:

| Profile | `autoflow.state` | `autoflow.nextStep` | `completedSteps` | `deliveryStatus`            |
| ------- | ---------------- | ------------------- | ---------------- | --------------------------- |
| lite    | `INIT`           | `rpd`               | `start`          | `waiting_root_confirmation` |
| full    | `INIT`           | `rpd`               | `start`          | `waiting_root_confirmation` |
| bypass  | `INIT`           | `rpd`               | `start`          | `waiting_root_confirmation` |

## Lite Generated Files

Lite generated these 27 files:

```text
blueprint/component-style-contract.json
blueprint/design-tokens.json
blueprint/pbe-invariants.md
blueprint/pbe-state.json
blueprint/project-brief.md
blueprint/requirement-tree.json
blueprint/requirement-tree.md
blueprint/rpd-interview-log.md
blueprint/rpd-summary.md
blueprint/source-of-truth-matrix.md
blueprint/ui-theme-spec.md
blueprint/visual-reference.json
blueprint/visual-reference.md
control/acceptance-tree.json
control/change-tree.json
control/component-style-inventory.json
control/decision-queue.json
control/impact-tree.json
control/product-patch-tree.json
control/ui-surface-inventory.json
control/visual-verification-profile.json
evidence/evidence-tree.json
evidence/visual-audit.md
tree/product-tree.json
tree/project-tree.json
tree/test-tree.json
tree/work-tree.json
```

Lite generated these 13 directories:

```text
blueprint
codex-execution-pack
control
evidence
evidence/logs
evidence/review-reports
evidence/screenshots
evidence/test-results
execution
execution/node-execution-contracts
review
revisions
tree
```

## Full Generated Files

Full generated the same 27 files and 13 directories as Lite.

Files whose content differed from Lite were profile or brief-derived files:

```text
blueprint/pbe-state.json
blueprint/project-brief.md
blueprint/requirement-tree.json
blueprint/requirement-tree.md
tree/product-tree.json
```

The artifact families and relative paths were otherwise identical.

## Bypass Generated Files

Bypass generated the same 27 files and 13 directories as Full and Lite.

Files whose content differed from Full were profile or brief-derived files:

```text
blueprint/pbe-state.json
blueprint/project-brief.md
blueprint/requirement-tree.json
blueprint/requirement-tree.md
tree/product-tree.json
```

The artifact families and relative paths were otherwise identical.

## Findings

- Lite is lighter as policy and guidance, but not lighter as an artifact footprint.
- Lite does not currently reduce generated `.pbe` file count compared with Full.
- Bypass also generates the same `.pbe` file and directory footprint as Full.
- The only observed profile distinction is metadata and brief-derived initial content.
- The current init behavior favors compatibility and immediate artifact availability over workload-minimal generation.

## Potential Reduction Candidates

Potential future reduction candidates for Lite:

- Lazy-create optional visual artifacts:
  - `blueprint/visual-reference.json`
  - `blueprint/visual-reference.md`
  - `blueprint/ui-theme-spec.md`
  - `blueprint/design-tokens.json`
  - `blueprint/component-style-contract.json`
- Lazy-create optional UI/control artifacts:
  - `control/ui-surface-inventory.json`
  - `control/component-style-inventory.json`
  - `control/visual-verification-profile.json`
  - `evidence/visual-audit.md`
- Consider whether Lite needs all Product/Project/Work/Test trees at init time or can create lower trees on first use.
- Consider whether empty evidence subdirectories should be created only when evidence is attached.
- Consider whether bypass should avoid tree/control/evidence artifacts unless PBE tracking is explicitly activated.
- Consider keeping templates as references instead of materializing every optional artifact during Lite init.

No reduction is implemented by this audit.

## Risks

Reducing generated artifacts may break validators, examples, or existing assumptions.

Any Lite artifact reduction should be done incrementally and covered by tests.

Specific risks:

- Existing validators may assume optional files exist after `pbe init`.
- Examples or docs may describe current init output.
- Skills may refer to initialized artifact paths.
- Compatibility with existing `.pbe` layouts may be easier when init eagerly creates known files.
- Lazy creation needs clear command ownership so Codex does not hand-edit state or create inconsistent partial
  artifacts.

## Recommended Next Steps

1. Decide whether Lite should be artifact-minimal or only workflow-minimal.
2. If artifact-minimal Lite is desired, start with one lazy-create family, preferably visual artifacts.
3. Add tests that compare `pbe init --profile lite`, `full`, and `bypass` footprints before changing behavior.
4. Keep Full eager initialization as the compatibility baseline.
5. Treat bypass separately: either document it as "no active PBE tracking" or make its init artifact footprint genuinely
   minimal in a dedicated behavior-changing stage.
6. Update docs and validators only after the new artifact policy is tested.
