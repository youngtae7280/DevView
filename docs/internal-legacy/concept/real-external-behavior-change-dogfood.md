# Real External Behavior-Change Dogfood

Status: completed-local-only / behavior-tested / non-enforcing / no upstream PR

## Purpose

Run the full PBE operation-chain loop against a real external project where the
selected slice changes actual behavior, not only documentation:

```text
baseline check -> graph-source -> instruction pack -> local code/test change
-> project test pass -> graph delta -> graph update proposal
```

The purpose is to test whether PBE can recover enough project intent from a
retrofit project to keep a tiny behavior change bounded and validated.

## Target

- Repository: `https://github.com/component/escape-html`
- Local checkout: `work/external/escape-html`
- Observed source ref: `b42947eefa79efff01b3fe988c4c7e7b051ec8d8`
- Upstream PR: not created

## Baseline

Before the behavior change, the local checkout passed:

```powershell
npm install --no-audit --no-fund
npm test
```

Baseline test result: 30 passing tests.

## Recovered Intent

The graph-source records the following observed intent:

- README says the package escapes text for HTML interpolation.
- README explicitly lists the escaped characters: `"`, `'`, `&`, `<`, and `>`.
- `index.js` performs input coercion before escape scanning.
- Existing tests already verify stringification for undefined, null, numbers,
  and objects.
- Existing tests protect the five escaped character rules.

Interpretation:

- Extending input coercion is in scope.
- Changing escape entities, public API shape, package metadata, dependencies, or
  upstream state is out of scope.

## Selected Slice

Behavior change:

```text
Support Symbol input by changing coercion from string concatenation to
String(value), then add a focused Symbol test.
```

Allowed files:

```text
index.js
test/index.js
```

Forbidden scope:

- no escaped entity vocabulary change
- no package metadata or dependency change
- no README/API wording change
- no benchmark change
- no upstream PR or maintainer approval claim

## Operation-Chain Evidence

| Artifact              | Path                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Graph source          | `examples/internal-legacy/retrofit/open-source/escape-html/graph-source.json`                                     |
| Change record         | `examples/internal-legacy/retrofit/open-source/escape-html/records/symbol-stringification.implemented.json`       |
| Instruction pack      | `outputs/retrofit/open-source/escape-html/instruction-packs/symbol-stringification.instruction-pack.md`           |
| Graph delta           | `outputs/retrofit/open-source/escape-html/graph-deltas/symbol-stringification.graph-delta.md`                     |
| Graph update proposal | `outputs/retrofit/open-source/escape-html/graph-update-proposals/symbol-stringification.graph-update-proposal.md` |
| Dogfood report        | `outputs/retrofit/open-source/escape-html/dogfood-report.md`                                                      |

The graph delta records two dirty files:

- `index.js`: 1 addition / 1 deletion
- `test/index.js`: 6 additions / 0 deletions

The graph update proposal does not mutate graph-source directly and requires
review before apply.

## Verification

After the change:

```powershell
npm test
```

Result:

- 31 passing tests
- new assertion: `escapeHtml(Symbol('escape')) === 'Symbol(escape)'`
- existing escaping rules remain covered by the original tests

Dogfood validator:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-open-source-escape-html-behavior-dogfood-v0.ps1
```

Result: `open-source-escape-html-behavior-dogfood-pass`.

## Boundaries

- No upstream branch, issue, or PR was created.
- No maintainer intent was claimed.
- No source-authority expansion happened.
- No required check or branch protection was added.
- No tree retirement happened.
