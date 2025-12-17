/**
 * Dashboard Route - Analytics & Metrics
 * Displays real-time application metrics, API performance, and usage statistics
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, TrendingUp, Clock, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

interface MetricsData {
  timestamp: string
  total_requests: number
  avg_latency_ms: number
  active_connections: number
  endpoints: Record<string, {
    method: string
    endpoint: string
    request_count: number
    avg_duration_ms: number
    min_duration_ms: number
    max_duration_ms: number
    p95_duration_ms: number
  }>
}

function DashboardPage() {
  const { t } = useTranslation('dashboard')
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<MetricsData[]>([])

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics')
        if (!response.ok) throw new Error('Failed to fetch metrics')
        const data = await response.json()
        setMetrics(data)
        setHistory(prev => [...prev, data].slice(-60)) // Keep last 60 data points
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    // Fetch immediately
    fetchMetrics()

    // Set up polling interval (5 seconds)
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8 flex items-center justify-center">
        <div className="text-white text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <Card className="border-red-500/50 bg-red-950/20">
          <CardHeader className="flex flex-row items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <CardTitle className="text-red-400">{t('error')}</CardTitle>
          </CardHeader>
          <CardContent className="text-red-200">
            {error || t('errorLoading')}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Prepare data for charts
  const latencyHistory = history.map((m, idx) => ({
    time: idx,
    latency: m.avg_latency_ms,
  }))

  const requestsHistory = history.map((m, idx) => ({
    time: idx,
    requests: m.total_requests,
  }))

  const endpointData = Object.entries(metrics.endpoints).map(([key, data]) => ({
    name: data.endpoint,
    requests: data.request_count,
    avgLatency: data.avg_duration_ms,
  }))

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-slate-300">{t('subtitle')}</p>
          <p className="text-sm text-slate-400 mt-2">
            {t('lastUpdate')}: {new Date(metrics.timestamp).toLocaleTimeString()}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={<TrendingUp className="w-5 h-5" />}
            label={t('totalRequests')}
            value={metrics.total_requests}
            color="blue"
          />
          <MetricCard
            icon={<Clock className="w-5 h-5" />}
            label={t('avgLatency')}
            value={`${metrics.avg_latency_ms.toFixed(2)}ms`}
            color="green"
          />
          <MetricCard
            icon={<Zap className="w-5 h-5" />}
            label={t('activeConnections')}
            value={metrics.active_connections}
            color="yellow"
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5" />}
            label={t('uniqueEndpoints')}
            value={Object.keys(metrics.endpoints).length}
            color="purple"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Latency Trend */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">{t('latencyTrend')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={latencyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="#3b82f6"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Request Rate */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">{t('requestRate')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={requestsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="requests" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Endpoint Performance */}
        <Card className="border-slate-700 bg-slate-800/50 mb-8">
          <CardHeader>
            <CardTitle className="text-white">{t('endpointPerformance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">{t('endpoint')}</th>
                    <th className="text-right py-3 px-4 text-slate-300 font-semibold">{t('requests')}</th>
                    <th className="text-right py-3 px-4 text-slate-300 font-semibold">{t('avgLatency')}</th>
                    <th className="text-right py-3 px-4 text-slate-300 font-semibold">{t('p95Latency')}</th>
                    <th className="text-right py-3 px-4 text-slate-300 font-semibold">{t('maxLatency')}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(metrics.endpoints)
                    .sort((a, b) => b[1].request_count - a[1].request_count)
                    .slice(0, 10)
                    .map(([key, data]) => (
                      <tr key={key} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition">
                        <td className="py-3 px-4 text-blue-300 font-mono text-xs">
                          {data.method} {data.endpoint}
                        </td>
                        <td className="text-right py-3 px-4 text-slate-200">{data.request_count}</td>
                        <td className="text-right py-3 px-4 text-slate-200">{data.avg_duration_ms.toFixed(2)}ms</td>
                        <td className="text-right py-3 px-4 text-slate-200">{data.p95_duration_ms.toFixed(2)}ms</td>
                        <td className="text-right py-3 px-4 text-slate-200">{data.max_duration_ms.toFixed(2)}ms</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: 'blue' | 'green' | 'yellow' | 'purple'
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-900/20 to-blue-800/20 border-blue-700/30',
    green: 'from-green-900/20 to-green-800/20 border-green-700/30',
    yellow: 'from-yellow-900/20 to-yellow-800/20 border-yellow-700/30',
    purple: 'from-purple-900/20 to-purple-800/20 border-purple-700/30',
  }

  const iconColorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
  }

  return (
    <Card className={`border bg-gradient-to-br ${colorClasses[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-white mt-2">{value}</p>
          </div>
          <div className={`${iconColorClasses[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
