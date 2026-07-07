import { BenchmarkComparisonValidationError, summarizeBenchmarkComparison } from '../core/benchmark-comparison.js'
import { BenchmarkEvaluationValidationError, evaluateBenchmarkResult } from '../core/benchmark-evaluation.js'
import { BenchmarkSuiteLockValidationError, lockBenchmarkSuite } from '../core/benchmark-suite-lock.js'
import { GraphifyImportValidationError, validateGraphifyImport } from '../core/graphify-import-validation.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode, issue } from '../core/types.js'
import type { CommandContext } from './shared.js'

export async function benchmarkEvaluateResultCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await evaluateBenchmarkResult(context.options.root, {
      benchmarkSuite: context.options.benchmarkSuite,
      task: context.options.task,
      goldenAnswer: context.options.goldenAnswer,
      candidateResult: context.options.candidateResult,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'benchmark evaluate-result',
      exitCode: ExitCode.Success,
      message: 'Benchmark candidate result evaluated against the golden answer without executing benchmarks.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof BenchmarkEvaluationValidationError) {
      const report = error.report
      const errorFindings = report.findings.filter((finding) => finding.severity === 'error')
      return {
        ok: false,
        command: 'benchmark evaluate-result',
        exitCode: ExitCode.ValidationFailed,
        message: 'Benchmark evaluation is blocked before any benchmark execution.',
        issues: errorFindings.map((finding) =>
          issue({
            validator: 'BenchmarkEvaluation',
            code: finding.code,
            severity: finding.severity,
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide matching benchmark suite, task, golden answer, and stored candidate result artifacts with report-only safety flags false.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'benchmark evaluate-result',
      exitCode: ExitCode.ValidationFailed,
      message: 'Benchmark evaluation could not run.',
      issues: [
        issue({
          validator: 'BenchmarkEvaluation',
          code: 'BENCHMARK_EVALUATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Write benchmark evaluation output to a dedicated report path outside source/control artifacts and rerun the command.',
        }),
      ],
    }
  }
}

export async function benchmarkValidateGraphifyImportCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await validateGraphifyImport(context.options.root, {
      graphifyExport: context.options.graphifyExport,
      mapping: context.options.mapping,
      benchmarkTask: context.options.benchmarkTask,
      goldenAnswer: context.options.goldenAnswer,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'benchmark validate-graphify-import',
      exitCode: ExitCode.Success,
      message: 'Static Graphify import fixture validated without live Graphify execution.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof GraphifyImportValidationError) {
      const report = error.report
      const errorFindings = report.protocolFindings.filter((finding) => finding.severity === 'error')
      return {
        ok: false,
        command: 'benchmark validate-graphify-import',
        exitCode: ExitCode.ValidationFailed,
        message: 'Graphify import validation is blocked before any live Graphify activity.',
        issues: errorFindings.map((finding) =>
          issue({
            validator: 'GraphifyImportValidation',
            code: finding.code,
            severity: finding.severity,
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide static Graphify export and mapping fixtures with valid nodes/edges, no execution instructions, and report-only safety flags false.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'benchmark validate-graphify-import',
      exitCode: ExitCode.ValidationFailed,
      message: 'Graphify import validation could not run.',
      issues: [
        issue({
          validator: 'GraphifyImportValidation',
          code: 'GRAPHIFY_IMPORT_VALIDATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --graphify-export, --mapping, and --output paths, then write outputs outside source/control artifacts.',
        }),
      ],
    }
  }
}

export async function benchmarkSummarizeComparisonCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await summarizeBenchmarkComparison(context.options.root, {
      evaluations: context.options.evaluations,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'benchmark summarize-comparison',
      exitCode: ExitCode.Success,
      message: 'Benchmark evaluation reports summarized into a report-only comparison matrix.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof BenchmarkComparisonValidationError) {
      const report = error.report
      const errorFindings = report.findings.filter((finding) => finding.severity === 'error')
      return {
        ok: false,
        command: 'benchmark summarize-comparison',
        exitCode: ExitCode.ValidationFailed,
        message: 'Benchmark comparison summary is blocked before any benchmark execution.',
        issues: errorFindings.map((finding) =>
          issue({
            validator: 'BenchmarkComparison',
            code: finding.code,
            severity: finding.severity,
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide scored benchmark evaluation reports with report-only safety flags false and write the comparison summary to a dedicated report path.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'benchmark summarize-comparison',
      exitCode: ExitCode.ValidationFailed,
      message: 'Benchmark comparison summary could not run.',
      issues: [
        issue({
          validator: 'BenchmarkComparison',
          code: 'BENCHMARK_COMPARISON_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide comma-separated or repeated --evaluations inputs and write outputs outside source/control artifacts.',
        }),
      ],
    }
  }
}

export async function benchmarkLockSuiteCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const manifest = await lockBenchmarkSuite(context.options.root, {
      benchmarkSuite: context.options.benchmarkSuite,
      tasks: context.options.tasks,
      goldenAnswers: context.options.goldenAnswers,
      candidateResults: context.options.candidateResults,
      evaluations: context.options.evaluations,
      comparisonSummary: context.options.comparisonSummary,
      graphifyImportValidations: context.options.graphifyImportValidations,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'benchmark lock-suite',
      exitCode: ExitCode.Success,
      message: 'Benchmark suite source artifacts locked into a report-only attestation manifest.',
      issues: [],
      data: { ...manifest },
    }
  } catch (error) {
    if (error instanceof BenchmarkSuiteLockValidationError) {
      const manifest = error.manifest
      const errorFindings = manifest.findings.filter((finding) => finding.severity === 'error')
      return {
        ok: false,
        command: 'benchmark lock-suite',
        exitCode: ExitCode.ValidationFailed,
        message: 'Benchmark suite lock is blocked before any benchmark execution.',
        issues: errorFindings.map((finding) =>
          issue({
            validator: 'BenchmarkSuiteLock',
            code: finding.code,
            severity: finding.severity,
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide matching benchmark suite, task, golden answer, candidate, evaluation, comparison, and Graphify validation artifacts with report-only safety flags false.',
          }),
        ),
        data: { ...manifest },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'benchmark lock-suite',
      exitCode: ExitCode.ValidationFailed,
      message: 'Benchmark suite lock could not run.',
      issues: [
        issue({
          validator: 'BenchmarkSuiteLock',
          code: 'BENCHMARK_SUITE_LOCK_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide the benchmark source artifact set and write the lock manifest outside source/control artifacts.',
        }),
      ],
    }
  }
}
