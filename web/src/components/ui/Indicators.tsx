import React from 'react'
import { Flame, CheckCircle2 } from 'lucide-react'

interface CircularProgressProps {
  percentage: number // 0 to 100
  size?: number // px
  strokeWidth?: number
  label?: string
  sublabel?: string
  showPercentText?: boolean
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 110,
  strokeWidth = 10,
  label,
  sublabel,
  showPercentText = true,
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clamped / 100) * circumference

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EEF0FF"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#5B5CE2"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {showPercentText && (
          <span className="text-xl font-bold tracking-tight text-[#111827] tabular-nums">
            {clamped}%
          </span>
        )}
        {label && (
          <span className="text-[11px] font-medium text-[#6B7280]">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[10px] text-slate-400">{sublabel}</span>
        )}
      </div>
    </div>
  )
}

interface ProgressBarProps {
  current: number
  total: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  showLabel = true,
  size = 'md',
  color = 'bg-[#5B5CE2]',
  className = '',
}) => {
  const percentage =
    total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-[#6B7280]">Progresso</span>
          <span className="text-[#111827] tabular-nums font-semibold">
            {current} de {total} ({percentage}%)
          </span>
        </div>
      )}
      <div
        className={`w-full bg-[#EEF0FF] rounded-full overflow-hidden ${heightClasses[size]}`}
      >
        <div
          className={`${heightClasses[size]} ${color} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface StreakCounterProps {
  days: number
  isActive?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  days,
  isActive = true,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: {
      padding: 'px-2 py-1',
      icon: 'w-4 h-4',
      text: 'text-xs',
      num: 'text-sm',
    },
    md: {
      padding: 'px-3 py-1.5',
      icon: 'w-5 h-5',
      text: 'text-xs',
      num: 'text-base',
    },
    lg: {
      padding: 'px-4 py-2.5',
      icon: 'w-6 h-6',
      text: 'text-sm',
      num: 'text-xl',
    },
  }

  const style = sizeMap[size]

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl ui-chip transition-transform duration-200 ${
        isActive
          ? 'bg-amber-50 text-amber-900 shadow-[0_2px_10px_rgb(245_158_11/0.2)]'
          : 'bg-slate-100 text-slate-500'
      } ${style.padding} ${className}`}
      title={`${days} dias consecutivos completando a rotina`}
    >
      <div className="relative">
        <Flame
          className={`${style.icon} ${
            isActive
              ? 'text-[#F59E0B] fill-[#F59E0B] animate-pulse'
              : 'text-slate-400'
          }`}
        />
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-bold tabular-nums ${style.num} ${isActive ? 'text-amber-900' : 'text-slate-600'}`}
        >
          {days}
        </span>
        <span className={`font-medium ${style.text} text-[#6B7280]`}>
          {days === 1 ? 'dia de sequência' : 'dias seguidos'}
        </span>
      </div>
    </div>
  )
}

interface TaskCounterProps {
  completed: number
  total: number
  className?: string
}

export const TaskCounter: React.FC<TaskCounterProps> = ({
  completed,
  total,
  className = '',
}) => {
  const isComplete = total > 0 && completed >= total

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ui-chip ${
        isComplete
          ? 'bg-emerald-50 text-emerald-900 shadow-[0_2px_10px_rgb(16_185_129/0.15)]'
          : 'bg-slate-50 text-[#111827]'
      } ${className}`}
    >
      <CheckCircle2
        className={`w-4 h-4 ${isComplete ? 'text-[#22C55E]' : 'text-[#6B7280]'}`}
      />
      <span className="text-xs font-medium">
        <strong className="font-bold tabular-nums">{completed}</strong> de{' '}
        <strong className="font-bold tabular-nums">{total}</strong> concluídas
      </span>
    </div>
  )
}
