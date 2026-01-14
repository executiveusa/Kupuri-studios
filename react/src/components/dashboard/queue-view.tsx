/**
 * Kupuri Studios - Queue View Component
 * =====================================
 * Sprinklr-familiar queue interface for case management
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import {
  MessageSquare,
  Phone,
  Mail,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  RefreshCw,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';

// Types
interface QueueItem {
  id: string;
  type: 'chat' | 'email' | 'phone' | 'whatsapp' | 'social';
  status: 'open' | 'pending' | 'resolved' | 'snoozed';
  priority: 'high' | 'medium' | 'low';
  contact: {
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  subject: string;
  preview: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  sla: {
    dueAt: Date;
    status: 'overdue' | 'warning' | 'on-track';
  };
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  unreadCount: number;
}

interface QueueViewProps {
  items: QueueItem[];
  onItemSelect: (item: QueueItem) => void;
  onRefresh?: () => void;
  selectedId?: string;
  loading?: boolean;
}

// Channel icons
const channelIcons = {
  chat: MessageSquare,
  email: Mail,
  phone: Phone,
  whatsapp: MessageSquare,
  social: MessageSquare,
};

// Priority colors
const priorityColors = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-emerald-500',
};

// SLA Badge Component
function SLABadge({ sla }: { sla: QueueItem['sla'] }) {
  const now = new Date();
  const dueAt = new Date(sla.dueAt);
  const diff = dueAt.getTime() - now.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  let timeText = '';
  if (minutes < 0) {
    const overdue = Math.abs(minutes);
    timeText = overdue > 60 ? `${Math.floor(overdue / 60)}h overdue` : `${overdue}m overdue`;
  } else if (hours > 0) {
    timeText = `${hours}h ${minutes % 60}m`;
  } else {
    timeText = `${minutes}m`;
  }
  
  const statusStyles = {
    overdue: 'bg-red-500/15 text-red-600 dark:text-red-400',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    'on-track': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  };
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        statusStyles[sla.status]
      )}
    >
      <Clock className="w-3 h-3" />
      {timeText}
    </span>
  );
}

// Queue Item Component
function QueueItemCard({
  item,
  isSelected,
  onSelect,
}: {
  item: QueueItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const ChannelIcon = channelIcons[item.type];
  
  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative p-4 cursor-pointer transition-all duration-150',
        'border-l-4 rounded-lg',
        'bg-white/50 dark:bg-neutral-900/50',
        'hover:bg-white/80 dark:hover:bg-neutral-800/80',
        'hover:translate-x-1',
        priorityColors[item.priority],
        isSelected && [
          'bg-purple-50/80 dark:bg-purple-900/20',
          'border-l-purple-500',
          'ring-1 ring-purple-500/30',
        ]
      )}
    >
      <div className="flex items-start gap-3">
        {/* Channel Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            'bg-neutral-100 dark:bg-neutral-800',
            item.type === 'whatsapp' && 'bg-green-100 dark:bg-green-900/30'
          )}
        >
          <ChannelIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {item.contact.name}
            </span>
            <SLABadge sla={item.sla} />
          </div>
          
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate mb-1">
            {item.subject}
          </p>
          
          <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
            {item.preview}
          </p>
          
          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {item.labels.slice(0, 2).map((label) => (
                <span
                  key={label}
                  className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                >
                  {label}
                </span>
              ))}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              {item.assignee && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {item.assignee.name}
                </span>
              )}
              {item.unreadCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-medium">
                  {item.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <ChevronRight className="flex-shrink-0 w-5 h-5 text-neutral-400" />
      </div>
    </div>
  );
}

// Filter Bar Component
function FilterBar({
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  searchQuery,
  onSearchChange,
}: {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  priorityFilter: string;
  onPriorityChange: (priority: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  const statuses = [
    { value: 'all', label: 'All', icon: null },
    { value: 'open', label: 'Open', icon: AlertTriangle },
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'resolved', label: 'Resolved', icon: CheckCircle },
  ];
  
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'w-full pl-9 pr-4 py-2 rounded-lg',
            'bg-white/50 dark:bg-neutral-900/50',
            'border border-white/30 dark:border-neutral-700/50',
            'text-neutral-900 dark:text-neutral-100',
            'placeholder-neutral-500',
            'focus:outline-none focus:ring-2 focus:ring-purple-500/30'
          )}
        />
      </div>
      
      {/* Status Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-neutral-100/50 dark:bg-neutral-800/50">
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => onStatusChange(status.value)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              statusFilter === status.value
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            )}
          >
            {status.icon && <status.icon className="w-3.5 h-3.5" />}
            {status.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Main Queue View Component
export function QueueView({
  items,
  onItemSelect,
  onRefresh,
  selectedId,
  loading = false,
}: QueueViewProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.contact.name.toLowerCase().includes(query) ||
          item.subject.toLowerCase().includes(query) ||
          item.preview.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [items, statusFilter, priorityFilter, searchQuery]);
  
  // Count by status
  const statusCounts = useMemo(() => {
    return {
      all: items.length,
      open: items.filter((i) => i.status === 'open').length,
      pending: items.filter((i) => i.status === 'pending').length,
      resolved: items.filter((i) => i.status === 'resolved').length,
    };
  }, [items]);
  
  return (
    <GlassCard className="h-full flex flex-col" padding="none" hoverable={false}>
      <GlassCardHeader className="border-b border-white/20 dark:border-neutral-700/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <GlassCardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            Queue
            <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              {statusCounts.open} open
            </span>
          </GlassCardTitle>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <RefreshCw
                className={cn(
                  'w-4 h-4 text-neutral-500',
                  loading && 'animate-spin'
                )}
              />
            </button>
            <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <Filter className="w-4 h-4 text-neutral-500" />
            </button>
          </div>
        </div>
      </GlassCardHeader>
      
      <div className="p-4">
        <FilterBar
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
      
      <GlassCardContent className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <QueueItemCard
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                onSelect={() => onItemSelect(item)}
              />
            ))
          )}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}

export default QueueView;
