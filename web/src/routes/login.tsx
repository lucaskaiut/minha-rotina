import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LoginView } from '#/components/auth/LoginView'
import { useAuth } from '#/contexts/AuthContext'
import { authApi } from '#/services/api'
import { useEffect } from 'react'
import type { AuthUser } from '#/types'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

const DEMO_ACCOUNTS = {
  mother: { email: 'renata@familia.com', password: 'rotina123' },
  daughter: { email: 'laura@familia.com', password: 'rotina123' },
} as const

function homeFor(user: AuthUser): '/app/filha/hoje' | '/app/mae/dashboard' {
  return user.role === 'daughter' ? '/app/filha/hoje' : '/app/mae/dashboard'
}

function LoginPage() {
  const { login, isAuthenticated, hydrated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !user) return
    navigate({ to: homeFor(user) })
  }, [hydrated, isAuthenticated, user, navigate])

  return (
    <LoginView
      onLogin={async (email, password) => {
        const authenticated = await login(email, password)
        navigate({ to: homeFor(authenticated) })
      }}
      onForgotPassword={async (email) => {
        const { message } = await authApi.forgotPassword(email)
        return message
      }}
      onDebugLogin={async (role) => {
        const account = DEMO_ACCOUNTS[role]
        const authenticated = await login(account.email, account.password)
        navigate({ to: homeFor(authenticated) })
      }}
    />
  )
}
