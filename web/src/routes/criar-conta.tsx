import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, UserPlus } from 'lucide-react'
import appIcon from '#/assets/images/icon.png'
import { Button } from '#/components/ui/Button'
import { TextInput } from '#/components/ui/Input'
import { useAuth } from '#/contexts/AuthContext'
import { ApiError, authApi } from '#/services/api'

export const Route = createFileRoute('/criar-conta')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()

  const [name, setName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string | undefined>
  >({})

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    if (password !== passwordConfirmation) {
      setError('As senhas não coincidem.')
      return
    }

    setIsLoading(true)

    try {
      await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        family_name: familyName.trim() || undefined,
      })
      await refresh()
      navigate({ to: '/app/mae/dashboard' })
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message)
        setFieldErrors({
          name: submitError.fieldError('name'),
          email: submitError.fieldError('email'),
          password: submitError.fieldError('password'),
        })
      } else {
        setError('Não foi possível criar a conta.')
      }
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
          <h1 className="text-xl font-bold text-[#111827]">
            Criar conta da família
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            A conta da mãe responsável gerencia as filhas, tarefas e
            notificações.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Seu nome *"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex: Renata Oliveira"
            errorMessage={fieldErrors.name}
            leftIcon={<UserPlus className="w-4 h-4" />}
            required
          />

          <TextInput
            label="Nome da família (opcional)"
            value={familyName}
            onChange={(event) => setFamilyName(event.target.value)}
            placeholder="Ex: Família Oliveira"
          />

          <TextInput
            label="E-mail *"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu.email@exemplo.com"
            errorMessage={fieldErrors.email}
            required
          />

          <TextInput
            label="Senha *"
            isPassword
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo de 6 caracteres"
            errorMessage={fieldErrors.password}
            required
          />

          <TextInput
            label="Confirmar senha *"
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
          >
            Criar conta
          </Button>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B5CE2] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Já tenho conta
          </Link>
        </div>
      </div>
    </div>
  )
}
