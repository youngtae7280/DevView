# Traceability Rules

Duplication across PBE documents is allowed when it preserves traceability.

## ID Rules

- Every requirement has a `requirementId`.
- Every WorkGraph node has `relatedRequirementNodeIds`.
- Every VD item has `verifiesRequirementIds`.
- Every task-card view that appears in an ACEP pack carries `workGraphNodeIds` and `requirementIds` as projections of
  WorkGraph and execution-contract obligations.
- Every coverage item has `requirementId`, `taskId`, `verificationId`, and `evidenceId` when applicable.
- Every review result reports completion by `requirementIds`.

## Responsibility

Trace IDs connect artifacts. They do not transfer ownership. For example, VD may reference a requirement ID, but it does
not own the requirement meaning. Likewise, task-card views carry traceability for execution, but they do not own
Product, Work, Test, Evidence, or Acceptance authority.
