import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative text-slate-900 dark:text-white overflow-hidden">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-10"
        style={{
          backgroundImage: 'url(/assets/footer-void-field.webp)',
          backgroundAttachment: 'fixed'
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 bg-gradient-to-b from-transparent via-slate-50/95 to-slate-100 dark:via-slate-950/95 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-20">
          {/* Top section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 pb-16 border-b border-slate-300 dark:border-slate-700">
            {/* Branding */}
            <div>
              <h3 className="text-2xl font-bold mb-4">KUPURI</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Estudios creativos en la Ciudad de México, llevando marcas al siguiente nivel.
              </p>
              <div className="flex gap-4 mt-6">
                <a
                  href="https://linkedin.com"
                  aria-label="LinkedIn"
                  className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                >
                  <Linkedin size={20} className="text-amber-600 dark:text-amber-400" />
                </a>
                <a
                  href="https://instagram.com"
                  aria-label="Instagram"
                  className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                >
                  <Instagram size={20} className="text-amber-600 dark:text-amber-400" />
                </a>
                <a
                  href="https://twitter.com"
                  aria-label="Twitter"
                  className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                >
                  <Twitter size={20} className="text-amber-600 dark:text-amber-400" />
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-semibold mb-6 text-lg">Servicios</h4>
              <ul className="space-y-3">
                {['Identidad', 'Video', 'UGC', 'Producto', 'Personajes'].map((service) => (
                  <li key={service}>
                    <a
                      href="#"
                      className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      {service}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-6 text-lg">Recursos</h4>
              <ul className="space-y-3">
                {['Blog', 'Portfolio', 'Clientes', 'Equipo', 'Contacto'].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-6 text-lg">Contacto</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Mail size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <a href="mailto:hola@kupuri.studio" className="text-sm text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400">
                    hola@kupuri.studio
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Phone size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <a href="tel:+525512345678" className="text-sm text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400">
                    +52 (55) 1234-5678
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Roma Norte, CDMX
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom section */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 md:mb-0">
              &copy; {currentYear} KUPURI Estudios. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-slate-600 dark:text-slate-400">
              <a href="#" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                Privacidad
              </a>
              <a href="#" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                Términos
              </a>
              <a href="#" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
