# Real External Operation-Chain Dogfood

Status: completed-local-only / non-enforcing / no upstream PR

## Purpose

Run the PBE operation-chain loop against a real external project checkout:

```text
graph-source -> instruction pack -> local change -> graph delta -> graph update proposal
```

The purpose is not to claim maintainer intent or upstream acceptance. It is to
prove that PBE can keep an external-project edit bounded and report external
baseline blockers separately from selected-slice changes.

## Target

- Repository: `https://github.com/mdn/todo-vue`
- Local checkout: `work/external/todo-vue`
- Observed source ref: `8a7ef579f1d117a8ac9530a52f5c5a81c3e99676`
- Upstream PR: not created

## Selected Slice

Local README-only clarification after dependency installation:

```text
After installing dependencies, use the development server for local UI work and
the production build command for a quick bundled-output check.
```

Allowed file:

```text
README.md
```

Forbidden scope:

- no `src/App.vue` or component behavior changes
- no package script or dependency changes
- no tests/build configuration changes
- no upstream PR or maintainer approval claim

## Operation-Chain Evidence

| Artifact              | Path                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Graph source          | `examples/internal-legacy/retrofit/open-source/todo-vue/graph-source.json`                                            |
| Change record         | `examples/internal-legacy/retrofit/open-source/todo-vue/records/readme-local-command-boundary.implemented.json`       |
| Instruction pack      | `outputs/retrofit/open-source/todo-vue/instruction-packs/readme-local-command-boundary.instruction-pack.md`           |
| Graph delta           | `outputs/retrofit/open-source/todo-vue/graph-deltas/readme-local-command-boundary.graph-delta.md`                     |
| Graph update proposal | `outputs/retrofit/open-source/todo-vue/graph-update-proposals/readme-local-command-boundary.graph-update-proposal.md` |
| Dogfood report        | `outputs/retrofit/open-source/todo-vue/dogfood-report.md`                                                             |

The graph delta records one dirty file, `README.md`, with three additions. The
graph update proposal does not mutate graph-source directly and requires review
before apply.

## External Tooling Result

`npm ci` passed in the external checkout.

`npm run build` did not complete under the local baseline because the external
project/tooling requires a newer Node.js version and Rolldown native optional
binding support than this local run provided.

Interpretation:

- This is an external baseline/toolchain blocker.
- It is not evidence that the README-only selected slice changed runtime
  behavior.
- PBE records the blocker while keeping the selected diff bounded.

## Result

- Graph-source validation: `retrofit-graph-source-pass`
- Change-record validation: `retrofit-change-record-pass`
- Instruction-pack validation: `retrofit-instruction-pack-pass`
- Graph-delta validation: `retrofit-graph-delta-pass`
- Dogfood report: `open-source-todo-vue-dogfood-pass`

## Boundaries

- No upstream branch, issue, or PR was created.
- No maintainer intent was claimed.
- No source-authority expansion happened.
- No required check or branch protection was added.
- No tree retirement happened.
