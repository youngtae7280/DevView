# Todo Search Adoption Example

This is a dogfooding/adoption snapshot for applying PBE to the next feature slice in an existing Todo app.

Rough request:

> Todo 목록이 많아지니까 찾기 불편해. 검색 좀 되게 해줘.

Suggested first slice:

Todo title text search only.

Deferred/out of scope for this slice:

- tag filter
- date filter
- fuzzy search
- server-side search
- saved search
- note/description search until Product Patch feedback

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

The accepted title-only slice later receives Product meaning feedback: search should include todo note content. That
feedback is represented through Change/Impact/Product Patch/Revision instead of directly editing Product Tree meaning.

Demo-support evidence strengthening adds manual, non-authoritative selected-slice snapshots:

- `project-tree.json`
- `cycle-contract.md`
- `node-execution-contracts/wt-search-001.md`
- `change-tree.json`
- `impact-tree.json`
- `compatibility-review.md`
- `approval-brief.md`
- `evidence-exceptions.md`

These files make the representative demo more reviewable. They are not CLI-generated runtime artifacts, not product
feature implementation, and not Graph-source promotion.
