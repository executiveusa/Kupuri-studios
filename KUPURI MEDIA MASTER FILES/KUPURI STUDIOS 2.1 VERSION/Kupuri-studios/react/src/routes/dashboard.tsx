/**
 * Dashboard Route - Analytics & Metrics
 * Displays real-time application metrics, API performance, and usage statistics
 */

import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, TrendingUp, Clock, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

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
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-slate-300 text-sm font-medium'>{label}</p>
            <p className='text-2xl font-bold text-white mt-2'>{value}</p>
          </div>
          <div className={`${iconColorClasses[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardPage() {
  const { t } = useTranslation()

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-white mb-2'>Dashboard</h1>
          <p className='text-slate-300'>Application metrics and analytics</p>
          <p className='text-sm text-slate-400 mt-2'>
            Last update: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Key Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
          <MetricCard
            icon={<TrendingUp className='w-5 h-5' />}
            label='Total Requests'
            value='--'
            color='blue'
          />
          <MetricCard
            icon={<Clock className='w-5 h-5' />}
            label='Avg Latency'
            value='--ms'
            color='green'
          />
          <MetricCard
            icon={<Zap className='w-5 h-5' />}
            label='Active Connections'
            value='--'
            color='yellow'
          />
          <MetricCard
            icon={<TrendingUp className='w-5 h-5' />}
            label='Unique Endpoints'
            value='--'
            color='purple'
          />
        </div>

        {/* Placeholder */}
        <Card className='border-slate-700 bg-slate-800/50'>
          <CardHeader>
            <CardTitle className='text-white'>Dashboard Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='p-6 text-center text-slate-400'>
              <AlertCircle className='w-12 h-12 mx-auto mb-4 text-yellow-500' />
              <p className='text-lg font-medium'>Dashboard Ready</p>
              <p className='text-sm mt-2'>Metrics will appear when backend is connected and running.</p>
              <div className='mt-6 p-4 bg-slate-700/50 rounded border border-slate-600'>
                <p className='text-xs font-mono text-left'>
                  <span className='text-blue-300'>Status:</span> <span className='text-yellow-300'>Waiting for API</span><br/>
                  <span className='text-blue-300'>Route:</span> <span className='text-slate-300'>/dashboard</span><br/>
                  <span className='text-blue-300'>Backend:</span> <span className='text-slate-300'>http://localhost:8000</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
