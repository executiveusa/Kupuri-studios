'use client'

import { motion } from 'framer-motion'
import { useTheme } from '@/providers/ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700" />
      )}
    </motion.button>
  )
}

export default ThemeToggle
