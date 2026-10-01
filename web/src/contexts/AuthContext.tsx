import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { AuthUser, UserRole } from '#/types'
import { authApi } from '#/services/api'

const USER_CACHE_KEY = 'minha-rotina:user'

type AuthContextValue = {
  user: AuthUser | null
  role: UserRole
  isAuthenticated: boolean
  hydrated: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(USER_CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function writeCachedUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return
  if (user) {
    window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
  } else {
    window.localStorage.removeItem(USER_CACHE_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const applyUser = useCallback((next: AuthUser | null) => {
    setUser(next)
    writeCachedUser(next)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const { user: current } = await authApi.me()
      applyUser(current)
    } catch {
      applyUser(null)
    }
  }, [applyUser])

  useEffect(() => {
    const cached = readCachedUser()
    if (cached) setUser(cached)

    void refresh().finally(() => setHydrated(true))
  }, [refresh])

  useEffect(() => {
    const handleUnauthorized = () => applyUser(null)
    window.addEventListener('mr:unauthorized', handleUnauthorized)
    return () =>
      window.removeEventListener('mr:unauthorized', handleUnauthorized)
  }, [applyUser])

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: authenticated } = await authApi.login(email, password)
      applyUser(authenticated)
      return authenticated
    },
    [applyUser],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      /* token já pode estar inválido */
    }
    applyUser(null)
  }, [applyUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? 'guest',
      isAuthenticated: Boolean(user),
      hydrated,
      login,
      logout,
      refresh,
    }),
    [user, hydrated, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
