# Product Spec

## Goal

Build a local GUI that helps a user turn a broad program request into a structured development package through selective recursive decomposition.

## MVP Scope

- Root request entry
- Root node creation
- Mock LLM first-level module generation
- Tree GUI with connected nodes
- Node selection and detail panel
- Interview question generation
- Answer saving
- Answer-aware child module generation
- Node status changes for assumption, deferred, out of scope, and work unit
- Artifact generation
- Artifact preview
- localStorage save/load
- JSON import/export
- Markdown export

## Excluded Scope

- Real source-code generation
- Git branch or pull request creation
- Direct Codex execution automation
- Multi-user collaboration
- Cloud sync
- Payment, deployment automation, or server database integration

## User Flow

1. Enter a root program request.
2. Create a root node.
3. Generate first-level modules.
4. Select the branch that needs deeper analysis.
5. Start an interview for that branch.
6. Save answers.
7. Generate child modules from the answered node.
8. Mark unrelated nodes as assumptions, deferred, out of scope, or work units.
9. Finish work.
10. Review and export the generated development package.

## Screen Structure

- Header and toolbar: project controls, import/export, finish work.
- Status strip: current notices, node count, warning count, tree validity.
- Tree canvas: pan/zoom graph with status labels.
- Node detail panel: node metadata, action buttons, criteria, assumptions, interview.
- Artifact preview: generated documents and raw JSON.
