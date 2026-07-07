import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { analyzeRequestFile, analyzeRequestWithDisabledProvider } from '../core/ai-request-analyzer-run'
import { createOpenAiAnalyzerProviderAdapter } from '../core/ai-request-analyzer-openai-provider-adapter'
import { validateRequestIrCandidateSchemaOnly } from '../core/request-ir-candidate-validator'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())
const requestText = 'Add Todo App runtime evidence for the add button behavior without touching production source.'

afterEach(() => {
  cleanupWorkspaces()
})

describe('AI Request Analyzer command surface core', () => {
  it('returns provider-disabled blocked result without LLM calls or candidate generation', () => {
    const result = analyzeRequestWithDisabledProvider(requestText, validAnalyzerPack())

    expect(result.status).toBe('ai-request-analyzer-provider-disabled')
    expect(result.analyzerProviderStatus).toBe('provider-disabled')
    expect(result.llmInvoked).toBe(false)
    expect(result.networkCallsAllowed).toBe(false)
    expect(result.requestIrCandidateGenerated).toBe(false)
    expect(result.candidateImportRequired).toBe(true)
    expect(result.graphTraversalAllowed).toBe(false)
    expect(result.contractInputGenerated).toBe(false)
    expect(result.instructionPackGenerated).toBe(false)
    expect(result.validationFindings.map((finding) => finding.code)).toContain('AI_REQUEST_ANALYZER_PROVIDER_DISABLED')
  })

  it('imports an explicit candidate as candidate-only without provider invocation', () => {
    const result = analyzeRequestWithDisabledProvider(requestText, validAnalyzerPack(), validRequestIrCandidate(), {
      packPath: 'pack.json',
      externalCandidatePath: 'external-candidate.json',
      outputPath: '.tmp/imported-candidate.json',
    })

    expect(result.status).toBe('ai-request-analyzer-external-candidate-imported')
    expect(result.requestIrCandidateGenerated).toBe(true)
    expect(result.analyzerProviderStatus).toBe('external-candidate-imported-provider-not-invoked')
    expect(result.llmInvoked).toBe(false)
    expect(result.importedCandidate?.artifactRole).toBe('request-ir-candidate')
    expect(result.importedCandidate?.requestIrCandidateStatus).toBe('candidate-only')
    expect(result.importedCandidate?.authorityStatus).toBe('not-authoritative-until-validated')
    expect(result.importedCandidate?.graphTraversalAllowed).toBe(false)
    expect(result.importedCandidate?.contractGenerationAllowed).toBe(false)
    expect(result.importedCandidate?.instructionPackGenerationAllowed).toBe(false)
    expect(result.importedCandidate?.validationRequiredBeforeTraversal).toBe(true)

    const validation = validateRequestIrCandidateSchemaOnly(result.importedCandidate)
    expect(validation.requestIrValidationStatus).toBe('schema-valid-graph-validation-not-run')
    expect(validation.graphTraversalAllowed).toBe(false)
  })
})

describe('AI Request Analyzer command surface CLI', () => {
  it('writes a provider-disabled run report without candidate output authority', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    const outputPath = join('.tmp', 'provider-disabled.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)
    const written = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.analyzerProviderStatus).toBe('provider-disabled')
    expect(written.artifactRole).toBe('ai-request-analyzer-run-result')
    expect(written.requestIrCandidateGenerated).toBe(false)
    expect(written.writtenOutputArtifactRole).toBe('ai-request-analyzer-run-result')
    expect(written.llmInvoked).toBe(false)
  })

  it('reads disabled provider config and writes import-required run report without invocation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('disabled'))
    const outputPath = join('.tmp', 'provider-config-disabled.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)
    const written = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.analyzerProviderStatus).toBe('provider-disabled')
    expect(written.sourceProviderConfig).toBe('provider-config.json')
    expect(written.providerState).toBe('disabled')
    expect(written.providerInvocationAuthority).toBe('none-preview-only')
    expect(written.providerInvocationSkipped).toBe(true)
    expect(written.candidateImportRequired).toBe(true)
    expect(written.llmInvoked).toBe(false)
    expect(written.networkCallsAllowed).toBe(false)
    expect(written.requestIrCandidateGenerated).toBe(false)
  })

  it('reports unavailable provider config as import-required without candidate output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('unavailable'))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.analyzerProviderStatus).toBe('provider-unavailable')
    expect(payload.providerState).toBe('unavailable')
    expect(payload.candidateImportRequired).toBe(true)
    expect(payload.llmInvoked).toBe(false)
    expect(payload.networkCallsAllowed).toBe(false)
    expect(payload.requestIrCandidateGenerated).toBe(false)
  })

  it('blocks configured-not-invoked provider config without invoking a provider', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-not-invoked'))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.analyzerProviderStatus).toBe('provider-configured-not-invoked')
    expect(payload.providerState).toBe('configured-not-invoked')
    expect(payload.analyzerProviderConfigured).toBe(true)
    expect(payload.providerInvocationSkipped).toBe(true)
    expect(payload.llmInvoked).toBe(false)
    expect(payload.networkCallsAllowed).toBe(false)
    expect(payload.requestIrCandidateGenerated).toBe(false)
  })

  it('blocks secret-looking provider config before writing output', async () => {
    const workspace = createWorkspace()
    const runtimeSecretLikeValue = ['sk', 'thisisnotarealkey123456'].join('-')
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), {
      ...validProviderConfig('disabled'),
      apiKeyValue: runtimeSecretLikeValue,
    })
    const outputPath = join('.tmp', 'provider-config-disabled.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_PROVIDER_CONFIG_SECRET_VALUE_BLOCKED',
    )
    expect(existsSync(join(workspace, outputPath))).toBe(false)
  })

  it('does not keep tracked secret-looking provider literals in this test source', () => {
    const sourceText = readFileSync(new URL(import.meta.url), 'utf8')

    expect(sourceText).not.toMatch(/sk-[A-Za-z0-9_-]{12,}/)
  })

  it('imports an explicit external candidate and writes a candidate-only output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'external-candidate.json'), validRequestIrCandidate())
    const outputPath = join('.tmp', 'imported-candidate.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--external-candidate',
        'external-candidate.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.requestIrCandidateGenerated).toBe(true)
    expect(written.artifactRole).toBe('request-ir-candidate')
    expect(written.analyzerProviderStatus).toBe('external-candidate-imported-provider-not-invoked')
    expect(written.llmInvoked).toBe(false)
    expect(written.graphTraversalAllowed).toBe(false)
    expect(written.contractGenerationAllowed).toBe(false)
    expect(written.instructionPackGenerationAllowed).toBe(false)
  })

  it('imports an external candidate with safe provider config and records invocation skipped', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-not-invoked'))
    writeJson(join(workspace, 'external-candidate.json'), validRequestIrCandidate())
    const outputPath = join('.tmp', 'imported-candidate.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--external-candidate',
        'external-candidate.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.requestIrCandidateGenerated).toBe(true)
    expect(written.artifactRole).toBe('request-ir-candidate')
    expect(written.sourceProviderConfig).toBe('provider-config.json')
    expect(written.providerState).toBe('configured-not-invoked')
    expect(written.providerInvocationAuthority).toBe('none-preview-only')
    expect(written.providerInvocationSkipped).toBe(true)
    expect(written.llmInvoked).toBe(false)
    expect(written.networkCallsAllowed).toBe(false)
    expect(written.graphTraversalAllowed).toBe(false)
  })

  it('generates candidate-only output from a mock provider response without network calls', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-invocation-enabled-preview'))
    writeJson(join(workspace, 'mock-provider-response.json'), validMockProviderResponse())
    const outputPath = join('.tmp', 'mock-provider-candidate.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--invoke-provider',
        '--mock-provider-response',
        'mock-provider-response.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.analyzerProviderStatus).toBe('mock-provider-candidate-generated-no-network')
    expect(payload.requestIrCandidateGenerated).toBe(true)
    expect(written.artifactRole).toBe('request-ir-candidate')
    expect(written.status).toBe('request-ir-candidate-mock-provider-previewed')
    expect(written.sourceMockProviderResponse).toBe('mock-provider-response.json')
    expect(written.providerInvocationMode).toBe('mock-no-network')
    expect(written.providerInvocationAuthority).toBe('mock-only-no-network')
    expect(written.llmInvoked).toBe(false)
    expect(written.networkCallsAllowed).toBe(false)
    expect(written.graphTraversalAllowed).toBe(false)
    expect(written.contractGenerationAllowed).toBe(false)
    expect(written.instructionPackGenerationAllowed).toBe(false)

    const validation = validateRequestIrCandidateSchemaOnly(written)
    expect(validation.requestIrValidationStatus).toBe('schema-valid-graph-validation-not-run')
    expect(validation.graphTraversalAllowed).toBe(false)
  })

  it('blocks --invoke-provider without a mock provider response and writes no output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-invocation-enabled-preview'))
    const outputPath = join('.tmp', 'mock-provider-candidate.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--invoke-provider',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_MOCK_PROVIDER_RESPONSE_REQUIRED',
    )
    expect(payload.llmInvoked).toBe(false)
    expect(payload.networkCallsAllowed).toBe(false)
    expect(existsSync(join(workspace, outputPath))).toBe(false)
  })

  it('blocks external candidate import combined with provider invocation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-invocation-enabled-preview'))
    writeJson(join(workspace, 'external-candidate.json'), validRequestIrCandidate())
    writeJson(join(workspace, 'mock-provider-response.json'), validMockProviderResponse())
    const outputPath = join('.tmp', 'candidate.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--external-candidate',
        'external-candidate.json',
        '--invoke-provider',
        '--mock-provider-response',
        'mock-provider-response.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_EXTERNAL_CANDIDATE_WITH_PROVIDER_INVOCATION_BLOCKED',
    )
    expect(existsSync(join(workspace, outputPath))).toBe(false)
  })

  it('blocks disabled provider config with provider invocation', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('disabled'))
    writeJson(join(workspace, 'mock-provider-response.json'), validMockProviderResponse())
    const outputPath = join('.tmp', 'candidate.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--invoke-provider',
        '--mock-provider-response',
        'mock-provider-response.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_PROVIDER_INVOCATION_STATE_BLOCKED',
    )
    expect(existsSync(join(workspace, outputPath))).toBe(false)
  })

  it('blocks OpenAI live config invocation because the live adapter is unavailable', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-openai-invocation-enabled'))
    const outputPath = join('.tmp', 'candidate.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--invoke-provider',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.analyzerProviderStatus).toBe('provider-future-invocation-blocked')
    expect(payload.providerState).toBe('configured-openai-invocation-enabled')
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_OPENAI_PROVIDER_ADAPTER_UNAVAILABLE',
    )
    expect(payload.llmInvoked).toBe(false)
    expect(payload.networkCallsAllowed).toBe(false)
    expect(payload.runtimeAiCallsAllowed).toBe(false)
    expect(payload.requestIrCandidateGenerated).toBe(false)
    expect(existsSync(join(workspace, outputPath))).toBe(true)
    const writtenOutput = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))
    expect(writtenOutput.artifactRole).toBe('ai-request-analyzer-run-result')
    expect(writtenOutput.status).toBe('ai-request-analyzer-provider-future-invocation-blocked')
    expect(writtenOutput.writtenOutputArtifactRole).toBe('ai-request-analyzer-run-result')
    expect(writtenOutput.requestIrCandidateGenerated).toBe(false)
    expect(writtenOutput.llmInvoked).toBe(false)
    expect(writtenOutput.networkCallsAllowed).toBe(false)
    expect(writtenOutput.runtimeAiCallsAllowed).toBe(false)
  })

  it('blocks provider-mode openai without the explicit network gate', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-openai-invocation-enabled'))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--invoke-provider',
        '--provider-mode',
        'openai',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_OPENAI_MODE_REQUIRES_NETWORK_GATE',
    )
  })

  it('blocks the network gate without provider-mode openai', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-openai-invocation-enabled'))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--invoke-provider',
        '--allow-network-provider',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_NETWORK_GATE_WITHOUT_OPENAI_MODE_BLOCKED',
    )
  })

  it('blocks unsupported provider-mode values', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-openai-invocation-enabled'))

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--invoke-provider',
        '--allow-network-provider',
        '--provider-mode',
        'other',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_PROVIDER_MODE_UNSUPPORTED',
    )
  })

  it('blocks provider-mode openai combined with a mock provider response', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-openai-invocation-enabled'))
    writeJson(join(workspace, 'mock-provider-response.json'), validMockProviderResponse())

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--invoke-provider',
        '--allow-network-provider',
        '--provider-mode',
        'openai',
        '--mock-provider-response',
        'mock-provider-response.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_OPENAI_MODE_WITH_MOCK_RESPONSE_BLOCKED',
    )
  })

  it('writes candidate-only output from gated OpenAI mode with a mocked SDK client', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-openai-invocation-enabled'))
    const outputPath = join('.tmp', 'openai-candidate.json')
    let requestPayload: Record<string, unknown> | null = null
    const adapter = createOpenAiAnalyzerProviderAdapter({
      envReader: (name) => (name === 'OPENAI_API_KEY' ? 'test-runtime-key' : undefined),
      clientFactory: () => ({
        responses: {
          create: async (payload) => {
            requestPayload = payload
            return { output_text: JSON.stringify(validRequestIrCandidate()) }
          },
        },
      }),
    })

    const run = await analyzeRequestFile(workspace, requestText, 'pack.json', {
      providerConfig: 'provider-config.json',
      invokeProvider: true,
      allowNetworkProvider: true,
      providerMode: 'openai',
      output: outputPath,
      openAiAdapter: adapter,
    })
    const writtenOutput = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))
    const validation = validateRequestIrCandidateSchemaOnly(writtenOutput)

    expect(run.result.status).toBe('ai-request-analyzer-openai-provider-candidate-generated')
    expect(run.result.llmInvoked).toBe(true)
    expect(run.result.networkCallsAllowed).toBe(true)
    expect(run.result.runtimeAiCallsAllowed).toBe(true)
    expect(requestPayload?.store).toBe(false)
    expect(writtenOutput.artifactRole).toBe('request-ir-candidate')
    expect(writtenOutput.status).toBe('request-ir-candidate-openai-provider-previewed')
    expect(writtenOutput.candidateOnly).toBe(true)
    expect(writtenOutput.graphTraversalAllowed).toBe(false)
    expect(writtenOutput.contractGenerationAllowed).toBe(false)
    expect(writtenOutput.instructionPackGenerationAllowed).toBe(false)
    expect(validation.schemaValidationStatus).toBe('schema-valid')
    expect(validation.graphTraversalAllowed).toBe(false)
    expect(validation.contractGenerationAllowed).toBe(false)
    expect(validation.instructionPackGenerationAllowed).toBe(false)
  })

  it('blocks gated OpenAI mode when the configured environment variable is missing before SDK calls', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-openai-invocation-enabled'))
    let clientFactoryCalled = false
    const adapter = createOpenAiAnalyzerProviderAdapter({
      envReader: () => undefined,
      clientFactory: () => {
        clientFactoryCalled = true
        throw new Error('client factory should not be called')
      },
    })

    const run = await analyzeRequestFile(workspace, requestText, 'pack.json', {
      providerConfig: 'provider-config.json',
      invokeProvider: true,
      allowNetworkProvider: true,
      providerMode: 'openai',
      output: join('.tmp', 'openai-run-result.json'),
      openAiAdapter: adapter,
    })

    expect(run.result.status).toBe('ai-request-analyzer-openai-provider-blocked')
    expect(run.result.validationFindings.map((entry) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_OPENAI_API_KEY_ENV_MISSING',
    )
    expect(run.result.requestIrCandidateGenerated).toBe(false)
    expect(run.result.llmInvoked).toBe(false)
    expect(clientFactoryCalled).toBe(false)
  })

  it('blocks invalid OpenAI structured output before candidate output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-openai-invocation-enabled'))
    const adapter = createOpenAiAnalyzerProviderAdapter({
      envReader: (name) => (name === 'OPENAI_API_KEY' ? 'test-runtime-key' : undefined),
      clientFactory: () => ({
        responses: {
          create: async () => ({ output_text: 'not-json' }),
        },
      }),
    })

    const run = await analyzeRequestFile(workspace, requestText, 'pack.json', {
      providerConfig: 'provider-config.json',
      invokeProvider: true,
      allowNetworkProvider: true,
      providerMode: 'openai',
      output: join('.tmp', 'openai-run-result.json'),
      openAiAdapter: adapter,
    })

    expect(run.result.status).toBe('ai-request-analyzer-openai-provider-blocked')
    expect(run.result.validationFindings.map((entry) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_OPENAI_RESPONSE_INVALID_JSON',
    )
    expect(run.result.requestIrCandidateGenerated).toBe(false)
    expect(run.result.llmInvoked).toBe(true)
  })

  it('blocks unsafe authority fields from mocked OpenAI output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-openai-invocation-enabled'))
    const unsafeCandidate = {
      ...validRequestIrCandidate(),
      graphTraversalAllowed: true,
    }
    const adapter = createOpenAiAnalyzerProviderAdapter({
      envReader: (name) => (name === 'OPENAI_API_KEY' ? 'test-runtime-key' : undefined),
      clientFactory: () => ({
        responses: {
          create: async () => ({ output_text: JSON.stringify(unsafeCandidate) }),
        },
      }),
    })

    const run = await analyzeRequestFile(workspace, requestText, 'pack.json', {
      providerConfig: 'provider-config.json',
      invokeProvider: true,
      allowNetworkProvider: true,
      providerMode: 'openai',
      output: join('.tmp', 'openai-run-result.json'),
      openAiAdapter: adapter,
    })

    expect(run.result.status).toBe('ai-request-analyzer-openai-provider-blocked')
    expect(run.result.validationFindings.map((entry) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_OPENAI_PROVIDER_CANDIDATE_AUTHORITY_ESCALATION',
    )
    expect(run.result.requestIrCandidateGenerated).toBe(false)
  })

  it('redacts OpenAI provider errors', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-openai-invocation-enabled'))
    const runtimeSecretLikeValue = ['sk', 'thisisnotarealkey123456'].join('-')
    const adapter = createOpenAiAnalyzerProviderAdapter({
      envReader: (name) => (name === 'OPENAI_API_KEY' ? 'test-runtime-key' : undefined),
      clientFactory: () => ({
        responses: {
          create: async () => {
            throw new Error(`provider failed with ${runtimeSecretLikeValue}`)
          },
        },
      }),
    })

    const run = await analyzeRequestFile(workspace, requestText, 'pack.json', {
      providerConfig: 'provider-config.json',
      invokeProvider: true,
      allowNetworkProvider: true,
      providerMode: 'openai',
      output: join('.tmp', 'openai-run-result.json'),
      openAiAdapter: adapter,
    })
    const rendered = JSON.stringify(run.result)

    expect(run.result.status).toBe('ai-request-analyzer-openai-provider-blocked')
    expect(run.result.validationFindings.map((entry) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_OPENAI_PROVIDER_ERROR',
    )
    expect(rendered).not.toContain(runtimeSecretLikeValue)
    expect(rendered).toContain('<redacted-secret>')
  })

  it('blocks invalid mock provider response before writing output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-invocation-enabled-preview'))
    writeJson(join(workspace, 'mock-provider-response.json'), {
      ...validMockProviderResponse(),
      status: 'wrong-status',
    })
    const outputPath = join('.tmp', 'candidate.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--invoke-provider',
        '--mock-provider-response',
        'mock-provider-response.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_MOCK_PROVIDER_RESPONSE_MISMATCH',
    )
    expect(existsSync(join(workspace, outputPath))).toBe(false)
  })

  it('blocks unsafe authority fields in mock provider candidate before writing output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-invocation-enabled-preview'))
    writeJson(join(workspace, 'mock-provider-response.json'), {
      ...validMockProviderResponse(),
      candidate: {
        ...validRequestIrCandidate(),
        graphTraversalAllowed: true,
      },
    })
    const outputPath = join('.tmp', 'candidate.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--invoke-provider',
        '--mock-provider-response',
        'mock-provider-response.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_MOCK_PROVIDER_RESPONSE_AUTHORITY_ESCALATION',
    )
    expect(existsSync(join(workspace, outputPath))).toBe(false)
  })

  it('blocks mock provider candidate request text mismatch', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-invocation-enabled-preview'))
    writeJson(join(workspace, 'mock-provider-response.json'), {
      ...validMockProviderResponse(),
      candidate: {
        ...validRequestIrCandidate(),
        requestText: 'Different request.',
        sourceNaturalLanguageRequest: {
          sourceKind: 'human-natural-language-request',
          language: 'en',
          text: 'Different request.',
        },
      },
    })
    const outputPath = join('.tmp', 'candidate.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--invoke-provider',
        '--mock-provider-response',
        'mock-provider-response.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_MOCK_PROVIDER_CANDIDATE_REQUEST_MISMATCH',
    )
    expect(existsSync(join(workspace, outputPath))).toBe(false)
  })

  it('blocks mock provider candidate schema mismatch', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-invocation-enabled-preview'))
    writeJson(join(workspace, 'mock-provider-response.json'), {
      ...validMockProviderResponse(),
      candidate: {
        ...validRequestIrCandidate(),
        schemaId: 'wrong-schema',
      },
    })
    const outputPath = join('.tmp', 'candidate.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--invoke-provider',
        '--mock-provider-response',
        'mock-provider-response.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_MOCK_PROVIDER_CANDIDATE_SCHEMA_MISMATCH',
    )
    expect(existsSync(join(workspace, outputPath))).toBe(false)
  })

  it('blocks output that would overwrite mock provider response and leaves it unchanged', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('configured-invocation-enabled-preview'))
    writeJson(join(workspace, 'mock-provider-response.json'), validMockProviderResponse())
    const mockResponseBefore = readFileSync(join(workspace, 'mock-provider-response.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--invoke-provider',
        '--mock-provider-response',
        'mock-provider-response.json',
        '--output',
        'mock-provider-response.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.issues[0].message).toContain('would overwrite the source mock provider response')
    expect(readFileSync(join(workspace, 'mock-provider-response.json'), 'utf8')).toBe(mockResponseBefore)
  })

  it('blocks unsafe provider config even when external candidate is provided', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('blocked-invalid-config'))
    writeJson(join(workspace, 'external-candidate.json'), validRequestIrCandidate())
    const outputPath = join('.tmp', 'imported-candidate.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--external-candidate',
        'external-candidate.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.analyzerProviderStatus).toBe('provider-config-blocked')
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_ANALYZER_PROVIDER_CONFIG_BLOCKED_INVALID',
    )
    expect(existsSync(join(workspace, outputPath))).toBe(false)
  })

  it('blocks an external candidate whose request text differs and writes no output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'external-candidate.json'), {
      ...validRequestIrCandidate(),
      requestText: 'Change production source.',
      sourceNaturalLanguageRequest: {
        sourceKind: 'human-natural-language-request',
        language: 'en',
        text: 'Change production source.',
      },
    })
    const outputPath = join('.tmp', 'imported-candidate.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--external-candidate',
        'external-candidate.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_EXTERNAL_CANDIDATE_REQUEST_MISMATCH',
    )
    expect(existsSync(join(workspace, outputPath))).toBe(false)
  })

  it('blocks external candidate authority escalation and writes no output', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'external-candidate.json'), {
      ...validRequestIrCandidate(),
      graphTraversalAllowed: true,
    })
    const outputPath = join('.tmp', 'imported-candidate.json')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--external-candidate',
        'external-candidate.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues.map((entry: { code: string }) => entry.code)).toContain(
      'AI_REQUEST_EXTERNAL_CANDIDATE_AUTHORITY_ESCALATION',
    )
    expect(existsSync(join(workspace, outputPath))).toBe(false)
  })

  it('blocks output that would overwrite the analyzer pack and leaves it unchanged', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'external-candidate.json'), validRequestIrCandidate())
    const packBefore = readFileSync(join(workspace, 'pack.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--external-candidate',
        'external-candidate.json',
        '--output',
        'pack.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source AI Request Analyzer Pack')
    expect(readFileSync(join(workspace, 'pack.json'), 'utf8')).toBe(packBefore)
  })

  it('blocks output that would overwrite provider config and leaves it unchanged', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'pack.json'), validAnalyzerPack())
    writeJson(join(workspace, 'provider-config.json'), validProviderConfig('disabled'))
    const providerConfigBefore = readFileSync(join(workspace, 'provider-config.json'), 'utf8')

    const result = await runDevViewCli(
      [
        'graph',
        'read-model',
        'analyze-request',
        '--request',
        requestText,
        '--pack',
        'pack.json',
        '--provider-config',
        'provider-config.json',
        '--output',
        'provider-config.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source AI Request Analyzer provider config')
    expect(readFileSync(join(workspace, 'provider-config.json'), 'utf8')).toBe(providerConfigBefore)
  })
})

function validAnalyzerPack(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'ai-request-analyzer-pack',
    status: 'ai-request-analyzer-pack-generated',
    analyzerPackGenerated: true,
    analyzerImplemented: false,
    llmInvoked: false,
    networkCallsAllowed: false,
    runtimeAiCallsAllowed: false,
    requestIrCandidateGenerated: false,
    candidateOnly: true,
    candidateAuthorityStatus: 'ai-generated-candidate-not-validated',
    requestIrAuthorityStatus: 'not-authoritative-until-validated',
    expectedOutputArtifactRole: 'request-ir-candidate',
    expectedOutputSchemaId: 'devview-request-ir-candidate-v0-preview',
    expectedOutputSchemaArtifact: 'schema.json',
    validationChainRequiredBeforeTraversal: [
      {
        step: 'schema-only-request-ir-validation',
        command: 'graph read-model validate-request-ir --candidate <candidatePath> --json',
      },
    ],
  }
}

function validRequestIrCandidate(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'request-ir-candidate',
    status: 'request-ir-candidate-external-previewed',
    schemaId: 'devview-request-ir-candidate-v0-preview',
    requestIrCandidateStatus: 'candidate-only',
    sourceNaturalLanguageRequest: {
      sourceKind: 'human-natural-language-request',
      language: 'en',
      text: requestText,
      authorityStatus: 'raw-request-text-not-compiler-authority',
    },
    requestText,
    requestLanguage: 'en',
    requestTypeCandidate: 'runtime-evidence-only',
    changeTypeCandidate: 'test-only-behavior-proof',
    targetRecordIdCandidate: 'CH-001',
    targetComponentCandidate: 'Todo App',
    intentSummaryCandidate: 'Add runtime evidence for add button behavior without production source changes.',
    allowedScopeIntentCandidate: ['runtime behavior evidence'],
    forbiddenScopeIntentCandidate: ['production source changes'],
    requiredEvidenceIntentCandidate: ['add-todo behavior proof'],
    riskIntentCandidate: ['production source must remain untouched'],
    confidence: { score: 0.74, band: 'medium' },
    ambiguities: [],
    requiresClarification: false,
    humanReviewRequired: true,
    candidateOnly: true,
    authorityStatus: 'not-authoritative-until-validated',
    validatedRequestIr: false,
    graphTraversalAllowed: false,
    contractGenerationAllowed: false,
    instructionPackGenerationAllowed: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
  }
}

function validProviderConfig(
  providerState:
    | 'disabled'
    | 'configured-not-invoked'
    | 'configured-invocation-enabled-preview'
    | 'configured-openai-invocation-enabled'
    | 'unavailable'
    | 'blocked-invalid-config'
    | 'future-invocation-allowed-only-after-explicit-config',
): Record<string, unknown> {
  const statuses: Record<typeof providerState, string> = {
    disabled: 'ai-request-analyzer-provider-config-disabled-previewed',
    unavailable: 'ai-request-analyzer-provider-config-unavailable-previewed',
    'configured-not-invoked': 'ai-request-analyzer-provider-config-configured-not-invoked-previewed',
    'configured-invocation-enabled-preview': 'ai-request-analyzer-provider-config-invocation-enabled-previewed',
    'configured-openai-invocation-enabled':
      'ai-request-analyzer-provider-config-openai-live-disabled-by-default-previewed',
    'blocked-invalid-config': 'ai-request-analyzer-provider-config-blocked-invalid-previewed',
    'future-invocation-allowed-only-after-explicit-config':
      'ai-request-analyzer-provider-config-future-invocation-previewed',
  }
  const configured =
    providerState === 'configured-not-invoked' ||
    providerState === 'configured-invocation-enabled-preview' ||
    providerState === 'configured-openai-invocation-enabled'
  return {
    schemaVersion: 1,
    artifactRole: 'ai-request-analyzer-provider-config-preview',
    status: statuses[providerState],
    providerState,
    sourceProviderConfigBoundary: 'provider-config-boundary.json',
    providerInvocationAuthority:
      providerState === 'configured-invocation-enabled-preview'
        ? 'explicit-future-flag-required-not-implemented'
        : providerState === 'configured-openai-invocation-enabled'
          ? 'explicit-invocation-and-network-flags-required-not-implemented'
          : 'none-preview-only',
    providerNameCandidate: configured ? 'openai' : null,
    modelNameCandidate: configured ? 'gpt-future-preview' : null,
    timeoutMs: providerState === 'configured-openai-invocation-enabled' ? 1000 : null,
    maxOutputTokens: providerState === 'configured-openai-invocation-enabled' ? 1200 : null,
    structuredOutputMode:
      providerState === 'configured-openai-invocation-enabled' ? 'responses-text-format-json-schema' : null,
    storeProviderResponse: providerState === 'configured-openai-invocation-enabled' ? false : null,
    providerConfigSource: providerState === 'disabled' ? 'disabled-default-preview' : 'repo-local-preview-config',
    apiKeySourceRef: configured ? 'OPENAI_API_KEY' : null,
    environmentVariableRefs: configured ? ['OPENAI_API_KEY'] : [],
    secretValueStored: false,
    secretValueInspected: false,
    networkCallsAllowed: false,
    llmInvoked: false,
    runtimeAiCallsAllowed: false,
    requestIrCandidateGenerated: false,
    graphTraversalAllowed: false,
    contractInputGenerated: false,
    instructionPackGenerated: false,
    codexExecutionTriggered: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    runtimeEvidenceSatisfied: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
  }
}

function validMockProviderResponse(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'ai-request-analyzer-mock-provider-response-preview',
    status: 'ai-request-analyzer-mock-provider-response-previewed',
    providerInvocationMode: 'mock-no-network',
    providerNameCandidate: 'mock-analyzer-provider',
    modelNameCandidate: 'mock-request-ir-candidate-generator',
    networkCallsAllowed: false,
    llmInvoked: false,
    runtimeAiCallsAllowed: false,
    secretValueStored: false,
    secretValueInspected: false,
    candidate: validRequestIrCandidate(),
  }
}
