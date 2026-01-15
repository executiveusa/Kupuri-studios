import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { ReactNode } from 'react'

interface HeroProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function Hero({ title, subtitle, children }: HeroProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] w-full overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-glow pointer-events-none" />
      
      {/* Floating Orbs */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0], 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[15%] w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
      />
      
      <motion.div 
        animate={{ 
          y: [0, 20, 0], 
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-20 right-[20%] w-96 h-96 bg-blue-500/15 rounded-full blur-3xl"
      />

      <div className="relative z-10 flex flex-col items-center max-w-5xl mx-auto px-6 text-center">
        {/* Beta Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-700/50 mb-8 backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Kupuri Studios Beta
          </span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-bold tracking-tight mb-6 leading-tight"
        >
          {title}
          <br />
          <span className="text-gradient bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400">
            Unlimited
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-14 leading-relaxed"
        >
          {subtitle}
        </motion.p>

        {/* Chat Input Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-3xl"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
