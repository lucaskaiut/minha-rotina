import { PushApiError } from '#/services/push/types'
import type {
  PushApiErrorCode,
  PushPreferencesPayload,
  RegisterPushSubscriptionRequest,
} from '#/services/push/types'

/**
 * Endpoints Laravel (Web Push + filas):
 *
 * GET    /api/v1/push/vapid-public-key  -> { publicKey: string }
 * POST   /api/v1/push/subscriptions     -> RegisterPushSubscriptionRequest
 * DELETE /api/v1/push/subscriptions     -> { endpoint: string }
 * PUT    /api/v1/push/preferences       -> PushPreferencesPayload
 *
 * O usuário é identificado pelo token (Bearer/HttpOnly), sem IDs no payload.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
const PUSH_PREFIX = `${API_BASE}/api/v1/push`

function apiUrl(path: string): string {
  return `${PUSH_PREFIX}${path}`
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) return {} as T
  try {
    return JSON.parse(text) as T
  } catch {
    throw new PushApiError(
      'Resposta inválida do servidor.',
      'INVALID_RESPONSE',
      response.status,
    )
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(apiUrl(path), {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })

    if (!response.ok) {
      throw new PushApiError(
        `Erro HTTP ${response.status} ao comunicar com a API de push.`,
        'HTTP_ERROR',
        response.status,
      )
    }

    return parseJson<T>(response)
  } catch (error) {
    if (error instanceof PushApiError) throw error
    throw new PushApiError(
      'Backend indisponível. A inscrição será guardada localmente até a sincronização.',
      'BACKEND_UNAVAILABLE',
    )
  }
}

export async function fetchVapidPublicKey(): Promise<string> {
  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (envKey?.trim()) return envKey.trim()

  const data = await request<{ publicKey?: string }>('/vapid-public-key', {
    method: 'GET',
  })
  if (!data.publicKey) {
    throw new PushApiError(
      'API não retornou a chave VAPID pública.',
      'INVALID_RESPONSE',
    )
  }
  return data.publicKey
}

export async function registerPushSubscription(
  payload: RegisterPushSubscriptionRequest,
): Promise<void> {
  await request('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function unregisterPushSubscription(
  endpoint: string,
): Promise<void> {
  await request('/subscriptions', {
    method: 'DELETE',
    body: JSON.stringify({ endpoint }),
  })
}

export async function syncPushPreferences(
  payload: PushPreferencesPayload,
): Promise<void> {
  await request('/preferences', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function flushPendingRegistrations(
  items: RegisterPushSubscriptionRequest[],
): Promise<{ synced: number; failed: number }> {
  let synced = 0
  let failed = 0
  for (const item of items) {
    try {
      await registerPushSubscription(item)
      synced += 1
    } catch {
      failed += 1
    }
  }
  return { synced, failed }
}

export { PushApiError }
export type { PushApiErrorCode }
