# Final Coverage Check

## Active Cycle Coverage

- Active cycle:
- Included Product nodes:
- Included Project nodes:
- Included Work nodes:
- Included Test nodes:
- Explicitly excluded nodes:
- Cycle contract checked:
- Node Execution Contracts checked:

## Tree Closure Coverage

- Product nodes covered:
- Project boundaries covered:
- Work nodes implemented:
- Test nodes passed/manual/not-runnable:
- Evidence nodes attached:
- Acceptance branches submitted for review:
- Partial satisfaction:
- Missing tree links:

## Selected Scope Coverage

- Selected requirements:
- Implemented:
- Verified:
- Evidence captured:
- Missing:
- Blocking issues:

## Foundation Coverage

- Required foundation items:
- Implemented:
- Verified:
- Evidence captured:
- Missing:
- Risk if skipped:

## Deferred Scope

- Deferred requirements:
- Deferral reasons recorded:
- Future verification notes recorded:
- Protected from current ACEP implementation:
- Missing deferral documentation:

## Out-Of-Scope Protection

- Out-of-scope items:
- Forbidden files or behaviors recorded:
- Unexpected changes found:

## Blocked Scope

- Blocked requirements:
- Blocking reason:
- Human decision needed:
- Downstream steps affected:

## Task Coverage

- Total tasks:
- Selected tasks completed:
- Foundation tasks completed:
- Integration tasks completed:
- Skipped:
- Blocked:

## Verification Coverage

- Total verification items:
- Passed:
- Failed:
- Not run:
- Not runnable:
- Missing evidence:

## Evidence Tree Coverage

- Evidence attached:
- Evidence replaced:
- Evidence required but missing:
- Stale evidence:
- Not available evidence:
- Evidence nodes proving included Test nodes:
- Evidence nodes proving accepted Product branches:

## Change / Impact / Reopen Coverage

- Open Change nodes:
- Approved Change nodes:
- Impact entries:
- Reopened nodes:
- Invalidated nodes:
- Nodes requiring retest:
- Nodes requiring new evidence:
- Human decisions pending:

## UI/UX Coverage

- Selected screens required:
- Selected screens implemented:
- Foundation UI contracts:
- Deferred UI flows protected:
- States required:
- States covered:
- Missing states:
- Screenshot/evidence provided:
- Manual verification notes:

## Parallel And Integration Coverage

- Parallel groups:
- Integration tasks:
- Integration evidence captured:
- Integration pass completed:
- Conflict issues:
- Downgraded to sequential:

## Traceability Issues

- Product nodes without Work/Test/Evidence:
- Work nodes without Test/Evidence:
- Test nodes without Evidence:
- Accepted branches with stale/reopened impact:
- Selected requirements without tasks:
- Foundation items without tasks:
- Tasks without verification:
- Verification without evidence:
- Deferred items without reason:
- UI screens without evidence:

## Final Decision

The current slice can be submitted for review only if:

- no selected-scope coverage issue remains
- no required foundation issue remains
- no required validation is failing
- every included Work node has included Test coverage
- every included Test node has current Evidence Tree evidence or an explicit not-runnable explanation
- no required UI/UX state is missing without explanation
- no stale, invalidated, or reopened item is being treated as accepted
- every parallel group has integration evidence and integration pass
- deferred and out-of-scope items were not implemented accidentally
- no stop condition remains unresolved

Whole-project completion requires explicit user approval at the next-slice decision gate.
