/**
 * Agent API Client
 * Handles communication with backend for agent CRUD operations
 */

const BASE_API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`

export interface AgentData {
  id?: string
  name: string
  description?: string
  nodes: unknown[]
  edges: unknown[]
  createdAt?: string
  updatedAt?: string
}

export interface AgentResponse {
  id: string
  name: string
  description?: string
  nodes: unknown[]
  edges: unknown[]
  createdAt: string
  updatedAt: string
}

/**
 * Save or update an agent
 */
export async function saveAgent(agent: AgentData): Promise<AgentResponse> {
  try {
    const url = agent.id ? `${BASE_API_URL}/agents/${agent.id}` : `${BASE_API_URL}/agents`
    const method = agent.id ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: agent.name,
        description: agent.description,
        nodes: agent.nodes,
        edges: agent.edges,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save agent: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Save agent error:', error)
    throw error
  }
}

/**
 * Load an agent by ID
 */
export async function loadAgent(id: string): Promise<AgentResponse> {
  try {
    const response = await fetch(`${BASE_API_URL}/agents/${id}`)

    if (!response.ok) {
      throw new Error(`Failed to load agent: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Load agent error:', error)
    throw error
  }
}

/**
 * Delete an agent
 */
export async function deleteAgent(id: string): Promise<void> {
  try {
    const response = await fetch(`${BASE_API_URL}/agents/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to delete agent: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Delete agent error:', error)
    throw error
  }
}

/**
 * List all agents (paginated)
 */
export async function listAgents(
  page: number = 1,
  limit: number = 20
): Promise<{
  agents: AgentResponse[]
  total: number
  page: number
  limit: number
}> {
  try {
    const response = await fetch(`${BASE_API_URL}/agents?page=${page}&limit=${limit}`)

    if (!response.ok) {
      throw new Error(`Failed to list agents: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('List agents error:', error)
    throw error
  }
}

/**
 * Deploy an agent (activate it)
 */
export async function deployAgent(id: string): Promise<AgentResponse> {
  try {
    const response = await fetch(`${BASE_API_URL}/agents/${id}/deploy`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Failed to deploy agent: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Deploy agent error:', error)
    throw error
  }
}
