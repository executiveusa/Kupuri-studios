import { useState, Dispatch, SetStateAction } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-is-mobile'
import ChatInterface from '@/components/chat/Chat'
import { Session } from '@/types/types'
import CanvasToolMenu from './CanvasToolMenu'
import CanvasViewMenu from './CanvasViewMenu'

interface CanvasMenuProps {
  canvasId?: string
  sessionList?: Session[]
  setSessionList?: Dispatch<SetStateAction<Session[]>>
  sessionId?: string
}

const CanvasMenu = ({ canvasId, sessionList, setSessionList, sessionId }: CanvasMenuProps) => {
  const isMobile = useIsMobile()
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <>
      <CanvasToolMenu />
      <CanvasViewMenu />
      
      {/* Mobile Chat FAB */}
      {isMobile && canvasId && sessionList && setSessionList && (
        <>
          <Button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full bg-proper-red hover:bg-proper-red/90 shadow-2xl"
            size="icon"
            aria-label="Open chat"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>

          <Sheet open={chatOpen} onOpenChange={setChatOpen}>
            <SheetContent side="bottom" className="h-[85vh] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Chat</SheetTitle>
              </SheetHeader>
              <ChatInterface
                canvasId={canvasId}
                sessionList={sessionList}
                setSessionList={setSessionList}
                sessionId={sessionId || ''}
              />
            </SheetContent>
          </Sheet>
        </>
      )}
    </>
  )
}

export default CanvasMenu
