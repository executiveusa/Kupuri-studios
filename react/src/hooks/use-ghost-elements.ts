import { useState, useCallback } from 'react'

export interface GhostElement {
  id: string
  x: number
  y: number
  width: number
  height: number
  prompt?: string
  createdAt: number
}

export function useGhostElements() {
  const [ghostElements, setGhostElements] = useState<Map<string, GhostElement>>(new Map())

  const addGhostElement = useCallback((element: Omit<GhostElement, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID()
    const ghostElement: GhostElement = {
      ...element,
      id,
      createdAt: Date.now(),
    }
    
    setGhostElements(prev => new Map(prev).set(id, ghostElement))
    return id
  }, [])

  const removeGhostElement = useCallback((id: string) => {
    setGhostElements(prev => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const updateGhostElement = useCallback((id: string, updates: Partial<GhostElement>) => {
    setGhostElements(prev => {
      const next = new Map(prev)
      const existing = next.get(id)
      if (existing) {
        next.set(id, { ...existing, ...updates })
      }
      return next
    })
  }, [])

  const clearAllGhosts = useCallback(() => {
    setGhostElements(new Map())
  }, [])

  return {
    ghostElements: Array.from(ghostElements.values()),
    addGhostElement,
    removeGhostElement,
    updateGhostElement,
    clearAllGhosts,
  }
}
