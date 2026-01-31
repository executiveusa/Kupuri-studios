import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, Sparkles } from "lucide-react";

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Projects", href: "#projects" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav className="fixed top-4 left-4 right-4 z-50 bg-white/80 backdrop-blur-lg border border-gray-200 rounded-lg">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo with icon - use Lucide Sparkles instead of emoji */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-slate-900 hover:text-slate-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-600 rounded-lg px-2 py-1"
        >
          <Sparkles className="w-5 h-5" />
          Kupuri
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-slate-600 hover:text-slate-900 transition-colors font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-600 rounded px-2 py-1"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile menu button - use Lucide Menu/X instead of SVG */}
        <button
          className="md:hidden text-slate-600 hover:text-slate-900 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-600 rounded p-1 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 rounded-b-lg">
          <div className="px-6 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-slate-600 hover:text-slate-900 hover:bg-gray-50 transition-colors font-medium cursor-pointer px-3 py-2 rounded"
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
