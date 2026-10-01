import { createFileRoute } from '@tanstack/react-router'
import { DaughterProgress } from '#/components/daughter/DaughterProgress'
import { useAppData } from '#/contexts/AppDataContext'

export const Route = createFileRoute('/app/filha/progresso')({
  component: DaughterProgressPage,
})

function DaughterProgressPage() {
  const { activeDaughter, tasks, weeklyReports, pointsSummary } = useAppData()

  return (
    <DaughterProgress
      daughter={activeDaughter}
      tasks={tasks}
      weeklyReports={weeklyReports}
      pointsSummary={pointsSummary}
    />
  )
}
