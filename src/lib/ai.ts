export type ProviderId = 'OpenAI' | 'Anthropic' | 'Gemini' | 'DeepSeek' | 'OpenRouter'

export interface AIConfig {
  provider: ProviderId
  model: string
  apiKey: string
  baseUrl?: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export const providerDefaults: Record<ProviderId, { model: string; hint: string }> = {
  OpenAI: { model: 'gpt-5.6', hint: 'OpenAI Responses-compatible account; browser calls may depend on CORS/account policy.' },
  Anthropic: { model: 'claude-sonnet-4-5', hint: 'Direct browser use may be blocked by provider CORS. A backend proxy is recommended.' },
  Gemini: { model: 'gemini-2.5-pro', hint: 'Uses the Google Generative Language REST endpoint.' },
  DeepSeek: { model: 'deepseek-chat', hint: 'Uses the OpenAI-compatible chat endpoint.' },
  OpenRouter: { model: 'openai/gpt-5.6', hint: 'OpenAI-compatible endpoint with OpenRouter routing.' },
}

function joinMessages(messages: ChatMessage[]) {
  return messages.map((m) => '[' + m.role.toUpperCase() + ']\n' + m.content).join('\n\n')
}

export async function callModel(config: AIConfig, messages: ChatMessage[]): Promise<string> {
  if (!config.apiKey.trim()) {
    throw new Error('No API key configured. Add a key in API Settings or use the offline analysis mode.')
  }

  const system = messages.find((m) => m.role === 'system')?.content || ''
  const nonSystem = messages.filter((m) => m.role !== 'system')

  if (config.provider === 'Gemini') {
    const endpoint =
      (config.baseUrl?.trim() || 'https://generativelanguage.googleapis.com/v1beta') +
      '/models/' +
      encodeURIComponent(config.model) +
      ':generateContent?key=' +
      encodeURIComponent(config.apiKey)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: system ? { parts: [{ text: system }] } : undefined,
        contents: nonSystem.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { temperature: 0.2 },
      }),
    })

    if (!response.ok) {
      throw new Error('Gemini request failed: ' + response.status + ' ' + (await response.text()).slice(0, 240))
    }
    const data = await response.json()
    return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
  }

  if (config.provider === 'Anthropic') {
    const endpoint = config.baseUrl?.trim() || 'https://api.anthropic.com/v1/messages'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 2600,
        temperature: 0.2,
        system,
        messages: nonSystem.map((m) => ({ role: m.role, content: m.content })),
      }),
    })
    if (!response.ok) {
      throw new Error('Anthropic request failed: ' + response.status + ' ' + (await response.text()).slice(0, 240))
    }
    const data = await response.json()
    return data?.content?.map((x: any) => x.text || '').join('') || ''
  }

  const endpoints: Record<'OpenAI' | 'DeepSeek' | 'OpenRouter', string> = {
    OpenAI: 'https://api.openai.com/v1/chat/completions',
    DeepSeek: 'https://api.deepseek.com/chat/completions',
    OpenRouter: 'https://openrouter.ai/api/v1/chat/completions',
  }

  const endpoint =
    config.baseUrl?.trim() ||
    endpoints[config.provider as 'OpenAI' | 'DeepSeek' | 'OpenRouter']

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + config.apiKey,
  }
  if (config.provider === 'OpenRouter') {
    headers['HTTP-Referer'] = window.location.origin
    headers['X-Title'] = 'PaperForge'
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    throw new Error(config.provider + ' request failed: ' + response.status + ' ' + (await response.text()).slice(0, 240))
  }
  const data = await response.json()
  return data?.choices?.[0]?.message?.content || joinMessages(messages)
}

export function readSessionAIConfig(): AIConfig {
  try {
    const raw = sessionStorage.getItem('paperforge:ai-config')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        provider: parsed.provider || 'OpenAI',
        model: parsed.model || providerDefaults.OpenAI.model,
        apiKey: parsed.apiKey || '',
        baseUrl: parsed.baseUrl || '',
      }
    }
  } catch {
    // ignore malformed session state
  }
  return { provider: 'OpenAI', model: providerDefaults.OpenAI.model, apiKey: '', baseUrl: '' }
}

export function writeSessionAIConfig(config: AIConfig) {
  sessionStorage.setItem('paperforge:ai-config', JSON.stringify(config))
}
