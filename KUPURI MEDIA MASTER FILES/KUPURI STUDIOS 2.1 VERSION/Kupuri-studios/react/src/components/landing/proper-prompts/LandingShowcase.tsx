import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { PROPER_ASSETS } from './assets';

const showcaseItems = [
  {
    id: 1,
    image: PROPER_ASSETS.showcase[0],
    prompt: "Abstract oil painting, swirling colors, gold leaf texture, impasto style",
    span: "md:col-span-2 md:row-span-2",
    height: "h-[600px]"
  },
  {
    id: 2,
    image: PROPER_ASSETS.showcase[1],
    prompt: "Cyberpunk street food vendor, neon lights, rain reflections",
    span: "md:col-span-1 md:row-span-1",
    height: "h-[300px]"
  },
  {
    id: 3,
    image: PROPER_ASSETS.showcase[2],
    prompt: "Minimalist architectural photography, concrete curves",
    span: "md:col-span-1 md:row-span-1",
    height: "h-[300px]"
  },
  {
    id: 4,
    image: PROPER_ASSETS.showcase[3],
    prompt: "Portrait of an astronaut on Mars, dust storm",
    span: "md:col-span-1 md:row-span-2",
    height: "h-[600px]"
  },
  {
    id: 5,
    image: PROPER_ASSETS.showcase[4],
    prompt: "Macro photography of a mechanical eye",
    span: "md:col-span-2 md:row-span-1",
    height: "h-[300px]"
  }
];

export function LandingShowcase() {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="py-24 bg-white text-black">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-6xl md:text-8xl uppercase mb-4 text-proper-red"
          >
            The Collection
          </motion.h2>
          <p className="text-xl font-medium max-w-2xl mx-auto">
            Explore what's possible with Kupuri. Hover to copy the exact prompt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {showcaseItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative group overflow-hidden bg-gray-100 ${item.span} ${item.height}`}
            >
              <img 
                src={item.image} 
                alt="Generated artwork" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <p className="text-white font-mono text-sm mb-4 line-clamp-3">
                  {item.prompt}
                </p>
                <button
                  onClick={() => handleCopy(item.id, item.prompt)}
                  className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-proper-red hover:text-white px-6 py-3 w-full transition-colors duration-300"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Prompt
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
