import { createFileRoute } from '@tanstack/react-router'
import { MotherReports } from '#/components/mother/MotherReports'
import { useAppData } from '#/contexts/AppDataContext'

export const Route = createFileRoute('/app/mae/relatorios')({
  component: MotherReportsPage,
})

function MotherReportsPage() {
  const { activeDaughter } = useAppData()

  return <MotherReports daughter={activeDaughter} />
}
