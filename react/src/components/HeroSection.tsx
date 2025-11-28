'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function HeroSection({ title, subtitle }: { title?: string; subtitle?: string } = {}) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, damping: 25, stiffness: 100 },
    },
  }

  return (
    <motion.section
      className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Animated Background Elements */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: [0.43, 0.13, 0.23, 0.96] }}
      />

      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: [0.43, 0.13, 0.23, 0.96] }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-4 md:px-8"
        variants={containerVariants}
      >
        <motion.div
          variants={itemVariants}
          className="mb-6 inline-block"
        >
          <span className="px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium">
            ✨ Welcome to Kupuri Studios
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
        >
          Create Without
          <br />
          <motion.span
            className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ['0%', '100%', '0%'],
            }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            Limitations
          </motion.span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          AI-powered design canvas. Generate, edit, and publish stunning content instantly.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Start Free
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 border-2 border-gray-400 hover:border-white text-white font-semibold rounded-xl transition-colors"
          >
            Watch Demo
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </motion.div>

      {/* Parallax Effect */}
      <motion.div
        style={{ y: scrollY * 0.5 }}
        className="absolute inset-0 pointer-events-none"
      />
    </motion.section>
  )
}

export default HeroSection
