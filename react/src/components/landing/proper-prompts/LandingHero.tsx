import { motion, useScroll, useTransform } from 'framer-motion';
import { PROPER_ASSETS } from './assets';
import { useConfigs } from '@/contexts/configs';
import { Button } from '@/components/ui/button';

export function LandingHero() {
  const { scrollY } = useScroll();
  const { setShowLoginDialog } = useConfigs();
  
  // Parallax effects
  const bgY = useTransform(scrollY, [0, 1000], [0, 300]);
  const textY = useTransform(scrollY, [0, 1000], [0, 150]);
  const charY = useTransform(scrollY, [0, 1000], [0, -100]); // Moves up slightly or stays pinned while bg moves
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <section className="relative h-[120vh] w-full overflow-hidden bg-[#87CEEB]">
      {/* 1. Background Layer (Sky) */}
      <motion.div 
        style={{ y: bgY }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={PROPER_ASSETS.hero.background} 
          alt="Sky Background" 
          className="w-full h-full object-cover"
        />
        {/* Cloud overlay for depth if needed */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20" />
      </motion.div>

      {/* 2. Massive Text Layer (Behind Character) */}
      <motion.div 
        style={{ y: textY, opacity }}
        className="absolute inset-0 z-10 flex flex-col items-center pt-32 md:pt-48 pointer-events-none"
      >
        <h1 className="font-heading text-[12vw] leading-[0.85] text-proper-red uppercase text-center drop-shadow-xl tracking-tighter">
          KUPURI
          <br />
          STUDIOS
        </h1>
        <div className="flex items-center gap-4 mt-4">
          <span className="bg-white text-black px-2 py-1 text-xs font-bold uppercase tracking-widest">
            Est. 2025
          </span>
          <span className="text-white font-bold tracking-widest text-sm uppercase drop-shadow-md">
            The Infinite Canvas
          </span>
        </div>
      </motion.div>

      {/* 3. Character Layer (The Dragon) */}
      <motion.div 
        style={{ y: charY }}
        className="absolute inset-0 z-20 flex items-end justify-center pb-20 md:pb-0 pointer-events-none"
      >
        <img 
          src={PROPER_ASSETS.hero.character} 
          alt="Kupuri Mascot" 
          className="h-[60vh] md:h-[85vh] object-contain drop-shadow-2xl"
        />
      </motion.div>

      {/* 4. Foreground Content (CTA) */}
      <div className="absolute bottom-32 left-0 right-0 z-30 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h2 className="font-heading text-4xl md:text-6xl text-proper-red uppercase mb-6 tracking-tight drop-shadow-sm">
            Your Copy & Paste
            <br />
            <span className="text-white drop-shadow-md">Generative AI Studio</span>
          </h2>
          
          <p className="max-w-xl mx-auto text-slate-900 font-medium mb-8 text-lg md:text-xl leading-relaxed bg-white/50 backdrop-blur-sm p-4 rounded-xl">
            Stop struggling with prompts. Build, iterate, and generate professional assets in seconds.
          </p>

          <Button 
            size="lg" 
            onClick={() => setShowLoginDialog(true)}
            className="rounded-none bg-proper-red text-white hover:bg-black text-xl px-10 py-8 uppercase font-bold tracking-wider shadow-xl hover:shadow-2xl transition-all"
          >
            Start Creating Free
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
