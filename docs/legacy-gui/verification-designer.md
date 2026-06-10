# Verification Designer

VD turns work design into a validation plan Codex can follow after implementation.

## Bottom-Up Generation

1. Generate VerificationDesign records for each leaf WorkDesign.
2. Synthesize parent VerificationDesign records from child verification plans.
3. Generate the root AcceptancePlan.

## VerificationDesign Contents

Each VerificationDesign includes:

- verificationGoal
- testIdeas
- validationCommands
- evidenceRequired
- regressionRisks
- manualChecks
- parentIntegrationChecks
- acceptanceCriteria
- failureRecoveryNotes
- summary

## Completion Gate

VD can generate ACEP when all confirmed leaves have VerificationDesigns and the root AcceptancePlan exists.
