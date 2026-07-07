# Retrofit Schemas

This directory holds draft DevView retrofit contracts that were extracted from
real maintenance dogfood work.

Current contracts:

- `change-record-v0.json`
  - standard lifecycle record for retrofit changes
- `hardware-evidence-close-protocol-v0.json`
  - protocol for closing real-device evidence without confusing it with build
    evidence

These files are not enforcement rules yet. They are fixture-backed contracts
for validating the shape of future DevView retrofit records.

Validate the current formal fixtures with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\validate-retrofit-fixtures-v0.ps1
```
