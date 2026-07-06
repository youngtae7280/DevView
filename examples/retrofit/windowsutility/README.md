# WindowsUtility Retrofit Portfolio Graph

This fixture is a read-only DevViewGraph demo seed for the WindowsUtility / Utility_Windows retrofit story.

It intentionally separates two levels of confidence:

- `product.windowsutility-legacy` and `legacy-utility-module` nodes are observed top-level `Utility_Windows/src`
  inventory. They make the whole utility portfolio visible.
- The CardPrinterConfig nodes, edges, and records are the currently detailed retrofit slice. Only that selected slice
  is allowed to drive the instruction pack demo.

The demo command is:

```powershell
node dist/cli/index.js graph read-model render-devview-graph `
  --graph-source examples/retrofit/windowsutility/graph-source.json `
  --record change.laminator-tag-layout `
  --instruction-pack outputs/retrofit/instruction-packs/windowsutility-laminator-tag-layout.instruction-pack.json `
  --project-memory examples/retrofit/windowsutility/devview-project-memory.preview.json `
  --output outputs/devview-graph/windowsutility.devviewgraph.html `
  --data-output outputs/devview-graph/windowsutility.devviewgraph.data.json `
  --json
```

The generated inspector includes a Current Work Flow stepper for the active request:

```text
1 Request -> 2 Domain Tree -> 3 Change Tree -> 4 Risk Tree -> 5 SubGraph -> 6 Pack
```

Clicking those steps changes graph highlight and inspector detail only. It does not run traversal, generate a new
contract, execute Codex, mutate graph-source, approve work, or satisfy runtime Evidence.

This fixture does not mutate `Utility_Windows`, mutate `WindowsUtility`, apply graph deltas, approve work, satisfy
runtime Evidence, prove equivalence, enforce scope, or configure CI.

The project memory preview is:

```text
examples/retrofit/windowsutility/devview-project-memory.preview.json
```

It records WindowsUtility as a retrofit project with `legacy-preserving-retrofit` direction. The whole portfolio remains
observed inventory, while CardPrinterConfig is the detailed retrofit slice. The memory preview is persistent but not
approved authority; taxonomy and view tree extensions remain proposal-only until a future human-reviewed project memory
revision exists.

The report-only Project Memory commands are:

```powershell
node dist/cli/index.js graph read-model report-project-memory-extension-gaps `
  --project-memory examples/retrofit/windowsutility/devview-project-memory.preview.json `
  --graph-source examples/retrofit/windowsutility/graph-source.json `
  --output examples/retrofit/windowsutility/project-memory-extension-gaps.preview.json `
  --markdown examples/retrofit/windowsutility/project-memory-extension-gaps.preview.md `
  --json

node dist/cli/index.js graph read-model report-project-memory-impact `
  --project-memory examples/retrofit/windowsutility/devview-project-memory.preview.json `
  --direction-change examples/retrofit/windowsutility/project-direction-change.behavior-preserving-refactor.preview.json `
  --output examples/retrofit/windowsutility/project-memory-impact.behavior-preserving-refactor.preview.json `
  --markdown examples/retrofit/windowsutility/project-memory-impact.behavior-preserving-refactor.preview.md `
  --json
```
