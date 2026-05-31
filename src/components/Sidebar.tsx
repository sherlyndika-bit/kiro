import React, { useEffect } from 'react'

type PageType =
  | 'dashboard'
  | 'chat-monitoring'
  | 'pipeline'
  | 'estimator'
  | 'ai-studio'
  | 'settings'

interface SidebarProps {
  currentPage: PageType
  onPageChange: (page: PageType) => void
  /** Whether the mobile drawer is currently open (md and below) */
  isMobileOpen: boolean
  /** Closes the mobile drawer */
  onMobileClose: () => void
  /** Optional unread badge for the chat menu item */
  chatBadge?: number
  /** Email of the logged-in operator */
  userEmail?: string
  /** Logout handler */
  onLogout?: () => void
  /** Optional company logo (data URL) */
  logo?: string
}

interface MenuItem {
  id: PageType
  icon: string
  label: string
  badgeKey?: 'chat'
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const sections: MenuSection[] = [
  {
    title: 'Utama',
    items: [
      { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
      { id: 'chat-monitoring', icon: 'forum', label: 'Active Chats', badgeKey: 'chat' },
      { id: 'pipeline', icon: 'groups', label: 'Client CRM' },
    ],
  },
  {
    title: 'AI Tools',
    items: [
      { id: 'estimator', icon: 'calculate', label: 'AI Estimator' },
      { id: 'ai-studio', icon: 'auto_awesome', label: 'AI Studio' },
    ],
  },
  {
    title: 'Lainnya',
    items: [{ id: 'settings', icon: 'settings', label: 'Pengaturan' }],
  },
]

const BrandMark: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M2 18L10 2L18 18"
      stroke="#3DB87A"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M5 13H15" stroke="#3DB87A" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  isMobileOpen,
  onMobileClose,
  chatBadge = 0,
  userEmail,
  onLogout,
  logo,
}) => {
  // Close drawer on Escape (mobile)
  useEffect(() => {
    if (!isMobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMobileOpen, onMobileClose])

  // Lock body scroll when drawer open
  useEffect(() => {
    if (isMobileOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [isMobileOpen])

  const handleSelect = (id: PageType) => {
    onPageChange(id)
    onMobileClose()
  }

  return (
    <>
      {/* Backdrop (mobile only) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-brand-dark/50 z-40 md:hidden backdrop-blur-[1px]"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-[264px] bg-brand flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-md py-md flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-sm min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-accent/15 border border-brand-accent/25 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <BrandMark />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-serif-display text-[18px] text-white leading-none truncate">
                Sudut Ruang
              </h1>
              <span className="text-[10px] text-white/40 tracking-wide">AI Ecosystem</span>
            </div>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={onMobileClose}
            className="md:hidden -mr-1 p-2 rounded-lg hover:bg-white/10 text-white/70"
            aria-label="Tutup menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-sm">
          {sections.map((section) => (
            <div key={section.title} className="mb-1">
              <p className="px-md pt-md pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">
                {section.title}
              </p>
              {section.items.map((item) => {
                const isActive = currentPage === item.id
                const badge = item.badgeKey === 'chat' ? chatBadge : 0
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`relative w-full flex items-center gap-sm px-md py-2.5 text-[13px] font-medium transition-colors ${
                      isActive
                        ? 'text-white bg-brand-accent/12'
                        : 'text-white/55 hover:text-white/90 hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-accent rounded-r" />
                    )}
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        isActive ? 'text-brand-accent fill' : 'opacity-70'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {badge > 0 && (
                      <span className="ml-auto bg-brand-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer: status + user */}
        <div className="border-t border-white/10 p-md space-y-sm">
          <div className="flex items-center gap-xs">
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
              System Active
            </span>
          </div>
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0">
              {(userEmail || 'SR').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white/85 truncate">Admin Studio</p>
              <p className="text-[11px] text-white/40 truncate">{userEmail || 'Owner'}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-white/45 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Keluar"
              title="Keluar"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
