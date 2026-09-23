from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any


def empty_state() -> dict[str, Any]:
    return {
        "brief": {
            "researchGoal": "",
            "assets": "",
            "constraints": "",
            "priorWork": "",
            "targetOutcome": "",
        },
        "messages": [],
        "candidates": [],
        "critiques": [],
        "findings": [],
        "searchQueries": [],
        "decision": None,
    }


class IdeaStudioStateStore:
    def __init__(self, db_path: str | None = None):
        raw = db_path or os.getenv("PAPERFORGE_STATE_DB", "")
        path = Path(raw).expanduser() if raw else Path(__file__).with_name("paperforge-state.sqlite3")
        path.parent.mkdir(parents=True, exist_ok=True)
        self.path = path
        self._lock = Lock()
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path, timeout=15)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS idea_studio_state (
                    workspace_id TEXT PRIMARY KEY,
                    payload TEXT NOT NULL,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.commit()

    def get(self, workspace_id: str) -> dict[str, Any]:
        with self._lock, self._connect() as conn:
            row = conn.execute(
                "SELECT payload FROM idea_studio_state WHERE workspace_id = ?",
                (workspace_id,),
            ).fetchone()
        if not row:
            return empty_state()
        try:
            payload = json.loads(row["payload"])
        except json.JSONDecodeError:
            return empty_state()
        base = empty_state()
        if isinstance(payload, dict):
            base.update(payload)
            if isinstance(payload.get("brief"), dict):
                base["brief"] = {**empty_state()["brief"], **payload["brief"]}
        return base

    def put(self, workspace_id: str, state: dict[str, Any]) -> dict[str, Any]:
        normalized = empty_state()
        normalized.update(state if isinstance(state, dict) else {})
        if isinstance(state.get("brief"), dict):
            normalized["brief"] = {**empty_state()["brief"], **state["brief"]}
        data = json.dumps(normalized, ensure_ascii=False)
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT INTO idea_studio_state(workspace_id, payload, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(workspace_id) DO UPDATE SET
                    payload = excluded.payload,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (workspace_id, data),
            )
            conn.commit()
        return normalized


def merge_candidates(current: list[dict[str, Any]], incoming: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result = {str(item.get("id")): item for item in current if isinstance(item, dict) and item.get("id")}
    for item in incoming:
        if isinstance(item, dict) and item.get("id"):
            result[str(item["id"])] = item
    return list(result.values())


def apply_workflow_result(
    state: dict[str, Any],
    workflow: str,
    request: dict[str, Any],
    result: dict[str, Any],
) -> dict[str, Any]:
    next_state = {**empty_state(), **state}
    next_state["brief"] = {**empty_state()["brief"], **(state.get("brief") or {})}

    # Explicit request state is authoritative when the user supplies it from the UI.
    if isinstance(request.get("researchBrief"), dict):
        next_state["brief"].update(request["researchBrief"])
    for key in ("candidates", "critiques", "findings", "messages"):
        if isinstance(request.get(key), list):
            next_state[key] = request[key]

    if workflow == "idea.discover":
        brief_patch = result.get("briefPatch")
        if isinstance(brief_patch, dict):
            next_state["brief"].update(brief_patch)
        candidates = result.get("candidates")
        if isinstance(candidates, list):
            next_state["candidates"] = merge_candidates(next_state.get("candidates") or [], candidates)
        queries = result.get("searchQueries")
        if isinstance(queries, list):
            next_state["searchQueries"] = queries
        controller = result.get("controller")
        if isinstance(controller, dict):
            next_state["decision"] = controller

        instruction = request.get("instruction")
        messages = list(next_state.get("messages") or [])
        if isinstance(instruction, str) and instruction.strip():
            if not messages or messages[-1].get("content") != instruction:
                messages.append(
                    {
                        "id": f"remote-user-{len(messages) + 1}",
                        "role": "user",
                        "content": instruction,
                        "createdAt": datetime.now(timezone.utc).isoformat(),
                    }
                )
        assistant = result.get("assistantMessage")
        if isinstance(assistant, str) and assistant.strip():
            messages.append(
                {
                    "id": f"remote-assistant-{len(messages) + 1}",
                    "role": "assistant",
                    "content": assistant,
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                }
            )
        next_state["messages"] = messages[-100:]

    elif workflow == "idea.critic":
        candidate = request.get("candidate") or {}
        candidate_id = candidate.get("id")
        incoming = result.get("critiques")
        if candidate_id and isinstance(incoming, list):
            existing = [
                item
                for item in (next_state.get("critiques") or [])
                if item.get("candidateId") != candidate_id
            ]
            next_state["critiques"] = existing + incoming

    elif workflow == "idea.decide":
        if isinstance(result.get("decision"), dict):
            next_state["decision"] = result["decision"]

    elif workflow == "idea.refine":
        candidate = result.get("candidate")
        if isinstance(candidate, dict):
            next_state["candidates"] = merge_candidates(
                next_state.get("candidates") or [],
                [candidate],
            )

    return next_state
