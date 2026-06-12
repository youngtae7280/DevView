import { getAutoflow, getOpenBlockingDecisions, loadProject } from '../core/project.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode, issue } from '../core/types.js'
import type { CommandContext } from './shared.js'

export async function statusCommand(context: CommandContext): Promise<CommandResult> {
  const { project, issues } = await loadProject(context.options.root)
  if (!project.initialized || !project.state) {
    return {
      ok: false,
      command: 'status',
      exitCode: issues.length > 0 ? ExitCode.SchemaError : ExitCode.NotInitialized,
      message: 'PBE project is not initialized.',
      issues:
        issues.length > 0
          ? issues
          : [
              issue({
                validator: 'Project',
                code: 'PBE_NOT_INITIALIZED',
                severity: 'error',
                message: '.pbe/blueprint/pbe-state.json was not found.',
                suggestedFix: 'Run `pbe init --profile full --brief "..."` in the target project.',
              }),
            ],
      data: {
        initialized: false,
      },
    }
  }

  const autoflow = getAutoflow(project.state)
  const openDecisions = getOpenBlockingDecisions(project.decisionQueue)
  const stateHistory = Array.isArray(autoflow.stateHistory)
    ? autoflow.stateHistory.filter(
        (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null,
      )
    : []
  const lastTransition = stateHistory.length > 0 ? stateHistory[stateHistory.length - 1] : null
  return {
    ok: true,
    command: 'status',
    exitCode: ExitCode.Success,
    message: [
      'PBE Status',
      '',
      `Initialized: yes`,
      `Profile: ${String(autoflow.profile || 'unknown')}`,
      `Autoflow state: ${String(autoflow.state || 'unknown')}`,
      `Current gate: ${String(autoflow.currentGate || 'none')}`,
      `Next step: ${String(autoflow.nextStep || 'unknown')}`,
      `Last transition: ${formatTransition(lastTransition)}`,
      `Open blocking decisions: ${openDecisions.length}`,
    ].join('\n'),
    issues,
    data: {
      initialized: true,
      profile: autoflow.profile || null,
      state: autoflow.state || null,
      currentGate: autoflow.currentGate || null,
      nextStep: autoflow.nextStep || null,
      stateHistoryCount: stateHistory.length,
      lastTransition,
      openBlockingDecisions: openDecisions,
      artifacts: project.state.artifacts || {},
    },
  }
}

function formatTransition(entry: Record<string, unknown> | null): string {
  if (!entry) {
    return 'none'
  }
  return `${String(entry.from || '?')} -> ${String(entry.to || '?')} via ${String(entry.command || '?')}`
}
