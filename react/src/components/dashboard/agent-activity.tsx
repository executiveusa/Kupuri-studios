/**
 * Kupuri Studios - Agent Activity Dashboard
 * =========================================
 * Real-time agent status and performance metrics
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from '@/components/ui/glass-card';
import {
  Users,
  TrendingUp,
  Clock,
  MessageSquare,
  Phone,
  CheckCircle,
  AlertTriangle,
  Activity,
  Zap,
  Award,
} from 'lucide-react';

// Types
interface Agent {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  role: string;
  currentLoad: number;
  maxLoad: number;
  stats: {
    resolved: number;
    avgResponseTime: number; // in seconds
    satisfaction: number; // 0-100
    activeConversations: number;
  };
}

interface TeamMetrics {
  totalAgents: number;
  onlineAgents: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  totalResolved: number;
  totalOpen: number;
  satisfaction: number;
}

interface AgentActivityProps {
  agents: Agent[];
  metrics: TeamMetrics;
  onAgentSelect?: (agent: Agent) => void;
}

// Status indicator styles
const statusStyles = {
  online: 'bg-emerald-500 shadow-emerald-500/50',
  away: 'bg-amber-500 shadow-amber-500/50',
  busy: 'bg-red-500 shadow-red-500/50',
  offline: 'bg-neutral-400',
};

const statusLabels = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
  offline: 'Offline',
};

// Metric Card Component
function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <GlassCard padding="sm" hoverable>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {value}
          </p>
          {change && (
            <p
              className={cn(
                'text-xs mt-1',
                trend === 'up' && 'text-emerald-600',
                trend === 'down' && 'text-red-600',
                trend === 'neutral' && 'text-neutral-500'
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div
          className={cn(
            'p-2 rounded-lg',
            'bg-purple-100 dark:bg-purple-900/30'
          )}
        >
          <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
    </GlassCard>
  );
}

// Agent Card Component
function AgentCard({
  agent,
  onSelect,
}: {
  agent: Agent;
  onSelect?: () => void;
}) {
  const loadPercentage = (agent.currentLoad / agent.maxLoad) * 100;
  
  return (
    <div
      onClick={onSelect}
      className={cn(
        'p-4 rounded-xl cursor-pointer transition-all duration-150',
        'bg-white/50 dark:bg-neutral-900/50',
        'hover:bg-white/80 dark:hover:bg-neutral-800/80',
        'border border-white/30 dark:border-neutral-700/50'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with status */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center text-white font-semibold">
            {agent.avatar ? (
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              agent.name.charAt(0)
            )}
          </div>
          <span
            className={cn(
              'absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-neutral-900',
              'shadow-[0_0_8px]',
              statusStyles[agent.status]
            )}
          />
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {agent.name}
            </span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                agent.status === 'online' &&
                  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                agent.status === 'away' &&
                  'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                agent.status === 'busy' &&
                  'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                agent.status === 'offline' &&
                  'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              )}
            >
              {statusLabels[agent.status]}
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {agent.role}
          </p>
        </div>
      </div>
      
      {/* Load Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-neutral-500">Current Load</span>
          <span className="text-neutral-700 dark:text-neutral-300">
            {agent.currentLoad}/{agent.maxLoad}
          </span>
        </div>
        <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              loadPercentage < 50 && 'bg-emerald-500',
              loadPercentage >= 50 && loadPercentage < 80 && 'bg-amber-500',
              loadPercentage >= 80 && 'bg-red-500'
            )}
            style={{ width: `${loadPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
        <div className="text-center">
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {agent.stats.resolved}
          </p>
          <p className="text-xs text-neutral-500">Resolved</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {Math.round(agent.stats.avgResponseTime / 60)}m
          </p>
          <p className="text-xs text-neutral-500">Avg Response</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {agent.stats.satisfaction}%
          </p>
          <p className="text-xs text-neutral-500">CSAT</p>
        </div>
      </div>
    </div>
  );
}

// Main Agent Activity Component
export function AgentActivity({
  agents,
  metrics,
  onAgentSelect,
}: AgentActivityProps) {
  const onlineAgents = agents.filter((a) => a.status === 'online');
  const busyAgents = agents.filter((a) => a.status === 'busy');
  
  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Online Agents"
          value={`${metrics.onlineAgents}/${metrics.totalAgents}`}
          icon={Users}
          change={`${onlineAgents.length} active now`}
          trend="neutral"
        />
        <MetricCard
          label="Avg Response"
          value={`${Math.round(metrics.avgResponseTime / 60)}m`}
          icon={Clock}
          change="-2m from yesterday"
          trend="up"
        />
        <MetricCard
          label="Resolved Today"
          value={metrics.totalResolved}
          icon={CheckCircle}
          change="+12% vs last week"
          trend="up"
        />
        <MetricCard
          label="CSAT Score"
          value={`${metrics.satisfaction}%`}
          icon={Award}
          change="+3% this month"
          trend="up"
        />
      </div>
      
      {/* Agent Grid */}
      <GlassCard padding="md" hoverable={false}>
        <GlassCardHeader className="border-b-0 pb-2">
          <div className="flex items-center justify-between">
            <GlassCardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              Team Activity
            </GlassCardTitle>
            
            {/* Status Summary */}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className={cn('w-2.5 h-2.5 rounded-full', statusStyles.online)} />
                {onlineAgents.length} online
              </span>
              <span className="flex items-center gap-1.5">
                <span className={cn('w-2.5 h-2.5 rounded-full', statusStyles.busy)} />
                {busyAgents.length} busy
              </span>
            </div>
          </div>
        </GlassCardHeader>
        
        <GlassCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onSelect={() => onAgentSelect?.(agent)}
              />
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>
      
      {/* Quick Actions */}
      <div className="flex gap-3">
        <GlassCard padding="md" className="flex-1" hoverable>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                Quick Assign
              </p>
              <p className="text-sm text-neutral-500">
                Auto-route {metrics.totalOpen} pending cases
              </p>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard padding="md" className="flex-1" hoverable>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                View Reports
              </p>
              <p className="text-sm text-neutral-500">
                Team performance analytics
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default AgentActivity;
