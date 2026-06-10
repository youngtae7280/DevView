# Traceability Rules

Duplication across PBE documents is allowed when it preserves traceability.

## ID Rules

- Every requirement has a `requirementId`.
- Every WorkGraph node has `relatedRequirementNodeIds`.
- Every VD item has `verifiesRequirementIds`.
- Every task card has `workGraphNodeIds` and `requirementIds`.
- Every coverage item has `requirementId`, `taskId`, `verificationId`, and `evidenceId` when applicable.
- Every review result reports completion by `requirementIds`.

## Responsibility

Trace IDs connect artifacts. They do not transfer ownership. For example, VD may
reference a requirement ID, but it does not own the requirement meaning.

