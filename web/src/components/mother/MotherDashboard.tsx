import React from 'react'
import {
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Flame,
} from 'lucide-react'
import type { DashboardSummary, Daughter, Task, DailyReport } from '../../types'
import { Button } from '../ui/Button'
import { StatCard, TaskCard } from '../ui/Card'
import { CircularProgress } from '../ui/Indicators'
import { useAuth } from '#/contexts/AuthContext'

interface MotherDashboardProps {
  daughter: Daughter
  tasks: Task[]
  allDaughters: Daughter[]
  onSelectDaughter: (id: string) => void
  onOpenCreateTask: () => void
  onToggleTask: (task: Task) => void
  onEditTask: (task: Task) => void
  weeklyReports: DailyReport[]
  summary: DashboardSummary | null
  onNavigateToTab: (
    tab: 'tasks' | 'daughters' | 'reports' | 'notifications',
  ) => void
}

export const MotherDashboard: React.FC<MotherDashboardProps> = ({
  daughter,
  tasks,
  allDaughters,
  onSelectDaughter,
  onOpenCreateTask,
  onToggleTask,
  onEditTask,
  weeklyReports,
  summary,
  onNavigateToTab,
}) => {
  const { user } = useAuth()
  const firstName = user?.name.split(' ')[0] ?? 'Olá'
  const weeklyAverage =
    weeklyReports.length > 0
      ? Math.round(
          weeklyReports.reduce((acc, day) => acc + day.rate, 0) /
            weeklyReports.length,
        )
      : 0
  // Filter tasks for this daughter
  const daughterTasks = tasks.filter((t) => t.daughterId === daughter.id)
  const totalTasks = daughterTasks.length
  const completedTasks = daughterTasks.filter(
    (t) => t.status === 'concluido',
  ).length
  const inProgressTasks = daughterTasks.filter(
    (t) => t.status === 'em_andamento',
  ).length
  const pendingTasks = daughterTasks.filter(
    (t) => t.status === 'pendente',
  ).length
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Question Answer: "Minha filha está cumprindo sua rotina?"
  const statusMessage =
    completionRate === 100
      ? 'Excelente! 100% da rotina concluída hoje com total autonomia.'
      : completionRate >= 60
        ? 'Sim! No caminho certo com ritmo consistente e pontualidade.'
        : 'Atenção necessária: ainda faltam tarefas essenciais para concluir hoje.'

  const recentCompleted = daughterTasks
    .filter((t) => t.status === 'concluido')
    .slice(0, 3)

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header with Daughter Switcher and Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 ui-card">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-[#6B7280]">
            <span>Painel da Mãe</span>
            <span aria-hidden="true">·</span>
            <span>Acompanhamento Diário</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Acompanhando o desenvolvimento e responsabilidade de suas filhas
          </p>
        </div>

        {/* Daughter selector pills & CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 ui-segment">
            {allDaughters.map((d) => {
              const isSelected = d.id === daughter.id
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onSelectDaughter(d.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-white text-[#111827] shadow-xs'
                      : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  <img
                    src={d.avatarUrl}
                    alt={d.name}
                    className="w-5 h-5 rounded-full object-cover shadow-[0_1px_5px_rgb(15_23_42/0.06)]"
                  />
                  <span>{d.name.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={onOpenCreateTask}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* CORE HIGHLIGHT CARD: "Minha filha está cumprindo sua rotina?" */}
      <div className="ui-card-tint bg-gradient-to-br from-white via-white to-[#EEF0FF]/40 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF0FF] text-[#4A4BCF] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Status de Desempenho Hoje</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
              {daughter.name.split(' ')[0]} está cumprindo a rotina?
            </h2>

            <p className="text-sm text-[#4A4BCF] font-medium max-w-xl">
              {statusMessage}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-[#6B7280]">
              <div className="flex items-center gap-1.5 font-medium">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>
                  Sequência:{' '}
                  <strong className="text-amber-900 tabular-nums">
                    {daughter.streakDays} dias
                  </strong>
                </span>
              </div>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                <span>
                  <strong className="text-[#111827] tabular-nums">
                    {completedTasks} de {totalTasks}
                  </strong>{' '}
                  tarefas feitas
                </span>
              </div>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-[#5B5CE2]" />
                {summary?.nextTask ? (
                  <span>
                    Próxima:{' '}
                    <strong className="text-[#111827]">
                      {summary.nextTask.startTime}{' '}
                      {summary.nextTask.title.split(' ').slice(0, 3).join(' ')}
                    </strong>
                  </span>
                ) : (
                  <span>Nenhuma tarefa pendente agora 🎉</span>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-4">
            <CircularProgress
              percentage={completionRate}
              size={116}
              strokeWidth={10}
              label="Concluído"
              sublabel="Meta diária"
            />
          </div>
        </div>
      </div>

      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Programadas"
          value={totalTasks}
          subtext="Atividades para hoje"
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          label="Concluídas"
          value={completedTasks}
          subtext={`${completionRate}% de aproveitamento`}
          icon={<CheckCircle2 className="w-4 h-4 text-[#22C55E]" />}
          trend={
            summary
              ? {
                  value: `${summary.rateTrend.value >= 0 ? '+' : ''}${summary.rateTrend.value}% vs. semana anterior`,
                  positive: summary.rateTrend.positive,
                }
              : undefined
          }
        />
        <StatCard
          label="Em Andamento / Pendentes"
          value={pendingTasks + inProgressTasks}
          subtext="Restam no período da tarde/noite"
          icon={<Clock className="w-4 h-4 text-[#F59E0B]" />}
        />
        <StatCard
          label="Pontos Acumulados"
          value={daughter.totalPoints}
          subtext="Pronta para nova conquista"
          icon={<Sparkles className="w-4 h-4 text-amber-500" />}
          trend={
            summary
              ? {
                  value: `+${summary.pointsToday} pts hoje`,
                  positive: summary.pointsToday > 0,
                }
              : undefined
          }
        />
      </div>

      {/* Evolution Chart & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Evolution Graph */}
        <div className="lg:col-span-2 ui-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                Evolução Semanal de Cumprimento
              </h3>
              <p className="text-xs text-[#6B7280]">
                Histórico dos últimos 7 dias de {daughter.name.split(' ')[0]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('reports')}
              className="text-xs font-semibold text-[#5B5CE2] hover:text-[#4A4BCF] flex items-center gap-1 hover:underline"
            >
              <span>Ver Relatório Completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-4 pb-2">
            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pb-3 ui-divider-y">
              {weeklyReports.map((day, idx) => {
                const isToday = idx === weeklyReports.length - 1
                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center gap-2 h-full justify-end group"
                  >
                    <span className="text-[11px] font-bold text-[#111827] tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.rate}%
                    </span>
                    <div className="w-full max-w-[36px] bg-[#EEF0FF] rounded-t-xl overflow-hidden h-32 flex items-end">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          day.rate >= 80
                            ? 'bg-[#5B5CE2] group-hover:bg-[#4A4BCF]'
                            : 'bg-amber-400 group-hover:bg-amber-500'
                        }`}
                        style={{ height: `${day.rate}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-xs font-semibold ${isToday ? 'text-[#5B5CE2]' : 'text-[#6B7280]'}`}
                      >
                        {day.dayName}
                      </p>
                      <p className="text-[10px] text-slate-400 tabular-nums">
                        {day.date}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-[#6B7280] pt-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#5B5CE2]" />
                Meta atingida (&ge; 80%)
              </span>
              <span className="font-semibold text-[#111827]">
                Média Semanal:{' '}
                <span
                  className={`tabular-nums ${weeklyAverage >= 80 ? 'text-[#16A34A]' : 'text-amber-600'}`}
                >
                  {weeklyAverage}%
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activities List */}
        <div className="ui-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#111827]">
                Atividades Recentes
              </h3>
              <span className="text-xs text-[#6B7280]">Hoje</span>
            </div>

            <div className="space-y-3">
              {recentCompleted.length > 0 ? (
                recentCompleted.map((task) => {
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-2xl ui-well hover:shadow-[0_4px_16px_rgb(15_23_42/0.08)] transition-shadow bg-slate-50/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#111827] truncate">
                            {task.title}
                          </p>
                          <p className="text-[11px] text-[#6B7280] mt-0.5">
                            Concluída às {task.completedAt ?? '--:--'} · +
                            {task.points} pts
                          </p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-6 text-xs text-[#6B7280]">
                  Nenhuma atividade finalizada ainda hoje.
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('tasks')}
            className="w-full mt-4 py-2.5 rounded-xl shadow-[0_1px_5px_rgb(15_23_42/0.06)] text-xs font-semibold text-[#111827] hover:bg-slate-50 transition-colors text-center"
          >
            Gerenciar Todas as Tarefas
          </button>
        </div>
      </div>

      {/* Quick Task List Section for Today */}
      <div className="ui-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#111827]">
              Tarefas de Hoje de {daughter.name.split(' ')[0]}
            </h3>
            <p className="text-xs text-[#6B7280]">
              Clique no checkbox para marcar ou no botão de editar para ajustar
              horários
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToTab('tasks')}
          >
            Ver Calendário
          </Button>
        </div>

        <div className="space-y-3">
          {daughterTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleTask}
              onEdit={onEditTask}
              isDaughterView={false}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
