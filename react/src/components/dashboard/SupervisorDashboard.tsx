/**
 * Kupuri Studios - Supervisor Dashboard
 * =====================================
 * Real-time monitoring of the Lightning Orchestrator and all sub-agents.
 * Connects via WebSocket for live updates on relay races and agent status.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Users,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronRight,
  BarChart3,
  Target,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Agent {
  name: string;
  role: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'blocked' | 'awaiting_validation';
  current_task: string | null;
}

interface RelayRace {
  id: string;
  name: string;
  status: string;
  current_leg: number;
  gates_passed: number;
  total_gates: number;
  tasks_completed: number;
  started_at: string | null;
  completed_at: string | null;
}

interface SupervisorEvent {
  type: string;
  race_id?: string;
  agent?: string;
  gate?: number;
  status?: string;
  message?: string;
  timestamp: string;
}

// Status color mapping
const statusColors: Record<string, string> = {
  idle: 'bg-slate-500',
  running: 'bg-blue-500 animate-pulse',
  completed: 'bg-emerald-500',
  failed: 'bg-red-500',
  blocked: 'bg-amber-500',
  awaiting_validation: 'bg-purple-500 animate-pulse',
};

const raceStatusColors: Record<string, string> = {
  initialized: 'text-slate-400',
  running: 'text-blue-400',
  completed: 'text-emerald-400',
  failed: 'text-red-400',
  blocked_gate1: 'text-amber-400',
  blocked_gate4: 'text-amber-400',
  vetoed_gate2: 'text-red-400',
  rejected_gate5: 'text-red-400',
};

// Agent Card Component
function AgentCard({ agent }: { agent: Agent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', statusColors[agent.status])} />
          <span className="font-semibold text-white">{agent.name}</span>
        </div>
        <span className="text-xs text-slate-400 capitalize">{agent.status.replace('_', ' ')}</span>
      </div>
      <p className="text-sm text-slate-400">{agent.role}</p>
      {agent.current_task && (
        <div className="mt-2 text-xs text-blue-300 flex items-center gap-1">
          <Activity className="w-3 h-3" />
          <span className="truncate">{agent.current_task}</span>
        </div>
      )}
    </motion.div>
  );
}

// Race Card Component
function RaceCard({ race }: { race: RelayRace }) {
  const progress = race.total_gates > 0 ? (race.gates_passed / race.total_gates) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-white">{race.name}</span>
        <span className={cn('text-xs font-medium', raceStatusColors[race.status] || 'text-slate-400')}>
          {race.status.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Gates: {race.gates_passed}/{race.total_gates}</span>
          <span>Leg {race.current_leg}</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          />
        </div>
      </div>

      {/* Gate Icons */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((gate) => (
          <div
            key={gate}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium',
              gate <= race.gates_passed
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : gate === race.gates_passed + 1 && race.status === 'running'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
                : 'bg-slate-700/50 text-slate-500 border border-slate-600/30'
            )}
          >
            {gate <= race.gates_passed ? <CheckCircle className="w-4 h-4" /> : gate}
          </div>
        ))}
      </div>

      {/* Timestamps */}
      <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
        <Clock className="w-3 h-3" />
        {race.started_at && (
          <span>Started: {new Date(race.started_at).toLocaleTimeString()}</span>
        )}
        {race.completed_at && (
          <span className="ml-2">Completed: {new Date(race.completed_at).toLocaleTimeString()}</span>
        )}
      </div>
    </motion.div>
  );
}

// Event Log Item
function EventLogItem({ event }: { event: SupervisorEvent }) {
  const icons: Record<string, React.ReactNode> = {
    relay_started: <Play className="w-3 h-3 text-blue-400" />,
    relay_completed: <CheckCircle className="w-3 h-3 text-emerald-400" />,
    agent_started: <Activity className="w-3 h-3 text-blue-400" />,
    agent_completed: <CheckCircle className="w-3 h-3 text-emerald-400" />,
    gate_completed: <Shield className="w-3 h-3 text-purple-400" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2 py-2 border-b border-slate-700/50 last:border-0"
    >
      {icons[event.type] || <ChevronRight className="w-3 h-3 text-slate-400" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300">{event.message || event.type.replace(/_/g, ' ')}</p>
        {event.agent && <p className="text-xs text-slate-500">Agent: {event.agent}</p>}
        {event.gate && <p className="text-xs text-slate-500">Gate: {event.gate}</p>}
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap">
        {new Date(event.timestamp).toLocaleTimeString()}
      </span>
    </motion.div>
  );
}

// Main Supervisor Dashboard
export function SupervisorDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeRaces, setActiveRaces] = useState<RelayRace[]>([]);
  const [completedRaces, setCompletedRaces] = useState<RelayRace[]>([]);
  const [eventLog, setEventLog] = useState<SupervisorEvent[]>([]);
  const [stats, setStats] = useState({
    totalRaces: 0,
    successRate: 0,
    avgTime: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/supervisor/ws`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('🔌 Supervisor WebSocket connected');

        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('🔌 Supervisor WebSocket disconnected');

        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'connected':
        setAgents(data.agents || []);
        break;

      case 'status_update':
        setAgents(data.agents || []);
        setActiveRaces(data.active_races || []);
        break;

      case 'relay_started':
      case 'relay_completed':
      case 'agent_started':
      case 'agent_completed':
      case 'gate_completed':
        setEventLog((prev) => [data, ...prev].slice(0, 50)); // Keep last 50
        break;

      case 'race_status':
        // Update specific race
        break;
    }
  }, []);

  // Request status update
  const requestStatus = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'get_status' }));
    }
  }, []);

  // Start a new relay race
  const startRace = useCallback((name: string, tasks: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'start_race',
          name,
          authorization: { option: 'A' },
          tasks,
        })
      );
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  // Poll for status every 5 seconds
  useEffect(() => {
    const interval = setInterval(requestStatus, 5000);
    return () => clearInterval(interval);
  }, [requestStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-400" />
            Lightning Orchestrator
          </h1>
          <p className="text-slate-400 mt-1">THE COFOUNDER - Real-time Agent Supervisor</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
              isConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            )}
          >
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                Disconnected
              </>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={requestStatus}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{agents.length}</p>
              <p className="text-sm text-slate-400">Active Agents</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeRaces.length}</p>
              <p className="text-sm text-slate-400">Active Races</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedRaces.length}</p>
              <p className="text-sm text-slate-400">Completed</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <BarChart3 className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">100%</p>
              <p className="text-sm text-slate-400">Success Rate</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents Grid */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Sub-Agents
          </h2>
          <div className="space-y-4">
            <AnimatePresence>
              {agents.map((agent) => (
                <AgentCard key={agent.name} agent={agent} />
              ))}
            </AnimatePresence>

            {agents.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No agents registered</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Races */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Active Relay Races
          </h2>
          <div className="space-y-4">
            <AnimatePresence>
              {activeRaces.map((race) => (
                <RaceCard key={race.id} race={race} />
              ))}
            </AnimatePresence>

            {activeRaces.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No active races</p>
                <button
                  onClick={() => startRace('Test Race', ['transcribe', 'generate', 'create'])}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition"
                >
                  Start Test Race
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Event Log */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Event Log
          </h2>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 max-h-[500px] overflow-y-auto">
            <div className="p-4">
              <AnimatePresence>
                {eventLog.map((event, i) => (
                  <EventLogItem key={`${event.timestamp}-${i}`} event={event} />
                ))}
              </AnimatePresence>

              {eventLog.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No events yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex justify-center gap-4">
        <button
          onClick={() => startRace('Video Generation', ['transcribe_audio', 'generate_script', 'create_video'])}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold transition flex items-center gap-2"
        >
          <Play className="w-5 h-5" />
          Start Video Pipeline
        </button>

        <button
          onClick={() => startRace('Content Creation', ['analyze_prompt', 'generate_content', 'optimize'])}
          className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl font-semibold transition flex items-center gap-2"
        >
          <Zap className="w-5 h-5" />
          Content Pipeline
        </button>
      </div>
    </div>
  );
}

export default SupervisorDashboard;
