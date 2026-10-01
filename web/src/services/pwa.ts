let registrationRequest: Promise<ServiceWorkerRegistration | undefined> | null =
  null

/**
 * Garante o registro do service worker (dev e produção).
 * O VitePWA serve o SW de desenvolvimento em /dev-sw.js; em produção, /sw.js.
 */
export function ensureServiceWorkerRegistration(): Promise<
  ServiceWorkerRegistration | undefined
> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(undefined)
  }

  if (!registrationRequest) {
    // Registrar sempre (mesmo com SW ativo) dispara a checagem de atualização,
    // evitando que um service worker antigo sirva bundles desatualizados.
    registrationRequest = (
      import.meta.env.DEV
        ? navigator.serviceWorker.register('/dev-sw.js?dev-sw', {
            type: 'module',
            scope: '/',
          })
        : navigator.serviceWorker.register('/sw.js', { scope: '/' })
    ).catch(() => navigator.serviceWorker.getRegistration())
  }

  return registrationRequest
}
