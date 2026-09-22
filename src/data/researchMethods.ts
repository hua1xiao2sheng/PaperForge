export type WorkflowStage = 'Project' | 'Idea Lab' | 'Literature' | 'Writing' | 'Review' | 'Submission'

export interface InspirationProject {
  id: string
  name: string
  repo: string
  stars: string
  role: string
  method: string
  licenseNote: string
}

export const inspirationProjects: InspirationProject[] = [
  {
    id: 'autoresearch',
    name: 'Autoresearch',
    repo: 'https://github.com/karpathy/autoresearch',
    stars: '90k+ snapshot',
    role: 'Experiment loop',
    method: 'Borrow the discipline, not the code: fixed budget, measurable metric, keep/reject loop, and an auditable experiment journal.',
    licenseNote: 'Conceptual inspiration only; PaperForge does not vendor upstream source code.',
  },
  {
    id: 'scientific-skills',
    name: 'Scientific Agent Skills',
    repo: 'https://github.com/K-Dense-AI/scientific-agent-skills',
    stars: '45k+',
    role: 'Rigor & scientific process',
    method: 'Independent ideation before discussion, explicit assumptions, adversarial review, evidence labels, claim–evidence checks, and decision logs.',
    licenseNote: 'MIT upstream; PaperForge reimplements the workflow concepts independently.',
  },
  {
    id: 'storm',
    name: 'STORM / Co-STORM',
    repo: 'https://github.com/stanford-oval/storm',
    stars: '31k+',
    role: 'Perspective-guided research',
    method: 'Perspective-guided question asking, simulated expert conversations, research-before-writing, and outline generation from gathered evidence.',
    licenseNote: 'MIT upstream; no source code is copied into PaperForge.',
  },
  {
    id: 'gpt-researcher',
    name: 'GPT Researcher',
    repo: 'https://github.com/assafelovic/gpt-researcher',
    stars: '29k+',
    role: 'Deep research planning',
    method: 'Plan-and-solve decomposition, parallel source gathering, source tracking, and synthesis across diverse evidence.',
    licenseNote: 'Apache-2.0 upstream; used as architecture inspiration only.',
  },
  {
    id: 'rd-agent',
    name: 'R&D-Agent',
    repo: 'https://github.com/microsoft/RD-Agent',
    stars: '14k+',
    role: 'Execution feasibility',
    method: 'Turn ideas into testable development loops: hypothesis, implementation, evaluation, feedback, and another iteration.',
    licenseNote: 'Upstream project remains separate; PaperForge only adopts the closed-loop research pattern.',
  },
  {
    id: 'orchestra',
    name: 'AI Research SKILLs',
    repo: 'https://github.com/Orchestra-Research/AI-Research-SKILLs',
    stars: '12k+',
    role: 'Lifecycle orchestration',
    method: 'Two-loop research orchestration, structured diverge/converge ideation, research memory, rigor review, and paper narrative guidance.',
    licenseNote: 'MIT upstream; PaperForge maintains its own prompts and UI.',
  },
  {
    id: 'paperqa',
    name: 'PaperQA2',
    repo: 'https://github.com/Future-House/paper-qa',
    stars: '9k+',
    role: 'Evidence grounding',
    method: 'Search candidates, gather evidence, rerank contextual summaries, and answer from the strongest evidence with citations.',
    licenseNote: 'Apache-2.0 upstream; PaperForge does not vendor PaperQA code.',
  },
  {
    id: 'ai-scientist',
    name: 'AI Scientist family',
    repo: 'https://github.com/SakanaAI/AI-Scientist-v2',
    stars: '7k+ (v2)',
    role: 'Reflection & review ensemble',
    method: 'Use iterative reflection, multiple independent reviews, meta-review synthesis, and tree-search style exploration instead of one-shot judgement.',
    licenseNote: 'Responsible-use/source-code terms apply upstream; PaperForge uses only high-level workflow ideas.',
  },
]

export interface CouncilLens {
  id: string
  title: string
  source: string
  focus: string
  prompt: string
}

export const innovationCouncil: CouncilLens[] = [
  {
    id: 'independent',
    title: 'Independent Ideation Auditor',
    source: 'Scientific Agent Skills',
    focus: 'Assumptions, falsifiability, alternative explanations',
    prompt: 'Independently inspect the idea before seeing other opinions. Separate claims, assumptions, predictions, and missing evidence. Identify a falsifying observation and at least one rival explanation. Do not praise by default.',
  },
  {
    id: 'perspective',
    title: 'Perspective & Unknowns Researcher',
    source: 'STORM / GPT Researcher',
    focus: 'Coverage, missing questions, adjacent perspectives',
    prompt: 'Generate the questions a strong literature researcher would ask from multiple perspectives. Find the unknown-unknowns, neighboring fields, contrary evidence, and missing terminology that could invalidate a claimed research gap.',
  },
  {
    id: 'evidence',
    title: 'Evidence Grounding Reviewer',
    source: 'PaperQA2',
    focus: 'Claim–evidence map, prior art, citation sufficiency',
    prompt: 'Audit whether each novelty claim can be grounded. Ask what papers, benchmarks, negative results, or contradictory findings must be retrieved. Distinguish no evidence located from evidence of absence.',
  },
  {
    id: 'execution',
    title: 'Execution & Experiment Critic',
    source: 'R&D-Agent / Autoresearch',
    focus: 'Feasibility, measurable metric, discriminating experiments',
    prompt: 'Turn the proposal into an execution loop. Require a baseline, a measurable metric, a fixed comparison budget, keep/reject criteria, and experiments that discriminate the proposed mechanism from simpler alternatives.',
  },
  {
    id: 'narrative',
    title: 'Research Narrative Reviewer',
    source: 'AI Research SKILLs',
    focus: 'Problem → gap → claim → evidence story',
    prompt: 'Check whether the work tells one coherent technical story. The contribution must be expressible in one sentence, and every proposed experiment must support or challenge a named claim instead of being an unrelated benchmark.',
  },
  {
    id: 'reflection',
    title: 'Reflective Meta-Reviewer',
    source: 'AI Scientist family',
    focus: 'Novelty, soundness, significance, self-critique',
    prompt: 'Review the idea as a skeptical top-conference reviewer. Then reflect on your own review: identify possible positivity/negativity bias, what you may have misunderstood, and which criticism would change after seeing stronger evidence.',
  },
]

export interface PaperReviewer {
  id: string
  title: string
  source: string
  focus: string
  prompt: string
}

export const paperReviewers: PaperReviewer[] = [
  {
    id: 'novelty',
    title: 'Novelty Reviewer',
    source: 'AI Scientist + ideation literature',
    focus: 'Originality & positioning',
    prompt: 'Review only originality and positioning. Identify the closest conceptual baselines, what is actually new, what may be recombination, and the exact evidence needed before making a strong novelty claim.',
  },
  {
    id: 'technical',
    title: 'Technical Soundness Reviewer',
    source: 'Scientific Agent Skills',
    focus: 'Methods, assumptions, correctness',
    prompt: 'Review methods, assumptions, definitions, causal or statistical reasoning, implementation details, and whether central claims are actually supported. Be specific and evidence-bounded.',
  },
  {
    id: 'experimental',
    title: 'Experimental Rigor Reviewer',
    source: 'R&D-Agent + Autoresearch',
    focus: 'Baselines, ablations, robustness, reproducibility',
    prompt: 'Audit the experiment design. Require strong baselines, controlled ablations, uncertainty or repeated runs where relevant, failure cases, resource accounting, and a reproducible configuration.',
  },
  {
    id: 'evidence',
    title: 'Evidence & Citation Reviewer',
    source: 'PaperQA2 + STORM',
    focus: 'Claim–citation alignment',
    prompt: 'Map important claims to evidence. Flag unsupported statements, missing counter-evidence, citation gaps, and places where related work is being used as decoration rather than to delimit the contribution.',
  },
  {
    id: 'clarity',
    title: 'Narrative & Clarity Reviewer',
    source: 'AI Research SKILLs',
    focus: 'Story, structure, reviewer readability',
    prompt: 'Check whether the paper communicates one clear technical story. Look for contribution drift, undefined terms, duplicated sections, missing transitions, and experiments that do not answer a research question.',
  },
]

export const workflowStages: Array<{ id: WorkflowStage; description: string }> = [
  { id: 'Project', description: 'Choose venue, template family, scope, and research target.' },
  { id: 'Idea Lab', description: 'Diverge, ground, stress-test, and converge on a defensible idea.' },
  { id: 'Literature', description: 'Build search questions, evidence matrix, and claim-to-source map.' },
  { id: 'Writing', description: 'Draft one section at a time with venue- and idea-aware AI help.' },
  { id: 'Review', description: 'Run independent specialist reviews, meta-critique, and revision planning.' },
  { id: 'Submission', description: 'Audit completeness, anonymity, evidence, formatting, and export.' },
]

export const sectionActions = [
  { id: 'analyze', label: 'Analyze section', description: 'Find missing logic, claims, and evidence.' },
  { id: 'outline', label: 'Build outline', description: 'Create a paragraph-level argument plan.' },
  { id: 'draft', label: 'Draft from IdeaSpec', description: 'Produce a grounded first draft using project context.' },
  { id: 'rewrite', label: 'Rewrite selection', description: 'Improve precision and academic clarity without changing claims.' },
  { id: 'logic', label: 'Find logic gaps', description: 'Act as a skeptical reviewer and locate unsupported jumps.' },
  { id: 'citations', label: 'Citation audit', description: 'Mark claims that need evidence and suggest search questions.' },
  { id: 'compress', label: 'Compress', description: 'Shorten while preserving claims, evidence, and qualifiers.' },
  { id: 'reviewer', label: 'Reviewer view', description: 'Critique this section from a venue-aware reviewer perspective.' },
] as const
