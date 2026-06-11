# PBE Core Concepts

Project Blueprint Engine is a Codex development control protocol. It is not a GUI app, a backend service, or a faster-code generator.

PBE is not an execution engine that tries to do everything. PBE is a requirements-based execution control layer for AI-assisted development.

PBE's goal is to make requirements, structure, work, verification, evidence, and user approval boundaries explicit before AI implementation proceeds.

## Product Truth

The Product Tree is the source of product truth. If a behavior is not represented in the Product Tree, Codex should not treat it as product scope.

User language becomes Product truth only after RPD resolves ambiguity and records verifiable acceptance criteria.

## Derived Work

Project, Work, and Test trees derive from Product Tree branches:

```text
Product Tree -> Project Tree -> Work Tree -> Test Tree
```

Work may be executable only when it is traceable to Product and Project nodes. Tests may close work only when they verify Product or Work nodes.

When Product nodes include structured `acceptanceCriteria`, Work, Test, and Evidence nodes should preserve those criterion links.

## Contracts

Cycle Contracts and Node Execution Contracts tell Codex what may be implemented in the current slice. They also declare non-scope, forbidden files, evidence requirements, and validation commands.

## Gates

Human gates stop automation where product judgment is required. Codex can recommend, but it cannot approve UI/UX, implementation scope, architecture runway, review results, or acceptance on behalf of the user.

## Evidence

Evidence proves a node. Build success alone is not product evidence unless the Test Tree says that build success verifies the requirement.

## Change And Reopen

Feedback, discoveries, or drift that alter product meaning, scope, UX, risk, acceptance, or verification become Change Nodes. Impact analysis decides which completed nodes become stale, invalidated, or reopened.
