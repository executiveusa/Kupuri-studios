import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Star } from 'lucide-react';

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
    <section className="relative w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 overflow-hidden pt-24">
      {/* Animated background glow - light mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-purple-300/10 rounded-full blur-3xl"
          animate={{ x: [0, 100, -50, 0], y: [0, -100, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl"
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
        {/* Beta badge with Lucide icon */}
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-900 text-sm font-semibold border border-purple-300 cursor-pointer hover:bg-purple-200 transition-colors">
            <Star className="w-4 h-4" />
            Beta
          </span>
        </motion.div>

        {/* Title - light mode gradient */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 mb-4"
        >
          {title || 'Kupuri Studios'}
        </motion.h1>

        {/* Subtitle - slate-600 for light mode readability */}
        <motion.p variants={itemVariants} className="text-xl md:text-2xl text-slate-600 mb-8">
          {subtitle || 'AI Creative Canvas Platform'}
        </motion.p>

        {/* Children (e.g., ChatTextarea) */}
        <motion.div variants={itemVariants} className="mb-8">
          {children}
        </motion.div>

        {/* Scroll indicator - use Lucide ArrowDown icon */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mt-12"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowDown className="w-6 h-6 text-slate-600" />
        </motion.div>
      </motion.div>
    </section>
  );
}

export default HeroSection;
