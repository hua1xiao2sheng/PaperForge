import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FlaskConical,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import { callPaperForgeAI } from './lib/aiClient'
import {
  makeMessage,
  mergeCandidates,
  normalizeCandidate,
  offlineCritiques,
  offlineDecision,
  offlineDiscover,
  nowIso,
  type ControllerAction,
  type IdeaCandidate,
  type IdeaCritiqueResult,
  type IdeaDecisionResult,
  type IdeaDiscoveryResult,
  type IdeaRefineResult,
  type IdeaStudioState,
  type ResearchBrief,
  type ResearchFinding,
} from './lib/ideaStudio'
import type { EvidenceItem, IdeaSpec } from './lib/research'

const pipeline = [
  { id: 'discuss', label: 'Human ↔ AI', detail: 'CoQuest / Perspectra-style discussion' },
  { id: 'discover', label: 'ARIS Discovery', detail: 'Diverge → novelty risk → refine' },
  { id: 'evidence', label: 'Evidence', detail: 'PaperQA2 / ResearchAgent grounding' },
  { id: 'critic', label: 'Critic Council', detail: 'Independent specialist objections' },
  { id: 'controller', label: 'Controller', detail: 'Ask / search / revise / pilot / adopt' },
  { id: 'experiment', label: 'Tree Search', detail: 'AI-Scientist-v2-style bounded exploration' },
  { id: 'memory', label: 'Findings', detail: 'DeepScientist-style durable lessons' },
] as const

const actionLabels: Record<ControllerAction, string> = {
  'ask-user': 'Ask user',
  'search-more': 'Search more',
  revise: 'Revise',
  pilot: 'Run pilot',
  adopt: 'Adopt',
  stop: 'Stop route',
}

function briefText(brief: ResearchBrief) {
  return [
    brief.researchGoal && 'Goal: ' + brief.researchGoal,
    brief.assets && 'Assets: ' + brief.assets,
    brief.constraints && 'Constraints: ' + brief.constraints,
    brief.priorWork && 'Known prior work: ' + brief.priorWork,
    brief.targetOutcome && 'Target outcome: ' + brief.targetOutcome,
  ].filter(Boolean).join('\n')
}

export function IdeaStudioView(props: {
  state: IdeaStudioState
  setState: (next: IdeaStudioState | ((prev: IdeaStudioState) => IdeaStudioState)) => void
  venue: string
  evidence: EvidenceItem[]
  currentIdea: IdeaSpec
  onAdopt: (candidate: IdeaCandidate) => void
  onOpenLiterature: () => void
}) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [findingDraft, setFindingDraft] = useState('')

  const selectedCandidate = useMemo(() => {
    const id = props.state.decision?.candidateId
    return props.state.candidates.find((candidate) => candidate.id === id) || props.state.candidates[0]
  }, [props.state.candidates, props.state.decision?.candidateId])

  const updateBrief = (patch: Partial<ResearchBrief>) => {
    props.setState((prev) => ({
      ...prev,
      brief: { ...prev.brief, ...patch, updatedAt: nowIso() },
    }))
  }

  const runDiscovery = async () => {
    const text = message.trim()
    if (!text && !props.state.brief.researchGoal.trim()) return
    setBusy('discover')
    setError('')
    const userMessage = text || 'Use the current Research Brief to continue idea discovery.'
    const nextUser = makeMessage('user', userMessage)
    props.setState((prev) => ({ ...prev, messages: [...prev.messages, nextUser] }))
    setMessage('')

    try {
      const remote = await callPaperForgeAI<IdeaDiscoveryResult>({
        workflow: 'idea.discover',
        venue: props.venue,
        ideaSpec: props.currentIdea,
        evidence: props.evidence,
        instruction: userMessage,
        researchBrief: props.state.brief,
        candidates: props.state.candidates,
        findings: props.state.findings,
        messages: [...props.state.messages, nextUser],
      })
      const result =
        remote?.ok && remote.data
          ? remote.data
          : offlineDiscover({
              brief: props.state.brief,
              currentIdea: props.currentIdea,
              evidence: props.evidence,
              userMessage,
              findings: props.state.findings,
            })

      props.setState((prev) => ({
        ...prev,
        brief: { ...prev.brief, ...(result.briefPatch || {}), updatedAt: nowIso() },
        messages: [
          ...prev.messages,
          makeMessage('assistant', result.assistantMessage || 'Candidate discovery completed.'),
        ],
        candidates: mergeCandidates(
          prev.candidates,
          (result.candidates || []).map((candidate, index) => normalizeCandidate(candidate, index)),
        ),
        searchQueries: result.searchQueries || prev.searchQueries,
        decision: result.controller || prev.decision,
      }))
      if (remote && !remote.ok && remote.error) {
        setError('Backend unavailable; used the deterministic offline discovery path. ' + remote.error)
      } else if (!remote) {
        setError('VITE_AI_BACKEND_URL is not configured; used the deterministic offline discovery path.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }

  const runCritique = async (candidate: IdeaCandidate) => {
    setBusy('critic:' + candidate.id)
    setError('')
    try {
      const remote = await callPaperForgeAI<IdeaCritiqueResult>({
        workflow: 'idea.critic',
        venue: props.venue,
        ideaSpec: props.currentIdea,
        evidence: props.evidence,
        researchBrief: props.state.brief,
        candidate,
        findings: props.state.findings,
      })
      const critiques = remote?.ok && remote.data
        ? remote.data.critiques
        : offlineCritiques(candidate, props.evidence)
      props.setState((prev) => ({
        ...prev,
        critiques: [
          ...prev.critiques.filter((critique) => critique.candidateId !== candidate.id),
          ...critiques,
        ],
        decision: { action: 'revise', candidateId: candidate.id, rationale: 'Critiques are ready. Resolve blockers before adoption.' },
      }))
      if (!remote) setError('Backend not configured; used deterministic critic roles.')
      else if (!remote.ok) setError('Backend critic failed; used deterministic critic roles. ' + (remote.error || ''))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }

  const runController = async (candidate: IdeaCandidate) => {
    setBusy('controller:' + candidate.id)
    setError('')
    const critiques = props.state.critiques.filter((item) => item.candidateId === candidate.id)
    try {
      const remote = await callPaperForgeAI<IdeaDecisionResult>({
        workflow: 'idea.decide',
        venue: props.venue,
        ideaSpec: props.currentIdea,
        evidence: props.evidence,
        researchBrief: props.state.brief,
        candidate,
        critiques,
        findings: props.state.findings,
      })
      const decision = remote?.ok && remote.data
        ? remote.data.decision
        : offlineDecision({ candidate, critiques, evidence: props.evidence, findings: props.state.findings })
      props.setState((prev) => ({ ...prev, decision }))
      if (!remote) setError('Backend not configured; controller used deterministic decision rules.')
      else if (!remote.ok) setError('Backend controller failed; deterministic rules were used. ' + (remote.error || ''))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }

  const runRefine = async (candidate: IdeaCandidate) => {
    setBusy('refine:' + candidate.id)
    setError('')
    const critiques = props.state.critiques.filter((item) => item.candidateId === candidate.id)
    try {
      const remote = await callPaperForgeAI<IdeaRefineResult>({
        workflow: 'idea.refine',
        venue: props.venue,
        ideaSpec: props.currentIdea,
        evidence: props.evidence,
        researchBrief: props.state.brief,
        candidate,
        critiques,
        findings: props.state.findings,
      })
      const refined = remote?.ok && remote.data
        ? normalizeCandidate(remote.data.candidate)
        : normalizeCandidate({
            ...candidate,
            id: candidate.id,
            version: candidate.version + 1,
            status: props.evidence.length ? 'candidate' : 'needs-evidence',
            noveltyRisk: candidate.noveltyRisk + ' Refined after critic review; re-check closest prior work.',
            createdAt: candidate.createdAt,
          })
      props.setState((prev) => ({
        ...prev,
        candidates: prev.candidates.map((item) => item.id === candidate.id ? refined : item),
        messages: remote?.ok && remote.data?.assistantMessage
          ? [...prev.messages, makeMessage('assistant', remote.data.assistantMessage)]
          : prev.messages,
      }))
      if (!remote) setError('Backend not configured; applied a conservative local refinement marker.')
      else if (!remote.ok) setError('Backend refinement failed; kept the candidate and marked it for re-check. ' + (remote.error || ''))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }

  const adopt = (candidate: IdeaCandidate) => {
    props.onAdopt(candidate)
    props.setState((prev) => ({
      ...prev,
      candidates: prev.candidates.map((item) =>
        item.id === candidate.id ? { ...item, status: 'adopted' } : item,
      ),
      decision: {
        action: 'adopt',
        candidateId: candidate.id,
        rationale: 'The user explicitly adopted this candidate into the PaperForge IdeaSpec. Evidence and experiments can still revise it later.',
      },
    }))
  }

  const addFinding = () => {
    const statement = findingDraft.trim()
    if (!statement) return
    const finding: ResearchFinding = {
      id: 'finding-' + Date.now(),
      kind: 'observation',
      statement,
      evidence: '',
      conditions: '',
      source: 'Human / manual',
      createdAt: nowIso(),
    }
    props.setState((prev) => ({ ...prev, findings: [finding, ...prev.findings] }))
    setFindingDraft('')
  }

  return (
    <div className="idea-studio">
      <div className="idea-studio-hero">
        <div>
          <div className="eyebrow">IDEA STUDIO</div>
          <h1>Discover, challenge, and validate research ideas</h1>
          <p>ARIS-style discovery is the main ideation path. Evidence, specialist critics, bounded experiments, and Findings Memory feed back into the next round.</p>
        </div>
        <div className="idea-studio-badge"><BrainCircuit size={18} /><span>Human-in-the-loop</span></div>
      </div>

      <div className="idea-pipeline">
        {pipeline.map((step, index) => (
          <div className="idea-pipeline-step" key={step.id}>
            <div className="idea-pipeline-index">{index + 1}</div>
            <div><strong>{step.label}</strong><span>{step.detail}</span></div>
            {index < pipeline.length - 1 && <ArrowRight className="idea-pipeline-arrow" size={15} />}
          </div>
        ))}
      </div>

      <div className="idea-studio-grid">
        <section className="idea-studio-panel">
          <div className="card-title"><Target size={17} /> Research Brief</div>
          <p className="panel-copy">These are hard inputs to discovery. The system should not invent data, labels, compute, or access you do not have.</p>
          <label><span>Research goal</span><textarea rows={3} value={props.state.brief.researchGoal} onChange={(e) => updateBrief({ researchGoal: e.target.value })} placeholder="What problem or direction do you want to investigate?" /></label>
          <label><span>Assets / data / code</span><textarea rows={3} value={props.state.brief.assets} onChange={(e) => updateBrief({ assets: e.target.value })} placeholder="Datasets, logs, repositories, workflow graphs, tools, compute..." /></label>
          <label><span>Constraints</span><textarea rows={3} value={props.state.brief.constraints} onChange={(e) => updateBrief({ constraints: e.target.value })} placeholder="No large-scale labeling, no complex real environment, budget, privacy..." /></label>
          <label><span>Known prior work / tried routes</span><textarea rows={2} value={props.state.brief.priorWork} onChange={(e) => updateBrief({ priorWork: e.target.value })} placeholder="What have you already read or tried?" /></label>
          <label><span>Target outcome</span><textarea rows={2} value={props.state.brief.targetOutcome} onChange={(e) => updateBrief({ targetOutcome: e.target.value })} placeholder="Method paper, benchmark, system, analysis, target venue..." /></label>
        </section>

        <section className="idea-studio-panel idea-studio-dialog">
          <div className="card-title"><MessageSquareText size={17} /> Discuss with Idea Studio</div>
          <p className="panel-copy">Tell it what you have, reject a route, add a constraint, or ask it to explore another direction. Each turn updates the research state.</p>
          <div className="studio-messages">
            {props.state.messages.length === 0 ? (
              <div className="studio-empty">Start with a concrete sentence such as “I have 217 troubleshooting workflows and 500 tools, but I do not want a heavy online execution environment.”</div>
            ) : props.state.messages.slice(-8).map((item) => (
              <div key={item.id} className={'studio-message ' + item.role}>
                <strong>{item.role === 'user' ? 'You' : 'Idea Studio'}</strong>
                <p>{item.content}</p>
              </div>
            ))}
          </div>
          <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Discuss data, constraints, a candidate route, or ask what evidence is missing..." />
          <div className="action-bar compact">
            <button className="primary-btn" disabled={busy === 'discover'} onClick={runDiscovery}>
              {busy === 'discover' ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />} Discuss & discover
            </button>
            <button className="secondary-btn" onClick={props.onOpenLiterature}><Search size={16} /> Open evidence workspace</button>
          </div>
          {error && <div className="inline-warning"><AlertTriangle size={15} /> {error}</div>}
        </section>
      </div>

      {props.state.searchQueries.length > 0 && (
        <section className="idea-studio-panel">
          <div className="card-title"><Search size={17} /> Evidence queries suggested by the discovery loop</div>
          <div className="query-chips">
            {props.state.searchQueries.map((query) => <button key={query} onClick={props.onOpenLiterature}>{query}</button>)}
          </div>
        </section>
      )}

      <div className="section-title"><span>Candidate ideas</span><small>{props.state.candidates.length} routes · candidates are not novelty claims</small></div>
      {props.state.candidates.length === 0 ? (
        <div className="big-empty">
          <Lightbulb size={28} />
          <strong>No candidates yet</strong>
          <p>Fill enough of the Research Brief to constrain the problem, then start a discussion.</p>
        </div>
      ) : (
        <div className="idea-candidate-grid">
          {props.state.candidates.map((candidate) => {
            const critiques = props.state.critiques.filter((item) => item.candidateId === candidate.id)
            const isBusy = busy.endsWith(candidate.id)
            return (
              <article className={'idea-candidate-card status-' + candidate.status} key={candidate.id}>
                <div className="candidate-head">
                  <div>
                    <div className="mini-label">{candidate.origin} · v{candidate.version}</div>
                    <h3>{candidate.title}</h3>
                  </div>
                  <span className="candidate-status">{candidate.status}</span>
                </div>
                <dl className="candidate-fields">
                  <div><dt>Problem</dt><dd>{candidate.problem}</dd></div>
                  <div><dt>Gap</dt><dd>{candidate.gap}</dd></div>
                  <div><dt>Mechanism</dt><dd>{candidate.mechanism}</dd></div>
                  <div><dt>Hypothesis</dt><dd>{candidate.hypothesis}</dd></div>
                  <div><dt>Resource fit</dt><dd>{candidate.resourceFit}</dd></div>
                  <div><dt>Minimum experiment</dt><dd>{candidate.experiment}</dd></div>
                  <div><dt>Novelty risk</dt><dd>{candidate.noveltyRisk}</dd></div>
                </dl>
                <div className="candidate-actions">
                  <button onClick={() => runCritique(candidate)} disabled={isBusy}><ShieldCheck size={14} /> Critique</button>
                  <button onClick={() => runController(candidate)} disabled={isBusy}><Network size={14} /> Next action</button>
                  <button onClick={() => runRefine(candidate)} disabled={isBusy}><Sparkles size={14} /> Refine</button>
                  <button className="adopt" onClick={() => adopt(candidate)}><CheckCircle2 size={14} /> Adopt IdeaSpec</button>
                </div>
                {critiques.length > 0 && (
                  <div className="candidate-critiques">
                    {critiques.map((critique) => (
                      <div key={critique.id} className={'critique severity-' + critique.severity}>
                        <div className="critique-title"><strong>{critique.role}</strong><span>{critique.severity}</span></div>
                        <p>{critique.summary}</p>
                        {critique.objections.length > 0 && <ul>{critique.objections.map((item) => <li key={item}>{item}</li>)}</ul>}
                        <small>Needs: {critique.evidenceNeeded.join(' · ') || 'No additional evidence specified'}</small>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <div className="idea-studio-grid">
        <section className="idea-studio-panel">
          <div className="card-title"><BrainCircuit size={17} /> Research Controller</div>
          {!props.state.decision ? (
            <div className="studio-empty">Run “Next action” on a candidate. The controller chooses between asking you, searching, revising, a bounded pilot, adoption, or stopping.</div>
          ) : (
            <div className="controller-card">
              <div className="controller-action">{actionLabels[props.state.decision.action]}</div>
              <p>{props.state.decision.rationale}</p>
              {props.state.decision.question && <div><strong>Question:</strong> {props.state.decision.question}</div>}
              {props.state.decision.experiment && <div><strong>Pilot:</strong> {props.state.decision.experiment}</div>}
              {props.state.decision.stopCondition && <div><strong>Stop condition:</strong> {props.state.decision.stopCondition}</div>}
            </div>
          )}
          {selectedCandidate && <small className="source-foot">Current route: {selectedCandidate.title}</small>}
        </section>

        <section className="idea-studio-panel">
          <div className="card-title"><FlaskConical size={17} /> Findings Memory</div>
          <p className="panel-copy">Record outcomes with conditions. A model opinion is a hypothesis; an observed result can become a finding.</p>
          <div className="finding-add">
            <input value={findingDraft} onChange={(e) => setFindingDraft(e.target.value)} placeholder="e.g. Embedding mapping loses vendor-specific preconditions on 18/50 sampled actions." />
            <button className="secondary-btn" onClick={addFinding}>Add</button>
          </div>
          <div className="findings-list">
            {props.state.findings.slice(0, 6).map((finding) => (
              <div className="finding-row" key={finding.id}><span>{finding.kind}</span><p>{finding.statement}</p></div>
            ))}
            {props.state.findings.length === 0 && <div className="studio-empty">No verified findings recorded yet.</div>}
          </div>
        </section>
      </div>

      <div className="idea-studio-note">
        <ShieldCheck size={16} />
        <div><strong>Separation of responsibilities</strong><p>Idea Studio manages the research state. ARIS-style discovery proposes routes; evidence and critics challenge them; AI-Scientist-style search is reserved for bounded experiments; findings feed the next discovery round.</p></div>
      </div>
    </div>
  )
}
