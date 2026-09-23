export type AIWorkflow =
  | 'idea.analyze'
  | 'idea.council'
  | 'idea.discover'
  | 'idea.critic'
  | 'idea.decide'
  | 'idea.refine'
  | 'literature.plan'
  | 'literature.synthesize'
  | 'section.analyze'
  | 'section.rewrite'
  | 'review.paper'
  | 'review.synthesize'

export interface AIRequest {
  workflow: AIWorkflow
  venue: string
  section?: string
  ideaSpec?: unknown
  draft?: string
  evidence?: unknown[]
  instruction?: string
  researchBrief?: unknown
  candidates?: unknown[]
  candidate?: unknown
  critiques?: unknown[]
  findings?: unknown[]
  messages?: unknown[]
}

export interface AIResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
  provider?: string
  model?: string
}

/**
 * Frontend contract for an optional server-side AI gateway.
 *
 * Real provider keys must stay on the server. If VITE_AI_BACKEND_URL is empty,
 * PaperForge keeps working with the deterministic local research engine.
 */
export async function callPaperForgeAI<T>(payload: AIRequest): Promise<AIResponse<T> | null> {
  const base = import.meta.env.VITE_AI_BACKEND_URL as string | undefined
  if (!base) return null

  try {
    const response = await fetch(base.replace(/\/$/, '') + '/v1/workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      return { ok:false, error:'AI backend returned HTTP ' + response.status }
    }
    return await response.json() as AIResponse<T>
  } catch (error) {
    return { ok:false, error:error instanceof Error ? error.message : 'Unknown AI backend error' }
  }
}
