# Validator Design

PBE validation is split between the CLI validator layer, preserved repository-level compatibility scripts, and example
regression fixtures while preserving the historical command:

```text
node scripts/validate-pbe-files.js
npm run validate:pbe
npm run validate
```

## Layers

- `cli/src/validators/*`: the active CLI validator layer used by `pbe validate`, stage gates, and transition commands.
- `scripts/validate-pbe-files.js`: repository-level validation wrapper for plugin structure, compatibility artifacts,
  examples, and preserved checks.
- `scripts/validate-pbe-tree-system.js`: v2 schema/template and optional `.pbe` tree artifact validator.
- `scripts/validators/*`: legacy repository validation scripts used by `scripts/validate-pbe-files.js`.
- `scripts/validator-utils/*`: shared file, JSON, markdown, and report helpers for legacy repository validators.
- `scripts/validators/legacy-core.js`: compatibility validator preserved from the previous monolithic implementation.
- `scripts/test-examples.js`: example regression runner for valid and invalid fixture workspaces.
- `examples/valid/*`: closed golden `.pbe` fixture workspaces.
- `examples/invalid/*`: invalid mutation fixtures with expected issue codes.

## Example Regression

Run the example regression suite with:

```bash
npm run test:examples
```

The runner builds the CLI, materializes `examples/valid/todo-app-pbe-run`, and expects `pbe validate` plus stage-aware
`pbe trace check` commands to pass. Invalid fixtures under `examples/invalid/*` are applied as focused mutations to the
golden run; each command must fail with its configured `expectedIssueCode`. This keeps the current state machine,
structured acceptance criteria, traceability closure, evidence freshness, and Change/Impact/Revision skeleton covered by
concrete `.pbe` examples without adding new validator rules.

## Expected Report Shape

The CLI may render pass/fail markers with symbols. The ASCII-safe shape is:

```text
[PBE Validate]

PASS Plugin structure
PASS Skills
PASS Skills CLI sync
PASS Templates
PASS Schemas
PASS PBE layout
PASS Autoflow state
PASS RPD transition guard
PASS WorkGraph
PASS ACEP manifest
PASS Revision
PASS Examples
PASS Compatibility core

Result: PASS
```

Failures should include the validator name, file, error code, message, and a suggested fix.

## Repository Validator Responsibility Boundaries

`scripts/validate-pbe-files.js` reports `Skills`, `Skills CLI sync`, and `Compatibility core` together, but they protect
different failure surfaces. Keep them separate unless their failure semantics become the same.

| Validator          | Scope                                          | What it catches                                                           | What it does not catch                     | Why it stays separate                                                                   |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| Skills             | Public skill presence and baseline structure   | Missing required skill docs, invalid basic skill metadata/shape           | Legacy CLI flow wording                    | It verifies skill inventory and basic structure, not CLI-flow synchronization           |
| Skills CLI sync    | Skill-to-CLI flow synchronization              | Forbidden legacy gate/state direct-edit instructions                      | General skill completeness                 | It prevents regression to old gate/state instructions with distinct issue semantics     |
| Compatibility core | Preserved compatibility/core repository checks | Required compatibility expectations and legacy-safe repository invariants | Skill inventory or forbidden phrase policy | It protects compatibility assumptions that are separate from skill text synchronization |

## Skills CLI Sync

`scripts/validators/skills-cli-sync.js` prevents skill documentation from regressing to legacy gate commands or direct
state-edit instructions. Skills may reference compatibility skill names and templates, but their primary route must use
CLI transition commands such as `pbe execution start`, `pbe review submit`, `pbe accept`, and the Change/Impact/Revision
commands.

## Stage-Aware Traceability

`pbe trace check` can run as a general diagnostic, or with a stage mode:

```bash
pbe trace check --stage wpd
pbe trace check --stage vd
pbe trace check --stage execution
pbe trace check --stage review
pbe trace check --stage accept
```

The stage mode decides how much closure is required:

- `wpd`: selected/foundation Product nodes must derive to Work nodes; deferred/out-of-scope Product scope must not leak
  into Work. Test and Evidence artifacts are not required yet.
- `vd`: WPD closure must hold, selected/foundation Work nodes and required acceptance criteria must be covered by Test
  nodes, and Test nodes must declare required evidence. Evidence files are not required yet.
- `execution`: VD closure must hold and required Test nodes must have linked Evidence nodes. Evidence file existence
  remains the responsibility of the Evidence validator.
- `review`: Product -> Work -> Test -> Evidence closure must hold before submitting for review. Acceptance is not
  required at review submit.
- `accept`: Product -> Work -> Test -> Evidence -> user Acceptance closure must hold. Accepted/done closure requires
  user acceptance metadata.

## Evidence Freshness

Traceability validation checks whether Product, Work, Test, Evidence, and Acceptance nodes are connected. Evidence
validation checks whether linked Evidence is usable as current proof.

Evidence timestamp fields are read in this order:

- `updatedAt`
- `createdAt`
- `recordedAt`
- `timestamp`
- `verifiedAt`

Linked Product, Work, and Test node timestamp fields are read in this order:

- `updatedAt`
- `modifiedAt`
- `lastChangedAt`
- `createdAt`

If Evidence is older than a linked Product, Work, or Test node, it is stale and cannot close review or acceptance.
Evidence with `status` of `stale`, `stale_evidence`, `superseded`, `invalidated`, `obsolete`, or `rejected` is not
current proof. Evidence with `supersededByEvidenceId` is also treated as superseded.

Stage policy:

- `execution`: requires linked Evidence and file existence; missing Evidence timestamp is a warning for compatibility.
- `review`: requires current Evidence. Missing timestamp, stale Evidence, superseded Evidence, and invalidated Evidence
  are errors.
- `accept`: applies review strictness and also checks Evidence referenced by accepted Acceptance branches.

Command wiring:

- `pbe execution complete` calls Evidence validation with `stage: "execution"` and `requireVisualAudit: false`.
- `pbe review submit` calls Evidence validation with `stage: "review"`.
- `pbe accept` calls Evidence validation with `stage: "accept"`.

To replace old Evidence, add a new current Evidence node, link it to the required Test and Acceptance closure, and mark
the old node with `supersededByEvidenceId` or `status: "superseded"`.

## RPD Transition Guard

`scripts/validators/rpd-transition.js` prevents downstream execution, review, or deliverable-producing work while RPD is
incomplete.

It fails when:

- any requirement Root or leaf remains `pending_interview`, `interviewing`, `ready_to_confirm`, `ready_to_decompose`, or
  `blocked`
- Product Tree root remains `draft`, `proposed`, `needs_human_decision`, or another non-terminal planning state
- an open `gate` or `blocking` decision remains in `decision-queue.json`
- `pbe-state.deliveryStatus` is `implemented`, `verified`, `submitted_for_review`, `revision_verified`, or `accepted`
  before RPD completion

Use `draft_created_from_assumptions` or `waiting_root_confirmation` when an assumption-based draft exists but Root
confirmation is still pending.
