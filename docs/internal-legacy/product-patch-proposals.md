# Product Patch Proposals

Product Tree changes that alter product meaning must start from a Change node. Codex must not silently edit
`.pbe/tree/product-tree.json` for user feedback that changes requirements, acceptance criteria, product scope, or
product structure.

`product-patch-tree.json` is the before/after contract for Product Tree changes:

- `pbe product patch propose` creates a proposed patch from an existing Change node and target Product node.
- The proposal stores the target node `beforeSnapshot`, an `afterProposal`, affected Product ids, and
  `requiresUserConfirmation: true`.
- User confirmation must be recorded on the patch with `userConfirmed: true` and `confirmation.actor: "user"`.
- `pbe product patch apply` refuses to apply unconfirmed or stale proposals.

Applying a Product Patch only updates the Product Tree and marks the patch as applied. It does not rewrite downstream
Work, Test, Evidence, or Acceptance artifacts. After Product Tree semantics change, run Impact/Revision and then
re-enter the required WPD/VD/ACEP/Execution/Review/Accept closure path.
