import React, { useState } from 'react'
import { X, Check, ArrowRight, ArrowLeft, User, Mail, Lock } from 'lucide-react'
import type { DaughterPayload } from '#/services/api'
import { AVATAR_URLS } from '#/mocks/avatars'
import { Button } from '../ui/Button'
import { TextInput } from '../ui/Input'

interface AddDaughterWizardProps {
  isOpen: boolean
  onClose: () => void
  onAddDaughter: (data: DaughterPayload) => Promise<void>
}

const AVATAR_PRESETS = [
  { url: AVATAR_URLS.laura, label: 'Estilo 1' },
  { url: AVATAR_URLS.sophia, label: 'Estilo 2' },
  { url: AVATAR_URLS.mae, label: 'Estilo 3' },
]

function calculateAge(birthdate: string): number {
  if (!birthdate) return 0
  const birth = new Date(birthdate)
  if (Number.isNaN(birth.getTime())) return 0

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }

  return Math.max(0, age)
}

export const AddDaughterWizard: React.FC<AddDaughterWizardProps> = ({
  isOpen,
  onClose,
  onAddDaughter,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Step 1: Basic Info + acesso
  const [name, setName] = useState('')
  const [birthdate, setBirthdate] = useState('2013-05-14')
  const [schoolGrade, setSchoolGrade] = useState('6º Ano Fundamental')
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0].url)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Step 2: Routine & Habits
  const [wakeUpTime, setWakeUpTime] = useState('07:00')
  const [bedTime, setBedTime] = useState('21:30')
  const [primaryFocus, setPrimaryFocus] = useState('estudos')

  // Step 3: Notifications & Confirmation
  const [allowReminders, setAllowReminders] = useState(true)
  const [celebrateCompletion, setCelebrateCompletion] = useState(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const age = calculateAge(birthdate)
  const canAdvanceStepOne =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    birthdate.length > 0

  const handleNext = async () => {
    setError(null)

    if (currentStep === 1) {
      if (!canAdvanceStepOne) {
        setError(
          'Preencha nome, data de nascimento, e-mail e uma senha com 6+ caracteres.',
        )
        return
      }
      setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
      setCurrentStep(3)
      return
    }

    setIsSubmitting(true)

    try {
      await onAddDaughter({
        name: name.trim(),
        email: email.trim(),
        password,
        birthdate,
        schoolGrade,
        avatarUrl,
      })

      onClose()
      setCurrentStep(1)
      setName('')
      setEmail('')
      setPassword('')
      setBirthdate('2013-05-14')
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível cadastrar a filha.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-lg ui-card shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Step Indicator */}
        <div className="px-6 py-4.5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-[#111827]">
                Cadastrar Filha
              </h3>
              <p className="text-xs text-[#6B7280]">
                Etapa {currentStep} de 3 —{' '}
                {currentStep === 1
                  ? 'Identificação, acesso e perfil'
                  : currentStep === 2
                    ? 'Padrões de Rotina'
                    : 'Preferências e Confirmação'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper bar */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep >= step ? 'bg-[#5B5CE2]' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <TextInput
                label="Nome Completo *"
                placeholder="Ex: Beatriz Lima"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                autoFocus
              />

              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="Data de Nascimento *"
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  helperText={age > 0 ? `${age} anos` : undefined}
                />
                <TextInput
                  label="Ano Escolar"
                  placeholder="Ex: 6º Ano"
                  value={schoolGrade}
                  onChange={(e) => setSchoolGrade(e.target.value)}
                />
              </div>

              <TextInput
                label="E-mail de acesso da filha *"
                type="email"
                placeholder="filha@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                autoComplete="off"
              />

              <TextInput
                label="Senha de acesso da filha *"
                isPassword
                placeholder="Mínimo de 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
              />

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-2">
                  Escolha uma foto ou avatar
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {AVATAR_PRESETS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      className={`p-2 rounded-2xl text-center transition-all ${
                        avatarUrl === preset.url
                          ? 'ui-selected bg-[#EEF0FF]'
                          : 'bg-white shadow-[0_1px_5px_rgb(15_23_42/0.06)] hover:shadow-[0_2px_10px_rgb(15_23_42/0.08)]'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-12 h-12 rounded-full object-cover mx-auto shadow-[0_1px_5px_rgb(15_23_42/0.06)]"
                      />
                      <span className="block text-[10px] font-medium text-[#6B7280] mt-1 truncate">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4.5 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-[#EEF0FF]/60 shadow-[0_2px_12px_rgb(91_92_226/0.1)] text-xs text-[#4A4BCF]">
                💡 <strong>Dica pedagógica:</strong> Estabelecer horários
                consistentes de sono ajuda na autorregulação e energia durante o
                dia escolar.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="Horário de Acordar"
                  type="time"
                  value={wakeUpTime}
                  onChange={(e) => setWakeUpTime(e.target.value)}
                />
                <TextInput
                  label="Horário de Dormir"
                  type="time"
                  value={bedTime}
                  onChange={(e) => setBedTime(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-2">
                  Principal foco de desenvolvimento inicial:
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'estudos',
                      title: 'Foco nos Estudos & Lição de Casa',
                      desc: 'Priorizar horários regulares de aprendizado e tarefas escolares',
                    },
                    {
                      id: 'organizacao',
                      title: 'Organização do Quarto & Casa',
                      desc: 'Incentivar arrumação de cama, brinquedos e mochila',
                    },
                    {
                      id: 'saude',
                      title: 'Saúde, Higiene & Bem-Estar',
                      desc: 'Cuidado com escovação, alimentação e sono saudável',
                    },
                  ].map((focus) => (
                    <button
                      key={focus.id}
                      type="button"
                      onClick={() => setPrimaryFocus(focus.id)}
                      className={`w-full text-left p-3 rounded-2xl transition-all ${
                        primaryFocus === focus.id
                          ? 'ui-selected bg-[#EEF0FF]/40'
                          : 'bg-white shadow-[0_1px_5px_rgb(15_23_42/0.06)] hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-xs font-bold text-[#111827]">
                        {focus.title}
                      </p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {focus.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4.5 animate-fadeIn">
              {/* Summary Card */}
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 shadow-[0_1px_5px_rgb(15_23_42/0.06)]">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-14 h-14 rounded-full object-cover "
                />
                <div>
                  <h4 className="text-sm font-bold text-[#111827]">
                    {name || 'Filha'}
                  </h4>
                  <p className="text-xs text-[#6B7280]">
                    {age} anos · {schoolGrade}
                  </p>
                  <p className="text-[11px] text-[#5B5CE2] font-semibold mt-0.5">
                    Acesso: {email}
                  </p>
                  <p className="text-[11px] text-[#5B5CE2] font-semibold mt-0.5">
                    Rotina: {wakeUpTime} até {bedTime}
                  </p>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 p-3 rounded-2xl shadow-[0_1px_5px_rgb(15_23_42/0.06)] cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={allowReminders}
                    onChange={(e) => setAllowReminders(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#5B5CE2] focus:ring-[#5B5CE2]"
                  />
                  <div>
                    <span className="block text-xs font-bold text-[#111827]">
                      Lembretes gentis no celular dela
                    </span>
                    <span className="block text-[11px] text-[#6B7280] mt-0.5">
                      Notifica {15} minutos antes do início de tarefas
                      importantes.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-2xl shadow-[0_1px_5px_rgb(15_23_42/0.06)] cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={celebrateCompletion}
                    onChange={(e) => setCelebrateCompletion(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#5B5CE2] focus:ring-[#5B5CE2]"
                  />
                  <div>
                    <span className="block text-xs font-bold text-[#111827]">
                      Gamificação com Conquistas & Sequências
                    </span>
                    <span className="block text-[11px] text-[#6B7280] mt-0.5">
                      Habilita pontos, badges e celebrações motivadoras ao
                      concluir.
                    </span>
                  </div>
                </label>
              </div>

              {error && (
                <p className="text-xs font-medium text-[#EF4444] bg-rose-50 rounded-xl px-3.5 py-2.5 animate-fadeIn">
                  {error}
                </p>
              )}
            </div>
          )}

          {error && currentStep === 1 && (
            <p className="mt-4 text-xs font-medium text-[#EF4444] bg-rose-50 rounded-xl px-3.5 py-2.5 animate-fadeIn">
              {error}
            </p>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 flex items-center justify-between">
          {currentStep > 1 ? (
            <Button
              variant="ghost"
              size="md"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              disabled={isSubmitting}
            >
              Voltar
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={() => void handleNext()}
            disabled={currentStep === 1 && !canAdvanceStepOne}
            isLoading={isSubmitting}
            rightIcon={
              currentStep === 3 ? (
                <Check className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )
            }
          >
            {currentStep === 3 ? 'Finalizar Cadastro' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
