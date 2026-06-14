# Parallel Safety Checklist

## Target Work Items

| Work ID | Expected Files | Shared Resources | Depends On | Safety Level |
| ------- | -------------- | ---------------- | ---------- | ------------ |
| ...     | ...            | ...              | ...        | ...          |

## Source File Independence

- [ ] No two parallel work items modify the same source file.
- [ ] Adjacent files do not change the same Product behavior without Impact analysis.

## PBE Artifact Independence

- [ ] No two parallel tasks write the same `.pbe` artifact.
- [ ] No state transition commands run in parallel.

## Shared Resource Check

- [ ] No shared generated directories such as dist, coverage, tmp, .cache, clean-dist.
- [ ] No shared DB, port, browser profile, hardware device, or temp path.

## Evidence Independence

- [ ] Evidence from each task is valid independently.
- [ ] Evidence order does not depend on another work item finishing first.

## Review / Acceptance Independence

- [ ] Parallel work does not require the same user review decision.
- [ ] Parallel work does not update the same Acceptance node.

## Decision

Safety level:

- [ ] safe
- [ ] risky
- [ ] blocked

Reason:

...

Recommended execution:

- [ ] sequential
- [ ] parallel allowed
- [ ] parallel allowed only with isolation
