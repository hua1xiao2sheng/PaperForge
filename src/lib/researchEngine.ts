export interface IdeaSpec {
  rawIdea: string
  problem: string
  gap: string
  mechanism: string
  novelty: string[]
  contributions: string[]
  experiments: string[]
  risks: string[]
  evidenceNeeded: string[]
}

export interface CouncilVoice {
  id: string
  source: string
  role: string
  verdict: 'support' | 'challenge' | 'conditional'
  headline: string
  points: string[]
}

export interface CouncilResult {
  voices: CouncilVoice[]
  consensus: string[]
  disagreements: string[]
  nextActions: string[]
  confidence: 'low' | 'medium' | 'high'
}

export interface ReviewResult {
  reviewer: string
  focus: string
  strengths: string[]
  weaknesses: string[]
  questions: string[]
  section: string
}

function compact(input: string) {
  return input.replace(/\s+/g, ' ').trim()
}

export function deriveIdeaSpec(raw: string): IdeaSpec {
  const idea = compact(raw)
  const short = idea || 'Describe the research idea before running the council.'
  return {
    rawIdea: raw,
    problem: 'Define the concrete failure mode or unmet need behind: ' + short,
    gap: 'Identify what existing methods cannot do, and separate a real capability gap from an implementation detail.',
    mechanism: 'State the causal mechanism that should produce the claimed improvement, not only the component you plan to add.',
    novelty: [
      'Novelty candidate A — a new problem formulation or constraint that changes what must be optimized.',
      'Novelty candidate B — a new mechanism that targets the identified gap rather than combining modules arbitrarily.',
      'Novelty candidate C — a stronger evaluation protocol that tests the claimed mechanism under counterfactual or stress conditions.'
    ],
    contributions: [
      'C1: Precisely define the target problem and why existing approaches are insufficient.',
      'C2: Introduce a mechanism whose design is directly tied to that gap.',
      'C3: Validate the mechanism with baselines, ablations, robustness checks and failure analysis.'
    ],
    experiments: [
      'E1: Main benchmark comparison against strong and recent baselines.',
      'E2: Component ablation that isolates the causal contribution of each design choice.',
      'E3: Stress / out-of-distribution test that probes the claimed generalization.',
      'E4: Cost, latency or resource analysis where relevant.'
    ],
    risks: [
      'The novelty may collapse to a recombination of known components if the mechanism is not independently justified.',
      'The evaluation may only prove end performance, not the claimed causal explanation.',
      'A missing strong baseline can make an otherwise good idea look unconvincing.'
    ],
    evidenceNeeded: [
      'Closest 5–10 papers and explicit claim-by-claim comparison.',
      'Evidence that the target failure mode occurs in realistic settings.',
      'A falsifiable prediction that would fail if the proposed mechanism is wrong.'
    ]
  }
}

export function runInnovationCouncil(raw: string): CouncilResult {
  const idea = compact(raw)
  const target = idea || 'the proposed research idea'
  const voices: CouncilVoice[] = [
    {
      id:'ai-scientist',
      source:'AI Scientist',
      role:'Idea & experiment critic',
      verdict:'conditional',
      headline:'The idea is only strong if it becomes experimentally falsifiable.',
      points:[
        'Turn the idea into one explicit hypothesis that can be supported or rejected.',
        'Separate novelty of the mechanism from novelty of the benchmark or application.',
        'Require an experiment plan before accepting the idea as mature.'
      ]
    },
    {
      id:'storm',
      source:'STORM / Co-STORM',
      role:'Perspective explorer',
      verdict:'support',
      headline:'Broaden the question before narrowing the contribution.',
      points:[
        'Ask how a systems researcher, ML researcher, practitioner and skeptical reviewer would frame ' + target + '.',
        'Generate follow-up questions from missing perspectives, not only from the current draft.',
        'Preserve a concept map linking problem → assumptions → evidence → open questions.'
      ]
    },
    {
      id:'gpt-researcher',
      source:'GPT Researcher',
      role:'Evidence scout',
      verdict:'conditional',
      headline:'No novelty claim should survive without a multi-source search plan.',
      points:[
        'Decompose novelty search into problem, mechanism, dataset, metric and evaluation protocol.',
        'Search each subclaim independently to reduce confirmation bias.',
        'Record contradictory evidence instead of only supportive papers.'
      ]
    },
    {
      id:'paperqa',
      source:'PaperQA',
      role:'Citation auditor',
      verdict:'challenge',
      headline:'The current idea is provisional until each key claim has traceable evidence.',
      points:[
        'Every “first”, “novel”, “better” or “missing” claim needs paper-level evidence.',
        'Keep the exact supporting passage or finding next to each claim.',
        'Mark unsupported claims as hypotheses, not facts.'
      ]
    },
    {
      id:'scientific-skills',
      source:'Scientific Agent Skills',
      role:'Method & reproducibility expert',
      verdict:'conditional',
      headline:'The idea must be executable as a reproducible procedure.',
      points:[
        'Specify inputs, tools, datasets, evaluation outputs and stop conditions.',
        'Prefer versioned, auditable procedures over vague “agent decides” steps.',
        'Add reproducibility and failure-handling requirements before implementation.'
      ]
    },
    {
      id:'autogen',
      source:'AutoGen-style moderator',
      role:'Council moderator',
      verdict:'support',
      headline:'Agreement should come from resolved objections, not a majority vote.',
      points:[
        'Collect independent reviews first.',
        'Cluster overlapping critiques and retain minority objections.',
        'Only synthesize a consensus claim after novelty, evidence, feasibility and evaluation objections are addressed.'
      ]
    }
  ]

  return {
    voices,
    consensus:[
      'Define one narrow, falsifiable research question before expanding the system.',
      'Ground novelty in a claim-by-claim nearest-work comparison, not a general literature summary.',
      'Tie each proposed component to a specific failure mode and verify it through ablation.',
      'Use multiple evidence sources and retain conflicting findings.',
      'Treat the final innovation statement as provisional until the strongest reviewer objection is answered.'
    ],
    disagreements:[
      'The exploration-oriented reviewers favor broader question discovery; the evidence-oriented reviewers want early narrowing.',
      'The system-oriented view may value workflow novelty while a method reviewer may dismiss it unless there is a new mechanism.'
    ],
    nextActions:[
      'Write the one-sentence problem statement.',
      'List the three closest prior approaches and the exact capability each lacks.',
      'Write one mechanism-level hypothesis.',
      'Design one decisive experiment that could falsify the hypothesis.',
      'Return to the council after evidence is attached to every novelty claim.'
    ],
    confidence: raw.trim().length > 120 ? 'medium' : 'low'
  }
}

export function analyzeSection(section: string, text: string, idea?: IdeaSpec) {
  const hasText = compact(text).length > 40
  const guidance: Record<string,string[]> = {
    Abstract:['Problem in one sentence','Gap or limitation','Core method','Most important quantitative result','Main implication'],
    Introduction:['Problem significance','Concrete gap','Why current approaches fail','Core insight','Contributions'],
    'Related Work':['Organize by capability or assumption','Compare rather than list','End each group with the unresolved gap'],
    Method:['Define inputs and outputs','State assumptions','Explain mechanism before implementation details','Give complexity or cost where relevant'],
    Experiments:['Research questions','Datasets and baselines','Metrics','Implementation details','Main results','Ablations','Failure analysis'],
    Evaluation:['Research questions','Baselines','Metrics','Statistical protocol','Threats and limitations'],
    Conclusion:['Restate contribution without new claims','State verified findings','Acknowledge limitations','Point to concrete future work']
  }
  return {
    structure: guidance[section] || ['Purpose of this section','Main claim','Evidence','Limitations'],
    critique: hasText
      ? ['Check whether every paragraph advances one claim.', 'Remove claims that are not supported elsewhere in the paper.', 'Make transitions explicit between problem, mechanism and evidence.']
      : ['The section is still empty or very short. Start from a claim-level outline before drafting prose.'],
    alignment: idea
      ? ['Align this section with: ' + idea.problem, 'Do not introduce a new contribution that is absent from IdeaSpec.']
      : ['Create or adopt an IdeaSpec first so the section can be checked against a stable research story.']
  }
}

export function reviewPaper(sections: string[], drafts: Record<string,string>, conferenceId: string): ReviewResult[] {
  const textFor = (section: string) => drafts[conferenceId + ':' + section] || ''
  const totalWords = sections.reduce((n,s) => n + (textFor(s).trim() ? textFor(s).trim().split(/\s+/).length : 0), 0)
  const methodSection = sections.find(s => /Method|Approach|System/.test(s)) || sections[0]
  const expSection = sections.find(s => /Experiment|Evaluation|Results/.test(s)) || sections[0]
  return [
    {
      reviewer:'Reviewer A',
      focus:'Novelty & significance',
      strengths:['The workflow can maintain a coherent problem → gap → contribution chain.'],
      weaknesses:[totalWords < 700 ? 'The manuscript is too incomplete to establish significance.' : 'Novelty still needs explicit nearest-work comparison.'],
      questions:['What is the single strongest claim that no closest baseline can already support?'],
      section:'Introduction'
    },
    {
      reviewer:'Reviewer B',
      focus:'Technical soundness & experiments',
      strengths:['The structure reserves explicit space for experiments and ablations.'],
      weaknesses:[textFor(expSection).length < 300 ? 'Experimental evidence is currently insufficient.' : 'Add a test that isolates the mechanism rather than only reporting aggregate performance.'],
      questions:['Which result would falsify the central hypothesis?'],
      section:expSection
    },
    {
      reviewer:'Reviewer C',
      focus:'Clarity & reproducibility',
      strengths:['Section-level drafting makes claims and edits traceable.'],
      weaknesses:[textFor(methodSection).length < 300 ? 'Method details are not yet reproducible.' : 'Specify assumptions, hyperparameters, resource cost and failure handling.'],
      questions:['Can another researcher reproduce the method from this paper alone?'],
      section:methodSection
    }
  ]
}

export function submissionChecks(sections: string[], drafts: Record<string,string>, conferenceId: string) {
  const checks = sections.map(section => ({
    label: section + ' drafted',
    pass: (drafts[conferenceId + ':' + section] || '').trim().length > 80
  }))
  return [
    ...checks,
    { label:'Abstract and paper claims are mutually consistent', pass:false },
    { label:'All novelty claims have evidence or citations', pass:false },
    { label:'Strong baselines and ablations are included', pass:false },
    { label:'Anonymity / author metadata checked', pass:false },
    { label:'Page limit and supplementary-material rules checked', pass:false },
    { label:'Figures, tables and references compile cleanly', pass:false }
  ]
}
