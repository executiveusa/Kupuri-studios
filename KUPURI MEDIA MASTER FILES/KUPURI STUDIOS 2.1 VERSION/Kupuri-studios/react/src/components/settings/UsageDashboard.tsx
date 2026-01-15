import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Download, TrendingDown, DollarSign, Zap, AlertCircle } from 'lucide-react'
import { BASE_API_URL } from '@/constants'
import { toast } from 'sonner'

interface UsageStats {
  total_cost: number
  total_requests: number
  free_requests: number
  by_model: Record<string, {
    requests: number
    cost: number
    is_free?: boolean
  }>
  estimated_savings: number
  budget_limit?: number
  budget_used_percent?: number
}

export default function UsageDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  const fetchUsage = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${BASE_API_URL}/api/litellm/usage?days=${days}`)
      const data = await response.json()
      
      if (data.status === 'success' || data.status === 'partial') {
        // Transform usage data
        const usage = data.usage || {}
        const byModel: Record<string, any> = {}
        
        // Process model-level data if available
        if (usage.models) {
          Object.entries(usage.models).forEach(([model, modelData]: [string, any]) => {
            byModel[model] = {
              requests: modelData.requests || 0,
              cost: modelData.cost || 0,
              is_free: modelData.is_free || false
            }
          })
        }
        
        setStats({
          total_cost: usage.total_cost || 0,
          total_requests: usage.total_requests || usage.requests || 0,
          free_requests: usage.free_requests || 0,
          by_model: byModel,
          estimated_savings: data.savings_via_free_tier?.estimated_savings_usd || 0,
          budget_limit: usage.budget_limit,
          budget_used_percent: usage.budget_limit 
            ? (usage.total_cost / usage.budget_limit) * 100 
            : undefined
        })
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error)
      toast.error(t('settings.usage.fetchError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsage()
  }, [days])

  const exportCSV = () => {
    if (!stats) return
    
    const rows = [
      ['Model', 'Requests', 'Cost (USD)', 'Free Tier'],
      ...Object.entries(stats.by_model).map(([model, data]) => [
        model,
        data.requests.toString(),
        data.cost.toFixed(4),
        data.is_free ? 'Yes' : 'No'
      ])
    ]
    
    const csv = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kupuri-usage-${days}days.csv`
    a.click()
    
    toast.success(t('settings.usage.exportSuccess'))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.usage.title')}</CardTitle>
          <CardDescription>{t('settings.usage.loading')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-32 animate-pulse bg-muted rounded-md" />
          <div className="h-32 animate-pulse bg-muted rounded-md" />
        </CardContent>
      </Card>
    )
  }

  const savingsPercent = stats?.total_cost 
    ? Math.round((stats.estimated_savings / (stats.total_cost + stats.estimated_savings)) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header with time period selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('settings.usage.title')}</CardTitle>
              <CardDescription>{t('settings.usage.description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value={1}>{t('settings.usage.periods.day')}</option>
                <option value={7}>{t('settings.usage.periods.week')}</option>
                <option value={30}>{t('settings.usage.periods.month')}</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                disabled={!stats || Object.keys(stats.by_model).length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                {t('settings.usage.export')}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('settings.usage.totalCost')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.total_cost.toFixed(4) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total_requests || 0} {t('settings.usage.requests')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('settings.usage.savings')}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats?.estimated_savings.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {savingsPercent}% {t('settings.usage.costReduction')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('settings.usage.freeRequests')}
            </CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.free_requests || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('settings.usage.geminiFreeTier')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Alert */}
      {stats?.budget_limit && stats?.budget_used_percent !== undefined && stats.budget_used_percent > 80 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-sm">{t('settings.usage.budgetAlert')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={stats.budget_used_percent} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              ${stats.total_cost.toFixed(2)} / ${stats.budget_limit.toFixed(2)} ({stats.budget_used_percent.toFixed(0)}%)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Model Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.usage.byModel')}</CardTitle>
          <CardDescription>{t('settings.usage.modelBreakdown')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!stats || Object.keys(stats.by_model).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('settings.usage.noData')}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.by_model)
                .sort(([, a], [, b]) => b.requests - a.requests)
                .map(([model, data]) => (
                  <div key={model} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{model}</span>
                          {data.is_free && (
                            <Badge variant="secondary" className="text-xs">
                              {t('settings.usage.free')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {data.requests} {t('settings.usage.requests')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {data.is_free ? (
                            <span className="text-green-600">$0.00</span>
                          ) : (
                            <span>${data.cost.toFixed(4)}</span>
                          )}
                        </div>
                        {!data.is_free && data.cost > 0 && (
                          <p className="text-xs text-muted-foreground">
                            ${(data.cost / data.requests).toFixed(6)}/req
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {t('settings.usage.tipsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• {t('settings.usage.tip1')}</p>
          <p>• {t('settings.usage.tip2')}</p>
          <p>• {t('settings.usage.tip3')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
