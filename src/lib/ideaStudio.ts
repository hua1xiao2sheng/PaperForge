import type { EvidenceItem, IdeaSpec } from './research'

export type IdeaCandidateStatus = 'candidate' | 'needs-evidence' | 'pilot-ready' | 'adopted' | 'paused' | 'rejected'
export type ControllerAction = 'ask-user' | 'search-more' | 'revise' | 'pilot' | 'adopt' | 'stop'
export type FindingKind = 'observation' | 'success' | 'failure' | 'constraint'

export interface ResearchBrief {
  researchGoal: string
  assets: string
  constraints: string
  priorWork: string
  targetOutcome: string
  updatedAt?: string
}

export interface StudioMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface IdeaCandidate {
  id: string
  title: string
  problem: string
  gap: string
  mechanism: string
  hypothesis: string
  noveltyClaim: string
  resourceFit: string
  experiment: string
  noveltyRisk: string
  origin: string
  version: number
  status: IdeaCandidateStatus
  createdAt: string
}

export interface IdeaCritique {
  id: string
  candidateId: string
  role: string
  source: string
  summary: string
  objections: string[]
  evidenceNeeded: string[]
  discriminatingExperiment: string
  severity: 'blocker' | 'major' | 'minor'
}

export interface ResearchFinding {
  id: string
  kind: FindingKind
  statement: string
  evidence: string
  conditions: string
  source: string
  createdAt: string
}

export interface ControllerDecision {
  candidateId?: string
  action: ControllerAction
  rationale: string
  question?: string
  searchQueries?: string[]
  experiment?: string
  stopCondition?: string
}

export interface IdeaStudioState {
  brief: ResearchBrief
  messages: StudioMessage[]
  candidates: IdeaCandidate[]
  critiques: IdeaCritique[]
  findings: ResearchFinding[]
  searchQueries: string[]
  decision?: ControllerDecision
}

export interface IdeaDiscoveryResult {
  assistantMessage: string
  briefPatch?: Partial<ResearchBrief>
  questions?: string[]
  searchQueries?: string[]
  candidates?: IdeaCandidate[]
  controller?: ControllerDecision
}

export interface IdeaCritiqueResult {
  critiques: IdeaCritique[]
}

export interface IdeaDecisionResult {
  decision: ControllerDecision
}

export interface IdeaRefineResult {
  candidate: IdeaCandidate
  assistantMessage?: string
}

export const emptyResearchBrief: ResearchBrief = {
  researchGoal: '',
  assets: '',
  constraints: '',
  priorWork: '',
  targetOutcome: '',
}

export const emptyIdeaStudioState: IdeaStudioState = {
  brief: { ...emptyResearchBrief },
  messages: [],
  candidates: [],
  critiques: [],
  findings: [],
  searchQueries: [],
}

export function normalizeIdeaStudioState(input: unknown): IdeaStudioState {
  const value = input && typeof input === 'object' ? input as Partial<IdeaStudioState> : {}
  const brief = value.brief && typeof value.brief === 'object'
    ? { ...emptyResearchBrief, ...value.brief }
    : { ...emptyResearchBrief }

  return {
    ...emptyIdeaStudioState,
    ...value,
    brief,
    messages: Array.isArray(value.messages) ? value.messages : [],
    candidates: Array.isArray(value.candidates)
      ? value.candidates.map((candidate, index) => normalizeCandidate(candidate, index))
      : [],
    critiques: Array.isArray(value.critiques) ? value.critiques : [],
    findings: Array.isArray(value.findings) ? value.findings : [],
    searchQueries: Array.isArray(value.searchQueries) ? value.searchQueries : [],
  }
}

export function nowIso() {
  return new Date().toISOString()
}

export function makeMessage(role: StudioMessage['role'], content: string): StudioMessage {
  return {
    id: role + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    role,
    content,
    createdAt: nowIso(),
  }
}

export function normalizeCandidate(candidate: Partial<IdeaCandidate>, index = 0): IdeaCandidate {
  const createdAt = candidate.createdAt || nowIso()
  return {
    id: candidate.id || 'idea-' + Date.now() + '-' + index,
    title: candidate.title || 'Untitled research candidate',
    problem: candidate.problem || 'Problem still needs to be made explicit.',
    gap: candidate.gap || 'Gap requires literature verification.',
    mechanism: candidate.mechanism || 'Mechanism not yet specified.',
    hypothesis: candidate.hypothesis || 'Hypothesis not yet falsifiable.',
    noveltyClaim: candidate.noveltyClaim || 'Novelty claim is provisional pending prior-art checks.',
    resourceFit: candidate.resourceFit || 'Resource fit has not been checked.',
    experiment: candidate.experiment || 'Define a minimum discriminating experiment before investment.',
    noveltyRisk: candidate.noveltyRisk || 'Unknown until closest prior work is checked.',
    origin: candidate.origin || 'Idea Studio',
    version: candidate.version || 1,
    status: candidate.status || 'candidate',
    createdAt,
  }
}

export function mergeCandidates(current: IdeaCandidate[], incoming: IdeaCandidate[]) {
  const map = new Map(current.map((candidate) => [candidate.id, candidate]))
  for (const candidate of incoming) {
    map.set(candidate.id, normalizeCandidate(candidate))
  }
  return [...map.values()]
}

export function candidateToIdeaSpec(candidate: IdeaCandidate, current: IdeaSpec): IdeaSpec {
  return {
    ...current,
    title: candidate.title,
    topic: current.topic || candidate.title,
    problem: candidate.problem,
    gap: candidate.gap,
    coreIdea: candidate.mechanism,
    hypothesis: candidate.hypothesis,
    noveltyClaim: candidate.noveltyClaim,
    experiments: candidate.experiment,
    datasets: current.datasets || candidate.resourceFit,
    risks: [current.risks, 'Novelty / positioning risk: ' + candidate.noveltyRisk].filter(Boolean).join('\n'),
  }
}

export function offlineDiscover(params: {
  brief: ResearchBrief
  currentIdea: IdeaSpec
  evidence: EvidenceItem[]
  userMessage: string
  findings: ResearchFinding[]
}): IdeaDiscoveryResult {
  const goal = params.brief.researchGoal.trim() || params.currentIdea.topic.trim() || params.userMessage.trim()
  const assets = params.brief.assets.trim() || params.currentIdea.datasets.trim()
  const constraints = params.brief.constraints.trim()
  if (!goal) {
    return {
      assistantMessage:
        'Before generating candidates, describe the research direction or problem you want to investigate. I will keep the request narrow and use your available data and constraints as hard inputs.',
      controller: {
        action: 'ask-user',
        rationale: 'The research goal is still unspecified.',
        question: 'What problem or research direction do you want to investigate?',
      },
    }
  }

  const evidenceNote = params.evidence.length
    ? params.evidence.length + ' evidence items are already available and should be checked before strengthening novelty claims.'
    : 'No literature evidence is attached yet, so every gap and novelty statement below is provisional.'
  const findingNote = params.findings.length
    ? 'Existing findings should be used to avoid repeating failed routes.'
    : 'No prior experiment findings have been recorded yet.'

  const candidates = [
    normalizeCandidate({
      id: 'data-opportunity-' + Date.now(),
      title: 'Data-driven opportunity: ' + goal,
      problem: 'Identify a recurring failure, bottleneck, or unexplained structure directly observable in the available research assets.',
      gap: 'Determine whether existing methods explicitly model this observed structure under comparable assumptions.',
      mechanism: 'Exploit a property that is actually present in the available data instead of starting from a method name.',
      hypothesis: 'If the observed structure matters, a method that models it explicitly should outperform or explain a strong simpler baseline under a controlled comparison.',
      noveltyClaim: 'Provisional: the contribution would be the explicit modeling and validation of a data-observed mechanism, not merely applying an LLM or agent.',
      resourceFit: assets || 'Available assets still need to be listed and verified.',
      experiment: 'Start with a small descriptive analysis and one discriminating baseline comparison before building a complex system.',
      noveltyRisk: evidenceNote,
      origin: 'ARIS-style data-driven discovery',
      status: params.evidence.length ? 'candidate' : 'needs-evidence',
    }, 0),
    normalizeCandidate({
      id: 'gap-opportunity-' + (Date.now() + 1),
      title: 'Evidence-gap opportunity: ' + goal,
      problem: 'Find a concrete limitation or assumption shared by the closest existing approaches.',
      gap: 'A valid gap must survive direct-competitor, adjacent-field, negative-result, and contradictory-evidence searches.',
      mechanism: 'Change one specific assumption, representation, or decision step that explains the limitation.',
      hypothesis: 'If the targeted assumption is the true bottleneck, changing it should improve a predefined outcome without requiring unrelated changes.',
      noveltyClaim: 'Provisional: novelty depends on the closest prior work and must be phrased as the smallest defensible difference.',
      resourceFit: assets || 'Resource fit requires verification.',
      experiment: 'Compare against the strongest fair prior method while holding data and evaluation constant.',
      noveltyRisk: 'High until closest prior work is retrieved. ' + evidenceNote,
      origin: 'ARIS-style literature-gap discovery',
      status: 'needs-evidence',
    }, 1),
    normalizeCandidate({
      id: 'failure-opportunity-' + (Date.now() + 2),
      title: 'Failure-driven opportunity: ' + goal,
      problem: 'Use failed or degraded cases as research signal rather than hiding them.',
      gap: 'Check whether existing work explains, predicts, or repairs the failure mode under the same constraints.',
      mechanism: 'Convert the failure evidence into a constraint, feedback signal, or adaptive decision rule.',
      hypothesis: 'If the failure mode is systematic, incorporating its evidence should reduce that failure without simply rejecting all difficult cases.',
      noveltyClaim: 'Provisional: the contribution would be a failure-grounded mechanism plus evidence that it changes the relevant behavior.',
      resourceFit: assets || 'Requires at least examples of failures, edge cases, or rejected routes.',
      experiment: 'Build a compact failure set, test the simplest corrective mechanism, and define what result would falsify the explanation.',
      noveltyRisk: findingNote + ' ' + evidenceNote,
      origin: 'ARIS-style failure-driven discovery',
      status: 'candidate',
    }, 2),
  ]

  return {
    assistantMessage:
      'I generated three deliberately different research routes: one starts from your data, one from the prior-art gap, and one from failures. They are candidates, not claims of novelty. The next useful step is to pick one route or add evidence that can eliminate a route.',
    candidates,
    searchQueries: [
      goal + ' closest prior work',
      goal + ' limitations failure cases',
      goal + ' benchmark baseline',
    ],
    controller: {
      action: params.evidence.length ? 'revise' : 'search-more',
      rationale: params.evidence.length
        ? 'There is enough initial context to discuss and refine candidates, but novelty still needs explicit closest-work comparison.'
        : 'The candidates are under-grounded because no literature evidence has been attached.',
      searchQueries: [
        goal + ' closest prior work',
        goal + ' limitations failure cases',
      ],
    },
    briefPatch: {
      researchGoal: params.brief.researchGoal || goal,
      updatedAt: nowIso(),
      ...(constraints ? { constraints } : {}),
    },
  }
}

export function offlineCritiques(candidate: IdeaCandidate, evidence: EvidenceItem[]): IdeaCritique[] {
  const evidenceMissing = evidence.length === 0
  const roles = [
    {
      role: 'Problem & Value Reviewer',
      source: 'Agent Laboratory-style specialist role',
      summary: 'Check whether the problem changes an important scientific or engineering decision.',
      objections: ['The candidate may describe a method before proving that the underlying problem is important.'],
      evidenceNeeded: ['A concrete failure, cost, limitation, or unmet capability that can be measured.'],
      discriminatingExperiment: 'Show that the problem exists on a representative sample before testing the proposed mechanism.',
      severity: 'major' as const,
    },
    {
      role: 'Novelty & Evidence Reviewer',
      source: 'PaperQA2 / InnoEval-style evidence audit',
      summary: evidenceMissing
        ? 'The novelty claim is not grounded because no evidence is attached.'
        : 'Evidence exists, but the closest-work comparison still has to support the exact claimed difference.',
      objections: ['A renamed combination of known components is not automatically a research contribution.'],
      evidenceNeeded: ['Closest direct competitor', 'Adjacent-field analogue', 'Negative or contradictory evidence'],
      discriminatingExperiment: 'Not an experiment first: retrieve the closest work and write a claim-level difference table.',
      severity: evidenceMissing ? 'blocker' as const : 'major' as const,
    },
    {
      role: 'Method & Mechanism Reviewer',
      source: 'Agent Laboratory-style method specialist',
      summary: 'The mechanism must explain why the proposed change should affect the target outcome.',
      objections: ['A correlation between the method and metric would not by itself validate the proposed mechanism.'],
      evidenceNeeded: ['Ablation or controlled comparison tied to the mechanism.'],
      discriminatingExperiment: candidate.experiment,
      severity: 'major' as const,
    },
    {
      role: 'Data & Experiment Reviewer',
      source: 'AI-Scientist-v2-style experimental gate',
      summary: 'Start with the cheapest experiment that can change belief in the candidate.',
      objections: ['The candidate may require data, labels, or execution access that are not currently available.'],
      evidenceNeeded: ['Verified data fields, sample count, labels or executable environment, and evaluation metric.'],
      discriminatingExperiment: 'Run a bounded pilot with an explicit stop condition before scaling.',
      severity: 'major' as const,
    },
  ]
  return roles.map((role, index) => ({
    id: candidate.id + '-critic-' + index,
    candidateId: candidate.id,
    ...role,
  }))
}

export function offlineDecision(params: {
  candidate: IdeaCandidate
  critiques: IdeaCritique[]
  evidence: EvidenceItem[]
  findings: ResearchFinding[]
}): ControllerDecision {
  const blockers = params.critiques.filter((critique) => critique.severity === 'blocker')
  if (blockers.length) {
    return {
      candidateId: params.candidate.id,
      action: 'search-more',
      rationale: 'At least one blocker is unresolved. The next action should reduce uncertainty rather than expand the method.',
      searchQueries: ['closest prior work for ' + params.candidate.title],
      stopCondition: 'Stop or revise this route if the closest work already implements the same mechanism under comparable assumptions.',
    }
  }
  if (params.evidence.length < 3) {
    return {
      candidateId: params.candidate.id,
      action: 'search-more',
      rationale: 'The candidate has too little evidence for a strong novelty or gap claim.',
      searchQueries: ['closest prior work for ' + params.candidate.title, params.candidate.title + ' limitations'],
    }
  }
  if (!params.findings.length) {
    return {
      candidateId: params.candidate.id,
      action: 'pilot',
      rationale: 'The candidate has enough context for a bounded discriminating experiment, but no execution evidence has been recorded.',
      experiment: params.candidate.experiment,
      stopCondition: 'Do not scale the project if the pilot cannot distinguish the proposed mechanism from a strong simpler baseline.',
    }
  }
  return {
    candidateId: params.candidate.id,
    action: 'revise',
    rationale: 'Use the accumulated findings and critiques to refine the mechanism before adoption.',
  }
}
