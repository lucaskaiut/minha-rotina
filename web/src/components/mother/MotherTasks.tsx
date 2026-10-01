import React, { useState } from 'react'
import { Plus, Copy, Trash2, Edit3, CheckCircle2, Clock } from 'lucide-react'
import type { Task, Daughter, Weekday } from '../../types'
import { Button } from '../ui/Button'
import { TextInput } from '../ui/Input'
import { StatusBadge } from '../ui/Badge'
import { categoryConfig } from '../ui/Card'
import { formatShortDate } from '#/utils/format'

interface MotherTasksProps {
  tasks: Task[]
  daughters: Daughter[]
  onOpenCreate: () => void
  onEdit: (task: Task) => void
  onDuplicate: (task: Task) => void
  onDelete: (taskId: string) => void
  onToggleComplete: (task: Task) => void
}

const WEEKDAYS_MAP: { key: Weekday | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos os Dias' },
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
]

export const MotherTasks: React.FC<MotherTasksProps> = ({
  tasks,
  daughters,
  onOpenCreate,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleComplete,
}) => {
  const [selectedDaughter, setSelectedDaughter] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedDay, setSelectedDay] = useState<Weekday | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedDaughter !== 'all' && t.daughterId !== selectedDaughter)
      return false
    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false
    if (selectedDay !== 'all' && !t.weekdays.includes(selectedDay)) return false
    if (
      searchQuery.trim() &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 ui-card">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Gestão de Tarefas da Rotina
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Crie, programe horários e atribua pontuações para motivar suas
            filhas
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Criar Nova Tarefa
        </Button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-5 ui-card space-y-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <TextInput
            isSearch
            placeholder="Buscar por nome da tarefa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Daughter filter */}
          <select
            value={selectedDaughter}
            onChange={(e) => setSelectedDaughter(e.target.value)}
            className="ui-field w-full min-h-[44px] px-3.5 py-2.5 text-sm text-[#111827] cursor-pointer"
          >
            <option value="all">Todas as Filhas</option>
            {daughters.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.age} anos)
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="ui-field w-full min-h-[44px] px-3.5 py-2.5 text-sm text-[#111827] cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em andamento</option>
            <option value="concluido">Concluído</option>
            <option value="atrasado">Atrasado</option>
          </select>
        </div>

        {/* Day of Week Filter Bar */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-[#6B7280]">
              Filtrar por dia da semana:
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {WEEKDAYS_MAP.map(({ key, label }) => {
              const active = selectedDay === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 ${
                    active
                      ? 'bg-[#5B5CE2] text-white shadow-[0_2px_10px_rgb(91_92_226/0.35)]'
                      : 'bg-slate-50 text-[#6B7280] shadow-[0_1px_4px_rgb(15_23_42/0.05)] hover:bg-slate-100 hover:text-[#111827]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Task List Table / Cards */}
      <div className="ui-card shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 ui-divider-y flex items-center justify-between">
          <p className="text-xs font-semibold text-[#6B7280]">
            Mostrando{' '}
            <strong className="text-[#111827] tabular-nums">
              {filteredTasks.length}
            </strong>{' '}
            tarefas
          </p>
          {(selectedDaughter !== 'all' ||
            selectedStatus !== 'all' ||
            selectedDay !== 'all' ||
            searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedDaughter('all')
                setSelectedStatus('all')
                setSelectedDay('all')
                setSearchQuery('')
              }}
              className="text-xs font-semibold text-[#5B5CE2] hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {filteredTasks.length > 0 ? (
          <div className="[&>div+div]:shadow-[inset_0_1px_0_rgb(15_23_42/0.05)]">
            {filteredTasks.map((task) => {
              const daughter = daughters.find((d) => d.id === task.daughterId)
              const cat = categoryConfig[task.category]
              const isDone = task.status === 'concluido'

              return (
                <div
                  key={task.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Check + Title + Metadata */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(task)}
                      aria-label="Alternar status"
                      className={`
                        ui-check mt-0.5 shrink-0
                        ${isDone ? 'ui-check-done' : 'hover:shadow-[0_0_0_3px_rgb(91_92_226/0.2)]'}
                      `}
                    >
                      {isDone && (
                        <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2 text-xs text-[#6B7280] mb-1">
                        {daughter && (
                          <span className="font-semibold text-[#111827]">
                            {daughter.name.split(' ')[0]}
                          </span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className={`font-semibold ${cat.color}`}>
                          {cat.label}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 font-medium tabular-nums text-slate-600">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {task.startTime} – {task.dueTime}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-amber-600 tabular-nums">
                          +{task.points} pts
                        </span>
                      </div>

                      <h4
                        className={`text-sm sm:text-base font-semibold ${
                          isDone
                            ? 'line-through text-slate-400'
                            : 'text-[#111827]'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 mt-2">
                        {task.repeat === 'once' ? (
                          <>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Tarefa única:
                            </span>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 rounded px-1.5 py-0.5">
                              {formatShortDate(task.scheduledDate)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Dias:
                            </span>
                            {task.weekdays.map((d) => (
                              <span
                                key={d}
                                className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 uppercase"
                              >
                                {d}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status badge & Action buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 ">
                    <StatusBadge status={task.status} size="sm" />

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(task)}
                        title="Editar tarefa"
                        className="p-2 rounded-xl text-slate-500 hover:text-[#5B5CE2] hover:bg-slate-100 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDuplicate(task)}
                        title="Duplicar tarefa"
                        className="p-2 rounded-xl text-slate-500 hover:text-[#5B5CE2] hover:bg-slate-100 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(task.id)}
                        title="Excluir tarefa"
                        className="p-2 rounded-xl text-slate-500 hover:text-[#EF4444] hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-[#111827]">
              Nenhuma tarefa encontrada
            </h4>
            <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
              Tente ajustar os filtros acima ou crie uma nova tarefa para a
              rotina diária.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenCreate}
              className="mt-4"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Criar Primeira Tarefa
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
