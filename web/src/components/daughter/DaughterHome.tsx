import React, { useState } from 'react'
import confetti from 'canvas-confetti'
import { Flame, Star, Sparkles, ArrowRight } from 'lucide-react'
import type { Achievement, CompletionPoints, Daughter, Task } from '../../types'
import { TaskCard } from '../ui/Card'

interface DaughterHomeProps {
  daughter: Daughter
  tasks: Task[]
  achievements: Achievement[]
  onToggleTask: (task: Task) => Promise<CompletionPoints | null>
  onNavigateToProgress: () => void
  onNavigateToAchievements: () => void
}

export const DaughterHome: React.FC<DaughterHomeProps> = ({
  daughter,
  tasks,
  achievements,
  onToggleTask,
  onNavigateToProgress,
  onNavigateToAchievements,
}) => {
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null)

  // Filter tasks belonging to this daughter
  const daughterTasks = tasks.filter((t) => t.daughterId === daughter.id)
  const completedCount = daughterTasks.filter(
    (t) => t.status === 'concluido',
  ).length
  const totalCount = daughterTasks.length
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isAllCompleted = totalCount > 0 && completedCount >= totalCount
  const nextAchievement =
    achievements.find((achievement) => !achievement.unlocked) ?? null

  // Handle completion with confetti and friendly visual toast
  const handleToggle = async (task: Task) => {
    const willBeDone = task.status !== 'concluido'
    const points = await onToggleTask(task)

    if (!willBeDone || !points) return

    // Fire subtle, joyful confetti
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#5B5CE2', '#22C55E', '#F59E0B', '#EEF0FF'],
    })

    const firstName = daughter.name.split(' ')[0]
    const extras: string[] = []
    if (points.breakdown.first_of_day > 0) extras.push('primeira do dia')
    if (points.breakdown.punctuality > 0) extras.push('pontualidade')
    if (points.breakdown.early > 0) extras.push('adiantou')
    if (points.breakdown.late) extras.push('metade dos pontos por atraso')

    const message =
      extras.length > 0
        ? `Muito bem, ${firstName}! +${points.awarded} pontos (${extras.join(' + ')}) ⭐`
        : `Muito bem, ${firstName}! +${points.awarded} pontos pra você! ⭐`

    setCelebrationMsg(message)
    setTimeout(() => setCelebrationMsg(null), 3500)
  }

  return (
    <div className="space-y-5 animate-fadeIn pb-16">
      {/* Top Banner with Daughter Greeting and Quick Stats */}
      <div className="ui-card p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <img
              src={daughter.avatarUrl}
              alt={daughter.name}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shadow-[0_4px_16px_rgb(91_92_226/0.22)]"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#111827]">
                Oi, {daughter.name.split(' ')[0]}! ✨
              </h1>
              <p className="text-xs text-[#6B7280]">
                {new Date().toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>

          {/* Gamified counters: Streak and Points */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateToProgress}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 ui-chip text-amber-900 transition-transform active:scale-95"
              title="Sua sequência diária"
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              <span className="text-xs font-bold tabular-nums">
                {daughter.streakDays}d
              </span>
            </button>

            <button
              type="button"
              onClick={onNavigateToAchievements}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 ui-chip text-purple-900 transition-transform active:scale-95"
              title="Seus pontos acumulados"
            >
              <Star className="w-4 h-4 text-purple-600 fill-purple-400" />
              <span className="text-xs font-bold tabular-nums">
                {daughter.totalPoints}
              </span>
            </button>
          </div>
        </div>

        {/* Daily Progress summary */}
        <div className="mt-5 pt-4 ui-divider-y">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="text-[#111827]">
              {isAllCompleted
                ? 'Rotina de hoje 100% cumprida! 🎉'
                : `Progresso de hoje (${completedCount} de ${totalCount} concluídas)`}
            </span>
            <span className="text-[#5B5CE2] tabular-nums font-bold">
              {percentage}%
            </span>
          </div>

          <div className="w-full h-3 bg-[#EEF0FF] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#5B5CE2] to-[#4A4BCF] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Floating Celebration Toast */}
      {celebrationMsg && (
        <div className="bg-emerald-50 shadow-[0_4px_16px_rgb(16_185_129/0.18)] text-emerald-900 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-md animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs sm:text-sm font-bold flex-1">
            {celebrationMsg}
          </p>
        </div>
      )}

      {/* PRIMARY SECTION: "Suas tarefas de hoje" (Directly visible without navigation) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#111827]">
              Suas tarefas de hoje
            </h2>
            <p className="text-xs text-[#6B7280]">
              Toque no botão grande para marcar como concluído
            </p>
          </div>

          <span className="text-xs font-semibold text-[#6B7280] tabular-nums">
            {totalCount - completedCount} pendentes
          </span>
        </div>

        <div className="space-y-3">
          {daughterTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={(item) => void handleToggle(item)}
              isDaughterView={true}
            />
          ))}
        </div>
      </div>

      {/* Motivational Bottom Card */}
      <div className="p-4.5 rounded-3xl ui-card-tint bg-gradient-to-r from-[#EEF0FF] to-white flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#4A4BCF] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#5B5CE2]" />
            {nextAchievement
              ? `Próxima Conquista: ${nextAchievement.title}`
              : 'Todas as conquistas desbloqueadas!'}
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {nextAchievement
              ? `${nextAchievement.description} (${nextAchievement.currentProgress}/${nextAchievement.totalGoal}) — recompensa de +${nextAchievement.rewardPoints} pontos!`
              : 'Você completou a galeria inteira. Que orgulho! 🏆'}
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToAchievements}
          className="shrink-0 p-2.5 rounded-xl bg-white shadow-[0_1px_5px_rgb(15_23_42/0.06)] text-[#5B5CE2] hover:bg-slate-50 transition-colors"
          title="Ver Conquistas"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
