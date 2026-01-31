import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn';

interface Bubble {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href: string;
  active?: boolean;
}

interface BubbleSwitcherProps {
  bubbles: Bubble[];
  currentBubble: string;
  onBubbleChange: (bubbleId: string) => void;
  className?: string;
}

/**
 * BubbleSwitcher - Navigate between ecosystem bubbles (JAAZ, POSTIZ, etc)
 * Provides unified navigation across the Kupuri Studios ecosystem
 */
export function BubbleSwitcher({
  bubbles,
  currentBubble,
  onBubbleChange,
  className
}: BubbleSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const current = bubbles.find(b => b.id === currentBubble);

  return (
    <div className={cn('relative', className)}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm transition-colors hover:bg-accent',
          current?.color
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {current?.icon}
        <span className="font-medium">{current?.name || 'Select Bubble'}</span>
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          animate={{ rotate: isOpen ? 180 : 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border bg-card p-2 shadow-lg"
          >
            <div className="mb-2 px-2">
              <p className="text-xs font-medium text-muted-foreground">
                KUPURI STUDIOS ECOSYSTEM
              </p>
            </div>
            
            <div className="space-y-1">
              {bubbles.map((bubble) => (
                <motion.button
                  key={bubble.id}
                  onClick={() => {
                    onBubbleChange(bubble.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                    bubble.id === currentBubble
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-accent'
                  )}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={cn('rounded-md p-1.5', bubble.color)}>
                    {bubble.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{bubble.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {bubble.description}
                    </p>
                  </div>
                  {bubble.id === currentBubble && (
                    <motion.div
                      className="h-2 w-2 rounded-full bg-primary"
                      layoutId="activeBubble"
                    />
                  )}
                </motion.button>
              ))}
            </div>
            
            <div className="mt-2 border-t pt-2">
              <p className="px-2 text-xs text-muted-foreground">
                All bubbles share your token balance
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Default bubbles configuration
export const defaultBubbles: Bubble[] = [
  {
    id: 'jaaz',
    name: 'JAAZ',
    description: 'AI Video Creation',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    color: 'bg-purple-500/20 text-purple-500',
    href: '/jaaz',
    active: true
  },
  {
    id: 'postiz',
    name: 'POSTIZ',
    description: 'Social Media Automation',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    color: 'bg-blue-500/20 text-blue-500',
    href: '/postiz',
    active: true
  },
  {
    id: 'designer',
    name: 'Designer',
    description: 'Graphic Design Studio',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
    color: 'bg-pink-500/20 text-pink-500',
    href: '/designer',
    active: false
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Metrics & Reporting',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    color: 'bg-green-500/20 text-green-500',
    href: '/analytics',
    active: false
  }
];
