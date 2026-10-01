import React from 'react'
import {
  Clock,
  Star,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  Trophy,
  Target,
  Flame,
  BookOpen,
  Crown,
} from 'lucide-react'
import type {
  Task,
  Achievement,
  TaskCategory,
  TaskDifficulty,
} from '../../types'
import { StatusBadge } from './Badge'
import { formatShortDate } from '#/utils/format'

export const difficultyConfig: Record<
  TaskDifficulty,
  { label: string; className: string }
> = {
  easy: { label: 'Fácil', className: 'bg-emerald-50 text-emerald-700' },
  medium: { label: 'Média', className: 'bg-amber-50 text-amber-800' },
  hard: { label: 'Difícil', className: 'bg-rose-50 text-rose-700' },
  epic: { label: 'Épica', className: 'bg-purple-50 text-purple-700' },
}

// Helper for category labels & subtle accent
export const categoryConfig: Record<
  TaskCategory,
  { label: string; color: string; bg: string }
> = {
  estudos: { label: 'Estudos', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  saude: {
    label: 'Saúde & Higiene',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  casa: { label: 'Casa & Quarto', color: 'text-amber-600', bg: 'bg-amber-50' },
  lazer: {
    label: 'Lazer & Criatividade',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  habito: {
    label: 'Hábito & Leitura',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
}

// 1. Card de Tarefa
interface TaskCardProps {
  task: Task
  onToggleComplete?: (task: Task) => void
  onEdit?: (task: Task) => void
  isDaughterView?: boolean
  className?: string
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  isDaughterView = false,
  className = '',
}) => {
  const cat = categoryConfig[task.category]
  const isDone = task.status === 'concluido'

  return (
    <div
      className={`
        group relative w-full ui-card-sm transition-all duration-200
        ${
          isDone
            ? 'bg-emerald-50/30 shadow-[0_2px_14px_rgb(16_185_129/0.12)]'
            : 'hover:shadow-[0_4px_20px_rgb(91_92_226/0.12)]'
        }
        p-4.5 sm:p-5 ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          {/* Metadata line without pill clutter */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-[#6B7280] mb-1.5">
            <span className={`font-semibold ${cat.color}`}>{cat.label}</span>
            {task.difficulty && (
              <span
                className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${difficultyConfig[task.difficulty].className}`}
              >
                {difficultyConfig[task.difficulty].label}
              </span>
            )}
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="flex items-center gap-1 font-medium tabular-nums text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {task.startTime} – {task.dueTime}
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-600 tabular-nums">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />+
              {task.points} pts
            </span>
            {task.repeat === 'once' && (
              <>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="flex items-center gap-1 font-semibold text-indigo-600">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formatShortDate(task.scheduledDate)} (única)
                </span>
              </>
            )}
          </div>

          <h3
            className={`text-base font-semibold transition-colors ${
              isDone
                ? 'line-through text-slate-400'
                : 'text-[#111827] group-hover:text-[#4A4BCF]'
            }`}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="mt-1 text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Mother view: status badge */}
          {!isDaughterView && (
            <div className="mt-3 flex items-center justify-between">
              <StatusBadge status={task.status} size="sm" />
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className="text-xs font-medium text-[#5B5CE2] hover:text-[#4A4BCF] hover:underline px-2 py-1"
                >
                  Editar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Action: Big button for daughter view, or toggle checkbox for mother */}
        {isDaughterView ? (
          <div className="shrink-0 flex flex-col items-end justify-center self-center pl-2">
            <button
              type="button"
              onClick={() => onToggleComplete?.(task)}
              className={`
                min-h-[46px] min-w-[110px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-xs
                ${
                  isDone
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-[#5B5CE2] hover:bg-[#4A4BCF] text-white hover:shadow-md'
                }
              `}
            >
              <CheckCircle2
                className={`w-4 h-4 ${isDone ? 'stroke-[2.5]' : ''}`}
              />
              <span>{isDone ? 'Concluída!' : 'Concluir'}</span>
            </button>
          </div>
        ) : (
          <div className="shrink-0 pt-1">
            <button
              type="button"
              onClick={() => onToggleComplete?.(task)}
              aria-label={
                isDone ? 'Marcar como pendente' : 'Marcar como concluída'
              }
              className={`
                ui-check
                ${isDone ? 'ui-check-done' : 'hover:shadow-[0_0_0_3px_rgb(91_92_226/0.2)]'}
              `}
            >
              {isDone && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// 2. Card de Estatística
interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon?: React.ReactNode
  trend?: {
    value: string
    positive: boolean
  }
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  className = '',
}) => {
  return (
    <div
      className={`ui-card-sm p-4 sm:p-5 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#6B7280] tracking-wide">
          {label}
        </span>
        {icon && (
          <div className="text-[#5B5CE2] p-1.5 rounded-lg bg-[#EEF0FF]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold tabular-nums ${
              trend.positive ? 'text-[#16A34A]' : 'text-[#DC2626]'
            }`}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {subtext && <p className="text-xs text-[#6B7280] mt-1.5">{subtext}</p>}
    </div>
  )
}

// 3. Card de Conquista (Badges Gamification)
interface AchievementCardProps {
  achievement: Achievement
  className?: string
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  className = '',
}) => {
  const iconMap: Record<string, React.ReactNode> = {
    Sparkles: <Sparkles className="w-5 h-5 text-amber-500" />,
    Target: <Target className="w-5 h-5 text-indigo-500" />,
    Flame: <Flame className="w-5 h-5 text-amber-500 fill-amber-400" />,
    Crown: <Crown className="w-5 h-5 text-yellow-500" />,
    Trophy: <Trophy className="w-5 h-5 text-amber-500" />,
    BookOpen: <BookOpen className="w-5 h-5 text-blue-500" />,
  }

  const progressPct = Math.min(
    100,
    Math.round((achievement.currentProgress / achievement.totalGoal) * 100),
  )

  return (
    <div
      className={`
        relative ui-card-sm p-4 sm:p-5 transition-all duration-200
        ${
          achievement.unlocked
            ? 'bg-gradient-to-br from-white to-amber-50/30 shadow-[0_4px_20px_rgb(245_158_11/0.15)]'
            : 'opacity-80'
        }
        ${className}
      `}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`
            w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ui-chip
            ${
              achievement.unlocked
                ? 'bg-amber-50 text-amber-600'
                : 'bg-slate-100 text-slate-400'
            }
          `}
        >
          {iconMap[achievement.icon] || <Trophy className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-[#111827] truncate">
              {achievement.title}
            </h4>
            <span className="text-xs font-semibold text-amber-600 tabular-nums shrink-0">
              +{achievement.rewardPoints} pts
            </span>
          </div>

          <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
            {achievement.description}
          </p>

          <div className="mt-3">
            <div className="flex justify-between items-center text-[11px] mb-1 font-medium text-[#6B7280]">
              <span>
                {achievement.unlocked ? 'Desbloqueada!' : 'Em progresso'}
              </span>
              <span className="tabular-nums">
                {achievement.currentProgress} / {achievement.totalGoal}
              </span>
            </div>
            <div className="w-full h-2 bg-[#EEF0FF] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  achievement.unlocked ? 'bg-[#22C55E]' : 'bg-[#5B5CE2]'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 4. Card de Resumo Diário
interface DailySummaryCardProps {
  daughterName: string
  completedCount: number
  totalCount: number
  streakDays: number
  totalPoints: number
  isMotherView?: boolean
  onCtaClick?: () => void
  className?: string
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  daughterName,
  completedCount,
  totalCount,
  streakDays,
  totalPoints,
  isMotherView = false,
  onCtaClick: _onCtaClick,
  className = '',
}) => {
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isAllDone = totalCount > 0 && completedCount >= totalCount

  return (
    <div
      className={`
        ui-card-sm p-5 sm:p-6 relative overflow-hidden
        ${className}
      `}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#6B7280] mb-1">
            <span>Resumo de Hoje</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#5B5CE2] font-semibold">{daughterName}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            {isAllDone
              ? 'Todas as tarefas concluídas hoje! 🎉'
              : `${totalCount - completedCount} ${
                  totalCount - completedCount === 1
                    ? 'tarefa restante'
                    : 'tarefas restantes'
                }`}
          </h2>

          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            {isMotherView
              ? isAllDone
                ? `${daughterName} cumpriu 100% da rotina planejada com autonomia.`
                : `${daughterName} completou ${completedCount} de ${totalCount} atividades programadas.`
              : isAllDone
                ? 'Você arrasou hoje! Manteve sua rotina impecável.'
                : 'Complete suas atividades e mantenha sua chama acesa! 🔥'}
          </p>
        </div>

        {/* Quick indicators */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#EEF0FF] min-w-[76px]">
            <span className="text-xl font-bold text-[#4A4BCF] tabular-nums">
              {percentage}%
            </span>
            <span className="text-[10px] font-medium text-[#4A4BCF]">
              Aproveitamento
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 ui-chip min-w-[76px]">
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-lg font-bold text-amber-900 tabular-nums">
                {streakDays}d
              </span>
            </div>
            <span className="text-[10px] font-medium text-amber-700">
              Sequência
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50 ui-chip min-w-[76px]">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-purple-600 fill-purple-400" />
              <span className="text-lg font-bold text-purple-900 tabular-nums">
                {totalPoints}
              </span>
            </div>
            <span className="text-[10px] font-medium text-purple-700">
              Pontos
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
