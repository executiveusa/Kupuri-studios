import { Separator } from '@/components/ui/separator'
import { useCanvas } from '@/contexts/canvas'
import { useState } from 'react'
import { motion } from 'framer-motion'
import CanvasMenuButton from './CanvasMenuButton'
import { ToolType } from './CanvasMenuIcon'

const CanvasToolMenu = () => {
  const { excalidrawAPI } = useCanvas()
  const [activeTool, setActiveTool] = useState<ToolType | undefined>(undefined)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const handleToolChange = (tool: ToolType) => {
    excalidrawAPI?.setActiveTool({ type: tool })
  }

  excalidrawAPI?.onChange((_elements, appState, _files) => {
    setActiveTool(appState.activeTool.type as ToolType)
  })

  const tools: (ToolType | null)[] = [
    'hand',
    'selection',
    null,
    'rectangle',
    'ellipse',
    'arrow',
    'line',
    'freedraw',
    null,
    'text',
    'image',
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-background/40 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-white/10"
    >
      {tools.map((tool, index) =>
        tool ? (
          <motion.div
            key={tool}
            onHoverStart={() => setHoveredIndex(index)}
            onHoverEnd={() => setHoveredIndex(null)}
            animate={{
              scale: hoveredIndex === index ? 1.2 : 1,
              y: hoveredIndex === index ? -8 : 0,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <CanvasMenuButton
              type={tool}
              activeTool={activeTool}
              onClick={() => handleToolChange(tool)}
            />
          </motion.div>
        ) : (
          <Separator
            key={index}
            orientation="vertical"
            className="h-8 bg-white/10 mx-1"
          />
        )
      )}
    </motion.div>
  )
}

export default CanvasToolMenu
