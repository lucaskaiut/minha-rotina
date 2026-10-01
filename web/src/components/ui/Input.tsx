import React, { useState } from 'react'
import { Eye, EyeOff, Search } from 'lucide-react'

export interface BaseInputProps {
  label?: string
  helperText?: string
  errorMessage?: string
  hasError?: boolean
  disabled?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>, BaseInputProps {
  isSearch?: boolean
  isPassword?: boolean
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  helperText,
  errorMessage,
  hasError = false,
  disabled = false,
  leftIcon,
  rightIcon,
  isSearch = false,
  isPassword = false,
  className = '',
  type = 'text',
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const inputId =
    id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type

  const actualError = hasError || !!errorMessage

  return (
    <div className="w-full text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[#111827] mb-1.5 tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {(leftIcon || isSearch) && (
          <div className="absolute left-3.5 text-[#6B7280] pointer-events-none flex items-center">
            {isSearch ? <Search className="w-4 h-4" /> : leftIcon}
          </div>
        )}

        <input
          id={inputId}
          type={effectiveType}
          disabled={disabled}
          className={`
            ui-field w-full min-h-[44px] px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-slate-400
            ${leftIcon || isSearch ? 'pl-10' : ''}
            ${rightIcon || isPassword ? 'pr-10' : ''}
            ${actualError ? 'ui-field-error' : ''}
            ${className}
          `}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            className="absolute right-3.5 text-[#6B7280] hover:text-[#111827] transition-colors p-1 rounded-md"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}

        {!isPassword && rightIcon && (
          <div className="absolute right-3.5 text-[#6B7280] pointer-events-none flex items-center">
            {rightIcon}
          </div>
        )}
      </div>

      {actualError && errorMessage && (
        <p className="mt-1 text-xs text-[#EF4444] font-medium animate-fadeIn">
          {errorMessage}
        </p>
      )}

      {!actualError && helperText && (
        <p className="mt-1 text-xs text-[#6B7280]">{helperText}</p>
      )}
    </div>
  )
}

export interface SelectInputProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>, BaseInputProps {
  options: { value: string; label: string }[]
}

export const SelectInput: React.FC<SelectInputProps> = ({
  label,
  helperText,
  errorMessage,
  hasError = false,
  disabled = false,
  leftIcon,
  options,
  className = '',
  id,
  ...props
}) => {
  const selectId =
    id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const actualError = hasError || !!errorMessage

  return (
    <div className="w-full text-left">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-[#111827] mb-1.5 tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-[#6B7280] pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}

        <select
          id={selectId}
          disabled={disabled}
          className={`
            ui-field w-full min-h-[44px] px-3.5 py-2.5 text-sm text-[#111827]
            appearance-none cursor-pointer pr-10
            ${leftIcon ? 'pl-10' : ''}
            ${actualError ? 'ui-field-error' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3.5 pointer-events-none text-[#6B7280]">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {actualError && errorMessage && (
        <p className="mt-1 text-xs text-[#EF4444] font-medium animate-fadeIn">
          {errorMessage}
        </p>
      )}

      {!actualError && helperText && (
        <p className="mt-1 text-xs text-[#6B7280]">{helperText}</p>
      )}
    </div>
  )
}
