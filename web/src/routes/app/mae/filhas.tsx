import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { MotherDaughters } from '#/components/mother/MotherDaughters'
import { useAppData } from '#/contexts/AppDataContext'

export const Route = createFileRoute('/app/mae/filhas')({
  component: MotherDaughtersPage,
})

function MotherDaughtersPage() {
  const navigate = useNavigate()
  const {
    daughters,
    tasks,
    openAddDaughter,
    setSelectedDaughterId,
    handleToggleDaughterStatus,
  } = useAppData()

  return (
    <MotherDaughters
      daughters={daughters}
      tasks={tasks}
      onOpenWizard={openAddDaughter}
      onSelectDaughterToView={(id) => {
        setSelectedDaughterId(id)
        navigate({ to: '/app/mae/relatorios' })
      }}
      onToggleDaughterStatus={handleToggleDaughterStatus}
      onEditDaughter={(d) => {
        setSelectedDaughterId(d.id)
        navigate({ to: '/app/mae/dashboard' })
      }}
    />
  )
}
