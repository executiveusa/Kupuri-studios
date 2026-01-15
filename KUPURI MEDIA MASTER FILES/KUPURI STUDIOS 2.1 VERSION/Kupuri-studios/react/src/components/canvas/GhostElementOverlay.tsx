import { motion } from 'framer-motion'

interface GhostElementOverlayProps {
  x: number
  y: number
  width: number
  height: number
  prompt?: string
}

export function GhostElementOverlay({ x, y, width, height, prompt }: GhostElementOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
      className="rounded-lg overflow-hidden border-2 border-proper-red/50"
    >
      {/* Shimmer Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black">
        <motion.div
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{
            width: '50%',
          }}
        />
      </div>

      {/* Pulsing Glow */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 bg-proper-red/10 blur-xl"
      />

      {/* Loading Indicator */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-proper-red/30 border-t-proper-red rounded-full"
        />
        {prompt && (
          <div className="text-center max-w-[80%]">
            <p className="text-xs text-white/60 font-mono line-clamp-2">
              {prompt}
            </p>
          </div>
        )}
      </div>

      {/* Corner Badge */}
      <div className="absolute top-2 right-2 bg-proper-red/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white uppercase tracking-wider">
        Generating...
      </div>
    </motion.div>
  )
}
