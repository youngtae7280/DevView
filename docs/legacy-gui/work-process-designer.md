# Work Process Designer

WPD converts the RPD requirement tree into Codex-executable work design.

## Bottom-Up Generation

1. Generate WorkDesign records for each `confirmed_leaf`.
2. Synthesize parent WorkDesign records from child designs.
3. Synthesize a root WorkDesign when possible.
4. Generate the ImplementationRoadmap.

## WorkDesign Contents

Each WorkDesign includes:

- goal
- context
- scope
- nonScope
- expectedOutputs
- implementationTasks
- dependencies
- commonPrerequisites
- integrationTasks
- acceptanceCriteria
- suggestedCycleSize
- humanReviewNotes
- stopConditions
- summary

## Completion Gate

WPD can move to VD when all confirmed leaves have WorkDesigns, every WorkDesign has required scope and stop criteria, and an ImplementationRoadmap exists.
