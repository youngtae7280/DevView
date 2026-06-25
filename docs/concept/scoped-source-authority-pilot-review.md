# Scoped Source-Authority Pilot Review

Status: scoped-source-authority-pilot-review / scoped-pilot-review-pass-with-retained-warnings / source-authority-contained

## Document Purpose

This review observes whether the already recorded Todo Search scoped source-authority pilot remains safe as a bounded
judgment surface.

This is review-only. It does not expand pilot scope, approve full Graph-source promotion, retire tree-native artifacts,
introduce validator/CI enforcement, clean up public docs, or replace user acceptance authority.

## Review Basis

| Item                    | Reviewed artifact                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Pilot execution record  | `docs/concept/scoped-source-authority-pilot-execution-record.md`                                       |
| Pilot marker            | `examples/adoption/todo-search-slice/generated/scoped-source-authority-pilot-marker.json`              |
| Generated read model    | `examples/adoption/todo-search-slice/generated/generated-read-model.json`                              |
| Evidence manifest       | `examples/adoption/todo-search-slice/generated/read-model-evidence-manifest.json`                      |
| Parity report           | `examples/adoption/todo-search-slice/generated/read-model-parity-report.json`                          |
| Warning resolution      | `examples/adoption/todo-search-slice/generated/parity-warning-resolution.md`                           |
| Tree-native fallback    | Product, Project, Work, Test, Evidence, Acceptance, Change, and Impact artifacts under the pilot slice |
| Manual parity reference | `examples/adoption/todo-search-slice/maintainability-graph-read-model.json`                            |
| View manifest reference | `examples/adoption/todo-search-slice/view-instance-manifest.json`                                      |
| Compatibility warning   | `examples/adoption/compatibility-mismatch-slice`                                                       |

## Review Outcome

```text
scoped-pilot-review-pass-with-retained-warnings
```

The scoped pilot is safe to keep active for the Todo Search selected slice because the generated authority boundary
remains bounded, generated/manual parity remains `comparison-pass`, tree-native fallback/reference artifacts remain
preserved, and retained warnings remain visible.

This review does not make the pilot suitable for broader execution or full promotion. Broader use still needs a separate
decision surface, and likely stronger validator/CI-backed Evidence before enforcement or repository-wide authority
changes.

## Required Review Questions

| Question                                                                           | Answer                                                                                                                                             |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Did generated read-model authority stay bounded to Todo Search selected slice?     | Yes. The pilot marker and execution record limit authority to `examples/adoption/todo-search-slice`; the compatibility slice remains warning-only. |
| Did generated/manual parity remain `comparison-pass`?                              | Yes. The regenerated parity report remains `comparison-pass` with zero mismatches, zero blocking issues, and zero decision-required issues.        |
| Did fallback/reference tree-native artifacts remain preserved and usable?          | Yes. The Product, Project, Work, Test, Evidence, Acceptance, Change, and Impact artifacts remain present and are not retired or superseded.        |
| Did retained warnings remain visible?                                              | Yes. Bounded fixture scope, partial UI evidence, validator/CI absence, and ACEP public-doc cleanup deferment remain carried forward.               |
| Did user acceptance authority remain user-controlled?                              | Yes. Demo-support Acceptance remains a user approval record and is not replaced by generated graph authority or Codex/PBE judgment.                |
| Did the supplemental compatibility mismatch slice remain warning-only?             | Yes. It remains supplemental compatibility Evidence and is not included in the pilot source scope.                                                 |
| Is validator/CI-backed Evidence required before broader use?                       | Yes for broader execution, enforcement, or full promotion planning. It is not required to keep this bounded pilot active.                          |
| Is public-doc cleanup required before broader promotion, or still safely deferred? | It is safely deferred for the current scoped pilot, but broader promotion should revisit whether cleanup becomes a blocker.                        |
| Is the scoped pilot safe to keep active?                                           | Yes, with retained warnings and fallback ready.                                                                                                    |

## Observation Summary

### Authority Boundary

The active pilot authority is limited to Graph-first Node/Edge/Tag interpretation and 7 Core View traversal for the Todo
Search selected slice. It does not make Maintainability Graph the repository-wide source model.

### Parity Stability

The generated/manual parity report remains stable after regeneration:

| Metric                     | Result            |
| -------------------------- | ----------------- |
| Final parity status        | `comparison-pass` |
| Mismatch count             | 0                 |
| Blocking count             | 0                 |
| Decision-required count    | 0                 |
| Generated/manual auto-fix? | No                |

### Fallback Readiness

Tree-native selected-slice artifacts remain the fallback/reference set. No retirement, deletion, or superseded marking is
performed by this review.

Fallback remains required if parity changes to warning/blocking/decision-required, retained warnings disappear, source
authority boundary text widens, Check/Evidence separation becomes ambiguous, or user acceptance authority appears
replaced by Codex/PBE.

### Retained Warnings

| Warning                                      | Review treatment                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| Bounded fixture Evidence                     | Retained. Acceptable for this scoped pilot; not full Todo app implementation.    |
| Partial UI screenshot/manual visual Evidence | Retained. Acceptable for this scoped pilot; still not full visual proof.         |
| Validator/CI-backed Evidence missing         | Retained. Required before broader enforcement or stronger repeatability claims.  |
| ACEP task-card public-doc cleanup deferred   | Retained. Deferred for current pilot; revisit before broader promotion planning. |

## Control Node Observation

| Control record                     | Family                       | Review status               | Notes                                                         |
| ---------------------------------- | ---------------------------- | --------------------------- | ------------------------------------------------------------- |
| Scoped pilot review                | Decision Control Node        | resolved for observation    | User approved observe/run scoped pilot review.                |
| Generated parity stability         | Evidence Control Node        | pass                        | `comparison-pass`; no blocking or decision-required mismatch. |
| Validator/CI-backed repeatability  | Evidence Control Node        | open / future strengthening | Not introduced by this review.                                |
| ACEP public-doc cleanup            | Compatibility Control Node   | deferred / active warning   | Cleanup remains outside this task.                            |
| Broader source authority expansion | Impact / Change Control Node | not started                 | Full promotion and broader pilot expansion remain unapproved. |
| Demo-support Acceptance            | Acceptance Control Node      | preserved with warnings     | User acceptance remains user-controlled.                      |

## Next Decision Surface

After this review, the user should choose among:

1. `Keep scoped pilot active and observe longer`
2. `Require validator/CI-backed Evidence before broader execution or enforcement`
3. `Perform public-doc cleanup`
4. `Prepare broader Graph-source promotion review`
5. `Rollback or defer scoped pilot`

Recommended next step: keep the scoped pilot active and observe longer. If the user wants to move beyond this bounded
pilot, validator/CI-backed Evidence should be considered before broader execution or enforcement.

## Gate Self-Check

| Gate                                     | Result | Notes                                                      |
| ---------------------------------------- | ------ | ---------------------------------------------------------- |
| Scoped Review Boundary Gate              | Pass   | Review-only; no pilot expansion.                           |
| Source Authority Containment Gate        | Pass   | Authority remains bounded to Todo Search selected slice.   |
| Parity Stability Gate                    | Pass   | Parity remains `comparison-pass`.                          |
| Fallback Readiness Gate                  | Pass   | Tree-native fallback/reference artifacts remain preserved. |
| Retained Warning Visibility Gate         | Pass   | All retained warnings remain explicit.                     |
| User Acceptance Authority Gate           | Pass   | User acceptance remains user-controlled.                   |
| Supplemental Compatibility Boundary Gate | Pass   | Compatibility mismatch slice remains warning-only.         |
| Validator/CI Boundary Gate               | Pass   | No validator/CI enforcement introduced.                    |
| Public-Doc Cleanup Boundary Gate         | Pass   | No public-doc cleanup performed.                           |
| Non-Full-Promotion Gate                  | Pass   | Full Graph-source promotion remains unapproved.            |

## Final Non-Promotion Statement

This review keeps the Todo Search scoped pilot observable and bounded. It does not approve full Graph-source promotion,
does not expand source authority, does not retire tree-native artifacts, does not introduce validator/CI enforcement,
does not clean up public docs, and does not authorize Codex/PBE to replace user acceptance authority.
