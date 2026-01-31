import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface ServiceCard {
  id: string;
  label: string;
  cta: string;
  image: string;
  alt: string;
}

const services: ServiceCard[] = [
  {
    id: 'card_01',
    label: 'Identidad',
    cta: 'Ver más',
    image: '/assets/card-identity-beads.webp',
    alt: 'Huichol beadwork craftsmanship'
  },
  {
    id: 'card_02',
    label: 'Video',
    cta: 'Ver más',
    image: '/assets/card-film-pulse.webp',
    alt: 'CDMX street night cinematography'
  },
  {
    id: 'card_03',
    label: 'UGC',
    cta: 'Ver más',
    image: '/assets/card-photo-ugc.webp',
    alt: 'UGC content creation in Mexico City'
  },
  {
    id: 'card_04',
    label: 'Producto',
    cta: 'Ver más',
    image: '/assets/card-food-real.webp',
    alt: 'Product photography - tacos al pastor'
  },
  {
    id: 'card_05',
    label: 'Personajes',
    cta: 'Ver más',
    image: '/assets/card-illustration-character.webp',
    alt: 'Character illustration and mascot design'
  }
];

export default function ServiceGrid() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="bg-slate-50 dark:bg-slate-950 py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="mb-20 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Nuestros Servicios
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Desde identidad visual hasta producción audiovisual, llevamos tu marca al siguiente nivel.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              className="group cursor-pointer"
              onMouseEnter={() => setHoveredId(service.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Image container */}
              <div className="relative overflow-hidden rounded-lg mb-6 aspect-square bg-slate-200 dark:bg-slate-800">
                <img
                  src={service.image}
                  alt={service.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {/* Overlay on hover */}
                <div
                  className={`absolute inset-0 bg-black/50 flex items-end p-6 transition-opacity duration-300 ${
                    hoveredId === service.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div className="flex items-center gap-3 text-white group-hover:translate-x-2 transition-transform duration-300">
                    <span className="text-lg font-semibold">{service.cta}</span>
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>

              {/* Label */}
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {service.label}
              </h3>

              {/* CTA link */}
              <button
                aria-label={`${service.cta} sobre ${service.label}`}
                className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold hover:gap-3 transition-all"
              >
                {service.cta}
                <ArrowRight size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
