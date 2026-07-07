# Change Impact Revision CLI Skeleton

PBE does not let Codex silently edit completed or accepted work after user feedback. Feedback first becomes a Change
node, then an Impact node lists the affected Product, Work, Test, Evidence, and Acceptance nodes.

## Commands

```bash
pbe change create --summary "Collapse state must keep expand button visible"
pbe impact analyze --change CH-001 --product PT-1 --work WT-2 --test TT-3 --evidence EV-4
pbe revision start --change CH-001
pbe revision complete --change CH-001
```

## Change Node

`pbe change create` appends a proposed Change node to `.pbe/control/change-tree.json`.

Minimum fields:

```json
{
  "id": "CH-001",
  "type": "feedback",
  "source": "user_feedback",
  "summary": "Collapse state must keep expand button visible",
  "status": "proposed",
  "createdAt": "2026-06-12T00:00:00.000Z",
  "affectedProductNodeIds": [],
  "affectedWorkNodeIds": [],
  "affectedTestNodeIds": [],
  "affectedEvidenceNodeIds": [],
  "affectedAcceptanceNodeIds": []
}
```

## Impact Node

`pbe impact analyze` creates an Impact node in `.pbe/control/impact-tree.json` and marks the Change node as
`impact_analyzed`.

The skeleton does not infer meaning. Affected node ids must come from explicit command options or already be present on
the Change node.

Minimum fields:

```json
{
  "id": "IM-001",
  "changeNodeId": "CH-001",
  "changeId": "CH-001",
  "status": "analyzed",
  "affectedProductNodeIds": ["PT-1"],
  "affectedWorkNodeIds": ["WT-2"],
  "affectedTestNodeIds": ["TT-3"],
  "affectedEvidenceNodeIds": ["EV-4"],
  "affectedAcceptanceNodeIds": [],
  "createdAt": "2026-06-12T00:00:00.000Z"
}
```

## Revision Gate

`pbe revision start` requires an Impact node with at least one affected id. It transitions eligible review or accepted
states into `REVISION_REQUESTED`.

On success, PBE records the active revision context in `.pbe/blueprint/pbe-state.json`:

```json
{
  "activeRevision": {
    "changeNodeId": "CH-001",
    "impactNodeIds": ["IM-001"],
    "affectedProductNodeIds": ["PT-1"],
    "affectedWorkNodeIds": ["WT-2"],
    "affectedTestNodeIds": ["TT-3"],
    "affectedEvidenceNodeIds": ["EV-4"],
    "affectedAcceptanceNodeIds": ["AB-1"],
    "startedAt": "2026-06-12T00:00:00.000Z",
    "status": "in_progress"
  }
}
```

`pbe revision complete` requires this `activeRevision` context. The command fails if the requested Change id does not
match `activeRevision.changeNodeId`, or if the active context has no affected Product, Work, Test, Evidence, or
Acceptance ids.

When revision completes, PBE removes `activeRevision`, appends a completed entry to `revisionHistory`, and returns the
branch to the normal reverification path.

Revision start prepares the next `pbe-state.json`, `evidence-tree.json`, and `acceptance-tree.json` contents in memory
before committing any artifact. The artifact write step prepares temporary files first, then writes invalidated
Evidence, invalidated Acceptance, and finally the new PBE state. If preparation or writing fails, PBE does not open the
revision state and attempts to preserve the original artifact contents.

`pbe revision complete` does not go to `DONE`. It returns the branch to `WPD_IN_PROGRESS` so the normal closure path
runs again:

```text
WPD -> VD -> ACEP -> Execution -> Review -> User Accept
```

## Evidence And Acceptance Invalidation

`pbe revision start` invalidates affected current proof artifacts at the `.pbe` artifact level:

- Affected Evidence nodes are preserved but marked `status: "invalidated"`.
- Evidence nodes receive `previousStatus`, `invalidatedByChangeNodeId`, `invalidatedByRevisionChangeNodeId`, and
  `invalidatedAt`.
- Affected Acceptance branches are preserved as history but marked `status: "invalidated"`.
- Acceptance branches receive `previousStatus`, `requiresReacceptance: true`, `invalidatedByChangeNodeId`,
  `invalidatedByRevisionChangeNodeId`, and `invalidatedAt`.

Invalidated Evidence cannot satisfy review or accept closure as current proof. Invalidated Acceptance cannot be reused
as user acceptance for the revised branch; the branch must pass WPD, VD, ACEP, Execution, Review, and explicit user
acceptance again.

This first revision-safety layer is artifact-based. It does not perform automatic semantic analysis or git diff-based
file mutation detection.
