# Project Blueprint Engine Plugin

Project Blueprint Engine extends the existing Recursive Program Designer into a four-stage planning tool:

1. RPD: Recursive Program Designer
2. WPD: Work Process Designer
3. VD: Verification Designer
4. ACEP Generator: Autonomous Codex Execution Pack Generator

The plugin does not execute Codex automatically. It generates an instruction package that another Codex session can read and execute within approved scope.

## Flow

RPD captures a requirement tree through one-question-at-a-time interviews. A branch becomes `confirmed_leaf` when the user decides the requirement is sufficiently decomposed.

WPD converts confirmed requirement leaves into executable work designs. It generates leaf work first, synthesizes parent/root work designs, then creates an implementation roadmap.

VD converts work designs into verification designs. It generates leaf verification first, synthesizes parent/root verification, then creates a root acceptance plan.

ACEP turns the complete blueprint into a multi-file execution package under `.pbe/codex-execution-pack/`.

## MVP Exclusions

- No actual Codex API automation.
- No automatic Codex session creation.
- No GitHub PR creation.
- No deployment execution.
- No secret, billing, or permission management.
- No repo-wide autonomous implementation engine.
