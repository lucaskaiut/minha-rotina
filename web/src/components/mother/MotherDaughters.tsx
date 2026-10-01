import React from 'react'
import { UserPlus, Edit3, BarChart2, Power, Flame, Star } from 'lucide-react'
import type { Daughter, Task } from '../../types'
import { Button } from '../ui/Button'

interface MotherDaughtersProps {
  daughters: Daughter[]
  tasks: Task[]
  onOpenWizard: () => void
  onSelectDaughterToView: (daughterId: string) => void
  onToggleDaughterStatus: (daughterId: string) => void
  onEditDaughter: (daughter: Daughter) => void
}

export const MotherDaughters: React.FC<MotherDaughtersProps> = ({
  daughters,
  tasks,
  onOpenWizard,
  onSelectDaughterToView,
  onToggleDaughterStatus,
  onEditDaughter,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 ui-card">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Gestão de Filhas
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Gerencie perfis individuais, monitore o progresso e configure
            rotinas personalizadas
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onOpenWizard}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Cadastrar Nova Filha
        </Button>
      </div>

      {/* Grid of Daughter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {daughters.map((daughter) => {
          const daughterTasks = tasks.filter(
            (t) => t.daughterId === daughter.id,
          )
          const completedCount = daughterTasks.filter(
            (t) => t.status === 'concluido',
          ).length
          const totalCount = daughterTasks.length
          const rate =
            totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
          const isActive = daughter.status === 'active'

          return (
            <div
              key={daughter.id}
              className={`
                ui-card p-6 transition-all duration-200 flex flex-col justify-between
                ${
                  isActive
                    ? 'hover:shadow-[0_8px_28px_rgb(91_92_226/0.14)]'
                    : 'opacity-60 bg-slate-50/80 shadow-[inset_0_1px_3px_rgb(15_23_42/0.04)]'
                }
              `}
            >
              {/* Card Top: Photo, Name, Status */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={daughter.avatarUrl}
                      alt={daughter.name}
                      className="w-14 h-14 rounded-2xl object-cover shadow-[0_1px_5px_rgb(15_23_42/0.06)] shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#111827]">
                          {daughter.name}
                        </h3>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 ui-chip'
                              : 'bg-slate-100 text-slate-500 shadow-[0_1px_5px_rgb(15_23_42/0.06)]'
                          }`}
                        >
                          {isActive ? 'Ativa' : 'Pausada'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        {daughter.age} anos · {daughter.schoolGrade}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metrics snapshot */}
                <div className="grid grid-cols-3 gap-2.5 mt-5 p-3 rounded-2xl bg-[#F8FAFC] ui-well">
                  <div className="text-center">
                    <span className="block text-[11px] font-medium text-[#6B7280]">
                      Tarefas Hoje
                    </span>
                    <span className="text-sm font-bold text-[#111827] tabular-nums">
                      {completedCount}/{totalCount}
                    </span>
                  </div>

                  <div className="text-center ui-well py-1">
                    <span className="block text-[11px] font-medium text-[#6B7280]">
                      Sequência
                    </span>
                    <div className="flex items-center justify-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-bold text-amber-900 tabular-nums">
                        {daughter.streakDays}d
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="block text-[11px] font-medium text-[#6B7280]">
                      Pontos
                    </span>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 text-purple-600 fill-purple-400" />
                      <span className="text-sm font-bold text-purple-900 tabular-nums">
                        {daughter.totalPoints}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Daily Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                    <span className="text-[#6B7280]">Cumprimento hoje</span>
                    <span className="text-[#111827] font-bold tabular-nums">
                      {rate}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#EEF0FF] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5B5CE2] rounded-full transition-all duration-500"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-5 mt-5 ui-divider-y flex items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSelectDaughterToView(daughter.id)}
                  leftIcon={<BarChart2 className="w-3.5 h-3.5" />}
                >
                  Ver Desempenho
                </Button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditDaughter(daughter)}
                    title="Editar dados"
                    className="p-2 rounded-xl text-[#6B7280] hover:text-[#5B5CE2] hover:bg-slate-100 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleDaughterStatus(daughter.id)}
                    title={isActive ? 'Pausar perfil' : 'Ativar perfil'}
                    className={`p-2 rounded-xl transition-colors ${
                      isActive
                        ? 'text-[#6B7280] hover:text-[#EF4444] hover:bg-rose-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
