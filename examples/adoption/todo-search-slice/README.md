# Todo Search Adoption Example

This is a dogfooding/adoption snapshot for applying PBE to the next feature slice in an existing Todo app.

Rough request:

> Todo 목록이 많아지니까 찾기 불편해. 검색 좀 되게 해줘.

Original first slice:

Todo title text search only.

Confirmed PP-001 revision scope:

Todo title + note/content search. The user approved PP-001 in the parent orchestration chat on 2026-06-24.

Deferred/out of scope for this slice:

- tag filter
- date filter
- fuzzy search
- server-side search
- saved search
- note/content search beyond the confirmed title + note/content semantics

Files in this folder are illustrative artifact snapshots, not regression fixtures wired into `test:examples`.

Flow:

```bash
pbe init --profile lite --brief "Adopt PBE for Todo search slice"
pbe rpd check
pbe rpd close
pbe wpd close
pbe vd close
pbe scope select
pbe acep ready
pbe execution start
pbe files check
pbe execution complete
pbe review submit
pbe accept
```

The accepted title-only slice later receives Product meaning feedback: search should include todo note content. PP-001 is
now confirmed in the demo-support artifacts, and a bounded runtime fixture provides fresh Evidence for title +
note/content search. The user approved renewed Acceptance for this representative demo-support slice with retained
warnings on 2026-06-24.

Demo-support evidence strengthening adds manual, non-authoritative selected-slice snapshots:

- `project-tree.json`
- `cycle-contract.md`
- `node-execution-contracts/wt-search-001.md`
- `change-tree.json`
- `impact-tree.json`
- `compatibility-review.md`
- `approval-brief.md`
- `evidence-exceptions.md`
- `runtime-fixture/`
- `runtime-evidence.md`

These files make the representative demo more reviewable. They are not CLI-generated runtime artifacts, not product
feature implementation, and not the Graph-source promotion action. Current limited Graph-source status is represented by
`graph-source.json` and the generated read-model Evidence under `generated/`.
