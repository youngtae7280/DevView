# Direction Correction Report

## GUI-Oriented Work Removed

- The previous React/Vite GUI source under `src/` was removed.
- Browser assets under `public/`, `index.html`, Vite config files, app TypeScript configs, and legacy GUI notes under
  `docs/legacy-gui/` were removed.
- React/Vite dependencies and `legacy:*` npm scripts were removed from package metadata.
- `dist/` now belongs to the CLI build output, not a GUI build.
- Active PBE work lives in `.codex-plugin/`, `skills/`, `templates/`, `schemas/`, `scripts/`, `cli/`, and current docs.

## Reusable Assets

- PBE stage vocabulary: RPD, WPD, VD, ACEP.
- ACEP file list and task-card concept.
- RPD interview principles.
- WPD and VD artifact concepts.
- Existing package tooling can host lightweight validation scripts.

## Work To Stop Or Avoid

- Do not extend the React/Vite GUI.
- Do not build a tree canvas or node picker UX.
- Do not add app-managed OpenAI API provider or API key UI.
- Do not add SaaS, deployment, PR, or automation services.
- Do not treat GUI export buttons as the product interface.

## New Implementation Plan

1. Add `.codex-plugin/plugin.json`.
2. Add six Codex skills: start, RPD, WPD, VD, generate ACEP, run ACEP.
3. Define `.pbe/` file templates.
4. Define JSON schemas for PBE artifacts.
5. Replace README and active docs with Codex Plugin usage.
6. Remove GUI work rather than preserving it as active repository material.
7. Add `AGENTS.md` guidance for `.pbe/` and ACEP.
8. Add lightweight validation.

## Contract Hardening Added Later

The ACEP direction was strengthened so PBE is not only a task-card generator. ACEP now includes traceability matrix,
UI/UX spec, UI/UX evidence checklist, final coverage check, evidence rules, stronger completion criteria, and a stronger
final report template.
