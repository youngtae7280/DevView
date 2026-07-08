import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDevViewCli } from '../app'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson, writeText } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('graph extract-code-subgraph CLI', () => {
  it('extracts JS/TS file, class, function, method, import, and safe call facts into a validated code subgraph', async () => {
    const workspace = createWorkspace()
    writeFixtureProject(workspace)

    const result = await runDevViewCli(
      [
        'graph',
        'extract-code-subgraph',
        '--target-repo',
        'target',
        '--include',
        'src/**/*.ts',
        '--output',
        '.tmp/native-code-subgraph.json',
        '--validation-output',
        '.tmp/native-code-subgraph-validation.json',
        '--markdown',
        '.tmp/native-code-subgraph.md',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const codeSubgraph = JSON.parse(readFileSync(join(workspace, '.tmp/native-code-subgraph.json'), 'utf8'))
    const validation = JSON.parse(readFileSync(join(workspace, '.tmp/native-code-subgraph-validation.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.artifactRole).toBe('devview-native-code-subgraph-extraction-report')
    expect(payload.status).toBe('devview-native-code-subgraph-extraction-passed')
    expect(payload.extractionSummary.fileNodeCount).toBe(3)
    expect(payload.extractionSummary.classNodeCount).toBe(1)
    expect(payload.extractionSummary.functionNodeCount).toBeGreaterThanOrEqual(2)
    expect(payload.extractionSummary.methodNodeCount).toBe(1)
    expect(payload.extractionSummary.fieldNodeCount).toBeGreaterThanOrEqual(1)
    expect(payload.extractionSummary.importEdgeCount).toBeGreaterThanOrEqual(2)
    expect(payload.extractionSummary.callEdgeCount).toBeGreaterThanOrEqual(1)
    expectSafetyFalse(payload)

    expect(codeSubgraph.artifactRole).toBe('devview-code-subgraph')
    expect(codeSubgraph.status).toBe('devview-code-subgraph-supplied')
    expect(codeSubgraph.scope).toBe('code-subgraph-source-fact-only')
    expect(codeSubgraph.nodes.map((entry: { kind: string }) => entry.kind)).toEqual(
      expect.arrayContaining(['file', 'class', 'function', 'method', 'field', 'external_dependency']),
    )
    expect(codeSubgraph.edges.map((entry: { kind: string }) => entry.kind)).toEqual(
      expect.arrayContaining(['contains', 'imports', 'calls']),
    )
    expect(codeSubgraph.nodes.every((entry: { sourceFile?: string }) => Boolean(entry.sourceFile))).toBe(true)
    expect(
      codeSubgraph.edges.every((entry: { sourceLocation?: unknown; sourceLocationStatus?: string }) =>
        Boolean(entry.sourceLocation ?? entry.sourceLocationStatus),
      ),
    ).toBe(true)
    expect(codeSubgraph.nodes.every((entry: { confidence?: string }) => Boolean(entry.confidence))).toBe(true)
    expect(codeSubgraph.edges.every((entry: { confidence?: string }) => Boolean(entry.confidence))).toBe(true)
    expect(validation.status).toBe('devview-code-subgraph-validation-passed')
    expect(existsSync(join(workspace, '.tmp/native-code-subgraph.md'))).toBe(true)

    const revalidation = await runDevViewCli(
      [
        'graph',
        'validate-code-subgraph',
        '--code-subgraph',
        '.tmp/native-code-subgraph.json',
        '--output',
        '.tmp/native-code-subgraph-revalidation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    expect(revalidation.exitCode).toBe(ExitCode.Success)
  })

  it('respects include filtering and reports unsupported included extensions as limitations', async () => {
    const workspace = createWorkspace()
    writeFixtureProject(workspace)
    writeText(join(workspace, 'target/src/notes.py'), 'def helper(): pass\n')
    writeText(join(workspace, 'target/scripts/excluded.ts'), 'export function outside() { return true }\n')

    const result = await runDevViewCli(
      [
        'graph',
        'extract-code-subgraph',
        '--target-repo',
        'target',
        '--include',
        'src/**/*',
        '--output',
        '.tmp/include-code-subgraph.json',
        '--validation-output',
        '.tmp/include-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const codeSubgraph = JSON.parse(readFileSync(join(workspace, '.tmp/include-code-subgraph.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.extractionSummary.unsupportedExtensions['.py']).toBe(1)
    expect(payload.extractionFindings.map((entry: { code: string }) => entry.code)).toContain(
      'NATIVE_CODE_SUBGRAPH_UNSUPPORTED_EXTENSIONS',
    )
    expect(codeSubgraph.nodes.some((entry: { sourceFile: string }) => entry.sourceFile === 'scripts/excluded.ts')).toBe(
      false,
    )
  })

  it('skips ambiguous call edges deterministically instead of guessing', async () => {
    const workspace = createWorkspace()
    writeText(
      join(workspace, 'target/src/ambiguous.ts'),
      [
        'export function duplicate() { return 1 }',
        'export const duplicate = () => { return 2 }',
        'export function caller() { return duplicate() }',
        '',
      ].join('\n'),
    )

    const result = await runDevViewCli(
      [
        'graph',
        'extract-code-subgraph',
        '--target-repo',
        'target',
        '--include',
        'src/**/*.ts',
        '--output',
        '.tmp/ambiguous-code-subgraph.json',
        '--validation-output',
        '.tmp/ambiguous-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.extractionSummary.ambiguousCallNames).toContain('duplicate')
    expect(payload.extractionFindings.map((entry: { code: string }) => entry.code)).toContain(
      'NATIVE_CODE_SUBGRAPH_AMBIGUOUS_CALLS_SKIPPED',
    )
  })

  it('defaults to graphify-compatible extraction that bounds broad identifier references', async () => {
    const workspace = createWorkspace()
    writeText(
      join(workspace, 'target/src/repeated.ts'),
      [
        'export function target(): number { return 1 }',
        '',
        'export function owner(): number {',
        ...Array.from({ length: 40 }, (_, index) => `  const reference${index} = target`),
        ...Array.from({ length: 40 }, () => '  target()'),
        '  return target()',
        '}',
        '',
      ].join('\n'),
    )

    const result = await runDevViewCli(
      [
        'graph',
        'extract-code-subgraph',
        '--target-repo',
        'target',
        '--include',
        'src/**/*.ts',
        '--output',
        '.tmp/repeated-code-subgraph.json',
        '--validation-output',
        '.tmp/repeated-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const codeSubgraph = JSON.parse(readFileSync(join(workspace, '.tmp/repeated-code-subgraph.json'), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.extractionProfile).toBe('graphify-compatible')
    expect(payload.extractionSummary.referenceEdgeCount).toBe(0)
    expect(payload.extractionSummary.callEdgeCount).toBe(1)
    expect(payload.extractionSummary.profileFilteredDuplicateCallLikeEdgeCount).toBeGreaterThanOrEqual(40)
    expect(codeSubgraph.edges.filter((entry: { kind: string }) => entry.kind === 'references')).toHaveLength(0)
  })

  it('supports a rich extraction profile for broad reference and call-site facts', async () => {
    const workspace = createWorkspace()
    writeText(
      join(workspace, 'target/src/rich.ts'),
      [
        'export function target(): number { return 1 }',
        '',
        'export function owner(): number {',
        '  const reference = target',
        '  target()',
        '  return target()',
        '}',
        '',
      ].join('\n'),
    )

    const result = await runDevViewCli(
      [
        'graph',
        'extract-code-subgraph',
        '--target-repo',
        'target',
        '--include',
        'src/**/*.ts',
        '--extraction-profile',
        'rich',
        '--output',
        '.tmp/rich-code-subgraph.json',
        '--validation-output',
        '.tmp/rich-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.extractionProfile).toBe('rich')
    expect(payload.extractionSummary.referenceEdgeCount).toBeGreaterThanOrEqual(1)
    expect(payload.extractionSummary.callEdgeCount).toBeGreaterThanOrEqual(2)
    expect(payload.extractionSummary.profileFilteredDuplicateCallLikeEdgeCount).toBe(0)
  })

  it('attributes calls inside named functions to the function node', async () => {
    const workspace = createWorkspace()
    writeText(
      join(workspace, 'target/src/ownership.ts'),
      [
        'export function callee(): string {',
        "  return 'ok'",
        '}',
        '',
        'export function owner(): string {',
        '  return callee()',
        '}',
        '',
        'callee()',
        '',
      ].join('\n'),
    )

    const result = await runDevViewCli(
      [
        'graph',
        'extract-code-subgraph',
        '--target-repo',
        'target',
        '--include',
        'src/**/*.ts',
        '--output',
        '.tmp/ownership-code-subgraph.json',
        '--validation-output',
        '.tmp/ownership-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const codeSubgraph = JSON.parse(readFileSync(join(workspace, '.tmp/ownership-code-subgraph.json'), 'utf8'))
    const nodes = codeSubgraph.nodes as Array<{ id: string; kind: string; label: string }>
    const edges = codeSubgraph.edges as Array<{ from: string; to: string; kind: string }>
    const owner = nodes.find((entry) => entry.kind === 'function' && entry.label === 'owner')
    const callee = nodes.find((entry) => entry.kind === 'function' && entry.label === 'callee')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(edges).toContainEqual(expect.objectContaining({ kind: 'calls', from: owner?.id, to: callee?.id }))
  })

  it('keeps external test framework calls out of the graphify-compatible call graph', async () => {
    const workspace = createWorkspace()
    writeText(join(workspace, 'target/src/helper.ts'), 'export function helper(): number { return 1 }\n')
    writeText(
      join(workspace, 'target/src/helper.test.ts'),
      [
        "import { describe, expect, it } from 'vitest'",
        "import { helper } from './helper.js'",
        '',
        "describe('helper', () => {",
        "  it('returns a value', () => {",
        '    expect(helper()).toBe(1)',
        '  })',
        '})',
        '',
      ].join('\n'),
    )

    const result = await runDevViewCli(
      [
        'graph',
        'extract-code-subgraph',
        '--target-repo',
        'target',
        '--include',
        'src/**/*.ts',
        '--output',
        '.tmp/test-framework-code-subgraph.json',
        '--validation-output',
        '.tmp/test-framework-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const codeSubgraph = JSON.parse(readFileSync(join(workspace, '.tmp/test-framework-code-subgraph.json'), 'utf8'))
    const nodes = codeSubgraph.nodes as Array<{ id: string; kind: string; label: string }>
    const edges = codeSubgraph.edges as Array<{ to: string; kind: string }>
    const vitest = nodes.find((entry) => entry.kind === 'external_dependency' && entry.label === 'vitest')
    const helper = nodes.find((entry) => entry.kind === 'function' && entry.label === 'helper')

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.extractionSummary.profileFilteredExternalCallLikeEdgeCount).toBeGreaterThanOrEqual(2)
    expect(edges).toContainEqual(expect.objectContaining({ kind: 'imports', to: vitest?.id }))
    expect(edges).toContainEqual(expect.objectContaining({ kind: 'calls', to: helper?.id }))
    expect(edges.some((entry) => entry.kind === 'calls' && entry.to === vitest?.id)).toBe(false)
  })

  it('extracts TypeScript AST declarations, NodeNext .js imports, re-exports, and imported calls', async () => {
    const workspace = createWorkspace()
    writeAstFixtureProject(workspace)

    const result = await runDevViewCli(
      [
        'graph',
        'extract-code-subgraph',
        '--target-repo',
        'target',
        '--include',
        'src/**/*.ts',
        '--output',
        '.tmp/ast-code-subgraph.json',
        '--validation-output',
        '.tmp/ast-validation.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const codeSubgraph = JSON.parse(readFileSync(join(workspace, '.tmp/ast-code-subgraph.json'), 'utf8'))
    const nodes = codeSubgraph.nodes as Array<{ id: string; kind: string; label: string; sourceFile: string }>
    const edges = codeSubgraph.edges as Array<{ from: string; to: string; kind: string }>

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.extractionMode).toBe('native-static-js-ts-ast')
    expect(payload.astExtractorExecuted).toBe(false)
    expect(payload.extractionSummary.interfaceNodeCount).toBeGreaterThanOrEqual(2)
    expect(payload.extractionSummary.typeNodeCount).toBeGreaterThanOrEqual(3)
    expect(payload.extractionSummary.methodNodeCount).toBeGreaterThanOrEqual(4)
    expect(payload.extractionSummary.constructEdgeCount).toBeGreaterThanOrEqual(1)
    expect(payload.extractionSummary.callLikeEdgeCount).toBeGreaterThanOrEqual(5)

    for (const label of [
      'readTextSafe',
      'readJsonSafe',
      'writeJsonAtomic',
      'writeTextAtomic',
      'ensureDir',
      'resolveRoot',
      'relativePath',
      'findPluginRoot',
    ]) {
      expect(nodes).toContainEqual(expect.objectContaining({ label, sourceFile: 'src/fs-like.ts' }))
    }
    expect(nodes).toContainEqual(expect.objectContaining({ kind: 'interface', label: 'Reader' }))
    expect(nodes).toContainEqual(expect.objectContaining({ kind: 'type', label: 'SafeResult' }))
    expect(nodes).toContainEqual(expect.objectContaining({ kind: 'type', label: 'FileMode' }))
    expect(nodes).toContainEqual(expect.objectContaining({ kind: 'class', label: 'Store' }))
    expect(nodes).toContainEqual(expect.objectContaining({ kind: 'method', label: 'Store.constructor' }))
    expect(nodes).toContainEqual(expect.objectContaining({ kind: 'method', label: 'Store.read' }))

    const readJson = nodes.find((entry) => entry.label === 'readJsonSafe')
    const writeText = nodes.find((entry) => entry.label === 'writeTextAtomic')
    const store = nodes.find((entry) => entry.label === 'Store')
    expect(edges).toContainEqual(expect.objectContaining({ kind: 're_exports' }))
    expect(edges).toContainEqual(expect.objectContaining({ kind: 'calls', to: readJson?.id }))
    expect(edges).toContainEqual(expect.objectContaining({ kind: 'calls', to: writeText?.id }))
    expect(edges).toContainEqual(expect.objectContaining({ kind: 'constructs', to: store?.id }))
    expect(
      edges.some(
        (entry) =>
          entry.kind === 'imports' && nodes.find((node) => node.id === entry.to)?.sourceFile === 'src/re-export.ts',
      ),
    ).toBe(true)
  })

  it('blocks output collisions, protected paths, included source overwrite, and source-authority-shaped outputs', async () => {
    const cases = [
      {
        output: '.tmp/same.json',
        validationOutput: '.tmp/same.json',
        expected: 'must be different paths',
      },
      {
        output: join('.devview', 'generated', 'code-subgraph.json'),
        validationOutput: '.tmp/validation.json',
        expected: 'inside a protected control path',
      },
      {
        output: join('target', 'src', 'todo-service.ts'),
        validationOutput: '.tmp/validation.json',
        expected: 'would overwrite an included source file',
      },
      {
        output: '.tmp/graph-source-code-subgraph.json',
        validationOutput: '.tmp/validation.json',
        expected: 'would overwrite a source-authority-shaped path',
      },
      {
        output: '.tmp/existing-code-subgraph.json',
        validationOutput: '.tmp/validation.json',
        existing: {
          artifactRole: 'devview-code-subgraph',
          status: 'devview-code-subgraph-supplied',
          nodes: [],
          edges: [],
        },
        expected: 'would overwrite a source-authority-shaped path',
      },
    ]

    for (const entry of cases) {
      const workspace = createWorkspace()
      writeFixtureProject(workspace)
      if (entry.existing) {
        writeJson(join(workspace, entry.output), entry.existing)
      }

      const result = await runDevViewCli(
        [
          'graph',
          'extract-code-subgraph',
          '--target-repo',
          'target',
          '--include',
          'src/**/*.ts',
          '--output',
          entry.output,
          '--validation-output',
          entry.validationOutput,
          '--json',
        ],
        { cwd: workspace, pluginRoot },
      )

      expect(result.exitCode).toBe(ExitCode.ValidationFailed)
      expect(result.stderr).toContain(entry.expected)
      if (!entry.output.endsWith('todo-service.ts')) {
        expect(existsSync(join(workspace, entry.output))).toBe(Boolean(entry.existing))
      }
    }
  })

  it('produces deterministic code subgraph output across repeated runs', async () => {
    const workspace = createWorkspace()
    writeFixtureProject(workspace)

    const first = await runExtract(workspace, '.tmp/first-code-subgraph.json', '.tmp/first-validation.json')
    const second = await runExtract(workspace, '.tmp/second-code-subgraph.json', '.tmp/second-validation.json')
    const firstCodeSubgraph = JSON.parse(readFileSync(join(workspace, '.tmp/first-code-subgraph.json'), 'utf8'))
    const secondCodeSubgraph = JSON.parse(readFileSync(join(workspace, '.tmp/second-code-subgraph.json'), 'utf8'))

    expect(first.exitCode).toBe(ExitCode.Success)
    expect(second.exitCode).toBe(ExitCode.Success)
    expect(secondCodeSubgraph).toEqual(firstCodeSubgraph)
  })
})

async function runExtract(workspace: string, output: string, validationOutput: string) {
  return await runDevViewCli(
    [
      'graph',
      'extract-code-subgraph',
      '--target-repo',
      'target',
      '--include',
      'src/**/*.ts',
      '--output',
      output,
      '--validation-output',
      validationOutput,
      '--json',
    ],
    { cwd: workspace, pluginRoot },
  )
}

function writeFixtureProject(workspace: string): void {
  writeText(
    join(workspace, 'target/src/todo-service.ts'),
    [
      "import { saveTodo } from './todo-store'",
      "import externalThing from 'external-lib'",
      '',
      'export class TodoService {',
      '  addTodo(label: string) {',
      '    const normalized = normalizeTodo(label)',
      '    saveTodo(normalized)',
      '    return externalThing(normalized)',
      '  }',
      '}',
      '',
      'export function normalizeTodo(label: string) {',
      '  return label.trim()',
      '}',
      '',
    ].join('\n'),
  )
  writeText(
    join(workspace, 'target/src/todo-store.ts'),
    [
      'export const storeName = "todos"',
      '',
      'export function saveTodo(label: string) {',
      '  return label',
      '}',
      '',
    ].join('\n'),
  )
  writeText(join(workspace, 'target/src/unused.ts'), 'export const unused = () => { return true }\n')
}

function writeAstFixtureProject(workspace: string): void {
  writeText(
    join(workspace, 'target/src/fs-like.ts'),
    [
      'export async function readTextSafe(filePath: string): Promise<string> {',
      '  return filePath',
      '}',
      '',
      'export async function readJsonSafe<T = unknown>(filePath: string): Promise<T> {',
      '  return JSON.parse(await readTextSafe(filePath)) as T',
      '}',
      '',
      'export function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {',
      '  return writeTextAtomic(filePath, JSON.stringify(value))',
      '}',
      '',
      'export const writeTextAtomic = async (filePath: string, value: string): Promise<void> => {',
      '  await Promise.resolve(`${filePath}:${value}`)',
      '}',
      '',
      'export function ensureDir(dirPath: string): void {',
      '  resolveRoot(dirPath)',
      '}',
      '',
      'export const resolveRoot = (root: string): string => root',
      '',
      'export function relativePath(root: string, filePath: string): string {',
      '  return `${root}/${filePath}`',
      '}',
      '',
      'export function findPluginRoot(startUrl: string): string {',
      '  return resolveRoot(startUrl)',
      '}',
      '',
      'export interface Reader<T> {',
      '  read(): Promise<T>',
      '}',
      '',
      'export type SafeResult<T> = { ok: true; value: T } | { ok: false; error: string }',
      '',
      "export enum FileMode { Text = 'text' }",
      '',
      'export class Store implements Reader<string> {',
      '  constructor(private readonly root: string) {}',
      '',
      '  get base(): string {',
      '    return this.root',
      '  }',
      '',
      '  set base(value: string) {',
      '    this.write(value)',
      '  }',
      '',
      '  write(value: string): string {',
      '    return value.trim()',
      '  }',
      '',
      '  async read(): Promise<string> {',
      '    return readTextSafe(this.base)',
      '  }',
      '}',
      '',
    ].join('\n'),
  )
  writeText(
    join(workspace, 'target/src/re-export.ts'),
    ["export { readJsonSafe as loadJson, Store } from './fs-like.js'", "export * from './types.js'", ''].join('\n'),
  )
  writeText(
    join(workspace, 'target/src/types.ts'),
    ['export interface Port {', '  name: string', '}', '', 'export type PortMap = Record<string, Port>', ''].join('\n'),
  )
  writeText(
    join(workspace, 'target/src/consumer.ts'),
    [
      "import { loadJson, Store } from './re-export.js'",
      "import { readTextSafe, writeTextAtomic } from './fs-like.js'",
      '',
      'export const runConsumer = async (): Promise<void> => {',
      "  const store = new Store('root')",
      "  await loadJson<{ ok: true }>('config.json')",
      '  await readTextSafe(store.base)',
      "  await writeTextAtomic('x', 'y')",
      '}',
      '',
    ].join('\n'),
  )
}

function expectSafetyFalse(payload: Record<string, unknown>): void {
  expect(payload.graphifyExecuted).toBe(false)
  expect(payload.astExtractorExecuted).toBe(false)
  expect(payload.providerInvoked).toBe(false)
  expect(payload.networkCallMade).toBe(false)
  expect(payload.apiCallMade).toBe(false)
  expect(payload.shellCommandsExecuted).toBe(false)
  expect(payload.extensionExecutionAllowed).toBe(false)
  expect(payload.graphSourceMutated).toBe(false)
  expect(payload.graphDeltaApplied).toBe(false)
  expect(payload.viewTreeGenerated).toBe(false)
  expect(payload.contextPackGenerated).toBe(false)
  expect(payload.runtimeEvidenceSatisfied).toBe(false)
  expect(payload.evidenceAccepted).toBe(false)
  expect(payload.equivalenceProven).toBe(false)
  expect(payload.scopeEnforced).toBe(false)
  expect(payload.ciEnforcementEnabled).toBe(false)
  expect(payload.rbacEnforced).toBe(false)
  expect(payload.permissionVerified).toBe(false)
  expect(payload.cryptographicSignatureVerified).toBe(false)
  expect(payload.enterpriseGateActivated).toBe(false)
}
