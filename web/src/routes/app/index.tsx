import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth } from '#/contexts/AuthContext'

export const Route = createFileRoute('/app/')({
  component: AppIndex,
})

function AppIndex() {
  const { role } = useAuth()
  return (
    <Navigate
      to={role === 'daughter' ? '/app/filha/hoje' : '/app/mae/dashboard'}
    />
  )
}
