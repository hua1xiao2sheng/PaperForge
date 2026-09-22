# PaperForge

> From research idea to conference-ready submission: venue selection, evidence-grounded ideation, section-by-section writing, multi-perspective review, and submission checks in one workspace.

PaperForge is a conference-aware AI research workspace for computer science papers.

It is intentionally **not** a one-click “generate my paper” tool. The workflow keeps research decisions visible:

```text
Project → Idea Lab → Literature → Writing → Review → Submission
```

## Current MVP

### 1. Project & venue

- CCF 7th edition (2026) A/B venue catalog for AI, ML, software engineering, databases, and data mining.
- 69 A/B conference entries across the relevant CCF domains.
- Venue/template family metadata.
- Official author-kit/template source links.
- Conservative deadline model: unknown future dates remain `TBA`.

### 2. Idea Lab

A persistent `IdeaSpec` captures:

- problem;
- research gap;
- core mechanism;
- falsifiable hypothesis;
- provisional novelty claim;
- contributions;
- technical route;
- decisive experiments;
- baselines;
- data/environment;
- success/failure criteria;
- risks;
- assumptions.

The **Innovation Council** runs independent method lenses inspired by widely used open research projects, then a separate meta-critic synthesizes the reports. Agreement is not treated as proof of novelty.

### 3. Literature & evidence

- Perspective-guided search-query generation.
- Semantic Scholar public search integration when available.
- Manual evidence entry.
- Evidence roles: `support`, `challenge`, `context`.
- Claim-to-evidence links and researcher notes.
- No “zero search results = novel” shortcut.

### 4. Writing

- Area-aware section structures.
- Write one section at a time.
- Local autosave.
- Section AI Copilot actions:
  - analyze;
  - outline;
  - draft from IdeaSpec;
  - rewrite;
  - logic-gap review;
  - citation audit;
  - compression;
  - reviewer view.
- AI prompts explicitly prohibit fabricating citations, data, metrics, or experimental results.

### 5. Review Room

Independent specialist lenses:

- novelty & positioning;
- technical soundness;
- experimental rigor;
- evidence & citations;
- narrative & clarity.

A separate meta-review critiques both the paper **and the reviewers**, preserves disagreement, and produces a revision plan. PaperForge does not present AI review as an acceptance prediction.

### 6. Submission Gate

- Idea completeness.
- Core section completeness.
- Method/evaluation coverage.
- Evidence matrix coverage.
- Manual checks for:
  - official author kit;
  - deadline/timezone;
  - anonymity;
  - venue policy / AI disclosure;
  - page limits / supplementary rules;
  - citation existence and claim alignment.
- Venue-aware `.tex` scaffold export.
- Full PaperForge project JSON export.

## AI providers

The MVP includes an adapter for:

- OpenAI
- Anthropic
- Gemini
- DeepSeek
- OpenRouter

API keys are blank by default.

The current prototype stores a supplied key in browser `sessionStorage` only. It is **not** written to GitHub or the persistent PaperForge workspace.

For a production deployment, route all model calls through a backend and keep secrets server-side.

Without an API key, PaperForge remains usable in **offline scaffold mode** with deterministic research-process checks.

## LaTeX templates

`templates/` contains starter scaffolds for:

- ACM
- IEEE
- AAAI
- ACL
- Springer LNCS
- USENIX
- Generic LaTeX

These are intentionally not redistributed conference author-kit bundles. Always download the current official class/style files from the venue before submission.

## Method inspiration

PaperForge independently implements workflow ideas inspired by high-adoption open research projects, including:

- Karpathy Autoresearch
- K-Dense Scientific Agent Skills
- Stanford STORM / Co-STORM
- GPT Researcher
- Microsoft R&D-Agent
- Orchestra AI Research SKILLs
- FutureHouse PaperQA2
- Sakana AI Scientist family

See [docs/INSPIRATION.md](docs/INSPIRATION.md) for the exact division of responsibilities and licensing boundary.

The core principle is:

```text
independent perspectives
        ↓
explicit objections and missing evidence
        ↓
critical meta-analysis
        ↓
smallest defensible consensus claim
        ↓
literature + experiment gates
```

Consensus is a decision aid, not scientific proof.

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Important files

```text
src/
  App.tsx                    # end-to-end UI/workflow
  data/
    conferences.ts           # CCF venue catalog + outlines
    researchMethods.ts       # project-inspired method lenses
  lib/
    ai.ts                    # multi-provider model adapter
    research.ts              # Idea/Literature/Writing/Review logic

templates/                  # LaTeX starter scaffolds
docs/
  INSPIRATION.md            # upstream methods & design rationale
  WORKFLOW.md               # PaperForge workflow specification
```

## Research integrity defaults

PaperForge is designed to keep these distinctions explicit:

- idea ≠ finding;
- search gap ≠ proof of novelty;
- reviewer agreement ≠ truth;
- AI review ≠ editorial decision;
- generated citation ≠ verified citation;
- LaTeX scaffold ≠ current official author kit.

## Data note

The venue catalog follows the CCF 7th edition released in 2026. CCF describes the catalog as a recommended list and cautions against using it as a direct evaluation of individual academic work.

See [docs/WORKFLOW.md](docs/WORKFLOW.md) for the full system flow.
