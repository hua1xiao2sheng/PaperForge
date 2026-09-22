# Method & Project Inspiration

PaperForge is an independent implementation. It does **not** copy or vendor source code from the projects below. Instead, it uses their public research/workflow ideas to define separate method lenses inside one human-controlled research workspace.

Star counts are approximate snapshots around September 2026 and will naturally change.

| Project | Approx. adoption | What PaperForge borrows conceptually | Where it appears |
| --- | ---: | --- | --- |
| [karpathy/autoresearch](https://github.com/karpathy/autoresearch) | 90k+ recent snapshot | Fixed-budget experiments, measurable metrics, keep/reject loops, experiment logs | Execution & Experiment Critic |
| [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills) | 45k+ | Independent generation before discussion, explicit assumptions, adversarial review, claim–evidence checking, decision logs | Idea Lab, Innovation Council, Technical Reviewer |
| [stanford-oval/storm](https://github.com/stanford-oval/storm) | 31k+ | Perspective-guided question asking, research-before-writing, outline from gathered evidence | Literature planning, Perspective Reviewer |
| [assafelovic/gpt-researcher](https://github.com/assafelovic/gpt-researcher) | 29k+ | Plan/decompose research questions, parallel evidence gathering, source-aware synthesis | Literature workflow |
| [microsoft/RD-Agent](https://github.com/microsoft/RD-Agent) | 14k+ | Research-and-development closed loop: hypothesis → implementation → evaluation → feedback → iterate | Feasibility and experiment review |
| [Orchestra-Research/AI-Research-SKILLs](https://github.com/Orchestra-Research/AI-Research-SKILLs) | 12k+ | Research lifecycle orchestration, diverge/converge ideation, paper narrative, rigor review | Idea, Writing, Narrative Reviewer |
| [Future-House/paper-qa](https://github.com/Future-House/paper-qa) | 9k+ | Retrieve candidate papers → gather evidence → rerank → answer from evidence with citations | Evidence matrix and Evidence Reviewer |
| [SakanaAI/AI-Scientist-v2](https://github.com/SakanaAI/AI-Scientist-v2) and [AI-Scientist](https://github.com/SakanaAI/AI-Scientist) | 7k+ for v2; larger family reach | Multiple independent reviews, iterative reflection, meta-review synthesis, automated research loops | Reflective Reviewer and Review Room |

## Why not let the agents simply vote?

PaperForge explicitly avoids a naive majority vote.

A research idea can receive unanimous positive feedback for bad reasons: shared model bias, common training data, anchoring on the same framing, or missing prior art. The Innovation Council therefore follows this order:

```text
Human IdeaSpec
    ↓
Independent method lenses (parallel)
    ↓
Each lens states:
position / strongest reason / strongest objection /
missing evidence / discriminating experiment / required revision
    ↓
Meta-critic
    ↓
Critique duplicated arguments + contradictions + shared bias
    ↓
Preserve material dissent
    ↓
Smallest defensible consensus novelty claim
    ↓
Evidence and experiment gates
```

**Consensus is a decision aid, not proof of novelty.**

## Idea Lab principles

The Idea Lab separates:

- **Problem** — the concrete difficulty being solved.
- **Gap** — what named prior approaches fail to cover.
- **Core idea** — the actual mechanism/intervention.
- **Hypothesis** — a falsifiable prediction.
- **Novelty claim** — provisional until prior-art search.
- **Contributions** — bounded claims, not marketing language.
- **Experiments** — tests that can change belief in a claim.
- **Baselines** — the strongest fair comparison.
- **Success/failure criteria** — including null-result interpretation.
- **Risks and assumptions** — explicit instead of hidden.

## Literature & evidence principles

PaperForge does not treat “search returned nothing” as proof that a gap is novel.

The evidence matrix records:

- supportive evidence;
- challenging/contradictory evidence;
- context evidence;
- the claim each source affects;
- the researcher's own note about what the source actually supports.

The built-in browser search currently uses the Semantic Scholar public API when accessible. A production backend should add rate limiting, caching, DOI verification, and additional scholarly sources.

## Writing Copilot principles

The writing copilot is **venue-aware + IdeaSpec-aware + evidence-aware + section-aware**. It supports:

- analyze section;
- build paragraph outline;
- draft from IdeaSpec;
- rewrite without strengthening claims;
- find logic gaps;
- audit citation needs;
- compress while retaining qualifiers;
- simulate a section-level reviewer.

The prompt explicitly forbids inventing citations, datasets, metrics, or experimental results.

## Review Room principles

Specialist reviewers are deliberately separated:

1. Novelty & positioning
2. Technical soundness
3. Experimental rigor
4. Evidence & citations
5. Narrative & clarity

They report independently. A separate meta-review then:

- finds repeated concerns;
- identifies disagreement;
- challenges possibly invalid reviewer criticism;
- separates blockers from optional improvements;
- produces a revision plan.

PaperForge intentionally does **not** present its AI review as an acceptance prediction.

## Licensing boundary

Upstream repositories retain their own licenses and usage terms. PaperForge links to the original repositories and implements its own data models, prompts, UI, and orchestration.

If a future version vendors any upstream code, template file, or asset, it must be reviewed separately for license compatibility and attribution requirements before merging.
