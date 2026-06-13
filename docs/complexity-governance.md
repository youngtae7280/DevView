# PBE Complexity Governance

## Purpose

This document defines how PBE controls complexity as it grows.

PBE should not add a new Tree, State, Command, or Validator just because a new problem appears. New control surfaces
must earn their place through policy, dogfooding, repeated observation, and deterministic enforcement.

Core posture:

- Policy first, artifact later.
- Rubric first, validator later.
- Dogfooding before enforcement.

## Current Core Structure

These core artifacts remain the primary structure:

- Product Tree: what to build.
- Work Tree: what work scope is selected.
- Test Tree: how the work is verified.
- Evidence Tree: what proves the result.
- Acceptance Tree: who approved the result.
- Change Tree: what changed after feedback or discovery.
- Impact Tree: where the change has impact.
- Product Patch Tree: before/after proposal for Product Tree meaning changes.
- `pbe-state`: current workflow state and transition history.

## Core Design Principle

Default evolution order:

1. Document the policy.
2. Add or update skill guidance.
3. Add a checklist/template.
4. Observe repeated failures through dogfooding.
5. Promote deterministic failures to validator warnings.
6. Promote high-risk deterministic failures to validator errors.
7. Add a command only for repeated deterministic artifact actions.
8. Add a new Tree only when the concept has an independent lifecycle.

## Default Promotion Path

New ideas should usually move through this path:

```text
docs / skill note
template checklist
dogfooding evidence
validator warning
validator error
CLI command or Tree only if lifecycle/action boundaries justify it
```

Do not skip from a new concern directly to state machine, command, schema, or validator enforcement unless the failure
is already deterministic, repeated, and high-risk.

## What To Keep As Core

Keep the current core as the preferred modeling surface:

- Product meaning belongs in Product Tree.
- Work boundaries belong in Work Tree.
- Verification coverage belongs in Test Tree.
- Proof belongs in Evidence Tree.
- User approval belongs in Acceptance Tree.
- Feedback belongs in Change Tree.
- Retest and rework blast radius belongs in Impact Tree.
- Product meaning edits after feedback belong in Product Patch Tree.
- Workflow gate state belongs in `pbe-state`.

Prefer optional fields on these artifacts before inventing a new artifact family.

## What Not To Add Yet

Do not add these yet. Promote only after dogfooding shows repeated deterministic failure:

- `alignment-failure-tree.json`
- `review-diagnostic-tree.json`
- `override-constraint-tree.json`
- `visual-alignment-tree.json`
- new realignment states
- `pbe review diagnose`
- `pbe realign start`
- `pbe realign complete`
- `pbe work parallel-check`
- `pbe rpd draft`
- `pbe rpd interview`
- hard validator failures for vague natural-language quality checks

These may become useful later, but their first safe form is policy, skill guidance, rubric, checklist, or dogfooding
example.

## Future Quality Hardening Candidates

These are candidates, not tasks for immediate validator or command promotion.

### VD Quality Rubric

- Why it matters: visual and UX quality failures are easy to under-specify.
- First safe form: docs / skill / template.
- Do not promote to validator or command yet.

### Ambiguity Taxonomy

- Why it matters: vague language can leak into executable scope.
- First safe form: docs / skill / template.
- Do not promote to validator or command yet.

### Parallel Safety Policy

- Why it matters: unsafe parallel work can collide on files or integration boundaries.
- First safe form: docs / skill / template.
- Do not promote to validator or command yet.

### Review Failure Recovery

- Why it matters: rejected or unclear reviews need repeatable routing.
- First safe form: docs / skill / template.
- Do not promote to validator or command yet.

### Evidence Quality Rubric

- Why it matters: weak evidence can make acceptance unreliable.
- First safe form: docs / skill / template.
- Do not promote to validator or command yet.

### Migration / Compatibility Policy

- Why it matters: v1/v2 compatibility text can confuse primary workflow guidance.
- First safe form: docs / skill / template.
- Do not promote to validator or command yet.

### Beta Readiness / Known Limits

- Why it matters: users need to know what is stable and what remains experimental.
- First safe form: docs / skill / template.
- Do not promote to validator or command yet.

## Tree Governance Rules

Consider a new Tree only when at least three of these are true:

- It has an independent lifecycle.
- It needs an independent validator.
- It is referenced by multiple parents.
- It must be tracked long-term.
- Putting it in an existing Tree would blur responsibilities.
- It needs an independent CLI command.
- It has a user confirmation or state transition boundary.

Do not add a new Tree when:

- It is a note, diagnostic, or guide.
- It attaches only to one Change or Impact.
- The validator would not be deterministic.
- A document, skill, or template is enough.
- An optional field on an existing node is enough.

## State Governance Rules

Add a new State only when:

- There is a clear gate where the user must stop.
- The next allowed command changes.
- Reusing an existing state would allow a dangerous transition.
- Validators or CI must behave differently based on the state.

Do not add a new State when:

- It is only progress metadata.
- Skill guidance is enough.
- Change/Impact metadata is enough.
- It is a one-off exception.

## Command Governance Rules

Add a CLI command only when:

- It is a clear action that people repeat.
- It deterministically reads and/or writes artifacts.
- It can provide issue codes, `suggestedFix`, and `nextCommand` on failure.
- It performs real artifact or state transition work, not just documentation guidance.

Do not add a command when:

- Natural-language judgment is the core behavior.
- A Codex prompt or skill instruction is enough.
- It only writes docs/templates.
- An option on an existing command is enough.

## Validator Governance Rules

Add a validator only when:

- The mistake has high cost.
- Dogfooding shows it repeats.
- The check is deterministic.
- False positives are low.
- Failure can include a clear `suggestedFix` and `nextCommand`.

Validator promotion stages:

1. docs/skill warning
2. template checklist
3. validator warning
4. validator error
5. state transition blocker

Natural-language quality judgment should not become an immediate hard failure. Keep it as a rubric/checklist first, then
promote only when repeated failures can be detected deterministically.

## Documentation Governance Rules

Add a document when:

- A new concept needs explanation.
- Adding it to an existing document would make that document too long.
- It describes a workflow users can follow.
- It can be classified as troubleshooting, reference, concept, or example.

Documentation simplification rules:

- Keep README as entry points only.
- Move deep explanation into docs.
- Consolidate duplicate content into one canonical document.
- Connect related documents with See also links.

## Example Governance Rules

Add an example when:

- It demonstrates a real workflow.
- Existing examples cannot explain it.
- It does not break validation or test behavior.
- It has a purpose distinct from `examples/valid` and `examples/invalid`.

Example simplification rules:

- If two or more examples show the same workflow, mark them as consolidation candidates.
- Old dogfooding runs can become archive candidates.
- README should link representative examples only.

## Removal / Simplification Governance

An item becomes a simplification candidate when:

- It is not part of the primary workflow.
- There is a clearer replacement.
- Current docs, examples, or CI no longer rely on it as core.
- It confuses users.
- It has been marked compatibility/deprecated for at least one beta cycle.

Before removal:

1. Search all references.
2. Update README and docs links.
3. Check examples, tests, and CI dependencies.
4. Leave a migration note for user-facing items.
5. Use a deprecation period instead of immediate deletion.

## Simplification Audit Candidates

These are future audit candidates, not deletion instructions:

- legacy gate wording
- old autoflow wording
- old review-result gate template references
- v1 layout compatibility explanations
- README link overload
- documentation duplication
- example overload
- overlapping skills
- `pbe-autoflow`
- `pbe-create-revision-pack`
- `pbe gate` command
- duplicate validators

## Simplification Audit Checklist

- [ ] README links are not overloaded.
- [ ] Each document has a single clear owner topic.
- [ ] No deprecated command is presented as the primary path.
- [ ] Each validator has a distinct responsibility.
- [ ] Examples are grouped by purpose.
- [ ] No new Tree was added without lifecycle justification.
- [ ] No new State was added without transition justification.
- [ ] No new Command was added without deterministic artifact behavior.
- [ ] No natural-language quality judgment was promoted directly to hard validator failure.
- [ ] Compatibility layers are marked when they are not the primary path.
