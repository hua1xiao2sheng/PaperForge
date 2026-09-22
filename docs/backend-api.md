# PaperForge AI Backend Contract

The frontend keeps model-provider credentials off the client.

Set:

```bash
VITE_AI_BACKEND_URL=http://localhost:8000
```

PaperForge will use:

```http
POST /v1/workflow
Content-Type: application/json
```

Example request:

```json
{
  "workflow": "section.analyze",
  "venue": "SIGMOD",
  "section": "Introduction",
  "ideaSpec": {},
  "draft": "..."
}
```

Supported workflow names:

- `idea.analyze`
- `idea.council`
- `literature.plan`
- `literature.synthesize`
- `section.analyze`
- `section.rewrite`
- `review.paper`
- `review.synthesize`

Response:

```json
{
  "ok": true,
  "provider": "openai",
  "model": "example-model",
  "data": {}
}
```

The backend should:

1. store API keys only server-side;
2. validate structured outputs;
3. keep provider/model metadata for reproducibility;
4. log prompt-template version, not secrets;
5. make citation-bearing claims traceable to evidence IDs;
6. run council voices independently before synthesis;
7. preserve dissent instead of forcing agreement.
