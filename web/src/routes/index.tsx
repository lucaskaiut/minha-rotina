import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth } from '#/contexts/AuthContext'

export const Route = createFileRoute('/')({
  component: HomeRedirect,
})

function HomeRedirect() {
  const { isAuthenticated, hydrated, role } = useAuth()

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#6B7280] text-sm">
        Carregando…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return (
    <Navigate
      to={role === 'daughter' ? '/app/filha/hoje' : '/app/mae/dashboard'}
    />
  )
}
