import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, ImageIcon, LayoutTemplate, MessageSquarePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

interface CanvasEmptyStateProps {
  onAction: (action: string) => void
}

export default function CanvasEmptyState({ onAction }: CanvasEmptyStateProps) {
  const { t } = useTranslation()

  const actions = [
    {
      id: 'chat',
      title: t('canvas.emptyState.newChat', 'New Chat'),
      description: t('canvas.emptyState.newChatDesc', 'Start a conversation with AI'),
      icon: MessageSquarePlus,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'generate',
      title: t('canvas.emptyState.generateImage', 'Generate Image'),
      description: t('canvas.emptyState.generateImageDesc', 'Create visuals from text'),
      icon: ImageIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      id: 'templates',
      title: t('canvas.emptyState.browseTemplates', 'Browse Templates'),
      description: t('canvas.emptyState.browseTemplatesDesc', 'Start from a pre-made layout'),
      icon: LayoutTemplate,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      id: 'agent',
      title: t('canvas.emptyState.agent', 'Agent Assistant'),
      description: t('canvas.emptyState.agentDesc', 'Let an agent help you build'),
      icon: Bot,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ]

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-auto"
      >
        <Card className="w-[600px] shadow-2xl border-border/50 bg-background/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {t('canvas.emptyState.title', 'Welcome to Kupuri Studio')}
            </CardTitle>
            <CardDescription className="text-lg">
              {t('canvas.emptyState.subtitle', 'What would you like to create today?')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 p-6">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto flex flex-col items-start p-4 gap-3 hover:border-primary/50 hover:bg-accent/50 transition-all group"
                onClick={() => onAction(action.id)}
              >
                <div className={`p-2 rounded-lg ${action.bgColor} ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-base">{action.title}</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    {action.description}
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
          <CardFooter className="justify-center pb-6">
            <Button variant="ghost" size="sm" onClick={() => onAction('dismiss')}>
              {t('canvas.emptyState.dismiss', 'Start with a blank canvas')}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
