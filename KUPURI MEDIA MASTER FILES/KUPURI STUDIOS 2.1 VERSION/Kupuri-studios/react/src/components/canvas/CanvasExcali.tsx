import { saveCanvas } from '@/api/canvas'
import { useCanvas } from '@/contexts/canvas'
import useDebounce from '@/hooks/use-debounce'
import { useTheme } from '@/hooks/use-theme'
import { eventBus } from '@/lib/event'
import * as ISocket from '@/types/socket'
import { CanvasData } from '@/types/types'
import { Excalidraw, convertToExcalidrawElements } from '@excalidraw/excalidraw'
import {
  ExcalidrawImageElement,
  ExcalidrawEmbeddableElement,
  OrderedExcalidrawElement,
  Theme,
  NonDeleted,
} from '@excalidraw/excalidraw/element/types'
import '@excalidraw/excalidraw/index.css'
import {
  AppState,
  BinaryFileData,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { VideoElement } from './VideoElement'
import { GhostElementOverlay } from './GhostElementOverlay'
import { AnimatePresence } from 'framer-motion'

import '@/assets/style/canvas.css'

type LastImagePosition = {
  x: number
  y: number
  width: number
  height: number
  col: number // col index
}

type CanvasExcaliProps = {
  canvasId: string
  initialData?: ExcalidrawInitialDataState
}

interface GhostElementData {
  id: string
  prompt?: string
  sceneX: number
  sceneY: number
  width: number
  height: number
}

const CanvasExcali: React.FC<CanvasExcaliProps> = ({
  canvasId,
  initialData,
}) => {
  const { excalidrawAPI, setExcalidrawAPI } = useCanvas()
  const { i18n } = useTranslation()
  const [ghostElements, setGhostElements] = useState<Map<string, GhostElementData>>(new Map())

  // Immediate handler for UI updates (no debounce)
  const handleSelectionChange = (
    elements: Readonly<OrderedExcalidrawElement[]>,
    appState: AppState
  ) => {
    if (!appState) return

    // Check if any selected element is embeddable type
    const selectedElements = elements.filter((element) => 
      appState.selectedElementIds[element.id]
    )
    const hasEmbeddableSelected = selectedElements.some(
      (element) => element.type === 'embeddable'
    )

    // Toggle CSS class to hide/show left panel immediately
    const excalidrawContainer = document.querySelector('.excalidraw')
    if (excalidrawContainer) {
      if (hasEmbeddableSelected) {
        excalidrawContainer.classList.add('hide-left-panel')
      } else {
        excalidrawContainer.classList.remove('hide-left-panel')
      }
    }
  }

  // Debounced handler for saving (performance optimization)
  const handleSave = useDebounce(
    (
      elements: Readonly<OrderedExcalidrawElement[]>,
      appState: AppState,
      files: BinaryFiles
    ) => {
      if (elements.length === 0 || !appState) {
        return
      }

      const data: CanvasData = {
        elements,
        appState: {
          ...appState,
          collaborators: undefined!,
        },
        files,
      }

      let thumbnail = ''
      const latestImage = elements
        .filter((element) => element.type === 'image')
        .sort((a, b) => b.updated - a.updated)[0]
      if (latestImage) {
        const file = files[latestImage.fileId!]
        if (file) {
          thumbnail = file.dataURL
        }
      }

      saveCanvas(canvasId, { data, thumbnail })
    },
    1000
  )

  // Combined handler that calls both immediate and debounced functions
  const handleChange = (
    elements: Readonly<OrderedExcalidrawElement[]>,
    appState: AppState,
    files: BinaryFiles
  ) => {
    // Immediate UI updates
    handleSelectionChange(elements, appState)
    // Debounced save operation
    handleSave(elements, appState, files)
  }

  const lastImagePosition = useRef<LastImagePosition | null>(
    localStorage.getItem('excalidraw-last-image-position')
      ? JSON.parse(localStorage.getItem('excalidraw-last-image-position')!)
      : null
  )
  const { theme } = useTheme()

  const excalidrawClassName = `excalidraw-custom ${theme === 'dark' ? 'excalidraw-dark-fix' : ''}`
  const customTheme = theme === 'dark' ? 'light' : theme
  
  useEffect(() => {
    if (excalidrawAPI && theme === 'dark') {
      excalidrawAPI.updateScene({
        appState: {
          viewBackgroundColor: '#121212',
          gridColor: 'rgba(255, 255, 255, 0.1)',
        }
      })
    } else if (excalidrawAPI && theme === 'light') {
      excalidrawAPI.updateScene({
        appState: {
          viewBackgroundColor: '#ffffff',
          gridColor: 'rgba(0, 0, 0, 0.1)',
        }
      })
    }
  }, [excalidrawAPI, theme])

  // Handle generation started - create ghost placeholder
  const handleGenerationStarted = useCallback((event: typeof eventBus extends { emit: (event: infer E, ...args: any[]) => any } ? E extends 'Canvas::GenerationStarted' ? Parameters<typeof eventBus.emit>[1] : never : never) => {
    if (event.canvasId !== canvasId || !excalidrawAPI) return

    console.log('👻 Generation started, creating ghost element:', event)

    // Create a locked placeholder image element in the scene
    const ghostImageElement = convertToExcalidrawElements([
      {
        type: 'image',
        id: event.ghostId,
        x: event.x,
        y: event.y,
        width: event.width,
        height: event.height,
        fileId: 'ghost-placeholder', // Dummy fileId
        status: 'pending',
        locked: true, // Lock it so user can't delete it
        strokeColor: '#D00000',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 2,
        strokeStyle: 'dashed',
        roundness: null,
        roughness: 0,
        opacity: 50,
        angle: 0,
        seed: Math.random(),
        version: 1,
        versionNonce: Math.random(),
        isDeleted: false,
        groupIds: [],
        boundElements: [],
        updated: Date.now(),
        frameId: null,
        index: null,
        customData: { isGhost: true, prompt: event.prompt },
      },
    ])[0] as ExcalidrawImageElement

    const currentElements = excalidrawAPI.getSceneElements()
    excalidrawAPI.updateScene({
      elements: [...currentElements, ghostImageElement],
    })

    // Track this ghost for overlay rendering
    setGhostElements(prev => new Map(prev).set(event.ghostId, {
      id: event.ghostId,
      prompt: event.prompt,
      sceneX: event.x,
      sceneY: event.y,
      width: event.width,
      height: event.height,
    }))
  }, [canvasId, excalidrawAPI])

  const addImageToExcalidraw = useCallback(
    async (imageElement: ExcalidrawImageElement, file: BinaryFileData) => {
      if (!excalidrawAPI) return

      const currentElements = excalidrawAPI.getSceneElements()

      // Check if this is replacing a ghost element
      const isReplacingGhost = ghostElements.has(imageElement.id)
      
      if (isReplacingGhost) {
        console.log('👻 Replacing ghost element with real image:', imageElement.id)
        // Remove the ghost from our tracking
        setGhostElements(prev => {
          const next = new Map(prev)
          next.delete(imageElement.id)
          return next
        })
        
        // Remove the ghost placeholder from scene
        const filteredElements = currentElements.filter(el => el.id !== imageElement.id)
        
        excalidrawAPI.addFiles([file])

        const unlockedImageElement = {
          ...imageElement,
          locked: false,
          groupIds: [],
          isDeleted: false,
        }

        excalidrawAPI.updateScene({
          elements: [...filteredElements, unlockedImageElement],
        })
      } else {
        // Normal image addition (not replacing ghost)
        excalidrawAPI.addFiles([file])

        console.log('👇 Adding new image element to canvas:', imageElement.id)

        const unlockedImageElement = {
          ...imageElement,
          locked: false,
          groupIds: [],
          isDeleted: false,
        }

        excalidrawAPI.updateScene({
          elements: [...currentElements, unlockedImageElement],
        })
      }

      localStorage.setItem(
        'excalidraw-last-image-position',
        JSON.stringify(lastImagePosition.current)
      )
    },
    [excalidrawAPI, ghostElements]
  )

  const addVideoEmbed = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (elementData: any, videoSrc: string) => {
      if (!excalidrawAPI) return

      // Function to create video element with given dimensions
      const createVideoElement = (finalWidth: number, finalHeight: number) => {
        console.log('👇 Video element properties:', {
          id: elementData.id,
          type: elementData.type,
          x: elementData.x,
          y: elementData.y,
          width: elementData.width,
          height: elementData.height,
        })

        const videoElements = convertToExcalidrawElements([
          {
            type: 'embeddable',
            id: elementData.id,
            x: elementData.x,
            y: elementData.y,
            width: elementData.width,
            height: elementData.height,
            link: videoSrc,
            strokeColor: '#000000',
            backgroundColor: 'transparent',
            fillStyle: 'solid',
            strokeWidth: 1,
            strokeStyle: 'solid',
            roundness: null,
            roughness: 1,
            opacity: 100,
            angle: 0,
            seed: Math.random(),
            version: 1,
            versionNonce: Math.random(),
            locked: false,
            isDeleted: false,
            groupIds: [],
            boundElements: [],
            updated: Date.now(),
            frameId: null,
            index: null,
            customData: {},
          },
        ])

        const currentElements = excalidrawAPI.getSceneElements()
        const newElements = [...currentElements, ...videoElements]

        excalidrawAPI.updateScene({
          elements: newElements,
        })

        console.log(
          '👇 Added video embed element:',
          videoSrc,
          `${elementData.width}x${elementData.height}`
        )
      }

      if (elementData.width && elementData.height) {
        createVideoElement(elementData.width, elementData.height)
        return
      }

      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'

      video.onloadedmetadata = () => {
        const videoWidth = video.videoWidth
        const videoHeight = video.videoHeight

        if (videoWidth && videoHeight) {
          const maxWidth = 800
          let finalWidth = videoWidth
          let finalHeight = videoHeight

          if (videoWidth > maxWidth) {
            const scale = maxWidth / videoWidth
            finalWidth = maxWidth
            finalHeight = videoHeight * scale
          }

          createVideoElement(finalWidth, finalHeight)
        } else {
          createVideoElement(320, 180)
        }
      }

      video.onerror = () => {
        console.warn('Could not load video metadata, using default dimensions')
        createVideoElement(320, 180)
      }

      video.src = videoSrc
    },
    [excalidrawAPI]
  )

  const renderEmbeddable = useCallback(
    (element: NonDeleted<ExcalidrawEmbeddableElement>, appState: AppState) => {
      const { link } = element

      if (
        link &&
        (link.includes('.mp4') ||
          link.includes('.webm') ||
          link.includes('.ogg') ||
          link.startsWith('blob:') ||
          link.includes('video'))
      ) {
        return (
          <VideoElement
            src={link}
            width={element.width}
            height={element.height}
          />
        )
      }

      return null
    },
    []
  )

  const handleImageGenerated = useCallback(
    (imageData: ISocket.SessionImageGeneratedEvent) => {
      console.log('👇 CanvasExcali received image_generated:', imageData)

      if (imageData.canvas_id !== canvasId) {
        console.log('👇 Image not for this canvas, ignoring')
        return
      }

      if (imageData.file?.mimeType?.startsWith('video/')) {
        console.log(
          '👇 This appears to be a video, not an image. Ignoring in image handler.'
        )
        return
      }

      addImageToExcalidraw(imageData.element, imageData.file)
    },
    [addImageToExcalidraw, canvasId]
  )

  const handleVideoGenerated = useCallback(
    (videoData: ISocket.SessionVideoGeneratedEvent) => {
      console.log('👇 CanvasExcali received video_generated:', videoData)

      if (videoData.canvas_id !== canvasId) {
        console.log('👇 Video not for this canvas, ignoring')
        return
      }

      addVideoEmbed(videoData.element, videoData.video_url)
    },
    [addVideoEmbed, canvasId]
  )

  useEffect(() => {
    eventBus.on('Socket::Session::ImageGenerated', handleImageGenerated)
    eventBus.on('Socket::Session::VideoGenerated', handleVideoGenerated)
    eventBus.on('Canvas::GenerationStarted', handleGenerationStarted)
    return () => {
      eventBus.off('Socket::Session::ImageGenerated', handleImageGenerated)
      eventBus.off('Socket::Session::VideoGenerated', handleVideoGenerated)
      eventBus.off('Canvas::GenerationStarted', handleGenerationStarted)
    }
  }, [handleImageGenerated, handleVideoGenerated, handleGenerationStarted])

  // Render ghost overlays synced to canvas coordinates
  const renderGhostOverlays = () => {
    if (!excalidrawAPI || ghostElements.size === 0) return null

    const appState = excalidrawAPI.getAppState()
    const zoom = appState.zoom.value

    return (
      <AnimatePresence>
        {Array.from(ghostElements.values()).map((ghost) => {
          // Convert scene coordinates to viewport coordinates
          const viewportX = ghost.sceneX * zoom + appState.scrollX
          const viewportY = ghost.sceneY * zoom + appState.scrollY
          const viewportWidth = ghost.width * zoom
          const viewportHeight = ghost.height * zoom

          return (
            <GhostElementOverlay
              key={ghost.id}
              x={viewportX}
              y={viewportY}
              width={viewportWidth}
              height={viewportHeight}
              prompt={ghost.prompt}
            />
          )
        })}
      </AnimatePresence>
    )
  }

  return (
    <div className="relative w-full h-full">
      <Excalidraw
        theme={customTheme as Theme}
        langCode={i18n.language}
        className={excalidrawClassName}
        excalidrawAPI={(api) => {
          setExcalidrawAPI(api)
        }}
        onChange={handleChange}
        initialData={() => {
          const data = initialData
          console.log('👇initialData', data)
          if (data?.appState) {
            data.appState = {
              ...data.appState,
              collaborators: undefined!,
            }
          }
          return data || null
        }}
        renderEmbeddable={renderEmbeddable}
        validateEmbeddable={(url: string) => {
          console.log('👇 Validating embeddable URL:', url)
          return true
        }}
        viewModeEnabled={false}
        zenModeEnabled={false}
        onPointerUpdate={(payload) => {
          if (payload.button === 'down' && Math.random() < 0.05) {
            // Minimal logging
          }
        }}
      />
      {renderGhostOverlays()}
    </div>
  )
}

export { CanvasExcali }
export default CanvasExcali
