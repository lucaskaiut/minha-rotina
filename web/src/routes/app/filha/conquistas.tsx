import { createFileRoute } from '@tanstack/react-router'
import { DaughterAchievements } from '#/components/daughter/DaughterAchievements'
import { useAppData } from '#/contexts/AppDataContext'

export const Route = createFileRoute('/app/filha/conquistas')({
  component: DaughterAchievementsPage,
})

function DaughterAchievementsPage() {
  const { achievements } = useAppData()

  return <DaughterAchievements achievements={achievements} />
}
