import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  tokenBalance: number;
  plan: 'free' | 'pro' | 'enterprise';
}

interface UserMenuProps {
  user: User;
  onLogout: () => void;
  onSettings: () => void;
  onBilling: () => void;
  className?: string;
}

/**
 * UserMenu - Ecosystem-wide user account menu
 * Provides unified user experience across all Kupuri bubbles
 */
export function UserMenu({
  user,
  onLogout,
  onSettings,
  onBilling,
  className
}: UserMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const planColors = {
    free: 'bg-gray-100 text-gray-700',
    pro: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700'
  };

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border bg-card p-1 pr-3 shadow-sm transition-colors hover:bg-accent"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {initials}
          </div>
        )}
        <span className="text-sm font-medium">{user.name.split(' ')[0]}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border bg-card p-4 shadow-lg"
          >
            {/* User Info */}
            <div className="flex items-center gap-3 pb-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                  {initials}
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', planColors[user.plan])}>
                {user.plan.toUpperCase()}
              </span>
            </div>

            {/* Token Balance */}
            <div className="rounded-lg border bg-muted/50 p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Token Balance</span>
                <span className="font-mono font-semibold">
                  {user.tokenBalance.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((user.tokenBalance / 10000) * 100, 100)}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                />
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              <MenuButton
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                }
                onClick={onSettings}
              >
                Account Settings
              </MenuButton>

              <MenuButton
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                }
                onClick={onBilling}
              >
                Billing & Tokens
              </MenuButton>

              <div className="my-2 border-t" />

              <MenuButton
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                }
                onClick={onLogout}
                variant="danger"
              >
                Sign Out
              </MenuButton>
            </div>

            {/* Footer */}
            <div className="mt-4 border-t pt-3">
              <p className="text-center text-xs text-muted-foreground">
                Kupuri Studios Ecosystem v2.1
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MenuButtonProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

function MenuButton({ children, icon, onClick, variant = 'default' }: MenuButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
        variant === 'danger'
          ? 'text-destructive hover:bg-destructive/10'
          : 'hover:bg-accent'
      )}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon}
      {children}
    </motion.button>
  );
}
