import { createFileRoute, Link, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import appIcon from '#/assets/images/icon.png'
import { Button } from '#/components/ui/Button'
import { TextInput } from '#/components/ui/Input'
import { authApi } from '#/services/api'

export const Route = createFileRoute('/redefinir-senha')({
  component: ResetPasswordPage,
})

function useQueryParams(): URLSearchParams {
  const href = useRouterState({ select: (state) => state.location.href })
  const queryString = href.includes('?')
    ? href.slice(href.indexOf('?') + 1)
    : ''
  return new URLSearchParams(queryString)
}

function ResetPasswordPage() {
  const params = useQueryParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = params.get('token') ?? ''

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password !== passwordConfirmation) {
      setError('As senhas não coincidem.')
      return
    }

    setIsLoading(true)

    try {
      await authApi.resetPassword({
        token,
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      })
      setSuccess(true)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível redefinir a senha.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-6 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-md ui-card shadow-xl p-7 sm:p-9 space-y-6">
        <div className="text-center space-y-1.5">
          <img
            src={appIcon}
            alt="Minha Rotina"
            className="w-14 h-14 rounded-2xl mx-auto mb-1"
          />
          <h1 className="text-xl font-bold text-[#111827]">Criar nova senha</h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Defina uma nova senha segura para acessar o Minha Rotina.
          </p>
        </div>

        {success ? (
          <div className="space-y-4 text-center">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-xl px-3.5 py-3">
              <CheckCircle2 className="w-4 h-4" />
              Senha redefinida com sucesso!
            </p>
            <Link
              to="/login"
              className="text-xs font-semibold text-[#5B5CE2] hover:underline"
            >
              Entrar com a nova senha
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!token && (
              <p className="text-xs font-medium text-amber-700 bg-amber-50 rounded-xl px-3.5 py-2.5">
                Link inválido: o token de recuperação não foi encontrado.
                Solicite um novo link.
              </p>
            )}

            <TextInput
              label="E-mail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <TextInput
              label="Nova senha"
              isPassword
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo de 6 caracteres"
              required
            />

            <TextInput
              label="Confirmar nova senha"
              isPassword
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              required
            />

            {error && (
              <p className="text-xs font-medium text-[#EF4444] bg-rose-50 rounded-xl px-3.5 py-2.5 animate-fadeIn">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              disabled={!token}
            >
              Redefinir senha
            </Button>
          </form>
        )}

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B5CE2] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
