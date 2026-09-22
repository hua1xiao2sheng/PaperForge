import type { Conference } from '../data/conferences'
import type { CouncilLens, PaperReviewer } from '../data/researchMethods'

export interface IdeaSpec {
  title: string
  topic: string
  problem: string
  gap: string
  coreIdea: string
  hypothesis: string
  noveltyClaim: string
  contributions: string
  method: string
  experiments: string
  baselines: string
  datasets: string
  successCriteria: string
  risks: string
  assumptions: string
}

export interface EvidenceItem {
  id: string
  title: string
  year?: number
  venue?: string
  authors?: string
  url?: string
  citationCount?: number
  abstract?: string
  stance: 'support' | 'challenge' | 'context'
  linkedClaim: string
  note: string
}

export interface CouncilOpinion {
  id: string
  title: string
  source: string
  focus: string
  statement: string
}

export interface ReviewOpinion {
  id: string
  title: string
  source: string
  focus: string
  report: string
}

export interface SubmissionCheck {
  id: string
  label: string
  detail: string
  status: 'pass' | 'warn' | 'manual'
}

export const emptyIdeaSpec: IdeaSpec = {
  title: '',
  topic: '',
  problem: '',
  gap: '',
  coreIdea: '',
  hypothesis: '',
  noveltyClaim: '',
  contributions: '',
  method: '',
  experiments: '',
  baselines: '',
  datasets: '',
  successCriteria: '',
  risks: '',
  assumptions: '',
}

export function ideaCompleteness(idea: IdeaSpec) {
  const keys = Object.keys(idea) as Array<keyof IdeaSpec>
  const required = keys.filter((k) => k !== 'title')
  const done = required.filter((k) => idea[k].trim().length >= 12).length
  return Math.round((done / required.length) * 100)
}

export function buildIdeaContext(idea: IdeaSpec, conference: Conference) {
  return [
    'Target venue: ' + conference.name + ' — ' + conference.fullName,
    'Title: ' + (idea.title || '[untitled]'),
    'Topic: ' + (idea.topic || '[missing]'),
    'Problem: ' + (idea.problem || '[missing]'),
    'Research gap: ' + (idea.gap || '[missing]'),
    'Core idea: ' + (idea.coreIdea || '[missing]'),
    'Hypothesis: ' + (idea.hypothesis || '[missing]'),
    'Novelty claim: ' + (idea.noveltyClaim || '[missing]'),
    'Contributions: ' + (idea.contributions || '[missing]'),
    'Method: ' + (idea.method || '[missing]'),
    'Experiments: ' + (idea.experiments || '[missing]'),
    'Baselines: ' + (idea.baselines || '[missing]'),
    'Datasets / environment: ' + (idea.datasets || '[missing]'),
    'Success criteria: ' + (idea.successCriteria || '[missing]'),
    'Risks / failure modes: ' + (idea.risks || '[missing]'),
    'Assumptions: ' + (idea.assumptions || '[missing]'),
  ].join('\n')
}

function missingIdeaFields(idea: IdeaSpec) {
  const fields: Array<[keyof IdeaSpec, string]> = [
    ['problem', 'problem definition'],
    ['gap', 'research gap'],
    ['coreIdea', 'core mechanism'],
    ['hypothesis', 'falsifiable hypothesis'],
    ['noveltyClaim', 'novelty claim'],
    ['contributions', 'contributions'],
    ['experiments', 'experiment plan'],
    ['baselines', 'strong baselines'],
    ['successCriteria', 'success / failure criteria'],
    ['risks', 'failure modes'],
  ]
  return fields.filter(([key]) => idea[key].trim().length < 12).map(([, label]) => label)
}

export function offlineCouncilOpinion(lens: CouncilLens, idea: IdeaSpec, evidence: EvidenceItem[]): CouncilOpinion {
  const missing = missingIdeaFields(idea)
  const evidenceCount = evidence.length
  const challengeCount = evidence.filter((e) => e.stance === 'challenge').length
  const base = [
    'OFFLINE METHOD LENS — this is a deterministic scaffold, not an LLM judgement.',
    '',
    'Primary assessment:',
  ]

  if (lens.id === 'independent') {
    base.push(
      idea.hypothesis
        ? 'The hypothesis is stated, but it still needs an explicit observation that would falsify it.'
        : 'A falsifiable hypothesis is missing.',
      'Separate the novelty claim from assumptions. Ask whether the same expected result could be explained by a simpler mechanism.',
    )
  } else if (lens.id === 'perspective') {
    base.push(
      'Search the topic from at least four perspectives: direct competitors, adjacent methods, negative/failure results, and a neighboring field using a similar mechanism.',
      'Do not call the gap “unexplored” until those perspectives have been checked.',
    )
  } else if (lens.id === 'evidence') {
    base.push(
      'Evidence matrix currently contains ' + evidenceCount + ' items, including ' + challengeCount + ' challenging items.',
      evidenceCount < 5
        ? 'The novelty claim is under-grounded. Build a claim-to-source map before strengthening the wording.'
        : 'Evidence coverage exists; next verify that each central claim has both supporting and potentially contradictory sources.',
    )
  } else if (lens.id === 'execution') {
    base.push(
      idea.baselines ? 'Baselines are named; define a fixed comparison budget and keep/reject metric for each experiment.' : 'Strong baselines are missing.',
      idea.successCriteria ? 'Success criteria exist; add a null-result path so a negative outcome still teaches you something.' : 'Predeclare success and failure criteria.',
    )
  } else if (lens.id === 'narrative') {
    base.push(
      idea.noveltyClaim
        ? 'Try compressing the contribution to one sentence: problem → mechanism → evidence → consequence.'
        : 'The paper cannot yet have a stable narrative because the novelty claim is missing.',
      'Every experiment should be linked to one named contribution; remove experiments that do not change belief in a claim.',
    )
  } else {
    base.push(
      'Run a self-critique after the first review. Ask what evidence would make the reviewer reverse their position.',
      'Avoid both positivity bias and “Reviewer 2” pessimism: distinguish blockers from nice-to-have work.',
    )
  }

  if (missing.length) {
    base.push('', 'Missing before strong consensus: ' + missing.slice(0, 5).join(', ') + (missing.length > 5 ? ', …' : '') + '.')
  }

  return { id: lens.id, title: lens.title, source: lens.source, focus: lens.focus, statement: base.join('\n') }
}

export function offlineConsensus(idea: IdeaSpec, opinions: CouncilOpinion[], evidence: EvidenceItem[]) {
  const missing = missingIdeaFields(idea)
  const agreed = [
    idea.problem && 'The proposal is anchored to a concrete problem.',
    idea.coreIdea && 'There is a named intervention / mechanism rather than only a topic.',
    idea.experiments && 'There is at least an initial execution plan.',
  ].filter(Boolean)

  return [
    'OFFLINE CONSENSUS DRAFT',
    '',
    'What the council can provisionally agree on:',
    ...(agreed.length ? agreed.map((x) => '• ' + x) : ['• The idea is not yet specified enough for a positive consensus.']),
    '',
    'Candidate consensus novelty statement:',
    idea.noveltyClaim
      ? '“' + idea.noveltyClaim.trim() + '” — keep this wording provisional until the literature and execution checks below are satisfied.'
      : 'No defensible novelty statement yet. Write the smallest claim that is new relative to named prior work.',
    '',
    'Critical objections that must survive:',
    '• Closest-prior-art objection: what existing paper could make this incremental?',
    '• Simpler-explanation objection: could the expected result occur without the proposed mechanism?',
    '• Execution objection: can one decisive experiment distinguish the idea from a strong baseline?',
    '• Evidence objection: are contradictory or null results represented?',
    '',
    'Evidence status: ' + evidence.length + ' items recorded.',
    missing.length ? 'Unresolved fields: ' + missing.join(', ') + '.' : 'Core IdeaSpec fields are populated.',
    '',
    'Consensus rule: do not treat agreement as proof of novelty. The claim advances only when prior art, falsifiability, and discriminating experiments are all documented.',
    '',
    'Council voices considered: ' + opinions.map((o) => o.source).join(' · '),
  ].join('\n')
}

export function buildCouncilPrompt(lens: CouncilLens, idea: IdeaSpec, conference: Conference, evidence: EvidenceItem[]) {
  const evidenceSummary = evidence.length
    ? evidence.slice(0, 20).map((e, i) => (i + 1) + '. [' + e.stance + '] ' + e.title + ' — claim: ' + (e.linkedClaim || 'unlinked')).join('\n')
    : 'No evidence items have been added yet.'

  return [
    lens.prompt,
    '',
    'You are one independent speaker in an innovation council. Do not imitate the other speakers and do not assume consensus.',
    'Return concise Markdown with exactly these headings:',
    '## Position',
    '## Strongest reason',
    '## Strongest objection',
    '## Missing evidence',
    '## Discriminating experiment',
    '## Revision required',
    '',
    buildIdeaContext(idea, conference),
    '',
    'CURRENT EVIDENCE MATRIX',
    evidenceSummary,
  ].join('\n')
}

export function buildConsensusPrompt(
  idea: IdeaSpec,
  conference: Conference,
  opinions: CouncilOpinion[],
  evidence: EvidenceItem[],
) {
  return [
    'Act as a neutral meta-critic and consensus chair. The speakers below used different research methodologies.',
    'First perform a critical synthesis: identify duplicated arguments, contradictions, weak assumptions, and possible shared bias.',
    'Then produce a consensus novelty statement containing ONLY claims supported by the shared evidence and proposal details.',
    'Do not use vote counting as proof. Preserve material dissent.',
    'Return Markdown with headings: ## Meta-critique, ## Common ground, ## Material disagreement, ## Consensus novelty claim, ## Evidence still required, ## Go/no-go experiment, ## Revision actions.',
    '',
    buildIdeaContext(idea, conference),
    '',
    'Evidence count: ' + evidence.length,
    '',
    'SPEAKER REPORTS',
    ...opinions.map((o) => '### ' + o.title + ' — ' + o.source + '\n' + o.statement),
  ].join('\n\n')
}

export function buildSectionPrompt(
  action: string,
  section: string,
  currentText: string,
  idea: IdeaSpec,
  conference: Conference,
  evidence: EvidenceItem[],
) {
  const actionMap: Record<string, string> = {
    analyze: 'Analyze the current section. Identify missing argument steps, unsupported claims, redundancy, and what evidence is needed. Do not rewrite unless necessary to illustrate a fix.',
    outline: 'Create a paragraph-level outline for this section. Each paragraph should have a purpose, claim, evidence slot, and transition.',
    draft: 'Draft a strong first version of this section using only the supplied IdeaSpec and evidence notes. Do not invent results, citations, datasets, or measurements. Mark missing evidence as [EVIDENCE NEEDED].',
    rewrite: 'Rewrite the current text for precision, clarity, and academic tone without strengthening claims or inventing facts.',
    logic: 'Act as a skeptical reviewer. Trace the logic sentence-by-sentence and identify jumps, hidden assumptions, alternative explanations, or conclusions stronger than the evidence.',
    citations: 'Audit claims that need citations. For each, state what kind of paper should support it and give a search query. Never fabricate a citation.',
    compress: 'Compress the text while preserving every factual claim, qualifier, number, limitation, and citation placeholder.',
    reviewer: 'Review this section from the perspective of the selected venue. Give specific strengths, weaknesses, questions, and the highest-priority revision.',
  }
  const evidenceSummary = evidence.slice(0, 15).map((e) => '- ' + e.title + ' [' + e.stance + '] ' + (e.note || '')).join('\n') || 'No evidence notes supplied.'

  return [
    actionMap[action] || actionMap.analyze,
    '',
    'Target section: ' + section,
    buildIdeaContext(idea, conference),
    '',
    'EVIDENCE NOTES',
    evidenceSummary,
    '',
    'CURRENT SECTION TEXT',
    currentText || '[empty]',
  ].join('\n')
}

export function offlineSectionAssist(action: string, section: string, currentText: string, idea: IdeaSpec) {
  const words = currentText.trim() ? currentText.trim().split(/\s+/).length : 0
  const missing = missingIdeaFields(idea)
  const common = [
    'OFFLINE COPILOT — configure an API key for model-generated analysis.',
    '',
    'Section: ' + section + ' · current words: ' + words,
  ]

  if (action === 'outline') {
    common.push(
      '',
      'Suggested argument skeleton:',
      '1. Section goal — state the exact question this section must answer.',
      '2. Setup / context — define only concepts needed for that question.',
      '3. Main claim — connect directly to the IdeaSpec contribution.',
      '4. Evidence / mechanism — point to an experiment, derivation, or citation slot.',
      '5. Boundary / limitation — say where the claim may fail.',
      '6. Transition — explain why the next section follows.',
    )
  } else if (action === 'citations') {
    common.push(
      '',
      'Citation audit:',
      '• Mark broad field claims (“widely used”, “state of the art”, “few works”) for verification.',
      '• Mark every comparison to prior methods for a primary-source citation.',
      '• Mark dataset/benchmark descriptions for canonical source citations.',
      '• Do not cite a paper you have not verified.',
    )
  } else {
    common.push(
      '',
      'Checks to run:',
      '• Does the first paragraph state why this section exists?',
      '• Is every central claim linked to evidence or explicitly labelled as a hypothesis?',
      '• Are there hidden assumptions or alternative explanations?',
      '• Does the section support one of the declared contributions?',
      '• Could a reviewer summarize the takeaway in one sentence?',
    )
  }

  if (missing.length) common.push('', 'IdeaSpec gaps that weaken this section: ' + missing.slice(0, 6).join(', ') + '.')
  return common.join('\n')
}

export function buildPaperText(outline: string[], drafts: Record<string, string>, conferenceId: string) {
  return outline
    .map((section) => '## ' + section + '\n' + (drafts[conferenceId + ':' + section] || '[empty]'))
    .join('\n\n')
}

export function buildPaperReviewPrompt(
  reviewer: PaperReviewer,
  idea: IdeaSpec,
  conference: Conference,
  paperText: string,
  evidence: EvidenceItem[],
) {
  return [
    reviewer.prompt,
    '',
    'You are one independent specialist reviewer. Do not predict acceptance probability.',
    'Return Markdown with headings: ## Summary, ## Strengths, ## Major concerns, ## Minor concerns, ## Questions, ## Required evidence, ## Concrete revisions.',
    'Prioritize specific, falsifiable, actionable comments over generic advice.',
    '',
    buildIdeaContext(idea, conference),
    '',
    'Evidence matrix items: ' + evidence.length,
    '',
    'PAPER DRAFT',
    paperText.slice(0, 50000),
  ].join('\n')
}

export function offlinePaperReview(reviewer: PaperReviewer, idea: IdeaSpec, paperText: string, evidence: EvidenceItem[]): ReviewOpinion {
  const emptySections = (paperText.match(/\[empty\]/g) || []).length
  const report = [
    'OFFLINE REVIEW SCAFFOLD',
    '',
    '## Summary',
    'This reviewer lens focuses on ' + reviewer.focus + '.',
    '',
    '## Strengths',
    '• The project has a venue-aware structure and a persistent IdeaSpec.',
    idea.coreIdea ? '• A core mechanism is recorded.' : '• No core mechanism is yet recorded.',
    '',
    '## Major concerns',
    emptySections ? '• ' + emptySections + ' paper sections are still empty.' : '• All configured sections contain some text; content quality still requires expert review.',
    evidence.length < 5 ? '• Evidence coverage is currently thin (' + evidence.length + ' items).' : '• Evidence items exist, but claim-level alignment still needs checking.',
    !idea.baselines ? '• Strong comparison baselines are not documented in IdeaSpec.' : '• Verify that every baseline is implemented under comparable settings.',
    '',
    '## Questions',
    '• What single experiment would most strongly falsify the main claim?',
    '• Which closest prior work creates the hardest novelty objection?',
    '',
    '## Concrete revisions',
    '• Link each contribution to at least one section and one decisive experiment.',
    '• Convert broad novelty language into a bounded comparison against named prior work.',
  ].join('\n')
  return { id: reviewer.id, title: reviewer.title, source: reviewer.source, focus: reviewer.focus, report }
}

export function buildMetaReviewPrompt(reviews: ReviewOpinion[], conference: Conference) {
  return [
    'Act as a neutral meta-reviewer for a draft targeting ' + conference.name + '.',
    'Critically synthesize the independent reports below. Do not simply average them and do not predict the final conference decision.',
    'Identify: repeated issues, conflicting reviewer assumptions, potentially invalid criticism, blocking revisions, optional improvements, and a section-by-section revision plan.',
    'Return Markdown headings: ## Cross-review synthesis, ## Shared blockers, ## Disputed points, ## Critique of the reviewers, ## Revision plan, ## Re-review checklist.',
    '',
    ...reviews.map((r) => '### ' + r.title + ' (' + r.source + ')\n' + r.report),
  ].join('\n\n')
}

export function offlineMetaReview(reviews: ReviewOpinion[]) {
  return [
    'OFFLINE META-REVIEW',
    '',
    '## Cross-review synthesis',
    reviews.length + ' specialist lenses have reported. The recurring hard gates are novelty grounding, discriminating experiments, claim–evidence alignment, and coherent narrative.',
    '',
    '## Shared blockers',
    '• A novelty claim without named closest prior work is not yet defensible.',
    '• A contribution without a discriminating experiment is still a proposal, not evidence.',
    '• A strong paper needs explicit failure cases and limitations, not only favorable results.',
    '',
    '## Critique of the reviewers',
    'The reviewers are method lenses, not authorities. Their overlap may reflect shared LLM/research norms rather than truth. Keep dissent visible and verify every technical objection against the manuscript and evidence.',
    '',
    '## Revision plan',
    '1. Freeze a one-sentence contribution claim.',
    '2. Build the closest-prior-art table and challenge the novelty wording.',
    '3. Map each contribution to one decisive experiment and one section.',
    '4. Fix unsupported claims before polishing prose.',
    '5. Re-run the specialist reviews after revisions.',
  ].join('\n')
}

export function searchQueriesFromIdea(idea: IdeaSpec) {
  const topic = idea.topic || idea.coreIdea || 'research topic'
  const phrases = [
    topic + ' survey benchmark',
    topic + ' limitations failure analysis',
    (idea.coreIdea || topic) + ' method comparison',
    (idea.problem || topic) + ' state of the art',
    (idea.noveltyClaim || topic) + ' similar approach',
    topic + ' negative results',
  ]
  return Array.from(new Set(phrases.map((x) => x.trim()).filter(Boolean))).slice(0, 6)
}

export async function searchSemanticScholar(query: string): Promise<EvidenceItem[]> {
  const endpoint =
    'https://api.semanticscholar.org/graph/v1/paper/search?limit=8&fields=title,year,venue,authors,url,citationCount,abstract&query=' +
    encodeURIComponent(query)
  const response = await fetch(endpoint)
  if (!response.ok) throw new Error('Semantic Scholar search failed: ' + response.status)
  const data = await response.json()
  return (data?.data || []).map((p: any) => ({
    id: p.paperId || Math.random().toString(36).slice(2),
    title: p.title || 'Untitled',
    year: p.year,
    venue: p.venue,
    authors: (p.authors || []).slice(0, 5).map((a: any) => a.name).join(', '),
    url: p.url,
    citationCount: p.citationCount,
    abstract: p.abstract,
    stance: 'context' as const,
    linkedClaim: '',
    note: '',
  }))
}

export function buildLatex(
  conference: Conference,
  outline: string[],
  drafts: Record<string, string>,
  idea: IdeaSpec,
) {
  const family = conference.templateFamily
  const header =
    family === 'ACM'
      ? '\\documentclass[sigconf,anonymous,review]{acmart}'
      : family === 'IEEE'
        ? '\\documentclass[conference]{IEEEtran}'
        : family === 'Springer'
          ? '\\documentclass[runningheads]{llncs}'
          : family === 'AAAI'
            ? '\\documentclass[letterpaper]{article}\n% Add the current official AAAI style package from the author kit.'
            : '\\documentclass{article}'

  const sections = outline.map((name) => {
    const text = drafts[conference.id + ':' + name] || ''
    if (name === 'Abstract') return '\\begin{abstract}\n' + text + '\n\\end{abstract}'
    return '\\section{' + name.replace(/&/g, '\\&') + '}\n' + text
  })

  return [
    '% PaperForge scaffold for ' + conference.name,
    '% IMPORTANT: download and use the current official venue package from:',
    '% ' + conference.templateUrl,
    header,
    '\\usepackage{hyperref}',
    '\\title{' + (idea.title || 'Untitled Paper').replace(/&/g, '\\&') + '}',
    '\\author{Anonymous Authors}',
    '\\begin{document}',
    '\\maketitle',
    ...sections,
    '\\bibliographystyle{plain}',
    '\\bibliography{references}',
    '\\end{document}',
  ].join('\n\n')
}

export function getSubmissionChecks(
  conference: Conference,
  outline: string[],
  drafts: Record<string, string>,
  idea: IdeaSpec,
  evidence: EvidenceItem[],
): SubmissionCheck[] {
  const hasSection = (name: string) => (drafts[conference.id + ':' + name] || '').trim().length > 80
  const importantSections = ['Abstract', 'Introduction', 'Related Work', 'Conclusion'].filter((x) => outline.includes(x))
  const methodSection = outline.find((x) => /method|approach|system/i.test(x))
  const evalSection = outline.find((x) => /experiment|evaluation|result/i.test(x))

  return [
    {
      id: 'idea',
      label: 'IdeaSpec complete enough to write',
      detail: 'Problem, gap, mechanism, hypothesis, contributions, experiments, baselines, and failure criteria should be explicit.',
      status: ideaCompleteness(idea) >= 75 ? 'pass' : 'warn',
    },
    {
      id: 'core-sections',
      label: 'Core paper sections drafted',
      detail: importantSections.join(', '),
      status: importantSections.every(hasSection) ? 'pass' : 'warn',
    },
    {
      id: 'method',
      label: 'Method / system section drafted',
      detail: methodSection || 'No method-like section in current outline.',
      status: methodSection && hasSection(methodSection) ? 'pass' : 'warn',
    },
    {
      id: 'evaluation',
      label: 'Evaluation section drafted',
      detail: evalSection || 'No evaluation-like section in current outline.',
      status: evalSection && hasSection(evalSection) ? 'pass' : 'warn',
    },
    {
      id: 'evidence',
      label: 'Evidence matrix populated',
      detail: evidence.length + ' literature items recorded; include challenging/contradictory evidence too.',
      status: evidence.length >= 5 ? 'pass' : 'warn',
    },
    {
      id: 'template',
      label: 'Official venue template verified',
      detail: 'PaperForge exports a scaffold. Download the current official package and confirm class/style versions before submission.',
      status: 'manual',
    },
    {
      id: 'deadline',
      label: 'Deadline and timezone verified',
      detail: conference.deadlines.some((d) => d.status === 'official')
        ? 'At least one deadline is marked official; still verify the source on submission day.'
        : 'The next cycle is TBA in the catalog. Verify the venue CFP manually.',
      status: 'manual',
    },
    {
      id: 'anonymous',
      label: 'Anonymity / policy / disclosure check',
      detail: 'Verify author names, acknowledgements, repositories, supplementary links, AI-use policy, and conflict-of-interest requirements.',
      status: 'manual',
    },
    {
      id: 'pages',
      label: 'Page limit / appendix / supplementary check',
      detail: 'Verify venue-specific page limits and what counts toward the main-paper limit.',
      status: 'manual',
    },
    {
      id: 'citations',
      label: 'Citation existence and claim alignment',
      detail: 'Verify every citation exists and actually supports the nearby claim; remove placeholder citations.',
      status: 'manual',
    },
  ]
}
