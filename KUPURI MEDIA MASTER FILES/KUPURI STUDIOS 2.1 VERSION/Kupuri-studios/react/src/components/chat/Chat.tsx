import Blur from '@/components/common/Blur'
import { ScrollArea } from '@/components/ui/scroll-area'
import { eventBus, TEvents } from '@/lib/event'
import ChatMagicGenerator from './ChatMagicGenerator'
import { AssistantMessage, Message, Model, PendingType, Session } from '@/types/types'
import { useSearch } from '@tanstack/react-router'
import { produce } from 'immer'
import { motion } from 'motion/react'
import { nanoid } from 'nanoid'
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhotoProvider } from 'react-photo-view'
import { toast } from 'sonner'
import ShinyText from '../ui/shiny-text'
import ChatTextarea from './ChatTextarea'
import MessageRegular from './Message/Regular'
import { ToolCallContent } from './Message/ToolCallContent'
import ToolCallTag from './Message/ToolCallTag'
import SessionSelector from './SessionSelector'
import ChatSpinner from './Spinner'
import ToolcallProgressUpdate from './ToolcallProgressUpdate'
import ShareTemplateDialog from './ShareTemplateDialog'
import CostAlert from './CostAlert'

import { useConfigs } from '@/contexts/configs'
import { useSocket } from '@/contexts/socket'
import 'react-photo-view/dist/react-photo-view.css'
import { DEFAULT_SYSTEM_PROMPT } from '@/constants'
import { ModelInfo, ToolInfo } from '@/api/model'
import { Button } from '@/components/ui/button'
import { Share2, Circle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import MixedContent, { MixedContentImages, MixedContentText } from './Message/MixedContent'
import { BASE_API_URL } from '@/constants'

type ChatInterfaceProps = {
  canvasId: string
  sessionList: Session[]
  setSessionList: Dispatch<SetStateAction<Session[]>>
  sessionId: string
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  canvasId,
  sessionList,
  setSessionList,
  sessionId: searchSessionId,
}) => {
  const { t } = useTranslation()
  const [session, setSession] = useState<Session | null>(null)
  const { initCanvas, setInitCanvas } = useConfigs()
  const { authStatus } = useAuth()
  const { connected: socketConnected } = useSocket()
  const [showShareDialog, setShowShareDialog] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (sessionList.length > 0) {
      let _session = null
      if (searchSessionId) {
        _session = sessionList.find((s) => s.id === searchSessionId) || null
      } else {
        _session = sessionList[0]
      }
      setSession(_session)
    } else {
      setSession(null)
    }
  }, [sessionList, searchSessionId])

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI assistant. How can I help you today?",
    },
  ])
  const [pending, setPending] = useState<PendingType>(initCanvas ? 'text' : false)
  const mergedToolCallIds = useRef<string[]>([])

  const sessionId = session?.id ?? searchSessionId

  const sessionIdRef = useRef<string>(session?.id || nanoid())
  const [expandingToolCalls, setExpandingToolCalls] = useState<string[]>([])
  const [pendingToolConfirmations, setPendingToolConfirmations] = useState<string[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(false)

  const scrollToBottom = useCallback(() => {
    if (!isAtBottomRef.current) {
      return
    }
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current!.scrollHeight,
        behavior: 'smooth',
      })
    }, 200)
  }, [])

  const mergeToolCallResult = (messages: Message[]) => {
    const messagesWithToolCallResult = messages.map((message) => {
      if (message.role === 'assistant' && message.tool_calls) {
        for (const toolCall of message.tool_calls) {
          toolCall.result = 'Mock result: This would be the actual tool call result'
          mergedToolCallIds.current.push(toolCall.id)
        }
      }
      return message
    })

    return messagesWithToolCallResult
  }

  const initChat = useCallback(async () => {
    if (!sessionId) {
      return
    }

    sessionIdRef.current = sessionId

    // Simulate API call for now
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Mock initial messages
    const mockMessages: Message[] = [
      {
        role: 'assistant',
        content: "Hello! I'm your AI assistant. How can I help you today?",
      },
    ]

    setMessages(mergeToolCallResult(mockMessages))
    if (mockMessages.length > 0) {
      setInitCanvas(false)
    }

    scrollToBottom()
  }, [sessionId, scrollToBottom, setInitCanvas])

  useEffect(() => {
    initChat()
  }, [sessionId, initChat])

  const onSelectSession = (sessionId: string) => {
    setSession(sessionList.find((s) => s.id === sessionId) || null)
    window.history.pushState({}, '', `/canvas/${canvasId}?sessionId=${sessionId}`)
  }

  const onClickNewChat = () => {
    const newSession: Session = {
      id: nanoid(),
      title: t('chat:newChat', 'New Chat'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      model: session?.model || 'gpt-4o',
      provider: session?.provider || 'openai',
    }

    setSessionList((prev) => [...prev, newSession])
    onSelectSession(newSession.id)
  }

  const onSendMessages = useCallback(
    (data: Message[], configs: { textModel: Model; toolList: ToolInfo[] }) => {
      setPending('text')
      setMessages(data)

      // Simulate API call for now
      setTimeout(() => {
        const mockResponse: Message = {
          role: 'assistant',
          content:
            'This is a mock response to your message. In a real application, this would be generated by the AI model.',
        }
        setMessages((prev) => [...prev, mockResponse])
        setPending(false)
        scrollToBottom()
      }, 1500)

      if (searchSessionId !== sessionId) {
        window.history.pushState({}, '', `/canvas/${canvasId}?sessionId=${sessionId}`)
      }

      scrollToBottom()
    },
    [canvasId, sessionId, searchSessionId, scrollToBottom]
  )

  const handleCancelChat = useCallback(() => {
    setPending(false)
  }, [])

  return (
    <PhotoProvider>
      <div className='flex flex-col h-screen relative'>
        {/* Chat messages */}

        <header className='flex items-center px-2 py-2 absolute top-0 z-1 w-full'>
          <div className='flex-1 min-w-0'>
            <SessionSelector
              session={session}
              sessionList={sessionList}
              onClickNewChat={onClickNewChat}
              onSelectSession={onSelectSession}
            />
          </div>

          {/* Connection Status Indicator */}
          <div className='flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-slate-900/50'>
            <Circle
              size={8}
              className={`fill-current ${socketConnected ? 'text-green-500' : 'text-red-500'}`}
            />
            <span
              className={`text-xs font-medium ${
                socketConnected ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {socketConnected
                ? t('chat.connected', 'Connected')
                : t('chat.disconnected', 'Disconnected')}
            </span>
          </div>

          <Blur className='absolute top-0 left-0 right-0 h-full -z-1' />
        </header>

        {/* Cost Alert Banner */}
        <div className='absolute top-14 left-0 right-0 z-10 px-4'>
          <CostAlert budgetLimit={50} />
        </div>

        <ScrollArea className='h-[calc(100vh-45px)]' viewportRef={scrollRef}>
          {messages.length > 0 ? (
            <div className='flex flex-col flex-1 px-4 pb-50 pt-15'>
              {/* Messages */}
              {messages.map((message, idx) => (
                <div key={`${idx}`} className='flex flex-col gap-4 mb-2'>
                  {/* Regular message content */}
                  {typeof message.content == 'string' &&
                    (message.role !== 'tool' ? (
                      <MessageRegular message={message} content={message.content} />
                    ) : message.tool_call_id &&
                      mergedToolCallIds.current.includes(message.tool_call_id) ? (
                      <></>
                    ) : (
                      <ToolCallContent expandingToolCalls={expandingToolCalls} message={message} />
                    ))}

                  {/* 混合内容消息的文本部分 - 显示在聊天框内 */}
                  {Array.isArray(message.content) && (
                    <>
                      <MixedContentImages contents={message.content} />
                      <MixedContentText message={message} contents={message.content} />
                    </>
                  )}

                  {message.role === 'assistant' &&
                    message.tool_calls &&
                    message.tool_calls.at(-1)?.function.name != 'finish' &&
                    message.tool_calls.map((toolCall, i) => {
                      return (
                        <ToolCallTag
                          key={toolCall.id}
                          toolCall={toolCall}
                          isExpanded={expandingToolCalls.includes(toolCall.id)}
                          onToggleExpand={() => {
                            if (expandingToolCalls.includes(toolCall.id)) {
                              setExpandingToolCalls((prev) =>
                                prev.filter((id) => id !== toolCall.id)
                              )
                            } else {
                              setExpandingToolCalls((prev) => [...prev, toolCall.id])
                            }
                          }}
                          requiresConfirmation={pendingToolConfirmations.includes(toolCall.id)}
                          onConfirm={() => {
                            console.log('Tool confirmed:', toolCall.id)
                            // Simulate tool confirmation
                            setTimeout(() => {
                              setPending(false)
                              scrollToBottom()
                            }, 1000)
                          }}
                          onCancel={() => {
                            console.log('Tool cancelled:', toolCall.id)
                            setPending(false)
                            scrollToBottom()
                          }}
                        />
                      )
                    })}
                </div>
              ))}
              {pending && <ChatSpinner pending={pending} />}
              {pending && sessionId && <ToolcallProgressUpdate sessionId={sessionId} />}
            </div>
          ) : (
            <motion.div className='flex flex-col h-full p-4 items-start justify-start pt-16 select-none'>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className='text-muted-foreground text-3xl'
              >
                <ShinyText text='Hello, Jaaz!' />
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className='text-muted-foreground text-2xl'
              >
                <ShinyText text='How can I help you today?' />
              </motion.span>
            </motion.div>
          )}
        </ScrollArea>

        <div className='p-2 gap-2 sticky bottom-0'>
          <ChatTextarea
            sessionId={sessionId!}
            pending={!!pending}
            messages={messages}
            onSendMessages={onSendMessages}
            onCancelChat={handleCancelChat}
          />

          {/* 魔法生成组件 */}
          <ChatMagicGenerator
            sessionId={sessionId || ''}
            canvasId={canvasId}
            messages={messages}
            setMessages={setMessages}
            setPending={setPending}
            scrollToBottom={scrollToBottom}
          />
        </div>
      </div>

      {/* Share Template Dialog */}
      <ShareTemplateDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        canvasId={canvasId}
        sessionId={sessionId || ''}
        messages={messages}
      />

      {/* API Status Notice */}
      <div className='absolute bottom-20 left-4 right-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 z-20'>
        <p className='font-semibold mb-1'>🔧 Chat API Status</p>
        <p>Currently using mock responses. Real APIs will be connected later.</p>
      </div>
    </PhotoProvider>
  )
}

export default ChatInterface
