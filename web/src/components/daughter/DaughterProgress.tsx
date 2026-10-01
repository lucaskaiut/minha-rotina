import React from 'react'
import { Flame, Star, CheckCircle2, TrendingUp, Trophy } from 'lucide-react'
import type { Daughter, Task, DailyReport, PointsSummary } from '../../types'

interface DaughterProgressProps {
  daughter: Daughter
  tasks: Task[]
  weeklyReports: DailyReport[]
  pointsSummary: PointsSummary | null
}

function levelName(level: number): string {
  if (level <= 2) return 'Iniciante da Rotina'
  if (level <= 4) return 'Exploradora da Autonomia'
  if (level <= 6) return 'Organizadora em Ação'
  if (level <= 9) return 'Disciplinada de Ouro'
  return 'Mestre da Rotina'
}

export const DaughterProgress: React.FC<DaughterProgressProps> = ({
  daughter,
  tasks,
  weeklyReports,
  pointsSummary,
}) => {
  const daughterTasks = tasks.filter((t) => t.daughterId === daughter.id)
  const completedCount = daughterTasks.filter(
    (t) => t.status === 'concluido',
  ).length
  const totalCount = daughterTasks.length
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const level = pointsSummary?.level ?? 1
  const totalPoints = pointsSummary?.total ?? daughter.totalPoints
  const levelProgress = pointsSummary?.levelProgress ?? 0
  const nextLevelPoints = pointsSummary?.nextLevelPoints ?? 100
  const pointsToNextLevel = Math.max(0, nextLevelPoints - totalPoints)
  const streakDays = pointsSummary?.streakDays ?? daughter.streakDays
  const daysToGoldWeek = Math.max(0, 7 - streakDays)
  const weekly = pointsSummary?.weekly ?? { points: 0, goal: 300, progress: 0 }
  const monthly = pointsSummary?.monthly ?? {
    points: 0,
    goal: 1200,
    progress: 0,
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="ui-card p-5 sm:p-6 shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-[#111827]">
          Seu Progresso & Conquistas
        </h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Veja como sua dedicação diária está transformando seus hábitos
        </p>
      </div>

      {/* 4 Pillars of Progress */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="ui-card-sm p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-[#111827] tabular-nums">
            {completedCount}/{totalCount}
          </p>
          <p className="text-xs text-[#6B7280] mt-0.5">Tarefas de Hoje</p>
        </div>

        <div className="ui-card-sm p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#EEF0FF] text-[#5B5CE2] flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-[#4A4BCF] tabular-nums">
            {percentage}%
          </p>
          <p className="text-xs text-[#6B7280] mt-0.5">Aproveitamento</p>
        </div>

        <div className="bg-white rounded-2xl ui-chip bg-amber-50/40 p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-900 tabular-nums">
            {streakDays} dias
          </p>
          <p className="text-xs text-amber-700 mt-0.5">Sequência Ativa</p>
        </div>

        <div className="bg-white rounded-2xl ui-chip bg-purple-50/40 p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-2">
            <Star className="w-5 h-5 fill-purple-400 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-900 tabular-nums">
            {totalPoints}
          </p>
          <p className="text-xs text-purple-700 mt-0.5">Pontos Totais</p>
        </div>
      </div>

      {/* Week in Review */}
      <div className="ui-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#111827]">
              Sua Semana de Dedicação
            </h2>
            <p className="text-xs text-[#6B7280]">
              Cada barra representa um dia de rotina cumprida
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 ui-chip">
            Ritmo Excelente!
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-36 pt-4 pb-3 ui-divider-y">
          {weeklyReports.map((day, idx) => {
            const isToday = idx === weeklyReports.length - 1
            return (
              <div
                key={day.date}
                className="flex flex-col items-center gap-1.5 h-full justify-end"
              >
                <span className="text-[11px] font-bold text-[#111827] tabular-nums">
                  {day.rate}%
                </span>
                <div className="w-full max-w-[32px] bg-[#EEF0FF] rounded-t-lg overflow-hidden h-24 flex items-end">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      day.rate >= 80 ? 'bg-[#5B5CE2]' : 'bg-amber-400'
                    }`}
                    style={{ height: `${day.rate}%` }}
                  />
                </div>
                <p
                  className={`text-xs font-semibold ${isToday ? 'text-[#5B5CE2]' : 'text-[#6B7280]'}`}
                >
                  {day.dayName}
                </p>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-[#6B7280] pt-3 text-center">
          {daysToGoldWeek > 0 ? (
            <>
              🔥 Você já completou <strong>{streakDays} dias seguidos</strong>.
              Faltam{' '}
              <strong>
                {daysToGoldWeek} dia{daysToGoldWeek === 1 ? '' : 's'}
              </strong>{' '}
              para desbloquear a medalha <strong>Semana de Ouro</strong>!
            </>
          ) : (
            <>
              🔥 Sequência de <strong>{streakDays} dias</strong> seguindo 100%
              da rotina. Continue assim!
            </>
          )}
        </p>
      </div>

      {/* Level / Rewards Milestone */}
      <div className="bg-gradient-to-br from-[#5B5CE2] to-[#4A4BCF] text-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
              Nível {level}
            </span>
            <h3 className="text-xl font-bold mt-0.5">{levelName(level)}</h3>
            <p className="text-xs text-indigo-100 mt-1 max-w-sm">
              {pointsToNextLevel > 0 ? (
                <>
                  Faltam apenas <strong>{pointsToNextLevel} pontos</strong> para
                  o Nível {level + 1} ({levelName(level + 1)}).
                </>
              ) : (
                <>Você está na reta final para o próximo nível!</>
              )}
            </p>
          </div>
          <Trophy className="w-12 h-12 text-yellow-300 shrink-0" />
        </div>

        <div className="mt-4">
          <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-300 rounded-full"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] mt-1.5 text-indigo-200 font-medium">
            <span>{totalPoints} pontos</span>
            <span>Meta: {nextLevelPoints} pontos</span>
          </div>
        </div>
      </div>

      {/* Metas semanais e mensais */}
      <div className="ui-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#111827]">
              Metas de Pontuação
            </h2>
            <p className="text-xs text-[#6B7280]">
              Cada tarefa, bônus e dia perfeito somam nas suas metas
            </p>
          </div>
          <Trophy className="w-5 h-5 text-amber-500" />
        </div>

        <div className="space-y-5">
          {[
            { label: 'Meta semanal', data: weekly },
            { label: 'Meta mensal', data: monthly },
          ].map(({ label, data }) => (
            <div key={label}>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-[#111827]">{label}</span>
                <span className="tabular-nums text-[#4A4BCF]">
                  {data.points} / {data.goal} pts
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#EEF0FF] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    data.progress >= 100 ? 'bg-[#22C55E]' : 'bg-[#5B5CE2]'
                  }`}
                  style={{ width: `${data.progress}%` }}
                />
              </div>
              {data.progress >= 100 && (
                <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                  Meta batida! 🎉
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
