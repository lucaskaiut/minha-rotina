import type { NotificationRule } from '#/types'

/** Payload enviado ao Laravel ao registrar/atualizar inscrição Web Push. */
export type PushSubscriptionJson = PushSubscriptionJSON

export type PushPlatform = 'ios' | 'android' | 'desktop' | 'unknown'

export type PushDeviceInfo = {
  platform: PushPlatform
  standalone: boolean
  userAgent: string
  language: string
}

export type RegisterPushSubscriptionRequest = {
  subscription: PushSubscriptionJson
  device: PushDeviceInfo
  preferences?: NotificationRule
}

export type PushPreferencesPayload = {
  preferences: NotificationRule
}

export type PushApiErrorCode =
  'NETWORK' | 'BACKEND_UNAVAILABLE' | 'INVALID_RESPONSE' | 'HTTP_ERROR'

export class PushApiError extends Error {
  readonly code: PushApiErrorCode
  readonly status?: number

  constructor(message: string, code: PushApiErrorCode, status?: number) {
    super(message)
    this.name = 'PushApiError'
    this.code = code
    this.status = status
  }
}

export type PushRegistrationState =
  'idle' | 'loading' | 'subscribed' | 'unsubscribed' | 'error'

export type PushReadiness =
  'unsupported' | 'ios-needs-install' | 'permission-denied' | 'ready'
