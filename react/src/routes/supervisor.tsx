/**
 * Supervisor Route - Kupuri Studios
 * ==================================
 * TanStack Router integration for the Lightning Orchestrator Supervisor Dashboard
 */

import { createFileRoute } from '@tanstack/react-router'
import SupervisorDashboard from '@/components/dashboard/SupervisorDashboard'

export const Route = createFileRoute('/supervisor')({
  component: SupervisorDashboard,
})
