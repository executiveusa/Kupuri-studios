import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '@/components/landing/proper-prompts/LandingPage'

export const Route = createFileRoute('/')({
  component: LandingPage,
})
