import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

/**
 * Tabs - Animated tab navigation component
 * Part of @kupuri/ui shared component library
 */
export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'default'
}: TabsProps) {
  const variants = {
    default: {
      container: 'rounded-lg border bg-muted/50 p-1',
      tab: 'rounded-md px-3 py-1.5 text-sm font-medium',
      active: 'bg-background shadow-sm',
      inactive: 'text-muted-foreground hover:text-foreground'
    },
    pills: {
      container: 'flex gap-2',
      tab: 'rounded-full px-4 py-2 text-sm font-medium',
      active: 'bg-primary text-primary-foreground',
      inactive: 'bg-muted text-muted-foreground hover:bg-muted/80'
    },
    underline: {
      container: 'border-b',
      tab: 'relative px-4 py-2 text-sm font-medium',
      active: 'text-foreground',
      inactive: 'text-muted-foreground hover:text-foreground'
    }
  };

  const style = variants[variant];

  return (
    <div className={cn('flex', style.container, className)}>
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
          className={cn(
            style.tab,
            'relative transition-colors',
            tab.id === activeTab ? style.active : style.inactive,
            tab.disabled && 'cursor-not-allowed opacity-50'
          )}
          whileHover={{ scale: tab.disabled ? 1 : 1.02 }}
          whileTap={{ scale: tab.disabled ? 1 : 0.98 }}
        >
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </span>
          
          {/* Animated indicator for underline variant */}
          {variant === 'underline' && tab.id === activeTab && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          
          {/* Animated background for default variant */}
          {variant === 'default' && tab.id === activeTab && (
            <motion.div
              layoutId="activeTabBg"
              className="absolute inset-0 rounded-md bg-background shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}

// Tab Content Panel
interface TabPanelProps {
  children: React.ReactNode;
  tabId: string;
  activeTab: string;
  className?: string;
}

export function TabPanel({ children, tabId, activeTab, className }: TabPanelProps) {
  if (tabId !== activeTab) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Full Tabs Container with built-in state
interface TabsContainerProps {
  tabs: Tab[];
  defaultTab?: string;
  children: (activeTab: string) => React.ReactNode;
  className?: string;
  tabsClassName?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export function TabsContainer({
  tabs,
  defaultTab,
  children,
  className,
  tabsClassName,
  variant = 'default'
}: TabsContainerProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id || '');

  return (
    <div className={className}>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant={variant}
        className={tabsClassName}
      />
      <div className="mt-4">
        {children(activeTab)}
      </div>
    </div>
  );
}
