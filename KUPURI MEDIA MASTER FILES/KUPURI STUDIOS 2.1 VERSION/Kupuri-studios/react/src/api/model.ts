import { BASE_API_URL } from '@/constants'

export type ModelInfo = {
  provider: string
  model: string
  type: 'text' | 'image' | 'tool' | 'video'
  url: string
}

export type ToolInfo = {
  provider: string
  id: string
  display_name?: string | null
  type?: 'image' | 'tool' | 'video'
}

export async function listModels(): Promise<{
  llm: ModelInfo[]
  tools: ToolInfo[]
}> {
  const modelsResp = await fetch(`${BASE_API_URL}/api/list_models`)
    .then((res) => res.json())
    .catch((err) => {
      console.error(err)
      return []
    })
  const toolsResp = await fetch(`${BASE_API_URL}/api/list_tools`)
    .then((res) => res.json())
    .catch((err) => {
      console.error(err)
      return []
    })

  return {
    llm: modelsResp,
    tools: toolsResp,
  }
}

// Fetch LiteLLM models dynamically
export async function listLiteLLMModels(): Promise<{
  free_tier: any[]
  vision: any[]
  premium: any[]
  all: any[]
}> {
  try {
    const response = await fetch(`${BASE_API_URL}/api/litellm/models`)
    const data = await response.json()
    
    if (data.status === 'success') {
      return data.models
    }
    
    // Fallback to static list if LiteLLM unavailable
    return {
      free_tier: [],
      vision: [],
      premium: [],
      all: []
    }
  } catch (err) {
    console.error('Failed to fetch LiteLLM models:', err)
    return {
      free_tier: [],
      vision: [],
      premium: [],
      all: []
    }
  }
}

// Get usage stats for cost tracking
export async function getUsageStats(days: number = 7): Promise<any> {
  try {
    const response = await fetch(`${BASE_API_URL}/api/litellm/usage?days=${days}`)
    return await response.json()
  } catch (err) {
    console.error('Failed to fetch usage:', err)
    return { status: 'error', usage: null }
  }
}
