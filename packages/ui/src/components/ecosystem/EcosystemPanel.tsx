import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../utils/cn';
import { TokenBalance } from './TokenBalance';
import { BubbleSwitcher, defaultBubbles } from './BubbleSwitcher';

interface EcosystemPanelProps {
  currentBubble: string;
  tokenBalance: number;
  tokenUsage: Record<string, number>;
  onBubbleChange: (bubbleId: string) => void;
  onRecharge: () => void;
  className?: string;
}

/**
 * EcosystemPanel - Unified ecosystem status panel
 * Shows token balance, bubble switcher, and ecosystem-wide notifications
 */
export function EcosystemPanel({
  currentBubble,
  tokenBalance,
  tokenUsage,
  onBubbleChange,
  onRecharge,
  className
}: EcosystemPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
              <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
              <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
              <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm">Kupuri Studios</p>
            <p className="text-xs text-muted-foreground">Creative Ecosystem</p>
          </div>
        </div>
        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-500">
          Active
        </span>
      </div>

      {/* Bubble Switcher */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">CURRENT BUBBLE</p>
        <BubbleSwitcher
          bubbles={defaultBubbles}
          currentBubble={currentBubble}
          onBubbleChange={onBubbleChange}
        />
      </div>

      {/* Token Balance */}
      <TokenBalance
        balance={tokenBalance}
        usage={tokenUsage}
        onRecharge={onRecharge}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <QuickStat label="Projects" value="12" trend="+3" />
        <QuickStat label="Generations" value="847" trend="+156" />
        <QuickStat label="Active Agents" value="4" />
        <QuickStat label="Scheduled" value="23" />
      </div>

      {/* Ecosystem Health */}
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">ECOSYSTEM HEALTH</p>
        <div className="space-y-2">
          <HealthIndicator service="JAAZ Engine" status="operational" />
          <HealthIndicator service="POSTIZ Scheduler" status="operational" />
          <HealthIndicator service="LiteLLM Router" status="operational" />
          <HealthIndicator service="Vector Store" status="operational" />
        </div>
      </div>
    </motion.div>
  );
}

interface QuickStatProps {
  label: string;
  value: string;
  trend?: string;
}

function QuickStat({ label, value, trend }: QuickStatProps) {
  return (
    <div className="rounded-lg border bg-background p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="font-semibold">{value}</span>
        {trend && (
          <span className="text-xs text-green-500">{trend}</span>
        )}
      </div>
    </div>
  );
}

interface HealthIndicatorProps {
  service: string;
  status: 'operational' | 'degraded' | 'down';
}

function HealthIndicator({ service, status }: HealthIndicatorProps) {
  const statusColors = {
    operational: 'bg-green-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500'
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs">{service}</span>
      <div className="flex items-center gap-1.5">
        <motion.div
          className={cn('h-1.5 w-1.5 rounded-full', statusColors[status])}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-xs text-muted-foreground capitalize">{status}</span>
      </div>
    </div>
  );
}

export { TokenBalance } from './TokenBalance';
export { BubbleSwitcher, defaultBubbles } from './BubbleSwitcher';
export { UserMenu } from './UserMenu';
