# DevView Project-Specific Extensions

DevView extensions are project-specific declarations that describe how a project wants DevView to adapt its analysis,
View Tree extraction, Context Pack shaping, Evidence handling, policies, and workflow guidance.

The foundation slice is report-only. Extension manifests are discovered and validated, but DevView does not execute
extension code, run shell commands, call providers, make network calls, mutate the Maintainability Graph, satisfy
runtime Evidence, prove equivalence, or enforce scope and CI.

## Concepts

- Project Profile: `.devview/project-profile.json`, the local project stack/domain/profile declaration.
- Extension Manifest: JSON files under `.devview/extensions/`, one per declared extension.
- Analyzer Extension: declaration for future request or repository analysis behavior.
- View Tree Extractor Extension: declaration for future project-specific Maintainability Graph to View Tree rules.
- Context Pack Extension: declaration for future Context Pack shaping rules.
- Evidence Adapter: declaration for future project-specific evidence source mapping.
- Policy Extension: declaration for future project-specific policy boundaries.
- Skill/Workflow Extension: declaration for future workflow guidance.

## Readiness Command

```bash
devview extensions report-readiness \
  --project-profile .devview/project-profile.json \
  --extensions-dir .devview/extensions \
  --output .tmp/devview-extension-readiness.json \
  --markdown .tmp/devview-extension-readiness.md \
  --json
```

The report records discovered capabilities and required permissions. It also records that extension execution, provider
invocation, network calls, graph updates, runtime Evidence satisfaction, equivalence proof, and enforcement are all
disabled.

## Profile Catalog

```bash
devview extensions compile-profile \
  --project-profile .devview/project-profile.json \
  --extensions-dir .devview/extensions \
  --extension-readiness .tmp/devview-extension-readiness.json \
  --output .tmp/devview-extension-profile-catalog.json \
  --markdown .tmp/devview-extension-profile-catalog.md \
  --json
```

The catalog turns a ready Project Profile and Extension Manifest readiness report into normalized source facts grouped
by capability: analyzer, View Tree extractor, Context Pack, Evidence adapter, policy, skill/workflow, and protocol-only
graph-ingestion candidates. Graph ingestion candidates, including future Graphify-style providers, are not installed or
executed by this command. Native and retrofit signals are summarized as profile hints only.

The catalog does not grant traversal, Context Pack, Evidence, policy, enforcement, provider, network, shell, or graph
mutation authority.

## Context Planning

```bash
devview extensions plan-context \
  --extension-profile-catalog .tmp/devview-extension-profile-catalog.json \
  --view-tree .tmp/devview-view-tree.json \
  --context-pack .tmp/devview-context-pack.json \
  --output .tmp/devview-extension-context-plan.json \
  --markdown .tmp/devview-extension-context-plan.md \
  --json
```

The context plan connects catalog hints to View Tree and Context Pack planning as source facts only. It can summarize
which extractor, analyzer, context, Evidence, policy, Native/Retrofit, or protocol-only graph-ingestion hints are
available, but it does not execute adapters, install or run external graph tooling, mutate artifacts, or grant traversal,
Evidence, proof, scope, CI, hook, provider, network, shell, approval, or user-acceptance authority.
