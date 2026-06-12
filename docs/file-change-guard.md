# File Change Guard

File Change Guard is a first-pass git diff guard for PBE-controlled projects.

It prevents Codex from quietly changing source files after a branch has entered review, accepted, or done states unless
the change is explained by Work scope or an active Change / Impact / Revision context.

## What It Checks

`pbe files check` reads git changed files from the current working tree:

```bash
pbe files check
pbe files check --json
```

The guard uses `git status --porcelain -z`, so staged, unstaged, deleted, and untracked files are considered. Files
ignored by `.gitignore` are not reported by Git and are therefore ignored by the guard.

## Artifact Changes vs Source Changes

Changes under `.pbe/` are treated as PBE artifact changes, not source file changes.

Source changes are non-`.pbe` project files after ignoring common generated paths:

- `node_modules/`
- `dist/`
- `coverage/`
- `.cache/`
- `tmp/`
- `temp/`
- `*.tmp`

## Work Scope

Source file changes are checked against selected or foundation Work nodes:

- `expectedFiles`
- `expectedSharedFiles`
- `forbiddenFiles`
- `unknownFileTouchRisk`

If a changed file matches `forbiddenFiles`, the guard fails.

If a changed file is outside `expectedFiles` and `expectedSharedFiles`, the guard fails unless the affected Work node
explicitly records `unknownFileTouchRisk`.

## Active Revision Scope

When `.pbe/blueprint/pbe-state.json` has `activeRevision`, only affected Work nodes may explain source changes.

A source file changed outside the affected Work node `expectedFiles` or `expectedSharedFiles` fails with
`FILE_CHANGE_OUTSIDE_WORK_SCOPE`.

## Review And Accept

`pbe review submit` and `pbe accept` run File Change Guard before changing PBE state.

If the branch is protected by review, accepted, or done closure and source files changed without active Revision
context, the guard fails with `FILE_CHANGE_REQUIRES_REVISION`.

The intended recovery path is:

```bash
pbe change create --summary "Describe the requested change"
pbe impact analyze --change CH-001 --work WT-1
pbe revision start --change CH-001
```

## Limits

This is not a security sandbox and does not perform semantic diff analysis. It is a deterministic first-pass guard that
uses git changed paths and `.pbe` Work / Revision artifacts.
