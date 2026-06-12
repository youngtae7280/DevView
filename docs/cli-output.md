# CLI Output

PBE CLI commands use the same issue shape in text output and `--json` output so both people and
Codex can understand why a gate failed and what to do next.

Each issue keeps its stable `code` and `message`, and may include these fields:

```json
{
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
```

Required fields are `code`, `severity`, and `message`. Optional fields such as `file`, `nodeId`,
`nodeType`, `stage`, `reason`, `suggestedFix`, and `nextCommand` are included when PBE can infer
them without changing validator behavior.

Use `--json` for automation:

```bash
pbe validate --json
pbe trace check --stage wpd --json
```

The text reporter includes command name, pass/fail status, issue counts, file/node context, suggested
fixes, and the next likely PBE command. `nextCommand` is guidance for the next gate or repair action;
it does not bypass the normal PBE state machine or validation rules.
