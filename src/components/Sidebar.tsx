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
}

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  isMobileOpen,
  onMobileClose,
}) => {
  const menuItems: Array<{ id: PageType; icon: string; label: string }> = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'chat-monitoring', icon: 'chat', label: 'Active Chats' },
    { id: 'pipeline', icon: 'groups', label: 'Client Database' },
    { id: 'estimator', icon: 'calculate', label: 'AI Estimator' },
    { id: 'ai-studio', icon: 'auto_awesome', label: 'AI Studio' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ]

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
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant flex flex-col p-md z-50 transition-transform duration-300 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="mb-xl flex items-start justify-between">
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">
              Sudut Ruang
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">AI Operator</p>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={onMobileClose}
            className="md:hidden -mr-2 p-2 rounded-lg hover:bg-surface-container text-on-surface-variant"
            aria-label="Tutup menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-base">
          {menuItems.map((item) => {
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-sm px-sm py-md rounded-lg transition-all duration-200 active:scale-[0.98] ${
                  isActive
                    ? 'text-primary font-bold border-r-2 border-primary bg-surface-container'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className="font-body-md">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Status */}
        <div className="mt-auto p-sm bg-surface-container rounded-lg border border-outline-variant flex items-center gap-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
            System Status: Active
          </span>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
