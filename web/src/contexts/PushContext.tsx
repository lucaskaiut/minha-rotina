import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { NotificationRule } from '#/types'
import { useAuth } from '#/contexts/AuthContext'
import {
  disableBrowserPush,
  enableBrowserPush,
  getBrowserPushSubscription,
  syncPendingPushRegistrations,
  syncPreferencesWithBackend,
} from '#/services/push/push-client'
import {
  getNotificationPermission,
  getPushReadiness,
} from '#/services/push/capabilities'
import { loadPendingRegistrations } from '#/services/push/push-storage'
import type {
  PushReadiness,
  PushRegistrationState,
} from '#/services/push/types'

type PushContextValue = {
  hydrated: boolean
  readiness: PushReadiness
  permission: NotificationPermission | 'unsupported'
  registrationState: PushRegistrationState
  isSubscribed: boolean
  lastMessage: string | null
  pendingQueueCount: number
  enablePush: (preferences?: NotificationRule) => Promise<void>
  disablePush: () => Promise<void>
  syncPreferences: (preferences: NotificationRule) => Promise<void>
  refresh: () => Promise<void>
}

const PushContext = createContext<PushContextValue | null>(null)

export function PushProvider({ children }: { children: ReactNode }) {
  const { role, isAuthenticated, hydrated: authHydrated } = useAuth()
  const [hydrated, setHydrated] = useState(false)
  const [registrationState, setRegistrationState] =
    useState<PushRegistrationState>('idle')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const [pendingQueueCount, setPendingQueueCount] = useState(0)
  const [readiness, setReadiness] = useState<PushReadiness>('unsupported')
  const [permission, setPermission] = useState<
    NotificationPermission | 'unsupported'
  >('unsupported')

  const refresh = useCallback(async () => {
    setReadiness(getPushReadiness())
    setPermission(getNotificationPermission())
    const sub = await getBrowserPushSubscription()
    setIsSubscribed(Boolean(sub))
    setPendingQueueCount(loadPendingRegistrations().length)
  }, [])

  useEffect(() => {
    if (!authHydrated) return
    void refresh().finally(() => setHydrated(true))
  }, [authHydrated, refresh])

  useEffect(() => {
    if (!isAuthenticated || !authHydrated) return
    void syncPendingPushRegistrations().then(() => refresh())
  }, [isAuthenticated, authHydrated, refresh])

  const enablePush = useCallback(
    async (preferences?: NotificationRule) => {
      if (role !== 'mother' && role !== 'daughter') {
        throw new Error('É necessário estar autenticado.')
      }
      setRegistrationState('loading')
      setLastMessage(null)
      try {
        const result = await enableBrowserPush(preferences)
        setIsSubscribed(true)
        setRegistrationState('subscribed')
        setLastMessage(
          result.sync === 'synced'
            ? 'Notificações ativadas e sincronizadas com o servidor.'
            : 'Notificações ativadas. Sincronização com o Laravel pendente (dados guardados localmente).',
        )
        await refresh()
      } catch (error) {
        setRegistrationState('error')
        throw error
      }
    },
    [role, refresh],
  )

  const disablePush = useCallback(async () => {
    setRegistrationState('loading')
    setLastMessage(null)
    try {
      await disableBrowserPush()
      setIsSubscribed(false)
      setRegistrationState('unsubscribed')
      setLastMessage('Notificações push desativadas neste dispositivo.')
      await refresh()
    } catch (error) {
      setRegistrationState('error')
      throw error
    }
  }, [refresh])

  const syncPreferences = useCallback(
    async (preferences: NotificationRule) => {
      if (role !== 'mother' && role !== 'daughter') return
      const sync = await syncPreferencesWithBackend(preferences)
      setLastMessage(
        sync === 'synced'
          ? 'Preferências de notificação sincronizadas.'
          : 'Preferências salvas localmente até o backend estar disponível.',
      )
    },
    [role],
  )

  const value = useMemo(
    () => ({
      hydrated,
      readiness,
      permission,
      registrationState,
      isSubscribed,
      lastMessage,
      pendingQueueCount,
      enablePush,
      disablePush,
      syncPreferences,
      refresh,
    }),
    [
      hydrated,
      readiness,
      permission,
      registrationState,
      isSubscribed,
      lastMessage,
      pendingQueueCount,
      enablePush,
      disablePush,
      syncPreferences,
      refresh,
    ],
  )

  return <PushContext.Provider value={value}>{children}</PushContext.Provider>
}

export function usePush() {
  const ctx = useContext(PushContext)
  if (!ctx) throw new Error('usePush deve ser usado dentro de PushProvider')
  return ctx
}
