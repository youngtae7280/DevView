# Read-Model Slice Registry Storage Decision

Status: read-model-slice-registry-storage-decision / decision-surface / candidate-registry-file-created /
parser-tests-implemented / local-validate-all-implemented /
non-enforcing

This document records the storage-location and file-format decision surface for a future read-model slice registry
fixture.

It follows:

- [read-model-validate-all-contract.md](read-model-validate-all-contract.md)
- [read-model-slice-registry-test-strategy.md](read-model-slice-registry-test-strategy.md)

The approved candidate registry file now exists at `examples/read-model-aggregate/read-model-slices.json`, and internal
parser/normalization plus profile-comparison tests now cover it. The local non-enforcing `pbe graph read-model validate
--all` command now consumes it for configured profile execution and aggregate Evidence. This document still does not
modify workflows, dispatch GitHub Actions, create PRs, introduce CI enforcement, expand source authority, perform
public-doc cleanup, or approve full Graph-source promotion.

## Decision Context

The validate-all contract defines the future all-slice validation policy. The registry test strategy defines the desired
fixture shape and tests. Before and after creating the candidate registry file, PBE needs a decision surface for:

- where the registry should live
- which file format should be used
- what artifact role the registry has
- what may mutate it
- how existing in-code profile configuration remains compatible until command behavior consumes registry metadata

The registry is execution metadata for future read-model validation. It is not product source, not graph source, and not
promotion approval.

## Candidate Locations

| Candidate location                                                 | Strengths                                                                                   | Risks / drawbacks                                                                                              | Current judgment                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `examples/read-model-aggregate/read-model-slices.json`             | Repo-local, non-generated, near aggregate Evidence, outside any single slice, easy to parse | Creates a new config-like artifact under `examples`; requires parser support later                             | Recommended candidate for actual registry file     |
| `examples/read-model-aggregate/generated/read-model-slices.json`   | Near aggregate output files                                                                 | Generated directory implies output, may be overwritten, mixes config/source metadata with churn artifacts      | Avoid                                              |
| `examples/read-model-slices.json`                                  | Simple top-level examples registry                                                          | Less clearly tied to read-model aggregate path; may look like registry for all examples, not read-model slices | Acceptable fallback but less precise               |
| `docs/concept/read-model-slices.md/json`                           | Safe for design-only discussion                                                             | Documentation path is not ideal for future executable config; parser reading docs/concept would blur docs/code | Good for concept samples only, not execution input |
| Future `.pbe/read-model-slices.json` or `.pbe/graph/registry.json` | Closer to PBE runtime artifacts and future repo-level config                                | No repo root `.pbe` artifact exists here; could imply source authority or active runtime state too early       | Future-only after runtime artifact policy          |
| CLI internal hardcoded profile list                                | No new file; current behavior is stable                                                     | Does not scale; hides profile registry from review; makes `validate --all` less transparent                    | Short-term fallback only                           |

## Recommendation

Approved candidate registry location:

```text
examples/read-model-aggregate/read-model-slices.json
```

Rationale:

- It is outside Todo Search and Todo App PBE Run slice ownership, so it can describe cross-slice validation without
  becoming a slice artifact.
- It is outside `generated/`, so it is not confused with command output or artifact churn.
- It is near the aggregate summary output, so readers can connect registry scope to aggregate Evidence.
- It is repo-local and easy for future CLI code to read without implying `.pbe` source authority.
- It can be introduced as a candidate fixture before parser support consumes it.

Do not place the registry under `examples/read-model-aggregate/generated/`. A registry is configuration/execution
metadata, while `generated/` is output Evidence. Mixing them would make mutation and source boundary harder to review.

## File Format Comparison

| Format    | Strengths                                                                 | Risks / drawbacks                                                                              | Current judgment                               |
| --------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| JSON      | Native parser, deterministic, Prettier support, schema-ready, no comments | Comments must live in adjacent docs; strict syntax can be less friendly                        | Recommended                                    |
| JSONC     | Allows comments while staying JSON-like                                   | Needs non-native parser choice; comment semantics must be standardized                         | Possible later if comments become important    |
| YAML      | Readable and comment-friendly                                             | More parser ambiguity; indentation sensitivity; less aligned with existing generated artifacts | Not recommended for first registry             |
| TS module | Type-safe and can share constants                                         | Blurs config with implementation; harder to treat as reviewable artifact                       | Not recommended for evidence/config fixture    |
| Markdown  | Human-friendly                                                            | Poor executable config format; parser would be fragile                                         | Documentation only, not future execution input |

Approved first candidate format:

```text
JSON
```

Rationale:

- future parser can use standard JSON parsing
- future schema validation is straightforward
- Prettier support is already available
- generated reports and manifests are already JSON/Markdown pairs
- comments can stay in this decision document and in adjacent README-style documentation

## Artifact Role

The candidate registry file is classified as:

```text
execution metadata / validation target registry / not source authority
```

Registry inclusion means:

- the slice is included in future read-model validation scope
- the slice has a declared policy level and required artifacts
- the slice may be summarized in aggregate Evidence

Registry inclusion does not mean:

- source authority changes
- Maintainability Graph becomes source
- Todo App PBE Run becomes parity-backed, pilot-marker-backed, CI-backed, or source-authority bearing
- tree-native or canonical `.pbe` artifacts are retired
- user acceptance is replaced
- full Graph-source promotion is approved

## Mutation Boundary

Future parser behavior:

- may read registry entries
- may normalize paths for internal command planning
- may report unsupported or invalid entries
- must not silently rewrite the registry

Future `validate --all` behavior:

- may write generated reports in declared generated output directories
- may write aggregate summaries in the aggregate generated output directory
- must not mutate registry configuration unless a separate explicit config-update task is approved
- must not mutate source artifacts, manual parity artifacts, or pilot markers unless a separate artifact-update task is
  approved

Registry file changes should be ordinary reviewed source changes, not side effects of validation.

## Compatibility And Fallback

For existing single-slice commands, the in-code profile list remains the behavior source:

- `todo-search-selected-slice`
- `todo-app-pbe-run-structure-only`

The candidate registry file was introduced first as a fixture and is still compared against current in-code profiles.
Local `validate --all` consumes the registry after checking it against those in-code profile expectations. The existing
generate/compare/validate/summarize command surfaces remain compatible with the in-code profile fallback.

Recommended compatibility sequence:

1. Create candidate registry file at the approved location. Completed by DEC-071.
2. Add tests that compare registry entries to current in-code profiles. Completed by DEC-072.
3. Implement parser/normalization against the registry fixture. Completed by DEC-072.
4. Implement command planner using parsed registry data. Completed by DEC-072.
5. Implement local non-enforcing `validate --all` against the registry. Completed by DEC-073.
6. Consider CI workflow consumption only after separate approval.

## Decision Options

| Option | Choice                                              | Meaning                                                                         | Tradeoff                                                                                      |
| ------ | --------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| A      | Create actual registry file as candidate fixture    | Add `examples/read-model-aggregate/read-model-slices.json` as candidate fixture | Completed by DEC-071; adds a real config artifact before parser exists                        |
| B      | Implement parser against in-code fixture first      | Keep fixture data in tests/code before adding a repo artifact                   | Reduces artifact churn, but hides review surface and delays registry-as-artifact verification |
| C      | Continue hardcoded profiles until more slices exist | Avoid registry work while only two profiles exist                               | Lowest immediate cost, but delays `validate --all` readiness                                  |
| D      | Defer registry work                                 | Keep current aggregate/report-only path and PR observation only                 | Safe, but no progress toward all-slice validation implementation                              |

## Current Candidate Fixture State

Current candidate fixture:

```text
examples/read-model-aggregate/read-model-slices.json
```

The fixture is strict JSON, outside `generated/`, and contains only:

- `todo-search-selected-slice`
- `todo-app-pbe-run-structure-only`

The candidate file is parsed by focused tests and is consumed by local `validate --all` only. It is not consumed by CI
workflow behavior, and existing in-code profiles remain the behavior source for the existing single-slice commands.

## Recommended Next Action

Recommended next action:

```text
Decide whether CI workflow Evidence should keep the explicit command sequence or call the local registry-backed
`validate --all` command after more PR informational observation.
```

Conditions for that next step:

- keep the file non-generated and strict JSON
- keep `registryRole`, `sourceAuthorityBoundary`, and `nonPromotionStatement`
- continue including only the two current profiles unless a separate profile-addition decision is approved
- keep parser/planner tests in place before changing CI workflow command sequence or existing single-slice commands
- do not change workflow triggers or CI enforcement

If CI consumption is considered too soon, the safest fallback is the current manual/PR workflow command sequence:
explicit generate/compare/validate/summarize calls with the registry-backed local command available for manual local
Evidence.

## Non-Scope

This decision surface, candidate fixture, and parser tests do not:

- make existing single-slice CLI command behavior registry-driven
- implement CI-backed `validate --all`
- modify `.github/workflows/read-model-evidence.yml`
- regenerate generated artifacts
- create PRs
- dispatch GitHub Actions
- add required checks
- add branch protection
- introduce CI enforcement
- expand source authority
- approve full Graph-source promotion
- perform public-doc cleanup
- promote Todo App PBE Run beyond `structure-only`

## Gate Self-Check

| Gate                           | Result | Notes                                                                                    |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------- |
| Decision-Surface Gate          | PASS   | Defines location/format tradeoffs and records the approved candidate file location.      |
| Non-Generated Location Gate    | PASS   | Recommends a non-generated path and rejects `generated/` as config storage.              |
| Format Clarity Gate            | PASS   | Uses strict JSON for the candidate and records JSONC/YAML/TS/Markdown tradeoffs.         |
| Artifact Role Gate             | PASS   | Registry is execution metadata, not source authority or promotion.                       |
| Mutation Boundary Gate         | PASS   | Future validation may not silently rewrite registry/source/manual/pilot artifacts.       |
| Parser Test Gate               | PASS   | Registry parsing, normalization, duplicate rejection, and profile comparison are tested. |
| Compatibility Fallback Gate    | PASS   | In-code profiles remain fallback for existing single-slice commands.                     |
| Local Validate-All Gate        | PASS   | Local `validate --all` consumes the registry without changing workflow behavior.         |
| Source Authority Boundary Gate | PASS   | Registry inclusion does not expand source authority or retire tree-native artifacts.     |
| Todo App Structure-Only Gate   | PASS   | Todo App PBE Run remains structure-only.                                                 |
| User Approval Boundary Gate    | PASS   | Parser/CLI consumption remains a later decision.                                         |

## Final Statement

This document records the selected candidate registry location and strict JSON format. The candidate registry file is
now present, covered by internal parser/normalization tests, and consumed by local non-enforcing `validate --all`.
Workflow, enforcement, source-authority, promotion, and cleanup behavior still do not consume it.

Negative fixture storage is decided separately in
[read-model-negative-fixture-storage-decision.md](read-model-negative-fixture-storage-decision.md). That policy covers
invalid registry/report/slice inputs and does not change this positive registry fixture location.
