import React, { useEffect, useRef, useState } from 'react'
import { AppNotification } from '../types/notification'
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
} from '../services/notify'

interface TopBarProps {
  title: string
  onMobileMenuClick: () => void
  onSearch?: (query: string) => void
  notifications: AppNotification[]
  onOpenConversation: (conversationId: string) => void
  onMarkAllRead: () => void
  onClearNotifications: () => void
}

const timeAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins}m lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}j lalu`
  return `${Math.floor(hours / 24)}h lalu`
}

const TopBar: React.FC<TopBarProps> = ({
  title,
  onMobileMenuClick,
  onSearch,
  notifications,
  onOpenConversation,
  onMarkAllRead,
  onClearNotifications,
}) => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [perm, setPerm] = useState<NotificationPermission>(notificationPermission())
  const panelRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    onSearch?.(query.trim())
  }

  const enableBrowserNotif = async () => {
    const p = await requestNotificationPermission()
    setPerm(p)
  }

  return (
    <header className="sticky top-0 z-30 h-14 px-sm md:px-md bg-surface border-b border-outline-variant flex items-center gap-sm flex-shrink-0">
      <button
        onClick={onMobileMenuClick}
        className="md:hidden p-2 -ml-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
        aria-label="Buka menu"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <h2 className="text-[16px] font-semibold text-on-surface truncate">{title}</h2>

      <div className="flex-1" />

      <form
        onSubmit={submitSearch}
        className="hidden lg:flex items-center gap-xs bg-background border border-outline-variant rounded-lg px-3 py-2 w-56 focus-within:border-brand-accent transition-colors"
      >
        <span className="material-symbols-outlined text-outline text-[18px]">search</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari percakapan..."
          className="bg-transparent border-none outline-none text-[13px] text-on-surface w-full placeholder:text-outline"
        />
      </form>

      {/* Notifications */}
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-9 h-9 rounded-lg border border-outline-variant bg-surface hover:bg-background flex items-center justify-center text-on-surface-variant relative"
          aria-label="Notifikasi"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-coral text-white text-[10px] font-bold rounded-full border-2 border-surface flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-surface border border-outline-variant rounded-2xl shadow-soft-md overflow-hidden animate-slide-up z-50">
            <div className="flex items-center justify-between px-md py-sm border-b border-outline-variant">
              <h3 className="text-[14px] font-semibold">Notifikasi</h3>
              {notifications.length > 0 && (
                <div className="flex items-center gap-sm">
                  <button
                    onClick={onMarkAllRead}
                    className="text-[12px] font-semibold text-brand-mid hover:underline"
                  >
                    Tandai dibaca
                  </button>
                  <button
                    onClick={onClearNotifications}
                    className="text-[12px] font-semibold text-outline hover:underline"
                  >
                    Bersihkan
                  </button>
                </div>
              )}
            </div>

            {notificationsSupported() && perm !== 'granted' && (
              <button
                onClick={enableBrowserNotif}
                className="w-full flex items-center gap-xs px-md py-2 bg-brand-soft text-brand-mid text-[12.5px] font-semibold hover:bg-brand-soft/70 border-b border-outline-variant"
              >
                <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                Aktifkan notifikasi pop-up browser
              </button>
            )}

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="text-center py-xl text-outline">
                  <span className="material-symbols-outlined text-4xl">notifications_off</span>
                  <p className="text-body-md mt-2">Belum ada notifikasi</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setOpen(false)
                      onOpenConversation(n.conversationId)
                    }}
                    className={`w-full text-left flex items-start gap-sm px-md py-3 border-b border-outline-variant/60 last:border-0 hover:bg-background transition-colors ${
                      n.read ? '' : 'bg-brand-soft/40'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-brand-soft flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-brand-mid text-[20px]">chat</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold text-on-surface truncate">{n.title}</p>
                        <span className="text-[11px] text-outline flex-shrink-0">{timeAgo(n.time)}</span>
                      </div>
                      <p className="text-[12.5px] text-on-surface-variant line-clamp-2">{n.body}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-brand-accent mt-1.5 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-[12px] font-semibold text-white">
        SR
      </div>
    </header>
  )
}

export default TopBar
