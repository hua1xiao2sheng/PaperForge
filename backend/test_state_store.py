from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

try:
    from .state_store import IdeaStudioStateStore, apply_workflow_result, empty_state
except ImportError:
    from state_store import IdeaStudioStateStore, apply_workflow_result, empty_state


class IdeaStudioStateStoreTests(unittest.TestCase):
    def test_round_trip_workspace_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = Path(tmp) / "state.sqlite3"
            store = IdeaStudioStateStore(str(db))
            state = empty_state()
            state["brief"]["researchGoal"] = "database agent"
            state["findings"] = [
                {
                    "id": "f1",
                    "kind": "constraint",
                    "statement": "No online DB environment",
                    "evidence": "user constraint",
                    "conditions": "current project",
                    "source": "human",
                }
            ]
            store.put("default", state)
            loaded = store.get("default")
            self.assertEqual(loaded["brief"]["researchGoal"], "database agent")
            self.assertEqual(loaded["findings"][0]["id"], "f1")

    def test_discovery_merges_candidate_and_messages(self):
        state = empty_state()
        state["candidates"] = [{"id": "old", "title": "Old route"}]
        request = {
            "researchBrief": {"researchGoal": "database agents"},
            "messages": [
                {
                    "id": "u1",
                    "role": "user",
                    "content": "I have workflow graphs",
                    "createdAt": "2026-01-01T00:00:00Z",
                }
            ],
            "instruction": "I have workflow graphs",
        }
        result = {
            "assistantMessage": "Try a data-driven route.",
            "briefPatch": {"assets": "workflow graphs"},
            "candidates": [{"id": "new", "title": "New route"}],
            "searchQueries": ["database agent workflow prior work"],
            "controller": {"action": "search-more", "rationale": "Need closest work"},
        }
        merged = apply_workflow_result(state, "idea.discover", request, result)
        self.assertEqual(merged["brief"]["researchGoal"], "database agents")
        self.assertEqual(merged["brief"]["assets"], "workflow graphs")
        self.assertEqual({x["id"] for x in merged["candidates"]}, {"old", "new"})
        self.assertEqual(merged["messages"][-1]["role"], "assistant")
        self.assertEqual(merged["decision"]["action"], "search-more")

    def test_critic_replaces_only_same_candidate(self):
        state = empty_state()
        state["critiques"] = [
            {"id": "a-old", "candidateId": "a", "summary": "old"},
            {"id": "b-old", "candidateId": "b", "summary": "keep"},
        ]
        request = {"candidate": {"id": "a"}}
        result = {
            "critiques": [
                {"id": "a-new", "candidateId": "a", "summary": "new"}
            ]
        }
        merged = apply_workflow_result(state, "idea.critic", request, result)
        ids = {x["id"] for x in merged["critiques"]}
        self.assertEqual(ids, {"a-new", "b-old"})

    def test_refine_replaces_candidate_version_without_losing_others(self):
        state = empty_state()
        state["candidates"] = [
            {"id": "a", "version": 1, "title": "A"},
            {"id": "b", "version": 1, "title": "B"},
        ]
        result = {"candidate": {"id": "a", "version": 2, "title": "A2"}}
        merged = apply_workflow_result(state, "idea.refine", {}, result)
        by_id = {x["id"]: x for x in merged["candidates"]}
        self.assertEqual(by_id["a"]["version"], 2)
        self.assertEqual(by_id["a"]["title"], "A2")
        self.assertEqual(by_id["b"]["title"], "B")


if __name__ == "__main__":
    unittest.main()
