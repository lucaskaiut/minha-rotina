import React from 'react'
import { CheckCircle2, Clock, AlertCircle, PlayCircle } from 'lucide-react'
import type { TaskStatus } from '../../types'

interface BadgeProps {
  status: TaskStatus
  size?: 'sm' | 'md'
  variant?: 'subtle' | 'outline' | 'clean'
  className?: string
}

export const StatusBadge: React.FC<BadgeProps> = ({
  status,
  size = 'md',
  variant = 'subtle',
  className = '',
}) => {
  const configs = {
    concluido: {
      label: 'Concluído',
      icon: CheckCircle2,
      textColor: 'text-[#16A34A]',
      bgColor: 'bg-emerald-50 shadow-[0_1px_6px_rgb(16_185_129/0.15)]',
      dotColor: 'bg-[#22C55E]',
    },
    em_andamento: {
      label: 'Em andamento',
      icon: PlayCircle,
      textColor: 'text-[#4A4BCF]',
      bgColor: 'bg-[#EEF0FF] shadow-[0_1px_6px_rgb(91_92_226/0.12)]',
      dotColor: 'bg-[#5B5CE2]',
    },
    pendente: {
      label: 'Pendente',
      icon: Clock,
      textColor: 'text-[#6B7280]',
      bgColor: 'bg-slate-100 shadow-[0_1px_5px_rgb(15_23_42/0.06)]',
      dotColor: 'bg-[#9CA3AF]',
    },
    atrasado: {
      label: 'Atrasado',
      icon: AlertCircle,
      textColor: 'text-[#DC2626]',
      bgColor: 'bg-rose-50 shadow-[0_1px_6px_rgb(244_63_94/0.12)]',
      dotColor: 'bg-[#EF4444]',
    },
  }

  const config = configs[status]
  const Icon = config.icon

  if (variant === 'clean') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.textColor} ${className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.dotColor} shrink-0`}
        />
        <span>{config.label}</span>
      </span>
    )
  }

  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium ${config.bgColor} ${config.textColor} ${sizeClasses} ${className}`}
    >
      <Icon
        className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'}
      />
      <span>{config.label}</span>
    </span>
  )
}
