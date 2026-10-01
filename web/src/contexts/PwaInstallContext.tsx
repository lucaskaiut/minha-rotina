import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { isIosDevice, isStandaloneDisplay } from '#/services/push/capabilities'

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

declare global {
  interface Window {
    __mrInstallPrompt?: BeforeInstallPromptEvent | null
  }
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

type PwaInstallContextValue = {
  ready: boolean
  canInstall: boolean
  isInstalled: boolean
  isIos: boolean
  install: () => Promise<InstallOutcome>
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null)

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    const sync = () => {
      setPromptEvent(window.__mrInstallPrompt ?? null)
      setIsInstalled(isStandaloneDisplay())
    }

    setIsIos(isIosDevice())
    sync()
    setReady(true)

    const handleInstalled = () => {
      window.__mrInstallPrompt = null
      setPromptEvent(null)
      setIsInstalled(true)
    }

    window.addEventListener('mr:install-available', sync)
    window.addEventListener('mr:installed', handleInstalled)

    const media = window.matchMedia('(display-mode: standalone)')
    media.addEventListener('change', sync)

    return () => {
      window.removeEventListener('mr:install-available', sync)
      window.removeEventListener('mr:installed', handleInstalled)
      media.removeEventListener('change', sync)
    }
  }, [])

  const install = useCallback(async (): Promise<InstallOutcome> => {
    const event = window.__mrInstallPrompt ?? promptEvent
    if (!event) return 'unavailable'

    await event.prompt()
    const choice = await event.userChoice

    window.__mrInstallPrompt = null
    setPromptEvent(null)

    if (choice.outcome === 'accepted') {
      setIsInstalled(true)
    }

    return choice.outcome
  }, [promptEvent])

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      ready,
      canInstall: Boolean(promptEvent) && !isInstalled,
      isInstalled,
      isIos,
      install,
    }),
    [ready, promptEvent, isInstalled, isIos, install],
  )

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
    </PwaInstallContext.Provider>
  )
}

export function usePwaInstall() {
  const ctx = useContext(PwaInstallContext)
  if (!ctx)
    throw new Error('usePwaInstall deve ser usado dentro de PwaInstallProvider')
  return ctx
}
