# Change Impact Revision CLI Skeleton

PBE does not let Codex silently edit completed or accepted work after user feedback. Feedback first becomes a Change node, then an Impact node lists the affected Product, Work, Test, Evidence, and Acceptance nodes.

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

`pbe impact analyze` creates an Impact node in `.pbe/control/impact-tree.json` and marks the Change node as `impact_analyzed`.

The skeleton does not infer meaning. Affected node ids must come from explicit command options or already be present on the Change node.

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

`pbe revision start` requires an Impact node with at least one affected id. It transitions eligible review or accepted states into `REVISION_REQUESTED`.

`pbe revision complete` does not go to `DONE`. It returns the branch to `WPD_IN_PROGRESS` so the normal closure path runs again:

```text
WPD -> VD -> ACEP -> Execution -> Review -> User Accept
```

Affected Work, Test, Evidence, and Acceptance nodes should be marked stale, invalidated, superseded, or reopened by later implementation/revision work. This skeleton only enforces the Change/Impact gate and does not perform automatic semantic analysis or file-diff detection.
