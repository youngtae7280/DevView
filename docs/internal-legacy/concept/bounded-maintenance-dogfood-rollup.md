# Bounded Maintenance Dogfood Rollup

Status: completed / non-enforcing / report-only

## Completed Dogfoods

| #   | Scenario                         | Scope                         | Change type                 | Result                                                                 |
| --- | -------------------------------- | ----------------------------- | --------------------------- | ---------------------------------------------------------------------- |
| 1   | Retrofit compatibility cleanup   | `retrofit-maintenance-legacy` | report-only decision record | Prevented deleting compatibility export without retirement approval.   |
| 2   | Retrofit claim wording           | `retrofit-maintenance-legacy` | fixture claim + projection  | Added replacement-evidence boundary to the short edgeIntent claim.     |
| 3   | Todo Search documentation        | `adoption/todo-search-slice`  | README consistency fix      | Clarified where current limited Graph-source status is represented.    |
| 4   | Native clear-search wording      | `native-maintenance-legacy`   | fixture claim + projection  | Clarified that full-list restoration happens after the query clears.   |
| 5   | Retrofit fallback anchor wording | `retrofit-maintenance-legacy` | fixture anchor + projection | Aligned fallback anchor with rollback/audit/replacement-evidence need. |

## Native And Retrofit Coverage

Native coverage:

- preserved user-confirmed UX acceptance intent;
- kept the clear-search behavior tied to acceptance and runtime-validation anchors;
- changed wording without changing behavior or acceptance authority.

Retrofit coverage:

- preserved history-derived compatibility-retention intent;
- kept rollback/fallback/audit review visible before cleanup;
- clarified that replacement evidence and explicit retirement approval are required before deleting compatibility
  artifacts.

Todo Search coverage:

- clarified that demo-support artifacts are not themselves the Graph-source promotion action;
- preserved `graph-source.json` and generated read-model Evidence as the current limited Graph-source status surfaces;
- kept read-model validation, health, and E2E smoke as non-enforcing Evidence.

## What Was Prevented Or Clarified

These dogfoods showed Graph-source PBE stopping three common maintenance mistakes:

- treating projection parity as permission to delete fallback or compatibility artifacts;
- weakening a user-confirmed behavior claim during wording cleanup;
- reading stale demo-support wording as overriding current Graph-source status.

The useful control signal was not a larger code change. It was that source fixtures, generated projections, reports,
health, and E2E smoke stayed aligned while small maintenance wording changed.

## Validation Summary

Final validation chain:

- `npm run build:cli`
- `graph read-model project-intent` for native and retrofit fixtures
- `graph read-model report-intent --json`
- `graph read-model report-health --json`
- `graph read-model validate --all --json`
- `npm run test:read-model:e2e`
- `npx vitest run cli/src/__tests__/intent-critical-examples.test.ts`
- `npx prettier --write ...`
- `npm run validate:pbe`
- `npm run validate:pbe:v2`
- `git diff --check`

Expected healthy state:

- `report-intent`: `intent-report-pass`
- `report-health`: `graph-source-health-pass`
- `validate --all`: `aggregate-pass`
- `test:read-model:e2e`: `e2e-smoke-pass`
- focused intent-critical tests: pass
- enforcement status: non-enforcing
- tree-native retirement: not approved / not in scope

## Remaining Policy Decisions

The dogfoods do not decide:

- required checks or branch protection;
- CI enforcement;
- repo-wide Graph-source promotion;
- tree-native retirement;
- compatibility artifact deletion;
- Todo App promotion beyond confirmed structure-only status.

Those remain explicit user/policy decisions, not dogfood side effects.
