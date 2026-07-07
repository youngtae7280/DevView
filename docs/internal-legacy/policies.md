# PBE Policies

## Purpose

This document is a compact policy index for PBE operators and agents.

It summarizes the most frequently needed policy decisions without requiring agents to read every long-form policy
document.

## Status

This is a consolidation draft.

The original policy documents remain authoritative until links and references are migrated in a later step. If this
summary and an original document disagree, the original document wins.

## Policy Index

- [Adaptive Workflow Depth Policy](lite-mode-policy.md)
- [Workload Cap and Artifact Minimalism](workload-cap-and-artifact-minimalism.md)
- [Complexity Governance](complexity-governance.md)
- [Parallel Safety](parallel-safety.md)
- [Migration Policy](migration-policy.md)
- [Review Failure Recovery](review-failure-recovery.md)

## Adaptive Workflow Depth

PBE has one public workflow. The stored `full`, `lite`, and `bypass` profile values are compatibility metadata and depth
hints, not separate product modes.

Use compact depth when the request is small, the expected files are easy to name, and the work can still preserve
traceability from request to acceptance.

Core rules:

- Compact depth is workload-limited, not safety-bypassed.
- Keep user-only acceptance, File Change Guard, review, and evidence.
- Prefer 1 to 3 expected files.
- Avoid repo-wide analysis, long reports, process docs, `AGENTS.md` changes, and CI/package/schema/template changes
  unless explicitly approved.
- Increase to full planning depth when product meaning, high-risk evidence, repeated rejection, UI/UX taste work, or
  broad file changes appear.

Read the original when choosing or defending the depth boundary:

- [Adaptive Workflow Depth Policy](lite-mode-policy.md)

## Compact Fast Path and Compact Reporting

The compact fast path is not a shortcut around PBE controls. It preserves traceability while reducing explanation
length, context loading, reporting volume, and validation scope.

Compact work must still preserve:

- task intent
- expectedFiles
- minimal AC
- evidence
- review result
- user acceptance
- change/impact/revision when needed

For compact work, prefer:

- `pbe context pack` before opening long-form docs
- target/stage checks over full validation by default
- compact evidence summaries
- final reports around 10 to 15 lines when possible
- no long RPD/WPD/VD explanation unless the task requires it

Escalate or expand reporting when:

- product meaning changes
- selected files exceed the compact cap
- evidence is high-risk or manual-only
- repeated rejection occurs
- release/checkpoint validation is requested
- CI/package/schema/template/auth/security/data migration areas are touched

Compact does not mean incomplete. Reduce explanation length, not traceability.

## Human Gate Clarity Scoring

Human Gate decisions should not rely on vague intuition. PBE should classify ambiguity using a compact clarity
assessment before allowing AI assumptions to become product, implementation, verification, scope, product-patch, or
acceptance decisions.

Use the following fields when a node, transition, or execution plan may be ambiguous:

- `clarityScore`: `0.0` to `1.0`
- `ambiguityLevel`: `low`, `medium`, `high`, or `very_high`
- `hardTriggers`: risk conditions that require a Human Gate regardless of score
- `requiresHumanGate`: boolean
- `reasons`: short explanation
- `recommendedQuestion`: concise question for the user

Suggested interpretation:

| clarityScore | ambiguityLevel | Default action                                         |
| -----------: | -------------- | ------------------------------------------------------ |
|  0.80 - 1.00 | low            | Proceed unless hard trigger exists                     |
|  0.60 - 0.79 | medium         | Proceed with recorded assumption or ask if user-facing |
|  0.40 - 0.59 | high           | Human Gate recommended                                 |
|  0.00 - 0.39 | very_high      | Human Gate required                                    |

Score dimensions:

| Dimension                  | 0                         | 1                  | 2                             |
| -------------------------- | ------------------------- | ------------------ | ----------------------------- |
| Intent clarity             | unclear outcome           | partial outcome    | clear user-visible outcome    |
| Scope clarity              | broad/unknown scope       | partial boundary   | clear boundary/expectedFiles  |
| AC testability             | not testable              | partially testable | directly testable             |
| Implementation specificity | many unchosen options     | default assumption | specified or existing pattern |
| Evidence fit               | unknown evidence          | partial evidence   | evidence type is clear        |
| Risk/reversibility         | high risk/hard to reverse | moderate           | low risk/easy to reverse      |

```text
clarityScore = earnedPoints / 12
```

Hard triggers require a Human Gate regardless of clarity score:

- product meaning change
- user-facing UI/UX choice not specified by the user
- implementation alternatives materially affect user experience
- expectedFiles exceed the compact cap
- AGENTS.md, CI, package, schema, template, auth, security, permission, payment, data migration, or destructive changes
- manual-only or subjective evidence
- weak evidence for a high-risk AC
- repeated rejection or review failure
- product patch proposal
- final acceptance

Human Gate rule:

```text
if hardTriggers is not empty:
  requiresHumanGate = true
else if clarityScore < 0.60:
  requiresHumanGate = true
else:
  requiresHumanGate = false
```

Compact does not mean opaque. If PBE proceeds without a Human Gate, record the assumption and rationale.

Use `pbe gate assess` for a read-only CLI assessment of clarity score, hard triggers, and the recommended Human Gate
question. The command is advisory; it does not change state or replace user confirmation.

Example:

```text
Product Node:
- Choices should be displayed.

Clarity:
- intent: 2
- scope: 1
- testability: 1
- implementationSpecificity: 0
- evidenceFit: 1
- riskReversibility: 1
- clarityScore: 0.50
- hardTriggers: [user-facing-ui-choice]
- requiresHumanGate: true

Question:
- "Selection UI is unspecified. Should it be button list, Combobox, or card list?"
```

## Workload Cap and Artifact Minimalism

PBE should control work, not generate process material for its own sake.

Core rules:

- PBE tracks decisions and evidence, not every explanation.
- Small work should leave small artifacts.
- Do not create process documents, workflow reports, or long reports by default.
- `start` means identify the next task or slice, not repo-wide PBE adoption.
- Create new docs only when the user asks, the selected scope includes documentation, long-lived reference material is
  needed, or evidence requires a document artifact.

Read the original when deciding whether analysis, reporting, validation, or new documentation is proportional:

- [Workload Cap and Artifact Minimalism](workload-cap-and-artifact-minimalism.md)

## Complexity Governance

PBE should add structure only when it reduces real risk.

Core rules:

- Add complexity only when it reduces real risk.
- Prefer the smallest mechanism that preserves traceability.
- New validators, schemas, commands, states, trees, or policies should justify their cost.
- Avoid adding process just because a process gap is theoretically possible.
- Prefer policy, skill guidance, and templates before validator errors or new commands.

Default promotion path:

```text
docs / skill note
template checklist
dogfooding evidence
validator warning
validator error
CLI command or Tree only if lifecycle/action boundaries justify it
```

Read the original before adding or promoting new PBE control surfaces:

- [Complexity Governance](complexity-governance.md)

## Parallel Safety

Parallel work is opt-in and must be proven safe.

Core rules:

- Default to sequential execution.
- Parallel work is allowed only when files, artifacts, generated resources, state transitions, tests, evidence, and
  review order do not conflict.
- Sequential execution is required when tasks share `.pbe` state, generated artifacts, validation outputs, external
  resources, or the same target files.
- State transition commands must run one at a time.
- Windows validation should be careful with clean/build races, especially commands that touch `dist`, `clean-dist`,
  cache, temp, or coverage output.

Read the original before approving parallel groups, parallel validations, or multi-agent execution:

- [Parallel Safety](parallel-safety.md)

## Migration and Compatibility

PBE should evolve without breaking existing projects.

Core rules:

- Existing projects should not be broken by new PBE controls.
- New artifacts should be additive when possible.
- Missing optional artifacts should usually pass unless the project has opted into that artifact.
- If an optional artifact exists, it must satisfy its schema and validator.
- Compatibility migrations should be explicit, incremental, and reversible where possible.
- Existing user acceptance records and Product Tree meaning must not be silently rewritten.

Read the original before changing artifact shape, schemas, templates, validators, or init behavior:

- [Migration Policy](migration-policy.md)

## Review Failure Recovery

Review failure should produce diagnosis before another implementation attempt.

Core rules:

- Review failure should produce diagnosis, not blind retries.
- Classify failure cause before revision.
- Repeated rejection should trigger escalation or clarification.
- Product meaning mismatch should go through Change, Impact, Product Patch, and user confirmation.
- Revision should preserve traceability to the failed acceptance criteria, test, and evidence.
- UI/UX or taste mismatch should capture reference or anti-reference before another revision.

Read the original when rejection repeats, user meaning appears mismatched, or revision scope is unclear:

- [Review Failure Recovery](review-failure-recovery.md)

## When to Read the Original Documents

Read this compact policies document first.

Read original policy documents only when:

- the compact summary is insufficient
- the task touches that risk area directly
- a validator or test refers to the original document
- a skill or agent-context card links directly to the original document
- a user asks for detailed policy rationale
- a policy decision could affect product meaning, acceptance, evidence, migration, or user trust

## Consolidation Notes

This document is intentionally compact.

It should not duplicate the full original documents.

If this summary and an original document disagree, the original document wins until migration is completed.

This draft intentionally does not consolidate these documents yet:

- [Evidence Quality Rubric](evidence-quality-rubric.md)
- [VD Quality Rubric](vd-quality-rubric.md)
- [Ambiguity Taxonomy](ambiguity-taxonomy.md)
- [RPD Interview Mode](rpd-interview-mode.md)
- [Product Patch Proposals](product-patch-proposals.md)

Those documents are referenced directly by agent-context cards or skills and need a separate link migration step.

## Recommended Next Steps

1. Review this draft against the original six policy documents.
2. Add wrapper links from existing policy docs only after approval.
3. Update `docs/index.md` only in a later link-migration step.
4. Update `agent-context` and skill references only after this draft becomes authoritative.
5. Keep original documents in place until link migration and validation are complete.
