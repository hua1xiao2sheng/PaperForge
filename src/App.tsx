import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, ExternalLink,
  FileCode2, FileText, Github, KeyRound, Lightbulb, ListChecks, MessageSquareMore,
  Microscope, Search, Settings, Sparkles, UsersRound, XCircle
} from 'lucide-react'
import { areaOrder, conferences, outlineByArea, type Area, type Conference, type Tier } from './data/conferences'
import { buildLatexProject, templatePresets } from './data/templates'
import { inspirations, councilPrinciples } from './data/inspirations'
import {
  analyzeSection, deriveIdeaSpec, reviewPaper, runInnovationCouncil, submissionChecks,
  type CouncilResult, type IdeaSpec, type ReviewResult
} from './lib/researchEngine'

type DraftMap = Record<string, string>
type Tab = 'Project' | 'Idea Lab' | 'Writing' | 'Literature' | 'Review' | 'Submission'
type Evidence = { title:string; source:string; claim:string; stance:'support'|'challenge'|'context' }

const providerNames = ['OpenAI', 'Anthropic', 'Gemini', 'DeepSeek', 'OpenRouter']
const tabs: {name:Tab; icon:any}[] = [
  {name:'Project',icon:Microscope},
  {name:'Idea Lab',icon:Lightbulb},
  {name:'Writing',icon:FileText},
  {name:'Literature',icon:BookOpen},
  {name:'Review',icon:UsersRound},
  {name:'Submission',icon:ListChecks},
]

function firstArea(conf: Conference): Area { return conf.areas[0] }

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Project')
  const [tier, setTier] = useState<'All' | Tier>('All')
  const [area, setArea] = useState<'All' | Area>('All')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(conferences[0].id)
  const [section, setSection] = useState('Introduction')
  const [drafts, setDrafts] = useState<DraftMap>(() => {
    try { return JSON.parse(localStorage.getItem('paperforge:drafts') || '{}') } catch { return {} }
  })
  const [rawIdea, setRawIdea] = useState(() => localStorage.getItem('paperforge:rawIdea') || '')
  const [ideaSpec, setIdeaSpec] = useState<IdeaSpec | null>(() => {
    try { return JSON.parse(localStorage.getItem('paperforge:ideaSpec') || 'null') } catch { return null }
  })
  const [council, setCouncil] = useState<CouncilResult | null>(null)
  const [sectionAnalysis, setSectionAnalysis] = useState<ReturnType<typeof analyzeSection> | null>(null)
  const [reviews, setReviews] = useState<ReviewResult[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [showSettings, setShowSettings] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return conferences.filter(c => {
      const tierOk = tier === 'All' || c.tier === tier
      const areaOk = area === 'All' || c.areas.includes(area)
      const textOk = !q || c.name.toLowerCase().includes(q) || c.fullName.toLowerCase().includes(q) || c.areas.some(x => x.toLowerCase().includes(q))
      return tierOk && areaOk && textOk
    })
  }, [tier, area, query])

  const selected = conferences.find(c => c.id === selectedId) ?? conferences[0]
  const outline = outlineByArea[firstArea(selected)]
  const preset = templatePresets[selected.templateFamily]
  const draftKey = selected.id + ':' + section
  const currentDraft = drafts[draftKey] || ''

  useEffect(() => {
    if (!outline.includes(section)) setSection(outline[0])
  }, [selectedId])

  useEffect(() => localStorage.setItem('paperforge:drafts', JSON.stringify(drafts)), [drafts])
  useEffect(() => localStorage.setItem('paperforge:rawIdea', rawIdea), [rawIdea])
  useEffect(() => {
    if (ideaSpec) localStorage.setItem('paperforge:ideaSpec', JSON.stringify(ideaSpec))
  }, [ideaSpec])

  const exportLatex = () => {
    const doc = buildLatexProject(selected, outline, drafts)
    const blob = new Blob([doc], { type:'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = selected.name.toLowerCase() + '-paperforge-draft.tex'
    a.click()
    URL.revokeObjectURL(url)
  }

  const runCouncil = () => {
    setCouncil(runInnovationCouncil(rawIdea))
  }

  const adoptIdea = () => {
    setIdeaSpec(deriveIdeaSpec(rawIdea))
    setActiveTab('Writing')
  }

  const runReview = () => setReviews(reviewPaper(outline, drafts, selected.id))
  const checks = submissionChecks(outline, drafts, selected.id)
  const passedChecks = checks.filter(x => x.pass).length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={19}/></div>
          <div><div className="brand-title">PaperForge</div><div className="brand-subtitle">From research idea to conference submission</div></div>
        </div>
        <nav className="main-nav">
          {tabs.map(({name,icon:Icon}) => (
            <button key={name} className={activeTab===name?'nav-tab active':'nav-tab'} onClick={() => setActiveTab(name)}>
              <Icon size={15}/>{name}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <button className="ghost-btn" onClick={() => setShowSettings(true)}><Settings size={16}/> API</button>
          <a className="ghost-btn" href="https://github.com/hua1xiao2sheng/PaperForge" target="_blank" rel="noreferrer"><Github size={16}/></a>
        </div>
      </header>

      <div className="project-bar">
        <div className="project-venue"><span className={'tier-badge tier-'+selected.tier}>CCF {selected.tier}</span><strong>{selected.name}</strong><span>{selected.fullName}</span></div>
        <div className="project-progress">
          <span className={ideaSpec?'done':''}>Idea</span><ChevronRight size={12}/>
          <span className={Object.keys(drafts).some(k=>k.startsWith(selected.id+':'))?'done':''}>Write</span><ChevronRight size={12}/>
          <span className={reviews.length?'done':''}>Review</span><ChevronRight size={12}/>
          <span className={passedChecks===checks.length?'done':''}>Submit</span>
        </div>
      </div>

      {activeTab === 'Project' && (
        <main className="project-layout">
          <aside className="venue-browser">
            <div className="panel-heading"><div><div className="eyebrow">TARGET VENUE</div><h2>Conference</h2></div><span className="count-badge">{filtered.length}</span></div>
            <div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search CVPR, SIGMOD, ICSE..."/></div>
            <div className="filter-block"><div className="filter-label">CCF tier</div><div className="chips">
              {(['All','A','B'] as const).map(x=><button key={x} className={tier===x?'chip active':'chip'} onClick={()=>setTier(x)}>{x}</button>)}
            </div></div>
            <div className="filter-block"><div className="filter-label">Research area</div><div className="chips area-chips">
              <button className={area==='All'?'chip active':'chip'} onClick={()=>setArea('All')}>All</button>
              {areaOrder.map(x=><button key={x} className={area===x?'chip active':'chip'} onClick={()=>setArea(x)}>{x}</button>)}
            </div></div>
            <div className="conference-list">
              {filtered.map(c=><button key={c.id} className={selected.id===c.id?'conference-card selected':'conference-card'} onClick={()=>setSelectedId(c.id)}>
                <div className="conference-card-top"><span className={'tier-badge tier-'+c.tier}>CCF {c.tier}</span><span className="template-pill">{c.templateFamily}</span></div>
                <div className="conference-name">{c.name}</div><div className="conference-full">{c.fullName}</div>
              </button>)}
            </div>
          </aside>

          <section className="project-main">
            <div className="hero-card">
              <div><div className="eyebrow">PAPER PROJECT</div><h1>{selected.name} Workspace</h1><p>Venue-aware template, research idea, evidence, section writing, multi-agent review and submission checks in one workflow.</p></div>
              <button className="primary-btn" onClick={()=>setActiveTab('Idea Lab')}><Lightbulb size={17}/> Start with Idea Lab</button>
            </div>
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-icon"><FileCode2 size={18}/></div><h3>Official template</h3>
                <div className="template-preview"><code>{preset.className}</code>{preset.preamble.slice(0,3).map(x=><code key={x}>{x}</code>)}</div>
                <p>PaperForge generates a safe skeleton but keeps the official venue author kit as the source of truth.</p>
                <a className="link-btn" href={selected.templateUrl} target="_blank" rel="noreferrer">Open author kit <ExternalLink size={14}/></a>
              </div>
              <div className="dashboard-card">
                <div className="card-icon"><CalendarDays size={18}/></div><h3>Submission cycle</h3>
                {selected.deadlines.map((d,i)=><div className="deadline-line" key={i}><div><strong>{d.label}</strong><span>{d.abstract?'Abstract '+d.abstract:'Abstract TBA'}</span><span>{d.paper?'Paper '+d.paper:'Paper TBA'}</span></div><span className={'status-pill '+d.status}>{d.status.toUpperCase()}</span></div>)}
                <a className="link-btn" href={selected.cfpUrl} target="_blank" rel="noreferrer">Open official CFP <ExternalLink size={14}/></a>
              </div>
              <div className="dashboard-card wide">
                <div className="card-icon"><Sparkles size={18}/></div><h3>Research workflow inspirations</h3>
                <div className="source-grid">{inspirations.map(x=><a href={x.repo} target="_blank" rel="noreferrer" key={x.id} className="source-card">
                  <div><strong>{x.name}</strong><span>{x.starsLabel}</span></div><b>{x.role}</b><p>{x.borrowedPattern}</p>
                </a>)}</div>
              </div>
            </div>
          </section>
        </main>
      )}

      {activeTab === 'Idea Lab' && (
        <main className="page-layout">
          <section className="page-main">
            <div className="page-heading"><div><div className="eyebrow">IDEA LAB</div><h1>Innovation Council</h1><p>Multiple independent research perspectives speak first; a moderator then synthesizes consensus and preserves disagreement.</p></div></div>
            <div className="idea-input-card">
              <label>Your research idea</label>
              <textarea value={rawIdea} onChange={e=>setRawIdea(e.target.value)} placeholder="Describe the problem, intuition, proposed mechanism, available data and what you think is new..."/>
              <div className="button-row"><button className="primary-btn" onClick={runCouncil}><UsersRound size={17}/> Run multi-project council</button>{council&&<button className="ghost-btn" onClick={adoptIdea}><CheckCircle2 size={16}/> Adopt consensus as IdeaSpec</button>}</div>
            </div>

            {council && <>
              <div className="section-heading"><div><div className="eyebrow">ROUND 1</div><h2>Independent voices</h2></div><span className="count-badge">{council.voices.length} reviewers</span></div>
              <div className="voice-grid">{council.voices.map(v=><article className="voice-card" key={v.id}>
                <div className="voice-head"><div><strong>{v.source}</strong><span>{v.role}</span></div><span className={'verdict '+v.verdict}>{v.verdict}</span></div>
                <h3>{v.headline}</h3><ul>{v.points.map(p=><li key={p}>{p}</li>)}</ul>
              </article>)}</div>
              <div className="consensus-card">
                <div className="consensus-head"><MessageSquareMore size={20}/><div><div className="eyebrow">ROUND 2 · MODERATOR</div><h2>Critical synthesis</h2></div></div>
                <div className="consensus-columns">
                  <div><h4>Shared conclusions</h4>{council.consensus.map(x=><p className="check-line" key={x}><CheckCircle2 size={15}/>{x}</p>)}</div>
                  <div><h4>Unresolved disagreements</h4>{council.disagreements.map(x=><p className="warn-line" key={x}><CircleAlert size={15}/>{x}</p>)}</div>
                  <div><h4>Required next actions</h4>{council.nextActions.map((x,i)=><p className="action-line" key={x}><span>{i+1}</span>{x}</p>)}</div>
                </div>
              </div>
            </>}
          </section>
          <aside className="page-side">
            <div className="side-card"><div className="eyebrow">COUNCIL RULES</div><h3>Consensus ≠ majority vote</h3>{councilPrinciples.map(x=><p key={x}>{x}</p>)}</div>
            {ideaSpec&&<div className="side-card success-card"><CheckCircle2 size={20}/><h3>IdeaSpec adopted</h3><p>{ideaSpec.problem}</p><button className="linkish" onClick={()=>setActiveTab('Writing')}>Continue to writing →</button></div>}
          </aside>
        </main>
      )}

      {activeTab === 'Writing' && (
        <main className="writing-layout">
          <aside className="section-sidebar">
            <div className="eyebrow">PAPER STRUCTURE</div><h2>{selected.name}</h2>
            {outline.map(name=><button key={name} className={section===name?'outline-item active':'outline-item'} onClick={()=>{setSection(name);setSectionAnalysis(null)}}><span>{name}</span><ChevronRight size={14}/></button>)}
          </aside>
          <section className="editor-panel">
            <div className="editor-header"><div><div className="eyebrow">SECTION</div><h1>{section}</h1><p>{ideaSpec?'Checked against adopted IdeaSpec':'No IdeaSpec yet — the copilot will flag story drift.'}</p></div><button className="primary-btn" onClick={exportLatex}><FileCode2 size={17}/> Export .tex</button></div>
            <div className="writing-card">
              <div className="writing-toolbar"><span><span className="status-dot"/>Autosaved locally</span><span>{currentDraft.trim()?currentDraft.trim().split(/\s+/).length:0} words</span></div>
              <textarea value={currentDraft} onChange={e=>setDrafts(prev=>({...prev,[draftKey]:e.target.value}))} placeholder={'Draft '+section+' here...'}/>
              <div className="copilot-actions">
                {['Analyze structure','Find logic gaps','Check IdeaSpec alignment','Reviewer attack'].map(action=><button key={action} onClick={()=>setSectionAnalysis(analyzeSection(section,currentDraft,ideaSpec||undefined))}><Sparkles size={14}/>{action}</button>)}
              </div>
            </div>
            {sectionAnalysis&&<div className="analysis-panel">
              <div><h3>Recommended structure</h3>{sectionAnalysis.structure.map(x=><p key={x}><CheckCircle2 size={14}/>{x}</p>)}</div>
              <div><h3>Critical checks</h3>{sectionAnalysis.critique.map(x=><p key={x}><CircleAlert size={14}/>{x}</p>)}</div>
              <div><h3>Story alignment</h3>{sectionAnalysis.alignment.map(x=><p key={x}><Sparkles size={14}/>{x}</p>)}</div>
            </div>}
          </section>
          <aside className="copilot-side">
            <div className="side-card"><div className="eyebrow">SECTION AI COPILOT</div><h3>Context-aware assistance</h3><p>The action receives the target venue, active section, adopted IdeaSpec and current draft. In this frontend MVP it runs a deterministic local analysis; the provider adapter is reserved for backend LLM calls.</p></div>
            {ideaSpec&&<div className="side-card"><div className="eyebrow">ACTIVE IDEASPEC</div><h3>Stable paper story</h3><p><strong>Gap:</strong> {ideaSpec.gap}</p><p><strong>Mechanism:</strong> {ideaSpec.mechanism}</p></div>}
          </aside>
        </main>
      )}

      {activeTab === 'Literature' && (
        <main className="page-layout">
          <section className="page-main">
            <div className="page-heading"><div><div className="eyebrow">LITERATURE</div><h1>Evidence Workspace</h1><p>STORM-style perspective questions + GPT Researcher-style decomposition + PaperQA-style claim grounding.</p></div></div>
            <div className="pipeline">
              {['Research question','Perspective questions','Search tasks','Candidate papers','Claim-level evidence','Contradictions','Synthesis'].map((x,i)=><div key={x} className="pipeline-step"><span>{i+1}</span><strong>{x}</strong></div>)}
            </div>
            <div className="evidence-form">
              <input id="ev-title" placeholder="Paper / source title"/>
              <input id="ev-source" placeholder="DOI / arXiv / URL"/>
              <input id="ev-claim" placeholder="What exact claim does this evidence support or challenge?"/>
              <button className="primary-btn" onClick={()=>{
                const title=(document.getElementById('ev-title') as HTMLInputElement).value
                const source=(document.getElementById('ev-source') as HTMLInputElement).value
                const claim=(document.getElementById('ev-claim') as HTMLInputElement).value
                if(title&&claim)setEvidence(prev=>[...prev,{title,source,claim,stance:'context'}])
              }}>Add evidence</button>
            </div>
            <div className="evidence-list">{evidence.length?evidence.map((e,i)=><div className="evidence-card" key={i}><div><strong>{e.title}</strong><span>{e.source||'Source not attached yet'}</span></div><p>{e.claim}</p><span className="status-pill tba">context</span></div>):<div className="empty-state"><BookOpen size={24}/><h3>No evidence cards yet</h3><p>Add papers at claim level. Search connectors can be wired to Semantic Scholar, OpenAlex or other providers later.</p></div>}</div>
          </section>
          <aside className="page-side"><div className="side-card"><div className="eyebrow">GROUNDING RULE</div><h3>No citation laundering</h3><p>A literature summary is not enough. Every novelty claim should point to the closest paper and the exact evidence used to justify the comparison.</p></div></aside>
        </main>
      )}

      {activeTab === 'Review' && (
        <main className="page-layout">
          <section className="page-main">
            <div className="page-heading"><div><div className="eyebrow">REVIEW ROOM</div><h1>Multi-reviewer critique</h1><p>Independent reviewer roles first, synthesis second, revision tasks last.</p></div><button className="primary-btn" onClick={runReview}><UsersRound size={17}/> Run review board</button></div>
            {reviews.length===0?<div className="empty-state tall"><UsersRound size={28}/><h3>No review run yet</h3><p>Draft several sections first, then run the board. Reviewers focus on novelty, technical soundness, evidence, reproducibility and clarity.</p></div>:<>
              <div className="review-grid">{reviews.map(r=><article className="review-card" key={r.reviewer}>
                <div className="voice-head"><div><strong>{r.reviewer}</strong><span>{r.focus}</span></div><button className="mini-btn" onClick={()=>{setSection(r.section);setActiveTab('Writing')}}>Open {r.section}</button></div>
                <h4>Strengths</h4>{r.strengths.map(x=><p className="check-line" key={x}><CheckCircle2 size={14}/>{x}</p>)}
                <h4>Weaknesses</h4>{r.weaknesses.map(x=><p className="warn-line" key={x}><CircleAlert size={14}/>{x}</p>)}
                <h4>Questions</h4>{r.questions.map(x=><p key={x}>{x}</p>)}
              </article>)}</div>
              <div className="consensus-card"><div className="consensus-head"><MessageSquareMore size={20}/><div><div className="eyebrow">AREA CHAIR SYNTHESIS</div><h2>Revision priorities</h2></div></div>
                <div className="revision-list">{reviews.flatMap(r=>r.weaknesses.map(w=>({reviewer:r.reviewer,section:r.section,text:w}))).map((x,i)=><div className="revision-row" key={i}><span className={i<2?'priority p0':'priority p1'}>{i<2?'P0':'P1'}</span><div><strong>{x.section}</strong><p>{x.reviewer}: {x.text}</p></div><button className="mini-btn" onClick={()=>{setSection(x.section);setActiveTab('Writing')}}>Fix</button></div>)}</div>
              </div>
            </>}
          </section>
          <aside className="page-side"><div className="side-card"><div className="eyebrow">REVIEW PHILOSOPHY</div><h3>Attack claims, not authors</h3><p>The board separates novelty, technical soundness and reproducibility so one positive impression cannot hide a critical methodological weakness.</p></div></aside>
        </main>
      )}

      {activeTab === 'Submission' && (
        <main className="page-layout">
          <section className="page-main">
            <div className="page-heading"><div><div className="eyebrow">SUBMISSION</div><h1>Readiness checklist</h1><p>{passedChecks}/{checks.length} checks currently pass.</p></div><button className="primary-btn" onClick={exportLatex}><FileCode2 size={17}/> Export current LaTeX</button></div>
            <div className="progress-track"><div style={{width:(passedChecks/checks.length*100)+'%'}}/></div>
            <div className="checklist">{checks.map((c,i)=><div className={c.pass?'check-item pass':'check-item'} key={i}>{c.pass?<CheckCircle2 size={18}/>:<XCircle size={18}/>}<span>{c.label}</span></div>)}</div>
            <div className="submission-cards">
              <div className="dashboard-card"><h3>Template</h3><code>{preset.className}</code><p>{preset.notes.join(' ')}</p><a className="link-btn" href={selected.templateUrl} target="_blank" rel="noreferrer">Official author kit <ExternalLink size={14}/></a></div>
              <div className="dashboard-card"><h3>Deadline</h3>{selected.deadlines.map((d,i)=><div className="deadline-line" key={i}><div><strong>{d.label}</strong><span>{d.paper||'Paper deadline not announced'}</span></div><span className={'status-pill '+d.status}>{d.status}</span></div>)}<a className="link-btn" href={selected.cfpUrl} target="_blank" rel="noreferrer">Official CFP <ExternalLink size={14}/></a></div>
            </div>
          </section>
          <aside className="page-side"><div className="side-card"><div className="eyebrow">FINAL GATE</div><h3>Human sign-off required</h3><p>PaperForge can surface missing sections, unsupported claims and formatting checks, but the author should verify every citation, result, venue rule and disclosure before submission.</p></div></aside>
        </main>
      )}

      {showSettings&&<div className="modal-backdrop" onMouseDown={()=>setShowSettings(false)}><div className="modal" onMouseDown={e=>e.stopPropagation()}>
        <div className="modal-header"><div><div className="eyebrow">MODEL PROVIDERS</div><h2>AI backend settings</h2></div><button className="close-btn" onClick={()=>setShowSettings(false)}>×</button></div>
        <p className="modal-copy">Keys remain intentionally blank. For a public frontend, do not expose provider secrets in browser code. Connect these fields to a server-side provider gateway later.</p>
        <div className="provider-list">{providerNames.map(name=><label key={name}><span><KeyRound size={15}/>{name}</span><input type="password" placeholder={name+' API key — server side recommended'}/></label>)}</div>
        <label className="backend-field"><span>Backend endpoint</span><input placeholder="http://localhost:8000/api"/></label>
        <button className="primary-btn full" onClick={()=>setShowSettings(false)}>Done</button>
      </div></div>}
    </div>
  )
}

export default App
