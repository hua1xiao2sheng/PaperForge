from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable

ModelCaller = Callable[[str, str, float], Awaitable[str]]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_json(text: str) -> Any:
    value = text.strip()
    if value.startswith("```"):
        lines = value.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        value = "\n".join(lines)
    return json.loads(value)


async def _model_json(
    chat: ModelCaller,
    system: str,
    payload: Any,
    *,
    temperature: float = 0.2,
) -> Any:
    raw = await chat(system, json.dumps(payload, ensure_ascii=False), temperature)
    return _parse_json(raw)


def _candidate(candidate: dict[str, Any], index: int) -> dict[str, Any]:
    now = _now()
    return {
        "id": str(candidate.get("id") or f"idea-{int(datetime.now().timestamp() * 1000)}-{index}"),
        "title": str(candidate.get("title") or "Untitled research candidate"),
        "problem": str(candidate.get("problem") or "Problem still needs to be explicit."),
        "gap": str(candidate.get("gap") or "Gap requires literature verification."),
        "mechanism": str(candidate.get("mechanism") or "Mechanism not yet specified."),
        "hypothesis": str(candidate.get("hypothesis") or "Hypothesis not yet falsifiable."),
        "noveltyClaim": str(
            candidate.get("noveltyClaim")
            or "Novelty claim is provisional pending closest-work checks."
        ),
        "resourceFit": str(candidate.get("resourceFit") or "Resource fit has not been checked."),
        "experiment": str(
            candidate.get("experiment")
            or "Define a minimum discriminating experiment before scaling."
        ),
        "noveltyRisk": str(
            candidate.get("noveltyRisk") or "Unknown until closest prior work is checked."
        ),
        "origin": str(candidate.get("origin") or "ARIS-style discovery"),
        "version": int(candidate.get("version") or 1),
        "status": str(candidate.get("status") or "candidate"),
        "createdAt": str(candidate.get("createdAt") or now),
    }


def _critique(critique: dict[str, Any], candidate_id: str, index: int) -> dict[str, Any]:
    severity = str(critique.get("severity") or "major")
    if severity not in {"blocker", "major", "minor"}:
        severity = "major"
    return {
        "id": str(critique.get("id") or f"{candidate_id}-critic-{index}"),
        "candidateId": candidate_id,
        "role": str(critique.get("role") or "Research critic"),
        "source": str(critique.get("source") or "Idea Studio"),
        "summary": str(critique.get("summary") or ""),
        "objections": [str(x) for x in critique.get("objections", [])],
        "evidenceNeeded": [str(x) for x in critique.get("evidenceNeeded", [])],
        "discriminatingExperiment": str(critique.get("discriminatingExperiment") or ""),
        "severity": severity,
    }


def _evidence_digest(items: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    for item in (items or [])[:30]:
        output.append(
            {
                "title": item.get("title"),
                "stance": item.get("stance"),
                "linkedClaim": item.get("linkedClaim"),
                "note": item.get("note"),
                "year": item.get("year"),
                "venue": item.get("venue"),
            }
        )
    return output


def _finding_digest(items: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    for item in (items or [])[:30]:
        output.append(
            {
                "kind": item.get("kind"),
                "statement": item.get("statement"),
                "evidence": item.get("evidence"),
                "conditions": item.get("conditions"),
                "source": item.get("source"),
            }
        )
    return output


async def discover(payload: dict[str, Any], chat: ModelCaller) -> dict[str, Any]:
    system = """
You are the Idea Discovery core inside PaperForge Idea Studio.

Follow an ARIS-style research discovery discipline:
1. Start from the user's real assets, constraints, prior work, and observed failures.
2. Diverge before converging. Produce candidates from materially different discovery routes:
   - data/asset-driven opportunity,
   - prior-art limitation or assumption,
   - failure/negative-result driven opportunity,
   - cross-domain mechanism transfer only when the prerequisites plausibly match.
3. A candidate is a hypothesis to investigate, not a novelty claim.
4. Never say "nobody has studied this" unless evidence supports that statement.
5. Novelty must be checked against direct competitors, adjacent methods, negative results, and analogous mechanisms.
6. Prefer a minimum discriminating experiment over a large implementation.
7. If a critical user fact is missing, ask a focused question instead of inventing the fact.
8. Use prior Findings as constraints; do not repeat a failed route without a reason it may now work.

Return STRICT JSON with:
{
  "assistantMessage": string,
  "briefPatch": object,
  "questions": string[],
  "searchQueries": string[],
  "candidates": [
    {
      "id": string,
      "title": string,
      "problem": string,
      "gap": string,
      "mechanism": string,
      "hypothesis": string,
      "noveltyClaim": string,
      "resourceFit": string,
      "experiment": string,
      "noveltyRisk": string,
      "origin": string,
      "version": 1,
      "status": "candidate" | "needs-evidence"
    }
  ],
  "controller": {
    "action": "ask-user" | "search-more" | "revise" | "pilot",
    "rationale": string,
    "question": string,
    "searchQueries": string[],
    "experiment": string,
    "stopCondition": string
  }
}

Generate at most 4 candidates. Keep every novelty statement explicitly provisional.
""".strip()

    data = {
        "venue": payload.get("venue"),
        "researchBrief": payload.get("researchBrief") or {},
        "currentIdeaSpec": payload.get("ideaSpec") or {},
        "userInstruction": payload.get("instruction"),
        "conversationTail": (payload.get("messages") or [])[-8:],
        "existingCandidates": (payload.get("candidates") or [])[-8:],
        "evidence": _evidence_digest(payload.get("evidence")),
        "findings": _finding_digest(payload.get("findings")),
    }
    result = await _model_json(chat, system, data, temperature=0.45)
    candidates = [
        _candidate(candidate, index)
        for index, candidate in enumerate(result.get("candidates") or [])
        if isinstance(candidate, dict)
    ]
    controller = result.get("controller") if isinstance(result.get("controller"), dict) else None
    if controller:
        controller = {
            "candidateId": controller.get("candidateId"),
            "action": controller.get("action") or "search-more",
            "rationale": controller.get("rationale") or "More evidence is needed.",
            "question": controller.get("question") or "",
            "searchQueries": [str(x) for x in controller.get("searchQueries", [])],
            "experiment": controller.get("experiment") or "",
            "stopCondition": controller.get("stopCondition") or "",
        }
    return {
        "assistantMessage": str(
            result.get("assistantMessage")
            or "Candidate discovery completed. Treat every route as provisional until evidence and a discriminating test support it."
        ),
        "briefPatch": result.get("briefPatch") if isinstance(result.get("briefPatch"), dict) else {},
        "questions": [str(x) for x in result.get("questions", [])],
        "searchQueries": [str(x) for x in result.get("searchQueries", [])],
        "candidates": candidates,
        "controller": controller,
    }


CRITIC_ROLES = [
    (
        "Problem & Value Reviewer",
        "Agent Laboratory-style specialist role",
        "Judge whether the stated problem is real, measurable, and important enough to motivate a research contribution. Separate problem importance from method attractiveness.",
    ),
    (
        "Novelty & Evidence Reviewer",
        "PaperQA2 / InnoEval-style evidence audit",
        "Audit claim-to-evidence alignment. Identify the closest work that must be checked, distinguish missing evidence from evidence of absence, and attack recombination-only novelty.",
    ),
    (
        "Method & Mechanism Reviewer",
        "Agent Laboratory-style method specialist",
        "Test whether the mechanism plausibly explains the expected effect, whether simpler alternatives exist, and which ablation would distinguish them.",
    ),
    (
        "Data & Experiment Reviewer",
        "AI-Scientist-v2-style experiment gate",
        "Check whether the available resources can actually test the hypothesis. Propose the cheapest discriminating pilot and an explicit stop condition.",
    ),
]


async def critic(payload: dict[str, Any], chat: ModelCaller) -> dict[str, Any]:
    candidate = payload.get("candidate") or {}
    candidate_id = str(candidate.get("id") or "candidate")

    async def one(role: str, source: str, instruction: str) -> dict[str, Any]:
        system = f"""
You are {role} inside a research Critic Council.
Method reference: {source}.
{instruction}

Review independently. Do not optimize for agreement and do not predict paper acceptance.
Return STRICT JSON with:
{{
  "role": "{role}",
  "source": "{source}",
  "summary": string,
  "objections": string[],
  "evidenceNeeded": string[],
  "discriminatingExperiment": string,
  "severity": "blocker" | "major" | "minor"
}}
A blocker means the current claim cannot responsibly proceed without resolving it.
""".strip()
        data = {
            "venue": payload.get("venue"),
            "researchBrief": payload.get("researchBrief") or {},
            "candidate": candidate,
            "evidence": _evidence_digest(payload.get("evidence")),
            "findings": _finding_digest(payload.get("findings")),
        }
        result = await _model_json(chat, system, data, temperature=0.15)
        return result if isinstance(result, dict) else {}

    raw = await asyncio.gather(
        *(one(role, source, instruction) for role, source, instruction in CRITIC_ROLES)
    )
    return {
        "critiques": [
            _critique(item, candidate_id, index)
            for index, item in enumerate(raw)
        ]
    }


async def decide(payload: dict[str, Any], chat: ModelCaller) -> dict[str, Any]:
    system = """
You are the Research Controller for PaperForge Idea Studio.

You do NOT write a paper and you do NOT reward longer workflows.
Choose the next action that is most likely to change the current research decision at the lowest reasonable cost.

Allowed actions:
- ask-user: a missing human fact blocks responsible progress.
- search-more: prior-art or evidence uncertainty is the dominant blocker.
- revise: the route is promising but the problem/mechanism/hypothesis must change first.
- pilot: a small bounded experiment can discriminate the key hypothesis.
- adopt: the route is sufficiently specified for an IdeaSpec; this does not mean the paper is proven.
- stop: evidence or feasibility makes the route not worth continued work now.

Rules:
- Never choose adopt merely because reviewers agree.
- A blocker critique must be addressed or explicitly bounded.
- If novelty evidence is weak, search before scaling experiments.
- If a pilot is chosen, include a stop condition.
- If user resources cannot support the experiment, ask or revise instead of pretending they can.

Return STRICT JSON:
{
  "decision": {
    "candidateId": string,
    "action": "ask-user" | "search-more" | "revise" | "pilot" | "adopt" | "stop",
    "rationale": string,
    "question": string,
    "searchQueries": string[],
    "experiment": string,
    "stopCondition": string
  }
}
""".strip()
    data = {
        "venue": payload.get("venue"),
        "researchBrief": payload.get("researchBrief") or {},
        "candidate": payload.get("candidate") or {},
        "critiques": payload.get("critiques") or [],
        "evidence": _evidence_digest(payload.get("evidence")),
        "findings": _finding_digest(payload.get("findings")),
    }
    result = await _model_json(chat, system, data, temperature=0.05)
    decision = result.get("decision") if isinstance(result, dict) else None
    if not isinstance(decision, dict):
        raise ValueError("Research Controller returned no decision object")
    return {
        "decision": {
            "candidateId": decision.get("candidateId")
            or (payload.get("candidate") or {}).get("id"),
            "action": decision.get("action") or "revise",
            "rationale": str(decision.get("rationale") or ""),
            "question": str(decision.get("question") or ""),
            "searchQueries": [str(x) for x in decision.get("searchQueries", [])],
            "experiment": str(decision.get("experiment") or ""),
            "stopCondition": str(decision.get("stopCondition") or ""),
        }
    }


async def refine(payload: dict[str, Any], chat: ModelCaller) -> dict[str, Any]:
    system = """
You are the refinement stage of PaperForge Idea Studio.

Revise the candidate only where evidence, critiques, user constraints, or Findings justify a change.
Do not hide unresolved objections by rewriting the title.
Preserve the same stable candidate id, increment version by exactly 1, and keep novelty language provisional.
If a critique cannot be resolved with current evidence, make the uncertainty explicit in noveltyRisk.

Return STRICT JSON:
{
  "assistantMessage": string,
  "candidate": {
    "id": string,
    "title": string,
    "problem": string,
    "gap": string,
    "mechanism": string,
    "hypothesis": string,
    "noveltyClaim": string,
    "resourceFit": string,
    "experiment": string,
    "noveltyRisk": string,
    "origin": string,
    "version": integer,
    "status": "candidate" | "needs-evidence" | "pilot-ready" | "paused"
  }
}
""".strip()
    current = payload.get("candidate") or {}
    data = {
        "venue": payload.get("venue"),
        "researchBrief": payload.get("researchBrief") or {},
        "candidate": current,
        "critiques": payload.get("critiques") or [],
        "evidence": _evidence_digest(payload.get("evidence")),
        "findings": _finding_digest(payload.get("findings")),
    }
    result = await _model_json(chat, system, data, temperature=0.2)
    candidate = result.get("candidate") if isinstance(result, dict) else None
    if not isinstance(candidate, dict):
        raise ValueError("Refinement returned no candidate")
    candidate["id"] = current.get("id") or candidate.get("id")
    candidate["version"] = int(current.get("version") or 1) + 1
    candidate["createdAt"] = current.get("createdAt") or _now()
    return {
        "assistantMessage": str(result.get("assistantMessage") or "Candidate refined."),
        "candidate": _candidate(candidate, 0),
    }


async def handle_idea_studio(
    workflow: str,
    payload: dict[str, Any],
    chat: ModelCaller,
) -> dict[str, Any]:
    if workflow == "idea.discover":
        return await discover(payload, chat)
    if workflow == "idea.critic":
        return await critic(payload, chat)
    if workflow == "idea.decide":
        return await decide(payload, chat)
    if workflow == "idea.refine":
        return await refine(payload, chat)
    raise ValueError(f"Unsupported Idea Studio workflow: {workflow}")
