# Graph Operation Runbook

This guide is the short practical loop for using Graph-source PBE on a bounded change.

The goal is simple: turn a selected graph record into a safe instruction pack, let the target project change happen
inside that scope, capture what changed, and then update graph-source only after review.

## Flow

```text
graph-source + record
  -> instruction pack
  -> bounded target change
  -> graph delta from git diff
  -> graph update proposal
  -> apply-proposal preview
  -> apply-proposal --apply
```

## 1. Inspect The Graph

Use this before touching the target project.

```bash
node dist/cli/index.js graph retrofit plan \
  --graph-source examples/internal-legacy/retrofit/cardprinterconfig/graph-source.json \
  --json
```

Check:

- The record is implementation-ready.
- The selected files match the intended change.
- Forbidden flows match what must not be touched.
- edgeIntent explains why the slice exists and what it protects.

## 2. Generate The Instruction Pack

```bash
node dist/cli/index.js graph operation generate-pack \
  --graph-source examples/internal-legacy/retrofit/cardprinterconfig/graph-source.json \
  --record change.laminator-tag-layout \
  --output outputs/retrofit/instruction-packs/laminator-tag-layout.instruction-pack.json \
  --markdown outputs/retrofit/instruction-packs/laminator-tag-layout.instruction-pack.md \
  --json
```

The pack is the working contract. It lists allowed files, forbidden flows, user-confirmed intent, verification
expectations, and graph context. It does not modify the target project.

## 3. Make The Bounded Target Change

Apply the actual code, resource, or documentation change in the target repository.

Stay inside the allowed files. If the target change needs a file outside the pack, stop and update the graph/record
first instead of silently widening scope.

## 4. Capture The Graph Delta

```bash
node dist/cli/index.js graph operation capture-delta \
  --graph-source examples/internal-legacy/retrofit/cardprinterconfig/graph-source.json \
  --instruction-pack outputs/retrofit/instruction-packs/laminator-tag-layout.instruction-pack.json \
  --target-repo C:/path/to/target \
  --output outputs/retrofit/graph-deltas/laminator-tag-layout.graph-delta.json \
  --markdown outputs/retrofit/graph-deltas/laminator-tag-layout.graph-delta.md \
  --json
```

This reads `git diff` from the target repo. It blocks if dirty files are outside the instruction pack allowed files.

It does not patch the target repo and does not update graph-source.

## 5. Propose The Graph Update

```bash
node dist/cli/index.js graph operation propose-update \
  --graph-delta outputs/retrofit/graph-deltas/laminator-tag-layout.graph-delta.json \
  --output outputs/retrofit/graph-update-proposals/laminator-tag-layout.graph-update-proposal.json \
  --markdown outputs/retrofit/graph-update-proposals/laminator-tag-layout.graph-update-proposal.md \
  --json
```

The proposal says how graph-source should be updated after the target change is reviewed.

It is still a proposal. It does not mutate graph-source.

## 6. Preview Graph-Source Application

```bash
node dist/cli/index.js graph operation apply-proposal \
  --proposal outputs/retrofit/graph-update-proposals/laminator-tag-layout.graph-update-proposal.json \
  --json
```

Preview mode is the default. Use it to inspect planned record and node state changes.

## 7. Apply After Review

```bash
node dist/cli/index.js graph operation apply-proposal \
  --proposal outputs/retrofit/graph-update-proposals/laminator-tag-layout.graph-update-proposal.json \
  --apply \
  --json
```

This updates graph-source record/node state fields only. It does not apply code patches, create upstream PRs, infer
maintainer approval, enable enforcement, or retire compatibility artifacts.

## Smoke Check

Run the local smoke when changing this operation flow:

```bash
npm run test:graph-operation:flow
```

The smoke creates a temporary target git repo and runs the whole CLI sequence through preview and apply. It proves the
flow works without touching external projects or committed graph-source fixtures.
