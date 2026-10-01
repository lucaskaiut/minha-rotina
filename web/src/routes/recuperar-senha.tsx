import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, MailCheck } from 'lucide-react'
import appIcon from '#/assets/images/icon.png'
import { Button } from '#/components/ui/Button'
import { TextInput } from '#/components/ui/Input'
import { authApi } from '#/services/api'

export const Route = createFileRoute('/recuperar-senha')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await authApi.forgotPassword(email.trim())
      setMessage(response.message)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível solicitar a recuperação.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-md ui-card shadow-xl p-7 sm:p-9 space-y-6">
        <div className="text-center space-y-1.5">
          <img
            src={appIcon}
            alt="Minha Rotina"
            className="w-14 h-14 rounded-2xl mx-auto mb-1"
          />
          <h1 className="text-xl font-bold text-[#111827]">Recuperar senha</h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Informe seu e-mail e enviaremos um link para criar uma nova senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="E-mail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu.email@exemplo.com"
            required
          />

          {message && (
            <p className="flex items-start gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-xl px-3.5 py-2.5 animate-fadeIn">
              <MailCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{message}</span>
            </p>
          )}

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
          >
            Enviar link de recuperação
          </Button>
        </form>

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
