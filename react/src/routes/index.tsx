import { createCanvas } from '@/api/canvas'
import ChatTextarea from '@/components/chat/ChatTextarea'
import CanvasList from '@/components/home/CanvasList'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useConfigs } from '@/contexts/configs'
import { DEFAULT_SYSTEM_PROMPT } from '@/constants'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { nanoid } from 'nanoid'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import TopMenu from '@/components/TopMenu'
import { Hero } from '@/components/landing/Hero'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setInitCanvas } = useConfigs()

  const { mutate: createCanvasMutation, isPending } = useMutation({
    mutationFn: createCanvas,
    onSuccess: (data, variables) => {
      setInitCanvas(true)
      navigate({
        to: '/canvas/$id',
        params: { id: data.id },
        search: {
          sessionId: variables.session_id,
        },
      })
    },
    onError: (error) => {
      toast.error(t('common:messages.error'), {
        description: error.message,
      })
    },
  })

  return (
    <div className='flex flex-col h-screen bg-slate-950'>
      <ScrollArea className='h-full'>
        <TopMenu />

        <Hero 
          title={t('home:title')} 
          subtitle={t('home:subtitle')}
        >
          <ChatTextarea
            className='w-full shadow-2xl border-slate-700/50 bg-slate-900/80 backdrop-blur-md hover:border-slate-600/50 transition-colors'
            messages={[]}
            onSendMessages={(messages, configs) => {
              createCanvasMutation({
                name: t('home:newCanvas'),
                canvas_id: nanoid(),
                messages: messages,
                session_id: nanoid(),
                text_model: configs.textModel,
                tool_list: configs.toolList,
                system_prompt: localStorage.getItem('system_prompt') || DEFAULT_SYSTEM_PROMPT,
              })
            }}
            pending={isPending}
          />
        </Hero>

        <div className="container mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-8 text-slate-200">{t('home:allProjects')}</h2>
          <CanvasList />
        </div>
      </ScrollArea>
    </div>
  )
}
