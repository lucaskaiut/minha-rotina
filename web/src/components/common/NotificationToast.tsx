import React from 'react'
import { Bell, X } from 'lucide-react'
import type { NotificationItem } from '../../types'

interface NotificationToastProps {
  notification: NotificationItem | null
  onDismiss: () => void
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
}) => {
  if (!notification) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full ui-panel shadow-xl p-4 animate-bounce">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#EEF0FF] text-[#5B5CE2] flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-[#111827] truncate">
              {notification.title}
            </h4>
            <span className="text-[10px] text-slate-400 shrink-0">agora</span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {notification.message}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 p-1"
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
