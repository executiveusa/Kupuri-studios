import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import CanvasExport from './CanvasExport'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Settings } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useConfigs } from '@/contexts/configs'
import { UserMenu } from '../auth/UserMenu'
import ThemeButton from '../theme/ThemeButton'

type CanvasHeaderProps = {
  canvasName: string
  canvasId: string
  onNameChange: (name: string) => void
  onNameSave: () => void
}

const CanvasHeader: React.FC<CanvasHeaderProps> = ({
  canvasName,
  canvasId,
  onNameChange,
  onNameSave,
}) => {
  const navigate = useNavigate()
  const { setShowSettingsDialog } = useConfigs()

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-4 py-2 bg-background/30 backdrop-blur-md border border-white/10 rounded-xl shadow-xl"
    >
      {/* Left: Back Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/' })}
          className="hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Center: Canvas Name */}
      <Input
        className="text-sm font-medium text-center bg-transparent border-none shadow-none w-fit max-w-md h-8 hover:bg-white/5 focus:bg-white/10 transition-all rounded-lg px-4"
        value={canvasName}
        onChange={(e) => onNameChange(e.target.value)}
        onBlur={onNameSave}
        placeholder="Untitled Canvas"
      />

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <CanvasExport />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettingsDialog(true)}
          className="hover:bg-white/10"
        >
          <Settings className="w-4 h-4" />
        </Button>
        <ThemeButton />
        <UserMenu />
      </div>
    </motion.div>
  )
}

export default CanvasHeader
