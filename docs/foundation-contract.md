# Foundation Contract

Foundation work is structural preparation for future modules.

Foundation is not implementation of deferred behavior.

## Foundation May Create

- interface
- type
- schema
- contract
- stub
- adapter seam
- test seam
- placeholder without real behavior

## Foundation Must Not

- implement deferred business behavior
- perform real external connection
- create production side effects
- complete out-of-scope UI flow
- silently promote deferred to selected
- implement actual print, eject, or firmware behavior
- implement real Ethernet discovery when Ethernet is deferred

## Validation Rules

- If a foundation item has `implementationBehavior: true`, fail.
- If a foundation task adds external SDK calls, fail or require human review.
- If a foundation stub has real side effects, fail.
- If foundation implements deferred feature business logic, fail.

