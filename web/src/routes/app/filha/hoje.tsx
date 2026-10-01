import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DaughterHome } from '#/components/daughter/DaughterHome'
import { useAppData } from '#/contexts/AppDataContext'

export const Route = createFileRoute('/app/filha/hoje')({
  component: DaughterHomePage,
})

function DaughterHomePage() {
  const navigate = useNavigate()
  const { activeDaughter, tasks, achievements, handleToggleTask } = useAppData()

  return (
    <DaughterHome
      daughter={activeDaughter}
      tasks={tasks}
      achievements={achievements}
      onToggleTask={handleToggleTask}
      onNavigateToProgress={() => navigate({ to: '/app/filha/progresso' })}
      onNavigateToAchievements={() => navigate({ to: '/app/filha/conquistas' })}
    />
  )
}
