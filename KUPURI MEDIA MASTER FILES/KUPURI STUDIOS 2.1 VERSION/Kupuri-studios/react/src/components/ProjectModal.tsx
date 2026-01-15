'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'

export function ProjectModal({ project, onClose, isOpen }: any) {
  const modalRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleEscape = (e: any) => {
    if (e.key === 'Escape') onClose()
  }

  useEffect(() => {
    if (isOpen) window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  if (!project) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl z-50 bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[90vh]">
              {/* Hero Image */}
              <motion.div
                className="relative w-full h-64 md:h-96"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <img
                  src={project.imageSrc}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Content */}
              <motion.div
                className="p-8 md:p-12"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 id="modal-title" className="text-4xl font-bold text-white mb-4">
                  {project.title}
                </h2>

                <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                  {project.description}
                </p>

                {/* Tech Stack */}
                {project.technologies && (
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Technologies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech: string) => (
                        <motion.span
                          key={tech}
                          whileHover={{ scale: 1.05 }}
                          className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30"
                        >
                          {tech}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Open Live Site
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </motion.a>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ProjectModal
