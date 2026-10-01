import React, { useState, useEffect } from 'react'
import { X, Clock, Tag, CalendarDays } from 'lucide-react'
import type {
  Task,
  TaskCategory,
  TaskDifficulty,
  Weekday,
  Daughter,
} from '../../types'
import type { TaskPayload } from '#/services/api'
import { Button } from '../ui/Button'
import { TextInput, SelectInput } from '../ui/Input'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: TaskPayload & { id?: string }) => void
  initialTask?: Task | null
  daughters: Daughter[]
  selectedDaughterId: string
}

const WEEKDAYS_LIST: { key: Weekday; label: string }[] = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
]

const CATEGORIES_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: 'estudos', label: '📚 Estudos e Lição de Casa' },
  { value: 'saude', label: '🍎 Saúde, Higiene & Alimentação' },
  { value: 'casa', label: '🧹 Organização & Quarto' },
  { value: 'habito', label: '📖 Hábito & Leitura' },
  { value: 'lazer', label: '🎨 Lazer Criativo & Esportes' },
]

const DIFFICULTY_OPTIONS: {
  value: TaskDifficulty
  label: string
  hint: string
  points: number
}[] = [
  { value: 'easy', label: 'Fácil', hint: 'Rotina rápida', points: 10 },
  { value: 'medium', label: 'Média', hint: 'Exige atenção', points: 25 },
  { value: 'hard', label: 'Difícil', hint: 'Esforço maior', points: 50 },
  { value: 'epic', label: 'Épica', hint: 'Desafio especial', points: 75 },
]

function difficultyForPoints(points: number): TaskDifficulty {
  let result: TaskDifficulty = 'easy'
  for (const option of DIFFICULTY_OPTIONS) {
    if (points >= option.points) result = option.value
  }
  return result
}

function pointsForDifficulty(difficulty: TaskDifficulty): number {
  return (
    DIFFICULTY_OPTIONS.find((option) => option.value === difficulty)?.points ??
    10
  )
}

function todayIso(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  daughters,
  selectedDaughterId,
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TaskCategory>('estudos')
  const [daughterId, setDaughterId] = useState(selectedDaughterId)
  const [repeat, setRepeat] = useState<'weekly' | 'once'>('weekly')
  const [weekdays, setWeekdays] = useState<Weekday[]>([
    'seg',
    'ter',
    'qua',
    'qui',
    'sex',
  ])
  const [scheduledDate, setScheduledDate] = useState(todayIso())
  const [startTime, setStartTime] = useState('14:00')
  const [dueTime, setDueTime] = useState('15:00')
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title)
      setDescription(initialTask.description || '')
      setCategory(initialTask.category)
      setDaughterId(initialTask.daughterId)
      setRepeat(initialTask.repeat === 'once' ? 'once' : 'weekly')
      setWeekdays(
        initialTask.weekdays.length > 0 ? initialTask.weekdays : ['seg'],
      )
      setScheduledDate(
        initialTask.scheduledDate ?? initialTask.date ?? todayIso(),
      )
      setStartTime(initialTask.startTime)
      setDueTime(initialTask.dueTime)
      setDifficulty(
        initialTask.difficulty ?? difficultyForPoints(initialTask.points),
      )
    } else {
      setTitle('')
      setDescription('')
      setCategory('estudos')
      setDaughterId(selectedDaughterId)
      setRepeat('weekly')
      setWeekdays(['seg', 'ter', 'qua', 'qui', 'sex'])
      setScheduledDate(todayIso())
      setStartTime('14:00')
      setDueTime('15:00')
      setDifficulty('medium')
    }
    setErrors({})
  }, [initialTask, isOpen, selectedDaughterId])

  if (!isOpen) return null

  const toggleWeekday = (day: Weekday) => {
    if (weekdays.includes(day)) {
      if (weekdays.length > 1) {
        setWeekdays(weekdays.filter((d) => d !== day))
      }
    } else {
      setWeekdays([...weekdays, day])
    }
  }

  const handleSelectAllDays = () => {
    if (weekdays.length === 7) {
      setWeekdays(['seg', 'ter', 'qua', 'qui', 'sex'])
    } else {
      setWeekdays(['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Digite o título da tarefa'
    }
    if (repeat === 'weekly' && weekdays.length === 0) {
      newErrors.weekdays = 'Selecione ao menos um dia da semana'
    }
    if (repeat === 'once' && !scheduledDate) {
      newErrors.date = 'Escolha a data da tarefa'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSave({
      id: initialTask?.id,
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      daughterId,
      weekdays: repeat === 'weekly' ? weekdays : [],
      date: repeat === 'once' ? scheduledDate : null,
      startTime,
      dueTime,
      points: pointsForDifficulty(difficulty),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-lg ui-card shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5">
          <div>
            <h3 className="text-lg font-bold text-[#111827]">
              {initialTask ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
            </h3>
            <p className="text-xs text-[#6B7280]">
              Configure os detalhes da rotina e incentive a pontualidade
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4.5"
        >
          {/* Filha selecionada */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Atribuir para
            </label>
            <div className="grid grid-cols-2 gap-2">
              {daughters.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDaughterId(d.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                    daughterId === d.id
                      ? 'ui-selected bg-[#EEF0FF] text-[#4A4BCF] font-semibold'
                      : 'bg-white shadow-[0_1px_5px_rgb(15_23_42/0.06)] hover:bg-slate-50 text-[#111827]'
                  }`}
                >
                  <img
                    src={d.avatarUrl}
                    alt={d.name}
                    className="w-8 h-8 rounded-full object-cover shadow-[0_1px_5px_rgb(15_23_42/0.06)] shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{d.name}</p>
                    <p className="text-[10px] text-[#6B7280]">{d.age} anos</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <TextInput
            label="Título da Tarefa *"
            placeholder="Ex: Arrumar a mochila para a escola"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            errorMessage={errors.title}
          />

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Instruções ou Descrição (opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Separar livros de matemática e estojo limpo..."
              className="ui-field w-full px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Categoria */}
          <SelectInput
            label="Categoria *"
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            options={CATEGORIES_OPTIONS}
            leftIcon={<Tag className="w-4 h-4" />}
          />

          {/* Repetição */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Agendamento *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRepeat('weekly')}
                className={`p-3 rounded-2xl text-left transition-all ${
                  repeat === 'weekly'
                    ? 'ui-selected bg-[#EEF0FF] text-[#4A4BCF]'
                    : 'bg-white shadow-[0_1px_5px_rgb(15_23_42/0.06)] hover:bg-slate-50 text-[#111827]'
                }`}
              >
                <p className="text-xs font-bold">Toda semana</p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Repete nos dias escolhidos
                </p>
              </button>
              <button
                type="button"
                onClick={() => setRepeat('once')}
                className={`p-3 rounded-2xl text-left transition-all ${
                  repeat === 'once'
                    ? 'ui-selected bg-[#EEF0FF] text-[#4A4BCF]'
                    : 'bg-white shadow-[0_1px_5px_rgb(15_23_42/0.06)] hover:bg-slate-50 text-[#111827]'
                }`}
              >
                <p className="text-xs font-bold">Uma vez (não repete)</p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Acontece apenas na data escolhida
                </p>
              </button>
            </div>
          </div>

          {/* Data única ou dias da semana */}
          {repeat === 'once' ? (
            <TextInput
              label="Data da tarefa *"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              errorMessage={errors.date}
              leftIcon={<CalendarDays className="w-4 h-4" />}
            />
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#111827]">
                  Dias da Semana *
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllDays}
                  className="text-[11px] font-medium text-[#5B5CE2] hover:underline"
                >
                  {weekdays.length === 7
                    ? 'Apenas dias úteis'
                    : 'Todos os dias'}
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS_LIST.map(({ key, label }) => {
                  const isSelected = weekdays.includes(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleWeekday(key)}
                      className={`
                        py-2 text-xs font-semibold rounded-xl transition-all duration-150
                        ${
                          isSelected
                            ? 'bg-[#5B5CE2] text-white shadow-[0_2px_10px_rgb(91_92_226/0.35)]'
                            : 'bg-slate-50 text-[#6B7280] shadow-[0_1px_4px_rgb(15_23_42/0.05)] hover:bg-slate-100'
                        }
                      `}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              {errors.weekdays && (
                <p className="mt-1 text-xs text-[#EF4444] font-medium">
                  {errors.weekdays}
                </p>
              )}
            </div>
          )}

          {/* Horários */}
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Hora de Início"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              leftIcon={<Clock className="w-4 h-4" />}
            />
            <TextInput
              label="Hora Limite (Término)"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              leftIcon={<Clock className="w-4 h-4" />}
            />
          </div>

          {/* Dificuldade e pontuação */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#111827]">
                Dificuldade & Pontos ⭐
              </label>
              <span className="text-xs font-bold text-amber-600 tabular-nums">
                +{pointsForDifficulty(difficulty)} pontos
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDifficulty(option.value)}
                  className={`p-3 rounded-2xl text-left transition-all ${
                    difficulty === option.value
                      ? 'ui-selected bg-amber-50 text-amber-900'
                      : 'bg-white shadow-[0_1px_5px_rgb(15_23_42/0.06)] hover:bg-slate-50 text-[#111827]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold">{option.label}</p>
                    <span className="text-[11px] font-bold text-amber-600 tabular-nums">
                      {option.points} pts
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    {option.hint}
                  </p>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[#6B7280]">
              Bônus ao concluir: até +20% pela pontualidade, +5 se for antes do
              horário e +5 pela primeira tarefa do dia. Atrasada vale 50%.
            </p>
          </div>
        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit}>
            {initialTask ? 'Salvar Alterações' : 'Cadastrar Tarefa'}
          </Button>
        </div>
      </div>
    </div>
  )
}
