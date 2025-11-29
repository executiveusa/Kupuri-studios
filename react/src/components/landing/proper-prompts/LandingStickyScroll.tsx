import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { PROPER_ASSETS } from './assets';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface StickySectionProps {
  title: string;
  subtitle: string;
  image: string;
  color: string; // Background color class
  textColor?: string;
  index: number;
}

function StickySection({ title, subtitle, image, color, textColor = "text-white", index }: StickySectionProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  return (
    <section 
      ref={ref}
      className={`sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden ${color} ${textColor}`}
      style={{ zIndex: index * 10 }}
    >
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full">
        {/* Text Content */}
        <motion.div 
          style={{ opacity, scale }}
          className="order-2 md:order-1"
        >
          <h2 className="font-heading text-6xl md:text-8xl uppercase leading-none mb-8">
            {title}
          </h2>
          <p className="text-xl md:text-2xl font-medium max-w-md mb-10 opacity-90">
            {subtitle}
          </p>
          <Button 
            size="lg" 
            className="rounded-none bg-proper-red text-white hover:bg-red-700 text-lg px-8 py-6 uppercase font-bold tracking-wider"
          >
            Get Access <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>

        {/* Image Content */}
        <div className="order-1 md:order-2 relative h-[50vh] md:h-[70vh] w-full">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover shadow-2xl"
          />
          {/* Floating Badge */}
          <div className="absolute bottom-10 -left-10 bg-white text-black p-6 shadow-xl max-w-xs hidden md:block">
            <p className="font-mono text-xs uppercase tracking-widest mb-2">Prompt used:</p>
            <p className="font-serif italic text-sm">
              "Cinematic lighting, 85mm lens, f/1.8, soft focus, highly detailed texture..."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingStickyScroll() {
  return (
    <div className="relative">
      <StickySection 
        index={1}
        title="The Gen AI Guide"
        subtitle="Master the fundamentals of prompt engineering. Learn lighting, lenses, and composition."
        image={PROPER_ASSETS.guide.feature}
        color="bg-black"
      />
      <StickySection 
        index={2}
        title="Magic Canvas"
        subtitle="Sketch your ideas and watch them come to life instantly. The ultimate tool for control."
        image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"
        color="bg-[#f5f5f5]"
        textColor="text-black"
      />
    </div>
  );
}
