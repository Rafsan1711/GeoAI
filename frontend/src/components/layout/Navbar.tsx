import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { AtlasCharacter } from '../atlas/AtlasCharacter';
import { cn } from '../../lib/utils';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Play', path: '/game' },
    { name: 'Docs', path: '/docs' },
    { name: 'Roadmap', path: '/roadmap' },
    { name: 'Admin', path: '/admin' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#080C14]/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group outline-none">
            <img src="/logo.png" className="w-9 h-9 rounded-xl shadow-[0_0_15px_rgba(0,194,255,0.3)]" alt="GuessMyPlace" />
            <div className="text-xl tracking-tight hidden sm:block">
              <span className="font-bold text-text-primary">Guess</span>
              <span className="font-bold text-accent-cyan">My</span>
              <span className="font-bold text-text-primary">Place</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className="relative group text-sm font-medium transition-colors"
                >
                  <span className={cn(
                    "relative z-10",
                    isActive ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
                  )}>
                    {link.name}
                  </span>
                  <span>
                     <span className={cn(
                       "absolute -bottom-1 left-0 w-full h-[2px] bg-accent-cyan origin-left transition-transform duration-300",
                       isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                     )} />
                  </span>
                </Link>
              );
            })}
            <Button asChild variant="outline" size="sm" className="ml-4">
              <Link to="/game">Play Now</Link>
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-text-secondary hover:text-text-primary focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#080C14]/95 backdrop-blur-xl border-b border-border pt-16 md:hidden"
          >
            <div className="flex flex-col p-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={cn(
                    "block px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    location.pathname.startsWith(link.path)
                      ? "bg-bg-elevated text-text-primary"
                      : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 mt-2 border-t border-border-subtle">
                <Button asChild className="w-full" size="lg">
                  <Link to="/game" onClick={closeMobileMenu}>Play Now</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
