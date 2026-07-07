# DevView Legacy Operation Chain Outputs

This directory contains the local integration smoke for the shared DevView operation
chain:

```text
graph-source -> instruction pack -> local change -> graph delta
```

The smoke combines:

- CardPrinterConfig retrofit fixture checks in fixture-only mode.
- cJSON open-source retrofit dogfood.
- Graph Notes native dogfood.
- Graph Counter native behavior dogfood.

It is non-enforcing and does not modify `Utility_Windows`.

Useful reports:

- `operation-chain-report.json`
- `operation-chain-report.md`
- `dogfood-evaluation.json`
- `dogfood-evaluation.md`
- `artifact-inventory.json`
- `artifact-inventory.md`
