# Decision Queue

PBE should not interview the user for every node. It asks only when the decision changes tree meaning, scope, UX, risk,
acceptance, verification, or accepted work.

## Decision item

```text
id
targetNodeId
reason
question
options
recommendedDefault
treeEffect
blockingLevel
```

Low-risk automatic derivations are `auto_derived`. Plausible defaults are `assumed` and shown in summaries.
