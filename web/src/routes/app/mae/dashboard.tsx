import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { MotherDashboard } from '#/components/mother/MotherDashboard'
import { useAppData } from '#/contexts/AppDataContext'

export const Route = createFileRoute('/app/mae/dashboard')({
  component: MotherDashboardPage,
})

function MotherDashboardPage() {
  const navigate = useNavigate()
  const {
    activeDaughter,
    tasks,
    daughters,
    setSelectedDaughterId,
    openCreateTask,
    handleToggleTask,
    openEditTask,
    weeklyReports,
    summary,
  } = useAppData()

  return (
    <MotherDashboard
      daughter={activeDaughter}
      tasks={tasks}
      allDaughters={daughters}
      onSelectDaughter={setSelectedDaughterId}
      onOpenCreateTask={openCreateTask}
      onToggleTask={handleToggleTask}
      onEditTask={openEditTask}
      weeklyReports={weeklyReports}
      summary={summary}
      onNavigateToTab={(tab) => {
        const map = {
          tasks: '/app/mae/tarefas',
          daughters: '/app/mae/filhas',
          reports: '/app/mae/relatorios',
          notifications: '/app/mae/notificacoes',
        } as const
        navigate({ to: map[tab] })
      }}
    />
  )
}
