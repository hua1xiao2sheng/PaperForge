# Idea Studio Architecture

Idea Studio is PaperForge's human-in-the-loop research-ideation workspace.

It is intentionally split into **research state** and **replaceable capability adapters**. The state belongs to PaperForge; an external project can improve a stage without becoming the owner of the whole research project.

## Flow

```text
Human discussion
      |
      v
Research Brief
      |
      v
ARIS-style Idea Discovery
      |
      +--------------------+
      |                    |
      v                    v
Evidence grounding     Prior Findings
(PaperQA2 /            (DeepScientist-style
 ResearchAgent style)   durable memory)
      |                    |
      +---------+----------+
                v
          Candidate Ideas
                |
                v
          Critic Council
 Problem / Novelty / Method / Experiment
                |
                v
        Research Controller
 ask-user | search | revise | pilot | adopt | stop
                |
          +-----+------+
          |            |
          v            v
       Refine       Bounded pilot /
                    tree exploration
                    (AI-Scientist-v2 style)
          |            |
          +-----+------+
                v
            Findings
                |
                +-------> next discovery round
                |
                v
        Adopted IdeaSpec
                |
                v
    Writing -> Review -> Submission
```

## What is implemented now

PaperForge persists these first-class objects:

- `ResearchBrief`
- `IdeaCandidate[]`
- `IdeaCritique[]`
- `ControllerDecision`
- `ResearchFinding[]`
- human / assistant studio messages
- suggested evidence queries

The frontend lives in:

- `src/IdeaStudioView.tsx`
- `src/lib/ideaStudio.ts`

The server-side workflows live in:

- `backend/idea_studio.py`

The API workflows are:

- `idea.discover`
- `idea.critic`
- `idea.decide`
- `idea.refine`

When `VITE_AI_BACKEND_URL` is not configured, the frontend falls back to deterministic local scaffolds. Those offline scaffolds are **not model judgments** and do not claim novelty.

## Project roles

### ARIS

Role: primary idea-discovery methodology.

Current implementation: PaperForge uses an ARIS-style contract for constrained discovery, novelty-risk awareness, refinement, and bounded validation.

Future adapter: an installed ARIS / DSH-ARIS runtime can replace the discovery implementation while PaperForge keeps the same `IdeaCandidate` state contract.

### CoQuest / Perspectra

Role: human-AI co-creation.

Current implementation: the user can continuously change assets, constraints, prior work, and discussion context; another discovery round consumes the updated Research Brief.

Future UI work: branching discussion threads and explicit expert invitations can be added without changing the backend state model.

### PaperQA2 / ResearchAgent

Role: evidence grounding and literature-connected idea generation.

Current implementation: Idea Studio consumes PaperForge's existing evidence matrix and emits targeted evidence-search queries.

Future adapter: real citation-grounded retrieval can write evidence into the existing `EvidenceItem` contract.

### Agent Laboratory / InnoEval

Role: independent specialist criticism and structured innovation audit.

Current implementation: four independent critic roles cover problem value, novelty/evidence, mechanism, and data/experiments. Their objections are stored independently rather than averaged.

### AI-Scientist-v2

Role: experiment-space exploration after an idea survives initial gates.

Current implementation: the Research Controller can choose `pilot` and emits a discriminating experiment plus stop condition.

Future adapter: a tree-search experiment runner can consume the same candidate/hypothesis and write its results back as Findings.

### DeepScientist

Role: long-horizon Findings Memory.

Current implementation: PaperForge stores Findings separately from opinions. A Finding records an observation plus room for evidence, conditions, and provenance.

Future adapter: a richer quest/repository memory system can synchronize with this contract, but model speculation must not silently become a verified Finding.

## Research Controller rule

The controller does not try to maximize workflow length.

Its job is to choose the lowest-cost next action that can materially change the research decision:

- `ask-user`
- `search-more`
- `revise`
- `pilot`
- `adopt`
- `stop`

This rule prevents expensive experiments when a missing user fact or prior-art search could invalidate the route first.

## OpenClaw / DSH integration

The OpenClaw `paperforge` plugin exposes:

- `paperforge_idea_discover`
- `paperforge_idea_critic`
- `paperforge_idea_next_action`
- `paperforge_idea_refine`
- the existing IdeaSpec, section, and paper-review tools

In the user's OpenClaw fork, the ACPX plugin-tools MCP bridge is enabled by default so the preferred DSH runtime can call PaperForge plugin tools.

Codex remains an independent runtime. It can also be used as an independent reviewer; Codex-specific native tools are not merged blindly into DSH.

## Non-claims

The current implementation does **not** claim:

- that PaperForge produces better ideas than upstream ARIS;
- that a generated candidate is novel;
- that PaperQA2, ResearchAgent, InnoEval, AI-Scientist-v2, or DeepScientist are already executed as embedded upstream code;
- that a pilot result proves a paper contribution.

Those are adapter/evaluation questions to validate separately.
