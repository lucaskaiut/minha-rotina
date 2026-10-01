import React, { useState } from 'react'
import { Trophy, Star } from 'lucide-react'
import type { Achievement } from '../../types'
import { AchievementCard } from '../ui/Card'

interface DaughterAchievementsProps {
  achievements: Achievement[]
}

export const DaughterAchievements: React.FC<DaughterAchievementsProps> = ({
  achievements,
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')

  const unlockedList = achievements.filter((a) => a.unlocked)
  const lockedList = achievements.filter((a) => !a.unlocked)

  const displayedList =
    filter === 'unlocked'
      ? unlockedList
      : filter === 'locked'
        ? lockedList
        : achievements

  const totalPointsEarned = unlockedList.reduce(
    (acc, a) => acc + a.rewardPoints,
    0,
  )

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header with Achievements Summary */}
      <div className="ui-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#111827]">
              Galeria de Conquistas 🏆
            </h1>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Cada hábito construído libera medalhas e bônus de pontuação
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 ui-chip text-amber-900 text-xs font-bold flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>
                {unlockedList.length} de {achievements.length} Desbloqueadas
              </span>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-purple-50 ui-chip text-purple-900 text-xs font-bold flex items-center gap-1.5">
              <Star className="w-4 h-4 text-purple-600 fill-purple-400" />
              <span>+{totalPointsEarned} pts bônus</span>
            </div>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 mt-5 pt-4 ui-divider-y">
          {[
            { id: 'all', label: 'Todas as Conquistas' },
            { id: 'unlocked', label: `Desbloqueadas (${unlockedList.length})` },
            { id: 'locked', label: `A Desbloquear (${lockedList.length})` },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === item.id
                  ? 'bg-[#5B5CE2] text-white shadow-xs'
                  : 'bg-slate-100 text-[#6B7280] hover:bg-slate-200 hover:text-[#111827]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedList.map((ach) => (
          <AchievementCard key={ach.id} achievement={ach} />
        ))}
      </div>
    </div>
  )
}
