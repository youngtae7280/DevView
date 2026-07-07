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
