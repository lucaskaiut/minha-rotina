import React, { useState } from 'react'
import { ArrowRight, ShieldCheck, Bug } from 'lucide-react'
import appLogo from '#/assets/images/logo.png'
import { PwaInstallButton } from '#/components/common/PwaInstallButton'
import { Link } from '@tanstack/react-router'
import { Button } from '../ui/Button'
import { TextInput } from '../ui/Input'

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>
  onForgotPassword: (email: string) => Promise<string>
  onDebugLogin: (role: 'mother' | 'daughter') => Promise<void>
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  onForgotPassword,
  onDebugLogin,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFeedback(null)
    setIsLoading(true)

    try {
      await onLogin(email.trim(), password)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível entrar.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError(null)
    setFeedback(null)

    if (!email.trim()) {
      setError('Informe seu e-mail para receber as instruções de recuperação.')
      return
    }

    try {
      const message = await onForgotPassword(email.trim())
      setFeedback(message)
    } catch (forgotError) {
      setError(
        forgotError instanceof Error
          ? forgotError.message
          : 'Não foi possível enviar o e-mail de recuperação.',
      )
    }
  }

  const handleDebugLogin = async (target: 'mother' | 'daughter') => {
    setError(null)
    setFeedback(null)
    setIsLoading(true)

    try {
      await onDebugLogin(target)
    } catch (debugError) {
      setError(
        debugError instanceof Error
          ? debugError.message
          : 'Falha no login de demonstração.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-md ui-card shadow-xl p-7 sm:p-9 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img
            src={appLogo}
            alt="Minha Rotina"
            className="h-32 sm:h-36 w-auto mx-auto"
          />
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Organização familiar que constrói autonomia e disciplina com afeto
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.email@exemplo.com"
            autoComplete="email"
            required
          />

          <div>
            <TextInput
              label="Senha"
              isPassword
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha secreta"
              autoComplete="current-password"
              required
            />
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 text-xs text-[#6B7280] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#5B5CE2] focus:ring-[#5B5CE2]"
                />
                Lembrar deste dispositivo
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-semibold text-[#5B5CE2] hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-[#EF4444] bg-rose-50 rounded-xl px-3.5 py-2.5 animate-fadeIn">
              {error}
            </p>
          )}

          {feedback && (
            <p className="text-xs font-medium text-emerald-700 bg-emerald-50 rounded-xl px-3.5 py-2.5 animate-fadeIn">
              {feedback}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Entrar
          </Button>
        </form>

        {import.meta.env.DEV && (
          <div className="pt-2 space-y-2.5">
            <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-amber-700/90 flex items-center justify-center gap-1.5">
              <Bug className="w-3 h-3" />
              Debug · contas de demonstração
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                fullWidth
                disabled={isLoading}
                onClick={() => void handleDebugLogin('mother')}
              >
                Login mãe
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth
                disabled={isLoading}
                onClick={() => void handleDebugLogin('daughter')}
              >
                Login filha
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/recuperar-senha"
            className="text-xs font-semibold text-[#5B5CE2] hover:underline"
          >
            Recuperar senha
          </Link>
          <span className="text-slate-300" aria-hidden="true">
            ·
          </span>
          <Link
            to="/criar-conta"
            className="text-xs font-semibold text-[#5B5CE2] hover:underline"
          >
            Criar conta da família
          </Link>
        </div>

        <PwaInstallButton variant="link" />

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6B7280] pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Conexão segura · Token protegido em cookie HttpOnly</span>
        </div>
      </div>
    </div>
  )
}
