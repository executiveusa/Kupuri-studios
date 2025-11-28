'use client'

import Image from 'next/image'
import { useState } from 'react'
import { motion } from 'framer-motion'

export function ProjectCard({ project, onClick }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
      aria-label={`View project: ${project.title}`}
      className="group relative h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-xl cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/50"
    >
      {/* Background Image with Blur-Up */}
      <motion.div
        className="absolute inset-0"
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Image
          src={project.imageSrc}
          alt={project.title}
          fill
          className={`object-cover transition-all duration-500 ${imageLoaded ? 'blur-0' : 'blur-lg'}`}
          onLoadingComplete={() => setImageLoaded(true)}
          placeholder="blur"
          blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Crect fill='%23222'/%3E%3C/svg%3E"
        />
      </motion.div>

      {/* Dark Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Content Overlay */}
      <motion.div
        className="absolute inset-0 flex flex-col justify-end p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
          {project.title}
        </h3>
        <p className="text-sm md:text-base text-gray-300 drop-shadow">
          {project.subtitle}
        </p>

        {/* View More Icon - Apple Style */}
        <motion.div
          className="mt-4 inline-flex items-center gap-2 text-blue-400"
          animate={{ opacity: isHovered ? 1 : 0.5, x: isHovered ? 4 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-sm font-semibold">View Project</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Hover Shine Effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0"
          animate={{ x: ['0%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  )
}

export default ProjectCard
