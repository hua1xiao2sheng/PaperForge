import json
import os
from typing import Any, Literal

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from .idea_studio import handle_idea_studio
except ImportError:
    from idea_studio import handle_idea_studio

app = FastAPI(title="PaperForge AI Gateway", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("PAPERFORGE_FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Provider = Literal["openai", "deepseek", "openrouter"]

class WorkflowRequest(BaseModel):
    workflow: str
    venue: str
    section: str | None = None
    ideaSpec: dict[str, Any] | None = None
    draft: str | None = None
    evidence: list[dict[str, Any]] | None = None
    instruction: str | None = None
    researchBrief: dict[str, Any] | None = None
    candidates: list[dict[str, Any]] | None = None
    candidate: dict[str, Any] | None = None
    critiques: list[dict[str, Any]] | None = None
    findings: list[dict[str, Any]] | None = None
    messages: list[dict[str, Any]] | None = None

ROLE_PROMPTS = {
    "AI Scientist": "Focus on falsifiable novelty, feasibility, experimental design, baselines and failure modes.",
    "STORM / Co-STORM": "Generate missing perspectives and follow-up questions; broaden understanding before narrowing.",
    "GPT Researcher": "Decompose the research question and demand multi-source evidence, including contradictory evidence.",
    "PaperQA": "Audit whether every novelty claim is grounded in traceable scientific evidence and citations.",
    "Scientific Agent Skills": "Audit reproducibility, procedural clarity, inputs, tools, outputs, versions and stop conditions.",
}

def provider_config() -> tuple[Provider, str, str, str]:
    provider = os.getenv("PAPERFORGE_PROVIDER", "openai").lower()
    if provider not in {"openai", "deepseek", "openrouter"}:
        raise HTTPException(500, "Unsupported PAPERFORGE_PROVIDER")
    model = os.getenv("PAPERFORGE_MODEL", "gpt-4.1-mini")
    if provider == "openai":
        base = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        key = os.getenv("OPENAI_API_KEY", "")
    elif provider == "deepseek":
        base = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        key = os.getenv("DEEPSEEK_API_KEY", "")
    else:
        base = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        key = os.getenv("OPENROUTER_API_KEY", "")
    if not key:
        raise HTTPException(503, f"Missing API key for {provider}")
    return provider, model, base.rstrip("/"), key

async def chat(system: str, user: str, temperature: float = 0.2) -> str:
    provider, model, base, key = provider_config()
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    if provider == "openrouter":
        headers["HTTP-Referer"] = os.getenv("PAPERFORGE_SITE_URL", "http://localhost")
        headers["X-Title"] = "PaperForge"
    payload = {
        "model": model,
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(f"{base}/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
    return data["choices"][0]["message"]["content"]

def parse_json(text: str) -> Any:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    return json.loads(text)

async def council(req: WorkflowRequest) -> dict[str, Any]:
    independent = []
    idea = (req.ideaSpec or {}).get("rawIdea") or json.dumps(req.ideaSpec or {}, ensure_ascii=False)
    for source, focus in ROLE_PROMPTS.items():
        system = (
            f"You are the {source} spokesperson inside a research innovation council. "
            f"{focus} Be skeptical, concrete and non-promotional. "
            "Return strict JSON with keys verdict, headline, points. verdict must be support, challenge, or conditional."
        )
        user = f"Target venue: {req.venue}\nResearch idea:\n{idea}\n\nEvaluate independently. Do not assume other reviewers agree."
        try:
            result = parse_json(await chat(system, user))
        except Exception as exc:
            result = {
                "verdict": "conditional",
                "headline": f"{source} could not complete a structured review.",
                "points": [str(exc)],
            }
        independent.append({
            "id": source.lower().replace(" ", "-").replace("/", "-"),
            "source": source,
            "role": focus.split(".")[0],
            **result,
        })

    moderator_system = (
        "You are an area-chair-style moderator. Do not average opinions. "
        "Preserve minority objections and only call something consensus when objections are explicitly resolved. "
        "Return strict JSON with keys consensus, disagreements, nextActions, confidence. "
        "confidence must be low, medium, or high."
    )
    moderator_user = json.dumps({
        "venue": req.venue,
        "idea": idea,
        "reviews": independent,
        "instruction": req.instruction,
    }, ensure_ascii=False)
    synthesis = parse_json(await chat(moderator_system, moderator_user))
    return {"voices": independent, **synthesis}

async def section_analyze(req: WorkflowRequest) -> dict[str, Any]:
    system = (
        "You are a conference-paper section copilot. Be critical and concise. "
        "Return strict JSON with keys structure, critique, alignment; each value is an array of strings. "
        "Check the active section against the paper idea and target venue. Do not invent citations or results."
    )
    user = json.dumps({
        "venue": req.venue,
        "section": req.section,
        "ideaSpec": req.ideaSpec,
        "draft": req.draft,
        "instruction": req.instruction,
    }, ensure_ascii=False)
    return parse_json(await chat(system, user))

async def review_paper(req: WorkflowRequest) -> list[dict[str, Any]]:
    roles = [
        ("Reviewer A", "Novelty & significance"),
        ("Reviewer B", "Technical soundness & experiments"),
        ("Reviewer C", "Clarity & reproducibility"),
    ]
    output = []
    for reviewer, focus in roles:
        system = (
            f"You are {reviewer}, focusing on {focus}. "
            "Review the manuscript independently and objectively. "
            "Return strict JSON with keys strengths, weaknesses, questions, section. "
            "strengths/weaknesses/questions are arrays of strings; section is the section that most needs revision. "
            "Do not fabricate missing experiments or citations."
        )
        user = json.dumps({
            "venue": req.venue,
            "ideaSpec": req.ideaSpec,
            "draft": req.draft,
        }, ensure_ascii=False)
        data = parse_json(await chat(system, user))
        output.append({"reviewer": reviewer, "focus": focus, **data})
    return output

@app.get("/health")
async def health():
    return {"ok": True, "service": "paperforge-ai-gateway"}

@app.post("/v1/workflow")
async def workflow(req: WorkflowRequest):
    try:
        provider, model, _, _ = provider_config()
        if req.workflow in {"idea.discover", "idea.critic", "idea.decide", "idea.refine"}:
            data = await handle_idea_studio(req.workflow, req.model_dump(), chat)
        elif req.workflow == "idea.council":
            data = await council(req)
        elif req.workflow == "section.analyze":
            data = await section_analyze(req)
        elif req.workflow == "review.paper":
            data = await review_paper(req)
        else:
            raise HTTPException(400, f"Workflow not implemented: {req.workflow}")
        return {"ok": True, "provider": provider, "model": model, "data": data}
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        raise HTTPException(exc.response.status_code, exc.response.text[:1000])
    except json.JSONDecodeError as exc:
        raise HTTPException(502, f"Model returned invalid JSON: {exc}")
    except Exception as exc:
        raise HTTPException(500, str(exc))
