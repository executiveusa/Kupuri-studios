/**
 * Usage Analytics & Tracking
 * Monitor user activity and generate insights
 */

export interface UsageEvent {
  userId: string
  event: 'generation' | 'edit' | 'publish' | 'export'
  model?: string
  timestamp: Date
  duration?: number
  cost?: number
}

export class UsageTracker {
  private events: UsageEvent[] = []

  track(event: UsageEvent) {
    this.events.push({
      ...event,
      timestamp: new Date(),
    })
  }

  getUsageByUser(userId: string) {
    return this.events.filter((e) => e.userId === userId)
  }

  getUsageByModel(model: string) {
    return this.events.filter((e) => e.model === model)
  }

  getTotalCost(userId: string) {
    return this.events
      .filter((e) => e.userId === userId)
      .reduce((sum, e) => sum + (e.cost || 0), 0)
  }

  getAverageResponse time(userId: string) {
    const userEvents = this.getUsageByUser(userId).filter((e) => e.duration)
    if (userEvents.length === 0) return 0
    return userEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / userEvents.length
  }

  export() {
    return this.events
  }
}

export const usageTracker = new UsageTracker()
