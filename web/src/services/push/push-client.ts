import type { NotificationRule } from '#/types'
import {
  detectPlatform,
  getNotificationPermission,
  isPushSupported,
  isStandaloneDisplay,
} from '#/services/push/capabilities'
import {
  fetchVapidPublicKey,
  registerPushSubscription,
  syncPushPreferences,
  unregisterPushSubscription,
} from '#/services/push/push-api'
import {
  clearLocalRegistrationSnapshot,
  clearPendingRegistration,
  loadLocalRegistrationSnapshot,
  loadPendingRegistrations,
  queuePendingRegistration,
  saveLocalRegistrationSnapshot,
} from '#/services/push/push-storage'
import { ensureServiceWorkerRegistration } from '#/services/pwa'
import type { RegisterPushSubscriptionRequest } from '#/services/push/types'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

function buildDeviceInfo() {
  return {
    platform: detectPlatform(),
    standalone: isStandaloneDisplay(),
    userAgent: navigator.userAgent,
    language: navigator.language,
  }
}

function buildRegistrationPayload(
  subscription: PushSubscription,
  preferences?: NotificationRule,
): RegisterPushSubscriptionRequest {
  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys) {
    throw new Error('Inscrição push incompleta.')
  }
  return {
    subscription: json,
    device: buildDeviceInfo(),
    preferences,
  }
}

async function persistRegistration(
  payload: RegisterPushSubscriptionRequest,
): Promise<'synced' | 'queued'> {
  try {
    await registerPushSubscription(payload)
    clearPendingRegistration(payload.subscription.endpoint ?? '')
    saveLocalRegistrationSnapshot(payload)
    return 'synced'
  } catch {
    queuePendingRegistration(payload)
    saveLocalRegistrationSnapshot(payload)
    return 'queued'
  }
}

export async function getBrowserPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null

  // Não aguarda "serviceWorker.ready" (fica pendurado sem SW registrado).
  const registration = await navigator.serviceWorker.getRegistration()
  return registration ? registration.pushManager.getSubscription() : null
}

export async function enableBrowserPush(
  preferences?: NotificationRule,
): Promise<{ subscription: PushSubscription; sync: 'synced' | 'queued' }> {
  if (!isPushSupported()) {
    throw new Error('Este dispositivo não suporta notificações push.')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error(
      'Permissão negada. No iPhone, instale o app na Tela de Início e tente novamente.',
    )
  }

  const registration = await ensureServiceWorkerRegistration()
  if (!registration) {
    throw new Error(
      'Não foi possível registrar o service worker para notificações.',
    )
  }

  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    const publicKey = await fetchVapidPublicKey()
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const payload = buildRegistrationPayload(subscription, preferences)
  const sync = await persistRegistration(payload)
  return { subscription, sync }
}

export async function disableBrowserPush(): Promise<void> {
  if (!isPushSupported()) return

  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) {
    clearLocalRegistrationSnapshot()
    return
  }

  const subscription = await registration.pushManager.getSubscription()
  const endpoint = subscription?.endpoint

  if (subscription) {
    await subscription.unsubscribe()
  }

  if (endpoint) {
    try {
      await unregisterPushSubscription(endpoint)
    } catch {
      /* backend offline */
    }
    clearPendingRegistration(endpoint)
  }

  clearLocalRegistrationSnapshot()
}

export async function syncPreferencesWithBackend(
  preferences: NotificationRule,
): Promise<'synced' | 'queued'> {
  try {
    await syncPushPreferences({ preferences })
    return 'synced'
  } catch {
    const snapshot = loadLocalRegistrationSnapshot()
    if (snapshot) {
      queuePendingRegistration({ ...snapshot, preferences })
    }
    return 'queued'
  }
}

export async function syncPendingPushRegistrations(): Promise<{
  synced: number
  failed: number
}> {
  const pending = loadPendingRegistrations()
  if (pending.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const item of pending) {
    try {
      await registerPushSubscription(item)
      clearPendingRegistration(item.subscription.endpoint ?? '')
      synced += 1
    } catch {
      failed += 1
    }
  }

  return { synced, failed: failed || pending.length - synced }
}

export function getPushClientStatus() {
  return {
    supported: isPushSupported(),
    permission: getNotificationPermission(),
  }
}
