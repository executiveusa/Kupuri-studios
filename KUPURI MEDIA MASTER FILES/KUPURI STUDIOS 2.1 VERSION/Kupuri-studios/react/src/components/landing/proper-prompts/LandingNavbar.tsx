import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useConfigs } from '@/contexts/configs'
import { useNavigate } from '@tanstack/react-router'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'

export function LandingNavbar() {
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { setShowLoginDialog } = useConfigs()
  const navigate = useNavigate({ from: '/' })
  const { t } = useTranslation()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    if (latest > previous && latest > 150) {
      setHidden(true)
    } else {
      setHidden(false)
    }
    setScrolled(latest > 50)
  })

  const handleNavigate = (path: string) => {
    navigate({ to: path })
  }

  return (
    <motion.nav
      variants={{
        visible: { y: 0 },
        hidden: { y: '-100%' },
      }}
      animate={hidden ? 'hidden' : 'visible'}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200/50 py-3 shadow-lg'
          : 'bg-transparent py-6'
      }`}
    >
      <div className='container mx-auto px-6 flex items-center justify-between'>
        {/* Logo */}
        <div className='flex items-center gap-2'>
          <span
            className={`text-2xl font-heading uppercase tracking-tighter ${
              scrolled ? 'text-proper-red drop-shadow-sm' : 'text-white drop-shadow-md'
            }`}
          >
            KS.
          </span>
        </div>

        {/* Desktop Actions */}
        <div className='hidden md:flex items-center gap-4'>
          <LanguageSwitcher />
          <button
            onClick={() => handleNavigate('/agent_studio')}
            className={`text-sm font-bold uppercase tracking-widest hover:opacity-80 transition-opacity ${
              scrolled
                ? 'text-gray-900 hover:text-proper-red'
                : 'text-white drop-shadow-md hover:text-proper-red/80'
            }`}
          >
            {t('landing.enterStudio', 'Enter Studio')}
          </button>
          <Button
            size='sm'
            onClick={() => handleNavigate('/agent_studio')}
            className={`rounded-none font-bold uppercase tracking-wider px-6 transition-all ${
              scrolled
                ? 'bg-proper-red text-white hover:bg-black hover:text-white shadow-md'
                : 'bg-white text-proper-red hover:bg-black/90 hover:text-white shadow-lg'
            }`}
          >
            {t('landing.getAccess', 'Get Access')}
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className='md:hidden flex items-center gap-2'>
          <LanguageSwitcher />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg transition-colors ${
              scrolled ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'
            }`}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`md:hidden ${
            scrolled
              ? 'bg-white border-t border-gray-200'
              : 'bg-black/95 backdrop-blur-md border-t border-white/10'
          }`}
        >
          <div className='container mx-auto px-6 py-4 flex flex-col gap-4'>
            <button
              onClick={() => {
                handleNavigate('/agent_studio')
                setMobileMenuOpen(false)
              }}
              className={`text-left py-3 px-4 rounded-lg font-bold uppercase tracking-widest transition-all ${
                scrolled
                  ? 'text-gray-900 hover:bg-proper-red hover:text-white'
                  : 'text-white hover:bg-white/10 hover:text-proper-red/80'
              }`}
            >
              {t('landing.enterStudio', 'Enter Studio')}
            </button>
            <Button
              size='sm'
              onClick={() => {
                handleNavigate('/agent_studio')
                setMobileMenuOpen(false)
              }}
              className='w-full rounded-none font-bold uppercase tracking-wider bg-proper-red text-white hover:bg-black shadow-md'
            >
              {t('landing.getAccess', 'Get Access')}
            </Button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
