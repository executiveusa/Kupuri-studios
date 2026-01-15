import { motion, useScroll, useTransform } from 'framer-motion';
import { useState } from 'react';
import { PROPER_ASSETS } from './assets';
import { useConfigs } from '@/contexts/configs';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Sparkles, TrendingUp, Zap } from 'lucide-react';

type Niche = 'ugc' | 'documentary' | 'anime';

export function LandingHero() {
  const { scrollY } = useScroll();
  const { setShowLoginDialog } = useConfigs();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeNiche, setActiveNiche] = useState<Niche>('ugc');
  
  // Parallax effects
  const bgY = useTransform(scrollY, [0, 1000], [0, 300]);
  const textY = useTransform(scrollY, [0, 1000], [0, 150]);
  const charY = useTransform(scrollY, [0, 1000], [0, -100]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  const nicheContent = {
    ugc: {
      headline: t('home.hero.ugc.headline', 'Stop Paying Design Teams $5K Per Episode'),
      subheadline: t('home.hero.ugc.subheadline', 'Create professional anime, documentaries, and social content in hours, not weeks.'),
      socialProof: t('home.hero.ugc.socialProof', 'Used by 847+ creators in Mexico City'),
      cta: t('home.hero.ugc.cta', 'Try It Free - No Design Skills Needed'),
      icon: TrendingUp,
    },
    documentary: {
      headline: t('home.hero.documentary.headline', 'Tu Equipo de Producción Completo por $29/mes'),
      subheadline: t('home.hero.documentary.subheadline', 'Crea storyboards, arte conceptual y material B-roll con IA. Sin diseñadores freelance.'),
      socialProof: t('home.hero.documentary.socialProof', 'Más de 500 documentalistas ya lo usan en LATAM'),
      cta: t('home.hero.documentary.cta', 'Empieza Gratis - Sin Tarjeta'),
      icon: Sparkles,
    },
    anime: {
      headline: t('home.hero.anime.headline', 'Character Consistency. Finally Solved.'),
      subheadline: t('home.hero.anime.subheadline', 'Generate 100+ consistent frames per hour. From rough concept to production-ready storyboards.'),
      socialProof: t('home.hero.anime.socialProof', '12,000+ storyboard frames created this month'),
      cta: t('home.hero.anime.cta', 'See It Work - 60 Second Demo'),
      icon: Zap,
    },
  };

  const currentContent = nicheContent[activeNiche];
  const IconComponent = currentContent.icon;

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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20" />
      </motion.div>

      {/* 2. Massive Text Layer (Behind Character) */}
      <motion.div 
        style={{ y: textY, opacity }}
        className="absolute inset-0 z-10 flex flex-col items-center pt-32 md:pt-48 pointer-events-none"
      >
        <h1 className="font-heading text-[clamp(2rem,12vw,5rem)] leading-[0.85] text-proper-red uppercase text-center drop-shadow-xl tracking-tighter">
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

      {/* 4. Niche Selector Pills (Top Right) */}
      <div className="absolute top-24 right-6 z-40 hidden md:flex flex-col gap-2">
        {(['ugc', 'documentary', 'anime'] as Niche[]).map((niche) => (
          <button
            key={niche}
            onClick={() => setActiveNiche(niche)}
            className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
              activeNiche === niche
                ? 'bg-proper-red text-white shadow-xl scale-105'
                : 'bg-white/80 text-slate-800 hover:bg-white hover:scale-102'
            }`}
          >
            {niche === 'ugc' && 'UGC Creators'}
            {niche === 'documentary' && 'Documentary'}
            {niche === 'anime' && 'Anime/Comics'}
          </button>
        ))}
      </div>

      {/* 5. Foreground Content (Pain-Driven CTA) */}
      <div className="absolute bottom-32 left-0 right-0 z-30 text-center px-6">
        <motion.div
          key={activeNiche}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Pain Point Headline */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <IconComponent className="w-8 h-8 text-proper-red drop-shadow-md" />
            <h2 className="font-heading text-3xl md:text-5xl text-proper-red uppercase tracking-tight drop-shadow-sm">
              {currentContent.headline}
            </h2>
          </div>
          
          {/* Value Prop */}
          <p className="max-w-2xl mx-auto text-slate-900 font-bold mb-4 text-xl md:text-2xl leading-relaxed bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-2xl">
            {currentContent.subheadline}
          </p>

          {/* Social Proof Badge */}
          <div className="inline-flex items-center gap-2 bg-white/90 px-6 py-3 rounded-full mb-8 shadow-xl">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-proper-red to-pink-500 border-2 border-white" />
              ))}
            </div>
            <span className="text-sm font-bold text-slate-800">
              {currentContent.socialProof}
            </span>
          </div>

          {/* Primary CTA */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate({ to: '/canvas/$id', params: { id: 'new' } })}
              className="rounded-none bg-proper-red text-white hover:bg-black text-xl px-12 py-8 uppercase font-bold tracking-wider shadow-xl hover:shadow-2xl transition-all"
            >
              {currentContent.cta}
            </Button>
            
            {/* Secondary CTA - Interactive Demo */}
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => {
                const demoSection = document.getElementById('interactive-demo');
                demoSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-none border-2 border-white bg-white/80 text-slate-900 hover:bg-white text-lg px-8 py-8 font-bold tracking-wider shadow-xl backdrop-blur-sm"
            >
              See 60-Second Demo ↓
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-white/90 text-sm font-medium drop-shadow-md">
            <span>✓ No Credit Card</span>
            <span>✓ 100% Free Tier</span>
            <span>✓ Export HD Instantly</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


