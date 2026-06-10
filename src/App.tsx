import {
  CheckCircle2,
  Clipboard,
  FileDown,
  FileJson,
  FolderOpen,
  GitBranchPlus,
  Languages,
  ListChecks,
  MessageSquare,
  PackageCheck,
  RotateCcw,
  Save,
  Send,
  Upload,
  Workflow,
} from 'lucide-react'
import { type ReactNode, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  Position,
  ReactFlow,
  type Edge as FlowEdge,
  type Node as FlowNode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './App.css'
import {
  addChildNodes,
  confirmLeaf,
  createEmptyProject,
  createProjectWithRoot,
  getLatestSession,
  getNode,
  getProjectWarnings,
  getRootToLeafNodes,
  normalizeProject,
  nowIso,
  setGeneratedArtifacts,
  startInterviewSession,
  submitInterviewAnswer,
  updateNodeText,
  validateTree,
} from './domain/tree'
import type {
  GeneratedArtifacts,
  InterviewSession,
  NodeStatus,
  ProgramNode,
  Project,
} from './domain/types'
import {
  i18n,
  localeNames,
  statusLabels,
  type Locale,
} from './i18n'
import {
  completeRpdAndStartWpd,
  completeVdAndGenerateAcep,
  completeWpdAndStartVd,
  ensureProjectBlueprint,
  generateAcceptancePlan,
  generateImplementationRoadmap,
  generateLeafVerificationDesigns,
  generateLeafWorkDesigns,
  getRpdCompletionIssues,
  getVdCompletionIssues,
  getWpdCompletionIssues,
  markAcepExported,
  synthesizeParentVerificationDesigns,
  synthesizeParentWorkDesigns,
} from './plugins/project-blueprint-engine'
import {
  getAceFileContent,
  writeBundlePreview,
  writeVirtualFileList,
} from './plugins/project-blueprint-engine/acep/file-pack-writer'
import { writeManifestJson } from './plugins/project-blueprint-engine/acep/manifest-writer'
import { writeMarkdownBundle } from './plugins/project-blueprint-engine/acep/markdown-writer'
import type { ProjectBlueprint } from './plugins/project-blueprint-engine/types'
import { createConfiguredProvider } from './providers/llm/openAiProvider'
import type {
  LlmProviderStatus,
  ProviderFallbackEvent,
} from './providers/llm/types'
import {
  loadProjectFromStorage,
  parseProjectJson,
  saveProjectToStorage,
} from './storage/projectStorage'
import {
  exportArtifactsMarkdown,
  exportProjectJson,
  downloadTextFile,
} from './utils/download'

type UiText = (typeof i18n)[Locale]
type ArtifactKey = keyof Omit<GeneratedArtifacts, 'generatedAt'>
type PreviewTab =
  | 'wpd'
  | 'vd'
  | 'acep_files'
  | 'acep_file_content'
  | 'acep_bundle'
  | 'acep_prompt'
  | 'rpd_artifacts'
  | 'raw'

const statusTone: Record<NodeStatus, string> = {
  needs_interview: '#b45309',
  interviewing: '#2563eb',
  ready_to_decompose: '#0f766e',
  expanded: '#15803d',
  confirmed_leaf: '#4338ca',
}

const FLOW_NODE_X_STEP = 320
const FLOW_NODE_Y_STEP = 190

function App() {
  const providerFallbackEvents = useRef<ProviderFallbackEvent[]>([])
  const provider = useMemo(
    () =>
      createConfiguredProvider({
        onFallback: (event) => {
          providerFallbackEvents.current.push(event)
        },
      }),
    [],
  )
  const [locale, setLocale] = useState<Locale>('en')
  const [project, setProject] = useState<Project>(() => createEmptyProject())
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [rootPrompt, setRootPrompt] = useState('')
  const [chatDraft, setChatDraft] = useState('')
  const [notice, setNotice] = useState<string>(i18n.en.ready)
  const [isBusy, setIsBusy] = useState(false)
  const [previewTab, setPreviewTab] = useState<PreviewTab>('wpd')
  const [selectedAcepFilePath, setSelectedAcepFilePath] = useState('')
  const [providerStatus, setProviderStatus] = useState(() => provider.getStatus())
  const importRef = useRef<HTMLInputElement>(null)
  const t = i18n[locale]
  const providerStatusText = formatProviderStatus(providerStatus)

  const selectedNode = getNode(project, selectedNodeId)
  const latestSession = getLatestSession(project, selectedNode)
  const orderedNodes = useMemo(() => getRootToLeafNodes(project), [project])
  const warnings = useMemo(() => getProjectWarnings(project), [project])
  const treeValidation = useMemo(() => validateTree(project), [project])
  const blueprint = useMemo(() => ensureProjectBlueprint(project), [project])
  const acepFilePaths = useMemo(
    () => blueprint.acep?.files.map((file) => file.path) ?? [],
    [blueprint.acep],
  )
  const activeAcepFilePath = acepFilePaths.includes(selectedAcepFilePath)
    ? selectedAcepFilePath
    : acepFilePaths[0] ?? ''
  const rpdIssues = useMemo(() => getRpdCompletionIssues(project), [project])
  const wpdIssues = useMemo(() => getWpdCompletionIssues(project), [project])
  const vdIssues = useMemo(() => getVdCompletionIssues(project), [project])
  const { flowNodes, flowEdges } = useMemo(
    () => createFlowElements(project, selectedNodeId, locale),
    [locale, project, selectedNodeId],
  )
  const previewText = useMemo(
    () => getPreviewText(project, previewTab, activeAcepFilePath),
    [activeAcepFilePath, previewTab, project],
  )

  const changeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale)
    setNotice(i18n[nextLocale].ready)
  }

  const consumeProviderFallbackNotice = () => {
    const fallbackEvent = providerFallbackEvents.current.shift()

    setProviderStatus(provider.getStatus())

    return fallbackEvent ? t.providerFallbackNotice : null
  }

  const createRoot = () => {
    const prompt = rootPrompt.trim()

    if (!prompt) {
      setNotice(t.rootEmpty)
      return
    }

    const nextProject = createProjectWithRoot(prompt)

    setProject(nextProject)
    setSelectedNodeId(nextProject.rootNodeId)
    setRootPrompt('')
    setChatDraft('')
    setNotice(t.rootCreated)
  }

  const startInterview = async () => {
    if (!selectedNode) {
      setNotice(t.selectBeforeInterview)
      return
    }

    setIsBusy(true)

    try {
      const parentNode = selectedNode.parentId
        ? project.nodes[selectedNode.parentId]
        : undefined
      const output = await provider.generateInitialQuestion({
        project,
        node: selectedNode,
        parentNode,
      })
      const fallbackNotice = consumeProviderFallbackNotice()

      setProject(startInterviewSession(project, selectedNode.id, output.question))
      setChatDraft('')
      setNotice(fallbackNotice ?? t.interviewStarted)
    } catch (error) {
      setProviderStatus(provider.getStatus())
      setNotice(t.interviewFailed(String(error)))
    } finally {
      setIsBusy(false)
    }
  }

  const submitAnswer = async () => {
    const answer = chatDraft.trim()

    if (!selectedNode || !latestSession) {
      setNotice(t.selectBeforeAnswers)
      return
    }

    if (!answer) {
      setNotice(t.emptyAnswer)
      return
    }

    setIsBusy(true)

    try {
      const previewSession: InterviewSession = {
        ...latestSession,
        messages: [
          ...latestSession.messages,
          {
            id: 'preview-user-answer',
            role: 'user',
            content: answer,
            createdAt: nowIso(),
          },
        ],
      }
      const output = await provider.analyzeInterviewTurn({
        project,
        node: selectedNode,
        session: previewSession,
      })
      const fallbackNotice = consumeProviderFallbackNotice()
      const nextProject = submitInterviewAnswer(project, latestSession.id, {
        answer,
        ...output,
      })

      setProject(nextProject)
      setChatDraft('')

      if (fallbackNotice) {
        setNotice(fallbackNotice)
      } else if (output.decision === 'ready_to_decompose') {
        setNotice(t.readyToDecompose)
      } else if (output.decision === 'suggest_confirm_leaf') {
        setNotice(t.suggestLeaf)
      } else {
        setNotice(t.answerSubmitted)
      }
    } catch (error) {
      setProviderStatus(provider.getStatus())
      setNotice(t.answerFailed(String(error)))
    } finally {
      setIsBusy(false)
    }
  }

  const decomposeSelectedNode = async () => {
    if (!selectedNode) {
      setNotice(t.selectBeforeDecompose)
      return
    }

    if (selectedNode.status !== 'ready_to_decompose') {
      setNotice(t.decomposeRequiresReady)
      return
    }

    setIsBusy(true)

    try {
      const output = await provider.decomposeNode({
        project,
        node: selectedNode,
      })
      const fallbackNotice = consumeProviderFallbackNotice()
      const nextProject = addChildNodes(project, selectedNode.id, output.children)

      setProject(nextProject)
      setSelectedNodeId(output.children[0]?.id ?? selectedNode.id)
      setChatDraft('')
      setNotice(
        fallbackNotice ??
          (output.children.length > 0
            ? t.generatedChildren(output.children.length)
            : t.noValidChildren),
      )
    } catch (error) {
      setProviderStatus(provider.getStatus())
      setNotice(t.providerFailed(String(error)))
    } finally {
      setIsBusy(false)
    }
  }

  const confirmSelectedNode = () => {
    if (!selectedNode) {
      return
    }

    setProject(confirmLeaf(project, selectedNode.id))
    setChatDraft('')
    setNotice(t.leafConfirmed)
  }

  const finalizeRpdArtifacts = async () => {
    if (!project.rootNodeId) {
      setNotice(t.createRootBeforeFinalize)
      return
    }

    if (
      warnings.length > 0 &&
      !window.confirm(t.unresolvedConfirm(warnings.length))
    ) {
      setNotice(t.finalizeCanceled)
      return
    }

    setIsBusy(true)

    try {
      const output = await provider.generateArtifacts({ project })
      const fallbackNotice = consumeProviderFallbackNotice()
      const nextProject = setGeneratedArtifacts(project, output.artifacts)

      setProject(nextProject)
      setPreviewTab('rpd_artifacts')
      setNotice(
        fallbackNotice ??
          (output.warnings.length > 0
            ? t.artifactsWarnings(output.warnings.length)
            : t.artifactsGenerated),
      )
    } catch (error) {
      setProviderStatus(provider.getStatus())
      setNotice(t.artifactFailed(String(error)))
    } finally {
      setIsBusy(false)
    }
  }

  const saveCurrentProject = () => {
    saveProjectToStorage(project)
    setNotice(t.savedStorage)
  }

  const loadSavedProject = () => {
    const savedProject = loadProjectFromStorage()

    if (!savedProject) {
      setNotice(t.noStorage)
      return
    }

    const normalized = normalizeProject(savedProject)

    if (!normalized) {
      setNotice(t.importFailed)
      return
    }

    setProject(normalized)
    setSelectedNodeId(normalized.rootNodeId)
    setChatDraft('')
    setNotice(t.loadedStorage)
  }

  const resetProject = () => {
    if (!window.confirm(t.newConfirm)) {
      return
    }

    setProject(createEmptyProject())
    setSelectedNodeId(null)
    setChatDraft('')
    setSelectedAcepFilePath('')
    setPreviewTab('wpd')
    setNotice(t.newStarted)
  }

  const importProject = (file: File | undefined) => {
    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      const nextProject = parseProjectJson(String(reader.result ?? ''))

      if (!nextProject) {
        setNotice(t.importFailed)
        return
      }

      setProject(nextProject)
      setSelectedNodeId(nextProject.rootNodeId)
      setChatDraft('')
      setNotice(t.imported)
    }

    reader.readAsText(file)
  }

  const exportMarkdown = () => {
    if (!exportArtifactsMarkdown(project)) {
      setNotice(t.generateArtifactsFirst)
      return
    }

    setNotice(t.markdownDownloaded)
  }

  const runPbeAction = async (
    action: (current: Project) => Project | Promise<Project>,
    success: string,
    nextTab: PreviewTab,
  ) => {
    setIsBusy(true)

    try {
      const nextProject = await action(project)
      setProject(nextProject)
      setPreviewTab(nextTab)
      setNotice(success)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error))
    } finally {
      setIsBusy(false)
    }
  }

  const exportAcepMarkdown = () => {
    const acep = ensureProjectBlueprint(project).acep

    if (!acep) {
      setNotice('Generate ACEP before exporting Markdown.')
      return
    }

    downloadTextFile(
      writeMarkdownBundle(acep),
      'autonomous-codex-execution-pack.md',
      'text/markdown;charset=utf-8',
    )
    setProject(markAcepExported(project))
    setNotice('ACEP Markdown bundle exported.')
  }

  const exportAcepManifest = () => {
    const acep = ensureProjectBlueprint(project).acep

    if (!acep) {
      setNotice('Generate ACEP before exporting the manifest.')
      return
    }

    downloadTextFile(
      writeManifestJson(acep.manifest),
      'execution-manifest.json',
      'application/json;charset=utf-8',
    )
    setProject(markAcepExported(project))
    setNotice('ACEP manifest exported.')
  }

  const exportAcepFileList = () => {
    const acep = ensureProjectBlueprint(project).acep

    if (!acep) {
      setNotice('Generate ACEP before exporting the virtual file list.')
      return
    }

    downloadTextFile(
      writeVirtualFileList(acep),
      'acep-virtual-file-list.txt',
      'text/plain;charset=utf-8',
    )
    setProject(markAcepExported(project))
    setNotice('ACEP virtual file list exported.')
  }

  const exportAcepBundlePreview = () => {
    const acep = ensureProjectBlueprint(project).acep

    if (!acep) {
      setNotice('Generate ACEP before exporting the bundle preview.')
      return
    }

    downloadTextFile(
      writeBundlePreview(acep),
      'acep-bundle-preview.md',
      'text/markdown;charset=utf-8',
    )
    setProject(markAcepExported(project))
    setNotice('ACEP bundle preview exported.')
  }

  const copyAcepPrompt = async () => {
    const acep = ensureProjectBlueprint(project).acep

    if (!acep) {
      setNotice('Generate ACEP before copying the handoff prompt.')
      return
    }

    try {
      await navigator.clipboard.writeText(acep.topLevelPrompt)
      setNotice('ACEP handoff prompt copied.')
    } catch {
      setNotice(t.copyFailed)
    }
  }

  const copyPreview = async () => {
    try {
      await navigator.clipboard.writeText(previewText)
      setNotice(t.copied)
    } catch {
      setNotice(t.copyFailed)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <Workflow aria-hidden="true" />
          <div>
            <h1>Project Blueprint Engine</h1>
            <p>{project.title}</p>
          </div>
        </div>
        <div className="toolbar" aria-label={t.projectActions}>
          <div className="language-toggle" aria-label={t.language}>
            <Languages aria-hidden="true" />
            {(['ko', 'en'] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={locale === item ? 'active' : ''}
                onClick={() => changeLocale(item)}
                aria-pressed={locale === item}
                title={localeNames[item]}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
          <IconButton
            label={t.newProject}
            onClick={resetProject}
            icon={<RotateCcw aria-hidden="true" />}
          />
          <IconButton
            label={t.save}
            onClick={saveCurrentProject}
            icon={<Save aria-hidden="true" />}
          />
          <IconButton
            label={t.load}
            onClick={loadSavedProject}
            icon={<FolderOpen aria-hidden="true" />}
          />
          <IconButton
            label={t.importJson}
            onClick={() => importRef.current?.click()}
            icon={<Upload aria-hidden="true" />}
          />
          <IconButton
            label={t.exportJson}
            onClick={() => exportProjectJson(project)}
            icon={<FileJson aria-hidden="true" />}
          />
          <IconButton
            label={t.exportMarkdown}
            onClick={exportMarkdown}
            icon={<FileDown aria-hidden="true" />}
          />
          <button
            type="button"
            className="primary-action"
            onClick={() => void finalizeRpdArtifacts()}
            disabled={isBusy || !project.rootNodeId}
          >
            <CheckCircle2 aria-hidden="true" />
            RPD artifacts
          </button>
          <input
            ref={importRef}
            className="hidden-input"
            type="file"
            accept="application/json,.json"
            onChange={(event) => importProject(event.target.files?.[0])}
          />
        </div>
      </header>

      <section className="status-strip" aria-live="polite">
        <span>{notice}</span>
        <span className="status-metrics">
          <span
            className={`provider-badge provider-${providerStatus.activeProvider}`}
            title={providerStatus.fallbackReason}
          >
            {t.providerStatus}: {providerStatusText}
          </span>
          <span>
            {t.nodes} {orderedNodes.length} / {t.warnings} {warnings.length} /{' '}
            {t.tree} {treeValidation.valid ? t.valid : t.invalid}
          </span>
        </span>
      </section>

      <StageStrip blueprint={blueprint} />

      {!project.rootNodeId ? (
        <RootComposer
          rootPrompt={rootPrompt}
          onChange={setRootPrompt}
          onCreate={createRoot}
          t={t}
        />
      ) : (
        <main className="workspace">
          <section className="canvas-panel" aria-label={t.treeCanvas}>
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              fitView
              minZoom={0.25}
              maxZoom={1.3}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            >
              <Background gap={18} size={1} color="#d1d5db" />
              <Controls showInteractive={false} />
              <MiniMap
                pannable
                zoomable
                nodeColor={(node) => {
                  const status = String(
                    node.data.status ?? 'needs_interview',
                  ) as NodeStatus
                  return statusTone[status] ?? '#6b7280'
                }}
              />
            </ReactFlow>
          </section>

          <aside className="side-stack">
            <NodeDetailPanel
              node={selectedNode}
              locale={locale}
              t={t}
              isBusy={isBusy}
              onStartInterview={startInterview}
              onDecompose={() => void decomposeSelectedNode()}
              onConfirmLeaf={confirmSelectedNode}
              onTextChange={(title, description) => {
                if (selectedNode) {
                  setProject(
                    updateNodeText(project, selectedNode.id, title, description),
                  )
                }
              }}
            />
            <PbeStagePanel
              blueprint={blueprint}
              rpdIssues={rpdIssues}
              wpdIssues={wpdIssues}
              vdIssues={vdIssues}
              isBusy={isBusy}
              onCompleteRpd={() =>
                void runPbeAction(
                  completeRpdAndStartWpd,
                  'RPD completed. WPD is ready.',
                  'wpd',
                )
              }
              onGenerateLeafWork={() =>
                void runPbeAction(
                  (current) => generateLeafWorkDesigns(current, provider),
                  'Leaf WorkDesigns generated.',
                  'wpd',
                )
              }
              onSynthesizeParentWork={() =>
                void runPbeAction(
                  (current) => synthesizeParentWorkDesigns(current, provider),
                  'Parent WorkDesigns synthesized.',
                  'wpd',
                )
              }
              onGenerateRoadmap={() =>
                void runPbeAction(
                  (current) => generateImplementationRoadmap(current, provider),
                  'Implementation roadmap generated.',
                  'wpd',
                )
              }
              onCompleteWpd={() =>
                void runPbeAction(
                  completeWpdAndStartVd,
                  'WPD completed. VD is ready.',
                  'vd',
                )
              }
              onGenerateLeafVerification={() =>
                void runPbeAction(
                  (current) => generateLeafVerificationDesigns(current, provider),
                  'Leaf VerificationDesigns generated.',
                  'vd',
                )
              }
              onSynthesizeParentVerification={() =>
                void runPbeAction(
                  (current) => synthesizeParentVerificationDesigns(current, provider),
                  'Parent VerificationDesigns synthesized.',
                  'vd',
                )
              }
              onGenerateAcceptance={() =>
                void runPbeAction(
                  (current) => generateAcceptancePlan(current, provider),
                  'Acceptance plan generated.',
                  'vd',
                )
              }
              onGenerateAcep={() =>
                void runPbeAction(
                  async (current) => {
                    const nextProject = await completeVdAndGenerateAcep(
                      current,
                      provider,
                    )
                    const acep = ensureProjectBlueprint(nextProject).acep
                    setSelectedAcepFilePath(acep?.files[0]?.path ?? '')
                    return nextProject
                  },
                  'ACEP generated.',
                  'acep_files',
                )
              }
              onExportMarkdown={exportAcepMarkdown}
              onExportManifest={exportAcepManifest}
              onExportFileList={exportAcepFileList}
              onExportBundlePreview={exportAcepBundlePreview}
              onCopyPrompt={() => void copyAcepPrompt()}
            />
          </aside>
        </main>
      )}

      <section className="bottom-dock">
        <InterviewDock
          node={selectedNode}
          session={latestSession}
          t={t}
          isBusy={isBusy}
          chatDraft={chatDraft}
          onChatDraftChange={setChatDraft}
          onSubmitAnswer={() => void submitAnswer()}
        />
        <PreviewPanel
          activeTab={previewTab}
          text={previewText}
          acepFilePaths={acepFilePaths}
          selectedAcepFilePath={activeAcepFilePath}
          onSelectedAcepFilePathChange={setSelectedAcepFilePath}
          onTabChange={setPreviewTab}
          onCopy={() => void copyPreview()}
        />
      </section>
    </div>
  )
}

function RootComposer({
  rootPrompt,
  onChange,
  onCreate,
  t,
}: {
  rootPrompt: string
  onChange: (value: string) => void
  onCreate: () => void
  t: UiText
}) {
  return (
    <main className="root-composer">
      <div className="root-copy">
        <p className="eyebrow">PBE starts with RPD</p>
        <h2>{t.rootHeading}</h2>
        <p>{t.rootDescription}</p>
      </div>
      <div className="root-form">
        <label htmlFor="rootPrompt">{t.programRequest}</label>
        <textarea
          id="rootPrompt"
          value={rootPrompt}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t.rootPlaceholder}
          rows={6}
        />
        <button
          type="button"
          className="primary-action"
          onClick={onCreate}
          disabled={!rootPrompt.trim()}
        >
          <Workflow aria-hidden="true" />
          {t.createRoot}
        </button>
      </div>
    </main>
  )
}

function StageStrip({ blueprint }: { blueprint: ProjectBlueprint }) {
  const steps = [
    { key: 'rpd', label: 'RPD requirements' },
    { key: 'wpd', label: 'WPD work design' },
    { key: 'vd', label: 'VD verification' },
    { key: 'acep', label: 'ACEP package' },
  ]
  const activeIndex = statusToStepIndex(blueprint.status)

  return (
    <nav className="stage-strip" aria-label="PBE stages">
      {steps.map((step, index) => (
        <div
          key={step.key}
          className={`stage-step ${index === activeIndex ? 'active' : ''} ${
            index < activeIndex ? 'complete' : ''
          }`}
        >
          <span>{index + 1}</span>
          <strong>{step.label}</strong>
        </div>
      ))}
    </nav>
  )
}

function PbeStagePanel({
  blueprint,
  rpdIssues,
  wpdIssues,
  vdIssues,
  isBusy,
  onCompleteRpd,
  onGenerateLeafWork,
  onSynthesizeParentWork,
  onGenerateRoadmap,
  onCompleteWpd,
  onGenerateLeafVerification,
  onSynthesizeParentVerification,
  onGenerateAcceptance,
  onGenerateAcep,
  onExportMarkdown,
  onExportManifest,
  onExportFileList,
  onExportBundlePreview,
  onCopyPrompt,
}: {
  blueprint: ProjectBlueprint
  rpdIssues: string[]
  wpdIssues: string[]
  vdIssues: string[]
  isBusy: boolean
  onCompleteRpd: () => void
  onGenerateLeafWork: () => void
  onSynthesizeParentWork: () => void
  onGenerateRoadmap: () => void
  onCompleteWpd: () => void
  onGenerateLeafVerification: () => void
  onSynthesizeParentVerification: () => void
  onGenerateAcceptance: () => void
  onGenerateAcep: () => void
  onExportMarkdown: () => void
  onExportManifest: () => void
  onExportFileList: () => void
  onExportBundlePreview: () => void
  onCopyPrompt: () => void
}) {
  const workCount = Object.keys(blueprint.workDesigns).length
  const verificationCount = Object.keys(blueprint.verificationDesigns).length
  const acepFileCount = blueprint.acep?.files.length ?? 0

  return (
    <section className="pbe-panel" aria-label="Project Blueprint Engine">
      <div className="pbe-panel-header">
        <PackageCheck aria-hidden="true" />
        <div>
          <h2>Project Blueprint Engine</h2>
          <p>Status: {blueprint.status}</p>
        </div>
      </div>

      <div className="pbe-metrics">
        <span>{workCount} work designs</span>
        <span>{verificationCount} verification designs</span>
        <span>{acepFileCount} ACEP files</span>
      </div>

      <section className="stage-card">
        <h3>RPD to WPD</h3>
        <button
          type="button"
          className="primary-action"
          disabled={isBusy || rpdIssues.length > 0}
          onClick={onCompleteRpd}
        >
          <CheckCircle2 aria-hidden="true" />
          Complete RPD and move to WPD
        </button>
        <IssueList issues={rpdIssues} empty="RPD completion gate is satisfied." />
      </section>

      <section className="stage-card">
        <h3>WPD</h3>
        <div className="pbe-actions">
          <button type="button" disabled={isBusy} onClick={onGenerateLeafWork}>
            <ListChecks aria-hidden="true" />
            Generate leaf work
          </button>
          <button type="button" disabled={isBusy} onClick={onSynthesizeParentWork}>
            Synthesize parents
          </button>
          <button type="button" disabled={isBusy} onClick={onGenerateRoadmap}>
            Generate roadmap
          </button>
          <button
            type="button"
            className="primary-action"
            disabled={isBusy || wpdIssues.length > 0}
            onClick={onCompleteWpd}
          >
            Complete WPD and move to VD
          </button>
        </div>
        <IssueList issues={wpdIssues} empty="WPD completion gate is satisfied." />
      </section>

      <section className="stage-card">
        <h3>VD</h3>
        <div className="pbe-actions">
          <button
            type="button"
            disabled={isBusy}
            onClick={onGenerateLeafVerification}
          >
            Generate leaf verification
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={onSynthesizeParentVerification}
          >
            Synthesize verification
          </button>
          <button type="button" disabled={isBusy} onClick={onGenerateAcceptance}>
            Generate acceptance plan
          </button>
          <button
            type="button"
            className="primary-action"
            disabled={isBusy || vdIssues.length > 0}
            onClick={onGenerateAcep}
          >
            Complete VD and generate ACEP
          </button>
        </div>
        <IssueList issues={vdIssues} empty="VD completion gate is satisfied." />
      </section>

      <section className="stage-card">
        <h3>ACEP</h3>
        <div className="pbe-actions">
          <button type="button" disabled={isBusy || !blueprint.acep} onClick={onExportMarkdown}>
            Export Markdown
          </button>
          <button type="button" disabled={isBusy || !blueprint.acep} onClick={onExportManifest}>
            Export manifest JSON
          </button>
          <button type="button" disabled={isBusy || !blueprint.acep} onClick={onExportFileList}>
            Export file list
          </button>
          <button
            type="button"
            disabled={isBusy || !blueprint.acep}
            onClick={onExportBundlePreview}
          >
            Export bundle preview
          </button>
          <button type="button" disabled={isBusy || !blueprint.acep} onClick={onCopyPrompt}>
            Copy Codex prompt
          </button>
        </div>
      </section>
    </section>
  )
}

function IssueList({ issues, empty }: { issues: string[]; empty: string }) {
  return (
    <ul className={issues.length > 0 ? 'issue-list' : 'issue-list ok'}>
      {issues.length > 0 ? (
        issues.slice(0, 4).map((issue) => <li key={issue}>{issue}</li>)
      ) : (
        <li>{empty}</li>
      )}
    </ul>
  )
}

function NodeDetailPanel({
  node,
  locale,
  t,
  isBusy,
  onStartInterview,
  onDecompose,
  onConfirmLeaf,
  onTextChange,
}: {
  node: ProgramNode | null
  locale: Locale
  t: UiText
  isBusy: boolean
  onStartInterview: () => void
  onDecompose: () => void
  onConfirmLeaf: () => void
  onTextChange: (title: string, description: string) => void
}) {
  if (!node) {
    return (
      <section className="detail-panel">
        <div className="empty-panel">
          <MessageSquare aria-hidden="true" />
          <p>{t.selectNodeEmpty}</p>
        </div>
      </section>
    )
  }

  const canDecompose = node.status === 'ready_to_decompose'
  const canStartInterview =
    node.status === 'needs_interview' || node.status === 'confirmed_leaf'
  const canConfirm =
    node.status === 'needs_interview' ||
    node.status === 'interviewing' ||
    node.status === 'ready_to_decompose'

  return (
    <section className="detail-panel" aria-label={t.nodeDetailPanel}>
      <div className="detail-header">
        <span className={`status-pill status-${node.status}`}>
          {statusLabels[locale][node.status]}
        </span>
        <span>
          {t.depth} {node.depth}
        </span>
        <span>
          {node.children.length} {t.children}
        </span>
      </div>

      <label htmlFor="nodeTitle">{t.nodeTitle}</label>
      <input
        id="nodeTitle"
        value={node.title}
        onChange={(event) => onTextChange(event.target.value, node.description)}
      />

      <label htmlFor="nodeDescription">{t.description}</label>
      <textarea
        id="nodeDescription"
        value={node.description}
        rows={3}
        onChange={(event) => onTextChange(node.title, event.target.value)}
      />

      <section className="node-summary">
        <h3>{t.latestSummary}</h3>
        <p>{node.summary || t.noSummary}</p>
      </section>

      <section className="node-summary">
        <h3>{t.aiHint}</h3>
        <p>{node.aiHints?.caution || node.aiHints?.suggestedNextAction || t.noHint}</p>
      </section>

      <div className="action-grid action-grid-compact">
        {canStartInterview ? (
          <button type="button" onClick={onStartInterview} disabled={isBusy}>
            <MessageSquare aria-hidden="true" />
            {node.status === 'confirmed_leaf'
              ? t.reopenInterview
              : t.startInterview}
          </button>
        ) : null}
        {canDecompose ? (
          <button
            type="button"
            className="primary-action"
            onClick={onDecompose}
            disabled={isBusy}
          >
            <GitBranchPlus aria-hidden="true" />
            {t.makeChildren}
          </button>
        ) : null}
        {canConfirm ? (
          <button type="button" onClick={onConfirmLeaf} disabled={isBusy}>
            <CheckCircle2 aria-hidden="true" />
            {t.confirmHere}
          </button>
        ) : null}
      </div>

      {node.status === 'expanded' ? <p className="state-note">{t.expandedHelp}</p> : null}
      {node.status === 'confirmed_leaf' ? (
        <p className="state-note">{t.confirmedHelp}</p>
      ) : null}
    </section>
  )
}

function InterviewDock({
  node,
  session,
  t,
  isBusy,
  chatDraft,
  onChatDraftChange,
  onSubmitAnswer,
}: {
  node: ProgramNode | null
  session: InterviewSession | null
  t: UiText
  isBusy: boolean
  chatDraft: string
  onChatDraftChange: (value: string) => void
  onSubmitAnswer: () => void
}) {
  const [showFullLog, setShowFullLog] = useState(false)
  const canAnswer = node?.status === 'interviewing' && session?.status === 'active'
  const latestAiQuestion = [...(session?.messages ?? [])]
    .reverse()
    .find((message) => message.role === 'ai')?.content
  const messages = showFullLog
    ? session?.messages ?? []
    : session?.messages.slice(-4) ?? []

  return (
    <section className="chat-panel bottom-chat-panel">
      <div className="chat-header">
        <h3>{t.chatTitle}</h3>
        {session && session.messages.length > 4 ? (
          <button
            type="button"
            className="text-button"
            onClick={() => setShowFullLog((value) => !value)}
          >
            {showFullLog ? t.hideFullLog : t.showFullLog}
          </button>
        ) : null}
      </div>

      <div className="current-question">
        <span>{t.unresolvedQuestion}</span>
        <p>{latestAiQuestion ?? t.noActiveQuestion}</p>
      </div>

      <div className="chat-log">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            <span>{message.role.toUpperCase()}</span>
            <p>{message.content}</p>
          </div>
        ))}
      </div>

      <div className="chat-compose">
        <label htmlFor="chatDraft">{t.sendAnswer}</label>
        <textarea
          id="chatDraft"
          className="chat-input"
          value={chatDraft}
          rows={3}
          placeholder={t.chatPlaceholder}
          disabled={!canAnswer || isBusy}
          onChange={(event) => onChatDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              onSubmitAnswer()
            }
          }}
        />
        <button
          type="button"
          className="primary-action"
          onClick={onSubmitAnswer}
          disabled={!canAnswer || isBusy || !chatDraft.trim()}
        >
          <Send aria-hidden="true" />
          {t.sendAnswer}
        </button>
      </div>

      {session && session.extractedFacts.length > 0 ? (
        <div className="fact-list">
          <h4>{t.extractedFacts}</h4>
          <ul>
            {session.extractedFacts.map((fact) => (
              <li key={fact.id}>{fact.text}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

function PreviewPanel({
  activeTab,
  text,
  acepFilePaths,
  selectedAcepFilePath,
  onSelectedAcepFilePathChange,
  onTabChange,
  onCopy,
}: {
  activeTab: PreviewTab
  text: string
  acepFilePaths: string[]
  selectedAcepFilePath: string
  onSelectedAcepFilePathChange: (filePath: string) => void
  onTabChange: (tab: PreviewTab) => void
  onCopy: () => void
}) {
  const tabs: Array<{ key: PreviewTab; label: string }> = [
    { key: 'wpd', label: 'WPD' },
    { key: 'vd', label: 'VD' },
    { key: 'acep_files', label: 'ACEP files' },
    { key: 'acep_file_content', label: 'ACEP content' },
    { key: 'acep_bundle', label: 'ACEP bundle' },
    { key: 'acep_prompt', label: 'Codex prompt' },
    { key: 'rpd_artifacts', label: 'RPD artifacts' },
    { key: 'raw', label: 'Raw JSON' },
  ]

  return (
    <section className="artifact-panel" aria-label="PBE preview">
      <div className="artifact-tabs">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
        {activeTab === 'acep_file_content' && acepFilePaths.length > 0 ? (
          <label className="file-picker" htmlFor="acepFilePath">
            <span>File</span>
            <select
              id="acepFilePath"
              value={selectedAcepFilePath}
              onChange={(event) =>
                onSelectedAcepFilePathChange(event.target.value)
              }
            >
              {acepFilePaths.map((filePath) => (
                <option key={filePath} value={filePath}>
                  {filePath}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          type="button"
          className="copy-button"
          onClick={onCopy}
          disabled={!text.trim()}
        >
          <Clipboard aria-hidden="true" />
          Copy
        </button>
      </div>
      <pre>{text || 'Nothing to preview yet.'}</pre>
    </section>
  )
}

function IconButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button type="button" className="icon-button" onClick={onClick} title={label}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

function createFlowElements(
  project: Project,
  selectedNodeId: string | null,
  locale: Locale,
) {
  const nodes = getRootToLeafNodes(project)
  const layout = createTreeLayout(project)

  const flowNodes: FlowNode[] = nodes.map((node) => ({
    id: node.id,
    position: layout.get(node.id) ?? { x: 0, y: node.depth * FLOW_NODE_Y_STEP },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    data: {
      label: (
        <div className="flow-node-label">
          <span className={`status-pill status-${node.status}`}>
            {statusLabels[locale][node.status]}
          </span>
          <strong>{node.title}</strong>
          <small>
            {node.children.length} {i18n[locale].childCount}
          </small>
        </div>
      ),
      status: node.status,
    },
    selected: node.id === selectedNodeId,
    style: {
      borderColor: node.id === selectedNodeId ? '#111827' : '#d1d5db',
      borderWidth: node.id === selectedNodeId ? 2 : 1,
      borderRadius: 8,
      width: 250,
      padding: 0,
      boxShadow: 'none',
    },
  }))
  const flowEdges: FlowEdge[] = project.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#64748b', strokeWidth: 1.5 },
  }))

  return { flowNodes, flowEdges }
}

function createTreeLayout(project: Project) {
  const positions = new Map<string, { x: number; y: number }>()
  let nextLeafIndex = 0

  const visit = (nodeId: string): { left: number; right: number } => {
    const node = project.nodes[nodeId]

    if (!node) {
      const x = nextLeafIndex * FLOW_NODE_X_STEP
      nextLeafIndex += 1
      return { left: x, right: x }
    }

    const childIds = node.children.filter((childId) => project.nodes[childId])

    if (childIds.length === 0) {
      const x = nextLeafIndex * FLOW_NODE_X_STEP
      positions.set(node.id, { x, y: node.depth * FLOW_NODE_Y_STEP })
      nextLeafIndex += 1
      return { left: x, right: x }
    }

    const childLayouts = childIds.map(visit)
    const left = childLayouts[0].left
    const right = childLayouts[childLayouts.length - 1].right
    const x = (left + right) / 2

    positions.set(node.id, { x, y: node.depth * FLOW_NODE_Y_STEP })

    return { left, right }
  }

  if (project.rootNodeId) {
    visit(project.rootNodeId)
  }

  return positions
}

function getPreviewText(
  project: Project,
  activeTab: PreviewTab,
  selectedAcepFilePath: string,
) {
  const blueprint = ensureProjectBlueprint(project)

  switch (activeTab) {
    case 'wpd':
      return [
        '# Work Process Designer',
        '',
        `Status: ${blueprint.status}`,
        '',
        '## Work Designs',
        ...Object.values(blueprint.workDesigns).map(
          (design) =>
            `### ${project.nodes[design.nodeId]?.title ?? design.nodeId}\n${design.summary}\n\nScope:\n${design.scope.map((item) => `- ${item}`).join('\n')}\n\nAcceptance:\n${design.acceptanceCriteria.map((item) => `- ${item}`).join('\n')}`,
        ),
        '',
        '## Roadmap',
        blueprint.implementationRoadmap
          ? JSON.stringify(blueprint.implementationRoadmap, null, 2)
          : 'No roadmap yet.',
      ].join('\n')
    case 'vd':
      return [
        '# Verification Designer',
        '',
        '## Verification Designs',
        ...Object.values(blueprint.verificationDesigns).map(
          (design) =>
            `### ${project.nodes[design.nodeId]?.title ?? design.nodeId}\n${design.summary}\n\nValidation:\n${design.validationCommands.map((item) => `- ${item}`).join('\n')}`,
        ),
        '',
        '## Acceptance Plan',
        blueprint.acceptancePlan
          ? JSON.stringify(blueprint.acceptancePlan, null, 2)
          : 'No acceptance plan yet.',
      ].join('\n')
    case 'acep_files':
      return blueprint.acep
        ? writeVirtualFileList(blueprint.acep)
        : 'No ACEP generated yet.'
    case 'acep_file_content':
      return blueprint.acep && selectedAcepFilePath
        ? [
            `# ${selectedAcepFilePath}`,
            '',
            getAceFileContent(blueprint.acep, selectedAcepFilePath),
          ].join('\n')
        : 'No ACEP file selected yet.'
    case 'acep_bundle':
      return blueprint.acep
        ? writeBundlePreview(blueprint.acep)
        : 'No ACEP generated yet.'
    case 'acep_prompt':
      return blueprint.acep?.topLevelPrompt ?? 'No ACEP generated yet.'
    case 'rpd_artifacts':
      return project.artifacts
        ? getArtifactText(project.artifacts, 'productCharter')
        : 'No RPD artifacts generated yet.'
    case 'raw':
      return JSON.stringify(project, null, 2)
  }
}

function getArtifactText(artifacts: GeneratedArtifacts, activeArtifact: ArtifactKey) {
  return artifacts[activeArtifact]
}

function statusToStepIndex(status: ProjectBlueprint['status']) {
  if (status === 'rpd_in_progress' || status === 'rpd_completed') {
    return 0
  }
  if (status === 'wpd_in_progress' || status === 'wpd_completed') {
    return 1
  }
  if (status === 'vd_in_progress' || status === 'vd_completed') {
    return 2
  }
  return 3
}

function formatProviderStatus(status: LlmProviderStatus) {
  if (status.activeProvider === 'openai') {
    return status.model ? `OpenAI / ${status.model}` : 'OpenAI'
  }

  if (status.requestedProvider === 'openai') {
    return status.fallbackReason ? 'Mock fallback' : 'Mock'
  }

  return 'Mock'
}

export default App
