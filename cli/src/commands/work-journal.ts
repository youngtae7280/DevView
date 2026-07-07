import { renderWorkJournalFile } from '../core/work-journal.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode, issue } from '../core/types.js'
import type { CommandContext } from './shared.js'
import { invalidCommand } from './shared.js'

export async function workJournalRenderCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.runId) {
    return invalidCommand('work-journal render requires --run-id <id>.')
  }
  if (!context.options.baseline) {
    return invalidCommand('work-journal render requires --baseline <baselineFreezeJson>.')
  }
  if (!context.options.output) {
    return invalidCommand('work-journal render requires --output <indexHtml>.')
  }
  if (!context.options.dataOutput) {
    return invalidCommand('work-journal render requires --data-output <indexDataJson>.')
  }
  if (!context.options.runOutput) {
    return invalidCommand('work-journal render requires --run-output <runJson>.')
  }

  try {
    const result = await renderWorkJournalFile(context.options.root, {
      runId: context.options.runId,
      title: context.options.title ?? context.options.summary,
      baseline: context.options.baseline,
      graphSource: context.options.graphSource,
      viewTree: context.options.viewTree,
      contractInput: context.options.contractInput,
      instructionPack: context.options.instructionPack,
      extensionReadiness: context.options.extensionReadiness,
      extensionProfileCatalog: context.options.extensionProfileCatalog,
      extensionContextPlan: context.options.extensionContextPlan,
      runtimeEvidenceSatisfactionReadiness: context.options.runtimeEvidenceSatisfactionReadiness,
      runtimeEvidenceSatisfactionRecord: context.options.runtimeEvidenceSatisfactionRecord,
      equivalenceProofReadiness: context.options.equivalenceProofReadiness,
      equivalenceProofRecord: context.options.equivalenceProofRecord,
      scopeCiEnforcementReadiness: context.options.scopeCiEnforcementReadiness,
      scopeCiEnforcementRecord: context.options.scopeCiEnforcementRecord,
      guardedGraphUpdateBoundaryRecord: context.options.guardedGraphUpdateBoundaryRecord,
      guardedGraphUpdateApplyPlan: context.options.guardedGraphUpdateApplyPlan,
      guardedGraphUpdateApplyReport: context.options.guardedGraphUpdateApplyReport,
      proposal: context.options.proposal,
      applyReport: context.options.applyReport,
      output: context.options.output,
      dataOutput: context.options.dataOutput,
      runOutput: context.options.runOutput,
    })

    return {
      ok: true,
      command: 'work-journal render',
      exitCode: ExitCode.Success,
      message: 'DevView Work Journal static HTML and data preview generated without execution or authority promotion.',
      issues: [],
      data: {
        artifactRole: result.journal.artifactRole,
        htmlArtifactRole: result.journal.htmlArtifactRole,
        status: result.journal.status,
        currentRunId: result.journal.currentRunId,
        outputPath: result.outputPath,
        dataOutputPath: result.dataOutputPath,
        runOutputPath: result.runOutputPath,
        safetyFlags: result.journal.safetyFlags,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'work-journal render',
      exitCode: ExitCode.ValidationFailed,
      message: 'DevView Work Journal rendering could not run.',
      issues: [
        issue({
          validator: 'DevViewWorkJournal',
          code: 'DEVVIEW_WORK_JOURNAL_RENDER_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide readable source artifacts and dedicated Work Journal HTML/data/run output paths under a generated output directory.',
        }),
      ],
    }
  }
}
