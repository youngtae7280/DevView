# Cycle Slices

A Cycle Slice is the selected subset of Product, Project, Work, and Test nodes for one development cycle.

## Included nodes

The Cycle Contract must list included Product, Project, Work, and Test nodes.

## Excluded nodes

The Cycle Contract must explicitly list excluded, deferred, blocked, and out-of-scope nodes. These nodes must not be touched.

## Partial completion

A cycle can partially satisfy a Product branch. Partial tests or missing evidence produce `partial_satisfied`, not `accepted_done`.
