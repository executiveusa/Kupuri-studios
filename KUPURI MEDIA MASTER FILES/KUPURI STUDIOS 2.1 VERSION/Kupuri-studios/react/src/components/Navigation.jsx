import React, { useState } from 'react';
import Link from 'next/link';

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '#projects' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-white hover:text-accent transition-colors">
          Kupuri
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-300 hover:text-white focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="px-6 py-4 space-y-3">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-gray-300 hover:text-white transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navigation;
