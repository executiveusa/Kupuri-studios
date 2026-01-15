import CanvasExcali from '@/components/canvas/CanvasExcali'
import CanvasHeader from '@/components/canvas/CanvasHeader'
import CanvasMenu from '@/components/canvas/menu'
import CanvasPopbarWrapper from '@/components/canvas/pop-bar'
import ChatInterface from '@/components/chat/Chat'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { CanvasProvider } from '@/contexts/canvas'
import { Session } from '@/types/types'
import { createFileRoute, useParams, useSearch, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { nanoid } from 'nanoid'
import CanvasEmptyState from '@/components/canvas/CanvasEmptyState'

// Mock data types for testing
interface MockCanvasData {
  data: Record<string, unknown>
  name: string
  sessions: Session[]
}

export const Route = createFileRoute('/canvas/$id')({
  component: Canvas,
})

function Canvas() {
  const { id } = useParams({ from: '/canvas/$id' })
  const navigate = useNavigate()
  const [canvas, setCanvas] = useState<MockCanvasData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [canvasName, setCanvasName] = useState('')
  const [sessionList, setSessionList] = useState<Session[]>([])
  const [showEmptyState, setShowEmptyState] = useState(false)
  const isMobile = useIsMobile()

  const search = useSearch({ from: '/canvas/$id' }) as {
    sessionId: string
  }
  const searchSessionId = search?.sessionId || ''

  useEffect(() => {
    let mounted = true

    // Handle "new" canvas creation redirect
    if (id === 'new') {
      const newId = nanoid()
      navigate({ to: '/canvas/$id', params: { id: newId }, replace: true })
      return
    }

    const fetchCanvas = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Simulate API call for now
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Mock canvas data
        const mockData: MockCanvasData = {
          data: {
            nodes: [
              {
                id: '1',
                type: 'text',
                position: { x: 100, y: 100 },
                data: { label: 'Start Here' },
              },
            ],
            edges: [],
          },
          name: `Canvas ${id}`,
          sessions: [
            {
              id: 'session-1',
              model: 'gpt-3.5-turbo',
              provider: 'openai',
              title: 'Welcome Session',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        }

        if (mounted) {
          setCanvas(mockData)
          setCanvasName(mockData.name)
          setSessionList(mockData.sessions)
          setShowEmptyState(false)
        }
      } catch (err) {
        if (mounted) {
          console.warn('Failed to fetch canvas data, initializing empty state:', err)
          setCanvas(null)
          setCanvasName('Untitled Canvas')
          setSessionList([])
          setShowEmptyState(true)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchCanvas()

    return () => {
      mounted = false
    }
  }, [id, navigate])

  const handleNameSave = async () => {
    // Simulate API call for now
    await new Promise((resolve) => setTimeout(resolve, 300))
    console.log('Canvas name saved:', canvasName)
  }

  const handleEmptyStateAction = (action: string) => {
    setShowEmptyState(false)
  }

  return (
    <CanvasProvider>
      <div className='relative flex flex-col w-screen h-screen overflow-hidden'>
        {/* Floating Header - Absolute positioned over canvas */}
        <CanvasHeader
          canvasName={canvasName}
          canvasId={id}
          onNameChange={setCanvasName}
          onNameSave={handleNameSave}
        />

        {/* Main Canvas Area */}
        {isMobile ? (
          // Mobile: Full-screen canvas, chat in sheet (triggered from CanvasToolMenu)
          <div className='w-full h-full'>
            {isLoading ? (
              <div className='flex items-center justify-center h-full bg-background'>
                <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
              </div>
            ) : (
              <div className='relative w-full h-full'>
                {showEmptyState && <CanvasEmptyState onAction={handleEmptyStateAction} />}
                <CanvasExcali canvasId={id} initialData={canvas?.data} />
                <CanvasMenu
                  canvasId={id}
                  sessionList={sessionList}
                  setSessionList={setSessionList}
                  sessionId={searchSessionId}
                />
                <CanvasPopbarWrapper />
              </div>
            )}
          </div>
        ) : (
          // Desktop: Resizable panels
          <ResizablePanelGroup
            direction='horizontal'
            className='w-screen h-screen'
            autoSaveId='jaaz-chat-panel'
          >
            <ResizablePanel className='relative' defaultSize={75}>
              <div className='w-full h-full'>
                {isLoading ? (
                  <div className='flex items-center justify-center h-full bg-background'>
                    <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
                  </div>
                ) : (
                  <div className='relative w-full h-full'>
                    {showEmptyState && <CanvasEmptyState onAction={handleEmptyStateAction} />}
                    <CanvasExcali canvasId={id} initialData={canvas?.data} />
                    <CanvasMenu />
                    <CanvasPopbarWrapper />
                  </div>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={25}>
              <div className='flex-1 flex-grow bg-accent/50 w-full h-full'>
                <ChatInterface
                  canvasId={id}
                  sessionList={sessionList}
                  setSessionList={setSessionList}
                  sessionId={searchSessionId}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </CanvasProvider>
  )
}
