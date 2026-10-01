import type { PushPlatform, PushReadiness } from '#/services/push/types'

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function detectPlatform(): PushPlatform {
  if (typeof window === 'undefined') return 'unknown'
  if (isIosDevice()) return 'ios'
  if (/android/i.test(navigator.userAgent)) return 'android'
  return 'desktop'
}

/** iOS 16.4+: push só em PWA instalada na Tela de Início. */
export function getPushReadiness(): PushReadiness {
  if (!isPushSupported()) return 'unsupported'
  if (isIosDevice() && !isStandaloneDisplay()) return 'ios-needs-install'
  if (
    typeof Notification !== 'undefined' &&
    Notification.permission === 'denied'
  ) {
    return 'permission-denied'
  }
  return 'ready'
}

export function getNotificationPermission():
  NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}
