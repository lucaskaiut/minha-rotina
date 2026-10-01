import { createFileRoute } from '@tanstack/react-router'
import { MotherTasks } from '#/components/mother/MotherTasks'
import { useAppData } from '#/contexts/AppDataContext'

export const Route = createFileRoute('/app/mae/tarefas')({
  component: MotherTasksPage,
})

function MotherTasksPage() {
  const {
    tasks,
    daughters,
    openCreateTask,
    openEditTask,
    handleDuplicateTask,
    handleDeleteTask,
    handleToggleTask,
  } = useAppData()

  return (
    <MotherTasks
      tasks={tasks}
      daughters={daughters}
      onOpenCreate={openCreateTask}
      onEdit={openEditTask}
      onDuplicate={handleDuplicateTask}
      onDelete={handleDeleteTask}
      onToggleComplete={handleToggleTask}
    />
  )
}
