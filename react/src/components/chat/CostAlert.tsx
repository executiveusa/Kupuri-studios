import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, TrendingDown, Zap } from 'lucide-react'
import { getUsageStats } from '@/api/model'
import { useNavigate } from '@tanstack/react-router'

interface CostAlertProps {
  budgetLimit?: number
  className?: string
}

export default function CostAlert({ budgetLimit = 50, className = '' }: CostAlertProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [budgetPercent, setBudgetPercent] = useState(0)
  const [spent, setSpent] = useState(0)
  const [isUsingFreeModel, setIsUsingFreeModel] = useState(false)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    const checkBudget = async () => {
      try {
        const stats = await getUsageStats(30) // Check last 30 days
        if (stats.status === 'success' && stats.usage) {
          const totalCost = stats.usage.total_cost || 0
          const percent = (totalCost / budgetLimit) * 100
          
          setBudgetPercent(percent)
          setSpent(totalCost)
          
          // Show alert if over 80% or exceeded
          setShowAlert(percent >= 80)
          
          // Check if using free model
          const freeRequests = stats.usage.free_requests || 0
          const totalRequests = stats.usage.total_requests || 0
          setIsUsingFreeModel(freeRequests > 0 && freeRequests === totalRequests)
        }
      } catch (error) {
        console.error('Failed to check budget:', error)
      }
    }

    checkBudget()
    
    // Check every 5 minutes
    const interval = setInterval(checkBudget, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [budgetLimit])

  const handleSwitchToFree = () => {
    // Logic to switch to free models (Gemini Flash)
    // This would need to be implemented in your config context
    localStorage.setItem('force_free_models', 'true')
    window.location.reload()
  }

  const handleViewUsage = () => {
    navigate({ to: '/settings' })
  }

  // Show free model badge
  if (isUsingFreeModel && budgetPercent < 80) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg text-sm ${className}`}>
        <Zap className="w-4 h-4 text-green-600" />
        <span className="text-green-700 dark:text-green-300">
          {t('chat.costAlert.usingFreeModel')}
        </span>
      </div>
    )
  }

  // Show budget warning/exceeded alert
  if (showAlert) {
    const exceeded = budgetPercent >= 100

    return (
      <Alert 
        variant={exceeded ? 'destructive' : 'default'}
        className={`${className} ${exceeded ? '' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'}`}
      >
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          {exceeded 
            ? t('chat.costAlert.budgetExceeded')
            : t('chat.costAlert.budgetWarning')
          }
        </AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            {exceeded
              ? t('chat.costAlert.budgetExceededMessage')
              : t('chat.costAlert.budgetWarningMessage', {
                  percent: Math.round(budgetPercent),
                  spent: `$${spent.toFixed(2)}`,
                  limit: `$${budgetLimit.toFixed(2)}`
                })
            }
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={exceeded ? 'default' : 'outline'}
              onClick={handleSwitchToFree}
            >
              <TrendingDown className="w-3 h-3 mr-1" />
              {t('chat.costAlert.switchToFree')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleViewUsage}
            >
              {t('chat.costAlert.viewUsage')}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
