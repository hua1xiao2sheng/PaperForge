# PaperForge

> From research idea to conference submission: venue-aware templates, deadlines, evidence-grounded writing, multi-agent innovation review, section-level AI assistance and submission checks.

PaperForge is an end-to-end research-paper workspace for computer science. It combines conference selection, idea analysis, literature evidence, section-by-section writing, reviewer simulation and submission preparation in one interface.

## Current workflow

```text
Choose venue
→ Idea Lab
→ Innovation Council
→ Adopt IdeaSpec
→ Literature / Evidence
→ Write section by section
→ Section AI Copilot
→ Multi-reviewer Review Room
→ Revision priorities
→ Submission Gate
→ Export LaTeX
```

## What is implemented

### Venue-aware project setup

- CCF A/B venue browser for AI, ML, software engineering, databases and data mining.
- Official author-kit / template links.
- Abstract / full-paper deadline data model.
- TBA instead of invented future deadlines.
- Conference-aware section outlines.
- ACM / IEEE / Springer / AAAI / ACL / USENIX / Custom LaTeX skeleton presets.

### Idea Lab

The Innovation Council combines independent research perspectives inspired by mature open-source systems:

- AI Scientist — idea reflection, experimental falsifiability and reviewer-style criticism.
- STORM / Co-STORM — multi-perspective questioning and moderator synthesis.
- GPT Researcher — research decomposition and broad evidence gathering.
- PaperQA — citation-grounded scientific evidence.
- Scientific Agent Skills — procedural reproducibility and versioned skills.
- AutoGen-style orchestration — explicit multi-agent roles and moderated synthesis.

The moderator does **not** simply vote. It keeps consensus, disagreement and required next actions separate.

The result can be adopted as an `IdeaSpec` containing:

- problem
- gap
- mechanism
- novelty candidates
- contributions
- experiment plan
- risks
- evidence requirements

### Section-by-section Writing

Each paper section is written separately and autosaved in the browser.

The Section AI Copilot can analyze:

- recommended section structure
- logic gaps
- IdeaSpec alignment
- reviewer-style attacks

The built-in local engine works without any API key.

### Literature / Evidence Workspace

The evidence workflow is organized as:

```text
Research question
→ perspective questions
→ search tasks
→ candidate papers
→ claim-level evidence
→ contradictions
→ synthesis
```

The design intentionally stores evidence by **claim**, not only by paper.

### Review Room

Three independent reviewer roles are currently modeled:

- Reviewer A — novelty and significance
- Reviewer B — technical soundness and experiments
- Reviewer C — clarity and reproducibility

An Area-Chair-style synthesis converts weaknesses into P0/P1 revision tasks and links them back to the relevant writing section.

### Submission Gate

Current checks include:

- section completeness
- abstract/body consistency
- novelty claims with evidence
- strong baselines and ablations
- anonymity
- page-limit / supplementary rules
- figures, tables and references
- official template / CFP links

### AI backend contract

Real provider keys should **not** be exposed in browser code.

`src/lib/aiClient.ts` defines a server-side workflow API. Configure:

```bash
VITE_AI_BACKEND_URL=http://localhost:8000
```

When the backend is absent, PaperForge falls back to the deterministic local research engine.

See:

- `docs/research-workflow.md`
- `docs/backend-api.md`

## Run locally

Frontend:

```bash
npm install
npm run dev
```

Optional real-AI backend:

```bash
cd backend
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
# fill one server-side provider key in your environment
uvicorn main:app --reload --port 8000
```

Then set the frontend environment:

```bash
VITE_AI_BACKEND_URL=http://localhost:8000
```

Without the backend or keys, the interface automatically uses the local deterministic research engine.

Build:

```bash
npm run build
```

GitHub Actions also runs a frontend build check on pushes and pull requests.

## Research workflow inspirations

PaperForge independently re-implements workflow ideas; it does not copy or vendor source code from these projects.

- [SakanaAI/AI-Scientist](https://github.com/SakanaAI/AI-Scientist)
- [stanford-oval/storm](https://github.com/stanford-oval/storm)
- [assafelovic/gpt-researcher](https://github.com/assafelovic/gpt-researcher)
- [Future-House/paper-qa](https://github.com/Future-House/paper-qa)
- [microsoft/autogen](https://github.com/microsoft/autogen)
- [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills)

## Security

- Never commit real API keys.
- Prefer a backend provider gateway.
- Keep citation evidence traceable.
- Preserve disagreement in multi-agent review.
- Human verification is required before paper submission.

## Important scope note

The current frontend contains a complete **workflow shell and deterministic local research logic**. Live model calls, real literature search, PDF ingestion, citation retrieval and true multi-model parallel review require the backend/search connectors described in the docs. The UI and data contracts are already prepared for those integrations.
