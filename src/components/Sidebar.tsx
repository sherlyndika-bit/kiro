import React from 'react'

type PageType = 'dashboard' | 'chat-monitoring' | 'pipeline' | 'estimator' | 'ai-studio' | 'settings'

interface SidebarProps {
  currentPage: PageType
  onPageChange: (page: PageType) => void
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const menuItems: Array<{ id: PageType; icon: string; label: string }> = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'chat-monitoring', icon: 'chat', label: 'Active Chats' },
    { id: 'pipeline', icon: 'groups', label: 'Client Database' },
    { id: 'estimator', icon: 'calculate', label: 'AI Estimator' },
    { id: 'ai-studio', icon: 'auto_awesome', label: 'AI Studio' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ]

  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant flex flex-col p-md z-50">
      {/* Header */}
      <div className="mb-xl">
        <h1 className="font-headline-md text-headline-md font-bold text-primary">Sudut Ruang</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">AI Operator</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-base">
        {menuItems.map((item) => {
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
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
  )
}

export default Sidebar
