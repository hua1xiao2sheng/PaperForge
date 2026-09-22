# PaperForge Research Workflow

PaperForge v0.2 turns the original conference-aware editor into an end-to-end research workspace.

## 1. Project / Venue

Choose a CCF A/B venue and inspect:

- conference family and area
- official template / author kit
- abstract and paper deadlines when officially published
- CFP source
- section structure
- LaTeX export preset

PaperForge does not guess unpublished future deadlines.

## 2. Idea Lab

The **Innovation Council** is intentionally multi-perspective.

Independent voices are inspired by widely used research-agent projects:

- **AI Scientist** — idea reflection, feasibility and reviewer-style scientific criticism
- **STORM / Co-STORM** — multi-perspective question asking and moderator synthesis
- **GPT Researcher** — task decomposition, broad evidence collection and bias reduction
- **PaperQA** — claim-level evidence and citation grounding
- **Scientific Agent Skills** — procedural, versioned and reproducible research workflows
- **AutoGen-style orchestration** — explicit specialist roles and turn-based council synthesis

The council follows two rounds:

1. every voice critiques independently;
2. the moderator clusters agreements, keeps unresolved disagreements, and produces required next actions.

The result can be adopted into an **IdeaSpec** containing problem, gap, mechanism, novelty candidates, contributions, experiments, risks and evidence requirements.

## 3. Writing

Writing is section-by-section rather than one-shot generation.

The current section, target venue and adopted IdeaSpec form the context for the Section AI Copilot.

Available interaction patterns:

- analyze structure
- find logic gaps
- check IdeaSpec alignment
- simulate reviewer attack

The built-in deterministic engine keeps the frontend usable without keys. A server-side LLM gateway can replace or augment the local engine.

## 4. Literature / Evidence Workspace

The literature workflow is:

```text
Research question
→ perspective questions
→ search tasks
→ candidate papers
→ claim-level evidence
→ contradictions
→ synthesis
```

Evidence is stored by **claim**, not only by paper title. This is designed to prevent unsupported novelty statements and citation laundering.

## 5. Review Room

Three independent roles are included in the current MVP:

- Reviewer A — novelty and significance
- Reviewer B — technical soundness and experiments
- Reviewer C — clarity and reproducibility

Each review produces strengths, weaknesses, questions and a target section. The Area-Chair-style synthesis converts weaknesses into P0/P1 revision tasks that jump back to the relevant section.

## 6. Submission Gate

Submission readiness checks cover:

- section completeness
- abstract/body consistency
- evidence for novelty claims
- strong baselines and ablations
- anonymization
- page-limit / supplementary rules
- figures, tables and references
- official template and CFP links

Human sign-off remains mandatory.

## AI integration

Do **not** put provider keys in the browser bundle. The frontend calls a future backend endpoint through `src/lib/aiClient.ts`.

When `VITE_AI_BACKEND_URL` is not configured, PaperForge falls back to the local deterministic research engine.

## Inspiration sources

PaperForge independently implements these patterns; it does not vendor or copy third-party source code.

- https://github.com/SakanaAI/AI-Scientist
- https://github.com/stanford-oval/storm
- https://github.com/assafelovic/gpt-researcher
- https://github.com/Future-House/paper-qa
- https://github.com/microsoft/autogen
- https://github.com/K-Dense-AI/scientific-agent-skills
