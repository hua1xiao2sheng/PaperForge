export interface Inspiration {
  id: string
  name: string
  repo: string
  starsLabel: string
  role: string
  borrowedPattern: string
  licenseNote: string
}

export const inspirations: Inspiration[] = [
  { id:'ai-scientist', name:'AI Scientist', repo:'https://github.com/SakanaAI/AI-Scientist', starsLabel:'14k+', role:'Idea & experiment critic', borrowedPattern:'Idea generation with reflection, feasibility checks, novelty search and reviewer-style evaluation.', licenseNote:'Mechanism inspired only; no source code copied.' },
  { id:'storm', name:'STORM / Co-STORM', repo:'https://github.com/stanford-oval/storm', starsLabel:'31k+', role:'Perspective explorer', borrowedPattern:'Multi-perspective question asking, pre-writing knowledge curation, collaborative experts and a moderator.', licenseNote:'Workflow concept adapted; original project is MIT licensed.' },
  { id:'gpt-researcher', name:'GPT Researcher', repo:'https://github.com/assafelovic/gpt-researcher', starsLabel:'29k+', role:'Evidence scout', borrowedPattern:'Plan-and-solve research decomposition, broad source gathering and explicit evidence-oriented reports.', licenseNote:'Architecture concept adapted; original project is Apache-2.0.' },
  { id:'paperqa', name:'PaperQA', repo:'https://github.com/Future-House/paper-qa', starsLabel:'9k+', role:'Citation auditor', borrowedPattern:'Scientific-document retrieval with source-grounded answers and citation-first evidence handling.', licenseNote:'Grounding principles adapted; original project is Apache-2.0.' },
  { id:'autogen', name:'AutoGen', repo:'https://github.com/microsoft/autogen', starsLabel:'50k+ historical', role:'Council orchestrator', borrowedPattern:'Explicit specialist agents, turn-based orchestration and moderator/group-chat patterns.', licenseNote:'Multi-agent orchestration idea adapted; implementation here is independent.' },
  { id:'scientific-skills', name:'Scientific Agent Skills', repo:'https://github.com/K-Dense-AI/scientific-agent-skills', starsLabel:'45k+', role:'Method & reproducibility expert', borrowedPattern:'Reusable procedural skills with provenance, versioning, validation and bounded scientific workflows.', licenseNote:'Skill-oriented design adapted; no third-party skill file is vendored.' }
]

export const councilPrinciples = [
  'Independent first: each reviewer speaks before seeing the synthesis.',
  'Evidence over confidence: unsupported novelty claims stay provisional.',
  'Disagreement is preserved: the moderator records minority objections instead of averaging them away.',
  'Consensus requires convergence on problem, gap, mechanism, measurable benefit and falsifiable experiment.',
  'A strong idea must survive novelty, feasibility, evidence, evaluation and reviewer-attack checks.'
]
