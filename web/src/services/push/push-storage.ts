import type { RegisterPushSubscriptionRequest } from '#/services/push/types'

const PENDING_KEY = 'minha-rotina:push-pending-registrations'
const LOCAL_SUB_KEY = 'minha-rotina:push-last-registration'

export function loadPendingRegistrations(): RegisterPushSubscriptionRequest[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(PENDING_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RegisterPushSubscriptionRequest[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePendingRegistrations(
  items: RegisterPushSubscriptionRequest[],
): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(items))
}

export function queuePendingRegistration(
  payload: RegisterPushSubscriptionRequest,
): void {
  const existing = loadPendingRegistrations()
  const filtered = existing.filter(
    (item) => item.subscription.endpoint !== payload.subscription.endpoint,
  )
  savePendingRegistrations([payload, ...filtered])
}

export function clearPendingRegistration(endpoint: string): void {
  savePendingRegistrations(
    loadPendingRegistrations().filter(
      (item) => item.subscription.endpoint !== endpoint,
    ),
  )
}

export function saveLocalRegistrationSnapshot(
  payload: RegisterPushSubscriptionRequest,
): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_SUB_KEY, JSON.stringify(payload))
}

export function loadLocalRegistrationSnapshot(): RegisterPushSubscriptionRequest | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LOCAL_SUB_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RegisterPushSubscriptionRequest
  } catch {
    return null
  }
}

export function clearLocalRegistrationSnapshot(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(LOCAL_SUB_KEY)
}
