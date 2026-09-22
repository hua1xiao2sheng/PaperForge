# PaperForge Research Workflow

```text
Project
  │
  ├─ choose CCF A/B venue
  ├─ inspect template family / author source
  └─ inspect deadline status
  ↓
Idea Lab
  │
  ├─ structured IdeaSpec
  ├─ AI Idea Coach
  ├─ independent Innovation Council
  └─ critical meta-consensus
  ↓
Literature
  │
  ├─ perspective-driven search queries
  ├─ scholarly search
  ├─ support / challenge / context evidence
  └─ claim-to-evidence matrix
  ↓
Writing
  │
  ├─ venue/area-aware section outline
  ├─ local autosave
  ├─ section AI Copilot
  └─ venue-aware LaTeX scaffold export
  ↓
Review
  │
  ├─ independent specialist reviewers
  ├─ cross-review critique
  └─ revision plan
  ↓
Submission
  │
  ├─ completeness gates
  ├─ evidence/citation gates
  ├─ manual venue-policy gates
  ├─ LaTeX export
  └─ PaperForge project JSON export
```

## AI mode vs offline mode

PaperForge works in two modes.

### Offline scaffold mode

No API key is required. The app gives deterministic process checks and clearly labels them as offline scaffolds. It does not pretend a deterministic checklist is an AI or expert scientific judgment.

### Model-assisted mode

Open **API Settings**, choose a provider/model, and enter a key. Keys are stored in `sessionStorage` only for the current browser tab.

The current MVP supports direct browser calls for prototyping. Production deployments should put model access behind a backend API and server-side secret storage.

## Persistence

The research workspace is kept in browser `localStorage`:

- selected venue;
- IdeaSpec;
- section drafts;
- evidence matrix;
- submission manual checks.

API credentials are **not** part of that persistent workspace.

## Conference data

The catalog covers the A/B conferences in the CCF 7th edition (2026-03-31) for:

- Artificial Intelligence;
- Database / Data Mining / Information Retrieval;
- Software Engineering / System Software / Programming Languages.

The UI maps venues into practical filters (AI, ML, Software Engineering, Database, Data Mining).

Deadline values are conservative. If PaperForge has not verified a next main-track deadline from the official source, it displays `TBA` instead of guessing.

## Templates

`templates/` contains PaperForge starter scaffolds. It does not redistribute changing third-party author-kit files.

Before submission, always download the current official author kit linked in the UI.
