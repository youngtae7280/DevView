# DevView Hook Script Bundle Preview

Status: devview-hook-script-bundle-materialized-preview

## Boundary

- Bundle dir: `.tmp/devview-hook-script-bundle/add-todo-runtime-evidence-only`
- Install status: not installed.
- Active status: not active.
- Strict/guided blocking: disabled.
- Scope/CI enforcement: disabled.
- Graph mutation/apply, approval, Evidence acceptance/satisfaction, and equivalence proof remain disabled.

## Scripts

- SessionStart: `.tmp/devview-hook-script-bundle/add-todo-runtime-evidence-only/devview-session-start.ps1` (7218c48149420d006597b2ea1e93ec962b300160b97d7b93dc35102066a65306)
- UserPromptSubmit: `.tmp/devview-hook-script-bundle/add-todo-runtime-evidence-only/devview-user-prompt-submit.ps1` (d339e8ba7effe01b67e7afa8daf27535f29a66fb9ccd2106b4921ad73cafd264)
- PreToolUse: `.tmp/devview-hook-script-bundle/add-todo-runtime-evidence-only/devview-pre-tool-use.ps1` (9fa75c55731b3e45994bc28713dcb22bac0371769020adc2779371949bec3b3c)
- PostToolUse: `.tmp/devview-hook-script-bundle/add-todo-runtime-evidence-only/devview-post-tool-use.ps1` (1d30ca15b88177acb6b4b9a65838d33731af9bcad2ea0aeff79bafd2ac5d6a9a)
- Stop: `.tmp/devview-hook-script-bundle/add-todo-runtime-evidence-only/devview-stop.ps1` (b5d6f031cd0093a233da33a42afc8941552a9120478eebb28a9564becaf53b64)

## Non-execution Statement

This Hook Gateway script bundle writes repo-local advisory preview scripts only. It does not install hooks, mutate Codex configuration, trust repositories, start a hook session, block tool use, trigger Codex execution, call an LLM, make network calls, run validation or traversal, mutate graph-source, apply graph deltas, approve work, record human decisions, accept or satisfy Evidence, prove equivalence, enforce scope, configure CI, require checks, change branch protection, or reject diffs.
