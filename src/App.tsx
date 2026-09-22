import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileCode2,
  FileSearch,
  FileText,
  FlaskConical,
  Github,
  KeyRound,
  Lightbulb,
  Loader2,
  Network,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'
import {
  CCF_EDITION,
  CCF_SOURCE_URL,
  areaOrder,
  conferences,
  outlineByArea,
  type Area,
  type Conference,
  type Tier,
} from './data/conferences'
import {
  innovationCouncil,
  inspirationProjects,
  paperReviewers,
  sectionActions,
  workflowStages,
  type WorkflowStage,
} from './data/researchMethods'
import {
  buildConsensusPrompt,
  buildIdeaContext,
  buildLatex,
  buildMetaReviewPrompt,
  buildPaperReviewPrompt,
  buildPaperText,
  buildSectionPrompt,
  emptyIdeaSpec,
  getSubmissionChecks,
  ideaCompleteness,
  offlineConsensus,
  offlineCouncilOpinion,
  offlineMetaReview,
  offlinePaperReview,
  offlineSectionAssist,
  searchQueriesFromIdea,
  searchSemanticScholar,
  type CouncilOpinion,
  type EvidenceItem,
  type IdeaSpec,
  type ReviewOpinion,
} from './lib/research'
import {
  callModel,
  providerDefaults,
  readSessionAIConfig,
  writeSessionAIConfig,
  type AIConfig,
  type ProviderId,
} from './lib/ai'

type DraftMap = Record<string, string>
type ManualChecks = Record<string, boolean>

const STORAGE_KEY = 'paperforge:workspace:v3'

interface StoredWorkspace {
  selectedId?: string
  idea?: IdeaSpec
  drafts?: DraftMap
  evidence?: EvidenceItem[]
  section?: string
  manualChecks?: ManualChecks
}

function loadWorkspace(): StoredWorkspace {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function firstArea(conf: Conference): Area {
  return conf.areas[0] || 'AI'
}

function updateArrayItem<T extends { id: string }>(items: T[], id: string, patch: Partial<T>) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

function downloadText(filename: string, text: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function App() {
  const initial = useMemo(loadWorkspace, [])
  const [view, setView] = useState<WorkflowStage>('Project')
  const [tier, setTier] = useState<'All' | Tier>('All')
  const [area, setArea] = useState<'All' | Area>('All')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(initial.selectedId || conferences[0].id)
  const [section, setSection] = useState(initial.section || 'Introduction')
  const [drafts, setDrafts] = useState<DraftMap>(initial.drafts || {})
  const [idea, setIdea] = useState<IdeaSpec>({ ...emptyIdeaSpec, ...(initial.idea || {}) })
  const [evidence, setEvidence] = useState<EvidenceItem[]>(initial.evidence || [])
  const [manualChecks, setManualChecks] = useState<ManualChecks>(initial.manualChecks || {})

  const [showSettings, setShowSettings] = useState(false)
  const [aiConfig, setAIConfig] = useState<AIConfig>(() => readSessionAIConfig())
  const [aiOutput, setAIOutput] = useState('')
  const [aiBusy, setAIBusy] = useState(false)
  const [aiError, setAIError] = useState('')

  const [councilOpinions, setCouncilOpinions] = useState<CouncilOpinion[]>([])
  const [consensus, setConsensus] = useState('')
  const [councilBusy, setCouncilBusy] = useState(false)

  const [litQuery, setLitQuery] = useState('')
  const [litResults, setLitResults] = useState<EvidenceItem[]>([])
  const [litBusy, setLitBusy] = useState(false)
  const [litError, setLitError] = useState('')

  const [reviewReports, setReviewReports] = useState<ReviewOpinion[]>([])
  const [metaReview, setMetaReview] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return conferences.filter((c) => {
      const tierOk = tier === 'All' || c.tier === tier
      const areaOk = area === 'All' || c.areas.includes(area)
      const textOk =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.areas.some((x) => x.toLowerCase().includes(q))
      return tierOk && areaOk && textOk
    })
  }, [tier, area, query])

  const selected = conferences.find((c) => c.id === selectedId) || conferences[0]
  const outline = outlineByArea[firstArea(selected)]
  const draftKey = selected.id + ':' + section
  const currentDraft = drafts[draftKey] || ''
  const completeness = ideaCompleteness(idea)

  useEffect(() => {
    if (!outline.includes(section)) setSection(outline[0])
  }, [selectedId, outline, section])

  useEffect(() => {
    const state: StoredWorkspace = { selectedId, idea, drafts, evidence, section, manualChecks }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [selectedId, idea, drafts, evidence, section, manualChecks])

  const draftedSections = outline.filter((name) => (drafts[selected.id + ':' + name] || '').trim().length > 80).length

  const updateIdea = (key: keyof IdeaSpec, value: string) => {
    setIdea((prev) => ({ ...prev, [key]: value }))
  }

  const updateDraft = (value: string) => {
    setDrafts((prev) => ({ ...prev, [draftKey]: value }))
  }

  const exportLatex = () => {
    const doc = buildLatex(selected, outline, drafts, idea)
    downloadText(selected.name.toLowerCase() + '-paperforge.tex', doc)
  }

  const exportProject = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      conference: selected,
      idea,
      evidence,
      outline,
      drafts: Object.fromEntries(outline.map((name) => [name, drafts[selected.id + ':' + name] || ''])),
      councilOpinions,
      consensus,
      reviewReports,
      metaReview,
    }
    downloadText(
      (idea.title || selected.name + '-paper').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.paperforge.json',
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8',
    )
  }

  const runIdeaCoach = async () => {
    setAIBusy(true)
    setAIError('')
    setAIOutput('')
    try {
      if (!aiConfig.apiKey) {
        setAIOutput(
          'OFFLINE IDEA COACH\n\nIdea completeness: ' +
            completeness +
            '%\n\nUse the Innovation Council below for independent adversarial checks. Before writing, make sure the problem, closest prior-art gap, falsifiable hypothesis, strong baselines, decisive experiment, null-result interpretation, and failure criteria are all explicit.',
        )
      } else {
        const output = await callModel(aiConfig, [
          {
            role: 'system',
            content:
              'You are PaperForge Idea Coach. Be rigorous, skeptical, evidence-aware, and constructive. Never invent citations or experimental results.',
          },
          {
            role: 'user',
            content:
              'Analyze this research IdeaSpec before paper writing. Return Markdown with: Core story, hidden assumptions, novelty risks, missing evidence, strongest alternative explanation, decisive experiment, and concrete field-by-field revisions.\n\n' +
              buildIdeaContext(idea, selected),
          },
        ])
        setAIOutput(output)
      }
    } catch (error: any) {
      setAIError(error?.message || String(error))
    } finally {
      setAIBusy(false)
    }
  }

  const runInnovationCouncil = async () => {
    setCouncilBusy(true)
    setConsensus('')
    setCouncilOpinions([])
    setAIError('')
    try {
      let opinions: CouncilOpinion[]
      if (!aiConfig.apiKey) {
        opinions = innovationCouncil.map((lens) => offlineCouncilOpinion(lens, idea, evidence))
      } else {
        const settled = await Promise.allSettled(
          innovationCouncil.map(async (lens) => {
            const statement = await callModel(aiConfig, [
              {
                role: 'system',
                content:
                  'You are an independent research-method specialist in a multi-perspective innovation council. Be objective and do not optimize for agreement.',
              },
              { role: 'user', content: buildConsensusSafeCouncilPrompt(lens, idea, selected, evidence) },
            ])
            return { id: lens.id, title: lens.title, source: lens.source, focus: lens.focus, statement }
          }),
        )
        opinions = settled.map((result, index) =>
          result.status === 'fulfilled'
            ? result.value
            : offlineCouncilOpinion(innovationCouncil[index], idea, evidence),
        )
      }
      setCouncilOpinions(opinions)

      if (!aiConfig.apiKey) {
        setConsensus(offlineConsensus(idea, opinions, evidence))
      } else {
        const synthesis = await callModel(aiConfig, [
          {
            role: 'system',
            content:
              'You are PaperForge Consensus Chair. Agreement is not truth. Preserve material dissent, criticize the reviewers too, and only retain defensible novelty claims.',
          },
          { role: 'user', content: buildConsensusPrompt(idea, selected, opinions, evidence) },
        ])
        setConsensus(synthesis)
      }
    } catch (error: any) {
      setAIError(error?.message || String(error))
    } finally {
      setCouncilBusy(false)
    }
  }

  const runSectionAction = async (action: string) => {
    setAIBusy(true)
    setAIError('')
    setAIOutput('')
    try {
      if (!aiConfig.apiKey) {
        setAIOutput(offlineSectionAssist(action, section, currentDraft, idea))
      } else {
        const output = await callModel(aiConfig, [
          {
            role: 'system',
            content:
              'You are PaperForge Writing Copilot. Never invent citations, results, measurements, datasets, or claims not present in the supplied project context. Mark missing evidence explicitly.',
          },
          { role: 'user', content: buildSectionPrompt(action, section, currentDraft, idea, selected, evidence) },
        ])
        setAIOutput(output)
      }
    } catch (error: any) {
      setAIError(error?.message || String(error))
    } finally {
      setAIBusy(false)
    }
  }

  const doLiteratureSearch = async (searchText?: string) => {
    const q = (searchText || litQuery).trim()
    if (!q) return
    setLitBusy(true)
    setLitError('')
    try {
      const results = await searchSemanticScholar(q)
      setLitResults(results)
    } catch (error: any) {
      setLitError(
        (error?.message || String(error)) +
          '. The public endpoint can be rate-limited or blocked by browser CORS; you can still add evidence manually.',
      )
    } finally {
      setLitBusy(false)
    }
  }

  const addEvidence = (item: EvidenceItem) => {
    setEvidence((prev) => (prev.some((x) => x.id === item.id) ? prev : [...prev, item]))
  }

  const addManualEvidence = () => {
    const item: EvidenceItem = {
      id: 'manual-' + Date.now(),
      title: 'Untitled evidence item',
      stance: 'context',
      linkedClaim: '',
      note: '',
    }
    setEvidence((prev) => [item, ...prev])
  }

  const runPaperReview = async () => {
    setReviewBusy(true)
    setReviewReports([])
    setMetaReview('')
    setAIError('')
    const paperText = buildPaperText(outline, drafts, selected.id)
    try {
      let reports: ReviewOpinion[]
      if (!aiConfig.apiKey) {
        reports = paperReviewers.map((reviewer) => offlinePaperReview(reviewer, idea, paperText, evidence))
      } else {
        const settled = await Promise.allSettled(
          paperReviewers.map(async (reviewer) => {
            const report = await callModel(aiConfig, [
              {
                role: 'system',
                content:
                  'You are an independent specialist peer reviewer. Critique the manuscript, not the authors. Do not fabricate missing details and do not predict acceptance probability.',
              },
              { role: 'user', content: buildPaperReviewPrompt(reviewer, idea, selected, paperText, evidence) },
            ])
            return { id: reviewer.id, title: reviewer.title, source: reviewer.source, focus: reviewer.focus, report }
          }),
        )
        reports = settled.map((result, index) =>
          result.status === 'fulfilled'
            ? result.value
            : offlinePaperReview(paperReviewers[index], idea, paperText, evidence),
        )
      }
      setReviewReports(reports)

      if (!aiConfig.apiKey) {
        setMetaReview(offlineMetaReview(reports))
      } else {
        const synthesis = await callModel(aiConfig, [
          {
            role: 'system',
            content:
              'You are a neutral meta-reviewer. Synthesize, challenge, and prioritize the specialist reports. Do not simply average opinions.',
          },
          { role: 'user', content: buildMetaReviewPrompt(reports, selected) },
        ])
        setMetaReview(synthesis)
      }
    } catch (error: any) {
      setAIError(error?.message || String(error))
    } finally {
      setReviewBusy(false)
    }
  }

  const submissionChecks = getSubmissionChecks(selected, outline, drafts, idea, evidence)
  const passedChecks = submissionChecks.filter((item) =>
    item.status === 'pass' || (item.status === 'manual' && manualChecks[item.id]),
  ).length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={18} /></div>
          <div>
            <div className="brand-title">PaperForge</div>
            <div className="brand-subtitle">From research idea to conference-ready submission</div>
          </div>
        </div>

        <nav className="main-nav">
          {workflowStages.map((stage) => (
            <button
              key={stage.id}
              className={view === stage.id ? 'nav-tab active' : 'nav-tab'}
              onClick={() => setView(stage.id)}
              title={stage.description}
            >
              {stage.id}
            </button>
          ))}
        </nav>

        <div className="top-actions">
          <button className={aiConfig.apiKey ? 'ghost-btn connected' : 'ghost-btn'} onClick={() => setShowSettings(true)}>
            <Settings size={16} /> {aiConfig.apiKey ? aiConfig.provider + ' ready' : 'API Settings'}
          </button>
          <a className="ghost-btn" href="https://github.com/hua1xiao2sheng/PaperForge" target="_blank" rel="noreferrer">
            <Github size={16} /> GitHub
          </a>
        </div>
      </header>

      <main className="workspace">
        <aside className="left-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">TARGET VENUE</div>
              <h2>Choose conference</h2>
            </div>
            <span className="count-badge">{filtered.length}</span>
          </div>

          <div className="search-box">
            <Search size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ICLR, SIGMOD, ICSE..." />
          </div>

          <div className="filter-block">
            <div className="filter-label">CCF tier</div>
            <div className="chips">
              {(['All', 'A', 'B'] as const).map((x) => (
                <button key={x} className={tier === x ? 'chip active' : 'chip'} onClick={() => setTier(x)}>{x}</button>
              ))}
            </div>
          </div>

          <div className="filter-block">
            <div className="filter-label">Research area</div>
            <div className="chips area-chips">
              <button className={area === 'All' ? 'chip active' : 'chip'} onClick={() => setArea('All')}>All</button>
              {areaOrder.map((x) => (
                <button key={x} className={area === x ? 'chip active' : 'chip'} onClick={() => setArea(x)}>{x}</button>
              ))}
            </div>
          </div>

          <div className="conference-list">
            {filtered.map((c) => (
              <button
                key={c.id}
                className={selected.id === c.id ? 'conference-card selected' : 'conference-card'}
                onClick={() => setSelectedId(c.id)}
              >
                <div className="conference-card-top">
                  <span className={'tier-badge tier-' + c.tier}>CCF {c.tier}</span>
                  <span className="template-pill">{c.templateFamily}</span>
                </div>
                <div className="conference-name">{c.name}</div>
                <div className="conference-full">{c.fullName}</div>
                <div className="tag-row">
                  {c.areas.map((a) => <span key={a} className="mini-tag">{a}</span>)}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="center-panel">
          {view === 'Project' && (
            <ProjectView
              selected={selected}
              completeness={completeness}
              evidenceCount={evidence.length}
              draftedSections={draftedSections}
              totalSections={outline.length}
              reviewCount={reviewReports.length}
              onGo={setView}
            />
          )}

          {view === 'Idea Lab' && (
            <IdeaLabView
              idea={idea}
              updateIdea={updateIdea}
              completeness={completeness}
              runIdeaCoach={runIdeaCoach}
              runInnovationCouncil={runInnovationCouncil}
              councilBusy={councilBusy}
              opinions={councilOpinions}
              consensus={consensus}
              aiOutput={aiOutput}
              aiBusy={aiBusy}
            />
          )}

          {view === 'Literature' && (
            <LiteratureView
              idea={idea}
              query={litQuery}
              setQuery={setLitQuery}
              search={doLiteratureSearch}
              suggestions={searchQueriesFromIdea(idea)}
              results={litResults}
              busy={litBusy}
              error={litError}
              evidence={evidence}
              addEvidence={addEvidence}
              addManualEvidence={addManualEvidence}
              updateEvidence={(id, patch) => setEvidence((prev) => updateArrayItem(prev, id, patch))}
              removeEvidence={(id) => setEvidence((prev) => prev.filter((x) => x.id !== id))}
            />
          )}

          {view === 'Writing' && (
            <WritingView
              selected={selected}
              outline={outline}
              section={section}
              setSection={setSection}
              currentDraft={currentDraft}
              updateDraft={updateDraft}
              runAction={runSectionAction}
              aiOutput={aiOutput}
              aiBusy={aiBusy}
              applyAI={(mode) => {
                if (!aiOutput) return
                updateDraft(mode === 'replace' ? aiOutput : (currentDraft ? currentDraft + '\n\n' : '') + aiOutput)
              }}
              exportLatex={exportLatex}
            />
          )}

          {view === 'Review' && (
            <ReviewView
              runReview={runPaperReview}
              busy={reviewBusy}
              reports={reviewReports}
              metaReview={metaReview}
              draftedSections={draftedSections}
              totalSections={outline.length}
              evidenceCount={evidence.length}
            />
          )}

          {view === 'Submission' && (
            <SubmissionView
              selected={selected}
              checks={submissionChecks}
              manualChecks={manualChecks}
              toggleManual={(id) => setManualChecks((prev) => ({ ...prev, [id]: !prev[id] }))}
              passed={passedChecks}
              exportLatex={exportLatex}
              exportProject={exportProject}
            />
          )}

          {aiError && (
            <div className="global-error">
              <AlertTriangle size={16} />
              <span>{aiError}</span>
            </div>
          )}
        </section>

        <aside className="right-panel">
          <RightContext
            selected={selected}
            outline={outline}
            section={section}
            setSection={setSection}
            completeness={completeness}
            evidenceCount={evidence.length}
            draftedSections={draftedSections}
            aiConfig={aiConfig}
          />
        </aside>
      </main>

      {showSettings && (
        <SettingsModal
          config={aiConfig}
          setConfig={setAIConfig}
          close={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

function buildConsensusSafeCouncilPrompt(
  lens: (typeof innovationCouncil)[number],
  idea: IdeaSpec,
  conference: Conference,
  evidence: EvidenceItem[],
) {
  const evidenceText = evidence.length
    ? evidence
        .slice(0, 20)
        .map((e, i) => String(i + 1) + '. [' + e.stance + '] ' + e.title + ' — linked claim: ' + (e.linkedClaim || 'unlinked'))
        .join('\n')
    : 'No evidence items yet.'

  return [
    lens.prompt,
    '',
    'Act independently. Do not assume the research gap is real merely because the user states it.',
    'Return Markdown with exactly these headings: ## Position, ## Strongest reason, ## Strongest objection, ## Missing evidence, ## Discriminating experiment, ## Revision required.',
    '',
    buildIdeaContext(idea, conference),
    '',
    'CURRENT EVIDENCE MATRIX',
    evidenceText,
  ].join('\n')
}

function ProjectView(props: {
  selected: Conference
  completeness: number
  evidenceCount: number
  draftedSections: number
  totalSections: number
  reviewCount: number
  onGo: (view: WorkflowStage) => void
}) {
  const progress = [
    { label: 'IdeaSpec', value: props.completeness + '%', ready: props.completeness >= 75, go: 'Idea Lab' as WorkflowStage },
    { label: 'Evidence', value: props.evidenceCount + ' items', ready: props.evidenceCount >= 5, go: 'Literature' as WorkflowStage },
    { label: 'Writing', value: props.draftedSections + '/' + props.totalSections, ready: props.draftedSections >= Math.max(3, Math.floor(props.totalSections / 2)), go: 'Writing' as WorkflowStage },
    { label: 'Review', value: props.reviewCount ? props.reviewCount + ' lenses' : 'Not run', ready: props.reviewCount > 0, go: 'Review' as WorkflowStage },
  ]

  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">PAPER PROJECT</div>
          <h1>{props.selected.name} Research Workspace</h1>
          <p>{props.selected.fullName}</p>
        </div>
        <span className={'tier-badge tier-' + props.selected.tier}>CCF {props.selected.tier}</span>
      </div>

      <div className="hero-card">
        <div>
          <span className="hero-kicker">Research contract</span>
          <h2>Idea → evidence → writing → adversarial review → submission</h2>
          <p>
            PaperForge keeps the venue, IdeaSpec, evidence matrix, section drafts, reviewer opinions, and submission checks connected instead of asking one model to write a whole paper in one shot.
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary-btn" onClick={() => props.onGo('Idea Lab')}><Lightbulb size={16} /> Start from Idea Lab</button>
          <button className="secondary-btn" onClick={() => props.onGo('Writing')}><FileText size={16} /> Open writing desk</button>
        </div>
      </div>

      <div className="section-title"><span>Workflow readiness</span><small>Human-controlled gates</small></div>
      <div className="metric-grid">
        {progress.map((item) => (
          <button key={item.label} className="metric-card" onClick={() => props.onGo(item.go)}>
            <div className="metric-icon">{item.ready ? <CheckCircle2 size={18} /> : <ChevronRight size={18} />}</div>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="section-title"><span>Method stack</span><small>High-adoption projects used as methodological references</small></div>
      <div className="inspiration-grid">
        {inspirationProjects.map((project) => (
          <a key={project.id} className="inspiration-card" href={project.repo} target="_blank" rel="noreferrer">
            <div className="inspiration-top">
              <strong>{project.name}</strong>
              <span>{project.stars}</span>
            </div>
            <div className="mini-label">{project.role}</div>
            <p>{project.method}</p>
            <div className="source-foot"><Github size={13} /> {project.repo.replace('https://github.com/', '')} <ExternalLink size={12} /></div>
          </a>
        ))}
      </div>

      <div className="source-note">
        <ShieldCheck size={17} />
        <div>
          <strong>Independent implementation</strong>
          <p>PaperForge borrows workflow ideas and evaluation disciplines, not upstream source code. Each upstream repository keeps its own license and attribution requirements.</p>
        </div>
      </div>
    </div>
  )
}

function IdeaLabView(props: {
  idea: IdeaSpec
  updateIdea: (key: keyof IdeaSpec, value: string) => void
  completeness: number
  runIdeaCoach: () => void
  runInnovationCouncil: () => void
  councilBusy: boolean
  opinions: CouncilOpinion[]
  consensus: string
  aiOutput: string
  aiBusy: boolean
}) {
  const fields: Array<{ key: keyof IdeaSpec; label: string; placeholder: string; wide?: boolean }> = [
    { key: 'title', label: 'Working title', placeholder: 'A temporary title is enough.' },
    { key: 'topic', label: 'Research topic', placeholder: 'What narrow topic are you investigating?' },
    { key: 'problem', label: 'Problem', placeholder: 'What concrete problem exists and for whom?', wide: true },
    { key: 'gap', label: 'Research gap', placeholder: 'What is missing in named prior approaches? Avoid “nobody studied this” without evidence.', wide: true },
    { key: 'coreIdea', label: 'Core idea / mechanism', placeholder: 'What exactly will you change, add, remove, or test?', wide: true },
    { key: 'hypothesis', label: 'Falsifiable hypothesis', placeholder: 'If the idea is correct, what should happen? What observation would make it wrong?', wide: true },
    { key: 'noveltyClaim', label: 'Provisional novelty claim', placeholder: 'The smallest defensible statement of what is new.', wide: true },
    { key: 'contributions', label: 'Contributions', placeholder: 'One contribution per line.', wide: true },
    { key: 'method', label: 'Technical route', placeholder: 'Algorithm / system / model / analytical path.', wide: true },
    { key: 'experiments', label: 'Decisive experiments', placeholder: 'Which experiments change belief in the central claims?', wide: true },
    { key: 'baselines', label: 'Strong baselines', placeholder: 'What is the hardest fair comparison?', wide: true },
    { key: 'datasets', label: 'Data / environment', placeholder: 'Datasets, benchmark, simulator, database, codebase, compute.', wide: true },
    { key: 'successCriteria', label: 'Success & failure criteria', placeholder: 'Predeclare metrics, thresholds, null-result interpretation.', wide: true },
    { key: 'risks', label: 'Risks / failure modes', placeholder: 'Where can the idea fail or become uninformative?', wide: true },
    { key: 'assumptions', label: 'Assumptions', placeholder: 'What must be true for the reasoning to hold?', wide: true },
  ]

  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">IDEA LAB</div>
          <h1>Build a defensible research idea</h1>
          <p>Independent ideation first; evidence and adversarial review before convergence.</p>
        </div>
        <div className="score-ring"><strong>{props.completeness}%</strong><span>IdeaSpec</span></div>
      </div>

      <div className="action-bar">
        <button className="secondary-btn" onClick={props.runIdeaCoach} disabled={props.aiBusy}>
          {props.aiBusy ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />} Analyze IdeaSpec
        </button>
        <button className="primary-btn" onClick={props.runInnovationCouncil} disabled={props.councilBusy}>
          {props.councilBusy ? <Loader2 className="spin" size={16} /> : <Users size={16} />} Run Innovation Council
        </button>
      </div>

      <div className="idea-grid">
        {fields.map((field) => (
          <label key={field.key} className={field.wide ? 'field-card wide' : 'field-card'}>
            <span>{field.label}</span>
            <textarea
              value={props.idea[field.key]}
              onChange={(e) => props.updateIdea(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={field.wide ? 3 : 2}
            />
          </label>
        ))}
      </div>

      {props.aiOutput && (
        <div className="analysis-card">
          <div className="card-title"><Sparkles size={16} /> Idea Coach</div>
          <pre>{props.aiOutput}</pre>
        </div>
      )}

      <div className="section-title"><span>Innovation Council</span><small>Each speaker uses a different methodology, then a separate meta-critic synthesizes</small></div>
      <div className="council-grid">
        {innovationCouncil.map((lens) => {
          const result = props.opinions.find((x) => x.id === lens.id)
          return (
            <div className="council-card" key={lens.id}>
              <div className="council-head">
                <div>
                  <strong>{lens.title}</strong>
                  <span>{lens.source}</span>
                </div>
                <Network size={17} />
              </div>
              <div className="focus-pill">{lens.focus}</div>
              <p className="lens-method">{lens.prompt}</p>
              {result ? <pre>{result.statement}</pre> : <div className="empty-state">Waiting for this speaker.</div>}
            </div>
          )
        })}
      </div>

      {props.consensus && (
        <div className="consensus-card">
          <div className="card-title"><ShieldCheck size={17} /> Critical synthesis & consensus</div>
          <pre>{props.consensus}</pre>
        </div>
      )}
    </div>
  )
}

function LiteratureView(props: {
  idea: IdeaSpec
  query: string
  setQuery: (value: string) => void
  search: (text?: string) => void
  suggestions: string[]
  results: EvidenceItem[]
  busy: boolean
  error: string
  evidence: EvidenceItem[]
  addEvidence: (item: EvidenceItem) => void
  addManualEvidence: () => void
  updateEvidence: (id: string, patch: Partial<EvidenceItem>) => void
  removeEvidence: (id: string) => void
}) {
  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">LITERATURE & EVIDENCE</div>
          <h1>Research before writing</h1>
          <p>Perspective-guided questions + searchable prior art + a claim-to-evidence matrix.</p>
        </div>
        <button className="secondary-btn" onClick={props.addManualEvidence}><Plus size={16} /> Add manually</button>
      </div>

      <div className="research-plan-card">
        <div className="card-title"><FileSearch size={17} /> Suggested search plan</div>
        <div className="query-chips">
          {props.suggestions.map((q) => (
            <button key={q} onClick={() => { props.setQuery(q); props.search(q) }}>{q}</button>
          ))}
        </div>
      </div>

      <div className="literature-search">
        <Search size={17} />
        <input
          value={props.query}
          onChange={(e) => props.setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && props.search()}
          placeholder="Search Semantic Scholar by concept, method, gap, or baseline..."
        />
        <button className="primary-btn" onClick={() => props.search()} disabled={props.busy}>
          {props.busy ? <Loader2 className="spin" size={16} /> : 'Search'}
        </button>
      </div>
      {props.error && <div className="inline-warning"><AlertTriangle size={15} /> {props.error}</div>}

      {props.results.length > 0 && (
        <>
          <div className="section-title"><span>Search results</span><small>Add only papers you actually want in the evidence matrix</small></div>
          <div className="paper-results">
            {props.results.map((paper) => (
              <div className="paper-result" key={paper.id}>
                <div className="paper-main">
                  <strong>{paper.title}</strong>
                  <span>{[paper.year, paper.venue, paper.citationCount != null ? paper.citationCount + ' citations' : ''].filter(Boolean).join(' · ')}</span>
                  {paper.authors && <small>{paper.authors}</small>}
                </div>
                <div className="paper-actions">
                  {paper.url && <a href={paper.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a>}
                  <button onClick={() => props.addEvidence(paper)}><Plus size={15} /> Evidence</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-title"><span>Evidence matrix</span><small>{props.evidence.length} items · include support and challenge evidence</small></div>
      {props.evidence.length === 0 ? (
        <div className="big-empty">
          <BookOpen size={28} />
          <strong>No evidence yet</strong>
          <p>Add papers from search or create a manual item. A novelty claim should not be finalized from an empty matrix.</p>
        </div>
      ) : (
        <div className="evidence-list">
          {props.evidence.map((item) => (
            <div className="evidence-card" key={item.id}>
              <div className="evidence-top">
                <input
                  className="evidence-title-input"
                  value={item.title}
                  onChange={(e) => props.updateEvidence(item.id, { title: e.target.value })}
                />
                <button className="icon-btn danger" onClick={() => props.removeEvidence(item.id)}><Trash2 size={15} /></button>
              </div>
              <div className="evidence-meta">{[item.year, item.venue, item.authors].filter(Boolean).join(' · ')}</div>
              <div className="evidence-controls">
                <label>
                  <span>Role</span>
                  <select value={item.stance} onChange={(e) => props.updateEvidence(item.id, { stance: e.target.value as EvidenceItem['stance'] })}>
                    <option value="support">Support</option>
                    <option value="challenge">Challenge</option>
                    <option value="context">Context</option>
                  </select>
                </label>
                <label>
                  <span>Linked claim</span>
                  <input value={item.linkedClaim} onChange={(e) => props.updateEvidence(item.id, { linkedClaim: e.target.value })} placeholder="Which claim does this evidence affect?" />
                </label>
              </div>
              <textarea value={item.note} onChange={(e) => props.updateEvidence(item.id, { note: e.target.value })} placeholder="What does this paper actually support or challenge?" rows={3} />
              {item.url && <a className="source-link" href={item.url} target="_blank" rel="noreferrer">Open source <ExternalLink size={13} /></a>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WritingView(props: {
  selected: Conference
  outline: string[]
  section: string
  setSection: (value: string) => void
  currentDraft: string
  updateDraft: (value: string) => void
  runAction: (action: string) => void
  aiOutput: string
  aiBusy: boolean
  applyAI: (mode: 'append' | 'replace') => void
  exportLatex: () => void
}) {
  const words = props.currentDraft.trim() ? props.currentDraft.trim().split(/\s+/).length : 0
  return (
    <div className="writing-layout">
      <div className="writing-main">
        <div className="page-title-row compact">
          <div>
            <div className="eyebrow">WRITING DESK · {props.selected.name}</div>
            <h1>{props.section}</h1>
          </div>
          <button className="secondary-btn" onClick={props.exportLatex}><FileCode2 size={16} /> Export LaTeX</button>
        </div>

        <div className="section-strip">
          {props.outline.map((name) => (
            <button key={name} className={props.section === name ? 'section-tab active' : 'section-tab'} onClick={() => props.setSection(name)}>
              {name}
            </button>
          ))}
        </div>

        <div className="writing-card">
          <div className="writing-toolbar">
            <div><span className="status-dot" /> Editing <strong>{props.section}</strong></div>
            <div className="autosave">Local autosave · {words} words</div>
          </div>
          <textarea
            value={props.currentDraft}
            onChange={(e) => props.updateDraft(e.target.value)}
            placeholder={'Write ' + props.section + ' here. Keep claims tied to the IdeaSpec and evidence matrix.'}
          />
        </div>
      </div>

      <aside className="copilot-panel">
        <div className="card-title"><Sparkles size={17} /> Section AI Copilot</div>
        <p className="panel-copy">The copilot receives the target venue, IdeaSpec, evidence notes, current section, and current text.</p>
        <div className="action-list">
          {sectionActions.map((action) => (
            <button key={action.id} onClick={() => props.runAction(action.id)} disabled={props.aiBusy}>
              <div>
                <strong>{action.label}</strong>
                <span>{action.description}</span>
              </div>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
        {props.aiBusy && <div className="busy-line"><Loader2 className="spin" size={16} /> AI is analyzing this section...</div>}
        {props.aiOutput && (
          <div className="copilot-output">
            <pre>{props.aiOutput}</pre>
            <div className="output-actions">
              <button onClick={() => props.applyAI('append')}>Append to draft</button>
              <button onClick={() => props.applyAI('replace')}>Replace draft</button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

function ReviewView(props: {
  runReview: () => void
  busy: boolean
  reports: ReviewOpinion[]
  metaReview: string
  draftedSections: number
  totalSections: number
  evidenceCount: number
}) {
  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">REVIEW ROOM</div>
          <h1>Independent reviews before meta-review</h1>
          <p>Specialist reviewers speak independently; the meta-reviewer then critiques both the paper and the reviewers.</p>
        </div>
        <button className="primary-btn" onClick={props.runReview} disabled={props.busy}>
          {props.busy ? <Loader2 className="spin" size={16} /> : <Users size={16} />} Run review ensemble
        </button>
      </div>

      <div className="review-readiness">
        <div><FileText size={16} /><span>{props.draftedSections}/{props.totalSections} sections drafted</span></div>
        <div><BookOpen size={16} /><span>{props.evidenceCount} evidence items</span></div>
        <div><ShieldCheck size={16} /><span>No acceptance prediction; revision-oriented review</span></div>
      </div>

      <div className="reviewer-grid">
        {paperReviewers.map((reviewer) => {
          const report = props.reports.find((x) => x.id === reviewer.id)
          return (
            <div className="reviewer-card" key={reviewer.id}>
              <div className="reviewer-head">
                <div>
                  <strong>{reviewer.title}</strong>
                  <span>{reviewer.source}</span>
                </div>
                <ClipboardCheck size={17} />
              </div>
              <div className="focus-pill">{reviewer.focus}</div>
              {report ? <pre>{report.report}</pre> : <p className="empty-state">Run the ensemble to get this independent report.</p>}
            </div>
          )
        })}
      </div>

      {props.metaReview && (
        <div className="meta-review-card">
          <div className="card-title"><Network size={17} /> Meta-review & revision plan</div>
          <pre>{props.metaReview}</pre>
        </div>
      )}
    </div>
  )
}

function SubmissionView(props: {
  selected: Conference
  checks: ReturnType<typeof getSubmissionChecks>
  manualChecks: ManualChecks
  toggleManual: (id: string) => void
  passed: number
  exportLatex: () => void
  exportProject: () => void
}) {
  const percent = Math.round((props.passed / props.checks.length) * 100)
  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">SUBMISSION GATE</div>
          <h1>Pre-submission audit</h1>
          <p>Formatting, evidence, policy, anonymity, and completeness are checked separately from scientific merit.</p>
        </div>
        <div className="score-ring"><strong>{percent}%</strong><span>checks</span></div>
      </div>

      <div className="submission-actions">
        <button className="primary-btn" onClick={props.exportLatex}><Download size={16} /> Export venue-aware .tex</button>
        <button className="secondary-btn" onClick={props.exportProject}><Download size={16} /> Export PaperForge JSON</button>
        <a className="secondary-btn" href={props.selected.templateUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Official template source</a>
      </div>

      <div className="check-list">
        {props.checks.map((check) => {
          const manuallyDone = check.status === 'manual' && props.manualChecks[check.id]
          const passed = check.status === 'pass' || manuallyDone
          return (
            <div className={'check-card ' + (passed ? 'passed' : check.status)} key={check.id}>
              <div className="check-icon">
                {passed ? <CheckCircle2 size={19} /> : check.status === 'manual' ? <ShieldCheck size={19} /> : <AlertTriangle size={19} />}
              </div>
              <div className="check-copy">
                <strong>{check.label}</strong>
                <p>{check.detail}</p>
              </div>
              {check.status === 'manual' && (
                <label className="manual-toggle">
                  <input type="checkbox" checked={!!props.manualChecks[check.id]} onChange={() => props.toggleManual(check.id)} />
                  verified
                </label>
              )}
            </div>
          )
        })}
      </div>

      <div className="source-note">
        <AlertTriangle size={17} />
        <div>
          <strong>PaperForge cannot certify submission compliance</strong>
          <p>Always re-check the current CFP, author kit, review policy, page limit, anonymity rules, and AI-use disclosure requirements on the official venue site.</p>
        </div>
      </div>
    </div>
  )
}

function RightContext(props: {
  selected: Conference
  outline: string[]
  section: string
  setSection: (value: string) => void
  completeness: number
  evidenceCount: number
  draftedSections: number
  aiConfig: AIConfig
}) {
  return (
    <>
      <div className="context-card">
        <div className="detail-card">
          <div className="detail-icon"><CalendarDays size={17} /></div>
          <div>
            <div className="eyebrow">SUBMISSION</div>
            <h3>{props.selected.name}</h3>
          </div>
        </div>
        {props.selected.deadlines.map((d, i) => (
          <div className="deadline-mini" key={i}>
            <div><strong>{d.label}</strong><span className={'status-pill ' + d.status}>{d.status.toUpperCase()}</span></div>
            <p>{d.paper || d.abstract || 'Next date not yet verified in PaperForge.'}</p>
            <small>{d.timezone || 'Verify timezone on the official CFP.'}</small>
          </div>
        ))}
        <a className="context-link" href={props.selected.templateUrl} target="_blank" rel="noreferrer">
          <FileCode2 size={15} /> Template source <ExternalLink size={13} />
        </a>
        <a className="context-link" href={props.selected.cfpUrl} target="_blank" rel="noreferrer">
          <CalendarDays size={15} /> Venue / CFP source <ExternalLink size={13} />
        </a>
      </div>

      <div className="context-card">
        <div className="card-title"><FileText size={16} /> Paper structure</div>
        {props.outline.map((name) => (
          <button className={props.section === name ? 'outline-link active' : 'outline-link'} key={name} onClick={() => props.setSection(name)}>
            <span>{name}</span><ChevronRight size={14} />
          </button>
        ))}
      </div>

      <div className="context-card">
        <div className="card-title"><FlaskConical size={16} /> Research state</div>
        <div className="state-row"><span>IdeaSpec</span><b>{props.completeness}%</b></div>
        <div className="state-row"><span>Evidence</span><b>{props.evidenceCount}</b></div>
        <div className="state-row"><span>Drafted</span><b>{props.draftedSections}/{props.outline.length}</b></div>
        <div className="state-row"><span>AI</span><b>{props.aiConfig.apiKey ? props.aiConfig.provider : 'Offline'}</b></div>
      </div>

      <div className="context-card subtle">
        <div className="card-title"><ShieldCheck size={16} /> Ranking source</div>
        <p>{CCF_EDITION}. The CCF directory is used as a venue filter, not as a score for an individual paper.</p>
        <a className="source-link" href={CCF_SOURCE_URL} target="_blank" rel="noreferrer">CCF source <ExternalLink size={12} /></a>
      </div>
    </>
  )
}

function SettingsModal(props: {
  config: AIConfig
  setConfig: (config: AIConfig) => void
  close: () => void
}) {
  const [draft, setDraft] = useState<AIConfig>(props.config)
  const providers = Object.keys(providerDefaults) as ProviderId[]

  const setProvider = (provider: ProviderId) => {
    setDraft((prev) => ({ ...prev, provider, model: providerDefaults[provider].model, baseUrl: '' }))
  }

  const save = () => {
    props.setConfig(draft)
    writeSessionAIConfig(draft)
    props.close()
  }

  return (
    <div className="modal-backdrop" onMouseDown={props.close}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">MODEL PROVIDER</div>
            <h2>AI settings</h2>
          </div>
          <button className="close-btn" onClick={props.close}>×</button>
        </div>
        <div className="security-banner">
          <KeyRound size={16} />
          <p>Keys are stored only in this browser tab session and are never committed to GitHub. For a real deployment, move model calls behind a backend secret proxy.</p>
        </div>
        <div className="settings-form">
          <label>
            <span>Provider</span>
            <select value={draft.provider} onChange={(e) => setProvider(e.target.value as ProviderId)}>
              {providers.map((p) => <option value={p} key={p}>{p}</option>)}
            </select>
          </label>
          <label>
            <span>Model</span>
            <input value={draft.model} onChange={(e) => setDraft((prev) => ({ ...prev, model: e.target.value }))} />
          </label>
          <label>
            <span>API key</span>
            <input type="password" value={draft.apiKey} onChange={(e) => setDraft((prev) => ({ ...prev, apiKey: e.target.value }))} placeholder="Leave blank for offline scaffold mode" />
          </label>
          <label>
            <span>Custom endpoint (optional)</span>
            <input value={draft.baseUrl || ''} onChange={(e) => setDraft((prev) => ({ ...prev, baseUrl: e.target.value }))} placeholder="Use only if your provider requires a custom endpoint" />
          </label>
        </div>
        <p className="provider-hint">{providerDefaults[draft.provider].hint}</p>
        <button className="primary-btn full" onClick={save}>Save for this session</button>
      </div>
    </div>
  )
}

export default App
