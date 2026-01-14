/**
 * Voice to Video Route - Kupuri Studios
 * =====================================
 * TanStack Router integration for the Voice-to-Video pipeline
 */

import { createFileRoute } from '@tanstack/react-router'
import VoiceToVideoPage from '@/pages/VoiceToVideoPage'

export const Route = createFileRoute('/voice-to-video')({
  component: VoiceToVideoPage,
})
