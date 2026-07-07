# Release Policy

PBE uses explicit plugin and package versions so users can understand whether a new chat is running the updated workflow.

## Version Types

- Patch: documentation, examples, schemas, or validator fixes that preserve behavior.
- Minor: new optional PBE artifacts, gates, validators, or skill protocol rules that preserve existing public paths.
- Major: incompatible public path, skill name, command, or artifact contract changes. Avoid these unless a migration guide and aliases are available.

## Required Release Checks

Before pushing plugin changes:

```text
npm run validate
npm run validate:pbe
npm run validate:pbe:v2
npm run typecheck
npm run lint
npm test
npm run build
python scripts/update_plugin_cachebuster.py <plugin-path>
python scripts/validate_plugin.py <plugin-path>
git diff --check
```

The cachebuster step updates the personal plugin copy so newly opened Codex chats can install the latest plugin version.

## Compatibility Rules

- Preserve existing skill names.
- Preserve `.codex-plugin/plugin.json`.
- Preserve v1 `.pbe/blueprint/*` views as compatibility artifacts.
- Preserve `RPD`, `WPD`, `VD`, `ACEP`, and `Revision` terms as compatibility names.
- Do not remove or rename public paths without aliases and migration notes.
