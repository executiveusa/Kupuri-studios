import { Button } from '@/components/ui/button'
import { Hotkey } from '@/components/ui/hotkey'
import { useCanvas } from '@/contexts/canvas'
import { eventBus, TCanvasAddImagesToChatEvent } from '@/lib/event'
import { useKeyPress } from 'ahooks'
import { motion } from 'motion/react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { exportToCanvas } from "@excalidraw/excalidraw";
import { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import { toast } from 'sonner'

type CanvasMagicGeneratorProps = {
    selectedImages: TCanvasAddImagesToChatEvent
    selectedElements: OrderedExcalidrawElement[]
}

const CanvasMagicGenerator = ({ selectedImages, selectedElements }: CanvasMagicGeneratorProps) => {
    const { t } = useTranslation()
    const { excalidrawAPI } = useCanvas()

    const handleMagicGenerate = async () => {
        if (!excalidrawAPI) return;

        // 获取选中的元素
        const appState = excalidrawAPI.getAppState();
        const selectedIds = appState.selectedElementIds;
        if (Object.keys(selectedIds).length === 0) {
            console.log('没有选中任何元素');
            return;
        }

        const files = excalidrawAPI.getFiles();

        // 使用官方SDK导出canvas
        const canvas = await exportToCanvas({
            elements: selectedElements,
            appState: {
                ...appState,
                selectedElementIds: selectedIds,
            },
            files,
            mimeType: 'image/png',
            maxWidthOrHeight: 2048,
            quality: 1,
        });

        // 转base64
        const base64 = canvas.toDataURL('image/png', 0.8);

        // Calculate position for ghost element (center of viewport)
        const viewportWidth = appState.width
        const viewportHeight = appState.height
        const ghostWidth = 512
        const ghostHeight = 512
        
        // Position in scene coordinates (center of current viewport)
        const ghostX = -appState.scrollX / appState.zoom.value + (viewportWidth / 2 - ghostWidth / 2) / appState.zoom.value
        const ghostY = -appState.scrollY / appState.zoom.value + (viewportHeight / 2 - ghostHeight / 2) / appState.zoom.value

        const ghostId = `ghost-${Date.now()}`

        // Emit ghost element creation event FIRST
        eventBus.emit('Canvas::GenerationStarted', {
            ghostId,
            canvasId: window.location.pathname.split('/').pop() || '',
            prompt: 'Magic generation in progress...',
            x: ghostX,
            y: ghostY,
            width: ghostWidth,
            height: ghostHeight,
        })

        // 发送魔法生成事件
        eventBus.emit('Canvas::MagicGenerate', {
            fileId: ghostId, // Use same ID so we can replace the ghost
            base64: base64,
            width: canvas.width,
            height: canvas.height,
            timestamp: new Date().toISOString(),
        });

        // 清除选中状态
        excalidrawAPI?.updateScene({
            appState: { selectedElementIds: {} },
        })
    }

    useKeyPress(['meta.b', 'ctrl.b'], handleMagicGenerate)

    return (
        <Button variant="ghost" size="sm" onClick={handleMagicGenerate}>
            {t('canvas:popbar.magicGenerate')} <Hotkey keys={['⌘', 'B']} />
        </Button>
    )
}

export default memo(CanvasMagicGenerator)
