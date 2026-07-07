# Retrofit Instruction Pack

Status: generated-from-graph-source

Record: change.escape-html-symbol-stringification

## User Intent

Use a real external behavior-change dogfood to prove DevView can recover existing stringification intent, implement a narrow Symbol input behavior change, and validate it with the project's own tests.

## Allowed Files

- `index.js`
- `test/index.js`

## Forbidden Flows

- escape entity vocabulary: The selected slice only changes pre-escape input coercion for Symbol values.
- package metadata or dependencies: The project baseline tests already pass; tooling updates would obscure the behavior dogfood.
- upstream contribution flow: This is local DevView dogfood and does not claim maintainer acceptance.

## Graph Edge Intent

- `edge.symbol-change-extends-coercion` [behavior-change, stringification]: Replacing concatenation coercion with String(value) is the narrow code path that supports Symbol input while preserving existing stringified outputs.
- `edge.symbol-change-guards-escaping` [non-goal, escape-rules]: The dogfood must not alter the match regex, replacement entities, public package metadata, dependencies, or upstream state.

## Verification

- Build: pass
- Runtime/UI: pass
- Hardware: not-applicable

## Boundary

- This pack does not apply changes by itself.
- External project modification requires explicit user approval.
