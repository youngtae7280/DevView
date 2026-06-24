# Control Node Policy

Status: outline only

## 1. Document Purpose

Control Node Policy will define how decision, change, impact, acceptance, and optional parity/completeness control nodes
are created, linked, and closed.

## 2. Scope This Document Will Cover

This future document should cover:

- decision nodes and decision queue rules
- change and impact node lifecycle
- acceptance node ownership
- stale, invalidated, and reopened states
- optional parity/completeness control ledgers

## 3. Currently Confirmed Decisions

- Product scope changes require Product or Change Tree representation.
- Feedback or drift that changes meaning, scope, UX, risk, acceptance, or verification becomes a Change Node.
- Impact analysis maps affected nodes before revision work starts.
- User acceptance is separate from Codex technical completion.
- Approval Brief displays Control Nodes only when they affect user judgment, warnings, Human Gate, or Blocked status.
- Check/Evidence policy determines when missing, stale, partial, or exception-level Evidence becomes a warning,
  Human Gate, Blocked condition, or later Control Node input.

## 4. Still Undefined

- Detailed lifecycle state names for every control node family.
- Which transitions should be CLI-controlled first.
- Whether control node summaries need a shared template.
- How optional parity ledgers should report blocking versus non-blocking findings.
- How Evidence exceptions should create, update, or reference Control Nodes in a later detailed lifecycle policy.

## 5. Next Phase Content

The next phase may define:

- state transition table
- node creation and closure rules
- stale and reopen examples
- compatibility guidance for existing `.pbe/control/*` files

## 6. Related Gate

Gate 4-6 outline gate only. This file does not define detailed lifecycle policy, validators, or implementation behavior.
