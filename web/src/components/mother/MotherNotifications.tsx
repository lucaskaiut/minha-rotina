import React, { useState } from 'react'
import { Bell, Clock, Smartphone, Check, Send, ShieldCheck } from 'lucide-react'
import type { NotificationRule, NotificationItem } from '../../types'
import { Button } from '../ui/Button'
import { TextInput } from '../ui/Input'
import { usePush } from '#/contexts/PushContext'

interface MotherNotificationsProps {
  rule: NotificationRule
  onUpdateRule: (updated: NotificationRule) => void
  onSendTestNotification: (
    item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>,
  ) => void
}

export const MotherNotifications: React.FC<MotherNotificationsProps> = ({
  rule,
  onUpdateRule,
  onSendTestNotification,
}) => {
  const [frequency, setFrequency] = useState(rule.frequency)
  const [startTime, setStartTime] = useState(rule.startTime)
  const [endTime, setEndTime] = useState(rule.endTime)
  const [notifyMotherOnComplete, setNotifyMotherOnComplete] = useState(
    rule.notifyMotherOnComplete,
  )
  const [notifyMotherOnDelay, setNotifyMotherOnDelay] = useState(
    rule.notifyMotherOnDelay,
  )
  const [daughterMinutesBefore, setDaughterMinutesBefore] = useState(
    rule.daughterReminderMinutesBefore,
  )
  const [enabled] = useState(rule.enabled)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const { syncPreferences } = usePush()

  const buildRule = (): NotificationRule => ({
    ...rule,
    enabled,
    frequency,
    startTime,
    endTime,
    notifyMotherOnComplete,
    notifyMotherOnDelay,
    daughterReminderMinutesBefore: Number(daughterMinutesBefore),
  })

  const handleSave = () => {
    const updated = buildRule()
    onUpdateRule(updated)
    void syncPreferences(updated)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const handleSendSample = (message: string, title: string) => {
    onSendTestNotification({
      recipient: 'daughter',
      title,
      message,
      type: 'reminder',
    })
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 ui-card">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Configuração de Notificações
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Defina horários e frequências de alertas para incentivar a autonomia
            sem sobrecarregar
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          leftIcon={<Check className="w-4 h-4" />}
        >
          {savedSuccess ? 'Configuração Salva!' : 'Salvar Preferências'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Mother Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Frequency & Windows */}
          <div className="ui-card p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#5B5CE2]" />
              Janela de Notificações da Filha
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-2">
                Frequência dos Lembretes
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    id: 'suave',
                    title: 'Suave',
                    desc: '1 lembrete matinal e 1 noturno',
                  },
                  {
                    id: 'moderada',
                    title: 'Moderada',
                    desc: 'Lembrete antes de cada atividade (Recomendado)',
                  },
                  {
                    id: 'alta',
                    title: 'Intensiva',
                    desc: 'Alertas frequentes e avisos de prazo',
                  },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFrequency(f.id as any)}
                    className={`p-3.5 rounded-2xl text-left transition-all ${
                      frequency === f.id
                        ? 'ui-selected bg-[#EEF0FF] text-[#4A4BCF] font-semibold'
                        : 'bg-white shadow-[0_1px_5px_rgb(15_23_42/0.06)] hover:bg-slate-50 text-[#111827]'
                    }`}
                  >
                    <p className="text-xs font-bold">{f.title}</p>
                    <p className="text-[11px] text-[#6B7280] mt-1">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <TextInput
                label="Horário Inicial (não acordar antes)"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <TextInput
                label="Horário Final (respeitar sono)"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                Antecedência dos lembretes de tarefas
              </label>
              <select
                value={daughterMinutesBefore}
                onChange={(e) =>
                  setDaughterMinutesBefore(Number(e.target.value))
                }
                className="ui-field w-full min-h-[44px] px-3.5 py-2.5 text-sm text-[#111827] cursor-pointer"
              >
                <option value={10}>
                  10 minutos antes do horário de início
                </option>
                <option value={15}>
                  15 minutos antes do horário de início (Padrão)
                </option>
                <option value={30}>
                  30 minutos antes do horário de início
                </option>
                <option value={60}>1 hora antes</option>
              </select>
            </div>
          </div>

          {/* Mother Alerts */}
          <div className="ui-card p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#5B5CE2]" />
              Alertas para a Mãe
            </h3>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl shadow-[0_1px_5px_rgb(15_23_42/0.06)] hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notifyMotherOnComplete}
                onChange={(e) => setNotifyMotherOnComplete(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#5B5CE2] focus:ring-[#5B5CE2]"
              />
              <div>
                <span className="block text-xs font-bold text-[#111827]">
                  Notificar quando a filha concluir uma atividade
                </span>
                <span className="block text-[11px] text-[#6B7280] mt-0.5">
                  Receba uma notificação push discreta: "Laura concluiu Lição de
                  Casa (+30 pts)".
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl shadow-[0_1px_5px_rgb(15_23_42/0.06)] hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notifyMotherOnDelay}
                onChange={(e) => setNotifyMotherOnDelay(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#5B5CE2] focus:ring-[#5B5CE2]"
              />
              <div>
                <span className="block text-xs font-bold text-[#111827]">
                  Avisar sobre tarefas pendentes com risco de atraso
                </span>
                <span className="block text-[11px] text-[#6B7280] mt-0.5">
                  Apenas após 30 minutos do horário limite sem confirmação da
                  filha.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Right Col: Mobile Preview of Daughter Notifications */}
        <div className="ui-card p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-[#6B7280]">
              <Smartphone className="w-4 h-4 text-[#5B5CE2]" />
              <span>Experiência no Celular da Filha</span>
            </div>
            <h3 className="text-base font-bold text-[#111827]">
              Prévia das Mensagens
            </h3>
            <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
              Exemplos reais de notificações com tom encorajador, respeitoso e
              livre de cobranças ríspidas:
            </p>

            <div className="space-y-3 mt-4">
              {[
                {
                  title: 'Hora de verificar sua rotina!',
                  msg: 'Faltam apenas 2 tarefas para completar seu dia.',
                },
                {
                  title: 'Você tem tarefas para concluir',
                  msg: 'Que tal revisar Matemática agora para ficar livre à noite?',
                },
                {
                  title: 'Parabéns pela dedicação! 🎉',
                  msg: 'Sua rotina de hoje foi 100% cumprida. +75 pontos creditados!',
                },
              ].map((sample, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 shadow-[0_1px_5px_rgb(15_23_42/0.06)] hover:shadow-[0_4px_16px_rgb(91_92_226/0.12)] transition-shadow relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#111827]">
                      {sample.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSendSample(sample.msg, sample.title)}
                      className="text-[10px] font-semibold text-[#5B5CE2] hover:underline flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Testar
                    </button>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1">{sample.msg}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EEF0FF]/50 shadow-[0_2px_12px_rgb(91_92_226/0.1)] text-[11px] text-[#4A4BCF] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#5B5CE2]" />
            <span>
              Notificações PWA compatíveis com iOS (Safari) e Android (Chrome).
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
