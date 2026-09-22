import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  FileCode2,
  FileText,
  Github,
  KeyRound,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react'
import { areaOrder, conferences, outlineByArea, type Area, type Conference, type Tier } from './data/conferences'

type DraftMap = Record<string, string>

const providerNames = ['OpenAI', 'Anthropic', 'Gemini', 'DeepSeek', 'OpenRouter']

function firstArea(conf: Conference): Area {
  return conf.areas[0]
}

function App() {
  const [tier, setTier] = useState<'All' | Tier>('All')
  const [area, setArea] = useState<'All' | Area>('All')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(conferences[0].id)
  const [section, setSection] = useState('Introduction')
  const [drafts, setDrafts] = useState<DraftMap>(() => {
    try {
      return JSON.parse(localStorage.getItem('paperforge:drafts') || '{}')
    } catch {
      return {}
    }
  })
  const [showSettings, setShowSettings] = useState(false)

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

  const selected = conferences.find((c) => c.id === selectedId) ?? conferences[0]
  const outline = outlineByArea[firstArea(selected)]

  useEffect(() => {
    if (!outline.includes(section)) setSection(outline[0])
  }, [selectedId])

  useEffect(() => {
    localStorage.setItem('paperforge:drafts', JSON.stringify(drafts))
  }, [drafts])

  const draftKey = selected.id + ':' + section
  const currentDraft = drafts[draftKey] || ''

  const updateDraft = (value: string) => {
    setDrafts((prev) => ({ ...prev, [draftKey]: value }))
  }

  const exportLatex = () => {
    const body = outline
      .map((name) => {
        const key = selected.id + ':' + name
        const latexName = name === 'Abstract' ? 'abstract' : name
        if (name === 'Abstract') {
          return '\\begin{abstract}\n' + (drafts[key] || '') + '\n\\end{abstract}'
        }
        return '\\section{' + latexName + '}\n' + (drafts[key] || '')
      })
      .join('\n\n')

    const doc = [
      '\\documentclass{article}',
      '\\usepackage{hyperref}',
      '\\title{PaperForge Draft}',
      '\\author{Anonymous Authors}',
      '\\begin{document}',
      '\\maketitle',
      body,
      '\\end{document}',
    ].join('\n')

    const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = selected.name.toLowerCase() + '-draft.tex'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={19} /></div>
          <div>
            <div className="brand-title">PaperForge</div>
            <div className="brand-subtitle">Conference-aware AI Paper Workspace</div>
          </div>
        </div>
        <div className="top-actions">
          <button className="ghost-btn" onClick={() => setShowSettings(true)}><Settings size={17} /> API Settings</button>
          <a className="ghost-btn" href="https://github.com/hua1xiao2sheng/PaperForge" target="_blank" rel="noreferrer"><Github size={17} /> GitHub</a>
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
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search CVPR, SIGMOD, ICSE..." />
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
              <button key={c.id} className={selected.id === c.id ? 'conference-card selected' : 'conference-card'} onClick={() => setSelectedId(c.id)}>
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

        <section className="editor-panel">
          <div className="editor-header">
            <div>
              <div className="eyebrow">CURRENT PAPER</div>
              <h1>{selected.name}</h1>
              <p>{selected.fullName}</p>
            </div>
            <button className="primary-btn" onClick={exportLatex}><FileCode2 size={17} /> Export .tex</button>
          </div>

          <div className="section-strip">
            {outline.map((name) => (
              <button key={name} className={section === name ? 'section-tab active' : 'section-tab'} onClick={() => setSection(name)}>
                {name}
              </button>
            ))}
          </div>

          <div className="writing-card">
            <div className="writing-toolbar">
              <div>
                <span className="status-dot" />
                Editing <strong>{section}</strong>
              </div>
              <div className="autosave">Autosaved locally</div>
            </div>
            <textarea
              value={currentDraft}
              onChange={(e) => updateDraft(e.target.value)}
              placeholder={'Start drafting ' + section + ' here...\n\nWrite one section at a time. PaperForge keeps the outline venue-aware so you can build the paper incrementally instead of generating everything at once.'}
            />
            <div className="editor-footer">
              <span>{currentDraft.trim() ? currentDraft.trim().split(/\s+/).length : 0} words</span>
              <button className="ai-btn" disabled title="API integration comes next"><Sparkles size={16} /> AI assist (coming next)</button>
            </div>
          </div>
        </section>

        <aside className="right-panel">
          <div className="detail-card">
            <div className="detail-icon"><CalendarDays size={18} /></div>
            <div>
              <div className="eyebrow">SUBMISSION</div>
              <h3>Next deadline</h3>
            </div>
          </div>

          {selected.deadlines.map((d, i) => (
            <div className="deadline-card" key={i}>
              <div className="deadline-row">
                <strong>{d.label}</strong>
                <span className={'status-pill ' + d.status}>{d.status === 'official' ? 'Official' : d.status === 'estimated' ? 'Estimated' : 'TBA'}</span>
              </div>
              <div className="deadline-grid">
                <div>
                  <span>Abstract</span>
                  <b>{d.abstract || 'Not announced'}</b>
                </div>
                <div>
                  <span>Paper</span>
                  <b>{d.paper || 'Not announced'}</b>
                </div>
              </div>
              <div className="timezone">{d.timezone || 'Timezone shown when officially announced'}</div>
            </div>
          ))}

          <div className="resource-card">
            <div className="resource-title"><FileText size={17} /> Author resources</div>
            <a href={selected.templateUrl} target="_blank" rel="noreferrer">
              <span><BookOpen size={16} /> Official template / author kit</span>
              <ExternalLink size={15} />
            </a>
            <a href={selected.cfpUrl} target="_blank" rel="noreferrer">
              <span><CalendarDays size={16} /> Official CFP / venue page</span>
              <ExternalLink size={15} />
            </a>
          </div>

          <div className="resource-card">
            <div className="resource-title"><FileCode2 size={17} /> Writing structure</div>
            {outline.map((x) => (
              <button className="outline-link" key={x} onClick={() => setSection(x)}>
                <span>{x}</span><ChevronRight size={15} />
              </button>
            ))}
          </div>

          <div className="notice-card">
            <strong>Deadline policy</strong>
            <p>Future dates are not guessed. If the venue has not published its next main-track deadline, PaperForge shows TBA and keeps the source link visible.</p>
          </div>
        </aside>
      </main>

      {showSettings && (
        <div className="modal-backdrop" onMouseDown={() => setShowSettings(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="eyebrow">MODEL PROVIDERS</div>
                <h2>API settings</h2>
              </div>
              <button className="close-btn" onClick={() => setShowSettings(false)}>×</button>
            </div>
            <p className="modal-copy">The MVP intentionally leaves every key blank. Do not commit real keys to GitHub; production should keep them on a backend or secret manager.</p>
            <div className="provider-list">
              {providerNames.map((name) => (
                <label key={name}>
                  <span><KeyRound size={15} /> {name}</span>
                  <input type="password" placeholder={name + ' API key (not stored yet)'} />
                </label>
              ))}
            </div>
            <button className="primary-btn full" onClick={() => setShowSettings(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
