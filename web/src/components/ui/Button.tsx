import React from 'react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

  const sizeClasses = {
    sm: 'min-h-[36px] px-3 py-1.5 text-xs gap-1.5',
    md: 'min-h-[44px] px-4 py-2 text-sm gap-2',
    lg: 'min-h-[52px] px-6 py-3 text-base gap-2.5 font-semibold',
  }

  const variantClasses = {
    primary:
      'bg-[#5B5CE2] hover:bg-[#4A4BCF] text-white shadow-sm hover:shadow focus-visible:ring-[#5B5CE2]',
    secondary:
      'bg-[#EEF0FF] hover:bg-[#E0E4FF] text-[#4A4BCF] focus-visible:ring-[#5B5CE2]',
    ghost:
      'bg-transparent hover:bg-slate-100 text-[#111827] focus-visible:ring-slate-400 shadow-none hover:shadow-[0_2px_8px_rgb(15_23_42/0.06)]',
    danger:
      'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-sm hover:shadow focus-visible:ring-[#EF4444]',
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span className="truncate">{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
}
