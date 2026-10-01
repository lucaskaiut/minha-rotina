import { useEffect, useRef, useState } from 'react'
import { Download, PlusSquare, Share, Smartphone } from 'lucide-react'
import { Button } from '#/components/ui/Button'
import { usePwaInstall } from '#/contexts/PwaInstallContext'

type PwaInstallButtonProps = {
  variant?: 'icon' | 'link'
}

export function PwaInstallButton({ variant = 'icon' }: PwaInstallButtonProps) {
  const { ready, canInstall, isInstalled, isIos, install } = usePwaInstall()
  const [open, setOpen] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
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

  const nativeAvailable = canInstall
  const iosHint = !nativeAvailable && isIos

  if (!ready || isInstalled || (!nativeAvailable && !iosHint)) return null

  const handleInstall = async () => {
    setError(null)
    setInstalling(true)

    try {
      const outcome = await install()
      if (outcome === 'unavailable') {
        setError(
          'Não foi possível abrir o instalador. Use o menu do navegador.',
        )
      }
      if (outcome === 'accepted') setOpen(false)
    } catch {
      setError('Não foi possível iniciar a instalação.')
    } finally {
      setInstalling(false)
    }
  }

  const popover = open ? (
    <div
      className={`absolute z-50 w-72 ui-card shadow-xl p-4 space-y-3 animate-fadeIn ${
        variant === 'icon'
          ? 'right-0 top-full mt-2'
          : 'left-1/2 -translate-x-1/2 top-full mt-2'
      }`}
    >
      <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
        <Download className="w-4 h-4 text-[#5B5CE2]" />
        Instalar o Minha Rotina
      </h3>

      {nativeAvailable ? (
        <>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Tenha o app na tela inicial, com acesso rápido e notificações — sem
            precisar abrir o navegador.
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            fullWidth
            isLoading={installing}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => void handleInstall()}
          >
            Instalar aplicativo
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            No iPhone, o Safari não tem um botão automático. Instale em 2
            passos:
          </p>
          <ol className="space-y-2 text-[11px] text-[#111827]">
            <li className="flex items-start gap-2">
              <Share className="w-3.5 h-3.5 text-[#5B5CE2] shrink-0 mt-0.5" />
              <span>
                Toque em <strong>Compartilhar</strong> na barra do Safari.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <PlusSquare className="w-3.5 h-3.5 text-[#5B5CE2] shrink-0 mt-0.5" />
              <span>
                Escolha <strong>Adicionar à Tela de Início</strong> e confirme.
              </span>
            </li>
          </ol>
          <p className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
            <Smartphone className="w-3 h-3" />
            Depois é só abrir pelo ícone instalado.
          </p>
        </>
      )}

      {error && (
        <p className="text-[11px] text-rose-700 bg-rose-50 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
    </div>
  ) : null

  return (
    <div
      className={`relative ${variant === 'link' ? 'flex justify-center' : ''}`}
      ref={containerRef}
    >
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          title="Instalar aplicativo"
          aria-label="Instalar aplicativo"
          aria-expanded={open}
          className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B5CE2] hover:underline"
        >
          <Download className="w-3.5 h-3.5" />
          Instalar aplicativo
        </button>
      )}

      {popover}
    </div>
  )
}
