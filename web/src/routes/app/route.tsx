import { createFileRoute, Navigate } from '@tanstack/react-router'
import appIcon from '#/assets/images/icon.png'
import { AppDataProvider } from '#/contexts/AppDataContext'
import { useAuth } from '#/contexts/AuthContext'
import { AppShell } from '#/layouts/AppShell'

export const Route = createFileRoute('/app')({
  component: AppRoute,
})

function AppRoute() {
  const { isAuthenticated, hydrated } = useAuth()

  if (!hydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-[#6B7280] text-sm">
        <img
          src={appIcon}
          alt="Minha Rotina"
          className="w-14 h-14 rounded-2xl"
        />
        Carregando…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return (
    <AppDataProvider>
      <AppShell />
    </AppDataProvider>
  )
}
