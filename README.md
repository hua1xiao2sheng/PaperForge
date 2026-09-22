# PaperForge

> From venue selection to submission: conference templates, deadlines, structured paper writing, and AI-assisted research workflows in one workspace.

PaperForge is a conference-aware paper-writing workspace for computer science research. The current MVP focuses on CCF A/B venues across AI, machine learning, software engineering, databases, and data mining.

## What the MVP already does

- Filter target venues by CCF tier and research area.
- Show venue-aware template links and submission metadata.
- Model separate abstract / full-paper deadlines and multi-round submission cycles.
- Keep unannounced future deadlines as **TBA** instead of guessing.
- Switch writing outlines by research area.
- Draft papers section by section with local autosave.
- Export the current draft as a basic LaTeX document.
- Reserve API settings for OpenAI / Anthropic / Gemini / DeepSeek / OpenRouter without committing secrets.

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Data notes

The venue catalog is based on the CCF 7th edition directory released in 2026. CCF itself states that the directory is a recommendation list and should not be treated as a direct evaluation of individual papers.

Deadline data is intentionally conservative: only dates backed by an official venue page are marked as official. If the next cycle has not been announced, PaperForge shows **TBA**.

## Security

Never commit real API keys. `.env.example` only contains empty placeholders. A production version should proxy model calls through a backend and store provider secrets server-side.

## Planned next steps

1. Add an automated venue/deadline refresh service.
2. Add a real multi-file LaTeX project model with BibTeX, figures and tables.
3. Add Overleaf/GitHub sync.
4. Add literature search and citation evidence tracking.
5. Add AI-assisted outlining, paragraph drafting and reviewer simulation.
6. Add submission-readiness checks for anonymity, formatting, references and page limits.
