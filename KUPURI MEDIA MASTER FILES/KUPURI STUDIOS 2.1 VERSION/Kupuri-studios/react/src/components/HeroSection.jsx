import React from 'react';
import { motion } from 'framer-motion';

function HeroSection({ title, subtitle, children }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-accent/20 rounded-full blur-3xl"
          animate={{ x: [0, 100, -50, 0], y: [0, -100, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ x: [0, -100, 50, 0], y: [0, 100, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Beta badge */}
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-semibold border border-accent/50">
            ✨ Beta
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4"
        >
          {title || 'Kupuri Studios'}
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={itemVariants} className="text-xl md:text-2xl text-slate-400 mb-8">
          {subtitle || 'AI Creative Canvas Platform'}
        </motion.p>

        {/* Children (e.g., ChatTextarea) */}
        <motion.div variants={itemVariants} className="mb-8">
          {children}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mt-12"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default HeroSection;
