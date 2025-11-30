import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useConfigs } from '@/contexts/configs';
import { useNavigate } from '@tanstack/react-router';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export function LandingNavbar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { setShowLoginDialog } = useConfigs();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setScrolled(latest > 50);
  });

  return (
    <motion.nav
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md border-b border-black/5 py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-heading uppercase tracking-tighter ${scrolled ? 'text-proper-red' : 'text-white drop-shadow-md'}`}>
            KS.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <button 
            onClick={() => navigate({ to: '/canvas/new' })}
            className={`text-sm font-bold uppercase tracking-widest hover:opacity-70 transition-opacity hidden sm:block ${scrolled ? 'text-black' : 'text-white drop-shadow-md'}`}
          >
            {t('landing.enterStudio', 'Enter Studio')}
          </button>
          <Button 
            size="sm" 
            onClick={() => navigate({ to: '/canvas/new' })}
            className={`rounded-none font-bold uppercase tracking-wider px-6 ${
              scrolled 
                ? 'bg-proper-red text-white hover:bg-black' 
                : 'bg-white text-proper-red hover:bg-black hover:text-white'
            }`}
          >
            {t('landing.getAccess', 'Get Access')}
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
