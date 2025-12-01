import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ChevronLeft, Home } from 'lucide-react'

export function NotFound() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-proper-red/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center px-6 max-w-2xl"
      >
        {/* Floating 404 */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="mb-8"
        >
          <div className="text-9xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-proper-red to-purple-500 select-none">
            404
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl md:text-5xl font-heading font-bold mb-4 uppercase tracking-tight"
        >
          {t('error:notFound.title', 'Lost in the Canvas')}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed"
        >
          {t(
            'error:notFound.description',
            "This page doesn't exist, but your creativity does. Let's get you back to creating."
          )}
        </motion.p>

        {/* Floating canvas illustration */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="mb-12 text-6xl"
        >
          🎨
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            onClick={() => navigate({ to: '/' })}
            className="rounded-none bg-proper-red text-white hover:bg-red-700 text-lg px-8 py-6 font-bold uppercase tracking-wider flex items-center gap-2 group transition-all"
          >
            <Home className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            {t('error:notFound.home', 'Go Home')}
          </Button>

          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="rounded-none border-2 border-white text-white hover:bg-white hover:text-black text-lg px-8 py-6 font-bold uppercase tracking-wider flex items-center gap-2 group transition-all"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            {t('error:notFound.back', 'Go Back')}
          </Button>
        </motion.div>

        {/* Fun easter egg text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-sm text-slate-500 mt-12 italic"
        >
          {t('error:notFound.easter', 'Pro tip: Try creating something instead!')}
        </motion.p>
      </motion.div>

      {/* Bottom accent line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-proper-red to-transparent"
      />
    </div>
  )
}
