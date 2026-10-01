import { useEffect, useRef, useState } from 'react'
import { Bell, BellOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '#/components/ui/Button'
import { usePush } from '#/contexts/PushContext'
import type { NotificationRule } from '#/types'

type PushToggleProps = {
  preferences?: NotificationRule
}

export function PushToggle({ preferences }: PushToggleProps) {
  const {
    hydrated,
    readiness,
    permission,
    isSubscribed,
    registrationState,
    lastMessage,
    pendingQueueCount,
    enablePush,
    disablePush,
  } = usePush()

  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const loading = registrationState === 'loading'
  const blockedByReadiness =
    readiness === 'unsupported' ||
    readiness === 'ios-needs-install' ||
    readiness === 'permission-denied'
  const Icon = isSubscribed ? Bell : BellOff

  const handleEnable = async () => {
    setError(null)
    try {
      await enablePush(preferences)
    } catch (enableError) {
      setError(
        enableError instanceof Error
          ? enableError.message
          : 'Não foi possível ativar as notificações.',
      )
    }
  }

  const handleDisable = async () => {
    setError(null)
    try {
      await disablePush()
    } catch (disableError) {
      setError(
        disableError instanceof Error
          ? disableError.message
          : 'Não foi possível desativar as notificações.',
      )
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        title={isSubscribed ? 'Notificações push ativas' : 'Notificações push'}
        aria-label="Configurar notificações push"
        aria-expanded={open}
        className="relative p-2 text-[#6B7280] hover:text-[#111827] hover:bg-slate-100 rounded-xl transition-colors"
      >
        <Icon className="w-4 h-4" />
        {isSubscribed && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 z-50 ui-card shadow-xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#5B5CE2]" />
              Notificações push
            </h3>
            {isSubscribed ? (
              <span className="ui-chip bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Ativas
              </span>
            ) : (
              <span className="ui-chip bg-slate-100 text-[#6B7280] text-[11px] font-bold px-2 py-0.5 shrink-0">
                Inativas
              </span>
            )}
          </div>

          {!hydrated && (
            <p className="text-xs text-[#6B7280]">
              Verificando suporte do dispositivo…
            </p>
          )}

          {hydrated && readiness === 'unsupported' && (
            <div className="flex gap-2 p-3 rounded-2xl bg-rose-50 text-rose-900 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>
                Este navegador não suporta Web Push. Use Safari (iOS 16.4+) ou
                Chrome no Android.
              </p>
            </div>
          )}

          {hydrated && readiness === 'ios-needs-install' && (
            <div className="p-3 rounded-2xl bg-[#EEF0FF] text-[11px] text-[#4A4BCF] leading-relaxed">
              No iPhone, instale o Minha Rotina na Tela de Início (Safari →
              Compartilhar → Adicionar à Tela de Início) e ative por lá.
            </div>
          )}

          {hydrated && readiness === 'permission-denied' && (
            <div className="flex gap-2 p-3 rounded-2xl bg-amber-50 text-amber-950 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>
                Permissão bloqueada no navegador. Libere os alertas nas
                configurações do dispositivo.
              </p>
            </div>
          )}

          {hydrated && !blockedByReadiness && (
            <div>
              {isSubscribed ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  fullWidth
                  isLoading={loading}
                  leftIcon={<BellOff className="w-3.5 h-3.5" />}
                  onClick={() => void handleDisable()}
                >
                  Desativar neste dispositivo
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  fullWidth
                  isLoading={loading}
                  leftIcon={<Bell className="w-3.5 h-3.5" />}
                  onClick={() => void handleEnable()}
                >
                  Ativar neste dispositivo
                </Button>
              )}
            </div>
          )}

          {hydrated && (
            <p className="text-[10px] text-[#6B7280]">
              Permissão do sistema:{' '}
              <strong className="text-[#111827]">
                {permission === 'unsupported' ? 'indisponível' : permission}
              </strong>
            </p>
          )}

          {pendingQueueCount > 0 && (
            <p className="text-[11px] text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
              {pendingQueueCount} registro(s) aguardando o servidor.
            </p>
          )}

          {lastMessage && (
            <p className="text-[11px] text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
              {lastMessage}
            </p>
          )}

          {error && (
            <p className="text-[11px] text-rose-700 bg-rose-50 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
