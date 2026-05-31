import React from 'react'
import { ToastItem } from '../types/notification'

interface Props {
  toasts: ToastItem[]
  onClick: (id: string) => void
  onDismiss: (id: string) => void
}

const NotificationToasts: React.FC<Props> = ({ toasts, onClick, onDismiss }) => {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-[80] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-surface border border-outline-variant rounded-xl shadow-soft-md p-sm flex items-start gap-sm animate-slide-up cursor-pointer"
          onClick={() => onClick(t.id)}
        >
          <div className="w-9 h-9 rounded-full bg-brand-soft flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-brand-mid text-[20px]">chat</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-on-surface truncate">{t.title}</p>
            <p className="text-[12.5px] text-on-surface-variant line-clamp-2">{t.body}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDismiss(t.id)
            }}
            className="p-1 rounded-lg hover:bg-surface-container text-outline flex-shrink-0"
            aria-label="Tutup notifikasi"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      ))}
    </div>
  )
}

export default NotificationToasts
