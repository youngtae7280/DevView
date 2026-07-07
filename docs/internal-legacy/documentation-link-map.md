# Documentation Link Map

## Purpose

This link map records documentation reference risk before any documentation diet, archive, rename, or consolidation
work.

It is an inventory only. It does not move, delete, rename, merge, or rewrite existing documents or links.

## Summary

PBE documentation has three high-risk reference surfaces:

- User entry points: `README.md`, `docs/index.md`, and `examples/README.md`
- Agent routing surfaces: `agent-context/*` and `skills/*/SKILL.md`
- Validation-sensitive surfaces: `examples/valid`, `examples/invalid`, and docs that describe `test:examples`

Operational reference counts below are literal basename/path matches across `README.md`, `docs/**/*.md`,
`agent-context/**/*.md`, `skills/**/SKILL.md`, and `examples/README.md`, excluding
`docs/documentation-diet-inventory.md` so that the previous inventory does not artificially dominate the counts.

## High-Reference Documents

| Document                                       | Operational refs | Link risk               | Notes                                                       |
| ---------------------------------------------- | ---------------- | ----------------------- | ----------------------------------------------------------- |
| `docs/install.md`                              | 12               | High                    | README, index, CLI/reference, troubleshooting path          |
| `docs/troubleshooting.md`                      | 10               | High                    | README/index/agent-context plus Windows validation guidance |
| `docs/parallel-safety.md`                      | 10               | High                    | Agent-context and skill references                          |
| `docs/evidence-quality-rubric.md`              | 10               | High                    | Agent-context, skills, CLI reference                        |
| `docs/known-limits.md`                         | 9                | High                    | README/index/agent-context/current context limits           |
| `docs/review-failure-recovery.md`              | 9                | High                    | Agent-context and review skill references                   |
| `docs/cli-reference.md`                        | 7                | High                    | README, index, start context                                |
| `docs/lite-mode-policy.md`                     | 7                | High                    | Agent-context/start/lite and policy references              |
| `docs/vd-quality-rubric.md`                    | 7                | High                    | Agent-context, skills, CLI reference                        |
| `docs/ambiguity-taxonomy.md`                   | 6                | Medium-high             | RPD agent-context and RPD skill                             |
| `docs/beta-readiness.md`                       | 6                | Medium-high if archived | README, index, CLI reference, readiness snapshot            |
| `docs/migration-policy.md`                     | 5                | Medium-high             | Product patch context and CLI reference                     |
| `docs/complexity-governance.md`                | 4                | Medium                  | README, index, CLI reference                                |
| `docs/workload-cap-and-artifact-minimalism.md` | 2                | Medium                  | Linked from index and lite mode policy                      |
| `docs/dogfooding-existing-project.md`          | 2                | Medium if archived      | Index and adoption example reference                        |
| `docs/v0.5.0-beta-readiness-snapshot.md`       | 1                | Medium if archived      | Index/reference snapshot                                    |
| `examples/README.md`                           | 3                | High                    | README and docs index entry point                           |
| `agent-context/README.md`                      | 3                | High for agent routing  | Skills and docs index route to it                           |

## Agent Context References

`agent-context/README.md` links to all context cards:

- `start.md`
- `lite.md`
- `rpd.md`
- `wpd.md`
- `vd.md`
- `evidence.md`
- `review.md`
- `revision.md`
- `product-patch.md`
- `parallel.md`

Context cards reference these full docs:

- `agent-context/start.md` -> `README.md`, `docs/cli-reference.md`, `docs/lite-mode-policy.md`
- `agent-context/lite.md` -> `docs/lite-mode-policy.md`, `docs/known-limits.md`
- `agent-context/rpd.md` -> `docs/rpd-interview-mode.md`, `docs/ambiguity-taxonomy.md`
- `agent-context/wpd.md` -> `docs/parallel-safety.md`
- `agent-context/vd.md` -> `docs/vd-quality-rubric.md`, `docs/evidence-quality-rubric.md`
- `agent-context/evidence.md` -> `docs/evidence-quality-rubric.md`
- `agent-context/review.md` -> `docs/review-failure-recovery.md`, `docs/product-patch-proposals.md`
- `agent-context/revision.md` -> `docs/product-patch-proposals.md`, `docs/review-failure-recovery.md`
- `agent-context/product-patch.md` -> `docs/product-patch-proposals.md`, `docs/migration-policy.md`
- `agent-context/parallel.md` -> `docs/parallel-safety.md`, `docs/troubleshooting.md`

Impact:

- Moving any referenced doc requires updating the context card, `pbe context recommend`, and `pbe context pack`
  expectations if those commands emit the path.
- Agent-context files should remain short execution cards. They should link to consolidated docs rather than absorb long
  policy content.

## Skill References

Skill docs reference full docs and templates as part of agent behavior. These are not ordinary documentation links.

Direct doc references found in skills:

- `skills/pbe-autoflow/SKILL.md` -> `agent-context/README.md`
- `skills/pbe-start/SKILL.md` -> `agent-context/README.md`
- `skills/pbe-rpd/SKILL.md` -> `docs/ambiguity-taxonomy.md`
- `skills/pbe-vd/SKILL.md` -> `docs/vd-quality-rubric.md`
- `skills/pbe-wpd/SKILL.md` -> `docs/parallel-safety.md`
- `skills/pbe-run-acep/SKILL.md` -> `docs/evidence-quality-rubric.md`, `docs/parallel-safety.md`
- `skills/pbe-review-result/SKILL.md` -> `docs/evidence-quality-rubric.md`, `docs/review-failure-recovery.md`

Template references in skills are also sensitive:

- status card templates
- review result gate templates
- evidence quality checklist template
- parallel safety checklist template
- RPD ambiguity and interview templates

Impact:

- Skill links affect execution behavior and should be updated only in the same change as the target doc move.
- If a policy doc is consolidated, skill references should point to the new section or stable wrapper doc.

## README and Docs Index References

`README.md` links to:

- `docs/install.md`
- `docs/cli-reference.md`
- `docs/index.md`
- `examples/README.md`
- `examples/internal-legacy/adoption/todo-search-slice/README.md`
- `docs/beta-readiness.md`
- `docs/known-limits.md`
- `docs/complexity-governance.md`

`docs/index.md` is the densest documentation hub. It links to core docs, policy docs, agent context, examples, readiness
docs, and snapshots.

High-impact index links include:

- `docs/install.md`
- `docs/cli-reference.md`
- `docs/troubleshooting.md`
- `docs/beta-readiness.md`
- `docs/known-limits.md`
- `docs/ambiguity-taxonomy.md`
- `docs/review-failure-recovery.md`
- `docs/parallel-safety.md`
- `docs/lite-mode-policy.md`
- `docs/workload-cap-and-artifact-minimalism.md`
- `docs/migration-policy.md`
- `docs/vd-quality-rubric.md`
- `docs/evidence-quality-rubric.md`
- `docs/complexity-governance.md`
- `examples/README.md`
- `examples/internal-legacy/adoption/todo-search-slice/README.md`
- `examples/internal-legacy/dogfooding/windows-validation-sequential-run/README.md`

Impact:

- README and `docs/index.md` must be updated in the same commit as any doc move.
- If archive moves happen, `docs/index.md` should keep a stable archive section.

## Examples and Validation-Sensitive References

`examples/README.md` distinguishes:

- `examples/valid/todo-app-devview-run` as the valid golden fixture
- `examples/invalid/*` as invalid regression fixtures
- `examples/internal-legacy/adoption/todo-search-slice` as narrative adoption material
- `examples/internal-legacy/dogfooding/windows-validation-sequential-run` as a historical dogfooding record

Validation-sensitive references:

- `README.md` describes `npm run test:examples` and names `examples/valid/todo-app-devview-run` plus
  `examples/invalid/*`.
- `docs/validator-design.md` describes the example regression suite.
- `docs/troubleshooting.md` mentions example regression behavior.
- `docs/migration-policy.md` warns that `examples/valid` and `examples/invalid` should remain unaffected.

Impact:

- Do not move `examples/valid` or `examples/invalid` unless `scripts/test-examples.js`, docs, and tests are updated
  together.
- Adoption and dogfooding examples can become archive candidates, but their links from README/index/example docs must be
  updated first.

## Consolidation Link Impact

If policy candidates move into `docs/policies.md`, these incoming references need updates:

- `docs/lite-mode-policy.md`
  - Referenced by `README`/index-related docs, `agent-context/start.md`, `agent-context/lite.md`, and CLI reference.
- `docs/workload-cap-and-artifact-minimalism.md`
  - Referenced by `docs/index.md` and `docs/lite-mode-policy.md`.
- `docs/complexity-governance.md`
  - Referenced by `README.md`, `docs/index.md`, and `docs/cli-reference.md`.
- `docs/parallel-safety.md`
  - Referenced by `agent-context/wpd.md`, `agent-context/parallel.md`, `skills/pbe-wpd`, `skills/pbe-run-acep`, and
    `docs/cli-reference.md`.
- `docs/migration-policy.md`
  - Referenced by `agent-context/product-patch.md`, `docs/cli-reference.md`, and readiness/snapshot material.
- `docs/review-failure-recovery.md`
  - Referenced by `agent-context/review.md`, `agent-context/revision.md`, `skills/pbe-review-result`, and
    `docs/cli-reference.md`.
- `docs/evidence-quality-rubric.md`
  - Referenced by `agent-context/evidence.md`, `agent-context/vd.md`, `skills/pbe-review-result`, `skills/pbe-run-acep`,
    and `docs/cli-reference.md`.
- `docs/vd-quality-rubric.md`
  - Referenced by `agent-context/vd.md`, `skills/pbe-vd`, and `docs/cli-reference.md`.
- `docs/ambiguity-taxonomy.md`
  - Referenced by `agent-context/rpd.md`, `skills/pbe-rpd`, `docs/index.md`, and `docs/cli-reference.md`.

If workflow candidates move into `docs/workflow.md`, likely update points are:

- `docs/index.md`
- `docs/cli-reference.md`
- skill docs that point to stage-specific behavior
- agent-context cards that point to full workflow docs

Recommendation:

- Keep wrapper files or redirects during the first consolidation pass.
- Update `pbe context recommend` and `pbe context pack` output paths only after wrapper docs prove stable.

## Archive Link Impact

Archive candidates and likely link updates:

- Dogfooding records
  - `docs/dogfooding-existing-project.md`
  - `examples/internal-legacy/dogfooding/windows-validation-sequential-run/README.md`
  - Linked from `docs/index.md`, `examples/README.md`, and adoption/dogfooding references.
- Beta readiness
  - `docs/beta-readiness.md`
  - Linked from `README.md`, `docs/index.md`, `docs/cli-reference.md`, and readiness snapshot material.
- Readiness snapshot
  - `docs/v0.5.0-beta-readiness-snapshot.md`
  - Linked from `docs/index.md`.
- Existing project adoption examples
  - `examples/internal-legacy/adoption/todo-search-slice/README.md`
  - Linked from `README.md`, `docs/index.md`, `docs/dogfooding-existing-project.md`, and `examples/README.md`.
- Historical reports
  - `docs/direction-correction-report.md`
  - Mentions removed GUI direction and should be preserved if moved.

Recommendation:

- Do not archive by moving files first.
- First add an archive index, then update inbound links, then move one family at a time.

## Risk Notes

- `skills/*/SKILL.md` links are agent behavior surfaces and can change how Codex performs PBE work.
- `agent-context/*` links affect `context recommend` and `context pack` workflows.
- `examples/valid` and `examples/invalid` can affect `test:examples` or validator behavior and should not move in a
  documentation-only diet pass.
- `README.md` and `docs/index.md` are user entry points; broken links there are high-impact.
- `docs/cli-reference.md` includes command output examples with path strings. Changing paths may require CLI tests or
  snapshots to be reviewed.
- The previous `docs/documentation-diet-inventory.md` intentionally lists many docs. It should be updated after any real
  archive or consolidation stage.

## Recommended Next Steps

1. Add a lightweight link-check script before moving documents.
2. Create `docs/archive/README.md` as a stable archive landing page before moving archive candidates.
3. Consolidate policy docs by adding wrapper sections first, not by immediate deletion.
4. Update `agent-context` and `skills` links only after the new target docs exist.
5. Keep `examples/valid` and `examples/invalid` fixed until the example runner is explicitly updated.
6. After every move or consolidation stage, run `npm.cmd run test:examples`, `npm.cmd run validate:pbe`, and
   `npm.cmd run validate:pbe:v2`.
