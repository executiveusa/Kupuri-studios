import { createFileRoute } from '@tanstack/react-router'
import SkillsSearch from '@/components/skills/SkillsSearch'

export const Route = createFileRoute('/skills')({
  component: SkillsPage,
})

function SkillsPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        <SkillsSearch />
      </div>
    </div>
  )
}
