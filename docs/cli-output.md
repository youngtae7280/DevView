# CLI Output

PBE CLI commands use the same issue shape in text output and `--json` output.

The goal is simple:

- People can read failure output without knowing the internal validator layout.
- Codex can consume stable JSON without scraping text.
- A failed gate can show why it failed, which artifact/node is involved, and the likely next command.

## Issue Fields

Each issue keeps its stable `code` and `message`.

Required fields:

- `code`: stable machine-readable issue code.
- `severity`: `error`, `warning`, or `info`.
- `message`: human-readable summary.

Optional fields are included when PBE can infer them without changing validator behavior:

- `file`: related `.pbe` artifact or repository file.
- `nodeId`: related Product, Work, Test, Evidence, Change, Impact, or Acceptance node id.
- `nodeType`: inferred tree/control node type.
- `stage`: stage-specific validator mode, such as `wpd`, `vd`, `execution`, `review`, or `accept`.
- `reason`: concise failure reason.
- `suggestedFix`: concrete repair guidance.
- `nextCommand`: likely PBE command to rerun after the repair.

## JSON Output

Use `--json` for automation and for Codex-to-Codex handoff:

```json
{
  "ok": false,
  "command": "trace check",
  "exitCode": 1,
  "message": "trace check failed.",
  "issues": [
    {
      "validator": "Traceability",
      "code": "PRODUCT_WORK_LINK_MISSING",
      "severity": "error",
      "message": "Selected/foundation Product node PT-1 has no Work Tree coverage.",
      "file": ".pbe/tree/work-tree.json",
      "nodeId": "PT-1",
      "nodeType": "Product",
      "stage": "wpd",
      "reason": "Selected/foundation Product node PT-1 has no Work Tree coverage.",
      "suggestedFix": "Create Work Tree coverage or explicitly defer/out_of_scope the Product node.",
      "nextCommand": "pbe wpd close"
    }
  ]
}
```

Recommended automation commands:

```bash
pbe status --json
pbe validate --json
pbe trace check --stage wpd --json
pbe review submit --json
```

## Status Navigator

When unsure, run `pbe status`. Status is a lightweight next-action navigator: it reads the current PBE state, summarizes
blocking issues already visible in project artifacts, and reports the likely next CLI command.

Status does not replace validation. For full artifact and policy checks, run `pbe validate`.

## Text Output

Text output is intended for humans reading terminal output:

```text
trace check failed.

Command: trace check
Status: FAIL
Issues: 1 total, 1 error, 0 warning, 0 info

Issues:
- [error] PRODUCT_WORK_LINK_MISSING: Selected/foundation Product node PT-1 has no Work Tree coverage.
  File: .pbe/tree/work-tree.json
  Node: Product PT-1
  Stage: wpd
  Suggested fix: Create Work Tree coverage or explicitly defer/out_of_scope the Product node.
  Next command: pbe wpd close
```

## Repair Guidance

`suggestedFix` describes the artifact or node repair.

`nextCommand` points to the likely PBE command to rerun after the repair. It is guidance only; it does not bypass:

- normal validators
- state transition checks
- user approval gates
- review or acceptance rules

Common examples:

```json
{
  "code": "PRODUCT_WORK_LINK_MISSING",
  "nextCommand": "pbe wpd close"
}
```

```json
{
  "code": "ACCEPTANCE_CLOSURE_MISSING",
  "nextCommand": "pbe accept"
}
```

Codex should prefer `--json` when it needs to inspect exact issue codes, node ids, or stage metadata.
